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
config.js → state.js → db.js → hero.js → quests.js → timer.js →
spells.js → views.js → ui.js → events.js → shop.js → familiar.js → rpg.js → main.js
```
Agregar archivos nuevos ANTES de main.js.

---

## Tablas Supabase
- `dungeon_heroes` — héroe principal del usuario
- `dungeon_quests` — misiones (main/side/daily/weekly)
- `dungeon_pomodoros` — sesiones de pomodoro

### Columnas dungeon_heroes relevantes
`id, hero_id, name, class, race, avatar, level, xp, xp_total, hp, hp_max,
quests_done, main_done, streak, best_streak, gold (localStorage), created_at`

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

## Roadmap de features (en orden de prioridad)

### 🔴 P1 — Sistema de Drops al completar misiones
Drop rates por rareza de misión:
- Común 10% / Normal 20% / Épico 40% / Legendario 60% / Mítico 90%

Ítems posibles (probabilidad dentro del drop):
- Huevo de Fuego 20%, Sombra 20%, Luz 15%, Naturaleza 15%, Tormenta 10%, Mítico 5%
- Poción de Fuego 5%, Sombra 5%, Mítica 2%
- Fragmento de Gema 1%, Pergamino 1%, Polvo Arcano 1%

UI: popup animado "¡Botín obtenido! 🎁 [ítem]" aparece 1s después de completar misión,
dura 3s con fade out. Nueva sección "🎒 Mochila" con ítems agrupados por tipo.

Tabla Supabase nueva: `dungeon_inventory` (hero_id, item_key, item_name, item_type, quantity)

### 🔴 P2 — Sistema de Mascotas
Mecánica: Huevo + Poción → Incubar → Mascota con nivel 1-5 → Nivel 5 = Montura

- Mascotas en Establo (grid con nivel y barra XP)
- Mascota activa visible en panel del héroe (64x64px)
- Montura activa visible debajo del avatar (96x96px)
- Alimentar con Materiales del inventario sube XP de mascota

Tablas nuevas: `dungeon_pets` (hero_id, pet_key, name, level, xp, is_active, is_mount)

### 🔴 P3 — Hábitos bidireccionales +/-
Nuevo tipo de tarea radicalmente diferente a Misiones:
- Botón ✅ (+): +5 XP +2 monedas
- Botón ❌ (-): -5 HP
- Sin fecha límite, sin "completado permanente"
- Reseteo visual diario (contador vuelve a 0), guarda historial
- Color del hábito: verde si + > -, rojo si - > +, gris si igual
- Nueva pestaña "⚡ Hábitos" en navegación principal

Tablas nuevas: `dungeon_habits` (hero_id, name, desc), `dungeon_habit_logs` (habit_id, date, pos_count, neg_count)

### 🟡 P4 — Habilidades de Clase con Maná
Nueva barra de Maná (azul, máx 100) en panel del héroe.

Habilidades por clase:
- Guerrero / Berserker: 30MP → 2x XP próximas 3 misiones / CD 24h
- Mago / Visión Arcana: 20MP → Oráculo gratis / CD 12h
- Pícaro / Paso en Sombras: 40MP → Una Daily fallida sin penalización / CD 48h
- Clérigo / Sanación: 25MP → +30 HP / CD 6h
- Arquero / Ojo de Águila: 30MP → +50% drop rate próximas 5 misiones / CD 24h
- Fundador Caótico / Caos Total: 50MP → efecto aleatorio / CD 12h

Maná recarga: +10 por Normal, +20 por Épica, +30 por Mítica completada.

### 🟡 P5 — Equipamiento con Stats Funcionales
5 slots: Arma, Pecho, Casco, Accesorio x2
Stats posibles: +XP%, +Drop Rate%, +Max HP, +Maná/misión, +Monedas%

Ítems iniciales:
- Espada del Dungeon (Arma, +10% XP épicas, 150🪙)
- Armadura de Placas (Pecho, +25 Max HP, 200🪙)
- Anillo de XP (Accesorio, +5% XP global, 100🪙)
- Capa de Sombras (Accesorio, +15% Drop Rate, 175🪙)
- Amuleto de Racha (Accesorio, +10 Maná/misión, 125🪙)

### 🟢 P6 — Avatar Visual con Capas (sprites por clase+raza)
128x128px en panel del héroe, reemplaza emoji de clase.
Regenerar al equipar armadura nueva.

### 🟢 P7 — Retos de 30 Días (Oráculo)
Gemini genera 30 misiones temáticas escaladas.
Temas: Fitness / Creatividad / Estudio / Productividad / Custom.
Al completar: recompensa única de equipo.

### 🟢 P8 — Eventos Estacionales
Halloween (Oct 31), Navidad (Dic 25), Año Nuevo (Ene 1), Aniversario (Jun 15).
Boss especial por evento, drops exclusivos, anuncio 7 días antes.

---

## Rediseño UI (en progreso)
Objetivo: interfaz más premium y diferente a la actual.
Inspiración: Habitica pero con identidad propia — oscuro, elegante, RPG moderno.
Ver sección de trabajo activo para decisiones de diseño tomadas.

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
