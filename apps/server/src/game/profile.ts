import {
  BASE_STATS,
  ITEMS,
  REFORGES,
  SKILLS,
  accessoryBagSlots,
  bestiaryTier,
  currentMayor,
  magicalPowerIntelligence,
  addStats,
  enchantStatBonuses,
  hotbarStack,
  gardenFarmingFortune,
  hotmGemstoneFortune,
  hotmMiningFortune,
  hotmMiningSpeed,
  drillModuleStats,
  levelFromXp,
  effectiveRarity,
  potatoStatBonus,
  petAbilityStats,
  type EquipmentSlot,
  type ItemStack,
  type PlayerState,
  type StatBlock,
} from '@aether/shared';

export function emptyEquipment(): Record<EquipmentSlot, ItemStack | null> {
  return { helmet: null, chestplate: null, leggings: null, boots: null };
}

export function stackStats(stack: ItemStack | null | undefined): Partial<StatBlock> {
  if (!stack) return {};
  const def = ITEMS[stack.itemId];
  if (!def) return {};
  const stats: Partial<StatBlock> = { ...def.stats, ...stack.statBoosts };
  if (def.type === 'DRILL') {
    const modules = drillModuleStats(stack);
    for (const [key, amount] of Object.entries(modules) as Array<[keyof StatBlock, number]>) {
      stats[key] = (stats[key] ?? 0) + amount;
    }
    if ((stack.drill?.fuel ?? 0) <= 0) {
      stats.miningSpeed = 0;
      stats.miningFortune = 0;
    }
  }
  if (stack.reforge) {
    const reforgeName = stack.reforge;
    const reforge = REFORGES.find((entry) => entry.name === reforgeName || entry.id === reforgeName.toLowerCase());
    const rarity = effectiveRarity(def, stack);
    const reforgeStats = reforge?.statsByRarity[rarity] ?? reforge?.statsByRarity[def.rarity ?? 'COMMON'];
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
  const potato = potatoStatBonus(stack);
  for (const [key, amount] of Object.entries(potato) as Array<[keyof StatBlock, number]>) {
    stats[key] = (stats[key] ?? 0) + amount;
  }
  const stars = stack.dungeonStars ?? 0;
  if (stars > 0) {
    const mult = 1 + 0.1 * stars;
    for (const key of Object.keys(stats) as Array<keyof StatBlock>) {
      const value = stats[key];
      if (typeof value === 'number') stats[key] = Math.round(value * mult * 10) / 10;
    }
  }
  return stats;
}

export function recomputeStats(player: Pick<PlayerState, 'skills' | 'equipment' | 'accessories' | 'pets' | 'fairySouls'> & {
  hotm?: { perks: Record<string, number> };
  bestiary?: { kills: Record<string, number> };
  inventory?: PlayerState['inventory'];
  hotbarSlot?: number;
  garden?: PlayerState['garden'];
  extraAccessorySlots?: number;
  islandId?: string;
  activeEffects?: PlayerState['activeEffects'];
}): StatBlock {
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
  const heldStats = player.inventory
    ? stackStats(hotbarStack(player.inventory, player.hotbarSlot ?? 0))
    : {};
  const activePet = player.pets.find((pet) => pet.active);
  const petDef = activePet ? ITEMS[activePet.itemId] : undefined;
  const levelScale = activePet ? Math.max(0.01, activePet.level / 100) : 0;
  const petStats: Partial<StatBlock> = {};
  if (petDef?.stats) {
    for (const [key, amount] of Object.entries(petDef.stats) as Array<[keyof StatBlock, number]>) {
      petStats[key] = Math.round(amount * levelScale * 10) / 10;
    }
  }
  if (activePet) {
    const ability = petAbilityStats(activePet);
    for (const [key, amount] of Object.entries(ability) as Array<[keyof StatBlock, number]>) {
      petStats[key] = (petStats[key] ?? 0) + amount;
    }
  }
  const soulTier = Math.floor(player.fairySouls / 5);
  const soulStats: Partial<StatBlock> = {
    health: soulTier * 3,
    defense: soulTier * 3,
  };
  const mp = magicalPower(player.accessories);
  const mpStats: Partial<StatBlock> = { intelligence: magicalPowerIntelligence(mp) };
  const cole = currentMayor().id === 'cole';
  const bestiaryMf = Object.values(player.bestiary?.kills ?? {}).reduce((sum, kills) => sum + bestiaryTier(kills), 0) * 0.5;
  const hotmStats: Partial<StatBlock> = {
    miningFortune: hotmMiningFortune(player.hotm?.perks ?? {}, cole)
      + (player.islandId === 'crystal_hollows' ? hotmGemstoneFortune(player.hotm?.perks ?? {}) : 0),
    miningSpeed: hotmMiningSpeed(player.hotm?.perks ?? {}),
    magicFind: bestiaryMf,
    farmingFortune: gardenFarmingFortune(player.garden?.harvested ?? {}),
  };
  const now = Date.now();
  const effectStats = (player.activeEffects ?? [])
    .filter((effect) => effect.expiresAt > now)
    .map((effect) => effect.stats);
  return addStats(BASE_STATS, ...skillStats, ...equipmentStats, ...accessoryStats, heldStats, petStats, soulStats, mpStats, hotmStats, ...effectStats);
}

export function magicalPower(accessories: ItemStack[]): number {
  const values = { COMMON: 3, UNCOMMON: 5, RARE: 8, EPIC: 12, LEGENDARY: 16, MYTHIC: 22, SPECIAL: 3, VERY_SPECIAL: 5, DIVINE: 26 };
  return accessories.reduce((total, stack) => {
    const def = ITEMS[stack.itemId];
    const rarity = def ? effectiveRarity(def, stack) : 'COMMON';
    return total + (values[rarity] ?? values.COMMON);
  }, 0);
}
