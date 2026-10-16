// =====================================================================
//  DUNGEON BREAK — js/ui/CodexUI.js
//  UI/UX Reconstruction: 3 Distinct Chamber Architectures
//  - Chronicles: Pentiment Medieval Folio Spread & Rubricated Manuscript
//  - Bestiary: Monster Hunter Abyssal Specimen Containment Chamber
//  - Memories: Deep Astral Void of Suspended Crystalline Shards
//  100% In-Game Canvas 2D Renderers, Zero Emojis, Zero Placeholders
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

// Bestiary carousel scroll
let _bestiaryCarouselOffset = 0;

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

// 60 procedural background stars for Astral Void
const VOID_STARS = [];
for (let i = 0; i < 60; i++) {
  VOID_STARS.push({
    x: (i * 137.5) % 860,
    y: (i * 93.7) % 460,
    size: 0.6 + (i % 3) * 0.7,
    phase: i * 0.4,
    speed: 0.8 + (i % 5) * 0.3
  });
}

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
    _scrollOffset = Math.max(0, _scrollOffset + (deltaY > 0 ? 35 : -35));
  },

  draw(ctx, dt = 0.016) {
    _codexSlide = Math.min(1, _codexSlide + dt * 6.0);
    _ambientTimer += dt;
    _memoryTransition = Math.min(1, _memoryTransition + dt * 6.0);
    const eased = 1 - Math.pow(1 - _codexSlide, 3);

    ctx.save();
    ctx.globalAlpha = eased;

    // Dark backdrop blur
    ctx.fillStyle = 'rgba(2, 4, 10, 0.90)';
    ctx.fillRect(0, 0, LW, LH);

    const panW = 890;
    const panH = 520;
    const panX = Math.round((LW - panW) / 2);
    const panY = Math.round((LH - panH) / 2 - (1 - eased) * 35);

    // Chamber Radial Ambient Glow depending on active tab
    const pulse = 0.5 + 0.5 * Math.sin(_ambientTimer * 2.2);
    const grad = ctx.createRadialGradient(panX + panW / 2, panY + 140, 20, panX + panW / 2, panY + 220, 450);
    if (_activeTab === 'lore') {
      grad.addColorStop(0, `rgba(201, 168, 76, ${0.16 + pulse * 0.04})`);
      grad.addColorStop(0.6, 'rgba(133, 77, 14, 0.06)');
    } else if (_activeTab === 'bestiary') {
      grad.addColorStop(0, `rgba(220, 38, 38, ${0.16 + pulse * 0.04})`);
      grad.addColorStop(0.6, 'rgba(127, 29, 29, 0.06)');
    } else {
      grad.addColorStop(0, `rgba(147, 51, 234, ${0.18 + pulse * 0.05})`);
      grad.addColorStop(0.6, 'rgba(79, 70, 229, 0.06)');
    }
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(panX - 40, panY - 40, panW + 80, panH + 80);

    // Master Outer Enclosure
    ctx.fillStyle = 'rgba(6, 9, 20, 0.98)';
    ctx.strokeStyle = _activeTab === 'lore'
      ? 'rgba(201, 168, 76, 0.65)'
      : (_activeTab === 'bestiary' ? 'rgba(239, 68, 68, 0.6)' : 'rgba(168, 85, 247, 0.65)');
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

    // Discovery statistics
    const killsMap = GameState.BESTIARY_KILLS || {};
    const principalLore = LORE_SCROLLS_DATA.filter(l => l.floor >= 1 && l.floor <= 10 && l.revealedAt !== 'legacy');
    const loreCount = principalLore.filter(l => isLoreUnlocked(l.id)).length;
    const totalLore = principalLore.length;

    const isEntryDiscovered = (b) => {
      if (b.isSecret || b.id === 'absolute') {
        return SaveSystem.isSecretBestiaryUnlocked(b.id);
      }
      return (killsMap[b.id] || 0) > 0;
    };
    const bestiaryCount = BESTIARY_INFO.filter(isEntryDiscovered).length;
    const totalBestiary = BESTIARY_INFO.length;

    const memCount = STORY_MEMORIES.filter(m => isMemoryUnlocked(m.id)).length;
    const totalMem = STORY_MEMORIES.length;

    // ─────────────────────────────────────────────────────────────
    // TOP HEADER: TITLE & 3 DISTINCT CHAMBER PLINTHS
    // ─────────────────────────────────────────────────────────────
    const badgeY = panY + 15;

    // Inscription (Center Top)
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 14px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#d97706';
    ctx.shadowBlur = 8;
    ctx.fillText('◈ THE GRAND ARCHIVE OF THE ABYSS ◈', panX + 22, badgeY + 13);
    ctx.shadowBlur = 0;

    // 3 Chamber Tabs on the right
    const tabs = [
      { id: 'lore',     label: `CHRONICLES (${loreCount}/${totalLore})`, icon: '¶', w: 168 },
      { id: 'bestiary', label: `BESTIARY (${bestiaryCount}/${totalBestiary})`, icon: 'ᛟ', w: 165 },
      { id: 'memories', label: `MEMORIES (${memCount}/${totalMem})`, icon: '✦', w: 162 }
    ];
    let tabX = panX + panW - 20 - (168 + 165 + 162 + 16);

    tabs.forEach(t => {
      const isSel = _activeTab === t.id;
      const isHover = mouseX >= tabX && mouseX <= tabX + t.w && mouseY >= badgeY && mouseY <= badgeY + 26;

      ctx.fillStyle = isSel
        ? (_activeTab === 'lore' ? 'rgba(201, 168, 76, 0.35)' : (_activeTab === 'bestiary' ? 'rgba(220, 38, 38, 0.35)' : 'rgba(147, 51, 234, 0.35)'))
        : (isHover ? 'rgba(30, 41, 59, 0.8)' : 'rgba(15, 23, 42, 0.6)');
      ctx.strokeStyle = isSel
        ? (_activeTab === 'lore' ? '#fde68a' : (_activeTab === 'bestiary' ? '#f87171' : '#c084fc'))
        : (isHover ? '#cbd5e1' : 'rgba(71, 85, 105, 0.5)');
      ctx.lineWidth = isSel ? 1.5 : 1;
      roundRect(ctx, tabX, badgeY, t.w, 26, 5);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = isSel ? '#ffffff' : (isHover ? '#f1f5f9' : '#94a3b8');
      ctx.font = 'bold 9px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${t.icon}  ${t.label}`, tabX + t.w / 2, badgeY + 13);

      _zones.push({
        id: `tab_${t.id}`,
        x: tabX, y: badgeY, w: t.w, h: 26,
        action: () => {
          if (_activeTab !== t.id) {
            _activeTab = t.id;
            _selectedIndex = 0;
            _scrollOffset = 0;
            _memoryTransition = 0;
            SoundManager.snd('menu_select');
          }
        }
      });
      tabX += t.w + 8;
    });

    // Content Region Coordinates
    const contentY = badgeY + 36;
    const contentH = panY + panH - contentY - 46;

    // ─────────────────────────────────────────────────────────────
    // DISPATCH TO 3 COMPLETELY DISTINCT WORLD PRESENTATIONS
    // ─────────────────────────────────────────────────────────────
    if (_activeTab === 'lore') {
      this.drawChroniclesGrimoire(ctx, panX, contentY, panW, contentH, mouseX, mouseY, dt, principalLore);
    } else if (_activeTab === 'bestiary') {
      this.drawBestiaryContainment(ctx, panX, contentY, panW, contentH, mouseX, mouseY, dt, killsMap);
    } else {
      this.drawMemoriesAstralVoid(ctx, panX, contentY, panW, contentH, mouseX, mouseY, dt);
    }

    // ─────────────────────────────────────────────────────────────
    // BOTTOM BAR: KEYBOARD HINTS & RETURN BUTTON
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
    ctx.fillText('Arrows / Wheel — Navigate Items    Tab / 1-3 — Switch Chambers    Esc — Return', panX + 24, botY + 13);

    _zones.push({
      id: 'btn_close',
      x: retX, y: botY, w: retW, h: retH,
      action: closeCodex
    });

    ctx.restore();
  },

  // ═════════════════════════════════════════════════════════════════
  // 1. CHRONICLES: PENTIMENT ILLUMINATED MANUSCRIPT FOLIO SPREAD
  // ═════════════════════════════════════════════════════════════════
  drawChroniclesGrimoire(ctx, panX, ry, panW, rh, mouseX, mouseY, dt, principalLore) {
    const leftFolioW = 370;
    const rightFolioW = panW - 40 - leftFolioW - 14;
    const leftX = panX + 20;
    const rightX = leftX + leftFolioW + 14;

    // ── Left Folio: Aged Archival Catalogue (Vellum Tome Index) ──
    ctx.fillStyle = 'rgba(24, 20, 16, 0.94)';
    ctx.strokeStyle = 'rgba(180, 130, 60, 0.55)';
    ctx.lineWidth = 1.2;
    roundRect(ctx, leftX, ry, leftFolioW, rh, 8);
    ctx.fill(); ctx.stroke();

    // Vellum wash / inner aged margin
    ctx.fillStyle = 'rgba(40, 32, 24, 0.35)';
    roundRect(ctx, leftX + 4, ry + 4, leftFolioW - 8, rh - 8, 6);
    ctx.fill();

    // Book spine shadow groove on right edge of left folio
    const spineGrad = ctx.createLinearGradient(leftX + leftFolioW - 18, ry, leftX + leftFolioW, ry);
    spineGrad.addColorStop(0, 'rgba(0,0,0,0)');
    spineGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = spineGrad;
    ctx.fillRect(leftX + leftFolioW - 18, ry, 18, rh);

    // Left Folio Header Banner
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('¶ ARCHIVAL INDEX · TEN DESCENT TOMES', leftX + 16, ry + 14);

    ctx.strokeStyle = 'rgba(201, 168, 76, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftX + 16, ry + 30);
    ctx.lineTo(leftX + leftFolioW - 24, ry + 30);
    ctx.stroke();

    // 10 Chapter Entries
    const listY = ry + 38;
    const itemH = 34;
    const gap = 3;
    const visibleCount = Math.floor((rh - 48) / (itemH + gap));
    const maxScroll = Math.max(0, principalLore.length - visibleCount);
    const scrollIdx = Math.min(_scrollOffset > 0 ? Math.floor(_scrollOffset / 20) : 0, maxScroll);

    principalLore.forEach((item, idx) => {
      const iy = listY + idx * (itemH + gap);
      if (iy + itemH > ry + rh - 6) return;

      const isSel = _selectedIndex === idx;
      const isUnlocked = isLoreUnlocked(item.id);
      const isHover = mouseX >= leftX + 12 && mouseX <= leftX + leftFolioW - 16 && mouseY >= iy && mouseY <= iy + itemH;

      ctx.fillStyle = isSel
        ? 'rgba(201, 168, 76, 0.28)'
        : (isHover ? 'rgba(55, 45, 32, 0.65)' : 'rgba(28, 22, 17, 0.6)');
      ctx.strokeStyle = isSel
        ? '#fde68a'
        : (isUnlocked ? 'rgba(201, 168, 76, 0.4)' : 'rgba(75, 60, 45, 0.35)');
      ctx.lineWidth = isSel ? 1.4 : 1;
      roundRect(ctx, leftX + 12, iy, leftFolioW - 26, itemH, 5);
      ctx.fill(); ctx.stroke();

      // Authentic Wax Seal (Ruby Seal for unlocked, lead ash for locked)
      const sealX = leftX + 28;
      const sealY = iy + itemH / 2;
      const sealR = 9;

      ctx.beginPath();
      ctx.arc(sealX, sealY, sealR, 0, Math.PI * 2);
      ctx.fillStyle = isUnlocked ? '#b91c1c' : '#334155';
      ctx.fill();
      ctx.strokeStyle = isUnlocked ? '#fca5a5' : '#64748b';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = isUnlocked ? '#ffffff' : '#94a3b8';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isUnlocked ? '◉' : '⊗', sealX, sealY);

      // Chapter Roman Numeral + Title
      const romanNums = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
      const roman = romanNums[item.floor - 1] || `${item.floor}`;

      ctx.textAlign = 'left';
      ctx.fillStyle = isUnlocked ? (isSel ? '#fde68a' : '#f1f5f9') : '#64748b';
      ctx.font = isSel ? 'bold 10px Cinzel, serif' : '9.5px Cinzel, serif';
      const titleText = isUnlocked ? `LIBER ${roman} · ${item.title}` : `LIBER ${roman} · Sealed Parchment`;
      let truncTitle = titleText;
      const maxTW = leftFolioW - 95;
      while (ctx.measureText(truncTitle + '…').width > maxTW && truncTitle.length > 4) {
        truncTitle = truncTitle.slice(0, -1);
      }
      if (truncTitle !== titleText) truncTitle += '…';
      ctx.fillText(truncTitle, leftX + 46, iy + 12);

      // Subtitle provenance
      ctx.fillStyle = isUnlocked ? 'rgba(217, 119, 6, 0.9)' : 'rgba(100, 116, 139, 0.7)';
      ctx.font = '8px monospace';
      ctx.fillText(isUnlocked ? `FLOOR ${item.floor} CANON` : `BURIED IN FLOOR ${item.floor}`, leftX + 46, iy + 24);

      _zones.push({
        id: `lore_item_${idx}`,
        x: leftX + 12, y: iy, w: leftFolioW - 26, h: itemH,
        action: () => {
          if (_selectedIndex !== idx) {
            _selectedIndex = idx;
            SoundManager.snd('menu_hover');
          }
        }
      });
    });

    // ── Right Folio: Pentiment Rubricated Reading Folio ──
    ctx.fillStyle = 'rgba(28, 22, 17, 0.96)';
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.65)';
    ctx.lineWidth = 1.4;
    roundRect(ctx, rightX, ry, rightFolioW, rh, 8);
    ctx.fill(); ctx.stroke();

    // Subtle spine shadow on left edge of right folio
    const rSpineGrad = ctx.createLinearGradient(rightX, ry, rightX + 18, ry);
    rSpineGrad.addColorStop(0, 'rgba(0,0,0,0.45)');
    rSpineGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rSpineGrad;
    ctx.fillRect(rightX, ry, 18, rh);

    const selectedItem = principalLore[_selectedIndex] || principalLore[0];
    const isUnlocked = selectedItem ? isLoreUnlocked(selectedItem.id) : false;
    const romanNums = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    const roman = selectedItem ? (romanNums[selectedItem.floor - 1] || `${selectedItem.floor}`) : '?';

    // ─────────────────────────────────────────────────────────────
    // 1. PROMINENT ILLUSTRATED SCENE (Dedicated Pixel-Art Canvas)
    // ─────────────────────────────────────────────────────────────
    const illX = rightX + 16;
    const illY = ry + 12;
    const illW = rightFolioW - 32;
    const illH = 136;

    BestiaryPortraitRenderer.drawChronicleIllustration(
      ctx,
      selectedItem ? selectedItem.floor : 1,
      illX, illY, illW, illH,
      isUnlocked,
      _ambientTimer
    );

    // ─────────────────────────────────────────────────────────────
    // 2. LOCKED FOLIO READING STATE
    // ─────────────────────────────────────────────────────────────
    if (!selectedItem || !isUnlocked) {
      // Rubricated locked header
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 9.5px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`— LIBER ${roman} · SEALED CHRONICLE —`, rightX + rightFolioW / 2, ry + 158);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 14px Cinzel, serif';
      ctx.fillText(`SEALED STRATUM ${selectedItem ? selectedItem.floor : '?'} CHRONICLE`, rightX + rightFolioW / 2, ry + 172);

      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.font = 'italic 10px "Crimson Text", serif';
      ctx.fillText('Encrypted with Abyssal Seal & Ancient Vanguard Cipher', rightX + rightFolioW / 2, ry + 189);

      // Ornamental Divider
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rightX + 24, ry + 201);
      ctx.lineTo(rightX + rightFolioW - 24, ry + 201);
      ctx.stroke();

      // Sealed Explanation
      ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
      ctx.font = 'italic 12px "Crimson Text", serif';
      ctx.textAlign = 'center';
      const lockedMsg = `This parchment remains shrouded in eternal abyssal ash. Descend into the depths of Stratum Floor ${selectedItem ? selectedItem.floor : '?'} and recover the ancient lore scroll to break the wax seal, illuminate this historical account, and reveal Rowan's true trial.`;
      const lines = this.wrapText(ctx, lockedMsg, rightFolioW - 56);
      lines.forEach((l, idx) => {
        ctx.fillText(l, rightX + rightFolioW / 2, ry + 218 + idx * 19);
      });

      // Ancient transcription glyphs along bottom of reading area
      this.drawParchmentGlyphs(ctx, rightX + 32, ry + 300, rightFolioW - 64, _ambientTimer, 0.35);

      // Compact Locked Archival Footer Plate
      const provY = ry + rh - 48;
      const provH = 38;
      const provW = rightFolioW - 40;
      const provX = rightX + 20;

      ctx.fillStyle = 'rgba(12, 16, 26, 0.75)';
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.45)';
      ctx.lineWidth = 1;
      roundRect(ctx, provX, provY, provW, provH, 4);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 8.5px Cinzel, serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('◈ RECORD STATUS: SHROUDED IN ABYSSAL ASH', provX + 12, provY + 7);

      ctx.fillStyle = 'rgba(100, 116, 139, 0.9)';
      ctx.font = 'italic 10px "Crimson Text", serif';
      ctx.fillText(`Requires Lore Scroll recovery from Stratum ${selectedItem ? selectedItem.floor : '?'}`, provX + 12, provY + 20);

      // Lead ash wax seal on right
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(provX + provW - 24, provY + provH / 2, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⊗', provX + provW - 24, provY + provH / 2);
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // 3. UNLOCKED NARRATIVE FOLIO READING STATE
    // ─────────────────────────────────────────────────────────────
    // Rubricated Crimson Chapter Inscription
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`— LIBER ${roman} · CODEX VANGUARDIA —`, rightX + rightFolioW / 2, ry + 158);

    // Chapter Title
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 14.5px Cinzel, serif';
    ctx.shadowColor = '#d97706';
    ctx.shadowBlur = 6;
    ctx.fillText(selectedItem.title.toUpperCase(), rightX + rightFolioW / 2, ry + 172);
    ctx.shadowBlur = 0;

    // Subtitle provenance / inscription
    ctx.fillStyle = 'rgba(217, 119, 6, 0.95)';
    ctx.font = 'italic 10px "Crimson Text", serif';
    ctx.fillText(`“${selectedItem.author}”`, rightX + rightFolioW / 2, ry + 189);

    // Ornamental Divider Line
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rightX + 24, ry + 201);
    ctx.lineTo(rightX + rightFolioW - 24, ry + 201);
    ctx.stroke();

    // Pentiment Rubricated Drop-Cap & Narrative Text
    const bodyText = selectedItem.text || '';
    const firstLetter = bodyText.charAt(0) || 'I';
    const remainingFirstParagraph = bodyText.slice(1);

    // Decorative Rubricated Drop-Cap Box (Left: 34x34 px)
    const capX = rightX + 20;
    const capY = ry + 208;
    const capSize = 34;

    ctx.fillStyle = 'rgba(185, 28, 28, 0.32)';
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1.4;
    roundRect(ctx, capX, capY, capSize, capSize, 4);
    ctx.fill(); ctx.stroke();

    // Drop-Cap Initial Letter
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 22px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(firstLetter, capX + capSize / 2, capY + capSize / 2);

    // Word wrapping beside and below Drop-Cap
    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'italic 12px "Crimson Text", serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const textNextX = capX + capSize + 10;
    const textNextW = rightFolioW - (textNextX - rightX) - 20;
    const allWords = remainingFirstParagraph.split(' ');

    let line1 = '', line2 = '', restWords = [];
    let cur = '';

    for (let i = 0; i < allWords.length; i++) {
      const test = cur ? cur + ' ' + allWords[i] : allWords[i];
      if (ctx.measureText(test).width <= textNextW) {
        cur = test;
      } else {
        if (!line1) {
          line1 = cur;
          cur = allWords[i];
        } else if (!line2) {
          line2 = cur;
          restWords = allWords.slice(i);
          break;
        }
      }
    }
    if (!line1) line1 = cur;
    else if (!line2) line2 = cur;

    ctx.fillText(line1, textNextX, capY + 2);
    if (line2) ctx.fillText(line2, textNextX, capY + 18);

    // Full width remaining lines below Drop-Cap
    const fullTextW = rightFolioW - 40;
    let fullCur = '';
    const belowLines = [];
    restWords.forEach(w => {
      const test = fullCur ? fullCur + ' ' + w : w;
      if (ctx.measureText(test).width > fullTextW) {
        if (fullCur) belowLines.push(fullCur);
        fullCur = w;
      } else {
        fullCur = test;
      }
    });
    if (fullCur) belowLines.push(fullCur);

    const startBelowY = capY + capSize + 6;
    const lineSpacing = 18;
    belowLines.forEach((bl, idx) => {
      ctx.fillText(bl, rightX + 20, startBelowY + idx * lineSpacing);
    });

    // ─────────────────────────────────────────────────────────────
    // 4. COMPACT ARCHIVAL RECORD & CANON PROVENANCE FOOTER PLATE
    // ─────────────────────────────────────────────────────────────
    const provY = ry + rh - 48;
    const provH = 38;
    const provW = rightFolioW - 40;
    const provX = rightX + 20;

    ctx.fillStyle = 'rgba(12, 16, 26, 0.85)';
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.4)';
    ctx.lineWidth = 1;
    roundRect(ctx, provX, provY, provW, provH, 4);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 8.5px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('◈ CANONICAL ARCHIVAL DEED', provX + 12, provY + 7);

    ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
    ctx.font = 'italic 10px "Crimson Text", serif';
    ctx.fillText(`Stratum Floor ${selectedItem.floor} · Recovered Lore Scroll · Vanguard Historical Record`, provX + 12, provY + 20);

    // Ruby Wax CANON Seal on right
    const sealX = provX + provW - 34;
    const sealY = provY + provH / 2;
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.arc(sealX, sealY, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 7.5px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CANON', sealX, sealY);
  },

  drawParchmentGlyphs(ctx, x, y, w, timer, baseAlpha = 0.5) {
    const glyphs = [15, 1, 4, 10, 6, 8, 3, 11, 14, 0, 7, 15, 2, 5, 12, 13];
    const pitch = 22;
    const maxCount = Math.floor(w / pitch);

    ctx.save();
    for (let i = 0; i < Math.min(glyphs.length, maxCount); i++) {
      const gIdx = glyphs[i];
      const gx = x + i * pitch;
      const pulse = Math.sin(timer * 2.0 + i * 0.4);
      ctx.fillStyle = `rgba(201, 168, 76, ${baseAlpha * (0.5 + pulse * 0.3)})`;

      const pattern = ANCIENT_GLYPHS[gIdx] || ANCIENT_GLYPHS[0];
      for (let r = 0; r < 7; r++) {
        const bits = pattern[r];
        for (let c = 0; c < 5; c++) {
          if ((bits & (1 << (4 - c))) !== 0) {
            ctx.fillRect(Math.round(gx + c * 1.5), Math.round(y + r * 1.5), 1, 1);
          }
        }
      }
    }
    ctx.restore();
  },

  // ═════════════════════════════════════════════════════════════════
  // 2. BESTIARY: MONSTER HUNTER SPECIMEN CONTAINMENT CHAMBER
  // ═════════════════════════════════════════════════════════════════
  drawBestiaryContainment(ctx, panX, ry, panW, rh, mouseX, mouseY, dt, killsMap) {
    // ── Top Horizontal Specimen Carousel (850 × 44 px) ──
    const carY = ry;
    const carH = 44;
    const carW = panW - 40;
    const carX = panX + 20;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)';
    ctx.lineWidth = 1;
    roundRect(ctx, carX, carY, carW, carH, 6);
    ctx.fill(); ctx.stroke();

    // Carousel Items
    const tokenW = 90;
    const tokenGap = 6;
    const startTokX = carX + 8;

    BESTIARY_INFO.forEach((creature, idx) => {
      const tx = startTokX + idx * (tokenW + tokenGap);
      if (tx + tokenW > carX + carW - 8) return;

      const isSel = _selectedIndex === idx;
      const isSecret = creature.isSecret || creature.id === 'absolute';
      const isUnlocked = isSecret ? SaveSystem.isSecretBestiaryUnlocked(creature.id) : ((killsMap[creature.id] || 0) > 0);
      const isHover = mouseX >= tx && mouseX <= tx + tokenW && mouseY >= carY + 4 && mouseY <= carY + carH - 4;

      ctx.fillStyle = isSel
        ? 'rgba(220, 38, 38, 0.35)'
        : (isHover ? 'rgba(30, 41, 59, 0.8)' : 'rgba(10, 15, 28, 0.6)');
      ctx.strokeStyle = isSel
        ? '#f87171'
        : (isUnlocked ? 'rgba(201, 168, 76, 0.45)' : 'rgba(71, 85, 105, 0.35)');
      ctx.lineWidth = isSel ? 1.5 : 1;
      roundRect(ctx, tx, carY + 4, tokenW, carH - 8, 4);
      ctx.fill(); ctx.stroke();

      // Slain / Threat pip
      ctx.fillStyle = isUnlocked ? (creature.col || '#f87171') : '#64748b';
      ctx.font = 'bold 8.5px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let shortName = '???';
      if (isUnlocked) {
        if (creature.id === 'warden') shortName = 'WARDEN';
        else if (creature.id === 'absolute') shortName = 'ABSOLUTE';
        else if (creature.id === 'malakor') shortName = 'MALAKOR';
        else if (creature.id === 'gorgaroth') shortName = 'GORGAROTH';
        else if (creature.id === 'skeleton') shortName = 'SKELETON';
        else if (creature.id === 'ghoul') shortName = 'GHOUL';
        else if (creature.id === 'demon') shortName = 'DEMON';
        else if (creature.id === 'wraith') shortName = 'WRAITH';
        else shortName = creature.name.replace(/,.*/, '').split(' ')[0].toUpperCase();
      }
      ctx.fillText(shortName, tx + tokenW / 2, carY + 16);

      ctx.fillStyle = isUnlocked ? '#fca5a5' : '#475569';
      ctx.font = '8px monospace';
      const kills = killsMap[creature.id] || 0;
      ctx.fillText(isUnlocked ? `☠ ${kills}` : 'LOCKED', tx + tokenW / 2, carY + 28);

      _zones.push({
        id: `bestiary_tok_${idx}`,
        x: tx, y: carY + 4, w: tokenW, h: carH - 8,
        action: () => {
          if (_selectedIndex !== idx) {
            _selectedIndex = idx;
            SoundManager.snd('menu_hover');
          }
        }
      });
    });

    // ── Chamber Split: Containment Dais (Left) + Tactical Threat Dossier (Right) ──
    const mainY = carY + carH + 10;
    const mainH = rh - carH - 10;
    const daisW = 410;
    const dossierW = panW - 40 - daisW - 14;
    const daisX = panX + 20;
    const dossierX = daisX + daisW + 14;

    const selectedCreature = BESTIARY_INFO[_selectedIndex] || BESTIARY_INFO[0];
    const isSecret = selectedCreature ? (selectedCreature.isSecret || selectedCreature.id === 'absolute') : false;
    const isUnlocked = selectedCreature
      ? (isSecret ? SaveSystem.isSecretBestiaryUnlocked(selectedCreature.id) : ((killsMap[selectedCreature.id] || 0) > 0))
      : false;
    const kills = selectedCreature ? (killsMap[selectedCreature.id] || 0) : 0;

    // ── The Abyssal Specimen Containment Dais ──
    ctx.fillStyle = 'rgba(10, 14, 28, 0.94)';
    ctx.strokeStyle = isUnlocked ? 'rgba(239, 68, 68, 0.55)' : 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1.3;
    roundRect(ctx, daisX, mainY, daisW, mainH, 8);
    ctx.fill(); ctx.stroke();

    // Runic Containment Grid Background
    const daisCenterX = daisX + daisW / 2;
    const daisCenterY = mainY + 130;

    // Pulsing containment ring
    const ringPulse = 0.5 + 0.5 * Math.sin(_ambientTimer * 2.5);
    ctx.strokeStyle = isUnlocked
      ? `rgba(239, 68, 68, ${0.25 + ringPulse * 0.25})`
      : 'rgba(51, 65, 85, 0.25)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(daisCenterX, daisCenterY + 45, 80, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(201, 168, 76, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(daisCenterX, daisCenterY + 45, 105, 0, Math.PI * 2);
    ctx.stroke();

    // Live Animated Monster Portrait Renderer (220 × 220 px)
    const portW = 210, portH = 210;
    BestiaryPortraitRenderer.drawPortrait(
      ctx,
      selectedCreature ? selectedCreature.id : 'skeleton',
      daisCenterX - portW / 2,
      mainY + 14,
      portW,
      portH,
      isUnlocked,
      _ambientTimer
    );

    // Specimen Threat & Habitat Plinth (Below Dais)
    const plinthY = mainY + 234;
    const plinthH = mainH - 242;
    ctx.fillStyle = 'rgba(18, 24, 44, 0.9)';
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
    ctx.lineWidth = 1;
    roundRect(ctx, daisX + 12, plinthY, daisW - 24, plinthH, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = isUnlocked ? (selectedCreature.threat === 'boss' ? '#ef4444' : '#f59e0b') : '#64748b';
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const threatText = isUnlocked
      ? (selectedCreature.threat === 'boss' ? '★ APOCALYPTIC BOSS THREAT ★' : 'THREAT LEVEL: HIGH RISK PREDATOR')
      : 'CLASSIFIED ENTITY · THREAT UNRECORDED';
    ctx.fillText(threatText, daisCenterX, plinthY + 10);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 9px monospace';
    const habitat = isUnlocked ? (selectedCreature.floors || 'Floors 1-3') : 'Deep Labyrinth';
    ctx.fillText(`HABITAT: ${habitat.toUpperCase()}    SLAIN: ${kills} CONQUERED`, daisCenterX, plinthY + 28);

    ctx.fillStyle = isUnlocked ? '#86efac' : '#64748b';
    ctx.fillText(`SOUL BOUNTY: ${isUnlocked ? (selectedCreature.threat === 'boss' ? '500+ Souls' : '35-75 Souls') : 'Unknown'}`, daisCenterX, plinthY + 44);

    // ── Right: Tactical Threat Dossier ──
    ctx.fillStyle = 'rgba(12, 16, 32, 0.94)';
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.5)';
    ctx.lineWidth = 1.3;
    roundRect(ctx, dossierX, mainY, dossierW, mainH, 8);
    ctx.fill(); ctx.stroke();

    // Dossier Header
    ctx.fillStyle = isUnlocked ? (selectedCreature.col || '#fde68a') : '#64748b';
    ctx.font = 'bold 15px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(isUnlocked ? selectedCreature.name.toUpperCase() : 'UNKNOWN ABYSSAL HORROR', dossierX + 18, mainY + 16);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.fillText(`TAXONOMY: ${isUnlocked ? (selectedCreature.category || 'Monstrosity').toUpperCase() : 'CLASSIFIED'}`, dossierX + 18, mainY + 36);

    ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(dossierX + 18, mainY + 52);
    ctx.lineTo(dossierX + dossierW - 18, mainY + 52);
    ctx.stroke();

    if (!isUnlocked) {
      // Locked Dossier
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 11px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚠ SPECIMEN COMBAT DOSSIER CLASSIFIED ⚠', dossierX + dossierW / 2, mainY + 100);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'italic 11.5px Crimson Text, serif';
      const msg = isSecret
        ? 'No living witness has submitted observations of this entity. Its presence was recorded only through the madness of dying wanderers in the deepest void.'
        : 'This creature has not yet been conquered in combat. Slay this specimen during your descent to decrypt its physiological vulnerabilities, attack vectors, and parry timings.';
      const lLines = this.wrapText(ctx, msg, dossierW - 40);
      lLines.forEach((l, idx) => {
        ctx.fillText(l, dossierX + dossierW / 2, mainY + 130 + idx * 18);
      });
      return;
    }

    // Physiological Vulnerabilities Callouts
    let curDossierY = mainY + 62;
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.fillText('PHYSIOLOGICAL VULNERABILITIES & AFFINITIES:', dossierX + 18, curDossierY);
    curDossierY += 15;

    // 2 Vulnerability Badges
    const badgeW = (dossierW - 44) / 2;
    const VULNS = {
      skeleton: { weak: 'WEAK: BLUNT KNOCKBACK', resist: 'RESIST: POISON / BLEED' },
      ghoul:    { weak: 'WEAK: FLANK SIDESTEP',   resist: 'RESIST: DARK MIASMA' },
      demon:    { weak: 'WEAK: CHANNEL STRIKE',   resist: 'IMMUNE: BRIMSTONE FIRE' },
      wraith:   { weak: 'WEAK: TORCHLIGHT HALO',  resist: 'PHASE: PHYSICAL WEAPONS' },
      gorgaroth:{ weak: 'WEAK: SLAM RECOVERY',    resist: 'ARMOR: TITAN CARAPACE' },
      malakor:  { weak: 'WEAK: ARRIVAL WINDOW',   resist: 'PHASE: VOID TELEPORT' },
      warden:   { weak: 'WEAK: RIFT DESTRUCTION', resist: 'SUPREME: ABYSSAL PYRES' },
      absolute: { weak: 'WEAK: REALITY ANCHOR',   resist: 'COGNITIVE DISSOLUTION' }
    };
    const vulnData = VULNS[selectedCreature.id] || { weak: 'WEAK: FLANK STRIKE', resist: 'RESIST: DARK ARMOR' };

    // Badge 1: Weak point
    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    roundRect(ctx, dossierX + 18, curDossierY, badgeW, 28, 4);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 8px monospace';
    ctx.fillText(vulnData.weak, dossierX + 24, curDossierY + 9);

    // Badge 2: Resistance
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    roundRect(ctx, dossierX + 26 + badgeW, curDossierY, badgeW, 28, 4);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#bae6fd';
    ctx.fillText(vulnData.resist, dossierX + 32 + badgeW, curDossierY + 9);

    curDossierY += 36;

    // Tactical Observation
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.fillText('TACTICAL FIELD INTELLIGENCE:', dossierX + 18, curDossierY);
    curDossierY += 15;

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'italic 11.5px Crimson Text, serif';
    const tacLines = this.wrapText(ctx, selectedCreature.tactics || 'Maintain safe distance and evade telegraphed strikes before countering.', dossierW - 36);
    tacLines.slice(0, 3).forEach((tl, idx) => {
      ctx.fillText(tl, dossierX + 18, curDossierY + idx * 16);
    });
    curDossierY += Math.min(3, tacLines.length) * 16 + 10;

    // Lore Inscription
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.fillText('INQUISITOR OBSERVATION ARCHIVE:', dossierX + 18, curDossierY);
    curDossierY += 15;

    ctx.fillStyle = 'rgba(203, 213, 225, 0.85)';
    ctx.font = 'italic 11px Crimson Text, serif';
    const loreLines = this.wrapText(ctx, selectedCreature.desc || 'An ancient entity spawned from the abyssal strata.', dossierW - 36);
    loreLines.slice(0, 4).forEach((ll, idx) => {
      ctx.fillText(ll, dossierX + 18, curDossierY + idx * 15);
    });
  },

  // ═════════════════════════════════════════════════════════════════
  // 3. MEMORIES: DEEP ASTRAL VOID OF SUSPENDED MEMORY SHARDS
  // ═════════════════════════════════════════════════════════════════
  drawMemoriesAstralVoid(ctx, panX, ry, panW, rh, mouseX, mouseY, dt) {
    const leftW = 400;
    const rightW = panW - 40 - leftW - 14;
    const leftX = panX + 20;
    const rightX = leftX + leftW + 14;

    // ── Deep Celestial Void Backdrop ──
    ctx.fillStyle = 'rgba(3, 5, 14, 0.96)';
    ctx.strokeStyle = 'rgba(147, 51, 234, 0.55)';
    ctx.lineWidth = 1.3;
    roundRect(ctx, leftX, ry, leftW, rh, 8);
    ctx.fill(); ctx.stroke();

    // Procedural Floating Cosmic Dust & Stars
    ctx.save();
    VOID_STARS.forEach((s) => {
      const sx = leftX + ((s.x + _ambientTimer * 4 * s.speed) % (leftW - 10));
      const sy = ry + ((s.y + Math.sin(_ambientTimer + s.phase) * 6) % (rh - 10));
      const alpha = 0.3 + 0.4 * Math.sin(_ambientTimer * 2.0 + s.phase);

      ctx.fillStyle = `rgba(192, 132, 252, ${alpha})`;
      ctx.fillRect(sx, sy, s.size, s.size);
    });
    ctx.restore();

    // Shard Grid Container Header
    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('✦ SUSPENDED ASTRAL MEMORY SHARDS', leftX + 16, ry + 14);

    ctx.strokeStyle = 'rgba(147, 51, 234, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftX + 16, ry + 30);
    ctx.lineTo(leftX + leftW - 20, ry + 30);
    ctx.stroke();

    // 2-Column Grid of Floating Crystalline Memory Shards
    const gridY = ry + 38;
    const shardW = 175;
    const shardH = 46;
    const colGap = 10;
    const rowGap = 6;

    const visibleRows = Math.floor((rh - 48) / (shardH + rowGap));
    const totalMemories = STORY_MEMORIES.length;
    const totalRows = Math.ceil(totalMemories / 2);
    const maxScroll = Math.max(0, totalRows - visibleRows);
    const scrollRow = Math.min(_scrollOffset > 0 ? Math.floor(_scrollOffset / 25) : 0, maxScroll);

    STORY_MEMORIES.forEach((mem, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2) - scrollRow;
      if (row < 0 || row >= visibleRows) return;

      const sx = leftX + 14 + col * (shardW + colGap);
      const floatY = Math.sin(_ambientTimer * 1.8 + idx * 0.7) * 2;
      const sy = gridY + row * (shardH + rowGap) + floatY;

      const isSel = _selectedIndex === idx;
      const isUnlocked = isMemoryUnlocked(mem.id);
      const isEnding = mem.id.startsWith('memory_ending_');
      const isLegacy = mem.id.startsWith('echo_');
      const isHover = mouseX >= sx && mouseX <= sx + shardW && mouseY >= sy && mouseY <= sy + shardH;

      // Color Theme by Type
      let themeCol = '#fde68a';
      let themeBg = 'rgba(217, 119, 6, 0.2)';
      if (isEnding) {
        themeCol = '#c084fc';
        themeBg = 'rgba(147, 51, 234, 0.25)';
      } else if (isLegacy) {
        themeCol = '#38bdf8';
        themeBg = 'rgba(14, 165, 233, 0.25)';
      }

      ctx.fillStyle = isSel
        ? themeBg
        : (isHover ? 'rgba(30, 41, 59, 0.75)' : 'rgba(10, 15, 28, 0.6)');
      ctx.strokeStyle = isSel
        ? themeCol
        : (isUnlocked ? 'rgba(168, 85, 247, 0.45)' : 'rgba(51, 65, 85, 0.35)');
      ctx.lineWidth = isSel ? 1.5 : 1;
      roundRect(ctx, sx, sy, shardW, shardH, 6);
      ctx.fill(); ctx.stroke();

      // Prismatic Facet Shimmer Icon
      const iconX = sx + 18;
      const iconY = sy + shardH / 2;
      ctx.fillStyle = isUnlocked ? themeCol : '#475569';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isUnlocked ? '✦' : '◇', iconX, iconY);

      // Title & Tag
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = isUnlocked ? themeCol : '#64748b';
      ctx.font = 'bold 7.5px Cinzel, serif';
      const typeLabel = isEnding ? 'ENDING DESTINY' : (isLegacy ? 'LEGACY ECHO' : `FLOOR ${mem.floor || '?'}`);
      ctx.fillText(isUnlocked ? typeLabel : 'DORMANT SHARD', sx + 32, sy + 8);

      ctx.fillStyle = isUnlocked ? (isSel ? '#ffffff' : '#f1f5f9') : '#475569';
      ctx.font = isSel ? 'bold 8.5px Cinzel, serif' : '8px Cinzel, serif';
      const memTitle = isUnlocked ? mem.title : 'Sealed Remembrance';
      const maxTW = shardW - 38;

      if (ctx.measureText(memTitle).width <= maxTW) {
        ctx.fillText(memTitle, sx + 32, sy + 22);
      } else {
        // Wrap cleanly across 2 lines without truncation
        const words = memTitle.split(' ');
        let l1 = '';
        let l2 = '';
        for (let wi = 0; wi < words.length; wi++) {
          const test = l1 ? l1 + ' ' + words[wi] : words[wi];
          if (ctx.measureText(test).width <= maxTW) {
            l1 = test;
          } else {
            l2 = words.slice(wi).join(' ');
            break;
          }
        }
        if (!l1) { l1 = words[0]; l2 = words.slice(1).join(' '); }
        ctx.fillText(l1, sx + 32, sy + 19);
        ctx.fillText(l2, sx + 32, sy + 30);
      }

      _zones.push({
        id: `memory_shard_${idx}`,
        x: sx, y: sy, w: shardW, h: shardH,
        action: () => {
          if (_selectedIndex !== idx) {
            _selectedIndex = idx;
            _memoryTransition = 0;
            SoundManager.snd('menu_hover');
          }
        }
      });
    });

    // ── Right: Projected Stela of Remembrance ──
    ctx.fillStyle = 'rgba(8, 12, 24, 0.94)';
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
    ctx.lineWidth = 1.3;
    roundRect(ctx, rightX, ry, rightW, rh, 8);
    ctx.fill(); ctx.stroke();

    const selectedMem = STORY_MEMORIES[_selectedIndex] || STORY_MEMORIES[0];
    const isUnlocked = selectedMem ? isMemoryUnlocked(selectedMem.id) : false;

    if (!selectedMem || !isUnlocked) {
      // Locked Memory Stela
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 13px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('DORMANT ASTRAL MEMORY SHARD', rightX + rightW / 2, ry + rh / 2 - 25);

      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.font = 'italic 11.5px Crimson Text, serif';
      const msg = 'This memory shard remains frozen in the astral void. Ascend deeper into the crucible, confront the floor wardens, and unlock new fates to illuminate Rowan\'s recollections.';
      const lines = this.wrapText(ctx, msg, rightW - 60);
      lines.forEach((l, idx) => {
        ctx.fillText(l, rightX + rightW / 2, ry + rh / 2 + 5 + idx * 18);
      });
      return;
    }

    // Unlocked Stela Projection
    const transAlpha = Math.min(1, Math.max(0.1, _memoryTransition));
    ctx.save();
    ctx.globalAlpha = transAlpha;

    // Scene Thumbnail Preview Frame (220 × 110 px)
    const thW = 220;
    const thH = 110;
    const thX = rightX + Math.round((rightW - thW) / 2);
    const thY = ry + 14;

    BestiaryPortraitRenderer.drawMemoryThumbnail(
      ctx,
      selectedMem.sceneType,
      thX,
      thY,
      thW,
      thH,
      isUnlocked,
      _ambientTimer
    );

    let curY = thY + thH + 10;

    // Chronology Subtitle
    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(selectedMem.chronology ? selectedMem.chronology.toUpperCase() : 'JOURNEY RECOLLECTION', rightX + rightW / 2, curY);
    curY += 15;

    // Title
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 14px Cinzel, serif';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 6;
    ctx.fillText(selectedMem.title, rightX + rightW / 2, curY);
    ctx.shadowBlur = 0;
    curY += 20;

    // Spoken Quote (if present)
    if (selectedMem.quote) {
      ctx.fillStyle = '#fef08a';
      ctx.font = 'italic 11.5px Crimson Text, serif';
      const qLines = this.wrapText(ctx, selectedMem.quote, rightW - 40);
      qLines.forEach((ql) => {
        ctx.fillText(ql, rightX + rightW / 2, curY);
        curY += 15;
      });
      curY += 4;
    }

    // Divider
    ctx.strokeStyle = 'rgba(147, 51, 234, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rightX + 24, curY);
    ctx.lineTo(rightX + rightW - 24, curY);
    ctx.stroke();
    curY += 8;

    // Narrative Recollection
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.fillText('NARRATIVE RECOLLECTION:', rightX + 20, curY);
    curY += 14;

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px Crimson Text, serif';
    const lLines = this.wrapText(ctx, selectedMem.lore || '', rightW - 40);
    lLines.slice(0, 4).forEach((ll) => {
      ctx.fillText(ll, rightX + 20, curY);
      curY += 15;
    });

    if (selectedMem.significance) {
      curY += 4;
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9px Cinzel, serif';
      ctx.fillText('CRUCIBLE SIGNIFICANCE:', rightX + 20, curY);
      curY += 14;

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'italic 10.5px Crimson Text, serif';
      const sLines = this.wrapText(ctx, selectedMem.significance, rightW - 40);
      sLines.slice(0, 2).forEach((sl) => {
        ctx.fillText(sl, rightX + 20, curY);
        curY += 14;
      });
    }

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
      closeCodex();
      return true;
    }
    if (key === 'Tab') {
      const tabs = ['lore', 'bestiary', 'memories'];
      const idx = (tabs.indexOf(_activeTab) + 1) % tabs.length;
      this.setTab(tabs[idx]);
      SoundManager.snd('menu_select');
      return true;
    }
    if (key === '1') {
      this.setTab('lore');
      SoundManager.snd('menu_select');
      return true;
    }
    if (key === '2') {
      this.setTab('bestiary');
      SoundManager.snd('menu_select');
      return true;
    }
    if (key === '3') {
      this.setTab('memories');
      SoundManager.snd('menu_select');
      return true;
    }
    if (key === 'ArrowUp' || key === 'ArrowLeft') {
      const total = _activeTab === 'lore'
        ? LORE_SCROLLS_DATA.filter(l => l.floor >= 1 && l.floor <= 10 && l.revealedAt !== 'legacy').length
        : (_activeTab === 'bestiary' ? BESTIARY_INFO.length : STORY_MEMORIES.length);
      _selectedIndex = (_selectedIndex - 1 + total) % total;
      SoundManager.snd('menu_hover');
      return true;
    }
    if (key === 'ArrowDown' || key === 'ArrowRight') {
      const total = _activeTab === 'lore'
        ? LORE_SCROLLS_DATA.filter(l => l.floor >= 1 && l.floor <= 10 && l.revealedAt !== 'legacy').length
        : (_activeTab === 'bestiary' ? BESTIARY_INFO.length : STORY_MEMORIES.length);
      _selectedIndex = (_selectedIndex + 1) % total;
      SoundManager.snd('menu_hover');
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
    const panW = 890, panH = 520;
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
