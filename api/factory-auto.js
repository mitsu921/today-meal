import {dbClient,jsonFetch,key,validate} from '../scripts/factory-core.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
 const url=(process.env.SUPABASE_URL||'https://jnwlaevfvhxpmmnkmyrw.supabase.co').replace(/\/$/,'');
 const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const allow=(process.env.FACTORY_ADMIN_EMAILS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
 if(!secret||!allow.length)return res.status(503).json({error:'SETUP_REQUIRED',message:'Vercel의 SUPABASE_SERVICE_ROLE_KEY와 FACTORY_ADMIN_EMAILS를 설정해주세요.'});
 const authorization=req.headers.authorization||'';
 if(!/^Bearer \S+$/.test(authorization))return res.status(401).json({error:'LOGIN_REQUIRED'});
 let user;
 try{user=await jsonFetch(url+'/auth/v1/user',{headers:{apikey:secret,Authorization:authorization}});}catch{return res.status(401).json({error:'LOGIN_REQUIRED'});}
 if(!user?.id||!user.email_confirmed_at||!allow.includes(String(user.email||'').toLowerCase()))return res.status(403).json({error:'ADMIN_REQUIRED'});
 const db=dbClient(url,secret);
 try{
  if(req.method==='GET'){
   const [settings,jobs,photos]=await Promise.all([db('factory_auto_settings?id=eq.true'),db('factory_auto_jobs?order=created_at.desc&limit=40'),db('factory_auto_photos?order=created_at.desc&limit=100')]);
   return res.status(200).json({settings:settings[0],jobs,photos});
  }
  const b=req.body||{};
  if(b.action==='settings'){
   if(!['approved','ai'].includes(b.image_mode)||typeof b.enabled!=='boolean'||!Number.isInteger(b.daily_limit)||b.daily_limit<1||b.daily_limit>10)return res.status(400).json({error:'INVALID_SETTINGS'});
   const cfg=(await db('factory_auto_settings?id=eq.true'))[0];if(!cfg)throw Error('SETUP_REQUIRED');
   await db('factory_auto_settings?id=eq.true','PATCH',{enabled:b.enabled,daily_limit:b.daily_limit,image_mode:b.image_mode,owner_id:cfg.owner_id||user.id,updated_at:new Date().toISOString()});
  }else if(b.action==='photo'){
   if(typeof b.dish!=='string'||!b.dish.trim()||b.dish.length>80||!key(b.dish)||typeof b.credit!=='string'||!b.credit.trim()||b.credit.length>300||b.rights_confirmed!==true||!['family','kids','quick','snack'].includes(b.category))return res.status(400).json({error:'INVALID_PHOTO'});
   if(typeof b.image_url!=='string'||!b.image_url.startsWith(url+'/storage/v1/object/public/photos/'+user.id+'/'))return res.status(400).json({error:'UPLOAD_OWN_PHOTO'});
   const img=await fetch(b.image_url,{method:'HEAD',redirect:'error',signal:AbortSignal.timeout(10000)});
   if(!img.ok||!/^image\/(jpeg|png|webp)/.test(img.headers.get('content-type')||''))return res.status(400).json({error:'INVALID_IMAGE'});
   const existing=(await db('factory_auto_photos?dish_key=eq.'+encodeURIComponent(key(b.dish))))[0];
   const record={dish:b.dish.trim(),dish_key:key(b.dish),category:b.category,image_url:b.image_url,credit:b.credit.trim(),enabled:true};
   await db(existing?'factory_auto_photos?id=eq.'+existing.id:'factory_auto_photos',existing?'PATCH':'POST',record);
  }else if(b.action==='photo-disable'){
   if(!/^[0-9a-f-]{36}$/.test(b.id||''))return res.status(400).json({error:'INVALID_ID'});
   await db('factory_auto_photos?id=eq.'+b.id,'PATCH',{enabled:false});
  }else if(b.action==='publish'){
   if(!/^[0-9a-f-]{36}$/.test(b.id||'')||b.reviewed!==true)return res.status(400).json({error:'REVIEW_REQUIRED'});
   const j=(await db('factory_auto_jobs?id=eq.'+b.id))[0];
   if(!j||!['review','ready'].includes(j.status))return res.status(409).json({error:'NOT_REVIEWABLE'});
   const d=validate(b.draft);if(key(d.dish)!==j.dish_key||key(d.title)!==j.dish_key)return res.status(400).json({error:'DISH_MUST_MATCH'});
   const photo=(await db('factory_auto_photos?enabled=eq.true&dish_key=eq.'+encodeURIComponent(j.dish_key)))[0];
   if(!photo)return res.status(400).json({error:'PHOTO_REQUIRED',message:'동일한 음식명의 사진을 먼저 등록해주세요.'});
   await db('factory_auto_jobs?id=eq.'+j.id+'&status=in.(review,ready)','PATCH',{draft:d,image_url:photo.image_url,photo_id:photo.id});
   await db('rpc/factory_auto_publish','POST',{p_job:j.id,p_reviewed:true});
  }else return res.status(400).json({error:'UNKNOWN_ACTION'});
  return res.status(200).json({ok:true});
 }catch(e){return res.status(400).json({error:'ACTION_FAILED',message:'처리하지 못했습니다. SQL 설치, 사진 중복, 오늘 게시 한도 또는 최근 상태 변경을 확인해주세요. 입력 내용은 유지됩니다.'});}
}
