import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const canvas = document.querySelector('#game-canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x91a9b0);
scene.fog = new THREE.FogExp2(0x91a9b0, 0.0085);
const camera = new THREE.PerspectiveCamera(76, innerWidth / innerHeight, 0.08, 380);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

scene.add(new THREE.HemisphereLight(0xc9f0ee, 0x263344, 2.0));
const sun = new THREE.DirectionalLight(0xffd0a1, 3.4);
sun.position.set(-35, 54, 24);
scene.add(sun);
const fill = new THREE.DirectionalLight(0x59d9dd, 1.5);
fill.position.set(35, 13, -45);
scene.add(fill);

const mat = (color, roughness = .72, metalness = .08, emissive = 0x000000) => new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity: emissive ? 1.15 : 0 });
const concrete = mat(0x26353c, .86, .18), concrete2 = mat(0x35454a, .82, .18), dark = mat(0x111f28, .75, .35), glass = new THREE.MeshStandardMaterial({ color:0x264951, roughness:.28, metalness:.6, transparent:true, opacity:.72 }), cyan = mat(0x65e8df,.34,.35,0x27aaa5), orange = mat(0xff8a55,.4,.24,0xaa3e1b), white = mat(0xdce9dd,.54,.24);
const boxGeo = new THREE.BoxGeometry(1,1,1);
function box(parent, x,y,z, sx,sy,sz, material, cast=false) { const m=new THREE.Mesh(boxGeo,material); m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=cast;m.receiveShadow=true;parent.add(m);return m; }

// A warm, hazy late-afternoon sky and a soft, oversized sun.
const skyGeo = new THREE.SphereGeometry(230, 32, 18);
const skyMat = new THREE.ShaderMaterial({ side:THREE.BackSide, uniforms:{top:{value:new THREE.Color(0x365a72)},horizon:{value:new THREE.Color(0xf0b990)},bottom:{value:new THREE.Color(0x9ab3b5)}}, vertexShader:'varying vec3 vWorld; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vWorld=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }', fragmentShader:'uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom; varying vec3 vWorld; void main(){ float h=normalize(vWorld).y; float t=smoothstep(-.16,.52,h); vec3 c=mix(horizon,top,t); c=mix(bottom,c,smoothstep(-.35,-.05,h)); gl_FragColor=vec4(c,1.0); }' });
scene.add(new THREE.Mesh(skyGeo,skyMat));
const sunBall=new THREE.Mesh(new THREE.SphereGeometry(7,24,16),new THREE.MeshBasicMaterial({color:0xffd5a5}));sunBall.position.set(-60,37,-135);scene.add(sunBall);
const sunGlow=new THREE.Mesh(new THREE.SphereGeometry(12,24,16),new THREE.MeshBasicMaterial({color:0xffad7d,transparent:true,opacity:.18,depthWrite:false}));sunGlow.position.copy(sunBall.position);scene.add(sunGlow);

// City canyon: varied blocks, lit windows, antennas, and distant silhouette.
const city = new THREE.Group(); scene.add(city);
let seed=91713; const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const buildingMats=[0x243b48,0x2d4550,0x334952,0x1d3441,0x40525a].map(c=>mat(c,.88,.18));
const windowMat=new THREE.MeshBasicMaterial({color:0xffbd83,transparent:true,opacity:.48});
for(let side of [-1,1]){
  for(let i=0;i<78;i++){
    const z=24-i*3.35-rand()*2, w=6+rand()*12, d=6+rand()*10, h=10+rand()*45;
    const x=side*(15+rand()*17+w*.38), y=h/2-1.4;
    box(city,x,y,z,w,h,d,buildingMats[Math.floor(rand()*buildingMats.length)]);
    // Simple roof lips and scattered rooftop structures.
    if(rand()>.62){box(city,x,y+h/2+.24,z,w*.84,.48,d*.84,concrete2);box(city,x+side*w*.18,y+h/2+1.6,z,w*.18,2.4,d*.16,dark);}
    if(i<39){
      const rows=Math.floor(Math.min(h/3,10));
      for(let r=1;r<rows;r+=2){for(let c=0;c<Math.max(1,Math.floor(w/3));c++)if(rand()>.42){const wx=x-w*.36+c*2.7;box(city,wx,y-h*.42+r*2.5,z-d*.501,.75,.9,.025,windowMat);}}
    }
  }
}
// Rooftop course pieces. Platform tops are the only walkable surfaces.
const platforms=[];
function platform(x,z,y,w,d,{checkpoint=false,finish=false,material=concrete,trim=cyan}={}){
  const h=.8, g=new THREE.Group();scene.add(g);
  box(g,x,y-h/2,z,w,h,d,material,true);
  // illuminated edge rails and inset top details
  const top=y+.015;
  box(g,x,top,z-d/2+.08,w,.055,.12,trim);
  box(g,x,top,z+d/2-.08,w,.055,.12,trim);
  box(g,x-w/2+.06,top,z,.12,.055,d-.2,trim);
  box(g,x+w/2-.06,top,z,.12,.055,d-.2,trim);
  box(g,x, y+.018,z,w*.31,.018,.12,white);
  if(checkpoint||finish){
    const archMat=checkpoint?cyan:orange;
    for(const s of [-1,1])box(g,x+s*w*.42,y+1.55,z,.15,3.1,.18,archMat);
    box(g,x,y+3.1,z,w*.84,.14,.18,archMat);
    for(let i=-1;i<=1;i++)box(g,x+i*w*.22,y+3.32,z,.11,.38,.12,archMat);
  }
  if(checkpoint){
    // Oversized cyan landing beacon.
    const ring=new THREE.Mesh(new THREE.TorusGeometry(1.05,.055,8,36),new THREE.MeshBasicMaterial({color:0x71fff2}));ring.rotation.x=Math.PI/2;ring.position.set(x,y+.12,z);g.add(ring);
  }
  if(finish){for(let i=0;i<7;i++)box(g,x-w*.38+i*w*.126,y+.05,z,.08,.08,d*.6,i%2?white:orange);}
  platforms.push({x,z,y,w,d,checkpoint,finish});
}
platform(0,5,0,10,17,{material:concrete2});
platform(0,-8,0,4.8,4.4);
platform(2.2,-14,0.65,4.1,4.3,{material:concrete2});
platform(-1.6,-20.3,1.25,4.1,4.1);
platform(-1.8,-26.4,1.25,4.7,4.3);
platform(0,-34,1.25,10,9,{checkpoint:true,material:concrete2});
platform(2.4,-43,1.95,4.2,4.2);
platform(-1.8,-49.3,1.3,4.1,4.1,{material:concrete2});
platform(-2.2,-55.5,1.3,4.1,4.4);
platform(1.8,-62,2.05,4.1,4.4);
platform(1.8,-68.2,2.05,4.5,4.1);
platform(-1.7,-74.7,1.35,4.1,4.3,{material:concrete2});
platform(0,-82,1.35,10,8,{checkpoint:true,material:concrete2});
platform(-2.1,-91,2.15,4.1,4.1);
platform(1.9,-97.5,2.85,4.1,4.1);
platform(2,-103.7,2.85,4.5,4.2);
platform(-1.7,-110.3,2.1,4.1,4.1);
platform(0,-117.5,2.1,12,10,{finish:true,material:concrete2,trim:orange});

// Structural rooftop furniture along the playable line and adjacent towers.
for(let z=-2;z>-120;z-=13){
  for(const s of [-1,1]){
    const x=s*(7.3+rand()*2.2), yy=rand()*2.3;
    box(scene,x,yy+.7,z,2.2,1.4,2.3,dark);
    box(scene,x,yy+1.43,z,2.25,.06,2.34,rand()>.5?cyan:orange);
    if(rand()>.48){box(scene,x+s*1.1,yy+2.7,z,.08,2.5,.08,white);}
  }
}
// Small colored wayfinding beacons floating over checkpoint pads.
function beacon(x,y,z,color){const b=new THREE.PointLight(color,18,18,2);b.position.set(x,y,z);scene.add(b);const s=new THREE.Mesh(new THREE.OctahedronGeometry(.25),new THREE.MeshBasicMaterial({color}));s.position.copy(b.position);scene.add(s);return s;}
beacon(0,5,-34,0x59fff1);beacon(0,5,-82,0x59fff1);beacon(0,6,-117,0xff8a55);

const TOTAL=122, EYE=1.68;
const player={pos:new THREE.Vector3(0,EYE,4),vel:new THREE.Vector3(),yaw:0,pitch:-.035,grounded:true,groundY:0,coyote:.12,jumpBuffer:0,sprinting:false};
camera.position.copy(player.pos);
let started=false,finished=false,paused=false,elapsed=0,checkpoint={x:0,y:0,z:4.2,progress:0},lastCheckpoint=-1,toastTimeout=0;
const startScreen=document.querySelector('#start-screen'),pausePanel=document.querySelector('#pause-panel'),finishPanel=document.querySelector('#finish-panel'),hud=document.querySelector('#hud');
const distanceEl=document.querySelector('#distance'),progressFill=document.querySelector('#progress-fill'),speedFill=document.querySelector('#speed-fill'),speedValue=document.querySelector('#speed-value'),clockEl=document.querySelector('#clock'),checkpointText=document.querySelector('#checkpoint-text'),toastEl=document.querySelector('#toast');
const bestKey='skyline-free-run-best';let best=Number(localStorage.getItem(bestKey)||0);
function formatTime(t){const mm=Math.floor(t/60),ss=Math.floor(t%60),cs=Math.floor((t%1)*100);return `${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;}
function showBest(){const text=best?formatTime(best):'—:—.—';document.querySelector('#best-time').textContent=text;document.querySelector('#finish-best').textContent=text;}
showBest();
function toast(text){toastEl.textContent=text;toastEl.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>toastEl.classList.remove('show'),1700);}
const keys={};
function begin(){if(started)return;started=true;startScreen.classList.add('hidden');if(innerWidth>700)canvas.requestPointerLock?.();}
document.querySelector('#start-button').addEventListener('click',begin);
document.querySelector('#resume-button').addEventListener('click',()=>{paused=false;pausePanel.classList.remove('visible');canvas.requestPointerLock?.();});
document.querySelector('#restart-button').addEventListener('click',()=>location.reload());
document.addEventListener('pointerlockchange',()=>{if(started&&!finished&&innerWidth>700){paused=document.pointerLockElement!==canvas;pausePanel.classList.toggle('visible',paused);}});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas&&!paused){player.yaw-=e.movementX*.00235;player.pitch-=e.movementY*.0019;player.pitch=THREE.MathUtils.clamp(player.pitch,-1.22,1.22);}});
document.addEventListener('keydown',e=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='Space'&&!e.repeat)player.jumpBuffer=.16;if(e.code==='Enter'&&!started)begin();if(e.code==='Escape'&&innerWidth<=700&&started){paused=!paused;pausePanel.classList.toggle('visible',paused);}});
document.addEventListener('keyup',e=>keys[e.code]=false);

// Touch controls: left thumb joystick, right half drag-to-look, dedicated jump and sprint.
const mobile=innerWidth<=700, joy=document.querySelector('#joystick'),knob=document.querySelector('#joy-knob'),jumpButton=document.querySelector('#jump-button'),sprintButton=document.querySelector('#sprint-button');
const touch={x:0,y:0,joyId:null,lookId:null,lastX:0,lastY:0,jump:false,sprint:false};
function joyMove(e){const r=joy.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),len=Math.hypot(dx,dy),scale=len>34?34/len:1;touch.x=THREE.MathUtils.clamp(dx/34,-1,1);touch.y=THREE.MathUtils.clamp(dy/34,-1,1);knob.style.left=`calc(50% + ${dx*scale}px)`;knob.style.top=`calc(50% + ${dy*scale}px)`;}
joy.addEventListener('pointerdown',e=>{e.preventDefault();touch.joyId=e.pointerId;joy.setPointerCapture(e.pointerId);joyMove(e);});joy.addEventListener('pointermove',e=>{if(touch.joyId===e.pointerId)joyMove(e);});
function releaseJoy(e){if(touch.joyId===e.pointerId){touch.joyId=null;touch.x=touch.y=0;knob.style.left='50%';knob.style.top='50%';}}
joy.addEventListener('pointerup',releaseJoy);joy.addEventListener('pointercancel',releaseJoy);
jumpButton.addEventListener('pointerdown',e=>{e.preventDefault();touch.jump=true;player.jumpBuffer=.16;});jumpButton.addEventListener('pointerup',()=>touch.jump=false);jumpButton.addEventListener('pointercancel',()=>touch.jump=false);
sprintButton.addEventListener('pointerdown',e=>{e.preventDefault();touch.sprint=true;});sprintButton.addEventListener('pointerup',()=>touch.sprint=false);sprintButton.addEventListener('pointercancel',()=>touch.sprint=false);
canvas.addEventListener('pointerdown',e=>{if(!mobile||!started||startScreen.classList.contains('hidden')===false)return;if(mobile&&e.clientX>innerWidth*.35){touch.lookId=e.pointerId;touch.lastX=e.clientX;touch.lastY=e.clientY;canvas.setPointerCapture(e.pointerId);}});
canvas.addEventListener('pointermove',e=>{if(touch.lookId===e.pointerId){player.yaw-=(e.clientX-touch.lastX)*.004;player.pitch=THREE.MathUtils.clamp(player.pitch-(e.clientY-touch.lastY)*.003,-1.22,1.22);touch.lastX=e.clientX;touch.lastY=e.clientY;}});
canvas.addEventListener('pointerup',e=>{if(touch.lookId===e.pointerId)touch.lookId=null;});canvas.addEventListener('pointercancel',e=>{if(touch.lookId===e.pointerId)touch.lookId=null;});

function respawn(){player.pos.set(checkpoint.x,checkpoint.y+EYE,checkpoint.z);player.vel.set(0,0,0);player.grounded=true;player.groundY=checkpoint.y;toast('BACK ON THE LINE');}
function finish(){finished=true;document.exitPointerLock?.();const result=formatTime(elapsed);document.querySelector('#finish-time').textContent=result;if(!best||elapsed<best){best=elapsed;localStorage.setItem(bestKey,String(best));}showBest();finishPanel.classList.add('visible');}
function update(dt){if(!started||finished||paused)return;
  elapsed+=dt;clockEl.textContent=formatTime(elapsed);
  const forward=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-touch.y;
  const strafe=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+touch.x;
  const sprint=keys.ShiftLeft||keys.ShiftRight||touch.sprint;player.sprinting=sprint;
  const speed=sprint?10.3:7.3;
  const fwd=new THREE.Vector3(-Math.sin(player.yaw),0,-Math.cos(player.yaw));
  const right=new THREE.Vector3(Math.cos(player.yaw),0,-Math.sin(player.yaw));
  const input=new THREE.Vector3().addScaledVector(fwd,forward).addScaledVector(right,strafe);if(input.lengthSq()>1)input.normalize();
  const accel=player.grounded?26:10;const targetX=input.x*speed,targetZ=input.z*speed;
  player.vel.x=THREE.MathUtils.damp(player.vel.x,targetX,accel,dt);player.vel.z=THREE.MathUtils.damp(player.vel.z,targetZ,accel,dt);
  player.jumpBuffer=Math.max(0,player.jumpBuffer-dt);player.coyote=player.grounded?.12:Math.max(0,player.coyote-dt);
  if(player.jumpBuffer>0&&player.coyote>0){player.vel.y=8.05+(sprint?.4:0);player.grounded=false;player.coyote=0;player.jumpBuffer=0;}
  const oldFoot=player.pos.y-EYE;player.vel.y-=20*dt;player.pos.addScaledVector(player.vel,dt);
  player.grounded=false;
  for(const p of platforms){
    const foot=player.pos.y-EYE;
    if(player.vel.y<=0&&oldFoot>=p.y-.04&&foot<=p.y&&Math.abs(player.pos.x-p.x)<p.w/2+.23&&Math.abs(player.pos.z-p.z)<p.d/2+.23){player.pos.y=p.y+EYE;player.vel.y=0;player.grounded=true;player.groundY=p.y;break;}
  }
  // Slight air control and speed cap keeps long jumps readable.
  const horizontal=Math.hypot(player.vel.x,player.vel.z);if(horizontal>11){player.vel.x*=11/horizontal;player.vel.z*=11/horizontal;}
  if(player.pos.y< -14 || Math.abs(player.pos.x)>36 || player.pos.z>18){respawn();}
  for(let i=0;i<platforms.length;i++){const p=platforms[i];if(p.checkpoint&&i!==lastCheckpoint&&player.pos.z<p.z+1.2&&player.pos.z>p.z-p.d/2-1&&Math.abs(player.pos.x-p.x)<p.w/2+1){lastCheckpoint=i;checkpoint={x:p.x,y:p.y,z:p.z+p.d*.32,progress:Math.max(0,-p.z)};checkpointText.textContent=`CHECKPOINT ${i===5?'01':'02'}`;toast('CHECKPOINT // SAVED');}}
  const distance=Math.min(TOTAL,Math.max(0,Math.floor(-player.pos.z+4)));distanceEl.textContent=String(distance).padStart(3,'0');progressFill.style.width=`${Math.min(100,distance/TOTAL*100)}%`;
  const momentum=Math.hypot(player.vel.x,player.vel.z);speedValue.textContent=momentum.toFixed(1);speedFill.style.width=`${Math.min(100,momentum/10.5*100)}%`;
  if(player.pos.z<-121&&player.grounded)finish();
}
const clock=new THREE.Clock();
function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.035);update(dt);
  camera.position.copy(player.pos);camera.rotation.order='YXZ';camera.rotation.y=player.yaw;camera.rotation.x=player.pitch;
  // Sprint rush subtly widens the field of view.
  const desiredFov=player.sprinting&&started&&!paused?81:76;camera.fov=THREE.MathUtils.damp(camera.fov,desiredFov,5,dt);camera.updateProjectionMatrix();
  // Gentle moving beacon glow and subtle bob while grounded.
  const t=performance.now()*.001;scene.children.forEach(o=>{if(o.isMesh&&o.geometry.type==='OctahedronGeometry')o.rotation.y=t*.7;});
  renderer.render(scene,camera);
}
frame();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));});
