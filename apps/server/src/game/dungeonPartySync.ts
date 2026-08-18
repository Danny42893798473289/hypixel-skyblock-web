import type { DungeonRunState } from '@aether/shared';

/** Shared dungeon run state keyed by party host id. */
const partyRuns = new Map<string, DungeonRunState>();

export function getSharedRun(hostId: string): DungeonRunState | undefined {
  return partyRuns.get(hostId);
}

export function setSharedRun(hostId: string, run: DungeonRunState): void {
  partyRuns.set(hostId, structuredClone(run));
}

export function clearSharedRun(hostId: string): void {
  partyRuns.delete(hostId);
}

export function syncMemberRun(hostId: string, run: DungeonRunState): DungeonRunState {
  const shared = structuredClone(run);
  partyRuns.set(hostId, shared);
  return shared;
}

export function applyPartyDamage(hostId: string, mobId: string, damage: number): DungeonRunState | null {
  const run = partyRuns.get(hostId);
  if (!run?.mobHp || run.mobHp[mobId] == null) return null;
  run.mobHp[mobId] = Math.max(0, run.mobHp[mobId] - damage);
  partyRuns.set(hostId, run);
  return run;
}

export function applyPartyBossDamage(hostId: string, damage: number): DungeonRunState | null {
  const run = partyRuns.get(hostId);
  if (!run || run.bossHp == null) return null;
  run.bossHp = Math.max(0, run.bossHp - damage);
  partyRuns.set(hostId, run);
  return run;
}

export function partyMemberIds(hostId: string, sessions: Map<string, { player: { id: string; dungeonPartyId?: string | null } }>): string[] {
  return [...sessions.values()]
    .filter((s) => s.player.dungeonPartyId === hostId || s.player.id === hostId)
    .map((s) => s.player.id);
}
