// =====================================================================
//  DUNGEON BREAK — js/cinematics/CinematicAssetManager.js
//  High-Performance Offline Cinematic Asset Cache & Layer Compositor
// =====================================================================

export const CinematicAssetManager = {
  assets: {},
  loaded: {},
  failed: {},
  loadingPromises: [],

  // Manifest of local cinematic assets
  manifest: {
    // Environment
    'env_gothic_chamber_bg': './assets/cinematics/shattered-mind/environment/gothic_chamber_bg.svg',
    'env_baroque_pillars_mid': './assets/cinematics/shattered-mind/environment/baroque_pillars_mid.svg',
    'env_chains_and_debris_fg': './assets/cinematics/shattered-mind/environment/chains_and_debris_fg.svg',

    // Rowan Poses
    'rowan_pose1_standing': './assets/cinematics/shattered-mind/rowan/rowan_pose1_standing.svg',
    'rowan_pose2_alert': './assets/cinematics/shattered-mind/rowan/rowan_pose2_alert.svg',
    'rowan_pose3_weapon_lowered': './assets/cinematics/shattered-mind/rowan/rowan_pose3_weapon_lowered.svg',
    'rowan_pose4_defensive': './assets/cinematics/shattered-mind/rowan/rowan_pose4_defensive.svg',
    'rowan_pose5_confused': './assets/cinematics/shattered-mind/rowan/rowan_pose5_confused.svg',
    'rowan_pose6_head_clutch': './assets/cinematics/shattered-mind/rowan/rowan_pose6_head_clutch.svg',
    'rowan_pose7_kneeling': './assets/cinematics/shattered-mind/rowan/rowan_pose7_kneeling.svg',
    'rowan_pose8_collapsed': './assets/cinematics/shattered-mind/rowan/rowan_pose8_collapsed.svg',
    'rowan_shadow_duplicate': './assets/cinematics/shattered-mind/rowan/rowan_shadow_duplicate.svg',

    // Weapons
    'weapon_sword': './assets/cinematics/shattered-mind/weapons/cinematic_sword.svg',
    'weapon_dagger': './assets/cinematics/shattered-mind/weapons/cinematic_dagger.svg',
    'weapon_axe': './assets/cinematics/shattered-mind/weapons/cinematic_axe.svg',
    'weapon_spear': './assets/cinematics/shattered-mind/weapons/cinematic_spear.svg',
    'weapon_bow': './assets/cinematics/shattered-mind/weapons/cinematic_bow.svg',

    // Supernatural Eyes
    'eye_master': './assets/cinematics/shattered-mind/eyes/supernatural_eye_master.svg',
    'eye_half': './assets/cinematics/shattered-mind/eyes/eye_half_open.svg',
    'eye_slit': './assets/cinematics/shattered-mind/eyes/eye_slit.svg',

    // Memory Flashes
    'mem_sealed_gate': './assets/cinematics/shattered-mind/memories/mem_sealed_gate.svg',
    'mem_lyra': './assets/cinematics/shattered-mind/memories/mem_lyra_silhouette.svg',
    'mem_warden_throne': './assets/cinematics/shattered-mind/memories/mem_warden_throne.svg',
    'mem_blood_stones': './assets/cinematics/shattered-mind/memories/mem_blood_stones.svg',
    'mem_abandoned_corridor': './assets/cinematics/shattered-mind/memories/mem_abandoned_corridor.svg',
    'mem_dungeon_entrance': './assets/cinematics/shattered-mind/memories/mem_dungeon_entrance.svg'
  },

  init() {
    this.preloadAll();
  },

  preloadAll() {
    for (const [key, url] of Object.entries(this.manifest)) {
      if (!this.assets[key]) {
        this.loadAsset(key, url);
      }
    }
  },

  loadAsset(key, url) {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const p = new Promise((resolve) => {
      img.onload = () => {
        this.assets[key] = img;
        this.loaded[key] = true;
        resolve(img);
      };
      img.onerror = (err) => {
        console.warn(`[CinematicAssetManager] Failed to load offline asset: ${key} (${url})`, err);
        this.failed[key] = true;
        resolve(null);
      };
      img.src = url;
    });

    this.loadingPromises.push(p);
    return p;
  },

  get(key) {
    return this.assets[key] || null;
  },

  isLoaded(key) {
    return !!this.loaded[key];
  },

  drawAsset(ctx, key, x, y, w, h, alpha = 1.0, rotation = 0, flipX = false) {
    const img = this.get(key);
    if (!img) return false;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha * (ctx.globalAlpha || 1)));
    ctx.translate(x, y);
    if (rotation !== 0) ctx.rotate(rotation);
    if (flipX) ctx.scale(-1, 1);

    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
    return true;
  }
};

if (typeof window !== 'undefined') {
  window.CinematicAssetManager = CinematicAssetManager;
  CinematicAssetManager.init();
}
