(()=>{
'use strict';
const KEY='todaymeal-recent-main-v1',LIMIT=30,TTL=14*24*60*60*1000;
const aliases=[[/달걀/g,'계란'],[/제육볶음|돼지고기고추장볶음|고추장돼지불고기/g,'제육볶음'],[/닭도리탕/g,'닭볶음탕']];
function normalize(value){let s=String(value||'').normalize('NFKC').toLowerCase().replace(/\s|[·ㆍ,.!?()[\]{}~♡♥]/g,'');for(const [rule,replacement] of aliases)s=s.replace(rule,replacement);return s.replace(/^(?:오늘의|우리아이|아이도잘먹는|아이용|온가족|우리가족|든든한|건강한|맛있는|간단한|간편한|초간단|영양만점|부드러운|촉촉한|고소한|담백한|매콤한|순한)+/g,'').replace(/(?:한상|정식|밥상|세트)$/,'');}
let memory=[];
function read(){try{const data=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(data)){const combined=[...data,...memory].filter(x=>x&&typeof x.dish==='string'&&Number.isFinite(x.at)).sort((a,b)=>a.at-b.at);memory=[...new Map(combined.map(x=>[normalize(x.dish),x])).values()];}}catch{}memory=memory.filter(x=>x&&typeof x.dish==='string'&&Number.isFinite(x.at)&&x.at>Date.now()-TTL).slice(-LIMIT);return memory.slice();}
function mainDish(result){const main=(result.tray||[]).find(x=>/^(메인|간식)$/.test(x.slot||''));return String(main?.item||result.main_dish||result.name||'').trim();}
function duplicate(dish,history){const key=normalize(dish);return !!key&&history.some(x=>normalize(x.dish)===key);}
function remember(result){const dish=mainDish(result);if(!dish)return;memory=[...read().filter(x=>normalize(x.dish)!==normalize(dish)),{dish,at:Date.now()}].slice(-LIMIT);try{localStorage.setItem(KEY,JSON.stringify(memory));}catch{}}
async function request({ask,prompt,tokens,explicit=false,onRetry=()=>{}}){
 const history=read();let rejected='';
 for(let attempt=0;attempt<2;attempt++){
 const exclude=history.map(x=>x.dish).concat(rejected?[rejected]:[]);
 const diversity=explicit?'':('\n- 최근에 추천한 메인 음식은 제외: '+(exclude.join(', ')||'없음')+'. 제목이나 곁들임만 바꾸는 것은 다른 메뉴가 아니다. 다른 실제 요리를 선택하라.\n- 조건에 맞는 한국인이 실제로 먹는 다양한 가정식에서 고르고, 주재료와 조리법도 최근 목록과 다르게 분산하라. 다양성 때문에 시간·예산·대상·알레르기 조건을 위반하지 마라.');
 const result=await ask(prompt+diversity,tokens);
 if(!result||typeof result.name!=='string'||!Array.isArray(result.tray)||!result.tray.length||!result.macros)throw new Error('limit:추천 형식을 확인하지 못했습니다. 다시 추천받아 주세요.');
 const dish=mainDish(result);
 if(!dish||['메인','간식','밥','흰쌀밥','잡곡밥'].includes(normalize(dish)))throw new Error('limit:메인 음식 이름이 빠졌습니다. 다시 추천받아 주세요.');
 if(explicit||!duplicate(dish,history)){remember(result);return result;}
 rejected=dish;if(attempt===0)onRetry();
 }
 throw new Error('limit:최근 메뉴와 겹쳐 표시하지 않았어요. 다시 추천받거나 시간·예산 조건을 조금 넓혀주세요.');
}
window.TodayMealDiversity={request,mainDish,normalize,read,duplicate};
})();
