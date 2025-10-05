
import { setTheme } from './ui.js';

let scene, camera, renderer;
const AU = 149597870; // km
const SCALE = 4000000; // km per unit
const PLANETS = [
  {name:'Mercurio', color:0xb6b6b6, radius: 2440, dist: 0.39*AU, speed: 4.74},
  {name:'Venus',    color:0xe0d6a8, radius: 6052, dist: 0.72*AU, speed: 3.50},
  {name:'Tierra',   color:0x3fa7ff, radius: 6371, dist: 1.00*AU, speed: 2.98},
  {name:'Marte',    color:0xe07a63, radius: 3390, dist: 1.52*AU, speed: 2.41},
  {name:'Júpiter',  color:0xd4a373, radius:69911, dist: 5.20*AU, speed: 1.31},
  {name:'Saturno',  color:0xf1dca7, radius:58232, dist: 9.58*AU, speed: 0.97},
  {name:'Urano',    color:0x9ad0f5, radius:25362, dist:19.20*AU, speed: 0.68},
  {name:'Neptuno',  color:0x6da8ff, radius:24622, dist:30.05*AU, speed: 0.54},
];
const meshes = [];

async function init(){
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 1e9);
  camera.position.set(0, 30, 90);

  renderer = new THREE.WebGLRenderer({ antialias:true, preserveDrawingBuffer:true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(devicePixelRatio);
  document.querySelector('.canvas-wrap').appendChild(renderer.domElement);

  window.addEventListener('resize', ()=>{
    camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  const light = new THREE.PointLight(0xffffff, 2, 0, 2);
  light.position.set(0,0,0); scene.add(light);

  const starTex = new THREE.TextureLoader().load('https://threejs.org/examples/textures/galaxy_starfield.png');
  const stars = new THREE.Mesh(
    new THREE.SphereGeometry(1e7, 32, 32),
    new THREE.MeshBasicMaterial({ map:starTex, side:THREE.BackSide })
  ); scene.add(stars);

  const sunTex = new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/sun.png');
  const sun = new THREE.Mesh(new THREE.SphereGeometry(696340/SCALE, 64, 64), new THREE.MeshBasicMaterial({ map: sunTex }));
  scene.add(sun);

  for(const p of PLANETS){
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(Math.max(2, p.radius/SCALE), 48, 48),
      new THREE.MeshPhongMaterial({ color: p.color })
    );
    m.userData = { angle: Math.random()*Math.PI*2, speed: p.speed/50, radius: p.dist/SCALE, name: p.name };
    const ring = new THREE.Mesh(new THREE.RingGeometry(m.userData.radius-0.1, m.userData.radius+0.1, 256), new THREE.MeshBasicMaterial({ color:0x2d3966, side:THREE.DoubleSide }));
    ring.rotation.x = Math.PI/2; scene.add(ring);
    scene.add(m); meshes.push(m);
  }

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.05;

  setTheme(true);
  animate();
}

function animate(){
  requestAnimationFrame(animate);
  for(const m of meshes){
    const d = m.userData.radius;
    m.userData.angle += m.userData.speed;
    m.position.set( Math.cos(m.userData.angle)*d, 0, Math.sin(m.userData.angle)*d );
    m.rotation.y += 0.01;
  }
  renderer.render(scene, camera);
}

window.PLANETS = { init };
