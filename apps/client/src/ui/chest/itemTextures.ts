import type { ItemId } from '@aether/shared';
import hypixelMap from './hypixelTextureMap.json';

const COFLNET = 'https://sky.coflnet.com/static/icon';
const MC_18 = 'https://assets.mcasset.cloud/1.8.9/assets/minecraft/textures';

/** Vanilla 1.8.9 textures for basic commodities when SkyBlock icon unavailable. */
const VANILLA: Record<string, string> = {
  cobble: 'blocks/cobblestone',
  coal: 'items/coal',
  iron_ore: 'blocks/iron_ore',
  iron_ingot: 'items/iron_ingot',
  gold_ingot: 'items/gold_ingot',
  diamond: 'items/diamond',
  emerald: 'items/emerald',
  lapis: 'items/dye_powder_blue',
  redstone: 'items/redstone',
  obsidian: 'blocks/obsidian',
  end_stone: 'blocks/end_stone',
  flint: 'items/flint',
  gravel: 'blocks/gravel',
  sand: 'blocks/sand',
  red_sand: 'blocks/red_sand',
  netherrack: 'blocks/netherrack',
  quartz: 'items/quartz',
  glowstone_dust: 'items/glowstone_dust',
  glowstone: 'blocks/glowstone',
  rotten_flesh: 'items/rotten_flesh',
  bone: 'items/bone',
  string: 'items/string',
  spider_eye: 'items/spider_eye',
  gunpowder: 'items/gunpowder',
  ender_pearl: 'items/ender_pearl',
  ghast_tear: 'items/ghast_tear',
  slimeball: 'items/slimeball',
  magma_cream: 'items/magma_cream',
  blaze_rod: 'items/blaze_rod',
  soul_sand: 'blocks/soul_sand',
  wheat: 'items/wheat',
  seeds: 'items/seeds_wheat',
  carrot: 'items/carrot',
  potato: 'items/potato',
  poisonous_potato: 'items/potato_poisonous',
  pumpkin: 'blocks/pumpkin_side',
  melon: 'items/melon',
  melon_slice: 'items/melon',
  sugar_cane: 'items/reeds',
  nether_wart: 'items/nether_wart',
  leather: 'items/leather',
  raw_beef: 'items/beef_raw',
  raw_porkchop: 'items/porkchop_raw',
  raw_chicken: 'items/chicken_raw',
  feather: 'items/feather',
  egg: 'items/egg',
  wool: 'blocks/wool_colored_white',
  mutton: 'items/mutton_raw',
  raw_rabbit: 'items/rabbit_raw',
  bread: 'items/bread',
  apple: 'items/apple',
  oak_log: 'blocks/log_oak',
  spruce_log: 'blocks/log_spruce',
  birch_log: 'blocks/log_birch',
  jungle_log: 'blocks/log_jungle',
  acacia_log: 'blocks/log_acacia',
  dark_oak_log: 'blocks/log_big_oak',
  oak_plank: 'blocks/planks_oak',
  spruce_plank: 'blocks/planks_spruce',
  birch_plank: 'blocks/planks_birch',
  jungle_plank: 'blocks/planks_jungle',
  acacia_plank: 'blocks/planks_acacia',
  dark_oak_plank: 'blocks/planks_big_oak',
  raw_fish: 'items/fish_cod_raw',
  raw_salmon: 'items/fish_salmon_raw',
  clownfish: 'items/fish_clownfish_raw',
  pufferfish: 'items/fish_pufferfish_raw',
  cod: 'items/fish_cod_raw',
  salmon: 'items/fish_salmon_raw',
  prismarine_shard: 'items/prismarine_shard',
  prismarine_crystals: 'items/prismarine_crystals',
  sponge: 'blocks/sponge',
  wooden_sword: 'items/wood_sword',
  wooden_pickaxe: 'items/wood_pickaxe',
  wooden_axe: 'items/wood_axe',
  wooden_hoe: 'items/wood_hoe',
  wooden_shovel: 'items/wood_shovel',
  stone_sword: 'items/stone_sword',
  stone_pickaxe: 'items/stone_pickaxe',
  stone_axe: 'items/stone_axe',
  stone_hoe: 'items/stone_hoe',
  stone_shovel: 'items/stone_shovel',
  iron_sword: 'items/iron_sword',
  iron_pickaxe: 'items/iron_pickaxe',
  iron_axe: 'items/iron_axe',
  iron_hoe: 'items/iron_hoe',
  iron_shovel: 'items/iron_shovel',
  golden_sword: 'items/gold_sword',
  golden_pickaxe: 'items/gold_pickaxe',
  golden_axe: 'items/gold_axe',
  golden_hoe: 'items/gold_hoe',
  golden_shovel: 'items/gold_shovel',
  diamond_sword: 'items/diamond_sword',
  diamond_pickaxe: 'items/diamond_pickaxe',
  diamond_axe: 'items/diamond_axe',
  diamond_hoe: 'items/diamond_hoe',
  diamond_shovel: 'items/diamond_shovel',
  diamond_helmet: 'items/diamond_helmet',
  diamond_chestplate: 'items/diamond_chestplate',
  diamond_leggings: 'items/diamond_leggings',
  diamond_boots: 'items/diamond_boots',
  iron_helmet: 'items/iron_helmet',
  iron_chestplate: 'items/iron_chestplate',
  iron_leggings: 'items/iron_leggings',
  iron_boots: 'items/iron_boots',
  bow: 'items/bow_standby',
  fishing_rod: 'items/fishing_rod_uncast',
  experience_bottle: 'items/experience_bottle',
  enchanted_book: 'items/book_enchanted',
  nether_star: 'items/nether_star',
  stick: 'items/stick',
  sugar: 'items/sugar',
  clay_ball: 'items/clay_ball',
  dirt: 'blocks/dirt',
  stone: 'blocks/stone',
  ice: 'blocks/ice',
  packed_ice: 'blocks/packed_ice',
  snowball: 'items/snowball',
  red_mushroom: 'blocks/mushroom_red',
  brown_mushroom: 'blocks/mushroom_brown',
  mushroom: 'blocks/mushroom_red',
  cocoa_beans: 'items/dye_powder_brown',
  cactus: 'blocks/cactus_side',
  book: 'items/book_normal',
  paper: 'items/paper',
  mithril: 'items/iron_ingot',
  clay: 'blocks/clay',
  pumpkin_seeds: 'items/seeds_pumpkin',
  melon_seeds: 'items/seeds_melon',
  ink_sack: 'items/dye_powder_black',
  ink_sac: 'items/dye_powder_black',
  glow_ink_sac: 'items/dye_powder_lime',
  hay_bale: 'blocks/hay_block_side',
  cookie: 'items/cookie',
  golden_carrot: 'items/carrot_golden',
  golden_apple: 'items/apple_golden',
  lily_pad: 'blocks/waterlily',
  cactus_green: 'items/dye_powder_green',
  oak_sapling: 'blocks/sapling_oak',
  birch_sapling: 'blocks/sapling_birch',
  spruce_sapling: 'blocks/sapling_spruce',
  jungle_sapling: 'blocks/sapling_jungle',
  acacia_sapling: 'blocks/sapling_acacia',
  dark_oak_sapling: 'blocks/sapling_roofed_oak',
  cooked_fish: 'items/fish_cod_cooked',
  cooked_salmon: 'items/fish_salmon_cooked',
  cooked_beef: 'items/beef_cooked',
  cooked_porkchop: 'items/porkchop_cooked',
  cooked_chicken: 'items/chicken_cooked',
  cooked_mutton: 'items/mutton_cooked',
};

const map = hypixelMap as Record<string, string>;

function hypixelCandidates(itemId: ItemId): string[] {
  const out: string[] = [];
  const mapped = map[itemId];
  if (mapped) out.push(mapped);
  out.push(itemId.toUpperCase());
  if (itemId.startsWith('minion_')) {
    const base = itemId.slice(7).toUpperCase();
    out.push(`${base}_GENERATOR_1`, `${base.replace('_LOG', '')}_GENERATOR_1`);
  }
  return [...new Set(out)];
}

function vanillaCandidates(itemId: ItemId): string[] {
  const out: string[] = [];
  const direct = VANILLA[itemId];
  if (direct) out.push(`${MC_18}/${direct}.png`);
  const tool = itemId.match(/^(wooden|stone|iron|golden|diamond)_(sword|pickaxe|axe|hoe|shovel)$/);
  if (tool) {
    const material = tool[1] === 'wooden' ? 'wood' : tool[1] === 'golden' ? 'gold' : tool[1];
    out.push(`${MC_18}/items/${material}_${tool[2]}.png`);
  }
  if (itemId.startsWith('enchanted_')) {
    const base = itemId.replace(/^enchanted_/, '').replace(/_block$/, '');
    const vanillaBase = VANILLA[base];
    if (vanillaBase) out.push(`${MC_18}/${vanillaBase}.png`);
  }
  if (itemId.endsWith('_plank')) {
    out.push(`${MC_18}/blocks/planks_oak.png`);
  }
  if (itemId.includes('_log')) {
    out.push(`${MC_18}/blocks/log_oak.png`);
  }
  return [...new Set(out)];
}

function coflnet(...ids: string[]): string[] {
  return ids.map((id) => `${COFLNET}/${encodeURIComponent(id)}`);
}

function vanillaTexture(path: string): string {
  return `${MC_18}/${path}.png`;
}

/** Hypixel SkyBlock ids for menu-only icon keys (no backing item stack). */
const UI_HYPIXEL: Record<string, string[]> = {
  warp_gate: ['ENDER_EYE', 'END_PORTAL_FRAME'],
  map: ['MAP', 'FILLED_MAP'],
  compass: ['COMPASS'],
  player_head: ['SKULL_ITEM', 'PLAYER_HEAD'],
  diamond_sword: ['DIAMOND_SWORD'],
  painting: ['PAINTING'],
  book: ['BOOK'],
  chest: ['CHEST'],
  talisman: ['REDSTONE_TALISMAN', 'TALISMAN'],
  pet: ['PET'],
  emerald: ['EMERALD'],
  gold_ingot: ['GOLD_INGOT'],
  coin: ['GOLD_NUGGET', 'GOLD_INGOT'],
  minion: ['COBBLESTONE_GENERATOR_1', 'MINION'],
  zombie_head: ['ZOMBIE_HEAD', 'SKULL_ITEM'],
  wither_skull: ['WITHER_SKELETON_SKULL', 'SKULL_ITEM'],
  anvil: ['ANVIL'],
  enchanting_table: ['ENCHANTMENT_TABLE'],
  leaderboard: ['GOLD_BLOCK', 'DIAMOND'],
  sign: ['SIGN'],
  arrow: ['ARROW'],
  arrow_left: ['ARROW'],
  arrow_right: ['ARROW'],
  barrier: ['BARRIER', 'BEDROCK'],
  hopper: ['HOPPER'],
  paper: ['PAPER'],
  gold_nugget: ['GOLD_NUGGET'],
  bank_vault: ['GOLD_BLOCK'],
  clock: ['WATCH'],
  villager: ['EMERALD'],
  crafting_table: ['WORKBENCH'],
  nether_star: ['NETHER_STAR'],
  gold_block: ['GOLD_BLOCK'],
  gold_horse_armor: ['GOLD_BARDING'],
  lime_dye: ['INK_SACK'],
  red_dye: ['INK_SACK'],
  gray_stained_glass_pane: ['STAINED_GLASS_PANE'],
  dungeon_portal: ['END_PORTAL_FRAME'],
  slayer_altar: ['QUARTZ_BLOCK'],
  sword: ['DIAMOND_SWORD'],
  bow: ['BOW'],
  pickaxe: ['DIAMOND_PICKAXE'],
  axe: ['GOLD_AXE'],
  hoe: ['DIAMOND_HOE'],
  fishing_rod: ['FISHING_ROD'],
  helmet: ['DIAMOND_HELMET'],
  chestplate: ['DIAMOND_CHESTPLATE'],
  leggings: ['DIAMOND_LEGGINGS'],
  boots: ['DIAMOND_BOOTS'],
  farming: ['GOLD_HOE'],
  mining: ['DIAMOND_PICKAXE'],
  combat: ['DIAMOND_SWORD'],
  foraging: ['GOLD_AXE'],
  fishing: ['FISHING_ROD'],
  enchanting: ['ENCHANTED_BOOK'],
  alchemy: ['POTION'],
  taming: ['LEASH'],
  carpentry: ['WORKBENCH'],
  runecrafting: ['NETHER_STAR'],
  social: ['SKULL_ITEM'],
  dungeoneering: ['WITHER_SKELETON_SKULL'],
  berserk: ['DIAMOND_SWORD'],
  archer: ['BOW'],
  mage: ['ENCHANTED_BOOK'],
  tank: ['DIAMOND_CHESTPLATE'],
  healer: ['POTION'],
  stat: ['NETHER_STAR'],
};

/** Vanilla 1.8.9 fallbacks for menu-only icons. */
const UI_VANILLA: Record<string, string[]> = {
  warp_gate: [vanillaTexture('items/ender_eye')],
  map: [vanillaTexture('items/map_filled')],
  compass: [vanillaTexture('items/compass_item')],
  player_head: [vanillaTexture('blocks/soul_sand')],
  diamond_sword: [vanillaTexture('items/diamond_sword')],
  painting: [vanillaTexture('items/painting')],
  book: [vanillaTexture('items/book_normal')],
  chest: [vanillaTexture('items/chest_minecart')],
  talisman: [vanillaTexture('items/redstone')],
  emerald: [vanillaTexture('items/emerald')],
  gold_ingot: [vanillaTexture('items/gold_ingot')],
  coin: [vanillaTexture('items/gold_nugget')],
  minion: [vanillaTexture('blocks/cobblestone')],
  zombie_head: [vanillaTexture('items/skull_zombie')],
  wither_skull: [vanillaTexture('items/skull_wither')],
  anvil: [vanillaTexture('blocks/anvil_base')],
  enchanting_table: [vanillaTexture('blocks/enchanting_table_top')],
  leaderboard: [vanillaTexture('blocks/gold_block')],
  sign: [vanillaTexture('items/sign')],
  arrow: [vanillaTexture('items/arrow')],
  arrow_left: [vanillaTexture('items/arrow')],
  arrow_right: [vanillaTexture('items/arrow')],
  barrier: [vanillaTexture('items/barrier')],
  hopper: [vanillaTexture('items/hopper')],
  paper: [vanillaTexture('items/paper')],
  gold_nugget: [vanillaTexture('items/gold_nugget')],
  bank_vault: [vanillaTexture('blocks/gold_block')],
  clock: [vanillaTexture('items/clock')],
  villager: [vanillaTexture('items/emerald')],
  crafting_table: [vanillaTexture('blocks/crafting_table_top')],
  nether_star: [vanillaTexture('items/nether_star')],
  gold_block: [vanillaTexture('blocks/gold_block')],
  gold_horse_armor: [vanillaTexture('items/gold_horse_armor')],
  lime_dye: [vanillaTexture('items/dye_powder_lime')],
  red_dye: [vanillaTexture('items/dye_powder_red')],
  gray_stained_glass_pane: [vanillaTexture('blocks/glass')],
  dungeon_portal: [vanillaTexture('items/ender_eye')],
  slayer_altar: [vanillaTexture('blocks/quartz_block_top')],
  sword: [vanillaTexture('items/diamond_sword')],
  bow: [vanillaTexture('items/bow_standby')],
  pickaxe: [vanillaTexture('items/diamond_pickaxe')],
  axe: [vanillaTexture('items/gold_axe')],
  hoe: [vanillaTexture('items/diamond_hoe')],
  fishing_rod: [vanillaTexture('items/fishing_rod')],
  helmet: [vanillaTexture('items/diamond_helmet')],
  chestplate: [vanillaTexture('items/diamond_chestplate')],
  leggings: [vanillaTexture('items/diamond_leggings')],
  boots: [vanillaTexture('items/diamond_boots')],
  pet: [vanillaTexture('items/bone')],
  deposit_100: [vanillaTexture('items/gold_nugget')],
  deposit_1000: [vanillaTexture('items/gold_ingot')],
  deposit_10000: [vanillaTexture('blocks/gold_block')],
  deposit_half: [vanillaTexture('items/gold_nugget')],
  deposit_all: [vanillaTexture('items/gold_ingot')],
  withdraw_100: [vanillaTexture('items/gold_nugget')],
  withdraw_1000: [vanillaTexture('items/gold_ingot')],
  withdraw_10000: [vanillaTexture('blocks/gold_block')],
  withdraw_half: [vanillaTexture('items/gold_nugget')],
  withdraw_all: [vanillaTexture('items/gold_ingot')],
};

const ISLAND_WARP_ITEM: Record<string, ItemId> = {
  hub: 'oak_log',
  private_island: 'dirt',
  barn: 'wheat',
  gold_mine: 'coal',
  deep_caverns: 'cobble',
  spider_den: 'spider_eye',
  park: 'oak_log',
  mushroom_desert: 'cactus',
  the_end: 'end_stone',
  crimson_isle: 'netherrack',
  dungeon_hub: 'bone',
  garden: 'wheat',
  dwarven_mines: 'mithril',
  crystal_hollows: 'gemstone_ruby',
  rift: 'ender_pearl',
};

/** Ordered texture URLs — Hypixel SkyBlock icons first, then vanilla 1.8.9 fallbacks. */
export function itemTextureSources(itemId: ItemId): string[] {
  const hypixel = hypixelCandidates(itemId).map((id) => `${COFLNET}/${encodeURIComponent(id)}`);
  const vanilla = vanillaCandidates(itemId);
  return [...hypixel, ...vanilla];
}

/** Menu slot icons that are not tied to an item stack. */
export function uiIconTextureSources(icon: string): string[] {
  if (icon.startsWith('island_')) {
    const islandId = icon.slice(7);
    const itemId = ISLAND_WARP_ITEM[islandId];
    if (itemId) return itemTextureSources(itemId);
  }
  const catalogItem = map[icon];
  if (catalogItem) return itemTextureSources(icon as ItemId);
  const hypixel = coflnet(...(UI_HYPIXEL[icon] ?? []));
  const vanilla = UI_VANILLA[icon] ?? [];
  return [...hypixel, ...vanilla];
}

/** Resolve textures for either an item stack or a menu icon key. */
export function iconTextureSources(icon: string, itemId?: ItemId): string[] {
  if (itemId) return itemTextureSources(itemId);
  return uiIconTextureSources(icon);
}

/** Resolve Hypixel item id for an internal id (debug / tooling). */
export function hypixelItemId(itemId: ItemId): string | undefined {
  return map[itemId] ?? itemId.toUpperCase();
}
