'use strict';

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
    const res  = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code`);
    const data = await res.json();
    const temp = Math.round(data.current.temperature_2m);
    const icon = WEATHER_ICONS[data.current.weather_code] || '🌡️';
    chip.textContent = `${icon} ${temp}°C`;
    chip.title = `Clima actual: ${temp}°C`;
    chip.style.display = 'flex';
  } catch {}
}
