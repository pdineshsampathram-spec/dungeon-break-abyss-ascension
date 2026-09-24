// =====================================================================
//  DUNGEON BREAK — js/ui/UIManager.js
//  Authoritative Master UI Orchestration & Event Dispatcher
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { InputManager } from '../core/InputManager.js';
import { AudioManager } from '../audio/AudioManager.js';
import { CombatSystem } from '../combat/CombatSystem.js';
import { WeaponInventory } from '../weapons/WeaponInventory.js';
import { HUD } from './HUD.js';
import { MainMenu } from './MainMenu.js';
import { PauseMenu, SettingsUI, AchievementsUI, pauseGame, resumeGame, quitToMainMenu } from './PauseMenu.js';
import { SanctumUI } from './SanctumUI.js';
import { CodexUI, drawLoreModal, drawMemoryEchoModal, handleMemoryEchoClick } from './CodexUI.js';
import { InventoryUI } from './InventoryUI.js';
import { MobileControls } from './MobileControls.js';
import { LW, LH } from '../core/Constants.js';
import { FloorManager } from '../world/FloorManager.js';

export const UIManager = {
  init(canvas) {
    if (!canvas) return;

    // Attach pointer dispatcher
    canvas.addEventListener('pointerdown', (e) => {
      AudioManager.init();
      this.handlePointerDown(e.clientX, e.clientY);
    });

    // Also support touchstart directly for responsive mobile touches
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      AudioManager.init();
      if (e.changedTouches && e.changedTouches[0]) {
        const t = e.changedTouches[0];
        this.handlePointerDown(t.clientX, t.clientY);
      }
    }, { passive: false });

    // Initialize mobile virtual joystick and action buttons
    MobileControls.init();
  },

  renderUI(ctx, dt = 0.016) {
    if (!ctx) return;

    // 1. Modals that take precedence over all states
    if (GameState.ACTIVE_WEAPON_REPLACE_MODAL) {
      InventoryUI.drawWeaponReplaceModal(ctx);
      return;
    }

    if (GameState.ACTIVE_MEMORY_ECHO) {
      drawMemoryEchoModal(ctx, dt);
      return;
    }

    if (GameState.ACTIVE_LORE_MODAL) {
      drawLoreModal(ctx);
      return;
    }

    // 2. State-specific full UI screens
    switch (GameState.STATE) {
      case GameStates.TITLE:
        MainMenu.draw(ctx, dt);
        break;

      case GameStates.PAUSED:
        PauseMenu.draw(ctx);
        break;

      case GameStates.SETTINGS:
        SettingsUI.draw(ctx, dt);
        break;

      case GameStates.ACHIEVEMENTS:
        AchievementsUI.draw(ctx, dt);
        break;

      case GameStates.SANCTUM:
        SanctumUI.draw(ctx, dt);
        break;

      case GameStates.CODEX:
        CodexUI.draw(ctx, dt);
        break;

      case GameStates.PLAYING:
        HUD.draw(ctx);
        break;

      default:
        break;
    }
  },

  handlePointerDown(clientX, clientY) {
    const { mx, my } = InputManager.cssToGame(clientX, clientY);

    // 1. Weapon Replace Modal
    if (GameState.ACTIVE_WEAPON_REPLACE_MODAL) {
      if (InventoryUI.handleWeaponReplaceClick(mx, my)) return;
    }

    // 2. Memory Echo Modal
    if (GameState.ACTIVE_MEMORY_ECHO) {
      if (handleMemoryEchoClick(mx, my)) return;
    }

    // 3. Lore Scroll Modal Dismiss
    if (GameState.ACTIVE_LORE_MODAL) {
      GameState.ACTIVE_LORE_MODAL = null;
      return;
    }

    // 4. Title State
    if (GameState.STATE === GameStates.TITLE) {
      MainMenu.handleClick(mx, my);
      return;
    }

    // 5. Pause State
    if (GameState.STATE === GameStates.PAUSED) {
      if (PauseMenu.handleClick(mx, my)) return;
      resumeGame();
      return;
    }

    // 6. Settings State
    if (GameState.STATE === GameStates.SETTINGS) {
      SettingsUI.handleClick(mx, my);
      return;
    }

    // 7. Achievements State
    if (GameState.STATE === GameStates.ACHIEVEMENTS) {
      AchievementsUI.handleClick(mx, my);
      return;
    }

    // 8. Sanctum State
    if (GameState.STATE === GameStates.SANCTUM) {
      SanctumUI.handleClick(mx, my);
      return;
    }

    // 9. Codex State
    if (GameState.STATE === GameStates.CODEX) {
      CodexUI.handleClick(mx, my);
      return;
    }

    // 10. Death Screens
    if (GameState.STATE === GameStates.DEATH_NORMAL || GameState.STATE === GameStates.DEATH_SANITY || GameState.STATE === 'endcard') {
      const btnW = 160, btnH = 46;
      const btn1X = LW / 2 - btnW - 15;
      const btn2X = LW / 2 + 15;
      const btnY = 320;
      if (mx >= btn1X && mx <= btn1X + btnW && my >= btnY && my <= btnY + btnH) {
        // Retry
        GameState.resetPlayer();
        FloorManager.loadLevel(1);
        GameState.setState(GameStates.PLAYING);
        return;
      }
      if (mx >= btn2X && mx <= btn2X + btnW && my >= btnY && my <= btnY + btnH) {
        quitToMainMenu();
        return;
      }
      return;
    }

    // 11. Playing State
    if (GameState.STATE === GameStates.PLAYING) {
      // Check HUD weapon slots (1, 2, 3)
      const hudSlotStartX = 200;
      const hudSlotY = LH - 44;
      const hudSlotW = 38;
      const hudSlotGap = 6;
      for (let i = 0; i < 3; i++) {
        const sx = hudSlotStartX + i * (hudSlotW + hudSlotGap);
        if (mx >= sx && mx <= sx + hudSlotW && my >= hudSlotY && my <= hudSlotY + 36) {
          WeaponInventory.switchWeaponSlot(i);
          return;
        }
      }

      // Minimap toggle touch
      if (mx >= LW - 134 && mx <= LW - 14 && my >= 70 && my <= 154) {
        HUD.toggleMinimap();
        return;
      }

      // Pause button in HUD (top right)
      if (mx >= LW - 54 && my <= 54) {
        pauseGame();
        return;
      }

      // Ability badge click
      if (mx >= LW / 2 - 60 && mx <= LW / 2 + 60 && my >= LH - 135 && my <= LH - 95) {
        CombatSystem.triggerWeaponAbility();
        return;
      }

      // Default gameplay world attack
      CombatSystem.doAttack();
    }
  }
};
