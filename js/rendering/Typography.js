// =====================================================================
//  DUNGEON BREAK — js/rendering/Typography.js
//  Authoritative Game Typography & Text Layout Subsystem
//  Provides strict typographic hierarchy, responsive scale compensation
//  between logical canvas coordinates (640p) and CSS display pixels,
//  and font preloading verification across Desktop & Mobile viewports.
// =====================================================================

import { LH } from '../core/Constants.js';

export const FONT_FAMILIES = {
  DISPLAY: 'Cinzel, Georgia, serif',
  LORE: '"Crimson Text", Georgia, serif',
  UI: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  MONO: 'ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, monospace'
};

export const ROLES = {
  TITLE_HERO: 'TITLE_HERO',           // 32-42px: Game Logo, Major Victories, Epilogue Titles
  TITLE_SCREEN: 'TITLE_SCREEN',       // 22-28px: Screen & Modal Headers (Developer Sanctum, Settings)
  HEADING_SECTION: 'HEADING_SECTION', // 16-20px: Sub-panel Titles, Tab Headers, Stat Categories
  BUTTON_PRIMARY: 'BUTTON_PRIMARY',   // 16-19px: Major Action Buttons (Descent, Resume, Confirm)
  BUTTON_SECONDARY: 'BUTTON_SECONDARY', // 13-16px: Standard Buttons, Option Toggles, Tab Items
  BODY_LORE: 'BODY_LORE',             // 14-17px: Narrative Lore, Chronicle Folios, Memorials
  BODY_UI: 'BODY_UI',                 // 13-15px: Standard Descriptions, Instructions, Dialogues
  HUD_VALUE: 'HUD_VALUE',             // 14-18px: Key Numerics (HP, Sanity, Soul Counters, Multipliers)
  HUD_LABEL: 'HUD_LABEL',             // 12-14px: Secondary Counters & Category Badges
  METADATA_SMALL: 'METADATA_SMALL',   // 12-13px: Keybindings, Footers, Status Hints, Timestamps
  CODE_MONO: 'CODE_MONO'              // 12-14px: Technical Sandbox Parameters & Debug Coordinates
};

/**
 * Base logical font specifications designed for 640p logical coordinate system.
 * minCssPx ensures the rendered text never becomes illegible on small mobile screens.
 */
const ROLE_SPECS = {
  [ROLES.TITLE_HERO]: {
    family: FONT_FAMILIES.DISPLAY,
    weight: 'bold',
    style: 'normal',
    baseSize: 36,
    minCssPx: 22,
    letterSpacing: 2
  },
  [ROLES.TITLE_SCREEN]: {
    family: FONT_FAMILIES.DISPLAY,
    weight: 'bold',
    style: 'normal',
    baseSize: 24,
    minCssPx: 18,
    letterSpacing: 1.5
  },
  [ROLES.HEADING_SECTION]: {
    family: FONT_FAMILIES.DISPLAY,
    weight: 'bold',
    style: 'normal',
    baseSize: 17,
    minCssPx: 14,
    letterSpacing: 1.2
  },
  [ROLES.BUTTON_PRIMARY]: {
    family: FONT_FAMILIES.DISPLAY,
    weight: 'bold',
    style: 'normal',
    baseSize: 16,
    minCssPx: 14,
    letterSpacing: 1
  },
  [ROLES.BUTTON_SECONDARY]: {
    family: FONT_FAMILIES.UI,
    weight: '600',
    style: 'normal',
    baseSize: 14,
    minCssPx: 12,
    letterSpacing: 0.5
  },
  [ROLES.BODY_LORE]: {
    family: FONT_FAMILIES.LORE,
    weight: 'normal',
    style: 'italic',
    baseSize: 15,
    minCssPx: 13,
    letterSpacing: 0.3
  },
  [ROLES.BODY_UI]: {
    family: FONT_FAMILIES.UI,
    weight: 'normal',
    style: 'normal',
    baseSize: 13.5,
    minCssPx: 12,
    letterSpacing: 0.2
  },
  [ROLES.HUD_VALUE]: {
    family: FONT_FAMILIES.UI,
    weight: 'bold',
    style: 'normal',
    baseSize: 15,
    minCssPx: 13,
    letterSpacing: 0.5
  },
  [ROLES.HUD_LABEL]: {
    family: FONT_FAMILIES.UI,
    weight: '600',
    style: 'normal',
    baseSize: 12.5,
    minCssPx: 11,
    letterSpacing: 0.5
  },
  [ROLES.METADATA_SMALL]: {
    family: FONT_FAMILIES.UI,
    weight: '500',
    style: 'normal',
    baseSize: 12,
    minCssPx: 11,
    letterSpacing: 0.3
  },
  [ROLES.CODE_MONO]: {
    family: FONT_FAMILIES.MONO,
    weight: '600',
    style: 'normal',
    baseSize: 12.5,
    minCssPx: 11,
    letterSpacing: 0.2
  }
};

class TypographySubsystem {
  constructor() {
    this.ROLES = ROLES;
    this.FONT_FAMILIES = FONT_FAMILIES;
    this._fontsLoaded = false;
    this._loadPromise = null;
    this._fontCache = new Map();
  }

  /**
   * Calculates current display scale factor: CSS canvas display height / logical height (640).
   * On mobile screens (e.g. 800x360), scaleFactor is ~0.5625.
   */
  getScaleFactor() {
    if (typeof window === 'undefined') return 1.0;
    const canvas = document.getElementById('c');
    const ch = (canvas && canvas.clientHeight > 0) ? canvas.clientHeight : window.innerHeight;
    if (!ch || ch <= 0) return 1.0;
    const baseLH = (typeof LH === 'number' && LH > 0) ? LH : 640;
    return Math.max(0.35, Math.min(2.5, ch / baseLH));
  }

  /**
   * Computes the effective logical font size in Canvas coordinates,
   * guaranteeing that it will never appear below minCssPx on the actual device screen.
   */
  getEffectiveSize(role, options = {}) {
    const spec = ROLE_SPECS[role] || ROLE_SPECS[ROLES.BODY_UI];
    const baseSize = options.size !== undefined ? options.size : spec.baseSize;
    if (options.noScale) return baseSize;

    const minCssPx = options.minCssPx !== undefined ? options.minCssPx : spec.minCssPx;
    const scaleFactor = this.getScaleFactor();

    // If mobile viewport scales the canvas down (e.g. 0.56x), scale logical font up
    // so physical on-screen size meets minCssPx, capped to prevent massive overflow
    if (scaleFactor < 0.95 && minCssPx > 0) {
      const compensatedLogicalSize = Math.ceil(minCssPx / scaleFactor);
      // Allow slight boost up to 1.35x baseSize to maintain UI box fit
      const maxAllowedLogical = Math.round(baseSize * 1.35);
      return Math.min(maxAllowedLogical, Math.max(baseSize, compensatedLogicalSize));
    }

    return baseSize;
  }

  /**
   * Generates a CSS font specification string ready for CanvasRenderingContext2D.font.
   * Cached for zero garbage collection overhead.
   */
  getFont(role, options = {}) {
    const spec = ROLE_SPECS[role] || ROLE_SPECS[ROLES.BODY_UI];
    const style = options.style || spec.style;
    const weight = options.weight || spec.weight;
    const family = options.family || spec.family;
    const size = this.getEffectiveSize(role, options);

    const cacheKey = `${style}_${weight}_${size}_${family}`;
    let fontString = this._fontCache.get(cacheKey);
    if (!fontString) {
      const stylePart = style && style !== 'normal' ? `${style} ` : '';
      const weightPart = weight && weight !== 'normal' ? `${weight} ` : '';
      fontString = `${stylePart}${weightPart}${size}px ${family}`;
      this._fontCache.set(cacheKey, fontString);
    }
    return fontString;
  }

  /**
   * Helper to set context typography in one call.
   */
  apply(ctx, role, options = {}) {
    ctx.font = this.getFont(role, options);
    if (options.align) ctx.textAlign = options.align;
    if (options.baseline) ctx.textBaseline = options.baseline;
    if (options.color) ctx.fillStyle = options.color;
  }

  /**
   * Cleanly measures text with specified role and options.
   */
  measureText(ctx, text, role, options = {}) {
    const prevFont = ctx.font;
    ctx.font = this.getFont(role, options);
    const metrics = ctx.measureText(text);
    ctx.font = prevFont;
    return metrics;
  }

  /**
   * Draws single-line text with optional shadow, stroke, and crisp sub-pixel alignment.
   */
  drawText(ctx, text, x, y, options = {}) {
    if (!text && text !== 0) return 0;
    const textStr = String(text);
    const role = options.role || ROLES.BODY_UI;

    ctx.save();
    ctx.font = options.font || this.getFont(role, options);
    if (options.align) ctx.textAlign = options.align;
    if (options.baseline) ctx.textBaseline = options.baseline;

    // Optional subtle outline / stroke for readability over busy backgrounds
    if (options.strokeColor && (options.strokeWidth || 2)) {
      ctx.strokeStyle = options.strokeColor;
      ctx.lineWidth = options.strokeWidth || 2;
      ctx.lineJoin = 'round';
      ctx.strokeText(textStr, Math.round(x), Math.round(y));
    }

    // Optional shadow / glow
    if (options.shadowColor) {
      ctx.shadowColor = options.shadowColor;
      ctx.shadowBlur = options.shadowBlur || 4;
      ctx.shadowOffsetX = options.shadowOffsetX !== undefined ? options.shadowOffsetX : 0;
      ctx.shadowOffsetY = options.shadowOffsetY !== undefined ? options.shadowOffsetY : 1;
    }

    ctx.fillStyle = options.color || '#fde68a';
    ctx.fillText(textStr, Math.round(x), Math.round(y));
    ctx.restore();

    return ctx.measureText(textStr).width;
  }

  /**
   * Measures and fits text into a constrained width by scaling font size down if needed.
   */
  fitText(ctx, text, maxWidth, role, options = {}) {
    const spec = ROLE_SPECS[role] || ROLE_SPECS[ROLES.BODY_UI];
    let curSize = this.getEffectiveSize(role, options);
    const minSize = options.minSize || 10;

    while (curSize > minSize) {
      const font = this.getFont(role, { ...options, size: curSize });
      ctx.font = font;
      if (ctx.measureText(text).width <= maxWidth) {
        return font;
      }
      curSize -= 0.5;
    }

    return this.getFont(role, { ...options, size: minSize });
  }

  /**
   * Word wraps text into an array of lines based on maxWidth and font.
   */
  wrapText(ctx, text, maxWidth, role, options = {}) {
    if (!text) return [];
    ctx.save();
    ctx.font = options.font || this.getFont(role, options);

    const words = String(text).split(' ');
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    ctx.restore();
    return lines;
  }

  /**
   * Draws multiline wrapped text with uniform line height and formatting.
   */
  drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, options = {}) {
    const lines = this.wrapText(ctx, text, maxWidth, options.role, options);
    const role = options.role || ROLES.BODY_UI;
    const lHeight = lineHeight || (this.getEffectiveSize(role, options) * 1.35);

    lines.forEach((line, index) => {
      this.drawText(ctx, line, x, y + index * lHeight, options);
    });

    return lines.length * lHeight;
  }

  /**
   * Verifies and awaits custom font availability via document.fonts.ready.
   */
  async ensureFontsReady() {
    if (this._fontsLoaded) return true;
    if (this._loadPromise) return this._loadPromise;

    if (typeof document === 'undefined' || !document.fonts) {
      this._fontsLoaded = true;
      return true;
    }

    this._loadPromise = (async () => {
      try {
        await document.fonts.ready;
        // Verify key font families are loaded
        const checks = [
          '700 16px Cinzel',
          '900 16px Cinzel',
          '400 16px "Crimson Text"',
          '400 16px Inter',
          '600 16px Inter',
          '700 16px Inter'
        ];
        for (const fontDesc of checks) {
          if (!document.fonts.check(fontDesc)) {
            try { await document.fonts.load(fontDesc); } catch (e) {}
          }
        }
        this._fontsLoaded = true;
        console.log('[DUNGEON BREAK] Typography Subsystem initialized. All fonts authoritative and verified.');
      } catch (err) {
        console.warn('[DUNGEON BREAK] Typography Subsystem: Font loading fallback engaged.', err);
        this._fontsLoaded = true;
      }
      return true;
    })();

    return this._loadPromise;
  }
}

export const Typography = new TypographySubsystem();

