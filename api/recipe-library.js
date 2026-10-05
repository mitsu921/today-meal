// Public, server-rendered index. Uses only the existing public database key/RLS.
const SB_URL='https://jnwlaevfvhxpmmnkmyrw.supabase.co';
const SB_KEY='sb_publishable_9yGKdu0Sh_hsboktuwYJhw_RQCu0W35';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const imageUrl=s=>{try{const u=new URL(s);return u.protocol==='https:'?u.href:'';}catch{return '';}};
export default async function handler(req,res){
 const raw=String(req.query?.page??'1');
 if(!/^[1-9]\d{0,3}$/.test(raw)){res.status(404).send('페이지를 찾을 수 없습니다.');return;}
 const page=Number(raw),size=24,offset=(page-1)*size;
 let rows;
 try{
  const reply=await fetch(`${SB_URL}/rest/v1/recipes?select=id,title,body,target,image_url&order=id.desc&offset=${offset}&limit=${size+1}`,{headers:{apikey:SB_KEY,Authorization:`Bearer ${SB_KEY}`},signal:AbortSignal.timeout(10000)});
  if(!reply.ok)throw Error('fetch');
  rows=await reply.json();if(!Array.isArray(rows))throw Error('shape');
 }catch{
  res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');
  res.status(503).send('<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>목록을 잠시 불러오지 못했습니다 | TodayMeal</title><main><h1>목록을 잠시 불러오지 못했습니다</h1><p>잠시 후 다시 열어주세요. 기본 레시피는 계속 볼 수 있습니다.</p><a href="/kids.html">아이와 요리</a> · <a href="/learn.html">요리 배우기</a> · <a href="/">홈</a></main></html>');return;
 }
 if(page>1&&!rows.length){res.status(404).send('마지막 페이지를 넘었습니다.');return;}
 const next=rows.length>size;
 const cards=rows.slice(0,size).filter(r=>/^\d+$/.test(String(r.id))).map(r=>{const img=imageUrl(r.image_url);return `<article class="directory-card"><a href="/r/${r.id}">${img?`<img src="${esc(img)}" alt="${esc(r.title)}" loading="lazy">`:''}<h2>${esc(r.title||'레시피')}</h2></a><p>${esc(String(r.body||'').replace(/\s+/g,' ').slice(0,140))}</p><a href="/r/${r.id}">재료와 만드는 법 읽기 →</a></article>`;}).join('');
 const canonical='https://todaymeal.co.kr/recipe-library'+(page>1?'?page='+page:'');
 const output=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>전체 레시피 ${page}페이지 | TodayMeal</title><meta name="description" content="TodayMeal에 등록된 공개 레시피를 페이지별로 읽어보세요. 재료와 만드는 법은 로그인 없이 볼 수 있습니다."><link rel="canonical" href="${canonical}"><link rel="stylesheet" href="/site-layout.css?v=20261005"></head><body><header class="tm-header"><div class="tm-header-inner"><a class="tm-brand" href="/">TodayMeal</a><nav class="tm-nav" aria-label="주 메뉴"><a href="/category.html">레시피 탐색</a><a href="/kids.html">아이와 요리</a><a href="/learn.html">요리 배우기</a><a href="/stories.html">식생활 이야기</a><a href="/saved.html">저장한 레시피</a></nav><div class="tm-actions"><a class="tm-write" href="/#write">레시피 올리기</a><a class="tm-app" href="/app/">앱 열기 ↗</a></div></div></header><main class="directory-main"><h1>전체 레시피</h1><p>음식을 고르고, 필요한 재료와 만드는 순서를 읽어보세요. <a href="/category.html">이름·재료로 검색하기 →</a></p><p>${page}페이지</p><div class="directory-grid">${cards||'<p>공개 레시피가 아직 없습니다. <a href="/kids.html">아이와 만드는 기본 요리</a>를 둘러보세요.</p>'}</div><nav class="pager" aria-label="목록 페이지">${page>1?`<a rel="prev" href="/recipe-library${page===2?'':'?page='+(page-1)}">← 이전 페이지</a>`:''}${next?`<a rel="next" href="/recipe-library?page=${page+1}">다음 페이지 →</a>`:''}</nav></main><footer class="trust-links"><a href="/about.html">서비스 소개</a><a href="/editorial.html">콘텐츠 안내</a><a href="/contact.html">문의·오류 제보</a><a href="/privacy.html">개인정보처리방침</a><a href="/terms.html">이용약관</a></footer></body></html>`;
 res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','public, max-age=300, stale-while-revalidate=600');res.status(200).send(output);
}
