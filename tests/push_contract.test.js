const assert = require('node:assert/strict');
const fs = require('node:fs');
const push = fs.readFileSync('js/push.js', 'utf8');
assert.match(push, /hero_id: hero\.id/);
assert.match(push, /JSON\.stringify\(\{ hero_id: hero\.id, title, body, url \}\)/);
console.log('Contrato de push OK');
