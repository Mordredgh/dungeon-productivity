-- Economía autoritativa, etapa 1: una misión sólo puede acreditar su
-- recompensa desde Supabase. No se aceptan cantidades de XP/oro del cliente.

create table if not exists public.dungeon_reward_ledger (
  id uuid primary key default gen_random_uuid(),
  hero_id uuid not null references public.dungeon_heroes(id) on delete cascade,
  source text not null check (char_length(source) between 1 and 48),
  source_id uuid not null,
  xp_awarded integer not null default 0 check (xp_awarded >= 0 and xp_awarded <= 500),
  gold_awarded integer not null default 0 check (gold_awarded >= 0 and gold_awarded <= 250),
  created_at timestamptz not null default now(),
  unique (hero_id, source, source_id)
);

create index if not exists dungeon_reward_ledger_hero_created_idx
  on public.dungeon_reward_ledger(hero_id, created_at desc);

alter table public.dungeon_reward_ledger enable row level security;

drop policy if exists dungeon_reward_ledger_read_owner on public.dungeon_reward_ledger;
create policy dungeon_reward_ledger_read_owner on public.dungeon_reward_ledger
for select to authenticated
using (exists (
  select 1 from public.dungeon_heroes h
  where h.id = dungeon_reward_ledger.hero_id and h.user_id = auth.uid()
));

create or replace function public.complete_dungeon_quest(p_quest_id uuid)
returns table (
  done_at timestamptz,
  xp_awarded integer,
  gold_awarded integer,
  xp_total integer,
  gold integer,
  level integer,
  quests_done integer,
  main_done integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hero public.dungeon_heroes%rowtype;
  v_quest public.dungeon_quests%rowtype;
  v_xp integer;
  v_gold integer;
  v_negative_habit boolean := false;
  v_total integer;
  v_level integer := 1;
  v_threshold integer := 0;
  v_now timestamptz := now();
begin
  if auth.uid() is null then
    raise exception 'Autenticación requerida';
  end if;

  select * into v_hero
  from public.dungeon_heroes
  where user_id = auth.uid()
  for update;
  if not found then
    raise exception 'Héroe no encontrado';
  end if;

  select * into v_quest
  from public.dungeon_quests
  where id = p_quest_id and hero_id = v_hero.id
  for update;
  if not found then
    raise exception 'Misión no encontrada';
  end if;
  if coalesce(v_quest.done, false) then
    raise exception 'La misión ya fue completada';
  end if;

  -- Reglas base del juego. Los modificadores cosméticos o locales no alteran
  -- el saldo: una cuenta no puede fabricar multiplicadores en el navegador.
  v_xp := case v_quest.type
    when 'main' then 100
    when 'side' then 50
    when 'daily' then 25
    when 'weekly' then 75
    when 'habit' then 20
    else 50
  end;
  v_gold := case v_quest.type
    when 'main' then 50
    when 'side' then 20
    when 'daily' then 10
    when 'weekly' then 35
    when 'habit' then 8
    else 10
  end;

  if coalesce(v_quest.tags, '') like '%mision-del-dia%' then
    v_xp := 60;
    v_gold := 30;
  end if;
  v_negative_habit := v_quest.type = 'habit' and lower(coalesce(v_quest.tags, '')) like '%habit-%';
  if v_negative_habit then
    v_xp := 0;
    v_gold := 0;
  end if;

  -- Bonus de clase y raza que viven en el héroe, no en el cliente.
  if v_hero.hero_class = 'mago' or v_hero.hero_class = 'fundador' then
    v_xp := round(v_xp * 1.10);
  elsif v_hero.hero_class = 'guerrero' and v_quest.type = 'main' then
    v_xp := round(v_xp * 1.10);
  elsif v_hero.hero_class = 'picaro' and v_quest.type = 'side' then
    v_xp := round(v_xp * 1.10);
  elsif v_hero.hero_class = 'arquero' and v_quest.type = 'weekly' then
    v_xp := round(v_xp * 1.10);
  elsif v_hero.hero_class = 'clerigo' and v_quest.type = 'daily' then
    v_xp := round(v_xp * 1.05);
  end if;
  if coalesce(v_hero.race, 'humano') = 'humano' then
    v_xp := round(v_xp * 1.10);
  end if;

  v_total := coalesce(v_hero.xp_total, 0) + v_xp;
  while v_level < 50 loop
    v_threshold := v_threshold + round(80 + 3.5 * v_level * v_level);
    exit when v_total < v_threshold;
    v_level := v_level + 1;
  end loop;

  update public.dungeon_quests
  set done = true, done_at = v_now
  where id = v_quest.id;

  update public.dungeon_heroes
  set xp_total = v_total,
      level = v_level,
      gold = coalesce(v_hero.gold, 0) + v_gold,
      quests_done = coalesce(v_hero.quests_done, 0) + case when v_negative_habit then 0 else 1 end,
      main_done = coalesce(v_hero.main_done, 0) + case when v_quest.type = 'main' then 1 else 0 end
  where id = v_hero.id;

  insert into public.dungeon_reward_ledger(hero_id, source, source_id, xp_awarded, gold_awarded)
  values (v_hero.id, 'quest', v_quest.id, v_xp, v_gold);

  return query select v_now, v_xp, v_gold, v_total,
    coalesce(v_hero.gold, 0) + v_gold, v_level,
    coalesce(v_hero.quests_done, 0) + case when v_negative_habit then 0 else 1 end,
    coalesce(v_hero.main_done, 0) + case when v_quest.type = 'main' then 1 else 0 end;
end;
$$;

revoke all on function public.complete_dungeon_quest(uuid) from public;
grant execute on function public.complete_dungeon_quest(uuid) to authenticated;

create or replace function public.undo_dungeon_quest(p_quest_id uuid)
returns table (
  xp_total integer,
  gold integer,
  level integer,
  quests_done integer,
  main_done integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hero public.dungeon_heroes%rowtype;
  v_quest public.dungeon_quests%rowtype;
  v_reward public.dungeon_reward_ledger%rowtype;
  v_level integer := 1;
  v_threshold integer := 0;
  v_total integer;
begin
  if auth.uid() is null then raise exception 'Autenticación requerida'; end if;
  select * into v_hero from public.dungeon_heroes where user_id = auth.uid() for update;
  if not found then raise exception 'Héroe no encontrado'; end if;
  select * into v_quest from public.dungeon_quests where id = p_quest_id and hero_id = v_hero.id for update;
  if not found or not coalesce(v_quest.done, false) then raise exception 'Misión no reversible'; end if;
  select * into v_reward from public.dungeon_reward_ledger
  where hero_id = v_hero.id and source = 'quest' and source_id = p_quest_id
    and created_at >= now() - interval '6 seconds'
  for update;
  if not found then raise exception 'La ventana para deshacer terminó'; end if;

  v_total := greatest(0, coalesce(v_hero.xp_total, 0) - v_reward.xp_awarded);
  while v_level < 50 loop
    v_threshold := v_threshold + round(80 + 3.5 * v_level * v_level);
    exit when v_total < v_threshold;
    v_level := v_level + 1;
  end loop;

  update public.dungeon_quests set done = false, done_at = null where id = v_quest.id;
  update public.dungeon_heroes
  set xp_total = v_total,
      level = v_level,
      gold = greatest(0, coalesce(v_hero.gold, 0) - v_reward.gold_awarded),
      quests_done = greatest(0, coalesce(v_hero.quests_done, 0) - 1),
      main_done = greatest(0, coalesce(v_hero.main_done, 0) - case when v_quest.type = 'main' then 1 else 0 end)
  where id = v_hero.id;
  delete from public.dungeon_reward_ledger where id = v_reward.id;

  return query select v_total,
    greatest(0, coalesce(v_hero.gold, 0) - v_reward.gold_awarded), v_level,
    greatest(0, coalesce(v_hero.quests_done, 0) - 1),
    greatest(0, coalesce(v_hero.main_done, 0) - case when v_quest.type = 'main' then 1 else 0 end);
end;
$$;

revoke all on function public.undo_dungeon_quest(uuid) from public;
grant execute on function public.undo_dungeon_quest(uuid) to authenticated;
