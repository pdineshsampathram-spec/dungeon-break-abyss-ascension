// =====================================================================
//  DUNGEON BREAK — js/rendering/LightingRenderer.js
//  Authoritative 2.5D Dynamic Lighting, Fog of War, & Torch Sconces
// =====================================================================

import { GameState } from '../core/GameState.js';
import { LW, LH, T, ROWS, COLS } from '../core/Constants.js';
// Lazy import to avoid circular dependency
let _endingCinematicsRef = null;
function isEndingCinematicActive() {
  if (!_endingCinematicsRef) {
    try {
      // Dynamic access via window to avoid circular import
      _endingCinematicsRef = (typeof window !== 'undefined' && window.EndingCinematics) || null;
    } catch (e) { /* ignore */ }
  }
  return _endingCinematicsRef && _endingCinematicsRef.isCinematicLighting
    ? _endingCinematicsRef.isCinematicLighting()
    : false;
}

let _wardenDefeatRef = null;
function isWardenDefeatActive() {
  if (!_wardenDefeatRef) {
    try {
      _wardenDefeatRef = (typeof window !== 'undefined' && window.WardenDefeatCinematic) || null;
    } catch (e) { /* ignore */ }
  }
  return _wardenDefeatRef && _wardenDefeatRef.isActive
    ? _wardenDefeatRef.isActive()
    : false;
}

let _shatteredMindRef = null;
function isShatteredMindActive() {
  if (!_shatteredMindRef) {
    try {
      _shatteredMindRef = (typeof window !== 'undefined' && window.ShatteredMindCinematic) || null;
    } catch (e) { /* ignore */ }
  }
  return _shatteredMindRef && _shatteredMindRef.isActive
    ? _shatteredMindRef.isActive()
    : false;
}

function isCinematicLightingActive() {
  if (GameState.STATE === 'last_ember' || GameState.STATE === 'LAST_EMBER' || (typeof window !== 'undefined' && window.LastEmberCinematic && window.LastEmberCinematic.isActive())) return true;
  if (GameState.STATE === 'boss_intro' || GameState.BOSS_INTRO_ACTIVE) return true;
  if (GameState.STATE === 'boss_defeat_cinematic') return true;
  if (GameState.STATE === 'death_normal' || GameState.STATE === 'death_sanity' || GameState.STATE === 'endcard') return true;
  if (isWardenDefeatActive()) return true;
  if (isShatteredMindActive()) return true;
  return isEndingCinematicActive();
}

let fogCanvas = null;
let fogCtx = null;
let exploredTiles = null;

export const LightingRenderer = {
  init() {
    if (typeof document === 'undefined') return;
    if (!fogCanvas) {
      fogCanvas = document.createElement('canvas');
      fogCanvas.width = LW;
      fogCanvas.height = LH;
      fogCtx = fogCanvas.getContext('2d');
    }
    exploredTiles = [];
    for (let r = 0; r < ROWS; r++) {
      exploredTiles.push(new Uint8Array(COLS));
    }
  },

  updateExplored() {
    if (!exploredTiles) this.init();
    if (!exploredTiles) return;

    // In boss arenas (floors 3, 6, 10), uncover the whole arena so fog never cuts strips across chamber
    const isBossArena = GameState.LV === 3 || GameState.LV === 6 || GameState.LV === 10 ||
      (GameState.ROOMS && GameState.ROOMS[0] && (GameState.ROOMS[0].type === 'throne_room' || GameState.ROOMS[0].type === 'gorgaroth_arena' || GameState.ROOMS[0].type === 'malakor_arena'));
    if (isBossArena && GameState.ROOMS && GameState.ROOMS[0]) {
      const rm = GameState.ROOMS[0];
      for (let r = Math.max(0, rm.y); r < Math.min(ROWS, rm.y + rm.h); r++) {
        for (let c = Math.max(0, rm.x); c < Math.min(COLS, rm.x + rm.w); c++) {
          exploredTiles[r][c] = 1;
        }
      }
      return;
    }

    const { P } = GameState;
    const lightR = 5;
    const px = Math.round(P.x);
    const py = Math.round(P.y);

    for (let dy = -lightR; dy <= lightR; dy++) {
      for (let dx = -lightR; dx <= lightR; dx++) {
        if (Math.hypot(dx, dy) <= lightR) {
          const tx = px + dx;
          const ty = py + dy;
          if (ty >= 0 && ty < ROWS && tx >= 0 && tx < COLS) {
            exploredTiles[ty][tx] = 1;
          }
        }
      }
    }
  },

  render(ctx, camX, camY, camZoom = 1) {
    if (!fogCanvas || !fogCtx) this.init();
    if (!fogCanvas || !fogCtx) return;

    const fc = fogCtx;
    fc.clearRect(0, 0, LW, LH);

    // ─── CINEMATIC LIGHTING BYPASS ───
    // During boss intros, endings, and death scenes, skip fog-of-war and just apply a subtle
    // atmospheric tint so the full arena or scene is visible with immersive dungeon mood
    if (isCinematicLightingActive()) {
      if (isShatteredMindActive()) {
        const cine = _shatteredMindRef && _shatteredMindRef.getActiveCinematic ? _shatteredMindRef.getActiveCinematic() : null;
        if (cine && cine.timer < 22.80) {
          return; // Psychological realm: bypass all dungeon lighting masks completely
        }
      }

      fc.globalCompositeOperation = 'source-over';
      fc.globalAlpha = 1;
      const isDeath = GameState.STATE === 'death_normal' || GameState.STATE === 'death_sanity' || GameState.STATE === 'endcard';
      fc.fillStyle = isDeath ? 'rgba(8, 2, 4, 0.38)' : 'rgba(2, 4, 12, 0.22)';
      fc.fillRect(0, 0, LW, LH);

      // Draw the subtle darkness mask onto master canvas
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(fogCanvas, 0, 0);
      ctx.restore();
      return;
    }

    this.updateExplored();

    // Fill with soft atmospheric dungeon darkness (not pitch black)
    fc.globalCompositeOperation = 'source-over';
    fc.globalAlpha = 1;
    fc.fillStyle = 'rgba(2, 4, 12, 0.74)';
    fc.fillRect(0, 0, LW, LH);

    // Cut holes via destination-out
    fc.globalCompositeOperation = 'destination-out';

    // 1. Explored dimmed tiles (clear visibility for discovered rooms with viewport culling)
    const halfW = (LW / 2) / (T * camZoom);
    const halfH = (LH / 2) / (T * camZoom);
    const minC = Math.max(0, Math.floor(camX - halfW) - 1);
    const maxC = Math.min(COLS - 1, Math.ceil(camX + halfW) + 1);
    const minR = Math.max(0, Math.floor(camY - halfH) - 1);
    const maxR = Math.min(ROWS - 1, Math.ceil(camY + halfH) + 1);

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        if (!exploredTiles || !exploredTiles[r] || !exploredTiles[r][c]) continue;
        const wx = (c + 0.5) * T;
        const wy = (r + 0.5) * T;
        const sx = (wx - camX * T) * camZoom + LW / 2;
        const sy = (wy - camY * T) * camZoom + LH / 2;
        const size = T * camZoom + 1;

        fc.globalAlpha = 0.72;
        fc.fillStyle = 'rgba(255,255,255,1)';
        fc.fillRect(sx - size / 2, sy - size / 2, size, size);
      }
    }

    // 2. Player lantern light (expanded for excellent visibility)
    const { P, BOSS, LV } = GameState;
    const playerSX = (P.x + 0.5) * T;
    const playerSY = (P.y + 0.5) * T;
    const psx = (playerSX - camX * T) * camZoom + LW / 2;
    const psy = (playerSY - camY * T) * camZoom + LH / 2;
    const lightRadius = (P.shieldActive ? 8.8 : 7.8) * T * camZoom;

    const grad = fc.createRadialGradient(psx, psy, 0, psx, psy, lightRadius);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.50, 'rgba(255,255,255,0.92)');
    grad.addColorStop(0.80, 'rgba(255,255,255,0.60)');
    grad.addColorStop(1.0, 'rgba(255,255,255,0)');

    fc.globalAlpha = 1;
    fc.fillStyle = grad;
    fc.beginPath();
    fc.arc(psx, psy, lightRadius, 0, Math.PI * 2);
    fc.fill();

    // 3. Torch light circles (expanded warm light halos)
    GameState.TORCHES.forEach(t => {
      const sx = ((t.x + 0.5) * T - camX * T) * camZoom + LW / 2;
      const sy = ((t.y + 0.5) * T - camY * T) * camZoom + LH / 2;
      const flicker = Math.sin(GameState.F * 0.15 + t.ph) * 5;
      const r = Math.max(16, (5.2 * T + flicker) * camZoom);

      const tg = fc.createRadialGradient(sx, sy, 0, sx, sy, r);
      tg.addColorStop(0, 'rgba(255,255,255,0.95)');
      tg.addColorStop(0.65, 'rgba(255,255,255,0.60)');
      tg.addColorStop(1, 'rgba(255,255,255,0)');

      fc.fillStyle = tg;
      fc.beginPath();
      fc.arc(sx, sy, r, 0, 6.28);
      fc.fill();
    });

    // 3.5. Shrine light halos
    if (GameState.SHRINES) {
      GameState.SHRINES.forEach(s => {
        if (s.used) return;
        const sx = ((s.x + 0.5) * T - camX * T) * camZoom + LW / 2;
        const sy = ((s.y + 0.5) * T - camY * T) * camZoom + LH / 2;
        const r = 4.8 * T * camZoom;
        const sg = fc.createRadialGradient(sx, sy, 0, sx, sy, r);
        sg.addColorStop(0, 'rgba(255,255,255,0.95)');
        sg.addColorStop(0.7, 'rgba(255,255,255,0.45)');
        sg.addColorStop(1.0, 'rgba(255,255,255,0)');
        fc.fillStyle = sg;
        fc.beginPath();
        fc.arc(sx, sy, r, 0, 6.28);
        fc.fill();
      });
    }

    // 4. Boss Arena Majestic Illumination
    if (BOSS && BOSS.alive) {
      const bsx = ((BOSS.x + 0.5) * T - camX * T) * camZoom + LW / 2;
      const bsy = ((BOSS.y + 0.5) * T - camY * T) * camZoom + LH / 2;
      const br = 12 * T * camZoom;
      const bg = fc.createRadialGradient(bsx, bsy, 0, bsx, bsy, br);
      bg.addColorStop(0, 'rgba(255,255,255,0.90)');
      bg.addColorStop(0.7, 'rgba(255,255,255,0.45)');
      bg.addColorStop(1.0, 'rgba(255,255,255,0)');
      fc.fillStyle = bg;
      fc.beginPath();
      fc.arc(bsx, bsy, br, 0, 6.28);
      fc.fill();
    }

    // Draw darkness mask onto master canvas
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(fogCanvas, 0, 0);
    ctx.restore();
  },

  /**
   * Authoritative query for torch light protection at world coordinate (x, y).
   * Part 24, 26, 28, 42:
   * - Inner torch zone (<= 2.2 tiles): 0.0x drain (torches protect sanity)
   * - Outer torch zone (2.2 < d <= 4.2 tiles): 0.15x drain
   * - Deep shadow / late floors: 1.25x drain
   * - Abyssal darkness / Floor 10: 1.75x drain
   * - Normal dungeon lighting: 1.0x drain
   * Overlapping torches do NOT stack to negative drain; strongest local protection wins.
   */
  getSanityProtectionAt(x, y) {
    const { TORCHES, P, SHRINES, LV } = GameState;
    if (P && P.mindShieldTimer > 0) return 0.0;

    let closestDist = Infinity;
    if (TORCHES && TORCHES.length > 0) {
      for (let i = 0; i < TORCHES.length; i++) {
        const t = TORCHES[i];
        const d = Math.hypot(x - t.x, y - t.y);
        if (d < closestDist) closestDist = d;
      }
    }

    // Active/unused shrines also provide holy light sanctuary
    if (SHRINES && SHRINES.length > 0) {
      for (let i = 0; i < SHRINES.length; i++) {
        const s = SHRINES[i];
        if (!s.used) {
          const d = Math.hypot(x - s.x, y - s.y);
          if (d < closestDist) closestDist = d;
        }
      }
    }

    // Inner radius: 0.0x drain (torches protect completely)
    if (closestDist <= 2.2) {
      return 0.0;
    }
    // Outer radius: 0.15x drain (strong protection)
    if (closestDist <= 4.2) {
      return 0.15;
    }

    // Outside torchlight:
    if (LV >= 10) {
      return 1.75; // Abyssal darkness
    }
    if (LV >= 7) {
      return 1.25; // Deep shadow
    }
    return 1.0; // Normal dungeon lighting
  }
};

export const Lighting = LightingRenderer;
export const getSanityProtectionAt = (x, y) => LightingRenderer.getSanityProtectionAt(x, y);

if (typeof window !== 'undefined') {
  window.Lighting = Lighting;
  window.getSanityProtectionAt = getSanityProtectionAt;
}
