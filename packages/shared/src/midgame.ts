import type { ItemId } from './items.js';
import type { ItemStack } from './inventory.js';
import { emptyGardenPlots, emptyJacobMedals, JACOB_CONTEST_MS, STARTING_GARDEN_PLOTS, type JacobMedals } from './gardenPlots.js';

export interface GardenPlot {
  crop: ItemId;
  plantedAt: number;
}

export interface GardenVisitor {
  id: string;
  name: string;
  wants: ItemId;
  qty: number;
  reward: number;
}

export interface GardenState {
  harvested: Record<string, number>;
  visitor: GardenVisitor | null;
  jacobCrop: ItemId;
  jacobScore: number;
  jacobEndsAt: number;
  /** 24 plot grid — plant, water, harvest. */
  plots: import('./gardenPlots.js').GardenPlotCell[];
  organicMatter: number;
  composterLevel: number;
  jacobMedal: 'none' | 'bronze' | 'silver' | 'gold';
  jacobContestEndsAt: number;
  jacobMedals: JacobMedals;
  unlockedPlots: number;
}

export interface HotmPerk {
  id: string;
  name: string;
  max: number;
  /** Tokens spent to unlock (0 → 1). Further levels cost mithril powder. */
  cost: number;
  powderCost: number;
  parent?: string;
  parentLevel?: number;
  slot: number;
  icon: string;
  description: string;
  powderType?: 'mithril' | 'gemstone';
}

export interface HotmCommission {
  id: string;
  label: string;
  itemId: ItemId;
  need: number;
  have: number;
  rewardTokens: number;
  rewardCoins: number;
}

export interface HotmState {
  tokens: number;
  mithrilPowder: number;
  gemstonePowder: number;
  perks: Record<string, number>;
  commissions: HotmCommission[];
}

export interface DragonFightState {
  type: string;
  hp: number;
  maxHp: number;
  eyes: number;
  endsAt: number;
}

export interface KuudraFightState {
  tier: number;
  hp: number;
  maxHp: number;
}

export interface BestiaryState {
  kills: Record<string, number>;
}

export interface MuseumState {
  donated: string[];
}

export interface WardrobePage {
  helmet: ItemStack | null;
  chestplate: ItemStack | null;
  leggings: ItemStack | null;
  boots: ItemStack | null;
}

export interface WardrobeState {
  pages: WardrobePage[];
}

export const HOTM_PERKS: HotmPerk[] = [
  {
    id: 'mining_speed',
    name: 'Mining Speed',
    max: 20,
    cost: 1,
    powderCost: 40,
    slot: 31,
    icon: 'golden_pickaxe',
    description: '+20 Mining Speed per level. The Heart of the Mountain starts here.',
  },
  {
    id: 'mining_fortune',
    name: 'Mining Fortune',
    max: 20,
    cost: 1,
    powderCost: 50,
    parent: 'mining_speed',
    slot: 22,
    icon: 'gold_ingot',
    description: '+5 Mining Fortune per level.',
  },
  {
    id: 'titanium_insanium',
    name: 'Titanium Insanium',
    max: 10,
    cost: 1,
    powderCost: 80,
    parent: 'mining_speed',
    slot: 23,
    icon: 'iron_ingot',
    description: 'Chance to find extra Titanium while mining Mithril.',
  },
  {
    id: 'daily_powder',
    name: 'Daily Powder',
    max: 10,
    cost: 1,
    powderCost: 45,
    parent: 'mining_speed',
    slot: 39,
    icon: 'glowstone_dust',
    description: 'Gain extra Mithril Powder from mithril you mine.',
  },
  {
    id: 'sky_mall',
    name: 'Sky Mall',
    max: 1,
    cost: 1,
    powderCost: 0,
    parent: 'mining_fortune',
    slot: 12,
    icon: 'nether_star',
    description: 'Permanent +20 Mining Fortune. Extra +15 while Cole is mayor.',
  },
  {
    id: 'luck_of_the_cave',
    name: 'Luck of the Cave',
    max: 10,
    cost: 1,
    powderCost: 55,
    parent: 'mining_fortune',
    slot: 21,
    icon: 'emerald',
    description: '+6 Mining Fortune per level in the Dwarven Mines and Crystal Hollows.',
  },
  {
    id: 'efficient_miner',
    name: 'Efficient Miner',
    max: 10,
    cost: 1,
    powderCost: 60,
    parent: 'mining_fortune',
    slot: 14,
    icon: 'cobble',
    description: '+8 Mining Fortune per level. Extra cobble and ore from each swing.',
  },
  {
    id: 'mining_speed_2',
    name: 'Mining Speed 2',
    max: 10,
    cost: 2,
    powderCost: 90,
    parent: 'mining_speed',
    parentLevel: 5,
    slot: 13,
    icon: 'diamond_pickaxe',
    description: '+40 Mining Speed per level. Requires Mining Speed V.',
  },
  {
    id: 'goblin_killer',
    name: 'Goblin Killer',
    max: 5,
    cost: 1,
    powderCost: 70,
    parent: 'titanium_insanium',
    slot: 40,
    icon: 'golden_sword',
    description: 'Earn extra coins while mining in the Dwarven Mines.',
  },
  {
    id: 'front_loaded',
    name: 'Front Loaded',
    max: 5,
    cost: 1,
    powderCost: 75,
    parent: 'titanium_insanium',
    slot: 41,
    icon: 'chest',
    description: 'Chance for bonus Mithril from each mithril vein.',
  },
  {
    id: 'mining_madness',
    name: 'Mining Madness',
    max: 10,
    cost: 1,
    powderCost: 60,
    parent: 'mining_speed',
    slot: 32,
    icon: 'gemstone_ruby',
    description: '+8 Mining Fortune per level. Costs Gemstone Powder to upgrade.',
    powderType: 'gemstone',
  },
  {
    id: 'gemstone_infusion',
    name: 'Gemstone Infusion',
    max: 10,
    cost: 1,
    powderCost: 80,
    parent: 'mining_madness',
    slot: 33,
    icon: 'gemstone_jade',
    description: '+12 Mining Fortune per level in the Crystal Hollows.',
    powderType: 'gemstone',
  },
  {
    id: 'powder_buff',
    name: 'Powder Buff',
    max: 5,
    cost: 2,
    powderCost: 100,
    parent: 'gemstone_infusion',
    slot: 34,
    icon: 'glowstone_dust',
    description: 'Gain extra Gemstone Powder from gemstone veins.',
    powderType: 'gemstone',
  },
];

export const GARDEN_CROPS: ItemId[] = ['wheat', 'carrot', 'potato', 'pumpkin', 'melon', 'sugar_cane', 'cactus', 'cocoa_beans', 'mushroom', 'nether_wart'];

export const GARDEN_VISITORS: Array<{ name: string; wants: ItemId }> = [
  { name: 'Jacob', wants: 'wheat' },
  { name: 'Anita', wants: 'carrot' },
  { name: 'Farmhand', wants: 'potato' },
  { name: 'Melon King', wants: 'melon' },
  { name: 'Pumpkin Farmer', wants: 'pumpkin' },
];

export const DRAGON_TYPES = [
  { id: 'protector', name: 'Protector Dragon', hp: 8000000, color: '#aaaaaa' },
  { id: 'old', name: 'Old Dragon', hp: 15000000, color: '#555555' },
  { id: 'wise', name: 'Wise Dragon', hp: 9000000, color: '#55ffff' },
  { id: 'unstable', name: 'Unstable Dragon', hp: 9000000, color: '#aa00aa' },
  { id: 'young', name: 'Young Dragon', hp: 7500000, color: '#ffff55' },
  { id: 'strong', name: 'Strong Dragon', hp: 9000000, color: '#ff5555' },
  { id: 'superior', name: 'Superior Dragon', hp: 12000000, color: '#ffaa00' },
] as const;

export const MAYORS = [
  { id: 'diana', name: 'Diana', perk: 'Mythological Ritual — extra pet luck and griffin chances.' },
  { id: 'marina', name: 'Marina', perk: 'Fishing Festival — better fishing luck.' },
  { id: 'cole', name: 'Cole', perk: 'Mining Fiesta — extra Mining Fortune.' },
  { id: 'foxy', name: 'Foxy', perk: 'Sweet Benevolence — extra coins from NPC sales.' },
  { id: 'paul', name: 'Paul', perk: 'Benediction — extra dungeon score.' },
  { id: 'aatrox', name: 'Aatrox', perk: 'Slayer XP buff.' },
] as const;

export const ALCHEMY_RECIPES: Array<{
  id: string;
  result: ItemId;
  ingredients: Array<{ itemId: ItemId; qty: number }>;
  xp: number;
}> = [
  { id: 'brew_healing', result: 'healing_potion', ingredients: [{ itemId: 'nether_wart', qty: 1 }, { itemId: 'melon', qty: 8 }], xp: 12 },
  { id: 'brew_speed', result: 'speed_potion', ingredients: [{ itemId: 'nether_wart', qty: 1 }, { itemId: 'sugar_cane', qty: 8 }], xp: 12 },
  { id: 'brew_strength', result: 'strength_potion', ingredients: [{ itemId: 'nether_wart', qty: 1 }, { itemId: 'blaze_rod', qty: 4 }], xp: 18 },
  { id: 'brew_mana', result: 'mana_potion', ingredients: [{ itemId: 'nether_wart', qty: 1 }, { itemId: 'lapis', qty: 16 }], xp: 15 },
];

export const PET_EGGS: Array<{ egg: ItemId; pet: ItemId; fromMob?: string }> = [
  { egg: 'wolf_pet_egg', pet: 'wolf_pet', fromMob: 'wolf' },
  { egg: 'enderman_pet_egg', pet: 'enderman_pet', fromMob: 'enderman' },
  { egg: 'tiger_pet_egg', pet: 'tiger_pet', fromMob: 'dasher_spider' },
  { egg: 'silverfish_pet_egg', pet: 'silverfish_pet', fromMob: 'zombie' },
  { egg: 'elephant_pet_egg', pet: 'elephant_pet' },
  { egg: 'sheep_pet', pet: 'sheep_pet', fromMob: 'sheep' },
];

export function currentJacobCrop(now = Date.now()): ItemId {
  return GARDEN_CROPS[Math.floor(now / 3_600_000) % GARDEN_CROPS.length] ?? 'wheat';
}

export function emptyGarden(): GardenState {
  const now = Date.now();
  return {
    harvested: {},
    visitor: rollGardenVisitor(),
    jacobCrop: currentJacobCrop(),
    jacobScore: 0,
    jacobEndsAt: Math.ceil(now / 3_600_000) * 3_600_000,
    plots: emptyGardenPlots(),
    organicMatter: 0,
    composterLevel: 0,
    jacobMedal: 'none',
    jacobContestEndsAt: now + JACOB_CONTEST_MS,
    jacobMedals: emptyJacobMedals(),
    unlockedPlots: STARTING_GARDEN_PLOTS,
  };
}

export function rollGardenVisitor(): GardenVisitor {
  const guest = GARDEN_VISITORS[Math.floor(Math.random() * GARDEN_VISITORS.length)] ?? GARDEN_VISITORS[0]!;
  const qty = 16 + Math.floor(Math.random() * 48);
  return { id: `${guest.name}-${Date.now()}`, name: guest.name, wants: guest.wants, qty, reward: qty * 8 };
}

export function emptyHotm(): HotmState {
  return {
    tokens: 0,
    mithrilPowder: 0,
    gemstonePowder: 0,
    perks: {},
    commissions: rollCommissions(),
  };
}

export function hotmUnlockedCount(perks: Record<string, number>): number {
  return Object.values(perks).filter((level) => level > 0).length;
}

export function hotmMiningFortune(perks: Record<string, number>, coleMayor: boolean): number {
  return (perks.mining_fortune ?? 0) * 5
    + (perks.efficient_miner ?? 0) * 8
    + ((perks.sky_mall ?? 0) > 0 ? 20 : 0)
    + (perks.mining_madness ?? 0) * 8
    + (coleMayor ? 15 : 0);
}

export function hotmGemstoneFortune(perks: Record<string, number>): number {
  return (perks.gemstone_infusion ?? 0) * 12;
}

export const GEMSTONE_ITEM_IDS = [
  'gemstone_ruby', 'gemstone_jade', 'gemstone_amethyst', 'gemstone_sapphire',
  'gemstone_amber', 'gemstone_topaz', 'gemstone_jasper',
];

export function isGemstoneItem(itemId: string): boolean {
  return GEMSTONE_ITEM_IDS.includes(itemId);
}

export function hotmMiningSpeed(perks: Record<string, number>): number {
  return (perks.mining_speed ?? 0) * 20
    + (perks.mining_speed_2 ?? 0) * 40;
}

export function hotmPerkLocked(perks: Record<string, number>, perk: HotmPerk): boolean {
  if (!perk.parent) return false;
  return (perks[perk.parent] ?? 0) < (perk.parentLevel ?? 1);
}

export function hotmPowderCost(perk: HotmPerk, nextLevel: number): number {
  if (nextLevel <= 1) return 0;
  return perk.powderCost * nextLevel;
}

export function hotmPowderBalance(state: HotmState, perk: HotmPerk): number {
  return perk.powderType === 'gemstone' ? state.gemstonePowder : state.mithrilPowder;
}

export function spendHotmPowder(state: HotmState, perk: HotmPerk, amount: number): void {
  if (perk.powderType === 'gemstone') state.gemstonePowder -= amount;
  else state.mithrilPowder -= amount;
}

export function rollCommissions(): HotmCommission[] {
  const pool: HotmCommission[] = [
    { id: 'c_mithril', label: 'Mithril Miner', itemId: 'mithril', need: 50, have: 0, rewardTokens: 1, rewardCoins: 250 },
    { id: 'c_titanium', label: 'Titanium Miner', itemId: 'titanium', need: 10, have: 0, rewardTokens: 2, rewardCoins: 400 },
    { id: 'c_cobble', label: 'Cobblestone Collector', itemId: 'cobble', need: 80, have: 0, rewardTokens: 1, rewardCoins: 80 },
    { id: 'c_hard_stone', label: 'Hard Stone Miner', itemId: 'hard_stone', need: 40, have: 0, rewardTokens: 1, rewardCoins: 120 },
    { id: 'c_glacite', label: 'Glacite Walker', itemId: 'glacite', need: 20, have: 0, rewardTokens: 1, rewardCoins: 180 },
  ];
  const picked: HotmCommission[] = [];
  const remaining = [...pool];
  while (picked.length < 3 && remaining.length) {
    const index = Math.floor(Math.random() * remaining.length);
    picked.push({ ...remaining.splice(index, 1)[0]!, have: 0 });
  }
  return picked;
}

export function emptyBestiary(): BestiaryState {
  return { kills: {} };
}

export function emptyMuseum(): MuseumState {
  return { donated: [] };
}

export function emptyWardrobe(): WardrobeState {
  return {
    pages: Array.from({ length: 4 }, () => ({
      helmet: null,
      chestplate: null,
      leggings: null,
      boots: null,
    })),
  };
}

export function currentMayor(now = Date.now()): (typeof MAYORS)[number] {
  const week = Math.floor(now / (7 * 24 * 60 * 60 * 1000));
  return MAYORS[week % MAYORS.length] ?? MAYORS[0]!;
}

export function skyblockXp(input: {
  skills: Record<string, number>;
  collections: Partial<Record<string, number>>;
  slayerXp: Record<string, number>;
  fairySouls: number;
  museumDonated: number;
  bestiaryKills: number;
}): number {
  const skillXp = Object.values(input.skills).reduce((sum, xp) => sum + Math.sqrt(Math.max(0, xp ?? 0)), 0);
  const collectionXp = Object.values(input.collections).reduce((sum: number, qty) => sum + Math.log10(1 + (qty ?? 0)) * 8, 0);
  const slayer = Object.values(input.slayerXp).reduce((sum, xp) => sum + (xp ?? 0) * 2, 0);
  return Math.floor(skillXp + collectionXp + slayer + input.fairySouls * 5 + input.museumDonated * 15 + input.bestiaryKills * 0.4);
}

export function skyblockLevelFromXp(xp: number): { level: number; into: number; need: number } {
  let remain = xp;
  let level = 0;
  let need = 50;
  while (remain >= need && level < 50) {
    remain -= need;
    level++;
    need = 50 + level * 25;
  }
  return { level, into: Math.floor(remain), need };
}

export function bestiaryTier(kills: number): number {
  const thresholds = [1, 5, 15, 50, 150, 500, 1500, 5000];
  let tier = 0;
  for (const amount of thresholds) {
    if (kills >= amount) tier++;
  }
  return tier;
}

export function emptyEquipmentPage(): WardrobePage {
  return { helmet: null, chestplate: null, leggings: null, boots: null };
}
