-- Infraestructura mínima de observabilidad para beta.
-- El navegador sólo puede insertar eventos de su propio héroe; el tablero
-- de Supabase consulta con rol privilegiado y no expone datos entre usuarios.
create table if not exists public.dungeon_client_events (
  id uuid primary key default gen_random_uuid(),
  hero_id uuid not null references public.dungeon_heroes(id) on delete cascade,
  kind text not null,
  message text not null,
  page text,
  http_status integer,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.dungeon_client_events enable row level security;
alter table public.dungeon_client_events add column if not exists http_status integer;
create index if not exists dungeon_client_events_created_idx on public.dungeon_client_events(created_at desc);
create index if not exists dungeon_client_events_kind_idx on public.dungeon_client_events(kind, created_at desc);
create index if not exists dungeon_client_events_5xx_idx on public.dungeon_client_events(http_status, created_at desc) where http_status >= 500;

drop policy if exists dungeon_client_events_insert_own on public.dungeon_client_events;
create policy dungeon_client_events_insert_own on public.dungeon_client_events
  for insert to authenticated
  with check (hero_id in (select id from public.dungeon_heroes where user_id = auth.uid()));

drop policy if exists dungeon_client_events_select_own on public.dungeon_client_events;
create policy dungeon_client_events_select_own on public.dungeon_client_events
  for select to authenticated
  using (hero_id in (select id from public.dungeon_heroes where user_id = auth.uid()));

create table if not exists public.dungeon_beta_feedback (
  id uuid primary key default gen_random_uuid(),
  hero_id uuid not null references public.dungeon_heroes(id) on delete cascade,
  category text not null default 'bug',
  message text not null,
  page text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

alter table public.dungeon_beta_feedback enable row level security;
alter table public.dungeon_beta_feedback add column if not exists status text not null default 'open';
create index if not exists dungeon_beta_feedback_created_idx on public.dungeon_beta_feedback(created_at desc);
create index if not exists dungeon_beta_feedback_status_idx on public.dungeon_beta_feedback(status, created_at desc);

drop policy if exists dungeon_beta_feedback_insert_own on public.dungeon_beta_feedback;
create policy dungeon_beta_feedback_insert_own on public.dungeon_beta_feedback
  for insert to authenticated
  with check (hero_id in (select id from public.dungeon_heroes where user_id = auth.uid()));

drop policy if exists dungeon_beta_feedback_select_own on public.dungeon_beta_feedback;
create policy dungeon_beta_feedback_select_own on public.dungeon_beta_feedback
  for select to authenticated
  using (hero_id in (select id from public.dungeon_heroes where user_id = auth.uid()));

-- Consulta para el tablero operativo de Supabase (rol privilegiado).
create or replace view public.dungeon_beta_monitoring_24h as
select
  date_trunc('hour', created_at) as bucket,
  kind,
  count(*) as events,
  count(*) filter (where http_status >= 400) as http_errors,
  count(*) filter (where http_status >= 500) as server_errors
from public.dungeon_client_events
where created_at >= now() - interval '24 hours'
group by 1, 2
order by 1 desc, 2;

revoke all on public.dungeon_beta_monitoring_24h from anon, authenticated;
grant select on public.dungeon_beta_monitoring_24h to service_role;
