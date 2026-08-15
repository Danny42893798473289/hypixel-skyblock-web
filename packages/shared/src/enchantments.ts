import type { ItemType } from './items.js';
import type { StatBlock } from './stats.js';

export interface EnchantmentDef {
  id: string;
  name: string;
  maxLevel: number;
  appliesTo: ItemType[];
  description: string;
  /** Coins to apply the next level at the enchantment table. */
  tableCost?: number;
}

const sword = ['SWORD'] as ItemType[];
const bow = ['BOW'] as ItemType[];
const armor = ['HELMET', 'CHESTPLATE', 'LEGGINGS', 'BOOTS'] as ItemType[];
const pick = ['PICKAXE', 'DRILL'] as ItemType[];
const mineTool = ['PICKAXE', 'DRILL', 'AXE'] as ItemType[];
const farmTool = ['HOE', 'AXE'] as ItemType[];
const rod = ['FISHING_ROD'] as ItemType[];
const swordBow = [...sword, ...bow] as ItemType[];

function e(
  id: string,
  name: string,
  maxLevel: number,
  appliesTo: ItemType[],
  description: string,
  tableCost = 250,
): EnchantmentDef {
  return { id, name, maxLevel, appliesTo, description, tableCost };
}

/** Hypixel SkyBlock enchantments (Enchantment Table compatible). */
export const ENCHANTMENTS: EnchantmentDef[] = [
  // —— Swords ——
  e('sharpness', 'Sharpness', 7, sword, 'Increases melee damage.', 200),
  e('smite', 'Smite', 7, swordBow, 'Increases damage dealt to Undead mobs.', 200),
  e('bane_of_arthropods', 'Bane of Arthropods', 7, swordBow, 'Increases damage dealt to Spiders and Silverfish.', 200),
  e('critical', 'Critical', 7, swordBow, 'Increases Crit Damage.', 350),
  e('giant_killer', 'Giant Killer', 7, swordBow, 'Deals more damage to high-Health enemies.', 500),
  e('titan_killer', 'Titan Killer', 7, swordBow, 'Deals more damage to bosses.', 600),
  e('execute', 'Execute', 6, sword, 'Increases damage for each % HP missing on target.', 450),
  e('prosecute', 'Prosecute', 6, sword, 'Increases damage for each % HP remaining on target.', 450),
  e('first_strike', 'First Strike', 5, sword, 'Increases first-hit melee damage.', 400),
  e('triple_strike', 'Triple-Strike', 5, sword, 'Increases damage for the first three hits.', 400),
  e('looting', 'Looting', 5, sword, 'Increases mob drop rates.', 300),
  e('scavenger', 'Scavenger', 5, sword, 'Grants coins on mob kills.', 250),
  e('experience', 'Experience', 5, [...sword, ...pick, ...mineTool], 'Chance for mobs and ores to drop double XP.', 300),
  e('life_steal', 'Life Steal', 5, sword, 'Heals for a % of damage dealt.', 500),
  e('syphon', 'Syphon', 5, sword, 'Regain mana when dealing damage.', 450),
  e('mana_steal', 'Mana Steal', 3, sword, 'Steals mana from enemies on hit.', 400),
  e('drain', 'Drain', 5, sword, 'Heals based on Crit Damage dealt.', 550),
  e('thunderlord', 'Thunderlord', 7, sword, 'Lightning strikes every third hit.', 500),
  e('thunderbolt', 'Thunderbolt', 7, swordBow, 'Lightning strikes on arrow hits.', 500),
  e('venomous', 'Venomous', 6, sword, 'Poisons enemies, stacking damage over time.', 550),
  e('fire_aspect', 'Fire Aspect', 3, sword, 'Ignites enemies, dealing damage over time.', 350),
  e('cleave', 'Cleave', 6, sword, 'Damages nearby enemies when you hit one.', 400),
  e('impaling', 'Impaling', 5, swordBow, 'Increases damage to Aquatic mobs.', 300),
  e('ender_slayer', 'Ender Slayer', 7, swordBow, 'Increases damage to Ender mobs.', 350),
  e('cubism', 'Cubism', 6, swordBow, 'Increases damage to Slime and Magma Cube mobs.', 300),
  e('smoldering', 'Smoldering', 5, swordBow, 'Increases damage to Blaze and Magma mobs.', 350),
  e('lethality', 'Lethality', 6, sword, 'Reduces enemy Defense.', 450),
  e('chance', 'Chance', 5, swordBow, 'Increases drop chance from mobs.', 400),
  e('counter_strike', 'Counter-Strike', 5, [...sword, ...armor], 'Chance to reflect damage when hit.', 500),
  e('knockback', 'Knockback', 2, sword, 'Knocks enemies back further.', 150),
  e('champion', 'Champion', 10, sword, 'Bonus Combat XP and coins on kills.', 600),
  e('gravity', 'Gravity', 6, swordBow, 'Increases damage to airborne mobs.', 350),

  // —— Bows ——
  e('power', 'Power', 7, bow, 'Increases arrow damage.', 250),
  e('punch', 'Punch', 2, bow, 'Increases arrow knockback.', 200),
  e('flame', 'Flame', 2, bow, 'Arrows ignite enemies.', 250),
  e('infinite_quiver', 'Infinite Quiver', 10, bow, 'Chance to not consume arrows.', 300),
  e('snipe', 'Snipe', 4, bow, 'Increases damage based on distance.', 450),
  e('overload', 'Overload', 5, bow, 'Increases damage but reduces Crit Chance.', 500),
  e('dragon_hunter', 'Dragon Hunter', 5, bow, 'Increases damage to Dragons.', 550),
  e('piercing', 'Piercing', 1, bow, 'Arrows pierce through multiple enemies.', 400),

  // —— Armor ——
  e('growth', 'Growth', 7, armor, 'Grants Health.', 200),
  e('protection', 'Protection', 7, armor, 'Grants Defense.', 200),
  e('true_protection', 'True Protection', 1, armor, 'Grants a large amount of Defense.', 2000),
  e('blast_protection', 'Blast Protection', 7, armor, 'Reduces damage from explosions.', 250),
  e('fire_protection', 'Fire Protection', 7, armor, 'Reduces fire and lava damage.', 250),
  e('projectile_protection', 'Projectile Protection', 7, armor, 'Reduces projectile damage.', 250),
  e('rejuvenate', 'Rejuvenate', 5, armor, 'Increases health regeneration.', 350),
  e('depth_strider', 'Depth Strider', 3, armor, 'Move faster in water.', 300),
  e('feather_falling', 'Feather Falling', 5, armor, 'Reduces fall damage.', 250),
  e('thorns', 'Thorns', 3, armor, 'Damages attackers when hit.', 400),
  e('big_brain', 'Big Brain', 5, armor, 'Grants Intelligence.', 450),
  e('ferocious_mana', 'Ferocious Mana', 5, armor, 'Grants Intelligence and Mana regen.', 500),
  e('strong_mana', 'Strong Mana', 5, armor, 'Grants Intelligence.', 450),
  e('luck', 'Luck', 6, armor, 'Grants Magic Find.', 400),
  e('sugar_rush', 'Sugar Rush', 3, armor, 'Grants Speed.', 350),
  e('respiration', 'Respiration', 3, armor, 'Extends underwater breathing.', 200),
  e('aqua_affinity', 'Aqua Affinity', 1, armor, 'Mine faster underwater.', 500),
  e('reflection', 'Reflection', 5, armor, 'Chance to reflect projectiles.', 450),
  e('ultimate_wise', 'Ultimate Wise', 5, armor, 'Reduces ability mana costs.', 600),

  // —— Mining tools ——
  e('efficiency', 'Efficiency', 10, mineTool, 'Grants Mining Speed.', 150),
  e('fortune', 'Fortune', 4, pick, 'Grants Mining Fortune.', 400),
  e('silkt_touch', 'Silk Touch', 1, [...pick, 'AXE'], 'Collect blocks in their original form.', 800),
  e('smelting_touch', 'Smelting Touch', 1, pick, 'Automatically smelts mined blocks.', 600),
  e('compact', 'Compact', 10, pick, 'Chance to drop enchanted items while mining.', 500),
  e('pristine', 'Pristine', 5, pick, 'Chance for gemstones to drop flawless.', 550),
  e('flowstate', 'Flowstate', 5, pick, 'Consecutive blocks broken grant Mining Speed.', 450),
  e('lapidary', 'Lapidary', 5, pick, 'Grants Gemstone Fortune and Mining Speed.', 500),
  e('transylvanian', 'Transylvanian', 5, pick, 'Increases Gemstone mining speed.', 400),

  // —— Farming tools ——
  e('cultivating', 'Cultivating', 10, farmTool, 'Grants Farming Fortune while harvesting.', 200),
  e('harvesting', 'Harvesting', 6, farmTool, 'Grants Farming Fortune.', 300),
  e('replenish', 'Replenish', 1, farmTool, 'Replants crops automatically.', 400),
  e('dedication', 'Dedication', 4, farmTool, 'Bonus Farming XP and Fortune on crops.', 350),
  e('delicate', 'Delicate', 5, farmTool, 'Avoid trampling crops.', 250),
  e('sunder', 'Sunder', 6, farmTool, 'Increases damage to logs and crops.', 300),

  // —— Fishing rods ——
  e('angler', 'Angler', 6, rod, 'Grants Sea Creature Chance.', 300),
  e('luck_of_the_sea', 'Luck of the Sea', 6, rod, 'Increases treasure catch chance.', 300),
  e('lure', 'Lure', 6, rod, 'Decreases time before fish bite.', 200),
  e('bait', 'Bait', 6, rod, 'Increases fishing speed and Sea Creatures.', 350),
  e('spiked_hook', 'Spiked Hook', 6, rod, 'Deal damage to Sea Creatures while reeling.', 400),
  e('caster', 'Caster', 6, rod, 'Increases fishing speed.', 250),
  e('blessing', 'Blessing', 5, rod, 'Chance to catch Blessing items.', 450),
  e('frail', 'Frail', 6, rod, 'Increases damage to Sea Creatures.', 350),
  e('magnet', 'Magnet', 6, rod, 'Attracts item drops from fishing.', 300),
  e('piscary', 'Piscary', 5, rod, 'Increases fishing XP.', 250),
];

export const ENCHANTMENTS_BY_ID: Record<string, EnchantmentDef> = Object.fromEntries(
  ENCHANTMENTS.map((def) => [def.id, def]),
);

export function enchantDisplayName(id: string): string {
  return ENCHANTMENTS_BY_ID[id]?.name ?? id.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function enchantsForItemType(type: ItemType | undefined): EnchantmentDef[] {
  if (!type) return [];
  return ENCHANTMENTS.filter((def) => def.appliesTo.includes(type));
}

export function enchantAppliesToItem(enchantId: string, type: ItemType | undefined): boolean {
  if (!type) return false;
  const def = ENCHANTMENTS_BY_ID[enchantId];
  return Boolean(def?.appliesTo.includes(type));
}

/** Stat bonuses granted by enchantment levels on gear. */
export function enchantStatBonuses(enchantments: Record<string, number>): Partial<StatBlock> {
  const stats: Partial<StatBlock> = {};
  const add = (key: keyof StatBlock, amount: number) => {
    stats[key] = (stats[key] ?? 0) + amount;
  };

  for (const [id, level] of Object.entries(enchantments)) {
    switch (id) {
      case 'growth': add('health', level * 15); break;
      case 'protection': add('defense', level * 3); break;
      case 'true_protection': add('defense', level * 40); break;
      case 'blast_protection': add('defense', level * 2); break;
      case 'fire_protection': add('defense', level * 2); break;
      case 'projectile_protection': add('defense', level * 2); break;
      case 'critical': add('critDamage', level * 10); break;
      case 'sharpness': add('strength', level * 2); break;
      case 'power': add('strength', level * 3); break;
      case 'fortune': add('miningFortune', level * 10); break;
      case 'efficiency': add('miningSpeed', level * 20); break;
      case 'cultivating': add('farmingFortune', level * 4); break;
      case 'harvesting': add('farmingFortune', level * 6); break;
      case 'dedication': add('farmingFortune', level * 5); break;
      case 'lapidary': add('miningFortune', level * 8); add('miningSpeed', level * 10); break;
      case 'flowstate': add('miningSpeed', level * 15); break;
      case 'pristine': add('miningFortune', level * 5); break;
      case 'big_brain': add('intelligence', level * 20); break;
      case 'ferocious_mana': add('intelligence', level * 25); break;
      case 'strong_mana': add('intelligence', level * 18); break;
      case 'luck': add('magicFind', level * 2); break;
      case 'sugar_rush': add('speed', level * 2); break;
      case 'depth_strider': add('speed', level * 3); break;
      case 'angler': add('seaCreatureChance', level * 2); break;
      case 'bait': add('seaCreatureChance', level * 1.5); break;
      case 'life_steal': add('health', level * 5); break;
      case 'syphon': add('intelligence', level * 8); break;
      case 'ultimate_wise': add('intelligence', level * 10); break;
      default: break;
    }
  }
  return stats;
}

export function enchantTableCost(enchantId: string, nextLevel: number, rarityIndex: number): number {
  const def = ENCHANTMENTS_BY_ID[enchantId];
  const base = def?.tableCost ?? 250;
  return Math.round(base * nextLevel * (1 + rarityIndex * 0.35));
}
