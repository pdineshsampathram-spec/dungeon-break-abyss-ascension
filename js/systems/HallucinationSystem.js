// =====================================================================
//  DUNGEON BREAK — js/systems/HallucinationSystem.js
//  Authoritative Grounded Psychological Horror Hallucination Manager
//  Tied to Sanity Bands (100% to 1%): Phantom Eyes, Shadow Movements,
//  Corner Tentacles, Torch Glitches, & Subtle Rowan Reactions.
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, T } from '../core/Constants.js';
import { SoundManager } from '../audio/AudioManager.js';

export const HallucinationSystem = {
  activeHallucinations: [],
  eventTimer: 8.0,
  torchGlitchTimer: 0,
  rowanReactionTimer: 0,
  rowanReactionType: null,
  whisperText: null,
  whisperTimer: 0,
  droneAudioTimer: 0,

  reset() {
    this.activeHallucinations = [];
    this.eventTimer = 8.0;
    this.torchGlitchTimer = 0;
    this.rowanReactionTimer = 0;
    this.rowanReactionType = null;
    this.whisperText = null;
    this.whisperTimer = 0;
    this.droneAudioTimer = 0;
  },

  /**
   * Main simulation tick. Runs every frame during PLAYING state.
   */
  tick(dt) {
    const { P } = GameState;
    if (!P || P.dead || GameState.STATE !== GameStates.PLAYING) {
      if (this.activeHallucinations.length > 0 && GameState.STATE !== GameStates.PLAYING && GameState.STATE !== GameStates.DEATH_SANITY) {
        this.activeHallucinations = [];
      }
      return;
    }

    const san = P.san !== undefined ? P.san : 100;

    // Update active hallucinations
    for (let i = this.activeHallucinations.length - 1; i >= 0; i--) {
      const h = this.activeHallucinations[i];
      h.age += dt;
      if (h.age >= h.lifetime) {
        this.activeHallucinations.splice(i, 1);
      }
    }

    // Update torch glitch timer
    if (this.torchGlitchTimer > 0) {
      this.torchGlitchTimer = Math.max(0, this.torchGlitchTimer - dt);
    }

    // Update whisper subtitle timer
    if (this.whisperTimer > 0) {
      this.whisperTimer = Math.max(0, this.whisperTimer - dt);
      if (this.whisperTimer <= 0) {
        this.whisperText = null;
      }
    }

    // Update subtle Rowan reaction timer
    if (this.rowanReactionTimer > 0) {
      this.rowanReactionTimer = Math.max(0, this.rowanReactionTimer - dt);
      if (this.rowanReactionTimer <= 0) {
        this.rowanReactionType = null;
      }
    }

    // ─────────────────────────────────────────────────────────────
    // SANITY BANDS: 100–70: Normal | 70–50: Uneasy | 50–35: Low
    // 35–15: Tentacles & Eyes | 15–1: Severe Distortion
    // ─────────────────────────────────────────────────────────────
    if (san >= 70) {
      // Band 1: Normal. No hallucinations.
      if (this.activeHallucinations.length > 0) {
        this.activeHallucinations = [];
      }
      return;
    }

    // Background low-frequency psychological drone audio at low sanity
    if (san < 35) {
      this.droneAudioTimer += dt;
      const droneInterval = san < 15 ? 12.0 : 20.0;
      if (this.droneAudioTimer >= droneInterval) {
        this.droneAudioTimer = 0;
        SoundManager.snd('sanity_drone');
      }
    }

    // Event Trigger Loop
    this.eventTimer -= dt;
    if (this.eventTimer <= 0) {
      if (san >= 50) {
        // Band 2: Uneasy Sanity (70–50%). Rare subtle events. Interval ~12-18s.
        this.triggerUneasyEvent();
        this.eventTimer = 12.0 + Math.random() * 6.0;
      } else if (san >= 35) {
        // Band 3: Low Sanity (50–35%). Single phantom eye in doorway/pillar. Interval ~8-12s.
        this.triggerLowSanityEvent();
        this.eventTimer = 8.0 + Math.random() * 5.0;
      } else if (san >= 15) {
        // Band 4: Creeping Tentacles & Eyes (35–15%). Interval ~5-9s.
        this.triggerStrongHallucination();
        this.eventTimer = 5.0 + Math.random() * 4.0;
      } else {
        // Band 5: Severe Distortion (15–1%). Interval ~3-6s.
        this.triggerSevereHallucination();
        this.eventTimer = 3.2 + Math.random() * 2.8;
      }
    }
  },

  // ─────────────────────────────────────────────────────────────
  // EVENT GENERATORS FOR SANITY BANDS
  // ─────────────────────────────────────────────────────────────

  /**
   * 70–50%: Subtle uneasiness. Torch behaves oddly, distant shadow glides, faint whisper.
   */
  triggerUneasyEvent() {
    const roll = Math.random();
    if (roll < 0.4) {
      // Torch briefly flickers low
      this.torchGlitchTimer = 0.8;
    } else if (roll < 0.75) {
      // Distant shadow moves along a wall
      const loc = this.findDistantWallLocation(6, 12);
      if (loc) {
        this.activeHallucinations.push({
          type: 'SHADOW_MOVEMENT',
          x: loc.x,
          y: loc.y,
          dx: (Math.random() - 0.5) * 1.5,
          dy: (Math.random() - 0.5) * 1.5,
          lifetime: 1.4,
          age: 0
        });
      }
    } else {
      // Distant whisper sound
      SoundManager.snd('eldritch_whisper');
    }
  },

  /**
   * 50–35%: Exactly ONE red eye appears in doorway, dark wall, or behind pillar.
   */
  triggerLowSanityEvent() {
    // Only one hallucination at a time
    if (this.activeHallucinations.length > 0) return;

    const loc = this.findWallOrPillarLocation(3.5, 8.0);
    if (loc) {
      this.activeHallucinations.push({
        type: 'PHANTOM_EYE',
        x: loc.x,
        y: loc.y,
        size: 16 + Math.random() * 8, // small/medium
        lookAngle: Math.random() * 6.28,
        lifetime: 1.8 + Math.random() * 0.6,
        age: 0,
        blinkTime: 0.9,
        blinkDuration: 0.22
      });
      SoundManager.snd('eye_awaken');
    }
  },

  /**
   * 35–15%: Creeping tentacles from dark corners, occasional phantom eye, Rowan reactions.
   */
  triggerStrongHallucination() {
    if (this.activeHallucinations.length >= 2) return;

    const roll = Math.random();
    if (roll < 0.55) {
      // Tentacle shadow emerging from room edge / dark corner
      const loc = this.findCornerLocation(3.0, 7.5);
      if (loc) {
        this.activeHallucinations.push({
          type: 'TENTACLE_SHADOW',
          x: loc.x,
          y: loc.y,
          angle: loc.angle || (Math.random() * 6.28),
          length: 22 + Math.random() * 12,
          lifetime: 1.8,
          age: 0
        });
      }
    } else {
      // Phantom eye integrated into dark wall or doorway
      const loc = this.findWallOrPillarLocation(3.0, 7.0);
      if (loc) {
        this.activeHallucinations.push({
          type: 'PHANTOM_EYE',
          x: loc.x,
          y: loc.y,
          size: 18 + Math.random() * 8,
          lookAngle: Math.random() * 6.28,
          lifetime: 2.0,
          age: 0,
          blinkTime: 1.0,
          blinkDuration: 0.22
        });
      }
    }

    // Subtle Rowan reaction (looking toward doorway / pause / heavy breath)
    if (Math.random() < 0.4 && this.rowanReactionTimer <= 0) {
      this.rowanReactionTimer = 1.0;
      this.rowanReactionType = Math.random() < 0.5 ? 'look' : 'unsettled';
    }
  },

  /**
   * 15–1%: Severe reality distortion. Up to 2-3 sparse hallucinations, shadow stretch.
   */
  triggerSevereHallucination() {
    if (this.activeHallucinations.length >= 3) return;

    const loc1 = this.findWallOrPillarLocation(2.5, 9.0);
    if (loc1) {
      this.activeHallucinations.push({
        type: 'PHANTOM_EYE',
        x: loc1.x,
        y: loc1.y,
        size: 16 + Math.random() * 10,
        lookAngle: Math.random() * 6.28,
        lifetime: 2.2,
        age: 0,
        blinkTime: 1.1,
        blinkDuration: 0.22
      });
    }

    if (Math.random() < 0.6) {
      const loc2 = this.findCornerLocation(2.5, 8.0);
      if (loc2) {
        this.activeHallucinations.push({
          type: 'TENTACLE_SHADOW',
          x: loc2.x,
          y: loc2.y,
          angle: loc2.angle || (Math.random() * 6.28),
          length: 24 + Math.random() * 14,
          lifetime: 2.0,
          age: 0
        });
      }
    }

    if (Math.random() < 0.4) {
      SoundManager.snd('eldritch_whisper');
    }
  },

  // ─────────────────────────────────────────────────────────────
  // LOCATION SEARCH HELPERS (Respects Dungeon Geometry & Occlusion)
  // ─────────────────────────────────────────────────────────────

  findWallOrPillarLocation(minDist, maxDist) {
    const { P, TILES } = GameState;
    if (!P || !TILES) return null;

    const candidates = [];
    const px = Math.floor(P.x);
    const py = Math.floor(P.y);

    const rMin = Math.max(1, py - Math.ceil(maxDist));
    const rMax = Math.min(30, py + Math.ceil(maxDist));
    const cMin = Math.max(1, px - Math.ceil(maxDist));
    const cMax = Math.min(46, px + Math.ceil(maxDist));

    for (let r = rMin; r <= rMax; r++) {
      for (let c = cMin; c <= cMax; c++) {
        const d = Math.hypot(c - P.x, r - P.y);
        if (d >= minDist && d <= maxDist) {
          const tile = TILES[r] ? TILES[r][c] : 0;
          // Wall (1) adjacent to Floor (0) = Wall face / doorway / pillar
          if (tile === 1) {
            const hasFloorNeighbor =
              (TILES[r + 1] && TILES[r + 1][c] === 0) ||
              (TILES[r - 1] && TILES[r - 1][c] === 0) ||
              (TILES[r][c + 1] === 0) ||
              (TILES[r][c - 1] === 0);
            if (hasFloorNeighbor) {
              candidates.push({ x: c + 0.5, y: r + 0.5 });
            }
          }
        }
      }
    }

    if (candidates.length === 0) {
      return { x: P.x + (Math.random() - 0.5) * 6, y: P.y - 3 };
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  },

  findCornerLocation(minDist, maxDist) {
    const { P, TILES } = GameState;
    if (!P || !TILES) return null;

    const candidates = [];
    const px = Math.floor(P.x);
    const py = Math.floor(P.y);

    for (let dy = -Math.ceil(maxDist); dy <= Math.ceil(maxDist); dy++) {
      for (let dx = -Math.ceil(maxDist); dx <= Math.ceil(maxDist); dx++) {
        const c = px + dx;
        const r = py + dy;
        const d = Math.hypot(dx, dy);
        if (d >= minDist && d <= maxDist && r >= 1 && r <= 30 && c >= 1 && c <= 46) {
          // A floor tile adjacent to at least two walls = corner
          if (TILES[r] && TILES[r][c] === 0) {
            let wallCount = 0;
            if (TILES[r - 1] && TILES[r - 1][c] === 1) wallCount++;
            if (TILES[r + 1] && TILES[r + 1][c] === 1) wallCount++;
            if (TILES[r][c - 1] === 1) wallCount++;
            if (TILES[r][c + 1] === 1) wallCount++;
            if (wallCount >= 2) {
              const ang = Math.atan2(P.y - (r + 0.5), P.x - (c + 0.5));
              candidates.push({ x: c + 0.5, y: r + 0.5, angle: ang });
            }
          }
        }
      }
    }

    if (candidates.length === 0) return this.findWallOrPillarLocation(minDist, maxDist);
    return candidates[Math.floor(Math.random() * candidates.length)];
  },

  findDistantWallLocation(minDist, maxDist) {
    return this.findWallOrPillarLocation(minDist, maxDist);
  },

  // ─────────────────────────────────────────────────────────────
  // WORLD RENDERING (Camera coordinates — inside Camera.apply)
  // ─────────────────────────────────────────────────────────────

  drawWorld(ctx) {
    if (!this.activeHallucinations || this.activeHallucinations.length === 0) return;

    for (let i = 0; i < this.activeHallucinations.length; i++) {
      const h = this.activeHallucinations[i];
      if (h.type === 'PHANTOM_EYE') {
        this.renderPhantomEye(ctx, h);
      } else if (h.type === 'TENTACLE_SHADOW') {
        this.renderTentacleShadow(ctx, h);
      } else if (h.type === 'SHADOW_MOVEMENT') {
        this.renderShadowMovement(ctx, h);
      }
    }
  },

  /**
   * Renders a grounded, organic phantom eye.
   * Fades in, stares, blinks once, fades out.
   */
  renderPhantomEye(ctx, eye) {
    const px = eye.x * T;
    const py = eye.y * T;
    const t = eye.age;
    const dur = eye.lifetime;

    // Fade curve: smooth ease-in (0.35s) and ease-out (0.35s)
    let alpha = 1.0;
    if (t < 0.35) {
      alpha = t / 0.35;
    } else if (t > dur - 0.35) {
      alpha = Math.max(0, (dur - t) / 0.35);
    }
    if (alpha <= 0) return;

    // Blink calculation
    const bTime = eye.blinkTime || dur * 0.5;
    const bDur = eye.blinkDuration || 0.22;
    let openFrac = 1.0;
    if (t >= bTime && t <= bTime + bDur) {
      const bProgress = (t - bTime) / bDur;
      openFrac = Math.sin(bProgress * Math.PI); // 0 -> 1 -> 0
      openFrac = 1.0 - openFrac; // closes then reopens
    }

    const r = (eye.size || 20) * 0.5;

    ctx.save();
    ctx.translate(px, py);
    ctx.globalAlpha = alpha * 0.92;

    // 1. Dark organic eye socket embedding into dungeon wall
    ctx.fillStyle = '#06010a';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.35, r * 0.85 * Math.max(0.1, openFrac), 0, 0, Math.PI * 2);
    ctx.fill();

    // Subtle veins in stone around socket
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
    ctx.lineWidth = 1.0;
    for (let j = 0; j < 3; j++) {
      const vAng = j * 2.1 + (eye.lookAngle || 0);
      ctx.beginPath();
      ctx.moveTo(Math.cos(vAng) * r * 1.1, Math.sin(vAng) * r * 0.7);
      ctx.lineTo(Math.cos(vAng) * r * 1.7, Math.sin(vAng) * r * 1.1);
      ctx.stroke();
    }

    if (openFrac > 0.08) {
      // 2. Sclera (ivory with pale amber/crimson undertone)
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.18, r * 0.72 * openFrac, 0, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(-r * 1.5, -r, r * 3, r * 2);

      // Sclera bloodshot edge shading
      const scGrad = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 1.1);
      scGrad.addColorStop(0, 'rgba(254, 243, 199, 0)');
      scGrad.addColorStop(0.75, 'rgba(239, 68, 68, 0.28)');
      scGrad.addColorStop(1, 'rgba(127, 29, 29, 0.65)');
      ctx.fillStyle = scGrad;
      ctx.fillRect(-r * 1.5, -r, r * 3, r * 2);

      // 3. Iris (Crimson & Amber Ring)
      const lookOffset = Math.sin(t * 1.5) * (r * 0.15);
      const irisX = lookOffset;
      const irisY = 0;
      const irisR = r * 0.52 * openFrac;

      const irisGrad = ctx.createRadialGradient(irisX, irisY, irisR * 0.1, irisX, irisY, irisR);
      irisGrad.addColorStop(0, '#f59e0b');
      irisGrad.addColorStop(0.45, '#dc2626');
      irisGrad.addColorStop(0.85, '#991b1b');
      irisGrad.addColorStop(1, '#450a0a');
      ctx.fillStyle = irisGrad;
      ctx.beginPath();
      ctx.arc(irisX, irisY, irisR, 0, Math.PI * 2);
      ctx.fill();

      // 4. Slit / Elliptical Abyss Pupil
      ctx.fillStyle = '#050108';
      ctx.beginPath();
      ctx.ellipse(irisX, irisY, irisR * 0.35, irisR * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();

      // Specular Reflection Dot
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(irisX - irisR * 0.25, irisY - irisR * 0.3, irisR * 0.18, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 5. Eyelid contours (top & bottom dark rims)
    ctx.strokeStyle = '#180424';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.25, r * 0.78 * Math.max(0.08, openFrac), 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  },

  /**
   * Renders a thin, organic tentacle shadow reaching out from a corner and retracting.
   */
  renderTentacleShadow(ctx, t) {
    const px = t.x * T;
    const py = t.y * T;
    const age = t.age;
    const dur = t.lifetime;

    // Extension progress (extends to peak at 50%, then retracts)
    const prog = Math.sin((age / dur) * Math.PI);
    if (prog <= 0.01) return;

    const len = t.length * prog;
    const ang = t.angle;
    const curl = Math.sin(age * 3.5) * 8 * prog;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(ang);
    ctx.globalAlpha = 0.55 * prog;

    // Organic tapered bezier tentacle silhouette
    ctx.fillStyle = '#080111';
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.quadraticCurveTo(len * 0.5, curl - 3, len, 0);
    ctx.quadraticCurveTo(len * 0.5, curl + 3, 0, 4);
    ctx.closePath();
    ctx.fill();

    // Soft outer shadow fringe
    ctx.strokeStyle = 'rgba(15, 3, 24, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.5, curl, len, 0);
    ctx.stroke();

    ctx.restore();
  },

  /**
   * Renders a subtle gliding shadow silhouette.
   */
  renderShadowMovement(ctx, s) {
    const px = (s.x + s.dx * s.age) * T;
    const py = (s.y + s.dy * s.age) * T;
    const prog = Math.sin((s.age / s.lifetime) * Math.PI);
    if (prog <= 0.01) return;

    ctx.save();
    ctx.translate(px, py);
    ctx.globalAlpha = 0.40 * prog;
    ctx.fillStyle = '#05000a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 8, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────
  // SCREEN-SPACE RENDERING (HUD / UI Level — vignette, subtitles)
  // ─────────────────────────────────────────────────────────────

  drawScreen(ctx) {
    const { P } = GameState;
    if (!P) return;
    const san = P.san !== undefined ? P.san : 100;

    // 1. Subtle, restrained corner vignette below 35% sanity
    // (Never a giant constant purple wash — just soft darker corners with faint violet/crimson edge)
    if (san < 35 && !P.dead) {
      const factor = (35 - san) / 35; // 0.0 to 1.0
      ctx.save();
      const vigGrad = ctx.createRadialGradient(LW / 2, LH / 2, LW * 0.35, LW / 2, LH / 2, LW * 0.75);
      vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      if (san < 15) {
        vigGrad.addColorStop(0.75, `rgba(45, 10, 55, ${factor * 0.22})`);
        vigGrad.addColorStop(1.0, `rgba(20, 2, 10, ${factor * 0.42})`);
      } else {
        vigGrad.addColorStop(0.8, `rgba(25, 8, 38, ${factor * 0.16})`);
        vigGrad.addColorStop(1.0, `rgba(8, 2, 16, ${factor * 0.30})`);
      }
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, LW, LH);
      ctx.restore();
    }

    // 2. Whisper subtitle
    if (this.whisperText && this.whisperTimer > 0) {
      const alpha = Math.min(1, this.whisperTimer * 1.8);
      ctx.save();
      ctx.globalAlpha = alpha * 0.85;
      ctx.fillStyle = '#e9d5ff';
      ctx.font = 'italic 13px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 6;
      ctx.fillText(this.whisperText, LW / 2, LH - 142);
      ctx.restore();
    }
  },

  /**
   * Spawns a scripted phantom eye (used by Shattered Mind cinematic).
   */
  spawnScriptedEye(x, y, size = 20, lifetime = 2.4, blinkTime = 1.2) {
    this.activeHallucinations.push({
      type: 'PHANTOM_EYE',
      x,
      y,
      size,
      lookAngle: 0,
      lifetime,
      age: 0,
      blinkTime,
      blinkDuration: 0.24
    });
  },

  /**
   * Spawns a scripted tentacle shadow (used by Shattered Mind cinematic).
   */
  spawnScriptedTentacle(x, y, angle = 0, length = 28, lifetime = 2.6) {
    this.activeHallucinations.push({
      type: 'TENTACLE_SHADOW',
      x,
      y,
      angle,
      length,
      lifetime,
      age: 0
    });
  },

  /**
   * Spawns a scripted shadow movement.
   */
  spawnScriptedShadow(x, y, dx = 0, dy = 0, lifetime = 2.0) {
    this.activeHallucinations.push({
      type: 'SHADOW_MOVEMENT',
      x,
      y,
      dx,
      dy,
      lifetime,
      age: 0
    });
  },

  clear() {
    this.activeHallucinations = [];
  }
};

// Global Debug Hook (Part 34: Development-only sanity testing)
if (typeof window !== 'undefined') {
  window.HallucinationSystem = HallucinationSystem;
  window.setSanity = function(val) {
    if (GameState.P) {
      GameState.P.san = Math.max(0, Math.min(100, val));
      console.log(`[Debug] Sanity manually set to: ${GameState.P.san}%`);
      if (GameState.P.san <= 0) {
        import('./SanitySystem.js').then(m => m.SanitySystem.triggerSanityDeath());
      }
    }
  };
}
