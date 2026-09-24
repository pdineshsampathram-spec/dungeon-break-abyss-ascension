// =====================================================================
//  DUNGEON BREAK — js/rendering/Renderer.js
//  Authoritative Master Graphics Pipeline & Depth-Sorted Rendering
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH } from '../core/Constants.js';
import { Camera } from './Camera.js';
import { WorldRenderer } from './WorldRenderer.js';
import { CharacterRenderer } from './CharacterRenderer.js';
import { LightingRenderer } from './LightingRenderer.js';
import { ParticleRenderer } from './ParticleRenderer.js';
import { EffectsRenderer } from './EffectsRenderer.js';
import { ProjectileSystem } from '../combat/ProjectileSystem.js';
import { PortalTransition } from '../cinematics/PortalTransition.js';
import { BossIntros } from '../cinematics/BossIntros.js';
import { DeathCinematics } from '../cinematics/DeathCinematics.js';
import { CinematicDirector } from '../cinematics/CinematicDirector.js';
import { MainMenuScene } from '../cinematics/MainMenuScene.js';

export const Renderer = {
  render(ctx) {
    if (!ctx) return;

    // Clear frame
    ctx.clearRect(0, 0, LW, LH);

    // Title state live background
    if (GameState.STATE === GameStates.TITLE) {
      MainMenuScene.draw(ctx);
      return;
    }

    // Death states
    if (GameState.STATE === GameStates.DEATH_NORMAL || GameState.STATE === GameStates.DEATH_SANITY) {
      DeathCinematics.draw(ctx);
      return;
    }

    // Active Gameplay Rendering
    ctx.save();
    Camera.apply(ctx);

    // 1. World Tiles & Environment
    WorldRenderer.drawTiles(ctx);
    WorldRenderer.drawTorches(ctx);
    WorldRenderer.drawItems(ctx);
    WorldRenderer.drawAllies(ctx);

    // 2. Entities
    if (GameState.ENE) {
      GameState.ENE.forEach(e => {
        CharacterRenderer.drawEnemy(ctx, e);
      });
    }

    if (GameState.BOSS && GameState.BOSS.alive) {
      CharacterRenderer.drawBoss(ctx, GameState.BOSS);
    }

    CharacterRenderer.drawPlayer(ctx);
    ProjectileSystem.draw(ctx);
    ParticleRenderer.draw(ctx);

    ctx.restore();

    // 3. Dynamic Lighting & Shadows
    LightingRenderer.render(ctx, GameState.CAM.x, GameState.CAM.y, 1);

    // 4. Screen-Space Atmospheric FX
    EffectsRenderer.drawHorrorFX(ctx);

    // 5. Portals & Cinematics Overlays
    PortalTransition.draw(ctx);
    BossIntros.draw(ctx);
    CinematicDirector.draw(ctx);

    // 6. Fade Transition
    EffectsRenderer.drawFade(ctx);
  }
};
