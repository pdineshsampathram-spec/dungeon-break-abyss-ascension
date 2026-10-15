// =====================================================================
//  DUNGEON BREAK — js/ui/CodexUI.js
//  Authoritative Grand Archive of the Abyss: Chronicles, Bestiary & Memories
//  100% In-Game Renderers, Zero Emojis, Zero Placeholders
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, roundRect } from '../core/Constants.js';
import { BESTIARY_INFO } from '../data/enemies.js';
import { LORE_SCROLLS_DATA, isLoreUnlocked } from '../data/lore.js';
import { STORY_MEMORIES, isMemoryUnlocked } from '../data/memories.js';
import { BestiaryPortraitRenderer } from '../rendering/BestiaryPortraitRenderer.js';
import { SoundManager } from '../audio/AudioManager.js';
import { InputManager } from '../core/InputManager.js';
import { SaveSystem } from '../systems/SaveSystem.js';

let _codexSlide = 0;
let _activeTab = 'lore'; // 'lore' | 'bestiary' | 'memories'
let _selectedIndex = 0;
let _scrollOffset = 0;
let _ambientTimer = 0;

const _zones = [];

let _lastSelectedMemId = null;
let _memoryTransition = 1.0;

// Authentic 5x7 procedural pixel glyphs for ancient abyssal inscriptions
const ANCIENT_GLYPHS = [
  [0b00100, 0b01110, 0b00100, 0b11111, 0b00100, 0b01110, 0b10001], // 0: Obelisk with crossbar
  [0b01110, 0b10001, 0b10101, 0b11111, 0b10101, 0b10001, 0b01110], // 1: Eye of the deep
  [0b00100, 0b00110, 0b01100, 0b00100, 0b01110, 0b10101, 0b10001], // 2: Fractured spire
  [0b10001, 0b11011, 0b01110, 0b00100, 0b01110, 0b11011, 0b10001], // 3: Twin crescent
  [0b10101, 0b10101, 0b11111, 0b00100, 0b00100, 0b01110, 0b10001], // 4: Trident of void
  [0b11111, 0b01110, 0b00100, 0b01110, 0b11111, 0b00100, 0b01110], // 5: Hourglass / nexus
  [0b11111, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001], // 6: Abyssal gate
  [0b00100, 0b01010, 0b10001, 0b00000, 0b10001, 0b01010, 0b00100], // 7: Broken chevron
  [0b10101, 0b11111, 0b01110, 0b00100, 0b01110, 0b10001, 0b11111], // 8: Crown of thorns
  [0b00111, 0b01000, 0b01110, 0b00010, 0b11100, 0b00100, 0b00100], // 9: Tendril rune
  [0b00100, 0b01110, 0b11011, 0b10101, 0b11011, 0b01110, 0b00100], // 10: Diamond core
  [0b11011, 0b01010, 0b00100, 0b01010, 0b10101, 0b01010, 0b11011], // 11: Sigil of dissolution
  [0b11111, 0b00100, 0b01110, 0b00100, 0b00100, 0b00100, 0b11111], // 12: Pillar of ash
  [0b01110, 0b10001, 0b00111, 0b01001, 0b01111, 0b00001, 0b11110], // 13: Spiral fragment
  [0b01110, 0b11111, 0b11001, 0b11001, 0b11111, 0b01110, 0b00000], // 14: Eclipse
  [0b00100, 0b01110, 0b11111, 0b10101, 0b11111, 0b01110, 0b00100]  // 15: The Absolute sigil
];

export function openCodex() {
  _codexSlide = 0;
  _scrollOffset = 0;
  _selectedIndex = 0;
  _memoryTransition = 1.0;
  _lastSelectedMemId = null;
  GameState.setState(GameStates.CODEX);
  SoundManager.snd('panel_open');
}

export function closeCodex() {
  SoundManager.snd('panel_close');
  GameState.setState(GameStates.TITLE);
}

export function openLoreModal(scroll) {
  GameState.ACTIVE_LORE_MODAL = scroll;
}

export const CodexUI = {
  _zones,
  getTab() {
    return _activeTab;
  },
  setTab(tab) {
    _activeTab = tab;
    _selectedIndex = 0;
    _scrollOffset = 0;
    _memoryTransition = 0;
  },
  selectIndex(idx) {
    _selectedIndex = idx;
    _memoryTransition = 0;
  },
  handleWheel(deltaY) {
    _scrollOffset = Math.max(0, _scrollOffset + (deltaY > 0 ? 30 : -30));
  },

  draw(ctx, dt = 0.016) {
    _codexSlide = Math.min(1, _codexSlide + dt * 6.0);
    _ambientTimer += dt;
    _memoryTransition = Math.min(1, _memoryTransition + dt * 6.0);
    const eased = 1 - Math.pow(1 - _codexSlide, 3);

    ctx.save();
    ctx.fillStyle = `rgba(2, 4, 10, ${0.85 * eased})`;
    ctx.fillRect(0, 0, LW, LH);

    const panW = 820;
    const panH = 510;
    const panX = Math.round((LW - panW) / 2);
    const panY = Math.round((LH - panH) / 2 - (1 - eased) * 35);

    // Outer Panel
    ctx.shadowColor = 'rgba(201, 168, 76, 0.25)';
    ctx.shadowBlur = 24;
    ctx.fillStyle = 'rgba(5, 8, 22, 0.98)';
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.65)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, panX, panY, panW, panH, 12);
    ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;

    // Inner Border
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)';
    ctx.lineWidth = 1;
    roundRect(ctx, panX + 6, panY + 6, panW - 12, panH - 12, 8);
    ctx.stroke();

    _zones.length = 0;
    const mouseX = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.mx : -999;
    const mouseY = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.my : -999;

    // Header Title
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 18px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = '#d97706';
    ctx.shadowBlur = 10;
    ctx.fillText('◈ THE GRAND ARCHIVE OF THE ABYSS ◈', panX + panW / 2, panY + 16);
    ctx.shadowBlur = 0;

    // Dynamic Discovery Statistics
    const unlockedLore = GameState.UNLOCKED_LORE || {};
    const unlockedMem = GameState.UNLOCKED_MEMORIES || {};
    const killsMap = GameState.BESTIARY_KILLS || {};

    // Filter principal floor chronicles (1-10) for primary count
    const principalLore = LORE_SCROLLS_DATA.filter(l => l.floor >= 1 && l.floor <= 10 && l.revealedAt !== 'legacy');
    const loreCount = principalLore.filter(l => isLoreUnlocked(l.id)).length;
    const totalLore = principalLore.length;
    const loreComplete = loreCount >= totalLore;

    const isEntryDiscovered = (b) => {
      if (b.isSecret || b.id === 'absolute') {
        return SaveSystem.isSecretBestiaryUnlocked(b.id);
      }
      return (killsMap[b.id] || 0) > 0;
    };
    const bestiaryCount = BESTIARY_INFO.filter(isEntryDiscovered).length;
    const totalBestiary = BESTIARY_INFO.length;
    const bestiaryComplete = bestiaryCount >= totalBestiary;

    const memCount = STORY_MEMORIES.filter(m => isMemoryUnlocked(m.id)).length;
    const totalMem = STORY_MEMORIES.length;
    const memComplete = memCount >= totalMem;

    // Category Tabs Header
    const tabY = panY + 44, tabH = 30;
    const tabs = [
      { id: 'lore', label: `CHRONICLES (${loreCount}/${totalLore})`, complete: loreComplete, icon: '◈' },
      { id: 'bestiary', label: `BESTIARY (${bestiaryCount}/${totalBestiary})`, complete: bestiaryComplete, icon: 'ᛟ' },
      { id: 'memories', label: `MEMORIES (${memCount}/${totalMem})`, complete: memComplete, icon: '✦' }
    ];
    const tabW = 220;
    const startTabX = panX + (panW - (tabs.length * (tabW + 8) - 8)) / 2;

    tabs.forEach((t, idx) => {
      const tx = startTabX + idx * (tabW + 8);
      const isSel = _activeTab === t.id;
      const isHover = mouseX >= tx && mouseX <= tx + tabW && mouseY >= tabY && mouseY <= tabY + tabH;

      ctx.fillStyle = isSel ? 'rgba(201, 168, 76, 0.28)' : isHover ? 'rgba(30, 41, 59, 0.8)' : 'rgba(15, 23, 42, 0.6)';
      ctx.strokeStyle = isSel ? '#fde68a' : t.complete ? 'rgba(234, 179, 8, 0.6)' : isHover ? '#cbd5e1' : 'rgba(71, 85, 105, 0.5)';
      ctx.lineWidth = isSel ? 1.5 : 1.2;
      roundRect(ctx, tx, tabY, tabW, tabH, 5);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = isSel ? '#fde68a' : t.complete ? '#fef08a' : '#94a3b8';
      ctx.font = 'bold 10px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const badge = t.complete ? ' ★' : '';
      ctx.fillText(`${t.icon}  ${t.label}${badge}`, tx + tabW / 2, tabY + tabH / 2);

      _zones.push({
        id: `tab_${t.id}`,
        x: tx, y: tabY, w: tabW, h: tabH,
        action: () => {
          if (_activeTab !== t.id) {
            _activeTab = t.id;
            _selectedIndex = 0;
            _scrollOffset = 0;
            SoundManager.snd('menu_select');
          }
        }
      });
    });

    // Content Region Split: Left List (280px) + Right Inspector (440px)
    const contentY = tabY + tabH + 12;
    const contentH = panY + panH - contentY - 48;
    const leftW = 280;
    const rightX = panX + 24 + leftW + 14;
    const rightW = panW - 48 - leftW - 14;

    // Left List Frame
    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1;
    roundRect(ctx, panX + 24, contentY, leftW, contentH, 6);
    ctx.fill(); ctx.stroke();

    // Right Inspector Frame
    ctx.fillStyle = 'rgba(10, 15, 30, 0.82)';
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.4)';
    roundRect(ctx, rightX, contentY, rightW, contentH, 6);
    ctx.fill(); ctx.stroke();

    // ─────────────────────────────────────────────────────────────
    // 1. LEFT LIST: ITEMS
    // ─────────────────────────────────────────────────────────────
    let activeItems = [];
    if (_activeTab === 'lore') {
      activeItems = principalLore;
    } else if (_activeTab === 'bestiary') {
      activeItems = BESTIARY_INFO;
    } else {
      activeItems = STORY_MEMORIES;
    }

    const itemH = 48;
    const itemGap = 5;
    const maxVisibleH = contentH - 12;
    const totalListH = activeItems.length * (itemH + itemGap);
    const maxScroll = Math.max(0, totalListH - maxVisibleH);
    _scrollOffset = Math.min(_scrollOffset, maxScroll);

    ctx.save();
    ctx.beginPath();
    roundRect(ctx, panX + 26, contentY + 4, leftW - 4, contentH - 8, 6);
    ctx.clip();

    activeItems.forEach((item, idx) => {
      const iy = contentY + 6 + idx * (itemH + itemGap) - _scrollOffset;
      if (iy + itemH < contentY || iy > contentY + contentH) return;

      const isSel = _selectedIndex === idx;
      let isUnlocked = false;
      let displayTitle = '';
      let subLabel = '';
      let tag = '';
      let subColor = '#94a3b8';

      if (_activeTab === 'lore') {
        isUnlocked = isLoreUnlocked(item.id);
        tag = `F${item.floor}`;
        subLabel = `FLOOR ${item.floor} · SCROLL`;
        displayTitle = isUnlocked ? item.title : `Floor ${item.floor} — Sealed Scroll`;
        subColor = isUnlocked ? '#fde047' : '#64748b';
      } else if (_activeTab === 'bestiary') {
        const isSecret = item.isSecret || item.id === 'absolute';
        isUnlocked = isSecret ? SaveSystem.isSecretBestiaryUnlocked(item.id) : ((killsMap[item.id] || 0) > 0);
        if (isSecret) {
          tag = isUnlocked ? 'VOID' : '?';
          subLabel = isUnlocked ? 'UNRECORDED ENTITY' : 'CLASSIFIED ENTITY';
          displayTitle = isUnlocked ? item.name : 'Undiscovered Horror';
          subColor = isUnlocked ? '#ef4444' : '#64748b';
        } else {
          tag = isUnlocked ? `${killsMap[item.id] || 0} slain` : '?';
          subLabel = isUnlocked ? (item.category ? item.category.toUpperCase() : 'HORROR') : 'CLASSIFIED ENTITY';
          displayTitle = isUnlocked ? item.name : 'Undiscovered Horror';
          subColor = isUnlocked ? (item.col || '#f87171') : '#64748b';
        }
      } else {
        isUnlocked = isMemoryUnlocked(item.id);
        const isLegacy = item.id.startsWith('echo_');
        const isEnding = item.id.startsWith('memory_ending_');

        if (isEnding) {
          const routeChar = item.chronology.includes('Route A') ? 'A' : (item.chronology.includes('Route B') ? 'B' : 'C');
          tag = `END ${routeChar}`;
          subLabel = `ENDING ROUTE ${routeChar}`;
          displayTitle = isUnlocked ? item.title : `Sealed Ending Route ${routeChar}`;
          subColor = isUnlocked ? '#c084fc' : '#64748b';
        } else if (isLegacy) {
          const echoNum = item.chronology.replace('Legacy Echo ', '');
          tag = `ECHO ${echoNum}`;
          subLabel = `LEGACY ECHO ${echoNum}`;
          displayTitle = isUnlocked ? item.title : `Sealed Legacy Echo ${echoNum}`;
          subColor = isUnlocked ? '#38bdf8' : '#64748b';
        } else {
          tag = `F${item.floor}`;
          subLabel = `FLOOR ${item.floor} · CANON`;
          displayTitle = isUnlocked ? item.title : `Floor ${item.floor} Sealed Memory`;
          subColor = isUnlocked ? '#fde047' : '#64748b';
        }
      }

      const cardW = leftW - 8;
      const isHoverItem = mouseX >= panX + 28 && mouseX <= panX + 28 + cardW && mouseY >= iy && mouseY <= iy + itemH;

      ctx.fillStyle = isSel
        ? 'rgba(201, 168, 76, 0.25)'
        : (isHoverItem ? 'rgba(30, 41, 59, 0.75)' : 'rgba(15, 23, 42, 0.6)');
      ctx.strokeStyle = isSel
        ? '#fde68a'
        : (isUnlocked ? 'rgba(201, 168, 76, 0.45)' : 'rgba(51, 65, 85, 0.4)');
      ctx.lineWidth = isSel ? 1.5 : 1;
      roundRect(ctx, panX + 28, iy, cardW, itemH, 5);
      ctx.fill(); ctx.stroke();

      // Dedicated Tag Badge (Left: 46px wide, 32px tall, centered vertically)
      const badgeW = 46;
      const badgeH = 32;
      const badgeX = panX + 34;
      const badgeY = iy + Math.round((itemH - badgeH) / 2);

      ctx.fillStyle = isUnlocked ? 'rgba(201, 168, 76, 0.18)' : 'rgba(51, 65, 85, 0.3)';
      roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 4);
      ctx.fill();

      ctx.fillStyle = isUnlocked ? '#fde047' : '#64748b';
      ctx.font = 'bold 9px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tag, badgeX + badgeW / 2, badgeY + badgeH / 2);

      // Text Region (Right of Badge: completely separate bounded area)
      const textX = badgeX + badgeW + 8;
      const maxTextW = panX + 28 + cardW - textX - 8;

      // Line 1: Category / Chronology Sub-Label (Top)
      ctx.fillStyle = subColor;
      ctx.font = 'bold 8px Cinzel, serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      let truncSub = subLabel;
      while (ctx.measureText(truncSub).width > maxTextW && truncSub.length > 4) {
        truncSub = truncSub.slice(0, -1);
      }
      ctx.fillText(truncSub, textX, iy + 8);

      // Line 2: Prominent Memory Title (Bottom)
      ctx.fillStyle = isUnlocked ? (isSel ? '#fde68a' : '#f1f5f9') : '#64748b';
      ctx.font = isSel ? 'bold 10.5px Cinzel, serif' : '10px Cinzel, serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      let truncated = displayTitle;
      while (ctx.measureText(truncated + '…').width > maxTextW && truncated.length > 3) {
        truncated = truncated.slice(0, -1);
      }
      if (truncated !== displayTitle) truncated += '…';
      ctx.fillText(truncated, textX, iy + 22);

      _zones.push({
        id: `item_${idx}`,
        x: panX + 28, y: iy, w: cardW, h: itemH,
        action: () => {
          if (_selectedIndex !== idx) {
            _selectedIndex = idx;
            _memoryTransition = 0;
            SoundManager.snd('menu_hover');
          }
        }
      });
    });
    ctx.restore();

    // ─────────────────────────────────────────────────────────────
    // 2. RIGHT INSPECTOR: SELECTED ITEM DETAILS
    // ─────────────────────────────────────────────────────────────
    const selectedItem = activeItems[_selectedIndex] || activeItems[0];
    if (selectedItem) {
      const isSelectedUnlocked = _activeTab === 'lore'
        ? isLoreUnlocked(selectedItem.id)
        : (_activeTab === 'bestiary'
          ? ((selectedItem.isSecret || selectedItem.id === 'absolute')
              ? SaveSystem.isSecretBestiaryUnlocked(selectedItem.id)
              : ((killsMap[selectedItem.id] || 0) > 0))
          : isMemoryUnlocked(selectedItem.id));

      if (_activeTab === 'lore') {
        this.drawChronicleInspector(ctx, selectedItem, rightX, contentY, rightW, contentH, isSelectedUnlocked);
      } else if (_activeTab === 'bestiary') {
        this.drawBestiaryInspector(ctx, selectedItem, rightX, contentY, rightW, contentH, isSelectedUnlocked, killsMap[selectedItem.id] || 0);
      } else {
        this.drawMemoryInspector(ctx, selectedItem, rightX, contentY, rightW, contentH, isSelectedUnlocked);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 3. BOTTOM BAR: RETURN BUTTON
    // ─────────────────────────────────────────────────────────────
    const closeW = 200;
    const closeH = 30;
    const closeX = Math.round(panX + panW / 2 - closeW / 2);
    const closeY = panY + panH - 38;
    const isCloseHovered = mouseX >= closeX && mouseX <= closeX + closeW && mouseY >= closeY && mouseY <= closeY + closeH;

    ctx.fillStyle = isCloseHovered ? 'rgba(75, 85, 99, 0.85)' : 'rgba(30, 41, 59, 0.8)';
    ctx.strokeStyle = isCloseHovered ? '#fde68a' : 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 1.2;
    roundRect(ctx, closeX, closeY, closeW, closeH, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = isCloseHovered ? '#ffffff' : '#cbd5e1';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('◈ RETURN ( Esc )', closeX + closeW / 2, closeY + closeH / 2);

    _zones.push({
      id: 'btn_close',
      x: closeX, y: closeY, w: closeW, h: closeH,
      action: () => closeCodex()
    });

    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────
  // CHRONICLES INSPECTOR
  // ─────────────────────────────────────────────────────────────
  drawChronicleInspector(ctx, item, rx, ry, rw, rh, isUnlocked) {
    if (!isUnlocked) {
      this.drawLockedState(ctx, rx, ry, rw, rh, `Floor ${item.floor} — Sealed Chronicle`, `This ancient parchment remains sealed within the stones of Floor ${item.floor}. Descend into the labyrinth to recover its lore.`);
      return;
    }

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 15px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`◈ ${item.title.toUpperCase()}`, rx + rw / 2, ry + 18);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Cinzel, serif';
    ctx.fillText(item.author || `Recovered from Floor ${item.floor}`, rx + rw / 2, ry + 40);

    ctx.strokeStyle = 'rgba(201, 168, 76, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rx + 24, ry + 56);
    ctx.lineTo(rx + rw - 24, ry + 56);
    ctx.stroke();

    // Ancient Text Body with word wrapping
    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'italic 12.5px Crimson Text, serif';
    ctx.textAlign = 'left';
    const lines = this.wrapText(ctx, item.text, rw - 48);
    lines.forEach((l, idx) => {
      ctx.fillText(l, rx + 24, ry + 72 + idx * 22);
    });

    // Floor Revelation Seal
    const stampY = ry + rh - 44;
    ctx.fillStyle = 'rgba(201, 168, 76, 0.15)';
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.5)';
    roundRect(ctx, rx + 24, stampY, rw - 48, 26, 4);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#c9a84c';
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`ARCHIVAL DEED PRESERVED · FLOOR ${item.floor} CANON`, rx + rw / 2, stampY + 13);
  },

  // ─────────────────────────────────────────────────────────────
  // BESTIARY INSPECTOR (Authentic In-Game Pixel-Art Portrait)
  // ─────────────────────────────────────────────────────────────
  drawBestiaryInspector(ctx, item, rx, ry, rw, rh, isUnlocked, kills) {
    const isSecret = item.isSecret || item.id === 'absolute';

    // 1. Portrait Box (Left of Right Inspector: 140x140)
    const portW = 140;
    const portH = 140;
    const portX = rx + 18;
    const portY = ry + 18;

    BestiaryPortraitRenderer.drawPortrait(ctx, item.id, portX, portY, portW, portH, isUnlocked, _ambientTimer);

    // 2. Creature Meta & Stats (Right of Portrait Box)
    const metaX = portX + portW + 18;
    const metaW = rx + rw - metaX - 18;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.fillStyle = isUnlocked ? (item.col || '#fde68a') : '#64748b';
    ctx.font = 'bold 15px Cinzel, serif';
    ctx.fillText(isUnlocked ? item.name : 'Unknown Entity', metaX, ry + 20);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Cinzel, serif';
    ctx.fillText(`CATEGORY: ${isUnlocked ? (item.category || 'Abyssal Horror') : 'Classified'}`, metaX, ry + 42);
    ctx.fillText(`ENCOUNTER: ${isUnlocked ? item.floors : 'Deep Floors'}`, metaX, ry + 58);
    ctx.fillText(`STATUS / THREAT: ${isUnlocked ? item.threat.toUpperCase() : 'Unknown'}`, metaX, ry + 74);

    if (isSecret) {
      // Secret Observation Status Badge (Not an ordinary combat kill counter)
      ctx.fillStyle = isUnlocked ? 'rgba(220, 38, 38, 0.18)' : 'rgba(51, 65, 85, 0.4)';
      ctx.strokeStyle = isUnlocked ? 'rgba(220, 38, 38, 0.65)' : 'rgba(71, 85, 105, 0.5)';
      roundRect(ctx, metaX, ry + 94, 160, 24, 4);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = isUnlocked ? '#fca5a5' : '#94a3b8';
      ctx.font = 'bold 9px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isUnlocked ? 'OBSERVATION LOGGED' : 'CLASSIFICATION SEALED', metaX + 80, ry + 106);
    } else {
      // Standard Kill Counter Badge
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
      roundRect(ctx, metaX, ry + 94, 140, 24, 4);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#fca5a5';
      ctx.font = 'bold 9.5px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`TOTAL SLAIN: ${kills}`, metaX + 70, ry + 106);
    }

    // Divider line
    ctx.strokeStyle = isSecret ? 'rgba(220, 38, 38, 0.35)' : 'rgba(71, 85, 105, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rx + 18, portY + portH + 14);
    ctx.lineTo(rx + rw - 18, portY + portH + 14);
    ctx.stroke();

    // 3. Information Section
    const descY = portY + portH + 24;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    if (!isUnlocked) {
      ctx.fillStyle = '#64748b';
      ctx.font = 'italic 12px Crimson Text, serif';
      const lockedMsg = isSecret
        ? 'No observation of this entity has been registered. Its existence lies beyond ordinary dungeon records, concealed in the deepest collapse of mortal consciousness.'
        : 'This horror has not yet been conquered in combat. Slay it during your descent to decrypt its combat behavior, attack telegraphs, and elemental weaknesses.';
      const uLines = this.wrapText(ctx, lockedMsg, rw - 40);
      uLines.forEach((ul, idx) => {
        ctx.fillText(ul, rx + 20, descY + idx * 16);
      });
      return;
    }

    if (isSecret) {
      // Ancient Inscription & Surviving Account
      this.drawAncientInscription(ctx, rx + 20, descY, rw - 40, _ambientTimer);
      return;
    }

    // Standard enemy lore & tactics
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.fillText('LORE OBSERVATION:', rx + 20, descY);

    ctx.fillStyle = '#f1f5f9';
    ctx.font = '11.5px Crimson Text, serif';
    const dLines = this.wrapText(ctx, item.desc, rw - 40);
    dLines.forEach((dl, idx) => {
      ctx.fillText(dl, rx + 20, descY + 14 + idx * 16);
    });

    const tacticsY = descY + 14 + Math.max(2, dLines.length) * 16 + 10;
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.fillText('TACTICAL OBSERVATION:', rx + 20, tacticsY);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11.5px Crimson Text, serif';
    const tLines = this.wrapText(ctx, item.tactics, rw - 40);
    tLines.forEach((tl, idx) => {
      ctx.fillText(tl, rx + 20, tacticsY + 14 + idx * 16);
    });
  },

  drawAncientInscription(ctx, x, y, maxW, timer) {
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.fillText('ANCIENT INSCRIPTION (UNTRANSLATABLE):', x, y);

    const glyphData = [
      [15, 1, 4, 10, -1, 6, 8, 3, 11, -1, 14, 0, 7, -1, 15, 2, 5],
      [2, 5, -1, 12, 13, 1, -1, -2, -2, -1, 9, 15, 4, -1, 10, -2],
      [10, 7, 11, -1, 15, 1, 8, -1, 6, 3, -1, -3, -3, -3]
    ];

    const pSize = 1.6;
    const glyphPitch = 18;
    const linePitch = 18;
    const startGlyphY = y + 16;

    ctx.save();
    glyphData.forEach((line, lineIdx) => {
      let curX = x;
      const curY = startGlyphY + lineIdx * linePitch;

      line.forEach((gIdx, colIdx) => {
        if (gIdx === -1) {
          curX += 10;
          return;
        }

        if (gIdx === -3) {
          // Eroded dash
          ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
          ctx.fillRect(curX, curY + 5, 8, 2);
          curX += 12;
          return;
        }

        const pulse = Math.sin(timer * 2.2 + lineIdx * 1.4 + colIdx * 0.4);
        const alpha = gIdx === -2
          ? (0.2 + pulse * 0.08)
          : (0.65 + pulse * 0.25);

        ctx.fillStyle = `rgba(239, 68, 68, ${Math.max(0.15, alpha)})`;

        const pattern = gIdx === -2
          ? [0b00100, 0b00000, 0b01010, 0b00000, 0b10001, 0b00000, 0b00100] // chipped fragments
          : (ANCIENT_GLYPHS[gIdx] || ANCIENT_GLYPHS[0]);

        for (let r = 0; r < 7; r++) {
          const rowBits = pattern[r];
          for (let c = 0; c < 5; c++) {
            if ((rowBits & (1 << (4 - c))) !== 0) {
              ctx.fillRect(
                Math.round(curX + c * pSize),
                Math.round(curY + r * pSize),
                Math.round(pSize),
                Math.round(pSize)
              );
            }
          }
        }

        curX += glyphPitch;
      });
    });
    ctx.restore();

    // Subtle divider line
    const divY = startGlyphY + 3 * linePitch + 6;
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, divY);
    ctx.lineTo(x + maxW, divY);
    ctx.stroke();

    // Secondary Surviving Observation
    const obsY = divY + 10;
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.fillText('SURVIVING RECOLLECTION:', x, obsY);

    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'italic 11.5px Crimson Text, serif';
    const note = '“No origin is recorded. No age is known. The form observed during the collapse of sanity is the only surviving account.”';
    const nLines = this.wrapText(ctx, note, maxW);
    nLines.forEach((nl, idx) => {
      ctx.fillText(nl, x, obsY + 14 + idx * 16);
    });
  },

  // ─────────────────────────────────────────────────────────────
  // MEMORIES INSPECTOR (Pixel-Art Scene Frame)
  // ─────────────────────────────────────────────────────────────
  drawMemoryInspector(ctx, item, rx, ry, rw, rh, isUnlocked) {
    if (!isUnlocked) {
      this.drawLockedState(ctx, rx, ry, rw, rh, 'Locked Memory Echo', 'This memory remains sealed in the deep void. Advance through cinematic trials and endings to unlock Rowan\'s journey recollections.');
      return;
    }

    const transAlpha = Math.min(1, Math.max(0.1, _memoryTransition));
    const slideOffset = (1 - _memoryTransition) * 6;

    // Scene Thumbnail Preview Frame (180x102)
    const thW = 180;
    const thH = 102;
    const thX = rx + Math.round((rw - thW) / 2);
    const thY = ry + 12 + slideOffset;

    BestiaryPortraitRenderer.drawMemoryThumbnail(ctx, item.sceneType, thX, thY, thW, thH, isUnlocked, _ambientTimer);

    ctx.save();
    ctx.globalAlpha = transAlpha;

    let curY = thY + thH + 9;

    // Chronology Subtitle
    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(item.chronology ? item.chronology.toUpperCase() : 'JOURNEY RECOLLECTION', rx + rw / 2, curY);
    curY += 15;

    // Title
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 15px Cinzel, serif';
    ctx.fillText(item.title, rx + rw / 2, curY);
    curY += 21;

    // Spoken Quote (if present)
    if (item.quote) {
      ctx.fillStyle = '#fde047';
      ctx.font = 'italic 11.5px Crimson Text, serif';
      const qLines = this.wrapText(ctx, item.quote, rw - 44);
      qLines.forEach((ql) => {
        ctx.fillText(ql, rx + rw / 2, curY);
        curY += 15;
      });
      curY += 4;
    }

    // Divider
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rx + 24, curY);
    ctx.lineTo(rx + rw - 24, curY);
    ctx.stroke();
    curY += 10;

    // Narrative Recollection
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.fillText('JOURNEY RECOLLECTION:', rx + 24, curY);
    curY += 15;

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11.5px Crimson Text, serif';
    const lLines = this.wrapText(ctx, item.lore, rw - 48);
    lLines.forEach((ll) => {
      ctx.fillText(ll, rx + 24, curY);
      curY += 16;
    });

    if (item.significance) {
      curY += 6;
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9.5px Cinzel, serif';
      ctx.fillText('CRUCIBLE SIGNIFICANCE:', rx + 24, curY);
      curY += 15;

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'italic 11px Crimson Text, serif';
      const sLines = this.wrapText(ctx, item.significance, rw - 48);
      sLines.forEach((sl) => {
        ctx.fillText(sl, rx + 24, curY);
        curY += 15;
      });
    }

    ctx.restore();
  },

  drawLockedState(ctx, rx, ry, rw, rh, title, hint) {
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 14px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, rx + rw / 2, ry + rh / 2 - 30);

    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = '12px Crimson Text, serif';
    const lines = this.wrapText(ctx, hint, rw - 60);
    lines.forEach((l, idx) => {
      ctx.fillText(l, rx + rw / 2, ry + rh / 2 + idx * 18);
    });
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
      closeCodex();
      return true;
    }
    return false;
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

    // Click outside panel returns to Title
    const panW = 820, panH = 510;
    const panX = (LW - panW) / 2, panY = (LH - panH) / 2;
    if (mx < panX || mx > panX + panW || my < panY || my > panY + panH) {
      closeCodex();
      return true;
    }

    return false;
  }
};

export function drawCodexPanel(ctx, dt) {
  CodexUI.draw(ctx, dt);
}

// ─────────────────────────────────────────────────────────────
// IN-DUNGEON MODAL RENDERERS & EVENT HANDLERS
// ─────────────────────────────────────────────────────────────
let _modalAnimT = 0;

export function drawLoreModal(ctx) {
  if (!GameState.ACTIVE_LORE_MODAL) return;
  const mw = 480, mh = 240;
  const mx = Math.round(LW / 2 - mw / 2), my = Math.round(LH / 2 - mh / 2);

  ctx.save();
  ctx.fillStyle = 'rgba(5, 7, 18, 0.96)';
  ctx.strokeStyle = 'rgba(201, 168, 76, 0.8)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, mx, my, mw, mh, 10);
  ctx.fill(); ctx.stroke();

  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 15px Cinzel, serif';
  ctx.textAlign = 'center';
  ctx.fillText('◈ ' + (GameState.ACTIVE_LORE_MODAL.title || 'Ancient Parchment'), LW / 2, my + 24);

  ctx.fillStyle = 'rgba(201, 168, 76, 0.3)';
  ctx.fillRect(mx + 30, my + 44, mw - 60, 1);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'italic 12.5px Crimson Text, serif';
  const text = GameState.ACTIVE_LORE_MODAL.text || '';
  const words = text.split(' ');
  let line = '', lines = [];
  words.forEach(w => {
    if (ctx.measureText(line + w).width > mw - 60) {
      lines.push(line); line = w + ' ';
    } else line += w + ' ';
  });
  if (line) lines.push(line);

  lines.forEach((l, i) => {
    ctx.fillText(l, LW / 2, my + 72 + i * 22);
  });

  ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
  ctx.font = '10px Cinzel, serif';
  ctx.fillText('Click anywhere to close ( Esc )', LW / 2, my + mh - 16);
  ctx.restore();
}

export function drawMemoryEchoModal(ctx, dt = 0.016) {
  if (!GameState.ACTIVE_MEMORY_ECHO) return;
  _modalAnimT = Math.min(1, _modalAnimT + dt * 4.0);

  const panW = 540, panH = 340;
  const panX = Math.round(LW / 2 - panW / 2), panY = Math.round(LH / 2 - panH / 2 - (1 - _modalAnimT) * 30);

  ctx.save();
  ctx.globalAlpha = _modalAnimT;

  ctx.fillStyle = 'rgba(5, 8, 22, 0.96)';
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.75)';
  ctx.lineWidth = 1.8;
  roundRect(ctx, panX, panY, panW, panH, 12);
  ctx.fill(); ctx.stroke();

  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 16px Cinzel, serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 12;
  ctx.fillText('✦ ' + (GameState.ACTIVE_MEMORY_ECHO.title || 'Memory Echo'), LW / 2, panY + 18);
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(panX + 30, panY + 44); ctx.lineTo(panX + panW - 30, panY + 44);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic 13.5px Crimson Text, serif';
  const words = (GameState.ACTIVE_MEMORY_ECHO.quote || '').split(' ');
  let line = '', lines = [];
  words.forEach(w => {
    if (ctx.measureText(line + w).width > panW - 60) {
      lines.push(line); line = w + ' ';
    } else line += w + ' ';
  });
  if (line) lines.push(line);
  lines.forEach((l, i) => {
    ctx.fillText(l, LW / 2, panY + 60 + i * 20);
  });

  const loreStartY = panY + 60 + lines.length * 20 + 8;
  ctx.fillStyle = 'rgba(203, 213, 225, 0.85)';
  ctx.font = '11px Crimson Text, serif';
  const lwords = (GameState.ACTIVE_MEMORY_ECHO.lore || '').split(' ');
  let lline = '', llines = [];
  lwords.forEach(w => {
    if (ctx.measureText(lline + w).width > panW - 60) {
      llines.push(lline); lline = w + ' ';
    } else lline += w + ' ';
  });
  if (lline) llines.push(lline);
  llines.forEach((l, i) => {
    ctx.fillText(l, LW / 2, loreStartY + i * 16);
  });

  const btnW = 220, btnH = 56;
  const btn1X = panX + 30, btn2X = panX + panW - 30 - btnW;
  const btnY = panY + panH - 78;

  // Choice A
  if (GameState.ACTIVE_MEMORY_ECHO.choiceA) {
    ctx.fillStyle = 'rgba(14, 165, 233, 0.18)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.lineWidth = 1.2;
    roundRect(ctx, btn1X, btnY, btnW, btnH, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(GameState.ACTIVE_MEMORY_ECHO.choiceA.label, btn1X + btnW / 2, btnY + 10);
    ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
    ctx.font = '10px Crimson Text, serif';
    ctx.fillText(GameState.ACTIVE_MEMORY_ECHO.choiceA.desc, btn1X + btnW / 2, btnY + 30);
  }

  // Choice B
  if (GameState.ACTIVE_MEMORY_ECHO.choiceB) {
    ctx.fillStyle = 'rgba(168, 85, 247, 0.18)';
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.7)';
    ctx.lineWidth = 1.2;
    roundRect(ctx, btn2X, btnY, btnW, btnH, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(GameState.ACTIVE_MEMORY_ECHO.choiceB.label, btn2X + btnW / 2, btnY + 10);
    ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
    ctx.font = '10px Crimson Text, serif';
    ctx.fillText(GameState.ACTIVE_MEMORY_ECHO.choiceB.desc, btn2X + btnW / 2, btnY + 30);
  }

  ctx.restore();
}

export function handleMemoryEchoClick(mx, my) {
  if (!GameState.ACTIVE_MEMORY_ECHO) return false;
  const panW = 540, panH = 340;
  const panX = LW / 2 - panW / 2, panY = LH / 2 - panH / 2;
  const btnW = 220, btnH = 56;
  const btn1X = panX + 30, btn2X = panX + panW - 30 - btnW;
  const btnY = panY + panH - 78;

  if (mx >= btn1X && mx <= btn1X + btnW && my >= btnY && my <= btnY + btnH) {
    if (GameState.ACTIVE_MEMORY_ECHO.choiceA && GameState.ACTIVE_MEMORY_ECHO.choiceA.effect) {
      GameState.ACTIVE_MEMORY_ECHO.choiceA.effect();
    }
    GameState.ACTIVE_MEMORY_ECHO = null;
    SoundManager.snd('talent_unlock');
    return true;
  }
  if (mx >= btn2X && mx <= btn2X + btnW && my >= btnY && my <= btnY + btnH) {
    if (GameState.ACTIVE_MEMORY_ECHO.choiceB && GameState.ACTIVE_MEMORY_ECHO.choiceB.effect) {
      GameState.ACTIVE_MEMORY_ECHO.choiceB.effect();
    }
    GameState.ACTIVE_MEMORY_ECHO = null;
    SoundManager.snd('talent_unlock');
    return true;
  }
  return false;
}

if (typeof window !== 'undefined') {
  window.CodexUI = CodexUI;
  window.openCodex = openCodex;
  window.closeCodex = closeCodex;
  window.addEventListener('wheel', (e) => {
    if (GameState.STATE === GameStates.CODEX) {
      CodexUI.handleWheel(e.deltaY);
    }
  }, { passive: true });
}
