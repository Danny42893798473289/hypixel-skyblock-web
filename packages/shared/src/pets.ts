import { ITEMS, type ItemId } from './items.js';
import type { SkillId } from './skills.js';
import type { StatBlock } from './stats.js';
import type { PetState } from './protocol.js';

export interface PetAbilityDef {
  skill: SkillId;
  /** Extra stats at level 100, scaled by level/100. */
  stats: Partial<StatBlock>;
  lore: string;
}

export const PET_ABILITIES: Record<string, PetAbilityDef> = {
  griffin_pet: { skill: 'combat', stats: { magicFind: 15, petLuck: 10 }, lore: 'Legendary Attraction — extra Magic Find and Pet Luck.' },
  elephant_pet: { skill: 'farming', stats: { farmingFortune: 30, health: 40 }, lore: 'Trunk Eating — extra Farming Fortune.' },
  monkey_pet: { skill: 'foraging', stats: { foragingFortune: 35, speed: 15 }, lore: 'Treeborn — extra Foraging Fortune and Speed.' },
  wolf_pet: { skill: 'combat', stats: { critDamage: 20, health: 25 }, lore: 'Pack Alpha — extra Crit Damage.' },
  tiger_pet: { skill: 'combat', stats: { ferocity: 10, strength: 20 }, lore: 'Mercieless Swipe — extra Ferocity.' },
  enderman_pet: { skill: 'combat', stats: { critDamage: 30, intelligence: 25 }, lore: 'Ender Resistance — extra Crit Damage vs Endermen.' },
  silverfish_pet: { skill: 'mining', stats: { miningSpeed: 80, miningFortune: 20 }, lore: 'Burrow — extra Mining Speed and Fortune.' },
  sheep_pet: { skill: 'alchemy', stats: { intelligence: 80 }, lore: 'Mana Pool — extra Intelligence for abilities.' },
  ammonite_pet: { skill: 'fishing', stats: { seaCreatureChance: 8, defense: 30 }, lore: 'Depth Dweller — extra Sea Creature Chance.' },
};

export const PET_HELD_ITEMS: Record<string, { xpMult: number; stats?: Partial<StatBlock>; lore: string }> = {
  textbook: { xpMult: 1.2, lore: '+20% Pet XP' },
  pet_item_exp_share: { xpMult: 1.1, stats: { intelligence: 10 }, lore: '+10% Pet XP and +10 Intelligence' },
  mining_xp_boost: { xpMult: 1.15, stats: { miningFortune: 5 }, lore: '+15% Pet XP and a little Mining Fortune' },
};

export function isPetHeldItem(itemId: ItemId): boolean {
  return Boolean(PET_HELD_ITEMS[itemId]);
}

export function petSkill(pet: PetState): SkillId {
  return PET_ABILITIES[pet.itemId]?.skill ?? 'combat';
}

export function petAbilityStats(pet: PetState): Partial<StatBlock> {
  const ability = PET_ABILITIES[pet.itemId];
  const scale = Math.max(0.01, pet.level / 100);
  const stats: Partial<StatBlock> = {};
  if (ability) {
    for (const [key, amount] of Object.entries(ability.stats) as Array<[keyof StatBlock, number]>) {
      stats[key] = Math.round(amount * scale * 10) / 10;
    }
  }
  const held = pet.heldItem ? PET_HELD_ITEMS[pet.heldItem] : undefined;
  if (held?.stats) {
    for (const [key, amount] of Object.entries(held.stats) as Array<[keyof StatBlock, number]>) {
      stats[key] = (stats[key] ?? 0) + amount;
    }
  }
  return stats;
}

export function petXpMultiplier(pet: PetState): number {
  const held = pet.heldItem ? PET_HELD_ITEMS[pet.heldItem] : undefined;
  return held?.xpMult ?? 1;
}

export function petDisplayName(pet: PetState): string {
  const raw = ITEMS[pet.itemId]?.name.replace(/^\[Lvl \d+\] /, '') ?? pet.itemId;
  return `[Lvl ${pet.level}] ${raw}`;
}
