import { ItemStack } from "@minecraft/server";

/** Applies only configured rewards; callers may award after a verified winner is known. */
export class RewardManager {
  grant(player, reward = {}) {
    const inventory = player.getComponent("minecraft:inventory")?.container;
    for (const item of reward.items ?? []) {
      if (!inventory) throw new Error("Player has no inventory for configured reward.");
      const overflow = inventory.addItem(new ItemStack(item.typeId, item.amount));
      if (overflow) throw new Error(`Reward inventory overflow for ${item.typeId}.`);
    }
    if (Number.isFinite(reward.experience) && reward.experience !== 0) player.addExperience(reward.experience);
    if (reward.title) player.onScreenDisplay.setTitle(reward.title, { stayDuration: 60, fadeInDuration: 2, fadeOutDuration: 4 });
  }
}
