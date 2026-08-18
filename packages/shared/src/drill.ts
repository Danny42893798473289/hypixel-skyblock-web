import { ITEMS, type ItemId } from './items.js';
import type { ItemStack } from './inventory.js';
import type { StatBlock } from './stats.js';

type DrillLoreLine = { text: string; color?: 'red' | 'yellow' | 'green' | 'gray' | 'aqua' | 'dark_gray'; bold?: boolean };

export const BIOFUEL_ITEM: ItemId = 'biofuel';
export const BIOFUEL_PER_ITEM = 3000;

export type DrillPartSlot = 'fuelTank' | 'engine' | 'gemstoneFuelTank' | 'gemstoneChamber';

export interface DrillState {
  fuel: number;
  parts: Partial<Record<DrillPartSlot, ItemId>>;
}

export interface DrillPartDef {
  itemId: ItemId;
  slot: DrillPartSlot;
  tier: number;
  name: string;
  fuelCapBonus: number;
  fuelCostReduction: number;
  stats: Partial<StatBlock>;
}

const SLOT_LABEL: Record<DrillPartSlot, string> = {
  fuelTank: 'Fuel Tank',
  engine: 'Drill Engine',
  gemstoneFuelTank: 'Gemstone Fuel Tank',
  gemstoneChamber: 'Gemstone Chamber',
};

const BASE_FUEL_CAP: Record<string, number> = {
  ruby_drill: 3000,
  topaz_drill: 4000,
  jade_drill: 5000,
  amber_drill: 6000,
  sapphire_drill: 8000,
  amethyst_drill: 10000,
  divans_drill: 15000,
};

const PART_TIERS: Array<{
  key: string;
  name: string;
  fuelCap: [number, number];
  engine: Partial<StatBlock>;
  chamber: Partial<StatBlock>;
  costCut: number;
}> = [
  { key: '1', name: 'Mithril-Plated', fuelCap: [1500, 2500], engine: { miningSpeed: 80, miningFortune: 4 }, chamber: { miningFortune: 8, miningSpeed: 20 }, costCut: 1 },
  { key: '2', name: 'Titanium-Plated', fuelCap: [3500, 5000], engine: { miningSpeed: 160, miningFortune: 8 }, chamber: { miningFortune: 16, miningSpeed: 40 }, costCut: 1 },
  { key: '3', name: 'Gemstone', fuelCap: [7000, 10000], engine: { miningSpeed: 280, miningFortune: 14 }, chamber: { miningFortune: 28, miningSpeed: 80 }, costCut: 2 },
  { key: '4', name: 'Perfect', fuelCap: [14000, 20000], engine: { miningSpeed: 450, miningFortune: 22 }, chamber: { miningFortune: 45, miningSpeed: 140 }, costCut: 2 },
  { key: '5', name: "Divan's", fuelCap: [25000, 40000], engine: { miningSpeed: 700, miningFortune: 35 }, chamber: { miningFortune: 70, miningSpeed: 220 }, costCut: 3 },
];

export const DRILL_PARTS: Record<string, DrillPartDef> = {};

for (const [i, tier] of PART_TIERS.entries()) {
  const n = i + 1;
  const fuelId = `fuel_tank_${n}`;
  const engineId = `drill_engine_${n}`;
  const gemTankId = `gemstone_fuel_tank_${n}`;
  const chamberId = `gemstone_chamber_${n}`;
  DRILL_PARTS[fuelId] = {
    itemId: fuelId, slot: 'fuelTank', tier: n, name: `${tier.name} Fuel Tank`,
    fuelCapBonus: tier.fuelCap[0], fuelCostReduction: tier.costCut, stats: {},
  };
  DRILL_PARTS[engineId] = {
    itemId: engineId, slot: 'engine', tier: n, name: `${tier.name} Drill Engine`,
    fuelCapBonus: 0, fuelCostReduction: 0, stats: tier.engine,
  };
  DRILL_PARTS[gemTankId] = {
    itemId: gemTankId, slot: 'gemstoneFuelTank', tier: n, name: `${tier.name} Gemstone Fuel Tank`,
    fuelCapBonus: tier.fuelCap[1], fuelCostReduction: Math.floor(tier.costCut / 2), stats: {},
  };
  DRILL_PARTS[chamberId] = {
    itemId: chamberId, slot: 'gemstoneChamber', tier: n, name: `${tier.name} Gemstone Chamber`,
    fuelCapBonus: 0, fuelCostReduction: 0, stats: tier.chamber,
  };
}

export function isDrillItem(itemId: ItemId): boolean {
  return ITEMS[itemId]?.type === 'DRILL';
}

export function isDrillPart(itemId: ItemId): boolean {
  return Boolean(DRILL_PARTS[itemId]);
}

export function ensureDrillState(stack: ItemStack): DrillState {
  if (!stack.drill) stack.drill = { fuel: 0, parts: {} };
  stack.drill.parts ??= {};
  return stack.drill;
}

export function drillFuelRemaining(stack: ItemStack): number {
  return Math.max(0, Math.floor(stack.drill?.fuel ?? 0));
}

export function drillPartDef(itemId: ItemId | undefined): DrillPartDef | undefined {
  return itemId ? DRILL_PARTS[itemId] : undefined;
}

export function installedPart(stack: ItemStack, slot: DrillPartSlot): DrillPartDef | undefined {
  return drillPartDef(stack.drill?.parts?.[slot]);
}

export function drillFuelCap(stack: ItemStack): number {
  const base = BASE_FUEL_CAP[stack.itemId] ?? 3000;
  let bonus = 0;
  for (const slot of ['fuelTank', 'gemstoneFuelTank'] as DrillPartSlot[]) {
    bonus += installedPart(stack, slot)?.fuelCapBonus ?? 0;
  }
  return base + bonus;
}

export function drillFuelCostPerMine(stack: ItemStack): number {
  let cut = 0;
  for (const slot of ['fuelTank', 'gemstoneFuelTank'] as DrillPartSlot[]) {
    cut += installedPart(stack, slot)?.fuelCostReduction ?? 0;
  }
  return Math.max(1, 8 - cut);
}

export function drillModuleStats(stack: ItemStack): Partial<StatBlock> {
  const stats: Partial<StatBlock> = {};
  for (const slot of Object.keys(SLOT_LABEL) as DrillPartSlot[]) {
    const part = installedPart(stack, slot);
    if (!part) continue;
    for (const [key, amount] of Object.entries(part.stats) as Array<[keyof StatBlock, number]>) {
      stats[key] = (stats[key] ?? 0) + amount;
    }
  }
  return stats;
}

export function drillHasFuel(stack: ItemStack): boolean {
  return !isDrillItem(stack.itemId) || drillFuelRemaining(stack) > 0;
}

export function createDrillStack(itemId: ItemId, inherit?: ItemStack | null): ItemStack {
  const stack: ItemStack = {
    itemId,
    qty: 1,
    uuid: inherit?.uuid ?? `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`,
    reforge: inherit?.reforge,
    enchantments: inherit?.enchantments ? { ...inherit.enchantments } : undefined,
    dungeonStars: inherit?.dungeonStars,
    statBoosts: inherit?.statBoosts ? { ...inherit.statBoosts } : undefined,
    drill: {
      fuel: inherit?.drill?.fuel ?? 0,
      parts: { ...(inherit?.drill?.parts ?? {}) },
    },
  };
  stack.drill!.fuel = Math.min(drillFuelCap(stack), inherit?.drill ? drillFuelRemaining(inherit) : drillFuelCap(stack));
  return stack;
}

export function installDrillPart(drill: ItemStack, partItemId: ItemId): string {
  const part = DRILL_PARTS[partItemId];
  if (!part) throw new Error('That is not a drill part');
  if (!isDrillItem(drill.itemId)) throw new Error('Install parts on a drill');
  const state = ensureDrillState(drill);
  const current = drillPartDef(state.parts[part.slot]);
  if (current && current.tier > part.tier) {
    throw new Error(`${current.name} is already a higher tier`);
  }
  if (current && current.tier === part.tier) {
    throw new Error(`${current.name} is already installed`);
  }
  state.parts[part.slot] = part.itemId;
  state.fuel = Math.min(state.fuel, drillFuelCap(drill));
  return `Installed ${part.name}`;
}

export function drillLoreLines(stack: ItemStack): DrillLoreLine[] {
  if (!isDrillItem(stack.itemId)) return [];
  const cap = drillFuelCap(stack);
  const fuel = drillFuelRemaining(stack);
  const pct = cap > 0 ? Math.round((fuel / cap) * 100) : 0;
  const lines: DrillLoreLine[] = [
    { text: `Fuel: ${fuel.toLocaleString()} / ${cap.toLocaleString()}  (${pct}%)`, color: fuel <= 0 ? 'red' : pct < 25 ? 'yellow' : 'green' },
    { text: `Fuel cost: ${drillFuelCostPerMine(stack)} per mine`, color: 'gray' },
    { text: '' },
    { text: 'Parts', color: 'yellow', bold: true },
  ];
  for (const slot of Object.keys(SLOT_LABEL) as DrillPartSlot[]) {
    const part = installedPart(stack, slot);
    lines.push({
      text: `${SLOT_LABEL[slot]}: ${part ? part.name : 'Empty'}`,
      color: part ? 'aqua' : 'dark_gray',
    });
  }
  if (fuel <= 0) {
    lines.push({ text: '' }, { text: 'Out of fuel — refuel with Biofuel', color: 'red' });
  }
  lines.push({ text: '' });
  return lines;
}
