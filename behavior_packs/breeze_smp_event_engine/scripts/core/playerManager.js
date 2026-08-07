import { world } from "@minecraft/server";

export class PlayerManager {
  getOnlinePlayers() {
    return world.getPlayers();
  }

  getPlayersWithin(location, radius) {
    return world.getPlayers({ location: { x: location.x, y: location.y, z: location.z }, maxDistance: radius });
  }
}
