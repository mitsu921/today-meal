import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {PUBLIC_PATHS} from '../scripts/public-pages.mjs';
import directory from '../api/recipe-library.js';
import sitemap from '../api/sitemap.js';
import detail from '../api/recipe.js';
const root=new URL('../',import.meta.url);
function response(){return {headers:{},code:0,body:'',setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},send(b){this.body=b;return this;}};}
test('all static sitemap targets and shared assets exist',async()=>{
 for(const p of PUBLIC_PATHS){if(p==='/recipe-library')continue;await access(new URL(p==='/'?'index.html':p.slice(1),root));}
 await access(new URL('site-layout.css',root));await access(new URL('site-layout.js',root));
 const s=await readFile(new URL('category.html',root),'utf8');assert(s.includes('href="/recipes/rice-balls.html"'));assert(!s.includes('id="grid"><p style="color:#a89b82'));
});
test('SSR directory works without scripts, escapes user text, paginates and fails honestly',async()=>{
 const old=global.fetch;try{
 global.fetch=async()=>({ok:true,json:async()=>Array.from({length:25},(_,i)=>({id:i+1,title:'<script>bad</script>',body:'재료와 만드는 법',image_url:'javascript:alert(1)'}))});
 let res=response();await directory({query:{}},res);assert.equal(res.code,200);assert(res.body.includes('rel="next"'));assert(res.body.includes('href="/r/1"'));assert(!res.body.includes('<script>bad'));assert(!res.body.includes('javascript:'));
 res=response();await directory({query:{page:'0'}},res);assert.equal(res.code,404);
 global.fetch=async()=>({ok:true,json:async()=>[]});res=response();await directory({query:{page:'2'}},res);assert.equal(res.code,404);
 global.fetch=async()=>{throw Error('offline')};res=response();await directory({query:{}},res);assert.equal(res.code,503);assert(res.body.includes('/kids.html'));
 }finally{global.fetch=old;}
});
test('sitemap covers learning content and database recipes, excluding utility pages',async()=>{
 const old=global.fetch;try{global.fetch=async()=>({ok:true,json:async()=>[{id:22}]});let res=response();await sitemap({},res);assert.equal(res.code,200);for(const p of ['/recipes/rice-balls.html','/learn/onion.html','/r/22','/about.html'])assert(res.body.includes(p));assert(!res.body.includes('/factory.html'));assert(!res.body.includes('/news.html'));}finally{global.fetch=old;}
});
test('recipe detail contains full escaped body; schema excludes photo/AI notes',async()=>{
 const old=global.fetch;try{global.fetch=async()=>({ok:true,json:async()=>[{title:'두부 <테스트>',body:'재료\n두부 1모\n간장 1큰술\n만드는 법\n1) 자릅니다.\n\n2) 익힙니다.\nAI 작성 콘텐츠 · 자동 등록\n사진: 참고 이미지',profiles:{nickname:'작성자'},likes:[],comments:[],image_url:'https://example.com/photo.jpg'}]});let res=response();await detail({query:{id:'1'}},res);assert.equal(res.code,200);assert(res.body.includes('두부 &lt;테스트&gt;'));assert(!res.body.includes('Invalid Date'));const ld=JSON.parse(res.body.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);assert.equal(ld.recipeInstructions.length,2);assert(res.body.includes('/contact.html'));assert(res.body.includes('<main'));}finally{global.fetch=old;}
});
