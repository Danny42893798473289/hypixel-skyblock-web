/** Hypixel SkyBlock bazaar sell tax (1.125%). */
export const BAZAAR_TAX_RATE = 0.01125;

export const MARKET_BOT_USERNAME = 'MarketBot';
export const AUCTION_MIRROR_USERNAME = 'AuctionMirror';

export interface BazaarMeta {
  lastUpdated: number | null;
  source: 'hypixel' | 'local';
  syncing: boolean;
}

export interface PriceHistoryPoint {
  t: number;
  buyPrice: number | null;
  sellPrice: number | null;
}

export interface AuctionListing {
  id: string;
  sellerName: string;
  itemId: string;
  qty: number;
  price: number;
  highestBid: number;
  bin: boolean;
  expiresAt: number;
  mirrored: boolean;
}
