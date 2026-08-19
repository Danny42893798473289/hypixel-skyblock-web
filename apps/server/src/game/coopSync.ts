import type { PlayerState } from '@aether/shared';
import { findUserById } from '../store/usersStore.js';

function usernameFor(id: string): string {
  return findUserById(id)?.username ?? 'Unknown';
}

export const MAX_COOP_MEMBERS = 4;
export const COOP_INVITE_MS = 60_000;

export interface CoopInvite {
  hostId: string;
  hostProfileId: string;
  hostUsername: string;
  guestId: string;
  expiresAt: number;
}

const pendingInvites = new Map<string, CoopInvite>();

export function getPendingInvite(guestId: string): CoopInvite | undefined {
  const invite = pendingInvites.get(guestId);
  if (!invite) return undefined;
  if (Date.now() > invite.expiresAt) {
    pendingInvites.delete(guestId);
    return undefined;
  }
  return invite;
}

export function setPendingInvite(invite: CoopInvite): void {
  pendingInvites.delete(invite.guestId);
  pendingInvites.set(invite.guestId, invite);
}

export function clearPendingInvite(guestId: string): void {
  pendingInvites.delete(guestId);
}

export function enrichCoopFields(
  player: PlayerState,
  sessions: Map<string, { player: PlayerState }>,
): void {
  const onlineIds = new Set([...sessions.values()].map((s) => s.player.id));
  if (player.coopHostId) {
    const host = findUserById(player.coopHostId);
    if (!host?.profiles) {
      player.coopMembers = [];
      player.coopIsHost = false;
      return;
    }
    const profileId = player.coopHostProfileId ?? host.activeProfileId ?? 'main';
    const shared = host.profiles[profileId];
    player.coopMembers = [
      { username: host.username, online: onlineIds.has(host.id) },
      ...(shared?.coopMembers ?? []).map((id) => ({
        username: usernameFor(id),
        online: onlineIds.has(id),
      })),
    ];
    player.coopIsHost = false;
    return;
  }
  const self = findUserById(player.id);
  const profileId = player.profileId ?? self?.activeProfileId ?? 'main';
  const profile = self?.profiles?.[profileId];
  player.coopMembers = (profile?.coopMembers ?? []).map((id) => ({
      username: usernameFor(id),
      online: onlineIds.has(id),
    }));
  player.coopIsHost = (profile?.coopMembers?.length ?? 0) > 0;
}

/** Push shared island/bank/minion updates to every online co-op session on this profile. */
export function broadcastCoopIslandSync(
  hostId: string,
  hostProfileId: string,
  shared: { islandBlocks?: PlayerState['islandBlocks']; bank?: PlayerState['bank']; minions?: PlayerState['minions'] },
  sessions: Map<string, { player: PlayerState; socket: import('socket.io').Socket }>,
  push: (session: { player: PlayerState; socket: import('socket.io').Socket }) => void,
  skipPlayerId?: string,
): void {
  for (const session of sessions.values()) {
    if (skipPlayerId && session.player.id === skipPlayerId) continue;
    const isHost = session.player.id === hostId && session.player.profileId === hostProfileId;
    const isGuest = session.player.coopHostId === hostId
      && (session.player.coopHostProfileId ?? hostProfileId) === hostProfileId;
    if (!isHost && !isGuest) continue;
    if (shared.islandBlocks !== undefined) session.player.islandBlocks = shared.islandBlocks;
    if (shared.bank !== undefined) session.player.bank = shared.bank;
    if (shared.minions !== undefined) session.player.minions = shared.minions;
    push(session);
  }
}
