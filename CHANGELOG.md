# CHANGELOG — Arcanum Dungeon Productivity

Todas las fechas en formato YYYY-MM-DD (hora Monterrey, CDT = UTC-5).

---

## [v92] — 2026-06-19

### HUD: Efectos Activos + Progreso Diario en header; Boss cards ancho completo

- **Efectos Activos movidos al header** — chip compacto horizontal (pill con borde morado) entre el reloj y los botones de herramientas; oculto en móvil ≤768px
- **Progreso Diario movido al header** — label + barra horizontal compacta junto a efectos
- **Divisor visual** entre efectos y progreso
- **boss-info-panel eliminado** del HTML — bosses toman todo el ancho del área
- **Boss grid full-width** — CSS grid `auto-fill minmax(220px, 1fr)` para que las cards crezcan y llenen el espacio disponible
- **SW** bump `dungeon-v91` → `dungeon-v92`

---

## [v91] — 2026-06-19

### Revert diseño + capa de animaciones Emil Kowalski / Silao

- **Revert total**: `index.html` y `views.js` restaurados al estado pre-rediseño (`aea81db`) — diseño original intacto
- **dungeon-v2.css reescrito** como capa de solo animaciones (sin colores, sin layout, sin cambios estructurales)
- **Curvas de easing** (Emil Kowalski): `--ek-out`, `--ek-in-out`, `--ek-spring`, `--ek-drawer`
- **Botones**: `:active { scale(0.97) }` en 100ms en todos los elementos presionables
- **Modales**: entran desde `scale(0.95) translateY(6px)` ease-out 220ms
- **Toasts (Silao/Sonner)**: entran desde abajo `translateY(8px) scale(0.95)` 240ms; salen 160ms
- **Quest stagger**: 35ms entre ítems, animación `quest-enter`
- **Sidebar stagger**: 30ms entre items al cargar
- **Hover lifts**: boss cards `translateY(-3px)`, achievements `translateY(-2px)`, pets spring scale
- **Barras**: XP fill 700ms, HP/Mana 500ms ease-out
- **Heatmap cells**: `scale(1.3)` hover
- **Loot particles**: float animación 850ms
- **Reduced motion**: todas las animaciones desactivadas con `prefers-reduced-motion`
- **SW** bump `dungeon-v90` → `dungeon-v91`

---

## [v87] — 2026-06-19

### Rediseño UI — Dark Void + Emil Kowalski Animations

- **Paleta void black** — tokens `--bg: #08080d`, `--bg2: #0f0f18`, `--bg3: #141420` aplicados vía `dungeon-v2.css` (override layer, no modifica `dungeon.css`)
- **Header/HUD** — logo + weather chip + reloj en monospace + tools; sin avatar ni barras en header
- **Sidebar** — portrait circular con conic-gradient animado (8s spin) + MORDRED + título + 3 barras HP/XP/Mana + mini stats
- **Boss cards** — corner pips vía `::before`/`::after` con `var(--rc)` color de rareza
- **Quest items** — stripe de prioridad con gradientes por rareza, hover translateX(2px)
- **Quest type headers** — inscripción `─── ◆ ─── LABEL ─── ◆ ───` con flex lines
- **Character Hub tabs** — monospace, pill activo con borde azul
- **Character sheet** — portrait ring conic-gradient con contra-rotación del imagen interior
- **Modales (Emil Kowalski)** — `scale(0.95) translateY(6px)` → `scale(1)`, ease-out 220ms (no spring)
- **Toasts (Sonner-style)** — entrada desde abajo `translateY(8px) scale(0.95)`, 240ms ease-out
- **Buttons** — `:active { transform: scale(0.97) }` en 100ms, consistent across all pressables
- **Stagger quests** — 30-50ms delay entre ítems, animación `v2-quest-in`
- **Runas, Bestiario, Herrero, Sala, Shop, Zonas** — corner pips, hover states, void background
- **Reduced motion** — todas las animaciones desactivadas con `prefers-reduced-motion`
- **SW** bump `dungeon-v86` → `dungeon-v87`, `/css/dungeon-v2.css` añadido a ASSETS

---

## [v67] — 2026-06-17

### Arte completo wired (150+ assets CDN)
- **Banner del Boss (1420×120)** — fondo de boss varía por rareza (común/raro/épico/legendario/mítico/cataclismo) + badge de rareza en color
- **28 bosses sprites** — nuevo pool de bosses expandido con rareza completa (comun→cataclismo) en BOSS_DEFS
- **50 armas/armaduras** — imágenes pixel art en el herrero (espada, báculo, dagas, mazo, arco, pecho, casco, botas, guantes, grebas × 5 tiers)
- **8 runas** — imágenes en inventario de runas (con fallback emoji)
- **11 nodos árbol de habilidades** — nodo ofensivo/defensivo/arcano × bloqueado/disponible/desbloqueado por posición en tier
- **18 retratos de personaje** — char_${clase}_${raza}.png (guerrero/mago/pícaro/clérigo/arquero/fundador × humano/elfo + 6 clases secretas)
- **42 fondos de mascotas** — fondo per pet por etapa (egg/baby/mount) para 7 mascotas
- **7 alimentos de mascota** — imagen en shop y en inventario
- **7 pociones de mascota** — imagen en shop
- **9 salas de dungeon** — imagen de fondo en dungeon-grows rooms
- **15 fondos de vistas** — fondos propios para quests, stats, shop, inventory, pets, goals, integrations, achievements, history, character, skills, runes, smithy, bestiary, dungeon-grows
- **Rey de la Tempestad** — 7ª mascota definitiva agregada a PET_DEFS + shop (huevo, pociones, alimento)
- **image-rendering:pixelated** en todas las imágenes pixel art

---

## [v40] — 2026-06-17

### Agregado
- **Equipamiento con stats funcionales** — Armas equipadas ahora aplican bonus de XP, Oro y HP máx en `hero.js`, `quests.js` y `views.js`
- **Boss semanal con daño real** — `checkBossDeadline()` en `rpg.js`: domingos 10pm aplica -HP y -8% oro si el jefe no fue derrotado; protegible con Escudo Anti-Boss
- **Tienda mejorada** — 4 nuevos consumibles: Poción Menor HP (+25 HP, 35g), Monedas del Mercader (2× oro 1h, 80g), Escudo Anti-Boss (150g), Pergamino de Poder (+75 XP, 70g)
- **Notificaciones push para hábitos** — Campo "hora de recordatorio" en edición de hábitos (guardado como `reminder-HH:MM` en tags); `checkHabitReminders()` corre cada minuto
- **Pomodoro vinculado a hábitos** — Botón 🍅 en cada ítem de hábito para vincular al timer activo
- **Modo Focus mejorado** — Muestra XP ganado hoy, contador total de poms y mini-barra de HP en el overlay
- **Retos de 30 Días** — `js/challenges.js` con 8 retos: El Mes del Guerrero, La Racha Eterna, El Maratonista del Tiempo, Héroe de Leyenda, Maestro de Hábitos, Tesoro de Poder, Cazador de Jefes, Rutinario Legendario. Persistido en `hero.challenges`. Modal accesible desde sidebar y Más sheet.
- **Crafteo con cooldown real** — Sección "En la Forja" en el Herrero muestra armas en progreso con cuenta regresiva en tiempo real (horas/minutos)

### Corregido
- Swipe-to-complete ya estaba wired en `renderQuestList()`; confirmado correcto
- Gold rush multiplier aplica 2× cuando `hero.gold_rush_exp > Date.now()`

### Base de datos
- Migración `add_v40_hero_fields`: columnas `boss_shield boolean`, `gold_rush_exp bigint`, `challenges text`

### Cambiado
- SW cache: `dungeon-v39` → `dungeon-v40`
- `main.js`: interval de 60s para `checkHabitReminders()` + `checkBossDeadline()`; interval 15min para `updateChallengeProgress()`

---

## [v39] — 2026-06-17

### Agregado
- **Kanban eliminado** — vista, CSS (~180 líneas), JS (renderKanban, initKanbanDrag), refs en 8 archivos
- **Google Calendar eliminado** — sidebar, view, script, sw cache
- **Mobile redesign** — botón hero en header (avatar + HP bar), tab "Héroe" en nav móvil
- **Login premium** — orbs animados, runas flotantes, emblem con glow, btn shine
- **Sistema de Drops** — `js/drops.js`; animación flotante +XP +Gold al completar misión; drops de items aleatorios por rareza
- **Meta diaria de XP** — `js/daily_goal.js`; barra de progreso 300 XP default; persiste en hero.daily_goal_xp
- **Resumen semanal** — `js/weekly_summary.js`; modal automático los lunes con stats de la semana

### Cambiado
- SW cache: `dungeon-v38` → `dungeon-v39`
- Mobile nav: Kanban → Héroe (character view); Kanban removido del Más sheet
- Atajo de teclado `2` ahora abre Personaje en lugar de Kanban
- `primaryViews` en ui.js: `['quests', 'character', 'stats']`

---

## [v38] — 2026-06-17

### Agregado
- **12 sistemas nuevos** implementados en una sesión:
  - Misiones Encadenadas (`depends_on` → UI blocked con grayscale)
  - Hábitos bidireccionales +/- (`type='habit'`; tag `habit-` = negativo)
  - Modo Pesadilla (toggle hero.nightmare_mode, botón more-menu)
  - **Integración Duolingo** (Edge Function `duolingo-proxy`; 10 XP Duo = 1 XP Arc; máx 200/día)
  - Sistema de Combos (`js/combos.js`; ventana 15min; 1.1×/1.25×/1.5× XP)
  - Ciclo Día/Noche visual (`#todOverlay`; tint RGBA por TOD)
  - Modo Furia (HP < 20% → body.fury-mode → +50% XP)
  - Atajos de Creación Ultrarrápida (Ctrl+N; parser `!epico #tag @mañana`)
  - Mapa de Calor de Pomodoros (grilla 7d × 24h en Stats)
  - Escudos de Misión (3 del mismo tipo → hero.streak_shield)
  - Ruleta del Dungeon (`js/ruleta.js`; cada 3 días; 12 premios)
  - Revisión Exprés Matutina (modal < 10am; bono energía × 5 XP)
- **Facciones del Dungeon** anotadas en backlog CLAUDE.md (~3-4 semanas)
- `js/combos.js`, `js/habits.js`, `js/ruleta.js`, `js/duolingo.js` — archivos nuevos
- Edge Function `duolingo-proxy` deployada en Supabase Aglaya (verify_jwt: false)
- Columnas nuevas en `dungeon_heroes`: `duo_username`, `duo_sync_date`, `duo_xp_date`, `duo_today_xp`, `duo_streak`

### Cambiado
- `config.js`: XP_TABLE agrega `habit: 20`, GOLD_TABLE agrega `habit: 8`
- SW cache: `dungeon-v37` → `dungeon-v38`

---

## [v37] — 2026-06-17

### Corregido
- **Google Fit sync** — fecha local vs UTC; antes `toISOString()` daba fecha UTC incorrecta después de 7pm CDT
- **Google Fit** — `fit_sync_date` y `fit_xp_date` movidos de localStorage a Supabase (`dungeon_heroes`)
- **Google Fit** — data source: query genérico sin `dataSourceId` fijo
- **Google Fit** — `_fitSyncing` flag para prevenir llamadas concurrentes
- **Google Fit** — guard ahora solo omite sync si `fitSteps > 0` (antes atascaba en 0)
- **Duolingo** — Edge Function v2: parsea `g.date` (string) y `g.time` (unix); fallback `xpGoalMetToday`
- **Duolingo** — toda la persistencia movida de localStorage a Supabase
- Columnas nuevas en `dungeon_heroes`: `fit_sync_date`, `fit_xp_date`, `duo_*`

---

## [v36-anterior] — Sesiones previas

### Sistemas existentes al inicio de estas sesiones
- Misiones (main/side/daily/weekly) con rareza
- Pomodoro timer vinculado a misiones
- Nivel y XP con bonos por clase/raza/runas
- Racha diaria + amuleto de protección
- Logros
- Inventario + Tienda
- Mascotas + incubación
- Árbol de Habilidades
- Runas
- Bestiario
- Oracle (Gemini)
- Google Fit, Spotify
- Clima (Open-Meteo)
- Reloj del Dungeon (TOD bonuses)
- Mi Dungeon (mapa)
- Goals
- Reputación de gremio
- Patrones de actividad (AI)
- Character Hub (5 tabs)
- Índice del Héroe 0-100
- Push Notifications (Web Push + VAPID)
- Búsqueda Cmd+K
- Modo compacto / focus
- Kanban (eliminado en v39)
- Google Calendar (eliminado en v39)
