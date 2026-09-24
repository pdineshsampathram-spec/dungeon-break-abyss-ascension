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
    if (P.dead) return;

    // Movement from keyboard or touch joystick
    const { dx: inX, dy: inY, mag } = getMovementVector();

    let dx = 0;
    let dy = 0;

    if (mag > 0.05) {
      dx = inX * P.spd * dt;
      dy = inY * P.spd * dt;

      // Update facing direction
      if (Math.abs(dx) > Math.abs(dy)) {
        P.fx = dx > 0 ? 1 : -1;
        P.fy = 0;
      } else {
        P.fx = 0;
        P.fy = dy > 0 ? 1 : -1;
      }

      // Axis-independent collision detection
      if (!solidAt(P.x + dx, P.y)) {
        P.x += dx;
      }
      if (!solidAt(P.x, P.y + dy)) {
        P.y += dy;
      }
    }

    P.vx = dt > 0 ? dx / dt : 0;
    P.vy = dt > 0 ? dy / dt : 0;

    // Tick health and combat cooldowns
    HealthSystem.tick(dt);

    if (P.acd > 0) P.acd = Math.max(0, P.acd - dt);
    if (P.aanim > 0) P.aanim = Math.max(0, P.aanim - dt);

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

export const tickPlayer = (dt) => PlayerController.tickPlayer(dt);

if (typeof window !== 'undefined') {
  window.tickPlayer = tickPlayer;
}
