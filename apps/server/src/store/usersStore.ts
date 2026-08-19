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
  sacks?: import('@aether/shared').SacksState;
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
  activeProfileId?: string;
  profiles?: Record<string, StoredProfile>;
  coopHostId?: string | null;
  coopMembers?: string[];
  coopHostProfileId?: string | null;
  unlockedWarps?: string[];
  collectionBonuses?: import('@aether/shared').CollectionBonuses;
}

export interface StoredProfile {
  name: string;
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
  sacks?: import('@aether/shared').SacksState;
  islandBlocks?: Record<string, TileKind>;
  pendingDungeonChest?: import('@aether/shared').DungeonChestReward | null;
  x?: number;
  y?: number;
  facing?: Facing;
  mana?: number;
  slayerRngMeter?: Record<string, number>;
  essence?: Partial<Record<string, number>>;
  unlockedRecipes?: string[];
  claimedSkillRewards?: string[];
  bits?: number;
  extraMinionSlots?: number;
  extraAccessorySlots?: number;
  communityPurchases?: Record<string, number>;
  dailies?: import('@aether/shared').DailyState;
  coopHostId?: string | null;
  coopMembers?: string[];
  coopHostProfileId?: string | null;
  unlockedWarps?: string[];
  collectionBonuses?: import('@aether/shared').CollectionBonuses;
}

export const MAX_PROFILES = 5;

export function profileFromUser(user: StoredUser, name = 'Main'): StoredProfile {
  return {
    name,
    coins: user.coins,
    zoneId: user.zoneId,
    hp: user.hp,
    hotbarSlot: user.hotbarSlot,
    inventory: user.inventory,
    skills: user.skills,
    collections: user.collections,
    minions: user.minions,
    bank: user.bank,
    equipment: user.equipment,
    accessories: user.accessories,
    pets: user.pets,
    fairySouls: user.fairySouls,
    activeSlayer: user.activeSlayer,
    slayerXp: user.slayerXp,
    dungeonRun: user.dungeonRun,
    selectedDungeonClass: user.selectedDungeonClass,
    visitedZones: user.visitedZones,
    quests: user.quests,
    garden: user.garden,
    hotm: user.hotm,
    bestiary: user.bestiary,
    museum: user.museum,
    wardrobe: user.wardrobe,
    dragonFight: user.dragonFight,
    kuudraFight: user.kuudraFight,
    backpacks: user.backpacks,
    sacks: user.sacks,
    islandBlocks: user.islandBlocks,
    pendingDungeonChest: user.pendingDungeonChest,
    x: user.x,
    y: user.y,
    facing: user.facing,
    mana: user.mana,
    slayerRngMeter: user.slayerRngMeter,
    essence: user.essence,
    unlockedRecipes: user.unlockedRecipes,
    claimedSkillRewards: user.claimedSkillRewards,
    bits: user.bits,
    extraMinionSlots: user.extraMinionSlots,
    extraAccessorySlots: user.extraAccessorySlots,
    communityPurchases: user.communityPurchases,
    dailies: user.dailies,
    coopHostId: user.coopHostId ?? null,
    coopMembers: user.coopMembers ?? [],
    coopHostProfileId: user.coopHostProfileId ?? null,
    unlockedWarps: user.unlockedWarps ?? [],
    collectionBonuses: user.collectionBonuses,
  };
}

export function applyProfileToUser(user: StoredUser, profile: StoredProfile): void {
  user.coins = profile.coins;
  user.zoneId = profile.zoneId;
  user.hp = profile.hp;
  user.hotbarSlot = profile.hotbarSlot;
  user.inventory = profile.inventory;
  user.skills = profile.skills;
  user.collections = profile.collections;
  user.minions = profile.minions;
  user.bank = profile.bank;
  user.equipment = profile.equipment;
  user.accessories = profile.accessories;
  user.pets = profile.pets;
  user.fairySouls = profile.fairySouls;
  user.activeSlayer = profile.activeSlayer;
  user.slayerXp = profile.slayerXp;
  user.dungeonRun = profile.dungeonRun;
  user.selectedDungeonClass = profile.selectedDungeonClass;
  user.visitedZones = profile.visitedZones;
  user.quests = profile.quests;
  user.garden = profile.garden;
  user.hotm = profile.hotm;
  user.bestiary = profile.bestiary;
  user.museum = profile.museum;
  user.wardrobe = profile.wardrobe;
  user.dragonFight = profile.dragonFight;
  user.kuudraFight = profile.kuudraFight;
  user.backpacks = profile.backpacks;
  user.sacks = profile.sacks;
  user.islandBlocks = profile.islandBlocks;
  user.pendingDungeonChest = profile.pendingDungeonChest;
  user.x = profile.x;
  user.y = profile.y;
  user.facing = profile.facing;
  user.mana = profile.mana;
  user.slayerRngMeter = profile.slayerRngMeter;
  user.essence = profile.essence;
  user.unlockedRecipes = profile.unlockedRecipes;
  user.claimedSkillRewards = profile.claimedSkillRewards;
  user.bits = profile.bits;
  user.extraMinionSlots = profile.extraMinionSlots;
  user.extraAccessorySlots = profile.extraAccessorySlots;
  user.communityPurchases = profile.communityPurchases;
  user.dailies = profile.dailies;
  user.coopHostId = profile.coopHostId ?? null;
  user.coopMembers = profile.coopMembers ?? [];
  user.coopHostProfileId = profile.coopHostProfileId ?? null;
  user.unlockedWarps = profile.unlockedWarps ?? [];
  user.collectionBonuses = profile.collectionBonuses;
}

export function ensureProfiles(user: StoredUser): StoredUser {
  if (!user.profiles || !Object.keys(user.profiles).length) {
    const id = 'main';
    user.profiles = { [id]: profileFromUser(user, 'Main') };
    user.activeProfileId = id;
  }
  if (!user.activeProfileId || !user.profiles[user.activeProfileId]) {
    user.activeProfileId = Object.keys(user.profiles)[0] ?? 'main';
    if (!user.profiles[user.activeProfileId]) user.profiles[user.activeProfileId] = profileFromUser(user, 'Main');
  }
  applyProfileToUser(user, user.profiles[user.activeProfileId]!);
  return user;
}

export function activeProfile(user: StoredUser): StoredProfile {
  ensureProfiles(user);
  return user.profiles![user.activeProfileId!]!;
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
  schemaVersion: 3;
  users: StoredUser[];
  bazaarOrders: StoredOrder[];
  auctions: StoredAuction[];
}

const emptyFile = (): UsersFile => ({ schemaVersion: 3, users: [], bazaarOrders: [], auctions: [] });

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
    if ((parsed.schemaVersion ?? 1) < 3) {
      const backupPath = path.join(dataDir, `users.v${parsed.schemaVersion ?? 1}.json.bak`);
      if (!fs.existsSync(backupPath)) fs.copyFileSync(usersPath, backupPath);
    }
    const migratedAuctions = Array.isArray(parsed.auctions) ? parsed.auctions : [];
    data = {
      schemaVersion: 3,
      users: (Array.isArray(parsed.users) ? parsed.users : []).map((user) => ensureProfiles(user)),
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
