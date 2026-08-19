import { drillLoreLines, drillModuleStats, isDrillItem } from './drill.js';
import type { ItemDef, ItemRarity } from './items.js';
import { enchantDisplayName } from './enchantments.js';
import type { ItemStack } from './inventory.js';
import type { StatBlock, StatKey } from './stats.js';
import { effectiveRarity, potatoBooksApplied, potatoStatBonus } from './gearUpgrade.js';

export type MinecraftColor =
  | 'black'
  | 'dark_blue'
  | 'dark_green'
  | 'dark_aqua'
  | 'dark_red'
  | 'dark_purple'
  | 'gold'
  | 'gray'
  | 'dark_gray'
  | 'blue'
  | 'green'
  | 'aqua'
  | 'red'
  | 'light_purple'
  | 'yellow'
  | 'white';

export interface LoreLine {
  text: string;
  color?: MinecraftColor;
  bold?: boolean;
  italic?: boolean;
}

export const RARITY_COLOR: Record<ItemRarity, MinecraftColor> = {
  COMMON: 'white',
  UNCOMMON: 'green',
  RARE: 'blue',
  EPIC: 'dark_purple',
  LEGENDARY: 'gold',
  MYTHIC: 'light_purple',
  DIVINE: 'aqua',
  SPECIAL: 'red',
  VERY_SPECIAL: 'red',
};

const STAT_LABELS: Record<StatKey, [string, MinecraftColor, string]> = {
  health: ['Health', 'green', '❤'],
  defense: ['Defense', 'green', '❈'],
  strength: ['Strength', 'red', '❁'],
  intelligence: ['Intelligence', 'aqua', '✎'],
  critChance: ['Crit Chance', 'blue', '☣'],
  critDamage: ['Crit Damage', 'blue', '☠'],
  attackSpeed: ['Bonus Attack Speed', 'yellow', '⚔'],
  speed: ['Speed', 'white', '✦'],
  ferocity: ['Ferocity', 'red', '⫽'],
  magicFind: ['Magic Find', 'aqua', '✯'],
  petLuck: ['Pet Luck', 'light_purple', '♣'],
  miningSpeed: ['Mining Speed', 'gold', '⸕'],
  miningFortune: ['Mining Fortune', 'gold', '☘'],
  farmingFortune: ['Farming Fortune', 'gold', '☘'],
  foragingFortune: ['Foraging Fortune', 'gold', '☘'],
  seaCreatureChance: ['Sea Creature Chance', 'dark_aqua', 'α'],
  trueDefense: ['True Defense', 'white', '❂'],
  healthRegen: ['Health Regen', 'red', '❣'],
};

const percentStats = new Set<StatKey>([
  'critChance',
  'critDamage',
  'attackSpeed',
  'speed',
  'seaCreatureChance',
]);

export function itemDisplayName(def: ItemDef, stack?: ItemStack): string {
  const prefix = stack?.reforge ? `${stack.reforge} ` : '';
  const stars = stack?.dungeonStars ? ` ${'✪'.repeat(stack.dungeonStars)}` : '';
  const recomb = stack?.recombobulated ? '✪ ' : '';
  return `${recomb}${prefix}${def.name}${stars}`;
}

export function buildItemLore(def: ItemDef, stack?: ItemStack): LoreLine[] {
  const lines: LoreLine[] = [];
  const rarity = stack ? effectiveRarity(def, stack) : def.rarity ?? 'COMMON';
  const type = def.type ?? (def.category === 'weapon' ? 'SWORD' : def.category === 'minion' ? 'MINION' : 'MATERIAL');
  const stats: Partial<StatBlock> = { ...def.stats };
  if (isDrillItem(stack?.itemId ?? def.id) && stack) {
    const modules = drillModuleStats(stack);
    for (const [key, value] of Object.entries(modules) as Array<[StatKey, number]>) {
      stats[key] = (stats[key] ?? 0) + value;
    }
    if (stack.drill && (stack.drill.fuel ?? 0) <= 0) {
      stats.miningSpeed = 0;
      stats.miningFortune = 0;
    }
  }
  if (stack?.statBoosts) {
    for (const key of Object.keys(stack.statBoosts) as StatKey[]) {
      stats[key] = (stats[key] ?? 0) + (stack.statBoosts[key] ?? 0);
    }
  }
  if (stack) {
    const potato = potatoStatBonus(stack);
    for (const key of Object.keys(potato) as StatKey[]) {
      stats[key] = (stats[key] ?? 0) + (potato[key] ?? 0);
    }
  }

  for (const [key, value] of Object.entries(stats) as Array<[StatKey, number]>) {
    if (!value) continue;
    const [name, color, icon] = STAT_LABELS[key];
    lines.push({
      text: `${name}: ${value > 0 ? '+' : ''}${value}${percentStats.has(key) ? '%' : ''} ${icon}`,
      color,
    });
  }

  if (Object.values(stats).some(Boolean)) lines.push({ text: '' });
  if (stack?.enchantments && Object.keys(stack.enchantments).length) {
    const enchants = Object.entries(stack.enchantments)
      .map(([id, level]) => `${enchantDisplayName(id)} ${roman(level)}`)
      .join(', ');
    lines.push({ text: enchants, color: 'blue' }, { text: '' });
  }
  if (def.ability) {
    lines.push({ text: `Item Ability: ${def.ability.name}`, color: 'gold', bold: true });
    lines.push({ text: def.ability.description, color: 'gray' });
    if (def.ability.manaCost) lines.push({ text: `Mana Cost: ${def.ability.manaCost}`, color: 'dark_aqua' });
    if (def.ability.cooldownSec) lines.push({ text: `Cooldown: ${def.ability.cooldownSec}s`, color: 'green' });
    lines.push({ text: '' });
  } else if (def.description) {
    lines.push({ text: def.description, color: 'gray' }, { text: '' });
  }
  if (stack && isDrillItem(stack.itemId)) {
    lines.push(...drillLoreLines(stack));
  }
  const potatoes = stack ? potatoBooksApplied(stack) : 0;
  if (potatoes > 0) {
    lines.push({ text: `Hot Potato Books: ${Math.min(10, stack?.hotPotatoCount ?? 0)}/10`, color: 'gold' });
    if ((stack?.fumingCount ?? 0) > 0) {
      lines.push({ text: `Fuming Potato Books: ${stack?.fumingCount}/5`, color: 'gold' });
    }
  }
  if (stack?.recombobulated) {
    lines.push({ text: 'Recombobulated', color: 'light_purple', italic: true });
  }
  if (stack?.dungeonStars) {
    lines.push({ text: `Dungeon Stars: ${'✪'.repeat(stack.dungeonStars)}  (+${stack.dungeonStars * 10}% damage and armor stats)`, color: 'gold' });
  }
  if (def.npcSell) lines.push({ text: `NPC Sell Price: ${def.npcSell.toLocaleString()} Coins`, color: 'gray' });
  lines.push({
    text: `${rarity}${type === 'MATERIAL' ? '' : ` ${type.replaceAll('_', ' ')}`}`,
    color: RARITY_COLOR[rarity],
    bold: true,
  });
  return lines;
}

function titleCase(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function roman(value: number): string {
  const values: Array<[number, string]> = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let result = '';
  let left = value;
  for (const [amount, glyph] of values) {
    while (left >= amount) {
      result += glyph;
      left -= amount;
    }
  }
  return result || String(value);
}
