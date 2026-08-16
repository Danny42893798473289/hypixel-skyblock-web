import { v4 as uuid } from 'uuid';
import { ITEMS, addItem, type PlayerState } from '@aether/shared';
import { savePlayer } from '../auth/index.js';
import { updatePlayer } from '../game/livePlayers.js';
import { addAuction, getAuctions, removeAuction, updateAuction, type StoredAuction } from '../store/usersStore.js';

const BIN_GRACE_MS = 20_000;
const DURATION_OPTIONS = [1, 6, 12, 24, 48] as const;

export function activeAuctions(): StoredAuction[] {
  const now = Date.now();
  return getAuctions().filter((auction) => auction.expiresAt > now);
}

export function auctionsBySeller(sellerId: string): StoredAuction[] {
  return activeAuctions().filter((auction) => auction.sellerId === sellerId);
}

export function auctionById(id: string): StoredAuction | undefined {
  return getAuctions().find((entry) => entry.id === id);
}

export function durationOptions(): readonly number[] {
  return DURATION_OPTIONS;
}

function listingFee(price: number, bin: boolean): number {
  return bin ? Math.max(5, Math.floor(price * 0.01)) : Math.max(25, Math.floor(price * 0.05));
}

export function createListing(
  player: PlayerState,
  inventorySlot: number,
  price: number,
  bin: boolean,
  durationHours: number,
): PlayerState {
  const item = player.inventory[inventorySlot];
  if (!item) throw new Error('Click an item in your inventory to list it');
  const def = ITEMS[item.itemId];
  if (!def) throw new Error('Unknown item');
  if (def.type === 'MATERIAL') throw new Error('Use the Bazaar for commodity items');
  if (!Number.isFinite(price) || price < 1) throw new Error('Set a starting price first');

  const fee = listingFee(price, bin);
  if (player.coins < fee) throw new Error(`Need ${fee.toLocaleString()} coins for the listing fee`);

  player.coins -= fee;
  player.inventory[inventorySlot] = null;
  addAuction({
    id: uuid(),
    sellerId: player.id,
    sellerName: player.username,
    item: { ...item },
    price,
    highestBid: bin ? 0 : price,
    bin,
    createdAt: Date.now(),
    expiresAt: Date.now() + durationHours * 60 * 60 * 1000,
  });
  savePlayer(player);
  return player;
}

/** @deprecated use createListing */
export function createBin(player: PlayerState, inventorySlot: number): PlayerState {
  const item = player.inventory[inventorySlot];
  if (!item) throw new Error('Select an item from your inventory');
  const def = ITEMS[item.itemId];
  const rarityIndex = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'].indexOf(def?.rarity ?? 'COMMON');
  const price = Math.max(100, (rarityIndex + 1) * (rarityIndex + 1) * 2_500);
  return createListing(player, inventorySlot, price, true, 24);
}

export function buyBin(player: PlayerState, auctionId: string): PlayerState {
  const auction = auctionById(auctionId);
  if (!auction || auction.expiresAt <= Date.now()) throw new Error('Auction has expired');
  if (!auction.bin) throw new Error('This listing accepts bids — use Submit Bid');
  if (auction.sellerId === player.id) throw new Error('You cannot buy your own auction');
  if (Date.now() < auction.createdAt + BIN_GRACE_MS) {
    throw new Error('BIN grace period — try again in a few seconds');
  }
  if (player.coins < auction.price) throw new Error('Not enough coins');
  const inventory = addItem(player.inventory, auction.item.itemId, auction.item.qty);
  if (!inventory) throw new Error('Inventory full');
  removeAuction(auctionId);
  player.coins -= auction.price;
  player.inventory = inventory;
  if (!auction.mirrored) {
    updatePlayer(auction.sellerId, (seller) => {
      seller.coins += Math.floor(auction.price * 0.99);
      savePlayer(seller);
    });
  }
  savePlayer(player);
  return player;
}

export function placeBid(player: PlayerState, auctionId: string): PlayerState {
  const auction = auctionById(auctionId);
  if (!auction || auction.expiresAt <= Date.now()) throw new Error('Auction has expired');
  if (auction.bin) throw new Error('This is a Buy It Now listing');
  if (auction.sellerId === player.id) throw new Error('You cannot bid on your own auction');

  const minBid = auction.highestBidderId
    ? Math.ceil(auction.highestBid * 1.025)
    : auction.price;
  if (player.coins < minBid) throw new Error(`Need at least ${minBid.toLocaleString()} coins to bid`);

  if (auction.highestBidderId && auction.highestBidderId !== player.id) {
    updatePlayer(auction.highestBidderId, (bidder) => {
      bidder.coins += auction.highestBid;
      savePlayer(bidder);
    });
  } else if (auction.highestBidderId === player.id) {
    player.coins += auction.highestBid;
  }

  player.coins -= minBid;
  updateAuction(auctionId, {
    highestBid: minBid,
    highestBidderId: player.id,
    expiresAt: Math.max(auction.expiresAt, Date.now() + 60_000),
  });
  savePlayer(player);
  return player;
}

export function claimAuction(player: PlayerState, auctionId: string): PlayerState {
  const auction = auctionById(auctionId);
  if (!auction) throw new Error('Auction not found');
  if (auction.expiresAt > Date.now()) throw new Error('This auction is still active');

  if (auction.highestBidderId === player.id && !auction.bin) {
    const inventory = addItem(player.inventory, auction.item.itemId, auction.item.qty);
    if (!inventory) throw new Error('Inventory full');
    removeAuction(auctionId);
    player.inventory = inventory;
    updatePlayer(auction.sellerId, (seller) => {
      seller.coins += Math.floor(auction.highestBid * 0.99);
      savePlayer(seller);
    });
    savePlayer(player);
    return player;
  }

  if (auction.sellerId === player.id && !auction.highestBidderId) {
    removeAuction(auctionId);
    const inventory = addItem(player.inventory, auction.item.itemId, auction.item.qty);
    if (!inventory) throw new Error('Inventory full — make room to claim your item');
    player.inventory = inventory;
    savePlayer(player);
    return player;
  }

  throw new Error('Nothing to claim on this auction');
}

export function cancelListing(player: PlayerState, auctionId: string): PlayerState {
  const auction = auctionById(auctionId);
  if (!auction) throw new Error('Auction not found');
  if (auction.sellerId !== player.id) throw new Error('Not your auction');
  if (auction.mirrored) throw new Error('Mirrored listings cannot be cancelled');
  if (auction.highestBidderId && !auction.bin) {
    throw new Error('Cannot cancel — a player has already bid');
  }
  removeAuction(auctionId);
  const inventory = addItem(player.inventory, auction.item.itemId, auction.item.qty);
  if (!inventory) throw new Error('Inventory full');
  player.inventory = inventory;
  savePlayer(player);
  return player;
}

export function expiredAuctionsFor(playerId: string): StoredAuction[] {
  const now = Date.now();
  return getAuctions().filter((auction) => auction.expiresAt <= now && (
    auction.sellerId === playerId
    || auction.highestBidderId === playerId
  ));
}

export function formatTimeLeft(expiresAt: number): string {
  const ms = Math.max(0, expiresAt - Date.now());
  const hours = Math.floor(ms / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export type AuctionSort = 'price_asc' | 'price_desc' | 'ending' | 'newest';

export function listAuctions(options: {
  search?: string;
  sort?: AuctionSort;
  page?: number;
  pageSize?: number;
} = {}) {
  const search = options.search?.trim().toLowerCase() ?? '';
  const sort = options.sort ?? 'ending';
  const page = Math.max(0, options.page ?? 0);
  const pageSize = Math.min(48, Math.max(1, options.pageSize ?? 24));
  const now = Date.now();

  let rows = activeAuctions();
  if (search) {
    rows = rows.filter((auction) => {
      const def = ITEMS[auction.item.itemId];
      const hay = `${def?.name ?? auction.item.itemId} ${auction.sellerName}`.toLowerCase();
      return hay.includes(search);
    });
  }

  rows = [...rows].sort((a, b) => {
    const priceA = a.bin ? a.price : a.highestBid;
    const priceB = b.bin ? b.price : b.highestBid;
    if (sort === 'price_asc') return priceA - priceB;
    if (sort === 'price_desc') return priceB - priceA;
    if (sort === 'newest') return b.createdAt - a.createdAt;
    return a.expiresAt - b.expiresAt;
  });

  const total = rows.length;
  const listings = rows.slice(page * pageSize, (page + 1) * pageSize).map((auction) => ({
    id: auction.id,
    sellerName: auction.sellerName,
    itemId: auction.item.itemId,
    qty: auction.item.qty,
    price: auction.bin ? auction.price : auction.highestBid,
    highestBid: auction.highestBid,
    bin: auction.bin,
    expiresAt: auction.expiresAt,
    mirrored: Boolean(auction.mirrored),
  }));

  return { listings, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
