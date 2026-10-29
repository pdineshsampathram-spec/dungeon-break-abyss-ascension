// =====================================================================
//  DUNGEON BREAK — js/ui/CinematicArchiveUI.js
//  Dedicated Cinematic Archive ("ARCHIVE OF MEMORIES")
//  Allows players to review unlocked story cutscenes and rewatch them safely.
//  Zero gameplay side-effects during replay.
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, roundRect } from '../core/Constants.js';
import { SoundManager } from '../audio/AudioManager.js';
import { MusicManager } from '../audio/MusicManager.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { CinematicDirector } from '../cinematics/CinematicDirector.js';
import { BossIntros } from '../cinematics/BossIntros.js';
import { GorgarothCinematics } from '../cinematics/GorgarothCinematics.js';
import { WardenDefeatCinematic } from '../cinematics/WardenDefeatCinematic.js';
import { ShatteredMindCinematic } from '../cinematics/ShatteredMindCinematic.js';
import { HeroCinematic } from '../cinematics/HeroCinematic.js';
import { BetrayalCinematic } from '../cinematics/BetrayalCinematic.js';
import { RampageCinematic } from '../cinematics/RampageCinematic.js';
import { LastEmberCinematic } from '../cinematics/LastEmberCinematic.js';
import { CinematicReplayContext } from '../cinematics/CinematicReplayContext.js';
import { InputManager } from '../core/InputManager.js';
import {
  drawStoneButton,
  drawStoneTab,
  drawStonePanel,
  drawStoneCard,
  drawStoneBadge,
  drawCornerBrackets
} from './ButtonArtManager.js?v=2.0';

// ─────────────────────────────────────────────────────────────
// Archive Cinematic Concept Illustrations Preload Cache
// ─────────────────────────────────────────────────────────────
const ARCHIVE_IMAGE_CACHE = {};

export function getArchiveImage(id) {
  if (typeof Image === 'undefined') return null;
  if (!ARCHIVE_IMAGE_CACHE[id]) {
    const img = new Image();
    const entry = { img, loaded: false, error: false };
    img.onload = () => { entry.loaded = true; };
    img.onerror = () => {
      entry.error = true;
      if (id.startsWith('credits_')) {
        const altImg = new Image();
        altImg.onload = () => { entry.img = altImg; entry.loaded = true; entry.error = false; };
        altImg.src = `assets/cinematics/credits/credits_bg_${id.replace('credits_', '')}.jpg`;
      }
    };
    img.src = `assets/cinematics/archive/${id}.jpg`;
    ARCHIVE_IMAGE_CACHE[id] = entry;
  }
  return ARCHIVE_IMAGE_CACHE[id];
}

export function preloadArchiveImages() {
  if (typeof Image === 'undefined') return;
  ARCHIVE_CINEMATICS.forEach(item => {
    getArchiveImage(item.id);
  });
}

// ─────────────────────────────────────────────────────────────
// 12 GENUINE STORY CINEMATICS CATALOGUE
// ─────────────────────────────────────────────────────────────
export const ARCHIVE_CINEMATICS = [
  {
    id: 'the_descent',
    title: 'The Descent',
    subtitle: 'Fall into the Abyssal Void',
    category: 'prologue',
    floor: 'Entrance',
    badge: 'PROLOGUE',
    desc: 'Lord Rowan is severed from the daylight kingdom above, betrayed by deserters and cast down into the primeval stone keep where torchlight dies.',
    hint: 'Witness the opening descent at the start of any new journey.',
    icon: 'descent',
    color: '#38bdf8', // Azure
    startReplay: (onComplete) => {
      CinematicReplayContext.startReplay('the_descent', { onComplete });
    }
  },
  {
    id: 'boss_intro_gorgaroth',
    title: 'Gorgaroth Awakes',
    subtitle: 'The Iron Jailer',
    category: 'bosses',
    floor: 'Floor 3',
    badge: 'BOSS',
    desc: 'Deep within the subterranean arena of the Iron Keep, the chained behemoth awakens, slamming his massive war pillar to block any ascent.',
    hint: 'Descend to Floor 3 and step into Gorgaroth’s arena.',
    icon: 'gorgaroth',
    color: '#f97316', // Orange
    startReplay: (onComplete) => {
      CinematicReplayContext.startReplay('boss_intro_gorgaroth', { onComplete });
    }
  },
  {
    id: 'boss_defeat_gorgaroth',
    title: 'Shattering of Chains',
    subtitle: 'Fall of the Iron Jailer',
    category: 'bosses',
    floor: 'Floor 3',
    badge: 'VICTORY',
    desc: 'The war pillar fractures into rubble. Gorgaroth falls to his knees as his iron cage shatters, granting passage deeper into the abyss.',
    hint: 'Defeat Gorgaroth on Floor 3.',
    icon: 'chains',
    color: '#fbbf24', // Amber
    startReplay: (onComplete) => {
      CinematicReplayContext.startReplay('boss_defeat_gorgaroth', { onComplete });
    }
  },
  {
    id: 'boss_intro_malakor',
    title: 'Shadows of the Void',
    subtitle: 'Arch-Lich Malakor',
    category: 'bosses',
    floor: 'Floor 6',
    badge: 'BOSS',
    desc: 'Hovering silently above the cold flagstones of the Void Sanctum, Arch-Lich Malakor weaves nether rifts to consume the soul of the intruder.',
    hint: 'Descend to Floor 6 and confront Malakor in the Void Sanctum.',
    icon: 'malakor',
    color: '#c084fc', // Purple
    startReplay: (onComplete) => {
      CinematicReplayContext.startReplay('boss_intro_malakor', { onComplete });
    }
  },
  {
    id: 'boss_defeat_malakor',
    title: 'Banishment to Darkness',
    subtitle: 'Fall of the Arch-Lich',
    category: 'bosses',
    floor: 'Floor 6',
    badge: 'VICTORY',
    desc: 'Malakor’s spectral robes dissolve into screaming violet embers as the rift collapses in upon his fractured crown.',
    hint: 'Vanquish Arch-Lich Malakor on Floor 6.',
    icon: 'void',
    color: '#a855f7', // Violet
    startReplay: (onComplete) => {
      CinematicReplayContext.startReplay('boss_defeat_malakor', { onComplete });
    }
  },
  {
    id: 'boss_intro_warden',
    title: 'The Abyss Warden',
    subtitle: 'Avatar of the Absolute',
    category: 'bosses',
    floor: 'Floor 10',
    badge: 'BOSS',
    desc: 'At the floor of the world, the four-winged immortal warden uncurls from the black throne, brandishing the Dreadblade to end the crucible.',
    hint: 'Ascend to the 10th and final floor to confront the Abyss Warden.',
    icon: 'warden',
    color: '#ef4444', // Red
    startReplay: (onComplete) => {
      CinematicReplayContext.startReplay('boss_intro_warden', { onComplete });
    }
  },
  {
    id: 'boss_defeat_warden',
    title: 'Fall of the Sentinel',
    subtitle: 'The Dreadblade Breaks',
    category: 'bosses',
    floor: 'Floor 10',
    badge: 'VICTORY',
    desc: 'The dreadblade falls from the Warden’s grasp and his four wings dissolve into scarlet ash, opening the gateway back to the realm of men.',
    hint: 'Defeat the Abyss Warden in the Floor 10 Throne Hall.',
    icon: 'dreadblade',
    color: '#f43f5e', // Rose
    startReplay: (onComplete) => {
      CinematicReplayContext.startReplay('boss_defeat_warden', { onComplete });
    }
  },
  {
    id: 'shattered_mind',
    title: 'Shattered Mind',
    subtitle: 'Sanity Zero & Void Collapse',
    category: 'abyss',
    floor: 'Psychological',
    badge: 'SANITY 0',
    desc: 'When sanity drains completely, Rowan’s perception of reality fractures. The eye awakens, companions dissolve into ash, and the dungeon is erased.',
    hint: 'Allow Rowan’s sanity to deplete to zero during a descent.',
    icon: 'eye',
    color: '#dc2626', // Crimson Red
    startReplay: (onComplete) => {
      CinematicReplayContext.startReplay('shattered_mind', { onComplete });
    }
  },
  {
    id: 'ending_hero',
    title: 'Dawn Beyond the Abyss',
    subtitle: 'Savior of the Depths',
    category: 'endings',
    floor: 'Ending',
    badge: 'HEROIC',
    desc: 'Rowan leads the survivors out into the golden light of the citadel avenue. Peace reigns, but in a secret chamber, an ominous report is given.',
    hint: 'Conquer Floor 10 with survivors rescued (Saved ≥ 1) and Sanity ≥ 40.',
    icon: 'hero',
    color: '#eab308', // Gold
    startReplay: (onComplete) => {
      CinematicReplayContext.startReplay('ending_hero', { onComplete });
    }
  },
  {
    id: 'ending_betrayal',
    title: 'The Hollow Throne',
    subtitle: 'Whispers of the Absolute',
    category: 'endings',
    floor: 'Ending',
    badge: 'BETRAYAL',
    desc: 'The rescued townsfolk carry fragments of the abyss in their minds. At the King’s whisper, they brand Rowan a monster and strike him down.',
    hint: 'Conquer Floor 10 with survivors rescued (Saved ≥ 1) but Sanity < 40.',
    icon: 'betrayal',
    color: '#9333ea', // Deep Purple
    startReplay: (onComplete) => {
      CinematicReplayContext.startReplay('ending_betrayal', { onComplete });
    }
  },
  {
    id: 'ending_rampage',
    title: 'Uncrowned Abyss King',
    subtitle: 'Path of Blood',
    category: 'endings',
    floor: 'Ending',
    badge: 'RAMPAGE',
    desc: 'Returning alone without witnesses, Rowan massacres the royal vanguard, breaks the throne, and assumes dominion over the dungeon depths.',
    hint: 'Conquer Floor 10 leaving no survivors behind (Saved = 0).',
    icon: 'rampage',
    color: '#b91c1c', // Blood Red
    startReplay: (onComplete) => {
      CinematicReplayContext.startReplay('ending_rampage', { onComplete });
    }
  },
  {
    id: 'epilogue_unmeasured_hour',
    title: 'The Unmeasured Hour',
    subtitle: 'Post-Ending Epilogue',
    category: 'endings',
    floor: 'Epilogue',
    badge: 'CANON',
    desc: 'Beyond the ten floors of the crucible, an ancient subterranean vault reveals the true purpose of the descent: the Absolute’s empirical trial for the one who commands time.',
    hint: 'Genuinely conquer Floor 10 in any of the three Warden endings.',
    icon: 'eye',
    color: '#8b5cf6', // Deep Violet
    startReplay: (onComplete) => {
      CinematicReplayContext.startReplay('epilogue_unmeasured_hour', { onComplete });
    }
  },
  {
    id: 'the_last_ember',
    title: 'The Last Ember',
    subtitle: 'Vision of Hope',
    category: 'special',
    floor: 'Special',
    badge: 'SPECIAL',
    desc: 'A transcendent meditation through the nine chambers of the dungeon, following a falling ember as torchlight and sunrise awaken.',
    hint: 'Receive the creator’s invitation or complete any ending.',
    icon: 'ember',
    color: '#f59e0b', // Amber Flame
    startReplay: (onComplete) => {
      CinematicReplayContext.startReplay('the_last_ember', { onComplete });
    }
  },
  {
    id: 'credits_hero',
    title: 'Credits — Hero Dawn',
    subtitle: 'Dawn Beyond the Abyss',
    category: 'endings',
    floor: 'Ending A',
    badge: 'CREDITS',
    desc: 'The survivor dawn credits sequence. A quiet sunrise on the surface terrace as Rowan leads humanity out of the dark.',
    hint: 'Witness the heroic dawn conclusion beyond the 10th floor.',
    icon: 'hero',
    color: '#eab308',
    startReplay: (onComplete) => {
      CinematicReplayContext.startReplay('credits_hero', { onComplete });
    }
  },
  {
    id: 'credits_betrayal',
    title: 'Credits — Hollow Throne',
    subtitle: 'Solemn Palace Colonnade',
    category: 'endings',
    floor: 'Ending B',
    badge: 'CREDITS',
    desc: 'The solemn cold palace colonnade credits sequence. Royal inquisitors, shadowy bows, and silence beneath ancient banners.',
    hint: 'Witness the betrayal conclusion beyond the 10th floor.',
    icon: 'betrayal',
    color: '#a855f7',
    startReplay: (onComplete) => {
      CinematicReplayContext.startReplay('credits_betrayal', { onComplete });
    }
  },
  {
    id: 'credits_rampage',
    title: 'Credits — Wrath Citadel',
    subtitle: 'The Burning Citadel',
    category: 'endings',
    floor: 'Ending C',
    badge: 'CREDITS',
    desc: 'The apocalyptic burning citadel credits sequence. Firestorms, crumbling gates, and the smoking ruins of the kingdom.',
    hint: 'Witness the wrathful rampage conclusion beyond the 10th floor.',
    icon: 'rampage',
    color: '#ef4444',
    startReplay: (onComplete) => {
      CinematicReplayContext.startReplay('credits_rampage', { onComplete });
    }
  },
  {
    id: 'credits_shattered_mind',
    title: 'Credits — Shattered Mind',
    subtitle: 'The Astral Void',
    category: 'abyss',
    floor: 'Psychological',
    badge: 'CREDITS',
    desc: 'The cosmic astral void credits sequence. Weightless gothic ruins floating in the infinite purple expanse before the celestial eye.',
    hint: 'Allow sanity to fracture completely to zero during a descent.',
    icon: 'eye',
    color: '#c084fc',
    startReplay: (onComplete) => {
      CinematicReplayContext.startReplay('credits_shattered_mind', { onComplete });
    }
  },
  {
    id: 'credits_menu',
    title: 'Credits — Grand Archive',
    subtitle: 'Monumental Gothic Portal',
    category: 'special',
    floor: 'Archive',
    badge: 'CREDITS',
    desc: 'The canonical main menu credits sequence, showcasing the monumental gothic portal and eternal braziers.',
    hint: 'Available from the Title Menu or the Developer Sanctum archive.',
    icon: 'portal',
    color: '#38bdf8',
    startReplay: (onComplete) => {
      CinematicReplayContext.startReplay('credits_menu', { onComplete });
    }
  }
];

// Category filter tabs
const CATEGORIES = [
  { id: 'all', label: 'ALL VISIONS' },
  { id: 'prologue', label: 'PROLOGUE' },
  { id: 'bosses', label: 'BOSSES' },
  { id: 'abyss', label: 'THE ABYSS' },
  { id: 'endings', label: 'ENDINGS' },
  { id: 'special', label: 'SPECIAL' }
];

let _activeCategory = 'all';
let _selectedIndex = 0;
let _scrollOffset = 0;
let _particles = [];
let _clickZones = [];
let _previousState = GameStates.TITLE;

// Initialize atmospheric motes
function _initParticles() {
  if (_particles.length === 0) {
    for (let i = 0; i < 35; i++) {
      _particles.push({
        x: Math.random() * LW,
        y: Math.random() * LH,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -0.15 - Math.random() * 0.35,
        r: 1.0 + Math.random() * 1.8,
        alpha: 0.15 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2
      });
    }
  }
}

export const CinematicArchiveUI = {
  open(fromState = GameStates.TITLE) {
    _previousState = fromState;
    _activeCategory = 'all';
    _selectedIndex = 0;
    _scrollOffset = 0;
    _initParticles();
    preloadArchiveImages();
    GameState.setState(GameStates.CINEMATIC_ARCHIVE);
    try { SoundManager.snd('panel_open'); } catch (e) {}
  },

  close() {
    try { SoundManager.snd('panel_close'); } catch (e) {}
    const target = (_previousState === 'menu' || !_previousState) ? GameStates.TITLE : _previousState;
    GameState.setState(target);
  },

  getFilteredList() {
    if (_activeCategory === 'all') return ARCHIVE_CINEMATICS;
    return ARCHIVE_CINEMATICS.filter(c => c.category === _activeCategory);
  },

  getUnlockedCount() {
    return ARCHIVE_CINEMATICS.filter(c => SaveSystem.isCinematicUnlocked(c.id)).length;
  },

  draw(ctx, dt = 0.016) {
    _clickZones = [];
    _initParticles();

    const mouseX = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.mx : -999;
    const mouseY = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.my : -999;
    const isMouseDown = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.isDown : false;

    // ─────────────────────────────────────────────────────────────
    // 1. Ambient Background (Deep Obsidian & Golden Nebula)
    // ─────────────────────────────────────────────────────────────
    ctx.save();
    const bgGrad = ctx.createLinearGradient(0, 0, 0, LH);
    bgGrad.addColorStop(0, '#040711');
    bgGrad.addColorStop(0.5, '#070c18');
    bgGrad.addColorStop(1, '#02040a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, LW, LH);

    // Subtle background particles
    const F = GameState.F || 0;
    _particles.forEach(p => {
      p.y += p.vy;
      p.x += p.vx;
      if (p.y < -10) p.y = LH + 10;
      if (p.x < -10) p.x = LW + 10;
      if (p.x > LW + 10) p.x = -10;

      const a = p.alpha * (0.6 + 0.4 * Math.sin(F * 0.03 + p.phase));
      ctx.fillStyle = `rgba(251, 191, 36, ${a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Outer subtle gold vignette
    const vig = ctx.createRadialGradient(LW / 2, LH / 2, LH * 0.35, LW / 2, LH / 2, LW * 0.7);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(0, 0, 0, 0.75)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, LW, LH);

    // ─────────────────────────────────────────────────────────────
    // 2. Header Plaque
    // ─────────────────────────────────────────────────────────────
    const unlockedCount = this.getUnlockedCount();
    const totalCount = ARCHIVE_CINEMATICS.length;

    ctx.textAlign = 'left';
    ctx.fillStyle = '#fef08a';
    ctx.font = '700 20px Cinzel, serif';
    ctx.shadowColor = 'rgba(217, 119, 6, 0.6)';
    ctx.shadowBlur = 10;
    ctx.fillText('ARCHIVE OF MEMORIES', 36, 36);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('Preserved Visions from the Deep Trials · Rewatch without altering run fate', 36, 52);

    // Unlock counter badge
    const badgeW = 180;
    const badgeH = 28;
    const badgeX = LW - 36 - badgeW;
    const badgeY = 22;

    drawStoneBadge(ctx, `${unlockedCount} / ${totalCount} VISIONS UNLOCKED`, badgeX, badgeY, badgeW, badgeH, {
      variant: unlockedCount === totalCount ? 'gold' : 'purple',
      pulse: false
    });

    // ─────────────────────────────────────────────────────────────
    // 3. Category Filter Tabs
    // ─────────────────────────────────────────────────────────────
    const tabY = 68;
    let tabX = 36;
    const tabH = 26;

    CATEGORIES.forEach(cat => {
      const isCur = cat.id === _activeCategory;
      const count = cat.id === 'all'
        ? ARCHIVE_CINEMATICS.length
        : ARCHIVE_CINEMATICS.filter(c => c.category === cat.id).length;
      const label = `${cat.label} (${count})`;

      ctx.font = '600 10px Cinzel, serif';
      const textW = ctx.measureText(label).width;
      const curTabW = Math.max(textW + 24, 82);
      const isHover = mouseX >= tabX && mouseX <= tabX + curTabW && mouseY >= tabY && mouseY <= tabY + tabH;

      drawStoneTab(ctx, label, tabX, tabY, curTabW, tabH, {
        isHover,
        isSelected: isCur,
        fontSize: 9.5,
        cornerSize: 4
      });

      _clickZones.push({
        type: 'tab',
        id: cat.id,
        x: tabX,
        y: tabY,
        w: curTabW,
        h: tabH
      });

      tabX += curTabW + 8;
    });

    // ─────────────────────────────────────────────────────────────
    // 4. Two-Column Layout (List on Left, Detailed Preview on Right)
    // ─────────────────────────────────────────────────────────────
    const contentY = 104;
    const contentH = LH - contentY - 48; // Leave room for footer
    const leftColW = Math.round(LW * 0.44);
    const rightColX = leftColW + 48;
    const rightColW = LW - rightColX - 36;

    const filtered = this.getFilteredList();
    if (_selectedIndex >= filtered.length) _selectedIndex = Math.max(0, filtered.length - 1);

    // LEFT COLUMN: Scrollable Memory Cards
    const itemH = 50;
    const itemGap = 6;
    const visibleCount = Math.floor(contentH / (itemH + itemGap));
    const maxScroll = Math.max(0, filtered.length - visibleCount);
    _scrollOffset = Math.max(0, Math.min(_scrollOffset, maxScroll));

    for (let i = 0; i < visibleCount; i++) {
      const idx = _scrollOffset + i;
      if (idx >= filtered.length) break;

      const item = filtered[idx];
      const isSelected = idx === _selectedIndex;
      const isUnlocked = SaveSystem.isCinematicUnlocked(item.id);
      const cardY = contentY + i * (itemH + itemGap);
      const cardX = 36;
      const cardW = leftColW - 36;
      const isHover = mouseX >= cardX && mouseX <= cardX + cardW && mouseY >= cardY && mouseY <= cardY + itemH;

      // Card Background using drawStoneCard
      drawStoneCard(ctx, cardX, cardY, cardW, itemH, {
        isHover,
        isSelected,
        cornerSize: 4,
        glowColor: isSelected ? '#f59e0b' : (isUnlocked ? null : 'rgba(51, 65, 85, 0.4)')
      });

      // Status Icon
      ctx.textAlign = 'center';
      if (isUnlocked) {
        ctx.fillStyle = item.color || '#fbbf24';
        ctx.font = '16px serif';
        ctx.fillText('◉', 54, cardY + 31);
      } else {
        ctx.fillStyle = '#64748b';
        ctx.font = '13px serif';
        ctx.fillText('🔒', 54, cardY + 31);
      }

      // Title & Subtitle
      ctx.textAlign = 'left';
      ctx.font = isSelected ? '700 13px Cinzel, serif' : '600 12px Cinzel, serif';
      ctx.fillStyle = isUnlocked ? (isSelected ? '#fef08a' : '#f1f5f9') : '#64748b';
      ctx.fillText(item.title, 74, cardY + 22);

      ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = isUnlocked ? '#94a3b8' : '#475569';
      ctx.fillText(isUnlocked ? item.subtitle : 'Sealed Memory', 74, cardY + 39);

      // Category / Floor Badge
      ctx.textAlign = 'right';
      ctx.font = '600 9px Cinzel, serif';
      ctx.fillStyle = isUnlocked ? 'rgba(251, 191, 36, 0.75)' : 'rgba(100, 116, 139, 0.5)';
      ctx.fillText(item.badge || item.floor, leftColW - 14, cardY + 22);

      _clickZones.push({
        type: 'item',
        index: idx,
        x: cardX,
        y: cardY,
        w: cardW,
        h: itemH
      });
    }

    // RIGHT COLUMN: Detailed Memory Card
    const curItem = filtered[_selectedIndex];
    if (curItem) {
      const isUnlocked = SaveSystem.isCinematicUnlocked(curItem.id);

      // Container Panel using drawStonePanel
      drawStonePanel(ctx, rightColX, contentY, rightColW, contentH, { cornerSize: 6, elevation: 2 });
      drawCornerBrackets(ctx, rightColX, contentY, rightColW, contentH, 10, '#d97706');

      // Top Header inside Card
      ctx.textAlign = 'left';
      ctx.font = '700 17px Cinzel, serif';
      ctx.fillStyle = isUnlocked ? '#fef08a' : '#94a3b8';
      ctx.fillText(curItem.title, rightColX + 20, contentY + 32);

      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = isUnlocked ? '#cbd5e1' : '#64748b';
      ctx.fillText(curItem.subtitle, rightColX + 20, contentY + 49);

      // Floor & Tag badge
      ctx.textAlign = 'right';
      ctx.font = '700 10px Cinzel, serif';
      ctx.fillStyle = curItem.color || '#fbbf24';
      ctx.fillText(`[ ${curItem.floor.toUpperCase()} · ${curItem.badge} ]`, rightColX + rightColW - 20, contentY + 32);

      // Scene Vignette / Preview Frame
      const prevX = rightColX + 20;
      const prevY = contentY + 64;
      const prevW = rightColW - 40;
      const prevH = 145;

      drawStoneCard(ctx, prevX - 2, prevY - 2, prevW + 4, prevH + 4, { cornerSize: 4, inset: true });
      this._drawThumbnailVignette(ctx, curItem, isUnlocked, prevX, prevY, prevW, prevH);

      // Synopsis Header & Body
      const descY = prevY + prevH + 20;
      ctx.textAlign = 'left';
      ctx.font = '700 11px Cinzel, serif';
      ctx.fillStyle = '#ca8a04';
      ctx.fillText('LORE CHRONICLE', prevX, descY);

      ctx.font = '12px "Crimson Text", Georgia, serif';
      ctx.fillStyle = isUnlocked ? '#e2e8f0' : '#64748b';

      const descLines = this._wrapText(ctx, isUnlocked ? curItem.desc : 'This vision remains sealed beneath the weight of the Abyss. It cannot be recalled until Rowan witnesses the event during a descent.', prevW);
      descLines.forEach((l, idx) => {
        ctx.fillText(l, prevX, descY + 18 + idx * 17);
      });

      // Unlock Criteria / Hint
      const hintY = descY + 70;
      ctx.font = '700 10px Cinzel, serif';
      ctx.fillStyle = isUnlocked ? '#38bdf8' : '#eab308';
      ctx.fillText(isUnlocked ? '✓ WITNESSED IN TRIAL' : 'HOW TO UNLOCK', prevX, hintY);

      ctx.font = 'italic 11px "Crimson Text", Georgia, serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(curItem.hint, prevX, hintY + 16);

      // Action Button: Rewatch Vision
      const btnW = prevW;
      const btnH = 38;
      const btnX = prevX;
      const btnY = contentY + contentH - 52;
      const isBtnHover = mouseX >= btnX && mouseX <= btnX + btnW && mouseY >= btnY && mouseY <= btnY + btnH;
      const isBtnPressed = isBtnHover && isMouseDown;

      if (isUnlocked) {
        drawStoneButton(ctx, '▶  REWATCH VISION', btnX, btnY, btnW, btnH, {
          isHover: isBtnHover,
          isPressed: isBtnPressed,
          isSelected: false,
          variant: 'primary',
          fontSize: 11.5,
          cornerSize: 4
        });

        _clickZones.push({
          type: 'action',
          item: curItem,
          x: btnX,
          y: btnY,
          w: btnW,
          h: btnH
        });
      } else {
        drawStoneButton(ctx, '🔒  VISION SEALED IN DARKNESS', btnX, btnY, btnW, btnH, {
          isHover: false,
          isPressed: false,
          isSelected: false,
          variant: 'normal',
          fontSize: 10.5,
          cornerSize: 4
        });
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 5. Footer Navigation
    // ─────────────────────────────────────────────────────────────
    const footY = LH - 18;
    const backBtnW = 180;
    const backBtnH = 28;
    const backBtnX = 36;
    const backBtnY = LH - 38;
    const isBackHover = mouseX >= backBtnX && mouseX <= backBtnX + backBtnW && mouseY >= backBtnY && mouseY <= backBtnY + backBtnH;
    const isBackPressed = isBackHover && isMouseDown;

    drawStoneButton(ctx, 'ESC · RETURN TO TITLE', backBtnX, backBtnY, backBtnW, backBtnH, {
      isHover: isBackHover,
      isPressed: isBackPressed,
      isSelected: false,
      variant: 'normal',
      fontSize: 9.5,
      cornerSize: 4
    });

    _clickZones.push({
      type: 'back',
      x: backBtnX,
      y: backBtnY,
      w: backBtnW,
      h: backBtnH
    });

    // Control hint right
    ctx.textAlign = 'right';
    ctx.fillStyle = '#64748b';
    ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('↑/↓ or W/S: Navigate · Enter / Click: Rewatch · Esc: Return', LW - 36, footY);

    ctx.restore();
  },

  // Authentic Dark Fantasy Scene Thumbnail Vignette for the inspection card
  _drawThumbnailVignette(ctx, item, isUnlocked, x, y, w, h) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    // Base background: deep abyssal obsidian stone
    const bg = ctx.createLinearGradient(x, y, x, y + h);
    bg.addColorStop(0, '#0a0d18');
    bg.addColorStop(0.5, '#060810');
    bg.addColorStop(1, '#020306');
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);

    const animTime = performance.now() * 0.001;
    const cx = x + w / 2;
    const cy = y + h / 2;

    if (isUnlocked) {
      // 1. Check if the high-fidelity cinematic concept image is preloaded
      const entry = getArchiveImage(item.id);
      let drewImage = false;

      if (entry && entry.loaded && entry.img.naturalWidth > 0) {
        try {
          const img = entry.img;
          const imgRatio = img.naturalWidth / img.naturalHeight;
          const boxRatio = w / h;
          let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;

          if (imgRatio > boxRatio) {
            sw = img.naturalHeight * boxRatio;
            sx = (img.naturalWidth - sw) / 2;
          } else {
            sh = img.naturalWidth / boxRatio;
            sy = (img.naturalHeight - sh) / 2;
          }

          ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
          drewImage = true;
        } catch (e) {
          drewImage = false;
        }
      }

      if (drewImage) {
        // Overlay atmospheric dark fantasy vignette & stone depth
        const edgeGrad = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.45, cx, cy, Math.max(w, h) * 0.78);
        edgeGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        edgeGrad.addColorStop(0.65, 'rgba(3, 5, 12, 0.35)');
        edgeGrad.addColorStop(1, 'rgba(2, 3, 8, 0.85)');
        ctx.fillStyle = edgeGrad;
        ctx.fillRect(x, y, w, h);

        // Subtle color mood wash matching cinematic theme
        if (item.color) {
          ctx.fillStyle = item.color;
          ctx.globalAlpha = 0.06;
          ctx.fillRect(x, y, w, h);
          ctx.globalAlpha = 1.0;
        }

        // Drifting ember particles for living dungeon atmosphere
        const emberPulse = Math.sin(animTime * 3.0) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(251, 191, 36, ${0.4 * emberPulse})`;
        for (let i = 0; i < 4; i++) {
          const ex = x + 20 + ((animTime * 25 + i * 90) % (w - 40));
          const ey = y + h - 15 - ((animTime * 18 + i * 35) % (h - 30));
          ctx.fillRect(ex, ey, 1.5, 1.5);
        }
      } else {
        // Fallback: Authentic Dark Fantasy Dungeon Architecture (Zero flat shapes, Zero emojis)
        ctx.fillStyle = '#080c16';
        ctx.fillRect(x, y, w, h);

        // Gothic stone arches
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.65)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, y + h, w * 0.42, Math.PI, 0);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
        ctx.beginPath();
        ctx.arc(cx, y + h, w * 0.32, Math.PI, 0);
        ctx.stroke();

        // Warm torchlight glow from ancient wall sconce
        const fPulse = Math.sin(animTime * 5.0) * 0.15 + 0.85;
        const torchGrad = ctx.createRadialGradient(cx, cy - 10, 4, cx, cy - 10, w * 0.45);
        torchGrad.addColorStop(0, `rgba(245, 158, 11, ${0.45 * fPulse})`);
        torchGrad.addColorStop(0.5, `rgba(217, 119, 6, ${0.15 * fPulse})`);
        torchGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = torchGrad;
        ctx.fillRect(x, y, w, h);

        // Rowan silhouette in reflection facing the abyss
        ctx.fillStyle = '#020408';
        ctx.fillRect(cx - 5, y + h - 34, 10, 24);
        ctx.beginPath();
        ctx.arc(cx, y + h - 38, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Billowing red cape in the dark
        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.moveTo(cx - 3, y + h - 35);
        ctx.lineTo(cx - 16, y + h - 18);
        ctx.lineTo(cx - 12, y + h - 12);
        ctx.lineTo(cx - 2, y + h - 22);
        ctx.closePath();
        ctx.fill();

        // Drawn vanguard broadsword
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx + 3, y + h - 28);
        ctx.lineTo(cx + 18, y + h - 20);
        ctx.stroke();

        // Cinematic Vision Title Watermark
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(254, 240, 138, 0.7)';
        ctx.font = '700 12px Cinzel, serif';
        ctx.fillText(item.title.toUpperCase(), cx, y + 26);

        ctx.font = 'italic 10px "Crimson Text", Georgia, serif';
        ctx.fillStyle = 'rgba(203, 213, 225, 0.6)';
        ctx.fillText(item.subtitle, cx, y + 42);
      }
    } else {
      // 2. Authentic Sealed Vision: Carved Dark Stone Chamber with Heavy Crossed Chains & Ancient Rune Seal
      ctx.fillStyle = '#05070e';
      ctx.fillRect(x, y, w, h);

      // Deep stone brick texture joints
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
      ctx.lineWidth = 1;
      for (let ly = y + 20; ly < y + h; ly += 24) {
        ctx.beginPath();
        ctx.moveTo(x, ly);
        ctx.lineTo(x + w, ly);
        ctx.stroke();
      }

      // Swirling cold shadow fog
      const fogGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, w * 0.45);
      fogGrad.addColorStop(0, 'rgba(15, 23, 42, 0.55)');
      fogGrad.addColorStop(1, 'rgba(2, 4, 10, 0.95)');
      ctx.fillStyle = fogGrad;
      ctx.fillRect(x, y, w, h);

      // Heavy forged iron chains crossed diagonally
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.45)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x + 10, y + 10);
      ctx.lineTo(x + w - 10, y + h - 10);
      ctx.moveTo(x + w - 10, y + 10);
      ctx.lineTo(x + 10, y + h - 10);
      ctx.stroke();

      // Chain highlight links
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 10, y + 10);
      ctx.lineTo(x + w - 10, y + h - 10);
      ctx.moveTo(x + w - 10, y + 10);
      ctx.lineTo(x + 10, y + h - 10);
      ctx.stroke();

      // Ancient stone seal medallion in center
      const sealGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 28);
      sealGrad.addColorStop(0, '#1e293b');
      sealGrad.addColorStop(0.8, '#0f172a');
      sealGrad.addColorStop(1, '#020617');
      ctx.fillStyle = sealGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.fill();

      // Bronze runic border
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.55)';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Carved lock keyhole glyph
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.arc(cx, cy - 4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - 3, cy - 2);
      ctx.lineTo(cx + 3, cy - 2);
      ctx.lineTo(cx + 4.5, cy + 8);
      ctx.lineTo(cx - 4.5, cy + 8);
      ctx.closePath();
      ctx.fill();

      // Sealed Memory Label
      ctx.textAlign = 'center';
      ctx.font = '700 11px Cinzel, serif';
      ctx.fillStyle = 'rgba(203, 213, 225, 0.7)';
      ctx.fillText('✦ VISION SEALED IN DARKNESS ✦', cx, cy + 38);

      ctx.font = 'italic 10px "Crimson Text", Georgia, serif';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
      ctx.fillText('Conquer the trial in your descent to awaken this memory', cx, cy + 52);
    }

    // Inner bevel & carved stone trim
    ctx.strokeStyle = isUnlocked ? 'rgba(217, 119, 6, 0.5)' : 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    ctx.restore();
  },

  _wrapText(ctx, text, maxW) {
    if (!text) return [];
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    words.forEach(w => {
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > maxW) {
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
    if (GameState.STATE !== GameStates.CINEMATIC_ARCHIVE) return false;
    const filtered = this.getFilteredList();

    if (key === 'Escape' || key === 'Esc') {
      this.close();
      return true;
    }

    if (key === 'ArrowUp' || key === 'KeyW' || key === 'w' || key === 'W') {
      if (_selectedIndex > 0) {
        _selectedIndex--;
        if (_selectedIndex < _scrollOffset) _scrollOffset = _selectedIndex;
        SoundManager.snd('menu_hover');
      }
      return true;
    }

    if (key === 'ArrowDown' || key === 'KeyS' || key === 's' || key === 'S') {
      if (_selectedIndex < filtered.length - 1) {
        _selectedIndex++;
        const visibleCount = 6;
        if (_selectedIndex >= _scrollOffset + visibleCount) {
          _scrollOffset = _selectedIndex - visibleCount + 1;
        }
        SoundManager.snd('menu_hover');
      }
      return true;
    }

    if (key === 'ArrowLeft' || key === 'KeyA' || key === 'a' || key === 'A') {
      const curCatIdx = CATEGORIES.findIndex(c => c.id === _activeCategory);
      const nextCatIdx = (curCatIdx - 1 + CATEGORIES.length) % CATEGORIES.length;
      _activeCategory = CATEGORIES[nextCatIdx].id;
      _selectedIndex = 0;
      _scrollOffset = 0;
      SoundManager.snd('menu_hover');
      return true;
    }

    if (key === 'ArrowRight' || key === 'KeyD' || key === 'd' || key === 'D') {
      const curCatIdx = CATEGORIES.findIndex(c => c.id === _activeCategory);
      const nextCatIdx = (curCatIdx + 1) % CATEGORIES.length;
      _activeCategory = CATEGORIES[nextCatIdx].id;
      _selectedIndex = 0;
      _scrollOffset = 0;
      SoundManager.snd('menu_hover');
      return true;
    }

    if (key === 'Enter' || key === ' ' || key === 'Space') {
      const item = filtered[_selectedIndex];
      if (item && SaveSystem.isCinematicUnlocked(item.id)) {
        this.startReplay(item);
      } else {
        SoundManager.snd('menu_select');
      }
      return true;
    }

    return true;
  },

  handleClick(mx, my) {
    if (GameState.STATE !== GameStates.CINEMATIC_ARCHIVE) return false;

    for (const z of _clickZones) {
      if (mx >= z.x && mx <= z.x + z.w && my >= z.y && my <= z.y + z.h) {
        if (z.type === 'tab') {
          _activeCategory = z.id;
          _selectedIndex = 0;
          _scrollOffset = 0;
          SoundManager.snd('menu_hover');
          return true;
        }
        if (z.type === 'item') {
          _selectedIndex = z.index;
          SoundManager.snd('menu_hover');
          return true;
        }
        if (z.type === 'action') {
          this.startReplay(z.item);
          return true;
        }
        if (z.type === 'back') {
          this.close();
          return true;
        }
      }
    }
    return true;
  },

  handleWheel(deltaY) {
    if (GameState.STATE !== GameStates.CINEMATIC_ARCHIVE) return;
    const filtered = this.getFilteredList();
    const visibleCount = 6;
    const maxScroll = Math.max(0, filtered.length - visibleCount);
    if (maxScroll > 0) {
      if (typeof this._wheelAcc !== 'number') this._wheelAcc = 0;
      this._wheelAcc += deltaY;
      const threshold = 32;
      if (Math.abs(this._wheelAcc) >= threshold) {
        const steps = Math.trunc(this._wheelAcc / threshold);
        this._wheelAcc -= steps * threshold;
        const nextOffset = Math.max(0, Math.min(maxScroll, _scrollOffset + steps));
        if (nextOffset !== _scrollOffset) {
          _scrollOffset = nextOffset;
          SoundManager.snd('menu_hover');
        }
      }
    }
  },

  startReplay(item) {
    if (!item) return;
    if (!SaveSystem.isCinematicUnlocked(item.id)) {
      console.warn(`[CinematicArchive] Attempted to rewatch locked vision: ${item.id}`);
      return;
    }

    console.log(`[CinematicArchive] Starting safe presentation-only replay: ${item.id}`);
    SoundManager.snd('menu_select');

    CinematicReplayContext.startReplay(item.id, {
      onComplete: () => {
        this.open(_previousState);
      }
    });
  }
};

if (typeof window !== 'undefined') {
  window.CinematicArchiveUI = CinematicArchiveUI;
  window.addEventListener('wheel', (e) => {
    if (GameState.STATE === GameStates.CINEMATIC_ARCHIVE) {
      CinematicArchiveUI.handleWheel(e.deltaY);
    }
  }, { passive: true });
}
