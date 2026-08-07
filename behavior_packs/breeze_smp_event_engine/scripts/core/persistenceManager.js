import { world } from "@minecraft/server";
import { logger } from "./logger.js";

const STATE_KEY = "breeze_smp:event_engine_state";
const STATE_VERSION = 1;

export class PersistenceManager {
  load() {
    try {
      const raw = world.getDynamicProperty(STATE_KEY);
      if (typeof raw !== "string" || raw.length === 0) {
        return this.createInitialState();
      }

      const state = JSON.parse(raw);
      if (state.version !== STATE_VERSION || !Array.isArray(state.completedEventIds)) {
        logger.warn("Stored event state is incompatible; preserving the world and starting a new engine state.");
        return this.createInitialState();
      }
      return state;
    } catch (error) {
      logger.error(`Could not read scheduler state: ${error}`);
      return this.createInitialState();
    }
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
      activeEvent: undefined,
      completedEventIds: [],
      skippedEventIds: [],
      updatedAtEpochMs: 0
    };
  }
}
