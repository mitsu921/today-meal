const SB_URL = 'https://jnwlaevfvhxpmmnkmyrw.supabase.co';
const SB_KEY = 'sb_publishable_9yGKdu0Sh_hsboktuwYJhw_RQCu0W35';
const SITE = 'https://todaymeal.co.kr';
const xmlEscape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;'}[c]));
module.exports = async function handler(req, res) {
  const ids = new Set();
  try {
    // Native import() can load this ESM manifest from a CommonJS Vercel function.
    const { PUBLIC_PATHS: STATIC_PATHS } = await import('../scripts/public-pages.mjs');
    // Small pages avoid the database's default response limit.
    for (let offset = 0; ; offset += 100) {
      const response = await fetch(`${SB_URL}/rest/v1/recipes?select=id&order=id.asc&limit=100&offset=${offset}`, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
        signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) throw new Error('Recipe fetch failed');
      const rows = await response.json();
      if (!Array.isArray(rows)) throw new Error('Invalid recipe response');
      for (const row of rows) {
        const id = String(row.id);
        if (!/^\d+$/.test(id)) throw new Error('Invalid recipe ID');
        ids.add(id);
      }
      if (ids.size > 49000) throw new Error('Sitemap index required');
      if (rows.length < 100) break;
    }
    const urls = [...STATIC_PATHS.map(path => SITE + path), ...[...ids].map(id => SITE + '/r/' + id)];
    // Omit lastmod: publication time is not the last modification time.
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map(url => `  <url><loc>${xmlEscape(url)}</loc></url>`).join('\n') + '\n</urlset>';
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=1800, stale-while-revalidate=7200');
    res.status(200).send(xml);
  } catch (error) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(503).send('Sitemap temporarily unavailable');
  }
}

