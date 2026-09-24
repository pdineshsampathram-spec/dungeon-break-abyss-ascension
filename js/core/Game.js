// =====================================================================
//  DUNGEON BREAK — js/core/Game.js
//  Authoritative Game Facade & Subsystem Lifecycle Coordinator
// =====================================================================

import { GameState, GameStates } from './GameState.js';
import { GameLoop } from './GameLoop.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { AudioManager } from '../audio/AudioManager.js';
import { InputManager } from './InputManager.js';
import { UIManager } from '../ui/UIManager.js';
import { FloorManager } from '../world/FloorManager.js';
import { LW, LH } from './Constants.js';

export const Game = {
  canvas: null,
  ctx: null,

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Load persistent profile (souls, prestige, talents, achievements, bestiary)
    SaveSystem.init();

    // Initialize systems
    InputManager.init(canvas);
    UIManager.init(canvas);

    // Initial title state
    GameState.setState(GameStates.TITLE);

    // Start Authoritative Loop
    GameLoop.start(this.ctx);
  },

  start() {
    AudioManager.init();
    GameState.resetPlayer();
    GameState.LV = 1;
    FloorManager.loadLevel(1);
    GameState.setState(GameStates.PLAYING);
  },

  pause() {
    if (GameState.STATE === GameStates.PLAYING) {
      GameState.setState(GameStates.PAUSED);
    }
  },

  resume() {
    if (GameState.STATE === GameStates.PAUSED) {
      GameState.setState(GameStates.PLAYING);
    }
  }
};
