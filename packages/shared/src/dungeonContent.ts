import type { ItemId } from './items.js';
import type { DropDef, MobDef } from './content.js';

export interface DungeonDrop {
  itemId: ItemId;
  chance: number;
  min: number;
  max: number;
}

export interface DungeonFloorDef {
  id: string;
  name: string;
  shortName: string;
  master: boolean;
  requiredLevel: number;
  rooms: number;
  boss: MobDef;
  baseCatacombsXp: number;
  coinReward: number;
  drops: DungeonDrop[];
}

function boss(
  id: string,
  name: string,
  level: number,
  health: number,
  damage: number,
  defense: number,
): MobDef {
  return { id, name, level, health, damage, defense, combatXp: level * 5, coins: 0, drops: [] };
}

/** Catacombs F1–F7 and Master M1–M7 (Hypixel SkyBlock progression). */
export const DUNGEON_FLOORS: DungeonFloorDef[] = [
  {
    id: 'f1', name: 'The Entrance — Bonzo', shortName: 'Floor I', master: false, requiredLevel: 0, rooms: 5,
    baseCatacombsXp: 150, coinReward: 500,
    boss: boss('bonzo', 'Bonzo', 100, 250_000, 300, 100),
    drops: [
      { itemId: 'bonzo_staff', chance: 0.08, min: 1, max: 1 },
      { itemId: 'balloon_snake', chance: 0.15, min: 1, max: 3 },
      { itemId: 'red_nose', chance: 0.05, min: 1, max: 1 },
    ],
  },
  {
    id: 'f2', name: 'Floor II — Scarf', shortName: 'Floor II', master: false, requiredLevel: 3, rooms: 7,
    baseCatacombsXp: 350, coinReward: 1500,
    boss: boss('scarf', 'Scarf', 150, 1_200_000, 650, 200),
    drops: [
      { itemId: 'adaptive_helmet', chance: 0.06, min: 1, max: 1 },
      { itemId: 'adaptive_chestplate', chance: 0.06, min: 1, max: 1 },
      { itemId: 'adaptive_leggings', chance: 0.06, min: 1, max: 1 },
      { itemId: 'adaptive_boots', chance: 0.06, min: 1, max: 1 },
      { itemId: 'scarf_studies', chance: 0.12, min: 1, max: 2 },
    ],
  },
  {
    id: 'f3', name: 'Floor III — The Professor', shortName: 'Floor III', master: false, requiredLevel: 5, rooms: 9,
    baseCatacombsXp: 700, coinReward: 3000,
    boss: boss('professor', 'The Professor', 200, 3_500_000, 1000, 350),
    drops: [
      { itemId: 'spirit_sceptre', chance: 0.05, min: 1, max: 1 },
      { itemId: 'golem_sword', chance: 0.08, min: 1, max: 1 },
      { itemId: 'golem_helmet', chance: 0.07, min: 1, max: 1 },
      { itemId: 'guardian_chestplate', chance: 0.07, min: 1, max: 1 },
    ],
  },
  {
    id: 'f4', name: 'Floor IV — Thorn', shortName: 'Floor IV', master: false, requiredLevel: 10, rooms: 10,
    baseCatacombsXp: 1200, coinReward: 5000,
    boss: boss('thorn', 'Thorn', 250, 8_000_000, 1500, 500),
    drops: [
      { itemId: 'thorn_bow', chance: 0.06, min: 1, max: 1 },
      { itemId: 'spirit_sceptre', chance: 0.04, min: 1, max: 1 },
      { itemId: 'spirit_boots', chance: 0.07, min: 1, max: 1 },
      { itemId: 'spirit_wing', chance: 0.1, min: 1, max: 2 },
    ],
  },
  {
    id: 'f5', name: 'Floor V — Livid', shortName: 'Floor V', master: false, requiredLevel: 14, rooms: 11,
    baseCatacombsXp: 2000, coinReward: 8000,
    boss: boss('livid', 'Livid', 300, 18_000_000, 2200, 700),
    drops: [
      { itemId: 'livid_dagger', chance: 0.05, min: 1, max: 1 },
      { itemId: 'shadow_assassin_helmet', chance: 0.05, min: 1, max: 1 },
      { itemId: 'shadow_assassin_chestplate', chance: 0.05, min: 1, max: 1 },
      { itemId: 'shadow_assassin_leggings', chance: 0.05, min: 1, max: 1 },
      { itemId: 'shadow_assassin_boots', chance: 0.05, min: 1, max: 1 },
      { itemId: 'last_breath', chance: 0.08, min: 1, max: 1 },
    ],
  },
  {
    id: 'f6', name: 'Floor VI — Sadan', shortName: 'Floor VI', master: false, requiredLevel: 18, rooms: 12,
    baseCatacombsXp: 3500, coinReward: 15000,
    boss: boss('sadan', 'Sadan', 350, 45_000_000, 3500, 900),
    drops: [
      { itemId: 'giant_sword', chance: 0.04, min: 1, max: 1 },
      { itemId: 'necron_handle', chance: 0.08, min: 1, max: 1 },
      { itemId: 'dark_claymore', chance: 0.06, min: 1, max: 1 },
      { itemId: 'precursor_eye', chance: 0.07, min: 1, max: 1 },
    ],
  },
  {
    id: 'f7', name: 'Floor VII — Necron', shortName: 'Floor VII', master: false, requiredLevel: 22, rooms: 14,
    baseCatacombsXp: 6000, coinReward: 30000,
    boss: boss('necron', 'Maxor / Storm / Goldor / Necron', 400, 100_000_000, 5000, 1200),
    drops: [
      { itemId: 'wither_blood', chance: 0.25, min: 1, max: 3 },
      { itemId: 'wither_catalyst', chance: 0.15, min: 1, max: 2 },
      { itemId: 'necron_handle', chance: 0.12, min: 1, max: 1 },
      { itemId: 'necron_blade', chance: 0.03, min: 1, max: 1 },
      { itemId: 'necron_helmet', chance: 0.04, min: 1, max: 1 },
      { itemId: 'necron_chestplate', chance: 0.04, min: 1, max: 1 },
      { itemId: 'necron_leggings', chance: 0.04, min: 1, max: 1 },
      { itemId: 'necron_boots', chance: 0.04, min: 1, max: 1 },
      { itemId: 'storm_helmet', chance: 0.04, min: 1, max: 1 },
      { itemId: 'storm_chestplate', chance: 0.04, min: 1, max: 1 },
      { itemId: 'storm_leggings', chance: 0.04, min: 1, max: 1 },
      { itemId: 'storm_boots', chance: 0.04, min: 1, max: 1 },
      { itemId: 'dark_claymore', chance: 0.05, min: 1, max: 1 },
    ],
  },
  // Master Mode
  {
    id: 'm1', name: 'Master I — Bonzo', shortName: 'Master I', master: true, requiredLevel: 26, rooms: 6,
    baseCatacombsXp: 2500, coinReward: 2000,
    boss: boss('master_bonzo', 'Bonzo (Master)', 150, 800_000, 500, 200),
    drops: [{ itemId: 'bonzo_staff', chance: 0.12, min: 1, max: 1 }, { itemId: 'fuming_potato_book', chance: 0.1, min: 1, max: 1 }],
  },
  {
    id: 'm2', name: 'Master II — Scarf', shortName: 'Master II', master: true, requiredLevel: 28, rooms: 8,
    baseCatacombsXp: 4000, coinReward: 4000,
    boss: boss('master_scarf', 'Scarf (Master)', 200, 3_000_000, 900, 350),
    drops: [{ itemId: 'adaptive_chestplate', chance: 0.1, min: 1, max: 1 }, { itemId: 'fuming_potato_book', chance: 0.12, min: 1, max: 1 }],
  },
  {
    id: 'm3', name: 'Master III — The Professor', shortName: 'Master III', master: true, requiredLevel: 30, rooms: 10,
    baseCatacombsXp: 6500, coinReward: 7000,
    boss: boss('master_professor', 'The Professor (Master)', 250, 8_000_000, 1400, 500),
    drops: [{ itemId: 'spirit_sceptre', chance: 0.08, min: 1, max: 1 }, { itemId: 'fuming_potato_book', chance: 0.14, min: 1, max: 1 }],
  },
  {
    id: 'm4', name: 'Master IV — Thorn', shortName: 'Master IV', master: true, requiredLevel: 32, rooms: 11,
    baseCatacombsXp: 9000, coinReward: 12000,
    boss: boss('master_thorn', 'Thorn (Master)', 300, 18_000_000, 2000, 650),
    drops: [{ itemId: 'thorn_bow', chance: 0.1, min: 1, max: 1 }, { itemId: 'fuming_potato_book', chance: 0.15, min: 1, max: 1 }],
  },
  {
    id: 'm5', name: 'Master V — Livid', shortName: 'Master V', master: true, requiredLevel: 34, rooms: 12,
    baseCatacombsXp: 12000, coinReward: 18000,
    boss: boss('master_livid', 'Livid (Master)', 350, 40_000_000, 2800, 850),
    drops: [{ itemId: 'livid_dagger', chance: 0.08, min: 1, max: 1 }, { itemId: 'shadow_assassin_chestplate', chance: 0.07, min: 1, max: 1 }],
  },
  {
    id: 'm6', name: 'Master VI — Sadan', shortName: 'Master VI', master: true, requiredLevel: 36, rooms: 13,
    baseCatacombsXp: 16000, coinReward: 25000,
    boss: boss('master_sadan', 'Sadan (Master)', 400, 90_000_000, 4200, 1100),
    drops: [{ itemId: 'giant_sword', chance: 0.07, min: 1, max: 1 }, { itemId: 'necron_handle', chance: 0.12, min: 1, max: 1 }],
  },
  {
    id: 'm7', name: 'Master VII — Necron', shortName: 'Master VII', master: true, requiredLevel: 38, rooms: 15,
    baseCatacombsXp: 25000, coinReward: 50000,
    boss: boss('master_necron', 'Necron (Master)', 450, 250_000_000, 7000, 1500),
    drops: [
      { itemId: 'wither_blood', chance: 0.4, min: 2, max: 5 },
      { itemId: 'wither_catalyst', chance: 0.25, min: 1, max: 3 },
      { itemId: 'necron_blade', chance: 0.06, min: 1, max: 1 },
      { itemId: 'hyperion', chance: 0.01, min: 1, max: 1 },
      { itemId: 'astrea', chance: 0.01, min: 1, max: 1 },
      { itemId: 'scylla', chance: 0.01, min: 1, max: 1 },
      { itemId: 'valkyrie', chance: 0.01, min: 1, max: 1 },
      { itemId: 'terminator', chance: 0.008, min: 1, max: 1 },
      { itemId: 'dark_claymore', chance: 0.05, min: 1, max: 1 },
    ],
  },
];

export function dungeonFloor(id: string): DungeonFloorDef | undefined {
  return DUNGEON_FLOORS.find((f) => f.id === id);
}

export function regularFloors(): DungeonFloorDef[] {
  return DUNGEON_FLOORS.filter((f) => !f.master);
}

export function masterFloors(): DungeonFloorDef[] {
  return DUNGEON_FLOORS.filter((f) => f.master);
}
