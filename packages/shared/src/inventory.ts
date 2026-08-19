import type { ItemId } from './items.js';
import { ITEMS } from './items.js';
import type { StatBlock } from './stats.js';

export const INVENTORY_SIZE = 36;
export const HOTBAR_SIZE = 9;

export interface ItemStack {
  itemId: ItemId;
  qty: number;
  uuid?: string;
  reforge?: string;
  enchantments?: Record<string, number>;
  statBoosts?: Partial<StatBlock>;
  dungeonStars?: number;
  hotPotatoCount?: number;
  fumingCount?: number;
  recombobulated?: boolean;
  gemstoneSlots?: Array<{ type: string | null; quality: string | null }>;
  drill?: {
    fuel: number;
    parts: {
      fuelTank?: ItemId;
      engine?: ItemId;
      gemstoneFuelTank?: ItemId;
      gemstoneChamber?: ItemId;
    };
  };
}

export type Inventory = (ItemStack | null)[];

export function emptyInventory(): Inventory {
  return Array.from({ length: INVENTORY_SIZE }, () => null);
}

/** Inventory index for a hotbar slot (0–8). */
export function hotbarInventoryIndex(hotbarSlot: number): number {
  return INVENTORY_SIZE - HOTBAR_SIZE + hotbarSlot;
}

export function hotbarStack(inventory: Inventory, hotbarSlot: number): ItemStack | null {
  return inventory[hotbarInventoryIndex(hotbarSlot)] ?? null;
}

export function isWeaponLikeType(type?: string): boolean {
  return type === 'SWORD' || type === 'BOW' || type === 'PICKAXE' || type === 'DRILL' || type === 'AXE' || type === 'HOE' || type === 'FISHING_ROD';
}

export function countItem(inv: Inventory, itemId: ItemId): number {
  return inv.reduce((sum, s) => (s?.itemId === itemId ? sum + s.qty : sum), 0);
}

export function canAddItem(inv: Inventory, itemId: ItemId, qty: number): boolean {
  const stackSize = ITEMS[itemId]?.stackSize ?? 64;
  let remaining = qty;
  for (const slot of inv) {
    if (!slot) {
      remaining -= Math.min(remaining, stackSize);
    } else if (slot.itemId === itemId) {
      remaining -= Math.min(remaining, stackSize - slot.qty);
    }
    if (remaining <= 0) return true;
  }
  return remaining <= 0;
}

/** Mutates a copy; returns new inventory or null if cannot fit */
export function addItem(inv: Inventory, itemId: ItemId, qty: number): Inventory | null {
  if (!canAddItem(inv, itemId, qty)) return null;
  const next = inv.map((s) => (s ? { ...s } : null));
  const stackSize = ITEMS[itemId]?.stackSize ?? 64;
  let remaining = qty;

  for (let i = 0; i < next.length && remaining > 0; i++) {
    const slot = next[i];
    if (slot && slot.itemId === itemId && slot.qty < stackSize) {
      const add = Math.min(remaining, stackSize - slot.qty);
      slot.qty += add;
      remaining -= add;
    }
  }
  for (let i = 0; i < next.length && remaining > 0; i++) {
    if (!next[i]) {
      const add = Math.min(remaining, stackSize);
      next[i] = { itemId, qty: add };
      remaining -= add;
    }
  }
  return next;
}

export function removeItem(inv: Inventory, itemId: ItemId, qty: number): Inventory | null {
  if (countItem(inv, itemId) < qty) return null;
  const next = inv.map((s) => (s ? { ...s } : null));
  let remaining = qty;
  for (let i = next.length - 1; i >= 0 && remaining > 0; i--) {
    const slot = next[i];
    if (!slot || slot.itemId !== itemId) continue;
    const take = Math.min(remaining, slot.qty);
    slot.qty -= take;
    remaining -= take;
    if (slot.qty <= 0) next[i] = null;
  }
  return next;
}

/** Swap or merge two inventory slots (Minecraft-style move). */
export function swapInventorySlots(inv: Inventory, from: number, to: number): Inventory {
  if (from === to) return inv;
  if (from < 0 || from >= inv.length || to < 0 || to >= inv.length) return inv;

  const next = inv.map((s) => (s ? { ...s } : null));
  const source = next[from];
  const target = next[to];

  if (!source) return inv;

  if (!target) {
    next[to] = source;
    next[from] = null;
    return next;
  }

  if (source.itemId === target.itemId) {
    const stackSize = ITEMS[source.itemId]?.stackSize ?? 64;
    const space = stackSize - target.qty;
    if (space > 0) {
      const move = Math.min(space, source.qty);
      target.qty += move;
      source.qty -= move;
      if (source.qty <= 0) next[from] = null;
      return next;
    }
  }

  next[from] = target;
  next[to] = source;
  return next;
}

export interface InventoryClickResult {
  inventory: Inventory;
  cursor: ItemStack | null;
}

/** Minecraft-style left/right click on an inventory slot with optional held cursor. */
export function clickInventorySlot(
  inv: Inventory,
  cursor: ItemStack | null,
  slot: number,
  button: 'left' | 'right',
): InventoryClickResult {
  if (slot < 0 || slot >= inv.length) return { inventory: inv, cursor };

  const next = inv.map((s) => (s ? { ...s } : null));
  let held = cursor ? { ...cursor } : null;
  const stack = next[slot];

  if (!held) {
    if (!stack) return { inventory: next, cursor: held };
    if (button === 'right') {
      const take = Math.max(1, Math.ceil(stack.qty / 2));
      held = { ...stack, qty: take };
      stack.qty -= take;
      if (stack.qty <= 0) next[slot] = null;
    } else {
      held = { ...stack };
      next[slot] = null;
    }
    return { inventory: next, cursor: held };
  }

  const stackSize = ITEMS[held.itemId]?.stackSize ?? 64;

  if (!stack) {
    if (button === 'right') {
      next[slot] = { ...held, qty: 1 };
      held.qty -= 1;
      if (held.qty <= 0) held = null;
    } else {
      next[slot] = held;
      held = null;
    }
    return { inventory: next, cursor: held };
  }

  if (stack.itemId === held.itemId) {
    const space = stackSize - stack.qty;
    if (space > 0) {
      const move = button === 'right' ? Math.min(1, held.qty, space) : Math.min(held.qty, space);
      stack.qty += move;
      held.qty -= move;
      if (held.qty <= 0) held = null;
      return { inventory: next, cursor: held };
    }
  }

  if (button === 'left') {
    next[slot] = held;
    held = stack;
  }

  return { inventory: next, cursor: held };
}

/** Starter tool set — granted to every player on first join and backfilled on login if missing. */
export const STARTER_WOODEN_TOOLS: ItemId[] = [
  'wooden_pickaxe',
  'wooden_axe',
  'wooden_hoe',
  'wooden_sword',
  'fishing_rod',
];

export function ensureStarterTools(inv: Inventory): Inventory {
  let next = inv;
  for (const itemId of STARTER_WOODEN_TOOLS) {
    if (countItem(next, itemId) > 0) continue;
    const added = addItem(next, itemId, 1);
    if (added) next = added;
  }
  return next;
}

export function starterInventory(): Inventory {
  let inv = ensureStarterTools(emptyInventory());
  inv = addItem(inv, 'bread', 8)!;
  return inv;
}

export const BACKPACK_PAGES = 10;
export const BACKPACK_SIZE = 54;

function cloneStack(stack: ItemStack): ItemStack {
  return {
    ...stack,
    enchantments: stack.enchantments ? { ...stack.enchantments } : undefined,
    statBoosts: stack.statBoosts ? { ...stack.statBoosts } : undefined,
    drill: stack.drill
      ? { fuel: stack.drill.fuel, parts: { ...stack.drill.parts } }
      : undefined,
  };
}

export function emptyBackpackPage(): Inventory {
  return Array.from({ length: BACKPACK_SIZE }, () => null);
}

export function emptyBackpacks(): Inventory[] {
  return Array.from({ length: BACKPACK_PAGES }, emptyBackpackPage);
}

export function normalizeBackpacks(raw?: Inventory[] | null): Inventory[] {
  const packs = emptyBackpacks();
  if (!raw) return packs;
  for (let i = 0; i < BACKPACK_PAGES; i++) {
    const src = raw[i];
    if (!Array.isArray(src)) continue;
    packs[i] = Array.from({ length: BACKPACK_SIZE }, (_, slot) => src[slot] ?? null);
  }
  return packs;
}

export function backpackSlotsUsed(inv: Inventory): number {
  return inv.reduce((sum, stack) => (stack ? sum + 1 : sum), 0);
}

function stacksCompatible(a: ItemStack, b: ItemStack): boolean {
  if (a.itemId !== b.itemId) return false;
  if (a.uuid || b.uuid) return false;
  if ((a.reforge ?? '') !== (b.reforge ?? '')) return false;
  if ((a.dungeonStars ?? 0) !== (b.dungeonStars ?? 0)) return false;
  if (JSON.stringify(a.enchantments ?? {}) !== JSON.stringify(b.enchantments ?? {})) return false;
  if (JSON.stringify(a.drill ?? null) !== JSON.stringify(b.drill ?? null)) return false;
  return JSON.stringify(a.statBoosts ?? {}) === JSON.stringify(b.statBoosts ?? {});
}

/** Insert a full stack (preserving enchants/reforges). Returns null if it cannot fit. */
export function insertStack(inv: Inventory, stack: ItemStack): Inventory | null {
  const stackSize = ITEMS[stack.itemId]?.stackSize ?? 64;
  let remaining = stack.qty;
  for (const slot of inv) {
    if (!slot) remaining -= Math.min(remaining, stackSize);
    else if (stacksCompatible(slot, stack)) remaining -= Math.min(remaining, stackSize - slot.qty);
    if (remaining <= 0) break;
  }
  if (remaining > 0) return null;

  const next = inv.map((slot) => (slot ? cloneStack(slot) : null));
  remaining = stack.qty;
  for (let i = 0; i < next.length && remaining > 0; i++) {
    const slot = next[i];
    if (slot && stacksCompatible(slot, stack) && slot.qty < stackSize) {
      const add = Math.min(remaining, stackSize - slot.qty);
      slot.qty += add;
      remaining -= add;
    }
  }
  for (let i = 0; i < next.length && remaining > 0; i++) {
    if (!next[i]) {
      const add = Math.min(remaining, stackSize);
      next[i] = { ...cloneStack(stack), qty: add };
      remaining -= add;
    }
  }
  return next;
}
