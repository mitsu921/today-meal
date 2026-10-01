// Optional local PostgreSQL-compatible integration test:
// npm install --no-save @electric-sql/pglite
// node tests/sql-integration.mjs
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {PGlite}=await import(process.env.PGLITE_MODULE||'@electric-sql/pglite');
const db=new PGlite();
await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);create table public.recipes(id bigserial primary key,user_id uuid,title text,body text,target text,image_url text);`);
await db.exec(await readFile(new URL('../sql/factory-auto.sql',import.meta.url),'utf8'));
const owner='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
await db.query('insert into auth.users values($1)',[owner]);
assert.equal((await db.query('select factory_auto_claim(1) as j')).rows[0].j,null);
await db.query('update factory_auto_settings set enabled=true,owner_id=$1',[owner]);
const j=(await db.query('select factory_auto_claim(1) as j')).rows[0].j;
assert(j.id);assert.equal((await db.query('select factory_auto_claim(1) as j')).rows[0].j,null);
assert.equal((await db.query('select factory_auto_claim(11) as j')).rows[0].j,null);
const draft={dish:'두부볶음',title:'두부볶음',time_min:20,servings:2,level:'쉬움',ingredients:['두부 1모','간장 1큰술'],steps:['준비합니다.','익힙니다.'],tip:'간을 확인합니다.'};
await db.query("update factory_auto_jobs set status='ready',draft=$1,dish_key='두부볶음' where id=$2",[draft,j.id]);
await assert.rejects(()=>db.query('select factory_auto_publish($1,false)',[j.id]),/PHOTO_REQUIRED/);
const ph=(await db.query("insert into factory_auto_photos(dish,dish_key,category,image_url,credit) values('두부볶음','두부볶음','family','https://example.com/a.jpg','직접 촬영') returning id")).rows[0];
await db.query("update factory_auto_jobs set photo_id=$1,image_url='https://example.com/a.jpg' where id=$2",[ph.id,j.id]);
await db.exec('update factory_auto_settings set enabled=false');
await assert.rejects(()=>db.query('select factory_auto_publish($1,false)',[j.id]),/PAUSED/);
await db.exec('update factory_auto_settings set enabled=true');
const a=(await db.query('select factory_auto_publish($1,false) as r',[j.id])).rows[0].r;
const b=(await db.query('select factory_auto_publish($1,false) as r',[j.id])).rows[0].r;
assert.equal(a.recipe_id,b.recipe_id);
const row=(await db.query('select * from recipes')).rows[0];assert(row.body.includes('1) 준비합니다.\n\n2) 익힙니다.'));assert.equal(row.target,'온 가족');
assert.equal((await db.query('select count(*) from recipes')).rows[0].count,1);
const j2=(await db.query('select factory_auto_claim(2) as j')).rows[0].j;
await db.query("update factory_auto_jobs set status='ready',draft=$1,dish_key='두부볶음2',photo_id=$2,image_url='https://example.com/a.jpg' where id=$3",[draft,ph.id,j2.id]);
await db.exec('update factory_auto_settings set daily_limit=1');
await assert.rejects(()=>db.query('select factory_auto_publish($1,true)',[j2.id]),/DAILY_LIMIT/);
await db.exec('update factory_auto_settings set daily_limit=10');
await assert.rejects(()=>db.query('select factory_auto_publish($1,true)',[j2.id]),/PHOTO_REQUIRED/);
await assert.rejects(()=>db.query("update factory_auto_jobs set dish_key='두부볶음' where id=$1",[j2.id]),/unique/);
// Public and signed-in users cannot read settings or call publishing functions.
await db.exec('set role anon');
await assert.rejects(()=>db.query('select * from factory_auto_settings'),/permission denied/);
await assert.rejects(()=>db.query('select factory_auto_claim(3)'),/permission denied/);
await db.exec('reset role');
console.log('SQL: pause, daily limit, idempotency, photo matching, duplicate and RLS checks passed');
await db.close();
