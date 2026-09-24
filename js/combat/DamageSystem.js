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
import { EventBus } from '../core/EventBus.js';

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
      if (P._hitByAttacks[source.attackId]) return false;
      P._hitByAttacks[source.attackId] = true;
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

  // Target is Boss
  if (target.isBoss || target === BOSS) {
    damageBoss(amount);
    return true;
  }

  // Regular Enemy
  target.hp = Math.max(0, target.hp - amount);
  target.hitFlash = 0.22;

  // Knockback
  if (source && source.x !== undefined) {
    const kx = target.x - source.x;
    const ky = target.y - source.y;
    const kl = Math.hypot(kx, ky) || 1;
    const kb = damageType === 'heavy' ? 4.5 : (damageType === 'pierce' ? 2.5 : 1.8);
    target.vx = (kx / kl) * kb;
    target.vy = (ky / kl) * kb;
  }

  SoundManager.snd('melee_hit');
  EventBus.emit('combat:enemy_hit', { enemy: target, amount, damageType, source });

  // Life steal check from Vampiric Touch talent
  const siphonRank = (GameState.TALENTS && GameState.TALENTS.siphon) || 0;
  if (siphonRank > 0 && Math.random() < siphonRank * 0.05) {
    HealthSystem.healPlayer(1);
  }

  if (target.hp <= 0) {
    killEnemy(target);
    const activeW = WeaponInventory.getActiveWeapon();
    const sg = activeW ? (activeW.id === 'axe' ? 5 : (activeW.id === 'dagger' ? 2 : 4)) : 3;
    P.san = Math.min(100, P.san + sg);
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

  // Spawn soul orb
  const soulCount = e.isMiniBoss ? 8 : (e.type === 'demon' || e.type === 'wraith') ? 2 : 1;
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

export function damageBoss(amount) {
  const { BOSS } = GameState;
  if (!BOSS || !BOSS.alive) return;

  BOSS.hp = Math.max(0, BOSS.hp - amount);
  BOSS.hitFlash = 0.22;
  triggerHitStop(0.05);

  SoundManager.snd('melee_hit');
  EventBus.emit('combat:boss_damaged', { boss: BOSS, amount, hp: BOSS.hp });

  if (BOSS.hp <= 0) {
    BOSS.alive = false;
    BOSS.hp = 0;
    GameState.BOSS_DEAD = true;
    GameState.BOSS_PORTAL_UNLOCKED = true;
    SoundManager.snd('boss_roar');
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
