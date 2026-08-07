import { world } from "@minecraft/server";
import { logger } from "./logger.js";

const STATE_KEY = "breeze_smp:event_engine_state";
const STATE_VERSION = 3;

export class PersistenceManager {
  load() {
    try {
      const raw = world.getDynamicProperty(STATE_KEY);
      if (typeof raw !== "string" || raw.length === 0) {
        return this.createInitialState();
      }

      const state = this.upgrade(JSON.parse(raw));
      if (!state || !Array.isArray(state.completedEventIds) || !Array.isArray(state.completedEvents) || !Array.isArray(state.skippedEventIds) || !Array.isArray(state.failedEvents)) {
        logger.warn("Stored event state is incompatible; preserving the world and starting a new engine state.");
        return this.createInitialState();
      }
      return state;
    } catch (error) {
      logger.error(`Could not read scheduler state: ${error}`);
      return this.createInitialState();
    }
  }

  upgrade(state) {
    if (state?.version === 1 || state?.version === 2) {
      state.version = STATE_VERSION;
      state.pendingEvent = undefined;
      state.failedEvents ??= [];
      state.completedEvents ??= [];
    }
    return state;
  }

  save(state) {
    try {
      world.setDynamicProperty(STATE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      logger.error(`Could not persist scheduler state: ${error}`);
      return false;
    }
  }

  createInitialState() {
    return {
      version: STATE_VERSION,
      pendingEvent: undefined,
      activeEvent: undefined,
      completedEventIds: [],
      completedEvents: [],
      skippedEventIds: [],
      failedEvents: [],
      updatedAtEpochMs: 0
    };
  }
}
