// =====================================================================
//  DUNGEON BREAK — js/rendering/PixelIconRenderer.js
//  Authoritative Custom Pixel-Art Iconography Registry & Canvas Renderer
//  Replaces all platform emojis and generic Unicode symbols with
//  handcrafted, cohesive pixel-art icons matching the Sunken Citadel's
//  dark fantasy aesthetic.
// =====================================================================

class PixelIconRegistry {
  constructor() {
    this._svgCache = new Map();
  }

  /**
   * Main procedural drawing method.
   * Renders the specified icon onto any CanvasRenderingContext2D.
   *
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} iconId - Identifier from supported icon set
   * @param {number} x - Center X position (or top-left if options.align === 'topleft')
   * @param {number} y - Center Y position (or top-left if options.align === 'topleft')
   * @param {number} size - Pixel size (diameter / bounding box, typically 14 to 32px)
   * @param {Object} options - { align: 'center'|'topleft', color: string, glow: boolean, alpha: number }
   */
  draw(ctx, iconId, x, y, size = 16, options = {}) {
    if (!ctx) return;
    const align = options.align || 'center';
    const drawX = align === 'center' ? Math.round(x - size / 2) : Math.round(x);
    const drawY = align === 'center' ? Math.round(y - size / 2) : Math.round(y);

    ctx.save();
    if (options.alpha !== undefined) ctx.globalAlpha = options.alpha;

    if (options.glow) {
      ctx.shadowColor = options.glowColor || 'rgba(168, 85, 247, 0.6)';
      ctx.shadowBlur = options.glowBlur || 6;
    }

    const s = size / 16; // Normalization scale based on 16x16 grid

    switch (iconId) {
      case 'heart':
      case 'hp':
      case 'vitality':
        this._drawHeart(ctx, drawX, drawY, s, options);
        break;
      case 'sanity':
      case 'sanity_flame':
      case 'soul_flame':
        this._drawSanityFlame(ctx, drawX, drawY, s, options);
        break;
      case 'sword':
      case 'blade':
        this._drawSword(ctx, drawX, drawY, s, options);
        break;
      case 'bow':
      case 'arrow':
        this._drawBow(ctx, drawX, drawY, s, options);
        break;
      case 'axe':
      case 'battleaxe':
        this._drawAxe(ctx, drawX, drawY, s, options);
        break;
      case 'dagger':
      case 'stiletto':
        this._drawDagger(ctx, drawX, drawY, s, options);
        break;
      case 'spear':
      case 'lance':
        this._drawSpear(ctx, drawX, drawY, s, options);
        break;
      case 'shield':
      case 'defense':
        this._drawShield(ctx, drawX, drawY, s, options);
        break;
      case 'pause':
      case 'pause_stele':
        this._drawPause(ctx, drawX, drawY, s, options);
        break;
      case 'play':
      case 'resume':
        this._drawPlay(ctx, drawX, drawY, s, options);
        break;
      case 'speed':
      case 'spark':
      case 'haste':
        this._drawSpeedSpark(ctx, drawX, drawY, s, options);
        break;
      case 'map':
      case 'rune_map':
        this._drawMap(ctx, drawX, drawY, s, options);
        break;
      case 'soul_crystal':
      case 'crystal':
        this._drawSoulCrystal(ctx, drawX, drawY, s, options);
        break;
      case 'achievement_sigil':
      case 'sigil':
      case 'laurel':
        this._drawAchievementSigil(ctx, drawX, drawY, s, options);
        break;
      case 'scroll_lore':
      case 'scroll':
      case 'lore':
        this._drawScroll(ctx, drawX, drawY, s, options);
        break;
      case 'lock_sealed':
      case 'lock':
        this._drawLock(ctx, drawX, drawY, s, options, true);
        break;
      case 'lock_open':
        this._drawLock(ctx, drawX, drawY, s, options, false);
        break;
      case 'check_mark':
      case 'check':
        this._drawCheck(ctx, drawX, drawY, s, options);
        break;
      case 'reset':
      case 'refresh':
        this._drawReset(ctx, drawX, drawY, s, options);
        break;
      case 'arrow_back':
      case 'back':
        this._drawBackArrow(ctx, drawX, drawY, s, options);
        break;
      case 'fullscreen':
      case 'expand':
      case 'resize':
        this._drawResize(ctx, drawX, drawY, s, options);
        break;
      case 'skull':
      case 'danger':
        this._drawSkull(ctx, drawX, drawY, s, options);
        break;
      case 'audio':
      case 'sound':
        this._drawAudio(ctx, drawX, drawY, s, options);
        break;
      case 'settings':
      case 'gear':
        this._drawGear(ctx, drawX, drawY, s, options);
        break;
      case 'slot_empty':
      default:
        this._drawEmptySlot(ctx, drawX, drawY, s, options);
        break;
    }

    ctx.restore();
  }

  // --- INDIVIDUAL PROCEDURAL PIXEL ART RENDERERS ---

  _drawHeart(ctx, x, y, s, opts) {
    const cFill = opts.color || '#ef4444';
    const cDark = '#7f1d1d';
    const cHigh = '#fca5a5';

    // Dark border / silhouette
    ctx.fillStyle = cDark;
    ctx.fillRect(x + 2 * s, y + 1 * s, 4 * s, 2 * s);
    ctx.fillRect(x + 10 * s, y + 1 * s, 4 * s, 2 * s);
    ctx.fillRect(x + 1 * s, y + 3 * s, 14 * s, 4 * s);
    ctx.fillRect(x + 2 * s, y + 7 * s, 12 * s, 3 * s);
    ctx.fillRect(x + 4 * s, y + 10 * s, 8 * s, 3 * s);
    ctx.fillRect(x + 6 * s, y + 13 * s, 4 * s, 2 * s);
    ctx.fillRect(x + 7 * s, y + 15 * s, 2 * s, 1 * s);

    // Inner bright ruby body
    ctx.fillStyle = cFill;
    ctx.fillRect(x + 3 * s, y + 2 * s, 3 * s, 2 * s);
    ctx.fillRect(x + 10 * s, y + 2 * s, 3 * s, 2 * s);
    ctx.fillRect(x + 2 * s, y + 4 * s, 12 * s, 3 * s);
    ctx.fillRect(x + 3 * s, y + 7 * s, 10 * s, 2 * s);
    ctx.fillRect(x + 5 * s, y + 9 * s, 6 * s, 3 * s);
    ctx.fillRect(x + 7 * s, y + 12 * s, 2 * s, 2 * s);

    // Specular pixel gloss
    ctx.fillStyle = cHigh;
    ctx.fillRect(x + 3 * s, y + 3 * s, 2 * s, 2 * s);
    ctx.fillRect(x + 11 * s, y + 3 * s, 1 * s, 1 * s);
  }

  _drawSanityFlame(ctx, x, y, s, opts) {
    const cFill = opts.color || '#c084fc';
    const cCore = '#f3e8ff';
    const cDark = '#581c87';

    // Outer wisp shadow
    ctx.fillStyle = cDark;
    ctx.fillRect(x + 7 * s, y + 0 * s, 2 * s, 3 * s);
    ctx.fillRect(x + 5 * s, y + 3 * s, 6 * s, 3 * s);
    ctx.fillRect(x + 3 * s, y + 6 * s, 10 * s, 6 * s);
    ctx.fillRect(x + 4 * s, y + 12 * s, 8 * s, 3 * s);
    ctx.fillRect(x + 6 * s, y + 15 * s, 4 * s, 1 * s);

    // Lavender flame body
    ctx.fillStyle = cFill;
    ctx.fillRect(x + 7 * s, y + 2 * s, 2 * s, 3 * s);
    ctx.fillRect(x + 5 * s, y + 5 * s, 6 * s, 4 * s);
    ctx.fillRect(x + 4 * s, y + 8 * s, 8 * s, 4 * s);
    ctx.fillRect(x + 5 * s, y + 12 * s, 6 * s, 2 * s);

    // Ethereal core
    ctx.fillStyle = cCore;
    ctx.fillRect(x + 7 * s, y + 6 * s, 2 * s, 4 * s);
    ctx.fillRect(x + 6 * s, y + 8 * s, 4 * s, 3 * s);
  }

  _drawSword(ctx, x, y, s, opts) {
    const cBlade = opts.color || '#fde68a';
    const cSteel = '#94a3b8';
    const cGold = '#f59e0b';
    const cDark = '#1e1b4b';

    // Blade diagonal (pointing top-right)
    ctx.fillStyle = cSteel;
    ctx.fillRect(x + 12 * s, y + 1 * s, 3 * s, 3 * s);
    ctx.fillRect(x + 10 * s, y + 3 * s, 3 * s, 3 * s);
    ctx.fillRect(x + 8 * s, y + 5 * s, 3 * s, 3 * s);
    ctx.fillRect(x + 6 * s, y + 7 * s, 3 * s, 3 * s);

    // Blade central gleam
    ctx.fillStyle = cBlade;
    ctx.fillRect(x + 12 * s, y + 2 * s, 2 * s, 2 * s);
    ctx.fillRect(x + 10 * s, y + 4 * s, 2 * s, 2 * s);
    ctx.fillRect(x + 8 * s, y + 6 * s, 2 * s, 2 * s);

    // Crossguard
    ctx.fillStyle = cGold;
    ctx.fillRect(x + 3 * s, y + 11 * s, 3 * s, 3 * s);
    ctx.fillRect(x + 5 * s, y + 9 * s, 3 * s, 3 * s);
    ctx.fillRect(x + 8 * s, y + 8 * s, 2 * s, 2 * s);

    // Grip & Pommel
    ctx.fillStyle = cDark;
    ctx.fillRect(x + 3 * s, y + 12 * s, 2 * s, 2 * s);
    ctx.fillStyle = cGold;
    ctx.fillRect(x + 1 * s, y + 14 * s, 2 * s, 2 * s);
  }

  _drawBow(ctx, x, y, s, opts) {
    const cWood = opts.color || '#34d399';
    const cString = '#e2e8f0';

    // Curved limb
    ctx.fillStyle = cWood;
    ctx.fillRect(x + 12 * s, y + 1 * s, 2 * s, 2 * s);
    ctx.fillRect(x + 8 * s, y + 2 * s, 4 * s, 2 * s);
    ctx.fillRect(x + 4 * s, y + 4 * s, 4 * s, 2 * s);
    ctx.fillRect(x + 2 * s, y + 7 * s, 2 * s, 3 * s);
    ctx.fillRect(x + 4 * s, y + 10 * s, 4 * s, 2 * s);
    ctx.fillRect(x + 8 * s, y + 12 * s, 4 * s, 2 * s);
    ctx.fillRect(x + 12 * s, y + 13 * s, 2 * s, 2 * s);

    // Bowstring
    ctx.fillStyle = cString;
    ctx.fillRect(x + 13 * s, y + 3 * s, 1 * s, 10 * s);

    // Nocked arrow shaft
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(x + 1 * s, y + 7 * s, 12 * s, 2 * s);
    // Arrow head
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x + 0 * s, y + 6 * s, 2 * s, 4 * s);
  }

  _drawAxe(ctx, x, y, s, opts) {
    const cHead = opts.color || '#f97316';
    const cSteel = '#94a3b8';
    const cHaft = '#78350f';

    // Haft diagonal
    ctx.fillStyle = cHaft;
    ctx.fillRect(x + 2 * s, y + 13 * s, 3 * s, 3 * s);
    ctx.fillRect(x + 5 * s, y + 10 * s, 3 * s, 3 * s);
    ctx.fillRect(x + 8 * s, y + 7 * s, 3 * s, 3 * s);
    ctx.fillRect(x + 11 * s, y + 4 * s, 3 * s, 3 * s);

    // Crescent Axe Blade
    ctx.fillStyle = cHead;
    ctx.fillRect(x + 7 * s, y + 1 * s, 7 * s, 3 * s);
    ctx.fillRect(x + 11 * s, y + 4 * s, 4 * s, 3 * s);
    ctx.fillRect(x + 9 * s, y + 6 * s, 3 * s, 4 * s);
    ctx.fillRect(x + 7 * s, y + 9 * s, 4 * s, 3 * s);

    // Sharp Cutting Bevel
    ctx.fillStyle = cSteel;
    ctx.fillRect(x + 13 * s, y + 1 * s, 2 * s, 2 * s);
    ctx.fillRect(x + 14 * s, y + 3 * s, 2 * s, 4 * s);
    ctx.fillRect(x + 12 * s, y + 7 * s, 2 * s, 3 * s);
  }

  _drawDagger(ctx, x, y, s, opts) {
    const cBlade = opts.color || '#c084fc';
    const cGrip = '#475569';

    // Thin curved stiletto blade
    ctx.fillStyle = cBlade;
    ctx.fillRect(x + 13 * s, y + 2 * s, 2 * s, 2 * s);
    ctx.fillRect(x + 10 * s, y + 4 * s, 3 * s, 3 * s);
    ctx.fillRect(x + 8 * s, y + 6 * s, 3 * s, 3 * s);
    ctx.fillRect(x + 6 * s, y + 8 * s, 3 * s, 3 * s);

    // Guard
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(x + 4 * s, y + 9 * s, 2 * s, 3 * s);
    ctx.fillRect(x + 7 * s, y + 12 * s, 3 * s, 2 * s);

    // Hilt
    ctx.fillStyle = cGrip;
    ctx.fillRect(x + 3 * s, y + 12 * s, 2 * s, 2 * s);
    ctx.fillRect(x + 1 * s, y + 14 * s, 2 * s, 2 * s);
  }

  _drawSpear(ctx, x, y, s, opts) {
    const cTip = opts.color || '#38bdf8';
    const cShaft = '#92400e';

    // Long shaft
    ctx.fillStyle = cShaft;
    ctx.fillRect(x + 1 * s, y + 13 * s, 3 * s, 3 * s);
    ctx.fillRect(x + 4 * s, y + 10 * s, 3 * s, 3 * s);
    ctx.fillRect(x + 7 * s, y + 7 * s, 3 * s, 3 * s);

    // Heavy Spear Leaf Tip
    ctx.fillStyle = cTip;
    ctx.fillRect(x + 10 * s, y + 4 * s, 3 * s, 3 * s);
    ctx.fillRect(x + 12 * s, y + 2 * s, 3 * s, 3 * s);
    ctx.fillRect(x + 14 * s, y + 0 * s, 2 * s, 2 * s);

    // Barb wings
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(x + 8 * s, y + 5 * s, 2 * s, 2 * s);
    ctx.fillRect(x + 11 * s, y + 8 * s, 2 * s, 2 * s);
  }

  _drawShield(ctx, x, y, s, opts) {
    const cRim = opts.color || '#ca8a04';
    const cField = '#1e1b4b';

    // Heater Shield Rim
    ctx.fillStyle = cRim;
    ctx.fillRect(x + 2 * s, y + 1 * s, 12 * s, 3 * s);
    ctx.fillRect(x + 1 * s, y + 4 * s, 14 * s, 5 * s);
    ctx.fillRect(x + 2 * s, y + 9 * s, 12 * s, 3 * s);
    ctx.fillRect(x + 4 * s, y + 12 * s, 8 * s, 2 * s);
    ctx.fillRect(x + 6 * s, y + 14 * s, 4 * s, 2 * s);

    // Inner Amethyst Field
    ctx.fillStyle = cField;
    ctx.fillRect(x + 3 * s, y + 3 * s, 10 * s, 5 * s);
    ctx.fillRect(x + 4 * s, y + 8 * s, 8 * s, 3 * s);
    ctx.fillRect(x + 6 * s, y + 11 * s, 4 * s, 2 * s);

    // Gold Boss Cross
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(x + 7 * s, y + 4 * s, 2 * s, 7 * s);
    ctx.fillRect(x + 5 * s, y + 6 * s, 6 * s, 2 * s);
  }

  _drawPause(ctx, x, y, s, opts) {
    const cRune = opts.color || '#fde68a';
    const cStone = '#1f1635';

    // Twin Carved Monolith Pillars (Gothic Steles)
    // Left pillar
    ctx.fillStyle = cStone;
    ctx.fillRect(x + 2 * s, y + 1 * s, 4 * s, 14 * s);
    ctx.fillStyle = cRune;
    ctx.fillRect(x + 3 * s, y + 2 * s, 2 * s, 12 * s);

    // Right pillar
    ctx.fillStyle = cStone;
    ctx.fillRect(x + 10 * s, y + 1 * s, 4 * s, 14 * s);
    ctx.fillStyle = cRune;
    ctx.fillRect(x + 11 * s, y + 2 * s, 2 * s, 12 * s);
  }

  _drawPlay(ctx, x, y, s, opts) {
    const cGold = opts.color || '#fde68a';
    const cShadow = '#78350f';

    // Consecrated Delta Play Crest
    ctx.fillStyle = cShadow;
    ctx.fillRect(x + 3 * s, y + 1 * s, 3 * s, 14 * s);
    ctx.fillRect(x + 6 * s, y + 3 * s, 3 * s, 10 * s);
    ctx.fillRect(x + 9 * s, y + 5 * s, 3 * s, 6 * s);
    ctx.fillRect(x + 12 * s, y + 7 * s, 3 * s, 2 * s);

    ctx.fillStyle = cGold;
    ctx.fillRect(x + 4 * s, y + 2 * s, 2 * s, 12 * s);
    ctx.fillRect(x + 6 * s, y + 4 * s, 2 * s, 8 * s);
    ctx.fillRect(x + 8 * s, y + 6 * s, 2 * s, 4 * s);
    ctx.fillRect(x + 10 * s, y + 7 * s, 2 * s, 2 * s);
  }

  _drawSpeedSpark(ctx, x, y, s, opts) {
    const cLight = opts.color || '#38bdf8';
    const cCore = '#ffffff';

    // Chrono Lightning / Temporal Spark
    ctx.fillStyle = cLight;
    ctx.fillRect(x + 8 * s, y + 0 * s, 4 * s, 3 * s);
    ctx.fillRect(x + 6 * s, y + 3 * s, 5 * s, 3 * s);
    ctx.fillRect(x + 4 * s, y + 6 * s, 8 * s, 3 * s);
    ctx.fillRect(x + 3 * s, y + 9 * s, 5 * s, 2 * s);
    ctx.fillRect(x + 5 * s, y + 11 * s, 4 * s, 3 * s);
    ctx.fillRect(x + 7 * s, y + 14 * s, 2 * s, 2 * s);

    // Inner bright core
    ctx.fillStyle = cCore;
    ctx.fillRect(x + 7 * s, y + 3 * s, 2 * s, 3 * s);
    ctx.fillRect(x + 6 * s, y + 6 * s, 3 * s, 2 * s);
  }

  _drawMap(ctx, x, y, s, opts) {
    const cBorder = opts.color || '#ca8a04';
    const cParch = '#fef3c7';

    // Map parchment folds
    ctx.fillStyle = cBorder;
    ctx.fillRect(x + 1 * s, y + 2 * s, 14 * s, 12 * s);

    ctx.fillStyle = cParch;
    ctx.fillRect(x + 2 * s, y + 3 * s, 4 * s, 10 * s);
    ctx.fillRect(x + 6 * s, y + 3 * s, 4 * s, 10 * s);
    ctx.fillRect(x + 10 * s, y + 3 * s, 4 * s, 10 * s);

    // Compass star
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x + 7 * s, y + 6 * s, 2 * s, 4 * s);
    ctx.fillRect(x + 6 * s, y + 7 * s, 4 * s, 2 * s);
  }

  _drawSoulCrystal(ctx, x, y, s, opts) {
    const cViolet = opts.color || '#a855f7';
    const cGlint = '#f3e8ff';
    const cDeep = '#3b0764';

    ctx.fillStyle = cDeep;
    ctx.fillRect(x + 6 * s, y + 1 * s, 4 * s, 2 * s);
    ctx.fillRect(x + 3 * s, y + 3 * s, 10 * s, 5 * s);
    ctx.fillRect(x + 4 * s, y + 8 * s, 8 * s, 4 * s);
    ctx.fillRect(x + 6 * s, y + 12 * s, 4 * s, 3 * s);

    ctx.fillStyle = cViolet;
    ctx.fillRect(x + 7 * s, y + 2 * s, 2 * s, 3 * s);
    ctx.fillRect(x + 5 * s, y + 4 * s, 6 * s, 4 * s);
    ctx.fillRect(x + 6 * s, y + 8 * s, 4 * s, 4 * s);

    ctx.fillStyle = cGlint;
    ctx.fillRect(x + 5 * s, y + 4 * s, 2 * s, 3 * s);
    ctx.fillRect(x + 9 * s, y + 5 * s, 1 * s, 1 * s);
  }

  _drawAchievementSigil(ctx, x, y, s, opts) {
    const cGold = opts.color || '#facc15';
    const cBronze = '#78350f';

    // Laurel Sunburst Wreath
    ctx.fillStyle = cBronze;
    ctx.fillRect(x + 4 * s, y + 1 * s, 8 * s, 2 * s);
    ctx.fillRect(x + 2 * s, y + 3 * s, 12 * s, 10 * s);
    ctx.fillRect(x + 4 * s, y + 13 * s, 8 * s, 2 * s);

    ctx.fillStyle = cGold;
    ctx.fillRect(x + 5 * s, y + 2 * s, 6 * s, 2 * s);
    ctx.fillRect(x + 3 * s, y + 4 * s, 2 * s, 8 * s);
    ctx.fillRect(x + 11 * s, y + 4 * s, 2 * s, 8 * s);
    ctx.fillRect(x + 5 * s, y + 12 * s, 6 * s, 2 * s);

    // Inner Crest Star
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 7 * s, y + 5 * s, 2 * s, 6 * s);
    ctx.fillRect(x + 5 * s, y + 7 * s, 6 * s, 2 * s);
  }

  _drawScroll(ctx, x, y, s, opts) {
    const cPaper = opts.color || '#fef3c7';
    const cRibbon = '#9333ea';

    // Folio body
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x + 2 * s, y + 1 * s, 12 * s, 14 * s);

    ctx.fillStyle = cPaper;
    ctx.fillRect(x + 3 * s, y + 2 * s, 10 * s, 12 * s);

    // Runic text lines
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 4 * s, y + 4 * s, 6 * s, 1 * s);
    ctx.fillRect(x + 4 * s, y + 7 * s, 8 * s, 1 * s);
    ctx.fillRect(x + 4 * s, y + 10 * s, 5 * s, 1 * s);

    // Wax ribbon
    ctx.fillStyle = cRibbon;
    ctx.fillRect(x + 11 * s, y + 7 * s, 2 * s, 5 * s);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(x + 10 * s, y + 6 * s, 4 * s, 3 * s);
  }

  _drawLock(ctx, x, y, s, opts, isLocked) {
    const cBody = opts.color || '#f59e0b';
    const cShackle = '#94a3b8';

    // Shackle
    ctx.fillStyle = cShackle;
    if (isLocked) {
      ctx.fillRect(x + 5 * s, y + 2 * s, 6 * s, 2 * s);
      ctx.fillRect(x + 4 * s, y + 3 * s, 2 * s, 4 * s);
      ctx.fillRect(x + 10 * s, y + 3 * s, 2 * s, 4 * s);
    } else {
      ctx.fillRect(x + 5 * s, y + 0 * s, 6 * s, 2 * s);
      ctx.fillRect(x + 10 * s, y + 1 * s, 2 * s, 6 * s);
    }

    // Heavy iron body
    ctx.fillStyle = cBody;
    ctx.fillRect(x + 3 * s, y + 6 * s, 10 * s, 9 * s);

    // Keyway
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 7 * s, y + 8 * s, 2 * s, 3 * s);
    ctx.fillRect(x + 7 * s, y + 11 * s, 2 * s, 2 * s);
  }

  _drawCheck(ctx, x, y, s, opts) {
    const cCheck = opts.color || '#22c55e';
    const cDark = '#14532d';

    ctx.fillStyle = cDark;
    ctx.fillRect(x + 1 * s, y + 8 * s, 3 * s, 3 * s);
    ctx.fillRect(x + 3 * s, y + 10 * s, 4 * s, 4 * s);
    ctx.fillRect(x + 6 * s, y + 7 * s, 4 * s, 4 * s);
    ctx.fillRect(x + 9 * s, y + 4 * s, 4 * s, 4 * s);
    ctx.fillRect(x + 12 * s, y + 1 * s, 3 * s, 4 * s);

    ctx.fillStyle = cCheck;
    ctx.fillRect(x + 2 * s, y + 9 * s, 2 * s, 2 * s);
    ctx.fillRect(x + 4 * s, y + 11 * s, 2 * s, 2 * s);
    ctx.fillRect(x + 6 * s, y + 9 * s, 2 * s, 2 * s);
    ctx.fillRect(x + 8 * s, y + 7 * s, 2 * s, 2 * s);
    ctx.fillRect(x + 10 * s, y + 5 * s, 2 * s, 2 * s);
    ctx.fillRect(x + 12 * s, y + 2 * s, 2 * s, 3 * s);
  }

  _drawReset(ctx, x, y, s, opts) {
    const cColor = opts.color || '#fde68a';

    // Circular Ouroboros Arrow
    ctx.fillStyle = cColor;
    ctx.fillRect(x + 4 * s, y + 2 * s, 7 * s, 2 * s);
    ctx.fillRect(x + 2 * s, y + 4 * s, 2 * s, 7 * s);
    ctx.fillRect(x + 4 * s, y + 11 * s, 7 * s, 2 * s);
    ctx.fillRect(x + 11 * s, y + 7 * s, 2 * s, 5 * s);

    // Arrowhead at top right
    ctx.fillRect(x + 9 * s, y + 0 * s, 4 * s, 2 * s);
    ctx.fillRect(x + 11 * s, y + 2 * s, 2 * s, 3 * s);
  }

  _drawBackArrow(ctx, x, y, s, opts) {
    const cColor = opts.color || '#fde68a';

    // Leftward chiseled chevron
    ctx.fillStyle = cColor;
    ctx.fillRect(x + 2 * s, y + 7 * s, 12 * s, 2 * s);
    ctx.fillRect(x + 4 * s, y + 5 * s, 2 * s, 2 * s);
    ctx.fillRect(x + 6 * s, y + 3 * s, 2 * s, 2 * s);
    ctx.fillRect(x + 4 * s, y + 9 * s, 2 * s, 2 * s);
    ctx.fillRect(x + 6 * s, y + 11 * s, 2 * s, 2 * s);
  }

  _drawResize(ctx, x, y, s, opts) {
    const cColor = opts.color || '#fde68a';

    // Top-left bracket
    ctx.fillRect(x + 1 * s, y + 1 * s, 5 * s, 2 * s);
    ctx.fillRect(x + 1 * s, y + 1 * s, 2 * s, 5 * s);

    // Bottom-right bracket
    ctx.fillRect(x + 10 * s, y + 13 * s, 5 * s, 2 * s);
    ctx.fillRect(x + 13 * s, y + 10 * s, 2 * s, 5 * s);

    // Center diagonal dot
    ctx.fillRect(x + 7 * s, y + 7 * s, 2 * s, 2 * s);
  }

  _drawSkull(ctx, x, y, s, opts) {
    const cBone = opts.color || '#e2e8f0';
    const cEye = '#090514';

    // Cranium
    ctx.fillStyle = cBone;
    ctx.fillRect(x + 4 * s, y + 1 * s, 8 * s, 3 * s);
    ctx.fillRect(x + 2 * s, y + 4 * s, 12 * s, 6 * s);

    // Teeth
    ctx.fillRect(x + 5 * s, y + 11 * s, 6 * s, 3 * s);

    // Sockets
    ctx.fillStyle = cEye;
    ctx.fillRect(x + 4 * s, y + 6 * s, 3 * s, 3 * s);
    ctx.fillRect(x + 9 * s, y + 6 * s, 3 * s, 3 * s);
    // Nasal cavity
    ctx.fillRect(x + 7 * s, y + 9 * s, 2 * s, 2 * s);
  }

  _drawAudio(ctx, x, y, s, opts) {
    const cHorn = opts.color || '#fde68a';

    // Speaker cone
    ctx.fillStyle = cHorn;
    ctx.fillRect(x + 2 * s, y + 5 * s, 3 * s, 6 * s);
    ctx.fillRect(x + 5 * s, y + 4 * s, 3 * s, 8 * s);
    ctx.fillRect(x + 8 * s, y + 2 * s, 2 * s, 12 * s);

    // Soundwaves
    ctx.fillRect(x + 12 * s, y + 5 * s, 2 * s, 6 * s);
  }

  _drawGear(ctx, x, y, s, opts) {
    const cGold = opts.color || '#f59e0b';

    // Gear hub and teeth
    ctx.fillStyle = cGold;
    ctx.fillRect(x + 6 * s, y + 1 * s, 4 * s, 14 * s);
    ctx.fillRect(x + 1 * s, y + 6 * s, 14 * s, 4 * s);
    ctx.fillRect(x + 4 * s, y + 4 * s, 8 * s, 8 * s);

    // Center axle hole
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 7 * s, y + 7 * s, 2 * s, 2 * s);
  }

  _drawEmptySlot(ctx, x, y, s, opts) {
    ctx.strokeStyle = opts.color || 'rgba(168, 85, 247, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 2 * s, y + 2 * s, 12 * s, 12 * s);
  }

  /**
   * Generates crisp SVG Data URI for usage in DOM img tags, backgrounds, or favicons.
   */
  getSvgDataUri(iconId, color = '#fde68a', size = 32) {
    const cacheKey = `${iconId}_${color}_${size}`;
    if (this._svgCache.has(cacheKey)) return this._svgCache.get(cacheKey);

    let pathContent = '';
    switch (iconId) {
      case 'pause':
        pathContent = `
          <rect x="5" y="4" width="7" height="24" rx="2" fill="#1f1635" stroke="${color}" stroke-width="1.5"/>
          <rect x="7" y="7" width="3" height="18" fill="${color}"/>
          <rect x="20" y="4" width="7" height="24" rx="2" fill="#1f1635" stroke="${color}" stroke-width="1.5"/>
          <rect x="22" y="7" width="3" height="18" fill="${color}"/>
        `;
        break;
      case 'play':
      case 'resume':
        pathContent = `
          <polygon points="8,5 27,16 8,27" fill="${color}" stroke="#78350f" stroke-width="2"/>
        `;
        break;
      case 'reset':
        pathContent = `
          <path d="M16 6 A10 10 0 1 0 26 16" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
          <polygon points="26,6 30,12 22,12" fill="${color}"/>
        `;
        break;
      case 'check':
        pathContent = `
          <path d="M6 16 L13 23 L26 8" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
        `;
        break;
      case 'resize':
        pathContent = `
          <path d="M4 12 L4 4 L12 4 M28 20 L28 28 L20 28 M8 8 L24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
        `;
        break;
      case 'abyss_crest':
      default:
        // Authentic Sunken Citadel / Abyss Crest Sigil
        pathContent = `
          <rect x="2" y="2" width="28" height="28" rx="4" fill="#090514" stroke="#ca8a04" stroke-width="2"/>
          <polygon points="16,5 24,16 16,27 8,16" fill="#1f1635" stroke="#a855f7" stroke-width="1.5"/>
          <circle cx="16" cy="16" r="4.5" fill="#ef4444" stroke="#fde68a" stroke-width="1"/>
          <circle cx="16" cy="16" r="1.8" fill="#fca5a5"/>
        `;
        break;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}">${pathContent}</svg>`;
    const uri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    this._svgCache.set(cacheKey, uri);
    return uri;
  }
}

export const PixelIconRenderer = new PixelIconRegistry();

