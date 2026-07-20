-- Alertas internas para beta. No dependen de custom reports del panel.
create table if not exists public.dungeon_beta_alerts (
  id uuid primary key default gen_random_uuid(),
  alert_key text not null,
  severity text not null check (severity in ('warning','critical')),
  message text not null,
  metric jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (alert_key, created_at)
);

alter table public.dungeon_beta_feedback add column if not exists status text not null default 'open';
create index if not exists dungeon_beta_feedback_status_idx on public.dungeon_beta_feedback(status, created_at desc);

alter table public.dungeon_beta_alerts enable row level security;
revoke all on public.dungeon_beta_alerts from anon, authenticated;
grant select, insert, update on public.dungeon_beta_alerts to service_role;

create index if not exists dungeon_beta_alerts_open_idx
  on public.dungeon_beta_alerts(created_at desc)
  where resolved_at is null;

create or replace function public.scan_dungeon_beta_alerts()
returns table(alert_key text, severity text, message text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_5xx integer;
  v_4xx integer;
  v_feedback integer;
begin
  select count(*) filter (where http_status >= 500),
         count(*) filter (where http_status >= 400)
    into v_5xx, v_4xx
  from public.dungeon_client_events
  where created_at >= now() - interval '1 hour';

  select count(*)
    into v_feedback
  from public.dungeon_beta_feedback
  where status = 'open'
    and created_at >= now() - interval '24 hours';

  if coalesce(v_5xx, 0) >= 3 then
    insert into public.dungeon_beta_alerts(alert_key, severity, message, metric)
    values (
      'client_5xx_1h_' || to_char(date_trunc('hour', now()), 'YYYYMMDDHH24'),
      'critical',
      '3 o mas errores 5xx en la ultima hora.',
      jsonb_build_object('server_errors_1h', v_5xx)
    )
    on conflict do nothing;
  end if;

  if coalesce(v_4xx, 0) >= 10 then
    insert into public.dungeon_beta_alerts(alert_key, severity, message, metric)
    values (
      'client_4xx_1h_' || to_char(date_trunc('hour', now()), 'YYYYMMDDHH24'),
      'warning',
      '10 o mas errores 4xx/5xx en la ultima hora.',
      jsonb_build_object('http_errors_1h', v_4xx)
    )
    on conflict do nothing;
  end if;

  if coalesce(v_feedback, 0) >= 5 then
    insert into public.dungeon_beta_alerts(alert_key, severity, message, metric)
    values (
      'feedback_open_24h_' || to_char(now(), 'YYYYMMDD'),
      'warning',
      '5 o mas reportes abiertos en las ultimas 24 horas.',
      jsonb_build_object('open_feedback_24h', v_feedback)
    )
    on conflict do nothing;
  end if;

  return query
  select a.alert_key, a.severity, a.message
  from public.dungeon_beta_alerts a
  where a.resolved_at is null
  order by a.created_at desc
  limit 20;
end $$;

revoke all on function public.scan_dungeon_beta_alerts() from public;
grant execute on function public.scan_dungeon_beta_alerts() to service_role;

-- Ejecutar manualmente si el plan no permite pg_cron:
-- select * from public.scan_dungeon_beta_alerts();

create extension if not exists pg_cron with schema extensions;
select cron.unschedule(jobid)
from cron.job
where jobname = 'dungeon-beta-alert-scan';
select cron.schedule(
  'dungeon-beta-alert-scan',
  '*/15 * * * *',
  'select public.scan_dungeon_beta_alerts();'
);
