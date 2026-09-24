// =====================================================================
//  DUNGEON BREAK — js/rendering/Camera.js
//  Authoritative Camera Tracking, Smooth Easing, Trauma & Screen Shake
// =====================================================================

import { GameState } from '../core/GameState.js';
import { LW, LH, T, clamp } from '../core/Constants.js';

export const Camera = {
  shake(amount) {
    GameState.CAM.shk = Math.max(GameState.CAM.shk || 0, amount);
  },

  update(dt) {
    const cam = GameState.CAM;
    const { P } = GameState;

    // Follow player by default
    cam.tx = P.x;
    cam.ty = P.y;

    // Smooth camera follow
    const followSpeed = 6.0;
    cam.x += (cam.tx - cam.x) * Math.min(1, dt * followSpeed);
    cam.y += (cam.ty - cam.y) * Math.min(1, dt * followSpeed);

    // Screen Shake decay
    if (cam.shk > 0) {
      cam.shkX = (Math.random() - 0.5) * cam.shk * 2;
      cam.shkY = (Math.random() - 0.5) * cam.shk * 2;
      cam.shk = Math.max(0, cam.shk - dt * 25);
    } else {
      cam.shkX = 0;
      cam.shkY = 0;
    }
  },

  apply(ctx) {
    const cam = GameState.CAM;
    const cx = Math.floor(LW / 2 - cam.x * T + (cam.shkX || 0));
    const cy = Math.floor(LH / 2 - cam.y * T + (cam.shkY || 0));
    ctx.translate(cx, cy);
  }
};

export const shk = (amt) => Camera.shake(amt);

if (typeof window !== 'undefined') {
  window.shk = shk;
  window.CAM = GameState.CAM;
}
