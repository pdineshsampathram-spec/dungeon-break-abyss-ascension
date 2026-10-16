// =====================================================================
//  DUNGEON BREAK — js/systems/RunResetManager.js
//  Authoritative Centralized Run Initialization & State Reset Manager
//  Enforces clean separation between Permanent Meta Data and Run State.
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { SaveSystem } from './SaveSystem.js';
import { FloorManager } from '../world/FloorManager.js';
import { Camera } from '../rendering/Camera.js';
import { CinematicDirector } from '../cinematics/CinematicDirector.js';
import { DeathCinematics } from '../cinematics/DeathCinematics.js';
import { Credits } from '../cinematics/Credits.js';
import { EndingDispatcher } from '../cinematics/EndingCinematics.js';
import { WardenDefeatCinematic } from '../cinematics/WardenDefeatCinematic.js';
import { GorgarothCinematics } from '../cinematics/GorgarothCinematics.js';
import { ShatteredMindCinematic } from '../cinematics/ShatteredMindCinematic.js';
import { BossIntros } from '../cinematics/BossIntros.js';
import { MusicManager } from '../audio/MusicManager.js';
import { SoundManager } from '../audio/AudioManager.js';
import { triggerCinematicBanner } from '../ui/HUD.js';
import { INPUT_KEYS, MOUSE_STATE } from '../core/InputManager.js';
import { HallucinationSystem } from './HallucinationSystem.js';
import { AbyssDissolution } from './AbyssDissolution.js';
import { FLOATING_TEXTS } from '../rendering/ParticleRenderer.js';
import { isInOpeningSafeZone } from '../world/DungeonGenerator.js';

export const RunResetManager = {
  /**
   * Authoritative Run Reset Pipeline
   * Resets ALL transient run state (player, dungeon, gate, bosses, enemies,
   * cinematics, and flags) while strictly preserving permanent meta progression.
   *
   * @param {Object} options
   * @param {boolean} options.playIntro Whether to trigger the opening cinematic
   * @param {Function} options.onComplete Optional callback on finish
   */
  resetRun({ playIntro = false, onComplete = null } = {}) {
    console.log(`[RunResetManager] Executing authoritative run reset (playIntro=${playIntro})`);

    // 1. Clear active localStorage run save so no stale run persists
    SaveSystem.clearRun();

    // 2. Increment run counter & reset level timing metrics
    GameState.RUN_ID = (GameState.RUN_ID || 0) + 1;
    GameState.RUN_PRESTIGE_AWARDED = false;
    GameState.IS_DEBUG_ENDING = false;
    GameState.LEVEL_TIMER = 0;
    GameState.LEVEL_TIME_STR = '00:00';
    GameState.LEVEL_TOOK_DAMAGE = false;
    GameState.CURRENT_MUTATION = null;
    GameState.ACTIVE_LORE_MODAL = null;
    GameState.ACTIVE_MEMORY_ECHO = null;
    GameState.ACTIVE_SPEECH_BUBBLES = [];
    GameState.ACTIVE_WEAPON_REPLACE_MODAL = null;
    GameState.pendingWeaponDrop = null;

    // 3. Clear transient input state
    try {
      if (typeof INPUT_KEYS !== 'undefined') {
        Object.keys(INPUT_KEYS).forEach(k => delete INPUT_KEYS[k]);
      }
      if (typeof MOUSE_STATE !== 'undefined') {
        MOUSE_STATE.isDown = false;
      }
    } catch (e) {}

    // 4. Stop all audio immediately
    MusicManager.stopImmediate();

    // 5. Reset all cinematics, cutscenes, and ending dispatchers
    EndingDispatcher.reset();
    if (WardenDefeatCinematic && WardenDefeatCinematic.reset) WardenDefeatCinematic.reset();
    if (GorgarothCinematics && GorgarothCinematics.reset) GorgarothCinematics.reset();
    if (Credits && Credits.reset) Credits.reset();
    if (DeathCinematics && DeathCinematics.reset) DeathCinematics.reset();
    if (ShatteredMindCinematic && ShatteredMindCinematic.reset) ShatteredMindCinematic.reset();
    if (BossIntros && BossIntros.reset) BossIntros.reset();
    if (CinematicDirector && CinematicDirector.reset) CinematicDirector.reset();
    GameState.CINEMATIC_ACTIVE = false;

    // 6. Reset portal, warps, and transition locks
    GameState.levelTransitionActive = false;
    GameState.PORTAL_USED = false;
    GameState.PORTAL_DISCOVERED = false;
    GameState.WARP_ACTIVE = false;
    GameState.WARP_TIMER = 0;
    GameState.WARP_QUOTE = '';
    FloorManager.resetTransitionLock();
    HallucinationSystem.reset();

    // 7. Clear all level transient collections
    GameState.clearLevelEntities();
    AbyssDissolution.reset();
    FLOATING_TEXTS.length = 0;
    GameState.MAP = [];
    GameState.ROOMS = [];
    GameState.CORRIDORS = [];
    GameState.ENE = [];
    GameState.ALLIES = [];
    GameState.ITEMS = [];
    GameState.TRAPS = [];
    GameState.TORCHES = [];
    GameState.SHRINES = [];
    GameState.BLOOD = [];
    GameState.PROJECTILES = [];
    GameState.PRT = [];
    GameState.SLASH_TRAILS = [];
    GameState.SURVIVORS = [];
    GameState.ECHOES = [];

    // 8. Reset player attributes and weapons to default run start
    GameState.resetPlayer();

    // 9. Rebuild Floor 1 through authoritative floor pipeline
    GameState.LV = 1;
    FloorManager.loadLevel(1);

    // Authoritative safety guarantee: opening safe zone must have zero traps
    GameState.TRAPS = (GameState.TRAPS || []).filter(t => !isInOpeningSafeZone(t.x, t.y, 1));

    // 10. Reset camera cleanly to player spawn coordinates
    Camera.reset();
    if (GameState.P) {
      GameState.CAM.tx = GameState.P.x;
      GameState.CAM.ty = GameState.P.y;
      GameState.CAM.tz = 1.0;
      GameState.CAM.x = GameState.P.x;
      GameState.CAM.y = GameState.P.y;
      GameState.CAM.z = 1.0;
    }

    // 11. Handle gate state & next mode
    if (playIntro) {
      // Opening cinematic handles opening gate, running deserters, and slamming shut
      CinematicDirector.startIntro();
    } else {
      // Direct gameplay (e.g. Retry): entrance gate must be firmly closed and solid
      if (GameState.GATE) {
        GameState.GATE.state = 'closed';
        GameState.GATE.dropProgress = 1.0;
        GameState.GATE.leverProgress = 1.0;
        GameState.GATE.solid = true;
      }
      GameState.setState(GameStates.PLAYING);
      MusicManager.crossfade('exploration', 1.0, 0.65);
      SoundManager.snd('portal_enter');
      triggerCinematicBanner('FLOOR 1 — THE SUNKEN CRYPTS', 'You awaken in the dark abyss. Walk.');
    }

    if (onComplete) {
      try { onComplete(); } catch (err) { console.error('[RunResetManager] Error in onComplete callback:', err); }
    }
  }
};

// Expose globally for browser test harnesses
if (typeof window !== 'undefined') {
  window.RunResetManager = RunResetManager;
}
