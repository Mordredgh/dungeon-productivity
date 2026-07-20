# Cierre de economia beta

- [x] Aislar perfiles con RLS por propietario.
- [x] Migrar mision, habito y deshacer a RPC idempotentes.
- [x] Migrar inicio/cierre de pomodoro a sesion validada por servidor.
- [x] Migrar compras de tienda, forja y muebles a catalogo del servidor.
- [x] Migrar victoria, dano y recompensa de jefe a estado del servidor.
- [x] Migrar recompensas de retos, facciones y eventos a ledger del servidor.
- [x] Bloquear mutaciones directas de campos economicos tras migrar los flujos protegidos.
- [x] Anadir pruebas de integracion y publicar checklist final de beta.
- [x] Reintentos RPC, marcas pendientes y recuperacion de errores.
- [x] Ajustes moviles para identidad, combate, inventario, sala y tienda (360-430 px).
- [x] Politica de privacidad, terminos beta, reporte y runbook de backup/rollback.
- [x] Limites server-side versionados para operaciones sensibles.
- [x] Aplicar la migracion de limites en Supabase y verificar cada RPC en produccion.
- [x] Crear scripts reproducibles de preflight, backup y smoke beta.
- [ ] Activar alertas de Supabase y probar restauracion del backup en entorno temporal.
