import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {guides} from '../scripts/ingredient-guides.mjs';
import {PUBLIC_PATHS} from '../scripts/public-pages.mjs';
const root=new URL('../',import.meta.url);
test('guide pages are crawlable static articles with valid metadata and working internal links',async()=>{
 const titles=new Set();
 for(const g of guides){const url='/learn/'+g.id+'.html';assert(PUBLIC_PATHS.includes(url));const html=await readFile(new URL(url.slice(1),root),'utf8');const title=html.match(/<title>(.*?)<\/title>/)[1];assert(!titles.has(title));titles.add(title);assert.equal((html.match(/<h1>/g)||[]).length,1);assert(html.includes('rel="canonical" href="https://todaymeal.co.kr'+url+'"'));assert(html.includes(g.intro));for(const s of g.steps)assert(html.includes(s[1]));for(const [q,a] of g.faq){assert(html.includes(q));assert(html.includes(a));}const ld=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);assert.equal(ld['@graph'][0]['@type'],'Article');assert.equal(ld['@graph'][1].itemListElement[1].item,'https://todaymeal.co.kr'+url);for(const [,p] of html.matchAll(/href="(\/[^"?#]*)(?:[^" ]*)"/g)){if(p==='/')continue;await access(new URL(p.slice(1)+(p.endsWith('/')?'index.html':''),root));}}
 assert.equal(new Set(PUBLIC_PATHS).size,PUBLIC_PATHS.length);
});
test('guide index keeps links, videos and save identifiers compatible',async()=>{const html=await readFile(new URL('learn.html',root),'utf8');for(const g of guides)assert(html.includes('href="/learn/'+g.id+'.html"'));assert(html.includes('id="videos"'));assert(html.includes('/classes/egg-roll.html'));assert(html.includes('/learn/scallion.html'));const js=await readFile(new URL('cooking.js',root),'utf8');for(const g of guides)assert(js.includes("['"+g.id+"',"));assert(html.includes('aria-label="재료 이름 검색"'));});

test('tips remain readable in static articles and new ingredients never reuse unrelated photos',async()=>{for(const [i,g] of guides.entries()){const html=await readFile(new URL('learn/'+g.id+'.html',root),'utf8');assert(html.includes('id="tips"'));for(const [title,body] of g.tips){assert(html.includes(title));assert(html.includes(body));}if(i>=6)assert(!/class="prep-photo prep-/.test(html));}const html=await readFile(new URL('learn.html',root),'utf8');assert(html.includes('id="tips-panel"'));assert(html.includes('data-filter="버섯"'));assert.equal((html.match(/data-tip>/g)||[]).length,guides.length);});

test('new guide photographs resolve on list, article and social preview',async()=>{const index=await readFile(new URL('learn.html',root),'utf8');for(const g of guides.slice(6)){const src='/assets/prep/'+g.id+'.webp';await access(new URL(src.slice(1),root));const html=await readFile(new URL('learn/'+g.id+'.html',root),'utf8');assert(index.includes('src="'+src+'"'));assert(html.includes('src="'+src+'"'));assert(html.includes('content="https://todaymeal.co.kr'+src+'"'));assert(!html.includes('class="guide-letter"'));}});
