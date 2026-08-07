import { world } from "@minecraft/server";
import { ENGINE_CONFIGURATION } from "../config/events.js";
import { logger } from "./logger.js";

const TICKS_PER_SECOND = 20;

/** Sends presentation-only event messaging. It never executes commands or changes gameplay state. */
export class AnnouncementManager {
  announceWarning(event, secondsUntilStart) {
    this.broadcast({
      chatLines: ["§6⚠ BREEZE SMP EVENT", `§e${event.name.toUpperCase()}`, `§fStarting in ${formatDuration(secondsUntilStart)}.`, "§7Prepare yourselves."],
      title: "§6BREEZE SMP EVENT",
      subtitle: `§e${event.name}\n§fStarting in ${formatDuration(secondsUntilStart)}`,
      actionBar: `§e${event.name} §7starts soon`,
      soundId: ENGINE_CONFIGURATION.announcements.soundId,
      staySeconds: 5
    });
  }

  announceCountdown(event, secondsRemaining) {
    this.broadcast({
      title: `§e${secondsRemaining}`,
      subtitle: `§f${event.name} starts now`,
      actionBar: `§e${event.name}: ${secondsRemaining}`,
      soundId: ENGINE_CONFIGURATION.announcements.countdownSoundId,
      staySeconds: 1,
      chatLines: []
    });
  }

  announceGo(event) {
    this.broadcast({
      chatLines: ["§aGO!", `§e${event.name} §fis now active.`],
      title: "§aGO!",
      subtitle: `§e${event.name}`,
      actionBar: `§a${event.name} is active`,
      soundId: ENGINE_CONFIGURATION.announcements.soundId,
      staySeconds: 3,
      particle: true
    });
  }

  announceCompletion(event) {
    this.broadcast({
      chatLines: ["§6BREEZE SMP EVENT", `§e${event.name} §fhas ended.`],
      title: "§6EVENT COMPLETE",
      subtitle: `§e${event.name}`,
      actionBar: "§7Thanks for participating.",
      soundId: ENGINE_CONFIGURATION.announcements.soundId,
      staySeconds: 3
    });
  }

  broadcast(message) {
    if (!ENGINE_CONFIGURATION.announcements.enabled) return;

    try {
      if (message.chatLines.length > 0) world.sendMessage(message.chatLines.join("\n"));
    } catch (error) {
      logger.error(`Could not send event chat announcement: ${error}`);
    }

    for (const player of world.getPlayers()) {
      try {
        player.onScreenDisplay.setTitle(message.title, {
          subtitle: message.subtitle,
          fadeInDuration: 2,
          stayDuration: Math.max(1, message.staySeconds * TICKS_PER_SECOND - 4),
          fadeOutDuration: 2
        });
        player.onScreenDisplay.setActionBar(message.actionBar);
        if (message.soundId) player.playSound(message.soundId);
        if (message.particle && ENGINE_CONFIGURATION.announcements.particlesEnabled) {
          const location = player.location;
          player.dimension.spawnParticle(ENGINE_CONFIGURATION.announcements.particleId, {
            x: location.x,
            y: location.y + 1,
            z: location.z
          });
        }
      } catch (error) {
        // One disconnected/invalid player must not prevent other players from receiving an announcement.
        logger.warn(`Could not present event announcement to a player: ${error}`);
      }
    }
  }
}

function formatDuration(totalSeconds) {
  if (totalSeconds < 60) return `${totalSeconds} seconds`;
  const minutes = Math.ceil(totalSeconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}
