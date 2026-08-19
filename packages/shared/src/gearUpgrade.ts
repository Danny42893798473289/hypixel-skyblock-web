import { ITEMS, type ItemDef, type ItemId, type ItemRarity, type ItemType } from './items.js';
import type { ItemStack } from './inventory.js';
import type { StatBlock } from './stats.js';
import type { ReforgeDef } from './content.js';
import { REFORGES } from './content.js';

export const HOT_POTATO_CAP = 10;
export const FUMING_POTATO_CAP = 5;
export const POTATO_WEAPON_DAMAGE = 2;
export const POTATO_WEAPON_STRENGTH = 2;
export const POTATO_ARMOR_HEALTH = 4;
export const POTATO_ARMOR_DEFENSE = 2;

export const RARITY_ORDER: ItemRarity[] = [
  'COMMON',
  'UNCOMMON',
  'RARE',
  'EPIC',
  'LEGENDARY',
  'MYTHIC',
  'DIVINE',
  'SPECIAL',
  'VERY_SPECIAL',
];

export interface ReforgeStoneDef {
  itemId: ItemId;
  reforgeId: string;
}

export const REFORGE_STONES: ReforgeStoneDef[] = [
  { itemId: 'stone_spicy', reforgeId: 'spicy' },
  { itemId: 'stone_sharp', reforgeId: 'sharp' },
  { itemId: 'stone_heroic', reforgeId: 'heroic' },
  { itemId: 'stone_fierce', reforgeId: 'fierce' },
  { itemId: 'stone_pure', reforgeId: 'pure' },
  { itemId: 'stone_wise', reforgeId: 'wise' },
  { itemId: 'stone_titanic', reforgeId: 'titanic' },
  { itemId: 'stone_itchy', reforgeId: 'itchy' },
  { itemId: 'stone_bizarre', reforgeId: 'bizarre' },
  { itemId: 'stone_fleet', reforgeId: 'fleet' },
  { itemId: 'dragon_claw', reforgeId: 'fabled' },
  { itemId: 'withered_catalyst', reforgeId: 'withered' },
  { itemId: 'necrotic_crystal', reforgeId: 'necrotic' },
  { itemId: 'renowned_bead', reforgeId: 'renowned' },
];

const STONE_BY_ITEM = new Map(REFORGE_STONES.map((stone) => [stone.itemId, stone]));

export function rarityIndex(rarity: ItemRarity | undefined): number {
  const index = RARITY_ORDER.indexOf(rarity ?? 'COMMON');
  return index < 0 ? 0 : index;
}

export function nextRarity(rarity: ItemRarity | undefined): ItemRarity {
  const index = rarityIndex(rarity);
  return RARITY_ORDER[Math.min(RARITY_ORDER.length - 1, index + 1)] ?? 'COMMON';
}

export function effectiveRarity(def: ItemDef, stack?: ItemStack | null): ItemRarity {
  const base = def.rarity ?? 'COMMON';
  if (!stack?.recombobulated) return base;
  return nextRarity(base);
}

export function potatoBooksApplied(stack?: ItemStack | null): number {
  if (!stack) return 0;
  return Math.min(HOT_POTATO_CAP, stack.hotPotatoCount ?? 0)
    + Math.min(FUMING_POTATO_CAP, stack.fumingCount ?? 0);
}

export function isArmorType(type?: ItemType): boolean {
  return type === 'HELMET' || type === 'CHESTPLATE' || type === 'LEGGINGS' || type === 'BOOTS';
}

export function isWeaponType(type?: ItemType): boolean {
  return type === 'SWORD' || type === 'BOW';
}

export function isToolType(type?: ItemType): boolean {
  return type === 'PICKAXE' || type === 'DRILL' || type === 'AXE' || type === 'HOE' || type === 'FISHING_ROD';
}

export function reforgeGroup(type?: ItemType): ReforgeDef['appliesTo'] | null {
  if (isWeaponType(type)) return 'weapon';
  if (isArmorType(type)) return 'armor';
  if (type === 'ACCESSORY') return 'accessory';
  if (isToolType(type)) return 'tool';
  return null;
}

export function potatoStatBonus(stack: ItemStack): Partial<StatBlock> {
  const books = potatoBooksApplied(stack);
  if (!books) return {};
  const def = ITEMS[stack.itemId];
  if (isWeaponType(def?.type) || isToolType(def?.type)) {
    return { strength: books * POTATO_WEAPON_STRENGTH };
  }
  if (isArmorType(def?.type)) {
    return {
      health: books * POTATO_ARMOR_HEALTH,
      defense: books * POTATO_ARMOR_DEFENSE,
    };
  }
  return {};
}

export function weaponDamageOf(stack: ItemStack | null | undefined): number {
  if (!stack) return 0;
  const def = ITEMS[stack.itemId];
  if (!def?.damage) return 0;
  const books = isWeaponType(def.type) || isToolType(def.type) ? potatoBooksApplied(stack) : 0;
  const raw = def.damage + books * POTATO_WEAPON_DAMAGE;
  return raw * (1 + 0.1 * (stack.dungeonStars ?? 0));
}

export function reforgeForId(idOrName: string): ReforgeDef | undefined {
  const key = idOrName.toLowerCase();
  return REFORGES.find((entry) => entry.id === key || entry.name.toLowerCase() === key);
}

export function stoneForItem(itemId: ItemId): ReforgeStoneDef | undefined {
  return STONE_BY_ITEM.get(itemId);
}

export function compatibleReforges(type?: ItemType): ReforgeDef[] {
  const group = reforgeGroup(type);
  if (!group) return [];
  return REFORGES.filter((entry) => entry.appliesTo === group);
}

export function isGearUpgradeItem(itemId: ItemId): boolean {
  return itemId === 'hot_potato_book'
    || itemId === 'fuming_potato_book'
    || itemId === 'recombobulator_3000'
    || Boolean(STONE_BY_ITEM.get(itemId));
}

export function applyHotPotatoBook(stack: ItemStack): string {
  const def = ITEMS[stack.itemId];
  if (!reforgeGroup(def?.type) || def?.type === 'ACCESSORY') {
    throw new Error('Hot Potato Books only apply to weapons, armor and tools');
  }
  const used = stack.hotPotatoCount ?? 0;
  if (used >= HOT_POTATO_CAP) throw new Error('This item already has 10 Hot Potato Books — use a Fuming Potato Book');
  stack.hotPotatoCount = used + 1;
  return `Applied Hot Potato Book (${stack.hotPotatoCount}/${HOT_POTATO_CAP})`;
}

export function applyFumingPotatoBook(stack: ItemStack): string {
  const def = ITEMS[stack.itemId];
  if (!reforgeGroup(def?.type) || def?.type === 'ACCESSORY') {
    throw new Error('Fuming Potato Books only apply to weapons, armor and tools');
  }
  if ((stack.hotPotatoCount ?? 0) < HOT_POTATO_CAP) {
    throw new Error('Apply 10 Hot Potato Books before Fuming Potato Books');
  }
  const used = stack.fumingCount ?? 0;
  if (used >= FUMING_POTATO_CAP) throw new Error('This item already has 5 Fuming Potato Books');
  stack.fumingCount = used + 1;
  return `Applied Fuming Potato Book (${stack.fumingCount}/${FUMING_POTATO_CAP})`;
}

export function applyRecombobulator(stack: ItemStack): string {
  const def = ITEMS[stack.itemId];
  if (!def || def.type === 'MATERIAL' || def.type === 'CONSUMABLE' || def.type === 'MINION' || def.type === 'PET') {
    throw new Error('Recombobulator only upgrades weapons, armor, tools and accessories');
  }
  if (stack.recombobulated) throw new Error('This item is already recombobulated');
  stack.recombobulated = true;
  return `Recombobulated! Rarity is now ${effectiveRarity(def, stack)}`;
}

export function applyReforgeStone(stack: ItemStack, stoneId: ItemId): string {
  const stone = STONE_BY_ITEM.get(stoneId);
  if (!stone) throw new Error('That is not a reforge stone');
  const def = ITEMS[stack.itemId];
  const reforge = reforgeForId(stone.reforgeId);
  if (!reforge) throw new Error('Unknown reforge');
  const group = reforgeGroup(def?.type);
  if (!group || reforge.appliesTo !== group) {
    throw new Error(`${reforge.name} only applies to ${reforge.appliesTo}s`);
  }
  stack.reforge = reforge.name;
  return `Applied ${ITEMS[stoneId]?.name ?? stoneId} — ${reforge.name}`;
}

export function reforgeCost(rarity: ItemRarity | undefined): number {
  return 250 * (rarityIndex(rarity) + 1);
}

export type GemstoneType = 'ruby' | 'jade' | 'amethyst' | 'sapphire' | 'amber' | 'topaz' | 'jasper';
export type GemstoneQuality = 'rough' | 'flawless' | 'perfect';

export interface GemstoneSlot {
  type: GemstoneType | null;
  quality: GemstoneQuality | null;
}

export const GEMSTONE_STAT_MAP: Record<GemstoneType, { stat: string; rough: number; flawless: number; perfect: number }> = {
  ruby: { stat: 'health', rough: 5, flawless: 15, perfect: 30 },
  jade: { stat: 'miningFortune', rough: 4, flawless: 12, perfect: 25 },
  amethyst: { stat: 'defense', rough: 4, flawless: 12, perfect: 25 },
  sapphire: { stat: 'intelligence', rough: 5, flawless: 15, perfect: 30 },
  amber: { stat: 'miningSpeed', rough: 10, flawless: 30, perfect: 60 },
  topaz: { stat: 'petLuck', rough: 2, flawless: 6, perfect: 12 },
  jasper: { stat: 'strength', rough: 3, flawless: 10, perfect: 20 },
};

export function gemstoneStatBonus(slot: GemstoneSlot): { stat: string; amount: number } | null {
  if (!slot.type || !slot.quality) return null;
  const mapping = GEMSTONE_STAT_MAP[slot.type];
  if (!mapping) return null;
  return { stat: mapping.stat, amount: mapping[slot.quality] };
}

export function gemstoneApplyCost(quality: GemstoneQuality): number {
  if (quality === 'perfect') return 100000;
  if (quality === 'flawless') return 25000;
  return 5000;
}

export function maxGemstoneSlots(rarity: string): number {
  switch (rarity) {
    case 'COMMON': case 'UNCOMMON': return 0;
    case 'RARE': return 1;
    case 'EPIC': return 2;
    case 'LEGENDARY': case 'MYTHIC': case 'DIVINE': return 3;
    default: return 0;
  }
}
