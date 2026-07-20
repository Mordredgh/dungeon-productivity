-- Combate persistente: el navegador anima; Supabase conserva HP, victoria y recompensa.
create table if not exists public.dungeon_boss_actions (
  id uuid primary key default gen_random_uuid(),
  hero_id uuid not null references public.dungeon_heroes(id) on delete cascade,
  request_id uuid not null,
  cycle text not null check (cycle in ('daily','weekly','monthly')),
  boss_key text not null,
  damage integer not null check (damage between 1 and 50000),
  hp_after integer not null check (hp_after >= 0),
  created_at timestamptz not null default now(),
  unique (hero_id, request_id)
);
alter table public.dungeon_boss_actions enable row level security;
drop policy if exists dungeon_boss_actions_read_owner on public.dungeon_boss_actions;
create policy dungeon_boss_actions_read_owner on public.dungeon_boss_actions for select to authenticated using (
  exists (select 1 from public.dungeon_heroes h where h.id=dungeon_boss_actions.hero_id and h.user_id=auth.uid())
);

create table if not exists public.dungeon_boss_rewards (
  id uuid primary key default gen_random_uuid(),
  hero_id uuid not null references public.dungeon_heroes(id) on delete cascade,
  cycle text not null check (cycle in ('daily','weekly','monthly')),
  period_key text not null,
  boss_key text not null,
  xp_awarded integer not null check (xp_awarded >= 0 and xp_awarded <= 5000),
  gold_awarded integer not null check (gold_awarded >= 0 and gold_awarded <= 2000),
  created_at timestamptz not null default now(),
  unique (hero_id, cycle, period_key)
);
alter table public.dungeon_boss_rewards enable row level security;
drop policy if exists dungeon_boss_rewards_read_owner on public.dungeon_boss_rewards;
create policy dungeon_boss_rewards_read_owner on public.dungeon_boss_rewards for select to authenticated using (
  exists (select 1 from public.dungeon_heroes h where h.id=dungeon_boss_rewards.hero_id and h.user_id=auth.uid())
);

create or replace function public.apply_dungeon_boss_damage(
  p_cycle text, p_boss_key text, p_period_key text, p_rarity text, p_damage integer, p_request_id uuid
)
returns table (hp integer, max_hp integer, defeated boolean, xp_awarded integer, gold_awarded integer, xp_total integer, gold integer, level integer, boss_state jsonb)
language plpgsql security definer set search_path=public as $$
declare
  v_hero public.dungeon_heroes%rowtype; v_state jsonb; v_boss jsonb; v_allowed text[];
  v_max integer; v_hp integer; v_damage integer; v_defeated boolean; v_xp integer:=0; v_gold integer:=0;
  v_total integer; v_level integer; v_old_action public.dungeon_boss_actions%rowtype;
begin
  if auth.uid() is null then raise exception 'Autenticación requerida'; end if;
  if p_cycle not in ('daily','weekly','monthly') or p_request_id is null then raise exception 'Solicitud inválida'; end if;
  select * into v_hero from public.dungeon_heroes where user_id=auth.uid() for update;
  if not found then raise exception 'Héroe no encontrado'; end if;
  select * into v_old_action from public.dungeon_boss_actions where hero_id=v_hero.id and request_id=p_request_id;
  if found then
    begin v_state:=coalesce(v_hero.boss_state::jsonb,'{}'::jsonb); exception when others then v_state:='{}'::jsonb; end;
    v_boss:=coalesce(v_state->p_cycle,'{}'::jsonb);
    return query select v_old_action.hp_after,coalesce((v_boss->>'maxHp')::integer,0),coalesce((v_boss->>'defeated')::boolean,false),0,0,coalesce(v_hero.xp_total,0),coalesce(v_hero.gold,0),coalesce(v_hero.level,1),v_state;
    return;
  end if;
  v_allowed:=case p_cycle when 'daily' then array['comun','raro'] when 'weekly' then array['epico','legendario'] else array['mitico','cataclismo'] end;
  if p_rarity <> all(v_allowed) or p_boss_key !~ '^[a-z0-9-]{3,64}$' then raise exception 'Jefe inválido para este ciclo'; end if;
  v_max:=round((case p_rarity when 'comun' then 80 when 'raro' then 150 when 'epico' then 600 when 'legendario' then 1000 when 'mitico' then 2500 else 4200 end) * (1 + greatest(coalesce(v_hero.level,1)-1,0) * 0.03));
  if p_damage not between 1 and greatest(1,ceil(v_max * 0.40)) then raise exception 'Daño fuera de rango'; end if;
  begin v_state:=coalesce(v_hero.boss_state::jsonb,'{}'::jsonb); exception when others then v_state:='{}'::jsonb; end;
  v_boss:=v_state->p_cycle;
  if v_boss is null or coalesce(v_boss->>'periodKey','') <> p_period_key then
    v_boss:=jsonb_build_object('key',p_boss_key,'rarity',p_rarity,'hp',v_max,'maxHp',v_max,'defeated',false,'periodKey',p_period_key);
  elsif coalesce(v_boss->>'key','') <> p_boss_key or coalesce(v_boss->>'rarity','') <> p_rarity then
    raise exception 'El jefe activo no coincide';
  end if;
  v_hp:=coalesce((v_boss->>'hp')::integer,v_max); v_defeated:=coalesce((v_boss->>'defeated')::boolean,false);
  if v_defeated then raise exception 'Este jefe ya fue derrotado'; end if;
  v_damage:=least(p_damage,v_hp); v_hp:=v_hp-v_damage; v_defeated:=v_hp=0;
  if v_defeated then
    v_xp:=case p_rarity when 'comun' then 80 when 'raro' then 160 when 'epico' then 400 when 'legendario' then 700 when 'mitico' then 1800 else 4000 end;
    v_gold:=case p_rarity when 'comun' then 40 when 'raro' then 80 when 'epico' then 180 when 'legendario' then 300 when 'mitico' then 700 else 1500 end;
    insert into public.dungeon_boss_rewards(hero_id,cycle,period_key,boss_key,xp_awarded,gold_awarded) values(v_hero.id,p_cycle,p_period_key,p_boss_key,v_xp,v_gold);
  end if;
  v_boss:=jsonb_set(jsonb_set(v_boss,'{hp}',to_jsonb(v_hp),true),'{defeated}',to_jsonb(v_defeated),true); v_state:=jsonb_set(v_state,array[p_cycle],v_boss,true);
  v_total:=coalesce(v_hero.xp_total,0)+v_xp; v_level:=public.dungeon_level_for_xp(v_total);
  update public.dungeon_heroes set boss_state=v_state::text,xp_total=v_total,gold=coalesce(v_hero.gold,0)+v_gold,level=v_level where id=v_hero.id;
  insert into public.dungeon_boss_actions(hero_id,request_id,cycle,boss_key,damage,hp_after) values(v_hero.id,p_request_id,p_cycle,p_boss_key,v_damage,v_hp);
  return query select v_hp,v_max,v_defeated,v_xp,v_gold,v_total,coalesce(v_hero.gold,0)+v_gold,v_level,v_state;
end $$;
revoke all on function public.apply_dungeon_boss_damage(text,text,text,text,integer,uuid) from public;
grant execute on function public.apply_dungeon_boss_damage(text,text,text,text,integer,uuid) to authenticated;
