// =====================================================================
//  DUNGEON BREAK — js/ui/SettingsUI.js
//  Authoritative Settings Chamber & Chronometric Regulator
//  - Deep indigo & violet carved stone with blackened steel & bronze chassis
//  - Balanced two-column composition with zero empty black voids
//  - Left: Audio Chamber with 3 responsive harmonic wave sliders
//  - Percentage-only readouts with no engineering / decibel clutter
//  - Right: Calibrated Chronometer with jitter-free needle easing
//  - Tactile brass toggles for Screen Shake & Reduced Motion with clear ON/OFF states
//  - Mobile touch control calibration & layout reset with custom stone buttons
//  - Dynamic Return navigation with preserved player state and immediate persistence
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, roundRect } from '../core/Constants.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { SoundManager } from '../audio/AudioManager.js';
import { MusicManager } from '../audio/MusicManager.js';
import { InputManager } from '../core/InputManager.js';
import { MobileControls } from './MobileControls.js';
import {
  ButtonArtManager,
  drawStoneButton,
  drawStonePanel,
  drawStoneCard,
  drawStoneSlider,
  drawStoneDivider,
  drawChamferedPanel,
  drawCornerBrackets,
  getStonePattern
} from './ButtonArtManager.js';

let _settingsSlide = 0;
let _returnState = GameStates.TITLE;
let _ambientTimer = 0;
let _activeDraggingChannel = null;
let _displayedSpeed = 1.0;

// Layout zones populated each frame for 100% pixel-accurate hit testing
const _zones = [];

export function getReturnState() {
  return _returnState;
}

export function openSettings(fromState = null) {
  _settingsSlide = 0;
  _activeDraggingChannel = null;
  _returnState = fromState ? fromState : (GameState.STATE === GameStates.PAUSED ? GameStates.PAUSED : GameStates.TITLE);
  const s = SaveSystem.getSettings();
  _displayedSpeed = typeof s.gameSpeed === 'number' ? s.gameSpeed : 1.0;
  GameState.setState(GameStates.SETTINGS);
  SoundManager.snd('panel_open');
}

export function closeSettings() {
  _activeDraggingChannel = null;
  SoundManager.snd('panel_close');
  const target = (_returnState === GameStates.PAUSED) ? GameStates.PAUSED : GameStates.TITLE;
  _returnState = GameStates.TITLE;
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
    ctx.fillStyle = 'rgba(2, 4, 10, 0.94)';
    ctx.fillRect(0, 0, LW, LH);

    const panW = Math.min(880, LW - 24);
    const panH = Math.min(540, LH - 24);
    const panX = Math.round((LW - panW) / 2);
    const panY = Math.round((LH - panH) / 2 - (1 - eased) * 25);

    // Warm amber furnace & cosmic violet backglow
    const pulse = 0.5 + 0.5 * Math.sin(_ambientTimer * 2.0);
    const grad = ctx.createRadialGradient(panX + panW / 2, panY + 180, 20, panX + panW / 2, panY + 240, 480);
    grad.addColorStop(0, `rgba(217, 119, 6, ${0.12 + pulse * 0.04})`);
    grad.addColorStop(0.5, 'rgba(126, 34, 206, 0.06)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(panX - 40, panY - 40, panW + 80, panH + 80);

    // ─────────────────────────────────────────────────────────────
    // 1. BESPOKE MASTER OUTER CHASSIS (OBSIDIAN & ANTIQUE BRASS)
    // ─────────────────────────────────────────────────────────────
    drawStonePanel(ctx, panX, panY, panW, panH, {
      chamfer: 14,
      outerBorderColor: 'rgba(217, 119, 6, 0.85)',
      hasCornerBrackets: true,
      bracketLen: 20
    });

    _zones.length = 0;
    const mouseX = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.mx : -999;
    const mouseY = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.my : -999;
    const isMouseDown = InputManager.MOUSE_STATE ? !!InputManager.MOUSE_STATE.isDown : false;
    const settings = SaveSystem.getSettings();
    const isReducedMotion = !!settings.reducedMotion;

    // ─────────────────────────────────────────────────────────────
    // 2. HEADER: TITLE & MASTER AUDIO POWER SWITCH
    // ─────────────────────────────────────────────────────────────
    const topY = panY + 14;

    // Inscribed Header
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 13.5px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#d97706';
    ctx.shadowBlur = isReducedMotion ? 0 : 7;
    ctx.fillText('◈ ARCANE ARTIFICER\'S CALIBRATION CONSOLE ◈', panX + 24, topY + 11);
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
    ctx.font = 'italic 9.5px "Crimson Text", serif';
    ctx.fillText('Acoustic Resonance, Chronometric Pace & Sensory Mechanics', panX + 26, topY + 26);

    // Master Power Toggle Button (Top Right)
    const isMuted = !!settings.muted;
    const leverW = 194, leverH = 26;
    const leverX = panX + panW - 22 - leverW;
    const isHoverMaster = mouseX >= leverX && mouseX <= leverX + leverW && mouseY >= topY && mouseY <= topY + leverH;

    drawStoneButton(ctx, isMuted ? '  MASTER AUDIO: MUTED' : '  MASTER AUDIO: ACTIVE', leverX, topY, leverW, leverH, {
      isHover: isHoverMaster,
      isSelected: !isMuted,
      variant: isMuted ? 'danger' : 'normal',
      fontSize: 9.0
    });

    // Glowing status jewel on Master Power button
    ctx.beginPath();
    ctx.arc(leverX + 15, topY + leverH / 2, 4.0, 0, Math.PI * 2);
    ctx.fillStyle = isMuted ? '#ef4444' : '#22c55e';
    if (!isReducedMotion) {
      ctx.shadowColor = isMuted ? '#ef4444' : '#22c55e';
      ctx.shadowBlur = 6;
    }
    ctx.fill();
    ctx.shadowBlur = 0;

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
    // 3. BALANCED TWO-COLUMN COMPOSITION
    // Left: Audio Chamber
    // Right: Chronometer & Sensory Controls
    // ─────────────────────────────────────────────────────────────
    const bayY = topY + 36;
    const botBarH = 34;
    const bayH = panY + panH - bayY - botBarH - 8;
    const leftBayW = Math.round((panW - 44) * 0.49);
    const rightBayW = panW - 36 - leftBayW;
    const leftBayX = panX + 16;
    const rightBayX = leftBayX + leftBayW + 10;

    // ═════════════════════════════════════════════════════════════
    // LEFT ZONE: AUDIO CHAMBER
    // ═════════════════════════════════════════════════════════════
    drawStonePanel(ctx, leftBayX, bayY, leftBayW, bayH, {
      chamfer: 8,
      outerBorderColor: 'rgba(217, 119, 6, 0.70)',
      hasCornerBrackets: true,
      bracketLen: 12
    });

    // Section Header
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('ᛟ ACOUSTIC RESONANCE CHAMBER', leftBayX + 16, bayY + 12);

    ctx.strokeStyle = 'rgba(201, 168, 76, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftBayX + 16, bayY + 27);
    ctx.lineTo(leftBayX + leftBayW - 16, bayY + 27);
    ctx.stroke();

    // 3 Audio Controls (Master, Music, SFX)
    const channels = [
      {
        id: 'masterVolume',
        label: 'MASTER VOLUME',
        sub: 'Overall acoustic balance and final gain',
        val: typeof settings.masterVolume === 'number' ? settings.masterVolume : 0.8,
        theme: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.55)',
        icon: '◈',
        type: 'amber'
      },
      {
        id: 'musicVolume',
        label: 'MUSIC VOLUME',
        sub: 'Soundtrack, cathedral choir & atmospheric score',
        val: typeof settings.musicVolume === 'number' ? settings.musicVolume : 0.7,
        theme: '#c084fc',
        glow: 'rgba(168, 85, 247, 0.55)',
        icon: '♪',
        type: 'violet'
      },
      {
        id: 'sfxVolume',
        label: 'SOUND EFFECTS',
        sub: 'Blade strikes, projectile impacts & ability cues',
        val: typeof settings.sfxVolume === 'number' ? settings.sfxVolume : 0.85,
        theme: '#38bdf8',
        glow: 'rgba(56, 189, 248, 0.55)',
        icon: '⚡',
        type: 'azure'
      }
    ];

    const channelY = bayY + 34;
    const channelH = 92;
    const channelGap = 8;

    // Handle mouse dragging across tracks
    if (isMouseDown) {
      channels.forEach((ch, idx) => {
        const cy = channelY + idx * (channelH + channelGap);
        const trackX = leftBayX + 20;
        const trackW = leftBayW - 40;
        const trackY = cy + 40;
        const trackH = 22;

        if (_activeDraggingChannel === ch.id || (mouseY >= trackY - 10 && mouseY <= trackY + trackH + 10 && mouseX >= trackX - 10 && mouseX <= trackX + trackW + 10)) {
          _activeDraggingChannel = ch.id;
          const frac = Math.max(0, Math.min(1, (mouseX - trackX) / trackW));
          const rounded = Math.round(frac * 100) / 100;
          if (settings[ch.id] !== rounded) {
            settings[ch.id] = rounded;
            SaveSystem.saveSettings(settings);
          }
        }
      });
    } else {
      _activeDraggingChannel = null;
    }

    channels.forEach((ch, idx) => {
      const cy = channelY + idx * (channelH + channelGap);
      const isDraggingThis = _activeDraggingChannel === ch.id;

      // Inset Instrument Housing Card (Deep Violet Stone)
      drawStoneCard(ctx, leftBayX + 10, cy, leftBayW - 20, channelH, {
        isHover: isDraggingThis,
        isSelected: isDraggingThis,
        accentColor: ch.type === 'amber' ? 'gold' : (ch.type === 'violet' ? 'violet' : 'azure'),
        chamfer: 5
      });

      // Channel Icon & Title
      ctx.fillStyle = isMuted ? '#64748b' : '#f8fafc';
      ctx.font = 'bold 9.5px Cinzel, serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`${ch.icon} ${ch.label}`, leftBayX + 20, cy + 9);

      ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
      ctx.font = 'italic 8.5px "Crimson Text", serif';
      ctx.fillText(ch.sub, leftBayX + 20, cy + 24);

      // Percentage Only (No decibels or pseudo-engine diagnostics)
      const pct = isMuted ? 0 : Math.round(ch.val * 100);
      ctx.fillStyle = isMuted ? '#ef4444' : ch.theme;
      ctx.font = 'bold 11px Cinzel, serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${pct}%`, leftBayX + leftBayW - 20, cy + 9);

      // ── Custom Recessed Basalt Track ──
      const trackX = leftBayX + 20;
      const trackW = leftBayW - 40;
      const trackY = cy + 40;
      const trackH = 22;

      // Track milled recess bedding
      ctx.fillStyle = '#060814';
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.65)';
      ctx.lineWidth = 1;
      drawChamferedPanel(ctx, trackX, trackY, trackW, trackH, 3);
      ctx.fill(); ctx.stroke();

      // Center guide slot with etched dark edge
      ctx.fillStyle = '#020409';
      drawChamferedPanel(ctx, trackX + 4, trackY + trackH / 2 - 2, trackW - 8, 4, 2);
      ctx.fill();

      // Energy Fill Bar
      const effectiveVal = isMuted ? 0 : ch.val;
      const fillW = Math.max(0, Math.min(trackW - 8, (trackW - 8) * effectiveVal));
      if (fillW > 0) {
        ctx.save();
        if (!isReducedMotion) {
          ctx.shadowColor = ch.glow;
          ctx.shadowBlur = 8;
        }

        const fGrad = ctx.createLinearGradient(trackX + 4, trackY, trackX + 4 + fillW, trackY);
        if (ch.type === 'amber') {
          fGrad.addColorStop(0, '#78350f');
          fGrad.addColorStop(0.7, '#d97706');
          fGrad.addColorStop(1, '#fde68a');
        } else if (ch.type === 'violet') {
          fGrad.addColorStop(0, '#581c87');
          fGrad.addColorStop(0.7, '#9333ea');
          fGrad.addColorStop(1, '#e9d5ff');
        } else {
          fGrad.addColorStop(0, '#0369a1');
          fGrad.addColorStop(0.7, '#0284c7');
          fGrad.addColorStop(1, '#bae6fd');
        }
        ctx.fillStyle = fGrad;
        drawChamferedPanel(ctx, trackX + 4, trackY + 3, fillW, trackH - 6, 2);
        ctx.fill();

        // Subtle, elegant harmonic wave inside fill bar (restrained, non-distracting)
        if (!isReducedMotion && effectiveVal > 0) {
          drawChamferedPanel(ctx, trackX + 4, trackY + 3, fillW, trackH - 6, 2);
          ctx.clip();

          ctx.lineWidth = 1.3;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.50)';
          ctx.beginPath();
          const waveCenterY = trackY + trackH / 2;
          for (let wx = 0; wx <= fillW; wx += 4) {
            const freq = ch.type === 'amber' ? 0.14 : (ch.type === 'violet' ? 0.17 : 0.19);
            const speed = ch.type === 'amber' ? 3.0 : (ch.type === 'violet' ? 3.8 : 4.4);
            const wy = waveCenterY + Math.sin(_ambientTimer * speed + wx * freq) * 2.8;
            if (wx === 0) ctx.moveTo(trackX + 4 + wx, wy);
            else ctx.lineTo(trackX + 4 + wx, wy);
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      // Moving Metallic Carriage / Thumb
      const cursorX = trackX + 4 + (trackW - 8) * effectiveVal;
      const cursorY = trackY + trackH / 2;
      const curW = 16, curH = 24;

      ctx.save();
      if (!isReducedMotion) {
        ctx.shadowColor = ch.glow;
        ctx.shadowBlur = 6;
      }
      ctx.fillStyle = '#1e2436';
      ctx.strokeStyle = isMuted ? '#64748b' : ch.theme;
      ctx.lineWidth = 1.6;
      drawChamferedPanel(ctx, cursorX - curW / 2, cursorY - curH / 2, curW, curH, 3);
      ctx.fill(); ctx.stroke();

      // Center crystal indicator bead
      ctx.fillStyle = isMuted ? '#64748b' : ch.theme;
      ctx.beginPath();
      ctx.arc(cursorX, cursorY, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Etched graduation marks below track (Percentages only)
      const ticks = [
        { pct: 0, label: '0%' },
        { pct: 0.25, label: '25%' },
        { pct: 0.50, label: '50%' },
        { pct: 0.75, label: '75%' },
        { pct: 1.00, label: '100%' }
      ];

      ticks.forEach(t => {
        const tx = trackX + 4 + (trackW - 8) * t.pct;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tx, trackY + trackH + 2);
        ctx.lineTo(tx, trackY + trackH + 5);
        ctx.stroke();

        ctx.fillStyle = 'rgba(148, 163, 184, 0.65)';
        ctx.font = '7.5px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(t.label, tx, trackY + trackH + 6);
      });

      // Interactive hit zone for clicking track
      _zones.push({
        id: `track_${ch.id}`,
        x: trackX - 6, y: cy + 34, w: trackW + 12, h: trackH + 24,
        action: (clickMx) => {
          const px = typeof clickMx === 'number' ? clickMx : (InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.mx : mouseX);
          const frac = Math.max(0, Math.min(1, (px - trackX) / trackW));
          settings[ch.id] = Math.round(frac * 100) / 100;
          SaveSystem.saveSettings(settings);
          SoundManager.snd('menu_press');
        }
      });
    });

    // ── Balanced Audio Utility Plinth (Fills lower left bay) ──
    const audioUtilY = channelY + 3 * (channelH + channelGap) + 4;
    const audioBtnW = Math.floor((leftBayW - 28) / 2);
    const audioBtnH = 26;

    // Button 1: Quick Mute / Unmute
    const isHoverMuteBtn = mouseX >= leftBayX + 10 && mouseX <= leftBayX + 10 + audioBtnW && mouseY >= audioUtilY && mouseY <= audioUtilY + audioBtnH;
    drawStoneButton(ctx, isMuted ? 'UNMUTE ALL [ M ]' : 'MUTE ALL [ M ]', leftBayX + 10, audioUtilY, audioBtnW, audioBtnH, {
      isHover: isHoverMuteBtn,
      isSelected: isMuted,
      variant: isMuted ? 'danger' : 'normal',
      fontSize: 8.5
    });

    _zones.push({
      id: 'quick_mute_btn',
      x: leftBayX + 10, y: audioUtilY, w: audioBtnW, h: audioBtnH,
      action: () => {
        settings.muted = !settings.muted;
        SaveSystem.saveSettings(settings);
        SoundManager.snd('menu_select');
      }
    });

    // Button 2: Reset Audio Defaults
    const rAudioX = leftBayX + 10 + audioBtnW + 8;
    const isHoverResetAudio = mouseX >= rAudioX && mouseX <= rAudioX + audioBtnW && mouseY >= audioUtilY && mouseY <= audioUtilY + audioBtnH;
    drawStoneButton(ctx, '↺ RESET AUDIO', rAudioX, audioUtilY, audioBtnW, audioBtnH, {
      isHover: isHoverResetAudio,
      fontSize: 8.5
    });

    _zones.push({
      id: 'reset_audio_btn',
      x: rAudioX, y: audioUtilY, w: audioBtnW, h: audioBtnH,
      action: () => {
        settings.masterVolume = 0.8;
        settings.musicVolume = 0.7;
        settings.sfxVolume = 0.85;
        settings.muted = false;
        SaveSystem.saveSettings(settings);
        SoundManager.snd('menu_select');
      }
    });

    // Clean audio chamber caption
    ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
    ctx.font = 'italic 8.5px "Crimson Text", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Acoustic resonance adjusts in real time and persists across expeditions.', leftBayX + leftBayW / 2, audioUtilY + audioBtnH + 7);

    // ═════════════════════════════════════════════════════════════
    // RIGHT ZONE: CHRONOMETER & SENSORY CONTROLS
    // ═════════════════════════════════════════════════════════════
    drawStonePanel(ctx, rightBayX, bayY, rightBayW, bayH, {
      chamfer: 8,
      outerBorderColor: 'rgba(217, 119, 6, 0.70)',
      hasCornerBrackets: true,
      bracketLen: 12
    });

    // 1. Chronometric Temporal Regulator Header
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('⚡ CHRONOMETRIC TEMPORAL REGULATOR', rightBayX + 16, bayY + 12);

    ctx.strokeStyle = 'rgba(201, 168, 76, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rightBayX + 16, bayY + 27);
    ctx.lineTo(rightBayX + rightBayW - 16, bayY + 27);
    ctx.stroke();

    const targetSpeed = typeof settings.gameSpeed === 'number' ? settings.gameSpeed : 1.0;
    // Jitter-free continuous frame-rate-independent needle easing towards target speed
    if (isReducedMotion) {
      _displayedSpeed = targetSpeed;
    } else {
      _displayedSpeed += (targetSpeed - _displayedSpeed) * Math.min(1.0, dt * 10.0);
    }

    // Chronometer Instrument Card (Height: 172px - fills regulator chamber richly)
    const dialBoxY = bayY + 34;
    const dialBoxH = 172;
    drawStoneCard(ctx, rightBayX + 10, dialBoxY, rightBayW - 20, dialBoxH, {
      isHover: false,
      isSelected: false,
      chamfer: 6
    });

    // Reset 1.00x Button (Top-Right of dial card header)
    const resetBtnW = 96, resetBtnH = 22;
    const resetBtnX = rightBayX + rightBayW - 22 - resetBtnW;
    const resetBtnY = dialBoxY + 8;
    const isHoverReset = mouseX >= resetBtnX && mouseX <= resetBtnX + resetBtnW && mouseY >= resetBtnY && mouseY <= resetBtnY + resetBtnH;

    drawStoneButton(ctx, '↺ RESET 1.00×', resetBtnX, resetBtnY, resetBtnW, resetBtnH, {
      isHover: isHoverReset,
      fontSize: 8.5
    });

    _zones.push({
      id: 'speed_reset',
      x: resetBtnX, y: resetBtnY, w: resetBtnW, h: resetBtnH,
      action: () => {
        settings.gameSpeed = 1.0;
        SaveSystem.saveSettings(settings);
        SoundManager.snd('menu_select');
      }
    });

    // Dial arc parameters
    const dialCenterX = rightBayX + (rightBayW - 20) / 2 + 10;
    const dialCenterY = dialBoxY + 66;
    const dialRadius = 46;
    const minSp = 0.5, maxSp = 2.0;
    const arcStart = Math.PI * 0.8;
    const arcSweep = Math.PI * 1.4;

    // Outer decorative bronze bezel ring
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.40)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(dialCenterX, dialCenterY, dialRadius + 8, arcStart - 0.1, arcStart + arcSweep + 0.1);
    ctx.stroke();

    // Semicircular background track arc
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.45)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(dialCenterX, dialCenterY, dialRadius, arcStart, arcStart + arcSweep);
    ctx.stroke();

    // Speed notch ticks around arc
    const arcSpeeds = [0.5, 1.0, 1.5, 2.0];
    arcSpeeds.forEach(sp => {
      const spFrac = (sp - minSp) / (maxSp - minSp);
      const angle = arcStart + spFrac * arcSweep;
      const innerX = dialCenterX + Math.cos(angle) * (dialRadius - 9);
      const innerY = dialCenterY + Math.sin(angle) * (dialRadius - 9);
      const outerX = dialCenterX + Math.cos(angle) * (dialRadius + 3);
      const outerY = dialCenterY + Math.sin(angle) * (dialRadius + 3);
      ctx.strokeStyle = Math.abs(targetSpeed - sp) < 0.05 ? '#fde68a' : 'rgba(148, 163, 184, 0.65)';
      ctx.lineWidth = Math.abs(targetSpeed - sp) < 0.05 ? 2.0 : 1.4;
      ctx.beginPath();
      ctx.moveTo(innerX, innerY);
      ctx.lineTo(outerX, outerY);
      ctx.stroke();
    });

    // Active speed arc glow (smoothly eased)
    const dispFrac = Math.max(0, Math.min(1, (_displayedSpeed - minSp) / (maxSp - minSp)));
    const needleAngle = arcStart + dispFrac * arcSweep;
    const speedCol = targetSpeed === 1.0 ? '#fde68a' : (targetSpeed > 1.0 ? '#fb923c' : '#38bdf8');

    ctx.strokeStyle = speedCol;
    ctx.lineWidth = 6;
    if (!isReducedMotion) {
      ctx.shadowColor = speedCol;
      ctx.shadowBlur = 8;
    }
    ctx.beginPath();
    ctx.arc(dialCenterX, dialCenterY, dialRadius, arcStart, needleAngle);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Chronometer needle pointer (smoothly eased without jumping)
    ctx.save();
    ctx.translate(dialCenterX, dialCenterY);
    ctx.rotate(needleAngle);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(dialRadius - 6, 0);
    ctx.stroke();

    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Prominent numerical velocity readout
    ctx.fillStyle = speedCol;
    ctx.font = 'bold 14px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${targetSpeed.toFixed(2)}× VELOCITY`, dialCenterX, dialCenterY - 6);

    const paceDesc = targetSpeed === 1.0
      ? 'EQUILIBRIUM · STANDARD CADENCE'
      : (targetSpeed < 1.0 ? 'DILATED CHRONOMETRY (SLOWER)' : 'ACCELERATED SURGE (FASTER)');
    ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
    ctx.font = 'italic 8.5px "Crimson Text", serif';
    ctx.fillText(paceDesc, dialCenterX, dialCenterY + 11);

    // 4 Stepped Speed Notches (Visibly associated with dial - No magma cracks!)
    const notches = [
      { val: 0.5, label: '0.50×' },
      { val: 1.0, label: '1.00×' },
      { val: 1.5, label: '1.50×' },
      { val: 2.0, label: '2.00×' }
    ];

    const notchY = dialBoxY + dialBoxH - 36;
    const notchGap = 6;
    const notchW = Math.floor((rightBayW - 40 - (notches.length - 1) * notchGap) / notches.length);

    notches.forEach((n, idx) => {
      const nx = rightBayX + 16 + idx * (notchW + notchGap);
      const isSel = Math.abs(targetSpeed - n.val) < 0.05;
      const isHover = mouseX >= nx && mouseX <= nx + notchW && mouseY >= notchY && mouseY <= notchY + 28;

      drawStoneButton(ctx, n.label, nx, notchY, notchW, 28, {
        isHover,
        isSelected: isSel,
        variant: 'normal',
        fontSize: 9.5
      });

      _zones.push({
        id: `speed_${n.val}`,
        x: nx, y: notchY, w: notchW, h: 28,
        action: () => {
          settings.gameSpeed = n.val;
          SaveSystem.saveSettings(settings);
          SoundManager.snd('menu_select');
        }
      });
    });

    // 2. Sensory & Accessibility Levers
    const leverBayY = dialBoxY + dialBoxH + 12;

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('✦ SENSORY & ACCESSIBILITY CONTROLS', rightBayX + 16, leverBayY);

    ctx.strokeStyle = 'rgba(201, 168, 76, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rightBayX + 16, leverBayY + 16);
    ctx.lineTo(rightBayX + rightBayW - 16, leverBayY + 16);
    ctx.stroke();

    const toggles = [
      {
        id: 'screenShake',
        label: 'SCREEN SHAKE',
        desc: 'Tactile camera recoil on weapon strikes & detonation blasts',
        isOn: settings.screenShake !== false,
        activeTheme: '#22c55e',
        activeGlow: 'rgba(34, 197, 94, 0.55)',
        statusText: settings.screenShake !== false ? 'ENGAGED' : 'DAMPENED'
      },
      {
        id: 'reducedMotion',
        label: 'REDUCED MOTION',
        desc: 'Mitigate camera sweeps, floating ambient motes & drift',
        isOn: !!settings.reducedMotion,
        activeTheme: '#38bdf8',
        activeGlow: 'rgba(56, 189, 248, 0.55)',
        statusText: settings.reducedMotion ? 'ACTIVE' : 'STANDARD'
      }
    ];

    const tRowY = leverBayY + 22;
    const tRowH = 46;

    toggles.forEach((tog, tIdx) => {
      const ty = tRowY + tIdx * (tRowH + 6);
      const isHoverTog = mouseX >= rightBayX + 10 && mouseX <= rightBayX + rightBayW - 10 && mouseY >= ty && mouseY <= ty + tRowH;

      drawStoneCard(ctx, rightBayX + 10, ty, rightBayW - 20, tRowH, {
        isHover: isHoverTog,
        isSelected: tog.isOn,
        accentColor: tog.id === 'screenShake' ? 'emerald' : 'azure',
        chamfer: 5
      });

      // Label & Description
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = tog.isOn ? '#ffffff' : '#94a3b8';
      ctx.font = 'bold 9.5px Cinzel, serif';
      ctx.fillText(tog.label, rightBayX + 20, ty + 9);

      ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
      ctx.font = 'italic 8.5px "Crimson Text", serif';
      ctx.fillText(tog.desc, rightBayX + 20, ty + 25);

      // Status Badge (ENGAGED / DAMPENED / ACTIVE / STANDARD)
      const badgeW = 74, badgeH = 18;
      const badgeX = rightBayX + rightBayW - 30 - 64 - badgeW;
      const badgeY = ty + (tRowH - badgeH) / 2;

      ctx.fillStyle = tog.isOn ? 'rgba(34, 197, 94, 0.15)' : 'rgba(71, 85, 105, 0.25)';
      ctx.strokeStyle = tog.isOn ? tog.activeTheme : 'rgba(71, 85, 105, 0.5)';
      ctx.lineWidth = 1;
      drawChamferedPanel(ctx, badgeX, badgeY, badgeW, badgeH, 3);
      ctx.fill(); ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 7.5px monospace';
      ctx.fillStyle = tog.isOn ? tog.activeTheme : '#94a3b8';
      ctx.fillText(tog.statusText, badgeX + badgeW / 2, badgeY + badgeH / 2);

      // Inset Mechanical Lever Well
      const swW = 56, swH = 24;
      const swX = rightBayX + rightBayW - 22 - swW;
      const swY = ty + (tRowH - swH) / 2;

      ctx.fillStyle = '#080c16';
      ctx.strokeStyle = tog.isOn ? tog.activeTheme : 'rgba(71, 85, 105, 0.65)';
      ctx.lineWidth = 1;
      drawChamferedPanel(ctx, swX, swY, swW, swH, 12);
      ctx.fill(); ctx.stroke();

      // Tactile Lever Knob (Knurled brass mechanism)
      const knobX = tog.isOn ? (swX + swW - 14) : (swX + 14);
      const knobY = swY + swH / 2;

      ctx.save();
      if (!isReducedMotion) {
        ctx.shadowColor = tog.isOn ? tog.activeGlow : 'rgba(0,0,0,0)';
        ctx.shadowBlur = 6;
      }
      ctx.fillStyle = tog.isOn ? '#fde68a' : '#64748b';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(knobX, knobY, 8.5, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();

      // Core jewel
      ctx.fillStyle = tog.isOn ? tog.activeTheme : '#1e293b';
      ctx.beginPath();
      ctx.arc(knobX, knobY, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      _zones.push({
        id: `toggle_${tog.id}`,
        x: rightBayX + 10, y: ty, w: rightBayW - 20, h: tRowH,
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

    // 3. Mobile / Touch Controls Calibration Plinth
    const mobY = tRowY + 2 * (tRowH + 6) + 6;
    const isEditing = MobileControls.isEditMode();
    const mobBtnW = Math.floor((rightBayW - 28) / 2);
    const mobBtnH = 28;

    // Reposition button
    const m1X = rightBayX + 10;
    const isHoverM1 = mouseX >= m1X && mouseX <= m1X + mobBtnW && mouseY >= mobY && mouseY <= mobY + mobBtnH;

    drawStoneButton(ctx, isEditing ? '✔ DONE EDITING' : '◈ TOUCH CONTROLS', m1X, mobY, mobBtnW, mobBtnH, {
      isHover: isHoverM1,
      isSelected: isEditing,
      variant: isEditing ? 'primary' : 'normal',
      fontSize: 8.5
    });

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

    // Reset controls button (Crafted as authentic destructive stone button)
    const m2X = m1X + mobBtnW + 8;
    const isHoverM2 = mouseX >= m2X && mouseX <= m2X + mobBtnW && mouseY >= mobY && mouseY <= mobY + mobBtnH;

    drawStoneButton(ctx, '◈ RESET LAYOUT', m2X, mobY, mobBtnW, mobBtnH, {
      isHover: isHoverM2,
      variant: 'danger',
      fontSize: 8.5
    });

    _zones.push({
      id: 'mobile_reset',
      x: m2X, y: mobY, w: mobBtnW, h: mobBtnH,
      action: () => {
        MobileControls.resetCtrlLayout();
        SoundManager.snd('menu_select');
      }
    });

    // Clean Right Chamber note
    const rightNoteY = mobY + mobBtnH + 8;
    ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
    ctx.font = 'italic 8.5px "Crimson Text", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Settings are automatically saved and applied immediately.', rightBayX + rightBayW / 2, rightNoteY);

    // ─────────────────────────────────────────────────────────────
    // 4. BOTTOM BAR: KEYBOARD HINTS & RETURN BUTTON
    // ─────────────────────────────────────────────────────────────
    const botY = panY + panH - 34;
    const retW = 214, retH = 26;
    const retX = panX + panW - 20 - retW;
    const isHoverRet = mouseX >= retX && mouseX <= retX + retW && mouseY >= botY && mouseY <= botY + retH;
    const isPressRet = isHoverRet && isMouseDown;

    const retLabel = (_returnState === GameStates.PAUSED)
      ? '◈ RETURN TO EXPEDITION [ ESC ]'
      : '◈ RETURN TO TITLE [ ESC ]';

    drawStoneButton(ctx, retLabel, retX, botY, retW, retH, {
      isHover: isHoverRet,
      isPressed: isPressRet,
      isSelected: false,
      variant: 'primary',
      fontSize: 9.0
    });

    ctx.fillStyle = 'rgba(148, 163, 184, 0.70)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Click / Drag Sliders    Hotkeys: [ M ] Mute    [ O / P ] Velocity    [ Esc ] Return', panX + 24, botY + retH / 2);

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
          z.action(mx, my);
          return true;
        }
      }
    }

    // Click outside modal box returns
    const panW = Math.min(880, LW - 24), panH = Math.min(540, LH - 24);
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
  },

  getReturnState() {
    return _returnState;
  }
};

SettingsUI._zones = _zones;

if (typeof window !== 'undefined') {
  window.SettingsUI = SettingsUI;
  window.SaveSystem = SaveSystem;
  window.openSettings = openSettings;
  window.closeSettings = closeSettings;
}
