// =====================================================================
//  DUNGEON BREAK — js/ui/InventoryUI.js
//  Authoritative 3-Slot Weapon Replace Modal & Inventory Inspection UI
// =====================================================================

import { GameState } from '../core/GameState.js';
import { LW, LH, roundRect } from '../core/Constants.js';
import { WeaponInventory, replaceWeaponSlot, discardReplacementWeapon } from '../weapons/WeaponInventory.js';

export const InventoryUI = {
  draw(ctx) {
    const modal = GameState.pendingWeaponDrop;
    if (!modal) return;

    const panW = 520, panH = 360;
    const panX = LW / 2 - panW / 2, panY = LH / 2 - panH / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
    ctx.fillRect(0, 0, LW, LH);

    ctx.fillStyle = 'rgba(5, 8, 22, 0.98)';
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.75)';
    ctx.lineWidth = 1.8;
    roundRect(ctx, panX, panY, panW, panH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 15px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('⚔️ INVENTORY FULL — CHOOSE REPLACEMENT', LW / 2, panY + 16);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Cinzel, serif';
    ctx.fillText('Select an existing slot to replace, or discard the newly found weapon:', LW / 2, panY + 40);

    const nw = modal.newWeapon;
    const nCardX = panX + 30, nCardY = panY + 64, nCardW = panW - 60, nCardH = 54;
    ctx.fillStyle = 'rgba(201, 168, 76, 0.12)';
    ctx.strokeStyle = (nw.rarity && nw.rarity.col) ? nw.rarity.col : '#fde68a';
    ctx.lineWidth = 1.5;
    roundRect(ctx, nCardX, nCardY, nCardW, nCardH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = (nw.rarity && nw.rarity.col) ? nw.rarity.col : '#fde68a';
    ctx.font = 'bold 12px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('NEW: ' + (nw.icon || '⚔️') + ' ' + nw.name + ' [' + (nw.rarity ? nw.rarity.name : 'Common') + ']', nCardX + 16, nCardY + 18);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px Crimson Text, serif';
    ctx.fillText('Damage: ' + nw.damage + '  ·  Type: ' + nw.type + '  ·  Range: ' + nw.range, nCardX + 16, nCardY + 36);

    const slotW = (panW - 70) / 3;
    for (let i = 0; i < 3; i++) {
      const sw = GameState.weaponSlots[i];
      const sX = panX + 25 + i * (slotW + 10);
      const sY = panY + 135;
      const sH = 140;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = (i === GameState.activeWeaponSlot) ? '#fde68a' : 'rgba(71, 85, 105, 0.5)';
      ctx.lineWidth = (i === GameState.activeWeaponSlot) ? 2 : 1;
      roundRect(ctx, sX, sY, slotW, sH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = (i === GameState.activeWeaponSlot) ? '#fde68a' : '#94a3b8';
      ctx.font = 'bold 11px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('SLOT ' + (i + 1), sX + slotW / 2, sY + 10);

      if (sw) {
        ctx.fillStyle = (sw.rarity && sw.rarity.col) ? sw.rarity.col : '#ffffff';
        ctx.font = '22px serif';
        ctx.fillText(sw.icon || '⚔️', sX + slotW / 2, sY + 30);
        ctx.font = 'bold 10px Cinzel, serif';
        ctx.fillText(sw.name, sX + slotW / 2, sY + 60);
        ctx.fillStyle = '#64748b';
        ctx.font = '9px Cinzel, serif';
        ctx.fillText((sw.rarity ? sw.rarity.name : 'Common') + ' · Dmg: ' + sw.damage, sX + slotW / 2, sY + 76);
      } else {
        ctx.fillStyle = '#475569';
        ctx.font = 'italic 11px Crimson Text, serif';
        ctx.fillText('[ EMPTY ]', sX + slotW / 2, sY + 50);
      }

      const btnY = sY + 98;
      ctx.fillStyle = 'rgba(201, 168, 76, 0.2)';
      ctx.strokeStyle = 'rgba(201, 168, 76, 0.6)';
      ctx.lineWidth = 1;
      roundRect(ctx, sX + 8, btnY, slotW - 16, 28, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 10px Cinzel, serif';
      ctx.textBaseline = 'middle';
      ctx.fillText('[' + (i + 1) + '] Replace', sX + slotW / 2, btnY + 14);
    }

    const discX = panX + panW / 2 - 80, discY = panY + panH - 46, discW = 160, discH = 32;
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
    ctx.fillText('✕ Discard New Weapon', discX + discW / 2, discY + discH / 2);

    ctx.restore();
  },

  handleClick(mx, my) {
    const modal = GameState.pendingWeaponDrop;
    if (!modal) return false;

    const panW = 520, panH = 360;
    const panX = LW / 2 - panW / 2, panY = LH / 2 - panH / 2;

    const slotW = (panW - 70) / 3;
    for (let i = 0; i < 3; i++) {
      const sX = panX + 25 + i * (slotW + 10);
      const sY = panY + 135;
      if (mx >= sX && mx <= sX + slotW && my >= sY && my <= sY + 140) {
        replaceWeaponSlot(i, modal.newWeapon);
        return true;
      }
    }

    const discX = panX + panW / 2 - 80, discY = panY + panH - 46, discW = 160, discH = 32;
    if (mx >= discX && mx <= discX + discW && my >= discY && my <= discY + discH) {
      discardReplacementWeapon();
      return true;
    }

    return true;
  }
};

export const drawWeaponReplaceModal = (ctx) => InventoryUI.draw(ctx);
export const handleWeaponReplaceClick = (mx, my) => InventoryUI.handleClick(mx, my);

if (typeof window !== 'undefined') {
  window.drawWeaponReplaceModal = drawWeaponReplaceModal;
  window.handleWeaponReplaceClick = handleWeaponReplaceClick;
}
