const assert = require('node:assert/strict');
const fs = require('node:fs');

const character = fs.readFileSync('js/character.js', 'utf8');
const config = fs.readFileSync('js/config.js', 'utf8');
const quests = fs.readFileSync('js/quests.js', 'utf8');
const battle = fs.readFileSync('js/boss_battle.js', 'utf8');
const hero = fs.readFileSync('js/hero.js', 'utf8');
const classMigration = fs.readFileSync('supabase/migrations/20260719_class_bonus_alignment.sql', 'utf8');
const migration = fs.readFileSync('supabase/migrations/20260719_server_identity_selection.sql', 'utf8');

assert.match(migration, /create or replace function public\.choose_initial_dungeon_identity/i);
assert.match(migration, /auth\.uid\(\) is null/i);
assert.match(migration, /for update/i);
assert.match(migration, /p_race not in \('humano','elfo','enano','orco'\)/i);
assert.match(migration, /p_hero_class not in \('guerrero','mago','picaro','clerigo','arquero','fundador'\)/i);
assert.match(character, /rpc\('choose_initial_dungeon_identity'/);
assert.doesNotMatch(character, /saveHero\(\{ name:heroName, race, hero_class:heroClass/);
assert.match(character, /clerigo:.*Voto protector/);
assert.match(character, /fundador:.*Arquitecto de campaña/);
assert.match(config, /clerigo:.*Bendición Curativa.*power:0\.36/);
assert.match(config, /fundador:.*Visión Estratégica.*power:0\.35/);
assert.match(quests, /fundador:\s*\{ mult: 1\.3, keys: \['meta', 'objetivo', 'proyecto'/);
assert.doesNotMatch(battle, /hero\.hero_class === 'fundador'.*addGold/s);
assert.match(hero, /fundador:\s*\{\s*\}/);
assert.match(classMigration, /v_hero\.hero_class = 'fundador' and \(lower\(coalesce\(v_quest\.tags, ''\)\) like '%meta%'/);

console.log('Contrato de identidad inicial OK');
