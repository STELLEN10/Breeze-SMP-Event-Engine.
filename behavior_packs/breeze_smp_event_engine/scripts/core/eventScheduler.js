import { system } from "@minecraft/server";
import { ENGINE_CONFIGURATION, getConfiguredSchedule } from "../config/events.js";
import { logger } from "./logger.js";

const MS_PER_SECOND = 1000;

export class EventScheduler {
  constructor(persistence, registry, eventManager) {
    this.persistence = persistence;
    this.registry = registry;
    this.eventManager = eventManager;
    this.state = undefined;
  }

  start() {
    this.validateConfiguration();
    this.state = this.persistence.load();
    this.eventManager.setActiveEventProvider(() => this.state.activeEvent);
    this.eventManager.setCheckpointProvider(() => this.save());
    this.eventManager.attachPlayerLifecycle();
    this.recoverActiveEvent();
    system.runInterval(() => this.safeTick(), ENGINE_CONFIGURATION.timings.schedulerIntervalTicks);
    logger.info(`Scheduler started in ${ENGINE_CONFIGURATION.testMode ? "TEST" : "PRODUCTION"} mode.`);
    this.safeTick();
  }

  safeTick() {
    try {
      this.tick(Date.now());
    } catch (error) {
      logger.error(`Scheduler tick failed safely: ${error}`);
    }
  }

  tick(now) {
    if (this.state.activeEvent) {
      this.tickActiveEvent(now);
      return;
    }

    if (this.state.pendingEvent) {
      const scheduledEvent = getConfiguredSchedule().find((event) => event.id === this.state.pendingEvent.id);
      if (!scheduledEvent) {
        this.markFailed(this.state.pendingEvent, "configuration", "event was removed from the configured schedule while pending");
        return;
      }
      this.tickScheduledEvent(scheduledEvent, now);
      return;
    }

    for (const event of getConfiguredSchedule()) {
      if (this.isResolved(event.id)) continue;
      this.tickScheduledEvent(event, now);
      break;
    }
  }

  tickScheduledEvent(event, now) {
    const startAt = toEpochMs(event, ENGINE_CONFIGURATION.timezone.utcOffsetMinutes);
    const warningAt = startAt - ENGINE_CONFIGURATION.timings.warningSeconds * MS_PER_SECOND;
    const latenessMs = now - startAt;

    if (now < warningAt) return;
    const readiness = this.eventManager.canSchedule(event);
    if (!readiness.ok) {
      this.markSkipped(event, readiness.error);
      return;
    }
    if (latenessMs > ENGINE_CONFIGURATION.timings.startGraceSeconds * MS_PER_SECOND) {
      this.markSkipped(event, "missed safe start window while the engine was offline");
      return;
    }

    const pending = this.ensurePending(event, startAt);
    if (!pending) return;

    if (!pending.warningAnnounced && now >= warningAt) {
      pending.warningAnnounced = true;
      if (!this.save() || !this.eventManager.onWarning(pending).ok) {
        this.markFailed(event, "warning", "could not persist or deliver warning lifecycle");
        return;
      }
    }

    if (now < startAt) {
      const secondsRemaining = Math.ceil((startAt - now) / MS_PER_SECOND);
      if (secondsRemaining <= ENGINE_CONFIGURATION.timings.countdownSeconds && pending.countdownLastSecond !== secondsRemaining) {
        pending.countdownLastSecond = secondsRemaining;
        if (!this.save() || !this.eventManager.onCountdown(pending, secondsRemaining).ok) {
          this.markFailed(event, "countdown", "could not persist or deliver countdown lifecycle");
        }
      }
      return;
    }

    this.activate(event, pending, now);
  }

  tickActiveEvent(now) {
    const activeEvent = this.state.activeEvent;
    const tickResult = this.eventManager.onTick(activeEvent, now);
    if (!tickResult.ok) {
      this.markFailed(activeEvent, "tick", tickResult.error);
      return;
    }
    if (tickResult.value?.complete === true || now >= activeEvent.endsAtEpochMs) {
      this.complete(activeEvent);
    }
  }

  ensurePending(event, startAt) {
    if (this.state.pendingEvent?.id === event.id) return this.state.pendingEvent;
    this.state.pendingEvent = {
      id: event.id,
      type: event.type,
      name: event.name,
      status: "pending",
      scheduledStartAtEpochMs: startAt,
      warningSeconds: ENGINE_CONFIGURATION.timings.warningSeconds,
      durationSeconds: event.durationSeconds ?? ENGINE_CONFIGURATION.timings.defaultEventDurationSeconds,
      warningAnnounced: false,
      countdownLastSecond: undefined
    };
    return this.save() ? this.state.pendingEvent : undefined;
  }

  activate(event, pending, now) {
    const activeEvent = {
      ...pending,
      status: "active",
      startedAtEpochMs: now,
      endsAtEpochMs: now + pending.durationSeconds * MS_PER_SECOND
    };
    this.state.pendingEvent = undefined;
    this.state.activeEvent = activeEvent;
    if (!this.save()) return;

    const result = this.eventManager.onStart(activeEvent);
    if (!result.ok) this.markFailed(event, "start", result.error);
    else if (!this.save()) this.markFailed(event, "start", "could not persist started event state");
    else logger.info(`Started '${event.name}'.`);
  }

  complete(activeEvent) {
    const result = this.eventManager.onComplete(activeEvent);
    if (!result.ok) {
      this.markFailed(activeEvent, "complete", result.error);
      return;
    }
    this.state.activeEvent = undefined;
    this.state.completedEventIds.push(activeEvent.id);
    this.state.completedEvents.push({
      id: activeEvent.id,
      type: activeEvent.type,
      name: activeEvent.name,
      startedAtEpochMs: activeEvent.startedAtEpochMs,
      endedAtEpochMs: Date.now(),
      location: activeEvent.data?.supplyDrop?.location
    });
    if (this.save()) {
      this.eventManager.announceCompletion(activeEvent);
      logger.info(`Completed '${activeEvent.name}'.`);
    }
  }

  recoverActiveEvent() {
    if (!this.state.activeEvent) return;
    const result = this.eventManager.recover(this.state.activeEvent);
    if (!result.ok) logger.warn(`Active event '${this.state.activeEvent.id}' needs manual review: ${result.error}`);
  }

  markSkipped(event, reason) {
    if (!this.state.skippedEventIds.includes(event.id)) this.state.skippedEventIds.push(event.id);
    if (this.state.pendingEvent?.id === event.id) this.state.pendingEvent = undefined;
    logger.warn(`Skipped '${event.name}' (${reason}).`);
    this.save();
  }

  markFailed(event, phase, error) {
    if (this.state.pendingEvent?.id === event.id) this.state.pendingEvent = undefined;
    if (this.state.activeEvent?.id === event.id) this.state.activeEvent = undefined;
    if (!this.state.failedEvents.some((failure) => failure.id === event.id)) {
      this.state.failedEvents.push({ id: event.id, type: event.type, phase, error: String(error), failedAtEpochMs: Date.now() });
    }
    logger.error(`Failed '${event.name}' during ${phase}: ${error}`);
    this.save();
  }

  isResolved(eventId) {
    return this.state.completedEventIds.includes(eventId)
      || this.state.skippedEventIds.includes(eventId)
      || this.state.failedEvents.some((failure) => failure.id === eventId);
  }

  save() {
    this.state.updatedAtEpochMs = Date.now();
    return this.persistence.save(this.state);
  }

  validateConfiguration() {
    const seenIds = new Set();
    const timings = ENGINE_CONFIGURATION.timings;
    if (timings.warningSeconds < timings.countdownSeconds || timings.countdownSeconds < 1 || timings.startGraceSeconds < 0) {
      throw new Error("Invalid event timing configuration.");
    }
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
  if (normalized.getUTCFullYear() !== year || normalized.getUTCMonth() !== month - 1 || normalized.getUTCDate() !== day) return Number.NaN;
  return utcEpochMs - utcOffsetMinutes * 60 * MS_PER_SECOND;
}
