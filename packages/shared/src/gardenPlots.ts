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

export function plotReady(plot: GardenPlotCell, now = Date.now()): boolean {
  if (!plot.crop || !plot.plantedAt) return false;
  const speed = plot.watered ? 0.75 : 1;
  return now - plot.plantedAt >= GARDEN_GROW_MS * speed;
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
