// =====================================================================
//  DUNGEON BREAK — js/rendering/BestiaryPortraitRenderer.js
//  Authentic In-Game Pixel-Art Portrait & Memory Scene Canvas 2D Renderer
//  Strict Policy: 100% In-Game Renderers, Zero Emojis, Zero Placeholders
// =====================================================================

import { CharacterRenderer } from './CharacterRenderer.js';
import { roundRect } from '../core/Constants.js';
import { drawPixelEye } from '../cinematics/ShatteredMindCinematic.js';

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
  }
};
