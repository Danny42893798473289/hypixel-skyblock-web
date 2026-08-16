import type { StatBlock } from './stats.js';

export interface GearEnchantLevels {
  weapon?: Record<string, number>;
  armor?: Record<string, number>;
}

export function totalEnchantLevel(levels: Record<string, number> | undefined, id: string): number {
  return levels?.[id] ?? 0;
}

export function lootingCoinBonus(level: number): number {
  return 1 + level * 0.05;
}

export function smiteMultiplier(level: number, mobTags: string[]): number {
  if (!mobTags.includes('undead') && !mobTags.includes('spider')) return 1;
  const id = mobTags.includes('spider') ? 'bane_of_arthropods' : 'smite';
  void id;
  return 1 + level * 0.08;
}

export function thunderlordProc(level: number): { chance: number; damage: number } {
  return { chance: level * 0.04, damage: 100 + level * 50 };
}

export function giantKillerMultiplier(level: number, mobMaxHp: number): number {
  if (mobMaxHp < 5000) return 1;
  return 1 + level * 0.01 * Math.min(10, mobMaxHp / 5000);
}

export function luckOfTheSeaLevel(rodEnchants: Record<string, number> | undefined): number {
  return totalEnchantLevel(rodEnchants, 'luck_of_the_sea');
}

export function mobTagsForId(mobId: string): string[] {
  if (['zombie', 'graveyard_zombie', 'lapis_zombie', 'husk', 'revenant'].includes(mobId)) return ['undead'];
  if (['spider', 'dasher_spider', 'weaver', 'crawler', 'tarantula'].includes(mobId)) return ['spider'];
  if (SEA_CREATURE_TAG[mobId]) return ['sea_creature'];
  return [];
}

const SEA_CREATURE_TAG: Record<string, boolean> = {
  squid: true,
  sea_walker: true,
  night_squid: true,
  sea_guardian: true,
  catfish: true,
  yeti: true,
  magma_soul: true,
  fire_eel: true,
};

export function combineGearEnchants(
  weapon?: Record<string, number>,
  armorPieces: Array<Record<string, number> | undefined> = [],
): Record<string, number> {
  const out: Record<string, number> = { ...weapon };
  for (const piece of armorPieces) {
    if (!piece) continue;
    for (const [id, lvl] of Object.entries(piece)) {
      out[id] = Math.max(out[id] ?? 0, lvl);
    }
  }
  return out;
}

export function enchantProcDamageBonus(
  enchants: Record<string, number>,
  mobId: string,
  mobMaxHp: number,
): { multiplier: number; thunderBonus: number; critical: boolean } {
  const tags = mobTagsForId(mobId);
  let multiplier = smiteMultiplier(totalEnchantLevel(enchants, 'smite'), tags);
  multiplier *= smiteMultiplier(totalEnchantLevel(enchants, 'bane_of_arthropods'), tags);
  multiplier *= giantKillerMultiplier(totalEnchantLevel(enchants, 'giant_killer'), mobMaxHp);
  const thunder = thunderlordProc(totalEnchantLevel(enchants, 'thunderlord'));
  const thunderBonus = Math.random() < thunder.chance ? thunder.damage : 0;
  const critLevel = totalEnchantLevel(enchants, 'critical');
  const critical = Math.random() < 0.05 + critLevel * 0.02;
  if (critical) multiplier *= 1.5 + critLevel * 0.05;
  return { multiplier, thunderBonus, critical };
}

export function bestiaryMilestoneReward(kills: number): { coins: number; magicFind: number } | null {
  if (kills === 100) return { coins: 1000, magicFind: 1 };
  if (kills === 500) return { coins: 5000, magicFind: 2 };
  if (kills === 5000) return { coins: 25_000, magicFind: 5 };
  return null;
}

export function carpentryXpForCraft(recipeTier: number): number {
  return 10 + recipeTier * 5;
}

export function socialXpForVisit(): number {
  return 50;
}
