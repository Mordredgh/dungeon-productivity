CREATE OR REPLACE FUNCTION public.assert_dungeon_rpc_rate_limit(p_rpc_name text, p_max integer, p_window_seconds integer DEFAULT 60)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_hero uuid; v_start timestamptz; v_calls integer;
begin
  if auth.uid() is null then raise exception 'Autenticación requerida'; end if;
  if p_rpc_name not in ('purchase','forge','sala_purchase','boss_attack','reward_claim','class_change','grant_currency','craft_rune','quest_complete','quest_undo','streak_adjust','pom_start','pom_complete','daily_streak') then raise exception 'RPC no permitido'; end if;
  select id into v_hero from public.dungeon_heroes where user_id=auth.uid() for update;
  if v_hero is null then raise exception 'Héroe no encontrado'; end if;
  v_start := to_timestamp(floor(extract(epoch from now()) / greatest(1,p_window_seconds)) * greatest(1,p_window_seconds));
  insert into public.dungeon_rpc_rate_limits(hero_id,rpc_name,window_start,calls)
  values(v_hero,p_rpc_name,v_start,1)
  on conflict (hero_id,rpc_name,window_start) do update set calls=public.dungeon_rpc_rate_limits.calls+1
  returning calls into v_calls;
  if v_calls > greatest(1,p_max) then raise exception 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.' using errcode='P0001'; end if;
  delete from public.dungeon_rpc_rate_limits where hero_id=v_hero and window_start < now() - interval '10 minutes';
end $function$;

CREATE OR REPLACE FUNCTION public.complete_dungeon_quest(p_quest_id uuid)
 RETURNS TABLE(done_at timestamp with time zone, xp_awarded integer, gold_awarded integer, xp_total integer, gold integer, level integer, quests_done integer, main_done integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ declare v_hero public.dungeon_heroes%rowtype; v_quest public.dungeon_quests%rowtype; v_xp integer; v_gold integer; v_prio_mult numeric; v_prio_cap integer; v_prio_count integer; v_negative_habit boolean := false; v_verified boolean := false; v_total integer; v_level integer := 1; v_threshold integer := 0; v_now timestamptz := now(); begin
  perform public.assert_dungeon_rpc_rate_limit('quest_complete', 60, 60);
 if auth.uid() is null then raise exception 'Autenticacion requerida'; end if; select * into v_hero from public.dungeon_heroes where user_id = auth.uid() for update; if not found then raise exception 'Heroe no encontrado'; end if; select * into v_quest from public.dungeon_quests where id = p_quest_id and hero_id = v_hero.id for update; if not found then raise exception 'Mision no encontrada'; end if; if coalesce(v_quest.done, false) then raise exception 'La mision ya fue completada'; end if; v_prio_cap := case v_quest.priority when 'epico' then 3 when 'legendario' then 1 when 'mitico' then 1 else null end; if v_prio_cap is not null then select count(*) into v_prio_count from public.dungeon_quests where hero_id = v_hero.id and priority = v_quest.priority and done = true and done_at >= date_trunc('day', v_now) and done_at < date_trunc('day', v_now) + interval '1 day'; if v_prio_count >= v_prio_cap then raise exception 'Tope diario de misiones % alcanzado (% de %)', v_quest.priority, v_prio_count, v_prio_cap; end if; end if; v_xp := case v_quest.type when 'main' then 100 when 'side' then 50 when 'daily' then 25 when 'weekly' then 75 when 'habit' then 20 else 50 end; v_gold := case v_quest.type when 'main' then 50 when 'side' then 20 when 'daily' then 10 when 'weekly' then 35 when 'habit' then 8 else 10 end; if coalesce(v_quest.tags, '') like '%mision-del-dia%' then v_xp := 60; v_gold := 30; end if; v_negative_habit := v_quest.type = 'habit' and lower(coalesce(v_quest.tags, '')) like '%habit-%'; if v_negative_habit then v_xp := 0; v_gold := 0; end if; v_prio_mult := case v_quest.priority when 'comun' then 0.8 when 'normal' then 1.0 when 'epico' then 1.3 when 'legendario' then 1.6 when 'mitico' then 2.0 else 1.0 end; v_xp := round(v_xp * v_prio_mult); v_gold := round(v_gold * v_prio_mult); if v_hero.hero_class = 'mago' or v_hero.hero_class = 'fundador' then v_xp := round(v_xp * 1.10); elsif v_hero.hero_class = 'guerrero' and v_quest.type = 'main' then v_xp := round(v_xp * 1.10); elsif v_hero.hero_class = 'picaro' and v_quest.type = 'side' then v_xp := round(v_xp * 1.10); elsif v_hero.hero_class = 'arquero' and v_quest.type = 'weekly' then v_xp := round(v_xp * 1.10); elsif v_hero.hero_class = 'clerigo' and v_quest.type = 'daily' then v_xp := round(v_xp * 1.05); end if; if coalesce(v_hero.race, 'humano') = 'humano' then v_xp := round(v_xp * 1.10); end if; v_verified := coalesce(v_quest.tags,'') like '%pom-ok-' || to_char(v_now,'YYYY-MM-DD') || '%'; if not v_verified and not v_negative_habit then v_xp := greatest(1, round(v_xp * 0.5)); v_gold := greatest(0, round(v_gold * 0.5)); end if; v_total := coalesce(v_hero.xp_total, 0) + v_xp; while v_level < 50 loop v_threshold := v_threshold + round(80 + 3.5 * v_level * v_level); exit when v_total < v_threshold; v_level := v_level + 1; end loop; update public.dungeon_quests set done = true, done_at = v_now where id = v_quest.id; update public.dungeon_heroes set xp_total = v_total, level = v_level, gold = coalesce(v_hero.gold, 0) + v_gold, quests_done = coalesce(v_hero.quests_done, 0) + case when v_negative_habit then 0 else 1 end, main_done = coalesce(v_hero.main_done, 0) + case when v_quest.type = 'main' then 1 else 0 end where id = v_hero.id; insert into public.dungeon_reward_ledger(hero_id, source, source_id, xp_awarded, gold_awarded) values (v_hero.id, 'quest', gen_random_uuid(), v_xp, v_gold); return query select v_now, v_xp, v_gold, v_total, coalesce(v_hero.gold, 0) + v_gold, v_level, coalesce(v_hero.quests_done, 0) + case when v_negative_habit then 0 else 1 end, coalesce(v_hero.main_done, 0) + case when v_quest.type = 'main' then 1 else 0 end; end; $function$;

CREATE OR REPLACE FUNCTION public.undo_dungeon_quest(p_quest_id uuid)
 RETURNS TABLE(xp_total integer, gold integer, level integer, quests_done integer, main_done integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ declare v_hero public.dungeon_heroes%rowtype; v_quest public.dungeon_quests%rowtype; v_reward public.dungeon_reward_ledger%rowtype; v_negative_habit boolean := false; v_level integer := 1; v_threshold integer := 0; v_total integer; v_new_gold integer; begin
  perform public.assert_dungeon_rpc_rate_limit('quest_undo', 30, 60);
 if auth.uid() is null then raise exception 'Autenticacion requerida'; end if; select * into v_hero from public.dungeon_heroes where user_id = auth.uid() for update; if not found then raise exception 'Heroe no encontrado'; end if; select * into v_quest from public.dungeon_quests where id = p_quest_id and hero_id = v_hero.id for update; if not found or not coalesce(v_quest.done, false) then raise exception 'Mision no reversible'; end if; select * into v_reward from public.dungeon_reward_ledger where hero_id = v_hero.id and source = 'quest' and created_at >= now() - interval '6 seconds' order by created_at desc limit 1 for update; if not found then raise exception 'La ventana para deshacer termino'; end if; v_negative_habit := v_quest.type = 'habit' and lower(coalesce(v_quest.tags, '')) like '%habit-%'; v_new_gold := coalesce(v_hero.gold, 0) - v_reward.gold_awarded; if v_new_gold < 0 then raise exception 'No se puede deshacer: ya gastaste el oro obtenido de esta mision.'; end if; v_total := greatest(0, coalesce(v_hero.xp_total, 0) - v_reward.xp_awarded); while v_level < 50 loop v_threshold := v_threshold + round(80 + 3.5 * v_level * v_level); exit when v_total < v_threshold; v_level := v_level + 1; end loop; update public.dungeon_quests set done = false, done_at = null where id = v_quest.id; update public.dungeon_heroes set xp_total = v_total, level = v_level, gold = v_new_gold, quests_done = greatest(0, coalesce(v_hero.quests_done, 0) - case when v_negative_habit then 0 else 1 end), main_done = greatest(0, coalesce(v_hero.main_done, 0) - case when v_quest.type = 'main' then 1 else 0 end) where id = v_hero.id; delete from public.dungeon_reward_ledger where id = v_reward.id; return query select v_total, v_new_gold, v_level, greatest(0, coalesce(v_hero.quests_done, 0) - case when v_negative_habit then 0 else 1 end), greatest(0, coalesce(v_hero.main_done, 0) - case when v_quest.type = 'main' then 1 else 0 end); end; $function$;

CREATE OR REPLACE FUNCTION public.adjust_dungeon_streak(p_delta integer DEFAULT 0)
 RETURNS TABLE(streak integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_hero public.dungeon_heroes%rowtype;
  v_delta integer;
  v_streak integer;
begin
  perform public.assert_dungeon_rpc_rate_limit('streak_adjust', 10, 60);

  if auth.uid() is null then raise exception 'Autenticacion requerida'; end if;
  v_delta := greatest(least(coalesce(p_delta,0), 5), -5);

  select * into v_hero from public.dungeon_heroes where user_id = auth.uid() for update;
  if not found then raise exception 'Heroe no encontrado'; end if;

  v_streak := greatest(0, coalesce(v_hero.streak, 0) + v_delta);
  update public.dungeon_heroes set streak = v_streak where id = v_hero.id;

  return query select v_streak;
end;
$function$;

CREATE OR REPLACE FUNCTION public.start_dungeon_pomodoro(p_duration integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_hero uuid; v_session uuid;
begin
  perform public.assert_dungeon_rpc_rate_limit('pom_start', 20, 60);

  select id into v_hero from public.dungeon_heroes where user_id=auth.uid();
  if v_hero is null then raise exception 'Héroe no encontrado'; end if;
  if p_duration not in (15,25,45,60) then raise exception 'Duración inválida'; end if;
  insert into public.dungeon_pomodoro_sessions(hero_id,duration) values(v_hero,p_duration) returning id into v_session;
  return v_session;
end; $function$;

CREATE OR REPLACE FUNCTION public.complete_dungeon_pomodoro(p_session_id uuid)
 RETURNS TABLE(id uuid, started_at timestamp with time zone, duration integer, xp_awarded integer, gold_awarded integer, pomodoros_done integer, xp_total integer, gold integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_hero public.dungeon_heroes%rowtype; v_session public.dungeon_pomodoro_sessions%rowtype; v_done integer; v_gold integer := 0; v_pom_id uuid;
begin
  perform public.assert_dungeon_rpc_rate_limit('pom_complete', 20, 60);

  select * into v_hero from public.dungeon_heroes where user_id=auth.uid() for update;
  if not found then raise exception 'Héroe no encontrado'; end if;
  select * into v_session from public.dungeon_pomodoro_sessions where id=p_session_id and hero_id=v_hero.id for update;
  if not found or v_session.completed_at is not null then raise exception 'Sesión inválida'; end if;
  if now() < v_session.started_at + make_interval(mins => v_session.duration) then raise exception 'El pomodoro aún no termina'; end if;
  v_done := coalesce(v_hero.pomodoros_done,0)+1;
  if v_done % 4 = 0 then v_gold := 30; end if;
  update public.dungeon_pomodoro_sessions set completed_at=now() where id=v_session.id;
  insert into public.dungeon_pomodoros(hero_id,duration,completed,started_at) values(v_hero.id,v_session.duration,true,v_session.started_at) returning id into v_pom_id;
  update public.dungeon_heroes set pomodoros_done=v_done,xp_total=coalesce(v_hero.xp_total,0)+15,gold=coalesce(v_hero.gold,0)+v_gold where id=v_hero.id;
  return query select v_pom_id,v_session.started_at,v_session.duration,15,v_gold,v_done,coalesce(v_hero.xp_total,0)+15,coalesce(v_hero.gold,0)+v_gold;
end; $function$;

CREATE OR REPLACE FUNCTION public.touch_dungeon_daily_streak()
 RETURNS TABLE(changed boolean, streak integer, longest_streak integer, last_active_date text, hp integer, hp_lost integer, amulet_consumed boolean, orco_forgiven boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_hero public.dungeon_heroes%rowtype;
  v_today text := to_char(now() at time zone 'America/Mexico_City', 'YYYY-MM-DD');
  v_yesterday text := to_char((now() at time zone 'America/Mexico_City') - interval '1 day', 'YYYY-MM-DD');
  v_day_before text := to_char((now() at time zone 'America/Mexico_City') - interval '2 days', 'YYYY-MM-DD');
  v_last text;
  v_new_streak integer;
  v_longest integer;
  v_hp integer;
  v_hp_lost integer := 0;
  v_amulet_consumed boolean := false;
  v_orco_forgiven boolean := false;
begin
  perform public.assert_dungeon_rpc_rate_limit('daily_streak', 20, 60);

  if auth.uid() is null then raise exception 'AutenticaciÃ³n requerida'; end if;

  select * into v_hero
  from public.dungeon_heroes
  where user_id = auth.uid()
  for update;
  if not found then raise exception 'HÃ©roe no encontrado'; end if;

  v_last := nullif(v_hero.last_active_date::text, '');
  v_hp := coalesce(v_hero.hp, 100);

  if v_last = v_today then
    return query select false, coalesce(v_hero.streak,0), coalesce(v_hero.longest_streak,0), v_today, v_hp, 0, false, false;
    return;
  end if;

  v_orco_forgiven := coalesce(v_hero.race, '') = 'orco' and v_last = v_day_before;
  v_new_streak := case when v_last = v_yesterday or v_orco_forgiven then coalesce(v_hero.streak, 0) + 1 else 1 end;
  v_longest := greatest(v_new_streak, coalesce(v_hero.longest_streak, 0));

  if v_last is not null and v_last <> v_yesterday and not v_orco_forgiven then
    if coalesce(v_hero.amulet, false) then
      v_amulet_consumed := true;
    else
      v_hp_lost := least(10, greatest(0, v_hp - 10));
      v_hp := greatest(10, v_hp - 10);
    end if;
  end if;

  update public.dungeon_heroes
  set streak = v_new_streak,
      longest_streak = v_longest,
      last_active_date = v_today::date,
      hp = v_hp,
      amulet = case when v_amulet_consumed then false else amulet end
  where id = v_hero.id;

  return query select true, v_new_streak, v_longest, v_today, v_hp, v_hp_lost, v_amulet_consumed, v_orco_forgiven;
end;
$function$;