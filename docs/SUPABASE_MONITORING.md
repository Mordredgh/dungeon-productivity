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

La aplicacion registra `window_error`, `unhandled_rejection` y el `http_status` de operaciones fallidas sin credenciales. Las alertas del panel son configuracion de infraestructura y deben quedar verificadas por el propietario del proyecto antes del lanzamiento. La restauracion de backups administrados depende del plan de Supabase; conservar una exportacion SQL versionada antes de cada migracion permite rollback controlado.
