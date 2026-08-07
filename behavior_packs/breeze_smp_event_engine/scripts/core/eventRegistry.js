export class EventRegistry {
  constructor() {
    this.handlers = new Map();
  }

  register(type, handler) {
    if (this.handlers.has(type)) {
      throw new Error(`Duplicate event handler: ${type}`);
    }
    if (!handler || typeof handler !== "object") {
      throw new Error(`Event handler '${type}' must be an object.`);
    }
    this.handlers.set(type, handler);
  }

  get(type) {
    return this.handlers.get(type);
  }

  has(type) {
    return this.handlers.has(type);
  }
}

// Stage 2 lifecycle: onWarning, onCountdown, onStart, onTick, onPlayerJoin,
// onComplete, onCleanup, and onRecover. Stage 3 registers Supply Drop.
export const eventRegistry = new EventRegistry();
