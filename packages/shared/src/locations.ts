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
  | 'dungeon_hub';

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
  | 'pets';

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
    name: 'Sky Hub',
    description: 'The central village: shops, bank, auctions and the warp gate.',
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
    description: 'Starter mining island with coal, iron, gold and lapis.',
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
    links: ['hub_bazaar', 'hub_auction', 'hub_bank', 'hub_blacksmith', 'hub_library', 'hub_warps'],
    actions: [],
    npc: {
      id: 'adventurer',
      name: 'Adventurer',
      greeting: 'Welcome to the Hub! Basic gear, food, and starter talismans for your Accessory Bag.',
      buys: [{ itemId: 'rotten_flesh', price: 2 }, { itemId: 'bone', price: 2 }],
      sells: [
        { itemId: 'wooden_sword', price: 10 },
        { itemId: 'bread', price: 8 },
        { itemId: 'speed_talisman', price: 500 },
        { itemId: 'vaccine_talisman', price: 750 },
        { itemId: 'intimidation_talisman', price: 800 },
        { itemId: 'zombie_talisman', price: 600 },
        { itemId: 'feather_talisman', price: 2500 },
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
      buys: [{ itemId: 'iron_ingot', price: 8 }],
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
      sells: [{ itemId: 'lapis', price: 12 }],
    },
  },
  hub_warps: {
    id: 'hub_warps',
    islandId: 'hub',
    name: 'Warp Gate',
    description: 'The only way to cross between islands.',
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
      name: 'Farmhand',
      greeting: 'I buy crops and sell hoes.',
      buys: [{ itemId: 'wheat', price: 2 }, { itemId: 'carrot', price: 1.5 }],
      sells: [{ itemId: 'wooden_hoe', price: 8 }, { itemId: 'rookie_hoe', price: 250 }],
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
    ],
  },
  hub_forest: {
    id: 'hub_forest',
    islandId: 'hub',
    name: 'Forest',
    description: 'Oak and birch woods behind the village.',
    icon: 'tree',
    links: ['hub_plaza'],
    actions: [forage('hub_chop_oak', 'Chop Oak', 'oak_log', 6, 1, 1, 'Fresh oak timber.')],
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
    actions: [fish('hub_fish', 'Cast Line', 'raw_fish', 10, 'Calm harbour water.')],
    npc: {
      id: 'fish_merchant',
      name: 'Fish Merchant',
      greeting: 'Rods and bait, fresh catch bought daily.',
      buys: [{ itemId: 'raw_fish', price: 3 }],
      sells: [{ itemId: 'fishing_rod', price: 30 }, { itemId: 'cooked_fish', price: 12 }],
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

  // ── Private Island ────────────────────────────────────────────────────────
  island_home: {
    id: 'island_home',
    islandId: 'private_island',
    name: 'Island Spawn',
    description: 'Your home base with a crafting table.',
    icon: 'island',
    links: ['island_mine', 'island_farm', 'island_grove', 'island_pond', 'island_minions'],
    actions: [],
    stations: ['craft', 'warp'],
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
    links: ['barn_merchant', 'barn_garden'],
    actions: [
      farm('farm_wheat', 'Harvest Wheat (x2)', 'wheat', 8, 2, 'Rich barn soil yields extra.'),
      farm('farm_potato', 'Harvest Potatoes', 'potato', 6, 2, 'Dig up potatoes.'),
      farm('farm_carrot', 'Harvest Carrots', 'carrot', 6, 2, 'Pull up carrots.'),
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
        { itemId: 'wheat', price: 2.5 },
        { itemId: 'potato', price: 1.5 },
        { itemId: 'carrot', price: 1.5 },
        { itemId: 'melon', price: 2 },
        { itemId: 'pumpkin', price: 4 },
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
        { itemId: 'cobble', price: 1.2 },
        { itemId: 'coal', price: 4.5 },
        { itemId: 'iron_ore', price: 9 },
        { itemId: 'gold_ingot', price: 12 },
        { itemId: 'lapis', price: 6 },
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
        { itemId: 'redstone', price: 2 },
        { itemId: 'diamond', price: 16 },
        { itemId: 'emerald', price: 12 },
        { itemId: 'mithril', price: 20 },
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
    actions: [mine('mine_redstone', 'Mine Redstone (x5)', 'redstone', 24, 5, 3, 1150, 'Pulsing redstone ore.')],
  },
  deep_slimehill: {
    id: 'deep_slimehill',
    islandId: 'deep_caverns',
    name: 'Slimehill',
    description: 'Floor IV — emerald seams above the slime pits.',
    icon: 'emerald',
    links: ['deep_lobby'],
    skillReq: { skill: 'mining', level: 9 },
    actions: [mine('mine_emerald', 'Mine Emerald Ore', 'emerald', 28, 2, 3, 1250, 'Bright green emerald.')],
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
    description: 'Floor VI — black glass and ruby gemstones.',
    icon: 'obsidian',
    links: ['deep_lobby'],
    skillReq: { skill: 'mining', level: 15 },
    actions: [mine('mine_ruby', 'Mine Ruby Gemstone', 'gemstone_ruby', 40, 2, 4, 1500, 'Gemstone crystals in obsidian.')],
  },
  deep_mithril: {
    id: 'deep_mithril',
    islandId: 'deep_caverns',
    name: 'Mithril Deposits',
    description: 'Floor VII — mithril and jade for master miners.',
    icon: 'mithril',
    links: ['deep_lobby'],
    skillReq: { skill: 'mining', level: 18 },
    actions: [
      mine('mine_mithril', 'Mine Mithril', 'mithril', 45, 2, 4, 1550, 'Shimmering blue mithril.'),
      mine('mine_jade', 'Mine Jade Gemstone', 'gemstone_jade', 42, 2, 4, 1500, 'Green gemstone crystals.'),
    ],
  },

  // ── Spider's Den ──────────────────────────────────────────────────────────
  spider_entrance: {
    id: 'spider_entrance',
    islandId: 'spider_den',
    name: 'Webbed Entrance',
    description: 'Spiders ahead — bring a sword.',
    icon: 'spider',
    links: ['spider_nest', 'spider_merchant', 'spider_top'],
    actions: [combat('fight_weaver', 'Fight Spider', 'spider', 8, 1, 1000, 'A quick spider that drops string.')],
    stations: ['warp'],
  },
  spider_nest: {
    id: 'spider_nest',
    islandId: 'spider_den',
    name: 'Spider Nest',
    description: 'Webs choke the tunnels.',
    icon: 'web',
    links: ['spider_entrance'],
    actions: [combat('fight_crawler', 'Fight Dasher Spider', 'dasher_spider', 30, 2, 1400, 'A fast, armoured spider.')],
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
    name: 'Combat Vendor',
    description: 'Buys mob drops, sells weapons.',
    icon: 'villager',
    links: ['spider_entrance'],
    actions: [],
    npc: {
      id: 'combat_vendor',
      name: 'Combat Vendor',
      greeting: 'Slayer supplies and drop buyback.',
      buys: [
        { itemId: 'string', price: 3.5 },
        { itemId: 'spider_eye', price: 3 },
        { itemId: 'rotten_flesh', price: 2.5 },
      ],
      sells: [{ itemId: 'stone_sword', price: 35 }, { itemId: 'undead_sword', price: 400 }],
    },
  },

  // ── The Park ──────────────────────────────────────────────────────────────
  park_trail: {
    id: 'park_trail',
    islandId: 'park',
    name: 'Forest Trail',
    description: 'Walk among ancient oaks.',
    icon: 'tree',
    links: ['park_lake', 'park_clearing', 'park_jungle'],
    actions: [forage('chop_oak_park', 'Chop Oak (x2)', 'oak_log', 10, 2, 1, 'Mature park trees.')],
    stations: ['warp'],
    npc: {
      id: 'park_ranger',
      name: 'Park Ranger',
      greeting: 'Rare woods grow deeper in the park.',
      buys: [{ itemId: 'oak_log', price: 2.2 }, { itemId: 'jungle_log', price: 3 }, { itemId: 'dark_oak_log', price: 3 }],
      sells: [{ itemId: 'jungle_axe', price: 650 }],
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
    ],
  },
  park_lake: {
    id: 'park_lake',
    islandId: 'park',
    name: 'Mirror Lake',
    description: 'The best fishing spot on the island.',
    icon: 'fish',
    links: ['park_trail'],
    actions: [fish('fish_lake', 'Fish Lake', 'raw_fish', 14, '50% chance of a double catch.')],
  },
  park_clearing: {
    id: 'park_clearing',
    islandId: 'park',
    name: 'Mushroom Clearing',
    description: 'Zombies wander in from the treeline.',
    icon: 'mushroom',
    links: ['park_trail'],
    actions: [combat('fight_husk_park', 'Fight Zombie', 'zombie', 10, 1, 1300, 'Forest zombies drop flesh.')],
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
    actions: [farm('farm_mushroom', 'Gather Mushrooms', 'mushroom', 8, 2, 'Pick clusters of mushrooms.')],
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
        { itemId: 'cactus', price: 3 },
        { itemId: 'sugar_cane', price: 2 },
        { itemId: 'cocoa_beans', price: 3 },
        { itemId: 'mushroom', price: 4 },
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
    actions: [combat('fight_enderman', 'Fight Enderman', 'enderman', 40, 2, 1200, 'A teleporting horror.')],
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
    actions: [combat('fight_zealot', 'Fight Zealot', 'zealot', 60, 2, 1500, 'A powerful Enderman with rare drops.')],
  },

  // ── Crimson Isle ──────────────────────────────────────────────────────────
  crimson_spawn: {
    id: 'crimson_spawn',
    islandId: 'crimson_isle',
    name: 'Crimson Isle',
    description: 'The Blazing Volcano dominates the horizon.',
    icon: 'volcano',
    links: ['crimson_volcano'],
    skillReq: { skill: 'combat', level: 24 },
    actions: [combat('fight_magma_cube', 'Fight Magma Cube', 'magma_cube', 85, 3, 1700, 'A high-level volcanic monster.')],
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
    stations: ['slayer'],
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
      sells: [{ itemId: 'bread', price: 10 }],
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
