import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import {
  emptyBestiary,
  emptyCollections,
  emptyDailies,
  emptyGarden,
  emptyHotm,
  emptyMuseum,
  emptyQuestBook,
  emptySkills,
  emptyWardrobe,
  starterInventory,
  ensureStarterTools,
  normalizeBackpacks,
  emptyBackpacks,
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
  applyIslandBlocks,
  normalizePlayerLocation,
  districtEntryBlocked,
  skyblockXp,
  skyblockLevelFromXp,
  type ItemStack,
  type PlayerState,
} from '@aether/shared';
import {
  addUser,
  findUserById,
  findUserByUsername,
  loadStore,
  saveUser,
  ensureProfiles,
  activeProfile,
  profileFromUser,
  applyProfileToUser,
  MAX_PROFILES,
  type StoredUser,
  type StoredProfile,
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

function profileSummaries(user: StoredUser): PlayerState['profiles'] {
  ensureProfiles(user);
  return Object.entries(user.profiles ?? {}).map(([id, profile]) => {
    const xp = skyblockXp({
      skills: profile.skills,
      collections: profile.collections,
      slayerXp: profile.slayerXp ?? {},
      fairySouls: profile.fairySouls ?? 0,
      museumDonated: profile.museum?.donated.length ?? 0,
      bestiaryKills: Object.values(profile.bestiary?.kills ?? {}).reduce((sum, n) => sum + n, 0),
    });
    return { id, name: profile.name, coins: profile.coins, skyblockLevel: skyblockLevelFromXp(xp).level };
  });
}

function coopSharedProfile(host: StoredUser, profileId: string): StoredProfile | null {
  ensureProfiles(host);
  return host.profiles?.[profileId] ?? null;
}

function overlayCoop(player: PlayerState, profile: StoredProfile): void {
  player.coopHostId = profile.coopHostId ?? null;
  player.coopHostProfileId = profile.coopHostProfileId ?? null;
  player.unlockedWarps = profile.unlockedWarps ?? [];
  player.collectionBonuses = profile.collectionBonuses;
  const hostId = profile.coopHostId;
  if (!hostId) return;
  const host = findUserById(hostId);
  if (!host) return;
  const sharedProfileId = profile.coopHostProfileId ?? host.activeProfileId ?? 'main';
  const shared = coopSharedProfile(host, sharedProfileId);
  if (!shared) return;
  player.islandBlocks = shared.islandBlocks;
  player.bank = shared.bank ?? player.bank;
  player.minions = shared.minions;
}

function toPlayer(user: StoredUser): PlayerState {
  ensureProfiles(user);
  const profile = activeProfile(user);
  applyProfileToUser(user, profile);
  // Saves from older layouts can point at zones that no longer exist.
  const zoneId = user.zoneId && ZONES[user.zoneId] ? user.zoneId : DEFAULT_ZONE;
  const { equipment, inventory } = migratePlayerSave(user);
  const accessories = user.accessories ?? [];
  const bank = user.bank ?? { balance: 0, tier: 'starter' as const, lastInterestAt: Date.now() };
  const baseMap = islandMapForZone(zoneId);
  const map = islandForZone(zoneId) === 'private_island'
    ? applyIslandBlocks(baseMap, user.islandBlocks)
    : baseMap;
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
    claimedSkillRewards: user.claimedSkillRewards ?? [],
    bits: user.bits ?? 0,
    extraMinionSlots: user.extraMinionSlots ?? 0,
    extraAccessorySlots: user.extraAccessorySlots ?? 0,
    communityPurchases: user.communityPurchases ?? {},
    dailies: user.dailies ?? emptyDailies(),
    dungeonRun: user.dungeonRun ?? null,
    selectedDungeonClass: user.selectedDungeonClass ?? 'berserk',
    visitedZones: user.visitedZones ?? [zoneId],
    quests: user.quests ?? emptyQuestBook(),
    garden: user.garden ?? emptyGarden(),
    hotm: user.hotm ?? emptyHotm(),
    bestiary: user.bestiary ?? emptyBestiary(),
    museum: user.museum ?? emptyMuseum(),
    wardrobe: user.wardrobe && user.wardrobe.pages.length ? user.wardrobe : emptyWardrobe(),
    dragonFight: user.dragonFight ?? null,
    kuudraFight: user.kuudraFight ?? null,
    backpacks: normalizeBackpacks(user.backpacks),
    islandBlocks: user.islandBlocks,
    pendingDungeonChest: user.pendingDungeonChest ?? null,
    x: spawn.x,
    y: spawn.y,
    facing: user.facing ?? 'down',
    profileId: user.activeProfileId,
    profileName: profile.name,
    profiles: profileSummaries(user),
    coopHostId: profile.coopHostId ?? null,
    coopHostProfileId: profile.coopHostProfileId ?? null,
    unlockedWarps: profile.unlockedWarps ?? [],
    collectionBonuses: profile.collectionBonuses,
    activeEffects: [],
  };
  if (user.x != null && user.y != null && canStand(map, user.x, user.y)) {
    player.x = user.x;
    player.y = user.y;
  }
  overlayCoop(player, profile);
  normalizeDungeonRun(player);
  if (normalizePlayerLocation(player)) player.resetPosition = true;
  player.stats = recomputeStats(player);
  player.maxHp = player.stats.health;
  player.hp = Math.min(player.hp, player.maxHp);
  player.maxMana = Math.max(100, Math.round(player.stats.intelligence));
  player.mana = Math.min(user.mana ?? player.maxMana, player.maxMana);
  player.accessoryBagSlots = accessoryBagSlots(player.fairySouls, player.extraAccessorySlots);
  return player;
}

function applyPlayer(user: StoredUser, player: PlayerState): StoredUser {
  ensureProfiles(user);
  const profileId = user.activeProfileId ?? 'main';
  const existing = user.profiles?.[profileId];
  const next: StoredUser = {
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
    claimedSkillRewards: player.claimedSkillRewards,
    bits: player.bits,
    extraMinionSlots: player.extraMinionSlots,
    extraAccessorySlots: player.extraAccessorySlots,
    communityPurchases: player.communityPurchases,
    dailies: player.dailies,
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
    backpacks: player.backpacks,
    islandBlocks: player.islandBlocks,
    pendingDungeonChest: player.pendingDungeonChest ?? null,
    x: player.x,
    y: player.y,
    facing: player.facing,
    coopHostId: player.coopHostId ?? existing?.coopHostId ?? null,
    coopHostProfileId: player.coopHostProfileId ?? existing?.coopHostProfileId ?? null,
    unlockedWarps: player.unlockedWarps ?? existing?.unlockedWarps ?? [],
    collectionBonuses: player.collectionBonuses ?? existing?.collectionBonuses,
    updatedAt: Date.now(),
  };
  const saved = profileFromUser(next, existing?.name ?? player.profileName ?? 'Main');
  saved.coopHostId = next.coopHostId ?? null;
  saved.coopHostProfileId = next.coopHostProfileId ?? null;
  saved.coopMembers = existing?.coopMembers ?? next.coopMembers ?? [];
  saved.unlockedWarps = next.unlockedWarps ?? [];
  saved.collectionBonuses = next.collectionBonuses;
  if (saved.coopHostId) {
    saved.islandBlocks = existing?.islandBlocks;
    saved.bank = existing?.bank;
    saved.minions = existing?.minions ?? [];
    const host = findUserById(saved.coopHostId);
    if (host && host.id !== user.id) {
      ensureProfiles(host);
      const hostProfileId = saved.coopHostProfileId ?? host.activeProfileId ?? 'main';
      const hostProfile = host.profiles![hostProfileId];
      if (hostProfile) {
        hostProfile.islandBlocks = player.islandBlocks;
        hostProfile.bank = player.bank;
        hostProfile.minions = player.minions;
        host.profiles![hostProfileId] = hostProfile;
        applyProfileToUser(host, host.activeProfileId === hostProfileId ? hostProfile : activeProfile(host));
        host.updatedAt = Date.now();
        saveUser(host);
      }
    }
  } else if ((saved.coopMembers?.length ?? 0) > 0) {
    saved.islandBlocks = player.islandBlocks;
    saved.bank = player.bank;
    saved.minions = player.minions;
  }
  next.profiles = { ...user.profiles, [profileId]: saved };
  next.activeProfileId = profileId;
  applyProfileToUser(next, saved.coopHostId ? { ...saved, islandBlocks: player.islandBlocks, bank: player.bank, minions: player.minions } : saved);
  return next;
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
    quests: emptyQuestBook(),
    backpacks: emptyBackpacks(),
    x: spawn.x,
    y: spawn.y,
    facing: 'down',
  };
  addUser(user);
  ensureProfiles(user);
  saveUser(user);
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
  ensureProfiles(user);
  activeProfile(user).coins = user.coins;
  user.updatedAt = Date.now();
  saveUser(user);
}

export function switchProfile(player: PlayerState, profileId: string): PlayerState {
  savePlayer(player);
  const user = findUserById(player.id);
  if (!user) throw new Error('Account not found');
  ensureProfiles(user);
  if (!user.profiles?.[profileId]) throw new Error('Profile not found');
  user.activeProfileId = profileId;
  applyProfileToUser(user, user.profiles[profileId]!);
  user.updatedAt = Date.now();
  saveUser(user);
  const next = toPlayer(user);
  next.resetPosition = true;
  return next;
}

export function createProfile(player: PlayerState, name: string): PlayerState {
  savePlayer(player);
  const user = findUserById(player.id);
  if (!user) throw new Error('Account not found');
  ensureProfiles(user);
  const ids = Object.keys(user.profiles ?? {});
  if (ids.length >= MAX_PROFILES) throw new Error(`You can have ${MAX_PROFILES} profiles`);
  const clean = name.trim().slice(0, 16) || `Profile ${ids.length + 1}`;
  const id = uuid();
  const now = Date.now();
  const spawn = districtSpawn(islandMapForZone(DEFAULT_ZONE), DEFAULT_ZONE);
  const fresh: StoredProfile = {
    name: clean,
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
    visitedZones: [DEFAULT_ZONE],
    quests: emptyQuestBook(),
    backpacks: emptyBackpacks(),
    x: spawn.x,
    y: spawn.y,
    facing: 'down',
    selectedDungeonClass: 'berserk',
    coopHostId: null,
    coopMembers: [],
  };
  user.profiles![id] = fresh;
  user.activeProfileId = id;
  applyProfileToUser(user, fresh);
  user.updatedAt = now;
  saveUser(user);
  const next = toPlayer(user);
  next.resetPosition = true;
  return next;
}

export function joinCoop(player: PlayerState, hostUsername: string, hostProfileId?: string): PlayerState {
  savePlayer(player);
  const user = findUserById(player.id);
  if (!user) throw new Error('Account not found');
  const host = findUserByUsername(hostUsername);
  if (!host) throw new Error('Player not found');
  if (host.id === player.id) throw new Error('You already own this island');
  ensureProfiles(user);
  ensureProfiles(host);
  const guest = activeProfile(user);
  if (guest.coopHostId) throw new Error('Leave your current co-op first (/coop leave)');
  const profileId = hostProfileId ?? host.activeProfileId ?? 'main';
  const hostProfile = host.profiles![profileId];
  if (!hostProfile) throw new Error('Co-op profile not found');
  const members = hostProfile.coopMembers ?? [];
  if (members.length >= 4) throw new Error('That co-op is full (max 4 members)');
  if (members.includes(player.id)) throw new Error('You are already in that co-op');
  guest.coopHostId = host.id;
  guest.coopHostProfileId = profileId;
  hostProfile.coopMembers = [...new Set([...members, player.id])];
  applyProfileToUser(user, guest);
  host.profiles![profileId] = hostProfile;
  if (host.activeProfileId === profileId) applyProfileToUser(host, hostProfile);
  saveUser(host);
  saveUser(user);
  const next = toPlayer(user);
  next.resetPosition = true;
  next.zoneId = 'island_minions';
  next.islandId = 'private_island';
  next.x = 8;
  next.y = 8;
  return next;
}

export function leaveCoop(player: PlayerState): PlayerState {
  savePlayer(player);
  const user = findUserById(player.id);
  if (!user) throw new Error('Account not found');
  ensureProfiles(user);
  const guest = activeProfile(user);
  const hostId = guest.coopHostId;
  const hostProfileId = guest.coopHostProfileId;
  guest.coopHostId = null;
  guest.coopHostProfileId = null;
  if (hostId) {
    const host = findUserById(hostId);
    if (host) {
      ensureProfiles(host);
      const pid = hostProfileId ?? host.activeProfileId ?? 'main';
      const hostProfile = host.profiles![pid];
      if (hostProfile) {
        hostProfile.coopMembers = (hostProfile.coopMembers ?? []).filter((id) => id !== player.id);
        host.profiles![pid] = hostProfile;
        if (host.activeProfileId === pid) applyProfileToUser(host, hostProfile);
      }
      saveUser(host);
    }
  }
  applyProfileToUser(user, guest);
  saveUser(user);
  const next = toPlayer(user);
  next.resetPosition = true;
  return next;
}

export function inviteCoop(hostPlayer: PlayerState, guestUsername: string): { guestId: string; guestUsername: string } {
  savePlayer(hostPlayer);
  const hostUser = findUserById(hostPlayer.id);
  if (!hostUser) throw new Error('Account not found');
  if (hostPlayer.coopHostId) throw new Error('Leave your co-op first before hosting');
  const guest = findUserByUsername(guestUsername.trim());
  if (!guest) throw new Error('Player not found');
  if (guest.id === hostPlayer.id) throw new Error('You cannot invite yourself');
  ensureProfiles(hostUser);
  const hostProfile = activeProfile(hostUser);
  const members = hostProfile.coopMembers ?? [];
  if (members.length >= 4) throw new Error('Your co-op is full (max 4 members)');
  if (members.includes(guest.id)) throw new Error(`${guest.username} is already in your co-op`);
  const guestProfile = activeProfile(guest);
  if (guestProfile.coopHostId) throw new Error(`${guest.username} is already in another co-op`);
  return { guestId: guest.id, guestUsername: guest.username };
}

export function acceptCoopInvite(
  player: PlayerState,
  hostUsername: string,
  hostProfileId?: string,
): PlayerState {
  return joinCoop(player, hostUsername, hostProfileId);
}

export function kickCoopMember(hostPlayer: PlayerState, memberUsername: string): PlayerState {
  savePlayer(hostPlayer);
  const hostUser = findUserById(hostPlayer.id);
  if (!hostUser) throw new Error('Account not found');
  if (hostPlayer.coopHostId) throw new Error('Only the island owner can kick members');
  const member = findUserByUsername(memberUsername.trim());
  if (!member) throw new Error('Player not found');
  ensureProfiles(hostUser);
  const hostProfile = activeProfile(hostUser);
  const members = hostProfile.coopMembers ?? [];
  if (!members.includes(member.id)) throw new Error(`${member.username} is not in your co-op`);
  hostProfile.coopMembers = members.filter((id) => id !== member.id);
  hostUser.profiles![hostUser.activeProfileId!] = hostProfile;
  applyProfileToUser(hostUser, hostProfile);
  saveUser(hostUser);
  ensureProfiles(member);
  const guestProfile = activeProfile(member);
  if (guestProfile.coopHostId === hostPlayer.id) {
    guestProfile.coopHostId = null;
    guestProfile.coopHostProfileId = null;
    applyProfileToUser(member, guestProfile);
    saveUser(member);
  }
  return toPlayer(hostUser);
}

export function renameProfile(player: PlayerState, profileId: string, name: string): PlayerState {
  savePlayer(player);
  const user = findUserById(player.id);
  if (!user) throw new Error('Account not found');
  ensureProfiles(user);
  const profile = user.profiles?.[profileId];
  if (!profile) throw new Error('Profile not found');
  const clean = name.trim().slice(0, 16);
  if (clean.length < 1) throw new Error('Profile name must be 1-16 characters');
  if (!/^[a-zA-Z0-9_ ]+$/.test(clean)) throw new Error('Name: letters, numbers, spaces, underscore only');
  profile.name = clean;
  user.profiles![profileId] = profile;
  if (user.activeProfileId === profileId) applyProfileToUser(user, profile);
  user.updatedAt = Date.now();
  saveUser(user);
  return toPlayer(user);
}

export function deleteProfile(player: PlayerState, profileId: string): PlayerState {
  savePlayer(player);
  const user = findUserById(player.id);
  if (!user) throw new Error('Account not found');
  ensureProfiles(user);
  const ids = Object.keys(user.profiles ?? {});
  if (ids.length <= 1) throw new Error('You cannot delete your only profile');
  if (profileId === user.activeProfileId) throw new Error('Switch to another profile before deleting this one');
  const profile = user.profiles?.[profileId];
  if (!profile) throw new Error('Profile not found');
  if (profile.coopHostId) throw new Error('Leave co-op before deleting this profile');
  if ((profile.coopMembers?.length ?? 0) > 0) throw new Error('Remove all co-op members before deleting this profile');
  delete user.profiles![profileId];
  user.updatedAt = Date.now();
  saveUser(user);
  return toPlayer(user);
}
