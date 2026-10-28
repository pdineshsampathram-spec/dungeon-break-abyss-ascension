// =====================================================================
//  DUNGEON BREAK — js/main.js
//  Authoritative Main Application Bootstrap & Lifecycle Entry Point
// =====================================================================

import { Game } from './core/Game.js';
import { GameLoop } from './core/GameLoop.js';
import { Renderer } from './rendering/Renderer.js';
import { GameState, GameStates } from './core/GameState.js';
import { InputManager } from './core/InputManager.js';
import { LW, LH, setLogicalDimensions } from './core/Constants.js';
import { CombatSystem } from './combat/CombatSystem.js';
import { WeaponInventory } from './weapons/WeaponInventory.js';
import { LootSystem } from './systems/LootSystem.js';
import { HUD } from './ui/HUD.js';
import { PauseMenu, pauseGame, resumeGame, quitToMainMenu, SettingsUI, AchievementsUI } from './ui/PauseMenu.js';
import { CodexUI } from './ui/CodexUI.js';
import { SanctumUI } from './ui/SanctumUI.js';
import { MainMenu, startGame, resumeSavedRun } from './ui/MainMenu.js';
import { MobileControls } from './ui/MobileControls.js';
import { CinematicDirector } from './cinematics/CinematicDirector.js';
import { DeathCinematics } from './cinematics/DeathCinematics.js';
import { ShatteredMindCinematic } from './cinematics/ShatteredMindCinematic.js';
import { HeroCinematic } from './cinematics/HeroCinematic.js';
import { BetrayalCinematic } from './cinematics/BetrayalCinematic.js';
import { RampageCinematic } from './cinematics/RampageCinematic.js';
import { EndingCinematics, EndingDispatcher, ACTIVE_ENDING } from './cinematics/EndingCinematics.js';
import { EpilogueCinematic } from './cinematics/EpilogueCinematic.js';
import { WardenDefeatCinematic } from './cinematics/WardenDefeatCinematic.js';
import { GorgarothCinematics } from './cinematics/GorgarothCinematics.js';
import { Credits } from './cinematics/Credits.js';
import { LastEmberCinematic } from './cinematics/LastEmberCinematic.js';
import { BossIntros } from './cinematics/BossIntros.js';
import { CinematicSafety } from './cinematics/CinematicSafety.js';
import { CinematicReplayContext } from './cinematics/CinematicReplayContext.js';
import { CinematicArchiveUI } from './ui/CinematicArchiveUI.js';
import { DeveloperSanctumUI } from './ui/DeveloperSanctumUI.js';
import { FloorManager } from './world/FloorManager.js';
import { Portal } from './world/Portal.js';
import { Interactables } from './world/Interactables.js';
import { EventBus } from './core/EventBus.js';
import { SoundManager } from './audio/AudioManager.js';
import { HallucinationSystem } from './systems/HallucinationSystem.js';
import { SanitySystem, SANITY_KILL_DEPTH_MULT } from './systems/SanitySystem.js';

import { PathValidator } from './world/PathValidator.js';
import { RunResetManager } from './systems/RunResetManager.js';
import { AchievementSystem, ACHIEV_TOASTS } from './systems/AchievementSystem.js';
import { ACHIEVEMENTS, ACHIEVEMENT_KEYS } from './data/achievements.js';
import { BESTIARY_INFO } from './data/enemies.js';
import { SaveSystem } from './systems/SaveSystem.js';
import { drawPixelEye } from './cinematics/ShatteredMindCinematic.js';

function bootstrap() {
  const canvas = document.getElementById('c');
  if (!canvas) {
    console.error('[DUNGEON BREAK] Canvas element #c not found.');
    return;
  }

  // Authoritative internal resolution
  canvas.width = LW;
  canvas.height = LH;

  // Responsive edge-to-edge full viewport scaling without black gutters
  function resizeCanvas() {
    const sw = window.innerWidth;
    const sh = window.innerHeight;
    const aspect = sw / sh;

    let targetLW, targetLH;
    if (aspect >= 1.4) {
      // Landscape: keep logical height 640, expand width to fill screen edge-to-edge
      targetLH = 640;
      targetLW = Math.round(640 * aspect);
    } else {
      // Portrait / Narrow: keep logical width 896, expand height to fill screen edge-to-edge
      targetLW = 896;
      targetLH = Math.round(896 / aspect);
    }

    setLogicalDimensions(targetLW, targetLH);

    canvas.width = targetLW;
    canvas.height = targetLH;

    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.left = '0px';
    canvas.style.top = '0px';

    InputManager.setCanvasScale(sw / targetLW);

    if (typeof MobileControls !== 'undefined' && MobileControls.updateTouchVis) {
      MobileControls.updateTouchVis();
    }
  }
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));
  resizeCanvas();

  // Keyboard shortcut dispatcher
  window.addEventListener('keydown', (e) => {
    const k = e.key;

    // Developer Sanctum Gate / Chamber Intercept
    if (DeveloperSanctumUI.isGateOpen() || GameState.STATE === GameStates.DEVELOPER_SANCTUM) {
      if (DeveloperSanctumUI.handleKeyDown(k)) {
        e.preventDefault();
        return;
      }
    }

    // 0. Title keyboard navigation (Up / Down / Enter / Space)
    if (GameState.STATE === GameStates.TITLE) {
      if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'ArrowLeft' || k === 'a' || k === 'A') {
        e.preventDefault();
        MainMenu.navigateFocus(-1);
        return;
      }
      if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'ArrowRight' || k === 'd' || k === 'D') {
        e.preventDefault();
        MainMenu.navigateFocus(1);
        return;
      }
      if (k === 'Enter' || k === ' ' || e.code === 'Space') {
        e.preventDefault();
        MainMenu.activateFocused();
        return;
      }
    }

    // 0.0. Death screen navigation and action (Up/Down/Enter/Space/S/Escape)
    if (GameState.STATE === GameStates.DEATH_NORMAL || GameState.STATE === GameStates.DEATH_SANITY || GameState.STATE === GameStates.DYING || GameState.STATE === GameStates.DEATH_RESULTS || GameState.STATE === 'endcard') {
      if (DeathCinematics.handleKeyDown(k)) {
        e.preventDefault();
        return;
      }
    }

    // 0.05. Credits navigation and action (Up/Down/Enter/Space/Escape)
    if (GameState.STATE === GameStates.CREDITS || GameState.STATE === 'credits') {
      if (Credits.handleKeyDown(k)) {
        e.preventDefault();
        return;
      }
    }

    // 0.06. The Last Ember cinematic navigation and skip (Escape/Space/Enter)
    if (GameState.STATE === GameStates.LAST_EMBER || GameState.STATE === 'last_ember' || (LastEmberCinematic && LastEmberCinematic.isActive())) {
      if (LastEmberCinematic.handleKeyDown(k)) {
        e.preventDefault();
        return;
      }
    }

    // 0.07. Cinematic Archive navigation and action (Up/Down/Left/Right/Enter/Escape)
    if (GameState.STATE === GameStates.CINEMATIC_ARCHIVE) {
      if (CinematicArchiveUI.handleKeyDown(k)) {
        e.preventDefault();
        return;
      }
    }

    // 0.1. Cinematic skip/advance (Enter or Space)
    if (k === 'Enter' || k === ' ' || e.code === 'Space') {
      if (GameState.STATE === GameStates.BOSS_DEFEAT_CINEMATIC || GameState.STATE === 'boss_defeat_cinematic') {
        e.preventDefault();
        if (CinematicReplayContext.isReplaying() || CinematicSafety.isReplay()) {
          if (CinematicSafety.isValidSkipKey(' ')) {
            CinematicReplayContext.finishReplay();
          }
          return;
        }
        if (WardenDefeatCinematic.canSkip && WardenDefeatCinematic.canSkip()) {
          WardenDefeatCinematic.skip();
          return;
        }
        if (GorgarothCinematics.canSkip && GorgarothCinematics.canSkip()) {
          GorgarothCinematics.skip();
          return;
        }
        return;
      }
      if (GameState.STATE === GameStates.DEATH_SANITY || (typeof window !== 'undefined' && window.ShatteredMindCinematic && window.ShatteredMindCinematic.isActive())) {
        e.preventDefault();
        DeathCinematics.handleKey(' ');
        return;
      }
      if (GameState.STATE === GameStates.CINEMATIC) {
        e.preventDefault();
        if (CinematicReplayContext.isReplaying() || CinematicSafety.isReplay()) {
          if (CinematicSafety.isValidSkipKey(' ')) {
            CinematicReplayContext.finishReplay();
          }
          return;
        }
        if (!CinematicSafety.isValidSkipKey(' ')) {
          return;
        }
        if (EpilogueCinematic && EpilogueCinematic.isActive()) {
          EpilogueCinematic.skip();
          return;
        }
        if (EndingCinematics.isHeroActive && EndingCinematics.isHeroActive()) {
          EndingCinematics.skipHero();
          return;
        }
        if (EndingCinematics.isBetrayalActive && EndingCinematics.isBetrayalActive()) {
          EndingCinematics.skipBetrayal();
          return;
        }
        if (EndingCinematics.isRampageActive && EndingCinematics.isRampageActive()) {
          EndingCinematics.skipRampage();
          return;
        }
        if (ACTIVE_ENDING) {
          if (ACTIVE_ENDING.timer < 33.0) {
            ACTIVE_ENDING.timer = 34.0;
          } else {
            EndingCinematics.proceedToCredits();
          }
        } else {
          CinematicDirector.advance();
        }
        return;
      }
      if (GameState.STATE === GameStates.BOSS_INTRO || GameState.BOSS_INTRO_ACTIVE) {
        e.preventDefault();
        if (CinematicReplayContext.isReplaying() || CinematicSafety.isReplay()) {
          if (CinematicSafety.isValidSkipKey(' ')) {
            CinematicReplayContext.finishReplay();
          }
          return;
        }
        if (!CinematicSafety.isValidSkipKey(' ')) {
          return;
        }
        BossIntros.skip();
        return;
      }
    }

    // 0.15. Shattered Mind key shortcuts (R, Escape, Arrow keys)
    if (GameState.STATE === GameStates.DEATH_SANITY || (typeof window !== 'undefined' && window.ShatteredMindCinematic && window.ShatteredMindCinematic.isActive())) {
      if (DeathCinematics.handleKey(k)) {
        e.preventDefault();
        return;
      }
    }


    // 0.2. Achievements UI keyboard navigation (Arrows, Tab, Esc)
    if (GameState.STATE === GameStates.ACHIEVEMENTS) {
      if (AchievementsUI.handleKeyDown(e.key)) {
        e.preventDefault();
        return;
      }
    }

    // 0.5. Resume saved run shortcut on Title (plain 'r' key only, without Shift/Alt)
    if ((k === 'r' || k === 'R') && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey && GameState.STATE === GameStates.TITLE) {
      e.preventDefault();
      resumeSavedRun();
      return;
    }

    // 0.7. Weapon Replacement Modal Active (Isolated Input: prompt vs selector)
    const repModal = GameState.ACTIVE_WEAPON_REPLACE_MODAL || GameState.pendingWeaponDrop;
    if (repModal) {
      const mode = repModal.mode || 'prompt';
      if (mode === 'prompt') {
        if (k === 'Enter' || k === 'e' || k === 'E' || k === 's' || k === 'S') {
          e.preventDefault();
          WeaponInventory.switchToSelector();
          return;
        }
        if (k === 'Escape' || k === 'x' || k === 'X' || k === 'c' || k === 'C' || k === 'g' || k === 'G') {
          e.preventDefault();
          WeaponInventory.discardReplacementWeapon();
          return;
        }
      } else {
        if (k === '1') {
          e.preventDefault();
          WeaponInventory.replaceWeaponSlot(0, repModal.newWeapon);
          return;
        }
        if (k === '2') {
          e.preventDefault();
          WeaponInventory.replaceWeaponSlot(1, repModal.newWeapon);
          return;
        }
        if (k === '3') {
          e.preventDefault();
          WeaponInventory.replaceWeaponSlot(2, repModal.newWeapon);
          return;
        }
        if (k === 'Escape' || k === 'x' || k === 'X' || k === 'c' || k === 'C' || k === 'g' || k === 'G') {
          e.preventDefault();
          WeaponInventory.discardReplacementWeapon();
          return;
        }
      }
      // Block all other keys from falling through to gameplay while modal is active
      e.preventDefault();
      return;
    }

    // 1. Weapon Slot Hotkeys (1, 2, 3)
    if (k === '1') { WeaponInventory.switchWeaponSlot(0); return; }
    if (k === '2') { WeaponInventory.switchWeaponSlot(1); return; }
    if (k === '3') { WeaponInventory.switchWeaponSlot(2); return; }

    // 1.5. Interactive Pickup / Swap / Shrine (E key)
    if ((k === 'e' || k === 'E') && GameState.STATE === GameStates.PLAYING) {
      e.preventDefault();
      if (GameState.nearestDroppedWeapon) {
        WeaponInventory.swapActiveSlotWithGround(GameState.nearestDroppedWeapon);
        return;
      }
      if (Interactables.interactNearbyShrine && Interactables.interactNearbyShrine()) {
        return;
      }
    }

    // 1.6. Open 3-Slot Replace Modal (G key)
    if ((k === 'g' || k === 'G') && GameState.STATE === GameStates.PLAYING) {
      e.preventDefault();
      if (GameState.nearestDroppedWeapon) {
        WeaponInventory.openReplaceModal(GameState.nearestDroppedWeapon);
        return;
      }
    }

    // 2. Combat Hotkeys (Playing state)
    if (k === ' ' && GameState.STATE === GameStates.PLAYING) {
      e.preventDefault();
      CombatSystem.doAttack();
      return;
    }
    if ((k === 'Shift' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') && GameState.STATE === GameStates.PLAYING) {
      e.preventDefault();
      CombatSystem.fireBowQuick();
      return;
    }
    if ((k === 'q' || k === 'Q') && GameState.STATE === GameStates.PLAYING) {
      e.preventDefault();
      CombatSystem.triggerWeaponAbility();
      return;
    }

    // 3. Minimap Toggle
    if (k === 'm' || k === 'M') {
      HUD.toggleMinimap();
      return;
    }

    // 4. Pause / Esc
    if (k === 'Escape') {
      e.preventDefault();

      // 4.0. Safe Replay Context Intercept (Escape always exits replay cleanly without touching gameplay)
      if (CinematicReplayContext.isReplaying() || CinematicSafety.isReplay()) {
        CinematicReplayContext.finishReplay();
        return;
      }

      // 4.1. Boss Defeat Cinematics (Floor 3 Gorgaroth & Floor 10 Warden)
      if (GameState.STATE === GameStates.BOSS_DEFEAT_CINEMATIC || GameState.STATE === 'boss_defeat_cinematic' || (GorgarothCinematics.isActive && GorgarothCinematics.isActive()) || (WardenDefeatCinematic.isActive && WardenDefeatCinematic.isActive())) {
        if (!CinematicSafety.isValidSkipKey('Escape')) {
          return;
        }
        if (WardenDefeatCinematic.isActive && WardenDefeatCinematic.isActive()) {
          WardenDefeatCinematic.skip();
          return;
        }
        if (GorgarothCinematics.isActive && GorgarothCinematics.isActive()) {
          GorgarothCinematics.skip();
          return;
        }
        return;
      }

      // 4.2. In-Game Story Cinematics (Prologue Descent, Endings)
      if (GameState.STATE === GameStates.CINEMATIC || GameState.CINEMATIC_ACTIVE) {
        if (!CinematicSafety.isValidSkipKey('Escape')) {
          return;
        }
        if (EndingCinematics.isActive()) {
          if (EpilogueCinematic && EpilogueCinematic.isActive()) {
            EpilogueCinematic.skip();
            return;
          }
          if (EndingCinematics.isHeroActive && EndingCinematics.isHeroActive()) {
            EndingCinematics.skipHero();
            return;
          }
          if (EndingCinematics.isBetrayalActive && EndingCinematics.isBetrayalActive()) {
            EndingCinematics.skipBetrayal();
            return;
          }
          if (EndingCinematics.isRampageActive && EndingCinematics.isRampageActive()) {
            EndingCinematics.skipRampage();
            return;
          }
          EndingCinematics.proceedToCredits();
          return;
        }
        if (CinematicDirector.isActive && CinematicDirector.isActive()) {
          CinematicDirector.endIntro();
        }
        return;
      }

      // 4.3. Boss Intros
      if (GameState.STATE === GameStates.BOSS_INTRO || GameState.BOSS_INTRO_ACTIVE) {
        if (!CinematicSafety.isValidSkipKey('Escape')) {
          return;
        }
        BossIntros.skip();
        return;
      }

      // 4.4. UI Menus
      if (GameState.STATE === GameStates.SETTINGS) {
        SettingsUI.handleKeyDown('Escape');
        return;
      }
      if (GameState.STATE === GameStates.ACHIEVEMENTS) {
        AchievementsUI.handleKeyDown('Escape');
        return;
      }
      if (GameState.STATE === GameStates.CODEX) {
        CodexUI.handleKeyDown('Escape');
        return;
      }
      if (GameState.STATE === GameStates.SANCTUM) {
        SanctumUI.handleKeyDown ? SanctumUI.handleKeyDown('Escape') : quitToMainMenu();
        return;
      }
      if (DeveloperSanctumUI.isGateOpen()) {
        DeveloperSanctumUI.closeGate();
        return;
      }
      if (GameState.STATE === GameStates.DEVELOPER_SANCTUM) {
        DeveloperSanctumUI.closeSanctum();
        return;
      }
      if (GameState.STATE === GameStates.PAUSED) {
        if (!GameState.CINEMATIC_ACTIVE && GameState.P && !GameState.P.dead && !GameState.P.dying) {
          resumeGame();
        }
        return;
      }
      if (GameState.STATE === GameStates.PLAYING) {
        if (GameState.MAP_EXPANDED) {
          GameState.MAP_EXPANDED = false;
          return;
        }
        pauseGame();
        return;
      }
      if (GameState.STATE === GameStates.TITLE) {
        MainMenu.handleEscape();
        return;
      }
      if (GameState.STATE === GameStates.DEATH_NORMAL || GameState.STATE === GameStates.DEATH_SANITY || GameState.STATE === GameStates.DYING || GameState.STATE === GameStates.DEATH_RESULTS || GameState.STATE === 'endcard') {
        quitToMainMenu();
        return;
      }
      return;
    }

    // Hotkeys during PAUSED state (S for Artificer, A for Monuments, Q for Abandon)
    if (GameState.STATE === GameStates.PAUSED) {
      if (PauseMenu.handleKeyDown(k)) {
        e.preventDefault();
        return;
      }
    }

    // 5. Game Speed Tuning (O / P)
    if (k === 'o' || k === 'O') {
      GameState.GAME_SPEED = Math.max(0.5, Math.round(((GameState.GAME_SPEED || 1.0) - 0.25) * 100) / 100);
      const s = SaveSystem.getSettings();
      s.gameSpeed = GameState.GAME_SPEED;
      SaveSystem.saveSettings(s);
      SoundManager.snd('menu_press');
    }
    if (k === 'p' || k === 'P') {
      GameState.GAME_SPEED = Math.min(2.0, Math.round(((GameState.GAME_SPEED || 1.0) + 0.25) * 100) / 100);
      const s = SaveSystem.getSettings();
      s.gameSpeed = GameState.GAME_SPEED;
      SaveSystem.saveSettings(s);
      SoundManager.snd('menu_press');
    }
  });

  // Initialize Game Subsystems
  Game.init(canvas);

  // Victory & Ending Pipeline Event Listeners
  EventBus.on('portal:victory', () => {
    EndingDispatcher.resolveAndStart();
  });
  EventBus.on('boss:final_defeated', () => {
    GameState.BOSS_PORTAL_UNLOCKED = true;
    GameState.BOSS_DEAD = true;
  });

  // Global browser test bridge
  if (typeof window !== 'undefined') {
    window.DB_GAME = Game;
    window.DB_LOOP = GameLoop;
    window.DB_STATE = GameState;
    window.DB_FLOOR = FloorManager;
    window.DB_DEATH = DeathCinematics;
    window.ShatteredMindCinematic = ShatteredMindCinematic;
    window.EndingDispatcher = EndingDispatcher;
    window.HeroCinematic = HeroCinematic;
    window.DeveloperSanctumUI = DeveloperSanctumUI;
    window.DB_ENDING = EndingCinematics;
    window.WardenDefeatCinematic = WardenDefeatCinematic;
    window.GorgarothCinematics = GorgarothCinematics;
    window.triggerGorgarothDefeat = () => {
      if (!GameState.BOSS || GameState.BOSS.id !== 'gorgaroth') {
        FloorManager.loadLevel(3);
      }
      setTimeout(() => {
        if (GameState.BOSS) {
          GameState.BOSS.hp = 0;
          GorgarothCinematics.startDefeat(GameState.BOSS);
        }
      }, 50);
    };
    window.triggerGorgarothKillRowan = () => {
      if (!GameState.BOSS || GameState.BOSS.id !== 'gorgaroth') {
        FloorManager.loadLevel(3);
      }
      setTimeout(() => {
        if (GameState.P) GameState.P.hp = 0;
        GorgarothCinematics.startPlayerDeath(GameState.BOSS, 'boss_gorgaroth');
      }, 50);
    };
    window.CinematicDirector = CinematicDirector;
    window.Renderer = Renderer;
    window.GameLoop = GameLoop;
    window.PathValidator = PathValidator;
    window.HallucinationSystem = HallucinationSystem;
    window.setSanity = (v) => {
      if (!GameState.P) {
        GameState.P = {
          x: 24, y: 16, fx: 1, fy: 0,
          san: 0, hp: 5, maxHp: 5,
          dead: false, dying: false,
          activeWeapon: 'sword'
        };
      }
      GameState.P.san = Math.max(0, Math.min(100, v));
      console.log(`[Debug] Sanity set to: ${GameState.P.san}%`);
      if (GameState.P.san <= 0) {
        SanitySystem.triggerSanityDeath();
      }
    };

    window.testSanityFloor = (floor) => {
      GameState.FLOOR = floor;
      GameState.LV = floor;
      const rate = SanitySystem.getBaseFloorDrain(floor);
      const killMult = SANITY_KILL_DEPTH_MULT[floor] || 0.55;
      console.log(`[Sanity Debug] Floor ${floor}: Base Drain = ${rate}/s, Kill Mult = ${killMult}x`);
    };
    window.startGame = startGame;
    window.resumeSavedRun = resumeSavedRun;
    window.pauseGame = pauseGame;
    window.resumeGame = resumeGame;
    window.quitToMainMenu = quitToMainMenu;
    window.FloorManager = FloorManager;
    window.CombatSystem = CombatSystem;
    window.LootSystem = LootSystem;
    window.doAttack = () => CombatSystem.doAttack();
    window.triggerWeaponAbility = () => CombatSystem.triggerWeaponAbility();
    window.switchWeaponSlot = (s) => WeaponInventory.switchWeaponSlot(s);
    window.WeaponInventory = WeaponInventory;
    window.CodexUI = CodexUI;
    window.SanctumUI = SanctumUI;
    window.SettingsUI = SettingsUI;
    window.AchievementsUI = AchievementsUI;
    window.AchievementSystem = AchievementSystem;
    window.ACHIEVEMENTS = ACHIEVEMENTS;
    window.ACHIEVEMENT_KEYS = ACHIEVEMENT_KEYS;
    window.BESTIARY_INFO = BESTIARY_INFO;
    window.SaveSystem = SaveSystem;
    window.drawPixelEye = drawPixelEye;
    window.RunResetManager = RunResetManager;
    window.ACHIEV_TOASTS = ACHIEV_TOASTS;
    window.ShatteredMindCinematic = ShatteredMindCinematic;
    window.DeathCinematics = DeathCinematics;
    window.LastEmberCinematic = LastEmberCinematic;
    window.EpilogueCinematic = EpilogueCinematic;
    window.MainMenu = MainMenu;
    window.Credits = Credits;
    window.PauseMenu = PauseMenu;
    window.GameState = GameState;
    window.GameStates = GameStates;
  }

  console.log('%c⚔️ DUNGEON BREAK — Modular Architecture v2.0 Initialized ⚔️', 'color: #fde68a; font-weight: bold; background: #060918; padding: 4px 10px; border-radius: 4px;');
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
}
