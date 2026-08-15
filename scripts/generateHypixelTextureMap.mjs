/**
 * Generates apps/client/src/ui/chest/hypixelTextureMap.json
 * Maps internal item ids -> official Hypixel SkyBlock item ids (for Coflnet icons).
 */
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Dynamic import compiled shared (after npm run build -w @aether/shared)
const sharedItems = await import(join(root, 'packages/shared/dist/items.js'));
await import(join(root, 'packages/shared/dist/registerCatalog.js'));
await import(join(root, 'packages/shared/dist/registerGear.js'));
const { ITEMS } = sharedItems;
const { SKYBLOCK_CATALOG } = await import(join(root, 'packages/shared/dist/skyblockCatalog.js'));

const api = await fetch('https://api.hypixel.net/v2/resources/skyblock/items').then((r) => r.json());
const hypixelIds = new Set(api.items.map((i) => i.id));

/** Catalog base id -> Hypixel minion generator prefix. */
const MINION_PREFIX = {
  cobble: 'COBBLESTONE',
  wheat: 'WHEAT',
  carrot: 'CARROT',
  potato: 'POTATO',
  pumpkin: 'PUMPKIN',
  melon: 'MELON',
  melon_slice: 'MELON',
  cactus: 'CACTUS',
  sugar_cane: 'SUGAR_CANE',
  nether_wart: 'NETHER_WARTS',
  coal: 'COAL',
  iron_ingot: 'IRON',
  gold_ingot: 'GOLD',
  diamond: 'DIAMOND',
  emerald: 'EMERALD',
  lapis: 'LAPIS',
  redstone: 'REDSTONE',
  obsidian: 'OBSIDIAN',
  quartz: 'QUARTZ',
  gravel: 'GRAVEL',
  sand: 'SAND',
  end_stone: 'ENDSTONE',
  netherrack: 'NETHERRACK',
  glowstone_dust: 'GLOWSTONE',
  mithril: 'MITHRIL',
  titanium: 'TITANIUM',
  hard_stone: 'HARD_STONE',
  ice: 'ICE',
  snowball: 'SNOW',
  clay: 'CLAY',
  flint: 'FLINT',
  oak_log: 'OAK',
  spruce_log: 'SPRUCE',
  birch_log: 'BIRCH',
  jungle_log: 'JUNGLE',
  acacia_log: 'ACACIA',
  dark_oak_log: 'DARK_OAK',
  cocoa_beans: 'COCOA',
  mushroom: 'MUSHROOM',
  red_mushroom: 'RED_MUSHROOM',
  brown_mushroom: 'BROWN_MUSHROOM',
  rotten_flesh: 'ROTTEN_FLESH',
  bone: 'BONE',
  string: 'STRING',
  spider_eye: 'SPIDER',
  gunpowder: 'SULPHUR',
  ender_pearl: 'ENDER_PEARL',
  slimeball: 'SLIME',
  blaze_rod: 'BLAZE',
  magma_cream: 'MAGMA_CREAM',
  ghast_tear: 'GHAST_TEAR',
  raw_fish: 'FISH',
  raw_salmon: 'SALMON',
  prismarine_shard: 'PRISMARINE',
  prismarine_crystals: 'PRISMARINE_CRYSTALS',
  sponge: 'SPONGE',
  leather: 'COW',
  raw_beef: 'COW',
  raw_porkchop: 'PORK',
  raw_chicken: 'CHICKEN',
  egg: 'CHICKEN',
  wool: 'SHEEP',
  mutton: 'MUTTON',
  feather: 'FEATHER',
  seeds: 'WHEAT',
  beetroot: 'BEETROOT',
  apple: 'APPLE',
  poisonous_potato: 'POTATO',
};

const ARMOR_PREFIX = {
  necron: 'POWER_WITHER',
  storm: 'WISE_WITHER',
  goldor: 'TANK_WITHER',
  maxor: 'SPEED_WITHER',
};

/** Items whose internal id differs from Hypixel's. */
const MANUAL = {
  cobble: 'COBBLESTONE',
  lapis: 'INK_SACK',
  cocoa_beans: 'INK_SACK:3',
  mithril: 'MITHRIL_ORE',
  aspect_of_the_dragons: 'ASPECT_OF_THE_DRAGONS',
  aspect_of_the_void: 'ASPECT_OF_THE_VOID',
  giant_sword: 'GIANTS_SWORD',
  treecapitator: 'TREECAPITATOR_AXE',
  stonk: 'STONK_PICKAXE',
  spirit_sceptre: 'SPIRIT_SWORD',
  raiders_axe: 'RAIDER_AXE',
  mathematical_hoe: 'MATH_HOE',
  rod_of_legends: 'ROD_LEGEND',
  shortbow: 'ARTISANAL_SHORTBOW',
  super_compactor: 'SUPER_COMPACTOR_3000',
  personal_compactor: 'PERSONAL_COMPACTOR_4000',
  compactor: 'COMPACTOR',
  diamond_spreading: 'DIAMOND_SPREADING',
  enchanted_coal_fuel: 'ENCHANTED_COAL_BLOCK',
  enchanted_gold_ingot: 'ENCHANTED_GOLD',
  enchanted_iron_ingot: 'ENCHANTED_IRON',
  enchanted_lapis: 'ENCHANTED_LAPIS_LAZULI',
  necron_blade: 'NECRONS_BLADE_HYPERION',
  thorn_bow: 'THORNS_BOW',
  gemstone_ruby: 'ROUGH_RUBY_GEM',
  gemstone_jade: 'ROUGH_JADE_GEM',
  gemstone_amethyst: 'ROUGH_AMETHYST_GEM',
  gemstone_sapphire: 'ROUGH_SAPPHIRE_GEM',
  gemstone_amber: 'ROUGH_AMBER_GEM',
  gemstone_topaz: 'ROUGH_TOPAZ_GEM',
  gemstone_jasper: 'ROUGH_JASPER_GEM',
  wooden_pickaxe: 'WOOD_PICKAXE',
  wooden_axe: 'WOOD_AXE',
  wooden_hoe: 'WOOD_HOE',
  wooden_sword: 'WOOD_SWORD',
  stone_pickaxe: 'STONE_PICKAXE',
  stone_axe: 'STONE_AXE',
  stone_sword: 'STONE_SWORD',
  iron_pickaxe: 'IRON_PICKAXE',
  iron_axe: 'IRON_AXE',
  iron_sword: 'IRON_SWORD',
  golden_pickaxe: 'GOLD_PICKAXE',
  golden_axe: 'GOLD_AXE',
  golden_sword: 'GOLD_SWORD',
  melon_slice: 'MELON',
  oak_log: 'LOG',
  oak_plank: 'WOOD',
  jungle_log: 'LOG:3',
  dark_oak_log: 'LOG_2',
  spruce_log: 'LOG:1',
  birch_log: 'LOG:2',
  acacia_log: 'LOG_2:1',
  wolf_pet: 'WOLF_PET',
  elephant_pet: 'ELEPHANT_PET',
  tiger_pet: 'TIGER_PET',
  sheep_pet: 'SHEEP_PET',
  silverfish_pet: 'SILVERFISH_PET',
  monkey_pet: 'MONKEY_PET',
  ammonite_pet: 'AMMONITE_PET',
  griffin_pet: 'GRIFFIN_PET',
  farming_talisman: 'FARMING_TALISMAN',
  mining_talisman: 'MINING_TALISMAN',
  combat_talisman: 'COMBAT_TALISMAN',
  speed_talisman: 'SPEED_TALISMAN',
  legendary_talisman: 'ACCESSORY_BAG',
};

function firstGenerator(prefix) {
  for (const tier of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
    const id = `${prefix}_GENERATOR_${tier}`;
    if (hypixelIds.has(id)) return id;
  }
  return `${prefix}_GENERATOR_1`;
}

function resolve(localId) {
  if (MANUAL[localId]) return MANUAL[localId];

  if (localId.startsWith('minion_')) {
    const base = localId.slice(7);
    const prefix = MINION_PREFIX[base] ?? base.toUpperCase();
    return firstGenerator(prefix);
  }

  const armor = localId.match(/^(necron|storm|goldor|maxor)_(helmet|chestplate|leggings|boots)$/);
  if (armor) {
    return `${ARMOR_PREFIX[armor[1]]}_${armor[2].toUpperCase()}`;
  }

  if (localId.startsWith('wooden_')) return `WOOD_${localId.slice(7).toUpperCase()}`;
  if (localId.startsWith('stone_')) return `STONE_${localId.slice(6).toUpperCase()}`;
  if (localId.startsWith('iron_')) return `IRON_${localId.slice(5).toUpperCase()}`;
  if (localId.startsWith('golden_')) return `GOLD_${localId.slice(7).toUpperCase()}`;
  if (localId.startsWith('diamond_')) return `DIAMOND_${localId.slice(8).toUpperCase()}`;

  const upper = localId.toUpperCase();
  if (hypixelIds.has(upper)) return upper;

  if (localId.startsWith('enchanted_') && localId.endsWith('_block')) {
    const base = upper.replace('_BLOCK', '');
    if (hypixelIds.has(base)) return base;
    if (hypixelIds.has(upper)) return upper;
  }

  if (localId.startsWith('enchanted_')) {
    if (hypixelIds.has(upper)) return upper;
    const noIngot = upper.replace('_INGOT', '');
    if (hypixelIds.has(noIngot)) return noIngot;
  }

  return upper;
}

const map = {};
for (const id of Object.keys(ITEMS)) {
  map[id] = resolve(id);
}

// Ensure every catalog minion exists
for (const entry of SKYBLOCK_CATALOG) {
  const mid = `minion_${entry.id}`;
  if (!map[mid]) map[mid] = resolve(mid);
}

const out = join(root, 'apps/client/src/ui/chest/hypixelTextureMap.json');
writeFileSync(out, JSON.stringify(map, null, 2));
console.log(`Wrote ${Object.keys(map).length} texture ids to ${out}`);
