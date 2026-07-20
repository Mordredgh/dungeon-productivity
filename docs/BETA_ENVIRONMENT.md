# Variables operativas para beta

No guardar secretos reales en git. Configurar estas variables en el entorno local o CI antes de correr scripts.

## Deploy

- `COOLIFY_DUNGEON_TOKEN`: token de Coolify para disparar deploy/restart.

## Supabase REST / alertas

- `DUNGEON_SUPABASE_URL`: URL pública del proyecto Supabase.
- `DUNGEON_SUPABASE_SERVICE_ROLE_KEY`: service role key. Sólo para scripts internos; nunca exponer en navegador.

Alternativas compatibles:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Backup / restore

- `DUNGEON_SUPABASE_DB_URL`: URL Postgres para `pg_dump`.
- `DUNGEON_SUPABASE_RESTORE_TEST_DB_URL`: URL Postgres de una base temporal para probar restore.

Alternativa compatible:

- `SUPABASE_DB_URL`

## Validación Free Tier sin credenciales de producción

```powershell
.\scripts\supabase-free-tier-local-restore-drill.ps1
```

Este drill usa Docker local, no toca Supabase y valida que el flujo dump/restore funcione completo.
