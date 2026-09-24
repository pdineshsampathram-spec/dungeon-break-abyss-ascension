// =====================================================================
//  DUNGEON BREAK — js/core/EventBus.js
//  Decoupled publish/subscribe event bus
// =====================================================================

class EventBusImpl {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const arr = this.listeners.get(event);
    const idx = arr.indexOf(callback);
    if (idx !== -1) arr.splice(idx, 1);
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event).slice();
    for (const cb of callbacks) {
      try {
        cb(data);
      } catch (err) {
        console.error(`[EventBus] Error in handler for event "${event}":`, err);
      }
    }
  }

  clear() {
    this.listeners.clear();
  }
}

export const EventBus = new EventBusImpl();
