let photoBusy=false,photoOrigin='',photoPreviewUrl='';
function normalizeMenu(s){return String(s).replace(/\s/g,'').toLowerCase();}
function readRecentMenus(){try{const v=JSON.parse(localStorage.getItem('factory-recent-menus')||'[]');return Array.isArray(v)?v.filter(x=>typeof x==='string').slice(-40):[];}catch{return [];}}
function rememberMenu(name){try{localStorage.setItem('factory-recent-menus',JSON.stringify([...readRecentMenus().filter(x=>normalizeMenu(x)!==normalizeMenu(name)),name].slice(-40)));}catch{}}
function clearPhoto(){
 if(photoPreviewUrl)URL.revokeObjectURL(photoPreviewUrl);photoPreviewUrl='';photoFile=null;photoOrigin='';
 $('#photo-preview').removeAttribute('src');$('#photo-preview-wrap').hidden=true;$('#photo-reviewed').checked=false;$('#f-photo').value='';$('#photo-btn').textContent='사진 선택';$('#photo-status').textContent='';
}
async function attachPhoto(file,origin){
 const url=URL.createObjectURL(file);const image=new Image();image.src=url;
 try{await image.decode();}catch{URL.revokeObjectURL(url);throw new Error('사진을 읽을 수 없습니다. JPG 또는 PNG 파일로 다시 선택해주세요.');}
 if(photoPreviewUrl)URL.revokeObjectURL(photoPreviewUrl);
 photoFile=file;photoOrigin=origin;photoPreviewUrl=url;
 $('#photo-preview').src=url;$('#photo-preview-wrap').hidden=false;$('#photo-reviewed').checked=false;
 $('#photo-kind').textContent=origin==='ai'?'AI 생성 참고 이미지 · 등록 전 검토 필요':'직접 올린 사진 · 등록 전 검토 필요';
 $('#photo-btn').textContent='다른 사진으로 교체';
}
function lockPhoto(active){photoBusy=active;['#generate-photo','#remove-photo','#photo-btn','#submit'].forEach(x=>$(x).disabled=active);}
function recipeSnapshot(){return JSON.stringify({title:$('#f-title').value.trim(),ingredients:$('#f-ing').value.trim(),steps:$('#f-steps').value.trim(),request:$('#photo-request').value.trim()});}
async function generatePhoto(){
 if(photoBusy)return;
 const snapshot=recipeSnapshot(),body=JSON.parse(snapshot);
 if(!body.title||!body.ingredients){$('#photo-status').textContent='먼저 레시피 초안을 만들어주세요.';return;}
 lockPhoto(true);$('#photo-status').textContent='이미지 준비 중… 완성 후 아래 미리보기에서 확인하세요.';
 let timer;
 try{
  if(!sb)throw new Error('사진 생성은 로그인 후 사용할 수 있습니다. 로그인 상태를 확인해주세요.');
  const session=await Promise.race([sb.auth.getSession(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('로그인 확인 시간이 초과됐습니다.')),12000);})]);clearTimeout(timer);
  if(session.error)throw session.error;
  const token=session.data?.session?.access_token;if(!token)throw new Error('로그인 후 이미지 생성을 눌러주세요. 레시피 초안은 그대로 남아 있습니다.');
  const controller=new AbortController();timer=setTimeout(()=>controller.abort(),115000);
  const response=await fetch('/api/factory-image',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body),signal:controller.signal});
  const data=await response.json().catch(()=>({message:'서버 응답을 읽지 못했어요. 잠시 후 다시 시도해주세요.'}));
  if(!response.ok)throw new Error(data.message||'이미지 생성에 실패했습니다.');
  if(snapshot!==recipeSnapshot())throw new Error('생성 중 레시피나 수정 요청이 바뀌었습니다. 현재 내용으로 다시 생성해주세요.');
  if(typeof data.b64!=='string'||data.b64.length>4000000)throw new Error('이미지 응답을 확인할 수 없습니다.');
  const bytes=Uint8Array.from(atob(data.b64),c=>c.charCodeAt(0));
  await attachPhoto(new File([bytes],'ai-food.jpg',{type:'image/jpeg'}),'ai');
  $('#photo-status').textContent='사진을 확인해주세요. 수정 요청을 적고 다시 생성하거나 직접 올린 사진으로 교체할 수 있습니다.';
 }catch(e){$('#photo-status').textContent=e.name==='AbortError'?'이미지 생성 시간이 초과됐습니다. 초안과 기존 사진은 유지됩니다.':e.message;}
 finally{clearTimeout(timer);lockPhoto(false);}
}
$('#generate-photo').onclick=()=>{if(!$('#draft').disabled)generatePhoto();};
$('#remove-photo').onclick=()=>{if(!photoBusy)clearPhoto();};
$('#f-photo').onchange=async e=>{
 const file=e.target.files[0];if(!file||photoBusy)return;
 if(file.size>25*1024*1024){$('#photo-status').textContent='25MB 이하 사진을 선택해주세요.';e.target.value='';return;}
 lockPhoto(true);
 try{await attachPhoto(await shrinkImage(file),'upload');$('#photo-status').textContent='사진을 확인한 뒤 확인 항목을 체크해주세요.';}
 catch(error){$('#photo-status').textContent=error.message;}
 finally{lockPhoto(false);}
};
['#f-title','#f-ing','#f-steps'].forEach(x=>$(x).addEventListener('input',()=>{$('#photo-reviewed').checked=false;if(photoFile)$('#photo-status').textContent='레시피가 수정됐습니다. 사진과 맞는지 다시 확인해주세요.';}));
