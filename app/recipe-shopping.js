(()=>{
'use strict';
function key(name){return String(name||'').replace(/\s/g,'').replace(/달걀/g,'계란');}
function parseLine(line){
 const clean=String(line).replace(/^\s*[-*•·]\s*/, '').trim();
 const match=clean.match(/^(.+?)\s+(\d[\d\s./~½¼¾-]*(?:kg|mg|g|ml|mL|L|l|큰술|작은술|스푼|컵|모|개|줌|대|공기|장|봉|쪽|마리|통|근|꼬집|줄|팩|알|스틱).*)$/);
 return match?{name:match[1].trim(),amt:match[2].trim()}:{name:clean,amt:''};
}
function parseBody(body){
 const lines=String(body||'').split(/\r?\n/);let active=false,out=[];
 for(const line of lines){const clean=line.replace(/^[\s#*🥬🧂]+/u,'').trim();
 if(/^(?:\[재료\]|재료)(?:\s*\([^)]*\))?\s*[:：]?\s*$/.test(clean)){active=true;continue;}
 if(!active)continue;
 if(/만드는\s*법|조리\s*(?:방법|순서)|^\s*[🔪💡]|^\s*\[|^\s*(?:팁|영양정보|요리 팁|AI 초안)/u.test(line))break;
 if(clean)out.push(parseLine(clean));
 }
 return out;
}
function create({getPantry,getShop,onAdd,onGo}){
 const dialog=document.createElement('dialog');dialog.className='recipe-shopping-dialog';dialog.setAttribute('aria-labelledby','recipe-shopping-heading');
 dialog.innerHTML='<form method="dialog"><div class="rs-head"><h2 id="recipe-shopping-heading">필요한 재료 담기</h2><button aria-label="닫기">×</button></div></form><p id="rs-title"></p><p class="rs-help">집에 있는 재료는 선택을 해제하세요. 냉장고에 등록된 재료는 미리 해제했어요.</p><div id="rs-items"></div><div class="rs-manual"><label for="rs-input">재료 추가</label><div><input id="rs-input" placeholder="예: 두부 1모"><button type="button" id="rs-add">추가</button></div></div><p id="rs-status" role="status" aria-live="polite"></p><button type="button" class="rs-primary" id="rs-save">장보기에 담기</button><button type="button" class="rs-go" id="rs-go">장보기로 이동 ›</button>';
 document.body.append(dialog);const el=id=>dialog.querySelector('#'+id);let items=[],title='';
 function render(){el('rs-items').replaceChildren();const pantry=new Set(getPantry().map(x=>key(x.name)));
 for(const item of items){const label=document.createElement('label');label.className='rs-item';const cb=document.createElement('input');cb.type='checkbox';cb.checked=item.checked;cb.onchange=()=>{item.checked=cb.checked;update();};const text=document.createElement('span');text.textContent=item.name;const sub=document.createElement('small');sub.textContent=[item.amt,pantry.has(key(item.name))?'냉장고에 등록됨':''].filter(Boolean).join(' · ');text.append(sub);label.append(cb,text);el('rs-items').append(label);}update();}
 function update(){const n=items.filter(x=>x.checked).length;el('rs-save').disabled=!n;el('rs-save').textContent=n?'선택한 '+n+'개 장보기에 담기':'담을 재료를 선택하세요';}
 function add(){const input=el('rs-input');const parsed=parseLine(input.value);if(!parsed.name)return;const found=items.find(x=>key(x.name)===key(parsed.name));if(found){found.checked=true;if(parsed.amt)found.amt=parsed.amt;}else items.push({...parsed,checked:true});input.value='';render();}
 el('rs-add').onclick=add;el('rs-input').onkeydown=e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();add();}};
 el('rs-save').onclick=()=>{const selected=items.filter(x=>x.checked);const existing=new Set(getShop().filter(x=>!x.done).map(x=>key(x.name)));const fresh=selected.filter(x=>!existing.has(key(x.name))).map(({name,amt})=>({name,amt,from:title,done:false}));try{onAdd(fresh);el('rs-status').textContent=fresh.length?fresh.length+'개를 담았어요. 장보기에서 확인할 수 있습니다.':'선택한 재료는 이미 장보기에 담겨 있어요.';}catch{el('rs-status').textContent='저장하지 못했습니다. 다시 시도해주세요.';}};
 el('rs-go').onclick=()=>{dialog.close();onGo();};
 return {open(recipeTitle,ingredients){title=recipeTitle||'레시피';const pantry=new Set(getPantry().map(x=>key(x.name)));const unique=new Map();for(const raw of ingredients||[]){const item=typeof raw==='string'?parseLine(raw):raw;if(!item?.name)continue;const name=String(item.name).trim();if(!name)continue;unique.set(key(name),{name,amt:String(item.amt||''),checked:!pantry.has(key(name))});}items=[...unique.values()];el('rs-title').textContent=title;el('rs-status').textContent=items.length?'필요한 분량과 재료명을 확인한 뒤 담아주세요.':'재료 목록을 자동으로 읽지 못했어요. 아래에서 필요한 재료를 추가해주세요.';el('rs-input').value='';render();dialog.showModal();}};
}
window.TodayMealRecipeShopping={create,parseBody,parseLine,key};
})();
