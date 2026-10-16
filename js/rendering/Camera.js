// =====================================================================
//  DUNGEON BREAK — js/rendering/Camera.js
//  Authoritative Camera Tracking, Smooth Easing, Trauma & Screen Shake
// =====================================================================

import { GameState } from '../core/GameState.js';
import { LW, LH, T, clamp } from '../core/Constants.js';

export const Camera = {
  reset() {
    const cam = GameState.CAM;
    const { P } = GameState;
    const px = P ? P.x : 0;
    const py = P ? P.y : 0;
    cam.x = px;
    cam.y = py;
    cam.tx = px;
    cam.ty = py;
    cam.z = 1.0;
    cam.tz = 1.0;
    cam.rot = 0;
    cam.shk = 0;
    cam.shkX = 0;
    cam.shkY = 0;
    cam.trauma = 0;
  },

  shake(amount) {
    if (GameState.SCREEN_SHAKE_ENABLED === false || GameState.REDUCED_MOTION) return;
    GameState.CAM.shk = Math.max(GameState.CAM.shk || 0, amount);
  },

  update(dt) {
    const cam = GameState.CAM;
    const { P } = GameState;

    // Follow player by default (unless boss intro, cinematic, or death scene overrides the camera)
    const isCinematicMode = GameState.BOSS_INTRO_ACTIVE ||
      GameState.STATE === 'boss_intro' ||
      GameState.STATE === 'cinematic' ||
      GameState.STATE === 'boss_defeat_cinematic' ||
      GameState.STATE === 'dying' ||
      GameState.STATE === 'death_normal' ||
      GameState.STATE === 'death_sanity' ||
      GameState.STATE === 'death_results' ||
      GameState.STATE === 'endcard' ||
      GameState.STATE === 'warp' ||
      GameState.WARP_ACTIVE;

    if (!isCinematicMode) {
      cam.tx = P.x;
      cam.ty = P.y;
      cam.tz = 1.0;
    }

    // Smooth camera follow
    const followSpeed = isCinematicMode ? 3.0 : 6.0;
    cam.x += (cam.tx - cam.x) * Math.min(1, dt * followSpeed);
    cam.y += (cam.ty - cam.y) * Math.min(1, dt * followSpeed);

    // Smooth zoom interpolation
    const targetZoom = cam.tz || 1.0;
    cam.z = (cam.z || 1.0) + (targetZoom - (cam.z || 1.0)) * Math.min(1, dt * 2.5);

    // Screen Shake decay (completely suppressed in REDUCED_MOTION mode)
    if (GameState.REDUCED_MOTION) {
      cam.shk = 0;
      cam.shkX = 0;
      cam.shkY = 0;
    } else if (cam.shk > 0) {
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
    const zoom = cam.z || 1.0;
    ctx.translate(Math.floor(LW / 2 + (cam.shkX || 0)), Math.floor(LH / 2 + (cam.shkY || 0)));
    if (cam.rot) {
      ctx.rotate(cam.rot);
    }
    if (Math.abs(zoom - 1.0) > 0.001) {
      ctx.scale(zoom, zoom);
    }
    ctx.translate(-Math.floor(cam.x * T), -Math.floor(cam.y * T));
  }
};

export const shk = (amt) => Camera.shake(amt);

if (typeof window !== 'undefined') {
  window.shk = shk;
  window.CAM = GameState.CAM;
}
