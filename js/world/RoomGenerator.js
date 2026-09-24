// =====================================================================
//  DUNGEON BREAK — js/world/RoomGenerator.js
//  Room carving and placement logic
// =====================================================================

export const RoomGenerator = {
  createRoom(x, y, w, h) {
    return {
      x,
      y,
      w,
      h,
      cx: Math.floor(x + w / 2),
      cy: Math.floor(y + h / 2)
    };
  },

  carveRoom(map, room) {
    for (let r = room.y; r < room.y + room.h; r++) {
      for (let c = room.x; c < room.x + room.w; c++) {
        if (map[r] && map[r][c] !== undefined) {
          map[r][c] = 0;
        }
      }
    }
  }
};
