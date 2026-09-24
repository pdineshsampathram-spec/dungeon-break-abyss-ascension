// =====================================================================
//  DUNGEON BREAK — js/systems/AchievementSystem.js
//  Authoritative Achievement Tracking, Toasts, & Unlocks
// =====================================================================

import { ACHIEVEMENTS } from '../data/achievements.js';
import { SaveSystem } from './SaveSystem.js';
import { EventBus } from '../core/EventBus.js';
import { LW, roundRect } from '../core/Constants.js';

export const ACHIEV_TOASTS = [];

export const AchievementSystem = {
  unlock(id) {
    const a = ACHIEVEMENTS[id];
    if (!a || a.unlocked) return;
    a.unlocked = true;
    SaveSystem.saveAchievements();
    ACHIEV_TOASTS.push({ name: a.name, icon: a.icon, timer: 4.0 });
    EventBus.emit('achievement:unlocked', a);
  },

  isUnlocked(id) {
    return !!(ACHIEVEMENTS[id] && ACHIEVEMENTS[id].unlocked);
  },

  tick(dt) {
    for (let i = ACHIEV_TOASTS.length - 1; i >= 0; i--) {
      ACHIEV_TOASTS[i].timer -= dt;
      if (ACHIEV_TOASTS[i].timer <= 0) ACHIEV_TOASTS.splice(i, 1);
    }
  },

  drawToasts(ctx) {
    ACHIEV_TOASTS.forEach((t, i) => {
      const alpha = Math.min(1, t.timer / 0.5) * Math.min(1, t.timer / 0.8);
      if (alpha <= 0) return;
      const tx = LW - 248, ty = 58 + i * 62;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(5,8,22,0.93)';
      ctx.strokeStyle = 'rgba(201,168,76,0.75)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, tx, ty, 232, 52, 8);
      ctx.fill();
      ctx.stroke();

      ctx.font = '20px serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.icon, tx + 12, ty + 26);

      ctx.fillStyle = '#c9a84c';
      ctx.font = 'bold 11px Cinzel,serif';
      ctx.fillText('ACHIEVEMENT UNLOCKED', tx + 42, ty + 14);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '12px Crimson Text,serif';
      ctx.fillText(t.name, tx + 42, ty + 31);
      ctx.restore();
    });
  }
};
