import type { ItemId } from './items.js';
import type { Inventory, ItemStack } from './inventory.js';
import type { SkillsState } from './skills.js';
import type { CollectionsState } from './collections.js';
import type { PlacedMinion } from './minions.js';
import type { IslandId } from './locations.js';
import type { LoreLine } from './lore.js';
import type { StatBlock } from './stats.js';
import type { Facing } from './world.js';
import type { GatherChannel, WorldMobInstance } from './worldCombat.js';
import type { QuestBookState } from './quests.js';
import type {
  GardenState,
  HotmState,
  DragonFightState,
  KuudraFightState,
  BestiaryState,
  MuseumState,
  WardrobeState,
} from './midgame.js';
import type { BazaarMeta } from './economy.js';

export type EquipmentSlot = 'helmet' | 'chestplate' | 'leggings' | 'boots';
export type DungeonClass = 'berserk' | 'archer' | 'mage' | 'tank' | 'healer';

export interface BankState {
  balance: number;
  tier: 'starter' | 'gold' | 'deluxe';
  lastInterestAt: number;
}

export interface PetState {
  itemId: ItemId;
  level: number;
  xp: number;
  active: boolean;
  heldItem?: ItemId;
}

export interface SlayerQuestState {
  slayerId: string;
  tier: number;
  progressXp: number;
  requiredXp: number;
  bossHp?: number;
  bossId?: string;
}

export type DungeonPhase = 'starter' | 'rooms' | 'boss';

export interface DungeonRunState {
  floorId: string;
  dungeonClass: DungeonClass;
  /** starter = Mort's room, rooms = combat, boss = floor boss */
  phase: DungeonPhase;
  room: number;
  rooms: number;
  score: number;
  bossHp?: number;
  /** Per-mob HP in the current combat room (entity id → HP). */
  mobHp?: Record<string, number>;
  /** All mobs in the current room are defeated — door unlocks. */
  roomCleared?: boolean;
  secretsFound?: number;
  secretClaimed?: boolean;
  partyId?: string;
}

export interface PlayerPublic {
  id: string;
  username: string;
  zoneId: string;
  islandId: IslandId;
  hp: number;
  maxHp: number;
  stats: StatBlock;
  x: number;
  y: number;
  facing: Facing;
}

export interface PlayerState extends PlayerPublic {
  coins: number;
  inventory: Inventory;
  hotbarSlot: number;
  skills: SkillsState;
  collections: CollectionsState;
  minions: PlacedMinion[];
  bank: BankState;
  equipment: Record<EquipmentSlot, ItemStack | null>;
  accessories: ItemStack[];
  pets: PetState[];
  fairySouls: number;
  /** Current mana — regens up to maxMana (Intelligence). */
  mana: number;
  maxMana: number;
  accessoryBagSlots: number;
  magicalPower: number;
  activeSlayer: SlayerQuestState | null;
  slayerXp: Record<string, number>;
  /** RNG meter progress toward guaranteed slayer drops (0–100). */
  slayerRngMeter: Record<string, number>;
  /** Dungeon essence for star upgrades. */
  essence: Partial<Record<import('./gardenPlots.js').EssenceType, number>>;
  /** Recipe ids unlocked via collection milestones. */
  unlockedRecipes: string[];
  dungeonRun: DungeonRunState | null;
  selectedDungeonClass: DungeonClass;
  visitedZones: string[];
  quests: QuestBookState;
  garden: GardenState;
  hotm: HotmState;
  bestiary: BestiaryState;
  museum: MuseumState;
  wardrobe: WardrobeState;
  dragonFight: DragonFightState | null;
  kuudraFight: KuudraFightState | null;
  /** 10 double-chest backpacks (54 slots each). Always unlocked. */
  backpacks: Inventory[];
  dungeonPartyId?: string | null;
  /** Transient live world mobs — not persisted. */
  worldMobs?: WorldMobInstance[];
  /** Transient gathering channel — not persisted. */
  gatherChannel?: GatherChannel | null;
  /** Transient — only set while inventory menu is open (not persisted). */
  inventoryCursor?: ItemStack | null;
}

export type MenuId =
  | 'skyblock'
  | 'location'
  | 'fast_travel'
  | 'inventory'
  | 'profile'
  | 'skills'
  | 'collections'
  | 'crafting'
  | 'bazaar'
  | 'bazaar_item'
  | 'bazaar_orders'
  | 'auction'
  | 'bank'
  | 'npc_shop'
  | 'minions'
  | 'pets'
  | 'slayers'
  | 'dungeons'
  | 'accessories'
  | 'enchanting'
  | 'reforge'
  | 'leaderboard'
  | 'quests'
  | 'garden'
  | 'hotm'
  | 'alchemy'
  | 'bestiary'
  | 'mayor'
  | 'museum'
  | 'wardrobe'
  | 'kuudra'
  | 'dragons'
  | 'backpack'
  | 'backpack_page';

export interface MenuSlotView {
  slot: number;
  itemId?: ItemId;
  icon: string;
  count?: number;
  name: string;
  rarity?: string;
  lore: LoreLine[];
  glint?: boolean;
  disabled?: boolean;
  action?: string;
}

export interface MenuView {
  id: MenuId;
  title: string;
  rows: number;
  slots: MenuSlotView[];
  parent?: MenuId;
  context?: Record<string, string | number | boolean>;
}

export type OrderSide = 'buy' | 'sell';

export interface BazaarOrder {
  id: string;
  playerId: string;
  username: string;
  itemId: ItemId;
  side: OrderSide;
  price: number;
  qty: number;
  filled: number;
  createdAt: number;
}

export interface OrderBookLevel {
  price: number;
  qty: number;
  orders: number;
}

export interface OrderBookSnapshot {
  itemId: ItemId;
  buys: OrderBookLevel[];
  sells: OrderBookLevel[];
  bestBid: number | null;
  bestAsk: number | null;
}

export interface ChatMessage {
  id: string;
  username: string;
  text: string;
  at: number;
}

/** Client -> Server */
export type ClientEvent =
  | { type: 'openMenu'; menu: MenuId; context?: Record<string, string | number | boolean> }
  | { type: 'closeMenu' }
  | { type: 'menuClick'; menu: MenuId; slot: number; button: 'left' | 'right' | 'shift_left' | 'shift_right'; action?: string }
  | { type: 'move'; x: number; y: number; facing: Facing }
  | { type: 'interact' }
  | { type: 'useAbility' }
  | { type: 'travel'; zoneId: string }
  | { type: 'warpIsland'; islandId: IslandId }
  | { type: 'doAction'; actionId: string; times?: number }
  | { type: 'setHotbar'; slot: number }
  | { type: 'useItem'; slot?: number }
  | { type: 'craft'; recipeId: string }
  | { type: 'placeMinion'; minionType: string }
  | { type: 'collectMinion'; minionId: string }
  | { type: 'upgradeMinion'; minionId: string }
  | { type: 'pickupMinion'; minionId: string }
  | { type: 'npcBuy'; itemId: ItemId; qty: number }
  | { type: 'npcSell'; itemId: ItemId; qty: number }
  | { type: 'bazaarBuyOrder'; itemId: ItemId; price: number; qty: number }
  | { type: 'bazaarSellOrder'; itemId: ItemId; price: number; qty: number }
  | { type: 'bazaarInstantBuy'; itemId: ItemId; qty: number; maxPrice?: number }
  | { type: 'bazaarInstantSell'; itemId: ItemId; qty: number; minPrice?: number }
  | { type: 'bazaarCancel'; orderId: string }
  | { type: 'bazaarSubscribe'; itemId: ItemId | null }
  | { type: 'chat'; text: string }
  | { type: 'pay'; targetUsername: string; amount: number }
  | { type: 'visitIsland'; username: string }
  | { type: 'tradeRequest'; targetUsername: string }
  | { type: 'tradeOffer'; coins: number; slot: number; itemSlot: number | null }
  | { type: 'tradeConfirm' }
  | { type: 'tradeCancel' }
  | { type: 'gardenPlant'; plotIndex: number; crop: ItemId }
  | { type: 'gardenHarvest'; plotIndex: number }
  | { type: 'gardenWater'; plotIndex: number }
  | { type: 'gardenCompost'; crop: ItemId; qty: number }
  | { type: 'upgradeStars'; inventorySlot: number }
  | { type: 'swapSlots'; a: number; b: number };

/** Server -> Client */
export type ServerEvent =
  | { type: 'welcome'; player: PlayerState; token: string }
  | { type: 'state'; player: PlayerState }
  | { type: 'menu'; menu: MenuView }
  | { type: 'players'; players: PlayerPublic[] }
  | { type: 'zonePlayers'; players: PlayerPublic[] }
  | { type: 'bazaarBook'; book: OrderBookSnapshot }
  | { type: 'bazaarOrders'; orders: BazaarOrder[] }
  | { type: 'bazaarMeta'; meta: BazaarMeta }
  | { type: 'toast'; message: string; kind?: 'info' | 'error' | 'success' }
  | { type: 'chat'; message: ChatMessage }
  | { type: 'damageNumber'; x: number; y: number; amount: number; critical?: boolean }
  | { type: 'seaCreatureSpawn'; name: string; mobId: string }
  | { type: 'actionResult'; actionId: string; success: boolean; message: string }
  /** Lightweight position fix — avoids a full state sync that would rubber-band the client. */
  | { type: 'moveCorrection'; x: number; y: number; facing: Facing };

export interface AuthResponse {
  token: string;
  player: PlayerState;
}

export type { ItemStack };
