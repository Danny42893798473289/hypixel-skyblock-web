import type { Socket } from 'socket.io';
import {
  addItem,
  removeItem,
  emptyTradeOffer,
  type PlayerState,
  type ServerEvent,
  type TradeOffer,
} from '@aether/shared';
import { savePlayer } from '../auth/index.js';

interface TradeSession {
  aId: string;
  bId: string;
  offers: Record<string, TradeOffer>;
  confirmed: Record<string, boolean>;
  createdAt: number;
}

const trades = new Map<string, TradeSession>();

function tradeKey(a: string, b: string): string {
  return [a, b].sort().join(':');
}

function emit(socket: Socket, event: ServerEvent): void {
  socket.emit('game', event);
}

export function handlePay(
  from: PlayerState,
  targetUsername: string,
  amount: number,
  findPlayer: (username: string) => PlayerState | null,
  notify: (playerId: string, message: string) => void,
): PlayerState {
  if (!Number.isFinite(amount) || amount < 1) throw new Error('Invalid amount');
  if (amount > from.coins) throw new Error('Not enough coins');
  const target = findPlayer(targetUsername);
  if (!target) throw new Error('Player not found or offline');
  if (target.id === from.id) throw new Error('Cannot pay yourself');
  from.coins -= amount;
  target.coins += amount;
  savePlayer(from);
  savePlayer(target);
  notify(target.id, `${from.username} paid you ${amount.toLocaleString()} coins!`);
  return from;
}

export function startTrade(a: PlayerState, b: PlayerState): void {
  const key = tradeKey(a.id, b.id);
  trades.set(key, {
    aId: a.id,
    bId: b.id,
    offers: { [a.id]: emptyTradeOffer(), [b.id]: emptyTradeOffer() },
    confirmed: { [a.id]: false, [b.id]: false },
    createdAt: Date.now(),
  });
}

export function getTrade(aId: string, bId: string): TradeSession | undefined {
  return trades.get(tradeKey(aId, bId));
}

export function findTradePartnerId(playerId: string): string | null {
  for (const session of trades.values()) {
    if (session.aId === playerId) return session.bId;
    if (session.bId === playerId) return session.aId;
  }
  return null;
}

export function cancelTrade(aId: string, bId: string): void {
  trades.delete(tradeKey(aId, bId));
}

export function setTradeCoins(player: PlayerState, partnerId: string, coins: number): void {
  const session = trades.get(tradeKey(player.id, partnerId));
  if (!session) throw new Error('No active trade');
  if (coins > player.coins) throw new Error('Not enough coins');
  session.offers[player.id]!.coins = coins;
  session.confirmed[player.id] = false;
  session.confirmed[partnerId] = false;
}

export function setTradeItem(
  player: PlayerState,
  partnerId: string,
  tradeSlot: number,
  inventorySlot: number | null,
): void {
  const session = trades.get(tradeKey(player.id, partnerId));
  if (!session) throw new Error('No active trade');
  if (tradeSlot < 0 || tradeSlot >= 4) throw new Error('Invalid trade slot');
  const offer = session.offers[player.id]!;
  if (inventorySlot == null) {
    offer.items[tradeSlot] = null;
  } else {
    const stack = player.inventory[inventorySlot];
    if (!stack) throw new Error('Empty inventory slot');
    offer.items[tradeSlot] = { ...stack };
  }
  session.confirmed[player.id] = false;
  session.confirmed[partnerId] = false;
}

export function confirmTrade(
  player: PlayerState,
  partner: PlayerState,
): 'pending' | 'completed' {
  const key = tradeKey(player.id, partner.id);
  const session = trades.get(key);
  if (!session) throw new Error('No active trade');
  session.confirmed[player.id] = true;
  if (!session.confirmed[partner.id]) return 'pending';

  const offerA = session.offers[player.id]!;
  const offerB = session.offers[partner.id]!;

  for (const stack of offerA.items) {
    if (!stack) continue;
    const removed = removeItem(player.inventory, stack.itemId, stack.qty);
    if (!removed) throw new Error('Missing trade items');
    player.inventory = removed;
  }
  for (const stack of offerB.items) {
    if (!stack) continue;
    const removed = removeItem(partner.inventory, stack.itemId, stack.qty);
    if (!removed) throw new Error('Partner missing trade items');
    partner.inventory = removed;
  }
  if (offerA.coins > player.coins) throw new Error('Not enough coins');
  if (offerB.coins > partner.coins) throw new Error('Partner not enough coins');
  player.coins -= offerA.coins;
  partner.coins -= offerB.coins;
  player.coins += offerB.coins;
  partner.coins += offerA.coins;

  for (const stack of offerB.items) {
    if (!stack) continue;
    const next = addItem(player.inventory, stack.itemId, stack.qty);
    if (!next) throw new Error('Inventory full');
    player.inventory = next;
  }
  for (const stack of offerA.items) {
    if (!stack) continue;
    const next = addItem(partner.inventory, stack.itemId, stack.qty);
    if (!next) throw new Error('Partner inventory full');
    partner.inventory = next;
  }

  savePlayer(player);
  savePlayer(partner);
  trades.delete(key);
  return 'completed';
}

export function parseChatCommand(text: string): { cmd: string; args: string[] } | null {
  if (!text.startsWith('/')) return null;
  const parts = text.trim().split(/\s+/);
  const cmd = parts[0]!.slice(1).toLowerCase();
  return { cmd, args: parts.slice(1) };
}
