// ======================================== MAIN.JS ========================================
import { createMenuScene } from './menu.js';
import { createEntanglementScene } from './entanglement.js';
import { createSupurrFluidScene } from './suPURRfluid.js';
import { createPhotoElectricScene } from './photoElectric.js';
// PLACEHOLDERS
// import { createParticleAcceleratorScene } from './particleAccelerator.js';
// import { createDoubleSlitScene } from './doubleSlit.js';

// ======================================== VIRTUAL RESOLUTION ========================================
const VIRTUAL_W = 1000;
const VIRTUAL_H = 480;
const GAME_SCALE = 2;

// ======================================== INITIALIZE KAPLAY ========================================
const k = kaplay({
  width: (VIRTUAL_W / 2) * GAME_SCALE,
  height: (VIRTUAL_H / 2) * GAME_SCALE,
  scale: GAME_SCALE,
  letterbox: true,
  background: [11, 11, 27, 0],
  global: false,
  canvas: document.getElementById("gameCanvas"),
  debug: true,
  stretch: true,
  crisp: true,
});

window.k = k;
Object.assign(window, k);

// ======================================== MOBILE CONTROLS SETUP ========================================
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                  ('ontouchstart' in window);

const controls = document.getElementById('controls');
const joystick = document.querySelector('.joystick');
const joystickKnob = document.querySelector('.joystick-knob');
const jumpBtn = document.querySelector('.jump-btn');

export const virtualKeys = {
  left: false,
  right: false,
  space: false
};

export function showMobileControls() {
  if (controls && isMobile) {
    controls.style.display = 'flex';
    updateOrientation();
  }
}

export function hideMobileControls() {
  if (controls) {
    controls.style.display = 'none';
  }
}

function updateOrientation() {
  const isPortrait = window.innerHeight > window.innerWidth;
  controls.className = isPortrait ? 'portrait' : 'landscape';
}

if (controls) {
  window.addEventListener('resize', updateOrientation);
  window.addEventListener('orientationchange', updateOrientation);
  
  let hasShown = false;
  window.addEventListener('touchstart', () => {
    if (!hasShown && isMobile) {
      hasShown = true;
      showMobileControls();
    }
  }, { once: true });
}

let joystickActive = false;
let joystickCenter = { x: 0, y: 0 };
const joystickRadius = 60;
const deadZone = 15;

function updateJoystick(touch) {
  if (!joystickActive) return;
  
  const rect = joystick.getBoundingClientRect();
  joystickCenter.x = rect.left + rect.width / 2;
  joystickCenter.y = rect.top + rect.height / 2;
  
  const deltaX = touch.clientX - joystickCenter.x;
  const deltaY = touch.clientY - joystickCenter.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  const clampedDistance = Math.min(distance, joystickRadius);
  const angle = Math.atan2(deltaY, deltaX);
  
  const knobX = Math.cos(angle) * clampedDistance;
  const knobY = Math.sin(angle) * clampedDistance;
  
  joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
  
  if (Math.abs(deltaX) > deadZone) {
    virtualKeys.left = deltaX < 0;
    virtualKeys.right = deltaX > 0;
  } else {
    virtualKeys.left = false;
    virtualKeys.right = false;
  }
}

function resetJoystick() {
  joystickActive = false;
  joystick.classList.remove('active');
  joystickKnob.style.transform = 'translate(-50%, -50%)';
  virtualKeys.left = false;
  virtualKeys.right = false;
}

if (joystick) {
  joystick.addEventListener('touchstart', (e) => {
    e.preventDefault();
    joystickActive = true;
    joystick.classList.add('active');
    updateJoystick(e.touches[0]);
  });
  
  joystick.addEventListener('touchmove', (e) => {
    e.preventDefault();
    updateJoystick(e.touches[0]);
  });
  
  joystick.addEventListener('touchend', (e) => {
    e.preventDefault();
    resetJoystick();
  });
  
  joystick.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    resetJoystick();
  });
}

if (jumpBtn) {
  jumpBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    virtualKeys.space = true;
  });
  
  jumpBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    virtualKeys.space = false;
  });
  
  jumpBtn.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    virtualKeys.space = false;
  });
}

const originalIsKeyDown = isKeyDown;
window.isKeyDown = function(key) {
  if (virtualKeys[key]) return true;
  return originalIsKeyDown(key);
};

let lastSpaceState = false;
let spaceHandlers = [];

window.onKeyPress = function(key, callback) {
  if (key === "space") {
    spaceHandlers.push(callback);
  }
  return k.onKeyPress(key, callback);
};

function checkMobileInput() {
  if (virtualKeys.space && !lastSpaceState) {
    spaceHandlers.forEach(handler => handler());
  }
  lastSpaceState = virtualKeys.space;
}

setInterval(checkMobileInput, 16);

window.addEventListener('keydown', (e) => {
  if (e.key === 'm' || e.key === 'M') {
    if (controls.style.display === 'flex') {
      hideMobileControls();
    } else {
      showMobileControls();
    }
  }
});

// ======================================== LOAD SHARED ASSETS ========================================
// FONTS
loadFont("SpaceLetters", "assets/fonts/SpaceLetters.ttf");
// SPRITES 
loadSprite("groundPlatform", "assets/images/ground3.png");
loadSprite("platform", "assets/images/platform.png");
loadSprite("leftWall", "assets/images/leftWall2.png");
loadSprite("rightWall", "assets/images/rightWall2.png");
loadSprite("enemy", "assets/images/enemy.png");


loadSprite("niels", "assets/images/Niels.png", {
  sliceX: 12,
  sliceY: 1,
  anims: {
    walk: {
      from: 0,
      to: 7,
      speed: 12,
      loop: true,
    },
  },
});

loadSprite("photon", "assets/images/photonAnimation.png", { 
  sliceX: 4, 
  sliceY: 1, 
  anims: {
    blink: {
      from: 0,
      to: 3, 
      loop: true, 
      speed: 10
    }
  } 
});

loadSprite("crossHair", "assets/images/crossHair.png");
loadSprite("catlingGun", "assets/images/catlingGun.png", {
  sliceX: 3,
  sliceY: 1,
});

// ======================================== PHYSICS SETTINGS ========================================
setGravity(1500);
export const CONSTANTS = {
  VIRTUAL_W,
  VIRTUAL_H,
  GAME_SCALE,
  MOVE_SPEED: 500,
  JUMP_FORCE: 780,
};

// ======================================== REGISTER ALL SCENES ========================================
createMenuScene();
createEntanglementScene();
createSupurrFluidScene();
createPhotoElectricScene();
// createParticleAcceleratorScene();
// createDoubleSlitScene();

// ======================================== START GAME ========================================
go("menu");

// ======================================== WINDOW RESIZE HANDLER ========================================
window.addEventListener('resize', () => {
  const canvas = document.getElementById("gameCanvas");
  if (canvas) {
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
  }
});