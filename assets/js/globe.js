
(() => {
  const el = document.getElementById('globe');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070f);
  const camera = new THREE.PerspectiveCamera(60, el.clientWidth/el.clientHeight, 0.1, 2000);
  camera.position.set(0, 0, 3.2);
  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(el.clientWidth, el.clientHeight);
  el.appendChild(renderer.domElement);
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const light = new THREE.DirectionalLight(0xffffff, 1.2);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x223344,.3));

  const loader = new THREE.TextureLoader();
  const texDay = loader.load('https://raw.githubusercontent.com/ubilabs/threejs-earth/master/images/2_no_clouds_4k.jpg');
  const texNight = loader.load('https://raw.githubusercontent.com/ubilabs/threejs-earth/master/images/earth_lights_lrg.jpg');
  const texBump = loader.load('https://raw.githubusercontent.com/ubilabs/threejs-earth/master/images/elev_bump_4k.jpg');
  const texSpec = loader.load('https://raw.githubusercontent.com/ubilabs/threejs-earth/master/images/water_4k.png');

  // Simple shader mix: day/night based on light direction
  const vertex = `
    varying vec3 vNormal;
    varying vec3 vPos;
    void main(){
      vNormal = normalize(normalMatrix * normal);
      vPos = (modelViewMatrix * vec4(position,1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `;
  const fragment = `
    uniform sampler2D dayTex;
    uniform sampler2D nightTex;
    uniform vec3 lightDir;
    varying vec3 vNormal;
    varying vec3 vPos;
    void main(){
      vec3 n = normalize(vNormal);
      float d = max(dot(n, normalize(lightDir)), -1.0);
      vec2 uv = vec2(atan(n.z, n.x)/(2.0*3.1415926)+0.5, asin(n.y)/3.1415926+0.5);
      vec3 day = texture2D(dayTex, uv).rgb;
      vec3 night = texture2D(nightTex, uv).rgb;
      float k = smoothstep(-0.2, 0.2, d);
      vec3 col = mix(night, day, k);
      gl_FragColor = vec4(col,1.0);
    }
  `;

  const geo = new THREE.SphereGeometry(1, 64, 64);
  const mat = new THREE.ShaderMaterial({
    uniforms:{
      dayTex:{value:texDay},
      nightTex:{value:texNight},
      lightDir:{value:new THREE.Vector3(1,0,0)}
    },
    vertexShader:vertex,
    fragmentShader:fragment
  });
  const earth = new THREE.Mesh(geo, mat);
  earth.rotation.y = Math.PI;
  scene.add(earth);

  // Clouds (optional faint sphere)
  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(1.01,64,64),
    new THREE.MeshPhongMaterial({transparent:true, opacity:0.12, depthWrite:false})
  );
  scene.add(clouds);

  function sunDirectionFromTime(date){
    // Approximate Sun direction in ECEF-like coords: rotate around Y over a day, slight tilt
    const t = date.getUTCHours() + date.getUTCMinutes()/60.0;
    const ang = t/24.0 * Math.PI*2;
    const tilt = 23.4 * Math.PI/180.0;
    const dir = new THREE.Vector3(Math.cos(ang), Math.sin(tilt)*Math.sin(ang), Math.sin(ang));
    return dir.normalize();
  }

  function animate(){
    requestAnimationFrame(animate);
    controls.update();
    const dir = sunDirectionFromTime(new Date());
    light.position.copy(dir.multiplyScalar(100));
    mat.uniforms.lightDir.value.copy(light.position.clone().normalize());
    earth.rotation.y += 0.0005;
    clouds.rotation.y += 0.0004;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', ()=>{
    const w = el.clientWidth, h = el.clientHeight;
    camera.aspect = w/h; camera.updateProjectionMatrix();
    renderer.setSize(w,h);
  });
})();
