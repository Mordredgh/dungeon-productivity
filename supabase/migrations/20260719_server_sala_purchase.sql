-- Muebles: catálogo, coste y entrega se resuelven dentro de una sola transacción.
create table if not exists public.dungeon_sala_catalog (
  furniture_id text primary key,
  gold_cost integer not null check (gold_cost >= 0 and gold_cost <= 100000),
  requires_blueprint boolean not null default true,
  active boolean not null default true
);
alter table public.dungeon_sala_catalog enable row level security;
drop policy if exists dungeon_sala_catalog_read on public.dungeon_sala_catalog;
create policy dungeon_sala_catalog_read on public.dungeon_sala_catalog for select to authenticated using (true);

insert into public.dungeon_sala_catalog(furniture_id,gold_cost,requires_blueprint) values
  ('trono-arcano',5000,true),('mesa-orbe-astral',2800,true),
  ('librero-alquimico',1400,true),('chimenea-arcana',3200,true),
  ('espejo-dorado',2600,true),('rack-arsenal',1800,true),
  ('cofre-ancestral',1900,true),('arbol-arcano',3000,true),
  ('candelabro-violeta',1200,false),('estandarte-arcano',0,false),
  ('farol-dorado',1500,true),('tapete-astral',2400,true)
on conflict (furniture_id) do update set gold_cost=excluded.gold_cost, requires_blueprint=excluded.requires_blueprint, active=true;

create or replace function public.purchase_sala_furniture(p_furniture_id text)
returns table (gold integer, sala_personal jsonb)
language plpgsql security definer set search_path=public as $$
declare
  v_hero public.dungeon_heroes%rowtype;
  v_item public.dungeon_sala_catalog%rowtype;
  v_sala jsonb;
  v_owned jsonb;
  v_blueprints jsonb;
  v_gold integer;
begin
  if auth.uid() is null then raise exception 'Autenticación requerida'; end if;
  select * into v_hero from public.dungeon_heroes where user_id=auth.uid() for update;
  if not found then raise exception 'Héroe no encontrado'; end if;
  select * into v_item from public.dungeon_sala_catalog where furniture_id=p_furniture_id and active=true;
  if not found then raise exception 'Mueble no disponible'; end if;

  begin v_sala:=coalesce(v_hero.sala_personal::jsonb,'{}'::jsonb); exception when others then v_sala:='{}'::jsonb; end;
  v_owned:=coalesce(v_sala->'owned','[]'::jsonb);
  if v_owned ? p_furniture_id then
    return query select coalesce(v_hero.gold,0),v_sala;
    return;
  end if;

  begin v_blueprints:=coalesce(v_hero.week_data::jsonb->'sala_blueprints','[]'::jsonb); exception when others then v_blueprints:='[]'::jsonb; end;
  if v_item.requires_blueprint and not (v_blueprints ? p_furniture_id) then
    raise exception 'Este mueble requiere su plano';
  end if;
  if coalesce(v_hero.gold,0) < v_item.gold_cost then raise exception 'Oro insuficiente'; end if;

  v_sala:=jsonb_set(v_sala,'{owned}',v_owned || to_jsonb(p_furniture_id),true);
  v_gold:=coalesce(v_hero.gold,0)-v_item.gold_cost;
  update public.dungeon_heroes set gold=v_gold,sala_personal=v_sala::text where id=v_hero.id;
  return query select v_gold,v_sala;
end $$;

revoke all on function public.purchase_sala_furniture(text) from public;
grant execute on function public.purchase_sala_furniture(text) to authenticated;
