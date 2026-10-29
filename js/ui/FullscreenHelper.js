// =====================================================================
//  DUNGEON BREAK — js/ui/FullscreenHelper.js
//  Safe Browser Fullscreen & Landscape Orientation Lock Coordinator
// =====================================================================

export const FullscreenHelper = {
  isSupported() {
    if (typeof document === 'undefined') return false;
    return !!(
      document.fullscreenEnabled ||
      document.webkitFullscreenEnabled ||
      document.mozFullScreenEnabled ||
      document.msFullscreenEnabled
    );
  },

  isFullscreen() {
    if (typeof document === 'undefined') return false;
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  },

  async requestFullscreen(targetElement = (typeof document !== 'undefined' ? document.documentElement : null)) {
    if (!targetElement) return false;
    try {
      if (targetElement.requestFullscreen) {
        await targetElement.requestFullscreen({ navigationUI: 'hide' });
      } else if (targetElement.webkitRequestFullscreen) {
        await targetElement.webkitRequestFullscreen();
      } else if (targetElement.mozRequestFullScreen) {
        await targetElement.mozRequestFullScreen();
      } else if (targetElement.msRequestFullscreen) {
        await targetElement.msRequestFullscreen();
      }

      // Best-effort landscape orientation lock after user gesture
      if (typeof screen !== 'undefined' && screen.orientation && screen.orientation.lock) {
        try {
          await screen.orientation.lock('landscape').catch(() => {});
        } catch (_) {}
      }
      return true;
    } catch (err) {
      console.warn('[FullscreenHelper] Fullscreen request rejected or unsupported by browser:', err);
      return false;
    }
  },

  async exitFullscreen() {
    if (typeof document === 'undefined') return false;
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
      return true;
    } catch (err) {
      console.warn('[FullscreenHelper] Exit fullscreen rejected:', err);
      return false;
    }
  },

  async toggle(targetElement = (typeof document !== 'undefined' ? document.documentElement : null)) {
    if (this.isFullscreen()) {
      return await this.exitFullscreen();
    } else {
      return await this.requestFullscreen(targetElement);
    }
  }
};

if (typeof window !== 'undefined') {
  window.FullscreenHelper = FullscreenHelper;
}
