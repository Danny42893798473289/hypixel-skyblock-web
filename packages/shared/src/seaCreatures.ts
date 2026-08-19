import type { ItemId } from './items.js';
import type { DropDef } from './content.js';

export interface SeaCreatureDef {
  id: string;
  name: string;
  level: number;
  health: number;
  damage: number;
  defense: number;
  combatXp: number;
  coins: number;
  drops: DropDef[];
  /** Minimum fishing skill level to encounter in zone tier. */
  minFishing: number;
  weight: number;
}

/** Zone fishing spot id -> sea creature pool. */
export const FISH_ACTION_TO_POOL: Record<string, string> = {
  hub_fish: 'fish_hub',
  hub_fish_salmon: 'fish_hub',
  hub_fish_cod: 'fish_hub',
  hub_fish_clown: 'fish_hub',
  hub_fish_tropical: 'fish_hub',
  hub_fish_puffer: 'fish_hub',
  hub_fish_crystals: 'fish_hub',
  hub_fish_nautilus: 'fish_hub',
  hub_fish_glow: 'fish_hub',
  fish_pond: 'fish_hub',
  fish_lake: 'fish_lake',
  fish_spider: 'fish_spider',
  fish_crimson: 'fish_crimson',
  fish_rift: 'fish_hub',
};

export function seaCreaturePoolId(fishingSpotId: string): string {
  return FISH_ACTION_TO_POOL[fishingSpotId] ?? fishingSpotId;
}

export const SEA_CREATURE_ZONES: Record<string, SeaCreatureDef[]> = {
  fish_hub: [
    sc('squid', 'Squid', 1, 120, 20, 0, 8, 3, 0, 10, [{ itemId: 'raw_fish', chance: 1, min: 1, max: 2 }, { itemId: 'ink_sack', chance: 0.8, min: 1, max: 2 }]),
    sc('sea_walker', 'Sea Walker', 4, 400, 45, 5, 18, 8, 5, 10, [{ itemId: 'raw_fish', chance: 1, min: 2, max: 4 }, { itemId: 'lily_pad', chance: 0.3, min: 1, max: 1 }]),
  ],
  fish_spider: [
    sc('night_squid', 'Night Squid', 3, 300, 35, 0, 14, 6, 3, 8, [{ itemId: 'raw_fish', chance: 1, min: 2, max: 4 }, { itemId: 'ink_sac', chance: 1, min: 2, max: 4 }]),
    sc('sea_guardian', 'Sea Guardian', 10, 2500, 120, 25, 45, 25, 12, 6, [{ itemId: 'raw_fish', chance: 1, min: 3, max: 5 }, { itemId: 'prismarine_shard', chance: 1, min: 1, max: 3 }, { itemId: 'prismarine_crystals', chance: 0.4, min: 1, max: 2 }, { itemId: 'sponge', chance: 0.15, min: 1, max: 1 }]),
  ],
  fish_lake: [
    sc('catfish', 'Catfish', 6, 800, 60, 10, 22, 12, 8, 12, [{ itemId: 'raw_fish', chance: 1, min: 3, max: 6 }]),
    sc('yeti', 'Yeti', 15, 8000, 200, 40, 80, 50, 20, 4, [{ itemId: 'ice', chance: 1, min: 2, max: 5 }, { itemId: 'yeti_soul', chance: 0.08, min: 1, max: 1 }]),
  ],
  fish_crimson: [
    sc('magma_soul', 'Magma Soul', 20, 12000, 280, 60, 95, 60, 25, 5, [{ itemId: 'blaze_rod', chance: 1, min: 1, max: 2 }, { itemId: 'magma_cream', chance: 0.6, min: 1, max: 2 }]),
    sc('fire_eel', 'Fire Eel', 12, 5000, 150, 30, 55, 35, 18, 8, [{ itemId: 'raw_fish', chance: 1, min: 4, max: 8 }]),
  ],
};

function sc(
  id: string,
  name: string,
  level: number,
  health: number,
  damage: number,
  defense: number,
  combatXp: number,
  coins: number,
  minFishing: number,
  weight: number,
  drops: DropDef[],
): SeaCreatureDef {
  return { id, name, level, health, damage, defense, combatXp, coins, minFishing, weight, drops };
}

export function rollSeaCreature(
  fishingSpotId: string,
  fishingLevel: number,
  seaCreatureChance: number,
  luckOfTheSeaLevel: number,
): SeaCreatureDef | null {
  const pool = SEA_CREATURE_ZONES[seaCreaturePoolId(fishingSpotId)];
  if (!pool?.length) return null;
  const baseChance = 0.08 + seaCreatureChance / 100 + luckOfTheSeaLevel * 0.015;
  if (Math.random() > baseChance) return null;
  const eligible = pool.filter((c) => fishingLevel >= c.minFishing);
  if (!eligible.length) return null;
  const total = eligible.reduce((sum, c) => sum + c.weight, 0);
  let roll = Math.random() * total;
  for (const creature of eligible) {
    roll -= creature.weight;
    if (roll <= 0) return creature;
  }
  return eligible[eligible.length - 1]!;
}

export function seaCreatureToMob(creature: SeaCreatureDef) {
  return {
    id: creature.id,
    name: creature.name,
    level: creature.level,
    health: creature.health,
    damage: creature.damage,
    defense: creature.defense,
    combatXp: creature.combatXp,
    coins: creature.coins,
    drops: creature.drops,
  };
}

export const SEA_CREATURE_IDS = new Set(
  Object.values(SEA_CREATURE_ZONES).flatMap((pool) => pool.map((c) => c.id)),
);

export interface TrophyFishDef {
  id: string;
  name: string;
  pool: string;
  weight: number;
  tiers: ('bronze' | 'silver' | 'gold' | 'diamond')[];
}

export const TROPHY_FISH: TrophyFishDef[] = [
  { id: 'sulphur_skitter', name: 'Sulphur Skitter', pool: 'fish_crimson', weight: 15, tiers: ['bronze', 'silver', 'gold', 'diamond'] },
  { id: 'obfuscated_fish_1', name: 'Obfuscated 1', pool: 'fish_crimson', weight: 10, tiers: ['bronze', 'silver', 'gold', 'diamond'] },
  { id: 'steaming_hot_flounder', name: 'Steaming-Hot Flounder', pool: 'fish_crimson', weight: 8, tiers: ['bronze', 'silver', 'gold', 'diamond'] },
  { id: 'gusher', name: 'Gusher', pool: 'fish_crimson', weight: 5, tiers: ['bronze', 'silver', 'gold', 'diamond'] },
  { id: 'blobfish', name: 'Blobfish', pool: 'fish_crimson', weight: 4, tiers: ['bronze', 'silver', 'gold', 'diamond'] },
  { id: 'slugfish', name: 'Slugfish', pool: 'fish_crimson', weight: 3, tiers: ['bronze', 'silver', 'gold', 'diamond'] },
  { id: 'flyfish', name: 'Flyfish', pool: 'fish_crimson', weight: 2, tiers: ['bronze', 'silver', 'gold', 'diamond'] },
  { id: 'golden_fish', name: 'Golden Fish', pool: 'fish_crimson', weight: 1, tiers: ['bronze', 'silver', 'gold', 'diamond'] },
  { id: 'vanille', name: 'Vanille', pool: 'fish_hub', weight: 10, tiers: ['bronze', 'silver', 'gold', 'diamond'] },
  { id: 'skeleton_fish', name: 'Skeleton Fish', pool: 'fish_hub', weight: 6, tiers: ['bronze', 'silver', 'gold', 'diamond'] },
  { id: 'moldfin', name: 'Moldfin', pool: 'fish_spider', weight: 5, tiers: ['bronze', 'silver', 'gold', 'diamond'] },
  { id: 'soul_fish', name: 'Soul Fish', pool: 'fish_lake', weight: 4, tiers: ['bronze', 'silver', 'gold', 'diamond'] },
];

export const TROPHY_FISH_BY_ID: Record<string, TrophyFishDef> = Object.fromEntries(
  TROPHY_FISH.map((f) => [f.id, f]),
);

export function rollTrophyFish(pool: string, fishingLevel: number): { fish: TrophyFishDef; tier: string } | null {
  const eligible = TROPHY_FISH.filter((f) => f.pool === pool);
  if (!eligible.length) return null;
  const baseChance = 0.03 + fishingLevel * 0.002;
  if (Math.random() > baseChance) return null;
  const totalWeight = eligible.reduce((sum, f) => sum + f.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const fish of eligible) {
    roll -= fish.weight;
    if (roll <= 0) {
      const tierRoll = Math.random();
      const tier = tierRoll < 0.01 ? 'diamond' : tierRoll < 0.05 ? 'gold' : tierRoll < 0.2 ? 'silver' : 'bronze';
      return { fish, tier };
    }
  }
  return null;
}

export const FISHING_MINIBOSSES: SeaCreatureDef[] = [
  {
    id: 'thunder', name: 'Thunder', level: 30, health: 50000, damage: 500, defense: 100,
    combatXp: 250, coins: 5000,     drops: [{ itemId: 'enchanted_diamond', chance: 1, min: 2, max: 2 }],
    minFishing: 25, weight: 1,
  },
  {
    id: 'lord_jawbus', name: 'Lord Jawbus', level: 35, health: 100000, damage: 800, defense: 150,
    combatXp: 500, coins: 10000,     drops: [{ itemId: 'enchanted_diamond_block', chance: 0.5, min: 1, max: 1 }],
    minFishing: 30, weight: 1,
  },
  {
    id: 'plhlegblast', name: 'Plhlegblast', level: 25, health: 30000, damage: 400, defense: 80,
    combatXp: 200, coins: 3000,     drops: [{ itemId: 'enchanted_iron', chance: 1, min: 3, max: 3 }],
    minFishing: 20, weight: 1,
  },
];

export const FISHING_MINIBOSS_IDS = new Set(FISHING_MINIBOSSES.map((b) => b.id));

export function rollFishingMiniboss(fishingLevel: number, seaCreatureChance: number): SeaCreatureDef | null {
  const chance = 0.005 + seaCreatureChance / 500;
  if (Math.random() > chance) return null;
  const eligible = FISHING_MINIBOSSES.filter((b) => fishingLevel >= b.minFishing);
  if (!eligible.length) return null;
  return eligible[Math.floor(Math.random() * eligible.length)]!;
}

export interface FishingFestival {
  active: boolean;
  startTime: number;
  durationMs: number;
  seaCreatureBonus: number;
  xpMultiplier: number;
}

export function defaultFishingFestival(): FishingFestival {
  return { active: false, startTime: 0, durationMs: 60 * 60 * 1000, seaCreatureBonus: 0.15, xpMultiplier: 1.5 };
}
