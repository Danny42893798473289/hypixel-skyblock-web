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
  x?: number;
  y?: number;
  facing?: Facing;
  mana?: number;
  /** Admin account — bypasses limits for testing (future commands). */
  isAdmin?: boolean;
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

function ensureDir(): void {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

export function loadStore(): UsersFile {
  ensureDir();
  if (!fs.existsSync(usersPath)) {
    data = emptyFile();
    writeNow();
    return data;
  }
  try {
    const raw = fs.readFileSync(usersPath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<UsersFile> & { schemaVersion?: number };
    if ((parsed.schemaVersion ?? 1) < 2) {
      const backupPath = path.join(dataDir, 'users.v1.json.bak');
      if (!fs.existsSync(backupPath)) fs.copyFileSync(usersPath, backupPath);
    }
    data = {
      schemaVersion: 2,
      users: Array.isArray(parsed.users) ? parsed.users : [],
      bazaarOrders: Array.isArray(parsed.bazaarOrders) ? parsed.bazaarOrders : [],
      auctions: Array.isArray(parsed.auctions) ? parsed.auctions : [],
    };
  } catch {
    data = emptyFile();
    writeNow();
  }
  return data;
}

function writeNow(): void {
  ensureDir();
  const tmp = `${usersPath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, usersPath);
}

export function persist(immediate = false): void {
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
  }, 80);
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

export function openOrders(itemId: ItemId, side: 'buy' | 'sell'): StoredOrder[] {
  return data.bazaarOrders.filter((o) => o.itemId === itemId && o.side === side && o.qty > o.filled);
}

export function getAuctions(): StoredAuction[] {
  return data.auctions;
}

export function addAuction(auction: StoredAuction): void {
  data.auctions.push(auction);
  persist(true);
}

export function removeAuction(id: string): StoredAuction | undefined {
  const auction = data.auctions.find((entry) => entry.id === id);
  data.auctions = data.auctions.filter((entry) => entry.id !== id);
  persist(true);
  return auction;
}

export function updateAuction(id: string, patch: Partial<StoredAuction>): StoredAuction | undefined {
  const auction = data.auctions.find((entry) => entry.id === id);
  if (!auction) return undefined;
  Object.assign(auction, patch);
  persist(true);
  return auction;
}
