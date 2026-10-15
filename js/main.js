// =====================================================================
//  DUNGEON BREAK — js/main.js
//  Authoritative Main Application Bootstrap & Lifecycle Entry Point
// =====================================================================

import { Game } from './core/Game.js';
import { GameLoop } from './core/GameLoop.js';
import { Renderer } from './rendering/Renderer.js';
import { GameState, GameStates } from './core/GameState.js';
import { InputManager } from './core/InputManager.js';
import { LW, LH } from './core/Constants.js';
import { CombatSystem } from './combat/CombatSystem.js';
import { WeaponInventory } from './weapons/WeaponInventory.js';
import { HUD } from './ui/HUD.js';
import { PauseMenu, pauseGame, resumeGame, quitToMainMenu, SettingsUI, AchievementsUI } from './ui/PauseMenu.js';
import { CodexUI } from './ui/CodexUI.js';
import { SanctumUI } from './ui/SanctumUI.js';
import { MainMenu, startGame, resumeSavedRun } from './ui/MainMenu.js';
import { CinematicDirector } from './cinematics/CinematicDirector.js';
import { DeathCinematics } from './cinematics/DeathCinematics.js';
import { ShatteredMindCinematic } from './cinematics/ShatteredMindCinematic.js';
import { HeroCinematic } from './cinematics/HeroCinematic.js';
import { BetrayalCinematic } from './cinematics/BetrayalCinematic.js';
import { RampageCinematic } from './cinematics/RampageCinematic.js';
import { EndingCinematics, EndingDispatcher, ACTIVE_ENDING } from './cinematics/EndingCinematics.js';
import { WardenDefeatCinematic } from './cinematics/WardenDefeatCinematic.js';
import { GorgarothCinematics } from './cinematics/GorgarothCinematics.js';
import { Credits } from './cinematics/Credits.js';
import { LastEmberCinematic } from './cinematics/LastEmberCinematic.js';
import { BossIntros } from './cinematics/BossIntros.js';
import { FloorManager } from './world/FloorManager.js';
import { Portal } from './world/Portal.js';
import { Interactables } from './world/Interactables.js';
import { EventBus } from './core/EventBus.js';
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

  // Responsive scaling
  function resizeCanvas() {
    const sw = window.innerWidth;
    const sh = window.innerHeight;
    const scale = Math.min(sw / LW, sh / LH);
    const cw = Math.floor(LW * scale);
    const ch = Math.floor(LH * scale);
    const offX = Math.floor((sw - cw) / 2);
    const offY = Math.floor((sh - ch) / 2);

    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    canvas.style.left = offX + 'px';
    canvas.style.top = offY + 'px';

    InputManager.setCanvasScale(scale);
  }
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));
  resizeCanvas();

  // Keyboard shortcut dispatcher
  window.addEventListener('keydown', (e) => {
    const k = e.key;

    // 0. Global Developer & Replay Ending Shortcuts (Works unconditionally in ANY game state)
    // Rampage: Shift+R, Alt+R, or Mac Option+R (®)
    // Betrayal: Shift+B, Alt+B, or Mac Option+B (∫)
    // Hero: Shift+H, Alt+H, or Mac Option+H (˙)
    const isShiftOrAlt = (e.shiftKey || e.altKey) && !e.ctrlKey && !e.metaKey;
    const isInputFocused = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');

    if (isShiftOrAlt && !isInputFocused) {
      if (e.code === 'KeyR' || e.key === 'r' || e.key === 'R' || e.key === '®') {
        e.preventDefault();
        e.stopPropagation();
        if (typeof window.triggerRampageEnding === 'function') {
          window.triggerRampageEnding();
        } else if (typeof RampageCinematic !== 'undefined' && RampageCinematic.start) {
          RampageCinematic.start();
        }
        return;
      }
      if (e.code === 'KeyB' || e.key === 'b' || e.key === 'B' || e.key === '∫') {
        e.preventDefault();
        e.stopPropagation();
        if (typeof window.triggerBetrayalEnding === 'function') {
          window.triggerBetrayalEnding();
        } else if (typeof BetrayalCinematic !== 'undefined' && BetrayalCinematic.start) {
          BetrayalCinematic.start();
        }
        return;
      }
      if (e.code === 'KeyH' || e.key === 'h' || e.key === 'H' || e.key === '˙') {
        e.preventDefault();
        e.stopPropagation();
        if (typeof window.triggerHeroEnding === 'function') {
          window.triggerHeroEnding();
        } else if (typeof HeroCinematic !== 'undefined' && HeroCinematic.start) {
          HeroCinematic.start();
        }
        return;
      }
    }

    // 0. Title keyboard navigation (Up / Down / Enter / Space)
    if (GameState.STATE === GameStates.TITLE) {
      if (k === 'ArrowUp' || k === 'w' || k === 'W') {
        e.preventDefault();
        MainMenu.navigateFocus(-1);
        return;
      }
      if (k === 'ArrowDown' || k === 's' || k === 'S') {
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

    // 0.1. Cinematic skip/advance (Enter or Space)
    if (k === 'Enter' || k === ' ' || e.code === 'Space') {
      if (GameState.STATE === GameStates.BOSS_DEFEAT_CINEMATIC || GameState.STATE === 'boss_defeat_cinematic') {
        e.preventDefault();
        if (WardenDefeatCinematic.canSkip && WardenDefeatCinematic.canSkip()) {
          WardenDefeatCinematic.skip();
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

    // 0.2. Escape to close menu modals or skip boss intro
    if (k === 'Escape') {
      if (GameState.STATE === GameStates.TITLE) {
        if (MainMenu.handleEscape()) {
          e.preventDefault();
          return;
        }
      }
      if (GameState.STATE === GameStates.BOSS_INTRO || GameState.BOSS_INTRO_ACTIVE) {
        e.preventDefault();
        BossIntros.skip();
        return;
      }
    }

    // 0.5. Resume saved run shortcut on Title (plain 'r' key only, without Shift/Alt)
    if ((k === 'r' || k === 'R') && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey && GameState.STATE === GameStates.TITLE) {
      e.preventDefault();
      resumeSavedRun();
      return;
    }

    // 0.7. Weapon Replacement Modal Active (1, 2, 3 replace, Esc/X/G discard)
    const repModal = GameState.ACTIVE_WEAPON_REPLACE_MODAL || GameState.pendingWeaponDrop;
    if (repModal) {
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
      if (k === 'Escape' || k === 'x' || k === 'X' || k === 'g' || k === 'G') {
        e.preventDefault();
        WeaponInventory.discardReplacementWeapon();
        return;
      }
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
      if (GameState.STATE === GameStates.CINEMATIC) {
        if (EndingCinematics.isActive()) {
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
      if (GameState.STATE === GameStates.PLAYING) {
        pauseGame();
      } else if (GameState.STATE === GameStates.PAUSED) {
        resumeGame();
      } else if (GameState.STATE === GameStates.SETTINGS) {
        SettingsUI.handleKeyDown('Escape');
      } else if (GameState.STATE === GameStates.ACHIEVEMENTS) {
        AchievementsUI.handleKeyDown('Escape');
      } else if (GameState.STATE === GameStates.CODEX) {
        CodexUI.handleKeyDown('Escape');
      } else if (GameState.STATE === GameStates.SANCTUM) {
        SanctumUI.handleKeyDown ? SanctumUI.handleKeyDown('Escape') : quitToMainMenu();
      } else if (GameState.STATE === GameStates.DEATH_NORMAL || GameState.STATE === GameStates.DEATH_SANITY || GameState.STATE === GameStates.DYING || GameState.STATE === GameStates.DEATH_RESULTS || GameState.STATE === 'endcard') {
        quitToMainMenu();
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
      GameState.GAME_SPEED = Math.max(0.5, (GameState.GAME_SPEED || 1.0) - 0.25);
    }
    if (k === 'p' || k === 'P') {
      GameState.GAME_SPEED = Math.min(2.0, (GameState.GAME_SPEED || 1.0) + 0.25);
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
    window.heroSeek = (t, andPause = false) => HeroCinematic.seek(t, andPause);
    window.triggerHeroEnding = () => { GameState.IS_DEBUG_ENDING = true; EndingDispatcher.reset(); EndingDispatcher.resolveAndStart('hero'); };
    window.startHeroEnding = () => { GameState.IS_DEBUG_ENDING = true; EndingDispatcher.reset(); EndingDispatcher.resolveAndStart('hero'); };
    window.BetrayalCinematic = BetrayalCinematic;
    window.betrayalSeek = (t, andPause = false) => BetrayalCinematic.seek(t, andPause);
    window.triggerBetrayalEnding = () => { GameState.IS_DEBUG_ENDING = true; EndingDispatcher.reset(); EndingDispatcher.resolveAndStart('betrayal'); };
    window.startBetrayalEnding = () => { GameState.IS_DEBUG_ENDING = true; EndingDispatcher.reset(); EndingDispatcher.resolveAndStart('betrayal'); };
    window.RampageCinematic = RampageCinematic;
    window.rampageSeek = (t, andPause = false) => RampageCinematic.seek(t, andPause);
    window.triggerRampageEnding = () => { GameState.IS_DEBUG_ENDING = true; EndingDispatcher.reset(); EndingDispatcher.resolveAndStart('rampage'); };
    window.startRampageEnding = () => { GameState.IS_DEBUG_ENDING = true; EndingDispatcher.reset(); EndingDispatcher.resolveAndStart('rampage'); };
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

    // Development-only sanity testing shortcuts: Alt+1 (100%), Alt+2 (50%), Alt+3 (20%), Alt+4 (5%), Alt+0 (0% / Shattered Mind)
    // Shortcuts for ending replay: Shift+R / Alt+R (Rampage), Shift+B / Alt+B (Betrayal), Shift+H / Alt+H (Hero)
    // Supports both Windows/Linux (Digit0-4) and macOS Option keys (¡, ™, £, ¢, º, ®, ∫, ˙)
    window.addEventListener('keydown', (e) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === '1' || e.code === 'Digit1' || e.key === '¡') { window.setSanity(100); }
        else if (e.key === '2' || e.code === 'Digit2' || e.key === '™') { window.setSanity(50); }
        else if (e.key === '3' || e.code === 'Digit3' || e.key === '£') { window.setSanity(20); }
        else if (e.key === '4' || e.code === 'Digit4' || e.key === '¢') { window.setSanity(5); }
        else if (e.key === '0' || e.code === 'Digit0' || e.key === 'º') { window.setSanity(0); }
        else if (e.key === 'r' || e.code === 'KeyR' || e.key === '®') {
          if (typeof window.triggerRampageEnding === 'function') {
            e.preventDefault();
            window.triggerRampageEnding();
          }
        }
        else if (e.key === 'b' || e.code === 'KeyB' || e.key === '∫') {
          if (typeof window.triggerBetrayalEnding === 'function') {
            e.preventDefault();
            window.triggerBetrayalEnding();
          }
        }
        else if (e.key === 'h' || e.code === 'KeyH' || e.key === '˙') {
          if (typeof window.triggerHeroEnding === 'function') {
            e.preventDefault();
            window.triggerHeroEnding();
          }
        }
      } else if (e.shiftKey && (e.code === 'KeyR' || e.key === 'R' || e.key === 'r')) {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
        if (typeof window.triggerRampageEnding === 'function') {
          e.preventDefault();
          window.triggerRampageEnding();
        }
      } else if (e.shiftKey && (e.code === 'KeyB' || e.key === 'B')) {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
        if (typeof window.triggerBetrayalEnding === 'function') {
          e.preventDefault();
          window.triggerBetrayalEnding();
        }
      } else if (e.shiftKey && (e.code === 'KeyH' || e.key === 'H')) {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
        if (typeof window.triggerHeroEnding === 'function') {
          e.preventDefault();
          window.triggerHeroEnding();
        }
      }
    });

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
    window.doAttack = () => CombatSystem.doAttack();
    window.triggerWeaponAbility = () => CombatSystem.triggerWeaponAbility();
    window.switchWeaponSlot = (s) => WeaponInventory.switchWeaponSlot(s);
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
