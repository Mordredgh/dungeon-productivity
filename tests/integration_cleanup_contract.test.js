const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const index = read('index.html');
const sw = read('sw.js');

assert(!fs.existsSync(path.join(root, 'js', 'duolingo.js')), 'js/duolingo.js no debe existir: Duolingo fue eliminado por cierre de API pública.');
assert(!index.includes('duolingo.js'), 'index.html no debe cargar duolingo.js.');
assert(!sw.includes('duolingo.js'), 'sw.js no debe precachear duolingo.js.');
assert(!index.includes('calWidgetContent'), 'Integraciones no debe renderizar una tarjeta vacía de calendario.');

console.log('integration_cleanup_contract ok');
