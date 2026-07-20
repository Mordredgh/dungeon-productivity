# Runbook de lanzamiento beta

## Backup y rollback

1. Ejecutar `.\scripts\supabase-backup.ps1` antes de migrar y conservar el `.sha256`.
2. Crear un backup manual desde **Supabase -> Database -> Backups** y anotar fecha, proyecto y migracion aplicada.
3. Ejecutar `.\scripts\supabase-beta-preflight.ps1` despues de migrar.
4. Ejecutar `.\scripts\beta-local-smoke.ps1` antes del deploy.
5. Guardar el SQL de la migracion nueva y su reversa en el registro de release; nunca editar datos de produccion a mano.
6. Probar restauracion en un proyecto temporal antes de abrir invitaciones.
7. Si una migracion falla, detener el deploy, conservar los logs y ejecutar solo la reversa aprobada. No usar `reset` ni borrar tablas en produccion.

## Smoke antes de invitar

- Login, creacion de heroe y seleccion de identidad.
- Compra, forja, mueble, ataque de jefe y reclamo de recompensa con doble clic y refresh.
- Dos cuentas beta no pueden leer ni modificar el progreso de la otra.
- Vista movil 360-430 px: identidad, combate, inventario, sala y tienda.
- Revisar errores 4xx/5xx y el tablero de feedback.
- Revisar `dungeon_beta_monitoring_24h` con rol privilegiado.
