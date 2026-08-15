import {
  BASE_STATS,
  ITEMS,
  REFORGES,
  SKILLS,
  accessoryBagSlots,
  magicalPowerIntelligence,
  addStats,
  enchantStatBonuses,
  levelFromXp,
  type EquipmentSlot,
  type ItemStack,
  type PlayerState,
  type StatBlock,
} from '@aether/shared';

export function emptyEquipment(): Record<EquipmentSlot, ItemStack | null> {
  return { helmet: null, chestplate: null, leggings: null, boots: null, weapon: null };
}

function stackStats(stack: ItemStack | null | undefined): Partial<StatBlock> {
  if (!stack) return {};
  const def = ITEMS[stack.itemId];
  if (!def) return {};
  const stats: Partial<StatBlock> = { ...def.stats, ...stack.statBoosts };
  if (stack.reforge) {
    const reforgeName = stack.reforge;
    const reforge = REFORGES.find((entry) => entry.name === reforgeName || entry.id === reforgeName.toLowerCase());
    const rarity = def.rarity ?? 'COMMON';
    const reforgeStats = reforge?.statsByRarity[rarity];
    if (reforgeStats) {
      for (const [key, amount] of Object.entries(reforgeStats) as Array<[keyof StatBlock, number]>) {
        stats[key] = (stats[key] ?? 0) + amount;
      }
    }
  }
  const enchantments = stack.enchantments ?? {};
  const enchantStats = enchantStatBonuses(enchantments);
  for (const [key, amount] of Object.entries(enchantStats) as Array<[keyof StatBlock, number]>) {
    stats[key] = (stats[key] ?? 0) + amount;
  }
  return stats;
}

export function recomputeStats(player: Pick<PlayerState, 'skills' | 'equipment' | 'accessories' | 'pets' | 'fairySouls'>): StatBlock {
  const skillStats: Partial<StatBlock>[] = [];
  for (const skill of Object.values(SKILLS)) {
    const level = levelFromXp(player.skills[skill.id] ?? 0, skill.maxLevel).level;
    const reward: Partial<StatBlock> = {};
    for (const [key, amount] of Object.entries(skill.rewardPerLevel) as Array<[keyof StatBlock, number]>) {
      reward[key] = amount * level;
    }
    skillStats.push(reward);
  }
  const equipmentStats = Object.values(player.equipment).map(stackStats);
  const accessoryStats = player.accessories.map(stackStats);
  const activePet = player.pets.find((pet) => pet.active);
  const petDef = activePet ? ITEMS[activePet.itemId] : undefined;
  const levelScale = activePet ? Math.max(0.01, activePet.level / 100) : 0;
  const petStats: Partial<StatBlock> = {};
  if (petDef?.stats) {
    for (const [key, amount] of Object.entries(petDef.stats) as Array<[keyof StatBlock, number]>) {
      petStats[key] = Math.round(amount * levelScale * 10) / 10;
    }
  }
  const soulTier = Math.floor(player.fairySouls / 5);
  const soulStats: Partial<StatBlock> = {
    health: soulTier * 3,
    defense: soulTier * 3,
  };
  const mp = magicalPower(player.accessories);
  const mpStats: Partial<StatBlock> = { intelligence: magicalPowerIntelligence(mp) };
  return addStats(BASE_STATS, ...skillStats, ...equipmentStats, ...accessoryStats, petStats, soulStats, mpStats);
}

export function magicalPower(accessories: ItemStack[]): number {
  const values = { COMMON: 3, UNCOMMON: 5, RARE: 8, EPIC: 12, LEGENDARY: 16, MYTHIC: 22, SPECIAL: 3, VERY_SPECIAL: 5, DIVINE: 26 };
  return accessories.reduce((total, stack) => {
    const rarity = ITEMS[stack.itemId]?.rarity ?? 'COMMON';
    return total + values[rarity];
  }, 0);
}
