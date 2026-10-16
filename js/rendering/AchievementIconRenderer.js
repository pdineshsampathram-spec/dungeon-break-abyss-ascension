// =====================================================================
//  DUNGEON BREAK — js/rendering/AchievementIconRenderer.js
//  Authoritative Pixel-Art Icon Renderer & Living Idle Animations
//  Authentic Canvas 2D Dark-Fantasy Aesthetics (No Stock Icons / No Emojis)
// =====================================================================

import { drawPixelEye } from '../cinematics/ShatteredMindCinematic.js';

/**
 * Draws a living, authentic dark-fantasy pixel-art icon for any achievement.
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {string} id Achievement ID
 * @param {number} cx Center X coordinate
 * @param {number} cy Center Y coordinate
 * @param {number} size Box dimension (e.g. 32 for list, 72 for detail)
 * @param {boolean} isUnlocked Whether the achievement is unlocked
 * @param {boolean} isSelected Whether the achievement row is currently selected
 * @param {number} timer Global ambient timer
 * @param {boolean} isReducedMotion Whether prefers-reduced-motion is active
 */
export function drawAchievementIcon(ctx, id, cx, cy, size, isUnlocked, isSelected, timer, isReducedMotion = false) {
  const isLarge = size >= 50;
  const scale = isLarge ? size / 32 : size / 32;
  const t = isReducedMotion ? 0 : timer;

  ctx.save();
  ctx.translate(cx, cy);

  // 1. Dark obsidian backing plate
  const half = Math.round(size / 2);
  const r = Math.max(3, Math.round(size * 0.12));

  // Backing shadow / aura
  if (isUnlocked) {
    ctx.shadowColor = id === 'last_witness'
      ? 'rgba(245, 158, 11, 0.45)'
      : 'rgba(201, 168, 76, 0.35)';
    ctx.shadowBlur = isLarge ? 14 : 6;
  } else {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = isLarge ? 8 : 4;
  }

  // Base Plate
  ctx.fillStyle = isUnlocked
    ? (isSelected ? '#0c1222' : '#080d1a')
    : (isSelected ? '#0f131d' : '#06080e');
  ctx.strokeStyle = isUnlocked
    ? (isSelected ? '#fde68a' : 'rgba(201, 168, 76, 0.75)')
    : (isSelected ? 'rgba(148, 163, 184, 0.65)' : 'rgba(51, 65, 85, 0.45)');
  ctx.lineWidth = isLarge ? (isSelected ? 2.0 : 1.5) : (isSelected ? 1.5 : 1.0);

  // Draw rounded rectangular plate
  ctx.beginPath();
  const rad = isLarge ? 8 : 4;
  ctx.roundRect ? ctx.roundRect(-half, -half, size, size, rad) : ctx.rect(-half, -half, size, size);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Subtle interior vignette / accent
  if (isUnlocked && isLarge) {
    const radial = ctx.createRadialGradient(0, 0, 2, 0, 0, half);
    radial.addColorStop(0, id === 'last_witness' ? 'rgba(239, 68, 68, 0.18)' : 'rgba(245, 158, 11, 0.15)');
    radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radial;
    ctx.fill();
  }

  // Clip content inside the plate so effects stay clean
  ctx.save();
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(-half + 1, -half + 1, size - 2, size - 2, rad - 1) : ctx.rect(-half + 1, -half + 1, size - 2, size - 2);
  ctx.clip();

  // Desaturate / dim locked icons slightly while keeping their distinct silhouette readable
  if (!isUnlocked) {
    ctx.globalAlpha = 0.55;
  }

  // 2. Specialized Icon Drawing by ID
  switch (id) {
    case 'first_blood':
      _drawFirstBlood(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'overwhelmed':
      _drawOverwhelmed(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'consumed':
      _drawConsumed(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'sanity_keeper':
      _drawSanityKeeper(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'mind_break':
      _drawMindBreak(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'shield_bearer':
      _drawShieldBearer(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'sharpshooter':
      _drawSharpshooter(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'untouchable':
      _drawUntouchable(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'speed_runner':
      _drawSpeedRunner(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'jailbreaker':
      _drawJailbreaker(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'void_conqueror':
      _drawVoidConqueror(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'executed':
      _drawExecuted(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'boss_slayer':
      _drawBossSlayer(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'savior':
      _drawSavior(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'lore_master':
      _drawLoreMaster(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'soul_ascendant':
      _drawSoulAscendant(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'maxed_talent':
      _drawMaxedTalent(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'true_hero':
      _drawTrueHero(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'betrayed':
      _drawBetrayed(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'rampage':
      _drawRampage(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'last_witness':
      _drawLastWitness(ctx, scale, t, isUnlocked, isLarge);
      break;
    default:
      _drawGenericSeal(ctx, scale, t, isUnlocked);
      break;
  }

  ctx.restore(); // end clip
  ctx.restore(); // end master
}

// ─────────────────────────────────────────────────────────────────────
// INDIVIDUAL PIXEL-ART ICON IMPLEMENTATIONS
// ─────────────────────────────────────────────────────────────────────

// 1. FIRST BLOOD — Crimson Gladius with dripping blood droplet
function _drawFirstBlood(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Diagonal Gladius Blade
  ctx.strokeStyle = unl ? '#e2e8f0' : '#94a3b8';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-7, -7);
  ctx.lineTo(4, 4);
  ctx.stroke();

  // Pommel & Guard
  ctx.strokeStyle = unl ? '#fbbf24' : '#64748b';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-9, -5);
  ctx.lineTo(-5, -9);
  ctx.stroke();

  // Blood on tip
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(4, 4, 2.5, 2.5);

  // Dripping blood droplet cycle (every 2.2s)
  const dropCycle = (t % 2.2) / 2.2;
  const dropY = 4 + dropCycle * 9;
  const dropAlpha = Math.max(0, 1 - dropCycle);
  ctx.fillStyle = `rgba(239, 68, 68, ${dropAlpha})`;
  ctx.fillRect(4.5, dropY, 2, 2.5);

  // Blade glint pulse
  if (unl && isLg) {
    const glint = (Math.sin(t * 3.0) + 1) * 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${glint * 0.8})`;
    ctx.fillRect(-2, -2, 2, 2);
  }
  ctx.restore();
}

// 2. OVERWHELMED — Cracked ivory skull with creeping void tendrils
function _drawOverwhelmed(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Skull cranium
  ctx.fillStyle = unl ? '#f1f5f9' : '#94a3b8';
  ctx.fillRect(-6, -7, 12, 8);
  ctx.fillRect(-5, 1, 10, 4); // jaw

  // Eye sockets
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-4, -4, 3, 3);
  ctx.fillRect(1, -4, 3, 3);

  // Eerie purple eye fire
  const fireGlow = (Math.sin(t * 4.0) + 1) * 0.5;
  ctx.fillStyle = `rgba(168, 85, 247, ${0.4 + fireGlow * 0.6})`;
  ctx.fillRect(-3, -3, 1.5, 1.5);
  ctx.fillRect(2, -3, 1.5, 1.5);

  // Creeping shadow tendrils at bottom
  ctx.strokeStyle = '#581c87';
  ctx.lineWidth = 1.2;
  const tendrilWave = Math.sin(t * 2.5) * 2;
  ctx.beginPath();
  ctx.moveTo(-8, 8);
  ctx.quadraticCurveTo(-4 + tendrilWave, 4, -2, 6);
  ctx.moveTo(8, 8);
  ctx.quadraticCurveTo(4 - tendrilWave, 4, 2, 6);
  ctx.stroke();

  ctx.restore();
}

// 3. CONSUMED — Abyssal void singularity with rotating accretion
function _drawConsumed(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Deep void sphere
  ctx.fillStyle = '#020617';
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();

  // Accretion disk rings
  const rot = t * 1.8;
  ctx.strokeStyle = unl ? '#818cf8' : '#475569';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 3.5, rot * 0.3, 0, Math.PI * 2);
  ctx.stroke();

  // Secondary counter-rotating ring
  ctx.strokeStyle = unl ? 'rgba(56, 189, 248, 0.7)' : 'rgba(71, 85, 105, 0.4)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 4.5, -rot * 0.25, 0, Math.PI * 2);
  ctx.stroke();

  // Center void core pulse
  const p = (Math.sin(t * 3.0) + 1) * 0.5;
  ctx.fillStyle = `rgba(129, 140, 248, ${0.3 + p * 0.5})`;
  ctx.fillRect(-1.5, -1.5, 3, 3);

  ctx.restore();
}

// 4. SANITY KEEPER — Mind sanctuary crystal lantern with warm amber flame
function _drawSanityKeeper(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Lantern bronze frame
  ctx.strokeStyle = unl ? '#d97706' : '#64748b';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-5, -7, 10, 13);
  // Cap and loop
  ctx.beginPath();
  ctx.moveTo(-6, -7);
  ctx.lineTo(0, -10);
  ctx.lineTo(6, -7);
  ctx.stroke();

  // Warm amber flame inside
  const flamePulse = Math.sin(t * 4.5) * 1.5;
  ctx.fillStyle = unl ? '#fbbf24' : '#94a3b8';
  ctx.fillRect(-2, -3 + flamePulse * 0.3, 4, 6);
  ctx.fillStyle = unl ? '#fef08a' : '#cbd5e1';
  ctx.fillRect(-1, -2 + flamePulse * 0.3, 2, 3);

  // Ambient aura
  if (unl) {
    ctx.fillStyle = `rgba(251, 191, 36, ${0.15 + (Math.sin(t * 3) + 1) * 0.1})`;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// 5. MIND BREAK — Fractured brain with crackling psychic lightning
function _drawMindBreak(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Left & right brain hemispheres
  ctx.fillStyle = unl ? '#c084fc' : '#64748b';
  ctx.fillRect(-7, -6, 5, 10);
  ctx.fillRect(2, -6, 5, 10);
  ctx.fillRect(-6, -8, 12, 3);

  // Central jagged fissure
  ctx.fillStyle = '#090d16';
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(-2, -3);
  ctx.lineTo(2, 1);
  ctx.lineTo(-1, 6);
  ctx.lineTo(0, 6);
  ctx.stroke();

  // Synaptic spark flash
  const sparkPhase = (Math.sin(t * 6.0) + 1) * 0.5;
  if (sparkPhase > 0.6) {
    ctx.fillStyle = unl ? '#f472b6' : '#cbd5e1';
    ctx.fillRect(-1.5, -2, 3, 3);
    ctx.fillRect(1, 2, 2, 2);
  }

  ctx.restore();
}

// 6. SHIELD BEARER — Azure Aegis kite shield with barrier pulse
function _drawShieldBearer(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Kite shield body
  ctx.fillStyle = unl ? '#1e3a8a' : '#1e293b';
  ctx.strokeStyle = unl ? '#60a5fa' : '#64748b';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(7, -6);
  ctx.lineTo(5, 4);
  ctx.lineTo(0, 10);
  ctx.lineTo(-5, 4);
  ctx.lineTo(-7, -6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Central diamond rune
  ctx.fillStyle = unl ? '#93c5fd' : '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.lineTo(3, 0);
  ctx.lineTo(0, 4);
  ctx.lineTo(-3, 0);
  ctx.closePath();
  ctx.fill();

  // Expanding barrier pulse
  if (unl) {
    const pulseProg = (t % 2.0) / 2.0;
    ctx.strokeStyle = `rgba(96, 165, 250, ${1 - pulseProg})`;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(0, 0, 8 + pulseProg * 6, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

// 7. SHARPSHOOTER — Composite recurve bow with glowing arrow and glint
function _drawSharpshooter(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Recurve bow wood
  ctx.strokeStyle = unl ? '#d97706' : '#64748b';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.arc(-2, 0, 9, -0.45 * Math.PI, 0.45 * Math.PI);
  ctx.stroke();

  // Taut bowstring
  ctx.strokeStyle = unl ? 'rgba(254, 240, 138, 0.8)' : '#475569';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(4, -8);
  ctx.lineTo(-1, 0);
  ctx.lineTo(4, 8);
  ctx.stroke();

  // Arrow
  ctx.strokeStyle = unl ? '#fef08a' : '#94a3b8';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.lineTo(9, 0);
  ctx.stroke();

  // Arrowhead glint star
  ctx.fillStyle = unl ? '#ffffff' : '#cbd5e1';
  const glint = (Math.sin(t * 4.0) + 1) * 0.5;
  ctx.fillRect(8, -1, 3, 2);
  if (unl && glint > 0.5) {
    ctx.fillRect(9, -2, 1, 4);
  }

  ctx.restore();
}

// 8. UNTOUCHABLE — Celestial diamond prism with orbiting deflection shields
function _drawUntouchable(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Diamond octahedron
  ctx.fillStyle = unl ? '#06b6d4' : '#334155';
  ctx.strokeStyle = unl ? '#a5f3fc' : '#64748b';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(6, 0);
  ctx.lineTo(0, 9);
  ctx.lineTo(-6, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Internal facet line
  ctx.strokeStyle = unl ? '#ffffff' : '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(6, 0);
  ctx.moveTo(0, -9);
  ctx.lineTo(0, 9);
  ctx.stroke();

  // Orbiting twin deflection shields
  const orbRot = t * 2.5;
  const ox1 = Math.cos(orbRot) * 10;
  const oy1 = Math.sin(orbRot) * 5;
  const ox2 = Math.cos(orbRot + Math.PI) * 10;
  const oy2 = Math.sin(orbRot + Math.PI) * 5;

  ctx.fillStyle = unl ? '#ffffff' : '#cbd5e1';
  ctx.fillRect(ox1 - 1.5, oy1 - 1.5, 3, 3);
  ctx.fillRect(ox2 - 1.5, oy2 - 1.5, 3, 3);

  ctx.restore();
}

// 9. SPEED RUNNER — Winged lightning feather with electric speed trail
function _drawSpeedRunner(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Speed streaks behind
  const streakShift = (t * 8) % 6;
  ctx.strokeStyle = unl ? 'rgba(56, 189, 248, 0.6)' : 'rgba(71, 85, 105, 0.4)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-11 + streakShift, -4);
  ctx.lineTo(-3 + streakShift, -4);
  ctx.moveTo(-9 + streakShift, 3);
  ctx.lineTo(-1 + streakShift, 3);
  ctx.stroke();

  // Central lightning bolt
  ctx.fillStyle = unl ? '#facc15' : '#64748b';
  ctx.beginPath();
  ctx.moveTo(2, -9);
  ctx.lineTo(-4, 0);
  ctx.lineTo(0, 0);
  ctx.lineTo(-3, 9);
  ctx.lineTo(6, -1);
  ctx.lineTo(1, -1);
  ctx.closePath();
  ctx.fill();

  // Wing feather accent
  ctx.strokeStyle = unl ? '#fef08a' : '#94a3b8';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(1, -6);
  ctx.quadraticCurveTo(8, -8, 9, -2);
  ctx.stroke();

  ctx.restore();
}

// 10. JAILBREAKER — Gorgaroth's broken iron chains with molten sparks
function _drawJailbreaker(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Central heavy iron collar
  ctx.strokeStyle = unl ? '#94a3b8' : '#475569';
  ctx.lineWidth = 2.4;
  ctx.strokeRect(-5, -5, 10, 10);

  // Broken chain link on left
  ctx.beginPath();
  ctx.ellipse(-9, 0, 3.5, 2, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Snapped link on right with gap
  ctx.beginPath();
  ctx.arc(9, 0, 3.5, 0.3 * Math.PI, 1.7 * Math.PI);
  ctx.stroke();

  // Molten sparks at snap point
  const sparkY = Math.sin(t * 6) * 3;
  ctx.fillStyle = unl ? '#f97316' : '#94a3b8';
  ctx.fillRect(8.5, sparkY - 1, 2, 2);
  ctx.fillStyle = unl ? '#fde68a' : '#cbd5e1';
  ctx.fillRect(10.5, -sparkY + 1, 1.5, 1.5);

  ctx.restore();
}

// 11. VOID CONQUEROR — Malakor's jagged void core with orbiting shards
function _drawVoidConqueror(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Jagged core
  ctx.fillStyle = unl ? '#581c87' : '#1e1b4b';
  ctx.strokeStyle = unl ? '#c084fc' : '#64748b';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.lineTo(5, -2);
  ctx.lineTo(3, 6);
  ctx.lineTo(-4, 5);
  ctx.lineTo(-6, -1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Three orbiting void shards
  const angles = [t * 2.0, t * 2.0 + (2 * Math.PI / 3), t * 2.0 + (4 * Math.PI / 3)];
  ctx.fillStyle = unl ? '#a855f7' : '#475569';
  angles.forEach(ang => {
    const sx = Math.cos(ang) * 9.5;
    const sy = Math.sin(ang) * 9.5;
    ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
  });

  ctx.restore();
}

// 12. EXECUTED — Horned Warden executioner blade plunged through shadow
function _drawExecuted(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Downward plunged greatsword
  ctx.strokeStyle = unl ? '#cbd5e1' : '#64748b';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(0, 7);
  ctx.stroke();

  // Crossguard
  ctx.strokeStyle = unl ? '#991b1b' : '#334155';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(-6, -4);
  ctx.lineTo(6, -4);
  ctx.stroke();

  // Blood fuller groove pulse
  const bGlow = (Math.sin(t * 3.5) + 1) * 0.5;
  ctx.strokeStyle = `rgba(220, 38, 38, ${0.4 + bGlow * 0.6})`;
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(0, -3);
  ctx.lineTo(0, 5);
  ctx.stroke();

  // Warden horn silhouette in background
  ctx.strokeStyle = unl ? '#7f1d1d' : '#334155';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-8, -6);
  ctx.quadraticCurveTo(-4, -9, 0, -5);
  ctx.moveTo(8, -6);
  ctx.quadraticCurveTo(4, -9, 0, -5);
  ctx.stroke();

  ctx.restore();
}

// 13. BOSS SLAYER — Shattered Warden arch-demon crown with golden triumph dust
function _drawBossSlayer(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Shattered crown
  ctx.fillStyle = unl ? '#eab308' : '#64748b';
  ctx.strokeStyle = unl ? '#fde68a' : '#94a3b8';
  ctx.lineWidth = 1.2;
  // Left fragment
  ctx.beginPath();
  ctx.moveTo(-8, 3);
  ctx.lineTo(-8, -4);
  ctx.lineTo(-4, -1);
  ctx.lineTo(-1, -6);
  ctx.lineTo(0, 3);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Right fragment (slightly detached/cracked)
  ctx.beginPath();
  ctx.moveTo(2, 4);
  ctx.lineTo(2, -4);
  ctx.lineTo(5, -1);
  ctx.lineTo(8, -4);
  ctx.lineTo(8, 4);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Central red gem
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(-1, 0, 2.5, 2.5);

  // Ascending triumph motes
  if (unl) {
    const moteY = ((t * 4) % 12);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-3, 6 - moteY, 1.5, 1.5);
    ctx.fillRect(4, 8 - ((moteY + 4) % 12), 1.5, 1.5);
  }

  ctx.restore();
}

// 14. SAVIOR — Broken shackle with radiant emerald aura of freedom
function _drawSavior(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Shackle split open
  ctx.strokeStyle = unl ? '#cbd5e1' : '#64748b';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(-3, 0, 6, 0.4 * Math.PI, 1.6 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(4, 0, 6, 1.4 * Math.PI, 0.6 * Math.PI);
  ctx.stroke();

  // Radiant emerald rescue light
  ctx.fillStyle = unl ? '#10b981' : '#475569';
  ctx.fillRect(-1.5, -2, 3, 4);

  // Radial emerald rays
  if (unl) {
    const rayRot = t * 1.5;
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.5)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(-8, -8); ctx.lineTo(8, 8);
    ctx.moveTo(-8, 8); ctx.lineTo(8, -8);
    ctx.stroke();
  }

  ctx.restore();
}

// 15. LORE MASTER — Ancient parchment scroll with living glowing runes
function _drawLoreMaster(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Parchment body
  ctx.fillStyle = unl ? '#fef3c7' : '#94a3b8';
  ctx.strokeStyle = unl ? '#b45309' : '#475569';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-7, -8, 14, 16);
  ctx.fillRect(-7, -8, 14, 16);

  // Parchment curled ends
  ctx.fillStyle = unl ? '#fde68a' : '#cbd5e1';
  ctx.fillRect(-8, -9, 16, 2.5);
  ctx.fillRect(-8, 7, 16, 2.5);

  // Sequential glowing runes (4 runes)
  const activeRune = Math.floor((t * 2.0) % 4);
  const runeColors = ['#0284c7', '#0284c7', '#0284c7', '#0284c7'];
  for (let i = 0; i < 4; i++) {
    const ry = -5 + i * 3.2;
    ctx.fillStyle = (unl && i === activeRune) ? '#38bdf8' : (unl ? '#64748b' : '#334155');
    ctx.fillRect(-4, ry, 8, 1.5);
  }

  ctx.restore();
}

// 16. SOUL ASCENDANT — Crystal vessel with swirling Abyss Soul flame
function _drawSoulAscendant(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Crystal urn outline
  ctx.strokeStyle = unl ? '#c084fc' : '#64748b';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-6, -7);
  ctx.lineTo(6, -7);
  ctx.lineTo(4, 7);
  ctx.lineTo(-4, 7);
  ctx.closePath();
  ctx.stroke();

  // Base & lid
  ctx.strokeRect(-7, -9, 14, 2);
  ctx.strokeRect(-5, 7, 10, 2);

  // Swirling soul flame (figure eight)
  const fx = Math.sin(t * 3.0) * 2.5;
  const fy = Math.cos(t * 6.0) * 1.8;
  ctx.fillStyle = unl ? '#67e8f9' : '#94a3b8';
  ctx.beginPath();
  ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Violet flame wisp aura
  if (unl) {
    ctx.fillStyle = 'rgba(192, 132, 252, 0.35)';
    ctx.beginPath();
    ctx.arc(fx, fy, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// 17. MAXED TALENT — Sanctum 8-pointed star with fully awakened power nodes
function _drawMaxedTalent(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Star points
  ctx.fillStyle = unl ? '#f59e0b' : '#475569';
  ctx.strokeStyle = unl ? '#fef08a' : '#94a3b8';
  ctx.lineWidth = 1.2;

  // Cross 1
  ctx.beginPath();
  ctx.moveTo(0, -9); ctx.lineTo(2, -2);
  ctx.lineTo(9, 0);  ctx.lineTo(2, 2);
  ctx.lineTo(0, 9);  ctx.lineTo(-2, 2);
  ctx.lineTo(-9, 0); ctx.lineTo(-2, -2);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Central radiant core
  const coreGlow = (Math.sin(t * 4.0) + 1) * 0.5;
  ctx.fillStyle = unl ? `rgba(255, 255, 255, ${0.7 + coreGlow * 0.3})` : '#cbd5e1';
  ctx.fillRect(-2, -2, 4, 4);

  // 4 corner nodes
  ctx.fillStyle = unl ? '#fde68a' : '#64748b';
  ctx.fillRect(-6, -6, 2, 2);
  ctx.fillRect(5, -6, 2, 2);
  ctx.fillRect(-6, 5, 2, 2);
  ctx.fillRect(5, 5, 2, 2);

  ctx.restore();
}

// 18. TRUE HERO — Sunburst halo behind luminous sword (Hero Ending)
function _drawTrueHero(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Sunburst halo rays
  const sunRot = t * 0.8;
  ctx.strokeStyle = unl ? 'rgba(251, 191, 36, 0.45)' : 'rgba(71, 85, 105, 0.3)';
  ctx.lineWidth = 1.0;
  for (let i = 0; i < 8; i++) {
    const ang = sunRot + i * (Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * 4, Math.sin(ang) * 4);
    ctx.lineTo(Math.cos(ang) * 9.5, Math.sin(ang) * 9.5);
    ctx.stroke();
  }

  // Upright luminous blade
  ctx.strokeStyle = unl ? '#ffffff' : '#cbd5e1';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(0, 5);
  ctx.stroke();

  // Golden crossguard
  ctx.strokeStyle = unl ? '#fbbf24' : '#64748b';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-5, 4);
  ctx.lineTo(5, 4);
  ctx.stroke();

  // Pommel
  ctx.fillStyle = unl ? '#fde68a' : '#94a3b8';
  ctx.fillRect(-1, 7, 2, 2);

  ctx.restore();
}

// 19. BETRAYED — Poisoned stiletto piercing royal circlet (Betrayal Ending)
function _drawBetrayed(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Pierced circlet
  ctx.strokeStyle = unl ? '#ca8a04' : '#64748b';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(0, 3, 8, 3.5, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Downward angled stiletto
  ctx.strokeStyle = unl ? '#e2e8f0' : '#475569';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(4, -8);
  ctx.lineTo(-2, 4);
  ctx.stroke();

  // Poison violet dripping drop
  const poisonCycle = (t % 2.0) / 2.0;
  ctx.fillStyle = unl ? '#a855f7' : '#64748b';
  ctx.fillRect(-2, 4 + poisonCycle * 5, 2, 2.5);

  ctx.restore();
}

// 20. RAMPAGE — Burning twin battleaxe & abyssal inferno (Rampage Ending)
function _drawRampage(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Crossed battleaxe shafts
  ctx.strokeStyle = unl ? '#b45309' : '#475569';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(-7, -7); ctx.lineTo(7, 7);
  ctx.moveTo(7, -7);  ctx.lineTo(-7, 7);
  ctx.stroke();

  // Axe blades
  ctx.fillStyle = unl ? '#dc2626' : '#64748b';
  ctx.fillRect(-8, -9, 4, 3);
  ctx.fillRect(4, -9, 4, 3);

  // Animated flickering flame tongues
  const flameStep = Math.floor((t * 6.0) % 3);
  ctx.fillStyle = unl ? (flameStep === 0 ? '#ef4444' : flameStep === 1 ? '#f97316' : '#fde68a') : '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(-3, 0);
  ctx.lineTo(3, 0);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// 21. THE LAST WITNESS — Approved Absolute Red Eye & Three Broken Outer Rings
function _drawLastWitness(ctx, scale, timer, isUnlocked, isLarge) {
  ctx.save();

  // Base scale calculation
  const s = isLarge ? 1.0 : 0.44;
  ctx.scale(s, s);

  const cx = 0, cy = 0;
  const r = 24;

  // Dark backing aura
  ctx.shadowColor = isUnlocked ? 'rgba(239, 68, 68, 0.55)' : 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = isLarge ? 12 : 5;
  ctx.fillStyle = '#050308';
  ctx.beginPath();
  ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Ring 1: Hero (Top-Right Arc, Gold)
  ctx.strokeStyle = isUnlocked ? '#fbbf24' : 'rgba(251, 191, 36, 0.55)';
  ctx.lineWidth = isLarge ? 2.2 : 1.8;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0.00 * Math.PI, 0.45 * Math.PI);
  ctx.stroke();

  // Ring 2: Betrayal (Bottom Arc, Amethyst/Violet)
  ctx.strokeStyle = isUnlocked ? '#c084fc' : 'rgba(192, 132, 252, 0.55)';
  ctx.lineWidth = isLarge ? 2.2 : 1.8;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0.55 * Math.PI, 1.15 * Math.PI);
  ctx.stroke();

  // Ring 3: Rampage (Top-Left Arc, Crimson)
  ctx.strokeStyle = isUnlocked ? '#ef4444' : 'rgba(239, 68, 68, 0.55)';
  ctx.lineWidth = isLarge ? 2.2 : 1.8;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 1.30 * Math.PI, 1.95 * Math.PI);
  ctx.stroke();

  // Small muted-gold pixel notches at gap breaks
  ctx.fillStyle = '#fde68a';
  ctx.fillRect(Math.round(cx + 17), Math.round(cy + 15), 2, 2);
  ctx.fillRect(Math.round(cx - 17), Math.round(cy + 15), 2, 2);
  ctx.fillRect(Math.round(cx), Math.round(cy - 22), 2, 2);

  // Exact Approved Absolute Red Pixel Eye at Center
  ctx.save();
  ctx.translate(cx, cy);
  // Scale down 80x44 eye to fit nicely inside the ring
  ctx.scale(0.38, 0.38);
  drawPixelEye(ctx, 0, 0, 1.0, 0, timer);
  ctx.restore();

  // Central golden ember / light representing the player's journey
  const emberPulse = (Math.sin(timer * 3.5) + 1) * 0.5;
  ctx.fillStyle = isUnlocked ? (emberPulse > 0.5 ? '#fef08a' : '#f59e0b') : '#94a3b8';
  ctx.fillRect(Math.round(cx - 1.5), Math.round(cy - 1.5), 3, 3);

  ctx.restore();
}

// Fallback generic seal
function _drawGenericSeal(ctx, s, t, unl) {
  ctx.save();
  ctx.scale(s, s);
  ctx.fillStyle = unl ? '#fbbf24' : '#64748b';
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
