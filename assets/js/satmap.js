
const statusEl = document.getElementById('status');
const map = L.map('map', { worldCopyJump:true }).setView([0,0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
  attribution:'© OpenStreetMap'
}).addTo(map);
let positionMarker = null;
let trackLine = null;
let lastGeoJSON = null;

function setStatus(t){ statusEl.textContent = t; }

async function fetchTLEbyNORAD(norad){
  // CelesTrak: returns 2 lines + name
  const url = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${norad}&FORMAT=TLE`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('CelesTrak fail ' + res.status);
  const txt = await res.text();
  // Expect 3 lines: name, l1, l2
  const lines = txt.trim().split(/\r?\n/);
  if(lines.length < 3) throw new Error('TLE incompleto');
  return { name: lines[0].trim(), l1: lines[1].trim(), l2: lines[2].trim() };
}

function altKmFromA(a){ // semi-major axis (Earth radii), altitude approximate
  const Re_km = 6371;
  return a*Re_km - Re_km;
}

function incDegFromSatrec(satrec){
  return satrec.inclo * (180/Math.PI);
}

function groundTrack(satrec, minutes=90, stepSec=60){
  const points = [];
  const now = new Date();
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
    tle = await fetchTLEbyNORAD(norad);
  }catch(e){
    console.warn(e);
    // demo offline fallback (ISS embedded)
    tle = {
      name: 'ISS (demo offline)',
      l1: '1 25544U 98067A   24220.51871528  .00016717  00000+0  10000-3 0  9993',
      l2: '2 25544  51.6412  85.5776 0003505  96.6442  79.0623 15.49748450423306'
    };
    setStatus('Usando demo offline ISS');
  }

  const satrec = satellite.twoline2satrec(tle.l1, tle.l2);
  const inc = incDegFromSatrec(satrec);
  const a = 1/(satrec.no/ (2*Math.PI)); // mean motion in rad/s -> semi-major in Earth radii
  const alt = altKmFromA(a);

  // filters
  const altMin = parseFloat(document.getElementById('altMin').value);
  const altMax = parseFloat(document.getElementById('altMax').value);
  const incMin = parseFloat(document.getElementById('incMin').value);
  const incMax = parseFloat(document.getElementById('incMax').value);
  if(!(alt >= altMin && alt <= altMax && inc >= incMin && inc <= incMax)){
    setStatus(`Filtrado (alt≈${alt.toFixed(0)}km, inc≈${inc.toFixed(1)}°)`);
    if(positionMarker){ map.removeLayer(positionMarker); positionMarker=null; }
    if(trackLine){ map.removeLayer(trackLine); trackLine=null; }
    lastGeoJSON = null;
    return;
  }

  // current position
  const now = new Date();
  const gmst = satellite.gstime(now);
  const pv = satellite.propagate(satrec, now);
  const geo = satellite.eciToGeodetic(pv.position, gmst);
  const lat = satellite.degreesLat(geo.latitude);
  const lon = satellite.degreesLong(geo.longitude);

  if(positionMarker){ map.removeLayer(positionMarker); }
  positionMarker = L.marker([lat,lon], { title: `${tle.name}` }).addTo(map)
    .bindPopup(`<b>${tle.name}</b><br/>Alt ≈ ${alt.toFixed(0)} km<br/>Inc ≈ ${inc.toFixed(1)}°`).openPopup();
  map.panTo([lat,lon], { animate:true });

  if(trackLine){ map.removeLayer(trackLine); trackLine=null; }
  if(document.getElementById('drawTrack').checked){
    const pts = groundTrack(satrec, 90, 60);
    trackLine = L.polyline(pts, { weight:2, opacity:0.8 }).addTo(map);
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
    const blocks = text.trim().split(/\r?\n(?=[^12])/); // split by name lines
    const select = document.getElementById('satSelect');
    select.innerHTML='';
    let count=0;
    for(const b of blocks){
      const lines = b.trim().split(/\r?\n/);
      if(lines.length>=3){
        const name = lines[0].trim();
        const l2 = lines[2].trim();
        const norad = l2.split(' ')[1].substring(0,5); // crude NORAD grab
        const opt = document.createElement('option');
        opt.value = norad; opt.textContent = name;
        select.appendChild(opt);
        if(++count>400) break; // limit for perf
      }
    }
    setStatus(`Activos cargados (${count})`);
  }catch(e){
    console.error(e);
    setStatus('Error al cargar activos');
  }
});

// auto
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

// initial
drawFor(document.getElementById('satSelect').value).catch(e=>{
  console.error(e); setStatus('Error inicial'); 
});
