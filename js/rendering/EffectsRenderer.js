// =====================================================================
//  DUNGEON BREAK — js/rendering/EffectsRenderer.js
//  Atmospheric Horror FX, Low-HP Pulse, Low-Sanity Tendrils, & Screen Fade
// =====================================================================

import { GameState } from '../core/GameState.js';
import { LW, LH, T } from '../core/Constants.js';

export const EffectsRenderer = {
  drawHorrorFX(ctx) {
    const { P } = GameState;
    if (P.dead) return;

    // 1. Low HP Heartbeat Pulse
    if (P.hp <= 2) {
      const pulse = Math.sin(GameState.F * 0.18) * 0.5 + 0.5;
      const hbGrad = ctx.createRadialGradient(LW / 2, LH / 2, LW * 0.25, LW / 2, LH / 2, LW * 0.72);
      hbGrad.addColorStop(0, 'rgba(0,0,0,0)');
      hbGrad.addColorStop(0.7, `rgba(185,28,28,${pulse * 0.22})`);
      hbGrad.addColorStop(1, `rgba(127,29,29,${0.35 + pulse * 0.35})`);
      ctx.fillStyle = hbGrad;
      ctx.fillRect(0, 0, LW, LH);
    }

    // 2. Low Sanity Creeping Eldritch Tentacles
    if (P.san < 35) {
      const sanFactor = (35 - P.san) / 35;
      ctx.save();
      ctx.globalAlpha = sanFactor * 0.45;

      const tendrilPulse = Math.sin(GameState.F * 0.08) * 15;
      ctx.fillStyle = '#0f051d';

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(80 + tendrilPulse, 20, 30, 80 + tendrilPulse, 0, 110);
      ctx.fill();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(LW, 0);
      ctx.bezierCurveTo(LW - 80 - tendrilPulse, 20, LW - 30, 80 + tendrilPulse, LW, 110);
      ctx.fill();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(0, LH);
      ctx.bezierCurveTo(80 + tendrilPulse, LH - 20, 30, LH - 80 - tendrilPulse, 0, LH - 110);
      ctx.fill();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(LW, LH);
      ctx.bezierCurveTo(LW - 80 - tendrilPulse, LH - 20, LW - 30, LH - 80 - tendrilPulse, LW, LH - 110);
      ctx.fill();

      ctx.restore();
    }
  },

  drawFade(ctx) {
    if (GameState.FADE > 0) {
      ctx.save();
      ctx.globalAlpha = GameState.FADE;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, LW, LH);
      ctx.restore();

      if (GameState.FADEIN) {
        GameState.FADE -= GameState.DT * 2.5;
        if (GameState.FADE <= 0) {
          GameState.FADE = 0;
          GameState.FADEIN = false;
        }
      }
    }
  }
};
