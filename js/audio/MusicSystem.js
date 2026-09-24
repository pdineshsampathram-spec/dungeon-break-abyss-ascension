// =====================================================================
//  DUNGEON BREAK — js/audio/MusicSystem.js
//  Dynamic music layer management and atmospheric tension controller
// =====================================================================

import { SoundManager } from './AudioManager.js';

export const MusicSystem = {
  update(dt) {
    SoundManager.updateMusicLayers(dt);
    SoundManager.tickHeartbeat(dt);
  },

  setBossLayer(vol) {
    SoundManager.setLayer('boss', vol);
  },

  setAmbientLayer(vol) {
    SoundManager.setLayer('ambient', vol);
  }
};
