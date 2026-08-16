import { ITEMS, type ItemId } from '@aether/shared';
import { addAuction, removeMirroredAuctions } from '../store/usersStore.js';
import { auctionMirrorMaxListings, HYPIXEL_AUCTIONS_URL } from './config.js';
import { ensureAuctionMirror } from './bots.js';

interface HypixelAuction {
  uuid: string;
  item_name: string;
  tier: string;
  starting_bid: number;
  highest_bid_amount?: number;
  bin: boolean;
  end: number;
  claimed?: boolean;
}

interface HypixelAuctionsResponse {
  success: boolean;
  page: number;
  totalPages: number;
  auctions: HypixelAuction[];
}

let lastAuctionSync = 0;
let mirroredCount = 0;

export function getAuctionSyncMeta() {
  return { lastUpdated: lastAuctionSync || null, mirroredCount };
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function buildItemNameMap(): Map<string, ItemId> {
  const map = new Map<string, ItemId>();
  for (const [id, def] of Object.entries(ITEMS)) {
    if (!def || def.type === 'MATERIAL') continue;
    const key = normalizeName(def.name);
    if (!map.has(key)) map.set(key, id as ItemId);
  }
  return map;
}

function mapAuctionItem(auction: HypixelAuction, nameMap: Map<string, ItemId>): ItemId | null {
  const key = normalizeName(auction.item_name);
  const direct = nameMap.get(key);
  if (direct) return direct;

  for (const [nameKey, itemId] of nameMap) {
    if (key.includes(nameKey) || nameKey.includes(key)) return itemId;
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function syncAuctionsFromHypixel(): Promise<boolean> {
  try {
    ensureAuctionMirror();
    removeMirroredAuctions();

    const nameMap = buildItemNameMap();
    const max = auctionMirrorMaxListings();
    const now = Date.now();
    const listings: Array<{ auction: HypixelAuction; itemId: ItemId }> = [];

    let page = 0;
    let totalPages = 1;
    while (listings.length < max && page < totalPages && page < 60) {
      const res = await fetch(`${HYPIXEL_AUCTIONS_URL}?page=${page}`);
      if (!res.ok) break;
      const json = (await res.json()) as HypixelAuctionsResponse;
      if (!json.success || !Array.isArray(json.auctions)) break;
      totalPages = json.totalPages ?? 1;

      for (const auction of json.auctions) {
        if (!auction.bin || auction.claimed) continue;
        if (auction.end <= now) continue;
        const itemId = mapAuctionItem(auction, nameMap);
        if (!itemId) continue;
        const def = ITEMS[itemId];
        if (!def || def.type === 'MATERIAL') continue;
        const price = auction.starting_bid > 0 ? auction.starting_bid : (auction.highest_bid_amount ?? 0);
        if (price < 1) continue;
        listings.push({ auction: { ...auction, starting_bid: price }, itemId });
        if (listings.length >= max) break;
      }

      page += 1;
      if (page < totalPages && listings.length < max) await sleep(120);
    }

    const bot = ensureAuctionMirror();
    for (const { auction, itemId } of listings) {
      addAuction({
        id: `mirror-${auction.uuid}`,
        sellerId: bot.id,
        sellerName: 'SkyBlock Mirror',
        item: { itemId, qty: 1 },
        price: auction.starting_bid,
        highestBid: 0,
        bin: true,
        createdAt: now,
        expiresAt: auction.end,
        mirrored: true,
      });
    }

    mirroredCount = listings.length;
    lastAuctionSync = now;
    console.log(`[hypixel] mirrored ${mirroredCount} auction listings`);
    return true;
  } catch (error) {
    console.error('[hypixel] auction sync failed:', error);
    return false;
  }
}
