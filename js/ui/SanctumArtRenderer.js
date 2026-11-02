// =====================================================================
//  DUNGEON BREAK — js/ui/SanctumArtRenderer.js
//  Authoritative Master Pixel-Art Renderer for The Developer Sanctum
//  Art Direction: The Ancient Abyssal Citadel
//  - Deep indigo basalt, dark violet stone, and purple-black obsidian
//  - Aged bronze, tarnished iron, weathered steel, and chiseled reliefs
//  - Restrained amethyst crystal & molten gold channeling
//  - Individual, purposeful material designs for each of the 6 chambers
//  - Purpose-built button families: Master Action, Tactile Stone, Blood Obsidian, Stepper
// =====================================================================

import { roundRect } from '../core/Constants.js';
import { Typography } from '../rendering/Typography.js';
import { PixelIconRenderer } from '../rendering/PixelIconRenderer.js';

// Cached Image Assets
const _images = {};
function getSanctumImage(name, relPath) {
  if (typeof Image === 'undefined') return null;
  if (!_images[name]) {
    _images[name] = new Image();
    _images[name].src = relPath;
  }
  return (_images[name].complete && _images[name].naturalWidth > 0) ? _images[name] : null;
}

// Cached Procedural Seamless Patterns
let _basaltWallPattern = null;
let _cartographerPattern = null;
let _forgePattern = null;

/** Helper to draw custom chamfered fantasy console plate */
export function drawChamferedPanel(ctx, x, y, w, h, chamfer) {
  const c = Math.max(1, Math.min(chamfer, Math.floor(Math.min(w, h) / 3)));
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

/**
 * 256x256 Seamless Ancient Basalt Masonry Pattern
 */
export function getBasaltChamberPattern(ctx) {
  if (_basaltWallPattern) return _basaltWallPattern;
  
  const img = getSanctumImage('basalt_wall', 'assets/ui/sanctum/sanctum_basalt_wall.png?v=2.0');
  if (img && ctx) {
    try {
      _basaltWallPattern = ctx.createPattern(img, 'repeat');
      if (_basaltWallPattern) return _basaltWallPattern;
    } catch (e) {}
  }

  if (typeof document === 'undefined') return null;
  try {
    const cvs = document.createElement('canvas');
    cvs.width = 256;
    cvs.height = 256;
    const p = cvs.getContext('2d');
    if (!p) return null;

    p.fillStyle = '#0d0a18';
    p.fillRect(0, 0, 256, 256);

    const courses = [
      { y: 0, h: 52, blocks: [68, 116, 72] },
      { y: 52, h: 48, blocks: [128, 80, 48] },
      { y: 100, h: 60, blocks: [56, 140, 60] },
      { y: 160, h: 50, blocks: [100, 96, 60] },
      { y: 210, h: 46, blocks: [84, 116, 56] }
    ];

    const shades = [
      'rgba(26, 18, 44, 0.50)',
      'rgba(20, 14, 36, 0.40)',
      'rgba(32, 22, 54, 0.55)',
      'rgba(18, 12, 32, 0.35)',
      'rgba(28, 20, 48, 0.45)'
    ];

    let shadeIdx = 0;
    for (const c of courses) {
      let curX = 0;
      for (const bw of c.blocks) {
        p.fillStyle = shades[shadeIdx % shades.length];
        shadeIdx++;
        p.fillRect(curX, c.y, bw, c.h);

        for (let sy = c.y + 6; sy < c.y + c.h - 6; sy += 8) {
          const lineLen = Math.floor(bw * 0.6);
          const startX = curX + 4 + ((sy * 17) % Math.max(1, bw - lineLen - 8));
          p.fillStyle = 'rgba(168, 85, 247, 0.12)';
          p.fillRect(startX, sy, lineLen, 1);
        }

        const gx = curX + ((c.y * 31) % (bw - 6)) + 3;
        const gy = c.y + ((curX * 47) % (c.h - 6)) + 3;
        p.fillStyle = 'rgba(253, 230, 138, 0.35)';
        p.fillRect(gx, gy, 2, 1);

        if (curX > 0) {
          p.fillStyle = '#040208';
          p.fillRect(curX - 1, c.y, 2, c.h);
          p.fillStyle = 'rgba(168, 85, 247, 0.15)';
          p.fillRect(curX + 1, c.y, 1, c.h);
        }
        curX += bw;
      }

      if (c.y > 0) {
        p.fillStyle = '#040208';
        p.fillRect(0, c.y - 1, 256, 2);
        p.fillStyle = 'rgba(168, 85, 247, 0.18)';
        p.fillRect(0, c.y + 1, 256, 1);
      }
    }

    _basaltWallPattern = ctx.createPattern(cvs, 'repeat');
    return _basaltWallPattern;
  } catch (e) {
    return null;
  }
}

/**
 * 256x256 Ancient Cartographer Map Stone Pattern
 */
export function getCartographerPattern(ctx) {
  if (_cartographerPattern) return _cartographerPattern;

  const img = getSanctumImage('cartographer_table', 'assets/ui/sanctum/sanctum_cartographer_table.png?v=2.0');
  if (img && ctx) {
    try {
      _cartographerPattern = ctx.createPattern(img, 'repeat');
      if (_cartographerPattern) return _cartographerPattern;
    } catch (e) {}
  }

  if (typeof document === 'undefined') return null;
  try {
    const cvs = document.createElement('canvas');
    cvs.width = 256;
    cvs.height = 256;
    const p = cvs.getContext('2d');
    if (!p) return null;

    p.fillStyle = '#0f0a1c';
    p.fillRect(0, 0, 256, 256);

    p.fillStyle = 'rgba(26, 18, 48, 0.4)';
    p.fillRect(0, 0, 256, 64);
    p.fillRect(0, 128, 256, 64);

    p.strokeStyle = 'rgba(168, 85, 247, 0.12)';
    p.lineWidth = 1;
    for (let r = 20; r <= 80; r += 18) {
      p.beginPath();
      p.ellipse(64, 64, r, r * 0.8, Math.PI / 6, 0, Math.PI * 2);
      p.stroke();
    }
    for (let r = 24; r <= 90; r += 20) {
      p.beginPath();
      p.ellipse(192, 192, r, r * 0.75, Math.PI / 4, 0, Math.PI * 2);
      p.stroke();
    }

    p.fillStyle = 'rgba(168, 85, 247, 0.10)';
    p.fillRect(127, 0, 2, 256);
    p.fillRect(0, 127, 256, 2);

    _cartographerPattern = ctx.createPattern(cvs, 'repeat');
    return _cartographerPattern;
  } catch (e) {
    return null;
  }
}

/**
 * 256x256 Ancient Forge & Armory Pattern
 */
export function getForgePattern(ctx) {
  if (_forgePattern) return _forgePattern;

  const img = getSanctumImage('forge_iron', 'assets/ui/sanctum/sanctum_forge_iron.png?v=2.0');
  if (img && ctx) {
    try {
      _forgePattern = ctx.createPattern(img, 'repeat');
      if (_forgePattern) return _forgePattern;
    } catch (e) {}
  }

  if (typeof document === 'undefined') return null;
  try {
    const cvs = document.createElement('canvas');
    cvs.width = 256;
    cvs.height = 256;
    const p = cvs.getContext('2d');
    if (!p) return null;

    p.fillStyle = '#140e1f';
    p.fillRect(0, 0, 256, 256);

    p.fillStyle = 'rgba(38, 26, 56, 0.45)';
    for (let i = 0; i < 120; i++) {
      const rx = (i * 37) % 256;
      const ry = (i * 59) % 256;
      p.fillRect(rx, ry, 3, 2);
    }

    p.strokeStyle = 'rgba(234, 88, 12, 0.16)';
    p.lineWidth = 1;
    p.beginPath();
    p.moveTo(20, 40); p.lineTo(50, 60); p.lineTo(90, 55); p.lineTo(130, 75);
    p.moveTo(140, 160); p.lineTo(180, 185); p.lineTo(210, 175); p.lineTo(245, 190);
    p.stroke();

    _forgePattern = ctx.createPattern(cvs, 'repeat');
    return _forgePattern;
  } catch (e) {
    return null;
  }
}

/**
 * Master Architectural Chamber Backdrop Renderer.
 */
export function drawChamberArchitecture(ctx, lw, lh, F = 0) {
  ctx.save();

  // 1. Deep Obsidian Void
  const baseGrad = ctx.createLinearGradient(0, 0, 0, lh);
  baseGrad.addColorStop(0, '#05030d');
  baseGrad.addColorStop(0.5, '#0a0614');
  baseGrad.addColorStop(1, '#030206');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, lw, lh);

  // 2. Vaulted Basalt Masonry Wall
  const pat = getBasaltChamberPattern(ctx);
  if (pat) {
    ctx.save();
    ctx.globalAlpha = 0.50;
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, lw, lh);
    ctx.restore();
  }

  // 3. Directional Vignette
  const vig = ctx.createRadialGradient(lw / 2, lh * 0.45, 80, lw / 2, lh * 0.5, lw * 0.72);
  vig.addColorStop(0, 'rgba(45, 20, 80, 0.24)');
  vig.addColorStop(0.45, 'rgba(16, 8, 32, 0.60)');
  vig.addColorStop(0.85, 'rgba(7, 3, 14, 0.90)');
  vig.addColorStop(1, 'rgba(2, 1, 5, 0.98)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, lw, lh);

  // 4. Perimeter Carved Stone Pillars
  const pillarW = 22;
  const drawPillar = (px, isLeft) => {
    const pGrad = ctx.createLinearGradient(px, 0, px + pillarW, 0);
    pGrad.addColorStop(0, isLeft ? '#0b0716' : '#221738');
    pGrad.addColorStop(0.4, '#241a3c');
    pGrad.addColorStop(0.8, '#160f28');
    pGrad.addColorStop(1, isLeft ? '#1e1434' : '#080510');
    ctx.fillStyle = pGrad;
    ctx.fillRect(px, 0, pillarW, lh);

    // Fluting
    ctx.fillStyle = '#040208';
    ctx.fillRect(px + 5, 0, 2, lh);
    ctx.fillRect(px + 13, 0, 2, lh);
    ctx.fillStyle = 'rgba(168, 85, 247, 0.16)';
    ctx.fillRect(px + 7, 0, 1, lh);
    ctx.fillRect(px + 15, 0, 1, lh);

    // Pulse vein
    const pulse = 0.5 + 0.5 * Math.sin(F * 0.04 + (isLeft ? 0 : Math.PI));
    ctx.fillStyle = `rgba(168, 85, 247, ${0.15 + pulse * 0.15})`;
    ctx.fillRect(px + 10, 0, 1, lh);

    // Blocks
    for (let py = 0; py < lh; py += 56) {
      ctx.fillStyle = '#040208';
      ctx.fillRect(px, py - 1, pillarW, 2);
      ctx.fillStyle = 'rgba(217, 119, 6, 0.35)';
      ctx.fillRect(px + 1, py + 1, pillarW - 2, 1);
    }

    ctx.strokeStyle = 'rgba(217, 119, 6, 0.65)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, 0.5, pillarW - 1, lh - 1);
  };
  drawPillar(0, true);
  drawPillar(lw - pillarW, false);

  // 5. Vaulted Gothic Arch Header Lintel
  const archH = 8;
  const archGrad = ctx.createLinearGradient(0, 0, 0, archH);
  archGrad.addColorStop(0, '#2d1f46');
  archGrad.addColorStop(1, '#0e091a');
  ctx.fillStyle = archGrad;
  ctx.fillRect(pillarW, 0, lw - pillarW * 2, archH);
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.55)';
  ctx.lineWidth = 1;
  ctx.strokeRect(pillarW, 0, lw - pillarW * 2, archH);

  // 6. Corner Arcane Sconces
  const sconceY = 24;
  const pulse = 0.85 + Math.sin(F * 0.05) * 0.15;
  const drawSconce = (sx) => {
    const rad = ctx.createRadialGradient(sx, sconceY, 4, sx, sconceY, 130);
    rad.addColorStop(0, `rgba(192, 132, 252, ${0.35 * pulse})`);
    rad.addColorStop(0.35, `rgba(147, 51, 234, ${0.15 * pulse})`);
    rad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = rad;
    ctx.fillRect(sx - 130, sconceY - 130, 260, 260);

    ctx.fillStyle = '#0a0814';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(sx, sconceY, 6, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#fde68a';
    ctx.fillRect(sx - 1.5, sconceY - 1.5, 3, 3);
  };
  drawSconce(pillarW + 16);
  drawSconce(lw - pillarW - 16);

  ctx.restore();
}

/**
 * Master Sculpted Title Header Plaque
 */
export function drawMasterHeaderPlaque(ctx, x, y, w, h, F = 0, blinkProg = 0) {
  ctx.save();
  const rx = Math.round(x);
  const ry = Math.round(y);
  const rw = Math.round(w);
  const rh = Math.round(h);

  const imgCrest = getSanctumImage('header_crest', 'assets/ui/sanctum/sanctum_header_crest.png?v=2.0');
  if (imgCrest) {
    ctx.drawImage(imgCrest, rx, ry, rw, rh);
  } else {
    ctx.fillStyle = 'rgba(2, 1, 5, 0.85)';
    drawChamferedPanel(ctx, rx, ry + 2, rw, rh, 6);
    ctx.fill();

    const crestGrad = ctx.createLinearGradient(rx, ry, rx, ry + rh);
    crestGrad.addColorStop(0, '#2b1e42');
    crestGrad.addColorStop(0.4, '#1b122c');
    crestGrad.addColorStop(1, '#0c0816');
    ctx.fillStyle = crestGrad;
    drawChamferedPanel(ctx, rx, ry, rw, rh, 6);
    ctx.fill();

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.4;
    drawChamferedPanel(ctx, rx, ry, rw, rh, 6);
    ctx.stroke();

    ctx.fillStyle = '#fde68a';
    ctx.fillRect(rx + 12, ry + 1, rw - 24, 1.2);

    const gems = [rx + 16, rx + rw - 24];
    for (const gx of gems) {
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(gx, ry + 8, 8, 12);
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(gx + 2, ry + 10, 4, 8);
    }
  }

  // Header Typography
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const titleX = rx + 52;

  // 3D Drop Shadow
  ctx.font = 'bold 12.5px Cinzel, serif';
  ctx.fillStyle = '#020106';
  ctx.fillText('◈ THE DEVELOPER SANCTUM ◈', titleX + 1, ry + 12);

  // Sculpted Gold Face
  ctx.fillStyle = '#fde68a';
  ctx.shadowColor = '#d97706';
  ctx.shadowBlur = 6;
  ctx.fillText('◈ THE DEVELOPER SANCTUM ◈', titleX, ry + 11);
  ctx.shadowBlur = 0;

  // Subtitle Rubric
  ctx.font = 'italic 9px "Crimson Text", Georgia, serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('Authoritative Control Chamber · Floor Deployment & Sealed Archives', titleX, ry + 23);

  ctx.restore();
}

/**
 * At-a-Glance Telemetry Reliquary Plinth (4 Top Status Cards)
 */
export function drawReliquaryPlinth(ctx, x, y, w, h, options = {}) {
  const {
    type = 'floor',
    label = '',
    sub = null,
    accent = 'gold',
    isActive = false
  } = options;

  ctx.save();
  const rx = Math.round(x);
  const ry = Math.round(y);
  const rw = Math.round(w);
  const rh = Math.round(h);
  const c = 5;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  roundRect(ctx, rx, ry + 2, rw, rh, c);
  ctx.fill();

  const grad = ctx.createLinearGradient(rx, ry, rx, ry + rh);
  grad.addColorStop(0, '#1c1530');
  grad.addColorStop(0.5, '#120d22');
  grad.addColorStop(1, '#090614');
  ctx.fillStyle = grad;
  roundRect(ctx, rx, ry, rw, rh, c);
  ctx.fill();

  ctx.fillStyle = '#07040e';
  roundRect(ctx, rx + 3, ry + 3, rw - 6, rh - 6, c - 2);
  ctx.fill();

  ctx.fillStyle = accent === 'emerald' ? 'rgba(110, 231, 183, 0.35)'
    : (accent === 'crimson' ? 'rgba(252, 165, 165, 0.35)'
      : (accent === 'violet' ? 'rgba(216, 180, 254, 0.35)' : 'rgba(253, 230, 138, 0.35)'));
  ctx.fillRect(rx + c + 2, ry + 1, rw - (c * 2) - 4, 1);

  const borderCol = accent === 'emerald' ? 'rgba(16, 185, 129, 0.75)'
    : (accent === 'crimson' ? 'rgba(239, 68, 68, 0.75)'
      : (accent === 'violet' ? 'rgba(168, 85, 247, 0.75)' : 'rgba(217, 119, 6, 0.75)'));
  ctx.strokeStyle = borderCol;
  ctx.lineWidth = 1.3;
  roundRect(ctx, rx, ry, rw, rh, c);
  ctx.stroke();

  ctx.fillStyle = borderCol;
  ctx.fillRect(rx + 2.5, ry + 2.5, 1.5, 1.5);
  ctx.fillRect(rx + rw - 4, ry + 2.5, 1.5, 1.5);
  ctx.fillRect(rx + 2.5, ry + rh - 4, 1.5, 1.5);
  ctx.fillRect(rx + rw - 4, ry + rh - 4, 1.5, 1.5);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 9.5px Cinzel, serif';
  ctx.fillStyle = accent === 'emerald' ? '#4ade80'
    : (accent === 'crimson' ? '#fca5a5'
      : (accent === 'violet' ? '#c084fc' : '#fde68a'));
  ctx.fillText(label, rx + rw / 2, ry + rh / 2);

  ctx.restore();
}

/**
 * Master 3D Beveled Stone Navigation Tab Plaque
 */
export function drawNavigationTabPlaque(ctx, x, y, w, h, options = {}) {
  const {
    label = 'TAB',
    isActive = false,
    isHover = false,
    accentColor = 'gold',
    F = 0
  } = options;

  ctx.save();
  const rx = Math.round(x);
  const ry = Math.round(y);
  const rw = Math.round(w);
  const rh = Math.round(h);
  const chamfer = 4;
  const lift = isActive ? -1.5 : 0;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.beginPath();
  ctx.moveTo(rx + chamfer, ry + 2);
  ctx.lineTo(rx + rw - chamfer, ry + 2);
  ctx.lineTo(rx + rw, ry + rh + 2);
  ctx.lineTo(rx, ry + rh + 2);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(rx + chamfer, ry + lift);
  ctx.lineTo(rx + rw - chamfer, ry + lift);
  ctx.lineTo(rx + rw, ry + rh);
  ctx.lineTo(rx, ry + rh);
  ctx.closePath();

  const grad = ctx.createLinearGradient(rx, ry + lift, rx, ry + rh);
  if (isActive) {
    grad.addColorStop(0, '#381f54');
    grad.addColorStop(0.35, '#221238');
    grad.addColorStop(1, '#120822');
  } else if (isHover) {
    grad.addColorStop(0, '#281a42');
    grad.addColorStop(0.5, '#19102c');
    grad.addColorStop(1, '#0e081c');
  } else {
    grad.addColorStop(0, '#181128');
    grad.addColorStop(0.5, '#110b1e');
    grad.addColorStop(1, '#080512');
  }
  ctx.fillStyle = grad;
  ctx.fill();

  const pat = getBasaltChamberPattern(ctx);
  if (pat) {
    ctx.save();
    ctx.globalAlpha = isActive ? 0.38 : 0.22;
    ctx.fillStyle = pat;
    ctx.fill();
    ctx.restore();
  }

  ctx.strokeStyle = isActive
    ? '#ffd700'
    : (isHover ? '#ca8a04' : 'rgba(201, 168, 76, 0.40)');
  ctx.lineWidth = isActive ? 1.6 : 1.0;
  ctx.stroke();

  if (isActive) {
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(rx + chamfer + 2, ry + lift + 1, rw - (chamfer * 2) - 4, 1.4);

    ctx.fillStyle = '#ffd700';
    ctx.fillRect(rx + 2, ry + lift + 2, 2, 2);
    ctx.fillRect(rx + rw - 4, ry + lift + 2, 2, 2);

    ctx.fillStyle = 'rgba(245, 158, 11, 0.85)';
    ctx.fillRect(rx + 2, ry + rh - 2, rw - 4, 2);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = isActive ? 'bold 10px Cinzel, serif' : (isHover ? 'bold 9.5px Cinzel, serif' : '9px Cinzel, serif');
  ctx.fillStyle = isActive ? '#fde68a' : (isHover ? '#f1f5f9' : '#94a3b8');

  if (isActive) {
    ctx.shadowColor = '#d97706';
    ctx.shadowBlur = 6;
  }
  ctx.fillText(label, rx + rw / 2, ry + rh / 2 + (isActive ? -0.5 : 0));
  ctx.shadowBlur = 0;

  ctx.restore();
}

/**
 * Authoritative Tactile Carved Button
 */
export function drawCraftedButton(ctx, x, y, w, h, options = {}) {
  const {
    text = '',
    sub = null,
    icon = null,
    hotkey = null,
    variant = 'secondary', // 'primary' | 'secondary' | 'danger' | 'stepper' | 'tab'
    isSelected = false,
    isHover = false,
    isPressed = false,
    isDisabled = false,
    fontSize = 10,
    chamfer = 4
  } = options;

  ctx.save();
  const rx = Math.round(x);
  const ry = Math.round(y);
  const rw = Math.round(w);
  const rh = Math.round(h);
  const pressShift = isPressed ? 1.5 : 0;

  if (!isPressed) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.70)';
    roundRect(ctx, rx, ry + 2.5, rw, rh, chamfer);
    ctx.fill();
  }

  const grad = ctx.createLinearGradient(rx, ry + pressShift, rx, ry + rh + pressShift);
  let strokeCol = 'rgba(201, 168, 76, 0.45)';
  let textCol = '#f1f5f9';

  if (isDisabled) {
    grad.addColorStop(0, '#161320');
    grad.addColorStop(1, '#0c0a12');
    strokeCol = 'rgba(71, 85, 105, 0.35)';
    textCol = '#64748b';
  } else if (variant === 'primary') {
    if (isPressed) {
      grad.addColorStop(0, '#662d08');
      grad.addColorStop(1, '#3b1402');
    } else if (isHover) {
      grad.addColorStop(0, '#b45309');
      grad.addColorStop(0.5, '#78350f');
      grad.addColorStop(1, '#451a03');
    } else {
      grad.addColorStop(0, '#92400e');
      grad.addColorStop(0.5, '#5c2206');
      grad.addColorStop(1, '#321102');
    }
    strokeCol = isHover ? '#ffd700' : '#d97706';
    textCol = '#fef08a';
  } else if (variant === 'danger') {
    if (isPressed) {
      grad.addColorStop(0, '#380606');
      grad.addColorStop(1, '#180202');
    } else if (isHover) {
      grad.addColorStop(0, '#7f1d1d');
      grad.addColorStop(0.5, '#450a0a');
      grad.addColorStop(1, '#250606');
    } else {
      grad.addColorStop(0, '#571010');
      grad.addColorStop(0.5, '#330808');
      grad.addColorStop(1, '#1a0404');
    }
    strokeCol = isHover ? '#ef4444' : '#991b1b';
    textCol = '#fca5a5';
  } else if (variant === 'stepper') {
    if (isPressed) {
      grad.addColorStop(0, '#151022');
      grad.addColorStop(1, '#0a0814');
    } else if (isHover) {
      grad.addColorStop(0, '#2e1f48');
      grad.addColorStop(1, '#18112c');
    } else {
      grad.addColorStop(0, '#201636');
      grad.addColorStop(1, '#110c22');
    }
    strokeCol = isHover ? '#ffd700' : '#ca8a04';
    textCol = isHover ? '#fef08a' : '#fde68a';
  } else {
    if (isSelected) {
      grad.addColorStop(0, '#301d4d');
      grad.addColorStop(0.5, '#201336');
      grad.addColorStop(1, '#120a22');
      strokeCol = '#ffd700';
      textCol = '#fde68a';
    } else if (isPressed) {
      grad.addColorStop(0, '#120c22');
      grad.addColorStop(1, '#070410');
      strokeCol = '#ca8a04';
      textCol = '#cbd5e1';
    } else if (isHover) {
      grad.addColorStop(0, '#271b3e');
      grad.addColorStop(0.5, '#1a112c');
      grad.addColorStop(1, '#0f0a1c');
      strokeCol = '#ca8a04';
      textCol = '#f8fafc';
    } else {
      grad.addColorStop(0, '#1b132c');
      grad.addColorStop(0.5, '#120c20');
      grad.addColorStop(1, '#0a0614');
      strokeCol = 'rgba(201, 168, 76, 0.45)';
      textCol = '#cbd5e1';
    }
  }

  ctx.fillStyle = grad;
  roundRect(ctx, rx, ry + pressShift, rw, rh, chamfer);
  ctx.fill();

  if (!isPressed && !isDisabled) {
    ctx.fillStyle = variant === 'primary' ? 'rgba(254, 240, 138, 0.40)'
      : (variant === 'danger' ? 'rgba(248, 113, 113, 0.35)' : 'rgba(168, 85, 247, 0.22)');
    ctx.fillRect(rx + chamfer, ry + 1, rw - (chamfer * 2), 1);
  }

  ctx.strokeStyle = strokeCol;
  ctx.lineWidth = isSelected ? 1.6 : (isHover ? 1.4 : 1.0);
  roundRect(ctx, rx, ry + pressShift, rw, rh, chamfer);
  ctx.stroke();

  if (rw >= 60 && rh >= 24 && !isDisabled) {
    ctx.fillStyle = strokeCol;
    ctx.fillRect(rx + 2, ry + pressShift + 2, 1.5, 1.5);
    ctx.fillRect(rx + rw - 3.5, ry + pressShift + 2, 1.5, 1.5);
    ctx.fillRect(rx + 2, ry + pressShift + rh - 3.5, 1.5, 1.5);
    ctx.fillRect(rx + rw - 3.5, ry + pressShift + rh - 3.5, 1.5, 1.5);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = Typography.getFont(Typography.ROLES.BUTTON_SECONDARY, { size: Math.max(11, fontSize) });
  ctx.fillStyle = textCol;

  const contentY = ry + rh / 2 + pressShift;
  let fullText = text;
  if (icon && typeof icon === 'string' && icon.length <= 2) fullText = `${icon} ${fullText}`;
  if (hotkey) fullText = `${fullText} ${hotkey}`;

  if (variant === 'primary' && isHover) {
    ctx.shadowColor = '#d97706';
    ctx.shadowBlur = 6;
  }
  ctx.fillText(fullText, rx + rw / 2, contentY);
  ctx.shadowBlur = 0;

  ctx.restore();
}

/**
 * TAB 1: The Abyssal Cartographer's Table - Floor Tile Renderer
 */
export function drawCartographerFloorTile(ctx, x, y, w, h, options = {}) {
  const {
    floor = 1,
    name = '',
    biome = '',
    boss = null,
    isSelected = false,
    isHover = false,
    isPressed = false
  } = options;

  ctx.save();
  const rx = Math.round(x);
  const ry = Math.round(y);
  const rw = Math.round(w);
  const rh = Math.round(h);
  const pressShift = isPressed ? 1.5 : (isSelected ? -1 : 0);
  const c = 5;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  roundRect(ctx, rx, ry + 3, rw, rh, c);
  ctx.fill();

  const grad = ctx.createLinearGradient(rx, ry + pressShift, rx, ry + rh + pressShift);
  if (boss) {
    if (isSelected) {
      grad.addColorStop(0, '#361018');
      grad.addColorStop(0.5, '#22080e');
      grad.addColorStop(1, '#120408');
    } else if (isHover) {
      grad.addColorStop(0, '#280d14');
      grad.addColorStop(0.5, '#1a070c');
      grad.addColorStop(1, '#0e0306');
    } else {
      grad.addColorStop(0, '#1c080e');
      grad.addColorStop(0.5, '#120408');
      grad.addColorStop(1, '#090204');
    }
  } else if (isSelected) {
    grad.addColorStop(0, '#2d1b4a');
    grad.addColorStop(0.5, '#1e1134');
    grad.addColorStop(1, '#100820');
  } else if (isHover) {
    grad.addColorStop(0, '#241a38');
    grad.addColorStop(0.5, '#181026');
    grad.addColorStop(1, '#0e0918');
  } else {
    grad.addColorStop(0, '#191228');
    grad.addColorStop(0.5, '#110b1c');
    grad.addColorStop(1, '#080510');
  }
  ctx.fillStyle = grad;
  roundRect(ctx, rx, ry + pressShift, rw, rh, c);
  ctx.fill();

  const pat = getCartographerPattern(ctx);
  if (pat) {
    ctx.save();
    ctx.globalAlpha = isSelected ? 0.40 : 0.25;
    ctx.fillStyle = pat;
    roundRect(ctx, rx, ry + pressShift, rw, rh, c);
    ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = isSelected ? 'rgba(254, 240, 138, 0.45)' : (isHover ? 'rgba(201, 168, 76, 0.35)' : 'rgba(168, 85, 247, 0.18)');
  ctx.fillRect(rx + c, ry + pressShift + 1, rw - (c * 2), 1);

  if (boss) {
    ctx.strokeStyle = isSelected ? '#ffd700' : (isHover ? '#f87171' : 'rgba(239, 68, 68, 0.70)');
    ctx.lineWidth = isSelected ? 1.8 : 1.2;
  } else {
    ctx.strokeStyle = isSelected ? '#ffd700' : (isHover ? '#ca8a04' : 'rgba(201, 168, 76, 0.40)');
    ctx.lineWidth = isSelected ? 1.6 : 1.0;
  }
  roundRect(ctx, rx, ry + pressShift, rw, rh, c);
  ctx.stroke();

  if (isSelected) {
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
    ctx.lineWidth = 1;
    roundRect(ctx, rx + 2.5, ry + pressShift + 2.5, rw - 5, rh - 5, c - 1);
    ctx.stroke();
  }

  const rivetCol = boss ? (isSelected ? '#ffd700' : '#ef4444') : (isSelected ? '#ffd700' : '#ca8a04');
  ctx.fillStyle = rivetCol;
  ctx.fillRect(rx + 3, ry + pressShift + 3, 2, 2);
  ctx.fillRect(rx + rw - 5, ry + pressShift + 3, 2, 2);
  ctx.fillRect(rx + 3, ry + pressShift + rh - 5, 2, 2);
  ctx.fillRect(rx + rw - 5, ry + pressShift + rh - 5, 2, 2);

  // Left Cartographic Marker Badge (With Boss Icon if boss floor)
  const badgeX = rx + 14;
  const badgeY = ry + rh / 2 + pressShift;
  ctx.fillStyle = boss ? 'rgba(239, 68, 68, 0.25)' : (isSelected ? 'rgba(245, 158, 11, 0.25)' : 'rgba(168, 85, 247, 0.15)');
  ctx.beginPath();
  ctx.arc(badgeX + 6, badgeY, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = boss ? '#ef4444' : (isSelected ? '#ffd700' : 'rgba(201, 168, 76, 0.50)');
  ctx.lineWidth = 1;
  ctx.stroke();

  // Try loading boss icon image if available
  let bossImg = null;
  if (floor === 3) bossImg = getSanctumImage('boss_gorgaroth', 'assets/ui/sanctum/sanctum_boss_gorgaroth.png?v=2.0');
  else if (floor === 6) bossImg = getSanctumImage('boss_malakor', 'assets/ui/sanctum/sanctum_boss_malakor.png?v=2.0');
  else if (floor === 10) bossImg = getSanctumImage('boss_warden', 'assets/ui/sanctum/sanctum_boss_warden.png?v=2.0');

  if (bossImg) {
    ctx.drawImage(bossImg, badgeX - 2, badgeY - 8, 16, 16);
  } else {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.fillStyle = boss ? '#fca5a5' : (isSelected ? '#ffd700' : '#e2e8f0');
    ctx.fillText(String(floor), badgeX + 6, badgeY);
  }

  // Floor Title & Biome text
  ctx.textAlign = 'left';
  ctx.font = 'bold 11px Cinzel, serif';
  ctx.fillStyle = isSelected ? '#fde68a' : (isHover ? '#f8fafc' : '#e2e8f0');
  if (isSelected) {
    ctx.shadowColor = '#d97706';
    ctx.shadowBlur = 4;
  }
  ctx.fillText(`FLOOR ${floor} — ${name.toUpperCase()}`, rx + 38, ry + 16 + pressShift);
  ctx.shadowBlur = 0;

  if (boss) {
    ctx.font = Typography.getFont(Typography.ROLES.METADATA_SMALL, { weight: 'bold', size: 10.5 });
    ctx.fillStyle = isSelected ? '#fca5a5' : '#ef4444';
    ctx.fillText(`BOSS ENCOUNTER: ${boss.toUpperCase()}`, rx + 38, ry + 32 + pressShift);
  } else {
    ctx.font = Typography.getFont(Typography.ROLES.BODY_LORE, { size: 11 });
    ctx.fillStyle = isSelected ? '#cbd5e1' : '#94a3b8';
    ctx.fillText(`Biome Domain: ${biome.replace('_', ' ').toUpperCase()}`, rx + 38, ry + 32 + pressShift);
  }

  if (isSelected) {
    const pW = 88, pH = 18;
    const pX = rx + rw - pW - 12, pY = ry + rh / 2 - pH / 2 + pressShift;
    ctx.fillStyle = 'rgba(217, 119, 6, 0.28)';
    roundRect(ctx, pX, pY, pW, pH, 3);
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1;
    roundRect(ctx, pX, pY, pW, pH, 3);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.font = 'bold 8px Cinzel, serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('◈ ACTIVE TARGET', pX + pW / 2, pY + pH / 2);
  }

  ctx.restore();
}

/**
 * TAB 2: The Archive of Sealed Memories - Memory Plaque
 */
export function drawMemoryPlaque(ctx, x, y, w, h, options = {}) {
  const {
    id = '',
    title = '',
    subtitle = '',
    category = 'PROLOGUE',
    isSelected = false,
    isHover = false,
    isPressed = false
  } = options;

  ctx.save();
  const rx = Math.round(x);
  const ry = Math.round(y);
  const rw = Math.round(w);
  const rh = Math.round(h);
  const pressShift = isPressed ? 1 : 0;
  const c = 4;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  roundRect(ctx, rx, ry + 2, rw, rh, c);
  ctx.fill();

  const grad = ctx.createLinearGradient(rx, ry + pressShift, rx, ry + rh + pressShift);
  if (isSelected) {
    grad.addColorStop(0, '#2e1848');
    grad.addColorStop(0.5, '#1e0e32');
    grad.addColorStop(1, '#11071e');
  } else if (isHover) {
    grad.addColorStop(0, '#221634');
    grad.addColorStop(0.5, '#170e24');
    grad.addColorStop(1, '#0c0714');
  } else {
    grad.addColorStop(0, '#181024');
    grad.addColorStop(0.5, '#100a1a');
    grad.addColorStop(1, '#07040e');
  }
  ctx.fillStyle = grad;
  roundRect(ctx, rx, ry + pressShift, rw, rh, c);
  ctx.fill();

  ctx.strokeStyle = isSelected ? '#ffd700' : (isHover ? '#ca8a04' : 'rgba(201, 168, 76, 0.35)');
  ctx.lineWidth = isSelected ? 1.6 : 1.0;
  roundRect(ctx, rx, ry + pressShift, rw, rh, c);
  ctx.stroke();

  const sealX = rx + 14;
  const sealY = ry + rh / 2 + pressShift;
  const isEpilogue = id === 'epilogue_unmeasured_hour';
  let gemCol = '#475569';
  if (isEpilogue) gemCol = '#a855f7';
  else if (category.includes('BOSS')) gemCol = '#ef4444';
  else if (category.includes('VICTORY')) gemCol = '#f59e0b';
  else if (category.includes('HEROIC') || category.includes('BETRAYAL')) gemCol = '#ffd700';
  else if (isSelected) gemCol = '#ca8a04';

  ctx.fillStyle = isSelected ? gemCol : '#181224';
  ctx.beginPath();
  ctx.arc(sealX, sealY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isSelected ? '#ffd700' : gemCol;
  ctx.lineWidth = 1;
  ctx.stroke();

  if (isSelected) {
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(sealX - 1.5, sealY - 1.5, 3, 3);
  }

  ctx.textAlign = 'left';
  ctx.font = 'bold 10px Cinzel, serif';
  ctx.fillStyle = isSelected ? '#fde68a' : (isHover ? '#f8fafc' : '#e2e8f0');
  ctx.fillText(title, rx + 28, ry + 14 + pressShift);

  ctx.font = 'italic 8.5px "Crimson Text", serif';
  ctx.fillStyle = isSelected ? '#cbd5e1' : '#94a3b8';
  ctx.fillText(subtitle, rx + 28, ry + 27 + pressShift);

  ctx.textAlign = 'right';
  ctx.font = 'bold 7.5px Cinzel, serif';
  ctx.fillStyle = isSelected ? '#ffd700' : '#a78bfa';
  ctx.fillText(`[ ${category} ]`, rx + rw - 12, ry + rh / 2 + pressShift);

  ctx.restore();
}

/**
 * TAB 2: Detail Archival Reading Plinth (Right Side of Tab 2)
 */
export function drawArchivalReadingPlinth(ctx, x, y, w, h, selectedItem, isEpilogue, isCredits) {
  ctx.save();
  const rx = Math.round(x);
  const ry = Math.round(y);
  const rw = Math.round(w);
  const rh = Math.round(h);
  const c = 8;

  // Drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  roundRect(ctx, rx, ry + 3, rw, rh, c);
  ctx.fill();

  // Plinth body
  const grad = ctx.createLinearGradient(rx, ry, rx, ry + rh);
  grad.addColorStop(0, '#1c132c');
  grad.addColorStop(0.5, '#100a1c');
  grad.addColorStop(1, '#07040e');
  ctx.fillStyle = grad;
  roundRect(ctx, rx, ry, rw, rh, c);
  ctx.fill();

  // Masonry pattern overlay
  const pat = getBasaltChamberPattern(ctx);
  if (pat) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = pat;
    roundRect(ctx, rx, ry, rw, rh, c);
    ctx.fill();
    ctx.restore();
  }

  // Antique Bronze Framing
  ctx.strokeStyle = isEpilogue ? '#c084fc' : 'rgba(217, 119, 6, 0.65)';
  ctx.lineWidth = 1.6;
  roundRect(ctx, rx, ry, rw, rh, c);
  ctx.stroke();

  // Corner Rivets
  ctx.fillStyle = isEpilogue ? '#c084fc' : '#ffd700';
  ctx.fillRect(rx + 4, ry + 4, 2, 2);
  ctx.fillRect(rx + rw - 6, ry + 4, 2, 2);
  ctx.fillRect(rx + 4, ry + rh - 6, 2, 2);
  ctx.fillRect(rx + rw - 6, ry + rh - 6, 2, 2);

  // Inset Reading Slab
  const slabX = rx + 12, slabY = ry + 12, slabW = rw - 24, slabH = rh - 24;
  ctx.fillStyle = 'rgba(7, 4, 14, 0.92)';
  roundRect(ctx, slabX, slabY, slabW, slabH, 5);
  ctx.fill();
  ctx.strokeStyle = isEpilogue ? 'rgba(168, 85, 247, 0.45)' : 'rgba(201, 168, 76, 0.25)';
  ctx.lineWidth = 1;
  roundRect(ctx, slabX, slabY, slabW, slabH, 5);
  ctx.stroke();

  ctx.restore();
}

/**
 * TAB 3: The Ancient Armory - Weapon Pedestal Niche
 */
export function drawWeaponNiche(ctx, x, y, w, h, options = {}) {
  const {
    id = 'sword',
    name = 'STEEL SWORD',
    icon = '⚔️',
    isSelected = false,
    isHover = false,
    isPressed = false
  } = options;

  ctx.save();
  const rx = Math.round(x);
  const ry = Math.round(y);
  const rw = Math.round(w);
  const rh = Math.round(h);
  const pressShift = isPressed ? 1.5 : (isSelected ? -1.5 : 0);
  const c = 6;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  roundRect(ctx, rx, ry + 3, rw, rh, c);
  ctx.fill();

  const grad = ctx.createLinearGradient(rx, ry + pressShift, rx, ry + rh + pressShift);
  if (isSelected) {
    grad.addColorStop(0, '#381e10');
    grad.addColorStop(0.3, '#241208');
    grad.addColorStop(0.7, '#180a04');
    grad.addColorStop(1, '#0c0402');
  } else if (isHover) {
    grad.addColorStop(0, '#261b36');
    grad.addColorStop(0.5, '#1a1126');
    grad.addColorStop(1, '#0e0916');
  } else {
    grad.addColorStop(0, '#1a1326');
    grad.addColorStop(0.5, '#120c1c');
    grad.addColorStop(1, '#080510');
  }
  ctx.fillStyle = grad;
  roundRect(ctx, rx, ry + pressShift, rw, rh, c);
  ctx.fill();

  const forgePat = getForgePattern(ctx);
  if (forgePat) {
    ctx.save();
    ctx.globalAlpha = isSelected ? 0.45 : 0.25;
    ctx.fillStyle = forgePat;
    roundRect(ctx, rx, ry + pressShift, rw, rh, c);
    ctx.fill();
    ctx.restore();
  }

  ctx.strokeStyle = isSelected ? '#ffd700' : (isHover ? '#ca8a04' : 'rgba(201, 168, 76, 0.40)');
  ctx.lineWidth = isSelected ? 1.8 : 1.0;
  roundRect(ctx, rx, ry + pressShift, rw, rh, c);
  ctx.stroke();

  const cornerCol = isSelected ? '#ffd700' : (isHover ? '#d97706' : '#78350f');
  ctx.fillStyle = cornerCol;
  ctx.fillRect(rx + 3, ry + pressShift + 3, 3, 3);
  ctx.fillRect(rx + rw - 6, ry + pressShift + 3, 3, 3);
  ctx.fillRect(rx + 3, ry + pressShift + rh - 6, 3, 3);
  ctx.fillRect(rx + rw - 6, ry + pressShift + rh - 6, 3, 3);

  const cx = rx + rw / 2;
  const cy = ry + 26 + pressShift;
  ctx.fillStyle = isSelected ? 'rgba(245, 158, 11, 0.25)' : 'rgba(168, 85, 247, 0.12)';
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isSelected ? '#ffd700' : 'rgba(168, 85, 247, 0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Custom Pixel-Art Weapon Render
  PixelIconRenderer.draw(ctx, id || 'sword', cx, cy, 22, {
    glow: isSelected,
    glowColor: '#ffd700'
  });

  ctx.font = Typography.getFont(Typography.ROLES.HUD_LABEL, { weight: 'bold', size: 11 });
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isSelected ? '#fde68a' : (isHover ? '#f8fafc' : '#cbd5e1');
  if (isSelected) {
    ctx.shadowColor = '#d97706';
    ctx.shadowBlur = 4;
  }
  ctx.fillText(name.toUpperCase(), cx, ry + rh - 14 + pressShift);
  ctx.shadowBlur = 0;

  ctx.restore();
}

/**
 * TAB 3: Blacksmith Inscription Record Plate (Bottom of Tab 3)
 */
export function drawBlacksmithRecordPlate(ctx, x, y, w, h, sampleWep) {
  ctx.save();
  const rx = Math.round(x);
  const ry = Math.round(y);
  const rw = Math.round(w);
  const rh = Math.round(h);
  const c = 6;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  roundRect(ctx, rx, ry + 3, rw, rh, c);
  ctx.fill();

  const prevGrad = ctx.createLinearGradient(rx, ry, rx, ry + rh);
  prevGrad.addColorStop(0, '#1c142c');
  prevGrad.addColorStop(0.5, '#120d20');
  prevGrad.addColorStop(1, '#07050e');
  ctx.fillStyle = prevGrad;
  roundRect(ctx, rx, ry, rw, rh, c);
  ctx.fill();

  const forgePat = getForgePattern(ctx);
  if (forgePat) {
    ctx.save();
    ctx.globalAlpha = 0.30;
    ctx.fillStyle = forgePat;
    roundRect(ctx, rx, ry, rw, rh, c);
    ctx.fill();
    ctx.restore();
  }

  const borderCol = sampleWep ? (sampleWep.rarity.col || '#d97706') : '#d97706';
  ctx.strokeStyle = borderCol;
  ctx.lineWidth = 1.4;
  roundRect(ctx, rx, ry, rw, rh, c);
  ctx.stroke();

  ctx.fillStyle = borderCol;
  ctx.fillRect(rx + 3, ry + 3, 2, 2);
  ctx.fillRect(rx + rw - 5, ry + 3, 2, 2);
  ctx.fillRect(rx + 3, ry + rh - 5, 2, 2);
  ctx.fillRect(rx + rw - 5, ry + rh - 5, 2, 2);

  if (sampleWep) {
    // Left Badge Section
    const lW = 200;
    ctx.fillStyle = 'rgba(6, 4, 12, 0.85)';
    roundRect(ctx, rx + 12, ry + 12, lW, rh - 24, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.35)';
    ctx.lineWidth = 1;
    roundRect(ctx, rx + 12, ry + 12, lW, rh - 24, 4);
    ctx.stroke();

    // Weapon Icon & Rarity Crest
    PixelIconRenderer.draw(ctx, sampleWep.id || 'sword', rx + 12 + lW / 2, ry + 36, 28, {
      glow: true,
      glowColor: sampleWep.rarity.col || '#ffd700'
    });

    ctx.font = Typography.getFont(Typography.ROLES.HEADING_SECTION, { size: 12 });
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = sampleWep.rarity.col || '#ffffff';
    ctx.fillText(sampleWep.name.toUpperCase(), rx + 12 + lW / 2, ry + 64);

    ctx.font = Typography.getFont(Typography.ROLES.METADATA_SMALL, { weight: 'bold', size: 10 });
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`[ ${sampleWep.rarity.name.toUpperCase()} TIER ]`, rx + 12 + lW / 2, ry + 80);

    // Right Stat Grid (4 Tablets)
    const rX = rx + 12 + lW + 14;
    const rW = rw - (rX - rx) - 12;
    const sColW = (rW - 10) / 2;
    const sRowH = 34;

    const stats = [
      { label: 'BASE DAMAGE', val: `${sampleWep.damage.toFixed(1)} DMG`, icon: 'sword' },
      { label: 'COMBAT RANGE', val: `${sampleWep.range || 1.5} TILES`, icon: 'spear' },
      { label: 'ATTACK CADENCE', val: `${(sampleWep.cooldown * 1000).toFixed(0)} ms`, icon: 'speed' },
      { label: 'WEAPON CLASS', val: (sampleWep.type || 'MELEE').toUpperCase(), icon: 'shield' }
    ];

    stats.forEach((st, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const sx = rX + col * (sColW + 10);
      const sy = ry + 12 + row * (sRowH + 8);

      ctx.fillStyle = 'rgba(10, 7, 20, 0.85)';
      roundRect(ctx, sx, sy, sColW, sRowH, 3);
      ctx.fill();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 1;
      roundRect(ctx, sx, sy, sColW, sRowH, 3);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.font = Typography.getFont(Typography.ROLES.BODY_LORE, { size: 10 });
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(st.label, sx + 8, sy + 12);

      PixelIconRenderer.draw(ctx, st.icon, sx + 14, sy + 23, 13);

      ctx.font = Typography.getFont(Typography.ROLES.HUD_VALUE, { size: 11 });
      ctx.fillStyle = '#fde68a';
      ctx.fillText(st.val, sx + 25, sy + 24);
    });

    // Combat Mechanics & Forging Profile Tablet
    const profY = ry + 12 + sRowH * 2 + 14;
    const profH = 36;
    ctx.fillStyle = 'rgba(8, 5, 16, 0.85)';
    roundRect(ctx, rX, profY, rW, profH, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.30)';
    ctx.lineWidth = 1;
    roundRect(ctx, rX, profY, rW, profH, 3);
    ctx.stroke();

    let profText = 'Standard Balanced Royal Blade · Consistent cadence with moderate melee swing arc.';
    if (sampleWep.id === 'axe') profText = 'Heavy Cleaving Armament · Crushing frontal impact with 150% adversary stagger.';
    else if (sampleWep.id === 'dagger') profText = 'Shadow-Forged Edge · Ultra-rapid cadence with lethal critical strike multiplier.';
    else if (sampleWep.id === 'spear') profText = 'Obsidian Impaler · Extended reach penetrating through multiple aligned targets.';
    else if (sampleWep.id === 'bow') profText = 'Abyssal Longbow · High-velocity piercing projectile with distance knockback.';

    ctx.textAlign = 'left';
    ctx.font = 'bold 8.5px Cinzel, serif';
    ctx.fillStyle = '#fde68a';
    ctx.fillText('◈ COMBAT PROFILE & FORGE ATTRIBUTES', rX + 10, profY + 12);

    ctx.font = 'italic 9px "Crimson Text", Georgia, serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(profText, rX + 10, profY + 25);

    // Bottom Rubric Banner
    ctx.font = 'italic 9px "Crimson Text", Georgia, serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.fillText('Deterministic Forging Guaranteed — Weapon attributes and name are locked throughout the expedition.', rX + 4, ry + rh - 14);
  }

  ctx.restore();
}

/**
 * TAB 4: The Forbidden Arcane Control Altar - Specialized Modification Station
 */
export function drawModificationStation(ctx, x, y, w, h, options = {}) {
  const {
    id = 'weapon_lvl',
    title = '',
    subtitle = '',
    currentValText = '',
    accent = 'gold',
    isArmed = false
  } = options;

  ctx.save();
  const rx = Math.round(x);
  const ry = Math.round(y);
  const rw = Math.round(w);
  const rh = Math.round(h);
  const c = 6;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  roundRect(ctx, rx, ry + 3, rw, rh, c);
  ctx.fill();

  const grad = ctx.createLinearGradient(rx, ry, rx, ry + rh);
  grad.addColorStop(0, '#1c142c');
  grad.addColorStop(0.5, '#120c1e');
  grad.addColorStop(1, '#080510');
  ctx.fillStyle = grad;
  roundRect(ctx, rx, ry, rw, rh, c);
  ctx.fill();

  const pat = (id === 'weapon_lvl' || id === 'melee_dmg') ? getForgePattern(ctx) : getBasaltChamberPattern(ctx);
  if (pat) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = pat;
    roundRect(ctx, rx, ry, rw, rh, c);
    ctx.fill();
    ctx.restore();
  }

  // Station-specific architectural motif in background
  ctx.save();
  if (id === 'weapon_lvl') {
    // Forged Anvil & Hammer Motif
    ctx.fillStyle = 'rgba(217, 119, 6, 0.12)';
    ctx.fillRect(rx + rw - 44, ry + 36, 32, 12);
    ctx.fillRect(rx + rw - 36, ry + 48, 16, 8);
  } else if (id === 'bow_dmg') {
    // Ranged Bow & Arrow Motif
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(rx + rw - 24, ry + 44, 16, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rx + rw - 38, ry + 44);
    ctx.lineTo(rx + rw - 10, ry + 44);
    ctx.stroke();
  } else if (id === 'melee_dmg') {
    // Crossed Blades Motif
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.18)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(rx + rw - 36, ry + 32); ctx.lineTo(rx + rw - 14, ry + 56);
    ctx.moveTo(rx + rw - 14, ry + 32); ctx.lineTo(rx + rw - 36, ry + 56);
    ctx.stroke();
  } else if (id === 'cooldown') {
    // Chronomantic Astrolabe Concentric Rings
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(rx + rw - 26, ry + 44, 14, 0, Math.PI * 2);
    ctx.arc(rx + rw - 26, ry + 44, 8, 0, Math.PI * 2);
    ctx.stroke();
  } else if (id === 'max_hp') {
    // Vitality Heart Vessel
    ctx.fillStyle = 'rgba(239, 68, 68, 0.16)';
    ctx.beginPath();
    ctx.arc(rx + rw - 30, ry + 40, 6, 0, Math.PI * 2);
    ctx.arc(rx + rw - 20, ry + 40, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(rx + rw - 36, ry + 42);
    ctx.lineTo(rx + rw - 25, ry + 56);
    ctx.lineTo(rx + rw - 14, ry + 42);
    ctx.closePath();
    ctx.fill();
  } else if (id === 'resistance') {
    // Aegis Tower Shield
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.22)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(rx + rw - 34, ry + 32, 20, 24);
  }
  ctx.restore();

  let strokeCol = 'rgba(217, 119, 6, 0.70)';
  if (accent === 'emerald') strokeCol = 'rgba(16, 185, 129, 0.80)';
  else if (accent === 'crimson') strokeCol = 'rgba(239, 68, 68, 0.80)';
  else if (accent === 'violet') strokeCol = 'rgba(168, 85, 247, 0.80)';
  else if (accent === 'azure') strokeCol = 'rgba(56, 189, 248, 0.80)';

  ctx.strokeStyle = strokeCol;
  ctx.lineWidth = 1.4;
  roundRect(ctx, rx, ry, rw, rh, c);
  ctx.stroke();

  ctx.fillStyle = strokeCol;
  ctx.fillRect(rx + c + 4, ry + 1, rw - (c * 2) - 8, 1.2);

  ctx.fillRect(rx + 3, ry + 3, 2, 2);
  ctx.fillRect(rx + rw - 5, ry + 3, 2, 2);
  ctx.fillRect(rx + 3, ry + rh - 5, 2, 2);
  ctx.fillRect(rx + rw - 5, ry + rh - 5, 2, 2);

  ctx.textAlign = 'left';
  ctx.font = 'bold 10px Cinzel, serif';
  ctx.fillStyle = '#fde68a';
  ctx.fillText(title, rx + 14, ry + 16);

  ctx.textAlign = 'right';
  ctx.font = 'bold 11px Cinzel, serif';
  ctx.fillStyle = (accent === 'emerald') ? '#34d399'
    : ((accent === 'crimson') ? '#f87171'
      : ((accent === 'violet') ? '#c084fc' : '#fde68a'));
  ctx.fillText(currentValText, rx + rw - 14, ry + 16);

  ctx.textAlign = 'left';
  ctx.font = 'italic 8px "Crimson Text", serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(subtitle, rx + 14, ry + 28);

  ctx.restore();
}

/**
 * TAB 5: The Vitality Calibration Altar - Vitality Instrument
 */
export function drawVitalityInstrument(ctx, x, y, w, h, curHp, maxRange = 50) {
  ctx.save();
  const rx = Math.round(x);
  const ry = Math.round(y);
  const rw = Math.round(w);
  const rh = Math.round(h);
  const c = 6;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  roundRect(ctx, rx, ry + 2, rw, rh, c);
  ctx.fill();

  const grad = ctx.createLinearGradient(rx, ry, rx, ry + rh);
  grad.addColorStop(0, '#181126');
  grad.addColorStop(1, '#090610');
  ctx.fillStyle = grad;
  roundRect(ctx, rx, ry, rw, rh, c);
  ctx.fill();

  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 1.4;
  roundRect(ctx, rx, ry, rw, rh, c);
  ctx.stroke();

  const barY = ry + 44;
  const barH = 16;
  const barW = rw - 40;
  const barX = rx + 20;

  ctx.fillStyle = '#06040a';
  roundRect(ctx, barX, barY, barW, barH, 3);
  ctx.fill();
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.45)';
  ctx.lineWidth = 1;
  roundRect(ctx, barX, barY, barW, barH, 3);
  ctx.stroke();

  const fillPct = Math.max(0, Math.min(1, curHp / maxRange));
  const fillW = Math.max(4, Math.round(barW * fillPct));
  const fGrad = ctx.createLinearGradient(barX, barY, barX + fillW, barY);
  if (curHp <= 5) {
    fGrad.addColorStop(0, '#7f1d1d');
    fGrad.addColorStop(1, '#ef4444');
  } else if (curHp >= 40) {
    fGrad.addColorStop(0, '#064e3b');
    fGrad.addColorStop(1, '#10b981');
  } else {
    fGrad.addColorStop(0, '#78350f');
    fGrad.addColorStop(1, '#f59e0b');
  }
  ctx.fillStyle = fGrad;
  roundRect(ctx, barX + 1, barY + 1, fillW - 2, barH - 2, 2);
  ctx.fill();

  for (let hp = 0; hp <= maxRange; hp += 5) {
    const nx = barX + Math.round((hp / maxRange) * barW);
    const isMajor = (hp % 10 === 0);
    ctx.fillStyle = isMajor ? '#fde68a' : '#64748b';
    ctx.fillRect(nx - 0.5, barY + barH + 2, 1, isMajor ? 6 : 3);

    if (isMajor) {
      ctx.textAlign = 'center';
      ctx.font = 'bold 8px Cinzel, serif';
      ctx.fillText(String(hp), nx, barY + barH + 16);
    }
  }

  ctx.restore();
}

/**
 * TAB 6: The Sealed Covenant Ledger - Covenant Tablet
 */
export function drawCovenantTablet(ctx, x, y, w, h, isConsecrated = false) {
  ctx.save();
  const rx = Math.round(x);
  const ry = Math.round(y);
  const rw = Math.round(w);
  const rh = Math.round(h);
  const c = 8;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  roundRect(ctx, rx, ry + 4, rw, rh, c);
  ctx.fill();

  const grad = ctx.createLinearGradient(rx, ry, rx, ry + rh);
  grad.addColorStop(0, '#1c1530');
  grad.addColorStop(0.5, '#120d22');
  grad.addColorStop(1, '#07050e');
  ctx.fillStyle = grad;
  roundRect(ctx, rx, ry, rw, rh, c);
  ctx.fill();

  const pat = getBasaltChamberPattern(ctx);
  if (pat) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = pat;
    roundRect(ctx, rx, ry, rw, rh, c);
    ctx.fill();
    ctx.restore();
  }

  ctx.strokeStyle = isConsecrated ? '#ffd700' : 'rgba(217, 119, 6, 0.70)';
  ctx.lineWidth = 1.6;
  roundRect(ctx, rx, ry, rw, rh, c);
  ctx.stroke();

  // Embossed Physical Wax / Blood Seal (Top Right)
  const sealX = rx + rw - 36;
  const sealY = ry + 36;

  const sealImgName = isConsecrated ? 'covenant_seal_gold' : 'covenant_seal_crimson';
  const sealPath = isConsecrated ? 'assets/ui/sanctum/sanctum_covenant_seal_gold.png?v=2.0' : 'assets/ui/sanctum/sanctum_covenant_seal_crimson.png?v=2.0';
  const imgSeal = getSanctumImage(sealImgName, sealPath);

  if (imgSeal) {
    ctx.drawImage(imgSeal, sealX - 22, sealY - 22, 44, 44);
  } else {
    ctx.save();
    ctx.fillStyle = isConsecrated ? '#78350f' : '#450a0a';
    ctx.beginPath();
    ctx.arc(sealX, sealY, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isConsecrated ? '#ffd700' : '#ef4444';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.font = '12px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isConsecrated ? '#fde68a' : '#fca5a5';
    ctx.fillText(isConsecrated ? '✦' : '☠', sealX, sealY);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * TAB 6: Forged Expedition Integrity Plaque (Right Side of Tab 6)
 */
export function drawIntegrityGuaranteesPlaque(ctx, x, y, w, h) {
  ctx.save();
  const rx = Math.round(x);
  const ry = Math.round(y);
  const rw = Math.round(w);
  const rh = Math.round(h);
  const c = 8;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  roundRect(ctx, rx, ry + 4, rw, rh, c);
  ctx.fill();

  const grad = ctx.createLinearGradient(rx, ry, rx, ry + rh);
  grad.addColorStop(0, '#1c142c');
  grad.addColorStop(0.5, '#120d20');
  grad.addColorStop(1, '#07050e');
  ctx.fillStyle = grad;
  roundRect(ctx, rx, ry, rw, rh, c);
  ctx.fill();

  const forgePat = getForgePattern(ctx);
  if (forgePat) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = forgePat;
    roundRect(ctx, rx, ry, rw, rh, c);
    ctx.fill();
    ctx.restore();
  }

  ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)';
  ctx.lineWidth = 1.6;
  roundRect(ctx, rx, ry, rw, rh, c);
  ctx.stroke();

  // 4 Hex Corner Bolts
  const bolts = [
    [rx + 6, ry + 6], [rx + rw - 8, ry + 6],
    [rx + 6, ry + rh - 8], [rx + rw - 8, ry + rh - 8]
  ];
  for (const b of bolts) {
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(b[0], b[1], 3, 3);
  }

  ctx.restore();
}
