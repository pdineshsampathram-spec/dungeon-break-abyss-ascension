// =====================================================================
//  DUNGEON BREAK — js/ui/SettingsUI.js
//  Authoritative Canvas 2D Settings & Audio Mixer Interface
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, roundRect } from '../core/Constants.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { SoundManager } from '../audio/AudioManager.js';
import { MusicManager } from '../audio/MusicManager.js';
import { InputManager } from '../core/InputManager.js';
import { MobileControls } from './MobileControls.js';

let _settingsSlide = 0;
let _returnState = GameStates.TITLE;
let _draggingSlider = null; // 'master' | 'music' | 'sfx'
let _hoveredId = null;

// Layout zones populated each frame for 100% pixel-accurate hit testing
const _zones = [];

export function openSettings(fromState = null) {
  _settingsSlide = 0;
  _draggingSlider = null;
  _returnState = (fromState === GameStates.PAUSED || GameState.PREV_STATE === GameStates.PAUSED || GameState.STATE === GameStates.PAUSED)
    ? GameStates.PAUSED
    : GameStates.TITLE;
  GameState.setState(GameStates.SETTINGS);
  SoundManager.snd('panel_open');
}

export function closeSettings() {
  _draggingSlider = null;
  SoundManager.snd('panel_close');
  const target = (GameState.PREV_STATE === GameStates.PAUSED || _returnState === GameStates.PAUSED)
    ? GameStates.PAUSED
    : GameStates.TITLE;
  GameState.setState(target);
}

export const SettingsUI = {
  draw(ctx, dt = 0.016) {
    _settingsSlide = Math.min(1, _settingsSlide + dt * 5.0);
    const eased = 1 - Math.pow(1 - _settingsSlide, 3);

    // Full screen darkened vignette
    ctx.save();
    ctx.fillStyle = `rgba(2, 4, 10, ${0.78 * eased})`;
    ctx.fillRect(0, 0, LW, LH);

    const panW = 540;
    const panH = 500;
    const panX = (LW - panW) / 2;
    const panY = (LH - panH) / 2 - (1 - eased) * 40;

    // Outer atmospheric glow
    ctx.shadowColor = 'rgba(201, 168, 76, 0.28)';
    ctx.shadowBlur = 24;
    ctx.fillStyle = 'rgba(5, 8, 20, 0.97)';
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.65)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, panX, panY, panW, panH, 12);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Inner subtle border
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)';
    ctx.lineWidth = 1;
    roundRect(ctx, panX + 6, panY + 6, panW - 12, panH - 12, 8);
    ctx.stroke();

    // Title Header
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 18px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = '#d97706';
    ctx.shadowBlur = 10;
    ctx.fillText('◈ SETTINGS & CALIBRATION ◈', LW / 2, panY + 16);
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = '10px Cinzel, serif';
    ctx.fillText('CALIBRATE SOUND, DISPLAY & CONTROLS', LW / 2, panY + 38);

    // Decorative divider
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(panX + 24, panY + 54);
    ctx.lineTo(panX + panW - 24, panY + 54);
    ctx.stroke();

    _zones.length = 0;
    const mouseX = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.mx : -999;
    const mouseY = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.my : -999;
    const isMouseDown = InputManager.MOUSE_STATE ? !!InputManager.MOUSE_STATE.isDown : false;

    const settings = SaveSystem.getSettings();

    // ─────────────────────────────────────────────────────────────
    // SECTION 1: AUDIO MIXER
    // ─────────────────────────────────────────────────────────────
    let secY = panY + 64;
    ctx.fillStyle = '#c9a84c';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('◈ SOUND & ACOUSTICS', panX + 26, secY);

    // Mute All Toggle Button (Right-aligned in section header)
    const muteW = 110, muteH = 22;
    const muteX = panX + panW - 26 - muteW;
    const muteY = secY - 11;
    const isMuted = !!settings.muted;
    const isHoverMute = mouseX >= muteX && mouseX <= muteX + muteW && mouseY >= muteY && mouseY <= muteY + muteH;

    ctx.fillStyle = isMuted ? 'rgba(239, 68, 68, 0.25)' : isHoverMute ? 'rgba(34, 197, 94, 0.25)' : 'rgba(15, 23, 42, 0.7)';
    ctx.strokeStyle = isMuted ? '#ef4444' : isHoverMute ? '#4ade80' : 'rgba(100, 116, 139, 0.5)';
    ctx.lineWidth = 1.2;
    roundRect(ctx, muteX, muteY, muteW, muteH, 4);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = isMuted ? '#fca5a5' : '#e2e8f0';
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText(isMuted ? '◈ MUTED (CLICK)' : '◈ ALL AUDIO ON', muteX + muteW / 2, muteY + muteH / 2);

    _zones.push({
      id: 'mute_toggle',
      x: muteX, y: muteY, w: muteW, h: muteH,
      action: () => {
        settings.muted = !settings.muted;
        SaveSystem.saveSettings(settings);
        SoundManager.snd('menu_select');
      }
    });

    // Helper: Render Volume Slider Row
    const renderSlider = (label, valueKey, curVal, rowY, min = 0, max = 1) => {
      const rowX = panX + 24;
      const rowW = panW - 48;
      const rowH = 34;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
      ctx.lineWidth = 1;
      roundRect(ctx, rowX, rowY, rowW, rowH, 6);
      ctx.fill(); ctx.stroke();

      // Label
      ctx.fillStyle = settings.muted ? '#64748b' : '#f1f5f9';
      ctx.font = 'bold 11px Cinzel, serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, rowX + 12, rowY + rowH / 2);

      // Slider Track
      const trackX = rowX + 170;
      const trackY = rowY + 13;
      const trackW = 240;
      const trackH = 8;

      ctx.fillStyle = '#0f172a';
      roundRect(ctx, trackX, trackY, trackW, trackH, 4);
      ctx.fill();

      const frac = Math.max(0, Math.min(1, (curVal - min) / (max - min)));
      if (frac > 0) {
        const fillGrad = ctx.createLinearGradient(trackX, 0, trackX + trackW, 0);
        if (settings.muted) {
          fillGrad.addColorStop(0, '#475569');
          fillGrad.addColorStop(1, '#64748b');
        } else {
          fillGrad.addColorStop(0, '#3b82f6');
          fillGrad.addColorStop(0.5, '#22c55e');
          fillGrad.addColorStop(1, '#eab308');
        }
        ctx.fillStyle = fillGrad;
        roundRect(ctx, trackX, trackY, trackW * frac, trackH, 4);
        ctx.fill();
      }

      // Slider Thumb Handle
      const thumbX = trackX + trackW * frac;
      const thumbY = trackY + trackH / 2;
      const thumbR = 7;

      ctx.save();
      ctx.shadowColor = settings.muted ? 'transparent' : '#fde68a';
      ctx.shadowBlur = 6;
      ctx.fillStyle = settings.muted ? '#64748b' : '#fde68a';
      ctx.beginPath();
      ctx.arc(thumbX, thumbY, thumbR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Value percentage text
      const pctText = settings.muted ? 'MUTED' : `${Math.round(curVal * 100)}%`;
      ctx.fillStyle = settings.muted ? '#64748b' : '#fde68a';
      ctx.font = 'bold 11px Cinzel, serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(pctText, rowX + rowW - 14, rowY + rowH / 2);

      // Register interactive zone (expanded vertically for easy touch & mouse grip)
      _zones.push({
        id: `slider_${valueKey}`,
        isSlider: true,
        sliderKey: valueKey,
        trackX, trackW, min, max,
        x: trackX - 10,
        y: rowY + 2,
        w: trackW + 20,
        h: rowH - 4,
        updateVal: (mx) => {
          const newFrac = Math.max(0, Math.min(1, (mx - trackX) / trackW));
          const rounded = Math.round((min + newFrac * (max - min)) * 100) / 100;
          settings[valueKey] = rounded;
          SaveSystem.saveSettings(settings);
        }
      });
    };

    renderSlider('Master Volume', 'masterVolume', settings.masterVolume, secY + 14);
    renderSlider('Music Volume', 'musicVolume', settings.musicVolume, secY + 54);
    renderSlider('Sound Effects (SFX)', 'sfxVolume', settings.sfxVolume, secY + 94);

    // Live dragging update
    if (isMouseDown && _draggingSlider) {
      const z = _zones.find(z => z.sliderKey === _draggingSlider);
      if (z && z.updateVal) {
        z.updateVal(mouseX);
      }
    } else if (!isMouseDown) {
      _draggingSlider = null;
    }

    // ─────────────────────────────────────────────────────────────
    // SECTION 2: DISPLAY & ACCESSIBILITY
    // ─────────────────────────────────────────────────────────────
    secY = panY + 208;
    ctx.fillStyle = '#c9a84c';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('◈ VISUALS & ACCESSIBILITY', panX + 26, secY);

    const toggleRowY = secY + 14;
    const toggleW = (panW - 56) / 2;
    const toggleH = 44;

    // Toggle 1: Screen Shake
    const t1X = panX + 24;
    const isShakeOn = settings.screenShake !== false;
    const isHoverT1 = mouseX >= t1X && mouseX <= t1X + toggleW && mouseY >= toggleRowY && mouseY <= toggleRowY + toggleH;

    ctx.fillStyle = isShakeOn ? 'rgba(34, 197, 94, 0.12)' : 'rgba(15, 23, 42, 0.6)';
    ctx.strokeStyle = isShakeOn ? 'rgba(34, 197, 94, 0.6)' : isHoverT1 ? 'rgba(148, 163, 184, 0.6)' : 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1.2;
    roundRect(ctx, t1X, toggleRowY, toggleW, toggleH, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.fillText('Screen Shake', t1X + 14, toggleRowY + 16);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9.5px Crimson Text, serif';
    ctx.fillText('Combat trauma & crit vibration', t1X + 14, toggleRowY + 30);

    ctx.fillStyle = isShakeOn ? '#22c55e' : '#64748b';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'right';
    ctx.fillText(isShakeOn ? 'ON' : 'OFF', t1X + toggleW - 14, toggleRowY + toggleH / 2);

    _zones.push({
      id: 'toggle_shake',
      x: t1X, y: toggleRowY, w: toggleW, h: toggleH,
      action: () => {
        settings.screenShake = !settings.screenShake;
        SaveSystem.saveSettings(settings);
        SoundManager.snd('menu_select');
      }
    });

    // Toggle 2: Reduced Motion
    const t2X = panX + 32 + toggleW;
    const isReducedMotion = !!settings.reducedMotion;
    const isHoverT2 = mouseX >= t2X && mouseX <= t2X + toggleW && mouseY >= toggleRowY && mouseY <= toggleRowY + toggleH;

    ctx.fillStyle = isReducedMotion ? 'rgba(168, 85, 247, 0.15)' : 'rgba(15, 23, 42, 0.6)';
    ctx.strokeStyle = isReducedMotion ? 'rgba(168, 85, 247, 0.6)' : isHoverT2 ? 'rgba(148, 163, 184, 0.6)' : 'rgba(51, 65, 85, 0.4)';
    roundRect(ctx, t2X, toggleRowY, toggleW, toggleH, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.fillText('Reduced Motion', t2X + 14, toggleRowY + 16);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9.5px Crimson Text, serif';
    ctx.fillText('Dampen camera sweeps & motes', t2X + 14, toggleRowY + 30);

    ctx.fillStyle = isReducedMotion ? '#c084fc' : '#64748b';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'right';
    ctx.fillText(isReducedMotion ? 'ON' : 'OFF', t2X + toggleW - 14, toggleRowY + toggleH / 2);

    _zones.push({
      id: 'toggle_reduced_motion',
      x: t2X, y: toggleRowY, w: toggleW, h: toggleH,
      action: () => {
        settings.reducedMotion = !settings.reducedMotion;
        SaveSystem.saveSettings(settings);
        SoundManager.snd('menu_select');
      }
    });

    // ─────────────────────────────────────────────────────────────
    // SECTION 3: GAME SPEED & SIMULATION
    // ─────────────────────────────────────────────────────────────
    secY = panY + 288;
    ctx.fillStyle = '#c9a84c';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('◈ SIMULATION & GAME SPEED', panX + 26, secY);

    const speedRowY = secY + 14;
    const speedRowX = panX + 24;
    const speedRowW = panW - 48;
    const speedRowH = 40;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    roundRect(ctx, speedRowX, speedRowY, speedRowW, speedRowH, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.fillText('Game Speed Scale', speedRowX + 14, speedRowY + 15);
    ctx.fillStyle = '#64748b';
    ctx.font = '9.5px Crimson Text, serif';
    ctx.fillText('In-game hotkeys: O / P to fine-tune', speedRowX + 14, speedRowY + 28);

    const curSpeed = settings.gameSpeed || 1.0;

    // Minus Button
    const minusBtnX = speedRowX + speedRowW - 144, minusBtnY = speedRowY + 8, btnDim = 24;
    const isHoverMinus = mouseX >= minusBtnX && mouseX <= minusBtnX + btnDim && mouseY >= minusBtnY && mouseY <= minusBtnY + btnDim;
    ctx.fillStyle = isHoverMinus ? 'rgba(201, 168, 76, 0.3)' : 'rgba(30, 41, 59, 0.8)';
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.5)';
    roundRect(ctx, minusBtnX, minusBtnY, btnDim, btnDim, 4);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 13px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText('−', minusBtnX + btnDim / 2, minusBtnY + btnDim / 2);

    _zones.push({
      id: 'speed_minus',
      x: minusBtnX, y: minusBtnY, w: btnDim, h: btnDim,
      action: () => {
        settings.gameSpeed = Math.max(0.5, Math.round((curSpeed - 0.25) * 100) / 100);
        SaveSystem.saveSettings(settings);
        SoundManager.snd('menu_select');
      }
    });

    // Speed display badge
    const speedText = `${curSpeed.toFixed(2)}x`;
    ctx.fillStyle = curSpeed === 1.0 ? '#fde68a' : curSpeed > 1.0 ? '#fb923c' : '#38bdf8';
    ctx.font = 'bold 12px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText(speedText, minusBtnX + 38, speedRowY + speedRowH / 2);

    // Plus Button
    const plusBtnX = minusBtnX + 54;
    const isHoverPlus = mouseX >= plusBtnX && mouseX <= plusBtnX + btnDim && mouseY >= minusBtnY && mouseY <= minusBtnY + btnDim;
    ctx.fillStyle = isHoverPlus ? 'rgba(201, 168, 76, 0.3)' : 'rgba(30, 41, 59, 0.8)';
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.5)';
    roundRect(ctx, plusBtnX, minusBtnY, btnDim, btnDim, 4);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fde68a';
    ctx.fillText('+', plusBtnX + btnDim / 2, minusBtnY + btnDim / 2);

    _zones.push({
      id: 'speed_plus',
      x: plusBtnX, y: minusBtnY, w: btnDim, h: btnDim,
      action: () => {
        settings.gameSpeed = Math.min(2.0, Math.round((curSpeed + 0.25) * 100) / 100);
        SaveSystem.saveSettings(settings);
        SoundManager.snd('menu_select');
      }
    });

    // Reset 1.0x Button
    const reset1xX = plusBtnX + 30;
    const reset1xW = 34;
    const isHover1x = mouseX >= reset1xX && mouseX <= reset1xX + reset1xW && mouseY >= minusBtnY && mouseY <= minusBtnY + btnDim;
    ctx.fillStyle = isHover1x ? 'rgba(201, 168, 76, 0.25)' : 'rgba(30, 41, 59, 0.6)';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    roundRect(ctx, reset1xX, minusBtnY, reset1xW, btnDim, 4);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '9px Cinzel, serif';
    ctx.fillText('1.0x', reset1xX + reset1xW / 2, minusBtnY + btnDim / 2);

    _zones.push({
      id: 'speed_reset',
      x: reset1xX, y: minusBtnY, w: reset1xW, h: btnDim,
      action: () => {
        settings.gameSpeed = 1.0;
        SaveSystem.saveSettings(settings);
        SoundManager.snd('menu_select');
      }
    });

    // ─────────────────────────────────────────────────────────────
    // SECTION 4: MOBILE ON-SCREEN CONTROLS
    // ─────────────────────────────────────────────────────────────
    secY = panY + 360;
    ctx.fillStyle = '#c9a84c';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('◈ TOUCH & ON-SCREEN CONTROLS', panX + 26, secY);

    const mRowY = secY + 14;
    const isEditing = MobileControls.isEditMode();
    const mBtnW = (panW - 56) / 2;
    const mBtnH = 34;

    // Edit Controls Button
    const editBtnX = panX + 24;
    const isHoverEdit = mouseX >= editBtnX && mouseX <= editBtnX + mBtnW && mouseY >= mRowY && mouseY <= mRowY + mBtnH;
    ctx.fillStyle = isEditing ? 'rgba(34, 197, 94, 0.25)' : isHoverEdit ? 'rgba(201, 168, 76, 0.25)' : 'rgba(15, 23, 42, 0.7)';
    ctx.strokeStyle = isEditing ? '#22c55e' : isHoverEdit ? '#fde68a' : 'rgba(201, 168, 76, 0.45)';
    ctx.lineWidth = 1.2;
    roundRect(ctx, editBtnX, mRowY, mBtnW, mBtnH, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = isEditing ? '#4ade80' : '#fde68a';
    ctx.font = 'bold 10.5px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText(isEditing ? '◈ DONE EDITING (SAVE)' : '◈ REPOSITION CONTROLS', editBtnX + mBtnW / 2, mRowY + mBtnH / 2);

    _zones.push({
      id: 'mobile_edit',
      x: editBtnX, y: mRowY, w: mBtnW, h: mBtnH,
      action: () => {
        if (MobileControls.isEditMode()) {
          MobileControls.exitCtrlEditMode();
          SoundManager.snd('menu_select');
        } else {
          MobileControls.enterCtrlEditMode();
          SoundManager.snd('menu_select');
        }
      }
    });

    // Reset Layout Button
    const resetBtnX = panX + 32 + mBtnW;
    const isHoverReset = mouseX >= resetBtnX && mouseX <= resetBtnX + mBtnW && mouseY >= mRowY && mouseY <= mRowY + mBtnH;
    ctx.fillStyle = isHoverReset ? 'rgba(239, 68, 68, 0.25)' : 'rgba(15, 23, 42, 0.7)';
    ctx.strokeStyle = isHoverReset ? '#f87171' : 'rgba(239, 68, 68, 0.45)';
    roundRect(ctx, resetBtnX, mRowY, mBtnW, mBtnH, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 10.5px Cinzel, serif';
    ctx.fillText('◈ RESTORE DEFAULT LAYOUT', resetBtnX + mBtnW / 2, mRowY + mBtnH / 2);

    _zones.push({
      id: 'mobile_reset',
      x: resetBtnX, y: mRowY, w: mBtnW, h: mBtnH,
      action: () => {
        MobileControls.resetCtrlLayout();
        SoundManager.snd('menu_select');
      }
    });

    // ─────────────────────────────────────────────────────────────
    // FOOTER: CLOSE / RETURN BUTTON
    // ─────────────────────────────────────────────────────────────
    const closeW = 200, closeH = 36;
    const closeX = (LW - closeW) / 2;
    const closeY = panY + panH - 46;
    const isHoverClose = mouseX >= closeX && mouseX <= closeX + closeW && mouseY >= closeY && mouseY <= closeY + closeH;

    ctx.save();
    ctx.shadowColor = isHoverClose ? 'rgba(201, 168, 76, 0.4)' : 'transparent';
    ctx.shadowBlur = 10;
    ctx.fillStyle = isHoverClose ? 'rgba(201, 168, 76, 0.22)' : 'rgba(30, 41, 59, 0.85)';
    ctx.strokeStyle = isHoverClose ? '#fde68a' : 'rgba(201, 168, 76, 0.55)';
    ctx.lineWidth = 1.4;
    roundRect(ctx, closeX, closeY, closeW, closeH, 6);
    ctx.fill(); ctx.stroke();
    ctx.restore();

    ctx.fillStyle = isHoverClose ? '#fef08a' : '#e2e8f0';
    ctx.font = 'bold 11.5px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('◈ RETURN  ( ESC )', closeX + closeW / 2, closeY + closeH / 2);

    _zones.push({
      id: 'close_btn',
      x: closeX, y: closeY, w: closeW, h: closeH,
      action: closeSettings
    });

    ctx.restore();
  },

  handleClick(mx, my) {
    // 1. Check all interactive registered zones
    for (const z of _zones) {
      if (mx >= z.x && mx <= z.x + z.w && my >= z.y && my <= z.y + z.h) {
        if (z.isSlider) {
          _draggingSlider = z.sliderKey;
          if (z.updateVal) z.updateVal(mx);
          SoundManager.snd('menu_press');
          return true;
        }
        if (z.action) {
          z.action();
          return true;
        }
      }
    }

    // 2. Click outside modal box returns to previous state
    const panW = 540, panH = 500;
    const panX = (LW - panW) / 2, panY = (LH - panH) / 2;
    if (mx < panX || mx > panX + panW || my < panY || my > panY + panH) {
      closeSettings();
      return true;
    }

    return false;
  },

  handleKeyDown(key) {
    if (key === 'Escape') {
      closeSettings();
      return true;
    }
    return false;
  }
};

SettingsUI._zones = _zones;

if (typeof window !== 'undefined') {
  window.SettingsUI = SettingsUI;
  window.SaveSystem = SaveSystem;
}
