// Operator-only image generation. Secrets stay on the server.
export const config={maxDuration:120};
const SB_URL='https://jnwlaevfvhxpmmnkmyrw.supabase.co';
const SB_KEY='sb_publishable_9yGKdu0Sh_hsboktuwYJhw_RQCu0W35';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({message:'POST 요청만 지원합니다.'});
 const token=req.headers.authorization||'';
 if(!/^Bearer \S+$/.test(token))return res.status(401).json({message:'로그인 후 이미지를 생성해주세요.'});
 const allowed=(process.env.FACTORY_ADMIN_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
 if(!process.env.OPENAI_API_KEY||!allowed.length)return res.status(503).json({message:'사진 생성 연결이 아직 설정되지 않았습니다. Vercel에 OPENAI_API_KEY와 FACTORY_ADMIN_EMAILS를 설정해주세요. 초안은 그대로 사용하고 직접 사진을 올릴 수 있습니다.'});
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),105000);
 try{
  const auth=await fetch(SB_URL+'/auth/v1/user',{headers:{apikey:SB_KEY,Authorization:token},signal:controller.signal});
  const user=await auth.json();
  if(!auth.ok||!user.id)return res.status(401).json({message:'로그인이 만료됐습니다. 다시 로그인해주세요.'});
  if(!user.email_confirmed_at||!allowed.includes(String(user.email||'').toLowerCase()))return res.status(403).json({message:'사진 생성 권한이 없는 계정입니다. 운영자 이메일 설정을 확인해주세요.'});
  const {title,ingredients,steps='',request=''}=req.body||{};
  if(typeof title!=='string'||!title.trim()||title.length>200||typeof ingredients!=='string'||!ingredients.trim()||ingredients.length>4000||typeof steps!=='string'||steps.length>6000||typeof request!=='string'||request.length>1000)return res.status(400).json({message:'제목, 재료 또는 수정 요청 길이를 확인해주세요.'});
  const prompt='Create a natural, believable food photograph reference for this Korean home recipe. Show only the finished dish, matching listed ingredients and cooking method. Ordinary home kitchen, soft window light, realistic modest portion, subtle imperfect plating, neutral ceramic plate, natural colors and texture. Avoid CGI, illustration, plastic gloss, excessive garnish, text, hands, watermarks, added dishes or ingredients. Landscape close food composition. This is an AI reference, not documentation of a real meal.\nRecipe: '+JSON.stringify({title,ingredients,steps})+'\nRequested visual adjustments: '+request;
  const response=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({model:process.env.FACTORY_IMAGE_MODEL||'gpt-image-2',prompt,n:1,size:'1536x1024',quality:'medium',output_format:'jpeg',output_compression:80})});
  const data=await response.json();
  if(!response.ok)return res.status(response.status===429?429:502).json({message:response.status===429?'이미지 API 이용 한도 또는 잔액을 확인해주세요.': '이미지 API 설정·모델 이용 권한을 확인해주세요. (HTTP '+response.status+')'});
  const b64=data.data?.[0]?.b64_json;
  if(typeof b64!=='string'||b64.length>4000000)return res.status(502).json({message:'이미지 응답 크기 또는 형식이 올바르지 않습니다.'});
  return res.status(200).json({b64});
 }catch(e){return res.status(502).json({message:e.name==='AbortError'?'이미지 생성 시간이 초과됐습니다. 잠시 후 다시 시도해주세요.':'이미지 서비스 연결에 실패했습니다.'});}
 finally{clearTimeout(timer);}
}
