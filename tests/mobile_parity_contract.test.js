const assert = require('node:assert/strict');
const fs = require('node:fs');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('css/dungeon.css', 'utf8');

// .dungeon-dock se oculta bajo 640px y la hoja "Más" del mobile-nav solo navega
// entre vistas, así que el fab-dial es la única superficie de herramientas en
// teléfono. Modo Focus, Pergamino y Ruleta vivían solo en el dock: en móvil
// eran inalcanzables por completo.
const fabDial = indexHtml.slice(indexHtml.indexOf('id="fabDial"'), indexHtml.indexOf('id="mobileNav"'));
for (const tool of ["getElementById('d20Btn')", "getElementById('focusBtn')", "openModal('quickNotesModal')", 'openRuleta()']) {
  assert.ok(fabDial.includes(tool), `fab-dial debe ofrecer ${tool} — el dock no existe en móvil`);
}

// La preparación táctica de jefe (elige una vez por jefe, cambia daño/guardia/
// energía) estaba en display:none bajo 430px: mecánica amputada, no adaptada.
assert.doesNotMatch(css, /\.bb-prep-panel \{ display:none; \}/);

// El FAB de feedback compartía z-index y franja inferior con .mobile-nav
// (barra fija de 60px), así que en móvil quedaba encima de la navegación.
assert.match(css, /\.beta-feedback-fab \{ bottom: calc\(72px \+ env\(safe-area-inset-bottom/);

console.log('Contrato de paridad móvil OK');
