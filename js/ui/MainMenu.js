// =====================================================================
//  DUNGEON BREAK — js/ui/MainMenu.js
//  Dark-Fantasy Masterpiece Title Experience:
//  - Text-First Minimalist Menu with Subtle Runic Focus Markers
//  - Original Ornamental Dungeon Break Logo Treatment & Sigil
//  - Live Cinematic Environment with 5-Layer Parallax & Volumetric Depth
//  - Heroic Grounded Rowan with 5 Subtle Idle Variations (8-15s)
//  - Ambient Event Director & Staggered Cinematic Reveal
//  - Local Theme Music Integration (Cathedral of Deep Navy)
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, roundRect } from '../core/Constants.js';
import { AudioManager, SoundManager } from '../audio/AudioManager.js';
import { MusicManager } from '../audio/MusicManager.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { FloorManager } from '../world/FloorManager.js';
import { CinematicDirector } from '../cinematics/CinematicDirector.js';
import { triggerCinematicBanner } from './HUD.js';
import { InputManager } from '../core/InputManager.js';
import { UITransitionManager } from './UITransitionManager.js';
import { RunResetManager } from '../systems/RunResetManager.js';
import { Credits } from '../cinematics/Credits.js';
import { LastEmberCinematic } from '../cinematics/LastEmberCinematic.js';

let _titleBtns = [];
let _focusedIndex = 0;
let _lastHoveredIndex = -1;

// Phase 3 — The Last Ember Gift Modal State
let _giftModalOpen = false;
let _giftModalChecked = false;
let _giftModalBtns = [];

// Ambient Environmental Event Director
let _menuAmbientTimer = 11.0;
let _menuAmbientEvent = 'none';
let _menuAmbientEventTimer = 0;

// Rowan Idle Variations (8–15s cycle)
let _rowanIdleEvent = 'none';
let _rowanIdleTimer = 0;
let _nextIdleTimer = 10.0;

let _TITLE_ANIM_T = 0;
let _revealTimer = 0;
let _howToPlayActive = false;
let _fieldGuideChapter = 0; // 0: Arsenal, 1: Footwork, 2: Sanity, 3: Rally, 4: Bosses
let _returnGoldenWash = 0;

function wrapTextLines(ctx, text, maxWidth) {
  if (!text) return [];
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = current ? current + ' ' + word : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      current = testLine;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// Persistent atmospheric particles
let _sparkParticles = [];
let _fogBlobs = [];
let _gatewayParticles = [];

function initMenuParticles() {
  if (_sparkParticles.length === 0) {
    for (let i = 0; i < 48; i++) {
      _sparkParticles.push({
        x: Math.random() * LW,
        y: Math.random() * LH,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -0.25 - Math.random() * 0.55,
        size: 0.8 + Math.random() * 2.2,
        alpha: 0.15 + Math.random() * 0.55,
        type: Math.random() < 0.65 ? 'ember' : 'abyss',
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  if (_fogBlobs.length === 0) {
    for (let i = 0; i < 16; i++) {
      _fogBlobs.push({
        x: Math.random() * (LW + 200) - 100,
        y: LH - 130 + Math.random() * 90,
        vx: 0.12 + Math.random() * 0.22,
        r: 80 + Math.random() * 100,
        alpha: 0.12 + Math.random() * 0.18,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  if (_gatewayParticles.length === 0) {
    for (let i = 0; i < 22; i++) {
      _gatewayParticles.push({
        angle: Math.random() * Math.PI * 2,
        dist: 32 + Math.random() * 58,
        speed: 0.35 + Math.random() * 0.5,
        r: 1.0 + Math.random() * 1.5,
        alpha: 0.25 + Math.random() * 0.55,
        col: Math.random() < 0.65 ? '#38bdf8' : '#c084fc'
      });
    }
  }
}

// Procedural Dark-Fantasy Field Manual Pixel Sigils (Zero Emojis)
function drawSurvivalSigil(ctx, type, cx, cy) {
  ctx.save();
  if (type === 'combat') {
    // Crossed Broadswords (pixel steel & gold quillons)
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 10); ctx.lineTo(cx + 10, cy + 10);
    ctx.moveTo(cx + 10, cy - 10); ctx.lineTo(cx - 10, cy + 10);
    ctx.stroke();
    // Gold crossguards
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy + 3); ctx.lineTo(cx - 3, cy + 7);
    ctx.moveTo(cx + 7, cy + 3); ctx.lineTo(cx + 3, cy + 7);
    ctx.stroke();
    // Gold pommels
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(cx - 9, cy + 9, 2, 0, Math.PI * 2);
    ctx.arc(cx + 9, cy + 9, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'evasion') {
    // Winged Sabaton / Swift Wind Dart
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy + 4);
    ctx.lineTo(cx + 6, cy + 4);
    ctx.lineTo(cx + 10, cy);
    ctx.lineTo(cx + 6, cy - 4);
    ctx.lineTo(cx - 4, cy - 4);
    ctx.closePath();
    ctx.stroke();
    // Swift wing plumes
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy - 5); ctx.lineTo(cx - 10, cy - 10);
    ctx.moveTo(cx, cy - 5); ctx.lineTo(cx - 6, cy - 11);
    ctx.stroke();
  } else if (type === 'sanity') {
    // Occult Eye of Void & Radiant Diamond
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 10); ctx.lineTo(cx + 10, cy);
    ctx.lineTo(cx, cy + 10); ctx.lineTo(cx - 10, cy);
    ctx.closePath();
    ctx.stroke();
    // Amethyst pupil
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 1, cy - 1, 1.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'rally') {
    // Living Vitality Blood Droplet
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 9);
    ctx.quadraticCurveTo(cx + 8, cy - 1, cx + 8, cy + 4);
    ctx.arc(cx, cy + 4, 8, 0, Math.PI, false);
    ctx.quadraticCurveTo(cx - 8, cy - 1, cx, cy - 9);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Highlight fleck
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.ellipse(cx - 3, cy + 2, 2, 4, -0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'bosses') {
    // Ancient Crown with 3 Spired Crests
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy + 7);
    ctx.lineTo(cx + 10, cy + 7);
    ctx.lineTo(cx + 9, cy - 4);
    ctx.lineTo(cx + 4, cy + 1);
    ctx.lineTo(cx, cy - 8);
    ctx.lineTo(cx - 4, cy + 1);
    ctx.lineTo(cx - 9, cy - 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Ruby jewels
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(cx - 1, cy + 2, 2, 2);
    ctx.fillRect(cx - 6, cy + 2, 2, 2);
    ctx.fillRect(cx + 4, cy + 2, 2, 2);
  }
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────
// Symmetrical Ornamental Title Divider & Abyss Sigil
// ─────────────────────────────────────────────────────────────
function drawTitleOrnament(ctx, x, y, width, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;

  const half = width / 2;
  const cx = x + half;
  const cy = y;

  ctx.strokeStyle = 'rgba(217, 119, 6, 0.75)';
  ctx.lineWidth = 1.2;

  // Left wing
  ctx.beginPath();
  ctx.moveTo(cx - 18, cy);
  ctx.bezierCurveTo(cx - 50, cy - 3, cx - 90, cy + 4, cx - 130, cy);
  ctx.bezierCurveTo(cx - 145, cy - 2, cx - 155, cy - 8, cx - 165, cy - 4);
  ctx.stroke();

  // Left spiral curl
  ctx.beginPath();
  ctx.arc(cx - 165, cy - 2, 2.5, 0, Math.PI * 2);
  ctx.stroke();

  // Left diamond accent
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.moveTo(cx - 85, cy - 3);
  ctx.lineTo(cx - 81, cy);
  ctx.lineTo(cx - 85, cy + 3);
  ctx.lineTo(cx - 89, cy);
  ctx.closePath();
  ctx.fill();

  // Right wing (symmetrical)
  ctx.beginPath();
  ctx.moveTo(cx + 18, cy);
  ctx.bezierCurveTo(cx + 50, cy - 3, cx + 90, cy + 4, cx + 130, cy);
  ctx.bezierCurveTo(cx + 145, cy - 2, cx + 155, cy - 8, cx + 165, cy - 4);
  ctx.stroke();

  // Right spiral curl
  ctx.beginPath();
  ctx.arc(cx + 165, cy - 2, 2.5, 0, Math.PI * 2);
  ctx.stroke();

  // Right diamond accent
  ctx.beginPath();
  ctx.moveTo(cx + 85, cy - 3);
  ctx.lineTo(cx + 89, cy);
  ctx.lineTo(cx + 85, cy + 3);
  ctx.lineTo(cx + 81, cy);
  ctx.closePath();
  ctx.fill();

  // Center Ancient Abyss Sigil
  const sigilGlow = Math.sin(GameState.F * 0.06) * 4 + 10;
  ctx.shadowColor = '#a855f7';
  ctx.shadowBlur = sigilGlow;

  // Outer gold diamond
  ctx.strokeStyle = '#fde68a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 10);
  ctx.lineTo(cx + 10, cy);
  ctx.lineTo(cx, cy + 10);
  ctx.lineTo(cx - 10, cy);
  ctx.closePath();
  ctx.stroke();

  // Inner purple abyss jewel
  ctx.fillStyle = '#c084fc';
  ctx.beginPath();
  ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────
// Game Start & Run Resume Dispatches
// ─────────────────────────────────────────────────────────────
export function startGame(playIntro = true) {
  AudioManager.init();
  MusicManager.fadeOut(1.2);
  SoundManager.snd('menu_select');
  _howToPlayActive = false;

  UITransitionManager.transitionTo(() => {
    RunResetManager.resetRun({ playIntro });
  }, 0.45);
}

export function openTrainingDungeon() {
  AudioManager.init();
  SoundManager.snd('panel_open');
  _howToPlayActive = true;
}

export function resumeSavedRun() {
  const sv = SaveSystem.loadRun();
  if (sv && sv.lv) {
    AudioManager.init();
    MusicManager.fadeOut(1.2);
    SoundManager.snd('menu_select');
    _howToPlayActive = false;

    UITransitionManager.transitionTo(() => {
      GameState.CINEMATIC_ACTIVE = false;
      GameState.resetPlayer();
      GameState.LV = sv.lv || 1;
      if (sv.hp !== undefined) GameState.P.hp = sv.hp;
      if (sv.maxHp !== undefined) GameState.P.maxHp = sv.maxHp;
      if (sv.san !== undefined) GameState.P.san = sv.san;
      if (sv.wep) GameState.P.wep = sv.wep;
      if (sv.saved !== undefined) GameState.P.saved = sv.saved;
      if (sv.killed !== undefined) GameState.P.killed = sv.killed;
      if (sv.weaponSlots) GameState.weaponSlots = sv.weaponSlots;
      if (sv.activeSlot !== undefined) GameState.activeWeaponSlot = sv.activeSlot;
      if (sv.relics) GameState.P.relics = sv.relics;
      FloorManager.loadLevel(GameState.LV);
      GameState.setState(GameStates.PLAYING);
      SoundManager.snd('portal_enter');
      triggerCinematicBanner(`FLOOR ${GameState.LV}`, 'Resuming your harrowing descent...');
    }, 0.45);
    return true;
  }
  SoundManager.snd('error_disabled');
  return false;
}

export const MainMenu = {
  navigateFocus(delta) {
    if (_giftModalOpen) return;
    if (_howToPlayActive) {
      _fieldGuideChapter = (_fieldGuideChapter + delta + 5) % 5;
      SoundManager.snd('menu_hover');
      return;
    }
    if (_titleBtns.length === 0) return;
    const oldIdx = _focusedIndex;
    _focusedIndex = (_focusedIndex + delta + _titleBtns.length) % _titleBtns.length;
    if (_focusedIndex !== oldIdx) {
      SoundManager.snd('menu_hover');
    }
  },

  activateFocused() {
    if (_giftModalOpen) {
      _giftModalOpen = false;
      SaveSystem.dismissPhase3Invitation();
      SoundManager.snd('menu_select');
      LastEmberCinematic.start('invitation');
      return;
    }
    if (_howToPlayActive) {
      SoundManager.snd('menu_select');
      startGame();
      return;
    }
    if (_titleBtns[_focusedIndex] && _titleBtns[_focusedIndex].action) {
      if (_titleBtns[_focusedIndex].disabled) {
        SoundManager.snd('error_disabled');
        return;
      }
      SoundManager.snd('menu_select');
      _titleBtns[_focusedIndex].action();
    }
  },

  handleEscape() {
    if (_giftModalOpen) {
      this.closeGiftModal();
      SoundManager.snd('panel_close');
      return true;
    }
    if (_howToPlayActive) {
      _howToPlayActive = false;
      SoundManager.snd('panel_close');
      return true;
    }
    return false;
  },

  draw(ctx, dt = 0.016) {
    initMenuParticles();
    _titleBtns = [];

    // Staggered reveal timeline
    _revealTimer += dt;
    _TITLE_ANIM_T = Math.min(_TITLE_ANIM_T + dt * 2.2, 1);

    if (_returnGoldenWash > 0) {
      _returnGoldenWash = Math.max(0, _returnGoldenWash - dt * 1.25);
    }
    if (_giftModalOpen) {
      const p = typeof document !== 'undefined' && document.getElementById('ending-debug-panel');
      if (p && p.style.display !== 'none') p.style.display = 'none';
    }

    // Ambient Environmental Events (every 8–15s)
    _menuAmbientTimer -= dt;
    if (_menuAmbientTimer <= 0) {
      _menuAmbientTimer = 8.5 + Math.random() * 7.0;
      const events = ['torch_flare', 'dust_fall', 'portal_pulse', 'shadow_pass', 'chain_sway', 'rune_flash'];
      _menuAmbientEvent = events[Math.floor(Math.random() * events.length)];
      _menuAmbientEventTimer = 2.8;
    }
    if (_menuAmbientEventTimer > 0) _menuAmbientEventTimer -= dt;

    // Rowan Idle Variations (every 8–15s)
    _nextIdleTimer -= dt;
    if (_nextIdleTimer <= 0) {
      _nextIdleTimer = 8.0 + Math.random() * 7.0;
      const idleVariations = ['portal_gaze', 'weapon_adjust', 'entrance_gaze', 'wind_burst', 'stance_shift'];
      _rowanIdleEvent = idleVariations[Math.floor(Math.random() * idleVariations.length)];
      _rowanIdleTimer = 3.2;
    }
    if (_rowanIdleTimer > 0) _rowanIdleTimer -= dt;

    const F = GameState.F || 0;

    // Cinematic Camera Breathing & Subtle Parallax Drift
    const camZoom = 1.0 + Math.sin(F * 0.014) * 0.012;
    const camDriftX = Math.sin(F * 0.011) * 4.5;
    const camDriftY = Math.cos(F * 0.013) * 2.5;

    // Staggered reveal opacity steps
    const envAlpha = Math.min(1, Math.max(0, (_revealTimer - 0.2) / 0.7));
    const torchAlpha = Math.min(1, Math.max(0, (_revealTimer - 0.6) / 0.7));
    const rowanAlpha = Math.min(1, Math.max(0, (_revealTimer - 0.9) / 0.75));
    const portalAlpha = Math.min(1, Math.max(0, (_revealTimer - 1.2) / 0.75));
    const logoAlpha = Math.min(1, Math.max(0, (_revealTimer - 1.6) / 0.8));
    const ornamentAlpha = Math.min(1, Math.max(0, (_revealTimer - 2.1) / 0.7));
    const btnsAlpha = Math.min(1, Math.max(0, (_revealTimer - 2.5) / 0.7));

    // ─────────────────────────────────────────────────────────────
    // 1. THE CATHEDRAL AT THE EDGE OF THE ABYSS (PARALLAX LAYER 1: 0.20X)
    // ─────────────────────────────────────────────────────────────
    ctx.save();
    ctx.globalAlpha = envAlpha;

    const pX1 = camDriftX * 0.20;
    const pY1 = camDriftY * 0.20;

    // Atmospheric Abyssal Deep Backdrop
    const bgGrad = ctx.createLinearGradient(0, 0, 0, LH);
    bgGrad.addColorStop(0, '#020308');
    bgGrad.addColorStop(0.3, '#050818');
    bgGrad.addColorStop(0.65, '#080e28');
    bgGrad.addColorStop(1, '#03050d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(-50, -50, LW + 100, LH + 100);

    // Vanishing Point of the Subterranean Cathedral Nave
    const vpX = 645 + pX1, vpY = 210 + pY1;

    // Receding Nave Perspective Floor Rays & Transverse Masonry
    ctx.save();
    ctx.strokeStyle = 'rgba(20, 28, 55, 0.45)';
    ctx.lineWidth = 1.0;
    for (let angle = -0.9; angle <= 0.9; angle += 0.22) {
      ctx.beginPath();
      ctx.moveTo(vpX, vpY + 40);
      ctx.lineTo(vpX + Math.tan(angle) * (LH - vpY), LH);
      ctx.stroke();
    }
    // Horizontal stone floor joints in geometric perspective
    for (let s = 1; s <= 7; s++) {
      const frac = Math.pow(s / 7, 2.0);
      const jy = vpY + 40 + frac * (LH - (vpY + 40));
      const jw = frac * 520;
      ctx.strokeStyle = `rgba(24, 34, 68, ${0.12 + frac * 0.35})`;
      ctx.beginPath();
      ctx.moveTo(vpX - jw, jy);
      ctx.lineTo(vpX + jw, jy);
      ctx.stroke();
    }
    ctx.restore();

    // Receding Gothic Vault Arch Ribs (Soaring Nave Ribs)
    ctx.save();
    for (let r = 6; r >= 1; r--) {
      const archScale = r / 6;
      const aw = 520 * archScale;
      const ah = 400 * archScale;
      const ay = vpY - ah * 0.48;
      const ribAlpha = 0.05 + (1 - archScale) * 0.16;

      // Outer rib shadow
      ctx.strokeStyle = `rgba(15, 23, 42, ${ribAlpha * 1.5})`;
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.moveTo(vpX - aw, LH);
      ctx.lineTo(vpX - aw, ay + ah * 0.4);
      ctx.quadraticCurveTo(vpX - aw * 0.58, ay, vpX, ay);
      ctx.quadraticCurveTo(vpX + aw * 0.58, ay, vpX + aw, ay + ah * 0.4);
      ctx.lineTo(vpX + aw, LH);
      ctx.stroke();

      // Inner stone highlight rib
      ctx.strokeStyle = `rgba(74, 96, 155, ${ribAlpha})`;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Ceiling vault spine ridge
      ctx.beginPath();
      ctx.moveTo(vpX, ay);
      ctx.lineTo(vpX, vpY);
      ctx.stroke();

      // Triforium gothic gallery arches in background niches
      if (r >= 3 && r <= 5) {
        ctx.fillStyle = `rgba(10, 16, 35, ${0.15 + (6 - r) * 0.08})`;
        ctx.strokeStyle = `rgba(40, 56, 100, ${0.12 + (6 - r) * 0.06})`;
        ctx.lineWidth = 1.0;
        const nw = aw * 0.22, nh = ah * 0.32;
        [-1, 1].forEach(side => {
          const nx = vpX + side * aw * 0.72 - nw / 2;
          const ny = ay + ah * 0.28;
          ctx.beginPath();
          ctx.moveTo(nx, ny + nh);
          ctx.lineTo(nx, ny + nh * 0.3);
          ctx.quadraticCurveTo(nx + nw / 2, ny, nx + nw, ny + nh * 0.3);
          ctx.lineTo(nx + nw, ny + nh);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        });
      }
    }
    ctx.restore();

    // ─────────────────────────────────────────────────────────────
    // 2. THE COLOSSAL DISTANT ABYSSAL GATEWAY (PARALLAX LAYER 2: 0.40X)
    // ─────────────────────────────────────────────────────────────
    const pX2 = camDriftX * 0.40;
    const pY2 = camDriftY * 0.40;
    const portPulse = Math.sin(F * 0.035) * 0.12 + 0.88;
    const portExtra = (_menuAmbientEvent === 'portal_pulse' && _menuAmbientEventTimer > 0)
      ? Math.sin((_menuAmbientEventTimer / 2.8) * Math.PI) * 24
      : 0;
    const portR = (48 + portExtra) * portPulse;
    const portX = 645 + pX2, portY = 210 + pY2;

    ctx.save();
    ctx.globalAlpha = portalAlpha;

    // Distant cyclopean stone arch framing the gateway
    ctx.save();
    const archW = portR * 1.65;
    const archH = portR * 2.2;
    // Left & Right Megalithic Obsidian Pillars
    [-1, 1].forEach(side => {
      const px = portX + side * archW - (side > 0 ? 0 : 20);
      const py = portY - archH * 0.48;
      const pw = 20, ph = archH * 1.35;
      const pilGrad = ctx.createLinearGradient(px, 0, px + pw, 0);
      pilGrad.addColorStop(0, '#04060c');
      pilGrad.addColorStop(0.5, '#0d1326');
      pilGrad.addColorStop(1, '#050711');
      ctx.fillStyle = pilGrad;
      ctx.fillRect(px, py, pw, ph);

      // Capital & plinth
      ctx.fillStyle = '#161e36';
      ctx.fillRect(px - 3, py - 4, pw + 6, 8);
      ctx.fillRect(px - 3, py + ph - 8, pw + 6, 12);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px - 3, py - 4, pw + 6, 8);

      // Inlaid abyssal runes down the monolith
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1.0;
      for (let k = 0; k < 3; k++) {
        const ry = py + 24 + k * 36;
        ctx.beginPath();
        ctx.moveTo(px + 4, ry); ctx.lineTo(px + pw - 4, ry + 6);
        ctx.lineTo(px + 6, ry + 14);
        ctx.stroke();
      }
    });

    // Lintel stone arch connecting monoliths
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(portX, portY - 8, archW + 6, Math.PI, 0, false);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Radiant outer abyssal nebula glow
    const portNebula = ctx.createRadialGradient(portX, portY, 4, portX, portY, portR * 3.0);
    portNebula.addColorStop(0, 'rgba(56, 189, 248, 0.80)');
    portNebula.addColorStop(0.22, 'rgba(168, 85, 247, 0.55)');
    portNebula.addColorStop(0.6, 'rgba(15, 23, 65, 0.30)');
    portNebula.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = portNebula;
    ctx.beginPath();
    ctx.arc(portX, portY, portR * 3.0, 0, Math.PI * 2);
    ctx.fill();

    // Downward ambient light reflection on floor beneath gateway
    const floorRefl = ctx.createRadialGradient(portX, LH - 60, 10, portX, LH - 60, portR * 2.5);
    floorRefl.addColorStop(0, 'rgba(168, 85, 247, 0.18)');
    floorRefl.addColorStop(0.5, 'rgba(56, 189, 248, 0.08)');
    floorRefl.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = floorRefl;
    ctx.beginPath();
    ctx.ellipse(portX, LH - 60, portR * 2.2, 35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Swirling Inward Accretion Rings & Runic Glyphs
    ctx.save();
    ctx.translate(portX, portY);

    // Outer runic accretion ring (Counter-clockwise)
    ctx.save();
    ctx.rotate(F * 0.022);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.70)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, portR, 0, Math.PI * 1.65);
    ctx.stroke();

    // Runic tick marks along outer ring
    for (let a = 0; a < 8; a++) {
      const ang = (a / 8) * Math.PI * 2;
      const cosA = Math.cos(ang), sinA = Math.sin(ang);
      ctx.strokeStyle = (a % 2 === 0) ? '#fde68a' : '#7dd3fc';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cosA * (portR - 4), sinA * (portR - 4));
      ctx.lineTo(cosA * (portR + 4), sinA * (portR + 4));
      ctx.stroke();
    }
    ctx.restore();

    // Secondary counter-rotating purple glyph ring
    ctx.save();
    ctx.rotate(-F * 0.045);
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.75)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, portR * 0.72, 0, Math.PI * 1.45);
    ctx.stroke();

    // Inner diamond glyph nodes
    for (let b = 0; b < 4; b++) {
      const bang = (b / 4) * Math.PI * 2;
      const bx = Math.cos(bang) * (portR * 0.72);
      const by = Math.sin(bang) * (portR * 0.72);
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(bx, by, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Inward Converging Accretion Particles
    if (_gatewayParticles && _gatewayParticles.length > 0) {
      _gatewayParticles.forEach(gp => {
        gp.dist -= gp.speed;
        gp.angle += 0.018;
        if (gp.dist < 8) {
          gp.dist = portR * 1.4 + Math.random() * 20;
          gp.angle = Math.random() * Math.PI * 2;
        }
        const gpx = Math.cos(gp.angle) * gp.dist;
        const gpy = Math.sin(gp.angle) * gp.dist;
        const gpa = gp.alpha * Math.min(1, gp.dist / 14);
        ctx.fillStyle = gp.col === '#38bdf8' ? `rgba(56, 189, 248, ${gpa})` : `rgba(192, 132, 252, ${gpa})`;
        ctx.beginPath();
        ctx.arc(gpx, gpy, gp.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Core black hole singularity event horizon
    ctx.fillStyle = '#010206';
    ctx.beginPath();
    ctx.arc(0, 0, portR * 0.40, 0, Math.PI * 2);
    ctx.fill();

    // Radiant inner singularity spark
    const corePulse = Math.sin(F * 0.09) * 0.35 + 0.65;
    ctx.fillStyle = `rgba(224, 242, 254, ${corePulse})`;
    ctx.beginPath();
    ctx.arc(0, 0, 4.8 * corePulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore(); // restore portal translation

    // Distant Passing Shadow Creature
    if (_menuAmbientEvent === 'shadow_pass' && _menuAmbientEventTimer > 0) {
      const st = 1 - (_menuAmbientEventTimer / 2.8);
      const sx = 520 + st * 280;
      const sy = vpY + Math.sin(st * Math.PI) * -18 + 12;
      ctx.save();
      ctx.fillStyle = 'rgba(2, 3, 8, 0.75)';
      ctx.beginPath();
      ctx.ellipse(sx, sy, 18, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sx - 16, sy);
      ctx.quadraticCurveTo(sx - 28, sy - 14, sx - 38, sy - 6);
      ctx.quadraticCurveTo(sx - 22, sy + 6, sx - 12, sy + 4);
      ctx.moveTo(sx + 16, sy);
      ctx.quadraticCurveTo(sx + 28, sy - 14, sx + 38, sy - 6);
      ctx.quadraticCurveTo(sx + 22, sy + 6, sx + 12, sy + 4);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore(); // end portal layer

    // ─────────────────────────────────────────────────────────────
    // 3. RECEDING MONOLITHIC PILLARS (PARALLAX LAYER 3: 0.65X)
    // ─────────────────────────────────────────────────────────────
    const pX3 = camDriftX * 0.65;
    const pY3 = camDriftY * 0.65;

    const pillars = [
      { x: 375 + pX3, w: 40 },
      { x: 495 + pX3, w: 46 },
      { x: 790 + pX3, w: 48 },
      { x: 905 + pX3, w: 58 }
    ];

    pillars.forEach((p, idx) => {
      // Monumental Stone Pillar Base Shading
      const pilGrad = ctx.createLinearGradient(p.x, 0, p.x + p.w, 0);
      pilGrad.addColorStop(0, '#070a16');
      pilGrad.addColorStop(0.18, '#141a2e');
      pilGrad.addColorStop(0.5, '#1e2844');
      pilGrad.addColorStop(0.82, '#13182b');
      pilGrad.addColorStop(1, '#050711');
      ctx.fillStyle = pilGrad;
      ctx.fillRect(p.x, 0, p.w, LH);

      // Horizontal masonry block seams (blocks stacked every 48px)
      ctx.strokeStyle = 'rgba(5, 7, 15, 0.85)';
      ctx.lineWidth = 1.0;
      for (let by = 24; by < LH - 130; by += 48) {
        ctx.beginPath();
        ctx.moveTo(p.x, by);
        ctx.lineTo(p.x + p.w, by);
        ctx.stroke();
      }

      // Vertical Stone Fluting Lines
      ctx.lineWidth = 1.0;
      const flutes = 3;
      for (let f = 1; f <= flutes; f++) {
        const fx = p.x + (p.w / (flutes + 1)) * f;
        ctx.strokeStyle = 'rgba(4, 6, 14, 0.9)';
        ctx.beginPath(); ctx.moveTo(fx, 0); ctx.lineTo(fx, LH); ctx.stroke();
        ctx.strokeStyle = 'rgba(100, 116, 155, 0.28)';
        ctx.beginPath(); ctx.moveTo(fx + 1, 0); ctx.lineTo(fx + 1, LH); ctx.stroke();
      }

      // Stone Capital & Plinth Bands
      ctx.fillStyle = '#0f1426';
      ctx.fillRect(p.x - 4, 0, p.w + 8, 26);
      ctx.fillRect(p.x - 5, LH - 130, p.w + 10, 22);

      // Gold-embossed architectural trim
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(p.x - 4, 0, p.w + 8, 26);
      ctx.strokeRect(p.x - 5, LH - 130, p.w + 10, 22);

      // Chipped stone cracks & gold/cyan runic vein
      ctx.strokeStyle = (_menuAmbientEvent === 'rune_flash' && _menuAmbientEventTimer > 0)
        ? `rgba(56, 189, 248, ${Math.sin((_menuAmbientEventTimer / 2.8) * Math.PI) * 0.85})`
        : 'rgba(201, 168, 76, 0.22)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(p.x + 8, 115 + idx * 42);
      ctx.lineTo(p.x + 18, 142 + idx * 42);
      ctx.lineTo(p.x + 12, 172 + idx * 42);
      ctx.stroke();
    });

    // ─────────────────────────────────────────────────────────────
    // 4. ARTISANAL WALL BRAZIERS & DYNAMIC TORCHLIGHT
    // ─────────────────────────────────────────────────────────────
    ctx.save();
    ctx.globalAlpha = torchAlpha;
    const torches = [
      { x: 394 + pX3, y: 275 + pY3, phase: 0 },
      { x: 517 + pX3, y: 255 + pY3, phase: 1.6 },
      { x: 813 + pX3, y: 265 + pY3, phase: 3.1 }
    ];

    torches.forEach(tc => {
      const flare = (_menuAmbientEvent === 'torch_flare' && _menuAmbientEventTimer > 0)
        ? Math.sin((_menuAmbientEventTimer / 2.8) * Math.PI) * 0.7
        : 0;
      const flicker = Math.sin(F * 0.18 + tc.phase) * 0.12 + Math.cos(F * 0.27 + tc.phase) * 0.08 + 0.85 + flare;

      // Iron Bracket Mount with Riveted Straps
      ctx.fillStyle = '#181512';
      ctx.fillRect(tc.x - 4, tc.y + 4, 8, 18);
      ctx.fillStyle = '#26221f';
      ctx.beginPath();
      ctx.moveTo(tc.x - 8, tc.y + 2);
      ctx.lineTo(tc.x + 8, tc.y + 2);
      ctx.lineTo(tc.x + 5, tc.y + 11);
      ctx.lineTo(tc.x - 5, tc.y + 11);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(tc.x - 1, tc.y + 5, 2, 2); // Brass rivet

      // Radial Torch Warm Light Cast
      const lightR = 76 * flicker;
      const tg = ctx.createRadialGradient(tc.x, tc.y - 4, 2, tc.x, tc.y - 4, lightR);
      tg.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
      tg.addColorStop(0.28, 'rgba(249, 115, 22, 0.44)');
      tg.addColorStop(0.68, 'rgba(180, 83, 9, 0.16)');
      tg.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = tg;
      ctx.beginPath();
      ctx.arc(tc.x, tc.y - 4, lightR, 0, Math.PI * 2);
      ctx.fill();

      // Multi-stage Torch Flame (Teardrop Layers)
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.ellipse(tc.x, tc.y - 6, 5.8 * flicker, 10.5 * flicker, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(tc.x, tc.y - 5, 4.2 * flicker, 8.0 * flicker, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(tc.x, tc.y - 4, 2.8 * flicker, 5.5 * flicker, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(tc.x, tc.y - 3, 1.4 * flicker, 3.0 * flicker, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // ─────────────────────────────────────────────────────────────
    // 5. STEPPED STONE DAIS & ROWAN (PARALLAX LAYER 5: 1.0X)
    // ─────────────────────────────────────────────────────────────
    const pX4 = camDriftX * 1.0;
    const pY4 = camDriftY * 1.0;

    const daisX = 340 + pX4, daisY = LH - 82 + pY4;
    // Step 1: Base Tier
    const step1Grad = ctx.createLinearGradient(daisX, daisY, daisX, LH);
    step1Grad.addColorStop(0, '#101524');
    step1Grad.addColorStop(1, '#070912');
    ctx.fillStyle = step1Grad;
    ctx.fillRect(daisX, daisY, LW - daisX, 82);
    ctx.fillStyle = '#202944';
    ctx.fillRect(daisX, daisY, LW - daisX, 3);

    // Step 2: Elevated Dais Platform
    const step2Grad = ctx.createLinearGradient(daisX + 85, daisY - 28, daisX + 85, daisY);
    step2Grad.addColorStop(0, '#182036');
    step2Grad.addColorStop(1, '#0c101d');
    ctx.fillStyle = step2Grad;
    ctx.fillRect(daisX + 85, daisY - 28, LW - (daisX + 85), 110);
    ctx.fillStyle = '#334166';
    ctx.fillRect(daisX + 85, daisY - 28, LW - (daisX + 85), 3);

    // Weathered flagstone joints on dais
    ctx.strokeStyle = 'rgba(7, 10, 20, 0.9)';
    ctx.lineWidth = 1.6;
    for (let s = daisX + 115; s < LW; s += 80) {
      ctx.beginPath();
      ctx.moveTo(s, daisY - 28);
      ctx.lineTo(s + 14, LH);
      ctx.stroke();
    }

    // FOREGROUND ROWAN (HEROIC GROUNDED PIXEL-ART CHARACTER — 1.70X)
    ctx.save();
    ctx.globalAlpha = rowanAlpha;

    const rowanScale = 1.70;
    const rBaseX = 665 + pX4;
    const rBaseY = LH - 110 + pY4;

    // Rowan idle breath & cloak sway
    let rBreath = Math.sin(F * 0.04) * 2.2;
    let rCloakSway = Math.sin(F * 0.032) * 3.8;
    let headTilt = 0;
    let swordFlare = 1.0;
    let stanceOffset = 0;

    // Apply Idle Event Modifiers
    if (_rowanIdleTimer > 0) {
      const itProgress = Math.sin((_rowanIdleTimer / 3.2) * Math.PI);
      if (_rowanIdleEvent === 'portal_gaze') {
        headTilt = 0.18 * itProgress; // Turns helm toward portal
      } else if (_rowanIdleEvent === 'entrance_gaze') {
        headTilt = -0.22 * itProgress; // Turns helm toward entrance
      } else if (_rowanIdleEvent === 'wind_burst') {
        rCloakSway += Math.sin(F * 0.1) * 8.0 * itProgress; // Cloak billows
      } else if (_rowanIdleEvent === 'weapon_adjust') {
        swordFlare = 1.0 + 1.2 * itProgress; // Fuller runes flare brightly
      } else if (_rowanIdleEvent === 'stance_shift') {
        stanceOffset = Math.sin((_rowanIdleTimer / 3.2) * Math.PI) * 2.0;
      }
    }

    ctx.save();
    ctx.translate(rBaseX + stanceOffset, rBaseY);
    ctx.scale(rowanScale, rowanScale);

    // Ancient Runic Ward Circle under Rowan's feet
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 22, 34, 11, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 22, 25, 8.0, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Directional Ground Cast Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.beginPath();
    ctx.ellipse(8, 22, 28, 9.0, -0.12, 0, Math.PI * 2);
    ctx.fill();

    // Flowing Crimson Cloak (Back Layer)
    ctx.fillStyle = '#450a0a';
    ctx.beginPath();
    ctx.moveTo(-16, -20 + rBreath);
    ctx.quadraticCurveTo(-30 + rCloakSway, 6, -24 + rCloakSway * 1.2, 24);
    ctx.lineTo(20, 24);
    ctx.quadraticCurveTo(24 - rCloakSway, 6, 16, -20 + rBreath);
    ctx.closePath();
    ctx.fill();

    // Inner cloak shadow folds
    ctx.fillStyle = '#260404';
    ctx.beginPath();
    ctx.moveTo(-10, -14 + rBreath);
    ctx.quadraticCurveTo(-18 + rCloakSway, 8, -12 + rCloakSway, 24);
    ctx.lineTo(12, 24);
    ctx.quadraticCurveTo(14 - rCloakSway, 8, 10, -14 + rBreath);
    ctx.closePath();
    ctx.fill();

    // Armored Greaves & Sabatons
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-11, 4, 8, 18);
    ctx.fillRect(3, 4, 8, 18);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-10, 5, 4, 16);
    ctx.fillRect(4, 5, 4, 16);

    // Armored Cuirass (Breastplate)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-14, -18 + rBreath, 28, 24);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-11, -16 + rBreath, 22, 11);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-14, 2 + rBreath, 28, 3);
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(-3, -2 + rBreath, 6, 8);
    ctx.fillRect(-6, 0 + rBreath, 12, 3);

    // Layered Steel Pauldrons
    [-1, 1].forEach(side => {
      const px = side * 15;
      const py = -16 + rBreath;
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(px, py, 7.5, 9, side * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(px - 1.5, py - 4, 3, 2.5);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(side * 10, -18 + rBreath, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Visored Great Helm with Head-Tilt Rotation
    ctx.save();
    ctx.translate(0, -32 + rBreath);
    ctx.rotate(headTilt);

    ctx.fillStyle = '#0f172a';
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-10, 1, 20, 7);
    ctx.fillStyle = '#475569';
    ctx.fillRect(-9, -4, 18, 4);

    // Glowing Cyan Visor Slit
    const visorGlow = Math.sin(F * 0.08) * 0.25 + 0.75;
    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12 * visorGlow;
    ctx.fillStyle = '#7dd3fc';
    ctx.fillRect(-7, 1, 14, 3);
    ctx.restore();
    ctx.restore(); // restore helm

    // Planted Greatsword
    const swX = 0, swY = -10 + rBreath;
    ctx.save();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.moveTo(swX, swY);
    ctx.lineTo(swX, swY + 38);
    ctx.stroke();

    // Runic Fuller (Cyan Inscription down the center)
    const swordPulse = (Math.sin(F * 0.07) * 0.3 + 0.7) * swordFlare;
    ctx.strokeStyle = `rgba(56, 189, 248, ${Math.min(1, swordPulse)})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(swX, swY + 4);
    ctx.lineTo(swX, swY + 32);
    ctx.stroke();

    // Crossguard & Pommel
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(swX - 14, swY - 4);
    ctx.lineTo(swX + 14, swY - 4);
    ctx.lineTo(swX + 16, swY + 2);
    ctx.lineTo(swX - 16, swY + 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath(); ctx.arc(swX - 14, swY - 2, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(swX + 14, swY - 2, 2.5, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#334155';
    ctx.fillRect(swX - 2, swY - 14, 4, 11);
    ctx.fillStyle = '#fde68a';
    ctx.beginPath(); ctx.arc(swX, swY - 16, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath(); ctx.arc(swX, swY - 16, 1.8, 0, Math.PI * 2); ctx.fill();

    // Gauntlets resting on the pommel
    ctx.fillStyle = '#334155';
    ctx.fillRect(swX - 7, swY - 18, 14, 6);
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(swX - 7, swY - 15, 14, 1.8);
    ctx.restore();

    ctx.restore(); // restore Rowan scale
    ctx.restore(); // restore rowan alpha

    // ─────────────────────────────────────────────────────────────
    // 6. FOREGROUND CHAINS, ROLLING FOG & ASH (PARALLAX LAYER 6: 1.35X)
    // ─────────────────────────────────────────────────────────────
    const pX5 = camDriftX * 1.35;

    // Swaying Iron Chains from High Vaults
    const chains = [
      { x: 440 + pX5, len: 170, phase: 0 },
      { x: 565 + pX5, len: 205, phase: 1.3 },
      { x: 745 + pX5, len: 180, phase: 2.2 }
    ];

    chains.forEach(ch => {
      const flareSway = (_menuAmbientEvent === 'chain_sway' && _menuAmbientEventTimer > 0)
        ? Math.sin((_menuAmbientEventTimer / 2.8) * Math.PI * 4) * 5
        : 0;
      const sway = Math.sin(F * 0.024 + ch.phase) * 7 + flareSway;
      ctx.strokeStyle = 'rgba(24, 30, 48, 0.9)';
      ctx.lineWidth = 3.8;
      ctx.beginPath();
      ctx.moveTo(ch.x, 0);
      ctx.quadraticCurveTo(ch.x + sway * 0.45, ch.len * 0.55, ch.x + sway, ch.len);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(100, 116, 139, 0.38)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(ch.x + 1, 0);
      ctx.quadraticCurveTo(ch.x + sway * 0.45 + 1, ch.len * 0.55, ch.x + sway + 1, ch.len);
      ctx.stroke();

      // Heavy Iron Weight / Shackle
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(ch.x + sway, ch.len + 6, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.35)';
      ctx.stroke();
    });

    // Rolling Ground Fog
    _fogBlobs.forEach(b => {
      b.x += b.vx;
      if (b.x > LW + b.r) b.x = -b.r;
      const fgPulse = b.alpha * (Math.sin(F * 0.02 + b.phase) * 0.25 + 0.75);
      const fgGrad = ctx.createRadialGradient(b.x, b.y, b.r * 0.1, b.x, b.y, b.r);
      fgGrad.addColorStop(0, `rgba(15, 23, 42, ${fgPulse})`);
      fgGrad.addColorStop(0.6, `rgba(10, 15, 30, ${fgPulse * 0.6})`);
      fgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = fgGrad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Atmospheric Ash & Embers
    _sparkParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10) { p.y = LH + 10; p.x = Math.random() * LW; }
      if (p.x < -10) p.x = LW + 10;
      if (p.x > LW + 10) p.x = -10;

      const alphaPulse = p.alpha * (Math.sin(F * 0.06 + p.phase) * 0.35 + 0.65);
      ctx.fillStyle = p.type === 'ember'
        ? `rgba(253, 230, 138, ${alphaPulse})`
        : `rgba(192, 132, 252, ${alphaPulse * 0.8})`;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore(); // restore environment alpha

    // ─────────────────────────────────────────────────────────────
    // 6. LEFT-ALIGNED ORIGINAL "DUNGEON BREAK" TITLE & ORNAMENTS
    // ─────────────────────────────────────────────────────────────
    const leftX = 72;

    ctx.save();
    ctx.globalAlpha = logoAlpha;

    const titleGlow = Math.sin(F * 0.05) * 6 + 18;

    // 1. Chiseled Drop Shadow
    ctx.fillStyle = '#010206';
    ctx.font = '900 48px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('DUNGEON', leftX + 2.5, 96 + 2.5);
    ctx.fillText('BREAK', leftX + 2.5, 144 + 2.5);

    // 2. Luminous Ambient Glow
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = titleGlow;

    // 3. Metallic Gold Vertical Gradient Fill for DUNGEON
    const goldGrad1 = ctx.createLinearGradient(leftX, 55, leftX, 98);
    goldGrad1.addColorStop(0, '#fffdf0');
    goldGrad1.addColorStop(0.25, '#fde68a');
    goldGrad1.addColorStop(0.55, '#f59e0b');
    goldGrad1.addColorStop(0.85, '#b45309');
    goldGrad1.addColorStop(1, '#78350f');
    ctx.fillStyle = goldGrad1;
    ctx.fillText('DUNGEON', leftX, 96);

    // Metallic Gold Vertical Gradient Fill for BREAK
    const goldGrad2 = ctx.createLinearGradient(leftX, 105, leftX, 148);
    goldGrad2.addColorStop(0, '#fffdf0');
    goldGrad2.addColorStop(0.25, '#fde68a');
    goldGrad2.addColorStop(0.55, '#f59e0b');
    goldGrad2.addColorStop(0.85, '#b45309');
    goldGrad2.addColorStop(1, '#78350f');
    ctx.fillStyle = goldGrad2;
    ctx.fillText('BREAK', leftX, 144);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 8;
    ctx.fillText('✧  ABYSS ASCENSION EDITION  ✧', leftX + 2, 170);
    ctx.shadowBlur = 0;
    ctx.restore();

    // Symmetrical Ornamental Line under Title
    drawTitleOrnament(ctx, leftX - 10, 192, 280, ornamentAlpha);

    // ─────────────────────────────────────────────────────────────
    // 7. TEXT-FIRST DARK-FANTASY MENU SYSTEM (NO GIANT BOXES)
    // ─────────────────────────────────────────────────────────────
    const sv = SaveSystem.loadRun();
    const hasSave = !!(sv && sv.lv);

    const btnConfigs = [
      {
        id: 'play',
        label: 'START JOURNEY',
        primary: true,
        action: () => startGame()
      },
      {
        id: 'continue',
        label: 'CONTINUE',
        sub: hasSave ? `Floor ${sv.lv} · [ R ]` : null,
        primary: false,
        disabled: !hasSave,
        action: () => { if (hasSave) resumeSavedRun(); }
      },
      {
        id: 'guide',
        label: 'SURVIVAL GUIDE',
        primary: false,
        action: openTrainingDungeon
      },
      {
        id: 'sanctum',
        label: 'ABYSS SANCTUM',
        primary: false,
        action: () => GameState.setState(GameStates.SANCTUM)
      },
      {
        id: 'codex',
        label: 'CODEX & BESTIARY',
        primary: false,
        action: () => GameState.setState(GameStates.CODEX)
      },
      {
        id: 'achievements',
        label: 'ACHIEVEMENTS',
        primary: false,
        action: () => GameState.setState(GameStates.ACHIEVEMENTS)
      },
      {
        id: 'settings',
        label: 'SETTINGS',
        primary: false,
        action: () => GameState.setState(GameStates.SETTINGS)
      },
      {
        id: 'credits',
        label: 'VIEW CREDITS',
        primary: false,
        action: () => Credits.start('menu')
      }
    ];

    if (SaveSystem.isPhase3GiftEligible()) {
      btnConfigs.push({
        id: 'the_last_ember',
        label: 'THE LAST EMBER',
        sub: 'A gift for the journey.',
        primary: false,
        isGift: true,
        action: () => {
          LastEmberCinematic.start('menu');
        }
      });
    }

    const hasGift = SaveSystem.isPhase3GiftEligible();
    const btnW = 270;
    const btnH = hasGift ? 26.5 : 29;
    const btnStartY = hasGift ? 196 : 202;
    const btnGap = hasGift ? 5.5 : 6.5;

    const mouseX = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.mx : -999;
    const mouseY = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.my : -999;

    let hoveredIndex = -1;

    btnConfigs.forEach((cfg, idx) => {
      const by = btnStartY + idx * (btnH + btnGap);
      _titleBtns.push({
        id: cfg.id,
        x: leftX,
        y: by,
        w: btnW,
        h: btnH,
        disabled: cfg.disabled,
        action: cfg.action
      });

      if (mouseX >= leftX && mouseX <= leftX + btnW && mouseY >= by && mouseY <= by + btnH) {
        hoveredIndex = idx;
      }
    });

    if (hoveredIndex !== -1 && hoveredIndex !== _focusedIndex && !_howToPlayActive) {
      _focusedIndex = hoveredIndex;
      if (_lastHoveredIndex !== hoveredIndex) {
        SoundManager.snd('menu_hover');
        _lastHoveredIndex = hoveredIndex;
      }
    } else if (hoveredIndex === -1) {
      _lastHoveredIndex = -1;
    }

    // Render Text-First Menu Items
    btnConfigs.forEach((cfg, idx) => {
      const by = btnStartY + idx * (btnH + btnGap);
      const isFocused = (_focusedIndex === idx) && !_howToPlayActive;
      const isDisabled = !!cfg.disabled;

      // Staggered reveal timeline per option
      const delay = 2.4 + idx * 0.08;
      const progress = Math.max(0, Math.min(1, (_revealTimer - delay) / 0.32));
      const eased = 1 - Math.pow(1 - progress, 3);
      const slideX = leftX + (isFocused ? 6 : 0);
      const alpha = Math.max(0, eased) * btnsAlpha;

      ctx.save();
      ctx.globalAlpha = alpha;

      // Focused Indicator: Subtle Backplate, Left Accent & Animated Diamond Glyph ◈
      if (isFocused) {
        // Soft dark-slate focus backplate
        ctx.fillStyle = 'rgba(245, 158, 11, 0.09)';
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.38)';
        ctx.lineWidth = 1;
        roundRect(ctx, slideX - 22, by - 2, btnW + 10, btnH + 4, 4);
        ctx.fill();
        ctx.stroke();

        // Left antique gold accent bar
        ctx.fillStyle = '#fde68a';
        ctx.fillRect(slideX - 22, by + 2, 2.5, btnH - 4);

        const glyphPulse = Math.sin(F * 0.1) * 2 + 10;
        ctx.save();
        ctx.fillStyle = '#fde68a';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = glyphPulse;
        ctx.font = '13px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('◈', slideX - 11, by + btnH / 2);
        ctx.restore();
      }

      // Main Text Label
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      // Drop shadow for legibility over background
      ctx.fillStyle = '#010205';
      ctx.font = `bold ${isFocused ? 16 : 15}px Cinzel, serif`;
      ctx.fillText(cfg.label, slideX + 1.5, by + btnH / 2 + 1.5);

      if (isDisabled) {
        ctx.fillStyle = '#475569';
      } else if (isFocused) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = cfg.isGift ? '#f59e0b' : '#fef08a';
        ctx.shadowBlur = cfg.isGift ? 12 : 10;
      } else if (cfg.isGift) {
        ctx.fillStyle = '#fbbf24';
      } else if (cfg.primary) {
        ctx.fillStyle = '#fde68a';
      } else {
        ctx.fillStyle = '#cbd5e1';
      }
      ctx.fillText(cfg.label, slideX, by + btnH / 2);
      ctx.shadowBlur = 0;

      // Subtitle hint on right (measured accurately with Cinzel font)
      if (cfg.sub) {
        ctx.font = `bold ${isFocused ? 16 : 15}px Cinzel, serif`;
        const labelW = ctx.measureText(cfg.label).width;
        ctx.textAlign = 'left';
        ctx.font = 'italic 11px "Crimson Text", serif';
        ctx.fillStyle = isFocused ? '#fde68a' : (cfg.isGift ? '#fef3c7' : (isDisabled ? '#475569' : 'rgba(148, 163, 184, 0.55)'));
        ctx.fillText(cfg.sub, slideX + labelW + 16, by + btnH / 2 + 1);
      }

      // Subtle Illuminated Underline for Focused Item
      if (isFocused) {
        const underY = by + btnH - 3;
        const lineGrad = ctx.createLinearGradient(slideX - 20, underY, slideX + 220, underY);
        lineGrad.addColorStop(0, 'rgba(253, 230, 138, 0.9)');
        lineGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.6)');
        lineGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(slideX - 20, underY);
        ctx.lineTo(slideX + 200, underY);
        ctx.stroke();
      }

      ctx.restore();
    });

    // ─────────────────────────────────────────────────────────────
    // 8. FOOTER STATUS BAR & KEYBOARD CONTROLS LEGEND
    // ─────────────────────────────────────────────────────────────
    ctx.save();
    ctx.globalAlpha = btnsAlpha;

    ctx.fillStyle = 'rgba(192, 132, 252, 0.95)';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'left';
    const soulsStr = '◈ TOTAL SOULS: ' + (GameState.ABYSS_SOULS || 0);
    ctx.fillText(soulsStr, leftX + 4, LH - 38);
    const soulsW = ctx.measureText(soulsStr).width;
    drawSurvivalSigil(ctx, 'crown', leftX + 4 + soulsW + 20, LH - 42);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.95)';
    ctx.fillText('PRESTIGE: ' + (GameState.PRESTIGE_TOKENS || 0), leftX + 4 + soulsW + 34, LH - 38);

    ctx.fillStyle = 'rgba(148, 163, 184, 0.70)';
    ctx.font = '10px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.fillText('↑ / ↓ — Navigate    Enter / Space — Select    WASD — Move in-game    Esc — Pause', leftX + 4, LH - 18);
    ctx.restore();

    // ─────────────────────────────────────────────────────────────
    // 9. "SURVIVAL GUIDE" MODAL — THE VANGUARD'S FIELD MANUAL
    // ─────────────────────────────────────────────────────────────
    if (_howToPlayActive) {
      ctx.save();
      ctx.fillStyle = 'rgba(2, 4, 10, 0.90)';
      ctx.fillRect(0, 0, LW, LH);

      const mw = 830, mh = 506;
      const mx = Math.round((LW - mw) / 2), my = Math.round((LH - mh) / 2);

      // Deep grimoire folio slab
      ctx.fillStyle = 'rgba(7, 10, 22, 0.98)';
      roundRect(ctx, mx, my, mw, mh, 12);
      ctx.fill();

      // Weathered antique bronze & iron double-grooved border
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.75)';
      ctx.lineWidth = 1.8;
      roundRect(ctx, mx, my, mw, mh, 12);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
      ctx.lineWidth = 1;
      roundRect(ctx, mx + 5, my + 5, mw - 10, mh - 10, 9);
      ctx.stroke();

      // Corner brass rivets
      const rivets = [
        [mx + 12, my + 12], [mx + mw - 12, my + 12],
        [mx + 12, my + mh - 12], [mx + mw - 12, my + mh - 12]
      ];
      ctx.fillStyle = '#fde68a';
      for (const [rx, ry] of rivets) {
        ctx.beginPath();
        ctx.arc(rx, ry, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Title & Subtitle Header
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 18px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.shadowColor = '#d97706';
      ctx.shadowBlur = 8;
      ctx.fillText('◈ THE VANGUARD\'S FIELD MANUAL ◈', LW / 2, my + 14);
      ctx.shadowBlur = 0;

      ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
      ctx.font = 'italic 11px "Crimson Text", serif';
      ctx.fillText('ARCHIVAL COMBAT DOCTRINE & SURVIVAL PROTOCOLS OF THE ABYSS', LW / 2, my + 34);

      // Five Chapter Folio Tabs
      const chapterTabs = [
        { id: 0, label: 'I · ARSENAL' },
        { id: 1, label: 'II · FOOTWORK' },
        { id: 2, label: 'III · SANITY' },
        { id: 3, label: 'IV · RALLY' },
        { id: 4, label: 'V · BOSSES' }
      ];

      const tabW = 148, tabH = 26;
      const tabStartX = mx + Math.round((mw - (chapterTabs.length * tabW + (chapterTabs.length - 1) * 6)) / 2);
      const tabY = my + 52;

      chapterTabs.forEach((tab, i) => {
        const tx = tabStartX + i * (tabW + 6);
        const isSel = (_fieldGuideChapter === tab.id);
        const isHover = mouseX >= tx && mouseX <= tx + tabW && mouseY >= tabY && mouseY <= tabY + tabH;

        ctx.fillStyle = isSel ? 'rgba(217, 119, 6, 0.28)' : (isHover ? 'rgba(30, 41, 59, 0.8)' : 'rgba(15, 23, 42, 0.6)');
        ctx.strokeStyle = isSel ? '#fde68a' : (isHover ? '#94a3b8' : 'rgba(71, 85, 105, 0.45)');
        ctx.lineWidth = isSel ? 1.5 : 1;
        roundRect(ctx, tx, tabY, tabW, tabH, 5);
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = isSel ? '#fde68a' : (isHover ? '#ffffff' : '#94a3b8');
        ctx.font = 'bold 9.5px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tab.label, tx + tabW / 2, tabY + tabH / 2);

        if (isSel) {
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(tx + 14, tabY + tabH - 2, tabW - 28, 2);
        }
      });

      // Split-Folio Spread Layout
      const spreadY = my + 86;
      const spreadH = 356;
      const leftW = 380;
      const rightW = mw - leftW - 48;
      const leftX = mx + 20;
      const rightX = leftX + leftW + 12;

      // ── Left Folio: Procedural Tactical Schematic Canvas ──
      ctx.fillStyle = 'rgba(10, 15, 28, 0.85)';
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.45)';
      ctx.lineWidth = 1;
      roundRect(ctx, leftX, spreadY, leftW, spreadH, 8);
      ctx.fill(); ctx.stroke();

      // Schematic blueprint grid lines
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let gx = leftX + 24; gx < leftX + leftW; gx += 24) {
        ctx.moveTo(gx, spreadY + 4); ctx.lineTo(gx, spreadY + spreadH - 4);
      }
      for (let gy = spreadY + 24; gy < spreadY + spreadH; gy += 24) {
        ctx.moveTo(leftX + 4, gy); ctx.lineTo(leftX + leftW - 4, gy);
      }
      ctx.stroke();

      // Schematic Banner
      ctx.fillStyle = 'rgba(147, 51, 234, 0.25)';
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
      roundRect(ctx, leftX + 12, spreadY + 10, leftW - 24, 22, 4);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 9.5px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('◈ VANGUARD TACTICAL DIAGRAM · FIELD SIMULATION ◈', leftX + leftW / 2, spreadY + 21);

      // Render Dynamic Diagram depending on active chapter
      if (_fieldGuideChapter === 0) {
        // CHAPTER 0: ARSENAL SCHEMATIC
        const cx = leftX + leftW / 2, cy = spreadY + 140;

        // Cleave Arc Vector
        ctx.save();
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.arc(cx - 30, cy, 64, -0.6, 1.2);
        ctx.stroke();

        ctx.strokeStyle = '#fde68a';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(cx - 30, cy, 64, -0.6, 1.2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Sword blade
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 30, cy); ctx.lineTo(cx + 42, cy + 30);
        ctx.stroke();
        ctx.fillStyle = '#fde68a';
        ctx.beginPath(); ctx.arc(cx - 30, cy, 3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 10px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.fillText('PRIMARY SWORD CLEAVE (68° ARC · STAGGER ZONE)', cx, cy + 62);

        // Weapon Dock Mockup
        const dockY = spreadY + 230;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.5)';
        roundRect(ctx, cx - 140, dockY, 280, 52, 6);
        ctx.fill(); ctx.stroke();

        const slots = [
          { key: '1', name: 'BROADSWORD', active: true, col: '#fde68a' },
          { key: '2', name: 'LONGBOW', active: false, col: '#38bdf8' },
          { key: '3', name: 'RELIC', active: false, col: '#c084fc' }
        ];
        slots.forEach((s, idx) => {
          const sx = cx - 130 + idx * 92;
          ctx.fillStyle = s.active ? 'rgba(245, 158, 11, 0.25)' : 'rgba(30, 41, 59, 0.5)';
          ctx.strokeStyle = s.active ? '#f59e0b' : 'rgba(71, 85, 105, 0.4)';
          ctx.lineWidth = s.active ? 1.5 : 1;
          roundRect(ctx, sx, dockY + 6, 84, 40, 4);
          ctx.fill(); ctx.stroke();

          ctx.fillStyle = s.active ? '#ffffff' : '#94a3b8';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`[${s.key}]`, sx + 6, dockY + 18);
          ctx.fillStyle = s.col;
          ctx.font = 'bold 8.5px Cinzel, serif';
          ctx.textAlign = 'center';
          ctx.fillText(s.name, sx + 42, dockY + 32);
        });

        // Bow aim vector at bottom
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cx - 120, spreadY + 316); ctx.lineTo(cx + 120, spreadY + 316);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#7dd3fc';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('--- [ HOLD SHIFT ] PIERCING ARROW TRAJECTORY --->', cx, spreadY + 332);

      } else if (_fieldGuideChapter === 1) {
        // CHAPTER 1: FOOTWORK & DODGE CADENCE
        const cx = leftX + leftW / 2, cy = spreadY + 120;

        // Dodge roll vector schematic
        const dy = spreadY + 140;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx - 120, dy); ctx.lineTo(cx + 110, dy);
        ctx.stroke();

        // Arrow head on vector
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(cx + 120, dy);
        ctx.lineTo(cx + 105, dy - 6);
        ctx.lineTo(cx + 105, dy + 6);
        ctx.closePath();
        ctx.fill();

        // 4 after-images showing evasion phase
        for (let g = 0; g < 4; g++) {
          const gx = cx - 100 + g * 65;
          ctx.fillStyle = `rgba(56, 189, 248, ${0.12 + g * 0.22})`;
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.2;
          roundRect(ctx, gx - 14, dy - 26, 28, 28, 5);
          ctx.fill(); ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8.5px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`F${g * 6}`, gx, dy - 12);
        }

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 10.5px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('[ 18-FRAME ABSOLUTE INVULNERABILITY WINDOW ]', cx, dy + 24);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
        ctx.font = 'italic 9.5px "Crimson Text", serif';
        ctx.fillText('Rowan phases through monster physical sweeps, cleaves & projectile rings', cx, dy + 40);

        // Directional WASD compass at bottom
        const compassY = spreadY + 235;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.5)';
        roundRect(ctx, cx - 130, compassY, 260, 94, 6);
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 9.5px Cinzel, serif';
        ctx.fillText('DIRECTIONAL EVASION CADENCE', cx, compassY + 12);

        const keys = [
          { label: 'W', x: cx, y: compassY + 34 },
          { label: 'A', x: cx - 36, y: compassY + 62 },
          { label: 'S', x: cx, y: compassY + 62 },
          { label: 'D', x: cx + 36, y: compassY + 62 }
        ];
        keys.forEach(k => {
          ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1;
          roundRect(ctx, k.x - 14, k.y - 12, 28, 24, 3);
          ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#f1f5f9';
          ctx.font = 'bold 9.5px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(k.label, k.x, k.y);
        });

      } else if (_fieldGuideChapter === 2) {
        // CHAPTER 2: ILLUMINATION & SANITY
        const cx = leftX + leftW / 2, cy = spreadY + 125;

        // Torchlight sanctuary circle
        const rad = 68;
        const lightGrad = ctx.createRadialGradient(cx, cy, 8, cx, cy, rad);
        lightGrad.addColorStop(0, 'rgba(253, 230, 138, 0.45)');
        lightGrad.addColorStop(0.7, 'rgba(217, 119, 6, 0.18)');
        lightGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');
        ctx.fillStyle = lightGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Central Brazier
        ctx.fillStyle = '#475569';
        ctx.fillRect(cx - 6, cy + 6, 12, 10);
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(cx, cy - 1, 2.5, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 9.5px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('SANCTUARY RADIUS · SANITY DRAIN HALTED', cx, cy + rad + 10);

        // Sanity Eye Gauge at bottom
        const ey = spreadY + 230;
        ctx.fillStyle = '#c084fc';
        ctx.font = 'bold 10px Cinzel, serif';
        ctx.fillText('COGNITIVE EQUILIBRIUM · THE EYE OF MADNESS', cx, ey);

        // Eye illustration
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cx, ey + 32, 42, 20, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#7e22ce';
        ctx.beginPath(); ctx.arc(cx, ey + 32, 11, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(cx - 3, ey + 29, 3.5, 0, Math.PI * 2); ctx.fill();

        const sanityStages = [
          { label: '>70% VIGILANT', col: '#4ade80', x: cx - 105 },
          { label: '<30% DISTORTED', col: '#facc15', x: cx },
          { label: '0% SHATTERED', col: '#ef4444', x: cx + 105 }
        ];
        sanityStages.forEach(st => {
          ctx.fillStyle = st.col;
          ctx.font = 'bold 8.5px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(st.label, st.x, ey + 68);
        });

      } else if (_fieldGuideChapter === 3) {
        // CHAPTER 3: GHOST HEALTH & RALLY SYSTEM
        const cx = leftX + leftW / 2;

        // Health Bar with Ghost Health
        const hby = spreadY + 65;
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 10px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('ROWAN VITALITY & GHOST HEALTH RALLY', cx, hby);

        const barW = 280, barH = 26;
        const bx = cx - barW / 2, by = hby + 16;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.6)';
        roundRect(ctx, bx, by, barW, barH, 4);
        ctx.fill(); ctx.stroke();

        // Active HP (50%)
        ctx.fillStyle = '#ef4444';
        roundRect(ctx, bx + 2, by + 2, barW * 0.5, barH - 4, 3);
        ctx.fill();

        // Ghost HP (28% flashing)
        const ghostPulse = 0.5 + 0.3 * Math.sin(F * 0.15);
        ctx.fillStyle = `rgba(203, 213, 225, ${ghostPulse})`;
        roundRect(ctx, bx + 2 + barW * 0.5, by + 2, barW * 0.28, barH - 4, 3);
        ctx.fill();

        // Siphon arrow
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx + barW * 0.78, by + 38);
        ctx.quadraticCurveTo(bx + barW * 0.64, by + 50, bx + barW * 0.52, by + barH + 2);
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9.5px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.fillText('COUNTER-ATTACK TO SIPHON GHOST HP BACK', cx, by + 52);

        // Emergency window timer bar
        const ty = spreadY + 220;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.5)';
        roundRect(ctx, cx - 130, ty, 260, 94, 6);
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 9.5px Cinzel, serif';
        ctx.fillText('2.5-SECOND EMERGENCY RETALIATION WINDOW', cx, ty + 12);

        // Timer track
        ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
        roundRect(ctx, cx - 100, ty + 34, 200, 14, 3);
        ctx.fill();

        const timerPulse = (F * 0.05) % 1.0;
        ctx.fillStyle = '#38bdf8';
        roundRect(ctx, cx - 100, ty + 34, 200 * (1 - timerPulse), 14, 3);
        ctx.fill();

        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 8.5px monospace';
        ctx.fillText('STRIKE WITHIN WINDOW TO PREVENT LOSS', cx, ty + 62);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
        ctx.font = 'italic 9px "Crimson Text", serif';
        ctx.fillText('Ghost health decays completely if no counter-strike lands', cx, ty + 78);

      } else if (_fieldGuideChapter === 4) {
        // CHAPTER 4: CITADEL BOSSES
        const bosses = [
          { name: 'GORGAROTH THE DEFILER', floor: 'FLOOR 3', title: 'THE MOLTEN FORGE', col: '#f97316', sigil: '⚔' },
          { name: 'MALAKOR THE DREADLORD', floor: 'FLOOR 6', title: 'THE VOID RIFT', col: '#a855f7', sigil: '✦' },
          { name: 'THE ABYSS WARDEN', floor: 'FLOOR 10', title: 'THE SUNKEN THRONE', col: '#ef4444', sigil: '♛' }
        ];

        bosses.forEach((b, i) => {
          const by = spreadY + 44 + i * 94;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
          ctx.strokeStyle = b.col;
          ctx.lineWidth = 1.2;
          roundRect(ctx, leftX + 16, by, leftW - 32, 82, 6);
          ctx.fill(); ctx.stroke();

          ctx.fillStyle = b.col;
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(b.floor, leftX + 28, by + 16);

          ctx.fillStyle = '#fde68a';
          ctx.font = 'bold 11px Cinzel, serif';
          ctx.fillText(b.name, leftX + 28, by + 34);

          ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
          ctx.font = 'italic 9.5px "Crimson Text", serif';
          ctx.fillText(`Locus: ${b.title} · Unlocks forged threshold`, leftX + 28, by + 52);

          // Boss Runic Sigil Box on right
          ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
          ctx.strokeStyle = b.col;
          roundRect(ctx, leftX + leftW - 74, by + 16, 50, 50, 4);
          ctx.fill(); ctx.stroke();
          ctx.fillStyle = b.col;
          ctx.font = '16px Cinzel, serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(b.sigil, leftX + leftW - 49, by + 41);
        });
      }

      // ── Right Folio: Tactical Doctrine & Directives ──
      ctx.fillStyle = 'rgba(12, 16, 32, 0.75)';
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.45)';
      ctx.lineWidth = 1;
      roundRect(ctx, rightX, spreadY, rightW, spreadH, 8);
      ctx.fill(); ctx.stroke();

      const doctrines = [
        {
          num: 'CHAPTER I',
          title: 'THE VANGUARD ARSENAL',
          subtitle: 'Armed Engagement, Stagger Poise & Rapid Switching',
          points: [
            { tag: '[ SPACE / LMB ]', desc: 'Execute primary weapon cleave. Deals heavy physical poise damage and staggers frontliners.' },
            { tag: '[ HOLD SHIFT ]', desc: 'Draw the Longbow for piercing projectile shots. Quiver replenishes in active combat.' },
            { tag: '[ KEYS 1 - 3 ]', desc: 'Instant hotkey weapon switching. Swap between heavy blade, swift daggers, and shield mid-combo.' }
          ],
          tip: 'Tip: Strike immediately following an enemy whiff to capitalize on recovery vulnerability frames.'
        },
        {
          num: 'CHAPTER II',
          title: 'FOOTWORK & DODGE CADENCE',
          subtitle: 'Invulnerability Frames & Directional Repositioning',
          points: [
            { tag: '[ WASD / ARROWS ]', desc: 'Directional footwork. Rowan accelerates swiftly to maintain safe spacing and kite swarms.' },
            { tag: '[ EVASION ROLL ]', desc: 'Dodge rolling grants 18 frames of absolute invulnerability through all enemy swings and hazards.' },
            { tag: '[ STAMINA PACING ]', desc: 'Avoid exhausting your evasive cadence; reserve roll charges for telegraphed boss attacks.' }
          ],
          tip: 'Tip: Never roll directly into walls or corners where recovery frames can be punished.'
        },
        {
          num: 'CHAPTER III',
          title: 'ILLUMINATION & SANITY',
          subtitle: 'Braziers of Light & Mind Equilibrium Protocols',
          points: [
            { tag: '[ LIT BRAZIERS ]', desc: 'Wall torches push back deep dungeon darkness. Lingering near illumination halts sanity decay.' },
            { tag: '[ SHADOW DRAIN ]', desc: 'Pitch-black corridors rapidly erode cognitive stability, causing visual phantom mirages.' },
            { tag: '[ SHATTERED MIND ]', desc: 'Dropping to zero sanity triggers the harrowing trial of Shattered Mind where reality collapses.' }
          ],
          tip: 'Tip: Slaying shadow abominations releases psychic essence, partially soothing mental decay.'
        },
        {
          num: 'CHAPTER IV',
          title: 'GHOST HEALTH & RALLY',
          subtitle: 'The Siphon Window & Aggressive Retaliation',
          points: [
            { tag: '[ GHOST HEALTH ]', desc: 'Inflicted wounds temporarily register as grey ghost health for an emergency 2.5-second window.' },
            { tag: '[ RALLY SIPHON ]', desc: 'Striking hostile abominations immediately siphons and restores lost life force before it fades.' },
            { tag: '[ RISK & REWARD ]', desc: 'Aggressive calculated counter-attacks can fully nullify received damage without using potions.' }
          ],
          tip: 'Tip: Heavy weapons with wide cleaves restore larger chunks of ghost health per swing.'
        },
        {
          num: 'CHAPTER V',
          title: 'CITADEL TITANS & BOSS PROTOCOLS',
          subtitle: 'Ancient Lords of the Subterranean Citadel',
          points: [
            { tag: '[ GORGAROTH · FL 3 ]', desc: 'Heavy anvil smashes create molten shockwaves. Dodge behind his back during wind-ups.' },
            { tag: '[ MALAKOR · FL 6 ]', desc: 'Distorts local spatial geometry and channels reality fissures. Slay his phantom shadows.' },
            { tag: '[ WARDEN · FL 10 ]', desc: 'The ancient monarch telekinetically controls soaring greatswords across 3 lethal phases.' }
          ],
          tip: 'Tip: Defeating citadel bosses unlocks forged thresholds leading into deeper dimensional chambers.'
        }
      ];

      const doc = doctrines[_fieldGuideChapter] || doctrines[0];

      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`◈ ${doc.num} · TACTICAL DOCTRINE`, rightX + 20, spreadY + 16);

      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 14.5px Cinzel, serif';
      ctx.fillText(doc.title, rightX + 20, spreadY + 34);

      ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
      ctx.font = 'italic 11px "Crimson Text", serif';
      ctx.fillText(doc.subtitle, rightX + 20, spreadY + 54);

      ctx.strokeStyle = 'rgba(217, 119, 6, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rightX + 20, spreadY + 74);
      ctx.lineTo(rightX + rightW - 20, spreadY + 74);
      ctx.stroke();

      // Points list with strict word wrapping within right folio bounds
      const maxDescW = rightW - 40;
      doc.points.forEach((pt, idx) => {
        const py = spreadY + 84 + idx * 72;

        // Tag pill
        ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.lineWidth = 1;
        roundRect(ctx, rightX + 20, py, 140, 20, 4);
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pt.tag, rightX + 90, py + 10);

        // Word-wrapped description lines
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '11px "Crimson Text", serif';
        const lines = wrapTextLines(ctx, pt.desc, maxDescW);
        lines.forEach((line, lineIdx) => {
          ctx.fillText(line, rightX + 20, py + 24 + lineIdx * 14.5);
        });
      });

      // Bottom advisory tip box with word wrapping
      const tipY = spreadY + spreadH - 52;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.strokeStyle = 'rgba(147, 51, 234, 0.4)';
      roundRect(ctx, rightX + 20, tipY, rightW - 40, 40, 4);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#c084fc';
      ctx.font = 'italic 10.5px "Crimson Text", serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const tipLines = wrapTextLines(ctx, doc.tip, rightW - 60);
      tipLines.forEach((tLine, tIdx) => {
        ctx.fillText(tLine, rightX + 30, tipY + 8 + tIdx * 14);
      });

      // ── Bottom Controls Bar ──
      const bBarY = my + mh - 44;

      // Prev Doctrine Button
      const isHoverPrev = mouseX >= leftX && mouseX <= leftX + 130 && mouseY >= bBarY && mouseY <= bBarY + 30;
      ctx.fillStyle = isHoverPrev ? 'rgba(30, 41, 59, 0.8)' : 'rgba(15, 23, 42, 0.6)';
      ctx.strokeStyle = isHoverPrev ? '#fde68a' : 'rgba(71, 85, 105, 0.5)';
      roundRect(ctx, leftX, bBarY, 130, 30, 5);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = isHoverPrev ? '#ffffff' : '#94a3b8';
      ctx.font = 'bold 10px Cinzel, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('← PREV FOLIO', leftX + 65, bBarY + 15);

      // Next Doctrine Button
      const nextX = leftX + 140;
      const isHoverNext = mouseX >= nextX && mouseX <= nextX + 130 && mouseY >= bBarY && mouseY <= bBarY + 30;
      ctx.fillStyle = isHoverNext ? 'rgba(30, 41, 59, 0.8)' : 'rgba(15, 23, 42, 0.6)';
      ctx.strokeStyle = isHoverNext ? '#fde68a' : 'rgba(71, 85, 105, 0.5)';
      roundRect(ctx, nextX, bBarY, 130, 30, 5);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = isHoverNext ? '#ffffff' : '#94a3b8';
      ctx.fillText('NEXT FOLIO →', nextX + 65, bBarY + 15);

      // Start Descent Button (Right side)
      const startW = 180;
      const startX = mx + mw - 20 - startW;
      const isHoverStart = mouseX >= startX && mouseX <= startX + startW && mouseY >= bBarY && mouseY <= bBarY + 30;
      ctx.fillStyle = isHoverStart ? 'rgba(34, 197, 94, 0.35)' : 'rgba(34, 197, 94, 0.2)';
      ctx.strokeStyle = isHoverStart ? '#86efac' : '#22c55e';
      ctx.lineWidth = 1.2;
      roundRect(ctx, startX, bBarY, startW, 30, 5);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#4ade80';
      ctx.fillText('◈ START DESCENT ( Enter )', startX + startW / 2, bBarY + 15);

      // Close Manual Button
      const closeW = 150;
      const closeX = startX - 12 - closeW;
      const isHoverClose = mouseX >= closeX && mouseX <= closeX + closeW && mouseY >= bBarY && mouseY <= bBarY + 30;
      ctx.fillStyle = isHoverClose ? 'rgba(51, 65, 85, 0.7)' : 'rgba(30, 41, 59, 0.5)';
      ctx.strokeStyle = isHoverClose ? '#ffffff' : 'rgba(148, 163, 184, 0.5)';
      roundRect(ctx, closeX, bBarY, closeW, 30, 5);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText('◈ CLOSE ( Esc )', closeX + closeW / 2, bBarY + 15);

      ctx.restore();
    }

    // ─────────────────────────────────────────────────────────────
    // 10. "A SPECIAL GIFT" INVITATION MODAL (THE LAST EMBER)
    // ─────────────────────────────────────────────────────────────
    _giftModalBtns = [];
    if (!SaveSystem.isPhase3GiftEligible()) {
      _giftModalOpen = false;
    } else if (!_giftModalChecked && !SaveSystem.isPhase3InvitationDismissed()) {
      if (_revealTimer > 2.5) {
        _giftModalOpen = true;
        _giftModalChecked = true;
      }
    }

    if (_giftModalOpen) {
      ctx.save();
      const modalVignette = ctx.createRadialGradient(LW / 2, LH / 2, 80, LW / 2, LH / 2, LW * 0.65);
      modalVignette.addColorStop(0, 'rgba(4, 7, 16, 0.90)');
      modalVignette.addColorStop(1, 'rgba(2, 3, 8, 0.97)');
      ctx.fillStyle = modalVignette;
      ctx.fillRect(0, 0, LW, LH);

      const mw = 520, mh = 260;
      const mx = Math.round((LW - mw) / 2), my = Math.round((LH - mh) / 2);

      // Deep obsidian slate background
      ctx.fillStyle = 'rgba(8, 12, 22, 0.98)';
      roundRect(ctx, mx, my, mw, mh, 10);
      ctx.fill();

      // Antique gold outer border
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.8)';
      ctx.lineWidth = 1.8;
      roundRect(ctx, mx, my, mw, mh, 10);
      ctx.stroke();

      // Soft amber inner border
      ctx.strokeStyle = 'rgba(253, 230, 138, 0.25)';
      ctx.lineWidth = 1;
      roundRect(ctx, mx + 5, my + 5, mw - 10, mh - 10, 8);
      ctx.stroke();

      // Corner brass rivets
      const rivets = [
        [mx + 12, my + 12], [mx + mw - 12, my + 12],
        [mx + 12, my + mh - 12], [mx + mw - 12, my + mh - 12]
      ];
      ctx.fillStyle = '#fde68a';
      for (const [rx, ry] of rivets) {
        ctx.beginPath();
        ctx.arc(rx, ry, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Header Icon: Pixel Ember
      const cx = LW / 2;
      const emberPulse = 1 + Math.sin(F * 0.08) * 0.15;
      const emberGrad = ctx.createRadialGradient(cx, my + 42, 0, cx, my + 42, 32 * emberPulse);
      emberGrad.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
      emberGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = emberGrad;
      ctx.beginPath();
      ctx.arc(cx, my + 42, 32 * emberPulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 1, my + 41, 2, 2);
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(cx - 3, my + 41, 2, 2);
      ctx.fillRect(cx + 1, my + 41, 2, 2);
      ctx.fillRect(cx - 1, my + 39, 2, 2);
      ctx.fillRect(cx - 1, my + 43, 2, 2);

      // Title: A SPECIAL GIFT
      ctx.fillStyle = '#fde68a';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 8;
      ctx.font = 'bold 16px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('A SPECIAL GIFT', cx, my + 78);
      ctx.shadowBlur = 0;

      // Divider line
      const divGrad = ctx.createLinearGradient(cx - 120, my + 94, cx + 120, my + 94);
      divGrad.addColorStop(0, 'rgba(217, 119, 6, 0)');
      divGrad.addColorStop(0.5, 'rgba(253, 230, 138, 0.65)');
      divGrad.addColorStop(1, 'rgba(217, 119, 6, 0)');
      ctx.strokeStyle = divGrad;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 120, my + 94);
      ctx.lineTo(cx + 120, my + 94);
      ctx.stroke();

      // Supporting lines
      ctx.font = '14px "Crimson Text", Georgia, serif';
      ctx.fillStyle = '#f1f5f9';
      ctx.fillText('You have witnessed every fate.', cx, my + 118);

      ctx.font = 'italic 13.5px "Crimson Text", Georgia, serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText("There is one last thing we'd like to share with you.", cx, my + 140);

      // Buttons: VIEW MY GIFT & LATER
      const bw = 180, bh = 36;
      const b1x = cx - bw - 12, by = my + 185;
      const b2x = cx + 12;

      const mouseX = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.mx : -999;
      const mouseY = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.my : -999;

      const hov1 = (mouseX >= b1x && mouseX <= b1x + bw && mouseY >= by && mouseY <= by + bh);
      const hov2 = (mouseX >= b2x && mouseX <= b2x + bw && mouseY >= by && mouseY <= by + bh);

      // VIEW MY GIFT Button (Warm Amber Gold)
      const b1Grad = ctx.createLinearGradient(b1x, by, b1x, by + bh);
      b1Grad.addColorStop(0, hov1 ? '#fbbf24' : '#f59e0b');
      b1Grad.addColorStop(1, hov1 ? '#d97706' : '#b45309');
      ctx.fillStyle = b1Grad;
      ctx.strokeStyle = hov1 ? '#fef08a' : '#fde68a';
      ctx.lineWidth = 1.4;
      roundRect(ctx, b1x, by, bw, bh, 6);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 12.5px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('VIEW MY GIFT', b1x + bw / 2, by + bh / 2);

      // LATER Button (Dark Obsidian with slate text)
      ctx.fillStyle = hov2 ? 'rgba(30, 41, 59, 0.9)' : 'rgba(15, 23, 42, 0.8)';
      ctx.strokeStyle = hov2 ? '#94a3b8' : 'rgba(148, 163, 184, 0.45)';
      ctx.lineWidth = 1.2;
      roundRect(ctx, b2x, by, bw, bh, 6);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = hov2 ? '#ffffff' : '#cbd5e1';
      ctx.font = '12px Cinzel, serif';
      ctx.fillText('LATER', b2x + bw / 2, by + bh / 2);

      _giftModalBtns.push({
        id: 'view_gift',
        x: b1x, y: by, w: bw, h: bh,
        action: () => {
          _giftModalOpen = false;
          SaveSystem.dismissPhase3Invitation();
          SoundManager.snd('menu_select');
          LastEmberCinematic.start('invitation');
        }
      });

      _giftModalBtns.push({
        id: 'later',
        x: b2x, y: by, w: bw, h: bh,
        action: () => {
          _giftModalOpen = false;
          SaveSystem.dismissPhase3Invitation();
          SoundManager.snd('panel_close');
        }
      });

      ctx.restore();
    }

    if (_returnGoldenWash > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 248, 231, ${_returnGoldenWash})`;
      ctx.fillRect(0, 0, LW, LH);
      ctx.restore();
    }
  },

  handleClick(mx, my) {
    AudioManager.init();

    if (_giftModalOpen) {
      for (const btn of _giftModalBtns) {
        if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
          btn.action();
          return true;
        }
      }
      // Click outside modal dismisses it as Later
      const mw = 520, mh = 260;
      const myY = (LH - mh) / 2;
      const mxX = (LW - mw) / 2;
      if (mx < mxX || mx > mxX + mw || my < myY || my > myY + mh) {
        _giftModalOpen = false;
        SaveSystem.dismissPhase3Invitation();
        SoundManager.snd('panel_close');
        return true;
      }
      return true;
    }

    if (_howToPlayActive) {
      const mw = 830, mh = 506;
      const mxX = Math.round((LW - mw) / 2), myY = Math.round((LH - mh) / 2);

      // Chapter tabs click detection (5 tabs)
      const tabW = 148, tabH = 26;
      const tabStartX = mxX + Math.round((mw - (5 * tabW + 4 * 6)) / 2);
      const tabY = myY + 52;
      for (let i = 0; i < 5; i++) {
        const tx = tabStartX + i * (tabW + 6);
        if (mx >= tx && mx <= tx + tabW && my >= tabY && my <= tabY + tabH) {
          _fieldGuideChapter = i;
          SoundManager.snd('menu_hover');
          return true;
        }
      }

      // Prev Doctrine button
      const leftX = mxX + 20;
      const bBarY = myY + mh - 44;
      if (mx >= leftX && mx <= leftX + 130 && my >= bBarY && my <= bBarY + 30) {
        _fieldGuideChapter = (_fieldGuideChapter - 1 + 5) % 5;
        SoundManager.snd('menu_hover');
        return true;
      }

      // Next Doctrine button
      const nextX = leftX + 140;
      if (mx >= nextX && mx <= nextX + 130 && my >= bBarY && my <= bBarY + 30) {
        _fieldGuideChapter = (_fieldGuideChapter + 1) % 5;
        SoundManager.snd('menu_hover');
        return true;
      }

      // Start Descent Button
      const startW = 180;
      const startX = mxX + mw - 20 - startW;
      if (mx >= startX && mx <= startX + startW && my >= bBarY && my <= bBarY + 30) {
        SoundManager.snd('menu_select');
        startGame();
        return true;
      }

      // Close Manual Button
      const closeW = 150;
      const closeX = startX - 12 - closeW;
      if (mx >= closeX && mx <= closeX + closeW && my >= bBarY && my <= bBarY + 30) {
        SoundManager.snd('panel_close');
        _howToPlayActive = false;
        return true;
      }

      // Click outside modal closes it
      if (mx < mxX || mx > mxX + mw || my < myY || my > myY + mh) {
        SoundManager.snd('panel_close');
        _howToPlayActive = false;
        return true;
      }
      return true;
    }

    // Check text-first buttons with comfortable hit box
    for (const b of _titleBtns) {
      if (mx >= b.x - 20 && mx <= b.x + b.w + 10 && my >= b.y - 4 && my <= b.y + b.h + 4) {
        if (b.disabled) {
          SoundManager.snd('error_disabled');
          return true;
        }
        SoundManager.snd('menu_select');
        b.action();
        return true;
      }
    }

    if (mx >= 50 && mx <= 320 && my >= 220 && my <= 280) {
      startGame();
      return true;
    }

    return false;
  },

  isGiftModalOpen() {
    return _giftModalOpen;
  },
  triggerGoldenWash() {
    _returnGoldenWash = 1.0;
  },
  openGiftModal() {
    _giftModalOpen = true;
    const p = typeof document !== 'undefined' && document.getElementById('ending-debug-panel');
    if (p) p.style.display = 'none';
  },
  closeGiftModal() {
    _giftModalOpen = false;
    SaveSystem.dismissPhase3Invitation();
    const p = typeof document !== 'undefined' && document.getElementById('ending-debug-panel');
    if (p) p.style.display = 'flex';
  }
};

export function drawTitle(ctx, dt) {
  MainMenu.draw(ctx, dt);
}

if (typeof window !== 'undefined') {
  window.MainMenu = MainMenu;
  window.startGame = startGame;
  window.resumeSavedRun = resumeSavedRun;
  window.openTrainingDungeon = openTrainingDungeon;
}
