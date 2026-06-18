'use strict';

// Capture OAuth callback params before Supabase auto-detects and clears ?code= from the URL
const _oauthParams = new URLSearchParams(window.location.search);

const SUPA_URL = 'https://stdedxhxxoyostymldqn.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZGVkeGh4eG95b3N0eW1sZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTQ2NTMsImV4cCI6MjA4ODQ5MDY1M30.OUhqeeqjlQa6ufECPzOJqZ-gQB93pg8nu0g1j4lEXyI';

const SPOTIFY_CLIENT_ID    = '27360e70ab9d41f18aeeaab7a640eb9b';
const SPOTIFY_REDIRECT_URI = 'https://dungeon.mordredgh.com/';
const SPOTIFY_PLAYLIST_URI = 'spotify:playlist:6zCID88oNjNv9zx6puDHKj';
const SPOTIFY_SCOPES       = 'user-read-playback-state user-modify-playback-state user-read-currently-playing';

const WEATHER_ICONS = {
  0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',
  51:'🌦️',53:'🌦️',55:'🌦️',56:'🌧️',57:'🌧️',
  61:'🌧️',63:'🌧️',65:'🌧️',66:'🌧️',67:'🌧️',
  71:'🌨️',73:'🌨️',75:'❄️',77:'❄️',
  80:'🌦️',81:'🌧️',82:'⛈️',85:'🌨️',86:'❄️',
  95:'⛈️',96:'⛈️',99:'⛈️'
};
const WEATHER_DESC = {
  0:'Cielo despejado',1:'Mayormente despejado',2:'Parcialmente nublado',3:'Nublado',
  45:'Niebla',48:'Niebla helada',
  51:'Llovizna ligera',53:'Llovizna moderada',55:'Llovizna intensa',
  56:'Llovizna helada',57:'Llovizna helada intensa',
  61:'Lluvia ligera',63:'Lluvia moderada',65:'Lluvia intensa',
  66:'Lluvia helada',67:'Lluvia helada intensa',
  71:'Nevada ligera',73:'Nevada moderada',75:'Nevada intensa',77:'Granizo fino',
  80:'Chubascos ligeros',81:'Chubascos moderados',82:'Chubascos violentos',
  85:'Chubascos de nieve ligeros',86:'Chubascos de nieve intensos',
  95:'Tormenta eléctrica',96:'Tormenta con granizo ligero',99:'Tormenta con granizo intenso'
};

const TITLES = [
  'Aprendiz del Gremio','Escudero Inquieto','Explorador del Caos',
  'Guerrero del Enfoque','Cazador de Metas','Mago del Tiempo',
  'Comandante del Gremio','Campeón Legendario','Guardián del Caos',
  'Señor del Caos Productivo',
  'Caballero del Foco','Maestro de Misiones','Archimago del Tiempo',
  'Legado del Dungeon','Heraldo de la Productividad',
  'Conquistador de Hábitos','Gran Maestro del Gremio',
  'Señor de las Runas','Guardián del Umbral','Vanguardia Eterna',
  'Leyenda del Dungeon','Arquitecto del Orden','Fénix del Enfoque',
  'Portador del Caos Sagrado','Centinela Inmortal',
  'Titán de la Voluntad','Oráculo del Dungeon',
  'Caminante entre Mundos','Desterrador del Caos',
  'Maestro del Tiempo Arcano',
  'Señor de los Antiguos','Elegido del Destino',
  'Destructor de Límites','Héroe de los Mil Mundos',
  'Invocador del Poder Último','Archi-Maestro del Dungeon',
  'Portador de la Llama Eterna','Juez del Destino',
  'Custodio del Cosmos','Último Guardián',
  'Leyenda Viviente','Señor del Caos Absoluto',
  'Forjador de Reinos','Maestro Arcano Supremo',
  'El que Trasciende','Señor de la Eternidad',
  'Dios del Tiempo','El Invencible',
  'Leyenda de las Leyendas','Señor del Dungeon Eterno',
];

const XP_TABLE = { main: 100, side: 50, daily: 25, weekly: 75, habit: 20 };
const POM_XP = 15;
const LEVEL_BASE = 100;
const LEVEL_SCALE = 1.5;
const THEMES = ['dark', 'light', 'cyber', 'oled', 'parchment'];
const THEME_NAMES = { dark: 'Oscuro', light: 'Claro', cyber: 'Cyber', oled: 'OLED', parchment: 'Pergamino' };

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

const GOLD_TABLE = { main:50, side:20, daily:10, weekly:35, habit:8 };

const CDN = 'https://stdedxhxxoyostymldqn.supabase.co/storage/v1/object/public/assets/';

/* ── GOOGLE OAUTH2 (mismo client ID para Fit + Calendar) ──── */
const GOOGLE_CLIENT_ID    = '631929698326-s30ji937vmgri0spmpup3t21tfje35ci.apps.googleusercontent.com';
const GOOGLE_REDIRECT_URI = 'https://dungeon.mordredgh.com/';
// GOOGLE_CLIENT_SECRET removido del frontend — ahora vive en la Edge Function google-oauth

/* ── ARMAS ───────────────────────────────────────────────── */
const WEAPON_DEFS = [
  { key:'espada', name:'Espada',  icon:'⚔️', slot:'main_hand' },
  { key:'hacha',  name:'Hacha',   icon:'🪓', slot:'main_hand' },
  { key:'baculo', name:'Báculo',  icon:'🪄', slot:'main_hand' },
  { key:'arco',   name:'Arco',    icon:'🏹', slot:'main_hand' },
  { key:'daga',   name:'Daga',    icon:'🗡️', slot:'off_hand'  },
  { key:'escudo', name:'Escudo',  icon:'🛡️', slot:'off_hand'  },
];
const WEAPON_TIERS = {
  comun:      { label:'Común',      color:'#9ca3af', xpBonus:0,    goldBonus:0,    hpMax:0  },
  raro:       { label:'Raro',       color:'#60a5fa', xpBonus:0.05, goldBonus:0.05, hpMax:5  },
  epico:      { label:'Épico',      color:'#a855f7', xpBonus:0.10, goldBonus:0.10, hpMax:10 },
  legendario: { label:'Legendario', color:'#f59e0b', xpBonus:0.20, goldBonus:0.15, hpMax:20 },
  mitico:     { label:'Mítico',     color:'#ef4444', xpBonus:0.35, goldBonus:0.25, hpMax:35 },
};
const CRAFT_RECIPES = {
  raro:       { from:'comun',      count:5 },
  epico:      { from:'raro',       count:3 },
  legendario: { from:'epico',      count:3 },
  mitico:     { from:'legendario', count:3 },
};
const FORGE_COOLDOWN_MS = {
  legendario: 24 * 3600 * 1000,
  mitico:     3 * 24 * 3600 * 1000,
};

/* ── SHOP ────────────────────────────────────────────────── */
const SHOP_ITEMS = [
  /* Consumibles */
  { id:'potion',  name:'Poción de Concentración', icon:'⚗️', cost:80,  desc:'2× XP durante 30 minutos',                     category:'consumible' },
  { id:'scroll',  name:'Pergamino de Prórroga',   icon:'📜', cost:60,  desc:'Extiende el deadline de la misión más urgente', category:'consumible' },
  { id:'amulet',  name:'Amuleto de Protección',   icon:'🧿', cost:120, desc:'Bloquea la próxima pérdida de HP (1 uso)',      category:'consumible' },
  { id:'xpstone', name:'Piedra de Sabiduría',     icon:'💠', cost:200, desc:'+150 XP instantáneos',                          category:'consumible' },
  { id:'revival', name:'Poción de Resurrección',  icon:'💊', cost:150, desc:'HP restaurada al máximo al instante',           category:'consumible' },
  { id:'hp_minor',     name:'Poción Menor de HP',       icon:'🧪', cost:35,  desc:'+25 HP al instante',                           category:'consumible' },
  { id:'gold_rush',    name:'Monedas del Mercader',     icon:'💰', cost:80,  desc:'2× Oro en todas las misiones durante 1 hora',   category:'consumible' },
  { id:'boss_shield',  name:'Escudo Anti-Boss',         icon:'🛡️', cost:150, desc:'Bloquea la penalización del Jefe esta semana', category:'consumible' },
  { id:'xp_scroll_sm', name:'Pergamino de Poder',       icon:'📜', cost:70,  desc:'+75 XP instantáneos',                          category:'consumible' },
  /* Huevos de mascotas */
  { id:'egg_zorro-naturaleza',  name:'Huevo Zorro',   img:'pet_egg_zorro-naturaleza.png',  cost:200, desc:'Eclosiona con pociones de Zorro',    category:'egg' },
  { id:'egg_pantera-sombra',    name:'Huevo Pantera',  img:'pet_egg_pantera-sombra.png',    cost:300, desc:'Eclosiona con pociones de Pantera',  category:'egg' },
  { id:'egg_lobo-tormenta',     name:'Huevo Lobo',     img:'pet_egg_lobo-tormenta.png',     cost:400, desc:'Eclosiona con pociones de Lobo',     category:'egg' },
  { id:'egg_grifo',             name:'Huevo Grifo',    img:'pet_egg_grifo.png',             cost:500, desc:'Eclosiona con pociones de Grifo',    category:'egg' },
  { id:'egg_dragon-fuego',      name:'Huevo Dragón',   img:'pet_egg_dragon-fuego.png',      cost:600, desc:'Eclosiona con pociones de Dragón',   category:'egg' },
  { id:'egg_fenix-mitico',      name:'Huevo Fénix',    img:'pet_egg_fenix-mitico.png',      cost:800,  desc:'Eclosiona con pociones de Fénix',    category:'egg' },
  { id:'egg_rey-tempestad',     name:'Huevo del Rey',  img:'pet_rey-tempestad_egg.png',     cost:0,    desc:'Se desbloquea al llevar las 6 mascotas al nivel máximo.', category:'egg', unlock:'all_pets_max' },
  /* Fragmentos de hechizo (×5 por compra) */
  { id:'frag_frenzy',        name:'Fragmento de Frenesí',       img:'spell_frenzy.png',        cost:30,  qty:5, desc:'×5 frags · necesitas 30 para lanzar Frenesí',      category:'fragment' },
  { id:'frag_speed',         name:'Pluma de Velocidad',         img:'spell_speed.png',         cost:20,  qty:5, desc:'×5 frags · necesitas 20 para lanzar Velocidad',     category:'fragment' },
  { id:'frag_berserker',     name:'Colmillo de Berserker',      img:'spell_berserker.png',     cost:25,  qty:5, desc:'×5 frags · necesitas 25 para lanzar Berserker',     category:'fragment' },
  { id:'frag_shield',        name:'Fragmento de Escudo',        img:'spell_shield.png',        cost:15,  qty:5, desc:'×5 frags · necesitas 15 para lanzar Escudo Arcano', category:'fragment' },
  { id:'frag_modo-berserker',name:'Esencia Berserker',          img:'spell_modo-berserker.png',cost:20,  qty:5, desc:'×5 frags · necesitas 20 para Modo Berserker',       category:'fragment' },
  { id:'frag_healing',       name:'Hierba de Curación',         img:'spell_healing.png',       cost:10,  qty:5, desc:'×5 frags · necesitas 10 para Curación Mayor',       category:'fragment' },
  { id:'frag_mente-acero',   name:'Cristal de Mente de Acero', img:'spell_mente-acero.png',   cost:25,  qty:5, desc:'×5 frags · necesitas 25 para Mente de Acero',       category:'fragment' },
  /* Armas (comunes) */
  { id:'weapon_espada', name:'Espada Común',  icon:'⚔️', cost:50,  desc:'Arma · mano principal · forjable a Rara (×5)',   category:'armas', weaponKey:'espada', tier:'comun' },
  { id:'weapon_hacha',  name:'Hacha Común',   icon:'🪓', cost:50,  desc:'Arma · mano principal · forjable a Rara (×5)',   category:'armas', weaponKey:'hacha',  tier:'comun' },
  { id:'weapon_baculo', name:'Báculo Común',  icon:'🪄', cost:50,  desc:'Arma · mano principal · forjable a Rara (×5)',   category:'armas', weaponKey:'baculo', tier:'comun' },
  { id:'weapon_arco',   name:'Arco Común',    icon:'🏹', cost:50,  desc:'Arma · mano principal · forjable a Rara (×5)',   category:'armas', weaponKey:'arco',   tier:'comun' },
  { id:'weapon_daga',   name:'Daga Común',    icon:'🗡️', cost:40,  desc:'Arma · mano secundaria · forjable a Rara (×5)', category:'armas', weaponKey:'daga',   tier:'comun' },
  { id:'weapon_escudo', name:'Escudo Común',  icon:'🛡️', cost:40,  desc:'Arma · mano secundaria · forjable a Rara (×5)', category:'armas', weaponKey:'escudo', tier:'comun' },
  /* Pociones de mascota (×1 por compra) */
  { id:'pot_zorro-naturaleza', name:'Poción Zorro',   img:'pet_pocion_zorro-naturaleza.png', cost:40,  desc:'Alimenta a tu Zorro Gigante',    category:'potion' },
  { id:'pot_pantera-sombra',   name:'Poción Pantera', img:'pet_pocion_pantera-sombra.png',   cost:55,  desc:'Alimenta a tu Pantera Sombra',   category:'potion' },
  { id:'pot_lobo-tormenta',    name:'Poción Lobo',    img:'pet_pocion_lobo-tormenta.png',    cost:70,  desc:'Alimenta a tu Lobo Tormenta',    category:'potion' },
  { id:'pot_grifo',            name:'Poción Grifo',   img:'pet_pocion_grifo.png',            cost:90,  desc:'Alimenta a tu Grifo',            category:'potion' },
  { id:'pot_dragon-fuego',     name:'Poción Dragón',  img:'pet_pocion_dragon-fuego.png',     cost:110, desc:'Alimenta a tu Dragón de Fuego',  category:'potion' },
  { id:'pot_fenix-mitico',     name:'Poción Fénix',   img:'pet_pocion_fenix-mitico.png',     cost:140, desc:'Alimenta a tu Fénix Mítico',     category:'potion' },
  { id:'pot_rey-tempestad',    name:'Poción del Rey', img:'pet_pocion_rey-tempestad.png',    cost:250, desc:'Alimenta al Rey de la Tempestad (desbloquea al max todas)', category:'potion' },
  /* Alimento especial — sube nivel de montura (1→50) */
  { id:'food_zorro-naturaleza', name:'Baya Silvestre',    img:'pet_alimento_zorro-naturaleza.png', cost:50,  desc:'+50 XP al Zorro Gigante (requiere montura)',    category:'alimento' },
  { id:'food_pantera-sombra',   name:'Carne Nocturna',    img:'pet_alimento_pantera-sombra.png',   cost:65,  desc:'+60 XP a la Pantera Sombra (requiere montura)', category:'alimento' },
  { id:'food_lobo-tormenta',    name:'Carne de Tormenta', img:'pet_alimento_lobo-tormenta.png',    cost:80,  desc:'+70 XP al Lobo Tormenta (requiere montura)',    category:'alimento' },
  { id:'food_grifo',            name:'Presa Aérea',       img:'pet_alimento_grifo.png',            cost:100, desc:'+85 XP al Grifo (requiere montura)',            category:'alimento' },
  { id:'food_dragon-fuego',     name:'Brasa Volcánica',   img:'pet_alimento_dragon-fuego.png',     cost:125, desc:'+100 XP al Dragón de Fuego (requiere montura)', category:'alimento' },
  { id:'food_fenix-mitico',     name:'Llama Eterna',      img:'pet_alimento_fenix-mitico.png',     cost:160, desc:'+120 XP al Fénix Mítico (requiere montura)',    category:'alimento' },
  { id:'food_rey-tempestad',    name:'Esencia de Furias', img:'pet_alimento_rey-tempestad.png',    cost:300, desc:'+200 XP al Rey de la Tempestad (requiere montura)', category:'alimento' },
];

/* ── MASCOTAS ────────────────────────────────────────────── */
const PET_DEFS = [
  // level_req: nivel del héroe para evolucionar bebé→montura
  // food_xp: XP que da cada alimento especial
  // base_stats: stats base de la montura en nivel 1  (atk=% XP, def=+HP máx, spd=% Oro, lck=% loot)
  // stat_gain:  incremento por nivel (atk/spd/lck en %, def en HP flat)
  { key:'zorro-naturaleza', name:'Zorro Gigante',   icon:'🦊', rarity:'común',      eggCost:200, hatch:10, evolve:25,
    level_req:15, food_xp:50,
    base_stats:{ atk:1,  def:2,  spd:1,  lck:1  },
    stat_gain: { atk:.10, def:.20, spd:.10, lck:.10 } },
  { key:'pantera-sombra',   name:'Pantera Sombra',  icon:'🐆', rarity:'poco común', eggCost:300, hatch:10, evolve:25,
    level_req:15, food_xp:60,
    base_stats:{ atk:1,  def:3,  spd:2,  lck:1  },
    stat_gain: { atk:.10, def:.25, spd:.15, lck:.10 } },
  { key:'lobo-tormenta',    name:'Lobo Tormenta',   icon:'🐺', rarity:'raro',       eggCost:400, hatch:15, evolve:30,
    level_req:15, food_xp:70,
    base_stats:{ atk:2,  def:5,  spd:2,  lck:2  },
    stat_gain: { atk:.15, def:.30, spd:.15, lck:.15 } },
  { key:'grifo',            name:'Grifo',           icon:'🦅', rarity:'épico',      eggCost:500, hatch:15, evolve:35,
    level_req:15, food_xp:85,
    base_stats:{ atk:3,  def:7,  spd:3,  lck:3  },
    stat_gain: { atk:.25, def:.40, spd:.20, lck:.20 } },
  { key:'dragon-fuego',     name:'Dragón de Fuego', icon:'🐉', rarity:'legendario', eggCost:600, hatch:20, evolve:40,
    level_req:15, food_xp:100,
    base_stats:{ atk:4,  def:10, spd:4,  lck:4  },
    stat_gain: { atk:.35, def:.50, spd:.30, lck:.30 } },
  { key:'fenix-mitico',     name:'Fénix Mítico',    icon:'🔥', rarity:'mítico',     eggCost:800, hatch:20, evolve:50,
    level_req:15, food_xp:120,
    base_stats:{ atk:6,  def:15, spd:5,  lck:6  },
    stat_gain: { atk:.50, def:.60, spd:.40, lck:.50 } },
  { key:'rey-tempestad',    name:'Rey de la Tempestad', icon:'👑', rarity:'cataclismo', eggCost:0, hatch:0, evolve:100,
    level_req:30, food_xp:200, unlock:'all_pets_max',
    base_stats:{ atk:12, def:30, spd:10, lck:12 },
    stat_gain: { atk:1.0, def:1.0, spd:.80, lck:1.0 } },
];

/* ── JEFES ───────────────────────────────────────────────── */
const BOSS_DEFS = [
  // ── COMÚN ──────────────────────────────────────────────────
  { key:'caballero-esqueleto', name:'Caballero Esqueleto',         rarity:'comun',      hp:80,  seasonal:null },
  { key:'golem-piedra',        name:'Gólem de Piedra',             rarity:'comun',      hp:80,  seasonal:null },
  { key:'ogro-cripta',         name:'Ogro de la Cripta',           rarity:'comun',      hp:100, seasonal:null },
  { key:'slime-corrosivo',     name:'Slime Corrosivo',             rarity:'comun',      hp:60,  seasonal:null },
  { key:'arana-gigante',       name:'Araña Gigante de Cueva',      rarity:'comun',      hp:70,  seasonal:null },
  // ── RARO ───────────────────────────────────────────────────
  { key:'caballero-espectral', name:'Caballero Espectral',         rarity:'raro',       hp:150, seasonal:null },
  { key:'quimera',             name:'Quimera de Tres Cabezas',     rarity:'raro',       hp:160, seasonal:null },
  { key:'wyvern-hielo',        name:'Wyvern de Hielo',             rarity:'raro',       hp:140, seasonal:null },
  // ── ÉPICO ──────────────────────────────────────────────────
  { key:'golem-cristal',       name:'Gólem de Cristal Arcano',     rarity:'epico',      hp:220, seasonal:null },
  { key:'dragon-obsidiana',    name:'Dragón de Obsidiana',         rarity:'epico',      hp:250, seasonal:null },
  { key:'hidra-pesadilla',     name:'Hidra de Pesadilla',          rarity:'epico',      hp:270, seasonal:null },
  { key:'behemot-vacio',       name:'Behemot del Vacío',           rarity:'epico',      hp:280, seasonal:null },
  { key:'custodio-tiempo',     name:'Custodio del Tiempo Roto',    rarity:'epico',      hp:260, seasonal:null },
  // ── LEGENDARIO ─────────────────────────────────────────────
  { key:'demonio-sombras',     name:'Demonio de Sombras',          rarity:'legendario', hp:350, seasonal:null },
  { key:'liche-rey',           name:'Liche Rey Coronado',          rarity:'legendario', hp:400, seasonal:null },
  { key:'serafin-caido',       name:'Serafín Caído',               rarity:'legendario', hp:380, seasonal:null },
  { key:'titan-magma',         name:'Titán de Magma Ancestral',    rarity:'legendario', hp:420, seasonal:null },
  { key:'devorador-constelaciones', name:'Devorador de Constelaciones', rarity:'legendario', hp:450, seasonal:null },
  // ── MÍTICO ─────────────────────────────────────────────────
  { key:'liche-ancestral',     name:'Liche Ancestral',             rarity:'mitico',     hp:500, seasonal:null },
  { key:'fenix-cenizas',       name:'Fénix de Cenizas Eternas',    rarity:'mitico',     hp:550, seasonal:null },
  { key:'kraken-abisal',       name:'Kraken Abisal',               rarity:'mitico',     hp:600, seasonal:null },
  { key:'dragon-tormentas',    name:'Dragón Anciano de las Tormentas', rarity:'mitico', hp:580, seasonal:null },
  // ── CATACLISMO ─────────────────────────────────────────────
  { key:'arquitecto-vacio',    name:'El Arquitecto del Vacío',     rarity:'cataclismo', hp:800, seasonal:null },
  { key:'la-que-susurra',      name:'La Que Susurra entre Eones',  rarity:'cataclismo', hp:900, seasonal:null },
  // ── ESTACIONALES ───────────────────────────────────────────
  { key:'halloween',           name:'Señor de las Sombras',        rarity:'mitico',     hp:500, seasonal:{ month:9,  dayStart:24, dayEnd:31 } },
  { key:'navidad',             name:'Krampus Arcano',              rarity:'mitico',     hp:500, seasonal:{ month:11, dayStart:20, dayEnd:26 } },
  { key:'anio-nuevo',          name:'Dragón del Tiempo',           rarity:'mitico',     hp:500, seasonal:{ month:11, dayStart:28, dayEnd:31 } },
];

/* ── EVENTOS ESTACIONALES ───────────────────────────────── */
// month: 0-11 (enero=0). dayStart/dayEnd inclusivos. xpBonus: fracción adicional (0.20 = +20%).
const SEASONAL_EVENTS = [
  // Festividades especiales — mayor prioridad
  { id:'halloween',   icon:'🎃', name:'Noche de Espectros',   desc:'Los muertos susurran poder arcano.',       xpBonus:0.25, color:'#f97316', month:9,  dayStart:25, dayEnd:31 },
  { id:'dia_muertos', icon:'💀', name:'Día de Muertos',        desc:'Los ancestros conceden su bendición.',     xpBonus:0.20, color:'#a855f7', month:10, dayStart:1,  dayEnd:2  },
  { id:'navidad',     icon:'🎄', name:'Festival de Krampus',   desc:'El frío arcano amplifica el esfuerzo.',   xpBonus:0.30, color:'#22d3ee', month:11, dayStart:20, dayEnd:26 },
  { id:'anio_nuevo',  icon:'🎆', name:'Alba del Año Nuevo',    desc:'El año comienza con poder renovado.',      xpBonus:0.25, color:'#facc15', month:11, dayStart:28, dayEnd:31 },
  { id:'reyes',       icon:'⭐', name:'Noche de Reyes',         desc:'Los reyes magos traen XP extra.',          xpBonus:0.20, color:'#f59e0b', month:0,  dayStart:5,  dayEnd:6  },
  // Estaciones (menor prioridad si no hay festividad)
  { id:'primavera',   icon:'🌸', name:'Despertar del Bosque',  desc:'La primavera impulsa el crecimiento.',     xpBonus:0.12, color:'#4ade80', month:null, dayStart:null, dayEnd:null,
    season: d => { const m=d.getMonth(),dy=d.getDate(); return (m===2&&dy>=20)||(m===3||m===4)||(m===5&&dy<=20); } },
  { id:'verano',      icon:'🌞', name:'Festival del Sol',      desc:'El calor veraniego forja guerreros.',      xpBonus:0.15, color:'#fbbf24', month:null, dayStart:null, dayEnd:null,
    season: d => { const m=d.getMonth(),dy=d.getDate(); return (m===5&&dy>=21)||(m===6||m===7)||(m===8&&dy<=22); } },
  { id:'otonio',      icon:'🍂', name:'Cosecha Oscura',         desc:'El otoño trae frutos del dungeon.',        xpBonus:0.10, color:'#fb923c', month:null, dayStart:null, dayEnd:null,
    season: d => { const m=d.getMonth(),dy=d.getDate(); return (m===8&&dy>=23)||(m===9||m===10)||(m===11&&dy<=20); } },
  { id:'invierno',    icon:'❄️', name:'Solsticio de Invierno', desc:'El frío forja voluntades de acero.',       xpBonus:0.20, color:'#93c5fd', month:null, dayStart:null, dayEnd:null,
    season: d => { const m=d.getMonth(),dy=d.getDate(); return (m===11&&dy>=21)||(m===0||m===1)||(m===2&&dy<=19); } },
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
    egg:   { icon:'🌱', desc:'Bendición silvestre: +20 XP ahora (1/día)',          type:'act_xp',      val:20  },
    baby:  { icon:'🌿', desc:'+5 XP por misión diaria (pasivo)',                   type:'daily_xp',    val:5   },
    mount: { icon:'🌿', desc:'+10 XP por diaria · Activo: +40 XP (1/día)',         type:'daily_xp',    val:10  },
  },
  'pantera-sombra': {
    egg:   { icon:'🌑', desc:'Instinto oscuro: próxima misión 2× XP (1/día)',      type:'act_double',  val:1   },
    baby:  { icon:'🌑', desc:'20% chance de 2× XP en secundarias (pasivo)',        type:'side_crit',   val:0.20},
    mount: { icon:'🌑', desc:'35% chance 2× · Activo: doble próxima misión (1/día)',type:'side_crit',  val:0.35},
  },
  'lobo-tormenta': {
    egg:   { icon:'⚡', desc:'Aullido: inflige 20 de daño al jefe ahora (1/día)',  type:'act_boss',    val:20  },
    baby:  { icon:'⚡', desc:'+25% daño al jefe semanal (pasivo)',                 type:'boss_dmg',    val:1.25},
    mount: { icon:'⚡', desc:'+50% daño · Activo: -50 HP al jefe ahora (1/día)',   type:'boss_dmg',    val:1.50},
  },
  'grifo': {
    egg:   { icon:'🦅', desc:'Vuelo ascendente: +25 XP ahora (1/día)',             type:'act_xp',      val:25  },
    baby:  { icon:'🍅', desc:'+15 XP por pomodoro completado (pasivo)',             type:'pom_xp',      val:15  },
    mount: { icon:'🍅', desc:'+30 XP pom · Activo: +50 XP ahora (1/día)',          type:'pom_xp',      val:30  },
  },
  'dragon-fuego': {
    egg:   { icon:'🔥', desc:'Aliento primigenio: +30 XP ahora (1/día)',           type:'act_xp',      val:30  },
    baby:  { icon:'🔥', desc:'+20% XP en misiones épicas y superiores (pasivo)',   type:'epic_xp',     val:0.20},
    mount: { icon:'🔥', desc:'+35% XP global · Activo: 2× XP 30 min (1/día)',      type:'all_xp',      val:0.35},
  },
  'fenix-mitico': {
    egg:   { icon:'✨', desc:'Ceniza sagrada: +15 HP ahora (1/día)',               type:'act_hp',      val:15  },
    baby:  { icon:'✨', desc:'+5 HP al completar misión principal (pasivo)',        type:'main_hp',     val:5   },
    mount: { icon:'✨', desc:'+10 HP principal · Activo: HP al máximo (1/día)',     type:'main_hp_shield',val:10},
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
  // ── Combate ──
  { id: 'first_quest',    icon: '🗡️',  name: 'Primera Sangre',    desc: 'Completa tu primera misión',      cond: h => h._completed >= 1 },
  { id: 'ten_quests',     icon: '⚔️',  name: 'Veterano',          desc: 'Completa 10 misiones',            cond: h => h._completed >= 10 },
  { id: 'fifty_quests',   icon: '🏆',  name: 'Leyenda',           desc: 'Completa 50 misiones',            cond: h => h._completed >= 50 },
  { id: 'quest_200',      icon: '⚔️🔥', name: 'Dios de la Guerra', desc: 'Completa 200 misiones',          cond: h => h._completed >= 200 },
  { id: 'quest_500',      icon: '💀',  name: 'Exterminador',      desc: 'Completa 500 misiones',           cond: h => h._completed >= 500 },
  // ── Progresión ──
  { id: 'first_level',    icon: '⬆️',  name: 'En Ascenso',        desc: 'Alcanza nivel 2',                 cond: h => h._level >= 2 },
  { id: 'level_five',     icon: '🌟',  name: 'Élite',             desc: 'Alcanza nivel 5',                 cond: h => h._level >= 5 },
  { id: 'level_ten',      icon: '👑',  name: 'Señor del Caos',    desc: 'Alcanza nivel 10',                cond: h => h._level >= 10 },
  { id: 'level_fifteen',  icon: '🔮',  name: 'Archimago',         desc: 'Alcanza nivel 15',                cond: h => h._level >= 15 },
  { id: 'level_twenty',   icon: '🌌',  name: 'Ascendido',         desc: 'Alcanza nivel 20',                cond: h => h._level >= 20 },
  { id: 'thousand_xp',    icon: '💰',  name: 'Rico en Poder',     desc: 'Acumula 1000 XP total',           cond: h => (h.xp_total || 0) >= 1000 },
  { id: 'xp_5k',          icon: '💎',  name: 'Tesoro Arcano',     desc: 'Acumula 5,000 XP total',          cond: h => (h.xp_total || 0) >= 5000 },
  { id: 'xp_25k',         icon: '🌠',  name: 'Maestro del Poder', desc: 'Acumula 25,000 XP total',         cond: h => (h.xp_total || 0) >= 25000 },
  // ── Pomodoro ──
  { id: 'first_pom',      icon: '🍅',     name: 'Primer Pomodoro',    desc: 'Completa tu primer pomodoro',   cond: h => h._pomodoros >= 1 },
  { id: 'ten_poms',       icon: '🍅🍅',   name: 'Maestro del Tiempo', desc: 'Completa 10 pomodoros',         cond: h => h._pomodoros >= 10 },
  { id: 'pom_25',         icon: '⏱️',    name: 'Incansable',         desc: 'Completa 25 pomodoros',         cond: h => (h.pomodoros_done || 0) >= 25 },
  { id: 'pom_50',         icon: '🕰️',    name: 'Cronista',           desc: 'Completa 50 pomodoros',         cond: h => (h.pomodoros_done || 0) >= 50 },
  { id: 'pom_100',        icon: '⌛',    name: 'Señor del Tiempo',   desc: 'Completa 100 pomodoros',        cond: h => (h.pomodoros_done || 0) >= 100 },
  { id: 'pom_250',        icon: '🌀',    name: 'Tiempo Infinito',    desc: 'Completa 250 pomodoros',        cond: h => (h.pomodoros_done || 0) >= 250 },
  // ── Rachas ──
  { id: 'streak_3',       icon: '🔥',    name: 'En Llamas',          desc: 'Racha de 3 días',               cond: h => (h.longest_streak || 0) >= 3 },
  { id: 'streak_7',       icon: '🔥🔥',  name: 'Semana Épica',       desc: 'Racha de 7 días',               cond: h => (h.longest_streak || 0) >= 7 },
  { id: 'streak_14',      icon: '🔥💫',  name: 'Fortuna Continua',   desc: 'Racha de 14 días',              cond: h => (h.longest_streak || 0) >= 14 },
  { id: 'streak_30',      icon: '💎',    name: 'Indestructible',     desc: 'Racha de 30 días',              cond: h => (h.longest_streak || 0) >= 30 },
  { id: 'streak_60',      icon: '🌙',    name: 'Monje del Dungeon',  desc: 'Racha de 60 días',              cond: h => (h.longest_streak || 0) >= 60 },
  { id: 'streak_100',     icon: '☀️',   name: 'Eterno',             desc: 'Racha de 100 días',             cond: h => (h.longest_streak || 0) >= 100 },
  // ── Épicas ──
  { id: 'first_main',     icon: '⭐',    name: 'Misión Mayor',       desc: 'Completa una misión principal',  cond: h => (h._main_done || 0) >= 1 },
  { id: 'five_main',      icon: '⭐⭐',  name: 'Héroe Principal',    desc: 'Completa 5 misiones principales', cond: h => (h._main_done || 0) >= 5 },
  { id: 'main_25',        icon: '🗺️',   name: 'Conquistador',       desc: 'Completa 25 misiones principales', cond: h => (h._main_done || 0) >= 25 },
  // ── Magia ──
  { id: 'spell_cast',     icon: '✨',   name: 'Arcano',             desc: 'Lanza tu primer hechizo',        cond: h => (h._spells_cast || 0) >= 1 },
  // ── Salud ──
  { id: 'full_hp',        icon: '❤️',   name: 'Inquebrantable',     desc: 'Mantén HP al máximo',            cond: h => (h.hp || 0) >= (h.hp_max || 100) },
  // ── Oro ──
  { id: 'gold_500',       icon: '🪙',   name: 'Mercader',           desc: 'Acumula 500 de oro',             cond: h => (h.gold || 0) >= 500 },
  { id: 'gold_2000',      icon: '💳',   name: 'Banquero del Gremio', desc: 'Acumula 2,000 de oro',          cond: h => (h.gold || 0) >= 2000 },
  { id: 'gold_10k',       icon: '🤑',   name: 'Plutócrata',         desc: 'Acumula 10,000 de oro',          cond: h => (h.gold || 0) >= 10000 },

  // ── Logros ocultos — la descripción y nombre son "???" hasta desbloquear ──
  { id: 'h_madrugador',  icon: '🌅', name: 'El Madrugador',       desc: 'Completa una misión antes de las 7am',   hidden: true,
    cond: () => (quests||[]).some(q => q.done && q.done_at && new Date(q.done_at).getHours() < 7) },
  { id: 'h_nocturno',    icon: '🦇', name: 'Criatura de la Noche', desc: 'Completa una misión después de las 11pm', hidden: true,
    cond: () => (quests||[]).some(q => q.done && q.done_at && new Date(q.done_at).getHours() >= 23) },
  { id: 'h_maldito',     icon: '💀', name: 'El Número Maldito',   desc: 'Llega exactamente al nivel 13',          hidden: true,
    cond: h => h._level >= 13 },
  { id: 'h_dia_gloria',  icon: '⚡', name: 'Día de Gloria',        desc: 'Completa 5 misiones en un solo día',    hidden: true,
    cond: () => { const c={}; (quests||[]).filter(q=>q.done&&q.done_at).forEach(q=>{const d=q.done_at.split('T')[0];c[d]=(c[d]||0)+1;}); return Object.values(c).some(v=>v>=5); } },
  { id: 'h_renacido',    icon: '⭐', name: 'El Renacido',          desc: 'Consigue tu primer Prestige',            hidden: true,
    cond: h => (h.prestige || 0) >= 1 },
  { id: 'h_domingo',     icon: '🌞', name: 'Guerrero del Domingo', desc: 'Completa 5 misiones en domingo',        hidden: true,
    cond: () => (quests||[]).filter(q=>q.done&&q.done_at&&new Date(q.done_at).getDay()===0).length >= 5 },
  { id: 'h_equilibrio',  icon: '⚖️', name: 'Equilibrio Total',    desc: 'Completa los 4 tipos de misión en un mismo día', hidden: true,
    cond: () => { const m={}; (quests||[]).filter(q=>q.done&&q.done_at).forEach(q=>{const d=q.done_at.split('T')[0];if(!m[d])m[d]=new Set();m[d].add(q.type);}); return Object.values(m).some(s=>s.has('main')&&s.has('side')&&s.has('daily')&&s.has('weekly')); } },
  { id: 'h_atributos',   icon: '💪', name: 'El Completo',          desc: 'Alcanza 20 puntos de atributos en total', hidden: true,
    cond: h => (h.str||0)+(h.intel||0)+(h.dex||0)+(h.con||0)+(h.wis||0)+(h.cha||0) >= 20 },
  { id: 'h_racha21',     icon: '🔥', name: 'Tres Semanas',         desc: 'Mantén una racha de 21 días',            hidden: true,
    cond: h => (h.longest_streak||0) >= 21 },
  { id: 'h_xp10k',       icon: '🌠', name: 'Diez Mil',             desc: 'Acumula 10,000 XP total',                hidden: true,
    cond: h => (h.xp_total||0) >= 10000 },
  { id: 'h_ultimo_seg',  icon: '⏰', name: 'El Último Segundo',    desc: 'Completa una misión entre las 23:50 y la medianoche', hidden: true,
    cond: () => (quests||[]).some(q=>q.done&&q.done_at&&new Date(q.done_at).getHours()===23&&new Date(q.done_at).getMinutes()>=50) },
  { id: 'h_triple_main', icon: '🗡️', name: 'Triple Amenaza',      desc: 'Completa 3 misiones principales en un día', hidden: true,
    cond: () => { const c={}; (quests||[]).filter(q=>q.done&&q.done_at&&q.type==='main').forEach(q=>{const d=q.done_at.split('T')[0];c[d]=(c[d]||0)+1;}); return Object.values(c).some(v=>v>=3); } },
  { id: 'h_zona_legend', icon: '🏅', name: 'Guardián de Zona',     desc: 'Alcanza rango Campeón en cualquier Zona del Dungeon', hidden: true,
    cond: () => { try { if(typeof calcZoneXP!=='function'||typeof ZONES==='undefined')return false; const x=calcZoneXP(); return ZONES.some(z=>(x[z.id]||0)>=z.thresholds[2]); } catch{return false;} } },
  { id: 'h_pom_dia',     icon: '🍅', name: 'Maratón Rojo',         desc: 'Completa 4 pomodoros en un solo día',    hidden: true,
    cond: () => { const c={}; (pomodoros||[]).filter(p=>p.started_at).forEach(p=>{const d=p.started_at.split('T')[0];c[d]=(c[d]||0)+1;}); return Object.values(c).some(v=>v>=4); } },
  { id: 'h_habito10',    icon: '🌿', name: 'Forjado en Hierro',    desc: 'Completa el mismo hábito positivo 10 veces', hidden: true,
    cond: h => { try { const hist=JSON.parse(h.habit_history||'{}'); return Object.values(hist).some(arr=>Array.isArray(arr)&&arr.length>=10); } catch{return false;} } },
];
