import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {meatGuides} from '../scripts/meat-ingredient-guides.mjs';
import {PUBLIC_PATHS} from '../scripts/public-pages.mjs';
test('meat guides have category-specific hygiene, discoverable pages and distinct tips',()=>{
 assert.equal(meatGuides.length,6);
 for(const g of meatGuides){const url='/learn/'+g.id+'.html',html=readFileSync('.'+url,'utf8');assert.equal(g.category,'육류');assert(PUBLIC_PATHS.includes(url));assert(html.includes('위생·해동·보관'));assert(html.includes('생고기와 생닭은 물로 씻지 마세요'));assert(html.includes('냉장고에서 해동'));assert(!html.includes('FDA의 신선 농산물 취급 안내'));assert(html.includes('safe-minimum-internal-temperatures'));assert.equal((html.match(/data-step-photo=/g)||[]).length,3);assert.equal(g.tips.length,2);assert.equal(g.faq.length,2);}
 const index=readFileSync('learn.html','utf8');for(const g of meatGuides)assert(index.includes('href="/learn/'+g.id+'.html"'));assert(index.includes('38개의 꿀팁'));assert(index.includes('36개의 손질법'));
});
