import { world } from "@minecraft/server";

const AIR = "minecraft:air";

/** Safe block-plan placement for event structures. `.mcstructure` adapters can be added later. */
export class StructureManager {
  placeTrackedBlocks(event, blocks, checkpoint) {
    for (const block of blocks) {
      const existing = world.getDimension(block.dimensionId).getBlock(block.location);
      if (!existing || existing.typeId !== AIR) throw new Error(`Structure target is not empty at ${block.location.x}, ${block.location.y}, ${block.location.z}.`);
    }
    event.data ??= {};
    event.data.placedStructureBlocks = blocks;
    if (!checkpoint()) throw new Error("Could not persist the event structure plan.");

    const placed = [];
    try {
      for (const block of blocks) {
        world.getDimension(block.dimensionId).setBlockType(block.location, block.typeId);
        placed.push(block);
      }
    } catch (error) {
      this.cleanupTrackedBlocks(placed);
      throw error;
    }
  }

  cleanupTrackedBlocks(blocks) {
    for (const block of blocks) {
      try {
        const dimension = world.getDimension(block.dimensionId);
        // Only remove the exact type this manager recorded; never overwrite a changed block.
        if (dimension.getBlock(block.location)?.typeId === block.typeId) dimension.setBlockType(block.location, AIR);
      } catch {
        // Cleanup failures are deliberately non-destructive and are logged by the caller's lifecycle.
      }
    }
  }
}
