-- Límites server-side para impedir spam sin bloquear reintentos legítimos.
create table if not exists public.dungeon_rpc_rate_limits (
  hero_id uuid not null references public.dungeon_heroes(id) on delete cascade,
  rpc_name text not null,
  window_start timestamptz not null,
  calls integer not null default 0,
  primary key (hero_id, rpc_name, window_start)
);
alter table public.dungeon_rpc_rate_limits enable row level security;

create or replace function public.assert_dungeon_rpc_rate_limit(p_rpc_name text, p_max integer, p_window_seconds integer default 60)
returns void language plpgsql security definer set search_path=public as $$
declare v_hero uuid; v_start timestamptz; v_calls integer;
begin
  if auth.uid() is null then raise exception 'Autenticación requerida'; end if;
  if p_rpc_name not in ('purchase','forge','sala_purchase','boss_attack','reward_claim','class_change') then raise exception 'RPC no permitido'; end if;
  select id into v_hero from public.dungeon_heroes where user_id=auth.uid() for update;
  if v_hero is null then raise exception 'Héroe no encontrado'; end if;
  v_start := to_timestamp(floor(extract(epoch from now()) / greatest(1,p_window_seconds)) * greatest(1,p_window_seconds));
  insert into public.dungeon_rpc_rate_limits(hero_id,rpc_name,window_start,calls)
  values(v_hero,p_rpc_name,v_start,1)
  on conflict (hero_id,rpc_name,window_start) do update set calls=public.dungeon_rpc_rate_limits.calls+1
  returning calls into v_calls;
  if v_calls > greatest(1,p_max) then raise exception 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.' using errcode='P0001'; end if;
  delete from public.dungeon_rpc_rate_limits where hero_id=v_hero and window_start < now() - interval '10 minutes';
end $$;
revoke all on function public.assert_dungeon_rpc_rate_limit(text,integer,integer) from public;

-- Inserta el límite dentro de las funciones SECURITY DEFINER existentes. Se conserva
-- la lógica original y la operación sigue siendo atómica dentro de la transacción.
do $$
declare v_def text;
begin
  select pg_get_functiondef('public.purchase_dungeon_item(text,uuid)'::regprocedure) into v_def;
  v_def := replace(v_def, 'if found then return query select v_receipt.item_id,v_receipt.gold_after,v_receipt.result; return; end if;', 'if found then return query select v_receipt.item_id,v_receipt.gold_after,v_receipt.result; return; end if; perform public.assert_dungeon_rpc_rate_limit(''purchase'',8,60);');
  execute v_def;
  select pg_get_functiondef('public.forge_dungeon_weapon(text,text)'::regprocedure) into v_def;
  v_def := replace(v_def, 'if v_hero is null then raise exception ''Héroe no encontrado''; end if;', 'if v_hero is null then raise exception ''Héroe no encontrado''; end if; perform public.assert_dungeon_rpc_rate_limit(''forge'',4,60);');
  execute v_def;
  select pg_get_functiondef('public.purchase_sala_furniture(text)'::regprocedure) into v_def;
  v_def := replace(v_def, E'\nbegin\n', E'\nbegin\n  perform public.assert_dungeon_rpc_rate_limit(''sala_purchase'',6,60);\n', 1);
  execute v_def;
  select pg_get_functiondef('public.apply_dungeon_boss_damage(text,text,text,text,integer,uuid)'::regprocedure) into v_def;
  v_def := replace(v_def, 'if p_cycle not in (''daily'',''weekly'',''monthly'') or p_request_id is null then raise exception ''Solicitud inválida''; end if;', 'if p_cycle not in (''daily'',''weekly'',''monthly'') or p_request_id is null then raise exception ''Solicitud inválida''; end if; perform public.assert_dungeon_rpc_rate_limit(''boss_attack'',30,60);');
  execute v_def;
  select pg_get_functiondef('public.claim_dungeon_reward(text,text)'::regprocedure) into v_def;
  v_def := replace(v_def, 'if auth.uid() is null then raise exception ''Autenticación requerida''; end if;', 'if auth.uid() is null then raise exception ''Autenticación requerida''; end if; perform public.assert_dungeon_rpc_rate_limit(''reward_claim'',10,60);');
  execute v_def;
  select pg_get_functiondef('public.choose_initial_dungeon_identity(text,text,text)'::regprocedure) into v_def;
  if v_def is not null then
    v_def := replace(v_def, 'if auth.uid() is null then raise exception ''Autenticación requerida''; end if;', 'if auth.uid() is null then raise exception ''Autenticación requerida''; end if; perform public.assert_dungeon_rpc_rate_limit(''class_change'',3,300);');
    execute v_def;
  end if;
end $$;
