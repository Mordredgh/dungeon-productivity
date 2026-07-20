-- Alinea las bonificaciones mostradas con las recompensas que calcula el servidor.
-- Fundador ya no recibe XP global: sólo acelera campañas explícitamente etiquetadas.
do $migration$
declare
  v_definition text;
  v_old text := $old$if v_hero.hero_class = 'mago' or v_hero.hero_class = 'fundador' then
    v_xp := round(v_xp * 1.10);
  elsif v_hero.hero_class = 'guerrero' and v_quest.type = 'main' then$old$;
  v_new text := $new$if v_hero.hero_class = 'mago' then
    v_xp := round(v_xp * 1.10);
  elsif v_hero.hero_class = 'fundador' and (lower(coalesce(v_quest.tags, '')) like '%meta%'
    or lower(coalesce(v_quest.tags, '')) like '%objetivo%'
    or lower(coalesce(v_quest.tags, '')) like '%proyecto%') then
    v_xp := round(v_xp * 1.30);
  elsif v_hero.hero_class = 'guerrero' and v_quest.type = 'main' then$new$;
begin
  select pg_get_functiondef(p.oid) into v_definition
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'complete_dungeon_quest'
    and pg_get_function_identity_arguments(p.oid) = 'p_quest_id uuid';
  if v_definition is null or position(v_old in v_definition) = 0 then
    raise exception 'No se encontró la versión esperada de complete_dungeon_quest';
  end if;
  execute replace(v_definition, v_old, v_new);
end $migration$;
