// =====================================================================
//  DUNGEON BREAK — js/rendering/BestiaryPortraitRenderer.js
//  Authentic In-Game Pixel-Art Portrait & Memory Scene Canvas 2D Renderer
//  Strict Policy: 100% In-Game Renderers, Zero Emojis, Zero Placeholders
// =====================================================================

import { CharacterRenderer } from './CharacterRenderer.js';
import { roundRect } from '../core/Constants.js';
import { drawPixelEye } from '../cinematics/ShatteredMindCinematic.js';

// ─────────────────────────────────────────────────────────────
// 10 Custom Floor Chronicle Atmospheric Artwork Preload Cache
// ─────────────────────────────────────────────────────────────
const CHRONICLE_ASSETS = {};
function _preloadChronicleAssets() {
  if (typeof Image === 'undefined') return;
  for (let f = 1; f <= 10; f++) {
    const img = new Image();
    const entry = { img, loaded: false };
    img.onload = () => { entry.loaded = true; };
    img.onerror = () => { entry.loaded = false; };
    img.src = `assets/codex/chronicles/chronicle_floor_${f}.jpg`;
    CHRONICLE_ASSETS[f] = entry;
  }
}
_preloadChronicleAssets();

export const BestiaryPortraitRenderer = {
  /**
   * Render an authentic enemy or boss portrait inside a bounding box
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} creatureId - 'skeleton' | 'ghoul' | 'demon' | 'wraith' | 'gorgaroth' | 'malakor' | 'warden'
   * @param {number} x - Box X
   * @param {number} y - Box Y
   * @param {number} w - Box Width
   * @param {number} h - Box Height
   * @param {boolean} isUnlocked - Whether creature is discovered
   * @param {number} time - Animation timer in seconds
   */
  drawPortrait(ctx, creatureId, x, y, w, h, isUnlocked = true, time = 0) {
    ctx.save();

    // 1. Portrait Frame & Stone Pedestal Backdrop
    ctx.fillStyle = creatureId === 'absolute' ? '#020104' : '#060913';
    ctx.strokeStyle = isUnlocked
      ? (creatureId === 'absolute' ? 'rgba(220, 38, 38, 0.65)' : 'rgba(201, 168, 76, 0.45)')
      : 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();

    // Subtle atmospheric ambient back-gradient
    const grad = ctx.createRadialGradient(x + w / 2, y + h / 2, 5, x + w / 2, y + h / 2, w / 1.1);
    if (!isUnlocked) {
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.6)');
      grad.addColorStop(1, 'rgba(2, 6, 14, 0.95)');
    } else if (creatureId === 'absolute') {
      grad.addColorStop(0, 'rgba(185, 28, 28, 0.28)');
      grad.addColorStop(0.5, 'rgba(69, 10, 10, 0.10)');
      grad.addColorStop(1, 'rgba(2, 1, 4, 0.98)');
    } else if (creatureId === 'warden' || creatureId === 'demon') {
      grad.addColorStop(0, 'rgba(153, 27, 27, 0.35)');
      grad.addColorStop(1, 'rgba(6, 9, 19, 0.95)');
    } else if (creatureId === 'malakor' || creatureId === 'wraith') {
      grad.addColorStop(0, 'rgba(107, 33, 168, 0.35)');
      grad.addColorStop(1, 'rgba(6, 9, 19, 0.95)');
    } else if (creatureId === 'gorgaroth') {
      grad.addColorStop(0, 'rgba(180, 83, 9, 0.32)');
      grad.addColorStop(1, 'rgba(6, 9, 19, 0.95)');
    } else {
      grad.addColorStop(0, 'rgba(30, 41, 59, 0.4)');
      grad.addColorStop(1, 'rgba(6, 9, 19, 0.95)');
    }
    ctx.fillStyle = grad;
    roundRect(ctx, x + 2, y + 2, w - 4, h - 4, 6);
    ctx.fill();

    // Clip to portrait box for clean borders
    ctx.beginPath();
    roundRect(ctx, x + 2, y + 2, w - 4, h - 4, 6);
    ctx.clip();

    // Grid / Dungeon Wall Mortar Lines in background
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let gy = y + 16; gy < y + h; gy += 24) {
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + w, gy);
      ctx.stroke();
    }

    const cx = Math.round(x + w / 2);
    const cy = Math.round(y + h * 0.62);

    // 2. Locked State: Dark Shadow Silhouette with Occult Seal
    if (!isUnlocked) {
      this._drawLockedSilhouette(ctx, creatureId, cx, cy, w, h, time);
      ctx.restore();
      return;
    }

    // 3. Ground Contact Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    const shadowR = creatureId === 'warden' || creatureId === 'gorgaroth' ? 28 : (creatureId === 'malakor' ? 22 : 16);
    ctx.ellipse(cx, cy + (creatureId === 'warden' ? 14 : 10), shadowR, shadowR * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Render Creature using Authentic Production Renderer Logic
    const bob = Math.sin(time * 3.0) * 2;
    const pulse = Math.sin(time * 2.5) * 0.5 + 0.5;

    ctx.save();
    ctx.translate(cx, cy + bob);

    switch (creatureId) {
      case 'skeleton': {
        ctx.scale(2.5, 2.5);
        this._drawSkeleton(ctx, pulse);
        break;
      }
      case 'ghoul': {
        ctx.scale(2.4, 2.4);
        this._drawGhoul(ctx, pulse);
        break;
      }
      case 'demon': {
        ctx.scale(2.3, 2.3);
        this._drawDemon(ctx, pulse);
        break;
      }
      case 'wraith': {
        ctx.scale(2.4, 2.4);
        this._drawWraith(ctx, pulse, time);
        break;
      }
      case 'gorgaroth': {
        this._drawGorgaroth(ctx, pulse, time);
        break;
      }
      case 'malakor': {
        this._drawMalakor(ctx, pulse, time);
        break;
      }
      case 'warden': {
        this._drawWarden(ctx, pulse, time);
        break;
      }
      case 'absolute': {
        this._drawAbsolute(ctx, pulse, time);
        break;
      }
      default: {
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }

    ctx.restore();

    // Inner bevel shadow
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    roundRect(ctx, x + 3, y + 3, w - 6, h - 6, 5);
    ctx.stroke();

    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────
  // THE ABSOLUTE PORTRAIT RENDERER (LOCKED APPROVED EYE REUSE)
  // ─────────────────────────────────────────────────────────────
  _drawAbsolute(ctx, pulse, time) {
    // Center vertically in portrait frame (slightly up from ground pedestal)
    ctx.translate(0, -14);

    // Subtle atmospheric movement: faint hover pulse
    const eyePulse = 1.0 + Math.sin(time * 1.8) * 0.025;

    // Brief, controlled idle blink every 6.2s (lasting 0.35s)
    const blinkCycle = time % 6.2;
    let blinkProg = 0;
    if (blinkCycle > 5.85) {
      blinkProg = Math.sin(((blinkCycle - 5.85) / 0.35) * Math.PI);
    }

    // Reuse the exact approved red pixel-art eye
    drawPixelEye(ctx, 0, 0, 1.45 * eyePulse, blinkProg, time);
  },

  // ─────────────────────────────────────────────────────────────
  // AUTHENTIC ENEMY PREVIEW RENDERERS
  // ─────────────────────────────────────────────────────────────

  _drawSkeleton(ctx, pulse) {
    // Cranium
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(0, -9, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Eye sockets & glowing red pinpricks
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-2, -9, 1.4, 0, Math.PI * 2);
    ctx.arc(2, -9, 1.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-2, -9, 0.8, 0, Math.PI * 2);
    ctx.arc(2, -9, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Ribcage & Spine
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-1.5, -4, 3, 11);
    ctx.fillRect(-6, -2, 12, 1.5);
    ctx.fillRect(-5, 1, 10, 1.5);
    ctx.fillRect(-4, 4, 8, 1.5);

    // Rusted Blade
    ctx.fillStyle = '#78350f';
    ctx.fillRect(5, -4, 2.5, 12);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(4.5, -12, 3.5, 9);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(3.5, -3, 5.5, 1.5);
  },

  _drawGhoul(ctx, pulse) {
    // Hunched Torso
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.ellipse(0, -3, 8, 7, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Feral Head
    ctx.beginPath();
    ctx.arc(4, -6, 5, 0, Math.PI * 2);
    ctx.fill();

    // Piercing Red Eye
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(5, -7, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Razor Claws
    ctx.fillStyle = '#052e16';
    ctx.fillRect(4, 2, 4, 2.2);
    ctx.fillRect(0, 3, 4, 2.2);
  },

  _drawDemon(ctx, pulse) {
    // Horned Wings
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.moveTo(-4, -6);
    ctx.lineTo(-14, -14);
    ctx.lineTo(-12, -2);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(4, -6);
    ctx.lineTo(14, -14);
    ctx.lineTo(12, -2);
    ctx.closePath();
    ctx.fill();

    // Muscular Torso
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.arc(0, -4, 8, 0, Math.PI * 2);
    ctx.fill();

    // Horns
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(-6, -11); ctx.lineTo(-10, -18); ctx.lineTo(-3, -13);
    ctx.moveTo(6, -11); ctx.lineTo(10, -18); ctx.lineTo(3, -13);
    ctx.fill();

    // Molten Glowing Core
    ctx.fillStyle = '#f97316';
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, -3, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  },

  _drawWraith(ctx, pulse, time) {
    // Flowing Phantom Robes
    ctx.fillStyle = '#581c87';
    ctx.beginPath();
    ctx.moveTo(-7, -4);
    ctx.lineTo(7, -4);
    ctx.lineTo(5 + Math.sin(time * 4) * 1.5, 13);
    ctx.lineTo(-5 - Math.sin(time * 4) * 1.5, 13);
    ctx.closePath();
    ctx.fill();

    // Hooded Cowl
    ctx.fillStyle = '#3b0764';
    ctx.beginPath();
    ctx.arc(0, -9, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // Void Eyes
    ctx.fillStyle = '#c084fc';
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(-2, -9, 1.5, 0, Math.PI * 2);
    ctx.arc(2, -9, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  },

  _drawGorgaroth(ctx, pulse, time) {
    ctx.save();
    ctx.translate(0, 4);
    ctx.scale(0.88, 0.88);
    const boss = {
      id: 'gorgaroth',
      phase: 1,
      defeatState: null,
      introRevealStage: null,
      weaponDropped: false,
      ph: time
    };
    CharacterRenderer.drawGorgaroth(ctx, boss, false, pulse);
    ctx.restore();
  },

  _drawMalakor(ctx, pulse, time) {
    ctx.save();
    ctx.translate(0, -6);
    ctx.scale(1.02, 1.02);
    const boss = {
      id: 'malakor',
      phase: 1,
      vulnTimer: 0,
      isChargingVolley: false,
      ph: time * 6
    };
    CharacterRenderer.drawMalakor(ctx, boss, false, pulse);
    ctx.restore();
  },

  _drawWarden(ctx, pulse, time) {
    ctx.save();
    ctx.translate(0, 10);
    ctx.scale(0.78, 0.78);
    const boss = {
      id: 'abyss_warden',
      phase: 1,
      defeatState: null,
      introRevealStage: null,
      weaponDropped: false,
      crackedArmor: false,
      eyeGlow: 1.0,
      ph: time * 4
    };
    CharacterRenderer.drawWarden(ctx, boss, false, pulse);
    ctx.restore();
  },

  _drawLockedSilhouette(ctx, creatureId, cx, cy, w, h, time) {
    // Draw creature in authentic black shadow silhouette
    ctx.save();
    ctx.translate(cx, cy);

    if (creatureId === 'gorgaroth') {
      ctx.translate(0, 4);
      ctx.scale(0.88, 0.88);
      const boss = {
        id: 'gorgaroth',
        phase: 1,
        defeatState: null,
        introRevealStage: 'silhouette',
        weaponDropped: false,
        ph: 0
      };
      CharacterRenderer.drawGorgaroth(ctx, boss, false, 0);
    } else if (creatureId === 'malakor') {
      ctx.translate(0, -6);
      ctx.scale(1.02, 1.02);
      ctx.fillStyle = '#05010a';
      // Authentic Malakor silhouette geometry
      ctx.beginPath();
      ctx.moveTo(0, -44);
      ctx.lineTo(16, -42);
      ctx.lineTo(28, -28);
      ctx.lineTo(24, -8);
      ctx.lineTo(28, 14);
      ctx.lineTo(20, 44);
      ctx.lineTo(6, 48);
      ctx.lineTo(0, 38);
      ctx.lineTo(-8, 46);
      ctx.lineTo(-14, 30);
      ctx.lineTo(-8, 18);
      ctx.lineTo(-20, 6);
      ctx.lineTo(-14, -14);
      ctx.lineTo(-26, -26);
      ctx.lineTo(-12, -40);
      ctx.closePath();
      ctx.fill();
      // Horned helm silhouette
      ctx.beginPath();
      ctx.moveTo(0, -48);
      ctx.lineTo(8, -54);
      ctx.lineTo(14, -40);
      ctx.lineTo(4, -36);
      ctx.lineTo(-4, -36);
      ctx.lineTo(-12, -44);
      ctx.lineTo(-6, -52);
      ctx.closePath();
      ctx.fill();
    } else if (creatureId === 'warden') {
      ctx.translate(0, 10);
      ctx.scale(0.78, 0.78);
      const boss = {
        id: 'abyss_warden',
        phase: 1,
        defeatState: null,
        introRevealStage: 'silhouette',
        weaponDropped: false,
        crackedArmor: false,
        eyeGlow: 0,
        ph: 0
      };
      CharacterRenderer.drawWarden(ctx, boss, false, 0);
    } else if (creatureId === 'wraith') {
      ctx.scale(1.6, 1.6);
      ctx.fillStyle = '#05020c';
      ctx.beginPath();
      ctx.arc(0, -12, 8, 0, Math.PI * 2);
      ctx.moveTo(-10, -6);
      ctx.lineTo(10, -6);
      ctx.lineTo(7, 16);
      ctx.lineTo(-7, 16);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.scale(1.8, 1.8);
      ctx.fillStyle = '#050814';
      ctx.beginPath();
      ctx.arc(0, -8, 6, 0, Math.PI * 2);
      ctx.rect(-6, -2, 12, 14);
      ctx.fill();
    }
    ctx.restore();

    // Mysterious Glowing Lock Sigil in center
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy - 4, 14, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 13px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', cx, cy - 3);

    ctx.fillStyle = 'rgba(148, 163, 184, 0.65)';
    ctx.font = '9px Cinzel, serif';
    ctx.fillText('UNDISCOVERED', cx, cy + 22);
  },

  /**
   * Render an authentic pixel-art scene thumbnail for a memory echo
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} sceneType - Scene composition identifier
   * @param {number} x - Thumbnail box X
   * @param {number} y - Thumbnail box Y
   * @param {number} w - Thumbnail box Width
   * @param {number} h - Thumbnail box Height
   * @param {boolean} isUnlocked - Whether memory is unlocked
   * @param {number} time - Animation timer in seconds
   */
  drawMemoryThumbnail(ctx, sceneType, x, y, w, h, isUnlocked = true, time = 0) {
    ctx.save();

    // Outer frame
    ctx.fillStyle = '#050814';
    ctx.strokeStyle = isUnlocked ? 'rgba(201, 168, 76, 0.55)' : 'rgba(51, 65, 85, 0.35)';
    ctx.lineWidth = 1.2;
    roundRect(ctx, x, y, w, h, 6);
    ctx.fill();
    ctx.stroke();

    // Clip to thumbnail area
    ctx.beginPath();
    roundRect(ctx, x + 2, y + 2, w - 4, h - 4, 5);
    ctx.clip();

    if (!isUnlocked) {
      // Locked Echo: dark obsidian texture with misty fog and glowing lock glyph
      ctx.fillStyle = '#090d1a';
      ctx.fillRect(x, y, w, h);

      // Subtle fog drift
      const fogOffset = Math.sin(time * 0.8) * 12;
      ctx.fillStyle = 'rgba(30, 41, 59, 0.25)';
      ctx.beginPath();
      ctx.ellipse(x + w / 2 + fogOffset, y + h / 2, w * 0.4, h * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(71, 85, 105, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2 - 8, 10, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(148, 163, 184, 0.65)';
      ctx.font = 'bold 10px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔒 ECHO SEALED', x + w / 2, y + h / 2 + 12);
      ctx.restore();
      return;
    }

    const cx = x + w / 2;
    const cy = y + h / 2;

    switch (sceneType) {
      case 'abandonment': {
        // Floor 1: Dark vault entrance, stone portcullis dropped, single flickering lantern & Rowan's broadsword
        ctx.fillStyle = '#080d1a';
        ctx.fillRect(x, y, w, h);

        // Stone masonry wall joints
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y + 6, w, 14);
        ctx.strokeRect(x, y + 20, w, 14);

        // Stone portcullis bars
        ctx.fillStyle = '#1e293b';
        for (let bx = x + 10; bx < x + w - 6; bx += 12) {
          ctx.fillRect(bx, y, 3.5, h - 14);
          // Spearhead points on portcullis bottom
          ctx.beginPath();
          ctx.moveTo(bx - 1.5, y + h - 14);
          ctx.lineTo(bx + 1.75, y + h - 8);
          ctx.lineTo(bx + 5, y + h - 14);
          ctx.fill();
        }
        ctx.fillRect(x + 4, y + 10, w - 8, 5);

        // Flickering lantern on ground with warm radial light
        const flamePulse = Math.sin(time * 5.0) * 0.15 + 0.85;
        const grad = ctx.createRadialGradient(cx - 24, y + h - 14, 2, cx - 24, y + h - 14, 38);
        grad.addColorStop(0, `rgba(245, 158, 11, ${0.85 * flamePulse})`);
        grad.addColorStop(0.5, `rgba(217, 119, 6, ${0.35 * flamePulse})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);

        // Lantern body
        ctx.fillStyle = '#78350f';
        ctx.fillRect(cx - 27, y + h - 18, 6, 8);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(cx - 26, y + h - 16, 4, 4);

        // Rowan's Vanguard Broadsword planted in the stone flags
        ctx.save();
        ctx.translate(cx + 20, y + h - 14);
        ctx.rotate(-0.18);
        // Blade
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-2, -32, 4, 32);
        // Fuller groove
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-0.5, -30, 1, 26);
        // Crossguard
        ctx.fillStyle = '#d97706';
        ctx.fillRect(-7, -33, 14, 3);
        // Hilt & Pommel
        ctx.fillStyle = '#451a03';
        ctx.fillRect(-1.5, -40, 3, 7);
        ctx.fillStyle = '#d97706';
        ctx.beginPath(); ctx.arc(0, -41, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // Subtle drifting dust motes
        ctx.fillStyle = `rgba(254, 240, 138, ${0.4 * flamePulse})`;
        for (let i = 0; i < 4; i++) {
          const dx = cx - 30 + Math.sin(time * 1.5 + i * 2) * 20;
          const dy = y + h - 30 + Math.cos(time * 1.2 + i * 1.8) * 14;
          ctx.fillRect(dx, dy, 1.5, 1.5);
        }
        break;
      }

      case 'campfire': {
        // Peaceful night pine forest with animated warm campfire & soldier's shield
        ctx.fillStyle = '#04100c';
        ctx.fillRect(x, y, w, h);

        // Sky with soft starlight dots
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(x + 28, y + 8, 1, 1);
        ctx.fillRect(x + 82, y + 6, 1, 1);
        ctx.fillRect(x + 140, y + 10, 1, 1);

        // Pine silhouettes
        ctx.fillStyle = '#022c22';
        ctx.beginPath();
        ctx.moveTo(x + 14, y + 4); ctx.lineTo(x + 28, y + h); ctx.lineTo(x + 2, y + h);
        ctx.moveTo(x + 36, y + 10); ctx.lineTo(x + 48, y + h); ctx.lineTo(x + 24, y + h);
        ctx.moveTo(x + w - 16, y + 6); ctx.lineTo(x + w - 4, y + h); ctx.lineTo(x + w - 28, y + h);
        ctx.moveTo(x + w - 38, y + 12); ctx.lineTo(x + w - 24, y + h); ctx.lineTo(x + w - 50, y + h);
        ctx.fill();

        // Campfire pool & flames
        const grad = ctx.createRadialGradient(cx, y + h - 12, 3, cx, y + h - 12, 42);
        const fPulse = Math.sin(time * 6.5) * 0.15 + 0.85;
        grad.addColorStop(0, `rgba(249, 115, 22, ${0.9 * fPulse})`);
        grad.addColorStop(0.45, `rgba(234, 179, 8, ${0.4 * fPulse})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);

        // Firewood logs
        ctx.fillStyle = '#451a03';
        ctx.fillRect(cx - 12, y + h - 10, 24, 4);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(cx - 8, y + h - 12, 16, 3);

        // Layered animated flame tongues
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(cx - 8, y + h - 10);
        ctx.lineTo(cx, y + h - 24 + Math.sin(time * 8) * 3);
        ctx.lineTo(cx + 8, y + h - 10);
        ctx.fill();

        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(cx - 5, y + h - 10);
        ctx.lineTo(cx - 1, y + h - 22 + Math.sin(time * 9.5) * 2.5);
        ctx.lineTo(cx + 5, y + h - 10);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.moveTo(cx - 3, y + h - 10);
        ctx.lineTo(cx + 1, y + h - 18 + Math.sin(time * 11) * 2);
        ctx.lineTo(cx + 3, y + h - 10);
        ctx.fill();

        // Rising spark embers
        ctx.fillStyle = '#fde047';
        for (let i = 0; i < 4; i++) {
          const emberY = y + h - 24 - ((time * 18 + i * 9) % 24);
          const emberX = cx + Math.sin(time * 3 + i * 2) * 7;
          ctx.fillRect(emberX, emberY, 1.5, 1.5);
        }

        // Shield resting against a log on the right
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.ellipse(cx + 28, y + h - 12, 7, 10, 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1;
        ctx.stroke();
        break;
      }

      case 'battlefield': {
        // Traumatic burning standard / battlefield with scorched shields and ash wind
        ctx.fillStyle = '#140604';
        ctx.fillRect(x, y, w, h);

        // Ashen mounds
        ctx.fillStyle = '#260e06';
        ctx.beginPath();
        ctx.ellipse(cx, y + h - 4, w * 0.55, 16, 0, 0, Math.PI * 2);
        ctx.fill();

        // Distant battlefield fog
        ctx.fillStyle = 'rgba(69, 10, 10, 0.35)';
        ctx.fillRect(x, y + 10, w, 24);

        // Burning standard spear shaft
        ctx.fillStyle = '#78350f';
        ctx.fillRect(cx - 14, y + 8, 3, h - 14);

        // Spearhead
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(cx - 15, y + 8);
        ctx.lineTo(cx - 12.5, y + 2);
        ctx.lineTo(cx - 10, y + 8);
        ctx.fill();

        // Ragged tattered vanguard war banner waving in ash wind
        const wave = Math.sin(time * 3.5) * 3;
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath();
        ctx.moveTo(cx - 11, y + 10);
        ctx.lineTo(cx + 18 + wave, y + 16);
        ctx.lineTo(cx + 4, y + 26 + wave * 0.5);
        ctx.lineTo(cx - 11, y + 24);
        ctx.closePath();
        ctx.fill();

        // Gold lion crest on banner
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(cx - 5, y + 14 + wave * 0.3, 4, 4);

        // Broken sword & shattered shield in ground
        ctx.save();
        ctx.translate(cx + 26, y + h - 10);
        ctx.rotate(0.4);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-2, -18, 4, 18);
        ctx.fillStyle = '#475569';
        ctx.fillRect(-5, -19, 10, 2);
        ctx.restore();

        // Rising ash and fire embers
        ctx.fillStyle = '#f97316';
        for (let i = 0; i < 5; i++) {
          const ex = cx + 8 + Math.sin(time * 2.5 + i * 1.5) * 22;
          const ey = y + h - 12 - ((time * 16 + i * 8) % 36);
          ctx.fillRect(ex, ey, 1.5, 1.5);
        }
        break;
      }

      case 'void_eye': {
        // Shattered mind: Cosmic crimson celestial void eye with pulsing iris and psychic tendrils
        ctx.fillStyle = '#030108';
        ctx.fillRect(x, y, w, h);

        // Deep cosmic void mist
        const cosmicGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 44);
        const ep = Math.sin(time * 2.2) * 0.1 + 0.9;
        cosmicGrad.addColorStop(0, `rgba(239, 68, 68, ${0.9 * ep})`);
        cosmicGrad.addColorStop(0.35, `rgba(168, 85, 247, ${0.5 * ep})`);
        cosmicGrad.addColorStop(0.7, 'rgba(88, 28, 135, 0.25)');
        cosmicGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = cosmicGrad;
        ctx.fillRect(x, y, w, h);

        // Starfield dots
        ctx.fillStyle = 'rgba(216, 180, 254, 0.45)';
        ctx.fillRect(cx - 40, cy - 20, 1, 1);
        ctx.fillRect(cx + 44, cy + 18, 1, 1);
        ctx.fillRect(cx - 32, cy + 24, 1, 1);
        ctx.fillRect(cx + 38, cy - 22, 1, 1);

        // Swirling psychic tendrils
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.4)';
        ctx.lineWidth = 1.2;
        for (let a = 0; a < 4; a++) {
          const ang = (a * Math.PI / 2) + time * 0.8;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(ang) * 16, cy + Math.sin(ang) * 10);
          ctx.quadraticCurveTo(
            cx + Math.cos(ang + 0.5) * 32,
            cy + Math.sin(ang + 0.5) * 22,
            cx + Math.cos(ang + 1.0) * 44,
            cy + Math.sin(ang + 1.0) * 28
          );
          ctx.stroke();
        }

        // Eye sclera
        ctx.fillStyle = '#450a0a';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 22, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Glowing crimson iris
        ctx.fillStyle = '#f87171';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(cx, cy, 7 * ep, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Razor vertical slit pupil
        ctx.fillStyle = '#0a0101';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 1.8, 8 * ep, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'gorgaroth': {
        // Floor 3 victory: Colossal fallen executioner war pillar with glowing orange runes & snapped chains
        ctx.fillStyle = '#0f0a06';
        ctx.fillRect(x, y, w, h);

        // Arena flagstones
        ctx.strokeStyle = 'rgba(68, 64, 60, 0.45)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y + h - 22, w, 22);
        ctx.beginPath();
        ctx.moveTo(cx - 20, y + h - 22); ctx.lineTo(cx - 20, y + h);
        ctx.moveTo(cx + 30, y + h - 22); ctx.lineTo(cx + 30, y + h);
        ctx.stroke();

        // Colossal shattered War Pillar lying on the flags
        ctx.save();
        ctx.translate(cx, cy + 6);
        ctx.rotate(-0.14);

        // Shaft
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-32, -5, 64, 10);
        // Leather grip
        ctx.fillStyle = '#334155';
        ctx.fillRect(-8, -5, 14, 10);

        // Massive iron hammerhead
        ctx.fillStyle = '#292524';
        ctx.fillRect(16, -11, 26, 22);
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(16, -11, 26, 22);

        // Glowing molten ancient runes on hammerhead
        const rPulse = Math.sin(time * 3.5) * 0.2 + 0.8;
        ctx.fillStyle = '#ea580c';
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 8 * rPulse;
        ctx.fillRect(20, -4, 18, 3.5);
        ctx.shadowBlur = 0;
        ctx.restore();

        // Snapped heavy iron chain links strewn across flags
        ctx.strokeStyle = '#78716c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(cx - 36, cy + 12, 6, 3, 0.4, 0, Math.PI * 2);
        ctx.ellipse(cx - 24, cy + 14, 6, 3, -0.3, 0, Math.PI * 2);
        ctx.ellipse(cx + 34, cy + 15, 6, 3, 0.2, 0, Math.PI * 2);
        ctx.stroke();

        // Rising embers from cracked stone
        ctx.fillStyle = '#fb923c';
        for (let i = 0; i < 3; i++) {
          const ex = cx + 18 + Math.sin(time * 3 + i) * 8;
          const ey = cy + 4 - ((time * 12 + i * 8) % 18);
          ctx.fillRect(ex, ey, 1.5, 1.5);
        }
        break;
      }

      case 'malakor': {
        // Floor 6 victory: Dimensional purple void singularity & drifting obsidian shards
        ctx.fillStyle = '#080312';
        ctx.fillRect(x, y, w, h);

        // Swirling deep-violet event horizon
        const vGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 38);
        const vPulse = Math.sin(time * 3.0) * 0.15 + 0.85;
        vGrad.addColorStop(0, `rgba(192, 132, 252, ${0.9 * vPulse})`);
        vGrad.addColorStop(0.35, `rgba(147, 51, 234, ${0.5 * vPulse})`);
        vGrad.addColorStop(0.7, 'rgba(88, 28, 135, 0.25)');
        vGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = vGrad;
        ctx.fillRect(x, y, w, h);

        // Dimensional tear hairline seam
        ctx.strokeStyle = '#f5d0fe';
        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - 16, cy - 22);
        ctx.lineTo(cx, cy - 4);
        ctx.lineTo(cx - 6, cy + 14);
        ctx.lineTo(cx + 18, cy + 24);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Floating geometric obsidian shards drifting
        const shards = [
          { ox: -22, oy: -14, w: 7, h: 12 },
          { ox: 20, oy: -12, w: 8, h: 14 },
          { ox: -16, oy: 16, w: 6, h: 10 },
          { ox: 18, oy: 16, w: 7, h: 11 }
        ];
        shards.forEach((s, idx) => {
          const drift = Math.sin(time * 2.2 + idx * 1.5) * 3;
          ctx.fillStyle = '#1e0a35';
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.rect(cx + s.ox + drift, cy + s.oy, s.w, s.h);
          ctx.fill();
          ctx.stroke();
        });

        // Singularity black core center
        ctx.fillStyle = '#05010a';
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'warden': {
        // Floor 10: Sunken Citadel throne room, cathedral columns & authentic Warden silhouette with wings
        ctx.fillStyle = '#040207';
        ctx.fillRect(x, y, w, h);

        // Towering cathedral columns on left & right
        ctx.fillStyle = '#18121f';
        ctx.fillRect(x + 10, y, 8, h);
        ctx.fillRect(x + w - 18, y, 8, h);
        ctx.strokeStyle = '#3b0764';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 10, y, 8, h);
        ctx.strokeRect(x + w - 18, y, 8, h);

        // Altar Throne pedestal
        ctx.fillStyle = '#14031a';
        ctx.fillRect(cx - 24, y + h - 18, 48, 18);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.strokeRect(cx - 24, y + h - 18, 48, 18);

        // Authentic Warden silhouette with wings breathing
        const wFlap = Math.sin(time * 2.0) * 2.5;
        ctx.save();
        ctx.translate(cx, cy - 2);

        // Draconian wings
        ctx.fillStyle = '#1a0422';
        for (let side = -1; side <= 1; side += 2) {
          ctx.beginPath();
          ctx.moveTo(side * 6, 0);
          ctx.quadraticCurveTo(side * 28, -24 + wFlap, side * 36, -14 + wFlap);
          ctx.quadraticCurveTo(side * 26, 6 + wFlap, side * 6, 10);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Armored titan body & horned helm
        ctx.fillStyle = '#0a010f';
        ctx.beginPath();
        ctx.ellipse(0, 4, 10, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Horned crown
        ctx.beginPath();
        ctx.moveTo(-6, -10); ctx.lineTo(-12, -22); ctx.lineTo(-2, -14);
        ctx.moveTo(6, -10); ctx.lineTo(12, -22); ctx.lineTo(2, -14);
        ctx.fill();

        // Glowing predator slit eyes
        ctx.fillStyle = '#f87171';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 6;
        ctx.fillRect(-4, -8, 2.5, 1.5);
        ctx.fillRect(1.5, -8, 2.5, 1.5);
        ctx.shadowBlur = 0;

        // Abyssal Greatsword held in hand
        ctx.fillStyle = '#1c0404';
        ctx.fillRect(14, -20, 3, 34);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(14.5, -18, 2, 28);
        ctx.restore();
        break;
      }

      case 'hero': {
        // Golden sunrise breaking over surface stones & god rays
        const sGrad = ctx.createLinearGradient(x, y, x, y + h);
        sGrad.addColorStop(0, '#451a03');
        sGrad.addColorStop(0.35, '#d97706');
        sGrad.addColorStop(0.7, '#fef08a');
        sGrad.addColorStop(1, '#ffffff');
        ctx.fillStyle = sGrad;
        ctx.fillRect(x, y, w, h);

        // Sun disc breaking over horizon
        const sunPulse = Math.sin(time * 1.5) * 2;
        ctx.fillStyle = '#fffbeb';
        ctx.beginPath();
        ctx.arc(cx, y + 24, 18 + sunPulse, 0, Math.PI * 2);
        ctx.fill();

        // God rays streaming down
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(cx + i * 8, y + 24);
          ctx.lineTo(cx + i * 36 - 15, y + h);
          ctx.lineTo(cx + i * 36 + 15, y + h);
          ctx.closePath();
          ctx.fill();
        }

        // Stone horizon silhouettes
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(x, y + h - 16);
        ctx.lineTo(x + 35, y + h - 22);
        ctx.lineTo(x + 85, y + h - 18);
        ctx.lineTo(x + w, y + h - 24);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        ctx.fill();

        // Rowan & survivors silhouette walking toward the sunrise
        ctx.fillStyle = '#020617';
        // Rowan
        ctx.fillRect(cx - 10, y + h - 28, 6, 12); // body
        ctx.beginPath(); ctx.arc(cx - 7, y + h - 31, 3, 0, Math.PI * 2); ctx.fill(); // head
        // Broadsword on hip
        ctx.fillRect(cx - 12, y + h - 24, 2, 8);
        // Survivor
        ctx.fillRect(cx + 8, y + h - 26, 5, 10);
        ctx.beginPath(); ctx.arc(cx + 10.5, y + h - 29, 2.5, 0, Math.PI * 2); ctx.fill();

        // Floating golden dust motes ascending
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 6; i++) {
          const gx = cx + Math.sin(time * 2 + i * 1.5) * 40;
          const gy = y + h - 10 - ((time * 15 + i * 10) % (h - 20));
          ctx.fillRect(gx, gy, 1.5, 1.5);
        }
        break;
      }

      case 'betrayal': {
        // Cold palace arches with royal banners & leveling royal crossbows
        ctx.fillStyle = '#030712';
        ctx.fillRect(x, y, w, h);

        // High stone palace colonnade
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        for (let arcX = x + 16; arcX < x + w; arcX += 34) {
          ctx.beginPath();
          ctx.arc(arcX, y + 14, 14, Math.PI, 0);
          ctx.stroke();
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(arcX - 14, y + 14, 4, h - 28);
          ctx.fillRect(arcX + 10, y + 14, 4, h - 28);
        }

        // Royal crimson & gold hanging banners
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(cx - 24, y + 12, 10, 26);
        ctx.fillRect(cx + 14, y + 12, 10, 26);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(cx - 21, y + 20, 4, 8);
        ctx.fillRect(cx + 17, y + 20, 4, 8);

        // Cold blue mist streaks drifting across courtyard
        const mistX = Math.sin(time * 1.5) * 14;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.fillRect(x + mistX, y + h - 20, w * 0.8, 12);

        // Drawn royal crossbow silhouette in shadows
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 6;
        ctx.fillRect(cx - 38, y + 24, 8, 2);
        ctx.fillRect(cx + 30, y + 24, 8, 2);
        ctx.shadowBlur = 0;

        // Rowan silhouette alone in courtyard center
        ctx.fillStyle = '#020617';
        ctx.fillRect(cx - 4, y + h - 22, 8, 14);
        ctx.beginPath(); ctx.arc(cx, y + h - 25, 3.5, 0, Math.PI * 2); ctx.fill();
        break;
      }

      case 'rampage': {
        // Dark fiery comet ascending through shattered stone vault & abyssal lightning
        ctx.fillStyle = '#180404';
        ctx.fillRect(x, y, w, h);

        // Volcanic eruption radial core
        const rGrad = ctx.createRadialGradient(cx, y + h - 10, 3, cx, cy, 48);
        const rPulse = Math.sin(time * 8.0) * 0.2 + 0.8;
        rGrad.addColorStop(0, `rgba(254, 240, 138, ${0.95 * rPulse})`);
        rGrad.addColorStop(0.3, `rgba(249, 115, 22, ${0.8 * rPulse})`);
        rGrad.addColorStop(0.65, `rgba(220, 38, 38, ${0.45 * rPulse})`);
        rGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rGrad;
        ctx.fillRect(x, y, w, h);

        // Shattered stone fragments floating upward
        for (let i = 0; i < 5; i++) {
          const fy = y + h - 14 - ((time * 24 + i * 14) % (h - 10));
          const fx = cx + Math.sin(time * 3 + i * 2) * (20 + i * 5);
          ctx.fillStyle = '#292524';
          ctx.fillRect(fx, fy, 4, 3);
        }

        // Crackling lightning energy arcs
        ctx.strokeStyle = '#fef08a';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx - 6, y + h - 14);
        ctx.lineTo(cx + Math.sin(time * 14) * 8, cy);
        ctx.lineTo(cx - 4, y + 10);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Dark awakened avatar silhouette rising like a comet
        ctx.fillStyle = '#05010a';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 2, 7, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(cx - 2, cy - 8, 4, 2);
        break;
      }

      case 'musicbox': {
        // Echo I: Ornate golden-brass musical cylinder on velvet cushion with floating melody chimes
        ctx.fillStyle = '#080816';
        ctx.fillRect(x, y, w, h);

        // Velvet pedestal
        ctx.fillStyle = '#1e1b4b';
        roundRect(ctx, cx - 28, y + h - 18, 56, 12, 3);
        ctx.fill();
        ctx.strokeStyle = '#4338ca';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Music Box casing
        ctx.fillStyle = '#78350f';
        roundRect(ctx, cx - 20, y + h - 28, 40, 14, 2);
        ctx.fill();
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Rotating brass cylinder & winding key
        const keyPulse = Math.sin(time * 4) * 0.15 + 0.85;
        ctx.fillStyle = '#fde047';
        ctx.fillRect(cx - 14, y + h - 24, 28, 6);
        // Cylinder pins
        ctx.fillStyle = '#fffbeb';
        ctx.fillRect(cx - 8, y + h - 23, 2, 2);
        ctx.fillRect(cx + 2, y + h - 22, 2, 2);
        // Winding key on side
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx + 23, y + h - 21, 3.5, 0, Math.PI * 2);
        ctx.stroke();

        // Floating melody chimes & starlight notes
        ctx.fillStyle = `rgba(254, 240, 138, ${keyPulse})`;
        for (let i = 0; i < 4; i++) {
          const my = y + h - 30 - ((time * 16 + i * 11) % 36);
          const mx = cx - 12 + Math.sin(time * 2.5 + i * 2) * 16;
          ctx.beginPath();
          ctx.arc(mx, my, 2, 0, Math.PI * 2);
          ctx.fill();
          // Note stem
          ctx.fillRect(mx + 1, my - 5, 1, 5);
        }
        break;
      }

      case 'locket': {
        // Echo II: Open filigree gold locket on stone with coiled strand of amber hair & heartbeat pulse
        ctx.fillStyle = '#0c0714';
        ctx.fillRect(x, y, w, h);

        // Ancient dark stone base
        ctx.fillStyle = '#18121f';
        ctx.fillRect(x, y + h - 16, w, 16);

        // Expanding concentric golden heartbeat pulse rings
        const hb = (time * 3.5) % (Math.PI * 2);
        const r1 = 8 + (Math.sin(hb) * 0.5 + 0.5) * 22;
        ctx.strokeStyle = `rgba(245, 158, 11, ${Math.max(0, 0.45 - (r1 / 34) * 0.45)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(cx, cy - 2, r1, 0, Math.PI * 2); ctx.stroke();

        // Open oval gold medallion
        ctx.fillStyle = '#78350f';
        ctx.beginPath(); ctx.ellipse(cx, cy - 2, 16, 20, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Medallion filigree inner trim
        ctx.fillStyle = '#451a03';
        ctx.beginPath(); ctx.ellipse(cx, cy - 2, 12, 16, 0, 0, Math.PI * 2); ctx.fill();

        // Coiled strand of amber hair inside
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(cx - 4, cy - 8);
        ctx.quadraticCurveTo(cx + 6, cy - 4, cx - 2, cy + 2);
        ctx.quadraticCurveTo(cx + 4, cy + 6, cx, cy + 9);
        ctx.stroke();

        // Top chain loop
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(cx, cy - 23, 3, 0, Math.PI * 2); ctx.stroke();
        break;
      }

      case 'thorn': {
        // Echo III: Floating obsidian crystal thorn dagger with multifaceted violet refractions
        ctx.fillStyle = '#06030c';
        ctx.fillRect(x, y, w, h);

        // Stone pedestal
        ctx.fillStyle = '#140c1e';
        ctx.fillRect(cx - 24, y + h - 14, 48, 14);

        // Floating crystal offset
        const cFloat = Math.sin(time * 2.5) * 3;
        const crystalY = cy - 2 + cFloat;

        // Ambient crystal purple glow
        const cGrad = ctx.createRadialGradient(cx, crystalY, 3, cx, crystalY, 32);
        cGrad.addColorStop(0, 'rgba(192, 132, 252, 0.6)');
        cGrad.addColorStop(0.5, 'rgba(126, 34, 206, 0.25)');
        cGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = cGrad;
        ctx.fillRect(x, y, w, h);

        // Sharp faceted obsidian crystal thorn
        ctx.save();
        ctx.translate(cx, crystalY);

        // Main facet
        ctx.fillStyle = '#2e1065';
        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.lineTo(8, -4);
        ctx.lineTo(0, 18);
        ctx.lineTo(-8, -4);
        ctx.closePath();
        ctx.fill();

        // Shaded right facet
        ctx.fillStyle = '#4c1d95';
        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.lineTo(8, -4);
        ctx.lineTo(0, 18);
        ctx.closePath();
        ctx.fill();

        // Specular highlight facet
        ctx.strokeStyle = '#f5d0fe';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.lineTo(0, 18);
        ctx.stroke();

        // Tip spark
        const sparkPulse = Math.sin(time * 6) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(240, 171, 252, ${sparkPulse})`;
        ctx.fillRect(-1.5, -23, 3, 3);
        ctx.restore();
        break;
      }

      case 'starlight': {
        // Echo IV: Deep celestial cosmos with constellation lattice & luminous starlight whisper
        ctx.fillStyle = '#03020a';
        ctx.fillRect(x, y, w, h);

        // Constellation nodes & lattice lines
        const nodes = [
          { nx: cx - 34, ny: cy - 18 },
          { nx: cx - 12, ny: cy - 22 },
          { nx: cx + 22, ny: cy - 14 },
          { nx: cx + 36, ny: cy + 12 },
          { nx: cx + 8, ny: cy + 20 },
          { nx: cx - 24, ny: cy + 16 }
        ];

        ctx.strokeStyle = 'rgba(147, 197, 253, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < nodes.length; i++) {
          const next = nodes[(i + 1) % nodes.length];
          ctx.moveTo(nodes[i].nx, nodes[i].ny);
          ctx.lineTo(next.nx, next.ny);
        }
        ctx.stroke();

        ctx.fillStyle = '#93c5fd';
        nodes.forEach(nd => {
          ctx.fillRect(nd.nx - 1, nd.ny - 1, 2, 2);
        });

        // Ethereal luminous starlight butterfly / whisper in center
        const bFlutter = Math.sin(time * 7) * 4;
        const bY = cy + Math.sin(time * 2) * 3;

        // Butterfly wings
        ctx.fillStyle = 'rgba(216, 180, 254, 0.75)';
        ctx.beginPath();
        // Left wing
        ctx.ellipse(cx - 7, bY - 2, 8, 6 + bFlutter * 0.4, -0.4, 0, Math.PI * 2);
        // Right wing
        ctx.ellipse(cx + 7, bY - 2, 8, 6 + bFlutter * 0.4, 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Luminous butterfly body
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#60a5fa';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.ellipse(cx, bY, 2, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Trailing stardust particles
        ctx.fillStyle = '#fde047';
        for (let i = 0; i < 4; i++) {
          const px = cx - 16 + i * 10 + Math.sin(time * 3 + i) * 6;
          const py = bY + 8 + i * 4;
          ctx.fillRect(px, py, 1.5, 1.5);
        }
        break;
      }

      default: {
        // Fallback: Golden Archival Relic on Stone Pedestal
        ctx.fillStyle = '#0b0f1d';
        ctx.fillRect(x, y, w, h);

        ctx.fillStyle = '#d97706';
        ctx.fillRect(cx - 14, cy + 4, 28, 6);

        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(cx, cy - 2, 6, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }

    // Inner subtle glass reflection bevel
    const shine = ctx.createLinearGradient(x, y, x + w, y + h);
    shine.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    shine.addColorStop(0.35, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = shine;
    ctx.fillRect(x, y, w, h);

    ctx.restore();
  },

  /**
   * Render an authentic illustrated pixel-art scene for each of the 10 Chronicles
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} floorNum - 1 to 10
   * @param {number} x - Bounding box X
   * @param {number} y - Bounding box Y
   * @param {number} w - Bounding box Width
   * @param {number} h - Bounding box Height
   * @param {boolean} isUnlocked - Whether chronicle is unlocked
   * @param {number} time - Animation time in seconds
   */
  drawChronicleIllustration(ctx, floorNum, x, y, w, h, isUnlocked = true, time = 0) {
    ctx.save();

    // Outer Obsidian Frame & Inset Bevel
    ctx.fillStyle = '#060810';
    ctx.strokeStyle = isUnlocked ? 'rgba(201, 168, 76, 0.55)' : 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1.4;
    roundRect(ctx, x, y, w, h, 6);
    ctx.fill();
    ctx.stroke();

    // Clip to illustration canvas area
    ctx.beginPath();
    roundRect(ctx, x + 2, y + 2, w - 4, h - 4, 5);
    ctx.clip();

    const cx = Math.round(x + w / 2);
    const cy = Math.round(y + h / 2);

    // ─────────────────────────────────────────────────────────────
    // LOCKED STATE: Bound Ancient Vellum with Iron Chains & Padlock
    // ─────────────────────────────────────────────────────────────
    if (!isUnlocked) {
      // Dark aged leather / vellum texture
      ctx.fillStyle = '#0a0d18';
      ctx.fillRect(x, y, w, h);

      // Vignette shadows
      const lockVignette = ctx.createRadialGradient(cx, cy, 20, cx, cy, w * 0.55);
      lockVignette.addColorStop(0, 'rgba(15, 23, 42, 0.2)');
      lockVignette.addColorStop(1, 'rgba(2, 4, 10, 0.95)');
      ctx.fillStyle = lockVignette;
      ctx.fillRect(x, y, w, h);

      // Crossed Iron Shackle Bands
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;

      // Diagonal Band 1
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 22, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + w - 22, y + h);
      ctx.closePath();
      ctx.fill(); ctx.stroke();

      // Diagonal Band 2
      ctx.beginPath();
      ctx.moveTo(x + w, y);
      ctx.lineTo(x + w - 22, y);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x + 22, y + h);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.restore();

      // Translucent drifting void mist
      const mistShift = Math.sin(time * 0.8) * 25;
      const mistGrad = ctx.createRadialGradient(cx + mistShift, cy, 10, cx + mistShift, cy, 90);
      mistGrad.addColorStop(0, 'rgba(51, 65, 85, 0.35)');
      mistGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = mistGrad;
      ctx.fillRect(x, y, w, h);

      // Heavy Embossed Iron Padlock at Center
      const lockW = 32, lockH = 26;
      const lockX = cx - lockW / 2;
      const lockY = cy - lockH / 2 + 4;

      // Shackle
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(cx, lockY - 2, 10, Math.PI, 0, false);
      ctx.stroke();

      // Padlock Body
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      roundRect(ctx, lockX, lockY, lockW, lockH, 4);
      ctx.fill(); ctx.stroke();

      // Brass Corner Studs on Padlock
      ctx.fillStyle = '#d97706';
      ctx.fillRect(lockX + 3, lockY + 3, 2, 2);
      ctx.fillRect(lockX + lockW - 5, lockY + 3, 2, 2);
      ctx.fillRect(lockX + 3, lockY + lockH - 5, 2, 2);
      ctx.fillRect(lockX + lockW - 5, lockY + lockH - 5, 2, 2);

      // Keyhole
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(cx, lockY + 9, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx - 1.5, lockY + 9, 3, 7);

      // Text Ribbon
      ctx.fillStyle = 'rgba(10, 14, 24, 0.85)';
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.5)';
      ctx.lineWidth = 1;
      roundRect(ctx, cx - 120, y + h - 26, 240, 18, 4);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 8.5px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`◈ CHRONICLE VAULT SEALED · STRATUM ${floorNum} ◈`, cx, y + h - 17);

      ctx.restore();
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // UNLOCKED STATE: Custom Pixel-Art Artwork with Canvas 2D Fallback
    // ─────────────────────────────────────────────────────────────
    const asset = CHRONICLE_ASSETS[floorNum];
    if (asset && asset.loaded && asset.img) {
      ctx.drawImage(asset.img, x, y, w, h);

      // Subtle atmospheric bottom vignette for seamless frame integration
      const vig = ctx.createLinearGradient(x, y + h - 28, x, y + h);
      vig.addColorStop(0, 'rgba(6, 8, 16, 0)');
      vig.addColorStop(1, 'rgba(6, 8, 16, 0.40)');
      ctx.fillStyle = vig;
      ctx.fillRect(x, y + h - 28, w, 28);

      ctx.restore();
      return;
    }

    const isReducedMotion = (typeof GameState !== 'undefined' && GameState.REDUCED_MOTION) ||
      (typeof window !== 'undefined' && window.SaveSystem && window.SaveSystem.getSettings && window.SaveSystem.getSettings().reducedMotion);
    const animTime = isReducedMotion ? 0 : time;
    const pulse = isReducedMotion ? 0.75 : (Math.sin(time * 2.5) * 0.5 + 0.5);

    switch (floorNum) {
      // ───────────────────────────────────────────────────────────
      // FLOOR 1 — THE FORGOTTEN SEAL
      // Vault entrance, dropped portcullis, fallen sword, warm lantern
      // ───────────────────────────────────────────────────────────
      case 1: {
        // Vault chamber stonework background
        ctx.fillStyle = '#070c18';
        ctx.fillRect(x, y, w, h);

        // Stone masonry joints & weathered block texture
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
        ctx.lineWidth = 1;
        for (let gy = y + 14; gy < y + h - 20; gy += 18) {
          ctx.beginPath();
          ctx.moveTo(x, gy); ctx.lineTo(x + w, gy);
          ctx.stroke();
        }
        for (let row = 0; row < 5; row++) {
          const ry = y + 14 + row * 18;
          const off = (row % 2 === 0) ? 0 : 35;
          for (let gx = x + off; gx < x + w; gx += 70) {
            ctx.beginPath();
            ctx.moveTo(gx, ry); ctx.lineTo(gx, ry + 18);
            ctx.stroke();
          }
        }

        // Vault Keystone Archway in background
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.arc(cx, y + h - 10, w * 0.35, Math.PI, 0, false);
        ctx.stroke();

        // Glowing cyan ancient runes carved into the arch
        const runePulse = isReducedMotion ? 0.8 : (Math.sin(time * 2.2) * 0.25 + 0.75);
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.75 * runePulse})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(cx, y + h - 10, w * 0.35 + 5, Math.PI * 1.05, Math.PI * 1.95, false);
        ctx.stroke();

        // Dropped Heavy Iron Portcullis
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        const barSpacing = 16;
        for (let bx = x + 30; bx < x + w - 30; bx += barSpacing) {
          // Vertical bars
          ctx.fillRect(bx, y, 4, h - 22);
          // Pointed spear tips driven into flagstones
          ctx.beginPath();
          ctx.moveTo(bx - 2, y + h - 22);
          ctx.lineTo(bx + 2, y + h - 14);
          ctx.lineTo(bx + 6, y + h - 22);
          ctx.fill(); ctx.stroke();
        }
        // Horizontal reinforcing tie-beams with iron rivets
        ctx.fillRect(x + 20, y + 28, w - 40, 6);
        ctx.fillRect(x + 20, y + 68, w - 40, 6);
        ctx.fillStyle = '#d97706';
        for (let bx = x + 32; bx < x + w - 32; bx += barSpacing) {
          ctx.fillRect(bx + 1, y + 30, 2, 2);
          ctx.fillRect(bx + 1, y + 70, 2, 2);
        }

        // Flagstone floor
        ctx.fillStyle = '#090e1a';
        ctx.fillRect(x, y + h - 20, w, 20);
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y + h - 20); ctx.lineTo(x + w, y + h - 20);
        ctx.stroke();

        // Warm Flickering Brass Lantern on left flags
        const flamePulse = isReducedMotion ? 0.9 : (Math.sin(time * 5.5) * 0.15 + 0.85);
        const lanternX = cx - 95;
        const lanternY = y + h - 22;

        const lanternGlow = ctx.createRadialGradient(lanternX, lanternY - 4, 3, lanternX, lanternY - 4, 80);
        lanternGlow.addColorStop(0, `rgba(245, 158, 11, ${0.75 * flamePulse})`);
        lanternGlow.addColorStop(0.4, `rgba(217, 119, 6, ${0.35 * flamePulse})`);
        lanternGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = lanternGlow;
        ctx.fillRect(lanternX - 80, y, 160, h);

        // Lantern housing
        ctx.fillStyle = '#78350f';
        ctx.fillRect(lanternX - 4, lanternY - 14, 8, 12);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(lanternX - 2.5, lanternY - 12, 5, 8);
        ctx.fillStyle = '#d97706';
        ctx.strokeRect(lanternX - 4, lanternY - 14, 8, 12);
        ctx.beginPath();
        ctx.arc(lanternX, lanternY - 14, 3, Math.PI, 0, false);
        ctx.stroke();

        // Rowan's Vanguard Broadsword planted in the stones on the right
        const swordX = cx + 80;
        const swordY = y + h - 20;
        ctx.save();
        ctx.translate(swordX, swordY);
        ctx.rotate(-0.16);

        // Steel blade
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-2.5, -46, 5, 46);
        // Glowing runic fuller
        ctx.fillStyle = `rgba(56, 189, 248, ${0.85 * runePulse})`;
        ctx.fillRect(-0.75, -42, 1.5, 36);
        // Brass crossguard
        ctx.fillStyle = '#d97706';
        ctx.fillRect(-10, -48, 20, 4);
        // Grip and pommel
        ctx.fillStyle = '#451a03';
        ctx.fillRect(-2, -58, 4, 10);
        ctx.fillStyle = '#d97706';
        ctx.beginPath(); ctx.arc(0, -60, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // Floating dust motes caught in lantern light
        if (!isReducedMotion) {
          ctx.fillStyle = `rgba(254, 240, 138, ${0.5 * flamePulse})`;
          for (let i = 0; i < 6; i++) {
            const dx = lanternX - 30 + Math.sin(time * 1.5 + i * 1.8) * 35;
            const dy = y + 40 + Math.cos(time * 1.1 + i * 1.3) * 30;
            ctx.fillRect(dx, dy, 1.5, 1.5);
          }
        }
        break;
      }

      // ───────────────────────────────────────────────────────────
      // FLOOR 2 — THE DESERTERS' SILENCE
      // Discarded buckler, broken spear, abandoned campsite, cold ashes
      // ───────────────────────────────────────────────────────────
      case 2: {
        // Cold grey corridor masonry
        ctx.fillStyle = '#060a12';
        ctx.fillRect(x, y, w, h);

        // Distant stone arch hallway receding into gloom
        const corrGrad = ctx.createLinearGradient(cx - 60, y, cx + 60, y);
        corrGrad.addColorStop(0, '#04070d');
        corrGrad.addColorStop(0.5, '#020306');
        corrGrad.addColorStop(1, '#04070d');
        ctx.fillStyle = corrGrad;
        roundRect(ctx, cx - 55, y + 10, 110, h - 30, 4);
        ctx.fill();

        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        roundRect(ctx, cx - 55, y + 10, 110, h - 30, 4);
        ctx.stroke();

        // Cold stone flags
        ctx.fillStyle = '#0a0f1c';
        ctx.fillRect(x, y + h - 22, w, 22);
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y + h - 22); ctx.lineTo(x + w, y + h - 22);
        ctx.stroke();

        // Left: Cold Extinguished Camp Brazier with faint blue smoke
        const brazierX = cx - 110;
        const brazierY = y + h - 22;

        // Tripod stand and iron bowl
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(brazierX - 16, brazierY - 14, 32, 6);
        ctx.fillRect(brazierX - 12, brazierY - 8, 24, 8);
        ctx.strokeStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(brazierX - 14, brazierY); ctx.lineTo(brazierX - 10, brazierY - 8);
        ctx.moveTo(brazierX + 14, brazierY); ctx.lineTo(brazierX + 10, brazierY - 8);
        ctx.stroke();

        // Cold ash bed
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(brazierX - 14, brazierY - 16, 28, 3);

        // Cold wisps of pale blue smoke curling into the air
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let sy = 0; sy < 36; sy += 4) {
          const sx = brazierX + (isReducedMotion ? 0 : Math.sin(animTime * 2.0 + sy * 0.2) * 5);
          if (sy === 0) ctx.moveTo(sx, brazierY - 16);
          else ctx.lineTo(sx, brazierY - 16 - sy);
        }
        ctx.stroke();

        // Right: Discarded Vanguard Lion Shield leaning against masonry
        const shieldX = cx + 80;
        const shieldY = y + h - 22;

        ctx.save();
        ctx.translate(shieldX, shieldY);
        ctx.rotate(0.2);

        // Circular iron shield body
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(0, -18, 18, 0, Math.PI * 2);
        ctx.fill();

        // Brass rim
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Golden Lion emblem in center
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.arc(0, -18, 7, 0, Math.PI * 2);
        ctx.fill();

        // Jagged battle crack running across the shield
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-14, -28);
        ctx.lineTo(-2, -18);
        ctx.lineTo(8, -8);
        ctx.stroke();
        ctx.restore();

        // Broken Vanguard Spear lying in dust
        const spearX = cx - 10;
        const spearY = y + h - 16;
        ctx.strokeStyle = '#78350f'; // Ash wood haft
        ctx.lineWidth = 2.2;
        // Shaft piece 1
        ctx.beginPath();
        ctx.moveTo(spearX - 45, spearY - 4);
        ctx.lineTo(spearX - 10, spearY - 2);
        ctx.stroke();
        // Broken split
        ctx.fillStyle = '#451a03';
        ctx.fillRect(spearX - 12, spearY - 3, 3, 3);
        // Shaft piece 2 with iron spearhead
        ctx.beginPath();
        ctx.moveTo(spearX - 6, spearY);
        ctx.lineTo(spearX + 35, spearY + 4);
        ctx.stroke();
        // Spearhead
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(spearX + 35, spearY + 4);
        ctx.lineTo(spearX + 46, spearY + 5);
        ctx.lineTo(spearX + 37, spearY + 1);
        ctx.closePath();
        ctx.fill();

        // Discarded dispatch parchment scroll on flags
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(cx + 15, y + h - 14, 14, 7);
        ctx.fillStyle = '#b91c1c'; // Broken seal fragment
        ctx.fillRect(cx + 20, y + h - 12, 3, 3);
        break;
      }

      // ───────────────────────────────────────────────────────────
      // FLOOR 3 — THE TRIAL OF IRON (BOSS: GORGAROTH)
      // Authoritative Gorgaroth production renderer, volcanic forge, lava
      // ───────────────────────────────────────────────────────────
      case 3: {
        // Deep subterranean volcanic forge
        ctx.fillStyle = '#140604';
        ctx.fillRect(x, y, w, h);

        // Radiant Molten Lava Rivers at bottom
        const lavaPulse = isReducedMotion ? 0.9 : (Math.sin(animTime * 3.5) * 0.15 + 0.85);
        const lavaGrad = ctx.createLinearGradient(x, y + h - 26, x, y + h);
        lavaGrad.addColorStop(0, `rgba(234, 88, 12, ${0.9 * lavaPulse})`);
        lavaGrad.addColorStop(0.5, `rgba(249, 115, 22, ${1.0 * lavaPulse})`);
        lavaGrad.addColorStop(1, '#7c2d12');
        ctx.fillStyle = lavaGrad;
        ctx.fillRect(x, y + h - 22, w, 22);

        // Slag rock crust floating in lava
        ctx.fillStyle = '#262626';
        ctx.fillRect(x + 20, y + h - 16, 40, 7);
        ctx.fillRect(x + 90, y + h - 18, 55, 8);
        ctx.fillRect(cx + 60, y + h - 16, 60, 7);
        ctx.fillRect(cx + 140, y + h - 19, 50, 9);

        // Basalt pillars in background
        ctx.fillStyle = '#1c1917';
        ctx.strokeStyle = '#292524';
        ctx.lineWidth = 1;
        ctx.fillRect(x + 15, y, 22, h - 22);
        ctx.strokeRect(x + 15, y, 22, h - 22);
        ctx.fillRect(x + w - 37, y, 22, h - 22);
        ctx.strokeRect(x + w - 37, y, 22, h - 22);

        // Colossal Spiked Iron Chains hanging from ceiling
        ctx.fillStyle = '#3f3f46';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 1;
        const chainCols = [x + 55, x + 115, cx + 115, cx + 165];
        chainCols.forEach((chX, idx) => {
          const sway = isReducedMotion ? 0 : Math.sin(animTime * 1.8 + idx * 1.5) * 3;
          for (let cyLink = y; cyLink < y + h - 35; cyLink += 10) {
            ctx.strokeRect(chX + sway - 3, cyLink, 6, 8);
            ctx.fillRect(chX + sway - 2, cyLink + 1, 4, 6);
          }
        });

        // Left: Gorgaroth's Colossal Cracked Anvil Pillar
        const anvilW = 60, anvilH = 46;
        const anvilX = cx - 95;
        const anvilY = y + h - 22 - anvilH;

        // Anvil base & waist
        ctx.fillStyle = '#27272a';
        ctx.strokeStyle = '#52525b';
        ctx.lineWidth = 1.2;
        roundRect(ctx, anvilX + 6, anvilY + 18, anvilW - 12, anvilH - 18, 3);
        ctx.fill(); ctx.stroke();

        // Anvil horn & face plate
        ctx.fillStyle = '#3f3f46';
        ctx.fillRect(anvilX - 4, anvilY, anvilW + 8, 18);
        ctx.strokeRect(anvilX - 4, anvilY, anvilW + 8, 18);

        // Glowing red-hot fractures down anvil center
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.9 * lavaPulse})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(anvilX + anvilW / 2 - 3, anvilY + 2);
        ctx.lineTo(anvilX + anvilW / 2 + 2, anvilY + 14);
        ctx.lineTo(anvilX + anvilW / 2 - 4, anvilY + 28);
        ctx.lineTo(anvilX + anvilW / 2 + 3, anvilY + 44);
        ctx.stroke();

        // Authoritative Production Boss Renderer: Gorgaroth standing in the volcanic forge!
        ctx.save();
        ctx.translate(cx + 40, y + h - 20);
        ctx.scale(0.66, 0.66);
        const gorgBoss = {
          id: 'gorgaroth',
          phase: 1,
          defeatState: null,
          introRevealStage: null,
          weaponDropped: false,
          ph: animTime
        };
        CharacterRenderer.drawGorgaroth(ctx, gorgBoss, false, pulse);
        ctx.restore();

        // Rising volcanic sparks and burning embers
        if (!isReducedMotion) {
          ctx.fillStyle = '#fbbf24';
          for (let i = 0; i < 9; i++) {
            const ex = cx - 120 + ((i * 37 + animTime * 35) % 240);
            const ey = y + h - 25 - ((i * 17 + animTime * 45) % (h - 30));
            ctx.fillRect(ex, ey, 2, 2);
          }
        }
        break;
      }

      // ───────────────────────────────────────────────────────────
      // FLOOR 4 — THE DEEPER MEASURE
      // Clockwork dungeon, rotating gears, floor spike grid, ledger stela
      // ───────────────────────────────────────────────────────────
      case 4: {
        // Geometric stone limestone chamber
        ctx.fillStyle = '#0c0f16';
        ctx.fillRect(x, y, w, h);

        // Massive Interlocking Bronze Clockwork Gears in Background
        const drawGear = (gx, gy, radius, teeth, rot) => {
          ctx.save();
          ctx.translate(gx, gy);
          ctx.rotate(rot);
          ctx.fillStyle = '#78350f';
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();

          // Teeth
          ctx.fillStyle = '#b45309';
          for (let t = 0; t < teeth; t++) {
            const angle = (t / teeth) * Math.PI * 2;
            const tx = Math.cos(angle) * radius;
            const ty = Math.sin(angle) * radius;
            ctx.save();
            ctx.translate(tx, ty);
            ctx.rotate(angle);
            ctx.fillRect(-3, -3, 6, 6);
            ctx.restore();
          }

          // Gear core hole
          ctx.fillStyle = '#0c0f16';
          ctx.beginPath();
          ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
          ctx.restore();
        };

        const gearRot = isReducedMotion ? 0 : animTime;
        drawGear(cx - 100, y + 42, 34, 12, gearRot * 0.3);
        drawGear(cx - 45, y + 26, 24, 8, -gearRot * 0.42);

        // Flagstone floor
        ctx.fillStyle = '#111827';
        ctx.fillRect(x, y + h - 24, w, 24);

        // Retractable Floor Spike Grid (Limestone tiles with steel spikes)
        const spikeCols = [cx - 130, cx - 95, cx - 60, cx - 25, cx + 10, cx + 45];
        spikeCols.forEach((spX, idx) => {
          // Floor hole
          ctx.fillStyle = '#030712';
          ctx.fillRect(spX - 5, y + h - 24, 10, 4);

          // Alternating spike extension
          const ext = isReducedMotion ? 10 : Math.max(0, Math.sin(animTime * 2.8 + idx * 1.1)) * 18;
          if (ext > 2) {
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath();
            ctx.moveTo(spX - 3.5, y + h - 22);
            ctx.lineTo(spX, y + h - 22 - ext);
            ctx.lineTo(spX + 3.5, y + h - 22);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        });

        // Right side: The Ancient Ledger Stela (Chiseled measuring stone)
        const stelaX = cx + 85;
        const stelaY = y + 14;
        const stelaW = 55, stelaH = h - 38;

        ctx.fillStyle = '#1f2937';
        ctx.strokeStyle = '#4b5563';
        ctx.lineWidth = 1.2;
        roundRect(ctx, stelaX, stelaY, stelaW, stelaH, 3);
        ctx.fill(); ctx.stroke();

        // Chiseled tally marks and measuring glyphs on stela
        ctx.fillStyle = 'rgba(6, 182, 212, 0.85)'; // Glowing cyan measure lines
        for (let row = 0; row < 5; row++) {
          const ryLine = stelaY + 12 + row * 14;
          for (let m = 0; m < 4; m++) {
            ctx.fillRect(stelaX + 8 + m * 8, ryLine, 2, 7);
          }
          ctx.beginPath();
          ctx.moveTo(stelaX + 6, ryLine + 7);
          ctx.lineTo(stelaX + 38, ryLine);
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.85)';
          ctx.stroke();
        }

        // Shifting corridor seam in background
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx + 60, y + 6); ctx.lineTo(cx + 60, y + h - 24);
        ctx.stroke();
        break;
      }

      // ───────────────────────────────────────────────────────────
      // FLOOR 5 — THE WEIGHT OF THE DARK
      // Shadow miasma, dying blue torch flame, watchful red void eyes
      // ───────────────────────────────────────────────────────────
      case 5: {
        // Deep lightless pitch-black stratum
        ctx.fillStyle = '#020307';
        ctx.fillRect(x, y, w, h);

        // Undulating Shadow Miasma Tendrils along the bottom
        ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
        ctx.beginPath();
        ctx.moveTo(x, y + h);
        for (let mx = 0; mx <= w; mx += 15) {
          const my = y + h - 22 + (isReducedMotion ? 0 : Math.sin(animTime * 2.0 + mx * 0.05) * 8 + Math.cos(animTime * 1.4 + mx * 0.03) * 6);
          ctx.lineTo(x + mx, my);
        }
        ctx.lineTo(x + w, y + h);
        ctx.closePath();
        ctx.fill();

        // Dying Wall Torch in Iron Sconce (Left-Center)
        const torchX = cx - 80;
        const torchY = y + 48;

        // Iron bracket
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(torchX - 3, torchY, 6, 22);
        ctx.fillRect(torchX - 10, torchY + 6, 14, 3);

        // Sputtering, struggling eerie cold-blue flame
        const sputter = isReducedMotion ? 0.75 : (Math.sin(animTime * 8.0) * Math.cos(animTime * 3.5) * 0.35 + 0.65);
        const torchHalo = ctx.createRadialGradient(torchX, torchY - 8, 2, torchX, torchY - 8, 48 * sputter);
        torchHalo.addColorStop(0, `rgba(56, 189, 248, ${0.85 * sputter})`);
        torchHalo.addColorStop(0.5, `rgba(3, 105, 161, ${0.35 * sputter})`);
        torchHalo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = torchHalo;
        ctx.fillRect(torchX - 55, torchY - 55, 110, 110);

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(torchX, torchY - 6, 4 * sputter, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f0f9ff';
        ctx.fillRect(torchX - 1.5, torchY - 9, 3, 5);

        // The Unblinking Void Eyes watching from ceiling darkness
        const eyeLocations = [
          { ex: cx - 20, ey: y + 26, scale: 1.0, ph: 0 },
          { ex: cx + 45, ey: y + 36, scale: 0.8, ph: 1.8 },
          { ex: cx + 110, ey: y + 22, scale: 1.15, ph: 3.2 }
        ];

        eyeLocations.forEach(eye => {
          const blink = isReducedMotion ? 1.0 : Math.sin(animTime * 1.5 + eye.ph);
          const openH = Math.max(1, Math.abs(blink) * 7 * eye.scale);

          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.ellipse(eye.ex, eye.ey, 11 * eye.scale, openH, 0, 0, Math.PI * 2);
          ctx.fill();

          // Black slit pupil
          ctx.fillStyle = '#000000';
          ctx.fillRect(eye.ex - 1.2, eye.ey - openH * 0.85, 2.4, openH * 1.7);

          // Eerie eye glow
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
          ctx.lineWidth = 1;
          ctx.stroke();
        });

        // Lone lost vanguard soldier huddled against masonry
        const solX = cx + 80;
        const solY = y + h - 16;
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(solX, solY - 14, 7, 0, Math.PI * 2); // Head
        ctx.fill();
        ctx.fillRect(solX - 8, solY - 8, 16, 16); // Body huddled
        // Crossed hands over ears in agony
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(solX - 7, solY - 8); ctx.lineTo(solX - 2, solY - 14);
        ctx.moveTo(solX + 7, solY - 8); ctx.lineTo(solX + 2, solY - 14);
        ctx.stroke();
        break;
      }

      // ───────────────────────────────────────────────────────────
      // FLOOR 6 — THE VOID'S QUESTION (BOSS: MALAKOR)
      // Authoritative Malakor production renderer, spatial rift, starfield
      // ───────────────────────────────────────────────────────────
      case 6: {
        // Fractured deep void space
        ctx.fillStyle = '#030108';
        ctx.fillRect(x, y, w, h);

        // Distant Star Field visible through geometry
        ctx.fillStyle = '#e9d5ff';
        for (let s = 0; s < 18; s++) {
          const sx = x + ((s * 29 + (isReducedMotion ? 0 : animTime * 1.5)) % w);
          const sy = y + ((s * 19) % (h - 20));
          const sz = (s % 3 === 0) ? 1.5 : 1;
          ctx.fillRect(sx, sy, sz, sz);
        }

        // Center: Dimensional Spatial Fracture Rift (Jagged reality tear)
        const riftPulse = isReducedMotion ? 0.85 : (Math.sin(animTime * 3.2) * 0.2 + 0.8);
        const riftGrad = ctx.createLinearGradient(cx - 30, y, cx + 30, y);
        riftGrad.addColorStop(0, 'rgba(124, 58, 237, 0)');
        riftGrad.addColorStop(0.5, `rgba(192, 38, 211, ${0.85 * riftPulse})`);
        riftGrad.addColorStop(1, 'rgba(124, 58, 237, 0)');
        ctx.fillStyle = riftGrad;
        ctx.fillRect(cx - 35, y + 6, 70, h - 12);

        // Jagged reality fracture line
        ctx.strokeStyle = '#f0abfc';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(cx, y + 6);
        ctx.lineTo(cx - 8, y + 26);
        ctx.lineTo(cx + 10, y + 48);
        ctx.lineTo(cx - 12, y + 74);
        ctx.lineTo(cx + 6, y + 102);
        ctx.lineTo(cx, y + h - 8);
        ctx.stroke();

        // Inner cosmic white core
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Authoritative Production Boss Renderer: Malakor hovering in the rift!
        ctx.save();
        ctx.translate(cx, y + h * 0.46);
        ctx.scale(0.70, 0.70);
        const malakorBoss = {
          id: 'malakor',
          phase: 1,
          vulnTimer: 0,
          isChargingVolley: false,
          ph: animTime * 4
        };
        CharacterRenderer.drawMalakor(ctx, malakorBoss, false, pulse);
        ctx.restore();

        // Floating shattered obsidian shards hovering in zero-g
        const shards = [
          { sx: cx - 85, sy: y + 42, sw: 18, sh: 12, rot: 0.4 },
          { sx: cx - 50, sy: y + 96, sw: 14, sh: 22, rot: -0.6 },
          { sx: cx + 60, sy: y + 36, sw: 20, sh: 14, rot: 0.8 },
          { sx: cx + 95, sy: y + 84, sw: 16, sh: 16, rot: -0.3 }
        ];

        shards.forEach((sh, idx) => {
          const bob = isReducedMotion ? 0 : Math.sin(animTime * 2.0 + idx * 1.3) * 5;
          ctx.save();
          ctx.translate(sh.sx, sh.sy + bob);
          ctx.rotate(sh.rot + (isReducedMotion ? 0 : animTime * 0.15 * (idx % 2 === 0 ? 1 : -1)));

          ctx.fillStyle = '#180d2b';
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-sh.sw / 2, 0);
          ctx.lineTo(0, -sh.sh / 2);
          ctx.lineTo(sh.sw / 2, 0);
          ctx.lineTo(0, sh.sh / 2);
          ctx.closePath();
          ctx.fill(); ctx.stroke();
          ctx.restore();
        });

        // Electric purple arc discharges between shards
        if (!isReducedMotion) {
          ctx.strokeStyle = 'rgba(216, 180, 254, 0.75)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx - 85, y + 42);
          ctx.lineTo(cx - 40, y + 54);
          ctx.lineTo(cx - 20, y + 48);
          ctx.moveTo(cx + 20, y + 48);
          ctx.lineTo(cx + 60, y + 36);
          ctx.stroke();
        }
        break;
      }

      // ───────────────────────────────────────────────────────────
      // FLOOR 7 — ECHOES OF PURPOSE
      // Sacred temple crucible, golden celestial beam, consecrated weapons
      // ───────────────────────────────────────────────────────────
      case 7: {
        // Pristine symmetrical sacred sanctuary
        ctx.fillStyle = '#060a14';
        ctx.fillRect(x, y, w, h);

        // Symmetrical Classical Stone Pillars flanking the altar
        const drawColumn = (colX) => {
          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1;
          ctx.fillRect(colX - 8, y + 8, 16, h - 28);
          ctx.strokeRect(colX - 8, y + 8, 16, h - 28);
          // Capital & Base
          ctx.fillRect(colX - 12, y + 8, 24, 6);
          ctx.fillRect(colX - 12, y + h - 26, 24, 6);
        };
        drawColumn(cx - 120);
        drawColumn(cx + 120);

        // Radiant Celestial Light Beam cascading down onto central plinth
        const beamPulse = isReducedMotion ? 0.9 : (Math.sin(animTime * 2.0) * 0.1 + 0.9);
        const beamGrad = ctx.createLinearGradient(cx, y, cx, y + h - 20);
        beamGrad.addColorStop(0, `rgba(254, 240, 138, ${0.45 * beamPulse})`);
        beamGrad.addColorStop(0.7, `rgba(217, 119, 6, ${0.25 * beamPulse})`);
        beamGrad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(cx - 24, y);
        ctx.lineTo(cx + 24, y);
        ctx.lineTo(cx + 65, y + h - 20);
        ctx.lineTo(cx - 65, y + h - 20);
        ctx.closePath();
        ctx.fill();

        // Altar Plinth
        const plinthW = 88, plinthH = 26;
        const plinthX = cx - plinthW / 2;
        const plinthY = y + h - 20 - plinthH;

        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.4;
        roundRect(ctx, plinthX, plinthY, plinthW, plinthH, 4);
        ctx.fill(); ctx.stroke();

        // Imperial Crimson Velvet Cloth draped on plinth
        ctx.fillStyle = '#991b1b';
        roundRect(ctx, plinthX + 6, plinthY + 2, plinthW - 12, 6, 2);
        ctx.fill();

        // Consecrated Broadsword resting on plinth
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(cx - 30, plinthY - 3, 45, 3.5);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(cx + 15, plinthY - 5, 4, 7);
        ctx.fillRect(cx + 19, plinthY - 3, 8, 3);

        // Consecrated Longbow resting beside sword
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx - 6, plinthY - 1, 24, Math.PI * 0.8, Math.PI * 1.35, false);
        ctx.stroke();

        // Sacred Mathematical Geometry Lines on floor flags
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, y + h - 16, 42, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeRect(cx - 30, y + h - 18, 60, 4);

        // Rising golden light motes
        if (!isReducedMotion) {
          ctx.fillStyle = '#fef08a';
          for (let i = 0; i < 7; i++) {
            const px = cx - 35 + ((i * 22 + animTime * 20) % 70);
            const py = plinthY - 5 - ((i * 14 + animTime * 25) % 55);
            ctx.fillRect(px, py, 1.5, 1.5);
          }
        }
        break;
      }

      // ───────────────────────────────────────────────────────────
      // FLOOR 8 — BEFORE THE BLADE
      // Ancient armorer's blood forge, primordial ichor basin, runic veins
      // ───────────────────────────────────────────────────────────
      case 8: {
        // Deep obsidian blood forge
        ctx.fillStyle = '#100305';
        ctx.fillRect(x, y, w, h);

        // Left: Primordial Ichor Quenching Basin
        const basinX = cx - 90;
        const basinY = y + h - 22;
        const basinW = 54, basinH = 34;

        ctx.fillStyle = '#1f1315';
        ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = 1.2;
        roundRect(ctx, basinX - basinW / 2, basinY - basinH, basinW, basinH, 4);
        ctx.fill(); ctx.stroke();

        // Glowing Primordial Crimson Ichor fluid in basin
        const ichorPulse = isReducedMotion ? 0.9 : (Math.sin(animTime * 3.0) * 0.15 + 0.85);
        const ichorGrad = ctx.createLinearGradient(basinX - 22, basinY - basinH + 6, basinX + 22, basinY - 6);
        ichorGrad.addColorStop(0, `rgba(239, 68, 68, ${0.95 * ichorPulse})`);
        ichorGrad.addColorStop(1, '#991b1b');
        ctx.fillStyle = ichorGrad;
        roundRect(ctx, basinX - basinW / 2 + 4, basinY - basinH + 4, basinW - 8, 12, 2);
        ctx.fill();

        // Center: Heavy Basalt Armorer's Anvil
        const anvilX = cx + 30;
        const anvilY = y + h - 22;
        ctx.fillStyle = '#262626';
        ctx.fillRect(anvilX - 24, anvilY - 26, 48, 26);
        ctx.strokeStyle = '#525252';
        ctx.strokeRect(anvilX - 24, anvilY - 26, 48, 26);

        // Broadsword Blade on the Anvil glowing cherry red
        const bladeGrad = ctx.createLinearGradient(anvilX - 18, anvilY - 28, anvilX + 20, anvilY - 28);
        bladeGrad.addColorStop(0, '#f87171');
        bladeGrad.addColorStop(0.5, '#fb923c');
        bladeGrad.addColorStop(1, '#fca5a5');
        ctx.fillStyle = bladeGrad;
        ctx.fillRect(anvilX - 18, anvilY - 29, 36, 4);

        // Chiseled Blood-Vein Canals connecting Basin to Anvil
        ctx.strokeStyle = `rgba(220, 38, 38, ${0.85 * ichorPulse})`;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(basinX + basinW / 2, basinY - 14);
        ctx.lineTo(anvilX - 30, basinY - 14);
        ctx.lineTo(anvilX - 24, anvilY - 20);
        ctx.stroke();

        // Wisps of red steam rising from the quenching basin
        ctx.strokeStyle = 'rgba(248, 113, 113, 0.45)';
        ctx.lineWidth = 1.2;
        for (let st = 0; st < 3; st++) {
          ctx.beginPath();
          const startSx = basinX - 12 + st * 12;
          for (let sy = 0; sy < 32; sy += 4) {
            const sx = startSx + (isReducedMotion ? 0 : Math.sin(animTime * 2.5 + sy * 0.2 + st) * 4);
            if (sy === 0) ctx.moveTo(sx, basinY - basinH + 4);
            else ctx.lineTo(sx, basinY - basinH + 4 - sy);
          }
          ctx.stroke();
        }

        // Flying sparks from anvil forging
        if (!isReducedMotion) {
          ctx.fillStyle = '#fde047';
          for (let sp = 0; sp < 6; sp++) {
            const px = anvilX - 10 + Math.sin(animTime * 4.0 + sp * 2) * 20;
            const py = anvilY - 32 - Math.abs(Math.cos(animTime * 3.5 + sp)) * 22;
            ctx.fillRect(px, py, 1.5, 1.5);
          }
        }
        break;
      }

      // ───────────────────────────────────────────────────────────
      // FLOOR 9 — THE LAST MEASURE
      // Threshold archway, giant burning Absolute Eye, Rowan at precipice
      // ───────────────────────────────────────────────────────────
      case 9: {
        // Crimson-tinged abyssal chasm
        ctx.fillStyle = '#060207';
        ctx.fillRect(x, y, w, h);

        // Glowing red abyssal mist from chasm gulf below
        const chasmGrad = ctx.createLinearGradient(x, y + h - 25, x, y + h);
        chasmGrad.addColorStop(0, 'rgba(185, 28, 28, 0.15)');
        chasmGrad.addColorStop(1, 'rgba(220, 38, 38, 0.65)');
        ctx.fillStyle = chasmGrad;
        ctx.fillRect(x, y + h - 25, w, 25);

        // Giant Burning Absolute Eye in the ceiling of the abyss
        const eyePulse = isReducedMotion ? 0.95 : (Math.sin(animTime * 2.0) * 0.1 + 0.9);
        const eyeX = cx, eyeY = y + 36;

        // Ocular burning aura
        const eyeAura = ctx.createRadialGradient(eyeX, eyeY, 6, eyeX, eyeY, 52);
        eyeAura.addColorStop(0, `rgba(220, 38, 38, ${0.85 * eyePulse})`);
        eyeAura.addColorStop(0.5, `rgba(153, 27, 27, ${0.45 * eyePulse})`);
        eyeAura.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = eyeAura;
        ctx.fillRect(eyeX - 55, eyeY - 55, 110, 110);

        // Sclera
        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.ellipse(eyeX, eyeY, 28 * eyePulse, 16 * eyePulse, 0, 0, Math.PI * 2);
        ctx.fill();

        // Burning Iris
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, 11 * eyePulse, 0, Math.PI * 2);
        ctx.fill();

        // Black vertical slit pupil
        ctx.fillStyle = '#000000';
        ctx.fillRect(eyeX - 2.5, eyeY - 14 * eyePulse, 5, 28 * eyePulse);

        // Cyclopean Archway framing the precipice
        ctx.fillStyle = '#110c14';
        ctx.strokeStyle = '#27172b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 20, y);
        ctx.lineTo(x + 50, y);
        ctx.lineTo(x + 50, y + h - 20);
        ctx.lineTo(x + 20, y + h - 20);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + w - 20, y);
        ctx.lineTo(x + w - 50, y);
        ctx.lineTo(x + w - 50, y + h - 20);
        ctx.lineTo(x + w - 20, y + h - 20);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Stone bridge ending abruptly at the chasm edge
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(x + 40, y + h - 20, cx - 10 - (x + 40), 20);
        ctx.strokeStyle = '#44403c';
        ctx.strokeRect(x + 40, y + h - 20, cx - 10 - (x + 40), 20);

        // Lone Silhouette of Rowan standing at the cliff edge facing the abyss
        const rowanX = cx - 22;
        const rowanY = y + h - 20;

        ctx.fillStyle = '#000000';
        // Legs & Torso
        ctx.fillRect(rowanX - 3, rowanY - 18, 6, 18);
        // Head with hooded mantle
        ctx.beginPath();
        ctx.arc(rowanX, rowanY - 22, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Billowing Red Cloak in updraft wind
        const windSway = isReducedMotion ? 0 : Math.sin(animTime * 4.5) * 6;
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath();
        ctx.moveTo(rowanX - 2, rowanY - 20);
        ctx.lineTo(rowanX - 16 + windSway, rowanY - 14);
        ctx.lineTo(rowanX - 14 + windSway, rowanY - 4);
        ctx.lineTo(rowanX, rowanY - 8);
        ctx.closePath();
        ctx.fill();

        // Drawn sword pointing toward the chasm
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(rowanX + 2, rowanY - 14);
        ctx.lineTo(rowanX + 16, rowanY - 10);
        ctx.stroke();
        break;
      }

      // ───────────────────────────────────────────────────────────
      // FLOOR 10 — THE WARDEN'S LAST TRIAL (BOSS: ABYSS WARDEN)
      // Masterwork Redesign: Sunken Citadel Throne Chamber & Singularity Halo
      // Symmetrical gothic cathedral spires, obsidian throne dais, central Warden
      // ───────────────────────────────────────────────────────────
      case 10: {
        // 1. Vaulted Abyssal Cathedral Hall Backdrop
        ctx.fillStyle = '#06030e';
        ctx.fillRect(x, y, w, h);

        // Gothic arched pillars in deep violet shadow
        ctx.fillStyle = '#0d071c';
        const pillarW = 24;
        ctx.fillRect(x + 16, y, pillarW, h - 22);
        ctx.fillRect(x + w - 16 - pillarW, y, pillarW, h - 22);

        // Transverse ribbed vault arches meeting in the upper hall
        ctx.strokeStyle = '#1e113a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 16 + pillarW, y + 40);
        ctx.quadraticCurveTo(cx, y + 8, x + w - 16 - pillarW, y + 40);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + 16 + pillarW, y + 70);
        ctx.quadraticCurveTo(cx, y + 25, x + w - 16 - pillarW, y + 70);
        ctx.stroke();

        // 2. Majestic Central Singularity Halo (Behind the Throne Dais)
        const singX = cx, singY = y + 54;
        const singRadius = 46;

        ctx.save();
        // Concentric gravitational accretion glow
        const singGrad = ctx.createRadialGradient(singX, singY, 8, singX, singY, singRadius);
        singGrad.addColorStop(0, '#020108');
        singGrad.addColorStop(0.35, '#4c1d95');
        singGrad.addColorStop(0.65, '#7c3aed');
        singGrad.addColorStop(0.85, 'rgba(217, 119, 6, 0.45)');
        singGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = singGrad;
        ctx.beginPath();
        ctx.arc(singX, singY, singRadius, 0, Math.PI * 2);
        ctx.fill();

        // Stable coronal light ring
        ctx.strokeStyle = 'rgba(253, 230, 138, 0.65)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(singX, singY, 26, 0, Math.PI * 2);
        ctx.stroke();

        // Singularity core (pitch black event horizon)
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(singX, singY, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 3. Flanking Cathedral Braziers with Violet Soul Fire
        const bY = y + h - 42;
        const drawBrazier = (bx) => {
          ctx.save();
          // Stand
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(bx - 3, bY, 6, 20);
          // Bowl
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(bx, bY, 9, 0, Math.PI);
          ctx.fill(); ctx.stroke();
          // Violet soul flame
          const flameFlicker = isReducedMotion ? 0 : Math.sin(animTime * 5.0 + bx) * 2;
          ctx.fillStyle = '#c084fc';
          ctx.beginPath();
          ctx.moveTo(bx - 6, bY);
          ctx.quadraticCurveTo(bx, bY - 14 + flameFlicker, bx + 6, bY);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(bx, bY - 4, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        };
        drawBrazier(cx - 105);
        drawBrazier(cx + 105);

        // 4. Stepped Dais and Royal Abyss Carpet
        const daisBaseY = y + h - 22;
        // Base floor
        ctx.fillStyle = '#0f1422';
        ctx.fillRect(x + 20, daisBaseY, w - 40, 22);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 20, daisBaseY, w - 40, 22);

        // Stepped dais (3 tiers ascending)
        ctx.fillStyle = '#1e1b4b';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1;
        // Tier 1
        ctx.fillRect(cx - 80, daisBaseY - 6, 160, 6);
        ctx.strokeRect(cx - 80, daisBaseY - 6, 160, 6);
        // Tier 2
        ctx.fillRect(cx - 62, daisBaseY - 12, 124, 6);
        ctx.strokeRect(cx - 62, daisBaseY - 12, 124, 6);
        // Tier 3
        ctx.fillRect(cx - 45, daisBaseY - 18, 90, 6);
        ctx.strokeRect(cx - 45, daisBaseY - 18, 90, 6);

        // Crimson & gold-bordered runner carpet down the dais
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(cx - 14, daisBaseY - 18, 28, 40);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(cx - 14, daisBaseY - 18, 28, 40);

        // 5. Imposing High-Backed Obsidian Throne (Behind Warden)
        const throneW = 48, throneH = 58;
        const throneX = cx - throneW / 2;
        const throneY = daisBaseY - 18 - throneH;

        ctx.fillStyle = '#080d1a';
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 1.2;
        roundRect(ctx, throneX, throneY, throneW, throneH, 4);
        ctx.fill(); ctx.stroke();

        // Throne carved spires & crown crest
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.moveTo(throneX + 4, throneY);
        ctx.lineTo(throneX + 12, throneY - 10);
        ctx.lineTo(cx, throneY - 3);
        ctx.lineTo(throneX + throneW - 12, throneY - 10);
        ctx.lineTo(throneX + throneW - 4, throneY);
        ctx.closePath();
        ctx.fill();

        // Inlaid throne void eye rune
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(cx, throneY + 16, 3, 0, Math.PI * 2);
        ctx.fill();

        // 6. Centered Authoritative Production Boss Renderer: The Abyss Warden!
        // Symmetrical, commanding focal hierarchy, perfectly scaled
        ctx.save();
        ctx.translate(cx, daisBaseY - 14);
        ctx.scale(0.70, 0.70);
        const wardenBoss = {
          id: 'abyss_warden',
          phase: 1,
          defeatState: null,
          introRevealStage: null,
          weaponDropped: false,
          crackedArmor: false,
          eyeGlow: 1.0,
          ph: isReducedMotion ? 0 : animTime * 3
        };
        CharacterRenderer.drawWarden(ctx, wardenBoss, false, pulse);
        ctx.restore();

        // 7. Subtle Ambient Soul Particles (Respects Reduced Motion)
        if (!isReducedMotion) {
          ctx.fillStyle = '#a5f3fc';
          for (let sm = 0; sm < 6; sm++) {
            const px = singX - 35 + ((sm * 23 + animTime * 14) % 70);
            const py = y + h - 30 - ((sm * 15 + animTime * 20) % 55);
            ctx.fillRect(px, py, 1.2, 1.2);
          }
        }
        break;
      }
    }

    // ─────────────────────────────────────────────────────────────
    // Atmospheric Overlay & Watermark Badge
    // ─────────────────────────────────────────────────────────────
    // Top-left Stratum Badge
    ctx.fillStyle = 'rgba(6, 9, 20, 0.75)';
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.45)';
    ctx.lineWidth = 1;
    roundRect(ctx, x + 8, y + 8, 126, 17, 3);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 8px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`STRATUM ${floorNum} · CANON SCENE`, x + 71, y + 16.5);

    // Subtle edge scanlines & glass sheen bevel
    const glassSheen = ctx.createLinearGradient(x, y, x + w, y + h);
    glassSheen.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    glassSheen.addColorStop(0.3, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glassSheen;
    ctx.fillRect(x, y, w, h);

    ctx.restore();
  }
};

