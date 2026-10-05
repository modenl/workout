// Visit logging without personal data. No cookies, no script in the page: the Worker notes each page
// load. The IP is kept only with its last part zeroed (203.0.113.0, 2001:db8:1::), and visitors are
// counted by a hash of IP + browser + a random salt that is replaced every UTC day and then deleted,
// so a hash cannot be traced back to an address or followed from one day to the next.

// Tables: worker/migrations/0001_visits.sql.
export const KEEP_DAYS = 400;

export function truncateIp(ip) {
  if (!ip) return null;
  if (ip.includes('.') && !ip.includes(':')) return ip.split('.').slice(0, 3).concat('0').join('.');
  const head = ip.split('::')[0].split(':').filter(Boolean).slice(0, 3);
  return head.length ? head.join(':') + '::' : null;
}

const BOT = /bot|crawl|spider|slurp|fetch|preview|scan|monitor|lighthouse|headless|phantom|python|curl|wget|httpclient|okhttp|go-http|java\/|axios|node-fetch|facebookexternalhit|embedly|whatsapp|telegram/i;
export const isBot = ua => !ua || BOT.test(ua);

export function parseUa(ua = '') {
  const browser =
    /MicroMessenger/i.test(ua) ? 'WeChat' :
    /\bQQ\//i.test(ua) ? 'QQ' :
    /UCBrowser/i.test(ua) ? 'UC' :
    /HuaweiBrowser/i.test(ua) ? 'Huawei' :
    /MiuiBrowser|XiaoMi/i.test(ua) ? 'Xiaomi' :
    /SamsungBrowser/i.test(ua) ? 'Samsung' :
    /Edg(e|A|iOS)?\//.test(ua) ? 'Edge' :
    /OPR\/|Opera/.test(ua) ? 'Opera' :
    /Firefox\/|FxiOS/.test(ua) ? 'Firefox' :
    /Chrome\/|CriOS/.test(ua) ? 'Chrome' :
    /Safari\//.test(ua) ? 'Safari' : 'Other';
  const os =
    /HarmonyOS|OpenHarmony/i.test(ua) ? 'HarmonyOS' :
    /iPhone|iPod/.test(ua) ? 'iOS' :
    /iPad/.test(ua) ? 'iPadOS' :
    /Android/.test(ua) ? 'Android' :
    /CrOS/.test(ua) ? 'ChromeOS' :
    /Windows/.test(ua) ? 'Windows' :
    /Mac OS X|Macintosh/.test(ua) ? 'macOS' :
    /Linux/.test(ua) ? 'Linux' : 'Other';
  const device =
    /iPad|Tablet/i.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua)) ? 'tablet' :
    /Mobi|iPhone|iPod|Android/i.test(ua) ? 'mobile' : 'desktop';
  return { browser, os, device };
}

/** A page view: a browser asking for the page itself (not audio, not a prefetch). */
export function isPageView(request) {
  if (request.method !== 'GET') return false;
  const path = new URL(request.url).pathname;
  if (path !== '/' && path !== '/index.html') return false;
  const dest = request.headers.get('sec-fetch-dest');
  if (dest) return dest === 'document';
  return (request.headers.get('accept') || '').includes('text/html');
}

export function source(request) {
  const url = new URL(request.url);
  const tag = url.searchParams.get('ref') || url.searchParams.get('utm_source');
  if (tag) return tag.slice(0, 60);
  try {
    const host = new URL(request.headers.get('referer')).hostname.replace(/^www\./, '');
    return host === url.hostname ? null : host;
  } catch { return null; }
}

const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
let cachedSalt = null;

async function todaysSalt(db, day) {
  if (cachedSalt?.day === day) return cachedSalt.value;
  const fresh = hex(crypto.getRandomValues(new Uint8Array(16)));
  await db.prepare('INSERT OR IGNORE INTO salts (day, value) VALUES (?, ?)').bind(day, fresh).run();
  const { value } = await db.prepare('SELECT value FROM salts WHERE day = ?').bind(day).first();
  cachedSalt = { day, value };
  return value;
}

export async function record(request, db, now = Date.now()) {
  const ua = request.headers.get('user-agent') || '';
  const ip = request.headers.get('cf-connecting-ip') || '';
  const cf = request.cf || {};
  const salt = await todaysSalt(db, new Date(now).toISOString().slice(0, 10));
  const visitor = hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + '|' + ip + '|' + ua))).slice(0, 16);
  const { browser, os, device } = parseUa(ua);
  const lang = (request.headers.get('accept-language') || '').split(',')[0].split(';')[0].trim().slice(0, 12) || null;
  await db.prepare('INSERT INTO visits (ts, visitor, ip, country, region, city, ref, browser, os, device, lang, bot) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
    .bind(now, visitor, truncateIp(ip), cf.country || null, cf.region || null, cf.city || null, source(request), browser, os, device, lang, isBot(ua) ? 1 : 0)
    .run();
}

/** Daily clean-up: yesterday's salt goes (its hashes can no longer be recomputed), old rows go. */
export async function prune(db, now = Date.now()) {
  await db.prepare('DELETE FROM salts WHERE day < ?').bind(new Date(now).toISOString().slice(0, 10)).run();
  await db.prepare('DELETE FROM visits WHERE ts < ?').bind(now - KEEP_DAYS * 864e5).run();
}

/** Everything the dashboard shows, in the viewer's time zone (offset in minutes east of UTC). */
export async function stats(db, { days, tz, bots }) {
  const off = Math.round(tz) * 60, now = Date.now();
  const local = `(ts / 1000 + ${off})`;
  const human = bots ? '' : 'AND bot = 0';
  const since = days ? now - days * 864e5 : 0;
  // Calendar periods in local time, for the four headline tiles.
  const nowLocal = new Date(now + off * 1000);
  const dayStart = Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth(), nowLocal.getUTCDate()) - off * 1000;
  const weekStart = dayStart - ((nowLocal.getUTCDay() + 6) % 7) * 864e5;
  const monthStart = Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth(), 1) - off * 1000;
  const period = start => `SELECT COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors FROM visits WHERE ts >= ${start} ${human}`;
  const bucket = days === 1 ? `strftime('%Y-%m-%d %H:00', ${local}, 'unixepoch')`
    : !days || days > 120 ? `strftime('%Y-%m', ${local}, 'unixepoch')`
    : days > 31 ? `date(${local}, 'unixepoch', 'weekday 0', '-6 days')`
    : `date(${local}, 'unixepoch')`;
  const where = `WHERE ts >= ${since} ${human}`;
  const top = col => `SELECT ${col} AS k, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors FROM visits ${where} GROUP BY ${col} ORDER BY views DESC LIMIT 12`;
  const q = {
    today: period(dayStart), week: period(weekStart), month: period(monthStart), all: period(0),
    range: `SELECT COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors FROM visits ${where}`,
    botViews: `SELECT COUNT(*) AS n FROM visits WHERE ts >= ${since} AND bot = 1`,
    first: `SELECT MIN(ts) AS ts FROM visits`,
    trend: `SELECT ${bucket} AS k, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors FROM visits ${where} GROUP BY k ORDER BY k`,
    hours: `SELECT CAST(strftime('%w', ${local}, 'unixepoch') AS INTEGER) AS wd, CAST(strftime('%H', ${local}, 'unixepoch') AS INTEGER) AS h, COUNT(*) AS views FROM visits ${where} GROUP BY wd, h`,
    country: top('country'), city: top(`city || '|' || COALESCE(country, '')`), ref: top('ref'),
    browser: top('browser'), os: top('os'), device: top('device'), lang: top('lang'),
    recent: `SELECT ts, ip, country, region, city, ref, browser, os, device, lang, bot FROM visits WHERE ts >= ${since} ${human} ORDER BY ts DESC LIMIT 100`,
  };
  const names = Object.keys(q);
  const results = await db.batch(names.map(n => db.prepare(q[n])));
  const out = { now, days, tz, starts: { today: dayStart, week: weekStart, month: monthStart } };
  names.forEach((n, i) => {
    const rows = results[i].results;
    out[n] = ['today', 'week', 'month', 'all', 'range'].includes(n) ? rows[0]
      : n === 'botViews' ? rows[0].n : n === 'first' ? rows[0].ts : rows;
  });
  return out;
}
