import type { ItemId } from './items.js';
import type { SkillId } from './skills.js';

export type IslandId =
  | 'hub'
  | 'private_island'
  | 'barn'
  | 'gold_mine'
  | 'deep_caverns'
  | 'spider_den'
  | 'park'
  | 'mushroom_desert'
  | 'the_end'
  | 'crimson_isle'
  | 'dungeon_hub'
  | 'garden'
  | 'dwarven_mines'
  | 'crystal_hollows'
  | 'rift';

export type ActionKind = 'mine' | 'farm' | 'forage' | 'fish' | 'combat' | 'npc' | 'warp' | 'feature';

/** Interactable structures placed inside a zone's district. */
export type StationKind =
  | 'bazaar'
  | 'craft'
  | 'minions'
  | 'bank'
  | 'auction'
  | 'warp'
  | 'enchanting'
  | 'reforge'
  | 'dungeon'
  | 'slayer'
  | 'pets'
  | 'garden'
  | 'hotm'
  | 'alchemy'
  | 'wardrobe'
  | 'museum'
  | 'kuudra'
  | 'dragons';

export interface ZoneAction {
  id: string;
  label: string;
  kind: ActionKind;
  description: string;
  /** Item produced or mob fought */
  target?: ItemId | 'husk' | 'weaver' | 'crawler';
  skill?: SkillId;
  xp: number;
  qty: number;
  tool?: 'pickaxe' | 'axe' | 'hoe' | 'sword' | 'rod';
  minToolTier?: number;
  cooldownMs: number;
  /** Coins per action for NPC sell hint */
  sellPrice?: number;
}

export interface NpcShop {
  id: string;
  name: string;
  greeting: string;
  buys: { itemId: ItemId; price: number }[];
  sells: { itemId: ItemId; price: number }[];
}

export interface ZoneDef {
  id: string;
  islandId: IslandId;
  name: string;
  description: string;
  icon: string;
  /** Neighbouring zones. Walking is free across a whole island. */
  links: string[];
  actions: ZoneAction[];
  npc?: NpcShop;
  stations?: StationKind[];
  /** Opens bazaar UI */
  hasBazaar?: boolean;
  /** Opens craft UI */
  hasCraft?: boolean;
  /** Minion placement on private island */
  hasMinions?: boolean;
  skillReq?: { skill: SkillId; level: number };
}

export interface IslandDef {
  id: IslandId;
  name: string;
  description: string;
  icon: string;
  /** Warp unlock — always hub + private island */
  warpFromHub?: boolean;
  skillReq?: { skill: SkillId; level: number };
}

export const ISLANDS: Record<IslandId, IslandDef> = {
  hub: {
    id: 'hub',
    name: 'Hub',
    description: 'The village: bazaar, auction house, bank, and the warp gate.',
    icon: 'hub',
  },
  private_island: {
    id: 'private_island',
    name: 'Your Island',
    description: 'Your private plot — minions, crops and resources.',
    icon: 'island',
    warpFromHub: true,
  },
  barn: {
    id: 'barn',
    name: 'The Barn',
    description: 'Rolling fields of wheat, carrots, potatoes and melons.',
    icon: 'farm',
    warpFromHub: true,
  },
  gold_mine: {
    id: 'gold_mine',
    name: 'Gold Mine',
    description: 'Starter mines with coal, iron, gold and lapis.',
    icon: 'mine',
    warpFromHub: true,
  },
  deep_caverns: {
    id: 'deep_caverns',
    name: 'Deep Caverns',
    description: 'Seven descending floors of increasingly rare ores.',
    icon: 'cavern',
    warpFromHub: true,
    skillReq: { skill: 'mining', level: 5 },
  },
  spider_den: {
    id: 'spider_den',
    name: "Spider's Den",
    description: 'Webbed cliffs crawling with spiders.',
    icon: 'spider',
    warpFromHub: true,
    skillReq: { skill: 'combat', level: 3 },
  },
  park: {
    id: 'park',
    name: 'The Park',
    description: 'Ancient forests, a fishing lake and rare woods.',
    icon: 'tree',
    warpFromHub: true,
    skillReq: { skill: 'foraging', level: 5 },
  },
  mushroom_desert: {
    id: 'mushroom_desert',
    name: 'Mushroom Desert',
    description: 'Desert crops, mushroom gorges and a trapper.',
    icon: 'desert',
    warpFromHub: true,
    skillReq: { skill: 'farming', level: 5 },
  },
  the_end: {
    id: 'the_end',
    name: 'The End',
    description: 'Endermen, Zealots and the Dragon Nest.',
    icon: 'end',
    warpFromHub: true,
    skillReq: { skill: 'combat', level: 12 },
  },
  crimson_isle: {
    id: 'crimson_isle',
    name: 'Crimson Isle',
    description: 'A volcanic island for advanced adventurers.',
    icon: 'volcano',
    warpFromHub: true,
    skillReq: { skill: 'combat', level: 24 },
  },
  dungeon_hub: {
    id: 'dungeon_hub',
    name: 'Dungeon Hub',
    description: 'Pick a class and descend into the Catacombs.',
    icon: 'skull',
    warpFromHub: true,
    skillReq: { skill: 'combat', level: 12 },
  },
  garden: {
    id: 'garden',
    name: 'The Garden',
    description: 'Crop milestones, visitors, and Jacob\'s Farming Contests.',
    icon: 'farm',
    warpFromHub: true,
    skillReq: { skill: 'farming', level: 5 },
  },
  dwarven_mines: {
    id: 'dwarven_mines',
    name: 'Dwarven Mines',
    description: 'Mithril, Titanium, commissions, and the Heart of the Mountain.',
    icon: 'cavern',
    warpFromHub: true,
    skillReq: { skill: 'mining', level: 12 },
  },
  crystal_hollows: {
    id: 'crystal_hollows',
    name: 'Crystal Hollows',
    description: 'Gemstone caverns beneath the Dwarven Mines.',
    icon: 'cavern',
    warpFromHub: true,
    skillReq: { skill: 'mining', level: 12 },
  },
  rift: {
    id: 'rift',
    name: 'The Rift',
    description: 'A broken pocket dimension with strange mobs and motes.',
    icon: 'end',
    warpFromHub: true,
    skillReq: { skill: 'combat', level: 18 },
  },
};

const mine = (
  id: string,
  label: string,
  target: ItemId,
  xp: number,
  qty: number,
  minToolTier: number,
  cooldownMs: number,
  description: string,
): ZoneAction => ({ id, label, kind: 'mine', target, skill: 'mining', description, xp, qty, tool: 'pickaxe', minToolTier, cooldownMs });

const farm = (
  id: string,
  label: string,
  target: ItemId,
  xp: number,
  qty: number,
  description: string,
): ZoneAction => ({ id, label, kind: 'farm', target, skill: 'farming', description, xp, qty, tool: 'hoe', minToolTier: 1, cooldownMs: 600 });

const forage = (
  id: string,
  label: string,
  target: ItemId,
  xp: number,
  qty: number,
  minToolTier: number,
  description: string,
): ZoneAction => ({ id, label, kind: 'forage', target, skill: 'foraging', description, xp, qty, tool: 'axe', minToolTier, cooldownMs: 750 });

const fish = (
  id: string,
  label: string,
  target: ItemId,
  xp: number,
  description: string,
): ZoneAction => ({ id, label, kind: 'fish', target, skill: 'fishing', description, xp, qty: 1, tool: 'rod', minToolTier: 1, cooldownMs: 2300 });

const combat = (
  id: string,
  label: string,
  target: string,
  xp: number,
  minToolTier: number,
  cooldownMs: number,
  description: string,
): ZoneAction => ({
  id,
  label,
  kind: 'combat',
  target: target as ZoneAction['target'],
  skill: 'combat',
  description,
  xp,
  qty: 1,
  tool: 'sword',
  minToolTier,
  cooldownMs,
});

export const ZONES: Record<string, ZoneDef> = {
  // ── Sky Hub — one walkable village, no portals between districts ──────────
  hub_plaza: {
    id: 'hub_plaza',
    islandId: 'hub',
    name: 'Village Plaza',
    description: 'The heart of the Hub. Every shop is a short walk away.',
    icon: 'hub',
    links: ['hub_bazaar', 'hub_auction', 'hub_bank', 'hub_blacksmith', 'hub_library', 'hub_warps', 'hub_community'],
    actions: [],
    npc: {
      id: 'adventurer',
      name: 'Adventurer',
      greeting: 'Welcome to the Hub! Walk the village, or type /warp island, /ah, /bz.',
      buys: [{ itemId: 'rotten_flesh', price: 2 }, { itemId: 'bone', price: 2 }],
      sells: [
        { itemId: 'wooden_sword', price: 10 },
        { itemId: 'bread', price: 8 },
        { itemId: 'speed_talisman', price: 500 },
        { itemId: 'vaccine_talisman', price: 750 },
        { itemId: 'intimidation_talisman', price: 800 },
        { itemId: 'zombie_talisman', price: 600 },
        { itemId: 'feather_talisman', price: 2500 },
        { itemId: 'griffin_pet', price: 25000 },
      ],
    },
  },
  hub_bazaar: {
    id: 'hub_bazaar',
    islandId: 'hub',
    name: 'Bazaar Alley',
    description: 'Player-driven buy orders and sell offers.',
    icon: 'bazaar',
    links: ['hub_plaza'],
    actions: [],
    stations: ['bazaar'],
    hasBazaar: true,
  },
  hub_auction: {
    id: 'hub_auction',
    islandId: 'hub',
    name: 'Auction House',
    description: 'Bid on rare gear or list your own.',
    icon: 'auction',
    links: ['hub_plaza'],
    actions: [],
    stations: ['auction'],
    npc: {
      id: 'auction_master',
      name: 'Auction Master',
      greeting: 'Unique items only — stackables belong in the Bazaar.',
      buys: [],
      sells: [],
    },
  },
  hub_bank: {
    id: 'hub_bank',
    islandId: 'hub',
    name: 'Bank',
    description: 'Deposit coins to earn interest, even while offline.',
    icon: 'bank',
    links: ['hub_plaza'],
    actions: [],
    stations: ['bank'],
    npc: {
      id: 'banker',
      name: 'Banker',
      greeting: 'Deposits are safe from death and earn daily interest.',
      buys: [],
      sells: [],
    },
  },
  hub_blacksmith: {
    id: 'hub_blacksmith',
    islandId: 'hub',
    name: 'Blacksmith',
    description: 'Reforge gear for extra stats.',
    icon: 'anvil',
    links: ['hub_plaza'],
    actions: [],
    stations: ['reforge'],
    npc: {
      id: 'blacksmith',
      name: 'Blacksmith',
      greeting: 'Bring me coins and I will reforge your equipment.',
      buys: [{ itemId: 'iron_ingot', price: 3 }],
      sells: [{ itemId: 'stone_pickaxe', price: 40 }, { itemId: 'stone_sword', price: 35 }],
    },
  },
  hub_library: {
    id: 'hub_library',
    islandId: 'hub',
    name: 'Library',
    description: 'Enchant weapons, tools and armor.',
    icon: 'book',
    links: ['hub_plaza'],
    actions: [],
    stations: ['enchanting'],
    npc: {
      id: 'librarian',
      name: 'Librarian',
      greeting: 'Knowledge sharpens steel. Enchanting costs coins.',
      buys: [],
      sells: [
        { itemId: 'lapis', price: 12 },
        { itemId: 'enchanted_book', price: 250 },
        { itemId: 'experience_bottle', price: 50 },
        { itemId: 'grand_experience_bottle', price: 400 },
        { itemId: 'titan_experience_bottle', price: 2500 },
      ],
    },
  },
  hub_warps: {
    id: 'hub_warps',
    islandId: 'hub',
    name: 'Warp Gate',
    description: 'Warp to the Park, Gold Mine, The End, and more.',
    icon: 'portal',
    links: ['hub_plaza'],
    actions: [],
    stations: ['warp'],
  },
  hub_farm: {
    id: 'hub_farm',
    islandId: 'hub',
    name: 'Farmhouse',
    description: 'Starter wheat and carrot plots.',
    icon: 'farm',
    links: ['hub_plaza'],
    actions: [
      farm('hub_farm_wheat', 'Harvest Wheat', 'wheat', 5, 1, 'Golden wheat stalks.'),
      farm('hub_farm_carrot', 'Harvest Carrots', 'carrot', 5, 2, 'Crisp orange carrots.'),
    ],
    npc: {
      id: 'farmhand',
      name: 'Farmer',
      greeting: 'I buy crops and sell hoes.',
      buys: [{ itemId: 'wheat', price: 6 }, { itemId: 'carrot', price: 3 }],
      sells: [{ itemId: 'wooden_hoe', price: 8 }, { itemId: 'rookie_hoe', price: 250 }, { itemId: 'sheep_pet', price: 15000 }],
    },
  },
  hub_coal_mine: {
    id: 'hub_coal_mine',
    islandId: 'hub',
    name: 'Coal Mine',
    description: 'A shallow shaft of cobblestone and coal.',
    icon: 'mine',
    links: ['hub_plaza'],
    actions: [
      mine('hub_mine_cobble', 'Mine Cobblestone', 'cobble', 2, 1, 1, 520, 'Chip away at the walls.'),
      mine('hub_mine_coal', 'Mine Coal Ore', 'coal', 8, 1, 1, 780, 'Dark seams of coal.'),
      mine('hub_mine_stone', 'Mine Stone', 'stone', 3, 1, 1, 560, 'Smooth stone under the cobble.'),
      mine('hub_mine_dirt', 'Dig Dirt', 'dirt', 1, 2, 1, 400, 'Loose dirt at the shaft mouth.'),
      mine('hub_mine_clay', 'Dig Clay', 'clay_ball', 4, 2, 1, 640, 'Wet clay along the seepage.'),
    ],
  },
  hub_forest: {
    id: 'hub_forest',
    islandId: 'hub',
    name: 'Forest',
    description: 'Oak and birch woods behind the village.',
    icon: 'tree',
    links: ['hub_plaza'],
    actions: [
      forage('hub_chop_oak', 'Chop Oak', 'oak_log', 6, 1, 1, 'Fresh oak timber.'),
      forage('hub_apple', 'Pick Apples', 'apple', 4, 1, 1, 'Apples drop from the oak canopy.'),
      forage('hub_oak_sapling', 'Gather Oak Saplings', 'oak_sapling', 3, 1, 1, 'Young oak shoots.'),
    ],
    npc: {
      id: 'lumber_merchant',
      name: 'Lumber Merchant',
      greeting: 'Axes for sale, logs bought by the stack.',
      buys: [{ itemId: 'oak_log', price: 2 }],
      sells: [{ itemId: 'wooden_axe', price: 8 }, { itemId: 'stone_axe', price: 40 }],
    },
  },
  hub_fishing: {
    id: 'hub_fishing',
    islandId: 'hub',
    name: "Fisherman's Hut",
    description: 'Cast a line off the village pier.',
    icon: 'fish',
    links: ['hub_plaza'],
    actions: [
      fish('hub_fish', 'Cast Line', 'raw_fish', 10, 'Calm harbour water.'),
      fish('hub_fish_salmon', 'Catch Salmon', 'raw_salmon', 12, 'Pink salmon hug the current.'),
      fish('hub_fish_cod', 'Catch Cod', 'cod', 10, 'A common harbour catch.'),
      fish('hub_fish_clown', 'Catch Clownfish', 'clownfish', 14, 'Bright reef strays.'),
      fish('hub_fish_tropical', 'Catch Tropical Fish', 'tropical_fish', 14, 'Warm-water strays from the gulf.'),
      fish('hub_fish_puffer', 'Catch Pufferfish', 'pufferfish', 16, 'Handle with care.'),
      fish('hub_fish_crystals', 'Salvage Crystals', 'prismarine_crystals', 18, 'Shards glitter in the nets.'),
      fish('hub_fish_nautilus', 'Find Nautilus Shell', 'nautilus_shell', 22, 'A rare washed-up shell.'),
      fish('hub_fish_glow', 'Catch Glow Ink', 'glow_ink_sac', 18, 'Glowing squid ink in the deep.'),
    ],
    npc: {
      id: 'fish_merchant',
      name: 'Fisherman',
      greeting: 'Rods and bait, fresh catch bought daily.',
      buys: [{ itemId: 'raw_fish', price: 6 }],
      sells: [{ itemId: 'fishing_rod', price: 30 }, { itemId: 'cooked_fish', price: 12 }, { itemId: 'ammonite_pet', price: 20000 }],
    },
  },
  hub_graveyard: {
    id: 'hub_graveyard',
    islandId: 'hub',
    name: 'Graveyard',
    description: 'Zombies claw out of the soil after dark.',
    icon: 'grave',
    links: ['hub_plaza'],
    actions: [combat('hub_fight_zombie', 'Fight Zombie', 'zombie', 6, 1, 1100, 'A shambling corpse.')],
  },
  hub_colosseum: {
    id: 'hub_colosseum',
    islandId: 'hub',
    name: 'Colosseum',
    description: 'Tougher graveyard zombies gather to brawl.',
    icon: 'sword',
    links: ['hub_plaza'],
    actions: [combat('hub_fight_brawler', 'Fight Graveyard Zombie', 'graveyard_zombie', 12, 1, 1300, 'A hardened undead brawler.')],
  },
  hub_wilderness: {
    id: 'hub_wilderness',
    islandId: 'hub',
    name: 'Wilderness',
    description: 'Spiders nest in the tall grass past the wall.',
    icon: 'spider',
    links: ['hub_plaza'],
    actions: [combat('hub_fight_spider', 'Fight Spider', 'spider', 7, 1, 1100, 'A skittering spider.')],
  },
  hub_community: {
    id: 'hub_community',
    islandId: 'hub',
    name: 'Community House',
    description: 'Melody plays the harp for anyone who will listen.',
    icon: 'book',
    links: ['hub_plaza'],
    actions: [],
    npc: {
      id: 'melody',
      name: 'Melody',
      greeting: 'Play along with the harp and I will part with a lock of my hair.',
      buys: [],
      sells: [{ itemId: 'melodys_hair', price: 10000 }],
    },
  },

  // ── Private Island ────────────────────────────────────────────────────────
  island_home: {
    id: 'island_home',
    islandId: 'private_island',
    name: 'Island Spawn',
    description: 'Your home base with a crafting table.',
    icon: 'island',
    links: ['island_mine', 'island_farm', 'island_grove', 'island_pond', 'island_minions'],
    actions: [],
    stations: ['craft', 'warp', 'alchemy', 'wardrobe', 'museum'],
    hasCraft: true,
  },
  island_mine: {
    id: 'island_mine',
    islandId: 'private_island',
    name: 'Stone Patch',
    description: 'Mine cobble, coal and iron on your island.',
    icon: 'mine',
    links: ['island_home'],
    actions: [
      mine('mine_cobble', 'Mine Cobble', 'cobble', 2, 1, 1, 560, 'Chip away stone.'),
      mine('mine_coal', 'Mine Coal', 'coal', 8, 1, 1, 800, 'Dark seams of coal.'),
      mine('mine_iron', 'Mine Iron Ore', 'iron_ore', 12, 1, 2, 1000, 'Raw iron veins.'),
    ],
  },
  island_farm: {
    id: 'island_farm',
    islandId: 'private_island',
    name: 'Farm Plots',
    description: 'Harvest wheat with a hoe.',
    icon: 'farm',
    links: ['island_home'],
    actions: [farm('harvest_wheat', 'Harvest Wheat', 'wheat', 5, 1, 'Golden wheat stalks.')],
  },
  island_grove: {
    id: 'island_grove',
    islandId: 'private_island',
    name: 'Oak Grove',
    description: 'Chop oak logs for Foraging XP.',
    icon: 'tree',
    links: ['island_home'],
    actions: [forage('chop_oak', 'Chop Oak', 'oak_log', 6, 1, 1, 'Fresh timber.')],
  },
  island_pond: {
    id: 'island_pond',
    islandId: 'private_island',
    name: 'Fishing Pond',
    description: 'Cast a line for raw fish.',
    icon: 'fish',
    links: ['island_home'],
    actions: [fish('fish_pond', 'Cast Line', 'raw_fish', 10, 'Fish in calm waters.')],
  },
  island_minions: {
    id: 'island_minions',
    islandId: 'private_island',
    name: 'Minion Platform',
    description: 'Place and manage resource minions.',
    icon: 'minion',
    links: ['island_home'],
    actions: [],
    stations: ['minions'],
    hasMinions: true,
  },

  // ── The Barn ──────────────────────────────────────────────────────────────
  barn_fields: {
    id: 'barn_fields',
    islandId: 'barn',
    name: 'Wheat Fields',
    description: 'Large-scale farming with rich soil.',
    icon: 'farm',
    links: ['barn_merchant', 'barn_garden', 'barn_pens'],
    actions: [
      farm('farm_wheat', 'Harvest Wheat (x2)', 'wheat', 8, 2, 'Rich barn soil yields extra.'),
      farm('farm_potato', 'Harvest Potatoes', 'potato', 6, 2, 'Dig up potatoes.'),
      farm('farm_carrot', 'Harvest Carrots', 'carrot', 6, 2, 'Pull up carrots.'),
      farm('farm_seeds', 'Gather Seeds', 'seeds', 4, 2, 'Wheat seeds among the stubble.'),
      farm('farm_poisonous_potato', 'Rare Poisonous Potato', 'poisonous_potato', 8, 1, 'A spoiled tuber in the potato rows.'),
      farm('farm_beetroot', 'Harvest Beetroot', 'beetroot', 6, 2, 'Deep red beetroot.'),
      farm('farm_beetroot_seeds', 'Gather Beetroot Seeds', 'beetroot_seeds', 4, 1, 'Beetroot seeds in the soil.'),
    ],
    stations: ['warp'],
  },
  barn_garden: {
    id: 'barn_garden',
    islandId: 'barn',
    name: 'Melon Garden',
    description: 'Melons and pumpkins grow along the fence.',
    icon: 'melon',
    links: ['barn_fields'],
    actions: [
      farm('farm_melon', 'Harvest Melon', 'melon', 7, 3, 'Juicy melon slices.'),
      farm('farm_pumpkin', 'Harvest Pumpkin', 'pumpkin', 7, 1, 'A heavy pumpkin.'),
    ],
  },
  barn_pens: {
    id: 'barn_pens',
    islandId: 'barn',
    name: 'Animal Pens',
    description: 'Cows, pigs, chickens, sheep and rabbits roam the paddocks.',
    icon: 'farm',
    links: ['barn_fields'],
    actions: [
      combat('fight_cow', 'Fight Cow', 'cow', 4, 1, 900, 'Drops leather and beef.'),
      combat('fight_pig', 'Fight Pig', 'pig', 4, 1, 900, 'Drops porkchops.'),
      combat('fight_chicken', 'Fight Chicken', 'chicken', 3, 1, 800, 'Drops chicken, feathers and eggs.'),
      combat('fight_sheep', 'Fight Sheep', 'sheep', 4, 1, 900, 'Drops wool and mutton.'),
      combat('fight_rabbit', 'Fight Rabbit', 'rabbit', 4, 1, 850, 'Drops rabbit hide and feet.'),
    ],
  },
  barn_merchant: {
    id: 'barn_merchant',
    islandId: 'barn',
    name: 'Farm Merchant',
    description: 'Buys and sells farm goods.',
    icon: 'villager',
    links: ['barn_fields'],
    actions: [],
    npc: {
      id: 'farm_merchant',
      name: 'Farm Merchant',
      greeting: 'Fresh produce! I buy crops and sell bread.',
      buys: [
        { itemId: 'wheat', price: 6 },
        { itemId: 'potato', price: 3 },
        { itemId: 'carrot', price: 3 },
        { itemId: 'melon', price: 2 },
        { itemId: 'pumpkin', price: 10 },
      ],
      sells: [{ itemId: 'bread', price: 8 }, { itemId: 'wheat', price: 4 }],
    },
  },

  // ── Gold Mine ─────────────────────────────────────────────────────────────
  gold_entrance: {
    id: 'gold_entrance',
    islandId: 'gold_mine',
    name: 'Mine Entrance',
    description: 'The mouth of the Gold Mine.',
    icon: 'mine',
    links: ['gold_coal', 'gold_iron', 'gold_gold', 'gold_lapis', 'gold_merchant'],
    actions: [mine('mine_cobble_gold', 'Mine Cobblestone', 'cobble', 2, 1, 1, 520, 'Surface rubble.')],
    stations: ['warp'],
  },
  gold_coal: {
    id: 'gold_coal',
    islandId: 'gold_mine',
    name: 'Coal Seam',
    description: 'Dense coal deposits.',
    icon: 'coal',
    links: ['gold_entrance'],
    actions: [mine('mine_coal_gold', 'Mine Coal (x2)', 'coal', 10, 2, 1, 880, 'Double coal yield.')],
  },
  gold_iron: {
    id: 'gold_iron',
    islandId: 'gold_mine',
    name: 'Iron Tunnel',
    description: 'Iron ore behind a stone pickaxe.',
    icon: 'iron',
    links: ['gold_entrance'],
    skillReq: { skill: 'mining', level: 2 },
    actions: [mine('mine_iron_gold', 'Mine Iron Ore', 'iron_ore', 14, 1, 2, 950, 'Quality iron ore.')],
  },
  gold_gold: {
    id: 'gold_gold',
    islandId: 'gold_mine',
    name: 'Gold Shaft',
    description: 'Veins of gold run through the walls.',
    icon: 'gold',
    links: ['gold_entrance'],
    skillReq: { skill: 'mining', level: 3 },
    actions: [mine('mine_gold', 'Mine Gold Ore', 'gold_ingot', 18, 1, 2, 1050, 'Glittering gold ore.')],
  },
  gold_lapis: {
    id: 'gold_lapis',
    islandId: 'gold_mine',
    name: 'Lapis Pocket',
    description: 'Blue lapis crystals in the deep wall.',
    icon: 'lapis',
    links: ['gold_entrance'],
    skillReq: { skill: 'mining', level: 4 },
    actions: [mine('mine_lapis', 'Mine Lapis Ore', 'lapis', 20, 3, 2, 1100, 'Rich lapis clusters.')],
  },
  gold_merchant: {
    id: 'gold_merchant',
    islandId: 'gold_mine',
    name: 'Mine Merchant',
    description: 'Sells pickaxes, buys ores.',
    icon: 'villager',
    links: ['gold_entrance'],
    actions: [],
    npc: {
      id: 'mine_merchant',
      name: 'Mine Merchant',
      greeting: 'Ores for sale! Bring me your mining haul.',
      buys: [
        { itemId: 'cobble', price: 1 },
        { itemId: 'coal', price: 2 },
        { itemId: 'iron_ore', price: 3 },
        { itemId: 'gold_ingot', price: 4 },
        { itemId: 'lapis', price: 1 },
      ],
      sells: [{ itemId: 'stone_pickaxe', price: 40 }, { itemId: 'iron_pickaxe', price: 180 }],
    },
  },

  // ── Deep Caverns — seven descending floors ────────────────────────────────
  deep_lobby: {
    id: 'deep_lobby',
    islandId: 'deep_caverns',
    name: 'Caverns Lobby',
    description: 'The lift down into seven floors of ore.',
    icon: 'cavern',
    links: ['deep_gunpowder', 'deep_lapis', 'deep_pigmen', 'deep_slimehill', 'deep_diamond', 'deep_obsidian', 'deep_mithril'],
    skillReq: { skill: 'mining', level: 5 },
    actions: [],
    stations: ['warp'],
    npc: {
      id: 'cavern_guide',
      name: 'Cavern Guide',
      greeting: 'Each floor down holds rarer ore. Bring a better pickaxe.',
      buys: [
        { itemId: 'redstone', price: 1 },
        { itemId: 'diamond', price: 8 },
        { itemId: 'emerald', price: 6 },
        { itemId: 'mithril', price: 8 },
      ],
      sells: [{ itemId: 'diamond_pickaxe', price: 900 }],
    },
  },
  deep_gunpowder: {
    id: 'deep_gunpowder',
    islandId: 'deep_caverns',
    name: 'Gunpowder Mines',
    description: 'Floor I — endless cobblestone and coal.',
    icon: 'mine',
    links: ['deep_lobby'],
    actions: [
      mine('mine_cobble_deep', 'Mine Cobblestone (x3)', 'cobble', 4, 3, 1, 700, 'Crumbling cave walls.'),
      mine('mine_coal_deep', 'Mine Coal (x3)', 'coal', 12, 3, 1, 1000, 'Deep coal pockets.'),
      combat('fight_creeper', 'Fight Creeper', 'creeper', 14, 1, 1300, 'Explodes into gunpowder.'),
    ],
  },
  deep_lapis: {
    id: 'deep_lapis',
    islandId: 'deep_caverns',
    name: 'Lapis Quarry',
    description: 'Floor II — lapis walls and Lapis Zombies.',
    icon: 'lapis',
    links: ['deep_lobby'],
    actions: [
      mine('mine_lapis_deep', 'Mine Lapis (x4)', 'lapis', 22, 4, 2, 1100, 'Solid lapis walls.'),
      combat('fight_lapis_zombie', 'Fight Lapis Zombie', 'lapis_zombie', 12, 1, 1300, 'An armoured miner corpse.'),
    ],
  },
  deep_pigmen: {
    id: 'deep_pigmen',
    islandId: 'deep_caverns',
    name: "Pigmen's Den",
    description: 'Floor III — redstone glows in the dark.',
    icon: 'redstone',
    links: ['deep_lobby'],
    skillReq: { skill: 'mining', level: 7 },
    actions: [
      mine('mine_redstone', 'Mine Redstone (x5)', 'redstone', 24, 5, 3, 1150, 'Pulsing redstone ore.'),
      combat('fight_pigman', 'Fight Zombie Pigman', 'pigman', 16, 2, 1400, 'A gold-hungry denizen of Floor III.'),
    ],
  },
  deep_slimehill: {
    id: 'deep_slimehill',
    islandId: 'deep_caverns',
    name: 'Slimehill',
    description: 'Floor IV — emerald seams above the slime pits.',
    icon: 'emerald',
    links: ['deep_lobby'],
    skillReq: { skill: 'mining', level: 9 },
    actions: [
      mine('mine_emerald', 'Mine Emerald Ore', 'emerald', 28, 2, 3, 1250, 'Bright green emerald.'),
      combat('fight_slime', 'Fight Slime', 'slime', 14, 1, 1350, 'Bounces and drops slimeballs.'),
    ],
  },
  deep_diamond: {
    id: 'deep_diamond',
    islandId: 'deep_caverns',
    name: 'Diamond Reserve',
    description: 'Floor V — the famous diamond walls.',
    icon: 'diamond',
    links: ['deep_lobby'],
    skillReq: { skill: 'mining', level: 12 },
    actions: [mine('mine_diamond', 'Mine Diamond Ore (x2)', 'diamond', 35, 2, 3, 1400, 'Pure diamond ore.')],
  },
  deep_obsidian: {
    id: 'deep_obsidian',
    islandId: 'deep_caverns',
    name: 'Obsidian Sanctuary',
    description: 'Floor VI — black glass walls of pure obsidian.',
    icon: 'obsidian',
    links: ['deep_lobby'],
    skillReq: { skill: 'mining', level: 15 },
    actions: [mine('mine_obsidian_deep', 'Mine Obsidian', 'obsidian', 40, 1, 4, 1600, 'Dense black obsidian.')],
  },
  deep_mithril: {
    id: 'deep_mithril',
    islandId: 'deep_caverns',
    name: 'Obsidian Depths',
    description: 'Floor VII — more obsidian in the deepest shafts.',
    icon: 'obsidian',
    links: ['deep_lobby'],
    skillReq: { skill: 'mining', level: 18 },
    actions: [mine('mine_obsidian_deep_vii', 'Mine Obsidian', 'obsidian', 42, 1, 4, 1650, 'The deepest obsidian veins.')],
  },

  // ── Spider's Den ──────────────────────────────────────────────────────────
  spider_entrance: {
    id: 'spider_entrance',
    islandId: 'spider_den',
    name: 'Webbed Entrance',
    description: 'Spiders ahead — bring a sword.',
    icon: 'spider',
    links: ['spider_nest', 'spider_merchant', 'spider_top', 'spider_pier'],
    actions: [
      combat('fight_weaver', 'Fight Spider', 'spider', 8, 1, 1000, 'A quick spider that drops string.'),
      combat('fight_weaver_spider', 'Fight Weaver', 'weaver', 10, 1, 1100, 'Weaves extra string.'),
      mine('mine_gravel_spider', 'Mine Gravel', 'gravel', 6, 2, 1, 700, 'Loose gravel on the cliffs.'),
    ],
    stations: ['warp'],
  },
  spider_nest: {
    id: 'spider_nest',
    islandId: 'spider_den',
    name: 'Spider Nest',
    description: 'Webs choke the tunnels.',
    icon: 'web',
    links: ['spider_entrance'],
    actions: [
      combat('fight_crawler', 'Fight Dasher Spider', 'dasher_spider', 30, 2, 1400, 'A fast, armoured spider.'),
      combat('fight_crawler_spider', 'Fight Crawler', 'crawler', 12, 2, 1300, 'Drops string and flint.'),
    ],
  },
  spider_top: {
    id: 'spider_top',
    islandId: 'spider_den',
    name: 'Top of the Nest',
    description: 'The Tarantula Broodfather lairs above.',
    icon: 'spider',
    links: ['spider_entrance'],
    skillReq: { skill: 'combat', level: 8 },
    actions: [combat('fight_broodmother', 'Fight Dasher Swarm', 'dasher_spider', 34, 2, 1500, 'A swarm of dashers.')],
    stations: ['slayer'],
  },
  spider_merchant: {
    id: 'spider_merchant',
    islandId: 'spider_den',
    name: "Maddox's Den",
    description: 'Slayer supplies and drop buyback.',
    icon: 'villager',
    links: ['spider_entrance'],
    actions: [],
    stations: ['slayer'],
    npc: {
      id: 'maddox',
      name: 'Maddox the Slayer',
      greeting: 'Talk to me to start a Slayer quest. I also buy drops and sell starter blades.',
      buys: [
        { itemId: 'string', price: 3 },
        { itemId: 'spider_eye', price: 3 },
        { itemId: 'rotten_flesh', price: 2 },
      ],
      sells: [{ itemId: 'stone_sword', price: 35 }, { itemId: 'undead_sword', price: 400 }],
    },
  },
  spider_pier: {
    id: 'spider_pier',
    islandId: 'spider_den',
    name: "Spider's Pier",
    description: 'A rickety dock over dark water.',
    icon: 'fish',
    links: ['spider_entrance'],
    actions: [fish('fish_spider', 'Fish the Pier', 'raw_fish', 12, 'Night squid hunt these waters.')],
  },

  // ── The Park ──────────────────────────────────────────────────────────────
  park_trail: {
    id: 'park_trail',
    islandId: 'park',
    name: 'Forest Trail',
    description: 'Walk among ancient oaks.',
    icon: 'tree',
    links: ['park_lake', 'park_clearing', 'park_jungle', 'park_spruce', 'park_birch', 'park_acacia'],
    actions: [
      forage('chop_oak_park', 'Chop Oak (x2)', 'oak_log', 10, 2, 1, 'Mature park trees.'),
      forage('park_oak_sapling', 'Gather Oak Saplings', 'oak_sapling', 4, 1, 1, 'Oak saplings under the canopy.'),
    ],
    stations: ['warp'],
    npc: {
      id: 'park_ranger',
      name: 'Park Ranger',
      greeting: 'Rare woods grow deeper in the park.',
      buys: [{ itemId: 'oak_log', price: 2 }, { itemId: 'jungle_log', price: 2 }, { itemId: 'dark_oak_log', price: 2 }],
      sells: [{ itemId: 'jungle_axe', price: 650 }, { itemId: 'monkey_pet', price: 18000 }],
    },
  },
  park_jungle: {
    id: 'park_jungle',
    islandId: 'park',
    name: 'Jungle Grove',
    description: 'Jungle and dark oak trunks tower overhead.',
    icon: 'jungle',
    links: ['park_trail'],
    skillReq: { skill: 'foraging', level: 7 },
    actions: [
      forage('chop_jungle', 'Chop Jungle Log (x2)', 'jungle_log', 14, 2, 2, 'Thick jungle wood.'),
      forage('chop_dark_oak', 'Chop Dark Oak (x2)', 'dark_oak_log', 14, 2, 2, 'Dense dark oak.'),
      forage('park_jungle_sapling', 'Gather Jungle Saplings', 'jungle_sapling', 5, 1, 2, 'Jungle saplings in the undergrowth.'),
      forage('park_dark_oak_sapling', 'Gather Dark Oak Saplings', 'dark_oak_sapling', 5, 1, 2, 'Dark oak saplings among the roots.'),
    ],
  },
  park_spruce: {
    id: 'park_spruce',
    islandId: 'park',
    name: 'Spruce Woods',
    description: 'Cold spruce stands just past the trail.',
    icon: 'tree',
    links: ['park_trail'],
    skillReq: { skill: 'foraging', level: 5 },
    actions: [
      forage('chop_spruce', 'Chop Spruce Log', 'spruce_log', 12, 2, 1, 'Tall spruce trunks.'),
      forage('park_spruce_sapling', 'Gather Spruce Saplings', 'spruce_sapling', 4, 1, 1, 'Spruce saplings in the needles.'),
    ],
  },
  park_birch: {
    id: 'park_birch',
    islandId: 'park',
    name: 'Birch Park',
    description: 'Pale birch groves further along the path.',
    icon: 'tree',
    links: ['park_trail'],
    skillReq: { skill: 'foraging', level: 6 },
    actions: [
      forage('chop_birch', 'Chop Birch Log', 'birch_log', 12, 2, 1, 'Paper-white birch.'),
      forage('park_birch_sapling', 'Gather Birch Saplings', 'birch_sapling', 4, 1, 1, 'Birch saplings in the light.'),
    ],
  },
  park_acacia: {
    id: 'park_acacia',
    islandId: 'park',
    name: 'Savanna Ridge',
    description: 'Twisted acacia on the warm ridge.',
    icon: 'tree',
    links: ['park_trail'],
    skillReq: { skill: 'foraging', level: 8 },
    actions: [
      forage('chop_acacia', 'Chop Acacia Log', 'acacia_log', 14, 2, 2, 'Twisted acacia wood.'),
      forage('park_acacia_sapling', 'Gather Acacia Saplings', 'acacia_sapling', 5, 1, 2, 'Acacia saplings on the ridge.'),
    ],
  },
  park_lake: {
    id: 'park_lake',
    islandId: 'park',
    name: 'Mirror Lake',
    description: 'The best fishing spot on the island.',
    icon: 'fish',
    links: ['park_trail'],
    actions: [
      fish('fish_lake', 'Fish Lake', 'raw_fish', 14, '50% chance of a double catch.'),
      mine('mine_packed_ice', 'Mine Packed Ice', 'packed_ice', 8, 1, 2, 900, 'Thick ice at the lake edge.'),
      mine('mine_snowball', 'Gather Snowballs', 'snowball', 4, 2, 1, 500, 'Snow packed along the shore.'),
      mine('mine_ice_lake', 'Mine Ice', 'ice', 6, 2, 1, 700, 'Clear ice sheets.'),
    ],
  },
  park_clearing: {
    id: 'park_clearing',
    islandId: 'park',
    name: 'Mushroom Clearing',
    description: 'Zombies wander in from the treeline.',
    icon: 'mushroom',
    links: ['park_trail'],
    actions: [
      combat('fight_husk_park', 'Fight Zombie', 'zombie', 10, 1, 1300, 'Forest zombies drop flesh.'),
      combat('fight_wolf_park', 'Fight Wolf', 'wolf', 15, 1, 1400, 'Pack wolves hunt the clearing. Needed for Sven Slayer.'),
    ],
  },

  // ── Mushroom Desert ───────────────────────────────────────────────────────
  desert_oasis: {
    id: 'desert_oasis',
    islandId: 'mushroom_desert',
    name: 'Desert Oasis',
    description: 'Cactus, sugar cane and cocoa grow by the water.',
    icon: 'desert',
    links: ['desert_mushrooms', 'desert_merchant'],
    actions: [
      farm('farm_cactus', 'Harvest Cactus', 'cactus', 6, 2, 'A hardy desert crop.'),
      farm('farm_cane', 'Harvest Sugar Cane', 'sugar_cane', 6, 3, 'Sweet riverside cane.'),
      farm('farm_cocoa', 'Harvest Cocoa', 'cocoa_beans', 6, 2, 'Cocoa from oasis trees.'),
      mine('mine_sand', 'Mine Sand', 'sand', 4, 2, 1, 500, 'Loose desert sand.'),
      mine('mine_red_sand', 'Mine Red Sand', 'red_sand', 5, 2, 1, 550, 'Red sandstone dunes.'),
    ],
    stations: ['warp'],
  },
  desert_mushrooms: {
    id: 'desert_mushrooms',
    islandId: 'mushroom_desert',
    name: 'Mushroom Gorge',
    description: 'Giant mushrooms cover the cliffs.',
    icon: 'mushroom',
    links: ['desert_oasis'],
    actions: [
      farm('farm_mushroom', 'Gather Mushrooms', 'mushroom', 8, 2, 'Pick clusters of mushrooms.'),
      farm('farm_red_mushroom', 'Gather Red Mushrooms', 'red_mushroom', 8, 2, 'Red mushroom caps.'),
      farm('farm_brown_mushroom', 'Gather Brown Mushrooms', 'brown_mushroom', 8, 2, 'Brown mushroom caps.'),
      mine('mine_mycelium', 'Mine Mycelium', 'mycelium', 8, 1, 1, 800, 'Purple mycelium under the gorge.'),
    ],
  },
  desert_merchant: {
    id: 'desert_merchant',
    islandId: 'mushroom_desert',
    name: 'Trapper Camp',
    description: 'A trapper buys desert goods.',
    icon: 'villager',
    links: ['desert_oasis'],
    actions: [],
    npc: {
      id: 'trapper',
      name: 'Trapper',
      greeting: 'Desert harvests fetch a fair price here.',
      buys: [
        { itemId: 'cactus', price: 4 },
        { itemId: 'sugar_cane', price: 4 },
        { itemId: 'cocoa_beans', price: 3 },
        { itemId: 'mushroom', price: 10 },
      ],
      sells: [{ itemId: 'speed_talisman', price: 1500 }],
    },
  },

  // ── The End ───────────────────────────────────────────────────────────────
  end_entrance: {
    id: 'end_entrance',
    islandId: 'the_end',
    name: 'The End',
    description: 'Endermen stalk the obsidian platforms.',
    icon: 'end',
    links: ['end_nest'],
    skillReq: { skill: 'combat', level: 12 },
    actions: [
      combat('fight_enderman', 'Fight Enderman', 'enderman', 40, 2, 1200, 'A teleporting horror.'),
      mine('mine_end_stone', 'Mine End Stone', 'end_stone', 18, 2, 3, 1100, 'Pale end stone platforms.'),
    ],
    stations: ['warp', 'slayer'],
  },
  end_nest: {
    id: 'end_nest',
    islandId: 'the_end',
    name: 'Dragon Nest',
    description: 'Zealots guard the altar beneath the dragon.',
    icon: 'dragon',
    links: ['end_entrance'],
    skillReq: { skill: 'combat', level: 15 },
    actions: [
      combat('fight_zealot', 'Fight Zealot', 'zealot', 60, 2, 1500, 'A powerful Enderman with rare drops.'),
      mine('mine_obsidian_end', 'Mine Obsidian', 'obsidian', 40, 1, 4, 1600, 'Obsidian pillars around the nest.'),
    ],
    stations: ['dragons'],
  },

  // ── Crimson Isle ──────────────────────────────────────────────────────────
  crimson_spawn: {
    id: 'crimson_spawn',
    islandId: 'crimson_isle',
    name: 'Crimson Isle',
    description: 'The Blazing Volcano dominates the horizon.',
    icon: 'volcano',
    links: ['crimson_volcano', 'crimson_wastes'],
    skillReq: { skill: 'combat', level: 24 },
    actions: [
      combat('fight_magma_cube', 'Fight Magma Cube', 'magma_cube', 85, 3, 1700, 'A high-level volcanic monster.'),
      combat('fight_ghast', 'Fight Ghast', 'ghast', 90, 3, 1800, 'A floating horror that drops tears.'),
      farm('farm_nether_wart_crimson', 'Harvest Nether Wart', 'nether_wart', 10, 2, 'Crimson nether wart patches.'),
      forage('chop_crimson_stem', 'Chop Crimson Stem', 'crimson_stem', 16, 2, 3, 'Twisted crimson wood.'),
      forage('chop_warped_stem', 'Chop Warped Stem', 'warped_stem', 16, 2, 3, 'Warped fungus wood.'),
    ],
    stations: ['warp'],
  },
  crimson_volcano: {
    id: 'crimson_volcano',
    islandId: 'crimson_isle',
    name: 'Blazing Volcano',
    description: 'Home of the Inferno Demonlord.',
    icon: 'lava',
    links: ['crimson_spawn'],
    actions: [],
    stations: ['slayer', 'kuudra'],
  },
  crimson_wastes: {
    id: 'crimson_wastes',
    islandId: 'crimson_isle',
    name: 'Nether Wastes',
    description: 'Netherrack, quartz, glowstone and sulphur.',
    icon: 'lava',
    links: ['crimson_spawn'],
    actions: [
      mine('mine_netherrack', 'Mine Netherrack', 'netherrack', 8, 3, 2, 700, 'Soft nether stone.'),
      mine('mine_quartz', 'Mine Nether Quartz', 'quartz', 18, 2, 3, 1100, 'White quartz clusters.'),
      mine('mine_glowstone', 'Mine Glowstone', 'glowstone_dust', 16, 3, 2, 1000, 'Glowing dust from the ceiling.'),
      mine('mine_sulphur', 'Mine Sulphur', 'sulphur', 20, 2, 3, 1200, 'Pungent yellow sulphur.'),
      mine('mine_soul_sand', 'Mine Soul Sand', 'soul_sand', 10, 2, 2, 850, 'Souls trapped in the sand.'),
      fish('fish_crimson', 'Fish Magma', 'raw_fish', 20, 'Magma sea creatures boil below.'),
    ],
  },

  // ── Dungeon Hub ───────────────────────────────────────────────────────────
  dungeon_hub: {
    id: 'dungeon_hub',
    islandId: 'dungeon_hub',
    name: 'Dungeon Hub',
    description: 'Pick a class, then step into the Catacombs entrance.',
    icon: 'skull',
    links: ['catacombs_entrance'],
    skillReq: { skill: 'combat', level: 12 },
    actions: [],
    stations: ['warp', 'dungeon'],
    npc: {
      id: 'mort',
      name: 'Mort',
      greeting: 'Choose a class at the portal, then enter the Catacombs.',
      buys: [],
      sells: [
        { itemId: 'bread', price: 10 },
        { itemId: 'dungeon_chest_key', price: 250 },
        { itemId: 'hot_potato_book', price: 500 },
      ],
    },
  },
  catacombs_entrance: {
    id: 'catacombs_entrance',
    islandId: 'dungeon_hub',
    name: 'Catacombs Entrance',
    description: 'Talk to Mort or use the portal to enter the Catacombs.',
    icon: 'catacombs',
    links: ['dungeon_hub'],
    skillReq: { skill: 'combat', level: 12 },
    actions: [],
    stations: ['dungeon'],
  },
  garden_barn: {
    id: 'garden_barn',
    islandId: 'garden',
    name: 'Garden Barn',
    description: 'Jacob runs contests here. Visitors stop by for crops.',
    icon: 'farm',
    links: ['garden_plots'],
    actions: [],
    stations: ['warp', 'garden'],
    skillReq: { skill: 'farming', level: 5 },
    npc: {
      id: 'anita',
      name: 'Anita',
      greeting: 'Jacob sent me with contest rewards. I also hatch farming pets.',
      buys: [],
      sells: [{ itemId: 'elephant_pet_egg', price: 20000 }, { itemId: 'elephant_pet', price: 25000 }],
    },
  },
  garden_plots: {
    id: 'garden_plots',
    islandId: 'garden',
    name: 'Garden Plots',
    description: 'Plant, water and harvest on the 24-plot grid. Open the Garden desk or press E on this station.',
    icon: 'farm',
    links: ['garden_barn'],
    actions: [],
    stations: ['garden'],
  },

  dwarven_village: {
    id: 'dwarven_village',
    islandId: 'dwarven_mines',
    name: 'Dwarven Village',
    description: 'Commissions and the Heart of the Mountain.',
    icon: 'cavern',
    links: ['dwarven_mithril', 'dwarven_titanium', 'dwarven_glacite'],
    actions: [
      mine('mine_cobble_dw', 'Mine Cobblestone', 'cobble', 6, 2, 1, 700, 'Gray dwarven cobble around the village.'),
    ],
    stations: ['warp', 'hotm'],
    skillReq: { skill: 'mining', level: 12 },
    npc: {
      id: 'hotm_emissary',
      name: 'Emissary',
      greeting: 'The Heart of the Mountain beats for those who mine.',
      buys: [{ itemId: 'mithril', price: 8 }, { itemId: 'titanium', price: 20 }],
      sells: [
        { itemId: 'heart_of_the_mountain', price: 5000 },
        { itemId: 'mining_xp_boost', price: 2500 },
      ],
    },
  },
  dwarven_mithril: {
    id: 'dwarven_mithril',
    islandId: 'dwarven_mines',
    name: 'Mithril Deposits',
    description: 'Blue-green mithril veins line the cavern.',
    icon: 'mithril',
    links: ['dwarven_village'],
    actions: [
      mine('mine_cobble_mithril', 'Mine Cobblestone', 'cobble', 8, 3, 1, 720, 'Loose cobble in the mithril caves.'),
      mine('mine_mithril_dw', 'Mine Mithril', 'mithril', 12, 2, 3, 900, 'Commission mithril.'),
      mine('mine_hard_stone', 'Mine Hard Stone', 'hard_stone', 8, 3, 3, 800, 'Dense dwarven stone.'),
      mine('mine_tungsten', 'Mine Tungsten', 'tungsten', 16, 1, 4, 1100, 'Heavy tungsten ore.'),
      mine('mine_starfall', 'Mine Starfall', 'starfall', 18, 1, 4, 1200, 'Fallen star fragments.'),
    ],
  },
  dwarven_titanium: {
    id: 'dwarven_titanium',
    islandId: 'dwarven_mines',
    name: 'Titanium Hollows',
    description: 'Rare titanium shines in the deep dark.',
    icon: 'mithril',
    links: ['dwarven_village'],
    skillReq: { skill: 'mining', level: 15 },
    actions: [mine('mine_titanium_dw', 'Mine Titanium', 'titanium', 20, 1, 4, 1200, 'Commission titanium.')],
  },
  dwarven_glacite: {
    id: 'dwarven_glacite',
    islandId: 'dwarven_mines',
    name: 'Glacite Tunnels',
    description: 'Frozen caverns of glacite.',
    icon: 'cavern',
    links: ['dwarven_village'],
    skillReq: { skill: 'mining', level: 14 },
    actions: [
      mine('mine_cobble_glacite', 'Mine Cobblestone', 'cobble', 6, 2, 1, 700, 'Broken cobble in the ice tunnels.'),
      mine('mine_glacite', 'Mine Glacite', 'glacite', 16, 2, 3, 1000, 'Blue glacite veins.'),
    ],
  },

  crystal_camp: {
    id: 'crystal_camp',
    islandId: 'crystal_hollows',
    name: 'Crystal Nucleus',
    description: 'The heart of the Hollows. Gemstone districts sprawl outward.',
    icon: 'cavern',
    links: ['crystal_jungle', 'crystal_goblin', 'crystal_precursor', 'crystal_divan'],
    actions: [mine('mine_ruby_ch', 'Mine Ruby Gemstone', 'gemstone_ruby', 22, 2, 4, 1200, 'Ruby crystals around the nucleus.')],
    stations: ['warp'],
    skillReq: { skill: 'mining', level: 12 },
    npc: {
      id: 'archaeologist',
      name: 'Archaeologist',
      greeting: 'Dig carefully. The Hollows hide more than gemstones.',
      buys: [{ itemId: 'gemstone_ruby', price: 12 }, { itemId: 'treasure', price: 40 }],
      sells: [{ itemId: 'omni_egg', price: 15000 }],
    },
  },
  crystal_jungle: {
    id: 'crystal_jungle',
    islandId: 'crystal_hollows',
    name: 'Jungle Temple',
    description: 'Jade and amethyst in overgrown ruins.',
    icon: 'jungle',
    links: ['crystal_camp'],
    actions: [
      mine('mine_jade_ch', 'Mine Jade Gemstone', 'gemstone_jade', 22, 2, 4, 1200, 'Green jade in the temple.'),
      mine('mine_amethyst_ch', 'Mine Amethyst', 'gemstone_amethyst', 22, 2, 4, 1200, 'Purple amethyst clusters.'),
    ],
  },
  crystal_goblin: {
    id: 'crystal_goblin',
    islandId: 'crystal_hollows',
    name: 'Goblin Holdout',
    description: 'Amber, onyx and goblin treasure.',
    icon: 'cavern',
    links: ['crystal_camp'],
    actions: [
      mine('mine_amber_ch', 'Mine Amber', 'gemstone_amber', 22, 2, 4, 1200, 'Warm amber deposits.'),
      mine('mine_onyx_ch', 'Mine Onyx', 'onyx', 20, 2, 4, 1150, 'Black onyx in the holdout.'),
      mine('mine_treasure_ch', 'Salvage Treasure', 'treasure', 24, 1, 4, 1400, 'Goblin caches.'),
    ],
  },
  crystal_precursor: {
    id: 'crystal_precursor',
    islandId: 'crystal_hollows',
    name: 'Precursor Remnants',
    description: 'Sapphire, aquamarine and volta among ancient metal.',
    icon: 'cavern',
    links: ['crystal_camp'],
    actions: [
      mine('mine_sapphire_ch', 'Mine Sapphire', 'gemstone_sapphire', 22, 2, 4, 1200, 'Blue sapphire crystals.'),
      mine('mine_aquamarine_ch', 'Mine Aquamarine', 'aquamarine', 20, 2, 4, 1150, 'Sea-coloured gems.'),
      mine('mine_volta_ch', 'Mine Volta', 'volta', 24, 1, 4, 1300, 'Crackling volta ore.'),
    ],
  },
  crystal_divan: {
    id: 'crystal_divan',
    islandId: 'crystal_hollows',
    name: 'Mines of Divan',
    description: 'Topaz, jasper, citrine and peridot in the deepest mines.',
    icon: 'mithril',
    links: ['crystal_camp'],
    skillReq: { skill: 'mining', level: 15 },
    actions: [
      mine('mine_topaz_ch', 'Mine Topaz', 'gemstone_topaz', 24, 2, 4, 1250, 'Golden topaz veins.'),
      mine('mine_jasper_ch', 'Mine Jasper', 'gemstone_jasper', 24, 2, 4, 1250, 'Red jasper in the walls.'),
      mine('mine_citrine_ch', 'Mine Citrine', 'citrine', 22, 2, 4, 1200, 'Yellow citrine crystals.'),
      mine('mine_peridot_ch', 'Mine Peridot', 'peridot', 22, 2, 4, 1200, 'Green peridot pockets.'),
    ],
  },

  rift_plaza: {
    id: 'rift_plaza',
    islandId: 'rift',
    name: 'Rift Plaza',
    description: 'Time skips. Motes drift in the air.',
    icon: 'end',
    links: ['rift_lagoon'],
    actions: [combat('fight_rift_mite', 'Fight Rift Mite', 'rift_mite', 25, 2, 1400, 'A glitching pest.')],
    stations: ['warp'],
    skillReq: { skill: 'combat', level: 18 },
  },
  rift_lagoon: {
    id: 'rift_lagoon',
    islandId: 'rift',
    name: 'Lagoon of Time',
    description: 'Fish that should not exist.',
    icon: 'fish',
    links: ['rift_plaza'],
    actions: [fish('fish_rift', 'Fish Motes', 'raw_fish', 16, 'Something bites that is not a fish.')],
  },

  /** Virtual zone while inside an active dungeon run (in-world rooms). */
  dungeon_room: {
    id: 'dungeon_room',
    islandId: 'dungeon_hub',
    name: 'The Catacombs',
    description: 'Clear starred mobs, then open the Wither Door.',
    icon: 'catacombs',
    links: [],
    actions: [],
  },
};

export const DEFAULT_ZONE = 'hub_plaza';

/** Instanced zones — not painted onto procedural island maps. */
export const VIRTUAL_ZONES = new Set(['dungeon_room']);

/** Combat level needed before the Dungeon Hub warp and the Catacombs unlock. */
export const DUNGEON_COMBAT_REQUIREMENT = 12;

export function zone(id: string): ZoneDef {
  const z = ZONES[id];
  if (!z) throw new Error(`Unknown zone: ${id}`);
  return z;
}

export function islandForZone(zoneId: string): IslandId {
  return zone(zoneId).islandId;
}

export function zonesOnIsland(islandId: IslandId): ZoneDef[] {
  return Object.values(ZONES).filter((z) => z.islandId === islandId);
}

export function warpableIslands(): IslandDef[] {
  return Object.values(ISLANDS).filter((i) => i.id === 'hub' || i.warpFromHub);
}

export function findAction(zoneId: string, actionId: string): ZoneAction | null {
  return zone(zoneId).actions.find((a) => a.id === actionId) ?? null;
}

export function findActionOnIsland(islandId: IslandId, actionId: string): { zone: ZoneDef; action: ZoneAction } | null {
  for (const z of zonesOnIsland(islandId)) {
    const action = z.actions.find((a) => a.id === actionId);
    if (action) return { zone: z, action };
  }
  return null;
}
