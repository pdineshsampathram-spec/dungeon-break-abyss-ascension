// =====================================================================
//  DUNGEON BREAK — js/world/Dungeon.js
//  Dungeon world container & query coordinator
// =====================================================================

import { GameState } from '../core/GameState.js';
import { DungeonGenerator } from './DungeonGenerator.js';
import { BossArenaGenerator } from './BossArenaGenerator.js';
import { isBossFloor } from '../data/floors.js';

export const Dungeon = {
  getMap() {
    return GameState.MAP;
  },
  getRooms() {
    return GameState.ROOMS;
  },
  build(floor = GameState.LV) {
    if (isBossFloor(floor)) {
      BossArenaGenerator.build(floor);
    } else {
      DungeonGenerator.build();
    }
  }
};
