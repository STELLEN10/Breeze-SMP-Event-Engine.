export class EventRegistry {
  constructor() {
    this.handlers = new Map();
  }

  register(type, handler) {
    if (this.handlers.has(type)) {
      throw new Error(`Duplicate event handler: ${type}`);
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

// Stage 1 intentionally registers no runnable events. Later stages add handlers
// with onWarning, onStart, onTick, onComplete, and onCleanup lifecycle methods.
export const eventRegistry = new EventRegistry();
