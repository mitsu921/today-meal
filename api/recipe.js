// 오늘 뭐먹지 — 레시피 상세 페이지 서버 렌더링 (SEO용)
// 검색엔진 크롤러가 자바스크립트 없이도 레시피 내용을 그대로 읽을 수 있도록,
// 서버에서 완성된 HTML(+구조화 데이터)을 만들어 돌려줍니다.
// 경로: /r/[id] → vercel.json 리라이트로 이 함수와 연결됩니다.

const SB_URL = "https://jnwlaevfvhxpmmnkmyrw.supabase.co";
const SB_KEY = "sb_publishable_9yGKdu0Sh_hsboktuwYJhw_RQCu0W35";

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export default async function handler(req, res) {
  const id = String(req.query.id || "");
  if (!/^\d+$/.test(id)) {
    res.status(404).send("레시피를 찾을 수 없어요");
    return;
  }

  let recipe = null;
  try {
    const url = `${SB_URL}/rest/v1/recipes?id=eq.${id}&select=*,profiles(nickname),likes(count),comments(count)`;
    const r = await fetch(url, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, signal: AbortSignal.timeout(10000) });
    if(!r.ok)throw new Error("recipe fetch failed");
    const data = await r.json();
    recipe = Array.isArray(data) ? data[0] : null;
  } catch (e) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(503).send("잠시 후 다시 시도해주세요");return;
  }

  if (!recipe) {
    res.status(404).send("<!doctype html><html lang='ko'><head><meta charset='utf-8'><title>레시피를 찾을 수 없어요 - 오늘 뭐먹지</title></head><body><p>레시피를 찾을 수 없어요. <a href='/'>홈으로</a></p></body></html>");
    return;
  }

  const title = recipe.title || "레시피";
  const nickname = recipe.profiles ? recipe.profiles.nickname : "맘셰프";
  const likeCount = recipe.likes && recipe.likes[0] ? recipe.likes[0].count : 0;
  const cmtCount = recipe.comments && recipe.comments[0] ? recipe.comments[0].count : 0;
  const bodyText = recipe.body || "";
  const desc = bodyText.slice(0, 90).replace(/\n/g, " ") + (bodyText.length > 90 ? "…" : "");
  const img = recipe.image_url || "https://todaymeal.co.kr/og.jpg";
  const created = recipe.created_at && !isNaN(Date.parse(recipe.created_at)) ? new Date(recipe.created_at).toISOString() : undefined;

  // Parse explicit sections only; never label arbitrary prose as ingredients.
  const ingredients=[],instructions=[];
  let section='';
  for(const raw of bodyText.split('\n')){
    const line=raw.trim();if(!line)continue;
    if(/^[\[【]?\s*재료(?:\s|[·:：\]】]|$)/.test(line)){section='ingredients';continue;}
    if(/^[\[【]?\s*(만드는\s*법|조리\s*(방법|순서)|만들기)(?:\s|[:：\]】]|$)/.test(line)){section='steps';continue;}
    if(/^[\[【]|^(우리 집 팁|요리 팁|보관|주의|팁|AI 작성|사진|출처|운영자 확인)/.test(line)){section='';continue;}
    if(section==='ingredients')ingredients.push(line.replace(/^[-•·]\s*/,''));
    if(section==='steps')instructions.push({"@type":"HowToStep",text:line.replace(/^\d+[.)]\s*/, '')});
  }

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Recipe",
    name: title,
    image: [img],
    author: { "@type": "Person", name: nickname },
    datePublished: created,
    description: desc,
    ...(ingredients.length?{recipeIngredient:ingredients}:{}),
    ...(instructions.length?{recipeInstructions:instructions}:{}),
  };

  const schema = ingredients.length && instructions.length && recipe.image_url ? jsonLd : {"@context":"https://schema.org", "@type":"Article", headline:title, author:jsonLd.author, datePublished:created, description:desc};

  const nutriHtml = recipe.kcal
    ? `<div style="background:#f7f4ee;border-radius:11px;padding:14px;margin:16px 0"><b>AI 영양 분석</b> · ${recipe.kcal}kcal (탄 ${recipe.carb || 0}g · 단 ${recipe.protein || 0}g · 지 ${recipe.fat || 0}g)${recipe.nutri_note ? `<p style="margin:8px 0 0;color:#555">${esc(recipe.nutri_note)}</p>` : ""}</div>`
    : "";

  const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} - 오늘 뭐먹지</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="https://todaymeal.co.kr/r/${id}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)} - 오늘 뭐먹지">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:url" content="https://todaymeal.co.kr/r/${id}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/icon-192.png">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>
<style>
body{margin:0;background:#fffefc;color:#2b241d;font-family:Arial,"Noto Sans KR",sans-serif;line-height:1.75}
.wrap{max-width:720px;margin:auto;padding:24px}
.back{font-size:13px;font-weight:800;color:#e8703a}
h1{font-size:24px;margin:16px 0 8px}
.meta{font-size:13px;color:#8a7d67;margin-bottom:14px}
img.cover{width:100%;border-radius:16px;margin:10px 0}
.body{white-space:pre-wrap;font-size:15px}
.cta{display:block;text-align:center;margin-top:26px;padding:14px;background:#e8703a;color:#fff;border-radius:12px;font-weight:800;text-decoration:none}
a{color:#e8703a}
</style>
<link rel="stylesheet" href="/site-layout.css?v=20260930-1">
</head>
<body data-layout="detail">
<header class="tm-header"><div class="tm-header-inner"><a class="tm-brand" href="/" aria-label="TodayMeal 홈">TodayMeal</a><nav class="tm-nav" aria-label="주 메뉴"><a id="nav-recipes" href="/category.html">레시피 탐색</a><a id="nav-kids" href="/kids.html">아이와 요리</a><a id="nav-learn" href="/learn.html">요리 배우기</a><a id="nav-stories" href="/stories.html">식생활 이야기</a><a id="nav-saved" href="/saved.html">저장한 레시피</a></nav><div class="tm-actions"><a class="tm-write" href="/#write">레시피 올리기</a><a class="tm-app" href="/app/">앱 열기 ↗</a></div></div></header>
<main class="wrap">
  <a class="back" href="/category.html">‹ 레시피 목록으로</a>
  <h1>${esc(title)}</h1>
  <div class="meta">${esc(nickname)} · ${created ? new Date(created).toLocaleDateString("ko-KR") : "작성일 미표시"} · ♥ ${likeCount} 추천 · 💬 ${cmtCount}</div>
  ${img ? `<img class="cover" src="${esc(img)}" alt="${esc(title)}">` : ""}
  ${nutriHtml}
  <div class="body">${esc(bodyText)}</div>
  <p><a href="/editorial.html">콘텐츠·사진 안내</a> · <a href="/contact.html">이 레시피 오류 제보</a></p>
  <a class="cta" href="/app/">📱 앱에서 이 레시피에 추천·댓글 남기기</a>
</main>
<nav class="trust-links" aria-label="사이트 안내"><a href="/about.html">서비스 소개</a><a href="/editorial.html">콘텐츠 안내</a><a href="/contact.html">문의·오류 제보</a><a href="/recipe-library">전체 레시피 목록</a></nav>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
  res.status(200).send(html);
}
