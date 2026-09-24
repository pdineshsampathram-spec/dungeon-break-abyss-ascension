// =====================================================================
//  DUNGEON BREAK — js/ui/BossBar.js
//  Authoritative Boss & Mini-Boss Top Health Bar HUD
// =====================================================================

import { GameState } from '../core/GameState.js';
import { LW } from '../core/Constants.js';
import { roundRect } from '../core/Constants.js';

export const BossBar = {
  draw(ctx) {
    const mb = GameState.ACTIVE_MINIBOSS || GameState.BOSS;
    if (!mb || !mb.alive) return;

    const barW = 320, barH = 14;
    const barX = LW / 2 - barW / 2, barY = 24;
    const maxHp = mb.maxHp || 100;
    const curHp = mb.hp !== undefined ? mb.hp : maxHp;
    const frac = Math.max(0, Math.min(1, curHp / maxHp));

    ctx.save();
    ctx.fillStyle = 'rgba(5,8,22,0.85)';
    ctx.strokeStyle = 'rgba(201,168,76,0.7)';
    ctx.lineWidth = 1.2;
    roundRect(ctx, barX - 4, barY - 18, barW + 8, barH + 24, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const nameStr = mb.name || 'Abyss Entity';
    const titleStr = mb.title ? ' — ' + mb.title : '';
    ctx.fillText('⚔️ ' + nameStr + titleStr, LW / 2, barY - 8);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(barX, barY + 2, barW, barH);

    const fillGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    fillGrad.addColorStop(0, '#ef4444');
    fillGrad.addColorStop(1, '#a855f7');
    ctx.fillStyle = fillGrad;
    ctx.fillRect(barX, barY + 2, barW * frac, barH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.fillText(Math.ceil(Math.max(0, curHp)) + ' / ' + maxHp, LW / 2, barY + 9);
    ctx.restore();
  }
};

export function drawMiniBossHUD(ctx) {
  BossBar.draw(ctx);
}
