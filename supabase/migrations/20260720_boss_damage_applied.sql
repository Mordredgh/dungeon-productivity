-- Corrige ataques de mascota que no bajan HP cuando cliente y servidor
-- calculan caps distintos. El servidor sigue siendo autoritativo: capea el
-- daño a 40% del HP máximo del jefe y devuelve el daño real aplicado.
drop function if exists public.apply_dungeon_boss_damage(text,text,text,text,integer,uuid);

create or replace function public.apply_dungeon_boss_damage(
  p_cycle text, p_boss_key text, p_period_key text, p_rarity text, p_damage integer, p_request_id uuid
)
returns table (
  hp integer,
  max_hp integer,
  defeated boolean,
  damage_applied integer,
  xp_awarded integer,
  gold_awarded integer,
  xp_total integer,
  gold integer,
  level integer,
  boss_state jsonb
)
language plpgsql security definer set search_path=public as $$
declare
  v_hero public.dungeon_heroes%rowtype; v_state jsonb; v_boss jsonb; v_allowed text[];
  v_max integer; v_hp integer; v_damage integer; v_defeated boolean; v_xp integer:=0; v_gold integer:=0;
  v_total integer; v_level integer; v_old_action public.dungeon_boss_actions%rowtype;
begin
  if auth.uid() is null then raise exception 'Autenticación requerida'; end if;
  if p_cycle not in ('daily','weekly','monthly') or p_request_id is null then raise exception 'Solicitud inválida'; end if;
  perform public.assert_dungeon_rpc_rate_limit('boss_attack',30,60);

  select * into v_hero from public.dungeon_heroes where user_id=auth.uid() for update;
  if not found then raise exception 'Héroe no encontrado'; end if;

  select * into v_old_action from public.dungeon_boss_actions where hero_id=v_hero.id and request_id=p_request_id;
  if found then
    begin v_state:=coalesce(v_hero.boss_state::jsonb,'{}'::jsonb); exception when others then v_state:='{}'::jsonb; end;
    v_boss:=coalesce(v_state->p_cycle,'{}'::jsonb);
    return query select
      v_old_action.hp_after,
      coalesce((v_boss->>'maxHp')::integer,0),
      coalesce((v_boss->>'defeated')::boolean,false),
      v_old_action.damage,
      0,0,
      coalesce(v_hero.xp_total,0),
      coalesce(v_hero.gold,0),
      coalesce(v_hero.level,1),
      v_state;
    return;
  end if;

  v_allowed:=case p_cycle when 'daily' then array['comun','raro'] when 'weekly' then array['epico','legendario'] else array['mitico','cataclismo'] end;
  if p_rarity <> all(v_allowed) or p_boss_key !~ '^[a-z0-9_-]{3,64}$' then raise exception 'Jefe inválido para este ciclo'; end if;

  v_max:=round((case p_rarity when 'comun' then 80 when 'raro' then 150 when 'epico' then 600 when 'legendario' then 1000 when 'mitico' then 2500 else 4200 end) * (1 + greatest(coalesce(v_hero.level,1)-1,0) * 0.03));
  if p_damage is null or p_damage < 1 or p_damage > 50000 then raise exception 'Daño inválido'; end if;

  begin v_state:=coalesce(v_hero.boss_state::jsonb,'{}'::jsonb); exception when others then v_state:='{}'::jsonb; end;
  v_boss:=v_state->p_cycle;
  if v_boss is null or coalesce(v_boss->>'periodKey','') <> p_period_key then
    v_boss:=jsonb_build_object('key',p_boss_key,'rarity',p_rarity,'hp',v_max,'maxHp',v_max,'defeated',false,'periodKey',p_period_key);
  elsif coalesce(v_boss->>'key','') <> p_boss_key or coalesce(v_boss->>'rarity','') <> p_rarity then
    raise exception 'El jefe activo no coincide';
  end if;

  v_hp:=coalesce((v_boss->>'hp')::integer,v_max); v_defeated:=coalesce((v_boss->>'defeated')::boolean,false);
  if v_defeated then raise exception 'Este jefe ya fue derrotado'; end if;

  v_damage:=least(greatest(1,p_damage),greatest(1,ceil(v_max * 0.40)),v_hp);
  v_hp:=v_hp-v_damage; v_defeated:=v_hp=0;

  if v_defeated then
    v_xp:=case p_rarity when 'comun' then 80 when 'raro' then 160 when 'epico' then 400 when 'legendario' then 700 when 'mitico' then 1800 else 4000 end;
    v_gold:=case p_rarity when 'comun' then 40 when 'raro' then 80 when 'epico' then 180 when 'legendario' then 300 when 'mitico' then 700 else 1500 end;
    insert into public.dungeon_boss_rewards(hero_id,cycle,period_key,boss_key,xp_awarded,gold_awarded) values(v_hero.id,p_cycle,p_period_key,p_boss_key,v_xp,v_gold);
  end if;

  v_boss:=jsonb_set(jsonb_set(v_boss,'{hp}',to_jsonb(v_hp),true),'{defeated}',to_jsonb(v_defeated),true);
  v_state:=jsonb_set(v_state,array[p_cycle],v_boss,true);
  v_total:=coalesce(v_hero.xp_total,0)+v_xp; v_level:=public.dungeon_level_for_xp(v_total);

  update public.dungeon_heroes set boss_state=v_state::text,xp_total=v_total,gold=coalesce(v_hero.gold,0)+v_gold,level=v_level where id=v_hero.id;
  insert into public.dungeon_boss_actions(hero_id,request_id,cycle,boss_key,damage,hp_after) values(v_hero.id,p_request_id,p_cycle,p_boss_key,v_damage,v_hp);
  return query select v_hp,v_max,v_defeated,v_damage,v_xp,v_gold,v_total,coalesce(v_hero.gold,0)+v_gold,v_level,v_state;
end $$;

revoke all on function public.apply_dungeon_boss_damage(text,text,text,text,integer,uuid) from public;
grant execute on function public.apply_dungeon_boss_damage(text,text,text,text,integer,uuid) to authenticated;
