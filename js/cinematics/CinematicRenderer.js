// =====================================================================
//  DUNGEON BREAK — js/cinematics/CinematicRenderer.js
//  Authoritative 2.5D / Semi-3D Dark-Fantasy Cinematic Presentation System
//  Lead Design & Direction: Dinesh Polimera
//  Features:
//  - True 2.5D Dungeon Chamber Projection Engine (Ashlar Stone Walls, Bevels & Mortar)
//  - Receding Perspective Flagstone Floors with Grout Crevices & Royal Runners
//  - Dynamic Wrought-Iron Wall Torches & Grand Braziers with Radial Light Pools
//  - 3-Tier Depth of Field: Foreground Silhouettes (z=1.5), Midground Actors (z=1.0), Background Walls (z=0.4)
//  - Directional Contact & Cast Shadows on Dungeon Stones
//  - Multi-Directional Eyes Opening, Weeping, & Dying for Shattered Mind Horror
//  - Animated Cinemascope Letterbox Bars & Volumetric Lighting
// =====================================================================

import { LW, LH } from '../core/Constants.js';
import { GameState } from '../core/GameState.js';
import { CinematicCharacterRenderer } from './CinematicCharacterRenderer.js';
import { CharacterDefinitions } from '../rendering/CharacterDefinitions.js';

export const CINEMATIC_W = 1280;
export const CINEMATIC_H = 720;

export const CinematicRenderer = {
  // Cinematic Camera State (in 1280 × 720 logical coordinates)
  camera: {
    x: CINEMATIC_W / 2,
    y: CINEMATIC_H / 2,
    zoom: 1.0,
    rotation: 0,
    targetX: CINEMATIC_W / 2,
    targetY: CINEMATIC_H / 2,
    targetZoom: 1.0,
    targetRotation: 0,
    shake: 0,
    shakeX: 0,
    shakeY: 0
  },

  // Cinemascope Letterbox State
  letterbox: {
    amount: 0,
    target: 1.0,
    maxHeight: 68
  },

  // Atmospheric Dust Motes & Embers
  motes: Array.from({ length: 65 }, (_, i) => ({
    x: Math.random() * CINEMATIC_W,
    y: Math.random() * CINEMATIC_H,
    r: 1 + Math.random() * 2.8,
    spd: 12 + Math.random() * 28,
    ang: Math.random() * 6.28,
    alpha: 0.2 + Math.random() * 0.7,
    phase: Math.random() * 6.28
  })),

  // Reset camera to default center
  resetCamera() {
    this.camera.x = CINEMATIC_W / 2;
    this.camera.y = CINEMATIC_H / 2;
    this.camera.zoom = 1.0;
    this.camera.rotation = 0;
    this.camera.targetX = CINEMATIC_W / 2;
    this.camera.targetY = CINEMATIC_H / 2;
    this.camera.targetZoom = 1.0;
    this.camera.targetRotation = 0;
    this.camera.shake = 0;
    this.camera.shakeX = 0;
    this.camera.shakeY = 0;
    this.letterbox.amount = 0;
    this.letterbox.target = 1.0;
  },

  setShot(targetX, targetY, zoom = 1.0, rotation = 0, snap = false) {
    this.camera.targetX = targetX;
    this.camera.targetY = targetY;
    this.camera.targetZoom = zoom;
    this.camera.targetRotation = rotation;
    if (snap) {
      this.camera.x = targetX;
      this.camera.y = targetY;
      this.camera.zoom = zoom;
      this.camera.rotation = rotation;
    }
  },

  addShake(amount) {
    this.camera.shake = Math.min(35, this.camera.shake + amount);
  },

  update(dt) {
    const c = this.camera;
    const lerpSpeed = 4.5 * dt;

    // Smooth camera interpolation
    c.x += (c.targetX - c.x) * Math.min(1, lerpSpeed);
    c.y += (c.targetY - c.y) * Math.min(1, lerpSpeed);
    c.zoom += (c.targetZoom - c.zoom) * Math.min(1, lerpSpeed);
    c.rotation += (c.targetRotation - c.rotation) * Math.min(1, lerpSpeed);

    // Camera trauma / shake decay
    if (c.shake > 0) {
      c.shakeX = (Math.random() - 0.5) * c.shake * 2.2;
      c.shakeY = (Math.random() - 0.5) * c.shake * 2.2;
      c.shake = Math.max(0, c.shake - dt * 26);
    } else {
      c.shakeX = 0;
      c.shakeY = 0;
    }

    // Letterbox slide in / slide out
    this.letterbox.amount += (this.letterbox.target - this.letterbox.amount) * Math.min(1, dt * 3.5);

    // Atmospheric motes update
    for (const m of this.motes) {
      m.y -= m.spd * dt;
      m.x += Math.sin(GameState.F * 0.03 + m.phase) * 16 * dt;
      if (m.y < -15) {
        m.y = CINEMATIC_H + 15;
        m.x = Math.random() * CINEMATIC_W;
      }
    }
  },

  // Apply camera matrix to canvas context
  applyCamera(ctx) {
    const c = this.camera;
    ctx.translate(CINEMATIC_W / 2, CINEMATIC_H / 2);
    ctx.rotate(c.rotation);
    ctx.scale(c.zoom, c.zoom);
    ctx.translate(-c.x + c.shakeX, -c.y + c.shakeY);
  },

  // ─────────────────────────────────────────────────────────────────
  // 1. LAYERED 2.5D / SEMI-3D DUNGEON ENVIRONMENT SYSTEM
  // ─────────────────────────────────────────────────────────────────
  drawBackground(ctx, theme = 'throne', time = 0, options = {}) {
    const cx = CINEMATIC_W / 2;
    const cy = CINEMATIC_H * 0.44;
    const floorY = cy + 45;

    ctx.save();

    // ───────────────────────────────────────────────────────────────
    // A. 2.5D ASHLAR STONE BACK WALL MASONRY (Continuous with gameplay tiles)
    // ───────────────────────────────────────────────────────────────
    let wallTopCol = '#0a0d18';
    let wallMidCol = '#1e293b';
    let wallDarkCol = '#090d16';
    let floorCol1 = '#090d16';
    let floorCol2 = '#04060b';
    let groutCol = 'rgba(0, 0, 0, 0.42)';

    if (theme === 'throne' || theme === 'betrayal' || theme === 'warden_intro' || theme === 'warden_defeat') {
      wallTopCol = '#0c0517';
      wallMidCol = '#1a0b2e';
      wallDarkCol = '#07020d';
      floorCol1 = '#090314';
      floorCol2 = '#020005';
      groutCol = 'rgba(45, 10, 75, 0.55)';
    } else if (theme === 'fissure' || theme === 'gorgaroth') {
      wallTopCol = '#1c0a02';
      wallMidCol = '#2b1206';
      wallDarkCol = '#0c0401';
      floorCol1 = '#140702';
      floorCol2 = '#060201';
      groutCol = 'rgba(69, 26, 3, 0.5)';
    } else if (theme === 'void' || theme === 'malakor') {
      wallTopCol = '#150524';
      wallMidCol = '#260a42';
      wallDarkCol = '#0a0212';
      floorCol1 = '#0e031a';
      floorCol2 = '#030008';
      groutCol = 'rgba(88, 28, 135, 0.5)';
    } else if (theme === 'cathedral' || theme === 'hero') {
      wallTopCol = '#1c1917';
      wallMidCol = '#292524';
      wallDarkCol = '#0c0a09';
      floorCol1 = '#12100e';
      floorCol2 = '#050403';
      groutCol = 'rgba(0, 0, 0, 0.45)';
    }

    // 1. Back wall gradient
    const wallGrad = ctx.createLinearGradient(0, 0, 0, floorY);
    wallGrad.addColorStop(0, wallTopCol);
    wallGrad.addColorStop(0.5, wallMidCol);
    wallGrad.addColorStop(1, wallDarkCol);
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, CINEMATIC_W, floorY);

    // 2. Heavy 2.5D Ashlar Stone Courses on Back Wall
    ctx.save();
    const courseHeight = 28;
    const numCourses = Math.ceil(floorY / courseHeight);

    for (let cIdx = 0; cIdx < numCourses; cIdx++) {
      const yPos = cIdx * courseHeight;
      // Horizontal mortar line
      ctx.fillStyle = groutCol;
      ctx.fillRect(0, yPos + courseHeight - 2, CINEMATIC_W, 2);

      // Course top edge specular bevel
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(0, yPos, CINEMATIC_W, 1);

      // Vertical stone joint blocks (staggered by course)
      const blockWidth = 72;
      const stagger = (cIdx % 2 === 0) ? 0 : blockWidth / 2;
      ctx.fillStyle = groutCol;
      for (let bx = -blockWidth; bx < CINEMATIC_W + blockWidth; bx += blockWidth) {
        ctx.fillRect(bx + stagger, yPos, 2, courseHeight - 2);

        // Subtle individual block tone variance
        const blockTone = ((cIdx * 7 + bx * 13) % 5) * 0.02;
        ctx.fillStyle = `rgba(0, 0, 0, ${blockTone})`;
        ctx.fillRect(bx + stagger + 2, yPos + 1, blockWidth - 4, courseHeight - 4);
        ctx.fillStyle = groutCol;
      }
    }
    ctx.restore();

    // 3. Wall Pilasters / Pillars Flanking the Chamber (2.5D Architectural Depth)
    const pilasterWidth = 52;
    for (let s = -3; s <= 3; s++) {
      if (s === 0) continue; // Keep central axis open for throne / boss
      const px = cx + s * 190;

      // Pilaster body with bevel shading
      const pilGrad = ctx.createLinearGradient(px - pilasterWidth / 2, 0, px + pilasterWidth / 2, 0);
      pilGrad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
      pilGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.08)');
      pilGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.02)');
      pilGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
      ctx.fillStyle = pilGrad;
      ctx.fillRect(px - pilasterWidth / 2, 0, pilasterWidth, floorY);

      // Capital & Base Trim
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px - pilasterWidth / 2 - 4, floorY - 14, pilasterWidth + 8, 14);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(px - pilasterWidth / 2 - 4, floorY - 14, pilasterWidth + 8, 2);

      // Carved fluting grooves
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(px - 10, 0, 2, floorY - 14);
      ctx.fillRect(px, 0, 2, floorY - 14);
      ctx.fillRect(px + 10, 0, 2, floorY - 14);
    }

    // 4. Mounted 2.5D Iron Wall Torches & Grand Braziers on Pilasters
    const torchPillars = [-2, 2];
    torchPillars.forEach(s => {
      const tx = cx + s * 190;
      const ty = floorY - 60;
      const flicker = Math.sin(time * 9.0 + s * 3.14) * 2.2;
      const isVoid = (theme === 'void' || theme === 'malakor' || theme === 'sanity');

      // Wrought-iron wall sconce backplate & curved bracket
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(tx - 4, ty, 8, 16);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(tx, ty + 12);
      ctx.quadraticCurveTo(tx + (s > 0 ? -6 : 6), ty + 4, tx, ty - 2);
      ctx.stroke();

      // Downward radial firelight on back wall
      const wallGlow = ctx.createRadialGradient(tx, ty - 4, 4, tx, ty - 4, 90);
      if (isVoid) {
        wallGlow.addColorStop(0, 'rgba(192, 132, 252, 0.45)');
        wallGlow.addColorStop(0.5, 'rgba(126, 34, 206, 0.15)');
        wallGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        wallGlow.addColorStop(0, 'rgba(251, 191, 36, 0.48)');
        wallGlow.addColorStop(0.5, 'rgba(249, 115, 22, 0.18)');
        wallGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      ctx.fillStyle = wallGlow;
      ctx.beginPath();
      ctx.arc(tx, ty - 4, 90, 0, 6.28);
      ctx.fill();

      // Flame body
      ctx.save();
      ctx.shadowColor = isVoid ? '#c084fc' : '#f97316';
      ctx.shadowBlur = 16;
      ctx.fillStyle = isVoid ? '#9333ea' : '#ea580c';
      ctx.beginPath();
      ctx.moveTo(tx - 6, ty - 2);
      ctx.quadraticCurveTo(tx - 4, ty - 14, tx + flicker * 0.5, ty - 20);
      ctx.quadraticCurveTo(tx + 4, ty - 14, tx + 6, ty - 2);
      ctx.closePath();
      ctx.fill();

      // White-hot core
      ctx.fillStyle = isVoid ? '#fae8ff' : '#fef08a';
      ctx.beginPath();
      ctx.arc(tx, ty - 8, 3.5, 0, 6.28);
      ctx.fill();
      ctx.restore();
    });

    // ───────────────────────────────────────────────────────────────
    // B. RECEDING 2.5D FLOOR PLANE (True Perspective Flagstones)
    // ───────────────────────────────────────────────────────────────
    const floorGrad = ctx.createLinearGradient(0, floorY, 0, CINEMATIC_H);
    floorGrad.addColorStop(0, floorCol1);
    floorGrad.addColorStop(1, floorCol2);
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, floorY, CINEMATIC_W, CINEMATIC_H - floorY);

    // Wall-floor contact ambient occlusion shadow
    const aoGrad = ctx.createLinearGradient(0, floorY, 0, floorY + 18);
    aoGrad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    aoGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = aoGrad;
    ctx.fillRect(0, floorY, CINEMATIC_W, 18);

    // 2.5D Converging Perspective Flagstone Seams
    ctx.save();
    ctx.strokeStyle = groutCol;
    ctx.lineWidth = 1.4;

    // Longitudinal seams converging toward vanishing center (cx, cy - 80)
    const vanY = cy - 80;
    const numFloorLines = 22;
    for (let i = -numFloorLines; i <= numFloorLines; i++) {
      const topX = cx + i * 36;
      const botX = cx + i * 140;
      ctx.beginPath();
      ctx.moveTo(topX, floorY);
      ctx.lineTo(botX, CINEMATIC_H);
      ctx.stroke();

      // Bevel highlight on paver edge
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.moveTo(topX + 1, floorY);
      ctx.lineTo(botX + 1, CINEMATIC_H);
      ctx.stroke();
      ctx.strokeStyle = groutCol;
    }

    // Transverse horizontal mortar lines (Perspective Foreshortened Z-spacing)
    let currY = floorY;
    let step = 14;
    while (currY < CINEMATIC_H) {
      currY += step;
      step *= 1.22; // Progressive perspective expansion
      ctx.beginPath();
      ctx.moveTo(0, currY);
      ctx.lineTo(CINEMATIC_W, currY);
      ctx.stroke();

      // Transverse bevel specular highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(0, currY - 1, CINEMATIC_W, 1);
    }
    ctx.restore();

    // ───────────────────────────────────────────────────────────────
    // C. THEME-SPECIFIC STRUCTURAL SET PIECES (2.5D Citadel Environment)
    // ───────────────────────────────────────────────────────────────

    // 1. THE ABYSS WARDEN'S THRONE ROOM (Throne, Dais, Braziers, Carpet Runner)
    if (theme === 'throne' || theme === 'betrayal' || theme === 'warden_intro' || theme === 'warden_defeat') {
      // Royal Ceremonial Velvet Runner (Tile 5 in Gameplay)
      const carpetTopW = 110;
      const carpetBotW = 320;
      ctx.save();
      // Drop shadow on flagstones
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.beginPath();
      ctx.moveTo(cx - carpetTopW / 2 - 8, floorY);
      ctx.lineTo(cx + carpetTopW / 2 + 8, floorY);
      ctx.lineTo(cx + carpetBotW / 2 + 12, CINEMATIC_H);
      ctx.lineTo(cx - carpetBotW / 2 - 12, CINEMATIC_H);
      ctx.closePath();
      ctx.fill();

      // Crimson velvet body
      const carpetGrad = ctx.createLinearGradient(0, floorY, 0, CINEMATIC_H);
      carpetGrad.addColorStop(0, '#450a0a');
      carpetGrad.addColorStop(0.5, '#7f1d1d');
      carpetGrad.addColorStop(1, '#2e0707');
      ctx.fillStyle = carpetGrad;
      ctx.beginPath();
      ctx.moveTo(cx - carpetTopW / 2, floorY);
      ctx.lineTo(cx + carpetTopW / 2, floorY);
      ctx.lineTo(cx + carpetBotW / 2, CINEMATIC_H);
      ctx.lineTo(cx - carpetBotW / 2, CINEMATIC_H);
      ctx.closePath();
      ctx.fill();

      // Braided gold thread border
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx - carpetTopW / 2 + 4, floorY);
      ctx.lineTo(cx - carpetBotW / 2 + 8, CINEMATIC_H);
      ctx.moveTo(cx + carpetTopW / 2 - 4, floorY);
      ctx.lineTo(cx + carpetBotW / 2 - 8, CINEMATIC_H);
      ctx.stroke();

      // Diamond royal inlays down the carpet runner
      ctx.fillStyle = 'rgba(253, 224, 71, 0.45)';
      let dY = floorY + 20;
      let dSpacing = 28;
      let dSize = 12;
      while (dY < CINEMATIC_H) {
        ctx.beginPath();
        ctx.moveTo(cx, dY - dSize);
        ctx.lineTo(cx + dSize * 1.3, dY);
        ctx.lineTo(cx, dY + dSize);
        ctx.lineTo(cx - dSize * 1.3, dY);
        ctx.closePath();
        ctx.fill();
        dY += dSpacing;
        dSpacing *= 1.28;
        dSize *= 1.22;
      }
      ctx.restore();

      // Tiered Stone Dais Platform
      ctx.save();
      const daisGrad = ctx.createLinearGradient(cx - 130, floorY - 24, cx + 130, floorY + 12);
      daisGrad.addColorStop(0, '#0a0314');
      daisGrad.addColorStop(0.5, '#1e0836');
      daisGrad.addColorStop(1, '#06010c');
      ctx.fillStyle = daisGrad;
      ctx.beginPath();
      ctx.moveTo(cx - 130, floorY + 14);
      ctx.lineTo(cx - 105, floorY - 20);
      ctx.lineTo(cx + 105, floorY - 20);
      ctx.lineTo(cx + 130, floorY + 14);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#7e22ce';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Dais Top Surface Specular Rim
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(cx - 105, floorY - 20, 210, 2);

      // Flanking Monumental Footed Grand Braziers on Dais
      [-85, 85].forEach(bx => {
        const brazX = cx + bx;
        const brazY = floorY - 14;
        const bFlicker = Math.sin(time * 8.0 + bx) * 2.5;

        // Base & pedestal
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(brazX - 12, brazY + 6, 24, 5);
        ctx.fillStyle = '#44403c';
        ctx.fillRect(brazX - 9, brazY + 2, 18, 4);
        ctx.fillStyle = '#78716c';
        ctx.fillRect(brazX - 4, brazY - 6, 8, 8);

        // Flared bowl
        ctx.fillStyle = '#292524';
        ctx.beginPath();
        ctx.moveTo(brazX - 14, brazY - 6);
        ctx.lineTo(brazX + 14, brazY - 6);
        ctx.lineTo(brazX + 9, brazY + 2);
        ctx.lineTo(brazX - 9, brazY + 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Blazing Column Flame
        ctx.save();
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 22;
        ctx.fillStyle = '#9333ea';
        ctx.beginPath();
        ctx.moveTo(brazX - 10, brazY - 6);
        ctx.quadraticCurveTo(brazX - 6, brazY - 24, brazX + bFlicker * 0.7, brazY - 34);
        ctx.quadraticCurveTo(brazX + 6, brazY - 24, brazX + 10, brazY - 6);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#e879f9';
        ctx.beginPath();
        ctx.arc(brazX, brazY - 16, 5, 0, 6.28);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(brazX, brazY - 14, 2.5, 0, 6.28);
        ctx.fill();
        ctx.restore();
      });

      // The Demon Throne of the Sunken Citadel (Monumental Horned Obsidian Seat)
      const throneGrad = ctx.createLinearGradient(cx - 75, floorY - 160, cx + 75, floorY);
      throneGrad.addColorStop(0, '#1c0830');
      throneGrad.addColorStop(0.4, '#0f041c');
      throneGrad.addColorStop(1, '#05010a');
      ctx.fillStyle = throneGrad;

      ctx.beginPath();
      ctx.moveTo(cx - 72, floorY - 14);
      ctx.lineTo(cx - 60, floorY - 90);
      ctx.lineTo(cx - 86, floorY - 150); // Left outer horn
      ctx.lineTo(cx - 46, floorY - 120);
      ctx.lineTo(cx, floorY - 175);       // Central monolithic spire
      ctx.lineTo(cx + 46, floorY - 120);
      ctx.lineTo(cx + 86, floorY - 150); // Right outer horn
      ctx.lineTo(cx + 60, floorY - 90);
      ctx.lineTo(cx + 72, floorY - 14);
      ctx.closePath();
      ctx.fill();

      // Throne Bevel Edge Highlight
      ctx.strokeStyle = '#9333ea';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Carved Abyssal Rune Eye on Throne
      ctx.save();
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.moveTo(cx - 20, floorY - 70);
      ctx.lineTo(cx, floorY - 95);
      ctx.lineTo(cx + 20, floorY - 70);
      ctx.lineTo(cx, floorY - 55);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#c084fc';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.restore();

      // Heavy sculpted armrests
      ctx.fillStyle = '#140524';
      ctx.fillRect(cx - 62, floorY - 44, 24, 30);
      ctx.fillRect(cx + 38, floorY - 44, 24, 30);
      ctx.strokeStyle = '#7e22ce';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(cx - 62, floorY - 44, 24, 30);
      ctx.strokeRect(cx + 38, floorY - 44, 24, 30);

      ctx.restore();

      // Collapsing / Opening Violet Rift
      if (options.showRift) {
        const riftProg = options.riftProgress !== undefined ? options.riftProgress : 0.6;
        const riftGrad = ctx.createRadialGradient(cx, floorY - 110, 10, cx, floorY - 110, 170);
        riftGrad.addColorStop(0, '#ffffff');
        riftGrad.addColorStop(0.2, '#c084fc');
        riftGrad.addColorStop(0.6, '#581c87');
        riftGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = riftGrad;
        ctx.beginPath();
        ctx.ellipse(cx, floorY - 110, 85 * riftProg, 150 * riftProg, 0, 0, 6.28);
        ctx.fill();
      }
    }

    // 2. GORGAROTH'S IRON JAIL & FISSURE (Chains & Magma Floor Veins)
    else if (theme === 'fissure' || theme === 'gorgaroth') {
      // Giant Forged Iron Chains Hanging from Ceiling Mounts
      ctx.save();
      for (let c = -4; c <= 4; c++) {
        const chX = cx + c * 155;
        const swing = Math.sin(time * 1.5 + c) * 12;

        ctx.strokeStyle = '#1c1917';
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(chX, 0);
        ctx.lineTo(chX + swing, floorY + 10);
        ctx.stroke();

        ctx.strokeStyle = '#57534e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(chX - 1, 0);
        ctx.lineTo(chX + swing - 1, floorY + 10);
        ctx.stroke();
      }
      ctx.restore();

      // Jagged Molten Magma Chasm Splitting Across Stone Tiles
      ctx.save();
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 26;

      const chasmGrad = ctx.createLinearGradient(0, floorY + 25, 0, floorY + 95);
      chasmGrad.addColorStop(0, '#fef08a');
      chasmGrad.addColorStop(0.2, '#f97316');
      chasmGrad.addColorStop(0.6, '#991b1b');
      chasmGrad.addColorStop(1, '#2e1008');
      ctx.fillStyle = chasmGrad;

      ctx.beginPath();
      ctx.moveTo(cx - 300, floorY + 50);
      ctx.lineTo(cx - 200, floorY + 45);
      ctx.lineTo(cx - 120, floorY + 58);
      ctx.lineTo(cx - 40, floorY + 48);
      ctx.lineTo(cx + 60, floorY + 56);
      ctx.lineTo(cx + 160, floorY + 46);
      ctx.lineTo(cx + 260, floorY + 54);
      ctx.lineTo(cx + 310, floorY + 62);
      ctx.lineTo(cx + 270, floorY + 74);
      ctx.lineTo(cx + 170, floorY + 66);
      ctx.lineTo(cx + 70, floorY + 78);
      ctx.lineTo(cx - 30, floorY + 68);
      ctx.lineTo(cx - 130, floorY + 76);
      ctx.lineTo(cx - 220, floorY + 64);
      ctx.closePath();
      ctx.fill();

      // White-Hot Internal Magma Core Thread
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(cx - 270, floorY + 54);
      ctx.lineTo(cx - 160, floorY + 52);
      ctx.lineTo(cx - 50, floorY + 56);
      ctx.lineTo(cx + 50, floorY + 53);
      ctx.lineTo(cx + 170, floorY + 54);
      ctx.lineTo(cx + 270, floorY + 58);
      ctx.stroke();
      ctx.restore();
    }

    // 3. MALAKOR'S VOID SANCTUM (Floating Arcane Obelisks & Cosmic Stars)
    else if (theme === 'void' || theme === 'malakor') {
      // Swirling Void Stars
      ctx.fillStyle = '#e9d5ff';
      for (let s = 0; s < 45; s++) {
        const sx = (Math.sin(s * 93 + time * 0.2) * 0.5 + 0.5) * CINEMATIC_W;
        const sy = (Math.cos(s * 47 + time * 0.15) * 0.5 + 0.5) * (floorY - 20);
        ctx.beginPath();
        ctx.arc(sx, sy, (s % 3) + 1, 0, 6.28);
        ctx.fill();
      }

      // Central Swirling Void Rift
      ctx.save();
      const riftSwirl = time * 1.5;
      const riftR = 110;
      const riftGrad = ctx.createRadialGradient(cx, floorY - 70, 5, cx, floorY - 70, riftR);
      riftGrad.addColorStop(0, '#ffffff');
      riftGrad.addColorStop(0.25, '#c084fc');
      riftGrad.addColorStop(0.65, '#581c87');
      riftGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = riftGrad;
      ctx.beginPath();
      ctx.arc(cx, floorY - 70, riftR, 0, 6.28);
      ctx.fill();
      ctx.restore();

      // Floating Arcane Obelisks with Violet Runes
      [-230, 230].forEach((ox, idx) => {
        const obX = cx + ox;
        const obY = floorY - 80 + Math.sin(time * 1.6 + idx * 2.0) * 8;
        ctx.save();
        ctx.fillStyle = '#0f021c';
        ctx.beginPath();
        ctx.moveTo(obX, obY - 70);
        ctx.lineTo(obX + 26, obY);
        ctx.lineTo(obX, obY + 70);
        ctx.lineTo(obX - 26, obY);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1.8;
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 12;
        ctx.stroke();

        ctx.fillStyle = '#fae8ff';
        ctx.beginPath();
        ctx.arc(obX, obY, 4, 0, 6.28);
        ctx.fill();
        ctx.restore();
      });
    }

    // 4. CATHEDRAL OF LIGHT / CITADEL COLLAPSE (Hero Ending)
    else if (theme === 'cathedral' || theme === 'hero') {
      const breachAlpha = Math.min(1, Math.max(0, (time - 16) / 6));
      if (breachAlpha > 0) {
        // Collapsed Vault Opening
        const sunGrad = ctx.createRadialGradient(cx, cy - 140, 20, cx, cy - 140, 360);
        sunGrad.addColorStop(0, `rgba(255, 255, 255, ${0.92 * breachAlpha})`);
        sunGrad.addColorStop(0.3, `rgba(254, 240, 138, ${0.75 * breachAlpha})`);
        sunGrad.addColorStop(0.7, `rgba(245, 158, 11, ${0.35 * breachAlpha})`);
        sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(cx, cy - 140, 360, 0, 6.28);
        ctx.fill();

        // Volumetric God-Rays Streaming Down onto Stone Floor
        ctx.save();
        ctx.globalAlpha = breachAlpha * 0.42;
        ctx.fillStyle = 'rgba(254, 240, 138, 0.32)';
        for (let r = -4; r <= 4; r++) {
          ctx.beginPath();
          ctx.moveTo(cx + r * 34, cy - 140);
          ctx.lineTo(cx + r * 190 - 70, CINEMATIC_H);
          ctx.lineTo(cx + r * 190 + 70, CINEMATIC_H);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // 5. SHATTERED MIND (Multi-Directional Eyes Opening, Weeping, & Dying)
    else if (theme === 'sanity') {
      const breathPulse = Math.sin(time * 2.0) * 0.12;
      ctx.save();

      // Atmospheric sanity distortion overlay
      ctx.fillStyle = `rgba(30, 4, 45, ${0.28 + breathPulse * 0.1})`;
      ctx.fillRect(0, 0, CINEMATIC_W, CINEMATIC_H);

      // Multi-Directional Eyes Opening, Weeping, & Dying Across the Screen
      const eyeCount = Math.min(48, Math.floor(6 + time * 3.5));
      for (let i = 0; i < eyeCount; i++) {
        // Deterministic pseudo-random placement covering all directions
        const ex = ((i * 127 + 65) % (CINEMATIC_W - 80)) + 40;
        const ey = ((i * 91 + 45) % (CINEMATIC_H - 100)) + 50;

        const cycle = (time * 1.8 + i * 1.3) % 4.0;
        let openAmount = 0;
        let dyingAlpha = 1.0;

        if (cycle < 1.4) {
          // Eye peels open slowly
          openAmount = Math.min(1.0, cycle / 1.1);
        } else if (cycle < 2.8) {
          // Eye stays open, tracking Rowan
          openAmount = 1.0;
        } else {
          // Eye bleeds, spasms, and dies (fades away)
          openAmount = Math.max(0.05, 1.0 - (cycle - 2.8) / 0.9);
          dyingAlpha = Math.max(0, 1.0 - (cycle - 2.8) / 1.0);
        }

        if (dyingAlpha <= 0.02 || openAmount <= 0.05) continue;

        const eyeW = 18 + (i % 4) * 5;
        const eyeH = eyeW * 0.55 * openAmount;
        const isRed = (i % 3 !== 0);

        ctx.save();
        ctx.globalAlpha = dyingAlpha * 0.92;
        ctx.translate(ex, ey);

        // Eye Socket Shadow
        ctx.fillStyle = '#05000a';
        ctx.beginPath();
        ctx.ellipse(0, 0, eyeW + 2, eyeH + 2, 0, 0, 6.28);
        ctx.fill();

        // Dark Sclera with Veins
        ctx.fillStyle = isRed ? '#2d0505' : '#1a062e';
        ctx.beginPath();
        ctx.ellipse(0, 0, eyeW, eyeH, 0, 0, 6.28);
        ctx.fill();

        // Blood / Void Veins Creeping from Corner
        ctx.strokeStyle = isRed ? 'rgba(239, 68, 68, 0.45)' : 'rgba(192, 132, 252, 0.45)';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(-eyeW * 0.8, 0); ctx.lineTo(-eyeW * 0.3, -eyeH * 0.2);
        ctx.moveTo(eyeW * 0.8, 0); ctx.lineTo(eyeW * 0.3, eyeH * 0.2);
        ctx.stroke();

        // Burning Iris
        ctx.fillStyle = isRed ? '#ef4444' : '#c084fc';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(0, 0, eyeH * 0.65, 0, 6.28);
        ctx.fill();

        // Vertical Slit Demonic Pupil
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(0, 0, 2.2, eyeH * 0.58, 0, 0, 6.28);
        ctx.fill();

        // Weeping Blood / Void Tear Dripping Downward
        if (cycle > 1.8) {
          const tearLen = Math.min(42, (cycle - 1.8) * 28);
          ctx.strokeStyle = isRed ? '#7f1d1d' : '#581c87';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(0, eyeH * 0.8);
          ctx.lineTo(0, eyeH * 0.8 + tearLen);
          ctx.stroke();
        }

        ctx.restore();
      }
      ctx.restore();
    }

    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────────
  // 2. FOREGROUND SILHOUETTE & DEPTH LAYER (z = 1.4 - 1.6)
  // ─────────────────────────────────────────────────────────────────
  drawForeground(ctx, theme = 'throne', time = 0) {
    ctx.save();

    // Architectural Side Columns Framing the Shot
    ctx.fillStyle = '#020306';
    ctx.fillRect(0, 0, 52, CINEMATIC_H);
    ctx.fillRect(CINEMATIC_W - 52, 0, 52, CINEMATIC_H);

    // Vaulted Ceiling Arch Silhouette
    ctx.beginPath();
    ctx.moveTo(0, 44);
    ctx.bezierCurveTo(CINEMATIC_W * 0.25, 58, CINEMATIC_W * 0.75, 58, CINEMATIC_W, 44);
    ctx.lineTo(CINEMATIC_W, 0);
    ctx.lineTo(0, 0);
    ctx.fill();

    // Foreground Hanging Chains for Fissure / Dungeon Scenes
    if (theme === 'fissure' || theme === 'gorgaroth' || theme === 'crypt' || theme === 'normal') {
      ctx.strokeStyle = '#050508';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(85, 0); ctx.lineTo(100, 150);
      ctx.moveTo(CINEMATIC_W - 85, 0); ctx.lineTo(CINEMATIC_W - 105, 170);
      ctx.stroke();
    }

    // Atmospheric Motes & Floating Spark Particles
    const isGold = (theme === 'cathedral' || theme === 'hero');
    const isRed = (theme === 'battlefield' || theme === 'rampage');
    const isVoid = (theme === 'void' || theme === 'malakor' || theme === 'sanity' || theme === 'throne' || theme === 'warden_intro' || theme === 'warden_defeat' || theme === 'betrayal');

    ctx.fillStyle = isGold ? '#fde68a' : (isRed ? '#f87171' : (isVoid ? '#c084fc' : '#e2e8f0'));

    for (const m of this.motes) {
      ctx.globalAlpha = m.alpha * (0.6 + Math.sin(GameState.F * 0.05 + m.phase) * 0.4);
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, 6.28);
      ctx.fill();
    }

    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────────
  // 3. CINEMASCOPE LETTERBOX BARS
  // ─────────────────────────────────────────────────────────────────
  drawLetterbox(ctx) {
    const barHeight = this.letterbox.maxHeight * this.letterbox.amount;
    if (barHeight <= 0) return;

    ctx.save();
    ctx.fillStyle = '#000000';
    // Top bar
    ctx.fillRect(0, 0, CINEMATIC_W, barHeight);
    // Bottom bar
    ctx.fillRect(0, CINEMATIC_H - barHeight, CINEMATIC_W, barHeight);

    // Subtle golden cinematic separator trim
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, barHeight);
    ctx.lineTo(CINEMATIC_W, barHeight);
    ctx.moveTo(0, CINEMATIC_H - barHeight);
    ctx.lineTo(CINEMATIC_W, CINEMATIC_H - barHeight);
    ctx.stroke();
    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────────
  // 4. ACTOR RENDERING DELEGATION WITH 2.5D DIRECTIONAL CAST SHADOWS
  // ─────────────────────────────────────────────────────────────────
  drawCinematicRowan(ctx, x, y, scale = 1.0, pose = 'idle', options = {}) {
    // Contact & Cast Shadow on Dungeon Stones
    const lightX = options.lightX !== undefined ? options.lightX : CINEMATIC_W / 2 - 120;
    const lightY = options.lightY !== undefined ? options.lightY : y - 100;
    const shadow = CharacterDefinitions.calculateCastShadow(x, y + 26 * scale, lightX, lightY, 14 * scale, 6 * scale);
    CharacterDefinitions.drawCastShadow(ctx, shadow);

    CinematicCharacterRenderer.drawRowan(ctx, x, y, scale, pose, options);
  },

  drawCinematicAbyssWarden(ctx, x, y, scale = 1.0, pose = 'idle', options = {}) {
    // Colossal Demonic Wing Shadow on Dais
    const lightX = options.lightX !== undefined ? options.lightX : CINEMATIC_W / 2;
    const lightY = options.lightY !== undefined ? options.lightY : y - 140;
    const shadow = CharacterDefinitions.calculateCastShadow(x, y + 42 * scale, lightX, lightY, 48 * scale, 16 * scale);
    CharacterDefinitions.drawCastShadow(ctx, shadow);

    CinematicCharacterRenderer.drawAbyssWarden(ctx, x, y, scale, pose, options);
  },

  drawCinematicGorgaroth(ctx, x, y, scale = 1.0, pose = 'idle', options = {}) {
    // Heavy Spiked Iron Bulk Shadow
    const lightX = options.lightX !== undefined ? options.lightX : CINEMATIC_W / 2 - 140;
    const lightY = options.lightY !== undefined ? options.lightY : y - 80;
    const shadow = CharacterDefinitions.calculateCastShadow(x, y + 36 * scale, lightX, lightY, 34 * scale, 12 * scale);
    CharacterDefinitions.drawCastShadow(ctx, shadow);

    CinematicCharacterRenderer.drawGorgaroth(ctx, x, y, scale, pose, options);
  },

  drawCinematicMalakor(ctx, x, y, scale = 1.0, pose = 'idle', options = {}) {
    // Floating Void Singularity Shadow
    const lightX = options.lightX !== undefined ? options.lightX : CINEMATIC_W / 2;
    const lightY = options.lightY !== undefined ? options.lightY : y - 60;
    const shadow = CharacterDefinitions.calculateCastShadow(x, y + 32 * scale, lightX, lightY, 22 * scale, 8 * scale);
    CharacterDefinitions.drawCastShadow(ctx, shadow);

    CinematicCharacterRenderer.drawMalakor(ctx, x, y, scale, pose, options);
  },

  drawCinematicSurvivor(ctx, x, y, scale = 1.0, pose = 'walk', type = 'injured', options = {}) {
    const shadow = CharacterDefinitions.calculateCastShadow(x, y + 22 * scale, CINEMATIC_W / 2, y - 80, 12 * scale, 5 * scale);
    CharacterDefinitions.drawCastShadow(ctx, shadow);
    CinematicCharacterRenderer.drawSurvivor(ctx, x, y, scale, pose, type, options);
  },

  drawCinematicGuard(ctx, x, y, scale = 1.0, options = {}) {
    const shadow = CharacterDefinitions.calculateCastShadow(x, y + 24 * scale, CINEMATIC_W / 2, y - 80, 13 * scale, 5.5 * scale);
    CharacterDefinitions.drawCastShadow(ctx, shadow);
    CinematicCharacterRenderer.drawGuard(ctx, x, y, scale, options);
  },

  drawCinematicGreatsword(ctx, x, y, angle = 0, scale = 1.0, options = {}) {
    CinematicCharacterRenderer.drawGreatsword(ctx, x, y, angle, scale, options);
  }
};

if (typeof window !== 'undefined') {
  window.CinematicRenderer = CinematicRenderer;
}
