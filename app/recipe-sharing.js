(()=>{
'use strict';
let sharing=false,dialog=null;
function fallback(data,message){
 if(!dialog){dialog=document.createElement('dialog');dialog.setAttribute('aria-labelledby','recipe-share-heading');dialog.style.cssText='box-sizing:border-box;width:calc(100% - 36px);max-width:400px;border:1px solid #eee;border-radius:18px;padding:24px;color:#252525;background:white;font-family:inherit;';
 dialog.innerHTML='<h2 id="recipe-share-heading" style="margin:0 0 12px;font-size:20px">레시피 공유</h2><p id="recipe-share-help" style="font-size:15px;line-height:1.7"></p><label for="recipe-share-url">공유 링크</label><input id="recipe-share-url" readonly style="box-sizing:border-box;width:100%;padding:12px;margin:8px 0 12px;border:1px solid #ddd;border-radius:8px;font-size:14px"><button type="button" id="recipe-share-copy" style="width:100%;padding:13px;border:0;border-radius:10px;background:#c25a30;color:white;font-weight:bold;font-size:15px">링크 복사</button><p id="recipe-share-status" role="status" style="font-size:14px;line-height:1.6"></p><button type="button" id="recipe-share-close" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:10px;background:white;font-size:15px">닫기</button>';
 document.body.append(dialog);dialog.querySelector('#recipe-share-close').onclick=()=>dialog.close();
 dialog.querySelector('#recipe-share-copy').onclick=async()=>{const input=dialog.querySelector('#recipe-share-url'),status=dialog.querySelector('#recipe-share-status');try{if(!navigator.clipboard?.writeText)throw new Error();await navigator.clipboard.writeText(input.value);status.textContent='링크를 복사했습니다. 카카오톡이나 원하는 앱에 붙여넣어 보내주세요.';}catch{input.focus();input.select();status.textContent='링크를 선택했습니다. 길게 누르거나 Ctrl+C / Command+C로 복사해주세요.';}};
 }
 dialog.querySelector('#recipe-share-help').textContent=message||'이 환경에서는 앱 공유창을 지원하지 않습니다. 링크를 복사해 카카오톡이나 원하는 앱으로 보내주세요.';
 dialog.querySelector('#recipe-share-url').value=data.url;dialog.querySelector('#recipe-share-status').textContent='';if(!dialog.open)dialog.showModal();
}
window.shareTodayMealRecipe=async recipe=>{
 if(sharing)return;
 const id=String(recipe.id);if(!/^\d+$/.test(id))return;
 const data={title:String(recipe.title||'TodayMeal 레시피'),text:String(recipe.title||'오늘 함께 먹을 메뉴')+' — TodayMeal',url:new URL('/r/'+id,location.origin).href};
 if(typeof navigator.share!=='function'){fallback(data);return;}
 sharing=true;
 try{await navigator.share(data);}catch(error){if(error.name!=='AbortError')fallback(data,'앱 공유창을 열지 못했습니다. 링크를 복사해 카카오톡이나 원하는 앱으로 보내주세요.');}finally{sharing=false;}
};
})();
