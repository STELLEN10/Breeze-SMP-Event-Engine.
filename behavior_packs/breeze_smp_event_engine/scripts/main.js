import { system } from "@minecraft/server";
import { AnnouncementManager } from "./core/announcementManager.js";
import { EventManager } from "./core/eventManager.js";
import { EventScheduler } from "./core/eventScheduler.js";
import { eventRegistry } from "./core/eventRegistry.js";
import { diagnosticEvent } from "./events/diagnosticEvent.js";
import { supplyDropEvent } from "./events/supplyDropEvent.js";
import { logger } from "./core/logger.js";
import { PersistenceManager } from "./core/persistenceManager.js";

// Deferring one tick avoids calling world APIs from early-execution mode.
system.run(() => {
  try {
    if (!eventRegistry.has("diagnostic")) eventRegistry.register("diagnostic", diagnosticEvent);
    if (!eventRegistry.has("supply_drop")) eventRegistry.register("supply_drop", supplyDropEvent);
    const announcements = new AnnouncementManager();
    const eventManager = new EventManager(eventRegistry, announcements);
    const scheduler = new EventScheduler(new PersistenceManager(), eventRegistry, eventManager);
    scheduler.start();
  } catch (error) {
    logger.error(`Event engine failed safely during startup: ${error}`);
  }
});
