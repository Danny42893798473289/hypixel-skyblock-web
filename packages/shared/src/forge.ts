import { ITEMS, type ItemId } from './items.js';
import { countItem, type Inventory } from './inventory.js';
import { levelFromXp, type SkillId } from './skills.js';
import type { LoreLine } from './lore.js';
import type { PlayerState } from './protocol.js';

export type ForgeCategory = 'drills' | 'parts' | 'gemstones' | 'armor' | 'tools' | 'fuel';

export interface ForgeIngredient {
  itemId: ItemId;
  qty: number;
}

export interface ForgeRecipe {
  id: string;
  name: string;
  category: ForgeCategory;
  result: ItemId;
  qty: number;
  ingredients: ForgeIngredient[];
  powderCost: number;
  unlockSkill?: { skill: SkillId; level: number };
  unlockCollection?: { itemId: ItemId; amount: number };
}

export const FORGE_CATEGORIES: Array<{ id: ForgeCategory; name: string; icon: string }> = [
  { id: 'drills', name: 'Drills', icon: 'drill' },
  { id: 'parts', name: 'Parts', icon: 'ingot' },
  { id: 'gemstones', name: 'Gemstones', icon: 'gem' },
  { id: 'armor', name: 'Armor', icon: 'chestplate' },
  { id: 'tools', name: 'Tools', icon: 'pickaxe' },
  { id: 'fuel', name: 'Fuel', icon: 'potion' },
];

export const FORGE_GEMS: Array<{ rough: ItemId; flawless: ItemId; perfect?: ItemId; name: string; color: string }> = [
  { rough: 'gemstone_ruby', flawless: 'flawless_ruby', perfect: 'perfect_ruby', name: 'Ruby', color: '#d81b45' },
  { rough: 'gemstone_jade', flawless: 'flawless_jade', perfect: 'perfect_jade', name: 'Jade', color: '#2ec27e' },
  { rough: 'gemstone_amethyst', flawless: 'flawless_amethyst', perfect: 'perfect_amethyst', name: 'Amethyst', color: '#aa55ff' },
  { rough: 'gemstone_sapphire', flawless: 'flawless_sapphire', perfect: 'perfect_sapphire', name: 'Sapphire', color: '#4488ff' },
  { rough: 'gemstone_amber', flawless: 'flawless_amber', perfect: 'perfect_amber', name: 'Amber', color: '#ff8800' },
  { rough: 'gemstone_topaz', flawless: 'flawless_topaz', perfect: 'perfect_topaz', name: 'Topaz', color: '#ffcc00' },
  { rough: 'gemstone_jasper', flawless: 'flawless_jasper', perfect: 'perfect_jasper', name: 'Jasper', color: '#cc6644' },
  { rough: 'aquamarine', flawless: 'flawless_aquamarine', name: 'Aquamarine', color: '#44ccff' },
  { rough: 'citrine', flawless: 'flawless_citrine', name: 'Citrine', color: '#ffcc44' },
  { rough: 'peridot', flawless: 'flawless_peridot', name: 'Peridot', color: '#88cc44' },
  { rough: 'onyx', flawless: 'flawless_onyx', name: 'Onyx', color: '#222222' },
  { rough: 'volta', flawless: 'flawless_volta', name: 'Volta', color: '#ffff55' },
];

const SLOT_QTY: Record<string, number> = { helmet: 5, chestplate: 8, leggings: 7, boots: 4 };

function recipe(
  id: string,
  name: string,
  category: ForgeCategory,
  result: ItemId,
  ingredients: ForgeIngredient[],
  powderCost: number,
  unlock?: ForgeRecipe['unlockSkill'],
  collection?: ForgeRecipe['unlockCollection'],
): ForgeRecipe {
  return {
    id,
    name,
    category,
    result,
    qty: 1,
    ingredients,
    powderCost,
    unlockSkill: unlock,
    unlockCollection: collection,
  };
}

function armorSet(
  prefix: string,
  setName: string,
  materials: ForgeIngredient[],
  powder: number,
  miningLevel: number,
  collection: { itemId: ItemId; amount: number },
): ForgeRecipe[] {
  return (['helmet', 'chestplate', 'leggings', 'boots'] as const).map((slot) => {
    const id = `${prefix}_${slot}`;
    const scale = (SLOT_QTY[slot] ?? 5) / 5;
    return recipe(
      `forge_${id}`,
      `${setName} ${slot[0]!.toUpperCase()}${slot.slice(1)}`,
      'armor',
      id,
      materials.map((entry) => ({ itemId: entry.itemId, qty: Math.max(1, Math.round(entry.qty * scale)) })),
      Math.round(powder * scale),
      { skill: 'mining', level: miningLevel },
      collection,
    );
  });
}

function partChain(
  prefix: string,
  names: string[],
  firstIngredients: ForgeIngredient[],
  nextExtra: (tier: number) => ForgeIngredient[],
  powder: number[],
  miningLevel: number,
): ForgeRecipe[] {
  return names.map((name, i) => {
    const tier = i + 1;
    const id = `${prefix}_${tier}`;
    const prev = tier === 1 ? firstIngredients : [{ itemId: `${prefix}_${tier - 1}`, qty: 1 }, ...nextExtra(tier)];
    return recipe(`forge_${id}`, name, 'parts', id, prev, powder[i] ?? 500, { skill: 'mining', level: miningLevel + i });
  });
}

export const FORGE_RECIPES: ForgeRecipe[] = [
  recipe('forge_ruby_drill', 'Ruby Drill', 'drills', 'ruby_drill', [
    { itemId: 'mithril_pickaxe', qty: 1 },
    { itemId: 'enchanted_mithril', qty: 16 },
    { itemId: 'gemstone_ruby', qty: 32 },
  ], 500, { skill: 'mining', level: 12 }, { itemId: 'mithril', amount: 500 }),
  recipe('forge_topaz_drill', 'Topaz Drill', 'drills', 'topaz_drill', [
    { itemId: 'ruby_drill', qty: 1 },
    { itemId: 'enchanted_mithril', qty: 24 },
    { itemId: 'gemstone_topaz', qty: 48 },
  ], 1200, { skill: 'mining', level: 14 }, { itemId: 'gemstone_topaz', amount: 250 }),
  recipe('forge_jade_drill', 'Jade Drill', 'drills', 'jade_drill', [
    { itemId: 'topaz_drill', qty: 1 },
    { itemId: 'enchanted_titanium', qty: 8 },
    { itemId: 'gemstone_jade', qty: 64 },
  ], 2500, { skill: 'mining', level: 16 }, { itemId: 'gemstone_jade', amount: 500 }),
  recipe('forge_amber_drill', 'Amber Drill', 'drills', 'amber_drill', [
    { itemId: 'jade_drill', qty: 1 },
    { itemId: 'enchanted_titanium', qty: 16 },
    { itemId: 'gemstone_amber', qty: 64 },
  ], 5000, { skill: 'mining', level: 18 }, { itemId: 'gemstone_amber', amount: 1000 }),
  recipe('forge_sapphire_drill', 'Sapphire Drill', 'drills', 'sapphire_drill', [
    { itemId: 'amber_drill', qty: 1 },
    { itemId: 'enchanted_mithril', qty: 32 },
    { itemId: 'gemstone_sapphire', qty: 80 },
  ], 9000, { skill: 'mining', level: 20 }, { itemId: 'gemstone_sapphire', amount: 1000 }),
  recipe('forge_amethyst_drill', 'Amethyst Drill', 'drills', 'amethyst_drill', [
    { itemId: 'sapphire_drill', qty: 1 },
    { itemId: 'enchanted_titanium', qty: 24 },
    { itemId: 'gemstone_amethyst', qty: 80 },
    { itemId: 'flawless_sapphire', qty: 2 },
  ], 16000, { skill: 'mining', level: 22 }, { itemId: 'gemstone_amethyst', amount: 2500 }),
  recipe('forge_divans_drill', "Divan's Drill", 'drills', 'divans_drill', [
    { itemId: 'amethyst_drill', qty: 1 },
    { itemId: 'enchanted_titanium', qty: 32 },
    { itemId: 'flawless_ruby', qty: 3 },
    { itemId: 'flawless_jade', qty: 3 },
    { itemId: 'flawless_jasper', qty: 3 },
  ], 50000, { skill: 'mining', level: 25 }, { itemId: 'titanium', amount: 2500 }),

  ...partChain(
    'fuel_tank',
    ['Mithril-Plated Fuel Tank', 'Titanium-Plated Fuel Tank', 'Gemstone Fuel Tank', 'Perfect Fuel Tank', "Divan's Fuel Tank"],
    [{ itemId: 'enchanted_mithril', qty: 16 }, { itemId: 'enchanted_iron', qty: 8 }],
    (tier) => tier === 2
      ? [{ itemId: 'enchanted_titanium', qty: 8 }]
      : tier === 3
        ? [{ itemId: 'gemstone_ruby', qty: 32 }]
        : tier === 4
          ? [{ itemId: 'flawless_ruby', qty: 2 }]
          : [{ itemId: 'flawless_jade', qty: 3 }],
    [250, 600, 1400, 3000, 8000],
    12,
  ),
  ...partChain(
    'drill_engine',
    ['Mithril Drill Engine', 'Titanium Drill Engine', 'Gemstone Drill Engine', 'Perfect Drill Engine', "Divan's Drill Engine"],
    [{ itemId: 'enchanted_mithril', qty: 24 }, { itemId: 'enchanted_redstone', qty: 16 }],
    (tier) => tier === 2
      ? [{ itemId: 'enchanted_titanium', qty: 12 }]
      : tier === 3
        ? [{ itemId: 'gemstone_amber', qty: 32 }]
        : tier === 4
          ? [{ itemId: 'flawless_amber', qty: 2 }]
          : [{ itemId: 'flawless_topaz', qty: 3 }],
    [300, 750, 1600, 3500, 9000],
    12,
  ),
  ...partChain(
    'gemstone_fuel_tank',
    ['Ruby Gemstone Tank', 'Jade Gemstone Tank', 'Sapphire Gemstone Tank', 'Perfect Gemstone Tank', "Divan's Gemstone Tank"],
    [{ itemId: 'gemstone_ruby', qty: 48 }, { itemId: 'enchanted_mithril', qty: 8 }],
    (tier) => tier === 2
      ? [{ itemId: 'gemstone_jade', qty: 48 }]
      : tier === 3
        ? [{ itemId: 'gemstone_sapphire', qty: 48 }]
        : tier === 4
          ? [{ itemId: 'flawless_sapphire', qty: 2 }]
          : [{ itemId: 'flawless_amethyst', qty: 3 }],
    [400, 900, 2000, 4500, 12000],
    14,
  ),
  ...partChain(
    'gemstone_chamber',
    ['Ruby Gemstone Chamber', 'Jade Gemstone Chamber', 'Sapphire Gemstone Chamber', 'Perfect Gemstone Chamber', "Divan's Gemstone Chamber"],
    [{ itemId: 'gemstone_ruby', qty: 32 }, { itemId: 'enchanted_diamond', qty: 8 }],
    (tier) => tier === 2
      ? [{ itemId: 'gemstone_jade', qty: 32 }]
      : tier === 3
        ? [{ itemId: 'gemstone_sapphire', qty: 32 }]
        : tier === 4
          ? [{ itemId: 'flawless_jasper', qty: 2 }]
          : [{ itemId: 'flawless_volta', qty: 2 }],
    [400, 900, 2000, 4500, 12000],
    14,
  ),

  ...FORGE_GEMS.map((gem) => recipe(
    `forge_${gem.flawless}`,
    `Flawless ${gem.name} Gemstone`,
    'gemstones',
    gem.flawless,
    [{ itemId: gem.rough, qty: 80 }],
    400,
    { skill: 'mining', level: 12 },
    { itemId: gem.rough, amount: 250 },
  )),

  ...FORGE_GEMS.filter((gem) => gem.perfect).map((gem) => recipe(
    `forge_${gem.perfect!}`,
    `Perfect ${gem.name} Gemstone`,
    'gemstones',
    gem.perfect!,
    [{ itemId: gem.flawless, qty: 5 }],
    2000,
    { skill: 'mining', level: 20 },
    { itemId: gem.flawless, amount: 50 },
  )),

  ...armorSet('sorrow', 'Sorrow', [
    { itemId: 'enchanted_mithril', qty: 8 },
    { itemId: 'gemstone_jasper', qty: 32 },
  ], 2200, 15, { itemId: 'gemstone_jasper', amount: 500 }),
  ...armorSet('glacite', 'Glacite', [
    { itemId: 'enchanted_glacite', qty: 8 },
    { itemId: 'glacite', qty: 48 },
  ], 1600, 14, { itemId: 'glacite', amount: 500 }),
  ...armorSet('yog', 'Yog', [
    { itemId: 'gemstone_ruby', qty: 24 },
    { itemId: 'magma_cream', qty: 32 },
    { itemId: 'netherrack', qty: 64 },
  ], 1800, 16, { itemId: 'gemstone_ruby', amount: 500 }),
  ...armorSet('heat', 'Heat', [
    { itemId: 'gemstone_topaz', qty: 24 },
    { itemId: 'magma_block', qty: 16 },
    { itemId: 'enchanted_netherrack', qty: 8 },
  ], 1800, 15, { itemId: 'netherrack', amount: 500 }),

  recipe('forge_gemstone_gauntlet', 'Gemstone Gauntlet', 'tools', 'gemstone_gauntlet', [
    { itemId: 'mithril_pickaxe', qty: 1 },
    { itemId: 'enchanted_diamond', qty: 32 },
    { itemId: 'flawless_ruby', qty: 2 },
    { itemId: 'flawless_jade', qty: 2 },
  ], 8000, { skill: 'mining', level: 20 }, { itemId: 'mithril', amount: 5000 }),

  recipe('forge_biofuel', 'Biofuel', 'fuel', 'biofuel', [
    { itemId: 'enchanted_coal', qty: 8 },
    { itemId: 'cactus', qty: 16 },
  ], 40, { skill: 'mining', level: 12 }),
];

export function forgeRecipeById(id: string): ForgeRecipe | undefined {
  return FORGE_RECIPES.find((recipe) => recipe.id === id);
}

export function forgeRecipesInCategory(category: ForgeCategory): ForgeRecipe[] {
  return FORGE_RECIPES.filter((recipe) => recipe.category === category);
}

export function playerGemstonePowder(player: Pick<PlayerState, 'hotm'>): number {
  return player.hotm?.gemstonePowder ?? 0;
}

export function forgeUnlocked(
  recipe: ForgeRecipe,
  player: Pick<PlayerState, 'skills' | 'collections'>,
): boolean {
  if (recipe.unlockSkill) {
    const level = levelFromXp(player.skills[recipe.unlockSkill.skill] ?? 0).level;
    if (level < recipe.unlockSkill.level) return false;
  }
  if (recipe.unlockCollection) {
    const have = player.collections[recipe.unlockCollection.itemId] ?? 0;
    if (have < recipe.unlockCollection.amount) return false;
  }
  return true;
}

export function forgeHasIngredients(recipe: ForgeRecipe, inventory: Inventory): boolean {
  return recipe.ingredients.every((ing) => countItem(inventory, ing.itemId) >= ing.qty);
}

export function canForge(
  recipe: ForgeRecipe,
  player: Pick<PlayerState, 'skills' | 'collections' | 'inventory' | 'hotm'>,
): boolean {
  return forgeUnlocked(recipe, player)
    && forgeHasIngredients(recipe, player.inventory)
    && playerGemstonePowder(player) >= recipe.powderCost;
}

export function buildForgeLore(
  recipe: ForgeRecipe,
  player: Pick<PlayerState, 'skills' | 'collections' | 'inventory' | 'hotm'>,
): LoreLine[] {
  const unlocked = forgeUnlocked(recipe, player);
  const powder = playerGemstonePowder(player);
  const lines: LoreLine[] = [];
  if (!unlocked && recipe.unlockSkill) {
    const have = levelFromXp(player.skills[recipe.unlockSkill.skill] ?? 0).level;
    lines.push(
      { text: 'LOCKED', color: 'red', bold: true },
      { text: `Requires ${recipe.unlockSkill.skill} ${recipe.unlockSkill.level}  (you: ${have})`, color: 'red' },
      { text: '' },
    );
  } else if (!unlocked && recipe.unlockCollection) {
    const have = player.collections[recipe.unlockCollection.itemId] ?? 0;
    lines.push(
      { text: 'LOCKED', color: 'red', bold: true },
      { text: `Requires ${ITEMS[recipe.unlockCollection.itemId]?.name ?? recipe.unlockCollection.itemId} ${recipe.unlockCollection.amount.toLocaleString()}`, color: 'red' },
      { text: `Progress: ${Math.floor(have).toLocaleString()}/${recipe.unlockCollection.amount.toLocaleString()}`, color: 'yellow' },
      { text: '' },
    );
  }
  lines.push(
    { text: `Forges ${ITEMS[recipe.result]?.name ?? recipe.name}`, color: 'gray' },
    { text: `Gemstone Powder: ${recipe.powderCost.toLocaleString()}  (you: ${powder.toLocaleString()})`, color: powder >= recipe.powderCost ? 'light_purple' : 'red' },
    { text: 'Ingredients', color: 'yellow', bold: true },
  );
  for (const ingredient of recipe.ingredients) {
    const have = countItem(player.inventory, ingredient.itemId);
    const ready = have >= ingredient.qty;
    lines.push({
      text: `${ready ? '✔' : '✖'} ${ingredient.qty}× ${ITEMS[ingredient.itemId]?.name ?? ingredient.itemId}  (${have})`,
      color: ready ? 'green' : 'red',
    });
  }
  lines.push({ text: '' });
  if (unlocked) {
    lines.push({
      text: canForge(recipe, player) ? 'Click to forge!' : 'Missing powder or ingredients',
      color: canForge(recipe, player) ? 'yellow' : 'red',
    });
  }
  return lines;
}
