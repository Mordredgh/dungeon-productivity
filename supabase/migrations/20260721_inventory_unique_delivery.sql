-- addInvItem usa on_conflict=hero_id,item_key. La base debe tener un índice
-- único real; si no, Supabase responde 400 y el loot parece perderse.
do $$
begin
  if to_regclass('public.dungeon_inventory') is null then
    return;
  end if;

  with ranked as (
    select ctid, hero_id, item_key,
           sum(coalesce(quantity, 0)) over (partition by hero_id, item_key) as total_quantity,
           row_number() over (partition by hero_id, item_key order by updated_at desc nulls last, ctid) as rn
    from public.dungeon_inventory
  )
  update public.dungeon_inventory i
  set quantity = greatest(0, r.total_quantity),
      updated_at = now()
  from ranked r
  where i.ctid = r.ctid and r.rn = 1;

  with ranked as (
    select ctid,
           row_number() over (partition by hero_id, item_key order by updated_at desc nulls last, ctid) as rn
    from public.dungeon_inventory
  )
  delete from public.dungeon_inventory i
  using ranked r
  where i.ctid = r.ctid and r.rn > 1;
end $$;

create unique index if not exists dungeon_inventory_hero_item_key_uidx
  on public.dungeon_inventory(hero_id, item_key);
