import type { ClientEvent, MenuId, ServerEvent, PlayerState } from '@aether/shared';
import type { Socket } from 'socket.io';
import { handlePay, parseChatCommand, startTrade, confirmTrade, getTrade, cancelTrade, setTradeCoins, setTradeItem, findTradePartnerId } from '../trade/engine.js';
import { trySpawnSeaCreature } from './seaCreatureSpawn.js';
import {
  plantCrop,
  waterPlot,
  harvestPlot,
  compostCrop,
  upgradeGearStars,
} from './gardenLogic.js';
import { socialXpForVisit, carpentryXpForCraft, essenceForFloor } from '@aether/shared';
import { savePlayer } from '../auth/index.js';
import { setSharedRun, syncMemberRun } from './dungeonPartySync.js';

function emit(socket: Socket, event: ServerEvent): void {
  socket.emit('game', event);
}

function findOnlinePlayer(
  username: string,
  sessions: Map<string, { socket: Socket; player: PlayerState }>,
): { socket: Socket; player: PlayerState } | null {
  const key = username.trim().toLowerCase();
  for (const s of sessions.values()) {
    if (s.player.username.toLowerCase() === key) return s;
  }
  return null;
}

export function handleFeatureEvent(
  session: { socket: Socket; player: PlayerState },
  ev: ClientEvent,
  sessions: Map<string, { socket: Socket; player: PlayerState }>,
  helpers: {
    toast: (s: { player: PlayerState }, msg: string, kind?: string) => void;
    pushState: (s: { player: PlayerState }, opts?: { resetPosition?: boolean }) => void;
    warpPrivateIsland: (s: { player: PlayerState }, host: PlayerState) => void;
    leaveVisit: (s: { player: PlayerState }) => void;
    openMenu?: (s: { player: PlayerState }, menu: MenuId, context?: Record<string, string | number | boolean>) => void;
    closeMenu?: (s: { player: PlayerState }) => void;
    refreshTrade?: (s: { player: PlayerState }) => void;
  },
): boolean {
  switch (ev.type) {
    case 'pay': {
      session.player = handlePay(
        session.player,
        ev.targetUsername,
        ev.amount,
        (name) => findOnlinePlayer(name, sessions)?.player ?? null,
        (id, msg) => {
          const target = [...sessions.values()].find((s) => s.player.id === id);
          if (target) helpers.toast(target, msg, 'success');
        },
      );
      helpers.pushState(session);
      helpers.toast(session, `Paid ${ev.amount.toLocaleString()} coins to ${ev.targetUsername}`, 'success');
      return true;
    }
    case 'visitIsland': {
      const host = findOnlinePlayer(ev.username, sessions);
      if (!host) throw new Error('Player not found or offline');
      helpers.warpPrivateIsland(session, host.player);
      session.player.skills.social += socialXpForVisit();
      helpers.pushState(session, { resetPosition: true });
      helpers.toast(session, `Visiting ${host.player.username}'s island!`, 'success');
      return true;
    }
    case 'tradeRequest': {
      const partner = findOnlinePlayer(ev.targetUsername, sessions);
      if (!partner) throw new Error('Player not found');
      if (partner.player.id === session.player.id) throw new Error('Cannot trade with yourself');
      startTrade(session.player, partner.player);
      helpers.toast(session, `Trade opened with ${partner.player.username}`, 'success');
      helpers.toast(partner, `${session.player.username} wants to trade.`, 'info');
      helpers.refreshTrade?.(session);
      return true;
    }
    case 'tradeOffer': {
      const partnerId = findTradePartnerId(session.player.id);
      if (!partnerId) throw new Error('No active trade');
      setTradeItem(session.player, partnerId, ev.slot, ev.itemSlot);
      if (Number.isFinite(ev.coins) && ev.coins >= 0) {
        setTradeCoins(session.player, partnerId, ev.coins);
      }
      helpers.refreshTrade?.(session);
      return true;
    }
    case 'tradeConfirm': {
      const partnerSession = [...sessions.values()].find((s) =>
        getTrade(session.player.id, s.player.id) != null && s.player.id !== session.player.id,
      );
      if (!partnerSession) throw new Error('No active trade partner online');
      const result = confirmTrade(session.player, partnerSession.player);
      if (result === 'pending') {
        helpers.toast(session, 'Waiting for partner to confirm...', 'info');
        helpers.refreshTrade?.(session);
      } else {
        savePlayer(partnerSession.player);
        helpers.pushState(partnerSession);
        helpers.toast(session, 'Trade complete!', 'success');
        helpers.toast(partnerSession, 'Trade complete!', 'success');
        emit(session.socket, { type: 'tradeClose' });
        emit(partnerSession.socket, { type: 'tradeClose' });
        helpers.closeMenu?.(session);
        helpers.closeMenu?.(partnerSession);
        helpers.pushState(session);
      }
      return true;
    }
    case 'tradeCancel': {
      const partnerId = findTradePartnerId(session.player.id);
      const partner = partnerId ? sessions.get(partnerId) ?? [...sessions.values()].find((s) => s.player.id === partnerId) : undefined;
      if (partnerId) cancelTrade(session.player.id, partnerId);
      emit(session.socket, { type: 'tradeClose' });
      helpers.closeMenu?.(session);
      helpers.toast(session, 'Trade cancelled', 'info');
      if (partner) {
        emit(partner.socket, { type: 'tradeClose' });
        helpers.closeMenu?.(partner);
        helpers.toast(partner, `${session.player.username} cancelled the trade`, 'info');
      }
      return true;
    }
    case 'gardenPlant':
      helpers.toast(session, plantCrop(session.player, ev.plotIndex, ev.crop), 'success');
      helpers.pushState(session);
      return true;
    case 'gardenHarvest':
      helpers.toast(session, harvestPlot(session.player, ev.plotIndex), 'success');
      helpers.pushState(session);
      return true;
    case 'gardenWater':
      helpers.toast(session, waterPlot(session.player, ev.plotIndex), 'success');
      helpers.pushState(session);
      return true;
    case 'gardenCompost':
      helpers.toast(session, compostCrop(session.player, ev.crop, ev.qty), 'success');
      helpers.pushState(session);
      return true;
    case 'upgradeStars':
      helpers.toast(session, upgradeGearStars(session.player, ev.inventorySlot), 'success');
      helpers.pushState(session);
      return true;
    default:
      return false;
  }
}

export function handleFeatureChat(
  session: { socket: Socket; player: PlayerState },
  text: string,
  sessions: Map<string, { socket: Socket; player: PlayerState }>,
  helpers: { toast: (s: { player: PlayerState }, msg: string, kind?: string) => void; pushState: (s: { player: PlayerState }, opts?: { resetPosition?: boolean }) => void },
): boolean {
  const parsed = parseChatCommand(text);
  if (!parsed) return false;
  if (parsed.cmd === 'pay' && parsed.args.length >= 2) {
    const amount = Number(parsed.args[parsed.args.length - 1]);
    const target = parsed.args.slice(0, -1).join(' ');
    handleFeatureEvent(session, { type: 'pay', targetUsername: target, amount }, sessions, {
      ...helpers,
      warpPrivateIsland: () => {},
      leaveVisit: () => {},
    });
    return true;
  }
  if (parsed.cmd === 'visit' && parsed.args[0]) {
    handleFeatureEvent(session, { type: 'visitIsland', username: parsed.args.join(' ') }, sessions, {
      ...helpers,
      warpPrivateIsland: (s, host) => {
        s.player.zoneId = 'island_minions';
        s.player.islandId = 'private_island';
        s.player.x = 8;
        s.player.y = 8;
        (s.player as PlayerState & { visiting?: string }).visiting = host.username;
      },
      leaveVisit: () => {},
    });
    return true;
  }
  if (parsed.cmd === 'trade' && parsed.args[0]) {
    const helpersFull = {
      ...helpers,
      warpPrivateIsland: () => {},
      leaveVisit: () => {},
    };
    if (parsed.args[0] === 'confirm') {
      handleFeatureEvent(session, { type: 'tradeConfirm' }, sessions, helpersFull);
    } else if (parsed.args[0] === 'cancel') {
      handleFeatureEvent(session, { type: 'tradeCancel' }, sessions, helpersFull);
    } else {
      handleFeatureEvent(session, { type: 'tradeRequest', targetUsername: parsed.args.join(' ') }, sessions, helpersFull);
    }
    return true;
  }
  return false;
}

export function afterFishCatch(
  session: { socket: Socket; player: PlayerState },
  fishingSpotId: string,
  fishingLevel: number,
  helpers: { toast: (s: { player: PlayerState }, msg: string, kind?: string) => void; pushState: (s: { player: PlayerState }, opts?: { resetPosition?: boolean }) => void },
): void {
  const spawn = trySpawnSeaCreature(session.player, fishingSpotId, fishingLevel);
  if (!spawn) return;
  session.player.worldMobs = [...(session.player.worldMobs ?? []), spawn];
  emit(session.socket, { type: 'seaCreatureSpawn', name: spawn.label, mobId: spawn.mobId });
  helpers.toast(session, `SEA CREATURE! ${spawn.label} spawned nearby!`, 'success');
  helpers.pushState(session);
}

export function onDungeonPartyJoin(host: { player: PlayerState }, member: { player: PlayerState }): void {
  if (!host.player.dungeonRun) return;
  const shared = syncMemberRun(host.player.id, host.player.dungeonRun);
  member.player.dungeonRun = { ...shared, partyId: host.player.id };
  member.player.dungeonPartyId = host.player.id;
}

export function onDungeonStart(session: { player: PlayerState }): void {
  if (session.player.dungeonRun) setSharedRun(session.player.id, session.player.dungeonRun);
}

export function onCraft(session: { player: PlayerState }, recipeTier = 1): void {
  session.player.skills.carpentry += carpentryXpForCraft(recipeTier);
}

export function grantEssenceOnDungeonComplete(session: { player: PlayerState }, floorId: string): void {
  if (!session.player.essence) session.player.essence = {};
  const type = essenceForFloor(floorId);
  session.player.essence[type] = (session.player.essence[type] ?? 0) + 5 + Math.floor(Math.random() * 10);
}
