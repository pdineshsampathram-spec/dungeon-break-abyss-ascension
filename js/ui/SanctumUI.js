// =====================================================================
//  DUNGEON BREAK — js/ui/SanctumUI.js
//  Authoritative Abyss Sanctum: Ascension Altar & Celestial Constellation
//  Architecture: Sacred Vault Arch, Celestial Discipline Map, Altar Infusion Slab
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, roundRect } from '../core/Constants.js';
import { TALENT_DEFS, TALENT_KEYS, TALENT_CATEGORIES, LEGACY_DEFS, LEGACY_KEYS } from '../data/talents.js';
import { ProgressionSystem } from '../systems/ProgressionSystem.js';
import { AudioManager } from '../audio/AudioManager.js';
import { InputManager } from '../core/InputManager.js';
import {
  drawStoneButton,
  drawStoneTab,
  drawStonePanel,
  drawStoneCard,
  drawStoneBadge,
  drawCornerBrackets
} from './ButtonArtManager.js?v=2.0';

let SANCTUM_SLIDE = 0;
let _currentMode = 'talents'; // 'talents' | 'legacy'
let _currentCategory = 'survival'; // 'survival' | 'weapons' | 'technique' | 'utility'
let _selectedKey = 'vitality';
let _ambientTimer = 0;
const _interactiveZones = [];

// Constellation Coordinates within the Celestial Chamber (500x350)
const CONSTELLATION_LAYOUTS = {
  survival: {
    nodes: [
      { id: 'vitality',   x: 250, y: 75,  label: 'Bloodline Vigor' },
      { id: 'iron_skin',  x: 140, y: 240, label: 'Defensive Mastery' },
      { id: 'resilience', x: 360, y: 240, label: 'Resilience' }
    ],
    conduits: [
      ['vitality', 'iron_skin'],
      ['vitality', 'resilience'],
      ['iron_skin', 'resilience']
    ]
  },
  weapons: {
    nodes: [
      { id: 'hunters_focus',    x: 250, y: 60,  label: 'Hunter\'s Focus' },
      { id: 'rift_discipline',  x: 120, y: 175, label: 'Rift Discipline' },
      { id: 'lance_precision',  x: 380, y: 175, label: 'Precision Lance' },
      { id: 'explosive_might',  x: 250, y: 290, label: 'Explosive Axe' }
    ],
    conduits: [
      ['hunters_focus', 'rift_discipline'],
      ['hunters_focus', 'lance_precision'],
      ['rift_discipline', 'explosive_might'],
      ['lance_precision', 'explosive_might'],
      ['rift_discipline', 'lance_precision'],
      ['hunters_focus', 'explosive_might']
    ]
  },
  technique: {
    nodes: [
      { id: 'fury',              x: 150, y: 100, label: 'Abyssal Might' },
      { id: 'haste',             x: 350, y: 100, label: 'Phantom Haste' },
      { id: 'technique_mastery', x: 250, y: 260, label: 'Technique Mastery' }
    ],
    conduits: [
      ['fury', 'haste'],
      ['fury', 'technique_mastery'],
      ['haste', 'technique_mastery']
    ]
  },
  utility: {
    nodes: [
      { id: 'clarity',      x: 180, y: 70,  label: 'Mind Sanctuary' },
      { id: 'siphon',       x: 330, y: 175, label: 'Vampiric Touch' },
      { id: 'soul_harvest', x: 180, y: 280, label: 'Soul Harvest' }
    ],
    conduits: [
      ['clarity', 'siphon'],
      ['siphon', 'soul_harvest'],
      ['clarity', 'soul_harvest']
    ]
  },
  legacy: {
    nodes: [
      { id: 'legacy_souls',    x: 80,  y: 220, label: "Soul's Due" },
      { id: 'legacy_defense',  x: 170, y: 130, label: 'Iron Memory' },
      { id: 'legacy_mastery',  x: 260, y: 80,  label: 'Weapon Discipline' },
      { id: 'legacy_defiance', x: 350, y: 130, label: 'Last Defiance' },
      { id: 'legacy_sanity',   x: 440, y: 220, label: 'Echo Keeper' }
    ],
    conduits: [
      ['legacy_souls', 'legacy_defense'],
      ['legacy_defense', 'legacy_mastery'],
      ['legacy_mastery', 'legacy_defiance'],
      ['legacy_defiance', 'legacy_sanity'],
      ['legacy_defense', 'legacy_defiance'],
      ['legacy_souls', 'legacy_mastery'],
      ['legacy_sanity', 'legacy_mastery']
    ]
  }
};

export function openSanctum() {
  SANCTUM_SLIDE = 0;
  _currentMode = 'talents';
  _currentCategory = 'survival';
  _selectedKey = 'vitality';
  GameState.setState(GameStates.SANCTUM);
  AudioManager.playSFX('panel_open');
}

export function closeSanctum() {
  AudioManager.playSFX('panel_close');
  GameState.setState(GameStates.TITLE);
}

export const SanctumUI = {
  handleKeyDown(key) {
    if (key === 'Escape') {
      closeSanctum();
      return true;
    }
    // Navigate nodes with arrow keys
    const layout = _currentMode === 'legacy' ? CONSTELLATION_LAYOUTS.legacy : (CONSTELLATION_LAYOUTS[_currentCategory] || CONSTELLATION_LAYOUTS.survival);
    const nodes = layout.nodes;
    const curIdx = nodes.findIndex(n => n.id === _selectedKey);

    if (key === 'ArrowRight' || key === 'ArrowDown') {
      const nextIdx = (curIdx + 1 + nodes.length) % nodes.length;
      _selectedKey = nodes[nextIdx].id;
      AudioManager.playSFX('menu_hover');
      return true;
    }
    if (key === 'ArrowLeft' || key === 'ArrowUp') {
      const prevIdx = (curIdx - 1 + nodes.length) % nodes.length;
      _selectedKey = nodes[prevIdx].id;
      AudioManager.playSFX('menu_hover');
      return true;
    }
    if (key === 'Enter' || key === ' ') {
      // Trigger buy on current selected talent
      this.attemptPurchase();
      return true;
    }
    return false;
  },

  handleWheel(deltaY) {
    // Wheel cycles through disciplines
    if (_currentMode === 'talents') {
      const cats = ['survival', 'weapons', 'technique', 'utility'];
      let idx = cats.indexOf(_currentCategory);
      idx = (idx + (deltaY > 0 ? 1 : -1) + cats.length) % cats.length;
      _currentCategory = cats[idx];
      const newLayout = CONSTELLATION_LAYOUTS[_currentCategory];
      if (newLayout && newLayout.nodes.length > 0) {
        _selectedKey = newLayout.nodes[0].id;
      }
      AudioManager.playSFX('menu_select');
    }
  },

  attemptPurchase() {
    const isLegacy = _currentMode === 'legacy';
    const item = isLegacy ? LEGACY_DEFS[_selectedKey] : TALENT_DEFS[_selectedKey];
    if (!item) return;

    if (isLegacy) {
      if (ProgressionSystem.buyLegacy(item.id)) {
        AudioManager.playSFX('talent_unlock');
      } else {
        AudioManager.playSFX('ui_error');
      }
    } else {
      if (ProgressionSystem.buyTalent(item.id)) {
        AudioManager.playSFX('talent_unlock');
      } else {
        AudioManager.playSFX('ui_error');
      }
    }
  },

  draw(ctx, dt = 0.016) {
    SANCTUM_SLIDE = Math.min(1, SANCTUM_SLIDE + dt * 6.0);
    _ambientTimer += dt;
    _interactiveZones.length = 0;

    const eased = 1 - Math.pow(1 - SANCTUM_SLIDE, 3);
    const panW = Math.min(880, LW - 24);
    const panH = Math.min(520, LH - 24);
    const panX = Math.round((LW - panW) / 2);
    const panY = Math.round((LH - panH) / 2 - (1 - eased) * 35);

    ctx.save();
    ctx.globalAlpha = eased;

    // Dark backdrop blur
    ctx.fillStyle = 'rgba(2, 4, 10, 0.90)';
    ctx.fillRect(0, 0, LW, LH);

    // Occult Altar Radial Ambient Glow
    const pulse = 0.5 + 0.5 * Math.sin(_ambientTimer * 2.2);
    const grad = ctx.createRadialGradient(panX + panW / 2, panY + 160, 20, panX + panW / 2, panY + 220, 440);
    if (_currentMode === 'legacy') {
      grad.addColorStop(0, `rgba(217, 119, 6, ${0.20 + pulse * 0.06})`);
      grad.addColorStop(0.6, 'rgba(180, 83, 9, 0.08)');
    } else {
      grad.addColorStop(0, `rgba(147, 51, 234, ${0.20 + pulse * 0.06})`);
      grad.addColorStop(0.6, 'rgba(88, 28, 135, 0.08)');
    }
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(panX - 40, panY - 40, panW + 80, panH + 80);    // Outer Altar Vault Slab
    drawStonePanel(ctx, panX, panY, panW, panH, { cornerSize: 8, elevation: 3 });
    drawCornerBrackets(ctx, panX, panY, panW, panH, 14, _currentMode === 'legacy' ? '#d97706' : '#a855f7');

    const mouseX = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.mx : -999;
    const mouseY = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.my : -999;

    // ─────────────────────────────────────────────────────────────
    // 1. TOP ALTAR VAULT HEADER: RELIQUARIES & MODE PLINTHS
    // ─────────────────────────────────────────────────────────────
    const souls = GameState.ABYSS_SOULS || 0;
    const tokens = GameState.PRESTIGE_TOKENS || 0;

    // Currency Badges (Top Left)
    const badgeY = panY + 16;

    // Soul Crucible
    drawStoneBadge(ctx, `◈ SOULS: ${souls.toLocaleString()}`, panX + 18, badgeY, 132, 26, { variant: 'purple', pulse: false });

    // Prestige Sunburst Token
    drawStoneBadge(ctx, `♛ PRESTIGE: ${tokens}`, panX + 158, badgeY, 132, 26, { variant: 'gold', pulse: false });

    // Altar Central Inscription (Top Center)
    ctx.fillStyle = _currentMode === 'legacy' ? '#fef08a' : '#f3e8ff';
    ctx.font = 'bold 13px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = _currentMode === 'legacy' ? '#d97706' : '#a855f7';
    ctx.shadowBlur = 6;
    ctx.fillText('◈ ABYSSAL ASCENSION ALTAR ◈', panX + panW / 2 - 15, badgeY + 7);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = 'italic 8.5px "Crimson Text", serif';
    ctx.fillText('Channel consecrated soul essence into ancient Vanguard steles', panX + panW / 2 - 15, badgeY + 21);

    // Mode Switcher Plinths (Top Right)
    const modeTabs = [
      { id: 'talents', label: '◈ SOUL NODES', w: 135 },
      { id: 'legacy',  label: '♛ LEGACY REPERTOIRE', w: 145 }
    ];
    let modeX = panX + panW - 18 - (135 + 145 + 8);
    modeTabs.forEach(mt => {
      const isSel = _currentMode === mt.id;
      const isHover = mouseX >= modeX && mouseX <= modeX + mt.w && mouseY >= badgeY && mouseY <= badgeY + 26;

      drawStoneTab(ctx, mt.label, modeX, badgeY, mt.w, 26, {
        isHover,
        isSelected: isSel,
        fontSize: 9,
        cornerSize: 4
      });

      _interactiveZones.push({
        id: `mode_${mt.id}`,
        x: modeX, y: badgeY, w: mt.w, h: 26,
        action: () => {
          if (_currentMode !== mt.id) {
            _currentMode = mt.id;
            _selectedKey = mt.id === 'legacy' ? LEGACY_KEYS[0] : 'vitality';
            AudioManager.playSFX('menu_select');
          }
        }
      });
      modeX += mt.w + 8;
    });

    // ─────────────────────────────────────────────────────────────
    // 2. DISCIPLINE ORBITAL ARC (TABS)
    // ─────────────────────────────────────────────────────────────
    const arcY = badgeY + 36;
    const arcH = 28;

    if (_currentMode === 'talents') {
      const disciplines = [
        { id: 'survival',  label: 'ᛟ SURVIVAL CONSTELLATION',  w: 200 },
        { id: 'weapons',   label: '⚔ WEAPONRY CONSTELLATION', w: 200 },
        { id: 'technique', label: 'ᛋ TECHNIQUE CONSTELLATION',w: 205 },
        { id: 'utility',   label: '✦ UTILITY CONSTELLATION',  w: 200 }
      ];

      const startArcX = panX + Math.round((panW - (disciplines.reduce((acc, d) => acc + d.w, 0) + (disciplines.length - 1) * 8)) / 2);
      let curArcX = startArcX;

      disciplines.forEach(d => {
        const isSel = (_currentCategory === d.id);
        const isHover = mouseX >= curArcX && mouseX <= curArcX + d.w && mouseY >= arcY && mouseY <= arcY + arcH;

        drawStoneTab(ctx, d.label, curArcX, arcY, d.w, arcH, {
          isHover,
          isSelected: isSel,
          fontSize: 9.5,
          cornerSize: 4
        });

        _interactiveZones.push({
          id: `disc_${d.id}`,
          x: curArcX, y: arcY, w: d.w, h: arcH,
          action: () => {
            if (_currentCategory !== d.id) {
              _currentCategory = d.id;
              const layout = CONSTELLATION_LAYOUTS[d.id];
              if (layout && layout.nodes.length > 0) {
                _selectedKey = layout.nodes[0].id;
              }
              AudioManager.playSFX('menu_select');
            }
          }
        });

        curArcX += d.w + 8;
      });
    } else {
      // Legacy Mode Ribbon
      const legW = 380;
      const legX = panX + Math.round((panW - legW) / 2);
      drawStoneCard(ctx, legX, arcY, legW, arcH, {
        isHover: false,
        isSelected: true,
        cornerSize: 4,
        glowColor: 'rgba(245, 158, 11, 0.45)'
      });
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 10px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('♛ THE FOUR PILLARS OF ASCENDED CONQUEST', legX + legW / 2, arcY + arcH / 2);
    }

    // ─────────────────────────────────────────────────────────────
    // 3. MAIN CHAMBER: CELESTIAL CONSTELLATION MAP (LEFT) & INFUSION SLAB (RIGHT)
    // ─────────────────────────────────────────────────────────────
    const chamberY = arcY + arcH + 12;
    const chamberH = panY + panH - chamberY - 48;
    const mapW = 490;
    const slabW = panW - mapW - 48;
    const mapX = panX + 20;
    const slabX = mapX + mapW + 12;

    // ── Left: Celestial Constellation Starfield Chamber ──
    drawStonePanel(ctx, mapX, chamberY, mapW, chamberH, { cornerSize: 6, inset: true });
    drawCornerBrackets(ctx, mapX, chamberY, mapW, chamberH, 10, 'rgba(168, 85, 247, 0.4)');

    // Starfield Background motes
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, mapX + 3, chamberY + 3, mapW - 6, chamberH - 6, 5);
    ctx.clip();

    // Procedural Stars
    for (let s = 0; s < 36; s++) {
      const sx = mapX + ((s * 73 + 19) % (mapW - 20));
      const sy = chamberY + ((s * 47 + 31) % (chamberH - 20));
      const sAlpha = 0.2 + 0.3 * Math.sin(_ambientTimer * 2.0 + s);
      ctx.fillStyle = `rgba(226, 232, 240, ${sAlpha})`;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }

    const activeLayout = _currentMode === 'legacy' ? CONSTELLATION_LAYOUTS.legacy : (CONSTELLATION_LAYOUTS[_currentCategory] || CONSTELLATION_LAYOUTS.survival);

    // Draw Constellation Conduits (Lines between nodes)
    activeLayout.conduits.forEach(([fromId, toId]) => {
      const fromNode = activeLayout.nodes.find(n => n.id === fromId);
      const toNode = activeLayout.nodes.find(n => n.id === toId);
      if (!fromNode || !toNode) return;

      const fx = mapX + fromNode.x;
      const fy = chamberY + fromNode.y;
      const tx = mapX + toNode.x;
      const ty = chamberY + toNode.y;

      const isFromActive = (_currentMode === 'legacy') ? ProgressionSystem.getLegacyRank(fromId) > 0 : ProgressionSystem.getTalentRank(fromId) > 0;
      const isToActive = (_currentMode === 'legacy') ? ProgressionSystem.getLegacyRank(toId) > 0 : ProgressionSystem.getTalentRank(toId) > 0;
      const conduitActive = isFromActive && isToActive;

      ctx.strokeStyle = conduitActive
        ? (_currentMode === 'legacy' ? 'rgba(253, 230, 138, 0.7)' : 'rgba(192, 132, 252, 0.7)')
        : 'rgba(51, 65, 85, 0.45)';
      ctx.lineWidth = conduitActive ? 2.0 : 1.0;
      if (!conduitActive) ctx.setLineDash([4, 4]);

      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw Constellation Star-Nodes
    activeLayout.nodes.forEach(node => {
      const nx = mapX + node.x;
      const ny = chamberY + node.y;
      const isSel = (_selectedKey === node.id);

      const isLegacy = _currentMode === 'legacy';
      const item = isLegacy ? LEGACY_DEFS[node.id] : TALENT_DEFS[node.id];
      if (!item) return;

      const rank = isLegacy ? ProgressionSystem.getLegacyRank(item.id) : ProgressionSystem.getTalentRank(item.id);
      const isMax = rank >= item.max;
      const cost = isMax ? 0 : item.costs[rank];
      const canAfford = isLegacy ? (tokens >= cost) : (souls >= cost);

      const isHover = mouseX >= nx - 32 && mouseX <= nx + 32 && mouseY >= ny - 32 && mouseY <= ny + 32;

      // Radial Pulsing Halo for Selected or Affordable Nodes
      if (isSel || isHover) {
        ctx.fillStyle = isLegacy ? 'rgba(217, 119, 6, 0.25)' : 'rgba(168, 85, 247, 0.25)';
        ctx.beginPath();
        ctx.arc(nx, ny, 36, 0, Math.PI * 2);
        ctx.fill();
      }

      // Outer Node Orbit Ring
      const orbitR = 26;
      ctx.strokeStyle = isMax
        ? '#facc15'
        : (isSel ? '#ffffff' : (canAfford ? (isLegacy ? '#f59e0b' : '#c084fc') : 'rgba(71, 85, 105, 0.6)'));
      ctx.lineWidth = isSel ? 2.0 : 1.2;
      ctx.beginPath();
      ctx.arc(nx, ny, orbitR, 0, Math.PI * 2);
      ctx.stroke();

      // Node Core Fill
      ctx.fillStyle = isMax
        ? 'rgba(234, 179, 8, 0.35)'
        : (isSel ? (isLegacy ? 'rgba(180, 83, 9, 0.5)' : 'rgba(126, 34, 206, 0.5)') : 'rgba(15, 23, 42, 0.85)');
      ctx.beginPath();
      ctx.arc(nx, ny, orbitR - 2, 0, Math.PI * 2);
      ctx.fill();

      // Rank Orbit Pips around the node perimeter
      for (let p = 0; p < item.max; p++) {
        const angle = -Math.PI / 2 + (p / item.max) * Math.PI * 2;
        const px = nx + Math.cos(angle) * (orbitR + 6);
        const py = ny + Math.sin(angle) * (orbitR + 6);

        ctx.fillStyle = (p < rank)
          ? (isMax ? '#fde047' : (isLegacy ? '#fbbf24' : '#c084fc'))
          : 'rgba(51, 65, 85, 0.7)';
        ctx.beginPath();
        ctx.arc(px, py, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Icon / Glyph in Center
      ctx.fillStyle = isMax ? '#fef08a' : (isSel ? '#ffffff' : (canAfford ? '#e2e8f0' : '#64748b'));
      ctx.font = 'bold 15px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.icon, nx, ny);

      // Node Label Below
      ctx.fillStyle = isSel ? '#ffffff' : (isHover ? '#fef08a' : '#94a3b8');
      ctx.font = 'bold 9.5px Cinzel, serif';
      ctx.fillText(item.name, nx, ny + orbitR + 18);

      ctx.fillStyle = isMax ? '#facc15' : 'rgba(148, 163, 184, 0.8)';
      ctx.font = 'bold 8.5px monospace';
      ctx.fillText(`Rank ${rank}/${item.max}`, nx, ny + orbitR + 29);

      _interactiveZones.push({
        id: `node_${item.id}`,
        x: nx - 32, y: ny - 32, w: 64, h: 64 + 32,
        action: () => {
          if (_selectedKey !== item.id) {
            _selectedKey = item.id;
            AudioManager.playSFX('menu_hover');
          }
        }
      });
    });

    ctx.restore();

    // ── Right: Sacred Altar Infusion Slab (Detail Focus) ──
    const item = _currentMode === 'legacy' ? LEGACY_DEFS[_selectedKey] : TALENT_DEFS[_selectedKey];
    if (item) {
      const isLegacy = _currentMode === 'legacy';
      const rank = isLegacy ? ProgressionSystem.getLegacyRank(item.id) : ProgressionSystem.getTalentRank(item.id);
      const isMax = rank >= item.max;
      const cost = isMax ? 0 : item.costs[rank];
      const balance = isLegacy ? tokens : souls;
      const canAfford = balance >= cost;

      drawStonePanel(ctx, slabX, chamberY, slabW, chamberH, { cornerSize: 6, elevation: 2 });
      drawCornerBrackets(ctx, slabX, chamberY, slabW, chamberH, 10, isLegacy ? 'rgba(245, 158, 11, 0.5)' : 'rgba(168, 85, 247, 0.5)');

      // Top Slab Banner
      drawStoneCard(ctx, slabX + 6, chamberY + 6, slabW - 12, 30, {
        cornerSize: 4,
        isSelected: true,
        glowColor: isLegacy ? 'rgba(245, 158, 11, 0.35)' : 'rgba(168, 85, 247, 0.35)'
      });

      ctx.fillStyle = isLegacy ? '#fde047' : '#c084fc';
      ctx.font = 'bold 10px Cinzel, serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(isLegacy ? '♛ PRESTIGE ASCENSION STELE' : `◈ ${(_currentCategory || 'SURVIVAL').toUpperCase()} STELE`, slabX + 16, chamberY + 21);

      // Talent Name & Icon Box
      const iconY = chamberY + 48;
      drawStoneCard(ctx, slabX + 16, iconY, 44, 44, {
        cornerSize: 4,
        isSelected: isMax,
        glowColor: isMax ? '#facc15' : '#c084fc'
      });

      ctx.font = '22px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.icon, slabX + 38, iconY + 22);

      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = isMax ? '#fef08a' : '#ffffff';
      ctx.font = 'bold 13px Cinzel, serif';
      ctx.fillText(item.name, slabX + 68, iconY + 6);

      ctx.fillStyle = isMax ? '#facc15' : 'rgba(203, 213, 225, 0.8)';
      ctx.font = 'bold 9.5px monospace';
      ctx.fillText(`Rank ${rank} of ${item.max} · ${isMax ? 'Fully Ascended' : (isLegacy ? `${cost} ♛ Tokens` : `${cost} ◈ Souls`)}`, slabX + 68, iconY + 26);

      // Rank Progress Cell Bar
      const cellY = iconY + 52;
      const cellW = Math.round((slabW - 32 - (item.max - 1) * 6) / item.max);
      for (let c = 0; c < item.max; c++) {
        const cx = slabX + 16 + c * (cellW + 6);
        ctx.fillStyle = (c < rank)
          ? (isMax ? '#facc15' : (isLegacy ? '#f59e0b' : '#c084fc'))
          : 'rgba(30, 41, 59, 0.6)';
        ctx.strokeStyle = (c < rank) ? '#ffffff' : 'rgba(71, 85, 105, 0.4)';
        ctx.lineWidth = 1;
        roundRect(ctx, cx, cellY, cellW, 8, 2);
        ctx.fill(); ctx.stroke();
      }

      // Power Delta & Consequences (with multi-line wrapping)
      const deltaY = cellY + 16;
      const deltaH = 76;
      drawStoneCard(ctx, slabX + 16, deltaY, slabW - 32, deltaH, { cornerSize: 4, inset: true });

      const preview = isLegacy
        ? { current: `Rank ${rank}: ${item.desc}`, next: isMax ? 'Maximum Power Reached' : `Rank ${rank + 1}: ${item.desc}` }
        : ProgressionSystem.getStatPreview(item.id, rank);

      const maxTextW = slabW - 52;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 8.5px Cinzel, serif';
      ctx.fillText('CURRENT BLESSING:', slabX + 26, deltaY + 8);

      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 9px Cinzel, serif';
      const curLines = this.wrapText(ctx, preview.current, maxTextW);
      curLines.slice(0, 2).forEach((cl, cIdx) => {
        ctx.fillText(cl, slabX + 26, deltaY + 20 + cIdx * 12);
      });

      const nextHeaderY = deltaY + 20 + Math.min(2, curLines.length) * 12 + 4;
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 8.5px Cinzel, serif';
      ctx.fillText(isMax ? 'ASCENSION STATUS:' : 'NEXT RANK ASCENSION:', slabX + 26, nextHeaderY);

      ctx.fillStyle = isMax ? '#facc15' : (isLegacy ? '#fef08a' : '#a78bfa');
      ctx.font = 'bold 9px Cinzel, serif';
      const nextStr = isMax ? '★ Maximum Vanguard Potential Reached' : `${preview.next}`;
      const nextLines = this.wrapText(ctx, nextStr, maxTextW);
      nextLines.slice(0, 2).forEach((nl, nIdx) => {
        ctx.fillText(nl, slabX + 26, nextHeaderY + 12 + nIdx * 12);
      });

      // Lore Inscription
      const loreY = deltaY + deltaH + 10;
      ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
      ctx.font = 'italic 10.5px "Crimson Text", serif';
      const loreDesc = item.detail || item.desc;
      const lines = this.wrapText(ctx, loreDesc, slabW - 36);
      lines.slice(0, 3).forEach((l, idx) => {
        ctx.fillText(l, slabX + 18, loreY + idx * 14.5);
      });

      // Empower / Upgrade Action Button
      const btnW = slabW - 32;
      const btnH = 44;
      const btnX = slabX + 16;
      const btnY = chamberY + chamberH - btnH - 14;
      const isBtnHover = mouseX >= btnX && mouseX <= btnX + btnW && mouseY >= btnY && mouseY <= btnY + btnH;
      const isBtnPressed = isBtnHover && (InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.isDown : false);

      if (isMax) {
        drawStoneButton(ctx, '★ ASCENDED TO MAXIMUM RANK', btnX, btnY, btnW, btnH, {
          isHover: false,
          isPressed: false,
          isSelected: true,
          variant: 'primary',
          fontSize: 11,
          cornerSize: 4
        });
      } else if (canAfford) {
        const actLabel = isLegacy ? `UPGRADE LEGACY · ${cost} ♛` : `EMPOWER TALENT · ${cost} ◈`;
        drawStoneButton(ctx, actLabel, btnX, btnY, btnW, btnH, {
          isHover: isBtnHover,
          isPressed: isBtnPressed,
          isSelected: false,
          variant: 'primary',
          sublabel: 'CLICK TO CONSECRATE UPGRADE',
          fontSize: 11,
          cornerSize: 4
        });

        _interactiveZones.push({
          id: `buy_${item.id}`,
          x: btnX, y: btnY, w: btnW, h: btnH,
          action: () => this.attemptPurchase()
        });
      } else {
        const currIcon = isLegacy ? '♛' : '◈';
        drawStoneButton(ctx, `INSUFFICIENT ESSENCE · ${cost} ${currIcon}`, btnX, btnY, btnW, btnH, {
          isHover: false,
          isPressed: false,
          isSelected: false,
          variant: 'danger',
          sublabel: `(Deficit: ${cost - balance} ${currIcon})`,
          fontSize: 10,
          cornerSize: 4
        });
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 4. BOTTOM BAR: RETURN BUTTON & KEYBOARD HINTS
    // ─────────────────────────────────────────────────────────────
    const botY = panY + panH - 36;
    const retW = 200, retH = 26;
    const retX = panX + panW - 20 - retW;
    const isHoverRet = mouseX >= retX && mouseX <= retX + retW && mouseY >= botY && mouseY <= botY + retH;
    const isPressedRet = isHoverRet && (InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.isDown : false);

    drawStoneButton(ctx, '◈ RETURN TO TITLE ( Esc )', retX, botY, retW, retH, {
      isHover: isHoverRet,
      isPressed: isPressedRet,
      isSelected: false,
      variant: 'normal',
      fontSize: 9.5,
      cornerSize: 4
    });

    ctx.fillStyle = 'rgba(148, 163, 184, 0.65)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Arrows — Select Star Node    Space/Enter — Consecrate Upgrade    Esc — Return', panX + 24, botY + 13);

    _interactiveZones.push({
      id: 'return_btn',
      x: retX, y: botY, w: retW, h: retH,
      action: closeSanctum
    });

    ctx.restore();
  },

  wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    words.forEach(w => {
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > maxWidth) {
        if (cur) lines.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    });
    if (cur) lines.push(cur);
    return lines;
  },

  handleClick(mx, my) {
    for (const z of _interactiveZones) {
      if (mx >= z.x && mx <= z.x + z.w && my >= z.y && my <= z.y + z.h) {
        if (z.action) {
          z.action();
          return true;
        }
      }
    }

    // Click outside panel returns to Title
    const panW = Math.min(880, LW - 24), panH = Math.min(520, LH - 24);
    const panX = (LW - panW) / 2, panY = (LH - panH) / 2;
    if (mx < panX || mx > panX + panW || my < panY || my > panY + panH) {
      closeSanctum();
      return true;
    }

    return false;
  }
};

export function drawSanctumPanel(ctx, dt) {
  SanctumUI.draw(ctx, dt);
}

SanctumUI._interactiveZones = _interactiveZones;

if (typeof window !== 'undefined') {
  window.SanctumUI = SanctumUI;
  window.openSanctum = openSanctum;
  window.closeSanctum = closeSanctum;
  window.addEventListener('wheel', (e) => {
    if (GameState.STATE === GameStates.SANCTUM) {
      SanctumUI.handleWheel(e.deltaY);
    }
  }, { passive: true });
}
