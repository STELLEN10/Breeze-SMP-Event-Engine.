import { ENGINE_CONFIGURATION } from "../config/events.js";
import { logger } from "../core/logger.js";

export const EVENT_CATALOG = Object.freeze({
  treasure_hunt: "Treasure Hunt",
  king_of_the_hill: "King of the Hill",
  bounty_hunt: "Bounty Hunt",
  pvp_tournament: "PvP Tournament",
  mob_invasion: "Mob Invasion",
  capture_the_flag: "Capture the Flag",
  the_crown: "The Crown",
  blood_moon: "Blood Moon",
  final_battle: "Final Battle"
});

/**
 * A safe registration boundary for rule-dependent events. These entries remain
 * disabled until their owner-approved locations, objectives, rewards, and
 * cleanup rules are configured; they do not alter the world while disabled.
 */
export function createConfigurationGatedEvent(type) {
  return {
    canSchedule() {
      const settings = ENGINE_CONFIGURATION.eventSettings[type];
      if (!settings?.enabled) return `${EVENT_CATALOG[type]} is disabled until its rules and safe locations are configured.`;
      return "This event needs a dedicated implementation before it can be enabled.";
    },
    onRecover(event) {
      logger.warn(`${event.name} is configuration-gated and cannot recover without a dedicated implementation.`);
    }
  };
}
