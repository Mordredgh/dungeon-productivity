-- undo_dungeon_quest tenía un bug real de dupe: si gastabas el oro otorgado antes de
-- deshacer dentro de la ventana de 6s, el clamp a 0 absorbía la deuda en vez de
-- bloquear (completar +50 oro -> comprar item de 50 -> deshacer -> oro seguía en 0
-- en vez de -50). Ahora lanza excepción si el refund dejaría el oro negativo.
-- También corrige quests_done: antes se restaba siempre 1 al deshacer, pero
-- complete_dungeon_quest NO incrementa quests_done para hábitos negativos.
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
  v_negative_habit boolean := false;
  v_level integer := 1;
  v_threshold integer := 0;
  v_total integer;
  v_new_gold integer;
begin
  if auth.uid() is null then raise exception 'Autenticacion requerida'; end if;

  select * into v_hero from public.dungeon_heroes where user_id = auth.uid() for update;
  if not found then raise exception 'Heroe no encontrado'; end if;

  select * into v_quest from public.dungeon_quests where id = p_quest_id and hero_id = v_hero.id for update;
  if not found or not coalesce(v_quest.done, false) then raise exception 'Mision no reversible'; end if;

  select * into v_reward
  from public.dungeon_reward_ledger
  where hero_id = v_hero.id and source = 'quest' and created_at >= now() - interval '6 seconds'
  order by created_at desc limit 1 for update;
  if not found then raise exception 'La ventana para deshacer termino'; end if;

  v_negative_habit := v_quest.type = 'habit' and lower(coalesce(v_quest.tags, '')) like '%habit-%';

  v_new_gold := coalesce(v_hero.gold, 0) - v_reward.gold_awarded;
  if v_new_gold < 0 then
    raise exception 'No se puede deshacer: ya gastaste el oro obtenido de esta mision.';
  end if;

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
      gold = v_new_gold,
      quests_done = greatest(0, coalesce(v_hero.quests_done, 0) - case when v_negative_habit then 0 else 1 end),
      main_done = greatest(0, coalesce(v_hero.main_done, 0) - case when v_quest.type = 'main' then 1 else 0 end)
  where id = v_hero.id;

  delete from public.dungeon_reward_ledger where id = v_reward.id;

  return query select v_total, v_new_gold, v_level,
    greatest(0, coalesce(v_hero.quests_done, 0) - case when v_negative_habit then 0 else 1 end),
    greatest(0, coalesce(v_hero.main_done, 0) - case when v_quest.type = 'main' then 1 else 0 end);
end;
$$;
