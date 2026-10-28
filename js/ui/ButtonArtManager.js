// =====================================================================
//  DUNGEON BREAK — js/ui/ButtonArtManager.js
//  Authoritative Pixel-Art UI Asset Manager & Unified Component Renderer
//  Source of Truth: Main Menu & Pause Menu Carved-Stone Gothic Aesthetics
//  - Deep violet and indigo carved stone with visible masonry & stone grain
//  - Weathered bronze & dark metal framing with gold corner mortise brackets
//  - Restrained stepped rivets and directional 3D lighting
//  - Unmistakable gold-highlighted selected states & tactile pressed responses
// =====================================================================

let _initialized = false;
let _stonePattern = null;

export function init() {
  if (_initialized) return;
  _initialized = true;
}

/**
 * Creates or retrieves a cached tileable procedural ancient violet stone masonry pattern.
 * Visibly reflects the Sunken Citadel's deep violet-indigo stone architecture.
 * Handcrafted 128x128 seamless texture with varied staggered blocks, chiseled joints,
 * and flecks of amethyst and gold dust. Free of harsh artificial wireframe grids.
 */
export function getStonePattern(ctx) {
  if (_stonePattern) return _stonePattern;
  if (typeof document === 'undefined') return null;

  try {
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 128;
    pCanvas.height = 128;
    const pCtx = pCanvas.getContext('2d');
    if (!pCtx) return null;

    // 1. Rich deep indigo-slate basalt base with dark purple undertone
    pCtx.fillStyle = '#140f24';
    pCtx.fillRect(0, 0, 128, 128);

    // 2. Subtle organic tonal block variation across masonry courses (Course height: 32px)
    const blocks = [
      // Row 0 (Y: 0..32)
      { x: 0, y: 0, w: 56, h: 32, shade: 'rgba(28, 20, 48, 0.40)' },
      { x: 56, y: 0, w: 72, h: 32, shade: 'rgba(22, 16, 40, 0.30)' },
      // Row 1 (Y: 32..64)
      { x: 0, y: 32, w: 76, h: 32, shade: 'rgba(24, 18, 44, 0.35)' },
      { x: 76, y: 32, w: 52, h: 32, shade: 'rgba(30, 22, 52, 0.45)' },
      // Row 2 (Y: 64..96)
      { x: 0, y: 64, w: 44, h: 32, shade: 'rgba(26, 18, 46, 0.38)' },
      { x: 44, y: 64, w: 84, h: 32, shade: 'rgba(20, 14, 38, 0.28)' },
      // Row 3 (Y: 96..128)
      { x: 0, y: 96, w: 88, h: 32, shade: 'rgba(28, 20, 50, 0.42)' },
      { x: 88, y: 96, w: 40, h: 32, shade: 'rgba(22, 16, 42, 0.32)' }
    ];

    for (const b of blocks) {
      pCtx.fillStyle = b.shade;
      pCtx.fillRect(b.x, b.y, b.w, b.h);
    }

    // 3. Staggered Mortar Joints & Chiseled Seams (soft, organic, dark with top highlight)
    // Horizontal course shadows & highlights
    const courseYs = [32, 64, 96, 128];
    for (const cy of courseYs) {
      // Recessed joint shadow
      pCtx.fillStyle = 'rgba(7, 5, 14, 0.70)';
      pCtx.fillRect(0, cy - 1, 128, 1);
      // Soft stone top bevel highlight
      if (cy < 128) {
        pCtx.fillStyle = 'rgba(168, 85, 247, 0.12)';
        pCtx.fillRect(0, cy, 128, 1);
      }
    }

    // Vertical mortar joints (staggered per course)
    const vertJoints = [
      { x: 56, y1: 0, y2: 32 },
      { x: 76, y1: 32, y2: 64 },
      { x: 44, y1: 64, y2: 96 },
      { x: 88, y1: 96, y2: 128 }
    ];

    for (const vj of vertJoints) {
      pCtx.fillStyle = 'rgba(7, 5, 14, 0.70)';
      pCtx.fillRect(vj.x, vj.y1, 1, vj.y2 - vj.y1);
      pCtx.fillStyle = 'rgba(168, 85, 247, 0.10)';
      pCtx.fillRect(vj.x + 1, vj.y1, 1, vj.y2 - vj.y1);
    }

    // 4. Subtle Horizontal Stone Grain Striations & Chisel Marks
    pCtx.fillStyle = 'rgba(192, 132, 252, 0.07)';
    pCtx.fillRect(4, 10, 24, 1);
    pCtx.fillRect(36, 22, 16, 1);
    pCtx.fillRect(68, 8, 30, 1);
    pCtx.fillRect(82, 20, 22, 1);

    pCtx.fillRect(10, 42, 28, 1);
    pCtx.fillRect(48, 54, 20, 1);
    pCtx.fillRect(84, 44, 32, 1);

    pCtx.fillRect(6, 76, 26, 1);
    pCtx.fillRect(52, 72, 34, 1);
    pCtx.fillRect(96, 84, 24, 1);

    pCtx.fillRect(16, 108, 36, 1);
    pCtx.fillRect(60, 118, 22, 1);
    pCtx.fillRect(94, 106, 28, 1);

    // 5. Fine Natural Weathering Flecks (Amethyst & Warm Gold)
    pCtx.fillStyle = 'rgba(168, 85, 247, 0.18)';
    pCtx.fillRect(14, 6, 2, 1);
    pCtx.fillRect(42, 18, 1, 2);
    pCtx.fillRect(92, 14, 2, 1);
    pCtx.fillRect(24, 48, 2, 1);
    pCtx.fillRect(64, 38, 1, 2);
    pCtx.fillRect(110, 52, 2, 1);
    pCtx.fillRect(32, 80, 2, 1);
    pCtx.fillRect(78, 90, 1, 2);
    pCtx.fillRect(18, 114, 2, 1);
    pCtx.fillRect(104, 122, 2, 1);

    pCtx.fillStyle = 'rgba(254, 240, 138, 0.08)';
    pCtx.fillRect(28, 14, 1, 1);
    pCtx.fillRect(80, 26, 1, 1);
    pCtx.fillRect(38, 60, 1, 1);
    pCtx.fillRect(118, 40, 1, 1);
    pCtx.fillRect(62, 86, 1, 1);
    pCtx.fillRect(48, 102, 1, 1);
    pCtx.fillRect(112, 114, 1, 1);

    _stonePattern = ctx.createPattern(pCanvas, 'repeat');
    return _stonePattern;
  } catch (e) {
    return null;
  }
}

/**
 * Authoritative 45-degree chamfered polygon path.
 */
export function drawChamferedPanel(ctx, x, y, w, h, chamfer = 5, fillStyle = null, strokeStyle = null, lineWidth = 1) {
  const rx = Math.round(x);
  const ry = Math.round(y);
  const rw = Math.round(w);
  const rh = Math.round(h);
  const c = Math.max(1, Math.min(chamfer, Math.floor(Math.min(rw, rh) / 2) - 1));

  ctx.beginPath();
  ctx.moveTo(rx + c, ry);
  ctx.lineTo(rx + rw - c, ry);
  ctx.lineTo(rx + rw, ry + c);
  ctx.lineTo(rx + rw, ry + rh - c);
  ctx.lineTo(rx + rw - c, ry + rh);
  ctx.lineTo(rx + c, ry + rh);
  ctx.lineTo(rx, ry + rh - c);
  ctx.lineTo(rx, ry + c);
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

/**
 * Authoritative Antique Bronze Corner Mortise Brackets with Stepped Rivet Studs.
 * Exactly matches Main Menu and Pause Menu corner filigree.
 */
export function drawCornerBrackets(ctx, x, y, w, h, len = 14, col = 'rgba(217, 119, 6, 0.85)') {
  ctx.save();
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.6;

  const rx = Math.round(x);
  const ry = Math.round(y);
  const rw = Math.round(w);
  const rh = Math.round(h);
  const l = Math.max(4, Math.min(len, Math.floor(Math.min(rw, rh) / 2) - 2));

  // Top-left
  ctx.beginPath();
  ctx.moveTo(rx, ry + l);
  ctx.lineTo(rx, ry);
  ctx.lineTo(rx + l, ry);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(rx + rw - l, ry);
  ctx.lineTo(rx + rw, ry);
  ctx.lineTo(rx + rw, ry + l);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(rx, ry + rh - l);
  ctx.lineTo(rx, ry + rh);
  ctx.lineTo(rx + l, ry + rh);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(rx + rw - l, ry + rh);
  ctx.lineTo(rx + rw, ry + rh);
  ctx.lineTo(rx + rw, ry + rh - l);
  ctx.stroke();

  // Stepped faceted rivet studs with metallic specular core
  const rivetOffset = 3.5;
  const rivets = [
    [rx + rivetOffset, ry + rivetOffset],
    [rx + rw - rivetOffset, ry + rivetOffset],
    [rx + rivetOffset, ry + rh - rivetOffset],
    [rx + rw - rivetOffset, ry + rh - rivetOffset]
  ];

  rivets.forEach(([px, py]) => {
    // Bronze rivet base
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(px, py, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Specular gold pinhead
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(Math.round(px) - 0.5, Math.round(py) - 0.5, 1, 1);
  });

  ctx.restore();
}

/**
 * Signature Molten Forge Ember Cracks.
 * Displayed exclusively on important active/selected states (such as Start Journey or Resume Expedition).
 */
export function drawForgeEmberCracks(ctx, x, y, w, h, F = 0, isReducedMotion = false) {
  ctx.save();
  const rx = Math.round(x);
  const ry = Math.round(y);
  const rw = Math.round(w);
  const rh = Math.round(h);

  const t = isReducedMotion ? 1.0 : (0.5 + 0.5 * Math.sin((F || 0) * 0.08));
  const glowColor = `rgba(249, 115, 22, ${0.50 + t * 0.35})`;

  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 1.2;
  ctx.shadowColor = '#ea580c';
  ctx.shadowBlur = isReducedMotion ? 0 : 5;

  // Top forge fissure line
  ctx.beginPath();
  ctx.moveTo(rx + 16, ry + 2);
  ctx.lineTo(rx + 36, ry + 4);
  ctx.lineTo(rx + 58, ry + 2);
  ctx.lineTo(rx + rw * 0.45, ry + 3);
  ctx.lineTo(rx + rw * 0.65, ry + 2);
  ctx.lineTo(rx + rw - 36, ry + 4);
  ctx.lineTo(rx + rw - 16, ry + 2);
  ctx.stroke();

  // Bottom forge fissure line
  ctx.beginPath();
  ctx.moveTo(rx + 24, ry + rh - 2);
  ctx.lineTo(rx + 48, ry + rh - 4);
  ctx.lineTo(rx + rw * 0.4, ry + rh - 3);
  ctx.lineTo(rx + rw * 0.7, ry + rh - 4);
  ctx.lineTo(rx + rw - 24, ry + rh - 2);
  ctx.stroke();

  // Hot ember cores
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(rx + 36, ry + 3, 2, 2);
  ctx.fillRect(rx + rw * 0.5, ry + 2, 2, 2);
  ctx.fillRect(rx + rw - 38, ry + 3, 2, 2);
  ctx.fillRect(rx + 48, ry + rh - 4, 2, 2);
  ctx.fillRect(rx + rw * 0.6, ry + rh - 4, 2, 2);

  ctx.restore();
}

/**
 * Authoritative Master Chassis / Panel Renderer.
 * Produces the multi-layered obsidian, deep violet masonry & antique bronze casing matching PauseMenu and MainMenu.
 */
export function drawStonePanel(ctx, x, y, w, h, options = {}) {
  const {
    chamfer = 12,
    title = null,
    subtitle = null,
    headerAccent = 'gold', // 'gold' | 'crimson' | 'violet' | 'azure'
    hasCornerBrackets = true,
    bracketLen = 16,
    bracketColor = 'rgba(217, 119, 6, 0.85)',
    outerBorderColor = 'rgba(217, 119, 6, 0.75)',
    innerBorderColor = 'rgba(201, 168, 76, 0.35)',
    bgStyle = null
  } = options;

  ctx.save();
  const rx = Math.round(x);
  const ry = Math.round(y);
  const rw = Math.round(w);
  const rh = Math.round(h);

  // 1. Physical Cast Drop Shadow
  ctx.fillStyle = 'rgba(1, 2, 6, 0.88)';
  drawChamferedPanel(ctx, rx, ry + 4, rw, rh, chamfer);
  ctx.fill();

  // 2. Outer Forged Steel/Basalt Casing
  const steelGrad = ctx.createLinearGradient(rx, ry, rx + rw, ry + rh);
  steelGrad.addColorStop(0, '#2d2442');
  steelGrad.addColorStop(0.35, '#1e1832');
  steelGrad.addColorStop(0.70, '#141024');
  steelGrad.addColorStop(1, '#0c0a18');
  ctx.fillStyle = steelGrad;
  drawChamferedPanel(ctx, rx, ry, rw, rh, chamfer);
  ctx.fill();

  // 3. Outer Steel / Bronze Beveled Rim
  ctx.strokeStyle = outerBorderColor;
  ctx.lineWidth = 1.6;
  drawChamferedPanel(ctx, rx, ry, rw, rh, chamfer);
  ctx.stroke();

  // 4. Inner Violet Basalt Stone Frame
  const inC = Math.max(2, chamfer - 3);
  const basaltGrad = bgStyle || ctx.createLinearGradient(rx, ry, rx, ry + rh);
  if (!bgStyle) {
    basaltGrad.addColorStop(0, '#1d1534');
    basaltGrad.addColorStop(0.5, '#120d24');
    basaltGrad.addColorStop(1, '#0a0818');
  }
  ctx.fillStyle = basaltGrad;
  drawChamferedPanel(ctx, rx + 4, ry + 4, rw - 8, rh - 8, inC);
  ctx.fill();

  // 5. Subtle Stone Texture Overlay (visibly violet masonry, restrained organic tone)
  const pat = getStonePattern(ctx);
  if (pat) {
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = pat;
    drawChamferedPanel(ctx, rx + 4, ry + 4, rw - 8, rh - 8, inC);
    ctx.fill();
    ctx.restore();
  }

  // 6. Inner Etched Bronze / Amethyst Channel
  ctx.strokeStyle = innerBorderColor;
  ctx.lineWidth = 1.0;
  drawChamferedPanel(ctx, rx + 6, ry + 6, rw - 12, rh - 12, Math.max(2, inC - 2));
  ctx.stroke();

  // 7. Corner Mortise Brackets with Rivets
  if (hasCornerBrackets) {
    drawCornerBrackets(ctx, rx + 7, ry + 7, rw - 14, rh - 14, bracketLen, bracketColor);
  }

  // 8. Optional Title Header Inscription
  if (title) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Drop shadow
    ctx.fillStyle = '#02040a';
    ctx.font = 'bold 15px Cinzel, serif';
    ctx.fillText(title, rx + rw / 2 + 1, ry + 17);

    // Glowing face text
    ctx.fillStyle = headerAccent === 'crimson' ? '#fca5a5' : (headerAccent === 'violet' ? '#f3e8ff' : '#fde68a');
    ctx.shadowColor = headerAccent === 'crimson' ? '#dc2626' : (headerAccent === 'violet' ? '#a855f7' : '#d97706');
    ctx.shadowBlur = 8;
    ctx.fillText(title, rx + rw / 2, ry + 16);
    ctx.shadowBlur = 0;

    if (subtitle) {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
      ctx.font = 'italic 10.5px "Crimson Text", serif';
      ctx.fillText(subtitle, rx + rw / 2, ry + 36);
    }
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Authoritative Carved-Stone Button Face Renderer.
 * High-craftsmanship Canvas 2D procedural rendering that matches the Main Menu's
 * deep violet/indigo carved stone, visible masonry grain, worn edges, and directional lighting.
 */
export function drawStoneButtonFace(ctx, x, y, w, h, stateKey = 'normal', options = {}) {
  const {
    chamfer = 4,
    isPrimary = false,
    isDanger = false,
    isGift = false,
    F = 0,
    isReducedMotion = false
  } = options;

  const rx = Math.round(x);
  const ry = Math.round(y);
  const rw = Math.round(w);
  const rh = Math.round(h);
  const c = Math.max(2, Math.min(chamfer, Math.floor(Math.min(rw, rh) / 3)));

  const isPressed = stateKey === 'pressed' || stateKey === 'primary_pressed';
  const isHover = stateKey === 'hover' || stateKey === 'primary_hover' || stateKey === 'gift_hover';
  const isSelected = stateKey === 'selected' || stateKey === 'primary_selected' || isHover;
  const isFocused = isSelected;
  const isDisabled = stateKey === 'disabled';
  const pressDy = isPressed ? 1 : 0;

  ctx.save();

  // 1. Physical Cast Drop Shadow
  if (!isPressed) {
    ctx.fillStyle = 'rgba(1, 2, 6, 0.75)';
    drawChamferedPanel(ctx, rx, ry + 2.5, rw, rh, c);
    ctx.fill();
  }

  // 2. Base Carved-Stone Face Gradient (Deep violet & indigo carved dungeon stone)
  const stoneGrad = ctx.createLinearGradient(rx, ry + pressDy, rx, ry + pressDy + rh);

  if (isDisabled) {
    // Desaturated subdued cold slate stone
    stoneGrad.addColorStop(0, '#222836');
    stoneGrad.addColorStop(0.5, '#171c26');
    stoneGrad.addColorStop(1, '#0e121a');
  } else if (isDanger) {
    // Deep carved blood-obsidian
    if (isPressed) {
      stoneGrad.addColorStop(0, '#26080c');
      stoneGrad.addColorStop(0.5, '#180407');
      stoneGrad.addColorStop(1, '#0e0204');
    } else if (isFocused) {
      stoneGrad.addColorStop(0, '#4a1520');
      stoneGrad.addColorStop(0.5, '#320d16');
      stoneGrad.addColorStop(1, '#1e060c');
    } else {
      stoneGrad.addColorStop(0, '#360d16');
      stoneGrad.addColorStop(0.5, '#24080e');
      stoneGrad.addColorStop(1, '#140307');
    }
  } else if (isPrimary) {
    // Vanguard plinth: rich violet-obsidian core with warm golden undertone
    if (isPressed) {
      stoneGrad.addColorStop(0, '#261422');
      stoneGrad.addColorStop(0.5, '#190d18');
      stoneGrad.addColorStop(1, '#0e060d');
    } else if (isFocused) {
      stoneGrad.addColorStop(0, '#46283c');
      stoneGrad.addColorStop(0.4, '#321c30');
      stoneGrad.addColorStop(1, '#1c0f24');
    } else {
      stoneGrad.addColorStop(0, '#361e2e');
      stoneGrad.addColorStop(0.5, '#241326');
      stoneGrad.addColorStop(1, '#15091c');
    }
  } else if (isGift) {
    // Sacred last ember plinth: ethereal violet amethyst
    if (isPressed) {
      stoneGrad.addColorStop(0, '#220e2e');
      stoneGrad.addColorStop(1, '#0e0416');
    } else if (isFocused) {
      stoneGrad.addColorStop(0, '#441a58');
      stoneGrad.addColorStop(0.5, '#2e1040');
      stoneGrad.addColorStop(1, '#180628');
    } else {
      stoneGrad.addColorStop(0, '#341346');
      stoneGrad.addColorStop(0.5, '#200a30');
      stoneGrad.addColorStop(1, '#12041e');
    }
  } else if (isFocused) {
    // Selected / Hover state: luminous indigo-violet carved stone
    stoneGrad.addColorStop(0, '#463278');
    stoneGrad.addColorStop(0.35, '#32235c');
    stoneGrad.addColorStop(0.70, '#241748');
    stoneGrad.addColorStop(1, '#160e32');
  } else {
    // Normal state: visibly textured purple dungeon stone with prominent indigo-amethyst body
    stoneGrad.addColorStop(0, '#34235c');
    stoneGrad.addColorStop(0.35, '#271a4a');
    stoneGrad.addColorStop(0.70, '#1c123a');
    stoneGrad.addColorStop(1, '#120b28');
  }

  ctx.fillStyle = stoneGrad;
  drawChamferedPanel(ctx, rx, ry + pressDy, rw, rh, c);
  ctx.fill();

  // 3. Subtle Procedural Stone Strata & Grain (Chiseled masonry lines & flecks)
  if (!isDisabled) {
    ctx.save();
    drawChamferedPanel(ctx, rx, ry + pressDy, rw, rh, c);
    ctx.clip();

    // Subtle horizontal stone chisel courses (visible masonry striations)
    const midY1 = Math.round(ry + pressDy + rh * 0.38);
    const midY2 = Math.round(ry + pressDy + rh * 0.68);

    // Chisel groove 1
    ctx.fillStyle = 'rgba(216, 180, 254, 0.16)';
    ctx.fillRect(rx + c + 2, midY1 - 1, rw - (c + 2) * 2, 1);
    ctx.fillStyle = 'rgba(6, 4, 16, 0.70)';
    ctx.fillRect(rx + c + 2, midY1, rw - (c + 2) * 2, 1);

    // Chisel groove 2 (if tall enough)
    if (rh >= 26) {
      ctx.fillStyle = 'rgba(216, 180, 254, 0.12)';
      ctx.fillRect(rx + c + 4, midY2 - 1, rw - (c + 4) * 2, 1);
      ctx.fillStyle = 'rgba(6, 4, 16, 0.60)';
      ctx.fillRect(rx + c + 4, midY2, rw - (c + 4) * 2, 1);
    }

    // Weathered stone micro-flecks
    ctx.fillStyle = 'rgba(192, 132, 252, 0.22)';
    ctx.fillRect(rx + c + 8, ry + pressDy + 4, 2, 1);
    ctx.fillRect(rx + rw - c - 12, ry + pressDy + rh - 6, 2, 1);
    ctx.fillRect(rx + rw * 0.4, ry + pressDy + 6, 1, 2);

    // Overlay cached masonry pattern for tactile depth
    const pat = getStonePattern(ctx);
    if (pat) {
      ctx.globalAlpha = isFocused ? 0.30 : 0.38;
      ctx.fillStyle = pat;
      ctx.fillRect(rx, ry + pressDy, rw, rh);
    }
    ctx.restore();
  }

  // 4. Directional Physical 3D Light (1px Specular Top Bevel & Bottom Shadow)
  ctx.save();
  drawChamferedPanel(ctx, rx, ry + pressDy, rw, rh, c);
  ctx.clip();

  // Top specular highlight edge
  const specAlpha = isFocused ? 0.42 : (isDisabled ? 0.12 : 0.28);
  ctx.fillStyle = isDanger
    ? `rgba(254, 202, 202, ${specAlpha})`
    : (isFocused ? `rgba(254, 240, 138, ${specAlpha})` : `rgba(233, 213, 255, ${specAlpha})`);
  ctx.fillRect(rx + c, ry + pressDy + 1, rw - c * 2, 1);

  // Bottom recessed shadow edge
  ctx.fillStyle = 'rgba(4, 2, 10, 0.80)';
  ctx.fillRect(rx + c, ry + pressDy + rh - 2, rw - c * 2, 1);

  // Inset shadow for pressed state
  if (isPressed) {
    ctx.fillStyle = 'rgba(2, 1, 6, 0.70)';
    ctx.fillRect(rx, ry + pressDy, rw, 3);
  }
  ctx.restore();

  // 5. Outer Beveled Forged Metal Frame
  if (isFocused) {
    // Unmistakable antique gold or ruby frame
    ctx.shadowColor = isDanger ? '#ef4444' : (isPrimary ? '#f59e0b' : (isGift ? '#c084fc' : '#f59e0b'));
    ctx.shadowBlur = isPrimary ? 8 : 5;

    const frameGrad = ctx.createLinearGradient(rx, ry + pressDy, rx + rw, ry + pressDy + rh);
    if (isDanger) {
      frameGrad.addColorStop(0, '#fca5a5');
      frameGrad.addColorStop(0.4, '#ef4444');
      frameGrad.addColorStop(1, '#991b1b');
    } else if (isPrimary) {
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
      frameGrad.addColorStop(0.35, '#f59e0b');
      frameGrad.addColorStop(0.70, '#b45309');
      frameGrad.addColorStop(1, '#78350f');
    }

    ctx.strokeStyle = frameGrad;
    ctx.lineWidth = isPrimary ? 1.6 : 1.3;
    drawChamferedPanel(ctx, rx, ry + pressDy, rw, rh, c);
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else if (isDisabled) {
    // Desaturated oxidized iron frame
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.50)';
    ctx.lineWidth = 1.0;
    drawChamferedPanel(ctx, rx, ry + pressDy, rw, rh, c);
    ctx.stroke();
  } else {
    // Normal state: understated antique weathered bronze frame
    const normGrad = ctx.createLinearGradient(rx, ry + pressDy, rx + rw, ry + pressDy + rh);
    if (isDanger) {
      normGrad.addColorStop(0, 'rgba(239, 68, 68, 0.80)');
      normGrad.addColorStop(1, 'rgba(153, 27, 27, 0.70)');
    } else if (isPrimary) {
      normGrad.addColorStop(0, 'rgba(245, 158, 11, 0.90)');
      normGrad.addColorStop(1, 'rgba(180, 83, 9, 0.75)');
    } else {
      normGrad.addColorStop(0, 'rgba(217, 119, 6, 0.85)');
      normGrad.addColorStop(0.5, 'rgba(180, 83, 9, 0.70)');
      normGrad.addColorStop(1, 'rgba(115, 50, 10, 0.65)');
    }
    ctx.strokeStyle = normGrad;
    ctx.lineWidth = isPrimary ? 1.4 : 1.2;
    drawChamferedPanel(ctx, rx, ry + pressDy, rw, rh, c);
    ctx.stroke();
  }

  // 6. Stepped Corner Rivet Studs (Restrained, faceted)
  if (rw >= 40 && rh >= 18) {
    const rivetOffset = Math.max(3, c + 1.5);
    const rivets = [
      [rx + rivetOffset, ry + pressDy + 2.5],
      [rx + rw - rivetOffset, ry + pressDy + 2.5],
      [rx + rivetOffset, ry + pressDy + rh - 2.5],
      [rx + rw - rivetOffset, ry + pressDy + rh - 2.5]
    ];

    const rivBaseCol = isFocused
      ? (isDanger ? '#ef4444' : (isPrimary ? '#f59e0b' : '#d97706'))
      : (isDisabled ? '#1e2433' : (isDanger ? '#7f1d1d' : '#92400e'));
    const rivSpecCol = isFocused
      ? (isDanger ? '#fee2e2' : '#fef08a')
      : (isDisabled ? '#475569' : '#fde68a');

    for (const [rivX, rivY] of rivets) {
      ctx.fillStyle = rivBaseCol;
      ctx.fillRect(Math.round(rivX) - 1, Math.round(rivY) - 1, 2, 2);
      ctx.fillStyle = rivSpecCol;
      ctx.fillRect(Math.round(rivX), Math.round(rivY), 1, 1);
    }
  }

  // 7. Molten Forge Cracks ONLY for Important Active/Selected States
  if (isPrimary && isFocused) {
    drawForgeEmberCracks(ctx, rx, ry + pressDy, rw, rh, F, isReducedMotion);
  }

  ctx.restore();
}

/**
 * Authoritative Carved-Stone Button Renderer.
 * Supports Normal, Hover, Selected, Disabled, Pressed, Danger, Primary, and Gift states.
 * Scales seamlessly to any width and height using procedural carved-stone geometry.
 */
export function drawStoneButton(ctx, arg1, arg2, arg3, arg4, arg5, arg6) {
  let x, y, w, h, options;
  if (typeof arg1 === 'string') {
    x = arg2;
    y = arg3;
    w = arg4;
    h = arg5;
    options = Object.assign({}, typeof arg6 === 'object' ? arg6 : {});
    if (!options.text && !options.label) options.text = arg1;
  } else {
    x = arg1;
    y = arg2;
    w = arg3;
    h = arg4;
    options = Object.assign({}, typeof arg5 === 'object' ? arg5 : {});
  }

  const text = options.text ?? options.label ?? '';
  const subtext = options.subtext ?? options.sublabel ?? '';
  const icon = options.icon ?? '';
  const isHover = !!options.isHover;
  const isSelected = !!(options.isSelected || options.isFocused || options.isActive);
  const isFocused = isSelected || isHover;
  const isDisabled = !!options.isDisabled;
  const isDanger = !!(options.isDanger || options.variant === 'danger');
  const isPrimary = !!(options.isPrimary || options.variant === 'primary');
  const isGift = !!(options.isGift || options.variant === 'gift');
  const isPressed = !!options.isPressed;
  const hotkey = options.hotkey ?? '';
  const align = options.align ?? 'center';
  const chamfer = options.chamfer ?? options.cornerSize ?? (isPrimary ? 5 : 4);
  const fontSize = options.fontSize ?? (isPrimary ? 11.5 : (h <= 24 ? 9.0 : 10.5));
  const subFontSize = options.subFontSize ?? 8.5;
  const customBadge = options.customBadge ?? null;
  const alpha = options.alpha ?? 1.0;

  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;

  const rx = Number.isFinite(x) ? Math.round(x) : 0;
  const ry = Number.isFinite(y) ? Math.round(y) : 0;
  const rw = Number.isFinite(w) && w > 0 ? Math.round(w) : 100;
  const rh = Number.isFinite(h) && h > 0 ? Math.round(h) : 30;
  const pressDy = isPressed ? 1 : 0;

  // Determine State Key
  const stateKey = ButtonArtManager.getStateKey(isPrimary, isGift, isDisabled, isSelected, isHover, isPressed, isDanger);

  // 1. Render Handcrafted Violet Carved-Stone Surface
  drawStoneButtonFace(ctx, rx, ry, rw, rh, stateKey, {
    chamfer,
    isPrimary,
    isDanger,
    isGift,
    F: (typeof GameState !== 'undefined' && GameState.timer) ? GameState.timer * 60 : 0,
    isReducedMotion: !!(typeof GameState !== 'undefined' && GameState.REDUCED_MOTION)
  });

  // 2. Content Typography & Layout
  const textY = ry + pressDy + rh / 2;

  // Text Color Decision
  let textColor = '#ede8df';
  if (isDisabled) {
    textColor = '#64748b';
  } else if (isDanger) {
    textColor = isFocused ? '#ffffff' : '#fca5a5';
  } else if (isSelected) {
    textColor = isPrimary ? '#ffffff' : (isGift ? '#ffffff' : '#fef08a');
  } else if (isHover) {
    textColor = '#ffffff';
  } else if (isPrimary) {
    textColor = '#fef3c7';
  }

  // Icon / Bullet color
  const iconCol = isDanger
    ? (isFocused ? '#f87171' : '#ef4444')
    : (isPrimary ? '#f59e0b' : (isGift ? '#c084fc' : '#d97706'));

  // Parse font specification
  const fontSpec = typeof fontSize === 'string' && fontSize.includes('px')
    ? fontSize
    : `bold ${fontSize}px Cinzel, serif`;

  if (align === 'left') {
    const leftPad = Math.max(8, Math.min(14, Math.floor(rw * 0.08)));
    let curX = rx + leftPad;

    if (icon) {
      ctx.fillStyle = isDisabled ? '#475569' : iconCol;
      ctx.font = '11px Cinzel, serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, curX, textY);
      curX += 16;
    }

    // Label with drop shadow
    ctx.fillStyle = '#010204';
    ctx.font = fontSpec;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, curX + 1, textY + 1);

    ctx.fillStyle = textColor;
    if (isSelected && !isDisabled) {
      ctx.shadowColor = isDanger ? '#ef4444' : (isPrimary ? '#f59e0b' : '#d97706');
      ctx.shadowBlur = 6;
    }
    ctx.fillText(text, curX, textY);
    ctx.shadowBlur = 0;

    // Subtext or Hotkey aligned right
    if (subtext || hotkey) {
      const rightText = subtext || hotkey;
      ctx.fillStyle = isDanger
        ? 'rgba(252, 165, 165, 0.75)'
        : (isFocused ? 'rgba(253, 230, 138, 0.85)' : 'rgba(148, 163, 184, 0.65)');
      ctx.font = `italic ${subFontSize}px "Crimson Text", serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(rightText, rx + rw - 12, textY);
    }
  } else {
    // Center aligned
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Drop shadow
    ctx.fillStyle = '#010204';
    ctx.font = fontSpec;
    const fullLabel = icon ? `${icon}  ${text}` : text;
    ctx.fillText(fullLabel, rx + rw / 2 + 1, textY + 1);

    // Face text
    ctx.fillStyle = textColor;
    if (isSelected && !isDisabled) {
      ctx.shadowColor = isDanger ? '#ef4444' : (isPrimary ? '#f59e0b' : '#d97706');
      ctx.shadowBlur = 6;
    }
    ctx.fillText(fullLabel, rx + rw / 2, textY);
    ctx.shadowBlur = 0;

    if (hotkey && !subtext) {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.65)';
      ctx.font = '8px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(hotkey, rx + rw - 8, textY);
    }
  }

  // Custom Badge (e.g. '[5/10]')
  if (customBadge) {
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 8.5px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(customBadge, rx + rw - 10, textY);
  }

  ctx.restore();
}

/**
 * Authoritative Carved-Stone Tab Button.
 * Used for category navigation, chamber switching, and multi-tabbed screens.
 * Features top chamfers, illuminated active gold frame, and distinct count badges.
 */
export function drawStoneTab(ctx, arg1, arg2, arg3, arg4, arg5, arg6) {
  let x, y, w, h, options;
  if (typeof arg1 === 'string') {
    x = arg2;
    y = arg3;
    w = arg4;
    h = arg5;
    options = Object.assign({}, typeof arg6 === 'object' ? arg6 : {});
    if (!options.label && !options.text) options.label = arg1;
  } else {
    x = arg1;
    y = arg2;
    w = arg3;
    h = arg4;
    options = Object.assign({}, typeof arg5 === 'object' ? arg5 : {});
  }

  const label = options.label ?? options.text ?? '';
  const icon = options.icon ?? '';
  const isActive = !!(options.isActive || options.isSelected || options.activeFocus);
  const isHover = !!options.isHover;
  const count = options.count ?? null;
  const chamfer = options.chamfer ?? options.cornerSize ?? 4;
  const accentColor = options.accentColor ?? (options.variant === 'purple' || options.variant === 'violet' ? 'violet' : (options.variant === 'crimson' || options.variant === 'danger' ? 'crimson' : (options.variant === 'azure' ? 'azure' : 'gold')));
  const fontSize = options.fontSize ?? (h <= 24 ? 8.5 : 9.5);

  ctx.save();
  const rx = Number.isFinite(x) ? Math.round(x) : 0;
  const ry = Number.isFinite(y) ? Math.round(y) : 0;
  const rw = Number.isFinite(w) && w > 0 ? Math.round(w) : 100;
  const rh = Number.isFinite(h) && h > 0 ? Math.round(h) : 26;

  // Background Stone Gradient
  const baseGrad = ctx.createLinearGradient(rx, ry, rx, ry + rh);
  if (isActive) {
    if (accentColor === 'crimson') {
      baseGrad.addColorStop(0, 'rgba(78, 16, 24, 0.98)');
      baseGrad.addColorStop(1, 'rgba(32, 6, 10, 0.99)');
    } else if (accentColor === 'violet') {
      baseGrad.addColorStop(0, 'rgba(64, 24, 94, 0.98)');
      baseGrad.addColorStop(1, 'rgba(26, 10, 42, 0.99)');
    } else {
      // Antique Gold & Violet Stone Core
      baseGrad.addColorStop(0, 'rgba(62, 42, 90, 0.98)');
      baseGrad.addColorStop(0.5, 'rgba(40, 26, 64, 0.99)');
      baseGrad.addColorStop(1, 'rgba(22, 14, 38, 1.0)');
    }
  } else if (isHover) {
    baseGrad.addColorStop(0, 'rgba(46, 34, 72, 0.94)');
    baseGrad.addColorStop(1, 'rgba(24, 18, 42, 0.98)');
  } else {
    baseGrad.addColorStop(0, 'rgba(32, 24, 52, 0.88)');
    baseGrad.addColorStop(1, 'rgba(16, 12, 28, 0.95)');
  }

  ctx.fillStyle = baseGrad;
  drawChamferedPanel(ctx, rx, ry, rw, rh, chamfer);
  ctx.fill();

  // Subtle stone texture overlay
  const pat = getStonePattern(ctx);
  if (pat) {
    ctx.save();
    ctx.globalAlpha = isActive ? 0.35 : 0.25;
    ctx.fillStyle = pat;
    drawChamferedPanel(ctx, rx, ry, rw, rh, chamfer);
    ctx.fill();
    ctx.restore();
  }

  // Border
  let borderCol = 'rgba(180, 83, 9, 0.50)';
  let lineWidth = 1.0;
  if (isActive) {
    lineWidth = 1.5;
    borderCol = accentColor === 'crimson' ? '#f87171' : (accentColor === 'violet' ? '#c084fc' : (accentColor === 'azure' ? '#38bdf8' : '#fde68a'));
    ctx.shadowColor = borderCol;
    ctx.shadowBlur = 5;
  } else if (isHover) {
    borderCol = 'rgba(254, 240, 138, 0.85)';
    lineWidth = 1.2;
  }

  ctx.strokeStyle = borderCol;
  ctx.lineWidth = lineWidth;
  drawChamferedPanel(ctx, rx, ry, rw, rh, chamfer);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Active bottom indicator accent line
  if (isActive) {
    ctx.fillStyle = borderCol;
    ctx.fillRect(rx + 4, ry + rh - 2, rw - 8, 2);
  }

  // Label text with drop shadow
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = isActive ? `bold ${fontSize}px Cinzel, serif` : `${fontSize}px Cinzel, serif`;

  const countStr = count !== null ? ` [${count}]` : '';
  const fullText = (icon ? `${icon}  ` : '') + label + countStr;

  ctx.fillStyle = '#010204';
  ctx.fillText(fullText, rx + rw / 2 + 0.8, ry + rh / 2 + 0.8);

  ctx.fillStyle = isActive ? '#ffffff' : (isHover ? '#fef08a' : '#ede8df');
  ctx.fillText(fullText, rx + rw / 2, ry + rh / 2);

  ctx.restore();
}

/**
 * Authoritative Carved-Stone Card Frame.
 * Used for item lists, deeds, loadouts, floors, memories, bestiary containment.
 */
export function drawStoneCard(ctx, x, y, w, h, options = {}) {
  const {
    isHover = false,
    isSelected = false,
    isDisabled = false,
    isLocked = false,
    accentColor = 'gold', // 'gold' | 'crimson' | 'violet' | 'azure' | 'emerald'
    chamfer = 5
  } = options;

  ctx.save();
  const rx = Math.round(x);
  const ry = Math.round(y);
  const rw = Math.round(w);
  const rh = Math.round(h);

  // Physical drop shadow
  ctx.fillStyle = 'rgba(1, 2, 6, 0.65)';
  drawChamferedPanel(ctx, rx, ry + 2, rw, rh, chamfer);
  ctx.fill();

  // Card background slab (Deep violet/indigo dungeon stone)
  const cardGrad = ctx.createLinearGradient(rx, ry, rx, ry + rh);
  if (isSelected) {
    if (accentColor === 'crimson') {
      cardGrad.addColorStop(0, 'rgba(56, 16, 26, 0.98)');
      cardGrad.addColorStop(1, 'rgba(26, 8, 12, 0.99)');
    } else if (accentColor === 'violet') {
      cardGrad.addColorStop(0, 'rgba(52, 26, 74, 0.98)');
      cardGrad.addColorStop(1, 'rgba(22, 10, 36, 0.99)');
    } else {
      cardGrad.addColorStop(0, 'rgba(50, 34, 68, 0.98)');
      cardGrad.addColorStop(0.5, 'rgba(32, 22, 48, 0.99)');
      cardGrad.addColorStop(1, 'rgba(18, 12, 30, 1.0)');
    }
  } else if (isHover) {
    cardGrad.addColorStop(0, 'rgba(38, 28, 56, 0.94)');
    cardGrad.addColorStop(1, 'rgba(20, 14, 34, 0.98)');
  } else if (isLocked || isDisabled) {
    cardGrad.addColorStop(0, 'rgba(20, 17, 30, 0.88)');
    cardGrad.addColorStop(1, 'rgba(10, 9, 18, 0.94)');
  } else {
    cardGrad.addColorStop(0, 'rgba(30, 22, 46, 0.92)');
    cardGrad.addColorStop(1, 'rgba(16, 12, 28, 0.96)');
  }

  ctx.fillStyle = cardGrad;
  drawChamferedPanel(ctx, rx, ry, rw, rh, chamfer);
  ctx.fill();

  // Stone texture overlay
  const pat = getStonePattern(ctx);
  if (pat && !isDisabled) {
    ctx.save();
    ctx.globalAlpha = isSelected ? 0.35 : 0.28;
    ctx.fillStyle = pat;
    drawChamferedPanel(ctx, rx, ry, rw, rh, chamfer);
    ctx.fill();
    ctx.restore();
  }

  // Border
  let strokeCol = 'rgba(180, 83, 9, 0.45)';
  let lineWidth = 1;
  if (isSelected) {
    lineWidth = 1.5;
    ctx.shadowColor = accentColor === 'crimson' ? '#ef4444' : (accentColor === 'violet' ? '#c084fc' : '#f59e0b');
    ctx.shadowBlur = 6;
    strokeCol = accentColor === 'crimson' ? '#fca5a5' : (accentColor === 'violet' ? '#e9d5ff' : '#fde68a');
  } else if (isHover) {
    lineWidth = 1.2;
    strokeCol = 'rgba(254, 240, 138, 0.75)';
  } else if (isLocked || isDisabled) {
    strokeCol = 'rgba(71, 85, 105, 0.35)';
  }

  ctx.strokeStyle = strokeCol;
  ctx.lineWidth = lineWidth;
  drawChamferedPanel(ctx, rx, ry, rw, rh, chamfer);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Corner brackets
  if (isSelected || isHover) {
    const brCol = isSelected
      ? (accentColor === 'crimson' ? 'rgba(248, 113, 113, 0.9)' : (accentColor === 'violet' ? 'rgba(192, 132, 252, 0.9)' : 'rgba(245, 158, 11, 0.9)'))
      : 'rgba(201, 168, 76, 0.55)';
    drawCornerBrackets(ctx, rx + 1, ry + 1, rw - 2, rh - 2, 8, brCol);
  }

  ctx.restore();
}

/**
 * Authoritative Recessed Stone Slider with Metallic Carriage & Harmonic Wave.
 * Used in Audio Settings & Health Calibration.
 */
export function drawStoneSlider(ctx, x, y, w, h, val = 1.0, options = {}) {
  const {
    label = '',
    valueText = '',
    theme = 'amber', // 'amber' | 'violet' | 'azure' | 'crimson'
    isHover = false,
    isDragging = false,
    isMuted = false,
    minVal = 0,
    maxVal = 1,
    timer = 0
  } = options;

  ctx.save();
  const rx = Math.round(x);
  const ry = Math.round(y);
  const rw = Math.round(w);
  const rh = Math.round(h);

  // Label and Value readout
  if (label || valueText) {
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = isMuted ? '#64748b' : (isHover ? '#ffffff' : '#fde68a');
    ctx.fillText(label, rx, ry);

    if (valueText) {
      ctx.textAlign = 'right';
      ctx.fillStyle = isMuted ? '#475569' : '#cbd5e1';
      ctx.font = 'bold 9.5px monospace';
      ctx.fillText(valueText, rx + rw, ry);
    }
  }

  // Recessed Basalt Track
  const trackY = ry + (label ? 16 : 0);
  const trackH = Math.max(14, rh - (label ? 16 : 0));
  const effectiveVal = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal || 1)));

  // Inner track drop shadow
  ctx.fillStyle = '#060814';
  drawChamferedPanel(ctx, rx, trackY, rw, trackH, 3);
  ctx.fill();

  ctx.strokeStyle = isHover ? 'rgba(201, 168, 76, 0.65)' : 'rgba(71, 85, 105, 0.45)';
  ctx.lineWidth = 1;
  drawChamferedPanel(ctx, rx, trackY, rw, trackH, 3);
  ctx.stroke();

  // Glowing Fill Bar
  const fillW = Math.max(0, Math.round((rw - 6) * effectiveVal));
  if (fillW > 0 && !isMuted) {
    const fGrad = ctx.createLinearGradient(rx, trackY, rx + fillW, trackY);
    if (theme === 'crimson') {
      fGrad.addColorStop(0, '#991b1b');
      fGrad.addColorStop(1, '#ef4444');
    } else if (theme === 'violet') {
      fGrad.addColorStop(0, '#6b21a8');
      fGrad.addColorStop(0.7, '#a855f7');
      fGrad.addColorStop(1, '#d8b4fe');
    } else if (theme === 'azure') {
      fGrad.addColorStop(0, '#0369a1');
      fGrad.addColorStop(0.7, '#0284c7');
      fGrad.addColorStop(1, '#bae6fd');
    } else {
      // Amber
      fGrad.addColorStop(0, '#92400e');
      fGrad.addColorStop(0.7, '#d97706');
      fGrad.addColorStop(1, '#fde68a');
    }

    ctx.fillStyle = fGrad;
    drawChamferedPanel(ctx, rx + 3, trackY + 2, fillW, trackH - 4, 2);
    ctx.fill();

    // Subtle Harmonic Sinusoidal Wave inside Fill Bar
    ctx.save();
    drawChamferedPanel(ctx, rx + 3, trackY + 2, fillW, trackH - 4, 2);
    ctx.clip();

    ctx.lineWidth = 1.3;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.50)';
    ctx.beginPath();
    const waveY = trackY + trackH / 2;
    for (let wx = 0; wx <= fillW; wx += 4) {
      const wy = waveY + Math.sin((timer * 3.5) + wx * 0.15) * 2.8;
      if (wx === 0) ctx.moveTo(rx + 3 + wx, wy);
      else ctx.lineTo(rx + 3 + wx, wy);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Metallic Slider Carriage Thumb
  const curW = 16, curH = trackH + 6;
  const cursorX = rx + 3 + fillW;
  const cursorY = trackY + trackH / 2;

  ctx.fillStyle = '#1e2436';
  ctx.strokeStyle = isMuted ? '#64748b' : (theme === 'crimson' ? '#ef4444' : (theme === 'violet' ? '#c084fc' : (theme === 'azure' ? '#38bdf8' : '#f59e0b')));
  ctx.lineWidth = 1.6;
  if (isDragging || isHover) {
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 6;
  }
  drawChamferedPanel(ctx, cursorX - curW / 2, cursorY - curH / 2, curW, curH, 3);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Center crystal indicator bead
  ctx.fillStyle = isMuted ? '#64748b' : ctx.strokeStyle;
  ctx.beginPath();
  ctx.arc(cursorX, cursorY, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Authoritative Section Divider Line with Center Talisman / Rubric.
 */
export function drawStoneDivider(ctx, x, y, w, title = '', icon = '◈') {
  ctx.save();
  const rx = Math.round(x);
  const ry = Math.round(y);
  const rw = Math.round(w);

  if (title) {
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.fillStyle = '#fde68a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textW = ctx.measureText(`${icon}  ${title}  ${icon}`).width + 20;

    const lineW = Math.max(10, (rw - textW) / 2);

    // Left line
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.40)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rx, ry); ctx.lineTo(rx + lineW, ry);
    ctx.stroke();

    // Right line
    ctx.beginPath();
    ctx.moveTo(rx + rw - lineW, ry); ctx.lineTo(rx + rw, ry);
    ctx.stroke();

    // Text
    ctx.fillText(`${icon}  ${title}  ${icon}`, rx + rw / 2, ry);
  } else {
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rx, ry); ctx.lineTo(rx + rw, ry);
    ctx.stroke();

    // Center diamond
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.moveTo(rx + rw / 2, ry - 3);
    ctx.lineTo(rx + rw / 2 + 3, ry);
    ctx.lineTo(rx + rw / 2, ry + 3);
    ctx.lineTo(rx + rw / 2 - 3, ry);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Authoritative Carved Stone Status Badge / Pill.
 */
export function drawStoneBadge(ctx, arg1, arg2, arg3, arg4, arg5, arg6) {
  let x, y, w, h, text = '', options = {};
  if (typeof arg1 === 'string') {
    text = arg1;
    x = arg2;
    y = arg3;
    w = arg4;
    h = arg5;
    options = Object.assign({}, typeof arg6 === 'object' ? arg6 : {});
  } else {
    x = arg1;
    y = arg2;
    w = arg3;
    h = arg4;
    if (typeof arg5 === 'string') {
      text = arg5;
      options = Object.assign({}, typeof arg6 === 'object' ? arg6 : {});
    } else {
      options = Object.assign({}, typeof arg5 === 'object' ? arg5 : {});
      text = options.text ?? options.label ?? '';
    }
  }

  const theme = options.theme ?? (options.variant === 'purple' || options.variant === 'violet' ? 'violet' : (options.variant === 'gold' ? 'gold' : (options.variant === 'danger' || options.variant === 'crimson' ? 'crimson' : (options.variant === 'emerald' ? 'emerald' : 'gold'))));
  const icon = options.icon ?? '';
  const chamfer = options.chamfer ?? options.cornerSize ?? 3;

  ctx.save();
  const rx = Number.isFinite(x) ? Math.round(x) : 0;
  const ry = Number.isFinite(y) ? Math.round(y) : 0;
  const rw = Number.isFinite(w) && w > 0 ? Math.round(w) : 100;
  const rh = Number.isFinite(h) && h > 0 ? Math.round(h) : 26;

  let bg = 'rgba(20, 16, 36, 0.90)';
  let border = 'rgba(71, 85, 105, 0.5)';
  let fg = '#cbd5e1';

  if (theme === 'crimson') {
    bg = 'rgba(68, 14, 20, 0.90)';
    border = '#ef4444';
    fg = '#fca5a5';
  } else if (theme === 'violet') {
    bg = 'rgba(46, 16, 70, 0.90)';
    border = '#c084fc';
    fg = '#e9d5ff';
  } else if (theme === 'emerald') {
    bg = 'rgba(6, 78, 59, 0.90)';
    border = '#10b981';
    fg = '#6ee7b7';
  } else if (theme === 'azure') {
    bg = 'rgba(12, 74, 110, 0.90)';
    border = '#38bdf8';
    fg = '#bae6fd';
  } else if (theme === 'gold') {
    bg = 'rgba(52, 34, 18, 0.90)';
    border = 'rgba(217, 119, 6, 0.85)';
    fg = '#fde68a';
  }

  ctx.fillStyle = bg;
  drawChamferedPanel(ctx, rx, ry, rw, rh, chamfer);
  ctx.fill();

  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  drawChamferedPanel(ctx, rx, ry, rw, rh, chamfer);
  ctx.stroke();

  ctx.font = 'bold 8.5px Cinzel, serif';
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label = icon ? `${icon} ${text}` : text;
  ctx.fillText(label, rx + rw / 2, ry + rh / 2);

  ctx.restore();
}

export const ButtonArtManager = {
  init,

  isReady() {
    return true;
  },

  getStateKey(isPrimary, isGift, isDisabled, isFocused, isHovered, isPressed, isDanger) {
    if (isDisabled) return 'disabled';
    if (isDanger) {
      if (isPressed) return 'pressed';
      if (isFocused || isHovered) return 'hover';
      return 'danger';
    }
    if (isPrimary) {
      if (isPressed) return 'primary_pressed';
      if (isFocused || isHovered) return 'primary_hover';
      return 'primary_normal';
    }
    if (isGift) {
      if (isPressed || isFocused || isHovered) return 'gift_hover';
      return 'gift_normal';
    }
    if (isPressed) return 'pressed';
    if (isFocused || isHovered) return 'hover';
    return 'normal';
  },

  drawButton(ctx, stateKey, x, y, w, h) {
    const isPrimary = stateKey.startsWith('primary_');
    const isGift = stateKey.startsWith('gift_');
    const isDanger = stateKey === 'danger';
    const F = (typeof GameState !== 'undefined' && GameState.timer) ? GameState.timer * 60 : 0;
    const isReducedMotion = !!(typeof GameState !== 'undefined' && GameState.REDUCED_MOTION);

    drawStoneButtonFace(ctx, x, y, w, h, stateKey, {
      chamfer: isPrimary ? 5 : 4,
      isPrimary,
      isDanger,
      isGift,
      F,
      isReducedMotion
    });
    return true;
  },

  drawStoneButtonFace,
  drawStoneButton,
  drawStoneTab,
  drawStoneCard,
  drawStonePanel,
  drawStoneSlider,
  drawStoneDivider,
  drawStoneBadge,
  drawCornerBrackets,
  drawChamferedPanel,
  drawForgeEmberCracks,
  getStonePattern
};

if (typeof window !== 'undefined') {
  window.ButtonArtManager = ButtonArtManager;
  window.drawStoneButton = drawStoneButton;
  window.drawStonePanel = drawStonePanel;
  window.drawStoneCard = drawStoneCard;
  window.drawStoneTab = drawStoneTab;
  window.drawStoneSlider = drawStoneSlider;
  window.drawStoneDivider = drawStoneDivider;
  window.drawStoneBadge = drawStoneBadge;
}
