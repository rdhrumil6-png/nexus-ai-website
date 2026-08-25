const canvas = document.getElementById('bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const particleCount = 1500;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
for(let i=0;i<particleCount;i++){
  const r = 2.3 + Math.random()*0.3;
  const theta = Math.random()*Math.PI*2;
  const phi = Math.acos((Math.random()*2)-1);
  positions[i*3] = r*Math.sin(phi)*Math.cos(theta);
  positions[i*3+1] = r*Math.sin(phi)*Math.sin(theta);
  positions[i*3+2] = r*Math.cos(phi);
}
geometry.setAttribute('position', new THREE.BufferAttribute(positions,3));
const material = new THREE.PointsMaterial({ size:0.02, color:0x00f0ff, transparent:true, opacity:0.7 });
const particles = new THREE.Points(geometry, material);
scene.add(particles);

let mouseX=0, mouseY=0;
document.addEventListener('mousemove', e => {
  mouseX = (e.clientX/window.innerWidth - 0.5) * 2;
  mouseY = (e.clientY/window.innerHeight - 0.5) * 2;
});

function animate(){
  requestAnimationFrame(animate);
  particles.rotation.y += 0.001;
  camera.position.x += (mouseX*0.3 - camera.position.x)*0.02;
  camera.position.y += (-mouseY*0.3 - camera.position.y)*0.02;
  camera.lookAt(scene.position);
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', ()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});