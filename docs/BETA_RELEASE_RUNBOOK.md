# Runbook de lanzamiento beta

## Backup y rollback

1. Crear un backup manual desde **Supabase → Database → Backups** y anotar fecha, proyecto y migración aplicada.
2. Guardar el SQL de la migración nueva y su reversa en el registro de release; nunca editar datos de producción a mano.
3. Probar restauración en un proyecto temporal antes de abrir invitaciones.
4. Si una migración falla, detener el deploy, conservar los logs y ejecutar sólo la reversa aprobada. No usar `reset` ni borrar tablas en producción.

## Smoke antes de invitar

- Login, creación de héroe y selección de identidad.
- Compra, forja, mueble, ataque de jefe y reclamo de recompensa con doble clic y refresh.
- Dos cuentas beta no pueden leer ni modificar el progreso de la otra.
- Vista móvil 360–430 px: identidad, combate, inventario, sala y tienda.
- Revisar errores 4xx/5xx y el tablero de feedback.
