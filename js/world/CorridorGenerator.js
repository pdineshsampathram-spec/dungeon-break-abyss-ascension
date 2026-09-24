// =====================================================================
//  DUNGEON BREAK — js/world/CorridorGenerator.js
//  Corridor connection and path carving between rooms
// =====================================================================

export const CorridorGenerator = {
  carveCorridor(map, x1, y1, x2, y2) {
    let cx = x1;
    let cy = y1;

    // Horizontal then vertical
    while (cx !== x2) {
      if (map[cy] && map[cy][cx] !== undefined) map[cy][cx] = 0;
      cx += cx < x2 ? 1 : -1;
    }
    while (cy !== y2) {
      if (map[cy] && map[cy][cx] !== undefined) map[cy][cx] = 0;
      cy += cy < y2 ? 1 : -1;
    }
    if (map[cy] && map[cy][cx] !== undefined) map[cy][cx] = 0;
  }
};
