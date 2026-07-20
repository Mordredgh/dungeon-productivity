-- El primer juramento se confirma de forma atómica y deja la raza sellada.
create or replace function public.choose_initial_dungeon_identity(
  p_name text,
  p_race text,
  p_hero_class text
)
returns table (name text, race text, hero_class text, skill_tree text)
language plpgsql security definer set search_path=public as $$
declare
  v_hero public.dungeon_heroes%rowtype;
  v_tree jsonb;
  v_name text := btrim(coalesce(p_name, ''));
begin
  if auth.uid() is null then raise exception 'Autenticación requerida'; end if;
  if char_length(v_name) not between 2 and 40 then raise exception 'El nombre debe tener entre 2 y 40 caracteres'; end if;
  if p_race not in ('humano','elfo','enano','orco') then raise exception 'Raza inválida'; end if;
  if p_hero_class not in ('guerrero','mago','picaro','clerigo','arquero','fundador') then raise exception 'Clase inválida'; end if;

  select * into v_hero from public.dungeon_heroes where user_id=auth.uid() for update;
  if not found then raise exception 'Héroe no encontrado'; end if;
  if nullif(v_hero.race, '') is not null then raise exception 'La identidad inicial ya fue sellada'; end if;

  begin v_tree := coalesce(v_hero.skill_tree::jsonb, '{}'::jsonb); exception when others then v_tree := '{}'::jsonb; end;
  v_tree := jsonb_set(v_tree, '{__progression}', jsonb_build_object(
    'raceLocked', true,
    'classFreeChangeUsed', false,
    'classChangeCooldownUntil', 0,
    'lastPrestigeAt', 0
  ), true);

  update public.dungeon_heroes
  set name=v_name, race=p_race, hero_class=p_hero_class, skill_tree=v_tree::text
  where id=v_hero.id;

  return query select v_name,p_race,p_hero_class,v_tree::text;
end $$;

revoke all on function public.choose_initial_dungeon_identity(text,text,text) from public;
grant execute on function public.choose_initial_dungeon_identity(text,text,text) to authenticated;
