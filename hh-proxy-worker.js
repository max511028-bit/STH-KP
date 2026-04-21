/**
 * Cloudflare Worker — HH.ru API proxy
 * Deployment instructions:
 *   1. Go to https://dash.cloudflare.com → Workers & Pages → Create application → Create Worker
 *   2. Replace the default code with this file's content
 *   3. Click "Deploy"
 *   4. Copy the Worker URL (e.g. https://hh-proxy.YOUR-NAME.workers.dev)
 *   5. Paste it into the КП Calculator app settings
 */

const ALLOWED_PATHS = ['/vacancies', '/suggests/areas'];

export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const url = new URL(request.url);
    const targetPath = url.pathname + url.search;

    // Security: only proxy allowed HH.ru paths
    const isAllowed = ALLOWED_PATHS.some(p => targetPath.startsWith(p));
    if (!isAllowed) {
      return new Response(JSON.stringify({ error: 'Path not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const hhUrl = `https://api.hh.ru${targetPath}`;

    try {
      const response = await fetch(hhUrl, {
        headers: {
          'HH-User-Agent': 'STH-KP-Calculator/1.0 (info@sth-corp.ru)',
          'User-Agent': 'STH-KP-Calculator/1.0 (info@sth-corp.ru)',
          'Accept': 'application/json',
        },
      });

      const body = await response.text();

      return new Response(body, {
        status: response.status,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600', // cache 1 hour
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  },
};
