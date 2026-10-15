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
import { Credits } from '../cinematics/Credits.js';
import { LastEmberCinematic } from '../cinematics/LastEmberCinematic.js';
import { EndingCinematics, ACTIVE_ENDING } from '../cinematics/EndingCinematics.js';
import { WardenDefeatCinematic } from '../cinematics/WardenDefeatCinematic.js';
import { DeathCinematics, ACTIVE_DEATH_CINEMATIC } from '../cinematics/DeathCinematics.js';
import { BossIntros } from '../cinematics/BossIntros.js';
import { CinematicDirector } from '../cinematics/CinematicDirector.js';
import { UITransitionManager } from './UITransitionManager.js';

export const UIManager = {
  init(canvas) {
    if (!canvas) return;

    let _lastHandled = 0;
    const trigger = (cx, cy) => {
      const now = performance.now();
      if (now - _lastHandled < 150) return;
      _lastHandled = now;
      AudioManager.init();
      this.handlePointerDown(cx, cy);
    };

    // Primary pointer event (handles mouse, touch, and stylus without duplicate firing)
    canvas.addEventListener('pointerdown', (e) => trigger(e.clientX, e.clientY));

    canvas.addEventListener('pointermove', (e) => {
      if (GameState.STATE === GameStates.DEATH_SANITY || (typeof window !== 'undefined' && window.ShatteredMindCinematic && window.ShatteredMindCinematic.isActive())) {
        const { mx, my } = InputManager.cssToGame(e.clientX, e.clientY);
        DeathCinematics.handleMouseMove(mx, my);
      }
    });

    // Global pointer/click fallback for margins & letterboxing
    window.addEventListener('pointerdown', (e) => {
      if (e.target && e.target.closest && e.target.closest('#rampage-cutscene-trigger-bar')) return;
      if (e.target !== canvas && (
        GameState.STATE === GameStates.TITLE ||
        GameState.STATE === GameStates.CINEMATIC ||
        GameState.STATE === GameStates.DYING ||
        GameState.STATE === GameStates.DEATH_NORMAL ||
        GameState.STATE === GameStates.DEATH_SANITY ||
        GameState.STATE === GameStates.DEATH_RESULTS ||
        GameState.STATE === GameStates.CREDITS ||
        GameState.STATE === 'credits' ||
        GameState.STATE === GameStates.LAST_EMBER ||
        GameState.STATE === 'last_ember' ||
        GameState.STATE === 'endcard'
      )) {
        trigger(e.clientX, e.clientY);
      }
    });
    window.addEventListener('click', (e) => {
      if (e.target && e.target.closest && e.target.closest('#rampage-cutscene-trigger-bar')) return;
      if (e.target !== canvas && (
        GameState.STATE === GameStates.TITLE ||
        GameState.STATE === GameStates.CINEMATIC ||
        GameState.STATE === GameStates.DYING ||
        GameState.STATE === GameStates.DEATH_NORMAL ||
        GameState.STATE === GameStates.DEATH_SANITY ||
        GameState.STATE === GameStates.DEATH_RESULTS ||
        GameState.STATE === GameStates.CREDITS ||
        GameState.STATE === 'credits' ||
        GameState.STATE === GameStates.LAST_EMBER ||
        GameState.STATE === 'last_ember' ||
        GameState.STATE === 'endcard'
      )) {
        trigger(e.clientX, e.clientY);
      }
    });

    // Touchstart directly for mobile responsiveness
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.changedTouches && e.changedTouches[0]) {
        const t = e.changedTouches[0];
        trigger(t.clientX, t.clientY);
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

    // 3. Cinematic Screen Transitions (fades / crossfades)
    UITransitionManager.draw(ctx);
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

    // 3.5. Cinematic Advance / Skip
    if (GameState.STATE === GameStates.BOSS_DEFEAT_CINEMATIC || GameState.STATE === 'boss_defeat_cinematic') {
      if (WardenDefeatCinematic.canSkip && WardenDefeatCinematic.canSkip()) {
        WardenDefeatCinematic.skip();
      }
      return;
    }
    // 4. Title State
    if (GameState.STATE === GameStates.TITLE) {
      MainMenu.handleClick(mx, my);
      return;
    }

    // 4.5. Boss Intro Cinematic Skip
    if (GameState.STATE === GameStates.BOSS_INTRO || GameState.BOSS_INTRO_ACTIVE) {
      BossIntros.skip();
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

    // 10. Credits State
    if (GameState.STATE === GameStates.CREDITS || GameState.STATE === 'credits' || (Credits && Credits.active)) {
      if (Credits.handleClick(mx, my)) return;
      return;
    }

    // 10.5. The Last Ember State
    if (GameState.STATE === GameStates.LAST_EMBER || GameState.STATE === 'last_ember' || (LastEmberCinematic && LastEmberCinematic.isActive())) {
      if (LastEmberCinematic.handleClick(mx, my)) return;
      return;
    }

    // 11. Cinematics (Opening & Endings)
    if (GameState.STATE === GameStates.CINEMATIC) {
      if (EndingCinematics.isActive()) {
        if (EndingCinematics.handleClick(mx, my)) return;
        return;
      }
      if (CinematicDirector.isActive()) {
        if (CinematicDirector.handleClick(mx, my)) return;
        return;
      }
    }



    // 12. Death Screens (Normal & Sanity)
    if (GameState.STATE === GameStates.DEATH_NORMAL || GameState.STATE === GameStates.DEATH_SANITY || GameState.STATE === GameStates.DYING || GameState.STATE === GameStates.DEATH_RESULTS || GameState.STATE === 'endcard') {
      if (DeathCinematics.handleClick(mx, my)) return;
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

if (typeof window !== 'undefined') {
  window.UIManager = UIManager;
}
