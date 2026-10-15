// =====================================================================
//  DUNGEON BREAK — js/ui/SanctumUI.js
//  Authoritative Abyss Sanctum Metaprogression & Prestige Legacy UI
//  Architecture: Category Navigation, Central Scrollable List, Right Inspector
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, roundRect } from '../core/Constants.js';
import { TALENT_DEFS, TALENT_KEYS, TALENT_CATEGORIES, LEGACY_DEFS, LEGACY_KEYS } from '../data/talents.js';
import { ProgressionSystem } from '../systems/ProgressionSystem.js';
import { AudioManager } from '../audio/AudioManager.js';
import { InputManager } from '../core/InputManager.js';

let SANCTUM_SLIDE = 0;
let _currentMode = 'talents'; // 'talents' | 'legacy'
let _currentCategory = 'all'; // 'all' | 'survival' | 'weapons' | 'technique' | 'utility'
let _selectedKey = 'vitality';
let _scrollOffset = 0;
let _ambientTimer = 0;
const _interactiveZones = [];

export function openSanctum() {
  SANCTUM_SLIDE = 0;
  _scrollOffset = 0;
  _currentMode = 'talents';
  _currentCategory = 'all';
  _selectedKey = 'vitality';
  GameState.setState(GameStates.SANCTUM);
  AudioManager.playSFX('panel_open');
}

export function closeSanctum() {
  AudioManager.playSFX('panel_close');
  GameState.setState(GameStates.TITLE);
}

export const SanctumUI = {
  handleKeyDown(key) {
    if (key === 'Escape') {
      closeSanctum();
      return true;
    }
    return false;
  },

  handleWheel(deltaY) {
    _scrollOffset = Math.max(0, _scrollOffset + (deltaY > 0 ? 30 : -30));
  },

  draw(ctx, dt = 0.016) {
    SANCTUM_SLIDE = Math.min(1, SANCTUM_SLIDE + dt * 6.0);
    _ambientTimer += dt;
    _interactiveZones.length = 0;

    const eased = 1 - Math.pow(1 - SANCTUM_SLIDE, 3);
    const panW = 860;
    const panH = 510;
    const panX = Math.round((LW - panW) / 2);
    const panY = Math.round((LH - panH) / 2 - (1 - eased) * 35);

    ctx.save();
    ctx.globalAlpha = eased;

    // Dark backdrop blur
    ctx.fillStyle = 'rgba(2, 4, 10, 0.88)';
    ctx.fillRect(0, 0, LW, LH);

    // Occult Altar Radial Ambient Glow
    const pulse = 0.5 + 0.5 * Math.sin(_ambientTimer * 2.2);
    const grad = ctx.createRadialGradient(panX + panW / 2, panY + 140, 20, panX + panW / 2, panY + 220, 420);
    if (_currentMode === 'legacy') {
      grad.addColorStop(0, `rgba(217, 119, 6, ${0.18 + pulse * 0.05})`);
      grad.addColorStop(0.6, 'rgba(180, 83, 9, 0.07)');
    } else {
      grad.addColorStop(0, `rgba(147, 51, 234, ${0.18 + pulse * 0.05})`);
      grad.addColorStop(0.6, 'rgba(88, 28, 135, 0.07)');
    }
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(panX - 40, panY - 40, panW + 80, panH + 80);

    // Outer Sanctum Frame
    ctx.fillStyle = 'rgba(7, 9, 18, 0.98)';
    ctx.strokeStyle = _currentMode === 'legacy' ? 'rgba(245, 158, 11, 0.65)' : 'rgba(168, 85, 247, 0.6)';
    ctx.lineWidth = 1.8;
    roundRect(ctx, panX, panY, panW, panH, 12);
    ctx.fill();
    ctx.stroke();

    // Inner gold-embossed trim
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.3)';
    ctx.lineWidth = 1;
    roundRect(ctx, panX + 4, panY + 4, panW - 8, panH - 8, 9);
    ctx.stroke();

    const mouseX = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.mx : -999;
    const mouseY = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.my : -999;

    // ─────────────────────────────────────────────────────────────
    // 1. TOP HEADER & CURRENCY STATUS
    // ─────────────────────────────────────────────────────────────
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
    ctx.font = '10px monospace';
    ctx.fillText('᚛ ᚛ ᚛  THE ABYSSAL ASCENSION CHAMBER  ᚜ ᚜ ᚜', panX + panW / 2, panY + 12);

    ctx.fillStyle = _currentMode === 'legacy' ? '#fef08a' : '#f3e8ff';
    ctx.font = 'bold 18px Cinzel, serif';
    ctx.shadowColor = _currentMode === 'legacy' ? '#d97706' : '#a855f7';
    ctx.shadowBlur = 10;
    ctx.fillText('THE ABYSS SANCTUM', panX + panW / 2, panY + 24);
    ctx.shadowBlur = 0;

    // Currencies Balance Badges (Top Center)
    const souls = GameState.ABYSS_SOULS || 0;
    const tokens = GameState.PRESTIGE_TOKENS || 0;

    const badgeY = panY + 46;
    // Souls badge
    ctx.fillStyle = 'rgba(88, 28, 135, 0.35)';
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.6)';
    ctx.lineWidth = 1;
    roundRect(ctx, panX + 16, badgeY, 160, 24, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`◈ SOULS: ${souls.toLocaleString()}`, panX + 96, badgeY + 12);

    // Prestige tokens badge
    ctx.fillStyle = 'rgba(180, 83, 9, 0.3)';
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
    roundRect(ctx, panX + 184, badgeY, 170, 24, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.fillText(`♛ PRESTIGE: ${tokens}`, panX + 269, badgeY + 12);

    // Mode Switcher Tabs (Top Right)
    const modeTabs = [
      { id: 'talents', label: '◈ SOUL TALENTS', w: 145 },
      { id: 'legacy',  label: '♛ LEGACY REPERTOIRE', w: 175 }
    ];
    let modeX = panX + panW - 16 - 175 - 150;
    modeTabs.forEach(mt => {
      const isSel = _currentMode === mt.id;
      const isHover = mouseX >= modeX && mouseX <= modeX + mt.w && mouseY >= badgeY && mouseY <= badgeY + 24;

      ctx.fillStyle = isSel
        ? (mt.id === 'legacy' ? 'rgba(217, 119, 6, 0.35)' : 'rgba(147, 51, 234, 0.35)')
        : (isHover ? 'rgba(30, 41, 59, 0.8)' : 'rgba(15, 23, 42, 0.6)');
      ctx.strokeStyle = isSel
        ? (mt.id === 'legacy' ? '#fde047' : '#c084fc')
        : (isHover ? '#cbd5e1' : 'rgba(71, 85, 105, 0.5)');
      ctx.lineWidth = isSel ? 1.5 : 1;
      roundRect(ctx, modeX, badgeY, mt.w, 24, 5);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = isSel ? '#ffffff' : (isHover ? '#f1f5f9' : '#94a3b8');
      ctx.font = 'bold 10px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(mt.label, modeX + mt.w / 2, badgeY + 12);

      _interactiveZones.push({
        id: `mode_${mt.id}`,
        x: modeX, y: badgeY, w: mt.w, h: 24,
        action: () => {
          if (_currentMode !== mt.id) {
            _currentMode = mt.id;
            _scrollOffset = 0;
            _selectedKey = mt.id === 'legacy' ? LEGACY_KEYS[0] : 'vitality';
            AudioManager.playSFX('menu_select');
          }
        }
      });
      modeX += mt.w + 6;
    });

    // Main Content Split Layout
    const contentY = badgeY + 32;
    const contentH = panY + panH - contentY - 46;

    // ─────────────────────────────────────────────────────────────
    // 2. LEFT COLUMN: CATEGORY NAVIGATION (w: 136)
    // ─────────────────────────────────────────────────────────────
    const leftX = panX + 16;
    const leftW = 136;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1;
    roundRect(ctx, leftX, contentY, leftW, contentH, 8);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('CATEGORIES', leftX + leftW / 2, contentY + 10);

    const categories = _currentMode === 'talents'
      ? [
          { id: 'all', label: 'All Disciplines', icon: '◈' },
          { id: 'survival', label: 'Survival', icon: 'ᛟ' },
          { id: 'weapons', label: 'Weaponry', icon: '⚔' },
          { id: 'technique', label: 'Technique', icon: 'ᛋ' },
          { id: 'utility', label: 'Utility', icon: '✦' }
        ]
      : [
          { id: 'all', label: 'All Legacies', icon: '♛' }
        ];

    const catBtnH = 34;
    categories.forEach((cat, idx) => {
      const cy = contentY + 30 + idx * (catBtnH + 6);
      const isSel = _currentCategory === cat.id;
      const isHover = mouseX >= leftX + 6 && mouseX <= leftX + leftW - 6 && mouseY >= cy && mouseY <= cy + catBtnH;

      ctx.fillStyle = isSel
        ? 'rgba(147, 51, 234, 0.28)'
        : (isHover ? 'rgba(30, 41, 59, 0.7)' : 'rgba(15, 23, 42, 0.5)');
      ctx.strokeStyle = isSel ? '#c084fc' : (isHover ? '#94a3b8' : 'rgba(51, 65, 85, 0.5)');
      ctx.lineWidth = isSel ? 1.3 : 1;
      roundRect(ctx, leftX + 6, cy, leftW - 12, catBtnH, 5);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = isSel ? '#fef08a' : (isHover ? '#ffffff' : '#94a3b8');
      ctx.font = 'bold 10px Cinzel, serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${cat.icon} ${cat.label}`, leftX + 12, cy + catBtnH / 2);

      _interactiveZones.push({
        id: `cat_${cat.id}`,
        x: leftX + 6, y: cy, w: leftW - 12, h: catBtnH,
        action: () => {
          if (_currentCategory !== cat.id) {
            _currentCategory = cat.id;
            _scrollOffset = 0;
            // Select first item in new category
            const filtered = this.getFilteredItems();
            if (filtered.length > 0) _selectedKey = filtered[0].id;
            AudioManager.playSFX('menu_select');
          }
        }
      });
    });

    // ─────────────────────────────────────────────────────────────
    // 3. CENTER COLUMN: SCROLLABLE UPGRADES LIST (w: 320)
    // ─────────────────────────────────────────────────────────────
    const centerLeft = leftX + leftW + 12;
    const centerW = 320;

    ctx.fillStyle = 'rgba(10, 15, 28, 0.6)';
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    roundRect(ctx, centerLeft, contentY, centerW, contentH, 8);
    ctx.fill(); ctx.stroke();

    const items = this.getFilteredItems();
    const itemH = 62;
    const gap = 6;
    const maxVisibleH = contentH - 12;
    const totalListH = items.length * (itemH + gap);
    const maxScroll = Math.max(0, totalListH - maxVisibleH);
    _scrollOffset = Math.min(_scrollOffset, maxScroll);

    ctx.save();
    ctx.beginPath();
    roundRect(ctx, centerLeft + 4, contentY + 6, centerW - 8, maxVisibleH, 6);
    ctx.clip();

    items.forEach((item, idx) => {
      const iy = contentY + 8 + idx * (itemH + gap) - _scrollOffset;
      if (iy + itemH < contentY || iy > contentY + contentH) return;

      const isSel = _selectedKey === item.id;
      const isHover = mouseX >= centerLeft + 6 && mouseX <= centerLeft + centerW - 6 && mouseY >= iy && mouseY <= iy + itemH;

      const isLegacy = _currentMode === 'legacy';
      const rank = isLegacy ? ProgressionSystem.getLegacyRank(item.id) : ProgressionSystem.getTalentRank(item.id);
      const isMax = rank >= item.max;
      const cost = isMax ? 0 : item.costs[rank];
      const canAfford = isLegacy ? (tokens >= cost) : (souls >= cost);

      // Card Background
      if (isSel) {
        ctx.fillStyle = isLegacy ? 'rgba(180, 83, 9, 0.35)' : 'rgba(126, 34, 206, 0.35)';
        ctx.strokeStyle = isLegacy ? '#fde047' : '#c084fc';
        ctx.lineWidth = 1.5;
      } else if (isMax) {
        ctx.fillStyle = 'rgba(30, 24, 15, 0.7)';
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.45)';
        ctx.lineWidth = 1;
      } else {
        ctx.fillStyle = isHover ? 'rgba(25, 33, 52, 0.8)' : 'rgba(15, 23, 42, 0.6)';
        ctx.strokeStyle = isHover ? '#94a3b8' : 'rgba(51, 65, 85, 0.4)';
        ctx.lineWidth = 1;
      }
      roundRect(ctx, centerLeft + 6, iy, centerW - 12, itemH, 6);
      ctx.fill(); ctx.stroke();

      // Icon Box
      ctx.fillStyle = isMax ? 'rgba(234, 179, 8, 0.15)' : 'rgba(147, 51, 234, 0.15)';
      ctx.strokeStyle = isMax ? 'rgba(234, 179, 8, 0.4)' : 'rgba(168, 85, 247, 0.3)';
      roundRect(ctx, centerLeft + 12, iy + 8, 44, 44, 5);
      ctx.fill(); ctx.stroke();

      ctx.font = '20px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.icon, centerLeft + 34, iy + 30);

      // Name & Rank Pips
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = isMax ? '#fef08a' : (isSel ? '#ffffff' : '#f1f5f9');
      ctx.font = 'bold 11px Cinzel, serif';
      ctx.fillText(item.name, centerLeft + 64, iy + 10);

      // Rank Pips
      for (let p = 0; p < item.max; p++) {
        const pipX = centerLeft + 64 + p * 14;
        const pipY = iy + 26;
        if (p < rank) {
          ctx.fillStyle = isMax ? '#facc15' : (isLegacy ? '#fbbf24' : '#c084fc');
          ctx.strokeStyle = isMax ? '#eab308' : (isLegacy ? '#f59e0b' : '#a855f7');
        } else {
          ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
          ctx.strokeStyle = 'rgba(71, 85, 105, 0.5)';
        }
        ctx.lineWidth = 1;
        roundRect(ctx, pipX, pipY, 10, 8, 2);
        ctx.fill(); ctx.stroke();
      }

      ctx.fillStyle = isMax ? '#facc15' : 'rgba(203, 213, 225, 0.75)';
      ctx.font = '9px Cinzel, serif';
      ctx.fillText(`Rank ${rank}/${item.max}`, centerLeft + 64 + item.max * 14 + 6, iy + 26);

      // Status Badge (Right aligned)
      const badgeW = 74;
      const badgeH = 22;
      const bx = centerLeft + centerW - badgeW - 14;
      const by = iy + 18;

      if (isMax) {
        ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.6)';
        roundRect(ctx, bx, by, badgeW, badgeH, 4);
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 9px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★ MAXED', bx + badgeW / 2, by + badgeH / 2);
      } else if (canAfford) {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
        roundRect(ctx, bx, by, badgeW, badgeH, 4);
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 9px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${cost} ${isLegacy ? '♛' : '◈'}`, bx + badgeW / 2, by + badgeH / 2);
      } else {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        roundRect(ctx, bx, by, badgeW, badgeH, 4);
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 8.5px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`SHORT ${cost - (isLegacy ? tokens : souls)}`, bx + badgeW / 2, by + badgeH / 2);
      }

      _interactiveZones.push({
        id: `item_${item.id}`,
        x: centerLeft + 6, y: iy, w: centerW - 12, h: itemH,
        action: () => {
          _selectedKey = item.id;
          AudioManager.playSFX('ui_click');
        }
      });
    });
    ctx.restore();

    // ─────────────────────────────────────────────────────────────
    // 4. RIGHT COLUMN: DETAILED INSPECTOR PANEL (w: 326)
    // ─────────────────────────────────────────────────────────────
    const rightX = centerLeft + centerW + 12;
    const rightW = panX + panW - rightX - 16;

    ctx.fillStyle = 'rgba(10, 15, 30, 0.78)';
    ctx.strokeStyle = _currentMode === 'legacy' ? 'rgba(217, 119, 6, 0.45)' : 'rgba(201, 168, 76, 0.45)';
    roundRect(ctx, rightX, contentY, rightW, contentH, 8);
    ctx.fill(); ctx.stroke();

    const selectedItem = _currentMode === 'legacy' ? LEGACY_DEFS[_selectedKey] : TALENT_DEFS[_selectedKey];
    if (selectedItem) {
      this.drawInspector(ctx, selectedItem, rightX, contentY, rightW, contentH, mouseX, mouseY);
    }

    // ─────────────────────────────────────────────────────────────
    // 5. BOTTOM BAR: RETURN BUTTON
    // ─────────────────────────────────────────────────────────────
    const closeW = 220;
    const closeH = 32;
    const closeX = Math.round(panX + panW / 2 - closeW / 2);
    const closeY = panY + panH - 40;
    const isCloseHovered = mouseX >= closeX && mouseX <= closeX + closeW && mouseY >= closeY && mouseY <= closeY + closeH;

    ctx.fillStyle = isCloseHovered ? 'rgba(75, 85, 99, 0.85)' : 'rgba(30, 41, 59, 0.8)';
    ctx.strokeStyle = isCloseHovered ? '#fde68a' : 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 1.2;
    roundRect(ctx, closeX, closeY, closeW, closeH, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = isCloseHovered ? '#ffffff' : '#cbd5e1';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('◈ RETURN TO SANCTUARY ( Esc )', closeX + closeW / 2, closeY + closeH / 2);

    _interactiveZones.push({
      id: 'btn_close',
      x: closeX, y: closeY, w: closeW, h: closeH,
      action: () => closeSanctum()
    });

    ctx.restore();
  },

  drawInspector(ctx, item, rx, ry, rw, rh, mouseX, mouseY) {
    const isLegacy = _currentMode === 'legacy';
    const rank = isLegacy ? ProgressionSystem.getLegacyRank(item.id) : ProgressionSystem.getTalentRank(item.id);
    const isMax = rank >= item.max;
    const cost = isMax ? 0 : item.costs[rank];
    const balance = isLegacy ? (GameState.PRESTIGE_TOKENS || 0) : (GameState.ABYSS_SOULS || 0);
    const canAfford = !isMax && balance >= cost;

    // Header Tag & Icon
    ctx.fillStyle = isLegacy ? '#fbbf24' : '#c084fc';
    ctx.font = 'bold 10px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const catName = isLegacy ? 'LEGACY ASCENSION PERK' : (TALENT_CATEGORIES[item.category]?.name || 'SOUL DISCIPLINE');
    ctx.fillText(`[ ${catName.toUpperCase()} ]`, rx + 16, ry + 16);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Cinzel, serif';
    ctx.fillText(item.name, rx + 16, ry + 32);

    // Rank subtitle
    ctx.fillStyle = isMax ? '#facc15' : '#94a3b8';
    ctx.font = '11px Cinzel, serif';
    ctx.fillText(`Current Rank: ${rank} of ${item.max}`, rx + 16, ry + 54);

    // Divider
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rx + 16, ry + 72);
    ctx.lineTo(rx + rw - 16, ry + 72);
    ctx.stroke();

    // Flavor Description
    ctx.fillStyle = 'rgba(203, 213, 225, 0.85)';
    ctx.font = '11px Crimson Text, serif';
    const lines = this.wrapText(ctx, item.detail || item.desc, rw - 32);
    lines.forEach((l, idx) => {
      ctx.fillText(l, rx + 16, ry + 84 + idx * 16);
    });

    const previewY = ry + 84 + Math.max(2, lines.length) * 16 + 12;

    // Stat Preview Box
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)';
    roundRect(ctx, rx + 14, previewY, rw - 28, 90, 6);
    ctx.fill(); ctx.stroke();

    const preview = isLegacy ? ProgressionSystem.getLegacyPreview(item.id, rank) : ProgressionSystem.getStatPreview(item.id, rank);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.fillText('CURRENT EFFECT:', rx + 24, previewY + 12);

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.fillText(preview.current, rx + 24, previewY + 26);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.fillText(isMax ? 'MAX POWER ACHIEVED:' : 'NEXT RANK IMPROVEMENT:', rx + 24, previewY + 48);

    ctx.fillStyle = isMax ? '#facc15' : '#a78bfa';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.fillText(isMax ? '★ Unshackled Maximum Ascension' : `${preview.next} (${preview.bonus})`, rx + 24, previewY + 62);

    // Legacy Earning Explanation (If in Legacy mode)
    if (isLegacy) {
      const expY = previewY + 102;
      ctx.fillStyle = 'rgba(180, 83, 9, 0.15)';
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      roundRect(ctx, rx + 14, expY, rw - 28, 64, 6);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 9px Cinzel, serif';
      ctx.fillText('◈ PRESTIGE CURRENCY RULE:', rx + 22, expY + 10);

      ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
      ctx.font = '10px Crimson Text, serif';
      const pRules = this.wrapText(ctx, 'Awarded strictly upon completing a Warden ending (Hero, Betrayal, or Rampage). Persists permanently across all runs.', rw - 44);
      pRules.forEach((pr, idx) => {
        ctx.fillText(pr, rx + 22, expY + 24 + idx * 14);
      });
    }

    // Purchase Action Button
    const btnW = rw - 32;
    const btnH = 46;
    const btnX = rx + 16;
    const btnY = ry + rh - btnH - 16;
    const isBtnHovered = mouseX >= btnX && mouseX <= btnX + btnW && mouseY >= btnY && mouseY <= btnY + btnH;

    if (isMax) {
      ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.7)';
      ctx.lineWidth = 1.2;
      roundRect(ctx, btnX, btnY, btnW, btnH, 6);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 11px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★ ASCENDED TO MAXIMUM RANK', btnX + btnW / 2, btnY + btnH / 2);
    } else if (canAfford) {
      ctx.fillStyle = isBtnHovered
        ? (isLegacy ? 'rgba(217, 119, 6, 0.6)' : 'rgba(147, 51, 234, 0.6)')
        : (isLegacy ? 'rgba(180, 83, 9, 0.4)' : 'rgba(126, 34, 206, 0.4)');
      ctx.strokeStyle = isBtnHovered
        ? '#fde68a'
        : (isLegacy ? 'rgba(245, 158, 11, 0.85)' : 'rgba(168, 85, 247, 0.8)');
      ctx.lineWidth = isBtnHovered ? 1.8 : 1.2;
      roundRect(ctx, btnX, btnY, btnW, btnH, 6);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const actLabel = isLegacy ? `UPGRADE LEGACY · ${cost} ♛` : `EMPOWER TALENT · ${cost} ◈`;
      ctx.fillText(actLabel, btnX + btnW / 2, btnY + btnH / 2 - 5);

      ctx.fillStyle = isLegacy ? '#fef08a' : '#d8b4fe';
      ctx.font = '9px Cinzel, serif';
      ctx.fillText('CLICK TO CONSUME & UPGRADE', btnX + btnW / 2, btnY + btnH / 2 + 9);

      _interactiveZones.push({
        id: `buy_${item.id}`,
        x: btnX, y: btnY, w: btnW, h: btnH,
        action: () => {
          if (isLegacy) {
            if (ProgressionSystem.buyLegacy(item.id)) {
              AudioManager.playSFX('talent_unlock');
            } else {
              AudioManager.playSFX('ui_error');
            }
          } else {
            if (ProgressionSystem.buyTalent(item.id)) {
              AudioManager.playSFX('talent_unlock');
            } else {
              AudioManager.playSFX('ui_error');
            }
          }
        }
      });
    } else {
      ctx.fillStyle = 'rgba(20, 24, 38, 0.6)';
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
      ctx.lineWidth = 1;
      roundRect(ctx, btnX, btnY, btnW, btnH, 6);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 10px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const currIcon = isLegacy ? '♛' : '◈';
      ctx.fillText(`INSUFFICIENT ${isLegacy ? 'PRESTIGE' : 'SOULS'} (NEED ${cost} ${currIcon})`, btnX + btnW / 2, btnY + btnH / 2 - 5);

      ctx.fillStyle = '#64748b';
      ctx.font = '9px Cinzel, serif';
      ctx.fillText(`(Short ${cost - balance} ${currIcon})`, btnX + btnW / 2, btnY + btnH / 2 + 8);
    }
  },

  getFilteredItems() {
    if (_currentMode === 'legacy') {
      return LEGACY_KEYS.map(k => LEGACY_DEFS[k]);
    }
    const all = TALENT_KEYS.map(k => TALENT_DEFS[k]);
    if (_currentCategory === 'all') return all;
    return all.filter(t => t.category === _currentCategory);
  },

  wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    words.forEach(w => {
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > maxWidth) {
        if (cur) lines.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    });
    if (cur) lines.push(cur);
    return lines;
  },

  handleClick(mx, my) {
    for (const z of _interactiveZones) {
      if (mx >= z.x && mx <= z.x + z.w && my >= z.y && my <= z.y + z.h) {
        if (z.action) {
          z.action();
          return true;
        }
      }
    }

    // Click outside panel returns to Title
    const panW = 860, panH = 510;
    const panX = (LW - panW) / 2, panY = (LH - panH) / 2;
    if (mx < panX || mx > panX + panW || my < panY || my > panY + panH) {
      closeSanctum();
      return true;
    }

    return false;
  }
};

export function drawSanctumPanel(ctx, dt) {
  SanctumUI.draw(ctx, dt);
}

SanctumUI._interactiveZones = _interactiveZones;

if (typeof window !== 'undefined') {
  window.SanctumUI = SanctumUI;
  window.openSanctum = openSanctum;
  window.closeSanctum = closeSanctum;
  window.addEventListener('wheel', (e) => {
    if (GameState.STATE === GameStates.SANCTUM) {
      SanctumUI.handleWheel(e.deltaY);
    }
  }, { passive: true });
}
