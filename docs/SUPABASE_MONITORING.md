# Monitoreo y alertas de Supabase

Antes de invitar testers, en el proyecto de Supabase configura:

1. **Logs → Edge Functions / Postgres**: filtro por `status >= 400`, `rpc`, `purchase_`, `boss_` y `claim_`.
2. **Usage**: alertas de picos de requests, errores y conexiones; umbral inicial 3x la media de 24 horas.
3. **Auth**: alertas de fallos de login y recuperación anómalos.
4. **Cron diario**: exportar los errores `dungeon_client_events` y `dungeon_beta_feedback` a un canal privado.

La aplicación registra `window_error` y `unhandled_rejection` sin credenciales. Las alertas del panel son configuración de infraestructura y deben quedar verificadas por el propietario del proyecto antes del lanzamiento.
