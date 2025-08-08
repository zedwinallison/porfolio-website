import * as THREE from 'three';
import { GLTFLoader } from 'GLTFLoader';

const section = document.getElementById('threejs-section');
const scene = new THREE.Scene();

// --- Loading overlay setup ---
const loadingOverlay = document.createElement('div');
loadingOverlay.style.position = 'absolute';
loadingOverlay.style.top = '0';
loadingOverlay.style.left = '0';
loadingOverlay.style.width = '100%';
loadingOverlay.style.height = '100%';
loadingOverlay.style.display = 'flex';
loadingOverlay.style.alignItems = 'center';
loadingOverlay.style.justifyContent = 'center';
loadingOverlay.style.background = 'url("assets/blur-placeholder.png") center center / cover no-repeat';
loadingOverlay.style.zIndex = '10';
loadingOverlay.style.transition = 'opacity 0.5s ease';

// Add a video or GIF inside it
const loadingVideo = document.createElement('video'); // Or use document.createElement('img') for GIF
loadingVideo.src = 'assets/controls.webm'; // Or 'assets/controls.gif'
loadingVideo.autoplay = true;
loadingVideo.loop = true;
loadingVideo.muted = true;
loadingVideo.style.maxWidth = '200px';
loadingOverlay.appendChild(loadingVideo);

// Add overlay to the section
section.style.position = 'relative'; // Ensure parent is positioned
section.appendChild(loadingOverlay);


// --- SKYBOX
const textureLoader = new THREE.TextureLoader();
textureLoader.load('assets/sky.png', function (texture) {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.encoding = THREE.sRGBEncoding;
  scene.background = texture;
});

const camera = new THREE.PerspectiveCamera(
  50,
  section.clientWidth / section.clientHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(section.clientWidth, section.clientHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
section.appendChild(renderer.domElement);

// Floor
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color: 0x222222 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Load GLB Model
const loader = new GLTFLoader();
loader.load(
  'assets/courtyard.glb',
  (gltf) => {
    const model = gltf.scene;
    model.position.set(0, 0, -5);
    model.scale.set(1, 1, 1);

    model.traverse((child) => {
      if (child.isMesh && child.material) {
        const oldMat = child.material;
        const baseMap = oldMat.map || oldMat.baseColorMap || null;

        if (baseMap) {
          baseMap.encoding = THREE.sRGBEncoding;
        }

        child.material = new THREE.MeshBasicMaterial({
          map: baseMap,
          transparent: oldMat.transparent || false,
          opacity: oldMat.opacity !== undefined ? oldMat.opacity : 1,
          side: THREE.DoubleSide
        });
      }
    });

    scene.add(model);

    // Remove loading screen after model loads
loadingOverlay.style.opacity = '0';
setTimeout(() => {
  section.removeChild(loadingOverlay);
}, 500);

  },
  undefined,
  (error) => {
    console.error('Error loading courtyard.glb:', error);
    overlay.innerText = 'Failed to load model.';
  }
);

camera.position.set(0, 2, 10);

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const keys = {};

let yaw = 0;
let pitch = 0;
const sensitivity = 0.002;

renderer.domElement.addEventListener('click', () => {
  renderer.domElement.requestPointerLock();
});

function onMouseMove(event) {
  yaw -= event.movementX * sensitivity;
  pitch -= event.movementY * sensitivity;
  const maxPitch = Math.PI / 2;
  pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));
}

document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement === renderer.domElement) {
    document.addEventListener('mousemove', onMouseMove);
  } else {
    document.removeEventListener('mousemove', onMouseMove);
  }
});

document.addEventListener('keydown', (e) => {
  keys[e.code] = true;
});
document.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

function animate() {
  requestAnimationFrame(animate);

  direction.set(0, 0, 0);
  if (keys['KeyW']) direction.z -= .5;
  if (keys['KeyS']) direction.z += .5;
  if (keys['KeyA']) direction.x -= .5;
  if (keys['KeyD']) direction.x += .5;

  direction.normalize();
  velocity.copy(direction).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw).multiplyScalar(0.03);

  camera.position.add(velocity);

  camera.rotation.order = 'YXZ';
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = section.clientWidth / section.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(section.clientWidth, section.clientHeight);
});
