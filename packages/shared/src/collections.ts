import type { ItemId } from './items.js';
import { ITEMS } from './items.js';
import { ZONES } from './locations.js';
import { MOBS, slayerLevelFromXp } from './content.js';
import { levelFromXp, type SkillId } from './skills.js';

export interface CollectionTier {
  amount: number;
  label: string;
  unlockRecipeIds?: string[];
  coins?: number;
  statBonus?: Partial<import('./stats.js').StatBlock>;
}

export type CollectionCategory = 'farming' | 'mining' | 'combat' | 'foraging' | 'fishing';

export const COLLECTION_CATEGORIES: Array<{ id: CollectionCategory; name: string; icon: string }> = [
  { id: 'farming', name: 'Farming', icon: 'crop_wheat' },
  { id: 'mining', name: 'Mining', icon: 'ore_diamond' },
  { id: 'combat', name: 'Combat', icon: 'mob_zombie' },
  { id: 'foraging', name: 'Foraging', icon: 'tree_oak' },
  { id: 'fishing', name: 'Fishing', icon: 'fishing_spot' },
];

export interface CollectionDef {
  itemId: ItemId;
  name: string;
  category: CollectionCategory;
  tiers: CollectionTier[];
}

export const COLLECTIONS: CollectionDef[] = [
  {
    itemId: 'cobble',
    name: 'Cobble',
    category: 'mining',
    tiers: [
      { amount: 50, label: 'Stone Pickaxe recipe', unlockRecipeIds: ['stone_pickaxe'] },
      { amount: 100, label: 'Cobble Minion recipe' },
    ],
  },
  {
    itemId: 'coal',
    name: 'Coal',
    category: 'mining',
    tiers: [{ amount: 100, label: 'Coal Minion recipe' }],
  },
  {
    itemId: 'iron_ore',
    name: 'Iron Ore',
    category: 'mining',
    tiers: [
      { amount: 25, label: 'Iron Ingot recipe' },
      { amount: 100, label: 'Iron Pickaxe recipe' },
    ],
  },
  {
    itemId: 'wheat',
    name: 'Wheat',
    category: 'farming',
    tiers: [
      { amount: 25, label: 'Stone Hoe recipe' },
      { amount: 50, label: 'Bread recipe' },
      { amount: 100, label: 'Wheat Minion recipe' },
    ],
  },
  {
    itemId: 'oak_log',
    name: 'Oak Log',
    category: 'foraging',
    tiers: [
      { amount: 50, label: 'Stone Axe recipe' },
      { amount: 100, label: 'Oak Minion recipe' },
    ],
  },
  {
    itemId: 'string',
    name: 'String',
    category: 'combat',
    tiers: [{ amount: 15, label: 'Fishing Rod recipe' }],
  },
  {
    itemId: 'rotten_flesh',
    name: 'Rotten Flesh',
    category: 'combat',
    tiers: [{ amount: 25, label: 'Stone Sword recipe' }],
  },
  {
    itemId: 'raw_fish',
    name: 'Raw Fish',
    category: 'fishing',
    tiers: [{ amount: 10, label: 'Cooked Fish recipe' }],
  },
];

const EXTRA_COLLECTIONS: Array<[ItemId, string, CollectionCategory]> = [
  ['diamond', 'Diamond', 'mining'], ['emerald', 'Emerald', 'mining'], ['redstone', 'Redstone', 'mining'],
  ['lapis', 'Lapis Lazuli', 'mining'], ['gold_ingot', 'Gold Ingot', 'mining'], ['mithril', 'Mithril', 'mining'],
  ['gemstone_ruby', 'Ruby Gemstone', 'mining'], ['gemstone_jade', 'Jade Gemstone', 'mining'],
  ['potato', 'Potato', 'farming'], ['carrot', 'Carrot', 'farming'], ['pumpkin', 'Pumpkin', 'farming'],
  ['melon', 'Melon', 'farming'], ['sugar_cane', 'Sugar Cane', 'farming'], ['cactus', 'Cactus', 'farming'],
  ['cocoa_beans', 'Cocoa Beans', 'farming'], ['mushroom', 'Mushroom', 'farming'],
  ['spider_eye', 'Spider Eye', 'combat'], ['bone', 'Bone', 'combat'], ['ender_pearl', 'Ender Pearl', 'combat'],
  ['blaze_rod', 'Blaze Rod', 'combat'],
  ['jungle_log', 'Jungle Log', 'foraging'], ['dark_oak_log', 'Dark Oak Log', 'foraging'],
];

for (const [itemId, name, category] of EXTRA_COLLECTIONS) {
  COLLECTIONS.push({
    itemId,
    name,
    category,
    tiers: [
      { amount: 50, label: `${name} Minion recipe` },
      { amount: 100, label: `Enchanted ${name} recipe` },
      { amount: 500, label: `${name} storage recipe` },
      { amount: 1000, label: `${name} gear recipe` },
      { amount: 2500, label: `Greater ${name} upgrade` },
      { amount: 5000, label: `${name} mastery reward` },
      { amount: 10000, label: `Perfect ${name} recipe` },
      { amount: 25000, label: `${name} fortune bonus`, statBonus: { miningFortune: category === 'mining' ? 1 : 0, farmingFortune: category === 'farming' ? 1 : 0, foragingFortune: category === 'foraging' ? 1 : 0, strength: category === 'combat' ? 1 : 0 } },
      { amount: 50000, label: `Maximum ${name} collection` },
    ],
  });
}

export type CollectionsState = Partial<Record<ItemId, number>>;

export function collectionsInCategory(category: CollectionCategory): CollectionDef[] {
  return COLLECTIONS.filter((collection) => collection.category === category)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Highest tier reached, and the next tier still to unlock. */
export function collectionProgress(collection: CollectionDef, amount: number) {
  let tier = 0;
  for (const entry of collection.tiers) {
    if (amount >= entry.amount) tier++;
  }
  return { tier, maxTier: collection.tiers.length, next: collection.tiers[tier] ?? null };
}

export function emptyCollections(): CollectionsState {
  return {};
}

export function isRecipeUnlocked(
  unlockCollection: ItemId | undefined,
  unlockAmount: number | undefined,
  collections: CollectionsState,
): boolean {
  if (!unlockCollection) return true;
  const have = collections[unlockCollection] ?? 0;
  return have >= (unlockAmount ?? 0);
}

export function recipeUnlockedFor(
  recipe: {
    id?: string;
    unlockCollection?: ItemId;
    unlockAmount?: number;
    unlockSlayer?: string;
    unlockSlayerLevel?: number;
    unlockSkill?: { skill: SkillId; level: number };
  },
  player: {
    collections: CollectionsState;
    slayerXp?: Record<string, number>;
    unlockedRecipes?: string[];
    skills?: Partial<Record<SkillId, number>>;
  },
): boolean {
  if (recipe.id && player.unlockedRecipes?.includes(recipe.id)) return true;
  if (recipe.unlockSlayer) {
    const level = slayerLevelFromXp(player.slayerXp?.[recipe.unlockSlayer] ?? 0).level;
    if (level < (recipe.unlockSlayerLevel ?? 1)) return false;
  }
  if (recipe.unlockSkill && player.skills) {
    const level = levelFromXp(player.skills[recipe.unlockSkill.skill] ?? 0).level;
    if (level < recipe.unlockSkill.level) return false;
  }
  return isRecipeUnlocked(recipe.unlockCollection, recipe.unlockAmount, player.collections);
}

function uniqueNames(names: string[], limit = 3): string[] {
  return [...new Set(names)].slice(0, limit);
}

/** Where to gather a collection item so locked recipes can explain how to unlock. */
export function obtainHintForItem(itemId: ItemId): string {
  const collection = COLLECTIONS.find((entry) => entry.itemId === itemId);
  const name = ITEMS[itemId]?.name ?? collection?.name ?? itemId;
  const verb = collection?.category === 'farming' ? 'Harvest'
    : collection?.category === 'mining' ? 'Mine'
    : collection?.category === 'foraging' ? 'Chop'
    : collection?.category === 'fishing' ? 'Fish up'
    : collection?.category === 'combat' ? 'Collect'
    : 'Collect';

  const zones = uniqueNames(
    Object.values(ZONES)
      .filter((zone) => zone.actions.some((action) => action.target === itemId))
      .map((zone) => zone.name),
  );
  const mobs = uniqueNames(
    Object.values(MOBS)
      .filter((mob) => mob.drops.some((drop) => drop.itemId === itemId))
      .map((mob) => mob.name),
  );

  if (collection?.category === 'combat' && mobs.length) {
    const where = zones.length ? ` in ${zones.join(', ')}` : '';
    return `Kill ${mobs.join(', ')}${where} for ${name}.`;
  }
  if (zones.length) return `${verb} ${name} at ${zones.join(', ')}.`;
  if (mobs.length) return `Dropped by ${mobs.join(', ')}.`;
  return `${verb} ${name} in the world.`;
}
