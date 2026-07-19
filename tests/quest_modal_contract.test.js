const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');
const events = fs.readFileSync('js/events.js', 'utf8');

const quickModal = html.match(/<div class="modal-overlay" id="quickAddModal">([\s\S]*?)<\/div>\n\n<!-- QUICK NOTES MODAL -->/);
assert.ok(quickModal, 'existe el modal completo de creación');

for (const id of ['qName', 'qType', 'qPriority', 'qDeadline', 'qNotes', 'qTags', 'qEstTime', 'qRepeat', 'qStartDate', 'qDependsOn', 'qGoal', 'qZone']) {
  assert.match(quickModal[1], new RegExp(`id="${id}"`), `crear misión incluye ${id}`);
}

assert.match(quickModal[1], /class="modal-footer quest-modal-footer/, 'crear misión tiene pie de acciones estable');
assert.match(html, /id="editQuestActions"/, 'editar misión agrupa acciones secundarias');
assert.match(html, /id="editQuestPrimaryActions"/, 'editar misión agrupa acciones destructivas y guardar');
assert.match(events, /function buildQuestPayload\(/, 'crear y editar comparten el ensamblado de datos');
assert.match(events, /document\.getElementById\('addQuestBtn'\)[\s\S]{0,900}?buildQuestPayload\('q'/, 'crear misión usa todos los campos');

console.log('quest modal contract: OK');
