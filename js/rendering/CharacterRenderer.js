// =====================================================================
//  DUNGEON BREAK — js/rendering/CharacterRenderer.js
//  Authoritative Layered Character Rendering: Rowan, Enemies, & Bosses
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { T } from '../core/Constants.js';
import { WeaponInventory } from '../weapons/WeaponInventory.js';
import { CharacterDefinitions } from './CharacterDefinitions.js';
import { AbyssDissolution } from '../systems/AbyssDissolution.js';

export const CharacterRenderer = {
  // ─────────────────────────────────────────────────────────────
  // 1. LORD ROWAN — Layered Plate, Visor, Cloak & Equipped Weapon
  // ─────────────────────────────────────────────────────────────
  drawPlayer(ctx, options = {}) {
    const { P } = GameState;
    if (!P) return;
    if (P.cinematicPose === 'hidden' || (GameState.STATE === GameStates.CINEMATIC && GameState.CINEMATIC_ACTIVE)) return;
    if (typeof window !== 'undefined' && window.ShatteredMindCinematic && window.ShatteredMindCinematic.isActive() && !options.isShatteredMindDraw) return;
    if (typeof window !== 'undefined' && window.HeroCinematic && window.HeroCinematic.isActive()) return;
    if (typeof window !== 'undefined' && window.BetrayalCinematic && window.BetrayalCinematic.isActive()) return;
    if (typeof window !== 'undefined' && window.RampageCinematic && window.RampageCinematic.isActive()) return;
    if (P.portalAlpha !== undefined && P.portalAlpha <= 0.001) return;
    const isKneeling = (P.cinematicPose === 'kneel');
    const kneelY = isKneeling ? 6 : 0;
    const pp = (P.x + 0.5) * T;
    const pq = (P.y + 0.5) * T;
    const state = P.animState || 'idle';
    const breath = Math.sin(P.breathCycle || 0) * 0.8;
    const bodyBob = state === 'walk' ? Math.sin(P.walkCycle || 0) * 1.6 : breath * 0.5;
    const isDead = P.dead;

    // Shield Aura
    if (P.shieldActive) {
      const sp = Math.sin(GameState.F * 0.12) * 0.35 + 0.65;
      ctx.save();
      ctx.globalAlpha = 0.35 * sp;
      const shieldGrad = ctx.createRadialGradient(pp, pq, T * 0.2, pp, pq, T * 0.65);
      shieldGrad.addColorStop(0, 'rgba(103,232,249,0.55)');
      shieldGrad.addColorStop(1, 'rgba(14,165,233,0)');
      ctx.fillStyle = shieldGrad;
      ctx.beginPath();
      ctx.arc(pp, pq, T * 0.65, 0, 6.28);
      ctx.fill();
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 1.8;
      ctx.globalAlpha = 0.6 * sp;
      ctx.beginPath();
      ctx.arc(pp, pq, T * 0.54, 0, 6.28);
      ctx.stroke();
      ctx.restore();
    }

    // 2.5D Directional Ground Shadow (calculated against active torches)
    let lightX = pp - 18, lightY = pq - 36;
    if (GameState.TORCHES && GameState.TORCHES.length > 0) {
      let nearestDist = 999999;
      for (let i = 0; i < GameState.TORCHES.length; i++) {
        const tor = GameState.TORCHES[i];
        const tx = (tor.x + 0.5) * T;
        const ty = (tor.y + 0.5) * T;
        const dist = Math.hypot(pp - tx, pq - ty);
        if (dist < nearestDist) {
          nearestDist = dist;
          lightX = tx;
          lightY = ty;
        }
      }
    }
    const pShadow = CharacterDefinitions.calculateCastShadow(pp, pq + 14, lightX, lightY, 11, 5);
    CharacterDefinitions.drawCastShadow(ctx, pShadow);

    // ─────────────────────────────────────────────────────────────
    // HERO DEATH ANIMATION (In-World Dynamic Collapse & Cause FX)
    // ─────────────────────────────────────────────────────────────
    if (isDead) {
      P.deathTimer = (P.deathTimer || 0) + (GameState.DT || 0.016);
      const dt = P.deathTimer;
      const cause = P.deathCause || 'dungeon_normal';

      ctx.save();

      // Expanding Blood Pool on Floor
      const poolProg = Math.min(1, dt / 1.6);
      ctx.fillStyle = `rgba(136, 19, 55, ${0.75 * poolProg})`;
      ctx.beginPath();
      ctx.ellipse(pp, pq + 12, 18 * poolProg, 8 * poolProg, 0, 0, 6.28);
      ctx.fill();

      // Dropped Weapon beside Rowan
      ctx.save();
      ctx.translate(pp + 18, pq + 8);
      ctx.rotate(0.65);
      // Sword blade
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-2, -14, 4, 20);
      // Crossguard
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-6, 2, 12, 3);
      // Grip & Pommel
      ctx.fillStyle = '#475569';
      ctx.fillRect(-1.5, 5, 3, 5);
      ctx.beginPath();
      ctx.arc(0, 11, 2.5, 0, 6.28);
      ctx.fill();
      ctx.restore();

      // Collapse Translation & Stagger Rotation
      const fallProg = Math.min(1, dt / 0.8);
      const easeFall = fallProg * fallProg;
      const slumpY = pq + 4 + easeFall * 6;
      const slumpRot = easeFall * 1.35; // falls sideways onto stones

      ctx.translate(pp, slumpY);
      ctx.rotate(slumpRot);

      // Crimson Cape draped across stones
      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.moveTo(-10, -6);
      ctx.lineTo(8, -6);
      ctx.lineTo(14, 12);
      ctx.lineTo(-14, 12);
      ctx.closePath();
      ctx.fill();

      // Slumped Armored Legs
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-8, 6, 6, 8);
      ctx.fillRect(1, 4, 6, 8);

      // Dented Steel Torso
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-9, -8, 18, 14);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-8, -7, 16, 5);
      // Broken Gold Trim
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(-9, -1, 18, 1.8);

      // Fallen Helmet with Dimming Visor Light
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, -14, 7.5, 0, 6.28);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-6, -18, 12, 8);
      // Dimming blue eye glow
      const visorAlpha = Math.max(0, 1 - dt * 1.4);
      if (visorAlpha > 0) {
        ctx.fillStyle = `rgba(56, 189, 248, ${visorAlpha})`;
        ctx.fillRect(-3.5, -15, 7, 2.2);
      }

      // ─────────────────────────────────────────────────────────────
      // CAUSE-SPECIFIC IN-WORLD DEATH PARTICLES & OVERLAYS
      // ─────────────────────────────────────────────────────────────
      if (cause === 'boss_gorgaroth') {
        // Heavy Iron Chains wrapped around Rowan
        ctx.strokeStyle = '#78716c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-12, -10); ctx.lineTo(12, 4);
        ctx.moveTo(-10, 2); ctx.lineTo(10, -8);
        ctx.stroke();
        // Iron links
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-3, -4, 6, 3);
      } else if (cause === 'boss_malakor') {
        // Cosmic Void Disintegration motes
        for (let i = 0; i < 6; i++) {
          const vx = Math.sin(GameState.F * 0.1 + i) * 14;
          const vy = -((GameState.F * 0.8 + i * 12) % 36);
          ctx.fillStyle = i % 2 === 0 ? 'rgba(192, 132, 252, 0.8)' : 'rgba(56, 189, 248, 0.8)';
          ctx.beginPath();
          ctx.arc(vx, vy, 1.8, 0, 6.28);
          ctx.fill();
        }
      } else if (cause === 'boss_abyss_warden') {
        // Abyssal Flame Wisps licking armor
        const flamePulse = Math.sin(GameState.F * 0.25) * 4;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.75)';
        ctx.beginPath();
        ctx.arc(-4, -6 + flamePulse * 0.4, 4, 0, 6.28);
        ctx.arc(5, -8 - flamePulse * 0.4, 3.5, 0, 6.28);
        ctx.fill();
      } else if (cause === 'sanity') {
        // Psychic Madness Tendrils erupting from skull
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.85)';
        ctx.lineWidth = 1.8;
        for (let i = 0; i < 4; i++) {
          const ang = (i / 4) * Math.PI * 2 + GameState.F * 0.12;
          const len = 12 + Math.sin(GameState.F * 0.2 + i) * 6;
          ctx.beginPath();
          ctx.moveTo(0, -14);
          ctx.lineTo(Math.cos(ang) * len, -14 + Math.sin(ang) * len);
          ctx.stroke();
        }
      } else {
        // Rising red soul embers
        for (let i = 0; i < 4; i++) {
          const ex = Math.sin(GameState.F * 0.08 + i) * 12;
          const ey = -((GameState.F * 0.6 + i * 15) % 30);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.65)';
          ctx.beginPath();
          ctx.arc(ex, ey, 1.2, 0, 6.28);
          ctx.fill();
        }
      }

      ctx.restore();
      return;
    }

    // Hit Flash
    if (P.hitFlash > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, P.hitFlash / 0.22) * 0.5;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(pp, pq, T * 0.42, 0, 6.28);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    const jitterX = P.unsettled ? (Math.random() - 0.5) * 0.9 : 0;
    const jitterY = P.unsettled ? (Math.random() - 0.5) * 0.9 : 0;
    ctx.translate(pp + jitterX, pq + bodyBob + kneelY + jitterY);
    if (P.portalScale !== undefined && P.portalScale !== 1.0) {
      ctx.scale(P.portalScale, P.portalScale);
    }
    if (P.portalAlpha !== undefined && P.portalAlpha < 1.0) {
      ctx.globalAlpha *= P.portalAlpha;
    }

    // Flowing Crimson Cloak (Back Layer)
    const cloakSway = state === 'walk' ? Math.sin((P.walkCycle || 0) * 0.8) * 3 : Math.sin(GameState.F * 0.08) * 1.5;
    ctx.fillStyle = '#581c1c';
    ctx.beginPath();
    ctx.moveTo(-7, -4);
    ctx.lineTo(7, -4);
    ctx.lineTo(9 + cloakSway, 15);
    ctx.lineTo(-9 + cloakSway, 15);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3f1212';
    ctx.fillRect(-6 + cloakSway * 0.5, 6, 12, 8);

    // Armored Legs / Boots
    if (isKneeling) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-7, 6, 6, 6);
      ctx.fillRect(1, 4, 6, 6);
    } else {
      const stepL = state === 'walk' ? Math.sin(P.walkCycle || 0) * 3.5 : 0;
      const stepR = state === 'walk' ? -Math.sin(P.walkCycle || 0) * 3.5 : 0;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-6, 9 + stepL, 4, 6);
      ctx.fillRect(2, 9 + stepR, 4, 6);
    }

    // Steel Plate Torso
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-8, -4, 16, 14);
    // Chestplate Bevel & Highlight
    ctx.fillStyle = '#334155';
    ctx.fillRect(-7, -3, 14, 6);
    // Gold Inlay Trim
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-8, 3, 16, 1.8);

    // Pauldrons (Shoulder Guards)
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(-9, -2, 3.5, 0, 6.28);
    ctx.arc(9, -2, 3.5, 0, 6.28);
    ctx.fill();

    // Visored Great Helm
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -9, 7.0, 0, 6.28);
    ctx.fill();
    // Helmet Brow Guard
    ctx.fillStyle = '#334155';
    ctx.fillRect(-6, -13, 12, 3);
    // Cyan Visor Slit
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#0ea5e9';
    ctx.shadowBlur = 6;
    ctx.fillRect(P.fx >= 0 ? 0 : -5, -9, 5.5, 2);
    ctx.shadowBlur = 0;

    // Equipped Weapon in Hand (Unique Geometry Per Weapon Archetype)
    const activeW = WeaponInventory.getActiveWeapon();
    const wCol = activeW ? (activeW.col || '#facc15') : '#facc15';
    const isAttacking = (P.aanim > 0);
    const attackProgress = isAttacking ? 1 - (P.aanim / (activeW.cooldown || 0.32)) : 0;

    ctx.save();
    const handX = P.fx * 9;
    const handY = 2;
    ctx.translate(handX, handY);

    let weaponAngle = Math.atan2(P.fy, P.fx);
    if (P.weaponLowered) {
      weaponAngle = Math.PI * 0.5; // Relaxed weapon resting pointing down
    }
    if (isAttacking) {
      if (activeW.id === 'spear') {
        // Thrust extension
        const thrustDist = Math.sin(attackProgress * Math.PI) * 7;
        ctx.translate(Math.cos(weaponAngle) * thrustDist, Math.sin(weaponAngle) * thrustDist);
      } else {
        // Swing sweep
        weaponAngle += (attackProgress - 0.5) * (activeW.arc || 1.1) * 1.5;
      }
    }
    ctx.rotate(weaponAngle);

    // Render detailed weapon in hand
    if (activeW.id === 'axe') {
      // Haft
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, -1.5, 13, 3);
      // Heavy Crescent Blade Head
      ctx.fillStyle = wCol;
      ctx.beginPath();
      ctx.moveTo(9, -7);
      ctx.lineTo(15, -9);
      ctx.lineTo(13, 9);
      ctx.lineTo(9, 7);
      ctx.closePath();
      ctx.fill();
    } else if (activeW.id === 'spear') {
      // Long Ashwood Shaft
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, -1.2, 17, 2.4);
      // Steel Spearhead Tip
      ctx.fillStyle = wCol;
      ctx.beginPath();
      ctx.moveTo(17, -3);
      ctx.lineTo(23, 0);
      ctx.lineTo(17, 3);
      ctx.closePath();
      ctx.fill();
    } else if (activeW.id === 'dagger') {
      // Grip & Short Keen Blade
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, -1, 3, 2);
      ctx.fillStyle = wCol;
      ctx.beginPath();
      ctx.moveTo(3, -2);
      ctx.lineTo(10, 0);
      ctx.lineTo(3, 2);
      ctx.closePath();
      ctx.fill();
    } else if (activeW.id === 'bow') {
      // Arcane Curved Bow Stave
      ctx.strokeStyle = wCol;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(6, 0, 8, -Math.PI / 2.2, Math.PI / 2.2);
      ctx.stroke();
      // Bowstring
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(3, -7);
      ctx.lineTo(isAttacking ? 0 : 3, 0);
      ctx.lineTo(3, 7);
      ctx.stroke();
    } else {
      // Steel Sword: Crossguard + Blade + Fuller
      ctx.fillStyle = '#64748b'; // Crossguard
      ctx.fillRect(2, -4, 2.5, 8);
      ctx.fillStyle = wCol; // Blade
      ctx.beginPath();
      ctx.moveTo(4.5, -2);
      ctx.lineTo(14, 0);
      ctx.lineTo(4.5, 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff'; // Edge Fuller shine
      ctx.fillRect(5, -0.6, 6, 1.2);
    }

    // Weapon Switch In-World Feedback Glint
    if (GameState.equipFeedback && GameState.equipFeedback.timer > 1.0) {
      const glintProg = Math.max(0, Math.min(1, (GameState.equipFeedback.timer - 1.0) / 0.5));
      ctx.save();
      ctx.globalAlpha = Math.min(1, glintProg * 1.5) * 0.75;
      ctx.fillStyle = (GameState.equipFeedback.rarity && GameState.equipFeedback.rarity.col) ? GameState.equipFeedback.rarity.col : '#fde68a';
      ctx.beginPath();
      const radius = Math.max(0, 7 * (1 - glintProg * 0.4));
      ctx.arc(8, 0, radius, 0, 6.28);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────
  // 2. ENEMIES — Layered Sprites & Distinct Attack Telegraphs
  // ─────────────────────────────────────────────────────────────
  drawEnemy(ctx, e) {
    if (!e) return;
    if (e.cinematicConsumed) return;
    const px = (e.x + 0.5) * T;
    const py = (e.y + 0.5) * T;
    const bob = Math.sin(GameState.F * 0.14 + e.ph) * 1.5;

    // Red Ground Telegraph Indicator for Elites or Area Attacks
    if (e.groundTelegraph) {
      const gt = e.groundTelegraph;
      const gx = (gt.x + 0.5) * T;
      const gy = (gt.y + 0.5) * T;
      const pulse = Math.sin(GameState.F * 0.25) * 0.2 + 0.8;
      ctx.save();
      ctx.fillStyle = `rgba(239, 68, 68, ${0.28 * pulse})`;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(gx, gy, gt.r * T, 0, 6.28);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Ground Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(px, py + 12, e.isElite ? 13 : 9, e.isElite ? 6 : 4, 0, 0, 6.28);
    ctx.fill();

    // Fallen Corpse — delegate to AbyssDissolution system
    if (!e.alive) {
      // If dissolution is active, draw the dissolving body
      if (AbyssDissolution.isDissolvingActive(e)) {
        AbyssDissolution.drawDissolving(ctx, e);
        return;
      }
      // If dissolution completed, don't draw anything (actor will be removed)
      if (e._dissolveStarted) return;
      // Fallback: old corpse for any edge case
      ctx.save();
      ctx.globalAlpha = Math.max(0, (e.dAnim || 0) / 0.45);
      ctx.fillStyle = '#334155';
      ctx.fillRect(px - 9, py + 4, 18, 6);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(px, py + bob);
    if (e.fogConsumeAlpha !== undefined) {
      ctx.globalAlpha = Math.max(0, Math.min(1, ctx.globalAlpha * e.fogConsumeAlpha));
    }

    // Elite Scaling & Golden Crown Aura
    if (e.isElite) {
      ctx.scale(1.22, 1.22);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, -1, 14, 0, 6.28);
      ctx.stroke();
      // Overhead Crown
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(-6, -18); ctx.lineTo(-3, -22); ctx.lineTo(0, -19); ctx.lineTo(3, -22); ctx.lineTo(6, -18);
      ctx.closePath();
      ctx.fill();
    }

    // Hit Flash Glow
    const isFlashing = (e.hitFlash > 0);

    // ─────────────────────────────────────────────────────────────
    // SKELETON: Ribcage, Skull, Rusted Blade, Shield
    // ─────────────────────────────────────────────────────────────
    if (e.type === 'skeleton') {
      ctx.fillStyle = isFlashing ? '#ffffff' : '#cbd5e1';
      // Cranium
      ctx.beginPath();
      ctx.arc(0, -9, 5.5, 0, 6.28);
      ctx.fill();
      // Glowing Eye Sockets
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-2, -9, 1.4, 0, 6.28);
      ctx.arc(2, -9, 1.4, 0, 6.28);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-2, -9, 0.8, 0, 6.28);
      ctx.arc(2, -9, 0.8, 0, 6.28);
      ctx.fill();

      // Ribcage & Spine
      ctx.fillStyle = isFlashing ? '#ffffff' : '#94a3b8';
      ctx.fillRect(-1.5, -4, 3, 11);
      ctx.fillRect(-6, -2, 12, 1.5);
      ctx.fillRect(-5, 1, 10, 1.5);
      ctx.fillRect(-4, 4, 8, 1.5);

      // Weapon Raise Telegraph
      if (e.telegraphing && e.telegraphType === 'weapon_raise') {
        ctx.save();
        ctx.translate(6, -12);
        ctx.rotate(-0.8);
        ctx.fillStyle = '#facc15';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 10;
        ctx.fillRect(-1.5, -12, 3, 14);
        ctx.shadowBlur = 0;
        ctx.restore();
      } else {
        // Normal Held Weapon
        ctx.fillStyle = '#713f12';
        ctx.fillRect(5, -2, 2.5, 9);
      }
    }
    // ─────────────────────────────────────────────────────────────
    // GHOUL: Hunched Feral Beast, Razor Claws, Glowing Eyes
    // ─────────────────────────────────────────────────────────────
    else if (e.type === 'ghoul') {
      const isCrouched = (e.telegraphing && e.telegraphType === 'crouch_leap');
      ctx.fillStyle = isFlashing ? '#ffffff' : (isCrouched ? '#22c55e' : '#15803d');
      // Hunched Torso
      ctx.beginPath();
      ctx.ellipse(0, isCrouched ? 1 : -3, 8, isCrouched ? 5 : 7, 0.3, 0, 6.28);
      ctx.fill();

      // Feral Head
      ctx.beginPath();
      ctx.arc(4, isCrouched ? 0 : -6, 5, 0, 6.28);
      ctx.fill();

      // Piercing Red Eyes
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = isCrouched ? 10 : 4;
      ctx.beginPath();
      ctx.arc(5, isCrouched ? -1 : -7, 1.6, 0, 6.28);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Claws
      ctx.fillStyle = '#052e16';
      ctx.fillRect(isCrouched ? 6 : 4, isCrouched ? 3 : 2, 4, 2);
    }
    // ─────────────────────────────────────────────────────────────
    // DEMON: Horned Arch-Fiend, Bat Wings, Magma Core
    // ─────────────────────────────────────────────────────────────
    else if (e.type === 'demon') {
      ctx.fillStyle = isFlashing ? '#ffffff' : '#b91c1c';
      // Torso
      ctx.beginPath();
      ctx.arc(0, -4, 8, 0, 6.28);
      ctx.fill();

      // Horns
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.moveTo(-6, -11); ctx.lineTo(-10, -18); ctx.lineTo(-3, -13);
      ctx.moveTo(6, -11); ctx.lineTo(10, -18); ctx.lineTo(3, -13);
      ctx.fill();

      // Molten Core
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(0, -3, 3.5, 0, 6.28);
      ctx.fill();

      // Projectile Charge Telegraph (Spinning Molten Orb)
      if (e.telegraphing && e.telegraphType === 'proj_charge') {
        const pSize = 4 + Math.sin(GameState.F * 0.4) * 2;
        ctx.save();
        ctx.fillStyle = '#fb923c';
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(9, -2, pSize, 0, 6.28);
        ctx.fill();
        ctx.restore();
      }
    }
    // ─────────────────────────────────────────────────────────────
    // WRAITH: Hooded Phantom Cowl, Tattered Robe, Void Motes
    // ─────────────────────────────────────────────────────────────
    else if (e.type === 'wraith') {
      const alpha = (e.telegraphing && e.telegraphType === 'void_glow')
        ? (0.45 + Math.sin(GameState.F * 0.3) * 0.35)
        : 0.85;
      ctx.globalAlpha = isFlashing ? 1 : alpha;

      // Phantom Robes
      ctx.fillStyle = isFlashing ? '#ffffff' : '#6b21a8';
      ctx.beginPath();
      ctx.moveTo(-7, -4);
      ctx.lineTo(7, -4);
      ctx.lineTo(5, 12);
      ctx.lineTo(-5, 12);
      ctx.closePath();
      ctx.fill();

      // Hooded Cowl
      ctx.fillStyle = '#3b0764';
      ctx.beginPath();
      ctx.arc(0, -9, 6.5, 0, 6.28);
      ctx.fill();

      // Void Eyes
      ctx.fillStyle = '#c084fc';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(-2, -9, 1.5, 0, 6.28);
      ctx.arc(2, -9, 1.5, 0, 6.28);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    // Fallback enemy sprite
    else {
      ctx.fillStyle = isFlashing ? '#ffffff' : '#ef4444';
      ctx.beginPath();
      ctx.arc(0, -2, 7, 0, 6.28);
      ctx.fill();
    }

    ctx.restore();

    // Enemy HP Bar — Dynamic Engagement Policy & Trailing Damage Presentation
    if (e.alive && e.hp > 0 && e.maxHp > 1) {
      if (e._engagedTimer > 0) e._engagedTimer -= GameState.DT || 0.016;
      // Bar is visible if damaged, alerted, reacting to hit, or recently engaged
      const shouldShow = (e.hp < e.maxHp) || e.isAlerted || (e.hitFlash > 0) || (e._engagedTimer > 0);
      if (shouldShow) {
        const barW = e.isElite ? 32 : 26;
        const barH = 4;
        const bx = Math.round(px - barW / 2);
        const by = Math.round(py - 20);
        const curHp = Math.max(0, e.hp);
        const frac = Math.max(0, Math.min(1, curHp / e.maxHp));

        // Trailing damage animation
        if (e._ghostHp === undefined || e._ghostHp < curHp) {
          e._ghostHp = curHp;
        }
        if (GameState.REDUCED_MOTION) {
          e._ghostHp = curHp;
        } else if (e._ghostHp > curHp) {
          const dt = GameState.DT || 0.016;
          const decay = (e._ghostHp - curHp) * 4.5 * dt + dt * 3;
          e._ghostHp = Math.max(curHp, e._ghostHp - decay);
        }
        const ghostFrac = Math.max(0, Math.min(1, e._ghostHp / e.maxHp));

        // Obsidian backing plate
        ctx.fillStyle = 'rgba(9, 13, 22, 0.92)';
        ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
        ctx.strokeStyle = e.isElite ? 'rgba(245, 158, 11, 0.85)' : 'rgba(30, 41, 59, 0.85)';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx - 1, by - 1, barW + 2, barH + 2);

        // Trough
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(bx, by, barW, barH);

        // Trailing damage segment
        if (ghostFrac > frac) {
          ctx.fillStyle = e.isElite ? '#fde68a' : '#f87171';
          ctx.fillRect(bx, by, Math.round(barW * ghostFrac), barH);
        }

        // Authoritative Health fill
        if (frac > 0) {
          const fillW = Math.round(barW * frac);
          ctx.fillStyle = e.isElite ? '#f59e0b' : '#dc2626';
          ctx.fillRect(bx, by, fillW, barH);
          // Top specular highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.fillRect(bx, by, fillW, 1.5);
        }
      }
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 3. BOSSES — Colossal Intimidating Titans (Gorgaroth, Malakor, Warden)
  // ─────────────────────────────────────────────────────────────
  drawBoss(ctx, boss) {
    if (!boss) return;
    if (boss.cinematicConsumed) return;
    const px = (boss.x + 0.5) * T;
    const py = (boss.y + 0.5) * T;
    const floatY = Math.sin(GameState.F * 0.08 + (boss.ph || 0)) * 4;
    const pulse = Math.sin(GameState.F * 0.12) * 0.5 + 0.5;

    // Ground Slam Warning Indicator
    if (boss.slamWarning && !boss.slamWarning.fired) {
      const sw = boss.slamWarning;
      const wx = (sw.x + 0.5) * T;
      const wy = (sw.y + 0.5) * T;
      const prog = 1 - (sw.timer / 0.6);
      ctx.save();
      ctx.fillStyle = `rgba(239, 68, 68, ${0.25 + prog * 0.25})`;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(wx, wy, 2.2 * T * Math.min(1, prog * 1.2), 0, 6.28);
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }

    // Abyss Warden Combat Telegraphs (Cleave, Sweep, Fissures, Cataclysm Safe Ring, Runes)
    if (boss.id === 'abyss_warden') {
      this.drawWardenTelegraphs(ctx, boss);
    }

    // Colossal 2.5D Directional Ground Shadow
    let bLightX = px - 28, bLightY = py - 52;
    if (GameState.TORCHES && GameState.TORCHES.length > 0) {
      let nearestDist = 999999;
      for (let i = 0; i < GameState.TORCHES.length; i++) {
        const tor = GameState.TORCHES[i];
        const tx = (tor.x + 0.5) * T;
        const ty = (tor.y + 0.5) * T;
        const dist = Math.hypot(px - tx, py - ty);
        if (dist < nearestDist) {
          nearestDist = dist;
          bLightX = tx;
          bLightY = ty;
        }
      }
    }
    const bShadow = CharacterDefinitions.calculateCastShadow(px, py + 26, bLightX, bLightY, 36, 14);
    CharacterDefinitions.drawCastShadow(ctx, bShadow);

    if (!boss.alive) {
      if (!boss.isDefeatedCinematic && boss.defeatState !== 'collapsed') {
        if (boss.dAnim > 0) {
          const t = Math.max(0, boss.dAnim / 1.0);
          ctx.save();
          ctx.globalAlpha = t;
          ctx.fillStyle = '#7c3aed';
          ctx.beginPath();
          ctx.arc(px, py, T * (1 - t + 0.2) * 1.5, 0, 6.28);
          ctx.fill();
          ctx.restore();
        }
        return;
      }
    }

    const isCinematicDefeat = !!boss.isDefeatedCinematic || boss.defeatState === 'collapsed' || boss.defeatState === 'corpse';
    const actualFloatY = isCinematicDefeat ? 0 : floatY;

    ctx.save();
    if (boss.fogConsumeAlpha !== undefined) {
      ctx.globalAlpha = Math.max(0, Math.min(1, ctx.globalAlpha * boss.fogConsumeAlpha));
    }
    if (boss.introMaterialize !== undefined) {
      ctx.globalAlpha = Math.max(0, Math.min(1, ctx.globalAlpha * boss.introMaterialize));
    }
    if (boss.teleportAlpha !== undefined) {
      ctx.globalAlpha = Math.max(0, Math.min(1, ctx.globalAlpha * boss.teleportAlpha));
    }
    if (boss.vaporizeProg) {
      ctx.globalAlpha = Math.max(0, 1.0 - boss.vaporizeProg);
    }
    let drawX = px;
    let drawY = py - actualFloatY;

    if (isCinematicDefeat) {
      if (boss.recoilOffset) {
        drawX += (boss.recoilOffset.x || 0) * T;
        drawY += (boss.recoilOffset.y || 0) * T;
      }
      if (boss.kneeDip) {
        drawY += boss.kneeDip * 8;
      }
      if (boss.kneeFallProg) {
        drawY += boss.kneeFallProg * 12;
      }
      if (boss.collapseProg) {
        drawY += boss.collapseProg * 16;
      }
    }

    ctx.translate(drawX, drawY);

    if (isCinematicDefeat && boss.staggerAngle) {
      ctx.rotate(boss.staggerAngle);
    }
    if (isCinematicDefeat && boss.collapseAngle !== undefined) {
      ctx.rotate(boss.collapseAngle);
    } else if (isCinematicDefeat && boss.collapseProg) {
      ctx.rotate(boss.collapseProg * 1.42 * (boss.facing || -1));
    }

    const isFlashing = (boss.hitFlash > 0);

    // ─────────────────────────────────────────────────────────────
    // GORGAROTH — The Iron Jailer (Floor 3 Mini-Boss)
    // ─────────────────────────────────────────────────────────────
    if (boss.id === 'gorgaroth') {
      this.drawGorgaroth(ctx, boss, isFlashing, pulse);
    }
    // ─────────────────────────────────────────────────────────────
    // MALAKOR — The Void Sorcerer (Floor 6 Boss)
    // ─────────────────────────────────────────────────────────────
    else if (boss.id === 'malakor') {
      this.drawMalakor(ctx, boss, isFlashing, pulse);
    }
    // ─────────────────────────────────────────────────────────────
    // THE ABYSS WARDEN — Scourge of the Sunken Citadel (Final Boss)
    // ─────────────────────────────────────────────────────────────
    else {
      this.drawWarden(ctx, boss, isFlashing, pulse);
    }

    ctx.restore();
  },

  drawWarden(ctx, boss, isFlashing, pulse) {
    const phase = boss.phase || 1;
    const isRage = (phase === 3);
    const isCinematicDefeat = !!boss.isDefeatedCinematic || boss.defeatState === 'collapsed' || boss.defeatState === 'corpse';
    const reveal = boss.introRevealStage;
    const defeat = boss.defeatState;

    // Shot 1-3 of Intro: completely hidden in throne room darkness
    if (!defeat && reveal === 'hidden') return;

    const isSilhouette = (reveal === 'silhouette');
    const isEmerging = (reveal === 'emerging');
    const isWeaponLift = (reveal === 'weapon_lift');
    const isKneeling = (defeat === 'knee');
    const isDefiance = (defeat === 'defiance');
    const isCollapsed = (defeat === 'collapsed' || defeat === 'corpse');

    ctx.save();

    // ─────────────────────────────────────────────────────────
    // Attack / Defeat Transformation Offsets
    // ─────────────────────────────────────────────────────────
    if (boss.cleaveAnim && boss.cleaveAnim > 0) {
      // Leaning forward with weapon raised overhead
      ctx.translate(0, -Math.sin(boss.cleaveAnim * Math.PI) * 4);
    } else if (boss.sweepAnim && boss.sweepAnim > 0) {
      // Coiling torso for wide directional sweep
      ctx.rotate(Math.sin(boss.sweepAnim * Math.PI) * 0.15 * (boss.facing || 1));
    } else if (boss.isCataclysm) {
      // Levitating slightly or bracing with power in Cataclysm
      ctx.translate(0, -3 + Math.sin(GameState.F * 0.2) * 1.5);
    }

    // Phase 3 Apocalyptic Rage Aura (Extinguished upon defeat)
    if (!isSilhouette && isRage && (!isCinematicDefeat || (boss.eyeGlow && boss.eyeGlow > 0.2))) {
      const defeatFade = isCinematicDefeat ? (boss.eyeGlow || 0.5) : 1.0;
      const rageGrad = ctx.createRadialGradient(0, 0, T * 0.2, 0, 0, T * 1.8);
      rageGrad.addColorStop(0, `rgba(255, 40, 0, ${(0.28 + pulse * 0.15) * defeatFade})`);
      rageGrad.addColorStop(0.6, `rgba(180, 0, 0, ${(0.12 + pulse * 0.08) * defeatFade})`);
      rageGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rageGrad;
      ctx.beginPath(); ctx.arc(0, 0, T * 1.8, 0, 6.28); ctx.fill();
    } else if (!isSilhouette && phase >= 2 && !isCinematicDefeat) {
      // Phase 2 Void Storm Aura
      const p2Grad = ctx.createRadialGradient(0, 0, T * 0.15, 0, 0, T * 1.3);
      p2Grad.addColorStop(0, `rgba(147, 51, 234, ${0.25 + pulse * 0.12})`);
      p2Grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = p2Grad;
      ctx.beginPath(); ctx.arc(0, 0, T * 1.3, 0, 6.28); ctx.fill();
    }

    const glowCol = isRage ? '#ef4444' : phase === 2 ? '#a855f7' : '#991b1b';
    ctx.shadowColor = (isSilhouette || (isCinematicDefeat && boss.collapseProg)) ? 'transparent' : glowCol;
    ctx.shadowBlur = (isSilhouette || (isCinematicDefeat && boss.collapseProg)) ? 0 : (32 + pulse * 16);

    // 1. GARGANTUAN ARTICULATED DRACONIAN WINGS (Towering above the demon lord)
    const baseSpan = isRage ? T * 2.8 : phase === 2 ? T * 2.4 : T * 2.0;
    const wingSpread = boss.collapseProg
      ? Math.max(0.12, 0.55 - boss.collapseProg * 0.42)
      : isKneeling ? 0.35 : ((GameState.BOSS_INTRO_WING_SPREAD !== undefined) ? GameState.BOSS_INTRO_WING_SPREAD : (typeof window !== 'undefined' && typeof window.BOSS_INTRO_WING_SPREAD !== 'undefined' ? window.BOSS_INTRO_WING_SPREAD : 1.0));
    const wingSpan = baseSpan * Math.max(0.12, wingSpread);
    const wingFlap = isCinematicDefeat ? 0 : Math.sin(GameState.F * (isRage ? 0.22 : 0.15)) * 0.22;
    const wingCol = isSilhouette ? '#030005' : (isRage ? 'rgba(75, 8, 8, 0.95)' : phase === 2 ? 'rgba(45, 6, 75, 0.94)' : 'rgba(24, 4, 32, 0.92)');
    const wingEdge = isSilhouette ? 'rgba(153, 27, 27, 0.4)' : (isRage ? 'rgba(239, 68, 68, 0.85)' : phase === 2 ? 'rgba(192, 132, 252, 0.75)' : 'rgba(220, 38, 38, 0.65)');

    for (let side = -1; side <= 1; side += 2) {
      ctx.save();
      ctx.fillStyle = wingCol;
      ctx.beginPath();
      ctx.moveTo(side * T * 0.3, -T * 0.3);
      // Main wing arm arches HIGH UP into the sky above the horns
      ctx.bezierCurveTo(
        side * wingSpan * 0.45, -T * (1.5 + wingFlap),
        side * wingSpan * 0.85, -T * (1.8 + wingFlap),
        side * wingSpan, -T * (1.2 + wingFlap)
      );
      // 3 Razor bat scalloped fingers curving down the flank
      ctx.bezierCurveTo(
        side * wingSpan * 0.9, -T * (0.4 + wingFlap),
        side * wingSpan * 0.75, T * 0.2,
        side * wingSpan * 0.55, T * 0.5
      );
      ctx.bezierCurveTo(
        side * wingSpan * 0.35, T * 0.4,
        side * T * 0.5, T * 0.2,
        side * T * 0.3, 0
      );
      ctx.closePath();
      ctx.fill();

      // Luminous bone struts & talons
      if (!isSilhouette) {
        ctx.strokeStyle = wingEdge;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(side * T * 0.3, -T * 0.3);
        ctx.bezierCurveTo(
          side * wingSpan * 0.45, -T * (1.5 + wingFlap),
          side * wingSpan * 0.85, -T * (1.8 + wingFlap),
          side * wingSpan, -T * (1.2 + wingFlap)
        );
        ctx.stroke();

        // Outer elbow claw / talon
        ctx.fillStyle = wingEdge;
        ctx.beginPath();
        ctx.arc(side * wingSpan * 0.85, -T * (1.8 + wingFlap), 3.5, 0, 6.28);
        ctx.fill();

        // 2 Interior web ribs
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(side * T * 0.3, -T * 0.2);
        ctx.quadraticCurveTo(side * wingSpan * 0.55, -T * (0.8 + wingFlap), side * wingSpan * 0.82, -T * 0.1);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(side * T * 0.3, -T * 0.1);
        ctx.quadraticCurveTo(side * wingSpan * 0.4, -T * (0.2 + wingFlap), side * wingSpan * 0.55, T * 0.5);
        ctx.stroke();
      }

      ctx.restore();
    }

    // 2. MASSIVE ARMORED TITAN BODY
    const bodyCol = isFlashing ? '#ffffff' : (isSilhouette ? '#050108' : (isRage ? '#7f1d1d' : phase === 2 ? '#3b0764' : '#14031a'));
    ctx.fillStyle = bodyCol;
    ctx.beginPath();
    ctx.ellipse(0, 0, T * 0.6, T * 0.75, 0, 0, 6.28);
    ctx.fill();

    // Heavy Obsidian Chestplate Armor with Battle Gouges
    if (!isSilhouette) {
      ctx.fillStyle = isRage ? '#991b1b' : phase === 2 ? '#581c87' : '#260633';
      ctx.beginPath();
      ctx.ellipse(0, 0, T * 0.44, T * 0.56, 0, 0, 6.28);
      ctx.fill();

      // Ancient battle scars across chest plate
      ctx.strokeStyle = '#0f0212';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-T * 0.25, -T * 0.18);
      ctx.lineTo(-T * 0.05, -T * 0.02);
      ctx.lineTo(T * 0.15, -T * 0.12);
      ctx.stroke();
    }

    // 3. PULSATING CHEST CORE WITH ROTATING RUNIC CONDUITS
    if (!isSilhouette) {
      const coreCol = isRage ? ['#ef4444', '#fef08a'] : phase === 2 ? ['#7c3aed', '#e9d5ff'] : ['#dc2626', '#fca5a5'];
      const coreGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, T * 0.36);
      coreGrad.addColorStop(0, coreCol[1]);
      coreGrad.addColorStop(0.4, coreCol[0] + 'ee');
      coreGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath(); ctx.arc(0, 0, T * 0.36, 0, 6.28); ctx.fill();

      // Rotating chest plate rune conduits
      ctx.strokeStyle = coreCol[0] + 'aa';
      ctx.lineWidth = 1.6;
      for (let ri = 0; ri < 4; ri++) {
        const ra = (ri / 4) * 6.28 + (boss.ph || 0) * 0.3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ra) * T * 0.34, Math.sin(ra) * T * 0.34);
        ctx.stroke();
      }
    }

    // Armor fissures from fatal strike
    if (boss.crackedArmor) {
      ctx.save();
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2.4;
      ctx.shadowColor = '#d946ef';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(-T * 0.35, -T * 0.25);
      ctx.lineTo(-T * 0.12, -T * 0.05);
      ctx.lineTo(T * 0.08, -T * 0.18);
      ctx.lineTo(T * 0.32, T * 0.15);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(T * 0.22, -T * 0.35);
      ctx.lineTo(T * 0.05, -T * 0.12);
      ctx.lineTo(-T * 0.18, T * 0.12);
      ctx.stroke();
      ctx.restore();
    }

    // 4. COLOSSAL CURVED DEMONIC HORNS (Solid Obsidian with Glowing Runic Spine)
    for (let side = -1; side <= 1; side += 2) {
      ctx.save();
      const hornGrad = ctx.createLinearGradient(0, -T * 0.7, side * T * 0.6, -T * 2.2);
      hornGrad.addColorStop(0, '#15021c');
      hornGrad.addColorStop(0.7, isSilhouette ? '#050108' : (isRage ? '#7f1d1d' : phase === 2 ? '#4c1d95' : '#3b0630'));
      hornGrad.addColorStop(1, isSilhouette ? '#7f1d1d' : (isRage ? '#ef4444' : phase === 2 ? '#c084fc' : '#dc2626'));
      ctx.fillStyle = hornGrad;
      ctx.beginPath();
      ctx.moveTo(side * T * 0.22, -T * 0.65);
      ctx.bezierCurveTo(side * T * 0.7, -T * 1.3, side * T * 0.95, -T * 1.7, side * T * 0.6, -T * 2.2);
      ctx.bezierCurveTo(side * T * 0.35, -T * 1.6, side * T * 0.25, -T * 1.1, side * T * 0.08, -T * 0.75);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = isSilhouette ? '#450a0a' : (isRage ? '#ef4444' : phase === 2 ? '#c084fc' : '#dc2626');
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    }

    // 5. TIERED SHOULDER PAULDRONS & RAZOR SPIKES
    ctx.fillStyle = isSilhouette ? '#08010d' : (isRage ? '#450a0a' : '#1e0527');
    for (let si = 0; si < 3; si++) {
      for (let side = -1; side <= 1; side += 2) {
        const sx = side * (T * 0.48 + si * T * 0.09);
        ctx.beginPath();
        ctx.moveTo(sx, -T * 0.28 + si * T * 0.1);
        ctx.lineTo(sx + side * T * 0.22, -T * (0.52 - si * 0.05));
        ctx.lineTo(sx - side * T * 0.08, -T * 0.18 + si * T * 0.1);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 6. DEMONIC HEAD & SINISTER ANGLED SLIT PREDATOR EYES
    ctx.fillStyle = '#08010b';
    ctx.beginPath();
    ctx.arc(0, -T * 0.54, T * 0.32, 0, 6.28);
    ctx.fill();

    // Demon brow shadow & fanged jaw
    ctx.fillStyle = '#020004';
    ctx.beginPath();
    ctx.moveTo(-T * 0.2, -T * 0.42);
    ctx.lineTo(0, -T * 0.32);
    ctx.lineTo(T * 0.2, -T * 0.42);
    ctx.closePath();
    ctx.fill();

    const eyeGlow = (boss.eyeGlow !== undefined) ? boss.eyeGlow : ((GameState.BOSS_INTRO_EYE_GLOW !== undefined) ? GameState.BOSS_INTRO_EYE_GLOW : (typeof window !== 'undefined' && typeof window.BOSS_INTRO_EYE_GLOW !== 'undefined' ? window.BOSS_INTRO_EYE_GLOW : 1.0));
    if (eyeGlow > 0.05) {
      const eyeCol = isRage ? '#fef08a' : phase === 2 ? '#e9d5ff' : '#f87171';
      const eyeY = isDefiance ? -T * 0.62 : -T * 0.58; // Looks up toward Rowan in Shot 4 defiance!
      const eyeSpacing = T * 0.16;

      for (let side = -1; side <= 1; side += 2) {
        ctx.save();
        ctx.translate(side * eyeSpacing, eyeY);
        ctx.rotate(side * (isDefiance ? 0.12 : 0.28));

        // Glowing eye socket
        ctx.fillStyle = eyeCol;
        ctx.shadowColor = eyeCol;
        ctx.shadowBlur = (22 + pulse * 10) * eyeGlow;
        ctx.beginPath();
        ctx.ellipse(0, 0, 5.5 * eyeGlow, 2.5 * eyeGlow, 0, 0, 6.28);
        ctx.fill();

        // Menacing razor-sharp vertical black slit pupil
        ctx.fillStyle = '#040006';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.ellipse(0, 0, 1.2 * eyeGlow, 3.2 * eyeGlow, 0, 0, 6.28);
        ctx.fill();

        ctx.restore();
      }
    }

    // 7. COLOSSAL ABYSSAL GREATSWORD (Towering Executioner Blade)
    if (!boss.weaponDropped && (!isSilhouette || isWeaponLift)) {
      ctx.save();
      // Weapon positioning based on attack/cinematic state
      let bladeAngle = 0.24;
      let bladeX = T * 0.78;
      let bladeY = -T * 0.2;

      if (boss.cleaveAnim && boss.cleaveAnim > 0) {
        // Raised high overhead before slam
        bladeAngle = -0.55 + boss.cleaveAnim * 1.2;
        bladeX = T * 0.45;
        bladeY = -T * 0.8;
      } else if (boss.sweepAnim && boss.sweepAnim > 0) {
        // Swept in wide arc
        bladeAngle = -1.2 + boss.sweepAnim * 2.4;
        bladeX = T * 0.6;
        bladeY = -T * 0.1;
      } else if (boss.isCataclysm) {
        // Two-handed vertical focus
        bladeAngle = 0.0;
        bladeX = 0;
        bladeY = -T * 0.9;
      } else if (defeat === 'unstable') {
        // Weapon slipping and trembling
        bladeAngle = 0.65;
        bladeY = T * 0.1;
      }

      ctx.translate(bladeX, bladeY);
      ctx.rotate(bladeAngle);

      // Floor/body shadow from blade
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(-8, -50, 16, 105);

      // Obsidian Blade
      ctx.fillStyle = '#1c0404';
      ctx.fillRect(-6, -55, 12, 105);
      // Runic fuller channel
      ctx.fillStyle = isRage ? '#ef4444' : phase === 2 ? '#a855f7' : '#dc2626';
      ctx.fillRect(-2.5, -50, 5, 95);
      // Runic crossguard & demonic pommel skull
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(-16, 32, 32, 8);
      ctx.beginPath(); ctx.arc(0, 48, 6, 0, 6.28); ctx.fill();

      // Blade fuller energy pulse
      if (isRage || boss.isCataclysm) {
        ctx.fillStyle = 'rgba(254, 240, 138, 0.65)';
        ctx.fillRect(-1.5, -45, 3, 40);
      }

      ctx.restore();
    }

    ctx.restore();
  },

  drawWardenTelegraphs(ctx, boss) {
    if (!boss || !boss.alive) return;
    const px = (boss.x + 0.5) * T;
    const py = (boss.y + 0.5) * T;

    // 1. Cleave Slam Forward Rect Telegraph
    if (boss.isCleaving && boss.cleaveTotal) {
      const prog = Math.min(1.0, 1.0 - (boss.cleaveTimer / boss.cleaveTotal));
      const ang = boss.cleaveAngle || 0;
      const len = 3.4 * T;
      const w = 1.6 * T;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(ang);

      // Expanding danger rect fill
      ctx.fillStyle = `rgba(239, 68, 68, ${0.15 + prog * 0.28})`;
      ctx.fillRect(0, -w / 2, len * prog, w);

      // Warning border
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.0;
      ctx.strokeRect(0, -w / 2, len, w);

      // Directional runic arrow
      ctx.strokeStyle = 'rgba(254, 226, 226, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(len * 0.4, -w * 0.25);
      ctx.lineTo(len * 0.7, 0);
      ctx.lineTo(len * 0.4, w * 0.25);
      ctx.stroke();

      ctx.restore();
    }

    // 2. Wide Executioner Sweep 180-Degree Arc Telegraph
    if (boss.isSweeping && boss.sweepTotal) {
      const prog = Math.min(1.0, 1.0 - (boss.sweepTimer / boss.sweepTotal));
      const radius = 2.6 * T;
      const ang = boss.sweepAngle || 0;

      ctx.save();
      ctx.fillStyle = `rgba(220, 38, 38, ${0.14 + prog * 0.26})`;
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.arc(px, py, radius, ang - Math.PI / 2, ang + Math.PI / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 3. Quad Fissure Slam 4-Way Cross Telegraph
    if (boss.isQuadFissuring && boss.quadFissureTotal) {
      const prog = Math.min(1.0, 1.0 - (boss.quadFissureTimer / boss.quadFissureTotal));
      const len = 7.5 * T;
      const w = 0.9 * T;

      ctx.save();
      ctx.fillStyle = `rgba(185, 28, 28, ${0.16 + prog * 0.32})`;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.8;

      // Horizontal fissure line
      ctx.fillRect(px - len * prog, py - w / 2, len * 2 * prog, w);
      ctx.strokeRect(px - len, py - w / 2, len * 2, w);

      // Vertical fissure line
      ctx.fillRect(px - w / 2, py - len * prog, w, len * 2 * prog);
      ctx.strokeRect(px - w / 2, py - len, w, len * 2);

      ctx.restore();
    }

    // 4. Abyssal Cataclysm Telegraph with INNER SAFE SANCTUARY ZONE
    if (boss.isCataclysm && boss.cataclysmTotal) {
      const prog = Math.min(1.0, 1.0 - (boss.cataclysmTimer / boss.cataclysmTotal));
      const dangerRadius = 12.0 * T;
      const safeRadius = (boss.cataclysmSafeRadius || 2.4) * T;

      ctx.save();

      // Outer Danger Region (donut cutout for safe zone)
      ctx.fillStyle = `rgba(239, 68, 68, ${0.10 + prog * 0.22})`;
      ctx.beginPath();
      ctx.arc(px, py, dangerRadius, 0, Math.PI * 2);
      ctx.arc(px, py, safeRadius, 0, Math.PI * 2, true);
      ctx.fill();

      // Danger border
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(px, py, dangerRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner Safe Sanctuary Ring (Clearly telegraphed safe area)
      ctx.fillStyle = `rgba(56, 189, 248, ${0.18 + Math.sin(GameState.F * 0.15) * 0.08})`;
      ctx.beginPath();
      ctx.arc(px, py, safeRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(px, py, safeRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Safe Zone Label
      ctx.shadowBlur = 0;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#e0f2fe';
      ctx.textAlign = 'center';
      ctx.fillText('✦ SAFE SANCTUARY ✦', px, py + safeRadius + 15);

      ctx.restore();
    }

    // 5. Abyssal Runic Hazard Rings
    if (boss.runicHazards && boss.runicHazards.length > 0) {
      boss.runicHazards.forEach(rz => {
        const rx = (rz.x + 0.5) * T;
        const ry = (rz.y + 0.5) * T;
        const rRad = rz.r * T;
        const alpha = Math.min(1.0, rz.life / 1.0);

        ctx.save();
        ctx.fillStyle = `rgba(126, 34, 206, ${0.22 * alpha})`;
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.65 * alpha})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(rx, ry, rRad, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner rune pulse
        ctx.strokeStyle = `rgba(192, 132, 252, ${0.45 * alpha})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(rx, ry, rRad * 0.65, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
      });
    }
  },

  drawGorgaroth(ctx, boss, isFlashing, pulse) {
    const rage = boss.phase >= 2;
    const reveal = boss.introRevealStage;
    const defeat = boss.defeatState;

    // Shot 1-3 of Intro: hidden in deep shadows
    if (!defeat && reveal === 'hidden') return;

    // Shot 4 of Intro: only weapon emerging into light
    if (reveal === 'weapon') {
      const wAlpha = boss.introWeaponAlpha !== undefined ? boss.introWeaponAlpha : 1.0;
      ctx.save();
      ctx.globalAlpha = wAlpha;
      // Weapon cast shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(18, -10, 48, 14);
      // Colossal War Pillar
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(24, -48, 14, 68);
      ctx.fillStyle = '#292524';
      ctx.fillRect(16, -64, 30, 24);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(16, -64, 30, 24);
      // Amber runes catching torchlight
      ctx.fillStyle = '#fed7aa';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 8;
      ctx.fillRect(28, -56, 6, 2.5);
      ctx.restore();
      return;
    }

    const isSilhouette = (reveal === 'silhouette');
    const isArmorOnly = (reveal === 'armor');
    const isEyesOnly = (reveal === 'eyes');
    const isCollapsed = (defeat === 'collapsed' || defeat === 'corpse');
    const isKneeling = (defeat === 'knee' || defeat === 'defiance' || defeat === 'looking_at_rowan');

    ctx.save();

    // Defeat poses:
    // (Note: Rotation and Y-translation during stagger/collapse/kneel are smoothly driven in drawBoss to eliminate snapping)
    if (defeat === 'unstable' && !boss.collapseProg) {
      const shake = Math.sin(GameState.F * 0.45) * 1.2;
      ctx.translate(shake, 0);
    }

    // 1. Broad Ground Shadow
    if (!isSilhouette) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
      ctx.beginPath();
      ctx.ellipse(0, 28, 42, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Severed & Trailing Restraint Chains to Environment
    if (!isSilhouette) {
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      // Left trailing chain
      ctx.moveTo(-28, 8);
      ctx.quadraticCurveTo(-48, 22, -62, 34);
      // Right trailing chain
      ctx.moveTo(28, 8);
      ctx.quadraticCurveTo(48, 22, 62, 34);
      ctx.stroke();

      ctx.strokeStyle = '#78716c';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 3. Colossal Legs & Greaves (Dissolves first in death sequence)
    if (!isCollapsed || (boss.collapseProg || 0) < 0.85) {
      ctx.save();
      if (boss.dissolveStage === 'legs' || boss.dissolveStage === 'torso' || boss.dissolveStage === 'all') {
        const legsFade = Math.max(0, 1.0 - (boss.vaporizeProg || 0) * 2.2);
        ctx.globalAlpha = (ctx.globalAlpha || 1.0) * legsFade;
      }
      ctx.fillStyle = isFlashing ? '#ffffff' : (isSilhouette ? '#050302' : '#1c1917');
      // Left leg
      ctx.fillRect(-22, 14, 16, 24);
      // Right leg
      ctx.fillRect(6, 14, 16, 24);
      // Iron kneecaps with chipped rivets
      if (!isSilhouette) {
        ctx.fillStyle = '#292524';
        ctx.fillRect(-23, 12, 18, 8);
        ctx.fillRect(5, 12, 18, 8);
        ctx.strokeStyle = '#44403c';
        ctx.lineWidth = 1;
        ctx.strokeRect(-23, 12, 18, 8);
        ctx.strokeRect(5, 12, 18, 8);
      }
      ctx.restore();
    }

    // 4. Colossal Dark-Metal Torso (Dissolves second in death sequence)
    ctx.save();
    if (boss.dissolveStage === 'torso' || boss.dissolveStage === 'all') {
      const torsoFade = Math.max(0, 1.0 - Math.max(0, ((boss.vaporizeProg || 0) - 0.28) * 1.9));
      ctx.globalAlpha = (ctx.globalAlpha || 1.0) * torsoFade;
    }
    ctx.fillStyle = isFlashing ? '#ffffff' : (isSilhouette ? '#050302' : (rage ? '#290f05' : '#141210'));
    ctx.beginPath();
    ctx.ellipse(0, -2, 34, 40, 0, 0, Math.PI * 2);
    ctx.fill();

    // 5. Heavy Segmented Iron Armor Cuirass (Asymmetric battle damage)
    if (!isSilhouette) {
      ctx.fillStyle = isFlashing ? '#ffffff' : (rage ? '#451a03' : '#221f1d');
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#383431';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Horizontal armor plate bands
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(-22, -10, 44, 2);
      ctx.fillRect(-24, 4, 48, 2);
      ctx.fillRect(-20, 18, 40, 2);

      // 6. Glowing Restrained Energy (Subtle cracks & machinery beneath armor)
      const glowCol = rage ? '#f97316' : '#ea580c';
      const coreAlpha = (defeat === 'cracking') ? 1.0 : (0.55 + pulse * 0.35);
      ctx.save();
      ctx.globalAlpha = coreAlpha;

      // Molten fissure seams
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = (defeat === 'cracking') ? 3.0 : 1.8;
      ctx.shadowColor = glowCol;
      ctx.shadowBlur = rage ? 22 : 14;

      ctx.beginPath();
      // Central breastplate fissure
      ctx.moveTo(-2, -16);
      ctx.lineTo(4, -4);
      ctx.lineTo(-6, 8);
      ctx.lineTo(0, 20);
      // Right flank gouge
      ctx.moveTo(8, -8);
      ctx.lineTo(18, 2);
      ctx.stroke();

      // White-hot core
      ctx.strokeStyle = '#fed7aa';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();

      // 7. Massive Iron Collar Restraint around Neck
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(-18, -26, 36, 8);
      ctx.strokeStyle = '#44403c';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-18, -26, 36, 8);
      // Heavy iron collar rivets & severed lock shackle
      ctx.fillStyle = '#78716c';
      ctx.fillRect(-16, -24, 3, 4);
      ctx.fillRect(13, -24, 3, 4);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-3, -24, 6, 4);

      // Heavy chest restraint chain wrapped across cuirass
      ctx.strokeStyle = '#44403c';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 2, 22, 0.3, 2.8);
      ctx.stroke();
      ctx.strokeStyle = '#78716c';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // 8. Massive Asymmetric Shoulder Pauldrons (Reacts to shoulder drop in collapse)
      const shoulderSlump = boss.shoulderDrop || 0;
      // Left Pauldron
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(-24, -14 + shoulderSlump);
      ctx.lineTo(-44, -30 + shoulderSlump);
      ctx.lineTo(-20, -26 + shoulderSlump);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#44403c';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Right Pauldron
      ctx.fillStyle = '#292524';
      ctx.beginPath();
      ctx.moveTo(24, -14 + shoulderSlump);
      ctx.lineTo(44, -28 + shoulderSlump);
      ctx.lineTo(22, -24 + shoulderSlump);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#57534e';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Wrist Manacles with dangling snapped chains
      for (let s = -1; s <= 1; s += 2) {
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(s * 26 - 4, -4, 8, 12);
        ctx.strokeStyle = '#78716c';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(s * 26 - 4, -4, 8, 12);
        // Dangling chain links
        ctx.strokeStyle = '#44403c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s * 26, 8);
        ctx.lineTo(s * 26 - 2, 16);
        ctx.lineTo(s * 26 + 1, 24);
        ctx.stroke();
      }
    }
    ctx.restore(); // Close torso restore

    // 9. Iron Greathelm (Reacts to headAngle for defiance look & collapse)
    ctx.save();
    if (boss.headAngle) {
      ctx.translate(0, -32);
      ctx.rotate(boss.headAngle);
      ctx.translate(0, 32);
    }
    ctx.fillStyle = isFlashing ? '#ffffff' : (isSilhouette ? '#050302' : '#0c0a09');
    ctx.beginPath();
    ctx.arc(0, -32, 20, 0, Math.PI * 2);
    ctx.fill();

    if (!isSilhouette) {
      // Helm brow ridge & side vents
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(-14, -44, 28, 6);
      ctx.fillStyle = '#292524';
      ctx.fillRect(-12, -43, 24, 2);

      // 10. Glowing Molten Visor Slit
      const drawEyes = (!isSilhouette && !isArmorOnly) || isEyesOnly;
      if (drawEyes) {
        let eyeAlpha = 1.0;
        if (defeat === 'defiance' || defeat === 'looking_at_rowan') {
          eyeAlpha = boss.visorAlpha !== undefined ? boss.visorAlpha : 1.0;
        } else if (defeat === 'unstable') {
          eyeAlpha = (Math.random() > 0.35 ? 1 : 0.3);
        } else if (defeat === 'corpse' || defeat === 'cracking' || defeat === 'collapsed') {
          eyeAlpha = 0.0; // Visor extinguished upon defeat
        }
        ctx.save();
        ctx.globalAlpha = (ctx.globalAlpha || 1.0) * eyeAlpha;
        ctx.fillStyle = rage ? '#ffedd5' : '#fed7aa';
        ctx.shadowColor = rage ? '#f97316' : '#ea580c';
        ctx.shadowBlur = 18;
        if (defeat === 'defiance' || defeat === 'looking_at_rowan') {
          const eyeY = -34 + (boss.headRaiseProg ? -2 * boss.headRaiseProg : 0);
          ctx.fillRect(-8, eyeY, 18, 4.5);
        } else {
          ctx.fillRect(-11, -33, 22, 4.5);
        }
        ctx.restore();
      }
    }
    ctx.restore(); // Close head restore

    // 11. Colossal Ancient Executioner Pillar-Mace (Held or dynamically falling)
    if (!boss.weaponDropped && !isSilhouette) {
      ctx.save();
      const tilt = boss.weaponTilt || 0;
      const offY = boss.weaponOffsetY || 0;
      const offX = boss.weaponOffsetX || 0;
      ctx.translate(30 + offX, -14 + offY);
      ctx.rotate(tilt);
      ctx.translate(-30, 14);

      // Shaft
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(24, -54, 13, 76);
      // Leather grip wraps
      ctx.fillStyle = '#334155';
      ctx.fillRect(24, -14, 13, 14);
      // Massive iron hammerhead
      ctx.fillStyle = '#292524';
      ctx.fillRect(16, -72, 29, 26);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(16, -72, 29, 26);
      // Iron studs & chipped spikes
      ctx.fillStyle = '#78716c';
      ctx.fillRect(13, -64, 4, 10);
      ctx.fillRect(44, -64, 4, 10);
      // Glowing ancient rune band
      ctx.fillStyle = '#ea580c';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 8;
      ctx.fillRect(20, -62, 21, 3);
      ctx.restore();
    }

    ctx.restore(); // Close boss body transform

    // 12. Fallen Weapon on Stone Floor (After weapon drop impact)
    if (boss.weaponDropped) {
      ctx.save();
      const wAlpha = Math.max(0, 1.0 - (boss.weaponDissolveProg || boss.vaporizeProg || 0));
      ctx.globalAlpha = (ctx.globalAlpha || 1.0) * wAlpha;
      ctx.translate(28, 22);
      ctx.rotate(0.92);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(2, 6, 68, 14);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, -6, 12, 68);
      ctx.fillStyle = '#292524';
      ctx.fillRect(-8, 54, 28, 22);
      ctx.strokeStyle = '#44403c';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-8, 54, 28, 22);
      // Studs & spikes on fallen head
      ctx.fillStyle = '#78716c';
      ctx.fillRect(-11, 60, 3, 10);
      ctx.fillRect(20, 60, 3, 10);
      // Rune band
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(-4, 62, 18, 2.5);
      ctx.restore();
    }
  },

  drawMalakor(ctx, boss, isFlashing, pulse) {
    const phase = boss.phase || 1;
    const isP3 = phase === 3;

    // Introduction Materialize Progression
    const isIntro = boss.introMaterialize !== undefined && boss.introMaterialize < 1.0;
    const introProg = isIntro ? boss.introMaterialize : 1.0;

    // Shot 1-2 of Intro: Before emergence, show a tightening hairline singularity
    if (isIntro && introProg < 0.25) {
      const lineProg = introProg / 0.25;
      ctx.save();
      ctx.strokeStyle = '#f5d0fe';
      ctx.shadowColor = '#d946ef';
      ctx.shadowBlur = 14;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -32 * lineProg);
      ctx.lineTo(0, 32 * lineProg);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Micro spatial instability: In Phase 3 (or charging attacks), occasional pixel shear
    const glitch = (isP3 && Math.sin(GameState.F * 0.25) > 0.75) ? (Math.sin(GameState.F * 1.5) > 0 ? 2 : -2) : 0;
    const levitateY = Math.sin(GameState.F * 0.07 + (boss.ph || 0)) * 2.5;

    // Directional Ground Contact Shadow
    ctx.save();
    ctx.fillStyle = 'rgba(5, 2, 10, 0.58)';
    ctx.beginPath();
    ctx.ellipse(0, 34 + levitateY * 0.3, 30, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Teleportation Windup / Arrival Sigil
    if (boss.teleportState) {
      const windup = boss.teleportState === 'windup';
      const timer = Math.max(0, boss.teleportTimer || 0);
      const duration = windup ? 0.62 : 0.42;
      const progress = Math.max(0, Math.min(1, 1 - timer / duration));
      const radius = windup ? 36 - progress * 22 : 12 + progress * 26;

      ctx.save();
      ctx.globalAlpha *= 0.35 + progress * 0.55;
      ctx.strokeStyle = windup ? '#f5d0fe' : '#c084fc';
      ctx.shadowColor = '#d946ef';
      ctx.shadowBlur = 18;
      ctx.lineWidth = 2.2;
      ctx.setLineDash([5, 4]);
      ctx.lineDashOffset = GameState.F * (windup ? 1.8 : -1.8);
      ctx.beginPath();
      ctx.arc(0, -4, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Convergence rays during windup
      if (windup) {
        ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(232, 121, 249, 0.45)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI / 2) + progress * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * (radius + 8), Math.sin(a) * (radius + 8) - 4);
          ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius - 4);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // Vulnerability Recovery Window
    const isVulnerable = boss.vulnTimer > 0;
    const vulnAlpha = isVulnerable ? Math.min(0.85, boss.vulnTimer / (isP3 ? 0.64 : 0.95)) : 0;

    // Attack Telegraph: Void core charging
    const isCharging = !!boss.isChargingVolley;

    // Apply levitation offset
    ctx.translate(0, -levitateY);

    // ─────────────────────────────────────────────────────────────
    // 1. FLOATING DISPLACED ARMOR SHARDS (Shattered Left Flank)
    // Small, controlled geometric fragments slightly displaced from main body
    // ─────────────────────────────────────────────────────────────
    const shards = [
      { bx: -26, by: -16, w: 7, h: 14, ox: -4, oy: -2 },
      { bx: -22, by: 12, w: 8, h: 18, ox: -6, oy: 4 },
      { bx: -16, by: 32, w: 6, h: 12, ox: -3, oy: 6 },
      { bx: 26, by: -24, w: 6, h: 10, ox: 3, oy: -3 }
    ];

    shards.forEach((s, i) => {
      const drift = Math.round(Math.sin(GameState.F * 0.06 + i * 1.8) * 2) + (i % 2 === 0 ? glitch : 0);
      const sx = s.bx + s.ox + drift;
      const sy = s.by + s.oy;
      ctx.save();
      ctx.fillStyle = isFlashing ? '#ffffff' : (i === 1 ? '#180728' : '#0c0416');
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + s.w, sy + 3);
      ctx.lineTo(sx + s.w - 2, sy + s.h);
      ctx.lineTo(sx - 3, sy + s.h - 2);
      ctx.closePath();
      ctx.fill();

      // Specular edge on fragments
      ctx.strokeStyle = isFlashing ? '#ffffff' : 'rgba(192, 132, 252, 0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    });

    // ─────────────────────────────────────────────────────────────
    // 2. MAIN ELONGATED SILHOUETTE & BROKEN MANTLE
    // Asymmetrical: Solid structured obsidian on right, fractured on left
    // ─────────────────────────────────────────────────────────────
    ctx.fillStyle = isFlashing ? '#ffffff' : '#0b0414';
    ctx.beginPath();
    // High arched collar
    ctx.moveTo(0, -44);
    // Right shoulder & pauldron (intact, sharp, beveled)
    ctx.lineTo(16, -42);
    ctx.lineTo(28, -28);
    ctx.lineTo(24, -8);
    ctx.lineTo(28, 14);
    ctx.lineTo(20, 44);
    // Lower jagged tassets
    ctx.lineTo(6, 48);
    ctx.lineTo(0, 38);
    ctx.lineTo(-8, 46);
    // Left flank (fractured, jagged missing sections)
    ctx.lineTo(-14, 30);
    ctx.lineTo(-8, 18);
    ctx.lineTo(-20, 6);
    ctx.lineTo(-14, -14);
    ctx.lineTo(-26, -26);
    ctx.lineTo(-12, -40);
    ctx.closePath();
    ctx.fill();

    // ─────────────────────────────────────────────────────────────
    // 3. LAYERED OBSIDIAN ARMOR FACETS (2.5D Shaded Geometry)
    // ─────────────────────────────────────────────────────────────
    if (!isFlashing) {
      // Mid-tone obsidian armor mantle (right side)
      ctx.fillStyle = '#1e0a35';
      ctx.beginPath();
      ctx.moveTo(2, -40);
      ctx.lineTo(14, -38);
      ctx.lineTo(24, -26);
      ctx.lineTo(18, -6);
      ctx.lineTo(4, 2);
      ctx.lineTo(0, -18);
      ctx.closePath();
      ctx.fill();

      // Beveled chest plate planes
      ctx.fillStyle = '#2d114c';
      ctx.beginPath();
      ctx.moveTo(0, -28);
      ctx.lineTo(10, -16);
      ctx.lineTo(4, 12);
      ctx.lineTo(-6, 8);
      ctx.lineTo(-8, -16);
      ctx.closePath();
      ctx.fill();

      // Sharp chiseled highlight facet
      ctx.fillStyle = '#4c1d95';
      ctx.beginPath();
      ctx.moveTo(10, -36);
      ctx.lineTo(18, -26);
      ctx.lineTo(14, -14);
      ctx.lineTo(8, -22);
      ctx.closePath();
      ctx.fill();

      // Lower robe / tasset shading
      ctx.fillStyle = '#140624';
      ctx.beginPath();
      ctx.moveTo(0, 6);
      ctx.lineTo(14, 18);
      ctx.lineTo(12, 42);
      ctx.lineTo(0, 36);
      ctx.lineTo(-8, 38);
      ctx.closePath();
      ctx.fill();

      // Hairline specular edge highlight
      ctx.strokeStyle = 'rgba(216, 180, 254, 0.40)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(14, -38);
      ctx.lineTo(24, -26);
      ctx.lineTo(20, 10);
      ctx.stroke();
    }

    // ─────────────────────────────────────────────────────────────
    // 4. VOID SINGULARITY CORE (Restrained Deep-Violet Event Horizon)
    // ─────────────────────────────────────────────────────────────
    const corePulse = pulse * (isCharging ? 0.35 : 0.16);
    const coreR = (isCharging ? 14 : 17) * (0.90 + corePulse);
    const coreY = -2;

    // Deep event horizon gradient
    const coreGrad = ctx.createRadialGradient(0, coreY, 2, 0, coreY, coreR);
    coreGrad.addColorStop(0, isCharging ? '#ffffff' : '#f5d0fe');
    coreGrad.addColorStop(0.28, isCharging ? '#e879f9' : '#c084fc');
    coreGrad.addColorStop(0.65, '#581c87');
    coreGrad.addColorStop(0.92, '#1e0538');
    coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, coreY, coreR, 0, Math.PI * 2);
    ctx.fill();

    // Black singularity center
    ctx.fillStyle = '#05010a';
    ctx.beginPath();
    ctx.arc(0, coreY, coreR * 0.38, 0, Math.PI * 2);
    ctx.fill();

    // ─────────────────────────────────────────────────────────────
    // 5. VULNERABILITY WINDOW BEACON RING
    // ─────────────────────────────────────────────────────────────
    if (isVulnerable) {
      ctx.save();
      ctx.globalAlpha *= vulnAlpha;
      ctx.strokeStyle = '#f5f3ff';
      ctx.shadowColor = '#e9d5ff';
      ctx.shadowBlur = 18;
      ctx.lineWidth = 2.5;
      const vPulse = Math.sin(GameState.F * 0.22) * 2;
      ctx.beginPath();
      ctx.arc(0, coreY, coreR * 0.85 + vPulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // ─────────────────────────────────────────────────────────────
    // 6. ANCIENT CRACKED MASK & HELM
    // ─────────────────────────────────────────────────────────────
    // Horned obsidian helm crown
    ctx.fillStyle = isFlashing ? '#ffffff' : '#0c0416';
    ctx.beginPath();
    ctx.moveTo(0, -48);
    ctx.lineTo(8, -54);
    ctx.lineTo(14, -40);
    ctx.lineTo(4, -36);
    ctx.lineTo(-4, -36);
    ctx.lineTo(-12, -44);
    ctx.lineTo(-6, -52);
    ctx.closePath();
    ctx.fill();

    // Angular mask faceplate (lower-left cracked away)
    ctx.fillStyle = isFlashing ? '#ffffff' : '#1a0b2e';
    ctx.beginPath();
    ctx.moveTo(-10, -40);
    ctx.lineTo(10, -40);
    ctx.lineTo(14, -26);
    ctx.lineTo(6, -14);
    ctx.lineTo(-2, -16);
    // Cracked jagged edge on left
    ctx.lineTo(-6, -24);
    ctx.lineTo(-12, -28);
    ctx.closePath();
    ctx.fill();

    // Dark inset visor channel
    ctx.fillStyle = '#06020c';
    ctx.beginPath();
    ctx.moveTo(-9, -30);
    ctx.lineTo(11, -30);
    ctx.lineTo(8, -23);
    ctx.lineTo(-7, -23);
    ctx.closePath();
    ctx.fill();

    // Glowing Lavender Slit Eyes (narrow and focus during volley charge)
    ctx.save();
    ctx.fillStyle = '#fae8ff';
    ctx.shadowColor = '#d946ef';
    ctx.shadowBlur = 14;
    const eyeH = isCharging ? 2 : 4;
    ctx.beginPath();
    ctx.ellipse(-4, -26, 2.5, eyeH, -0.1, 0, Math.PI * 2);
    ctx.ellipse(5, -26, 2.5, eyeH, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }
};

export const AnimSystem = {
  drawPlayer: () => CharacterRenderer.drawPlayer(window.CX),
  drawEnemy: (e) => CharacterRenderer.drawEnemy(window.CX, e),
  drawBoss: (b) => CharacterRenderer.drawBoss(window.CX, b),
  tickPlayer: (dt) => {},
  tickEnemy: (e, dt) => {}
};

if (typeof window !== 'undefined') {
  window.CharacterRenderer = CharacterRenderer;
  window.AnimSystem = AnimSystem;
}
