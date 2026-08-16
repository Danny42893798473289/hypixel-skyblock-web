import { ITEMS, type ItemId } from './items.js';
import type { LoreLine } from './lore.js';
import { isRecipeUnlocked, obtainHintForItem, type CollectionsState } from './collections.js';

export interface Recipe {
  id: string;
  name: string;
  result: { itemId: ItemId; qty: number };
  ingredients: { itemId: ItemId; qty: number }[];
  /** Collection unlock key, or null if always available */
  unlockCollection?: ItemId;
  unlockAmount?: number;
}

export const RECIPES: Recipe[] = [
  {
    id: 'oak_plank',
    name: 'Oak Plank',
    result: { itemId: 'oak_plank', qty: 4 },
    ingredients: [{ itemId: 'oak_log', qty: 1 }],
  },
  {
    id: 'stick',
    name: 'Stick',
    result: { itemId: 'stick', qty: 4 },
    ingredients: [{ itemId: 'oak_plank', qty: 2 }],
  },
  {
    id: 'bread',
    name: 'Bread',
    result: { itemId: 'bread', qty: 1 },
    ingredients: [{ itemId: 'wheat', qty: 3 }],
    unlockCollection: 'wheat',
    unlockAmount: 50,
  },
  {
    id: 'cooked_fish',
    name: 'Cooked Fish',
    result: { itemId: 'cooked_fish', qty: 1 },
    ingredients: [{ itemId: 'raw_fish', qty: 1 }, { itemId: 'coal', qty: 1 }],
    unlockCollection: 'raw_fish',
    unlockAmount: 10,
  },
  {
    id: 'iron_ingot',
    name: 'Iron Ingot',
    result: { itemId: 'iron_ingot', qty: 1 },
    ingredients: [{ itemId: 'iron_ore', qty: 1 }, { itemId: 'coal', qty: 1 }],
    unlockCollection: 'iron_ore',
    unlockAmount: 25,
  },
  {
    id: 'stone_pickaxe',
    name: 'Stone Pickaxe',
    result: { itemId: 'stone_pickaxe', qty: 1 },
    ingredients: [
      { itemId: 'cobble', qty: 3 },
      { itemId: 'stick', qty: 2 },
    ],
    unlockCollection: 'cobble',
    unlockAmount: 50,
  },
  {
    id: 'iron_pickaxe',
    name: 'Iron Pickaxe',
    result: { itemId: 'iron_pickaxe', qty: 1 },
    ingredients: [
      { itemId: 'iron_ingot', qty: 3 },
      { itemId: 'stick', qty: 2 },
    ],
    unlockCollection: 'iron_ore',
    unlockAmount: 100,
  },
  {
    id: 'stone_axe',
    name: 'Stone Axe',
    result: { itemId: 'stone_axe', qty: 1 },
    ingredients: [
      { itemId: 'cobble', qty: 3 },
      { itemId: 'stick', qty: 2 },
    ],
    unlockCollection: 'oak_log',
    unlockAmount: 50,
  },
  {
    id: 'stone_hoe',
    name: 'Stone Hoe',
    result: { itemId: 'stone_hoe', qty: 1 },
    ingredients: [
      { itemId: 'cobble', qty: 2 },
      { itemId: 'stick', qty: 2 },
    ],
    unlockCollection: 'wheat',
    unlockAmount: 25,
  },
  {
    id: 'stone_sword',
    name: 'Stone Sword',
    result: { itemId: 'stone_sword', qty: 1 },
    ingredients: [
      { itemId: 'cobble', qty: 2 },
      { itemId: 'stick', qty: 1 },
    ],
    unlockCollection: 'rotten_flesh',
    unlockAmount: 25,
  },
  {
    id: 'fishing_rod',
    name: 'Fishing Rod',
    result: { itemId: 'fishing_rod', qty: 1 },
    ingredients: [
      { itemId: 'stick', qty: 3 },
      { itemId: 'string', qty: 2 },
    ],
    unlockCollection: 'string',
    unlockAmount: 15,
  },
  {
    id: 'minion_cobble',
    name: 'Cobble Minion',
    result: { itemId: 'minion_cobble', qty: 1 },
    ingredients: [
      { itemId: 'cobble', qty: 80 },
      { itemId: 'wooden_pickaxe', qty: 1 },
    ],
    unlockCollection: 'cobble',
    unlockAmount: 100,
  },
  {
    id: 'minion_wheat',
    name: 'Wheat Minion',
    result: { itemId: 'minion_wheat', qty: 1 },
    ingredients: [
      { itemId: 'wheat', qty: 80 },
      { itemId: 'wooden_hoe', qty: 1 },
    ],
    unlockCollection: 'wheat',
    unlockAmount: 100,
  },
  {
    id: 'minion_coal',
    name: 'Coal Minion',
    result: { itemId: 'minion_coal', qty: 1 },
    ingredients: [
      { itemId: 'coal', qty: 80 },
      { itemId: 'stone_pickaxe', qty: 1 },
    ],
    unlockCollection: 'coal',
    unlockAmount: 100,
  },
  {
    id: 'minion_oak',
    name: 'Oak Minion',
    result: { itemId: 'minion_oak', qty: 1 },
    ingredients: [
      { itemId: 'oak_log', qty: 80 },
      { itemId: 'wooden_axe', qty: 1 },
    ],
    unlockCollection: 'oak_log',
    unlockAmount: 100,
  },
];

RECIPES.push(
  { id: 'enchanted_cobble', name: 'Enchanted Cobblestone', result: { itemId: 'enchanted_cobble', qty: 1 }, ingredients: [{ itemId: 'cobble', qty: 160 }], unlockCollection: 'cobble', unlockAmount: 100 },
  { id: 'enchanted_cobble_block', name: 'Enchanted Cobblestone Block', result: { itemId: 'enchanted_cobble_block', qty: 1 }, ingredients: [{ itemId: 'enchanted_cobble', qty: 160 }], unlockCollection: 'cobble', unlockAmount: 1000 },
  { id: 'enchanted_coal', name: 'Enchanted Coal', result: { itemId: 'enchanted_coal', qty: 1 }, ingredients: [{ itemId: 'coal', qty: 160 }], unlockCollection: 'coal', unlockAmount: 100 },
  { id: 'enchanted_coal_block', name: 'Enchanted Coal Block', result: { itemId: 'enchanted_coal_block', qty: 1 }, ingredients: [{ itemId: 'enchanted_coal', qty: 160 }], unlockCollection: 'coal', unlockAmount: 1000 },
  { id: 'enchanted_iron', name: 'Enchanted Iron', result: { itemId: 'enchanted_iron', qty: 1 }, ingredients: [{ itemId: 'iron_ingot', qty: 160 }], unlockCollection: 'iron_ore', unlockAmount: 100 },
  { id: 'enchanted_iron_block', name: 'Enchanted Iron Block', result: { itemId: 'enchanted_iron_block', qty: 1 }, ingredients: [{ itemId: 'enchanted_iron', qty: 160 }], unlockCollection: 'iron_ore', unlockAmount: 1000 },
  { id: 'enchanted_diamond', name: 'Enchanted Diamond', result: { itemId: 'enchanted_diamond', qty: 1 }, ingredients: [{ itemId: 'diamond', qty: 160 }], unlockCollection: 'diamond', unlockAmount: 100 },
  { id: 'enchanted_diamond_block', name: 'Enchanted Diamond Block', result: { itemId: 'enchanted_diamond_block', qty: 1 }, ingredients: [{ itemId: 'enchanted_diamond', qty: 160 }], unlockCollection: 'diamond', unlockAmount: 1000 },
  { id: 'enchanted_wheat', name: 'Enchanted Hay Bale', result: { itemId: 'enchanted_wheat', qty: 1 }, ingredients: [{ itemId: 'wheat', qty: 160 }], unlockCollection: 'wheat', unlockAmount: 100 },
  { id: 'enchanted_oak', name: 'Enchanted Oak Wood', result: { itemId: 'enchanted_oak', qty: 1 }, ingredients: [{ itemId: 'oak_log', qty: 160 }], unlockCollection: 'oak_log', unlockAmount: 100 },
  { id: 'enchanted_string', name: 'Enchanted String', result: { itemId: 'enchanted_string', qty: 1 }, ingredients: [{ itemId: 'string', qty: 160 }], unlockCollection: 'string', unlockAmount: 100 },
  { id: 'enchanted_rotten_flesh', name: 'Enchanted Rotten Flesh', result: { itemId: 'enchanted_rotten_flesh', qty: 1 }, ingredients: [{ itemId: 'rotten_flesh', qty: 160 }], unlockCollection: 'rotten_flesh', unlockAmount: 100 },
  { id: 'diamond_pickaxe', name: 'Diamond Pickaxe', result: { itemId: 'diamond_pickaxe', qty: 1 }, ingredients: [{ itemId: 'diamond', qty: 3 }, { itemId: 'stick', qty: 2 }], unlockCollection: 'diamond', unlockAmount: 100 },
  { id: 'jungle_axe', name: 'Jungle Axe', result: { itemId: 'jungle_axe', qty: 1 }, ingredients: [{ itemId: 'jungle_log', qty: 64 }, { itemId: 'stick', qty: 2 }], unlockCollection: 'jungle_log', unlockAmount: 500 },
  { id: 'speed_talisman', name: 'Speed Talisman', result: { itemId: 'speed_talisman', qty: 1 }, ingredients: [{ itemId: 'sugar_cane', qty: 108 }], unlockCollection: 'sugar_cane', unlockAmount: 100 },
  { id: 'enchanted_redstone', name: 'Enchanted Redstone', result: { itemId: 'enchanted_redstone', qty: 1 }, ingredients: [{ itemId: 'redstone', qty: 160 }], unlockCollection: 'redstone', unlockAmount: 100 },
  { id: 'compactor', name: 'Compactor', result: { itemId: 'compactor', qty: 1 }, ingredients: [{ itemId: 'enchanted_cobble', qty: 7 }, { itemId: 'redstone', qty: 1 }], unlockCollection: 'cobble', unlockAmount: 2500 },
  { id: 'super_compactor', name: 'Super Compactor 3000', result: { itemId: 'super_compactor', qty: 1 }, ingredients: [{ itemId: 'enchanted_cobble', qty: 64 }, { itemId: 'enchanted_redstone', qty: 1 }], unlockCollection: 'cobble', unlockAmount: 10000 },
);

export type RecipeCategory = 'tools' | 'weapons' | 'armor' | 'minions' | 'refined' | 'food' | 'misc';

export const RECIPE_CATEGORIES: Array<{ id: RecipeCategory; name: string; icon: string }> = [
  { id: 'tools', name: 'Tools', icon: 'pickaxe' },
  { id: 'weapons', name: 'Weapons', icon: 'sword' },
  { id: 'armor', name: 'Armor', icon: 'chestplate' },
  { id: 'minions', name: 'Minions', icon: 'minion' },
  { id: 'refined', name: 'Enchanted & Refined', icon: 'gem' },
  { id: 'food', name: 'Food', icon: 'food' },
  { id: 'misc', name: 'Materials & Other', icon: 'plank' },
];

export function recipeCategory(recipe: Recipe): RecipeCategory {
  const type = ITEMS[recipe.result.itemId]?.type;
  if (type === 'MINION') return 'minions';
  if (type === 'PICKAXE' || type === 'AXE' || type === 'HOE' || type === 'FISHING_ROD' || type === 'DRILL') return 'tools';
  if (type === 'SWORD' || type === 'BOW') return 'weapons';
  if (type === 'HELMET' || type === 'CHESTPLATE' || type === 'LEGGINGS' || type === 'BOOTS') return 'armor';
  if (type === 'CONSUMABLE') return 'food';
  if (recipe.result.itemId.startsWith('enchanted_')) return 'refined';
  return 'misc';
}

export function recipesInCategory(category: RecipeCategory): Recipe[] {
  return RECIPES.filter((recipe) => recipeCategory(recipe) === category)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function recipesForCollection(collectionId: ItemId): Recipe[] {
  return RECIPES.filter((recipe) => recipe.unlockCollection === collectionId)
    .sort((a, b) => (a.unlockAmount ?? 0) - (b.unlockAmount ?? 0));
}

/** Tooltip for the recipe book — always includes ingredients, plus collection requirements when locked. */
export function buildRecipeBookLore(
  recipe: Recipe,
  collections: CollectionsState,
  inventoryCount: (itemId: ItemId) => number,
): LoreLine[] {
  const unlocked = isRecipeUnlocked(recipe.unlockCollection, recipe.unlockAmount, collections);
  const lines: LoreLine[] = [];
  if (!unlocked && recipe.unlockCollection) {
    const have = collections[recipe.unlockCollection] ?? 0;
    const need = recipe.unlockAmount ?? 0;
    const collectionName = ITEMS[recipe.unlockCollection]?.name ?? recipe.unlockCollection;
    lines.push(
      { text: 'LOCKED', color: 'red', bold: true },
      { text: `Requires ${collectionName} Collection ${need.toLocaleString()}`, color: 'red' },
      { text: `Progress: ${Math.floor(have).toLocaleString()}/${need.toLocaleString()}`, color: have >= need ? 'green' : 'yellow' },
      { text: obtainHintForItem(recipe.unlockCollection), color: 'aqua' },
      { text: '' },
    );
  }
  lines.push(
    { text: `Crafts ${recipe.result.qty > 1 ? `${recipe.result.qty}× ` : ''}${ITEMS[recipe.result.itemId]?.name ?? recipe.name}`, color: 'gray' },
    { text: 'Ingredients', color: 'yellow', bold: true },
  );
  for (const ingredient of recipe.ingredients) {
    const have = inventoryCount(ingredient.itemId);
    const ready = have >= ingredient.qty;
    lines.push({
      text: `${ready ? '✔' : '✖'} ${ingredient.qty}× ${ITEMS[ingredient.itemId]?.name ?? ingredient.itemId}  (${have})`,
      color: ready ? 'green' : 'red',
    });
  }
  lines.push({ text: '' });
  if (unlocked) {
    const canCraft = recipe.ingredients.every((ingredient) => inventoryCount(ingredient.itemId) >= ingredient.qty);
    lines.push({ text: canCraft ? 'Click to craft!' : 'Missing ingredients', color: canCraft ? 'yellow' : 'red' });
  } else {
    lines.push({ text: 'Collect the requirement above to craft this.', color: 'dark_gray' });
  }
  return lines;
}
