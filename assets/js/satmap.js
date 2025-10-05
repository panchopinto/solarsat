
const statusEl = document.getElementById('status');
const map = L.map('map', { worldCopyJump:true }).setView([0,0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
  attribution:'© OpenStreetMap'
}).addTo(map);
let positionMarker = null;
let trackLine = null;
let lastGeoJSON = null;

function setStatus(t){ statusEl.textContent = t; }

// Helpers for regime and color
function regimeFromAlt(altKm){
  if (altKm < 2000) return 'LEO';
  if (altKm < 35786 - 1000) return 'MEO';
  if (Math.abs(altKm - 35786) <= 1000) return 'GEO';
  return altKm >= 35786 ? 'HEO/GEO+' : 'LEO';
}
function colorByRegime(reg){
  if (reg==='LEO') return '#60a5fa'; // blue
  if (reg==='MEO') return '#f59e0b'; // amber
  if (reg==='GEO') return '#10b981'; // green
  return '#e5e7eb';
}
function updateHUD({name, lat, lon, alt, inc, type}){
  document.getElementById('hudName').textContent = name || '—';
  document.getElementById('hudLat').textContent = (lat!=null? lat.toFixed(2): '—');
  document.getElementById('hudLon').textContent = (lon!=null? lon.toFixed(2): '—');
  document.getElementById('hudAlt').textContent = (alt!=null? alt.toFixed(0): '—');
  document.getElementById('hudInc').textContent = (inc!=null? inc.toFixed(1): '—');
  document.getElementById('hudType').textContent = type || '—';
}

async function fetchTLEbyNORAD(norad){
  const url = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${norad}&FORMAT=TLE`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('CelesTrak fail ' + res.status);
  const txt = await res.text();
  const lines = txt.trim().split(/\r?\n/);
  if(lines.length < 3) throw new Error('TLE incompleto');
  return { name: lines[0].trim(), l1: lines[1].trim(), l2: lines[2].trim() };
}

function altKmFromA(a){ const Re_km = 6371; return a*Re_km - Re_km; }
function incDegFromSatrec(satrec){ return satrec.inclo * (180/Math.PI); }

function groundTrack(satrec, minutes=90, stepSec=60){
  const points = [];
  const now = new Date(Date.now() + (offsetSec||0)*1000);
  for(let t=0; t<=minutes*60; t+=stepSec){
    const time = new Date(now.getTime() + t*1000);
    const gmst = satellite.gstime(time);
    const pv = satellite.propagate(satrec, time);
    if(!pv.position) continue;
    const geodetic = satellite.eciToGeodetic(pv.position, gmst);
    const lat = satellite.degreesLat(geodetic.latitude);
    const lon = satellite.degreesLong(geodetic.longitude);
    points.push([lat, lon]);
  }
  return points;
}

async function drawFor(norad){
  setStatus('Cargando TLE…');
  let tle;
  try{
    tle = await fetchTLEbyNORAD_cached(norad);
  }catch(e){
    console.warn(e);
    tle = {
      name: 'ISS (demo offline)',
      l1: '1 25544U 98067A   24220.51871528  .00016717  00000+0  10000-3 0  9993',
      l2: '2 25544  51.6412  85.5776 0003505  96.6442  79.0623 15.49748450423306'
    };
    setStatus('Usando demo offline ISS');
  }

  const satrec = satellite.twoline2satrec(tle.l1, tle.l2);
  const inc = incDegFromSatrec(satrec);
  const a = 1/(satrec.no/ (2*Math.PI));
  const alt = altKmFromA(a);
  const reg = regimeFromAlt(alt);

  // filters
  const selectedReg = (document.getElementById('regimeFilter')||{value:'ALL'}).value;
  const altMin = parseFloat(document.getElementById('altMin').value);
  const altMax = parseFloat(document.getElementById('altMax').value);
  const incMin = parseFloat(document.getElementById('incMin').value);
  const incMax = parseFloat(document.getElementById('incMax').value);
  if(!(alt >= altMin && alt <= altMax && inc >= incMin && inc <= incMax && (selectedReg==='ALL' || selectedReg===reg))){
    setStatus(`Filtrado (alt≈${alt.toFixed(0)}km, inc≈${inc.toFixed(1)}°, ${reg})`);
    if(positionMarker){ map.removeLayer(positionMarker); positionMarker=null; }
    if(trackLine){ map.removeLayer(trackLine); trackLine=null; }
    lastGeoJSON = null;
    return;
  }

  // current position
  const now = new Date(Date.now() + (offsetSec||0)*1000);
  const gmst = satellite.gstime(now);
  const pv = satellite.propagate(satrec, now);
  const geo = satellite.eciToGeodetic(pv.position, gmst);
  const lat = satellite.degreesLat(geo.latitude);
  const lon = satellite.degreesLong(geo.longitude);

  if(positionMarker){ map.removeLayer(positionMarker); }
  const color = colorByRegime(reg);
  const icon = L.divIcon({className:'', html:`<div style="width:14px;height:14px;border-radius:50%;background:${color};box-shadow:0 0 8px ${color};border:1px solid rgba(255,255,255,.6)"></div>`});
  positionMarker = L.marker([lat,lon], { title: `${tle.name}`, icon }).addTo(map)
    .bindPopup(`<b>${tle.name}</b><br/>Alt ≈ ${alt.toFixed(0)} km<br/>Inc ≈ ${inc.toFixed(1)}°<br/>${reg}`);
  if(document.getElementById('followSat').checked){
    map.panTo([lat,lon], { animate:true });
  }
  updateHUD({name: tle.name, lat, lon, alt, inc, type: reg});

  if(trackLine){ map.removeLayer(trackLine); trackLine=null; }
  if(document.getElementById('drawTrack').checked){
    const pts = groundTrack(satrec, 90, 60);
    trackLine = L.polyline(pts, { weight:2, opacity:0.9, color: colorByRegime(reg) }).addTo(map);
    lastGeoJSON = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: { norad, name: tle.name },
        geometry: { type: 'LineString', coordinates: pts.map(p=>[p[1], p[0]]) }
      }]
    };
  }else{
    lastGeoJSON = null;
  }

  setStatus(`OK: ${tle.name}`);
}

document.getElementById('btnLoad').addEventListener('click', ()=>{
  const norad = document.getElementById('satSelect').value;
  drawFor(norad);
});
document.getElementById('btnExport').addEventListener('click', ()=>{
  if(!lastGeoJSON){ alert('No hay traza para exportar'); return; }
  const blob = new Blob([JSON.stringify(lastGeoJSON,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'groundtrack.geojson'; a.click();
  URL.revokeObjectURL(url);
});
document.getElementById('btnActive').addEventListener('click', async ()=>{
  setStatus('Descargando activos…');
  try{
    const res = await fetch('https://celestrak.org/NORAD/elements/active.txt');
    const text = await res.text();
    const blocks = text.trim().split(/\r?\n(?=[^12])/);
    const select = document.getElementById('satSelect');
    select.innerHTML='';
    let count=0;
    for(const b of blocks){
      const lines = b.trim().split(/\r?\n/);
      if(lines.length>=3){
        const name = lines[0].trim();
        const l2 = lines[2].trim();
        const norad = l2.split(' ')[1].substring(0,5);
        const opt = document.createElement('option');
        opt.value = norad; opt.textContent = name;
        select.appendChild(opt);
        if(++count>600) break;
      }
    }
    setStatus(`Activos cargados (${count})`);
  }catch(e){
    console.error(e);
    setStatus('Error al cargar activos');
  }
});

// Auto-refresh
let timer = null;
function applyAuto(){
  if(timer){ clearInterval(timer); timer=null; }
  if(document.getElementById('autoRefresh').checked){
    timer = setInterval(()=>{
      const norad = document.getElementById('satSelect').value;
      drawFor(norad);
    }, 30000);
  }
}
document.getElementById('autoRefresh').addEventListener('change', applyAuto);
applyAuto();

// Search button
document.getElementById('btnSearch').addEventListener('click', ()=>{
  const q = document.getElementById('qSearch').value.trim();
  if(!q) return;
  const select = document.getElementById('satSelect');
  if(/^\d+$/.test(q)){
    let opt = Array.from(select.options).find(o=>o.value===q);
    if(!opt){
      opt = document.createElement('option'); opt.value=q; opt.textContent=`NORAD ${q}`;
      select.insertBefore(opt, select.firstChild);
    }
    select.value = q; drawFor(q);
    return;
  }
  const found = Array.from(select.options).find(o=>o.textContent.toLowerCase().includes(q.toLowerCase()));
  if(found){ select.value = found.value; drawFor(found.value); return; }
  document.getElementById('btnActive').click();
  setTimeout(()=>{
    const found2 = Array.from(select.options).find(o=>o.textContent.toLowerCase().includes(q.toLowerCase()));
    if(found2){ select.value = found2.value; drawFor(found2.value); }
    else alert('No encontrado en activos.');
  }, 2500);
});

// Incremental search (debounce)
let debounceSearchTimer=null;
const qEl = document.getElementById('qSearch');
if(qEl){
  qEl.addEventListener('keyup', ()=>{
    if(debounceSearchTimer) clearTimeout(debounceSearchTimer);
    debounceSearchTimer = setTimeout(()=>{
      document.getElementById('btnSearch').click();
    }, 500);
  });
}

// Center & Pin HUD
const btnCenterHUD = document.getElementById('btnCenterHUD');
const btnPinHUD = document.getElementById('btnPinHUD');
const hudEl = document.getElementById('hud');
let hudPinned = false;
btnCenterHUD?.addEventListener('click', ()=>{
  if(positionMarker){
    const ll = positionMarker.getLatLng();
    map.panTo(ll, {animate:true});
  }
});
btnPinHUD?.addEventListener('click', ()=>{
  hudPinned = !hudPinned;
  if(hudPinned){
    hudEl.style.background = 'rgba(0,0,0,.65)';
    hudEl.style.border = '1px solid rgba(34,211,238,.45)';
    btnPinHUD.textContent = '📌 Fijado';
  }else{
    hudEl.style.background = 'rgba(0,0,0,.45)';
    hudEl.style.border = '1px solid rgba(255,255,255,.12)';
    btnPinHUD.textContent = '📌 Fijar';
  }
});

// Initial
drawFor(document.getElementById('satSelect').value).catch(e=>{
  console.error(e); setStatus('Error inicial'); 
});

// Time slider state
let offsetSec = 0;
const slider = document.getElementById('timeSlider');
const dtLabel = document.getElementById('dtLabel');
const btnNow = document.getElementById('btnNow');
slider?.addEventListener('input', ()=>{
  offsetSec = parseInt(slider.value||'0',10);
  if(dtLabel) dtLabel.textContent = (offsetSec>=0? '+':'') + offsetSec + ' s';
  const norad = document.getElementById('satSelect').value;
  drawFor(norad);
});
btnNow?.addEventListener('click', ()=>{
  offsetSec = 0; if(slider) slider.value = 0; if(dtLabel) dtLabel.textContent='0 s';
  const norad = document.getElementById('satSelect').value;
  drawFor(norad);
});

// localStorage TLE cache 24h
function cacheKey(n){ return 'tle_'+n; }
function putTLE(n, tle){
  localStorage.setItem(cacheKey(n), JSON.stringify({tle, t: Date.now()}));
}
function getTLE(n){
  const raw = localStorage.getItem(cacheKey(n));
  if(!raw) return null;
  try{
    const obj = JSON.parse(raw);
    if(Date.now() - obj.t < 24*3600*1000) return obj.tle;
  }catch(e){}
  return null;
}

// Override fetch to use cache
async function fetchTLEbyNORAD_cached(norad){
  const c = getTLE(norad);
  if(c) return c;
  const t = await fetchTLEbyNORAD(norad);
  putTLE(norad, t);
  return t;
}

// Prediction of passes (simple, 24h, step 30s)
async function predictPasses(norad){
  const passesEl = document.getElementById('passes');
  if(!passesEl) return;
  passesEl.innerHTML = 'Calculando…';
  let tle;
  try{ tle = await fetchTLEbyNORAD_cached(norad); }
  catch(e){ passesEl.innerHTML = 'Sin TLE'; return; }
  const satrec = satellite.twoline2satrec(tle.l1, tle.l2);

  // Observer location
  function withObserver(cb){
    const latEl = document.getElementById('obsLat');
    const lonEl = document.getElementById('obsLon');
    const minEl = parseFloat(document.getElementById('minEl')?.value || '10');
    const setRes = (res)=> passesEl.innerHTML = res;
    const lat = parseFloat(latEl?.value||'NaN');
    const lon = parseFloat(lonEl?.value||'NaN');
    if(!Number.isNaN(lat) && !Number.isNaN(lon)) return cb({lat, lon, minEl});
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(pos=>{
        cb({lat: pos.coords.latitude, lon: pos.coords.longitude, minEl});
      }, _=> cb({lat:0, lon:0, minEl}));
    }else cb({lat:0, lon:0, minEl});
  }

  withObserver(({lat, lon, minEl})=>{
    const start = new Date();
    const end = new Date(start.getTime() + 24*3600*1000);
    const step = 30*1000;
    const obsGd = { longitude: satellite.degreesToRadians(lon), latitude: satellite.degreesToRadians(lat), height: 0.001 };
    const items = [];
    let prevAbove = false, riseT=null, maxEl=0, maxT=null;

    for(let t = start.getTime(); t <= end.getTime(); t += step){
      const time = new Date(t);
      const gmst = satellite.gstime(time);
      const pv = satellite.propagate(satrec, time);
      if(!pv.position || !pv.velocity) continue;
      const posGd = satellite.eciToGeodetic(pv.position, gmst);
      const look = satellite.ecfToLookAngles(obsGd, satellite.eciToEcf(pv.position, gmst));
      const elev = satellite.radiansToDegrees(look.elevation);
      const above = elev >= minEl;
      if(above){
        if(!prevAbove){ riseT = new Date(t); maxEl = elev; maxT = new Date(t); }
        if(elev > maxEl){ maxEl = elev; maxT = new Date(t); }
      }
      if(prevAbove && !above && riseT){
        items.push({start: riseT, peak: maxT, peakEl: maxEl.toFixed(1)});
        riseT = null; maxEl=0; maxT=null;
      }
      prevAbove = above;
    }
    if(items.length===0){ passesEl.innerHTML = '<em>No hay pases ≥ ' + minEl + '° en 24 h.</em>'; return; }
    const lines = items.slice(0,10).map(p=>{
      return `• Inicio: ${p.start.toLocaleString()} — Máx: ${p.peak.toLocaleTimeString()} (Elev ${p.peakEl}°)`;
    });
    passesEl.innerHTML = '<pre style="white-space:pre-wrap;margin:0">' + lines.join('\n') + '</pre>';
  });
}
document.getElementById('btnPredict')?.addEventListener('click', ()=>{
  const norad = document.getElementById('satSelect').value;
  predictPasses(norad);
});

// class mode autoplay
(function(){
  let cycleTimer=null;
  function startCycle(){
    if(cycleTimer) clearInterval(cycleTimer);
    if(localStorage.getItem('classMode')==='1'){
      cycleTimer = setInterval(()=>{
        const sel = document.getElementById('satSelect');
        if(!sel || sel.options.length===0) return;
        let idx = sel.selectedIndex;
        idx = (idx+1) % sel.options.length;
        sel.selectedIndex = idx;
        document.getElementById('followSat').checked = true;
        drawFor(sel.value);
        const hud = document.getElementById('classInfo');
        if(hud){ hud.textContent = 'Mostrando: ' + sel.options[idx].textContent; }
      }, 20000);
    }
  }
  window.addEventListener('storage', startCycle);
  startCycle();
  setInterval(startCycle, 5000);
})();
