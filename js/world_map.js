/* ── MAPA DEL MUNDO INTERACTIVO ─────────────────────────── */

// Posiciones (% del ancho/alto del contenedor) para cada zona.
// Ajustables según el arte final del mapa.
const ZONE_MAP_POSITIONS = {
  ciudadela: { x: 44, y: 14 },
  campo:     { x: 72, y: 48 },
  torre:     { x: 68, y: 12 },
  fortaleza: { x: 74, y: 72 },
  jardin:    { x: 22, y: 70 },
  cripta:    { x: 16, y: 46 },
};

let _worldMapEl = null;

function renderWorldMap() {
  const el = document.getElementById('worldMapView');
  if (!el) return;
  _worldMapEl = el;

  const zoneXPs = typeof calcZoneXP === 'function' ? calcZoneXP() : {};

  const hotspots = ZONES.map(z => {
    const pos  = ZONE_MAP_POSITIONS[z.id] || { x: 50, y: 50 };
    const xp   = zoneXPs[z.id] || 0;
    const info = typeof _zoneRankInfo === 'function' ? _zoneRankInfo(z, xp) : { rank: 0 };
    const rankNames = ['Forastero','Conocido','Aliado','Campeón','Leyenda'];
    const rankName  = rankNames[info.rank] || 'Forastero';
    const rankColor = ['var(--text3)','#60a5fa','#a78bfa','#fb923c','#facc15'][info.rank] || 'var(--text3)';
    return `<button class="wm-hotspot" data-zone="${z.id}"
        style="left:${pos.x}%;top:${pos.y}%;--z-clr:${z.color}"
        onclick="_wmOpenZone('${z.id}')"
        title="${z.name} — ${rankName}">
      <div class="wm-hs-icon">${z.icon}</div>
      <div class="wm-hs-label" style="color:${rankColor}">${z.name}</div>
    </button>`;
  }).join('');

  const mapSrc = (typeof CDN !== 'undefined' ? CDN : '') + 'dungeon/mapa_mundo.png';

  el.innerHTML = `
    <div class="wm-wrap">
      <div class="wm-container" id="wmContainer">
        <img src="${mapSrc}" class="wm-img" alt="Mapa del Mundo"
             onerror="this.style.display='none';document.getElementById('wmBgFallback').style.display='block'">
        <div class="wm-bg-fallback" id="wmBgFallback" style="display:none"></div>
        ${hotspots}
      </div>
      <div class="wm-legend">
        ${ZONES.map(z => {
          const xp  = zoneXPs[z.id] || 0;
          const inf = typeof _zoneRankInfo === 'function' ? _zoneRankInfo(z, xp) : { rank: 0 };
          const rn  = ['Forastero','Conocido','Aliado','Campeón','Leyenda'][inf.rank] || 'Forastero';
          const rc  = ['var(--text3)','#60a5fa','#a78bfa','#fb923c','#facc15'][inf.rank] || 'var(--text3)';
          return `<div class="wm-legend-row">
            <span class="wm-legend-icon" style="--z-clr:${z.color}">${z.icon}</span>
            <span class="wm-legend-name">${z.name}</span>
            <span class="wm-legend-rank" style="color:${rc}">${rn}</span>
            <span class="wm-legend-xp">${xp} XP</span>
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="wm-detail-panel" id="wmDetailPanel" style="display:none"></div>`;
}

function _wmOpenZone(zoneId) {
  const z     = ZONES.find(z => z.id === zoneId);
  const panel = document.getElementById('wmDetailPanel');
  if (!z || !panel) return;

  const zoneXPs = typeof calcZoneXP === 'function' ? calcZoneXP() : {};
  const xp      = zoneXPs[zoneId] || 0;
  const inf     = typeof _zoneRankInfo === 'function' ? _zoneRankInfo(z, xp) : { rank: 0, next: 0, bonus: 0 };
  const rankNames  = ['Forastero','Conocido','Aliado','Campeón','Leyenda'];
  const rankColors = ['var(--text3)','#60a5fa','#a78bfa','#fb923c','#facc15'];
  const rName  = rankNames[inf.rank]  || 'Forastero';
  const rColor = rankColors[inf.rank] || 'var(--text3)';
  const pct    = inf.next > 0 ? Math.min(100, Math.round((xp / inf.next) * 100)) : 100;
  const bonusTxt = inf.bonus > 0 ? `+${Math.round(inf.bonus * 100)}% XP` : 'Sin bonus aún';

  // Highlight active hotspot
  document.querySelectorAll('.wm-hotspot').forEach(b => b.classList.toggle('wm-hs-active', b.dataset.zone === zoneId));

  panel.style.display = '';
  panel.innerHTML = `
    <div class="wm-detail-inner" style="--z-clr:${z.color}">
      <button class="wm-detail-close" onclick="document.getElementById('wmDetailPanel').style.display='none';document.querySelectorAll('.wm-hotspot').forEach(b=>b.classList.remove('wm-hs-active'))">✕</button>
      <div class="wm-detail-icon">${z.icon}</div>
      <div class="wm-detail-name">${z.name}</div>
      <div class="wm-detail-desc">${z.desc}</div>
      <div class="wm-detail-rank" style="color:${rColor}">${rName}</div>
      <div class="wm-detail-xp">${xp} / ${inf.next || '∞'} XP</div>
      <div class="wm-bar-bg"><div class="wm-bar-fill" style="width:${pct}%;background:${z.color}"></div></div>
      <div class="wm-detail-bonus">${bonusTxt}</div>
    </div>`;
}
