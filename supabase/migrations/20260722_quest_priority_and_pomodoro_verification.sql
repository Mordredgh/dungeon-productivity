-- complete_dungeon_quest: tope diario server-side por rareza, multiplicador de prioridad
-- en XP/oro (antes solo controlaba cantidad de botín), y bono de 100% vs 50% según si
-- la misión tiene un Pomodoro real vinculado ese mismo día (tag #pom-ok-YYYY-MM-DD,
-- puesto por savePom() en el cliente cuando termina un pomodoro con timer.activeQuest set).
create or replace function public.complete_dungeon_quest(p_quest_id uuid)
returns table (
  done_at timestamp with time zone,
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
  v_prio_mult numeric;
  v_prio_cap integer;
  v_prio_count integer;
  v_negative_habit boolean := false;
  v_verified boolean := false;
  v_total integer;
  v_level integer := 1;
  v_threshold integer := 0;
  v_now timestamptz := now();
begin
  if auth.uid() is null then raise exception 'Autenticacion requerida'; end if;

  select * into v_hero from public.dungeon_heroes where user_id = auth.uid() for update;
  if not found then raise exception 'Heroe no encontrado'; end if;

  select * into v_quest from public.dungeon_quests where id = p_quest_id and hero_id = v_hero.id for update;
  if not found then raise exception 'Mision no encontrada'; end if;
  if coalesce(v_quest.done, false) then raise exception 'La mision ya fue completada'; end if;

  -- Tope diario por rareza — evita marcar todo Épico/Legendario/Mítico sin límite.
  v_prio_cap := case v_quest.priority
    when 'epico' then 3
    when 'legendario' then 1
    when 'mitico' then 1
    else null
  end;
  if v_prio_cap is not null then
    select count(*) into v_prio_count
    from public.dungeon_quests
    where hero_id = v_hero.id
      and priority = v_quest.priority
      and done = true
      and done_at >= date_trunc('day', v_now)
      and done_at < date_trunc('day', v_now) + interval '1 day';
    if v_prio_count >= v_prio_cap then
      raise exception 'Tope diario de misiones % alcanzado (% de %)', v_quest.priority, v_prio_count, v_prio_cap;
    end if;
  end if;

  v_xp := case v_quest.type
    when 'main' then 100 when 'side' then 50 when 'daily' then 25
    when 'weekly' then 75 when 'habit' then 20 else 50
  end;
  v_gold := case v_quest.type
    when 'main' then 50 when 'side' then 20 when 'daily' then 10
    when 'weekly' then 35 when 'habit' then 8 else 10
  end;

  if coalesce(v_quest.tags, '') like '%mision-del-dia%' then
    v_xp := 60; v_gold := 30;
  end if;

  v_negative_habit := v_quest.type = 'habit' and lower(coalesce(v_quest.tags, '')) like '%habit-%';
  if v_negative_habit then v_xp := 0; v_gold := 0; end if;

  -- Prioridad ahora sí escala XP/oro, no solo cantidad de botín.
  v_prio_mult := case v_quest.priority
    when 'comun' then 0.8 when 'normal' then 1.0 when 'epico' then 1.3
    when 'legendario' then 1.6 when 'mitico' then 2.0 else 1.0
  end;
  v_xp := round(v_xp * v_prio_mult);
  v_gold := round(v_gold * v_prio_mult);

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

  -- Recompensa completa solo si un Pomodoro real vinculado a esta misión terminó hoy.
  v_verified := coalesce(v_quest.tags,'') like '%pom-ok-' || to_char(v_now,'YYYY-MM-DD') || '%';
  if not v_verified and not v_negative_habit then
    v_xp := greatest(1, round(v_xp * 0.5));
    v_gold := greatest(0, round(v_gold * 0.5));
  end if;

  v_total := coalesce(v_hero.xp_total, 0) + v_xp;
  while v_level < 50 loop
    v_threshold := v_threshold + round(80 + 3.5 * v_level * v_level);
    exit when v_total < v_threshold;
    v_level := v_level + 1;
  end loop;

  update public.dungeon_quests set done = true, done_at = v_now where id = v_quest.id;
  update public.dungeon_heroes
  set xp_total = v_total,
      level = v_level,
      gold = coalesce(v_hero.gold, 0) + v_gold,
      quests_done = coalesce(v_hero.quests_done, 0) + case when v_negative_habit then 0 else 1 end,
      main_done = coalesce(v_hero.main_done, 0) + case when v_quest.type = 'main' then 1 else 0 end
  where id = v_hero.id;

  insert into public.dungeon_reward_ledger(hero_id, source, source_id, xp_awarded, gold_awarded)
  values (v_hero.id, 'quest', gen_random_uuid(), v_xp, v_gold);

  return query select v_now, v_xp, v_gold, v_total,
    coalesce(v_hero.gold, 0) + v_gold, v_level,
    coalesce(v_hero.quests_done, 0) + case when v_negative_habit then 0 else 1 end,
    coalesce(v_hero.main_done, 0) + case when v_quest.type = 'main' then 1 else 0 end;
end;
$$;
