# Arcanum Dungeon Productivity — CLAUDE.md
> Última actualización: 2026-06-21 · SW cache: `dungeon-v145`

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
pets.js → weapons.js → goals.js → reputation.js → patterns.js → mechanics.js →
character.js → spotify.js → weather.js → dungeon_clock.js → skill_tree.js →
bestiary.js → dungeon_grows.js → runes.js → google_fit.js → hero_score.js →
push.js → combos.js → habits.js → ruleta.js → duolingo.js →
drops.js → daily_goal.js → weekly_summary.js → challenges.js → zones.js →
hero_card.js → world_map.js → sala_personal.js → pet_garden.js →
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
- Versión actual: `dungeon-v145`
- **Siempre bumpar** al modificar cualquier JS/CSS — lo hace `deploy.sh` automáticamente
- Estrategia: cache-first con skipWaiting + clients.claim

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

### Alta prioridad
- **Crafteo con cooldown real** — sistema existe, falta lógica de cooldown
- **Boss semanal con daño real** — boss existe en UI pero no aplica consecuencias reales
- **Notificaciones push para hábitos** — hora configurable por hábito
- **Tienda mejorada** — consumibles con efectos reales, más variedad

### Media prioridad
- **Habilidades de Clase con Maná** — sistema de maná nuevo
- **Equipamiento con Stats Funcionales** — armas/armaduras con efectos reales
- **Retos de 30 Días** — series de misiones encadenadas con progreso
- **Prestige system** — nivel 50 → reset con bonus permanente

### Baja prioridad / largo plazo
- **Facciones del Dungeon** — gremios con reputación propia, misiones exclusivas
- **Avatar Visual con Capas** — composición de sprites
- **Eventos Estacionales**

### Esperando arte de Gerardo
- Sala Personal del Héroe
- Jardín de Mascotas
- Clases Secretas

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
