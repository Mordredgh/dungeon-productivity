'use strict';

/* ── ÁRBOL DE HABILIDADES ────────────────────────────────────
   5 habilidades por clase en 3 tiers.
   Cuesta 1 skill_point (ganado al subir de nivel).
   Guardado en hero.skill_tree (jsonb).
   ─────────────────────────────────────────────────────────── */

const SKILL_TREE_DEFS = {
  guerrero: [
    { id:'golpe_critico', tier:1, name:'Golpe Crítico',       icon:'⚔️', desc:'+10% XP en misiones épicas', requires:[] },
    { id:'resistencia',   tier:1, name:'Resistencia',         icon:'🛡️', desc:'+10 HP máximo permanente',   requires:[] },
    { id:'furia',         tier:2, name:'Furia de Batalla',    icon:'🔥', desc:'+15% XP épicas y principales',requires:['golpe_critico'] },
    { id:'parar_golpe',   tier:2, name:'Parar el Golpe',      icon:'🛡️', desc:'-50% daño recibido en tormentas', requires:['resistencia'] },
    { id:'berserker_perm',tier:3, name:'Berserker Eterno',    icon:'⚡', desc:'+25% XP en todas las misiones', requires:['furia','parar_golpe'] },
  ],
  mago: [
    { id:'foco_arcano',   tier:1, name:'Foco Arcano',         icon:'🔮', desc:'-10% costo de fragmentos de hechizo', requires:[] },
    { id:'sabiduria',     tier:1, name:'Sabiduría Arcana',    icon:'📚', desc:'+5% XP en todas las misiones',  requires:[] },
    { id:'amplificar',    tier:2, name:'Amplificar',          icon:'✨', desc:'+15% XP en todas las misiones', requires:['sabiduria'] },
    { id:'mana_latente',  tier:2, name:'Maná Latente',        icon:'💧', desc:'CD de habilidad de clase -2 horas', requires:['foco_arcano'] },
    { id:'archiimago',    tier:3, name:'Archiimago',          icon:'🌟', desc:'+25% XP global',               requires:['amplificar','mana_latente'] },
  ],
  picaro: [
    { id:'bolsillos',     tier:1, name:'Manos Rápidas',       icon:'🪙', desc:'+10% Oro en todas las misiones', requires:[] },
    { id:'sombras',       tier:1, name:'Moverse en Sombras',  icon:'🌑', desc:'+10% XP en misiones side',     requires:[] },
    { id:'veneno',        tier:2, name:'Hoja Envenenada',     icon:'⚗️', desc:'+20% Oro total',               requires:['bolsillos'] },
    { id:'asesino',       tier:2, name:'Instinto de Asesino', icon:'🗡️', desc:'+20% XP en misiones side',    requires:['sombras'] },
    { id:'maestro_ladron',tier:3, name:'Maestro Ladrón',      icon:'💰', desc:'+30% Oro + +15% XP side',     requires:['veneno','asesino'] },
  ],
  clerigo: [
    { id:'fervor',        tier:1, name:'Fervor Sagrado',      icon:'✝️', desc:'+5 HP al completar daily',    requires:[] },
    { id:'bendicion',     tier:1, name:'Bendición',           icon:'💚', desc:'+10% HP máximo permanente',   requires:[] },
    { id:'sanacion_mayor',tier:2, name:'Sanación Mayor',      icon:'❤️', desc:'+10 HP al completar side',   requires:['fervor'] },
    { id:'escudo_divino', tier:2, name:'Escudo Divino',       icon:'🌟', desc:'Amuleto dura 2 usos en vez de 1', requires:['bendicion'] },
    { id:'arcangel',      tier:3, name:'Arcángel',            icon:'👼', desc:'+10 HP por cada misión completada', requires:['sanacion_mayor','escudo_divino'] },
  ],
  arquero: [
    { id:'ojo_agudo',     tier:1, name:'Ojo Agudo',           icon:'🎯', desc:'+10% XP en misiones semanales', requires:[] },
    { id:'recarga_rap',   tier:1, name:'Recarga Rápida',      icon:'⚡', desc:'+5% XP en todas las misiones', requires:[] },
    { id:'precision',     tier:2, name:'Precisión Letal',     icon:'🏹', desc:'+20% XP en semanales',         requires:['ojo_agudo'] },
    { id:'flechazo',      tier:2, name:'Flechazo Certero',    icon:'💥', desc:'+10% XP en épicas',            requires:['recarga_rap'] },
    { id:'leyenda_arco',  tier:3, name:'Leyenda del Arco',    icon:'🌟', desc:'+25% XP semanales + épicas',   requires:['precision','flechazo'] },
  ],
  fundador: [
    { id:'caos_creativo', tier:1, name:'Caos Creativo',       icon:'🚀', desc:'+5% XP en todas las misiones', requires:[] },
    { id:'red_contactos', tier:1, name:'Red de Contactos',    icon:'🤝', desc:'+10% Oro global',              requires:[] },
    { id:'vision_est',    tier:2, name:'Visión Estratégica',  icon:'📊', desc:'+10% XP en todas las misiones',requires:['caos_creativo'] },
    { id:'pivot',         tier:2, name:'Pivot Rápido',        icon:'🔄', desc:'Revive 1 daily por día sin penalización', requires:['red_contactos'] },
    { id:'senor_caos',    tier:3, name:'Señor del Caos',      icon:'👑', desc:'+15% XP + Oro en todo',        requires:['vision_est','pivot'] },
  ],
};

/* Ramas extra: cada clase gana especialización y la raza aporta un linaje propio. */
const SKILL_CLASS_EXPANSIONS = {
  guerrero:[
    { id:'war_vanguardia', tier:1, name:'Vanguardia', icon:'🛡️', desc:'+5 HP máximo', requires:[] },
    { id:'war_cazador', tier:2, name:'Cazador de Jefes', icon:'🐲', desc:'+8% XP en misiones épicas', requires:['golpe_critico'] },
    { id:'war_estandarte', tier:2, name:'Estandarte de Guerra', icon:'🚩', desc:'+8% XP en misiones principales', requires:['resistencia'] },
    { id:'war_titan', tier:3, name:'Corazón de Titán', icon:'🔥', desc:'+10 HP máximo', requires:['war_cazador','war_estandarte'] },
  ],
  mago:[
    { id:'mag_archivo', tier:1, name:'Archivo Vivo', icon:'📜', desc:'+4% XP en todas las misiones', requires:[] },
    { id:'mag_ritual', tier:2, name:'Ritual de Luna', icon:'🌙', desc:'+8% XP en misiones épicas', requires:['foco_arcano'] },
    { id:'mag_alquimia', tier:2, name:'Alquimia Áurea', icon:'⚗️', desc:'+8% Oro en todas las misiones', requires:['sabiduria'] },
    { id:'mag_nexo', tier:3, name:'Nexo Astral', icon:'🪐', desc:'+8% XP global', requires:['mag_ritual','mag_alquimia'] },
  ],
  picaro:[
    { id:'rog_saqueo', tier:1, name:'Ojo del Saqueador', icon:'👁️', desc:'+6% Oro en todas las misiones', requires:[] },
    { id:'rog_rastro', tier:2, name:'Rastro Silencioso', icon:'👣', desc:'+8% XP en misiones side', requires:['sombras'] },
    { id:'rog_contrato', tier:2, name:'Contrato Dorado', icon:'📜', desc:'+8% Oro total', requires:['bolsillos'] },
    { id:'rog_noche', tier:3, name:'Corona de la Noche', icon:'🌘', desc:'+8% XP side', requires:['rog_rastro','rog_contrato'] },
  ],
  clerigo:[
    { id:'cle_luz', tier:1, name:'Luz Persistente', icon:'🕯️', desc:'+5 HP máximo', requires:[] },
    { id:'cle_peregrino', tier:2, name:'Paso del Peregrino', icon:'🕊️', desc:'+8% XP en misiones diarias', requires:['fervor'] },
    { id:'cle_diezmo', tier:2, name:'Diezmo Bendito', icon:'✨', desc:'+6% Oro en todas las misiones', requires:['bendicion'] },
    { id:'cle_aurora', tier:3, name:'Aurora Inmortal', icon:'🌅', desc:'+10 HP máximo', requires:['cle_peregrino','cle_diezmo'] },
  ],
  arquero:[
    { id:'arc_sendero', tier:1, name:'Sendero Verde', icon:'🌲', desc:'+4% XP en todas las misiones', requires:[] },
    { id:'arc_cazador', tier:2, name:'Cazador Paciente', icon:'🏹', desc:'+8% XP en misiones semanales', requires:['ojo_agudo'] },
    { id:'arc_botin', tier:2, name:'Presa Dorada', icon:'🪙', desc:'+8% Oro en todas las misiones', requires:['recarga_rap'] },
    { id:'arc_halcon', tier:3, name:'Ojo de Halcón', icon:'🦅', desc:'+8% XP semanales', requires:['arc_cazador','arc_botin'] },
  ],
  fundador:[
    { id:'fun_red', tier:1, name:'Red Viva', icon:'🕸️', desc:'+4% XP en todas las misiones', requires:[] },
    { id:'fun_riesgo', tier:2, name:'Riesgo Calculado', icon:'🎲', desc:'+8% XP en misiones épicas', requires:['caos_creativo'] },
    { id:'fun_tesoro', tier:2, name:'Capital Inicial', icon:'💰', desc:'+8% Oro en todas las misiones', requires:['red_contactos'] },
    { id:'fun_legado', tier:3, name:'Legado Fundador', icon:'👑', desc:'+8% XP global', requires:['fun_riesgo','fun_tesoro'] },
  ],
};
const SKILL_RACE_DEFS = {
  humano:[
    { id:'race_humano_voluntad', tier:1, name:'Voluntad Humana', icon:'🧭', desc:'+3% XP en todas las misiones', requires:[] },
    { id:'race_humano_legado', tier:2, name:'Legado Mortal', icon:'🏛️', desc:'+5% Oro en todas las misiones', requires:['race_humano_voluntad'] },
  ],
  elfo:[
    { id:'race_elfo_luna', tier:1, name:'Sangre Lunar', icon:'🌙', desc:'+4% XP en misiones épicas', requires:[] },
    { id:'race_elfo_raices', tier:2, name:'Raíces Eternas', icon:'🌿', desc:'+5 HP máximo', requires:['race_elfo_luna'] },
  ],
  enano:[
    { id:'race_enano_yunque', tier:1, name:'Hijo del Yunque', icon:'⚒️', desc:'+5% Oro en todas las misiones', requires:[] },
    { id:'race_enano_granito', tier:2, name:'Piel de Granito', icon:'🪨', desc:'+10 HP máximo', requires:['race_enano_yunque'] },
  ],
  orco:[
    { id:'race_orco_furia', tier:1, name:'Furia Ancestral', icon:'🩸', desc:'+4% XP en misiones principales', requires:[] },
    { id:'race_orco_clan', tier:2, name:'Juramento de Clan', icon:'🐗', desc:'+6% XP en misiones side', requires:['race_orco_furia'] },
  ],
};
const CLASS_DOCTRINES = {
  guerrero:[{ id:'bastion', name:'Bastión', icon:'🛡️', desc:'+8 HP máximo' },{ id:'duelista', name:'Duelista', icon:'⚔️', desc:'+6% XP en épicas' }],
  mago:[{ id:'oraculo', name:'Oráculo', icon:'🔮', desc:'+6% XP global' },{ id:'alquimista', name:'Alquimista', icon:'⚗️', desc:'+8% oro global' }],
  picaro:[{ id:'saboteador', name:'Saboteador', icon:'🗡️', desc:'+10% oro en encargos' },{ id:'explorador', name:'Explorador', icon:'🧭', desc:'+8% XP semanal' }],
  clerigo:[{ id:'guardián', name:'Guardián', icon:'✨', desc:'+8 HP máximo' },{ id:'peregrino', name:'Peregrino', icon:'🕯️', desc:'+8% XP diaria' }],
  arquero:[{ id:'acechador', name:'Acechador', icon:'🏹', desc:'+8% XP semanal' },{ id:'cartógrafo', name:'Cartógrafo', icon:'🗺️', desc:'+6% XP global' }],
  fundador:[{ id:'visionario', name:'Visionario', icon:'📜', desc:'+6% XP global' },{ id:'mercader', name:'Mercader', icon:'💰', desc:'+8% oro global' }],
};
function getAllSkillDefs(cls = hero?.hero_class || 'guerrero', race = heroRace || hero?.race || 'humano') {
  return [...(SKILL_TREE_DEFS[cls] || []), ...(SKILL_CLASS_EXPANSIONS[cls] || []), ...(SKILL_RACE_DEFS[race] || [])];
}

function getHeroSkillTree() {
  try { return JSON.parse(hero.skill_tree || '{}'); } catch { return {}; }
}

function hasSkill(skillId) {
  return !!getHeroSkillTree()[skillId];
}
function getHeroDoctrine() { return getHeroSkillTree().__doctrine || ''; }
async function chooseDoctrine(id) {
  const cls = hero?.hero_class || 'guerrero';
  const doctrine = (CLASS_DOCTRINES[cls] || []).find(item => item.id === id);
  const tree = getHeroSkillTree();
  if (!doctrine || tree.__doctrine) return;
  tree.__doctrine = id;
  await saveHero({ skill_tree: JSON.stringify(tree) });
  toast('✦', `Doctrina elegida: ${doctrine.name}.`);
  renderCharacterSheet();
}

function canLearnSkill(skillDef) {
  if (hasSkill(skillDef.id)) return false;
  if ((hero.skill_points || 0) < 1) return false;
  return skillDef.requires.every(r => hasSkill(r));
}

async function learnSkill(skillId) {
  const cls   = hero.hero_class || 'guerrero';
  const defs  = getAllSkillDefs(cls);
  const skill = defs.find(s => s.id === skillId);
  if (!skill || !canLearnSkill(skill)) return;

  const tree = getHeroSkillTree();
  tree[skillId] = true;
  hero.skill_points = Math.max(0, (hero.skill_points || 0) - 1);
  await saveHero({ skill_tree: JSON.stringify(tree), skill_points: hero.skill_points });
  toast('🌟', `Habilidad aprendida: ${skill.name}`);
  renderCharacterSheet();
}

function getSkillTreeXPBonus(type) {
  const cls  = hero?.hero_class || 'guerrero';
  const defs = getAllSkillDefs(cls);
  const doctrine = (CLASS_DOCTRINES[cls] || []).find(item => item.id === getHeroDoctrine());
  const doctrineValue = doctrine?.desc.includes('XP global') ? .06 : doctrine?.desc.includes('XP en épicas') && type === 'main' ? .06 : doctrine?.desc.includes('XP semanal') && type === 'weekly' ? .08 : doctrine?.desc.includes('XP diaria') && type === 'daily' ? .08 : 0;
  return _skillXPBonus(defs, type) + doctrineValue;
  /* Legacy parser retained below for backwards-compatible saved descriptions. */
  let bonus  = 0;
  for (const s of defs) {
    if (!hasSkill(s.id)) continue;
    if (s.desc.includes('XP en todas') || s.desc.includes('XP global')) {
      const m = s.desc.match(/\+(\d+)%/);
      if (m) bonus += parseInt(m[1]) / 100;
    }
    if (type === 'main' && s.desc.includes('XP en misiones épicas y principales')) {
      const m = s.desc.match(/\+(\d+)%/); if (m) bonus += parseInt(m[1]) / 100;
    }
    if (type === 'main' && s.desc.includes('XP en misiones épicas')) {
      const m = s.desc.match(/\+(\d+)%/); if (m) bonus += parseInt(m[1]) / 100;
    }
    if (type === 'side' && (s.desc.includes('XP en misiones side') || s.desc.includes('XP side'))) {
      const m = s.desc.match(/\+(\d+)%/); if (m) bonus += parseInt(m[1]) / 100;
    }
    if (type === 'weekly' && (s.desc.includes('XP en misiones semanales') || s.desc.includes('XP semanales') || s.desc.includes('XP semanales + épicas'))) {
      const m = s.desc.match(/\+(\d+)%/); if (m) bonus += parseInt(m[1]) / 100;
    }
  }
  return bonus;
}

function _skillXPBonus(defs, type) {
  const aliases = { main:['principal','principales'], side:['side','secundaria','secundarias'], weekly:['semanal','semanales'], daily:['diaria','diarias'] };
  return defs.filter(skill => hasSkill(skill.id)).reduce((total, skill) => {
    const desc = skill.desc.toLowerCase();
    const value = Number((desc.match(/\+(\d+)%/) || [])[1] || 0) / 100;
    if (!value) return total;
    if (desc.includes('xp en todas') || desc.includes('xp global')) return total + value;
    return aliases[type]?.some(word => desc.includes(word)) ? total + value : total;
  }, 0);
}

function getSkillTreeGoldBonus() {
  const cls  = hero?.hero_class || 'guerrero';
  const defs = getAllSkillDefs(cls);
  const doctrine = (CLASS_DOCTRINES[cls] || []).find(item => item.id === getHeroDoctrine());
  const doctrineValue = doctrine?.desc.includes('oro global') ? .08 : doctrine?.desc.includes('oro en encargos') ? .10 : 0;
  return defs.filter(skill => hasSkill(skill.id)).reduce((total, skill) => {
    const desc = skill.desc.toLowerCase();
    const value = Number((desc.match(/\+(\d+)%/) || [])[1] || 0) / 100;
    return desc.includes('oro') ? total + value : total;
  }, doctrineValue);
  let bonus  = 0;
  for (const s of defs) {
    if (!hasSkill(s.id)) continue;
    if (s.desc.includes('Oro')) {
      const m = s.desc.match(/\+(\d+)%/); if (m) bonus += parseInt(m[1]) / 100;
    }
  }
  return bonus;
}

function getSkillMaxHP() {
  const cls  = hero?.hero_class || 'guerrero';
  const defs = getAllSkillDefs(cls);
  let bonus  = 0;
  for (const s of defs) {
    if (!hasSkill(s.id)) continue;
    if (s.desc.includes('HP máximo')) {
      const m = s.desc.match(/\+(\d+) HP/); if (m) bonus += parseInt(m[1]);
    }
    if (s.desc.includes('10% HP máximo')) bonus += Math.round((hero?.hp_max || 100) * 0.1);
  }
  return bonus;
}

/* ── RENDER ───────────────────────────────────────────────── */
const _SKT_META = {
  guerrero: { icon:'⚔️', label:'Guerrero',  color:'#ef4444' },
  mago:     { icon:'🔮', label:'Mago',      color:'#a855f7' },
  picaro:   { icon:'🗡️', label:'Pícaro',   color:'#60a5fa' },
  clerigo:  { icon:'✝️', label:'Clérigo',  color:'#22c55e' },
  arquero:  { icon:'🏹', label:'Arquero',  color:'#f59e0b' },
  fundador: { icon:'🚀', label:'Fundador', color:'#06b6d4' },
};

function renderSkillTree() {
  const el = document.getElementById('skillTreeContent');
  if (!el || !hero) return;

  _renderExpandedSkillTree(el);
  _injectDoctrineChooser(el);
  return;

  const cls  = hero.hero_class || 'guerrero';
  const defs = SKILL_TREE_DEFS[cls] || [];
  const pts  = hero.skill_points || 0;
  const meta = _SKT_META[cls] || { icon:'⚡', label:cls, color:'var(--accent)' };

  const t1 = defs.filter(s => s.tier === 1);
  const t2 = defs.filter(s => s.tier === 2);
  const t3 = defs.filter(s => s.tier === 3);

  const connColor = (src, dst) => {
    if (hasSkill(src?.id) && hasSkill(dst?.id)) return 'rgba(249,168,37,.65)';
    if (hasSkill(src?.id)) return 'rgba(137,180,250,.45)';
    return 'rgba(137,180,250,.15)';
  };

  const straightSVG = `<svg class="skt-svg" viewBox="0 0 228 36" preserveAspectRatio="none">
    <line x1="45" y1="0" x2="45" y2="36" stroke="${connColor(t1[0],t2[0])}" stroke-width="2"/>
    <line x1="183" y1="0" x2="183" y2="36" stroke="${connColor(t1[1],t2[1])}" stroke-width="2"/>
  </svg>`;

  const mergeSVG = `<svg class="skt-svg" viewBox="0 0 228 44" preserveAspectRatio="none">
    <line x1="45" y1="44" x2="114" y2="0" stroke="${connColor(t2[0],t3[0])}" stroke-width="2"/>
    <line x1="183" y1="44" x2="114" y2="0" stroke="${connColor(t2[1],t3[0])}" stroke-width="2"/>
  </svg>`;

  const nodeHtml = (s, isApex = false) => {
    const learned   = hasSkill(s.id);
    const learnable = canLearnSkill(s);
    const state     = learned ? 'skt-learned' : learnable ? 'skt-available' : 'skt-locked';
    const reqNames  = s.requires.map(r => defs.find(x => x.id === r)?.name || r).join(', ');
    const shortDesc = s.desc.length > 32 ? s.desc.slice(0, 30) + '…' : s.desc;
    return `
      <div class="skt-node ${state}${isApex ? ' skt-apex' : ''}"
           onclick="${learnable ? `learnSkill('${s.id}')` : ''}"
           title="${escHtml(s.desc)}${reqNames ? ' — Requiere: ' + reqNames : ''}">
        <div class="skt-ring">
          <span class="skt-icon">${s.icon}</span>
          ${learned ? '<div class="skt-check">✓</div>' : ''}
          ${!learned && !learnable ? '<div class="skt-padlock">🔒</div>' : ''}
        </div>
        <div class="skt-name">${escHtml(s.name)}</div>
        <div class="skt-eff">${escHtml(shortDesc)}</div>
        ${learnable ? `<div class="skt-cta">★ Aprender</div>` : ''}
      </div>`;
  };

  el.innerHTML = `
    <div class="skt-wrap">
      <div class="skt-header">
        <div class="skt-class-badge" style="--skt-c:${meta.color}">
          <span class="skt-class-icon">${meta.icon}</span>
          <span class="skt-class-name">${meta.label}</span>
        </div>
        <div class="skt-pts ${pts > 0 ? 'skt-pts-glow' : ''}">
          ★ ${pts} punto${pts !== 1 ? 's' : ''}
        </div>
      </div>

      <div class="skt-tree">
        <div class="skt-row skt-row-apex">
          ${t3.map(s => nodeHtml(s, true)).join('')}
        </div>
        <div class="skt-conn-merge">${mergeSVG}</div>
        <div class="skt-row">
          ${t2.map(s => nodeHtml(s)).join('')}
        </div>
        <div class="skt-conn-straight">${straightSVG}</div>
        <div class="skt-row">
          ${t1.map(s => nodeHtml(s)).join('')}
        </div>
      </div>

      <div class="skt-legend">
        <span class="skt-leg skt-leg-learned">✓ Aprendida</span>
        <span class="skt-leg skt-leg-avail">+ Disponible</span>
        <span class="skt-leg skt-leg-locked">🔒 Bloqueada</span>
      </div>
    </div>`;
}

function _injectDoctrineChooser(el) {
  const cls = hero?.hero_class || 'guerrero';
  const choices = CLASS_DOCTRINES[cls] || [];
  const selected = getHeroDoctrine();
  const shell = el.querySelector('.skt3-shell');
  const board = el.querySelector('.skt3-board');
  if (!shell || !board || !choices.length) return;
  const section = document.createElement('section');
  section.className = 'skt3-doctrine';
  section.innerHTML = `<div><span>DOCTRINA DE CLASE</span><b>${selected ? 'Rumbo sellado' : 'Elige una senda permanente'}</b><small>${selected ? 'Una doctrina define la identidad de este héroe.' : 'No cuesta puntos; no se puede cambiar después.'}</small></div><div class="skt3-doctrine-options">${choices.map(choice => `<button class="${selected === choice.id ? 'selected' : ''}" ${selected ? 'disabled' : `onclick="chooseDoctrine('${choice.id}')"`}><i>${choice.icon}</i><b>${choice.name}</b><small>${choice.desc}</small></button>`).join('')}</div>`;
  shell.insertBefore(section, board);
}

function _renderExpandedSkillTree(el) {
  _renderSkillTreeConstellation(el);
  return;
  const cls = hero.hero_class || 'guerrero';
  const race = heroRace || hero.race || 'humano';
  const defs = getAllSkillDefs(cls, race);
  const classDefs = [...(SKILL_TREE_DEFS[cls] || []), ...(SKILL_CLASS_EXPANSIONS[cls] || [])];
  const raceDefs = SKILL_RACE_DEFS[race] || [];
  const meta = _SKT_META[cls] || { icon:'⚡', label:cls, color:'var(--accent)' };
  const raceLabel = { humano:'Humano', elfo:'Elfo', enano:'Enano', orco:'Orco' }[race] || race;
  const card = skill => {
    const learned = hasSkill(skill.id);
    const learnable = canLearnSkill(skill);
    const reqs = skill.requires.map(id => defs.find(other => other.id === id)?.name).filter(Boolean).join(' · ');
    const state = learned ? 'sktx-learned' : learnable ? 'sktx-available' : 'sktx-locked';
    return `<button class="sktx-card ${state}" ${learnable ? `onclick="learnSkill('${skill.id}')"` : 'disabled'} title="${escHtml(skill.desc)}${reqs ? ' · Requiere: ' + escHtml(reqs) : ''}">
      <span class="sktx-icon">${skill.icon}</span><span class="sktx-copy"><b>${escHtml(skill.name)}</b><small>${escHtml(skill.desc)}</small>${reqs && !learned ? `<em>Requiere: ${escHtml(reqs)}</em>` : ''}</span><span class="sktx-state">${learned ? '✓' : learnable ? '+1' : '🔒'}</span>
    </button>`;
  };
  const tiers = [1,2,3];
  el.innerHTML = `<section class="sktx-shell" style="--skt-c:${meta.color}">
    <header class="sktx-header"><div><span>${meta.icon} ${meta.label}</span><h3>Doctrina de combate</h3><p>Ramas de clase y linaje racial. Elige un rumbo, no sólo estadísticas.</p></div><div class="sktx-points">✦ <b>${hero.skill_points || 0}</b><small>puntos disponibles</small></div></header>
    <div class="sktx-layout"><div class="sktx-main"><div class="sktx-section-title">${meta.icon} Especialización de ${meta.label}</div>${tiers.map(tier => `<div class="sktx-tier"><div class="sktx-tier-label">Rango ${tier}</div><div class="sktx-grid">${classDefs.filter(skill => skill.tier === tier).map(card).join('')}</div></div>`).join('')}</div><aside class="sktx-race"><div class="sktx-section-title">✧ Linaje ${raceLabel}</div><p>Pasivos exclusivos de tu raza.</p>${raceDefs.map(card).join('')}</aside></div>
    <footer class="sktx-footer"><span>✓ Aprendida</span><span>+1 Disponible</span><span>🔒 Requiere una senda previa</span></footer>
  </section>`;
}

function _renderSkillTreeConstellation(el) {
  const cls = hero.hero_class || 'guerrero';
  const race = heroRace || hero.race || 'humano';
  const all = getAllSkillDefs(cls, race);
  const classDefs = [...(SKILL_TREE_DEFS[cls] || []), ...(SKILL_CLASS_EXPANSIONS[cls] || [])];
  const raceDefs = SKILL_RACE_DEFS[race] || [];
  const meta = _SKT_META[cls] || { icon:'⚡', label:cls, color:'#a855f7' };
  const byTier = tier => classDefs.filter(skill => skill.tier === tier);
  const node = skill => {
    const learned = hasSkill(skill.id);
    const ready = canLearnSkill(skill);
    const req = skill.requires.map(id => all.find(item => item.id === id)?.name).filter(Boolean).join(' · ');
    return `<button class="skt3-node ${learned ? 'is-learned' : ready ? 'is-ready' : 'is-locked'}" ${ready ? `onclick="learnSkill('${skill.id}')"` : 'disabled'} title="${escHtml(skill.desc)}${req ? ' · Requiere: ' + escHtml(req) : ''}"><span class="skt3-orb">${skill.icon}</span><b>${escHtml(skill.name)}</b><small>${escHtml(skill.desc)}</small>${!learned && req ? `<em>${escHtml(req)}</em>` : ''}</button>`;
  };
  const connector = `<svg class="skt3-lines" viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden="true"><g>
    <path d="M170 410 L170 310 M500 410 L380 310 M830 410 L620 310 M380 310 L330 175 M620 310 L670 175 M330 175 L450 58 M670 175 L550 58"/>
  </g></svg>`;
  el.innerHTML = `<section class="skt3-shell" style="--skt3:${meta.color}"><header class="skt3-header"><div><span>${meta.icon} Senda de ${meta.label}</span><h3>Constelación del héroe</h3><p>Desbloquea nodos conectados. Cada decisión abre una ruta distinta.</p></div><div class="skt3-points"><b>✦ ${hero.skill_points || 0}</b><small>puntos de talento</small></div></header><div class="skt3-board">${connector}<div class="skt3-tier skt3-apex">${byTier(3).map(node).join('')}</div><div class="skt3-tier skt3-mid">${byTier(2).map(node).join('')}</div><div class="skt3-tier skt3-root">${byTier(1).map(node).join('')}</div></div><section class="skt3-race"><div><span>✧ Linaje racial</span><p>${{humano:'Adaptación y determinación',elfo:'Memoria lunar y raíces',enano:'Piedra, acero y resistencia',orco:'Furia, clan y conquista'}[race] || race}</p></div><div class="skt3-race-nodes">${raceDefs.map(node).join('')}</div></section><footer class="skt3-key"><span>✦ Aprendida</span><span>◉ Disponible</span><span>◌ Bloqueada</span></footer></section>`;
}
