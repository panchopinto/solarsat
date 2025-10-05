
(() => {
  const el = document.getElementById('viewport');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070f);
  const camera = new THREE.PerspectiveCamera(60, el.clientWidth/el.clientHeight, 0.1, 2000);
  camera.position.set(0, 80, 180);

  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(el.clientWidth, el.clientHeight);
  el.appendChild(renderer.domElement);
  const controls = new THREE.OrbitControls(camera, renderer.domElement);

  // Lights
  const light = new THREE.PointLight(0xffffff, 2, 0);
  light.position.set(0,0,0);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x334455, .4));

  // Sun
  const sun = new THREE.Mesh(new THREE.SphereGeometry(16,32,32), new THREE.MeshBasicMaterial({color:0xffcc66}));
  scene.add(sun);

  function planet(radius, dist, speed, color){
    const g = new THREE.SphereGeometry(radius, 24, 24);
    const m = new THREE.MeshStandardMaterial({color});
    const mesh = new THREE.Mesh(g, m);
    const group = new THREE.Group();
    const ring = new THREE.RingGeometry(dist-0.2, dist+0.2, 64);
    const ringMesh = new THREE.Mesh(ring, new THREE.MeshBasicMaterial({color:0x294d8b, side:THREE.DoubleSide, transparent:true, opacity:.4}));
    ringMesh.rotation.x = Math.PI/2;
    group.add(ringMesh);
    group.add(mesh);
    mesh.position.x = dist;
    group.userData = {dist, speed, angle: Math.random()*Math.PI*2};
    scene.add(group);
    return group;
  }

  const planets = [
    planet(1.6, 24, 1.60, 0x9aa3a7), // Mercury
    planet(1.8, 30, 1.17, 0xd8b18d), // Venus
    planet(2.0, 36, 1.00, 0x4aa3ff), // Earth
    planet(1.5, 42, 0.80, 0xff6a3c), // Mars
    planet(6.0, 60, 0.43, 0xf0d29b), // Jupiter
    planet(5.0, 78, 0.32, 0xe8c487), // Saturn
    planet(3.6, 96, 0.23, 0x7cc7ff), // Uranus
    planet(3.4, 110, 0.18, 0x6cb3ff) // Neptune
  ];

  function animate(){
    requestAnimationFrame(animate);
    planets.forEach(g=>{
      g.userData.angle += 0.002 * g.userData.speed;
      const angle = g.userData.angle;
      const dist = g.userData.dist;
      g.children.forEach(obj=>{ if(obj.geometry && obj.geometry.type==='SphereGeometry'){ obj.position.set(Math.cos(angle)*dist, 0, Math.sin(angle)*dist); }});
    });
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', ()=>{
    const w = el.clientWidth, h = el.clientHeight;
    camera.aspect = w/h; camera.updateProjectionMatrix();
    renderer.setSize(w,h);
  });

  document.getElementById('present').addEventListener('click', ()=>{
    camera.position.set(0, 40, 120);
    controls.target.set(0,0,0); controls.update();
  });
})();
