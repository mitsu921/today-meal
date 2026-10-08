// Readable recipe sections keep existing recipe pages/editors compatible.
(function(root){
'use strict';
const modes=['불 없이','전자레인지','보호자와 함께'];
function lines(s){return String(s||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);}
function compose(input){
 if(!modes.includes(input.mode))throw Error('요리 방식을 선택해주세요.');
 const time=Number(input.time);if(!Number.isInteger(time)||time<1||time>480)throw Error('조리 시간은 1~480분 사이로 입력해주세요.');
 const help=String(input.help||'').trim().replace(/\s+/g,' ');if(!help||help.length>500)throw Error('어른이 도와줄 단계와 할 일을 500자 이내로 적어주세요.');
 const ingredients=lines(input.ingredients),steps=lines(input.steps).map(s=>s.replace(/^\d+[.)]\s*/,''));
 if(ingredients.length<1||ingredients.length>40)throw Error('재료와 분량을 한 줄에 하나씩 입력해주세요. (최대 40개)');
 if(steps.length<2||steps.length>30)throw Error('만드는 법은 한 줄에 한 단계씩, 2~30단계로 적어주세요.');
 if([...ingredients,...steps].some(s=>s.length>1500))throw Error('한 단계 또는 재료 설명은 1,500자 이내로 적어주세요.');
 const tip=String(input.tip||'').trim();if(tip.length>3000)throw Error('요리 팁은 3,000자 이내로 적어주세요.');
 if([help,tip,...ingredients,...steps].some(s=>s.includes('[아이와 요리]')))throw Error('본문에는 [아이와 요리] 표기를 넣지 말아주세요.');
 return '재료\n'+ingredients.join('\n')+'\n\n만드는 법\n'+steps.map((s,i)=>(i+1)+') '+s).join('\n\n')+(tip?'\n\n[요리 팁]\n'+tip:'')+'\n\n[아이와 요리]\n요리 방식: '+input.mode+'\n조리 시간: '+time+'분\n어른이 도와줘요: '+help;
}
function parse(row){
 const body=String(row.body||''),mark=body.lastIndexOf('\n[아이와 요리]\n');if(mark<0)return null;
 const metadata=body.slice(mark);const mode=metadata.match(/\n요리 방식: ([^\n]+)/)?.[1];const time=Number(metadata.match(/\n조리 시간: (\d+)분(?:\n|$)/)?.[1]);const help=metadata.match(/\n어른이 도와줘요: ([^\n]+)/)?.[1];
 if(!modes.includes(mode)||!Number.isInteger(time)||time<1||time>480||!help||!/^\d+$/.test(String(row.id)))return null;
 const ingredientText=body.slice(0,mark).match(/^재료\n([\s\S]*?)\n\n만드는 법\n/);if(!ingredientText)return null;
 return {id:'public-kids-'+row.id,sourceId:row.id,external:true,title:String(row.title||'레시피'),mode,time,help,ingredients:lines(ingredientText[1]).map(name=>({name,amount:''})),photo:row.image_url||'',created_at:row.created_at};
}
root.TMKidsPublishing={compose,parse,modes};
})(typeof window==='undefined'?globalThis:window);
