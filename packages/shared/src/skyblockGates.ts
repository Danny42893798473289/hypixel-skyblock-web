import type { IslandId } from './locations.js';

export interface SkyblockGate {
  minLevel: number;
  label: string;
}

export const SB_GATES = {
  bazaarInstantSell: { minLevel: 3, label: 'Bazaar instant sell' },
  reforgeAnvil: { minLevel: 5, label: 'Reforge Anvil' },
  enchantTable: { minLevel: 6, label: 'Enchanting Table' },
  auctionHouse: { minLevel: 10, label: 'Auction House' },
  dwarvenMinesWarp: { minLevel: 12, label: 'Dwarven Mines fast travel' },
  dungeonHubWarp: { minLevel: 15, label: 'Dungeon Hub warp' },
} as const satisfies Record<string, SkyblockGate>;

export type SkyblockGateId = keyof typeof SB_GATES;

export function meetsSkyblockGate(sbLevel: number, gate: SkyblockGate): boolean {
  return sbLevel >= gate.minLevel;
}

export function nextSkyblockUnlock(sbLevel: number): SkyblockGate | null {
  const ordered = Object.values(SB_GATES).sort((a, b) => a.minLevel - b.minLevel);
  return ordered.find((gate) => gate.minLevel > sbLevel) ?? null;
}

export function islandExtraGate(islandId: IslandId): SkyblockGate | null {
  if (islandId === 'dwarven_mines') return SB_GATES.dwarvenMinesWarp;
  if (islandId === 'dungeon_hub') return SB_GATES.dungeonHubWarp;
  return null;
}
