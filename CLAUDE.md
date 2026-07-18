# LEAD ARCHITECT - GERARDO AI EMPIRE

> Rule: Talk tight caveman. Same technical accuracy. Brain big, mouth small.

## 1. CORE OPERATING PRINCIPLES

- **No Slop:** Prose dense, direct, human. Target >35/50 score.
- **TDD:** Coding task â†’ `/tdd`. Write failing test first.
- **Domain Context:** Before big task â†’ `/grill-with-docs`. Jargon changes â†’ update `CONTEXT.md` in root.
- **YAGNI:** Default `/ponytail`. No over-engineer.
- **Obsidian Sync:** Synced vault = truth. Query obsidian-cli if task blind.

## 2. SKILL ROUTING (1800+ arsenal)

Run `/ask-matt` or `/ponytail-help` to resolve path.

| Need | Skill |
|------|-------|
| Web scraper / ingestion | `firecrawl-scraper` |
| Brand / visuals | `ckm-brand`, `impeccable`, Meigen.ai |
| Bugs | `systematic-debugging` |
| Ads / marketing | `marketingagentskills`, `claude-ads` |
| Code graph | Codebase MCP + `graphify` |
| Knowledge docs | NotebookLM Skill |

## 3. CAVEMAN ACTIVATION

- **Always-on:** Mode `full` or `ultra`. Turn on via `/caveman` or "talk like caveman".
- **Git:** Commits via `/caveman-commit` (Subject â‰¤50 char, why > what).
- **PR Review:** `/caveman-review` (One-line comment: line, bug, fix).
- **Memory Sync:** `/caveman-compress` on project files to save input tokens.
- **Delegation:** Use `cavecrew` / `/cavecrew` subagents. Output caveman-compressed.

## 4. SECURITY & ENVIRONMENT

- **Sec:** Run Anthropic-Cybersecurity-Skills only in local/sandbox path. No external targets.
- **Env:** Local-first. Ollama (`qwen2.5-coder`, `deepseek-r1`) + local MCPs + Claude API fallback.
- **Keys:** Local `.env` only. Never output keys to stdout/logs.

## 5. QUALITY GATES (Pre-merge)

- Accessibility â†’ `/fixing-accessibility`
- Design check â†’ `/impeccable`
- Performance check â†’ `/ponytail-gain`
- Humanize client logs â†’ `/humanizer`

> Doubt? Stop. Ask: "Plan A or Plan B?"

---
# Arcanum Dungeon Productivity — CLAUDE.md
> Última actualización: 2026-07-03 · SW cache: `dungeon-v191`

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
mechanics.js → character.js → weather.js → dungeon_clock.js →
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
| `state.js` | Variables globales | `db`, `hero`, `quests`, `pomodoros`, `timer`, `goals`, `bulkMode`, `xpMultiplier` |
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
| `integrations` | Fit + Duolingo |
| `dungeon-grows` | Mapa dungeon |
| `character` | Character Hub (5 tabs) |
| `zones` | Zonas del dungeon |
| `worldmap` | Mapa del mundo |

**Eliminadas:** `kanban` (v39), `calendar` (v39)

---

## Tablas Supabase (proyecto propio, ver traspaso 2026-07-12 abajo)

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
- Versión actual: `dungeon-v187`
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

## Rebalance de mascotas y bosses (2026-07-03, reportado por Gerardo)

**Curva de nivel de montura (1-50) — antes 3 escalones planos (100/200/400 XP), ahora progresiva:**
`_petXPForNextLevel(level) = round(80 + 12 × level^1.5)` en pets.js — ~85,000 XP acumulada total para
llegar a nivel 50, moderado comparado a la curva real de Pokémon (que llega a cientos de miles), pero
ya no es plana. La etapa bebé (Nv.1-15, `PET_BABY_XP_PER_LEVEL=150`) se dejó igual — es un arco corto
antes de evolucionar, no hacía falta curva.

**Bug arreglado: mascota se curaba sola al reentrar a `boss_battle.js`.**
Antes `_bbPetHp`/`_bbPetMaxHp` eran variables locales que se reseteaban a HP completo cada vez que se
llamaba `openBossBattle()` — o sea, "derrotada" no tenía ninguna consecuencia real más allá de cerrar
la pantalla. Ahora: al caer en batalla, la mascota queda **agotada** (`pet.exhausted_until` en DB,
columna nueva en `dungeon_pets`) por 2-8h según la rareza del jefe (`_BB_EXHAUST_HOURS` en
boss_battle.js). Mientras está agotada: no se puede seleccionar para pelear (chip atenuado con 😴,
`openBossBattle()` la excluye de la auto-selección), y se puede despertar antes de tiempo con una
poción de esa especie (`wakePetWithPotion()` en pets.js, botón en la tarjeta de Mascotas). Helper
compartido `isPetResting(pet)` en pets.js, usado también por boss_battle.js.

**Boss ahora también escala en HP, no solo en daño, con el nivel del héroe.**
`getMultiBossState()` en rpg.js: `boss.maxHp = BOSS_CYCLE_HP[rareza] × (1 + (nivel_héroe-1) × 0.03)` —
antes solo el daño del contraataque (`_bbBossDmg()`) escalaba con nivel; el HP era fijo por rareza.
Ahora un héroe de nivel 50 enfrenta bosses con ~2.47× el HP base de esa rareza.

## Profundidad de combate estilo Pokémon (2026-07-06)

Análisis pedido por Gerardo contra un documento de referencia de mecánicas Pokémon — 6 features
agregadas (las que decía "FALTA" + la parcial), todo en `boss_battle.js`/`pets.js` salvo lo indicado:

1. **Golpes críticos** — `_bbApplyVariance(dmg)` rueda ~8% (mascota) / `_bbBossDmg()` ~5% (jefe),
   ×1.5 daño, flag `_bbLastCrit` leído justo después para el toast "¡Golpe Crítico!". Solo se aplica
   al golpe real, nunca en el preview determinístico `_bbCalcDmg()`.
2. **Stat stages (±6 estilo Pokémon)** — `_bbPetAtkStage`/`_bbPetDefStage`, multiplicador
   `_bbStageMult(n)` = `(2+n)/2` si n≥0 o `2/(2-n)` si n<0. El jefe tiene 15% de chance de debilitar
   ATK o DEF de la mascota en cada contraataque (`_bbBossCounterAttack()`); el movimiento "Especial"
   (tier definitivo, power 4.0) también sube el ATK propio +1 etapa al usarse. Se resetea en
   `openBossBattle()`/`_bbPickPet()` — solo dura la batalla, no persiste en DB.
3. **Estados alterados** — `_bbPetStatus` (`null`/`'quemado'`/`'paralizado'`), infligido por el jefe
   según su elemento (`Fuego`→quemado, `Eléctrico`→parálisis, 25% chance por contraataque, solo si no
   hay estado ya activo). Quemado: -25% daño de la mascota (`_bbCalcDmg`) + DoT 6% HP máx por turno.
   Parálisis: 25% chance de fallar el turno por completo (`executeBattleAttack`). Local a la batalla,
   sin persistencia en DB.
4. **Mascotas shiny** — columna `is_shiny` (boolean) en `dungeon_pets` (migración pendiente de aplicar
   si el MCP de Supabase estuvo caído). ~2% chance en `hatchEgg()`. Puramente cosmético — badge ✨ +
   glow dorado vía CSS (`pet-card-shiny`, `pet-rpanel-shiny`), sin arte alternativo.
5. **PP por movimiento** — antes solo existía el contador global diario (`_bbLeft`/`_bbUse`, 5 ataques
   por jefe). Ahora cada movimiento también tiene su propio límite vía localStorage
   (`_bbMovePPKey`/`_bbMovePPLeft`/`_bbUseMovePP`), escalado por poder: Especial (power≥4)=2 usos,
   power≥2.5=3, power≥1.5=5, básico=8. Mostrado como "PP x/y" en cada botón de movimiento.
6. **Curvas de XP por rareza de mascota** — `_petXPForNextLevel(level, def)` en pets.js ahora recibe
   la definición de la mascota y aplica `_PET_RARITY_XP_MULT` (común=1× ... cataclismo=2.8×). Mascotas
   más raras piden más XP por nivel que las comunes, en vez de la misma curva universal.

**Explícitamente NO agregado** (evaluado y descartado en el análisis): sistema de IVs/EVs genético
(demasiado complejo sin payoff para una app de productividad), objetos equipables en mascotas,
batallas dobles, mega-evolución — no sirven el propósito del proyecto.

## Auditoría de cobertura de arte (2026-07-08)

Pedido por Gerardo: "aun faltan mucho arte para no utilizar iconos genericos". Auditoría completa
confirmó que la cobertura de arte ya es alta (~395 assets); los huecos reales eran 3 bugs de código
(arte ya entregado pero nunca se mostraba) + wiring faltante, no arte nuevo pendiente en su mayoría.

**Bugs arreglados (arte ya existía, código pedía extensión equivocada):**
- `js/spells.js` — pedía `spell_X.png`, el archivo real es `.webp`. Afectaba las 12 orbes de hechizo.
- `js/weapons.js` (líneas 110 y 282, inventario + fragua) — mismo bug con `arma_X_Y.png` vs `.webp`.
  Afectaba las 50 combinaciones de arma/armadura.

**Wiring agregado (arte ya existía, nunca se conectó a la UI):**
- Clima (`clima_*.webp`, 5 archivos) y estaciones (`estacion_*.webp`, 4 archivos) — la franja de
  "efectos activos" (`_collectActiveEffects()`/`renderEffectsBar()`/`openEffectsModal()` en
  `views.js`) solo mostraba el emoji del `WEATHER_TYPES`/`SEASONAL_EVENTS`, ignorando el campo `img`
  que ya apuntaba a arte real. Ahora usa `<img>` con fallback a emoji vía `onerror`.

## Traspaso a proyecto Supabase propio (2026-07-12)

Dungeon estaba en `stdedxhxxoyostymldqn` (proyecto "Aglaya Marketing"). Gerardo empezó a reutilizar
ese mismo proyecto para Aglaya Marketing y quería aislar Dungeon — no por choque real de nombres de
tabla (Postgres namespacea por tabla, no por proyecto, y `dungeon_*` ya tenía prefijo propio), sino
para separar blast radius, facturación y ruido de logs/advisors. Creó cuenta Supabase nueva (otro
correo) para no gastar el segundo proyecto free de su cuenta principal (ya tiene Maneki + Aglaya ahí).

**Proyecto nuevo:** `xibmopqlgjbcypxixnri.supabase.co` (org "Arcanum Dungeon", plan Free, región
ca-central-1). `js/config.js` (`SUPA_URL`, `SUPA_KEY`, `CDN`) apunta ahí desde v194.

**Qué se migró (sin downtime, DB viejo se dejó intacto como respaldo):**
- **9 tablas `dungeon_*`** — schema recreado a mano vía `information_schema` (columnas exactas,
  tipos, defaults) + RLS idéntica (`require_auth` policy, `auth.role() = 'authenticated'`), datos
  copiados fila por fila (heroes, quests, pomodoros, inventory, pets, weapons, runes, goals,
  push_subscriptions) vía script Node (`pg` client + `execute_sql` del MCP para leer el origen).
  Verificado conteo de filas idéntico al viejo tras la carga.
- **Storage bucket `assets/dungeon/*`** — 270 archivos, ~452MB (arte legacy `.png`, fallback CDN de
  `onerror` en las imágenes; el catálogo real vive en `images/*.webp` local, esto es solo respaldo).
  Migrado descargando cada archivo del bucket público viejo y subiéndolo al nuevo vía Storage REST
  API con `service_role` key.
- **3 Edge Functions** (`send-push`, `google-oauth`, `duolingo-proxy`) — código fuente extraído del
  proyecto viejo y redesplegado al nuevo vía `supabase functions deploy` (Supabase CLI + personal
  access token de la cuenta nueva, sin Docker corriendo — el CLI lo permite igual).

**No migrado (fuera de scope, viven en el proyecto Aglaya y no son de Dungeon):** las otras 29 tablas
del proyecto viejo (`aglaya_*`, `blog_*`, `portfolio`, etc.) — esas se quedan donde están.

**Arte real aún pendiente (confirmado, no es bug):**
- 6 materiales de clase secreta: `secret_mat_crononauta/paladin/nigromante/titan/druida/estrella.webp`
- Cosméticos menores sin arte scoped: Árbol de Maestría (6 nodos), Mejoras de Oro en tienda (4),
  Skills de héroe en combate (6). Árbol de Habilidades (30 nodos) tiene arte fuente fuera del repo
  (`F:\Dungeon\ARBOL DE HABILIDADES`, 11 archivos SVG) pendiente de sesión de integración/QA visual
  dedicada — no es un simple drop de archivos.
- 14 logros menores/ocultos y 32 iconos de movimiento de combate (Zarpazo, Mordida, etc.) — badges
  chicos de UI, se evaluó dejarlos en emoji permanentemente (bajo impacto visual).

**Ataque de mascota que escala con su propio nivel — ya existía, confirmado funcionando.**
`getPetStatAtLevel()` ya aplicaba `stat_gain.atk` por nivel, y `_bbCalcDmg()` ya multiplicaba por
`petSt.atk`. No hizo falta cambio — el pedido de Gerardo ya estaba resuelto, solo no era visible
por el bug de HP-reset de arriba (con la mascota siempre a full HP, el efecto del nivel en el ATK
pasaba desapercibido frente al daño del jefe).

## Rebalance de combate y progresión (2026-06-30, sesión posterior a v186)

**⚠️ Curva de nivel reescrita — causa salto retroactivo de nivel visible.**
La curva anterior (`LEVEL_BASE=100 * LEVEL_SCALE=1.5^n` compuesto) era matemáticamente rota: nivel 50
requería ~12,700 millones de XP acumulada, inalcanzable en la práctica. Reemplazada por
`LEVEL_FLOOR=50, LEVEL_QUAD=2` → `xpForLevel(n) = Σ(50 + 2×i²)`, apuntando a ~6-9 meses de juego activo
para llegar a nivel 50 (cumulative ~83,300 XP total). **Consecuencia real:** con la data de Mordred al
momento del cambio (nivel 11, 12,910 XP total), la nueva curva lo recalcula a **nivel 26** en el
siguiente render (recompensa retroactiva por XP ya ganada bajo una curva que estaba injustamente
inflada, no es un bug). `xpForLevel()` en hero.js, constantes en config.js.

**Nivel de boss + daño Pokémon-style (`boss_battle.js`):**
- `_bbBossLevel()` = nivel actual del héroe — el jefe escala contigo, nunca se vuelve trivial. Mostrado
  como chip "Nv.X" junto al nombre del jefe en `_bbRender()`
- `_bbBossDmg()` reescrita: `levelTerm=(2×nivelBoss/5+2) × multiplicador_rareza × 1.2`, con
  **variación aleatoria real 0.85–1.15 por golpe** (antes era 100% determinístico y se clavaba en el
  piso de 1 de daño para bosses comunes/raros sin importar nada)
- El ataque de la mascota (`_bbCalcDmg`) sigue siendo determinístico (así el preview en los botones no
  parpadea), pero la variación se aplica al momento real de golpear vía `_bbApplyVariance(dmg)` — tanto
  en `executeBattleAttack()` como en `useHeroBattleSkill()`

**Pociones de mascota usables en batalla:**
- Las pociones (`pet_potion_<key>`) ya existían como moneda para eclosionar huevos y evolucionar — no
  se creó un ítem nuevo, se les dio un segundo uso. Botón "🧪 Poción de [Mascota]" en el panel de
  batalla, cura 40% del HP máx, con `confirm()` explícito advirtiendo que consume la misma poción que
  necesitas para evolucionar (deliberado — es un trade-off real, no un descuido)
- `useBattlePotion()` en boss_battle.js — consume turno (dispara contraataque del boss después)
- Contraataque del boss extraído a `_bbBossCounterAttack()` reusable (antes duplicado)
- **Fix v188:** el botón de poción usaba emoji 🧪 genérico; corregido a `images/pet_pocion_[pet_key].png`
  (arte que ya existía en las 7 especies, solo estaba mal conectado — ver sección "Esperando arte de
  Gerardo" para el inventario completo de qué otros iconos de esta sesión siguen en emoji)

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
  - **Paladín — implementado 2026-06-30**: en vez de construir un sistema de "usos gratis por día"
    desde cero, se agregó un flag con fecha (`secret_progress.paladin_free_heal_date`, mismo patrón
    que Nigromante/Druida). `spells.js castSpell()` detecta `_paladinFreeHealAvailable()` y permite
    castear Escudo Arcano (`id:'shield'`) una vez al día sin gastar fragmentos ni maná; UI en
    `renderSpells()` muestra "✝️ Gratis" en el orbe cuando está disponible
  - **Druida — implementado 2026-06-30**: el bono original pedía "mascotas sin hambre" pero esa
    mecánica (decay/hambre) no existe ni se justificaba construirla solo para esto. Se reescribió a
    **"tu mascota no puede caer en batalla durante 48h tras equipar el set"** — reutiliza el check
    `_bbPetHp <= 0` que ya existía en `boss_battle.js`. Temporizador en
    `secret_progress.druida_protection_until` (Date.now()+48h), verificado por
    `isDruidaProtectionActive()` (secret_sets.js) y aplicado en `_bbBossCounterAttack()` (HP nunca
    baja de 1 mientras esté activo)
  - **Las 6 clases tienen su bono de set completo conectado a mecánica real.**
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
- Kanban (removido v39), Google Calendar (removido v39), Spotify (removido v189 — Gerardo nunca lo usó)
- Precio por cantidad, modo kiosco (son de Maneki POS)
- Dark mode automático por hora, favoritos, frecuencia de compra
- Alertas de riesgo, cupones, tags de pedidos, timeline, plantillas automáticas

---

## Misiones aleatorias de Zona (v206, 2026-07-18)

Gerardo vio el Mapa del Mundo (6 zonas: Ciudadela/Campo de Batalla/Torre del Saber/Fortaleza/Jardín
Arcano/Cripta — que resultan ser exactamente las mismas 6 `ZONES` de `zones.js`, ya existentes) y
pidió que aparezcan periódicamente misiones aleatorias ligadas a cada una, con tareas de provecho real.

- **`ZONE_QUEST_TEMPLATES`** en `zones.js` — pool de 3 misiones concretas y accionables por zona,
  con el `type`/`tags` exacto que exige el `match()` de esa zona (para que al completarlas sumen
  reputación de zona automáticamente, sin sistema paralelo):
  - Ciudadela (`main`): avanzar proyecto importante, terminar algo pospuesto, meta semanal
  - Campo de Batalla (`side`): pendientes administrativos, bandeja de entrada, mensajes
  - Torre del Saber (`side` + tag `#lectura`/`#curso`/`#aprender`): leer, curso, aprender algo nuevo
  - Fortaleza (`side` + tag `#ejercicio`/`#correr`/`#salud`): ejercicio, caminar/correr, salud básica
  - Jardín Arcano (`habit` positivo): agua, dormir temprano, meditar
  - Cripta (`habit` negativo, tag `habit-`): evitar redes antes de dormir, no procrastinar, evitar snacks
- **`checkZoneRandomQuest()`** — 1×/día, elige zona y plantilla al azar, crea la quest real vía
  `db.insert` directo (mismo patrón que `checkDailySpecialQuest()`). Dedup por localStorage
  (`dungeon-zone-quest-YYYY-MM-DD`), sin columna nueva en `hero` — no requirió migración.
  Llamado desde `main.js bootApp()` junto a `checkDailySpecialQuest()`.

## Facciones del Dungeon (v204, 2026-07-18) — pendiente: migración manual

Nueva feature `js/factions.js` + `FACTION_DEFS` en config.js. 4 gremios con identidad propia, uno por
tipo de misión (main/side/daily/weekly), cada uno con 3 rangos por XP acumulado all-time de ese tipo,
y una misión exclusiva reclamable una sola vez al llegar al rango máximo (crea una quest real en
`dungeon_quests` con recompensa XP/oro fija, marca `hero.faction_claims` para evitar reclamo doble).

**✅ Migración aplicada 2026-07-18** — `ALTER TABLE dungeon_heroes ADD COLUMN IF NOT EXISTS
faction_claims jsonb DEFAULT '[]'::jsonb;`, corrida vía SQL Editor con la sesión de Gerardo ya
logueada en Chrome (el MCP de Supabase conectado no alcanza esta cuenta separada, ver traspaso
2026-07-12).

**Fix 2026-07-18 (post-feedback):** la primera versión creaba 1 sola misión con nombre vago
("Contrato del Gremio: encargo dorado") sin pasos concretos — Gerardo probó y no sabía qué tenía
que hacer exactamente. Rediseñado: `FACTION_DEFS[].exclusive` ahora es `{ steps:[3 nombres
concretos], xp, gold }` en vez de `{ name, xp, gold }`. `claimFactionExclusive()` crea las 3 quests
reales de una vez (tipo del gremio, tag `#faccion`). `hero.faction_claims` pasó de array de strings
a array de objetos `{ id, questIds:[...], done }` para trackear cuáles 3 IDs pertenecen a qué serie.
Nuevo hook `checkFactionExclusiveProgress(questId)` llamado desde `quests.js completeQuest()` (junto
a `trySecretMatDrop`) — cuando las 3 quests de una serie están `done`, entrega el bono XP/oro
automático una sola vez. Botón cambia de estado: Reclamar → "⏳ Serie en progreso" → "✅ Completada".

**Nota de diseño:** ya existía `reputation.js` (reputación por tag libre `#trabajo`/`#salud`, +10% XP
al pasar 500 XP). Se evaluó reusarlo pero Gerardo pidió identidad propia (nombre/icono/UI dedicada),
no solo un reskin — por eso Facciones es un sistema separado, basado en `quest.type` (garantizado
siempre presente) en vez de tags opcionales que dependen de que Gerardo los use.

Vista nueva `factions` — sidebar, tabs desktop, mobile-more-sheet, todos siguiendo el patrón exacto
de Zonas del Dungeon. CSS al final de dungeon.css (`.faction-*`).

## Oráculo IA eliminado + funciones dependientes de OpenClaw pasadas a cálculo local (v203, 2026-07-18)

Gerardo eliminó el bot OpenClaw para siempre (segunda vez que se anuncia, ver también nota de
2026-07-08 sobre Hermes). Todo lo que dependía de `fetch('/openclaw/send')` o `/openclaw/history`
fallaba en silencio ("No se pudo conectar con el oráculo"). Se eliminó/reemplazó todo:
- **`js/oracle.js` borrado por completo** — chat del Oráculo, botón, panel, prompts rápidos, todo
  el HTML/CSS asociado (`.oracle-*`), entrada en `sw.js` ASSETS y `<script>` en index.html.
- **`checkWeeklyRetro()`/`showWeeklyRetro()`/`checkDeadlineAlerts()`** (vivían en oracle.js pero NO
  dependían de IA, solo stats reales) se movieron a `events.js` para no perderlas.
- **Diario del Héroe** (`generateDiaryEntryAI` en rpg.js) — ya tenía fallback local
  (`generateDiaryEntry()`, plantillas con datos reales). Se quitó el intento de fetch muerto,
  ahora usa directo el fallback local, sin llamada de red inútil.
- **Profecía semanal + veredicto** (`_evaluateProphecy` en rpg.js) — el texto de la profecía en sí
  ya era local (templates + misiones reales embebidas). El veredicto de fin de semana pedía a IA
  evaluar si se cumplió; ahora se calcula localmente comparando `missionIds` de la profecía contra
  cuáles quedaron `done` (Cumplida ≥100%, Parcial ≥50%, Incumplida <50%).
- **Análisis de Patrones** (`generatePatternAnalysis` en patterns.js) y **Reporte Mensual**
  (`generateMonthlyReport`) — no tenían fallback, mostraban "no se pudo generar" para siempre.
  Reescritos para computar localmente (día más productivo, tipo de misión predominante, hora pico
  de pomodoros, racha, logros del mes) en vez de mandar prompt a IA externa.
- **Nota:** `renderOraculo()` en views.js (la card "🔮 El Oráculo Habla" con frases de sabor según
  racha/nivel) NO se tocó — es texto local hardcodeado, nunca dependió de OpenClaw.

## Habilidad de clase, slots de equipo y avatar en capas lite (v201, 2026-07-18)

- **Botón de habilidad de clase reactivado.** `renderClassSkillBtn()` (rpg.js) ya tenía toda la lógica
  de `useClassSkill()` conectada en dos call sites — el botón solo estaba `display:none` fijo en
  index.html ("kept hidden for JS compatibility"). Ahora muestra icono (`images/habilidad_[clase].webp`
  con fallback emoji), nombre y maná actual/costo. Deshabilitado si no alcanza el maná.
- **Slots de equipo vacíos con arte.** `_chrEqRowHtml()`/`_chrArmorRowHtml()` (character.js, las
  funciones REALMENTE usadas por `renderCharacterSheet()`) ahora muestran `images/slot_*.webp` de
  fondo cuando el slot está vacío, en vez de solo emoji. Se eliminó el código muerto duplicado
  `_cspWeaponSlotHtml()`/`_cspArmorSlotHtml()` que nunca se llamaba desde ningún lado.
- **Avatar Visual con Capas — versión lite implementada.** El catálogo de arte solo tiene retratos
  flat (`char_[clase]_[raza].webp`), no piezas de sprite separables — layering real requeriría arte
  nuevo. Se implementó la alternativa pragmática: `_chrPortraitBadgesHtml()` superpone 2 badges (arma
  principal equipada + mejor pieza de armadura por tier) como iconos pequeños en las esquinas
  inferiores del retrato en el character sheet, usando el arte de armas/armaduras que ya existe.
- **Revisión de tienda:** confirmado que ya tiene 9 consumibles con efectos reales distintos (todos
  verificados wireados: `potion_exp`, `amulet`, `xpstone`, `revival`, `hp_minor`, `gold_rush_exp`
  usado en `quests.js addXP()`, `boss_shield` usado en `rpg.js checkBossDeadline()`, `xp_scroll_sm`).
  El ítem de backlog "tienda mejorada" ya estaba resuelto en una sesión anterior no documentada aquí.

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

### Arte integrado 2026-07-03 — sesión grande (~390 assets, todo convertido a WebP)
Gerardo generó y subió el lote completo de arte pendiente en `F:\Dungeon\` (carpetas por categoría,
ver `dungeon_prompts.html` en Downloads para los prompts usados). Se integró todo en una sola sesión:

**Convertido TODO el catálogo a WebP** (existente + nuevo): 634MB → 60MB (~90% reducción) usando
`sharp` (instalado ad-hoc en scratchpad, no es dependencia del proyecto). Los `.png` viejos quedaron
respaldados en `images_png_backup/` (no se sube a producción, solo por si acaso). **Todas las
referencias de código** (`images/*.png` → `.webp`) actualizadas vía regex — incluyendo `config.js`
`SHOP_ITEMS[].img` que casi se queda fuera del reemplazo inicial (46 referencias, revisado y corregido).

**Ya conectado a código (funcional, no solo archivo copiado):**
- ✅ **36 piezas de armadura de clases secretas** (`secret_[clase]_[pieza].webp`) — el pendiente más
  grande, resuelto. `_renderSecretSmithy()` en secret_sets.js ahora muestra `<img>` con fallback emoji.
  **Aún faltan los 6 materiales** (`secret_mat_*`) — no vinieron en este lote.
- ✅ Nav lateral (16), toolbar/dock (6), atributos (5), clases (6), razas (4) — index.html + character.js
- ✅ 27 de 34 logros (`ACHIEVEMENT_DEFS[].img`) — spells.js `renderAchievements()`
- ✅ Clima (5), eventos aleatorios (10, con modal `#eventIconImg`), estaciones (4, en efx-chip sin imagen
  por ahora) — config.js + rpg.js
- ✅ Zonas del Dungeon / mapa del mundo (6) — resulta que `world_map.js` ya esperaba `map_${id}.webp`
  desde antes; zones.js ahora usa el mismo naming en vez de duplicar con `zona_*`
- ✅ **Sala Personal completa** (10 muebles + fondo) — sistema que llevaba meses esperando arte
  (`SALA_FURNITURE[].img`, `.sala-room` background en dungeon.css)
- ✅ **Sistema de fondos de vista** (15 fondos: misiones/metas/stats/logros/historial/tienda/inventario/
  mascotas/mi-dungeon/integraciones/personaje/habilidades/runas/bestiario/herrero) — otro sistema
  (`ui.js _setPageBg()`, `_VIEW_BG`, `_CTAB_BG`) que ya existía en código esperando archivos
- ✅ 30 retratos de personaje (`char_[clase]_[raza].webp` + 6 `char_secreto_*`) — views.js ya esperaba
  este naming exacto
- ✅ Refresco completo: 27 bosses, 12 banners de boss, 9 salas del dungeon, 35 assets de mascota
  (huevo/bebé/montura/poción/alimento × 7 especies) + 21 fondos de mascota, 16 runas, 12 hechizos,
  9 items consumibles — todos sobreescritos con las versiones nuevas usando el naming que el código
  ya esperaba

**Sin conectar (fuente disponible en `F:\Dungeon\ARBOL DE HABILIDADES\`, no copiado a `images/`):**
- **Árbol de habilidades** (11 archivos: nodo ofensivo/defensivo/arcano × bloqueado/disponible/
  desbloqueado + 2 líneas de conexión) — el árbol usa SVG dibujado a mano con coordenadas exactas
  (`viewBox 0 0 228 36`) para las líneas de conexión; reescribirlo sin poder verlo visualmente es
  demasiado riesgoso. Pendiente de una sesión dedicada con verificación visual.
- **Habilidades de clase** (6 `habilidad_*.webp`) — el botón de habilidad de clase (`#classSkillBtn`)
  está oculto en la UI actual ("kept hidden for JS compatibility"), no hay superficie visible donde
  conectarlos hasta que se reactive esa función.
- **Slots de equipo vacíos** (7 `slot_*.webp`) — `_cspWeaponSlotHtml()`/`_cspArmorSlotHtml()` en
  character.js existen pero no se llaman desde ningún lado (código muerto).

**Iconos que siguen en emoji** (bajo impacto, quedan como estaban):
marcos de avatar cosméticos (bordes CSS sin textura), elementos en el chip de combate, árbol de
maestría, mejoras permanentes de tienda — ninguno bloquea nada, es polish opcional.

### Pendiente real de arte
- 6 materiales de clases secretas (`secret_mat_crononauta/paladin/nigromante/titan/druida/estrella.png`)

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
