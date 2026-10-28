import {guides} from '../scripts/ingredient-guides.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
test('all published guides expose canonical, article schema and crawlable process images',()=>{
 const files=readdirSync('learn').filter(f=>f.endsWith('.html'));assert.equal(files.length,guides.length+4);
 for(const file of files){const html=readFileSync('learn/'+file,'utf8');assert.equal((html.match(/rel="canonical"/g)||[]).length,1,file);assert(html.includes('https://todaymeal.co.kr/learn/'+file));const schema=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);assert(schema['@graph'].some(x=>x['@type']==='Article'&&x.image.length));assert(schema['@graph'].some(x=>x['@type']==='BreadcrumbList'));assert(!/noindex/i.test(html));const frames=html.match(/<(?:figure|div) class="(?:guide-step-frame|prep-photo)[\s\S]*?<\/div>/g)||[];assert(frames.length,file);for(const frame of frames)assert(/<img[^>]+src="[^" ]+"[^>]+alt="[^"]+"/.test(frame),file);}
});
