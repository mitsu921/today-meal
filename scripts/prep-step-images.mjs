export function stepImage(id,name,title,index,count){
 if(!/^[a-z-]+$/.test(id)||![3,4].includes(count)||index<0||index>=count)throw Error('Invalid preparation step image');
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 return `<figure class="guide-step-frame" data-step-photo="${id}:${index+1}"><div class="guide-process-photo" style="aspect-ratio:${count===4?'16/9':'4/3'};position:relative;overflow:hidden"><img src="/assets/prep-steps/${id}.webp" alt="${esc(name+' — '+title+' · AI 과정 예시 이미지')}" width="768" height="1728" loading="lazy" decoding="async" style="position:absolute;left:0;top:-${index*100}%;width:100%;height:${count*100}%;max-width:none"></div><figcaption>${esc(title)} · AI 예시 이미지</figcaption></figure>`;
}
