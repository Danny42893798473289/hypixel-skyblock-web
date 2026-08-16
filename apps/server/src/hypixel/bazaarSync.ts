import { v4 as uuid } from 'uuid';
import { BAZAAR_ITEMS, type ItemId } from '@aether/shared';
import { addOrder, removeOrdersForPlayer } from '../store/usersStore.js';
import { bazaarMirrorDepth, HYPIXEL_BAZAAR_URL } from './config.js';
import { ensureMarketBot, resetMarketBotCoins } from './bots.js';
import { getHypixelProductId } from './productMap.js';
import { recordPriceSnapshot } from './priceHistory.js';
import { notifyBazaarSynced } from './broadcast.js';

interface HypixelOrderLevel {
  amount: number;
  pricePerUnit: number;
  orders: number;
}

interface HypixelProduct {
  product_id: string;
  sell_summary: HypixelOrderLevel[];
  buy_summary: HypixelOrderLevel[];
  quick_status: {
    buyPrice: number;
    sellPrice: number;
  };
}

interface HypixelBazaarResponse {
  success: boolean;
  lastUpdated?: number;
  products?: Record<string, HypixelProduct>;
}

let lastUpdated: number | null = null;
let syncing = false;
let lastSource: 'hypixel' | 'local' = 'local';

export function getBazaarSyncMeta() {
  return { lastUpdated, source: lastSource, syncing };
}

export async function syncBazaarFromHypixel(): Promise<boolean> {
  if (syncing) return false;
  syncing = true;
  try {
    const res = await fetch(HYPIXEL_BAZAAR_URL);
    if (!res.ok) return false;
    const json = (await res.json()) as HypixelBazaarResponse;
    if (!json.success || !json.products) return false;

    const bot = ensureMarketBot();
    const depth = bazaarMirrorDepth();
    const now = Date.now();
    const updatedAt = json.lastUpdated ?? now;

    removeOrdersForPlayer(bot.id);

    let buyEscrow = 0;
    for (const itemId of BAZAAR_ITEMS) {
      const hypixelId = getHypixelProductId(itemId);
      if (!hypixelId) continue;
      const product = json.products[hypixelId];
      if (!product) continue;

      recordPriceSnapshot(
        itemId,
        updatedAt,
        product.quick_status?.buyPrice ?? null,
        product.quick_status?.sellPrice ?? null,
      );

      for (const level of product.sell_summary.slice(0, depth)) {
        const qty = clampQty(level.amount);
        if (qty <= 0 || level.pricePerUnit <= 0) continue;
        addOrder({
          id: uuid(),
          playerId: bot.id,
          itemId: itemId as ItemId,
          side: 'sell',
          price: roundPrice(level.pricePerUnit),
          qty,
          filled: 0,
          createdAt: now,
        });
      }

      for (const level of product.buy_summary.slice(0, depth)) {
        const qty = clampQty(level.amount);
        if (qty <= 0 || level.pricePerUnit <= 0) continue;
        const price = roundPrice(level.pricePerUnit);
        addOrder({
          id: uuid(),
          playerId: bot.id,
          itemId: itemId as ItemId,
          side: 'buy',
          price,
          qty,
          filled: 0,
          createdAt: now,
        });
        buyEscrow += price * qty;
      }
    }

    resetMarketBotCoins(buyEscrow + 1_000_000_000);
    lastUpdated = updatedAt;
    lastSource = 'hypixel';
    notifyBazaarSynced();
    return true;
  } catch (error) {
    console.error('[hypixel] bazaar sync failed:', error);
    return false;
  } finally {
    syncing = false;
  }
}

function clampQty(amount: number): number {
  return Math.min(10_000, Math.max(1, Math.round(amount)));
}

function roundPrice(price: number): number {
  return Math.round(price * 10) / 10;
}

export function markBazaarLocal(updatedAt = Date.now()): void {
  lastUpdated = updatedAt;
  lastSource = 'local';
}
