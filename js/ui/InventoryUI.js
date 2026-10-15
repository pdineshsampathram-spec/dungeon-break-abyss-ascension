// =====================================================================
//  DUNGEON BREAK — js/ui/InventoryUI.js
//  Authoritative 3-Slot Weapon Replace Modal & Inventory Inspection UI
// =====================================================================

import { GameState } from '../core/GameState.js';
import { LW, LH, roundRect } from '../core/Constants.js';
import { WeaponInventory, replaceWeaponSlot, discardReplacementWeapon } from '../weapons/WeaponInventory.js';

export const InventoryUI = {
  draw(ctx) {
    const modal = GameState.pendingWeaponDrop || GameState.ACTIVE_WEAPON_REPLACE_MODAL;
    if (!modal) return;

    const panW = 540, panH = 370;
    const panX = LW / 2 - panW / 2, panY = LH / 2 - panH / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, LW, LH);

    // Modal panel background
    ctx.fillStyle = 'rgba(6, 10, 24, 0.98)';
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.75)';
    ctx.lineWidth = 1.8;
    roundRect(ctx, panX, panY, panW, panH, 12);
    ctx.fill();
    ctx.stroke();

    // Top-right close button [ ✕ ]
    const closeX = panX + panW - 36, closeY = panY + 12, closeW = 24, closeH = 24;
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.lineWidth = 1.2;
    roundRect(ctx, closeX, closeY, closeW, closeH, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 12px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('◈', closeX + closeW / 2, closeY + closeH / 2);

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 15px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('◈ INVENTORY FULL — CHOOSE REPLACEMENT ◈', LW / 2, panY + 16);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Cinzel, serif';
    ctx.fillText('Select a slot to replace, or close to keep current loadout:', LW / 2, panY + 40);

    const nw = modal.newWeapon;
    const nCardX = panX + 25, nCardY = panY + 62, nCardW = panW - 50, nCardH = 56;
    ctx.fillStyle = 'rgba(201, 168, 76, 0.12)';
    ctx.strokeStyle = (nw.rarity && nw.rarity.col) ? nw.rarity.col : '#fde68a';
    ctx.lineWidth = 1.5;
    roundRect(ctx, nCardX, nCardY, nCardW, nCardH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = (nw.rarity && nw.rarity.col) ? nw.rarity.col : '#fde68a';
    ctx.font = 'bold 13px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('◈ GROUND ITEM: ' + nw.name + ' [' + (nw.rarity ? nw.rarity.name : 'Common') + ']', nCardX + 16, nCardY + 18);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px Crimson Text, serif';
    ctx.fillText('Damage: ' + nw.damage + '  ·  Type: ' + nw.type + '  ·  Range: ' + nw.range, nCardX + 16, nCardY + 38);

    const slotW = (panW - 70) / 3;
    for (let i = 0; i < 3; i++) {
      const sw = GameState.weaponSlots[i];
      const sX = panX + 25 + i * (slotW + 10);
      const sY = panY + 130;
      const sH = 145;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = (i === GameState.activeWeaponSlot) ? '#fde68a' : 'rgba(71, 85, 105, 0.5)';
      ctx.lineWidth = (i === GameState.activeWeaponSlot) ? 2 : 1;
      roundRect(ctx, sX, sY, slotW, sH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = (i === GameState.activeWeaponSlot) ? '#fde68a' : '#94a3b8';
      ctx.font = 'bold 11px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('SLOT ' + (i + 1) + (i === GameState.activeWeaponSlot ? ' [ACTIVE]' : ''), sX + slotW / 2, sY + 8);

      if (sw) {
        ctx.fillStyle = (sw.rarity && sw.rarity.col) ? sw.rarity.col : '#ffffff';
        ctx.font = 'bold 11px Cinzel, serif';
        ctx.fillText(sw.name, sX + slotW / 2, sY + 38);

        const dmgDiff = (nw.damage - (sw.damage || sw.dmg || 0)).toFixed(1);
        const diffStr = dmgDiff > 0 ? `+${dmgDiff}` : `${dmgDiff}`;
        const diffCol = dmgDiff > 0 ? '#4ade80' : (dmgDiff < 0 ? '#f87171' : '#94a3b8');
        ctx.fillStyle = diffCol;
        ctx.font = 'bold 9px Cinzel, serif';
        ctx.fillText(`Dmg: ${sw.damage} ➔ ${nw.damage} (${diffStr})`, sX + slotW / 2, sY + 68);
      } else {
        ctx.fillStyle = '#475569';
        ctx.font = 'italic 11px Crimson Text, serif';
        ctx.fillText('[ EMPTY ]', sX + slotW / 2, sY + 45);
      }

      const btnY = sY + 98;
      ctx.fillStyle = 'rgba(201, 168, 76, 0.2)';
      ctx.strokeStyle = 'rgba(201, 168, 76, 0.6)';
      ctx.lineWidth = 1;
      roundRect(ctx, sX + 8, btnY, slotW - 16, 32, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 11px Cinzel, serif';
      ctx.textBaseline = 'middle';
      ctx.fillText('[' + (i + 1) + '] Replace', sX + slotW / 2, btnY + 16);
    }

    const discX = panX + panW / 2 - 120, discY = panY + panH - 52, discW = 240, discH = 34;
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.lineWidth = 1.2;
    roundRect(ctx, discX, discY, discW, discH, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('◈ Close / Keep Current Loadout', discX + discW / 2, discY + discH / 2);

    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = '10px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Press [ 1 ], [ 2 ], or [ 3 ] to Replace   ·   Press [ Esc ], [ X ], or [ G ] to Close', LW / 2, panY + panH - 8);

    ctx.restore();
  },

  drawWeaponReplaceModal(ctx) {
    this.draw(ctx);
  },

  handleClick(mx, my) {
    const modal = GameState.pendingWeaponDrop || GameState.ACTIVE_WEAPON_REPLACE_MODAL;
    if (!modal) return false;

    const panW = 540, panH = 370;
    const panX = LW / 2 - panW / 2, panY = LH / 2 - panH / 2;

    // 1. Click outside modal panel -> close/discard immediately
    if (mx < panX || mx > panX + panW || my < panY || my > panY + panH) {
      discardReplacementWeapon();
      return true;
    }

    // 2. Click top-right [ ✕ ] close button -> close/discard
    const closeX = panX + panW - 36, closeY = panY + 12, closeW = 24, closeH = 24;
    if (mx >= closeX - 4 && mx <= closeX + closeW + 4 && my >= closeY - 4 && my <= closeY + closeH + 4) {
      discardReplacementWeapon();
      return true;
    }

    // 3. Click slot replace cards / buttons
    const slotW = (panW - 70) / 3;
    for (let i = 0; i < 3; i++) {
      const sX = panX + 25 + i * (slotW + 10);
      const sY = panY + 130;
      if (mx >= sX && mx <= sX + slotW && my >= sY && my <= sY + 145) {
        replaceWeaponSlot(i, modal.newWeapon);
        return true;
      }
    }

    // 4. Click bottom close/discard button
    const discX = panX + panW / 2 - 120, discY = panY + panH - 52, discW = 240, discH = 34;
    if (mx >= discX && mx <= discX + discW && my >= discY && my <= discY + discH) {
      discardReplacementWeapon();
      return true;
    }

    return true;
  },

  handleWeaponReplaceClick(mx, my) {
    return this.handleClick(mx, my);
  }
};

export const drawWeaponReplaceModal = (ctx) => InventoryUI.draw(ctx);
export const handleWeaponReplaceClick = (mx, my) => InventoryUI.handleClick(mx, my);

if (typeof window !== 'undefined') {
  window.drawWeaponReplaceModal = drawWeaponReplaceModal;
  window.handleWeaponReplaceClick = handleWeaponReplaceClick;
}
