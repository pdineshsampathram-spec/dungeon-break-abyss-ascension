// =====================================================================
//  DUNGEON BREAK — js/main.js
//  Authoritative Main Application Bootstrap & Lifecycle Entry Point
// =====================================================================

import { Game } from './core/Game.js';
import { GameState, GameStates } from './core/GameState.js';
import { InputManager } from './core/InputManager.js';
import { LW, LH } from './core/Constants.js';
import { CombatSystem } from './combat/CombatSystem.js';
import { WeaponInventory } from './weapons/WeaponInventory.js';
import { HUD } from './ui/HUD.js';
import { pauseGame, resumeGame, quitToMainMenu } from './ui/PauseMenu.js';
import { startGame } from './ui/MainMenu.js';
import { CinematicDirector } from './cinematics/CinematicDirector.js';
import { EventBus } from './core/EventBus.js';

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
    InputManager.setCanvasScale(scale);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Keyboard shortcut dispatcher
  window.addEventListener('keydown', (e) => {
    const k = e.key;

    // 1. Weapon Slot Hotkeys (1, 2, 3)
    if (k === '1') { WeaponInventory.switchWeaponSlot(0); return; }
    if (k === '2') { WeaponInventory.switchWeaponSlot(1); return; }
    if (k === '3') { WeaponInventory.switchWeaponSlot(2); return; }

    // 2. Combat Hotkeys
    if (k === ' ' && GameState.STATE === GameStates.PLAYING) {
      e.preventDefault();
      CombatSystem.doAttack();
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
      if (GameState.STATE === GameStates.PLAYING) {
        pauseGame();
      } else if (GameState.STATE === GameStates.PAUSED) {
        resumeGame();
      } else if (GameState.STATE === GameStates.SANCTUM || GameState.STATE === GameStates.CODEX || GameState.STATE === GameStates.SETTINGS || GameState.STATE === GameStates.ACHIEVEMENTS) {
        GameState.setState(GameStates.TITLE);
      }
      return;
    }

    // 5. Enter
    if (k === 'Enter') {
      if (GameState.STATE === GameStates.TITLE) {
        startGame();
      } else if (GameState.STATE === GameStates.CINEMATIC) {
        CinematicDirector.advance();
      }
      return;
    }

    // 6. Game Speed Tuning (O / P)
    if (k === 'o' || k === 'O') {
      GameState.GAME_SPEED = Math.max(0.5, (GameState.GAME_SPEED || 1.0) - 0.25);
    }
    if (k === 'p' || k === 'P') {
      GameState.GAME_SPEED = Math.min(2.0, (GameState.GAME_SPEED || 1.0) + 0.25);
    }
  });

  // Initialize Game Subsystems
  Game.init(canvas);

  // Global browser test bridge
  if (typeof window !== 'undefined') {
    window.DB_GAME = Game;
    window.DB_STATE = GameState;
    window.startGame = startGame;
    window.pauseGame = pauseGame;
    window.resumeGame = resumeGame;
    window.quitToMainMenu = quitToMainMenu;
    window.doAttack = () => CombatSystem.doAttack();
    window.triggerWeaponAbility = () => CombatSystem.triggerWeaponAbility();
    window.switchWeaponSlot = (s) => WeaponInventory.switchWeaponSlot(s);
  }

  console.log('%c⚔️ DUNGEON BREAK — Modular Architecture v2.0 Initialized ⚔️', 'color: #fde68a; font-weight: bold; background: #060918; padding: 4px 10px; border-radius: 4px;');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
