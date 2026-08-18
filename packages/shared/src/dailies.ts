import type { ItemId } from './items.js';
import type { ItemStack } from './inventory.js';

export const DAY_MS = 86_400_000;

export function dayIndex(now = Date.now()): number {
  return Math.floor(now / DAY_MS);
}

export type DailyTaskKind = 'collect' | 'harvest' | 'kills' | 'slayer' | 'dungeon';

export interface DailyTaskDef {
  id: string;
  label: string;
  detail: string;
  kind: DailyTaskKind;
  target?: string;
  need: number;
  rewardCoins: number;
  rewardBits: number;
  rewardPowder?: number;
}

export interface DailyTask extends DailyTaskDef {
  have: number;
  claimed: boolean;
  baseline: number;
}

export interface DailyState {
  day: number;
  streak: number;
  claimedLogin: boolean;
  tasks: DailyTask[];
  slayerBosses: number;
  dungeonsCleared: number;
  fetchurClaimedDay: number;
}

export const DAILY_TASK_POOL: DailyTaskDef[] = [
  { id: 'mine_cobble', label: 'Cobble Miner', detail: 'Mine cobblestone.', kind: 'collect', target: 'cobble', need: 64, rewardCoins: 250, rewardBits: 15 },
  { id: 'mine_coal', label: 'Coal Collector', detail: 'Mine coal.', kind: 'collect', target: 'coal', need: 32, rewardCoins: 300, rewardBits: 18 },
  { id: 'mine_mithril', label: 'Mithril Sweep', detail: 'Mine mithril in the Dwarven Mines.', kind: 'collect', target: 'mithril', need: 20, rewardCoins: 500, rewardBits: 25, rewardPowder: 40 },
  { id: 'farm_wheat', label: 'Wheat Harvest', detail: 'Harvest wheat.', kind: 'collect', target: 'wheat', need: 40, rewardCoins: 200, rewardBits: 12 },
  { id: 'garden_crops', label: 'Garden Day', detail: 'Harvest any crops in the Garden.', kind: 'harvest', need: 24, rewardCoins: 400, rewardBits: 20 },
  { id: 'kill_zombies', label: 'Graveyard Duty', detail: 'Defeat zombies.', kind: 'kills', target: 'zombie', need: 15, rewardCoins: 350, rewardBits: 18 },
  { id: 'kill_spiders', label: 'Spider Sweep', detail: 'Defeat spiders.', kind: 'kills', target: 'spider', need: 12, rewardCoins: 350, rewardBits: 18 },
  { id: 'slayer_boss', label: 'Slayer Hunt', detail: 'Defeat any Slayer boss.', kind: 'slayer', need: 1, rewardCoins: 800, rewardBits: 40 },
  { id: 'dungeon_clear', label: 'Catacombs Run', detail: 'Clear any dungeon floor.', kind: 'dungeon', need: 1, rewardCoins: 1000, rewardBits: 50 },
  { id: 'forage_oak', label: 'Park Day', detail: 'Chop oak logs.', kind: 'collect', target: 'oak_log', need: 24, rewardCoins: 220, rewardBits: 14 },
];

export const LOGIN_REWARDS: Array<{ coins: number; bits: number; powder?: number; items?: ItemStack[] }> = [
  { coins: 500, bits: 10 },
  { coins: 750, bits: 20 },
  { coins: 1000, bits: 35 },
  { coins: 1500, bits: 50 },
  { coins: 2000, bits: 75, powder: 25 },
  { coins: 3000, bits: 100, powder: 50 },
  { coins: 5000, bits: 150, powder: 80, items: [{ itemId: 'enchanted_cobble', qty: 8 }] },
];

export function emptyDailies(now = Date.now()): DailyState {
  return {
    day: dayIndex(now),
    streak: 1,
    claimedLogin: false,
    tasks: rollDailyTasks(),
    slayerBosses: 0,
    dungeonsCleared: 0,
    fetchurClaimedDay: -1,
  };
}

export function rollDailyTasks(): DailyTask[] {
  const remaining = [...DAILY_TASK_POOL];
  const picked: DailyTask[] = [];
  while (picked.length < 4 && remaining.length) {
    const index = Math.floor(Math.random() * remaining.length);
    const def = remaining.splice(index, 1)[0]!;
    picked.push({ ...def, have: 0, claimed: false, baseline: 0 });
  }
  return picked;
}

export function loginRewardForStreak(streak: number): (typeof LOGIN_REWARDS)[number] {
  const index = ((Math.max(1, streak) - 1) % LOGIN_REWARDS.length);
  return LOGIN_REWARDS[index] ?? LOGIN_REWARDS[0]!;
}

export const FETCHUR_POOL: ItemId[] = [
  'cobble', 'coal', 'iron_ingot', 'wheat', 'oak_log', 'redstone', 'diamond', 'raw_fish', 'ender_pearl', 'mithril',
];

export function fetchurWant(now = Date.now()): ItemId {
  return FETCHUR_POOL[dayIndex(now) % FETCHUR_POOL.length] ?? 'cobble';
}

export const FETCHUR_BITS = 150;
export const FETCHUR_QTY = 1;
