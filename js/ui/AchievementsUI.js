// =====================================================================
//  DUNGEON BREAK — js/ui/AchievementsUI.js
//  Authoritative Canvas 2D Achievements Archive Redesign
//  Master-Detail Architecture: Ordered Index + Single Detail Panel + Living Icons
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
  { id: 'all', label: 'ALL', icon: '◈' },
  { id: 'survival', label: 'SURVIVAL', icon: 'ᛟ' },
  { id: 'combat', label: 'COMBAT', icon: '⚔' },
  { id: 'discovery', label: 'DISCOVERY', icon: '✦' },
  { id: 'progression', label: 'PROGRESSION', icon: 'ᛏ' },
  { id: 'endings', label: 'ENDINGS', icon: '♛' },
  { id: 'mastery', label: 'MASTERY', icon: '👁' }
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

// ─────────────────────────────────────────────────────────────────────
// LOCAL STATE
// ─────────────────────────────────────────────────────────────────────

let _slideAnim = 0;
let _scrollOffset = 0;
let _ambientTimer = 0;
let _displayProgress = 0;
let _activeCategory = 'all';
let _selectedKey = 'first_blood';
let _returnState = GameStates.TITLE;

const _zones = [];

export function openAchievements(fromState = null) {
  _slideAnim = 0;
  _scrollOffset = 0;
  _ambientTimer = 0;
  _displayProgress = 0;
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
      SoundManager.snd('menu_select');
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

    // Atmospheric backdrop
    ctx.save();
    ctx.fillStyle = `rgba(2, 4, 10, ${0.85 * eased})`;
    ctx.fillRect(0, 0, LW, LH);

    // Master Panel Geometry: 824x516 centered on 896x640 canvas
    const panW = 824;
    const panH = 516;
    const panX = Math.round((LW - panW) / 2);
    const panY = Math.round((LH - panH) / 2 - (1 - eased) * 35);

    // Outer Panel with Antique Gold Border
    ctx.shadowColor = 'rgba(201, 168, 76, 0.28)';
    ctx.shadowBlur = 24;
    ctx.fillStyle = 'rgba(5, 8, 22, 0.98)';
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.7)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, panX, panY, panW, panH, 12);
    ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;

    // Inner Accent Border
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)';
    ctx.lineWidth = 1;
    roundRect(ctx, panX + 6, panY + 6, panW - 12, panH - 12, 8);
    ctx.stroke();

    _zones.length = 0;
    const mouseX = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.mx : -999;
    const mouseY = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.my : -999;

    // ─────────────────────────────────────────────────────────────
    // 1. HEADER & DYNAMIC OVERALL PROGRESS
    // ─────────────────────────────────────────────────────────────
    ctx.save();
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 18px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = '#d97706';
    ctx.shadowBlur = 10;
    ctx.fillText('ARCHIVES OF ASCENSION', panX + panW / 2, panY + 14);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 11px Crimson Text, serif';
    ctx.fillText('Achievements Archive · Records of Deeds & Fates', panX + panW / 2, panY + 34);
    ctx.restore();

    // Completion Statistics
    const totalCount = ORDERED_ACHIEVEMENT_KEYS.length;
    const unlockedCount = ORDERED_ACHIEVEMENT_KEYS.filter(k => ACHIEVEMENTS[k] && ACHIEVEMENTS[k].unlocked).length;
    const targetPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

    if (isReducedMotion) {
      _displayProgress = targetPct;
    } else {
      _displayProgress += (targetPct - _displayProgress) * Math.min(1, dt * 6.0);
    }
    const currentDisplayPct = Math.round(_displayProgress);

    // Progress bar & label
    const barW = 320;
    const barH = 5;
    const barX = Math.round(panX + (panW - barW) / 2);
    const barY = panY + 49;

    // Track
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.55)';
    ctx.lineWidth = 1;
    roundRect(ctx, barX, barY, barW, barH, 2.5);
    ctx.fill(); ctx.stroke();

    // Fill
    if (_displayProgress > 0) {
      const fillW = Math.max(4, Math.min(barW, barW * (_displayProgress / 100)));
      const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      grad.addColorStop(0, '#d97706');
      grad.addColorStop(0.5, '#f59e0b');
      grad.addColorStop(1, '#fde68a');
      ctx.fillStyle = grad;
      roundRect(ctx, barX, barY, fillW, barH, 2.5);
      ctx.fill();
    }

    // Progress counter text
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`UNLOCKED ${unlockedCount} / ${totalCount}  ( ${currentDisplayPct}% )`, panX + panW / 2, barY + 8);

    // ─────────────────────────────────────────────────────────────
    // 2. CATEGORY NAVIGATION TABS (One Line)
    // ─────────────────────────────────────────────────────────────
    const tabY = panY + 74;
    const tabH = 24;
    const totalTabs = ACHIEVEMENT_CATEGORIES.length;
    const availTabW = panW - 48;
    const tabGap = 6;
    const tabW = Math.floor((availTabW - (totalTabs - 1) * tabGap) / totalTabs);
    const startTabX = panX + 24;

    ACHIEVEMENT_CATEGORIES.forEach((cat, idx) => {
      const tx = startTabX + idx * (tabW + tabGap);
      const isSel = _activeCategory === cat.id;
      const isHover = mouseX >= tx && mouseX <= tx + tabW && mouseY >= tabY && mouseY <= tabY + tabH;

      ctx.save();
      ctx.fillStyle = isSel ? 'rgba(201, 168, 76, 0.26)' : (isHover ? 'rgba(30, 41, 59, 0.8)' : 'rgba(15, 23, 42, 0.6)');
      ctx.strokeStyle = isSel ? '#fde68a' : (isHover ? '#cbd5e1' : 'rgba(71, 85, 105, 0.5)');
      ctx.lineWidth = isSel ? 1.4 : 1.0;
      roundRect(ctx, tx, tabY, tabW, tabH, 4);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = isSel ? '#fde68a' : (isHover ? '#f1f5f9' : '#94a3b8');
      ctx.font = 'bold 9px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Count for category
      const count = (cat.id === 'all')
        ? totalCount
        : ORDERED_ACHIEVEMENT_KEYS.filter(k => ACHIEVEMENT_METADATA[k] && ACHIEVEMENT_METADATA[k].category === cat.id).length;

      ctx.fillText(`${cat.icon} ${cat.label} (${count})`, tx + tabW / 2, tabY + tabH / 2);
      ctx.restore();

      _zones.push({
        id: `cat_${cat.id}`,
        x: tx, y: tabY, w: tabW, h: tabH,
        action: () => this.setCategory(cat.id)
      });
    });

    // ─────────────────────────────────────────────────────────────
    // 3. MAIN CONTENT: LEFT LIST (35.5%) + RIGHT DETAIL (62.9%)
    // ─────────────────────────────────────────────────────────────
    const contentY = tabY + tabH + 10;
    const footerY = panY + panH - 46;
    const contentH = footerY - contentY - 8;

    const leftW = 276;
    const gap = 12;
    const rightX = panX + 24 + leftW + gap;
    const rightW = panW - 48 - leftW - gap;

    // Left List Frame
    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1;
    roundRect(ctx, panX + 24, contentY, leftW, contentH, 6);
    ctx.fill(); ctx.stroke();

    // Right Detail Frame
    ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.45)';
    roundRect(ctx, rightX, contentY, rightW, contentH, 6);
    ctx.fill(); ctx.stroke();

    // ─────────────────────────────────────────────────────────────
    // 3A. LEFT LIST: ORDERED SCROLLABLE ACHIEVEMENT ROWS
    // ─────────────────────────────────────────────────────────────
    const filteredKeys = this.getFilteredKeys();
    const rowH = 46;
    const rowGap = 4;
    const totalListH = filteredKeys.length * (rowH + rowGap);
    const maxScroll = Math.max(0, totalListH - (contentH - 8));
    _scrollOffset = Math.max(0, Math.min(_scrollOffset, maxScroll));

    // Ensure currently selected key is within filtered keys
    if (!filteredKeys.includes(_selectedKey) && filteredKeys.length > 0) {
      _selectedKey = filteredKeys[0];
    }

    const clipX = panX + 26;
    const clipY = contentY + 4;
    const clipW = leftW - 4;
    const clipH = contentH - 8;

    ctx.save();
    ctx.beginPath();
    ctx.rect(clipX, clipY, clipW, clipH);
    ctx.clip();

    filteredKeys.forEach((k, idx) => {
      const a = ACHIEVEMENTS[k] || {};
      const rowX = clipX + 3;
      const rowY = clipY + idx * (rowH + rowGap) - _scrollOffset;

      // Cull items outside clipping bounds
      if (rowY + rowH < clipY || rowY > clipY + clipH) return;

      const isSel = k === _selectedKey;
      const isHover = mouseX >= rowX && mouseX <= rowX + clipW - 6 && mouseY >= rowY && mouseY <= rowY + rowH;

      ctx.save();
      // Row Background
      if (isSel) {
        ctx.fillStyle = 'rgba(201, 168, 76, 0.20)';
        ctx.strokeStyle = '#fde68a';
        ctx.lineWidth = 1.3;
      } else if (isHover) {
        ctx.fillStyle = 'rgba(51, 65, 85, 0.45)';
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
        ctx.lineWidth = 1.0;
      } else {
        ctx.fillStyle = a.unlocked ? 'rgba(30, 41, 59, 0.35)' : 'rgba(15, 23, 42, 0.35)';
        ctx.strokeStyle = a.unlocked ? 'rgba(71, 85, 105, 0.35)' : 'rgba(51, 65, 85, 0.25)';
        ctx.lineWidth = 1.0;
      }
      roundRect(ctx, rowX, rowY, clipW - 10, rowH, 5);
      ctx.fill(); ctx.stroke();

      // Living Pixel-Art Icon (32x32)
      const iconCx = rowX + 22;
      const iconCy = rowY + rowH / 2;
      drawAchievementIcon(ctx, k, iconCx, iconCy, 30, !!a.unlocked, isSel, _ambientTimer, isReducedMotion);

      // Title
      ctx.fillStyle = isSel ? '#fef08a' : (a.unlocked ? '#fde68a' : '#94a3b8');
      ctx.font = 'bold 10.5px Cinzel, serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(a.name || k, rowX + 44, rowY + 9);

      // Status pill badge
      if (a.unlocked) {
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 8px Cinzel, serif';
        ctx.fillText('◈ UNLOCKED', rowX + 44, rowY + 25);
      } else {
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 8px Cinzel, serif';
        ctx.fillText('◇ SEALED', rowX + 44, rowY + 25);
      }

      // Selection chevron indicator
      if (isSel) {
        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 10px Cinzel, serif';
        ctx.textAlign = 'right';
        ctx.fillText('▶', rowX + clipW - 16, rowY + rowH / 2 - 5);
      }

      ctx.restore();

      _zones.push({
        id: `row_${k}`,
        x: rowX, y: rowY, w: clipW - 10, h: rowH,
        action: () => this.selectKey(k)
      });
    });

    ctx.restore(); // end list clip

    // Scrollbar for Left List
    if (maxScroll > 0) {
      const scrollBarX = clipX + clipW - 5;
      const scrollThumbH = Math.max(20, (clipH / totalListH) * clipH);
      const scrollThumbY = clipY + (_scrollOffset / maxScroll) * (clipH - scrollThumbH);

      ctx.fillStyle = 'rgba(51, 65, 85, 0.4)';
      roundRect(ctx, scrollBarX, clipY, 3, clipH, 1.5);
      ctx.fill();

      ctx.fillStyle = 'rgba(201, 168, 76, 0.65)';
      roundRect(ctx, scrollBarX, scrollThumbY, 3, scrollThumbH, 1.5);
      ctx.fill();
    }

    // ─────────────────────────────────────────────────────────────
    // 3B. RIGHT DETAIL: SINGLE FOCUSED ACHIEVEMENT INSPECTOR
    // ─────────────────────────────────────────────────────────────
    const selKey = _selectedKey;
    const a = ACHIEVEMENTS[selKey] || {};
    const meta = ACHIEVEMENT_METADATA[selKey] || {};

    const inspPadX = rightX + 22;
    let inspCurY = contentY + 20;

    // 1. Hero Header: Large Living Pixel-Art Icon + Title + Category
    const heroIconSize = 68;
    const heroIconCx = inspPadX + heroIconSize / 2;
    const heroIconCy = inspCurY + heroIconSize / 2;

    drawAchievementIcon(ctx, selKey, heroIconCx, heroIconCy, heroIconSize, !!a.unlocked, true, _ambientTimer, isReducedMotion);

    const titleX = inspPadX + heroIconSize + 16;
    const titleAvailW = rightW - (heroIconSize + 56);

    // Category Tag
    ctx.save();
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(meta.categoryLabel || 'CITADEL DEED', titleX, inspCurY + 4);

    // Title
    ctx.fillStyle = a.unlocked ? '#fde68a' : '#fca5a5';
    ctx.font = 'bold 15px Cinzel, serif';
    ctx.shadowColor = a.unlocked ? 'rgba(245, 158, 11, 0.4)' : 'rgba(220, 38, 38, 0.3)';
    ctx.shadowBlur = 8;
    ctx.fillText(a.name || selKey, titleX, inspCurY + 18);
    ctx.shadowBlur = 0;

    // Status Pill
    const pillY = inspCurY + 41;
    const pillH = 18;
    const pillW = a.unlocked ? 116 : 98;
    ctx.fillStyle = a.unlocked ? 'rgba(34, 197, 94, 0.22)' : 'rgba(153, 27, 27, 0.35)';
    ctx.strokeStyle = a.unlocked ? 'rgba(34, 197, 94, 0.7)' : 'rgba(220, 38, 38, 0.65)';
    ctx.lineWidth = 1;
    roundRect(ctx, titleX, pillY, pillW, pillH, 4);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = a.unlocked ? '#4ade80' : '#fca5a5';
    ctx.font = 'bold 8.5px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(a.unlocked ? '◈ ACCOMPLISHED' : '◇ SEALED FATE', titleX + pillW / 2, pillY + pillH / 2);
    ctx.restore();

    inspCurY += heroIconSize + 16;

    // Divider Line
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(inspPadX, inspCurY);
    ctx.lineTo(rightX + rightW - 22, inspCurY);
    ctx.stroke();

    inspCurY += 14;

    // 2. Thematic Description Section
    ctx.save();
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('CHRONICLE OF THE DEED', inspPadX, inspCurY);
    inspCurY += 14;

    // Wrapped description
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'italic 12.5px Crimson Text, serif';
    const descText = a.desc || '';
    const descLines = this.wrapText(ctx, descText, rightW - 44);
    descLines.forEach(line => {
      ctx.fillText(line, inspPadX, inspCurY);
      inspCurY += 18;
    });
    ctx.restore();

    inspCurY += 10;

    // 3. Unlock Conditions or Completion Verification
    const boxX = inspPadX;
    const boxW = rightW - 44;

    if (selKey === 'last_witness') {
      // ───────────────────────────────────────────────────────────
      // SPECIAL INLINE BREAKDOWN FOR THE LAST WITNESS (NO POPOVER)
      // ───────────────────────────────────────────────────────────
      const savedMilestones = SaveSystem.getMilestones();
      const deaths = [
        { id: 'death_normal_enemy', label: 'Ordinary Enemy' },
        { id: 'death_gorgaroth', label: 'Gorgaroth' },
        { id: 'death_malakor', label: 'Malakor' },
        { id: 'death_warden', label: 'Abyss Warden' },
        { id: 'death_shattered_mind', label: 'Shattered Mind' }
      ];
      const endings = [
        { id: 'ending_hero', label: 'Hero Ending' },
        { id: 'ending_betrayal', label: 'Betrayal Ending' },
        { id: 'ending_rampage', label: 'Rampage Ending' }
      ];

      const deathsWitnessed = deaths.filter(d => !!savedMilestones[d.id]).length;
      const endingsWitnessed = endings.filter(e => !!savedMilestones[e.id]).length;
      const totalFates = deathsWitnessed + endingsWitnessed;

      const lwBoxH = 138;
      ctx.save();
      ctx.fillStyle = a.unlocked ? 'rgba(234, 179, 8, 0.12)' : 'rgba(220, 38, 38, 0.12)';
      ctx.strokeStyle = a.unlocked ? 'rgba(234, 179, 8, 0.65)' : 'rgba(220, 38, 38, 0.65)';
      ctx.lineWidth = 1.2;
      roundRect(ctx, boxX, inspCurY, boxW, lwBoxH, 6);
      ctx.fill(); ctx.stroke();

      // Header inside box
      ctx.fillStyle = a.unlocked ? '#fde68a' : '#fca5a5';
      ctx.font = 'bold 10px Cinzel, serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('THE EIGHT REQUIRED FATES', boxX + 12, inspCurY + 10);

      // Counts summary line
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 9.5px Cinzel, serif';
      ctx.textAlign = 'right';
      ctx.fillText(`DEATHS: ${deathsWitnessed}/5  ·  ENDINGS: ${endingsWitnessed}/3  ( ${totalFates}/8 )`, boxX + boxW - 12, inspCurY + 10);
      ctx.textAlign = 'left';

      // Group A: Deaths row tags
      let tagY = inspCurY + 28;
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 8px Cinzel, serif';
      ctx.fillText('GROUP A: DEATHS WITNESSED (5)', boxX + 12, tagY);

      tagY += 11;
      const deathPillW = Math.floor((boxW - 24 - (4 * 4)) / 5);
      deaths.forEach((d, i) => {
        const dx = boxX + 12 + i * (deathPillW + 4);
        const done = !!savedMilestones[d.id];
        ctx.fillStyle = done ? 'rgba(34, 197, 94, 0.22)' : 'rgba(51, 65, 85, 0.35)';
        ctx.strokeStyle = done ? 'rgba(34, 197, 94, 0.75)' : 'rgba(71, 85, 105, 0.5)';
        ctx.lineWidth = 1;
        roundRect(ctx, dx, tagY, deathPillW, 16, 3);
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = done ? '#4ade80' : '#64748b';
        ctx.font = 'bold 7px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${done ? '◈' : '◇'} ${d.label}`, dx + deathPillW / 2, tagY + 8);
        ctx.textAlign = 'left';
      });

      // Group B: Endings row tags
      tagY += 21;
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 8px Cinzel, serif';
      ctx.fillText('GROUP B: ENDINGS COMPLETED (3)', boxX + 12, tagY);

      tagY += 11;
      const endingPillW = Math.floor((boxW - 24 - (2 * 6)) / 3);
      endings.forEach((e, i) => {
        const ex = boxX + 12 + i * (endingPillW + 6);
        const done = !!savedMilestones[e.id];
        ctx.fillStyle = done ? 'rgba(34, 197, 94, 0.22)' : 'rgba(51, 65, 85, 0.35)';
        ctx.strokeStyle = done ? 'rgba(34, 197, 94, 0.75)' : 'rgba(71, 85, 105, 0.5)';
        ctx.lineWidth = 1;
        roundRect(ctx, ex, tagY, endingPillW, 16, 3);
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = done ? '#4ade80' : '#64748b';
        ctx.font = 'bold 7.5px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${done ? '◈' : '◇'} ${e.label}`, ex + endingPillW / 2, tagY + 8);
        ctx.textAlign = 'left';
      });

      // Explanation & Status summary
      const expY = tagY + 22;
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'italic 10px Crimson Text, serif';
      ctx.fillText('Witness all five required death outcomes and complete the Hero, Betrayal, and Rampage endings.', boxX + 12, expY);

      ctx.fillStyle = a.unlocked ? '#fef08a' : (totalFates === 7 ? '#f97316' : '#94a3b8');
      ctx.font = 'bold 8.5px Cinzel, serif';
      const statusNote = a.unlocked
        ? '★ All eight fates have been witnessed. The Citadel acknowledges the Last Witness.'
        : `○ ${8 - totalFates} fate(s) remain unwitnessed across the abyss.`;
      ctx.fillText(statusNote, boxX + 12, expY + 14);
      ctx.restore();

    } else if (!a.unlocked) {
      // ───────────────────────────────────────────────────────────
      // LOCKED ACHIEVEMENT: HOW TO UNLOCK & INCREMENTAL PROGRESS
      // ───────────────────────────────────────────────────────────
      const boxH = meta.hasProgress ? 96 : 76;
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.55)';
      ctx.lineWidth = 1;
      roundRect(ctx, boxX, inspCurY, boxW, boxH, 6);
      ctx.fill(); ctx.stroke();

      // Section Title
      ctx.fillStyle = '#fca5a5';
      ctx.font = 'bold 9.5px Cinzel, serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('HOW TO UNLOCK', boxX + 12, inspCurY + 10);

      // Plain language instruction
      ctx.fillStyle = '#f1f5f9';
      ctx.font = '11.5px Crimson Text, serif';
      const instLines = this.wrapText(ctx, meta.instruction || 'Complete this deed within the dungeon.', boxW - 24);
      let curInstY = inspCurY + 26;
      instLines.forEach(l => {
        ctx.fillText(l, boxX + 12, curInstY);
        curInstY += 16;
      });

      // Incremental Progress Bar if supported
      if (meta.hasProgress && meta.getProgress) {
        const curVal = meta.getProgress();
        const maxVal = meta.progressMax || 1;
        const progPct = Math.min(1.0, curVal / maxVal);

        const subBarW = boxW - 24;
        const subBarH = 6;
        const subBarY = curInstY + 6;

        ctx.fillStyle = '#090d16';
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.6)';
        ctx.lineWidth = 1;
        roundRect(ctx, boxX + 12, subBarY, subBarW, subBarH, 3);
        ctx.fill(); ctx.stroke();

        if (progPct > 0) {
          ctx.fillStyle = '#d97706';
          roundRect(ctx, boxX + 12, subBarY, subBarW * progPct, subBarH, 3);
          ctx.fill();
        }

        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 8.5px Cinzel, serif';
        ctx.fillText(`${meta.progressLabel}:  ${curVal} / ${maxVal}`, boxX + 12, subBarY + 9);
      }
      ctx.restore();

    } else {
      // ───────────────────────────────────────────────────────────
      // UNLOCKED ACHIEVEMENT: HONOR ENGRAVED & COMPLETED METRICS
      // ───────────────────────────────────────────────────────────
      const boxH = 74;
      ctx.save();
      ctx.fillStyle = 'rgba(34, 197, 94, 0.08)';
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.55)';
      ctx.lineWidth = 1;
      roundRect(ctx, boxX, inspCurY, boxW, boxH, 6);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#86efac';
      ctx.font = 'bold 9.5px Cinzel, serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('HONOR ENGRAVED', boxX + 12, inspCurY + 10);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'italic 11.5px Crimson Text, serif';
      ctx.fillText('This deed has been permanently engraved into the Citadel archives of Ascension.', boxX + 12, inspCurY + 28);

      if (meta.hasProgress && meta.progressMax) {
        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 9px Cinzel, serif';
        ctx.fillText(`◈ Requirement Fully Satisfied (${meta.progressMax} / ${meta.progressMax})`, boxX + 12, inspCurY + 46);
      } else {
        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 9px Cinzel, serif';
        ctx.fillText('◈ Requirement Genuine and Complete', boxX + 12, inspCurY + 46);
      }
      ctx.restore();
    }

    // ─────────────────────────────────────────────────────────────
    // 4. FOOTER: DEDICATED SOLID PLATE & RETURN BUTTON
    // ─────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(5, 8, 22, 0.98)';
    ctx.fillRect(panX + 24, footerY - 4, panW - 48, 44);

    const closeW = 200;
    const closeH = 32;
    const closeX = Math.round(panX + (panW - closeW) / 2);
    const closeY = footerY + 2;

    const isHoverClose = mouseX >= closeX && mouseX <= closeX + closeW && mouseY >= closeY && mouseY <= closeY + closeH;

    ctx.save();
    ctx.shadowColor = isHoverClose ? 'rgba(201, 168, 76, 0.4)' : 'transparent';
    ctx.shadowBlur = 10;
    ctx.fillStyle = isHoverClose ? 'rgba(201, 168, 76, 0.24)' : 'rgba(30, 41, 59, 0.85)';
    ctx.strokeStyle = isHoverClose ? '#fde68a' : 'rgba(201, 168, 76, 0.55)';
    ctx.lineWidth = 1.4;
    roundRect(ctx, closeX, closeY, closeW, closeH, 6);
    ctx.fill(); ctx.stroke();
    ctx.restore();

    ctx.fillStyle = isHoverClose ? '#fef08a' : '#e2e8f0';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('◈ RETURN  ( ESC )', closeX + closeW / 2, closeY + closeH / 2);

    _zones.push({
      id: 'close_btn',
      x: closeX, y: closeY, w: closeW, h: closeH,
      action: closeAchievements
    });

    ctx.restore(); // end master canvas save
  },

  wrapText(ctx, text, maxW) {
    if (!text) return [];
    const words = text.split(' ');
    const lines = [];
    let curLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const w = words[i];
      const testLine = curLine + ' ' + w;
      if (ctx.measureText(testLine).width <= maxW) {
        curLine = testLine;
      } else {
        lines.push(curLine);
        curLine = w;
      }
    }
    if (curLine) lines.push(curLine);
    return lines;
  },

  handleClick(mx, my) {
    // 1. Check interactive registered zones
    for (const z of _zones) {
      if (mx >= z.x && mx <= z.x + z.w && my >= z.y && my <= z.y + z.h) {
        if (z.action) {
          z.action();
          return true;
        }
      }
    }

    // 2. Consume any clicks inside the master panel bounds (prevent background bleed-through)
    const panW = 824, panH = 516;
    const panX = (LW - panW) / 2, panY = (LH - panH) / 2;
    if (mx >= panX && mx <= panX + panW && my >= panY && my <= panY + panH) {
      return true;
    }

    // 3. Click outside panel returns to previous state
    closeAchievements();
    return true;
  },

  handleWheel(deltaY) {
    _scrollOffset += deltaY * 0.45;
  },

  handleKeyDown(key) {
    if (key === 'Escape') {
      closeAchievements();
      return true;
    }
    return false;
  }
};

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
