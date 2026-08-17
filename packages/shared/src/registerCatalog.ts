import {
  COLLECTIONS,
} from './collections.js';
import {
  ITEMS,
  refreshBazaarItems,
  type ItemDef,
  type ItemId,
  type ItemRarity,
  type ItemType,
} from './items.js';
import {
  RECIPES,
  type Recipe,
} from './recipes.js';
import {
  COLLECTION_TIER_AMOUNTS,
  MINION_TOOL_BY_COLLECTION,
  SKYBLOCK_CATALOG,
  type CatalogEntry,
} from './skyblockCatalog.js';
import { SKYBLOCK_CATALOG_EXTRA } from './skyblockCatalogExtra.js';
import { setBazaarSection, type BazaarSection } from './bazaarCategories.js';
import { applyNpcSellPrices } from './npcPrices.js';
import { ensureMinionDef } from './minions.js';

const FULL_CATALOG = [...SKYBLOCK_CATALOG, ...SKYBLOCK_CATALOG_EXTRA];

function makeItem(entry: CatalogEntry, overrides: Partial<ItemDef> = {}): ItemDef {
  return {
    id: entry.id,
    name: entry.name,
    category: 'resource',
    stackSize: 64,
    color: entry.color,
    bazaarable: entry.bazaarable ?? true,
    description: `SkyBlock ${entry.name}.`,
    type: entry.type ?? 'MATERIAL',
    npcSell: entry.npcSell ?? 1,
    ...overrides,
  };
}

function skyblockMaterial(
  id: ItemId,
  name: string,
  rarity: ItemRarity,
  color: string,
  options: Partial<ItemDef> = {},
): ItemDef {
  return {
    id,
    name,
    rarity,
    type: 'MATERIAL',
    category: 'material',
    stackSize: 64,
    color,
    bazaarable: options.bazaarable ?? true,
    description: options.description ?? '',
    npcSell: options.npcSell ?? (rarity === 'RARE' ? 25600 : 320),
    ...options,
  };
}

function enchantedId(baseId: string): string {
  return `enchanted_${baseId}`;
}

function blockId(baseId: string): string {
  return `enchanted_${baseId}_block`;
}

function minionId(baseId: string): string {
  return `minion_${baseId}`;
}

function recipeExists(id: string): boolean {
  return RECIPES.some((recipe) => recipe.id === id);
}

function addRecipe(recipe: Recipe): void {
  if (recipeExists(recipe.id)) return;
  RECIPES.push(recipe);
}

const COLLECTION_TO_BAZAAR: Record<CatalogEntry['collection'], BazaarSection> = {
  farming: 'farming',
  mining: 'mining',
  combat: 'combat',
  foraging: 'woods',
  fishing: 'woods',
};

function bazaarSectionFor(entry: CatalogEntry): BazaarSection {
  if (entry.id.includes('enchanted_') && entry.id.endsWith('_block')) return 'oddities';
  return COLLECTION_TO_BAZAAR[entry.collection];
}

export function applySkyblockCatalog(): void {
  for (const entry of FULL_CATALOG) {
    if (!ITEMS[entry.id]) {
      ITEMS[entry.id] = makeItem(entry);
    } else if (ITEMS[entry.id].bazaarable === false && entry.bazaarable !== false) {
      ITEMS[entry.id].bazaarable = true;
    }
    if (ITEMS[entry.id].bazaarable) {
      setBazaarSection(entry.id, bazaarSectionFor(entry));
    }

    if (entry.enchanted !== false && !entry.id.startsWith('enchanted_')) {
      const enc = enchantedId(entry.id);
      if (!ITEMS[enc]) {
        ITEMS[enc] = skyblockMaterial(
          enc,
          entry.enchantedName ?? `Enchanted ${entry.name}`,
          'UNCOMMON',
          entry.color,
          { npcSell: 320 },
        );
      }
      if (ITEMS[enc].bazaarable) setBazaarSection(enc, bazaarSectionFor(entry));
    }

    if (entry.enchanted !== false && entry.enchantedBlock !== false && !entry.id.startsWith('enchanted_')) {
      const block = blockId(entry.id);
      if (!ITEMS[block]) {
        ITEMS[block] = skyblockMaterial(
          block,
          `Enchanted ${entry.name} Block`,
          'RARE',
          entry.color,
          { npcSell: 51200 },
        );
      }
      if (ITEMS[block].bazaarable) setBazaarSection(block, 'oddities');
    }

    if (entry.minion !== false && !entry.id.startsWith('enchanted_')) {
      const mid = minionId(entry.id);
      if (!ITEMS[mid]) {
        ITEMS[mid] = {
          id: mid,
          name: `${entry.name} Minion`,
          category: 'minion',
          stackSize: 1,
          color: entry.color,
          bazaarable: false,
          type: 'MINION',
          description: `Produces ${entry.name.toLowerCase()} on your island.`,
        };
      }
      ensureMinionDef(entry.id, entry.id, `${entry.name} Minion`, entry.color);
    }
  }

  for (const logId of ['oak_log', 'spruce_log', 'birch_log', 'jungle_log', 'acacia_log', 'dark_oak_log']) {
    const plankId = logId.replace('_log', '_plank');
    const name = ITEMS[logId]?.name.replace(' Log', ' Plank') ?? plankId;
    if (!ITEMS[plankId]) {
      ITEMS[plankId] = makeItem(
        { id: plankId, name, collection: 'foraging', color: '#c4a35a', bazaarable: true },
      );
      setBazaarSection(plankId, 'woods');
    }
  }
}

export function applySkyblockCollections(): void {
  const existing = new Set(COLLECTIONS.map((c) => c.itemId));

  for (const entry of FULL_CATALOG) {
    if (existing.has(entry.id)) continue;
    if (entry.id.startsWith('enchanted_')) continue;
    existing.add(entry.id);

    COLLECTIONS.push({
      itemId: entry.id,
      name: entry.name,
      category: entry.collection,
      tiers: COLLECTION_TIER_AMOUNTS.map((amount, index) => ({
        amount,
        label: tierLabel(entry, index),
      })),
    });
  }

  COLLECTIONS.sort((a, b) => a.name.localeCompare(b.name));
}

function tierLabel(entry: CatalogEntry, index: number): string {
  const amount = COLLECTION_TIER_AMOUNTS[index];
  if (amount === 50) return `${entry.name} recipes unlocked`;
  if (amount === 100) return `Enchanted ${entry.name}`;
  if (amount === 250) return `${entry.name} Minion I`;
  if (amount === 500) return `${entry.name} sack + coins`;
  if (amount === 1000) return `Enchanted ${entry.name} Block`;
  if (amount === 2500) return `${entry.name} Minion upgrade`;
  if (amount === 5000) return `${entry.name} collection bonus`;
  if (amount === 10000) return `${entry.name} Minion XI`;
  return `${entry.name} collection ${index + 1}`;
}

export function applySkyblockRecipes(): void {
  for (const entry of FULL_CATALOG) {
    if (entry.id.startsWith('enchanted_')) continue;

    const enc = enchantedId(entry.id);
    if (ITEMS[enc] && entry.enchanted !== false) {
      if (ITEMS[enc].bazaarable) setBazaarSection(enc, bazaarSectionFor(entry));
      addRecipe({
        id: enc,
        name: ITEMS[enc].name,
        result: { itemId: enc, qty: 1 },
        ingredients: [{ itemId: entry.id, qty: 160 }],
        unlockCollection: entry.id,
        unlockAmount: 100,
      });
    }

    const block = blockId(entry.id);
    if (ITEMS[block] && entry.enchantedBlock !== false && ITEMS[enc]) {
      addRecipe({
        id: block,
        name: ITEMS[block].name,
        result: { itemId: block, qty: 1 },
        ingredients: [{ itemId: enc, qty: 160 }],
        unlockCollection: entry.id,
        unlockAmount: 1000,
      });
    }

    const mid = minionId(entry.id);
    if (ITEMS[mid] && entry.minion !== false) {
      addRecipe({
        id: mid,
        name: ITEMS[mid].name,
        result: { itemId: mid, qty: 1 },
        ingredients: [
          { itemId: entry.id, qty: 80 },
          { itemId: MINION_TOOL_BY_COLLECTION[entry.collection], qty: 1 },
        ],
        unlockCollection: entry.id,
        unlockAmount: 1000,
      });
    }
  }

  for (const logId of ['oak_log', 'spruce_log', 'birch_log', 'jungle_log', 'acacia_log', 'dark_oak_log']) {
    const plankId = logId.replace('_log', '_plank');
    if (ITEMS[plankId]) {
      addRecipe({
        id: plankId,
        name: ITEMS[plankId].name,
        result: { itemId: plankId, qty: 4 },
        ingredients: [{ itemId: logId, qty: 1 }],
        unlockCollection: logId,
        unlockAmount: 25,
      });
    }
  }

  const smelts: Array<[string, string, number]> = [
    ['iron_ingot', 'iron_ore', 25],
  ];
  for (const [result, ore, unlock] of smelts) {
    if (ITEMS[result] && ITEMS[ore]) {
      addRecipe({
        id: `smelt_${result}`,
        name: ITEMS[result].name,
        result: { itemId: result, qty: 1 },
        ingredients: [{ itemId: ore, qty: 1 }, { itemId: 'coal', qty: 1 }],
        unlockCollection: ore,
        unlockAmount: unlock,
      });
    }
  }

  const chains: Array<[string, string, number, ItemId, number]> = [
    ['enchanted_bread', 'Enchanted Bread', 160, 'wheat', 100],
    ['enchanted_sugar', 'Enchanted Sugar', 160, 'sugar_cane', 100],
    ['enchanted_paper', 'Enchanted Paper', 160, 'enchanted_sugar', 100],
    ['enchanted_cookie', 'Enchanted Cookie', 160, 'enchanted_wheat', 100],
    ['enchanted_charcoal', 'Enchanted Charcoal', 160, 'coal', 100],
    ['enchanted_glistering_melon', 'Enchanted Glistering Melon', 160, 'melon_slice', 100],
    ['enchanted_eye_of_ender', 'Enchanted Eye of Ender', 160, 'enchanted_ender_pearl', 100],
    ['enchanted_fermented_spider_eye', 'Enchanted Fermented Spider Eye', 160, 'enchanted_spider_eye', 100],
    ['enchanted_firework_rocket', 'Enchanted Firework Rocket', 160, 'enchanted_gunpowder', 100],
    ['enchanted_glowstone', 'Enchanted Glowstone', 160, 'glowstone_dust', 100],
    ['enchanted_quartz_block', 'Enchanted Quartz Block', 160, 'enchanted_quartz', 100],
    ['enchanted_redstone_block', 'Enchanted Redstone Block', 160, 'enchanted_redstone', 100],
    ['enchanted_emerald_block', 'Enchanted Emerald Block', 160, 'enchanted_emerald', 100],
    ['enchanted_gold_block', 'Enchanted Gold Block', 160, 'enchanted_gold_ingot', 100],
  ];

  for (const [id, name, qty, ingredient, unlock] of chains) {
    if (!ITEMS[id]) {
      ITEMS[id] = skyblockMaterial(id, name, 'UNCOMMON', '#aaaaaa', { npcSell: 320 });
    }
    if (ITEMS[ingredient]) {
      addRecipe({
        id: `craft_${id}`,
        name,
        result: { itemId: id, qty: 1 },
        ingredients: [{ itemId: ingredient, qty }],
        unlockCollection: ingredient.replace(/^enchanted_/, ''),
        unlockAmount: unlock,
      });
    }
  }

  const toolSets: Array<[ItemId, ItemId, number]> = [
    ['iron_axe', 'iron_ingot', 100],
    ['iron_sword', 'iron_ingot', 100],
    ['iron_hoe', 'iron_ingot', 100],
    ['golden_pickaxe', 'gold_ingot', 250],
    ['golden_axe', 'gold_ingot', 250],
    ['golden_sword', 'gold_ingot', 250],
    ['diamond_sword', 'diamond', 250],
    ['diamond_axe', 'diamond', 250],
  ];

  for (const [toolId, mat, unlock] of toolSets) {
    if (!ITEMS[toolId]) {
      const type: ItemType = toolId.includes('pickaxe') ? 'PICKAXE'
        : toolId.includes('axe') ? 'AXE'
          : toolId.includes('sword') ? 'SWORD' : 'HOE';
      ITEMS[toolId] = {
        id: toolId,
        name: toolId.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' '),
        category: type === 'SWORD' ? 'weapon' : 'tool',
        stackSize: 1,
        color: '#d8d8d8',
        bazaarable: false,
        type,
        toolType: type === 'SWORD' ? 'sword' : type === 'PICKAXE' ? 'pickaxe' : type === 'AXE' ? 'axe' : 'hoe',
        toolTier: toolId.startsWith('golden') ? 4 : 3,
        description: `Crafted ${toolId.replace(/_/g, ' ')}.`,
      };
    }
    addRecipe({
      id: toolId,
      name: ITEMS[toolId].name,
      result: { itemId: toolId, qty: 1 },
      ingredients: [{ itemId: mat, qty: 3 }, { itemId: 'stick', qty: 2 }],
      unlockCollection: mat,
      unlockAmount: unlock,
    });
  }

  const foods: Array<[ItemId, ItemId, number]> = [
    ['cooked_beef', 'raw_beef', 50],
    ['cooked_porkchop', 'raw_porkchop', 50],
    ['cooked_chicken', 'raw_chicken', 50],
    ['cooked_mutton', 'mutton', 50],
    ['cooked_rabbit', 'raw_rabbit', 50],
    ['cooked_salmon', 'raw_salmon', 25],
  ];

  for (const [cooked, raw, unlock] of foods) {
    if (!ITEMS[cooked]) {
      ITEMS[cooked] = {
        id: cooked,
        name: cooked.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' '),
        category: 'food',
        stackSize: 64,
        color: '#e8a050',
        bazaarable: true,
        type: 'CONSUMABLE',
        heal: 30,
        description: 'Cooked food that restores health.',
      };
    }
    if (ITEMS[raw]) {
      addRecipe({
        id: cooked,
        name: ITEMS[cooked].name,
        result: { itemId: cooked, qty: 1 },
        ingredients: [{ itemId: raw, qty: 1 }, { itemId: 'coal', qty: 1 }],
        unlockCollection: raw,
        unlockAmount: unlock,
      });
    }
  }
}

export function registerAllSkyblockContent(): void {
  applySkyblockCatalog();
  applySkyblockCollections();
  applySkyblockRecipes();
  applyNpcSellPrices(ITEMS);
  refreshBazaarItems();
}

registerAllSkyblockContent();
