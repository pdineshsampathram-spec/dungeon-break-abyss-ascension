// =====================================================================
//  DUNGEON BREAK — js/ui/AchievementsUI.js
//  Phase 9 Reconstruction: Monumental Wall of Deeds & Lore Archive
//  - Monumental Archival Interface: Scrollable list + Inscribed Stele Inspector
//  - Full wrapped titles without ellipses, zero truncation
//  - Sequential Savior Tier journey (Tiers II & III locked until prerequisite)
//  - Preserved Apex Shrine: Eye of the Absolute & 8 Roman Milestone Pips
//  - Responsive category navigation, smooth mouse wheel/drag/touch scrolling
//  - 100% Canvas 2D Pixel-Art, Zero Emojis, Zero Placeholders
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, roundRect } from '../core/Constants.js';
import { ACHIEVEMENTS, ACHIEVEMENT_KEYS } from '../data/achievements.js';
import { SoundManager } from '../audio/AudioManager.js';
import { InputManager } from '../core/InputManager.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { drawAchievementIcon } from '../rendering/AchievementIconRenderer.js';
import {
  drawStoneButton,
  drawStoneTab,
  drawStonePanel,
  drawStoneCard,
  drawChamferedPanel,
  drawCornerBrackets
} from './ButtonArtManager.js?v=2.0';

// ─────────────────────────────────────────────────────────────────────
// 1. ORDERED PROGRESSION & METADATA BIBLE (ALL 40 CANONICAL DEEDS)
// ─────────────────────────────────────────────────────────────────────

export const ORDERED_ACHIEVEMENT_KEYS = [
  // Survival (8)
  'overwhelmed',
  'consumed',
  'sanity_keeper',
  'mind_break',
  'deaths_5',
  'deaths_10',
  'deaths_25',
  'executed',

  // Combat (10)
  'first_blood',
  'shield_bearer',
  'sharpshooter',
  'untouchable',
  'jailbreaker',
  'gorgaroth_nemesis',
  'void_conqueror',
  'malakor_nemesis',
  'boss_slayer',
  'warden_nemesis',

  // Speedrun (11)
  'speed_runner',
  'speed_floor_1',
  'speed_floor_2',
  'speed_floor_3',
  'speed_floor_4',
  'speed_floor_5',
  'speed_floor_6',
  'speed_floor_7',
  'speed_floor_8',
  'speed_floor_9',
  'speed_floor_10',

  // Discovery (5)
  'savior',
  'savior_2',
  'savior_3',
  'perfect_rescue',
  'lore_master',

  // Ascension (2)
  'soul_ascendant',
  'maxed_talent',

  // The Three Fates (3)
  'true_hero',
  'betrayed',
  'rampage',

  // Absolute Mastery (1)
  'last_witness'
];

export const ACHIEVEMENT_CATEGORIES = [
  { id: 'all',         label: 'ALL',         icon: '◈' },
  { id: 'survival',    label: 'SURVIVAL',    icon: 'ᛟ' },
  { id: 'combat',      label: 'COMBAT',      icon: '⚔' },
  { id: 'speedrun',    label: 'SPEEDRUN',    icon: '⚡' },
  { id: 'discovery',   label: 'DISCOVERY',   icon: '✦' },
  { id: 'progression', label: 'ASCENSION',   icon: 'ᛏ' },
  { id: 'endings',     label: 'THE FATES',   icon: '♛' },
  { id: 'mastery',     label: 'ABSOLUTE',    icon: '👁' }
];

export const ACHIEVEMENT_METADATA = {
  // Survival
  overwhelmed: {
    category: 'survival',
    categoryLabel: 'SURVIVAL LESSON',
    instruction: 'Fall in battle against standard subterranean dungeon horrors (not a boss).'
  },
  consumed: {
    category: 'survival',
    categoryLabel: 'SURVIVAL LESSON',
    instruction: 'Succumb to lethal physical damage within the dark corridors of the abyss.'
  },
  sanity_keeper: {
    category: 'survival',
    categoryLabel: 'SURVIVAL DISCIPLINE',
    instruction: 'Descend to Floor 5 while maintaining Rowan\'s mental sanity above 70%.'
  },
  mind_break: {
    category: 'survival',
    categoryLabel: 'SURVIVAL TRIAL',
    instruction: 'Allow Rowan\'s sanity to collapse to zero and endure the complete Shattered Mind sequence.'
  },
  deaths_5: {
    category: 'survival',
    categoryLabel: 'SURVIVAL TRIAL',
    instruction: 'Perish 5 times within the depths of the abyss across all cumulative descents.',
    hasProgress: true,
    progressLabel: 'DEATHS RECORDED',
    progressMax: 5,
    getProgress: () => GameState.LIFETIME_DEATHS || 0
  },
  deaths_10: {
    category: 'survival',
    categoryLabel: 'SURVIVAL TRIAL',
    instruction: 'Perish 10 times within the depths of the abyss across all cumulative descents.',
    hasProgress: true,
    progressLabel: 'DEATHS RECORDED',
    progressMax: 10,
    getProgress: () => GameState.LIFETIME_DEATHS || 0
  },
  deaths_25: {
    category: 'survival',
    categoryLabel: 'SURVIVAL TRIAL',
    instruction: 'Perish 25 times within the depths of the abyss across all cumulative descents.',
    hasProgress: true,
    progressLabel: 'DEATHS RECORDED',
    progressMax: 25,
    getProgress: () => GameState.LIFETIME_DEATHS || 0
  },
  executed: {
    category: 'survival',
    categoryLabel: 'SURVIVAL TRIAL',
    instruction: 'Fall in combat against The Abyss Warden during his throne confrontation on Floor 10.'
  },

  // Combat
  first_blood: {
    category: 'combat',
    categoryLabel: 'COMBAT TRIAL',
    instruction: 'Slay your first hostile creature in the dark subterranean corridors.'
  },
  shield_bearer: {
    category: 'combat',
    categoryLabel: 'COMBAT DISCIPLINE',
    instruction: 'Trigger your weapon\'s defensive shield ability in the heat of combat.'
  },
  sharpshooter: {
    category: 'combat',
    categoryLabel: 'COMBAT MASTERY',
    instruction: 'Eliminate 10 hostile creatures using ranged weapon strikes (Longbow or Crossbow).',
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
  jailbreaker: {
    category: 'combat',
    categoryLabel: 'DUNGEON TRIAL',
    instruction: 'Defeat Gorgaroth, Breaker of Chains, in the Iron Colosseum on Floor 3.'
  },
  gorgaroth_nemesis: {
    category: 'combat',
    categoryLabel: 'BOSS NEMESIS',
    instruction: 'Defeat Gorgaroth, Breaker of Chains, 5 times across all descents.',
    hasProgress: true,
    progressLabel: 'GORGAROTH DEFEATS',
    progressMax: 5,
    getProgress: () => (GameState.LIFETIME_BOSS_KILLS && GameState.LIFETIME_BOSS_KILLS.gorgaroth) || 0
  },
  void_conqueror: {
    category: 'combat',
    categoryLabel: 'DUNGEON TRIAL',
    instruction: 'Vanquish Malakor, The Void Reaver, in the abyssal rift on Floor 6.'
  },
  malakor_nemesis: {
    category: 'combat',
    categoryLabel: 'BOSS NEMESIS',
    instruction: 'Defeat Malakor, The Void Reaver, 5 times across all descents.',
    hasProgress: true,
    progressLabel: 'MALAKOR DEFEATS',
    progressMax: 5,
    getProgress: () => (GameState.LIFETIME_BOSS_KILLS && GameState.LIFETIME_BOSS_KILLS.malakor) || 0
  },
  boss_slayer: {
    category: 'combat',
    categoryLabel: 'DUNGEON CONQUEST',
    instruction: 'Conquer The Abyss Warden on Floor 10 and unlock the Abyssal Gateway.'
  },
  warden_nemesis: {
    category: 'combat',
    categoryLabel: 'BOSS NEMESIS',
    instruction: 'Defeat The Abyss Warden 5 times across all descents.',
    hasProgress: true,
    progressLabel: 'WARDEN DEFEATS',
    progressMax: 5,
    getProgress: () => (GameState.LIFETIME_BOSS_KILLS && GameState.LIFETIME_BOSS_KILLS.warden) || 0
  },

  // Speedrun
  speed_runner: {
    category: 'speedrun',
    categoryLabel: 'SPEEDRUN TRIAL',
    instruction: 'Clear an entire dungeon floor and enter the exit portal in under 90 seconds.'
  },
  speed_floor_1: {
    category: 'speedrun',
    categoryLabel: 'FLOOR 1 SPEEDRUN',
    instruction: 'Clear Floor 1 (The Sunken Crypts) and enter the portal in under 60 seconds of active floor time.'
  },
  speed_floor_2: {
    category: 'speedrun',
    categoryLabel: 'FLOOR 2 SPEEDRUN',
    instruction: 'Clear Floor 2 (The Flooded Tombs) and enter the portal in under 60 seconds of active floor time.'
  },
  speed_floor_3: {
    category: 'speedrun',
    categoryLabel: 'FLOOR 3 BOSS SPEEDRUN',
    instruction: 'Defeat Gorgaroth, Breaker of Chains, on Floor 3 in under 90 seconds of active floor time.'
  },
  speed_floor_4: {
    category: 'speedrun',
    categoryLabel: 'FLOOR 4 SPEEDRUN',
    instruction: 'Clear Floor 4 (The Drowned Cloisters) and enter the portal in under 60 seconds of active floor time.'
  },
  speed_floor_5: {
    category: 'speedrun',
    categoryLabel: 'FLOOR 5 SPEEDRUN',
    instruction: 'Clear Floor 5 (The Forgotten Vaults) and enter the portal in under 60 seconds of active floor time.'
  },
  speed_floor_6: {
    category: 'speedrun',
    categoryLabel: 'FLOOR 6 BOSS SPEEDRUN',
    instruction: 'Vanquish Malakor, The Void Reaver, on Floor 6 in under 120 seconds of active floor time.'
  },
  speed_floor_7: {
    category: 'speedrun',
    categoryLabel: 'FLOOR 7 SPEEDRUN',
    instruction: 'Clear Floor 7 (The Ashen Galleries) and enter the portal in under 60 seconds of active floor time.'
  },
  speed_floor_8: {
    category: 'speedrun',
    categoryLabel: 'FLOOR 8 SPEEDRUN',
    instruction: 'Clear Floor 8 (The Silent Bastion) and enter the portal in under 60 seconds of active floor time.'
  },
  speed_floor_9: {
    category: 'speedrun',
    categoryLabel: 'FLOOR 9 SPEEDRUN',
    instruction: 'Clear Floor 9 (The Obsidian Sanctum) and enter the portal in under 60 seconds of active floor time.'
  },
  speed_floor_10: {
    category: 'speedrun',
    categoryLabel: 'FLOOR 10 BOSS SPEEDRUN',
    instruction: 'Defeat The Abyss Warden on Floor 10 in under 180 seconds of active floor time.'
  },

  // Discovery & Sequential Savior Tiers
  savior: {
    category: 'discovery',
    categoryLabel: 'SAVIOR JOURNEY (TIER I)',
    instruction: 'Locate and liberate 5 trapped survivor souls across the dungeon corridors.',
    hasProgress: true,
    progressLabel: 'SURVIVORS LIBERATED',
    progressMax: 5,
    getProgress: () => Math.min(5, GameState.CUMULATIVE_SURVIVORS || GameState.SAVED_SURVIVORS || 0)
  },
  savior_2: {
    category: 'discovery',
    categoryLabel: 'SAVIOR JOURNEY (TIER II)',
    instruction: 'Liberate 10 trapped survivors across all descents. (Requires Savior I completed)',
    hasProgress: true,
    prerequisite: 'savior',
    prereqLabel: 'Savior I (5 rescues)',
    progressLabel: 'SURVIVORS LIBERATED',
    progressMax: 10,
    getProgress: () => {
      if (!ACHIEVEMENTS.savior || !ACHIEVEMENTS.savior.unlocked) return 0;
      return Math.min(10, GameState.CUMULATIVE_SURVIVORS || 0);
    }
  },
  savior_3: {
    category: 'discovery',
    categoryLabel: 'SAVIOR JOURNEY (TIER III)',
    instruction: 'Liberate 15 trapped survivors across all descents. (Requires Savior II completed)',
    hasProgress: true,
    prerequisite: 'savior_2',
    prereqLabel: 'Savior II (10 rescues)',
    progressLabel: 'SURVIVORS LIBERATED',
    progressMax: 15,
    getProgress: () => {
      if (!ACHIEVEMENTS.savior_2 || !ACHIEVEMENTS.savior_2.unlocked) return 0;
      return Math.min(15, GameState.CUMULATIVE_SURVIVORS || 0);
    }
  },
  perfect_rescue: {
    category: 'discovery',
    categoryLabel: 'SHEPHERD OF SOULS',
    instruction: 'Complete an entire descent rescuing every single trapped soul encountered without leaving any behind.'
  },
  lore_master: {
    category: 'discovery',
    categoryLabel: 'DISCOVERY ARCHIVE',
    instruction: 'Uncover all 10 ancient stratum chronicles hidden throughout the subterranean floors.',
    hasProgress: true,
    progressLabel: 'STRATUM CHRONICLES UNCOVERED',
    progressMax: 10,
    getProgress: () => {
      const lore = GameState.UNLOCKED_LORE || {};
      const floorKeys = [
        'floor_1_seal', 'floor_2_deserters', 'floor_3_iron', 'floor_4_measure',
        'floor_5_dark', 'floor_6_void', 'floor_7_purpose', 'floor_8_blade',
        'floor_9_measure', 'floor_10_warden'
      ];
      return floorKeys.filter(k => lore[k]).length;
    }
  },

  // Ascension
  soul_ascendant: {
    category: 'progression',
    categoryLabel: 'METAPROGRESSION',
    instruction: 'Accumulate 100 total Abyss Souls harvested from slain horrors and boss encounters.',
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

  // The Three Fates
  true_hero: {
    category: 'endings',
    categoryLabel: 'THE THREE FATES',
    instruction: 'Step through the Abyssal Gateway as the noble Savior of the Depth (Hero Ending).'
  },
  betrayed: {
    category: 'endings',
    categoryLabel: 'THE THREE FATES',
    instruction: 'Step through the Abyssal Gateway after executing the trapped survivors (Betrayal Ending).'
  },
  rampage: {
    category: 'endings',
    categoryLabel: 'THE THREE FATES',
    instruction: 'Step through the Abyssal Gateway consumed by absolute madness, destroying all in your wake (Rampage Ending).'
  },

  // Absolute Mastery
  last_witness: {
    category: 'mastery',
    categoryLabel: 'ABYSSAL MASTERY',
    instruction: 'Witness all five required death outcomes and achieve the Hero, Betrayal, and Rampage endings.',
    isLastWitness: true,
    hasProgress: true,
    progressLabel: 'FATES RECORDED',
    progressMax: 8,
    getProgress: () => {
      const m = GameState.COMPLETION_MILESTONES || {};
      return EIGHT_FATES.filter(f => !!m[f.key] || (ACHIEVEMENTS[f.achKey] && ACHIEVEMENTS[f.achKey].unlocked)).length;
    }
  }
};

// 8 Canonical Fates required for Last Witness milestone
export const EIGHT_FATES = [
  { key: 'death_normal_enemy',   label: 'Dungeon',    roman: 'I',    achKey: 'overwhelmed' },
  { key: 'death_gorgaroth',       label: 'Gorgaroth',  roman: 'II',   achKey: 'jailbreaker' },
  { key: 'death_malakor',         label: 'Malakor',    roman: 'III',  achKey: 'void_conqueror' },
  { key: 'death_warden',          label: 'Warden',     roman: 'IV',   achKey: 'executed' },
  { key: 'death_shattered_mind',  label: 'Insanity',   roman: 'V',    achKey: 'mind_break' },
  { key: 'ending_hero',           label: 'Hero',       roman: 'VI',   achKey: 'true_hero' },
  { key: 'ending_betrayal',       label: 'Betrayal',   roman: 'VII',  achKey: 'betrayed' },
  { key: 'ending_rampage',        label: 'Rampage',    roman: 'VIII', achKey: 'rampage' }
];

// ─────────────────────────────────────────────────────────────────────
// 2. UI STATE & HELPERS
// ─────────────────────────────────────────────────────────────────────

let _slideAnim = 0;
let _ambientTimer = 0;
let _activeCategory = 'all';
let _selectedKey = 'overwhelmed';
let _scrollOffset = 0;
let _targetScrollOffset = 0;
let _isDraggingScroll = false;
let _dragStartY = 0;
let _dragStartOffset = 0;
let _returnState = GameStates.TITLE;

export function getReturnState() { return _returnState; }

const _zones = [];

export function openAchievements(fromState = null) {
  _slideAnim = 0;
  _ambientTimer = 0;
  _scrollOffset = 0;
  _targetScrollOffset = 0;
  _isDraggingScroll = false;
  _activeCategory = 'all';
  _selectedKey = ORDERED_ACHIEVEMENT_KEYS[0];
  _returnState = fromState ? fromState : (GameState.STATE === GameStates.PAUSED ? GameStates.PAUSED : GameStates.TITLE);
  GameState.setState(GameStates.ACHIEVEMENTS);
  SoundManager.snd('panel_open');
}

export function closeAchievements() {
  SoundManager.snd('panel_close');
  const target = (_returnState === GameStates.PAUSED) ? GameStates.PAUSED : GameStates.TITLE;
  _returnState = GameStates.TITLE;
  GameState.setState(target);
}

// ─────────────────────────────────────────────────────────────────────
// 3. MAIN ACHIEVEMENTS ARCHIVE UI
// ─────────────────────────────────────────────────────────────────────

export const AchievementsUI = {
  _zones,

  getCategory() {
    return _activeCategory;
  },

  setCategory(catId) {
    if (_activeCategory !== catId) {
      _activeCategory = catId;
      _targetScrollOffset = 0;
      _scrollOffset = 0;
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
      this.ensureSelectedVisible();
    }
  },

  getFilteredKeys() {
    return ORDERED_ACHIEVEMENT_KEYS.filter(k => {
      if (_activeCategory === 'all') return true;
      const meta = ACHIEVEMENT_METADATA[k];
      return meta && meta.category === _activeCategory;
    });
  },

  ensureSelectedVisible() {
    const filtered = this.getFilteredKeys();
    const idx = filtered.indexOf(_selectedKey);
    if (idx === -1) return;
    const itemH = 56;
    const itemGap = 6;
    const itemTop = idx * (itemH + itemGap);
    const itemBottom = itemTop + itemH;
    const listH = 340; // Approximate list visible viewport
    if (itemTop < _targetScrollOffset) {
      _targetScrollOffset = itemTop;
    } else if (itemBottom > _targetScrollOffset + listH) {
      _targetScrollOffset = itemBottom - listH;
    }
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

  draw(ctx, dt = 0.016) {
    _slideAnim = Math.min(1, _slideAnim + dt * 6.0);
    _ambientTimer += dt;
    const eased = 1 - Math.pow(1 - _slideAnim, 3);
    const isReducedMotion = !!(GameState.settings && GameState.settings.reducedMotion) || !!GameState.REDUCED_MOTION;

    ctx.save();
    ctx.globalAlpha = eased;

    // Dark Obsidian Backdrop
    ctx.fillStyle = 'rgba(2, 4, 10, 0.92)';
    ctx.fillRect(0, 0, LW, LH);

    // Responsive Main Panel Bounds
    const panW = Math.min(880, LW - 24);
    const panH = Math.min(580, LH - 24);
    const panX = Math.round((LW - panW) / 2);
    const panY = Math.round((LH - panH) / 2 - (1 - eased) * 30);

    // Stone Texture & Crimson/Gold Ambient Backglow
    const pulse = 0.5 + 0.5 * Math.sin(_ambientTimer * 2.2);
    const grad = ctx.createRadialGradient(panX + panW / 2, panY + 70, 20, panX + panW / 2, panY + 140, 480);
    grad.addColorStop(0, `rgba(220, 38, 38, ${0.15 + pulse * 0.05})`);
    grad.addColorStop(0.5, 'rgba(217, 119, 6, 0.08)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(panX - 40, panY - 40, panW + 80, panH + 80);

    // Master Outer Enclosure (Forged Obsidian + Antique Gold Rim)
    drawStonePanel(ctx, panX, panY, panW, panH, { bevelColor: 'gold', chamfer: 12, headerHeight: 0 });
    drawCornerBrackets(ctx, panX + 4, panY + 4, panW - 8, panH - 8, 20);

    _zones.length = 0;
    const mouseX = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.mx : -999;
    const mouseY = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.my : -999;

    // Unlocked Counts
    const totalCount = ORDERED_ACHIEVEMENT_KEYS.length;
    const unlockedCount = ORDERED_ACHIEVEMENT_KEYS.filter(k => ACHIEVEMENTS[k] && ACHIEVEMENTS[k].unlocked).length;
    const targetPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

    // ─────────────────────────────────────────────────────────────
    // HEADER: APEX SHRINE & CONQUEST GAUGE (HEIGHT ~78px)
    // ─────────────────────────────────────────────────────────────
    const apexY = panY + 12;
    const apexH = 72;

    // Left Wing: Total Conquest Gauge
    const leftWingW = 210;
    drawStoneCard(ctx, panX + 16, apexY, leftWingW, apexH, { isHover: false, isSelected: false, chamfer: 6 });

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('◈ CONQUEST ARCHIVE', panX + 26, apexY + 10);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 16px Cinzel, serif';
    ctx.fillText(`${unlockedCount} / ${totalCount}`, panX + 26, apexY + 24);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(`${targetPct}% CONSECRATED`, panX + 102, apexY + 30);

    // Segmented Progress Track
    const trackW = leftWingW - 20;
    const trackH = 6;
    const trackX = panX + 26;
    const trackY = apexY + 48;
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.6)';
    roundRect(ctx, trackX, trackY, trackW, trackH, 3);
    ctx.fill(); ctx.stroke();

    const fillW = Math.max(3, Math.min(trackW, Math.round(trackW * (targetPct / 100))));
    const trackGrad = ctx.createLinearGradient(trackX, 0, trackX + trackW, 0);
    trackGrad.addColorStop(0, '#d97706');
    trackGrad.addColorStop(1, '#fde68a');
    ctx.fillStyle = trackGrad;
    roundRect(ctx, trackX, trackY, fillW, trackH, 3);
    ctx.fill();

    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = 'italic 7.5px Crimson Text, serif';
    ctx.fillText('Immutable deeds etched in eternal granite', panX + 26, apexY + 59);

    // Center: Altar of the Eye of the Absolute (The Last Witness)
    const centerW = 390;
    const centerX = panX + Math.round((panW - centerW) / 2);
    drawStoneCard(ctx, centerX, apexY, centerW, apexH, { isHover: false, isSelected: false, accentColor: 'crimson', chamfer: 6 });

    // Title
    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 10px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = '#dc2626';
    ctx.shadowBlur = 5;
    ctx.fillText('◈ MONUMENTAL WALL OF DEEDS · SANCTUM OF FATES ◈', centerX + centerW / 2, apexY + 7);
    ctx.shadowBlur = 0;

    // Central Eye Icon (36 × 36 px)
    const eyeCx = centerX + centerW / 2;
    const eyeCy = apexY + 42;
    const eyeSize = 36;
    const isWitnessUnlocked = ACHIEVEMENTS.last_witness && ACHIEVEMENTS.last_witness.unlocked;

    drawAchievementIcon(ctx, 'last_witness', eyeCx, eyeCy, eyeSize, isWitnessUnlocked, true, _ambientTimer, isReducedMotion);

    _zones.push({
      id: 'apex_eye',
      x: eyeCx - eyeSize / 2 - 4, y: eyeCy - eyeSize / 2 - 4, w: eyeSize + 8, h: eyeSize + 8,
      action: () => this.selectKey('last_witness')
    });

    // 8 Surrounding Fate Milestone Pips (4 on left, 4 on right)
    const fateOrbR = 6.5;
    EIGHT_FATES.forEach((f, fIdx) => {
      const isLeft = fIdx < 4;
      const slot = isLeft ? fIdx : (fIdx - 4);
      const fx = isLeft ? (eyeCx - 32 - (3 - slot) * 25) : (eyeCx + 32 + slot * 25);
      const fy = eyeCy;

      const fateUnlocked = !!(GameState.COMPLETION_MILESTONES && GameState.COMPLETION_MILESTONES[f.key]) ||
                           (ACHIEVEMENTS[f.achKey] && ACHIEVEMENTS[f.achKey].unlocked);
      const isSelFate = _selectedKey === f.achKey;

      ctx.beginPath();
      ctx.arc(fx, fy, fateOrbR, 0, Math.PI * 2);
      ctx.fillStyle = fateUnlocked
        ? (f.key.startsWith('ending') ? '#c084fc' : '#f59e0b')
        : '#1e293b';
      ctx.fill();
      ctx.strokeStyle = isSelFate ? '#ffffff' : (fateUnlocked ? '#fde68a' : 'rgba(71, 85, 105, 0.45)');
      ctx.lineWidth = isSelFate ? 1.6 : 1;
      ctx.stroke();

      ctx.fillStyle = fateUnlocked ? '#ffffff' : '#94a3b8';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.roman, fx, fy);

      _zones.push({
        id: `fate_pip_${f.key}`,
        x: fx - fateOrbR - 3, y: fy - fateOrbR - 3, w: (fateOrbR + 3) * 2, h: (fateOrbR + 3) * 2,
        action: () => this.selectKey(f.achKey)
      });
    });

    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = 'bold 7px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('5 CRUCIBLES (I-V)', eyeCx - 70, eyeCy + 14);
    ctx.fillText('3 FATES (VI-VIII)', eyeCx + 70, eyeCy + 14);

    // Right Wing: Quick Stats / Seal
    const rightWingW = panW - (centerX + centerW - panX) - 32;
    const rightWingX = panX + panW - 16 - rightWingW;
    drawStoneCard(ctx, rightWingX, apexY, rightWingW, apexH, { isHover: false, isSelected: false, chamfer: 6 });

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('✦ CITADEL SEALS', rightWingX + 10, apexY + 10);

    const lifetimeRescues = GameState.CUMULATIVE_SURVIVORS || GameState.SAVED_SURVIVORS || 0;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '7.5px monospace';
    ctx.fillText(`Souls Saved: ${lifetimeRescues}`, rightWingX + 10, apexY + 25);
    ctx.fillText(`Abyss Deaths: ${GameState.LIFETIME_DEATHS || 0}`, rightWingX + 10, apexY + 38);

    const loreCount = Object.keys(GameState.UNLOCKED_LORE || {}).length;
    ctx.fillText(`Chronicles: ${loreCount}/10`, rightWingX + 10, apexY + 51);

    // ─────────────────────────────────────────────────────────────
    // CATEGORY NAVIGATION TABS (2 BALANCED ROWS, 4 TABS PER ROW)
    // ─────────────────────────────────────────────────────────────
    const tabsY = apexY + apexH + 8;
    const tabsW = panW - 28;
    const tabsX = panX + 14;
    const tabGap = 6;
    const tabsPerRow = 4;
    const tabW = Math.floor((tabsW - (tabsPerRow - 1) * tabGap) / tabsPerRow);
    const tabH = 24;
    const rowGap = 5;

    ACHIEVEMENT_CATEGORIES.forEach((cat, idx) => {
      const row = Math.floor(idx / tabsPerRow);
      const col = idx % tabsPerRow;
      const tx = tabsX + col * (tabW + tabGap);
      const ty = tabsY + row * (tabH + rowGap);
      const isSel = _activeCategory === cat.id;
      const isHover = mouseX >= tx && mouseX <= tx + tabW && mouseY >= ty && mouseY <= ty + tabH;

      const catCount = (cat.id === 'all')
        ? totalCount
        : ORDERED_ACHIEVEMENT_KEYS.filter(k => ACHIEVEMENT_METADATA[k] && ACHIEVEMENT_METADATA[k].category === cat.id).length;

      drawStoneTab(ctx, tx, ty, tabW, tabH, {
        icon: cat.icon,
        label: cat.label,
        count: catCount,
        isActive: isSel,
        isHover,
        accentColor: 'gold',
        fontSize: 9.0,
        chamfer: 4
      });

      _zones.push({
        id: `tab_${cat.id}`,
        x: tx, y: ty, w: tabW, h: tabH,
        action: () => this.setCategory(cat.id)
      });
    });

    // ─────────────────────────────────────────────────────────────
    // TWO-COLUMN ARCHIVAL LAYOUT: LIST (LEFT) & INSPECTOR (RIGHT)
    // ─────────────────────────────────────────────────────────────
    const tabsTotalH = 2 * tabH + rowGap;
    const mainY = tabsY + tabsTotalH + 6;
    const botBarH = 34;
    const mainH = panY + panH - mainY - botBarH - 8;

    const listW = Math.round((panW - 28) * 0.58);
    const listX = panX + 14;
    const listH = mainH;

    const inspX = listX + listW + 10;
    const inspW = panW - 28 - listW - 10;
    const inspH = mainH;

    // Smooth Scrolling Interpolation
    const filteredKeys = this.getFilteredKeys();
    const itemH = 56;
    const itemGap = 6;
    const totalContentH = filteredKeys.length * (itemH + itemGap) - itemGap;
    const maxScroll = Math.max(0, totalContentH - listH);

    _targetScrollOffset = Math.max(0, Math.min(maxScroll, _targetScrollOffset));
    _scrollOffset += (_targetScrollOffset - _scrollOffset) * Math.min(1, dt * 14.0);

    // ─────────────────────────────────────────────────────────────
    // A. LEFT COLUMN: SCROLLABLE LIST OF DEED CARDS
    // ─────────────────────────────────────────────────────────────
    // Outer List Enclosure
    drawStonePanel(ctx, listX, mainY, listW, listH, { bevelColor: 'bronze', chamfer: 6, headerHeight: 0 });

    // Clip Region for Cards
    ctx.save();
    ctx.beginPath();
    ctx.rect(listX + 2, mainY + 2, listW - 16, listH - 4);
    ctx.clip();

    const cardW = listW - 18;

    filteredKeys.forEach((k, idx) => {
      const cardY = mainY + 6 + idx * (itemH + itemGap) - _scrollOffset;

      // Vertical Culling
      if (cardY + itemH < mainY || cardY > mainY + listH) return;

      const a = ACHIEVEMENTS[k] || {};
      const meta = ACHIEVEMENT_METADATA[k] || {};
      const isUnlocked = !!a.unlocked;
      const isSel = k === _selectedKey;
      const isHover = mouseX >= listX + 6 && mouseX <= listX + 6 + cardW && mouseY >= cardY && mouseY <= cardY + itemH;

      // Sequential Savior Tier check
      const isPrereqLocked = meta.prerequisite && (!ACHIEVEMENTS[meta.prerequisite] || !ACHIEVEMENTS[meta.prerequisite].unlocked);

      // Card Background
      drawStoneCard(ctx, listX + 6, cardY, cardW, itemH, {
        isHover,
        isSelected: isSel,
        isLocked: !isUnlocked,
        accentColor: isUnlocked ? 'gold' : (isPrereqLocked ? 'crimson' : 'gold'),
        chamfer: 5
      });

      // Custom Pixel-Art Icon (32 × 32 px)
      const iconCx = listX + 26;
      const iconCy = cardY + itemH / 2;
      drawAchievementIcon(ctx, k, iconCx, iconCy, 30, isUnlocked, isHover || isSel, _ambientTimer, isReducedMotion);

      // Full Name (Never clipped with ellipses; wraps to 2 lines if needed)
      const textX = listX + 48;
      const textMaxW = cardW - 165; // Leaving room for status pill on right

      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = isUnlocked ? (isSel ? '#ffffff' : '#fde68a') : (isPrereqLocked ? '#94a3b8' : '#e2e8f0');
      ctx.font = isSel ? 'bold 10px Cinzel, serif' : 'bold 9.5px Cinzel, serif';

      const nameWords = (a.name || k).toUpperCase().split(' ');
      let line1 = '';
      let line2 = '';
      for (const w of nameWords) {
        const test = line1 ? line1 + ' ' + w : w;
        if (ctx.measureText(test).width <= textMaxW) {
          line1 = test;
        } else {
          line2 = line2 ? line2 + ' ' + w : w;
        }
      }

      if (line2) {
        ctx.fillText(line1, textX, cardY + 7);
        ctx.fillText(line2, textX, cardY + 19);
        // Category Label below title
        ctx.fillStyle = isUnlocked ? '#86efac' : '#94a3b8';
        ctx.font = '7.5px Cinzel, serif';
        ctx.fillText(meta.categoryLabel || 'DEED', textX, cardY + 34);
      } else {
        ctx.fillText(line1, textX, cardY + 11);
        ctx.fillStyle = isUnlocked ? '#86efac' : '#94a3b8';
        ctx.font = '7.5px Cinzel, serif';
        ctx.fillText(meta.categoryLabel || 'DEED', textX, cardY + 28);
      }

      // Right Side: Status Pill & Progress
      const pillW = 104;
      const pillH = 20;
      const pillX = listX + 6 + cardW - pillW - 8;
      const pillY = cardY + 8;

      ctx.fillStyle = isUnlocked
        ? 'rgba(34, 197, 94, 0.18)'
        : (isPrereqLocked ? 'rgba(239, 68, 68, 0.15)' : (meta.hasProgress ? 'rgba(245, 158, 11, 0.15)' : 'rgba(30, 41, 59, 0.6)'));
      ctx.strokeStyle = isUnlocked
        ? '#22c55e'
        : (isPrereqLocked ? 'rgba(239, 68, 68, 0.5)' : (meta.hasProgress ? '#f59e0b' : 'rgba(71, 85, 105, 0.5)'));
      ctx.lineWidth = 1;
      roundRect(ctx, pillX, pillY, pillW, pillH, 3);
      ctx.fill(); ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 7.5px monospace';

      if (isUnlocked) {
        ctx.fillStyle = '#86efac';
        ctx.fillText('✔ CONQUERED', pillX + pillW / 2, pillY + pillH / 2);
      } else if (isPrereqLocked) {
        ctx.fillStyle = '#fca5a5';
        ctx.fillText('🔒 LOCKED TIER', pillX + pillW / 2, pillY + pillH / 2);
      } else if (meta.hasProgress) {
        const cur = meta.getProgress ? meta.getProgress() : 0;
        const max = meta.progressMax || 1;
        const pct = Math.min(100, Math.round((cur / max) * 100));
        ctx.fillStyle = '#fde68a';
        ctx.fillText(`${cur}/${max} (${pct}%)`, pillX + pillW / 2, pillY + pillH / 2);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('◇ LOCKED', pillX + pillW / 2, pillY + pillH / 2);
      }

      // Mini Progress Bar below pill if applicable
      if (!isUnlocked && meta.hasProgress && !isPrereqLocked) {
        const cur = meta.getProgress ? meta.getProgress() : 0;
        const max = meta.progressMax || 1;
        const pct = Math.max(0, Math.min(1, cur / max));
        const barX = pillX;
        const barY = pillY + pillH + 4;
        const barW = pillW;
        const barH = 4;

        ctx.fillStyle = '#0f172a';
        roundRect(ctx, barX, barY, barW, barH, 2);
        ctx.fill();

        ctx.fillStyle = '#f59e0b';
        roundRect(ctx, barX, barY, Math.max(2, Math.round(barW * pct)), barH, 2);
        ctx.fill();
      }

      // Click selection zone for card
      _zones.push({
        id: `card_${k}`,
        x: listX + 6, y: cardY, w: cardW, h: itemH,
        action: () => this.selectKey(k)
      });
    });

    ctx.restore(); // End clipping

    // Scrollbar Track & Thumb
    if (totalContentH > listH) {
      const sbX = listX + listW - 10;
      const sbY = mainY + 4;
      const sbW = 6;
      const sbH = listH - 8;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      roundRect(ctx, sbX, sbY, sbW, sbH, 3);
      ctx.fill();

      const thumbH = Math.max(24, Math.round((listH / totalContentH) * sbH));
      const thumbY = sbY + Math.round((_scrollOffset / (maxScroll || 1)) * (sbH - thumbH));

      ctx.fillStyle = _isDraggingScroll ? '#fde68a' : 'rgba(201, 168, 76, 0.75)';
      roundRect(ctx, sbX, thumbY, sbW, thumbH, 3);
      ctx.fill();

      _zones.push({
        id: 'scrollbar_thumb',
        x: sbX - 4, y: sbY, w: sbW + 8, h: sbH,
        action: () => {} // Handled via drag/pointer
      });
    }

    // ─────────────────────────────────────────────────────────────
    // B. RIGHT COLUMN: INSCRIBED MONOLITH DEED STELE (INSPECTOR)
    // ─────────────────────────────────────────────────────────────
    drawStonePanel(ctx, inspX, mainY, inspW, inspH, { bevelColor: 'gold', chamfer: 8, headerHeight: 0 });

    const selKey = _selectedKey;
    const selectedAch = ACHIEVEMENTS[selKey] || {};
    const meta = ACHIEVEMENT_METADATA[selKey] || {};
    const isUnlocked = !!selectedAch.unlocked;
    const isPrereqLocked = meta.prerequisite && (!ACHIEVEMENTS[meta.prerequisite] || !ACHIEVEMENTS[meta.prerequisite].unlocked);

    // Hero Animated Medallion (56 × 56 px)
    const heroSize = 56;
    const heroCx = inspX + 38;
    const heroCy = mainY + 40;
    drawAchievementIcon(ctx, selKey, heroCx, heroCy, heroSize, isUnlocked, true, _ambientTimer, isReducedMotion);

    // Title & Category in Inspector
    const inspTextX = inspX + 74;
    const inspTextMaxW = inspW - 86;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.fillStyle = isUnlocked ? '#fde047' : '#94a3b8';
    ctx.font = 'bold 8.5px Cinzel, serif';
    ctx.fillText((meta.categoryLabel || 'CITADEL DEED').toUpperCase(), inspTextX, mainY + 14);

    ctx.fillStyle = isUnlocked ? '#ffffff' : '#fca5a5';
    ctx.font = 'bold 12.5px Cinzel, serif';
    ctx.shadowColor = isUnlocked ? 'rgba(245, 158, 11, 0.5)' : 'rgba(220, 38, 38, 0.5)';
    ctx.shadowBlur = 6;

    const inspTitleLines = this.wrapText(ctx, (selectedAch.name || selKey).toUpperCase(), inspTextMaxW);
    inspTitleLines.slice(0, 2).forEach((tl, i) => {
      ctx.fillText(tl, inspTextX, mainY + 28 + i * 15);
    });
    ctx.shadowBlur = 0;

    // Consecration Status Plinth
    const statusY = mainY + 70;
    const statusW = inspW - 24;
    const statusH = 24;
    const statusX = inspX + 12;

    drawStoneCard(ctx, statusX, statusY, statusW, statusH, {
      isHover: false,
      isSelected: isUnlocked,
      accentColor: isUnlocked ? 'emerald' : (isPrereqLocked ? 'crimson' : 'gold'),
      chamfer: 4
    });

    ctx.fillStyle = isUnlocked ? '#86efac' : (isPrereqLocked ? '#fca5a5' : (meta.hasProgress ? '#fde68a' : '#94a3b8'));
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const statusStr = isUnlocked
      ? '✔ DEED CONSECRATED'
      : (isPrereqLocked ? `🔒 SEQUENTIAL TRIAL LOCKED` : (meta.hasProgress ? '◇ TRIAL IN PROGRESS' : '◇ UNACCOMPLISHED TRIAL'));
    ctx.fillText(statusStr, statusX + statusW / 2, statusY + statusH / 2);

    // Inscribed Requirements & Lore Box
    const reqY = statusY + statusH + 10;
    const reqW = inspW - 24;
    const reqX = inspX + 12;

    // Prerequisite Warning Box for Savior Tiers
    if (isPrereqLocked) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.lineWidth = 1;
      roundRect(ctx, reqX, reqY, reqW, 34, 4);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#fca5a5';
      ctx.font = 'bold 8px Cinzel, serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('⚠️ SEQUENTIAL PREREQUISITE REQUIRED', reqX + 8, reqY + 5);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'italic 8px Crimson Text, serif';
      ctx.fillText(`Must unlock ${meta.prereqLabel || 'preceding tier'} before this deed activates.`, reqX + 8, reqY + 18);
    }

    const loreY = isPrereqLocked ? reqY + 40 : reqY;
    ctx.fillStyle = 'rgba(201, 168, 76, 0.9)';
    ctx.font = 'bold 8px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('INSCRIBED REQUIREMENT:', reqX, loreY);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'italic 10px Crimson Text, serif';
    const descLines = this.wrapText(ctx, meta.instruction || selectedAch.desc || '', reqW);
    descLines.slice(0, 4).forEach((dl, idx) => {
      ctx.fillText(dl, reqX, loreY + 15 + idx * 14);
    });

    // Quantitative Progress Section
    const progBoxY = loreY + 15 + Math.min(4, descLines.length) * 14 + 8;
    const progBoxH = (selKey === 'last_witness') ? 104 : 52;

    drawStoneCard(ctx, reqX, progBoxY, reqW, progBoxH, { isHover: false, isSelected: false, chamfer: 4 });

    if (selKey === 'last_witness') {
      // Dedicated 8 Fates Matrix Breakdown
      const m = GameState.COMPLETION_MILESTONES || {};
      const completedFates = EIGHT_FATES.filter(f => !!m[f.key] || (ACHIEVEMENTS[f.achKey] && ACHIEVEMENTS[f.achKey].unlocked)).length;

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('THE 8 CRUCIBLES OF FATE:', reqX + 8, progBoxY + 6);

      ctx.textAlign = 'right';
      ctx.fillStyle = completedFates === 8 ? '#86efac' : '#fde68a';
      ctx.fillText(`${completedFates} / 8 (${Math.round(completedFates / 8 * 100)}%)`, reqX + reqW - 8, progBoxY + 6);

      // 2 columns of 4 fates
      const fateRowH = 16;
      const fateColW = Math.floor((reqW - 20) / 2);
      EIGHT_FATES.forEach((f, fIdx) => {
        const col = fIdx < 4 ? 0 : 1;
        const row = fIdx % 4;
        const fx = reqX + 8 + col * (fateColW + 8);
        const fy = progBoxY + 22 + row * fateRowH;

        const isDone = !!m[f.key] || (ACHIEVEMENTS[f.achKey] && ACHIEVEMENTS[f.achKey].unlocked);
        ctx.fillStyle = isDone ? '#22c55e' : 'rgba(100, 116, 139, 0.4)';
        ctx.fillRect(fx, fy + 3, 6, 6);

        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = isDone ? '#ffffff' : '#94a3b8';
        ctx.fillText(`${f.roman}. ${f.label}`, fx + 10, fy + 1);

        if (isDone) {
          ctx.fillStyle = '#86efac';
          ctx.fillText('✔', fx + fateColW - 12, fy + 1);
        }
      });
    } else if (meta.hasProgress) {
      const curProg = meta.getProgress ? meta.getProgress() : 0;
      const maxProg = meta.progressMax || 1;
      const progPct = Math.min(100, Math.round((curProg / maxProg) * 100));

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`${meta.progressLabel || 'PROGRESS'}:`, reqX + 10, progBoxY + 8);

      ctx.textAlign = 'right';
      ctx.fillStyle = isUnlocked ? '#86efac' : '#fde68a';
      ctx.fillText(`${curProg} / ${maxProg} (${progPct}%)`, reqX + reqW - 10, progBoxY + 8);

      // Track Bar
      const tX = reqX + 10;
      const tY = progBoxY + 24;
      const tW = reqW - 20;
      const tH = 7;

      ctx.fillStyle = '#0f172a';
      roundRect(ctx, tX, tY, tW, tH, 3);
      ctx.fill();

      const fW = Math.max(3, Math.min(tW, Math.round(tW * (progPct / 100))));
      ctx.fillStyle = isUnlocked ? '#22c55e' : (isPrereqLocked ? '#64748b' : '#f59e0b');
      roundRect(ctx, tX, tY, fW, tH, 3);
      ctx.fill();

      ctx.fillStyle = isPrereqLocked ? '#94a3b8' : 'rgba(148, 163, 184, 0.7)';
      ctx.font = 'italic 7px Crimson Text, serif';
      ctx.textAlign = 'left';
      ctx.fillText(isPrereqLocked ? 'Progress locked until prerequisite fulfilled.' : (isUnlocked ? 'Deed fully consecrated in stone.' : 'Progress actively recorded across descents.'), reqX + 10, progBoxY + 37);
    } else {
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('CRUCIBLE RECORD:', reqX + 10, progBoxY + 10);

      ctx.textAlign = 'right';
      ctx.fillStyle = isUnlocked ? '#86efac' : '#94a3b8';
      ctx.fillText(isUnlocked ? '100% (CONSECRATED)' : '0% (UNMET)', reqX + reqW - 10, progBoxY + 10);

      ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
      ctx.font = 'italic 8px Crimson Text, serif';
      ctx.textAlign = 'left';
      ctx.fillText(isUnlocked ? 'Permanently etched in citadel memory.' : 'Fulfill trial conditions to record deed.', reqX + 10, progBoxY + 28);
    }

    // ─────────────────────────────────────────────────────────────
    // BOTTOM BAR: KEYBOARD HINTS & RETURN BUTTON
    // ─────────────────────────────────────────────────────────────
    const botY = panY + panH - 30;
    const retW = 180, retH = 24;
    const retX = panX + panW - 16 - retW;
    const isHoverRet = mouseX >= retX && mouseX <= retX + retW && mouseY >= botY && mouseY <= botY + retH;

    drawStoneButton(ctx, '◈ RETURN [ ESC ]', retX, botY, retW, retH, {
      isHover: isHoverRet,
      isSelected: false,
      variant: 'primary',
      fontSize: '9px Cinzel, serif'
    });

    ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
    ctx.font = '8px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('↑/↓ — Select Deed   ·   Mouse Wheel — Scroll   ·   Tabs — Categories   ·   Esc — Close', panX + 20, botY + 12);

    _zones.push({
      id: 'btn_close',
      x: retX, y: botY, w: retW, h: retH,
      action: closeAchievements
    });

    ctx.restore();
  },

  handleKeyDown(key) {
    if (key === 'Escape') {
      closeAchievements();
      return true;
    }
    const filtered = this.getFilteredKeys();
    const idx = filtered.indexOf(_selectedKey);

    if (key === 'ArrowDown') {
      const nextIdx = (idx + 1) % filtered.length;
      this.selectKey(filtered[nextIdx]);
      return true;
    }
    if (key === 'ArrowUp') {
      const prevIdx = (idx - 1 + filtered.length) % filtered.length;
      this.selectKey(filtered[prevIdx]);
      return true;
    }
    if (key === 'Tab' || key === 'ArrowRight') {
      const catIdx = ACHIEVEMENT_CATEGORIES.findIndex(c => c.id === _activeCategory);
      const nextCat = ACHIEVEMENT_CATEGORIES[(catIdx + 1) % ACHIEVEMENT_CATEGORIES.length];
      this.setCategory(nextCat.id);
      return true;
    }
    if (key === 'ArrowLeft') {
      const catIdx = ACHIEVEMENT_CATEGORIES.findIndex(c => c.id === _activeCategory);
      const prevCat = ACHIEVEMENT_CATEGORIES[(catIdx - 1 + ACHIEVEMENT_CATEGORIES.length) % ACHIEVEMENT_CATEGORIES.length];
      this.setCategory(prevCat.id);
      return true;
    }
    return false;
  },

  handleWheel(deltaY) {
    const listH = 340;
    const filtered = this.getFilteredKeys();
    const itemH = 56;
    const itemGap = 6;
    const totalContentH = filtered.length * (itemH + itemGap) - itemGap;
    const maxScroll = Math.max(0, totalContentH - listH);
    _targetScrollOffset = Math.max(0, Math.min(maxScroll, _targetScrollOffset + deltaY * 0.75));
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

    // Click outside panel closes it
    const panW = Math.min(880, LW - 24), panH = Math.min(580, LH - 24);
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
  window.ACHIEVEMENT_CATEGORIES = ACHIEVEMENT_CATEGORIES;
  window.ORDERED_ACHIEVEMENT_KEYS = ORDERED_ACHIEVEMENT_KEYS;
  window.ACHIEVEMENT_METADATA = ACHIEVEMENT_METADATA;
  window.addEventListener('wheel', (e) => {
    if (GameState.STATE === GameStates.ACHIEVEMENTS) {
      AchievementsUI.handleWheel(e.deltaY);
    }
  }, { passive: true });
}
