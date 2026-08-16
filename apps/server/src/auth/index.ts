import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import {
  emptyBestiary,
  emptyCollections,
  emptyGarden,
  emptyHotm,
  emptyMuseum,
  emptySkills,
  emptyWardrobe,
  starterInventory,
  ensureStarterTools,
  STARTER_COINS,
  MAX_HP,
  DEFAULT_ZONE,
  islandForZone,
  BASE_STATS,
  ZONES,
  islandMapForZone,
  districtSpawn,
  canStand,
  buildDungeonRoomMap,
  dungeonPhase,
  dungeonFloor,
  initRoomMobs,
  DUNGEON_ZONE,
  accessoryBagSlots,
  addItem,
  type ItemStack,
  type PlayerState,
} from '@aether/shared';
import {
  addUser,
  findUserById,
  findUserByUsername,
  loadStore,
  saveUser,
  type StoredUser,
} from '../store/usersStore.js';
import { emptyEquipment, magicalPower, recomputeStats } from '../game/profile.js';
import { accrueBankInterest } from '../game/bank.js';

/** Interest earned while offline, surfaced once the player connects. */
const offlineInterestByUser = new Map<string, number>();

export function takeOfflineInterest(userId: string): number {
  const amount = offlineInterestByUser.get(userId) ?? 0;
  offlineInterestByUser.delete(userId);
  return amount;
}

/** Migrate older saves and ensure in-progress runs load into the instanced dungeon map. */
function normalizeDungeonRun(player: PlayerState): void {
  const run = player.dungeonRun;
  if (!run) return;
  if (!run.phase) run.phase = dungeonPhase(run);
  if (run.phase === 'rooms' && run.room > 0 && (!run.mobHp || !Object.keys(run.mobHp).length)) {
    run.mobHp = initRoomMobs(run);
  }
  if (run.phase === 'boss' && run.bossHp == null) {
    const floor = dungeonFloor(run.floorId);
    if (floor) run.bossHp = floor.boss.health;
  }
  if (player.zoneId !== DUNGEON_ZONE) {
    player.zoneId = DUNGEON_ZONE;
    player.islandId = 'dungeon_hub';
    const spawn = buildDungeonRoomMap(run).spawn;
    player.x = spawn.x;
    player.y = spawn.y;
  }
}

const TOKEN_SECRET = process.env.AETHER_SECRET ?? 'aether-dev-secret-change-me';

export function initStore(): void {
  loadStore();
}

function signToken(userId: string): string {
  const nonce = randomBytes(16).toString('hex');
  const payload = Buffer.from(`${userId}:${nonce}`).toString('base64url');
  const sig = createHash('sha256').update(`${payload}:${TOKEN_SECRET}`).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyToken(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = createHash('sha256').update(`${payload}:${TOKEN_SECRET}`).digest('base64url');
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const decoded = Buffer.from(payload, 'base64url').toString('utf8');
    const userId = decoded.split(':')[0];
    if (!userId) return null;
    return findUserById(userId) ? userId : null;
  } catch {
    return null;
  }
}

export function revokeToken(_token: string): void {}

function migratePlayerSave(user: StoredUser): { equipment: PlayerState['equipment']; inventory: PlayerState['inventory'] } {
  const equipment = emptyEquipment();
  const legacy = user.equipment as Record<string, ItemStack | null> | undefined;
  if (legacy) {
    for (const key of ['helmet', 'chestplate', 'leggings', 'boots'] as const) {
      equipment[key] = legacy[key] ?? null;
    }
  }
  let inventory = user.inventory;
  const legacyWeapon = legacy?.weapon;
  if (legacyWeapon) {
    const next = addItem(inventory, legacyWeapon.itemId, legacyWeapon.qty);
    if (next) inventory = next;
  }
  inventory = ensureStarterTools(inventory);
  return { equipment, inventory };
}

function toPlayer(user: StoredUser): PlayerState {
  // Saves from older layouts can point at zones that no longer exist.
  const zoneId = user.zoneId && ZONES[user.zoneId] ? user.zoneId : DEFAULT_ZONE;
  const { equipment, inventory } = migratePlayerSave(user);
  const accessories = user.accessories ?? [];
  const bank = user.bank ?? { balance: 0, tier: 'starter' as const, lastInterestAt: Date.now() };
  const map = islandMapForZone(zoneId);
  const spawn = districtSpawn(map, zoneId);
  const offlineInterest = accrueBankInterest(bank);
  if (offlineInterest.gained > 0) offlineInterestByUser.set(user.id, offlineInterest.gained);
  const player: PlayerState = {
    id: user.id,
    username: user.username,
    zoneId,
    islandId: islandForZone(zoneId),
    coins: user.coins,
    hp: user.hp,
    maxHp: MAX_HP,
    stats: { ...BASE_STATS },
    hotbarSlot: user.hotbarSlot,
    inventory,
    skills: { ...emptySkills(), ...user.skills },
    collections: user.collections,
    minions: user.minions,
    bank,
    equipment,
    accessories,
    pets: user.pets ?? [],
    fairySouls: user.fairySouls ?? 0,
    mana: user.mana ?? BASE_STATS.intelligence,
    maxMana: BASE_STATS.intelligence,
    accessoryBagSlots: accessoryBagSlots(user.fairySouls ?? 0),
    magicalPower: magicalPower(accessories),
    activeSlayer: user.activeSlayer ?? null,
    slayerXp: user.slayerXp ?? {},
    slayerRngMeter: user.slayerRngMeter ?? {},
    essence: user.essence ?? {},
    unlockedRecipes: user.unlockedRecipes ?? [],
    dungeonRun: user.dungeonRun ?? null,
    selectedDungeonClass: user.selectedDungeonClass ?? 'berserk',
    visitedZones: user.visitedZones ?? [zoneId],
    quests: user.quests ?? { completed: [], counters: {}, flags: {}, claimed: false },
    garden: user.garden ?? emptyGarden(),
    hotm: user.hotm ?? emptyHotm(),
    bestiary: user.bestiary ?? emptyBestiary(),
    museum: user.museum ?? emptyMuseum(),
    wardrobe: user.wardrobe && user.wardrobe.pages.length ? user.wardrobe : emptyWardrobe(),
    dragonFight: user.dragonFight ?? null,
    kuudraFight: user.kuudraFight ?? null,
    x: spawn.x,
    y: spawn.y,
    facing: user.facing ?? 'down',
  };
  if (user.x != null && user.y != null && canStand(map, user.x, user.y)) {
    player.x = user.x;
    player.y = user.y;
  }
  normalizeDungeonRun(player);
  player.stats = recomputeStats(player);
  player.maxHp = player.stats.health;
  player.hp = Math.min(player.hp, player.maxHp);
  player.maxMana = Math.max(100, Math.round(player.stats.intelligence));
  player.mana = Math.min(user.mana ?? player.maxMana, player.maxMana);
  player.accessoryBagSlots = accessoryBagSlots(player.fairySouls);
  return player;
}

function applyPlayer(user: StoredUser, player: PlayerState): StoredUser {
  return {
    ...user,
    coins: player.coins,
    zoneId: player.zoneId,
    hp: player.hp,
    hotbarSlot: player.hotbarSlot,
    inventory: player.inventory,
    skills: player.skills,
    collections: player.collections,
    minions: player.minions,
    bank: player.bank,
    equipment: player.equipment,
    accessories: player.accessories,
    pets: player.pets,
    fairySouls: player.fairySouls,
    mana: player.mana,
    activeSlayer: player.activeSlayer,
    slayerXp: player.slayerXp,
    slayerRngMeter: player.slayerRngMeter,
    essence: player.essence,
    unlockedRecipes: player.unlockedRecipes,
    dungeonRun: player.dungeonRun,
    selectedDungeonClass: player.selectedDungeonClass,
    visitedZones: player.visitedZones,
    quests: player.quests,
    garden: player.garden,
    hotm: player.hotm,
    bestiary: player.bestiary,
    museum: player.museum,
    wardrobe: player.wardrobe,
    dragonFight: player.dragonFight,
    kuudraFight: player.kuudraFight,
    x: player.x,
    y: player.y,
    facing: player.facing,
    updatedAt: Date.now(),
  };
}

export function registerUser(username: string, password: string): { token: string; player: PlayerState } {
  const clean = username.trim();
  if (clean.length < 3 || clean.length > 16) throw new Error('Username must be 3-16 characters');
  if (!/^[a-zA-Z0-9_]+$/.test(clean)) throw new Error('Username: letters, numbers, underscore only');
  if (password.length < 4) throw new Error('Password must be at least 4 characters');
  if (findUserByUsername(clean)) throw new Error('Username already taken');

  const now = Date.now();
  const spawn = districtSpawn(islandMapForZone(DEFAULT_ZONE), DEFAULT_ZONE);
  const user: StoredUser = {
    id: uuid(),
    username: clean,
    passwordHash: bcrypt.hashSync(password, 10),
    createdAt: now,
    updatedAt: now,
    coins: STARTER_COINS,
    zoneId: DEFAULT_ZONE,
    hp: MAX_HP,
    hotbarSlot: 0,
    inventory: starterInventory(),
    skills: emptySkills(),
    collections: emptyCollections(),
    minions: [],
    bank: { balance: 0, tier: 'starter', lastInterestAt: now },
    equipment: emptyEquipment(),
    accessories: [],
    pets: [],
    fairySouls: 0,
    mana: BASE_STATS.intelligence,
    activeSlayer: null,
    slayerXp: {},
    dungeonRun: null,
    selectedDungeonClass: 'berserk',
    visitedZones: [DEFAULT_ZONE],
    quests: { completed: [], counters: {}, flags: {}, claimed: false },
    x: spawn.x,
    y: spawn.y,
    facing: 'down',
  };
  addUser(user);
  return { token: signToken(user.id), player: toPlayer(user) };
}

export function loginUser(username: string, password: string): { token: string; player: PlayerState } {
  const user = findUserByUsername(username);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    throw new Error('Invalid username or password');
  }
  return { token: signToken(user.id), player: toPlayer(user) };
}

export function loadPlayer(userId: string): PlayerState | null {
  const user = findUserById(userId);
  return user ? toPlayer(user) : null;
}

export function savePlayer(player: PlayerState): void {
  const user = findUserById(player.id);
  if (!user) return;
  saveUser(applyPlayer(user, player));
}

export function getUsername(userId: string): string {
  return findUserById(userId)?.username ?? 'Unknown';
}

export function adjustUserCoins(userId: string, delta: number): void {
  const user = findUserById(userId);
  if (!user) return;
  user.coins += delta;
  user.updatedAt = Date.now();
  saveUser(user);
}
