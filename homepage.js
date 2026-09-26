
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
function feedError(){homeFailed=true;homeLoaded=false;$('#recipes').setAttribute('aria-busy','false');$('#recipes').innerHTML='<div class="empty-state">레시피를 불러오지 못했어요.<br><button id="retry-home">다시 불러오기</button></div>';$('#retry-home').onclick=()=>loadFeed();}
async function loadFeed(){
 if(!sb){feedError();return;}homeFailed=false;$('#recipes').setAttribute('aria-busy','true');
 try{let rows=[];for(let start=0;;start+=100){const {data,error}=await sb.from('recipes').select('id,title,body,target,image_url,created_at,likes(count),comments(count)').order('created_at',{ascending:false}).order('id',{ascending:false}).range(start,start+99);if(error)throw error;rows.push(...(data||[]));if(!data||data.length<100)break;}
 feedData=rows;homeLoaded=true;renderCards();}catch(e){feedError();}
}
function renderCards(){
 const rows=filteredHome();const el=$('#recipes');el.setAttribute('aria-busy','false');
 $('#recipes-heading').textContent=savedOnly?'저장한 레시피':(homeQuery||homeCategory!=='전체'||homeIngredient?'검색한 레시피':'오늘 둘러볼 레시피');
 $('#search-status').textContent=(homeQuery?'“'+homeQuery+'” · ':'')+rows.length+'개의 레시피'+(savedOnly?' · 이 브라우저에 저장돼요':'');
 el.innerHTML=rows.map(r=>'<article class="recipe-row"><a class="recipe-photo" href="/r/'+encodeURIComponent(r.id)+'">'+homeImage(r)+'</a><div class="recipe-copy"><a href="/r/'+encodeURIComponent(r.id)+'"><h3>'+esc(r.title)+'</h3></a><p>'+esc(r.target||'집에서 만드는 한 끼')+'</p><small>'+esc(homeCategoryOf(r))+' · 추천 '+likeCount(r)+'</small></div><button class="bookmark '+(homeSaved.includes(String(r.id))?'is-saved':'')+'" data-save="'+esc(r.id)+'" aria-label="'+esc(r.title)+' 저장" aria-pressed="'+homeSaved.includes(String(r.id))+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg></button></article>').join('')||'<div class="empty-state">'+(savedOnly?'저장한 레시피가 없어요. 레시피 옆 저장 버튼을 눌러보세요.':'조건에 맞는 레시피가 없어요. 다른 재료로 찾아보세요.')+'<br><button id="clear-home">전체 레시피 보기</button></div>';
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
rouletteDialog.innerHTML='<button class="dialog-close" data-close aria-label="닫기">×</button><span class="roulette-eyebrow">TODAYMEAL MENU PICK</span><h2 id="roulette-title">오늘의 한 끼를 골라볼까요?</h2><p class="roulette-intro">고민은 잠시 내려두고, 가볍게 돌려보세요.</p><div class="roulette-stage"><span class="roulette-pointer" aria-hidden="true"></span><div class="roulette-rim"><div id="home-wheel" class="menu-wheel" aria-hidden="true"></div><div class="wheel-hub" aria-hidden="true"><span>오늘의</span><b>한 끼</b></div></div></div><div id="roulette-result" class="pick-result" aria-live="polite"><span class="pick-kicker">오늘은 어떤 메뉴가 나올까요?</span><p>마음에 드는 메뉴가 나오면 만드는 법을 확인해요.</p></div><button id="spin-roulette" class="orange-button"><span aria-hidden="true">↻</span> 메뉴 골라보기</button><p class="roulette-footnote">등록된 레시피에서 후보를 무작위로 골라요.</p>';
let wheelCandidates=[],wheelAngle=0;
function prepareHomeWheel(){
 const list=feedData.filter(r=>feedData.length<2||String(r.id)!==lastChoice).slice();
 for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]];}
 wheelCandidates=list.slice(0,6);const wheel=$('#home-wheel');const n=wheelCandidates.length;wheelAngle=0;wheel.style.transform='rotate(0deg)';
 const colors=['#fff4df','#f6d7ad','#fff9ed','#f9e4c6','#ffedce','#f3cf9f'];
 wheel.style.background=n?'conic-gradient('+wheelCandidates.map((r,i)=>colors[i]+' '+i*360/n+'deg '+(i+1)*360/n+'deg').join(',')+')':'#fff2df';
 wheel.innerHTML=wheelCandidates.map((r,i)=>{const angle=(i+.5)*360/n,rad=angle*Math.PI/180;const x=50+Math.sin(rad)*31,y=50-Math.cos(rad)*31;const src=r.image_url&&safeHomePhoto(r.image_url);return '<span class="wheel-menu" style="left:'+x+'%;top:'+y+'%">'+(src?'<img src="'+esc(src)+'" alt="">':'<span class="wheel-menu-mark" aria-hidden="true">'+String(i+1).padStart(2,'0')+'</span>')+'<span class="wheel-menu-name">'+esc(r.title)+'</span></span>';}).join('');
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
function setAuthMode(m){
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
 if(!me){$('#c-login-modal').classList.add('open');return;}
 $('#home-view').style.display='none';
 $('#write-view').style.display='block';
 window.scrollTo(0,0);
 if(window.gaEvent)gaEvent('write_open',{surface:'homepage'});
}
function closeWriteView(){
 $('#write-view').style.display='none';
 $('#home-view').style.display='block';
 window.scrollTo(0,0);
}
$('#write-open-btn').onclick=openWriteView;
$('#write-back-btn').onclick=()=>{
 if(($('#w-title').value.trim()||$('#w-body').value.trim())&&!confirm('작성 중인 내용이 있어요. 나가시겠어요?'))return;
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
$('#w-photo-box').onclick=()=>$('#w-photo').click();
$('#w-photo').onchange=async e=>{
 let file=e.target.files[0]||null;
 if(!file)return;
 $('#w-photo-hint').innerHTML='사진 최적화 중...';
 file=await shrinkImage(file);
 wFile=file;
 const url=URL.createObjectURL(file);
 $('#w-photo-preview').src=url; $('#w-photo-preview').style.display='block';
 $('#w-photo-hint').style.display='none';
};
$('#w-submit').onclick=async()=>{
 if(!me){toast('로그인이 필요해요');closeWriteView();$('#c-login-modal').classList.add('open');return;}
 const title=$('#w-title').value.trim(), body=$('#w-body').value.trim();
 if(!title)return toast('레시피 이름을 적어주세요');
 if(!body)return toast('재료와 만드는 법을 적어주세요');
 const btn=$('#w-submit'); btn.disabled=true; btn.textContent='올리는 중...';
 try{
  let image_url=null;
  if(wFile){
   const path=me.id+'/'+Date.now()+'.'+(wFile.name.split('.').pop()||'jpg');
   const {error:se}=await sb.storage.from('photos').upload(path,wFile);
   if(!se)image_url=sb.storage.from('photos').getPublicUrl(path).data.publicUrl;
  }
  const {error}=await sb.from('recipes').insert({user_id:me.id,title,body,target:wTarget,image_url});
  if(error){toast('등록 실패: '+error.message);return;}
  await sb.from('points_ledger').insert({user_id:me.id,amount:50,reason:'레시피 작성',ref_id:title});
  $('#w-title').value='';$('#w-body').value='';wFile=null;
  $('#w-photo-preview').style.display='none'; $('#w-photo-hint').style.display='block'; $('#w-photo-hint').innerHTML='<img class="ico" style="width:34px;height:34px" src="/icons/camera.png"><br>대표 사진 추가하기';
  closeWriteView();
  toast('레시피를 올렸어요! +50P 🎉');
  renderPoints(); loadFeed();
 }catch(e){ toast('오류: '+String(e).slice(0,100)); }
 finally{ btn.disabled=false; btn.textContent='등록하고 +50P 받기'; }
};

try{
 if(!window.supabase) throw new Error("연결 프로그램을 못 불러왔어요");
 sb=window.supabase.createClient(SB_URL,SB_KEY);
 watchAuth();
 refreshAuth().catch(()=>toast("로그인 상태를 확인하지 못했어요. 다시 시도해 주세요."));
 loadFeed();
}catch(e){ console.error(e); feedError(); renderAuthSlot(); }
