// 오늘 뭐먹지 — sitemap.xml 자동 생성
// Supabase의 모든 레시피 + 주요 정적 페이지를 sitemap으로 만들어,
// 서치콘솔·네이버 서치어드바이저에 제출할 수 있게 합니다.

const SB_URL = "https://jnwlaevfvhxpmmnkmyrw.supabase.co";
const SB_KEY = "sb_publishable_9yGKdu0Sh_hsboktuwYJhw_RQCu0W35";
const SITE = "https://todaymeal.co.kr";

export default async function handler(req, res) {
  let recipes = [];
  try {
    const url = `${SB_URL}/rest/v1/recipes?select=id,created_at&order=created_at.desc&limit=5000`;
    const r = await fetch(url, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
    if(!r.ok)throw new Error("sitemap fetch failed");
    recipes = await r.json();
    if (!Array.isArray(recipes)) throw new Error("invalid sitemap response");
  } catch (e) {
    res.status(503).send("Sitemap temporarily unavailable");return;
  }

  const staticUrls = [
    { loc: `${SITE}/`, priority: "1.0" },
    { loc: `${SITE}/category.html`, priority: "0.8" },
    { loc: `${SITE}/category.html?sort=popular`, priority: "0.7" },
    { loc: `${SITE}/category.html?t=아이`, priority: "0.7" },
    { loc: `${SITE}/category.html?t=다이어트`, priority: "0.7" },
    { loc: `${SITE}/category.html?t=남편`, priority: "0.7" },
    { loc: `${SITE}/category.html?t=온 가족`, priority: "0.7" },
    { loc: `${SITE}/news.html`, priority: "0.6" },
    { loc: `${SITE}/privacy.html`, priority: "0.3" },
  ];

  const xmlEscape=value=>String(value).replace(/[&<>"\']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","\'":"&apos;"}[c]));
  const recipeUrls = recipes.map(
    (r) => `  <url>\n    <loc>${SITE}/r/${xmlEscape(r.id)}</loc>\n    <lastmod>${!isNaN(Date.parse(r.created_at))?new Date(r.created_at).toISOString().slice(0,10):new Date().toISOString().slice(0,10)}</lastmod>\n    <priority>0.6</priority>\n  </url>`
  );

  const staticXml = staticUrls.map(
    (u) => `  <url>\n    <loc>${xmlEscape(u.loc)}</loc>\n    <priority>${u.priority}</priority>\n  </url>`
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticXml.join("\n")}
${recipeUrls.join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=1800, stale-while-revalidate=7200");
  res.status(200).send(xml);
}
