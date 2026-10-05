// The site's Worker: serves the static page and notes page views (see analytics.js), and serves the
// visitor dashboard at /stats. The dashboard page is public but empty; its data needs STATS_KEY.
import { isPageView, record, prune, stats } from './analytics.js';
import dashboard from './stats.html';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

async function authorised(request, env) {
  const given = (request.headers.get('authorization') || '').replace(/^Bearer /, '');
  if (!env.STATS_KEY || !given) return false;
  // Compare digests so the check takes the same time whatever the guess.
  const digest = s => crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  const [a, b] = await Promise.all([digest(given), digest(env.STATS_KEY)]);
  return crypto.subtle.timingSafeEqual(a, b);
}

export default {
  async fetch(request, env, ctx) {
    const { pathname, searchParams } = new URL(request.url);
    if (pathname === '/stats' || pathname === '/stats/') {
      return new Response(dashboard, { headers: {
        'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store',
        'x-robots-tag': 'noindex', 'referrer-policy': 'no-referrer',
      } });
    }
    if (pathname === '/stats/api') {
      if (!(await authorised(request, env))) return json({ error: 'unauthorised' }, 401);
      const days = Number(searchParams.get('days')) || 0;
      const tz = Math.max(-840, Math.min(840, Number(searchParams.get('tz')) || 0));
      return json(await stats(env.DB, { days, tz, bots: searchParams.get('bots') === '1' }));
    }
    if (isPageView(request)) ctx.waitUntil(record(request, env.DB).catch(e => console.error('visit not recorded', e)));
    return env.ASSETS.fetch(request);
  },
  async scheduled(event, env) {
    await prune(env.DB);
  },
};
