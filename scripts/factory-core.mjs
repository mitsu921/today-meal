export const key=s=>String(s||'').toLowerCase().replace(/[^가-힣a-z0-9]/g,'');
export function validate(d){
 if(!d||typeof d!=='object')throw Error('INVALID_DRAFT');
 for(const field of ['dish','title','tip'])if(typeof d[field]!=='string'||d[field].length>500||!d[field].trim())throw Error('INVALID_'+field);
 if(d.title.length>100||d.dish.length>80)throw Error('INVALID_TITLE');
 for(const field of ['ingredients','steps'])if(!Array.isArray(d[field])||d[field].length<2||d[field].length>20||d[field].some(v=>typeof v!=='string'||!v.trim()||v.length>700))throw Error('INVALID_'+field);
 if(!Number.isInteger(d.time_min)||d.time_min<1||d.time_min>240||!Number.isInteger(d.servings)||d.servings<1||d.servings>10)throw Error('INVALID_TIME_SERVINGS');
 if(!['쉬움','보통','손이 감'].includes(d.level))throw Error('INVALID_LEVEL');
 d.steps=d.steps.map(s=>s.replace(/^\s*\d+[.)]\s*/,'').trim());return d;
}
export function stepsText(steps){return steps.map((s,i)=>(i+1)+') '+s.replace(/^\s*\d+[.)]\s*/,'').trim()).join('\n\n');}
export function approved(review){return review?.recipe_ok===true&&review?.photo_matches===true&&review?.duplicate===false&&review?.unsafe===false;}
export async function jsonFetch(url,options={}){
 const r=await fetch(url,{...options,signal:AbortSignal.timeout(90000)});
 if(!r.ok)throw Error('HTTP_'+r.status); // Never log provider response bodies or secrets.
 const text=await r.text();return text?JSON.parse(text):null;
}
export function dbClient(url,secret){return (path,method='GET',body)=>jsonFetch(url+'/rest/v1/'+path,{method,headers:{apikey:secret,Authorization:'Bearer '+secret,'Content-Type':'application/json',Prefer:'return=representation'},...(body===undefined?{}:{body:JSON.stringify(body)})});}
