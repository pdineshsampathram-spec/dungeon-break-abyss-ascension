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
import {
  drawStoneButton,
  drawStoneTab,
  drawStonePanel,
  drawStoneCard,
  drawChamferedPanel,
  drawCornerBrackets
} from './ButtonArtManager.js?v=2.0';

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

    const panW = Math.min(880, LW - 24);
    const panH = Math.min(520, LH - 24);
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
    drawStonePanel(ctx, panX, panY, panW, panH, {
      bevelColor: _activeTab === 'lore' ? 'gold' : (_activeTab === 'bestiary' ? 'crimson' : 'violet'),
      chamfer: 12,
      headerHeight: 0
    });
    drawCornerBrackets(ctx, panX + 4, panY + 4, panW - 8, panH - 8, 20);

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

      drawStoneTab(ctx, tabX, badgeY, t.w, 26, {
        label: t.label,
        icon: t.icon,
        isActive: isSel,
        isHover,
        accentColor: t.id === 'lore' ? 'gold' : (t.id === 'bestiary' ? 'crimson' : 'violet'),
        chamfer: 4
      });

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

    drawStoneButton(ctx, '◈ RETURN ( Esc )', retX, botY, retW, retH, {
      isHover: isHoverRet,
      isSelected: false,
      variant: 'primary',
      fontSize: '9.5px Cinzel, serif'
    });

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
    drawStonePanel(ctx, leftX, ry, leftFolioW, rh, { bevelColor: 'bronze', chamfer: 8, headerHeight: 0 });

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

      drawStoneCard(ctx, leftX + 12, iy, leftFolioW - 26, itemH, {
        isHover,
        isSelected: isSel,
        isLocked: !isUnlocked,
        accentColor: 'gold',
        chamfer: 5
      });

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
    drawStonePanel(ctx, rightX, ry, rightFolioW, rh, { bevelColor: 'gold', chamfer: 8, headerHeight: 0 });

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

    drawStonePanel(ctx, carX, carY, carW, carH, { bevelColor: 'bronze', chamfer: 6, headerHeight: 0 });

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

      drawStoneCard(ctx, tx, carY + 4, tokenW, carH - 8, {
        isHover,
        isSelected: isSel,
        isLocked: !isUnlocked,
        accentColor: 'crimson',
        chamfer: 4
      });

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
    drawStonePanel(ctx, daisX, mainY, daisW, mainH, {
      bevelColor: isUnlocked ? 'crimson' : 'bronze',
      chamfer: 8,
      headerHeight: 0
    });

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
    drawStoneCard(ctx, daisX + 12, plinthY, daisW - 24, plinthH, {
      isHover: false,
      isSelected: false,
      accentColor: 'crimson',
      chamfer: 6
    });

    const isAbsolute = selectedCreature && selectedCreature.id === 'absolute';
    const threatCol = isUnlocked ? (isAbsolute ? '#ef4444' : (selectedCreature.threat === 'boss' || selectedCreature.threat === 'Arch-Demon' || selectedCreature.threat === 'Major Boss' ? '#ef4444' : '#f59e0b')) : '#64748b';
    ctx.fillStyle = threatCol;
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    let threatText = 'CLASSIFIED ENTITY · THREAT UNRECORDED';
    if (isUnlocked) {
      if (isAbsolute) threatText = '★ ANOMALOUS COSMIC PHENOMENON ★';
      else if (selectedCreature.threat === 'boss' || selectedCreature.threat === 'Arch-Demon' || selectedCreature.threat === 'Major Boss') threatText = '★ APOCALYPTIC BOSS THREAT ★';
      else threatText = 'THREAT LEVEL: HIGH RISK PREDATOR';
    }
    ctx.fillText(threatText, daisCenterX, plinthY + 10);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 9px monospace';
    let habitatText = 'Deep Labyrinth';
    if (isUnlocked) {
      if (isAbsolute) habitatText = 'HABITAT: FRACTURED SANITY    SLAIN: 0 (WITNESSED ONLY)';
      else habitatText = `HABITAT: ${(selectedCreature.floors || 'Floors 1-3').toUpperCase()}    SLAIN: ${kills} CONQUERED`;
    }
    ctx.fillText(habitatText, daisCenterX, plinthY + 28);

    ctx.fillStyle = isUnlocked ? '#86efac' : '#64748b';
    let bountyText = 'SOUL BOUNTY: Unknown';
    if (isUnlocked) {
      if (isAbsolute) bountyText = 'SOUL BOUNTY: [ INDETERMINATE / NON-CORPOREAL ]';
      else if (selectedCreature.threat === 'boss' || selectedCreature.threat === 'Arch-Demon' || selectedCreature.threat === 'Major Boss') bountyText = 'SOUL BOUNTY: 500+ Souls';
      else bountyText = 'SOUL BOUNTY: 35-75 Souls';
    }
    ctx.fillText(bountyText, daisCenterX, plinthY + 44);

    // ── Right: Tactical Threat Dossier ──
    drawStonePanel(ctx, dossierX, mainY, dossierW, mainH, {
      bevelColor: 'gold',
      chamfer: 8,
      headerHeight: 0
    });

    // Dossier Header
    ctx.fillStyle = isUnlocked ? (selectedCreature.col || '#fde68a') : '#64748b';
    ctx.font = 'bold 15px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(isUnlocked ? selectedCreature.name.toUpperCase() : 'UNKNOWN ABYSSAL HORROR', dossierX + 18, mainY + 16);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 9px Cinzel, serif';
    const taxText = isUnlocked ? (isAbsolute ? '[ UNCLASSIFIED / OBSCURED ]' : (selectedCreature.category || 'Monstrosity').toUpperCase()) : 'CLASSIFIED';
    ctx.fillText(`TAXONOMY: ${taxText}`, dossierX + 18, mainY + 36);

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
      ctx.font = 'italic 12px Crimson Text, serif';
      const msg = isSecret
        ? 'No living witness has submitted observations of this entity. Its presence was recorded only through the madness of dying wanderers in the deepest void.'
        : 'This creature has not yet been conquered in combat. Slay this specimen during your descent to decrypt its physiological vulnerabilities, attack vectors, and parry timings.';
      const lLines = this.wrapText(ctx, msg, dossierW - 44);
      lLines.forEach((l, idx) => {
        ctx.fillText(l, dossierX + dossierW / 2, mainY + 130 + idx * 18);
      });
      return;
    }

    // Physiological Vulnerabilities / Fragment Callouts
    let curDossierY = mainY + 62;
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.fillText(isAbsolute ? 'DECIPHERED ARCHIVE FRAGMENTS:' : 'PHYSIOLOGICAL VULNERABILITIES & AFFINITIES:', dossierX + 18, curDossierY);
    curDossierY += 15;

    // 2 Callout Badges
    const badgeW = (dossierW - 44) / 2;
    const VULNS = {
      skeleton: { weak: 'WEAK: BLUNT KNOCKBACK', resist: 'RESIST: POISON / BLEED' },
      ghoul:    { weak: 'WEAK: FLANK SIDESTEP',   resist: 'RESIST: DARK MIASMA' },
      demon:    { weak: 'WEAK: CHANNEL STRIKE',   resist: 'IMMUNE: BRIMSTONE FIRE' },
      wraith:   { weak: 'WEAK: TORCHLIGHT HALO',  resist: 'PHASE: PHYSICAL WEAPONS' },
      gorgaroth:{ weak: 'WEAK: SLAM RECOVERY',    resist: 'ARMOR: TITAN CARAPACE' },
      malakor:  { weak: 'WEAK: ARRIVAL WINDOW',   resist: 'PHASE: VOID TELEPORT' },
      warden:   { weak: 'WEAK: RIFT DESTRUCTION', resist: 'SUPREME: ABYSSAL PYRES' },
      absolute: { weak: 'ORIGIN: [ERA LOST / EXPUNGED]', resist: 'ANATOMY: [NON-CORPOREAL GAZE]' }
    };
    const vulnData = VULNS[selectedCreature.id] || { weak: 'WEAK: FLANK STRIKE', resist: 'RESIST: DARK ARMOR' };

    // Badge 1: Weak point / Fragment 1
    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    roundRect(ctx, dossierX + 18, curDossierY, badgeW, 28, 4);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 8px monospace';
    ctx.fillText(vulnData.weak, dossierX + 24, curDossierY + 9);

    // Badge 2: Resistance / Fragment 2
    ctx.fillStyle = isAbsolute ? 'rgba(168, 85, 247, 0.15)' : 'rgba(56, 189, 248, 0.15)';
    ctx.strokeStyle = isAbsolute ? 'rgba(168, 85, 247, 0.5)' : 'rgba(56, 189, 248, 0.5)';
    roundRect(ctx, dossierX + 26 + badgeW, curDossierY, badgeW, 28, 4);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = isAbsolute ? '#e9d5ff' : '#bae6fd';
    ctx.fillText(vulnData.resist, dossierX + 32 + badgeW, curDossierY + 9);

    curDossierY += 36;

    // Tactical Observation / Field Intelligence
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.fillText(isAbsolute ? 'SURVIVING FIELD INTELLIGENCE:' : 'TACTICAL FIELD INTELLIGENCE:', dossierX + 18, curDossierY);
    curDossierY += 15;

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'italic 12px Crimson Text, serif';
    const tacLines = this.wrapText(ctx, selectedCreature.tactics || 'Maintain safe distance and evade telegraphed strikes before countering.', dossierW - 40);
    tacLines.slice(0, 3).forEach((tl, idx) => {
      ctx.fillText(tl, dossierX + 18, curDossierY + idx * 17);
    });
    curDossierY += Math.min(3, tacLines.length) * 17 + 10;

    // Lore Inscription / Surviving Epigraph
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.fillText(isAbsolute ? 'ANCIENT ARCHIVAL EPIGRAPH:' : 'INQUISITOR OBSERVATION ARCHIVE:', dossierX + 18, curDossierY);
    curDossierY += 15;

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'italic 11.5px Crimson Text, serif';
    const loreLines = this.wrapText(ctx, selectedCreature.desc || 'An ancient entity spawned from the abyssal strata.', dossierW - 40);
    loreLines.slice(0, 4).forEach((ll, idx) => {
      ctx.fillText(ll, dossierX + 18, curDossierY + idx * 16);
    });
  },

  // ═════════════════════════════════════════════════════════════════
  // 3. MEMORIES: ANCIENT VAULT OF RECOVERED RECOLLECTIONS
  // ═════════════════════════════════════════════════════════════════
  drawMemoriesAstralVoid(ctx, panX, ry, panW, rh, mouseX, mouseY, dt) {
    const isReducedMotion = !!(GameState.settings && GameState.settings.reducedMotion) || !!GameState.REDUCED_MOTION;
    const leftW = 400;
    const rightW = panW - 40 - leftW - 14;
    const leftX = panX + 20;
    const rightX = leftX + leftW + 14;

    // ── Left: Vault Archive Repository (Abyss-Stone Chassis) ──
    drawStonePanel(ctx, leftX, ry, leftW, rh, { bevelColor: 'violet', chamfer: 8, headerHeight: 0 });

    // Subtle stable background gradient
    const leftVig = ctx.createLinearGradient(leftX, ry, leftX, ry + rh);
    leftVig.addColorStop(0, 'rgba(88, 28, 135, 0.08)');
    leftVig.addColorStop(0.5, 'rgba(15, 23, 42, 0.02)');
    leftVig.addColorStop(1, 'rgba(10, 15, 30, 0.12)');
    ctx.fillStyle = leftVig;
    ctx.fillRect(leftX + 2, ry + 2, leftW - 4, rh - 4);

    // Repository Header
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('◈ ARCHIVE OF RECOVERED RECOLLECTIONS ◈', leftX + 16, ry + 12);

    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.font = 'italic 9px Crimson Text, serif';
    ctx.fillText('Vault of Preserved Memories & Crucible Fates', leftX + 16, ry + 26);

    ctx.strokeStyle = 'rgba(147, 51, 234, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftX + 16, ry + 38);
    ctx.lineTo(leftX + leftW - 16, ry + 38);
    ctx.stroke();

    // 2-Column Grid of Stable, Grounded Archive Cards
    const gridY = ry + 44;
    const shardW = 176;
    const shardH = 48;
    const colGap = 10;
    const rowGap = 7;

    const visibleRows = Math.floor((rh - 56) / (shardH + rowGap));
    const totalMemories = STORY_MEMORIES.length;
    const totalRows = Math.ceil(totalMemories / 2);
    const maxScroll = Math.max(0, totalRows - visibleRows);
    const scrollRow = Math.min(_scrollOffset > 0 ? Math.floor(_scrollOffset / 25) : 0, maxScroll);

    STORY_MEMORIES.forEach((mem, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2) - scrollRow;
      if (row < 0 || row >= visibleRows) return;

      const sx = leftX + 14 + col * (shardW + colGap);
      // Stable, dignified positioning without hypnotic floating or drifting
      const sy = gridY + row * (shardH + rowGap);

      const isSel = _selectedIndex === idx;
      const isUnlocked = isMemoryUnlocked(mem.id);
      const isEnding = mem.id.startsWith('memory_ending_');
      const isLegacy = mem.id.startsWith('echo_');
      const isHover = mouseX >= sx && mouseX <= sx + shardW && mouseY >= sy && mouseY <= sy + shardH;

      // Color Theme by Type
      let themeCol = '#fde68a';
      if (isEnding) {
        themeCol = '#c084fc';
      } else if (isLegacy) {
        themeCol = '#38bdf8';
      }

      drawStoneCard(ctx, sx, sy, shardW, shardH, {
        isHover,
        isSelected: isSel,
        isLocked: !isUnlocked,
        accentColor: isEnding ? 'violet' : (isLegacy ? 'azure' : 'gold'),
        chamfer: 5
      });

      // Prismatic Facet Icon
      const iconX = sx + 16;
      const iconY = sy + shardH / 2;
      ctx.fillStyle = isUnlocked ? themeCol : '#475569';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isUnlocked ? '✦' : '◇', iconX, iconY);

      // Title & Category Tag
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = isUnlocked ? themeCol : '#64748b';
      ctx.font = 'bold 7.5px Cinzel, serif';
      const typeLabel = isEnding ? 'ENDING FATE' : (isLegacy ? 'LEGACY ECHO' : `STRATUM ${mem.floor || '?'}`);
      ctx.fillText(isUnlocked ? typeLabel : 'SEALED VAULT', sx + 28, sy + 7);

      ctx.fillStyle = isUnlocked ? (isSel ? '#ffffff' : '#f1f5f9') : '#475569';
      ctx.font = isSel ? 'bold 8.5px Cinzel, serif' : '8px Cinzel, serif';
      const memTitle = isUnlocked ? mem.title : 'Dormant Remembrance';
      const maxTW = shardW - 34;

      if (ctx.measureText(memTitle).width <= maxTW) {
        ctx.fillText(memTitle, sx + 28, sy + 21);
      } else {
        // Multi-line wrap
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
        ctx.fillText(l1, sx + 28, sy + 18);
        ctx.fillText(l2, sx + 28, sy + 29);
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

    // ── Right: Inscribed Stela of Remembrance ──
    drawStonePanel(ctx, rightX, ry, rightW, rh, { bevelColor: 'violet', chamfer: 8, headerHeight: 0 });

    const selectedMem = STORY_MEMORIES[_selectedIndex] || STORY_MEMORIES[0];
    const isUnlocked = selectedMem ? isMemoryUnlocked(selectedMem.id) : false;

    if (!selectedMem || !isUnlocked) {
      // Locked Memory Stela
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 13px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SEALED ARCHIVAL VAULT', rightX + rightW / 2, ry + rh / 2 - 25);

      ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
      ctx.font = 'italic 11.5px Crimson Text, serif';
      const msg = 'This memory remains sealed within ancient subterranean vaults. Ascend deeper into the crucible, confront the floor wardens, and unlock new fates to illuminate Rowan\'s recollections.';
      const lines = this.wrapText(ctx, msg, rightW - 60);
      lines.forEach((l, idx) => {
        ctx.fillText(l, rightX + rightW / 2, ry + rh / 2 + 5 + idx * 18);
      });
      return;
    }

    // Unlocked Stela Projection
    const transAlpha = isReducedMotion ? 1.0 : Math.min(1, Math.max(0.1, _memoryTransition));
    ctx.save();
    ctx.globalAlpha = transAlpha;

    // Stable Scene Thumbnail Preview Frame (260 × 124 px)
    const thW = 260;
    const thH = 124;
    const thX = rightX + Math.round((rightW - thW) / 2);
    const thY = ry + 12;

    ctx.save();
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.5)';
    ctx.lineWidth = 1.2;
    roundRect(ctx, thX - 2, thY - 2, thW + 4, thH + 4, 5);
    ctx.stroke();
    ctx.restore();

    BestiaryPortraitRenderer.drawMemoryThumbnail(
      ctx,
      selectedMem.sceneType,
      thX,
      thY,
      thW,
      thH,
      isUnlocked,
      isReducedMotion ? 0 : _ambientTimer
    );

    let curY = thY + thH + 10;

    // Chronology Subtitle Pill
    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 8.5px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(selectedMem.chronology ? selectedMem.chronology.toUpperCase() : 'JOURNEY RECOLLECTION', rightX + rightW / 2, curY);
    curY += 14;

    // Title
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 13.5px Cinzel, serif';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 5;
    ctx.fillText(selectedMem.title, rightX + rightW / 2, curY);
    ctx.shadowBlur = 0;
    curY += 18;

    // Spoken Quote (if present)
    if (selectedMem.quote) {
      ctx.fillStyle = '#fef08a';
      ctx.font = 'italic 11px Crimson Text, serif';
      const qLines = this.wrapText(ctx, selectedMem.quote, rightW - 44);
      qLines.forEach((ql) => {
        ctx.fillText(ql, rightX + rightW / 2, curY);
        curY += 14;
      });
      curY += 4;
    }

    // Symmetrical Divider
    ctx.strokeStyle = 'rgba(147, 51, 234, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rightX + 24, curY);
    ctx.lineTo(rightX + rightW - 24, curY);
    ctx.stroke();
    curY += 8;

    // Narrative Recollection
    ctx.textAlign = 'left';
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.fillText('NARRATIVE RECOLLECTION:', rightX + 20, curY);
    curY += 14;

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11.5px Crimson Text, serif';
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
      ctx.font = 'italic 11px Crimson Text, serif';
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
    const panW = Math.min(880, LW - 24), panH = Math.min(520, LH - 24);
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
  drawStonePanel(ctx, mx, my, mw, mh, { bevelColor: 'gold', chamfer: 10, headerHeight: 0 });
  drawCornerBrackets(ctx, mx + 4, my + 4, mw - 8, mh - 8, 14);

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

  drawStonePanel(ctx, panX, panY, panW, panH, { bevelColor: 'gold', chamfer: 12, headerHeight: 0 });
  drawCornerBrackets(ctx, panX + 4, panY + 4, panW - 8, panH - 8, 16);

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
  const mouseX = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.mx : -999;
  const mouseY = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.my : -999;

  // Choice A
  if (GameState.ACTIVE_MEMORY_ECHO.choiceA) {
    const isHoverA = mouseX >= btn1X && mouseX <= btn1X + btnW && mouseY >= btnY && mouseY <= btnY + btnH;
    drawStoneButton(ctx, GameState.ACTIVE_MEMORY_ECHO.choiceA.label, btn1X, btnY, btnW, btnH, {
      variant: 'normal',
      isHover: isHoverA,
      fontSize: '11px Cinzel, serif'
    });
    ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
    ctx.font = '10px Crimson Text, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(GameState.ACTIVE_MEMORY_ECHO.choiceA.desc, btn1X + btnW / 2, btnY + 32);
  }

  // Choice B
  if (GameState.ACTIVE_MEMORY_ECHO.choiceB) {
    const isHoverB = mouseX >= btn2X && mouseX <= btn2X + btnW && mouseY >= btnY && mouseY <= btnY + btnH;
    drawStoneButton(ctx, GameState.ACTIVE_MEMORY_ECHO.choiceB.label, btn2X, btnY, btnW, btnH, {
      variant: 'gift',
      isHover: isHoverB,
      fontSize: '11px Cinzel, serif'
    });
    ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
    ctx.font = '10px Crimson Text, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(GameState.ACTIVE_MEMORY_ECHO.choiceB.desc, btn2X + btnW / 2, btnY + 32);
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
