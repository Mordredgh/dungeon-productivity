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

const SHOP_ITEMS = [
  { id:'potion',  name:'Poción de Concentración', icon:'⚗️', cost:80,  desc:'2× XP durante 30 minutos' },
  { id:'scroll',  name:'Pergamino de Prórroga',   icon:'📜', cost:60,  desc:'Extiende el deadline de la misión más urgente 1 día' },
  { id:'amulet',  name:'Amuleto de Protección',   icon:'🧿', cost:120, desc:'Bloquea la próxima pérdida de HP (1 uso)' },
  { id:'xpstone', name:'Piedra de Sabiduría',     icon:'💠', cost:200, desc:'+150 XP instantáneos' },
  { id:'revival', name:'Poción de Resurrección',  icon:'💊', cost:150, desc:'HP restaurada al máximo al instante' },
];

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
