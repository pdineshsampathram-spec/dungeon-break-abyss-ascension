// =====================================================================
//  DUNGEON BREAK — js/systems/SanitySystem.js
//  Authoritative Sanity Architecture & Environmental Darkness System
//  - Time-based continuous drain scaled with floor depth (0.25 to 1.15/s)
//  - Darkness multiplier: Torches protect sanity (0.0x / 0.15x), NEVER restore it
//  - Depth-diminishing kill returns (Floor 1: 1.0x -> Floor 10: 0.55x)
//  - One-shot idempotent death transition to Shattered Mind
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { EventBus } from '../core/EventBus.js';
import { requestDeath } from '../cinematics/DeathCinematics.js';
import { LightingRenderer } from '../rendering/LightingRenderer.js';
import { ShatteredMindCinematic } from '../cinematics/ShatteredMindCinematic.js';

// Part 23: Configurable Floor-Based Sanity Drain Table (Sanity Points / Second)
export const SANITY_FLOOR_DRAIN = {
  1: 0.25,
  2: 0.32,
  3: 0.40,
  4: 0.48,
  5: 0.57,
  6: 0.66,
  7: 0.76,
  8: 0.87,
  9: 1.00,
  10: 1.15
};

// Part 30: Starting Base Kill Rewards by Enemy Type
export const SANITY_KILL_REWARDS = {
  skeleton: 2.0,
  ghoul: 2.5,
  demon: 3.0,
  wraith: 3.0,
  elite: 4.0,
  mini_boss: 6.0,
  boss: 10.0
};

// Part 32: Deeper Floors Reduce Kill Sanity Reward Multiplier Table
export const SANITY_KILL_DEPTH_MULT = {
  1: 1.00,
  2: 0.95,
  3: 0.90,
  4: 0.85,
  5: 0.80,
  6: 0.75,
  7: 0.70,
  8: 0.65,
  9: 0.60,
  10: 0.55
};

// Part 35 & 36: Configurable Fixed Sanity Rewards
export const SANITY_REWARDS = {
  survivor: 8.0,
  flask: 12.0
};

// Floor 6 is deliberately a pressure encounter. These values are additional
// to the normal floor drain and are applied only by the authoritative sanity
// tick below, so an AI restart can never create a second drain loop.
// Floor 6 is deliberately a spatial challenge. These values are calibrated
// to create tense environmental pressure without causing an unavoidable sanity wipe.
export const VOID_ARENA_SANITY = {
  phaseOneDrain: 0.75,
  phaseTwoDrain: 1.05,
  phaseThreeDrain: 1.30,
  zoneDrain: 1.65,
  phaseThreeZoneDrain: 1.95,
  safeAreaMultiplier: 0.0
};

export function getBaseFloorDrain(lv) {
  const floor = Math.max(1, lv || 1);
  if (SANITY_FLOOR_DRAIN[floor] !== undefined) {
    return SANITY_FLOOR_DRAIN[floor];
  }
  // NG+ or deeper endless scaling
  return 1.15 + (floor - 10) * 0.15;
}

export const SanitySystem = {
  getBaseFloorDrain,

  getVoidArenaPressureAt(x, y) {
    const boss = GameState.BOSS;
    const room = GameState.ROOMS && GameState.ROOMS[0];
    if (GameState.LV !== 6 || !boss || boss.id !== 'malakor' || !boss.alive ||
        !GameState.BOSS_AI_ACTIVE || !room || room.type !== 'malakor_arena') {
      return { inArena: false, drain: 0, minimumTotalDrain: 0, inSafeArea: false, inPressureZone: false };
    }

    const inArena = x >= room.x && x <= room.x + room.w && y >= room.y && y <= room.y + room.h;
    if (!inArena) return { inArena: false, drain: 0, minimumTotalDrain: 0, inSafeArea: false, inPressureZone: false };

    const safeAreas = room.voidSafeAreas || (room.voidSafeArea ? [room.voidSafeArea] : []);
    const inSafeArea = safeAreas.some(safe => Math.hypot(x - safe.x, y - safe.y) <= safe.r);
    const zone = boss.voidPressureZone;
    const inPressureZone = !inSafeArea && !!zone && zone.state === 'active' &&
      Math.hypot(x - zone.x, y - zone.y) <= zone.r;

    const phaseDrain = boss.phase >= 3 ? VOID_ARENA_SANITY.phaseThreeDrain : (boss.phase === 2 ? VOID_ARENA_SANITY.phaseTwoDrain : VOID_ARENA_SANITY.phaseOneDrain);
    const minimumTotalDrain = inSafeArea ? 0 : (inPressureZone
      ? (boss.phase >= 3 ? VOID_ARENA_SANITY.phaseThreeZoneDrain : VOID_ARENA_SANITY.zoneDrain)
      : phaseDrain);
    return { inArena: true, drain: minimumTotalDrain, minimumTotalDrain, inSafeArea, inPressureZone };
  },

  /**
   * Continuous time-based sanity simulation tick (Part 21 & 41).
   * Calculates: baseFloorDrain * darknessMultiplier * mutationMultiplier * difficultyMultiplier
   */
  tick(dt) {
    const { P, LV, TALENTS } = GameState;
    if (!P || P.dead || P.dying || GameState.STATE !== GameStates.PLAYING) return;

    const lv = LV || 1;

    // 1. Base floor drain rate (Part 23)
    const baseFloorDrain = getBaseFloorDrain(lv);

    // 2. Environmental darkness multiplier from LightingRenderer (Part 24 & 42)
    // 0.0x in inner torchlight, 0.15x in outer torchlight, 1.0x normal, 1.25x-1.75x deep shadow
    const darknessMultiplier = LightingRenderer.getSanityProtectionAt(P.x, P.y);
    P.nearTorch = (darknessMultiplier <= 0.15);

    // 3. Floor mutation multiplier (Part 44)
    let mutationMultiplier = 1.0;
    if (GameState.CURRENT_MUTATION) {
      const mid = GameState.CURRENT_MUTATION.id;
      if (mid === 'haunted') mutationMultiplier = 1.20; // +20% haunted crypt
      else if (mid === 'eclipse') mutationMultiplier = 1.75; // +75% abyssal eclipse
      else if (mid === 'inferno') mutationMultiplier = 0.90; // slight reduction (bright fire)
    }

    // 4. Mind Sanctuary Talent & Legacy Echo Keeper reduction
    const clarityRank = (TALENTS && TALENTS.clarity) || 0;
    const legacySanityRank = (GameState.LEGACY_TALENTS && GameState.LEGACY_TALENTS.legacy_sanity) || 0;
    const talentReduction = clarityRank * 0.12 + legacySanityRank * 0.25;
    const difficultyMultiplier = Math.max(0.35, 1.0 - talentReduction);

    // 5. Central Sanity Formula (Part 45)
    // Note: Torches protect sanity (multiplier -> 0), they NEVER add sanity (Part 25 & 27).
    const normalDrainPerSecond = baseFloorDrain * darknessMultiplier * mutationMultiplier * difficultyMultiplier;
    const voidPressure = this.getVoidArenaPressureAt(P.x, P.y);
    P.inVoidSafeArea = voidPressure.inSafeArea;
    P.inVoidPressureZone = voidPressure.inPressureZone;

    let finalDrainPerSecond = normalDrainPerSecond;
    if (voidPressure.inArena) {
      if (voidPressure.inSafeArea) {
        // Safe Area strategic decision:
        // Passive Void-induced sanity drain pauses completely.
        // It does NOT restore lost sanity automatically.
        finalDrainPerSecond = 0;
      } else {
        // Outside Safe Area: Authoritative encounter pressure drain
        finalDrainPerSecond = Math.max(normalDrainPerSecond, voidPressure.minimumTotalDrain);
      }
    }

    // Smooth continuous delta-based depletion (Part 41)
    const maxSan = P.maxSan || 100;
    P.san = Math.max(0, Math.min(maxSan, P.san - finalDrainPerSecond * dt));
    if (P.san < 0.05) P.san = 0;

    // One-shot terminal sanity collapse (Shattered Mind Cinematic)
    if (P.san <= 0 && !P.dead && !P.dying && !ShatteredMindCinematic.isActive()) {
      requestDeath('shattered_mind', 'sanity');
    }
  },

  /**
   * Authoritative calculation for sanity restored on killing an enemy (Part 30, 31, 32).
   * Diminishes progressively with dungeon depth.
   */
  getKillGain(enemy, weapon) {
    const lv = GameState.LV || 1;

    let base = SANITY_KILL_REWARDS.skeleton;
    if (enemy) {
      if (enemy.isBoss) {
        base = SANITY_KILL_REWARDS.boss;
      } else if (enemy.isMiniBoss) {
        base = SANITY_KILL_REWARDS.mini_boss;
      } else if (enemy.isElite || enemy.elite) {
        base = SANITY_KILL_REWARDS.elite;
      } else if (enemy.type && SANITY_KILL_REWARDS[enemy.type] !== undefined) {
        base = SANITY_KILL_REWARDS[enemy.type];
      }
    }

    // Suffix bonus for 'insight' weapon affix
    if (weapon && weapon.affixes && weapon.affixes.some(a => a && a.id === 'insight')) {
      base += 1.0;
    }

    // Depth scaling: deeper floors reduce kill sanity reward (Part 32)
    const depthFactor = SANITY_KILL_DEPTH_MULT[lv] !== undefined
      ? SANITY_KILL_DEPTH_MULT[lv]
      : Math.max(0.35, 1.0 - (lv - 1) * 0.05);

    const finalGain = Math.max(0.2, Number((base * depthFactor).toFixed(2)));
    return finalGain;
  },

  onEnemyKill(enemy, weapon) {
    const gain = this.getKillGain(enemy, weapon);
    this.restore(gain);
    return gain;
  },

  restore(amount) {
    const { P } = GameState;
    if (!P || P.dead || P.dying) return;
    const maxSan = P.maxSan || 100;
    P.san = Math.min(maxSan, Math.max(0, P.san + amount));
    EventBus.emit('sanity:restore', { amount, current: P.san });
  },

  drain(amount) {
    const { P } = GameState;
    if (!P || P.dead || P.dying || ShatteredMindCinematic.isActive()) return;
    P.san = Math.max(0, Math.min(100, P.san - amount));
    if (P.san < 0.05) P.san = 0;
    EventBus.emit('sanity:drain', { amount, current: P.san });
    if (P.san <= 0 && !P.dead && !P.dying && !ShatteredMindCinematic.isActive()) {
      requestDeath('shattered_mind', 'sanity');
    }
  },

  triggerSanityDeath() {
    requestDeath('shattered_mind', 'sanity');
  }
};

if (typeof window !== 'undefined') {
  window.SanitySystem = SanitySystem;
  window.SANITY_FLOOR_DRAIN = SANITY_FLOOR_DRAIN;
  window.SANITY_KILL_REWARDS = SANITY_KILL_REWARDS;
  window.SANITY_KILL_DEPTH_MULT = SANITY_KILL_DEPTH_MULT;
  window.VOID_ARENA_SANITY = VOID_ARENA_SANITY;
}
