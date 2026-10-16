// =====================================================================
//  DUNGEON BREAK — js/combat/DamageSystem.js
//  Authoritative Damage Pipeline, Hit-Tracking, Knockback, & Enemy Kill Resolution
// =====================================================================

import { GameState } from '../core/GameState.js';
import { HealthSystem } from '../systems/HealthSystem.js';
import { RelicSystem } from '../systems/RelicSystem.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import { SoundManager } from '../audio/AudioManager.js';
import { WeaponInventory } from '../weapons/WeaponInventory.js';
import { triggerHitStop } from './HitStop.js';
import { ParticleRenderer } from '../rendering/ParticleRenderer.js';
import { EventBus } from '../core/EventBus.js';
import { SanitySystem } from '../systems/SanitySystem.js';
import { WardenDefeatCinematic } from '../cinematics/WardenDefeatCinematic.js';
import { GorgarothCinematics } from '../cinematics/GorgarothCinematics.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { ProgressionSystem } from '../systems/ProgressionSystem.js';

export let SWING_COUNTER = 0;

export function getNextAttackId() {
  return ++SWING_COUNTER;
}

export function dealDamage(source, target, amount, damageType = 'melee') {
  if (!target) return false;
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) return false;

  const { P, BOSS } = GameState;

  // 1. Player receiving damage
  if (target === P || target.isPlayer) {
    if (P.dead || P.shieldActive || P.dcd > 0) return false;

    // Single-hit tracking per attack instance (prevents multi-frame damage)
    if (source && source.attackId) {
      P._hitByAttacks = P._hitByAttacks || {};
      const now = GameState.TIME || (Date.now() / 1000);
      if (P._hitByAttacks[source.attackId]) return false;
      const attackKeys = Object.keys(P._hitByAttacks);
      if (attackKeys.length > 30) {
        for (let i = 0; i < attackKeys.length; i++) {
          const k = attackKeys[i];
          const val = P._hitByAttacks[k];
          if (val === true || (typeof val === 'number' && now - val > 3.0)) {
            delete P._hitByAttacks[k];
          }
        }
      }
      P._hitByAttacks[source.attackId] = now;
    }

    HealthSystem.damagePlayer(amount, source, damageType);
    return true;
  }

  // 2. Enemy or Boss receiving damage
  if (!target.alive) return false;

  // Strict safety check: only valid player attacks/projectiles/traps can harm enemies
  // Proximity, movement, rendering, particles, lighting, spawn effects CANNOT damage enemies!
  if (!source || (!source.isPlayer && !source.fromPlayer && !source.isTrap && !source.environmental && !source.isEnemy)) {
    return false;
  }

  // Single-swing hit tracking: prevents multiple hits from the same swing/frame
  if (source && source.attackId) {
    target._hitBySwings = target._hitBySwings || {};
    if (target._hitBySwings[source.attackId]) return false;
    target._hitBySwings[source.attackId] = true;
  }

  // Target is Boss or Enemy
  const isCrit = (source && typeof source.isCrit === 'boolean') 
    ? source.isCrit 
    : (Math.random() < ((GameState.TALENTS && GameState.TALENTS.fury ? GameState.TALENTS.fury * 0.08 : 0) + (source && source.isPlayer ? 0.08 : 0)));
  const finalAmount = isCrit ? Math.max(1, Math.round(amount * 1.75)) : amount;

  if (target.isBoss || target === BOSS) {
    const bossArmor = target.armor !== undefined ? target.armor : (BOSS ? (BOSS.armor || 0) : 0);
    const bossDmg = Math.max(1, Math.round(finalAmount * (1 - bossArmor)));
    damageBoss(bossDmg, isCrit, damageType, source);
    return true;
  }

  // Regular Enemy: Armor Mitigation
  const enemyArmor = Math.min(0.75, target.armor || 0);
  const mitigatedAmount = Math.max(1, Math.round(finalAmount * (1 - enemyArmor)));
  target.hp = Math.max(0, target.hp - mitigatedAmount);
  target._engagedTimer = 3.5;

  // Poise Damage & Stagger Evaluation
  let poiseDamage = 14;
  if (damageType === 'heavy') poiseDamage = 35;
  else if (damageType === 'pierce') poiseDamage = 18;
  else if (damageType === 'ranged') poiseDamage = 12;
  else if (source && (source.weaponId === 'dagger' || (source.weapon && source.weapon.id === 'dagger'))) poiseDamage = 8;
  if (isCrit) poiseDamage = Math.round(poiseDamage * 1.5);

  if (target.currentPoise === undefined) {
    target.currentPoise = target.poise || 20;
  }
  target.currentPoise -= poiseDamage;

  const canStagger = (target.staggerCooldown || 0) <= 0;
  const isStaggered = (damageType === 'heavy') || isCrit || (target.currentPoise <= 0 && canStagger);

  if (isStaggered) {
    target.staggerTimer = 0.60;
    target.staggerCooldown = 1.0; // 1.0s anti-stunlock immunity against light interrupts
    target.currentPoise = target.poise || 20;
    target.aiState = 'HURT';
    target.telegraphing = false;
    target.telegraphTimer = 0;
  }

  // Layered Combat Feedback: LIGHT, HEAVY, CRITICAL, PIERCE
  if (isCrit) {
    target.hitFlash = 0.35;
    triggerHitStop(0.08);
    GameState.CAM.shk = Math.max(GameState.CAM.shk, 8);
    ParticleRenderer.spawnP(target.x, target.y, 8, { col: '#facc15', spd: 1.8, r: 3.5, star: true });
    ParticleRenderer.spawnRing(target.x, target.y, '#fef08a');
    ParticleRenderer.showFloatingText('CRIT! ' + mitigatedAmount, target.x, target.y, '#facc15', 15, true);
    SoundManager.snd('talent_unlock');
  } else if (damageType === 'heavy') {
    target.hitFlash = 0.30;
    triggerHitStop(0.09);
    GameState.CAM.shk = Math.max(GameState.CAM.shk, 12);
    ParticleRenderer.spawnP(target.x, target.y, 7, { col: '#fb923c', spd: 1.5, r: 3 });
    ParticleRenderer.spawnRing(target.x, target.y, '#fb923c');
    ParticleRenderer.showFloatingText(String(mitigatedAmount), target.x, target.y, '#f97316', 13, false);
    SoundManager.snd('melee_hit');
    SoundManager.snd('shockwave');
  } else if (damageType === 'pierce') {
    target.hitFlash = 0.22;
    triggerHitStop(0.05);
    GameState.CAM.shk = Math.max(GameState.CAM.shk, 5);
    ParticleRenderer.spawnP(target.x, target.y, 5, { col: '#38bdf8', spd: 1.1, r: 2.5 });
    ParticleRenderer.showFloatingText(String(mitigatedAmount), target.x, target.y, '#38bdf8', 12, false);
    SoundManager.snd('melee_hit');
  } else {
    // Light / standard hit
    target.hitFlash = 0.18;
    triggerHitStop(0.035);
    GameState.CAM.shk = Math.max(GameState.CAM.shk, 3);
    ParticleRenderer.spawnP(target.x, target.y, 3, { col: '#fde68a', spd: 0.8, r: 2 });
    ParticleRenderer.showFloatingText(String(mitigatedAmount), target.x, target.y, '#f1f5f9', 11, false);
    SoundManager.snd('melee_hit');
  }

  // Knockback (heavy hits and crits always knock back; light hits only knock back when staggered)
  if (source && source.x !== undefined && (isStaggered || damageType === 'heavy' || isCrit)) {
    const kx = target.x - source.x;
    const ky = target.y - source.y;
    const kl = Math.hypot(kx, ky) || 1;
    const kb = isCrit ? 3.8 : (damageType === 'heavy' ? 4.5 : (damageType === 'pierce' ? 2.5 : 1.8));
    target.vx = (kx / kl) * kb;
    target.vy = (ky / kl) * kb;
  }

  EventBus.emit('combat:enemy_hit', { enemy: target, amount: mitigatedAmount, damageType, isCrit, source, isStaggered });

  // Life steal check from Vampiric Touch talent
  const siphonRank = (GameState.TALENTS && GameState.TALENTS.siphon) || 0;
  if (siphonRank > 0 && Math.random() < siphonRank * 0.05) {
    HealthSystem.healPlayer(1);
  }

  if (target.hp <= 0) {
    killEnemy(target);
    const activeW = WeaponInventory.getActiveWeapon();
    SanitySystem.onEnemyKill(target, activeW);
  }

  return true;
}

export function killEnemy(e) {
  if (!e || !e.alive) return;
  e.alive = false;
  e.hp = 0;
  e.dAnim = 0.45;

  const { P } = GameState;
  P.killed = (P.killed || 0) + 1;

  // Track kill for bestiary
  if (e.type && GameState.BESTIARY_KILLS[e.type] !== undefined) {
    GameState.BESTIARY_KILLS[e.type]++;
  }

  // Relic kill trigger
  RelicSystem.onEnemyKill();

  // Achievement: First Blood
  if (P.killed === 1) {
    AchievementSystem.unlock('first_blood');
  }

  // Spawn soul orb with floor and enemy role scaling
  const lv = GameState.LV || 1;
  let soulCount = 1;
  if (e.isMiniBoss) {
    soulCount = lv >= 7 ? 16 : 10;
  } else if (e.isElite || e.elite) {
    soulCount = lv <= 3 ? 8 : (lv <= 6 ? 10 : (lv <= 9 ? 12 : 15));
  } else if (e.type === 'demon') {
    soulCount = lv <= 4 ? 3 : (lv <= 7 ? 4 : 5);
  } else if (e.type === 'wraith') {
    soulCount = lv <= 5 ? 4 : (lv <= 8 ? 5 : 6);
  } else if (e.type === 'ghoul') {
    soulCount = lv >= 5 ? 3 : 2;
  } else {
    // skeleton
    soulCount = lv >= 6 ? 2 : 1;
  }

  GameState.ITEMS.push({
    x: e.x,
    y: e.y,
    kind: 'soul',
    val: soulCount,
    life: 0,
    ph: Math.random() * 6.28
  });

  // Random item drop chance (potion / draught)
  if (Math.random() < 0.18) {
    const isHp = Math.random() < 0.55;
    GameState.ITEMS.push({
      x: e.x + (Math.random() - 0.5) * 0.4,
      y: e.y + (Math.random() - 0.5) * 0.4,
      kind: isHp ? 'health' : 'sanity',
      ph: Math.random() * 6.28
    });
  }

  SoundManager.snd('enemy_death');
  EventBus.emit('combat:enemy_killed', e);
}

export function damageBoss(amount, isCrit = false, damageType = 'melee', source = null) {
  const { BOSS } = GameState;
  if (!BOSS || !BOSS.alive || BOSS.defeatPending) return;

  BOSS.hp = Math.max(0, BOSS.hp - amount);

  if (isCrit) {
    BOSS.hitFlash = 0.35;
    triggerHitStop(0.08);
    GameState.CAM.shk = Math.max(GameState.CAM.shk, 14);
    ParticleRenderer.spawnP(BOSS.x, BOSS.y, 22, { col: '#facc15', spd: 2.2, r: 4, star: true });
    ParticleRenderer.spawnRing(BOSS.x, BOSS.y, '#fef08a');
    ParticleRenderer.showFloatingText('CRIT! ' + amount, BOSS.x, BOSS.y, '#facc15', 18, true);
    SoundManager.snd('talent_unlock');
  } else if (damageType === 'heavy') {
    BOSS.hitFlash = 0.30;
    triggerHitStop(0.09);
    GameState.CAM.shk = Math.max(GameState.CAM.shk, 16);
    ParticleRenderer.spawnP(BOSS.x, BOSS.y, 18, { col: '#fb923c', spd: 1.8, r: 3.5 });
    ParticleRenderer.spawnRing(BOSS.x, BOSS.y, '#fb923c');
    ParticleRenderer.showFloatingText(String(amount), BOSS.x, BOSS.y, '#f97316', 15, false);
    SoundManager.snd('melee_hit');
    SoundManager.snd('shockwave');
  } else {
    BOSS.hitFlash = 0.22;
    triggerHitStop(0.05);
    GameState.CAM.shk = Math.max(GameState.CAM.shk, 7);
    ParticleRenderer.spawnP(BOSS.x, BOSS.y, 8, { col: '#fde68a', spd: 1.0, r: 2.5 });
    ParticleRenderer.showFloatingText(String(amount), BOSS.x, BOSS.y, '#f1f5f9', 13, false);
    SoundManager.snd('melee_hit');
  }

  EventBus.emit('combat:boss_damaged', { boss: BOSS, amount, hp: BOSS.hp, isCrit, damageType });

  if (BOSS.hp <= 0) {
    if (!BOSS._soulsAwarded) {
      BOSS._soulsAwarded = true;
      let bossSouls = 60;
      if (BOSS.id === 'abyss_warden') bossSouls = 400;
      else if (BOSS.id === 'malakor') bossSouls = 150;
      else if (BOSS.id === 'gorgaroth') bossSouls = 60;
      ProgressionSystem.addSouls(bossSouls);
      ParticleRenderer.showFloatingText(`+${bossSouls} SOULS`, BOSS.x, BOSS.y, '#c084fc', 20, true);
      SoundManager.snd('talent_unlock');
      EventBus.emit('combat:boss_souls_awarded', { bossId: BOSS.id, souls: bossSouls });
    }

    if (BOSS.id === 'abyss_warden') {
      BOSS.hp = 0;
      if (GameState.BESTIARY_KILLS) {
        GameState.BESTIARY_KILLS.warden = (GameState.BESTIARY_KILLS.warden || 0) + 1;
        SaveSystem.saveBestiary();
      }
      SaveSystem.unlockMemory('memory_warden');
      SaveSystem.unlockLore('floor_10_warden');
      SaveSystem.unlockLore('crown');
      WardenDefeatCinematic.start(BOSS, {
        weapon: GameState.P ? (GameState.P.activeWeapon || GameState.P.equippedWeapon || 'sword') : 'sword',
        damageType,
        isCrit
      });
    } else if (BOSS.id === 'gorgaroth') {
      BOSS.hp = 0;
      if (GameState.BESTIARY_KILLS) {
        GameState.BESTIARY_KILLS.gorgaroth = (GameState.BESTIARY_KILLS.gorgaroth || 0) + 1;
        SaveSystem.saveBestiary();
      }
      SaveSystem.unlockMemory('memory_gorgaroth');
      SaveSystem.unlockLore('floor_3_iron');
      GorgarothCinematics.startDefeat(BOSS, {
        weapon: GameState.P ? (GameState.P.activeWeapon || GameState.P.equippedWeapon || 'sword') : 'sword',
        damageType,
        isCrit
      });
    } else {
      // Malakor's resolution belongs to BossManager/BossIntros. Marking him
      // dead here used to skip that lifecycle entirely, leaving a portal and
      // encounter state out of sync. The manager consumes this one-shot flag
      // on the next simulation tick and starts the existing defeat sequence.
      BOSS.hp = 0;
      BOSS.defeatPending = true;
      BOSS.vx = 0;
      BOSS.vy = 0;
      BOSS.attacks = [];
      BOSS.slamWarning = null;
      GameState.BOSS_AI_ACTIVE = false;
      GameState.BOSS_PROJECTILES = [];
      GameState.BOSS_HAZARDS = [];
      if (GameState.BESTIARY_KILLS) {
        GameState.BESTIARY_KILLS.malakor = (GameState.BESTIARY_KILLS.malakor || 0) + 1;
        SaveSystem.saveBestiary();
      }
      SaveSystem.unlockMemory('memory_malakor');
      SaveSystem.unlockLore('floor_6_void');
      SoundManager.snd('boss_roar');
    }
  }
}

export const DamageSystem = {
  dealDamage,
  killEnemy,
  damageBoss,
  getNextAttackId
};

// Global shims for regression testing & window access
if (typeof window !== 'undefined') {
  window.dealDamage = dealDamage;
  window.killEnemy = killEnemy;
  window.damageBoss = damageBoss;
  window.SWING_COUNTER = SWING_COUNTER;
  window.playerTakeDamage = (amt) => HealthSystem.damagePlayer(amt);
}
