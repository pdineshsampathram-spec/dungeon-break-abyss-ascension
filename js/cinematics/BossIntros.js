// =====================================================================
//  DUNGEON BREAK — js/cinematics/BossIntros.js
//  Authoritative High-Resolution Boss Cinematics (Intros & Defeats)
//  - Gorgaroth Intro (Iron Fissure ground-level pan to weapon raise)
//  - Malakor Intro (Void Sanctum rift, materialization, & false copies)
//  - Abyss Warden Intro (11-Shot epic throne awakening)
//  - Gorgaroth Defeat (Armor crack, cleaver drop, chains shake, portal)
//  - Malakor Defeat (Shield shatter, energy escape, void dissolve, portal)
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, roundRect } from '../core/Constants.js';
import { SoundManager } from '../audio/AudioManager.js';
import { CinematicRenderer, CINEMATIC_W, CINEMATIC_H } from './CinematicRenderer.js';
import { CinematicCharacterRenderer } from './CinematicCharacterRenderer.js';
import { ParticleRenderer } from '../rendering/ParticleRenderer.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import { EventBus } from '../core/EventBus.js';
import { Camera } from '../rendering/Camera.js';
import { GorgarothCinematics } from './GorgarothCinematics.js';
import { CinematicSafety } from './CinematicSafety.js';
import { SaveSystem } from '../systems/SaveSystem.js';

export const CINEMATIC_BANNER = {
  active: false,
  timer: 0,
  duration: 3.5,
  title: '',
  subtitle: '',
  col: '#fde68a'
};

export let ACTIVE_BOSS_INTRO = null;

export const BossIntros = {
  getActiveIntro() {
    return ACTIVE_BOSS_INTRO;
  },

  isActive() {
    return !!ACTIVE_BOSS_INTRO && !ACTIVE_BOSS_INTRO.done;
  },

  triggerBanner(title, subtitle, col = '#fde68a', duration = 3.5) {
    CINEMATIC_BANNER.active = true;
    CINEMATIC_BANNER.timer = 0;
    CINEMATIC_BANNER.duration = duration;
    CINEMATIC_BANNER.title = title;
    CINEMATIC_BANNER.subtitle = subtitle;
    CINEMATIC_BANNER.col = col;
  },

  // ─────────────────────────────────────────────────────────────
  // 1. START BOSS INTRODUCTION CINEMATIC
  // ─────────────────────────────────────────────────────────────
  start(bossId, options = {}) {
    const { BOSS } = GameState;
    const bId = bossId || (BOSS && BOSS.id) || 'gorgaroth';
    const isReplay = (typeof options === 'boolean') ? options : !!options.isReplay;
    const introId = 'boss_intro_' + bId;

    CinematicSafety.startCinematic(introId, typeof options === 'object' ? options : { isReplay });
    if (!isReplay && SaveSystem && SaveSystem.recordCinematicUnlock) {
      SaveSystem.recordCinematicUnlock(introId);
    }

    GameState.setState(GameStates.BOSS_INTRO || 'boss_intro');
    GameState.BOSS_INTRO_ACTIVE = true;
    GameState.BOSS_AI_ACTIVE = false;

    // Reset cinematic camera & letterbox
    CinematicRenderer.resetCamera();
    CinematicRenderer.letterbox.amount = 0;
    CinematicRenderer.letterbox.target = 1.0;

    let duration = 7.0;
    let title = 'GORGAROTH';
    let subtitle = 'THE IRON JAILER';
    let col = '#f59e0b';

    if (bId === 'gorgaroth') {
      duration = 12.0;
      title = 'GORGAROTH';
      subtitle = 'THE IRON JAILER';
      col = '#f97316';
      if (BOSS) {
        BOSS.introRevealStage = 'hidden';
        BOSS.introWeaponAlpha = 0;
      }
      if (GameState.P) {
        CinematicRenderer.setShot(CINEMATIC_W / 2, CINEMATIC_H * 0.52, 1.25, 0, true);
        GameState.CAM.tx = GameState.P.x;
        GameState.CAM.ty = GameState.P.y;
        GameState.CAM.tz = 1.25;
      }
    } else if (bId === 'malakor') {
      duration = 7.6;
      title = 'MALAKOR';
      subtitle = 'THE VOID WEAVER';
      col = '#c084fc';
      if (BOSS) {
        // The procedural sprite resolves in stages instead of popping into
        // existence at the first camera push.
        BOSS.introMaterialize = 0;
      }
      // Camera starts wide on empty void arena
      CinematicRenderer.setShot(CINEMATIC_W / 2 - 80, CINEMATIC_H * 0.46, 1.3, 0.02, true);
    } else {
      // Abyss Warden 8-Shot sequence
      duration = 12.8;
      title = 'THE ABYSS WARDEN';
      subtitle = 'THE FINAL TRIAL';
      col = '#ef4444';
      if (BOSS) {
        BOSS.introRevealStage = 'silhouette';
        BOSS.introWeaponAlpha = 0;
      }
      CinematicRenderer.setShot(CINEMATIC_W / 2, CINEMATIC_H * 0.44, 1.2, 0, true);
    }

    ACTIVE_BOSS_INTRO = {
      type: 'intro',
      bossId: bId,
      timer: 0,
      duration,
      title,
      subtitle,
      col,
      soundCues: {},
      flashAlpha: 0,
      done: false
    };

    GameState.ACTIVE_BOSS_INTRO = ACTIVE_BOSS_INTRO;
    GameState.BOSS_INTRO_WING_SPREAD = 0.15;
    GameState.BOSS_INTRO_EYE_GLOW = 0;
    if (typeof window !== 'undefined') {
      window.BOSS_INTRO_WING_SPREAD = 0.15;
      window.BOSS_INTRO_EYE_GLOW = 0;
    }

    if (GameState.P) {
      GameState.CAM.tx = GameState.P.x;
      GameState.CAM.ty = GameState.P.y;
      GameState.CAM.tz = 1.25;
    }

    EventBus.emit('boss:intro_started', { bossId: bId });
  },

  // ─────────────────────────────────────────────────────────────
  // 2. START BOSS DEFEAT CINEMATIC (GORGAROTH & MALAKOR)
  // ─────────────────────────────────────────────────────────────
  startDefeat(boss, options = {}) {
    const bId = (typeof boss === 'string' ? boss : (boss && boss.id)) || (GameState.BOSS && GameState.BOSS.id) || 'gorgaroth';

    if (bId === 'gorgaroth') {
      GorgarothCinematics.startDefeat(boss, options);
      return;
    }

    const isReplay = (typeof options === 'boolean') ? options : !!options.isReplay;
    const defeatId = 'boss_defeat_' + bId;

    CinematicSafety.startCinematic(defeatId, typeof options === 'object' ? options : { isReplay });
    if (!isReplay && SaveSystem && SaveSystem.recordCinematicUnlock) {
      SaveSystem.recordCinematicUnlock(defeatId);
    }

    GameState.setState(GameStates.BOSS_INTRO || 'boss_intro');
    GameState.BOSS_INTRO_ACTIVE = true;
    GameState.BOSS_AI_ACTIVE = false;

    CinematicRenderer.resetCamera();
    CinematicRenderer.letterbox.amount = 0;
    CinematicRenderer.letterbox.target = 1.0;

    let duration = 5.6;
    if (bId === 'gorgaroth') {
      duration = 11.5;
      if (GameState.BOSS) {
        GameState.BOSS.defeatState = 'unstable';
      }
    }
    let col = bId === 'malakor' ? '#c084fc' : '#f97316';

    ACTIVE_BOSS_INTRO = {
      type: 'defeat',
      bossId: bId,
      timer: 0,
      duration,
      title: bId === 'malakor' ? 'MALAKOR VANQUISHED' : 'GORGAROTH VANQUISHED',
      subtitle: 'THE ABYSS CRACKS OPEN',
      col,
      soundCues: {},
      flashAlpha: 0.8,
      done: false
    };

    GameState.ACTIVE_BOSS_INTRO = ACTIVE_BOSS_INTRO;
    EventBus.emit('boss:defeat_cinematic_started', { bossId: bId });
  },

  // ─────────────────────────────────────────────────────────────
  // 3. MASTER CINEMATIC TICK
  // ─────────────────────────────────────────────────────────────
  tick(dt) {
    // Tick Banner
    if (CINEMATIC_BANNER.active) {
      CINEMATIC_BANNER.timer += dt;
      if (CINEMATIC_BANNER.timer >= CINEMATIC_BANNER.duration) {
        CINEMATIC_BANNER.active = false;
      }
    }

    if (!ACTIVE_BOSS_INTRO) return;
    const intro = ACTIVE_BOSS_INTRO;
    intro.timer += dt;
    const t = intro.timer;

    // Tick camera lerp and motes
    CinematicRenderer.update(dt);

    if (intro.flashAlpha > 0) {
      intro.flashAlpha = Math.max(0, intro.flashAlpha - dt * 2.5);
    }

    const cx = CINEMATIC_W / 2;
    const cy = CINEMATIC_H * 0.46;

    // =========================================================
    // INTROS TIMELINE
    // =========================================================
    if (intro.type === 'intro') {
      // ───────────────────────────────────────────────────────
      // A. GORGAROTH INTRO (6-SHOT ATMOSPHERIC REVEAL SEQUENCE)
      // ───────────────────────────────────────────────────────
      if (intro.bossId === 'gorgaroth') {
        const { BOSS, P } = GameState;

        // SHOT 1 (0.0s - 2.0s): Rowan enters the arena. The room is almost completely silent.
        if (t < 2.0) {
          if (P) {
            GameState.CAM.tx = P.x;
            GameState.CAM.ty = P.y;
            GameState.CAM.tz = 1.25;
          }
          if (BOSS) {
            BOSS.introRevealStage = 'hidden';
            BOSS.introWeaponAlpha = 0;
          }
          CinematicRenderer.setShot(cx, cy + 30, 1.25, 0);
        }
        // SHOT 2 (2.0s - 4.2s): The enormous iron gate behind Rowan slowly closes mechanically.
        else if (t < 4.2) {
          if (P) {
            GameState.CAM.tx = P.x;
            GameState.CAM.ty = P.y + 0.35;
            GameState.CAM.tz = 1.35;
          }
          const gateProg = Math.min(1, Math.max(0, (t - 2.0) / 1.8));
          if (GameState.GATE) {
            GameState.GATE.dropProgress = gateProg;
            GameState.GATE.state = gateProg >= 1 ? 'closed' : 'moving';
            if (gateProg >= 1) GameState.GATE.solid = true;
          }
          if (!intro.soundCues.gateSlam && t >= 3.8) {
            intro.soundCues.gateSlam = true;
            SoundManager.snd('gate_slam');
            Camera.shake(14);
            GameState.CAM.shk = Math.max(GameState.CAM.shk || 0, 14);
          }
          CinematicRenderer.setShot(cx, cy + 20, 1.35, 0);
        }
        // SHOT 3 (4.2s - 6.4s): Camera slowly moves deeper into chamber. Chains hanging from above, one slowly moves.
        else if (t < 6.4) {
          const pan = Math.min(1, (t - 4.2) / 2.2);
          if (BOSS && P) {
            GameState.CAM.tx = P.x + (BOSS.x - P.x) * pan * 0.65;
            GameState.CAM.ty = P.y + (BOSS.y - P.y) * pan * 0.65;
            GameState.CAM.tz = 1.35 + 0.15 * pan;
          }
          if (!intro.soundCues.chainSway && t >= 5.2) {
            intro.soundCues.chainSway = true;
            SoundManager.snd('chain_rattle');
          }
          CinematicRenderer.setShot(cx, cy, 1.45, 0);
        }
        // SHOT 4 (6.4s - 8.0s): Heavy metallic sound. Gorgaroth's weapon slowly becomes visible.
        else if (t < 8.0) {
          if (BOSS) {
            GameState.CAM.tx = BOSS.x;
            GameState.CAM.ty = BOSS.y;
            GameState.CAM.tz = 1.55;
            BOSS.introRevealStage = 'weapon';
            BOSS.introWeaponAlpha = Math.min(1, (t - 6.4) / 1.0);
          }
          if (!intro.soundCues.weaponDrop && t >= 6.6) {
            intro.soundCues.weaponDrop = true;
            SoundManager.snd('weapon_clang');
            Camera.shake(12);
            GameState.CAM.shk = Math.max(GameState.CAM.shk || 0, 12);
          }
          CinematicRenderer.setShot(cx, cy - 10, 1.55, 0);
        }
        // SHOT 5 (8.0s - 10.0s): Reveal Gorgaroth gradually from darkness (silhouette -> armor -> eyes -> full).
        else if (t < 10.0) {
          if (BOSS) {
            GameState.CAM.tx = BOSS.x;
            GameState.CAM.ty = BOSS.y;
            GameState.CAM.tz = 1.6;
            if (t < 8.6) {
              BOSS.introRevealStage = 'silhouette';
            } else if (t < 9.2) {
              BOSS.introRevealStage = 'armor';
            } else if (t < 9.7) {
              BOSS.introRevealStage = 'eyes';
              if (!intro.soundCues.eyesIgnite) {
                intro.soundCues.eyesIgnite = true;
                SoundManager.snd('furnace_ignite');
                Camera.shake(6);
              }
            } else {
              BOSS.introRevealStage = 'full';
            }
          }
          CinematicRenderer.setShot(cx, cy - 15, 1.6, 0);
        }
        // SHOT 6 (10.0s - 12.0s): Boss UI appears: GORGAROTH — THE IRON JAILER with existing health-bar visual language.
        else if (t < 12.0) {
          if (BOSS && P) {
            const frameProg = Math.min(1, (t - 10.0) / 1.5);
            GameState.CAM.tx = BOSS.x * (1 - frameProg * 0.3) + P.x * (frameProg * 0.3);
            GameState.CAM.ty = BOSS.y * (1 - frameProg * 0.3) + P.y * (frameProg * 0.3);
            GameState.CAM.tz = 1.6 - 0.35 * frameProg;
            BOSS.introRevealStage = 'full';
          }
          if (!intro.soundCues.roar && t >= 10.1) {
            intro.soundCues.roar = true;
            SoundManager.snd('boss_roar');
            Camera.shake(20);
            GameState.CAM.shk = Math.max(GameState.CAM.shk || 0, 20);
          }
          if (!intro.soundCues.banner && t >= 10.1) {
            intro.soundCues.banner = true;
            this.triggerBanner(intro.title, intro.subtitle, intro.col, 3.5);
          }
          CinematicRenderer.setShot(cx, cy, 1.35, 0);
        } else {
          this.finish();
          return;
        }
      }

      // ───────────────────────────────────────────────────────
      // B. MALAKOR INTRO (8-Stage Compact Atmospheric Emergence)
      // ───────────────────────────────────────────────────────
      else if (intro.bossId === 'malakor') {
        const { BOSS, P } = GameState;
        if (BOSS && P) {
          // 1. Rowan enters arena, camera holds and begins slow push toward chamber center
          if (t < 1.4) {
            BOSS.introMaterialize = 0;
            GameState.CAM.tx = P.x;
            GameState.CAM.ty = P.y;
            GameState.CAM.tz = 1.25;
          }
          // 2. Ambience recedes, small spatial distortion begins at boss emergence locus
          else if (t < 3.0) {
            const panProg = Math.min(1, (t - 1.4) / 1.6);
            BOSS.introMaterialize = 0.10 + panProg * 0.14;
            GameState.CAM.tx = P.x + (BOSS.x - P.x) * panProg * 0.85;
            GameState.CAM.ty = P.y + (BOSS.y - P.y) * panProg * 0.85;
            GameState.CAM.tz = 1.25 + 0.3 * panProg;
          }
          // 3. Distortion becomes unstable and vibrates into an angular void rift
          else if (t < 4.8) {
            const expProg = Math.min(1, (t - 3.0) / 1.8);
            BOSS.introMaterialize = 0.24 + expProg * 0.36;
            GameState.CAM.tx = BOSS.x;
            GameState.CAM.ty = BOSS.y;
            GameState.CAM.tz = 1.55;
          }
          // 4. Void Boss resolves in stages: silhouette, void core, cracked mask and slit eyes
          else if (t < 6.4) {
            const resProg = Math.min(1, (t - 4.8) / 1.6);
            BOSS.introMaterialize = 0.60 + resProg * 0.40;
            GameState.CAM.tx = BOSS.x;
            GameState.CAM.ty = BOSS.y;
            GameState.CAM.tz = 1.65;
          }
          // 5. Boss settles into world position, camera pulls back to combat framing
          else {
            BOSS.introMaterialize = 1.0;
            const returnProg = Math.min(1, (t - 6.4) / 1.2);
            GameState.CAM.tx = BOSS.x + (P.x - BOSS.x) * returnProg * 0.5;
            GameState.CAM.ty = BOSS.y + (P.y - BOSS.y) * returnProg * 0.5;
            GameState.CAM.tz = 1.65 - 0.55 * returnProg;
          }
        }

        if (t < 1.4) {
          CinematicRenderer.setShot(cx - 50, cy + 20, 1.35, 0.01);
        } else if (t < 3.0) {
          if (!intro.soundCues.rift) {
            intro.soundCues.rift = true;
            SoundManager.snd('portal_enter');
            CinematicRenderer.addShake(6);
          }
          CinematicRenderer.setShot(cx, cy, 1.5, 0);
        } else if (t < 4.8) {
          if (!intro.soundCues.unstable) {
            intro.soundCues.unstable = true;
            SoundManager.snd('void_swell');
            CinematicRenderer.addShake(10);
            GameState.CAM.shk = Math.max(GameState.CAM.shk || 0, 10);
          }
          const rot = Math.sin((t - 3.0) * 2.0) * 0.03;
          CinematicRenderer.setShot(cx, cy - 10, 1.6, rot);
        } else if (t < 6.4) {
          if (!intro.soundCues.materialize) {
            intro.soundCues.materialize = true;
            SoundManager.snd('shockwave');
            CinematicRenderer.addShake(12);
            GameState.CAM.shk = Math.max(GameState.CAM.shk || 0, 12);
          }
          CinematicRenderer.setShot(cx, cy - 12, 1.65, 0);
        } else if (t < 7.6) {
          if (!intro.soundCues.roar) {
            intro.soundCues.roar = true;
            SoundManager.snd('boss_roar');
            this.triggerBanner(intro.title, intro.subtitle, intro.col, 3.2);
          }
          CinematicRenderer.setShot(cx, cy - 10, 1.5, 0);
        } else {
          this.finish();
          return;
        }
      }

      // ───────────────────────────────────────────────────────
      // C. ABYSS WARDEN INTRO (8 SHOTS — 12.8s)
      // ───────────────────────────────────────────────────────
      else {
        const { BOSS, P } = GameState;

        // SHOT 1 (0.0 – 2.0s): THE THRESHOLD
        // Wide entrance shot framing Rowan and the colossal silent hall
        if (t < 2.0) {
          if (P) {
            GameState.CAM.tx = P.x;
            GameState.CAM.ty = P.y - 1.0;
            GameState.CAM.tz = 1.15;
          }
          if (BOSS) {
            BOSS.introRevealStage = 'silhouette';
            BOSS.introWeaponAlpha = 0;
          }
          GameState.BOSS_INTRO_WING_SPREAD = 0.15;
          GameState.BOSS_INTRO_EYE_GLOW = 0.0;
          if (typeof window !== 'undefined') {
            window.BOSS_INTRO_WING_SPREAD = 0.15;
            window.BOSS_INTRO_EYE_GLOW = 0.0;
          }

          if (!intro.soundCues.s1) {
            intro.soundCues.s1 = true;
            SoundManager.snd('heartbeat');
          }
          CinematicRenderer.setShot(cx, cy + 32, 1.15, 0, t < 0.1);
        }

        // SHOT 2 (2.0 – 3.8s): THE DUNGEON FALLS SILENT
        // Slow push along carpet, faint chain scrape
        else if (t < 3.8) {
          const p2 = (t - 2.0) / 1.8;
          if (P && BOSS) {
            GameState.CAM.tx = P.x + (BOSS.x - P.x) * (0.15 + p2 * 0.25);
            GameState.CAM.ty = P.y + (BOSS.y - P.y) * (0.15 + p2 * 0.25);
            GameState.CAM.tz = 1.25;
          }
          if (BOSS) {
            BOSS.introRevealStage = 'silhouette';
            BOSS.introWeaponAlpha = 0;
          }

          if (!intro.soundCues.s2) {
            intro.soundCues.s2 = true;
            SoundManager.snd('iron_scrape');
          }
          CinematicRenderer.setShot(cx, cy + 12, 1.25, 0);
        }

        // SHOT 3 (3.8 – 5.4s): SOMETHING MOVES
        // Iron mechanism reverberation, camera tilts to monumental dais
        else if (t < 5.4) {
          if (BOSS) {
            GameState.CAM.tx = BOSS.x;
            GameState.CAM.ty = BOSS.y + 1.8;
            GameState.CAM.tz = 1.35;
            BOSS.introRevealStage = 'silhouette';
            BOSS.introWeaponAlpha = 0;
          }

          if (!intro.soundCues.s3) {
            intro.soundCues.s3 = true;
            SoundManager.snd('shockwave');
            CinematicRenderer.addShake(6);
          }
          CinematicRenderer.setShot(cx, cy - 12, 1.35, 0);
        }

        // SHOT 4 (5.4 – 7.2s): THE SHADOW
        // Warden silhouette on throne, crimson slit eyes ignite
        else if (t < 7.2) {
          const eyeProg = Math.min(1.0, (t - 5.4) / 1.3);
          GameState.BOSS_INTRO_EYE_GLOW = eyeProg;
          if (typeof window !== 'undefined') window.BOSS_INTRO_EYE_GLOW = eyeProg;

          if (BOSS) {
            GameState.CAM.tx = BOSS.x;
            GameState.CAM.ty = BOSS.y;
            GameState.CAM.tz = 1.55;
            BOSS.introRevealStage = 'silhouette';
            BOSS.introWeaponAlpha = 0;
          }

          if (!intro.soundCues.s4) {
            intro.soundCues.s4 = true;
            SoundManager.snd('eldritch_whisper');
            SoundManager.snd('heartbeat');
            CinematicRenderer.addShake(4);
          }
          CinematicRenderer.setShot(cx, cy - 28, 1.55, 0);
        }

        // SHOT 5 (7.2 – 9.0s): THE REVEAL
        // Rises from throne, horns and obsidian armor revealed, wings unfurl
        else if (t < 9.0) {
          const wingProg = Math.min(1.0, 0.2 + (t - 7.2) * 0.55);
          GameState.BOSS_INTRO_WING_SPREAD = wingProg;
          GameState.BOSS_INTRO_EYE_GLOW = 1.0;
          if (typeof window !== 'undefined') {
            window.BOSS_INTRO_WING_SPREAD = wingProg;
            window.BOSS_INTRO_EYE_GLOW = 1.0;
          }

          if (BOSS) {
            GameState.CAM.tx = BOSS.x;
            GameState.CAM.ty = BOSS.y - 0.4;
            GameState.CAM.tz = 1.65;
            BOSS.introRevealStage = 'emerging';
            BOSS.introWeaponAlpha = Math.min(1.0, (t - 7.5) * 0.8);
          }

          if (!intro.soundCues.s5) {
            intro.soundCues.s5 = true;
            SoundManager.snd('boss_roar');
            CinematicRenderer.addShake(12);
            GameState.CAM.shk = Math.max(GameState.CAM.shk || 0, 12);
          }
          CinematicRenderer.setShot(cx, cy - 44, 1.65, 0);
        }

        // SHOT 6 (9.0 – 10.6s): THE WEIGHT
        // Lifts executioner blade, steps down, floor impact
        else if (t < 10.6) {
          if (BOSS) {
            GameState.CAM.tx = BOSS.x;
            GameState.CAM.ty = BOSS.y;
            GameState.CAM.tz = 1.60;
            BOSS.introRevealStage = 'weapon_lift';
            BOSS.introWeaponAlpha = 1.0;
          }

          if (!intro.soundCues.s6) {
            intro.soundCues.s6 = true;
            SoundManager.snd('impact_hit');
            SoundManager.snd('weapon_clang');
            CinematicRenderer.addShake(16);
            GameState.CAM.shk = Math.max(GameState.CAM.shk || 0, 16);
          }
          CinematicRenderer.setShot(cx, cy - 30, 1.60, 0);
        }

        // SHOT 7 (10.6 – 12.2s): THE TITLE
        // Banner: THE ABYSS WARDEN / THE FINAL TRIAL
        else if (t < 12.2) {
          if (BOSS) {
            GameState.CAM.tx = BOSS.x;
            GameState.CAM.ty = BOSS.y;
            GameState.CAM.tz = 1.45;
            BOSS.introRevealStage = 'stance';
            BOSS.introWeaponAlpha = 1.0;
          }

          if (!intro.soundCues.s7) {
            intro.soundCues.s7 = true;
            CinematicRenderer.addShake(8);
            this.triggerBanner(intro.title, intro.subtitle, intro.col, 3.2);
          }
          CinematicRenderer.setShot(cx, cy - 10, 1.45, 0);
        }

        // SHOT 8 (12.2 – 12.8s): COMBAT BEGINS
        // Smooth camera return to combat position and handoff
        else {
          if (BOSS) {
            BOSS.introRevealStage = null;
            BOSS.introWeaponAlpha = 1.0;
          }
          if (P) {
            GameState.CAM.tx = P.x;
            GameState.CAM.ty = P.y;
            GameState.CAM.tz = 1.0;
          }
          CinematicRenderer.setShot(cx, cy, 1.0, 0);

          if (t >= 12.8) {
            this.finish();
            return;
          }
        }
      }
    }

    // =========================================================
    // DEFEATS TIMELINE (GORGAROTH & MALAKOR)
    // =========================================================
    else {
      // ───────────────────────────────────────────────────────
      // GORGAROTH DEFEAT (MULTI-STAGE CINEMATIC SEQUENCE)
      // ───────────────────────────────────────────────────────
      if (intro.bossId === 'gorgaroth') {
        const { BOSS, P } = GameState;

        // Phase 1 (0.0s - 1.5s): Combat halts, stands unstable
        if (t < 1.5) {
          if (BOSS) {
            BOSS.defeatState = 'unstable';
            GameState.CAM.tx = BOSS.x;
            GameState.CAM.ty = BOSS.y;
            GameState.CAM.tz = 1.6;
          }
          CinematicRenderer.setShot(cx, cy, 1.6, 0);
        }
        // Phase 2 (1.5s - 3.0s): Weapon falls first, heavy metallic impact
        else if (t < 3.0) {
          if (BOSS) {
            BOSS.defeatState = 'weapon_falling';
            GameState.CAM.tx = BOSS.x;
            GameState.CAM.ty = BOSS.y;
            GameState.CAM.tz = 1.65;
          }
          if (!intro.soundCues.weaponDrop && t >= 1.8) {
            intro.soundCues.weaponDrop = true;
            SoundManager.snd('weapon_clang');
            Camera.shake(14);
            GameState.CAM.shk = Math.max(GameState.CAM.shk || 0, 14);
          }
          CinematicRenderer.setShot(cx, cy + 10, 1.65, 0);
        }
        // Phase 3 (3.0s - 4.6s): Grabs/supports against chains, armor cracks with molten energy
        else if (t < 4.6) {
          if (BOSS) {
            BOSS.defeatState = 'cracking';
            GameState.CAM.tx = BOSS.x;
            GameState.CAM.ty = BOSS.y;
            GameState.CAM.tz = 1.7;
          }
          if (!intro.soundCues.crack && t >= 3.4) {
            intro.soundCues.crack = true;
            SoundManager.snd('shockwave');
            Camera.shake(8);
          }
          CinematicRenderer.setShot(cx, cy + 15, 1.7, 0);
        }
        // Phase 4 (4.6s - 5.8s): Restraint chains loosen and fall
        else if (t < 5.8) {
          if (BOSS) {
            BOSS.defeatState = 'chains_falling';
            GameState.CAM.tx = BOSS.x;
            GameState.CAM.ty = BOSS.y;
            GameState.CAM.tz = 1.65;
          }
          if (!intro.soundCues.chainsFall && t >= 4.8) {
            intro.soundCues.chainsFall = true;
            SoundManager.snd('chain_rattle');
            Camera.shake(8);
          }
          CinematicRenderer.setShot(cx, cy + 15, 1.65, 0);
        }
        // Phase 5 (5.8s - 7.0s): Drops to one knee
        else if (t < 7.0) {
          if (BOSS) {
            BOSS.defeatState = 'knee';
            GameState.CAM.tx = BOSS.x;
            GameState.CAM.ty = BOSS.y;
            GameState.CAM.tz = 1.65;
          }
          if (!intro.soundCues.knee && t >= 6.1) {
            intro.soundCues.knee = true;
            SoundManager.snd('shockwave');
            Camera.shake(10);
            GameState.CAM.shk = Math.max(GameState.CAM.shk || 0, 10);
          }
          CinematicRenderer.setShot(cx, cy + 20, 1.65, 0);
        }
        // Phase 6 (7.0s - 8.3s): Looks toward Rowan, hold briefly
        else if (t < 8.3) {
          if (BOSS) {
            BOSS.defeatState = 'looking_at_rowan';
            GameState.CAM.tx = BOSS.x;
            GameState.CAM.ty = BOSS.y;
            GameState.CAM.tz = 1.65;
          }
          CinematicRenderer.setShot(cx, cy + 20, 1.65, 0);
        }
        // Phase 7 (8.3s - 9.8s): Collapses with weight and momentum
        else if (t < 9.8) {
          if (BOSS) {
            BOSS.defeatState = 'collapsed';
            GameState.CAM.tx = BOSS.x;
            GameState.CAM.ty = BOSS.y;
            GameState.CAM.tz = 1.6;
          }
          if (!intro.soundCues.collapse && t >= 8.5) {
            intro.soundCues.collapse = true;
            SoundManager.snd('shockwave');
            Camera.shake(18);
            GameState.CAM.shk = Math.max(GameState.CAM.shk || 0, 18);
            ParticleRenderer.spawnP(BOSS.x, BOSS.y, 25, { col: '#78716c', spd: 2.2, r: 3 });
          }
          CinematicRenderer.setShot(cx, cy + 25, 1.6, 0);
        }
        // Phase 8 (9.8s - 11.5s): Arena remains visible for a few seconds, portal ignites
        else if (t < 11.5) {
          if (BOSS && P) {
            const pullProg = Math.min(1, (t - 9.8) / 1.5);
            GameState.CAM.tx = BOSS.x * (1 - pullProg * 0.4) + P.x * (pullProg * 0.4);
            GameState.CAM.ty = BOSS.y * (1 - pullProg * 0.4) + P.y * (pullProg * 0.4);
            GameState.CAM.tz = 1.6 - 0.35 * pullProg;
            BOSS.defeatState = 'collapsed';
          }
          if (!intro.soundCues.portal && t >= 10.4) {
            intro.soundCues.portal = true;
            SoundManager.snd('portal_enter');
            intro.flashAlpha = 0.85;
            this.triggerBanner(
              '✦ GORGAROTH VANQUISHED ✦',
              'The passage deeper into the abyss has unlocked. Enter the portal!'
            );
          }
          CinematicRenderer.setShot(cx, cy, 1.35, 0);
        } else {
          this.finishDefeat();
          return;
        }
      }

      // Malakor Defeat
      else {
        const { BOSS, P } = GameState;
        if (BOSS && GameState.CAM) {
          GameState.CAM.tx = BOSS.x;
          GameState.CAM.ty = BOSS.y;
        }

        if (t < 1.2) {
          // Shot 1: Shield shatters
          if (GameState.CAM) GameState.CAM.tz = 1.65;
          CinematicRenderer.setShot(cx, cy, 1.65, 0);
        } else if (t < 2.4) {
          // Shot 2: Void energy escapes
          if (!intro.soundCues.energy) {
            intro.soundCues.energy = true;
            SoundManager.snd('shockwave');
            CinematicRenderer.addShake(12);
            if (GameState.CAM) GameState.CAM.shk = 12;
          }
          if (GameState.CAM) {
            GameState.CAM.ty = (BOSS ? BOSS.y : 0) - 0.2;
            GameState.CAM.tz = 1.8;
          }
          CinematicRenderer.setShot(cx, cy - 10, 1.8, 0.03);
        } else if (t < 3.8) {
          // Shot 3: Body begins dissolving into void vortex
          if (GameState.CAM) GameState.CAM.tz = 1.6;
          CinematicRenderer.setShot(cx, cy, 1.6, 0);
        } else if (t < 4.8) {
          // Shot 4: Void vortex collapses inward into singularity
          if (!intro.soundCues.collapse) {
            intro.soundCues.collapse = true;
            CinematicRenderer.addShake(10);
            if (GameState.CAM) GameState.CAM.shk = 10;
          }
          if (GameState.CAM) GameState.CAM.tz = 1.4;
          CinematicRenderer.setShot(cx, cy, 1.4, 0);
        } else if (t < 5.6) {
          // Shot 5: Ethereal portal appears
          if (!intro.soundCues.portal) {
            intro.soundCues.portal = true;
            SoundManager.snd('portal_enter');
            intro.flashAlpha = 0.9;
          }
          if (BOSS && P && GameState.CAM) {
            GameState.CAM.tx = (BOSS.x + P.x) / 2;
            GameState.CAM.ty = (BOSS.y + P.y) / 2;
            GameState.CAM.tz = 1.2;
          }
          CinematicRenderer.setShot(cx, cy, 1.2, 0);
        } else {
          this.finishDefeat();
          return;
        }
      }
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 4. MASTER CINEMATIC DRAW (1280 × 720 PIPELINE)
  // ─────────────────────────────────────────────────────────────
  draw(ctx) {
    if (!ACTIVE_BOSS_INTRO) return;
    const intro = ACTIVE_BOSS_INTRO;
    const t = intro.timer;

    ctx.save();

    // Map 1280 × 720 logical cinematic coordinates to physical canvas
    const sx = (ctx.canvas ? ctx.canvas.width : LW) / CINEMATIC_W;
    const sy = (ctx.canvas ? ctx.canvas.height : LH) / CINEMATIC_H;
    ctx.scale(sx, sy);

    const cx = CINEMATIC_W / 2;
    const cy = CINEMATIC_H * 0.46;

    if (intro.type === 'intro') {
      if (intro.bossId === 'gorgaroth') {
        this._drawGorgarothIntro(ctx, t, cx, cy);
      } else if (intro.bossId === 'malakor') {
        this._drawMalakorIntro(ctx, t, cx, cy);
      } else {
        this._drawWardenIntro(ctx, t, cx, cy);
      }
    } else {
      if (intro.bossId === 'gorgaroth') {
        this._drawGorgarothDefeat(ctx, t, cx, cy);
      } else {
        this._drawMalakorDefeat(ctx, t, cx, cy);
      }
    }

    // Letterbox bars
    CinematicRenderer.drawLetterbox(ctx);

    // Screen Flash (Impact flash)
    if (intro.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${intro.flashAlpha})`;
      ctx.fillRect(0, 0, CINEMATIC_W, CINEMATIC_H);
    }

    // Top Header Banner
    if (CINEMATIC_BANNER.active) {
      const cb = CINEMATIC_BANNER;
      let alpha = 1;
      if (cb.timer < 0.4) alpha = cb.timer / 0.4;
      else if (cb.timer > cb.duration - 0.5) alpha = (cb.duration - cb.timer) / 0.5;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

      const py = 76;
      const pw = 620;
      const ph = 68;
      const px = cx - pw / 2;

      const grad = ctx.createLinearGradient(px, py, px + pw, py);
      grad.addColorStop(0, 'rgba(4, 7, 18, 0)');
      grad.addColorStop(0.14, 'rgba(4, 7, 18, 0.96)');
      grad.addColorStop(0.86, 'rgba(4, 7, 18, 0.96)');
      grad.addColorStop(1, 'rgba(4, 7, 18, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(px, py, pw, ph);

      ctx.strokeStyle = cb.col;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(px + 45, py); ctx.lineTo(px + pw - 45, py);
      ctx.moveTo(px + 45, py + ph); ctx.lineTo(px + pw - 45, py + ph);
      ctx.stroke();

      ctx.shadowColor = cb.col;
      ctx.shadowBlur = 22;
      ctx.fillStyle = cb.col;
      ctx.font = 'bold 26px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cb.title, cx, py + 26);

      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(241, 245, 249, 0.95)';
      ctx.font = 'italic 15px Crimson Text, serif';
      ctx.fillText(cb.subtitle, cx, py + 52);

      ctx.restore();
    }

    // Skip Prompt (Shown only after 3.0s unskippable window)
    if (CinematicSafety.shouldShowSkipHint() && t < intro.duration - 0.5) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '11px Cinzel, serif';
      ctx.textAlign = 'right';
      ctx.fillText('[ SPACE / ENTER / CLICK TO SKIP ]', CINEMATIC_W - 36, CINEMATIC_H - 24);
    }

    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────
  // A. GORGAROTH INTRO DRAW
  // ─────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────
  // A. GORGAROTH INTRO DRAW (7-Shot Floor-to-Head Progression)
  // ─────────────────────────────────────────────────────────────
  drawWorldEntities(ctx) {
    if (!ACTIVE_BOSS_INTRO) return;
    const { BOSS } = GameState;
    if (!BOSS) return;
    const t = ACTIVE_BOSS_INTRO.timer;

    if (ACTIVE_BOSS_INTRO.bossId === 'gorgaroth') {
      // Impact dust waves on heavy footfalls
      if (t >= 1.1 && t <= 1.8) {
        ctx.save();
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(BOSS.x * 32, (BOSS.y + 0.6) * 32, (t - 1.1) * 55, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      if (t >= 2.1 && t <= 2.9) {
        ctx.save();
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.55)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(BOSS.x * 32, (BOSS.y + 0.6) * 32, (t - 2.1) * 65, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    } else if (ACTIVE_BOSS_INTRO.bossId === 'malakor') {
      // Swirling purple void rift rings on the arena dais floor
      ctx.save();
      const ringAngle = t * 1.8;
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.40)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(BOSS.x * 32, BOSS.y * 32, 42, 24, ringAngle, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (ACTIVE_BOSS_INTRO.bossId === 'abyss_warden') {
      // Floor impact shockwave on heavy step down in Shot 6 (9.0 - 10.6s)
      if (t >= 9.0 && t <= 10.4) {
        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(BOSS.x * 32, (BOSS.y + 0.8) * 32, (t - 9.0) * 58, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      // Ancient runic pulse on the throne dais in Shot 7 (10.6 - 12.2s)
      if (t >= 10.6) {
        ctx.save();
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.50)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(BOSS.x * 32, (BOSS.y + 0.5) * 32, 38 + Math.sin(t * 4.0) * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  },

  _drawCinematicSubtitle(ctx, text, col = '#fde68a') {
    if (!text) return;
    const cx = CINEMATIC_W / 2;
    const cy = CINEMATIC_H - 140;

    ctx.save();
    ctx.font = 'italic 16px "Crimson Text", Georgia, serif';
    const textW = ctx.measureText(text).width;
    const padX = 26;
    const padY = 9;
    const pillW = textW + padX * 2;
    const pillH = 34;

    ctx.fillStyle = 'rgba(2, 4, 10, 0.82)';
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.45)';
    ctx.lineWidth = 1;
    roundRect(ctx, cx - pillW / 2, cy - pillH / 2, pillW, pillH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = col;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = col;
    ctx.shadowBlur = 8;
    ctx.fillText(text, cx, cy);
    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────
  // A. GORGAROTH INTRO OVERLAY
  // ─────────────────────────────────────────────────────────────
  _drawGorgarothIntro(ctx, t, cx, cy) {
    // 1. Molten Iron Fissure Atmospheric Vignette
    const vig = ctx.createRadialGradient(cx, cy, CINEMATIC_W * 0.22, cx, cy, CINEMATIC_W * 0.72);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(0.65, 'rgba(124, 45, 18, 0.16)');
    vig.addColorStop(1, 'rgba(15, 6, 4, 0.82)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, CINEMATIC_W, CINEMATIC_H);

    // 2. Story Subtitles matching the 6-shot sequence
    let sub = '';
    if (t < 2.0) {
      sub = 'The chamber is silent. Only the flicker of ancient torches pierces the dark.';
    } else if (t < 4.2) {
      sub = 'The enormous iron portcullis grinds shut behind Rowan.';
    } else if (t < 6.4) {
      sub = 'Chains thick as pillars hang suspended from above. One slowly moves.';
    } else if (t < 8.0) {
      sub = 'A heavy metallic sound echoes across the stones as a colossal weapon stirs.';
    } else if (t < 10.0) {
      sub = 'Ancient weathered armor emerges from the shadows... the molten visor ignites.';
    } else {
      sub = '“None have breached the Iron Fissure in five centuries. You will not be the first.”';
    }
    this._drawCinematicSubtitle(ctx, sub, '#fed7aa');
  },

  // ─────────────────────────────────────────────────────────────
  // B. MALAKOR INTRO OVERLAY
  // ─────────────────────────────────────────────────────────────
  _drawMalakorIntro(ctx, t, cx, cy) {
    // 1. Cosmic Void Atmospheric Vignette
    const vig = ctx.createRadialGradient(cx, cy, CINEMATIC_W * 0.22, cx, cy, CINEMATIC_W * 0.72);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(0.65, 'rgba(88, 28, 135, 0.20)');
    vig.addColorStop(1, 'rgba(3, 1, 8, 0.85)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, CINEMATIC_W, CINEMATIC_H);

    // 2. Story Subtitles
    let sub = '';
    if (t < 2.0) {
      sub = 'The chamber’s air falls dead silent as reality begins to shear...';
    } else if (t < 4.2) {
      sub = 'A spatial tear vibrates with unstable abyssal energy.';
    } else if (t < 6.4) {
      sub = 'MALAKOR, THE VOID WEAVER resolves from the fractured continuum.';
    } else {
      sub = '“Can your mind endure the void, or will you shatter like the rest?”';
    }
    this._drawCinematicSubtitle(ctx, sub, '#e9d5ff');
  },

  // ─────────────────────────────────────────────────────────────
  // C. ABYSS WARDEN INTRO OVERLAY
  // ─────────────────────────────────────────────────────────────
  _drawWardenIntro(ctx, t, cx, cy) {
    if (t < 0.2) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
      ctx.fillRect(0, 0, CINEMATIC_W, CINEMATIC_H);
      return;
    }

    // 1. Grand Sunken Citadel Vignette
    const vig = ctx.createRadialGradient(cx, cy, CINEMATIC_W * 0.22, cx, cy, CINEMATIC_W * 0.72);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(0.65, 'rgba(127, 29, 29, 0.20)');
    vig.addColorStop(1, 'rgba(4, 2, 8, 0.86)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, CINEMATIC_W, CINEMATIC_H);

    // 2. Story Subtitles (Authoritative 8-Shot Screenplay)
    let sub = '';
    if (t < 2.0) {
      sub = 'The grand chamber lies motionless... all sound consumed by the Abyss.';
    } else if (t < 3.8) {
      sub = 'Heavy iron chains rustle in the dark. The dungeon falls silent.';
    } else if (t < 5.4) {
      sub = 'Ancient machinery groans beneath the obsidian dais...';
    } else if (t < 7.2) {
      sub = 'A monolithic shadow on the throne. Crimson slit eyes ignite.';
    } else if (t < 9.0) {
      sub = 'THE ABYSS WARDEN rises. Obsidian plate and draconian wings unfurl.';
    } else if (t < 10.6) {
      sub = 'The colossal dreadblade clears its scabbard. Every stone trembles.';
    } else if (t < 12.2) {
      sub = '“No soul departs the sunken citadel while I draw breath.”';
    } else {
      sub = '';
    }
    if (sub) {
      this._drawCinematicSubtitle(ctx, sub, '#fecaca');
    }
  },

  // ─────────────────────────────────────────────────────────────
  // D. GORGAROTH DEFEAT OVERLAY
  // ─────────────────────────────────────────────────────────────
  _drawGorgarothDefeat(ctx, t, cx, cy) {
    const vig = ctx.createRadialGradient(cx, cy, CINEMATIC_W * 0.22, cx, cy, CINEMATIC_W * 0.72);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(0.65, 'rgba(180, 83, 9, 0.22)');
    vig.addColorStop(1, 'rgba(12, 6, 2, 0.82)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, CINEMATIC_W, CINEMATIC_H);

    let sub = '';
    if (t < 1.5) {
      sub = 'Gorgaroth staggers... his ancient stance faltering.';
    } else if (t < 3.0) {
      sub = 'The colossal executioner mace slips from his grip, crashing to the stones.';
    } else if (t < 4.6) {
      sub = 'He clutches his breastplate. Glowing cracks of molten fury split the iron armor.';
    } else if (t < 5.8) {
      sub = 'Restraint chains loosen and crash to the floor.';
    } else if (t < 7.0) {
      sub = 'For the first time in five centuries, the Iron Jailer drops to one knee.';
    } else if (t < 8.3) {
      sub = 'He turns his dying gaze toward Rowan...';
    } else if (t < 9.8) {
      sub = 'With a thunderous crash, the colossus collapses onto the dais.';
    } else {
      sub = 'Silence returns to the chamber. The passage deeper into the Abyss lies open.';
    }
    this._drawCinematicSubtitle(ctx, sub, '#fed7aa');
  },

  // ─────────────────────────────────────────────────────────────
  // E. MALAKOR DEFEAT OVERLAY
  // ─────────────────────────────────────────────────────────────
  _drawMalakorDefeat(ctx, t, cx, cy) {
    const vig = ctx.createRadialGradient(cx, cy, CINEMATIC_W * 0.22, cx, cy, CINEMATIC_W * 0.72);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(0.65, 'rgba(126, 34, 206, 0.25)');
    vig.addColorStop(1, 'rgba(4, 2, 10, 0.85)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, CINEMATIC_W, CINEMATIC_H);

    const sub = t < 2.5
      ? 'The void vortex shatters into iridescent starlight...'
      : 'The Void Weaver is vanquished. The Singularity stabilizes into a gateway.';
    this._drawCinematicSubtitle(ctx, sub, '#e9d5ff');
  },

  // ─────────────────────────────────────────────────────────────
  canSkip() {
    return CinematicSafety.canSkip();
  },

  skip() {
    if (!this.canSkip()) return;
    if (ACTIVE_BOSS_INTRO) {
      if (ACTIVE_BOSS_INTRO.type === 'defeat') {
        this.finishDefeat();
      } else {
        this.finish();
      }
    }
  },

  finish() {
    if (CinematicSafety.isReplay()) {
      ACTIVE_BOSS_INTRO = null;
      GameState.ACTIVE_BOSS_INTRO = null;
      GameState.BOSS_INTRO_ACTIVE = false;
      GameState.CINEMATIC_ACTIVE = false;
      GameState.ACTIVE_CINEMATIC_TYPE = null;
      CinematicSafety.finishReplay();
      return;
    }

    ACTIVE_BOSS_INTRO = null;
    GameState.ACTIVE_BOSS_INTRO = null;
    GameState.BOSS_INTRO_WING_SPREAD = 1.0;
    GameState.BOSS_INTRO_EYE_GLOW = 1.0;
    if (typeof window !== 'undefined') {
      window.BOSS_INTRO_WING_SPREAD = 1.0;
      window.BOSS_INTRO_EYE_GLOW = 1.0;
    }
    GameState.BOSS_INTRO_ACTIVE = false;
    GameState.CINEMATIC_ACTIVE = false;
    GameState.ACTIVE_CINEMATIC_TYPE = null;
    GameState.BOSS_AI_ACTIVE = true;
    if (GameState.BOSS) {
      GameState.BOSS.introRevealStage = 'full';
      if (GameState.BOSS.id === 'malakor') GameState.BOSS.introMaterialize = 1;
    }
    GameState.setState(GameStates.PLAYING);
    CinematicSafety.reset();

    // Reset gameplay camera
    if (GameState.P) {
      GameState.CAM.tx = GameState.P.x;
      GameState.CAM.ty = GameState.P.y;
      GameState.CAM.tz = 1.0;
      GameState.CAM.shk = 12;
    }
    SoundManager.snd('boss_roar');
  },

  finishDefeat() {
    if (CinematicSafety.isReplay()) {
      ACTIVE_BOSS_INTRO = null;
      GameState.ACTIVE_BOSS_INTRO = null;
      GameState.BOSS_INTRO_ACTIVE = false;
      GameState.CINEMATIC_ACTIVE = false;
      GameState.ACTIVE_CINEMATIC_TYPE = null;
      CinematicSafety.finishReplay();
      return;
    }

    const bId = (ACTIVE_BOSS_INTRO && ACTIVE_BOSS_INTRO.bossId) || 'gorgaroth';

    ACTIVE_BOSS_INTRO = null;
    GameState.ACTIVE_BOSS_INTRO = null;
    GameState.BOSS_INTRO_ACTIVE = false;
    GameState.CINEMATIC_ACTIVE = false;
    GameState.ACTIVE_CINEMATIC_TYPE = null;
    GameState.BOSS_DEAD = true;
    GameState.BOSS_PORTAL_UNLOCKED = true;

    if (bId === 'gorgaroth') {
      AchievementSystem.unlock('jailbreaker');
      if (GameState.BOSS) {
        GameState.BOSS.introRevealStage = 'full';
        GameState.BOSS.defeatState = 'collapsed';
      }
    }
    if (bId === 'malakor') AchievementSystem.unlock('void_conqueror');

    // Ensure authoritative Portal tile is active and clear behind the dais
    const BOSS = GameState.BOSS;
    const bx = Math.round((BOSS && BOSS.x) || 24);
    const by = Math.round((BOSS && BOSS.y) || 10);
    const room = GameState.ROOMS && GameState.ROOMS[0];

    let portalX = bx;
    let portalY = Math.max(3, by - 2);

    if (bId === 'malakor' && room && room.type === 'malakor_arena') {
      portalX = room.cx;
      portalY = room.y + 2;
    }

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const r = portalY + dr, c = portalX + dc;
        if (GameState.MAP && GameState.MAP[r] && GameState.MAP[r][c] === 1) {
          GameState.MAP[r][c] = 0;
        }
      }
    }
    if (bId !== 'gorgaroth') {
      // Clean up any stray or duplicate portal tiles across the floor
      if (GameState.MAP) {
        for (let r = 0; r < GameState.MAP.length; r++) {
          if (!GameState.MAP[r]) continue;
          for (let c = 0; c < GameState.MAP[r].length; c++) {
            if (GameState.MAP[r][c] === 2 && (r !== portalY || c !== portalX)) {
              GameState.MAP[r][c] = 0;
            }
          }
        }
      }
      if (GameState.MAP && GameState.MAP[portalY]) GameState.MAP[portalY][portalX] = 2;
    }

    ParticleRenderer.spawnP(portalX, portalY, 35, { col: '#38bdf8', spd: 2.2, r: 4 });
    ParticleRenderer.spawnP(portalX, portalY, 25, { col: '#c084fc', spd: 1.8, r: 3 });

    this.triggerBanner(
      '✦ GUARDIAN VANQUISHED ✦',
      'The passage deeper into the abyss has unlocked. Enter the portal!'
    );

    GameState.setState(GameStates.PLAYING);
    CinematicSafety.reset();
    if (GameState.P) {
      GameState.CAM.tx = GameState.P.x;
      GameState.CAM.ty = GameState.P.y;
      GameState.CAM.tz = 1.0;
    }
  },

  reset() {
    ACTIVE_BOSS_INTRO = null;
    GameState.ACTIVE_BOSS_INTRO = null;
    GameState.BOSS_INTRO_ACTIVE = false;
    CINEMATIC_BANNER.active = false;
  }
};

export const startBossIntroCinematic = (id) => BossIntros.start(id);
export const triggerCinematicBanner = (t, s, c, d) => BossIntros.triggerBanner(t, s, c, d);

if (typeof window !== 'undefined') {
  window.BossIntros = BossIntros;
  window.startBossIntroCinematic = startBossIntroCinematic;
  window.triggerCinematicBanner = triggerCinematicBanner;
  Object.defineProperty(window, 'ACTIVE_BOSS_INTRO', {
    get: () => ACTIVE_BOSS_INTRO,
    set: (v) => { ACTIVE_BOSS_INTRO = v; },
    configurable: true
  });
}
