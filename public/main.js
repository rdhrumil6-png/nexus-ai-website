/* ===== 3D TALKING AVATAR ===== */
const canvas = document.getElementById('bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Outer particle cloud
const particleCount = 2000;
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
const material = new THREE.PointsMaterial({ size:0.02, color:0x00f0ff, transparent:true, opacity:0.8 });
const particles = new THREE.Points(geometry, material);
scene.add(particles);

// AVATAR CORE — the "talking" glowing orb
const avatarGeo = new THREE.IcosahedronGeometry(1, 4);
const avatarMat = new THREE.MeshStandardMaterial({
  color: 0xa855f7,
  emissive: 0x6d28d9,
  emissiveIntensity: 0.6,
  wireframe: false,
  roughness: 0.3,
  metalness: 0.2
});
const avatar = new THREE.Mesh(avatarGeo, avatarMat);
scene.add(avatar);

// Wireframe overlay for extra tech look
const wireGeo = new THREE.IcosahedronGeometry(1.15, 2);
const wireMat = new THREE.MeshBasicMaterial({ color:0x00f0ff, wireframe:true, transparent:true, opacity:0.4 });
const wireSphere = new THREE.Mesh(wireGeo, wireMat);
scene.add(wireSphere);

// Lighting (needed for MeshStandardMaterial to look good)
const light1 = new THREE.PointLight(0x00f0ff, 2, 100);
light1.position.set(5, 5, 5);
scene.add(light1);
const light2 = new THREE.PointLight(0xa855f7, 2, 100);
light2.position.set(-5, -5, 5);
scene.add(light2);
scene.add(new THREE.AmbientLight(0x404040));

let mouseX=0, mouseY=0;
document.addEventListener('mousemove', e => {
  mouseX = (e.clientX/window.innerWidth - 0.5) * 2;
  mouseY = (e.clientY/window.innerHeight - 0.5) * 2;
});

// Avatar speaking state
let isSpeaking = false;
let pulseTime = 0;

function animate(){
  requestAnimationFrame(animate);
  particles.rotation.y += 0.0015;
  particles.rotation.x += 0.0005;
  wireSphere.rotation.y -= 0.003;
  wireSphere.rotation.x -= 0.001;

  // Base gentle rotation
  avatar.rotation.y += 0.004;

  // Pulse effect when speaking
  if(isSpeaking){
    pulseTime += 0.15;
    const scale = 1 + Math.sin(pulseTime) * 0.15;
    avatar.scale.set(scale, scale, scale);
    wireSphere.scale.set(scale*1.05, scale*1.05, scale*1.05);
    avatarMat.emissiveIntensity = 0.8 + Math.sin(pulseTime)*0.4;
  } else {
    avatar.scale.set(1,1,1);
    wireSphere.scale.set(1,1,1);
    avatarMat.emissiveIntensity = 0.6;
  }

  camera.position.x += (mouseX*0.5 - camera.position.x)*0.03;
  camera.position.y += (-mouseY*0.5 - camera.position.y)*0.03;
  camera.lookAt(scene.position);

  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', ()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ===== ASK AI (connects to backend) ===== */
const answerBox = document.getElementById('answerBox');
const answerText = document.getElementById('answerText');
const input = document.getElementById('question');
const askBtn = document.getElementById('askBtn');

async function askQuestion(){
  const q = input.value.trim();
  if(!q) return;

  answerBox.classList.add('show');
  answerText.textContent = "Thinking...";
  isSpeaking = true; // avatar starts pulsing

  try {
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q })
    });
    const data = await res.json();
    typeWriter(data.answer);
  } catch (err) {
    answerText.textContent = "Something went wrong. Please try again.";
    isSpeaking = false;
  }
}

function typeWriter(text){
  answerText.textContent = '';
  let i = 0;
  const interval = setInterval(()=>{
    answerText.textContent += text[i];
    i++;
    if(i>=text.length){
      clearInterval(interval);
      isSpeaking = false; // avatar stops pulsing when done
    }
  }, 15);
}

askBtn.addEventListener('click', askQuestion);
input.addEventListener('keypress', e => { if(e.key === 'Enter') askQuestion(); });

document.querySelectorAll('.chip').forEach(chip=>{
  chip.addEventListener('click', ()=>{
    input.value = chip.textContent;
    askQuestion();
  });
});
/* ===== VOICE INPUT ===== */
const micBtn = document.getElementById('micBtn');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  let isListening = false;

  micBtn.addEventListener('click', () => {
    if (isListening) {
      recognition.stop();
      return;
    }
    recognition.start();
  });

  recognition.onstart = () => {
    isListening = true;
    micBtn.classList.add('listening');
    micBtn.textContent = '⏹️';
  };

  recognition.onend = () => {
    isListening = false;
    micBtn.classList.remove('listening');
    micBtn.textContent = '🎤';
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    input.value = transcript;
    askQuestion(); // auto-ask after speaking
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    isListening = false;
    micBtn.classList.remove('listening');
    micBtn.textContent = '🎤';
  };

} else {
  micBtn.style.display = 'none';
  console.warn('Speech Recognition not supported in this browser. Try Chrome!');
}