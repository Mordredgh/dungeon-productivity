-- craftRune() en el cliente insertaba directo en dungeon_runes sin que nada
-- del lado servidor validara el gasto de 5 fragmentos (dungeon_inventory) —
-- con la política ALL para el dueño, cualquiera podía forjar runas gratis
-- vía devtools. craft_dungeon_rune valida y descuenta el fragmento y crea la
-- runa en una sola transacción; la política se reduce a SELECT+UPDATE (el
-- UPDATE sigue siendo necesario para engastar/desengastar via weapon_id).
create or replace function public.craft_dungeon_rune(p_rune_type text)
returns table (
  id uuid,
  rune_type text,
  rune_name text,
  level integer
)
language plpgsql
security definer
set search_path = public
as $$
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
$$;

drop policy if exists dungeon_runes_owner on public.dungeon_runes;
create policy dungeon_runes_select_owner on public.dungeon_runes for select
  using (exists (select 1 from public.dungeon_heroes h where h.id = dungeon_runes.hero_id and h.user_id = auth.uid()));
create policy dungeon_runes_update_owner on public.dungeon_runes for update
  using (exists (select 1 from public.dungeon_heroes h where h.id = dungeon_runes.hero_id and h.user_id = auth.uid()))
  with check (exists (select 1 from public.dungeon_heroes h where h.id = dungeon_runes.hero_id and h.user_id = auth.uid()));
