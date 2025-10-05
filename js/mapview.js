
import { el, on } from './ui.js';

let map, layerGroup, markers = [];
const R_EARTH = 6371; // km
let satellites = [];
let filters = { altMin: 0, altMax: 40000, incMin: 0, incMax: 180 };
let trackDurationMin = 120; // predicción en minutos

function init(){
  map = L.map('map', { worldCopyJump:true, zoomControl:true, attributionControl:true }).setView([0,0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 7,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);
  layerGroup = L.layerGroup().addTo(map);
  setInterval(updateSatPositions, 1000);
}

function clearSatellites(){
  satellites = [];
  layerGroup.clearLayers();
  markers = [];
}

function tleBlocks(tleText){
  const lines = tleText.trim().split('\n').map(s=>s.trim()).filter(Boolean);
  const blocks = [];
  for(let i=0;i<lines.length-2;i++){
    if(lines[i].length>0 && lines[i+1].startsWith('1 ') && lines[i+2].startsWith('2 ')){
      blocks.push({name: lines[i], l1:lines[i+1], l2:lines[i+2]});
      i += 2;
    }
  }
  return blocks;
}

function passFilters(satrec){
  const inc = satrec.inclo * 180/Math.PI;
  if(inc < filters.incMin || inc > filters.incMax) return false;
  const now = new Date();
  const pf = satellite.propagate(satrec, now);
  if(!pf.position) return false;
  const rmag = Math.hypot(pf.position.x, pf.position.y, pf.position.z);
  const alt = rmag - R_EARTH;
  if(alt < filters.altMin || alt > filters.altMax) return false;
  return true;
}

function eciToLatLon(eci, date){
  const gmst = satellite.gstime(date);
  const gd = satellite.eciToGeodetic(eci, gmst);
  const lat = satellite.degreesLat(gd.latitude);
  const lon = satellite.degreesLong(gd.longitude);
  const alt = gd.height; // km
  return {lat, lon, alt};
}

function addSatellite(block, color='#00e5ff'){
  const satrec = satellite.twoline2satrec(block.l1, block.l2);
  if(!passFilters(satrec)) return;

  // Marker + ground track
  const marker = L.circleMarker([0,0], { radius:4, color:color, weight:2, fillOpacity:0.8 });
  marker.addTo(layerGroup).bindTooltip(`${block.name}`, {direction:'top'});
  const track = L.polyline([], { color:'#3556ff', weight:2, opacity:0.6 }).addTo(layerGroup);

  satellites.push({ name:block.name, satrec, marker, track, color });
  updateTrackForSatellite(satellites[satellites.length-1]);
}

function updateTrackForSatellite(s){
  const now = new Date();
  const pts = [];
  for(let t=-10; t<=trackDurationMin; t+=2){
    const time = new Date(now.getTime() + t*60*1000);
    const pf = satellite.propagate(s.satrec, time);
    if(!pf.position) continue;
    const ll = eciToLatLon(pf.position, time);
    // normalizar longitudes para evitar saltos
    pts.push([ll.lat, ll.lon]);
  }
  s.track.setLatLngs(pts);
}

function updateSatPositions(){
  const now = new Date();
  for(const s of satellites){
    const pf = satellite.propagate(s.satrec, now);
    if(!pf.position) continue;
    const ll = eciToLatLon(pf.position, now);
    s.marker.setLatLng([ll.lat, ll.lon]);
  }
}

async function loadGroup(group){
  el('#loading').classList.remove('hidden');
  try{
    const url = `https://celestrak.org/NORAD/elements/gp.php?GROUP=${encodeURIComponent(group)}&FORMAT=tle`;
    const txt = await fetch(url).then(r=>r.text());
    clearSatellites();
    const blocks = tleBlocks(txt).slice(0, 400);
    blocks.forEach(b=> addSatellite(b, '#00e5ff'));
    el('#sat-count').textContent = satellites.length;
    el('#last-group').textContent = group.toUpperCase();
  }catch(e){
    alert('Error cargando TLEs: '+e);
  }finally{
    el('#loading').classList.add('hidden');
  }
}

async function loadNORAD(id){
  el('#loading').classList.remove('hidden');
  try{
    const url = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${encodeURIComponent(id)}&FORMAT=tle`;
    const txt = await fetch(url).then(r=>r.text());
    const blocks = tleBlocks(txt);
    if(blocks.length===0) { alert('No se encontró TLE'); return; }
    blocks.forEach(b=> addSatellite(b, '#ffd166'));
    el('#sat-count').textContent = satellites.length;
    el('#last-group').textContent = 'NORAD';
  }catch(e){
    alert('Error: '+e);
  }finally{
    el('#loading').classList.add('hidden');
  }
}

function setFilters({altMin, altMax, incMin, incMax}){
  filters.altMin = Number(altMin); filters.altMax = Number(altMax);
  filters.incMin = Number(incMin); filters.incMax = Number(incMax);
}

window.MAPVIEW = { init, loadGroup, loadNORAD, setFilters, updateTrackForSatellite };
