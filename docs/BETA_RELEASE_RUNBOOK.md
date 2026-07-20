# Runbook de lanzamiento beta

## Backup y rollback

0. Confirmar variables operativas en `docs/BETA_ENVIRONMENT.md`. No escribir secretos en git ni en logs.
1. Ejecutar `.\scripts\supabase-backup.ps1` antes de migrar y conservar el `.sha256`.
2. Ejecutar `.\scripts\supabase-free-tier-drill.ps1`. Si existe `DUNGEON_SUPABASE_RESTORE_TEST_DB_URL`, tambien prueba restore temporal.
3. Si no hay credenciales de produccion disponibles, ejecutar `.\scripts\supabase-free-tier-local-restore-drill.ps1` para validar el pipeline con Postgres temporal local.
4. Ejecutar `.\scripts\supabase-beta-preflight.ps1` despues de migrar.
5. Ejecutar `.\scripts\supabase-beta-alerts.ps1` para confirmar que no hay alertas abiertas.
6. Ejecutar `.\scripts\beta-local-smoke.ps1` antes del deploy.
7. Guardar el SQL de la migracion nueva y su reversa en el registro de release; nunca editar datos de produccion a mano.
8. Para Free Tier, probar restauracion con `.\scripts\supabase-restore-test.ps1 -BackupPath <dump> -IUnderstandThisIsTemporary` contra una base temporal.
9. Si una migracion falla, detener el deploy, conservar los logs y ejecutar solo la reversa aprobada. No usar `reset` ni borrar tablas en produccion.

## Smoke antes de invitar

- Login, creacion de heroe y seleccion de identidad.
- Compra, forja, mueble, ataque de jefe y reclamo de recompensa con doble clic y refresh.
- Dos cuentas beta no pueden leer ni modificar el progreso de la otra.
- Vista movil 360-430 px: identidad, combate, inventario, sala y tienda.
- Revisar errores 4xx/5xx y el tablero de feedback.
- Revisar `dungeon_beta_monitoring_24h` con rol privilegiado.
- Ejecutar `select * from public.scan_dungeon_beta_alerts();` o `.\scripts\supabase-beta-alerts.ps1`.
