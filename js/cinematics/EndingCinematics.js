// =====================================================================
//  DUNGEON BREAK — js/cinematics/EndingCinematics.js
//  CENTRAL ENDING DISPATCHER & CANONICAL ENDING ROUTER
//
//  Architecture:
//  - One central authority: EndingDispatcher
//  - Resolves exactly ONE ending based on run state:
//      Saved >= 1 && Sanity >= 40  →  HeroCinematic (Canonical Savior of Depth)
//      Saved >= 1 && Sanity < 40   →  BetrayalCinematic (Canonical Throne Room Betrayal)
//      No survivors (Saved == 0)   →  RampageCinematic (Canonical In-Engine Rampage)
//  - ShatteredMindCinematic remains independent (sanity <= 0)
//  - Protected by run ID and one-shot transition locks
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH } from '../core/Constants.js';
import { EventBus } from '../core/EventBus.js';
import { Credits } from './Credits.js';
import { UITransitionManager } from '../ui/UITransitionManager.js';
import { quitToMainMenu } from '../ui/PauseMenu.js';
import { RampageCinematic } from './RampageCinematic.js';
import { HeroCinematic } from './HeroCinematic.js';
import { BetrayalCinematic } from './BetrayalCinematic.js';

export let ACTIVE_ENDING = null;

// ─────────────────────────────────────────────────────────────
// CENTRAL ENDING DISPATCHER
// ─────────────────────────────────────────────────────────────
let _endingDispatched = false;
let _dispatchedRunId = -1;
let _activeEndingName = null;

export const EndingDispatcher = {
  isDispatched() {
    return _endingDispatched;
  },

  getActiveEnding() {
    return _activeEndingName;
  },

  resolveAndStart(branchOverride = null) {
    const currentRunId = GameState.RUN_ID || 1;

    // One-shot lock & run-generation safety:
    // If an ending has already been dispatched for this run, reject duplicate triggers
    if (_endingDispatched && _dispatchedRunId === currentRunId) {
      console.warn(`[EndingDispatcher] Ending already dispatched for run ${currentRunId} (${_activeEndingName}). Blocking duplicate.`);
      return;
    }

    _endingDispatched = true;
    _dispatchedRunId = currentRunId;

    // 1. Fully reset WardenDefeatCinematic state and release camera/timers
    if (typeof window !== 'undefined' && window.WardenDefeatCinematic && window.WardenDefeatCinematic.reset) {
      window.WardenDefeatCinematic.reset();
    }

    // 2. Resolve target ending branch from run state if not explicitly specified
    let targetBranch = branchOverride;
    if (!targetBranch) {
      const { P, SANITY } = GameState;
      let san = 50;
      if (SANITY !== undefined && SANITY < 40) san = SANITY;
      else if (P && P.san !== undefined && P.san < 40) san = P.san;
      else if (SANITY !== undefined) san = SANITY;
      else if (P && P.san !== undefined) san = P.san;

      const saved = (P && P.saved !== undefined) ? P.saved : 0;

      if (saved >= 1 && san >= 40) {
        targetBranch = 'hero';
      } else if (saved >= 1 && san < 40) {
        targetBranch = 'betrayal';
      } else {
        targetBranch = 'rampage';
      }
    }

    _activeEndingName = targetBranch;
    console.log(`[EndingDispatcher] Authoritatively dispatching single ending: ${targetBranch.toUpperCase()}`);

    // Set master cinematic game state
    GameState.setState(GameStates.CINEMATIC);
    GameState.CINEMATIC_ACTIVE = true;
    GameState.BOSS_AI_ACTIVE = false;
    GameState.levelTransitionActive = false;
    GameState.PORTAL_USED = true;
    ACTIVE_ENDING = null;

    // Reset all ending cinematics to a clean baseline
    if (HeroCinematic && HeroCinematic.reset) HeroCinematic.reset();
    if (BetrayalCinematic && BetrayalCinematic.reset) BetrayalCinematic.reset();
    if (RampageCinematic && RampageCinematic.reset) RampageCinematic.reset();

    // 3. Launch EXACTLY ONE canonical ending cinematic
    if (targetBranch === 'hero') {
      HeroCinematic.start();
    } else if (targetBranch === 'betrayal') {
      BetrayalCinematic.start();
    } else { // rampage
      RampageCinematic.start();
    }

    EventBus.emit('ending:dispatched', { branch: targetBranch, runId: currentRunId });
  },

  reset() {
    _endingDispatched = false;
    _activeEndingName = null;
    _dispatchedRunId = -1;
    ACTIVE_ENDING = null;
    if (HeroCinematic && HeroCinematic.reset) HeroCinematic.reset();
    if (BetrayalCinematic && BetrayalCinematic.reset) BetrayalCinematic.reset();
    if (RampageCinematic && RampageCinematic.reset) RampageCinematic.reset();
    if (Credits && Credits.reset) Credits.reset();
  }
};

// ─────────────────────────────────────────────────────────────
// ENDING CINEMATICS FACADE (Interface Compatibility)
// ─────────────────────────────────────────────────────────────
export const EndingCinematics = {
  getActiveEnding() {
    return EndingDispatcher.getActiveEnding();
  },

  isActive() {
    return EndingDispatcher.isDispatched() ||
           (HeroCinematic && HeroCinematic.isActive()) ||
           (BetrayalCinematic && BetrayalCinematic.isActive()) ||
           (RampageCinematic && RampageCinematic.isActive()) ||
           !!ACTIVE_ENDING;
  },

  startWardenDefeat(boss) {
    if (typeof window !== 'undefined' && window.WardenDefeatCinematic) {
      window.WardenDefeatCinematic.start(boss);
      return;
    }
    const bossRef = boss || GameState.BOSS;
    EventBus.emit('cinematic:warden_defeat_started');
  },

  startHero() {
    EndingDispatcher.resolveAndStart('hero');
  },

  isHeroActive() {
    return HeroCinematic && HeroCinematic.isActive();
  },

  skipHero() {
    if (HeroCinematic && HeroCinematic.isActive()) {
      if (HeroCinematic.canSkip && HeroCinematic.canSkip()) {
        HeroCinematic.skip();
      }
    }
  },

  startBetrayal() {
    EndingDispatcher.resolveAndStart('betrayal');
  },

  isBetrayalActive() {
    return BetrayalCinematic && BetrayalCinematic.isActive();
  },

  skipBetrayal() {
    if (BetrayalCinematic && BetrayalCinematic.isActive()) {
      if (BetrayalCinematic.canSkip && BetrayalCinematic.canSkip()) {
        BetrayalCinematic.skip();
      }
    }
  },

  startRampage() {
    EndingDispatcher.resolveAndStart('rampage');
  },

  isRampageActive() {
    return RampageCinematic && RampageCinematic.isActive();
  },

  skipRampage() {
    if (RampageCinematic && RampageCinematic.isActive()) {
      if (RampageCinematic.canSkip && RampageCinematic.canSkip()) {
        RampageCinematic.skip();
      }
    }
  },

  start(type = 'rampage') {
    EndingDispatcher.resolveAndStart(type);
  },

  trigger(type = 'rampage') {
    EndingDispatcher.resolveAndStart(type);
  },

  showHeroCard() {
    HeroCinematic.start();
    HeroCinematic.seek(50.0);
  },

  showBetrayalCard() {
    BetrayalCinematic.start();
    BetrayalCinematic.seek(63.5);
  },

  showRampageCard() {
    RampageCinematic.start();
    RampageCinematic.seek(68.0);
  },

  decideEnding() {
    EndingDispatcher.resolveAndStart();
  },

  reset() {
    EndingDispatcher.reset();
  },

  // TICK — drives the authoritative active ending cinematic
  tick(dt) {
    if (HeroCinematic && HeroCinematic.isActive()) {
      HeroCinematic.tick(dt);
      return;
    }
    if (BetrayalCinematic && BetrayalCinematic.isActive()) {
      BetrayalCinematic.tick(dt);
      return;
    }
    if (RampageCinematic && RampageCinematic.isActive()) {
      RampageCinematic.tick(dt);
      return;
    }
  },

  // DRAW — delegates to the active canonical ending cinematic
  draw(ctx) {
    if (HeroCinematic && HeroCinematic.isActive()) {
      HeroCinematic.draw(ctx);
      return;
    }
    if (BetrayalCinematic && BetrayalCinematic.isActive()) {
      BetrayalCinematic.draw(ctx);
      return;
    }
    if (RampageCinematic && RampageCinematic.isActive()) {
      RampageCinematic.draw(ctx);
      return;
    }
  },

  // Draw cinematic entities into the world-space rendering pass
  drawWorldEntities(ctx) {
    if (HeroCinematic && HeroCinematic.isActive()) {
      HeroCinematic.drawWorldEntities(ctx);
      return;
    }
    if (BetrayalCinematic && BetrayalCinematic.isActive()) {
      BetrayalCinematic.drawWorldEntities(ctx);
      return;
    }
    if (RampageCinematic && RampageCinematic.isActive()) {
      RampageCinematic.drawWorldEntities(ctx);
      return;
    }
  },

  // Is the lighting system in cinematic mode?
  isCinematicLighting() {
    return EndingDispatcher.isDispatched() ||
           (RampageCinematic && RampageCinematic.isActive()) ||
           (HeroCinematic && HeroCinematic.isActive()) ||
           (BetrayalCinematic && BetrayalCinematic.isActive());
  },

  proceedToCredits(endType = 'hero') {
    const branch = endType || EndingDispatcher.getActiveEnding() || 'hero';
    GameState.CINEMATIC_ACTIVE = false;
    UITransitionManager.transitionTo(() => {
      Credits.start(branch);
    }, 0.5);
  },

  handleClick(mx, my) {
    if (HeroCinematic && HeroCinematic.isActive()) {
      if (HeroCinematic.handleClick(mx, my)) return true;
      return false;
    }
    if (BetrayalCinematic && BetrayalCinematic.isActive()) {
      if (BetrayalCinematic.handleClick(mx, my)) return true;
      return false;
    }
    if (RampageCinematic && RampageCinematic.isActive()) {
      if (RampageCinematic.handleClick(mx, my)) return true;
      return false;
    }
    return false;
  }
};

export const startHeroEnding = () => EndingDispatcher.resolveAndStart('hero');
export const startBetrayalEnding = () => EndingDispatcher.resolveAndStart('betrayal');
export const startRampageEnding = () => EndingDispatcher.resolveAndStart('rampage');
export const decideEnding = () => EndingDispatcher.resolveAndStart();
export const drawEndingMovie = (ctx) => EndingCinematics.draw(ctx);
export const proceedToCredits = () => EndingCinematics.proceedToCredits();

export const triggerHeroEnding = () => EndingDispatcher.resolveAndStart('hero');
export const triggerBetrayalEnding = () => EndingDispatcher.resolveAndStart('betrayal');
export const triggerRampageEnding = () => EndingDispatcher.resolveAndStart('rampage');

if (typeof window !== 'undefined') {
  window.EndingDispatcher = EndingDispatcher;
  window.startHeroEnding = startHeroEnding;
  window.triggerHeroEnding = triggerHeroEnding;
  window.startBetrayalEnding = startBetrayalEnding;
  window.triggerBetrayalEnding = triggerBetrayalEnding;
  window.startRampageEnding = startRampageEnding;
  window.triggerRampageEnding = triggerRampageEnding;
  window.decideEnding = decideEnding;
  window.drawEndingMovie = drawEndingMovie;
  window.proceedToCredits = proceedToCredits;
  window.EndingCinematics = EndingCinematics;
  Object.defineProperty(window, 'ACTIVE_ENDING', {
    get: () => ACTIVE_ENDING,
    set: (v) => { ACTIVE_ENDING = v; },
    configurable: true
  });
}
