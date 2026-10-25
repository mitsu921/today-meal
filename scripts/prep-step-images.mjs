export function stepImage(id,name,title,index,count){
 if(!/^[a-z-]+$/.test(id)||![3,4].includes(count)||index<0||index>=count)throw Error('Invalid preparation step image');
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 return `<figure class="guide-step-frame" data-step-photo="${id}:${index+1}"><div class="guide-process-photo" role="img" aria-label="${esc(name+' — '+title+' · AI 과정 예시 이미지')}" style="aspect-ratio:${count===4?'16/9':'4/3'};background-image:url('/assets/prep-steps/${id}.webp');background-size:100% ${count*100}%;background-position:center ${index/(count-1)*100}%"></div><figcaption>${esc(title)} · AI 예시 이미지</figcaption></figure>`;
}
