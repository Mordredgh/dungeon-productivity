-- grant_dungeon_currency y craft_dungeon_rune no tenian limite de tasa —
-- cada llamada esta topada (5000 xp/oro max, o gated por fragmentos reales),
-- pero nada frenaba la FRECUENCIA de llamadas. Con multiples usuarios reales
-- en beta, alguien podria llamar grant_dungeon_currency cientos de veces por
-- segundo y acumular XP/oro masivo aunque cada llamada individual este
-- topada. Se agrega al whitelist de assert_dungeon_rpc_rate_limit y se
-- aplica dentro de ambas funciones.

CREATE OR REPLACE FUNCTION public.assert_dungeon_rpc_rate_limit(p_rpc_name text, p_max integer, p_window_seconds integer DEFAULT 60)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare v_hero uuid; v_start timestamptz; v_calls integer;
begin
  if auth.uid() is null then raise exception 'Autenticación requerida'; end if;
  if p_rpc_name not in ('purchase','forge','sala_purchase','boss_attack','reward_claim','class_change','grant_currency','craft_rune') then raise exception 'RPC no permitido'; end if;
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

CREATE OR REPLACE FUNCTION public.grant_dungeon_currency(p_source text, p_xp integer DEFAULT 0, p_gold integer DEFAULT 0)
RETURNS TABLE(xp_total integer, gold integer, level integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_hero public.dungeon_heroes%rowtype;
  v_xp integer;
  v_gold_delta integer;
  v_total integer;
  v_gold integer;
  v_level integer := 1;
  v_threshold integer := 0;
begin
  if auth.uid() is null then raise exception 'Autenticacion requerida'; end if;
  perform public.assert_dungeon_rpc_rate_limit('grant_currency', 30, 60);
  v_xp := least(greatest(coalesce(p_xp,0), 0), 5000);
  v_gold_delta := greatest(least(coalesce(p_gold,0), 5000), -5000);

  select * into v_hero from public.dungeon_heroes where user_id = auth.uid() for update;
  if not found then raise exception 'Heroe no encontrado'; end if;

  v_total := coalesce(v_hero.xp_total, 0) + v_xp;
  v_gold  := greatest(0, coalesce(v_hero.gold, 0) + v_gold_delta);

  while v_level < 50 loop
    v_threshold := v_threshold + round(80 + 3.5 * v_level * v_level);
    exit when v_total < v_threshold;
    v_level := v_level + 1;
  end loop;

  update public.dungeon_heroes set xp_total = v_total, gold = v_gold, level = v_level where id = v_hero.id;
  if v_xp > 0 or v_gold_delta > 0 then
    insert into public.dungeon_reward_ledger(hero_id, source, source_id, xp_awarded, gold_awarded)
    values (v_hero.id, coalesce(p_source, 'client_misc'), gen_random_uuid(), v_xp, greatest(v_gold_delta, 0));
  end if;

  return query select v_total, v_gold, v_level;
end;
$function$;

CREATE OR REPLACE FUNCTION public.craft_dungeon_rune(p_rune_type text)
RETURNS TABLE(id uuid, rune_type text, rune_name text, level integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_hero uuid;
  v_name text;
  v_inv_key text;
  v_qty integer;
  v_new public.dungeon_runes%rowtype;
begin
  if auth.uid() is null then raise exception 'Autenticacion requerida'; end if;
  select id into v_hero from public.dungeon_heroes where user_id = auth.uid() for update;
  if v_hero is null then raise exception 'Heroe no encontrado'; end if;
  perform public.assert_dungeon_rpc_rate_limit('craft_rune', 20, 60);

  v_name := case p_rune_type
    when 'fuerza' then 'Runa de Fuerza'
    when 'vigor' then 'Runa de Vigor'
    when 'celeridad' then 'Runa de Celeridad'
    when 'sabiduria' then 'Runa de Sabiduria'
    when 'suerte' then 'Runa de Suerte'
    when 'oscuridad' then 'Runa de Oscuridad'
    when 'fuego' then 'Runa de Fuego'
    when 'proteccion' then 'Runa de Proteccion'
    else null
  end;
  if v_name is null then raise exception 'Tipo de runa invalido'; end if;

  v_inv_key := 'rune_frag_' || p_rune_type;
  select quantity into v_qty from public.dungeon_inventory where hero_id = v_hero and item_key = v_inv_key for update;
  if coalesce(v_qty,0) < 5 then
    raise exception 'No tienes suficientes fragmentos para forjar esta runa';
  end if;

  update public.dungeon_inventory set quantity = v_qty - 5, updated_at = now()
  where hero_id = v_hero and item_key = v_inv_key;

  insert into public.dungeon_runes(hero_id, rune_type, rune_name, level)
  values (v_hero, p_rune_type, v_name, 1)
  returning * into v_new;

  return query select v_new.id, v_new.rune_type, v_new.rune_name, v_new.level;
end;
$function$;
