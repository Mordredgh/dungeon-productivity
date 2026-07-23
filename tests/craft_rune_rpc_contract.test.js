const assert = require('node:assert/strict');
const fs = require('node:fs');

// craftRune() insertaba la runa directo en dungeon_runes desde el cliente sin
// que nada del lado servidor validara que los 5 fragmentos requeridos
// realmente se habían gastado — con devtools se podía forjar runas gratis.
// craft_dungeon_rune valida y descuenta el fragmento y crea la runa en una
// sola transacción; la política RLS ya no permite INSERT directo del dueño.
const runesJs = fs.readFileSync('js/runes.js', 'utf8');
assert.match(runesJs, /db\.rpc\('craft_dungeon_rune'/);
assert.doesNotMatch(runesJs, /db\.from\('dungeon_runes'\)\.insert/);

console.log('Contrato de craft_dungeon_rune OK');
