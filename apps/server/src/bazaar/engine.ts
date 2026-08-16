import { v4 as uuid } from 'uuid';
import { getUsername, savePlayer } from '../auth/index.js';
import { updatePlayer } from '../game/livePlayers.js';
import {
  addOrder,
  getOrders,
  openOrders,
  patchOrder,
  removeOrder,
  type StoredOrder,
} from '../store/usersStore.js';
import {
  type ItemId,
  type BazaarOrder,
  type OrderBookSnapshot,
  type OrderBookLevel,
  type PlayerState,
  BAZAAR_ITEMS,
  BAZAAR_TAX_RATE,
  addItem,
  removeItem,
  canAddItem,
} from '@aether/shared';
import { isMarketBot } from '../hypixel/bots.js';

export type BazaarFillListener = (playerId: string) => void;
const fillListeners = new Set<BazaarFillListener>();

export function onBazaarFill(listener: BazaarFillListener): () => void {
  fillListeners.add(listener);
  return () => fillListeners.delete(listener);
}

function notifyFill(playerId: string): void {
  for (const l of fillListeners) l(playerId);
}

function toPublic(order: StoredOrder): BazaarOrder {
  return {
    id: order.id,
    playerId: order.playerId,
    username: getUsername(order.playerId),
    itemId: order.itemId,
    side: order.side,
    price: order.price,
    qty: order.qty,
    filled: order.filled,
    createdAt: order.createdAt,
  };
}

function remaining(order: StoredOrder): number {
  return order.qty - order.filled;
}

export function assertBazaarItem(itemId: ItemId): void {
  if (!BAZAAR_ITEMS.includes(itemId)) throw new Error('Item not tradeable on bazaar');
}

export function getPlayerOrders(playerId: string): BazaarOrder[] {
  return getOrders()
    .filter((o) => o.playerId === playerId)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(toPublic);
}

export function getOrderBook(itemId: ItemId): OrderBookSnapshot {
  const group = (side: 'buy' | 'sell') => {
    const map = new Map<number, OrderBookLevel>();
    for (const o of openOrders(itemId, side)) {
      const left = remaining(o);
      const cur = map.get(o.price) ?? { price: o.price, qty: 0, orders: 0 };
      cur.qty += left;
      cur.orders += 1;
      map.set(o.price, cur);
    }
    const levels = [...map.values()];
    levels.sort((a, b) => (side === 'buy' ? b.price - a.price : a.price - b.price));
    return levels.slice(0, 9);
  };
  const buys = group('buy');
  const sells = group('sell');
  return {
    itemId,
    buys,
    sells,
    bestBid: buys[0]?.price ?? null,
    bestAsk: sells[0]?.price ?? null,
  };
}

function afterTax(amount: number): number {
  return Math.floor(amount * (1 - BAZAAR_TAX_RATE) * 100) / 100;
}

function creditSeller(playerId: string, amount: number): void {
  const payout = isMarketBot(playerId) ? amount : afterTax(amount);
  updatePlayer(playerId, (p) => {
    p.coins += payout;
    savePlayer(p);
  });
  notifyFill(playerId);
}

function deliverToBuyer(playerId: string, itemId: ItemId, qty: number): boolean {
  if (isMarketBot(playerId)) return true;
  let ok = false;
  updatePlayer(playerId, (p) => {
    if (!canAddItem(p.inventory, itemId, qty)) return;
    const next = addItem(p.inventory, itemId, qty);
    if (!next) return;
    p.inventory = next;
    savePlayer(p);
    ok = true;
  });
  if (ok) notifyFill(playerId);
  return ok;
}

function sortSells(orders: StoredOrder[]): StoredOrder[] {
  return [...orders].sort((a, b) => a.price - b.price || a.createdAt - b.createdAt);
}

function sortBuys(orders: StoredOrder[]): StoredOrder[] {
  return [...orders].sort((a, b) => b.price - a.price || a.createdAt - b.createdAt);
}

export function placeBuyOrder(
  player: PlayerState,
  itemId: ItemId,
  price: number,
  qty: number,
): { player: PlayerState; order: BazaarOrder } {
  assertBazaarItem(itemId);
  if (!Number.isFinite(price) || price <= 0) throw new Error('Invalid price');
  if (!Number.isInteger(qty) || qty <= 0 || qty > 10000) throw new Error('Invalid quantity');
  if (player.coins < price * qty) throw new Error('Not enough coins');

  let remainingQty = qty;
  let coins = player.coins;
  let inv = player.inventory;

  for (const sell of sortSells(openOrders(itemId, 'sell').filter((o) => o.price <= price))) {
    if (remainingQty <= 0) break;
    const take = Math.min(remaining(sell), remainingQty);
    const tradeCost = take * sell.price;
    if (!canAddItem(inv, itemId, take)) throw new Error('Inventory full');
    const nextInv = addItem(inv, itemId, take);
    if (!nextInv) throw new Error('Inventory full');
    inv = nextInv;
    coins -= tradeCost;
    remainingQty -= take;
    patchOrder(sell.id, sell.filled + take, sell.qty);
    creditSeller(sell.playerId, tradeCost);
  }

  const reservedForRest = remainingQty * price;
  if (coins < reservedForRest) throw new Error('Not enough coins');
  coins -= reservedForRest;

  player = { ...player, coins, inventory: inv };
  savePlayer(player);

  if (remainingQty > 0) {
    const now = Date.now();
    const stored: StoredOrder = {
      id: uuid(),
      playerId: player.id,
      itemId,
      side: 'buy',
      price,
      qty: remainingQty,
      filled: 0,
      createdAt: now,
    };
    addOrder(stored);
    return { player, order: toPublic(stored) };
  }

  return {
    player,
    order: {
      id: 'filled',
      playerId: player.id,
      username: player.username,
      itemId,
      side: 'buy',
      price,
      qty,
      filled: qty,
      createdAt: Date.now(),
    },
  };
}

export function placeSellOrder(
  player: PlayerState,
  itemId: ItemId,
  price: number,
  qty: number,
): { player: PlayerState; order: BazaarOrder } {
  assertBazaarItem(itemId);
  if (!Number.isFinite(price) || price <= 0) throw new Error('Invalid price');
  if (!Number.isInteger(qty) || qty <= 0 || qty > 10000) throw new Error('Invalid quantity');

  const removed = removeItem(player.inventory, itemId, qty);
  if (!removed) throw new Error('Not enough items');

  let remainingQty = qty;
  let coins = player.coins;
  let inv = removed;

  for (const buy of sortBuys(openOrders(itemId, 'buy').filter((o) => o.price >= price))) {
    if (remainingQty <= 0) break;
    const take = Math.min(remaining(buy), remainingQty);
    const tradeCost = take * buy.price;
    if (!deliverToBuyer(buy.playerId, itemId, take)) continue;
    coins += afterTax(tradeCost);
    remainingQty -= take;
    patchOrder(buy.id, buy.filled + take, buy.qty);
  }

  player = { ...player, coins, inventory: inv };
  savePlayer(player);

  if (remainingQty > 0) {
    const stored: StoredOrder = {
      id: uuid(),
      playerId: player.id,
      itemId,
      side: 'sell',
      price,
      qty: remainingQty,
      filled: 0,
      createdAt: Date.now(),
    };
    addOrder(stored);
    return { player, order: toPublic(stored) };
  }

  return {
    player,
    order: {
      id: 'filled',
      playerId: player.id,
      username: player.username,
      itemId,
      side: 'sell',
      price,
      qty,
      filled: qty,
      createdAt: Date.now(),
    },
  };
}

export function instantBuy(
  player: PlayerState,
  itemId: ItemId,
  qty: number,
  maxPrice?: number,
): { player: PlayerState; filled: number; spent: number } {
  assertBazaarItem(itemId);
  if (!Number.isInteger(qty) || qty <= 0) throw new Error('Invalid quantity');

  const rows = sortSells(
    openOrders(itemId, 'sell').filter((o) => maxPrice == null || o.price <= maxPrice),
  );

  let need = qty;
  let spent = 0;
  let inv = player.inventory;
  let coins = player.coins;

  for (const sell of rows) {
    if (need <= 0) break;
    const take = Math.min(remaining(sell), need);
    const cost = take * sell.price;
    if (coins < cost) break;
    if (!canAddItem(inv, itemId, take)) throw new Error('Inventory full');
    const next = addItem(inv, itemId, take);
    if (!next) throw new Error('Inventory full');
    inv = next;
    coins -= cost;
    spent += cost;
    need -= take;
    patchOrder(sell.id, sell.filled + take, sell.qty);
    creditSeller(sell.playerId, cost);
  }

  const filled = qty - need;
  if (filled <= 0) throw new Error('No sell orders available');

  player = { ...player, coins, inventory: inv };
  savePlayer(player);
  return { player, filled, spent };
}

export function instantSell(
  player: PlayerState,
  itemId: ItemId,
  qty: number,
  minPrice?: number,
): { player: PlayerState; filled: number; earned: number } {
  assertBazaarItem(itemId);
  if (!Number.isInteger(qty) || qty <= 0) throw new Error('Invalid quantity');

  const rows = sortBuys(
    openOrders(itemId, 'buy').filter((o) => minPrice == null || o.price >= minPrice),
  );

  let need = qty;
  let earned = 0;
  let inv = player.inventory;
  let coins = player.coins;
  let sold = 0;

  for (const buy of rows) {
    if (need <= 0) break;
    const take = Math.min(remaining(buy), need);
    const revenue = take * buy.price;
    if (!deliverToBuyer(buy.playerId, itemId, take)) continue;
    const payout = afterTax(revenue);
    earned += payout;
    sold += take;
    need -= take;
    patchOrder(buy.id, buy.filled + take, buy.qty);
  }

  if (sold <= 0) throw new Error('No buy orders available');

  const removed = removeItem(inv, itemId, sold);
  if (!removed) throw new Error('Not enough items');
  inv = removed;
  coins += earned;

  player = { ...player, coins, inventory: inv };
  savePlayer(player);
  return { player, filled: sold, earned };
}

export function cancelOrder(player: PlayerState, orderId: string): PlayerState {
  const row = getOrders().find((o) => o.id === orderId);
  if (!row) throw new Error('Order not found');
  if (row.playerId !== player.id) throw new Error('Not your order');

  const left = remaining(row);
  removeOrder(orderId);

  if (row.side === 'buy') {
    player = { ...player, coins: player.coins + left * row.price };
  } else {
    const next = addItem(player.inventory, row.itemId, left);
    if (!next) throw new Error('Inventory full — free space to cancel sell order');
    player = { ...player, inventory: next };
  }
  savePlayer(player);
  return player;
}
