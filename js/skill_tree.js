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

function getHeroSkillTree() {
  try { return JSON.parse(hero.skill_tree || '{}'); } catch { return {}; }
}

function hasSkill(skillId) {
  return !!getHeroSkillTree()[skillId];
}

function canLearnSkill(skillDef) {
  if (hasSkill(skillDef.id)) return false;
  if ((hero.skill_points || 0) < 1) return false;
  return skillDef.requires.every(r => hasSkill(r));
}

async function learnSkill(skillId) {
  const cls   = hero.hero_class || 'guerrero';
  const defs  = SKILL_TREE_DEFS[cls] || [];
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
  const defs = SKILL_TREE_DEFS[cls] || [];
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

function getSkillTreeGoldBonus() {
  const cls  = hero?.hero_class || 'guerrero';
  const defs = SKILL_TREE_DEFS[cls] || [];
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
  const defs = SKILL_TREE_DEFS[cls] || [];
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
