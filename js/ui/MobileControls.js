// =====================================================================
//  DUNGEON BREAK — js/ui/MobileControls.js
//  Authoritative Virtual Joystick, Action Buttons, & Layout Editor
// =====================================================================

import { GameState, GameStates } from '../core/GameState.js';
import { InputManager } from '../core/InputManager.js';
import { CombatSystem } from '../combat/CombatSystem.js';
import { AudioManager } from '../audio/AudioManager.js';

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
  specialSize: 58,
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

  applyJoyLayout() {
    if (typeof window === 'undefined') return;
    const joyZone = document.getElementById('joy-zone');
    const joyKnob = document.getElementById('joy-knob');
    const atkBtn = document.getElementById('atk-btn');
    const shootBtn = document.getElementById('shoot-btn');
    const specialBtn = document.getElementById('special-btn');
    if (!joyZone || !joyKnob || !atkBtn || !shootBtn || !specialBtn) return;

    const sw = window.innerWidth, sh = window.innerHeight;
    const jx = Math.max(0, Math.min(sw - CTRL.joySize, CTRL.joyX));
    const jy = sh - CTRL.joyYBot - CTRL.joySize;
    joyZone.style.cssText = `position:absolute;left:${jx}px;top:${jy}px;width:${CTRL.joySize}px;height:${CTRL.joySize}px;pointer-events:all;touch-action:none`;
    joyKnob.style.width = joyKnob.style.height = Math.floor(CTRL.joySize * 0.4) + 'px';

    const ax = CTRL.atkX !== null ? Math.max(0, Math.min(sw - CTRL.atkSize, CTRL.atkX)) : sw - 28 - CTRL.atkSize;
    const ay = sh - CTRL.atkYBot - CTRL.atkSize;
    atkBtn.style.cssText = `position:absolute;left:${ax}px;top:${ay}px;width:${CTRL.atkSize}px;height:${CTRL.atkSize}px;border-radius:50%;background:rgba(239,68,68,.18);border:2px solid rgba(239,68,68,.55);pointer-events:all;touch-action:none;display:flex;align-items:center;justify-content:center;font-size:${(CTRL.atkSize * 0.35) | 0}px;color:rgba(239,68,68,.9);user-select:none`;

    const shSz = CTRL.shootSize;
    const shx = CTRL.shootX !== null ? Math.max(0, Math.min(sw - shSz, CTRL.shootX)) : sw - 28 - shSz;
    const shy = CTRL.shootYBot !== 0 ? sh - CTRL.shootYBot - shSz : ay - shSz - 10;
    const isBow = GameState.P && GameState.P.wep === 'bow';
    const showShoot = CTRL_EDIT_MODE || (this.isMobile() && isBow);
    shootBtn.style.cssText = `position:absolute;left:${shx}px;top:${shy}px;width:${shSz}px;height:${shSz}px;border-radius:50%;background:rgba(52,211,153,.18);border:2px solid rgba(52,211,153,.55);pointer-events:all;touch-action:none;display:${showShoot ? 'flex' : 'none'};align-items:center;justify-content:center;font-size:${(shSz * 0.38) | 0}px;color:rgba(52,211,153,.9);user-select:none`;

    const spSz = CTRL.specialSize;
    const spx = CTRL.specialX !== null ? Math.max(0, Math.min(sw - spSz, CTRL.specialX)) : sw - 28 - spSz;
    const spy = CTRL.specialYBot !== 0 ? sh - CTRL.specialYBot - spSz : shy - spSz - 10;
    const hasWep = GameState.P && !!GameState.P.wep;
    const showSpecial = CTRL_EDIT_MODE || (this.isMobile() && hasWep);
    specialBtn.style.cssText = `position:absolute;left:${spx}px;top:${spy}px;width:${spSz}px;height:${spSz}px;border-radius:50%;background:rgba(255,215,0,.25);border:2px solid gold;box-shadow:0 0 10px rgba(255,215,0,0.4);pointer-events:all;touch-action:none;display:${showSpecial ? 'flex' : 'none'};align-items:center;justify-content:center;font-size:${(spSz * 0.38) | 0}px;user-select:none`;
  },

  updateTouchVis() {
    if (typeof window === 'undefined') return;
    const touchOv = document.getElementById('touch-overlay');
    if (!touchOv) return;
    if (this.isMobile()) {
      touchOv.style.display = 'block';
      this.applyJoyLayout();
    } else {
      touchOv.style.display = 'none';
    }
  },

  hideTouchForCinematic() {
    const touchOv = document.getElementById('touch-overlay');
    if (touchOv && this.isMobile()) touchOv.style.display = 'none';
  },

  restoreTouchAfterCinematic() {
    const touchOv = document.getElementById('touch-overlay');
    if (touchOv && this.isMobile()) {
      touchOv.style.display = 'block';
      this.applyJoyLayout();
    }
  },

  enterCtrlEditMode() {
    CTRL_EDIT_MODE = true;
    const touchOv = document.getElementById('touch-overlay');
    const ctrlEditHint = document.getElementById('ctrl-edit-hint');
    const shootBtn = document.getElementById('shoot-btn');
    const specialBtn = document.getElementById('special-btn');
    if (touchOv) touchOv.classList.add('ctrl-edit-mode');
    if (ctrlEditHint) ctrlEditHint.style.display = 'block';
    if (shootBtn) shootBtn.style.display = 'flex';
    if (specialBtn) specialBtn.style.display = 'flex';
  },

  exitCtrlEditMode() {
    CTRL_EDIT_MODE = false;
    const touchOv = document.getElementById('touch-overlay');
    const ctrlEditHint = document.getElementById('ctrl-edit-hint');
    if (touchOv) touchOv.classList.remove('ctrl-edit-mode');
    if (ctrlEditHint) ctrlEditHint.style.display = 'none';
    this.saveCtrlLayout();
    this.applyJoyLayout();
  },

  init() {
    if (typeof window === 'undefined') return;
    this.loadCtrlLayout();

    const joyZone = document.getElementById('joy-zone');
    const joyKnob = document.getElementById('joy-knob');
    const atkBtn = document.getElementById('atk-btn');
    const shootBtn = document.getElementById('shoot-btn');
    const specialBtn = document.getElementById('special-btn');
    const touchOv = document.getElementById('touch-overlay');
    const ingamePauseBtn = document.getElementById('ingame-pause-btn');
    const ingameSpeedPanel = document.getElementById('ingame-speed-panel');
    const spResumeBtn = document.getElementById('sp-resume-btn');

    if (joyZone && joyKnob) {
      joyZone.addEventListener('touchstart', e => {
        if (CTRL_EDIT_MODE) return;
        AudioManager.init();
        const t = e.changedTouches[0];
        JOY_ID = t.identifier;
        const r = joyZone.getBoundingClientRect();
        JOY_ORIGIN = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }, { passive: false });

      joyZone.addEventListener('touchmove', e => {
        if (CTRL_EDIT_MODE) return;
        for (const t of e.changedTouches) {
          if (t.identifier !== JOY_ID) continue;
          const dx = t.clientX - JOY_ORIGIN.x;
          const dy = t.clientY - JOY_ORIGIN.y;
          const maxR = CTRL.joySize * 0.38;
          const dist = Math.hypot(dx, dy);
          const cd = Math.min(dist, maxR);
          const nx = dist > 0 ? (cd / dist) * dx : 0;
          const ny = dist > 0 ? (cd / dist) * dy : 0;
          joyKnob.style.transform = `translate(calc(-50% + ${nx}px),calc(-50% + ${ny}px))`;
          const targetX = dx / maxR;
          const targetY = dy / maxR;
          InputManager.TOUCH_DIR.x += (targetX - InputManager.TOUCH_DIR.x) * 0.25;
          InputManager.TOUCH_DIR.y += (targetY - InputManager.TOUCH_DIR.y) * 0.25;
          if (Math.abs(InputManager.TOUCH_DIR.x) < 0.15) InputManager.TOUCH_DIR.x = 0;
          if (Math.abs(InputManager.TOUCH_DIR.y) < 0.15) InputManager.TOUCH_DIR.y = 0;
        }
      }, { passive: false });

      const joyRelease = () => {
        InputManager.TOUCH_DIR.x = 0;
        InputManager.TOUCH_DIR.y = 0;
        joyKnob.style.transform = 'translate(-50%,-50%)';
        JOY_ID = null;
      };
      joyZone.addEventListener('touchend', joyRelease);
      joyZone.addEventListener('touchcancel', joyRelease);
    }

    if (atkBtn) {
      atkBtn.addEventListener('touchstart', e => {
        e.preventDefault();
        AudioManager.init();
        if (CTRL_EDIT_MODE) return;
        if (GameState.STATE === GameStates.PLAYING) CombatSystem.doAttack();
      }, { passive: false });
    }

    if (shootBtn) {
      shootBtn.addEventListener('touchstart', e => {
        e.preventDefault();
        if (CTRL_EDIT_MODE) return;
        if (GameState.STATE === GameStates.PLAYING && GameState.P.wep === 'bow') CombatSystem.doAttack();
      }, { passive: false });
    }

    if (specialBtn) {
      specialBtn.addEventListener('touchstart', e => {
        e.preventDefault();
        if (CTRL_EDIT_MODE) return;
        if (GameState.STATE === GameStates.PLAYING) CombatSystem.triggerWeaponAbility();
      }, { passive: false });
    }

    // Ingame pause button & speed panel controls
    if (ingamePauseBtn && ingameSpeedPanel) {
      const toggleSpd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const vis = ingameSpeedPanel.style.display === 'block';
        ingameSpeedPanel.style.display = vis ? 'none' : 'block';
        if (!vis) GameState.setState(GameStates.PAUSED);
      };
      ingamePauseBtn.addEventListener('touchstart', toggleSpd, { passive: false });
      ingamePauseBtn.addEventListener('click', toggleSpd);
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

    window.addEventListener('resize', () => this.updateTouchVis());
    this.updateTouchVis();
  }
};
