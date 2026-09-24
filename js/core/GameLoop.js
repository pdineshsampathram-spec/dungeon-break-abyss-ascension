// =====================================================================
//  DUNGEON BREAK — js/core/GameLoop.js
//  Authoritative Single Game Loop: Delta-Time, Updates, & Render Passes
// =====================================================================

import { GameState, GameStates } from './GameState.js';
import { Camera } from '../rendering/Camera.js';
import { Renderer } from '../rendering/Renderer.js';
import { UIManager } from '../ui/UIManager.js';
import { PlayerController } from '../player/PlayerController.js';
import { ProjectileSystem } from '../combat/ProjectileSystem.js';
import { EnemyManager } from '../enemies/EnemyManager.js';
import { BossManager } from '../bosses/BossManager.js';
import { ParticleRenderer } from '../rendering/ParticleRenderer.js';
import { SanitySystem } from '../systems/SanitySystem.js';
import { Interactables } from '../world/Interactables.js';
import { solidAt } from '../world/PathValidator.js';
import { Portal } from '../world/Portal.js';
import { PortalTransition } from '../cinematics/PortalTransition.js';
import { BossIntros } from '../cinematics/BossIntros.js';
import { CinematicDirector } from '../cinematics/CinematicDirector.js';
import { MainMenuScene } from '../cinematics/MainMenuScene.js';
import { HIT_STOP_TIMER, tickHitStop } from '../combat/HitStop.js';
import { tickCinematicBanner } from '../ui/HUD.js';

let _rafId = null;
let _lastTime = 0;
let _running = false;

export const GameLoop = {
  start(ctx) {
    if (_running) return;
    _running = true;
    _lastTime = performance.now();
    PortalTransition.init();

    const frame = (now) => {
      if (!_running) return;
      _rafId = requestAnimationFrame(frame);

      const rawDt = (now - _lastTime) / 1000;
      _lastTime = now;

      // Clamp delta time to avoid frame skips / teleportation
      const dt = Math.max(0.001, Math.min(0.05, rawDt));

      this.update(dt);
      this.render(ctx, dt);
    };

    _rafId = requestAnimationFrame(frame);
  },

  stop() {
    _running = false;
    if (_rafId) {
      cancelAnimationFrame(_rafId);
      _rafId = null;
    }
  },

  isRunning() {
    return _running;
  },

  update(dt) {
    // Master frame counter
    GameState.F = (GameState.F || 0) + 1;

    // Hit-Stop Micro Freeze
    tickHitStop(dt);
    if (HIT_STOP_TIMER > 0) {
      // During hitstop, only update camera shake
      Camera.update(dt);
      return;
    }

    // Apply speed multiplier for gameplay systems
    const speed = GameState.GAME_SPEED || 1.0;
    const gameDt = dt * speed;
    GameState.DT = gameDt;

    // Update camera
    Camera.update(gameDt);

    // State-specific updates
    switch (GameState.STATE) {
      case GameStates.PLAYING:
        PlayerController.tickPlayer(gameDt);
        Interactables.tickTraps(gameDt);
        Interactables.collectAllies();
        ProjectileSystem.tick(gameDt, solidAt);
        EnemyManager.tick(gameDt);
        BossManager.tick(gameDt);
        ParticleRenderer.tick(gameDt);
        SanitySystem.tick(gameDt);
        Portal.checkExit();
        PortalTransition.tick(dt);
        BossIntros.tick(dt);
        tickCinematicBanner(dt);
        break;

      case GameStates.TITLE:
        MainMenuScene.tick(dt);
        break;

      case GameStates.CINEMATIC:
        CinematicDirector.tick(dt);
        break;

      case GameStates.BOSS_INTRO:
        BossIntros.tick(dt);
        break;

      default:
        break;
    }
  },

  render(ctx, dt) {
    if (!ctx) return;
    Renderer.render(ctx);
    UIManager.renderUI(ctx, dt);
  }
};
