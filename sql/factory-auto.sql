-- Run once in Supabase SQL Editor. Does not modify existing recipes or their RLS.
create table if not exists public.factory_auto_settings (
 id boolean primary key default true check(id), enabled boolean not null default false,
 daily_limit integer not null default 10 check(daily_limit between 1 and 10),
 image_mode text not null default 'approved' check(image_mode in ('approved','ai')),
 owner_id uuid references auth.users(id), updated_at timestamptz not null default now()
);
insert into public.factory_auto_settings(id) values(true) on conflict do nothing;
create table if not exists public.factory_auto_photos (
 id uuid primary key default gen_random_uuid(), dish text not null,
 dish_key text not null unique, category text not null check(category in ('family','kids','quick','snack')),
 image_url text not null, credit text not null, enabled boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.factory_auto_jobs (
 id uuid primary key default gen_random_uuid(), run_date date not null, slot integer not null check(slot between 1 and 10),
 category text not null, status text not null default 'running' check(status in ('running','review','ready','published','failed','discarded')),
 draft jsonb, dish_key text, image_url text, photo_id uuid references public.factory_auto_photos(id),
 reason text, recipe_id text, created_at timestamptz not null default now(), published_at timestamptz,
 unique(run_date,slot)
);
create unique index if not exists factory_auto_unique_dish on public.factory_auto_jobs(dish_key) where dish_key is not null and status <> 'discarded';
alter table public.factory_auto_settings enable row level security;
alter table public.factory_auto_photos enable row level security;
alter table public.factory_auto_jobs enable row level security;
revoke all on public.factory_auto_settings, public.factory_auto_photos, public.factory_auto_jobs from public, anon, authenticated;
grant all on public.factory_auto_settings, public.factory_auto_photos, public.factory_auto_jobs to service_role;

create or replace function public.factory_auto_claim(p_slot integer) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare cfg public.factory_auto_settings; j public.factory_auto_jobs; today date:=(now() at time zone 'Asia/Seoul')::date;
begin
 select * into cfg from public.factory_auto_settings where id=true for update;
 if not cfg.enabled or cfg.owner_id is null or p_slot<1 or p_slot>cfg.daily_limit then return null; end if;
 insert into public.factory_auto_jobs(run_date,slot,category)
 values(today,p_slot,case when p_slot<=3 then 'family' when p_slot<=6 then 'kids' when p_slot<=8 then 'quick' else 'snack' end)
 on conflict(run_date,slot) do nothing returning * into j;
 return case when j.id is null then null else to_jsonb(j) end;
end $$;

-- Insert recipe and mark job published in ONE transaction. Repeated calls return same ID.
create or replace function public.factory_auto_publish(p_job uuid, p_reviewed boolean default false) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare cfg public.factory_auto_settings; j public.factory_auto_jobs; ph public.factory_auto_photos;
 rid text; n integer; body_text text; today date:=(now() at time zone 'Asia/Seoul')::date;
begin
 select * into cfg from public.factory_auto_settings where id=true for update;
 select * into j from public.factory_auto_jobs where id=p_job for update;
 if j.id is null then raise exception 'JOB_NOT_FOUND'; end if;
 if j.status='published' then return jsonb_build_object('recipe_id',j.recipe_id,'already_published',true); end if;
 if cfg.owner_id is null then raise exception 'OWNER_MISSING'; end if;
 if not p_reviewed and not cfg.enabled then raise exception 'PAUSED'; end if;
 if not p_reviewed and j.run_date<>today then raise exception 'EXPIRED_RUN'; end if;
 if j.status not in ('review','ready') or (not p_reviewed and j.status<>'ready') then raise exception 'NOT_READY'; end if;
 select count(*) into n from public.factory_auto_jobs where status='published' and (published_at at time zone 'Asia/Seoul')::date=today;
 if n>=cfg.daily_limit then raise exception 'DAILY_LIMIT'; end if;
 select * into ph from public.factory_auto_photos where id=j.photo_id and enabled=true;
 if ph.id is null or ph.dish_key<>j.dish_key or ph.image_url<>j.image_url then raise exception 'PHOTO_REQUIRED'; end if;
 if j.draft is null or length(j.draft->>'title')<2 or jsonb_array_length(j.draft->'ingredients')<2 or jsonb_array_length(j.draft->'steps')<2 then raise exception 'INVALID_DRAFT'; end if;
 if exists(select 1 from public.recipes where regexp_replace(lower(title),'[^가-힣a-z0-9]','','g')=j.dish_key) then raise exception 'DUPLICATE'; end if;
 body_text:=format('조리시간: %s분 · %s인분 · %s',j.draft->>'time_min',j.draft->>'servings',j.draft->>'level')
 ||E'\n\n재료\n'||(select string_agg(value,E'\n' order by ord) from jsonb_array_elements_text(j.draft->'ingredients') with ordinality as t(value,ord))
 ||E'\n\n만드는 법\n'||(select string_agg(ord::text||') '||regexp_replace(value,'^\s*[0-9]+[.)]\s*',''),E'\n\n' order by ord) from jsonb_array_elements_text(j.draft->'steps') with ordinality as t(value,ord))
 ||E'\n\n요리 팁\n'||coalesce(j.draft->>'tip','')
 ||E'\n\nAI 작성 콘텐츠'||case when p_reviewed then ' · 운영자 확인' else ' · 자동 등록 (사람의 조리 검증을 거치지 않음)' end
 ||E'\n사진: '||ph.credit;
 insert into public.recipes(user_id,title,body,target,image_url)
 values(cfg.owner_id,j.draft->>'title',body_text,case j.category when 'kids' then '아이' when 'snack' then '아이 간식' else '온 가족' end,j.image_url)
 returning id::text into rid;
 update public.factory_auto_jobs set status='published',published_at=now(),recipe_id=rid,reason=null where id=j.id;
 return jsonb_build_object('recipe_id',rid);
end $$;
revoke all on function public.factory_auto_claim(integer) from public,anon,authenticated;
revoke all on function public.factory_auto_publish(uuid,boolean) from public,anon,authenticated;
grant execute on function public.factory_auto_claim(integer) to service_role;
grant execute on function public.factory_auto_publish(uuid,boolean) to service_role;
