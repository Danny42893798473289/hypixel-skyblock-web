import type { ItemStack } from './inventory.js';
import type { ItemId } from './items.js';

export interface GardenPlotCell {
  crop: ItemId | null;
  plantedAt: number;
  watered: boolean;
}

export const GARDEN_PLOT_COUNT = 24;
export const GARDEN_GROW_MS = 45_000;
export const JACOB_CONTEST_MS = 20 * 60 * 1000;

export function emptyGardenPlots(): GardenPlotCell[] {
  return Array.from({ length: GARDEN_PLOT_COUNT }, () => ({
    crop: null,
    plantedAt: 0,
    watered: false,
  }));
}

export function plotGrowRemainingMs(plot: GardenPlotCell, now = Date.now()): number {
  if (!plot.crop || !plot.plantedAt) return 0;
  const speed = plot.watered ? 0.75 : 1;
  return Math.max(0, GARDEN_GROW_MS * speed - (now - plot.plantedAt));
}

export function plotReady(plot: GardenPlotCell, now = Date.now()): boolean {
  return plotGrowRemainingMs(plot, now) <= 0 && Boolean(plot.crop && plot.plantedAt);
}

export function composterYield(crop: ItemId, qty: number): number {
  const bulky: Partial<Record<ItemId, number>> = {
    pumpkin: 4,
    melon: 3,
    sugar_cane: 2,
    cactus: 2,
    nether_wart: 2,
  };
  return qty * (bulky[crop] ?? 1);
}

export function jacobMedalForScore(score: number): 'none' | 'bronze' | 'silver' | 'gold' {
  if (score >= 5000) return 'gold';
  if (score >= 2000) return 'silver';
  if (score >= 500) return 'bronze';
  return 'none';
}

export function jacobMedalReward(medal: 'none' | 'bronze' | 'silver' | 'gold'): number {
  if (medal === 'gold') return 50_000;
  if (medal === 'silver') return 15_000;
  if (medal === 'bronze') return 5_000;
  return 0;
}

export interface JacobMedals {
  bronze: number;
  silver: number;
  gold: number;
}

export interface JacobContestEntry {
  crop: ItemId;
  score: number;
  medal: 'bronze' | 'silver' | 'gold' | 'none';
  timestamp: number;
}

export interface JacobLeaderboardEntry {
  username: string;
  score: number;
  medal: 'bronze' | 'silver' | 'gold' | 'none';
}

export function emptyJacobMedals(): JacobMedals {
  return { bronze: 0, silver: 0, gold: 0 };
}

export const CROP_MILESTONE_AMOUNTS = [100, 500, 2500, 10000, 25000] as const;
export const CROP_MILESTONE_FORTUNE = 2;
export const STARTING_GARDEN_PLOTS = 4;

const GARDEN_LEVEL_THRESHOLDS = [0, 40, 120, 300, 800, 2000, 5000, 12000, 25000, 50000];

export function gardenLevelFromHarvest(harvested: Record<string, number>): { level: number; into: number; need: number; total: number } {
  const total = Object.values(harvested).reduce((sum, qty) => sum + qty, 0);
  let level = 0;
  for (let i = 1; i < GARDEN_LEVEL_THRESHOLDS.length; i++) {
    if (total >= GARDEN_LEVEL_THRESHOLDS[i]!) level = i;
  }
  const current = GARDEN_LEVEL_THRESHOLDS[level] ?? 0;
  const next = GARDEN_LEVEL_THRESHOLDS[level + 1];
  return { level, into: total - current, need: next ? next - current : 0, total };
}

export function cropMilestoneTier(amount: number): number {
  let tier = 0;
  for (const need of CROP_MILESTONE_AMOUNTS) {
    if (amount >= need) tier++;
  }
  return tier;
}

export function gardenFarmingFortune(harvested: Record<string, number>): number {
  return Object.values(harvested).reduce((sum, qty) => sum + cropMilestoneTier(qty) * CROP_MILESTONE_FORTUNE, 0);
}

export function plotUnlockCost(plotIndex: number): { coins: number; compost: number; gardenLevel: number } {
  const extra = Math.max(1, plotIndex - STARTING_GARDEN_PLOTS + 1);
  return { coins: 500 * extra, compost: 15 * extra, gardenLevel: Math.max(0, extra - 1) };
}

export function starUpgradeCost(stars: number, rarityIndex: number): { coins: number; essence: number } {
  const base = (stars + 1) * (rarityIndex + 1) * 5000;
  return { coins: base, essence: (stars + 1) * (rarityIndex + 1) * 10 };
}

export const ESSENCE_TYPES = ['undead', 'wither', 'dragon', 'gold', 'diamond'] as const;
export type EssenceType = (typeof ESSENCE_TYPES)[number];

export function essenceForFloor(floorId: string): EssenceType {
  if (floorId.startsWith('m')) return 'wither';
  if (floorId === 'f7') return 'wither';
  if (floorId === 'f6' || floorId === 'f5') return 'dragon';
  if (floorId === 'f4' || floorId === 'f3') return 'gold';
  return 'undead';
}

export interface TradeOffer {
  coins: number;
  items: Array<ItemStack | null>;
}

export function emptyTradeOffer(): TradeOffer {
  return { coins: 0, items: Array.from({ length: 4 }, () => null) };
}
