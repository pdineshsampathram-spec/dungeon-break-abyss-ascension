// =====================================================================
//  DUNGEON BREAK — js/ui/SettingsUI.js
//  UI/UX Reconstruction: Arcane Artificer's Calibration Console
//  - Left: Acoustic Calibration Bank with Segmented Crystal VU-Meters
//  - Right: Stepped Chronometer Speed Dial & Tactile Brass Toggle Levers
//  100% In-Game Canvas 2D Renderers, Zero Emojis, Zero Placeholders
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
let _ambientTimer = 0;
let _draggingChannel = null;

// Layout zones populated each frame for 100% pixel-accurate hit testing
const _zones = [];

export function openSettings(fromState = null) {
  _settingsSlide = 0;
  _draggingChannel = null;
  _returnState = (fromState === GameStates.PAUSED || GameState.PREV_STATE === GameStates.PAUSED || GameState.STATE === GameStates.PAUSED)
    ? GameStates.PAUSED
    : GameStates.TITLE;
  GameState.setState(GameStates.SETTINGS);
  SoundManager.snd('panel_open');
}

export function closeSettings() {
  _draggingChannel = null;
  SoundManager.snd('panel_close');
  const target = (GameState.PREV_STATE === GameStates.PAUSED || _returnState === GameStates.PAUSED)
    ? GameStates.PAUSED
    : GameStates.TITLE;
  GameState.setState(target);
}

export const SettingsUI = {
  draw(ctx, dt = 0.016) {
    _settingsSlide = Math.min(1, _settingsSlide + dt * 6.0);
    _ambientTimer += dt;
    const eased = 1 - Math.pow(1 - _settingsSlide, 3);

    // Full screen darkened vignette
    ctx.save();
    ctx.globalAlpha = eased;
    ctx.fillStyle = 'rgba(2, 4, 10, 0.90)';
    ctx.fillRect(0, 0, LW, LH);

    const panW = 890;
    const panH = 520;
    const panX = Math.round((LW - panW) / 2);
    const panY = Math.round((LH - panH) / 2 - (1 - eased) * 35);

    // Artificer's Brass & Bronze Radial Glow
    const pulse = 0.5 + 0.5 * Math.sin(_ambientTimer * 2.0);
    const grad = ctx.createRadialGradient(panX + panW / 2, panY + 160, 20, panX + panW / 2, panY + 240, 460);
    grad.addColorStop(0, `rgba(217, 119, 6, ${0.18 + pulse * 0.04})`);
    grad.addColorStop(0.6, 'rgba(180, 83, 9, 0.06)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(panX - 40, panY - 40, panW + 80, panH + 80);

    // Outer Heavy Chassis
    ctx.fillStyle = 'rgba(8, 12, 22, 0.98)';
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.65)';
    ctx.lineWidth = 1.6;
    roundRect(ctx, panX, panY, panW, panH, 12);
    ctx.fill(); ctx.stroke();

    // Inner gold-embossed trim
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.35)';
    ctx.lineWidth = 1;
    roundRect(ctx, panX + 5, panY + 5, panW - 10, panH - 10, 9);
    ctx.stroke();

    _zones.length = 0;
    const mouseX = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.mx : -999;
    const mouseY = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.my : -999;
    const isMouseDown = InputManager.MOUSE_STATE ? !!InputManager.MOUSE_STATE.isDown : false;

    const settings = SaveSystem.getSettings();

    // ─────────────────────────────────────────────────────────────
    // TOP HEADER: TITLE & MASTER ACOUSTIC POWER LEVER
    // ─────────────────────────────────────────────────────────────
    const topY = panY + 15;

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 14px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#d97706';
    ctx.shadowBlur = 8;
    ctx.fillText('◈ ARCANE ARTIFICER\'S CALIBRATION CONSOLE ◈', panX + 22, topY + 13);
    ctx.shadowBlur = 0;

    // Master Power Toggle (Top Right)
    const isMuted = !!settings.muted;
    const leverW = 190, leverH = 26;
    const leverX = panX + panW - 22 - leverW;
    const isHoverMaster = mouseX >= leverX && mouseX <= leverX + leverW && mouseY >= topY && mouseY <= topY + leverH;

    ctx.fillStyle = isMuted
      ? 'rgba(239, 68, 68, 0.25)'
      : (isHoverMaster ? 'rgba(34, 197, 94, 0.25)' : 'rgba(15, 23, 42, 0.7)');
    ctx.strokeStyle = isMuted
      ? '#ef4444'
      : (isHoverMaster ? '#4ade80' : 'rgba(201, 168, 76, 0.55)');
    ctx.lineWidth = 1.3;
    roundRect(ctx, leverX, topY, leverW, leverH, 5);
    ctx.fill(); ctx.stroke();

    // Glowing indicator pip
    ctx.beginPath();
    ctx.arc(leverX + 16, topY + leverH / 2, 5, 0, Math.PI * 2);
    ctx.fillStyle = isMuted ? '#ef4444' : '#22c55e';
    ctx.fill();

    ctx.fillStyle = isMuted ? '#fca5a5' : '#ffffff';
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText(isMuted ? 'ACOUSTIC POWER: OFFLINE' : 'ACOUSTIC POWER: ONLINE', leverX + leverW / 2 + 8, topY + leverH / 2);

    _zones.push({
      id: 'toggle_master_mute',
      x: leverX, y: topY, w: leverW, h: leverH,
      action: () => {
        settings.muted = !settings.muted;
        SaveSystem.saveSettings(settings);
        SoundManager.snd('menu_select');
      }
    });

    // ─────────────────────────────────────────────────────────────
    // INSTRUMENT BAYS SPLIT
    // Left: Acoustic Calibration Bank (400px)
    // Right: Chronometric Regulator & Sensory Levers (420px)
    // ─────────────────────────────────────────────────────────────
    const bayY = topY + 36;
    const bayH = panY + panH - bayY - 46;
    const leftBayW = 405;
    const rightBayW = panW - 40 - leftBayW - 14;
    const leftBayX = panX + 20;
    const rightBayX = leftBayX + leftBayW + 14;

    // ── LEFT INSTRUMENT: ACOUSTIC CALIBRATION BANK ──
    ctx.fillStyle = 'rgba(12, 16, 30, 0.94)';
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.5)';
    ctx.lineWidth = 1.3;
    roundRect(ctx, leftBayX, bayY, leftBayW, bayH, 8);
    ctx.fill(); ctx.stroke();

    // Acoustic Bank Title
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('ᛟ ACOUSTIC HARMONICS & FREQUENCY BANK', leftBayX + 16, bayY + 14);

    ctx.strokeStyle = 'rgba(201, 168, 76, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftBayX + 16, bayY + 30);
    ctx.lineTo(leftBayX + leftBayW - 16, bayY + 30);
    ctx.stroke();

    // 3 Segmented Crystal VU-Meter Channels
    const channels = [
      { id: 'masterVolume', label: 'MASTER ACOUSTIC GAIN', val: settings.masterVolume, icon: '◈' },
      { id: 'musicVolume',  label: 'SANCTUM CHORALE (MUSIC)', val: settings.musicVolume,  icon: '♪' },
      { id: 'sfxVolume',    label: 'CRUCIBLE RESONANCE (SFX)', val: settings.sfxVolume,   icon: '⚡' }
    ];

    const channelY = bayY + 42;
    const channelH = 92;

    channels.forEach((ch, idx) => {
      const cy = channelY + idx * (channelH + 8);

      // Channel Card Chassis
      ctx.fillStyle = 'rgba(15, 22, 40, 0.7)';
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
      ctx.lineWidth = 1;
      roundRect(ctx, leftBayX + 12, cy, leftBayW - 24, channelH, 6);
      ctx.fill(); ctx.stroke();

      // Channel Name & Decibel Readout
      ctx.fillStyle = isMuted ? '#64748b' : '#f1f5f9';
      ctx.font = 'bold 9.5px Cinzel, serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`${ch.icon} ${ch.label}`, leftBayX + 22, cy + 12);

      const pct = isMuted ? 0 : Math.round(ch.val * 100);
      const dbText = isMuted ? 'MUTED' : (pct === 100 ? '0.0 dB (100%)' : `−${((100 - pct) * 0.3).toFixed(1)} dB (${pct}%)`);
      ctx.fillStyle = isMuted ? '#ef4444' : '#fde68a';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(dbText, leftBayX + leftBayW - 24, cy + 12);

      // 10 Discrete Glowing Crystal VU-Segments
      const segCount = 10;
      const segGap = 5;
      const totalSegW = leftBayW - 48;
      const segW = Math.floor((totalSegW - (segCount - 1) * segGap) / segCount);
      const segH = 24;
      const segX = leftBayX + 22;
      const segY = cy + 34;

      const activeSegments = isMuted ? 0 : Math.round(ch.val * segCount);

      for (let s = 0; s < segCount; s++) {
        const sx = segX + s * (segW + segGap);
        const isActive = s < activeSegments;
        const isHoverSeg = mouseX >= sx && mouseX <= sx + segW && mouseY >= segY && mouseY <= segY + segH;

        // Crystal segment colors (Green -> Amber -> Red/Cyan at high intensity)
        let segCol = '#22c55e';
        let segGlow = 'rgba(34, 197, 94, 0.5)';
        if (s >= 8) {
          segCol = '#ef4444';
          segGlow = 'rgba(239, 68, 68, 0.5)';
        } else if (s >= 6) {
          segCol = '#f59e0b';
          segGlow = 'rgba(245, 158, 11, 0.5)';
        }

        ctx.save();
        if (isActive) {
          ctx.shadowColor = segGlow;
          ctx.shadowBlur = 8;
          ctx.fillStyle = segCol;
          roundRect(ctx, sx, segY, segW, segH, 3);
          ctx.fill();

          // Glass facet highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillRect(sx + 2, segY + 2, segW - 4, 3);
        } else {
          ctx.fillStyle = isHoverSeg ? 'rgba(51, 65, 85, 0.8)' : 'rgba(15, 23, 42, 0.8)';
          ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)';
          ctx.lineWidth = 1;
          roundRect(ctx, sx, segY, segW, segH, 3);
          ctx.fill(); ctx.stroke();
        }
        ctx.restore();

        // Zone for discrete click & drag
        _zones.push({
          id: `vu_${ch.id}_${s}`,
          x: sx, y: segY - 4, w: segW + segGap, h: segH + 8,
          action: () => {
            const newVal = Math.round(((s + 1) / segCount) * 100) / 100;
            settings[ch.id] = newVal;
            SaveSystem.saveSettings(settings);
            SoundManager.snd('menu_press');
          }
        });
      }

      // Discrete step markers below VU meter
      ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.font = '7.5px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('MIN', segX, segY + segH + 8);
      ctx.textAlign = 'center';
      ctx.fillText('50%', segX + totalSegW / 2, segY + segH + 8);
      ctx.textAlign = 'right';
      ctx.fillText('MAX (100%)', segX + totalSegW, segY + segH + 8);
    });

    // Handle live dragging on VU channels
    if (isMouseDown && mouseX >= leftBayX + 22 && mouseX <= leftBayX + leftBayW - 22) {
      channels.forEach((ch, idx) => {
        const cy = channelY + idx * (channelH + 8);
        const segY = cy + 34;
        if (mouseY >= segY - 4 && mouseY <= segY + 32) {
          const frac = Math.max(0, Math.min(1, (mouseX - (leftBayX + 22)) / (leftBayW - 48)));
          settings[ch.id] = Math.round(frac * 10) / 10;
          SaveSystem.saveSettings(settings);
        }
      });
    }

    // ── RIGHT INSTRUMENT: CHRONOMETER & SENSORY CALIBRATION ──
    ctx.fillStyle = 'rgba(12, 16, 30, 0.94)';
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.5)';
    ctx.lineWidth = 1.3;
    roundRect(ctx, rightBayX, bayY, rightBayW, bayH, 8);
    ctx.fill(); ctx.stroke();

    // 1. Chronometric Dial Section (Top Half of Right Bay)
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('⚡ CHRONOMETRIC TEMPORAL REGULATOR', rightBayX + 16, bayY + 14);

    ctx.strokeStyle = 'rgba(201, 168, 76, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rightBayX + 16, bayY + 30);
    ctx.lineTo(rightBayX + rightBayW - 16, bayY + 30);
    ctx.stroke();

    const curSpeed = settings.gameSpeed || 1.0;

    // Stepped Chronometer Speed Meter Box
    const dialBoxY = bayY + 40;
    const dialBoxH = 96;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    roundRect(ctx, rightBayX + 12, dialBoxY, rightBayW - 24, dialBoxH, 6);
    ctx.fill(); ctx.stroke();

    // Chronometer needle / speed arc gauge
    const dialCenterX = rightBayX + rightBayW / 2;
    const dialCenterY = dialBoxY + 38;

    // Stepped speed buttons (4 Notches)
    const notches = [
      { val: 0.5,  label: '0.50× (SLIGHT)' },
      { val: 1.0,  label: '1.00× (STANDARD)' },
      { val: 1.5,  label: '1.50× (SURGE)' },
      { val: 2.0,  label: '2.00× (OVERCLOCK)' }
    ];

    ctx.fillStyle = curSpeed === 1.0 ? '#fde68a' : (curSpeed > 1.0 ? '#fb923c' : '#38bdf8');
    ctx.font = 'bold 18px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${curSpeed.toFixed(2)}× VELOCITY`, dialCenterX, dialCenterY - 6);

    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = 'italic 9.5px Crimson Text, serif';
    ctx.fillText('Hotkeys in gameplay: [ O ] Slower  •  [ P ] Faster', dialCenterX, dialCenterY + 14);

    // 4 Stepped Notch Plinths below Dial
    const notchY = dialBoxY + dialBoxH - 34;
    const notchGap = 6;
    const notchW = Math.floor((rightBayW - 48 - (notches.length - 1) * notchGap) / notches.length);

    notches.forEach((n, idx) => {
      const nx = rightBayX + 22 + idx * (notchW + notchGap);
      const isSel = Math.abs(curSpeed - n.val) < 0.05;
      const isHover = mouseX >= nx && mouseX <= nx + notchW && mouseY >= notchY && mouseY <= notchY + 24;

      ctx.fillStyle = isSel
        ? 'rgba(217, 119, 6, 0.35)'
        : (isHover ? 'rgba(30, 41, 59, 0.8)' : 'rgba(15, 23, 42, 0.6)');
      ctx.strokeStyle = isSel
        ? '#fde68a'
        : (isHover ? '#cbd5e1' : 'rgba(71, 85, 105, 0.4)');
      ctx.lineWidth = isSel ? 1.5 : 1;
      roundRect(ctx, nx, notchY, notchW, 24, 4);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = isSel ? '#ffffff' : (isHover ? '#f1f5f9' : '#94a3b8');
      ctx.font = 'bold 8.5px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${n.val.toFixed(2)}×`, nx + notchW / 2, notchY + 12);

      _zones.push({
        id: `speed_${n.val}`,
        x: nx, y: notchY, w: notchW, h: 24,
        action: () => {
          settings.gameSpeed = n.val;
          SaveSystem.saveSettings(settings);
          SoundManager.snd('menu_select');
        }
      });
    });

    // 2. Tactile Brass Toggle Levers & Mobile Controls (Bottom Half of Right Bay)
    const leverBayY = dialBoxY + dialBoxH + 12;

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('✦ SENSORY & TACTILE LEVERS', rightBayX + 16, leverBayY);

    ctx.strokeStyle = 'rgba(201, 168, 76, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rightBayX + 16, leverBayY + 16);
    ctx.lineTo(rightBayX + rightBayW - 16, leverBayY + 16);
    ctx.stroke();

    // Toggle Levers (2 Levers)
    const toggles = [
      {
        id: 'screenShake',
        label: 'SCREEN TRAUMA VIBRATION',
        desc: 'Combat impact shake on critical hits and detonations',
        isOn: settings.screenShake !== false
      },
      {
        id: 'reducedMotion',
        label: 'ASTRAL FLUIDITY DAMPING',
        desc: 'Reduce camera sweeps, background motes & drift',
        isOn: !!settings.reducedMotion
      }
    ];

    const tRowY = leverBayY + 24;
    const tRowH = 46;

    toggles.forEach((tog, tIdx) => {
      const ty = tRowY + tIdx * (tRowH + 6);
      const isHoverTog = mouseX >= rightBayX + 12 && mouseX <= rightBayX + rightBayW - 12 && mouseY >= ty && mouseY <= ty + tRowH;

      ctx.fillStyle = tog.isOn ? 'rgba(34, 197, 94, 0.14)' : 'rgba(15, 23, 42, 0.65)';
      ctx.strokeStyle = tog.isOn ? 'rgba(34, 197, 94, 0.55)' : (isHoverTog ? 'rgba(148, 163, 184, 0.5)' : 'rgba(51, 65, 85, 0.4)');
      ctx.lineWidth = 1.2;
      roundRect(ctx, rightBayX + 12, ty, rightBayW - 24, tRowH, 6);
      ctx.fill(); ctx.stroke();

      // Label & Description
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = tog.isOn ? '#ffffff' : '#94a3b8';
      ctx.font = 'bold 9.5px Cinzel, serif';
      ctx.fillText(tog.label, rightBayX + 22, ty + 10);

      ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
      ctx.font = 'italic 8.5px Crimson Text, serif';
      ctx.fillText(tog.desc, rightBayX + 22, ty + 26);

      // Tactile Brass Lever Switch (Right side of card)
      const swW = 54, swH = 24;
      const swX = rightBayX + rightBayW - 22 - swW;
      const swY = ty + (tRowH - swH) / 2;

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.5)';
      ctx.lineWidth = 1;
      roundRect(ctx, swX, swY, swW, swH, 12);
      ctx.fill(); ctx.stroke();

      // Lever Knob (Left for OFF, Right for ON)
      const knobX = tog.isOn ? (swX + swW - 14) : (swX + 14);
      const knobY = swY + swH / 2;
      ctx.beginPath();
      ctx.arc(knobX, knobY, 8, 0, Math.PI * 2);
      ctx.fillStyle = tog.isOn ? '#22c55e' : '#64748b';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      _zones.push({
        id: `toggle_${tog.id}`,
        x: rightBayX + 12, y: ty, w: rightBayW - 24, h: tRowH,
        action: () => {
          if (tog.id === 'screenShake') {
            settings.screenShake = !settings.screenShake;
          } else {
            settings.reducedMotion = !settings.reducedMotion;
          }
          SaveSystem.saveSettings(settings);
          SoundManager.snd('menu_select');
        }
      });
    });

    // Mobile / Touch Controls Calibration Plinth
    const mobY = tRowY + 2 * (tRowH + 6) + 4;
    const isEditing = MobileControls.isEditMode();
    const mobBtnW = Math.floor((rightBayW - 32) / 2);
    const mobBtnH = 26;

    // Reposition button
    const m1X = rightBayX + 12;
    const isHoverM1 = mouseX >= m1X && mouseX <= m1X + mobBtnW && mouseY >= mobY && mouseY <= mobY + mobBtnH;
    ctx.fillStyle = isEditing ? 'rgba(34, 197, 94, 0.25)' : (isHoverM1 ? 'rgba(201, 168, 76, 0.25)' : 'rgba(15, 23, 42, 0.7)');
    ctx.strokeStyle = isEditing ? '#22c55e' : 'rgba(201, 168, 76, 0.45)';
    ctx.lineWidth = 1;
    roundRect(ctx, m1X, mobY, mobBtnW, mobBtnH, 4);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = isEditing ? '#4ade80' : '#fde68a';
    ctx.font = 'bold 8.5px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isEditing ? '✔ DONE EDITING' : '◈ TOUCH CONTROLS', m1X + mobBtnW / 2, mobY + mobBtnH / 2);

    _zones.push({
      id: 'mobile_edit',
      x: m1X, y: mobY, w: mobBtnW, h: mobBtnH,
      action: () => {
        if (MobileControls.isEditMode()) {
          MobileControls.exitCtrlEditMode();
        } else {
          MobileControls.enterCtrlEditMode();
        }
        SoundManager.snd('menu_select');
      }
    });

    // Reset controls button
    const m2X = m1X + mobBtnW + 8;
    const isHoverM2 = mouseX >= m2X && mouseX <= m2X + mobBtnW && mouseY >= mobY && mouseY <= mobY + mobBtnH;
    ctx.fillStyle = isHoverM2 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(15, 23, 42, 0.7)';
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
    roundRect(ctx, m2X, mobY, mobBtnW, mobBtnH, 4);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#fca5a5';
    ctx.fillText('◈ RESET LAYOUT', m2X + mobBtnW / 2, mobY + mobBtnH / 2);

    _zones.push({
      id: 'mobile_reset',
      x: m2X, y: mobY, w: mobBtnW, h: mobBtnH,
      action: () => {
        MobileControls.resetCtrlLayout();
        SoundManager.snd('menu_select');
      }
    });

    // ─────────────────────────────────────────────────────────────
    // BOTTOM BAR: KEYBOARD HINTS & RETURN BUTTON
    // ─────────────────────────────────────────────────────────────
    const botY = panY + panH - 36;
    const retW = 190, retH = 26;
    const retX = panX + panW - 20 - retW;
    const isHoverRet = mouseX >= retX && mouseX <= retX + retW && mouseY >= botY && mouseY <= botY + retH;

    ctx.fillStyle = isHoverRet ? 'rgba(51, 65, 85, 0.7)' : 'rgba(30, 41, 59, 0.5)';
    ctx.strokeStyle = isHoverRet ? '#ffffff' : 'rgba(148, 163, 184, 0.45)';
    ctx.lineWidth = 1;
    roundRect(ctx, retX, botY, retW, retH, 5);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('◈ CONSECRATE & RETURN ( Esc )', retX + retW / 2, botY + retH / 2);

    ctx.fillStyle = 'rgba(148, 163, 184, 0.65)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Click / Drag VU Segments    Hotkeys: [ M ] Mute  [ O/P ] Speed    Esc — Return', panX + 24, botY + 13);

    _zones.push({
      id: 'close_btn',
      x: retX, y: botY, w: retW, h: retH,
      action: closeSettings
    });

    ctx.restore();
  },

  handleClick(mx, my) {
    for (const z of _zones) {
      if (mx >= z.x && mx <= z.x + z.w && my >= z.y && my <= z.y + z.h) {
        if (z.action) {
          z.action();
          return true;
        }
      }
    }

    // Click outside modal box returns
    const panW = 890, panH = 520;
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
    if (key === 'm' || key === 'M') {
      const settings = SaveSystem.getSettings();
      settings.muted = !settings.muted;
      SaveSystem.saveSettings(settings);
      SoundManager.snd('menu_select');
      return true;
    }
    if (key === 'o' || key === 'O') {
      const settings = SaveSystem.getSettings();
      settings.gameSpeed = Math.max(0.5, Math.round(((settings.gameSpeed || 1.0) - 0.25) * 100) / 100);
      SaveSystem.saveSettings(settings);
      SoundManager.snd('menu_select');
      return true;
    }
    if (key === 'p' || key === 'P') {
      const settings = SaveSystem.getSettings();
      settings.gameSpeed = Math.min(2.0, Math.round(((settings.gameSpeed || 1.0) + 0.25) * 100) / 100);
      SaveSystem.saveSettings(settings);
      SoundManager.snd('menu_select');
      return true;
    }
    return false;
  }
};

SettingsUI._zones = _zones;

if (typeof window !== 'undefined') {
  window.SettingsUI = SettingsUI;
  window.SaveSystem = SaveSystem;
  window.openSettings = openSettings;
  window.closeSettings = closeSettings;
}
