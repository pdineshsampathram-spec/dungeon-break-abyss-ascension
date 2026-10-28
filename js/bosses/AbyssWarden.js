// =====================================================================
//  DUNGEON BREAK — js/bosses/AbyssWarden.js
//  Floor 10 Final Encounter: The Abyss Warden (Legendary 3-Phase Trial)
//  Combines physical trials of Gorgaroth with spatial mastery of Void Boss
// =====================================================================

import { GameState } from '../core/GameState.js';
import { BOSS_CONFIGS } from '../data/bosses.js';
import { dealDamage } from '../combat/DamageSystem.js';
import { SoundManager } from '../audio/AudioManager.js';
import { ParticleRenderer } from '../rendering/ParticleRenderer.js';
import { TARGET_FPS } from '../core/Constants.js';
import { EventBus } from '../core/EventBus.js';

let _wardenAttackId = 10000;

export const AbyssWarden = {
  config: BOSS_CONFIGS.abyss_warden,

  tick(boss, dt) {
    const { P, PROJECTILES, BOSS_HAZARDS } = GameState;
    if (!boss || !boss.alive) return;

    // Sanity-zero / Cinematic lock guard:
    // If player is dead, dying, or in any cinematic (such as Shattered Mind), halt all combat actions
    if (!P || P.dead || P.dying || GameState.CINEMATIC_ACTIVE || GameState.STATE === 'death_sanity' || GameState.STATE === 'death_normal') {
      boss.vx = 0;
      boss.vy = 0;
      boss.isCleaving = false;
      boss.isSweeping = false;
      boss.isCataclysm = false;
      boss.slamWarning = null;
      return;
    }

    const dx = P.x - boss.x;
    const dy = P.y - boss.y;
    const dist = Math.hypot(dx, dy) || 1;
    boss.facing = dx >= 0 ? 1 : -1;

    // Room boundaries
    const room = GameState.ROOMS && GameState.ROOMS[0];
    const arenaCx = room ? room.cx : 24;
    const arenaCy = room ? room.cy : 16;

    // ─────────────────────────────────────────────────────────
    // 1. PHASE MANAGEMENT (Strict Thresholds: 100% -> 70% -> 35% -> 0%)
    // ─────────────────────────────────────────────────────────
    const hpPct = boss.hp / boss.maxHp;
    const prevPhase = boss.phase || 1;
    let targetPhase = 1;

    if (hpPct <= 0.35) {
      targetPhase = 3;
    } else if (hpPct <= 0.70) {
      targetPhase = 2;
    } else {
      targetPhase = 1;
    }

    // Trigger seamless phase escalation (finish active committed attack first)
    if (targetPhase > prevPhase && !boss.phaseTransitioning && !boss.isCleaving && !boss.isSweeping && !boss.isCataclysm) {
      boss.phase = targetPhase;
      boss.phaseTransitioning = true;
      boss.phaseTransitionTimer = 1.0;
      boss.vx = 0;
      boss.vy = 0;

      // Cinematic escalation impact
      GameState.CAM.shk = targetPhase === 3 ? 22 : 16;
      SoundManager.snd('boss_roar');
      SoundManager.snd('shockwave');
      ParticleRenderer.spawnRing(boss.x, boss.y, targetPhase === 3 ? '#ef4444' : '#a855f7');
      ParticleRenderer.spawnP(boss.x, boss.y, 35, {
        col: targetPhase === 3 ? '#dc2626' : '#9333ea',
        spd: 2.8,
        r: 4.5,
        star: true
      });
      EventBus.emit('boss:phase_change', { boss, phase: boss.phase });
    }

    // Handle brief phase transition state
    if (boss.phaseTransitioning) {
      boss.phaseTransitionTimer -= dt;
      if (boss.phaseTransitionTimer <= 0) {
        boss.phaseTransitioning = false;
      }
      return;
    }

    // ─────────────────────────────────────────────────────────
    // 2. EXHAUSTION / RECOVERY STATE (Punishable Opening)
    // ─────────────────────────────────────────────────────────
    if (boss.vulnTimer && boss.vulnTimer > 0) {
      boss.vulnTimer -= dt;
      boss.vx = 0;
      boss.vy = 0;
      boss.isExhausted = true;
      boss.isRecovering = true;
      if (boss.vulnTimer <= 0) {
        boss.isExhausted = false;
        boss.isRecovering = false;
      }
      return;
    } else {
      boss.isExhausted = false;
      boss.isRecovering = false;
    }

    // Cooldown timers
    if (boss.atkC > 0) boss.atkC -= dt;
    if (boss.projC > 0) boss.projC -= dt;
    if (boss.shiftC > 0) boss.shiftC -= dt;
    if (boss.quadFissureCooldown > 0) boss.quadFissureCooldown -= dt;
    if (boss.cataclysmCooldown > 0) boss.cataclysmCooldown -= dt;
    if (boss.hazardCooldown > 0) boss.hazardCooldown -= dt;

    // Movement speed scaled by phase
    const baseMoveSpd = boss.phase === 3 ? 1.45 : boss.phase === 2 ? 1.25 : 1.05;
    const isBusyAttacking = boss.isCleaving || boss.isSweeping || boss.isCataclysm || boss.isShifting;

    // Steering towards Rowan when not executing stationary attacks
    if (!isBusyAttacking && dist > 1.8) {
      boss.vx += (dx / dist) * baseMoveSpd * 0.16 * dt * TARGET_FPS;
      boss.vy += (dy / dist) * baseMoveSpd * 0.16 * dt * TARGET_FPS;
    }

    // ─────────────────────────────────────────────────────────
    // 3. PHASE 3 CLIMAX — THE ABYSSAL CATACLYSM (Ultimate Trial)
    // ─────────────────────────────────────────────────────────
    if (boss.phase === 3 && (boss.cataclysmCooldown || 0) <= 0 && !isBusyAttacking) {
      // Begin Cataclysm channel in central fighting ring
      boss.isCataclysm = true;
      boss.cataclysmTimer = 1.30;
      boss.cataclysmTotal = 1.30;
      boss.cataclysmCooldown = 15.0; // Deliberate pacing
      boss.cataclysmSafeRadius = 2.4; // Clearly marked safe sanctuary zone around Warden
      boss.cataclysmAttackId = ++_wardenAttackId;
      boss.vx = 0;
      boss.vy = 0;

      SoundManager.snd('boss_roar');
      SoundManager.playTone(60, 'sawtooth', 1.3, 0.25, 45);
      GameState.CAM.shk = 10;
    }

    // Cataclysm Execution
    if (boss.isCataclysm) {
      boss.cataclysmTimer -= dt;
      boss.vx = 0;
      boss.vy = 0;

      // Dark gathering particles inward to blade
      if (Math.random() < 0.6) {
        const ang = Math.random() * 6.28;
        const rad = 2.0 + Math.random() * 3.5;
        ParticleRenderer.spawnP(boss.x + Math.cos(ang) * rad, boss.y + Math.sin(ang) * rad, 1, {
          col: Math.random() < 0.5 ? '#ef4444' : '#1e1b4b',
          spd: -1.8,
          r: 2.2
        });
      }

      if (boss.cataclysmTimer <= 0) {
        boss.isCataclysm = false;
        // Detonation!
        GameState.CAM.shk = 24;
        SoundManager.snd('shockwave');
        SoundManager.playTone(40, 'triangle', 1.0, 0.4, 25);
        ParticleRenderer.spawnRing(boss.x, boss.y, '#ef4444');
        ParticleRenderer.spawnP(boss.x, boss.y, 45, { col: '#dc2626', spd: 3.5, r: 4.5 });

        // Counterplay check: Safe within inner sanctuary ring (dist <= 2.4)
        if (dist > boss.cataclysmSafeRadius && dist < 12.0) {
          dealDamage({ isBoss: true, attackId: boss.cataclysmAttackId, x: boss.x, y: boss.y }, P, 10, 'heavy');
        }

        // Guaranteed punish window for the player
        boss.vulnTimer = 1.8;
      }
      return;
    }

    // ─────────────────────────────────────────────────────────
    // 4. PHASE 2 & 3 — QUAD FISSURE SLAM (Chained Area Strike)
    // ─────────────────────────────────────────────────────────
    if (boss.phase >= 2 && (boss.quadFissureCooldown || 0) <= 0 && !isBusyAttacking && dist < 6.0) {
      boss.isQuadFissuring = true;
      boss.quadFissureTimer = 0.85;
      boss.quadFissureTotal = 0.85;
      boss.quadFissureCooldown = boss.phase === 3 ? 7.0 : 9.0;
      boss.quadFissureAttackId = ++_wardenAttackId;
      boss.vx = 0;
      boss.vy = 0;

      SoundManager.snd('weapon_clang');
    }

    if (boss.isQuadFissuring) {
      boss.quadFissureTimer -= dt;
      boss.vx = 0;
      boss.vy = 0;

      if (boss.quadFissureTimer <= 0) {
        boss.isQuadFissuring = false;
        GameState.CAM.shk = 16;
        SoundManager.snd('shockwave');
        ParticleRenderer.spawnRing(boss.x, boss.y, '#991b1b');

        // Check if Rowan intersects any of the 4 cardinal fissure lines (width 0.9)
        const pRelX = Math.abs(P.x - boss.x);
        const pRelY = Math.abs(P.y - boss.y);
        const onFissureLine = (pRelX < 0.9 && pRelY < 7.5) || (pRelY < 0.9 && pRelX < 7.5);

        if (onFissureLine) {
          dealDamage({ isBoss: true, attackId: boss.quadFissureAttackId, x: boss.x, y: boss.y }, P, 5, 'heavy');
        }

        // Brief punishable recovery after quad fissure
        boss.vulnTimer = 1.1;
      }
      return;
    }

    // ─────────────────────────────────────────────────────────
    // 5. PHASE 2 & 3 — ABYSSAL RUNIC HAZARDS (Controlled Pressure)
    // ─────────────────────────────────────────────────────────
    if (boss.phase >= 2 && (boss.hazardCooldown || 0) <= 0 && !isBusyAttacking) {
      boss.hazardCooldown = boss.phase === 3 ? 6.5 : 8.5;
      const hazardCount = boss.phase === 3 ? 3 : 2;

      for (let h = 0; h < hazardCount; h++) {
        const offsetAng = (h / hazardCount) * 6.28 + Math.random() * 0.5;
        const offsetDist = 2.5 + Math.random() * 3.0;
        const hx = Math.max(room.x + 2, Math.min(room.x + room.w - 2, arenaCx + Math.cos(offsetAng) * offsetDist));
        const hy = Math.max(room.y + 2, Math.min(room.y + room.h - 2, arenaCy + Math.sin(offsetAng) * offsetDist));

        if (!boss.runicHazards) boss.runicHazards = [];
        boss.runicHazards.push({
          x: hx,
          y: hy,
          r: 1.5,
          life: 4.8,
          maxLife: 4.8,
          attackId: ++_wardenAttackId
        });
      }
    }

    // Update existing runic hazards
    if (boss.runicHazards && boss.runicHazards.length > 0) {
      for (let i = boss.runicHazards.length - 1; i >= 0; i--) {
        const rz = boss.runicHazards[i];
        rz.life -= dt;
        // Hazard collision (damage tick with internal cooldown)
        if (Math.hypot(P.x - rz.x, P.y - rz.y) < rz.r && (rz.tickCooldown || 0) <= 0) {
          rz.tickCooldown = 1.0;
          dealDamage({ isBoss: true, attackId: rz.attackId, x: rz.x, y: rz.y }, P, 2, 'magic');
        }
        if (rz.tickCooldown > 0) rz.tickCooldown -= dt;
        if (rz.life <= 0) {
          boss.runicHazards.splice(i, 1);
        }
      }
    }

    // ─────────────────────────────────────────────────────────
    // 6. SPATIAL REPOSITION / SHADOW SHIFT (Void Boss-Inspired)
    // ─────────────────────────────────────────────────────────
    if (dist > 5.0 && (boss.shiftC || 0) <= 0 && !isBusyAttacking) {
      boss.shiftC = boss.phase === 3 ? 4.5 : 6.0;
      boss.isShifting = true;
      boss.shiftTimer = 0.35;
      boss.shiftDest = {
        x: P.x + (dx > 0 ? 2.5 : -2.5) + (Math.random() - 0.5) * 1.5,
        y: P.y + (Math.random() - 0.5) * 2.0
      };
      SoundManager.snd('void_swell');
      ParticleRenderer.spawnP(boss.x, boss.y, 20, { col: '#7c3aed', spd: 2.2, r: 3 });
    }

    if (boss.isShifting) {
      boss.shiftTimer -= dt;
      boss.vx = 0;
      boss.vy = 0;
      if (boss.shiftTimer <= 0) {
        boss.isShifting = false;
        boss.x = boss.shiftDest.x;
        boss.y = boss.shiftDest.y;
        ParticleRenderer.spawnRing(boss.x, boss.y, '#a855f7');
        ParticleRenderer.spawnP(boss.x, boss.y, 25, { col: '#c084fc', spd: 2.5, r: 3.5 });
        SoundManager.snd('shockwave');
        // Phase 2/3: Feint into quick sweep
        if (boss.phase >= 2) {
          boss.atkC = 0.2; // Immediate follow-up
        }
      }
      return;
    }

    // ─────────────────────────────────────────────────────────
    // 7. FOCUSED ABYSSAL VOLLEY (Controlled Spatial Projectiles)
    // ─────────────────────────────────────────────────────────
    if ((boss.projC || 0) <= 0 && dist >= 3.0 && dist <= 9.0 && !isBusyAttacking) {
      boss.projC = boss.phase === 3 ? 2.5 : boss.phase === 2 ? 3.5 : 4.5;
      const count = boss.phase === 3 ? 5 : 3;
      const baseAng = Math.atan2(dy, dx);
      const atkId = ++_wardenAttackId;

      for (let i = 0; i < count; i++) {
        const spreadAng = baseAng + (i - (count - 1) / 2) * 0.26;
        PROJECTILES.push({
          x: boss.x + Math.cos(spreadAng) * 0.8,
          y: boss.y + Math.sin(spreadAng) * 0.8,
          vx: Math.cos(spreadAng) * 8.2,
          vy: Math.sin(spreadAng) * 8.2,
          life: 0,
          maxLife: 4.0,
          damage: 3,
          fromPlayer: false,
          hit: false,
          isBoss: true,
          col: boss.phase === 3 ? '#ef4444' : '#a855f7',
          attackId: atkId
        });
      }
      SoundManager.snd('shockwave');
    }

    // ─────────────────────────────────────────────────────────
    // 8. HEAVY CLOSE-RANGE COMBAT (Gorgaroth-Inspired)
    // ─────────────────────────────────────────────────────────
    if (dist < 2.8 && (boss.atkC || 0) <= 0 && !isBusyAttacking) {
      boss.atkC = boss.phase === 3 ? 1.6 : boss.phase === 2 ? 2.1 : 2.6;

      const roll = Math.random();
      if (roll < 0.52) {
        // Attack A: Vertical Weapon Cleave
        boss.isCleaving = true;
        boss.cleaveTimer = 0.58;
        boss.cleaveTotal = 0.58;
        boss.cleaveAngle = Math.atan2(dy, dx);
        boss.cleaveAttackId = ++_wardenAttackId;
        boss.cleaveAnim = 0.01;
        boss.vx = 0;
        boss.vy = 0;
        SoundManager.snd('weapon_clang');
      } else {
        // Attack B: Wide Directional Sweep (180 degrees)
        boss.isSweeping = true;
        boss.sweepTimer = 0.52;
        boss.sweepTotal = 0.52;
        boss.sweepAngle = Math.atan2(dy, dx);
        boss.sweepAttackId = ++_wardenAttackId;
        boss.sweepAnim = 0.01;
        boss.vx = 0;
        boss.vy = 0;
        SoundManager.snd('melee_hit');
      }
    }

    // Vertical Cleave Execution
    if (boss.isCleaving) {
      boss.cleaveTimer -= dt;
      boss.cleaveAnim = 1.0 - (boss.cleaveTimer / boss.cleaveTotal);
      boss.vx = 0;
      boss.vy = 0;

      if (boss.cleaveTimer <= 0) {
        boss.isCleaving = false;
        boss.cleaveAnim = 0;
        GameState.CAM.shk = 15;
        SoundManager.snd('shockwave');
        SoundManager.snd('melee_hit');

        // Check linear rect danger zone
        const angDiff = Math.abs(Math.atan2(dy, dx) - boss.cleaveAngle);
        const normAngDiff = Math.min(angDiff, 6.28 - angDiff);
        if (dist <= 3.4 && normAngDiff < 0.65) {
          dealDamage({ isBoss: true, attackId: boss.cleaveAttackId, x: boss.x, y: boss.y }, P, 5, 'heavy');
        }

        ParticleRenderer.spawnRing(boss.x + Math.cos(boss.cleaveAngle) * 1.5, boss.y + Math.sin(boss.cleaveAngle) * 1.5, '#ef4444');
        boss.vulnTimer = 0.75; // Punishable opening
      }
      return;
    }

    // Wide Sweep Execution
    if (boss.isSweeping) {
      boss.sweepTimer -= dt;
      boss.sweepAnim = 1.0 - (boss.sweepTimer / boss.sweepTotal);
      boss.vx = 0;
      boss.vy = 0;

      if (boss.sweepTimer <= 0) {
        boss.isSweeping = false;
        boss.sweepAnim = 0;
        GameState.CAM.shk = 11;
        SoundManager.snd('melee_hit');

        if (dist <= 2.6) {
          dealDamage({ isBoss: true, attackId: boss.sweepAttackId, x: boss.x, y: boss.y }, P, 3, 'melee');
        }

        ParticleRenderer.spawnRing(boss.x, boss.y, '#dc2626');
        boss.vulnTimer = 0.65; // Punishable opening
      }
      return;
    }
  }
};

if (typeof window !== 'undefined') {
  window.AbyssWarden = AbyssWarden;
}
