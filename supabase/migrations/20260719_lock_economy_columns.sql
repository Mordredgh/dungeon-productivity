-- La economía sólo cambia dentro de RPC security definer. El navegador no puede editarla.
create or replace function public.dungeon_block_client_economy_update()
returns trigger language plpgsql set search_path=public as $$
begin
  if current_user in ('authenticated','anon') and (
    new.gold is distinct from old.gold or
    new.xp_total is distinct from old.xp_total or
    new.level is distinct from old.level or
    new.quests_done is distinct from old.quests_done or
    new.main_done is distinct from old.main_done or
    new.streak is distinct from old.streak
  ) then
    raise exception 'Los campos de economía sólo se actualizan mediante acciones del servidor';
  end if;
  return new;
end $$;
drop trigger if exists dungeon_block_client_economy_update on public.dungeon_heroes;
create trigger dungeon_block_client_economy_update before update on public.dungeon_heroes
for each row execute function public.dungeon_block_client_economy_update();
