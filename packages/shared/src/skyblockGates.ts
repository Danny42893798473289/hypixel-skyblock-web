import type { IslandId } from './locations.js';

export interface SkyblockGate {
  minLevel: number;
  label: string;
}

/** SkyBlock level no longer gates features. */
export const SB_GATES = {} as const satisfies Record<string, SkyblockGate>;

export type SkyblockGateId = keyof typeof SB_GATES;

export function meetsSkyblockGate(_sbLevel: number, _gate: SkyblockGate): boolean {
  return true;
}

export function nextSkyblockUnlock(_sbLevel: number): SkyblockGate | null {
  return null;
}

export function islandExtraGate(_islandId: IslandId): SkyblockGate | null {
  return null;
}
