import { ItemStack, world } from "@minecraft/server";
import { ENGINE_CONFIGURATION } from "../config/events.js";
import { logger } from "../core/logger.js";

const AIR = "minecraft:air";
const UNSAFE_GROUND = new Set(["minecraft:water", "minecraft:flowing_water", "minecraft:lava", "minecraft:flowing_lava"]);

/**
 * First complete event implementation. It only places one barrel in an
 * owner-approved area and never replaces an existing block.
 */
export const supplyDropEvent = {
  canSchedule() {
    const config = ENGINE_CONFIGURATION.supplyDrop;
    if (!config.enabled) return "Supply Drop is disabled in configuration.";
    if (!Array.isArray(config.approvedAreas) || config.approvedAreas.length === 0) {
      return "Supply Drop has no owner-approved areas configured.";
    }
    if (!Array.isArray(config.loot) || config.loot.length === 0) return "Supply Drop has no loot configured.";
    return undefined;
  },

  onWarning(event, context) {
    if (event.data?.supplyDrop?.location) return;
    const location = resolveSafeDropLocation();
    if (!location) throw new Error("No safe, loaded Supply Drop location was found in an approved area.");

    event.data = {
      supplyDrop: {
        location,
        crateBlockType: ENGINE_CONFIGURATION.supplyDrop.crateBlockType,
        placed: false
      }
    };
    if (!context.checkpoint()) throw new Error("Could not persist the chosen Supply Drop location.");
  },

  onStart(event, context) {
    const supplyDrop = event.data?.supplyDrop;
    if (!supplyDrop) throw new Error("Supply Drop location was not prepared before start.");
    const dimension = world.getDimension(supplyDrop.location.dimensionId);

    if (!isSafeCrateSpace(dimension, supplyDrop.location)) {
      throw new Error("The prepared Supply Drop location is no longer safe or empty.");
    }
    // Persist the complete placement plan before the first world change.
    if (!context.checkpoint()) throw new Error("Could not persist Supply Drop placement state.");

    try {
      dimension.setBlockType(supplyDrop.location, supplyDrop.crateBlockType);
      const crate = dimension.getBlock(supplyDrop.location);
      const inventory = crate?.getComponent("minecraft:inventory")?.container;
      if (!inventory) throw new Error("Placed Supply Drop crate has no inventory component.");

      for (const loot of ENGINE_CONFIGURATION.supplyDrop.loot) {
        const overflow = inventory.addItem(new ItemStack(loot.typeId, loot.amount));
        if (overflow) throw new Error(`Supply Drop crate has insufficient space for ${loot.typeId}.`);
      }
      supplyDrop.placed = true;
      if (!context.checkpoint()) throw new Error("Could not persist Supply Drop placement completion.");
      logger.info(`Supply Drop crate placed at ${formatCoordinates(supplyDrop.location)}.`);
      return { location: supplyDrop.location };
    } catch (error) {
      // The only block this event ever removes is the crate block it just placed.
      safelyRemoveOwnedCrate(dimension, supplyDrop);
      throw error;
    }
  },

  onTick() {},

  onComplete(event) {
    const location = event.data?.supplyDrop?.location;
    if (location) logger.info(`Supply Drop completed; crate remains at ${formatCoordinates(location)} for players to loot.`);
  },

  onCleanup() {
    // Loot containers are intentionally retained. Automatic cleanup is deferred
    // until a future structure tracker can prove ownership after player edits.
  },

  onRecover(event) {
    const supplyDrop = event.data?.supplyDrop;
    if (!supplyDrop?.location) throw new Error("Active Supply Drop has no persisted location.");
    const crate = world.getDimension(supplyDrop.location.dimensionId).getBlock(supplyDrop.location);
    if (supplyDrop.placed && crate?.typeId !== supplyDrop.crateBlockType) {
      logger.warn("Recovered Supply Drop crate is missing or was changed; no replacement will be made automatically.");
    }
  }
};

function resolveSafeDropLocation() {
  const config = ENGINE_CONFIGURATION.supplyDrop;
  for (const area of config.approvedAreas) {
    if (!isApprovedArea(area)) continue;
    const dimension = world.getDimension(area.dimensionId);
    for (let attempt = 0; attempt < config.maxLocationAttempts; attempt += 1) {
      const xz = randomPointInArea(area);
      let ground;
      try {
        ground = dimension.getTopmostBlock(xz);
      } catch (error) {
        logger.warn(`Could not inspect a Supply Drop candidate: ${error}`);
        continue;
      }
      if (!ground) continue;
      const location = { dimensionId: area.dimensionId, x: ground.location.x, y: ground.location.y + 1, z: ground.location.z };
      if (UNSAFE_GROUND.has(ground.typeId) || !config.allowedGroundBlockTypes.includes(ground.typeId) || isProtected(location, config) || !isSafeCrateSpace(dimension, location)) continue;
      return location;
    }
  }
  return undefined;
}

function isApprovedArea(area) {
  return area && typeof area.dimensionId === "string" && Number.isFinite(area.centerX) && Number.isFinite(area.centerZ) && Number.isFinite(area.radius) && area.radius > 0;
}

function randomPointInArea(area) {
  const radius = Math.sqrt(Math.random()) * area.radius;
  const angle = Math.random() * Math.PI * 2;
  return {
    x: Math.floor(area.centerX + Math.cos(angle) * radius),
    z: Math.floor(area.centerZ + Math.sin(angle) * radius)
  };
}

function isProtected(location, config) {
  return config.protectedLocations.some((protectedLocation) => {
    if (protectedLocation.dimensionId !== location.dimensionId) return false;
    const radius = protectedLocation.radius ?? config.protectedRadiusBlocks;
    const dx = protectedLocation.x - location.x;
    const dz = protectedLocation.z - location.z;
    return dx * dx + dz * dz <= radius * radius;
  });
}

function isSafeCrateSpace(dimension, location) {
  try {
    const crateSpace = dimension.getBlock(location);
    const headSpace = dimension.getBlock({ x: location.x, y: location.y + 1, z: location.z });
    return crateSpace?.typeId === AIR && headSpace?.typeId === AIR;
  } catch (error) {
    logger.warn(`Could not validate Supply Drop crate space: ${error}`);
    return false;
  }
}

function safelyRemoveOwnedCrate(dimension, supplyDrop) {
  try {
    const crate = dimension.getBlock(supplyDrop.location);
    if (crate?.typeId === supplyDrop.crateBlockType) dimension.setBlockType(supplyDrop.location, AIR);
  } catch (error) {
    logger.error(`Could not roll back failed Supply Drop crate placement: ${error}`);
  }
}

function formatCoordinates(location) {
  return `${location.x}, ${location.y}, ${location.z}`;
}
