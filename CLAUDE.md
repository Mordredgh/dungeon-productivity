# Dungeon Productivity — CLAUDE.md

## Proyecto
PWA de productividad con temática D&D/RPG.  
URL: https://dungeon.mordredgh.com  
Repo: Mordredgh/dungeon-productivity  
Deploy: Coolify (git push → auto-deploy)  
Backend: Supabase Aglaya (mismo proyecto que otros apps de Gerardo)

---

## Stack
- Vanilla JS (sin frameworks, sin bundler)
- CSS custom properties con temas (dark, light, oled, nature, inferno, abyss)
- Supabase JS client (CDN)
- Fonts: Cinzel (headings) + Inter (body)
- **NO Electron, NO SQLite, NO ipcRenderer**
- **NO preview_* tools** — es PWA web en Coolify

## Orden de carga de scripts (index.html)
```
config.js → state.js → db.js → hero.js → quests.js → timer.js → inventory.js →
spells.js → views.js → ui.js → events.js → shop.js → familiar.js → rpg.js →
pets.js → weapons.js → goals.js → reputation.js → patterns.js → mechanics.js →
character.js → spotify.js → weather.js → dungeon_clock.js → skill_tree.js →
bestiary.js → dungeon_grows.js → runes.js → google_fit.js → google_cal.js →
hero_score.js → push.js → main.js
```
Agregar archivos nuevos ANTES de main.js.

---

## Service Worker
Cache actual: `dungeon-v32`  
Bumpar versión en `sw.js` siempre que se agregue o modifique JS/CSS.

---

## Tablas Supabase
- `dungeon_heroes` — héroe principal del usuario
- `dungeon_quests` — misiones (main/side/daily/weekly)
- `dungeon_pomodoros` — sesiones de pomodoro
- `dungeon_push_subscriptions` — suscripciones Web Push (hero_id UNIQUE)

### Columnas dungeon_heroes relevantes
`id, hero_id, name, hero_class, race, avatar, level, xp, xp_total, hp, hp_max,
quests_done, main_done, streak, longest_streak, gold (localStorage), created_at`

### Persistencia
- Gold: `localStorage('dungeon-gold')`
- Boss semanal: `localStorage('dungeon-boss-YYYY-WW')`
- Subtasks: markdown en campo `notes` de dungeon_quests (`- [ ] item` / `- [x] item`)

---

## Funciones globales críticas (NO redefinir)
- `updateBossBanner()` — definida SOLO en views.js (maneja boss HP + weekly banner)
- `renderMovimientos()` — nombre reservado
- `_fechaLocal` — nombre reservado
- El trío de selección de productos (ver memory feedback_funciones_globales.md)

## Patrones importantes
- `openModal(id)` → agrega clase `open` a elementos con clase `modal-overlay`
- `saveHero(patch)` → `db.from('dungeon_heroes').update(patch).eq('id', hero.id)`
- Subtasks se guardan con `db.from('dungeon_quests').update({ notes }).eq('id', q.id)` (NO upsert)
- `escHtml(str)` disponible globalmente para sanitizar output
- `switchView(v)` — maneja Character Hub tabs; si v es 'oracle' llama openOracle() y retorna

---

## Push Notifications (Web Push + VAPID)
- VAPID pública: `BEaYhse8leKsQniLSS9AiCNG3lt4Xz7H_swtNZAHKaJ_rUbIQTHt28pJBqv15yue4MRStrzB3yAa82jg2DoKGNU`
- Edge Function: `send-push` (Supabase Aglaya, verify_jwt:false)
- Suscripciones en `dungeon_push_subscriptions` (hero_id, subscription jsonb)
- `dungeonPush(title, body, url?)` — dispara push real via Edge Function
- Se llama en: subir de nivel (hero.js), racha en peligro (events.js)
- `initPush()` — auto-suscribe si el permiso ya está concedido; llamado en main.js boot

---

## Character Hub
- Acceso: clic en avatar/imagen del héroe → activa view `character`
- Tab bar (`#charHubTabs`) vive FUERA de `.views` (como sibling en `.content-area`)
  → evita que `overflow-y:auto` del `.view` oculte la barra
- Tabs: 🛡️ Personaje (sheet) | 🌳 Habilidades (skills) | 💎 Runas (runes) | 📖 Bestiario (bestiary) | ⚒️ Herrero (smithy)
- `switchCharTab(tab)` en ui.js — activa tab y llama render correspondiente
- Las vistas antiguas de skills/runes/bestiary/smithy están dentro de `view-character` como `.char-tab-panel`
- NO hay vistas standalone para esas secciones (se eliminaron del HTML)

---

## Índice del Héroe
- Archivo: `js/hero_score.js`
- Score 0-100 compuesto: Racha(25) + Nivel(20) + HP(15) + Misiones hoy(20) + Actividad 7d(20)
- Tiers: Legendario(90+👑) | Épico(70+💜) | Raro(50+💙) | Normal(30+💚) | Común(0+🩶)
- Widget: `#heroScoreWidget` div en la portrait card de la hoja de personaje
- `renderHeroScoreWidget()` se llama al final de `renderCharacterSheet()`

---

## Assets y Supabase Storage
- Todos los assets visuales (mascotas, avatares, equipo, bosses) los crea Gerardo manualmente
- Se suben a Supabase Storage con naming convention fija
- La app construye la URL a partir del nombre: `[categoria]_[param1]_[param2].png`
- **NO llamar Gemini en tiempo real** para generar assets — usar URLs predefinidas
- Verificar siempre si el asset existe antes de mostrarlo (fallback a emoji/placeholder)

### Convención de nombres en Storage
```
Mascotas:  pet_[huevo]_[pocion].png      (ej: pet_fuego_sombra.png)
Monturas:  mount_[huevo]_[pocion].png
Avatares:  avatar_[clase]_[raza].png     (ej: avatar_mago_elfo.png)
Equipo:    item_[slug].png               (ej: item_espada_dungeon.png)
Bosses:    boss_[slug].png               (ej: boss_halloween.png)
```

---

## Status de Features (actualizado 2026-06-16)

### ✅ Completadas
- Misiones (main/side/daily/weekly) con rareza y XP
- Pomodoro timer + vinculación a misión
- Sistema de nivel y XP con bonos por clase/raza/runas
- Racha diaria con daño por inactividad y Amuleto de Protección
- Logros y achievements
- Inventario + Tienda (Herrería)
- Mascotas e incubación de huevos
- Árbol de Habilidades con bonos activos
- Runas con efectos pasivos
- Bestiario con tracking de monstruos derrotados
- Oracle (chat con Gemini)
- Integración Google Fit (pasos)
- Integración Google Calendar
- Spotify widget
- Clima en tiempo real
- Reloj del dungeon (con hora y fase del día)
- Mi Dungeon (mapa de salas con links)
- Goals (metas con progreso)
- Reputación de gremio
- Patrones de actividad
- Sistema de mecánicas (eventos, crafteo, apuestas, etc.)
- Character Hub (tabs: Personaje / Habilidades / Runas / Bestiario / Herrero)
- Índice del Héroe 0-100 con SVG ring y tiers
- Push Notifications reales (Web Push + VAPID + Edge Function)

### 🔴 Pendientes (prioridad)
- Crafteo con cooldown real (Item 14 del audit)
- Drops al completar misiones (P1)
- Hábitos bidireccionales +/- (P3)

### 🎨 Pendientes (esperando arte de Gerardo)
- Sala Personal (habitación del héroe con decoraciones)
- Jardín de Mascotas (vista especial)
- Clases Secretas (contenido desbloqueado)

### 📋 Backlog (baja prioridad)
- Habilidades de Clase con Maná (P4)
- Equipamiento con Stats Funcionales (P5)
- Avatar Visual con Capas (P6)
- Retos de 30 Días vía Oráculo (P7)
- Eventos Estacionales (P8)

---

## Features permanentemente excluidas
Ver memory: feedback_dungeon_features_excluidas.md
- Virtual scroll, re-render optimization, build step, SVG icons inline,
  Supabase Realtime, sistema de Campaña, PWA widget, multiplayer
- Precio por cantidad, modo kiosco (son de Maneki, no de Dungeon)

---

## Deploy
```bash
git add -A
git commit -m "mensaje"
git push origin main
```
Coolify detecta el push y despliega automáticamente.
