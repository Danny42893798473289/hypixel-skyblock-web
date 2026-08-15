import type { StatBlock } from './stats.js';

export type ItemId = string;

export type ItemCategory = 'resource' | 'tool' | 'weapon' | 'food' | 'minion' | 'material';
export type ItemRarity =
  | 'COMMON'
  | 'UNCOMMON'
  | 'RARE'
  | 'EPIC'
  | 'LEGENDARY'
  | 'MYTHIC'
  | 'DIVINE'
  | 'SPECIAL'
  | 'VERY_SPECIAL';
export type ItemType =
  | 'MATERIAL'
  | 'SWORD'
  | 'BOW'
  | 'PICKAXE'
  | 'DRILL'
  | 'AXE'
  | 'HOE'
  | 'FISHING_ROD'
  | 'HELMET'
  | 'CHESTPLATE'
  | 'LEGGINGS'
  | 'BOOTS'
  | 'ACCESSORY'
  | 'PET'
  | 'MINION'
  | 'CONSUMABLE';

export interface ItemDef {
  id: ItemId;
  name: string;
  category: ItemCategory;
  stackSize: number;
  color: string;
  bazaarable: boolean;
  toolType?: 'pickaxe' | 'axe' | 'hoe' | 'sword' | 'rod';
  toolTier?: number;
  damage?: number;
  heal?: number;
  description: string;
  rarity?: ItemRarity;
  type?: ItemType;
  stats?: Partial<StatBlock>;
  npcSell?: number;
  sprite?: string;
  ability?: {
    name: string;
    description: string;
    manaCost?: number;
    cooldownSec?: number;
    damage?: number;
    scaling?: number;
  };
}

export const ITEMS: Record<ItemId, ItemDef> = {
  cobble: {
    id: 'cobble',
    name: 'Cobble',
    category: 'resource',
    stackSize: 64,
    color: '#888888',
    bazaarable: true,
    description: 'Rough stone from the island veins.',
  },
  coal: {
    id: 'coal',
    name: 'Coal',
    category: 'resource',
    stackSize: 64,
    color: '#222222',
    bazaarable: true,
    description: 'Dark fuel mined from coal seams.',
  },
  iron_ore: {
    id: 'iron_ore',
    name: 'Iron Ore',
    category: 'resource',
    stackSize: 64,
    color: '#c0a080',
    bazaarable: true,
    description: 'Raw iron ready to be refined.',
  },
  iron_ingot: {
    id: 'iron_ingot',
    name: 'Iron Ingot',
    category: 'material',
    stackSize: 64,
    color: '#d8d8d8',
    bazaarable: true,
    description: 'Refined iron for tools and trade.',
  },
  wheat: {
    id: 'wheat',
    name: 'Wheat',
    category: 'resource',
    stackSize: 64,
    color: '#e8c84a',
    bazaarable: true,
    description: 'Golden stalks from farm plots.',
  },
  bread: {
    id: 'bread',
    name: 'Bread',
    category: 'food',
    stackSize: 64,
    color: '#c4a060',
    bazaarable: true,
    heal: 25,
    description: 'Restores a bit of health.',
  },
  oak_log: {
    id: 'oak_log',
    name: 'Oak Log',
    category: 'resource',
    stackSize: 64,
    color: '#8b5a2b',
    bazaarable: true,
    description: 'Freshly chopped oak timber.',
  },
  oak_plank: {
    id: 'oak_plank',
    name: 'Oak Plank',
    category: 'material',
    stackSize: 64,
    color: '#c4a35a',
    bazaarable: true,
    description: 'Processed oak used in crafting.',
  },
  string: {
    id: 'string',
    name: 'String',
    category: 'resource',
    stackSize: 64,
    color: '#f0f0f0',
    bazaarable: true,
    description: 'Silky strand from grove spiders.',
  },
  rotten_flesh: {
    id: 'rotten_flesh',
    name: 'Rotten Flesh',
    category: 'resource',
    stackSize: 64,
    color: '#6b8f4e',
    bazaarable: true,
    description: 'Dropped by shambling husks.',
  },
  raw_fish: {
    id: 'raw_fish',
    name: 'Raw Fish',
    category: 'resource',
    stackSize: 64,
    color: '#7ec8e3',
    bazaarable: true,
    description: 'Caught from hub waters.',
  },
  cooked_fish: {
    id: 'cooked_fish',
    name: 'Cooked Fish',
    category: 'food',
    stackSize: 64,
    color: '#e8a050',
    bazaarable: true,
    heal: 35,
    description: 'Tasty grilled fish.',
  },
  stick: {
    id: 'stick',
    name: 'Stick',
    category: 'material',
    stackSize: 64,
    color: '#a67c52',
    bazaarable: true,
    description: 'Simple crafting component.',
  },
  wooden_pickaxe: {
    id: 'wooden_pickaxe',
    name: 'Wooden Pickaxe',
    category: 'tool',
    stackSize: 1,
    color: '#a67c52',
    bazaarable: false,
    toolType: 'pickaxe',
    toolTier: 1,
    description: 'Basic mining tool.',
  },
  stone_pickaxe: {
    id: 'stone_pickaxe',
    name: 'Stone Pickaxe',
    category: 'tool',
    stackSize: 1,
    color: '#888888',
    bazaarable: false,
    toolType: 'pickaxe',
    toolTier: 2,
    description: 'Faster stone mining.',
  },
  iron_pickaxe: {
    id: 'iron_pickaxe',
    name: 'Iron Pickaxe',
    category: 'tool',
    stackSize: 1,
    color: '#d8d8d8',
    bazaarable: false,
    toolType: 'pickaxe',
    toolTier: 3,
    description: 'Mines iron ore efficiently.',
  },
  wooden_axe: {
    id: 'wooden_axe',
    name: 'Wooden Axe',
    category: 'tool',
    stackSize: 1,
    color: '#a67c52',
    bazaarable: false,
    toolType: 'axe',
    toolTier: 1,
    description: 'Chops trees slowly.',
  },
  stone_axe: {
    id: 'stone_axe',
    name: 'Stone Axe',
    category: 'tool',
    stackSize: 1,
    color: '#888888',
    bazaarable: false,
    toolType: 'axe',
    toolTier: 2,
    description: 'Chops trees faster.',
  },
  wooden_hoe: {
    id: 'wooden_hoe',
    name: 'Wooden Hoe',
    category: 'tool',
    stackSize: 1,
    color: '#a67c52',
    bazaarable: false,
    toolType: 'hoe',
    toolTier: 1,
    description: 'Harvests farm plots.',
  },
  stone_hoe: {
    id: 'stone_hoe',
    name: 'Stone Hoe',
    category: 'tool',
    stackSize: 1,
    color: '#888888',
    bazaarable: false,
    toolType: 'hoe',
    toolTier: 2,
    description: 'Better farming yields.',
  },
  wooden_sword: {
    id: 'wooden_sword',
    name: 'Wooden Sword',
    category: 'weapon',
    stackSize: 1,
    color: '#a67c52',
    bazaarable: false,
    toolType: 'sword',
    toolTier: 1,
    damage: 8,
    description: 'Basic combat weapon.',
  },
  stone_sword: {
    id: 'stone_sword',
    name: 'Stone Sword',
    category: 'weapon',
    stackSize: 1,
    color: '#888888',
    bazaarable: false,
    toolType: 'sword',
    toolTier: 2,
    damage: 14,
    description: 'Stronger combat weapon.',
  },
  fishing_rod: {
    id: 'fishing_rod',
    name: 'Fishing Rod',
    category: 'tool',
    stackSize: 1,
    color: '#5a8fbf',
    bazaarable: false,
    toolType: 'rod',
    toolTier: 1,
    description: 'Catch fish at water tiles.',
  },
  minion_cobble: {
    id: 'minion_cobble',
    name: 'Cobble Minion',
    category: 'minion',
    stackSize: 1,
    color: '#666666',
    bazaarable: false,
    description: 'Produces cobble on your island.',
  },
  minion_wheat: {
    id: 'minion_wheat',
    name: 'Wheat Minion',
    category: 'minion',
    stackSize: 1,
    color: '#e8c84a',
    bazaarable: false,
    description: 'Produces wheat on your island.',
  },
  minion_coal: {
    id: 'minion_coal',
    name: 'Coal Minion',
    category: 'minion',
    stackSize: 1,
    color: '#333333',
    bazaarable: false,
    description: 'Produces coal on your island.',
  },
  minion_oak: {
    id: 'minion_oak',
    name: 'Oak Minion',
    category: 'minion',
    stackSize: 1,
    color: '#8b5a2b',
    bazaarable: false,
    description: 'Produces oak logs on your island.',
  },
};

function skyblockItem(
  id: string,
  name: string,
  rarity: ItemRarity,
  type: ItemType,
  options: Partial<ItemDef> = {},
): ItemDef {
  return {
    id,
    name,
    rarity,
    type,
    category: type === 'MATERIAL' ? 'material' : type === 'SWORD' || type === 'BOW' ? 'weapon' : type === 'MINION' ? 'minion' : 'tool',
    stackSize: type === 'MATERIAL' || type === 'CONSUMABLE' ? 64 : 1,
    color: options.color ?? '#aaaaaa',
    bazaarable: options.bazaarable ?? type === 'MATERIAL',
    description: options.description ?? '',
    ...options,
  };
}

Object.assign(ITEMS, {
  enchanted_cobble: skyblockItem('enchanted_cobble', 'Enchanted Cobblestone', 'UNCOMMON', 'MATERIAL', { color: '#55aa55', npcSell: 160 }),
  enchanted_cobble_block: skyblockItem('enchanted_cobble_block', 'Enchanted Cobblestone Block', 'RARE', 'MATERIAL', { color: '#55aaff', npcSell: 25600 }),
  enchanted_coal: skyblockItem('enchanted_coal', 'Enchanted Coal', 'UNCOMMON', 'MATERIAL', { color: '#444444', npcSell: 320 }),
  enchanted_coal_block: skyblockItem('enchanted_coal_block', 'Enchanted Coal Block', 'RARE', 'MATERIAL', { color: '#222222', npcSell: 51200 }),
  enchanted_iron: skyblockItem('enchanted_iron', 'Enchanted Iron', 'UNCOMMON', 'MATERIAL', { color: '#eeeeee', npcSell: 480 }),
  enchanted_iron_block: skyblockItem('enchanted_iron_block', 'Enchanted Iron Block', 'RARE', 'MATERIAL', { color: '#ffffff', npcSell: 76800 }),
  enchanted_wheat: skyblockItem('enchanted_wheat', 'Enchanted Hay Bale', 'UNCOMMON', 'MATERIAL', { color: '#ffff55', npcSell: 480 }),
  enchanted_oak: skyblockItem('enchanted_oak', 'Enchanted Oak Wood', 'UNCOMMON', 'MATERIAL', { color: '#aa7733', npcSell: 480 }),
  enchanted_string: skyblockItem('enchanted_string', 'Enchanted String', 'UNCOMMON', 'MATERIAL', { color: '#ffffff', npcSell: 480 }),
  enchanted_rotten_flesh: skyblockItem('enchanted_rotten_flesh', 'Enchanted Rotten Flesh', 'UNCOMMON', 'MATERIAL', { color: '#557733', npcSell: 480 }),
  diamond: skyblockItem('diamond', 'Diamond', 'COMMON', 'MATERIAL', { color: '#55ffff', npcSell: 8 }),
  enchanted_diamond: skyblockItem('enchanted_diamond', 'Enchanted Diamond', 'UNCOMMON', 'MATERIAL', { color: '#55ffff', npcSell: 1280 }),
  enchanted_diamond_block: skyblockItem('enchanted_diamond_block', 'Enchanted Diamond Block', 'RARE', 'MATERIAL', { color: '#00aaaa', npcSell: 204800 }),
  emerald: skyblockItem('emerald', 'Emerald', 'COMMON', 'MATERIAL', { color: '#55ff55', npcSell: 6 }),
  enchanted_emerald: skyblockItem('enchanted_emerald', 'Enchanted Emerald', 'UNCOMMON', 'MATERIAL', { color: '#00aa00', npcSell: 960 }),
  redstone: skyblockItem('redstone', 'Redstone', 'COMMON', 'MATERIAL', { color: '#ff5555', npcSell: 1 }),
  enchanted_redstone: skyblockItem('enchanted_redstone', 'Enchanted Redstone', 'UNCOMMON', 'MATERIAL', { color: '#aa0000', npcSell: 160 }),
  lapis: skyblockItem('lapis', 'Lapis Lazuli', 'COMMON', 'MATERIAL', { color: '#5555ff', npcSell: 1 }),
  gold_ingot: skyblockItem('gold_ingot', 'Gold Ingot', 'COMMON', 'MATERIAL', { color: '#ffaa00', npcSell: 4 }),
  mithril: skyblockItem('mithril', 'Mithril', 'COMMON', 'MATERIAL', { color: '#45c9b0', npcSell: 8 }),
  gemstone_ruby: skyblockItem('gemstone_ruby', 'Rough Ruby Gemstone', 'COMMON', 'MATERIAL', { color: '#d81b45', npcSell: 3 }),
  gemstone_jade: skyblockItem('gemstone_jade', 'Rough Jade Gemstone', 'COMMON', 'MATERIAL', { color: '#2ec27e', npcSell: 3 }),
  potato: skyblockItem('potato', 'Potato', 'COMMON', 'MATERIAL', { color: '#d6b35a', npcSell: 1 }),
  carrot: skyblockItem('carrot', 'Carrot', 'COMMON', 'MATERIAL', { color: '#ff8800', npcSell: 1 }),
  pumpkin: skyblockItem('pumpkin', 'Pumpkin', 'COMMON', 'MATERIAL', { color: '#ffaa00', npcSell: 4 }),
  melon: skyblockItem('melon', 'Melon', 'COMMON', 'MATERIAL', { color: '#55ff55', npcSell: 2 }),
  sugar_cane: skyblockItem('sugar_cane', 'Sugar Cane', 'COMMON', 'MATERIAL', { color: '#aaffaa', npcSell: 2 }),
  cactus: skyblockItem('cactus', 'Cactus', 'COMMON', 'MATERIAL', { color: '#00aa00', npcSell: 3 }),
  cocoa_beans: skyblockItem('cocoa_beans', 'Cocoa Beans', 'COMMON', 'MATERIAL', { color: '#885522', npcSell: 3 }),
  mushroom: skyblockItem('mushroom', 'Mushroom', 'COMMON', 'MATERIAL', { color: '#aa3333', npcSell: 4 }),
  ender_pearl: skyblockItem('ender_pearl', 'Ender Pearl', 'COMMON', 'MATERIAL', { color: '#00aaaa', npcSell: 10 }),
  blaze_rod: skyblockItem('blaze_rod', 'Blaze Rod', 'COMMON', 'MATERIAL', { color: '#ffaa00', npcSell: 9 }),
  spider_eye: skyblockItem('spider_eye', 'Spider Eye', 'COMMON', 'MATERIAL', { color: '#aa0000', npcSell: 3 }),
  bone: skyblockItem('bone', 'Bone', 'COMMON', 'MATERIAL', { color: '#eeeeee', npcSell: 2 }),
  jungle_log: skyblockItem('jungle_log', 'Jungle Log', 'COMMON', 'MATERIAL', { color: '#aa7733', npcSell: 2 }),
  dark_oak_log: skyblockItem('dark_oak_log', 'Dark Oak Log', 'COMMON', 'MATERIAL', { color: '#553311', npcSell: 2 }),
  undead_sword: skyblockItem('undead_sword', 'Undead Sword', 'COMMON', 'SWORD', { color: '#dddddd', damage: 30, stats: { strength: 10 }, npcSell: 25, description: 'Deals +100% damage to Zombies, Skeletons, Zombie Pigmen and Withers.' }),
  silver_fang: skyblockItem('silver_fang', 'Silver Fang', 'UNCOMMON', 'SWORD', { color: '#eeeeee', damage: 100, stats: { strength: 10 }, npcSell: 200 }),
  aspect_of_the_end: skyblockItem('aspect_of_the_end', 'Aspect of the End', 'RARE', 'SWORD', { color: '#aa00aa', damage: 100, stats: { strength: 100 }, ability: { name: 'Instant Transmission', description: 'Teleport 8 blocks ahead and gain +50 Speed for 3 seconds.', manaCost: 50 } }),
  aspect_of_the_dragons: skyblockItem('aspect_of_the_dragons', 'Aspect of the Dragons', 'LEGENDARY', 'SWORD', { color: '#ffaa00', damage: 225, stats: { strength: 100 }, ability: { name: 'Dragon Rage', description: 'All monsters in front of you take 12,000 damage.', manaCost: 100, damage: 12000, scaling: 0.1 } }),
  livid_dagger: skyblockItem('livid_dagger', 'Livid Dagger', 'LEGENDARY', 'SWORD', { color: '#ffaa00', damage: 210, stats: { strength: 60, critChance: 100, critDamage: 50, attackSpeed: 100 } }),
  hyperion: skyblockItem('hyperion', 'Hyperion', 'LEGENDARY', 'SWORD', { color: '#ffaa00', damage: 260, stats: { strength: 150, intelligence: 350, ferocity: 30 }, ability: { name: 'Wither Impact', description: 'Teleport ahead, implode nearby enemies and gain a protective shield.', manaCost: 150, damage: 10000, scaling: 0.3 } }),
  shortbow: skyblockItem('shortbow', 'Artisanal Shortbow', 'RARE', 'BOW', { color: '#885522', damage: 40, stats: { strength: 10 }, npcSell: 200 }),
  diamond_pickaxe: skyblockItem('diamond_pickaxe', 'Diamond Pickaxe', 'UNCOMMON', 'PICKAXE', { color: '#55ffff', toolType: 'pickaxe', toolTier: 4, stats: { miningSpeed: 230 } }),
  mithril_pickaxe: skyblockItem('mithril_pickaxe', 'Mithril Pickaxe', 'RARE', 'PICKAXE', { color: '#55ffff', toolType: 'pickaxe', toolTier: 5, stats: { miningSpeed: 300 } }),
  jungle_axe: skyblockItem('jungle_axe', 'Jungle Axe', 'UNCOMMON', 'AXE', { color: '#55aa00', toolType: 'axe', toolTier: 3, ability: { name: 'Efficient Chopping', description: 'A powerful axe which can break multiple logs in a single hit.' } }),
  rookie_hoe: skyblockItem('rookie_hoe', 'Rookie Hoe', 'COMMON', 'HOE', { color: '#aa7733', toolType: 'hoe', toolTier: 2, stats: { farmingFortune: 10 } }),
  angler_helmet: skyblockItem('angler_helmet', 'Angler Helmet', 'COMMON', 'HELMET', { color: '#886633', stats: { health: 15, defense: 15, seaCreatureChance: 1 } }),
  angler_chestplate: skyblockItem('angler_chestplate', 'Angler Chestplate', 'COMMON', 'CHESTPLATE', { color: '#886633', stats: { health: 30, defense: 30, seaCreatureChance: 1 } }),
  angler_leggings: skyblockItem('angler_leggings', 'Angler Leggings', 'COMMON', 'LEGGINGS', { color: '#886633', stats: { health: 25, defense: 25, seaCreatureChance: 1 } }),
  angler_boots: skyblockItem('angler_boots', 'Angler Boots', 'COMMON', 'BOOTS', { color: '#886633', stats: { health: 10, defense: 10, seaCreatureChance: 1 } }),
  strong_dragon_helmet: skyblockItem('strong_dragon_helmet', 'Strong Dragon Helmet', 'LEGENDARY', 'HELMET', { color: '#ffaa00', stats: { health: 70, defense: 110, strength: 25 } }),
  strong_dragon_chestplate: skyblockItem('strong_dragon_chestplate', 'Strong Dragon Chestplate', 'LEGENDARY', 'CHESTPLATE', { color: '#ffaa00', stats: { health: 120, defense: 160, strength: 25 } }),
  strong_dragon_leggings: skyblockItem('strong_dragon_leggings', 'Strong Dragon Leggings', 'LEGENDARY', 'LEGGINGS', { color: '#ffaa00', stats: { health: 100, defense: 140, strength: 25 } }),
  strong_dragon_boots: skyblockItem('strong_dragon_boots', 'Strong Dragon Boots', 'LEGENDARY', 'BOOTS', { color: '#ffaa00', stats: { health: 60, defense: 90, strength: 25 } }),
  speed_talisman: skyblockItem('speed_talisman', 'Speed Talisman', 'COMMON', 'ACCESSORY', { color: '#ffffff', stats: { speed: 1 }, description: 'Keep in your Accessory Bag for a small stat bonus.' }),
  vaccine_talisman: skyblockItem('vaccine_talisman', 'Vaccine Talisman', 'COMMON', 'ACCESSORY', { color: '#55aa55', stats: { health: 5 } }),
  intimidation_talisman: skyblockItem('intimidation_talisman', 'Intimidation Talisman', 'COMMON', 'ACCESSORY', { color: '#aaaaaa', stats: { defense: 5 } }),
  feather_talisman: skyblockItem('feather_talisman', 'Feather Talisman', 'UNCOMMON', 'ACCESSORY', { color: '#ffffff', stats: { speed: 3 } }),
  wolf_pet: skyblockItem('wolf_pet', '[Lvl 1] Wolf', 'LEGENDARY', 'PET', { color: '#aaaaaa', stats: { health: 10, speed: 5, critDamage: 10 }, description: 'Combat Pet. Gains experience from Combat.' }),
  elephant_pet: skyblockItem('elephant_pet', '[Lvl 1] Elephant', 'LEGENDARY', 'PET', { color: '#aaaaaa', stats: { health: 20, farmingFortune: 15 }, description: 'Farming Pet. Gains experience from Farming.' }),
  mining_xp_boost: skyblockItem('mining_xp_boost', 'Mining Exp Boost', 'RARE', 'CONSUMABLE', { color: '#55aaff', bazaarable: true, description: 'Consumed by pets to improve Mining experience.' }),
  compactor: skyblockItem('compactor', 'Compactor', 'UNCOMMON', 'MATERIAL', { color: '#888888', bazaarable: true, description: 'Minion Upgrade. Compacts items into their block form.' }),
  super_compactor: skyblockItem('super_compactor', 'Super Compactor 3000', 'RARE', 'MATERIAL', { color: '#55aaff', bazaarable: true, description: 'Minion Upgrade. Compacts resources into their enchanted form.' }),
  diamond_spreading: skyblockItem('diamond_spreading', 'Diamond Spreading', 'RARE', 'MATERIAL', { color: '#55ffff', bazaarable: true, description: 'Minion Upgrade. Occasionally generates Diamonds.' }),
  enchanted_coal_fuel: skyblockItem('enchanted_coal_fuel', 'Enchanted Coal', 'UNCOMMON', 'MATERIAL', { color: '#222222', bazaarable: true, description: 'Minion Fuel. Increases minion speed by 10% for 24 hours.' }),
});

const ENCHANTED_VARIANTS: Array<[string, string, string]> = [
  ['emerald', 'Emerald', '#00aa55'], ['gold_ingot', 'Gold', '#ffaa00'], ['lapis', 'Lapis Lazuli', '#5555ff'],
  ['potato', 'Potato', '#d6b35a'], ['carrot', 'Carrot', '#ff8800'], ['pumpkin', 'Pumpkin', '#ffaa00'],
  ['melon', 'Melon', '#55ff55'], ['sugar_cane', 'Sugar', '#aaffaa'], ['cactus', 'Cactus Green', '#00aa00'],
  ['cocoa_beans', 'Cocoa Beans', '#885522'], ['mushroom', 'Mushroom', '#aa3333'], ['spider_eye', 'Spider Eye', '#aa0000'],
  ['bone', 'Bone', '#eeeeee'], ['ender_pearl', 'Ender Pearl', '#00aaaa'], ['blaze_rod', 'Blaze Rod', '#ffaa00'],
  ['jungle_log', 'Jungle Wood', '#aa7733'], ['dark_oak_log', 'Dark Oak Wood', '#553311'], ['raw_fish', 'Raw Fish', '#55aaff'],
];
for (const [baseId, name, color] of ENCHANTED_VARIANTS) {
  const id = `enchanted_${baseId}`;
  if (!ITEMS[id]) ITEMS[id] = skyblockItem(id, `Enchanted ${name}`, 'UNCOMMON', 'MATERIAL', { color, npcSell: 320 });
}

Object.assign(ITEMS, {
  raiders_axe: skyblockItem('raiders_axe', "Raider Axe", 'RARE', 'SWORD', { damage: 80, stats: { strength: 50 }, description: 'Earn bonus coins while defeating enemies.' }),
  leaping_sword: skyblockItem('leaping_sword', 'Leaping Sword', 'EPIC', 'SWORD', { damage: 150, stats: { strength: 100, critDamage: 25 }, ability: { name: 'Leap', description: 'Leap into the air and damage nearby enemies.', manaCost: 50, damage: 350, scaling: 0.2 } }),
  flower_of_truth: skyblockItem('flower_of_truth', 'Flower of Truth', 'LEGENDARY', 'SWORD', { damage: 160, stats: { strength: 300 }, ability: { name: 'Heat-Seeking Rose', description: 'Fires a rose which ricochets between enemies.', manaCost: 25, damage: 500, scaling: 0.2 } }),
  shadow_fury: skyblockItem('shadow_fury', 'Shadow Fury', 'LEGENDARY', 'SWORD', { damage: 300, stats: { strength: 125, critDamage: 30 }, ability: { name: 'Shadow Fury', description: 'Rapidly teleport behind nearby enemies.', cooldownSec: 15 } }),
  giant_sword: skyblockItem('giant_sword', "Giant's Sword", 'LEGENDARY', 'SWORD', { damage: 500, stats: { strength: 25 }, ability: { name: 'Giant Slam', description: 'Slam the ground for massive damage.', manaCost: 100, cooldownSec: 30, damage: 100000, scaling: 0.05 } }),
  terminator: skyblockItem('terminator', 'Terminator', 'MYTHIC', 'BOW', { damage: 310, stats: { strength: 50, critDamage: 250, attackSpeed: 40 }, ability: { name: 'Salvation', description: 'Fire three arrows at once and charge a powerful beam.' } }),
  juju_shortbow: skyblockItem('juju_shortbow', 'Juju Shortbow', 'LEGENDARY', 'BOW', { damage: 310, stats: { strength: 40, critDamage: 110 } }),
  runaans_bow: skyblockItem('runaans_bow', "Runaan's Bow", 'LEGENDARY', 'BOW', { damage: 160, stats: { strength: 50 }, ability: { name: 'Triple Shot', description: 'Shoots three arrows at a time.' } }),
  bonzo_staff: skyblockItem('bonzo_staff', "Bonzo's Staff", 'RARE', 'SWORD', { damage: 160, stats: { intelligence: 250 }, ability: { name: 'Showtime', description: 'Shoots a balloon that explodes on impact.', manaCost: 100, damage: 1000, scaling: 0.2 } }),
  spirit_sceptre: skyblockItem('spirit_sceptre', 'Spirit Sceptre', 'LEGENDARY', 'SWORD', { damage: 180, stats: { intelligence: 300 }, ability: { name: 'Guided Bat', description: 'Shoots a guided explosive bat.', manaCost: 200, damage: 2000, scaling: 0.2 } }),
  stonk: skyblockItem('stonk', 'Stonk', 'EPIC', 'PICKAXE', { toolType: 'pickaxe', toolTier: 4, stats: { miningSpeed: 510 }, description: 'A fast golden pickaxe.' }),
  gemstone_gauntlet: skyblockItem('gemstone_gauntlet', 'Gemstone Gauntlet', 'LEGENDARY', 'PICKAXE', { toolType: 'pickaxe', toolTier: 6, damage: 200, stats: { strength: 100, miningSpeed: 1600 } }),
  treecapitator: skyblockItem('treecapitator', 'Treecapitator', 'EPIC', 'AXE', { toolType: 'axe', toolTier: 5, stats: { foragingFortune: 50 }, ability: { name: 'Deforestation', description: 'Break a large number of connected logs.' } }),
  melon_dicer: skyblockItem('melon_dicer', 'Melon Dicer', 'EPIC', 'AXE', { toolType: 'axe', toolTier: 4, stats: { farmingFortune: 50 }, description: 'Specialized tool for farming melons.' }),
  mathematical_hoe: skyblockItem('mathematical_hoe', 'Mathematical Hoe Blueprint', 'EPIC', 'HOE', { toolType: 'hoe', toolTier: 4, stats: { farmingFortune: 50 } }),
  rod_of_legends: skyblockItem('rod_of_legends', 'Rod of Legends', 'LEGENDARY', 'FISHING_ROD', { toolType: 'rod', toolTier: 5, stats: { seaCreatureChance: 6 } }),
  shark_scale_helmet: skyblockItem('shark_scale_helmet', 'Shark Scale Helmet', 'LEGENDARY', 'HELMET', { stats: { health: 100, defense: 100, seaCreatureChance: 2.5 } }),
  shark_scale_chestplate: skyblockItem('shark_scale_chestplate', 'Shark Scale Chestplate', 'LEGENDARY', 'CHESTPLATE', { stats: { health: 180, defense: 180, seaCreatureChance: 2.5 } }),
  shark_scale_leggings: skyblockItem('shark_scale_leggings', 'Shark Scale Leggings', 'LEGENDARY', 'LEGGINGS', { stats: { health: 150, defense: 150, seaCreatureChance: 2.5 } }),
  shark_scale_boots: skyblockItem('shark_scale_boots', 'Shark Scale Boots', 'LEGENDARY', 'BOOTS', { stats: { health: 80, defense: 80, seaCreatureChance: 2.5 } }),
  shadow_assassin_helmet: skyblockItem('shadow_assassin_helmet', 'Shadow Assassin Helmet', 'LEGENDARY', 'HELMET', { stats: { health: 100, defense: 75, strength: 25, critDamage: 25 } }),
  shadow_assassin_chestplate: skyblockItem('shadow_assassin_chestplate', 'Shadow Assassin Chestplate', 'LEGENDARY', 'CHESTPLATE', { stats: { health: 150, defense: 110, strength: 25, critDamage: 25 } }),
  shadow_assassin_leggings: skyblockItem('shadow_assassin_leggings', 'Shadow Assassin Leggings', 'LEGENDARY', 'LEGGINGS', { stats: { health: 125, defense: 95, strength: 25, critDamage: 25 } }),
  shadow_assassin_boots: skyblockItem('shadow_assassin_boots', 'Shadow Assassin Boots', 'LEGENDARY', 'BOOTS', { stats: { health: 75, defense: 60, strength: 25, critDamage: 25 } }),
  necron_helmet: skyblockItem('necron_helmet', "Necron's Helmet", 'LEGENDARY', 'HELMET', { stats: { health: 140, defense: 100, strength: 40, critDamage: 30 } }),
  necron_chestplate: skyblockItem('necron_chestplate', "Necron's Chestplate", 'LEGENDARY', 'CHESTPLATE', { stats: { health: 260, defense: 160, strength: 40, critDamage: 30 } }),
  necron_leggings: skyblockItem('necron_leggings', "Necron's Leggings", 'LEGENDARY', 'LEGGINGS', { stats: { health: 220, defense: 140, strength: 40, critDamage: 30 } }),
  necron_boots: skyblockItem('necron_boots', "Necron's Boots", 'LEGENDARY', 'BOOTS', { stats: { health: 120, defense: 80, strength: 40, critDamage: 30 } }),
  storm_helmet: skyblockItem('storm_helmet', "Storm's Helmet", 'LEGENDARY', 'HELMET', { stats: { health: 140, defense: 80, intelligence: 250 } }),
  storm_chestplate: skyblockItem('storm_chestplate', "Storm's Chestplate", 'LEGENDARY', 'CHESTPLATE', { stats: { health: 260, defense: 120, intelligence: 250 } }),
  storm_leggings: skyblockItem('storm_leggings', "Storm's Leggings", 'LEGENDARY', 'LEGGINGS', { stats: { health: 220, defense: 100, intelligence: 250 } }),
  storm_boots: skyblockItem('storm_boots', "Storm's Boots", 'LEGENDARY', 'BOOTS', { stats: { health: 120, defense: 60, intelligence: 250 } }),
  zombie_talisman: skyblockItem('zombie_talisman', 'Zombie Talisman', 'COMMON', 'ACCESSORY', { stats: { health: 5 } }),
  bat_talisman: skyblockItem('bat_talisman', 'Bat Talisman', 'RARE', 'ACCESSORY', { stats: { speed: 3 } }),
  personal_compactor: skyblockItem('personal_compactor', 'Personal Compactor 4000', 'UNCOMMON', 'ACCESSORY', { stats: { defense: 3 }, description: 'Automatically compacts selected materials.' }),
  melodys_hair: skyblockItem('melodys_hair', "Melody's Hair", 'EPIC', 'ACCESSORY', { stats: { intelligence: 26 } }),
  intimidation_artifact: skyblockItem('intimidation_artifact', 'Intimidation Artifact', 'RARE', 'ACCESSORY', { stats: { defense: 10 } }),
  ender_artifact: skyblockItem('ender_artifact', 'Ender Artifact', 'EPIC', 'ACCESSORY', { stats: { health: 15, intelligence: 20 } }),
  legendary_talisman: skyblockItem('legendary_talisman', 'Legendary Talisman', 'LEGENDARY', 'ACCESSORY', { stats: { strength: 8, critDamage: 8 } }),
  tiger_pet: skyblockItem('tiger_pet', '[Lvl 1] Tiger', 'LEGENDARY', 'PET', { stats: { strength: 15, critDamage: 10, ferocity: 5 }, description: 'Combat Pet. Excels at repeated strikes.' }),
  sheep_pet: skyblockItem('sheep_pet', '[Lvl 1] Sheep', 'LEGENDARY', 'PET', { stats: { intelligence: 100 }, description: 'Alchemy Pet. Reduces ability mana costs.' }),
  silverfish_pet: skyblockItem('silverfish_pet', '[Lvl 1] Silverfish', 'LEGENDARY', 'PET', { stats: { defense: 20, miningSpeed: 50 }, description: 'Mining Pet. Grants haste and mining experience.' }),
  monkey_pet: skyblockItem('monkey_pet', '[Lvl 1] Monkey', 'LEGENDARY', 'PET', { stats: { speed: 10, foragingFortune: 20 }, description: 'Foraging Pet. Improves tree harvesting.' }),
  ammonite_pet: skyblockItem('ammonite_pet', '[Lvl 1] Ammonite', 'LEGENDARY', 'PET', { stats: { defense: 20, seaCreatureChance: 5 }, description: 'Fishing Pet. Scales with Mining and Fishing.' }),
  griffin_pet: skyblockItem('griffin_pet', '[Lvl 1] Griffin', 'LEGENDARY', 'PET', { stats: { strength: 10, critChance: 5, critDamage: 10, magicFind: 5 }, description: 'Combat Pet. Finds Mythological creatures.' }),
});

const RARITY_NPC_SELL: Record<ItemRarity, number> = {
  COMMON: 1,
  UNCOMMON: 8,
  RARE: 40,
  EPIC: 200,
  LEGENDARY: 1000,
  MYTHIC: 5000,
  DIVINE: 15000,
  SPECIAL: 25,
  VERY_SPECIAL: 25,
};

const EQUIP_TYPES = new Set<ItemType>([
  'SWORD', 'BOW', 'PICKAXE', 'DRILL', 'AXE', 'HOE', 'FISHING_ROD',
  'HELMET', 'CHESTPLATE', 'LEGGINGS', 'BOOTS',
]);

/** Coins an NPC pays when buying this item from the player. */
export function npcSellPrice(itemId: ItemId): number | null {
  const def = ITEMS[itemId];
  if (!def) return null;
  if (def.npcSell != null && def.npcSell > 0) return def.npcSell;
  if (def.rarity) return RARITY_NPC_SELL[def.rarity];
  if (def.type === 'MINION') return 100;
  if (def.type === 'ACCESSORY') return 50;
  if (def.type && EQUIP_TYPES.has(def.type)) return Math.max(5, (def.damage ?? 10) * 2);
  if (def.type === 'CONSUMABLE') return def.heal ? 3 : 1;
  if (def.category === 'resource' || def.type === 'MATERIAL') return 1;
  return 1;
}

/** All bazaar-tradeable item ids — call refreshBazaarItems() after adding items. */
export let BAZAAR_ITEMS: ItemId[] = [];

export function refreshBazaarItems(): void {
  BAZAAR_ITEMS.splice(
    0,
    BAZAAR_ITEMS.length,
    ...Object.values(ITEMS).filter((i) => i.bazaarable).map((i) => i.id),
  );
}

refreshBazaarItems();
