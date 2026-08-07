import { world } from "@minecraft/server";
import { logger } from "./logger.js";

/** Coordinates event lifecycle callbacks; event handlers own their gameplay-specific logic. */
export class EventManager {
  constructor(registry, announcements) {
    this.registry = registry;
    this.announcements = announcements;
  }

  onWarning(event) {
    this.announcements.announceWarning(event, event.warningSeconds);
    return this.invoke(event, "onWarning");
  }

  onCountdown(event, secondsRemaining) {
    this.announcements.announceCountdown(event, secondsRemaining);
    return this.invoke(event, "onCountdown", secondsRemaining);
  }

  onStart(event) {
    const result = this.invoke(event, "onStart");
    if (result.ok) this.announcements.announceGo(event);
    return result;
  }

  onTick(event, nowEpochMs) {
    return this.invoke(event, "onTick", nowEpochMs);
  }

  onComplete(event) {
    const complete = this.invoke(event, "onComplete");
    const cleanup = this.invoke(event, "onCleanup");
    if (complete.ok && cleanup.ok) this.announcements.announceCompletion(event);
    return !complete.ok ? complete : cleanup;
  }

  recover(event) {
    return this.invoke(event, "onRecover");
  }

  attachPlayerLifecycle() {
    world.afterEvents.playerSpawn.subscribe((event) => {
      if (!event.initialSpawn || !this.getActiveEvent) return;
      const activeEvent = this.getActiveEvent();
      if (activeEvent) this.invoke(activeEvent, "onPlayerJoin", event.player);
    });
  }

  setActiveEventProvider(provider) {
    this.getActiveEvent = provider;
  }

  invoke(event, method, ...args) {
    const handler = this.registry.get(event.type);
    if (!handler) return { ok: false, error: `No event handler for '${event.type}'.` };
    if (typeof handler[method] !== "function") return { ok: true, value: undefined };

    try {
      return { ok: true, value: handler[method](event, ...args) };
    } catch (error) {
      logger.error(`${event.name} ${method} failed: ${error}`);
      return { ok: false, error: String(error) };
    }
  }
}
