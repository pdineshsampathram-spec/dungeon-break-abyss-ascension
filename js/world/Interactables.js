// =====================================================================
//  DUNGEON BREAK — js/world/Interactables.js
//  Traps, Survivors, Torches, & Environmental Interactions
// =====================================================================

import { GameState } from '../core/GameState.js';
import { dealDamage } from '../combat/DamageSystem.js';
import { SoundManager } from '../audio/AudioManager.js';
import { ParticleRenderer } from '../rendering/ParticleRenderer.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { EventBus } from '../core/EventBus.js';
import { SanitySystem, SANITY_REWARDS } from '../systems/SanitySystem.js';
import { isInOpeningSafeZone } from './DungeonGenerator.js';

export const Interactables = {
  tickTraps(dt) {
    const { TRAPS, P, ENE, LV } = GameState;
    if (!TRAPS || TRAPS.length === 0) return;

    // Authoritative runtime safe-zone guard: immediately purge any trap within safe zone
    if (TRAPS.some(t => isInOpeningSafeZone(t.x, t.y, LV || 1))) {
      GameState.TRAPS = TRAPS.filter(t => !isInOpeningSafeZone(t.x, t.y, LV || 1));
      if (GameState.TRAPS.length === 0) return;
    }

    GameState.TRAPS.forEach(t => {
      // Initialize lifecycle states if uninitialized
      if (!t.state) {
        t.state = 'idle';
        t.stateTimer = t.timer ? (t.timer % 1.5) : 0;
        t.activationCounter = 0;
      }

      t.timer = (t.timer || 0) + dt;
      t.stateTimer = (t.stateTimer || 0) + dt;

      const isSpike = t.type === 'spike';

      // Explicit readable durations
      const idleDur      = isSpike ? 1.40 : 1.80;
      const telegraphDur = isSpike ? 0.45 : 0.60;
      const activeDur    = isSpike ? 0.35 : 0.65;
      const recoveryDur  = isSpike ? 0.25 : 0.35;
      const cooldownDur  = isSpike ? 1.50 : 2.00;

      // ─────────────────────────────────────────────────────────
      // 1. STATE MACHINE TRANSITIONS
      // IDLE → TELEGRAPH → ACTIVE → RECOVERY → COOLDOWN → IDLE
      // ─────────────────────────────────────────────────────────
      if (t.state === 'idle') {
        // Proximity detection for spike pressure plates
        const pDist = Math.hypot(P.x - t.x, P.y - t.y);
        const enemyOnPlate = isSpike && ENE && ENE.some(e => e.alive && Math.hypot(e.x - t.x, e.y - t.y) < 0.55);
        const steppedOnPlate = isSpike && (pDist < 0.55 || enemyOnPlate);

        if (steppedOnPlate || t.stateTimer >= idleDur) {
          t.state = 'telegraph';
          t.stateTimer = 0;
          try {
            if (isSpike) {
              SoundManager.snd('trap_click');
            } else {
              SoundManager.snd('flame_ignite');
            }
          } catch (e) {}
        }
      } else if (t.state === 'telegraph') {
        if (t.stateTimer >= telegraphDur) {
          t.state = 'active';
          t.stateTimer = 0;
          t.activationCounter = (t.activationCounter || 0) + 1;
          t.attackId = `trap_${t.x}_${t.y}_${t.activationCounter}`;
          try {
            if (isSpike) {
              SoundManager.snd('melee_hit');
            } else {
              SoundManager.snd('shockwave');
            }
          } catch (e) {}
        }
      } else if (t.state === 'active') {
        if (t.stateTimer >= activeDur) {
          t.state = 'recovery';
          t.stateTimer = 0;
        }
      } else if (t.state === 'recovery') {
        if (t.stateTimer >= recoveryDur) {
          t.state = 'cooldown';
          t.stateTimer = 0;
        }
      } else if (t.state === 'cooldown') {
        if (t.stateTimer >= cooldownDur) {
          t.state = 'idle';
          t.stateTimer = 0;
        }
      }

      // ─────────────────────────────────────────────────────────
      // 2. ACTIVE HITBOX & DAMAGE APPLICATION (Strictly in 'active')
      // ─────────────────────────────────────────────────────────
      if (t.state === 'active') {
        const trapRadius = isSpike ? 0.50 : 0.55;
        const baseTrapDmg = isSpike ? ((LV || 1) >= 5 ? 2 : 1) : 2;

        // Player collision
        if (!P.dead && !P.shieldActive && P.dcd <= 0) {
          if (Math.abs(P.x - t.x) < trapRadius && Math.abs(P.y - t.y) < trapRadius) {
            dealDamage({
              isTrap: true,
              environmental: true,
              trapType: t.type,
              type: t.type,
              attackId: t.attackId,
              x: t.x,
              y: t.y
            }, P, baseTrapDmg, isSpike ? 'pierce' : 'fire');
          }
        }

        // Enemy collision (Knocking/baiting enemies into hazards deals tactical damage)
        if (ENE && ENE.length > 0) {
          for (let i = 0; i < ENE.length; i++) {
            const e = ENE[i];
            if (!e.alive) continue;
            if (Math.abs(e.x - t.x) < trapRadius && Math.abs(e.y - t.y) < trapRadius) {
              const enemyTrapDmg = isSpike ? 2 : 3;
              dealDamage({
                isTrap: true,
                environmental: true,
                type: t.type,
                attackId: `${t.attackId}_ene_${i}`,
                x: t.x,
                y: t.y
              }, e, enemyTrapDmg, isSpike ? 'pierce' : 'fire');
            }
          }
        }
      }
    });
  },

  collectAllies() {
    const { ALLIES, P } = GameState;
    ALLIES.forEach(a => {
      if (a.rescued) {
        if (a.rescueAnim > 0) a.rescueAnim -= GameState.DT || 0.016;
        return;
      }
      if (Math.abs(P.x - a.x) < 0.85 && Math.abs(P.y - a.y) < 0.85) {
        a.rescued = true;
        a.rescueAnim = 1.2;
        P.saved++;
        const rescueSan = SANITY_REWARDS.survivor || 8.0;
        SanitySystem.restore(rescueSan);
        SoundManager.snd('talent_unlock');

        ParticleRenderer.spawnRing(a.x, a.y, '#facc15');
        ParticleRenderer.spawnP(a.x, a.y, 20, { col: '#fef08a', spd: 1.8, r: 3.5 });
        ParticleRenderer.showFloatingText(`RESCUED! +${rescueSan} SANITY`, a.x, a.y - 0.7, '#4ade80', 14, true);

        // Phase 6 & 9: Authoritative single-run and lifetime survivor tracking
        if (!GameState.CURRENT_RUN_SURVIVORS) {
          GameState.CURRENT_RUN_SURVIVORS = { eligible: [], rescued: [] };
        }
        if (a.id && !GameState.CURRENT_RUN_SURVIVORS.rescued.includes(a.id)) {
          GameState.CURRENT_RUN_SURVIVORS.rescued.push(a.id);
        }

        // Authoritative lifetime rescue increment & sequential tier unlocks
        const totalSaved = SaveSystem.recordSurvivorRescue(1);

        // Sequential active tier progress feedback (only the currently active tier shows progress)
        if (!AchievementSystem.isUnlocked('savior')) {
          AchievementSystem.showProgress('savior', totalSaved, 5, 'Savior');
        } else if (!AchievementSystem.isUnlocked('savior_2')) {
          AchievementSystem.showProgress('savior_2', totalSaved, 10, 'Savior II');
        } else if (!AchievementSystem.isUnlocked('savior_3')) {
          AchievementSystem.showProgress('savior_3', totalSaved, 15, 'Savior III');
        }

        EventBus.emit('survivor:rescued', a);
      }
    });
  },

  tickShrines(dt) {
    const { SHRINES, P } = GameState;
    if (!SHRINES) return;

    SHRINES.forEach(s => {
      s.ph = (s.ph || 0) + dt * 2.0;

      // Auto-commune if walking directly onto shrine
      if (!s.used && Math.hypot(P.x - s.x, P.y - s.y) < 0.75) {
        this.activateShrine(s);
      }
    });
  },

  activateShrine(s) {
    if (!s || s.used) return false;
    const { P } = GameState;
    s.used = true;

    SoundManager.snd('talent_unlock');
    GameState.CAM.shk = 6;
    ParticleRenderer.spawnRing(s.x, s.y, s.col);
    ParticleRenderer.spawnP(s.x, s.y, 24, { col: s.col, spd: 2.2, r: 3.5 });

    if (s.type === 'fury') {
      P.furyBuffTimer = 45;
      P.dmgBoost = 1.5;
      ParticleRenderer.showFloatingText('🔥 +50% FURY BURST (45s)', s.x, s.y - 0.8, '#ef4444', 14, true);
    } else if (s.type === 'vitality') {
      P.maxHp += 2;
      P.hp = Math.min(P.maxHp, P.hp + 5);
      P.displayHp = P.hp;
      ParticleRenderer.showFloatingText('💧 +5 HP & VITALITY BOOST!', s.x, s.y - 0.8, '#10b981', 14, true);
    } else if (s.type === 'astral') {
      const lv = GameState.LV || 1;
      const astralSan = Math.max(20, Math.round(40 - (lv - 1) * 2));
      P.san = Math.min(100, P.san + astralSan);
      P.mindShieldTimer = 45;
      ParticleRenderer.showFloatingText(`✨ +${astralSan} SANITY & MIND SHIELD!`, s.x, s.y - 0.8, '#c084fc', 14, true);
    } else if (s.type === 'wind') {
      P.hasteBuffTimer = 45;
      ParticleRenderer.showFloatingText('💨 +35% HASTE & SPEED (45s)', s.x, s.y - 0.8, '#38bdf8', 14, true);
    }

    EventBus.emit('shrine:activated', s);
    return true;
  },

  interactNearbyShrine() {
    const { SHRINES, P } = GameState;
    if (!SHRINES) return false;
    for (const s of SHRINES) {
      if (!s.used && Math.hypot(P.x - s.x, P.y - s.y) < 1.4) {
        return this.activateShrine(s);
      }
    }
    return false;
  }
};

export const tickTraps = (dt) => Interactables.tickTraps(dt);
export const collectAllies = () => Interactables.collectAllies();
export const tickShrines = (dt) => Interactables.tickShrines(dt);
export const interactNearbyShrine = () => Interactables.interactNearbyShrine();

if (typeof window !== 'undefined') {
  window.tickTraps = tickTraps;
  window.collectAllies = collectAllies;
  window.tickShrines = tickShrines;
  window.interactNearbyShrine = interactNearbyShrine;
}
