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
function renderSkillTree() {
  const el = document.getElementById('skillTreeContent');
  if (!el || !hero) return;

  const cls   = hero.hero_class || 'guerrero';
  const defs  = SKILL_TREE_DEFS[cls] || [];
  const pts   = hero.skill_points || 0;
  const tiers = [1, 2, 3];

  el.innerHTML = `
    <div class="skill-pts-bar">
      <span>Puntos disponibles: <strong>${pts}</strong></span>
      <span style="color:var(--text2);font-size:11px">+1 punto por nivel</span>
    </div>
    ${tiers.map(t => {
      const skills = defs.filter(s => s.tier === t);
      return `
        <div class="skill-tier">
          <div class="skill-tier-label">Tier ${t}</div>
          <div class="skill-tier-row">
            ${skills.map(s => {
              const learned   = hasSkill(s.id);
              const learnable = canLearnSkill(s);
              const locked    = !learned && !learnable;
              return `
                <div class="skill-card ${learned ? 'skill-learned' : learnable ? 'skill-available' : 'skill-locked'}"
                     onclick="${learnable ? `learnSkill('${s.id}')` : ''}"
                     title="${s.desc}${s.requires.length ? ' | Requiere: '+s.requires.map(r=>defs.find(x=>x.id===r)?.name||r).join(', ') : ''}">
                  <div class="skill-icon">${s.icon}</div>
                  <div class="skill-name">${s.name}</div>
                  <div class="skill-desc">${s.desc}</div>
                  ${learned ? '<div class="skill-badge">✓</div>' : learnable ? '<div class="skill-badge skill-badge-learn">+ Aprender</div>' : ''}
                </div>`;
            }).join('')}
          </div>
        </div>`;
    }).join('')}`;
}
