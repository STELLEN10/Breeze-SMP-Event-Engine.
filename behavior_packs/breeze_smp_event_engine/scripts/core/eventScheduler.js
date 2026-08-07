import { system } from "@minecraft/server";
import { ENGINE_CONFIGURATION, getConfiguredSchedule } from "../config/events.js";
import { logger } from "./logger.js";

const MS_PER_SECOND = 1000;

export class EventScheduler {
  constructor(persistence, registry) {
    this.persistence = persistence;
    this.registry = registry;
    this.state = undefined;
    this.intervalId = undefined;
  }

  start() {
    this.validateConfiguration();
    this.state = this.persistence.load();
    this.recoverActiveEvent();
    this.intervalId = system.runInterval(() => this.tick(), ENGINE_CONFIGURATION.timings.schedulerIntervalTicks);
    logger.info(`Scheduler started in ${ENGINE_CONFIGURATION.testMode ? "TEST" : "PRODUCTION"} mode.`);
    this.tick();
  }

  tick() {
    const now = Date.now();
    const schedule = getConfiguredSchedule();

    for (const event of schedule) {
      if (this.isResolved(event.id)) continue;

      const startAt = toEpochMs(event, ENGINE_CONFIGURATION.timezone.utcOffsetMinutes);
      const latenessMs = now - startAt;

      if (latenessMs > ENGINE_CONFIGURATION.timings.missedEventGraceSeconds * MS_PER_SECOND) {
        this.markSkipped(event, "missed while engine was offline");
        continue;
      }

      if (latenessMs >= 0) {
        // No handler exists during Stage 1. Skipping is deliberate: a future
        // event must never start late and unexpectedly modify the SMP world.
        if (!this.registry.has(event.type)) {
          this.markSkipped(event, "event type is not implemented yet");
          continue;
        }
        this.activate(event, startAt);
      }
      break;
    }
  }

  recoverActiveEvent() {
    if (!this.state.activeEvent) return;

    const handler = this.registry.get(this.state.activeEvent.type);
    if (!handler || typeof handler.recover !== "function") {
      logger.warn(`Active event '${this.state.activeEvent.id}' has no safe recovery handler; leaving it recorded for manual review.`);
      return;
    }
    handler.recover(this.state.activeEvent);
  }

  activate(event, startAt) {
    const handler = this.registry.get(event.type);
    const activeEvent = {
      id: event.id,
      type: event.type,
      name: event.name,
      status: "active",
      startedAtEpochMs: startAt,
      endsAtEpochMs: startAt + ENGINE_CONFIGURATION.timings.defaultEventDurationSeconds * MS_PER_SECOND
    };
    this.state.activeEvent = activeEvent;
    this.save();

    try {
      handler.onStart(activeEvent);
      logger.info(`Started '${event.name}'.`);
    } catch (error) {
      logger.error(`Failed to start '${event.name}': ${error}`);
      this.state.activeEvent = undefined;
      this.markSkipped(event, "handler start failure");
    }
  }

  markSkipped(event, reason) {
    this.state.skippedEventIds.push(event.id);
    logger.warn(`Skipped '${event.name}' (${reason}).`);
    this.save();
  }

  isResolved(eventId) {
    return this.state.activeEvent?.id === eventId
      || this.state.completedEventIds.includes(eventId)
      || this.state.skippedEventIds.includes(eventId);
  }

  save() {
    this.state.updatedAtEpochMs = Date.now();
    this.persistence.save(this.state);
  }

  validateConfiguration() {
    const seenIds = new Set();
    for (const event of getConfiguredSchedule()) {
      if (!event.id || !event.type || !event.name || !Number.isFinite(toEpochMs(event, ENGINE_CONFIGURATION.timezone.utcOffsetMinutes))) {
        throw new Error(`Invalid event configuration: ${JSON.stringify(event)}`);
      }
      if (seenIds.has(event.id)) throw new Error(`Duplicate event id: ${event.id}`);
      seenIds.add(event.id);
    }
  }
}

function toEpochMs(event, utcOffsetMinutes) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(event.date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(event.time);
  if (!dateMatch || !timeMatch) return Number.NaN;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return Number.NaN;

  const utcEpochMs = Date.UTC(year, month - 1, day, hour, minute);
  const normalized = new Date(utcEpochMs);
  if (normalized.getUTCFullYear() !== year || normalized.getUTCMonth() !== month - 1 || normalized.getUTCDate() !== day) {
    return Number.NaN;
  }
  return utcEpochMs - utcOffsetMinutes * 60 * MS_PER_SECOND;
}
