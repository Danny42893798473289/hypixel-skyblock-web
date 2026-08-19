export const STAT_KEYS = [
  'health',
  'defense',
  'strength',
  'intelligence',
  'critChance',
  'critDamage',
  'attackSpeed',
  'speed',
  'ferocity',
  'magicFind',
  'petLuck',
  'miningSpeed',
  'miningFortune',
  'farmingFortune',
  'foragingFortune',
  'seaCreatureChance',
  'trueDefense',
  'healthRegen',
] as const;

export type StatKey = (typeof STAT_KEYS)[number];
export type StatBlock = Record<StatKey, number>;

export const BASE_STATS: StatBlock = {
  health: 100,
  defense: 0,
  strength: 0,
  intelligence: 100,
  critChance: 30,
  critDamage: 50,
  attackSpeed: 0,
  speed: 100,
  ferocity: 0,
  magicFind: 0,
  petLuck: 0,
  miningSpeed: 100,
  miningFortune: 0,
  farmingFortune: 0,
  foragingFortune: 0,
  seaCreatureChance: 20,
  trueDefense: 0,
  healthRegen: 0,
};

export function emptyStats(): StatBlock {
  return Object.fromEntries(STAT_KEYS.map((key) => [key, 0])) as StatBlock;
}

export function addStats(...blocks: Array<Partial<StatBlock> | undefined>): StatBlock {
  const result = emptyStats();
  for (const block of blocks) {
    if (!block) continue;
    for (const key of STAT_KEYS) result[key] += block[key] ?? 0;
  }
  return result;
}

export function meleeDamage(
  weaponDamage: number,
  strength: number,
  critDamage: number,
  critical: boolean,
  additiveMultiplier = 1,
  multiplicativeMultiplier = 1,
): number {
  const base = (5 + weaponDamage + Math.floor(strength / 5)) * (1 + strength / 100);
  const crit = critical ? 1 + critDamage / 100 : 1;
  return Math.max(1, base * additiveMultiplier * multiplicativeMultiplier * crit);
}

export function magicDamage(
  baseAbilityDamage: number,
  intelligence: number,
  abilityScaling: number,
  additiveMultiplier = 1,
): number {
  return Math.max(1, baseAbilityDamage * (1 + intelligence / 100 * abilityScaling) * additiveMultiplier);
}

export function effectiveHealth(health: number, defense: number): number {
  return Math.max(1, health) * (1 + Math.max(-99, defense) / 100);
}

export function incomingDamage(damage: number, defense: number, trueDefense = 0): number {
  const safeDefense = Math.max(-99, defense);
  const afterDefense = damage * (1 - safeDefense / (safeDefense + 100));
  const safeTrue = Math.max(0, trueDefense);
  const afterTrue = afterDefense * (1 - safeTrue / (safeTrue + 100));
  return Math.max(1, afterTrue);
}

/** Extra melee strikes from Ferocity. 100 Ferocity = one guaranteed extra hit. */
export function ferocityHits(ferocity: number, random = Math.random): number {
  const extra = Math.max(0, ferocity);
  const guaranteed = Math.floor(extra / 100);
  return 1 + guaranteed + (random() * 100 < extra % 100 ? 1 : 0);
}

/** Tiles per second from the Speed stat. 100 Speed = base walk speed. */
export function moveSpeedTiles(speed: number, baseTilesPerSec: number): number {
  return baseTilesPerSec * (Math.max(1, speed) / 100);
}

export function rollCrit(critChance: number, random = Math.random): boolean {
  return random() * 100 < Math.max(0, critChance);
}

export function rollFortune(fortune: number, baseDrops = 1, random = Math.random): number {
  const guaranteed = Math.floor(Math.max(0, fortune) / 100);
  const chance = Math.max(0, fortune) % 100;
  return baseDrops * (1 + guaranteed + (random() * 100 < chance ? 1 : 0));
}

export function attackCooldownMs(attackSpeed: number): number {
  return Math.max(250, 500 / (1 + Math.min(100, Math.max(0, attackSpeed)) / 100));
}
