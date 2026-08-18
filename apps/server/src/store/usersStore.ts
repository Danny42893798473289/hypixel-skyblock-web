import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  ItemId,
  Inventory,
  SkillsState,
  CollectionsState,
  PlacedMinion,
  BankState,
  EquipmentSlot,
  ItemStack,
  PetState,
  SlayerQuestState,
  DungeonRunState,
  DungeonClass,
  Facing,
  TileKind,
  QuestBookState,
  GardenState,
  HotmState,
  BestiaryState,
  MuseumState,
  WardrobeState,
  DragonFightState,
  KuudraFightState,
} from '@aether/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Where the save file lives. Override with AETHER_DATA_DIR (a folder) or
 * AETHER_USERS_FILE (a full path) — handy for Docker volumes or keeping the
 * save next to the project instead of inside the build output.
 */
function resolveUsersPath(): string {
  const explicitFile = process.env.AETHER_USERS_FILE?.trim();
  if (explicitFile) return path.resolve(explicitFile);
  const explicitDir = process.env.AETHER_DATA_DIR?.trim();
  if (explicitDir) return path.resolve(explicitDir, 'users.json');
  return path.resolve(__dirname, '../../data/users.json');
}

export const usersPath = resolveUsersPath();
export const dataDir = path.dirname(usersPath);
export const auctionsPath = path.join(dataDir, 'auctions.json');

export interface StoredUser {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: number;
  updatedAt: number;
  coins: number;
  zoneId: string;
  hp: number;
  hotbarSlot: number;
  inventory: Inventory;
  skills: SkillsState;
  collections: CollectionsState;
  minions: PlacedMinion[];
  bank?: BankState;
  equipment?: Record<EquipmentSlot, ItemStack | null>;
  accessories?: ItemStack[];
  pets?: PetState[];
  fairySouls?: number;
  activeSlayer?: SlayerQuestState | null;
  slayerXp?: Record<string, number>;
  dungeonRun?: DungeonRunState | null;
  selectedDungeonClass?: DungeonClass;
  visitedZones?: string[];
  quests?: QuestBookState;
  garden?: GardenState;
  hotm?: HotmState;
  bestiary?: BestiaryState;
  museum?: MuseumState;
  wardrobe?: WardrobeState;
  dragonFight?: DragonFightState | null;
  kuudraFight?: KuudraFightState | null;
  backpacks?: Inventory[];
  islandBlocks?: Record<string, TileKind>;
  pendingDungeonChest?: import('@aether/shared').DungeonChestReward | null;
  x?: number;
  y?: number;
  facing?: Facing;
  mana?: number;
  /** Admin account — bypasses limits for testing (future commands). */
  isAdmin?: boolean;
  slayerRngMeter?: Record<string, number>;
  essence?: Partial<Record<string, number>>;
  unlockedRecipes?: string[];
  claimedSkillRewards?: string[];
  bits?: number;
  extraMinionSlots?: number;
  extraAccessorySlots?: number;
  communityPurchases?: Record<string, number>;
  dailies?: import('@aether/shared').DailyState;
}

export interface StoredOrder {
  id: string;
  playerId: string;
  itemId: ItemId;
  side: 'buy' | 'sell';
  price: number;
  qty: number;
  filled: number;
  createdAt: number;
}

export interface StoredAuction {
  id: string;
  sellerId: string;
  sellerName: string;
  item: ItemStack;
  price: number;
  highestBid: number;
  highestBidderId?: string;
  bin: boolean;
  createdAt: number;
  expiresAt: number;
  /** Synced from Hypixel SkyBlock — refreshed hourly. */
  mirrored?: boolean;
}

export interface UsersFile {
  schemaVersion: 2;
  users: StoredUser[];
  bazaarOrders: StoredOrder[];
  auctions: StoredAuction[];
}

const emptyFile = (): UsersFile => ({ schemaVersion: 2, users: [], bazaarOrders: [], auctions: [] });

let data: UsersFile = emptyFile();
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let auctionSaveTimer: ReturnType<typeof setTimeout> | null = null;
let persistPaused = 0;
const lockPath = path.join(dataDir, 'server.pid');

function ensureDir(): void {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function pidIsAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return (err as NodeJS.ErrnoException).code === 'EPERM';
  }
}

function releaseDataLock(): void {
  try {
    if (fs.readFileSync(lockPath, 'utf8').trim() === String(process.pid)) fs.unlinkSync(lockPath);
  } catch {
    /* lock already gone */
  }
}

function acquireDataLock(): void {
  ensureDir();
  if (fs.existsSync(lockPath)) {
    const existing = Number(fs.readFileSync(lockPath, 'utf8').trim());
    if (pidIsAlive(existing) && existing !== process.pid) {
      throw new Error(
        `Server already running (pid ${existing}). Stop that process first.\nIf it is leftover from a crash, delete ${lockPath} and try again.`,
      );
    }
  }
  fs.writeFileSync(lockPath, String(process.pid));
  process.once('exit', releaseDataLock);
}

function readJsonFile<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}

function writeJsonFile(filePath: string, value: unknown): void {
  ensureDir();
  const tmp = `${filePath}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  try {
    fs.writeFileSync(tmp, JSON.stringify(value), 'utf8');
    try {
      fs.renameSync(tmp, filePath);
    } catch {
      fs.copyFileSync(tmp, filePath);
      fs.unlinkSync(tmp);
    }
  } catch (err) {
    try { fs.unlinkSync(tmp); } catch { /* leftover tmp is harmless */ }
    throw err;
  }
}

function loadAuctions(fromUsersFile: StoredAuction[]): StoredAuction[] {
  const separate = readJsonFile<StoredAuction[]>(auctionsPath);
  if (Array.isArray(separate)) return separate;
  return Array.isArray(fromUsersFile) ? fromUsersFile : [];
}

export function loadStore(): UsersFile {
  acquireDataLock();
  ensureDir();
  if (!fs.existsSync(usersPath)) {
    data = emptyFile();
    writeNow();
    writeAuctionsNow();
    return data;
  }
  try {
    const parsed = readJsonFile<Partial<UsersFile> & { schemaVersion?: number }>(usersPath) ?? {};
    if ((parsed.schemaVersion ?? 1) < 2) {
      const backupPath = path.join(dataDir, 'users.v1.json.bak');
      if (!fs.existsSync(backupPath)) fs.copyFileSync(usersPath, backupPath);
    }
    const migratedAuctions = Array.isArray(parsed.auctions) ? parsed.auctions : [];
    data = {
      schemaVersion: 2,
      users: Array.isArray(parsed.users) ? parsed.users : [],
      bazaarOrders: Array.isArray(parsed.bazaarOrders) ? parsed.bazaarOrders : [],
      auctions: loadAuctions(migratedAuctions),
    };
    if (!fs.existsSync(auctionsPath) && data.auctions.length) writeAuctionsNow();
    if (migratedAuctions.length) writeNow();
  } catch {
    data = emptyFile();
    writeNow();
    writeAuctionsNow();
  }
  return data;
}

function writeNow(): void {
  try {
    writeJsonFile(usersPath, {
      schemaVersion: data.schemaVersion,
      users: data.users,
      bazaarOrders: data.bazaarOrders,
    });
  } catch (err) {
    console.error('[save] failed to write users.json:', err);
  }
}

function writeAuctionsNow(): void {
  try {
    writeJsonFile(auctionsPath, data.auctions);
  } catch (err) {
    console.error('[save] failed to write auctions.json:', err);
  }
}

/** Hold disk writes while applying a bulk bazaar/auction update, then flush once. */
export function withPausedPersist(fn: () => void): void {
  persistPaused++;
  try {
    fn();
  } finally {
    persistPaused = Math.max(0, persistPaused - 1);
    if (persistPaused === 0) persist(true);
  }
}

export function persist(immediate = false): void {
  if (persistPaused > 0) return;
  if (immediate) {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = null;
    writeNow();
    return;
  }
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    writeNow();
  }, 1500);
}

export function persistAuctions(immediate = false): void {
  if (immediate) {
    if (auctionSaveTimer) clearTimeout(auctionSaveTimer);
    auctionSaveTimer = null;
    writeAuctionsNow();
    return;
  }
  if (auctionSaveTimer) return;
  auctionSaveTimer = setTimeout(() => {
    auctionSaveTimer = null;
    writeAuctionsNow();
  }, 1500);
}

export function getData(): UsersFile {
  return data;
}

export function findUserById(id: string): StoredUser | undefined {
  return data.users.find((u) => u.id === id);
}

export function findUserByUsername(username: string): StoredUser | undefined {
  const key = username.trim().toLowerCase();
  return data.users.find((u) => u.username.toLowerCase() === key);
}

export function addUser(user: StoredUser): void {
  data.users.push(user);
  persist(true);
}

export function saveUser(user: StoredUser): void {
  const i = data.users.findIndex((u) => u.id === user.id);
  if (i >= 0) data.users[i] = user;
  else data.users.push(user);
  persist();
}

export function getOrders(): StoredOrder[] {
  return data.bazaarOrders;
}

export function addOrder(order: StoredOrder): void {
  data.bazaarOrders.push(order);
  persist(true);
}

export function patchOrder(id: string, filled: number, qty: number): void {
  if (filled >= qty) {
    data.bazaarOrders = data.bazaarOrders.filter((o) => o.id !== id);
  } else {
    const o = data.bazaarOrders.find((x) => x.id === id);
    if (o) o.filled = filled;
  }
  persist();
}

export function removeOrder(id: string): StoredOrder | undefined {
  const o = data.bazaarOrders.find((x) => x.id === id);
  data.bazaarOrders = data.bazaarOrders.filter((x) => x.id !== id);
  persist(true);
  return o;
}

export function removeOrdersForPlayer(playerId: string): number {
  const before = data.bazaarOrders.length;
  data.bazaarOrders = data.bazaarOrders.filter((o) => o.playerId !== playerId);
  const removed = before - data.bazaarOrders.length;
  if (removed > 0) persist(true);
  return removed;
}

export function removeMirroredAuctions(): number {
  const before = data.auctions.length;
  data.auctions = data.auctions.filter((a) => !a.mirrored);
  const removed = before - data.auctions.length;
  if (removed > 0) persistAuctions(true);
  return removed;
}

export function openOrders(itemId: ItemId, side: 'buy' | 'sell'): StoredOrder[] {
  return data.bazaarOrders.filter((o) => o.itemId === itemId && o.side === side && o.qty > o.filled);
}

export function getAuctions(): StoredAuction[] {
  return data.auctions;
}

export function addAuction(auction: StoredAuction): void {
  data.auctions.push(auction);
  persistAuctions();
}

export function replaceMirroredAuctions(next: StoredAuction[]): void {
  data.auctions = data.auctions.filter((auction) => !auction.mirrored).concat(next);
  persistAuctions(true);
}

export function removeAuction(id: string): StoredAuction | undefined {
  const auction = data.auctions.find((entry) => entry.id === id);
  data.auctions = data.auctions.filter((entry) => entry.id !== id);
  persistAuctions(true);
  return auction;
}

export function updateAuction(id: string, patch: Partial<StoredAuction>): StoredAuction | undefined {
  const auction = data.auctions.find((entry) => entry.id === id);
  if (!auction) return undefined;
  Object.assign(auction, patch);
  persistAuctions();
  return auction;
}
