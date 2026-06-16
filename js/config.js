'use strict';

const SUPA_URL = 'https://stdedxhxxoyostymldqn.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZGVkeGh4eG95b3N0eW1sZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTQ2NTMsImV4cCI6MjA4ODQ5MDY1M30.OUhqeeqjlQa6ufECPzOJqZ-gQB93pg8nu0g1j4lEXyI';

const TITLES = [
  'Aprendiz del Gremio','Escudero Inquieto','Explorador del Caos',
  'Guerrero del Enfoque','Cazador de Metas','Mago del Tiempo',
  'Comandante del Gremio','Campeón Legendario','Guardián del Caos',
  'Señor del Caos Productivo'
];

const XP_TABLE = { main: 100, side: 50, daily: 25, weekly: 75 };
const POM_XP = 15;
const LEVEL_BASE = 100;
const LEVEL_SCALE = 1.5;
const THEMES = ['dark', 'light', 'cyber', 'oled', 'parchment'];
const THEME_NAMES = { dark: 'Oscuro', light: 'Claro', cyber: 'Cyber', oled: 'OLED', parchment: 'Pergamino' };

const AVATARS = ['🧙','⚔️','🛡️','🏹','🗡️','🔮','🦅','🐉','💀','👑',
                 '🦁','🐺','🦊','🐻','🧝','🧜','🤺','🥷','🧟','🧛',
                 '🎯','🔥','⚡','💎','🌟','🌙','☀️','🌊','🌪️','🍀'];


const COMPLETIONS = [
  '¡El enemigo ha caído! La mazmorra tiembla ante tu poder.',
  '¡Victoria épica! Los bardos cantarán tus hazañas esta noche.',
  '¡Misión cumplida! El gremio te saluda con honores.',
  '¡Eres imparable! Tu leyenda crece con cada conquista.',
  '¡Excelente trabajo! El caos retrocede ante ti.',
  '¡La oscuridad huye! Tu determinación es tu arma más poderosa.',
  '¡Tarea destruida! XP añadidos a tu grimorio.',
  '¡Misión completada! El dragón de la procrastinación llora.',
  '¡Increíble! Otro logro grabado en las piedras del gremio.',
  '¡Eso fue épico! El Señor del Caos Productivo está satisfecho.',
  '¡Has avanzado! Cada tarea es un paso hacia la leyenda.',
  '¡Poder desbloqueado! Tu XP crece como la magia arcana.',
  '¡El campeón actúa! Nadie puede detenerte ahora.',
  '¡Victoria! El pergamino de tus logros se extiende sin fin.',
  '¡Perfecto! Hasta los dioses del Olimpo te aplauden.',
  '¡Misión eliminada! El monstruo de las tareas pendientes tiembla.',
  '¡Brillante! Tu clase te hace único en el gremio.',
  '¡Lo hiciste! El universo conspira a tu favor.',
  '¡Asombroso! Mereces una poción de celebración.',
  '¡Leyenda confirmada! La mazmorra es tuya.'
];

const RANDOM_EVENTS = [
  { id:'merchant',  icon:'🧙', title:'Mercader Misterioso',    desc:'Un anciano encapuchado te ofrece conocimiento antiguo a cambio de tu esfuerzo.',         choices:[{label:'Aceptar (+100 XP)',      effect:'xp100'},{label:'Declinar',effect:'none'}] },
  { id:'treasure',  icon:'💰', title:'Tesoro Olvidado',         desc:'Entre las ruinas del castillo encuentras una bolsa de monedas de oro olvidada.',         choices:[{label:'Tomar el botín (+80🪙)', effect:'gold80'}] },
  { id:'blessing',  icon:'✨', title:'Bendición del Gremio',    desc:'Los dioses sonríen sobre ti. Tu próxima misión valdrá el doble de XP y oro.',            choices:[{label:'Recibir la bendición',   effect:'doubleNext'}] },
  { id:'riddle',    icon:'🔮', title:'La Esfinge Habla',        desc:'"Quien actúa sin dudar conquista sin parar." La esfinge aumenta tu racha misteriosamente.', choices:[{label:'Resolver acertijo (+1 día de racha)', effect:'streak1'}] },
  { id:'tavern',    icon:'🍺', title:'Noche en la Taberna',     desc:'El posadero te invita. Descansas bien entre batallas y recuperas fuerzas.',              choices:[{label:'Descansar (+20 HP)',     effect:'hp20'}] },
  { id:'dragon',    icon:'🐉', title:'Sombra del Dragón',       desc:'Un dragón negro sobrevuela el reino al amanecer. El Jefe Semanal absorbe su poder.',      choices:[{label:'Prepararse para la batalla', effect:'bossHP50'}] },
  { id:'scroll',    icon:'📜', title:'Pergamino Antiguo',       desc:'Encuentras sabiduría perdida en la biblioteca del castillo. Las épicas brillan hoy.',     choices:[{label:'Estudiar el pergamino', effect:'mainBonus'}] },
  { id:'curse',     icon:'💀', title:'Maldición de Medianoche', desc:'Una sombra oscura te marca. Debes completar 2 misiones antes del final del día.',        choices:[{label:'Aceptar el desafío',    effect:'curse'}] },
  { id:'storm',     icon:'⚡', title:'¡Tormenta Arcana!',       desc:'Energía mágica colosal llena el aire. ¡El momento perfecto para actuar con fuerza!',     choices:[{label:'Canalizar la energía (2× XP 30min)', effect:'potion'}] },
  { id:'spirit',    icon:'👻', title:'Espíritu del Héroe Caído', desc:'El fantasma de un héroe caído te ofrece guía. Revive una de tus misiones vencidas.',    choices:[{label:'Aceptar su guía',       effect:'revive'},{label:'Respetar y alejarse', effect:'none'}] },
];

const WEATHER_TYPES = {
  clear:   { icon:'☀️',  name:'Día Despejado',   desc:'+10% XP todo el día',                           xpMult:1.1,  goldMult:1.0 },
  fog:     { icon:'🌫️', name:'Niebla Arcana',    desc:'Sin cambios — el misterio envuelve el reino',   xpMult:1.0,  goldMult:1.0 },
  storm:   { icon:'⛈️', name:'Gran Tormenta',    desc:'-10% XP pero el Jefe recibe daño doble',        xpMult:0.9,  goldMult:1.0 },
  rainbow: { icon:'🌈',  name:'Arcoíris Mágico', desc:'+30% Oro en todas las misiones hoy',            xpMult:1.0,  goldMult:1.3 },
  eclipse: { icon:'🌑',  name:'Eclipse Arcano',  desc:'HP no baja por misiones vencidas hoy',           xpMult:1.0,  goldMult:1.0 },
};

const CLASS_SKILLS = {
  mago:     { name:'Transmutación',        icon:'🔮', desc:'La próxima misión side/daily da XP de Épica (100 XP base).' },
  guerrero: { name:'Modo Berserker',       icon:'⚡', desc:'2× XP en todas las misiones durante 30 minutos.' },
  clerigo:  { name:'Resurrección',         icon:'✝️', desc:'Restaura una misión vencida: vuelve a fecha de hoy sin penalización.' },
  picaro:   { name:'Golpe en las Sombras', icon:'🗡️', desc:'Completa automáticamente tu daily más antigua pendiente.' },
  arquero:  { name:'Lluvia de Flechas',    icon:'🏹', desc:'La próxima misión semanal da 3× XP.' },
  fundador: { name:'Visión Estratégica',   icon:'🚀', desc:'+25% XP en las próximas 5 misiones completadas.' },
};

const FAMILIARS = {
  mago:     { emoji:'🦉', name:'Búho Arcano'     },
  guerrero: { emoji:'🐺', name:'Lobo de Batalla' },
  clerigo:  { emoji:'🦊', name:'Zorro Sagrado'   },
  picaro:   { emoji:'🐱', name:'Gato Sombra'     },
  arquero:  { emoji:'🦅', name:'Águila Veloz'    },
  fundador: { emoji:'🐉', name:'Dragón Joven'    },
};

const GOLD_TABLE = { main:50, side:20, daily:10, weekly:35 };

const CDN = 'https://stdedxhxxoyostymldqn.supabase.co/storage/v1/object/public/assets/';

/* ── SHOP ────────────────────────────────────────────────── */
const SHOP_ITEMS = [
  /* Consumibles */
  { id:'potion',  name:'Poción de Concentración', icon:'⚗️', cost:80,  desc:'2× XP durante 30 minutos',                     category:'consumible' },
  { id:'scroll',  name:'Pergamino de Prórroga',   icon:'📜', cost:60,  desc:'Extiende el deadline de la misión más urgente', category:'consumible' },
  { id:'amulet',  name:'Amuleto de Protección',   icon:'🧿', cost:120, desc:'Bloquea la próxima pérdida de HP (1 uso)',      category:'consumible' },
  { id:'xpstone', name:'Piedra de Sabiduría',     icon:'💠', cost:200, desc:'+150 XP instantáneos',                          category:'consumible' },
  { id:'revival', name:'Poción de Resurrección',  icon:'💊', cost:150, desc:'HP restaurada al máximo al instante',           category:'consumible' },
  /* Huevos de mascotas */
  { id:'egg_zorro-naturaleza',  name:'Huevo Zorro',   img:'pet_egg_zorro-naturaleza.png',  cost:200, desc:'Eclosiona con pociones de Zorro',    category:'egg' },
  { id:'egg_pantera-sombra',    name:'Huevo Pantera',  img:'pet_egg_pantera-sombra.png',    cost:300, desc:'Eclosiona con pociones de Pantera',  category:'egg' },
  { id:'egg_lobo-tormenta',     name:'Huevo Lobo',     img:'pet_egg_lobo-tormenta.png',     cost:400, desc:'Eclosiona con pociones de Lobo',     category:'egg' },
  { id:'egg_grifo',             name:'Huevo Grifo',    img:'pet_egg_grifo.png',             cost:500, desc:'Eclosiona con pociones de Grifo',    category:'egg' },
  { id:'egg_dragon-fuego',      name:'Huevo Dragón',   img:'pet_egg_dragon-fuego.png',      cost:600, desc:'Eclosiona con pociones de Dragón',   category:'egg' },
  { id:'egg_fenix-mitico',      name:'Huevo Fénix',    img:'pet_egg_fenix-mitico.png',      cost:800, desc:'Eclosiona con pociones de Fénix',    category:'egg' },
  /* Fragmentos de hechizo (×5 por compra) */
  { id:'frag_frenzy',        name:'Fragmento de Frenesí',       img:'spell_frenzy.png',        cost:30,  qty:5, desc:'×5 frags · necesitas 30 para lanzar Frenesí',      category:'fragment' },
  { id:'frag_speed',         name:'Pluma de Velocidad',         img:'spell_speed.png',         cost:20,  qty:5, desc:'×5 frags · necesitas 20 para lanzar Velocidad',     category:'fragment' },
  { id:'frag_berserker',     name:'Colmillo de Berserker',      img:'spell_berserker.png',     cost:25,  qty:5, desc:'×5 frags · necesitas 25 para lanzar Berserker',     category:'fragment' },
  { id:'frag_shield',        name:'Fragmento de Escudo',        img:'spell_shield.png',        cost:15,  qty:5, desc:'×5 frags · necesitas 15 para lanzar Escudo Arcano', category:'fragment' },
  { id:'frag_modo-berserker',name:'Esencia Berserker',          img:'spell_modo-berserker.png',cost:20,  qty:5, desc:'×5 frags · necesitas 20 para Modo Berserker',       category:'fragment' },
  { id:'frag_healing',       name:'Hierba de Curación',         img:'spell_healing.png',       cost:10,  qty:5, desc:'×5 frags · necesitas 10 para Curación Mayor',       category:'fragment' },
  { id:'frag_mente-acero',   name:'Cristal de Mente de Acero', img:'spell_mente-acero.png',   cost:25,  qty:5, desc:'×5 frags · necesitas 25 para Mente de Acero',       category:'fragment' },
  /* Pociones de mascota (×1 por compra) */
  { id:'pot_zorro-naturaleza', name:'Poción Zorro',   img:'pet_potion_zorro-naturaleza.png', cost:40,  desc:'Alimenta a tu Zorro Gigante',    category:'potion' },
  { id:'pot_pantera-sombra',   name:'Poción Pantera', img:'pet_potion_pantera-sombra.png',   cost:55,  desc:'Alimenta a tu Pantera Sombra',   category:'potion' },
  { id:'pot_lobo-tormenta',    name:'Poción Lobo',    img:'pet_potion_lobo-tormenta.png',    cost:70,  desc:'Alimenta a tu Lobo Tormenta',    category:'potion' },
  { id:'pot_grifo',            name:'Poción Grifo',   img:'pet_potion_grifo.png',            cost:90,  desc:'Alimenta a tu Grifo',            category:'potion' },
  { id:'pot_dragon-fuego',     name:'Poción Dragón',  img:'pet_potion_dragon-fuego.png',     cost:110, desc:'Alimenta a tu Dragón de Fuego',  category:'potion' },
  { id:'pot_fenix-mitico',     name:'Poción Fénix',   img:'pet_potion_fenix-mitico.png',     cost:140, desc:'Alimenta a tu Fénix Mítico',     category:'potion' },
];

/* ── MASCOTAS ────────────────────────────────────────────── */
const PET_DEFS = [
  { key:'zorro-naturaleza',  name:'Zorro Gigante',    icon:'🦊', rarity:'común',      eggCost:200, hatch:10, evolve:25 },
  { key:'pantera-sombra',    name:'Pantera Sombra',   icon:'🐆', rarity:'poco común', eggCost:300, hatch:10, evolve:25 },
  { key:'lobo-tormenta',     name:'Lobo Tormenta',    icon:'🐺', rarity:'raro',       eggCost:400, hatch:15, evolve:30 },
  { key:'grifo',             name:'Grifo',            icon:'🦅', rarity:'épico',      eggCost:500, hatch:15, evolve:35 },
  { key:'dragon-fuego',      name:'Dragón de Fuego',  icon:'🐉', rarity:'legendario', eggCost:600, hatch:20, evolve:40 },
  { key:'fenix-mitico',      name:'Fénix Mítico',     icon:'🔥', rarity:'mítico',     eggCost:800, hatch:20, evolve:50 },
];

/* ── JEFES ───────────────────────────────────────────────── */
const BOSS_DEFS = [
  { key:'caballero-esqueleto', name:'Caballero Esqueleto',    rarity:'normal',     hp:100, seasonal:null },
  { key:'demonio-sombras',     name:'Demonio de Sombras',     rarity:'legendario', hp:200, seasonal:null },
  { key:'liche-ancestral',     name:'Liche Ancestral',        rarity:'mitico',     hp:350, seasonal:null },
  { key:'halloween',           name:'Señor de las Sombras',   rarity:'mitico',     hp:500, seasonal:{ month:9,  dayStart:24, dayEnd:31 } },
  { key:'navidad',             name:'Krampus Arcano',         rarity:'mitico',     hp:500, seasonal:{ month:11, dayStart:20, dayEnd:26 } },
  { key:'anio-nuevo',          name:'Dragón del Tiempo',      rarity:'mitico',     hp:500, seasonal:{ month:11, dayStart:28, dayEnd:31 } },
];

/* ── DROPS AL COMPLETAR MISIÓN ──────────────────────────── */
// chance: probabilidad de que caiga algo. min/max: cantidad de ítems.
const DROP_TABLE = {
  comun:      { chance:0.30, min:1, max:2  },
  normal:     { chance:0.40, min:2, max:3  },
  epico:      { chance:0.60, min:3, max:5  },
  legendario: { chance:0.80, min:5, max:8  },
  mitico:     { chance:1.00, min:8, max:15 },
};
// 60% fragmento de hechizo aleatorio · 40% poción de mascota aleatoria
const SPELL_FRAGMENT_KEYS = ['frenzy','speed','berserker','shield','modo-berserker','healing','mente-acero'];
const PET_POTION_KEYS     = ['zorro-naturaleza','pantera-sombra','lobo-tormenta','grifo','dragon-fuego','fenix-mitico'];

/* ── HECHIZOS — coste en fragmentos ────────────────────────
   (reemplaza el sistema de cooldown por tiempo)             */
const SPELL_FRAG_COST = {
  frenzy:         30,
  speed:          20,
  berserker:      25,
  shield:         15,
  'modo-berserker': 20,
  healing:        10,
  'mente-acero':  25,
};

/* ── HABILIDADES DE MASCOTA ──────────────────────────────── */
const PET_ABILITIES = {
  'zorro-naturaleza': {
    baby:  { icon:'🌿', desc:'+5 XP por misión diaria',               type:'daily_xp',       val:5    },
    mount: { icon:'🌿', desc:'+10 XP por diaria · drop rate +10%',    type:'daily_xp',       val:10   },
  },
  'pantera-sombra': {
    baby:  { icon:'🌑', desc:'20% chance de 2× XP en secundarias',    type:'side_crit',      val:0.20 },
    mount: { icon:'🌑', desc:'35% chance de 2× XP en secundarias',    type:'side_crit',      val:0.35 },
  },
  'lobo-tormenta': {
    baby:  { icon:'⚡', desc:'+25% daño al jefe semanal',              type:'boss_dmg',       val:1.25 },
    mount: { icon:'⚡', desc:'+50% daño al jefe semanal',              type:'boss_dmg',       val:1.50 },
  },
  'grifo': {
    baby:  { icon:'🍅', desc:'+15 XP por pomodoro completado',         type:'pom_xp',         val:15   },
    mount: { icon:'🍅', desc:'+30 XP por pomodoro completado',         type:'pom_xp',         val:30   },
  },
  'dragon-fuego': {
    baby:  { icon:'🔥', desc:'+20% XP en misiones épicas y superiores',type:'epic_xp',        val:0.20 },
    mount: { icon:'🔥', desc:'+35% XP en TODAS las misiones',          type:'all_xp',         val:0.35 },
  },
  'fenix-mitico': {
    baby:  { icon:'✨', desc:'+5 HP al completar misión principal',     type:'main_hp',        val:5    },
    mount: { icon:'✨', desc:'+10 HP principal · HP inmune a vencidas', type:'main_hp_shield', val:10   },
  },
};

const BOSS_NAMES = [
  'Dragón de la Procrastinación','Hidra del Caos','Liche del Tiempo Perdido',
  'Gólem de las Deudas','Gorgona del Desenfoque','Fénix Oscuro del Agotamiento',
  'Vampiro de la Energía','Troll de las Distracciones','Demonio de la Pereza',
  'Espectro del Miedo al Fracaso',
];

const PROPHECY_TEMPLATES = [
  (n, s) => `El Oráculo ve esta semana ${n} grandes batallas que definirán al campeón. Solo el héroe con racha de ${s} días o más recibirá la gloria eterna del gremio.`,
  (n, s) => `Las estrellas revelan: ${n} épicas misiones aguardan al guerrero esta semana. Quien mantenga una racha de ${s} días conquistará poderes ocultos.`,
  (n, s) => `La profecía habla: quien derrote al Jefe Semanal y complete ${n} misiones antes del domingo, recibirá el favor de los dioses por ${s} días más.`,
];

const ACHIEVEMENT_DEFS = [
  { id: 'first_quest', icon: '🗡️', name: 'Primera Sangre', desc: 'Completa tu primera misión', cond: h => h._completed >= 1 },
  { id: 'ten_quests', icon: '⚔️', name: 'Veterano', desc: 'Completa 10 misiones', cond: h => h._completed >= 10 },
  { id: 'fifty_quests', icon: '🏆', name: 'Leyenda', desc: 'Completa 50 misiones', cond: h => h._completed >= 50 },
  { id: 'first_level', icon: '⬆️', name: 'En Ascenso', desc: 'Alcanza nivel 2', cond: h => h._level >= 2 },
  { id: 'level_five', icon: '🌟', name: 'Élite', desc: 'Alcanza nivel 5', cond: h => h._level >= 5 },
  { id: 'level_ten', icon: '👑', name: 'Señor del Caos', desc: 'Alcanza nivel 10', cond: h => h._level >= 10 },
  { id: 'first_pom', icon: '🍅', name: 'Primer Pomodoro', desc: 'Completa tu primer pomodoro', cond: h => h._pomodoros >= 1 },
  { id: 'ten_poms', icon: '🍅🍅', name: 'Maestro del Tiempo', desc: 'Completa 10 pomodoros', cond: h => h._pomodoros >= 10 },
  { id: 'streak_3', icon: '🔥', name: 'En Llamas', desc: 'Racha de 3 días', cond: h => (h.longest_streak || 0) >= 3 },
  { id: 'streak_7', icon: '🔥🔥', name: 'Semana Épica', desc: 'Racha de 7 días', cond: h => (h.longest_streak || 0) >= 7 },
  { id: 'streak_30', icon: '💎', name: 'Indestructible', desc: 'Racha de 30 días', cond: h => (h.longest_streak || 0) >= 30 },
  { id: 'first_main', icon: '⭐', name: 'Misión Mayor', desc: 'Completa una misión principal', cond: h => (h._main_done || 0) >= 1 },
  { id: 'five_main', icon: '⭐⭐', name: 'Héroe Principal', desc: 'Completa 5 misiones principales', cond: h => (h._main_done || 0) >= 5 },
  { id: 'spell_cast', icon: '✨', name: 'Arcano', desc: 'Lanza tu primer hechizo', cond: h => (h._spells_cast || 0) >= 1 },
  { id: 'thousand_xp', icon: '💰', name: 'Rico en Poder', desc: 'Acumula 1000 XP total', cond: h => (h.xp_total || 0) >= 1000 },
  { id: 'full_hp', icon: '❤️', name: 'Inquebrantable', desc: 'Mantén HP al máximo', cond: h => (h.hp || 0) >= (h.hp_max || 100) },
];
