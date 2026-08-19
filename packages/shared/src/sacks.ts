import type { ItemId } from './items.js';
import { ITEMS } from './items.js';
import type { Inventory } from './inventory.js';

export type SackId = 'enchanted' | 'crop' | 'potion' | 'gemstone' | 'fish' | 'mining';

export interface SackDef {
  id: SackId;
  name: string;
  icon: string;
  description: string;
  matches: (itemId: ItemId) => boolean;
}

export interface SacksState {
  bagOfBagsLevel: number;
  stores: Record<SackId, Record<ItemId, number>>;
}

export const SACK_BASE_CAPACITY = 2048;
export const BAG_OF_BAGS_BONUS = 512;
export const MAX_BAG_OF_BAGS_LEVEL = 5;

export const SACK_DEFS: SackDef[] = [
  {
    id: 'enchanted',
    name: 'Enchanted Sack',
    icon: 'gem',
    description: 'Stores enchanted materials and blocks.',
    matches: (id) => id.startsWith('enchanted_'),
  },
  {
    id: 'crop',
    name: 'Crop Sack',
    icon: 'wheat',
    description: 'Stores farming crops and seeds.',
    matches: (id) => ['wheat', 'carrot', 'potato', 'pumpkin', 'melon', 'sugar_cane', 'cactus', 'cocoa_beans', 'mushroom', 'nether_wart', 'seeds'].includes(id),
  },
  {
    id: 'potion',
    name: 'Potion Sack',
    icon: 'potion',
    description: 'Stores brewed potions and splash variants.',
    matches: (id) => id.endsWith('_potion') || ITEMS[id]?.type === 'CONSUMABLE' && Boolean(ITEMS[id]?.heal || ITEMS[id]?.stats),
  },
  {
    id: 'gemstone',
    name: 'Gemstone Sack',
    icon: 'gemstone_ruby',
    description: 'Stores rough, flawless, and perfect gemstones.',
    matches: (id) => id.startsWith('gemstone_') || id.startsWith('flawless_') || id.startsWith('perfect_'),
  },
  {
    id: 'fish',
    name: 'Fish Sack',
    icon: 'fishing_rod',
    description: 'Stores fish, ink, and fishing loot.',
    matches: (id) => ['raw_fish', 'raw_salmon', 'clownfish', 'pufferfish', 'ink_sack', 'ink_sac', 'prismarine_shard', 'prismarine_crystals', 'nautilus_shell'].includes(id),
  },
  {
    id: 'mining',
    name: 'Mining Sack',
    icon: 'pickaxe',
    description: 'Stores ores, ingots, and mining commodities.',
    matches: (id) => ['cobble', 'coal', 'iron_ingot', 'gold_ingot', 'diamond', 'emerald', 'redstone', 'lapis', 'mithril', 'titanium', 'glacite'].includes(id),
  },
];

export const SACK_BY_ID: Record<SackId, SackDef> = Object.fromEntries(
  SACK_DEFS.map((def) => [def.id, def]),
) as Record<SackId, SackDef>;

export function emptySacks(): SacksState {
  const stores = Object.fromEntries(SACK_DEFS.map((def) => [def.id, {}])) as Record<SackId, Record<ItemId, number>>;
  return { bagOfBagsLevel: 0, stores };
}

export function normalizeSacks(raw?: Partial<SacksState> | null): SacksState {
  const base = emptySacks();
  if (!raw) return base;
  base.bagOfBagsLevel = Math.max(0, Math.min(MAX_BAG_OF_BAGS_LEVEL, raw.bagOfBagsLevel ?? 0));
  for (const def of SACK_DEFS) {
    const src = raw.stores?.[def.id];
    if (!src || typeof src !== 'object') continue;
    for (const [itemId, qty] of Object.entries(src)) {
      const n = Math.max(0, Math.floor(Number(qty) || 0));
      if (n > 0) base.stores[def.id][itemId] = n;
    }
  }
  return base;
}

export function sackCapacity(state: SacksState): number {
  return SACK_BASE_CAPACITY + state.bagOfBagsLevel * BAG_OF_BAGS_BONUS;
}

export function sackUsed(store: Record<ItemId, number>): number {
  return Object.values(store).reduce((sum, qty) => sum + qty, 0);
}

export function sackForItem(itemId: ItemId): SackId | null {
  for (const def of SACK_DEFS) {
    if (def.matches(itemId)) return def.id;
  }
  return null;
}

export function depositToSack(state: SacksState, sackId: SackId, itemId: ItemId, qty: number): { state: SacksState; deposited: number } {
  const def = SACK_BY_ID[sackId];
  if (!def?.matches(itemId) || qty <= 0) return { state, deposited: 0 };
  const cap = sackCapacity(state);
  const store = { ...state.stores[sackId] };
  const used = sackUsed(store);
  const room = Math.max(0, cap - used);
  const add = Math.min(qty, room);
  if (add <= 0) return { state, deposited: 0 };
  store[itemId] = (store[itemId] ?? 0) + add;
  return {
    state: { ...state, stores: { ...state.stores, [sackId]: store } },
    deposited: add,
  };
}

export function withdrawFromSack(state: SacksState, sackId: SackId, itemId: ItemId, qty: number): { state: SacksState; withdrawn: number } {
  const have = state.stores[sackId]?.[itemId] ?? 0;
  const take = Math.min(qty, have);
  if (take <= 0) return { state, withdrawn: 0 };
  const store = { ...state.stores[sackId] };
  const next = have - take;
  if (next <= 0) delete store[itemId];
  else store[itemId] = next;
  return {
    state: { ...state, stores: { ...state.stores, [sackId]: store } },
    withdrawn: take,
  };
}

export function depositInventoryToSack(
  inventory: Inventory,
  state: SacksState,
  sackId: SackId,
): { inventory: Inventory; state: SacksState; deposited: number } {
  let nextInv = inventory;
  let nextState = state;
  let total = 0;
  const def = SACK_BY_ID[sackId];
  for (let slot = 0; slot < nextInv.length; slot++) {
    const stack = nextInv[slot];
    if (!stack || !def.matches(stack.itemId)) continue;
    const result = depositToSack(nextState, sackId, stack.itemId, stack.qty);
    if (result.deposited <= 0) continue;
    total += result.deposited;
    nextState = result.state;
    const remaining = stack.qty - result.deposited;
    nextInv = [...nextInv];
    nextInv[slot] = remaining > 0 ? { ...stack, qty: remaining } : null;
  }
  return { inventory: nextInv, state: nextState, deposited: total };
}

export function tryAutoDepositToSacks(inventory: Inventory, state: SacksState): { inventory: Inventory; state: SacksState } {
  let nextInv = inventory;
  let nextState = state;
  for (const def of SACK_DEFS) {
    for (let slot = 0; slot < nextInv.length; slot++) {
      const stack = nextInv[slot];
      if (!stack || !def.matches(stack.itemId)) continue;
      const result = depositToSack(nextState, def.id, stack.itemId, stack.qty);
      if (result.deposited <= 0) continue;
      nextState = result.state;
      const remaining = stack.qty - result.deposited;
      nextInv = [...nextInv];
      nextInv[slot] = remaining > 0 ? { ...stack, qty: remaining } : null;
    }
  }
  return { inventory: nextInv, state: nextState };
}

export function upgradeBagOfBags(state: SacksState): SacksState | null {
  if (state.bagOfBagsLevel >= MAX_BAG_OF_BAGS_LEVEL) return null;
  return { ...state, bagOfBagsLevel: state.bagOfBagsLevel + 1 };
}

export function bagOfBagsUpgradeCost(level: number): number {
  return 100_000 * (level + 1);
}

export function sackItemEntries(store: Record<ItemId, number>): Array<{ itemId: ItemId; qty: number }> {
  return Object.entries(store)
    .filter(([, qty]) => qty > 0)
    .map(([itemId, qty]) => ({ itemId, qty: Math.floor(qty) }))
    .sort((a, b) => b.qty - a.qty || a.itemId.localeCompare(b.itemId));
}
