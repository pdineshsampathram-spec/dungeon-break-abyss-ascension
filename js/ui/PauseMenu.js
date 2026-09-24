// =====================================================================
//  DUNGEON BREAK — js/ui/PauseMenu.js
//  Authoritative In-Game Pause, Settings, & Achievements Modal Panels
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, roundRect } from '../core/Constants.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { AudioManager } from '../audio/AudioManager.js';
import { MobileControls } from './MobileControls.js';

let _pauseBtns = [];
let SETTINGS_SLIDE = 0;
let ACHIEV_SLIDE = 0;
let ACHIEV_SCROLL = 0;

export function pauseGame() {
  if (GameState.STATE === GameStates.PLAYING) {
    GameState.setState(GameStates.PAUSED);
    const sp = document.getElementById('ingame-speed-panel');
    if (sp) sp.style.display = 'none';
  }
}

export function resumeGame() {
  if (GameState.STATE === GameStates.PAUSED) {
    GameState.setState(GameStates.PLAYING);
    const sp = document.getElementById('ingame-speed-panel');
    if (sp) sp.style.display = 'none';
  }
}

export function quitToMainMenu() {
  GameState.setState(GameStates.TITLE);
  const sp = document.getElementById('ingame-speed-panel');
  if (sp) sp.style.display = 'none';
  AudioManager.updateMusicLayers(0);
}

export function openSettings() {
  SETTINGS_SLIDE = 0;
  GameState.setState(GameStates.SETTINGS);
}

export function openAchievements() {
  ACHIEV_SLIDE = 0;
  ACHIEV_SCROLL = 0;
  GameState.setState(GameStates.ACHIEVEMENTS);
}

export const PauseMenu = {
  draw(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,.72)';
    ctx.fillRect(0, 0, LW, LH);

    const panW = 320, panH = 240;
    const panX = LW / 2 - panW / 2, panY = LH / 2 - panH / 2;

    ctx.fillStyle = 'rgba(5,8,22,0.97)';
    ctx.strokeStyle = 'rgba(201,168,76,0.65)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, panX, panY, panW, panH, 12); ctx.fill(); ctx.stroke();

    ctx.save();
    ctx.shadowColor = '#c9a84c'; ctx.shadowBlur = 18;
    ctx.fillStyle = '#fde68a'; ctx.font = 'bold 22px Cinzel,serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('⏸ PAUSED', LW / 2, panY + 18);
    ctx.restore();

    ctx.fillStyle = 'rgba(71,85,105,.4)';
    ctx.fillRect(panX + 20, panY + 50, panW - 40, 1);

    _pauseBtns.length = 0;
    const btnDefs = [
      { label: '▶  RESUME GAME', col: '#22c55e', bg: 'rgba(34,197,94,0.18)', border: 'rgba(34,197,94,0.55)', action: resumeGame },
      { label: '⚙  SETTINGS',    col: '#fde68a', bg: 'rgba(201,168,76,0.12)', border: 'rgba(201,168,76,0.45)', action: openSettings },
      { label: '✕  QUIT TO MENU',col: '#f87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.45)',  action: quitToMainMenu },
    ];

    btnDefs.forEach((def, i) => {
      const bx = panX + 24, by = panY + 64 + i * 54;
      const bw = panW - 48, bh = 42;

      ctx.fillStyle = def.bg;
      ctx.strokeStyle = def.border;
      ctx.lineWidth = 1.5;
      roundRect(ctx, bx, by, bw, bh, 8); ctx.fill(); ctx.stroke();

      ctx.fillStyle = def.col;
      ctx.font = 'bold 13px Cinzel,serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(def.label, bx + bw / 2, by + bh / 2);

      _pauseBtns.push({ x: bx, y: by, w: bw, h: bh, action: def.action });
    });

    ctx.fillStyle = 'rgba(71,85,105,.4)'; ctx.font = '10px Cinzel,serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('Esc to resume · click button to select', LW / 2, panY + panH - 10);
  },

  handleClick(mx, my) {
    for (const btn of _pauseBtns) {
      if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
        btn.action();
        return true;
      }
    }
    return false;
  }
};

export const SettingsUI = {
  _editBtn: null,
  _resetBtn: null,

  draw(ctx, dt = 0.016) {
    SETTINGS_SLIDE = Math.min(1, SETTINGS_SLIDE + dt * 4);
    const panW = 440, panH = 440;
    const panX = LW / 2 - panW / 2;
    const panY = LH / 2 - panH / 2 - (1 - SETTINGS_SLIDE) * 60;

    ctx.save();
    ctx.globalAlpha = SETTINGS_SLIDE;
    ctx.fillStyle = 'rgba(5,8,22,0.96)'; ctx.strokeStyle = 'rgba(201,168,76,.55)'; ctx.lineWidth = 1.5;
    roundRect(ctx, panX, panY, panW, panH, 12); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#c9a84c'; ctx.font = 'bold 16px Cinzel,serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('⚙ SETTINGS', LW / 2, panY + 18);
    ctx.fillStyle = 'rgba(71,85,105,.5)'; ctx.fillRect(panX + 20, panY + 42, panW - 40, 1);

    // Speed row
    const sry = panY + 58;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; roundRect(ctx, panX + 16, sry, panW - 32, 50, 6); ctx.fill();
    ctx.fillStyle = '#fde68a'; ctx.font = 'bold 12px Cinzel,serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('⚡ Game Speed', panX + 28, sry + 16);
    ctx.fillStyle = '#64748b'; ctx.font = '10px Cinzel,serif'; ctx.textAlign = 'center';
    ctx.fillText('O  →  Decrease  /  P  →  Increase', panX + panW / 2, sry + 16);

    const barX = panX + 28, barY = sry + 30, barW = panW - 80, barH = 10;
    const speed = GameState.GAME_SPEED || 1.0;
    const speedFrac = (speed - 0.5) / (2.0 - 0.5);
    ctx.fillStyle = '#1e293b'; roundRect(ctx, barX, barY, barW, barH, 4); ctx.fill();
    const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    barGrad.addColorStop(0, '#3b82f6'); barGrad.addColorStop(0.5, '#22c55e'); barGrad.addColorStop(1, '#f97316');
    ctx.fillStyle = barGrad; roundRect(ctx, barX, barY, barW * speedFrac, barH, 4); ctx.fill();

    ctx.fillStyle = '#fde68a'; ctx.font = 'bold 11px Cinzel,serif'; ctx.textAlign = 'right';
    ctx.fillText(speed.toFixed(2) + 'x', panX + panW - 28, sry + 35);

    // Other rows
    const rows = [
      ['Audio', 'Auto', 'Web Audio Synth'],
      ['Display', 'Canvas 2.5D', 'Hardware Accelerated'],
      ['Performance', '60fps', 'Delta-time Engine']
    ];
    rows.forEach((row, i) => {
      const ry = panY + 118 + i * 50;
      ctx.fillStyle = 'rgba(0,0,0,.3)'; roundRect(ctx, panX + 16, ry, panW - 32, 40, 6); ctx.fill();
      ctx.fillStyle = '#cbd5e1'; ctx.font = '12px Cinzel,serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(row[0], panX + 28, ry + 20);
      ctx.fillStyle = '#64748b'; ctx.font = '10px Cinzel,serif'; ctx.textAlign = 'center';
      ctx.fillText('[' + row[1] + ']', panX + panW / 2, ry + 20);
      ctx.fillStyle = '#c9a84c'; ctx.textAlign = 'right';
      ctx.fillText(row[2], panX + panW - 28, ry + 20);
    });

    // Mobile controls row
    const mry = panY + 280;
    ctx.fillStyle = 'rgba(201,168,76,0.08)'; roundRect(ctx, panX + 16, mry, panW - 32, 56, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(201,168,76,0.25)'; ctx.lineWidth = 1; roundRect(ctx, panX + 16, mry, panW - 32, 56, 6); ctx.stroke();
    ctx.fillStyle = '#fde68a'; ctx.font = 'bold 11px Cinzel,serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('📱 Mobile Controls', panX + 28, mry + 14);

    const editBtnX = panX + 24, editBtnY = mry + 28, editBtnW = 170, editBtnH = 22;
    const isEditing = MobileControls.isEditMode();
    ctx.fillStyle = isEditing ? 'rgba(34,197,94,0.25)' : 'rgba(201,168,76,0.18)';
    ctx.strokeStyle = isEditing ? 'rgba(34,197,94,0.7)' : 'rgba(201,168,76,0.6)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, editBtnX, editBtnY, editBtnW, editBtnH, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = isEditing ? '#22c55e' : '#fde68a';
    ctx.font = 'bold 9px Cinzel,serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(isEditing ? '✓ DONE EDITING' : '✏ EDIT CONTROLS', editBtnX + editBtnW / 2, editBtnY + editBtnH / 2);

    const resetBtnX = panX + 208, resetBtnY = mry + 28, resetBtnW = 140, resetBtnH = 22;
    ctx.fillStyle = 'rgba(239,68,68,0.15)'; ctx.strokeStyle = 'rgba(239,68,68,0.5)'; ctx.lineWidth = 1.5;
    roundRect(ctx, resetBtnX, resetBtnY, resetBtnW, resetBtnH, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fca5a5'; ctx.font = 'bold 9px Cinzel,serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('↺ RESET LAYOUT', resetBtnX + resetBtnW / 2, resetBtnY + resetBtnH / 2);

    this._editBtn = { x: editBtnX, y: editBtnY, w: editBtnW, h: editBtnH };
    this._resetBtn = { x: resetBtnX, y: resetBtnY, w: resetBtnW, h: resetBtnH };

    ctx.fillStyle = 'rgba(71,85,105,.4)'; ctx.font = '11px Cinzel,serif'; ctx.textAlign = 'center';
    ctx.fillText('Click or press Esc to close', LW / 2, panY + panH - 16);
    ctx.restore();
  },

  handleClick(mx, my) {
    if (this._editBtn && mx >= this._editBtn.x && mx <= this._editBtn.x + this._editBtn.w && my >= this._editBtn.y && my <= this._editBtn.y + this._editBtn.h) {
      if (MobileControls.isEditMode()) MobileControls.exitCtrlEditMode();
      else MobileControls.enterCtrlEditMode();
      return true;
    }
    if (this._resetBtn && mx >= this._resetBtn.x && mx <= this._resetBtn.x + this._resetBtn.w && my >= this._resetBtn.y && my <= this._resetBtn.y + this._resetBtn.h) {
      MobileControls.resetCtrlLayout();
      return true;
    }
    GameState.setState(GameStates.TITLE);
    return true;
  }
};

export const AchievementsUI = {
  draw(ctx, dt = 0.016) {
    ACHIEV_SLIDE = Math.min(1, ACHIEV_SLIDE + dt * 4);
    const panW = 560, panH = 540;
    const panX = LW / 2 - panW / 2;
    const panY = LH / 2 - panH / 2 - (1 - ACHIEV_SLIDE) * 60;
    const headerH = 50, footerH = 28, scrollAreaH = panH - headerH - footerH;
    const keys = Object.keys(ACHIEVEMENTS);
    const cardW = (panW - 48) / 2, cardH = 62, cardGap = 6;
    const rowH = cardH + cardGap;
    const totalRows = Math.ceil(keys.length / 2);
    const totalContentH = totalRows * rowH;
    const maxScroll = Math.max(0, totalContentH - scrollAreaH);
    ACHIEV_SCROLL = Math.max(0, Math.min(ACHIEV_SCROLL, maxScroll));

    ctx.save();
    ctx.globalAlpha = ACHIEV_SLIDE;

    ctx.fillStyle = 'rgba(5,8,22,0.97)'; ctx.strokeStyle = 'rgba(201,168,76,.6)'; ctx.lineWidth = 1.5;
    roundRect(ctx, panX, panY, panW, panH, 12); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#c9a84c'; ctx.font = 'bold 16px Cinzel,serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('🏆 ACHIEVEMENTS', LW / 2, panY + 16);
    const unlockedN = keys.filter(k => ACHIEVEMENTS[k].unlocked).length;
    ctx.fillStyle = 'rgba(148,163,184,.65)'; ctx.font = '10px Cinzel,serif';
    ctx.fillText(unlockedN + ' / ' + keys.length + ' unlocked', LW / 2, panY + 36);
    ctx.fillStyle = 'rgba(71,85,105,.5)'; ctx.fillRect(panX + 16, panY + headerH - 2, panW - 32, 1);

    const clipX = panX + 12, clipY = panY + headerH, clipW = panW - 24, clipH = scrollAreaH;
    ctx.save();
    ctx.beginPath(); ctx.rect(clipX, clipY, clipW, clipH); ctx.clip();

    keys.forEach((k, i) => {
      const a = ACHIEVEMENTS[k];
      const col = i % 2, row = Math.floor(i / 2);
      const cx2 = panX + 16 + col * (cardW + cardGap + 4);
      const cy2 = panY + headerH + row * rowH - ACHIEV_SCROLL;
      if (cy2 + cardH < clipY || cy2 > clipY + clipH) return;

      if (a.unlocked) {
        ctx.fillStyle = 'rgba(201,168,76,0.10)';
        ctx.strokeStyle = 'rgba(201,168,76,0.5)';
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.32)';
        ctx.strokeStyle = 'rgba(51,65,85,0.35)';
      }
      ctx.lineWidth = 1;
      roundRect(ctx, cx2, cy2, cardW, cardH, 6); ctx.fill(); ctx.stroke();

      ctx.font = '22px serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(a.icon || '🏆', cx2 + 8, cy2 + cardH / 2);

      ctx.fillStyle = a.unlocked ? '#fde68a' : '#64748b';
      ctx.font = 'bold 10px Cinzel,serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(a.name, cx2 + 36, cy2 + 10);

      ctx.fillStyle = a.unlocked ? '#94a3b8' : '#475569';
      ctx.font = '9px Cinzel,serif';
      let desc = a.desc;
      while (ctx.measureText(desc).width > cardW - 44 && desc.length > 4) desc = desc.slice(0, -4) + '…';
      ctx.fillText(desc, cx2 + 36, cy2 + 26);

      if (a.unlocked) {
        ctx.fillStyle = 'rgba(201,168,76,0.25)';
        roundRect(ctx, cx2 + 36, cy2 + 41, 54, 13, 3); ctx.fill();
        ctx.fillStyle = '#c9a84c'; ctx.font = 'bold 8px Cinzel,serif'; ctx.textBaseline = 'middle';
        ctx.fillText('✓ UNLOCKED', cx2 + 39, cy2 + 47);
      } else {
        ctx.fillStyle = 'rgba(51,65,85,0.5)';
        roundRect(ctx, cx2 + 36, cy2 + 41, 46, 13, 3); ctx.fill();
        ctx.fillStyle = '#475569'; ctx.font = 'bold 8px Cinzel,serif'; ctx.textBaseline = 'middle';
        ctx.fillText('🔒 LOCKED', cx2 + 39, cy2 + 47);
      }
    });

    ctx.restore();

    ctx.fillStyle = 'rgba(71,85,105,.4)'; ctx.fillRect(panX + 16, panY + panH - footerH - 4, panW - 32, 1);
    ctx.fillStyle = 'rgba(71,85,105,.55)'; ctx.font = '10px Cinzel,serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Click anywhere or press Esc to close', LW / 2, panY + panH - footerH / 2 + 2);
    ctx.restore();
  },

  handleClick(mx, my) {
    GameState.setState(GameStates.TITLE);
    return true;
  }
};
