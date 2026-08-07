import { system } from "@minecraft/server";
import { EventScheduler } from "./core/eventScheduler.js";
import { eventRegistry } from "./core/eventRegistry.js";
import { logger } from "./core/logger.js";
import { PersistenceManager } from "./core/persistenceManager.js";

// Deferring one tick avoids calling world APIs from early-execution mode.
system.run(() => {
  try {
    const scheduler = new EventScheduler(new PersistenceManager(), eventRegistry);
    scheduler.start();
  } catch (error) {
    logger.error(`Event engine failed safely during startup: ${error}`);
  }
});
