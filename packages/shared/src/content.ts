import type { ItemId, ItemRarity, ItemType } from './items.js';
import type { SkillId } from './skills.js';
import type { StatBlock } from './stats.js';

export interface ReforgeDef {
  id: string;
  name: string;
  appliesTo: 'weapon' | 'armor' | 'accessory' | 'tool';
  statsByRarity: Partial<Record<ItemRarity, Partial<StatBlock>>>;
}

const scaled = (key: keyof StatBlock, values: number[]): ReforgeDef['statsByRarity'] => {
  const rarities: ItemRarity[] = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'];
  return Object.fromEntries(rarities.map((rarity, i) => [rarity, { [key]: values[i] ?? values.at(-1)! }]));
};

export const REFORGES: ReforgeDef[] = [
  { id: 'spicy', name: 'Spicy', appliesTo: 'weapon', statsByRarity: scaled('critDamage', [5, 7, 10, 15, 20, 25]) },
  { id: 'sharp', name: 'Sharp', appliesTo: 'weapon', statsByRarity: scaled('critChance', [10, 12, 14, 17, 20, 25]) },
  { id: 'heroic', name: 'Heroic', appliesTo: 'weapon', statsByRarity: scaled('intelligence', [40, 50, 65, 80, 100, 125]) },
  { id: 'fierce', name: 'Fierce', appliesTo: 'armor', statsByRarity: scaled('strength', [2, 3, 4, 7, 10, 14]) },
  { id: 'pure', name: 'Pure', appliesTo: 'armor', statsByRarity: scaled('critChance', [2, 3, 4, 6, 8, 10]) },
  { id: 'wise', name: 'Wise', appliesTo: 'armor', statsByRarity: scaled('intelligence', [25, 35, 50, 65, 80, 100]) },
  { id: 'titanic', name: 'Titanic', appliesTo: 'armor', statsByRarity: scaled('health', [10, 15, 20, 30, 40, 50]) },
  { id: 'itchy', name: 'Itchy', appliesTo: 'accessory', statsByRarity: scaled('critDamage', [1, 2, 3, 5, 8, 12]) },
  { id: 'bizarre', name: 'Bizarre', appliesTo: 'accessory', statsByRarity: scaled('intelligence', [3, 5, 8, 12, 18, 25]) },
  { id: 'fleet', name: 'Fleet', appliesTo: 'tool', statsByRarity: scaled('miningSpeed', [20, 35, 50, 70, 100, 130]) },
];

export interface DropDef {
  itemId: ItemId;
  chance: number;
  min: number;
  max: number;
}

export interface MobDef {
  id: string;
  name: string;
  level: number;
  health: number;
  damage: number;
  defense: number;
  combatXp: number;
  coins: number;
  drops: DropDef[];
}

export const MOBS: Record<string, MobDef> = {
  zombie: { id: 'zombie', name: 'Zombie', level: 1, health: 100, damage: 20, defense: 0, combatXp: 6, coins: 2, drops: [{ itemId: 'rotten_flesh', chance: 1, min: 1, max: 2 }] },
  graveyard_zombie: { id: 'graveyard_zombie', name: 'Graveyard Zombie', level: 10, health: 240, damage: 35, defense: 5, combatXp: 12, coins: 4, drops: [{ itemId: 'rotten_flesh', chance: 1, min: 1, max: 3 }] },
  spider: { id: 'spider', name: 'Spider', level: 2, health: 120, damage: 22, defense: 0, combatXp: 7, coins: 2, drops: [{ itemId: 'string', chance: 1, min: 1, max: 2 }, { itemId: 'spider_eye', chance: 0.5, min: 1, max: 1 }] },
  dasher_spider: { id: 'dasher_spider', name: 'Dasher Spider', level: 42, health: 900, damage: 95, defense: 15, combatXp: 30, coins: 10, drops: [{ itemId: 'string', chance: 1, min: 2, max: 5 }] },
  lapis_zombie: { id: 'lapis_zombie', name: 'Lapis Zombie', level: 7, health: 200, damage: 30, defense: 5, combatXp: 12, coins: 5, drops: [{ itemId: 'rotten_flesh', chance: 1, min: 1, max: 2 }, { itemId: 'lapis', chance: 0.75, min: 1, max: 3 }] },
  enderman: { id: 'enderman', name: 'Enderman', level: 42, health: 4500, damage: 350, defense: 50, combatXp: 40, coins: 15, drops: [{ itemId: 'ender_pearl', chance: 1, min: 1, max: 3 }] },
  zealot: {
    id: 'zealot',
    name: 'Zealot',
    level: 55,
    health: 13000,
    damage: 1250,
    defense: 100,
    combatXp: 60,
    coins: 20,
    drops: [
      { itemId: 'ender_pearl', chance: 1, min: 2, max: 4 },
      { itemId: 'summoning_eye', chance: 0.025, min: 1, max: 1 },
      { itemId: 'dragon_fragment', chance: 0.01, min: 1, max: 1 },
    ],
  },
  magma_cube: { id: 'magma_cube', name: 'Magma Cube', level: 80, health: 20000, damage: 1800, defense: 150, combatXp: 85, coins: 35, drops: [{ itemId: 'blaze_rod', chance: 0.35, min: 1, max: 2 }] },
  wolf: { id: 'wolf', name: 'Wolf', level: 15, health: 250, damage: 40, defense: 5, combatXp: 15, coins: 5, drops: [{ itemId: 'bone', chance: 1, min: 1, max: 2 }, { itemId: 'mutton', chance: 0.4, min: 1, max: 1 }] },
  rift_mite: { id: 'rift_mite', name: 'Rift Mite', level: 30, health: 800, damage: 80, defense: 10, combatXp: 22, coins: 8, drops: [{ itemId: 'ender_pearl', chance: 0.4, min: 1, max: 1 }] },
  ender_dragon: { id: 'ender_dragon', name: 'Ender Dragon', level: 100, health: 9000000, damage: 2000, defense: 200, combatXp: 300, coins: 1000, drops: [{ itemId: 'dragon_fragment', chance: 1, min: 2, max: 5 }, { itemId: 'summoning_eye', chance: 0.15, min: 1, max: 1 }] },
  kuudra: { id: 'kuudra', name: 'Kuudra', level: 100, health: 5000000, damage: 2500, defense: 250, combatXp: 400, coins: 2500, drops: [{ itemId: 'blaze_rod', chance: 1, min: 4, max: 8 }] },
};

export interface ResourceNodeDef {
  id: string;
  name: string;
  itemId: ItemId;
  skill: SkillId;
  xp: number;
  hardness: number;
  baseDrops: number;
}

export const RESOURCE_NODES: Record<string, ResourceNodeDef> = {
  cobblestone: { id: 'cobblestone', name: 'Cobblestone', itemId: 'cobble', skill: 'mining', xp: 1, hardness: 100, baseDrops: 1 },
  coal_ore: { id: 'coal_ore', name: 'Coal Ore', itemId: 'coal', skill: 'mining', xp: 5, hardness: 120, baseDrops: 1 },
  iron_ore: { id: 'iron_ore', name: 'Iron Ore', itemId: 'iron_ore', skill: 'mining', xp: 6, hardness: 150, baseDrops: 1 },
  gold_ore: { id: 'gold_ore', name: 'Gold Ore', itemId: 'gold_ingot', skill: 'mining', xp: 6, hardness: 180, baseDrops: 1 },
  diamond_ore: { id: 'diamond_ore', name: 'Diamond Ore', itemId: 'diamond', skill: 'mining', xp: 8, hardness: 250, baseDrops: 1 },
  emerald_ore: { id: 'emerald_ore', name: 'Emerald Ore', itemId: 'emerald', skill: 'mining', xp: 9, hardness: 300, baseDrops: 1 },
  wheat_crop: { id: 'wheat_crop', name: 'Wheat', itemId: 'wheat', skill: 'farming', xp: 1, hardness: 100, baseDrops: 1 },
  carrot_crop: { id: 'carrot_crop', name: 'Carrot', itemId: 'carrot', skill: 'farming', xp: 1, hardness: 100, baseDrops: 1 },
  potato_crop: { id: 'potato_crop', name: 'Potato', itemId: 'potato', skill: 'farming', xp: 1, hardness: 100, baseDrops: 1 },
  oak_tree: { id: 'oak_tree', name: 'Oak Tree', itemId: 'oak_log', skill: 'foraging', xp: 6, hardness: 150, baseDrops: 1 },
  jungle_tree: { id: 'jungle_tree', name: 'Jungle Tree', itemId: 'jungle_log', skill: 'foraging', xp: 7, hardness: 180, baseDrops: 1 },
};

export interface SlayerDef {
  id: string;
  name: string;
  targetMob: string;
  tiers: Array<{ tier: number; health: number; damage: number; cost: number; xp: number }>;
}

export const SLAYERS: SlayerDef[] = [
  { id: 'revenant', name: 'Revenant Horror', targetMob: 'zombie', tiers: [{ tier: 1, health: 500, damage: 15, cost: 100, xp: 5 }, { tier: 2, health: 20000, damage: 60, cost: 2000, xp: 25 }, { tier: 3, health: 400000, damage: 300, cost: 10000, xp: 100 }, { tier: 4, health: 1500000, damage: 1200, cost: 50000, xp: 500 }, { tier: 5, health: 10000000, damage: 2400, cost: 100000, xp: 1500 }] },
  { id: 'tarantula', name: 'Tarantula Broodfather', targetMob: 'spider', tiers: [{ tier: 1, health: 750, damage: 20, cost: 100, xp: 5 }, { tier: 2, health: 30000, damage: 70, cost: 2000, xp: 25 }, { tier: 3, health: 900000, damage: 400, cost: 10000, xp: 100 }, { tier: 4, health: 2400000, damage: 1500, cost: 50000, xp: 500 }, { tier: 5, health: 16000000, damage: 3000, cost: 100000, xp: 1500 }] },
  { id: 'sven', name: 'Sven Packmaster', targetMob: 'wolf', tiers: [{ tier: 1, health: 2000, damage: 35, cost: 100, xp: 5 }, { tier: 2, health: 40000, damage: 90, cost: 2000, xp: 25 }, { tier: 3, health: 750000, damage: 450, cost: 10000, xp: 100 }, { tier: 4, health: 2000000, damage: 1700, cost: 50000, xp: 500 }, { tier: 5, health: 18000000, damage: 3300, cost: 100000, xp: 1500 }] },
  { id: 'voidgloom', name: 'Voidgloom Seraph', targetMob: 'enderman', tiers: [{ tier: 1, health: 300000, damage: 500, cost: 2000, xp: 5 }, { tier: 2, health: 12000000, damage: 2500, cost: 7500, xp: 25 }, { tier: 3, health: 50000000, damage: 5000, cost: 20000, xp: 100 }, { tier: 4, health: 210000000, damage: 9000, cost: 50000, xp: 500 }, { tier: 5, health: 500000000, damage: 15000, cost: 100000, xp: 1500 }] },
  { id: 'inferno', name: 'Inferno Demonlord', targetMob: 'magma_cube', tiers: [{ tier: 1, health: 2500000, damage: 1200, cost: 10000, xp: 5 }, { tier: 2, health: 15000000, damage: 3500, cost: 25000, xp: 25 }, { tier: 3, health: 80000000, damage: 7500, cost: 50000, xp: 100 }, { tier: 4, health: 250000000, damage: 14000, cost: 100000, xp: 500 }, { tier: 5, health: 600000000, damage: 22000, cost: 200000, xp: 1500 }] },
];

export type { DungeonFloorDef, DungeonDrop } from './dungeonContent.js';
export { DUNGEON_FLOORS, dungeonFloor, regularFloors, masterFloors } from './dungeonContent.js';
