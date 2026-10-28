// =====================================================================
//  DUNGEON BREAK — js/ui/MobileControls.js
//  Authoritative Virtual Joystick, Action Buttons, Weapon Dock & Lifecycle
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { InputManager } from '../core/InputManager.js';
import { CombatSystem } from '../combat/CombatSystem.js';
import { AudioManager, SoundManager } from '../audio/AudioManager.js';
import { WeaponInventory } from '../weapons/WeaponInventory.js';
import { EventBus } from '../core/EventBus.js';
import { pauseGame, resumeGame } from './PauseMenu.js';
import { HUD } from './HUD.js';

const CTRL_DEFAULTS = {
  joySize: 110,
  joyX: 24,
  joyYBot: 24,
  atkSize: 72,
  atkX: null,
  atkYBot: 24,
  shootSize: 62,
  shootX: null,
  shootYBot: 0,
  specialSize: 60,
  specialX: null,
  specialYBot: 0
};

let CTRL = { ...CTRL_DEFAULTS };
let CTRL_EDIT_MODE = false;
let _ctrlDragActive = false;
const _ctrlTouchMap = {};
const _resizeTouches = {};

let JOY_ID = null;
let JOY_ORIGIN = { x: 0, y: 0 };

export const MobileControls = {
  isEditMode() {
    return CTRL_EDIT_MODE;
  },

  isMobile() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width:900px),(pointer:coarse)').matches;
  },

  loadCtrlLayout() {
    try {
      const raw = localStorage.getItem('db_mobile_controls');
      if (raw) {
        const saved = JSON.parse(raw);
        Object.assign(CTRL, saved);
      }
    } catch (e) {}
  },

  saveCtrlLayout() {
    try {
      localStorage.setItem('db_mobile_controls', JSON.stringify(CTRL));
    } catch (e) {}
  },

  resetCtrlLayout() {
    CTRL = { ...CTRL_DEFAULTS };
    this.saveCtrlLayout();
    this.applyJoyLayout();
  },

  shouldShowTouchControls() {
    if (typeof window === 'undefined') return false;
    if (!this.isMobile() && !CTRL_EDIT_MODE) return false;

    // Strict rule: Gameplay touch controls must appear ONLY when gameplay is active
    if (GameState.STATE !== GameStates.PLAYING) return false;

    // Suppress during any cinematics or sequences
    if (GameState.CINEMATIC_ACTIVE || GameState.BOSS_INTRO_ACTIVE || GameState.WARP_ACTIVE) return false;
    if (GameState.ACTIVE_LORE_MODAL || GameState.ACTIVE_WEAPON_REPLACE_MODAL || GameState.ACTIVE_MEMORY_ECHO) return false;

    // Check specific active cinematic controllers
    if (typeof window !== 'undefined') {
      if (window.ShatteredMindCinematic && window.ShatteredMindCinematic.isActive && window.ShatteredMindCinematic.isActive()) return false;
      if (window.LastEmberCinematic && window.LastEmberCinematic.isActive && window.LastEmberCinematic.isActive()) return false;
      if (window.CinematicDirector && window.CinematicDirector.isActive && window.CinematicDirector.isActive()) return false;
      if (window.EndingCinematics && window.EndingCinematics.isActive && window.EndingCinematics.isActive()) return false;
      if (window.WardenDefeatCinematic && window.WardenDefeatCinematic.isActive && window.WardenDefeatCinematic.isActive()) return false;
    }

    // Suppress if player is dead or dying
    if (GameState.P && (GameState.P.dead || GameState.P.dying)) return false;

    return true;
  },

  releaseAllInputs() {
    InputManager.TOUCH_DIR.x = 0;
    InputManager.TOUCH_DIR.y = 0;
    JOY_ID = null;
    const dpadArrows = document.querySelectorAll('.dpad-arrow');
    dpadArrows.forEach(a => a.classList.remove('active'));
    const combatBtns = document.querySelectorAll('.combat-touch-btn');
    combatBtns.forEach(b => b.classList.remove('active'));
  },

  updateWeaponDock() {
    if (typeof document === 'undefined') return;
    const dock = document.getElementById('mobile-weapon-dock');
    if (!dock) return;

    const slots = GameState.weaponSlots || [];
    const activeSlot = GameState.activeWeaponSlot || 0;

    const svgIcons = {
      sword: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M18 3l3 3-9 9-2-1 8-11z" fill="#f1f5f9"/><path d="M10 13l-2-2 1-1 2 2-1 1z" fill="#94a3b8"/><path d="M7 15l-3 3 2 2 3-3-2-2z" fill="#c084fc"/><circle cx="4" cy="20" r="1.5" fill="#fde68a"/></svg>',
      bow: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M5 4c7 2 13 8 13 16" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round"/><line x1="5" y1="4" x2="18" y2="20" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="1 1"/><line x1="6" y1="17" x2="16" y2="7" stroke="#38bdf8" stroke-width="1.8"/><polygon points="16,7 12,8 15,11" fill="#38bdf8"/></svg>',
      axe: '<svg viewBox="0 0 24 24" width="22" height="22"><line x1="5" y1="19" x2="17" y2="5" stroke="#78350f" stroke-width="2.5" stroke-linecap="round"/><path d="M13 5c2-3 7-1 7 3s-4 4-5 4" fill="#64748b" stroke="#cbd5e1" stroke-width="1.2"/><path d="M11 9c-2-2-1-5 2-4l2 3z" fill="#475569"/></svg>',
      dagger: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M16 4l4 4-7 7-3-1 6-10z" fill="#38bdf8"/><line x1="8" y1="13" x2="11" y2="16" stroke="#ca8a04" stroke-width="2"/><circle cx="5" cy="19" r="2" fill="#ca8a04"/></svg>',
      spear: '<svg viewBox="0 0 24 24" width="22" height="22"><line x1="4" y1="20" x2="16" y2="8" stroke="#ca8a04" stroke-width="2"/><polygon points="15,9 20,4 19,9" fill="#a855f7"/><polygon points="16,4 20,4 20,8" fill="#d8b4fe"/><line x1="12" y1="12" x2="14" y2="10" stroke="#eab308" stroke-width="1.5"/></svg>'
    };

    const nameMap = {
      sword: 'SWORD',
      bow: 'BOW',
      axe: 'AXE',
      dagger: 'DAGGER',
      spear: 'TRIDENT'
    };

    for (let i = 0; i < 3; i++) {
      const slotEl = document.getElementById(`m-slot-${i}`);
      if (!slotEl) continue;

      const w = slots[i];
      const isActive = (i === activeSlot);

      slotEl.classList.toggle('active', isActive);
      slotEl.classList.toggle('empty', !w);

      const iconEl = slotEl.querySelector('.m-wep-icon');
      const nameEl = slotEl.querySelector('.m-wep-name');

      if (w) {
        if (iconEl) iconEl.innerHTML = svgIcons[w.id] || svgIcons.sword;
        if (nameEl) nameEl.textContent = nameMap[w.id] || (w.name ? w.name.toUpperCase() : 'WEAPON');
        slotEl.style.borderColor = isActive ? '#ffd700' : ((w.rarity && w.rarity.col) ? w.rarity.col : '#475569');
      } else {
        if (iconEl) iconEl.innerHTML = '<span style="color:#475569;font-size:11px;font-weight:700;">—</span>';
        if (nameEl) nameEl.textContent = 'EMPTY';
        slotEl.style.borderColor = '#334155';
      }
    }
  },

  updateCooldownDisplay() {
    if (typeof document === 'undefined') return;
    const specialBtn = document.getElementById('special-btn');
    const cdOverlay = document.getElementById('special-cd-overlay');
    const cdText = document.getElementById('special-cd-text');
    if (!specialBtn) return;

    const { P } = GameState;
    if (P && P.qCooldown > 0) {
      specialBtn.classList.add('on-cooldown');
      const maxCd = P.qMaxCooldown || 5.0;
      const pct = Math.max(0, Math.min(100, (P.qCooldown / maxCd) * 100));
      if (cdOverlay) cdOverlay.style.height = `${pct}%`;
      if (cdText) cdText.textContent = `${P.qCooldown.toFixed(1)}s`;
    } else {
      specialBtn.classList.remove('on-cooldown');
      if (cdOverlay) cdOverlay.style.height = '0%';
      if (cdText) cdText.textContent = '';
    }
  },

  updateWeaponIcons() {
    if (typeof document === 'undefined') return;
    const atkBtn = document.getElementById('atk-btn');
    if (!atkBtn) return;
    const curWep = GameState.P ? GameState.P.wep : 'sword';
    if (curWep === 'bow') {
      atkBtn.style.backgroundImage = "url('assets/ui/btn_shoot.png')";
      atkBtn.setAttribute('aria-label', 'Shoot Bow');
    } else {
      atkBtn.style.backgroundImage = "url('assets/ui/btn_attack.png')";
      atkBtn.setAttribute('aria-label', 'Attack');
    }
  },

  applyJoyLayout() {
    if (typeof window === 'undefined') return;
    const joyZone = document.getElementById('joy-zone');
    const atkBtn = document.getElementById('atk-btn');
    const shootBtn = document.getElementById('shoot-btn');
    const specialBtn = document.getElementById('special-btn');
    const weaponDock = document.getElementById('mobile-weapon-dock');
    if (!joyZone || !atkBtn || !shootBtn || !specialBtn) return;

    this.updateWeaponIcons();

    const sw = window.innerWidth, sh = window.innerHeight;
    const jx = Math.max(16, Math.min(sw - CTRL.joySize, CTRL.joyX));
    const jy = sh - CTRL.joyYBot - CTRL.joySize;
    joyZone.style.left = `${jx}px`;
    joyZone.style.top = `${jy}px`;
    joyZone.style.width = `${CTRL.joySize}px`;
    joyZone.style.height = `${CTRL.joySize}px`;

    const ax = CTRL.atkX !== null ? Math.max(0, Math.min(sw - CTRL.atkSize, CTRL.atkX)) : sw - 28 - CTRL.atkSize;
    const ay = sh - CTRL.atkYBot - CTRL.atkSize;
    atkBtn.style.left = `${ax}px`;
    atkBtn.style.top = `${ay}px`;
    atkBtn.style.width = `${CTRL.atkSize}px`;
    atkBtn.style.height = `${CTRL.atkSize}px`;

    const shSz = CTRL.shootSize;
    const shx = CTRL.shootX !== null ? Math.max(0, Math.min(sw - shSz, CTRL.shootX)) : sw - 28 - shSz;
    const shy = CTRL.shootYBot !== 0 ? sh - CTRL.shootYBot - shSz : ay - shSz - 12;
    const hasBowInLoadout = GameState.weaponSlots && GameState.weaponSlots.some(w => w && w.id === 'bow');
    const isBowEquipped = GameState.P && GameState.P.wep === 'bow';
    const showShoot = CTRL_EDIT_MODE || (this.isMobile() && (hasBowInLoadout || isBowEquipped));
    shootBtn.style.left = `${shx}px`;
    shootBtn.style.top = `${shy}px`;
    shootBtn.style.width = `${shSz}px`;
    shootBtn.style.height = `${shSz}px`;
    shootBtn.style.display = showShoot ? 'block' : 'none';

    const spSz = CTRL.specialSize;
    const spx = CTRL.specialX !== null ? Math.max(0, Math.min(sw - spSz, CTRL.specialX)) : (showShoot ? shx - spSz - 12 : sw - 28 - spSz);
    const spy = CTRL.specialYBot !== 0 ? sh - CTRL.specialYBot - spSz : (showShoot ? shy : ay - spSz - 12);
    const hasWep = GameState.P && !!GameState.P.wep;
    const showSpecial = CTRL_EDIT_MODE || (this.isMobile() && hasWep);
    specialBtn.style.left = `${spx}px`;
    specialBtn.style.top = `${spy}px`;
    specialBtn.style.width = `${spSz}px`;
    specialBtn.style.height = `${spSz}px`;
    specialBtn.style.display = showSpecial ? 'block' : 'none';

    if (weaponDock) {
      // Center weapon dock horizontally; adapt vertical position for portrait orientation
      const isPortrait = sh > sw || (window.innerHeight > window.innerWidth);
      weaponDock.style.bottom = isPortrait ? '116px' : 'max(14px, env(safe-area-inset-bottom, 14px))';
      weaponDock.style.left = '50%';
      weaponDock.style.transform = 'translateX(-50%)';
    }
  },

  updateTouchVis() {
    if (typeof window === 'undefined') return;
    const touchOv = document.getElementById('touch-overlay');
    const ingamePauseBtn = document.getElementById('ingame-pause-btn');
    const ingameMapBtn = document.getElementById('ingame-map-btn');
    const spPanel = document.getElementById('ingame-speed-panel');

    const show = this.shouldShowTouchControls();

    if (touchOv) {
      touchOv.style.display = show ? 'block' : 'none';
      if (show) {
        this.applyJoyLayout();
        this.updateWeaponDock();
        this.updateCooldownDisplay();
      }
    }

    if (ingamePauseBtn) {
      const showPause = (this.isMobile() || CTRL_EDIT_MODE) && show;
      ingamePauseBtn.style.display = showPause ? 'flex' : 'none';
    }

    if (ingameMapBtn) {
      const showMap = (this.isMobile() || CTRL_EDIT_MODE) && show;
      ingameMapBtn.style.display = showMap ? 'flex' : 'none';
    }

    if (!show && spPanel && GameState.STATE !== GameStates.PAUSED) {
      spPanel.style.display = 'none';
    }

    if (!show) {
      this.releaseAllInputs();
    }
  },

  hideTouchForCinematic() {
    const touchOv = document.getElementById('touch-overlay');
    const ingamePauseBtn = document.getElementById('ingame-pause-btn');
    const ingameMapBtn = document.getElementById('ingame-map-btn');
    if (touchOv) touchOv.style.display = 'none';
    if (ingamePauseBtn) ingamePauseBtn.style.display = 'none';
    if (ingameMapBtn) ingameMapBtn.style.display = 'none';
    this.releaseAllInputs();
  },

  restoreTouchAfterCinematic() {
    this.updateTouchVis();
  },

  enterCtrlEditMode() {
    CTRL_EDIT_MODE = true;
    const touchOv = document.getElementById('touch-overlay');
    const ctrlEditHint = document.getElementById('ctrl-edit-hint');
    const shootBtn = document.getElementById('shoot-btn');
    const specialBtn = document.getElementById('special-btn');
    if (touchOv) {
      touchOv.style.display = 'block';
      touchOv.classList.add('ctrl-edit-mode');
    }
    if (ctrlEditHint) ctrlEditHint.style.display = 'block';
    if (shootBtn) shootBtn.style.display = 'block';
    if (specialBtn) specialBtn.style.display = 'block';
  },

  exitCtrlEditMode() {
    CTRL_EDIT_MODE = false;
    const touchOv = document.getElementById('touch-overlay');
    const ctrlEditHint = document.getElementById('ctrl-edit-hint');
    if (touchOv) touchOv.classList.remove('ctrl-edit-mode');
    if (ctrlEditHint) ctrlEditHint.style.display = 'none';
    this.saveCtrlLayout();
    this.updateTouchVis();
  },

  tick(dt) {
    if (this.shouldShowTouchControls()) {
      this.updateCooldownDisplay();
      this.updateWeaponDock();
    }
  },

  init() {
    if (typeof window === 'undefined') return;
    this.loadCtrlLayout();

    const joyZone = document.getElementById('joy-zone');
    const atkBtn = document.getElementById('atk-btn');
    const shootBtn = document.getElementById('shoot-btn');
    const specialBtn = document.getElementById('special-btn');
    const ingamePauseBtn = document.getElementById('ingame-pause-btn');
    const ingameSpeedPanel = document.getElementById('ingame-speed-panel');
    const spResumeBtn = document.getElementById('sp-resume-btn');

    const dpadUp = document.getElementById('dpad-up');
    const dpadDown = document.getElementById('dpad-down');
    const dpadLeft = document.getElementById('dpad-left');
    const dpadRight = document.getElementById('dpad-right');

    const updateDpadVisuals = (dx, dy) => {
      if (dpadUp) dpadUp.classList.toggle('active', dy < 0);
      if (dpadDown) dpadDown.classList.toggle('active', dy > 0);
      if (dpadLeft) dpadLeft.classList.toggle('active', dx < 0);
      if (dpadRight) dpadRight.classList.toggle('active', dx > 0);
    };

    const handleDpadMove = (clientX, clientY) => {
      const dx = clientX - JOY_ORIGIN.x;
      const dy = clientY - JOY_ORIGIN.y;
      const dist = Math.hypot(dx, dy);
      const deadzone = 8;
      if (dist < deadzone) {
        InputManager.TOUCH_DIR.x = 0;
        InputManager.TOUCH_DIR.y = 0;
        updateDpadVisuals(0, 0);
        return;
      }
      const normX = dx / dist;
      const normY = dy / dist;
      // Allow diagonal movement when between axes (|norm| > 0.38)
      const dirX = Math.abs(normX) > 0.38 ? (normX > 0 ? 1 : -1) : 0;
      const dirY = Math.abs(normY) > 0.38 ? (normY > 0 ? 1 : -1) : 0;
      InputManager.TOUCH_DIR.x = dirX;
      InputManager.TOUCH_DIR.y = dirY;
      updateDpadVisuals(dirX, dirY);
    };

    const joyRelease = () => {
      InputManager.TOUCH_DIR.x = 0;
      InputManager.TOUCH_DIR.y = 0;
      updateDpadVisuals(0, 0);
      JOY_ID = null;
    };

    if (joyZone) {
      joyZone.addEventListener('touchstart', e => {
        if (CTRL_EDIT_MODE) return;
        AudioManager.init();
        const t = e.changedTouches[0];
        JOY_ID = t.identifier;
        const r = joyZone.getBoundingClientRect();
        JOY_ORIGIN = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        handleDpadMove(t.clientX, t.clientY);
      }, { passive: false });

      joyZone.addEventListener('touchmove', e => {
        if (CTRL_EDIT_MODE) return;
        for (const t of e.changedTouches) {
          if (t.identifier !== JOY_ID) continue;
          handleDpadMove(t.clientX, t.clientY);
        }
      }, { passive: false });

      joyZone.addEventListener('touchend', joyRelease);
      joyZone.addEventListener('touchcancel', joyRelease);

      // Pointer event fallbacks for testing and mouse
      joyZone.addEventListener('pointerdown', e => {
        if (CTRL_EDIT_MODE || e.pointerType === 'touch') return;
        JOY_ID = e.pointerId;
        const r = joyZone.getBoundingClientRect();
        JOY_ORIGIN = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        handleDpadMove(e.clientX, e.clientY);
      });
      window.addEventListener('pointermove', e => {
        if (CTRL_EDIT_MODE || JOY_ID !== e.pointerId || e.pointerType === 'touch') return;
        handleDpadMove(e.clientX, e.clientY);
      });
      window.addEventListener('pointerup', e => {
        if (JOY_ID === e.pointerId) joyRelease();
      });
      window.addEventListener('pointercancel', e => {
        if (JOY_ID === e.pointerId) joyRelease();
      });
      window.addEventListener('blur', joyRelease);
    }

    if (atkBtn) {
      const doAtk = (e) => {
        e.preventDefault();
        AudioManager.init();
        if (CTRL_EDIT_MODE) return;
        atkBtn.classList.add('active');
        if (GameState.STATE === GameStates.PLAYING) CombatSystem.doAttack();
      };
      const endAtk = () => atkBtn.classList.remove('active');
      atkBtn.addEventListener('touchstart', doAtk, { passive: false });
      atkBtn.addEventListener('touchend', endAtk);
      atkBtn.addEventListener('touchcancel', endAtk);
      atkBtn.addEventListener('pointerdown', e => {
        if (e.pointerType === 'touch') return;
        doAtk(e);
      });
      atkBtn.addEventListener('pointerup', endAtk);
      atkBtn.addEventListener('pointercancel', endAtk);
    }

    if (shootBtn) {
      const doShoot = (e) => {
        e.preventDefault();
        AudioManager.init();
        if (CTRL_EDIT_MODE) return;
        shootBtn.classList.add('active');
        if (GameState.STATE === GameStates.PLAYING && GameState.P) {
          if (GameState.P.wep !== 'bow' && GameState.weaponSlots) {
            const bIdx = GameState.weaponSlots.findIndex(w => w && w.id === 'bow');
            if (bIdx !== -1) {
              WeaponInventory.switchWeaponSlot(bIdx);
              this.updateWeaponDock();
              this.applyJoyLayout();
            }
          }
          if (GameState.P.wep === 'bow') {
            CombatSystem.doAttack();
          }
        }
      };
      const endShoot = () => shootBtn.classList.remove('active');
      shootBtn.addEventListener('touchstart', doShoot, { passive: false });
      shootBtn.addEventListener('touchend', endShoot);
      shootBtn.addEventListener('touchcancel', endShoot);
      shootBtn.addEventListener('pointerdown', e => {
        if (e.pointerType === 'touch') return;
        doShoot(e);
      });
      shootBtn.addEventListener('pointerup', endShoot);
      shootBtn.addEventListener('pointercancel', endShoot);
    }

    if (specialBtn) {
      const doSpec = (e) => {
        e.preventDefault();
        AudioManager.init();
        if (CTRL_EDIT_MODE) return;
        specialBtn.classList.add('active');
        if (GameState.STATE === GameStates.PLAYING) {
          CombatSystem.triggerWeaponAbility();
          this.updateCooldownDisplay();
        }
      };
      const endSpec = () => specialBtn.classList.remove('active');
      specialBtn.addEventListener('touchstart', doSpec, { passive: false });
      specialBtn.addEventListener('touchend', endSpec);
      specialBtn.addEventListener('touchcancel', endSpec);
      specialBtn.addEventListener('pointerdown', e => {
        if (e.pointerType === 'touch') return;
        doSpec(e);
      });
      specialBtn.addEventListener('pointerup', endSpec);
      specialBtn.addEventListener('pointercancel', endSpec);
    }

    // Mobile Weapon Dock touch & click switching
    for (let i = 0; i < 3; i++) {
      const slotEl = document.getElementById(`m-slot-${i}`);
      if (slotEl) {
        let lastTouchTime = 0;
        const switchSlot = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const now = Date.now();
          if (e.type === 'click' && now - lastTouchTime < 400) return;
          if (e.type === 'touchstart') lastTouchTime = now;
          AudioManager.init();
          if (GameState.STATE === GameStates.PLAYING) {
            WeaponInventory.switchWeaponSlot(i);
            SoundManager.snd('weapon_pickup');
            this.updateWeaponDock();
            this.applyJoyLayout();
          }
        };
        slotEl.addEventListener('touchstart', switchSlot, { passive: false });
        slotEl.addEventListener('click', switchSlot);
      }
    }

    // Ingame map button -> toggles Minimap / Tactical Floor Map
    const ingameMapBtn = document.getElementById('ingame-map-btn');
    if (ingameMapBtn) {
      let lastMapTouchTime = 0;
      const handleMap = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const now = Date.now();
        if (e.type === 'click' && now - lastMapTouchTime < 400) return;
        if (e.type === 'touchstart') lastMapTouchTime = now;
        AudioManager.init();
        if (GameState.STATE === GameStates.PLAYING) {
          HUD.toggleMinimap();
          SoundManager.snd('panel_open');
        }
      };
      ingameMapBtn.addEventListener('touchstart', handleMap, { passive: false });
      ingameMapBtn.addEventListener('click', handleMap);
    }

    // Ingame pause button -> opens Tactical Pause Menu
    if (ingamePauseBtn) {
      let lastPauseTouchTime = 0;
      const handlePause = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const now = Date.now();
        if (e.type === 'click' && now - lastPauseTouchTime < 400) return;
        if (e.type === 'touchstart') lastPauseTouchTime = now;
        AudioManager.init();
        if (GameState.STATE === GameStates.PLAYING) {
          pauseGame();
        } else if (GameState.STATE === GameStates.PAUSED) {
          resumeGame();
        }
        this.updateTouchVis();
      };
      ingamePauseBtn.addEventListener('touchstart', handlePause, { passive: false });
      ingamePauseBtn.addEventListener('click', handlePause);
    }

    if (spResumeBtn && ingameSpeedPanel) {
      const resume = (e) => {
        e.preventDefault();
        e.stopPropagation();
        ingameSpeedPanel.style.display = 'none';
        GameState.setState(GameStates.PLAYING);
      };
      spResumeBtn.addEventListener('touchstart', resume, { passive: false });
      spResumeBtn.addEventListener('click', resume);
    }

    if (ingameSpeedPanel) {
      ingameSpeedPanel.querySelectorAll('.sp-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const spd = parseFloat(btn.dataset.spd);
          if (!isNaN(spd)) {
            GameState.GAME_SPEED = spd;
            ingameSpeedPanel.querySelectorAll('.sp-btn').forEach(b => {
              b.classList.toggle('active', Math.abs(parseFloat(b.dataset.spd) - spd) < 0.01);
            });
          }
        });
      });
    }

    // Subscribe to EventBus state and weapon changes
    EventBus.on('state:change', () => {
      this.updateTouchVis();
    });
    const handleWepChange = () => {
      this.updateWeaponDock();
      this.applyJoyLayout();
    };
    EventBus.on('weapon:change', handleWepChange);
    EventBus.on('weapon:switched', handleWepChange);

    window.addEventListener('resize', () => this.updateTouchVis());
    window.addEventListener('orientationchange', () => {
      this.releaseAllInputs();
      setTimeout(() => this.updateTouchVis(), 120);
    });
    window.addEventListener('visibilitychange', () => {
      if (document.hidden) this.releaseAllInputs();
    });
    window.addEventListener('blur', () => this.releaseAllInputs());
    window.addEventListener('pointercancel', () => this.releaseAllInputs());
    window.addEventListener('touchcancel', () => this.releaseAllInputs());

    this.updateTouchVis();
  }
};

if (typeof window !== 'undefined') {
  window.MobileControls = MobileControls;
}
