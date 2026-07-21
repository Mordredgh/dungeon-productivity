-- La racha toca campos bloqueados por dungeon_block_client_economy_update.
-- Debe vivir en servidor para que completar misiones no dispare PATCH 400.
create or replace function public.touch_dungeon_daily_streak()
returns table (
  changed boolean,
  streak integer,
  longest_streak integer,
  last_active_date text,
  hp integer,
  hp_lost integer,
  amulet_consumed boolean,
  orco_forgiven boolean
)
language plpgsql
security definer
set search_path = public
as $$
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
  if auth.uid() is null then raise exception 'Autenticación requerida'; end if;

  select * into v_hero
  from public.dungeon_heroes
  where user_id = auth.uid()
  for update;
  if not found then raise exception 'Héroe no encontrado'; end if;

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
      last_active_date = v_today,
      hp = v_hp,
      amulet = case when v_amulet_consumed then false else amulet end
  where id = v_hero.id;

  return query select true, v_new_streak, v_longest, v_today, v_hp, v_hp_lost, v_amulet_consumed, v_orco_forgiven;
end;
$$;

revoke all on function public.touch_dungeon_daily_streak() from public;
grant execute on function public.touch_dungeon_daily_streak() to authenticated;
