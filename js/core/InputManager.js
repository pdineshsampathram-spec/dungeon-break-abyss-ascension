// =====================================================================
//  DUNGEON BREAK — js/core/InputManager.js
//  Authoritative Keyboard, Mouse, and Touch Input Coordinator
// =====================================================================

import { EventBus } from './EventBus.js';
import { GameState, GameStates } from './GameState.js';
import { LW, LH } from './Constants.js';

export const INPUT_KEYS = {};
export const TOUCH_DIR = { x: 0, y: 0 };
export const MOUSE_STATE = { mx: 0, my: 0, isDown: false };

let _canvasScale = 1;
let _canvasElement = null;

export function setCanvasScale(scale) {
  _canvasScale = scale;
}

export function getCanvasScale() {
  return _canvasScale;
}

export function cssToGame(clientX, clientY, canvas = _canvasElement) {
  if (!canvas) return { mx: clientX, my: clientY };
  const r = canvas.getBoundingClientRect();
  if (!r.width || !r.height) return { mx: clientX, my: clientY };
  return {
    mx: (clientX - r.left) * (LW / r.width),
    my: (clientY - r.top) * (LH / r.height)
  };
}

export function isKeyDown(key) {
  return !!(INPUT_KEYS[key] || INPUT_KEYS[key.toLowerCase()] || INPUT_KEYS[key.toUpperCase()]);
}

export function getMovementVector() {
  let dx = 0;
  let dy = 0;

  // Keyboard controls (supporting keys, arrows, and code identifiers)
  if (INPUT_KEYS['w'] || INPUT_KEYS['W'] || INPUT_KEYS['ArrowUp'] || INPUT_KEYS['KeyW']) dy -= 1;
  if (INPUT_KEYS['s'] || INPUT_KEYS['S'] || INPUT_KEYS['ArrowDown'] || INPUT_KEYS['KeyS']) dy += 1;
  if (INPUT_KEYS['a'] || INPUT_KEYS['A'] || INPUT_KEYS['ArrowLeft'] || INPUT_KEYS['KeyA']) dx -= 1;
  if (INPUT_KEYS['d'] || INPUT_KEYS['D'] || INPUT_KEYS['ArrowRight'] || INPUT_KEYS['KeyD']) dx += 1;

  // Touch joystick integration
  if (Math.abs(TOUCH_DIR.x) > 0.05 || Math.abs(TOUCH_DIR.y) > 0.05) {
    dx = TOUCH_DIR.x;
    dy = TOUCH_DIR.y;
  }

  // Normalize if diagonal
  const mag = Math.hypot(dx, dy);
  if (mag > 1) {
    dx /= mag;
    dy /= mag;
  }

  return { dx, dy, mag };
}

let _isInitialized = false;

export function initInput(canvas) {
  if (_isInitialized && canvas === _canvasElement) return;
  _canvasElement = canvas;
  _isInitialized = true;

  // Keyboard Listeners
  window.addEventListener('keydown', e => {
    const k = e.key;
    const c = e.code;

    // Prevent default scroll on game keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(k)) {
      e.preventDefault();
    }

    INPUT_KEYS[k] = true;
    INPUT_KEYS[c] = true;
    if (k.length === 1) {
      INPUT_KEYS[k.toLowerCase()] = true;
      INPUT_KEYS[k.toUpperCase()] = true;
    }

    EventBus.emit('input:keydown', { key: k, code: c, originalEvent: e });
  });

  window.addEventListener('keyup', e => {
    delete INPUT_KEYS[e.key];
    delete INPUT_KEYS[e.code];
    if (e.key.length === 1) {
      delete INPUT_KEYS[e.key.toLowerCase()];
      delete INPUT_KEYS[e.key.toUpperCase()];
    }

    EventBus.emit('input:keyup', { key: e.key, code: e.code, originalEvent: e });
  });

  // Pointer/Mouse tracking
  if (canvas) {
    canvas.addEventListener('pointermove', e => {
      const { mx, my } = cssToGame(e.clientX, e.clientY, canvas);
      MOUSE_STATE.mx = mx;
      MOUSE_STATE.my = my;
      EventBus.emit('input:pointermove', { mx, my, originalEvent: e });
    });

    canvas.addEventListener('pointerdown', e => {
      const { mx, my } = cssToGame(e.clientX, e.clientY, canvas);
      MOUSE_STATE.mx = mx;
      MOUSE_STATE.my = my;
      MOUSE_STATE.isDown = true;
      EventBus.emit('input:pointerdown', { mx, my, originalEvent: e });
    });

    window.addEventListener('pointerup', e => {
      MOUSE_STATE.isDown = false;
      EventBus.emit('input:pointerup', { originalEvent: e });
    });
  }
}

export const InputManager = {
  init: initInput,
  cssToGame,
  setCanvasScale,
  getCanvasScale,
  isKeyDown,
  getMovementVector,
  TOUCH_DIR,
  INPUT_KEYS,
  MOUSE_STATE
};

if (typeof window !== 'undefined') {
  window.InputManager = InputManager;
}

