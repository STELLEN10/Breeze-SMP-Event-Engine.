import { world } from "@minecraft/server";
import { logger } from "./logger.js";

const AIR = "minecraft:air";
const DEFAULT_GROUND = ["minecraft:grass_block", "minecraft:dirt", "minecraft:coarse_dirt", "minecraft:stone", "minecraft:deepslate", "minecraft:sand", "minecraft:red_sand", "minecraft:gravel"];

/** Resolves only owner-approved, loaded locations; it never searches arbitrary SMP terrain. */
export class LocationManager {
  findApprovedSurface(config) {
    for (const area of config.approvedAreas ?? []) {
      if (!isArea(area)) continue;
      const dimension = world.getDimension(area.dimensionId);
      for (let attempt = 0; attempt < (config.maxLocationAttempts ?? 12); attempt += 1) {
        const candidate = randomPoint(area);
        try {
          const ground = dimension.getTopmostBlock(candidate);
          if (!ground) continue;
          const location = { dimensionId: area.dimensionId, x: ground.location.x, y: ground.location.y + 1, z: ground.location.z };
          if (!(config.allowedGroundBlockTypes ?? DEFAULT_GROUND).includes(ground.typeId)) continue;
          if (this.isProtected(location, config.protectedLocations ?? [], config.protectedRadiusBlocks ?? 256)) continue;
          if (this.hasTwoAirBlocks(dimension, location)) return location;
        } catch (error) {
          logger.warn(`Skipped unavailable event-location candidate: ${error}`);
        }
      }
    }
    return undefined;
  }

  isProtected(location, protectedLocations, defaultRadius) {
    return protectedLocations.some((protectedLocation) => {
      if (protectedLocation.dimensionId !== location.dimensionId) return false;
      const radius = protectedLocation.radius ?? defaultRadius;
      const dx = protectedLocation.x - location.x;
      const dz = protectedLocation.z - location.z;
      return dx * dx + dz * dz <= radius * radius;
    });
  }

  hasTwoAirBlocks(dimension, location) {
    try {
      return dimension.getBlock(location)?.typeId === AIR
        && dimension.getBlock({ x: location.x, y: location.y + 1, z: location.z })?.typeId === AIR;
    } catch {
      return false;
    }
  }
}

function isArea(area) {
  return area && typeof area.dimensionId === "string" && Number.isFinite(area.centerX) && Number.isFinite(area.centerZ) && Number.isFinite(area.radius) && area.radius > 0;
}

function randomPoint(area) {
  const radius = Math.sqrt(Math.random()) * area.radius;
  const angle = Math.random() * Math.PI * 2;
  return { x: Math.floor(area.centerX + Math.cos(angle) * radius), z: Math.floor(area.centerZ + Math.sin(angle) * radius) };
}
