import type { ItemId } from './items.js';

export interface CollectionTier {
  amount: number;
  label: string;
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
      { amount: 50, label: 'Stone Pickaxe recipe' },
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
      { amount: 25000, label: `${name} fortune bonus` },
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
