-- addXP()/addGold()/setGold() en el cliente (hero.js, shop.js — usadas en 13 archivos:
-- botín, hechizos, ruleta, mascotas, marcos de avatar, mejoras de oro, sets secretos)
-- hacían UPDATE directo a xp_total/gold, bloqueado por dungeon_block_client_economy_update
-- (20260719_lock_economy_columns.sql). Confirmado en logs de Postgres de producción que
-- el error disparó de verdad. grant_dungeon_currency reemplaza esa escritura directa:
-- topa XP a [0,5000], oro a [-5000,5000] (negativo permitido para gastar — decrementar el
-- propio oro no es explotable), clampa el resultado final a >=0, y solo registra en
-- dungeon_reward_ledger cuando el neto es positivo (gastos no generan "recompensa").
create or replace function public.grant_dungeon_currency(p_source text, p_xp integer default 0, p_gold integer default 0)
returns table (
  xp_total integer,
  gold integer,
  level integer
)
language plpgsql
security definer
set search_path = public
as $$
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
$$;

-- Efecto de evento "racha mística" (rpg.js resolveEvent, effect='streak1') también
-- escribía streak directo desde el cliente, mismo bloqueo.
create or replace function public.adjust_dungeon_streak(p_delta integer default 0)
returns table (streak integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hero public.dungeon_heroes%rowtype;
  v_delta integer;
  v_streak integer;
begin
  if auth.uid() is null then raise exception 'Autenticacion requerida'; end if;
  v_delta := greatest(least(coalesce(p_delta,0), 5), -5);

  select * into v_hero from public.dungeon_heroes where user_id = auth.uid() for update;
  if not found then raise exception 'Heroe no encontrado'; end if;

  v_streak := greatest(0, coalesce(v_hero.streak, 0) + v_delta);
  update public.dungeon_heroes set streak = v_streak where id = v_hero.id;

  return query select v_streak;
end;
$$;
