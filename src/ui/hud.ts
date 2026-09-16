import { KeplerianElements, SatelliteState } from '../core/orbit';
import { SATELLITE_CATALOG } from '../core/satellites';
import { OrbitariumScene } from '../renderer/scene';

export function setupUI(scene: OrbitariumScene) {
  // Populate Satellite list
  const satListContainer = document.getElementById('sat-list')!;
  
  function renderSatelliteList(category = 'all') {
    satListContainer.innerHTML = '';
    const filtered = category === 'all' 
      ? SATELLITE_CATALOG 
      : SATELLITE_CATALOG.filter(s => s.category === category);

    for (const sat of filtered) {
      const item = document.createElement('div');
      item.className = `sat-item ${sat.noradId === scene.state.selectedSatellite.noradId ? 'active' : ''}`;
      item.dataset.noradId = sat.noradId.toString();

      item.innerHTML = `
        <div class="sat-item-header">
          <span class="sat-badge" style="background-color: ${sat.color}"></span>
          <span class="sat-name">${sat.name}</span>
        </div>
        <div class="sat-subtext">NORAD #${sat.noradId} · ${sat.category.toUpperCase()}</div>
      `;

      item.addEventListener('click', () => {
        scene.selectSatellite(sat.noradId);
        document.querySelectorAll('.sat-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
      });

      satListContainer.appendChild(item);
    }
  }

  renderSatelliteList('all');

  // Category filter buttons
  const filterButtons = document.querySelectorAll<HTMLButtonElement>('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.category || 'all';
      scene.filterCategory(cat);
      renderSatelliteList(cat);
    });
  });

  // Time Multipliers
  const timeBtns = document.querySelectorAll<HTMLButtonElement>('.time-btn');
  timeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      timeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mult = parseFloat(btn.dataset.speed || '1');
      scene.setTimeMultiplier(mult);
    });
  });

  // Play / Pause
  const playBtn = document.getElementById('btn-play-pause')!;
  playBtn.addEventListener('click', () => {
    const isPlaying = scene.togglePlayPause();
    playBtn.textContent = isPlaying ? '⏸ PAUSE' : '▶ RESUME';
  });
}

export function updateHUD(sat: KeplerianElements, telem: SatelliteState) {
  const elName = document.getElementById('hud-sat-name');
  const elNorad = document.getElementById('hud-norad-id');
  const elAlt = document.getElementById('hud-altitude');
  const elVel = document.getElementById('hud-velocity');
  const elLat = document.getElementById('hud-latitude');
  const elLon = document.getElementById('hud-longitude');
  const elPeriod = document.getElementById('hud-period');
  const elApo = document.getElementById('hud-apoapsis');
  const elPeri = document.getElementById('hud-periapsis');
  const elInc = document.getElementById('hud-inclination');
  const elClock = document.getElementById('utc-clock');

  if (elName) elName.textContent = sat.name;
  if (elNorad) elNorad.textContent = `#${sat.noradId}`;
  if (elAlt) elAlt.textContent = `${telem.altitudeKm.toFixed(1)} km`;
  if (elVel) elVel.textContent = `${telem.speedKmS.toFixed(3)} km/s`;
  if (elLat) elLat.textContent = `${telem.latitudeDeg >= 0 ? '+' : ''}${telem.latitudeDeg.toFixed(3)}°`;
  if (elLon) elLon.textContent = `${telem.longitudeDeg >= 0 ? '+' : ''}${telem.longitudeDeg.toFixed(3)}°`;
  if (elPeriod) elPeriod.textContent = `${telem.periodMinutes.toFixed(2)} min`;
  if (elApo) elApo.textContent = `${telem.apoapsisKm.toFixed(1)} km`;
  if (elPeri) elPeri.textContent = `${telem.periapsisKm.toFixed(1)} km`;
  if (elInc) elInc.textContent = `${sat.inclinationDeg.toFixed(2)}°`;
  if (elClock) elClock.textContent = new Date().toUTCString().slice(17, 25) + ' UTC';
}
