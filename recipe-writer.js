(()=>{
 const q=s=>document.querySelector(s),list=q('#activity-steps');
 if(!list)return;
 const roles=['아이가 해요','어른이 도와줘요'];
 function renumber(){[...list.children].forEach((card,i)=>{card.querySelector('strong').textContent=(i+1)+'단계';card.querySelector('textarea').setAttribute('aria-label',(i+1)+'단계 설명');card.querySelector('select').setAttribute('aria-label',(i+1)+'단계 역할');card.querySelector('button').disabled=list.children.length<=2;});q('#add-activity-step').disabled=list.children.length>=30;}
 function syncSteps(validate=true){const cards=[...list.children];const steps=cards.map((card,i)=>{const value=card.querySelector('textarea').value.trim();if(validate&&!value)throw new Error((i+1)+'단계 설명을 적어주세요');return {role:card.querySelector('select').value,text:value.replace(/\s*\n\s*/g,' ')};});q('#w-kids-steps').value=steps.filter(s=>s.text).map(s=>s.role+': '+s.text).join('\n');const adult=steps.map((s,i)=>s.role===roles[1]&&s.text?(i+1)+'단계 '+s.text:'').filter(Boolean).join(' / ');q('#w-kids-help').value=adult.slice(0,500)||'준비한 재료와 도구를 확인하고 활동을 지켜봐 주세요.';return steps;}
 function add(role=roles[0]){if(list.children.length>=30)return;const card=document.createElement('section');card.className='activity-step';card.innerHTML='<div class="step-heading"><strong></strong><select>'+roles.map(r=>'<option>'+r+'</option>').join('')+'</select><button type="button" aria-label="이 단계 삭제">삭제</button></div><textarea rows="3" maxlength="1200" placeholder="이 단계에서 할 일을 적어주세요."></textarea>';card.querySelector('select').value=role;card.querySelector('button').onclick=()=>{if(list.children.length<=2)return;card.remove();renumber();syncSteps(false);};list.append(card);renumber();return card;}
 add(roles[1]);add();
 q('#add-activity-step').onclick=()=>add()?.querySelector('textarea').focus();
 list.addEventListener('input',()=>syncSteps(false));
 list.addEventListener('change',()=>syncSteps(false));
 document.querySelectorAll('[name="kids-mode"]').forEach(el=>el.addEventListener('change',()=>q('#w-kids-mode').value=el.value));
 document.querySelectorAll('.header-write').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();if(!q('#w-title').value&&!q('#w-kids-steps').value||confirm('작성 화면을 나가시겠어요? 작성 중인 내용은 저장되지 않습니다.'))location.assign('/#write');}));
 window.TMRecipeWriter={syncSteps};
})();
