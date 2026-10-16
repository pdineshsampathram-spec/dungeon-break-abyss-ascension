// =====================================================================
//  DUNGEON BREAK — js/ui/AchievementsUI.js
//  UI/UX Reconstruction: Monumental Wall of Deeds & Carved Monolith of Fates
//  - Apex Shrine: Eye of the Absolute with 8-Fate Milestone Ring
//  - Center: Mosaic of Heraldic Relic Medallions (Live Animated Pixel-Art)
//  - Bottom: Inscribed Monolith Deed Plaque (Sliding Progress & Lore Stele)
//  100% In-Game Canvas 2D Renderers, Zero Emojis, Zero Placeholders
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, roundRect } from '../core/Constants.js';
import { ACHIEVEMENTS, ACHIEVEMENT_KEYS } from '../data/achievements.js';
import { SoundManager } from '../audio/AudioManager.js';
import { InputManager } from '../core/InputManager.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { drawAchievementIcon } from '../rendering/AchievementIconRenderer.js';

// ─────────────────────────────────────────────────────────────────────
// ORDERED PROGRESSION & METADATA BIBLE
// ─────────────────────────────────────────────────────────────────────

export const ORDERED_ACHIEVEMENT_KEYS = [
  // 1. Early Journey & Survival
  'first_blood',
  'overwhelmed',
  'consumed',
  'sanity_keeper',
  'mind_break',
  // 2. Combat Mastery
  'shield_bearer',
  'sharpshooter',
  'untouchable',
  'speed_runner',
  // 3. Dungeon Trials & Bosses
  'jailbreaker',
  'void_conqueror',
  'executed',
  'boss_slayer',
  // 4. Discovery & Metaprogression
  'savior',
  'lore_master',
  'soul_ascendant',
  'maxed_talent',
  // 5. The Three Fates
  'true_hero',
  'betrayed',
  'rampage',
  // 6. The Ultimate Milestone
  'last_witness'
];

export const ACHIEVEMENT_CATEGORIES = [
  { id: 'all',         label: 'ALL DEEDS',   icon: '◈' },
  { id: 'survival',    label: 'SURVIVAL',    icon: 'ᛟ' },
  { id: 'combat',      label: 'COMBAT',      icon: '⚔' },
  { id: 'discovery',   label: 'DISCOVERY',   icon: '✦' },
  { id: 'progression', label: 'ASCENSION',   icon: 'ᛏ' },
  { id: 'endings',     label: 'THE FATES',   icon: '♛' },
  { id: 'mastery',     label: 'ABSOLUTE',    icon: '👁' }
];

export const ACHIEVEMENT_METADATA = {
  first_blood: {
    category: 'combat',
    categoryLabel: 'COMBAT TRIAL',
    instruction: 'Slay your first hostile creature in the dark corridors of the dungeon.'
  },
  overwhelmed: {
    category: 'survival',
    categoryLabel: 'SURVIVAL LESSON',
    instruction: 'Fall in battle against standard dungeon horrors (not a boss).'
  },
  consumed: {
    category: 'survival',
    categoryLabel: 'SURVIVAL LESSON',
    instruction: 'Succumb to lethal physical damage within the depths of the dungeon.'
  },
  sanity_keeper: {
    category: 'survival',
    categoryLabel: 'SURVIVAL DISCIPLINE',
    instruction: 'Descend to Floor 5 while keeping Rowan\'s sanity above 70%.'
  },
  mind_break: {
    category: 'survival',
    categoryLabel: 'SURVIVAL TRIAL',
    instruction: 'Let Rowan\'s sanity collapse to zero and endure the complete Shattered Mind sequence.'
  },
  shield_bearer: {
    category: 'combat',
    categoryLabel: 'COMBAT DISCIPLINE',
    instruction: 'Trigger your weapon\'s defensive shield ability in the heat of battle.'
  },
  sharpshooter: {
    category: 'combat',
    categoryLabel: 'COMBAT MASTERY',
    instruction: 'Eliminate 10 hostile creatures using the Longbow or Crossbow.',
    hasProgress: true,
    progressLabel: 'ENEMIES SNIPED',
    progressMax: 10,
    getProgress: () => GameState.BOW_KILLS || 0
  },
  untouchable: {
    category: 'combat',
    categoryLabel: 'COMBAT MASTERY',
    instruction: 'Traverse an entire dungeon floor from entrance to portal without taking any damage.'
  },
  speed_runner: {
    category: 'combat',
    categoryLabel: 'COMBAT TRIAL',
    instruction: 'Clear an entire dungeon floor and enter the exit portal in under 90 seconds.'
  },
  jailbreaker: {
    category: 'combat',
    categoryLabel: 'DUNGEON TRIAL',
    instruction: 'Defeat Gorgaroth, Breaker of Chains, in the Iron Colosseum on Floor 3.'
  },
  void_conqueror: {
    category: 'combat',
    categoryLabel: 'DUNGEON TRIAL',
    instruction: 'Vanquish Malakor, The Void Reaver, in the abyssal rift on Floor 6.'
  },
  executed: {
    category: 'survival',
    categoryLabel: 'SURVIVAL TRIAL',
    instruction: 'Fall in combat against The Abyss Warden during his throne confrontation on Floor 10.'
  },
  boss_slayer: {
    category: 'combat',
    categoryLabel: 'DUNGEON CONQUEST',
    instruction: 'Conquer The Abyss Warden on Floor 10 and unlock the Abyssal Gateway.'
  },
  savior: {
    category: 'discovery',
    categoryLabel: 'DISCOVERY TRIAL',
    instruction: 'Locate and liberate 5 trapped survivor prisoners across the dungeon corridors.',
    hasProgress: true,
    progressLabel: 'SURVIVORS LIBERATED',
    progressMax: 5,
    getProgress: () => GameState.SAVED_SURVIVORS || 0
  },
  lore_master: {
    category: 'discovery',
    categoryLabel: 'DISCOVERY ARCHIVE',
    instruction: 'Uncover all 10 ancient lore scrolls hidden throughout the subterranean halls.',
    hasProgress: true,
    progressLabel: 'ANCIENT SCROLLS UNCOVERED',
    progressMax: 10,
    getProgress: () => Object.keys(GameState.UNLOCKED_LORE || {}).length
  },
  soul_ascendant: {
    category: 'progression',
    categoryLabel: 'METAPROGRESSION',
    instruction: 'Accumulate 100 total Abyss Souls from slain dungeon horrors and boss encounters.',
    hasProgress: true,
    progressLabel: 'ABYSS SOULS HARVESTED',
    progressMax: 100,
    getProgress: () => GameState.ABYSS_SOULS || 0
  },
  maxed_talent: {
    category: 'progression',
    categoryLabel: 'METAPROGRESSION',
    instruction: 'Ascend any Soul Discipline in the Abyss Sanctum to its maximum talent rank.'
  },
  true_hero: {
    category: 'endings',
    categoryLabel: 'THE THREE FATES',
    instruction: 'Step through the Abyssal Gateway as the Savior of the Depth (Hero Ending).'
  },
  betrayed: {
    category: 'endings',
    categoryLabel: 'THE THREE FATES',
    instruction: 'Step through the Abyssal Gateway after slaying the survivors (Betrayal Ending).'
  },
  rampage: {
    category: 'endings',
    categoryLabel: 'THE THREE FATES',
    instruction: 'Step through the Abyssal Gateway in absolute madness, destroying all in your wake (Rampage Ending).'
  },
  last_witness: {
    category: 'mastery',
    categoryLabel: 'ABYSSAL MASTERY',
    instruction: 'Witness all five required death outcomes and complete the Hero, Betrayal, and Rampage endings.',
    isLastWitness: true
  }
};

// 8 Fates required for Last Witness milestone
const EIGHT_FATES = [
  { key: 'consumed',       label: 'Consumed',   type: 'death' },
  { key: 'overwhelmed',    label: 'Overwhelm',  type: 'death' },
  { key: 'mind_break',     label: 'Insanity',   type: 'death' },
  { key: 'executed',       label: 'Executed',   type: 'death' },
  { key: 'void_conqueror', label: 'Vanquished', type: 'death' },
  { key: 'true_hero',      label: 'Hero',       type: 'ending' },
  { key: 'betrayed',       label: 'Betrayal',   type: 'ending' },
  { key: 'rampage',        label: 'Rampage',    type: 'ending' }
];

let _slideAnim = 0;
let _ambientTimer = 0;
let _displayProgress = 0;
let _activeCategory = 'all';
let _selectedKey = 'first_blood';
let _returnState = GameStates.TITLE;

const _zones = [];

export function openAchievements(fromState = null) {
  _slideAnim = 0;
  _ambientTimer = 0;
  const totalCount = ORDERED_ACHIEVEMENT_KEYS.length;
  const unlockedCount = ORDERED_ACHIEVEMENT_KEYS.filter(k => ACHIEVEMENTS[k] && ACHIEVEMENTS[k].unlocked).length;
  _displayProgress = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;
  _activeCategory = 'all';
  _selectedKey = 'first_blood';
  _returnState = (fromState === GameStates.PAUSED || GameState.STATE === GameStates.PAUSED)
    ? GameStates.PAUSED
    : GameStates.TITLE;
  GameState.setState(GameStates.ACHIEVEMENTS);
  SoundManager.snd('panel_open');
}

export function closeAchievements() {
  SoundManager.snd('panel_close');
  const target = (GameState.PREV_STATE === GameStates.PAUSED || _returnState === GameStates.PAUSED)
    ? GameStates.PAUSED
    : GameStates.TITLE;
  GameState.setState(target);
}

export const AchievementsUI = {
  _zones,

  getCategory() {
    return _activeCategory;
  },

  setCategory(catId) {
    if (_activeCategory !== catId) {
      _activeCategory = catId;
      const filtered = this.getFilteredKeys();
      if (!filtered.includes(_selectedKey) && filtered.length > 0) {
        _selectedKey = filtered[0];
      }
      SoundManager.snd('menu_select');
    }
  },

  getSelectedKey() {
    return _selectedKey;
  },

  selectKey(key) {
    if (_selectedKey !== key && ACHIEVEMENTS[key]) {
      _selectedKey = key;
      SoundManager.snd('menu_hover');
    }
  },

  getFilteredKeys() {
    return ORDERED_ACHIEVEMENT_KEYS.filter(k => {
      if (_activeCategory === 'all') return true;
      const meta = ACHIEVEMENT_METADATA[k];
      return meta && meta.category === _activeCategory;
    });
  },

  draw(ctx, dt = 0.016) {
    _slideAnim = Math.min(1, _slideAnim + dt * 6.0);
    _ambientTimer += dt;
    const eased = 1 - Math.pow(1 - _slideAnim, 3);

    const isReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    ctx.save();
    ctx.globalAlpha = eased;

    // Dark backdrop blur
    ctx.fillStyle = 'rgba(2, 4, 10, 0.90)';
    ctx.fillRect(0, 0, LW, LH);

    const panW = 890;
    const panH = 520;
    const panX = Math.round((LW - panW) / 2);
    const panY = Math.round((LH - panH) / 2 - (1 - eased) * 35);

    // Monolith Stone Texture & Crimson/Gold Ambient Backglow
    const pulse = 0.5 + 0.5 * Math.sin(_ambientTimer * 2.2);
    const grad = ctx.createRadialGradient(panX + panW / 2, panY + 70, 20, panX + panW / 2, panY + 120, 440);
    grad.addColorStop(0, `rgba(220, 38, 38, ${0.16 + pulse * 0.05})`);
    grad.addColorStop(0.5, 'rgba(217, 119, 6, 0.08)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(panX - 40, panY - 40, panW + 80, panH + 80);

    // Master Outer Enclosure
    ctx.fillStyle = 'rgba(6, 9, 20, 0.98)';
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.65)';
    ctx.lineWidth = 1.6;
    roundRect(ctx, panX, panY, panW, panH, 12);
    ctx.fill(); ctx.stroke();

    // Inner gold-embossed trim
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.35)';
    ctx.lineWidth = 1;
    roundRect(ctx, panX + 5, panY + 5, panW - 10, panH - 10, 9);
    ctx.stroke();

    _zones.length = 0;
    const mouseX = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.mx : -999;
    const mouseY = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.my : -999;

    // Unlocked Counts
    const totalCount = ORDERED_ACHIEVEMENT_KEYS.length;
    const unlockedCount = ORDERED_ACHIEVEMENT_KEYS.filter(k => ACHIEVEMENTS[k] && ACHIEVEMENTS[k].unlocked).length;
    const targetPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;
    _displayProgress = targetPct;

    // ─────────────────────────────────────────────────────────────
    // 1. APEX SHRINE: EYE OF THE ABSOLUTE & THE EIGHT FATES MONOLITH
    // ─────────────────────────────────────────────────────────────
    const apexY = panY + 14;
    const apexH = 92;

    // Left Wing: Citadel Conquest Gauge
    const leftWingW = 220;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.4)';
    ctx.lineWidth = 1;
    roundRect(ctx, panX + 18, apexY, leftWingW, apexH, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('◈ CONQUEST PROGRESS', panX + 28, apexY + 12);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 16px Cinzel, serif';
    ctx.fillText(`${unlockedCount} / ${totalCount}`, panX + 28, apexY + 28);

    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.font = '8.5px monospace';
    ctx.fillText(`${Math.round(_displayProgress)}% COMPLETE`, panX + 105, apexY + 34);

    // Mini Segmented Progress Track
    const trackW = leftWingW - 20;
    const trackH = 6;
    const trackX = panX + 28;
    const trackY = apexY + 54;
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.5)';
    roundRect(ctx, trackX, trackY, trackW, trackH, 3);
    ctx.fill(); ctx.stroke();

    const fillW = Math.max(4, Math.min(trackW, trackW * (_displayProgress / 100)));
    const trackGrad = ctx.createLinearGradient(trackX, 0, trackX + trackW, 0);
    trackGrad.addColorStop(0, '#d97706');
    trackGrad.addColorStop(1, '#fde68a');
    ctx.fillStyle = trackGrad;
    roundRect(ctx, trackX, trackY, fillW, trackH, 3);
    ctx.fill();

    ctx.fillStyle = 'rgba(148, 163, 184, 0.65)';
    ctx.font = 'italic 8px Crimson Text, serif';
    ctx.fillText('Records of deeds etched in eternal stone', panX + 28, apexY + 68);

    // Center: The Apex Altar of the Eye of the Absolute (Last Witness)
    const centerW = 380;
    const centerX = panX + Math.round((panW - centerW) / 2);
    ctx.fillStyle = 'rgba(12, 16, 32, 0.85)';
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.55)';
    ctx.lineWidth = 1.3;
    roundRect(ctx, centerX, apexY, centerW, apexH, 6);
    ctx.fill(); ctx.stroke();

    // Central Title
    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = '#dc2626';
    ctx.shadowBlur = 6;
    ctx.fillText('◈ MONUMENTAL WALL OF DEEDS · SANCTUM OF FATES ◈', centerX + centerW / 2, apexY + 10);
    ctx.shadowBlur = 0;

    // Central Eye of the Absolute (Icon 44x44)
    const eyeCx = centerX + centerW / 2;
    const eyeCy = apexY + 52;
    const eyeSize = 44;
    const isWitnessUnlocked = ACHIEVEMENTS.last_witness && ACHIEVEMENTS.last_witness.unlocked;

    drawAchievementIcon(ctx, 'last_witness', eyeCx, eyeCy, eyeSize, isWitnessUnlocked, true, _ambientTimer, isReducedMotion);

    // Click zone for Apex Eye (selects last_witness deed)
    _zones.push({
      id: 'apex_eye',
      x: eyeCx - eyeSize / 2 - 4, y: eyeCy - eyeSize / 2 - 4, w: eyeSize + 8, h: eyeSize + 8,
      action: () => this.selectKey('last_witness')
    });

    // 8 Surrounding Fate Seal Pips (4 on left, 4 on right of Eye)
    const fateOrbR = 7;
    EIGHT_FATES.forEach((f, fIdx) => {
      const isLeft = fIdx < 4;
      const slot = isLeft ? fIdx : (fIdx - 4);
      const fx = isLeft ? (eyeCx - 36 - (3 - slot) * 26) : (eyeCx + 36 + slot * 26);
      const fy = eyeCy;

      const fateUnlocked = ACHIEVEMENTS[f.key] && ACHIEVEMENTS[f.key].unlocked;
      const isSelFate = _selectedKey === f.key;

      ctx.beginPath();
      ctx.arc(fx, fy, fateOrbR, 0, Math.PI * 2);
      ctx.fillStyle = fateUnlocked
        ? (f.type === 'ending' ? '#c084fc' : '#f59e0b')
        : '#1e293b';
      ctx.fill();
      ctx.strokeStyle = isSelFate ? '#ffffff' : (fateUnlocked ? '#fde68a' : 'rgba(71, 85, 105, 0.4)');
      ctx.lineWidth = isSelFate ? 1.6 : 1;
      ctx.stroke();

      // Roman numeral label on pip
      const romanFates = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
      ctx.fillStyle = fateUnlocked ? '#ffffff' : '#94a3b8';
      ctx.font = 'bold 7.5px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(romanFates[fIdx], fx, fy);

      _zones.push({
        id: `fate_pip_${f.key}`,
        x: fx - fateOrbR - 4, y: fy - fateOrbR - 4, w: (fateOrbR + 4) * 2, h: (fateOrbR + 4) * 2,
        action: () => this.selectKey(f.key)
      });
    });

    // Small sub-labels below left and right fate arcs
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = 'bold 7.5px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('5 DEATH CRUCIBLES ( I - V )', eyeCx - 76, eyeCy + 14);
    ctx.fillText('3 CONQUEST ENDINGS ( VI - VIII )', eyeCx + 76, eyeCy + 14);

    // Right Wing: Category Filter Tabs
    const rightWingW = panW - (centerX + centerW - panX) - 36;
    const rightWingX = panX + panW - 18 - rightWingW;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.4)';
    ctx.lineWidth = 1;
    roundRect(ctx, rightWingX, apexY, rightWingW, apexH, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('ᛟ FILTER REALM DEEDS', rightWingX + 10, apexY + 10);

    // 2-row category pills
    const cats = ACHIEVEMENT_CATEGORIES;
    const catPillW = Math.floor((rightWingW - 24) / 2);
    const catPillH = 18;

    cats.slice(0, 6).forEach((c, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const cx = rightWingX + 8 + col * (catPillW + 6);
      const cy = apexY + 28 + row * (catPillH + 4);

      const isSel = _activeCategory === c.id;
      const isHover = mouseX >= cx && mouseX <= cx + catPillW && mouseY >= cy && mouseY <= cy + catPillH;

      ctx.fillStyle = isSel ? 'rgba(201, 168, 76, 0.35)' : (isHover ? 'rgba(51, 65, 85, 0.8)' : 'rgba(30, 41, 59, 0.5)');
      ctx.strokeStyle = isSel ? '#fde68a' : 'rgba(71, 85, 105, 0.4)';
      ctx.lineWidth = isSel ? 1.2 : 0.8;
      roundRect(ctx, cx, cy, catPillW, catPillH, 3);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = isSel ? '#ffffff' : (isHover ? '#f1f5f9' : '#94a3b8');
      ctx.font = 'bold 7.5px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.label, cx + catPillW / 2, cy + catPillH / 2);

      _zones.push({
        id: `cat_pill_${c.id}`,
        x: cx, y: cy, w: catPillW, h: catPillH,
        action: () => this.setCategory(c.id)
      });
    });

    // ─────────────────────────────────────────────────────────────
    // 2. CENTER: MOSAIC OF HERALDIC RELIC MEDALLIONS (7 COLS × 3 ROWS)
    // ─────────────────────────────────────────────────────────────
    const mosaicY = apexY + apexH + 10;
    const mosaicH = 224;
    const mosaicW = panW - 36;
    const mosaicX = panX + 18;

    ctx.fillStyle = 'rgba(8, 12, 24, 0.85)';
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.45)';
    ctx.lineWidth = 1;
    roundRect(ctx, mosaicX, mosaicY, mosaicW, mosaicH, 8);
    ctx.fill(); ctx.stroke();

    const filteredKeys = this.getFilteredKeys();
    const cols = 7;
    const rows = 3;
    const medGapX = 8;
    const medGapY = 6;
    const medW = Math.floor((mosaicW - 20 - (cols - 1) * medGapX) / cols);
    const medH = Math.floor((mosaicH - 16 - (rows - 1) * medGapY) / rows);

    ORDERED_ACHIEVEMENT_KEYS.forEach((k, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const mx = mosaicX + 10 + col * (medW + medGapX);
      const my = mosaicY + 8 + row * (medH + medGapY);

      const a = ACHIEVEMENTS[k] || {};
      const isUnlocked = !!a.unlocked;
      const isSel = k === _selectedKey;
      const isFilteredMatch = filteredKeys.includes(k);
      const isHover = mouseX >= mx && mouseX <= mx + medW && mouseY >= my && mouseY <= my + medH;

      ctx.save();
      if (!isFilteredMatch) {
        ctx.globalAlpha = 0.35;
      }

      // Medallion Cartouche Stone Frame
      ctx.fillStyle = isSel
        ? 'rgba(201, 168, 76, 0.28)'
        : (isHover ? 'rgba(30, 41, 59, 0.8)' : 'rgba(15, 20, 36, 0.65)');
      ctx.strokeStyle = isSel
        ? '#fde68a'
        : (isUnlocked ? 'rgba(201, 168, 76, 0.5)' : 'rgba(51, 65, 85, 0.35)');
      ctx.lineWidth = isSel ? 1.5 : 1;
      roundRect(ctx, mx, my, medW, medH, 5);
      ctx.fill(); ctx.stroke();

      // Living Icon Renderer on Left (26 × 26 px)
      const iconCx = mx + 18;
      const iconCy = my + medH / 2;
      const iconSize = 26;

      drawAchievementIcon(ctx, k, iconCx, iconCy, iconSize, isUnlocked, isHover, _ambientTimer, isReducedMotion);

      // Deed Title & Status (Available Width & Smart 2-Line Wrap)
      const textX = mx + 34;
      const maxTW = medW - 38;

      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = isUnlocked ? (isSel ? '#ffffff' : '#fde68a') : '#64748b';
      ctx.font = isSel ? 'bold 7.5px Cinzel, serif' : '7px Cinzel, serif';

      const fullName = (a.name || k).toUpperCase();
      if (ctx.measureText(fullName).width <= maxTW) {
        // Fits cleanly on a single line
        ctx.fillText(fullName, textX, my + 13);
        ctx.fillStyle = isUnlocked ? '#86efac' : '#475569';
        ctx.font = 'bold 7px monospace';
        ctx.fillText(isUnlocked ? '✔ CONQUERED' : '◇ SEALED', textX, my + 29);
      } else {
        // Wrap cleanly across 2 lines without truncation
        const words = fullName.split(' ');
        let line1 = '';
        let line2 = '';
        for (let wIdx = 0; wIdx < words.length; wIdx++) {
          const test1 = line1 ? line1 + ' ' + words[wIdx] : words[wIdx];
          if (ctx.measureText(test1).width <= maxTW) {
            line1 = test1;
          } else {
            line2 = words.slice(wIdx).join(' ');
            break;
          }
        }
        if (!line1) {
          line1 = words[0];
          line2 = words.slice(1).join(' ');
        }
        ctx.fillText(line1, textX, my + 8);
        ctx.fillText(line2, textX, my + 19);

        // Status pip below 2-line title
        ctx.fillStyle = isUnlocked ? '#86efac' : '#475569';
        ctx.font = 'bold 7px monospace';
        ctx.fillText(isUnlocked ? '✔ CONQUERED' : '◇ SEALED', textX, my + 32);
      }

      // Roman Numeral Tag (Top Right)
      ctx.fillStyle = isUnlocked ? 'rgba(201, 168, 76, 0.8)' : 'rgba(71, 85, 105, 0.5)';
      ctx.font = 'bold 7.5px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${idx + 1}`, mx + medW - 6, my + 5);

      ctx.restore();

      _zones.push({
        id: `medallion_${k}`,
        x: mx, y: my, w: medW, h: medH,
        action: () => this.selectKey(k)
      });
    });

    // ─────────────────────────────────────────────────────────────
    // 3. BOTTOM: INSCRIBED MONOLITH DEED PLAQUE (SLIDING DETAIL STELE)
    // ─────────────────────────────────────────────────────────────
    const steleY = mosaicY + mosaicH + 10;
    const steleH = 100;
    const steleW = panW - 36;
    const steleX = panX + 18;

    ctx.fillStyle = 'rgba(12, 16, 32, 0.95)';
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.6)';
    ctx.lineWidth = 1.3;
    roundRect(ctx, steleX, steleY, steleW, steleH, 8);
    ctx.fill(); ctx.stroke();

    const selKey = _selectedKey;
    const selectedAch = ACHIEVEMENTS[selKey] || {};
    const meta = ACHIEVEMENT_METADATA[selKey] || {};
    const isUnlocked = !!selectedAch.unlocked;

    // Left: Hero Living Pixel-Art Icon (60 × 60 px)
    const heroSize = 58;
    const heroCx = steleX + 38;
    const heroCy = steleY + steleH / 2;

    drawAchievementIcon(ctx, selKey, heroCx, heroCy, heroSize, isUnlocked, true, _ambientTimer, isReducedMotion);

    // Center: Deed Inscription & Narrative Lore
    const textStartX = steleX + 78;
    const textAvailW = steleW - 340;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Category Tag
    ctx.fillStyle = isUnlocked ? '#fde047' : '#94a3b8';
    ctx.font = 'bold 8.5px Cinzel, serif';
    ctx.fillText((meta.categoryLabel || 'CITADEL DEED').toUpperCase(), textStartX, steleY + 12);

    // Deed Title
    ctx.fillStyle = isUnlocked ? '#ffffff' : '#fca5a5';
    ctx.font = 'bold 15px Cinzel, serif';
    ctx.shadowColor = isUnlocked ? 'rgba(245, 158, 11, 0.4)' : 'rgba(220, 38, 38, 0.4)';
    ctx.shadowBlur = 6;
    ctx.fillText(selectedAch.name || selKey, textStartX, steleY + 26);
    ctx.shadowBlur = 0;

    // Full Instruction & Requirement
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'italic 11px Crimson Text, serif';
    const descLines = this.wrapText(ctx, meta.instruction || selectedAch.desc || '', textAvailW);
    descLines.slice(0, 3).forEach((dl, idx) => {
      ctx.fillText(dl, textStartX, steleY + 48 + idx * 15);
    });

    // Right: Consecration Status Plinth & Progress
    const rightPlinthW = 220;
    const rightPlinthX = steleX + steleW - rightPlinthW - 16;
    const rightPlinthY = steleY + 12;
    const rightPlinthH = steleH - 24;

    ctx.fillStyle = isUnlocked ? 'rgba(34, 197, 94, 0.12)' : 'rgba(15, 23, 42, 0.7)';
    ctx.strokeStyle = isUnlocked ? 'rgba(34, 197, 94, 0.55)' : 'rgba(71, 85, 105, 0.4)';
    ctx.lineWidth = 1;
    roundRect(ctx, rightPlinthX, rightPlinthY, rightPlinthW, rightPlinthH, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = isUnlocked ? '#86efac' : '#94a3b8';
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(isUnlocked ? '✔ DEED CONSECRATED' : '◇ UNACCOMPLISHED TRIAL', rightPlinthX + rightPlinthW / 2, rightPlinthY + 12);

    if (meta.hasProgress) {
      const curProg = meta.getProgress ? meta.getProgress() : 0;
      const maxProg = meta.progressMax || 1;
      const progPct = Math.min(100, Math.round((curProg / maxProg) * 100));

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 8.5px monospace';
      ctx.fillText(`${curProg} / ${maxProg} ${meta.progressLabel || ''}`, rightPlinthX + rightPlinthW / 2, rightPlinthY + 30);

      // Mini Progress Track
      const pTrackW = rightPlinthW - 24;
      const pTrackX = rightPlinthX + 12;
      const pTrackY = rightPlinthY + 48;
      ctx.fillStyle = '#0f172a';
      roundRect(ctx, pTrackX, pTrackY, pTrackW, 6, 3);
      ctx.fill();

      const pFillW = Math.max(2, Math.min(pTrackW, pTrackW * (progPct / 100)));
      ctx.fillStyle = isUnlocked ? '#22c55e' : '#f59e0b';
      roundRect(ctx, pTrackX, pTrackY, pFillW, 6, 3);
      ctx.fill();
    } else {
      ctx.fillStyle = isUnlocked ? '#fef08a' : '#64748b';
      ctx.font = 'italic 9.5px Crimson Text, serif';
      ctx.fillText(isUnlocked ? 'Permanently etched in citadel memory' : 'Fulfill trial conditions to record deed', rightPlinthX + rightPlinthW / 2, rightPlinthY + 36);
    }

    // ─────────────────────────────────────────────────────────────
    // 4. BOTTOM BAR: KEYBOARD HINTS & RETURN BUTTON
    // ─────────────────────────────────────────────────────────────
    const botY = panY + panH - 36;
    const retW = 190, retH = 26;
    const retX = panX + panW - 20 - retW;
    const isHoverRet = mouseX >= retX && mouseX <= retX + retW && mouseY >= botY && mouseY <= botY + retH;

    ctx.fillStyle = isHoverRet ? 'rgba(51, 65, 85, 0.7)' : 'rgba(30, 41, 59, 0.5)';
    ctx.strokeStyle = isHoverRet ? '#ffffff' : 'rgba(148, 163, 184, 0.45)';
    ctx.lineWidth = 1;
    roundRect(ctx, retX, botY, retW, retH, 5);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('◈ RETURN ( Esc )', retX + retW / 2, botY + retH / 2);

    ctx.fillStyle = 'rgba(148, 163, 184, 0.65)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Arrows — Cycle Medallions    Click — Select Deed    Esc — Return', panX + 24, botY + 13);

    _zones.push({
      id: 'btn_close',
      x: retX, y: botY, w: retW, h: retH,
      action: closeAchievements
    });

    ctx.restore();
  },

  wrapText(ctx, text, maxWidth) {
    if (!text) return [];
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

  handleKeyDown(key) {
    if (key === 'Escape') {
      closeAchievements();
      return true;
    }
    if (key === 'ArrowRight' || key === 'ArrowDown') {
      const keys = ORDERED_ACHIEVEMENT_KEYS;
      const idx = keys.indexOf(_selectedKey);
      const nextIdx = (idx + 1 + keys.length) % keys.length;
      this.selectKey(keys[nextIdx]);
      return true;
    }
    if (key === 'ArrowLeft' || key === 'ArrowUp') {
      const keys = ORDERED_ACHIEVEMENT_KEYS;
      const idx = keys.indexOf(_selectedKey);
      const prevIdx = (idx - 1 + keys.length) % keys.length;
      this.selectKey(keys[prevIdx]);
      return true;
    }
    return false;
  },

  handleWheel(deltaY) {
    const keys = ORDERED_ACHIEVEMENT_KEYS;
    const idx = keys.indexOf(_selectedKey);
    const step = deltaY > 0 ? 1 : -1;
    const nextIdx = (idx + step + keys.length) % keys.length;
    this.selectKey(keys[nextIdx]);
  },

  handleClick(mx, my) {
    for (const z of _zones) {
      if (mx >= z.x && mx <= z.x + z.w && my >= z.y && my <= z.y + z.h) {
        if (z.action) {
          z.action();
          return true;
        }
      }
    }

    // Click outside panel returns
    const panW = 890, panH = 520;
    const panX = (LW - panW) / 2, panY = (LH - panH) / 2;
    if (mx < panX || mx > panX + panW || my < panY || my > panY + panH) {
      closeAchievements();
      return true;
    }

    return false;
  }
};

export function drawAchievementsPanel(ctx, dt) {
  AchievementsUI.draw(ctx, dt);
}

AchievementsUI._zones = _zones;

if (typeof window !== 'undefined') {
  window.AchievementsUI = AchievementsUI;
  window.openAchievements = openAchievements;
  window.closeAchievements = closeAchievements;
  window.addEventListener('wheel', (e) => {
    if (GameState.STATE === GameStates.ACHIEVEMENTS) {
      AchievementsUI.handleWheel(e.deltaY);
    }
  }, { passive: true });
}
