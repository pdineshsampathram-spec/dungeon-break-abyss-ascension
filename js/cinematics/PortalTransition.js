// =====================================================================
//  DUNGEON BREAK — js/cinematics/PortalTransition.js
//  Authoritative Cosmic Rift Hyper-Warp Sequence & Dimensional Shift
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH } from '../core/Constants.js';
import { FLOOR_WARP_QUOTES, isBossFloor, FLOOR_CONFIG } from '../data/floors.js';
import { FloorManager } from '../world/FloorManager.js';
import { SoundManager } from '../audio/AudioManager.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { EventBus } from '../core/EventBus.js';

export let WARP_ACTIVE = false;
export let WARP_TIMER = 0;
export const WARP_DUR = 1.8;
export let WARP_QUOTE = '';
export let WARP_NEXT_LV = 1;

export const PortalTransition = {
  start(nextLv) {
    WARP_ACTIVE = true;
    WARP_TIMER = 0;
    WARP_NEXT_LV = nextLv;
    WARP_QUOTE = FLOOR_WARP_QUOTES[Math.min(FLOOR_WARP_QUOTES.length - 1, Math.max(0, GameState.LV - 1))];
    GameState.PORTAL_USED = true;
    GameState.WARP_ACTIVE = true;
    GameState.WARP_TIMER = 0;
    GameState.WARP_QUOTE = WARP_QUOTE;

    SoundManager.snd('shockwave');
    GameState.CAM.shk = 10;

    if (!GameState.LEVEL_TOOK_DAMAGE) {
      AchievementSystem.unlock('untouchable');
    }
    if (GameState.LEVEL_TIMER < 90) {
      AchievementSystem.unlock('speed_runner');
    }

    SaveSystem.saveRun();
    EventBus.emit('warp:started', { nextFloor: nextLv });
  },

  init() {
    EventBus.on('portal:warp_requested', (e) => {
      this.start(e.nextFloor);
    });
  },

  tick(dt) {
    if (!WARP_ACTIVE) return;
    WARP_TIMER += dt;
    GameState.WARP_TIMER = WARP_TIMER;

    // Midpoint level swap (seamless transition behind starfield)
    if (WARP_TIMER >= 0.95 && GameState.LV !== WARP_NEXT_LV) {
      GameState.LV = WARP_NEXT_LV;
      FloorManager.loadLevel();
      GameState.CAM.shk = 8;
    }

    // Warp sequence finishes
    if (WARP_TIMER >= WARP_DUR) {
      WARP_ACTIVE = false;
      GameState.WARP_ACTIVE = false;
      GameState.PORTAL_USED = false;
      GameState.levelTransitionActive = false;

      if (!isBossFloor(GameState.LV)) {
        GameState.setState(GameStates.PLAYING);
      }
      EventBus.emit('warp:finished', { floor: GameState.LV });
    }
  },

  draw(ctx) {
    if (!WARP_ACTIVE) return;
    const progress = Math.min(1, WARP_TIMER / WARP_DUR);
    const cx = LW / 2;
    const cy = LH / 2;

    ctx.save();

    // Dark dimensional backdrop
    const bgAlpha = Math.min(0.95, progress * 2.2);
    ctx.fillStyle = `rgba(3,5,15,${bgAlpha})`;
    ctx.fillRect(0, 0, LW, LH);

    // Radial lightspeed streaks
    const numStreaks = 42;
    const maxR = Math.hypot(LW / 2, LH / 2);
    ctx.lineWidth = 1.8;

    for (let i = 0; i < numStreaks; i++) {
      const ang = (i / numStreaks) * Math.PI * 2 + progress * 2.5;
      const rStart = 30 + Math.sin(i * 3 + GameState.F * 0.1) * 20;
      const rEnd = rStart + (maxR - rStart) * Math.min(1, progress * 1.6 + 0.2);

      const grad = ctx.createLinearGradient(
        cx + Math.cos(ang) * rStart, cy + Math.sin(ang) * rStart,
        cx + Math.cos(ang) * rEnd,   cy + Math.sin(ang) * rEnd
      );
      const col = i % 3 === 0 ? '#38bdf8' : i % 3 === 1 ? '#c084fc' : '#fde68a';
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.5, col);
      grad.addColorStop(1, 'rgba(255,255,255,0.85)');

      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * rStart, cy + Math.sin(ang) * rStart);
      ctx.lineTo(cx + Math.cos(ang) * rEnd, cy + Math.sin(ang) * rEnd);
      ctx.stroke();
    }

    // Singularity rings
    const ring1 = progress * 6;
    const ring2 = -progress * 8;
    ctx.strokeStyle = 'rgba(56,189,248,0.7)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 60 + Math.sin(progress * Math.PI) * 40, ring1, ring1 + 4.5);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(192,132,252,0.75)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(cx, cy, 40 + Math.sin(progress * Math.PI) * 25, ring2, ring2 + 4.5);
    ctx.stroke();

    // Singularity Core
    const coreG = ctx.createRadialGradient(cx, cy, 5, cx, cy, 80);
    coreG.addColorStop(0, '#ffffff');
    coreG.addColorStop(0.2, '#38bdf8');
    coreG.addColorStop(0.6, '#090d24');
    coreG.addColorStop(1, 'rgba(3,5,15,0)');
    ctx.fillStyle = coreG;
    ctx.beginPath();
    ctx.arc(cx, cy, 80, 0, 6.28);
    ctx.fill();

    // Narrative Quote Banner
    const quoteAlpha = Math.sin(progress * Math.PI);
    if (quoteAlpha > 0.1 && WARP_QUOTE) {
      ctx.save();
      ctx.globalAlpha = quoteAlpha;

      const barH = 50 * quoteAlpha;
      ctx.fillStyle = 'rgba(0,0,0,0.92)';
      ctx.fillRect(0, 0, LW, barH);
      ctx.fillRect(0, LH - barH, LW, barH);

      ctx.strokeStyle = 'rgba(201,168,76,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(LW * 0.15, barH); ctx.lineTo(LW * 0.85, barH);
      ctx.moveTo(LW * 0.15, LH - barH); ctx.lineTo(LW * 0.85, LH - barH);
      ctx.stroke();

      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 13px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#c9a84c';
      ctx.shadowBlur = 10;
      ctx.fillText('LORD ROWAN — INNER MONOLOGUE', LW / 2, cy - 35);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'italic 15px Crimson Text, serif';
      ctx.fillText('“' + WARP_QUOTE + '”', LW / 2, cy + 30);
      ctx.restore();
    }

    ctx.restore();
  }
};

export const startCosmicHyperWarp = (nextLv) => PortalTransition.start(nextLv);
export const tickCosmicHyperWarp = (dt) => PortalTransition.tick(dt);
export const drawCosmicHyperWarp = (ctx) => PortalTransition.draw(ctx);

if (typeof window !== 'undefined') {
  window.startCosmicHyperWarp = startCosmicHyperWarp;
  window.tickCosmicHyperWarp = tickCosmicHyperWarp;
  window.drawCosmicHyperWarp = drawCosmicHyperWarp;
  Object.defineProperty(window, 'WARP_ACTIVE', {
    get: () => WARP_ACTIVE,
    set: (v) => { WARP_ACTIVE = v; },
    configurable: true
  });
  Object.defineProperty(window, 'WARP_TIMER', {
    get: () => WARP_TIMER,
    set: (v) => { WARP_TIMER = v; },
    configurable: true
  });
}
