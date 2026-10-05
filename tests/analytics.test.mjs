import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { truncateIp, isBot, parseUa, isPageView, source, record, prune, stats } from '../worker/analytics.js';

// A D1-shaped wrapper around node's SQLite, with the real migration applied.
async function d1() {
  const db = new DatabaseSync(':memory:');
  db.exec(await readFile(new URL('../worker/migrations/0001_visits.sql', import.meta.url), 'utf8'));
  const prepare = sql => {
    let args = [];
    const st = { bind: (...a) => { args = a; return st; },
      run: async () => { db.prepare(sql).run(...args); return {}; },
      first: async () => db.prepare(sql).get(...args) ?? null,
      all: async () => ({ results: db.prepare(sql).all(...args) }) };
    return st;
  };
  return { raw: db, prepare, batch: async sts => Promise.all(sts.map(s => s.all())) };
}

const IPHONE_WECHAT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.50';
const page = (headers = {}, url = 'https://workout.postagi.co.uk/') => {
  const r = new Request(url, { headers: { accept: 'text/html', 'sec-fetch-dest': 'document', 'user-agent': IPHONE_WECHAT, ...headers } });
  return r;
};

test('IP addresses are kept only with their last part zeroed', () => {
  assert.equal(truncateIp('203.0.113.77'), '203.0.113.0');
  assert.equal(truncateIp('2001:db8:85a3:8d3:1319:8a2e:370:7348'), '2001:db8:85a3::');
  assert.equal(truncateIp('2001:db8::1'), '2001:db8::');
  assert.equal(truncateIp(''), null);
});

test('browsers, systems and devices are recognised, and bots are flagged', () => {
  assert.deepEqual(parseUa(IPHONE_WECHAT), { browser: 'WeChat', os: 'iOS', device: 'mobile' });
  assert.deepEqual(parseUa('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36 Edg/140.0'), { browser: 'Edge', os: 'Windows', device: 'desktop' });
  assert.deepEqual(parseUa('Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36'), { browser: 'Chrome', os: 'Android', device: 'tablet' });
  assert.ok(isBot('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'));
  assert.ok(isBot('curl/8.7.1'));
  assert.ok(isBot(''));
  assert.ok(!isBot(IPHONE_WECHAT));
});

test('only a browser opening the page counts as a view', () => {
  assert.ok(isPageView(page()));
  assert.ok(isPageView(page({}, 'https://workout.postagi.co.uk/index.html?ref=wechat')));
  assert.ok(!isPageView(page({ 'sec-fetch-dest': 'empty' })));
  assert.ok(!isPageView(page({}, 'https://workout.postagi.co.uk/audio/count-cycle-en.wav')));
  assert.ok(!isPageView(new Request('https://workout.postagi.co.uk/', { method: 'HEAD' })));
});

test('the source is the referring site or a ?ref= tag, never this site', () => {
  assert.equal(source(page({ referer: 'https://www.google.com/search?q=x' })), 'google.com');
  assert.equal(source(page({ referer: 'https://workout.postagi.co.uk/#library' })), null);
  assert.equal(source(page({}, 'https://workout.postagi.co.uk/?utm_source=newsletter')), 'newsletter');
});

test('visits are stored without the full IP; visitors are counted per day and the salt is discarded', async () => {
  const db = await d1(), day = Date.UTC(2026, 9, 5, 10);
  const ip = { 'cf-connecting-ip': '198.51.100.23' };
  await record(page(ip), db, day);
  await record(page(ip), db, day + 36e5);
  await record(page({ 'cf-connecting-ip': '198.51.100.99' }), db, day + 2 * 36e5);
  await record(page({ ...ip, 'user-agent': 'Googlebot/2.1' }), db, day + 3 * 36e5);
  const rows = db.raw.prepare('SELECT * FROM visits ORDER BY ts').all();
  assert.equal(rows.length, 4);
  assert.ok(rows.every(r => !JSON.stringify(r).includes('198.51.100.23') && !JSON.stringify(r).includes('.99')), 'no full IP stored');
  assert.equal(rows[0].ip, '198.51.100.0');
  assert.equal(rows[0].visitor, rows[1].visitor, 'same person, same day');
  assert.notEqual(rows[0].visitor, rows[2].visitor, 'different address');
  assert.equal(rows[3].bot, 1);
  assert.equal(rows[0].visitor.length, 16);
  await prune(db, day + 864e5);
  assert.equal(db.raw.prepare('SELECT COUNT(*) AS n FROM salts').get().n, 0, "yesterday's salt is gone");
  // A new day gets a new salt, so the same person is a new hash.
  await record(page(ip), db, day + 864e5);
  const next = db.raw.prepare('SELECT visitor FROM visits ORDER BY ts DESC LIMIT 1').get().visitor;
  assert.notEqual(next, rows[0].visitor);
});

test('the dashboard numbers add up in the viewer time zone, with bots left out by default', async () => {
  const db = await d1(), now = Date.now();
  const ins = db.raw.prepare('INSERT INTO visits (ts, visitor, ip, country, city, ref, browser, os, device, lang, bot) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
  for (let i = 0; i < 40; i++) ins.run(now - i * 3 * 36e5, 'v' + (i % 7), '203.0.113.0', i % 3 ? 'CN' : 'GB', i % 3 ? 'Shenzhen' : 'London', i % 4 ? null : 'google.com', 'Safari', 'iOS', 'mobile', 'zh-CN', 0);
  ins.run(now - 1000, 'bot', null, 'US', null, null, 'Other', 'Other', 'desktop', null, 1);
  ins.run(now - 500 * 864e5, 'old', null, 'US', null, null, 'Other', 'Other', 'desktop', null, 0);
  const s = await stats(db, { days: 7, tz: 480, bots: false });
  assert.equal(s.range.views, 40);
  assert.equal(s.botViews, 1);
  assert.equal(s.all.views, 41);
  assert.equal(s.trend.reduce((a, r) => a + r.views, 0), 40);
  assert.ok(s.trend.length >= 5 && s.trend.length <= 6, 'daily buckets over 5 days: ' + s.trend.length);
  assert.equal(s.hours.reduce((a, r) => a + r.views, 0), 40);
  assert.deepEqual(s.country.map(r => [r.k, r.views]), [['CN', 26], ['GB', 14]]);
  assert.equal(s.ref.find(r => r.k === 'google.com').views, 10);
  assert.equal(s.recent.length, 40);
  assert.ok(s.today.views <= 8 && s.today.views >= 1);
  const withBots = await stats(db, { days: 7, tz: 480, bots: true });
  assert.equal(withBots.range.views, 41);
  const year = await stats(db, { days: 0, tz: 0, bots: false });
  assert.ok(year.trend.every(r => /^\d{4}-\d{2}$/.test(r.k)), 'monthly buckets for all time');
  const hours = await stats(db, { days: 1, tz: -300, bots: false });
  assert.ok(hours.trend.every(r => /^\d{4}-\d{2}-\d{2} \d{2}:00$/.test(r.k)), 'hourly buckets for 24 hours');
  await prune(db, now);
  assert.equal(db.raw.prepare("SELECT COUNT(*) AS n FROM visits WHERE visitor = 'old'").get().n, 0, 'visits older than 400 days are removed');
});
