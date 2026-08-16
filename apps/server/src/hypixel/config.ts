export function hypixelMirrorEnabled(): boolean {
  return process.env.HYPIXEL_MIRROR_ENABLED !== 'false';
}

export function bazaarSyncIntervalMs(): number {
  const raw = Number(process.env.BAZAAR_SYNC_INTERVAL_MS ?? 60_000);
  return Number.isFinite(raw) && raw >= 60_000 ? raw : 60_000;
}

export function auctionSyncIntervalMs(): number {
  const raw = Number(process.env.AUCTION_SYNC_INTERVAL_MS ?? 3_600_000);
  return Number.isFinite(raw) && raw >= 60_000 ? raw : 3_600_000;
}

export function auctionMirrorMaxListings(): number {
  const raw = Number(process.env.AUCTION_MIRROR_MAX_LISTINGS ?? 300);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 300;
}

export function bazaarMirrorDepth(): number {
  const raw = Number(process.env.BAZAAR_MIRROR_DEPTH ?? 9);
  return Number.isFinite(raw) && raw > 0 ? Math.min(9, Math.floor(raw)) : 9;
}

export const HYPIXEL_BAZAAR_URL = 'https://api.hypixel.net/v2/skyblock/bazaar';
export const HYPIXEL_AUCTIONS_URL = 'https://api.hypixel.net/v2/skyblock/auctions';
