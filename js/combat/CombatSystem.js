// =====================================================================
//  DUNGEON BREAK — js/combat/CombatSystem.js
//  Authoritative Player Weapon Attacks, Ability Execution, & Hit Detection
// =====================================================================

import { GameState } from '../core/GameState.js';
import { WeaponInventory } from '../weapons/WeaponInventory.js';
import { WeaponEffects } from '../weapons/WeaponEffects.js';
import { dealDamage, getNextAttackId } from './DamageSystem.js';
import { ProjectileSystem } from './ProjectileSystem.js';
import { triggerHitStop } from './HitStop.js';
import { isBossFloor } from '../data/floors.js';
import { SoundManager } from '../audio/AudioManager.js';
import { EventBus } from '../core/EventBus.js';

export const CombatSystem = {
  doAttack() {
    const { P, ENE, BOSS, LV } = GameState;
    if (P.acd > 0 || P.dead) return;

    const w = WeaponInventory.getActiveWeapon();
    const cd = w.cooldown !== undefined ? w.cooldown : (w.cd !== undefined ? w.cd : 0.32);
    const baseDmg = w.damage !== undefined ? w.damage : (w.dmg !== undefined ? w.dmg : 2);
    const range = w.range !== undefined ? w.range : 1.4;

    P.acd = cd;
    P.aanim = cd;

    const ang = Math.atan2(P.fy, P.fx);
    const dmg = Math.round(baseDmg * (P.dmgBoost || 1));
    const currentSwingId = getNextAttackId();
    const attackSource = { isPlayer: true, x: P.x, y: P.y, attackId: currentSwingId, type: 'melee' };

    // Ranged / Bow Attack
    if (w.type === 'ranged' || w.id === 'bow') {
      GameState.CAM.shk = 3;
      ProjectileSystem.spawnProjectile(P.x, P.y, Math.cos(ang) * 9.5, Math.sin(ang) * 9.5, dmg, false, true);
      SoundManager.snd('bow_shoot');
      EventBus.emit('combat:attack', { weapon: w, type: 'ranged' });
      return;
    }

    // Melee attack variants
    GameState.CAM.shk = (w.id === 'axe' ? 14 : w.id === 'spear' ? 6 : w.id === 'dagger' ? 2 : 4);
    WeaponEffects.addSwingTrail(P.x, P.y, ang, w);

    let hitAny = false;

    // Check Boss hit
    if (BOSS && BOSS.alive && isBossFloor(LV)) {
      const dist = Math.hypot(P.x - BOSS.x, P.y - BOSS.y);
      if (dist < w.range + 0.8) {
        if (dealDamage(attackSource, BOSS, dmg, 'melee')) {
          hitAny = true;
        }
      }
    }

    // Check Enemy hits (strictly single-hit per swing tracked)
    for (let j = ENE.length - 1; j >= 0; j--) {
      const e = ENE[j];
      if (!e.alive) continue;
      const dist = Math.hypot(P.x - e.x, P.y - e.y);
      let hit = false;

      if (w.id === 'spear') {
        const dot = (e.x - P.x) * P.fx + (e.y - P.y) * P.fy;
        const cross = Math.abs((e.x - P.x) * P.fy - (e.y - P.y) * P.fx);
        if (dot > 0 && dot < w.range + 0.5 && cross < 0.75) hit = true;
      } else {
        if (dist < w.range) {
          const eAng = Math.atan2(e.y - P.y, e.x - P.x);
          const diffAng = Math.abs(((eAng - ang + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
          if (diffAng < (w.id === 'axe' ? 1.6 : w.id === 'dagger' ? 0.7 : 1.2)) hit = true;
        }
      }

      if (hit) {
        const actualDmg = w.id === 'dagger' ? Math.max(1, Math.round(dmg * 0.65)) : dmg;
        const dType = w.id === 'axe' ? 'heavy' : (w.id === 'spear' ? 'pierce' : 'melee');
        if (dealDamage(attackSource, e, actualDmg, dType)) {
          hitAny = true;
        }
      }
    }

    if (hitAny) {
      triggerHitStop(w.id === 'axe' ? 0.09 : 0.04);
    }

    EventBus.emit('combat:attack', { weapon: w, type: 'melee', hitAny });
  },

  fireBowQuick() {
    const bowSlot = GameState.weaponSlots.findIndex(w => w && w.id === 'bow');
    if (bowSlot !== -1 && GameState.activeWeaponSlot !== bowSlot) {
      WeaponInventory.switchWeaponSlot(bowSlot);
    }
    if (WeaponInventory.getActiveWeapon().id === 'bow') {
      this.doAttack();
    }
  },

  triggerWeaponAbility() {
    const { P } = GameState;
    if (P.dead) return;
    const w = WeaponInventory.getActiveWeapon();

    // Dash / burst ability
    if (w.id === 'sword') {
      P.vx += P.fx * 8;
      P.vy += P.fy * 8;
      this.doAttack();
    } else if (w.id === 'axe') {
      GameState.CAM.shk = 16;
      this.doAttack();
    } else if (w.id === 'dagger') {
      P.vx += P.fx * 12;
      P.vy += P.fy * 12;
      P.dcd = 0.5;
    } else {
      this.doAttack();
    }
  }
};

export const doAttack = () => CombatSystem.doAttack();
export const fireBowQuick = () => CombatSystem.fireBowQuick();
export const triggerWeaponAbility = () => CombatSystem.triggerWeaponAbility();

if (typeof window !== 'undefined') {
  window.doAttack = doAttack;
  window.fireBowQuick = fireBowQuick;
  window.triggerWeaponAbility = triggerWeaponAbility;
}
