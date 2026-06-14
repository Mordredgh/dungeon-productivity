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

const QUEST_TEMPLATES = [
  { name: '🏋️ Rutina fitness', quests: ['Ejercicio 30 min','Hidratación 2L agua','Meditar 10 min','Dormir 7h+'] },
  { name: '💼 Sprint trabajo', quests: ['Revisar email','Reunión equipo','Deep work 2h','Revisar métricas'] },
  { name: '📚 Día de aprendizaje', quests: ['Leer 30 min','Ver tutorial','Tomar notas','Repasar conceptos'] },
  { name: '🧹 Limpieza digital', quests: ['Limpiar escritorio','Organizar archivos','Vaciar bandeja entrada','Actualizar contraseñas'] },
  { name: '🚀 Lanzamiento', quests: ['Revisar checklist','Testing QA','Deploy producción','Anunciar en redes'] },
];

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
  { title: '⚡ ¡Tormenta Mágica!', text: 'Un hechizo errante activa 2x XP por 30 minutos.', bonus: 0, doubleXP: true },
  { title: '🍀 ¡Día de Suerte!', text: 'El destino te favorece. +25 XP de bonus.', bonus: 25 },
  { title: '🐉 ¡Dragón Dormido!', text: 'El dragón duerme. Momento ideal para completar misiones.', bonus: 0 },
  { title: '⚔️ ¡Hora de Batalla!', text: '¡La guerra llama! Completa una misión principal ahora.', bonus: 0 },
  { title: '🌟 ¡Lluvia de Estrellas!', text: 'Las estrellas guían tu camino. +15 XP bonus.', bonus: 15 },
  { title: '🔮 ¡Visión del Oráculo!', text: 'El oráculo revela: completa 3 misiones hoy para poder extra.', bonus: 0 },
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
