// =====================================================================
//  DUNGEON BREAK — js/bosses/Malakor.js
//  Floor 6: Malakor, The Void Sorcerer
// =====================================================================

import { GameState } from '../core/GameState.js';
import { BOSS_CONFIGS } from '../data/bosses.js';
import { SoundManager } from '../audio/AudioManager.js';
import { ParticleRenderer } from '../rendering/ParticleRenderer.js';
import { solidAt } from '../world/PathValidator.js';
import { TARGET_FPS } from '../core/Constants.js';
import { dealDamage } from '../combat/DamageSystem.js';

let _malakorAttackId = 6000;

export const VOID_ENCOUNTER_CONFIG = {
  teleportWindup: 0.62,
  teleportArrival: 0.42,
  teleportRecovery: 0.95,
  teleportDelay: [4.4, 6.2],
  phaseTwoTeleportDelay: [3.2, 4.45],
  phaseThreeTeleportDelay: [2.8, 3.65],
  phaseThreeRecovery: 0.64,
  minTeleportDistanceFromPlayer: 3.75,
  pressureWarning: 1.15,
  pressureDuration: 4.25,
  pressureCooldown: 6.2,
  pressureRadius: 2.65
};

const randomBetween = ([min, max]) => min + Math.random() * (max - min);
const arena = () => {
  const room = GameState.ROOMS && GameState.ROOMS[0];
  return room && room.type === 'malakor_arena' ? room : null;
};

function isValidTeleportDestination(x, y, boss, player) {
  const room = arena();
  if (!room || x < room.x + 1.5 || x > room.x + room.w - 2.5 ||
      y < room.y + 1.5 || y > room.y + room.h - 2.5 || solidAt(x, y)) return false;
  if (Math.hypot(x - player.x, y - player.y) < VOID_ENCOUNTER_CONFIG.minTeleportDistanceFromPlayer) return false;
  const safeAreas = room.voidSafeAreas || (room.voidSafeArea ? [room.voidSafeArea] : []);
  if (safeAreas.some(safe => Math.hypot(x - safe.x, y - safe.y) < safe.r + 1.2)) return false;
  const zone = boss.voidPressureZone;
  return !zone || zone.state === 'expired' || Math.hypot(x - zone.x, y - zone.y) >= zone.r + 1;
}

function findTeleportDestination(boss, player) {
  const room = arena();
  if (!room) return null;
  const baseAngle = Math.atan2(boss.y - player.y, boss.x - player.x);
  for (let i = 0; i < 18; i++) {
    const angle = baseAngle + (Math.random() - 0.5) * 1.9;
    const distance = 5.2 + Math.random() * 2.8;
    const x = player.x + Math.cos(angle) * distance;
    const y = player.y + Math.sin(angle) * distance;
    if (isValidTeleportDestination(x, y, boss, player)) return { x, y };
  }
  // Deterministic fallback: pillars never turn a blink into an unsafe spawn.
  for (let y = room.y + 2; y < room.y + room.h - 2; y += 2) {
    for (let x = room.x + 2; x < room.x + room.w - 2; x += 2) {
      if (isValidTeleportDestination(x, y, boss, player)) return { x, y };
    }
  }
  // Safe bounded arena fallback: guaranteed non-solid and separated from player
  const cx = room.cx || (room.x + Math.floor(room.w / 2));
  const cy = room.cy || (room.y + Math.floor(room.h / 2));
  const fallbacks = [
    { x: cx, y: cy - 4 },
    { x: cx, y: cy - 2 },
    { x: cx - 4, y: cy },
    { x: cx + 4, y: cy },
    { x: cx, y: cy + 2 },
    { x: cx, y: cy }
  ];
  for (let i = 0; i < fallbacks.length; i++) {
    const f = fallbacks[i];
    if (!solidAt(f.x, f.y) && Math.hypot(f.x - player.x, f.y - player.y) >= 2.5) {
      return f;
    }
  }
  return { x: cx, y: cy };
}

function beginTeleport(boss) {
  if (boss.teleportState) return; // Idempotent: Never trigger duplicate concurrent teleports
  const delay = boss.phase === 3 ? VOID_ENCOUNTER_CONFIG.phaseThreeTeleportDelay
    : boss.phase === 2 ? VOID_ENCOUNTER_CONFIG.phaseTwoTeleportDelay
      : VOID_ENCOUNTER_CONFIG.teleportDelay;
  boss.teleportC = randomBetween(delay);
  boss.teleportState = 'windup';
  boss.teleportTimer = VOID_ENCOUNTER_CONFIG.teleportWindup;
  boss.vx = 0;
  boss.vy = 0;
  // Authoritative destination chosen upfront for clear, transient telegraphing
  boss.teleportDest = findTeleportDestination(boss, GameState.P);
  ParticleRenderer.spawnP(boss.x, boss.y, 10, { col: '#c084fc', spd: 0.75, r: 2.3 });
  if (boss.teleportDest) {
    // Arrival destination telegraph indicator (allows tactical repositioning)
    ParticleRenderer.spawnRing(boss.teleportDest.x, boss.teleportDest.y, '#e879f9');
    ParticleRenderer.spawnP(boss.teleportDest.x, boss.teleportDest.y, 8, { col: '#e879f9', spd: 0.45, r: 2.2 });
  }
  SoundManager.snd('void_swell');
}

function spawnBossProjectile(boss, angle, speed, attackId) {
  // Spawn beyond Malakor's body while retaining the readable violet orb.
  const x = boss.x + Math.cos(angle) * 1.05;
  const y = boss.y + Math.sin(angle) * 1.05;
  if (solidAt(x, y, GameState.MAP, true) || Math.hypot(x - GameState.P.x, y - GameState.P.y) < 0.85) return;
  GameState.PROJECTILES.push({
    x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
    life: 0, maxLife: 4.2, damage: 3, fromPlayer: false, hit: false,
    isBoss: true, col: '#c084fc', attackId,
    // Calibrated Void orb sanity damage: 4.0 to 6.0 based on phase
    sanityDamage: boss.phase >= 3 ? 6.0 : (boss.phase === 2 ? 5.0 : 4.0)
  });
}

function fireVolley(boss, player) {
  const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
  const attackId = ++_malakorAttackId;
  const pattern = boss.volleyIndex++ % (boss.phase === 3 ? 4 : 3);
  if (pattern === 0) {
    [-0.34, 0, 0.34].forEach(offset => spawnBossProjectile(boss, angle + offset, 7.8, attackId));
  } else if (pattern === 1) {
    [-0.16, 0, 0.16].forEach(offset => spawnBossProjectile(boss, angle + offset, 8.8, attackId));
  } else {
    if (boss.phase === 3) {
      // Final phase: dense volley with clear double escape lanes
      [-0.68, -0.38, -0.08, 0.36, 0.66].forEach(offset => spawnBossProjectile(boss, angle + offset, 8.1, attackId));
    } else {
      // Asymmetry deliberately leaves a readable escape lane.
      [-0.52, -0.24, 0.10, 0.36].forEach(offset => spawnBossProjectile(boss, angle + offset, 7.4, attackId));
    }
  }
  boss.lastVolleyAt = boss.combatTime;
  boss.isChargingVolley = false;
  boss.projC = boss.phase === 3 ? 1.65 : boss.phase === 2 ? 2.15 : 2.75;
  SoundManager.snd('shockwave');
  ParticleRenderer.spawnP(boss.x, boss.y, 8, { col: '#a855f7', spd: 1.2, r: 2.5 });
}

function spawnArrivalNova(boss) {
  const attackId = ++_malakorAttackId;
  const laneAngle = Math.atan2(GameState.P.y - boss.y, GameState.P.x - boss.x) + Math.PI * 0.5;
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;
    if (Math.abs(Math.atan2(Math.sin(angle - laneAngle), Math.cos(angle - laneAngle))) < 0.52) continue;
    spawnBossProjectile(boss, angle, 6.25, attackId);
  }
}

function spawnPhaseThreeSingularity(boss) {
  const attackId = ++_malakorAttackId;
  GameState.CAM.shk = 18;
  SoundManager.snd('shockwave');
  SoundManager.snd('boss_roar');
  ParticleRenderer.spawnRing(boss.x, boss.y, '#c084fc');
  ParticleRenderer.spawnP(boss.x, boss.y, 24, { col: '#a855f7', spd: 2.5, r: 3.5 });
  const dist = Math.hypot(GameState.P.x - boss.x, GameState.P.y - boss.y);
  if (dist <= 2.5) {
    dealDamage({ isBoss: true, attackId, x: boss.x, y: boss.y }, GameState.P, 8, 'heavy');
  }
  spawnArrivalNova(boss);
}

function updateTeleport(boss, dt) {
  if (!boss.teleportState) return false;
  boss.teleportTimer -= dt;
  if (boss.teleportState === 'windup') {
    boss.teleportAlpha = Math.max(0.12, boss.teleportTimer / VOID_ENCOUNTER_CONFIG.teleportWindup);
    if (boss.teleportTimer <= 0) {
      ParticleRenderer.spawnP(boss.x, boss.y, 14, { col: '#e879f9', spd: 1.6, r: 3 });
      if (boss.teleportDest) {
        boss.x = boss.teleportDest.x;
        boss.y = boss.teleportDest.y;
      }
      boss.teleportDest = null;
      boss.vx = 0;
      boss.vy = 0;
      boss.teleportState = 'arrival';
      boss.teleportTimer = VOID_ENCOUNTER_CONFIG.teleportArrival;
      boss.teleportAlpha = 0.18;
      ParticleRenderer.spawnP(boss.x, boss.y, 16, { col: '#c084fc', spd: 1.5, r: 3 });
      SoundManager.snd('shockwave');
    }
    return true;
  }
  boss.teleportAlpha = Math.min(1, 1 - boss.teleportTimer / VOID_ENCOUNTER_CONFIG.teleportArrival);
  if (boss.teleportTimer <= 0) {
    boss.teleportState = null;
    boss.teleportDest = null;
    boss.teleportAlpha = 1;
    boss.vulnTimer = boss.phase === 3
      ? VOID_ENCOUNTER_CONFIG.phaseThreeRecovery
      : VOID_ENCOUNTER_CONFIG.teleportRecovery;
    if (boss.phase === 3) spawnPhaseThreeSingularity(boss);
    else if (boss.phase === 2) spawnArrivalNova(boss);
  }
  return true;
}

function findPressureZone(boss) {
  const room = arena();
  const player = GameState.P;
  if (!room) return null;
  for (let i = 0; i < 16; i++) {
    const x = room.x + 2 + Math.random() * (room.w - 4);
    const y = room.y + 2 + Math.random() * (room.h - 4);
    const safeAreas = room.voidSafeAreas || (room.voidSafeArea ? [room.voidSafeArea] : []);
    if (solidAt(x, y) || Math.hypot(x - player.x, y - player.y) < 2.1 ||
        Math.hypot(x - boss.x, y - boss.y) < 1.8 ||
        safeAreas.some(safe => Math.hypot(x - safe.x, y - safe.y) < safe.r + VOID_ENCOUNTER_CONFIG.pressureRadius + 0.8)) continue;
    return { x, y };
  }
  return null;
}

function updatePressureZone(boss, dt) {
  const zone = boss.voidPressureZone;
  if (zone) {
    zone.timer -= dt;
    if (zone.state === 'warning' && zone.timer <= 0) {
      zone.state = 'active';
      zone.timer = VOID_ENCOUNTER_CONFIG.pressureDuration;
      zone.attackId = ++_malakorAttackId;
      ParticleRenderer.spawnRing(zone.x, zone.y, '#c084fc');
      SoundManager.snd('void_swell');
      if (GameState.P && Math.hypot(GameState.P.x - zone.x, GameState.P.y - zone.y) <= zone.r) {
        dealDamage({ isBoss: true, attackId: zone.attackId, x: zone.x, y: zone.y }, GameState.P, 5, 'heavy');
      }
    } else if (zone.state === 'active' && zone.timer <= 0) {
      boss.voidPressureZone = null;
      boss.voidZoneC = boss.phase === 3 ? 4.8 : VOID_ENCOUNTER_CONFIG.pressureCooldown;
    }
    return;
  }
  boss.voidZoneC -= dt;
  if (boss.voidZoneC > 0 || boss.teleportState || boss.vulnTimer > 0 || boss.combatTime - boss.lastVolleyAt < 0.45) return;
  const destination = findPressureZone(boss);
  if (!destination) return;
  boss.voidPressureZone = {
    ...destination, r: VOID_ENCOUNTER_CONFIG.pressureRadius,
    state: 'warning', timer: VOID_ENCOUNTER_CONFIG.pressureWarning
  };
  ParticleRenderer.spawnP(destination.x, destination.y, 9, { col: '#e879f9', spd: 0.55, r: 2 });
}

export const Malakor = {
  config: BOSS_CONFIGS.malakor,

  tick(boss, dt) {
    if (!boss || !boss.alive) return;
    const { P } = GameState;
    boss.combatTime = (boss.combatTime || 0) + dt;
    boss.volleyIndex = boss.volleyIndex || 0;
    boss.lastVolleyAt = boss.lastVolleyAt === undefined ? -99 : boss.lastVolleyAt;
    // Give Rowan an opening read before the first blink; later blinks retain
    // their controlled timing variation through teleportC.
    boss.lastTeleportAt = boss.lastTeleportAt === undefined ? boss.combatTime : boss.lastTeleportAt;
    boss.voidZoneC = boss.voidZoneC === undefined ? 5.2 : boss.voidZoneC;
    boss.teleportAlpha = boss.teleportAlpha === undefined ? 1 : boss.teleportAlpha;
    // Existing runs may hold a boss object created before this encounter
    // upgrade. Normalise its timer so undefined cannot silently disable every
    // attack gate (undefined <= 0 is false in JavaScript).
    boss.vulnTimer = Number.isFinite(boss.vulnTimer) ? boss.vulnTimer : 0;

    const dx = P.x - boss.x;
    const dy = P.y - boss.y;
    const dist = Math.hypot(dx, dy) || 1;
    const previousPhase = boss.phase;
    const healthRatio = boss.hp / boss.maxHp;
    boss.phase = healthRatio <= 0.25 ? 3 : healthRatio <= 0.5 ? 2 : 1;
    if (boss.phase > previousPhase) {
      GameState.CAM.shk = 16;
      SoundManager.snd('boss_roar');
      ParticleRenderer.spawnRing(boss.x, boss.y, '#a855f7');
      ParticleRenderer.spawnP(boss.x, boss.y, 22, { col: '#c084fc', spd: 2, r: 3.5 });
    }

    if (boss.teleportC > 0) boss.teleportC -= dt;
    if (boss.vulnTimer > 0) boss.vulnTimer = Math.max(0, boss.vulnTimer - dt);
    updatePressureZone(boss, dt);
    if (updateTeleport(boss, dt)) return;

    // Telegraph cue before releasing projectile volley
    if (boss.projC <= 0.35 && boss.projC > 0 && boss.vulnTimer <= 0) {
      boss.isChargingVolley = true;
    } else if (boss.projC > 0.35 || boss.vulnTimer > 0) {
      boss.isChargingVolley = false;
    }

    if (boss.vulnTimer <= 0) {
      const moveScale = boss.isChargingVolley ? 0.35 : 1.0;
      if (dist < 4) {
        boss.vx -= (dx / dist) * 1.4 * 0.15 * dt * TARGET_FPS * moveScale;
        boss.vy -= (dy / dist) * 1.4 * 0.15 * dt * TARGET_FPS * moveScale;
      } else if (dist > 7) {
        boss.vx += (dx / dist) * 1.4 * 0.15 * dt * TARGET_FPS * moveScale;
        boss.vy += (dy / dist) * 1.4 * 0.15 * dt * TARGET_FPS * moveScale;
      }
    }

    if (boss.projC <= 0 && boss.vulnTimer <= 0) fireVolley(boss, P);
    if (boss.teleportC <= 0 && boss.vulnTimer <= 0 && (dist < 3.1 || boss.combatTime - boss.lastTeleportAt > 6.5)) {
      boss.lastTeleportAt = boss.combatTime;
      beginTeleport(boss);
    }
  }
};
