-- Tienda/forja autoritativas. El cliente sólo envía item_id y request_id;
-- el catálogo, el precio, el coste y la entrega se resuelven aquí.

create table if not exists public.dungeon_shop_catalog (
  item_id text primary key,
  gold_cost integer not null check (gold_cost >= 0 and gold_cost <= 100000),
  delivery_kind text not null check (delivery_kind in ('effect','inventory','weapon')),
  delivery_key text,
  delivery_type text,
  delivery_qty integer not null default 1 check (delivery_qty between 1 and 100),
  weapon_key text,
  weapon_tier text,
  active boolean not null default true
);
alter table public.dungeon_shop_catalog enable row level security;
drop policy if exists dungeon_shop_catalog_read on public.dungeon_shop_catalog;
create policy dungeon_shop_catalog_read on public.dungeon_shop_catalog for select to authenticated using (true);

insert into public.dungeon_shop_catalog(item_id,gold_cost,delivery_kind,delivery_key,delivery_type,delivery_qty,weapon_key,weapon_tier) values
('potion',80,'effect','potion',null,1,null,null),('scroll',60,'effect','scroll',null,1,null,null),
('amulet',120,'effect','amulet',null,1,null,null),('xpstone',200,'effect','xpstone',null,1,null,null),
('revival',150,'effect','revival',null,1,null,null),('hp_minor',35,'effect','hp_minor',null,1,null,null),
('gold_rush',80,'effect','gold_rush',null,1,null,null),('boss_shield',150,'effect','boss_shield',null,1,null,null),
('xp_scroll_sm',70,'effect','xp_scroll_sm',null,1,null,null),
('egg_zorro-naturaleza',200,'inventory','pet_egg_zorro-naturaleza','pet_egg',1,null,null),
('egg_pantera-sombra',300,'inventory','pet_egg_pantera-sombra','pet_egg',1,null,null),
('egg_lobo-tormenta',400,'inventory','pet_egg_lobo-tormenta','pet_egg',1,null,null),
('egg_grifo',500,'inventory','pet_egg_grifo','pet_egg',1,null,null),('egg_dragon-fuego',600,'inventory','pet_egg_dragon-fuego','pet_egg',1,null,null),
('egg_fenix-mitico',800,'inventory','pet_egg_fenix-mitico','pet_egg',1,null,null),
('frag_frenzy',30,'inventory','spell_frenzy','spell_fragment',5,null,null),('frag_speed',20,'inventory','spell_speed','spell_fragment',5,null,null),
('frag_berserker',25,'inventory','spell_berserker','spell_fragment',5,null,null),('frag_shield',15,'inventory','spell_shield','spell_fragment',5,null,null),
('frag_modo-berserker',20,'inventory','spell_modo-berserker','spell_fragment',5,null,null),('frag_healing',10,'inventory','spell_healing','spell_fragment',5,null,null),('frag_mente-acero',25,'inventory','spell_mente-acero','spell_fragment',5,null,null),
('weapon_espada',50,'weapon',null,null,1,'espada','comun'),('weapon_mazo',50,'weapon',null,null,1,'mazo','comun'),
('weapon_baculo',50,'weapon',null,null,1,'baculo','comun'),('weapon_arco',50,'weapon',null,null,1,'arco','comun'),('weapon_dagas',40,'weapon',null,null,1,'dagas','comun'),
('armor_pecho',60,'weapon',null,null,1,'pecho','comun'),('armor_casco',55,'weapon',null,null,1,'casco','comun'),('armor_botas',55,'weapon',null,null,1,'botas','comun'),('armor_guantes',50,'weapon',null,null,1,'guantes','comun'),('armor_grebas',50,'weapon',null,null,1,'grebas','comun'),
('pot_zorro-naturaleza',40,'inventory','pet_potion_zorro-naturaleza','pet_potion',1,null,null),('pot_pantera-sombra',55,'inventory','pet_potion_pantera-sombra','pet_potion',1,null,null),
('pot_lobo-tormenta',70,'inventory','pet_potion_lobo-tormenta','pet_potion',1,null,null),('pot_grifo',90,'inventory','pet_potion_grifo','pet_potion',1,null,null),('pot_dragon-fuego',110,'inventory','pet_potion_dragon-fuego','pet_potion',1,null,null),('pot_fenix-mitico',140,'inventory','pet_potion_fenix-mitico','pet_potion',1,null,null),('pot_rey-tempestad',250,'inventory','pet_potion_rey-tempestad','pet_potion',1,null,null),
('food_zorro-naturaleza',50,'inventory','pet_food_zorro-naturaleza','pet_food',1,null,null),('food_pantera-sombra',65,'inventory','pet_food_pantera-sombra','pet_food',1,null,null),
('food_lobo-tormenta',80,'inventory','pet_food_lobo-tormenta','pet_food',1,null,null),('food_grifo',100,'inventory','pet_food_grifo','pet_food',1,null,null),('food_dragon-fuego',125,'inventory','pet_food_dragon-fuego','pet_food',1,null,null),('food_fenix-mitico',160,'inventory','pet_food_fenix-mitico','pet_food',1,null,null),('food_rey-tempestad',300,'inventory','pet_food_rey-tempestad','pet_food',1,null,null)
on conflict (item_id) do update set gold_cost=excluded.gold_cost, delivery_kind=excluded.delivery_kind, delivery_key=excluded.delivery_key, delivery_type=excluded.delivery_type, delivery_qty=excluded.delivery_qty, weapon_key=excluded.weapon_key, weapon_tier=excluded.weapon_tier, active=true;

create table if not exists public.dungeon_purchase_receipts (
  id uuid primary key default gen_random_uuid(),
  hero_id uuid not null references public.dungeon_heroes(id) on delete cascade,
  request_id uuid not null,
  item_id text not null references public.dungeon_shop_catalog(item_id),
  gold_after integer not null,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (hero_id, request_id)
);
alter table public.dungeon_purchase_receipts enable row level security;
drop policy if exists dungeon_purchase_receipts_read_owner on public.dungeon_purchase_receipts;
create policy dungeon_purchase_receipts_read_owner on public.dungeon_purchase_receipts for select to authenticated using (
  exists (select 1 from public.dungeon_heroes h where h.id=dungeon_purchase_receipts.hero_id and h.user_id=auth.uid())
);

create or replace function public.dungeon_level_for_xp(p_xp integer)
returns integer language plpgsql immutable as $$
declare v_level integer:=1; v_threshold integer:=0;
begin
  while v_level < 50 loop
    v_threshold := v_threshold + round(80 + 3.5 * v_level * v_level);
    exit when p_xp < v_threshold;
    v_level := v_level + 1;
  end loop;
  return v_level;
end $$;

create or replace function public.purchase_dungeon_item(p_item_id text, p_request_id uuid)
returns table (item_id text, gold integer, result jsonb)
language plpgsql security definer set search_path=public as $$
declare v_hero public.dungeon_heroes%rowtype; v_item public.dungeon_shop_catalog%rowtype;
  v_receipt public.dungeon_purchase_receipts%rowtype; v_result jsonb:='{}'::jsonb; v_deadline date;
  v_quest_id uuid; v_xp integer:=0; v_gold integer; v_now_ms bigint:=floor(extract(epoch from now())*1000)::bigint;
begin
  if auth.uid() is null then raise exception 'Autenticación requerida'; end if;
  if p_request_id is null then raise exception 'Solicitud inválida'; end if;
  select * into v_hero from public.dungeon_heroes where user_id=auth.uid() for update;
  if not found then raise exception 'Héroe no encontrado'; end if;
  select * into v_receipt from public.dungeon_purchase_receipts where hero_id=v_hero.id and request_id=p_request_id;
  if found then return query select v_receipt.item_id,v_receipt.gold_after,v_receipt.result; return; end if;
  select * into v_item from public.dungeon_shop_catalog where item_id=p_item_id and active=true;
  if not found then raise exception 'Artículo no disponible'; end if;
  if coalesce(v_hero.gold,0) < v_item.gold_cost then raise exception 'Oro insuficiente'; end if;
  if v_item.delivery_kind='effect' and v_item.delivery_key='scroll' then
    select id,deadline into v_quest_id,v_deadline from public.dungeon_quests where hero_id=v_hero.id and not coalesce(done,false) and deadline is not null order by deadline asc limit 1 for update;
    if v_deadline is null then raise exception 'No hay misión con fecha límite'; end if;
    v_deadline:=v_deadline+1;
    update public.dungeon_quests set deadline=v_deadline where id=v_quest_id;
    v_result:=jsonb_build_object('deadline',v_deadline);
  elsif v_item.delivery_kind='effect' and v_item.delivery_key in ('xpstone','xp_scroll_sm') then
    v_xp:=case when v_item.delivery_key='xpstone' then 150 else 75 end;
    v_result:=jsonb_build_object('xp_awarded',v_xp);
  elsif v_item.delivery_kind='effect' then
    if v_item.delivery_key='potion' then update public.dungeon_heroes set potion_exp=v_now_ms+1800000 where id=v_hero.id;
    elsif v_item.delivery_key='amulet' then update public.dungeon_heroes set amulet=true where id=v_hero.id;
    elsif v_item.delivery_key='revival' then update public.dungeon_heroes set hp=coalesce(hp_max,100) where id=v_hero.id;
    elsif v_item.delivery_key='hp_minor' then update public.dungeon_heroes set hp=least(coalesce(hp,100)+25,coalesce(hp_max,100)) where id=v_hero.id;
    elsif v_item.delivery_key='gold_rush' then update public.dungeon_heroes set gold_rush_exp=v_now_ms+3600000 where id=v_hero.id;
    elsif v_item.delivery_key='boss_shield' then update public.dungeon_heroes set boss_shield=true where id=v_hero.id;
    end if;
    v_result:=jsonb_build_object('effect',v_item.delivery_key);
  elsif v_item.delivery_kind='inventory' then
    update public.dungeon_inventory set quantity=quantity+v_item.delivery_qty,updated_at=now() where hero_id=v_hero.id and item_key=v_item.delivery_key;
    if not found then insert into public.dungeon_inventory(hero_id,item_key,item_type,quantity,updated_at) values(v_hero.id,v_item.delivery_key,v_item.delivery_type,v_item.delivery_qty,now()); end if;
    v_result:=jsonb_build_object('inventory_key',v_item.delivery_key,'quantity',v_item.delivery_qty);
  elsif v_item.delivery_kind='weapon' then
    insert into public.dungeon_weapons(hero_id,weapon_key,tier,name,is_equipped,obtained_at,ready_at)
    values(v_hero.id,v_item.weapon_key,v_item.weapon_tier,initcap(v_item.weapon_key)||' '||initcap(v_item.weapon_tier),false,now(),null);
    v_result:=jsonb_build_object('weapon_key',v_item.weapon_key,'tier',v_item.weapon_tier);
  end if;
  v_gold:=coalesce(v_hero.gold,0)-v_item.gold_cost;
  update public.dungeon_heroes set gold=v_gold,xp_total=coalesce(v_hero.xp_total,0)+v_xp,level=public.dungeon_level_for_xp(coalesce(v_hero.xp_total,0)+v_xp) where id=v_hero.id;
  insert into public.dungeon_purchase_receipts(hero_id,request_id,item_id,gold_after,result) values(v_hero.id,p_request_id,v_item.item_id,v_gold,v_result);
  return query select v_item.item_id,v_gold,v_result;
end $$;

create or replace function public.forge_dungeon_weapon(p_weapon_key text, p_target_tier text)
returns table (id uuid, weapon_key text, tier text, name text, ready_at timestamptz)
language plpgsql security definer set search_path=public as $$
declare v_hero uuid; v_from text; v_count integer; v_ids uuid[]; v_new public.dungeon_weapons%rowtype;
begin
  select id into v_hero from public.dungeon_heroes where user_id=auth.uid() for update;
  if v_hero is null then raise exception 'Héroe no encontrado'; end if;
  select case p_target_tier when 'raro' then 'comun' when 'epico' then 'raro' when 'legendario' then 'epico' when 'mitico' then 'legendario' end,
    case p_target_tier when 'raro' then 5 when 'epico' then 3 when 'legendario' then 3 when 'mitico' then 3 end into v_from,v_count;
  if v_from is null then raise exception 'Tier inválido'; end if;
  select array_agg(id) into v_ids from (select id from public.dungeon_weapons where hero_id=v_hero and weapon_key=p_weapon_key and tier=v_from and not coalesce(is_equipped,false) and (ready_at is null or ready_at<=now()) order by obtained_at limit v_count for update) s;
  if coalesce(array_length(v_ids,1),0) < v_count then raise exception 'No tienes suficientes piezas para forjar'; end if;
  delete from public.dungeon_weapons where id=any(v_ids);
  insert into public.dungeon_weapons(hero_id,weapon_key,tier,name,is_equipped,obtained_at,ready_at) values(v_hero,p_weapon_key,p_target_tier,initcap(p_weapon_key)||' '||initcap(p_target_tier),false,now(),null) returning * into v_new;
  return query select v_new.id,v_new.weapon_key,v_new.tier,v_new.name,v_new.ready_at;
end $$;

revoke all on function public.purchase_dungeon_item(text,uuid), public.forge_dungeon_weapon(text,text) from public;
grant execute on function public.purchase_dungeon_item(text,uuid), public.forge_dungeon_weapon(text,text) to authenticated;
revoke all on function public.dungeon_level_for_xp(integer) from public;
