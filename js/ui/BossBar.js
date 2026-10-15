// =====================================================================
//  DUNGEON BREAK — js/ui/BossBar.js
//  Phase 5.3: Legendary Combat Interface — Bespoke Pixel-Art Health Vessels
//  Handcrafted Boss Vessels · Deep Living Blood Fluid · Custom Silhouettes
//  Authoritative tracking for Gorgaroth, Malakor, and The Abyss Warden
// =====================================================================

import { GameState } from '../core/GameState.js';
import { LW } from '../core/Constants.js';

export const BossBar = {
  draw(ctx) {
    const mb = GameState.ACTIVE_MINIBOSS || GameState.BOSS;
    if (!mb || !mb.alive || mb.hp <= 0) return;

    // Boss bar dimensions & coordinates (centered widescreen presentation)
    const barW = 460;
    const barH = 22;
    const barX = Math.round(LW / 2 - barW / 2);
    const barY = 24;

    const maxHp = mb.maxHp || 100;
    const curHp = mb.hp !== undefined ? Math.max(0, mb.hp) : maxHp;
    const frac = Math.max(0, Math.min(1, curHp / maxHp));

    const dt = GameState.DT || 0.016;
    const simTime = (GameState.T !== undefined ? GameState.T : (GameState.F || 0) * 0.025);

    // ─────────────────────────────────────────────────────────────
    // 1. ONE-SHOT COMBAT HIT & DAMAGE DETECTION (Deterministic)
    // ─────────────────────────────────────────────────────────────
    if (mb._lastRecordedHp === undefined) {
      mb._lastRecordedHp = curHp;
      mb._bloodDisturbance = 0;
      mb._prevPhase = mb.phase || 1;
      mb._phaseTransitionTimer = 0;
      mb._bloodDroplets = [];
      mb._vitalCells = [];
      // Initialize 5 persistent vital cells drifting through the blood
      for (let i = 0; i < 5; i++) {
        mb._vitalCells.push({
          relX: (i / 5),
          relY: 0.2 + (i % 3) * 0.25,
          speed: 0.03 + (i % 2) * 0.025,
          radius: (i % 2 === 0) ? 2 : 1,
          pulsePhase: i * 1.2
        });
      }
    } else if (mb._lastRecordedHp > curHp) {
      const dmg = mb._lastRecordedHp - curHp;
      if (GameState.REDUCED_MOTION) {
        mb._bloodDisturbance = 0;
        mb._bloodDroplets = [];
      } else {
        // Scaled reaction intensity: 0.35 for chip damage up to 1.0 for heavy attacks
        const intensity = Math.min(1.0, Math.max(0.35, dmg / (maxHp * 0.06)));
        mb._bloodDisturbance = intensity;

        // Spawn contained droplet flecks that surge within remaining fluid
        mb._bloodDroplets = [];
        const numDroplets = Math.min(6, Math.max(3, Math.round(intensity * 5)));
        for (let i = 0; i < numDroplets; i++) {
          mb._bloodDroplets.push({
            relX: Math.max(0.02, frac - (Math.random() * 0.08 + 0.01)),
            relY: Math.random() * 0.7 + 0.15,
            vx: (Math.random() - 0.5) * 0.09,
            vy: (Math.random() - 0.5) * 0.07,
            size: Math.random() < 0.4 ? 2 : 1,
            life: 0.45 + Math.random() * 0.35,
            maxLife: 0.8
          });
        }
      }
      mb._lastRecordedHp = curHp;
    } else if (mb._lastRecordedHp < curHp) {
      mb._lastRecordedHp = curHp;
    }

    if (GameState.REDUCED_MOTION) {
      mb._bloodDisturbance = 0;
      mb._bloodDroplets = [];
    }

    // Phase transition detection
    if (mb.phase && mb._prevPhase !== mb.phase) {
      mb._prevPhase = mb.phase;
      mb._phaseTransitionTimer = 1.4;
      mb._bloodDisturbance = 0.85;
    }

    // Decay disturbance and phase transition timers
    if (mb._bloodDisturbance > 0) {
      mb._bloodDisturbance = Math.max(0, mb._bloodDisturbance - dt * 1.5);
    }
    if (mb._phaseTransitionTimer > 0) {
      mb._phaseTransitionTimer = Math.max(0, mb._phaseTransitionTimer - dt);
    }

    // Update contained droplets
    if (mb._bloodDroplets && mb._bloodDroplets.length > 0) {
      for (let i = mb._bloodDroplets.length - 1; i >= 0; i--) {
        const d = mb._bloodDroplets[i];
        d.life -= dt;
        d.relX += d.vx * dt;
        d.relY += d.vy * dt;
        if (d.life <= 0) {
          mb._bloodDroplets.splice(i, 1);
        }
      }
    }

    // Trailing damage ghost HP bar
    if (mb._ghostHp === undefined || mb._ghostHp < curHp) {
      mb._ghostHp = curHp;
    }
    if (GameState.REDUCED_MOTION) {
      mb._ghostHp = curHp;
    } else if (mb._ghostHp > curHp) {
      const decay = (mb._ghostHp - curHp) * 3.5 * dt + dt * 10;
      mb._ghostHp = Math.max(curHp, mb._ghostHp - decay);
    }
    const ghostFrac = Math.max(0, Math.min(1, mb._ghostHp / maxHp));

    // ─────────────────────────────────────────────────────────────
    // 2. BOSS IDENTIFICATION & THEMATIC CRAFTSMANSHIP PALETTES
    // ─────────────────────────────────────────────────────────────
    const id = (mb.id || '').toLowerCase();
    const nameStr = mb.name || 'Abyss Titan';
    const isGorgaroth = id.includes('gorgaroth') || nameStr.toLowerCase().includes('gorgaroth');
    const isMalakor = id.includes('malakor') || nameStr.toLowerCase().includes('malakor');
    const isWarden = id.includes('warden') || nameStr.toLowerCase().includes('warden');

    let titleColor = '#fde68a';
    let framePrimary = '#c9a84c';
    let frameDark = '#1c1917';
    let frameHighlight = '#78716c';
    let trailColor = 'rgba(251, 146, 60, 0.75)';
    let trailLeadColor = '#fbbf24';
    let notchPositions = [];
    let phaseBadge = '';

    // Living blood multi-layer palette (Dense dark base -> arterial midtone -> luminous crest)
    let fluidBaseCol = '#2a0408';
    let fluidMidCol = '#881337';
    let fluidCrestCol = '#dc2626';
    let eddyCol = 'rgba(254, 202, 202, 0.55)';
    let meniscusCol = '#fecaca';

    if (isGorgaroth) {
      // Gorgaroth: The Forged Blood Reliquary (Heavy Iron Clamps, Rivets & Molten Seams)
      titleColor = '#fed7aa';
      framePrimary = '#ea580c';
      frameDark = '#141211';
      frameHighlight = '#78716c';
      trailColor = 'rgba(253, 186, 116, 0.8)';
      trailLeadColor = '#fb923c';
      notchPositions = [0.5]; // Phase 2 transition at <= 50% HP
      phaseBadge = (mb.phase === 2 || frac <= 0.5) ? 'PHASE II · MOLTEN RAGE' : 'PHASE I · FORGE TITAN';
      fluidBaseCol = '#2c0702';
      fluidMidCol = '#9a3412';
      fluidCrestCol = '#ea580c';
      eddyCol = 'rgba(251, 191, 36, 0.65)';
      meniscusCol = '#ffedd5';
    } else if (isMalakor) {
      // Malakor: The Fractured Void Reliquary (Asymmetric Obsidian Shards & Astral Violet)
      titleColor = '#f5d0fe';
      framePrimary = '#a855f7';
      frameDark = '#090514';
      frameHighlight = '#581c87';
      trailColor = 'rgba(216, 180, 254, 0.8)';
      trailLeadColor = '#c084fc';
      notchPositions = [0.5, 0.25]; // Phase 2 at <= 50%, Phase 3 at <= 25%
      if (mb.phase === 3 || frac <= 0.25) {
        phaseBadge = 'PHASE III · APOTHEOSIS';
      } else if (mb.phase === 2 || frac <= 0.5) {
        phaseBadge = 'PHASE II · VOID RIFT';
      } else {
        phaseBadge = 'PHASE I · VOID HARBINGER';
      }
      fluidBaseCol = '#1a052e';
      fluidMidCol = '#6b21a8';
      fluidCrestCol = '#9333ea';
      eddyCol = 'rgba(192, 132, 252, 0.6)';
      meniscusCol = '#f5d0fe';
    } else if (isWarden) {
      // Abyss Warden: The Primordial Gate Reliquary (Gothic 5-Spire Crown & Ruby Blood)
      titleColor = '#ffe4e6';
      framePrimary = '#e11d48';
      frameDark = '#0c0205';
      frameHighlight = '#881337';
      trailColor = 'rgba(254, 205, 211, 0.85)';
      trailLeadColor = '#f43f5e';
      notchPositions = [0.7, 0.35]; // Phase 2 at <= 70%, Phase 3 at <= 35%
      if (mb.phase === 3 || frac <= 0.35) {
        phaseBadge = 'PHASE III · CATACLYSM';
      } else if (mb.phase === 2 || frac <= 0.7) {
        phaseBadge = 'PHASE II · BULWARK CRACKED';
      } else {
        phaseBadge = 'PHASE I · ANCIENT SENTINEL';
      }
      fluidBaseCol = '#24020a';
      fluidMidCol = '#9f1239';
      fluidCrestCol = '#e11d48';
      eddyCol = 'rgba(251, 113, 133, 0.65)';
      meniscusCol = '#ffe4e6';
    } else {
      phaseBadge = mb.phase ? `PHASE ${mb.phase}` : '';
    }

    const flare = mb._phaseTransitionTimer > 0 ? Math.sin(mb._phaseTransitionTimer * Math.PI) * 0.5 : 0;
    const dist = mb._bloodDisturbance || 0;

    ctx.save();

    // ─────────────────────────────────────────────────────────────
    // 3. BESPOKE PIXEL-ART VESSEL SILHOUETTES & LAYERED CRAFTSMANSHIP
    // ─────────────────────────────────────────────────────────────
    const innerX = barX + 18;
    const innerY = barY + 3;
    const innerW = barW - 36;
    const innerH = barH - 6;

    if (isGorgaroth) {
      // ───────────────────────────────────────────────────────────
      // A. GORGAROTH: THE FORGED BLOOD RELIQUARY
      // Heavy Stepped Iron Reliquary · Dual Clamp Teeth · Molten Seams
      // ───────────────────────────────────────────────────────────

      // 1. Shadow Drop (Deep 2px silhouette offset for tactile weight)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.moveTo(barX - 14, barY + 4);
      ctx.lineTo(barX - 4, barY + 2);
      ctx.lineTo(barX + barW + 4, barY + 2);
      ctx.lineTo(barX + barW + 14, barY + 4);
      ctx.lineTo(barX + barW + 14, barY + barH + 2);
      ctx.lineTo(barX + barW + 4, barY + barH + 4);
      ctx.lineTo(barX - 4, barY + barH + 4);
      ctx.lineTo(barX - 14, barY + barH + 2);
      ctx.closePath();
      ctx.fill();

      // 2. Heavy Forged Iron Outer Reliquary Silhouette
      ctx.beginPath();
      // Left stepped clamp teeth
      ctx.moveTo(barX - 14, barY + 2);
      ctx.lineTo(barX - 6, barY);
      ctx.lineTo(barX + barW + 6, barY);
      ctx.lineTo(barX + barW + 14, barY + 2);
      // Right clamp outer bracket
      ctx.lineTo(barX + barW + 14, barY + barH - 2);
      ctx.lineTo(barX + barW + 6, barY + barH);
      ctx.lineTo(barX - 6, barY + barH);
      ctx.lineTo(barX - 14, barY + barH - 2);
      ctx.closePath();

      ctx.fillStyle = frameDark;
      ctx.fill();

      // 3. Layered Stepped Iron Rim & Bevel Shading
      ctx.strokeStyle = flare > 0 ? '#fde68a' : framePrimary;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Top specular highlight rail (forged metal catching overhead light)
      ctx.fillStyle = '#a8a29e';
      ctx.fillRect(barX - 4, barY + 1, barW + 8, 1);

      // Bottom shadow bevel line
      ctx.fillStyle = '#0c0a09';
      ctx.fillRect(barX - 4, barY + barH - 2, barW + 8, 1);

      // 4. Heavy Forged Clamp End Assemblies (Mechanically bolted end brackets)
      // Left Clamp Bracket (stepped interlocking teeth)
      ctx.fillStyle = '#292524';
      ctx.fillRect(barX - 12, barY + 3, 10, barH - 6);
      ctx.fillStyle = '#44403c';
      ctx.fillRect(barX - 10, barY + 5, 6, barH - 10);
      // Left Clamp Hinge Pin & Rivet Studs
      ctx.fillStyle = '#ea580c'; // molten core
      ctx.fillRect(barX - 9, barY + 6, 4, 3);
      ctx.fillRect(barX - 9, barY + barH - 9, 4, 3);
      ctx.fillStyle = '#fed7aa'; // specular glint
      ctx.fillRect(barX - 8, barY + 7, 2, 1);
      ctx.fillRect(barX - 8, barY + barH - 8, 2, 1);

      // Right Clamp Bracket
      ctx.fillStyle = '#292524';
      ctx.fillRect(barX + barW + 2, barY + 3, 10, barH - 6);
      ctx.fillStyle = '#44403c';
      ctx.fillRect(barX + barW + 4, barY + 5, 6, barH - 10);
      // Right Clamp Hinge Pin & Rivet Studs
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(barX + barW + 5, barY + 6, 4, 3);
      ctx.fillRect(barX + barW + 5, barY + barH - 9, 4, 3);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(barX + barW + 6, barY + 7, 2, 1);
      ctx.fillRect(barX + barW + 6, barY + barH - 8, 2, 1);

      // 5. Molten Seams & Heat Vents (Glowing seams where iron retains heat)
      ctx.fillStyle = 'rgba(234, 88, 12, 0.7)';
      ctx.fillRect(barX + 2, barY + 1, 8, 1);
      ctx.fillRect(barX + barW - 10, barY + 1, 8, 1);
      ctx.fillRect(barX + 2, barY + barH - 2, 8, 1);
      ctx.fillRect(barX + barW - 10, barY + barH - 2, 8, 1);

      // 6. Lower Forged Anchor Bracket (Weighty central support block)
      const ancW = 50;
      const ancX = barX + barW / 2 - ancW / 2;
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(ancX, barY + barH, ancW, 4);
      ctx.fillStyle = '#44403c';
      ctx.fillRect(ancX + 4, barY + barH + 1, ancW - 8, 2);
      ctx.strokeStyle = framePrimary;
      ctx.lineWidth = 1.0;
      ctx.strokeRect(ancX, barY + barH, ancW, 4);
      // Anchor rivets
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(ancX + 8, barY + barH + 1, 2, 2);
      ctx.fillRect(ancX + ancW - 10, barY + barH + 1, 2, 2);

      // 7. Top Stepped Forged Iron Header Plate
      const headW = barW - 36;
      const headX = barX + 18;
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(headX, barY - 14, headW, 14);
      ctx.strokeStyle = framePrimary;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(headX, barY - 14, headW, 14);
      // Header corner iron braces
      ctx.fillStyle = '#44403c';
      ctx.fillRect(headX, barY - 14, 5, 5);
      ctx.fillRect(headX + headW - 5, barY - 14, 5, 5);

    } else if (isMalakor) {
      // ───────────────────────────────────────────────────────────
      // B. MALAKOR: THE FRACTURED VOID RELIQUARY
      // Asymmetric Obsidian Shards · Spacetime Fractures · Amethyst Insets
      // ───────────────────────────────────────────────────────────

      // Cosmetic frame fracture displacement on confirmed damage
      const fragShift = (!GameState.REDUCED_MOTION && dist > 0)
        ? Math.sin(simTime * 24.0) * dist * 1.8
        : 0;

      // 1. Deep Shadow Silhouette
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.beginPath();
      ctx.moveTo(barX - 16, barY + 3);
      ctx.lineTo(barX - 6, barY + 2);
      ctx.lineTo(barX + barW + 10, barY + 2);
      ctx.lineTo(barX + barW + 18, barY + 8);
      ctx.lineTo(barX + barW + 8, barY + barH + 4);
      ctx.lineTo(barX - 10, barY + barH + 5);
      ctx.closePath();
      ctx.fill();

      // 2. Asymmetric Jagged Obsidian Chassis Path
      ctx.beginPath();
      // Left end: jutting upward crystal shard
      ctx.moveTo(barX - 16, barY - 4 + fragShift);
      ctx.lineTo(barX - 6, barY);
      ctx.lineTo(barX + barW / 3, barY);
      // Center displaced fracture peak
      ctx.lineTo(barX + barW / 2 - 16, barY);
      ctx.lineTo(barX + barW / 2, barY - 4 - fragShift * 0.5);
      ctx.lineTo(barX + barW / 2 + 16, barY);
      ctx.lineTo(barX + barW + 6, barY);
      // Right end: dual staggered jagged obsidian shards
      ctx.lineTo(barX + barW + 18, barY + 5 - fragShift);
      ctx.lineTo(barX + barW + 10, barY + barH - 1);
      ctx.lineTo(barX + barW + 14, barY + barH + 3 + fragShift);
      ctx.lineTo(barX + 6, barY + barH);
      ctx.lineTo(barX - 10, barY + barH + 3);
      ctx.closePath();

      ctx.fillStyle = frameDark;
      ctx.fill();
      ctx.strokeStyle = flare > 0 ? '#f5d0fe' : framePrimary;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // 3. Faceted Obsidian Specular Edges
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(barX - 14, barY - 2, 8, 1);
      ctx.fillRect(barX + barW / 2 - 4, barY - 3, 8, 1);
      ctx.fillRect(barX + barW + 8, barY + 7, 7, 1);

      // 4. Recessed Amethyst Gem Brackets (Faceted jewel cuts)
      // Left Amethyst Rune Mount
      ctx.fillStyle = '#3b0764';
      ctx.fillRect(barX - 11, barY + 3, 6, 6);
      ctx.fillStyle = '#9333ea';
      ctx.fillRect(barX - 10, barY + 4, 4, 4);
      ctx.fillStyle = '#f5d0fe';
      ctx.fillRect(barX - 9, barY + 5, 2, 2);

      // Right Amethyst Rune Mount
      ctx.fillStyle = '#3b0764';
      ctx.fillRect(barX + barW + 4, barY + barH - 8, 6, 6);
      ctx.fillStyle = '#9333ea';
      ctx.fillRect(barX + barW + 5, barY + barH - 7, 4, 4);
      ctx.fillStyle = '#f5d0fe';
      ctx.fillRect(barX + barW + 6, barY + barH - 6, 2, 2);

      // 5. Spacetime Fracture Pinstripes (Subtle cosmic interruptions)
      ctx.fillStyle = 'rgba(216, 180, 254, 0.45)';
      ctx.fillRect(barX + 70, barY - 2, 1, 5);
      ctx.fillRect(barX + 72, barY + 1, 2, 1);
      ctx.fillRect(barX + barW - 90, barY + barH - 3, 1, 5);
      ctx.fillRect(barX + barW - 92, barY + barH - 2, 2, 1);

      // 6. Header Plate with Void Crystal Accents
      const headW = barW - 40;
      const headX = barX + 20;
      ctx.fillStyle = '#0f051d';
      ctx.fillRect(headX, barY - 14, headW, 14);
      ctx.strokeStyle = framePrimary;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(headX, barY - 14, headW, 14);
      // Crystal facet notches on header
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(headX + 4, barY - 14, 3, 3);
      ctx.fillRect(headX + headW - 7, barY - 14, 3, 3);

    } else if (isWarden) {
      // ───────────────────────────────────────────────────────────
      // C. THE ABYSS WARDEN: THE PRIMORDIAL GATE RELIQUARY
      // Gothic 5-Spire Crown Cathedral Vessel · Ruby Mounts · Spires
      // ───────────────────────────────────────────────────────────

      // 1. Deep Shadow Drop
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.beginPath();
      ctx.moveTo(barX - 16, barY + 3);
      ctx.lineTo(barX - 6, barY - 4);
      ctx.lineTo(barX + barW + 6, barY - 4);
      ctx.lineTo(barX + barW + 16, barY + 3);
      ctx.lineTo(barX + barW + 8, barY + barH + 4);
      ctx.lineTo(barX - 8, barY + barH + 4);
      ctx.closePath();
      ctx.fill();

      // 2. Imposing Gothic 5-Spire Crown Cathedral Silhouette
      ctx.beginPath();
      // Left tall corner pylon spire
      ctx.moveTo(barX - 14, barY + 4);
      ctx.lineTo(barX - 6, barY - 5); // Corner fang spire
      ctx.lineTo(barX + 35, barY);
      // Spire 2: Left intermediate spire
      ctx.lineTo(barX + barW / 4 - 8, barY);
      ctx.lineTo(barX + barW / 4, barY - 4);
      ctx.lineTo(barX + barW / 4 + 8, barY);
      ctx.lineTo(barX + barW / 2 - 16, barY);
      // Spire 3: Grand Center Cathedral Finial Peak
      ctx.lineTo(barX + barW / 2, barY - 7);
      ctx.lineTo(barX + barW / 2 + 16, barY);
      ctx.lineTo(barX + (3 * barW) / 4 - 8, barY);
      // Spire 4: Right intermediate spire
      ctx.lineTo(barX + (3 * barW) / 4, barY - 4);
      ctx.lineTo(barX + (3 * barW) / 4 + 8, barY);
      ctx.lineTo(barX + barW - 35, barY);
      // Spire 5: Right corner fang spire
      ctx.lineTo(barX + barW + 6, barY - 5);
      ctx.lineTo(barX + barW + 14, barY + 4);
      // Lower gothic base arch
      ctx.lineTo(barX + barW + 6, barY + barH);
      ctx.lineTo(barX + barW / 2 + 30, barY + barH);
      ctx.lineTo(barX + barW / 2, barY + barH + 3); // center lower pendant notch
      ctx.lineTo(barX + barW / 2 - 30, barY + barH);
      ctx.lineTo(barX - 6, barY + barH);
      ctx.closePath();

      ctx.fillStyle = frameDark;
      ctx.fill();
      ctx.strokeStyle = flare > 0 ? '#ffe4e6' : framePrimary;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // 3. Multi-tiered Obsidian & Ruby Bevel Highlights
      ctx.fillStyle = '#fda4af';
      ctx.fillRect(barX + barW / 2 - 3, barY - 6, 6, 1);
      ctx.fillRect(barX - 5, barY - 4, 3, 1);
      ctx.fillRect(barX + barW + 2, barY - 4, 3, 1);

      // 4. Gothic Cathedral Pylon End Caps & Ruby Jewel Mounts
      // Left Ruby Pylon
      ctx.fillStyle = '#4c0519';
      ctx.fillRect(barX - 10, barY + 3, 8, barH - 6);
      ctx.fillStyle = '#be123c';
      ctx.fillRect(barX - 8, barY + 5, 4, barH - 10);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(barX - 7, barY + 7, 3, 3);
      ctx.fillStyle = '#ffffff'; // ruby specular sparkle
      ctx.fillRect(barX - 6, barY + 8, 1, 1);

      // Right Ruby Pylon
      ctx.fillStyle = '#4c0519';
      ctx.fillRect(barX + barW + 2, barY + 3, 8, barH - 6);
      ctx.fillStyle = '#be123c';
      ctx.fillRect(barX + barW + 4, barY + 5, 4, barH - 10);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(barX + barW + 5, barY + 7, 3, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(barX + barW + 6, barY + 8, 1, 1);

      // Center Crown Jewel Mount
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(barX + barW / 2 - 2, barY - 4, 4, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(barX + barW / 2 - 1, barY - 3, 1, 1);

      // 5. Header Plate with Gothic Arch Cresting
      const headW = barW - 36;
      const headX = barX + 18;
      ctx.fillStyle = '#18040a';
      ctx.fillRect(headX, barY - 15, headW, 15);
      ctx.strokeStyle = framePrimary;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(headX, barY - 15, headW, 15);
      // Top arch finials
      ctx.fillStyle = '#fb7185';
      ctx.fillRect(headX + 5, barY - 15, 2, 2);
      ctx.fillRect(headX + headW - 7, barY - 15, 2, 2);

    } else {
      // Fallback
      ctx.fillStyle = frameDark;
      ctx.fillRect(barX, barY, barW, barH);
      ctx.strokeStyle = framePrimary;
      ctx.strokeRect(barX, barY, barW, barH);
    }

    // ─────────────────────────────────────────────────────────────
    // 4. INTEGRATED BOSS TITLE & PHASE BADGE (Aligned on Header)
    // ─────────────────────────────────────────────────────────────
    ctx.font = 'bold 10px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = titleColor;
    ctx.fillText(nameStr.toUpperCase(), barX + 28, barY - 7);

    if (phaseBadge) {
      ctx.textAlign = 'right';
      ctx.font = 'bold 8.5px Cinzel, serif';
      ctx.fillStyle = flare > 0 ? '#ffffff' : framePrimary;
      ctx.fillText(phaseBadge, barX + barW - 28, barY - 7);
    }

    // ─────────────────────────────────────────────────────────────
    // 5. CUSTOM-SHAPED INNER CAVITY & MULTI-LAYER LIVING BLOOD
    // ─────────────────────────────────────────────────────────────
    // Deep carved stone basin interior with multi-tone recessed depth
    ctx.fillStyle = '#060408';
    ctx.fillRect(innerX, innerY, innerW, innerH);

    // Beveled cavity inner shadow (top/left shadow, bottom specular highlight)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(innerX, innerY, innerW, 1);
    ctx.fillRect(innerX, innerY, 1, innerH);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(innerX, innerY + innerH - 1, innerW, 1);

    // Stone measurement notches inside empty cavity
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let tx = innerX + 24; tx < innerX + innerW; tx += 24) {
      ctx.fillRect(tx, innerY + 1, 1, innerH - 2);
    }

    // Trailing Damage Ghost Fill (Tracks recent authoritative hits)
    if (ghostFrac > frac) {
      const gX = innerX;
      const gW = Math.round(innerW * ghostFrac);
      ctx.fillStyle = trailColor;
      ctx.fillRect(gX, innerY, gW, innerH);

      // Trailing edge demarcation line
      ctx.fillStyle = trailLeadColor;
      ctx.fillRect(gX + gW - 2, innerY, 2, innerH);
    }

    // Authoritative Living Blood Fill (Clipped inside custom vessel cavity)
    if (frac > 0) {
      const fillW = Math.round(innerW * frac);

      ctx.save();
      // Clip tightly to the fluid channel
      ctx.beginPath();
      ctx.rect(innerX, innerY, fillW, innerH);
      ctx.clip();

      if (GameState.REDUCED_MOTION) {
        // Reduced Motion: Stable, crisp multi-tone textured fill with static meniscus
        const baseGrad = ctx.createLinearGradient(innerX, innerY, innerX, innerY + innerH);
        baseGrad.addColorStop(0, fluidCrestCol);
        baseGrad.addColorStop(0.35, fluidMidCol);
        baseGrad.addColorStop(1, fluidBaseCol);
        ctx.fillStyle = baseGrad;
        ctx.fillRect(innerX, innerY, fillW, innerH);

        // Specular top highlight rail
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(innerX, innerY, fillW, 2);

        // Crisp static meniscus line
        ctx.fillStyle = meniscusCol;
        ctx.fillRect(innerX + fillW - 2, innerY, 2, innerH);
      } else {
        // ─────────────────────────────────────────────────────────
        // LIVING BLOOD SIMULATION (Layers 1–7)
        // ─────────────────────────────────────────────────────────

        // Layer 1: Deep Blood Foundation (Dense arterial vertical gradient with depth)
        const fluidGrad = ctx.createLinearGradient(innerX, innerY, innerX, innerY + innerH);
        fluidGrad.addColorStop(0, fluidCrestCol);
        fluidGrad.addColorStop(0.35, fluidMidCol);
        fluidGrad.addColorStop(1, fluidBaseCol);
        ctx.fillStyle = fluidGrad;
        ctx.fillRect(innerX, innerY, fillW, innerH);

        // Layer 2: Interconnected Flowing Currents (Counter-moving stepped bands)
        // Primary upper current (drifting forward at simTime * 2.2)
        const wave1Speed = simTime * 2.2 + dist * 5.0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.11)';
        for (let bx = 0; bx < fillW; bx += 6) {
          const waveY = Math.sin((bx * 0.045) - wave1Speed) * (1.6 + dist * 2.4);
          ctx.fillRect(innerX + bx, Math.round(innerY + 3 + waveY), 3, 2);
        }

        // Secondary deep undercurrent (drifting backward at simTime * 1.3)
        const wave2Speed = simTime * 1.3;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        for (let bx = 0; bx < fillW; bx += 7) {
          const waveY = Math.cos((bx * 0.038) + wave2Speed) * 1.4;
          ctx.fillRect(innerX + bx, Math.round(innerY + 10 + waveY), 4, 2);
        }

        // Layer 4: Suspended Vitality Cells / Droplet Eddies
        if (mb._vitalCells) {
          for (const cell of mb._vitalCells) {
            const cx = innerX + ((simTime * cell.speed * 280 + cell.relX * fillW) % fillW);
            const cy = innerY + 3 + Math.sin(simTime * 2.8 + cell.pulsePhase) * 3.5;
            const glow = Math.sin(simTime * 3.2 + cell.pulsePhase) * 0.3 + 0.7;
            ctx.fillStyle = eddyCol;
            ctx.globalAlpha = glow;
            ctx.fillRect(Math.round(cx), Math.round(cy), cell.radius, cell.radius);
            ctx.globalAlpha = 1.0;
          }
        }

        // Layer 3: Distinct Liquid Surface & Undulating Meniscus
        const edgeX = innerX + fillW;
        for (let py = 0; py < innerH; py++) {
          // Complex organic wave surface combining 2 harmonic waves
          const waveHarmonic = Math.sin((py / innerH) * Math.PI * 2.5 + simTime * 4.8) * 1.2
            + Math.cos((py / innerH) * Math.PI * 1.5 - simTime * 3.2) * 0.8;
          const rippleDx = waveHarmonic * (1.0 + dist * 3.2);
          const mx = Math.max(innerX, edgeX - 2 + rippleDx);
          ctx.fillStyle = meniscusCol;
          ctx.fillRect(Math.round(mx), innerY + py, 2, 1);
        }

        // Layer 5: Confirmed-Hit Contained Droplet Reaction
        if (mb._bloodDroplets && mb._bloodDroplets.length > 0) {
          for (const drop of mb._bloodDroplets) {
            const dx = innerX + Math.round(drop.relX * innerW);
            const dy = innerY + Math.round(drop.relY * innerH);
            if (dx >= innerX && dx <= innerX + fillW && dy >= innerY && dy <= innerY + innerH) {
              const alpha = Math.max(0, drop.life / drop.maxLife);
              ctx.fillStyle = flare > 0 ? '#ffffff' : meniscusCol;
              ctx.globalAlpha = alpha;
              ctx.fillRect(dx, dy, drop.size, drop.size);
              ctx.globalAlpha = 1.0;
            }
          }
        }
      }

      // Specular Top Sheen Highlight Rail (Reflective surface line)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.fillRect(innerX, innerY, fillW, 2);

      ctx.restore();
    }

    // ─────────────────────────────────────────────────────────────
    // 6. PHASE THRESHOLD NOTCHES (Canonical Divider Pylons)
    // ─────────────────────────────────────────────────────────────
    for (const notchFrac of notchPositions) {
      const notchX = Math.round(innerX + innerW * notchFrac);

      // Deep carved groove through cavity
      ctx.fillStyle = 'rgba(3, 2, 5, 0.98)';
      ctx.fillRect(notchX - 1, innerY - 2, 3, innerH + 4);

      if (isGorgaroth) {
        // Forged iron divider clamp with molten ember core
        ctx.fillStyle = flare > 0 ? '#fbbf24' : '#ea580c';
        ctx.fillRect(notchX, innerY - 1, 1, innerH + 2);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(notchX - 2, innerY - 3, 5, 2);
        ctx.fillRect(notchX - 2, innerY + innerH + 1, 5, 2);
      } else if (isMalakor) {
        // Astral crystal marker with faceted pylon brackets
        ctx.fillStyle = flare > 0 ? '#f5d0fe' : '#a855f7';
        ctx.fillRect(notchX, innerY - 1, 1, innerH + 2);
        ctx.fillStyle = '#c084fc';
        ctx.fillRect(notchX - 1, innerY - 3, 3, 2);
        ctx.fillRect(notchX - 1, innerY + innerH + 1, 3, 2);
      } else if (isWarden) {
        // Ruby pylon spire with antique gold mounts
        ctx.fillStyle = flare > 0 ? '#ffe4e6' : '#e11d48';
        ctx.fillRect(notchX, innerY - 1, 1, innerH + 2);
        ctx.fillStyle = '#fb7185';
        ctx.fillRect(notchX - 1, innerY - 3, 3, 2);
        ctx.fillRect(notchX - 1, innerY + innerH + 1, 3, 2);
      } else {
        ctx.fillStyle = framePrimary;
        ctx.fillRect(notchX, innerY, 1, innerH);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 7. PRECISE NUMERIC HEALTH READOUT
    // ─────────────────────────────────────────────────────────────
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 4;
    ctx.fillText(`${Math.ceil(curHp)} / ${maxHp}`, LW / 2, innerY + innerH / 2);
    ctx.shadowBlur = 0;

    ctx.restore();
  }
};

export function drawMiniBossHUD(ctx) {
  BossBar.draw(ctx);
}
