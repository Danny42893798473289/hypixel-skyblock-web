import type { CollectionCategory } from './collections.js';

/** One bazaar/collection commodity from Hypixel SkyBlock. */
export interface CatalogEntry {
  id: string;
  name: string;
  collection: CollectionCategory;
  color: string;
  npcSell?: number;
  enchanted?: boolean;
  enchantedBlock?: boolean;
  enchantedName?: string;
  minion?: boolean;
  bazaarable?: boolean;
  heal?: number;
  type?: 'CONSUMABLE' | 'MATERIAL';
}

/** Hypixel SkyBlock bazaar commodities — wiki Bazaar product lists. */
export const SKYBLOCK_CATALOG: CatalogEntry[] = [
  { id: 'wheat', name: 'Wheat', collection: 'farming', color: '#e8c84a', npcSell: 1, enchanted: true, enchantedName: 'Enchanted Hay Bale', minion: false },
  { id: 'seeds', name: 'Seeds', collection: 'farming', color: '#c4a832', npcSell: 1, enchanted: true, enchantedName: 'Enchanted Seeds', minion: false },
  { id: 'carrot', name: 'Carrot', collection: 'farming', color: '#ff8800', enchanted: true, minion: true },
  { id: 'potato', name: 'Potato', collection: 'farming', color: '#d6b35a', enchanted: true, minion: true },
  { id: 'poisonous_potato', name: 'Poisonous Potato', collection: 'farming', color: '#88aa44', enchanted: true, minion: false },
  { id: 'pumpkin', name: 'Pumpkin', collection: 'farming', color: '#ffaa00', enchanted: true, minion: true },
  { id: 'melon_slice', name: 'Melon Slice', collection: 'farming', color: '#55ff55', enchanted: true, enchantedName: 'Enchanted Melon Slice', minion: false },
  { id: 'melon', name: 'Melon', collection: 'farming', color: '#44cc44', enchanted: true, enchantedName: 'Enchanted Melon', minion: true },
  { id: 'red_mushroom', name: 'Red Mushroom', collection: 'farming', color: '#cc3333', enchanted: true, minion: false },
  { id: 'brown_mushroom', name: 'Brown Mushroom', collection: 'farming', color: '#886644', enchanted: true, minion: false },
  { id: 'mushroom', name: 'Mushroom', collection: 'farming', color: '#aa3333', enchanted: true, minion: true },
  { id: 'cocoa_beans', name: 'Cocoa Beans', collection: 'farming', color: '#885522', enchanted: true, minion: true },
  { id: 'cactus', name: 'Cactus', collection: 'farming', color: '#00aa00', enchanted: true, enchantedName: 'Enchanted Cactus Green', minion: true },
  { id: 'sugar_cane', name: 'Sugar Cane', collection: 'farming', color: '#aaffaa', enchanted: true, minion: true },
  { id: 'nether_wart', name: 'Nether Wart', collection: 'farming', color: '#aa0033', enchanted: true, minion: true },
  { id: 'leather', name: 'Leather', collection: 'farming', color: '#8b4513', enchanted: true, minion: false },
  { id: 'raw_beef', name: 'Raw Beef', collection: 'farming', color: '#cc4444', enchanted: true, minion: false },
  { id: 'raw_porkchop', name: 'Raw Porkchop', collection: 'farming', color: '#ffb6c1', enchanted: true, minion: false },
  { id: 'raw_chicken', name: 'Raw Chicken', collection: 'farming', color: '#ffffff', enchanted: true, minion: false },
  { id: 'feather', name: 'Feather', collection: 'farming', color: '#eeeeee', enchanted: true, minion: false },
  { id: 'egg', name: 'Egg', collection: 'farming', color: '#ffffcc', enchanted: true, minion: false },
  { id: 'wool', name: 'Wool', collection: 'farming', color: '#dddddd', enchanted: true, minion: false },
  { id: 'mutton', name: 'Mutton', collection: 'farming', color: '#cc8888', enchanted: true, minion: false },
  { id: 'raw_rabbit', name: 'Raw Rabbit', collection: 'farming', color: '#aa8866', enchanted: true, minion: false },
  { id: 'rabbit_foot', name: "Rabbit's Foot", collection: 'farming', color: '#ddaa88', enchanted: true, minion: false },
  { id: 'rabbit_hide', name: 'Rabbit Hide', collection: 'farming', color: '#aa8866', enchanted: true, minion: false },
  { id: 'cobble', name: 'Cobblestone', collection: 'mining', color: '#888888', npcSell: 1, enchanted: true, minion: false },
  { id: 'coal', name: 'Coal', collection: 'mining', color: '#222222', enchanted: true, minion: false },
  { id: 'iron_ore', name: 'Iron Ore', collection: 'mining', color: '#c0a080', enchanted: false, minion: false },
  { id: 'iron_ingot', name: 'Iron Ingot', collection: 'mining', color: '#d8d8d8', enchanted: true, minion: false },
  { id: 'gold_ingot', name: 'Gold Ingot', collection: 'mining', color: '#ffaa00', enchanted: true, minion: false },
  { id: 'diamond', name: 'Diamond', collection: 'mining', color: '#55ffff', npcSell: 8, enchanted: true, minion: false },
  { id: 'emerald', name: 'Emerald', collection: 'mining', color: '#55ff55', enchanted: true, minion: false },
  { id: 'lapis', name: 'Lapis Lazuli', collection: 'mining', color: '#5555ff', enchanted: true, minion: false },
  { id: 'redstone', name: 'Redstone', collection: 'mining', color: '#ff5555', enchanted: true, minion: false },
  { id: 'obsidian', name: 'Obsidian', collection: 'mining', color: '#220033', enchanted: true, minion: false },
  { id: 'end_stone', name: 'End Stone', collection: 'mining', color: '#ffffaa', enchanted: true, minion: false },
  { id: 'flint', name: 'Flint', collection: 'mining', color: '#333333', enchanted: true, minion: false },
  { id: 'gravel', name: 'Gravel', collection: 'mining', color: '#999999', enchanted: true, minion: false },
  { id: 'sand', name: 'Sand', collection: 'mining', color: '#ffffaa', enchanted: true, minion: false },
  { id: 'red_sand', name: 'Red Sand', collection: 'mining', color: '#cc8844', enchanted: true, minion: false },
  { id: 'ice', name: 'Ice', collection: 'mining', color: '#aaddff', enchanted: true, minion: false },
  { id: 'packed_ice', name: 'Packed Ice', collection: 'mining', color: '#88ccff', enchanted: true, minion: false },
  { id: 'snowball', name: 'Snowball', collection: 'mining', color: '#ffffff', enchanted: true, minion: false },
  { id: 'netherrack', name: 'Netherrack', collection: 'mining', color: '#662222', enchanted: true, minion: false },
  { id: 'quartz', name: 'Nether Quartz', collection: 'mining', color: '#eeeeee', enchanted: true, minion: false },
  { id: 'glowstone_dust', name: 'Glowstone Dust', collection: 'mining', color: '#ffcc44', enchanted: true, minion: false },
  { id: 'mithril', name: 'Mithril', collection: 'mining', color: '#45c9b0', enchanted: true, minion: false },
  { id: 'titanium', name: 'Titanium', collection: 'mining', color: '#cccccc', enchanted: true, minion: false },
  { id: 'hard_stone', name: 'Hard Stone', collection: 'mining', color: '#666666', enchanted: true, minion: false },
  { id: 'gemstone_ruby', name: 'Rough Ruby Gemstone', collection: 'mining', color: '#d81b45', enchanted: true, minion: false },
  { id: 'gemstone_jade', name: 'Rough Jade Gemstone', collection: 'mining', color: '#2ec27e', enchanted: true, minion: false },
  { id: 'gemstone_amethyst', name: 'Rough Amethyst Gemstone', collection: 'mining', color: '#aa55ff', enchanted: true, minion: false },
  { id: 'gemstone_sapphire', name: 'Rough Sapphire Gemstone', collection: 'mining', color: '#4488ff', enchanted: true, minion: false },
  { id: 'gemstone_amber', name: 'Rough Amber Gemstone', collection: 'mining', color: '#ff8800', enchanted: true, minion: false },
  { id: 'gemstone_topaz', name: 'Rough Topaz Gemstone', collection: 'mining', color: '#ffcc00', enchanted: true, minion: false },
  { id: 'gemstone_jasper', name: 'Rough Jasper Gemstone', collection: 'mining', color: '#cc6644', enchanted: true, minion: false },
  { id: 'sulphur', name: 'Sulphur', collection: 'mining', color: '#ffff55', enchanted: true, minion: false },
  { id: 'mycelium', name: 'Mycelium', collection: 'mining', color: '#aa88aa', enchanted: true, minion: false },
  { id: 'rotten_flesh', name: 'Rotten Flesh', collection: 'combat', color: '#6b8f4e', enchanted: true, minion: false },
  { id: 'bone', name: 'Bone', collection: 'combat', color: '#eeeeee', enchanted: true, minion: false },
  { id: 'string', name: 'String', collection: 'combat', color: '#f0f0f0', enchanted: true, enchantedBlock: false, minion: false },
  { id: 'spider_eye', name: 'Spider Eye', collection: 'combat', color: '#aa0000', enchanted: true, minion: false },
  { id: 'gunpowder', name: 'Gunpowder', collection: 'combat', color: '#888888', enchanted: true, minion: false },
  { id: 'ender_pearl', name: 'Ender Pearl', collection: 'combat', color: '#00aaaa', enchanted: true, minion: false },
  { id: 'ghast_tear', name: 'Ghast Tear', collection: 'combat', color: '#ffffff', enchanted: true, minion: false },
  { id: 'slimeball', name: 'Slimeball', collection: 'combat', color: '#55ff55', enchanted: true, minion: false },
  { id: 'magma_cream', name: 'Magma Cream', collection: 'combat', color: '#ff8844', enchanted: true, minion: false },
  { id: 'blaze_rod', name: 'Blaze Rod', collection: 'combat', color: '#ffaa00', enchanted: true, minion: false },
  { id: 'soul_sand', name: 'Soul Sand', collection: 'combat', color: '#553311', enchanted: true, minion: false },
  { id: 'oak_log', name: 'Oak Log', collection: 'foraging', color: '#8b5a2b', enchanted: true, minion: false },
  { id: 'spruce_log', name: 'Spruce Log', collection: 'foraging', color: '#553311', enchanted: true, minion: true },
  { id: 'birch_log', name: 'Birch Log', collection: 'foraging', color: '#ddddaa', enchanted: true, minion: true },
  { id: 'jungle_log', name: 'Jungle Log', collection: 'foraging', color: '#aa7733', enchanted: true, minion: true },
  { id: 'acacia_log', name: 'Acacia Log', collection: 'foraging', color: '#cc6633', enchanted: true, minion: true },
  { id: 'dark_oak_log', name: 'Dark Oak Log', collection: 'foraging', color: '#553311', enchanted: true, minion: true },
  { id: 'raw_fish', name: 'Raw Fish', collection: 'fishing', color: '#7ec8e3', enchanted: true, minion: false },
  { id: 'raw_salmon', name: 'Raw Salmon', collection: 'fishing', color: '#cc6644', enchanted: true, minion: false },
  { id: 'clownfish', name: 'Clownfish', collection: 'fishing', color: '#ff8844', enchanted: true, minion: false },
  { id: 'pufferfish', name: 'Pufferfish', collection: 'fishing', color: '#ffcc44', enchanted: true, minion: false },
  { id: 'prismarine_shard', name: 'Prismarine Shard', collection: 'fishing', color: '#55aaaa', enchanted: true, minion: false },
  { id: 'prismarine_crystals', name: 'Prismarine Crystals', collection: 'fishing', color: '#88dddd', enchanted: true, minion: false },
  { id: 'sponge', name: 'Sponge', collection: 'fishing', color: '#ffffaa', enchanted: true, minion: false },
];

export const COLLECTION_TIER_AMOUNTS = [50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000];

export const MINION_TOOL_BY_COLLECTION: Record<CollectionCategory, string> = {
  mining: 'wooden_pickaxe',
  farming: 'wooden_hoe',
  foraging: 'wooden_axe',
  combat: 'wooden_sword',
  fishing: 'fishing_rod',
};
