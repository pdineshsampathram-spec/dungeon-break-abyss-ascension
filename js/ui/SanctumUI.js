// =====================================================================
//  DUNGEON BREAK — js/ui/SanctumUI.js
//  Authoritative Abyss Sanctum Metaprogression & Talent Tree Modal
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, roundRect } from '../core/Constants.js';
import { TALENT_DEFS } from '../data/talents.js';
import { ProgressionSystem } from '../systems/ProgressionSystem.js';
import { AudioManager } from '../audio/AudioManager.js';

let SANCTUM_SLIDE = 0;

export function openSanctum() {
  SANCTUM_SLIDE = 0;
  GameState.setState(GameStates.SANCTUM);
}

export const SanctumUI = {
  draw(ctx, dt = 0.016) {
    SANCTUM_SLIDE = Math.min(1, SANCTUM_SLIDE + dt * 4.5);
    const panW = 560, panH = 550;
    const panX = LW / 2 - panW / 2;
    const panY = LH / 2 - panH / 2 - (1 - SANCTUM_SLIDE) * 50;

    ctx.save();
    ctx.globalAlpha = SANCTUM_SLIDE;

    ctx.fillStyle = 'rgba(6,9,24,0.97)';
    ctx.strokeStyle = 'rgba(168,85,247,0.7)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, panX, panY, panW, panH, 12);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 18px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 12;
    ctx.fillText('🔮 THE ABYSS SANCTUM', LW / 2, panY + 16);
    ctx.shadowBlur = 0;

    const souls = GameState.ABYSS_SOULS || 0;
    const tokens = GameState.PRESTIGE_TOKENS || 0;
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 12px Cinzel, serif';
    ctx.fillText('Available Souls: ' + souls + ' 🔮   ·   Prestige Tokens: ' + tokens + ' 👑', LW / 2, panY + 42);

    ctx.fillStyle = 'rgba(168,85,247,0.3)';
    ctx.fillRect(panX + 20, panY + 62, panW - 40, 1);

    const talentKeys = Object.keys(TALENT_DEFS);
    const cardW = panW - 40, cardH = 72, gap = 8;
    const startY = panY + 74;

    talentKeys.forEach((key, idx) => {
      const tDef = TALENT_DEFS[key];
      const rank = ProgressionSystem.getTalentRank(key);
      const isMax = rank >= tDef.max;
      const cost = isMax ? 0 : tDef.costs[rank];
      const canAfford = !isMax && souls >= cost;
      const cy = startY + idx * (cardH + gap);

      ctx.fillStyle = 'rgba(15,23,42,0.85)';
      ctx.strokeStyle = isMax ? 'rgba(234,179,8,0.6)' : canAfford ? 'rgba(168,85,247,0.5)' : 'rgba(51,65,85,0.4)';
      ctx.lineWidth = 1;
      roundRect(ctx, panX + 20, cy, cardW, cardH, 8);
      ctx.fill(); ctx.stroke();

      ctx.font = '22px serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(tDef.icon, panX + 34, cy + 26);

      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 13px Cinzel, serif';
      ctx.fillText(tDef.name, panX + 66, cy + 24);

      ctx.fillStyle = 'rgba(148,163,184,0.85)';
      ctx.font = '11px Crimson Text, serif';
      ctx.fillText(tDef.desc, panX + 66, cy + 46);

      for (let p = 0; p < tDef.max; p++) {
        const pipX = panX + cardW - 220 + p * 14;
        const pipY = cy + 20;
        ctx.fillStyle = p < rank ? '#a855f7' : 'rgba(51,65,85,0.7)';
        roundRect(ctx, pipX, pipY, 10, 8, 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(203,213,225,0.7)';
      ctx.font = '10px Cinzel, serif';
      ctx.textAlign = 'right';
      ctx.fillText('Rank ' + rank + '/' + tDef.max, panX + cardW - 144, cy + 46);

      const btnX = panX + cardW - 134, btnY = cy + 16, btnW = 120, btnH = 40;
      ctx.fillStyle = isMax ? 'rgba(234,179,8,0.15)' : canAfford ? 'rgba(168,85,247,0.25)' : 'rgba(30,41,59,0.5)';
      ctx.strokeStyle = isMax ? 'rgba(234,179,8,0.7)' : canAfford ? 'rgba(168,85,247,0.8)' : 'rgba(71,85,105,0.3)';
      ctx.lineWidth = 1.2;
      roundRect(ctx, btnX, btnY, btnW, btnH, 6);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = isMax ? '#fde68a' : canAfford ? '#ffffff' : '#64748b';
      ctx.font = 'bold 10px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isMax ? '★ MAXED' : 'Upgrade: ' + cost + ' 🔮', btnX + btnW / 2, btnY + btnH / 2);
    });

    const closeBtnW = 180, closeBtnH = 34;
    const closeX = LW / 2 - closeBtnW / 2, closeY = panY + panH - 46;
    ctx.fillStyle = 'rgba(30,41,59,0.8)';
    ctx.strokeStyle = 'rgba(148,163,184,0.4)';
    ctx.lineWidth = 1;
    roundRect(ctx, closeX, closeY, closeBtnW, closeBtnH, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✖ Close Sanctum ( Esc )', LW / 2, closeY + closeBtnH / 2);

    ctx.restore();
  },

  handleClick(mx, my) {
    const panW = 560, panH = 550;
    const panX = LW / 2 - panW / 2, panY = LH / 2 - panH / 2;

    const closeBtnW = 180, closeBtnH = 34;
    const closeX = LW / 2 - closeBtnW / 2, closeY = panY + panH - 46;
    if (mx >= closeX && mx <= closeX + closeBtnW && my >= closeY && my <= closeY + closeBtnH) {
      GameState.setState(GameStates.TITLE);
      return true;
    }

    const talentKeys = Object.keys(TALENT_DEFS);
    const cardW = panW - 40, cardH = 72, gap = 8;
    const startY = panY + 74;

    for (let idx = 0; idx < talentKeys.length; idx++) {
      const key = talentKeys[idx];
      const cy = startY + idx * (cardH + gap);
      const btnX = panX + cardW - 134, btnY = cy + 16, btnW = 120, btnH = 40;

      if (mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH) {
        if (ProgressionSystem.upgradeTalent(key)) {
          AudioManager.playSFX('talent_unlock');
          return true;
        }
      }
    }

    if (mx < panX || mx > panX + panW || my < panY || my > panY + panH) {
      GameState.setState(GameStates.TITLE);
      return true;
    }
    return false;
  }
};

export function drawSanctumPanel(ctx, dt) {
  SanctumUI.draw(ctx, dt);
}
