# Arcanum Dungeon Productivity — CLAUDE.md
> Última actualización: 2026-06-30 · SW cache: `dungeon-v181`

## Proyecto
- **URL:** https://dungeon.mordredgh.com
- **Repo:** Mordredgh/dungeon-productivity
- **Deploy:** Coolify (via `deploy.sh` — **nunca** `git push` directo)
- **Backend:** Supabase Aglaya (`stdedxhxxoyostymldqn.supabase.co`)
- **Stack:** Vanilla JS · Sin bundler · Sin framework · CSS custom properties

## Reglas críticas
- **NUNCA** mencionar Electron, SQLite, ipcRenderer
- **NUNCA** usar preview_* tools (es PWA web en Coolify, no hay servidor local)
- **Siempre** bumpar `sw.js` cache version al modificar JS/CSS (lo hace `deploy.sh`)
- **Siempre** terminar con `bash deploy.sh "tipo: descripción"`
- `saveHero({ campo })` para updates al héroe — nunca raw upsert
- Subtasks en markdown dentro de `quest.notes` — nunca tabla separada

---

## Orden de carga de scripts (index.html)
```
config.js → state.js → db.js → hero.js → quests.js → timer.js → inventory.js →
spells.js → views.js → ui.js → events.js → oracle.js → shop.js → rpg.js →
pets.js → weapons.js → secret_sets.js → goals.js → reputation.js → patterns.js →
mechanics.js → character.js → spotify.js → weather.js → dungeon_clock.js →
skill_tree.js → bestiary.js → dungeon_grows.js → runes.js → google_fit.js →
hero_score.js → push.js → combos.js → habits.js → ruleta.js → duolingo.js →
drops.js → daily_goal.js → weekly_summary.js → challenges.js → zones.js →
hero_card.js → world_map.js → sala_personal.js → pet_garden.js → boss_battle.js →
animations.js → effects.js → auth.js → main.js
```
Agregar archivos nuevos **ANTES de `auth.js`**.

---

## Mapa de archivos JS

### Núcleo
| Archivo | Propósito | Funciones clave |
|---------|-----------|----------------|
| `config.js` | Constantes globales | `SUPA_URL`, `SUPA_KEY`, `XP_TABLE`, `GOLD_TABLE`, `CLASS_SKILLS`, `SHOP_ITEMS`, `ACHIEVEMENT_DEFS`, `DROP_TABLE` |
| `state.js` | Variables globales | `db`, `hero`, `quests`, `pomodoros`, `timer`, `goals`, `bulkMode`, `spotifyAccessToken`, `xpMultiplier` |
| `db.js` | Supabase ops | `initDB()`, `loadHero()`, `loadQuests()`, `loadPomodoros()`, `savePom()`, `loadInventory()`, `loadPets()` |
| `hero.js` | Progresión héroe | `loadHero()`, `deriveHero()`, `saveHero()`, `addXP()`, `addHP()`, `calcLevel()`, `checkDailyStreak()`, `xpForLevel()`, `doPrestige()` |
| `auth.js` | Login/logout | `doLogin()`, `doLogout()`, `toggleLoginPw()` |
| `main.js` | Boot | `bootApp()` — inicializa todo en orden |

### Misiones y Timer
| Archivo | Propósito | Funciones clave |
|---------|-----------|----------------|
| `quests.js` | CRUD misiones + completar | `addQuest()`, `completeQuest()`, `undoComplete()`, `deleteQuest()`, `updateQuest()`, `_checkMissionShield()` |
| `timer.js` | Pomodoro | `startTimer()`, `pauseTimer()`, `resetTimer()`, `tickTimer()`, `advancePhase()`, `updateTimerUI()` |
| `habits.js` | Hábitos +/- | `completeHabitQuest()`, `isHabitNegative()`, `renderHabitItem()` |

### Vistas y UI
| Archivo | Propósito | Funciones clave |
|---------|-----------|----------------|
| `views.js` | Render principal | `renderAll()`, `renderHeroUI()`, `renderQuestList()`, `renderQuestItem()`, `renderStats()`, `updateBossBanner()`, `renderHabitItem()`, `renderPomHeatmap()` |
| `ui.js` | Modales y navegación | `openModal()`, `closeModal()`, `toast()`, `switchView()`, `switchCharTab()`, `openEditQuestModal()`, `toggleCompact()` |
| `events.js` | Manejadores de eventos | `resetDailyQuests()`, `checkMorningReview()`, `toggleNightmareMode()`, `renderNightmareModeBtn()`, `openQuickCreate()`, `parseQuickCreate()` |
| `oracle.js` | Oráculo IA | `openOracle()`, `closeOracle()`, `oracleSend()`, `oracleQuickPrompt()`, `checkWeeklyRetro()`, `checkMorningBriefing()`, `checkDeadlineAlerts()` |
| `character.js` | Hoja de personaje | `renderCharacterSheet()`, `saveCharacterSheet()`, `assignAttrPoint()` |

### Sistemas RPG
| Archivo | Propósito | Funciones clave |
|---------|-----------|----------------|
| `rpg.js` | Skills, eventos, diario | `useClassSkill()`, `getBossState()`, `damageBoss()`, `checkRandomEvent()`, `generateDiaryEntry()`, `openDiary()` |
| `inventory.js` | Items y drops | `loadInventory()`, `addInvItem()`, `consumeInvItem()`, `rollLoot()`, `grantLoot()`, `showRewardModal()` |
| `shop.js` | Tienda y gold | `getGold()`, `addGold()`, `spendGold()`, `buyItem()`, `getPotionMult()` |
| `spells.js` | Hechizos | `castSpell()`, `renderSpells()`, `checkAchievements()`, `renderAchievements()` |
| `weapons.js` | Armas y forja | `loadWeapons()`, `equipWeapon()`, `craftWeapon()`, `renderSmithy()` |
| `secret_sets.js` | Sets de Clases Secretas (late-game) | `trySecretMatDrop(q)`, `craftSecretPiece(classKey, pieceKey)`, `checkSecretForgeQueue()`, `isSecretSetComplete(classKey)`, `_renderSecretSmithy()` |
| `pets.js` | Mascotas | `loadPets()`, `hatchEgg()`, `feedPet()`, `setActivePet()`, `activatePetPower()`, `getPetEffect()` |
| `runes.js` | Runas | `loadRunes()`, `tryRuneDrop()`, `socketRune()`, `getRuneBonus()` |
| `skill_tree.js` | Árbol de habilidades | `hasSkill()`, `learnSkill()`, `getSkillTreeXPBonus()` |
| `bestiary.js` | Bestiario | `getBestiary()`, `recordBossDefeat()`, `renderBestiary()` |
| `reputation.js` | Reputación por tags | `calcReputationByTag()`, `getReputationBonus()` |
| `mechanics.js` | Apuestas/Wagers | `openWagerModal()`, `confirmWager()`, `resolveWagerWin()` |
| `patterns.js` | Análisis de patrones AI | `generatePatternAnalysis()`, `renderPatterns()` |
| `combos.js` | Combo multiplier | `registerCombo()`, `getComboMult()`, `renderComboChip()` |
| `ruleta.js` | Ruleta cada 3 días | `isRuletaAvailable()`, `openRuleta()`, `spinRuleta()`, `applyRuletaPrize()` |
| `drops.js` | Animación loot drop | `spawnLootDrop(xpAmt, goldAmt, rarity, originEl?)` |
| `daily_goal.js` | Meta diaria XP | `getDailyGoal()`, `getDailyGoalToday()`, `addDailyGoalXP()`, `renderDailyGoalBar()` |
| `weekly_summary.js` | Resumen semanal lunes | `checkWeeklySummary()` |
| `hero_score.js` | Índice héroe 0-100 | `calcHeroScore()`, `getHeroScoreTier()`, `renderHeroScoreWidget()` |
| `challenges.js` | Retos 30 días | `openChallengesModal()` |
| `zones.js` | Zonas del dungeon | `renderZones()` |
| `animations.js` | Animaciones GSAP-lite | namespace `window.Anim` |
| `effects.js` | Efectos visuales premium | `confettiCannon()`, `hyperScramble()`, `typeWriter()`, `morphingText()`, `numberTicker()`, `initFlickerGrid()`, `renderBossSteps()`, `openQuestDrawer()`, `toggleFabDial()` |

### Integraciones
| Archivo | Propósito | Funciones clave |
|---------|-----------|----------------|
| `google_fit.js` | Pasos diarios | `connectGoogleFit()`, `syncGoogleFitSteps()`, `renderFitWidget()` |
| `duolingo.js` | Sync XP Duolingo | `syncDuolingo()`, `getDuoUsername()`, `renderDuolingoWidget()` |
| `spotify.js` | Now Playing | `connectSpotify()`, `spotifyToggle()`, `renderSpotifyWidget()` |
| `weather.js` | Clima real | `loadRealWeather()`, `renderWeatherDetail()` |
| `push.js` | Web Push | `initPush()`, `dungeonPush(title, body, url?)`, `isPushSubscribed()` |
| `dungeon_clock.js` | Reloj + TOD bonuses | `getDungeonTOD()`, `getTODBonus()`, `updateDungeonClock()` |
| `dungeon_grows.js` | Mapa dungeon | `renderDungeonGrows()` |

---

## Vistas (data-view)
| View | Descripción |
|------|-------------|
| `quests` | Lista de misiones (default) |
| `stats` | Sala del Trono — analytics + heatmap |
| `achievements` | Grid de logros |
| `history` | Historial completadas |
| `shop` | Tienda del gremio |
| `inventory` | Inventario |
| `pets` | Mascotas |
| `goals` | Metas largas |
| `integrations` | Fit + Duolingo + Spotify |
| `dungeon-grows` | Mapa dungeon |
| `character` | Character Hub (5 tabs) |
| `zones` | Zonas del dungeon |
| `worldmap` | Mapa del mundo |

**Eliminadas:** `kanban` (v39), `calendar` (v39)

---

## Tablas Supabase (Aglaya)

### `dungeon_heroes` — columnas relevantes
```
Progresión:   level, xp, xp_total, hp, hp_max, quests_done, main_done
Racha:        streak, longest_streak, last_active_date
Recursos:     gold (también localStorage), skill_points, attr_points
Atributos:    str, intel, dex, con, wis, cha
Estado:       nightmare_mode, amulet, streak_shield, curse_date, main_bonus_date
Skills clase: transmute_next, arrow_rain, strategic_count, berserker_exp, skill_date
Buffs:        potion_exp, double_next
Contenido:    diary, prophecy, skill_tree, bestiary, achievements, quick_notes
Prestige:     prestige, level_history (jsonb)
Sets secretos: forge_queue (jsonb) — cola de hasta 3 piezas en forja [{classKey, pieceKey, readyAt}]
Hábitos:      habit_history (jsonb) — fechas completadas por quest_id, para renderHabitHeatmap()
Reporte mensual: monthly_report_text, monthly_report_date
Integración:  fit_access_token, fit_refresh_token, fit_token_expiry, fit_sync_date, fit_xp_date
              duo_username, duo_sync_date, duo_xp_date, duo_today_xp, duo_streak
              spotify_refresh_token
Meta diaria:  daily_goal, daily_goal_xp, daily_goal_date
Perfil:       name, hero_class, race, avatar, guild_name, webhook_url
```

### Otras tablas
- `dungeon_quests` — misiones (`depends_on`, `tags`, `type`, `notes` para subtasks)
- `dungeon_pomodoros` — sesiones pom (`started_at`, `duration_min`, `quest_id`)
- `dungeon_push_subscriptions` — Web Push (hero_id UNIQUE)
- `dungeon_inventory` — items
- `dungeon_pets` — mascotas
- `dungeon_weapons` — armas
- `dungeon_goals` — metas largas
- `dungeon_runes` — runas

---

## Convenciones de código (anti-entropía)

### JS — usar namespace `Anim`, no nuevos globals
```js
// ❌ MAL — agrega otro global al namespace de window
function animNuevaCosa(el) { ... }

// ✅ BIEN — se suma al namespace existente
Anim.nuevaCosa = function(el) { ... };

// Llamarlo desde otro archivo:
if (window.Anim?.nuevaCosa) Anim.nuevaCosa(el);
```
- `window.Anim` está definido en `js/animations.js` al final del archivo
- Los alias `animXxx()` existentes NO se borran — son backwards-compat
- Para módulos nuevos (no de animación): `window.NombreModulo = { fn1, fn2 }` al final del archivo

### CSS — zona de animaciones + prefijo `.anim-`
```css
/* ❌ MAL — añadir CSS de motion disperso en el archivo */
.mi-cosa { animation: fadeIn 0.3s; }

/* ✅ BIEN — ir al final de dungeon.css, en la sección PREMIUM EFFECTS */
.anim-mi-cosa { animation: _anim-miCosa 0.3s ease-out both; }
@keyframes _anim-miCosa { ... }
```
- Todo CSS nuevo de animación/transición va al **final de `dungeon.css`**
- Prefijo `.anim-` obligatorio para clases de animación nueva
- Nuevas clases de componente usan BEM-lite: `.quest-item--completing`, `.boss-banner--urgent`
- **Sin `!important`** en la zona de animaciones — usar especificidad de selector

### Deploy
```bash
# UN SOLO COMANDO — bump SW + verificar ASSETS + commit + push + Coolify redeploy
bash deploy.sh "tipo: descripción"
```
- Requiere `COOLIFY_DUNGEON_TOKEN` en variables de entorno de usuario
- **NUNCA** usar `git push` directo — no bumpea el SW ni triggerea Coolify
- Si el token falta, solo hace git push (auto-deploy de Coolify puede tardar más)

### Checklist para agregar un módulo nuevo
1. Crear `js/mi_modulo.js` con `'use strict';`
2. Añadir `<script src="js/mi_modulo.js?v=X">` en index.html **ANTES de `auth.js`**
3. Añadir `/js/mi_modulo.js` en ASSETS de `sw.js`
4. Añadir CSS al final de `dungeon.css` (sección PREMIUM EFFECTS)
5. Ejecutar `bash deploy.sh "feat: descripción"`
6. Actualizar tablas de este CLAUDE.md

---

## Guía rápida — Elemento visual → archivo exacto

| Elemento | CSS (dungeon.css línea aprox.) | JS responsable |
|---|---|---|
| Sidebar héroe (avatar, barras XP/HP) | L.423 `.sb-profile`, `.sb-bars` | `views.js renderHeroUI()` |
| Boss banner / boss cards | L.711 `.boss-banner`, `.bcard-*` | `views.js updateBossBanner()` |
| Quest item (misión en lista) | L.977 `.quest-item`, `.quest-check` | `views.js renderQuestItem()` |
| Timer ring (pomodoro) | L.1328 `.timer-ring`, `.pom-count` | `timer.js updateTimerUI()` |
| Modals (todos) | L.1566 `.modal-overlay`, `.modal` | `ui.js openModal()` |
| Toast notification | L.1847 `.toast-*` | `ui.js toast()` |
| Focus mode overlay | L.1935 `.focus-overlay-*` | `events.js toggleFocusMode()` |
| Oracle chat panel | L.3071 `.oracle-*` | `oracle.js openOracle()` |
| Shop / Inventory / Smithy | L.3272 `.shop-*`, `.inv-*`, `.smithy-*` | `shop.js`, `inventory.js` |
| Dungeon grows (mapa) | L.3982 `.dg-*`, `.grows-room` | `dungeon_grows.js` |
| Login overlay | L.4327 `.login-*`, `.welcome-screen` | `auth.js doLogin()` |
| Character sheet premium | L.3640+ `.csp-*` | `character.js renderCharacterSheet()` |
| Mobile nav (barra inferior) | L.2243+ `#mobileNav`, `.more-sheet` | `ui.js` |
| Dungeon clock chip | L.2599+ `.dungeon-clock-*` | `dungeon_clock.js` |
| Premium effects (shiny, glow, plasma) | L.6714 `.shiny-text`, `.bcard-plasma` | `effects.js` |
| Efectos Batch 4 (aurora, dock, drawer…) | L.6802+ `.aurora-text`, `.border-beam`… | `effects.js` |
| Desktop Dock (Magnify) | L.6940+ `.dungeon-dock`, `.dock-item` | `effects.js initDockMagnify()` |
| FAB Speed-Dial (mobile) | L.6990+ `.fab-dial`, `.fab-action` | `effects.js toggleFabDial()` |
| Quest Detail Drawer | L.7025+ `.quest-drawer-*` | `effects.js openQuestDrawer(id)` |
| Boss Progress Steps | L.7065+ `.boss-steps`, `.boss-step` | `effects.js renderBossSteps(boss)` |
| Loot drop animación | `dungeon-v2.css` `.loot-drop-*` | `drops.js spawnLootDrop()` |
| Combo chip | `dungeon-v2.css` | `combos.js renderComboChip()` |

> **dungeon.css tiene índice al inicio** — Ctrl+G + número de línea para ir directo a la sección.

---

## Patrones y convenciones

### Completar una misión (`completeQuest`)
```
addXP() aplica en cascada:
  1. Clase bonus       → classXPBonus()
  2. Raza bonus        → hero.race === 'humano' → +10%
  3. TOD bonus         → getTODBonus().xpMult
  4. Poción            → getPotionMult()
  5. Berserker         → hero.berserker_exp check
  6. Clima             → getWeatherXPMult()
  7. Skill tree        → getSkillTreeXPBonus()
  8. Runas             → getRuneBonus()
  9. Mascota           → getPetEffect()
  10. Reputación       → getReputationBonus()
  11. Combo (15min)    → getComboMult()
  12. Modo Furia       → HP < 20% → ×1.5
  13. Nightmare Mode   → hero.nightmare_mode → daño si no completada
  14. Wager            → resolveWagerWin()
  + spawnLootDrop()    → animación visual
  + addDailyGoalXP()   → meta diaria
  + registerCombo()    → actualiza combo
  + _checkMissionShield() → racha de tipo
```

### Level-up (`addXP` en hero.js)
- Otorga **1 `attr_point`** y **1 `skill_point`** por nivel ganado
- Guarda ambos con `await saveHero({ attr_points, skill_points, level_history })`
- `attr_points` → se gastan en `character.js assignAttrPoint()`
- `skill_points` → se gastan en `skill_tree.js learnSkill()`

### Patrones de código
- `openModal(id)` → agrega clase `open` al `.modal-overlay`
- `closeModal(id)` → remueve clase `open`
- `toast(icon, msg)` → notificación flotante 3s
- `escHtml(str)` → sanitizar output en templates HTML
- `switchView(v)` → cambia vista activa; si `v === 'oracle'` llama `openOracle()` y retorna
- `saveHero(patch)` → `Object.assign(hero, patch)` + `db.from('dungeon_heroes').update(patch).eq('id', hero.id)`

### localStorage permitido
Solo para datos no críticos (se puede perder sin consecuencias):
- `dungeon-gold` — gold sincronizado con hero.gold
- `dungeon-combo-count` / `dungeon-combo-last` — combos
- `dungeon-type-history` — historial tipos para escudos
- `dungeon-ws-YYYY-WW` — weekly summary seen flag
- `dungeon-morning-review-YYYY-MM-DD` — revisión matutina

**Prohibido en localStorage:** tokens, fechas de sync, XP ganado, configuración crítica

---

## Character Hub
- **Acceso:** clic en avatar → `switchView('character')`
- **Tab bar** `#charHubTabs` vive FUERA de `.views` (sibling de `.content-area`)
- **Tabs:** 🛡️ Personaje | 🌳 Habilidades | 💎 Runas | 📖 Bestiario | ⚒️ Herrero
- `switchCharTab(tab)` en ui.js — activa panel `.char-tab-panel[data-ctab]`

---

## Mobile (≤640px)
- **Nav:** `#mobileNav` fijo al fondo — Misiones | Héroe | Trono | Más
- **Más sheet:** Shop, Inventario, Logros, Historial, Herrero, Mascotas, Integrar, Metas
- **Hero btn en header:** `.mobile-hero-btn#mobileHeroBtnHdr` → abre character view
- **FAB Speed-Dial:** `#mobileFab` → `toggleFabDial()` → despliega 3 sub-acciones
- **Elementos actualizados en renderHeroUI():** `mhbAvatar`, `mhbNavAvatar`, `mhbName`, `mhbHpFill`, `mhbLevel`
- **Desktop Dock** oculto en ≤640px

---

## Edge Functions (Supabase Aglaya)
| Función | verify_jwt | Propósito |
|---------|-----------|-----------|
| `send-push` | false | Enviar Web Push notifications |
| `google-oauth` | true | Exchange/refresh Google OAuth tokens |
| `duolingo-proxy` | false | Proxy a API Duolingo (evita CORS) |

---

## Push Notifications
- VAPID pública: `BEaYhse8leKsQniLSS9AiCNG3lt4Xz7H_swtNZAHKaJ_rUbIQTHt28pJBqv15yue4MRStrzB3yAa82jg2DoKGNU`
- `dungeonPush(title, body, url?)` — dispara push real via Edge Function
- `initPush()` — auto-suscribe si permiso ya concedido; llamado en boot

---

## Service Worker
- Versión actual: `dungeon-v185`
- **Siempre bumpar** al modificar cualquier JS/CSS — lo hace `deploy.sh` automáticamente
- Estrategia: cache-first con skipWaiting + clients.claim

---

## Combate de jefes — debilidades elementales + skills de héroe (v183)
- **Elemento por jefe:** `BOSS_DEFS[].element` (config.js) — 7 elementos reales (Fuego/Elemental/
  Eléctrico/Aéreo/Oscuro/Mágico/Cataclismo) + Normal neutro. Matriz `BOSS_ELEMENT_CHART` y
  `getElementMultiplier(bossElement, moveType)` — ×1.5 débil, ×0.67 resiste, ×1 normal
- Aplicado en `boss_battle.js _bbCalcDmg()`; feedback visual ▲/▼ en cada botón de movimiento +
  toast "¡Súper efectivo!"/"Poco efectivo..." al golpear + chip de elemento del jefe en `_bbRender()`
- **Skills de héroe en combate:** `HERO_BATTLE_SKILLS` (config.js) — 1 por clase, 1 uso por batalla
  (`_bbHeroSkillUsed`, reset en `openBossBattle()`), independiente de `useClassSkill()` (esa es maná,
  fuera de combate). `useHeroBattleSkill()` en boss_battle.js maneja 4 tipos: ataque normal/mágico,
  `heal` (clérigo cura mascota), `crit` (pícaro dobla mejor movimiento), `double` (arquero golpea 2×)
- Contraataque del boss extraído a `_bbBossCounterAttack()` reusable (antes duplicado)

## Sumideros de oro (v184)
- **Mejoras permanentes** (`GOLD_UPGRADES` en config.js, compra única, `hero.gold_upgrades` jsonb):
  cola de forja +1/+2 (`getForgeQueueMax()`), +5% drop rate, +10% oro permanente — tab "📈 Mejoras" en
  Tienda, lógica en `shop.js _renderGoldUpgrades()`/`buyGoldUpgrade()`
- **Marcos de avatar cosméticos** (`AVATAR_FRAMES`, `hero.owned_frames`/`equipped_frame`): 4 marcos
  (bronce/plata/oro/arcano), tab "🖼️ Marcos", aplicados como clase CSS en `renderHeroUI()`

## Retención diaria (v184)
- **Misión del Día:** `DAILY_SPECIAL_QUESTS` (14 plantillas), elegida por seed de fecha
  (`_dayOfYearSeed()`), creada 1×/día por `checkDailySpecialQuest()` (events.js, llamado en boot) con
  tag `mision-del-dia`, recompensa fija 60 XP/30 oro (override en `completeQuest()` antes de la cadena
  de multiplicadores, así sigue beneficiándose de combos/runas/etc.)
- **Hitos de racha con recompensa real:** `STREAK_REWARD_MILESTONES` (3 a 365 días), otorgados por
  `checkStreakRewards()` (events.js), dedup en `hero.streak_rewards_claimed` — complementa (no
  reemplaza) los logros cosméticos de racha que ya existían

## Progresión 50+ (v184)
- **Curva de diminishing returns:** `getPrestigeXPBonus(prestige)` en hero.js — lineal +5%/prestige
  hasta el 10, luego se aplana asintóticamente hacia +50% adicional máximo. Reemplaza el cálculo lineal
  sin tope que tenía `classXPBonus()`
- **Árbol de Maestría:** `MASTERY_TREE` (config.js) — 6 nodos, 1 punto de maestría por Ascensión
  (`hero.mastery_points`, otorgado en `doPrestige()`), ranks en `hero.mastery_ranks` (jsonb). UI en
  `character.js` (sección debajo del botón Ascender), `spendMasteryPoint()` en hero.js. Nodos:
  vigor (+HP máx), fortuna (+oro), persistencia (-tiempo forja), fuerza_bruta (+daño mascota en
  jefes), suerte (+drop rate), voluntad (+ataques diarios contra jefes)
- **Rangos de prestige en título:** `getDynamicTitle()` (views.js) — escalera completa 1/2/3/5/10/20/30/50

---

## Histórico de versiones — resumen no exhaustivo (v52 → v181)
> CLAUDE.md se dejó de actualizar en v145 hasta hoy (2026-06-30). Esto resume lo que pasó en el medio
> para que no se vuelva a perder. No es línea por línea — son **177 commits** tocando `sw.js`; ver
> `git log --oneline -- sw.js` para el detalle completo.

**v52–v58** — Este es el plan de "12 features + security review" que se verificó hoy 2026-06-30.
Ya estaba implementado por completo desde esa ventana de versiones:
títulos dinámicos · encuentros en poms 20% · ciclo día/noche sidebar (v52) · prestige + historial de
niveles + level-up modal (v53) · inventario visual grid RPG (v54) · habit heatmap + reporte mensual IA
(v55) · habit reminders UI + boss countdown (v56) · Zonas del Dungeon (v57) ·
**security: fix XSS en cmdk search + RLS audit (v58)**.

**v58 → ~v110** — heatmap 7×24 + comparativa 4 semanas, logros ocultos (15), eventos estacionales,
maná funcional para hechizos, carnet de héroe exportable a PNG, y más sistemas no auditados en detalle
hoy — revisar con `git log` si se necesita contexto de esta franja.

**~v146 → v158** — Rediseño RPG grande: Sala del Trono → stats kingdom board, hoja de personaje
estilo D&D, login con gold gate, logros con tema oro, mascotas con bestiario, metas → campaign board,
zonas → mapa de territorio, tienda con cards de rareza, inventario con slots tipo Diablo.

**v158 → v178** — Sistema de batalla de bosses estilo Pokémon (`boss_battle.js`): sprites reales de
mascota en batalla, contraataque del boss, animación de victoria GSAP, deadline a 3 ciclos. Integración
de 104 assets de arte local (armas, personajes, fondos, mascotas), salas del dungeon con arte nuevo,
muebles de Sala Personal, mapa del mundo. Inventario: vault tipo Diablo con entrada GSAP, grid de
alimento/huevos, filtro de qty=0. Fixes: `level_history` no necesita `JSON.parse` (ya es jsonb),
boss cards no se comprimen, fondos de mascota.

**v181 (hoy, 2026-06-30)** — Sets de Clases Secretas (`secret_sets.js`, ver sección dedicada arriba) +
fix de racha que se reseteaba si la app quedaba abierta toda la noche (`checkDailyStreak()` ahora
también corre al inicio de `completeQuest()`, no solo al boot).

---

## Sets de Clases Secretas (late-game, implementado 2026-06-30)
- **Archivo:** `js/secret_sets.js` — requiere nivel 40, las 6 clases secretas ya deben estar desbloqueadas
  (ver `SECRET_CLASS_DEFS` en `config.js`)
- **Materiales** (`SECRET_MATERIAL_DEFS` en config.js) — 1 por clase, dropean en `trySecretMatDrop(q)`
  llamado desde `quests.js completeQuest()`:
  - Crononauta 8% en misiones 00–04h · Paladín 12% en misiones salud Épico+ · Nigromante 1 garantizado
    al morir (`addHP` en hero.js) + 2% en Legendario/Mítico · Titán 8% al derrotar boss alta rareza
    (`rpg.js damageBoss()`) · Druida 20% primera misión post-medianoche (1/día) · Estrella Caída 5 fijas
    (1 por clase desbloqueada, `hero.js checkSecretClassUnlocks()`) + 3% farmeable con las 5 clases
- **Piezas** (`SECRET_SET_PIECES`) — guantes/botas/grebas/casco/pecho/arma, costo creciente de
  material+oro+tiempo de forja (24h–120h)
- **Cola de forja:** `hero.forge_queue` (jsonb), máx 3 piezas simultáneas, se recogen en boot vía
  `checkSecretForgeQueue()` (llamado desde `main.js bootApp()`)
- **Hitos:** `SECRET_SET_MILESTONES` — 25/50/75% de materiales acumulados otorgan XP/oro
- **Bono de set completo:** `SECRET_SET_BONUSES` — texto descriptivo, `isSecretSetComplete(classKey)`
  determina si está activo. **Implementado 2026-06-30** para 4 de las 6 clases (las que mapeaban a
  mecánica existente):
  - **Crononauta** → `events.js checkOverdueHP()` salta la penalización de HP si el set está completo
  - **Nigromante** → `hero.js addHP()` revive automático a 25% HP máx, 1×/semana (cooldown en
    `secret_progress.nigromante_revive_at`)
  - **Titán** → `secret_sets.js _checkSecretSetComplete()` aplica +20% a `hero.hp_max` una sola vez
    (flag `secret_progress.titan_hp_bonus_applied`), igual al patrón de boost permanente de
    `character.js assignAttrPoint()`
  - **Estrella Caída** → +10% en `hero.js classXPBonus()` (todo XP) y `shop.js addGold()` (todo oro)
  - **Paladín y Druida quedaron sin implementar** — sus bonos ("+1 cura gratis/día", "mascotas sin
    hambre 48h") dependen de mecánicas que **no existen en el código**: no hay sistema de "usos
    gratuitos por día" para hechizos (el Escudo Arcano se paga con maná, sin límite diario), ni
    sistema de hambre/decay para mascotas (solo XP de alimento para subir nivel). Construir esas
    mecánicas desde cero es scope nuevo, no "conectar bono a sistema existente" — pendiente decisión
    de Gerardo: ¿construir las mecánicas base, o reescribir esos 2 bonos a algo que sí exista?
- **UI:** `_renderSecretSmithy()` se inserta al final de `renderSmithy()` en weapons.js

---

## Funciones globales reservadas (NO redefinir)
- `updateBossBanner()` — solo en views.js
- `renderMovimientos()` — nombre reservado globalmente
- `_fechaLocal` — nombre reservado globalmente

---

## Features permanentemente excluidas
- Virtual scroll, re-render optimization, build step, SVG icons inline
- Supabase Realtime, sistema de Campaña, PWA widget, multiplayer
- Kanban (removido v39), Google Calendar (removido v39)
- Precio por cantidad, modo kiosco (son de Maneki POS)
- Dark mode automático por hora, favoritos, frecuencia de compra
- Alertas de riesgo, cupones, tags de pedidos, timeline, plantillas automáticas

---

## Backlog (no implementar sin confirmar con Gerardo)

> **2026-06-30:** auditoría completa del backlog contra el código real. De los 7 ítems que decía este
> documento, **5 ya estaban implementados** (crafteo con cooldown, maná funcional, equipamiento con
> stats reales, eventos estacionales, y los del plan de 12 features de la sección anterior). Solo
> quedan 2 genuinamente pendientes. **Antes de retomar cualquier ítem futuro, grep primero** —
> el código avanza en sesiones que no siempre quedan documentadas aquí.

### Confirmado ya implementado (removido del backlog 2026-06-30)
- ~~Crafteo con cooldown real~~ → `weapons.js addWeapon(key,tier,readyAt)` + `isForging(w)`, 24h legendario / 3 días mítico
- ~~Habilidades de Clase con Maná~~ → `spells.js SPELL_DEFS[].mana` + `castSpell()` valida `curMana >= s.mana`
- ~~Equipamiento con Stats Funcionales~~ → `config.js ARMOR_DEFS[].statKey/statBase` (hpMax/xpBonus/goldBonus reales por tier)
- ~~Eventos Estacionales~~ → `rpg.js` + `config.js` banner y bonus XP por temporada/festividad

### Pendiente real
- **Tienda mejorada** — consumibles con efectos reales, más variedad (no confirmado si ya se amplió desde v40)
- **Facciones del Dungeon** — gremios con reputación propia, misiones exclusivas
- **Avatar Visual con Capas** — composición de sprites

### Esperando arte de Gerardo
- Sala Personal del Héroe
- Jardín de Mascotas
- **Sets de Clases Secretas** — sistema completo (ver sección abajo), solo faltan los iconos:
  - 6 materiales: `secret_mat_crononauta.png`, `secret_mat_paladin.png`, `secret_mat_nigromante.png`,
    `secret_mat_titan.png`, `secret_mat_druida.png`, `secret_mat_estrella.png`
  - 36 piezas de armadura/arma (6 clases × 6 piezas): `secret_[clase]_[guantes|botas|grebas|casco|pecho|arma].png`
  - Mientras no exista el arte, la UI usa emojis como placeholder (no bloquea el sistema)
- **Quitar fondo a iconos generados** — todo el arte de UI/equipo/mascotas/monturas/sets secretos/ruleta/
  banners/mapa está listo, solo falta remover el fondo blanco/color de cada imagen

---

## Deploy
```bash
# UN SOLO COMANDO — hace todo: bump SW, verificar ASSETS, commit, push y Coolify redeploy
bash deploy.sh "tipo: descripción"
```
- `deploy.sh` requiere la variable de entorno `COOLIFY_DUNGEON_TOKEN`
- Si falta el token, solo hace git push (Coolify auto-deploy puede tardar más)
- **NUNCA usar** `git push` directo sin pasar por deploy.sh — no bumpea el SW

## Supabase migrations
```javascript
// Siempre usar apply_migration para DDL:
mcp__11567dee...__apply_migration({
  project_id: 'stdedxhxxoyostymldqn',
  name: 'nombre_snake_case',
  query: 'ALTER TABLE dungeon_heroes ADD COLUMN IF NOT EXISTS ...'
})
```

## Seguridad — auditoría 2026-06-30
- **RLS:** `public.dungeon_heroes/quests/pomodoros` (las tablas reales que usa la app) tienen política
  `require_auth`: `auth.role() = 'authenticated'`. Correcto para app single-user.
- **XSS:** auditado — `escHtml()` aplicado consistentemente en nombres de misión y `toast()` escapa
  el mensaje completo antes de insertar en `innerHTML`. Sin vectores encontrados.
- **Limpieza:** se eliminó un schema huérfano `dungeon.*` (distinto de `public.dungeon_*`, sin usar por
  la app — `db.js` solo consulta `public`) con 3 tablas (`heroes`, `quests`, `pomodoros`) que tenían
  políticas RLS completamente abiertas (`USING(true)`). Confirmado con Gerardo antes de `DROP TABLE`.
- Otros advisories de Supabase (tablas `faqs`, `leads`, `posts`, `bestiary`, etc.) pertenecen a otros
  proyectos que comparten el mismo Supabase Aglaya — no son de Dungeon.
