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

export const DUNGEON_INVITE_MS = 60_000;

interface DungeonInvite {
  hostId: string;
  hostUsername: string;
  guestId: string;
  expiresAt: number;
}

const dungeonInvites = new Map<string, DungeonInvite>();

export function setDungeonInvite(invite: DungeonInvite): void {
  dungeonInvites.set(invite.guestId, invite);
}

export function getDungeonInvite(guestId: string): DungeonInvite | undefined {
  const invite = dungeonInvites.get(guestId);
  if (!invite) return undefined;
  if (Date.now() > invite.expiresAt) {
    dungeonInvites.delete(guestId);
    return undefined;
  }
  return invite;
}

export function clearDungeonInvite(guestId: string): void {
  dungeonInvites.delete(guestId);
}

export function hostedDungeonParties(
  sessions: Map<string, { player: { id: string; username: string; dungeonPartyId?: string | null; dungeonRun?: unknown } }>,
): Array<{ hostId: string; username: string; members: number }> {
  const hosts = [...sessions.values()].filter((s) => s.player.dungeonPartyId === s.player.id && s.player.dungeonRun);
  return hosts.map((host) => ({
    hostId: host.player.id,
    username: host.player.username,
    members: partyMemberIds(host.player.id, sessions).length,
  }));
}
