// =====================================================================
//  DUNGEON BREAK — js/combat/CombatSystem.js
//  Authoritative Player Weapon Attacks, Ability Execution, & Hit Detection
// =====================================================================

import { GameState } from '../core/GameState.js';
import { WeaponInventory } from '../weapons/WeaponInventory.js';
import { WeaponEffects } from '../weapons/WeaponEffects.js';
import { dealDamage, getNextAttackId } from './DamageSystem.js';
import { ProjectileSystem } from './ProjectileSystem.js';
import { HitboxSystem } from './HitboxSystem.js';
import { ParticleRenderer } from '../rendering/ParticleRenderer.js';
import { isBossFloor } from '../data/floors.js';
import { SoundManager } from '../audio/AudioManager.js';
import { EventBus } from '../core/EventBus.js';
import { movePlayerWithCollision } from '../player/PlayerController.js';
import { PlayerStats } from '../player/PlayerStats.js';

export const CombatSystem = {
  doAttack(targetAng = null) {
    const { P, ENE, BOSS, LV } = GameState;
    if (P.acd > 0 || P.dead || P.dying || GameState.STATE !== 'playing' || (typeof window !== 'undefined' && window.ShatteredMindCinematic && window.ShatteredMindCinematic.isActive())) return false;

    const w = WeaponInventory.getActiveWeapon();
    const cd = w.cooldown !== undefined ? w.cooldown : (w.cd !== undefined ? w.cd : 0.32);
    const baseDmg = w.damage !== undefined ? w.damage : (w.dmg !== undefined ? w.dmg : 2);
    const range = w.range !== undefined ? w.range : 1.5;

    P.acd = cd;
    P.aanim = cd;
    P.attackPhase = 'active'; // windup -> active -> recovery
    P.attackPhaseTimer = cd;

    // Determine attack angle
    let ang = Math.atan2(P.fy, P.fx);
    if (typeof targetAng === 'number' && !isNaN(targetAng)) {
      ang = targetAng;
      P.fx = Math.cos(ang);
      P.fy = Math.sin(ang);
    }

    const currentSwingId = getNextAttackId();
    const boost = PlayerStats.getEffectiveDamageMultiplier(w.id);
    const dmg = Math.max(1, Math.round(baseDmg * boost));
    const isCrit = Math.random() < PlayerStats.getCriticalChance(w.id);
    const attackSource = {
      isPlayer: true,
      fromPlayer: true,
      isCrit,
      x: P.x,
      y: P.y,
      attackId: currentSwingId,
      weaponId: w.id
    };

    // ─────────────────────────────────────────────────────────────
    // 1. BOW — Pure Ranged Projectile Attack
    // ─────────────────────────────────────────────────────────────
    if (w.type === 'ranged' || w.id === 'bow') {
      GameState.CAM.shk = 3;
      const spd = 9.5 * (1 + ((GameState.TALENTS && GameState.TALENTS.hunters_focus) || 0) * 0.15);
      const vx = Math.cos(ang) * spd;
      const vy = Math.sin(ang) * spd;
      ProjectileSystem.spawnProjectile(P.x, P.y, vx, vy, dmg, false, true);
      SoundManager.snd('bow_shoot');
      EventBus.emit('combat:attack', { weapon: w, type: 'ranged', attackId: currentSwingId });
      return true;
    }

    // ─────────────────────────────────────────────────────────────
    // 2. DAGGER — Rapid Flurry Sequence with Micro-Lunge
    // ─────────────────────────────────────────────────────────────
    if (w.id === 'dagger') {
      P.daggerCombo = ((P.daggerCombo || 0) % 3) + 1;
      const lungeDist = 0.35 * (1 + ((GameState.TALENTS && GameState.TALENTS.rift_discipline) || 0) * 0.15);
      movePlayerWithCollision(P.fx * lungeDist, P.fy * lungeDist, 0.15);
      P.vx = P.fx * 2.8;
      P.vy = P.fy * 2.8;
      if (!GameState.REDUCED_MOTION) GameState.CAM.shk = 2;

      // Afterimage void particles
      ParticleRenderer.spawnP(P.x, P.y, 3, { col: '#c084fc', spd: 0.5, r: 2.0 });
      WeaponEffects.addSwingTrail(P.x, P.y, ang + (P.daggerCombo === 2 ? 0.25 : -0.25), w);
    }
    // ─────────────────────────────────────────────────────────────
    // 3. AXE — Heavy Execution Sweep
    // ─────────────────────────────────────────────────────────────
    else if (w.id === 'axe') {
      if (!GameState.REDUCED_MOTION) GameState.CAM.shk = 8;
      ParticleRenderer.spawnRing(P.x, P.y, '#f97316');
      ParticleRenderer.spawnP(P.x, P.y, 6, { col: '#ea580c', spd: 1.0, r: 2.5 });
      WeaponEffects.addSwingTrail(P.x, P.y, ang, w);
    }
    // ─────────────────────────────────────────────────────────────
    // 4. SPEAR — Linear Piercing Corridor Thrust
    // ─────────────────────────────────────────────────────────────
    else if (w.id === 'spear') {
      if (!GameState.REDUCED_MOTION) GameState.CAM.shk = 4;
      ParticleRenderer.spawnP(P.x + P.fx * 0.8, P.y + P.fy * 0.8, 4, { col: '#38bdf8', spd: 1.2, r: 2 });
      WeaponEffects.addSwingTrail(P.x, P.y, ang, w);
    }
    // ─────────────────────────────────────────────────────────────
    // 5. SWORD — Fast Clean Arc
    // ─────────────────────────────────────────────────────────────
    else {
      if (!GameState.REDUCED_MOTION) GameState.CAM.shk = 3;
      WeaponEffects.addSwingTrail(P.x, P.y, ang, w);
    }

    let hitAny = false;
    const dType = w.id === 'axe' ? 'heavy' : (w.id === 'spear' ? 'pierce' : 'melee');
    const actualDmg = w.id === 'dagger' ? Math.max(1, Math.round(dmg * 0.75)) : dmg;

    // ─────────────────────────────────────────────────────────────
    // Check Boss Hit (single hit tracking per swing)
    // ─────────────────────────────────────────────────────────────
    if (BOSS && BOSS.alive) {
      if (HitboxSystem.checkWeaponHitbox(w, P.x, P.y, P.fx, P.fy, BOSS.x, BOSS.y, 0.9)) {
        if (dealDamage(attackSource, BOSS, actualDmg, dType)) {
          hitAny = true;
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // Check Enemy Hits (strictly single-hit per swing tracked)
    // ─────────────────────────────────────────────────────────────
    if (ENE && ENE.length > 0) {
      for (let j = ENE.length - 1; j >= 0; j--) {
        const e = ENE[j];
        if (!e.alive) continue;

        if (HitboxSystem.checkWeaponHitbox(w, P.x, P.y, P.fx, P.fy, e.x, e.y, 0.45)) {
          if (dealDamage(attackSource, e, actualDmg, dType)) {
            hitAny = true;
          }
        }
      }
    }

    EventBus.emit('combat:attack', { weapon: w, type: 'melee', hitAny, attackId: currentSwingId });
    return hitAny;
  },

  fireBowQuick() {
    const bowSlot = GameState.weaponSlots.findIndex(w => w && w.id === 'bow');
    if (bowSlot !== -1 && GameState.activeWeaponSlot !== bowSlot) {
      WeaponInventory.switchWeaponSlot(bowSlot);
    }
    if (WeaponInventory.getActiveWeapon().id === 'bow') {
      this.doAttack();
    }
  },

  triggerWeaponAbility() {
    const { P, ENE, BOSS, LV } = GameState;
    if (P.dead || P.dying || GameState.STATE !== 'playing' || (typeof window !== 'undefined' && window.ShatteredMindCinematic && window.ShatteredMindCinematic.isActive())) return;

    // Enforce 5.0s Q Special Cooldown
    if (P.qCooldown > 0) {
      ParticleRenderer.showFloatingText('SPECIAL NOT READY (' + P.qCooldown.toFixed(1) + 's)', P.x, P.y - 0.5, '#94a3b8', 11, false);
      SoundManager.snd('parry');
      return;
    }

    const w = WeaponInventory.getActiveWeapon();
    const specialCooldown = PlayerStats.getSpecialCooldown();
    P.qCooldown = specialCooldown;
    P.qMaxCooldown = specialCooldown;
    P.aanim = 0.35;
    const currentSwingId = getNextAttackId();
    const attackSource = {
      isPlayer: true,
      fromPlayer: true,
      isSpecial: true,
      attackId: 'special_' + currentSwingId,
      weapon: w,
      x: P.x,
      y: P.y
    };

    SoundManager.snd('talent_unlock');
    ParticleRenderer.showFloatingText('⚔️ ' + (w.id.toUpperCase()) + ' SPECIAL!', P.x, P.y - 0.8, '#fde68a', 14, true);

    const baseDmg = w.damage !== undefined ? w.damage : (w.dmg !== undefined ? w.dmg : 3.5);
    const boost = P.dmgBoost || 1.0;

    // ─────────────────────────────────────────────────────────────
    // 1. SWORD — Blade Cyclone / Tempest Whirlwind
    // 360-degree cleave + forward surge dealing 2.3x damage
    // ─────────────────────────────────────────────────────────────
    if (w.id === 'sword') {
      const specialDmg = Math.max(1, Math.round(baseDmg * 2.3 * boost));
      movePlayerWithCollision(P.fx * 1.4, P.fy * 1.4, 0.2);
      P.vx = P.fx * 5;
      P.vy = P.fy * 5;
      GameState.CAM.shk = 10;

      ParticleRenderer.spawnRing(P.x, P.y, '#fde047');
      ParticleRenderer.spawnP(P.x, P.y, 20, { col: '#facc15', spd: 2.2, r: 3.5 });
      SoundManager.snd('shockwave');

      // Hit boss
      if (BOSS && BOSS.alive && Math.hypot(BOSS.x - P.x, BOSS.y - P.y) <= 2.6) {
        dealDamage(attackSource, BOSS, specialDmg, 'heavy');
      }
      // Hit surrounding enemies
      ENE.forEach(e => {
        if (e.alive && Math.hypot(e.x - P.x, e.y - P.y) <= 2.6) {
          dealDamage(attackSource, e, specialDmg, 'heavy');
        }
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. AXE — Titan Earthshaker Slam
    // Massive ground slam shockwave dealing 2.2x damage + high knockback
    // ─────────────────────────────────────────────────────────────
    else if (w.id === 'axe') {
      const specialDmg = Math.max(1, Math.round(baseDmg * 2.2 * boost));
      GameState.CAM.shk = 20;

      ParticleRenderer.spawnRing(P.x, P.y, '#ea580c');
      ParticleRenderer.spawnRing(P.x, P.y, '#f97316');
      ParticleRenderer.spawnP(P.x, P.y, 28, { col: '#fb923c', spd: 2.5, r: 4.5 });
      SoundManager.snd('shockwave');

      if (BOSS && BOSS.alive && Math.hypot(BOSS.x - P.x, BOSS.y - P.y) <= 3.2) {
        dealDamage(attackSource, BOSS, specialDmg, 'heavy');
      }
      ENE.forEach(e => {
        if (e.alive && Math.hypot(e.x - P.x, e.y - P.y) <= 3.2) {
          dealDamage(attackSource, e, specialDmg, 'heavy');
        }
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 3. DAGGER — Shadow Phantom Flurry
    // Flash forward up to 3.8 tiles through shadows (collision-checked, stops at walls/chasms)
    // ─────────────────────────────────────────────────────────────
    else if (w.id === 'dagger') {
      const specialDmg = Math.max(1, Math.round(baseDmg * 2.5 * boost));
      const startX = P.x;
      const startY = P.y;
      const { movedX, movedY } = movePlayerWithCollision(P.fx * 3.8, P.fy * 3.8, 0.2);
      GameState.CAM.shk = 8;

      // Spawn shadow phantom trail along the path actually traversed
      const trailCount = 6;
      for (let s = 1; s <= trailCount; s++) {
        const tx = startX + (movedX * s) / trailCount;
        const ty = startY + (movedY * s) / trailCount;
        ParticleRenderer.spawnP(tx, ty, 3, { col: '#a855f7', spd: 0.8, r: 2.2 });
      }

      ParticleRenderer.spawnRing(P.x, P.y, '#a855f7');
      ParticleRenderer.spawnP(P.x, P.y, 18, { col: '#c084fc', spd: 1.8, r: 3 });
      SoundManager.snd('melee_hit');

      attackSource.isCrit = true;
      if (BOSS && BOSS.alive && Math.hypot(BOSS.x - P.x, BOSS.y - P.y) <= 2.4) {
        dealDamage(attackSource, BOSS, specialDmg, 'melee');
      }
      ENE.forEach(e => {
        if (e.alive && Math.hypot(e.x - P.x, e.y - P.y) <= 2.4) {
          dealDamage(attackSource, e, specialDmg, 'melee');
        }
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 4. SPEAR — Dragon Lance Radiant Thrust
    // 4.8-tile penetrating corridor piercing all foes for 2.3x damage
    // ─────────────────────────────────────────────────────────────
    else if (w.id === 'spear') {
      const specialDmg = Math.max(1, Math.round(baseDmg * 2.3 * boost));
      movePlayerWithCollision(P.fx * 0.9, P.fy * 0.9, 0.2);
      P.vx = P.fx * 4;
      P.vy = P.fy * 4;
      GameState.CAM.shk = 12;

      ParticleRenderer.spawnRing(P.x + P.fx * 1.5, P.y + P.fy * 1.5, '#38bdf8');
      ParticleRenderer.spawnP(P.x + P.fx * 2.0, P.y + P.fy * 2.0, 22, { col: '#7dd3fc', spd: 2.2, r: 3.5 });
      SoundManager.snd('shockwave');

      // Check all enemies in a forward corridor
      const checkCorridorHit = (tx, ty, tr) => {
        const toX = tx - P.x;
        const toY = ty - P.y;
        const dot = toX * P.fx + toY * P.fy;
        if (dot < 0 || dot > 5.0) return false;
        const perp = Math.abs(toX * (-P.fy) + toY * P.fx);
        return perp <= (1.2 + tr);
      };

      if (BOSS && BOSS.alive && checkCorridorHit(BOSS.x, BOSS.y, BOSS.r || 1.4)) {
        dealDamage(attackSource, BOSS, specialDmg, 'pierce');
      }
      ENE.forEach(e => {
        if (e.alive && checkCorridorHit(e.x, e.y, e.r || 0.65)) {
          dealDamage(attackSource, e, specialDmg, 'pierce');
        }
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 5. BOW — Celestial Starfall Piercing Tri-Burst
    // 3 heavy hyper-charged piercing arrows dealing 2.2x damage each
    // ─────────────────────────────────────────────────────────────
    else if (w.id === 'bow') {
      const specialDmg = Math.max(1, Math.round(baseDmg * 2.2 * boost));
      const baseAng = Math.atan2(P.fy, P.fx);
      GameState.CAM.shk = 7;

      for (const offset of [-0.22, 0, 0.22]) {
        const a = baseAng + offset;
        ProjectileSystem.spawnProjectile(
          P.x,
          P.y,
          Math.cos(a) * 11.0,
          Math.sin(a) * 11.0,
          specialDmg,
          false,
          true
        );
      }
      SoundManager.snd('bow_shoot');
      SoundManager.snd('shockwave');
      ParticleRenderer.spawnP(P.x, P.y, 14, { col: '#6ee7b7', spd: 1.8, r: 3 });
    }

    EventBus.emit('combat:special_used', { weapon: w, damageMult: 2.3 });
  }
};

export const doAttack = (ang) => CombatSystem.doAttack(ang);
export const fireBowQuick = () => CombatSystem.fireBowQuick();
export const triggerWeaponAbility = () => CombatSystem.triggerWeaponAbility();

if (typeof window !== 'undefined') {
  window.doAttack = doAttack;
  window.fireBowQuick = fireBowQuick;
  window.triggerWeaponAbility = triggerWeaponAbility;
}
