import type { ItemId } from './items.js';
import { BAZAAR_ITEMS, ITEMS } from './items.js';

/** Hypixel Bazaar main sections (Direct Mode). */
export type BazaarSection = 'farming' | 'mining' | 'combat' | 'woods' | 'oddities';

export const BAZAAR_SECTIONS: Array<{ id: BazaarSection; name: string; icon: string; description: string }> = [
  { id: 'farming', name: 'Farming', icon: 'crop_wheat', description: 'Crops, seeds, and animal products.' },
  { id: 'mining', name: 'Mining', icon: 'ore_diamond', description: 'Ores, gems, and stone commodities.' },
  { id: 'combat', name: 'Combat', icon: 'mob_zombie', description: 'Mob drops and combat resources.' },
  { id: 'woods', name: 'Woods & Fishes', icon: 'tree_oak', description: 'Logs, planks, and fishing loot.' },
  { id: 'oddities', name: 'Oddities', icon: 'nether_star', description: 'Enchanted blocks, refined goods, upgrades.' },
];

const sectionByItem = new Map<ItemId, BazaarSection>();

export function setBazaarSection(itemId: ItemId, section: BazaarSection): void {
  sectionByItem.set(itemId, section);
}

export function getBazaarSection(itemId: ItemId): BazaarSection {
  return sectionByItem.get(itemId) ?? inferBazaarSection(itemId);
}

function inferBazaarSection(itemId: ItemId): BazaarSection {
  if (itemId.includes('enchanted_') && (itemId.endsWith('_block') || itemId.includes('compactor'))) return 'oddities';
  if (itemId.includes('_log') || itemId.includes('_plank') || itemId.includes('fish') || itemId.includes('salmon')
    || itemId.includes('prismarine') || itemId.includes('sponge') || itemId.includes('clown')) return 'woods';
  if (itemId.includes('flesh') || itemId.includes('bone') || itemId.includes('string') || itemId.includes('spider')
    || itemId.includes('pearl') || itemId.includes('blaze') || itemId.includes('slime') || itemId.includes('gunpowder')
    || itemId.includes('ghast') || itemId.includes('magma') || itemId.includes('soul')) return 'combat';
  if (itemId.includes('wheat') || itemId.includes('carrot') || itemId.includes('potato') || itemId.includes('pumpkin')
    || itemId.includes('melon') || itemId.includes('mushroom') || itemId.includes('cocoa') || itemId.includes('cactus')
    || itemId.includes('sugar') || itemId.includes('wart') || itemId.includes('leather') || itemId.includes('raw_')
    || itemId.includes('beef') || itemId.includes('pork') || itemId.includes('chicken') || itemId.includes('mutton')
    || itemId.includes('rabbit') || itemId.includes('wool') || itemId.includes('egg') || itemId.includes('feather')
    || itemId.includes('seeds') || itemId.includes('bread') || itemId.includes('cookie')) return 'farming';
  return 'mining';
}

export function bazaarItemsInSection(section: BazaarSection): ItemId[] {
  return BAZAAR_ITEMS
    .filter((id) => getBazaarSection(id) === section)
    .sort((a, b) => (ITEMS[a]?.name ?? a).localeCompare(ITEMS[b]?.name ?? b));
}

export function bazaarSectionCounts(): Record<BazaarSection, number> {
  const counts: Record<BazaarSection, number> = {
    farming: 0, mining: 0, combat: 0, woods: 0, oddities: 0,
  };
  for (const id of BAZAAR_ITEMS) counts[getBazaarSection(id)]++;
  return counts;
}
