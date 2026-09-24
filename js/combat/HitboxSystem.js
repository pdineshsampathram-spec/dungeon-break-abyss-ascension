// =====================================================================
//  DUNGEON BREAK — js/combat/HitboxSystem.js
//  Spatial Hitbox, Circle, and Angular Cone Hit Detection
// =====================================================================

export const HitboxSystem = {
  checkCircle(x1, y1, x2, y2, radius) {
    return Math.hypot(x2 - x1, y2 - y1) < radius;
  },

  checkCone(px, py, facingAngle, tx, ty, maxDist, maxAngleDiff) {
    const dist = Math.hypot(tx - px, ty - py);
    if (dist > maxDist) return false;

    const targetAngle = Math.atan2(ty - py, tx - px);
    const diff = Math.abs(((targetAngle - facingAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    return diff < maxAngleDiff;
  }
};
