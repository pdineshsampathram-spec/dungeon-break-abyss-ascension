// =====================================================================
//  DUNGEON BREAK — js/cinematics/BossIntros.js
//  Authoritative Boss Introductions, Encounter Banners, & Camera Framing
// =====================================================================

import { GameState } from '../core/GameState.js';
import { LW, LH } from '../core/Constants.js';
import { SoundManager } from '../audio/AudioManager.js';

export const CINEMATIC_BANNER = {
  active: false,
  timer: 0,
  duration: 3.5,
  title: '',
  subtitle: '',
  col: '#fde68a'
};

export const BossIntros = {
  triggerBanner(title, subtitle, col = '#fde68a') {
    CINEMATIC_BANNER.active = true;
    CINEMATIC_BANNER.timer = 0;
    CINEMATIC_BANNER.title = title;
    CINEMATIC_BANNER.subtitle = subtitle;
    CINEMATIC_BANNER.col = col;
  },

  start(bossId) {
    const { BOSS } = GameState;
    if (!BOSS) return;

    GameState.BOSS_INTRO_ACTIVE = true;
    GameState.BOSS_AI_ACTIVE = false;
    SoundManager.snd('boss_roar');
    GameState.CAM.shk = 12;

    this.triggerBanner(BOSS.name || 'ANCIENT ENTITY', BOSS.title || 'Guardian of the Dark', '#ef4444');

    // Pan camera to boss
    GameState.CAM.tx = BOSS.x;
    GameState.CAM.ty = BOSS.y;

    setTimeout(() => {
      GameState.BOSS_AI_ACTIVE = true;
      GameState.BOSS_INTRO_ACTIVE = false;
    }, 2800);
  },

  tick(dt) {
    if (!CINEMATIC_BANNER.active) return;
    CINEMATIC_BANNER.timer += dt;
    if (CINEMATIC_BANNER.timer >= CINEMATIC_BANNER.duration) {
      CINEMATIC_BANNER.active = false;
    }
  },

  draw(ctx) {
    if (!CINEMATIC_BANNER.active) return;
    const cb = CINEMATIC_BANNER;
    const t = cb.timer;
    let alpha = 1;
    if (t < 0.5) alpha = t / 0.5;
    else if (t > cb.duration - 0.6) alpha = (cb.duration - t) / 0.6;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    const lbH = 46;
    ctx.fillStyle = 'rgba(2,4,12,0.92)';
    ctx.fillRect(0, 0, LW, lbH);
    ctx.fillRect(0, LH - lbH, LW, lbH);

    const py = 76;
    const pw = 480;
    const ph = 58;
    const px = LW / 2 - pw / 2;

    const grad = ctx.createLinearGradient(px, py, px + pw, py);
    grad.addColorStop(0, 'rgba(10,12,24,0)');
    grad.addColorStop(0.2, 'rgba(15,20,40,0.95)');
    grad.addColorStop(0.8, 'rgba(15,20,40,0.95)');
    grad.addColorStop(1, 'rgba(10,12,24,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(px, py, pw, ph);

    ctx.strokeStyle = cb.col;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(px + 40, py); ctx.lineTo(px + pw - 40, py);
    ctx.moveTo(px + 40, py + ph); ctx.lineTo(px + pw - 40, py + ph);
    ctx.stroke();

    ctx.shadowColor = cb.col;
    ctx.shadowBlur = 14;
    ctx.fillStyle = cb.col;
    ctx.font = 'bold 20px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cb.title, LW / 2, py + 22);

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(226,232,240,0.85)';
    ctx.font = 'italic 12px Crimson Text, serif';
    ctx.fillText(cb.subtitle, LW / 2, py + 44);

    ctx.restore();
  }
};

export const startBossIntroCinematic = (id) => BossIntros.start(id);
export const triggerCinematicBanner = (t, s, c) => BossIntros.triggerBanner(t, s, c);

if (typeof window !== 'undefined') {
  window.startBossIntroCinematic = startBossIntroCinematic;
  window.triggerCinematicBanner = triggerCinematicBanner;
}
