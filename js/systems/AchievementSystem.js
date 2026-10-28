// =====================================================================
//  DUNGEON BREAK — js/systems/AchievementSystem.js
//  Authoritative Achievement Tracking, Toasts, & Progressive Feedback
//  100% Non-Blocking, Canvas 2D Pixel-Art Banners, Zero Emojis
// =====================================================================

import { ACHIEVEMENTS } from '../data/achievements.js';
import { SaveSystem } from './SaveSystem.js';
import { EventBus } from '../core/EventBus.js';
import { LW, roundRect } from '../core/Constants.js';
import { GameState } from '../core/GameState.js';
import { drawAchievementIcon } from '../rendering/AchievementIconRenderer.js';

export const ACHIEV_TOASTS = [];

export const AchievementSystem = {
  unlock(id) {
    if (GameState.IS_DEVELOPER_EXPEDITION) {
      console.log(`[AchievementSystem] Developer expedition active; achievement unlock suppressed: ${id}`);
      return;
    }
    const a = ACHIEVEMENTS[id];
    if (!a || a.unlocked) return;
    a.unlocked = true;
    SaveSystem.saveAchievements();
    
    ACHIEV_TOASTS.push({
      id,
      name: a.name,
      desc: a.desc,
      isProgress: false,
      progressText: null,
      progressRatio: 1.0,
      timer: 4.5,
      totalDuration: 4.5
    });

    EventBus.emit('achievement:unlocked', a);
  },

  showProgress(id, current, max, label = '') {
    const a = ACHIEVEMENTS[id];
    if (!a || a.unlocked) return;
    const ratio = Math.max(0, Math.min(1.0, current / max));
    const pct = Math.round(ratio * 100);
    const progressText = `${label || a.name}: ${current} / ${max} (${pct}%)`;

    // Avoid duplicate spam: update existing progress toast if present
    const existing = ACHIEV_TOASTS.find(t => t.id === id && t.isProgress);
    if (existing) {
      existing.progressText = progressText;
      existing.progressRatio = ratio;
      existing.timer = 3.5;
      return;
    }

    ACHIEV_TOASTS.push({
      id,
      name: a.name,
      desc: a.desc,
      isProgress: true,
      progressText,
      progressRatio: ratio,
      timer: 3.5,
      totalDuration: 3.5
    });
  },

  isUnlocked(id) {
    return !!(ACHIEVEMENTS[id] && ACHIEVEMENTS[id].unlocked);
  },

  toasts: ACHIEV_TOASTS,

  tick(dt) {
    for (let i = ACHIEV_TOASTS.length - 1; i >= 0; i--) {
      ACHIEV_TOASTS[i].timer -= dt;
      if (ACHIEV_TOASTS[i].timer <= 0) {
        ACHIEV_TOASTS.splice(i, 1);
      }
    }
  },

  drawToasts(ctx) {
    if (ACHIEV_TOASTS.length === 0) return;
    const isReducedMotion = !!(GameState.settings && GameState.settings.reducedMotion) || !!GameState.REDUCED_MOTION;

    // Display up to 2 queued toasts simultaneously
    const displayed = ACHIEV_TOASTS.slice(0, 2);

    displayed.forEach((t, i) => {
      const elapsed = t.totalDuration - t.timer;
      let slideIn = 1.0;
      let alpha = 1.0;

      if (!isReducedMotion) {
        // 0.4s smooth cubic slide in, 0.4s fade out
        if (elapsed < 0.4) {
          const p = elapsed / 0.4;
          slideIn = 1 - Math.pow(1 - p, 3);
          alpha = Math.min(1, p * 2.5);
        } else if (t.timer < 0.4) {
          const p = t.timer / 0.4;
          slideIn = p;
          alpha = Math.min(1, p * 2.5);
        }
      } else {
        if (t.timer < 0.25) {
          alpha = t.timer / 0.25;
        }
      }

      if (alpha <= 0) return;

      const curW = ctx.canvas.width || LW;
      const toastW = 276;
      const toastH = 58;
      const targetX = curW - toastW - 16;
      const startX = curW + 20;
      const tx = isReducedMotion ? targetX : Math.round(startX + (targetX - startX) * slideIn);
      const startY = (GameState.STATE === 'playing' || (GameState.STATE && GameState.STATE.toLowerCase() === 'playing')) ? 166 : 56;
      const ty = startY + i * (toastH + 10);

      ctx.save();
      ctx.globalAlpha = alpha;

      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      roundRect(ctx, tx + 3, ty + 4, toastW, toastH, 6);
      ctx.fill();

      // Chassis: Deep indigo/violet abyss-stone
      ctx.fillStyle = 'rgba(8, 12, 24, 0.96)';
      ctx.strokeStyle = t.isProgress ? 'rgba(56, 189, 248, 0.85)' : 'rgba(201, 168, 76, 0.85)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, tx, ty, toastW, toastH, 6);
      ctx.fill();
      ctx.stroke();

      // Corner rivets
      ctx.fillStyle = t.isProgress ? '#38bdf8' : '#fde68a';
      [[tx + 4, ty + 4], [tx + toastW - 4, ty + 4], [tx + 4, ty + toastH - 4], [tx + toastW - 4, ty + toastH - 4]].forEach(([rx, ry]) => {
        ctx.fillRect(rx - 1, ry - 1, 2, 2);
      });

      // Custom Pixel-Art Icon on the left
      const iconCx = tx + 26;
      const iconCy = ty + toastH / 2;
      drawAchievementIcon(ctx, t.id, iconCx, iconCy, 34, true, true, 0, isReducedMotion);

      // Header Tag
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = t.isProgress ? '#38bdf8' : '#fde68a';
      ctx.font = 'bold 8px Cinzel, serif';
      ctx.fillText(t.isProgress ? '◈ PROGRESSION UPDATE ◈' : '◈ DEED UNLOCKED ◈', tx + 50, ty + 9);

      // Achievement Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Cinzel, serif';
      const maxTW = toastW - 58;
      let title = t.name;
      if (ctx.measureText(title).width > maxTW) {
        while (title.length > 3 && ctx.measureText(title + '...').width > maxTW) {
          title = title.slice(0, -1);
        }
        title += '...';
      }
      ctx.fillText(title, tx + 50, ty + 22);

      // Subtitle or Progress Bar
      if (t.isProgress && t.progressText) {
        // Mini Progress Bar
        const barX = tx + 50;
        const barY = ty + 38;
        const barW = maxTW;
        const barH = 7;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.lineWidth = 0.8;
        roundRect(ctx, barX, barY, barW, barH, 2);
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        roundRect(ctx, barX, barY, Math.max(2, Math.round(barW * t.progressRatio)), barH, 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(203, 213, 225, 0.9)';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(t.progressText, tx + toastW - 10, ty + 49);
      } else {
        ctx.fillStyle = 'rgba(203, 213, 225, 0.85)';
        ctx.font = 'italic 9.5px Crimson Text, serif';
        let sub = t.desc || 'Completed in the Crucible';
        if (ctx.measureText(sub).width > maxTW) {
          while (sub.length > 3 && ctx.measureText(sub + '...').width > maxTW) {
            sub = sub.slice(0, -1);
          }
          sub += '...';
        }
        ctx.fillText(sub, tx + 50, ty + 38);
      }

      ctx.restore();
    });
  }
};
