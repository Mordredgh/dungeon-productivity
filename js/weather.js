'use strict';

let _weatherData = null;

async function loadRealWeather() {
  const chip = document.getElementById('realWeatherChip');
  if (!chip) return;

  let coords = null;
  try { coords = JSON.parse(localStorage.getItem('dungeon-geo') || 'null'); } catch {}
  const fresh = coords && (Date.now() - coords.ts < 60 * 60 * 1000);

  if (!fresh) {
    coords = await new Promise(resolve => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, ts: Date.now() }),
        () => resolve(null),
        { timeout: 8000 }
      );
    });
    if (coords) localStorage.setItem('dungeon-geo', JSON.stringify(coords));
  }
  if (!coords) return;

  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code` +
      `&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);
    const data = await res.json();
    _weatherData = data;
    const temp = Math.round(data.current.temperature_2m);
    const icon = WEATHER[data.current.weather_code]?.i || '🌡️';
    chip.innerHTML = `${icon} ${temp}°C`;
    chip.title = '';
    chip.style.display = 'flex';
    chip.onclick = toggleWeatherDetail;
    renderWeatherDetail();
  } catch {}
}

function renderWeatherDetail() {
  const panel = document.getElementById('weatherDetailPanel');
  if (!panel || !_weatherData) return;
  const c = _weatherData.current;
  const d = _weatherData.daily;
  const icon = WEATHER[c.weather_code]?.i || '🌡️';
  const desc = WEATHER[c.weather_code]?.d || 'Clima desconocido';
  panel.innerHTML = `
    <div class="weather-detail-head">
      <span class="weather-detail-icon">${icon}</span>
      <div>
        <div class="weather-detail-temp">${Math.round(c.temperature_2m)}°C</div>
        <div class="weather-detail-desc">${escHtml(desc)}</div>
      </div>
    </div>
    <div class="weather-detail-grid">
      <div class="weather-detail-item"><span>🌡️ Sensación</span><strong>${Math.round(c.apparent_temperature)}°C</strong></div>
      <div class="weather-detail-item"><span>💧 Humedad</span><strong>${Math.round(c.relative_humidity_2m)}%</strong></div>
      <div class="weather-detail-item"><span>💨 Viento</span><strong>${Math.round(c.wind_speed_10m)} km/h</strong></div>
      ${d ? `<div class="weather-detail-item"><span>📈 Máx / Mín</span><strong>${Math.round(d.temperature_2m_max[0])}° / ${Math.round(d.temperature_2m_min[0])}°</strong></div>` : ''}
    </div>`;
}

function toggleWeatherDetail(e) {
  if (e) e.stopPropagation();
  const panel = document.getElementById('weatherDetailPanel');
  if (!panel) return;
  panel.classList.toggle('open');
}

document.addEventListener('click', e => {
  const panel = document.getElementById('weatherDetailPanel');
  const chip  = document.getElementById('realWeatherChip');
  if (panel && panel.classList.contains('open') && !panel.contains(e.target) && e.target !== chip) {
    panel.classList.remove('open');
  }
});
