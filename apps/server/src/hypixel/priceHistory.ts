import type { ItemId, PriceHistoryPoint } from '@aether/shared';

const MAX_POINTS = 60;
const history = new Map<ItemId, PriceHistoryPoint[]>();

export function recordPriceSnapshot(
  itemId: ItemId,
  t: number,
  buyPrice: number | null,
  sellPrice: number | null,
): void {
  const points = history.get(itemId) ?? [];
  const last = points[points.length - 1];
  if (last && last.t === t) {
    last.buyPrice = buyPrice;
    last.sellPrice = sellPrice;
    return;
  }
  points.push({ t, buyPrice, sellPrice });
  if (points.length > MAX_POINTS) points.splice(0, points.length - MAX_POINTS);
  history.set(itemId, points);
}

export function getPriceHistory(itemId: ItemId): PriceHistoryPoint[] {
  return [...(history.get(itemId) ?? [])];
}

export function clearPriceHistory(): void {
  history.clear();
}
