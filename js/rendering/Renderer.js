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
import { MainMenuScene } from '../cinematics/MainMenuScene.js?v=2.9';
import { Credits } from '../cinematics/Credits.js';
import { LastEmberCinematic } from '../cinematics/LastEmberCinematic.js';
import { EndingCinematics, ACTIVE_ENDING } from '../cinematics/EndingCinematics.js';
import { WardenDefeatCinematic } from '../cinematics/WardenDefeatCinematic.js';
import { GorgarothCinematics } from '../cinematics/GorgarothCinematics.js';
import { HallucinationSystem } from '../systems/HallucinationSystem.js';
import { AbyssDissolution } from '../systems/AbyssDissolution.js';

export const Renderer = {
  render(ctx) {
    if (!ctx) return;

    // Reset canvas state and clear frame
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, LW, LH);

    // Title state or Title-modal live background
    const isModalFromTitle = (GameState.STATE === GameStates.SANCTUM ||
                              GameState.STATE === GameStates.CODEX ||
                              (GameState.STATE === GameStates.SETTINGS && typeof window !== 'undefined' && window.SettingsUI && window.SettingsUI.getReturnState && window.SettingsUI.getReturnState() === GameStates.TITLE) ||
                              (GameState.STATE === GameStates.ACHIEVEMENTS && typeof window !== 'undefined' && window.AchievementsUI && window.AchievementsUI.getReturnState && window.AchievementsUI.getReturnState() === GameStates.TITLE) ||
                              (!GameState.MAP && (GameState.STATE === GameStates.SETTINGS || GameState.STATE === GameStates.ACHIEVEMENTS)));

    if (GameState.STATE === GameStates.TITLE || isModalFromTitle) {
      MainMenuScene.draw(ctx);
      return;
    }

    // Credits state
    if (GameState.STATE === GameStates.CREDITS) {
      Credits.draw(ctx);
      return;
    }

    // The Last Ember state
    if (GameState.STATE === GameStates.LAST_EMBER || GameState.STATE === 'last_ember' || (LastEmberCinematic && LastEmberCinematic.isActive())) {
      LastEmberCinematic.draw(ctx);
      return;
    }

    // ═══════════════════════════════════════════════════════════
    // IN-ENGINE RENDERING — Used for Gameplay, Boss Intros, Defeats,
    // Endings, and Death Scenes. The real game world (tiles, torches,
    // entities, lighting) renders seamlessly with cinematic camera.
    // ═══════════════════════════════════════════════════════════
    const isIntroCinematic = GameState.STATE === GameStates.CINEMATIC && CinematicDirector.isActive();
    const isEndingCinematic = GameState.STATE === GameStates.CINEMATIC && EndingCinematics.isActive();
    const isWardenDefeatCinematic = GameState.STATE === GameStates.BOSS_DEFEAT_CINEMATIC ||
                                   GameState.STATE === 'boss_defeat_cinematic' ||
                                   WardenDefeatCinematic.isActive();
    const isBossCinematic = (GameState.STATE === GameStates.BOSS_INTRO || GameState.BOSS_INTRO_ACTIVE) && !isWardenDefeatCinematic;
    const isDeathCinematic = GameState.STATE === GameStates.DEATH_NORMAL ||
                             GameState.STATE === GameStates.DEATH_SANITY ||
                             GameState.STATE === GameStates.DYING ||
                             GameState.STATE === GameStates.DEATH_RESULTS;
    const isShatteredMindActive = typeof window !== 'undefined' &&
                                  window.ShatteredMindCinematic &&
                                  window.ShatteredMindCinematic.isActive();
    const isHeroActive = typeof window !== 'undefined' &&
                         window.HeroCinematic &&
                         window.HeroCinematic.isActive();
    const isBetrayalActive = typeof window !== 'undefined' &&
                            window.BetrayalCinematic &&
                            window.BetrayalCinematic.isActive();
    const isRampageActive = typeof window !== 'undefined' &&
                           window.RampageCinematic &&
                           window.RampageCinematic.isActive();
    const isAnyCinematic = isIntroCinematic || isEndingCinematic || isWardenDefeatCinematic || isBossCinematic || isDeathCinematic || isShatteredMindActive || isHeroActive || isBetrayalActive || isRampageActive;
    const suppressDungeonWorld = (isShatteredMindActive && window.ShatteredMindCinematic.suppressRealWorld()) ||
                                 (isHeroActive && window.HeroCinematic.suppressRealWorld()) ||
                                 (isBetrayalActive && window.BetrayalCinematic.suppressRealWorld()) ||
                                 (isRampageActive && window.RampageCinematic.suppressRealWorld()) ||
                                 (typeof window !== 'undefined' && window.EpilogueCinematic && window.EpilogueCinematic.isActive && window.EpilogueCinematic.isActive());

    ctx.save();
    Camera.apply(ctx);

    // 1. World Tiles & Environment
    if (!suppressDungeonWorld) {
      WorldRenderer.drawTiles(ctx);
      WorldRenderer.drawGates(ctx);
      WorldRenderer.drawTraps(ctx);
      WorldRenderer.drawTorches(ctx);
      WorldRenderer.drawShrines(ctx);
      WorldRenderer.drawVoidArenaEffects(ctx);
      WorldRenderer.drawItems(ctx);
      WorldRenderer.drawAllies(ctx);
    }

    // During the real-world fog phase, enemies must remain visible until the
    // world-space darkness actually reaches them.
    const showShatteredMindEntities = isShatteredMindActive &&
      window.ShatteredMindCinematic.shouldRenderRealWorldEntities();
    if (!isIntroCinematic && (!isShatteredMindActive || showShatteredMindEntities) && !isHeroActive && !isBetrayalActive && !isRampageActive && GameState.ENE) {
      GameState.ENE.forEach(e => {
        CharacterRenderer.drawEnemy(ctx, e);
      });
    }

    // Floor entities for Warden Defeat Cinematic (blood decals, floor cracks, fallen blade)
    if (isWardenDefeatCinematic && WardenDefeatCinematic.drawFloorEntities) {
      WardenDefeatCinematic.drawFloorEntities(ctx);
    }

    // Boss: draw if alive OR in any cinematic (intros, defeats, endings, corpse)
    if (GameState.BOSS && !suppressDungeonWorld) {
      if (GameState.BOSS.alive || isAnyCinematic || GameState.BOSS.defeatState === 'collapsed') {
        CharacterRenderer.drawBoss(ctx, GameState.BOSS);
      }
    }

    // In-world sanity hallucinations (eyes in doorways/pillars, tentacle shadows)
    if (!suppressDungeonWorld) {
      HallucinationSystem.drawWorld(ctx);
    }

    CharacterRenderer.drawPlayer(ctx);
    if (!suppressDungeonWorld && PortalTransition && PortalTransition.drawWorldForeground) {
      PortalTransition.drawWorldForeground(ctx);
    }
    ProjectileSystem.draw(ctx);
    ParticleRenderer.draw(ctx);

    // 2.5. World Entities for In-Engine Cinematics
    if (isIntroCinematic && CinematicDirector.drawWorldEntities) {
      CinematicDirector.drawWorldEntities(ctx);
    }
    if (isWardenDefeatCinematic && WardenDefeatCinematic.drawWorldEntities) {
      WardenDefeatCinematic.drawWorldEntities(ctx);
    }
    if (isEndingCinematic || isHeroActive || isBetrayalActive || isRampageActive) {
      EndingCinematics.drawWorldEntities(ctx);
    }
    if ((isDeathCinematic || isShatteredMindActive) && DeathCinematics.drawWorldEntities) {
      DeathCinematics.drawWorldEntities(ctx);
    }
    if (isBossCinematic && BossIntros.drawWorldEntities) {
      BossIntros.drawWorldEntities(ctx);
    }
    if (GorgarothCinematics.isActive() && GorgarothCinematics.drawWorldEntities) {
      GorgarothCinematics.drawWorldEntities(ctx);
    }

    // World-space Abyss Dissolution particles (render above characters and floor decals)
    AbyssDissolution.drawParticles(ctx);

    ctx.restore();

    // 3. Dynamic Lighting & Shadows
    if (!suppressDungeonWorld) {
      LightingRenderer.render(ctx, GameState.CAM.x, GameState.CAM.y, GameState.CAM.z || 1);
    }

    // 4. Screen-Space Atmospheric FX
    if (!isAnyCinematic) {
      EffectsRenderer.drawHorrorFX(ctx);
      HallucinationSystem.drawScreen(ctx);
    }

    // 5. Portals & Cinematics Overlays
    PortalTransition.draw(ctx);

    // 6. IN-ENGINE CINEMATIC OVERLAYS (Letterbox, dialogue, banners — screen-space)
    if (isIntroCinematic && CinematicDirector.draw) {
      CinematicDirector.draw(ctx);
    }
    if (isWardenDefeatCinematic && WardenDefeatCinematic.draw) {
      WardenDefeatCinematic.draw(ctx);
    }
    if (isEndingCinematic || isHeroActive || isBetrayalActive || isRampageActive) {
      EndingCinematics.draw(ctx);
    }
    if (isBossCinematic) {
      BossIntros.draw(ctx);
    }
    if (isDeathCinematic || isShatteredMindActive) {
      DeathCinematics.draw(ctx);
    }
    if (GorgarothCinematics.isActive() && GorgarothCinematics.draw) {
      GorgarothCinematics.draw(ctx);
    }

    // 7. Fade Transition
    EffectsRenderer.drawFade(ctx);
  }
};
