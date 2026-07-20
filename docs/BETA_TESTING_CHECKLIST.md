# Beta testing — Arcanum

## Antes de invitar

- Crear dos cuentas de prueba: A y B.
- Confirmar que cada cuenta sólo ve sus misiones, héroe, mascotas, compras y sala.
- Abrir consola y verificar que no haya errores rojos tras iniciar sesión, crear misión y completar una misión.

## Casos críticos

1. Doble clic en compra, recompensa y ataque a jefe: saldo y premio cambian una sola vez.
2. Recargar durante compra/forja/ataque: el resultado queda consistente al volver.
3. Desconectar red, realizar una acción y reconectar: no hay descuento ni premio fantasma.
4. Cuenta A intenta abrir URL/ID de cuenta B: recibe acceso denegado y no altera datos.
5. Completar jefe y reto: premio visible una sola vez y persiste tras recarga.
6. Crear héroe: raza queda sellada; clase aplica un cambio gratuito y después coste/enfriamiento.

## Reporte de beta

Cada reporte debe incluir: cuenta de prueba, hora local, pantalla, pasos exactos, resultado esperado, resultado real y captura de consola/red si existe. Nunca incluir contraseñas ni tokens.

## Monitoreo

- Revisar Supabase Logs por errores 4xx/5xx y Edge Functions cada día de beta.
- Clasificar: bloqueo, pérdida/duplicado de economía, privacidad, visual, menor.
- Pausar nuevas invitaciones si hay pérdida/duplicado de oro, XP, inventario o aislamiento entre cuentas.
