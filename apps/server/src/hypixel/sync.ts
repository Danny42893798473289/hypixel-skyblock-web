import { seedMarket } from '../bazaar/seed.js';
import {
  auctionSyncIntervalMs,
  bazaarSyncIntervalMs,
  hypixelMirrorEnabled,
} from './config.js';
import { ensureAuctionMirror, ensureMarketBot } from './bots.js';
import { syncBazaarFromHypixel, markBazaarLocal } from './bazaarSync.js';
import { syncAuctionsFromHypixel } from './auctionSync.js';
import { getProductMapSize } from './productMap.js';

let bazaarTimer: ReturnType<typeof setInterval> | null = null;
let auctionTimer: ReturnType<typeof setInterval> | null = null;

export async function startHypixelSync(): Promise<void> {
  if (!hypixelMirrorEnabled()) {
    console.log('[hypixel] mirror disabled — using local MarketBot seed');
    seedMarket();
    markBazaarLocal();
    return;
  }

  ensureMarketBot();
  ensureAuctionMirror();
  console.log(`[hypixel] mirror enabled — product map has ${getProductMapSize()} entries`);

  const bazaarOk = await syncBazaarFromHypixel();
  if (!bazaarOk) {
    console.warn('[hypixel] initial bazaar sync failed — falling back to local seed');
    seedMarket();
    markBazaarLocal();
  }

  void syncAuctionsFromHypixel();

  const bazaarMs = bazaarSyncIntervalMs();
  const auctionMs = auctionSyncIntervalMs();
  bazaarTimer = setInterval(() => {
    void syncBazaarFromHypixel();
  }, bazaarMs);
  auctionTimer = setInterval(() => {
    void syncAuctionsFromHypixel();
  }, auctionMs);

  console.log(`[hypixel] bazaar sync every ${bazaarMs / 1000}s, auction sync every ${auctionMs / 1000}s`);
}

export function stopHypixelSync(): void {
  if (bazaarTimer) clearInterval(bazaarTimer);
  if (auctionTimer) clearInterval(auctionTimer);
  bazaarTimer = null;
  auctionTimer = null;
}
