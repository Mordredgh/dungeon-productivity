-- Reclamos idempotentes. El cliente puede mostrar progreso, nunca acreditar dos veces.
create table if not exists public.dungeon_reward_claims (
  id uuid primary key default gen_random_uuid(),
  hero_id uuid not null references public.dungeon_heroes(id) on delete cascade,
  source text not null check (source in ('challenge','faction','streak')),
  reward_key text not null,
  xp_awarded integer not null check (xp_awarded between 0 and 5000),
  gold_awarded integer not null check (gold_awarded between 0 and 2000),
  created_at timestamptz not null default now(),
  unique (hero_id, source, reward_key)
);
alter table public.dungeon_reward_claims enable row level security;
drop policy if exists dungeon_reward_claims_read_owner on public.dungeon_reward_claims;
create policy dungeon_reward_claims_read_owner on public.dungeon_reward_claims for select to authenticated using (exists (select 1 from public.dungeon_heroes h where h.id=dungeon_reward_claims.hero_id and h.user_id=auth.uid()));

create or replace function public.claim_dungeon_reward(p_source text,p_reward_key text)
returns table (xp_awarded integer,gold_awarded integer,xp_total integer,gold integer,level integer)
language plpgsql security definer set search_path=public as $$
declare v_hero public.dungeon_heroes%rowtype; v_xp integer; v_gold integer; v_total integer; v_level integer; v_exists boolean;
begin
 if auth.uid() is null then raise exception 'Autenticación requerida'; end if;
 select * into v_hero from public.dungeon_heroes where user_id=auth.uid() for update;
 if not found then raise exception 'Héroe no encontrado'; end if;
 select exists(select 1 from public.dungeon_reward_claims where hero_id=v_hero.id and source=p_source and reward_key=p_reward_key) into v_exists;
 if v_exists then raise exception 'Recompensa ya reclamada'; end if;
 if p_source='challenge' then
   select x.xp,x.gold into v_xp,v_gold from (values ('quest30',500,200),('streak30',800,300),('pom30',400,150),('main10',600,250),('habit30',350,120),('xp5000',1000,400),('boss3',750,350),('daily50',450,180)) x(k,xp,gold) where x.k=p_reward_key;
   if v_xp is null or not exists(select 1 from jsonb_array_elements(coalesce(nullif(v_hero.challenges,'')::jsonb,'[]'::jsonb)) c where c->>'id'=p_reward_key and coalesce((c->>'completed')::boolean,false) and not coalesce((c->>'rewarded')::boolean,false)) then raise exception 'Reto no elegible'; end if;
 elsif p_source='faction' then
   select x.xp,x.gold into v_xp,v_gold from (values ('campeones',250,150),('mercaderes',150,300),('disciplina',100,80),('cronicas',200,200)) x(k,xp,gold) where x.k=p_reward_key;
   if v_xp is null or not exists(select 1 from jsonb_array_elements(coalesce(v_hero.faction_claims,'[]'::jsonb)) c where c->>'id'=p_reward_key and coalesce((c->>'done')::boolean,false) and not coalesce((c->>'rewarded')::boolean,false)) then raise exception 'Contrato no elegible'; end if;
 elsif p_source='streak' then
   select x.xp,x.gold into v_xp,v_gold from (values ('3',50,30),('7',120,80),('14',250,150),('21',350,220),('30',500,350),('60',1000,700),('100',2000,1200)) x(k,xp,gold) where x.k=p_reward_key;
   if v_xp is null or coalesce(v_hero.streak,0)<p_reward_key::integer then raise exception 'Racha insuficiente'; end if;
 else raise exception 'Origen inválido'; end if;
 v_total:=coalesce(v_hero.xp_total,0)+v_xp; v_level:=public.dungeon_level_for_xp(v_total);
 update public.dungeon_heroes set xp_total=v_total,gold=coalesce(v_hero.gold,0)+v_gold,level=v_level where id=v_hero.id;
 insert into public.dungeon_reward_claims(hero_id,source,reward_key,xp_awarded,gold_awarded) values(v_hero.id,p_source,p_reward_key,v_xp,v_gold);
 return query select v_xp,v_gold,v_total,coalesce(v_hero.gold,0)+v_gold,v_level;
end $$;
revoke all on function public.claim_dungeon_reward(text,text) from public;
grant execute on function public.claim_dungeon_reward(text,text) to authenticated;
