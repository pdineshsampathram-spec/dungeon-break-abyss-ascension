// =====================================================================
//  DUNGEON BREAK — js/rendering/CharacterDefinitions.js
//  Authoritative Shared 2.5D / Pseudo-3D Anatomy, Palettes & Materials
//  Lead Design & Direction: Dinesh Polimera
// =====================================================================

export const CharacterDefinitions = {
  // ─────────────────────────────────────────────────────────────
  // 1. LORD ROWAN — THE CURSED KNIGHT
  // ─────────────────────────────────────────────────────────────
  ROWAN: {
    id: 'rowan',
    name: 'Lord Rowan',
    title: 'The Cursed Knight',
    scale: 1.0,
    height: 48,
    width: 28,
    palettes: {
      steel: {
        specular: '#f8fafc',
        highlight: '#cbd5e1',
        midtone: '#64748b',
        shadow: '#334155',
        deepShadow: '#0f172a'
      },
      cape: {
        highlight: '#ef4444',
        midtone: '#991b1b',
        shadow: '#4c0519',
        deepShadow: '#1e030a'
      },
      gold: {
        highlight: '#fef08a',
        midtone: '#f59e0b',
        shadow: '#78350f'
      },
      leather: {
        highlight: '#78350f',
        midtone: '#451a03',
        shadow: '#1c0a00'
      },
      visor: {
        glow: '#38bdf8',
        core: '#e0f2fe',
        shadow: '#0284c7'
      }
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 2. GORGAROTH — THE IRON JAILER (Floor 3 Mini-Boss)
  // ─────────────────────────────────────────────────────────────
  GORGAROTH: {
    id: 'gorgaroth',
    name: 'Gorgaroth',
    title: 'The Iron Jailer',
    scale: 2.2,
    height: 96,
    width: 68,
    proportions: {
      relativeToRowan: 2.2,
      shoulderWidthMult: 2.4
    },
    palettes: {
      iron: {
        specular: '#a8a29e',
        highlight: '#78716c',
        midtone: '#44403c',
        shadow: '#292524',
        deepShadow: '#0c0a09'
      },
      moltenCore: {
        whiteCore: '#ffffff',
        yellowHot: '#fef08a',
        orangeGlow: '#f97316',
        deepAmber: '#c2410c',
        crust: '#451a03'
      },
      rageIron: {
        specular: '#fdba74',
        highlight: '#ea580c',
        midtone: '#7c2d12',
        shadow: '#451a03',
        deepShadow: '#1a0600'
      },
      chains: {
        highlight: '#78716c',
        midtone: '#44403c',
        shadow: '#1c1917'
      },
      visor: {
        glow: '#ea580c',
        core: '#fed7aa'
      }
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 3. MALAKOR — THE VOID WEAVER (Floor 6 Mini-Boss)
  // ─────────────────────────────────────────────────────────────
  MALAKOR: {
    id: 'malakor',
    name: 'Malakor',
    title: 'The Void Weaver',
    scale: 2.0,
    height: 84,
    width: 52,
    proportions: {
      relativeToRowan: 1.85,
      levitationAltitude: 14
    },
    palettes: {
      robes: {
        highlight: '#c084fc',
        midtone: '#7e22ce',
        shadow: '#3b0764',
        deepShadow: '#120224'
      },
      innerRibs: {
        highlight: '#e879f9',
        midtone: '#a21caf',
        shadow: '#4a044e'
      },
      singularity: {
        corona: '#f5d0fe',
        mid: '#c084fc',
        core: '#ffffff',
        shadow: '#581c87'
      },
      visor: {
        glow: '#d946ef',
        core: '#fae8ff'
      },
      astralGems: {
        glow: '#f0abfc',
        gem: '#e879f9',
        trail: 'rgba(217, 70, 239, 0.4)'
      }
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 4. THE ABYSS WARDEN — SCOURGE OF THE SUNKEN CITADEL (Floor 10 Final Boss)
  // ─────────────────────────────────────────────────────────────
  ABYSS_WARDEN: {
    id: 'abyss_warden',
    name: 'The Abyss Warden',
    title: 'Scourge of the Sunken Citadel',
    scale: 3.6, // Towering 3.6x Rowan's stature
    height: 168,
    width: 110,
    wingspan: 320,
    proportions: {
      relativeToRowan: 3.6,
      wingspanRelativeToRowan: 6.5
    },
    palettes: {
      obsidian: {
        specular: '#94a3b8',
        highlight: '#475569',
        midtone: '#1e293b',
        shadow: '#0f172a',
        deepShadow: '#020617'
      },
      abyssalFlesh: {
        highlight: '#991b1b',
        midtone: '#581c87',
        shadow: '#2e1065',
        deepShadow: '#050014'
      },
      wings: {
        phase1: {
          membrane: 'rgba(24, 4, 32, 0.94)',
          struts: '#581c87',
          talons: '#9333ea',
          edgeGlow: '#a855f7'
        },
        phase2: {
          membrane: 'rgba(45, 6, 75, 0.95)',
          struts: '#7e22ce',
          talons: '#c084fc',
          edgeGlow: '#e879f9'
        },
        phase3: {
          membrane: 'rgba(75, 8, 8, 0.96)',
          struts: '#b91c1c',
          talons: '#f87171',
          edgeGlow: '#ef4444'
        }
      },
      horns: {
        specular: '#cbd5e1',
        highlight: '#64748b',
        shadow: '#0f172a'
      },
      core: {
        rage: '#ef4444',
        void: '#a855f7',
        normal: '#b91c1c',
        whiteCore: '#ffffff'
      },
      eyes: {
        normal: '#ef4444',
        rage: '#ff2200',
        void: '#d946ef'
      }
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 5. LIGHTING & SHADOW PROJECTION MATHEMATICS
  // ─────────────────────────────────────────────────────────────
  /**
   * Computes directional cast shadow parameters on the dungeon floor
   * @param {number} entityX - World or screen X of character
   * @param {number} entityY - World or screen Y of character
   * @param {number} lightX - World or screen X of dominant light source
   * @param {number} lightY - World or screen Y of dominant light source
   * @param {number} baseRadiusX - Base ellipse horizontal radius
   * @param {number} baseRadiusY - Base ellipse vertical radius
   * @returns {{x: number, y: number, rx: number, ry: number, angle: number, opacity: number}}
   */
  calculateCastShadow(entityX, entityY, lightX, lightY, baseRadiusX, baseRadiusY) {
    const dx = entityX - lightX;
    const dy = entityY - lightY;
    const dist = Math.hypot(dx, dy) || 1;

    // Angle from light to entity
    const angle = Math.atan2(dy, dx);

    // Directional shadow elongation based on distance from light source
    const stretch = Math.min(2.4, 0.9 + dist / 220);
    const shadowOffsetX = Math.cos(angle) * (dist * 0.12);
    const shadowOffsetY = Math.sin(angle) * (dist * 0.06) + baseRadiusY * 0.8;

    // Opacity falls off gently with distance
    const opacity = Math.max(0.25, Math.min(0.65, 0.7 - dist / 600));

    return {
      x: entityX + shadowOffsetX,
      y: entityY + shadowOffsetY,
      rx: baseRadiusX * stretch,
      ry: baseRadiusY * 0.85,
      angle: angle * 0.35, // Foreshortened ground perspective angle
      opacity
    };
  },

  /**
   * Renders a soft directional contact and cast shadow on the dungeon flagstones
   */
  drawCastShadow(ctx, shadow) {
    ctx.save();
    ctx.translate(shadow.x, shadow.y);
    ctx.rotate(shadow.angle || 0);

    // Outer diffuse penumbra
    const grad = ctx.createRadialGradient(0, 0, shadow.rx * 0.15, 0, 0, shadow.rx);
    grad.addColorStop(0, `rgba(0, 0, 0, ${shadow.opacity})`);
    grad.addColorStop(0.45, `rgba(4, 2, 10, ${shadow.opacity * 0.7})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, shadow.rx, shadow.ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner sharp contact occlusion core
    ctx.fillStyle = `rgba(0, 0, 0, ${shadow.opacity * 0.85})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, shadow.rx * 0.45, shadow.ry * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },

  /**
   * Computes directional rim lighting factor for semi-3D armor bevels
   * @param {number} entityX
   * @param {number} entityY
   * @param {number} lightX
   * @param {number} lightY
   * @returns {{rimDir: number, intensity: number, color: string}}
   */
  calculateRimLighting(entityX, entityY, lightX, lightY, lightColor = '#f59e0b') {
    const dx = lightX - entityX;
    const dy = lightY - entityY;
    const dist = Math.hypot(dx, dy) || 1;
    const rimDir = Math.atan2(dy, dx);
    const intensity = Math.max(0.15, Math.min(1.0, 1.2 - dist / 350));

    return {
      rimDir,
      intensity,
      color: lightColor
    };
  }
};
