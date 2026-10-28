// =====================================================================
//  DUNGEON BREAK — js/ui/InventoryUI.js
//  Phase 5.5: Living Cathedral Full-Inventory Weapon Replacement Flow
//  - Mode 1: Contextual "ARSENAL FULL" in-world equipment cache prompt
//  - Mode 2: Clear 3-Slot Replacement Selector showing [CURRENT] ➔ [NEW]
//  - Isolated input: mouse, touch, and keyboard (1, 2, 3, Enter, E, Esc)
// =====================================================================

import { GameState } from '../core/GameState.js';
import { LW, LH, roundRect } from '../core/Constants.js';
import {
  WeaponInventory,
  replaceWeaponSlot,
  discardReplacementWeapon,
  switchToSelector
} from '../weapons/WeaponInventory.js';
import { drawPixelWeaponIcon } from './HUD.js';
import { InputManager } from '../core/InputManager.js';
import {
  drawStoneButton,
  drawStonePanel,
  drawStoneCard,
  drawCornerBrackets
} from './ButtonArtManager.js?v=2.0';

let _activePromptButtons = [];
let _activeSelectorButtons = [];

const SELECTOR_PAN_W = 640;
const SELECTOR_PAN_H = 425;

function drawFittedText(ctx, text, x, y, maxW, fontFam = 'Cinzel, serif', baseSize = 10, minSize = 7.5, isBold = true) {
  let size = baseSize;
  const weight = isBold ? 'bold ' : '';
  ctx.font = `${weight}${size}px ${fontFam}`;
  let w = ctx.measureText(text).width;
  while (w > maxW && size > minSize) {
    size -= 0.5;
    ctx.font = `${weight}${size}px ${fontFam}`;
    w = ctx.measureText(text).width;
  }
  if (w > maxW) {
    // Truncate with ellipsis
    let truncated = text;
    while (truncated.length > 3 && ctx.measureText(truncated + '...').width > maxW) {
      truncated = truncated.slice(0, -1);
    }
    ctx.fillText(truncated + '...', x, y);
  } else {
    ctx.fillText(text, x, y);
  }
}

export const InventoryUI = {
  draw(ctx) {
    const modal = GameState.pendingWeaponDrop || GameState.ACTIVE_WEAPON_REPLACE_MODAL;
    if (!modal || !modal.newWeapon) return;

    const mode = modal.mode || 'prompt';

    ctx.save();
    // Atmospheric semi-transparent backdrop
    ctx.fillStyle = 'rgba(2, 4, 10, 0.88)';
    ctx.fillRect(0, 0, LW, LH);

    if (mode === 'prompt') {
      this.drawPromptMode(ctx, modal);
    } else {
      this.drawSelectorMode(ctx, modal);
    }

    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────
  // MODE 1: CONTEXTUAL "ARSENAL FULL" EQUIPMENT CACHE PROMPT
  // ─────────────────────────────────────────────────────────────
  drawPromptMode(ctx, modal) {
    _activePromptButtons = [];
    const nw = modal.newWeapon;
    const rar = nw.rarity || { name: 'Common', col: '#94a3b8' };
    const rarCol = rar.col || '#94a3b8';

    const panW = 480;
    const panH = 260;
    const panX = Math.round((LW - panW) / 2);
    const panY = Math.round((LH - panH) / 2);

    // Chassis: Deep obsidian/stone panel
    drawStonePanel(ctx, panX, panY, panW, panH, { cornerSize: 8, elevation: 3 });
    drawCornerBrackets(ctx, panX, panY, panW, panH, 14, '#d97706');

    // Header Title Plaque
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 15px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = '#d97706';
    ctx.shadowBlur = 6;
    ctx.fillText('◈ ARSENAL FULL ◈', LW / 2, panY + 16);
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
    ctx.font = 'italic 9.5px Crimson Text, serif';
    ctx.fillText('Discovered Equipment Cache · Armory At Maximum Capacity', LW / 2, panY + 36);

    // Discovered Weapon Card Showcase
    const cardX = panX + 24, cardY = panY + 54, cardW = panW - 48, cardH = 68;
    drawStoneCard(ctx, cardX, cardY, cardW, cardH, {
      cornerSize: 4,
      isSelected: true,
      glowColor: rarCol
    });

    // Large pixel icon on the left
    const iconCx = cardX + 38;
    const iconCy = cardY + cardH / 2;
    drawPixelWeaponIcon(ctx, nw.id, iconCx, iconCy, true, rarCol, 2.0);

    // Weapon details
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = rarCol;
    const wepTitle = (nw.name || nw.id || 'Weapon').toUpperCase();
    drawFittedText(ctx, `${wepTitle} [${rar.name.toUpperCase()}]`, cardX + 74, cardY + 22, cardW - 90, 'Cinzel, serif', 13, 10, true);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 10px Cinzel, serif';
    const dmgVal = nw.damage || nw.dmg || 2;
    const wepType = (nw.type || 'Melee').toUpperCase();
    ctx.fillText(`POWER: ${dmgVal} DMG  ·  TYPE: ${wepType}`, cardX + 74, cardY + 44);

    // Concise message explaining full slots
    ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
    ctx.font = '11px Crimson Text, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('All three weapon slots in your armory are currently occupied.', LW / 2, panY + 134);

    // Two Forged Action Buttons
    const mouseX = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.mx : -999;
    const mouseY = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.my : -999;
    const isMouseDown = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.isDown : false;

    const btnW1 = 180, btnW2 = 140, btnH = 36;
    const gap = 16;
    const totalBtnW = btnW1 + btnW2 + gap;
    const btn1X = LW / 2 - totalBtnW / 2;
    const btn2X = btn1X + btnW1 + gap;
    const btnY = panY + 164;

    const hov1 = mouseX >= btn1X && mouseX <= btn1X + btnW1 && mouseY >= btnY && mouseY <= btnY + btnH;
    const hov2 = mouseX >= btn2X && mouseX <= btn2X + btnW2 && mouseY >= btnY && mouseY <= btnY + btnH;

    // 1. SWAP WEAPON (Primary Highlighted Gold Button)
    drawStoneButton(ctx, '◈ SWAP WEAPON', btn1X, btnY, btnW1, btnH, {
      isHover: hov1,
      isPressed: hov1 && isMouseDown,
      isSelected: false,
      variant: 'primary',
      fontSize: 11,
      cornerSize: 4
    });

    _activePromptButtons.push({
      id: 'swap_weapon',
      x: btn1X, y: btnY, w: btnW1, h: btnH,
      action: () => switchToSelector()
    });

    // 2. CANCEL (Secondary Subdued Steel Button)
    drawStoneButton(ctx, 'CANCEL', btn2X, btnY, btnW2, btnH, {
      isHover: hov2,
      isPressed: hov2 && isMouseDown,
      isSelected: false,
      variant: 'normal',
      fontSize: 11,
      cornerSize: 4
    });

    _activePromptButtons.push({
      id: 'cancel_prompt',
      x: btn2X, y: btnY, w: btnW2, h: btnH,
      action: () => discardReplacementWeapon()
    });

    // Navigation Hint
    ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
    ctx.font = '9.5px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Press [ Enter / E ] to Swap   ·   Press [ Esc ] to Cancel', LW / 2, panY + panH - 22);
  },

  // ─────────────────────────────────────────────────────────────
  // MODE 2: CLEAR 3-SLOT REPLACEMENT SELECTOR
  // ─────────────────────────────────────────────────────────────
  drawSelectorMode(ctx, modal) {
    _activeSelectorButtons = [];
    const nw = modal.newWeapon;
    const newDmg = nw.damage || nw.dmg || 2;
    const nwRar = nw.rarity || { name: 'Common', col: '#94a3b8' };
    const nwRarCol = nwRar.col || '#94a3b8';
    const nwName = (nw.name || nw.id || 'Weapon').toUpperCase();

    const panW = SELECTOR_PAN_W;
    const panH = SELECTOR_PAN_H;
    const panX = Math.round((LW - panW) / 2);
    const panY = Math.round((LH - panH) / 2);

    // Chassis: Deep obsidian/stone panel
    drawStonePanel(ctx, panX, panY, panW, panH, { cornerSize: 8, elevation: 3 });
    drawCornerBrackets(ctx, panX, panY, panW, panH, 16, '#d97706');

    // Header Plaque
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 15px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = '#d97706';
    ctx.shadowBlur = 6;
    ctx.fillText('◈ ARSENAL FULL — SELECT WEAPON TO REPLACE ◈', LW / 2, panY + 16);
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
    ctx.font = 'italic 9.5px Crimson Text, serif';
    ctx.fillText('Choose an owned weapon to replace, or cancel to keep your current loadout.', LW / 2, panY + 36);

    // Top Discovered Item Ribbon
    const ribX = panX + 24, ribY = panY + 54, ribW = panW - 48, ribH = 36;
    drawStoneCard(ctx, ribX, ribY, ribW, ribH, {
      cornerSize: 4,
      isSelected: true,
      glowColor: nwRarCol
    });

    // Small icon in ribbon
    drawPixelWeaponIcon(ctx, nw.id, ribX + 22, ribY + ribH / 2, true, nwRarCol, 1.2);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 10px Cinzel, serif';
    ctx.fillText('DISCOVERED ITEM:', ribX + 44, ribY + ribH / 2);

    ctx.fillStyle = nwRarCol;
    // Guaranteed fit for discovered weapon name + rarity
    drawFittedText(ctx, `${nwName} [${nwRar.name.toUpperCase()}]`, ribX + 168, ribY + ribH / 2, ribW - 290, 'Cinzel, serif', 11, 8.5, true);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 10px Cinzel, serif';
    ctx.textAlign = 'right';
    ctx.fillText(`POWER: ${newDmg} DMG`, ribX + ribW - 14, ribY + ribH / 2);

    // 3 Slot Replacement Cards
    const mouseX = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.mx : -999;
    const mouseY = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.my : -999;
    const isMouseDown = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.isDown : false;

    const cardGap = 12;
    const cardW = Math.floor((panW - 48 - 2 * cardGap) / 3);
    const cardH = 210;
    const cardY = panY + 100;

    for (let i = 0; i < 3; i++) {
      const cx = panX + 24 + i * (cardW + cardGap);
      const curWep = GameState.weaponSlots ? GameState.weaponSlots[i] : null;
      const isEquipped = (i === GameState.activeWeaponSlot);
      const isCardHover = mouseX >= cx && mouseX <= cx + cardW && mouseY >= cardY && mouseY <= cardY + cardH;

      ctx.save();
      // Card chassis using drawStoneCard
      drawStoneCard(ctx, cx, cardY, cardW, cardH, {
        isHover: isCardHover,
        isSelected: isEquipped,
        cornerSize: 5,
        glowColor: isEquipped ? '#fde68a' : null
      });

      // Card Header
      ctx.fillStyle = isEquipped ? '#fde68a' : '#94a3b8';
      ctx.font = 'bold 10px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const slotTitle = `SLOT ${i + 1}`;
      ctx.fillText(slotTitle, cx + cardW / 2, cardY + 8);

      if (isEquipped) {
        ctx.fillStyle = 'rgba(217, 119, 6, 0.25)';
        ctx.strokeStyle = '#fde68a';
        ctx.lineWidth = 1;
        roundRect(ctx, cx + cardW / 2 - 34, cardY + 22, 68, 14, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 7.5px Cinzel, serif';
        ctx.textBaseline = 'middle';
        ctx.fillText('EQUIPPED', cx + cardW / 2, cardY + 29);
      } else {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.font = '7.5px Cinzel, serif';
        ctx.textBaseline = 'middle';
        ctx.fillText('AVAILABLE', cx + cardW / 2, cardY + 29);
      }

      if (curWep) {
        const curRar = curWep.rarity || { name: 'Common', col: '#94a3b8' };
        const curRarCol = curRar.col || '#94a3b8';
        const curDmg = curWep.damage || curWep.dmg || 2;
        const curName = (curWep.name || curWep.id || 'Weapon').toUpperCase();

        // Icon comparison row (Current ➔ New)
        const rowMidY = cardY + 58;
        drawPixelWeaponIcon(ctx, curWep.id, cx + cardW / 2 - 30, rowMidY, false, curRarCol, 1.25);

        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 12px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('➔', cx + cardW / 2, rowMidY);

        drawPixelWeaponIcon(ctx, nw.id, cx + cardW / 2 + 30, rowMidY, true, nwRarCol, 1.25);

        // Current weapon name - guaranteed fit without overlapping
        ctx.fillStyle = curRarCol;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        drawFittedText(ctx, curName, cx + cardW / 2, cardY + 80, cardW - 16, 'Cinzel, serif', 10, 7.5, true);

        // Damage Delta comparison
        const diff = (newDmg - curDmg);
        const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : `${diff.toFixed(1)}`;
        const diffCol = diff > 0 ? '#4ade80' : (diff < 0 ? '#f87171' : '#cbd5e1');

        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'bold 9px Cinzel, serif';
        ctx.fillText(`DMG: ${curDmg} ➔ ${newDmg}`, cx + cardW / 2, cardY + 98);

        // Delta indicator
        ctx.fillStyle = diffCol;
        ctx.font = 'bold 8.5px Cinzel, serif';
        ctx.fillText(`(${diffStr} POWER)`, cx + cardW / 2, cardY + 112);

        // Tier transition
        ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
        drawFittedText(ctx, `${curRar.name} ➔ ${nwRar.name}`, cx + cardW / 2, cardY + 126, cardW - 16, 'Crimson Text, serif', 9, 7.5, false);
      } else {
        ctx.fillStyle = '#64748b';
        ctx.font = 'italic 11px Crimson Text, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('[ EMPTY SLOT ]', cx + cardW / 2, cardY + 80);
      }

      // Replace Confirmation Button using drawStoneButton
      const rBtnX = cx + 8;
      const rBtnY = cardY + cardH - 46;
      const rBtnW = cardW - 16;
      const rBtnH = 34;
      const isRBtnHover = mouseX >= rBtnX && mouseX <= rBtnX + rBtnW && mouseY >= rBtnY && mouseY <= rBtnY + rBtnH;

      drawStoneButton(ctx, `[ ${i + 1} ] REPLACE`, rBtnX, rBtnY, rBtnW, rBtnH, {
        isHover: isRBtnHover,
        isPressed: isRBtnHover && isMouseDown,
        isSelected: isEquipped,
        variant: isEquipped ? 'primary' : 'normal',
        fontSize: 9.5,
        cornerSize: 4
      });

      _activeSelectorButtons.push({
        id: `replace_slot_${i}`,
        slot: i,
        x: cx, y: cardY, w: cardW, h: cardH,
        action: () => replaceWeaponSlot(i, nw)
      });

      ctx.restore();
    }

    // Bottom Action: CANCEL / KEEP LOADOUT
    const canBtnW = 320;
    const canBtnH = 34;
    const canBtnX = LW / 2 - canBtnW / 2;
    const canBtnY = panY + panH - 52;
    const isCanHover = mouseX >= canBtnX && mouseX <= canBtnX + canBtnW && mouseY >= canBtnY && mouseY <= canBtnY + canBtnH;

    drawStoneButton(ctx, '◈ CANCEL / KEEP CURRENT LOADOUT [ ESC ]', canBtnX, canBtnY, canBtnW, canBtnH, {
      isHover: isCanHover,
      isPressed: isCanHover && isMouseDown,
      isSelected: false,
      variant: 'normal',
      fontSize: 9.5,
      cornerSize: 4
    });

    _activeSelectorButtons.push({
      id: 'cancel_selector',
      x: canBtnX, y: canBtnY, w: canBtnW, h: canBtnH,
      action: () => discardReplacementWeapon()
    });

    // Navigation hints
    ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
    ctx.font = '9px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Press [ 1 ], [ 2 ], or [ 3 ] to Replace   ·   Press [ Esc ] to Cancel', LW / 2, panY + panH - 12);
  },

  drawWeaponReplaceModal(ctx) {
    this.draw(ctx);
  },

  handleClick(mx, my) {
    const modal = GameState.pendingWeaponDrop || GameState.ACTIVE_WEAPON_REPLACE_MODAL;
    if (!modal) return false;

    const mode = modal.mode || 'prompt';

    if (mode === 'prompt') {
      const panW = 480, panH = 260;
      const panX = (LW - panW) / 2, panY = (LH - panH) / 2;

      // Click outside -> Cancel
      if (mx < panX || mx > panX + panW || my < panY || my > panY + panH) {
        discardReplacementWeapon();
        return true;
      }

      for (const btn of _activePromptButtons) {
        if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
          if (btn.action) btn.action();
          return true;
        }
      }
    } else {
      const panW = SELECTOR_PAN_W, panH = SELECTOR_PAN_H;
      const panX = (LW - panW) / 2, panY = (LH - panH) / 2;

      // Click outside -> Cancel
      if (mx < panX || mx > panX + panW || my < panY || my > panY + panH) {
        discardReplacementWeapon();
        return true;
      }

      for (const btn of _activeSelectorButtons) {
        if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
          if (btn.action) btn.action();
          return true;
        }
      }
    }

    return true; // Consume all clicks while modal is active
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
  window.InventoryUI = InventoryUI;
}

