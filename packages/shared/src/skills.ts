import type { StatBlock } from './stats.js';

export type SkillId =
  | 'farming'
  | 'mining'
  | 'combat'
  | 'foraging'
  | 'fishing'
  | 'enchanting'
  | 'alchemy'
  | 'taming'
  | 'carpentry'
  | 'runecrafting'
  | 'social'
  | 'dungeoneering';

export interface SkillDef {
  id: SkillId;
  name: string;
  color: string;
  description: string;
  maxLevel: number;
  rewardPerLevel: Partial<StatBlock>;
}

export const SKILLS: Record<SkillId, SkillDef> = {
  mining: {
    id: 'mining',
    name: 'Mining',
    color: '#8a8a8a',
    description: 'Break stone and ores faster.',
    maxLevel: 60,
    rewardPerLevel: { defense: 1, miningFortune: 4 },
  },
  farming: {
    id: 'farming',
    name: 'Farming',
    color: '#e8c84a',
    description: 'Harvest crops with better yields.',
    maxLevel: 60,
    rewardPerLevel: { health: 2, farmingFortune: 4 },
  },
  combat: {
    id: 'combat',
    name: 'Combat',
    color: '#e05050',
    description: 'Deal more damage to creatures.',
    maxLevel: 60,
    rewardPerLevel: { critChance: 0.5 },
  },
  foraging: {
    id: 'foraging',
    name: 'Foraging',
    color: '#5a9e4a',
    description: 'Chop trees more efficiently.',
    maxLevel: 50,
    rewardPerLevel: { strength: 1, foragingFortune: 4 },
  },
  fishing: {
    id: 'fishing',
    name: 'Fishing',
    color: '#4a9ed8',
    description: 'Catch fish more reliably.',
    maxLevel: 50,
    rewardPerLevel: { health: 2, seaCreatureChance: 0.2 },
  },
  enchanting: { id: 'enchanting', name: 'Enchanting', color: '#aa55ff', description: 'Improve magical abilities and enchant gear.', maxLevel: 60, rewardPerLevel: { intelligence: 1 } },
  alchemy: { id: 'alchemy', name: 'Alchemy', color: '#ff55ff', description: 'Brew stronger and longer-lasting potions.', maxLevel: 50, rewardPerLevel: { intelligence: 1 } },
  taming: { id: 'taming', name: 'Taming', color: '#55ff55', description: 'Level pets faster and improve Pet Luck.', maxLevel: 60, rewardPerLevel: { petLuck: 1 } },
  carpentry: { id: 'carpentry', name: 'Carpentry', color: '#ffaa00', description: 'Craft decorative furniture.', maxLevel: 50, rewardPerLevel: { health: 1 } },
  runecrafting: { id: 'runecrafting', name: 'Runecrafting', color: '#ff55ff', description: 'Combine cosmetic runes.', maxLevel: 25, rewardPerLevel: {} },
  social: { id: 'social', name: 'Social', color: '#55ffff', description: 'Earn XP when players visit your island.', maxLevel: 25, rewardPerLevel: {} },
  dungeoneering: { id: 'dungeoneering', name: 'Dungeoneering', color: '#aa0000', description: 'Master the Catacombs.', maxLevel: 50, rewardPerLevel: { health: 1 } },
};

const XP_TABLE = [
  50, 125, 200, 300, 500, 750, 1000, 1500, 2000, 3500,
  5000, 7500, 10000, 15000, 20000, 30000, 50000, 75000, 100000, 200000,
  300000, 400000, 500000, 600000, 700000, 800000, 900000, 1000000, 1100000, 1200000,
  1300000, 1400000, 1500000, 1600000, 1700000, 1800000, 1900000, 2000000, 2100000, 2200000,
  2300000, 2400000, 2500000, 2600000, 2750000, 2900000, 3100000, 3400000, 3700000, 4000000,
  4300000, 4600000, 4900000, 5200000, 5500000, 5800000, 6100000, 6400000, 6700000, 7000000,
] as const;

/** XP required to go from level L to L+1. */
export function xpForLevel(level: number): number {
  return XP_TABLE[Math.max(0, Math.min(XP_TABLE.length - 1, level))];
}

export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 0; i < level; i++) total += xpForLevel(i);
  return total;
}

export function levelFromXp(xp: number, maxLevel = 60): { level: number; intoLevel: number; need: number } {
  let level = 0;
  let remaining = xp;
  while (level < maxLevel) {
    const need = xpForLevel(level);
    if (remaining < need) return { level, intoLevel: remaining, need };
    remaining -= need;
    level++;
  }
  return { level: maxLevel, intoLevel: 0, need: xpForLevel(maxLevel - 1) };
}

export function miningSpeedBonus(level: number): number {
  return 1 + level * 0.03;
}

export function farmingFortuneChance(level: number): number {
  return Math.min(0.5, level * 0.02);
}

export function combatDamageBonus(level: number): number {
  return 1 + level * 0.04;
}

export function foragingSpeedBonus(level: number): number {
  return 1 + level * 0.03;
}

export function fishingSuccessBonus(level: number): number {
  return Math.min(0.4, level * 0.015);
}

export type SkillsState = Record<SkillId, number>;

export function emptySkills(): SkillsState {
  return {
    farming: 0,
    mining: 0,
    combat: 0,
    foraging: 0,
    fishing: 0,
    enchanting: 0,
    alchemy: 0,
    taming: 0,
    carpentry: 0,
    runecrafting: 0,
    social: 0,
    dungeoneering: 0,
  };
}
