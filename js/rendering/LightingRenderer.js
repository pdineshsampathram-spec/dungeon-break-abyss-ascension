// =====================================================================
//  DUNGEON BREAK — js/rendering/LightingRenderer.js
//  Authoritative 2.5D Dynamic Lighting, Fog of War, & Torch Sconces
// =====================================================================

import { GameState } from '../core/GameState.js';
import { LW, LH, T, ROWS, COLS } from '../core/Constants.js';

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

    this.updateExplored();

    const fc = fogCtx;
    fc.clearRect(0, 0, LW, LH);

    // Fill with solid darkness
    fc.globalCompositeOperation = 'source-over';
    fc.globalAlpha = 1;
    fc.fillStyle = 'rgba(0,0,0,1)';
    fc.fillRect(0, 0, LW, LH);

    // Cut holes via destination-out
    fc.globalCompositeOperation = 'destination-out';

    // 1. Explored dimmed tiles
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!exploredTiles || !exploredTiles[r] || !exploredTiles[r][c]) continue;
        const wx = (c + 0.5) * T;
        const wy = (r + 0.5) * T;
        const sx = (wx - camX * T) * camZoom + LW / 2;
        const sy = (wy - camY * T) * camZoom + LH / 2;
        const size = T * camZoom + 1;

        fc.globalAlpha = 0.38;
        fc.fillStyle = 'rgba(255,255,255,1)';
        fc.fillRect(sx - size / 2, sy - size / 2, size, size);
      }
    }

    // 2. Player lantern light
    const { P } = GameState;
    const playerSX = (P.x + 0.5) * T;
    const playerSY = (P.y + 0.5) * T;
    const psx = (playerSX - camX * T) * camZoom + LW / 2;
    const psy = (playerSY - camY * T) * camZoom + LH / 2;
    const lightRadius = (P.shieldActive ? 5.8 : 4.8) * T * camZoom;

    const grad = fc.createRadialGradient(psx, psy, 0, psx, psy, lightRadius);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.45, 'rgba(255,255,255,0.95)');
    grad.addColorStop(0.75, 'rgba(255,255,255,0.55)');
    grad.addColorStop(1.0, 'rgba(255,255,255,0)');

    fc.globalAlpha = 1;
    fc.fillStyle = grad;
    fc.beginPath();
    fc.arc(psx, psy, lightRadius, 0, Math.PI * 2);
    fc.fill();

    // 3. Torch light circles
    GameState.TORCHES.forEach(t => {
      const sx = ((t.x + 0.5) * T - camX * T) * camZoom + LW / 2;
      const sy = ((t.y + 0.5) * T - camY * T) * camZoom + LH / 2;
      const flicker = Math.sin(GameState.F * 0.15 + t.ph) * 4;
      const r = Math.max(10, (3.2 * T + flicker) * camZoom);

      const tg = fc.createRadialGradient(sx, sy, 0, sx, sy, r);
      tg.addColorStop(0, 'rgba(255,255,255,0.95)');
      tg.addColorStop(0.6, 'rgba(255,255,255,0.55)');
      tg.addColorStop(1, 'rgba(255,255,255,0)');

      fc.fillStyle = tg;
      fc.beginPath();
      fc.arc(sx, sy, r, 0, 6.28);
      fc.fill();
    });

    // Draw darkness mask onto master canvas
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(fogCanvas, 0, 0);
    ctx.restore();
  }
};

export const Lighting = LightingRenderer;

if (typeof window !== 'undefined') {
  window.Lighting = Lighting;
}
