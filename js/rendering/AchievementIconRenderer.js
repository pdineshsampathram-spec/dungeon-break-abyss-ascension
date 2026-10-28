// =====================================================================
//  DUNGEON BREAK — js/rendering/AchievementIconRenderer.js
//  Authoritative Pixel-Art Icon Renderer & Living Idle Animations
//  Authentic Canvas 2D Dark-Fantasy Aesthetics (Zero Stock Icons, Zero Emojis)
//  Covers ALL 40 Canonical Deeds in the Dungeon Break Registry
// =====================================================================

import { drawPixelEye } from '../cinematics/ShatteredMindCinematic.js';

/**
 * Draws an authentic dark-fantasy pixel-art icon for any achievement.
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {string} id Achievement ID
 * @param {number} cx Center X coordinate
 * @param {number} cy Center Y coordinate
 * @param {number} size Box dimension (30 for list cards, 56-64 for detail stele)
 * @param {boolean} isUnlocked Whether the achievement is unlocked
 * @param {boolean} isSelected Whether the achievement row is currently selected
 * @param {number} timer Global ambient timer
 * @param {boolean} isReducedMotion Whether prefers-reduced-motion is active
 */
export function drawAchievementIcon(ctx, id, cx, cy, size, isUnlocked, isSelected, timer, isReducedMotion = false) {
  const isLarge = size >= 48;
  const scale = size / 32;
  const t = isReducedMotion ? 0 : (timer || 0);

  ctx.save();
  ctx.translate(Math.round(cx), Math.round(cy));

  const half = Math.round(size / 2);
  const rad = Math.max(2, Math.round(size * 0.12));

  // 1. Backing Outer Aura
  if (isUnlocked) {
    ctx.shadowColor = id === 'last_witness'
      ? 'rgba(239, 68, 68, 0.55)'
      : (isSelected ? 'rgba(245, 158, 11, 0.45)' : 'rgba(217, 119, 6, 0.25)');
    ctx.shadowBlur = isLarge ? (isSelected ? 14 : 10) : (isSelected ? 6 : 4);
  } else {
    ctx.shadowColor = 'rgba(1, 2, 6, 0.6)';
    ctx.shadowBlur = 4;
  }

  // 2. Base Carved Obsidian Plate
  const plateGrad = ctx.createLinearGradient(-half, -half, -half, half);
  if (isUnlocked) {
    if (isSelected) {
      plateGrad.addColorStop(0, '#2e2048');
      plateGrad.addColorStop(0.5, '#1e1434');
      plateGrad.addColorStop(1, '#120c22');
    } else {
      plateGrad.addColorStop(0, '#24183c');
      plateGrad.addColorStop(0.5, '#18102a');
      plateGrad.addColorStop(1, '#0e091c');
    }
  } else {
    plateGrad.addColorStop(0, '#161324');
    plateGrad.addColorStop(0.5, '#0e0c18');
    plateGrad.addColorStop(1, '#07060e');
  }

  ctx.fillStyle = plateGrad;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(-half, -half, size, size, rad);
  else ctx.rect(-half, -half, size, size);
  ctx.fill();

  // 3. Plate Framing
  if (isUnlocked) {
    ctx.strokeStyle = isSelected ? '#fde68a' : 'rgba(217, 119, 6, 0.85)';
    ctx.lineWidth = isLarge ? 1.6 : 1.2;
  } else {
    ctx.strokeStyle = isSelected ? 'rgba(148, 163, 184, 0.65)' : 'rgba(71, 85, 105, 0.45)';
    ctx.lineWidth = 1.0;
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 4. Clip inside plate for artwork
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(-half + 1, -half + 1, size - 2, size - 2, rad - 1);
  else ctx.rect(-half + 1, -half + 1, size - 2, size - 2);
  ctx.clip();

  // 5. Directional 1px Top Specular Highlight
  ctx.fillStyle = isUnlocked ? 'rgba(254, 240, 138, 0.25)' : 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(-half + 2, -half + 1, size - 4, 1);

  // Subtle interior radial glow for unlocked icons
  if (isUnlocked) {
    const radGlow = ctx.createRadialGradient(0, 0, 1, 0, 0, half);
    radGlow.addColorStop(0, id === 'last_witness' ? 'rgba(239, 68, 68, 0.22)' : 'rgba(245, 158, 11, 0.16)');
    radGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radGlow;
    ctx.fillRect(-half, -half, size, size);
  }

  // Desaturate locked icons slightly while keeping their silhouette readable
  if (!isUnlocked) {
    ctx.globalAlpha = 0.72;
  }

  // ─────────────────────────────────────────────────────────────────
  // 6. SPECIALIZED PIXEL-ART ICON DRAWING BY ID
  // ─────────────────────────────────────────────────────────────────
  switch (id) {
    // Combat
    case 'first_blood':
      _drawFirstBlood(ctx, scale, t, isUnlocked, isLarge);
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
    case 'jailbreaker':
      _drawJailbreaker(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'gorgaroth_nemesis':
      _drawGorgarothNemesis(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'void_conqueror':
      _drawVoidConqueror(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'malakor_nemesis':
      _drawMalakorNemesis(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'boss_slayer':
      _drawBossSlayer(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'warden_nemesis':
      _drawWardenNemesis(ctx, scale, t, isUnlocked, isLarge);
      break;

    // Survival
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
    case 'deaths_5':
      _drawDeaths(ctx, scale, t, isUnlocked, isLarge, 5);
      break;
    case 'deaths_10':
      _drawDeaths(ctx, scale, t, isUnlocked, isLarge, 10);
      break;
    case 'deaths_25':
      _drawDeaths(ctx, scale, t, isUnlocked, isLarge, 25);
      break;
    case 'executed':
      _drawExecuted(ctx, scale, t, isUnlocked, isLarge);
      break;

    // Discovery & Savior
    case 'savior':
      _drawSavior(ctx, scale, t, isUnlocked, isLarge, 1);
      break;
    case 'savior_2':
      _drawSavior(ctx, scale, t, isUnlocked, isLarge, 2);
      break;
    case 'savior_3':
      _drawSavior(ctx, scale, t, isUnlocked, isLarge, 3);
      break;
    case 'perfect_rescue':
      _drawPerfectRescue(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'lore_master':
      _drawLoreMaster(ctx, scale, t, isUnlocked, isLarge);
      break;

    // Ascension & Talents
    case 'soul_ascendant':
      _drawSoulAscendant(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'maxed_talent':
      _drawMaxedTalent(ctx, scale, t, isUnlocked, isLarge);
      break;

    // The Three Fates (Endings)
    case 'true_hero':
      _drawTrueHero(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'betrayed':
      _drawBetrayed(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'rampage':
      _drawRampage(ctx, scale, t, isUnlocked, isLarge);
      break;

    // Speedrun
    case 'speed_runner':
      _drawSpeedRunner(ctx, scale, t, isUnlocked, isLarge);
      break;
    case 'speed_floor_1':
    case 'speed_floor_2':
    case 'speed_floor_3':
    case 'speed_floor_4':
    case 'speed_floor_5':
    case 'speed_floor_6':
    case 'speed_floor_7':
    case 'speed_floor_8':
    case 'speed_floor_9':
    case 'speed_floor_10': {
      const fNum = parseInt(id.replace('speed_floor_', ''), 10) || 1;
      _drawSpeedFloor(ctx, scale, t, isUnlocked, isLarge, fNum);
      break;
    }

    // Absolute Mastery
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

// 1. FIRST BLOOD — Forged gladius blade with dripping blood droplet
function _drawFirstBlood(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Slanted gladius blade
  ctx.strokeStyle = unl ? '#e2e8f0' : '#94a3b8';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-7, -7);
  ctx.lineTo(4, 4);
  ctx.stroke();

  // Full-tang golden pommel & crossguard
  ctx.fillStyle = unl ? '#f59e0b' : '#64748b';
  ctx.fillRect(-9, -9, 3, 3);
  ctx.strokeStyle = unl ? '#f59e0b' : '#64748b';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(-7, -4);
  ctx.lineTo(-4, -7);
  ctx.stroke();

  // Dripping crimson blood droplet from tip
  const dropY = 6 + (unl ? (Math.sin(t * 4.0) + 1) * 1.2 : 0);
  ctx.fillStyle = unl ? '#ef4444' : '#7f1d1d';
  ctx.beginPath();
  ctx.arc(6, dropY, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Blood splash droplet on blade
  ctx.fillStyle = unl ? '#dc2626' : '#991b1b';
  ctx.fillRect(2, 2, 2, 2);

  ctx.restore();
}

// 2. SHIELD BEARER — Iron tower kiteshield with bronze boss & barrier aura
function _drawShieldBearer(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Outer radiant barrier pulse
  if (unl) {
    const pulse = Math.sin(t * 3.0) * 0.2 + 0.8;
    ctx.strokeStyle = `rgba(56, 189, 248, ${0.45 * pulse})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Kiteshield body
  ctx.fillStyle = unl ? '#1e2436' : '#111420';
  ctx.strokeStyle = unl ? '#38bdf8' : '#64748b';
  ctx.lineWidth = 1.6;

  ctx.beginPath();
  ctx.moveTo(-7, -9);
  ctx.lineTo(7, -9);
  ctx.lineTo(7, 1);
  ctx.lineTo(0, 9);
  ctx.lineTo(-7, 1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bronze central boss
  ctx.fillStyle = unl ? '#f59e0b' : '#64748b';
  ctx.beginPath();
  ctx.arc(0, -1, 3.2, 0, Math.PI * 2);
  ctx.fill();

  // Specular core on boss
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-0.5, -1.5, 1, 1);

  ctx.restore();
}

// 3. SHARPSHOOTER — Ornate recurve bow with nocked glowing arrow
function _drawSharpshooter(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Recurve bow arc
  ctx.strokeStyle = unl ? '#d97706' : '#64748b';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(-2, 0, 9, -Math.PI * 0.45, Math.PI * 0.45);
  ctx.stroke();

  // Bowstring
  ctx.strokeStyle = unl ? 'rgba(254, 240, 138, 0.7)' : 'rgba(148, 163, 184, 0.4)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-2 + 9 * Math.cos(-Math.PI * 0.45), 9 * Math.sin(-Math.PI * 0.45));
  ctx.lineTo(-5, 0); // Drawn string
  ctx.lineTo(-2 + 9 * Math.cos(Math.PI * 0.45), 9 * Math.sin(Math.PI * 0.45));
  ctx.stroke();

  // Nocked piercing arrow
  ctx.strokeStyle = unl ? '#e2e8f0' : '#94a3b8';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-5, 0);
  ctx.lineTo(8, 0);
  ctx.stroke();

  // Glowing arrow head
  ctx.fillStyle = unl ? '#38bdf8' : '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(8, -2.5);
  ctx.lineTo(11, 0);
  ctx.lineTo(8, 2.5);
  ctx.closePath();
  ctx.fill();

  // Fletching
  ctx.fillStyle = unl ? '#f59e0b' : '#64748b';
  ctx.fillRect(-6, -1.5, 2, 3);

  ctx.restore();
}

// 4. UNTOUCHABLE — Ethereal shadow cloak with wind gusts & evasion ripples
function _drawUntouchable(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Evasion wind swirls
  const windOffset = (t * 5.0) % 8;
  ctx.strokeStyle = unl ? 'rgba(56, 189, 248, 0.65)' : 'rgba(71, 85, 105, 0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-9 + windOffset * 0.4, -6);
  ctx.quadraticCurveTo(-2, -8, 6 + windOffset * 0.4, -6);
  ctx.moveTo(-8 + windOffset * 0.4, 6);
  ctx.quadraticCurveTo(0, 8, 8 + windOffset * 0.4, 6);
  ctx.stroke();

  // Flowing silken shadow cloak silhouette
  ctx.fillStyle = unl ? '#1e283d' : '#101520';
  ctx.strokeStyle = unl ? '#38bdf8' : '#64748b';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.quadraticCurveTo(8, -2, 7, 7);
  ctx.lineTo(2, 5);
  ctx.lineTo(-2, 8);
  ctx.lineTo(-6, 4);
  ctx.quadraticCurveTo(-7, -2, 0, -8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Silver clasp brooch
  ctx.fillStyle = unl ? '#ffffff' : '#94a3b8';
  ctx.beginPath();
  ctx.arc(0, -6, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// 5. JAILBREAKER — Gorgaroth's shattered spiked collar & snapped chain links
function _drawJailbreaker(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Spiked heavy iron collar arc
  ctx.strokeStyle = unl ? '#b45309' : '#475569';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, 0, 8, Math.PI * 0.2, Math.PI * 1.8);
  ctx.stroke();

  // Collar spikes
  ctx.fillStyle = unl ? '#f59e0b' : '#64748b';
  const angles = [Math.PI * 0.5, Math.PI * 0.9, Math.PI * 1.3, Math.PI * 1.7];
  angles.forEach(ang => {
    const ox = Math.cos(ang) * 8;
    const oy = Math.sin(ang) * 8;
    ctx.fillRect(ox - 1, oy - 1, 2, 2);
  });

  // Snapped broken chain links bursting apart
  ctx.strokeStyle = unl ? '#f97316' : '#64748b';
  ctx.lineWidth = 1.6;
  // Broken link 1 (left)
  ctx.strokeRect(-9, -2, 4, 4);
  // Broken link 2 (right flying)
  ctx.strokeRect(6, -4, 4, 4);

  // Molten break spark
  ctx.fillStyle = unl ? '#fef08a' : '#94a3b8';
  ctx.fillRect(7, -1, 2, 2);

  ctx.restore();
}

// 6. GORGAROTH NEMESIS — Minotaur horned skull with burning amber eye
function _drawGorgarothNemesis(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Horns curving upward
  ctx.strokeStyle = unl ? '#ea580c' : '#94a3b8';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-5, -3); ctx.quadraticCurveTo(-10, -7, -8, -10);
  ctx.moveTo(5, -3); ctx.quadraticCurveTo(10, -7, 8, -10);
  ctx.stroke();

  // Heavy cranium
  ctx.fillStyle = unl ? '#3b1c16' : '#221919';
  ctx.strokeStyle = unl ? '#f97316' : '#94a3b8';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-6, -3);
  ctx.lineTo(6, -3);
  ctx.lineTo(5, 5);
  ctx.lineTo(-5, 5);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Burning amber eye sockets
  ctx.fillStyle = unl ? '#fef08a' : '#f59e0b';
  ctx.fillRect(-3, 0, 2, 2);
  ctx.fillRect(1, 0, 2, 2);

  // Iron nose ring
  ctx.strokeStyle = unl ? '#f59e0b' : '#cbd5e1';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 6, 2.8, 0, Math.PI);
  ctx.stroke();

  ctx.restore();
}

// 7. VOID CONQUEROR — Malakor's abyssal void rift & crescent scythe blade
function _drawVoidConqueror(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Swirling void rift corona
  if (unl) {
    const r = 8 + Math.sin(t * 3.5) * 1.5;
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.45)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Dark matter crescent scythe blade
  ctx.strokeStyle = unl ? '#c084fc' : '#64748b';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, 0, 7.5, -Math.PI * 0.7, Math.PI * 0.3);
  ctx.stroke();

  // Scythe staff shaft
  ctx.strokeStyle = unl ? '#7e22ce' : '#475569';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-6, 8);
  ctx.lineTo(6, -6);
  ctx.stroke();

  // Central void singularity core
  ctx.fillStyle = unl ? '#a855f7' : '#475569';
  ctx.beginPath();
  ctx.arc(0, 0, 2.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-0.5, -0.5, 1, 1);

  ctx.restore();
}

// 8. MALAKOR NEMESIS — Malakor's winged void crest & occult core
function _drawMalakorNemesis(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Winged void appendages
  ctx.fillStyle = unl ? '#2e1244' : '#140a1e';
  ctx.strokeStyle = unl ? '#c084fc' : '#64748b';
  ctx.lineWidth = 1.4;

  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.lineTo(-9, -7);
  ctx.lineTo(-6, 2);
  ctx.lineTo(0, 6);
  ctx.lineTo(6, 2);
  ctx.lineTo(9, -7);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Ethereal vertical void eye
  ctx.fillStyle = unl ? '#f3e8ff' : '#94a3b8';
  ctx.beginPath();
  ctx.ellipse(0, 0, 2, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = unl ? '#7e22ce' : '#334155';
  ctx.beginPath();
  ctx.arc(0, 0, 1.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// 9. BOSS SLAYER — Warden's spiked obsidian iron crown & crossed swords
function _drawBossSlayer(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Crossed execution swords
  ctx.strokeStyle = unl ? '#94a3b8' : '#475569';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-8, 8); ctx.lineTo(8, -8);
  ctx.moveTo(8, 8); ctx.lineTo(-8, -8);
  ctx.stroke();

  // Spired Obsidian Crown
  ctx.fillStyle = unl ? '#f59e0b' : '#64748b';
  ctx.strokeStyle = unl ? '#b45309' : '#475569';
  ctx.lineWidth = 1.2;

  ctx.beginPath();
  ctx.moveTo(-8, 4);
  ctx.lineTo(8, 4);
  ctx.lineTo(7, -5);
  ctx.lineTo(3.5, 0);
  ctx.lineTo(0, -8);
  ctx.lineTo(-3.5, 0);
  ctx.lineTo(-7, -5);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Crown ruby jewel
  ctx.fillStyle = unl ? '#ef4444' : '#7f1d1d';
  ctx.fillRect(-1, 0, 2, 2);

  ctx.restore();
}

// 10. WARDEN NEMESIS — The Abyss Warden's crowned visage with flame eyes
function _drawWardenNemesis(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Spiked great-helm visage
  ctx.fillStyle = unl ? '#241a34' : '#110c1c';
  ctx.strokeStyle = unl ? '#ef4444' : '#64748b';
  ctx.lineWidth = 1.6;

  ctx.beginPath();
  ctx.moveTo(-6, -6);
  ctx.lineTo(6, -6);
  ctx.lineTo(7, 3);
  ctx.lineTo(0, 8);
  ctx.lineTo(-7, 3);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Triple crown spires
  ctx.fillStyle = unl ? '#f59e0b' : '#64748b';
  ctx.fillRect(-6, -9, 2, 3);
  ctx.fillRect(-1, -10, 2, 4);
  ctx.fillRect(5, -9, 2, 3);

  // Burning purple/red visor slit
  ctx.fillStyle = unl ? '#f87171' : '#64748b';
  ctx.fillRect(-4, -1, 8, 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-2, -0.5, 4, 1);

  ctx.restore();
}

// 11. OVERWHELMED — Swarm of chittering subterranean crawler claws & pincers
function _drawOverwhelmed(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Crawling insectoid beetle bodies emerging from shadows
  ctx.fillStyle = unl ? '#7f1d1d' : '#33181c';
  ctx.strokeStyle = unl ? '#ef4444' : '#94a3b8';
  ctx.lineWidth = 1.4;

  // Left pincer claw
  ctx.beginPath();
  ctx.moveTo(-8, 8);
  ctx.quadraticCurveTo(-10, 0, -6, -4);
  ctx.lineTo(-4, -1);
  ctx.lineTo(-6, 3);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Right pincer claw
  ctx.beginPath();
  ctx.moveTo(8, 8);
  ctx.quadraticCurveTo(10, 0, 6, -4);
  ctx.lineTo(4, -1);
  ctx.lineTo(6, 3);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Center arachnid mandible head
  ctx.beginPath();
  ctx.moveTo(-4, 5);
  ctx.lineTo(4, 5);
  ctx.lineTo(3, -5);
  ctx.lineTo(-3, -5);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Razor pincer tips
  ctx.strokeStyle = unl ? '#fca5a5' : '#cbd5e1';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-6, -4); ctx.lineTo(-2, -7);
  ctx.moveTo(6, -4); ctx.lineTo(2, -7);
  ctx.stroke();

  // Multiple glowing red eyes in cluster
  ctx.fillStyle = unl ? '#f87171' : '#ef4444';
  ctx.fillRect(-3, -2, 2, 2);
  ctx.fillRect(1, -2, 2, 2);
  ctx.fillRect(-1, 1, 2, 2);

  ctx.restore();
}

// 12. CONSUMED — Skeletal ribcage with fading life spark inside
function _drawConsumed(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Skeletal vertebral spine
  ctx.strokeStyle = unl ? '#cbd5e1' : '#64748b';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(0, 8);
  ctx.stroke();

  // Curved ribs (3 pairs)
  ctx.lineWidth = 1.3;
  const ribYs = [-5, -1, 3];
  ribYs.forEach(ry => {
    ctx.beginPath();
    ctx.moveTo(-7, ry + 2);
    ctx.quadraticCurveTo(-4, ry - 2, 0, ry);
    ctx.quadraticCurveTo(4, ry - 2, 7, ry + 2);
    ctx.stroke();
  });

  // Fading soul spark in center
  const sparkPulse = unl ? (Math.sin(t * 3.0) + 1) * 0.5 : 0;
  ctx.fillStyle = unl ? `rgba(239, 68, 68, ${0.6 + sparkPulse * 0.4})` : '#64748b';
  ctx.beginPath();
  ctx.arc(0, -1, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// 13. SANITY KEEPER — Ornate brass sanity lantern emitting protective radiance
function _drawSanityKeeper(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Lantern hanging ring
  ctx.strokeStyle = unl ? '#f59e0b' : '#64748b';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(0, -8, 2.5, 0, Math.PI * 2);
  ctx.stroke();

  // Lantern roof canopy
  ctx.fillStyle = unl ? '#b45309' : '#475569';
  ctx.beginPath();
  ctx.moveTo(-6, -5);
  ctx.lineTo(6, -5);
  ctx.lineTo(4, -7);
  ctx.lineTo(-4, -7);
  ctx.closePath();
  ctx.fill();

  // Glass chamber
  ctx.fillStyle = unl ? 'rgba(168, 85, 247, 0.25)' : 'rgba(71, 85, 105, 0.2)';
  ctx.strokeStyle = unl ? '#f59e0b' : '#64748b';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-5, -5, 10, 10);
  ctx.fillRect(-5, -5, 10, 10);

  // Radiant amethyst/violet inner flame
  const flamePulse = unl ? Math.sin(t * 4.0) * 0.5 : 0;
  ctx.fillStyle = unl ? '#d8b4fe' : '#64748b';
  ctx.beginPath();
  ctx.arc(0, 0 + flamePulse, 2.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-0.5, -0.5 + flamePulse, 1, 1);

  // Base plinth
  ctx.fillStyle = unl ? '#b45309' : '#475569';
  ctx.fillRect(-6, 5, 12, 2.5);

  ctx.restore();
}

// 14. MIND BREAK — Fractured obsidian skull with void lightning (Shattered Mind)
function _drawMindBreak(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Obsidian skull silhouette
  ctx.fillStyle = unl ? '#241634' : '#120b1c';
  ctx.strokeStyle = unl ? '#c084fc' : '#64748b';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.arc(0, -2, 7, Math.PI * 0.8, Math.PI * 0.2);
  ctx.lineTo(4, 5);
  ctx.lineTo(-4, 5);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Jagged fracture crack down center
  ctx.strokeStyle = unl ? '#f43f5e' : '#64748b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(2, -5);
  ctx.lineTo(-2, -2);
  ctx.lineTo(1, 2);
  ctx.stroke();

  // Hollow void eye sockets
  ctx.fillStyle = unl ? '#a855f7' : '#475569';
  ctx.fillRect(-4, -2, 2.5, 2.5);
  ctx.fillRect(1.5, -2, 2.5, 2.5);

  ctx.restore();
}

// 15. DEATHS (5, 10, 25) — Basalt tombstone with Roman numeral
function _drawDeaths(ctx, s, t, unl, isLg, count) {
  ctx.save();
  ctx.scale(s, s);

  const roman = count === 5 ? 'V' : (count === 10 ? 'X' : 'XXV');

  // Arched headstone
  ctx.fillStyle = unl ? '#1e2436' : '#101420';
  ctx.strokeStyle = unl ? '#94a3b8' : '#64748b';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(-7, 7);
  ctx.lineTo(-7, -3);
  ctx.quadraticCurveTo(-7, -8, 0, -8);
  ctx.quadraticCurveTo(7, -8, 7, -3);
  ctx.lineTo(7, 7);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Ground earth line
  ctx.strokeStyle = unl ? '#64748b' : '#334155';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-9, 7); ctx.lineTo(9, 7); ctx.stroke();

  // Inscribed Roman Numeral
  ctx.fillStyle = unl ? '#fca5a5' : '#94a3b8';
  ctx.font = 'bold 7px Cinzel, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(roman, 0, -1);

  // Skull icon beneath numeral
  ctx.fillStyle = unl ? '#e2e8f0' : '#64748b';
  ctx.fillRect(-2, 3, 4, 3);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-1.5, 3.5, 1, 1);
  ctx.fillRect(0.5, 3.5, 1, 1);

  ctx.restore();
}

// 16. EXECUTED — Colossal broadsword plunging vertically into execution stone
function _drawExecuted(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Execution stone plinth
  ctx.fillStyle = unl ? '#1e1c24' : '#100e16';
  ctx.strokeStyle = unl ? '#78350f' : '#475569';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-8, 3, 16, 5);
  ctx.fillRect(-8, 3, 16, 5);

  // Impaled vertical sword
  ctx.strokeStyle = unl ? '#e2e8f0' : '#94a3b8';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(0, 4);
  ctx.stroke();

  // Crossguard
  ctx.strokeStyle = unl ? '#f59e0b' : '#64748b';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(-5, -6);
  ctx.lineTo(5, -6);
  ctx.stroke();

  // Pommel
  ctx.fillStyle = unl ? '#f59e0b' : '#64748b';
  ctx.fillRect(-1.5, -10, 3, 2);

  // Blood on plinth
  ctx.fillStyle = unl ? '#ef4444' : '#7f1d1d';
  ctx.fillRect(-3, 3, 6, 2);

  ctx.restore();
}

// 17. SAVIOR (1, 2, 3) — Rescued hooded survivor(s) reaching to light
function _drawSavior(ctx, s, t, unl, isLg, tier = 1) {
  ctx.save();
  ctx.scale(s, s);

  // Golden halo of salvation
  if (unl) {
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.65)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, -7, 4.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Survivor 1 (Center)
  ctx.fillStyle = unl ? '#22c55e' : '#475569';
  ctx.beginPath();
  ctx.arc(0, -4, 2.8, 0, Math.PI * 2); // Head
  ctx.fill();

  // Cloaked body
  ctx.fillStyle = unl ? '#15803d' : '#334155';
  ctx.beginPath();
  ctx.moveTo(-4, 7);
  ctx.lineTo(-3, 0);
  ctx.lineTo(3, 0);
  ctx.lineTo(4, 7);
  ctx.closePath();
  ctx.fill();

  // Multi-tier survivor companions
  if (tier >= 2) {
    // Left companion
    ctx.fillStyle = unl ? '#16a34a' : '#334155';
    ctx.beginPath();
    ctx.arc(-6, -2, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-8, 1, 4, 6);
  }
  if (tier >= 3) {
    // Right companion
    ctx.fillStyle = unl ? '#16a34a' : '#334155';
    ctx.beginPath();
    ctx.arc(6, -2, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(4, 1, 4, 6);
  }

  ctx.restore();
}

// 18. PERFECT RESCUE — Golden laurel wreath around pristine living ember
function _drawPerfectRescue(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Golden laurel wreath ring
  ctx.strokeStyle = unl ? '#f59e0b' : '#64748b';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
  ctx.stroke();

  // Laurel leaves
  ctx.fillStyle = unl ? '#fde68a' : '#94a3b8';
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const lx = Math.cos(a) * 8.5;
    const ly = Math.sin(a) * 8.5;
    ctx.fillRect(lx - 1, ly - 1, 2, 2);
  }

  // Living Ember Heart Core
  ctx.fillStyle = unl ? '#ef4444' : '#64748b';
  ctx.beginPath();
  ctx.arc(0, -0.5, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = unl ? '#fef08a' : '#cbd5e1';
  ctx.fillRect(-1, -1.5, 2, 2);

  ctx.restore();
}

// 19. LORE MASTER — Ancient illuminated parchment scroll with golden seal
function _drawLoreMaster(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Rolled parchment parchment body
  ctx.fillStyle = unl ? '#fef3c7' : '#94a3b8';
  ctx.strokeStyle = unl ? '#b45309' : '#475569';
  ctx.lineWidth = 1.3;

  ctx.beginPath();
  ctx.moveTo(-6, -7);
  ctx.lineTo(6, -7);
  ctx.lineTo(6, 6);
  ctx.lineTo(-6, 6);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Scroll wooden rollers
  ctx.fillStyle = unl ? '#78350f' : '#334155';
  ctx.fillRect(-8, -8, 16, 2.5);
  ctx.fillRect(-8, 6, 16, 2.5);

  // Runic inscription lines
  ctx.fillStyle = unl ? '#92400e' : '#475569';
  ctx.fillRect(-4, -4, 8, 1);
  ctx.fillRect(-4, -1, 6, 1);
  ctx.fillRect(-4, 2, 7, 1);

  // Golden wax ribbon seal
  ctx.fillStyle = unl ? '#dc2626' : '#64748b';
  ctx.beginPath();
  ctx.arc(4, 3, 2.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// 20. SOUL ASCENDANT — Faceted violet abyss soul crystal with ascending rays
function _drawSoulAscendant(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Ascending celestial rays
  if (unl) {
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.55)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(0, -6); ctx.lineTo(0, -10);
    ctx.moveTo(-5, -4); ctx.lineTo(-8, -8);
    ctx.moveTo(5, -4); ctx.lineTo(8, -8);
    ctx.stroke();
  }

  // Faceted crystal diamond
  ctx.fillStyle = unl ? '#a855f7' : '#475569';
  ctx.strokeStyle = unl ? '#f3e8ff' : '#94a3b8';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(6, -2);
  ctx.lineTo(0, 8);
  ctx.lineTo(-6, -2);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Internal facet lines
  ctx.strokeStyle = unl ? '#e9d5ff' : '#64748b';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(-6, -2); ctx.lineTo(6, -2);
  ctx.moveTo(0, -8); ctx.lineTo(0, 8);
  ctx.stroke();

  ctx.restore();
}

// 21. MAXED TALENT — Gilded talent constellation tree with ablaze nodes
function _drawMaxedTalent(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Connecting golden ley lines
  ctx.strokeStyle = unl ? '#f59e0b' : '#64748b';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.lineTo(-5, 0);
  ctx.lineTo(0, -6);
  ctx.lineTo(5, 0);
  ctx.closePath();
  ctx.moveTo(0, 6); ctx.lineTo(0, -6);
  ctx.stroke();

  // 5 Star Nodes
  const nodes = [
    [0, -6], [-5, 0], [5, 0], [0, 6], [0, 0]
  ];
  nodes.forEach(([nx, ny]) => {
    ctx.fillStyle = unl ? '#fde68a' : '#94a3b8';
    ctx.beginPath();
    ctx.arc(nx, ny, 2.2, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

// 22. TRUE HERO (ENDING 1) — Rowan with raised shining sword at dawn
function _drawTrueHero(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Radiant dawn halo
  if (unl) {
    const sunGrad = ctx.createRadialGradient(0, -2, 2, 0, -2, 10);
    sunGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
    sunGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(0, -2, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rowan heroic helm & cloak
  ctx.fillStyle = unl ? '#3b82f6' : '#475569';
  ctx.fillRect(-2, -3, 4, 4); // Helmet
  ctx.fillStyle = unl ? '#dc2626' : '#7f1d1d';
  ctx.fillRect(-4, 1, 8, 7); // Cloak

  // Raised broadsword in right hand
  ctx.strokeStyle = unl ? '#ffffff' : '#cbd5e1';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(3, 1);
  ctx.lineTo(7, -8);
  ctx.stroke();

  // Sword glint
  ctx.fillStyle = '#fde68a';
  ctx.fillRect(6, -9, 2, 2);

  ctx.restore();
}

// 23. BETRAYED (ENDING 2) — Daggers impaling back with dark void mist
function _drawBetrayed(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Rowan wounded silhouette
  ctx.fillStyle = unl ? '#1e293b' : '#0f172a';
  ctx.fillRect(-3, -4, 6, 12);

  // Shadowy daggers piercing back
  ctx.strokeStyle = unl ? '#c084fc' : '#64748b';
  ctx.lineWidth = 1.8;

  // Dagger 1 (top left)
  ctx.beginPath();
  ctx.moveTo(-9, -6); ctx.lineTo(-1, -1);
  ctx.stroke();

  // Dagger 2 (mid left)
  ctx.beginPath();
  ctx.moveTo(-8, 2); ctx.lineTo(0, 3);
  ctx.stroke();

  // Void blood spatter
  ctx.fillStyle = unl ? '#a855f7' : '#64748b';
  ctx.fillRect(0, -1, 3, 2);
  ctx.fillRect(1, 3, 3, 2);

  ctx.restore();
}

// 24. RAMPAGE (ENDING 3) — Berserker bloodfire aura & twin war axes
function _drawRampage(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Bloodfire aura
  if (unl) {
    const auraPulse = Math.sin(t * 4.0) * 0.2 + 0.8;
    ctx.strokeStyle = `rgba(239, 68, 68, ${0.55 * auraPulse})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Crossed double-bitted war axes
  ctx.strokeStyle = unl ? '#78350f' : '#475569';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-7, 7); ctx.lineTo(7, -7);
  ctx.moveTo(7, 7); ctx.lineTo(-7, -7);
  ctx.stroke();

  // Jagged axe blades
  ctx.fillStyle = unl ? '#ef4444' : '#64748b';
  ctx.fillRect(-8, -8, 4, 3);
  ctx.fillRect(4, -8, 4, 3);
  ctx.fillRect(-8, 5, 4, 3);
  ctx.fillRect(4, 5, 4, 3);

  ctx.restore();
}

// 25. SPEED RUNNER — Antique winged chronometer with ticking second hand
function _drawSpeedRunner(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Swift speed wings on sides
  ctx.strokeStyle = unl ? '#38bdf8' : '#64748b';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-7, -1); ctx.lineTo(-10, -5); ctx.lineTo(-6, -6);
  ctx.moveTo(7, -1); ctx.lineTo(10, -5); ctx.lineTo(6, -6);
  ctx.stroke();

  // Pocket watch case
  ctx.fillStyle = unl ? '#1e2436' : '#101422';
  ctx.strokeStyle = unl ? '#f59e0b' : '#64748b';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 1, 7.5, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  // Top stem & crown
  ctx.fillRect(-1.5, -8, 3, 2);

  // Ticking second hand
  const handAngle = unl ? (t * 8.0) % (Math.PI * 2) : 0;
  ctx.strokeStyle = unl ? '#ef4444' : '#94a3b8';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, 1);
  ctx.lineTo(Math.cos(handAngle) * 5, 1 + Math.sin(handAngle) * 5);
  ctx.stroke();

  // Center axle pin
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-0.5, 0.5, 1, 1);

  ctx.restore();
}

// 26-35. SPEED FLOORS 1-10 — Architectural waypoint stele with inscribed Roman numeral
function _drawSpeedFloor(ctx, s, t, unl, isLg, floorNum) {
  ctx.save();
  ctx.scale(s, s);

  const romanNumerals = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const rText = romanNumerals[floorNum] || String(floorNum);

  // Stone milestone waypoint stele
  ctx.fillStyle = unl ? '#1e2436' : '#0f1422';
  ctx.strokeStyle = unl ? (floorNum % 3 === 0 ? '#f59e0b' : '#38bdf8') : '#64748b';
  ctx.lineWidth = 1.4;

  ctx.beginPath();
  ctx.moveTo(-6, -9);
  ctx.lineTo(6, -9);
  ctx.lineTo(7, 8);
  ctx.lineTo(-7, 8);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Speed wind streaks across stele
  const windShift = (t * 6.0) % 6;
  ctx.strokeStyle = unl ? 'rgba(56, 189, 248, 0.65)' : 'rgba(71, 85, 105, 0.4)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(-10 + windShift, -6); ctx.lineTo(-4 + windShift, -6);
  ctx.moveTo(-9 + windShift, 5); ctx.lineTo(-3 + windShift, 5);
  ctx.stroke();

  // Boss floor distinctive emblems
  if (floorNum === 3) {
    // Gorgaroth cleaver notch
    ctx.fillStyle = unl ? '#f97316' : '#64748b';
    ctx.fillRect(-3, -7, 6, 2);
  } else if (floorNum === 6) {
    // Malakor void eye dot
    ctx.fillStyle = unl ? '#c084fc' : '#64748b';
    ctx.beginPath();
    ctx.arc(0, -6, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (floorNum === 10) {
    // Warden crown spire
    ctx.fillStyle = unl ? '#ef4444' : '#64748b';
    ctx.beginPath();
    ctx.moveTo(0, -8); ctx.lineTo(3, -5); ctx.lineTo(-3, -5);
    ctx.closePath();
    ctx.fill();
  }

  // Inscribed Roman Numeral
  ctx.fillStyle = unl ? '#ffffff' : '#94a3b8';
  ctx.font = 'bold 8.5px Cinzel, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(rText, 0, 1);

  ctx.restore();
}

// 40. THE LAST WITNESS — The Eye of the Absolute (Cyclopean red eye with 8 milestone stars)
function _drawLastWitness(ctx, s, t, unl, isLg) {
  ctx.save();
  ctx.scale(s, s);

  // Outer astral milestone ring
  ctx.strokeStyle = unl ? 'rgba(245, 158, 11, 0.55)' : 'rgba(71, 85, 105, 0.35)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.arc(0, 0, 10.5, 0, Math.PI * 2);
  ctx.stroke();

  // 8 Milestone Astral Stars orbiting
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + t * 0.4;
    const sx = Math.cos(a) * 10.5;
    const sy = Math.sin(a) * 10.5;
    ctx.fillStyle = unl ? (i >= 5 ? '#c084fc' : '#fde68a') : '#475569';
    ctx.fillRect(sx - 1, sy - 1, 2, 2);
  }

  // Living Red Sclera
  ctx.fillStyle = unl ? '#200508' : '#0a0305';
  ctx.strokeStyle = unl ? '#dc2626' : '#7f1d1d';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 7.5, 5, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  // Golden iris with fiery radial fibers
  const irisPulse = (Math.sin(t * 3.5) + 1) * 0.5;
  ctx.fillStyle = unl ? `rgba(245, 158, 11, ${0.85 + irisPulse * 0.15})` : '#78350f';
  ctx.beginPath();
  ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Vertical slit pupil (dilates breathing)
  const slitW = 1.0 + (Math.sin(t * 2.0) + 1) * 0.4;
  ctx.fillStyle = '#010204';
  ctx.beginPath();
  ctx.ellipse(0, 0, slitW, 3.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Specular gleam pinhead
  if (unl) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1.5, -1.5, 1.2, 1.2);
  }

  ctx.restore();
}

// Fallback Generic Citadel Seal
function _drawGenericSeal(ctx, s, t, unl) {
  ctx.save();
  ctx.scale(s, s);
  ctx.strokeStyle = unl ? '#f59e0b' : '#64748b';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-6, -6, 12, 12);
  ctx.fillStyle = unl ? '#fde68a' : '#475569';
  ctx.fillRect(-2, -2, 4, 4);
  ctx.restore();
}
