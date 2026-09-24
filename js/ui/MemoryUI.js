// =====================================================================
//  DUNGEON BREAK — js/ui/MemoryUI.js
//  Narrative Story Memory Echo Modal UI facade
// =====================================================================

import { drawMemoryEchoModal, handleMemoryEchoClick } from './CodexUI.js';

export const MemoryUI = {
  draw(ctx, dt) {
    drawMemoryEchoModal(ctx, dt);
  },
  handleClick(mx, my) {
    return handleMemoryEchoClick(mx, my);
  }
};
