const assert = require('node:assert/strict');
const fs = require('node:fs');

// Callejón sin salida de primer uso: el empty state de Mascotas manda a la
// tienda ("compra huevos en la tienda"), pero un héroe nuevo llega con 0 oro
// (default de la columna) y el item más barato cuesta 10. Veía todos los
// botones deshabilitados y ninguna indicación de cómo conseguir oro.
const shopJs = fs.readFileSync('js/shop.js', 'utf8');
assert.match(shopJs, /gold < 10/);
assert.match(shopJs, /Completa misiones y pomodoros para ganarlo/);

// El empty state de Mascotas debe seguir ofreciendo la ruta a la tienda —
// es el otro extremo de esa cadena.
const petsJs = fs.readFileSync('js/pets.js', 'utf8');
assert.match(petsJs, /onclick="openShop\(\)"/);

// El empty state de misiones no debe volver a señalar el "panel derecho":
// css/dungeon.css lo oculta bajo 900px, así que en móvil no existe.
for (const file of ['js/views.js', 'index.html']) {
  assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /panel derecho/, `${file} no debe señalar el panel derecho`);
}

console.log('Contrato de flujo de primer uso OK');
