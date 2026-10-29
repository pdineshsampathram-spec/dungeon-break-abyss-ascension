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
import { CinematicSafety } from '../cinematics/CinematicSafety.js';
import { MusicManager } from '../audio/MusicManager.js';
import { SoundManager } from '../audio/AudioManager.js';
import { triggerCinematicBanner } from '../ui/HUD.js';
import { INPUT_KEYS, MOUSE_STATE } from '../core/InputManager.js';
import { HallucinationSystem } from './HallucinationSystem.js';
import { AbyssDissolution } from './AbyssDissolution.js';
import { FLOATING_TEXTS } from '../rendering/ParticleRenderer.js';
import { isInOpeningSafeZone } from '../world/DungeonGenerator.js';
import { FLOOR_CONFIG, isBossFloor } from '../data/floors.js';

export const RunResetManager = {
  /**
   * Authoritative Run Reset Pipeline
   * Resets ALL transient run state (player, dungeon, gate, bosses, enemies,
   * cinematics, and flags) while strictly preserving permanent meta progression.
   *
   * @param {Object} options
   * @param {boolean} options.playIntro Whether to trigger the opening cinematic
   * @param {number} options.floor Target starting floor (1 to 10)
   * @param {boolean} options.isDeveloperExpedition Whether launched from Developer Sanctum
   * @param {Function} options.onComplete Optional callback on finish
   */
  resetRun({ playIntro = false, floor = 1, isDeveloperExpedition = false, onComplete = null } = {}) {
    console.log(`[RunResetManager] Executing authoritative run reset (floor=${floor}, isDev=${isDeveloperExpedition}, playIntro=${playIntro})`);

    // 1. Clear active localStorage run save so no stale run persists
    SaveSystem.clearRun();

    // 2. Increment run counter & reset level timing metrics
    GameState.RUN_ID = (GameState.RUN_ID || 0) + 1;
    GameState.RUN_PRESTIGE_AWARDED = false;
    GameState.IS_DEBUG_ENDING = false;
    const isAuthorizedDev = !!isDeveloperExpedition && (SaveSystem.isSanctumPermanentUnlocked() || !!GameState.SANCTUM_TEMP_AUTHORIZED);
    GameState.IS_DEVELOPER_EXPEDITION = isAuthorizedDev;
    if (!isAuthorizedDev) {
      GameState.CUSTOM_STARTING_WEAPON = null;
      GameState.CUSTOM_STARTING_MAX_HP = null;
      if (GameState.DEV_MODS) GameState.DEV_MODS.enabled = false;
    }
    GameState.RUN_ACTIVE_TIME = 0;
    GameState.FLOOR_ACTIVE_TIME = 0;
    GameState.RUN_ACTIVE_TIME_STR = isAuthorizedDev ? '--:--' : '00:00';
    GameState.FLOOR_ACTIVE_TIME_STR = isAuthorizedDev ? '--:--' : '00:00';
    GameState.CURRENT_RUN_SURVIVORS = { eligible: [], rescued: [] };
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
    CinematicSafety.reset();
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

    // 9. Rebuild Target Floor through authoritative floor pipeline
    const targetFloor = Math.max(1, Math.min(10, floor || 1));
    GameState.LV = targetFloor;
    FloorManager.loadLevel(targetFloor);

    // Authoritative safety guarantee: opening safe zone must have zero traps
    GameState.TRAPS = (GameState.TRAPS || []).filter(t => !isInOpeningSafeZone(t.x, t.y, targetFloor));

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
    if (playIntro && targetFloor === 1 && !isDeveloperExpedition) {
      // Opening cinematic handles opening gate, running deserters, and slamming shut
      CinematicDirector.startIntro();
    } else {
      // Direct gameplay (e.g. Retry or Developer Deployment): entrance gate must be firmly closed and solid
      if (GameState.GATE) {
        GameState.GATE.state = 'closed';
        GameState.GATE.dropProgress = 1.0;
        GameState.GATE.leverProgress = 1.0;
        GameState.GATE.solid = true;
      }
      GameState.setState(GameStates.PLAYING);
      if (isBossFloor(targetFloor)) {
        if (targetFloor === 3) MusicManager.crossfade('boss_gorgaroth', 1.0, 0.75);
        else if (targetFloor === 6) MusicManager.crossfade('boss_malakor', 1.0, 0.75);
        else if (targetFloor === 10) MusicManager.crossfade('boss_warden', 1.0, 0.75);
      } else {
        MusicManager.crossfade('exploration', 1.0, 0.65);
      }
      SoundManager.snd('portal_enter');

      const fc = FLOOR_CONFIG[targetFloor];
      const floorTitle = `FLOOR ${targetFloor} — ${(fc && fc.name ? fc.name.toUpperCase() : 'ABYSS')}`;
      const floorSub = isDeveloperExpedition
        ? 'DEVELOPER EXPEDITION — OFFICIAL SPEEDRUN RECORDS DISABLED'
        : (fc && fc.desc ? fc.desc : 'You awaken in the dark abyss. Walk.');
      triggerCinematicBanner(floorTitle, floorSub, isDeveloperExpedition ? '#ef4444' : '#38bdf8', 3.0);
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
