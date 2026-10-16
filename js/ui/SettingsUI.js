// =====================================================================
//  DUNGEON BREAK — js/ui/SettingsUI.js
//  Phase 5.3: Arcane Artificer's Calibration Console
//  - Bespoke chamfered obsidian chassis with antique brass rivets & runes
//  - 3 Distinct Acoustic Resonance Tracks (Master Amber, Music Violet, SFX Cyan)
//  - Semicircular Stepped Chronometric Regulator with Dial Needle & 1.00x Reset
//  - Tactile Inset Brass Toggle Levers for Screen Shake & Reduced Motion
//  - Preserved Mobile Controls Calibration & Restore Defaults
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
let _activeDraggingChannel = null;

// Layout zones populated each frame for 100% pixel-accurate hit testing
const _zones = [];

export function openSettings(fromState = null) {
  _settingsSlide = 0;
  _activeDraggingChannel = null;
  _returnState = (fromState === GameStates.PAUSED || GameState.PREV_STATE === GameStates.PAUSED || GameState.STATE === GameStates.PAUSED)
    ? GameStates.PAUSED
    : GameStates.TITLE;
  GameState.setState(GameStates.SETTINGS);
  SoundManager.snd('panel_open');
}

export function closeSettings() {
  _activeDraggingChannel = null;
  SoundManager.snd('panel_close');
  const target = (GameState.PREV_STATE === GameStates.PAUSED || _returnState === GameStates.PAUSED)
    ? GameStates.PAUSED
    : GameStates.TITLE;
  GameState.setState(target);
}

/** Helper to draw custom chamfered fantasy console plate */
function drawChamferedPanel(ctx, x, y, w, h, chamfer, fillStyle, strokeStyle, lineWidth = 1) {
  ctx.beginPath();
  ctx.moveTo(x + chamfer, y);
  ctx.lineTo(x + w - chamfer, y);
  ctx.lineTo(x + w, y + chamfer);
  ctx.lineTo(x + w, y + h - chamfer);
  ctx.lineTo(x + w - chamfer, y + h);
  ctx.lineTo(x + chamfer, y + h);
  ctx.lineTo(x, y + h - chamfer);
  ctx.lineTo(x, y + chamfer);
  ctx.closePath();
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

/** Helper to draw ornamental brass corner brackets and rivets */
function drawCornerBrackets(ctx, x, y, w, h, len = 14, col = 'rgba(217, 119, 6, 0.75)') {
  ctx.save();
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.5;
  // Top-left
  ctx.beginPath(); ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
  // Top-right
  ctx.beginPath(); ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len); ctx.stroke();
  // Bottom-left
  ctx.beginPath(); ctx.moveTo(x, y + h - len); ctx.lineTo(x, y + h); ctx.lineTo(x + len, y + h); ctx.stroke();
  // Bottom-right
  ctx.beginPath(); ctx.moveTo(x + w - len, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - len); ctx.stroke();

  // Fine brass rivets
  ctx.fillStyle = '#fde68a';
  const rivets = [
    [x + 4, y + 4], [x + w - 4, y + 4],
    [x + 4, y + h - 4], [x + w - 4, y + h - 4]
  ];
  rivets.forEach(([rx, ry]) => {
    ctx.beginPath();
    ctx.arc(rx, ry, 1.8, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

export const SettingsUI = {
  draw(ctx, dt = 0.016) {
    _settingsSlide = Math.min(1, _settingsSlide + dt * 6.0);
    _ambientTimer += dt;
    const eased = 1 - Math.pow(1 - _settingsSlide, 3);

    // Full screen darkened vignette
    ctx.save();
    ctx.globalAlpha = eased;
    ctx.fillStyle = 'rgba(2, 4, 10, 0.92)';
    ctx.fillRect(0, 0, LW, LH);

    const panW = 890;
    const panH = 530;
    const panX = Math.round((LW - panW) / 2);
    const panY = Math.round((LH - panH) / 2 - (1 - eased) * 35);

    // Radial furnace glow behind console
    const pulse = 0.5 + 0.5 * Math.sin(_ambientTimer * 2.0);
    const grad = ctx.createRadialGradient(panX + panW / 2, panY + 180, 20, panX + panW / 2, panY + 240, 480);
    grad.addColorStop(0, `rgba(217, 119, 6, ${0.16 + pulse * 0.04})`);
    grad.addColorStop(0.5, 'rgba(147, 51, 234, 0.06)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(panX - 40, panY - 40, panW + 80, panH + 80);

    // ─────────────────────────────────────────────────────────────
    // 1. BESPOKE OUTER CHASSIS (LAYERED OBSIDIAN & BRASS BEZEL)
    // ─────────────────────────────────────────────────────────────
    // Stepped outer iron rim with chamfered silhouette
    drawChamferedPanel(ctx, panX, panY, panW, panH, 16, 'rgba(6, 10, 20, 0.98)', 'rgba(217, 119, 6, 0.75)', 1.8);

    // Inner etched brass channel
    drawChamferedPanel(ctx, panX + 6, panY + 6, panW - 12, panH - 12, 12, 'rgba(10, 15, 28, 0.96)', 'rgba(201, 168, 76, 0.35)', 1);

    // Corner filigree brackets
    drawCornerBrackets(ctx, panX + 8, panY + 8, panW - 16, panH - 16, 20, 'rgba(217, 119, 6, 0.85)');

    _zones.length = 0;
    const mouseX = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.mx : -999;
    const mouseY = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.my : -999;
    const isMouseDown = InputManager.MOUSE_STATE ? !!InputManager.MOUSE_STATE.isDown : false;
    const settings = SaveSystem.getSettings();

    // ─────────────────────────────────────────────────────────────
    // 2. DOMINANT TITLE AREA & MASTER ACOUSTIC POWER LEVER
    // ─────────────────────────────────────────────────────────────
    const topY = panY + 16;
    const isReducedMotion = !!settings.reducedMotion;

    // Engraved header plaque
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 14px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#d97706';
    ctx.shadowBlur = isReducedMotion ? 0 : 8;
    ctx.fillText('◈ ARCANE ARTIFICER\'S CALIBRATION CONSOLE ◈', panX + 26, topY + 12);
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
    ctx.font = 'italic 9.5px Crimson Text, serif';
    ctx.fillText('Sensory Harmonics Matrix, Chronometric Pace & Abyssal Perception Tuning', panX + 28, topY + 27);

    // Master Power Toggle (Top Right)
    const isMuted = !!settings.muted;
    const leverW = 206, leverH = 28;
    const leverX = panX + panW - 24 - leverW;
    const isHoverMaster = mouseX >= leverX && mouseX <= leverX + leverW && mouseY >= topY && mouseY <= topY + leverH;

    ctx.fillStyle = isMuted
      ? 'rgba(239, 68, 68, 0.22)'
      : (isHoverMaster ? 'rgba(34, 197, 94, 0.25)' : 'rgba(15, 23, 42, 0.85)');
    ctx.strokeStyle = isMuted
      ? '#ef4444'
      : (isHoverMaster ? '#4ade80' : 'rgba(201, 168, 76, 0.65)');
    ctx.lineWidth = 1.3;
    drawChamferedPanel(ctx, leverX, topY, leverW, leverH, 4, null, ctx.strokeStyle, 1.2);
    ctx.fill();

    // Glowing jewel indicator
    ctx.beginPath();
    ctx.arc(leverX + 16, topY + leverH / 2, 5, 0, Math.PI * 2);
    ctx.fillStyle = isMuted ? '#ef4444' : '#22c55e';
    if (!isReducedMotion) {
      ctx.shadowColor = isMuted ? '#ef4444' : '#22c55e';
      ctx.shadowBlur = 6;
    }
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = isMuted ? '#fca5a5' : '#ffffff';
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText(isMuted ? 'ACOUSTIC CONDUIT: MUTED' : 'ACOUSTIC CONDUIT: ACTIVE', leverX + leverW / 2 + 8, topY + leverH / 2);

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
    // 3. INSTRUMENT BAYS (BALANCED ASYMMETRIC TWIN CHAMBERS)
    // Left: Acoustic Resonance Harmonizer (408px)
    // Right: Chronometric Temporal Regulator & Sensory Switchboard (424px)
    // ─────────────────────────────────────────────────────────────
    const bayY = topY + 38;
    const bayH = panY + panH - bayY - 44;
    const leftBayW = 410;
    const rightBayW = panW - 48 - leftBayW - 14;
    const leftBayX = panX + 20;
    const rightBayX = leftBayX + leftBayW + 14;

    // ═════════════════════════════════════════════════════════════
    // LEFT ZONE: ACOUSTIC RESONANCE HARMONIZER
    // ═════════════════════════════════════════════════════════════
    drawChamferedPanel(ctx, leftBayX, bayY, leftBayW, bayH, 8, 'rgba(10, 14, 26, 0.95)', 'rgba(201, 168, 76, 0.65)', 1.4);
    drawCornerBrackets(ctx, leftBayX + 2, bayY + 2, leftBayW - 4, bayH - 4, 12, 'rgba(201, 168, 76, 0.45)');

    // Section Header
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('ᛟ ACOUSTIC RESONANCE & SPECTRAL FREQUENCIES', leftBayX + 16, bayY + 12);

    ctx.strokeStyle = 'rgba(201, 168, 76, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftBayX + 16, bayY + 28);
    ctx.lineTo(leftBayX + leftBayW - 16, bayY + 28);
    ctx.stroke();

    // 3 Unique Acoustic Resonance Instruments
    const channels = [
      {
        id: 'masterVolume',
        label: 'MASTER ACOUSTIC RESONANCE',
        sub: 'Overall sonic conduit gain & dynamic range limit',
        val: typeof settings.masterVolume === 'number' ? settings.masterVolume : 0.8,
        theme: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.55)',
        icon: '◈',
        type: 'amber'
      },
      {
        id: 'musicVolume',
        label: 'SANCTUM CHORALE (MUSIC)',
        sub: 'Ethereal orchestrations & dark choral resonance',
        val: typeof settings.musicVolume === 'number' ? settings.musicVolume : 0.7,
        theme: '#c084fc',
        glow: 'rgba(168, 85, 247, 0.55)',
        icon: '♪',
        type: 'violet'
      },
      {
        id: 'sfxVolume',
        label: 'CRUCIBLE IMPACT (SFX)',
        sub: 'Blade cleaves, projectile pierces & trauma feedback',
        val: typeof settings.sfxVolume === 'number' ? settings.sfxVolume : 0.85,
        theme: '#38bdf8',
        glow: 'rgba(56, 189, 248, 0.55)',
        icon: '⚡',
        type: 'cyan'
      }
    ];

    const channelY = bayY + 36;
    const channelH = 96;

    // Handle mouse dragging across tracks
    if (isMouseDown) {
      channels.forEach((ch, idx) => {
        const cy = channelY + idx * (channelH + 6);
        const trackX = leftBayX + 22;
        const trackW = leftBayW - 44;
        const trackY = cy + 42;
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
      const cy = channelY + idx * (channelH + 6);
      const isDraggingThis = _activeDraggingChannel === ch.id;

      // Inset Instrument Housing Plate
      ctx.fillStyle = isDraggingThis ? 'rgba(20, 30, 52, 0.85)' : 'rgba(14, 20, 36, 0.75)';
      ctx.strokeStyle = isDraggingThis ? ch.theme : 'rgba(51, 65, 85, 0.55)';
      ctx.lineWidth = isDraggingThis ? 1.5 : 1;
      drawChamferedPanel(ctx, leftBayX + 12, cy, leftBayW - 24, channelH, 6, null, ctx.strokeStyle, ctx.lineWidth);
      ctx.fill();

      // Channel Icon & Title
      ctx.fillStyle = isMuted ? '#64748b' : '#f8fafc';
      ctx.font = 'bold 9.5px Cinzel, serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`${ch.icon} ${ch.label}`, leftBayX + 22, cy + 9);

      ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
      ctx.font = 'italic 8.5px Crimson Text, serif';
      ctx.fillText(ch.sub, leftBayX + 22, cy + 23);

      // Percentage & Decibel Readout
      const pct = isMuted ? 0 : Math.round(ch.val * 100);
      const db = pct === 0 ? '-∞ dB' : (pct === 100 ? '0.0 dB' : `-${((100 - pct) * 0.28).toFixed(1)} dB`);
      ctx.fillStyle = isMuted ? '#ef4444' : ch.theme;
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${pct}%  •  ${db}`, leftBayX + leftBayW - 22, cy + 9);

      // ── Engraved Acoustic Resonance Track ──
      const trackX = leftBayX + 22;
      const trackW = leftBayW - 44;
      const trackY = cy + 42;
      const trackH = 20;

      // Track milled recess bedding
      ctx.fillStyle = '#050812';
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.65)';
      ctx.lineWidth = 1;
      roundRect(ctx, trackX, trackY, trackW, trackH, 4);
      ctx.fill(); ctx.stroke();

      // Center guide slot with etched brass edge
      ctx.fillStyle = '#020409';
      roundRect(ctx, trackX + 4, trackY + trackH / 2 - 2, trackW - 8, 4, 2);
      ctx.fill();

      // Energy Fill according to channel theme
      const effectiveVal = isMuted ? 0 : ch.val;
      const fillW = Math.max(0, Math.min(trackW - 8, (trackW - 8) * effectiveVal));
      if (fillW > 0) {
        ctx.save();
        if (!isReducedMotion) {
          ctx.shadowColor = ch.glow;
          ctx.shadowBlur = 8;
        }
        if (ch.type === 'amber') {
          const fGrad = ctx.createLinearGradient(trackX + 4, trackY, trackX + 4 + fillW, trackY);
          fGrad.addColorStop(0, '#78350f');
          fGrad.addColorStop(0.7, '#d97706');
          fGrad.addColorStop(1, '#fde68a');
          ctx.fillStyle = fGrad;
        } else if (ch.type === 'violet') {
          const fGrad = ctx.createLinearGradient(trackX + 4, trackY, trackX + 4 + fillW, trackY);
          fGrad.addColorStop(0, '#581c87');
          fGrad.addColorStop(0.7, '#9333ea');
          fGrad.addColorStop(1, '#e9d5ff');
          ctx.fillStyle = fGrad;
        } else {
          const fGrad = ctx.createLinearGradient(trackX + 4, trackY, trackX + 4 + fillW, trackY);
          fGrad.addColorStop(0, '#0369a1');
          fGrad.addColorStop(0.7, '#0284c7');
          fGrad.addColorStop(1, '#bae6fd');
          ctx.fillStyle = fGrad;
        }
        roundRect(ctx, trackX + 4, trackY + 3, fillW, trackH - 6, 3);
        ctx.fill();

        // Sinusoidal waveform ripples inside the music track (subtle, decorative)
        if (ch.type === 'violet' && !isReducedMotion) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let wx = 0; wx < fillW; wx += 4) {
            const wy = trackY + trackH / 2 + Math.sin(_ambientTimer * 4.0 + wx * 0.15) * 3.5;
            if (wx === 0) ctx.moveTo(trackX + 4 + wx, wy);
            else ctx.lineTo(trackX + 4 + wx, wy);
          }
          ctx.stroke();
        }

        // Electric arc impulses inside SFX track (subtle, decorative)
        if (ch.type === 'cyan' && !isReducedMotion) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 1;
          for (let ax = 14; ax < fillW - 8; ax += 32) {
            ctx.beginPath();
            ctx.moveTo(trackX + 4 + ax, trackY + 4);
            ctx.lineTo(trackX + 4 + ax + 3, trackY + trackH / 2);
            ctx.lineTo(trackX + 4 + ax - 2, trackY + trackH - 4);
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      // Moving Metallic / Crystal Cursor Carriage
      const cursorX = trackX + 4 + (trackW - 8) * effectiveVal;
      const cursorY = trackY + trackH / 2;
      const curW = 16, curH = 24;

      ctx.save();
      if (!isReducedMotion) {
        ctx.shadowColor = ch.glow;
        ctx.shadowBlur = 6;
      }
      // Octagonal brass carriage with knurled sides
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = ch.theme;
      ctx.lineWidth = 1.6;
      roundRect(ctx, cursorX - curW / 2, cursorY - curH / 2, curW, curH, 3);
      ctx.fill(); ctx.stroke();

      // Center crystal indicator bead
      ctx.fillStyle = isMuted ? '#64748b' : ch.theme;
      ctx.beginPath();
      ctx.arc(cursorX, cursorY, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Etched tick graduation marks below track
      const ticks = [
        { pct: 0, label: '0% (-∞)' },
        { pct: 0.25, label: '25%' },
        { pct: 0.50, label: '50%' },
        { pct: 0.75, label: '75%' },
        { pct: 1.00, label: '100% (0dB)' }
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

      // Hit zone for clicking track
      _zones.push({
        id: `track_${ch.id}`,
        x: trackX - 6, y: cy + 34, w: trackW + 12, h: trackH + 24,
        action: () => {
          const frac = Math.max(0, Math.min(1, (mouseX - trackX) / trackW));
          settings[ch.id] = Math.round(frac * 100) / 100;
          SaveSystem.saveSettings(settings);
          SoundManager.snd('menu_press');
        }
      });
    });

    // Sub-plate on Left Chamber: ACOUSTIC BUS CONDUIT & FILTERING (Balances vertical height!)
    const busY = channelY + 3 * (channelH + 6) + 4;
    const busH = bayY + bayH - busY - 10;
    drawChamferedPanel(ctx, leftBayX + 12, busY, leftBayW - 24, busH, 5, 'rgba(12, 18, 32, 0.85)', 'rgba(201, 168, 76, 0.45)', 1);

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('◈ ACOUSTIC BUS ROUTING & DYNAMIC MATRIX', leftBayX + 22, busY + 8);

    const busItems = [
      { label: 'CONDUIT:', val: isMuted ? 'STANDBY (MUTED)' : 'STEREO BIQUAD FILTERED', col: isMuted ? '#ef4444' : '#4ade80' },
      { label: 'HEADROOM:', val: '0.0 dB PEAK LIMITER ACTIVE', col: '#38bdf8' },
      { label: 'CHANNELS:', val: '3 BUSES PHASE-SYNCHRONIZED', col: '#c084fc' }
    ];

    busItems.forEach((bi, bIdx) => {
      const by = busY + 24 + bIdx * 15;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(bi.label, leftBayX + 22, by);

      ctx.fillStyle = bi.col;
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(bi.val, leftBayX + 90, by);
    });

    // ═════════════════════════════════════════════════════════════
    // RIGHT ZONE: CHRONOMETER & SENSORY SWITCHBOARD
    // ═════════════════════════════════════════════════════════════
    drawChamferedPanel(ctx, rightBayX, bayY, rightBayW, bayH, 8, 'rgba(10, 14, 26, 0.95)', 'rgba(217, 119, 6, 0.65)', 1.4);
    drawCornerBrackets(ctx, rightBayX + 2, bayY + 2, rightBayW - 4, bayH - 4, 12, 'rgba(217, 119, 6, 0.45)');

    // 1. Chronometric Temporal Regulator Header
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('⚡ CHRONOMETRIC TEMPORAL REGULATOR', rightBayX + 16, bayY + 12);

    ctx.strokeStyle = 'rgba(201, 168, 76, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rightBayX + 16, bayY + 28);
    ctx.lineTo(rightBayX + rightBayW - 16, bayY + 28);
    ctx.stroke();

    const curSpeed = typeof settings.gameSpeed === 'number' ? settings.gameSpeed : 1.0;

    // Chronometer Instrument Box
    const dialBoxY = bayY + 36;
    const dialBoxH = 112;
    drawChamferedPanel(ctx, rightBayX + 12, dialBoxY, rightBayW - 24, dialBoxH, 6, 'rgba(14, 20, 36, 0.85)', 'rgba(51, 65, 85, 0.55)', 1);

    // Speed display & Chronometer dial arc
    const dialCenterX = rightBayX + rightBayW / 2;
    const dialCenterY = dialBoxY + 40;

    // Engraved radial speedometer background arc
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.45)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(dialCenterX, dialCenterY, 44, Math.PI * 0.8, Math.PI * 2.2);
    ctx.stroke();

    // Speed notches ticks around arc
    const arcSpeeds = [0.5, 1.0, 1.5, 2.0];
    arcSpeeds.forEach(sp => {
      const spFrac = (sp - 0.5) / 1.5;
      const angle = Math.PI * 0.8 + spFrac * (Math.PI * 1.4);
      const innerX = dialCenterX + Math.cos(angle) * 36;
      const innerY = dialCenterY + Math.sin(angle) * 36;
      const outerX = dialCenterX + Math.cos(angle) * 44;
      const outerY = dialCenterY + Math.sin(angle) * 44;
      ctx.strokeStyle = Math.abs(curSpeed - sp) < 0.05 ? '#fde68a' : 'rgba(148, 163, 184, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(innerX, innerY);
      ctx.lineTo(outerX, outerY);
      ctx.stroke();
    });

    // Active speed arc glow
    const speedFrac = Math.max(0, Math.min(1, (curSpeed - 0.5) / 1.5));
    const arcEnd = Math.PI * 0.8 + speedFrac * (Math.PI * 1.4);
    ctx.strokeStyle = curSpeed === 1.0 ? '#fde68a' : (curSpeed > 1.0 ? '#fb923c' : '#38bdf8');
    ctx.lineWidth = 5;
    if (!isReducedMotion) {
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 8;
    }
    ctx.beginPath();
    ctx.arc(dialCenterX, dialCenterY, 44, Math.PI * 0.8, arcEnd);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Chronometer needle pointer
    ctx.save();
    ctx.translate(dialCenterX, dialCenterY);
    ctx.rotate(arcEnd);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(38, 0);
    ctx.stroke();
    ctx.fillStyle = '#fde68a';
    ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Prominent numerical velocity readout
    ctx.fillStyle = curSpeed === 1.0 ? '#fde68a' : (curSpeed > 1.0 ? '#fb923c' : '#38bdf8');
    ctx.font = 'bold 15px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${curSpeed.toFixed(2)}× VELOCITY`, dialCenterX, dialCenterY - 4);

    const paceDesc = curSpeed === 1.0 ? 'EQUILIBRIUM · STANDARD CADENCE' : (curSpeed < 1.0 ? 'DILATED CHRONOMETRY (SLOWER)' : 'ACCELERATED SURGE (FASTER)');
    ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
    ctx.font = 'italic 8.5px Crimson Text, serif';
    ctx.fillText(paceDesc, dialCenterX, dialCenterY + 12);

    // Reset 1.00x Button (Top-right of dial box)
    const resetBtnW = 92, resetBtnH = 20;
    const resetBtnX = rightBayX + rightBayW - 22 - resetBtnW;
    const resetBtnY = dialBoxY + 8;
    const isHoverReset = mouseX >= resetBtnX && mouseX <= resetBtnX + resetBtnW && mouseY >= resetBtnY && mouseY <= resetBtnY + resetBtnH;

    ctx.fillStyle = isHoverReset ? 'rgba(217, 119, 6, 0.35)' : 'rgba(30, 41, 59, 0.7)';
    ctx.strokeStyle = isHoverReset ? '#fde68a' : 'rgba(71, 85, 105, 0.55)';
    ctx.lineWidth = 1;
    roundRect(ctx, resetBtnX, resetBtnY, resetBtnW, resetBtnH, 4);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = isHoverReset ? '#ffffff' : '#cbd5e1';
    ctx.font = 'bold 8px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('↺ RESET 1.00×', resetBtnX + resetBtnW / 2, resetBtnY + resetBtnH / 2);

    _zones.push({
      id: 'speed_reset',
      x: resetBtnX, y: resetBtnY, w: resetBtnW, h: resetBtnH,
      action: () => {
        settings.gameSpeed = 1.0;
        SaveSystem.saveSettings(settings);
        SoundManager.snd('menu_select');
      }
    });

    // 4 Stepped Speed Notches
    const notches = [
      { val: 0.5,  label: '0.50× SLIGHT' },
      { val: 1.0,  label: '1.00× NORMAL' },
      { val: 1.5,  label: '1.50× SURGE' },
      { val: 2.0,  label: '2.00× OVERCLOCK' }
    ];

    const notchY = dialBoxY + dialBoxH - 32;
    const notchGap = 6;
    const notchW = Math.floor((rightBayW - 48 - (notches.length - 1) * notchGap) / notches.length);

    notches.forEach((n, idx) => {
      const nx = rightBayX + 22 + idx * (notchW + notchGap);
      const isSel = Math.abs(curSpeed - n.val) < 0.05;
      const isHover = mouseX >= nx && mouseX <= nx + notchW && mouseY >= notchY && mouseY <= notchY + 24;

      ctx.fillStyle = isSel
        ? 'rgba(217, 119, 6, 0.4)'
        : (isHover ? 'rgba(30, 41, 59, 0.85)' : 'rgba(15, 23, 42, 0.75)');
      ctx.strokeStyle = isSel
        ? '#fde68a'
        : (isHover ? '#cbd5e1' : 'rgba(71, 85, 105, 0.5)');
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

    // 2. Sensory & Accessibility Mechanisms (Middle Section of Right Bay)
    const leverBayY = dialBoxY + dialBoxH + 10;

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

    const toggles = [
      {
        id: 'screenShake',
        label: 'SCREEN TRAUMA VIBRATION',
        desc: 'Tactile camera recoil on lethal strikes & detonation blasts',
        isOn: settings.screenShake !== false,
        activeTheme: '#22c55e',
        activeGlow: 'rgba(34, 197, 94, 0.55)',
        statusText: settings.screenShake !== false ? 'ENGAGED' : 'DAMPENED'
      },
      {
        id: 'reducedMotion',
        label: 'ASTRAL FLUIDITY DAMPING',
        desc: 'Mitigate camera sweeps, background motes & drift',
        isOn: !!settings.reducedMotion,
        activeTheme: '#38bdf8',
        activeGlow: 'rgba(56, 189, 248, 0.55)',
        statusText: settings.reducedMotion ? 'DAMPENED' : 'FLUID'
      }
    ];

    const tRowY = leverBayY + 22;
    const tRowH = 48;

    toggles.forEach((tog, tIdx) => {
      const ty = tRowY + tIdx * (tRowH + 6);
      const isHoverTog = mouseX >= rightBayX + 12 && mouseX <= rightBayX + rightBayW - 12 && mouseY >= ty && mouseY <= ty + tRowH;

      ctx.fillStyle = tog.isOn ? 'rgba(16, 26, 46, 0.9)' : 'rgba(14, 20, 36, 0.7)';
      ctx.strokeStyle = tog.isOn ? tog.activeTheme : (isHoverTog ? 'rgba(148, 163, 184, 0.55)' : 'rgba(51, 65, 85, 0.45)');
      ctx.lineWidth = 1.2;
      drawChamferedPanel(ctx, rightBayX + 12, ty, rightBayW - 24, tRowH, 5, null, ctx.strokeStyle, ctx.lineWidth);
      ctx.fill();

      // Label & Description
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = tog.isOn ? '#ffffff' : '#94a3b8';
      ctx.font = 'bold 9.5px Cinzel, serif';
      ctx.fillText(tog.label, rightBayX + 22, ty + 9);

      ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
      ctx.font = 'italic 8.5px Crimson Text, serif';
      ctx.fillText(tog.desc, rightBayX + 22, ty + 26);

      // Inset Mechanical Lever Well
      const swW = 60, swH = 26;
      const swX = rightBayX + rightBayW - 24 - swW;
      const swY = ty + (tRowH - swH) / 2;

      ctx.fillStyle = '#080c16';
      ctx.strokeStyle = tog.isOn ? tog.activeTheme : 'rgba(71, 85, 105, 0.65)';
      ctx.lineWidth = 1;
      roundRect(ctx, swX, swY, swW, swH, 13);
      ctx.fill(); ctx.stroke();

      // Indicator status pill
      ctx.fillStyle = tog.isOn ? tog.activeTheme : '#475569';
      ctx.beginPath();
      const lampX = tog.isOn ? swX + 12 : swX + swW - 12;
      ctx.arc(lampX, swY + swH / 2, 3, 0, Math.PI * 2);
      ctx.fill();

      // Tactile Lever Knob (Knurled brass mechanism)
      const knobX = tog.isOn ? (swX + swW - 15) : (swX + 15);
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
      ctx.arc(knobX, knobY, 9, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();

      // Mechanical core ring
      ctx.fillStyle = tog.isOn ? tog.activeTheme : '#1e293b';
      ctx.beginPath();
      ctx.arc(knobX, knobY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

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
    ctx.fillStyle = isEditing ? 'rgba(34, 197, 94, 0.3)' : (isHoverM1 ? 'rgba(201, 168, 76, 0.3)' : 'rgba(15, 23, 42, 0.75)');
    ctx.strokeStyle = isEditing ? '#22c55e' : 'rgba(201, 168, 76, 0.55)';
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
    ctx.fillStyle = isHoverM2 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
    roundRect(ctx, m2X, mobY, mobBtnW, mobBtnH, 4);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 8.5px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('◈ RESET LAYOUT', m2X + mobBtnW / 2, mobY + mobBtnH / 2);

    _zones.push({
      id: 'mobile_reset',
      x: m2X, y: mobY, w: mobBtnW, h: mobBtnH,
      action: () => {
        MobileControls.resetCtrlLayout();
        SoundManager.snd('menu_select');
      }
    });

    // Sub-plate on Right Chamber: ABYSS ENGINE RUNTIME DIAGNOSTICS (Completely fills bottom dead space!)
    const diagY = mobY + mobBtnH + 8;
    const diagH = bayY + bayH - diagY - 10;
    drawChamferedPanel(ctx, rightBayX + 12, diagY, rightBayW - 24, diagH, 5, 'rgba(12, 18, 32, 0.85)', 'rgba(217, 119, 6, 0.45)', 1);

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('⚡ ABYSS ENGINE RUNTIME DIAGNOSTICS', rightBayX + 22, diagY + 8);

    const diagItems = [
      { label: 'SIMULATION TICK:', val: '60.0 HZ (FIXED TIMESTEP CHRONO-ANCHOR)', col: '#4ade80' },
      { label: 'AUDIO SAMPLING:', val: '48.0 KHZ (32-BIT FLOAT WEBAUDIO)', col: '#fde68a' },
      { label: 'TOUCH MATRIX:', val: 'ACTIVE (360° JOYSTICK + 3 ACTION ARCS)', col: '#38bdf8' }
    ];

    diagItems.forEach((di, dIdx) => {
      const dy = diagY + 24 + dIdx * 15;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(di.label, rightBayX + 22, dy);

      ctx.fillStyle = di.col;
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(di.val, rightBayX + 115, dy);
    });

    // ─────────────────────────────────────────────────────────────
    // 4. BOTTOM BAR: KEYBOARD HINTS & CONSECRATE RETURN BUTTON
    // ─────────────────────────────────────────────────────────────
    const botY = panY + panH - 36;
    const retW = 200, retH = 26;
    const retX = panX + panW - 24 - retW;
    const isHoverRet = mouseX >= retX && mouseX <= retX + retW && mouseY >= botY && mouseY <= botY + retH;

    ctx.fillStyle = isHoverRet ? 'rgba(217, 119, 6, 0.35)' : 'rgba(30, 41, 59, 0.6)';
    ctx.strokeStyle = isHoverRet ? '#fde68a' : 'rgba(201, 168, 76, 0.55)';
    ctx.lineWidth = 1.2;
    drawChamferedPanel(ctx, retX, botY, retW, retH, 4, null, ctx.strokeStyle, ctx.lineWidth);
    ctx.fill();

    ctx.fillStyle = isHoverRet ? '#ffffff' : '#fde68a';
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('◈ CONSECRATE & RETURN [ ESC ]', retX + retW / 2, botY + retH / 2);

    ctx.fillStyle = 'rgba(148, 163, 184, 0.65)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Click / Drag Resonance Tracks    Hotkeys: [ M ] Mute  [ O / P ] Velocity    Esc — Return', panX + 26, botY + 13);

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
    const panW = 890, panH = 530;
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
