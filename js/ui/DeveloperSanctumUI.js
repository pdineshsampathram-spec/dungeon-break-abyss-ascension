// =====================================================================
//  DUNGEON BREAK — js/ui/DeveloperSanctumUI.js
//  THE DEVELOPER SANCTUM
//  Secret Developer Chamber · Controlled Floor Deployment · Loadout Selection
//  Cinematic Archive Replay · Speedrun & Achievement Isolation
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { LW, LH, roundRect } from '../core/Constants.js';
import { SoundManager } from '../audio/AudioManager.js';
import { MusicManager } from '../audio/MusicManager.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { RunResetManager } from '../systems/RunResetManager.js';
import { drawPixelEye } from '../cinematics/ShatteredMindCinematic.js';
import { FLOOR_CONFIG, isBossFloor } from '../data/floors.js';
import { WEAPON_TYPES, WEAPON_KEYS } from '../weapons/WeaponRegistry.js';
import { RARITIES } from '../data/weapons.js';
import { WeaponFactory } from '../weapons/WeaponFactory.js';
import { ARCHIVE_CINEMATICS } from './CinematicArchiveUI.js';
import { CinematicReplayContext } from '../cinematics/CinematicReplayContext.js';
import { InputManager } from '../core/InputManager.js';
import {
  ButtonArtManager,
  drawStoneButton,
  drawStoneTab,
  drawStoneCard,
  drawStonePanel,
  drawStoneSlider,
  drawStoneDivider,
  drawStoneBadge,
  drawCornerBrackets,
  drawChamferedPanel
} from './ButtonArtManager.js?v=2.0';

// Authoritative Passwords
export const SANCTUM_FALLBACK_PASSWORD = '090329';
export const SANCTUM_PERMANENT_PASSWORD = 'SANCTUM10';

let _gateOpen = false;
let _sanctumOpen = false;
let _deployConfirmOpen = false;

// Gate Input State
let _inputPassword = '';
let _gateFeedback = '';
let _gateFeedbackColor = '#94a3b8';
let _cursorTimer = 0;

// Sanctum Navigation State
let _activeTab = 'floors'; // 'floors' | 'cinematics' | 'loadout' | 'config' | 'status'
let _selectedFloor = 1;
let _selectedWeaponId = 'sword';
let _selectedRarity = 'Common';
let _selectedMaxHp = 50; // Range: 1 <= maxHp <= 50, default 50
let _selectedCinematicIdx = 0;
let _cinematicCategory = 'all';
let _cinematicScrollOffset = 0;
let _wheelAccumulator = 0;
let _isDraggingScrollbar = false;
let _scrollbarDragOffsetY = 0;

function _getFilteredCinematics() {
  return ARCHIVE_CINEMATICS.filter(item => {
    if (_cinematicCategory === 'story') {
      return item.category === 'prologue' || item.category === 'bosses';
    }
    if (_cinematicCategory === 'endings') {
      return item.category === 'endings' || item.category === 'abyss' || item.category === 'special' || item.id === 'epilogue_unmeasured_hour';
    }
    return true; // 'all'
  });
}

// Cached preview weapon to avoid 60fps object allocations and name rolling
let _cachedPreviewWep = null;
function _getPreviewWeapon() {
  if (!_cachedPreviewWep || _cachedPreviewWep.id !== _selectedWeaponId || _cachedPreviewWep.rarity.name !== _selectedRarity) {
    _cachedPreviewWep = WeaponFactory.create(_selectedWeaponId, _selectedRarity);
  }
  return _cachedPreviewWep;
}

// Atmospheric Particles for Sanctum Chamber
let _sanctumParticles = [];
function _initSanctumParticles() {
  if (_sanctumParticles.length === 0) {
    for (let i = 0; i < 30; i++) {
      _sanctumParticles.push({
        x: Math.random() * LW,
        y: Math.random() * LH,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -0.15 - Math.random() * 0.25,
        r: 1.0 + Math.random() * 1.5,
        alpha: 0.15 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2
      });
    }
  }
}

// Click zones registry
let _clickZones = [];

export const DeveloperSanctumUI = {
  isGateOpen() {
    return _gateOpen;
  },

  isOpen() {
    return _sanctumOpen;
  },

  isAuthorized() {
    return SaveSystem.isSanctumPermanentUnlocked() || !!GameState.SANCTUM_TEMP_AUTHORIZED;
  },

  isDeployConfirmOpen() {
    return _deployConfirmOpen;
  },
  openDeployConfirm() {
    _deployConfirmOpen = true;
    SoundManager.snd('panel_open');
  },
  closeDeployConfirm() {
    _deployConfirmOpen = false;
    SoundManager.snd('panel_close');
  },
  selectFloor(f) {
    if (f >= 1 && f <= 10) _selectedFloor = f;
  },
  selectWeapon(id, rarity) {
    if (id) _selectedWeaponId = id;
    if (rarity) _selectedRarity = rarity;
    _cachedPreviewWep = null;
  },
  selectMaxHp(hp) {
    if (typeof hp === 'number') _selectedMaxHp = Math.max(1, Math.min(50, Math.round(hp)));
  },
  getSelectedConfig() {
    return {
      floor: _selectedFloor,
      weaponId: _selectedWeaponId,
      rarity: _selectedRarity,
      maxHp: _selectedMaxHp
    };
  },
  getActiveTab() {
    return _activeTab;
  },
  setActiveTab(tab) {
    _activeTab = tab;
  },
  setPassword(pw) {
    _inputPassword = pw || '';
  },
  getPassword() {
    return _inputPassword;
  },
  getFilteredCinematics() {
    return _getFilteredCinematics();
  },
  getCinematicCategory() {
    return _cinematicCategory;
  },
  setCinematicCategory(cat) {
    _cinematicCategory = cat;
    _selectedCinematicIdx = 0;
    _cinematicScrollOffset = 0;
  },
  getSelectedCinematicIndex() {
    return _selectedCinematicIdx;
  },
  selectCinematic(cinematicId) {
    _activeTab = 'cinematics';
    const item = ARCHIVE_CINEMATICS.find(c => c.id === cinematicId);
    if (!item) return false;

    // Check if item is in current filtered list, otherwise switch category
    let filtered = _getFilteredCinematics();
    let idx = filtered.findIndex(c => c.id === cinematicId);
    if (idx === -1) {
      if (cinematicId === 'epilogue_unmeasured_hour') {
        _cinematicCategory = 'endings';
      } else {
        _cinematicCategory = 'all';
      }
      filtered = _getFilteredCinematics();
      idx = filtered.findIndex(c => c.id === cinematicId);
    }
    if (idx !== -1) {
      _selectedCinematicIdx = idx;
      const h = LH - 114 - 34 - 18;
      const itemH = 34, itemGap = 5;
      const maxVisible = Math.floor((h - 80) / (itemH + itemGap));
      if (_selectedCinematicIdx < _cinematicScrollOffset) {
        _cinematicScrollOffset = _selectedCinematicIdx;
      } else if (_selectedCinematicIdx >= _cinematicScrollOffset + maxVisible) {
        _cinematicScrollOffset = _selectedCinematicIdx - maxVisible + 1;
      }
      return true;
    }
    return false;
  },
  playCinematic(cinematicId) {
    const item = ARCHIVE_CINEMATICS.find(c => c.id === cinematicId);
    if (item && typeof item.startReplay === 'function') {
      _sanctumOpen = false;
      item.startReplay(() => {
        DeveloperSanctumUI.openSanctum();
      });
      return true;
    }
    return false;
  },
  handleWheel(deltaY) {
    if (!_sanctumOpen) return;
    if (_activeTab === 'cinematics') {
      const filtered = _getFilteredCinematics();
      const itemH = 34;
      const itemGap = 5;
      const h = LH - 114 - 34 - 18;
      const maxVisible = Math.floor((h - 80) / (itemH + itemGap));
      const maxScroll = Math.max(0, filtered.length - maxVisible);
      if (maxScroll > 0) {
        _wheelAccumulator += deltaY;
        const threshold = 32;
        if (Math.abs(_wheelAccumulator) >= threshold) {
          const steps = Math.trunc(_wheelAccumulator / threshold);
          _wheelAccumulator -= steps * threshold;
          const newOffset = Math.max(0, Math.min(maxScroll, _cinematicScrollOffset + steps));
          if (newOffset !== _cinematicScrollOffset) {
            _cinematicScrollOffset = newOffset;
            SoundManager.snd('menu_hover');
          }
        }
      }
    }
  },

  /** Open the Gate Password Dialog from Main Menu */
  openGate() {
    // If already authorized (permanent consecration or active temporary session), enter directly
    if (this.isAuthorized()) {
      this.openSanctum();
      return;
    }

    SoundManager.snd('panel_open');
    _gateOpen = true;
    _sanctumOpen = false;
    _deployConfirmOpen = false;
    _inputPassword = '';
    _gateFeedback = '';
    _gateFeedbackColor = '#94a3b8';

    if (SaveSystem.isSanctumPermanentEligible()) {
      _gateFeedback = 'The Last Witness has been acknowledged. Enter the cipher revealed at dawn.';
      _gateFeedbackColor = '#a78bfa';
    } else if (SaveSystem.isSanctumFallbackConsumed()) {
      _gateFeedback = 'One-time fallback exhausted. Complete The Last Witness & Gift to consecrate.';
      _gateFeedbackColor = '#f87171';
    } else {
      _gateFeedback = 'Enter the ancient cipher to break the seal.';
      _gateFeedbackColor = '#94a3b8';
    }
  },

  closeGate() {
    _gateOpen = false;
    SoundManager.snd('panel_close');
  },

  /** Open the full Sanctum Chamber directly */
  openSanctum() {
    _gateOpen = false;
    _sanctumOpen = true;
    _deployConfirmOpen = false;
    _initSanctumParticles();
    GameState.setState(GameStates.DEVELOPER_SANCTUM);
    SoundManager.snd('menu_select');
  },

  closeSanctum() {
    _sanctumOpen = false;
    _deployConfirmOpen = false;
    SoundManager.snd('panel_close');
    GameState.setState(GameStates.TITLE);
  },

  /** Safe return to Sanctum during active session (e.g. from Pause Menu) */
  openFromGameplay() {
    if (!this.isAuthorized()) {
      console.warn('[DeveloperSanctumUI] Unauthorized access attempt from gameplay.');
      return;
    }
    console.log('[DeveloperSanctumUI] Returning cleanly to Developer Sanctum from active gameplay.');
    GameState.clearLevelEntities();
    GameState.setState(GameStates.DEVELOPER_SANCTUM);
    _sanctumOpen = true;
    _deployConfirmOpen = false;
    _initSanctumParticles();
    try {
      MusicManager.crossfade('exploration', 1.2, 0.45);
    } catch (e) {}
  },

  /** Submit Gate Password */
  submitPassword() {
    const raw = (_inputPassword || '').trim();
    if (!raw) {
      _gateFeedback = 'Cipher cannot be empty.';
      _gateFeedbackColor = '#f87171';
      SoundManager.snd('error_disabled');
      return;
    }

    // Route B: Permanent Access via SANCTUM10
    if (raw.toUpperCase() === SANCTUM_PERMANENT_PASSWORD) {
      if (SaveSystem.isSanctumPermanentEligible() || SaveSystem.isSanctumPermanentUnlocked()) {
        SaveSystem.unlockSanctumPermanently();
        _gateFeedback = 'Permanent seal consecrated. Welcome to the Sanctum.';
        _gateFeedbackColor = '#4ade80';
        SoundManager.snd('achievement');
        setTimeout(() => this.openSanctum(), 300);
        return;
      } else {
        const witness = SaveSystem.isTheLastWitnessUnlocked();
        const gift = SaveSystem.isGiftCinematicCompleted();
        if (!witness && !gift) {
          _gateFeedback = 'Permanent seal locked. Requires The Last Witness & completed Gift vision.';
        } else if (!witness) {
          _gateFeedback = 'Permanent seal locked. Requires all 8 milestones of The Last Witness.';
        } else {
          _gateFeedback = 'Permanent seal locked. Requires viewing The Last Ember through its final frame.';
        }
        _gateFeedbackColor = '#f87171';
        SoundManager.snd('error_disabled');
        return;
      }
    }

    // Route A: One-time Fallback Password 090329
    if (raw === SANCTUM_FALLBACK_PASSWORD) {
      if (SaveSystem.isSanctumPermanentUnlocked()) {
        this.openSanctum();
        return;
      }
      if (SaveSystem.isSanctumFallbackConsumed()) {
        _gateFeedback = 'Fallback seal exhausted. The one-time session has already been consumed.';
        _gateFeedbackColor = '#ef4444';
        SoundManager.snd('error_disabled');
        return;
      }

      // Temporary authorization for the current page session ONLY
      GameState.SANCTUM_TEMP_AUTHORIZED = true;
      _gateFeedback = 'Temporary authorization granted for this session.';
      _gateFeedbackColor = '#38bdf8';
      SoundManager.snd('menu_select');
      setTimeout(() => this.openSanctum(), 300);
      return;
    }

    // If permanent was already consecrated, allow pressing unlock if input matches or empty
    if (SaveSystem.isSanctumPermanentUnlocked()) {
      this.openSanctum();
      return;
    }

    // Unknown password
    _gateFeedback = 'Seal rejected: Invalid cipher.';
    _gateFeedbackColor = '#ef4444';
    SoundManager.snd('error_disabled');
  },

  /** Initiate Deployment */
  deploy() {
    // 1. Consume fallback if temporary session
    if (GameState.SANCTUM_TEMP_AUTHORIZED && !SaveSystem.isSanctumPermanentUnlocked()) {
      SaveSystem.consumeSanctumFallback();
    }

    // 2. Configure authoritative run state
    GameState.IS_DEVELOPER_EXPEDITION = true;
    GameState.CUSTOM_STARTING_MAX_HP = Math.max(1, Math.min(50, Math.round(_selectedMaxHp || 50)));
    GameState.CUSTOM_STARTING_WEAPON = {
      id: _selectedWeaponId || 'sword',
      rarity: _selectedRarity || 'Common'
    };

    // 3. Close UI and deploy
    _sanctumOpen = false;
    _deployConfirmOpen = false;
    SoundManager.snd('menu_press');

    RunResetManager.resetRun({
      floor: _selectedFloor,
      isDeveloperExpedition: true,
      playIntro: false
    });
  },

  // ─────────────────────────────────────────────────────────────
  // Input Dispatchers
  // ─────────────────────────────────────────────────────────────
  handleKeyDown(key) {
    if (_gateOpen) {
      if (key === 'Escape') {
        this.closeGate();
        return true;
      }
      if (key === 'Enter') {
        this.submitPassword();
        return true;
      }
      if (key === 'Backspace') {
        if (_inputPassword.length > 0) {
          _inputPassword = _inputPassword.slice(0, -1);
          SoundManager.snd('menu_hover');
          return true;
        }
        return false;
      }
      if (key.length === 1 && !key.ctrlKey && !key.metaKey && !key.altKey) {
        if (_inputPassword.length < 24) {
          _inputPassword += key;
          SoundManager.snd('menu_hover');
        }
        return true;
      }
      return true;
    }

    if (_sanctumOpen) {
      if (_deployConfirmOpen) {
        if (key === 'Escape') {
          _deployConfirmOpen = false;
          SoundManager.snd('panel_close');
          return true;
        }
        if (key === 'Enter') {
          this.deploy();
          return true;
        }
        return true;
      }

      if (key === 'Escape') {
        this.closeSanctum();
        return true;
      }

      if (key === '1') { _activeTab = 'floors'; SoundManager.snd('menu_hover'); return true; }
      if (key === '2') { _activeTab = 'cinematics'; SoundManager.snd('menu_hover'); return true; }
      if (key === '3') { _activeTab = 'loadout'; SoundManager.snd('menu_hover'); return true; }
      if (key === '4') { _activeTab = 'config'; SoundManager.snd('menu_hover'); return true; }
      if (key === '5') { _activeTab = 'status'; SoundManager.snd('menu_hover'); return true; }

      // Tab-specific keyboard navigation
      if (_activeTab === 'cinematics') {
        const filtered = _getFilteredCinematics();
        const itemH = 34, itemGap = 5;
        const h = LH - 114 - 34 - 18;
        const maxVisible = Math.floor((h - 80) / (itemH + itemGap));
        const maxScroll = Math.max(0, filtered.length - maxVisible);

        if (key === 'ArrowUp' || key === 'KeyW' || key === 'w' || key === 'W') {
          if (_selectedCinematicIdx > 0) {
            _selectedCinematicIdx--;
            if (_selectedCinematicIdx < _cinematicScrollOffset) {
              _cinematicScrollOffset = _selectedCinematicIdx;
            }
            SoundManager.snd('menu_hover');
          }
          return true;
        }

        if (key === 'ArrowDown' || key === 'KeyS' || key === 's' || key === 'S') {
          if (_selectedCinematicIdx < filtered.length - 1) {
            _selectedCinematicIdx++;
            if (_selectedCinematicIdx >= _cinematicScrollOffset + maxVisible) {
              _cinematicScrollOffset = _selectedCinematicIdx - maxVisible + 1;
            }
            SoundManager.snd('menu_hover');
          }
          return true;
        }

        if (key === 'PageUp') {
          _selectedCinematicIdx = Math.max(0, _selectedCinematicIdx - maxVisible);
          _cinematicScrollOffset = Math.max(0, _cinematicScrollOffset - maxVisible);
          SoundManager.snd('menu_hover');
          return true;
        }

        if (key === 'PageDown') {
          _selectedCinematicIdx = Math.min(filtered.length - 1, _selectedCinematicIdx + maxVisible);
          _cinematicScrollOffset = Math.min(maxScroll, _cinematicScrollOffset + maxVisible);
          SoundManager.snd('menu_hover');
          return true;
        }

        if (key === 'Home') {
          _selectedCinematicIdx = 0;
          _cinematicScrollOffset = 0;
          SoundManager.snd('menu_hover');
          return true;
        }

        if (key === 'End') {
          _selectedCinematicIdx = Math.max(0, filtered.length - 1);
          _cinematicScrollOffset = maxScroll;
          SoundManager.snd('menu_hover');
          return true;
        }

        if (key === 'ArrowLeft' || key === 'ArrowRight') {
          const catIds = ['all', 'story', 'endings'];
          const curIdx = catIds.indexOf(_cinematicCategory);
          const nextIdx = key === 'ArrowRight' 
            ? (curIdx + 1) % catIds.length 
            : (curIdx - 1 + catIds.length) % catIds.length;
          _cinematicCategory = catIds[nextIdx];
          _selectedCinematicIdx = 0;
          _cinematicScrollOffset = 0;
          SoundManager.snd('menu_hover');
          return true;
        }

        if (key === 'Enter' || key === ' ' || key === 'Space') {
          const selectedItem = filtered[_selectedCinematicIdx] || filtered[0];
          if (selectedItem && typeof selectedItem.startReplay === 'function') {
            SoundManager.snd('menu_press');
            _sanctumOpen = false;
            selectedItem.startReplay(() => {
              DeveloperSanctumUI.openSanctum();
            });
            return true;
          }
        }

        return true;
      }

      if (_activeTab === 'floors') {
        if (key === 'ArrowUp' || key === 'w' || key === 'W') {
          if (_selectedFloor > 1) { _selectedFloor--; SoundManager.snd('menu_hover'); }
          return true;
        }
        if (key === 'ArrowDown' || key === 's' || key === 'S') {
          if (_selectedFloor < 10) { _selectedFloor++; SoundManager.snd('menu_hover'); }
          return true;
        }
        if (key === 'Enter') {
          this.openDeployConfirm();
          return true;
        }
      }

      if (key === 'Enter') {
        this.openDeployConfirm();
        return true;
      }

      return true;
    }

    return false;
  },

  handleClick(mx, my) {
    if (!_gateOpen && !_sanctumOpen) return false;

    for (const z of _clickZones) {
      if (mx >= z.x && mx <= z.x + z.w && my >= z.y && my <= z.y + z.h) {
        if (typeof z.action === 'function') {
          z.action();
          return true;
        }
      }
    }

    // Modal background click out for Gate
    if (_gateOpen) {
      const mw = 480, mh = 270;
      const gx = (LW - mw) / 2, gy = (LH - mh) / 2;
      if (mx < gx || mx > gx + mw || my < gy || my > gy + mh) {
        this.closeGate();
        return true;
      }
    }

    // Modal background click out for Deploy Confirm
    if (_sanctumOpen && _deployConfirmOpen) {
      const mw = 520, mh = 290;
      const dx = (LW - mw) / 2, dy = (LH - mh) / 2;
      if (mx < dx || mx > dx + mw || my < dy || my > dy + mh) {
        _deployConfirmOpen = false;
        SoundManager.snd('panel_close');
        return true;
      }
    }

    return true;
  },

  // ─────────────────────────────────────────────────────────────
  // Drawing Pipeline
  // ─────────────────────────────────────────────────────────────
  draw(ctx, dt) {
    _clickZones = [];
    _cursorTimer += dt || 0.016;

    if (_gateOpen) {
      this._drawGateModal(ctx, dt);
      return;
    }

    if (_sanctumOpen) {
      this._drawSanctumChamber(ctx, dt);
    }
  },

  _drawGateModal(ctx, dt) {
    ctx.save();
    // Backdrop shadow
    ctx.fillStyle = 'rgba(2, 4, 10, 0.88)';
    ctx.fillRect(0, 0, LW, LH);

    const mw = 480, mh = 270;
    const mx = Math.round((LW - mw) / 2);
    const my = Math.round((LH - mh) / 2);

    // Multi-layered carved stone chassis with antique bronze corner brackets
    drawStonePanel(ctx, mx, my, mw, mh, {
      chamfer: 10,
      title: '◈ SEALED SANCTUM ACCESS GATE ◈',
      subtitle: 'Enter the Sanctum Cipher to break the seal and access developer controls.',
      hasCornerBrackets: true,
      bracketLen: 16,
      headerAccent: 'gold'
    });

    // Authoritative animated red pixel eye in relic aperture
    const eyeY = my + 30;
    const blinkProg = Math.max(0, Math.sin(GameState.F * 0.035) - 0.92) * 12.5;
    drawPixelEye(ctx, mx + mw / 2, eyeY, 0.55, blinkProg, GameState.F);

    // Recessed Stone Text Input Field Box
    const inputW = 320, inputH = 34;
    const inputX = mx + (mw - inputW) / 2;
    const inputY = my + 110;

    drawChamferedPanel(ctx, inputX, inputY, inputW, inputH, 4, 'rgba(4, 6, 14, 0.96)', 'rgba(217, 119, 6, 0.75)', 1.2);

    // Render password or masked / typed text
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const showText = _inputPassword || '';
    const cursor = (Math.floor(_cursorTimer * 2) % 2 === 0) ? '█' : '';
    ctx.fillText(showText + cursor, inputX + inputW / 2, inputY + inputH / 2);

    // Feedback message
    ctx.font = '10.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = _gateFeedbackColor || '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText(_gateFeedback || '', mx + mw / 2, inputY + inputH + 20);

    // Action Buttons: UNLOCK and CANCEL using unified ButtonArtManager
    const btnW = 124, btnH = 30;
    const unlockX = mx + mw / 2 - btnW - 10;
    const cancelX = mx + mw / 2 + 10;
    const btnY = my + mh - 46;

    const mouseX = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.mx : -999;
    const mouseY = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.my : -999;
    const isMouseDown = InputManager.MOUSE_STATE ? !!InputManager.MOUSE_STATE.isDown : false;

    // Unlock Button
    const isHoverUnlock = mouseX >= unlockX && mouseX <= unlockX + btnW && mouseY >= btnY && mouseY <= btnY + btnH;
    drawStoneButton(ctx, unlockX, btnY, btnW, btnH, {
      text: 'UNLOCK',
      icon: '◈',
      isPrimary: true,
      isHover: isHoverUnlock,
      isPressed: isHoverUnlock && isMouseDown,
      fontSize: 10.5
    });
    _clickZones.push({ x: unlockX, y: btnY, w: btnW, h: btnH, action: () => this.submitPassword() });

    // Cancel Button
    const isHoverCancel = mouseX >= cancelX && mouseX <= cancelX + btnW && mouseY >= btnY && mouseY <= btnY + btnH;
    drawStoneButton(ctx, cancelX, btnY, btnW, btnH, {
      text: 'CANCEL',
      isHover: isHoverCancel,
      isPressed: isHoverCancel && isMouseDown,
      fontSize: 10
    });
    _clickZones.push({ x: cancelX, y: btnY, w: btnW, h: btnH, action: () => this.closeGate() });

    ctx.restore();
  },

  _drawSanctumChamber(ctx, dt) {
    ctx.save();
    const mouseX = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.mx : -999;
    const mouseY = InputManager.MOUSE_STATE ? InputManager.MOUSE_STATE.my : -999;

    // 1. Deep Obsidian Atmosphere
    ctx.fillStyle = '#05070e';
    ctx.fillRect(0, 0, LW, LH);

    // Subtle violet vignette
    const vig = ctx.createRadialGradient(LW / 2, LH / 2, 50, LW / 2, LH / 2, LW * 0.75);
    vig.addColorStop(0, 'rgba(30, 15, 55, 0.25)');
    vig.addColorStop(0.6, 'rgba(10, 5, 22, 0.7)');
    vig.addColorStop(1, 'rgba(2, 3, 8, 0.95)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, LW, LH);

    // Subtle floating violet abyss particles
    for (const p of _sanctumParticles) {
      p.y += p.vy;
      p.x += p.vx + Math.sin(GameState.F * 0.02 + p.phase) * 0.15;
      if (p.y < -10) p.y = LH + 10;
      ctx.fillStyle = `rgba(167, 139, 250, ${p.alpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Compact Top Header Bar (Y: 10 to 42)
    const headerY = 12;
    const blinkProg = Math.max(0, Math.sin(GameState.F * 0.04) - 0.90) * 10;
    drawPixelEye(ctx, 36, headerY + 12, 0.45, blinkProg, GameState.F);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 15px Cinzel, serif';
    ctx.fillStyle = '#fde68a';
    ctx.shadowColor = '#d97706';
    ctx.shadowBlur = 6;
    ctx.fillText('THE DEVELOPER SANCTUM', 62, headerY);
    ctx.shadowBlur = 0;

    ctx.font = 'italic 10.5px "Crimson Text", Georgia, serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Authoritative Control Chamber · Floor Deployment & Archives', 64, headerY + 18);

    // Return to Title Button (Top Right)
    const isMouseDown = InputManager.MOUSE_STATE ? !!InputManager.MOUSE_STATE.isDown : false;
    const retW = 148, retH = 26;
    const retX = LW - retW - 20, retY = headerY + 1;
    const isHoverRet = mouseX >= retX && mouseX <= retX + retW && mouseY >= retY && mouseY <= retY + retH;
    drawStoneButton(ctx, retX, retY, retW, retH, {
      text: 'TITLE MENU',
      hotkey: '[ESC]',
      icon: '⮌',
      isHover: isHoverRet,
      isPressed: isHoverRet && isMouseDown,
      fontSize: 9.5
    });
    _clickZones.push({ x: retX, y: retY, w: retW, h: retH, action: () => this.closeSanctum() });

    // 3. Integrated At-a-Glance Configuration Status Pill Bar (Y: 46 to 74)
    const previewWep = _getPreviewWeapon();
    const curCfg = FLOOR_CONFIG[_selectedFloor] || { name: 'Abyss Depth' };
    const pillBarY = 46;
    const pillH = 26;
    const pillGap = 8;
    const pillTotalW = LW - 40;
    const pillW = Math.round((pillTotalW - 3 * pillGap) / 4);

    // Pill 1: Floor Target
    const p1X = 20;
    drawStoneCard(ctx, p1X, pillBarY, pillW, pillH, { accentColor: 'gold', chamfer: 4 });
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.fillStyle = '#fde68a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`◈ FLOOR ${_selectedFloor} : ${curCfg.name.toUpperCase()}`, p1X + pillW / 2, pillBarY + pillH / 2);

    // Pill 2: Starting Blade
    const p2X = p1X + pillW + pillGap;
    drawStoneCard(ctx, p2X, pillBarY, pillW, pillH, { accentColor: 'violet', chamfer: 4 });
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.fillStyle = previewWep.rarity.col || '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${previewWep.icon} ${previewWep.name.toUpperCase()} [${previewWep.rarity.name.toUpperCase()}]`, p2X + pillW / 2, pillBarY + pillH / 2);

    // Pill 3: Starting Max HP
    const p3X = p2X + pillW + pillGap;
    const hpCol = _selectedMaxHp <= 5 ? '#ef4444' : (_selectedMaxHp >= 40 ? '#4ade80' : '#fde68a');
    drawStoneCard(ctx, p3X, pillBarY, pillW, pillH, { accentColor: _selectedMaxHp <= 5 ? 'crimson' : 'emerald', chamfer: 4 });
    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.fillStyle = hpCol;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`❤️ ${_selectedMaxHp} / 50 HP CALIBRATION`, p3X + pillW / 2, pillBarY + pillH / 2);

    // Pill 4: Developer Expedition Badge
    const p4X = p3X + pillW + pillGap;
    drawStoneCard(ctx, p4X, pillBarY, pillW, pillH, { accentColor: 'crimson', chamfer: 4 });
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.fillStyle = '#fca5a5';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚔️ DEV EXPEDITION · ISOLATED', p4X + pillW / 2, pillBarY + pillH / 2);

    // 4. Tab Navigation Bar (Y: 80 to 108)
    const tabs = [
      { id: 'floors', label: '1. FLOOR TARGET' },
      { id: 'cinematics', label: '2. CINEMATICS' },
      { id: 'loadout', label: '3. STARTING LOADOUT' },
      { id: 'config', label: '4. EXPEDITION CONFIG' },
      { id: 'status', label: '5. ACCESS STATUS' }
    ];
    const tabY = 80;
    const tabW = Math.round((LW - 40 - (tabs.length - 1) * 6) / tabs.length);
    const tabH = 26;

    tabs.forEach((tab, idx) => {
      const tx = 20 + idx * (tabW + 6);
      const isActive = _activeTab === tab.id;
      const isHover = mouseX >= tx && mouseX <= tx + tabW && mouseY >= tabY && mouseY <= tabY + tabH;

      drawStoneTab(ctx, tx, tabY, tabW, tabH, {
        label: tab.label,
        isActive,
        isHover,
        accentColor: 'gold'
      });

      _clickZones.push({
        x: tx, y: tabY, w: tabW, h: tabH,
        action: () => { _activeTab = tab.id; SoundManager.snd('menu_hover'); }
      });
    });

    // 5. Main Chamber Content Chassis (Y: 114 to LH - 56)
    const contX = 20, contY = 114, contW = LW - 40;
    const bBarH = 34;
    const contH = LH - contY - bBarH - 18;

    drawStonePanel(ctx, contX, contY, contW, contH, {
      chamfer: 8,
      outerBorderColor: 'rgba(217, 119, 6, 0.55)',
      innerBorderColor: 'rgba(201, 168, 76, 0.25)',
      hasCornerBrackets: true,
      bracketLen: 12
    });

    // Render Active Tab Content
    switch (_activeTab) {
      case 'floors':
        this._drawTabFloors(ctx, contX, contY, contW, contH, mouseX, mouseY);
        break;
      case 'cinematics':
        this._drawTabCinematics(ctx, contX, contY, contW, contH, mouseX, mouseY);
        break;
      case 'loadout':
        this._drawTabLoadout(ctx, contX, contY, contW, contH, mouseX, mouseY);
        break;
      case 'config':
        this._drawTabConfig(ctx, contX, contY, contW, contH, mouseX, mouseY);
        break;
      case 'status':
        this._drawTabStatus(ctx, contX, contY, contW, contH, mouseX, mouseY);
        break;
    }

    // 6. Persistent Unified Bottom Action Bar (Y: LH - 44 to LH - 10)
    const bBarY = LH - bBarH - 10;
    drawChamferedPanel(ctx, contX, bBarY, contW, bBarH, 5, 'rgba(10, 15, 30, 0.96)', 'rgba(217, 119, 6, 0.65)', 1.2);
    drawCornerBrackets(ctx, contX + 2, bBarY + 2, contW - 4, bBarH - 4, 8, 'rgba(217, 119, 6, 0.6)');

    ctx.font = 'bold 10px Cinzel, serif';
    ctx.fillStyle = '#fde68a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`DEPLOY TARGET: FLOOR ${_selectedFloor} (${curCfg.name.toUpperCase()})  ·  ${previewWep.icon} ${previewWep.name.toUpperCase()}  ·  ${_selectedMaxHp} HP`, contX + 16, bBarY + bBarH / 2);

    const depBtnW = 200, depBtnH = 28;
    const depBtnX = contX + contW - depBtnW - 4, depBtnY = bBarY + 3;
    const isHoverDepBar = mouseX >= depBtnX && mouseX <= depBtnX + depBtnW && mouseY >= depBtnY && mouseY <= depBtnY + depBtnH;

    drawStoneButton(ctx, depBtnX, depBtnY, depBtnW, depBtnH, {
      text: 'DEPLOY EXPEDITION',
      hotkey: '[ENTER]',
      icon: '⚔',
      isPrimary: true,
      isHover: isHoverDepBar,
      isPressed: isHoverDepBar && isMouseDown,
      fontSize: 10
    });

    _clickZones.push({
      x: depBtnX, y: depBtnY, w: depBtnW, h: depBtnH,
      action: () => {
        this.openDeployConfirm();
      }
    });

    // 7. Deploy Confirmation Modal Overlay
    if (_deployConfirmOpen) {
      this._drawDeployConfirmModal(ctx, mouseX, mouseY);
    }

    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────
  // TAB 1: FLOOR DEPLOYMENT (Floors 1 - 10)
  // ─────────────────────────────────────────────────────────────
  _drawTabFloors(ctx, x, y, w, h, mouseX, mouseY) {
    ctx.save();

    // Guidance
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.fillStyle = '#fde68a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('SELECT DEPLOYMENT TARGET (FLOORS 1 — 10)', x + 18, y + 12);

    ctx.font = 'italic 10px "Crimson Text", Georgia, serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Sets starting descent point. Combat mechanics, boss encounters, and portals scale authentically.', x + 18, y + 27);

    // 10 Floor Selectable Buttons (2 Columns of 5)
    const startY = y + 46;
    const colW = (w - 52) / 2;
    const btnH = 68;
    const gap = 8;
    const isMouseDown = InputManager.MOUSE_STATE ? !!InputManager.MOUSE_STATE.isDown : false;

    for (let f = 1; f <= 10; f++) {
      const colIdx = f <= 5 ? 0 : 1;
      const rowIdx = (f - 1) % 5;
      const bx = x + 18 + colIdx * (colW + 16);
      const by = startY + rowIdx * (btnH + gap);

      const cfg = FLOOR_CONFIG[f] || { name: 'Abyss Depth' };
      const isBoss = isBossFloor(f);
      const isSelected = _selectedFloor === f;
      const isHover = mouseX >= bx && mouseX <= bx + colW && mouseY >= by && mouseY <= by + btnH;

      drawStoneCard(ctx, bx, by, colW, btnH, {
        isSelected,
        isHover,
        accentColor: isBoss ? 'crimson' : 'gold',
        chamfer: 5
      });

      // Floor Number & Name
      ctx.font = 'bold 11.5px Cinzel, serif';
      ctx.fillStyle = isSelected ? '#ffffff' : (isBoss ? '#fca5a5' : '#cbd5e1');
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`FLOOR ${f} — ${cfg.name.toUpperCase()}`, bx + 14, by + 10);

      // Biome / Boss Details
      ctx.font = '9.5px monospace';
      ctx.fillStyle = isBoss ? '#ef4444' : '#94a3b8';
      let metaText = `Biome: ${cfg.biome || 'keep'}`;
      if (f === 3) metaText = '⚔️ BOSS ENCOUNTER: GORGAROTH (The Iron Jailer)';
      else if (f === 6) metaText = '⚔️ BOSS ENCOUNTER: ARCH-LICH MALAKOR';
      else if (f === 10) metaText = '👑 APEX BOSS: THE ABYSS WARDEN';
      ctx.fillText(metaText, bx + 14, by + 30);

      // Floor theme quote / hint
      ctx.font = 'italic 9.5px "Crimson Text", serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(cfg.desc || 'Descent into darkness.', bx + 14, by + 48);

      _clickZones.push({
        x: bx, y: by, w: colW, h: btnH,
        action: () => {
          if (_selectedFloor === f) {
            this.openDeployConfirm();
          } else {
            _selectedFloor = f;
            SoundManager.snd('menu_hover');
          }
        }
      });
    }

    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────
  // TAB 2: CINEMATIC ARCHIVE (Genuine Registered Scenes Replay)
  // ─────────────────────────────────────────────────────────────
  _drawTabCinematics(ctx, x, y, w, h, mouseX, mouseY) {
    ctx.save();
    const isMouseDown = InputManager.MOUSE_STATE ? !!InputManager.MOUSE_STATE.isDown : false;

    ctx.font = 'bold 11px Cinzel, serif';
    ctx.fillStyle = '#fde68a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('CANONICAL CINEMATIC & CREDITS ARCHIVE', x + 18, y + 10);

    ctx.font = 'italic 10px "Crimson Text", Georgia, serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Replay genuine in-engine cutscenes, post-ending epilogue, and 4 distinct ending credits with isolated progression.', x + 18, y + 24);

    // Category Tabs Bar (Y: 40 to 64)
    const catList = [
      { id: 'all', label: 'ALL ARCHIVES' },
      { id: 'story', label: 'PROLOGUE & BOSSES' },
      { id: 'endings', label: 'ENDINGS & CREDITS' }
    ];
    let catX = x + 18;
    const catY = y + 40;
    const catH = 24;

    catList.forEach(cat => {
      ctx.font = 'bold 8.5px Cinzel, serif';
      const catW = Math.round(ctx.measureText(cat.label).width + 22);
      const isCatSel = _cinematicCategory === cat.id;
      const isCatHover = mouseX >= catX && mouseX <= catX + catW && mouseY >= catY && mouseY <= catY + catH;

      drawStoneTab(ctx, catX, catY, catW, catH, {
        label: cat.label,
        isActive: isCatSel,
        isHover: isCatHover,
        accentColor: 'gold'
      });

      _clickZones.push({
        x: catX, y: catY, w: catW, h: catH,
        action: () => {
          if (_cinematicCategory !== cat.id) {
            _cinematicCategory = cat.id;
            _selectedCinematicIdx = 0;
            _cinematicScrollOffset = 0;
            SoundManager.snd('menu_hover');
          }
        }
      });

      catX += catW + 6;
    });

    const filteredCinematics = _getFilteredCinematics();

    const listX = x + 18;
    const listY = y + 70;
    const listW = 312;
    const itemH = 34;
    const itemGap = 5;
    const listH = h - 80;
    const maxVisible = Math.max(1, Math.floor(listH / (itemH + itemGap)));
    const maxScroll = Math.max(0, filteredCinematics.length - maxVisible);
    _cinematicScrollOffset = Math.max(0, Math.min(maxScroll, _cinematicScrollOffset));
    const scrollIdx = _cinematicScrollOffset;
    _selectedCinematicIdx = Math.max(0, Math.min(filteredCinematics.length - 1, _selectedCinematicIdx));

    // Render items with carved stone cards
    filteredCinematics.slice(scrollIdx, scrollIdx + maxVisible).forEach((item, localIdx) => {
      const globalIdx = scrollIdx + localIdx;
      const iy = listY + localIdx * (itemH + itemGap);

      const isEpilogue = item.id === 'epilogue_unmeasured_hour';
      const isSelected = _selectedCinematicIdx === globalIdx;
      const isHover = mouseX >= listX && mouseX <= listX + listW && mouseY >= iy && mouseY <= iy + itemH;

      drawStoneCard(ctx, listX, iy, listW, itemH, {
        isSelected,
        isHover,
        accentColor: isEpilogue ? 'violet' : (item.category === 'bosses' ? 'crimson' : 'gold'),
        chamfer: 4
      });

      // Special pulsating aura border for Epilogue item
      if (isEpilogue && !isSelected) {
        ctx.save();
        ctx.strokeStyle = `rgba(168, 85, 247, ${0.45 + 0.35 * Math.sin(GameState.F * 0.08)})`;
        ctx.lineWidth = 1.4;
        roundRect(ctx, listX, iy, listW, itemH, 4);
        ctx.stroke();
        ctx.restore();
      }

      ctx.font = 'bold 9.5px Cinzel, serif';
      ctx.fillStyle = isSelected ? '#ffffff' : (isEpilogue ? '#e9d5ff' : '#cbd5e1');
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const displayTitle = isEpilogue ? `✦ ${item.title}` : item.title;
      ctx.fillText(displayTitle, listX + 12, iy + itemH / 2);

      ctx.font = '8.5px monospace';
      ctx.fillStyle = isEpilogue ? '#c084fc' : (item.color || '#94a3b8');
      ctx.textAlign = 'right';
      const badgeText = isEpilogue ? '✦ CANON EPILOGUE' : (item.badge || item.floor);
      ctx.fillText(badgeText, listX + listW - 12, iy + itemH / 2);

      _clickZones.push({
        x: listX, y: iy, w: listW, h: itemH + itemGap,
        action: () => {
          _selectedCinematicIdx = globalIdx;
          SoundManager.snd('menu_hover');
        }
      });
    });

    // ─────────────────────────────────────────────────────────────
    // Dedicated Tactile Scrollbar Track & Thumb
    // ─────────────────────────────────────────────────────────────
    const scrollColX = listX + listW + 6;
    const scrollColW = 14;
    const scrollColY = listY;
    const scrollColH = maxVisible * (itemH + itemGap) - itemGap;

    if (maxScroll > 0) {
      const arrBtnH = 16;
      const trackY = scrollColY + arrBtnH + 2;
      const trackH = scrollColH - (arrBtnH * 2) - 4;

      // Up arrow button
      const isUpHover = mouseX >= scrollColX && mouseX <= scrollColX + scrollColW && mouseY >= scrollColY && mouseY <= scrollColY + arrBtnH;
      drawStoneButton(ctx, scrollColX, scrollColY, scrollColW, arrBtnH, {
        text: '▲',
        isHover: isUpHover,
        fontSize: 8.5
      });
      _clickZones.push({
        x: scrollColX, y: scrollColY, w: scrollColW, h: arrBtnH,
        action: () => {
          _cinematicScrollOffset = Math.max(0, _cinematicScrollOffset - 1);
          SoundManager.snd('menu_hover');
        }
      });

      // Down arrow button
      const downBtnY = scrollColY + scrollColH - arrBtnH;
      const isDownHover = mouseX >= scrollColX && mouseX <= scrollColX + scrollColW && mouseY >= downBtnY && mouseY <= downBtnY + arrBtnH;
      drawStoneButton(ctx, scrollColX, downBtnY, scrollColW, arrBtnH, {
        text: '▼',
        isHover: isDownHover,
        fontSize: 8.5
      });
      _clickZones.push({
        x: scrollColX, y: downBtnY, w: scrollColW, h: arrBtnH,
        action: () => {
          _cinematicScrollOffset = Math.min(maxScroll, _cinematicScrollOffset + 1);
          SoundManager.snd('menu_hover');
        }
      });

      // Recessed track
      drawChamferedPanel(ctx, scrollColX + 2, trackY, scrollColW - 4, trackH, 2, 'rgba(6, 8, 16, 0.95)', 'rgba(217, 119, 6, 0.25)', 1);

      // Scrollbar Thumb
      const thumbH = Math.max(22, Math.round(trackH * (maxVisible / filteredCinematics.length)));
      const availableTrack = trackH - thumbH;
      const thumbY = trackY + (availableTrack > 0 ? Math.round(availableTrack * (scrollIdx / maxScroll)) : 0);
      const isThumbHover = mouseX >= scrollColX && mouseX <= scrollColX + scrollColW && mouseY >= thumbY && mouseY <= thumbY + thumbH;

      // Real-time thumb dragging with mouse
      if (isMouseDown) {
        if (!_isDraggingScrollbar && isThumbHover) {
          _isDraggingScrollbar = true;
          _scrollbarDragOffsetY = mouseY - thumbY;
        }
      } else {
        _isDraggingScrollbar = false;
      }

      if (_isDraggingScrollbar && availableTrack > 0) {
        const relativeY = (mouseY - _scrollbarDragOffsetY) - trackY;
        const ratio = Math.max(0, Math.min(1, relativeY / availableTrack));
        const newOffset = Math.round(ratio * maxScroll);
        if (newOffset !== _cinematicScrollOffset) {
          _cinematicScrollOffset = newOffset;
        }
      }

      drawChamferedPanel(ctx, scrollColX + 1, thumbY, scrollColW - 2, thumbH, 2,
        (_isDraggingScrollbar || isThumbHover) ? 'rgba(88, 28, 135, 0.95)' : 'rgba(30, 20, 50, 0.95)',
        (_isDraggingScrollbar || isThumbHover) ? '#fbbf24' : 'rgba(217, 119, 6, 0.75)',
        1.2
      );

      // Track click paging
      _clickZones.push({
        x: scrollColX, y: trackY, w: scrollColW, h: trackH,
        action: () => {
          if (mouseY < thumbY) {
            _cinematicScrollOffset = Math.max(0, _cinematicScrollOffset - maxVisible);
          } else if (mouseY > thumbY + thumbH) {
            _cinematicScrollOffset = Math.min(maxScroll, _cinematicScrollOffset + maxVisible);
          }
          SoundManager.snd('menu_hover');
        }
      });
    }

    // ─────────────────────────────────────────────────────────────
    // Detail Panel on Right Side
    // ─────────────────────────────────────────────────────────────
    const detX = scrollColX + scrollColW + 12;
    const detY = catY;
    const detW = w - (detX - x) - 18;
    const detH = h - 46;

    drawStonePanel(ctx, detX, detY, detW, detH, {
      chamfer: 6,
      outerBorderColor: 'rgba(217, 119, 6, 0.45)',
      innerBorderColor: 'rgba(201, 168, 76, 0.20)',
      hasCornerBrackets: true,
      bracketLen: 10
    });

    const selectedItem = filteredCinematics[_selectedCinematicIdx] || filteredCinematics[0] || ARCHIVE_CINEMATICS[0];
    if (selectedItem) {
      const isEpilogue = selectedItem.id === 'epilogue_unmeasured_hour';
      const isCredits = selectedItem.badge === 'CREDITS';

      // Title
      ctx.font = 'bold 15px Cinzel, serif';
      ctx.fillStyle = isEpilogue ? '#f3e8ff' : '#fde68a';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(isEpilogue ? `✦ ${selectedItem.title.toUpperCase()}` : selectedItem.title, detX + 20, detY + 18);

      // Subtitle & Badge
      ctx.font = 'italic 11px "Crimson Text", Georgia, serif';
      ctx.fillStyle = selectedItem.color || '#38bdf8';
      const sub = isEpilogue ? 'CANONICAL REVELATION · THE ABSOLUTE’S TIMELESS CRUCIBLE' : (selectedItem.subtitle || '');
      ctx.fillText(`${sub}  ·  [ ${selectedItem.badge || selectedItem.floor} ]`, detX + 20, detY + 40);

      let contentY = detY + 68;

      // Special highlight banner for Epilogue
      if (isEpilogue) {
        const bannerW = detW - 40;
        const bannerH = 46;
        drawChamferedPanel(ctx, detX + 20, contentY, bannerW, bannerH, 4, 'rgba(35, 15, 60, 0.85)', 'rgba(168, 85, 247, 0.75)', 1.2);
        drawCornerBrackets(ctx, detX + 22, contentY + 2, bannerW - 4, bannerH - 4, 6, 'rgba(216, 180, 254, 0.8)');

        ctx.font = 'bold 9.5px Cinzel, serif';
        ctx.fillStyle = '#fde68a';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('◈ OFFICIAL PHASE 8C POST-ENDING CANONICAL EPILOGUE', detX + 32, contentY + 8);

        ctx.font = 'italic 9.5px "Crimson Text", Georgia, serif';
        ctx.fillStyle = '#e9d5ff';
        ctx.fillText('Unlocks after conquering Floor 10 in any of the 3 Warden endings (Hero, Betrayal, Rampage).', detX + 32, contentY + 24);

        contentY += bannerH + 12;
      }

      // Description text wrapping
      ctx.font = '11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#cbd5e1';
      const words = (selectedItem.desc || '').split(' ');
      let line = '', lineY = contentY;
      for (const wd of words) {
        const test = line + wd + ' ';
        if (ctx.measureText(test).width > detW - 44) {
          ctx.fillText(line, detX + 20, lineY);
          line = wd + ' ';
          lineY += 18;
        } else {
          line = test;
        }
      }
      if (line) ctx.fillText(line, detX + 20, lineY);

      // Provenance / Hint
      if (selectedItem.hint) {
        ctx.font = 'italic 10.5px "Crimson Text", Georgia, serif';
        ctx.fillStyle = isEpilogue ? '#c084fc' : 'rgba(148, 163, 184, 0.85)';
        ctx.fillText(`Requirement / Provenance: ${selectedItem.hint}`, detX + 20, lineY + 22);
      }

      // Canonical Lore Note for Epilogue
      if (isEpilogue) {
        const loreY = lineY + 44;
        ctx.font = 'italic 10px "Crimson Text", Georgia, serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('• 5 Cinematic Beats: Void aftermath drone, Cyclopean vault, Basalt stele, Pixel eye, 13th chime.', detX + 20, loreY);
        ctx.fillText('• 100% Canvas 2D Procedural. Insulated replay maintains zero run corruption.', detX + 20, loreY + 16);
      }

      // Playback action button using unified Stone Button
      const playW = isEpilogue ? 220 : 180, playH = 34;
      const playX = detX + 20, playY = detY + detH - 52;
      const isHoverPlay = mouseX >= playX && mouseX <= playX + playW && mouseY >= playY && mouseY <= playY + playH;

      drawStoneButton(ctx, playX, playY, playW, playH, {
        text: isEpilogue ? 'PLAY CANON EPILOGUE' : (isCredits ? 'WATCH CREDITS' : 'WATCH VISION'),
        hotkey: '[SPACE / ENTER]',
        icon: isEpilogue ? '✦' : '▶',
        isPrimary: true,
        isGift: isCredits || isEpilogue,
        isHover: isHoverPlay,
        isPressed: isHoverPlay && isMouseDown,
        fontSize: 10.5
      });

      _clickZones.push({
        x: playX, y: playY, w: playW, h: playH,
        action: () => {
          SoundManager.snd('menu_press');
          _sanctumOpen = false;
          if (typeof selectedItem.startReplay === 'function') {
            selectedItem.startReplay(() => {
              DeveloperSanctumUI.openSanctum();
            });
          }
        }
      });
    }

    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────
  // TAB 3: STARTING LOADOUT (Weapon & Rarity Selection)
  // ─────────────────────────────────────────────────────────────
  _drawTabLoadout(ctx, x, y, w, h, mouseX, mouseY) {
    ctx.save();
    const isMouseDown = InputManager.MOUSE_STATE ? !!InputManager.MOUSE_STATE.isDown : false;

    ctx.font = 'bold 11px Cinzel, serif';
    ctx.fillStyle = '#fde68a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('STARTING WEAPON & RARITY ARSENAL', x + 18, y + 12);

    ctx.font = 'italic 10px "Crimson Text", Georgia, serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Select Rowan’s primary blade for the expedition. Real weapon scaling and genuine mechanics are preserved.', x + 18, y + 27);

    // Weapon Selection Row (5 authentic weapons)
    const wepY = y + 46;
    const wepList = WEAPON_KEYS;
    const wepCardW = Math.round((w - 36 - (wepList.length - 1) * 8) / wepList.length);
    const wepCardH = 60;

    wepList.forEach((wid, i) => {
      const wx = x + 18 + i * (wepCardW + 8);
      const wdata = WEAPON_TYPES[wid];
      const isSelected = _selectedWeaponId === wid;
      const isHover = mouseX >= wx && mouseX <= wx + wepCardW && mouseY >= wepY && mouseY <= wepY + wepCardH;

      drawStoneCard(ctx, wx, wepY, wepCardW, wepCardH, {
        isSelected,
        isHover,
        accentColor: 'gold',
        chamfer: 4
      });

      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(wdata.icon || '⚔️', wx + wepCardW / 2, wepY + 6);

      ctx.font = 'bold 9.5px Cinzel, serif';
      ctx.fillStyle = isSelected ? '#ffffff' : '#cbd5e1';
      ctx.fillText(wdata.name.split(' ')[0], wx + wepCardW / 2, wepY + 32);

      ctx.font = '8.5px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${wdata.type.toUpperCase()}`, wx + wepCardW / 2, wepY + 45);

      _clickZones.push({
        x: wx, y: wepY, w: wepCardW, h: wepCardH,
        action: () => {
          _selectedWeaponId = wid;
          _cachedPreviewWep = null;
          SoundManager.snd('menu_hover');
        }
      });
    });

    // Rarity Selection Row
    const rarY = wepY + wepCardH + 12;
    ctx.font = 'bold 10px Cinzel, serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'left';
    ctx.fillText('WEAPON RARITY TIERS:', x + 18, rarY);

    const rarList = ['Common', 'Rare', 'Epic', 'Legendary'];
    const rarBtnW = Math.round((w - 36 - (rarList.length - 1) * 8) / rarList.length);
    const rarBtnH = 28;
    const rarBtnsY = rarY + 14;

    rarList.forEach((rname, idx) => {
      const rx = x + 18 + idx * (rarBtnW + 8);
      const isSelected = _selectedRarity === rname;
      const isHover = mouseX >= rx && mouseX <= rx + rarBtnW && mouseY >= rarBtnsY && mouseY <= rarBtnsY + rarBtnH;
      const accent = rname === 'Legendary' ? 'gold' : (rname === 'Epic' ? 'violet' : (rname === 'Rare' ? 'azure' : 'emerald'));

      drawStoneTab(ctx, rx, rarBtnsY, rarBtnW, rarBtnH, {
        label: rname.toUpperCase(),
        isActive: isSelected,
        isHover,
        accentColor: accent
      });

      _clickZones.push({
        x: rx, y: rarBtnsY, w: rarBtnW, h: rarBtnH,
        action: () => {
          _selectedRarity = rname;
          _cachedPreviewWep = null;
          SoundManager.snd('menu_hover');
        }
      });
    });

    // Live Weapon Stat Preview Box (Deterministic & Stable)
    const prevY = rarBtnsY + rarBtnH + 14;
    const prevH = h - (prevY - y) - 14;
    const sampleWep = _getPreviewWeapon();

    drawStonePanel(ctx, x + 18, prevY, w - 36, prevH, {
      chamfer: 6,
      outerBorderColor: sampleWep ? (sampleWep.rarity.col || 'rgba(217, 119, 6, 0.45)') : 'rgba(217, 119, 6, 0.45)',
      innerBorderColor: 'rgba(201, 168, 76, 0.25)',
      hasCornerBrackets: true,
      bracketLen: 10
    });

    if (sampleWep) {
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      ctx.font = 'bold 14px Cinzel, serif';
      ctx.fillStyle = sampleWep.rarity.col || '#ffffff';
      ctx.fillText(`${sampleWep.icon} ${sampleWep.name} [${sampleWep.rarity.name}]`, x + 34, prevY + 14);

      ctx.font = '10.5px monospace';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(`• BASE DAMAGE: ${sampleWep.damage.toFixed(1)} DMG`, x + 34, prevY + 38);
      ctx.fillText(`• COOLDOWN: ${(sampleWep.cooldown * 1000).toFixed(0)} ms`, x + 34, prevY + 56);
      ctx.fillText(`• RANGE: ${sampleWep.range} tiles`, x + 240, prevY + 38);
      ctx.fillText(`• TYPE: ${sampleWep.type.toUpperCase()}`, x + 240, prevY + 56);

      ctx.font = 'italic 10px "Crimson Text", serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Deterministic Forging Guaranteed — Weapon attributes and name are locked throughout the expedition.', x + 34, prevY + 80);
    }

    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────
  // TAB 4: EXPEDITION CONFIG (Starting Max Health Slider 1 - 50)
  // ─────────────────────────────────────────────────────────────
  _drawTabConfig(ctx, x, y, w, h, mouseX, mouseY) {
    ctx.save();
    const isMouseDown = InputManager.MOUSE_STATE ? !!InputManager.MOUSE_STATE.isDown : false;

    ctx.font = 'bold 11px Cinzel, serif';
    ctx.fillStyle = '#fde68a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('EXPEDITION HEALTH CALIBRATION', x + 18, y + 12);

    ctx.font = 'italic 10px "Crimson Text", Georgia, serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Calibrate Rowan’s starting maximum health. Constraint: 1 <= Max HP <= 50. Health bar, damage, and healing scale authentically.', x + 18, y + 27);

    // Health Readout Display Card
    const boxY = y + 48;
    const boxH = 92;
    drawStoneCard(ctx, x + 18, boxY, w - 36, boxH, {
      isSelected: true,
      accentColor: _selectedMaxHp <= 5 ? 'crimson' : (_selectedMaxHp >= 40 ? 'emerald' : 'gold'),
      chamfer: 6
    });

    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = _selectedMaxHp <= 5 ? '#ef4444' : (_selectedMaxHp >= 40 ? '#4ade80' : '#fde68a');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`STARTING MAX HP: ${_selectedMaxHp} / 50`, x + w / 2, boxY + 28);

    // Visual Segmented Health Bar
    const barW = Math.min(360, w - 80);
    const barH = 12;
    const barX = x + (w - barW) / 2;
    const barY = boxY + 48;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.6)';
    ctx.lineWidth = 1;
    drawChamferedPanel(ctx, barX, barY, barW, barH, 3);
    ctx.fill(); ctx.stroke();

    const fillW = Math.max(2, Math.round((_selectedMaxHp / 50) * (barW - 2)));
    ctx.fillStyle = _selectedMaxHp <= 5 ? '#ef4444' : (_selectedMaxHp >= 40 ? '#4ade80' : '#fde68a');
    drawChamferedPanel(ctx, barX + 1, barY + 1, fillW, barH - 2, 2);
    ctx.fill();

    ctx.font = 'italic 10.5px "Crimson Text", Georgia, serif';
    ctx.fillStyle = '#94a3b8';
    let challengeHint = 'Standard Resilience Balanced';
    if (_selectedMaxHp === 1) challengeHint = '⚠️ HARDCORE CRUCIBLE · ONE HIT DEATH · NO MISTAKES';
    else if (_selectedMaxHp <= 5) challengeHint = 'Critical Fragility · Extremely Dangerous Descent';
    else if (_selectedMaxHp === 50) challengeHint = 'Maximum Fortification · Full Vitality Buffer';
    ctx.fillText(challengeHint, x + w / 2, boxY + 76);

    // Stepper Controls: [-10] [-1] [+] [+10] using drawStoneButton
    const stepY = boxY + boxH + 16;
    const stepBtns = [
      { label: '-10 HP', delta: -10 },
      { label: '-1 HP', delta: -1 },
      { label: '+1 HP', delta: 1 },
      { label: '+10 HP', delta: 10 }
    ];
    const sBtnW = 96, sBtnH = 32;
    const sStartX = x + (w - (stepBtns.length * sBtnW + (stepBtns.length - 1) * 10)) / 2;

    stepBtns.forEach((btn, idx) => {
      const bx = sStartX + idx * (sBtnW + 10);
      const isHover = mouseX >= bx && mouseX <= bx + sBtnW && mouseY >= stepY && mouseY <= stepY + sBtnH;

      drawStoneButton(ctx, bx, stepY, sBtnW, sBtnH, {
        text: btn.label,
        isHover,
        isPressed: isHover && isMouseDown,
        fontSize: 10.5
      });

      _clickZones.push({
        x: bx, y: stepY, w: sBtnW, h: sBtnH,
        action: () => {
          _selectedMaxHp = Math.max(1, Math.min(50, _selectedMaxHp + btn.delta));
          SoundManager.snd('menu_hover');
        }
      });
    });

    // Preset Shortcuts Row (1 HP, 10 HP, 25 HP, 50 HP)
    const preY = stepY + sBtnH + 18;
    ctx.font = 'bold 10px Cinzel, serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'center';
    ctx.fillText('QUICK PRESET CALIBRATIONS:', x + w / 2, preY);

    const presets = [
      { label: 'HARDCORE (1 HP)', val: 1 },
      { label: 'CLASSIC (10 HP)', val: 10 },
      { label: 'FORTIFIED (25 HP)', val: 25 },
      { label: 'MAXIMUM (50 HP)', val: 50 }
    ];
    const pBtnW = 120, pBtnH = 28;
    const pStartX = x + (w - (presets.length * pBtnW + (presets.length - 1) * 8)) / 2;
    const pBtnsY = preY + 10;

    presets.forEach((pr, idx) => {
      const px = pStartX + idx * (pBtnW + 8);
      const isSelected = _selectedMaxHp === pr.val;
      const isHover = mouseX >= px && mouseX <= px + pBtnW && mouseY >= pBtnsY && mouseY <= pBtnsY + pBtnH;

      drawStoneButton(ctx, px, pBtnsY, pBtnW, pBtnH, {
        text: pr.label,
        isSelected,
        isHover,
        isPrimary: isSelected,
        isPressed: isHover && isMouseDown,
        fontSize: 9.5
      });

      _clickZones.push({
        x: px, y: pBtnsY, w: pBtnW, h: pBtnH,
        action: () => {
          _selectedMaxHp = pr.val;
          SoundManager.snd('menu_select');
        }
      });
    });

    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────
  // TAB 5: ACCESS STATUS (Permanent vs Temporary, Milestone Checks)
  // ─────────────────────────────────────────────────────────────
  _drawTabStatus(ctx, x, y, w, h, mouseX, mouseY) {
    ctx.save();

    ctx.font = 'bold 11px Cinzel, serif';
    ctx.fillStyle = '#fde68a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('SANCTUM ACCESS CONSECRATION & VERIFICATION', x + 18, y + 12);

    ctx.font = 'italic 10px "Crimson Text", Georgia, serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Authoritative access status for the current browser session and lifetime save progression.', x + 18, y + 27);

    const isPermUnlocked = SaveSystem.isSanctumPermanentUnlocked();
    const isPermEligible = SaveSystem.isSanctumPermanentEligible();
    const isFallbackConsumed = SaveSystem.isSanctumFallbackConsumed();
    const isTempSession = !!GameState.SANCTUM_TEMP_AUTHORIZED;

    const statY = y + 46;
    const statW = w - 36;
    const statH = h - 60;

    // Split into 2 Balanced Panels
    const cardGap = 12;
    const cardW = Math.round((statW - cardGap) / 2);

    // Left Card: Authentication & Lifetime Progression
    drawStonePanel(ctx, x + 18, statY, cardW, statH, {
      chamfer: 6,
      outerBorderColor: isPermUnlocked ? 'rgba(74, 222, 128, 0.45)' : 'rgba(71, 85, 105, 0.45)',
      innerBorderColor: 'rgba(201, 168, 76, 0.20)',
      hasCornerBrackets: true,
      bracketLen: 10
    });

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 12px Cinzel, serif';
    ctx.fillStyle = isPermUnlocked ? '#4ade80' : (isTempSession ? '#38bdf8' : '#f87171');
    const authStatusText = isPermUnlocked
      ? 'AUTHORIZATION: PERMANENT CONSECRATED'
      : (isTempSession ? 'AUTHORIZATION: TEMPORARY SESSION' : 'AUTHORIZATION: SEALED');
    ctx.fillText(authStatusText, x + 32, statY + 16);

    ctx.font = '10.5px monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`• Fallback Cipher (090329): ${isFallbackConsumed ? 'CONSUMED' : 'AVAILABLE'}`, x + 32, statY + 44);
    ctx.fillText(`• The Last Witness: ${SaveSystem.isTheLastWitnessUnlocked() ? 'UNLOCKED (8/8 Milestones)' : 'LOCKED'}`, x + 32, statY + 68);
    ctx.fillText(`• The Last Ember Vision: ${SaveSystem.isGiftCinematicCompleted() ? 'COMPLETED' : 'NOT COMPLETED'}`, x + 32, statY + 92);
    ctx.fillText(`• Permanent Consecration: ${isPermUnlocked ? 'ACTIVE' : (isPermEligible ? 'ELIGIBLE' : 'LOCKED')}`, x + 32, statY + 116);

    // Right Card: Expedition Integrity Guarantees
    const rCardX = x + 18 + cardW + cardGap;
    drawStonePanel(ctx, rCardX, statY, cardW, statH, {
      chamfer: 6,
      outerBorderColor: 'rgba(239, 68, 68, 0.45)',
      innerBorderColor: 'rgba(201, 168, 76, 0.20)',
      hasCornerBrackets: true,
      bracketLen: 10
    });

    ctx.font = 'bold 12px Cinzel, serif';
    ctx.fillStyle = '#fca5a5';
    ctx.fillText('EXPEDITION INTEGRITY GUARANTEES', rCardX + 16, statY + 16);

    ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('1. All runs started here are tagged Developer Expeditions.', rCardX + 16, statY + 44);
    ctx.fillText('2. Speedrun times, PBs, and speed achievements are disabled.', rCardX + 16, statY + 68);
    ctx.fillText('3. Standard combat, enemies, sanity, and portals function fully.', rCardX + 16, statY + 92);
    ctx.fillText('4. Returning to title preserves authentic save progression.', rCardX + 16, statY + 116);

    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────
  // DEPLOYMENT CONFIRMATION MODAL OVERLAY
  // ─────────────────────────────────────────────────────────────
  _drawDeployConfirmModal(ctx, mouseX, mouseY) {
    ctx.save();
    const isMouseDown = InputManager.MOUSE_STATE ? !!InputManager.MOUSE_STATE.isDown : false;

    // Dark backdrop overlay
    ctx.fillStyle = 'rgba(2, 4, 10, 0.88)';
    ctx.fillRect(0, 0, LW, LH);

    const mw = 520, mh = 290;
    const mx = Math.round((LW - mw) / 2);
    const my = Math.round((LH - mh) / 2);

    drawStonePanel(ctx, mx, my, mw, mh, {
      chamfer: 10,
      title: '◈ CONFIRM EXPEDITION DEPLOYMENT ◈',
      subtitle: 'Authoritative descent parameters will be locked for this run.',
      hasCornerBrackets: true,
      bracketLen: 16,
      headerAccent: 'gold'
    });

    // Summary lines
    const cfg = FLOOR_CONFIG[_selectedFloor] || { name: 'Abyss Depth' };
    const wep = _getPreviewWeapon();

    ctx.textAlign = 'left';
    ctx.font = '11.5px monospace';
    ctx.fillStyle = '#cbd5e1';
    const lineStartX = mx + 40;
    ctx.fillText(`• Target Floor: Floor ${_selectedFloor} — ${cfg.name.toUpperCase()}`, lineStartX, my + 54);
    ctx.fillText(`• Starting Weapon: ${wep.icon} ${wep.name} (${wep.damage.toFixed(1)} DMG)`, lineStartX, my + 76);
    ctx.fillText(`• Weapon Rarity: ${wep.rarity.name.toUpperCase()}`, lineStartX, my + 98);
    ctx.fillText(`• Starting Health: ${_selectedMaxHp} / 50 HP`, lineStartX, my + 120);

    // Speedrun warning badge
    drawStoneCard(ctx, lineStartX, my + 144, mw - 80, 26, {
      accentColor: 'crimson',
      chamfer: 3
    });

    ctx.font = 'bold 9.5px Cinzel, serif';
    ctx.fillStyle = '#fca5a5';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DEVELOPER EXPEDITION — OFFICIAL SPEEDRUN RECORDS DISABLED', mx + mw / 2, my + 157);

    if (GameState.SANCTUM_TEMP_AUTHORIZED && !SaveSystem.isSanctumPermanentUnlocked()) {
      ctx.font = 'italic 10.5px "Crimson Text", Georgia, serif';
      ctx.fillStyle = '#fde68a';
      ctx.fillText('Notice: This first deployment will persistently consume the one-time fallback cipher.', mx + mw / 2, my + 188);
    }

    // Deploy and Cancel Buttons using drawStoneButton
    const btnW = 140, btnH = 34;
    const depX = mx + mw / 2 - btnW - 10;
    const canX = mx + mw / 2 + 10;
    const btnY = my + mh - 50;

    // Deploy Button
    const isHoverDep = mouseX >= depX && mouseX <= depX + btnW && mouseY >= btnY && mouseY <= btnY + btnH;
    drawStoneButton(ctx, depX, btnY, btnW, btnH, {
      text: 'DEPLOY NOW',
      icon: '⚔',
      isPrimary: true,
      isHover: isHoverDep,
      isPressed: isHoverDep && isMouseDown,
      fontSize: 11
    });
    _clickZones.push({ x: depX, y: btnY, w: btnW, h: btnH, action: () => this.deploy() });

    // Cancel Button
    const isHoverCan = mouseX >= canX && mouseX <= canX + btnW && mouseY >= btnY && mouseY <= btnY + btnH;
    drawStoneButton(ctx, canX, btnY, btnW, btnH, {
      text: 'CANCEL',
      hotkey: '[ESC]',
      isHover: isHoverCan,
      isPressed: isHoverCan && isMouseDown,
      fontSize: 10.5
    });
    _clickZones.push({ x: canX, y: btnY, w: btnW, h: btnH, action: () => { _deployConfirmOpen = false; SoundManager.snd('panel_close'); } });

    ctx.restore();
  }
};

if (typeof window !== 'undefined') {
  window.DeveloperSanctumUI = DeveloperSanctumUI;
  window.addEventListener('wheel', (e) => {
    if (GameState.STATE === GameStates.DEVELOPER_SANCTUM || DeveloperSanctumUI.isOpen()) {
      DeveloperSanctumUI.handleWheel(e.deltaY);
    }
  }, { passive: true });
}
