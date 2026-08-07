import { logger } from "../core/logger.js";

/**
 * A presentation-only lifecycle handler for development worlds.
 * Configure an event with type "diagnostic" to exercise Stage 2 without
 * placing blocks, spawning entities, moving players, or granting rewards.
 */
export const diagnosticEvent = {
  onWarning(event) {
    logger.info(`Diagnostic event '${event.name}' warning lifecycle reached.`);
  },
  onCountdown(event, secondsRemaining) {
    logger.info(`Diagnostic event '${event.name}' countdown: ${secondsRemaining}.`);
  },
  onStart(event) {
    logger.info(`Diagnostic event '${event.name}' started.`);
  },
  onTick() {},
  onPlayerJoin(event, player) {
    logger.info(`Player '${player.name}' joined during diagnostic event '${event.name}'.`);
  },
  onComplete(event) {
    logger.info(`Diagnostic event '${event.name}' completed.`);
  },
  onCleanup(event) {
    logger.info(`Diagnostic event '${event.name}' cleanup completed (no world changes were made).`);
  },
  onRecover(event) {
    logger.info(`Diagnostic event '${event.name}' recovered after reload.`);
  }
};
