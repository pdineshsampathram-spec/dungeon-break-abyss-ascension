// =====================================================================
//  DUNGEON BREAK — js/cinematics/CinematicCharacterRenderer.js
//  High-Fidelity Layered 2D Dark-Fantasy Character Anatomy & Acting System
//  Original Character Designs — Zero Zoomed Gameplay Pixels / Zero Primitives
// =====================================================================

import { GameState } from '../core/GameState.js';

export const CinematicCharacterRenderer = {
  // ─────────────────────────────────────────────────────────────────
  // 1. LORD ROWAN — HIGH RESOLUTION LAYERED ANATOMY
  // ─────────────────────────────────────────────────────────────────
  drawRowan(ctx, x, y, scale = 1.0, pose = 'idle', options = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const t = options.time || 0;
    const breath = Math.sin(t * 3.0) * (pose === 'exhausted' ? 3.5 : 2.0);
    const wind = Math.sin(t * 2.5 + (options.phase || 0)) * 5.0;

    // A. PRONE COLLAPSED POSE (Special anatomical silhouette)
    if (pose === 'prone_collapsed' || pose === 'fallen') {
      this._drawRowanProne(ctx, t, options);
      ctx.restore();
      return;
    }

    // B. DYNAMIC FLOWING MANTLE / CLOAK (Back layer)
    ctx.save();
    const cloakGrad = ctx.createLinearGradient(0, -35, 0, 55);
    cloakGrad.addColorStop(0, '#991b1b');
    cloakGrad.addColorStop(0.4, '#4c0519');
    cloakGrad.addColorStop(1, '#1e030a');
    ctx.fillStyle = cloakGrad;

    const cloakSpread = (pose === 'stagger' ? 14 : (pose === 'knee' ? -6 : 0));
    ctx.beginPath();
    ctx.moveTo(-16, -26 + breath * 0.4);
    ctx.bezierCurveTo(-32 + wind, 0, -36 + wind * 1.6 + cloakSpread, 35, -28 + wind * 2, 54);
    ctx.lineTo(24 + wind * 1.3, 54);
    ctx.bezierCurveTo(32 + wind, 24, 26, 0, 16, -26 + breath * 0.4);
    ctx.closePath();
    ctx.fill();

    // Cloak inner shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.moveTo(-12, -24);
    ctx.bezierCurveTo(-20, 10, -22, 35, -18, 52);
    ctx.lineTo(-4, 52);
    ctx.lineTo(-2, -24);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // C. LOWER BODY: GREAVES, SABATONS & FAULDS
    if (pose === 'knee' || pose === 'kneeling_head_clutch') {
      this._drawRowanKneelingLegs(ctx, options);
    } else if (pose === 'stagger') {
      this._drawRowanLeg(ctx, -16, 8, true);
      this._drawRowanLeg(ctx, 4, 12, false);
    } else {
      // Standing / Walk bob
      const legBob = (pose === 'walk' ? Math.sin(t * 5.0) * 4 : 0);
      this._drawRowanLeg(ctx, -10, 8 + legBob, false);
      this._drawRowanLeg(ctx, 6, 8 - legBob, false);
    }

    // D. TORSO, CUIRASS & EMBOSSED CREST
    const torsoY = (pose === 'knee' || pose === 'kneeling_head_clutch') ? 6 : -16 + breath;
    const tilt = (pose === 'stagger') ? -0.18 : (pose === 'exhausted' ? 0.09 : (pose === 'raising_weapon' ? -0.08 : 0));

    ctx.save();
    ctx.translate(0, torsoY);
    ctx.rotate(tilt);

    // Chainmail undergarment skirt (Faulds)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-13, 11, 26, 11);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-13, 11, 26, 11);

    // Leather belt with gold clasp
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-13, 8, 26, 4);
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(-3, 7.5, 6, 5);

    // Sculpted Steel Cuirass (Breastplate with beveled lighting)
    const plateGrad = ctx.createLinearGradient(-15, -18, 15, 12);
    plateGrad.addColorStop(0, '#cbd5e1');
    plateGrad.addColorStop(0.25, '#64748b');
    plateGrad.addColorStop(0.7, '#334155');
    plateGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = plateGrad;

    ctx.beginPath();
    ctx.moveTo(-15, -18);
    ctx.lineTo(15, -18);
    ctx.lineTo(11, 10);
    ctx.lineTo(-11, 10);
    ctx.closePath();
    ctx.fill();

    // Steel plate beveled highlight
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-14, -17);
    ctx.lineTo(0, -17);
    ctx.lineTo(0, 9);
    ctx.stroke();

    // Paladin Radiant Sun Sigil
    ctx.save();
    ctx.strokeStyle = options.sigilColor || '#fde68a';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = options.sigilGlow ? 10 : 3;
    ctx.beginPath();
    ctx.arc(0, -4, 5, 0, 6.28);
    ctx.stroke();
    // Sun rays
    for (let r = 0; r < 4; r++) {
      const ang = (r / 4) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * 6, -4 + Math.sin(ang) * 6);
      ctx.lineTo(Math.cos(ang) * 9, -4 + Math.sin(ang) * 9);
      ctx.stroke();
    }
    ctx.restore();

    // E. 3-TIER CURVED STEEL PAULDRONS (Shoulders)
    this._drawRowanPauldrons(ctx, options);

    // F. HELM & VISOR (Great Knight Sallet)
    this._drawRowanHelm(ctx, options);

    // G. ARMS, GAUNTLETS & WEAPON INTERACTION
    if (pose === 'kneeling_head_clutch') {
      this._drawHeadClutchHands(ctx);
    } else if (pose === 'raising_weapon') {
      this._drawRaisingWeapon(ctx, t, options);
    } else if (pose === 'ready') {
      this._drawCombatReadyHands(ctx, options);
    } else if (pose === 'stagger') {
      this._drawStaggerHands(ctx);
    } else if (pose === 'weapon_dropped' || pose === 'knee') {
      this._drawHandsWithoutWeapon(ctx, pose);
    } else {
      // Idle / exhausted resting weapon on floor
      this._drawRestingWeaponHands(ctx, options);
    }

    ctx.restore(); // Restore torso transform
    ctx.restore(); // Restore root transform
  },

  _drawRowanLeg(ctx, lx, ly, isStagger = false) {
    ctx.save();
    ctx.translate(lx, ly);
    if (isStagger) ctx.rotate(-0.2);

    // Greave (Shin plate)
    const legGrad = ctx.createLinearGradient(0, 0, 10, 0);
    legGrad.addColorStop(0, '#64748b');
    legGrad.addColorStop(0.6, '#334155');
    legGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = legGrad;
    ctx.fillRect(-4, 0, 8, 22);

    // Knee cop (Poleyn)
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, 6.28);
    ctx.fill();

    // Sabaton (Armored boot)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-5, 22);
    ctx.lineTo(7, 22);
    ctx.lineTo(9, 28);
    ctx.lineTo(-6, 28);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  },

  _drawRowanKneelingLegs(ctx, options) {
    // Left leg supporting, right knee planted down on flagstones
    ctx.save();
    // Right knee down
    ctx.fillStyle = '#334155';
    ctx.fillRect(4, 16, 14, 8);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(14, 20, 8, 5); // Sabaton toe touching floor

    // Left leg bent in support
    ctx.fillStyle = '#475569';
    ctx.fillRect(-14, 10, 8, 16);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-16, 23, 11, 5);
    ctx.restore();
  },

  _drawRowanPauldrons(ctx, options) {
    // 3 overlapping curved plate tiers per shoulder
    const drawSide = (dir) => {
      ctx.save();
      ctx.scale(dir, 1);
      for (let i = 0; i < 3; i++) {
        const py = -20 + i * 5;
        const px = 14 + i * 2;
        const pGrad = ctx.createLinearGradient(px, py, px + 10, py + 8);
        pGrad.addColorStop(0, '#94a3b8');
        pGrad.addColorStop(0.5, '#475569');
        pGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = pGrad;

        ctx.beginPath();
        ctx.ellipse(px, py, 7 - i * 0.8, 4.5, 0.25, 0, 6.28);
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      ctx.restore();
    };
    drawSide(-1); // Left pauldron
    drawSide(1);  // Right pauldron
  },

  _drawRowanHelm(ctx, options) {
    // Neck gorget
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-5, -23, 10, 6);

    // Helmet dome (Sallet)
    const helmGrad = ctx.createRadialGradient(-3, -33, 2, 0, -32, 16);
    helmGrad.addColorStop(0, '#e2e8f0');
    helmGrad.addColorStop(0.4, '#64748b');
    helmGrad.addColorStop(0.85, '#1e293b');
    helmGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = helmGrad;

    ctx.beginPath();
    ctx.arc(0, -32, 10, 0, 6.28);
    ctx.fill();

    // Helmet crest ridge
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -42);
    ctx.lineTo(0, -25);
    ctx.stroke();

    // Visor slit with luminous slit glow
    const visorCol = options.visorColor || '#38bdf8';
    ctx.fillStyle = '#020617';
    ctx.fillRect(-7, -33, 14, 3.5);

    ctx.save();
    ctx.fillStyle = visorCol;
    ctx.shadowColor = visorCol;
    ctx.shadowBlur = options.visorGlow ? 12 : 6;
    ctx.fillRect(-6, -32, 12, 1.8);
    ctx.restore();
  },

  _drawRestingWeaponHands(ctx, options) {
    // Arms holding greatsword tip resting on stone floor
    ctx.fillStyle = '#475569';
    ctx.fillRect(-11, -8, 5, 17);
    ctx.fillRect(6, -8, 5, 17);

    // Gauntlets
    ctx.fillStyle = '#334155';
    ctx.fillRect(-12, 6, 7, 6);
    ctx.fillRect(5, 6, 7, 6);

    // High-fidelity Runic Greatsword
    this.drawGreatsword(ctx, 0, 8, 0, 0.95, options);
  },

  _drawCombatReadyHands(ctx, options) {
    ctx.save();
    ctx.translate(6, -6);

    // Forearm & Gauntlets raised
    ctx.fillStyle = '#475569';
    ctx.fillRect(-7, -4, 6, 12);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-8, 4, 7, 7);

    // Runic Greatsword angled up and forward
    this.drawGreatsword(ctx, 0, 0, 2.75, 1.0, options);
    ctx.restore();
  },

  _drawRaisingWeapon(ctx, t, options) {
    // "Come." stance — Rowan holding weapon aloft
    ctx.save();
    ctx.translate(10, -18);

    // Raised arm
    ctx.fillStyle = '#475569';
    ctx.fillRect(-4, 0, 6, 16);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-5, 14, 7, 7);

    // Greatsword raised high into the air
    this.drawGreatsword(ctx, 0, 16, 3.14 + 0.25, 1.1, options);
    ctx.restore();
  },

  _drawHeadClutchHands(ctx) {
    // Both gauntlets gripping sides of helmet in psychological agony
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(-11, -32, 5, 0, 6.28);
    ctx.arc(11, -32, 5, 0, 6.28);
    ctx.fill();
  },

  _drawStaggerHands(ctx) {
    // Arms thrown wide in reaction to fatal blow
    ctx.fillStyle = '#475569';
    ctx.fillRect(-22, -12, 10, 5);
    ctx.fillRect(12, -8, 10, 5);
  },

  _drawHandsWithoutWeapon(ctx, pose) {
    // Gauntlets resting on knee or ground
    ctx.fillStyle = '#334155';
    if (pose === 'knee') {
      ctx.fillRect(-10, 8, 6, 6);
      ctx.fillRect(8, 12, 6, 6); // Hand on floor
    } else {
      ctx.fillRect(-8, 6, 5, 5);
      ctx.fillRect(3, 6, 5, 5);
    }
  },

  // ─────────────────────────────────────────────────────────────────
  // 1B. RUNIC GREATSWORD — MULTI-FACETED BLADE & RUNIC CHANNEL
  // ─────────────────────────────────────────────────────────────────
  drawGreatsword(ctx, x, y, angle = 0, scale = 1.0, options = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    // Cast soft directional floor shadow if requested
    if (options.floorShadow) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(2, 22, 5, 24, 0.1, 0, 6.28);
      ctx.fill();
      ctx.restore();
    }

    // 1. Blade Body (Double-edged steel with central ridge)
    const bladeGrad = ctx.createLinearGradient(-3.5, 0, 3.5, 0);
    bladeGrad.addColorStop(0, '#f8fafc');   // edge highlight
    bladeGrad.addColorStop(0.35, '#cbd5e1'); // bevel facet
    bladeGrad.addColorStop(0.5, '#64748b');  // central fuller shadow
    bladeGrad.addColorStop(0.85, '#94a3b8'); // opposite facet
    bladeGrad.addColorStop(1, '#334155');   // back edge
    ctx.fillStyle = bladeGrad;

    // Tapered double-edged blade
    ctx.beginPath();
    ctx.moveTo(-3.5, 0);
    ctx.lineTo(-2.8, 36);
    ctx.lineTo(0, 44); // Sharpened tip
    ctx.lineTo(2.8, 36);
    ctx.lineTo(3.5, 0);
    ctx.closePath();
    ctx.fill();

    // Steel edge bevel line
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.lineTo(0, 43);
    ctx.stroke();

    // 2. Central Runic Fuller & Glowing Runes
    const runicColor = options.runicColor || '#38bdf8';
    const runeGlow = options.runeGlow !== undefined ? options.runeGlow : 8;
    ctx.save();
    ctx.fillStyle = runicColor;
    ctx.shadowColor = runicColor;
    ctx.shadowBlur = runeGlow;
    // Central glowing channel
    ctx.fillRect(-0.8, 4, 1.6, 26);
    // Micro runic notches
    for (let r = 0; r < 4; r++) {
      const ry = 8 + r * 6;
      ctx.fillRect(-2, ry, 4, 1.2);
    }
    ctx.restore();

    // 3. Flared Golden Crossguard with Quillons
    const guardGrad = ctx.createLinearGradient(-13, -2, 13, 2);
    guardGrad.addColorStop(0, '#78350f');
    guardGrad.addColorStop(0.2, '#f59e0b');
    guardGrad.addColorStop(0.5, '#fef08a');
    guardGrad.addColorStop(0.8, '#d97706');
    guardGrad.addColorStop(1, '#451a03');
    ctx.fillStyle = guardGrad;

    // Sculpted crossguard shape
    ctx.beginPath();
    ctx.moveTo(-13, -3);
    ctx.lineTo(-11, -1);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-2, 3);
    ctx.lineTo(2, 3);
    ctx.lineTo(3, 0);
    ctx.lineTo(11, -1);
    ctx.lineTo(13, -3);
    ctx.lineTo(12, 1);
    ctx.lineTo(3, 2);
    ctx.lineTo(0, 3.5);
    ctx.lineTo(-3, 2);
    ctx.lineTo(-12, 1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // Central crossguard boss
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 0.5, 2.5, 0, 6.28);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, 0.5, 1.2, 0, 6.28);
    ctx.fill();

    // 4. Grip / Hilt (Wire-bound dark leather)
    ctx.fillStyle = '#291b12';
    ctx.fillRect(-2, -10, 4, 9);
    // Wire wraps
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 0.8;
    for (let w = 0; w < 4; w++) {
      const wy = -9 + w * 2.2;
      ctx.beginPath();
      ctx.moveTo(-2, wy);
      ctx.lineTo(2, wy + 0.8);
      ctx.stroke();
    }

    // 5. Pommel with Paladin Sapphire Gem
    const pommelGrad = ctx.createRadialGradient(-0.5, -12.5, 1, 0, -12, 4);
    pommelGrad.addColorStop(0, '#fef08a');
    pommelGrad.addColorStop(0.6, '#b45309');
    pommelGrad.addColorStop(1, '#451a03');
    ctx.fillStyle = pommelGrad;
    ctx.beginPath();
    ctx.arc(0, -12, 3.5, 0, 6.28);
    ctx.fill();
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // Sapphire insert
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, -12, 1.6, 0, 6.28);
    ctx.fill();

    ctx.restore();
  },

  _drawRowanProne(ctx, t, options) {
    // Fully prone collapsed posture on dungeon flagstones
    // Realistic anatomical proportions, horizontal articulated armor plates, pooling velvet mantle, limp outstretched gauntlets

    // 1. Spreading Blood Sheen & Stone Crevice Stains
    ctx.save();
    const bloodGrad = ctx.createRadialGradient(0, 18, 4, 0, 18, 52);
    bloodGrad.addColorStop(0, 'rgba(88, 28, 28, 0.7)');
    bloodGrad.addColorStop(0.4, 'rgba(45, 10, 15, 0.5)');
    bloodGrad.addColorStop(0.8, 'rgba(20, 3, 7, 0.3)');
    bloodGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bloodGrad;
    ctx.beginPath();
    ctx.ellipse(0, 19, 56, 16, 0.05, 0, 6.28);
    ctx.fill();

    // Deep contact shadow directly under body
    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
    ctx.beginPath();
    ctx.ellipse(-2, 20, 44, 10, 0.03, 0, 6.28);
    ctx.fill();
    ctx.restore();

    // 2. Crimson Mantle / Cloak (Draped and pooled across flagstones)
    ctx.save();
    const mantleGrad = ctx.createLinearGradient(-35, 10, 40, 24);
    mantleGrad.addColorStop(0, '#991b1b');
    mantleGrad.addColorStop(0.3, '#4c0519');
    mantleGrad.addColorStop(0.7, '#2a040d');
    mantleGrad.addColorStop(1, '#110206');
    ctx.fillStyle = mantleGrad;

    // Wide pooled fabric with natural cloth folds
    ctx.beginPath();
    ctx.moveTo(-22, 10);
    ctx.bezierCurveTo(-38, 8, -48, 16, -42, 23);
    ctx.bezierCurveTo(-32, 27, -15, 26, -5, 25);
    ctx.bezierCurveTo(15, 28, 30, 26, 42, 21);
    ctx.bezierCurveTo(46, 15, 36, 11, 24, 12);
    ctx.bezierCurveTo(12, 11, -8, 10, -22, 10);
    ctx.closePath();
    ctx.fill();

    // Mantle inner fold creases
    ctx.strokeStyle = '#1a0308';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-35, 15);
    ctx.quadraticCurveTo(-20, 21, -8, 22);
    ctx.moveTo(8, 16);
    ctx.quadraticCurveTo(22, 22, 36, 19);
    ctx.stroke();

    // Mantle edge highlight
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.25)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-40, 21);
    ctx.bezierCurveTo(-25, 25, 10, 26, 38, 20);
    ctx.stroke();
    ctx.restore();

    // 3. Legs, Greaves & Sabatons (Horizontal & limp on stone)
    ctx.save();
    const legGradUnder = ctx.createLinearGradient(0, 14, 0, 22);
    legGradUnder.addColorStop(0, '#475569');
    legGradUnder.addColorStop(0.6, '#1e293b');
    legGradUnder.addColorStop(1, '#0f172a');
    ctx.fillStyle = legGradUnder;
    // Thigh plate & knee
    ctx.fillRect(8, 13, 14, 7);
    // Shin greave
    ctx.fillRect(20, 15, 16, 6);
    // Pointed sabaton resting sideways
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(36, 16);
    ctx.lineTo(44, 18);
    ctx.lineTo(45, 21);
    ctx.lineTo(36, 21);
    ctx.closePath();
    ctx.fill();

    // Right leg (forefront, angled down)
    const legGradTop = ctx.createLinearGradient(0, 16, 0, 24);
    legGradTop.addColorStop(0, '#94a3b8');
    legGradTop.addColorStop(0.4, '#475569');
    legGradTop.addColorStop(1, '#1e293b');
    ctx.fillStyle = legGradTop;
    ctx.fillRect(4, 16, 16, 7); // Cuisse
    // Poleyn (Knee cop)
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(18, 19, 4, 0, 6.28);
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Greave (Shin)
    ctx.fillStyle = legGradTop;
    ctx.fillRect(18, 17, 16, 6);
    // Steel ridge highlight
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(19, 18);
    ctx.lineTo(33, 18);
    ctx.stroke();

    // Sabaton (Armored boot)
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(34, 18);
    ctx.lineTo(42, 20);
    ctx.lineTo(41, 23);
    ctx.lineTo(33, 23);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 4. Torso, Cuirass Backplate & Faulds (Slumped horizontal)
    ctx.save();
    // Segmented fauld skirt plates (hips)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-6, 12, 14, 10);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(-6, 12, 14, 10);

    // Leather cinching belts with brass buckles
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-4, 13, 11, 3);
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(-1, 12.5, 4, 4);

    // Sculpted steel backplate/breastplate lying prone
    const plateGrad = ctx.createLinearGradient(-22, 6, 2, 22);
    plateGrad.addColorStop(0, '#cbd5e1');
    plateGrad.addColorStop(0.3, '#64748b');
    plateGrad.addColorStop(0.7, '#334155');
    plateGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = plateGrad;

    ctx.beginPath();
    ctx.moveTo(-20, 8);
    ctx.lineTo(0, 10);
    ctx.lineTo(2, 20);
    ctx.lineTo(-18, 20);
    ctx.closePath();
    ctx.fill();

    // Steel spine ridge bevel highlight
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-18, 10);
    ctx.lineTo(-4, 11);
    ctx.lineTo(-3, 19);
    ctx.stroke();
    ctx.restore();

    // 5. 3-Tier Shoulder Pauldron (Upper shoulder on ground)
    ctx.save();
    for (let p = 0; p < 3; p++) {
      const px = -16 - p * 3;
      const py = 7 + p * 3;
      const pGrad = ctx.createLinearGradient(px, py, px + 8, py + 6);
      pGrad.addColorStop(0, '#94a3b8');
      pGrad.addColorStop(0.5, '#475569');
      pGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = pGrad;

      ctx.beginPath();
      ctx.ellipse(px, py, 6, 4, 0.3, 0, 6.28);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    ctx.restore();

    // 6. Knight Sallet Helm (Resting sideways against flagstones)
    ctx.save();
    // Neck gorget plate
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-22, 13, 6, 6);

    // Helmet dome (Sallet)
    const helmGrad = ctx.createRadialGradient(-26, 13, 2, -25, 14, 11);
    helmGrad.addColorStop(0, '#f1f5f9');
    helmGrad.addColorStop(0.35, '#94a3b8');
    helmGrad.addColorStop(0.75, '#334155');
    helmGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = helmGrad;

    ctx.beginPath();
    ctx.arc(-26, 14, 9, 0, 6.28);
    ctx.fill();

    // Helm crest ridge
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-33, 11);
    ctx.quadraticCurveTo(-26, 7, -19, 12);
    ctx.stroke();

    // Sallet visor slit facing downward with dying ember glow
    ctx.fillStyle = '#020617';
    ctx.fillRect(-32, 16, 11, 2.5);

    // Subtle dying cyan pulse
    const dyingGlow = Math.max(0, 1 - (t - 6.0) / 4.0) * (0.4 + 0.3 * Math.sin(t * 2));
    if (dyingGlow > 0.05) {
      ctx.save();
      ctx.fillStyle = `rgba(56, 189, 248, ${dyingGlow})`;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8 * dyingGlow;
      ctx.fillRect(-31, 16.5, 9, 1.4);
      ctx.restore();
    }
    ctx.restore();

    // 7. Outstretched Arm & Limp Articulated Gauntlet Fingers
    ctx.save();
    // Vambrace (Forearm plate) reaching forward
    const armGrad = ctx.createLinearGradient(-6, 16, 14, 21);
    armGrad.addColorStop(0, '#64748b');
    armGrad.addColorStop(0.5, '#334155');
    armGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = armGrad;
    ctx.beginPath();
    ctx.moveTo(-6, 16);
    ctx.lineTo(8, 18);
    ctx.lineTo(7, 22);
    ctx.lineTo(-7, 20);
    ctx.closePath();
    ctx.fill();

    // Elbow couter cop
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(-4, 18, 3, 0, 6.28);
    ctx.fill();

    // Gauntlet metacarpe (Hand backplate)
    ctx.fillStyle = '#475569';
    ctx.fillRect(7, 19, 6, 4);

    // Articulated gauntlet fingers resting limp and open on stone
    ctx.fillStyle = '#cbd5e1';
    for (let f = 0; f < 4; f++) {
      const fx = 13 + f * 2.4;
      const fy = 20.5 + f * 0.7;
      ctx.fillRect(fx, fy, 2.2, 1.4);
    }
    ctx.restore();

    // 8. Fallen Runic Greatsword (Dropped inches away from limp fingers)
    this.drawGreatsword(ctx, 24, 22, 1.48, 0.85, {
      floorShadow: true,
      runeGlow: Math.max(0, 4 - (t - 6.0) * 0.8)
    });
  },

  // ─────────────────────────────────────────────────────────────────
  // 2. RESCUED SURVIVORS — LAYERED CITIZENS & ALLIES
  // ─────────────────────────────────────────────────────────────────
  drawSurvivor(ctx, x, y, scale = 1.0, pose = 'walk', type = 'injured', options = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const t = options.time || 0;
    const walkBob = Math.sin(t * 4.0) * (pose === 'walk' ? 2.5 : 0.8);
    const limpTilt = (type === 'injured') ? 0.08 : 0;
    ctx.rotate(limpTilt);

    // 1. Draped Traveler's Cloak / Cowl (Organic layered folds & fraying hem)
    ctx.save();
    const cloakGrad = ctx.createLinearGradient(0, -28, 0, 36);
    if (type === 'conspirator') {
      cloakGrad.addColorStop(0, '#27272a');
      cloakGrad.addColorStop(0.5, '#18181b');
      cloakGrad.addColorStop(1, '#09090b');
    } else if (type === 'ally') {
      cloakGrad.addColorStop(0, '#1e293b');
      cloakGrad.addColorStop(0.5, '#0f172a');
      cloakGrad.addColorStop(1, '#020617');
    } else { // injured
      cloakGrad.addColorStop(0, '#334155');
      cloakGrad.addColorStop(0.5, '#1e293b');
      cloakGrad.addColorStop(1, '#0f172a');
    }
    ctx.fillStyle = cloakGrad;

    const cloakFlutter = Math.sin(t * 3.2) * 2.5;
    ctx.beginPath();
    ctx.moveTo(-12, -18 + walkBob);
    ctx.bezierCurveTo(-18, 0, -20 + cloakFlutter, 18, -14 + cloakFlutter, 28);
    ctx.bezierCurveTo(-6, 26, 6, 26, 14 - cloakFlutter, 28);
    ctx.bezierCurveTo(20 - cloakFlutter, 18, 18, 0, 12, -18 + walkBob);
    ctx.closePath();
    ctx.fill();

    // Cowl seam folds
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-7, -14 + walkBob);
    ctx.bezierCurveTo(-12, 6, -11, 20, -8, 27);
    ctx.moveTo(7, -14 + walkBob);
    ctx.bezierCurveTo(12, 6, 11, 20, 8, 27);
    ctx.stroke();
    ctx.restore();

    // 2. Legs & Cross-Gartered Calf Wraps with Medieval Turn-Shoes
    const legWalk = (pose === 'walk') ? Math.sin(t * 4.0) * 3 : 0;
    const drawSurvivorLeg = (lx, isLeft) => {
      ctx.save();
      const offset = isLeft ? legWalk : -legWalk;
      // Woolen trousers
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(lx - 3, 16);
      ctx.lineTo(lx + 4, 16);
      ctx.lineTo(lx + 3.5, 24 + offset);
      ctx.lineTo(lx - 2.5, 24 + offset);
      ctx.closePath();
      ctx.fill();

      // Linen Cross-garter wraps
      const wrapGrad = ctx.createLinearGradient(lx - 3, 24, lx + 4, 32);
      wrapGrad.addColorStop(0, '#78716c');
      wrapGrad.addColorStop(0.5, '#57534e');
      wrapGrad.addColorStop(1, '#292524');
      ctx.fillStyle = wrapGrad;
      ctx.beginPath();
      ctx.moveTo(lx - 3, 24 + offset);
      ctx.lineTo(lx + 3.5, 24 + offset);
      ctx.lineTo(lx + 3, 31 + offset);
      ctx.lineTo(lx - 2.5, 31 + offset);
      ctx.closePath();
      ctx.fill();

      // Cross-gartering cords
      ctx.strokeStyle = '#a8a29e';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(lx - 3, 25 + offset); ctx.lineTo(lx + 3, 27 + offset);
      ctx.moveTo(lx + 3, 27 + offset); ctx.lineTo(lx - 2.5, 29 + offset);
      ctx.moveTo(lx - 2.5, 29 + offset); ctx.lineTo(lx + 2.5, 31 + offset);
      ctx.stroke();

      // Leather Turn-Shoe with folded collar
      ctx.fillStyle = '#1e1b18';
      ctx.beginPath();
      ctx.moveTo(lx - 3, 30 + offset);
      ctx.lineTo(lx + 4, 30 + offset);
      ctx.lineTo(lx + (isLeft ? -4 : 6), 34 + offset);
      ctx.lineTo(lx - (isLeft ? 5 : -1), 34 + offset);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    drawSurvivorLeg(-5, true);
    drawSurvivorLeg(4, false);

    // 3. Layered Padded Linen Gambeson / Tunic
    ctx.save();
    const tunicGrad = ctx.createLinearGradient(-9, -12, 9, 18);
    tunicGrad.addColorStop(0, '#475569');
    tunicGrad.addColorStop(0.5, '#334155');
    tunicGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = tunicGrad;

    ctx.beginPath();
    ctx.moveTo(-9, -12 + walkBob);
    ctx.lineTo(9, -12 + walkBob);
    ctx.lineTo(10, 16 + walkBob);
    ctx.lineTo(-10, 16 + walkBob);
    ctx.closePath();
    ctx.fill();

    // Padded gambeson vertical quilting lines
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.lineWidth = 0.9;
    for (let q = -6; q <= 6; q += 3) {
      ctx.beginPath();
      ctx.moveTo(q, -11 + walkBob);
      ctx.lineTo(q, 15 + walkBob);
      ctx.stroke();
    }

    // Worn Cinching Belt with brass buckle and hanging tongue
    ctx.fillStyle = '#292524';
    ctx.beginPath();
    ctx.moveTo(-10, 5 + walkBob); ctx.lineTo(10, 5 + walkBob);
    ctx.lineTo(10, 9 + walkBob); ctx.lineTo(-10, 9 + walkBob);
    ctx.closePath();
    ctx.fill();

    // Brass belt buckle
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1;
    ctx.strokeRect(-2, 4.5 + walkBob, 4.5, 4.5);
    // Hanging leather strap
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.moveTo(1, 9 + walkBob);
    ctx.lineTo(3.5, 9 + walkBob);
    ctx.lineTo(2.5, 17 + walkBob);
    ctx.lineTo(0.5, 16.5 + walkBob);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 4. Arm Sling & Bandages (For Injured Survivor)
    if (type === 'injured') {
      ctx.save();
      // Linen Arm Sling
      const slingGrad = ctx.createLinearGradient(-8, -4, 8, 10);
      slingGrad.addColorStop(0, '#e2e8f0');
      slingGrad.addColorStop(0.6, '#94a3b8');
      slingGrad.addColorStop(1, '#64748b');
      ctx.fillStyle = slingGrad;

      ctx.beginPath();
      ctx.moveTo(-8, -8 + walkBob); // Neck strap
      ctx.lineTo(2, 6 + walkBob);   // Forearm hammock
      ctx.lineTo(-6, 11 + walkBob);
      ctx.lineTo(-10, -2 + walkBob);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Slung forearm inside
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(-5, 4 + walkBob);
      ctx.lineTo(3, 5 + walkBob);
      ctx.lineTo(2, 8 + walkBob);
      ctx.lineTo(-5, 7 + walkBob);
      ctx.closePath();
      ctx.fill();

      // Dried blood seep on sling
      ctx.fillStyle = 'rgba(153, 27, 27, 0.55)';
      ctx.beginPath();
      ctx.ellipse(-2, 6 + walkBob, 2.8, 1.8, 0.2, 0, 6.28);
      ctx.fill();
      ctx.restore();
    }

    // 5. Sculpted Head, Deep Peaked Hood & Facial Profile in Chiaroscuro
    ctx.save();
    // Shadow interior of hood
    ctx.fillStyle = '#05040a';
    ctx.beginPath();
    ctx.ellipse(0, -22 + walkBob, 7, 8.5, 0, 0, 6.28);
    ctx.fill();

    // Chiseled facial anatomy emerging from hood shadow
    const skinGrad = ctx.createLinearGradient(0, -25, 4, -17);
    skinGrad.addColorStop(0, '#e2e8f0');
    skinGrad.addColorStop(0.5, '#94a3b8');
    skinGrad.addColorStop(1, '#475569');
    ctx.fillStyle = skinGrad;

    ctx.beginPath();
    ctx.moveTo(-1, -24 + walkBob); // Brow
    ctx.lineTo(3.5, -22 + walkBob); // Nose bridge
    ctx.lineTo(2.5, -20.5 + walkBob); // Upper lip
    ctx.lineTo(3.2, -18.5 + walkBob); // Chin
    ctx.lineTo(-1.5, -18 + walkBob);  // Jaw angle
    ctx.closePath();
    ctx.fill();

    // Shaded eye hollow
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(0.5, -23 + walkBob, 1.4, 0.9, 0, 0, 6.28);
    ctx.fill();

    // Outer Cowl Hood with realistic peak & collar folds
    const hoodGrad = ctx.createLinearGradient(0, -32, 0, -14);
    if (type === 'conspirator') {
      hoodGrad.addColorStop(0, '#27272a');
      hoodGrad.addColorStop(1, '#09090b');
    } else {
      hoodGrad.addColorStop(0, '#334155');
      hoodGrad.addColorStop(1, '#0f172a');
    }
    ctx.fillStyle = hoodGrad;

    ctx.beginPath();
    ctx.moveTo(0, -31 + walkBob); // Cowl peak
    ctx.bezierCurveTo(9, -30 + walkBob, 10, -20 + walkBob, 8, -14 + walkBob);
    ctx.lineTo(5, -13 + walkBob);
    ctx.bezierCurveTo(3, -19 + walkBob, -3, -19 + walkBob, -5, -13 + walkBob);
    ctx.lineTo(-8, -14 + walkBob);
    ctx.bezierCurveTo(-10, -20 + walkBob, -9, -30 + walkBob, 0, -31 + walkBob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = (type === 'conspirator') ? '#52525b' : '#64748b';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Head bandage dressing for injured survivor
    if (type === 'injured') {
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.moveTo(-6, -26 + walkBob);
      ctx.lineTo(5, -24 + walkBob);
      ctx.lineTo(4.5, -21.5 + walkBob);
      ctx.lineTo(-6, -23 + walkBob);
      ctx.closePath();
      ctx.fill();
      // Blood spot on dressing
      ctx.fillStyle = 'rgba(185, 28, 28, 0.65)';
      ctx.beginPath();
      ctx.ellipse(-1, -24 + walkBob, 2, 1.2, 0.2, 0, 6.28);
      ctx.fill();
    }
    ctx.restore();

    // 6. Concealed Assassin Dagger Draw (for Betrayal sequence)
    if (options.concealedDagger) {
      ctx.save();
      ctx.translate(8, 4 + walkBob);
      ctx.rotate(0.38);

      // Curved Leaf Parrying Blade with Fuller
      const bladeGrad = ctx.createLinearGradient(0, 0, 4, 18);
      bladeGrad.addColorStop(0, '#f8fafc');
      bladeGrad.addColorStop(0.4, '#cbd5e1');
      bladeGrad.addColorStop(0.8, '#64748b');
      bladeGrad.addColorStop(1, '#334155');
      ctx.fillStyle = bladeGrad;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(2.8, 1);
      ctx.bezierCurveTo(3.8, 8, 3.2, 14, 0.8, 19); // Curved needle point
      ctx.bezierCurveTo(-0.6, 14, -0.4, 8, 0, 0);
      ctx.closePath();
      ctx.fill();

      // Blood groove / Fuller
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(1.2, 2); ctx.lineTo(1.2, 13);
      ctx.stroke();

      // Emerald Toxin Sheen along cutting edge
      ctx.save();
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 0.9;
      ctx.shadowColor = '#4ade80';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(2.4, 3);
      ctx.bezierCurveTo(3.2, 8, 2.8, 13, 0.8, 19);
      ctx.stroke();
      ctx.restore();

      // Brass Downswept S-Curve Quillons Crossguard
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.moveTo(-3.5, -2);
      ctx.lineTo(4.5, -0.5);
      ctx.lineTo(4, 1.5);
      ctx.lineTo(-4, 0);
      ctx.closePath();
      ctx.fill();

      // Wire-bound Grip & Spherical Pommel
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(-1.2, -6, 2.4, 5);
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(0, -6.5, 1.8, 0, 6.28);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────────
  // 3. THE ABYSS WARDEN — 3.5M TITANIC VOID EXECUTIONER
  // ─────────────────────────────────────────────────────────────────
  drawWardenDreadblade(ctx, x, y, angle = 0, scale = 1.0, options = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    // Floor drop shadow if fallen
    if (options.floorShadow) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.beginPath();
      ctx.ellipse(0, 4, 18, 52, 0, 0, 6.28);
      ctx.fill();
      ctx.restore();
    }

    // Horned Skull Pommel
    ctx.fillStyle = '#1c0533';
    ctx.beginPath();
    ctx.arc(0, 44, 4.5, 0, 6.28);
    ctx.fill();
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Pommel Horn Spikes
    ctx.fillStyle = '#581c87';
    ctx.beginPath();
    ctx.moveTo(-4, 44); ctx.lineTo(-9, 48); ctx.lineTo(-3, 41); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4, 44); ctx.lineTo(9, 48); ctx.lineTo(3, 41); ctx.fill();

    // Two-handed Wire-bound Leather Grip
    ctx.fillStyle = '#0f021f';
    ctx.fillRect(-2.5, 18, 5, 26);
    ctx.strokeStyle = '#7e22ce';
    ctx.lineWidth = 1;
    for (let w = 0; w < 5; w++) {
      const wy = 21 + w * 4.5;
      ctx.beginPath();
      ctx.moveTo(-2.5, wy); ctx.lineTo(2.5, wy - 1);
      ctx.stroke();
    }

    // Demonic Downswept Crossguard with Curved Quillons
    const guardGrad = ctx.createLinearGradient(-26, 12, 26, 20);
    guardGrad.addColorStop(0, '#581c87');
    guardGrad.addColorStop(0.5, '#1e0533');
    guardGrad.addColorStop(1, '#05010a');
    ctx.fillStyle = guardGrad;

    ctx.beginPath();
    ctx.moveTo(0, 14);
    ctx.lineTo(-12, 16);
    ctx.lineTo(-24, 22); // Left downswept quillon
    ctx.lineTo(-20, 13);
    ctx.lineTo(-8, 12);
    ctx.lineTo(0, 10);   // Center demon crest
    ctx.lineTo(8, 12);
    ctx.lineTo(20, 13);
    ctx.lineTo(24, 22);  // Right downswept quillon
    ctx.lineTo(12, 16);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Center Crossguard Abyssal Eye
    const runeGlow = options.runeGlow !== undefined ? options.runeGlow : 1.0;
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10 * runeGlow;
    ctx.beginPath();
    ctx.ellipse(0, 13.5, 2.8, 1.8, 0, 0, 6.28);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Colossal Dreadblade (Obsidian Steel with Serrated Edges)
    const bladeGrad = ctx.createLinearGradient(-12, -75, 12, 10);
    bladeGrad.addColorStop(0, '#2e0854');
    bladeGrad.addColorStop(0.35, '#190333');
    bladeGrad.addColorStop(0.75, '#0b0117');
    bladeGrad.addColorStop(1, '#04000a');
    ctx.fillStyle = bladeGrad;

    ctx.beginPath();
    ctx.moveTo(0, -78);     // Piercing barbed tip
    ctx.lineTo(8, -66);
    ctx.lineTo(6, -52);
    ctx.lineTo(10, -42);    // Right outer barb
    ctx.lineTo(7, -30);
    ctx.lineTo(9, -15);
    ctx.lineTo(7, 10);      // Ricasso base
    ctx.lineTo(-7, 10);
    ctx.lineTo(-9, -15);
    ctx.lineTo(-7, -30);
    ctx.lineTo(-10, -42);   // Left outer barb
    ctx.lineTo(-6, -52);
    ctx.lineTo(-8, -66);
    ctx.closePath();
    ctx.fill();

    // Steel Edge Bevel Specular Highlights
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // Central Fuller Runic Channel (Pulsing Void & Crimson energy)
    if (runeGlow > 0.05) {
      ctx.strokeStyle = '#ef4444';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 14 * runeGlow;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(0, -70);
      ctx.lineTo(0, 8);
      ctx.stroke();

      // Transverse runic notches along the blade
      ctx.lineWidth = 1.2;
      for (let r = 0; r < 4; r++) {
        const ry = -58 + r * 14;
        ctx.beginPath();
        ctx.moveTo(-3.5, ry); ctx.lineTo(3.5, ry);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  },

  _drawWardenWings(ctx, span, t, options = {}) {
    const flap = Math.sin(t * 2.2) * 0.06;
    ctx.save();

    const drawWingHalf = (dir) => {
      ctx.save();
      ctx.scale(dir, 1);

      // Translucent Abyssal Webbing
      const webGrad = ctx.createRadialGradient(0, -20, 10, 80 * span, 10, 130 * span);
      webGrad.addColorStop(0, 'rgba(46, 8, 84, 0.88)');
      webGrad.addColorStop(0.5, 'rgba(25, 3, 51, 0.82)');
      webGrad.addColorStop(0.85, 'rgba(10, 1, 22, 0.75)');
      webGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = webGrad;

      // Scalloped demon bat wing contour
      ctx.beginPath();
      ctx.moveTo(10, -18);
      // Main arm bone arch
      ctx.bezierCurveTo(45 * span, -75 - flap * 35, 85 * span, -80 - flap * 25, 125 * span, -40 - flap * 15);
      // Scallop 1 (between bone 1 and 2)
      ctx.quadraticCurveTo(105 * span, -15, 115 * span, 10);
      // Scallop 2 (between bone 2 and 3)
      ctx.quadraticCurveTo(90 * span, 20, 85 * span, 42);
      // Scallop 3 (between bone 3 and body)
      ctx.quadraticCurveTo(45 * span, 30, 14, 8);
      ctx.closePath();
      ctx.fill();

      // Wing Membrane Edge Highlight
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.55)';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Skeletal Wing Struts (Arm Bone & Finger Ribs)
      const boneGrad = ctx.createLinearGradient(0, -20, 125 * span, -40);
      boneGrad.addColorStop(0, '#581c87');
      boneGrad.addColorStop(0.6, '#2e0854');
      boneGrad.addColorStop(1, '#0f021f');
      ctx.strokeStyle = boneGrad;
      ctx.lineWidth = 3.2;

      // Main upper arm strut
      ctx.beginPath();
      ctx.moveTo(10, -18);
      ctx.quadraticCurveTo(55 * span, -65 - flap * 30, 95 * span, -55 - flap * 20);
      ctx.stroke();

      // Forearm strut to apex knuckle
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(95 * span, -55 - flap * 20);
      ctx.lineTo(125 * span, -40 - flap * 15);
      ctx.stroke();

      // Knuckle Hooked Claw at apex
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.moveTo(125 * span, -40 - flap * 15);
      ctx.lineTo(133 * span, -46 - flap * 15);
      ctx.lineTo(128 * span, -36 - flap * 15);
      ctx.closePath();
      ctx.fill();

      // Articulated Finger Struts radiating through membrane
      ctx.strokeStyle = 'rgba(126, 34, 206, 0.7)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(95 * span, -55 - flap * 20);
      ctx.quadraticCurveTo(112 * span, -15, 115 * span, 10);
      ctx.moveTo(95 * span, -55 - flap * 20);
      ctx.quadraticCurveTo(95 * span, 10, 85 * span, 42);
      ctx.stroke();

      // Faint glowing void veins webbed across the membrane
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(55 * span, -25); ctx.lineTo(75 * span, -10); ctx.lineTo(95 * span, 8);
      ctx.stroke();

      ctx.restore();
    };

    drawWingHalf(-1); // Left wing
    drawWingHalf(1);  // Right wing

    ctx.restore();
  },

  drawAbyssWarden(ctx, x, y, scale = 1.0, pose = 'idle', options = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const t = options.time || 0;
    const isSeated = (pose === 'seated_throne');
    const isKneeling = (pose === 'knee_fall' || pose === 'stagger_chest_clutch');
    const wingSpan = options.wingSpread !== undefined ? options.wingSpread : (isSeated ? 0.22 : (pose === 'unbound' ? 1.0 : 0.85));

    // 1. DUAL ARTICULATED VOID WINGS (Back layer)
    this._drawWardenWings(ctx, wingSpan, t, options);

    const torsoY = isKneeling ? 14 : (isSeated ? 0 : -10);

    // 2. HEAVY VOID GREAVES & TALON SABATONS (Legs)
    if (isKneeling) {
      // Planted right knee, braced left foot
      const legGrad = ctx.createLinearGradient(-26, torsoY + 20, 26, torsoY + 45);
      legGrad.addColorStop(0, '#3b0764');
      legGrad.addColorStop(0.5, '#1e0533');
      legGrad.addColorStop(1, '#05010a');
      ctx.fillStyle = legGrad;

      // Left leg braced
      ctx.beginPath();
      ctx.moveTo(-24, torsoY + 22); ctx.lineTo(-6, torsoY + 22); ctx.lineTo(-4, torsoY + 42); ctx.lineTo(-24, torsoY + 42);
      ctx.closePath();
      ctx.fill();

      // Right leg planted on stone
      ctx.fillRect(8, torsoY + 32, 26, 12);

      // Spiked knee cop
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.moveTo(-25, torsoY + 34); ctx.lineTo(-12, torsoY + 29); ctx.lineTo(-4, torsoY + 34); ctx.fill();

      // Clawed talon sabatons
      ctx.fillStyle = '#0f021f';
      ctx.fillRect(-28, torsoY + 40, 16, 8);
      ctx.fillRect(28, torsoY + 40, 16, 8);
    } else if (isSeated) {
      // Seated regally on the throne dais
      // Left and right armored cuisses spread wide in commanding posture
      const drawSeatedLeg = (dir) => {
        ctx.save();
        ctx.scale(dir, 1);
        const cuisseGrad = ctx.createLinearGradient(12, torsoY + 16, 42, torsoY + 32);
        cuisseGrad.addColorStop(0, '#3b0764');
        cuisseGrad.addColorStop(0.5, '#1e0533');
        cuisseGrad.addColorStop(1, '#05010a');
        ctx.fillStyle = cuisseGrad;

        // Spread cuisse (Thigh)
        ctx.beginPath();
        ctx.moveTo(10, torsoY + 16);
        ctx.lineTo(36, torsoY + 20);
        ctx.lineTo(38, torsoY + 34);
        ctx.lineTo(12, torsoY + 30);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#7e22ce';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Spiked Poleyn (Knee cop pointing forward)
        ctx.fillStyle = '#581c87';
        ctx.beginPath();
        ctx.moveTo(34, torsoY + 18);
        ctx.lineTo(46, torsoY + 27);
        ctx.lineTo(36, torsoY + 36);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Greave (Shin descending to dais)
        ctx.fillStyle = '#1e0533';
        ctx.fillRect(34, torsoY + 32, 14, 22);

        // Articulated talon sabaton gripping lower dais step
        ctx.fillStyle = '#0a0114';
        ctx.beginPath();
        ctx.moveTo(32, torsoY + 54);
        ctx.lineTo(52, torsoY + 54);
        ctx.lineTo(56, torsoY + 62);
        ctx.lineTo(30, torsoY + 62);
        ctx.closePath();
        ctx.fill();
        // Talon claws
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.moveTo(48, torsoY + 62); ctx.lineTo(56, torsoY + 65); ctx.lineTo(44, torsoY + 62); ctx.fill();
        ctx.restore();
      };
      drawSeatedLeg(-1); // Left leg
      drawSeatedLeg(1);  // Right leg
    } else {
      // Towering battle stance with articulated void cuisses, spiked poleyns, fluted greaves, talon sabatons
      const drawStandingLeg = (dir) => {
        ctx.save();
        ctx.scale(dir, 1);
        const legGrad = ctx.createLinearGradient(8, torsoY + 20, 28, torsoY + 62);
        legGrad.addColorStop(0, '#3b0764');
        legGrad.addColorStop(0.4, '#1e0533');
        legGrad.addColorStop(1, '#05010a');
        ctx.fillStyle = legGrad;

        // Cuisse (Thigh)
        ctx.beginPath();
        ctx.moveTo(6, torsoY + 20);
        ctx.lineTo(24, torsoY + 20);
        ctx.lineTo(22, torsoY + 38);
        ctx.lineTo(8, torsoY + 38);
        ctx.closePath();
        ctx.fill();

        // Spiked Poleyn (Knee)
        ctx.fillStyle = '#581c87';
        ctx.beginPath();
        ctx.moveTo(5, torsoY + 36);
        ctx.lineTo(15, torsoY + 30);
        ctx.lineTo(25, torsoY + 36);
        ctx.lineTo(15, torsoY + 44);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Greave (Shin)
        ctx.fillStyle = legGrad;
        ctx.beginPath();
        ctx.moveTo(7, torsoY + 42);
        ctx.lineTo(23, torsoY + 42);
        ctx.lineTo(26, torsoY + 64);
        ctx.lineTo(5, torsoY + 64);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#7e22ce';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Curved Talon Sabaton
        ctx.fillStyle = '#0a0114';
        ctx.beginPath();
        ctx.moveTo(3, torsoY + 64);
        ctx.lineTo(28, torsoY + 64);
        ctx.lineTo(32, torsoY + 72);
        ctx.lineTo(1, torsoY + 72);
        ctx.closePath();
        ctx.fill();
        // Talon claw tips
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.moveTo(24, torsoY + 72); ctx.lineTo(33, torsoY + 75); ctx.lineTo(20, torsoY + 72); ctx.fill();
        ctx.restore();
      };
      drawStandingLeg(-1);
      drawStandingLeg(1);
    }

    // 3. TITANIC VOID CUIRASS, CORRUPTED HEART RIFT & PAULDRONS
    ctx.save();
    ctx.translate(0, torsoY);

    const plateGrad = ctx.createLinearGradient(-32, -32, 32, 22);
    plateGrad.addColorStop(0, '#581c87');
    plateGrad.addColorStop(0.35, '#2e0854');
    plateGrad.addColorStop(0.7, '#130224');
    plateGrad.addColorStop(1, '#05010a');
    ctx.fillStyle = plateGrad;

    ctx.beginPath();
    ctx.moveTo(-34, -32);
    ctx.lineTo(34, -32);
    ctx.lineTo(26, 22);
    ctx.lineTo(-26, 22);
    ctx.closePath();
    ctx.fill();

    // Steel Edge Bevel Highlights
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-34, -32); ctx.lineTo(0, -32); ctx.lineTo(0, 22);
    ctx.stroke();

    // Corrupted Void Heart Rift in Chest
    const heartPulse = Math.sin(t * 3.5) * 0.15 + 0.85;
    ctx.save();
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 18 * heartPulse;
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(8, -12);
    ctx.lineTo(0, -2);
    ctx.lineTo(-8, -12);
    ctx.closePath();
    ctx.fill();
    // Inner white star
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, -12, 2.5, 0, 6.28);
    ctx.fill();
    ctx.restore();

    // Void Energy Fissures in Armor (Cracks when defeated)
    if (options.crackedArmor) {
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2.4;
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(-18, -25); ctx.lineTo(-6, -12); ctx.lineTo(4, -18); ctx.lineTo(16, 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(12, -28); ctx.lineTo(2, -14); ctx.lineTo(-10, 4);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 3-Tier Spiked Void Pauldrons (Shoulders)
    const drawPauldron = (dir) => {
      ctx.save();
      ctx.scale(dir, 1);
      for (let p = 0; p < 3; p++) {
        const px = 28 + p * 6;
        const py = -32 + p * 8;
        const pGrad = ctx.createLinearGradient(px, py - 14, px + 18, py + 12);
        pGrad.addColorStop(0, '#7e22ce');
        pGrad.addColorStop(0.5, '#3b0764');
        pGrad.addColorStop(1, '#0c0217');
        ctx.fillStyle = pGrad;

        ctx.beginPath();
        ctx.moveTo(px, py + 4);
        ctx.lineTo(px + 20, py - 14); // Swept-up spike tip
        ctx.lineTo(px + 14, py + 14);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
    };
    drawPauldron(-1); // Left pauldron
    drawPauldron(1);  // Right pauldron

    // Heavy demon gorget (Neck)
    ctx.fillStyle = '#1e0533';
    ctx.fillRect(-14, -38, 28, 8);

    // 4. HORNED DEMON DREADHELM & BURNING SOUL EYES
    const helmGrad = ctx.createRadialGradient(0, -50, 4, 0, -48, 24);
    helmGrad.addColorStop(0, '#581c87');
    helmGrad.addColorStop(0.4, '#2e0854');
    helmGrad.addColorStop(0.85, '#130224');
    helmGrad.addColorStop(1, '#05010a');
    ctx.fillStyle = helmGrad;

    // Helm skull dome
    ctx.beginPath();
    ctx.moveTo(-18, -36);
    ctx.lineTo(-20, -52);
    ctx.lineTo(0, -60);
    ctx.lineTo(20, -52);
    ctx.lineTo(18, -36);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // Swept-back Barbed Demon Horns
    const hornGrad = ctx.createLinearGradient(0, -52, 45, -92);
    hornGrad.addColorStop(0, '#581c87');
    hornGrad.addColorStop(0.5, '#2e0854');
    hornGrad.addColorStop(1, '#090114');
    ctx.fillStyle = hornGrad;

    // Left main horn
    ctx.beginPath();
    ctx.moveTo(-16, -50);
    ctx.bezierCurveTo(-36, -65, -48, -85, -42, -96);
    ctx.bezierCurveTo(-34, -85, -22, -68, -12, -54);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Right main horn
    ctx.beginPath();
    ctx.moveTo(16, -50);
    ctx.bezierCurveTo(36, -65, 48, -85, 42, -96);
    ctx.bezierCurveTo(34, -85, 22, -68, 12, -54);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner secondary brow horns
    ctx.beginPath();
    ctx.moveTo(-10, -52); ctx.lineTo(-18, -68); ctx.lineTo(-6, -55); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, -52); ctx.lineTo(18, -68); ctx.lineTo(6, -55); ctx.closePath(); ctx.fill();

    // Luminous Burning Crimson Soul Eyes
    const eyeAlpha = options.eyeGlow !== undefined ? options.eyeGlow : 1.0;
    if (eyeAlpha > 0.05) {
      ctx.fillStyle = `rgba(239, 68, 68, ${eyeAlpha})`;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 18 * eyeAlpha;
      ctx.beginPath();
      ctx.ellipse(-6, -46, 3.5, 2.2, -0.2, 0, 6.28);
      ctx.ellipse(6, -46, 3.5, 2.2, 0.2, 0, 6.28);
      ctx.fill();
      ctx.fillStyle = '#ffedd5';
      ctx.beginPath();
      ctx.arc(-6, -46, 1.2, 0, 6.28);
      ctx.arc(6, -46, 1.2, 0, 6.28);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 5. COLOSSAL TWO-HANDED EXECUTIONER DREADBLADE
    if (isSeated) {
      // Plunged vertically point-down between knees into stone dais
      this.drawWardenDreadblade(ctx, 0, 18, Math.PI, 0.95, { runeGlow: eyeAlpha });
      // Forearms resting on throne armrests
      ctx.fillStyle = '#2e0854';
      ctx.fillRect(-52, 6, 18, 10);
      ctx.fillRect(34, 6, 18, 10);
      // Spiked gauntlets gripping armrests
      ctx.fillStyle = '#7e22ce';
      ctx.fillRect(-54, 4, 8, 14);
      ctx.fillRect(46, 4, 8, 14);
    } else if (!options.weaponDropped) {
      // Held at ready angle in colossal spiked gauntlet
      ctx.save();
      ctx.translate(38, 2);
      ctx.rotate(0.25);
      this.drawWardenDreadblade(ctx, 0, -20, 0, 1.1, { runeGlow: eyeAlpha });
      ctx.restore();

      // Right arm & spiked gauntlet gripping hilt
      ctx.fillStyle = '#2e0854';
      ctx.fillRect(26, -14, 16, 20);
      ctx.fillStyle = '#7e22ce';
      ctx.fillRect(34, 0, 12, 10);
    } else {
      // Weapon dropped on stone floor
      this.drawWardenDreadblade(ctx, 52, 46, 1.52, 1.05, {
        floorShadow: true,
        runeGlow: Math.max(0, eyeAlpha * 0.4)
      });
    }

    ctx.restore(); // Restore torso
    ctx.restore(); // Restore root
  },

  drawGorgarothCleaver(ctx, x, y, angle = 0, scale = 1.0, options = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    // Floor drop shadow if fallen
    if (options.floorShadow) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.beginPath();
      ctx.ellipse(8, 8, 38, 14, 0, 0, 6.28);
      ctx.fill();
      ctx.restore();
    }

    // Heavy iron crossguard / collar
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-12, -38, 24, 7);
    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 1;
    ctx.strokeRect(-12, -38, 24, 7);

    // Cleaver Shaft / Hilt
    ctx.fillStyle = '#291b12';
    ctx.fillRect(-3, -31, 6, 26);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1;
    ctx.strokeRect(-3, -31, 6, 26);

    // Heavy iron spiked pommel
    ctx.fillStyle = '#44403c';
    ctx.beginPath();
    ctx.moveTo(0, -2); ctx.lineTo(6, -5); ctx.lineTo(0, -9); ctx.lineTo(-6, -5);
    ctx.closePath();
    ctx.fill();

    // Colossal Cleaver Blade (Obsidian steel with molten edge)
    const cleaverGrad = ctx.createLinearGradient(-12, -95, 24, -38);
    cleaverGrad.addColorStop(0, '#78716c');
    cleaverGrad.addColorStop(0.3, '#44403c');
    cleaverGrad.addColorStop(0.7, '#1c1917');
    cleaverGrad.addColorStop(1, '#0c0a09');
    ctx.fillStyle = cleaverGrad;

    ctx.beginPath();
    ctx.moveTo(-10, -96);
    ctx.lineTo(22, -96); // Top flat brutal edge
    ctx.lineTo(28, -38); // Slanted back edge
    ctx.lineTo(-12, -38); // Quillon base
    ctx.closePath();
    ctx.fill();

    // Serrated cutting notches
    ctx.fillStyle = '#0c0a09';
    ctx.beginPath();
    ctx.moveTo(22, -75); ctx.lineTo(14, -70); ctx.lineTo(24, -65); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(25, -55); ctx.lineTo(17, -50); ctx.lineTo(27, -45); ctx.fill();

    // Molten orange rune vein along blade
    const runeGlow = options.runeGlow !== undefined ? options.runeGlow : 1.0;
    if (runeGlow > 0.05) {
      ctx.strokeStyle = '#ea580c';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 14 * runeGlow;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(4, -92); ctx.lineTo(6, -42); ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Outer blade edge highlight
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────────
  // 4. GORGAROTH — THE IRON JAILER
  // ─────────────────────────────────────────────────────────────────
  drawGorgaroth(ctx, x, y, scale = 1.0, pose = 'idle', options = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const t = options.time || 0;
    const breathe = (pose === 'collapsed') ? 0 : Math.sin(t * 2.5) * 2.5;

    // Root rotation if staggered or collapsed
    if (pose === 'stagger') {
      ctx.rotate(-0.12);
    } else if (pose === 'collapsed') {
      ctx.rotate(1.38); // Fallen flat on stone floor
      ctx.translate(22, -18);
    }

    const torsoY = (pose === 'knee_fall') ? 16 : -14 + breathe;

    // 1. MASSIVE FORGED IRON LEGS, POLEYNS & CLAWED SABATONS
    if (pose === 'knee_fall') {
      // Right knee planted, left foot braced
      const legGradKnee = ctx.createLinearGradient(-26, torsoY + 24, 26, torsoY + 48);
      legGradKnee.addColorStop(0, '#57534e');
      legGradKnee.addColorStop(0.5, '#292524');
      legGradKnee.addColorStop(1, '#0c0a09');
      ctx.fillStyle = legGradKnee;

      ctx.beginPath();
      ctx.moveTo(-24, torsoY + 24); ctx.lineTo(-6, torsoY + 24); ctx.lineTo(-4, torsoY + 42); ctx.lineTo(-26, torsoY + 42);
      ctx.closePath();
      ctx.fill();

      ctx.fillRect(8, torsoY + 34, 24, 12);
      // Spiked poleyn
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(-26, torsoY + 36); ctx.lineTo(-12, torsoY + 32); ctx.lineTo(-4, torsoY + 36); ctx.fill();
      // Armored clawed sabaton toe
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(-28, torsoY + 40, 16, 8);
      ctx.fillRect(26, torsoY + 42, 18, 8);
    } else if (pose !== 'collapsed') {
      // Planted wide battle stance
      // Both legs with metallic forged gradients
      const drawLeg = (dir) => {
        ctx.save();
        ctx.scale(dir, 1);
        const legGrad = ctx.createLinearGradient(8, torsoY + 26, 32, torsoY + 62);
        legGrad.addColorStop(0, '#57534e');
        legGrad.addColorStop(0.35, '#292524');
        legGrad.addColorStop(1, '#0c0a09');
        ctx.fillStyle = legGrad;

        // Cuisse (Thigh)
        ctx.beginPath();
        ctx.moveTo(8, torsoY + 26);
        ctx.lineTo(28, torsoY + 26);
        ctx.lineTo(26, torsoY + 42);
        ctx.lineTo(10, torsoY + 42);
        ctx.closePath();
        ctx.fill();

        // Spiked Poleyn (Knee cop with protruding iron spike)
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.moveTo(6, torsoY + 40);
        ctx.lineTo(19, torsoY + 33);
        ctx.lineTo(32, torsoY + 40);
        ctx.lineTo(19, torsoY + 46);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.moveTo(15, torsoY + 37); ctx.lineTo(19, torsoY + 30); ctx.lineTo(23, torsoY + 37); ctx.fill();

        // Greave (Shin)
        ctx.fillStyle = legGrad;
        ctx.beginPath();
        ctx.moveTo(9, torsoY + 44);
        ctx.lineTo(27, torsoY + 44);
        ctx.lineTo(30, torsoY + 62);
        ctx.lineTo(7, torsoY + 62);
        ctx.closePath();
        ctx.fill();
        // Central forged ridge
        ctx.strokeStyle = '#78716c';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(18, torsoY + 44); ctx.lineTo(18, torsoY + 62); ctx.stroke();

        // Heavy clawed iron sabaton
        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.moveTo(4, torsoY + 62);
        ctx.lineTo(33, torsoY + 62);
        ctx.lineTo(36, torsoY + 70);
        ctx.lineTo(2, torsoY + 70);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#44403c';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      };
      drawLeg(-1); // Left leg
      drawLeg(1);  // Right leg
    }

    // 2. FORGED IRON FURNACE TORSO & CUIRASS
    ctx.save();
    // Beveled iron trapezoidal cuirass
    const cuirassGrad = ctx.createLinearGradient(-38, torsoY, 38, torsoY + 48);
    cuirassGrad.addColorStop(0, '#57534e');
    cuirassGrad.addColorStop(0.2, '#292524');
    cuirassGrad.addColorStop(0.65, '#1c1917');
    cuirassGrad.addColorStop(1, '#0c0a09');
    ctx.fillStyle = cuirassGrad;

    ctx.beginPath();
    ctx.moveTo(-38, torsoY + 2);
    ctx.lineTo(38, torsoY + 2);
    ctx.lineTo(28, torsoY + 44);
    ctx.lineTo(-28, torsoY + 44);
    ctx.closePath();
    ctx.fill();

    // Steel plate rim bevel highlights
    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-37, torsoY + 3);
    ctx.lineTo(0, torsoY + 3);
    ctx.lineTo(0, torsoY + 43);
    ctx.stroke();

    // Molten Iron Furnace Slats on Chest (Raging inner fire)
    for (let f = 0; f < 3; f++) {
      const fy = torsoY + 12 + f * 7;
      const fw = 32 - f * 4;
      ctx.save();
      ctx.fillStyle = '#0c0a09';
      ctx.fillRect(-fw / 2, fy, fw, 4.5);
      // Raging ember glow
      ctx.fillStyle = '#ea580c';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 14;
      ctx.fillRect(-fw / 2 + 2, fy + 1, fw - 4, 2.5);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-fw / 2 + 5, fy + 1.2, fw - 10, 1.4);
      ctx.restore();
    }

    // Heavy iron waist belt & fauld plates
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-28, torsoY + 40, 56, 7);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-6, torsoY + 39, 12, 9); // Iron buckle
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, torsoY + 43.5, 2.5, 0, 6.28);
    ctx.fill();

    // Heavy iron chains wrapped diagonally across chest
    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 1.6;
    for (let c = 0; c < 5; c++) {
      const cx1 = -24 + c * 10;
      const cy1 = torsoY + 6 + c * 7;
      ctx.strokeRect(cx1 - 2, cy1 - 2, 5, 4);
    }

    // 3-TIER SPIKED TITAN PAULDRONS (Shoulders)
    const drawPauldron = (dir) => {
      ctx.save();
      ctx.scale(dir, 1);
      for (let p = 0; p < 3; p++) {
        const px = 30 + p * 6;
        const py = torsoY - 8 + p * 8;
        const pGrad = ctx.createLinearGradient(px, py - 12, px + 18, py + 12);
        pGrad.addColorStop(0, '#57534e');
        pGrad.addColorStop(0.5, '#292524');
        pGrad.addColorStop(1, '#0c0a09');
        ctx.fillStyle = pGrad;

        ctx.beginPath();
        ctx.moveTo(px, py + 4);
        ctx.lineTo(px + 18, py - 12); // Spiked tip pointing outward-upward
        ctx.lineTo(px + 12, py + 12);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#78716c';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
    };
    drawPauldron(-1); // Left pauldron
    drawPauldron(1);  // Right pauldron

    // Armor fractures (when defeated or taking massive damage)
    if (options.crackedArmor) {
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2.4;
      ctx.shadowColor = '#ea580c';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(-16, torsoY + 8); ctx.lineTo(-4, torsoY + 20); ctx.lineTo(6, torsoY + 14); ctx.lineTo(18, torsoY + 34);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(12, torsoY + 4); ctx.lineTo(2, torsoY + 18); ctx.lineTo(-8, torsoY + 30);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    // 3. IRON FURNACE HELM WITH CURVED SWEEPING HORNS & GLOWING VISOR SLIT
    ctx.save();
    // Neck gorget
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-12, torsoY - 6, 24, 8);

    // Helmet dome (Iron Greathelm)
    const helmGrad = ctx.createRadialGradient(0, torsoY - 22, 4, 0, torsoY - 20, 24);
    helmGrad.addColorStop(0, '#78716c');
    helmGrad.addColorStop(0.4, '#44403c');
    helmGrad.addColorStop(0.85, '#1c1917');
    helmGrad.addColorStop(1, '#0c0a09');
    ctx.fillStyle = helmGrad;

    ctx.beginPath();
    ctx.moveTo(-18, torsoY - 8);
    ctx.lineTo(-20, torsoY - 26);
    ctx.lineTo(0, torsoY - 32);
    ctx.lineTo(20, torsoY - 26);
    ctx.lineTo(18, torsoY - 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#a8a29e';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Curved Jagged Horns jutting out and sweeping upward
    const hornGrad = ctx.createLinearGradient(0, torsoY - 24, 40, torsoY - 56);
    hornGrad.addColorStop(0, '#44403c');
    hornGrad.addColorStop(0.6, '#292524');
    hornGrad.addColorStop(1, '#0c0a09');
    ctx.fillStyle = hornGrad;

    // Left horn
    ctx.beginPath();
    ctx.moveTo(-18, torsoY - 24);
    ctx.bezierCurveTo(-34, torsoY - 28, -44, torsoY - 44, -38, torsoY - 54);
    ctx.bezierCurveTo(-32, torsoY - 42, -22, torsoY - 32, -14, torsoY - 28);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#78716c';
    ctx.stroke();

    // Right horn
    ctx.beginPath();
    ctx.moveTo(18, torsoY - 24);
    ctx.bezierCurveTo(34, torsoY - 28, 44, torsoY - 44, 38, torsoY - 54);
    ctx.bezierCurveTo(32, torsoY - 42, 22, torsoY - 32, 14, torsoY - 28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Furnace Visor Slit
    ctx.fillStyle = '#0c0a09';
    ctx.fillRect(-12, torsoY - 20, 24, 5.5);

    ctx.fillStyle = '#ea580c';
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 18;
    ctx.fillRect(-11, torsoY - 19, 22, 3.5);
    ctx.fillStyle = '#ffedd5';
    ctx.fillRect(-6, torsoY - 18, 12, 1.8);
    ctx.restore();

    // 4. COLOSSAL OBSIDIAN/IRON EXECUTIONER CLEAVER & ARMS
    if (pose === 'raise_weapon') {
      // Right arm raised overhead holding cleaver high
      ctx.save();
      ctx.translate(28, torsoY - 2);
      ctx.rotate(-0.35);

      // Muscular iron rerebrace & vambrace
      const armGrad = ctx.createLinearGradient(-8, -32, 12, 0);
      armGrad.addColorStop(0, '#57534e');
      armGrad.addColorStop(0.5, '#292524');
      armGrad.addColorStop(1, '#0c0a09');
      ctx.fillStyle = armGrad;
      ctx.fillRect(-7, -32, 14, 32);

      // Elbow spike
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(-7, -16); ctx.lineTo(-15, -16); ctx.lineTo(-7, -10); ctx.fill();

      // Articulated spiked gauntlet gripping hilt
      ctx.fillStyle = '#44403c';
      ctx.fillRect(-8, -36, 16, 7);

      // Colossal Cleaver raised overhead
      this.drawGorgarothCleaver(ctx, 0, 0, 0, 1.0);

      ctx.restore();
    } else if (!options.weaponDropped && pose !== 'collapsed') {
      // Cleaver held at ready
      ctx.save();
      // Arm & spiked gauntlet reaching down to grip hilt
      ctx.fillStyle = '#292524';
      ctx.fillRect(24, torsoY + 6, 14, 20);
      ctx.fillStyle = '#44403c';
      ctx.fillRect(30, torsoY + 22, 12, 10);
      // Cleaver blade
      this.drawGorgarothCleaver(ctx, 36, torsoY + 32, 0.22, 0.95);
      ctx.restore();
    } else if (options.weaponDropped || pose === 'collapsed') {
      // Cleaver lies fallen on stone floor
      this.drawGorgarothCleaver(ctx, 48, torsoY + 44, 1.54, 0.95, {
        floorShadow: true,
        runeGlow: 0.4
      });
    }

    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────────
  // 5. MALAKOR — THE VOID WEAVER
  // ─────────────────────────────────────────────────────────────────
  drawMalakor(ctx, x, y, scale = 1.0, pose = 'idle', options = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const t = options.time || 0;
    const floatBob = Math.sin(t * 3.0) * 6;
    const alpha = options.alpha !== undefined ? options.alpha : 1.0;
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    // Dissolve effect when defeated
    if (options.dissolving) {
      const diss = options.dissolveProgress || 0.5;
      ctx.save();
      for (let p = 0; p < 28; p++) {
        const ang = (p / 28) * Math.PI * 2 + diss * 4;
        const dist = 10 + diss * 85;
        ctx.fillStyle = p % 2 === 0 ? '#c084fc' : '#581c87';
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * dist, Math.sin(ang) * dist * 0.6, 2 + Math.random() * 3, 0, 6.28);
        ctx.fill();
      }
      ctx.restore();
    }

    // 1. FLOATING ETHEREAL COSMIC ROBES (Layered with astrological hem trim)
    const robeGrad = ctx.createLinearGradient(0, -35, 0, 52);
    robeGrad.addColorStop(0, options.isCopy ? 'rgba(168, 85, 247, 0.4)' : '#581c87');
    robeGrad.addColorStop(0.4, options.isCopy ? 'rgba(88, 28, 135, 0.35)' : '#3b0764');
    robeGrad.addColorStop(0.8, options.isCopy ? 'rgba(23, 6, 46, 0.25)' : '#17062e');
    robeGrad.addColorStop(1, options.isCopy ? 'rgba(10, 2, 20, 0.15)' : '#070110');
    ctx.fillStyle = robeGrad;

    // Billowing flared robe body
    const billowL = Math.sin(t * 3.5) * 4;
    const billowR = Math.cos(t * 3.5) * 4;
    ctx.beginPath();
    ctx.moveTo(-18, -25 + floatBob);
    ctx.bezierCurveTo(-32 + billowL, 10, -34 + billowL, 35, -24, 54);
    ctx.bezierCurveTo(-6, 47, 6, 47, 24, 54);
    ctx.bezierCurveTo(34 + billowR, 35, 32 + billowR, 10, 18, -25 + floatBob);
    ctx.closePath();
    ctx.fill();

    // Robe golden astrological hem trim
    ctx.strokeStyle = options.isCopy ? 'rgba(192, 132, 252, 0.5)' : '#fde68a';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // Flared Tattered Sleeves (Left & Right)
    const drawSleeve = (dir) => {
      ctx.save();
      ctx.scale(dir, 1);
      ctx.fillStyle = '#2e0854';
      ctx.beginPath();
      ctx.moveTo(14, -20 + floatBob);
      ctx.quadraticCurveTo(34, -5 + floatBob, 42, 22 + floatBob);
      ctx.lineTo(26, 26 + floatBob);
      ctx.quadraticCurveTo(22, 0 + floatBob, 12, -8 + floatBob);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    };
    drawSleeve(-1);
    drawSleeve(1);

    // 2. DEEP OCCULT COWL HOOD & DRAPED MANTLE
    const cowlGrad = ctx.createLinearGradient(0, -56 + floatBob, 0, -20 + floatBob);
    cowlGrad.addColorStop(0, '#2e0854');
    cowlGrad.addColorStop(0.5, '#130224');
    cowlGrad.addColorStop(1, '#05010a');
    ctx.fillStyle = cowlGrad;

    ctx.beginPath();
    ctx.moveTo(0, -56 + floatBob); // Pointed peaked hood
    ctx.bezierCurveTo(18, -48 + floatBob, 22, -32 + floatBob, 16, -18 + floatBob);
    ctx.lineTo(-16, -18 + floatBob);
    ctx.bezierCurveTo(-22, -32 + floatBob, -18, -48 + floatBob, 0, -56 + floatBob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Shadowed hood interior
    ctx.fillStyle = '#020005';
    ctx.beginPath();
    ctx.ellipse(0, -34 + floatBob, 12, 14, 0, 0, 6.28);
    ctx.fill();

    // 3. CRACKED PORCELAIN VOID MASK
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(0, -45 + floatBob);
    ctx.lineTo(8, -38 + floatBob);
    ctx.lineTo(6, -26 + floatBob);
    ctx.lineTo(0, -22 + floatBob);
    ctx.lineTo(-6, -26 + floatBob);
    ctx.lineTo(-8, -38 + floatBob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Mask Occult Fractures & Cracks
    ctx.strokeStyle = '#581c87';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(2, -42 + floatBob); ctx.lineTo(-1, -34 + floatBob); ctx.lineTo(3, -28 + floatBob);
    ctx.stroke();

    // Luminous Narrow Violet Eye Slits
    const eyeAlpha = options.eyeGlow !== undefined ? options.eyeGlow : 1.0;
    if (eyeAlpha > 0.05) {
      ctx.fillStyle = `rgba(192, 132, 252, ${eyeAlpha})`;
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 14 * eyeAlpha;
      ctx.beginPath();
      ctx.ellipse(-3.5, -34 + floatBob, 2.0, 3.2, -0.15, 0, 6.28);
      ctx.ellipse(3.5, -34 + floatBob, 2.0, 3.2, 0.15, 0, 6.28);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 4. ORBITING 3D ASTRAL RUNE RINGS (Tilted elliptical orbits with runes)
    if (!options.isCopy && !options.dissolving) {
      ctx.save();
      ctx.translate(0, -6 + floatBob);

      // Ring 1 (Tilted orbit)
      ctx.save();
      ctx.rotate(0.35);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, 44, 18, 0, 0, 6.28);
      ctx.stroke();

      // Orbiting Catalyst 1
      const ang1 = t * 2.4;
      const ox1 = Math.cos(ang1) * 44;
      const oy1 = Math.sin(ang1) * 18;
      ctx.fillStyle = '#e9d5ff';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(ox1, oy1, 3.5, 0, 6.28);
      ctx.fill();
      ctx.restore();

      // Ring 2 (Opposite tilt orbit)
      ctx.save();
      ctx.rotate(-0.4);
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 52, 20, 0, 0, 6.28);
      ctx.stroke();

      // Orbiting Catalyst 2
      const ang2 = -t * 2.0 + 2.0;
      const ox2 = Math.cos(ang2) * 52;
      const oy2 = Math.sin(ang2) * 20;
      ctx.fillStyle = '#c084fc';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(ox2, oy2, 3.2, 0, 6.28);
      ctx.fill();
      ctx.restore();

      ctx.restore();
    }

    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────────
  // 6. CITADEL GUARD — ARMORED HALBERDIERS
  // ─────────────────────────────────────────────────────────────────
  drawGuard(ctx, x, y, scale = 1.0, options = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const t = options.time || 0;
    const marchBob = Math.sin(t * 3.5 + (options.phase || 0)) * 1.5;

    // 1. Billowing Citadel Halberdier Cloak (Deep crimson / charcoal)
    ctx.save();
    const cloakGrad = ctx.createLinearGradient(0, -20, 0, 36);
    cloakGrad.addColorStop(0, '#581c1c');
    cloakGrad.addColorStop(0.5, '#2e0a0a');
    cloakGrad.addColorStop(1, '#0f0202');
    ctx.fillStyle = cloakGrad;

    const cloakFlutter = Math.sin(t * 2.8 + (options.phase || 0)) * 3;
    ctx.beginPath();
    ctx.moveTo(-11, -16 + marchBob);
    ctx.quadraticCurveTo(-24 + cloakFlutter, 6, -18 + cloakFlutter, 34);
    ctx.lineTo(16 + cloakFlutter, 34);
    ctx.quadraticCurveTo(20 + cloakFlutter, 6, 11, -16 + marchBob);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 2. Articulated Legs: Cuisses, Winged Poleyns, Greaves & Sabatons
    const drawLeg = (dir) => {
      ctx.save();
      ctx.scale(dir, 1);
      const legGrad = ctx.createLinearGradient(0, 10, 0, 32);
      legGrad.addColorStop(0, '#64748b');
      legGrad.addColorStop(0.5, '#334155');
      legGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = legGrad;

      // Cuisse (Thigh plate)
      ctx.beginPath();
      ctx.moveTo(2, 11);
      ctx.lineTo(8, 11);
      ctx.lineTo(7, 18);
      ctx.lineTo(2, 18);
      ctx.closePath();
      ctx.fill();

      // Winged Poleyn (Heart-shaped knee cop with outer protective wing)
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(1, 18);
      ctx.lineTo(8, 18);
      ctx.lineTo(10, 21); // Outer wing
      ctx.lineTo(5, 23);  // Apex
      ctx.lineTo(1, 21);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Shin Greave (Contoured calf plate with front ridge)
      ctx.fillStyle = legGrad;
      ctx.beginPath();
      ctx.moveTo(2, 23);
      ctx.lineTo(8, 23);
      ctx.lineTo(7, 30);
      ctx.lineTo(2.5, 30);
      ctx.closePath();
      ctx.fill();

      // Steel center ridge highlight
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(5, 23); ctx.lineTo(5, 30);
      ctx.stroke();

      // Segmented Pointed Sabaton
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(2, 30);
      ctx.lineTo(7.5, 30);
      ctx.lineTo(9.5, 34);
      ctx.lineTo(1, 34);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    drawLeg(-1);
    drawLeg(1);

    // 3. Gothic Cuirass, Faulds & Hanging Tassets (Torso)
    const cuirassGrad = ctx.createLinearGradient(-12, -18, 12, 16);
    cuirassGrad.addColorStop(0, '#94a3b8');
    cuirassGrad.addColorStop(0.3, '#64748b');
    cuirassGrad.addColorStop(0.7, '#334155');
    cuirassGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = cuirassGrad;

    // Muscular fluted breastplate
    ctx.beginPath();
    ctx.moveTo(-12, -16 + marchBob);
    ctx.lineTo(12, -16 + marchBob);
    ctx.lineTo(9, 6 + marchBob);
    ctx.lineTo(-9, 6 + marchBob);
    ctx.closePath();
    ctx.fill();

    // Central keel / ridge highlight on breastplate
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -16 + marchBob);
    ctx.lineTo(0, 6 + marchBob);
    ctx.stroke();

    // Segmented Faulds (Hips) & Hanging Pointed Tassets
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-10, 6 + marchBob);
    ctx.lineTo(10, 6 + marchBob);
    ctx.lineTo(11, 11 + marchBob);
    ctx.lineTo(-11, 11 + marchBob);
    ctx.closePath();
    ctx.fill();

    // Tasset plates over thighs
    const drawTasset = (tx) => {
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(tx - 3.5, 11 + marchBob);
      ctx.lineTo(tx + 3.5, 11 + marchBob);
      ctx.lineTo(tx + 2.5, 17 + marchBob);
      ctx.lineTo(tx, 19 + marchBob); // Pointed tip
      ctx.lineTo(tx - 2.5, 17 + marchBob);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 0.7;
      ctx.stroke();
    };
    drawTasset(-5.5);
    drawTasset(5.5);

    // 4. Layered 3-Piece Pauldrons (Shoulders)
    const drawPauldron = (dir) => {
      ctx.save();
      ctx.scale(dir, 1);
      for (let p = 0; p < 3; p++) {
        const py = -16 + p * 3.5 + marchBob;
        const pGrad = ctx.createLinearGradient(10, py, 16, py + 6);
        pGrad.addColorStop(0, '#94a3b8');
        pGrad.addColorStop(0.5, '#475569');
        pGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = pGrad;

        ctx.beginPath();
        ctx.moveTo(9, py);
        ctx.lineTo(16, py + 1);
        ctx.lineTo(15, py + 5);
        ctx.lineTo(8, py + 4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
      ctx.restore();
    };
    drawPauldron(-1);
    drawPauldron(1);

    // 5. Bascinet / Sallet Helmet with Pointed Dome, Visor & Crest
    const helmGrad = ctx.createLinearGradient(-10, -34, 10, -14);
    helmGrad.addColorStop(0, '#cbd5e1');
    helmGrad.addColorStop(0.4, '#64748b');
    helmGrad.addColorStop(0.8, '#334155');
    helmGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = helmGrad;

    ctx.beginPath();
    ctx.moveTo(0, -34 + marchBob); // Peaked dome crest
    ctx.bezierCurveTo(9, -32 + marchBob, 10, -22 + marchBob, 8, -14 + marchBob);
    ctx.lineTo(-8, -14 + marchBob);
    ctx.bezierCurveTo(-10, -22 + marchBob, -9, -32 + marchBob, 0, -34 + marchBob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Steel Visor Band & Narrow Eye Slits
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-8, -23 + marchBob);
    ctx.lineTo(8, -23 + marchBob);
    ctx.lineTo(7.5, -18 + marchBob);
    ctx.lineTo(-7.5, -18 + marchBob);
    ctx.closePath();
    ctx.fill();

    // Dark Ocularium (Eye slits)
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.moveTo(-6, -21.5 + marchBob); ctx.lineTo(-1, -21.5 + marchBob);
    ctx.lineTo(-1, -20 + marchBob); ctx.lineTo(-6, -20 + marchBob);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(1, -21.5 + marchBob); ctx.lineTo(6, -21.5 + marchBob);
    ctx.lineTo(6, -20 + marchBob); ctx.lineTo(1, -20 + marchBob);
    ctx.closePath();
    ctx.fill();

    // Crimson Plume Feather trailing back from helmet apex
    ctx.save();
    const plumeGrad = ctx.createLinearGradient(0, -35, -8, -43);
    plumeGrad.addColorStop(0, '#dc2626');
    plumeGrad.addColorStop(0.6, '#991b1b');
    plumeGrad.addColorStop(1, '#450a0a');
    ctx.fillStyle = plumeGrad;
    const plumeFlutter = Math.sin(t * 4.5 + (options.phase || 0)) * 2;
    ctx.beginPath();
    ctx.moveTo(0, -33 + marchBob);
    ctx.quadraticCurveTo(-6 + plumeFlutter, -39 + marchBob, -12 + plumeFlutter, -43 + marchBob);
    ctx.quadraticCurveTo(-4, -36 + marchBob, 0, -31 + marchBob);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 6. Citadel Tower Kite Shield (Curved rim, iron boss, gold & crimson chevron)
    ctx.save();
    ctx.translate(-14, 1 + marchBob);
    ctx.rotate(-0.06);

    const shieldGrad = ctx.createLinearGradient(-12, -16, 10, 24);
    shieldGrad.addColorStop(0, '#1e293b');
    shieldGrad.addColorStop(0.6, '#0f172a');
    shieldGrad.addColorStop(1, '#020617');
    ctx.fillStyle = shieldGrad;

    ctx.beginPath();
    ctx.moveTo(-11, -15);
    ctx.lineTo(9, -15);
    ctx.lineTo(8, 11);
    ctx.lineTo(-1, 26); // Pointed base
    ctx.lineTo(-10, 11);
    ctx.closePath();
    ctx.fill();

    // Shield riveted brass border
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // Crimson Heraldic Citadel Chevron
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(-1, -12);
    ctx.lineTo(7, -4);
    ctx.lineTo(7, 2);
    ctx.lineTo(-1, -6);
    ctx.lineTo(-9, 2);
    ctx.lineTo(-9, -4);
    ctx.closePath();
    ctx.fill();

    // Central Steel Umbo / Shield Boss
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(-1, 2, 3.5, 0, 6.28);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();

    // 7. Citadel Ceremonial Halberd (Octagonal ash pole, langets, crescent axe & top spike)
    ctx.save();
    ctx.translate(12, -7 + marchBob);

    // Ash Wood Pole with fluted langets
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.moveTo(-1.8, -46); ctx.lineTo(1.8, -46);
    ctx.lineTo(1.8, 28); ctx.lineTo(-1.8, 28);
    ctx.closePath();
    ctx.fill();

    // Steel langets (Protective metal strips on pole)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-1.6, -42); ctx.lineTo(-1.6, -20);
    ctx.moveTo(1.6, -42); ctx.lineTo(1.6, -20);
    ctx.stroke();

    // Diamond Cross-Section Top Armor Spike
    const spikeGrad = ctx.createLinearGradient(-3, -56, 3, -45);
    spikeGrad.addColorStop(0, '#f8fafc');
    spikeGrad.addColorStop(0.5, '#cbd5e1');
    spikeGrad.addColorStop(1, '#64748b');
    ctx.fillStyle = spikeGrad;
    ctx.beginPath();
    ctx.moveTo(0, -56);   // Top tip
    ctx.lineTo(3.2, -45);
    ctx.lineTo(0, -43);
    ctx.lineTo(-3.2, -45);
    ctx.closePath();
    ctx.fill();

    // Crescent Axe Blade with beveled cutting edge
    const axeGrad = ctx.createLinearGradient(1.5, -45, 18, -32);
    axeGrad.addColorStop(0, '#64748b');
    axeGrad.addColorStop(0.5, '#cbd5e1');
    axeGrad.addColorStop(1, '#f8fafc');
    ctx.fillStyle = axeGrad;

    ctx.beginPath();
    ctx.moveTo(1.8, -45);
    ctx.quadraticCurveTo(19, -39, 15, -27); // Swept crescent edge
    ctx.lineTo(1.8, -32);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Rear Armor-Piercing Fluke Claw
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(-1.8, -40);
    ctx.lineTo(-9, -36);
    ctx.lineTo(-1.8, -33);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    ctx.restore();

    ctx.restore();
  }
};

if (typeof window !== 'undefined') {
  window.CinematicCharacterRenderer = CinematicCharacterRenderer;
}
