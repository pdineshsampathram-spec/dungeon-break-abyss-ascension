// =====================================================================
//  DUNGEON BREAK — js/cinematics/MainMenuScene.js
//  "The Threshold of the Abyss" — Handcrafted Pixel-Art Masterpiece
//  Art Direction: Inspired by high-end indie title screens (Arco, Hyper Light Drifter)
//  - Monumental shattered cyclopean citadel rising from a bottomless subterranean chasm
//  - Vast atmospheric depth with distant viaducts, titanic basalt spires, and sagging chains
//  - Integrated Supernatural Gateway recessed within fractured ancient architecture
//  - Dramatic cantilevered foreground promontory with weathered flagstones and ancient brazier
//  - Lord Rowan in heroic vigil on the precipice, establishing epic scale
//  - Dual-source Chiaroscuro: Warm amber firelight vs. cool violet/cyan abyssal gateway glow
//  - Multi-speed coordinated atmospheric motion (mist, orbital arcs, embers, motes)
// =====================================================================

import { LW, LH } from '../core/Constants.js';
import { GameState } from '../core/GameState.js';
import { SaveSystem } from '../systems/SaveSystem.js';

let _bgImage = null;
let _bgLoaded = false;

function getBackgroundImage() {
  if (!_bgImage && typeof Image !== 'undefined') {
    _bgImage = new Image();
    _bgImage.onload = () => {
      _bgLoaded = true;
    };
    _bgImage.src = 'assets/menu/abyss_threshold_bg.png?v=4.0';
  }
  return _bgLoaded ? _bgImage : null;
}

export const MainMenuScene = {
  initialized: false,
  lastDrawFrame: -1,

  // Environmental particle systems
  chasmMotes: [],
  portalAccretion: [],
  brazierEmbers: [],
  deepFogLayers: [],

  // Coordinated gateway & atmospheric mechanics
  outerDialAngle: 0,
  midArcAngle: 0,
  innerSingularityAngle: 0,
  sceneTime: 0,

  init() {
    this.chasmMotes = [];
    this.portalAccretion = [];
    this.brazierEmbers = [];
    this.deepFogLayers = [];

    // Ambient subterranean dust and ethereal abyss soul motes
    for (let i = 0; i < 48; i++) {
      this.chasmMotes.push({
        x: Math.random() * LW,
        y: Math.random() * LH,
        vx: (Math.random() - 0.5) * 0.22,
        vy: -0.15 - Math.random() * 0.35,
        size: Math.random() < 0.75 ? 1 : 2,
        alpha: 0.18 + Math.random() * 0.45,
        type: Math.random() < 0.6 ? 'dust' : 'soul',
        phase: Math.random() * Math.PI * 2
      });
    }

    // Portal accretion particles spiraling inward to singularity (radius 14 to 58)
    for (let i = 0; i < 28; i++) {
      this.portalAccretion.push({
        dist: 14 + Math.random() * 46,
        angle: Math.random() * Math.PI * 2,
        speed: 0.28 + Math.random() * 0.55,
        rotSpeed: 0.015 + Math.random() * 0.025,
        size: Math.random() < 0.65 ? 1 : 1.5,
        alpha: 0.25 + Math.random() * 0.65,
        col: Math.random() < 0.55 ? '#38bdf8' : '#c084fc'
      });
    }

    // Multi-layered rolling abyssal mist across bottom chasm
    for (let i = 0; i < 16; i++) {
      this.deepFogLayers.push({
        x: Math.random() * (LW + 300) - 150,
        y: LH - 130 + Math.random() * 110,
        vx: 0.08 + Math.random() * 0.15,
        r: 75 + Math.random() * 85,
        alpha: 0.15 + Math.random() * 0.22,
        phase: Math.random() * Math.PI * 2
      });
    }

    // Trigger preloading of masterwork background
    getBackgroundImage();

    this.initialized = true;
  },

  tick(dt = 0.016) {
    if (!this.initialized) this.init();

    const isReducedMotion = (typeof GameState !== 'undefined' && GameState.REDUCED_MOTION) ||
      (typeof SaveSystem !== 'undefined' && SaveSystem.getSettings && SaveSystem.getSettings().reducedMotion);

    this.sceneTime += dt;

    if (!isReducedMotion) {
      // Coordinated astronomical portal rotations
      this.outerDialAngle += dt * 0.08;         // Clockwise ancient stone ring (~0.08 rad/s)
      this.midArcAngle -= dt * 0.16;            // Counter-clockwise plasma arc ring (~0.16 rad/s)
      this.innerSingularityAngle += dt * 0.32;  // Inner singularity core spin (~0.32 rad/s)

      // Subterranean dust & soul motes
      this.chasmMotes.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = LW + 10;
        if (p.x > LW + 10) p.x = -10;
        if (p.y < -10) {
          p.y = LH + 10;
          p.x = Math.random() * LW;
        }
      });

      // Portal accretion motes spiraling inward
      this.portalAccretion.forEach(p => {
        p.dist -= p.speed * (dt * 60);
        p.angle += p.rotSpeed * (dt * 60);
        if (p.dist < 6) {
          p.dist = 52 + Math.random() * 12;
          p.angle = Math.random() * Math.PI * 2;
        }
      });

      // Brazier embers spawning at x: 382, y: 485
      if (Math.random() < 0.6) {
        this.brazierEmbers.push({
          x: 382 + (Math.random() - 0.5) * 12,
          y: 485 + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.45) * 0.7,
          vy: -0.7 - Math.random() * 1.3,
          life: 1.0,
          decay: 0.35 + Math.random() * 0.45,
          size: Math.random() < 0.7 ? 1.0 : 1.8,
          col: Math.random() < 0.65 ? '#fde68a' : '#f97316'
        });
      }

      this.brazierEmbers.forEach(s => {
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.008; // upward thermal resistance
        s.life -= dt * s.decay;
      });
      this.brazierEmbers = this.brazierEmbers.filter(s => s.life > 0);

      // Rolling abyssal ground fog drift
      this.deepFogLayers.forEach(b => {
        b.x += (b.vx * 1.3) * (dt * 60);
        if (b.x > LW + b.r) b.x = -b.r;
      });
    }
  },

  draw(ctx, dt = 0.016) {
    if (!this.initialized) this.init();
    const F = GameState.F || 0;

    if (this.lastDrawFrame !== F) {
      this.tick(GameState.DT || dt || 0.016);
      this.lastDrawFrame = F;
    }

    const isReducedMotion = (typeof GameState !== 'undefined' && GameState.REDUCED_MOTION) ||
      (typeof SaveSystem !== 'undefined' && SaveSystem.getSettings && SaveSystem.getSettings().reducedMotion);

    // Subtle, restrained cinematic camera breathing (stable & grounded)
    const camDriftX = isReducedMotion ? 0 : Math.sin(F * 0.012) * 2.5;
    const camDriftY = isReducedMotion ? 0 : Math.cos(F * 0.015) * 1.6;

    ctx.save();

    // =========================================================================
    // LAYER 1: HANDCRAFTED PIXEL-ART MASTERWORK ILLUSTRATION
    // "The Threshold of the Abyss"
    // =========================================================================
    const bgImg = getBackgroundImage();

    const imgScale = Math.max(LH / 768, LW / 1600);
    const renderW = Math.round(1600 * imgScale);
    const renderH = Math.round(768 * imgScale);
    // Align background so gate opening remains visible on the right side with ample room for menu on the left
    const bgOffsetX = Math.round(Math.min(0, Math.max(LW - renderW, (LW - renderW) * 0.7)) + camDriftX * 0.15);
    const bgOffsetY = Math.round((LH - renderH) / 2 + camDriftY * 0.15);

    if (bgImg) {
      ctx.imageSmoothingEnabled = false; // Preserve crisp pixel-art rendering!
      ctx.drawImage(bgImg, bgOffsetX, bgOffsetY, renderW, renderH);
    } else {
      // Instant procedural fallback before image finishes loading
      const skyGrad = ctx.createLinearGradient(0, 0, 0, LH);
      skyGrad.addColorStop(0, '#020308');
      skyGrad.addColorStop(0.3, '#040715');
      skyGrad.addColorStop(0.6, '#070c24');
      skyGrad.addColorStop(1, '#010206');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, LW, LH);
    }

    // =========================================================================
    // LAYER 2: LIVE SUPERNATURAL GATEWAY ENERGY & ACCRETION MECHANICS
    // Perfectly centered within the architectural gateway opening (bgX: 1122, bgY: 331)
    // =========================================================================
    const gateX = Math.round(bgOffsetX + 1122 * imgScale);
    const gateY = Math.round(bgOffsetY + 331 * imgScale);
    const portR = 72 + (isReducedMotion ? 0 : Math.sin(F * 0.04) * 1.8);

    ctx.save();
    ctx.translate(gateX, gateY);

    // 1. Volumetric Ethereal Radiance Pulse
    const gatePulse = isReducedMotion ? 0.85 : Math.sin(F * 0.045) * 0.15 + 0.85;
    const auraGrad = ctx.createRadialGradient(0, 0, portR * 0.2, 0, 0, portR * 2.1);
    auraGrad.addColorStop(0, `rgba(56, 189, 248, ${0.30 * gatePulse})`);
    auraGrad.addColorStop(0.35, `rgba(168, 85, 247, ${0.22 * gatePulse})`);
    auraGrad.addColorStop(0.75, `rgba(15, 23, 62, ${0.08 * gatePulse})`);
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, portR * 2.1, 0, Math.PI * 2);
    ctx.fill();

    // 2. Rotating Ancient Stone Dial Ring (Outer Segmented Ring)
    ctx.save();
    ctx.rotate(this.outerDialAngle);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 2.0;
    for (let s = 0; s < 4; s++) {
      const segStart = (s / 4) * Math.PI * 2 + 0.15;
      const segEnd = ((s + 1) / 4) * Math.PI * 2 - 0.25;
      ctx.beginPath();
      ctx.arc(0, 0, portR, segStart, segEnd);
      ctx.stroke();
    }
    // Dial celestial tick nodes
    for (let t = 0; t < 8; t++) {
      const tang = (t / 8) * Math.PI * 2;
      const cosT = Math.cos(tang), sinT = Math.sin(tang);
      ctx.fillStyle = (t % 2 === 0) ? '#fde68a' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(cosT * portR, sinT * portR, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. Counter-Clockwise Plasma Arc Ring (Middle Ethereal Arcs)
    ctx.save();
    ctx.rotate(this.midArcAngle);
    const midR = portR * 0.72;

    ctx.strokeStyle = 'rgba(192, 132, 252, 0.85)';
    ctx.lineWidth = 2.2;
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 8;
    for (let a = 0; a < 3; a++) {
      const arcStart = (a / 3) * Math.PI * 2;
      const arcEnd = arcStart + (Math.PI * 2 / 3) * 0.65;
      ctx.beginPath();
      ctx.arc(0, 0, midR, arcStart, arcEnd);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Glowing runic nodes along plasma ring
    for (let g = 0; g < 6; g++) {
      const gang = (g / 6) * Math.PI * 2;
      const gx = Math.cos(gang) * midR;
      const gy = Math.sin(gang) * midR;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(gx, gy, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    // 4. Inward Accretion Particles
    this.portalAccretion.forEach(pm => {
      const px = Math.cos(pm.angle) * pm.dist;
      const py = Math.sin(pm.angle) * pm.dist;
      const alphaFade = Math.min(1, pm.dist / 14) * pm.alpha;
      ctx.fillStyle = pm.col;
      ctx.globalAlpha = alphaFade;
      ctx.beginPath();
      ctx.arc(px, py, pm.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // 5. Inner Gravitational Singularity Core (Lightless Void Event Horizon)
    ctx.save();
    ctx.rotate(this.innerSingularityAngle);
    const innerR = portR * 0.48;
    const wispGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, innerR);
    wispGrad.addColorStop(0, 'rgba(56, 189, 248, 0.85)');
    wispGrad.addColorStop(0.6, 'rgba(147, 51, 234, 0.50)');
    wispGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.strokeStyle = wispGrad;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, innerR, 0, Math.PI * 1.7);
    ctx.stroke();
    ctx.restore();

    // Core Singularity Event Horizon - Luminous Cosmic Core
    const singR = portR * 0.36;
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, singR);
    coreGrad.addColorStop(0, 'rgba(240, 249, 255, 0.90)');
    coreGrad.addColorStop(0.35, 'rgba(192, 132, 252, 0.65)');
    coreGrad.addColorStop(0.75, 'rgba(56, 189, 248, 0.35)');
    coreGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, singR, 0, Math.PI * 2);
    ctx.fill();

    // Fine ethereal boundary ring around singularity
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Singularity central energy spark
    const sparkPulse = isReducedMotion ? 0.75 : Math.sin(F * 0.08) * 0.25 + 0.75;
    ctx.fillStyle = `rgba(224, 242, 254, ${sparkPulse})`;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 2.4 * sparkPulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore(); // restore gateway layer

    // =========================================================================
    // LAYER 3: FOREGROUND PROMONTORY LIVING LIGHTING & BRAZIER
    // Warm Amber Light Source for rich Chiaroscuro contrast
    // Anchored firmly to promontory ledge geometry (image coords: 568, 582)
    // =========================================================================
    const pX3 = camDriftX * 0.65;
    const pY3 = camDriftY * 0.65;
    const sceneScale = imgScale / (640 / 768);

    const brzX = Math.round(bgOffsetX + 568 * imgScale + pX3);
    const brzY = Math.round(bgOffsetY + 582 * imgScale + pY3);
    const flameFlicker = isReducedMotion ? 0.9 : (Math.sin(F * 0.16) * 0.12 + Math.cos(F * 0.28) * 0.08 + 0.88);

    ctx.save();

    // Warm Amber Radial Flame Wash across promontory flagstones
    const flameR = 175 * flameFlicker * Math.max(0.75, sceneScale);
    const flameWash = ctx.createRadialGradient(brzX, brzY - 8 * sceneScale, 4, brzX, brzY - 8 * sceneScale, flameR);
    flameWash.addColorStop(0, 'rgba(254, 240, 138, 0.40)');
    flameWash.addColorStop(0.25, 'rgba(249, 115, 22, 0.20)');
    flameWash.addColorStop(0.65, 'rgba(180, 83, 9, 0.06)');
    flameWash.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = flameWash;
    ctx.beginPath();
    ctx.arc(brzX, brzY - 8 * sceneScale, flameR, 0, Math.PI * 2);
    ctx.fill();

    // Forged Iron Tripod Legs
    ctx.strokeStyle = '#0e1526';
    ctx.lineWidth = 2.2 * sceneScale;
    ctx.beginPath();
    ctx.moveTo(brzX - 9 * sceneScale, brzY + 20 * sceneScale); ctx.lineTo(brzX - 3 * sceneScale, brzY + 5 * sceneScale); ctx.lineTo(brzX, brzY);
    ctx.moveTo(brzX + 9 * sceneScale, brzY + 20 * sceneScale); ctx.lineTo(brzX + 3 * sceneScale, brzY + 5 * sceneScale); ctx.lineTo(brzX, brzY);
    ctx.moveTo(brzX, brzY + 22 * sceneScale); ctx.lineTo(brzX, brzY);
    ctx.stroke();

    // Bronze Brazier Fire Bowl
    ctx.fillStyle = '#221610';
    ctx.beginPath();
    ctx.ellipse(brzX, brzY, 11 * sceneScale, 4.5 * sceneScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.75)';
    ctx.lineWidth = 1.0 * sceneScale;
    ctx.stroke();

    // Glowing Red Coals inside bowl
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.ellipse(brzX, brzY - 1 * sceneScale, 8 * sceneScale, 2.8 * sceneScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Living Pixel-Art Fire Flame
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(brzX, brzY - 10 * sceneScale, 6.0 * flameFlicker * sceneScale, 11.5 * flameFlicker * sceneScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(brzX, brzY - 9 * sceneScale, 4.2 * flameFlicker * sceneScale, 8.2 * flameFlicker * sceneScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(brzX, brzY - 7 * sceneScale, 2.4 * flameFlicker * sceneScale, 5.0 * flameFlicker * sceneScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(brzX, brzY - 5 * sceneScale, 1.2 * flameFlicker * sceneScale, 2.4 * flameFlicker * sceneScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rising Brazier Embers
    this.brazierEmbers.forEach(s => {
      ctx.save();
      ctx.globalAlpha = s.life * 0.9;
      ctx.fillStyle = s.col;
      ctx.shadowColor = s.col;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(s.x + pX3 * 0.5, s.y + pY3, s.size * s.life * sceneScale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.restore();

    // =========================================================================
    // LAYER 4: LORD ROWAN IN HEROIC VIGIL (PARALLAX 0.75X)
    // Anchored firmly on the promontory ledge, gazing at the distant Gateway
    // Geometry coordinates: bgX: 892, bgY: 542 (feet grounded at cliff edge)
    // =========================================================================
    const pX4 = camDriftX * 0.75;
    const pY4 = camDriftY * 0.75;

    const rX = Math.round(bgOffsetX + 892 * imgScale + pX4);
    const rY = Math.round(bgOffsetY + 542 * imgScale + pY4);
    const rScale = 1.65 * sceneScale;

    ctx.save();
    ctx.translate(rX, rY);
    ctx.scale(rScale, rScale);

    // Directional Ground Cast Shadow extending toward the chasm
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.beginPath();
    ctx.ellipse(6, 20, 22, 6.5, 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Idle Breathing & Cloak Flutter
    const rBreath = isReducedMotion ? 0 : Math.sin(F * 0.038) * 1.2;
    const rCloakSway = isReducedMotion ? 0 : Math.sin(F * 0.032) * 2.8;

    // ─────────────────────────────────────────────────────────────────────────
    // FLOWING CRIMSON CLOAK (Catching the chasm draft toward the left)
    // ─────────────────────────────────────────────────────────────────────────
    ctx.fillStyle = '#2d0606';
    ctx.beginPath();
    ctx.moveTo(-9, -15 + rBreath);
    ctx.quadraticCurveTo(-26 + rCloakSway * 1.1, 4, -22 + rCloakSway * 1.3, 21);
    ctx.lineTo(-12 + rCloakSway, 19);
    ctx.lineTo(-4, 21);
    ctx.lineTo(7, 21);
    ctx.quadraticCurveTo(11, 4, 7, -15 + rBreath);
    ctx.closePath();
    ctx.fill();

    // Cloak main crimson mantle
    ctx.fillStyle = '#5c1010';
    ctx.beginPath();
    ctx.moveTo(-7, -14 + rBreath);
    ctx.quadraticCurveTo(-20 + rCloakSway, 5, -16 + rCloakSway * 1.1, 21);
    ctx.lineTo(-9 + rCloakSway * 0.9, 19);
    ctx.lineTo(-3 + rCloakSway * 0.7, 21);
    ctx.lineTo(5, 21);
    ctx.quadraticCurveTo(7, 5, 5, -14 + rBreath);
    ctx.closePath();
    ctx.fill();

    // Cloak amber highlight fold (catching brazier firelight on left)
    ctx.fillStyle = '#831818';
    ctx.beginPath();
    ctx.moveTo(-7, -14 + rBreath);
    ctx.quadraticCurveTo(-15 + rCloakSway * 0.8, 5, -11 + rCloakSway, 20);
    ctx.lineTo(-5, 20);
    ctx.quadraticCurveTo(-3, 5, -1, -14 + rBreath);
    ctx.closePath();
    ctx.fill();

    // ─────────────────────────────────────────────────────────────────────────
    // ARMORED LEGS & PLATED STEEL SABATONS (Resolute 3/4 stance)
    // ─────────────────────────────────────────────────────────────────────────
    // Left leg (trailing slightly)
    ctx.fillStyle = '#0b1120';
    ctx.fillRect(-8, 3, 5.5, 16);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-7, 4, 3, 14);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-9, 17, 7.5, 3);

    // Right leg (forward, bearing weight)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(2, 3, 6.5, 17);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(3, 4, 3.5, 15);
    ctx.fillStyle = '#475569';
    ctx.fillRect(1, 17, 8.5, 3.5);

    // ─────────────────────────────────────────────────────────────────────────
    // STEEL CUIRASS & BREASTPLATE (Angled 3/4 toward the Gateway)
    // ─────────────────────────────────────────────────────────────────────────
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-10, -17 + rBreath, 22, 21);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-7, -15 + rBreath, 17, 10);

    // Gold Inlay Waist Trim
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-10, 0 + rBreath, 22, 2.2);

    // Dual-Tone Chiaroscuro Lighting on Cuirass:
    // Left edge: Warm Amber from Brazier
    ctx.fillStyle = 'rgba(251, 191, 36, 0.40)';
    ctx.fillRect(-10, -17 + rBreath, 3.2, 21);
    // Right edge: Cool Cyan from Gateway
    ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.fillRect(8, -17 + rBreath, 4.0, 21);

    // ─────────────────────────────────────────────────────────────────────────
    // PAULDRONS (Shoulder Guards)
    // ─────────────────────────────────────────────────────────────────────────
    // Left shoulder (back/brazier facing)
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(-11, -14 + rBreath, 5.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(-15, -12 + rBreath, 6, 1.8);

    // Right shoulder (forward/gateway facing)
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(12, -14 + rBreath, 5.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(8, -12 + rBreath, 7.5, 2.0);

    // ─────────────────────────────────────────────────────────────────────────
    // VISORED GREAT HELM (Angled in 3/4 vigil toward the Gateway)
    // ─────────────────────────────────────────────────────────────────────────
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(1, -24 + rBreath, 8.8, 0, Math.PI * 2);
    ctx.fill();

    // Helmet brow & cheek guards
    ctx.fillStyle = '#334155';
    ctx.fillRect(-5, -31 + rBreath, 15, 5.5);
    ctx.fillRect(-4, -25 + rBreath, 14, 7.5);

    // Iconic Cyan Visor Slit (Angled right gazing at Gateway)
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 6;
    ctx.fillRect(0, -25 + rBreath, 7.0, 2.4);
    ctx.shadowBlur = 0;

    // ─────────────────────────────────────────────────────────────────────────
    // RESOLUTE HEIRLOOM BROADSWORD (Planted into the Stone Flagstone)
    // ─────────────────────────────────────────────────────────────────────────
    const swordX = 5;
    const swordY = -5 + rBreath;

    ctx.save();
    ctx.translate(swordX, swordY);

    // Spherical Gold Pommel
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.arc(0, -14, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Dark Wrapped Grip
    ctx.fillStyle = '#1e1b18';
    ctx.fillRect(-1.4, -12, 2.8, 7.5);

    // Ornate Gold Crossguard
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(-8, -5.5);
    ctx.lineTo(8, -5.5);
    ctx.lineTo(9, -3.0);
    ctx.lineTo(7, -2.0);
    ctx.lineTo(-7, -2.0);
    ctx.lineTo(-9, -3.0);
    ctx.closePath();
    ctx.fill();

    // Steel Blade
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-2.2, -2, 4.4, 27);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-0.7, -1, 1.4, 24);

    // Dual-light blade specular reflections
    ctx.fillStyle = 'rgba(253, 230, 138, 0.65)'; // Amber reflection
    ctx.fillRect(-2.2, -2, 1.0, 27);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.65)'; // Cyan reflection
    ctx.fillRect(1.2, -2, 1.0, 27);

    // Sword Tip planted into flagstone
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(-2.2, 25);
    ctx.lineTo(0, 29);
    ctx.lineTo(2.2, 25);
    ctx.closePath();
    ctx.fill();

    ctx.restore(); // restore sword

    // Gauntlets clasped atop sword pommel
    ctx.fillStyle = '#334155';
    ctx.fillRect(swordX - 4.0, swordY - 11, 4.5, 4.5);
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(swordX + 1, swordY - 14, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(swordX - 0.4, swordY - 15, 2.2, 1.6);

    ctx.restore(); // restore Rowan

    // =========================================================================
    // LAYER 5: ROLLING CHASM MIST & AMBIENT SOUL MOTES (PARALLAX 1.15X)
    // =========================================================================
    ctx.save();

    // Multi-layered rolling abyssal ground mist across bottom void
    this.deepFogLayers.forEach(b => {
      const fgPulse = b.alpha * (isReducedMotion ? 0.8 : Math.sin(F * 0.02 + b.phase) * 0.25 + 0.75);
      const fgGrad = ctx.createRadialGradient(b.x, b.y, b.r * 0.1, b.x, b.y, b.r);
      fgGrad.addColorStop(0, `rgba(8, 12, 28, ${fgPulse})`);
      fgGrad.addColorStop(0.55, `rgba(5, 8, 18, ${fgPulse * 0.6})`);
      fgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = fgGrad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Subterranean Dust & Ethereal Soul Motes
    this.chasmMotes.forEach(p => {
      const alphaPulse = p.alpha * (isReducedMotion ? 0.8 : Math.sin(F * 0.05 + p.phase) * 0.3 + 0.7);
      ctx.fillStyle = p.type === 'dust'
        ? `rgba(253, 230, 138, ${alphaPulse * 0.75})`
        : `rgba(192, 132, 252, ${alphaPulse})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore(); // restore layer 5
    ctx.restore(); // restore root canvas state
  }
};
