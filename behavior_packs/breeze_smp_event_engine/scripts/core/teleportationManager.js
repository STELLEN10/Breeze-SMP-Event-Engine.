import { world } from "@minecraft/server";

const RETURN_KEY = "breeze_smp:return_location";

/** Stores a player's own return location before any event teleport. */
export class TeleportationManager {
  saveReturnLocation(player) {
    player.setDynamicProperty(RETURN_KEY, JSON.stringify({ dimensionId: player.dimension.id, location: player.location }));
  }

  teleportTo(player, destination) {
    this.saveReturnLocation(player);
    player.teleport(destination.location, { dimension: world.getDimension(destination.dimensionId), checkForBlocks: true, keepVelocity: false });
  }

  returnPlayer(player) {
    const raw = player.getDynamicProperty(RETURN_KEY);
    if (typeof raw !== "string") return false;
    const destination = JSON.parse(raw);
    player.teleport(destination.location, { dimension: world.getDimension(destination.dimensionId), checkForBlocks: true, keepVelocity: false });
    player.setDynamicProperty(RETURN_KEY, undefined);
    return true;
  }
}
