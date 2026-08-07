import { world } from "@minecraft/server";
import { logger } from "./logger.js";

/** Coordinates event lifecycle callbacks; event handlers own their gameplay-specific logic. */
export class EventManager {
  constructor(registry, announcements) {
    this.registry = registry;
    this.announcements = announcements;
  }

  canSchedule(event) {
    const result = this.invoke(event, "canSchedule");
    if (!result.ok) return result;
    if (typeof result.value === "string") return { ok: false, error: result.value };
    if (result.value === false) return { ok: false, error: "Event handler rejected the schedule." };
    return { ok: true };
  }

  onWarning(event) {
    const result = this.invoke(event, "onWarning");
    if (result.ok) this.announcements.announceWarning(event, event.warningSeconds);
    return result;
  }

  onCountdown(event, secondsRemaining) {
    this.announcements.announceCountdown(event, secondsRemaining);
    return this.invoke(event, "onCountdown", secondsRemaining);
  }

  onStart(event) {
    const result = this.invoke(event, "onStart");
    if (result.ok) {
      this.announcements.announceGo(event);
      if (result.value?.location) this.announcements.announceLocation(event, result.value.location);
    }
    return result;
  }

  onTick(event, nowEpochMs) {
    return this.invoke(event, "onTick", nowEpochMs);
  }

  onComplete(event) {
    const complete = this.invoke(event, "onComplete");
    const cleanup = this.invoke(event, "onCleanup");
    return !complete.ok ? complete : cleanup;
  }

  announceCompletion(event) {
    this.announcements.announceCompletion(event);
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

  setCheckpointProvider(provider) {
    this.checkpoint = provider;
  }

  setServices(services) {
    this.services = services;
  }

  invoke(event, method, ...args) {
    const handler = this.registry.get(event.type);
    if (!handler) return { ok: false, error: `No event handler for '${event.type}'.` };
    if (typeof handler[method] !== "function") return { ok: true, value: undefined };

    try {
      return { ok: true, value: handler[method](event, ...args, { checkpoint: () => this.checkpoint?.() === true, services: this.services }) };
    } catch (error) {
      logger.error(`${event.name} ${method} failed: ${error}`);
      return { ok: false, error: String(error) };
    }
  }
}
