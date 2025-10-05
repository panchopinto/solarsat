
import { el, on, captureCanvas, setTheme, clamp } from './ui.js';

let scene, camera, renderer, earth, atmosphere, satellites = [], orbitLines = [];
const R_EARTH = 6371; // km
const SCALE = 100; // 1 unit = 100 km

let filters = { altMin: 0, altMax: 40000, incMin: 0, incMax: 180 };

async function init(){
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 100000);
  camera.position.set(0, R_EARTH/1.5, R_EARTH*3/2);

  renderer = new THREE.WebGLRenderer({ antialias:true, preserveDrawingBuffer:true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(devicePixelRatio);
  document.querySelector('.canvas-wrap').appendChild(renderer.domElement);

  window.addEventListener('resize', ()=>{
    camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  // Lights
  const light = new THREE.DirectionalLight(0xffffff, 1.2);
  light.position.set(5,2,5); scene.add(light);
  scene.add(new THREE.AmbientLight(0x404040, 0.8));

  // Earth
  const texLoader = new THREE.TextureLoader();
  const earthTex = texLoader.load('https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg');
  const earthGeo = new THREE.SphereGeometry(R_EARTH/SCALE, 64, 64);
  const earthMat = new THREE.MeshPhongMaterial({ map: earthTex });
  earth = new THREE.Mesh(earthGeo, earthMat);
  scene.add(earth);

  // Atmosphere glow
  const atmGeo = new THREE.SphereGeometry(R_EARTH/SCALE*1.02, 64, 64);
  const atmMat = new THREE.MeshBasicMaterial({ color:0x3ea3ff, transparent:true, opacity:0.1 });
  atmosphere = new THREE.Mesh(atmGeo, atmMat); scene.add(atmosphere);

  // Controls
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.05;

  // Stars backdrop
  const starsGeo = new THREE.SphereGeometry(5000, 32, 32);
  const starsMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, map: texLoader.load('https://threejs.org/examples/textures/galaxy_starfield.png') });
  const stars = new THREE.Mesh(starsGeo, starsMat); scene.add(stars);

  setTheme(true);
  animate();
}

function animate(){
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function clearSatellites(){
  satellites.forEach(s=>scene.remove(s.mesh));
  orbitLines.forEach(l=>scene.remove(l));
  satellites = []; orbitLines = [];
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
  // inclination in degrees
  const inc = satrec.inclo * 180/Math.PI;
  if(inc < filters.incMin || inc > filters.incMax) return false;
  // altitude from current position
  const now = new Date();
  const pf = satellite.propagate(satrec, now);
  if(!pf.position) return false;
  const rmag = Math.sqrt(pf.position.x*pf.position.x + pf.position.y*pf.position.y + pf.position.z*pf.position.z);
  const alt = rmag - R_EARTH;
  if(alt < filters.altMin || alt > filters.altMax) return false;
  return true;
}

function addSatelliteFromTLE(block, color=0x00e5ff){
  const satrec = satellite.twoline2satrec(block.l1, block.l2);
  if(!passFilters(satrec)) return;

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(40/SCALE, 12, 12), new THREE.MeshBasicMaterial({color}));
  scene.add(mesh);

  // orbit path (sample points)
  const points = [];
  const now = new Date();
  for(let t=0; t<=120; t+=3){
    const time = new Date(now.getTime() + t*60*1000);
    const pf = satellite.propagate(satrec, time);
    if(pf.position){
      const v3 = eciToThree(pf.position);
      points.push(v3);
    }
  }
  if(points.length>2){
    const curve = new THREE.CatmullRomCurve3(points, false);
    const geom = new THREE.TubeGeometry(curve, 240, 8/SCALE, 8, false);
    const mat = new THREE.MeshBasicMaterial({ color:0x3556ff, transparent:true, opacity:0.4 });
    const tube = new THREE.Mesh(geom, mat);
    scene.add(tube); orbitLines.push(tube);
  }

  satellites.push({ name:block.name, satrec, mesh, color });
}

function eciToThree(eci){
  const x = eci.x, y = eci.y, z = eci.z; // km
  return new THREE.Vector3(x/SCALE, y/SCALE, z/SCALE);
}

function updateSatelliteMeshes(){
  const now = new Date();
  for(const s of satellites){
    const pf = satellite.propagate(s.satrec, now);
    if(!pf.position) continue;
    const v3 = eciToThree(pf.position);
    s.mesh.position.copy(v3);
  }
}
setInterval(updateSatelliteMeshes, 1000);

async function loadGroup(group){
  el('#loading').classList.remove('hidden');
  try{
    const url = `https://celestrak.org/NORAD/elements/gp.php?GROUP=${encodeURIComponent(group)}&FORMAT=tle`;
    const txt = await fetch(url).then(r=>r.text());
    clearSatellites();
    const blocks = tleBlocks(txt);
    let count=0;
    for(const b of blocks){
      addSatelliteFromTLE(b, 0x00e5ff);
    }
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
    if(blocks.length===0) { alert('No se encontró TLE para ese NORAD ID'); return; }
    blocks.forEach(b=> addSatelliteFromTLE(b, 0xffd166));
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

window.SATVIEW = { init, loadGroup, loadNORAD, capture: ()=>captureCanvas(document.querySelector('canvas'), 'satelites.png'), setFilters };
