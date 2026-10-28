const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const onion=[
{dish:'카레·짜장',cut:'한입 크기로 깍둑썰기',size:'약 1.5~2cm',steps:['껍질을 벗겨 씻은 양파를 반으로 잘라 평평한 면을 아래로 놓아요.','가로·세로로 썰어 한입 크기의 조각을 만들어요.','감자·당근과 함께 먹기 좋은 크기로 맞춰요.'],why:'조금 큼직하게 썰면 오래 끓여도 양파의 모양과 식감을 살리기 좋아요.'},
{dish:'불고기·제육볶음',cut:'일정한 두께로 채썰기',size:'약 5mm',steps:['반으로 자른 양파의 평평한 면을 도마에 붙여요.','뿌리에서 꼭지로 이어지는 결 방향을 따라 비슷한 두께로 썰어요.','붙어 있는 조각을 가볍게 풀어 볶을 준비를 해요.'],why:'너무 얇지 않게 썰면 고기와 함께 집어 먹기 좋고, 볶을 때 쉽게 흐물거리지 않아요.'},
{dish:'볶음밥·오므라이스',cut:'밥과 섞이도록 잘게 썰기',size:'약 3~5mm',steps:['반으로 나누고 평평한 면을 아래로 놓은 뒤 얇게 채썰어요.','채를 적은 양씩 모아 방향을 바꿔 작게 잘라요.','큰 조각이 남았는지 확인하고 크기를 고르게 맞춰요.'],why:'작은 조각은 밥에 고르게 섞이고 한 숟가락마다 양파가 함께 들어가요.'}
];
export function dishSection(g){
 const items=g.id==='onion'?onion:g.uses.map(([cut,dish,note])=>({dish,cut,steps:[note]}));
 return '<section id="cuts" class="guide-dishes"><p class="guide-eyebrow">요리에 맞춰 골라보세요</p><h2>어떤 요리에 넣으세요?</h2><p class="guide-dish-intro">같은 '+esc(g.name)+'도 요리에 따라 준비 방법이 달라요. 기본 손질 후 아래 방법을 참고하세요.</p><nav class="guide-dish-nav" aria-label="요리별 손질 바로가기">'+items.map((r,i)=>'<a href="#dish-'+(i+1)+'">'+esc(r.dish)+' ↓</a>').join('')+'</nav><div class="guide-dish-grid">'+items.map((r,i)=>'<section class="guide-dish-card" id="dish-'+(i+1)+'"><h3>'+esc(r.dish)+'</h3><p class="guide-cut-name">'+esc(r.cut)+'</p>'+(r.size?'<span class="guide-size">크기 예시 · '+esc(r.size)+'</span>':'')+'<ol>'+r.steps.map(x=>'<li>'+esc(x)+'</li>').join('')+(r.why?'<p class="guide-dish-why"><strong>이렇게 써는 이유</strong>'+esc(r.why)+'</p>':'')+'</section>').join('')+'</div><p class="guide-dish-note">크기는 가정 요리용 예시예요. 사용하는 레시피에 지정된 크기와 조리 순서가 있으면 그 기준을 따르세요.</p><a class="guide-basic-link" href="#step-1">처음이라면 공통 손질부터 보기 ↓</a></section>';
}
