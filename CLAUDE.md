# Arcanum Dungeon Productivity — CLAUDE.md
> Última actualización: 2026-06-17 · SW cache: `dungeon-v67`

## Proyecto
- **URL:** https://dungeon.mordredgh.com
- **Repo:** Mordredgh/dungeon-productivity
- **Deploy:** Coolify (git push → auto-deploy, ~1 min)
- **Backend:** Supabase Aglaya (`stdedxhxxoyostymldqn.supabase.co`)
- **Stack:** Vanilla JS · Sin bundler · Sin framework · CSS custom properties

## Reglas críticas
- **NUNCA** mencionar Electron, SQLite, ipcRenderer
- **NUNCA** usar preview_* tools (es PWA web en Coolify, no hay servidor local)
- **Siempre** bumpar `sw.js` cache version al modificar JS/CSS
- **Siempre** hacer `git add -A && git commit && git push origin main` al terminar
- **Siempre** anotar cambios en `CHANGELOG.md`
- `saveHero({ campo })` para updates al héroe — nunca raw upsert
- Subtasks en markdown dentro de `quest.notes` — nunca tabla separada

---

## Orden de carga de scripts (index.html)
```
config.js → state.js → db.js → hero.js → quests.js → timer.js → inventory.js →
spells.js → views.js → ui.js → events.js → shop.js → familiar.js → rpg.js →
pets.js → weapons.js → goals.js → reputation.js → patterns.js → mechanics.js →
character.js → spotify.js → weather.js → dungeon_clock.js → skill_tree.js →
bestiary.js → dungeon_grows.js → runes.js → google_fit.js → hero_score.js →
push.js → combos.js → habits.js → ruleta.js → duolingo.js →
drops.js → daily_goal.js → weekly_summary.js → auth.js → main.js
```
Agregar archivos nuevos **ANTES de auth.js**.

---

## Mapa de archivos JS

### Núcleo
| Archivo | Propósito | Funciones clave |
|---------|-----------|----------------|
| `config.js` | Constantes globales | `SUPA_URL`, `SUPA_KEY`, `XP_TABLE`, `GOLD_TABLE`, `CLASS_SKILLS`, `SHOP_ITEMS`, `ACHIEVEMENT_DEFS`, `DROP_TABLE` |
| `state.js` | Variables globales | `db`, `hero`, `quests`, `pomodoros`, `timer`, `goals`, `bulkMode`, `spotifyAccessToken`, `xpMultiplier` |
| `db.js` | Supabase ops | `initDB()`, `loadHero()`, `loadQuests()`, `loadPomodoros()`, `savePom()`, `loadInventory()`, `loadPets()` |
| `hero.js` | Progresión héroe | `loadHero()`, `deriveHero()`, `saveHero()`, `addXP()`, `addHP()`, `calcLevel()`, `checkDailyStreak()`, `xpForLevel()` |
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
| `ui.js` | Modales y navegación | `openModal()`, `closeModal()`, `toast()`, `switchView()`, `switchCharTab()`, `openEditQuest()`, `toggleCompact()` |
| `events.js` | Manejadores de eventos | `resetDailyQuests()`, `checkMorningReview()`, `toggleNightmareMode()`, `renderNightmareModeBtn()`, `openQuickCreate()`, `parseQuickCreate()` |
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

### Integraciones
| Archivo | Propósito | Funciones clave |
|---------|-----------|----------------|
| `google_fit.js` | Pasos diarios | `connectGoogleFit()`, `syncGoogleFitSteps()`, `renderFitWidget()`, `disconnectGoogleFit()` |
| `duolingo.js` | Sync XP Duolingo | `syncDuolingo()`, `getDuoUsername()`, `setDuoUsername()`, `renderDuolingoWidget()` |
| `spotify.js` | Now Playing | `connectSpotify()`, `spotifyToggle()`, `renderSpotifyWidget()` |
| `weather.js` | Clima real | `loadRealWeather()`, `renderWeatherDetail()` |
| `push.js` | Web Push | `initPush()`, `dungeonPush(title, body, url?)`, `isPushSubscribed()` |
| `dungeon_clock.js` | Reloj + TOD bonuses | `getDungeonTOD()`, `getTODBonus()`, `updateDungeonClock()` |
| `dungeon_grows.js` | Mapa dungeon | `renderDungeonGrows()` |

---

## Vistas (data-view)
| View | Ruta | Descripción |
|------|------|-------------|
| `quests` | default | Lista de misiones |
| `stats` | Sala del Trono | Analytics + heatmap |
| `achievements` | — | Grid de logros |
| `history` | — | Historial completadas |
| `shop` | — | Tienda del gremio |
| `inventory` | — | Inventario |
| `pets` | — | Mascotas |
| `goals` | — | Metas largas |
| `integrations` | — | Fit + Duolingo + Spotify |
| `dungeon-grows` | — | Mapa dungeon |
| `character` | — | Character Hub (5 tabs) |
| `smithy` | — | Herrero (tab dentro de character) |

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
Integración:  fit_access_token, fit_refresh_token, fit_token_expiry, fit_sync_date, fit_xp_date
              duo_username, duo_sync_date, duo_xp_date, duo_today_xp, duo_streak
              cal_access_token, cal_refresh_token, cal_token_expiry
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
function animNuevaCosa(el) { gsap.to(el, {...}); }

// ✅ BIEN — se suma al namespace existente
Anim.nuevaCosa = function(el) { gsap.to(el, {...}); };

// Llamarlo desde otro archivo:
if (window.Anim?.nuevaCosa) Anim.nuevaCosa(el);
```
- `window.Anim` está definido en `js/animations.js` al final del archivo
- Los alias `animXxx()` existentes NO se borran — son backwards-compat
- Para módulos nuevos (no de animación): `window.NombreModulo = { fn1, fn2 }` al final del archivo, en IIFE si tiene privados

### CSS — zona de animaciones + prefijo `.anim-`
```css
/* ❌ MAL — añadir CSS de motion disperso en el archivo */
.mi-cosa { animation: fadeIn 0.3s; }

/* ✅ BIEN — ir al final de dungeon.css, en la ZONA DE ANIMACIONES */
.anim-mi-cosa { animation: _anim-miCosa 0.3s ease-out both; }
@keyframes _anim-miCosa { ... }
```
- Todo CSS nuevo de animación/transición va al **final de `dungeon.css`**, en la sección marcada
- Prefijo `.anim-` obligatorio para clases de animación
- Nuevas clases de componente usan BEM-lite: `.quest-item--completing`, `.boss-banner--urgent`
- **Sin `!important` en la zona de animaciones** — usar especificidad de selector

### Deploy
Siempre usar `bash deploy.sh "mensaje"` en lugar de los pasos manuales.
El script auto-bumpa SW version, todos los `?v=` en index.html, y verifica ASSETS.

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

### Patrones de código
- `openModal(id)` → agrega clase `open` al `.modal-overlay`
- `closeModal(id)` → remueve clase `open`
- `toast(icon, msg)` → notificación flotante 3s
- `escHtml(str)` → sanitizar output en templates HTML
- `switchView(v)` → cambia vista activa; si `v === 'oracle'` llama `openOracle()` y retorna
- `saveHero(patch)` → `db.from('dungeon_heroes').update(patch).eq('id', hero.id)` + actualiza `hero` local

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

## Mobile (≤600px)
- **Nav:** `#mobileNav` fijo al fondo — Misiones | Héroe | Trono | Más
- **Más sheet:** Shop, Inventario, Logros, Historial, Herrero, Mascotas, Integrar, Metas
- **Hero btn en header:** `.mobile-hero-btn#mobileHeroBtnHdr` → abre character view
- **Elementos actualizados en renderHeroUI():** `mhbAvatar`, `mhbNavAvatar`, `mhbName`, `mhbHpFill`, `mhbLevel`
- **View-tabs** ocultos en mobile (`display:none !important` en ≤480px)

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
- Versión actual: `dungeon-v39`
- **Siempre bumpar** al modificar cualquier JS/CSS antes del deploy
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
- Kanban (removido v39)
- Google Calendar (removido v39)
- Precio por cantidad, modo kiosco (son de Maneki POS)

---

## Backlog (no implementar sin confirmar con Gerardo)

### Alta prioridad
- **Crafteo con cooldown real** — sistema existe, falta lógica de cooldown (audit S19 #14)
- **Boss semanal con daño real** — boss existe en UI pero no aplica consecuencias
- **Notificaciones push para hábitos** — hora configurable por hábito
- **Tienda mejorada** — consumibles con efectos reales, más variedad

### Media prioridad
- **Habilidades de Clase con Maná** — sistema de maná nuevo
- **Equipamiento con Stats Funcionales** — armas/armaduras con efectos
- **Retos de 30 Días** — series de misiones encadenadas con progreso

### Baja prioridad / largo plazo
- **Facciones del Dungeon** (~3-4 semanas) — gremios con reputación propia, misiones exclusivas, rangos
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
