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
import { MainMenuScene } from '../cinematics/MainMenuScene.js?v=3.0';
import { ButtonArtManager } from './ButtonArtManager.js?v=1.0';
import { openSettings } from './SettingsUI.js';
import { openAchievements } from './AchievementsUI.js';
import { CinematicArchiveUI } from './CinematicArchiveUI.js';
import { drawPixelEye } from '../cinematics/ShatteredMindCinematic.js';
import { DeveloperSanctumUI } from './DeveloperSanctumUI.js';
import { WEAPON_TYPES, WEAPON_KEYS } from '../weapons/WeaponRegistry.js';
import { RARITIES } from '../data/weapons.js';
import { WeaponFactory } from '../weapons/WeaponFactory.js';
import { FullscreenHelper } from './FullscreenHelper.js';

let _titleBtns = [];
let _focusedIndex = 0;
let _lastHoveredIndex = -1;
let _lastMouseX = -999;
let _lastMouseY = -999;
let _lastInputMode = 'mouse';

// Secret Developer Sanctum Relic Button
let _relicBtnRect = { x: 0, y: 0, w: 44, h: 38 };
// Immersive Fullscreen Mode Button
let _fullscreenBtnRect = { x: 0, y: 0, w: 126, h: 34 };

// Standard Run Pre-Descent Loadout Modal State
let _loadoutModalOpen = false;
let _loadoutWeaponId = 'sword';
let _loadoutRarity = 'Common';

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
let _fieldGuideChapter = 0; // 0: Arsenal, 1: Footwork, 2: Sanity, 3: Rally, 4: Bosses, 5: Time & Tempo
let _fieldGuideInputMode = (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width:900px),(pointer:coarse)').matches) ? 'mobile' : 'pc';
let _fieldGuideDemoRunning = false;
let _fieldGuideDemoCompleted = false;
let _fieldGuideDemoTimer = 0; // 0 to 2.5s controlled demonstration
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
  const wingLen = Math.max(50, half - 22);

  ctx.strokeStyle = 'rgba(217, 119, 6, 0.75)';
  ctx.lineWidth = 1.2;

  // Left wing
  ctx.beginPath();
  ctx.moveTo(cx - 16, cy);
  ctx.bezierCurveTo(cx - wingLen * 0.35, cy - 3, cx - wingLen * 0.70, cy + 3, cx - wingLen, cy);
  ctx.bezierCurveTo(cx - wingLen - 6, cy - 2, cx - wingLen - 12, cy - 6, cx - wingLen - 16, cy - 3);
  ctx.stroke();

  // Left spiral curl
  ctx.beginPath();
  ctx.arc(cx - wingLen - 16, cy - 2, 2.2, 0, Math.PI * 2);
  ctx.stroke();

  // Left diamond accent
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.moveTo(cx - wingLen * 0.55, cy - 3);
  ctx.lineTo(cx - wingLen * 0.55 + 3, cy);
  ctx.lineTo(cx - wingLen * 0.55, cy + 3);
  ctx.lineTo(cx - wingLen * 0.55 - 3, cy);
  ctx.closePath();
  ctx.fill();

  // Right wing (symmetrical)
  ctx.beginPath();
  ctx.moveTo(cx + 16, cy);
  ctx.bezierCurveTo(cx + wingLen * 0.35, cy - 3, cx + wingLen * 0.70, cy + 3, cx + wingLen, cy);
  ctx.bezierCurveTo(cx + wingLen + 6, cy - 2, cx + wingLen + 12, cy - 6, cx + wingLen + 16, cy - 3);
  ctx.stroke();

  // Right spiral curl
  ctx.beginPath();
  ctx.arc(cx + wingLen + 16, cy - 2, 2.2, 0, Math.PI * 2);
  ctx.stroke();

  // Right diamond accent
  ctx.beginPath();
  ctx.moveTo(cx + wingLen * 0.55, cy - 3);
  ctx.lineTo(cx + wingLen * 0.55 + 3, cy);
  ctx.lineTo(cx + wingLen * 0.55, cy + 3);
  ctx.lineTo(cx + wingLen * 0.55 - 3, cy);
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
  ctx.shadowBlur = 0;

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────
// THE ABYSSAL REGALIA — Bespoke Pixel-Art Button & Icon Engine
// ─────────────────────────────────────────────────────────────

function drawChamferedPanel(ctx, x, y, w, h, c = 4) {
  ctx.beginPath();
  ctx.moveTo(x + c, y);
  ctx.lineTo(x + w - c, y);
  ctx.lineTo(x + w, y + c);
  ctx.lineTo(x + w, y + h - c);
  ctx.lineTo(x + w - c, y + h);
  ctx.lineTo(x + c, y + h);
  ctx.lineTo(x, y + h - c);
  ctx.lineTo(x, y + c);
  ctx.closePath();
}

// ─────────────────────────────────────────────────────────────
// BESPOKE TITLE PLAQUE & FORGE EMBER SYSTEMS
// ─────────────────────────────────────────────────────────────

let _titlePlaqueImg = null;
let _subtitlePlaqueImg = null;
let _titleWordmarkImg = null;
let _titleDungeonImg = null;
let _titleBreakImg = null;

function getTitleDungeonImage() {
  if (!_titleDungeonImg && typeof Image !== 'undefined') {
    _titleDungeonImg = new Image();
    _titleDungeonImg.src = 'assets/menu/title_dungeon.png?v=5.0';
  }
  return (_titleDungeonImg && _titleDungeonImg.complete && _titleDungeonImg.naturalWidth > 0) ? _titleDungeonImg : null;
}

function getTitleBreakImage() {
  if (!_titleBreakImg && typeof Image !== 'undefined') {
    _titleBreakImg = new Image();
    _titleBreakImg.src = 'assets/menu/title_break.png?v=5.0';
  }
  return (_titleBreakImg && _titleBreakImg.complete && _titleBreakImg.naturalWidth > 0) ? _titleBreakImg : null;
}

function getTitlePlaqueImage() {
  if (!_titlePlaqueImg && typeof Image !== 'undefined') {
    _titlePlaqueImg = new Image();
    _titlePlaqueImg.src = 'assets/menu/title_plaque_sculpted.png?v=5.0';
  }
  return (_titlePlaqueImg && _titlePlaqueImg.complete && _titlePlaqueImg.naturalWidth > 0) ? _titlePlaqueImg : null;
}

function getSubtitlePlaqueImage() {
  if (!_subtitlePlaqueImg && typeof Image !== 'undefined') {
    _subtitlePlaqueImg = new Image();
    _subtitlePlaqueImg.src = 'assets/menu/subtitle_plaque_sculpted.png?v=5.0';
  }
  return (_subtitlePlaqueImg && _subtitlePlaqueImg.complete && _subtitlePlaqueImg.naturalWidth > 0) ? _subtitlePlaqueImg : null;
}

function getTitleWordmarkImage() {
  if (!_titleWordmarkImg && typeof Image !== 'undefined') {
    _titleWordmarkImg = new Image();
    _titleWordmarkImg.src = 'assets/menu/title_wordmark_stacked.png?v=5.0';
  }
  return (_titleWordmarkImg && _titleWordmarkImg.complete && _titleWordmarkImg.naturalWidth > 0) ? _titleWordmarkImg : null;
}

function drawTitlePlaque(ctx, x, y, w, h, alpha, F) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;

  const isReducedMotion = (typeof GameState !== 'undefined' && GameState.REDUCED_MOTION);
  const centerX = Math.round(x + w / 2);
  const topY = Math.max(2, y - 4); // Anchor cleanly in upper chasm sky

  // ─────────────────────────────────────────────────────────────
  // 1. SHATTERED CHAINS OF THE SUNKEN CITADEL (DUNGEON BREAK)
  // ─────────────────────────────────────────────────────────────
  // Heavy forged-iron anchor chains descend from top canvas boundary (y=0),
  // but snap into shattered broken links at the crest shoulders,
  // symbolizing Rowan breaking free from the abyss.
  const chainX1 = x + 34;
  const chainX2 = x + w - 34;
  const breakY = topY + 24;

  for (const cx of [chainX1, chainX2]) {
    // Upper hanging chain links
    for (let cy = 0; cy < breakY - 7; cy += 8) {
      const isVert = (Math.floor(cy / 8) % 2 === 0);
      if (isVert) {
        ctx.fillStyle = '#060810';
        ctx.fillRect(cx - 3.5, cy - 4, 7, 9);
        ctx.strokeStyle = '#1e2538';
        ctx.lineWidth = 1.6;
        ctx.strokeRect(cx - 3.5, cy - 4, 7, 9);
        // Specular highlight
        ctx.fillStyle = '#64748b';
        ctx.fillRect(cx - 2.5, cy - 4, 1.8, 9);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(cx - 2.0, cy - 3, 1.2, 2.0);
      } else {
        ctx.fillStyle = '#0e1220';
        ctx.fillRect(cx - 4.5, cy - 3, 9, 6);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.0;
        ctx.strokeRect(cx - 4.5, cy - 3, 9, 6);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(cx - 4.5, cy - 3, 4.5, 6);
      }
    }

    // THE SHATTERED SEVERED LINK
    ctx.save();
    ctx.fillStyle = '#05070e';
    ctx.beginPath();
    ctx.moveTo(cx - 4, breakY - 7);
    ctx.lineTo(cx + 4, breakY - 7);
    ctx.lineTo(cx + 3, breakY - 1);
    ctx.lineTo(cx + 5, breakY + 3);
    ctx.lineTo(cx + 1, breakY + 1);
    ctx.lineTo(cx - 2, breakY + 4);
    ctx.lineTo(cx - 4, breakY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // Hot forged severance glow on fractured tip
    if (!isReducedMotion) {
      const sparkPulse = 0.7 + Math.sin(F * 0.12 + (cx > centerX ? 1 : 0)) * 0.3;
      ctx.fillStyle = `rgba(251, 146, 60, ${0.85 * sparkPulse})`;
      ctx.shadowColor = '#ea580c';
      ctx.shadowBlur = 6;
      ctx.fillRect(cx - 1.5, breakY + 1, 3, 2.5);

      // Stray micro-sparks floating away
      const spY = breakY + 6 + ((F * 0.35 + (cx * 7)) % 16);
      const spX = cx + Math.sin(F * 0.15 + cx) * 5;
      ctx.fillStyle = '#fef08a';
      ctx.shadowBlur = 4;
      ctx.fillRect(spX, spY, 1.4, 1.4);
    }
    ctx.restore();
  }

  // ─────────────────────────────────────────────────────────────
  // 2. THE MONUMENTAL ABYSSAL HERALDIC CREST (OPEN SILHOUETTE)
  // ─────────────────────────────────────────────────────────────
  // 2.1 Crossed Antique Vanguard Greatswords behind the Crest
  ctx.save();
  const swordLen = 86;
  const swordCenterY = topY + 68;

  for (const dir of [-1, 1]) {
    ctx.save();
    ctx.translate(centerX, swordCenterY);
    ctx.rotate(dir * 0.44); // ~25 deg slant

    // Crossguard
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1.0;
    ctx.fillRect(-14, -swordLen / 2 + 14, 28, 4);
    ctx.strokeRect(-14, -swordLen / 2 + 14, 28, 4);

    // Gold pommel
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(0, -swordLen / 2 + 6, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Steel Blade with Fuller
    const bladeGrad = ctx.createLinearGradient(-3, 0, 3, 0);
    bladeGrad.addColorStop(0, '#334155');
    bladeGrad.addColorStop(0.5, '#94a3b8');
    bladeGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = bladeGrad;
    ctx.beginPath();
    ctx.moveTo(-3, -swordLen / 2 + 18);
    ctx.lineTo(3, -swordLen / 2 + 18);
    ctx.lineTo(2, swordLen / 2);
    ctx.lineTo(0, swordLen / 2 + 8); // Tip
    ctx.lineTo(-2, swordLen / 2);
    ctx.closePath();
    ctx.fill();

    // Runic blade fuller
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.45)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(0, -swordLen / 2 + 20);
    ctx.lineTo(0, swordLen / 2 - 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // 2.2 Celestial Arcane Runic Ring & Void Halo
  const haloR = 54;
  const haloY = topY + 66;
  const pulseHalo = isReducedMotion ? 0.40 : (0.32 + Math.sin(F * 0.04) * 0.14);

  // Soft Radial Void Nebula Glow behind wordmark
  ctx.save();
  const voidGlow = ctx.createRadialGradient(centerX, haloY, 6, centerX, haloY, haloR + 36);
  voidGlow.addColorStop(0, `rgba(168, 85, 247, ${0.45 * pulseHalo})`);
  voidGlow.addColorStop(0.45, `rgba(88, 28, 135, ${0.28 * pulseHalo})`);
  voidGlow.addColorStop(0.85, `rgba(30, 20, 50, ${0.12 * pulseHalo})`);
  voidGlow.addColorStop(1, 'rgba(5, 6, 18, 0)');
  ctx.fillStyle = voidGlow;
  ctx.beginPath();
  ctx.arc(centerX, haloY, haloR + 36, 0, Math.PI * 2);
  ctx.fill();

  // Outer concentric runic border ring
  ctx.strokeStyle = `rgba(217, 119, 6, ${0.45 * pulseHalo})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(centerX, haloY, haloR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = `rgba(192, 132, 252, ${0.35 * pulseHalo})`;
  ctx.setLineDash([3, 5]);
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.arc(centerX, haloY, haloR - 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Ancient Arcane Runes etched on the Halo Arc
  const runes = ['ᚱ', 'ᛟ', 'ᚹ', 'ᚨ', 'ᚾ', 'ᛋ', 'ᚨ', 'ᚾ', 'ᚲ', 'ᛏ', 'ᚢ', 'ᛗ', 'ᛒ', 'ᛚ', 'ᛟ', 'ᛞ'];
  ctx.font = '8.5px monospace';
  ctx.fillStyle = `rgba(253, 230, 138, ${0.45 * pulseHalo})`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const runeCount = runes.length;
  for (let ri = 0; ri < runeCount; ri++) {
    const angle = (ri / runeCount) * Math.PI * 2 + (isReducedMotion ? 0 : F * 0.005);
    const rx = centerX + Math.cos(angle) * (haloR - 2);
    const ry = haloY + Math.sin(angle) * (haloR - 2);
    ctx.fillText(runes[ri], rx, ry);
  }
  ctx.restore();

  // 2.3 Floating Ethereal Amethyst Motes Rising into the Dark Sky
  if (!isReducedMotion) {
    ctx.save();
    for (let mi = 0; mi < 7; mi++) {
      const moteSeed = mi * 61.3;
      const progress = ((F * 0.40 + moteSeed) % 90) / 90;
      const mx = (centerX - 100) + ((mi * 34 + Math.sin(F * 0.04 + mi) * 16) % 200);
      const my = (topY + 125) - progress * 130;
      const mAlpha = Math.sin(progress * Math.PI) * 0.75;
      ctx.fillStyle = `rgba(192, 132, 252, ${mAlpha})`;
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 5;
      ctx.fillRect(mx, my, 1.5, 1.5);
    }
    ctx.restore();
  }

  // 2.4 Apex Heraldic Amethyst Keystone
  const keystoneX = centerX;
  const keystoneY = topY + 7;
  ctx.save();

  // Antique Gold Heraldic Mount with Stepped Corbels
  ctx.fillStyle = '#78350f';
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(keystoneX, keystoneY - 8);
  ctx.lineTo(keystoneX + 11, keystoneY);
  ctx.lineTo(keystoneX + 6, keystoneY + 8);
  ctx.lineTo(keystoneX - 6, keystoneY + 8);
  ctx.lineTo(keystoneX - 11, keystoneY);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Faceted Radiant Amethyst Soul Gem
  const gemPulse = isReducedMotion ? 1.0 : (0.85 + Math.sin(F * 0.06) * 0.15);
  ctx.shadowColor = `rgba(168, 85, 247, ${0.90 * gemPulse})`;
  ctx.shadowBlur = 12;

  const gemGrad = ctx.createRadialGradient(keystoneX - 1, keystoneY - 1, 1, keystoneX, keystoneY, 8);
  gemGrad.addColorStop(0, '#f5d0fe');
  gemGrad.addColorStop(0.3, '#c084fc');
  gemGrad.addColorStop(0.7, '#9333ea');
  gemGrad.addColorStop(1, '#581c87');
  ctx.fillStyle = gemGrad;
  ctx.beginPath();
  ctx.moveTo(keystoneX, keystoneY - 5.5);
  ctx.lineTo(keystoneX + 6.5, keystoneY);
  ctx.lineTo(keystoneX, keystoneY + 5.5);
  ctx.lineTo(keystoneX - 6.5, keystoneY);
  ctx.closePath();
  ctx.fill();

  // Specular Diamond Glint
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(keystoneX - 1.2, keystoneY - 2.2, 2.4, 2.4);
  ctx.restore();

  // ─────────────────────────────────────────────────────────────
  // 3. MONUMENTAL CARVED STONE WORDMARK ("DUNGEON BREAK")
  // ─────────────────────────────────────────────────────────────
  const imgDungeon = getTitleDungeonImage();
  const imgBreak = getTitleBreakImage();

  if (imgDungeon && imgBreak) {
    // ── High-Fidelity Handcrafted Pixel-Art Stone Letterforms ──
    const dW = 260;
    const dH = Math.round(74 * (dW / 322)); // ~60px
    const dX = Math.round(centerX - dW / 2);
    const dY = topY + 12;

    const bW = 216;
    const bH = Math.round(74 * (bW / 218)); // ~73px
    const bX = Math.round(centerX - bW / 2);
    const bY = topY + 58;

    // PASS 1: Volumetric Cast Drop Shadow
    ctx.save();
    ctx.shadowColor = 'rgba(1, 2, 6, 0.95)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetX = 2.5;
    ctx.shadowOffsetY = 4.0;
    ctx.drawImage(imgDungeon, dX, dY, dW, dH);
    ctx.drawImage(imgBreak, bX, bY, bW, bH);
    ctx.restore();

    // PASS 2: Ethereal Void Glow Rim
    if (!isReducedMotion) {
      ctx.save();
      const glowPulse = 0.85 + Math.sin(F * 0.045) * 0.15;
      ctx.shadowColor = `rgba(168, 85, 247, ${0.55 * glowPulse})`;
      ctx.shadowBlur = 10;
      ctx.drawImage(imgDungeon, dX, dY, dW, dH);
      ctx.drawImage(imgBreak, bX, bY, bW, bH);
      ctx.restore();
    }

    // PASS 3: Crisp Primary Carved Stone Letter Rendering
    ctx.drawImage(imgDungeon, dX, dY, dW, dH);
    ctx.drawImage(imgBreak, bX, bY, bW, bH);
  } else {
    // ── Procedural Fallback Engine (Zero External Dependencies) ──
    const line1Y = topY + 48;
    const line2Y = topY + 96;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    // Drop Shadow
    ctx.fillStyle = '#010204';
    ctx.font = '900 33px Cinzel, serif';
    ctx.fillText('DUNGEON', centerX + 2.0, line1Y + 3.0);
    ctx.font = '900 39px Cinzel, serif';
    ctx.fillText('BREAK', centerX + 2.0, line2Y + 3.0);

    // Bronze Under-Bevel
    ctx.fillStyle = '#381504';
    ctx.font = '900 33px Cinzel, serif';
    ctx.fillText('DUNGEON', centerX + 0.8, line1Y + 1.4);
    ctx.font = '900 39px Cinzel, serif';
    ctx.fillText('BREAK', centerX + 0.8, line2Y + 1.4);

    // Ivory-to-Gold Face
    const grad1 = ctx.createLinearGradient(centerX, line1Y - 28, centerX, line1Y + 3);
    grad1.addColorStop(0.00, '#fffef2');
    grad1.addColorStop(0.25, '#fef3c7');
    grad1.addColorStop(0.55, '#fde68a');
    grad1.addColorStop(0.80, '#d97706');
    grad1.addColorStop(1.00, '#78350f');
    ctx.font = '900 33px Cinzel, serif';
    ctx.fillStyle = grad1;
    ctx.fillText('DUNGEON', centerX, line1Y);

    const grad2 = ctx.createLinearGradient(centerX, line2Y - 34, centerX, line2Y + 3);
    grad2.addColorStop(0.00, '#fffef5');
    grad2.addColorStop(0.20, '#fef08a');
    grad2.addColorStop(0.50, '#f59e0b');
    grad2.addColorStop(0.80, '#d97706');
    grad2.addColorStop(1.00, '#451a03');
    ctx.font = '900 39px Cinzel, serif';
    ctx.fillStyle = grad2;
    ctx.fillText('BREAK', centerX, line2Y);

    // Specular Highlight
    ctx.font = '900 33px Cinzel, serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.70)';
    ctx.fillText('DUNGEON', centerX - 0.5, line1Y - 0.8);
    ctx.font = '900 39px Cinzel, serif';
    ctx.fillText('BREAK', centerX - 0.5, line2Y - 0.8);
  }

  // ─────────────────────────────────────────────────────────────
  // 4. ATTACHED SECONDARY STELE PLAQUE ("ABYSS ASCENSION")
  // ─────────────────────────────────────────────────────────────
  const subW = 246;
  const subH = 20;
  const subX = Math.round(centerX - subW / 2);
  const subY = topY + 130;

  // 4.1 Drop Shadow
  ctx.save();
  ctx.fillStyle = 'rgba(1, 2, 6, 0.80)';
  ctx.beginPath();
  ctx.moveTo(subX + 10, subY + 2.5);
  ctx.lineTo(subX + subW - 10, subY + 2.5);
  ctx.lineTo(subX + subW, subY + subH / 2 + 2.5);
  ctx.lineTo(subX + subW - 10, subY + subH + 2.5);
  ctx.lineTo(subX + 10, subY + subH + 2.5);
  ctx.lineTo(subX, subY + subH / 2 + 2.5);
  ctx.closePath();
  ctx.fill();

  // 4.2 Hexagonal Plate Fill (Ancient Violet-Basalt)
  const subGrad = ctx.createLinearGradient(subX, subY, subX + subW, subY + subH);
  subGrad.addColorStop(0, '#241a3c');
  subGrad.addColorStop(0.5, '#161028');
  subGrad.addColorStop(1, '#0a0616');
  ctx.fillStyle = subGrad;
  ctx.beginPath();
  ctx.moveTo(subX + 10, subY);
  ctx.lineTo(subX + subW - 10, subY);
  ctx.lineTo(subX + subW, subY + subH / 2);
  ctx.lineTo(subX + subW - 10, subY + subH);
  ctx.lineTo(subX + 10, subY + subH);
  ctx.lineTo(subX, subY + subH / 2);
  ctx.closePath();
  ctx.fill();

  // 4.3 Antique Bronze Beveled Rim
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.85)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // 4.4 Flanking Faceted Amethyst Gemstones
  for (const gx of [subX + 8, subX + subW - 8]) {
    ctx.save();
    ctx.fillStyle = '#c084fc';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(gx, subY + subH / 2, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(gx - 0.8, subY + subH / 2 - 0.8, 1.6, 1.6);
    ctx.restore();
  }

  // 4.5 Subtitle Typography ("✦ ABYSS ASCENSION ✦")
  const subTextY = subY + subH / 2 + 0.5;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 9.5px Cinzel, serif';

  // Crisp Shadow
  ctx.fillStyle = '#010204';
  ctx.fillText('✦  A B Y S S   A S C E N S I O N  ✦', centerX + 1, subTextY + 1.2);

  // Radiant Warm Gold Face with Amber Glow
  ctx.fillStyle = '#fde68a';
  ctx.shadowColor = 'rgba(245, 158, 11, 0.50)';
  ctx.shadowBlur = 5;
  ctx.fillText('✦  A B Y S S   A S C E N S I O N  ✦', centerX, subTextY);
  ctx.restore();

  // ─────────────────────────────────────────────────────────────
  // 5. ARCHITECTURAL RUBRIC DIVIDER TO VANGUARD RAIL
  // ─────────────────────────────────────────────────────────────
  const divY = subY + subH + 6;
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.60)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(centerX - 65, divY);
  ctx.lineTo(centerX - 8, divY);
  ctx.moveTo(centerX + 8, divY);
  ctx.lineTo(centerX + 65, divY);
  ctx.stroke();

  // Central Gold Accent Diamond
  ctx.fillStyle = '#ca8a04';
  ctx.beginPath();
  ctx.moveTo(centerX, divY - 3);
  ctx.lineTo(centerX + 4, divY);
  ctx.lineTo(centerX, divY + 3);
  ctx.lineTo(centerX - 4, divY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fde68a';
  ctx.fillRect(centerX - 1, divY - 1, 2, 2);

  ctx.restore();
}

function drawForgeEmberCracks(ctx, x, y, w, h, F, isReducedMotion) {
  ctx.save();
  const pulse = isReducedMotion ? 1.0 : (0.85 + Math.sin(F * 0.10) * 0.15);
  ctx.globalAlpha = ctx.globalAlpha * pulse;

  // Clip to inner button border area
  ctx.beginPath();
  drawChamferedPanel(ctx, x + 1, y + 1, w - 2, h - 2, 4);
  ctx.clip();

  // Subtle warm amber forge heat along inner top edge
  const heatGrad = ctx.createLinearGradient(x, y, x, y + 8);
  heatGrad.addColorStop(0, 'rgba(249, 115, 22, 0.28)');
  heatGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
  ctx.fillStyle = heatGrad;
  ctx.fillRect(x + 12, y + 1, w - 24, 7);

  // Delicate forge heat core line along top edge
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(x + 24, y + 2.5);
  ctx.lineTo(x + w - 24, y + 2.5);
  ctx.stroke();

  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(x + 48, y + 2.5);
  ctx.lineTo(x + w - 48, y + 2.5);
  ctx.stroke();

  // 2 subtle floating ember motes
  if (!isReducedMotion) {
    ctx.fillStyle = '#fef08a';
    const m1X = x + 36 + ((F * 0.7) % (w - 72));
    const m1Y = y + 5 + Math.sin(F * 0.1) * 2;
    ctx.fillRect(m1X, m1Y, 1.2, 1.2);

    const m2X = x + w - 36 - ((F * 0.5) % (w - 72));
    const m2Y = y + h - 5 - Math.sin(F * 0.08) * 2;
    ctx.fillStyle = '#f97316';
    ctx.fillRect(m2X, m2Y, 1.2, 1.2);
  }

  ctx.restore();
}

function drawRegaliaIcon(ctx, id, cx, cy, size, isFocused, isHovered, isDisabled, isGift, F) {
  ctx.save();
  ctx.translate(cx, cy);

  if (isDisabled) {
    ctx.globalAlpha = 0.45;
  }

  const pulse = Math.sin(F * 0.08) * 0.2 + 0.8;

  switch (id) {
    case 'play': {
      // START JOURNEY: Slanted Forged Runic Broadsword & Ember Motes
      if (isFocused) {
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 8;
      }
      ctx.rotate(-Math.PI / 4.2);

      // Gold Pommel
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(0, -size * 0.45, 2.0, 0, Math.PI * 2);
      ctx.fill();

      // Dark Grip
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(-1.0, -size * 0.38, 2.0, 3.5);

      // Flared Bronze Crossguard
      ctx.fillStyle = isFocused ? '#f59e0b' : '#d97706';
      ctx.beginPath();
      ctx.moveTo(-6.0, -size * 0.20);
      ctx.lineTo(6.0, -size * 0.20);
      ctx.lineTo(7.0, -size * 0.12);
      ctx.lineTo(5.0, -size * 0.08);
      ctx.lineTo(-5.0, -size * 0.08);
      ctx.lineTo(-7.0, -size * 0.12);
      ctx.closePath();
      ctx.fill();

      // Forged Steel Blade
      const bladeGrad = ctx.createLinearGradient(-2, 0, 2, 0);
      bladeGrad.addColorStop(0, '#ffffff');
      bladeGrad.addColorStop(0.35, '#cbd5e1');
      bladeGrad.addColorStop(0.65, '#94a3b8');
      bladeGrad.addColorStop(1, '#475569');
      ctx.fillStyle = bladeGrad;
      ctx.beginPath();
      ctx.moveTo(-2.4, -size * 0.08);
      ctx.lineTo(2.4, -size * 0.08);
      ctx.lineTo(1.8, size * 0.38);
      ctx.lineTo(0, size * 0.52); // Sharpened tip
      ctx.lineTo(-1.8, size * 0.38);
      ctx.closePath();
      ctx.fill();

      // Central Fuller Channel (Fiery Ember or Cyan)
      ctx.fillStyle = isFocused ? '#ffaa00' : '#38bdf8';
      ctx.fillRect(-0.7, -size * 0.05, 1.4, size * 0.40);

      // Flanking Spark Motes
      if (isFocused) {
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(-6, Math.sin(F * 0.12) * 2, 1.2, 1.2);
        ctx.fillRect(5, -Math.sin(F * 0.12) * 2, 1.2, 1.2);
      }
      break;
    }

    case 'continue': {
      // CONTINUE: Carved Stone Descent Waypoint Stele
      // Stele Base Megalith
      ctx.fillStyle = isDisabled ? '#1e2430' : (isFocused ? '#242e42' : '#1c2230');
      ctx.beginPath();
      ctx.moveTo(-5.5, 6.5);
      ctx.lineTo(5.5, 6.5);
      ctx.lineTo(4.5, -6.5);
      ctx.lineTo(-4.5, -6.5);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = isDisabled ? '#334155' : (isFocused ? '#60a5fa' : '#475569');
      ctx.lineWidth = 1;
      ctx.stroke();

      // Inscribed Waypoint Glyph (Downward Spiral Descent)
      ctx.strokeStyle = isDisabled ? '#475569' : (isFocused ? '#38bdf8' : '#0284c7');
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(0, 3.5);
      ctx.moveTo(-2.5, 1.0);
      ctx.lineTo(0, 3.5);
      ctx.lineTo(2.5, 1.0);
      ctx.stroke();

      if (!isDisabled && isFocused) {
        ctx.fillStyle = '#67e8f9';
        ctx.beginPath();
        ctx.arc(0, -2.5, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'guide': {
      // SURVIVAL GUIDE: Sealed Field Manual Grimoire with Corner Clasps
      ctx.fillStyle = isFocused ? '#1e2436' : '#121622';
      ctx.fillRect(-6, -7, 12, 14);
      ctx.strokeStyle = isFocused ? '#fde68a' : '#ca8a04';
      ctx.lineWidth = 1.0;
      ctx.strokeRect(-6, -7, 12, 14);

      // Book Spine
      ctx.fillStyle = isFocused ? '#ca8a04' : '#78350f';
      ctx.fillRect(-6, -7, 2.5, 14);

      // Bronze Corner Clasps
      ctx.fillStyle = isFocused ? '#fde68a' : '#d97706';
      ctx.fillRect(4, -7, 2, 2);
      ctx.fillRect(4, 5, 2, 2);

      // Embossed Compass / Cross Crest
      ctx.fillStyle = isFocused ? '#ffffff' : '#fde68a';
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(2.5, 0);
      ctx.lineTo(0, 4);
      ctx.lineTo(-2.5, 0);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'sanctum': {
      // ABYSS SANCTUM: Astral Soul Crystal (Octahedral Faceted Gem)
      if (isFocused) {
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 8;
      }
      ctx.fillStyle = isFocused ? '#c084fc' : '#9333ea';
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.45);
      ctx.lineTo(-size * 0.35, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = isFocused ? '#e9d5ff' : '#c084fc';
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.45);
      ctx.lineTo(size * 0.35, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = isFocused ? '#0284c7' : '#0369a1';
      ctx.beginPath();
      ctx.moveTo(0, size * 0.45);
      ctx.lineTo(-size * 0.35, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = isFocused ? '#38bdf8' : '#0ea5e9';
      ctx.beginPath();
      ctx.moveTo(0, size * 0.45);
      ctx.lineTo(size * 0.35, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-0.8, -0.8, 1.6, 1.6);
      break;
    }

    case 'codex': {
      // CODEX & BESTIARY: Bestiary Beast Skull Crest
      ctx.fillStyle = isFocused ? '#f8fafc' : '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(-6, -4);
      ctx.lineTo(-4, -6.5);
      ctx.lineTo(0, -3.5);
      ctx.lineTo(4, -6.5);
      ctx.lineTo(6, -4);
      ctx.lineTo(4, 1);
      ctx.lineTo(2, 5.5);
      ctx.lineTo(-2, 5.5);
      ctx.lineTo(-4, 1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = isFocused ? '#a855f7' : '#0f172a';
      ctx.fillRect(-3, -1.5, 1.8, 2.2);
      ctx.fillRect(1.2, -1.5, 1.8, 2.2);
      ctx.fillStyle = '#020617';
      ctx.fillRect(-0.8, 2, 1.6, 2);
      break;
    }

    case 'archive': {
      // ARCHIVE OF MEMORIES: Archival Memory Crystal / Orb of Recollection
      if (isFocused) {
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 8;
      }
      // Outer bronze crescent cradle
      ctx.strokeStyle = isFocused ? '#fde68a' : '#ca8a04';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, 6.2, Math.PI * 0.2, Math.PI * 1.8);
      ctx.stroke();

      // Deep violet memory orb core
      ctx.fillStyle = isFocused ? '#9333ea' : '#6b21a8';
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Ethereal ocular pupil & inner starlight
      ctx.fillStyle = isFocused ? '#e9d5ff' : '#c084fc';
      ctx.beginPath();
      ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-0.8, -0.8, 1.6, 1.6);
      ctx.shadowBlur = 0;
      break;
    }

    case 'achievements': {
      // ACHIEVEMENTS: Carved Heraldic Laurel Medallion
      ctx.fillStyle = isFocused ? '#f59e0b' : '#b45309';
      ctx.beginPath();
      ctx.arc(0, 0, 6.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#060a18';
      ctx.beginPath();
      ctx.arc(0, 0, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isFocused ? '#fef08a' : '#ca8a04';
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(1.2, -1.2);
      ctx.lineTo(4, 0);
      ctx.lineTo(1.2, 1.2);
      ctx.lineTo(0, 4);
      ctx.lineTo(-1.2, 1.2);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-1.2, -1.2);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'settings': {
      // SETTINGS: Rune-Etched Mechanical Cogwheel
      ctx.fillStyle = isFocused ? '#fde68a' : '#64748b';
      for (let t = 0; t < 8; t++) {
        const ang = (t / 8) * Math.PI * 2 + (isFocused ? F * 0.02 : 0);
        const tx = Math.cos(ang) * 5.8;
        const ty = Math.sin(ang) * 5.8;
        ctx.fillRect(tx - 1.2, ty - 1.2, 2.4, 2.4);
      }
      ctx.beginPath();
      ctx.arc(0, 0, 4.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0a0f1d';
      ctx.beginPath();
      ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'credits': {
      // VIEW CREDITS: Open Illuminated Archival Tome with Ribbon
      ctx.fillStyle = isFocused ? '#2e2640' : '#1a1626';
      // Left Page
      ctx.beginPath();
      ctx.moveTo(-6.5, -4.5);
      ctx.lineTo(-1.0, -5.5);
      ctx.lineTo(-1.0, 4.5);
      ctx.lineTo(-6.5, 3.5);
      ctx.closePath();
      ctx.fill();
      // Right Page
      ctx.beginPath();
      ctx.moveTo(6.5, -4.5);
      ctx.lineTo(1.0, -5.5);
      ctx.lineTo(1.0, 4.5);
      ctx.lineTo(6.5, 3.5);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = isFocused ? '#fde68a' : '#94a3b8';
      ctx.lineWidth = 1.0;
      ctx.strokeRect(-6.5, -5.0, 13, 9.5);

      // Golden Bookmark Ribbon
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-0.6, -5.5, 1.2, 11);
      break;
    }

    case 'the_last_ember': {
      // THE LAST EMBER: Sacred Living Flame Teardrop in Filigree
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(0, 0, 5.8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 3.5 * pulse, 4.5 * pulse, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -0.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}

function drawRegaliaButton(ctx, cfg, x, y, w, h, isFocused, isHovered, isDisabled, isGift, F, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;

  const isPrimary = cfg.primary;
  const isSelected = isFocused && !isDisabled;
  const isPressed = (isFocused || isHovered) && !isDisabled && InputManager.MOUSE_STATE && InputManager.MOUSE_STATE.isDown;
  const stateKey = ButtonArtManager.getStateKey(isPrimary, isGift, isDisabled, isFocused, isHovered, isPressed);
  const chamfer = isPrimary ? 5 : 4;
  const pressDy = isPressed ? 1 : 0;
  const isReducedMotion = (typeof GameState !== 'undefined' && GameState.REDUCED_MOTION);

  // 1. Physical Drop Shadow
  ctx.fillStyle = 'rgba(1, 2, 6, 0.75)';
  drawChamferedPanel(ctx, x, y + 2, w, h, chamfer);
  ctx.fill();

  // 2. Render Handcrafted 9-Slice Pixel-Art Button Surface
  const renderedFromImage = ButtonArtManager.drawButton(ctx, stateKey, x, y, w, h);

  if (!renderedFromImage) {
    // Procedural Fallback matching 16-bit forged metal craftsmanship
    const baseGrad = ctx.createLinearGradient(x, y, x, y + h);
    if (isDisabled) {
      baseGrad.addColorStop(0, '#10141c');
      baseGrad.addColorStop(1, '#080a0f');
    } else if (isFocused) {
      if (isPrimary) {
        baseGrad.addColorStop(0, '#24140a');
        baseGrad.addColorStop(0.5, '#150c07');
        baseGrad.addColorStop(1, '#090510');
      } else if (isGift) {
        baseGrad.addColorStop(0, '#220e2a');
        baseGrad.addColorStop(1, '#0a0514');
      } else {
        baseGrad.addColorStop(0, '#1a142c');
        baseGrad.addColorStop(1, '#090a18');
      }
    } else if (isHovered) {
      baseGrad.addColorStop(0, '#181e30');
      baseGrad.addColorStop(1, '#0a0d18');
    } else {
      baseGrad.addColorStop(0, '#141726');
      baseGrad.addColorStop(0.5, '#0c0f1a');
      baseGrad.addColorStop(1, '#070914');
    }
    ctx.fillStyle = baseGrad;
    drawChamferedPanel(ctx, x, y, w, h, chamfer);
    ctx.fill();

    // Outer Beveled Metal Frame
    if (isFocused) {
      ctx.shadowColor = isPrimary ? '#f59e0b' : (isGift ? '#c084fc' : '#f59e0b');
      ctx.shadowBlur = isPrimary ? 10 : 7;
      const frameGrad = ctx.createLinearGradient(x, y, x + w, y + h);
      if (isPrimary) {
        frameGrad.addColorStop(0, '#fef08a');
        frameGrad.addColorStop(0.3, '#f59e0b');
        frameGrad.addColorStop(0.7, '#d97706');
        frameGrad.addColorStop(1, '#b45309');
      } else if (isGift) {
        frameGrad.addColorStop(0, '#fef08a');
        frameGrad.addColorStop(0.4, '#c084fc');
        frameGrad.addColorStop(1, '#7e22ce');
      } else {
        frameGrad.addColorStop(0, '#fef08a');
        frameGrad.addColorStop(0.3, '#f59e0b');
        frameGrad.addColorStop(0.7, '#b45309');
        frameGrad.addColorStop(1, '#78350f');
      }
      ctx.strokeStyle = frameGrad;
      ctx.lineWidth = isPrimary ? 1.6 : 1.3;
      drawChamferedPanel(ctx, x, y, w, h, chamfer);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (isHovered && !isDisabled) {
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.85)';
      ctx.lineWidth = 1.2;
      drawChamferedPanel(ctx, x, y, w, h, chamfer);
      ctx.stroke();
    } else if (isDisabled) {
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.40)';
      ctx.lineWidth = 1.0;
      drawChamferedPanel(ctx, x, y, w, h, chamfer);
      ctx.stroke();
    } else {
      ctx.strokeStyle = isPrimary ? 'rgba(217, 119, 6, 0.70)' : 'rgba(71, 85, 105, 0.55)';
      ctx.lineWidth = isPrimary ? 1.4 : 1.0;
      drawChamferedPanel(ctx, x, y, w, h, chamfer);
      ctx.stroke();
    }

    // Stepped Corner Rivets (4 Corners)
    const rivetOffset = chamfer + 2;
    const rivets = [
      [x + rivetOffset, y + 2.5],
      [x + w - rivetOffset, y + 2.5],
      [x + rivetOffset, y + h - 2.5],
      [x + w - rivetOffset, y + h - 2.5]
    ];
    ctx.fillStyle = isFocused ? '#fde68a' : (isDisabled ? '#283142' : '#b45309');
    for (const [rx, ry] of rivets) {
      ctx.beginPath();
      ctx.arc(rx, ry, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3. START JOURNEY — SIGNATURE MOLTEN FORGE CRACKS (ONLY WHEN SELECTED)
  if (isPrimary && isSelected) {
    drawForgeEmberCracks(ctx, x, y, w, h, F, isReducedMotion);
  }

  // 4. Subtle traveling specular glint across focused button top rim
  if (isSelected && !isReducedMotion) {
    const sweepProgress = ((F * 1.6) % (w + 100)) - 50;
    const sweepX = x + sweepProgress;
    const sweepGrad = ctx.createLinearGradient(sweepX - 25, y, sweepX + 25, y + h);
    sweepGrad.addColorStop(0, 'rgba(254, 240, 138, 0)');
    sweepGrad.addColorStop(0.5, isPrimary ? 'rgba(254, 240, 138, 0.22)' : 'rgba(254, 240, 138, 0.14)');
    sweepGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.save();
    ctx.beginPath();
    drawChamferedPanel(ctx, x + 2, y + 2, w - 4, h - 4, chamfer - 1);
    ctx.clip();
    ctx.fillStyle = sweepGrad;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  // 5. Left Heraldic Icon Chamber
  const chamberSize = h - 6;
  const chamberX = x + 5;
  const chamberY = y + Math.round((h - chamberSize) / 2) + pressDy;
  ctx.fillStyle = isDisabled ? 'rgba(4, 6, 10, 0.85)' : (isFocused ? 'rgba(14, 10, 22, 0.94)' : 'rgba(6, 8, 16, 0.85)');
  drawChamferedPanel(ctx, chamberX, chamberY, chamberSize, chamberSize, 2);
  ctx.fill();

  ctx.strokeStyle = isFocused
    ? (isPrimary ? 'rgba(245, 158, 11, 0.85)' : 'rgba(245, 158, 11, 0.65)')
    : (isDisabled ? 'rgba(30, 41, 59, 0.45)' : 'rgba(71, 85, 105, 0.50)');
  ctx.lineWidth = 0.8;
  drawChamferedPanel(ctx, chamberX, chamberY, chamberSize, chamberSize, 2);
  ctx.stroke();

  // Draw Pixel Insignia inside Chamber
  drawRegaliaIcon(
    ctx,
    cfg.id,
    chamberX + chamberSize / 2,
    chamberY + chamberSize / 2,
    chamberSize * 0.74,
    isFocused,
    isHovered,
    isDisabled,
    isGift,
    F
  );

  // 6. Main Text Label
  const textX = chamberX + chamberSize + 11;
  const textY = y + h / 2 + pressDy;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // Crisp Drop Shadow
  ctx.fillStyle = '#010204';
  ctx.font = isPrimary
    ? 'bold 14.5px Cinzel, serif'
    : (isFocused ? 'bold 13.5px Cinzel, serif' : '600 13px Cinzel, serif');
  ctx.fillText(cfg.label, textX + 1.2, textY + 1.2);

  // Foreground Label
  if (isDisabled) {
    ctx.fillStyle = '#475569';
  } else if (isFocused) {
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = isPrimary ? '#f59e0b' : (isGift ? '#c084fc' : '#fef08a');
    ctx.shadowBlur = isPrimary ? 10 : 8;
  } else if (isHovered) {
    ctx.fillStyle = '#f8fafc';
    ctx.shadowColor = 'rgba(254, 240, 138, 0.45)';
    ctx.shadowBlur = 4;
  } else if (isPrimary) {
    ctx.fillStyle = '#fef3c7'; // Dignified warm ivory-gold for primary
  } else if (isGift) {
    ctx.fillStyle = '#e9d5ff'; // Soft amethyst ivory for gift
  } else {
    ctx.fillStyle = '#ede8df'; // Readable warm ivory for standard unselected
  }
  ctx.fillText(cfg.label, textX, textY);
  ctx.shadowBlur = 0;

  // 7. Right Subtitle Badge or Action Hint
  if (cfg.sub) {
    const hasRightGlyph = isFocused;
    const subX = hasRightGlyph ? (x + w - 24) : (x + w - 10);

    ctx.textAlign = 'right';
    ctx.font = 'italic 10.5px "Crimson Text", serif';
    ctx.fillStyle = isFocused
      ? '#fde68a'
      : (isGift ? '#d8b4fe' : (isDisabled ? '#475569' : '#cbd5e1'));
    ctx.fillText(cfg.sub, subX, textY + 0.5);
  }

  // 8. RIGHT DIRECTIONAL MARKER (▶) ONLY ON THE CURRENTLY SELECTED BUTTON
  if (isFocused) {
    const breathe = isReducedMotion ? 0 : Math.sin(F * 0.1) * 1.0;
    const markerX = x + w - 12 + breathe;
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = isGift ? '#f59e0b' : '#fde68a';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 6;
    ctx.fillText(isGift ? '✦' : '▶', markerX, textY);
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

function drawStatusPlaques(ctx, x, y, souls, prestige, F, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;

  const plaqueH = 26;
  const plaque1W = 141;
  const plaque2W = 141;
  const gap = 10;

  // ── 1. SOULS PLAQUE ──
  const sX = x;
  const sY = y;
  ctx.fillStyle = 'rgba(1, 2, 6, 0.65)';
  drawChamferedPanel(ctx, sX, sY + 2, plaque1W, plaqueH, 3);
  ctx.fill();

  const sGrad = ctx.createLinearGradient(sX, sY, sX, sY + plaqueH);
  sGrad.addColorStop(0, '#1c142c');
  sGrad.addColorStop(1, '#090614');
  ctx.fillStyle = sGrad;
  drawChamferedPanel(ctx, sX, sY, plaque1W, plaqueH, 3);
  ctx.fill();
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.55)';
  ctx.lineWidth = 1;
  drawChamferedPanel(ctx, sX, sY, plaque1W, plaqueH, 3);
  ctx.stroke();

  // Soul Crystal Icon
  ctx.fillStyle = '#c084fc';
  ctx.beginPath();
  ctx.moveTo(sX + 11, sY + 7);
  ctx.lineTo(sX + 15, sY + 13);
  ctx.lineTo(sX + 11, sY + 19);
  ctx.lineTo(sX + 7, sY + 13);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(sX + 10.5, sY + 12.5, 1, 1);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 9px Cinzel, serif';
  ctx.fillStyle = '#c084fc';
  ctx.fillText('SOULS', sX + 20, sY + plaqueH / 2);

  // Recessed count box
  ctx.fillStyle = 'rgba(4, 3, 8, 0.75)';
  ctx.fillRect(sX + 70, sY + 3, plaque1W - 76, plaqueH - 6);
  ctx.strokeStyle = 'rgba(126, 34, 206, 0.25)';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(sX + 70, sY + 3, plaque1W - 76, plaqueH - 6);

  ctx.textAlign = 'right';
  ctx.font = 'bold 11px Cinzel, serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(souls.toLocaleString(), sX + plaque1W - 10, sY + plaqueH / 2);

  // ── 2. PRESTIGE PLAQUE ──
  const pX = sX + plaque1W + gap;
  const pY = y;
  ctx.fillStyle = 'rgba(1, 2, 6, 0.65)';
  drawChamferedPanel(ctx, pX, pY + 2, plaque2W, plaqueH, 3);
  ctx.fill();

  const pGrad = ctx.createLinearGradient(pX, pY, pX, pY + plaqueH);
  pGrad.addColorStop(0, '#281a0e');
  pGrad.addColorStop(1, '#0c0704');
  ctx.fillStyle = pGrad;
  drawChamferedPanel(ctx, pX, pY, plaque2W, plaqueH, 3);
  ctx.fill();
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.60)';
  ctx.lineWidth = 1;
  drawChamferedPanel(ctx, pX, pY, plaque2W, plaqueH, 3);
  ctx.stroke();

  // Prestige Crown Icon
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.moveTo(pX + 8, pY + 16);
  ctx.lineTo(pX + 18, pY + 16);
  ctx.lineTo(pX + 17, pY + 10);
  ctx.lineTo(pX + 14.5, pY + 13);
  ctx.lineTo(pX + 13, pY + 9);
  ctx.lineTo(pX + 11.5, pY + 13);
  ctx.lineTo(pX + 9, pY + 10);
  ctx.closePath();
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 9px Cinzel, serif';
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('PRESTIGE', pX + 21, pY + plaqueH / 2);

  // Recessed count box
  ctx.fillStyle = 'rgba(8, 5, 3, 0.75)';
  ctx.fillRect(pX + 82, pY + 3, plaque2W - 88, plaqueH - 6);
  ctx.strokeStyle = 'rgba(180, 83, 9, 0.25)';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(pX + 84, pY + 3, plaque2W - 90, plaqueH - 6);

  ctx.textAlign = 'right';
  ctx.font = 'bold 11px Cinzel, serif';
  ctx.fillStyle = '#fef08a';
  ctx.fillText(prestige.toLocaleString(), pX + plaque2W - 10, pY + plaqueH / 2);

  ctx.restore();
}

function drawPersonalRecords(ctx, alpha, F) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;

  // Position in upper-right cavern sky, comfortably clear of portal & Rowan
  const plaqueH = 34;
  const p1W = 126; // BEST CLEAR
  const p2W = 152; // DEATHS IN THE ABYSS
  const gap = 8;
  const totalW = p1W + p2W + gap;
  const topY = 16;
  const startX = LW - 24 - totalW;

  // 1. Authoritative Data Retrieval
  const bestSeconds = (typeof SaveSystem !== 'undefined' && SaveSystem.getBestRunTime)
    ? SaveSystem.getBestRunTime()
    : (GameState.BEST_RUN_TIME || null);

  let bestClearText = 'NONE';
  let hasBestClear = false;
  if (typeof bestSeconds === 'number' && !isNaN(bestSeconds) && bestSeconds > 0) {
    hasBestClear = true;
    const mins = Math.floor(bestSeconds / 60);
    const secs = Math.floor(bestSeconds % 60);
    bestClearText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  const deaths = (typeof SaveSystem !== 'undefined' && SaveSystem.getLifetimeDeaths)
    ? SaveSystem.getLifetimeDeaths()
    : ((typeof GameState !== 'undefined' && typeof GameState.LIFETIME_DEATHS === 'number')
      ? GameState.LIFETIME_DEATHS
      : 0);
  const deathsText = deaths.toLocaleString();

  // ─────────────────────────────────────────────────────────────
  // PLAQUE 1: BEST CLEAR
  // ─────────────────────────────────────────────────────────────
  const p1X = startX;
  const p1Y = topY;

  // Drop Shadow
  ctx.fillStyle = 'rgba(1, 2, 6, 0.70)';
  drawChamferedPanel(ctx, p1X, p1Y + 2, p1W, plaqueH, 3);
  ctx.fill();

  // Dark Obsidian/Violet Backing
  const p1Grad = ctx.createLinearGradient(p1X, p1Y, p1X, p1Y + plaqueH);
  p1Grad.addColorStop(0, '#1c1626');
  p1Grad.addColorStop(0.5, '#120d1c');
  p1Grad.addColorStop(1, '#08050e');
  ctx.fillStyle = p1Grad;
  drawChamferedPanel(ctx, p1X, p1Y, p1W, plaqueH, 3);
  ctx.fill();

  // Fine Antique-Gold Border
  ctx.strokeStyle = hasBestClear ? 'rgba(217, 119, 6, 0.75)' : 'rgba(168, 85, 247, 0.45)';
  ctx.lineWidth = 1.0;
  drawChamferedPanel(ctx, p1X, p1Y, p1W, plaqueH, 3);
  ctx.stroke();

  // Corner Rivets
  ctx.fillStyle = hasBestClear ? '#f59e0b' : '#78350f';
  for (const [rx, ry] of [
    [p1X + 4, p1Y + 4],
    [p1X + p1W - 4, p1Y + 4],
    [p1X + 4, p1Y + plaqueH - 4],
    [p1X + p1W - 4, p1Y + plaqueH - 4]
  ]) {
    ctx.fillRect(rx - 0.7, ry - 0.7, 1.4, 1.4);
  }

  // Antique Chronometer / Hourglass Icon (Gold)
  const cX = p1X + 17;
  const cY = p1Y + plaqueH / 2;
  ctx.save();
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(cX, cY, 6.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0a0d18';
  ctx.beginPath();
  ctx.arc(cX, cY, 4.8, 0, Math.PI * 2);
  ctx.fill();

  // Watch Winding Crown at top
  ctx.fillStyle = '#fde68a';
  ctx.fillRect(cX - 1.2, cY - 8.2, 2.4, 1.8);

  // Hourglass / Clock hands
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(cX, cY);
  ctx.lineTo(cX, cY - 3.2); // 12 o'clock minute hand
  ctx.moveTo(cX, cY);
  ctx.lineTo(cX + 2.4, cY); // 3 o'clock hour hand
  ctx.stroke();

  // Center jewel
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cX - 0.6, cY - 0.6, 1.2, 1.2);
  ctx.restore();

  // Label: BEST CLEAR
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = 'bold 8px Cinzel, serif';
  ctx.fillStyle = '#d97706';
  ctx.fillText('BEST CLEAR', p1X + 30, p1Y + 13);

  // Value: mm:ss or NONE
  ctx.font = hasBestClear ? 'bold 13px Cinzel, serif' : 'bold 11.5px Cinzel, serif';
  if (hasBestClear) {
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = 'rgba(245, 158, 11, 0.45)';
    ctx.shadowBlur = 5;
    ctx.fillText(bestClearText, p1X + 30, p1Y + 28);
    ctx.shadowBlur = 0;
  } else {
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(bestClearText, p1X + 30, p1Y + 27.5);
  }

  // ─────────────────────────────────────────────────────────────
  // PLAQUE 2: DEATHS IN THE ABYSS
  // ─────────────────────────────────────────────────────────────
  const p2X = p1X + p1W + gap;
  const p2Y = topY;

  // Drop Shadow
  ctx.fillStyle = 'rgba(1, 2, 6, 0.70)';
  drawChamferedPanel(ctx, p2X, p2Y + 2, p2W, plaqueH, 3);
  ctx.fill();

  // Dark Obsidian/Muted Crimson Backing
  const p2Grad = ctx.createLinearGradient(p2X, p2Y, p2X, p2Y + plaqueH);
  p2Grad.addColorStop(0, '#221318');
  p2Grad.addColorStop(0.5, '#160b10');
  p2Grad.addColorStop(1, '#0a0508');
  ctx.fillStyle = p2Grad;
  drawChamferedPanel(ctx, p2X, p2Y, p2W, plaqueH, 3);
  ctx.fill();

  // Fine Restrained Crimson/Bronze Border
  ctx.strokeStyle = 'rgba(185, 28, 28, 0.65)';
  ctx.lineWidth = 1.0;
  drawChamferedPanel(ctx, p2X, p2Y, p2W, plaqueH, 3);
  ctx.stroke();

  // Corner Rivets
  ctx.fillStyle = '#991b1b';
  for (const [rx, ry] of [
    [p2X + 4, p2Y + 4],
    [p2X + p2W - 4, p2Y + 4],
    [p2X + 4, p2Y + plaqueH - 4],
    [p2X + p2W - 4, p2Y + plaqueH - 4]
  ]) {
    ctx.fillRect(rx - 0.7, ry - 0.7, 1.4, 1.4);
  }

  // Abyssal Skull / Ossuary Icon (Crimson / Bone)
  const sX = p2X + 17;
  const sY = p2Y + plaqueH / 2;
  ctx.save();
  // Stylized Cranium
  ctx.fillStyle = '#f87171';
  ctx.beginPath();
  ctx.arc(sX, sY - 1.5, 5.2, Math.PI, 0, false);
  ctx.lineTo(sX + 4.0, sY + 2.5);
  ctx.lineTo(sX + 2.5, sY + 5.0);
  ctx.lineTo(sX - 2.5, sY + 5.0);
  ctx.lineTo(sX - 4.0, sY + 2.5);
  ctx.closePath();
  ctx.fill();

  // Eye Sockets (Dark Abyssal Voids)
  ctx.fillStyle = '#100508';
  ctx.beginPath();
  ctx.arc(sX - 2.0, sY, 1.3, 0, Math.PI * 2);
  ctx.arc(sX + 2.0, sY, 1.3, 0, Math.PI * 2);
  ctx.fill();

  // Nasal Cavity
  ctx.fillRect(sX - 0.5, sY + 1.2, 1.0, 1.5);

  // Tiny Teeth slits
  ctx.strokeStyle = '#100508';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(sX - 1.2, sY + 3.8);
  ctx.lineTo(sX - 1.2, sY + 4.8);
  ctx.moveTo(sX + 1.2, sY + 3.8);
  ctx.lineTo(sX + 1.2, sY + 4.8);
  ctx.stroke();
  ctx.restore();

  // Label: DEATHS IN THE ABYSS
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = 'bold 8px Cinzel, serif';
  ctx.fillStyle = '#f87171';
  ctx.fillText('DEATHS IN THE ABYSS', p2X + 30, p2Y + 13);

  // Value: Persisted count
  ctx.font = 'bold 13px Cinzel, serif';
  ctx.fillStyle = '#fca5a5';
  ctx.shadowColor = 'rgba(239, 68, 68, 0.40)';
  ctx.shadowBlur = 5;
  ctx.fillText(deathsText, p2X + 30, p2Y + 28);
  ctx.shadowBlur = 0;

  // ─────────────────────────────────────────────────────────────
  // PLAQUE 3: IMMERSIVE / FULLSCREEN TOGGLE
  // ─────────────────────────────────────────────────────────────
  const p3W = 126;
  const p3H = plaqueH;
  const p3X = (p1X - p3W - gap >= 400) ? (p1X - p3W - gap) : p1X;
  const p3Y = (p1X - p3W - gap >= 400) ? topY : (topY + plaqueH + gap);

  _fullscreenBtnRect = { x: p3X, y: p3Y, w: p3W, h: p3H };

  const isFull = FullscreenHelper.isFullscreen();
  const mouseX = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.mx : -999;
  const mouseY = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.my : -999;
  const isHovered = mouseX >= p3X && mouseX <= p3X + p3W && mouseY >= p3Y && mouseY <= p3Y + p3H;

  // Drop Shadow
  ctx.fillStyle = 'rgba(1, 2, 6, 0.70)';
  drawChamferedPanel(ctx, p3X, p3Y + 2, p3W, p3H, 3);
  ctx.fill();

  // Dark Obsidian/Amber Backing
  const p3Grad = ctx.createLinearGradient(p3X, p3Y, p3X, p3Y + p3H);
  p3Grad.addColorStop(0, isHovered ? '#261e38' : '#1a1426');
  p3Grad.addColorStop(0.5, isHovered ? '#1a102a' : '#100a1c');
  p3Grad.addColorStop(1, '#08050e');
  ctx.fillStyle = p3Grad;
  drawChamferedPanel(ctx, p3X, p3Y, p3W, p3H, 3);
  ctx.fill();

  // Antique Gold / Amethyst Border
  ctx.strokeStyle = isFull ? 'rgba(245, 158, 11, 0.9)' : (isHovered ? 'rgba(217, 119, 6, 0.8)' : 'rgba(168, 85, 247, 0.55)');
  ctx.lineWidth = isHovered ? 1.4 : 1.0;
  drawChamferedPanel(ctx, p3X, p3Y, p3W, p3H, 3);
  ctx.stroke();

  // Corner Rivets
  ctx.fillStyle = isFull ? '#ffd700' : '#ca8a04';
  for (const [rx, ry] of [
    [p3X + 4, p3Y + 4],
    [p3X + p3W - 4, p3Y + 4],
    [p3X + 4, p3Y + p3H - 4],
    [p3X + p3W - 4, p3Y + p3H - 4]
  ]) {
    ctx.fillRect(rx - 0.7, ry - 0.7, 1.4, 1.4);
  }

  // Fullscreen Expand Icon
  const fsIconX = p3X + 17;
  const fsIconY = p3Y + p3H / 2;
  ctx.save();
  ctx.strokeStyle = isFull ? '#ffd700' : '#fde68a';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(fsIconX - 6, fsIconY - 6, 12, 12);
  ctx.fillStyle = isFull ? '#ffd700' : '#ca8a04';
  ctx.fillRect(fsIconX - 6, fsIconY - 6, 3, 3);
  ctx.fillRect(fsIconX + 3, fsIconY - 6, 3, 3);
  ctx.fillRect(fsIconX - 6, fsIconY + 3, 3, 3);
  ctx.fillRect(fsIconX + 3, fsIconY + 3, 3, 3);
  ctx.restore();

  // Label & Subtitle
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = 'bold 8px Cinzel, serif';
  ctx.fillStyle = isFull ? '#ffd700' : '#c084fc';
  ctx.fillText(isFull ? 'FULLSCREEN ACTIVE' : 'IMMERSIVE MODE', p3X + 30, p3Y + 13);

  ctx.font = 'bold 10.5px Cinzel, serif';
  ctx.fillStyle = isFull ? '#fef08a' : '#fde68a';
  ctx.fillText(isFull ? '⛶ WINDOWED' : '⛶ EXPAND', p3X + 30, p3Y + 27);

  ctx.restore();
}

export function startGame(playIntro = true) {
  AudioManager.init();
  if (!playIntro) {
    MusicManager.crossfade('exploration', 1.2, 0.65);
  } else {
    // Keep/fadeIn the majestic cathedral title theme across the descent cinematic
    MusicManager.fadeIn('menu', 1.2, 0.72);
  }
  SoundManager.snd('menu_select');
  _howToPlayActive = false;
  _loadoutModalOpen = false;

  UITransitionManager.transitionTo(() => {
    RunResetManager.resetRun({ playIntro, isDeveloperExpedition: false });
  }, 0.45);
}

export function openTrainingDungeon() {
  AudioManager.init();
  SoundManager.snd('panel_open');
  _howToPlayActive = true;
}

export function resumeSavedRun() {
  if (!SaveSystem.hasResumableRun()) {
    SaveSystem.clearRun();
    SoundManager.snd('error_disabled');
    return false;
  }

  const sv = SaveSystem.loadRun();
  if (sv && sv.lv) {
    AudioManager.init();
    MusicManager.crossfade('exploration', 1.5, 0.65);
    SoundManager.snd('menu_select');
    _howToPlayActive = false;

    UITransitionManager.transitionTo(() => {
      GameState.CINEMATIC_ACTIVE = false;
      GameState.resetPlayer();
      GameState.LV = sv.lv || 1;

      // Authoritative reset of all death, dying, pose, and transient flags
      const P = GameState.P;
      if (P) {
        P.dead = false;
        P.dying = false;
        P.cinematicPose = null;
        P.deathCause = null;
        P.deathTimer = 0;
        P.invulnerable = false;
        P.attacking = false;
        P.dashing = false;
        P.animState = 'idle';
        P.weaponLowered = false;
        P.vx = 0;
        P.vy = 0;
        P.acd = 0;
        P.aanim = 0;
        P.dcd = 0;

        if (sv.hp !== undefined && sv.hp > 0) P.hp = sv.hp;
        if (sv.maxHp !== undefined && sv.maxHp > 0) P.maxHp = sv.maxHp;
        // Never restore a player with <= 0 sanity: clamp to positive or maxSan
        if (sv.san !== undefined && sv.san > 0) {
          P.san = Math.max(20, sv.san);
        } else {
          P.san = P.maxSan || 100;
        }
        if (sv.wep) P.wep = sv.wep;
        if (sv.saved !== undefined) P.saved = sv.saved;
        if (sv.killed !== undefined) P.killed = sv.killed;
        if (sv.weaponSlots) GameState.weaponSlots = sv.weaponSlots;
        if (sv.activeSlot !== undefined) GameState.activeWeaponSlot = sv.activeSlot;
        if (sv.relics) P.relics = sv.relics;
      }

      FloorManager.loadLevel(GameState.LV);
      GameState.RUN_ACTIVE_TIME = sv.runActiveTime || 0;
      GameState.FLOOR_ACTIVE_TIME = sv.floorActiveTime || 0;
      GameState.CURRENT_RUN_SURVIVORS = sv.currentRunSurvivors || { eligible: [], rescued: [] };
      GameState.IS_DEVELOPER_EXPEDITION = !!sv.isDeveloperExpedition;
      GameState.setState(GameStates.PLAYING);
      SoundManager.snd('portal_enter');
      triggerCinematicBanner(`FLOOR ${GameState.LV}`, 'Resuming your harrowing descent...');
    }, 0.45);
    return true;
  }
  SaveSystem.clearRun();
  SoundManager.snd('error_disabled');
  return false;
}

function drawPreDescentLoadoutModal(ctx, dt, mouseX, mouseY) {
  ctx.save();
  ctx.fillStyle = 'rgba(2, 4, 10, 0.88)';
  ctx.fillRect(0, 0, LW, LH);

  const mw = 560, mh = 340;
  const mx = Math.round((LW - mw) / 2);
  const my = Math.round((LH - mh) / 2);

  // Obsidian & bronze chassis
  ctx.fillStyle = 'rgba(7, 10, 22, 0.98)';
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.85)';
  ctx.lineWidth = 1.6;
  roundRect(ctx, mx, my, mw, mh, 8);
  ctx.fill(); ctx.stroke();

  ctx.strokeStyle = 'rgba(253, 230, 138, 0.35)';
  ctx.lineWidth = 1;
  roundRect(ctx, mx + 4, my + 4, mw - 8, mh - 8, 6);
  ctx.stroke();

  // Header
  ctx.font = 'bold 15px Cinzel, serif';
  ctx.fillStyle = '#fde68a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.shadowColor = '#d97706';
  ctx.shadowBlur = 8;
  ctx.fillText('◈ PRE-DESCENT ARSENAL LOADOUT ◈', mx + mw / 2, my + 16);
  ctx.shadowBlur = 0;

  ctx.font = 'italic 11px "Crimson Text", Georgia, serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText("Select Rowan's starting blade & rarity for this standard expedition.", mx + mw / 2, my + 34);

  // 1. Weapon Selection Row
  const wepY = my + 56;
  const wepKeys = WEAPON_KEYS;
  const cardW = Math.round((mw - 40 - (wepKeys.length - 1) * 8) / wepKeys.length);
  const cardH = 54;

  wepKeys.forEach((wid, idx) => {
    const wx = mx + 20 + idx * (cardW + 8);
    const wdata = WEAPON_TYPES[wid];
    const isSelected = _loadoutWeaponId === wid;
    const isHover = mouseX >= wx && mouseX <= wx + cardW && mouseY >= wepY && mouseY <= wepY + cardH;

    ctx.fillStyle = isSelected ? 'rgba(217, 119, 6, 0.28)' : (isHover ? 'rgba(30, 41, 59, 0.7)' : 'rgba(15, 23, 42, 0.6)');
    ctx.strokeStyle = isSelected ? '#fde68a' : (isHover ? '#94a3b8' : 'rgba(71, 85, 105, 0.45)');
    ctx.lineWidth = isSelected ? 1.5 : 1;
    roundRect(ctx, wx, wepY, cardW, cardH, 4);
    ctx.fill(); ctx.stroke();

    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(wdata.icon || '⚔️', wx + cardW / 2, wepY + 6);

    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.fillStyle = isSelected ? '#ffffff' : '#cbd5e1';
    ctx.fillText(wdata.name.split(' ')[0], wx + cardW / 2, wepY + 32);
  });

  // 2. Rarity Selection Row
  const rarY = wepY + cardH + 12;
  const rarList = ['Common', 'Rare', 'Epic', 'Legendary'];
  const rarW = Math.round((mw - 40 - (rarList.length - 1) * 8) / rarList.length);
  const rarH = 28;

  rarList.forEach((rname, idx) => {
    const rx = mx + 20 + idx * (rarW + 8);
    const isSelected = _loadoutRarity === rname;
    const rObj = RARITIES.find(r => r.name === rname) || { col: '#94a3b8' };
    const isHover = mouseX >= rx && mouseX <= rx + rarW && mouseY >= rarY && mouseY <= rarY + rarH;

    ctx.fillStyle = isSelected ? 'rgba(217, 119, 6, 0.28)' : (isHover ? 'rgba(30, 41, 59, 0.7)' : 'rgba(15, 23, 42, 0.6)');
    ctx.strokeStyle = isSelected ? rObj.col : (isHover ? '#94a3b8' : 'rgba(71, 85, 105, 0.45)');
    ctx.lineWidth = isSelected ? 1.5 : 1;
    roundRect(ctx, rx, rarY, rarW, rarH, 4);
    ctx.fill(); ctx.stroke();

    ctx.font = 'bold 10px Cinzel, serif';
    ctx.fillStyle = isSelected ? '#ffffff' : rObj.col;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(rname.toUpperCase(), rx + rarW / 2, rarY + rarH / 2);
  });

  // 3. Live Weapon Preview Box
  const prevY = rarY + rarH + 12;
  const prevH = 68;
  ctx.fillStyle = 'rgba(10, 15, 30, 0.75)';
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.4)';
  ctx.lineWidth = 1;
  roundRect(ctx, mx + 20, prevY, mw - 40, prevH, 4);
  ctx.fill(); ctx.stroke();

  const previewWep = WeaponFactory.create(_loadoutWeaponId, _loadoutRarity);
  if (previewWep) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 13px Cinzel, serif';
    ctx.fillStyle = previewWep.rarity.col || '#ffffff';
    ctx.fillText(`${previewWep.icon} ${previewWep.name} [${previewWep.rarity.name}]`, mx + 34, prevY + 10);

    ctx.font = '10.5px monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`• DAMAGE: ${previewWep.damage.toFixed(1)} DMG   • COOLDOWN: ${(previewWep.cooldown * 1000).toFixed(0)} ms   • RANGE: ${previewWep.range} tiles`, mx + 34, prevY + 30);

    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.fillText('STANDARD RUN — OFFICIAL SPEEDRUN RECORDS & ACHIEVEMENTS ENABLED', mx + 34, prevY + 48);
  }

  // 4. Action Buttons: BEGIN DESCENT [ENTER], DEFAULT, CANCEL [ESC]
  const bBarY = my + mh - 44;
  const btnW = 160, btnH = 30;
  const startX = mx + mw - 20 - btnW;
  const defX = startX - 10 - 130;
  const canX = mx + 20;

  // Begin Descent
  const isHoverStart = mouseX >= startX && mouseX <= startX + btnW && mouseY >= bBarY && mouseY <= bBarY + btnH;
  ctx.fillStyle = isHoverStart ? 'rgba(217, 119, 6, 0.45)' : 'rgba(217, 119, 6, 0.25)';
  ctx.strokeStyle = isHoverStart ? '#ffffff' : '#fde68a';
  ctx.lineWidth = 1.4;
  roundRect(ctx, startX, bBarY, btnW, btnH, 4);
  ctx.fill(); ctx.stroke();
  ctx.font = 'bold 11px Cinzel, serif';
  ctx.fillStyle = isHoverStart ? '#ffffff' : '#fde68a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BEGIN DESCENT [ENTER]', startX + btnW / 2, bBarY + btnH / 2);

  // Default Loadout
  const isHoverDef = mouseX >= defX && mouseX <= defX + 130 && mouseY >= bBarY && mouseY <= bBarY + btnH;
  ctx.fillStyle = isHoverDef ? 'rgba(51, 65, 85, 0.5)' : 'rgba(15, 23, 42, 0.8)';
  ctx.strokeStyle = isHoverDef ? '#94a3b8' : 'rgba(71, 85, 105, 0.5)';
  ctx.lineWidth = 1;
  roundRect(ctx, defX, bBarY, 130, btnH, 4);
  ctx.fill(); ctx.stroke();
  ctx.font = 'bold 10px Cinzel, serif';
  ctx.fillStyle = isHoverDef ? '#ffffff' : '#94a3b8';
  ctx.fillText('DEFAULT BLADE', defX + 65, bBarY + btnH / 2);

  // Cancel [ESC]
  const isHoverCan = mouseX >= canX && mouseX <= canX + 100 && mouseY >= bBarY && mouseY <= bBarY + btnH;
  ctx.fillStyle = isHoverCan ? 'rgba(51, 65, 85, 0.5)' : 'rgba(15, 23, 42, 0.8)';
  ctx.strokeStyle = isHoverCan ? '#cbd5e1' : '#64748b';
  ctx.lineWidth = 1;
  roundRect(ctx, canX, bBarY, 100, btnH, 4);
  ctx.fill(); ctx.stroke();
  ctx.font = 'bold 10px Cinzel, serif';
  ctx.fillStyle = isHoverCan ? '#ffffff' : '#94a3b8';
  ctx.fillText('CANCEL [ESC]', canX + 50, bBarY + btnH / 2);

  ctx.restore();
}

function handleLoadoutModalClick(mx, my) {
  const mw = 560, mh = 340;
  const mxX = Math.round((LW - mw) / 2);
  const myY = Math.round((LH - mh) / 2);

  // 1. Weapon Selection Clicks
  const wepY = myY + 56;
  const wepKeys = WEAPON_KEYS;
  const cardW = Math.round((mw - 40 - (wepKeys.length - 1) * 8) / wepKeys.length);
  const cardH = 54;

  for (let i = 0; i < wepKeys.length; i++) {
    const wx = mxX + 20 + i * (cardW + 8);
    if (mx >= wx && mx <= wx + cardW && my >= wepY && my <= wepY + cardH) {
      _loadoutWeaponId = wepKeys[i];
      SoundManager.snd('menu_hover');
      return true;
    }
  }

  // 2. Rarity Selection Clicks
  const rarY = wepY + cardH + 12;
  const rarList = ['Common', 'Rare', 'Epic', 'Legendary'];
  const rarW = Math.round((mw - 40 - (rarList.length - 1) * 8) / rarList.length);
  const rarH = 28;

  for (let i = 0; i < rarList.length; i++) {
    const rx = mxX + 20 + i * (rarW + 8);
    if (mx >= rx && mx <= rx + rarW && my >= rarY && my <= rarY + rarH) {
      _loadoutRarity = rarList[i];
      SoundManager.snd('menu_hover');
      return true;
    }
  }

  // 3. Action Buttons Clicks
  const bBarY = myY + mh - 44;
  const btnW = 160, btnH = 30;
  const startX = mxX + mw - 20 - btnW;
  const defX = startX - 10 - 130;
  const canX = mxX + 20;

  // Begin Descent
  if (mx >= startX && mx <= startX + btnW && my >= bBarY && my <= bBarY + btnH) {
    GameState.IS_DEVELOPER_EXPEDITION = false;
    GameState.CUSTOM_STARTING_MAX_HP = null;
    GameState.CUSTOM_STARTING_WEAPON = { id: _loadoutWeaponId, rarity: _loadoutRarity };
    _loadoutModalOpen = false;
    SoundManager.snd('menu_select');
    startGame(true);
    return true;
  }

  // Default Blade
  if (mx >= defX && mx <= defX + 130 && my >= bBarY && my <= bBarY + btnH) {
    _loadoutWeaponId = 'sword';
    _loadoutRarity = 'Common';
    SoundManager.snd('menu_select');
    return true;
  }

  // Cancel
  if (mx >= canX && mx <= canX + 100 && my >= bBarY && my <= bBarY + btnH) {
    _loadoutModalOpen = false;
    SoundManager.snd('panel_close');
    return true;
  }

  // Click outside modal
  if (mx < mxX || mx > mxX + mw || my < myY || my > myY + mh) {
    _loadoutModalOpen = false;
    SoundManager.snd('panel_close');
    return true;
  }

  return true;
}

export const MainMenu = {
  navigateFocus(delta) {
    if (_giftModalOpen) return;
    if (_howToPlayActive) {
      _fieldGuideChapter = (_fieldGuideChapter + delta + 6) % 6;
      SoundManager.snd('menu_hover');
      return;
    }
    if (_titleBtns.length === 0) return;
    _lastInputMode = 'keyboard';
    _lastHoveredIndex = -1;
    const oldIdx = _focusedIndex;
    _focusedIndex = (_focusedIndex + delta + _titleBtns.length) % _titleBtns.length;
    if (_focusedIndex !== oldIdx) {
      SoundManager.snd('menu_hover');
    }
  },

  activateFocused() {
    if (DeveloperSanctumUI.isGateOpen()) {
      DeveloperSanctumUI.submitPassword();
      return;
    }
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
    if (DeveloperSanctumUI.isGateOpen()) {
      DeveloperSanctumUI.closeGate();
      return true;
    }
    if (_loadoutModalOpen) {
      _loadoutModalOpen = false;
      SoundManager.snd('panel_close');
      return true;
    }
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
    // ENSURE THE ABYSSAL THRESHOLD ENVIRONMENT IS RENDERED
    // ─────────────────────────────────────────────────────────────
    if (MainMenuScene.lastDrawFrame !== (GameState.F || 0)) {
      MainMenuScene.draw(ctx);
    }

    // ─────────────────────────────────────────────────────────────
    // 1. HANDCRAFTED FORGED TITLE PLAQUE & EDITION BADGE
    // ─────────────────────────────────────────────────────────────
    const leftX = Math.max(48, Math.min(68, Math.round((LW - 896) * 0.25 + 56)));

    // Hanging Forged Metal Title Plaque with Chains & 3D Chiseled Metallic Lettering
    drawTitlePlaque(ctx, leftX, 8, 292, 154, logoAlpha, F);

    // ─────────────────────────────────────────────────────────────
    // 2. THE INSCRIBED VANGUARD RAIL (ARCHITECTURAL NAVIGATION)
    // ─────────────────────────────────────────────────────────────
    const sv = SaveSystem.loadRun();
    const hasSave = SaveSystem.hasResumableRun();
    if (sv && !hasSave) {
      SaveSystem.clearRun();
    }
    const hasGift = SaveSystem.isPhase3GiftEligible();

    const btnConfigs = [
      {
        id: 'play',
        label: 'START JOURNEY',
        primary: true,
        action: () => {
          startGame(true);
        }
      },
      {
        id: 'continue',
        label: 'CONTINUE',
        sub: hasSave ? ('Floor ' + (sv ? sv.lv : 1) + ' · [ R ]') : '[No active descent]',
        primary: false,
        disabled: !hasSave,
        action: () => { if (SaveSystem.hasResumableRun()) resumeSavedRun(); }
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
        id: 'archive',
        label: 'ARCHIVE OF MEMORIES',
        primary: false,
        action: () => CinematicArchiveUI.open(GameStates.TITLE)
      },
      {
        id: 'achievements',
        label: 'ACHIEVEMENTS',
        primary: false,
        action: () => openAchievements(GameStates.TITLE)
      },
      {
        id: 'settings',
        label: 'SETTINGS',
        primary: false,
        action: () => openSettings(GameStates.TITLE)
      },
      {
        id: 'credits',
        label: 'VIEW CREDITS',
        primary: false,
        action: () => Credits.start('menu')
      }
    ];

    if (hasGift) {
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

    const isTouchMobile = (typeof window !== 'undefined') &&
      (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth <= 1024);
    const btnW = isTouchMobile ? 318 : 292;
    const count = btnConfigs.length;
    const btnStartY = count >= 10 ? (isTouchMobile ? 154 : 168) : (count >= 9 ? 164 : 176);
    const btnGap = count >= 10 ? 4.0 : (count >= 9 ? 4.5 : 5.0);

    // Precalculate precise physical geometry per button
    let currentY = btnStartY;
    const buttonLayouts = btnConfigs.map((cfg, idx) => {
      const bh = cfg.primary ? 44 : (isTouchMobile ? 35 : (count >= 10 ? 30 : (count >= 9 ? 31 : 32)));
      const layout = {
        cfg,
        idx,
        x: leftX,
        y: currentY,
        w: btnW,
        h: bh
      };
      currentY += bh + btnGap;
      return layout;
    });

    const totalMenuH = currentY - btnStartY - btnGap;

    // Mouse coordinates and 1:1 Hitbox mapping
    const mouseX = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.mx : -999;
    const mouseY = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.my : -999;
    const mouseMoved = (Math.abs(mouseX - _lastMouseX) > 1 || Math.abs(mouseY - _lastMouseY) > 1) && mouseX > -900;
    if (mouseMoved) {
      _lastMouseX = mouseX;
      _lastMouseY = mouseY;
    }

    let hoveredIndex = -1;

    buttonLayouts.forEach(({ cfg, idx, x, y, w, h }) => {
      _titleBtns.push({
        id: cfg.id,
        idx: idx,
        x: x,
        y: y,
        w: w,
        h: h,
        disabled: cfg.disabled,
        action: cfg.action
      });

      if (mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h) {
        hoveredIndex = idx;
      }
    });

    if (mouseMoved && hoveredIndex !== -1 && !_howToPlayActive) {
      _lastInputMode = 'mouse';
      if (hoveredIndex !== _focusedIndex) {
        _focusedIndex = hoveredIndex;
      }
      if (_lastHoveredIndex !== hoveredIndex) {
        SoundManager.snd('menu_hover');
        _lastHoveredIndex = hoveredIndex;
      }
    } else if (hoveredIndex === -1 && mouseMoved) {
      _lastHoveredIndex = -1;
    }

    // ─────────────────────────────────────────────────────────────
    // RENDER BESPOKE ABYSSAL REGALIA BUTTON CONTROLS
    // ─────────────────────────────────────────────────────────────
    buttonLayouts.forEach(({ cfg, idx, x, y, w, h }) => {
      const isFocused = (_focusedIndex === idx) && !_howToPlayActive;
      const isHovered = (_lastInputMode === 'mouse' && hoveredIndex === idx) && !_howToPlayActive;
      const isDisabled = !!cfg.disabled;
      const isGift = !!cfg.isGift;

      // Staggered reveal timeline per option
      const delay = 1.0 + idx * 0.05;
      const progress = Math.max(0, Math.min(1, (_revealTimer - delay) / 0.28));
      const eased = 1 - Math.pow(1 - progress, 3);
      const alpha = Math.max(0, eased) * btnsAlpha;

      drawRegaliaButton(
        ctx,
        cfg,
        x,
        y,
        w,
        h,
        isFocused,
        isHovered,
        isDisabled,
        isGift,
        F,
        alpha
      );
    });

    // ─────────────────────────────────────────────────────────────
    // 3. COMPACT STATUS PLAQUES (TOTAL SOULS & PRESTIGE)
    // ─────────────────────────────────────────────────────────────
    const statusY = currentY + (hasGift ? 6 : 8);
    drawStatusPlaques(
      ctx,
      leftX,
      statusY,
      GameState.ABYSS_SOULS || 0,
      GameState.PRESTIGE_TOKENS || 0,
      F,
      btnsAlpha
    );

    // ─────────────────────────────────────────────────────────────
    // 4. UPPER-RIGHT PLAYER RECORDS (BEST CLEAR & TOTAL DEATHS)
    // ─────────────────────────────────────────────────────────────
    drawPersonalRecords(ctx, btnsAlpha, F);

    // ─────────────────────────────────────────────────────────────
    // 4. KEYBOARD CONTROLS LEGEND & AUDIO STATUS
    // ─────────────────────────────────────────────────────────────
    ctx.save();
    ctx.globalAlpha = btnsAlpha;
    const isAudioWaiting = (typeof MusicManager !== 'undefined' && !MusicManager.isUnlocked());

    // Primary Control Hints (Exact Format matching Reference)
    ctx.fillStyle = 'rgba(167, 139, 250, 0.80)';
    const isMob = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width:900px),(pointer:coarse)').matches;
    const navHint = isMob
      ? '✦ TAP TO SELECT · EXPLORE THE DESCENT ✦'
      : '↑ / ↓ — NAVIGATE   ENTER / SPACE — SELECT   WASD — MOVE IN-GAME   ESC — PAUSE';
    ctx.fillText(navHint, leftX, LH - 18);

    // Audio awaken hint on right side if audio is still locked
    if (isAudioWaiting) {
      const pulse = Math.sin(F * 0.08) * 0.25 + 0.75;
      ctx.textAlign = 'right';
      ctx.fillStyle = `rgba(253, 230, 138, ${pulse * 0.85})`;
      ctx.font = 'bold 9px Cinzel, serif';
      ctx.fillText('✦ CLICK TO AWAKEN AUDIO', LW - 24, LH - 18);
    }
    ctx.restore();

    // ─────────────────────────────────────────────────────────────
    // 5. SECRET DEVELOPER SANCTUM RELIC BUTTON (BOTTOM-RIGHT)
    // ─────────────────────────────────────────────────────────────
    const relicW = 44, relicH = 38;
    const relicX = LW - relicW - 24;
    const relicY = LH - relicH - 34;
    _relicBtnRect = { x: relicX, y: relicY, w: relicW, h: relicH };

    const isHoverRelic = mouseX >= relicX && mouseX <= relicX + relicW && mouseY >= relicY && mouseY <= relicY + relicH;

    ctx.save();
    ctx.globalAlpha = btnsAlpha;

    // Outer obsidian and amethyst chamfered relic
    ctx.fillStyle = isHoverRelic ? 'rgba(30, 16, 50, 0.95)' : 'rgba(12, 8, 24, 0.90)';
    ctx.strokeStyle = isHoverRelic ? '#fde68a' : 'rgba(217, 119, 6, 0.65)';
    ctx.lineWidth = isHoverRelic ? 1.5 : 1.0;
    roundRect(ctx, relicX, relicY, relicW, relicH, 4);
    ctx.fill();
    ctx.stroke();

    // Fine inner amethyst hairline
    ctx.strokeStyle = isHoverRelic ? 'rgba(192, 132, 252, 0.7)' : 'rgba(147, 51, 234, 0.35)';
    ctx.lineWidth = 1;
    roundRect(ctx, relicX + 3, relicY + 3, relicW - 6, relicH - 6, 3);
    ctx.stroke();

    // Subtle crimson glow on hover
    if (isHoverRelic) {
      ctx.save();
      const rg = ctx.createRadialGradient(relicX + relicW / 2, relicY + relicH / 2, 4, relicX + relicW / 2, relicY + relicH / 2, 32);
      rg.addColorStop(0, 'rgba(220, 38, 38, 0.25)');
      rg.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = rg;
      ctx.fillRect(relicX - 10, relicY - 10, relicW + 20, relicH + 20);
      ctx.restore();
    }

    // The Exact Approved Red Pixel-Art Eye (from Shattered Mind)
    const isRedMotion = typeof window !== 'undefined' &&
      ((window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || GameState.REDUCED_MOTION);
    const eyeBlink = isRedMotion ? 0 : Math.max(0, Math.sin(F * 0.035) - 0.92) * 12.5;
    drawPixelEye(ctx, relicX + relicW / 2, relicY + relicH / 2, 0.44, eyeBlink, F);

    // Restrained Tooltip: SEALED SANCTUM
    if (isHoverRelic) {
      ctx.save();
      ctx.font = 'bold 9px Cinzel, serif';
      const tipText = 'SEALED SANCTUM';
      const tw = ctx.measureText(tipText).width + 16;
      const tx = relicX + relicW / 2 - tw / 2;
      const ty = relicY - 22;

      ctx.fillStyle = 'rgba(7, 10, 22, 0.96)';
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.8)';
      ctx.lineWidth = 1;
      roundRect(ctx, tx, ty, tw, 18, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fde68a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tipText, tx + tw / 2, ty + 9);
      ctx.restore();
    }

    ctx.restore();

    // ─────────────────────────────────────────────────────────────
    // 9. "SURVIVAL GUIDE" MODAL — THE VANGUARD'S FIELD MANUAL
    // ─────────────────────────────────────────────────────────────
    if (_howToPlayActive) {
      ctx.save();
      ctx.fillStyle = 'rgba(2, 4, 10, 0.90)';
      ctx.fillRect(0, 0, LW, LH);

      const mw = Math.min(830, LW - 24), mh = Math.min(506, LH - 24);
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

      // Title & Platform Mode Switcher Header
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 16px Cinzel, serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.shadowColor = '#d97706';
      ctx.shadowBlur = 8;
      ctx.fillText('◈ THE VANGUARD\'S FIELD MANUAL ◈', mx + 24, my + 14);
      ctx.shadowBlur = 0;

      ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
      ctx.font = 'italic 10.5px "Crimson Text", serif';
      ctx.fillText('ARCHIVAL COMBAT DOCTRINE & SURVIVAL PROTOCOLS OF THE ABYSS', mx + 26, my + 33);

      // Platform Mode Switcher (Top Right: PC vs Mobile)
      const isMobileMode = (_fieldGuideInputMode === 'mobile');
      const pcBtnW = 112, mobBtnW = 112, swBtnH = 22;
      const mobBtnX = mx + mw - 24 - mobBtnW;
      const pcBtnX = mobBtnX - 8 - pcBtnW;
      const swBtnY = my + 14;

      const isHoverPC = mouseX >= pcBtnX && mouseX <= pcBtnX + pcBtnW && mouseY >= swBtnY && mouseY <= swBtnY + swBtnH;
      const isHoverMob = mouseX >= mobBtnX && mouseX <= mobBtnX + mobBtnW && mouseY >= swBtnY && mouseY <= swBtnY + swBtnH;

      // PC Toggle Button
      ctx.fillStyle = !isMobileMode ? 'rgba(217, 119, 6, 0.3)' : (isHoverPC ? 'rgba(30, 41, 59, 0.8)' : 'rgba(15, 23, 42, 0.6)');
      ctx.strokeStyle = !isMobileMode ? '#fde68a' : (isHoverPC ? '#94a3b8' : 'rgba(71, 85, 105, 0.5)');
      ctx.lineWidth = !isMobileMode ? 1.5 : 1;
      roundRect(ctx, pcBtnX, swBtnY, pcBtnW, swBtnH, 4);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = !isMobileMode ? '#ffffff' : '#94a3b8';
      ctx.font = 'bold 8.5px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⌨ KEYBOARD / PC', pcBtnX + pcBtnW / 2, swBtnY + swBtnH / 2);

      // Mobile Toggle Button
      ctx.fillStyle = isMobileMode ? 'rgba(56, 189, 248, 0.28)' : (isHoverMob ? 'rgba(30, 41, 59, 0.8)' : 'rgba(15, 23, 42, 0.6)');
      ctx.strokeStyle = isMobileMode ? '#38bdf8' : (isHoverMob ? '#94a3b8' : 'rgba(71, 85, 105, 0.5)');
      ctx.lineWidth = isMobileMode ? 1.5 : 1;
      roundRect(ctx, mobBtnX, swBtnY, mobBtnW, swBtnH, 4);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = isMobileMode ? '#ffffff' : '#94a3b8';
      ctx.fillText('📱 TOUCH / MOBILE', mobBtnX + mobBtnW / 2, swBtnY + swBtnH / 2);

      // Six Chapter Folio Tabs
      const chapterTabs = [
        { id: 0, label: 'I · ARSENAL' },
        { id: 1, label: 'II · FOOTWORK' },
        { id: 2, label: 'III · SANITY' },
        { id: 3, label: 'IV · RALLY' },
        { id: 4, label: 'V · BOSSES' },
        { id: 5, label: 'VI · TEMPO' }
      ];

      const tabW = 120, tabH = 26;
      const tabStartX = mx + Math.round((mw - (chapterTabs.length * tabW + (chapterTabs.length - 1) * 6)) / 2);
      const tabY = my + 50;

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
      const spreadY = my + 84;
      const spreadH = 360;
      const leftW = 380;
      const rightW = mw - leftW - 48;
      const leftX = mx + 20;
      const rightX = leftX + leftW + 12;

      // ── Left Folio: Procedural Tactical Schematic Canvas ──
      ctx.fillStyle = 'rgba(10, 15, 28, 0.88)';
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
      ctx.font = 'bold 9px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const modeTag = isMobileMode ? 'TOUCH CONTROLS' : 'KEYBOARD & MOUSE';
      ctx.fillText(`◈ VANGUARD SCHEMATIC · [ ${modeTag} ] ◈`, leftX + leftW / 2, spreadY + 21);

      // ── CHAPTER SCHEMATICS ──
      if (_fieldGuideChapter === 0) {
        // CHAPTER 0: ARSENAL SCHEMATIC
        const cx = leftX + leftW / 2, cy = spreadY + 112;

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
        ctx.font = 'bold 9.5px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.fillText('PRIMARY SWORD CLEAVE (68° ARC · STAGGER ZONE)', cx, cy + 54);

        if (!isMobileMode) {
          // PC Weapon Dock Mockup
          const dockY = spreadY + 188;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.strokeStyle = 'rgba(71, 85, 105, 0.55)';
          roundRect(ctx, cx - 145, dockY, 290, 54, 6);
          ctx.fill(); ctx.stroke();

          const slots = [
            { key: '1', name: 'BROADSWORD', active: true, col: '#fde68a' },
            { key: '2', name: 'LONGBOW', active: false, col: '#38bdf8' },
            { key: '3', name: 'RELIC', active: false, col: '#c084fc' }
          ];
          slots.forEach((s, idx) => {
            const sx = cx - 138 + idx * 94;
            ctx.fillStyle = s.active ? 'rgba(245, 158, 11, 0.28)' : 'rgba(30, 41, 59, 0.55)';
            ctx.strokeStyle = s.active ? '#f59e0b' : 'rgba(71, 85, 105, 0.45)';
            ctx.lineWidth = s.active ? 1.5 : 1;
            roundRect(ctx, sx, dockY + 6, 88, 42, 4);
            ctx.fill(); ctx.stroke();

            ctx.fillStyle = s.active ? '#ffffff' : '#94a3b8';
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`[${s.key}]`, sx + 6, dockY + 18);
            ctx.fillStyle = s.col;
            ctx.font = 'bold 8px Cinzel, serif';
            ctx.textAlign = 'center';
            ctx.fillText(s.name, sx + 44, dockY + 32);
          });

          // Secondary & interaction controls sub-dock
          const subDockY = spreadY + 252;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
          ctx.strokeStyle = 'rgba(51, 65, 85, 0.45)';
          roundRect(ctx, cx - 145, subDockY, 290, 96, 6);
          ctx.fill(); ctx.stroke();

          const subActions = [
            { key: 'SHIFT', act: 'QUICK BOW PIERCE', desc: 'Direct ranged arrow without swapping weapon', col: '#38bdf8' },
            { key: 'Q', act: 'CONSECRATED ABILITY', desc: 'Triggers weapon-specific relic ability', col: '#fbbf24' },
            { key: 'E / G', act: 'GROUND SWAP & MODAL', desc: '[E] swaps active ground weapon · [G] replace modal', col: '#4ade80' }
          ];

          subActions.forEach((sa, saIdx) => {
            const say = subDockY + 8 + saIdx * 29;
            ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
            ctx.strokeStyle = sa.col;
            ctx.lineWidth = 1;
            roundRect(ctx, cx - 138, say, 48, 22, 3);
            ctx.fill(); ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(sa.key, cx - 114, say + 11);

            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillStyle = sa.col;
            ctx.font = 'bold 8.5px Cinzel, serif';
            ctx.fillText(sa.act, cx - 82, say + 2);

            ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
            ctx.font = '7.5px monospace';
            ctx.fillText(sa.desc, cx - 82, say + 13);
          });
        } else {
          // Mobile Action Buttons Schematic
          const mobBoxY = spreadY + 188;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
          roundRect(ctx, cx - 145, mobBoxY, 290, 160, 6);
          ctx.fill(); ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 9px Cinzel, serif';
          ctx.textAlign = 'center';
          ctx.fillText('ON-SCREEN TOUCH COMBAT INTERFACE', cx, mobBoxY + 12);

          // 3 Touch Action Buttons Mockup
          const mBtns = [
            { label: '⚔ ATK', col: '#ef4444', r: 24, x: cx - 85, y: mobBoxY + 62, desc: 'Primary Strike' },
            { label: '🏹 SHOOT', col: '#34d399', r: 20, x: cx, y: mobBoxY + 62, desc: 'Piercing Bow' },
            { label: '✨ SPECIAL', col: '#fbbf24', r: 20, x: cx + 85, y: mobBoxY + 62, desc: 'Weapon Ability' }
          ];
          mBtns.forEach(b => {
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fillStyle = b.col + '28';
            ctx.fill();
            ctx.strokeStyle = b.col;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 8px Cinzel, serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(b.label, b.x, b.y);

            ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
            ctx.font = '8px monospace';
            ctx.fillText(b.desc, b.x, b.y + b.r + 9);
          });

          // Touch joystick placement notice
          ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
          ctx.font = 'italic 8.5px Crimson Text, serif';
          ctx.textAlign = 'center';
          ctx.fillText('Left Screen: 360° Analog Touch Joystick · Right Screen: Combat Actions', cx, mobBoxY + 126);
          ctx.fillText('Buttons can be freely repositioned via Settings > Touch Controls', cx, mobBoxY + 142);
        }

      } else if (_fieldGuideChapter === 1) {
        // CHAPTER 1: TACTICAL FOOTWORK & SPACING
        const cx = leftX + leftW / 2;

        // Tactical Spacing & Cadence Diagram (Bait, Evade, Punish)
        const dy = spreadY + 46;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 1;
        roundRect(ctx, cx - 145, dy, 290, 140, 6);
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9.5px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('TACTICAL SPACING & CADENCE MATRIX', cx, dy + 8);

        // 3 Step Teaching Diagram: 1. BAIT -> 2. EVADE -> 3. PUNISH
        const phases = [
          { num: 'I', title: 'BAIT', desc: 'Circle-strafe at outer melee edge to trigger swing telegraph', col: '#fbbf24', x: cx - 94 },
          { num: 'II', title: 'EVADE', desc: 'Step outside the 68° hazard cone during enemy swing arc', col: '#38bdf8', x: cx },
          { num: 'III', title: 'PUNISH', desc: 'Cleave enemy during their post-swing recovery frames', col: '#4ade80', x: cx + 94 }
        ];

        phases.forEach((p, pIdx) => {
          const px = p.x;
          const py = dy + 32;

          ctx.fillStyle = p.col + '22';
          ctx.strokeStyle = p.col;
          ctx.lineWidth = 1.2;
          roundRect(ctx, px - 42, py, 84, 94, 4);
          ctx.fill(); ctx.stroke();

          // Phase badge
          ctx.fillStyle = p.col;
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(`PHASE ${p.num}`, px, py + 8);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9.5px Cinzel, serif';
          ctx.fillText(p.title, px, py + 22);

          ctx.fillStyle = 'rgba(203, 213, 225, 0.85)';
          ctx.font = '8px "Crimson Text", serif';
          const pLines = wrapTextLines(ctx, p.desc, 76);
          pLines.forEach((pl, lIdx) => {
            ctx.fillText(pl, px, py + 40 + lIdx * 11);
          });
        });

        if (!isMobileMode) {
          // PC Directional WASD keyboard compass
          const compassY = spreadY + 196;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.strokeStyle = 'rgba(71, 85, 105, 0.55)';
          roundRect(ctx, cx - 145, compassY, 290, 152, 6);
          ctx.fill(); ctx.stroke();

          ctx.fillStyle = '#fde68a';
          ctx.font = 'bold 9.5px Cinzel, serif';
          ctx.textAlign = 'center';
          ctx.fillText('KEYBOARD DIRECTIONAL CADENCE', cx, compassY + 12);

          const keys = [
            { label: 'W', hint: '▲', x: cx, y: compassY + 44 },
            { label: 'A', hint: '◀', x: cx - 44, y: compassY + 78 },
            { label: 'S', hint: '▼', x: cx, y: compassY + 78 },
            { label: 'D', hint: '▶', x: cx + 44, y: compassY + 78 }
          ];
          keys.forEach(k => {
            ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1;
            roundRect(ctx, k.x - 16, k.y - 14, 32, 28, 4);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#f1f5f9';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(k.label, k.x, k.y - 3);
            ctx.fillStyle = '#f59e0b';
            ctx.font = '7.5px monospace';
            ctx.fillText(k.hint, k.x, k.y + 8);
          });

          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 8.5px monospace';
          ctx.fillText('Directional Arrow Keys [ ↑ ← ↓ → ] also supported', cx, compassY + 114);
          ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
          ctx.font = 'italic 8.5px Crimson Text, serif';
          ctx.fillText('Rowan accelerates rapidly to kite mobs into single-file corridors', cx, compassY + 132);
        } else {
          // Mobile Virtual Joystick Diagram
          const joyBoxY = spreadY + 196;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
          roundRect(ctx, cx - 145, joyBoxY, 290, 152, 6);
          ctx.fill(); ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 9.5px Cinzel, serif';
          ctx.textAlign = 'center';
          ctx.fillText('ANALOG VIRTUAL JOYSTICK · 360° MOTION', cx, joyBoxY + 12);

          // Outer Joystick Ring
          const jBaseX = cx, jBaseY = joyBoxY + 74;
          ctx.beginPath();
          ctx.arc(jBaseX, jBaseY, 36, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(30, 41, 59, 0.55)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // 8 Directional guide marks
          for (let a = 0; a < 8; a++) {
            const rad = (a * Math.PI) / 4;
            ctx.beginPath();
            ctx.moveTo(jBaseX + Math.cos(rad) * 26, jBaseY + Math.sin(rad) * 26);
            ctx.lineTo(jBaseX + Math.cos(rad) * 34, jBaseY + Math.sin(rad) * 34);
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
            ctx.stroke();
          }

          // Center Knob (deflected up-right indicating direction)
          const kx = jBaseX + 12, ky = jBaseY - 10;
          ctx.beginPath();
          ctx.arc(kx, ky, 15, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('JOYSTICK', kx, ky);

          ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
          ctx.font = 'italic 8.5px Crimson Text, serif';
          ctx.fillText('Touch & drag anywhere in bottom-left zone for 360° precision', cx, joyBoxY + 126);
          ctx.fillText('Dynamic centering follows thumb placement automatically', cx, joyBoxY + 140);
        }

      } else if (_fieldGuideChapter === 2) {
        // CHAPTER 2: ILLUMINATION & SANITY
        const cx = leftX + leftW / 2, cy = spreadY + 116;

        // Torchlight sanctuary circle
        const rad = 66;
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
        ctx.fillText('SANCTUARY RADIUS · SANITY DRAIN HALTED', cx, cy + rad + 8);

        // Sanity Eye Gauge at bottom
        const ey = spreadY + 220;
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
        // CHAPTER 3: GHOST HEALTH & RALLY SYSTEM (STABLE & READABLE, 100% TIMELINE AGREEMENT)
        const cx = leftX + leftW / 2;

        // Demonstration state update
        if (_fieldGuideDemoRunning) {
          _fieldGuideDemoTimer += dt;
          if (_fieldGuideDemoTimer >= 2.5) {
            _fieldGuideDemoTimer = 2.5;
            _fieldGuideDemoRunning = false;
            _fieldGuideDemoCompleted = true;
          }
        }

        const isDemonstrating = _fieldGuideDemoRunning;
        const isFinished = _fieldGuideDemoCompleted;
        const demoTime = isDemonstrating ? _fieldGuideDemoTimer : (isFinished ? 2.5 : 0);
        const hasRecovered = isFinished || (isDemonstrating && demoTime >= 1.5);

        // Header Title
        const hby = spreadY + 40;
        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 10px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('ROWAN VITALITY & GHOST HEALTH RALLY', cx, hby);

        // Segment Legend (Not relying on color alone)
        const legY = hby + 16;
        const legends = [
          { label: '■ PERMANENT HP (50%)', col: '#ef4444', x: cx - 100 },
          { label: hasRecovered ? '■ RECOVERED HP (+28%)' : '■ GHOST HP (28% · 2.5s)', col: hasRecovered ? '#4ade80' : '#cbd5e1', x: cx + 45 }
        ];
        legends.forEach(l => {
          ctx.fillStyle = l.col;
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(l.label, l.x, legY);
        });

        // Health Bar Container
        const barW = 280, barH = 26;
        const bx = cx - barW / 2, by = legY + 14;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.7)';
        ctx.lineWidth = 1.2;
        roundRect(ctx, bx, by, barW, barH, 4);
        ctx.fill(); ctx.stroke();

        // Solid HP (50% base, rises to 78% on successful recovery)
        const solidHpPct = hasRecovered ? 0.78 : 0.50;
        ctx.fillStyle = hasRecovered ? '#22c55e' : '#ef4444';
        roundRect(ctx, bx + 2, by + 2, barW * solidHpPct, barH - 4, 3);
        ctx.fill();

        // Ghost HP (Steady 28% grey silver, siphons away into green permanent on recovery)
        if (!hasRecovered) {
          ctx.fillStyle = 'rgba(203, 213, 225, 0.85)';
          roundRect(ctx, bx + 2 + barW * 0.5, by + 2, barW * 0.28, barH - 4, 3);
          ctx.fill();
        }

        // Percentage text inside health bar
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(hasRecovered ? '78 / 100 HP [ RECOVERED ]' : '50 / 100 HP (+28 GHOST)', cx, by + barH / 2);

        // Counter-strike cue
        ctx.fillStyle = hasRecovered ? '#86efac' : '#38bdf8';
        ctx.font = 'bold 9px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const hitCue = hasRecovered
          ? '✔ COUNTER-STRIKE HIT! 100% GHOST HEALTH RESTORED'
          : 'COUNTER-ATTACK WITHIN 2.5s TO RESTORE GHOST HEALTH';
        ctx.fillText(hitCue, cx, by + barH + 8);

        // Retaliation Window Box
        const ty = spreadY + 168;
        const twH = 176;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.6)';
        roundRect(ctx, cx - 145, ty, 290, twH, 6);
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 9.5px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.fillText('2.5-SECOND RETALIATION TIMELINE', cx, ty + 12);

        // Stationary Graduated Timeline Track
        const tTrackW = 240;
        const tTrackX = cx - tTrackW / 2;
        const tTrackY = ty + 36;

        ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
        roundRect(ctx, tTrackX, tTrackY, tTrackW, 16, 4);
        ctx.fill();

        // Timer fill: counts down from 1.0 to 0.0 during demonstration
        const timerProgress = isDemonstrating
          ? Math.max(0, 1 - (demoTime / 2.5))
          : (isFinished ? 0.0 : 1.0);

        if (timerProgress > 0) {
          ctx.fillStyle = (demoTime >= 1.5) ? '#4ade80' : '#38bdf8';
          roundRect(ctx, tTrackX, tTrackY, tTrackW * timerProgress, 16, 4);
          ctx.fill();
        }

        // Graduation Ticks along 2.5s timeline
        const tTicks = [
          { frac: 0.0, label: '0.0s (HIT)' },
          { frac: 0.4, label: '1.0s' },
          { frac: 0.6, label: '1.5s (STRIKE)' },
          { frac: 1.0, label: '2.5s (END)' }
        ];
        tTicks.forEach(tt => {
          const ttx = tTrackX + tTrackW * tt.frac;
          ctx.strokeStyle = tt.frac === 0.6 ? '#f59e0b' : 'rgba(148, 163, 184, 0.55)';
          ctx.lineWidth = tt.frac === 0.6 ? 1.5 : 1;
          ctx.beginPath();
          ctx.moveTo(ttx, tTrackY + 16);
          ctx.lineTo(ttx, tTrackY + 22);
          ctx.stroke();

          ctx.fillStyle = tt.frac === 0.6 ? '#fde68a' : 'rgba(148, 163, 184, 0.8)';
          ctx.font = tt.frac === 0.6 ? 'bold 7.5px monospace' : '7px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(tt.label, ttx, tTrackY + 24);
        });

        // Time Readout
        const remSec = isDemonstrating ? Math.max(0, 2.5 - demoTime).toFixed(1) : (isFinished ? '0.0' : '2.5');
        ctx.fillStyle = isFinished ? '#4ade80' : '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`WINDOW REMAINING: ${remSec}s / 2.5s`, cx, ty + 78);

        // Interactive Demonstration Button
        const demoBtnW = 200, demoBtnH = 26;
        const demoBtnX = cx - demoBtnW / 2;
        const demoBtnY = ty + 96;
        const isHoverDemo = mouseX >= demoBtnX && mouseX <= demoBtnX + demoBtnW && mouseY >= demoBtnY && mouseY <= demoBtnY + demoBtnH;

        ctx.fillStyle = isHoverDemo ? 'rgba(56, 189, 248, 0.35)' : 'rgba(30, 41, 59, 0.8)';
        ctx.strokeStyle = isDemonstrating ? '#4ade80' : (isHoverDemo ? '#38bdf8' : 'rgba(71, 85, 105, 0.65)');
        ctx.lineWidth = 1.2;
        roundRect(ctx, demoBtnX, demoBtnY, demoBtnW, demoBtnH, 4);
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = isDemonstrating ? '#4ade80' : (isHoverDemo ? '#ffffff' : '#38bdf8');
        ctx.font = 'bold 9px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const btnLabel = isDemonstrating
          ? '↺ EXECUTING CADENCE...'
          : (isFinished ? '↺ REPLAY DEMONSTRATION' : '↺ DEMONSTRATE CADENCE');
        ctx.fillText(btnLabel, cx, demoBtnY + demoBtnH / 2);

        // Status explanation message
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = isFinished ? '#86efac' : (isDemonstrating && demoTime >= 1.5 ? '#fde68a' : 'rgba(148, 163, 184, 0.9)');
        ctx.font = 'italic 8.5px Crimson Text, serif';
        let demoMsg = 'Press [ DEMONSTRATE CADENCE ] to view counter-strike recovery.';
        if (isDemonstrating) {
          demoMsg = demoTime < 1.5
            ? `Retaliation window counting down (${remSec}s left)...`
            : `Counter-strike landed at 1.5s! Siphoning ghost health...`;
        } else if (isFinished) {
          demoMsg = '✔ Recovery confirmed! 100% ghost health restored to permanent vitality.';
        }
        ctx.fillText(demoMsg, cx, ty + 132);

        ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
        ctx.font = '8px monospace';
        ctx.fillText('Demonstration illustrates cadence; final state holds for inspection.', cx, ty + 152);

      } else if (_fieldGuideChapter === 4) {
        // CHAPTER 4: CITADEL TITANS & BOSS PROTOCOLS
        const bosses = [
          { name: 'GORGAROTH THE DEFILER', floor: 'FLOOR 3', title: 'THE MOLTEN FORGE', col: '#f97316', sigil: '⚔', note: 'Heavy anvil smashes & lava rivers · Dodge behind back during windup' },
          { name: 'MALAKOR THE DREADLORD', floor: 'FLOOR 6', title: 'THE VOID RIFT', col: '#a855f7', sigil: '✦', note: 'Spatial fissures & phantom clones · Slay echoes to breach vulnerability' },
          { name: 'THE ABYSS WARDEN', floor: 'FLOOR 10', title: 'THE SUNKEN THRONE', col: '#ef4444', sigil: '♛', note: 'Telekinetic greatswords & singularity vortex · 3 escalating lethal phases' }
        ];

        bosses.forEach((b, i) => {
          const by = spreadY + 36 + i * 102;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.strokeStyle = b.col;
          ctx.lineWidth = 1.2;
          roundRect(ctx, leftX + 14, by, leftW - 28, 92, 6);
          ctx.fill(); ctx.stroke();

          ctx.fillStyle = b.col;
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(b.floor, leftX + 26, by + 12);

          ctx.fillStyle = '#fde68a';
          ctx.font = 'bold 11px Cinzel, serif';
          ctx.fillText(b.name, leftX + 26, by + 28);

          ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
          ctx.font = 'italic 9.5px "Crimson Text", serif';
          ctx.fillText(`Locus: ${b.title}`, leftX + 26, by + 46);

          ctx.fillStyle = '#cbd5e1';
          ctx.font = '8px monospace';
          const bLines = wrapTextLines(ctx, b.note, leftW - 90);
          bLines.forEach((bl, blIdx) => {
            ctx.fillText(bl, leftX + 26, by + 62 + blIdx * 11);
          });

          // Boss Runic Sigil Box on right
          ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
          ctx.strokeStyle = b.col;
          roundRect(ctx, leftX + leftW - 68, by + 20, 44, 44, 4);
          ctx.fill(); ctx.stroke();
          ctx.fillStyle = b.col;
          ctx.font = '16px Cinzel, serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(b.sigil, leftX + leftW - 46, by + 42);
        });
      } else if (_fieldGuideChapter === 5) {
        // CHAPTER 5: TIME & TEMPO (SPEED PRESETS & SPEEDRUN INTEGRITY)
        const cx = leftX + leftW / 2;

        if (!isMobileMode) {
          // KEYBOARD / PC PANEL: Hotkeys O & P and Tempo Presets
          ctx.fillStyle = '#fde68a';
          ctx.font = 'bold 11px Cinzel, serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText('KEYBOARD TEMPO REGULATION', cx, spreadY + 36);

          // Keycap displays for [ O ] and [ P ]
          const keyW = 84, keyH = 46;
          const keyY = spreadY + 54;
          const kx1 = cx - 90;
          const kx2 = cx + 6;

          // Key O
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          roundRect(ctx, kx1, keyY, keyW, keyH, 6);
          ctx.fill();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 16px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('O', kx1 + keyW / 2, keyY + 18);
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 8px Cinzel, serif';
          ctx.fillText('-0.25× SLOW', kx1 + keyW / 2, keyY + 34);

          // Key P
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          roundRect(ctx, kx2, keyY, keyW, keyH, 6);
          ctx.fill();
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = '#f97316';
          ctx.font = 'bold 16px monospace';
          ctx.fillText('P', kx2 + keyW / 2, keyY + 18);
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 8px Cinzel, serif';
          ctx.fillText('+0.25× FAST', kx2 + keyW / 2, keyY + 34);

          // 4 Preset Cards
          const presetY = spreadY + 108;
          const presets = [
            { spd: '0.50×', name: 'TACTICAL SLOMO', desc: 'Telegraphed pattern study', col: '#38bdf8' },
            { spd: '1.00×', name: 'STANDARD', desc: 'Canonical dungeon pacing', col: '#94a3b8' },
            { spd: '1.50×', name: 'ACCELERATED', desc: 'Swift descent & room clear', col: '#fbbf24' },
            { spd: '2.00×', name: 'HYPER-TEMPO', desc: 'Max reflexes mastery test', col: '#f97316' }
          ];

          presets.forEach((p, idx) => {
            const py = presetY + idx * 34;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
            roundRect(ctx, cx - 165, py, 330, 28, 4);
            ctx.fill();
            ctx.strokeStyle = p.col;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Preset speed badge
            ctx.fillStyle = p.col;
            ctx.font = 'bold 9.5px monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.spd, cx - 154, py + 14);

            // Name
            ctx.fillStyle = '#fde68a';
            ctx.font = 'bold 8.5px Cinzel, serif';
            ctx.fillText(p.name, cx - 100, py + 14);

            // Desc
            ctx.fillStyle = '#cbd5e1';
            ctx.font = 'italic 8px "Crimson Text", serif';
            ctx.textAlign = 'right';
            ctx.fillText(p.desc, cx + 154, py + 14);
          });

          // Speedrun Integrity Notice
          const infY = spreadY + 252;
          ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
          roundRect(ctx, cx - 165, infY, 330, 96, 6);
          ctx.fill();
          ctx.strokeStyle = 'rgba(202, 138, 4, 0.6)';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = '#ffd700';
          ctx.font = 'bold 9.5px Cinzel, serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText('⏱ SPEEDRUNNING & ACTIVE TIMER INTEGRITY', cx, infY + 12);
          ctx.fillStyle = '#e2e8f0';
          ctx.font = '9px "Crimson Text", serif';
          ctx.fillText('Official floor & run timers track true unscaled wall-clock seconds.', cx, infY + 34);
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'italic 8.5px "Crimson Text", serif';
          ctx.fillText('Speed adjustments alter combat pace, not official completion records.', cx, infY + 54);
          ctx.fillText('Hall of Fame records, achievements, and speed splits remain pure.', cx, infY + 72);

        } else {
          // TOUCH / MOBILE PANEL: Demonstrating HUD Speed Badge & Selector
          ctx.fillStyle = '#fde68a';
          ctx.font = 'bold 11px Cinzel, serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText('TOUCH HUD SPEED REGULATOR', cx, spreadY + 36);

          // Simulated HUD top bar showing the real badge
          const hudMockY = spreadY + 54;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          roundRect(ctx, cx - 165, hudMockY, 330, 52, 6);
          ctx.fill();
          ctx.strokeStyle = 'rgba(51, 65, 85, 0.6)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Render simulated HUD Speed Badge
          const badgeW = 160, badgeH = 36;
          const badgeX = cx - badgeW / 2, badgeY = hudMockY + 8;
          ctx.fillStyle = 'rgba(9, 13, 22, 0.95)';
          roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 6);
          ctx.fill();
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#ffd700';
          ctx.font = 'bold 10.5px Cinzel, serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('◈ SPEED: 1.00x', cx, badgeY + 12);
          ctx.fillStyle = '#67e8f9';
          ctx.font = 'bold 8.5px Cinzel, serif';
          ctx.fillText('[ TAP TO ADJUST ]', cx, badgeY + 25);

          // Popout Speed Selector Demonstration below
          const selDemoY = spreadY + 116;
          ctx.fillStyle = 'rgba(14, 11, 24, 0.98)';
          roundRect(ctx, cx - 140, selDemoY, 280, 44, 8);
          ctx.fill();
          ctx.strokeStyle = 'rgba(202, 138, 4, 0.9)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Presets row inside selector
          const pBtns = ['0.50×', '1.00×', '1.50×', '2.00×'];
          pBtns.forEach((pText, i) => {
            const bx = cx - 132 + i * 66;
            const by = selDemoY + 6;
            const isAct = (i === 1); // 1.00x active
            ctx.fillStyle = isAct ? 'rgba(217, 119, 6, 0.4)' : 'rgba(26, 20, 39, 0.85)';
            roundRect(ctx, bx, by, 60, 32, 5);
            ctx.fill();
            ctx.strokeStyle = isAct ? '#ffd700' : 'rgba(71, 85, 105, 0.6)';
            ctx.lineWidth = isAct ? 1.5 : 1;
            ctx.stroke();

            ctx.fillStyle = isAct ? '#fde68a' : '#cbd5e1';
            ctx.font = isAct ? 'bold 9.5px Cinzel, serif' : '9px Cinzel, serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(pText, bx + 30, by + 16);
            if (isAct) {
              ctx.fillStyle = '#f59e0b';
              ctx.fillRect(bx + 18, by + 26, 24, 2);
            }
          });

          // Tap guidance step callouts
          const calloutY = spreadY + 172;
          const steps = [
            '1. Tap the [ SPEED: 1.00x ] badge in the top right during active combat.',
            '2. The instant selector bar reveals all four simulation presets.',
            '3. Tap any preset (0.50×, 1.00×, 1.50×, 2.00×) to apply immediately.',
            '4. Tapping outside dismisses cleanly without triggering accidental attacks.'
          ];

          steps.forEach((step, sIdx) => {
            const sy = calloutY + sIdx * 30;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
            roundRect(ctx, cx - 165, sy, 330, 24, 4);
            ctx.fill();
            ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = '#fde68a';
            ctx.font = '8.5px "Crimson Text", serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(step, cx - 155, sy + 12);
          });

          // Speedrun footnote
          ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
          ctx.font = 'italic 8.5px "Crimson Text", serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText('Official speedrun records track true elapsed time; simulation speed changes never alter records.', cx, spreadY + 304);
        }
      }

      // ── Right Folio: Tactical Doctrine & Directives (Platform Aware) ──
      ctx.fillStyle = 'rgba(12, 16, 32, 0.85)';
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.55)';
      ctx.lineWidth = 1;
      roundRect(ctx, rightX, spreadY, rightW, spreadH, 8);
      ctx.fill(); ctx.stroke();

      const doctrines = [
        {
          num: 'CHAPTER I',
          title: 'THE VANGUARD ARSENAL',
          subtitle: 'Armed Engagement, Poise Stagger & Weapon Switching',
          points: isMobileMode ? [
            { tag: '[ ⚔ ATK BUTTON ]', desc: 'Tap the red attack button to execute primary weapon cleave. Deals heavy physical poise stagger to frontline foes.' },
            { tag: '[ 🏹 SHOOT BUTTON ]', desc: 'Tap or hold the green bow button to fire piercing arrows directly across the arena without manually swapping weapons.' },
            { tag: '[ ✨ SPECIAL BUTTON ]', desc: 'Tap the gold special button to trigger Rowan\'s consecrated weapon-specific relic ability.' }
          ] : [
            { tag: '[ SPACE / LMB ]', desc: 'Execute primary weapon cleave. Deals heavy physical poise damage and staggers frontliners.' },
            { tag: '[ HOLD SHIFT ]', desc: 'Draw and fire the Longbow for piercing projectile shots directly without manual weapon swapping.' },
            { tag: '[ KEYS 1 - 3 ]', desc: 'Instant hotkey weapon switching. Swap between heavy blade, swift longbow, and relics mid-combo.' }
          ],
          tip: isMobileMode ? 'Tip: Buttons can be freely repositioned or resized via Settings > Touch Controls.' : 'Tip: [E] swaps nearby ground weapons; [G] opens the full weapon inventory replacement modal.'
        },
        {
          num: 'CHAPTER II',
          title: 'TACTICAL FOOTWORK & SPACING',
          subtitle: 'Kiting Cadence, Hazard Avoidance & Recovery Punishment',
          points: isMobileMode ? [
            { tag: '[ VIRTUAL JOYSTICK ]', desc: 'Touch and drag anywhere in the bottom-left screen area for 360° fluid analog motion.' },
            { tag: '[ BAIT & PUNISH ]', desc: 'Circle opponents at outer melee reach to trigger their windup, then step in to strike during recovery.' },
            { tag: '[ CHOKEPOINTS ]', desc: 'Funnel hordes into narrow corridors so enemies can only approach single-file.' }
          ] : [
            { tag: '[ WASD / ARROWS ]', desc: 'Directional footwork. Rowan accelerates swiftly to maintain safe spacing and kite swarms.' },
            { tag: '[ BAIT & PUNISH ]', desc: 'Circle opponents at outer melee reach to trigger their windup, then step in to strike during recovery.' },
            { tag: '[ CHOKEPOINTS ]', desc: 'Funnel hordes into narrow corridors so enemies can only approach single-file.' }
          ],
          tip: 'Tip: Strike immediately following an enemy whiff to capitalize on recovery vulnerability frames.'
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
        },
        {
          num: 'CHAPTER VI',
          title: 'TIME & TEMPO',
          subtitle: 'Temporal Drift & Speedrunning Integrity',
          points: isMobileMode ? [
            { tag: '[ LIVE HUD SELECTOR ]', desc: 'Tap the speed indicator in the top-right HUD to summon the four-tier speed selector without opening pause or settings.' },
            { tag: '[ 4 SIMULATION PRESETS ]', desc: 'Select 0.50× (Tactical Slomo), 1.00× (Standard), 1.50× (Accelerated), or 2.00× (Hyper-Tempo) on the fly.' },
            { tag: '[ SPEEDRUN INTEGRITY ]', desc: 'Official descent records, split timers, and floor goals measure true elapsed wall-clock seconds. Simulation tempo changes never corrupt official times.' }
          ] : [
            { tag: '[ O / P HOTKEYS ]', desc: 'Press [ O ] to decrease simulation tempo by 0.25× and [ P ] to increase tempo by 0.25× during live combat.' },
            { tag: '[ 4 SIMULATION PRESETS ]', desc: 'Select 0.50× (Tactical Slomo), 1.00× (Standard), 1.50× (Accelerated), or 2.00× (Hyper-Tempo) on the fly.' },
            { tag: '[ SPEEDRUN INTEGRITY ]', desc: 'Official descent records, split timers, and floor goals measure true elapsed wall-clock seconds. Simulation tempo changes never corrupt official times.' }
          ],
          tip: 'Tip: Slow down to 0.50× to learn complex boss telegraphed patterns; speed up to 2.00× once mastered for intense fast-paced clearing.'
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
        roundRect(ctx, rightX + 20, py, 148, 20, 4);
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pt.tag, rightX + 94, py + 10);

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

    // 10. PRE-DESCENT LOADOUT CALIBRATION MODAL (STANDARD RUNS)
    if (_loadoutModalOpen) {
      drawPreDescentLoadoutModal(ctx, dt, mouseX, mouseY);
    }

    // 11. DEVELOPER SANCTUM ACCESS GATE MODAL
    if (DeveloperSanctumUI.isGateOpen()) {
      DeveloperSanctumUI.draw(ctx, dt);
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

    if (DeveloperSanctumUI.isGateOpen()) {
      if (DeveloperSanctumUI.handleClick(mx, my)) return true;
    }

    if (_loadoutModalOpen) {
      if (handleLoadoutModalClick(mx, my)) return true;
    }

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

      // Platform Mode Switcher clicks (Top Right: PC vs Mobile)
      const pcBtnW = 112, mobBtnW = 112, swBtnH = 22;
      const mobBtnX = mxX + mw - 24 - mobBtnW;
      const pcBtnX = mobBtnX - 8 - pcBtnW;
      const swBtnY = myY + 14;

      if (mx >= pcBtnX && mx <= pcBtnX + pcBtnW && my >= swBtnY && my <= swBtnY + swBtnH) {
        _fieldGuideInputMode = 'pc';
        _fieldGuideDemoRunning = false;
        _fieldGuideDemoTimer = 0;
        SoundManager.snd('menu_select');
        return true;
      }

      if (mx >= mobBtnX && mx <= mobBtnX + mobBtnW && my >= swBtnY && my <= swBtnY + swBtnH) {
        _fieldGuideInputMode = 'mobile';
        _fieldGuideDemoRunning = false;
        _fieldGuideDemoTimer = 0;
        SoundManager.snd('menu_select');
        return true;
      }

      // Chapter tabs click detection (6 tabs)
      const tabW = 120, tabH = 26;
      const tabStartX = mxX + Math.round((mw - (6 * tabW + 5 * 6)) / 2);
      const tabY = myY + 50;
      for (let i = 0; i < 6; i++) {
        const tx = tabStartX + i * (tabW + 6);
        if (mx >= tx && mx <= tx + tabW && my >= tabY && my <= tabY + tabH) {
          _fieldGuideChapter = i;
          _fieldGuideDemoRunning = false;
          _fieldGuideDemoCompleted = false;
          _fieldGuideDemoTimer = 0;
          SoundManager.snd('menu_hover');
          return true;
        }
      }

      // Demonstration button in Chapter 3 (Rally)
      if (_fieldGuideChapter === 3) {
        const leftX = mxX + 20, leftW = 380;
        const cx = leftX + leftW / 2;
        const spreadY = myY + 84;
        const ty = spreadY + 168;
        const demoBtnW = 200, demoBtnH = 26;
        const demoBtnX = cx - demoBtnW / 2;
        const demoBtnY = ty + 96;

        if (mx >= demoBtnX && mx <= demoBtnX + demoBtnW && my >= demoBtnY && my <= demoBtnY + demoBtnH) {
          _fieldGuideDemoRunning = true;
          _fieldGuideDemoCompleted = false;
          _fieldGuideDemoTimer = 0;
          SoundManager.snd('menu_press');
          return true;
        }
      }

      // Prev Doctrine button
      const leftX = mxX + 20;
      const bBarY = myY + mh - 44;
      if (mx >= leftX && mx <= leftX + 130 && my >= bBarY && my <= bBarY + 30) {
        _fieldGuideChapter = (_fieldGuideChapter - 1 + 6) % 6;
        _fieldGuideDemoRunning = false;
        _fieldGuideDemoCompleted = false;
        _fieldGuideDemoTimer = 0;
        SoundManager.snd('menu_hover');
        return true;
      }

      // Next Doctrine button
      const nextX = leftX + 140;
      if (mx >= nextX && mx <= nextX + 130 && my >= bBarY && my <= bBarY + 30) {
        _fieldGuideChapter = (_fieldGuideChapter + 1) % 6;
        _fieldGuideDemoRunning = false;
        _fieldGuideDemoCompleted = false;
        _fieldGuideDemoTimer = 0;
        SoundManager.snd('menu_hover');
        return true;
      }

      // Start Descent Button
      const startW = 180;
      const startX = mxX + mw - 20 - startW;
      if (mx >= startX && mx <= startX + startW && my >= bBarY && my <= bBarY + 30) {
        _fieldGuideDemoRunning = false;
        _fieldGuideDemoCompleted = false;
        _fieldGuideDemoTimer = 0;
        SoundManager.snd('menu_select');
        startGame();
        return true;
      }

      // Close Manual Button
      const closeW = 150;
      const closeX = startX - 12 - closeW;
      if (mx >= closeX && mx <= closeX + closeW && my >= bBarY && my <= bBarY + 30) {
        _fieldGuideDemoRunning = false;
        _fieldGuideDemoCompleted = false;
        _fieldGuideDemoTimer = 0;
        SoundManager.snd('panel_close');
        _howToPlayActive = false;
        return true;
      }

      // Click outside modal closes it
      if (mx < mxX || mx > mxX + mw || my < myY || my > myY + mh) {
        _fieldGuideDemoRunning = false;
        _fieldGuideDemoCompleted = false;
        _fieldGuideDemoTimer = 0;
        SoundManager.snd('panel_close');
        _howToPlayActive = false;
        return true;
      }
      return true;
    }

    // Immersive Mode Fullscreen Plaque
    if (_fullscreenBtnRect && mx >= _fullscreenBtnRect.x && mx <= _fullscreenBtnRect.x + _fullscreenBtnRect.w &&
        my >= _fullscreenBtnRect.y && my <= _fullscreenBtnRect.y + _fullscreenBtnRect.h) {
      FullscreenHelper.toggle();
      SoundManager.snd('menu_select');
      return true;
    }

    // Check text-first buttons with comfortable hit box
    for (const b of _titleBtns) {
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y - 4 && my <= b.y + b.h + 4) {
        if (typeof b.idx === 'number') {
          _focusedIndex = b.idx;
        }
        if (b.disabled) {
          SoundManager.snd('error_disabled');
          return true;
        }
        SoundManager.snd('menu_select');
        b.action();
        return true;
      }
    }

    // Secret Relic Button (Developer Sanctum)
    if (_relicBtnRect && mx >= _relicBtnRect.x && mx <= _relicBtnRect.x + _relicBtnRect.w &&
        my >= _relicBtnRect.y && my <= _relicBtnRect.y + _relicBtnRect.h) {
      DeveloperSanctumUI.openGate();
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
  },
  openSurvivalGuide() {
    _howToPlayActive = true;
  },
  closeSurvivalGuide() {
    _howToPlayActive = false;
    _fieldGuideDemoRunning = false;
    _fieldGuideDemoCompleted = false;
    _fieldGuideDemoTimer = 0;
  },
  getFocusedIndex() {
    return _focusedIndex;
  },
  getTitleButtons() {
    return _titleBtns;
  },
  isHowToPlayActive() {
    return _howToPlayActive;
  },
  setSurvivalGuideMode(mode) {
    if (mode === 'pc' || mode === 'mobile') {
      _fieldGuideInputMode = mode;
      _fieldGuideDemoRunning = false;
      _fieldGuideDemoTimer = 0;
    }
  },
  setSurvivalGuideChapter(chap) {
    _fieldGuideChapter = (chap % 6 + 6) % 6;
  },
  getSurvivalGuideState() {
    return {
      active: _howToPlayActive,
      chapter: _fieldGuideChapter,
      mode: _fieldGuideInputMode
    };
  },
  handleSurvivalGuideClick(mx, my) {
    return this.handleClick(mx, my);
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
