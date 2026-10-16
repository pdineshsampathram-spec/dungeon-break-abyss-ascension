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
  },

  // Sword: clean medium directional arc
  checkArc(px, py, facingAngle, tx, ty, range, arcAngle = 1.1, targetRadius = 0.45) {
    const dist = Math.hypot(tx - px, ty - py);
    if (dist > range + targetRadius) return false;
    if (dist < targetRadius + 0.3) return true; // Close proximity hit
    const targetAngle = Math.atan2(ty - py, tx - px);
    const diff = Math.abs(((targetAngle - facingAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    return diff < arcAngle;
  },

  // Axe: massive wide execution sweep
  checkSweep(px, py, facingAngle, tx, ty, range, sweepAngle = 1.65, targetRadius = 0.5) {
    const dist = Math.hypot(tx - px, ty - py);
    if (dist > range + targetRadius) return false;
    if (dist < targetRadius + 0.4) return true;
    const targetAngle = Math.atan2(ty - py, tx - px);
    const diff = Math.abs(((targetAngle - facingAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    return diff < sweepAngle;
  },

  // Dagger: short rapid narrow cone
  checkRapidCone(px, py, facingAngle, tx, ty, range, coneAngle = 0.75, targetRadius = 0.4) {
    const dist = Math.hypot(tx - px, ty - py);
    if (dist > range + targetRadius) return false;
    if (dist < targetRadius + 0.25) return true;
    const targetAngle = Math.atan2(ty - py, tx - px);
    const diff = Math.abs(((targetAngle - facingAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    return diff < coneAngle;
  },

  // Spear: long thin piercing thrust / rectangle
  checkThrust(px, py, fx, fy, tx, ty, reach = 2.6, width = 0.9, targetRadius = 0.45) {
    const mag = Math.hypot(fx, fy) || 1;
    const nfx = fx / mag;
    const nfy = fy / mag;

    const toX = tx - px;
    const toY = ty - py;

    // Dot product = distance along thrust direction
    const dot = toX * nfx + toY * nfy;
    // Cross product magnitude = perpendicular distance from thrust line
    const cross = Math.abs(toX * -nfy + toY * nfx);

    if (dot < -0.2 || dot > reach + targetRadius) return false;
    return cross < (width / 2 + targetRadius);
  },

  // Authoritative weapon hitbox resolver
  checkWeaponHitbox(weapon, px, py, fx, fy, tx, ty, targetRadius = 0.45) {
    if (!weapon) return false;
    const facingAngle = Math.atan2(fy, fx);
    const range = weapon.range || 1.5;

    switch (weapon.id) {
      case 'axe':
        return this.checkSweep(px, py, facingAngle, tx, ty, range, weapon.arc || 1.65, targetRadius);
      case 'dagger':
        return this.checkRapidCone(px, py, facingAngle, tx, ty, range, weapon.arc || 0.75, targetRadius);
      case 'spear':
        return this.checkThrust(px, py, fx, fy, tx, ty, range, 0.9, targetRadius);
      case 'sword':
      default:
        return this.checkArc(px, py, facingAngle, tx, ty, range, weapon.arc || 1.1, targetRadius);
    }
  }
};
