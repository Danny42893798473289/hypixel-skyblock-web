import type { ItemId } from './items.js';
import type { ItemStack } from './inventory.js';
import { emptyGardenPlots, JACOB_CONTEST_MS } from './gardenPlots.js';

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
}

export interface HotmPerk {
  id: string;
  name: string;
  max: number;
  cost: number;
  description: string;
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
  { id: 'mining_speed', name: 'Mining Speed', max: 10, cost: 1, description: '+20 Mining Speed per level.' },
  { id: 'mining_fortune', name: 'Mining Fortune', max: 10, cost: 1, description: '+5 Mining Fortune per level.' },
  { id: 'titanium_insanium', name: 'Titanium Insanium', max: 5, cost: 2, description: 'Chance for extra Titanium.' },
  { id: 'sky_mall', name: 'Sky Mall', max: 1, cost: 3, description: 'Daily mining bonus while a mining mayor is elected.' },
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
  };
}

export function rollGardenVisitor(): GardenVisitor {
  const guest = GARDEN_VISITORS[Math.floor(Math.random() * GARDEN_VISITORS.length)] ?? GARDEN_VISITORS[0]!;
  const qty = 16 + Math.floor(Math.random() * 48);
  return { id: `${guest.name}-${Date.now()}`, name: guest.name, wants: guest.wants, qty, reward: qty * 8 };
}

export function emptyHotm(): HotmState {
  return { tokens: 0, mithrilPowder: 0, perks: {}, commissions: rollCommissions() };
}

export function rollCommissions(): HotmCommission[] {
  return [
    { id: 'c_mithril', label: 'Mine Mithril', itemId: 'mithril', need: 50, have: 0, rewardTokens: 1, rewardCoins: 250 },
    { id: 'c_titanium', label: 'Mine Titanium', itemId: 'titanium', need: 10, have: 0, rewardTokens: 2, rewardCoins: 400 },
    { id: 'c_cobble', label: 'Mine Cobblestone', itemId: 'cobble', need: 100, have: 0, rewardTokens: 1, rewardCoins: 80 },
  ];
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
