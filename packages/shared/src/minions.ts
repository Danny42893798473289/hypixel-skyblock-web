import type { ItemId } from './items.js';

export type MinionType = 'cobble' | 'wheat' | 'coal' | 'oak';

export interface MinionDef {
  type: MinionType;
  itemId: ItemId;
  produces: ItemId;
  name: string;
  /** Base seconds between productions at tier 1 */
  intervalSec: number;
  storageCap: number;
  color: string;
}

export const MINIONS: Record<MinionType, MinionDef> = {
  cobble: {
    type: 'cobble',
    itemId: 'minion_cobble',
    produces: 'cobble',
    name: 'Cobble Minion',
    intervalSec: 8,
    storageCap: 64,
    color: '#666666',
  },
  wheat: {
    type: 'wheat',
    itemId: 'minion_wheat',
    produces: 'wheat',
    name: 'Wheat Minion',
    intervalSec: 10,
    storageCap: 64,
    color: '#e8c84a',
  },
  coal: {
    type: 'coal',
    itemId: 'minion_coal',
    produces: 'coal',
    name: 'Coal Minion',
    intervalSec: 12,
    storageCap: 64,
    color: '#333333',
  },
  oak: {
    type: 'oak',
    itemId: 'minion_oak',
    produces: 'oak_log',
    name: 'Oak Minion',
    intervalSec: 10,
    storageCap: 64,
    color: '#8b5a2b',
  },
};

export function minionTypeFromItem(itemId: ItemId): MinionType | null {
  for (const m of Object.values(MINIONS)) {
    if (m.itemId === itemId) return m.type;
  }
  return null;
}

export function minionIntervalSec(type: MinionType, tier: number): number {
  const base = MINIONS[type].intervalSec;
  return Math.max(2, base * Math.pow(0.94, Math.max(0, tier - 1)));
}

export function minionStorageCap(type: MinionType, tier: number): number {
  return MINIONS[type].storageCap * (1 + Math.floor((Math.max(1, tier) - 1) / 2));
}

export interface PlacedMinion {
  id: string;
  type: MinionType;
  tier: number;
  x: number;
  y: number;
  storage: number;
  lastTickAt: number;
  fuel?: { itemId: ItemId; expiresAt: number; speedMultiplier: number };
  upgrades?: ItemId[];
}
