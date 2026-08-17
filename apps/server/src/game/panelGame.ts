import { v4 as uuid } from 'uuid';
import type { Server as SocketServer, Socket } from 'socket.io';
import {
  type ClientEvent,
  type ServerEvent,
  type PlayerState,
  type PlayerPublic,
  type ItemStack,
  type StatBlock,
  type ItemId,
  type IslandId,
  type MenuId,
  MAX_HP,
  ITEMS,
  RECIPES,
  addItem,
  removeItem,
  isRecipeUnlocked,
  miningSpeedBonus,
  farmingFortuneChance,
  combatDamageBonus,
  foragingSpeedBonus,
  fishingSuccessBonus,
  levelFromXp,
  minionTypeFromItem,
  minionIntervalSec,
  minionStorageCap,
  maxMinionSlots,
  MINIONS,
  HOTBAR_SIZE,
  hotbarInventoryIndex,
  hotbarStack,
  isWeaponLikeType,
  zone,
  ZONES,
  ISLANDS,
  findAction,
  islandForZone,
  zonesOnIsland,
  warpableIslands,
  DEFAULT_ZONE,
  DUNGEON_COMBAT_REQUIREMENT,
  REFORGES,
  SLAYERS,
  DUNGEON_FLOORS,
  MOBS,
  buildDungeonRoomMap,
  playerWorldMap,
  DUNGEON_ZONE,
  initRoomMobs,
  dungeonPhase,
  dungeonMobDamage,
  dungeonFloor,
  ENCHANTMENTS_BY_ID,
  enchantAppliesToItem,
  enchantDisplayName,
  enchantTableCost,
  incomingDamage,
  meleeDamage,
  rollCrit,
  rollFortune,
  countItem,
  swapInventorySlots,
  clickInventorySlot,
  insertStack,
  BACKPACK_PAGES,
  normalizeBackpacks,
  islandMap,
  islandMapForZone,
  districtAt,
  districtSpawn,
  districtEntryBlocked,
  canStand,
  nearestEntity,
  ISLAND_BLOCK_CAP,
  islandBlockKey,
  placeableTile,
  tileInFront,
  hasWalkableNeighbor,
  isProtectedIslandSpawn,
  TILE_DROP_ITEM,
  MOVE_SPEED,
  PRESENCE_HZ,
  type Facing,
  type IslandMap,
  npcSellPrice,
  accessoryBagSlots,
  PET_EGGS,
  spawnMobsForZone,
  slayerMatchesMob,
  SLAYER_DROPS,
  mobSpriteId,
  emptyQuestBook,
  collectionProgress,
  COLLECTIONS,
  SKILLS,
  ensureMinionDef,
  starterQuestComplete,
  currentMayor,
  plotReady,
  skyblockXp,
  skyblockLevelFromXp,
} from '@aether/shared';
import { parseChatCommand, findTradePartnerId, getTrade, cancelTrade, setTradeCoins, setTradeItem } from '../trade/engine.js';
import { loadPlayer, savePlayer, takeOfflineInterest, verifyToken } from '../auth/index.js';
import { BANK_TIERS, accrueBankInterest, bankTier, depositLimit, nextBankTier } from './bank.js';
import * as bazaar from '../bazaar/engine.js';
import { registerLivePlayer, unregisterLivePlayer } from './livePlayers.js';
import { buildMenu } from './menus.js';
import { magicalPower, recomputeStats, stackStats } from './profile.js';
import { buyBin, cancelListing, claimAuction, createListing, durationOptions, placeBid } from '../auction/engine.js';
import { onBazaarSynced } from '../hypixel/broadcast.js';
import { getBazaarSyncMeta } from '../hypixel/bazaarSync.js';
import {
  applyLootingToCoins,
  procCombatDamage,
  checkBestiaryMilestone,
  incrementSlayerRng,
} from './enchantCombat.js';
import {
  afterFishCatch,
  grantEssenceOnDungeonComplete,
  handleFeatureChat,
  handleFeatureEvent,
  onCraft as grantCarpentryXp,
  onDungeonPartyJoin,
  onDungeonStart,
} from './featureHandlers.js';
import {
  abilityDamage,
  abilityKey,
  abilityKind,
  effectiveDefense,
  isOnCooldown,
  teleportForward,
} from './abilities.js';
import {
  plantCrop,
  waterPlot,
  harvestPlot,
  compostCrop,
  upgradeGearStars,
  ensureGardenPlots,
} from './gardenLogic.js';
import {
  brewPotion,
  claimCommission,
  donateMuseum,
  ensureMidgame,
  equipWardrobe,
  hatchPetEgg,
  noteGardenHarvest,
  noteMiningCommission,
  npcSellMultiplier,
  placeDragonEye,
  saveWardrobe,
  serveGardenVisitor,
  startKuudra,
  unlockHotmPerk,
} from './midgameLogic.js';

interface Session {
  socket: Socket;
  player: PlayerState;
  lastActionAt: Record<string, number>;
  bazaarItem: ItemId | null;
  currentMenu: MenuId;
  menuContext: Record<string, string | number | boolean>;
  awaitingBazaarSearch: boolean;
  selectedInventorySlot: number | null;
  lastMoveAt: number;
  /** How far the player may still move — absorbs burst packets after lag spikes. */
  moveCredit: number;
  /** Drop predicted walk packets after a teleport/warp so they cannot yank you back. */
  holdPositionUntil: number;
  /** Pre-teleport tile — ignore stale walk packets near here after a snap. */
  rejectMoveUntil: number;
  rejectMoveX: number;
  rejectMoveY: number;
  lastGateWarnAt: number;
  menuOpen: boolean;
  inventoryCursor: ItemStack | null;
  abilityCooldowns: Record<string, number>;
  shieldDefense: number;
  shieldUntil: number;
  lastManaRegenAt: number;
  statsDirty: boolean;
  lastAttackAt: number;
}

const sessions = new Map<string, Session>();

function mapFor(session: Session): IslandMap {
  return playerWorldMap(session.player);
}

function toPublic(p: PlayerState): PlayerPublic {
  return {
    id: p.id,
    username: p.username,
    zoneId: p.zoneId,
    islandId: p.islandId,
    hp: p.hp,
    maxHp: p.maxHp,
    stats: p.stats,
    x: p.x,
    y: p.y,
    facing: p.facing,
  };
}

function emit(socket: Socket, event: ServerEvent): void {
  socket.emit('game', event);
}

type ToastKind = 'info' | 'error' | 'success' | 'loot' | 'rare';

function toast(session: Session, message: string, kind: ToastKind = 'info'): void {
  emit(session.socket, { type: 'toast', message, kind });
}

function rarityToastKind(rarity: string | undefined): 'loot' | 'rare' | 'success' {
  if (rarity === 'LEGENDARY' || rarity === 'MYTHIC' || rarity === 'DIVINE') return 'loot';
  if (rarity === 'RARE' || rarity === 'EPIC') return 'rare';
  return 'success';
}

function isRareRarity(rarity: string | undefined): boolean {
  return ['RARE', 'EPIC', 'LEGENDARY', 'MYTHIC', 'DIVINE', 'SPECIAL', 'VERY_SPECIAL'].includes(rarity ?? '');
}

function grantDropStack(session: Session, itemId: ItemId, qty: number, magicFind = 0): boolean {
  const next = addItem(session.player.inventory, itemId, qty);
  if (!next) return false;
  session.player.inventory = next;
  const before = session.player.collections[itemId] ?? 0;
  session.player.collections[itemId] = before + qty;
  noteCollectionMilestone(session, itemId, before, before + qty);
  const def = ITEMS[itemId];
  if (isRareRarity(def?.rarity)) {
    const mf = magicFind > 0 ? ` (Magic Find: ${magicFind.toFixed(1)})` : '';
    toast(session, `RARE DROP! ${def?.name ?? itemId}${mf}`, rarityToastKind(def?.rarity));
  }
  return true;
}

function rollDropTable(
  session: Session,
  drops: Array<{ itemId: string; chance: number; min: number; max: number }>,
  opts: { guaranteedRare?: boolean } = {},
): Array<{ itemId: ItemId; qty: number }> {
  const magicFind = session.player.stats.magicFind ?? 0;
  const won: Array<{ itemId: ItemId; qty: number }> = [];
  for (const drop of drops) {
    const rare = drop.chance < 0.2;
    const chance = (opts.guaranteedRare && rare ? 1 : drop.chance) * (1 + magicFind / 100);
    if (Math.random() > chance) continue;
    const qty = drop.min + Math.floor(Math.random() * (drop.max - drop.min + 1));
    won.push({ itemId: drop.itemId as ItemId, qty });
  }
  return won;
}

function playerSkyblockLevel(player: PlayerState): number {
  return skyblockLevelFromXp(skyblockXp({
    skills: player.skills,
    collections: player.collections,
    slayerXp: player.slayerXp,
    fairySouls: player.fairySouls,
    museumDonated: player.museum?.donated.length ?? 0,
    bestiaryKills: Object.values(player.bestiary?.kills ?? {}).reduce((sum, n) => sum + n, 0),
  })).level;
}

function markStatsDirty(session: Session): void {
  session.statsDirty = true;
}

function gainSkillXp(session: Session, skill: keyof PlayerState['skills'], amount: number): void {
  if (!amount) return;
  const before = levelFromXp(session.player.skills[skill] ?? 0).level;
  session.player.skills[skill] += amount;
  const after = levelFromXp(session.player.skills[skill] ?? 0);
  if (after.level > before) markStatsDirty(session);
  if (skill === 'taming' || skill === 'social') return;
  const name = SKILLS[skill as keyof typeof SKILLS]?.name ?? String(skill);
  const shown = Number.isInteger(amount) ? String(amount) : amount.toFixed(1);
  emit(session.socket, { type: 'actionBar', text: `+${shown} ${name} (${after.level})` });
}

function playerChat(session: Session, text: string): void {
  emit(session.socket, {
    type: 'chat',
    message: { id: uuid(), username: 'SkyBlock', text, at: Date.now() },
  });
}

function emitMoveCorrection(session: Session, reason: 'blocked' | 'gate' | 'teleport'): void {
  emit(session.socket, {
    type: 'moveCorrection',
    x: session.player.x,
    y: session.player.y,
    facing: session.player.facing,
    reason,
  });
}

function beginPositionSnap(session: Session): void {
  session.rejectMoveX = session.player.x;
  session.rejectMoveY = session.player.y;
  session.rejectMoveUntil = Date.now() + 5000;
  session.holdPositionUntil = Date.now() + 3000;
  session.moveCredit = MOVE_SPEED * 0.25;
  session.lastMoveAt = Date.now();
}

function pushState(session: Session, opts?: { resetPosition?: boolean }): void {
  session.player.islandId = islandForZone(session.player.zoneId);
  if (session.statsDirty) {
    session.player.stats = recomputeStats(session.player);
    session.player.magicalPower = magicalPower(session.player.accessories);
    session.player.accessoryBagSlots = accessoryBagSlots(session.player.fairySouls);
    session.player.maxHp = session.player.stats.health;
    session.player.hp = Math.min(session.player.hp, session.player.maxHp);
    session.player.maxMana = Math.max(100, Math.round(session.player.stats.intelligence));
    session.player.mana = Math.min(session.player.mana, session.player.maxMana);
    session.statsDirty = false;
  }
  session.player.coins = Math.max(0, session.player.coins);
  const cursorMenus: MenuId[] = ['inventory', 'backpack', 'backpack_page'];
  const payload: PlayerState = session.menuOpen && cursorMenus.includes(session.currentMenu)
    ? { ...session.player, inventoryCursor: session.inventoryCursor }
    : { ...session.player };
  if (opts?.resetPosition) {
    payload.resetPosition = true;
    emitMoveCorrection(session, 'teleport');
  }
  emit(session.socket, { type: 'state', player: payload });
  if (session.menuOpen) pushMenu(session);
}

function stashInventoryCursor(session: Session): boolean {
  if (!session.inventoryCursor) return true;
  const next = addItem(session.player.inventory, session.inventoryCursor.itemId, session.inventoryCursor.qty);
  if (!next) {
    toast(session, 'Inventory full — make room for the item you are holding!', 'error');
    return false;
  }
  session.player.inventory = next;
  session.inventoryCursor = null;
  return true;
}

function keepsInventoryCursor(menu: MenuId): boolean {
  return menu === 'inventory' || menu === 'backpack' || menu === 'backpack_page';
}

function backpackPageIndex(session: Session): number {
  const page = Number(session.menuContext.page ?? 0);
  if (!Number.isFinite(page)) return 0;
  return Math.max(0, Math.min(BACKPACK_PAGES - 1, page));
}

/** Respawn with full health at the current district after combat death. */
function handlePlayerDeath(session: Session, message = 'You died!'): void {
  session.player.hp = session.player.maxHp;
  if (session.player.dungeonRun) {
    const map = buildDungeonRoomMap(session.player.dungeonRun);
    beginPositionSnap(session);
    session.player.x = map.spawn.x;
    session.player.y = map.spawn.y;
    session.player.facing = 'right';
    toast(session, `${message} You respawned in the dungeon.`, 'error');
    pushState(session, { resetPosition: true });
    return;
  }
  if (session.player.activeSlayer) {
    session.player.worldMobs = (session.player.worldMobs ?? []).filter((mob) => !mob.slayerBoss);
    session.player.activeSlayer = null;
    toast(session, `${message} Your Slayer quest failed.`, 'error');
  } else {
    toast(session, message, 'error');
  }
  const spawn = districtSpawn(mapFor(session), session.player.zoneId);
  beginPositionSnap(session);
  session.player.x = spawn.x;
  session.player.y = spawn.y;
  session.player.facing = 'down';
  pushState(session, { resetPosition: true });
}

function spendCoins(session: Session, amount: number, label = 'coins'): void {
  if (amount <= 0) return;
  if (session.player.coins < amount) throw new Error(`Need ${amount.toLocaleString()} ${label}`);
  session.player.coins -= amount;
}

function pushMenu(session: Session): void {
  const itemId = typeof session.menuContext.itemId === 'string' ? session.menuContext.itemId : null;
  const book = itemId ? bazaar.getOrderBook(itemId) : null;
  const orders = ['bazaar', 'bazaar_item', 'bazaar_orders'].includes(session.currentMenu)
    ? bazaar.getPlayerOrders(session.player.id)
    : [];
  emit(session.socket, { type: 'menu', menu: buildMenu(session.player, session.currentMenu, session.menuContext, book, orders) });
}

function openMenu(session: Session, menu: MenuId, context: Record<string, string | number | boolean> = {}): void {
  if (keepsInventoryCursor(session.currentMenu) && !keepsInventoryCursor(menu)) {
    if (!stashInventoryCursor(session)) return;
  }
  session.menuOpen = true;
  session.currentMenu = menu;
  session.menuContext = context;
  if (!keepsInventoryCursor(menu)) session.inventoryCursor = null;
  if (menu === 'bazaar' || menu === 'bazaar_item') flagQuest(session, 'open_bazaar');
  if (menu === 'npc_shop' && session.player.zoneId === 'hub_plaza') flagQuest(session, 'talk_adventurer');
  if (menu === 'bazaar_item' && typeof context.itemId === 'string') session.bazaarItem = context.itemId;
  else if (menu !== 'bazaar' && menu !== 'bazaar_orders') session.bazaarItem = null;
  if (menu === 'bazaar_orders') {
    emit(session.socket, { type: 'bazaarOrders', orders: bazaar.getPlayerOrders(session.player.id) });
  }
  pushMenu(session);
}

function emitTradeOpen(target: Session, partner: Session): void {
  const trade = getTrade(target.player.id, partner.player.id);
  if (!trade) return;
  emit(target.socket, {
    type: 'tradeOpen',
    partnerUsername: partner.player.username,
    yourOffer: trade.offers[target.player.id] ?? { coins: 0, items: [null, null, null, null] },
    theirOffer: trade.offers[partner.player.id] ?? { coins: 0, items: [null, null, null, null] },
    yourConfirmed: Boolean(trade.confirmed[target.player.id]),
    theirConfirmed: Boolean(trade.confirmed[partner.player.id]),
  });
}

function refreshTradeMenus(session: Session): void {
  const partnerId = findTradePartnerId(session.player.id);
  if (!partnerId) return;
  const partner = sessions.get(partnerId);
  if (!partner) return;
  emitTradeOpen(session, partner);
  emitTradeOpen(partner, session);
  openMenu(session, 'trade', {
    partnerId,
    partnerUsername: partner.player.username,
    selectedTradeSlot: session.menuContext.selectedTradeSlot ?? '',
  });
  openMenu(partner, 'trade', {
    partnerId: session.player.id,
    partnerUsername: session.player.username,
    selectedTradeSlot: partner.menuContext.selectedTradeSlot ?? '',
  });
}

function closeTradeUi(session: Session): void {
  emit(session.socket, { type: 'tradeClose' });
  if (session.currentMenu === 'trade') {
    session.menuOpen = false;
    session.currentMenu = 'skyblock';
    session.menuContext = {};
  }
}

function cancelActiveTrade(session: Session, message = 'Trade cancelled'): void {
  const partnerId = findTradePartnerId(session.player.id);
  if (!partnerId) return;
  const partner = sessions.get(partnerId);
  cancelTrade(session.player.id, partnerId);
  closeTradeUi(session);
  toast(session, message, 'info');
  if (partner) {
    closeTradeUi(partner);
    toast(partner, `${session.player.username} cancelled the trade`, 'info');
  }
}

function featureHelpers(session: Session) {
  return {
    toast: (s: { player: PlayerState }, msg: string, kind?: string) => toast(s as Session, msg, kind as ToastKind),
    pushState: (s: { player: PlayerState }, opts?: { resetPosition?: boolean }) => pushState(s as Session, opts),
    warpPrivateIsland: (s: { player: PlayerState }, host: PlayerState) => {
      beginPositionSnap(s as Session);
      s.player.zoneId = 'island_minions';
      s.player.islandId = 'private_island';
      s.player.x = 8;
      s.player.y = 8;
      void host;
    },
    leaveVisit: () => {},
    openMenu: (s: { player: PlayerState }, menu: MenuId, context?: Record<string, string | number | boolean>) => {
      openMenu(s as Session, menu, context ?? {});
    },
    closeMenu: (s: { player: PlayerState }) => {
      const target = s as Session;
      target.menuOpen = false;
      target.currentMenu = 'skyblock';
      target.menuContext = {};
    },
    refreshTrade: (s: { player: PlayerState }) => refreshTradeMenus(s as Session),
  };
}

/** Everyone on the same island shares one walkable map, so presence is island-wide. */
function broadcastZonePresence(): void {
  for (const s of sessions.values()) {
    const players = [...sessions.values()]
      .filter((other) => other.player.islandId === s.player.islandId)
      .map((other) => toPublic(other.player));
    emit(s.socket, { type: 'zonePlayers', players });
  }
}

function publishBazaar(itemId: ItemId): void {
  const book = bazaar.getOrderBook(itemId);
  for (const s of sessions.values()) {
    if (!s.menuOpen) continue;
    if (s.bazaarItem === itemId) {
      emit(s.socket, { type: 'bazaarBook', book });
    }
    if (['bazaar', 'bazaar_item', 'bazaar_orders'].includes(s.currentMenu)) {
      emit(s.socket, { type: 'bazaarOrders', orders: bazaar.getPlayerOrders(s.player.id) });
    }
    const refreshItem = s.currentMenu === 'bazaar_item' && s.bazaarItem === itemId;
    const refreshOrders = s.currentMenu === 'bazaar_orders';
    const refreshHub = s.currentMenu === 'bazaar';
    if (refreshItem || refreshOrders || refreshHub) pushMenu(s);
  }
}

function publishBazaarMeta(): void {
  const meta = getBazaarSyncMeta();
  for (const s of sessions.values()) {
    emit(s.socket, { type: 'bazaarMeta', meta });
  }
}

function publishBazaarSync(): void {
  publishBazaarMeta();
  const items = new Set<ItemId>();
  for (const s of sessions.values()) {
    if (s.bazaarItem) items.add(s.bazaarItem);
  }
  for (const itemId of items) publishBazaar(itemId);
}

function skillLevel(player: PlayerState, skill: keyof PlayerState['skills']): number {
  return levelFromXp(player.skills[skill]).level;
}

function meetsSkillReq(player: PlayerState, req?: { skill: keyof PlayerState['skills']; level: number }): boolean {
  if (!req) return true;
  return skillLevel(player, req.skill) >= req.level;
}

function bestToolStack(
  player: PlayerState,
  toolType: 'pickaxe' | 'axe' | 'hoe' | 'sword' | 'rod',
): ItemStack | null {
  let best: ItemStack | null = null;
  let bestTier = -1;
  let bestDamage = -1;
  for (const stack of player.inventory) {
    if (!stack) continue;
    const def = ITEMS[stack.itemId];
    if (!def || def.toolType !== toolType) continue;
    const tier = def.toolTier ?? 0;
    const damage = def.damage ?? 0;
    if (tier > bestTier || (tier === bestTier && damage > bestDamage)) {
      best = stack;
      bestTier = tier;
      bestDamage = damage;
    }
  }
  return best;
}

function toolStatsForSkill(player: PlayerState, skill?: string): Partial<StatBlock> {
  const type = skill === 'mining' ? 'pickaxe' : skill === 'foraging' ? 'axe' : skill === 'farming' ? 'hoe' : null;
  if (!type) return {};
  const held = hotbarStack(player.inventory, player.hotbarSlot);
  if (held && ITEMS[held.itemId]?.toolType === type) return {};
  return stackStats(bestToolStack(player, type));
}

function bestTool(
  player: PlayerState,
  toolType?: 'pickaxe' | 'axe' | 'hoe' | 'sword' | 'rod',
) {
  let best: { toolType?: string; toolTier?: number; damage?: number; itemId?: ItemId } = {};
  for (const stack of player.inventory) {
    if (!stack) continue;
    const def = ITEMS[stack.itemId];
    if (!def) continue;
    if (toolType && def.toolType !== toolType) continue;
    if ((def.toolTier ?? 0) > (best.toolTier ?? 0) || (def.damage ?? 0) > (best.damage ?? 0)) {
      best = { toolType: def.toolType, toolTier: def.toolTier, damage: def.damage, itemId: stack.itemId };
    }
  }
  return best;
}

function playerWeaponDamage(player: PlayerState): number {
  const stack = hotbarStack(player.inventory, player.hotbarSlot);
  if (stack) {
    const def = ITEMS[stack.itemId];
    if (def?.damage) return def.damage * (1 + 0.1 * (stack.dungeonStars ?? 0));
  }
  return bestTool(player, 'sword').damage ?? 5;
}

function swapInventoryWithHotbar(session: Session, inventoryIndex: number, hotbarSlot = session.player.hotbarSlot): void {
  const hbIndex = hotbarInventoryIndex(hotbarSlot);
  const inv = [...session.player.inventory];
  [inv[inventoryIndex], inv[hbIndex]] = [inv[hbIndex], inv[inventoryIndex]];
  session.player.inventory = inv;
  pushState(session);
}

function catchUpMinions(player: PlayerState): Array<{ name: string; gained: number; storage: number; cap: number }> {
  const now = Date.now();
  const report: Array<{ name: string; gained: number; storage: number; cap: number }> = [];
  for (const m of player.minions) {
    const def = ensureMinionDef(m.type);
    const interval = minionIntervalSec(m.type, m.tier) * 1000;
    const speed = m.fuel && m.fuel.expiresAt > now ? m.fuel.speedMultiplier : 1;
    const cap = minionStorageCap(m.type, m.tier);
    const before = m.storage;
    while (m.lastTickAt + interval / speed <= now && m.storage < cap) {
      m.lastTickAt += interval / speed;
      m.storage += 1;
    }
    if (m.storage >= cap) m.lastTickAt = now;
    const gained = m.storage - before;
    if (gained > 0) report.push({ name: def.name, gained, storage: m.storage, cap });
  }
  return report;
}

export function initGame(serverIo: SocketServer): void {
  bazaar.onBazaarFill((playerId) => {
    const s = sessions.get(playerId);
    if (!s) return;
    emit(s.socket, { type: 'state', player: s.player });
    toast(s, 'Bazaar order filled!', 'success');
    if (s.bazaarItem) publishBazaar(s.bazaarItem);
  });

  onBazaarSynced(() => publishBazaarSync());

  serverIo.on('connection', (socket) => {
    const token = socket.handshake.auth?.token as string | undefined;
    const userId = verifyToken(token);
    if (!userId) {
      socket.emit('game', { type: 'toast', message: 'Auth failed', kind: 'error' } satisfies ServerEvent);
      socket.disconnect(true);
      return;
    }

    const existing = sessions.get(userId);
    if (existing) existing.socket.disconnect(true);

    const player = loadPlayer(userId);
    if (!player) {
      socket.disconnect(true);
      return;
    }

    const session: Session = {
      socket,
      player,
      lastActionAt: {},
      bazaarItem: null,
      currentMenu: 'skyblock',
      menuContext: {},
      awaitingBazaarSearch: false,
      selectedInventorySlot: null,
      lastMoveAt: Date.now(),
      moveCredit: MOVE_SPEED * 0.25,
      holdPositionUntil: 0,
      rejectMoveUntil: 0,
      rejectMoveX: 0,
      rejectMoveY: 0,
      lastGateWarnAt: 0,
      menuOpen: false,
      inventoryCursor: null,
      abilityCooldowns: {},
      shieldDefense: 0,
      shieldUntil: 0,
      lastManaRegenAt: Date.now(),
      statsDirty: false,
      lastAttackAt: 0,
    };
    if (session.player.mana == null || Number.isNaN(session.player.mana)) {
      session.player.mana = session.player.maxMana ?? session.player.stats.intelligence;
    }
    if (!session.player.quests) session.player.quests = emptyQuestBook();
    ensureMidgame(session.player);
    ensureWorldMobs(session);
    pushState(session);
    sessions.set(userId, session);
    registerLivePlayer(
      userId,
      () => session.player,
      (fn) => {
        const result = fn(session.player);
        if (result) session.player = result;
      },
    );
    const minionReport = catchUpMinions(session.player);
    savePlayer(session.player);
    emit(socket, { type: 'welcome', player: session.player, token: token! });
    emit(socket, { type: 'bazaarMeta', meta: getBazaarSyncMeta() });
    const offlineInterest = takeOfflineInterest(userId);
    if (offlineInterest > 0) {
      toast(session, `Your bank earned ${offlineInterest.toLocaleString()} coins of interest while you were away!`, 'success');
    }
    if (minionReport.length) {
      const summary = minionReport.map((entry) => `${entry.name} +${entry.gained}`).join(', ');
      toast(session, `Your minions worked while you were away: ${summary}`, 'loot');
      if (minionReport.some((entry) => entry.storage >= entry.cap)) {
        toast(session, 'A minion is full — collect it on your island!', 'success');
      }
    }
    broadcastZonePresence();

    socket.on('game', (raw: ClientEvent) => {
      try {
        handleEvent(session, raw);
      } catch (err) {
        toast(session, err instanceof Error ? err.message : 'Action failed', 'error');
      }
    });

    socket.on('disconnect', () => {
      if (sessions.get(userId)?.socket === socket) {
        savePlayer(session.player);
        sessions.delete(userId);
        unregisterLivePlayer(userId);
        broadcastZonePresence();
      }
    });
  });

  setInterval(minionTick, 1000);
  setInterval(worldMobTick, 1000);
  setInterval(broadcastZonePresence, Math.round(1000 / PRESENCE_HZ));
  setInterval(bankInterestTick, 60_000);
  setInterval(() => {
    for (const s of sessions.values()) savePlayer(s.player);
  }, 15000);
}

function handleEvent(session: Session, ev: ClientEvent): void {
  switch (ev.type) {
    case 'openMenu':
      openMenu(session, ev.menu, ev.context ?? {});
      break;
    case 'closeMenu':
      if (session.currentMenu === 'trade') cancelActiveTrade(session);
      if (keepsInventoryCursor(session.currentMenu) && !stashInventoryCursor(session)) break;
      session.menuOpen = false;
      session.currentMenu = 'skyblock';
      session.menuContext = {};
      session.bazaarItem = null;
      session.awaitingBazaarSearch = false;
      session.inventoryCursor = null;
      pushState(session);
      break;
    case 'menuClick':
      handleMenuClick(session, ev.action, ev.button);
      break;
    case 'move':
      handleMove(session, ev.x, ev.y, ev.facing);
      break;
    case 'interact':
      handleWorldInteract(session);
      break;
    case 'attack':
      handleAttack(session);
      break;
    case 'useAbility':
      doUseAbility(session);
      break;
    case 'travel':
      doTravel(session, ev.zoneId);
      break;
    case 'warpIsland':
      doWarpIsland(session, ev.islandId);
      break;
    case 'doAction':
      doAction(session, ev.actionId, ev.times ?? 1);
      break;
    case 'setHotbar':
      if (ev.slot >= 0 && ev.slot < HOTBAR_SIZE) {
        session.player.hotbarSlot = ev.slot;
        markStatsDirty(session);
        pushState(session);
      }
      break;
    case 'dropHotbar':
      doDropHotbar(session, Boolean(ev.all));
      break;
    case 'placeBlock':
      doPlaceBlock(session);
      break;
    case 'breakBlock':
      doBreakBlock(session);
      break;
    case 'useItem':
      doUseItem(session, 'slot' in ev ? ev.slot : undefined);
      break;
    case 'craft':
      doCraft(session, ev.recipeId);
      break;
    case 'placeMinion':
      doPlaceMinion(session, ev.minionType);
      break;
    case 'collectMinion':
      doCollectMinion(session, ev.minionId);
      break;
    case 'upgradeMinion':
      doUpgradeMinion(session, ev.minionId);
      break;
    case 'pickupMinion':
      doPickupMinion(session, ev.minionId);
      break;
    case 'npcBuy':
      doNpcBuy(session, ev.itemId, ev.qty);
      break;
    case 'npcSell':
      doNpcSell(session, ev.itemId, ev.qty);
      break;
    case 'bazaarBuyOrder': {
      const r = bazaar.placeBuyOrder(session.player, ev.itemId, ev.price, ev.qty);
      session.player = r.player;
      pushState(session);
      publishBazaar(ev.itemId);
      toast(session, 'Buy order placed', 'success');
      break;
    }
    case 'bazaarSellOrder': {
      const r = bazaar.placeSellOrder(session.player, ev.itemId, ev.price, ev.qty);
      session.player = r.player;
      pushState(session);
      publishBazaar(ev.itemId);
      toast(session, 'Sell order placed', 'success');
      break;
    }
    case 'bazaarInstantBuy': {
      const r = bazaar.instantBuy(session.player, ev.itemId, ev.qty, ev.maxPrice);
      session.player = r.player;
      pushState(session);
      publishBazaar(ev.itemId);
      toast(session, `Bought ${r.filled} for ${r.spent.toFixed(1)} coins`, 'success');
      break;
    }
    case 'bazaarInstantSell': {
      const r = bazaar.instantSell(session.player, ev.itemId, ev.qty, ev.minPrice);
      session.player = r.player;
      pushState(session);
      publishBazaar(ev.itemId);
      toast(session, `Sold ${r.filled} for ${r.earned.toFixed(1)} coins`, 'success');
      break;
    }
    case 'bazaarCancel': {
      session.player = bazaar.cancelOrder(session.player, ev.orderId);
      pushState(session);
      emit(session.socket, { type: 'bazaarOrders', orders: bazaar.getPlayerOrders(session.player.id) });
      if (session.bazaarItem) publishBazaar(session.bazaarItem);
      else if (session.menuOpen) pushMenu(session);
      toast(session, 'Order cancelled', 'info');
      break;
    }
    case 'bazaarSubscribe': {
      session.bazaarItem = ev.itemId;
      if (ev.itemId) {
        emit(session.socket, { type: 'bazaarBook', book: bazaar.getOrderBook(ev.itemId) });
        emit(session.socket, { type: 'bazaarOrders', orders: bazaar.getPlayerOrders(session.player.id) });
        if (session.menuOpen && session.currentMenu === 'bazaar_item') pushMenu(session);
      }
      break;
    }
    case 'chat': {
      const text = ev.text.trim().slice(0, 120);
      if (!text) break;
      if (session.awaitingBazaarSearch && !text.startsWith('/')) {
        session.awaitingBazaarSearch = false;
        openMenu(session, 'bazaar', { query: text, page: 0 });
        toast(session, `Searching Bazaar for "${text}"`, 'info');
        break;
      }
      if (handleSkyblockChat(session, text)) break;
      if (handleFeatureChat(session, text, sessions, featureHelpers(session))) break;
      const message = { id: uuid(), username: session.player.username, text, at: Date.now() };
      for (const s of sessions.values()) {
        if (s.player.islandId === session.player.islandId) {
          emit(s.socket, { type: 'chat', message });
        }
      }
      break;
    }
    case 'swapSlots': {
      const { a, b } = ev;
      if (a < 0 || b < 0 || a >= session.player.inventory.length || b >= session.player.inventory.length) break;
      const inv = [...session.player.inventory];
      [inv[a], inv[b]] = [inv[b], inv[a]];
      session.player.inventory = inv;
      pushState(session);
      break;
    }
    default:
      if (handleFeatureEvent(session, ev, sessions, featureHelpers(session))) break;
  }
}

function handleMove(session: Session, x: number, y: number, facing: Facing): void {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  const now = Date.now();
  if (now < session.rejectMoveUntil) {
    const nearStale = Math.hypot(x - session.rejectMoveX, y - session.rejectMoveY) < 2.5;
    if (nearStale) return;
  }
  if (now < session.holdPositionUntil) {
    const away = Math.hypot(x - session.player.x, y - session.player.y);
    // In-flight walk packets still carry the pre-teleport tile. Ignore those; allow
    // a couple tiles of real walking from the new spot.
    if (away > 3) return;
  }
  const elapsed = Math.max(0, Math.min(1500, now - session.lastMoveAt));
  session.lastMoveAt = now;

  // Credit absorbs FRP lag bursts and Shift sprint (~1.3× walk speed).
  session.moveCredit = Math.min(
    MOVE_SPEED * 2.5,
    session.moveCredit + MOVE_SPEED * 1.35 * (elapsed / 1000),
  );

  let dx = x - session.player.x;
  let dy = y - session.player.y;
  let distance = Math.hypot(dx, dy);
  if (distance < 0.001) {
    session.player.facing = facing;
    return;
  }

  const map = mapFor(session);

  const district = districtAt(map, x, y);
  const gated = district && district.zoneId !== session.player.zoneId ? ZONES[district.zoneId] : null;
  if (gated && !meetsSkillReq(session.player, gated.skillReq)) {
    emitMoveCorrection(session, 'gate');
    if (now - session.lastGateWarnAt > 4000) {
      session.lastGateWarnAt = now;
      toast(session, `${gated.name} requires ${gated.skillReq!.skill} level ${gated.skillReq!.level}`, 'error');
    }
    return;
  }

  if (!canStand(map, x, y)) {
    emitMoveCorrection(session, 'blocked');
    return;
  }

  if (distance > session.moveCredit + 0.35) {
    const scale = session.moveCredit / distance;
    if (scale <= 0.02) return;
    x = session.player.x + dx * scale;
    y = session.player.y + dy * scale;
    if (!canStand(map, x, y)) {
      emitMoveCorrection(session, 'blocked');
      return;
    }
    dx = x - session.player.x;
    dy = y - session.player.y;
    distance = Math.hypot(dx, dy);
  }

  session.moveCredit -= distance;
  session.player.x = x;
  session.player.y = y;
  session.player.facing = facing;

  // Passive mana regen while moving (~8% max mana per second).
  const manaElapsed = Math.max(0, Math.min(2000, now - session.lastManaRegenAt));
  if (manaElapsed > 0) {
    session.lastManaRegenAt = now;
    const regen = session.player.maxMana * (manaElapsed / 1000) * 0.08;
    session.player.mana = Math.min(session.player.maxMana, session.player.mana + regen);
  }

  if (district && district.zoneId !== session.player.zoneId) {
    session.player.zoneId = district.zoneId;
    if (!session.player.visitedZones.includes(district.zoneId)) session.player.visitedZones.push(district.zoneId);
    ensureWorldMobs(session);
    pushState(session);
    toast(session, `Entering ${district.name}`, 'info');
  }
}

const WARP_ALIASES: Record<string, IslandId> = {
  hub: 'hub',
  home: 'private_island',
  island: 'private_island',
  private: 'private_island',
  barn: 'barn',
  gold: 'gold_mine',
  goldmine: 'gold_mine',
  gold_mine: 'gold_mine',
  deep: 'deep_caverns',
  caverns: 'deep_caverns',
  deepcaverns: 'deep_caverns',
  deep_caverns: 'deep_caverns',
  spider: 'spider_den',
  spiders: 'spider_den',
  spider_den: 'spider_den',
  park: 'park',
  forest: 'park',
  desert: 'mushroom_desert',
  mushroom: 'mushroom_desert',
  mushroom_desert: 'mushroom_desert',
  end: 'the_end',
  theend: 'the_end',
  the_end: 'the_end',
  crimson: 'crimson_isle',
  nether: 'crimson_isle',
  crimson_isle: 'crimson_isle',
  dungeon: 'dungeon_hub',
  dungeons: 'dungeon_hub',
  catacombs: 'dungeon_hub',
  dungeon_hub: 'dungeon_hub',
  garden: 'garden',
  mines: 'dwarven_mines',
  dwarven: 'dwarven_mines',
  dwarven_mines: 'dwarven_mines',
  crystals: 'crystal_hollows',
  crystal: 'crystal_hollows',
  ch: 'crystal_hollows',
  crystal_hollows: 'crystal_hollows',
  hollows: 'crystal_hollows',
  rift: 'rift',
};

function resolveWarpTarget(raw: string): IslandId | null {
  const key = raw.trim().toLowerCase().replace(/\s+/g, '_');
  if (!key) return null;
  return WARP_ALIASES[key] ?? (key in ISLANDS ? (key as IslandId) : null);
}

function handleSkyblockChat(session: Session, text: string): boolean {
  const parsed = parseChatCommand(text);
  if (!parsed) return false;
  const { cmd, args } = parsed;
  try {
    if (cmd === 'warp' || cmd === 'is') {
      const islandId = resolveWarpTarget(args.join(' '));
      if (!islandId) {
        toast(session, 'Unknown warp. Try /warp hub, /warp island, /warp garden', 'error');
        return true;
      }
      doWarpIsland(session, islandId);
      return true;
    }
    if (cmd === 'hub') {
      doWarpIsland(session, 'hub');
      return true;
    }
    if (cmd === 'ah' || cmd === 'auction') {
      openMenu(session, 'auction');
      return true;
    }
    if (cmd === 'bz' || cmd === 'bazaar') {
      const query = args.join(' ').trim();
      openMenu(session, 'bazaar', query ? { query, page: 0 } : {});
      return true;
    }
    if (cmd === 'leave' || cmd === 'quit') {
      leaveActiveRun(session);
      return true;
    }
  } catch (err) {
    toast(session, err instanceof Error ? err.message : 'Command failed', 'error');
    return true;
  }
  return false;
}

function combatEntity(session: Session, entity: { kind: string; actionId?: string }): boolean {
  if (entity.kind !== 'mob' || !entity.actionId) return false;
  if (entity.actionId.startsWith('dungeon:mob:')) {
    doDungeonMobCombat(session, entity.actionId.slice('dungeon:mob:'.length));
    return true;
  }
  if (entity.actionId === 'dungeon:boss') {
    doDungeonBossCombat(session);
    return true;
  }
  if (entity.actionId.startsWith('worldmob:')) {
    attackWorldMob(session, entity.actionId.slice('worldmob:'.length));
    return true;
  }
  if (entity.actionId.startsWith('slayerboss:')) {
    attackWorldMob(session, entity.actionId.slice('slayerboss:'.length));
    return true;
  }
  doAction(session, entity.actionId, 1);
  return true;
}

function handleAttack(session: Session): void {
  const now = Date.now();
  if (now - session.lastAttackAt < 280) return;
  session.lastAttackAt = now;
  const map = mapFor(session);
  const entity = nearestEntity(map, session.player.x, session.player.y, 2.4);
  if (!entity || entity.kind !== 'mob') return;
  if (ZONES[entity.zoneId]) session.player.zoneId = entity.zoneId;
  combatEntity(session, entity);
}

function handleWorldInteract(session: Session): void {
  const map = mapFor(session);
  const entity = nearestEntity(map, session.player.x, session.player.y);
  if (!entity) throw new Error('Nothing nearby to interact with');

  // Interactions belong to the entity's district, not wherever the player is standing.
  if (ZONES[entity.zoneId]) session.player.zoneId = entity.zoneId;

  if (entity.kind === 'door' && entity.actionId?.startsWith('dungeon:')) {
    handleDungeonDoor(session);
    return;
  }
  if (combatEntity(session, entity)) return;
  if ((entity.kind === 'npc' || entity.kind === 'station') && entity.menu) {
    if (entity.kind === 'npc' && session.player.zoneId === 'hub_plaza') flagQuest(session, 'talk_adventurer');
    openMenu(session, entity.menu);
    return;
  }
  if (entity.kind === 'resource' && entity.actionId) {
    const act = findAction(session.player.zoneId, entity.actionId);
    if (act && act.kind !== 'combat') {
      startOrContinueGather(session, entity.id, act);
      return;
    }
    doAction(session, entity.actionId, 1);
    return;
  }
  if (entity.kind === 'fairy' && entity.actionId === 'dungeon:secret') {
    claimDungeonSecret(session);
    return;
  }
  if (entity.kind === 'fairy') {
    if (session.player.visitedZones.includes(entity.id)) throw new Error('You already found this Fairy Soul');
    session.player.visitedZones.push(entity.id);
    session.player.fairySouls++;
    markStatsDirty(session);
    const slots = accessoryBagSlots(session.player.fairySouls);
    pushState(session);
    toast(session, `SOUL! Fairy Soul found! (${session.player.fairySouls} total) — Accessory Bag: ${slots} slots`, 'success');
  }
}

function handleMenuClick(
  session: Session,
  action: string | undefined,
  button: 'left' | 'right' | 'shift_left' | 'shift_right',
): void {
  if (!action || action === 'close') return;
  const [kind, ...parts] = action.split(':');
  const value = parts.join(':');

  if (kind === 'open') {
    const nextMenu = value as MenuId;
    if (session.currentMenu === 'trade' && nextMenu !== 'trade') {
      cancelActiveTrade(session);
    }
    const context: Record<string, string | number | boolean> = nextMenu === 'bazaar_orders' && session.menuContext.itemId
      ? { itemId: String(session.menuContext.itemId) }
      : {};
    openMenu(session, nextMenu, context);
    return;
  }
  if (kind === 'collection') {
    openMenu(session, 'collections', { category: value, page: 0 });
    return;
  }
  if (kind === 'recipes') {
    openMenu(session, 'crafting', { category: value, page: 0 });
    return;
  }
  if (kind === 'page') {
    const [menu, page, params] = value.split('|');
    const context: Record<string, string | number | boolean> = { page: Number(page) || 0 };
    for (const pair of (params ?? '').split(',')) {
      if (!pair) continue;
      const eq = pair.indexOf('=');
      const key = eq >= 0 ? pair.slice(0, eq) : pair;
      const entry = eq >= 0 ? pair.slice(eq + 1) : '';
      if (!key) continue;
      try {
        context[key] = decodeURIComponent(entry);
      } catch {
        context[key] = entry;
      }
    }
    openMenu(session, menu as MenuId, context);
    return;
  }
  if (kind === 'inventoryClick') {
    handleInventoryClick(session, Number(value), button);
    return;
  }
  if (kind === 'backpack') {
    const [op, arg] = value.split(':');
    if (op === 'open') {
      openMenu(session, 'backpack_page', { page: Number(arg) || 0 });
    } else if (op === 'click') {
      handleBackpackClick(session, Number(arg), button);
    }
    return;
  }
  if (kind === 'inventoryUseCursor') {
    useHeldItem(session);
    return;
  }
  if (kind === 'inventorySwap') {
    const [fromRaw, toRaw] = value.split('@');
    const from = Number(fromRaw);
    const to = Number(toRaw);
    if (!Number.isFinite(from) || !Number.isFinite(to)) throw new Error('Invalid inventory move');
    session.player.inventory = swapInventorySlots(session.player.inventory, from, to);
    pushState(session);
    return;
  }
  if (kind === 'inventory') {
    useInventorySlot(session, Number(value), button);
    return;
  }
  if (kind === 'travel') return doTravel(session, value);
  if (kind === 'warp') return doWarpIsland(session, value as IslandId);
  if (kind === 'action') return doAction(session, value, button.startsWith('shift') ? 5 : 1);
  if (kind === 'craft') return doCraft(session, value);
  if (kind === 'npcBuy') return doNpcBuy(session, value, button === 'right' ? 64 : 1);
  if (kind === 'npcSell') return doNpcSell(session, value, button === 'right' ? 64 : 1);
  if (kind === 'unequip') {
    const equipmentSlot = value as keyof PlayerState['equipment'];
    const stack = session.player.equipment[equipmentSlot];
    if (!stack) return;
    const next = addItem(session.player.inventory, stack.itemId, stack.qty);
    if (!next) throw new Error('Inventory full');
    session.player.inventory = next;
    session.player.equipment[equipmentSlot] = null;
    markStatsDirty(session);
    pushState(session);
    return;
  }
  if (kind === 'accessory') {
    const index = Number(value);
    const stack = session.player.accessories[index];
    if (!stack) return;
    const next = addItem(session.player.inventory, stack.itemId, stack.qty);
    if (!next) throw new Error('Inventory full');
    session.player.inventory = next;
    session.player.accessories.splice(index, 1);
    markStatsDirty(session);
    pushState(session);
    return;
  }
  if (kind === 'pet') {
    const index = Number(value);
    if (!session.player.pets[index]) return;
    session.player.pets.forEach((pet, i) => { pet.active = i === index && !pet.active; });
    markStatsDirty(session);
    pushState(session);
    toast(session, session.player.pets[index].active ? 'Pet summoned!' : 'Pet despawned.', 'success');
    return;
  }
  if (kind === 'profile') {
    const target = loadPlayer(value);
    if (!target) throw new Error('Player not found');
    emit(session.socket, { type: 'menu', menu: buildMenu(target, 'profile') });
    return;
  }
  if (kind === 'bank') return doBankAction(session, value);
  if (kind === 'bazaarSection') {
    session.awaitingBazaarSearch = false;
    openMenu(session, 'bazaar', { section: value, page: 0 });
    return;
  }
  if (kind === 'bazaarSearch') {
    const query = value.trim();
    if (query) {
      session.awaitingBazaarSearch = false;
      openMenu(session, 'bazaar', { query, page: 0 });
      return;
    }
    session.awaitingBazaarSearch = true;
    toast(session, 'Type an item name in chat to search the Bazaar.', 'info');
    return;
  }
  if (kind === 'bazaarSellInventory') {
    const result = bazaar.instantSellInventory(session.player);
    session.player = result.player;
    pushState(session);
    for (const itemId of result.itemIds) publishBazaar(itemId);
    pushMenu(session);
    toast(
      session,
      `Sold ${result.filled.toLocaleString()} items (${result.kinds} types) for ${result.earned.toFixed(1)} coins`,
      'success',
    );
    return;
  }
  if (kind === 'dungeonMode') {
    openMenu(session, 'dungeons', { mode: value });
    return;
  }
  if (kind === 'bazaar') {
    session.bazaarItem = value;
    openMenu(session, 'bazaar_item', { itemId: value });
    return;
  }
  if (kind === 'bazaarCancel') {
    session.player = bazaar.cancelOrder(session.player, value);
    pushState(session);
    emit(session.socket, { type: 'bazaarOrders', orders: bazaar.getPlayerOrders(session.player.id) });
    if (session.bazaarItem) publishBazaar(session.bazaarItem);
    else pushMenu(session);
    toast(session, 'Order cancelled', 'info');
    return;
  }
  if (kind === 'bazaarBuyAt' || kind === 'bazaarSellAt') {
    const [itemId, priceRaw] = value.split('@');
    const price = Number(priceRaw);
    if (!itemId || !Number.isFinite(price) || price <= 0) throw new Error('Invalid order price');
    if (kind === 'bazaarBuyAt') {
      session.player = bazaar.placeBuyOrder(session.player, itemId as ItemId, price, 64).player;
    } else {
      const amount = Math.min(64, countItem(session.player.inventory, itemId as ItemId));
      if (amount <= 0) throw new Error('You do not have this item');
      session.player = bazaar.placeSellOrder(session.player, itemId as ItemId, price, amount).player;
    }
    pushState(session);
    publishBazaar(itemId as ItemId);
    toast(session, 'Bazaar order placed.', 'success');
    return;
  }
  if (kind.startsWith('bazaar')) {
    const itemId = value;
    const book = bazaar.getOrderBook(itemId);
    const qty = button === 'right' ? 64 : 1;
    if (kind === 'bazaarBuy') session.player = bazaar.instantBuy(session.player, itemId, qty).player;
    if (kind === 'bazaarSell') session.player = bazaar.instantSell(session.player, itemId, Math.min(qty, countItem(session.player.inventory, itemId))).player;
    if (kind === 'bazaarBuyOrder') {
      const price = (book.bestBid ?? book.bestAsk ?? 1) + 0.1;
      session.player = bazaar.placeBuyOrder(session.player, itemId, price, 64).player;
    }
    if (kind === 'bazaarSellOrder') {
      const amount = Math.min(64, countItem(session.player.inventory, itemId));
      if (amount <= 0) throw new Error('You do not have this item');
      const price = Math.max(0.1, (book.bestAsk ?? book.bestBid ?? 1) - 0.1);
      session.player = bazaar.placeSellOrder(session.player, itemId, price, amount).player;
    }
    pushState(session);
    publishBazaar(itemId);
    toast(session, 'Bazaar order completed.', 'success');
    return;
  }
  if (kind === 'minion') {
    session.menuContext.selectedMinionId = value;
    if (button === 'right') doUpgradeMinion(session, value);
    else if (button.startsWith('shift')) doPickupMinion(session, value);
    else doCollectMinion(session, value);
    return;
  }
  if (kind === 'dungeonChest') {
    claimDungeonChest(session);
    return;
  }
  if (kind === 'placeMinion') {
    if (!zone(session.player.zoneId).hasMinions) {
      throw new Error('Go to Minion Platform on your island to place minions');
    }
    doPlaceMinion(session, value);
    openMenu(session, 'minions');
    return;
  }
  if (kind === 'garden') {
    const [op, a, ...cropParts] = value.split(':');
    const cropId = cropParts.join(':');
    ensureGardenPlots(session.player);
    if (op === 'visitor' || !op) {
      toast(session, serveGardenVisitor(session.player), 'success');
      pushState(session);
      if (session.menuOpen) pushMenu(session);
      return;
    }
    if (op === 'plot') {
      const index = Number(a);
      const plot = session.player.garden.plots[index];
      if (!plot?.crop) {
        openMenu(session, 'garden_plant', { plotIndex: index });
        return;
      }
      if (button === 'right' || button === 'shift_right') {
        toast(session, waterPlot(session.player, index), 'success');
      } else if (plotReady(plot)) {
        toast(session, harvestPlot(session.player, index), 'success');
      } else {
        throw new Error('Crop not ready yet — right-click the plot to water it');
      }
      pushState(session);
      openMenu(session, 'garden_plots');
      return;
    }
    if (op === 'sow') {
      toast(session, plantCrop(session.player, Number(a), cropId as ItemId), 'success');
      pushState(session);
      openMenu(session, 'garden_plots');
      return;
    }
    if (op === 'compost') {
      const crop = a as ItemId;
      const have = countItem(session.player.inventory, crop);
      const qty = button === 'right' || button.startsWith('shift') ? Math.min(64, have) : 1;
      toast(session, compostCrop(session.player, crop, qty), 'success');
      pushState(session);
      openMenu(session, 'garden_compost');
      return;
    }
    return;
  }
  if (kind === 'stars') {
    toast(session, upgradeGearStars(session.player, Number(value)), 'success');
    markStatsDirty(session);
    pushState(session);
    openMenu(session, 'dungeon_stars');
    return;
  }
  if (kind === 'trade') {
    const [op, ...rest] = value.split(':');
    const arg = rest.join(':');
    const partnerId = findTradePartnerId(session.player.id) ?? String(session.menuContext.partnerId ?? '');
    if (op === 'cancel') {
      cancelActiveTrade(session);
      return;
    }
    if (!partnerId) throw new Error('No active trade');
    if (op === 'confirm') {
      handleFeatureEvent(session, { type: 'tradeConfirm' }, sessions, featureHelpers(session));
      return;
    }
    if (op === 'select') {
      session.menuContext = { ...session.menuContext, selectedTradeSlot: Number(arg) };
      pushMenu(session);
      return;
    }
    if (op === 'clear') {
      setTradeItem(session.player, partnerId, Number(arg), null);
      session.menuContext = { ...session.menuContext, selectedTradeSlot: '' };
      refreshTradeMenus(session);
      return;
    }
    if (op === 'coins') {
      const trade = getTrade(session.player.id, partnerId);
      const current = trade?.offers[session.player.id]?.coins ?? 0;
      let next = current;
      if (button.startsWith('shift')) next = 0;
      else if (button === 'right' || button === 'shift_right') next = Math.min(session.player.coins, current + 100);
      else next = Math.min(session.player.coins, current + 1000);
      setTradeCoins(session.player, partnerId, next);
      refreshTradeMenus(session);
      return;
    }
    return;
  }
  if (kind === 'hotm') {
    toast(session, unlockHotmPerk(session.player, value), 'success');
    markStatsDirty(session);
    pushState(session);
    return;
  }
  if (kind === 'commission') {
    toast(session, claimCommission(session.player, value), 'success');
    pushState(session);
    return;
  }
  if (kind === 'brew') {
    toast(session, brewPotion(session.player, value), 'success');
    markStatsDirty(session);
    pushState(session);
    return;
  }
  if (kind === 'museum') {
    toast(session, donateMuseum(session.player, value as ItemId), 'success');
    pushState(session);
    return;
  }
  if (kind === 'wardrobe') {
    const page = Number(value);
    if (button === 'right') toast(session, saveWardrobe(session.player, page), 'success');
    else {
      toast(session, equipWardrobe(session.player, page), 'success');
      markStatsDirty(session);
    }
    pushState(session);
    return;
  }
  if (kind === 'dragon') {
    toast(session, placeDragonEye(session.player), 'success');
    spawnDragonIfReady(session);
    pushState(session);
    return;
  }
  if (kind === 'kuudra') {
    if (value === 'leave') {
      leaveKuudra(session);
      return;
    }
    toast(session, startKuudra(session.player, Number(value) || 1), 'success');
    spawnKuudra(session);
    pushState(session);
    return;
  }
  if (kind === 'hatch') {
    toast(session, hatchPetEgg(session.player, value as ItemId), 'success');
    markStatsDirty(session);
    pushState(session);
    return;
  }
  if (kind === 'dungeonParty') {
    inviteDungeonParty(session);
    return;
  }
  if (kind === 'dungeonJoin') {
    const hostId = value === 'nearby'
      ? [...sessions.values()].find((entry) => entry.player.dungeonPartyId && entry.player.dungeonRun && entry.player.id !== session.player.id)?.player.id
      : value;
    if (!hostId) throw new Error('No open dungeon party in the Hub');
    joinDungeonParty(session, hostId);
    return;
  }
  if (kind === 'questClaim') {
    claimStarterQuest(session);
    return;
  }
  if (kind === 'minionUpgrade') {
    const [minionId, upgradeId] = value.split('/');
    installMinionUpgrade(session, minionId, upgradeId as ItemId);
    return;
  }
  if (kind === 'slayer') {
    if (value === 'active') {
      const boss = (session.player.worldMobs ?? []).find((mob) => mob.slayerBoss && mob.hp > 0);
      if (boss) {
        attackWorldMob(session, boss.id);
        return;
      }
      attackSlayerBoss(session);
      return;
    }
    if (session.player.activeSlayer) throw new Error('Finish your current Slayer quest first');
    const slayer = SLAYERS.find((entry) => entry.id === value);
    if (!slayer) return;
    const affordable = slayer.tiers.filter((tier) => tier.cost <= session.player.coins);
    const tier = button === 'right'
      ? affordable.at(-1)
      : (session.player.coins >= slayer.tiers[0].cost ? slayer.tiers[0] : null);
    if (!tier) throw new Error(`Need ${slayer.tiers[0].cost.toLocaleString()} coins for Tier ${slayer.tiers[0].tier}`);
    spendCoins(session, tier.cost);
    session.player.activeSlayer = {
      slayerId: slayer.id,
      tier: tier.tier,
      progressXp: 0,
      requiredXp: tier.tier * 100,
    };
    flagQuest(session, 'start_slayer');
    pushState(session);
    toast(session, `${slayer.name} Tier ${tier.tier} started! Kill ${slayer.targetMob}s until the boss spawns.`, 'success');
    return;
  }
  if (kind === 'class') {
    session.player.selectedDungeonClass = value as PlayerState['selectedDungeonClass'];
    pushState(session);
    return;
  }
  if (kind === 'dungeon') {
    if (value === 'continue') {
      resumeDungeon(session);
      return;
    }
    if (value === 'leave') {
      leaveDungeon(session);
      return;
    }
    enterDungeon(session, value);
    return;
  }
  if (kind === 'enchantPick') {
    openMenu(session, 'enchanting', { slot: Number(value), page: 0 });
    return;
  }
  if (kind === 'enchantApply') {
    const [slotStr, enchantId] = value.split('@');
    applyEnchantToSlot(session, Number(slotStr), enchantId);
    return;
  }
  if (kind === 'auction') {
    if (value === 'browse') {
      openMenu(session, 'auction', { mode: 'browse' });
      return;
    }
    if (value === 'create') {
      openMenu(session, 'auction', { mode: 'create', pickSlot: -1, price: 10_000, bin: true, durationHours: 24 });
      return;
    }
    if (value === 'manage') {
      openMenu(session, 'auction', { mode: 'manage' });
      return;
    }
    if (value === 'claims') {
      openMenu(session, 'auction', { mode: 'claims' });
      return;
    }
    if (value.startsWith('view:')) {
      openMenu(session, 'auction', { mode: 'view', auctionId: value.slice(5) });
      return;
    }
    return;
  }
  if (kind === 'auctionPick') {
    const pickSlot = Number(value);
    openMenu(session, 'auction', {
      ...session.menuContext,
      mode: 'create',
      pickSlot,
    });
    return;
  }
  if (kind === 'auctionBin' && value === 'toggle') {
    openMenu(session, 'auction', {
      ...session.menuContext,
      mode: 'create',
      bin: session.menuContext.bin === false,
    });
    return;
  }
  if (kind === 'auctionDuration' && value === 'cycle') {
    const options = [...durationOptions()];
    const current = Number(session.menuContext.durationHours ?? 24);
    const idx = options.indexOf(current as typeof options[number]);
    const next = options[(idx + 1) % options.length];
    openMenu(session, 'auction', { ...session.menuContext, mode: 'create', durationHours: next });
    return;
  }
  if (kind === 'auctionPrice' && value === 'adjust') {
    const step = button === 'right' ? -1 : 1;
    const current = Number(session.menuContext.price ?? 10_000);
    const price = Math.max(1, Math.round(current * (step > 0 ? 1.25 : 0.8)));
    openMenu(session, 'auction', { ...session.menuContext, mode: 'create', price });
    return;
  }
  if (kind === 'auctionConfirm') {
    const pickSlot = Number(session.menuContext.pickSlot ?? -1);
    const price = Number(session.menuContext.price ?? 0);
    const bin = session.menuContext.bin !== false;
    const durationHours = Number(session.menuContext.durationHours ?? 24);
    session.player = createListing(session.player, pickSlot, price, bin, durationHours);
    pushState(session);
    openMenu(session, 'auction', { mode: 'browse' });
    toast(session, bin ? 'BIN auction created!' : 'Auction created — waiting for bids!', 'success');
    return;
  }
  if (kind === 'auctionBuy') {
    session.player = buyBin(session.player, value);
    pushState(session);
    openMenu(session, 'auction', { mode: 'browse' });
    toast(session, 'Auction purchased!', 'success');
    return;
  }
  if (kind === 'auctionBid') {
    session.player = placeBid(session.player, value);
    pushState(session);
    openMenu(session, 'auction', { mode: 'view', auctionId: value });
    toast(session, 'Bid placed!', 'success');
    return;
  }
  if (kind === 'auctionCancel') {
    session.player = cancelListing(session.player, value);
    pushState(session);
    openMenu(session, 'auction', { mode: 'manage' });
    toast(session, 'Listing cancelled — item returned.', 'info');
    return;
  }
  if (kind === 'auctionClaim') {
    session.player = claimAuction(session.player, value);
    pushState(session);
    openMenu(session, 'auction', { mode: 'claims' });
    toast(session, 'Claimed!', 'success');
    return;
  }
}

function handleInventoryClick(session: Session, slot: number, button: 'left' | 'right' | 'shift_left' | 'shift_right'): void {
  if (!keepsInventoryCursor(session.currentMenu)) return;
  session.player.backpacks = normalizeBackpacks(session.player.backpacks);

  if (session.currentMenu === 'backpack_page' && button.startsWith('shift')) {
    const stack = session.player.inventory[slot];
    if (stack) {
      const page = backpackPageIndex(session);
      const next = insertStack(session.player.backpacks[page], stack);
      if (next) {
        session.player.backpacks[page] = next;
        session.player.inventory[slot] = null;
        pushState(session);
        return;
      }
    }
  }

  if (session.currentMenu === 'inventory' && button.startsWith('shift')) {
    useInventorySlot(session, slot, button);
    return;
  }
  const clickButton = button === 'right' || button === 'shift_right' ? 'right' : 'left';
  const result = clickInventorySlot(session.player.inventory, session.inventoryCursor, slot, clickButton);
  session.player.inventory = result.inventory;
  session.inventoryCursor = result.cursor;
  pushState(session);
}

function handleBackpackClick(session: Session, slot: number, button: 'left' | 'right' | 'shift_left' | 'shift_right'): void {
  if (session.currentMenu !== 'backpack_page') return;
  session.player.backpacks = normalizeBackpacks(session.player.backpacks);
  const page = backpackPageIndex(session);
  const pack = session.player.backpacks[page];
  if (slot < 0 || slot >= pack.length) return;

  if (button.startsWith('shift')) {
    const stack = pack[slot];
    if (stack) {
      const next = insertStack(session.player.inventory, stack);
      if (next) {
        session.player.inventory = next;
        pack[slot] = null;
        pushState(session);
        return;
      }
    }
  }

  const clickButton = button === 'right' || button === 'shift_right' ? 'right' : 'left';
  const result = clickInventorySlot(pack, session.inventoryCursor, slot, clickButton);
  session.player.backpacks[page] = result.inventory;
  session.inventoryCursor = result.cursor;
  pushState(session);
}

function useHeldItem(session: Session): void {
  const held = session.inventoryCursor;
  if (!held) return;
  const def = ITEMS[held.itemId];
  if (!def) return;

  if (def.heal) {
    session.player.hp = Math.min(session.player.maxHp, session.player.hp + (def.heal ?? 0));
    held.qty -= 1;
    if (held.qty <= 0) session.inventoryCursor = null;
    pushState(session);
    toast(session, `Used ${def.name}`, 'success');
    return;
  }

  const slotByType: Partial<Record<string, keyof PlayerState['equipment']>> = {
    HELMET: 'helmet', CHESTPLATE: 'chestplate', LEGGINGS: 'leggings', BOOTS: 'boots',
  };
  const equipmentSlot = slotByType[def.type ?? ''];
  if (!equipmentSlot) {
    if (isWeaponLikeType(def.type)) {
      const hbIndex = hotbarInventoryIndex(session.player.hotbarSlot);
      const old = session.player.inventory[hbIndex];
      session.player.inventory[hbIndex] = { ...held, qty: 1 };
      held.qty -= 1;
      session.inventoryCursor = held.qty > 0 ? { ...held } : null;
      if (old) {
        const next = addItem(session.player.inventory, old.itemId, old.qty);
        if (next) session.player.inventory = next;
        else session.inventoryCursor = old;
      }
      pushState(session);
      toast(session, `Moved ${def.name} to hotbar`, 'success');
      return;
    }
    toast(session, 'This item cannot be used from your hand here.', 'info');
    return;
  }
  const old = session.player.equipment[equipmentSlot];
  session.player.equipment[equipmentSlot] = { ...held, qty: 1 };
  held.qty -= 1;
  session.inventoryCursor = held.qty > 0 ? { ...held } : null;
  if (old) {
    const next = addItem(session.player.inventory, old.itemId, old.qty);
    if (next) session.player.inventory = next;
  }
  markStatsDirty(session);
  pushState(session);
  toast(session, `Equipped ${def.name}`, 'success');
}

function applyEnchantToSlot(session: Session, invSlot: number, enchantId: string): void {
  const stack = session.player.inventory[invSlot];
  if (!stack) throw new Error('No item in that slot');
  const def = ITEMS[stack.itemId];
  if (!def?.type) throw new Error('This item cannot be enchanted');
  if (!enchantAppliesToItem(enchantId, def.type)) throw new Error('This enchant cannot go on that item');
  const enchDef = ENCHANTMENTS_BY_ID[enchantId];
  if (!enchDef) throw new Error('Unknown enchantment');
  const current = stack.enchantments?.[enchantId] ?? 0;
  if (current >= enchDef.maxLevel) throw new Error(`${enchDef.name} is already max level`);
  const rarityIndex = Math.max(0, ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'].indexOf(def.rarity ?? 'COMMON'));
  const cost = enchantTableCost(enchantId, current + 1, rarityIndex);
  if (session.player.coins < cost) throw new Error(`Need ${cost.toLocaleString()} coins`);
  session.player.coins -= cost;
  stack.enchantments = { ...stack.enchantments, [enchantId]: current + 1 };
  gainSkillXp(session, 'enchanting', 25 + current * 10);
  markStatsDirty(session);
  pushState(session);
  openMenu(session, 'enchanting', { slot: invSlot, page: session.menuContext.page ?? 0 });
  toast(session, `${enchantDisplayName(enchantId)} ${toRoman(current + 1)} applied!`, 'success');
}

function toRoman(value: number): string {
  const values: Array<[number, string]> = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let result = '';
  let left = value;
  for (const [amount, glyph] of values) {
    while (left >= amount) {
      result += glyph;
      left -= amount;
    }
  }
  return result || String(value);
}

function useInventorySlot(session: Session, index: number, button = 'left'): void {
  const stack = session.player.inventory[index];
  if (!stack) return;
  const def = ITEMS[stack.itemId];
  if (!def) return;

  if (session.currentMenu === 'trade') {
    const partnerId = findTradePartnerId(session.player.id) ?? String(session.menuContext.partnerId ?? '');
    if (!partnerId) throw new Error('No active trade');
    const trade = getTrade(session.player.id, partnerId);
    const selectedRaw = session.menuContext.selectedTradeSlot;
    let slot = selectedRaw === undefined || selectedRaw === '' ? -1 : Number(selectedRaw);
    if (!Number.isFinite(slot) || slot < 0 || slot > 3) {
      slot = trade?.offers[session.player.id]?.items.findIndex((item) => !item) ?? 0;
    }
    if (slot < 0) slot = 0;
    setTradeItem(session.player, partnerId, slot, index);
    session.menuContext = { ...session.menuContext, selectedTradeSlot: '' };
    refreshTradeMenus(session);
    return;
  }

  if (session.currentMenu === 'inventory') {
    if (!button.startsWith('shift')) return;
  }

  if (session.currentMenu === 'auction' && session.menuContext.mode === 'create') {
    openMenu(session, 'auction', { ...session.menuContext, mode: 'create', pickSlot: index });
    return;
  }

  if (session.currentMenu === 'npc_shop' || session.currentMenu === 'bank') {
    const qty = button === 'right' || button === 'shift_right'
      ? Math.min(64, stack.qty)
      : button.startsWith('shift')
        ? stack.qty
        : 1;
    doNpcSellFromSlot(session, index, qty);
    return;
  }

  if (session.currentMenu === 'accessories' || (session.currentMenu === 'inventory' && def.type === 'ACCESSORY')) {
    if (def.type !== 'ACCESSORY') throw new Error('Only accessories can go in this bag');
    equipAccessory(session, stack, index);
    return;
  }
  if (session.currentMenu === 'pets') {
    if (def.type !== 'PET') throw new Error('That is not a pet');
    session.player.pets.push({ itemId: stack.itemId, level: 1, xp: 0, active: session.player.pets.length === 0 });
    session.player.inventory[index] = null;
    markStatsDirty(session);
    pushState(session);
    return;
  }
  if (def.type === 'MINION') {
    const minionType = minionTypeFromItem(stack.itemId);
    if (!minionType) throw new Error('Unknown minion item');
    if (!zone(session.player.zoneId).hasMinions) {
      throw new Error('Go to Minion Platform on your island (walk there and press E, or use Fast Travel)');
    }
    doPlaceMinion(session, minionType);
    return;
  }
  if (session.currentMenu === 'minions') {
    const selectedId = typeof session.menuContext.selectedMinionId === 'string' ? session.menuContext.selectedMinionId : null;
    const minion = session.player.minions.find((entry) => entry.id === selectedId) ?? session.player.minions[0];
    if (!minion) throw new Error('Place a minion first');
    if (stack.itemId === 'enchanted_coal_fuel' || stack.itemId === 'enchanted_coal') {
      minion.fuel = { itemId: stack.itemId, expiresAt: Date.now() + 24 * 60 * 60 * 1000, speedMultiplier: 1.1 };
    } else if (['compactor', 'super_compactor', 'diamond_spreading'].includes(stack.itemId)) {
      minion.upgrades ??= [];
      if (minion.upgrades.length >= 2) throw new Error('This minion already has two upgrades');
      if (minion.upgrades.includes(stack.itemId)) throw new Error('Upgrade already installed');
      minion.upgrades.push(stack.itemId);
    } else {
      throw new Error('Select minion fuel or an upgrade');
    }
    stack.qty--;
    if (stack.qty <= 0) session.player.inventory[index] = null;
    pushState(session);
    toast(session, 'Minion upgrade installed!', 'success');
    return;
  }
  if (session.currentMenu === 'enchanting') {
    openMenu(session, 'enchanting', { slot: index, page: 0 });
    return;
  }
  if (session.currentMenu === 'reforge') {
    const group = def.type === 'SWORD' || def.type === 'BOW' ? 'weapon' : ['HELMET', 'CHESTPLATE', 'LEGGINGS', 'BOOTS'].includes(def.type ?? '') ? 'armor' : def.type === 'ACCESSORY' ? 'accessory' : 'tool';
    const choices = REFORGES.filter((reforge) => reforge.appliesTo === group);
    if (!choices.length) throw new Error('This item cannot be reforged');
    const cost = 250 * (['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'].indexOf(def.rarity ?? 'COMMON') + 1);
    if (session.player.coins < cost) throw new Error(`Need ${cost.toLocaleString()} coins`);
    session.player.coins -= cost;
    const previous = stack.reforge ?? 'none';
    const rolled = choices[Math.floor(Math.random() * choices.length)]!;
    stack.reforge = rolled.name;
    markStatsDirty(session);
    pushState(session);
    const rarity = def.rarity ?? 'COMMON';
    const bonus = rolled.statsByRarity[rarity];
    const bonusText = bonus
      ? Object.entries(bonus).map(([key, amount]) => `+${amount} ${key}`).join(', ')
      : rolled.name;
    const combat = rolled.appliesTo === 'weapon' || rolled.appliesTo === 'armor' ? ' · combat roll' : '';
    toast(session, `Reforged ${previous} → ${rolled.name}! ${bonusText}${combat}`, 'success');
    return;
  }

  const slotByType: Partial<Record<string, keyof PlayerState['equipment']>> = {
    HELMET: 'helmet', CHESTPLATE: 'chestplate', LEGGINGS: 'leggings', BOOTS: 'boots',
  };
  const equipmentSlot = slotByType[def.type ?? ''];
  if (!equipmentSlot) {
    if (isWeaponLikeType(def.type)) {
      swapInventoryWithHotbar(session, index);
      toast(session, `Moved ${def.name} to hotbar`, 'success');
      return;
    }
    if (def.heal) doUseItem(session, index);
    else throw new Error('Open the relevant menu to use this item');
    return;
  }
  const old = session.player.equipment[equipmentSlot];
  session.player.equipment[equipmentSlot] = { ...stack };
  session.player.inventory[index] = old;
  markStatsDirty(session);
  pushState(session);
  toast(session, `Equipped ${def.name}`, 'success');
}

function attackSlayerBoss(session: Session): void {
  const quest = session.player.activeSlayer;
  if (!quest) throw new Error('No active Slayer quest');
  const slayer = SLAYERS.find((entry) => entry.id === quest.slayerId);
  const tier = slayer?.tiers.find((entry) => entry.tier === quest.tier);
  if (!slayer || !tier) return;
  if (!quest.bossHp) throw new Error('Kill target mobs to spawn the boss');
  const weapon = hotbarStack(session.player.inventory, session.player.hotbarSlot);
  const weaponDamage = weapon ? ITEMS[weapon.itemId]?.damage ?? 5 : 5;
  const critical = rollCrit(session.player.stats.critChance);
  const damage = Math.round(meleeDamage(weaponDamage, session.player.stats.strength, session.player.stats.critDamage, critical));
  quest.bossHp = Math.max(0, quest.bossHp - damage);
  if (quest.bossHp <= 0) {
    defeatSlayerBoss(session);
    pushState(session);
    return;
  } else {
    session.player.hp -= incomingDamage(tier.damage, effectiveDefense(session.player, abilitySessionView(session)));
    if (session.player.hp <= 0) {
      handlePlayerDeath(session, 'The Slayer boss killed you!');
      return;
    }
  }
  pushState(session);
}

function doBankAction(session: Session, value: string): void {
  const [operation, rawAmount] = value.split('/');
  const bank = session.player.bank;

  if (operation === 'upgrade') {
    const next = nextBankTier(bank.tier);
    if (!next) throw new Error('You already own the best account');
    if (session.player.coins < next.upgradeCost) throw new Error(`Need ${next.upgradeCost.toLocaleString()} coins in your purse`);
    session.player.coins -= next.upgradeCost;
    bank.tier = next.id;
    pushState(session);
    toast(session, `Upgraded to ${next.name}!`, 'success');
    return;
  }

  const source = operation === 'deposit' ? Math.floor(session.player.coins) : Math.floor(bank.balance);
  const requested = rawAmount === 'all' ? source : rawAmount === 'half' ? Math.floor(source / 2) : Math.floor(Number(rawAmount));
  if (!Number.isFinite(requested) || requested <= 0) throw new Error('Nothing to move');
  const amount = Math.min(requested, source, operation === 'deposit' ? depositLimit(bank) : Infinity);
  if (amount <= 0) {
    throw new Error(operation === 'deposit' ? `Your ${bankTier(bank.tier).name} is full` : 'Your bank is empty');
  }

  if (operation === 'deposit') {
    session.player.coins -= amount;
    bank.balance += amount;
  } else {
    bank.balance -= amount;
    session.player.coins += amount;
  }
  pushState(session);
  toast(session, `${operation === 'deposit' ? 'Deposited' : 'Withdrew'} ${amount.toLocaleString()} coins.`, 'success');
}

function dungeonClassMultiplier(dungeonClass: PlayerState['selectedDungeonClass']): number {
  if (dungeonClass === 'mage') return 1.15;
  if (dungeonClass === 'berserk') return 1.1;
  if (dungeonClass === 'archer') return 1.05;
  if (dungeonClass === 'tank') return 0.95;
  return 1;
}

function warpToDungeonSpawn(session: Session): void {
  const run = session.player.dungeonRun;
  if (!run) return;
  const map = buildDungeonRoomMap(run);
  beginPositionSnap(session);
  session.player.zoneId = DUNGEON_ZONE;
  session.player.islandId = 'dungeon_hub';
  session.player.x = map.spawn.x;
  session.player.y = map.spawn.y;
  session.player.facing = 'right';
}

function enterDungeon(session: Session, floorId: string): void {
  const floor = DUNGEON_FLOORS.find((entry) => entry.id === floorId);
  if (!floor) throw new Error('Unknown dungeon floor');
  const combat = levelFromXp(session.player.skills.combat).level;
  if (combat < DUNGEON_COMBAT_REQUIREMENT) throw new Error(`Dungeons unlock at Combat ${DUNGEON_COMBAT_REQUIREMENT}`);
  const catacombs = levelFromXp(session.player.skills.dungeoneering).level;
  if (catacombs < floor.requiredLevel) throw new Error(`Requires Catacombs ${floor.requiredLevel}`);
  session.player.dungeonRun = {
    floorId: floor.id,
    dungeonClass: session.player.selectedDungeonClass,
    phase: 'starter',
    room: 0,
    rooms: floor.rooms,
    score: 0,
    roomCleared: false,
    mobHp: {},
  };
  warpToDungeonSpawn(session);
  session.menuOpen = false;
  pushState(session, { resetPosition: true });
  broadcastZonePresence();
  toast(session, `Entered ${floor.name}! Walk to the Wither Door and press E to begin.`, 'success');
}

function resumeDungeon(session: Session): void {
  if (!session.player.dungeonRun) throw new Error('No active dungeon run');
  warpToDungeonSpawn(session);
  session.menuOpen = false;
  pushState(session, { resetPosition: true });
  broadcastZonePresence();
  toast(session, 'Returned to your dungeon run.', 'info');
}

function leaveDungeon(session: Session): void {
  session.player.dungeonRun = null;
  session.player.dungeonPartyId = null;
  doTravel(session, 'dungeon_hub');
  toast(session, 'You left the Catacombs.', 'info');
}

function leaveKuudra(session: Session): void {
  session.player.kuudraFight = null;
  session.player.worldMobs = (session.player.worldMobs ?? []).filter((mob) => mob.mobId !== 'kuudra');
  session.menuOpen = false;
  pushState(session, { resetPosition: true });
  toast(session, 'You abandoned the Kuudra fight.', 'info');
}

function leaveActiveRun(session: Session): boolean {
  if (session.player.dungeonRun) {
    leaveDungeon(session);
    return true;
  }
  if (session.player.kuudraFight) {
    leaveKuudra(session);
    return true;
  }
  toast(session, 'No active dungeon or Kuudra run to leave.', 'error');
  return true;
}

function claimDungeonChest(session: Session): void {
  const chest = session.player.pendingDungeonChest;
  if (!chest) throw new Error('No dungeon chest to claim');
  const leftover: typeof chest.drops = [];
  for (const drop of chest.drops) {
    if (!grantDropStack(session, drop.itemId, drop.qty, session.player.stats.magicFind ?? 0)) {
      leftover.push(drop);
    }
  }
  if (leftover.length) {
    session.player.pendingDungeonChest = { ...chest, drops: leftover };
    pushState(session);
    throw new Error('Inventory full — claimed what would fit. Make room and claim again.');
  }
  session.player.pendingDungeonChest = null;
  pushState(session);
  toast(session, chest.drops.length ? 'Claimed dungeon chest!' : 'Chest was empty — better luck next floor.', 'success');
  openMenu(session, 'dungeons');
}

function completeDungeon(session: Session): void {
  const run = session.player.dungeonRun;
  if (!run) return;
  const floor = DUNGEON_FLOORS.find((entry) => entry.id === run.floorId);
  if (!floor) return;
  gainSkillXp(session, 'dungeoneering', floor.baseCatacombsXp);
  session.player.coins += floor.coinReward;
  const rolled = rollDropTable(session, floor.drops ?? []);
  const stars = 1 + Math.floor(Math.random() * 3) + (currentMayor().id === 'paul' ? 1 : 0) + Math.min(2, Math.floor((run.secretsFound ?? 0) / 2));
  let starLabel: string | undefined;
  for (const stack of session.player.inventory) {
    const type = stack ? ITEMS[stack.itemId]?.type : undefined;
    if (stack && type && ['SWORD', 'BOW', 'HELMET', 'CHESTPLATE', 'LEGGINGS', 'BOOTS'].includes(type)) {
      stack.dungeonStars = Math.min(5, (stack.dungeonStars ?? 0) + stars);
      starLabel = `${ITEMS[stack.itemId]?.name ?? stack.itemId} ✪${stack.dungeonStars} (+${stack.dungeonStars * 10}% dungeon stats)`;
      break;
    }
  }
  grantEssenceOnDungeonComplete(session, run.floorId);
  session.player.dungeonRun = null;
  session.player.pendingDungeonChest = {
    floorName: floor.shortName ?? floor.name,
    coins: floor.coinReward,
    xp: floor.baseCatacombsXp,
    stars,
    starLabel,
    drops: rolled,
  };
  doTravel(session, 'dungeon_hub');
  if (starLabel) toast(session, `Starred ${starLabel}`, 'loot');
  toast(session, `Dungeon complete! Score ${run.score} — click the chest to claim drops.`, 'success');
  openMenu(session, 'dungeon_chest');
}

function allDungeonMobsDead(run: NonNullable<PlayerState['dungeonRun']>): boolean {
  if (!run.mobHp) return false;
  return Object.values(run.mobHp).every((hp) => hp <= 0);
}

function handleDungeonDoor(session: Session): void {
  const run = session.player.dungeonRun;
  if (!run) throw new Error('No active dungeon run');
  const phase = dungeonPhase(run);
  const floor = dungeonFloor(run.floorId);

  if (phase === 'starter') {
    run.phase = 'rooms';
    run.room = 1;
    run.roomCleared = false;
    run.secretClaimed = false;
    run.mobHp = initRoomMobs(run);
    warpToDungeonSpawn(session);
    pushState(session, { resetPosition: true });
    toast(session, 'The Wither Door opens! Defeat the starred mobs (☠), then return to the door.', 'success');
    return;
  }

  if (phase === 'rooms') {
    if (!run.roomCleared) throw new Error('Defeat all mobs in this room before opening the door!');
    if (run.room >= run.rooms) {
      run.phase = 'boss';
      run.bossHp = floor?.boss.health;
      warpToDungeonSpawn(session);
      pushState(session, { resetPosition: true });
      toast(session, `The Blood Door opens! ${floor?.boss.name} awaits — click to attack!`, 'success');
      return;
    }
    run.room++;
    run.roomCleared = false;
    run.secretClaimed = false;
    run.mobHp = initRoomMobs(run);
    warpToDungeonSpawn(session);
    pushState(session, { resetPosition: true });
    toast(session, `Room ${run.room}/${run.rooms} — clear the mobs!`, 'info');
  }
}

function doDungeonMobCombat(session: Session, mobEntityId: string): void {
  const run = session.player.dungeonRun;
  if (!run?.mobHp) throw new Error('No mobs here');
  const hp = run.mobHp[mobEntityId];
  if (hp == null || hp <= 0) throw new Error('That mob is already defeated');

  const critical = rollCrit(session.player.stats.critChance);
  const playerDmg = Math.round(meleeDamage(
    playerWeaponDamage(session.player),
    session.player.stats.strength,
    session.player.stats.critDamage,
    critical,
    combatDamageBonus(skillLevel(session.player, 'combat')),
  ) * dungeonClassMultiplier(run.dungeonClass));

  run.mobHp[mobEntityId] = Math.max(0, hp - playerDmg);

  const mobDmg = dungeonMobDamage(run, mobEntityId);
  const tankReduction = run.dungeonClass === 'tank' ? 0.85 : 1;
  const received = Math.round(incomingDamage(mobDmg, effectiveDefense(session.player, abilitySessionView(session))) * tankReduction);
  session.player.hp -= received;

  if (run.mobHp[mobEntityId] <= 0) {
    run.score += 15 + Math.floor(Math.random() * 11);
    gainSkillXp(session, 'dungeoneering', 2);
  }

  if (allDungeonMobsDead(run)) {
    run.roomCleared = true;
    run.score += 30 + Math.floor(Math.random() * 21);
    toast(session, `Room cleared! The door unlocks. ${critical ? 'CRITICAL! ' : ''}(-${received} HP)`, 'success');
  } else if (session.player.hp <= 0) {
    handlePlayerDeath(session, `A dungeon mob killed you! ${critical ? 'CRITICAL! ' : ''}`);
    return;
  } else {
    const remaining = Object.values(run.mobHp).filter((entry) => entry > 0).length;
    toast(session, `${playerDmg.toLocaleString()} dmg! ${remaining} mob${remaining === 1 ? '' : 's'} left. (-${received} HP)`, 'success');
  }
  pushState(session);
}

function doDungeonBossCombat(session: Session): void {
  const run = session.player.dungeonRun;
  if (!run) throw new Error('No active dungeon run');
  const floor = dungeonFloor(run.floorId);
  if (!floor) return;
  if (dungeonPhase(run) !== 'boss') throw new Error('No boss here');

  if (run.bossHp == null) run.bossHp = floor.boss.health;
  const hotbar = hotbarStack(session.player.inventory, session.player.hotbarSlot);
  const weaponDamage = hotbar ? ITEMS[hotbar.itemId]?.damage ?? 5 : playerWeaponDamage(session.player);
  const critical = rollCrit(session.player.stats.critChance);
  const damage = Math.round(meleeDamage(
    weaponDamage,
    session.player.stats.strength,
    session.player.stats.critDamage,
    critical,
  ) * dungeonClassMultiplier(run.dungeonClass));

  run.bossHp = Math.max(0, run.bossHp - damage);
  run.score += 10;

  if (run.bossHp <= 0) {
    completeDungeon(session);
    return;
  }

  const tankReduction = run.dungeonClass === 'tank' ? 0.85 : 1;
  session.player.hp -= Math.round(incomingDamage(floor.boss.damage, effectiveDefense(session.player, abilitySessionView(session))) * tankReduction);
  if (session.player.hp <= 0) {
    handlePlayerDeath(session, `${floor.boss.name} killed you!`);
    return;
  }
  pushState(session);
  toast(session, `${damage.toLocaleString()} dmg to ${floor.boss.name}! (${run.bossHp.toLocaleString()} HP left)`, 'success');
}

/** Menu shortcut to a district. Same island = a walk you skipped; other islands need a warp. */
function doTravel(session: Session, zoneId: string): void {
  const target = ZONES[zoneId];
  if (!target) throw new Error('Unknown location');
  if (target.islandId !== session.player.islandId) {
    doWarpIsland(session, target.islandId, zoneId);
    return;
  }
  if (!meetsSkillReq(session.player, target.skillReq)) {
    throw new Error(`Requires ${target.skillReq!.skill} level ${target.skillReq!.level}`);
  }
  const spawn = districtSpawn(islandMap(target.islandId), zoneId);
  beginPositionSnap(session);
  session.player.zoneId = zoneId;
  session.player.x = spawn.x;
  session.player.y = spawn.y;
  session.player.facing = 'down';
  if (!session.player.visitedZones.includes(zoneId)) session.player.visitedZones.push(zoneId);
  session.menuOpen = false;
  pushState(session, { resetPosition: true });
  broadcastZonePresence();
  toast(session, `Arrived at ${target.name}`, 'info');
}

function doWarpIsland(session: Session, islandId: IslandId, zoneId?: string): void {
  const island = ISLANDS[islandId];
  if (!island) throw new Error('Unknown island');
  if (islandId !== 'hub' && !island.warpFromHub) throw new Error('Cannot warp there');
  if (!meetsSkillReq(session.player, island.skillReq)) {
    throw new Error(`Requires ${island.skillReq!.skill} level ${island.skillReq!.level}`);
  }
  const entry = (zoneId ? ZONES[zoneId] : undefined) ?? zonesOnIsland(islandId)[0];
  if (!entry || entry.islandId !== islandId) throw new Error('Island has no zones');
  if (!meetsSkillReq(session.player, entry.skillReq)) {
    throw new Error(`Requires ${entry.skillReq!.skill} level ${entry.skillReq!.level}`);
  }
  const spawn = districtSpawn(islandMap(islandId), entry.id);
  beginPositionSnap(session);
  session.player.zoneId = entry.id;
  session.player.islandId = islandId;
  session.player.x = spawn.x;
  session.player.y = spawn.y;
  session.player.facing = 'down';
  if (!session.player.visitedZones.includes(entry.id)) session.player.visitedZones.push(entry.id);
  session.menuOpen = false;
  pushState(session, { resetPosition: true });
  broadcastZonePresence();
  toast(session, `Warped to ${island.name}`, 'success');
}

function doAction(session: Session, actionId: string, times: number): void {
  const act = findAction(session.player.zoneId, actionId);
  if (!act) throw new Error('Action not available here');
  const count = Math.max(1, Math.min(20, Math.floor(times)));

  for (let i = 0; i < count; i++) {
    runSingleAction(session, act);
  }
}

function runSingleAction(session: Session, act: ReturnType<typeof findAction>): void {
  if (!act) return;
  const key = `${session.player.zoneId}:${act.id}`;
  const now = Date.now();
  const last = session.lastActionAt[key] ?? 0;

  let cooldown = act.cooldownMs;
  if (act.skill === 'mining') {
    const extraSpeed = toolStatsForSkill(session.player, 'mining').miningSpeed ?? 0;
    cooldown /= miningSpeedBonus(skillLevel(session.player, 'mining')) * (1 + (session.player.stats.miningSpeed + extraSpeed) / 400);
  }
  if (act.skill === 'foraging') cooldown /= foragingSpeedBonus(skillLevel(session.player, 'foraging'));

  if (now - last < cooldown * 0.85) throw new Error('Slow down!');
  session.lastActionAt[key] = now;

  if (act.kind === 'combat') {
    const target = String(act.target ?? '');
    const nearby = (session.player.worldMobs ?? []).find((mob) =>
      mob.hp > 0 && slayerMatchesMob(target, mob.mobId) && Math.hypot(mob.x - session.player.x, mob.y - session.player.y) < 3,
    ) ?? (session.player.worldMobs ?? []).find((mob) => mob.hp > 0 && slayerMatchesMob(target, mob.mobId));
    if (nearby) {
      attackWorldMob(session, nearby.id);
      return;
    }
    ensureWorldMobs(session);
    doCombatAction(session, act);
    return;
  }

  if (act.tool) {
    const tool = bestTool(session.player, act.tool);
    if (tool.toolType !== act.tool || (tool.toolTier ?? 0) < (act.minToolTier ?? 1)) {
      throw new Error(`Need ${act.tool} tier ${act.minToolTier ?? 1}+ in inventory`);
    }
  }

  if (act.kind === 'fish') {
    const chance = 0.55 + fishingSuccessBonus(skillLevel(session.player, 'fishing')) + (currentMayor().id === 'marina' ? 0.12 : 0);
    if (Math.random() > chance) {
      toast(session, 'The fish got away...', 'info');
      return;
    }
    // Park lake double fish
    if (act.id === 'fish_lake' && Math.random() < 0.5) {
      giveResource(session, act, 2);
      return;
    }
  }

  let qty = act.qty;
  if (act.skill === 'farming') {
    const fortune = farmingFortuneChance(skillLevel(session.player, 'farming'));
    if (Math.random() < fortune) qty += 1;
  }

  giveResource(session, act, qty);
}

function giveResource(session: Session, act: NonNullable<ReturnType<typeof findAction>>, qty: number): void {
  if (!act.target || typeof act.target !== 'string') return;
  const itemId = act.target as ItemId;
  const island = session.player.islandId;
  const dwarvenOrCrystal = island === 'dwarven_mines' || island === 'crystal_hollows';
  let fortune = act.skill === 'mining'
    ? session.player.stats.miningFortune + (toolStatsForSkill(session.player, 'mining').miningFortune ?? 0)
    : act.skill === 'farming'
      ? session.player.stats.farmingFortune + (toolStatsForSkill(session.player, 'farming').farmingFortune ?? 0)
      : act.skill === 'foraging'
        ? session.player.stats.foragingFortune + (toolStatsForSkill(session.player, 'foraging').foragingFortune ?? 0)
        : 0;
  if (act.skill === 'mining' && dwarvenOrCrystal) {
    fortune += (session.player.hotm?.perks.luck_of_the_cave ?? 0) * 6;
  }
  const actualQty = rollFortune(fortune, qty);
  const next = addItem(session.player.inventory, itemId, actualQty);
  if (!next) throw new Error('Inventory full');
  session.player.inventory = next;
  if (act.skill) gainSkillXp(session, act.skill, act.xp);
  const before = session.player.collections[itemId] ?? 0;
  session.player.collections[itemId] = before + actualQty;
  noteCollectionMilestone(session, itemId, before, before + actualQty);
  noteGardenHarvest(session.player, itemId, actualQty);
  noteMiningCommission(session.player, itemId, actualQty);
  if (itemId === 'mithril' && (session.player.hotm?.perks.titanium_insanium ?? 0) > 0 && Math.random() < 0.04 * (session.player.hotm.perks.titanium_insanium ?? 0)) {
    const extra = addItem(session.player.inventory, 'titanium', 1);
    if (extra) {
      session.player.inventory = extra;
      toast(session, 'Titanium Insanium! +1 Titanium', 'success');
    }
  }
  if (itemId === 'mithril') {
    const loaded = session.player.hotm?.perks.front_loaded ?? 0;
    if (loaded > 0 && Math.random() < 0.08 * loaded) {
      const bonus = addItem(session.player.inventory, 'mithril', 1);
      if (bonus) {
        session.player.inventory = bonus;
        session.player.collections.mithril = (session.player.collections.mithril ?? 0) + 1;
        noteMiningCommission(session.player, 'mithril', 1);
        toast(session, 'Front Loaded! +1 Mithril', 'success');
      }
    }
  }
  if (act.skill === 'mining' && island === 'dwarven_mines') {
    const goblin = session.player.hotm?.perks.goblin_killer ?? 0;
    if (goblin > 0) session.player.coins += goblin * 3;
  }
  awardPetXp(session, act.skill, act.xp);
  pushState(session);
  toast(session, `+${actualQty} ${ITEMS[itemId].name}`, 'success');
  if (act.kind === 'fish' && act.id) {
    afterFishCatch(session, act.id, skillLevel(session.player, 'fishing'), {
      toast: (s, msg, kind) => toast(s as Session, msg, kind as ToastKind),
      pushState: (s) => pushState(s as Session),
    });
  }
}

const COMBAT_DROPS: Record<string, ItemId> = {
  husk: 'rotten_flesh',
  weaver: 'string',
  crawler: 'string',
};

const COMBAT_DAMAGE: Record<string, number> = {
  husk: 8,
  weaver: 5,
  crawler: 12,
};

function doCombatAction(session: Session, act: NonNullable<ReturnType<typeof findAction>>): void {
  const tool = bestTool(session.player, 'sword');
  const mobId = act.target as string;
  const mob = MOBS[mobId] ?? MOBS[mobId === 'husk' ? 'zombie' : mobId === 'weaver' || mobId === 'crawler' ? 'spider' : mobId];
  const critical = rollCrit(session.player.stats.critChance);
  const playerDmg = Math.round(meleeDamage(
    tool.damage ?? 4,
    session.player.stats.strength,
    session.player.stats.critDamage,
    critical,
    combatDamageBonus(skillLevel(session.player, 'combat')),
  ));
  const mobDmg = mob?.damage ?? COMBAT_DAMAGE[mobId] ?? 6;
  const received = Math.round(incomingDamage(mobDmg, effectiveDefense(session.player, abilitySessionView(session))));

  const drops = mob?.drops ?? (COMBAT_DROPS[mobId] ? [{ itemId: COMBAT_DROPS[mobId], chance: 1, min: 1, max: 1 }] : []);
  const magicFind = session.player.stats.magicFind ?? 0;
  for (const drop of rollDropTable(session, drops)) {
    grantDropStack(session, drop.itemId, drop.qty, magicFind);
  }
  const gainedXp = mob?.combatXp ?? act.xp;
  gainSkillXp(session, 'combat', gainedXp);
  session.player.coins += mob?.coins ?? 0;
  awardPetXp(session, 'combat', gainedXp);
  if (session.player.activeSlayer) {
    const target = SLAYERS.find((slayer) => slayer.id === session.player.activeSlayer?.slayerId)?.targetMob;
    if (target === mob?.id || (target === 'zombie' && mobId === 'husk') || (target === 'spider' && ['weaver', 'crawler'].includes(mobId))) {
      session.player.activeSlayer.progressXp += gainedXp;
      if (session.player.activeSlayer.progressXp >= session.player.activeSlayer.requiredXp) {
        const tier = SLAYERS.find((slayer) => slayer.id === session.player.activeSlayer?.slayerId)?.tiers.find((entry) => entry.tier === session.player.activeSlayer?.tier);
        session.player.activeSlayer.bossHp = tier?.health;
      }
    }
  }
  session.player.hp -= received;
  if (session.player.hp <= 0) {
    handlePlayerDeath(session, `You were defeated by ${mob?.name ?? mobId}!`);
    return;
  }
  pushState(session);
  toast(session, `Defeated ${mob?.name ?? mobId}! ${critical ? 'CRITICAL! ' : ''}(${playerDmg.toLocaleString()} dmg, -${received} HP)`, 'success');
}

function awardPetXp(session: Session, skill: keyof PlayerState['skills'] | undefined, amount: number): void {
  const pet = session.player.pets.find((entry) => entry.active);
  if (!pet || !skill) return;
  const before = pet.level;
  pet.xp += amount;
  while (pet.level < 100 && pet.xp >= pet.level * pet.level * 100) pet.level++;
  if (pet.level > before) markStatsDirty(session);
  gainSkillXp(session, 'taming', amount * 0.25);
}

function equipAccessory(session: Session, stack: ItemStack, inventoryIndex: number): void {
  const def = ITEMS[stack.itemId];
  if (!def || def.type !== 'ACCESSORY') throw new Error('Only accessories can go in the Accessory Bag');
  const limit = accessoryBagSlots(session.player.fairySouls);
  if (session.player.accessories.length >= limit) {
    throw new Error(`Accessory Bag full (${limit} slots). Find Fairy Souls — every 5 unlocks +1 slot!`);
  }
  if (session.player.accessories.some((entry) => entry.itemId === stack.itemId)) {
    throw new Error('That accessory is already in your bag');
  }
  session.player.accessories.push({ ...stack, qty: 1 });
  stack.qty--;
  if (stack.qty <= 0) session.player.inventory[inventoryIndex] = null;
  markStatsDirty(session);
  pushState(session);
  toast(session, `Stored ${def.name} in Accessory Bag`, 'success');
}

function abilitySessionView(session: Session) {
  return {
    abilityCooldowns: session.abilityCooldowns,
    shieldDefense: session.shieldDefense,
    shieldUntil: session.shieldUntil,
  };
}

function damageAllDungeonMobs(session: Session, damage: number): number {
  const run = session.player.dungeonRun;
  if (!run?.mobHp) return 0;
  let hits = 0;
  for (const id of Object.keys(run.mobHp)) {
    if (run.mobHp[id] <= 0) continue;
    run.mobHp[id] = Math.max(0, run.mobHp[id] - damage);
    hits++;
    if (run.mobHp[id] <= 0) run.score += 15;
  }
  if (hits > 0 && allDungeonMobsDead(run)) {
    run.roomCleared = true;
    run.score += 30;
  }
  return hits;
}

function doUseAbility(session: Session): void {
  if (session.menuOpen) throw new Error('Close menus before using abilities');
  const weapon = hotbarStack(session.player.inventory, session.player.hotbarSlot);
  if (!weapon) throw new Error('Select a weapon in your hotbar to use its ability');
  const def = ITEMS[weapon.itemId];
  const ability = def?.ability;
  if (!ability) throw new Error(`${def?.name ?? 'This item'} has no ability`);

  const key = abilityKey(weapon.itemId);
  if (ability.cooldownSec) {
    const remaining = isOnCooldown(abilitySessionView(session), key, ability.cooldownSec * 1000);
    if (remaining != null) throw new Error(`Ability on cooldown (${Math.ceil(remaining / 1000)}s)`);
  }

  const manaCost = ability.manaCost ?? 0;
  if (manaCost > 0 && session.player.mana < manaCost) {
    throw new Error(`Not enough mana (${Math.floor(session.player.mana)}/${session.player.maxMana})`);
  }

  const kind = abilityKind(ability.name);
  const map = mapFor(session);
  const scaling = ability.scaling ?? 0.2;
  const baseDmg = ability.damage ?? 500;
  const dmg = abilityDamage(session.player, baseDmg, scaling);
  let message = `${ability.name}!`;
  let resetPosition = false;

  if (kind === 'teleport' || kind === 'wither_impact') {
    const distance = kind === 'wither_impact' ? 6 : 8;
    const result = teleportForward(map, session.player.x, session.player.y, session.player.facing, distance);
    if (result.moved === 0) throw new Error('Cannot teleport — path blocked');
    const blocked = districtEntryBlocked(session.player, map, result.x, result.y, session.player.zoneId);
    if (blocked) throw new Error(`Cannot teleport — ${blocked}`);
    beginPositionSnap(session);
    session.player.x = result.x;
    session.player.y = result.y;
    resetPosition = true;
    message = `${ability.name}! Teleported ${result.moved} blocks.`;
  }

  if (kind === 'wither_impact') {
    session.shieldDefense = 100;
    session.shieldUntil = Date.now() + 5000;
    const hits = damageAllDungeonMobs(session, dmg);
    const run = session.player.dungeonRun;
    if (run && dungeonPhase(run) === 'boss' && run.bossHp != null && run.bossHp > 0) {
      run.bossHp = Math.max(0, run.bossHp - dmg);
      message += ` ${dmg.toLocaleString()} ability damage to boss!`;
    } else if (hits > 0) {
      message += ` ${dmg.toLocaleString()} damage to ${hits} mob${hits === 1 ? '' : 's'}!`;
    }
    message += ' Absorption shield gained.';
  } else if (kind === 'aoe') {
    const hits = damageAllDungeonMobs(session, dmg);
    const run = session.player.dungeonRun;
    if (run && dungeonPhase(run) === 'boss' && run.bossHp != null && run.bossHp > 0) {
      run.bossHp = Math.max(0, run.bossHp - dmg);
      message = `${ability.name}! ${dmg.toLocaleString()} damage to the boss!`;
    } else if (session.player.activeSlayer?.bossHp) {
      const worldHits = damageNearbyWorldMobs(session, dmg);
      if (worldHits === 0) session.player.activeSlayer.bossHp = Math.max(0, session.player.activeSlayer.bossHp - dmg);
      message = `${ability.name}! ${dmg.toLocaleString()} damage to Slayer boss!`;
    } else if (hits > 0) {
      message = `${ability.name}! ${dmg.toLocaleString()} damage to ${hits} mob${hits === 1 ? '' : 's'}!`;
    } else {
      message = `${ability.name}! ${dmg.toLocaleString()} damage — no targets nearby.`;
    }
  } else if (kind === 'projectile' || kind === 'shadow') {
    const run = session.player.dungeonRun;
    if (run?.mobHp) {
      const alive = Object.entries(run.mobHp).filter(([, hp]) => hp > 0);
      if (alive.length) {
        const [mobId, hp] = alive[0];
        run.mobHp[mobId] = Math.max(0, hp - dmg);
        if (run.mobHp[mobId] <= 0) {
          run.score += 15;
          if (allDungeonMobsDead(run)) run.roomCleared = true;
        }
        message = `${ability.name}! ${dmg.toLocaleString()} damage!`;
      }
    } else if (run && dungeonPhase(run) === 'boss' && run.bossHp != null) {
      run.bossHp = Math.max(0, run.bossHp - dmg);
      message = `${ability.name}! ${dmg.toLocaleString()} damage to boss!`;
    } else if (session.player.activeSlayer?.bossHp) {
      const worldHits = damageNearbyWorldMobs(session, dmg);
      if (worldHits === 0) session.player.activeSlayer.bossHp = Math.max(0, session.player.activeSlayer.bossHp - dmg);
      message = `${ability.name}! ${dmg.toLocaleString()} damage!`;
    } else {
      const worldHits = damageNearbyWorldMobs(session, dmg);
      message = worldHits > 0
        ? `${ability.name}! ${dmg.toLocaleString()} damage to ${worldHits} mob${worldHits === 1 ? '' : 's'}!`
        : `${ability.name}! ${dmg.toLocaleString()} damage — no target in range.`;
    }
    if (kind === 'shadow') {
      const result = teleportForward(map, session.player.x, session.player.y, session.player.facing, 3);
      if (result.moved > 0) {
        const blocked = districtEntryBlocked(session.player, map, result.x, result.y, session.player.zoneId);
        if (blocked) throw new Error(`Cannot teleport — ${blocked}`);
        if (!resetPosition) beginPositionSnap(session);
        session.player.x = result.x;
        session.player.y = result.y;
        resetPosition = true;
      }
    }
  } else if (kind === 'teleport') {
    // message already set
  } else if (ability.damage) {
    const hits = damageAllDungeonMobs(session, dmg);
    message = hits > 0
      ? `${ability.name}! ${dmg.toLocaleString()} damage to ${hits} target${hits === 1 ? '' : 's'}!`
      : `${ability.name}! ${dmg.toLocaleString()} damage — no targets nearby.`;
  }

  if (manaCost > 0) session.player.mana -= manaCost;
  if (ability.cooldownSec) {
    session.abilityCooldowns[key] = Date.now() + ability.cooldownSec * 1000;
  }

  if (runCompletesDungeon(session)) return;

  pushState(session, resetPosition ? { resetPosition: true } : undefined);
  toast(session, message, 'success');
}

function runCompletesDungeon(session: Session): boolean {
  const run = session.player.dungeonRun;
  if (!run) return false;
  if (dungeonPhase(run) === 'boss' && run.bossHp != null && run.bossHp <= 0) {
    run.score += 100;
    completeDungeon(session);
    return true;
  }
  return false;
}

function consumeHotbarOne(session: Session): boolean {
  const index = hotbarInventoryIndex(session.player.hotbarSlot);
  const next = session.player.inventory.map((slot) => (slot ? { ...slot } : null));
  const held = next[index];
  if (!held || held.qty < 1) return false;
  held.qty -= 1;
  if (held.qty <= 0) next[index] = null;
  session.player.inventory = next;
  return true;
}

function doPlaceBlock(session: Session): void {
  if (session.player.islandId !== 'private_island') return;
  const now = Date.now();
  if (now - session.lastAttackAt < 180) return;

  const stack = hotbarStack(session.player.inventory, session.player.hotbarSlot);
  if (!stack) throw new Error('Hold a block to place');
  const tile = placeableTile(stack.itemId);
  if (!tile) throw new Error('That item cannot be placed');

  const target = tileInFront(session.player.x, session.player.y, session.player.facing);
  const map = mapFor(session);
  const current = map.tiles[target.y]?.[target.x];
  if (current == null) throw new Error('Out of bounds');

  const blocks = { ...(session.player.islandBlocks ?? {}) };
  const key = islandBlockKey(target.x, target.y);
  const alreadyEdited = Object.prototype.hasOwnProperty.call(blocks, key);
  if (current !== 'void' && !alreadyEdited) throw new Error('Punch the ground first');
  if (current === 'void' && !hasWalkableNeighbor(map, target.x, target.y)) {
    throw new Error('Need a walkable tile next to it');
  }
  if (!alreadyEdited && Object.keys(blocks).length >= ISLAND_BLOCK_CAP) {
    throw new Error('Island is at the block limit');
  }
  if (!consumeHotbarOne(session)) throw new Error('Hold a block to place');

  blocks[key] = tile;
  session.player.islandBlocks = blocks;
  session.lastAttackAt = now;
  pushState(session);
}

function doBreakBlock(session: Session): void {
  if (session.player.islandId !== 'private_island') return;
  const now = Date.now();
  if (now - session.lastAttackAt < 180) return;

  const target = tileInFront(session.player.x, session.player.y, session.player.facing);
  const map = mapFor(session);
  const current = map.tiles[target.y]?.[target.x];
  if (!current || current === 'void') return;
  if (isProtectedIslandSpawn(map, target.x, target.y)) throw new Error('Cannot break the spawn platform');

  const blocks = { ...(session.player.islandBlocks ?? {}) };
  const key = islandBlockKey(target.x, target.y);
  if (!Object.prototype.hasOwnProperty.call(blocks, key) && Object.keys(blocks).length >= ISLAND_BLOCK_CAP) {
    throw new Error('Island is at the block limit');
  }

  const drop = TILE_DROP_ITEM[current];
  if (drop) {
    const next = addItem(session.player.inventory, drop, 1);
    if (!next) throw new Error('Inventory is full');
    session.player.inventory = next;
  }

  blocks[key] = 'void';
  session.player.islandBlocks = blocks;
  session.lastAttackAt = now;
  pushState(session);
}

function doDropHotbar(session: Session, all: boolean): void {
  if (session.inventoryCursor) {
    const held = session.inventoryCursor;
    const name = ITEMS[held.itemId]?.name ?? held.itemId;
    session.inventoryCursor = null;
    toast(session, `Dropped ${held.qty} ${name}`);
    pushState(session);
    return;
  }
  const index = hotbarInventoryIndex(session.player.hotbarSlot);
  const stack = session.player.inventory[index];
  if (!stack) return;
  const qty = all ? stack.qty : 1;
  const next = session.player.inventory.map((slot) => (slot ? { ...slot } : null));
  const held = next[index];
  if (!held) return;
  held.qty -= qty;
  if (held.qty <= 0) next[index] = null;
  session.player.inventory = next;
  toast(session, `Dropped ${qty} ${ITEMS[stack.itemId]?.name ?? stack.itemId}`);
  pushState(session);
}

function doUseItem(session: Session, slot?: number): void {
  const idx = slot ?? hotbarInventoryIndex(session.player.hotbarSlot);
  const stack = session.player.inventory[idx];
  if (!stack) return;
  const def = ITEMS[stack.itemId];
  if (def.heal) {
    const removed = removeItem(session.player.inventory, stack.itemId, 1);
    if (!removed) return;
    session.player.inventory = removed;
    session.player.hp = Math.min(session.player.maxHp, session.player.hp + def.heal);
    pushState(session);
    toast(session, `Restored ${def.heal} HP`, 'success');
    return;
  }
  if (stack.itemId === 'mana_potion') {
    const removed = removeItem(session.player.inventory, stack.itemId, 1);
    if (!removed) return;
    session.player.inventory = removed;
    session.player.mana = Math.min(session.player.maxMana, session.player.mana + 80);
    pushState(session);
    toast(session, 'Restored 80 mana', 'success');
    return;
  }
  if (PET_EGGS.some((egg) => egg.egg === stack.itemId)) {
    toast(session, hatchPetEgg(session.player, stack.itemId), 'success');
    markStatsDirty(session);
    pushState(session);
  }
}

function doCraft(session: Session, recipeId: string): void {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  if (!recipe) throw new Error('Unknown recipe');
  if (!isRecipeUnlocked(recipe.unlockCollection, recipe.unlockAmount, session.player.collections)) {
    throw new Error('Recipe locked — check collections');
  }
  let inv = session.player.inventory;
  for (const ing of recipe.ingredients) {
    const next = removeItem(inv, ing.itemId, ing.qty);
    if (!next) throw new Error(`Need ${ing.qty} ${ITEMS[ing.itemId].name}`);
    inv = next;
  }
  const added = addItem(inv, recipe.result.itemId, recipe.result.qty);
  if (!added) throw new Error('Inventory full');
  session.player.inventory = added;
  addCollection(session, recipe.result.itemId, recipe.result.qty);
  flagQuest(session, 'craft_item');
  grantCarpentryXp(session, recipe.ingredients.length);
  pushState(session);
  toast(session, `Crafted ${recipe.name}`, 'success');
}

function doPlaceMinion(session: Session, minionType: string): void {
  const z = zone(session.player.zoneId);
  if (!z.hasMinions) throw new Error('Go to Minion Platform on your island');
  if (session.player.minions.length >= maxMinionSlots(playerSkyblockLevel(session.player))) {
    throw new Error(`Max ${maxMinionSlots(playerSkyblockLevel(session.player))} minions — level up SkyBlock for more slots`);
  }
  const def = ensureMinionDef(minionType);
  const removed = removeItem(session.player.inventory, def.itemId, 1);
  if (!removed) throw new Error(`Need ${def.name} in inventory`);
  session.player.inventory = removed;
  const index = session.player.minions.length;
  const pad = districtSpawn(islandMap(session.player.islandId), 'island_minions');
  session.player.minions.push({
    id: uuid(),
    type: minionType,
    tier: 1,
    x: pad.x + (index % 3) * 2.2 - 2.2,
    y: pad.y + Math.floor(index / 3) * 2.2,
    storage: 0,
    lastTickAt: Date.now(),
  });
  flagQuest(session, 'place_minion');
  pushState(session);
  toast(session, `Placed ${def.name}`, 'success');
}

function doCollectMinion(session: Session, minionId: string): void {
  const m = session.player.minions.find((x) => x.id === minionId);
  if (!m) throw new Error('Minion not found');
  if (m.storage <= 0) throw new Error('Nothing to collect');
  const produces = ensureMinionDef(m.type).produces;
  const next = addItem(session.player.inventory, produces, m.storage);
  if (!next) throw new Error('Inventory full');
  session.player.collections[produces] = (session.player.collections[produces] ?? 0) + m.storage;
  session.player.inventory = next;
  m.storage = 0;
  pushState(session);
  toast(session, 'Collected minion storage', 'success');
}

function doUpgradeMinion(session: Session, minionId: string): void {
  const m = session.player.minions.find((x) => x.id === minionId);
  if (!m) throw new Error('Minion not found');
  if (m.tier >= 11) throw new Error('Already max tier');
  const costItem = ensureMinionDef(m.type).produces;
  const cost = Math.min(64 * m.tier, 512);
  const removed = removeItem(session.player.inventory, costItem, cost);
  if (!removed) throw new Error(`Need ${cost} ${ITEMS[costItem].name}`);
  session.player.inventory = removed;
  m.tier++;
  pushState(session);
  toast(session, `Minion upgraded to tier ${m.tier}`, 'success');
}

function doPickupMinion(session: Session, minionId: string): void {
  const idx = session.player.minions.findIndex((x) => x.id === minionId);
  if (idx < 0) throw new Error('Minion not found');
  const m = session.player.minions[idx];
  if (m.storage > 0) throw new Error('Collect storage first');
  const itemId = ensureMinionDef(m.type).itemId;
  const next = addItem(session.player.inventory, itemId, 1);
  if (!next) throw new Error('Inventory full');
  session.player.inventory = next;
  session.player.minions.splice(idx, 1);
  pushState(session);
}

function doNpcBuy(session: Session, itemId: ItemId, qty: number): void {
  const z = zone(session.player.zoneId);
  if (!z.npc) throw new Error('No merchant here');
  const listing = z.npc.sells.find((s) => s.itemId === itemId);
  if (!listing) throw new Error('Merchant does not sell that');
  const q = Math.max(1, Math.floor(qty));
  const cost = listing.price * q;
  if (session.player.coins < cost) throw new Error('Not enough coins');
  const next = addItem(session.player.inventory, itemId, q);
  if (!next) throw new Error('Inventory full');
  session.player.coins -= cost;
  session.player.inventory = next;
  pushState(session);
  toast(session, `Bought ${q} ${ITEMS[itemId].name}`, 'success');
}

function npcBuyPrice(_session: Session, itemId: ItemId): number {
  const price = npcSellPrice(itemId);
  if (price == null) throw new Error('This item cannot be sold');
  return price;
}

function doNpcSellFromSlot(session: Session, inventoryIndex: number, qty: number): void {
  const z = zone(session.player.zoneId);
  if (!z.npc) throw new Error('No merchant here');
  const stack = session.player.inventory[inventoryIndex];
  if (!stack) throw new Error('Empty slot');
  const price = npcBuyPrice(session, stack.itemId);
  const q = Math.min(stack.qty, Math.max(1, Math.floor(qty)));
  stack.qty -= q;
  if (stack.qty <= 0) session.player.inventory[inventoryIndex] = null;
  const paid = Math.round(price * q * npcSellMultiplier(session.player));
  session.player.coins += paid;
  flagQuest(session, 'sell_npc');
  pushState(session);
  toast(session, `Sold ${q} ${ITEMS[stack.itemId]?.name ?? stack.itemId} for ${paid.toLocaleString()} coins`, 'success');
}

function doNpcSell(session: Session, itemId: ItemId, qty: number): void {
  const z = zone(session.player.zoneId);
  if (!z.npc) throw new Error('No merchant here');
  const price = npcBuyPrice(session, itemId);
  const q = Math.max(1, Math.floor(qty));
  const removed = removeItem(session.player.inventory, itemId, q);
  if (!removed) throw new Error('Not enough items');
  session.player.inventory = removed;
  const paid = Math.round(price * q * npcSellMultiplier(session.player));
  session.player.coins += paid;
  flagQuest(session, 'sell_npc');
  pushState(session);
  toast(session, `Sold ${q} ${ITEMS[itemId]?.name ?? itemId} for ${paid.toLocaleString()} coins`, 'success');
}

function bankInterestTick(): void {
  for (const s of sessions.values()) {
    const { gained } = accrueBankInterest(s.player.bank);
    if (gained <= 0) continue;
    pushState(s);
    toast(s, `Bank interest: +${gained.toLocaleString()} coins`, 'success');
  }
}

function minionTick(): void {
  for (const s of sessions.values()) {
    let changed = false;
    for (const m of s.player.minions) {
      const def = ensureMinionDef(m.type);
      const interval = minionIntervalSec(m.type, m.tier) * 1000;
      const speed = m.fuel && m.fuel.expiresAt > Date.now() ? m.fuel.speedMultiplier : 1;
      const cap = minionStorageCap(m.type, m.tier);
      while (m.lastTickAt + interval / speed <= Date.now() && m.storage < cap) {
        m.lastTickAt += interval / speed;
        m.storage += 1;
        if (m.upgrades?.includes('diamond_spreading') && Math.random() < 0.1) {
          const diamond = addItem(s.player.inventory, 'diamond', 1);
          if (diamond) s.player.inventory = diamond;
        }
        changed = true;
      }
      if (m.upgrades?.includes('super_compactor') && m.storage >= 160) {
        const enchanted = `enchanted_${def.produces}` as ItemId;
        if (ITEMS[enchanted]) {
          const stacks = Math.floor(m.storage / 160);
          const next = addItem(s.player.inventory, enchanted, stacks);
          if (next) {
            s.player.inventory = next;
            m.storage -= stacks * 160;
            changed = true;
          }
        }
      }
      if (m.upgrades?.includes('hopper') && m.storage > 0) {
        const price = npcSellPrice(def.produces) ?? 1;
        s.player.coins += price * m.storage;
        m.storage = 0;
        changed = true;
      }
    }
    if (changed) emit(s.socket, { type: 'state', player: s.player });
  }
}

function flagQuest(session: Session, flag: string): void {
  if (!session.player.quests) session.player.quests = emptyQuestBook();
  session.player.quests.flags[flag] = true;
}

function ensureWorldMobs(session: Session): void {
  const zoneId = session.player.zoneId;
  const current = session.player.worldMobs ?? [];
  const bosses = current.filter((mob) => mob.slayerBoss || mob.mobId === 'ender_dragon' || mob.mobId === 'kuudra');
  const zoneMobs = current.filter((mob) => !mob.slayerBoss && mob.mobId !== 'ender_dragon' && mob.mobId !== 'kuudra' && mob.zoneId === zoneId);
  const stale = current.some((mob) => !mob.slayerBoss && mob.mobId !== 'ender_dragon' && mob.mobId !== 'kuudra' && mob.zoneId !== zoneId);
  if (zoneMobs.length === 0) {
    session.player.worldMobs = [...bosses, ...spawnMobsForZone(zoneId, islandMap(session.player.islandId))];
  } else if (stale) {
    session.player.worldMobs = [...bosses, ...zoneMobs];
  }
}

function worldMobTick(): void {
  const now = Date.now();
  for (const session of sessions.values()) {
    let changed = false;
    for (const mob of session.player.worldMobs ?? []) {
      if (mob.hp <= 0 && mob.respawnAt && now >= mob.respawnAt) {
        mob.hp = mob.maxHp;
        mob.respawnAt = undefined;
        changed = true;
      }
    }
    const channel = session.player.gatherChannel;
    if (channel?.fishPhase === 'waiting' && now - channel.startedAt >= channel.durationMs && !channel.biteUntil) {
      channel.fishPhase = 'bite';
      channel.biteUntil = now + 1600;
      toast(session, 'Something is biting! Press E!', 'success');
      changed = true;
    }
    const dragon = session.player.dragonFight;
    if (dragon && dragon.hp > 0 && dragon.endsAt && now > dragon.endsAt) {
      session.player.dragonFight = null;
      session.player.worldMobs = (session.player.worldMobs ?? []).filter((mob) => mob.mobId !== 'ender_dragon');
      toast(session, 'The dragon fled the nest. Place 8 eyes again.', 'info');
      changed = true;
    }
    if (changed) pushState(session);
  }
}

function playerMelee(session: Session, mobId = 'zombie', mobMaxHp = 100): { damage: number; critical: boolean; thunderBonus: number } {
  const tool = bestTool(session.player, 'sword');
  const baseCrit = rollCrit(session.player.stats.critChance);
  const base = Math.round(meleeDamage(
    tool.damage ?? 4,
    session.player.stats.strength,
    session.player.stats.critDamage,
    baseCrit,
    combatDamageBonus(skillLevel(session.player, 'combat')),
  ));
  const proc = procCombatDamage(session.player, base, mobId, mobMaxHp);
  emit(session.socket, { type: 'damageNumber', x: session.player.x, y: session.player.y, amount: proc.damage, critical: proc.critical });
  if (proc.thunderBonus > 0) toast(session, `THUNDERLORD! +${proc.thunderBonus} dmg`, 'loot');
  return { damage: proc.damage, critical: proc.critical || baseCrit, thunderBonus: proc.thunderBonus };
}

function grantMobRewards(session: Session, mobId: string): void {
  const mob = MOBS[mobId] ?? MOBS.zombie;
  const magicFind = session.player.stats.magicFind ?? 0;
  for (const drop of rollDropTable(session, mob.drops)) {
    grantDropStack(session, drop.itemId, drop.qty, magicFind);
  }
  gainSkillXp(session, 'combat', mob.combatXp);
  session.player.coins += applyLootingToCoins(session.player, mob.coins);
  awardPetXp(session, 'combat', mob.combatXp);
  if (!session.player.quests) session.player.quests = emptyQuestBook();
  ensureMidgame(session.player);
  session.player.bestiary.kills[mob.id] = (session.player.bestiary.kills[mob.id] ?? 0) + 1;
  const bestiaryMsg = checkBestiaryMilestone(session.player, mob.id);
  if (bestiaryMsg) {
    markStatsDirty(session);
    toast(session, bestiaryMsg, 'success');
  }
  const egg = PET_EGGS.find((entry) => entry.fromMob === mob.id);
  const eggChance = currentMayor().id === 'diana' ? 0.04 : 0.02;
  if (egg && Math.random() < eggChance) {
    const next = addItem(session.player.inventory, egg.egg, 1);
    if (next) {
      session.player.inventory = next;
      toast(session, `RARE DROP! ${ITEMS[egg.egg]?.name} — hatch it in the Pets menu.`, 'loot');
    }
  }
  if (slayerMatchesMob('zombie', mob.id)) {
    session.player.quests.counters.zombie = (session.player.quests.counters.zombie ?? 0) + 1;
  }
  if (session.player.activeSlayer) {
    const target = SLAYERS.find((slayer) => slayer.id === session.player.activeSlayer?.slayerId)?.targetMob;
    if (target && slayerMatchesMob(target, mob.id)) {
      session.player.activeSlayer.progressXp += Math.round(mob.combatXp * (currentMayor().id === 'aatrox' ? 1.25 : 1));
      maybeSpawnSlayerBoss(session);
    }
  }
}

function maybeSpawnSlayerBoss(session: Session): void {
  const quest = session.player.activeSlayer;
  if (!quest || quest.bossHp) return;
  if (quest.progressXp < quest.requiredXp) return;
  const slayer = SLAYERS.find((entry) => entry.id === quest.slayerId);
  const tier = slayer?.tiers.find((entry) => entry.tier === quest.tier);
  if (!slayer || !tier) return;
  quest.bossHp = tier.health;
  const id = `sb:${slayer.id}`;
  quest.bossId = id;
  const map = mapFor(session);
  let x = session.player.x;
  let y = session.player.y;
  const offsets: Array<[number, number]> = [[2, 0], [-2, 0], [0, 2], [0, -2], [2, 2], [-2, 2]];
  for (const [dx, dy] of offsets) {
    if (canStand(map, session.player.x + dx, session.player.y + dy)) {
      x = session.player.x + dx;
      y = session.player.y + dy;
      break;
    }
  }
  session.player.worldMobs = [
    ...(session.player.worldMobs ?? []).filter((mob) => !mob.slayerBoss),
    {
      id,
      mobId: slayer.targetMob,
      zoneId: session.player.zoneId,
      x,
      y,
      hp: tier.health,
      maxHp: tier.health,
      label: `${slayer.name} T${tier.tier}`,
      sprite: mobSpriteId(slayer.targetMob),
      slayerBoss: true,
    },
  ];
  toast(session, `${slayer.name} spawned nearby! Press E to fight.`, 'success');
}

function defeatSlayerBoss(session: Session): void {
  const quest = session.player.activeSlayer;
  if (!quest) return;
  const slayer = SLAYERS.find((entry) => entry.id === quest.slayerId);
  const tier = slayer?.tiers.find((entry) => entry.tier === quest.tier);
  if (!slayer || !tier) return;
  session.player.slayerXp[slayer.id] = (session.player.slayerXp[slayer.id] ?? 0) + tier.xp;
  session.player.coins += Math.round(tier.cost * 0.25);
  const guaranteedDrop = incrementSlayerRng(session.player, slayer.id, 20);
  const magicFind = session.player.stats.magicFind ?? 0;
  for (const drop of rollDropTable(session, SLAYER_DROPS[slayer.id] ?? [], { guaranteedRare: guaranteedDrop })) {
    grantDropStack(session, drop.itemId, drop.qty, magicFind);
  }
  if (guaranteedDrop) toast(session, 'RNG Meter filled — a rare slayer drop is guaranteed!', 'loot');
  session.player.worldMobs = (session.player.worldMobs ?? []).filter((mob) => !mob.slayerBoss);
  session.player.activeSlayer = null;
  toast(session, `${slayer.name} defeated! +${tier.xp} Slayer XP — check your inventory for drops.`, 'success');
}

function attackWorldMob(session: Session, mobId: string): void {
  ensureWorldMobs(session);
  const mob = (session.player.worldMobs ?? []).find((entry) => entry.id === mobId);
  if (!mob || mob.hp <= 0) throw new Error('That mob is gone');
  if (Math.hypot(mob.x - session.player.x, mob.y - session.player.y) > 2.4) throw new Error('Get closer to attack');
  const { damage, critical } = playerMelee(session, mob.mobId, mob.maxHp);
  mob.hp = Math.max(0, mob.hp - damage);
  if (mob.slayerBoss && session.player.activeSlayer) session.player.activeSlayer.bossHp = mob.hp;
  if (mob.mobId === 'ender_dragon' && session.player.dragonFight) session.player.dragonFight.hp = mob.hp;
  if (mob.mobId === 'kuudra' && session.player.kuudraFight) session.player.kuudraFight.hp = mob.hp;
    if (mob.hp <= 0) {
    finishWorldMobKill(session, mob);
    pushState(session);
    toast(session, `${critical ? 'CRITICAL! ' : ''}Defeated ${mob.label}! (${damage.toLocaleString()} dmg)`, 'success');
    return;
  }
  const def = MOBS[mob.mobId] ?? MOBS.zombie;
  const received = Math.round(incomingDamage(mob.slayerBoss
    ? (SLAYERS.find((entry) => entry.id === session.player.activeSlayer?.slayerId)?.tiers.find((tier) => tier.tier === session.player.activeSlayer?.tier)?.damage ?? def.damage)
    : def.damage, effectiveDefense(session.player, abilitySessionView(session))));
  session.player.hp -= received;
  if (session.player.hp <= 0) {
    handlePlayerDeath(session, `${mob.label} killed you!`);
    return;
  }
  pushState(session);
  toast(session, `${critical ? 'CRIT! ' : ''}${damage.toLocaleString()} dmg → ${mob.label} (${Math.ceil(mob.hp).toLocaleString()} ❤)  −${received} HP`, 'info');
}

function damageNearbyWorldMobs(session: Session, damage: number, radius = 3.2): number {
  ensureWorldMobs(session);
  let hits = 0;
  for (const mob of session.player.worldMobs ?? []) {
    if (mob.hp <= 0) continue;
    if (Math.hypot(mob.x - session.player.x, mob.y - session.player.y) > radius) continue;
    mob.hp = Math.max(0, mob.hp - damage);
    hits++;
    if (mob.slayerBoss && session.player.activeSlayer) session.player.activeSlayer.bossHp = mob.hp;
    if (mob.mobId === 'ender_dragon' && session.player.dragonFight) session.player.dragonFight.hp = mob.hp;
    if (mob.mobId === 'kuudra' && session.player.kuudraFight) session.player.kuudraFight.hp = mob.hp;
    if (mob.hp <= 0) {
      finishWorldMobKill(session, mob);
    }
  }
  maybeSpawnSlayerBoss(session);
  return hits;
}

function gatherDurationMs(session: Session, act: NonNullable<ReturnType<typeof findAction>>): number {
  let ms = act.cooldownMs ?? 800;
  if (act.skill === 'mining') {
    const extraSpeed = toolStatsForSkill(session.player, 'mining').miningSpeed ?? 0;
    ms /= miningSpeedBonus(skillLevel(session.player, 'mining')) * (1 + (session.player.stats.miningSpeed + extraSpeed) / 400);
  }
  if (act.skill === 'foraging') ms /= foragingSpeedBonus(skillLevel(session.player, 'foraging'));
  if (act.skill === 'farming') ms = Math.max(280, 650 / (1 + session.player.stats.farmingFortune / 250));
  return Math.max(280, Math.min(4500, ms));
}

function startOrContinueGather(session: Session, entityId: string, act: NonNullable<ReturnType<typeof findAction>>): void {
  if (act.tool) {
    const tool = bestTool(session.player, act.tool);
    if (tool.toolType !== act.tool || (tool.toolTier ?? 0) < (act.minToolTier ?? 1)) {
      throw new Error(`Need ${act.tool} tier ${act.minToolTier ?? 1}+ in inventory`);
    }
  }
  const now = Date.now();
  if (act.kind === 'fish') {
    handleFishing(session, entityId, act, now);
    return;
  }
  const channel = session.player.gatherChannel;
  const duration = gatherDurationMs(session, act);
  if (!channel || channel.entityId !== entityId || channel.actionId !== act.id) {
    session.player.gatherChannel = {
      entityId,
      actionId: act.id,
      kind: act.kind as 'mine' | 'farm' | 'forage',
      startedAt: now,
      durationMs: duration,
    };
    pushState(session);
    toast(session, act.kind === 'mine' ? 'Mining...' : act.kind === 'farm' ? 'Harvesting...' : 'Chopping...', 'info');
    return;
  }
  if (now - channel.startedAt < channel.durationMs) {
    const pct = Math.min(99, Math.floor(((now - channel.startedAt) / channel.durationMs) * 100));
    toast(session, `${pct}%... keep pressing E`, 'info');
    return;
  }
  session.player.gatherChannel = null;
  let qty = act.qty;
  if (act.skill === 'farming' && Math.random() < farmingFortuneChance(skillLevel(session.player, 'farming'))) qty += 1;
  giveResource(session, act, qty);
}

function handleFishing(session: Session, entityId: string, act: NonNullable<ReturnType<typeof findAction>>, now: number): void {
  const channel = session.player.gatherChannel;
  if (!channel || channel.entityId !== entityId || channel.kind !== 'fish') {
    session.player.gatherChannel = {
      entityId,
      actionId: act.id,
      kind: 'fish',
      startedAt: now,
      durationMs: 1600 + Math.random() * 2400,
      fishPhase: 'waiting',
    };
    pushState(session);
    toast(session, 'You cast your line...', 'info');
    return;
  }
  if (channel.fishPhase === 'waiting') {
    if (now - channel.startedAt < channel.durationMs) {
      toast(session, 'Waiting for a bite...', 'info');
      return;
    }
    channel.fishPhase = 'bite';
    channel.biteUntil = now + 1600;
    pushState(session);
    toast(session, 'Something is biting! Press E!', 'success');
    return;
  }
  if (channel.biteUntil && now > channel.biteUntil) {
    session.player.gatherChannel = null;
    pushState(session);
    toast(session, 'The fish got away...', 'info');
    return;
  }
  session.player.gatherChannel = null;
  const chance = 0.55 + fishingSuccessBonus(skillLevel(session.player, 'fishing')) + (currentMayor().id === 'marina' ? 0.12 : 0);
  if (Math.random() > chance) {
    pushState(session);
    toast(session, 'The fish got away...', 'info');
    return;
  }
  const qty = act.id === 'fish_lake' && Math.random() < 0.5 ? 2 : act.qty;
  giveResource(session, act, qty);
}

function addCollection(session: Session, itemId: ItemId, qty: number): void {
  if (qty <= 0 || !COLLECTIONS.some((entry) => entry.itemId === itemId)) return;
  const before = session.player.collections[itemId] ?? 0;
  const after = before + qty;
  session.player.collections[itemId] = after;
  noteCollectionMilestone(session, itemId, before, after);
}

function noteCollectionMilestone(session: Session, itemId: ItemId, before: number, after: number): void {
  const collection = COLLECTIONS.find((entry) => entry.itemId === itemId);
  if (!collection) return;
  const prev = collectionProgress(collection, before).tier;
  const next = collectionProgress(collection, after).tier;
  if (next <= prev) return;
  const reward = collection.tiers[next - 1];
  const coins = 25 * next;
  session.player.coins += coins;
  if (!session.player.unlockedRecipes) session.player.unlockedRecipes = [];
  const recipeFlag = `collection:${itemId}:t${next}`;
  if (!session.player.unlockedRecipes.includes(recipeFlag)) {
    session.player.unlockedRecipes.push(recipeFlag);
  }
  toast(session, `Collection: ${reward?.label ?? collection.name}  (+${coins} coins)`, 'success');
  playerChat(session, `COLLECTION LEVEL UP! ${collection.name} ${next}: ${reward?.label ?? collection.name} (+${coins} coins)`);
}

function installMinionUpgrade(session: Session, minionId: string, upgradeId: ItemId): void {
  const minion = session.player.minions.find((entry) => entry.id === minionId);
  if (!minion) throw new Error('Minion not found');
  if (!['super_compactor', 'compactor', 'hopper', 'diamond_spreading'].includes(upgradeId)) {
    throw new Error('That is not a minion upgrade');
  }
  if (minion.upgrades?.includes(upgradeId)) throw new Error('Already installed');
  const removed = removeItem(session.player.inventory, upgradeId, 1);
  if (!removed) throw new Error(`Need ${ITEMS[upgradeId]?.name ?? upgradeId} in inventory`);
  session.player.inventory = removed;
  minion.upgrades = [...(minion.upgrades ?? []), upgradeId];
  pushState(session);
  toast(session, `Installed ${ITEMS[upgradeId]?.name ?? upgradeId}`, 'success');
}

function claimStarterQuest(session: Session): void {
  if (!session.player.quests) session.player.quests = emptyQuestBook();
  if (session.player.quests.claimed) throw new Error('Reward already claimed');
  if (!starterQuestComplete(session.player)) throw new Error('Finish every quest step first');
  session.player.quests.claimed = true;
  session.player.coins += 500;
  const extra = addItem(session.player.inventory, 'enchanted_cobble', 1);
  if (extra) session.player.inventory = extra;
  pushState(session);
  toast(session, 'Quest Book complete! +500 coins and Enchanted Cobblestone.', 'success');
}

function finishWorldMobKill(session: Session, mob: { id: string; mobId: string; slayerBoss?: boolean }): void {
  if (mob.slayerBoss) {
    defeatSlayerBoss(session);
    return;
  }
  if (mob.mobId === 'ender_dragon') {
    defeatDragon(session);
    return;
  }
  if (mob.mobId === 'kuudra') {
    defeatKuudra(session);
    return;
  }
  grantMobRewards(session, mob.mobId);
  const live = (session.player.worldMobs ?? []).find((entry) => entry.id === mob.id);
  if (live) live.respawnAt = Date.now() + 7000;
}

function spawnDragonIfReady(session: Session): void {
  const fight = session.player.dragonFight;
  if (!fight || fight.hp <= 0) return;
  session.player.worldMobs = [
    ...(session.player.worldMobs ?? []).filter((mob) => mob.mobId !== 'ender_dragon'),
    {
      id: 'event:dragon',
      mobId: 'ender_dragon',
      zoneId: 'end_nest',
      x: session.player.x + 2,
      y: session.player.y,
      hp: fight.hp,
      maxHp: fight.maxHp,
      label: fight.type,
      sprite: 'mob_zealot',
    },
  ];
}

function spawnKuudra(session: Session): void {
  const fight = session.player.kuudraFight;
  if (!fight) return;
  session.player.worldMobs = [
    ...(session.player.worldMobs ?? []).filter((mob) => mob.mobId !== 'kuudra'),
    {
      id: 'event:kuudra',
      mobId: 'kuudra',
      zoneId: 'crimson_volcano',
      x: session.player.x + 2,
      y: session.player.y,
      hp: fight.hp,
      maxHp: fight.maxHp,
      label: `Kuudra T${fight.tier}`,
      sprite: 'mob_magma',
    },
  ];
}

function defeatDragon(session: Session): void {
  const fight = session.player.dragonFight;
  grantMobRewards(session, 'ender_dragon');
  const frag = addItem(session.player.inventory, 'dragon_fragment', 3 + Math.floor(Math.random() * 4));
  if (frag) session.player.inventory = frag;
  if (Math.random() < 0.12) {
    const egg = addItem(session.player.inventory, 'enderman_pet_egg', 1);
    if (egg) session.player.inventory = egg;
  }
  session.player.dragonFight = null;
  session.player.worldMobs = (session.player.worldMobs ?? []).filter((mob) => mob.mobId !== 'ender_dragon');
  toast(session, `${fight?.type ?? 'Dragon'} felled! Dragon Fragments dropped.`, 'success');
}

function defeatKuudra(session: Session): void {
  const fight = session.player.kuudraFight;
  grantMobRewards(session, 'kuudra');
  session.player.coins += 2500 * (fight?.tier ?? 1);
  session.player.kuudraFight = null;
  session.player.worldMobs = (session.player.worldMobs ?? []).filter((mob) => mob.mobId !== 'kuudra');
  toast(session, `Kuudra defeated! +${(2500 * (fight?.tier ?? 1)).toLocaleString()} coins.`, 'success');
}

function claimDungeonSecret(session: Session): void {
  const run = session.player.dungeonRun;
  if (!run || run.secretClaimed) throw new Error('No secret here');
  run.secretClaimed = true;
  run.secretsFound = (run.secretsFound ?? 0) + 1;
  run.score += 40;
  session.player.coins += 75;
  pushState(session);
  toast(session, 'Secret found! +40 score, +75 coins.', 'success');
}

function inviteDungeonParty(session: Session): void {
  if (!session.player.dungeonRun) throw new Error('Enter a floor first');
  session.player.dungeonPartyId = session.player.id;
  session.player.dungeonRun.partyId = session.player.id;
  let invited = 0;
  for (const other of sessions.values()) {
    if (other.player.id === session.player.id) continue;
    if (other.player.islandId !== 'dungeon_hub') continue;
    toast(other, `${session.player.username} invited you to their dungeon — open Dungeons and click Join Party.`, 'info');
    invited++;
  }
  pushState(session);
  toast(session, invited ? `Party hosted. ${invited} player(s) nearby can join.` : 'Party hosted. Nobody else is in the Dungeon Hub.', 'success');
}

function joinDungeonParty(session: Session, hostId: string): void {
  const host = [...sessions.values()].find((entry) => entry.player.id === hostId && entry.player.dungeonRun);
  if (!host?.player.dungeonRun) throw new Error('That party is gone');
  onDungeonPartyJoin(host, session);
  warpToDungeonSpawn(session);
  session.menuOpen = false;
  pushState(session, { resetPosition: true });
  toast(session, `Joined ${host.player.username}'s dungeon party!`, 'success');
  toast(host, `${session.player.username} joined your dungeon party!`, 'success');
}

export function getCatalogExtra() {
  return {
    zones: ZONES,
    islands: ISLANDS,
    warpableIslands: warpableIslands(),
    defaultZone: DEFAULT_ZONE,
  };
}
