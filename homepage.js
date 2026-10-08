
const SB_URL="https://jnwlaevfvhxpmmnkmyrw.supabase.co";
const SB_KEY="sb_publishable_9yGKdu0Sh_hsboktuwYJhw_RQCu0W35";
const PROXY_URL="/api/menu";
const $=s=>document.querySelector(s);
let sb=null, me=null, myNick="", feedData=[], authMode="login", wTarget="온 가족", wFile=null;

let tm;function toast(m){const e=$('#toast');e.textContent=m;e.classList.add('on');clearTimeout(tm);tm=setTimeout(()=>e.classList.remove('on'),1700)}
function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function likeCount(r){return r.likes&&r.likes[0]?r.likes[0].count:0}
function cmtCount(r){return r.comments&&r.comments[0]?r.comments[0].count:0}

const isSavedPage=document.body.dataset.page==='saved';
let homeQuery=new URLSearchParams(location.search).get('q')||'', homeCategory='전체', homeIngredient='', savedOnly=isSavedPage, homeLoaded=false, homeFailed=false, rouletteBusy=false, lastChoice='';
let homeSaved=[];try{const x=JSON.parse(localStorage.getItem('todaymeal-home-saved-v1')||'[]');if(Array.isArray(x))homeSaved=x.filter(v=>typeof v==='string');}catch(e){}
const normalizeHome=s=>String(s||'').replace(/달걀/g,'계란').replace(/쇠고기/g,'소고기').replace(/\s/g,'').toLowerCase();
function homeCategoryOf(r){const t=r.title||'';if(/국|찌개|탕|전골/.test(t))return '국·찌개';if(/밥|면|국수|파스타|우동|수제비/.test(t))return '밥·면';if(/쿠키|빵|케이크|토스트|샌드위치|떡|팬케이크|간식/.test(t))return '간식';return '반찬';}
function filteredHome(){return feedData.filter(r=>{const text=normalizeHome([r.title,r.body,r.target].join(' '));return (!homeQuery||text.includes(normalizeHome(homeQuery)))&&(!homeIngredient||text.includes(normalizeHome(homeIngredient)))&&(homeCategory==='전체'||homeCategoryOf(r)===homeCategory)&&(!savedOnly||homeSaved.includes(String(r.id)));});}
function safeHomePhoto(url){try{const u=new URL(url,location.origin);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch(e){return '';}}
function homeImage(r){const src=r.image_url&&safeHomePhoto(r.image_url);return src?'<img src="'+esc(src)+'" alt="'+esc(r.title)+'" loading="lazy">':'<span class="photo-placeholder">사진 준비 중</span>';}
const initialRecipeMarkup=$('#recipes')?.dataset.staticRecipes?$('#recipes').innerHTML:'';
function feedError(){if(initialRecipeMarkup&&!isSavedPage&&!homeLoaded){homeFailed=true;$('#recipes').setAttribute('aria-busy','false');$('#recipes').innerHTML=initialRecipeMarkup+'<div class="empty-state">최신 목록을 불러오지 못했어요. 위 레시피는 바로 열어볼 수 있어요.<br><button id="retry-home">다시 불러오기</button></div>';$('#retry-home').onclick=()=>loadFeed();return;}homeFailed=true;homeLoaded=false;$('#recipes').setAttribute('aria-busy','false');$('#recipes').innerHTML='<div class="empty-state">레시피를 불러오지 못했어요.<br><button id="retry-home">다시 불러오기</button></div>';$('#retry-home').onclick=()=>loadFeed();}
async function loadFeed(){
 if(document.body.dataset.writer==='kids')return;
 if(!sb){feedError();return;}homeFailed=false;$('#recipes').setAttribute('aria-busy','true');
 try{let rows=[];for(let start=0;;start+=100){const {data,error}=await sb.from('recipes').select('id,title,body,target,image_url,created_at,likes(count),comments(count)').order('created_at',{ascending:false}).order('id',{ascending:false}).range(start,start+99);if(error)throw error;rows.push(...(data||[]));if(!data||data.length<100)break;}
 feedData=rows;homeLoaded=true;renderCards();}catch(e){feedError();}
}
function renderCards(){
 const rows=filteredHome();const el=$('#recipes');el.setAttribute('aria-busy','false');
 $('#recipes-heading').textContent=savedOnly?'저장한 레시피':(homeQuery||homeCategory!=='전체'||homeIngredient?'검색한 레시피':'오늘 둘러볼 레시피');
 $('#search-status').textContent=(homeQuery?'“'+homeQuery+'” · ':'')+rows.length+'개의 레시피'+(savedOnly?' · 이 브라우저에 저장돼요':'');
 el.innerHTML=rows.map(r=>'<article class="recipe-row"><a class="recipe-photo" href="/r/'+encodeURIComponent(r.id)+'">'+homeImage(r)+'</a><div class="recipe-copy"><a href="/r/'+encodeURIComponent(r.id)+'"><h3>'+esc(r.title)+'</h3></a><p>'+(r.body?.includes('\n[아이와 요리]\n')?'<span class="kids-activity-badge">아이와 함께 만들기</span>':esc(r.target||'집에서 만드는 한 끼'))+'</p><small>'+esc(homeCategoryOf(r))+' · 추천 '+likeCount(r)+'</small></div><button class="bookmark '+(homeSaved.includes(String(r.id))?'is-saved':'')+'" data-save="'+esc(r.id)+'" aria-label="'+esc(r.title)+' 저장" aria-pressed="'+homeSaved.includes(String(r.id))+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg></button></article>').join('')||'<div class="empty-state">'+(savedOnly?'저장한 레시피가 없어요. 레시피 옆 저장 버튼을 눌러보세요.':'조건에 맞는 레시피가 없어요. 다른 재료로 찾아보세요.')+'<br><button id="clear-home">전체 레시피 보기</button></div>';
 el.querySelectorAll('img').forEach(img=>img.onerror=()=>{const span=document.createElement('span');span.className='photo-placeholder';span.textContent='사진 준비 중';img.replaceWith(span);});
 el.querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>{const id=b.dataset.save;homeSaved=homeSaved.includes(id)?homeSaved.filter(x=>x!==id):[...homeSaved,id];try{localStorage.setItem('todaymeal-home-saved-v1',JSON.stringify(homeSaved));}catch(e){toast('브라우저 저장이 제한되어 이번 화면에서만 보관돼요.');}renderCards();});
 if($('#clear-home'))$('#clear-home').onclick=()=>{if(isSavedPage)location.href='/';else resetHome();};
 if($('#scroll-hint'))$('#scroll-hint').hidden=isSavedPage||rows.length<4;
}
function updateHome(){if(homeLoaded)renderCards();$('#recipes').scrollTop=0;}
function resetHome(){homeQuery='';homeCategory='전체';homeIngredient='';savedOnly=isSavedPage;$('#search-input').value='';$('#ingredient-filter').value='';document.querySelectorAll('[data-category]').forEach(b=>{b.classList.toggle('selected',b.dataset.category==='전체');b.setAttribute('aria-pressed',b.dataset.category==='전체');});updateHome();}
$('#recipe-search').onsubmit=e=>{e.preventDefault();homeQuery=$('#search-input').value.trim();savedOnly=isSavedPage;updateHome();};
$('#search-input').addEventListener('search',()=>{homeQuery=$('#search-input').value.trim();updateHome();});
document.querySelectorAll('[data-keyword]').forEach(b=>b.onclick=()=>{resetHome();homeQuery=b.dataset.keyword;$('#search-input').value=homeQuery;updateHome();$('#community').scrollIntoView({behavior:'smooth',block:'start'});});
document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{homeCategory=b.dataset.category;document.querySelectorAll('[data-category]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',x===b);});updateHome();});
$('#ingredient-filter').onchange=e=>{homeIngredient=e.target.value;updateHome();};
const rouletteDialog=$('#roulette-dialog');
rouletteDialog.innerHTML='<button class="dialog-close" data-close aria-label="닫기">×</button><span class="roulette-eyebrow">오늘의 메뉴 룰렛</span><h2 id="roulette-title">오늘 뭐 먹지?</h2><p class="roulette-intro">맛있는 고민은 잠시, 선택은 룰렛에게.</p><div class="roulette-stage"><span class="roulette-pointer" aria-hidden="true"></span><div class="roulette-rim"><div id="home-wheel" class="menu-wheel" aria-hidden="true"></div><div class="wheel-hub" aria-hidden="true"><span>오늘의</span><b>한 끼</b></div></div></div><div id="roulette-result" class="pick-result" aria-live="polite"><span class="pick-kicker">버튼을 눌러 오늘의 한 끼를 골라보세요</span><p>마음에 들면 레시피까지 바로 볼 수 있어요.</p></div><button id="spin-roulette" class="orange-button"><span aria-hidden="true">↻</span> 메뉴 골라보기</button><p class="roulette-footnote">등록된 레시피에서 후보를 무작위로 골라요.</p>';
function wheelShortTitle(title){const words=String(title||'메뉴').replace(/한\s*그릇|한\s*상|끓이기|만들기/g,'').trim().split(/\s+/);return words.at(-1)||'메뉴';}
let wheelCandidates=[],wheelAngle=0;
function prepareHomeWheel(){
 const list=feedData.filter(r=>feedData.length<2||String(r.id)!==lastChoice).slice();
 for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]];}
 wheelCandidates=list.slice(0,6);const wheel=$('#home-wheel');const n=wheelCandidates.length;wheelAngle=0;wheel.style.transform='rotate(0deg)';
 const colors=['#fff8ed','#ffddbb','#fff8ed','#ffddbb','#fff8ed','#ffddbb'];
 wheel.style.background=n?'conic-gradient('+wheelCandidates.map((r,i)=>colors[i]+' '+i*360/n+'deg '+(i+1)*360/n+'deg').join(',')+')':'#fff2df';
 wheel.innerHTML=wheelCandidates.map((r,i)=>{const angle=(i+.5)*360/n,rad=angle*Math.PI/180;const x=50+Math.sin(rad)*33,y=50-Math.cos(rad)*33;const src=r.image_url&&safeHomePhoto(r.image_url);return '<span class="wheel-menu" style="left:'+x+'%;top:'+y+'%">'+(src?'<img src="'+esc(src)+'" alt="">':'<span class="wheel-menu-mark" aria-hidden="true">'+String(i+1).padStart(2,'0')+'</span>')+'<span class="wheel-menu-name" title="'+esc(r.title)+'">'+esc(wheelShortTitle(r.title))+'</span></span>';}).join('');
 wheel.querySelectorAll('img').forEach(img=>img.onerror=()=>{img.hidden=true;});
}
function openHomeWheel(){if(!rouletteBusy)prepareHomeWheel();rouletteDialog.showModal();}
$('#open-roulette').onclick=openHomeWheel;
$('#spin-roulette').onclick=async()=>{
 if(rouletteBusy)return;
 if(!homeLoaded){toast(homeFailed?'레시피를 다시 불러온 뒤 돌려주세요.':'레시피를 불러오는 중이에요. 잠시 후 돌려주세요.');return;}
 if(!feedData.length){$('#roulette-result').textContent='등록된 레시피가 아직 없어요.';return;}
 prepareHomeWheel();const idx=Math.floor(Math.random()*wheelCandidates.length),r=wheelCandidates[idx];
 const target=1440+360-(idx+.5)*360/wheelCandidates.length;
 rouletteBusy=true;const btn=$('#spin-roulette');btn.disabled=true;btn.textContent='오늘의 메뉴를 고르고 있어요…';
 $('#roulette-result').innerHTML='<span class="pick-kicker">두근두근, 오늘의 한 끼는?</span><p>룰렛이 멈추면 메뉴를 확인할 수 있어요.</p>';
 const wheel=$('#home-wheel');const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 try{
  if(!reduced&&typeof wheel.animate==='function'){const animation=wheel.animate([{transform:'rotate(0deg)'},{transform:'rotate('+target+'deg)'}],{duration:2400,easing:'cubic-bezier(.16,.65,.12,1)',fill:'forwards'});await animation.finished;wheel.style.transform='rotate('+target+'deg)';animation.cancel();}
  else{wheel.style.transform='rotate('+target+'deg)';if(!reduced)await new Promise(resolve=>setTimeout(resolve,2400));}
  wheelAngle=target;lastChoice=String(r.id);
  wheel.querySelectorAll(".wheel-menu").forEach((label,i)=>{label.style.transform="translate(-50%,-50%) rotate("+(-target)+"deg)";label.classList.toggle("chosen",i===idx);});
  const src=r.image_url&&safeHomePhoto(r.image_url);
  $('#roulette-result').innerHTML='<div class="picked-menu">'+(src?'<img class="picked-photo" src="'+esc(src)+'" alt="'+esc(r.title)+'">':'')+'<div><span class="pick-kicker">오늘의 메뉴로 어때요?</span><strong>'+esc(r.title)+'</strong><a class="result-link" href="/r/'+encodeURIComponent(r.id)+'">이 메뉴 만드는 법 <span aria-hidden="true">→</span></a></div></div>';
  const photo=$('#roulette-result img');if(photo)photo.onerror=()=>photo.remove();
 }finally{rouletteBusy=false;btn.disabled=false;btn.innerHTML='<span aria-hidden="true">↻</span> 다른 메뉴 골라보기';}
};

document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
document.querySelectorAll('.home-dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));

$('#search-input').value=homeQuery;
window.addEventListener('storage',e=>{if(e.key!=='todaymeal-home-saved-v1')return;try{const x=JSON.parse(e.newValue||'[]');homeSaved=Array.isArray(x)?x.filter(v=>typeof v==='string'):[];}catch(err){homeSaved=[];}if(homeLoaded)renderCards();});

/* ── 인증 ── */
async function ensureProfile(){
 if(!me||!sb)return;
 const {data}=await sb.from('profiles').select('nickname').eq('id',me.id).maybeSingle();
 if(data){myNick=data.nickname;}
 else{const meta=me.user_metadata||{}; myNick=meta.name||meta.preferred_username||(me.email||'').split('@')[0]||'맘셰프'; await sb.from('profiles').upsert({id:me.id,nickname:myNick});}
}
function renderAuthSlot(){
 const el=$('#auth-slot');
 if(me){ el.innerHTML='<a href="#" id="c-logout">'+esc(myNick)+'님</a>'; $('#c-logout').onclick=async(e)=>{e.preventDefault();await sb.auth.signOut();toast('로그아웃했어요');}; }
 else{ el.innerHTML='<a href="#" id="c-login-open">로그인</a>'; $('#c-login-open').onclick=(e)=>{e.preventDefault();$('#c-login-modal').classList.add('open');}; }
}
async function refreshAuth(){
 if(!sb){renderAuthSlot();return;}
 const {data:{session}}=await sb.auth.getSession();
 me=session?session.user:null;
 if(me)await ensureProfile();
 renderAuthSlot();
 renderPoints();
}
function watchAuth(){
 let authEventVersion=0;
 sb.auth.onAuthStateChange((ev,s)=>{
  const version=++authEventVersion;
  me=s?s.user:null;
  // Release Supabase's auth lock before calling other Supabase APIs.
  setTimeout(()=>{
   if(version!==authEventVersion)return;
   (async()=>{
  if(me)await ensureProfile();
  if(version!==authEventVersion)return;
  renderAuthSlot(); renderPoints();
  if(ev==='SIGNED_IN'){ if(location.search.includes('code='))history.replaceState(null,'',location.pathname); }
   })().catch(()=>{if(version===authEventVersion)toast('로그인은 확인됐지만 프로필을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');});
  },0);
 });
}
// Rebuild the shared login shell before attaching the existing auth handlers.
const loginModal=$('#c-login-modal');
loginModal.innerHTML=`<div class="c-sheet" role="dialog" aria-modal="true" aria-labelledby="login-heading" tabindex="-1">
<button class="c-close" id="c-login-close" aria-label="로그인 창 닫기" type="button">×</button>
<header class="login-heading"><span class="login-brand">TodayMeal</span><h2 id="login-heading">반가워요!</h2><p>맛있는 일상을 함께 기록해요.</p></header>
<button class="kakao-btn" id="c-kakao-btn" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3C6.5 3 2 6.5 2 10.8c0 2.8 1.9 5.2 4.8 6.6L6 21l4.4-2.5H12c5.5 0 10-3.5 10-7.7S17.5 3 12 3Z"/></svg>카카오로 계속하기</button>
<div class="login-divider"><span>또는 이메일로</span></div>
<div class="login-tabs" aria-label="계정 이용 방식"><button class="c-chip active" id="c-tab-login" type="button" aria-pressed="true">로그인</button><button class="c-chip" id="c-tab-signup" type="button" aria-pressed="false">회원가입</button></div>
<div id="c-nick-wrap" class="login-field" style="display:none"><label for="c-f-nick">닉네임</label><input class="c-input" id="c-f-nick" placeholder="사용할 이름" autocomplete="nickname"></div>
<div class="login-field"><label for="c-f-email">이메일</label><input class="c-input" id="c-f-email" type="email" placeholder="example@email.com" autocomplete="email" inputmode="email"></div>
<div class="login-field"><label for="c-f-pw">비밀번호</label><input class="c-input" id="c-f-pw" type="password" placeholder="비밀번호를 입력해주세요" autocomplete="current-password"></div>
<p id="c-auth-msg" role="status" aria-live="polite"></p><button class="cert" id="c-auth-go" type="button">로그인</button>
</div>`;
let loginReturnFocus=null,loginWasOpen=false;
new MutationObserver(()=>{const open=loginModal.classList.contains('open');if(open===loginWasOpen)return;loginWasOpen=open;if(open){loginReturnFocus=document.activeElement;$('#c-kakao-btn').focus();}else if(loginReturnFocus?.isConnected)loginReturnFocus.focus();}).observe(loginModal,{attributes:true,attributeFilter:['class']});
loginModal.addEventListener('click',event=>{if(event.target===loginModal)loginModal.classList.remove('open');});
loginModal.addEventListener('keydown',event=>{
 if(event.key==='Escape'){event.preventDefault();loginModal.classList.remove('open');return;}
 if(event.key==='Enter'&&event.target.matches('input')){event.preventDefault();$('#c-auth-go').click();}
 if(event.key==='Tab'){const items=[...loginModal.querySelectorAll('button,input')].filter(el=>!el.disabled&&el.getClientRects().length);const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
});
function setAuthMode(m){
 $('#c-tab-login').setAttribute('aria-pressed',String(m==='login'));
 $('#c-tab-signup').setAttribute('aria-pressed',String(m==='signup'));
 $('#c-f-pw').autocomplete=m==='login'?'current-password':'new-password';
 $('#c-f-pw').placeholder=m==='login'?'비밀번호를 입력해주세요':'6자 이상 입력해주세요';
 authMode=m;
 $('#c-tab-login').classList.toggle('active',m==='login');
 $('#c-tab-signup').classList.toggle('active',m==='signup');
 $('#c-nick-wrap').style.display=m==='signup'?'block':'none';
 $('#c-auth-go').textContent=m==='login'?'로그인':'가입하기';
 $('#c-auth-msg').textContent='';
}
$('#c-tab-login').onclick=()=>setAuthMode('login');
$('#c-tab-signup').onclick=()=>setAuthMode('signup');
$('#c-login-close').onclick=()=>$('#c-login-modal').classList.remove('open');
$('#c-kakao-btn').onclick=async()=>{ const {error}=await sb.auth.signInWithOAuth({provider:'kakao',options:{redirectTo:location.href,scopes:'profile_nickname'}}); if(error)toast('카카오 연결 실패: '+error.message); };
$('#c-auth-go').onclick=async()=>{
 const email=$('#c-f-email').value.trim(), pw=$('#c-f-pw').value, msg=t=>$('#c-auth-msg').textContent=t;
 if(!email||!pw)return msg('이메일과 비밀번호를 입력해주세요');
 $('#c-auth-go').disabled=true;
 try{
  if(authMode==='signup'){
   const nick=$('#c-f-nick').value.trim()||email.split('@')[0];
   const {data,error}=await sb.auth.signUp({email,password:pw});
   if(error)return msg('가입 실패: '+error.message);
   if(!data.session)return msg('확인 메일을 보냈어요! 📮');
   toast('환영해요, '+nick+'님!');$('#c-login-modal').classList.remove('open');
  }else{
   const {error}=await sb.auth.signInWithPassword({email,password:pw});
   if(error)return msg('로그인 실패: 이메일 또는 비밀번호를 확인해주세요');
   toast('어서오세요!');$('#c-login-modal').classList.remove('open');
  }
 }finally{$('#c-auth-go').disabled=false;}
};

function renderPoints(){}
async function shrinkImage(file){
 try{
  const img=await createImageBitmap(file);
  const MAX=900;
  const scale=Math.min(1, MAX/Math.max(img.width,img.height));
  if(scale>=1&&file.size<250*1024) return file;
  const w=Math.round(img.width*scale), h=Math.round(img.height*scale);
  const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
  cv.getContext('2d').drawImage(img,0,0,w,h);
  const blob=await new Promise(r=>cv.toBlob(r,'image/jpeg',0.74));
  if(!blob) return file;
  return new File([blob], (file.name.replace(/\.[^.]+$/,'')||'photo')+'.jpg', {type:'image/jpeg'});
 }catch(e){ return file; }
}
/* ── 글쓰기 (전체화면 전환) ── */
function openWriteView(){
 $('#home-view').style.display='none';
 $('#write-view').style.display='block';
 if(location.hash!=='#write')history.replaceState(null,'','#write');
 window.scrollTo(0,0);
 if(window.gaEvent)gaEvent('write_open',{surface:'homepage'});
}
function closeWriteView(){
 if(document.body.dataset.writer==='kids'){location.assign('/kids.html');return;}
 $('#write-view').style.display='none';
 if(location.hash==='#write')history.replaceState(null,'',location.pathname+location.search);
 $('#home-view').style.display='block';
 window.scrollTo(0,0);
}
$('#write-open-btn').onclick=openWriteView;
document.querySelectorAll('.header-write').forEach(a=>a.onclick=e=>{e.preventDefault();openWriteView();});
window.addEventListener('hashchange',()=>{if(location.hash==='#write')openWriteView();});
$('#write-back-btn').onclick=()=>{
 if(($('#w-title').value.trim()||$('#w-body').value.trim()||$('#w-ingredients')?.value.trim()||$('#w-tip')?.value.trim()||wFile||['help','ingredients','steps','tip'].some(k=>$('#w-kids-'+k)?.value.trim()))&&!confirm('작성 중인 내용이 있어요. 나가시겠어요?'))return;
 closeWriteView();
};
document.querySelectorAll('#w-target .w-chip').forEach(c=>c.onclick=()=>{ document.querySelectorAll('#w-target .w-chip').forEach(x=>x.classList.remove('active')); c.classList.add('active'); wTarget=c.dataset.t; });

/* ── 블로그에서 가져오기 ── */
$('#wmt-direct').onclick=()=>{
 $('#wmt-direct').classList.add('active'); $('#wmt-import').classList.remove('active');
 $('#import-panel').style.display='none';
};
$('#wmt-import').onclick=()=>{
 $('#wmt-import').classList.add('active'); $('#wmt-direct').classList.remove('active');
 $('#import-panel').style.display='block';
};
$('#import-go-btn').onclick=async()=>{
 const url=$('#import-url').value.trim();
 if(!url)return toast('블로그 글 주소를 입력해주세요');
 const btn=$('#import-go-btn'), status=$('#import-status');
 btn.disabled=true; btn.textContent='가져오는 중...'; status.textContent='';
 try{
  const r=await fetch('/api/import-blog',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url})});
  const d=await r.json();
  if(!r.ok){ status.textContent='❌ '+(d.error||'가져오기에 실패했어요'); return; }
  $('#w-title').value=d.title||'';
  $('#w-body').value=d.body||'';
  if(d.target){
   document.querySelectorAll('#w-target .w-chip').forEach(x=>{
    const match=x.dataset.t===d.target;
    x.classList.toggle('active',match);
    if(match)wTarget=x.dataset.t;
   });
  }
  status.textContent='✅ 가져왔어요! 내용을 확인하고 수정한 뒤 등록해주세요.';
  toast('블로그 내용을 불러왔어요');
 }catch(e){
  status.textContent='❌ 가져오기에 실패했어요';
 }finally{
  btn.disabled=false; btn.textContent='가져오기';
 }
};
// Shared script compatibility for older saved-recipe pages.
if(!$('#w-photo-change'))$('#w-photo-box').insertAdjacentHTML('afterend','<div class="photo-actions"><button type="button" id="w-photo-change">사진 선택</button><button type="button" id="w-photo-remove" hidden>삭제</button></div><p id="w-photo-status" class="editor-help" role="status"></p>');
let photoPreviewURL='',photoRequest=0,photoBusy=false;
const originalPhotoHint=$('#w-photo-hint').innerHTML;
function resetWriterPhoto(){photoRequest++;photoBusy=false;wFile=null;$('#w-photo').value='';if(photoPreviewURL)URL.revokeObjectURL(photoPreviewURL);photoPreviewURL='';$('#w-photo-preview').removeAttribute('src');$('#w-photo-preview').style.display='none';$('#w-photo-hint').innerHTML=originalPhotoHint;$('#w-photo-hint').style.display='block';$('#w-photo-remove').hidden=true;$('#w-photo-change').textContent='사진 선택';$('#w-photo-status').textContent='JPG · PNG · WebP / 최대 15MB';}
async function selectWriterPhoto(file){
 if(!file)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)){toast('JPG, PNG, WebP 사진을 선택해주세요.');return;}
 if(file.size>15*1024*1024){toast('15MB 이하 사진을 선택해주세요.');return;}
 const request=++photoRequest;photoBusy=true;$('#w-photo-status').textContent='사진을 준비하고 있어요…';
 try{
  const optimized=await shrinkImage(file);if(request!==photoRequest)return;
  const url=URL.createObjectURL(optimized);
  try{await new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=reject;img.src=url;});}catch(e){URL.revokeObjectURL(url);throw new Error('사진을 읽을 수 없어요. 다른 파일을 선택해주세요.');}
  if(request!==photoRequest){URL.revokeObjectURL(url);return;}
  if(photoPreviewURL)URL.revokeObjectURL(photoPreviewURL);photoPreviewURL=url;wFile=optimized;
  $('#w-photo-preview').src=url;$('#w-photo-preview').style.display='block';$('#w-photo-hint').style.display='none';$('#w-photo-remove').hidden=false;$('#w-photo-change').textContent='사진 바꾸기';$('#w-photo-status').textContent=file.name+' · 등록할 준비가 되었어요';
 }catch(e){if(request===photoRequest){$('#w-photo-status').textContent=e.message||'사진을 준비하지 못했어요.';}}
 finally{if(request===photoRequest)photoBusy=false;}
}
$('#w-photo-box').onclick=()=>$('#w-photo').click();
$('#w-photo-change').onclick=()=>$('#w-photo').click();
$('#w-photo-remove').onclick=resetWriterPhoto;
$('#w-photo').onchange=e=>{selectWriterPhoto(e.target.files[0]);e.target.value='';};
const photoDrop=$('#w-photo-box');
['dragenter','dragover'].forEach(type=>photoDrop.addEventListener(type,e=>{e.preventDefault();photoDrop.classList.add('drag-over');}));
['dragleave','drop'].forEach(type=>photoDrop.addEventListener(type,e=>{e.preventDefault();photoDrop.classList.remove('drag-over');}));
photoDrop.addEventListener('drop',e=>selectWriterPhoto(e.dataTransfer.files[0]));
$('#write-view').addEventListener('paste',e=>{const item=[...(e.clipboardData?.items||[])].find(item=>item.kind==='file'&&item.type.startsWith('image/'));if(item){e.preventDefault();selectWriterPhoto(item.getAsFile());}});
function syncKidsWriter(){
 const kids=$('#w-publish-to')?.value==='kids';
 if(!$('#w-kids-fields'))return;
 $('#w-kids-fields').hidden=!kids;$('#w-general-fields').hidden=kids;
 const targets=$('#w-target')?.closest('.write-target-row');if(targets)targets.hidden=kids;
}
$('#w-publish-to')?.addEventListener('change',syncKidsWriter);
if(new URLSearchParams(location.search).get('publish')==='kids'&&document.body.dataset.writer!=='kids')location.replace('/kids-write.html');
syncKidsWriter();
$('#w-submit').onclick=async()=>{
 if(!me){toast('작성한 내용은 유지됩니다. 로그인 후 등록해주세요.');$('#c-login-modal').classList.add('open');return;}
 if(photoBusy)return toast('사진 준비가 끝난 뒤 등록해주세요.');
 const title=$('#w-title').value.trim();
 const publishKids=$('#w-publish-to')?.value==='kids';
 let body=$('#w-body').value.trim();
 if(!publishKids&&$('#w-ingredients')){
  const ingredients=$('#w-ingredients').value.trim(),tip=$('#w-tip').value.trim();
  if(!ingredients&&!$('#import-url').value.trim())return toast('재료와 분량을 적어주세요');
  if(!body)return toast('만드는 법을 적어주세요');
  body=(ingredients?'재료\n'+ingredients+'\n\n만드는 법\n':'')+body+(tip?'\n\n요리 팁\n'+tip:'');
 }
 if(publishKids){
  try{window.TMRecipeWriter.syncSteps();}catch(e){return toast(e.message);}
  try{body=window.TMKidsPublishing.compose({mode:$('#w-kids-mode').value,time:$('#w-kids-time').value,help:$('#w-kids-help').value,ingredients:$('#w-kids-ingredients').value,steps:$('#w-kids-steps').value,tip:$('#w-kids-tip').value});}catch(e){return toast(e.message);}
  if(!wFile)return toast('아이와 요리에 올릴 음식 사진을 선택해주세요.');
 }
 if(!title)return toast('레시피 이름을 적어주세요');
 if(!body)return toast('재료와 만드는 법을 적어주세요');
 const btn=$('#w-submit'); btn.disabled=true; btn.textContent='올리는 중...';
 try{
  let image_url=null;
  if(wFile){
   const path=me.id+'/'+Date.now()+'.'+(wFile.name.split('.').pop()||'jpg');
   const {error:se}=await sb.storage.from('photos').upload(path,wFile);
   if(se)throw new Error('사진 업로드에 실패했어요. 내용을 유지했으니 다시 등록해주세요.');
   image_url=sb.storage.from('photos').getPublicUrl(path).data.publicUrl;
  }
  const {error}=await sb.from('recipes').insert({user_id:me.id,title,body,target:publishKids?"아이":wTarget,image_url});
  if(error){toast('등록 실패: '+error.message);return;}
  // A points issue must not cause duplicate recipe submissions.
  try{await sb.from('points_ledger').insert({user_id:me.id,amount:50,reason:'레시피 작성',ref_id:title});}catch(e){}
  $('#w-title').value='';$('#w-body').value='';if($('#w-ingredients'))$('#w-ingredients').value='';if($('#w-tip'))$('#w-tip').value='';resetWriterPhoto();
  if(publishKids){['help','ingredients','steps','tip'].forEach(k=>$('#w-kids-'+k).value='');location.assign('/kids.html?published=1');return;}
  closeWriteView();
  toast('레시피를 올렸어요.');
  renderPoints(); loadFeed();
 }catch(e){ toast('오류: '+String(e).slice(0,100)); }
 finally{ btn.disabled=false; btn.textContent=publishKids?'아이 요리 활동 올리기':'레시피 등록하기'; }
};

try{
 if(!window.supabase) throw new Error("연결 프로그램을 못 불러왔어요");
 sb=window.supabase.createClient(SB_URL,SB_KEY);
 watchAuth();
 refreshAuth().catch(()=>toast("로그인 상태를 확인하지 못했어요. 다시 시도해 주세요."));
 loadFeed();
}catch(e){ console.error(e); feedError(); renderAuthSlot(); }

if(location.hash==='#write')openWriteView();

if(document.body.dataset.writer==='kids')openWriteView();
