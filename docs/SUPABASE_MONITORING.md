# Monitoreo y alertas de Supabase

Antes de invitar testers, en el proyecto de Supabase configura:

1. **Logs / Edge Functions / Postgres**: filtro por `status >= 400`, `rpc`, `purchase_`, `boss_` y `claim_`.
2. **Usage**: alertas de picos de requests, errores y conexiones; umbral inicial 3x la media de 24 horas.
3. **Auth**: alertas de fallos de login y recuperacion anormales.
4. **Cron diario**: exportar los errores `dungeon_client_events` y `dungeon_beta_feedback` a un canal privado.

La migracion `20260719_beta_monitoring.sql` crea:

- `dungeon_client_events`: errores de navegador y respuestas HTTP, con RLS para que cada heroe solo vea sus eventos.
- `dungeon_beta_feedback`: reportes de testers, tambien aislados por heroe.
- `dungeon_beta_monitoring_24h`: vista operativa por hora para el rol privilegiado, con conteos 4xx/5xx e indices de fecha/tipo.

La migracion `20260720_beta_alerts.sql` crea:

- `dungeon_beta_alerts`: alertas internas de beta, aisladas de `anon` y `authenticated`.
- `scan_dungeon_beta_alerts()`: escanea errores 5xx, 4xx y reportes abiertos; devuelve alertas abiertas.
- `pg_cron` job `dungeon-beta-alert-scan`: ejecuta el escaneo cada 15 minutos.

La aplicacion registra `window_error`, `unhandled_rejection` y el `http_status` de operaciones fallidas sin credenciales. La vista no queda expuesta a `anon` ni `authenticated`; solo `service_role` puede consultarla para tablero/alertas.

## Preflight operativo

Variables locales esperadas:

- `DUNGEON_SUPABASE_URL`
- `DUNGEON_SUPABASE_SERVICE_ROLE_KEY`
- `DUNGEON_SUPABASE_DB_URL`

Comandos:

```powershell
.\scripts\supabase-beta-preflight.ps1
.\scripts\supabase-backup.ps1
.\scripts\supabase-beta-alerts.ps1
.\scripts\beta-local-smoke.ps1
```

`supabase-beta-preflight.ps1` valida lectura privilegiada de eventos, feedback y vista de monitoreo.

`supabase-backup.ps1` genera un dump custom de Postgres dentro de `tmp/backups` y crea un `.sha256`. La carpeta `tmp/` esta ignorada por Git para evitar subir respaldos.

`supabase-beta-alerts.ps1` ejecuta `scan_dungeon_beta_alerts()` con `service_role`. Si hay alertas abiertas sale con codigo `2`, util para Uptime Kuma, cron o CI.

En produccion se verifico el job `dungeon-beta-alert-scan` con `cron.schedule(...)` y resultado `1`.

El panel actual esta en Free Plan: Supabase muestra Observability, pero no backups administrados ni restauracion a nuevo proyecto. La restauracion administrada depende de subir a Pro; mientras tanto, el camino verificable es `supabase-backup.ps1` + restauracion en un proyecto temporal con credenciales Postgres.
