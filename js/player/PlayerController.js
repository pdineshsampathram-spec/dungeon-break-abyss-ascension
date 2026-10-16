// =====================================================================
//  DUNGEON BREAK — js/player/PlayerController.js
//  Authoritative Player Movement, Velocity, & Collision Resolution
// =====================================================================

import { GameState } from '../core/GameState.js';
import { getMovementVector } from '../core/InputManager.js';
import { solidAt } from '../world/PathValidator.js';
import { HealthSystem } from '../systems/HealthSystem.js';
import { LootSystem } from '../systems/LootSystem.js';
import { SoundManager } from '../audio/AudioManager.js';

export const PlayerController = {
  tickPlayer(dt) {
    const { P } = GameState;
    if (P.dead || P.dying || GameState.STATE !== 'playing' || (typeof window !== 'undefined' && window.ShatteredMindCinematic && window.ShatteredMindCinematic.isActive())) return;

    // Movement from keyboard or touch joystick
    const { dx: inX, dy: inY, mag } = getMovementVector();

    let dx = 0;
    let dy = 0;

    if (mag > 0.05) {
      const spdMult = P.hasteBuffTimer > 0 ? 1.35 : 1.0;
      dx = inX * P.spd * spdMult * dt;
      dy = inY * P.spd * spdMult * dt;

      // Update facing direction
      if (Math.abs(dx) > Math.abs(dy)) {
        P.fx = dx > 0 ? 1 : -1;
        P.fy = 0;
      } else {
        P.fx = 0;
        P.fy = dy > 0 ? 1 : -1;
      }

      // Stepped collision detection
      const { movedX, movedY } = movePlayerWithCollision(dx, dy, 0.2);
      P.vx = dt > 0 ? movedX / dt : 0;
      P.vy = dt > 0 ? movedY / dt : 0;
    } else {
      P.vx = 0;
      P.vy = 0;
    }

    ensurePlayerInBounds();

    // Tick health and combat cooldowns
    HealthSystem.tick(dt);

    if (P.acd > 0) P.acd = Math.max(0, P.acd - dt * (P.hasteBuffTimer > 0 ? 1.4 : 1.0));
    if (P.aanim > 0) P.aanim = Math.max(0, P.aanim - dt);
    if (P.dcd > 0) P.dcd = Math.max(0, P.dcd - dt);
    if (P.qCooldown > 0) P.qCooldown = Math.max(0, P.qCooldown - dt);
    if (P.furyBuffTimer > 0) P.furyBuffTimer = Math.max(0, P.furyBuffTimer - dt);
    if (P.mindShieldTimer > 0) P.mindShieldTimer = Math.max(0, P.mindShieldTimer - dt);
    if (P.hasteBuffTimer > 0) P.hasteBuffTimer = Math.max(0, P.hasteBuffTimer - dt);

    // Dynamic damage multiplier based on buffs
    P.dmgBoost = P.furyBuffTimer > 0 ? 1.5 : 1.0;

    if (P.attackPhaseTimer > 0) {
      P.attackPhaseTimer = Math.max(0, P.attackPhaseTimer - dt);
      if (P.attackPhaseTimer <= 0) {
        P.attackPhase = 'idle';
      }
    }

    // Level timer
    GameState.LEVEL_TIMER += dt;
    const secs = Math.floor(GameState.LEVEL_TIMER);
    GameState.LEVEL_TIME_STR =
      String(Math.floor(secs / 60)).padStart(2, '0') + ':' +
      String(secs % 60).padStart(2, '0');

    // Heartbeat for low sanity
    SoundManager.tickHeartbeat(dt);

    // Pickups and interactions
    LootSystem.collectItems();

    // Procedural animation cycle update
    this.tickAnimation(dt);
  },

  tickAnimation(dt) {
    const { P } = GameState;
    P.breathCycle = (P.breathCycle || 0) + dt * 1.4;

    const isMoving = Math.hypot(P.vx, P.vy) > 0.01;

    if (P.dead) {
      P.animState = 'death';
    } else if (P.aanim > 0) {
      P.animState = 'attack';
    } else if (P.hitFlash > 0) {
      P.animState = 'hurt';
    } else if (isMoving) {
      P.animState = 'walk';
      P.walkCycle = (P.walkCycle || 0) + dt * 8.0;
    } else {
      P.animState = 'idle';
    }
    P.animTimer = (P.animTimer || 0) + dt;
  }
};

export function ensurePlayerInBounds() {
  const { P } = GameState;
  if (!P || !solidAt(P.x, P.y)) return;

  // Search expanding radial rings for closest walkable position
  const searchDistances = [0.15, 0.3, 0.5, 0.75, 1.0, 1.5, 2.0, 2.5];
  const angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (-3 * Math.PI) / 4, -Math.PI / 2, -Math.PI / 4];

  for (const d of searchDistances) {
    for (const a of angles) {
      const testX = P.x + Math.cos(a) * d;
      const testY = P.y + Math.sin(a) * d;
      if (!solidAt(testX, testY)) {
        P.x = testX;
        P.y = testY;
        return;
      }
    }
  }
}

export function movePlayerWithCollision(dx, dy, stepSize = 0.25) {
  const { P } = GameState;
  if (!P) return { movedX: 0, movedY: 0, hitWall: false };

  const dist = Math.hypot(dx, dy);
  if (dist < 0.0001) return { movedX: 0, movedY: 0, hitWall: false };

  const steps = Math.max(1, Math.ceil(dist / stepSize));
  const stepDx = dx / steps;
  const stepDy = dy / steps;
  let totalMovedX = 0;
  let totalMovedY = 0;
  let hitWall = false;

  for (let i = 0; i < steps; i++) {
    let movedThisStep = false;

    // Check X-axis movement
    if (!solidAt(P.x + stepDx, P.y)) {
      P.x += stepDx;
      totalMovedX += stepDx;
      movedThisStep = true;
    } else {
      hitWall = true;
    }

    // Check Y-axis movement
    if (!solidAt(P.x, P.y + stepDy)) {
      P.y += stepDy;
      totalMovedY += stepDy;
      movedThisStep = true;
    } else {
      hitWall = true;
    }

    // If completely blocked in both axes, stop stepping
    if (!movedThisStep) {
      break;
    }
  }

  ensurePlayerInBounds();
  return { movedX: totalMovedX, movedY: totalMovedY, hitWall };
}

PlayerController.movePlayerWithCollision = movePlayerWithCollision;
PlayerController.ensurePlayerInBounds = ensurePlayerInBounds;

export const tickPlayer = (dt) => PlayerController.tickPlayer(dt);

if (typeof window !== 'undefined') {
  window.tickPlayer = tickPlayer;
  window.movePlayerWithCollision = movePlayerWithCollision;
  window.ensurePlayerInBounds = ensurePlayerInBounds;
}

