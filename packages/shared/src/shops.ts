import type { ItemId } from './items.js';
import type { EssenceType } from './gardenPlots.js';

export interface CommunityOffer {
  id: string;
  name: string;
  detail: string;
  bits: number;
  icon: string;
  kind: 'minion_slot' | 'accessory_slot' | 'item';
  itemId?: ItemId;
  maxPurchases: number;
}

export const COMMUNITY_OFFERS: CommunityOffer[] = [
  {
    id: 'minion_slot',
    name: 'Minion Slot',
    detail: 'Permanently add 1 minion slot. Buy up to twice.',
    bits: 500,
    icon: 'minion',
    kind: 'minion_slot',
    maxPurchases: 2,
  },
  {
    id: 'accessory_slot',
    name: 'Accessory Bag Upgrade',
    detail: 'Permanently add 3 Accessory Bag slots. Buy up to twice.',
    bits: 400,
    icon: 'talisman',
    kind: 'accessory_slot',
    maxPurchases: 2,
  },
  {
    id: 'bits_talisman',
    name: 'Bits Talisman',
    detail: 'A permanent accessory from the Community Shop.',
    bits: 250,
    icon: 'emerald',
    kind: 'item',
    itemId: 'bits_talisman',
    maxPurchases: 1,
  },
];

export interface EssenceOffer {
  id: string;
  name: string;
  itemId: ItemId;
  essence: EssenceType;
  cost: number;
  detail: string;
}

export const ESSENCE_SHOP: EssenceOffer[] = [
  { id: 'adaptive_helmet', name: 'Adaptive Helmet', itemId: 'adaptive_helmet', essence: 'undead', cost: 20, detail: 'Catacombs F2 armor.' },
  { id: 'bonzo_staff', name: "Bonzo's Staff", itemId: 'bonzo_staff', essence: 'undead', cost: 40, detail: 'Floor I mage weapon.' },
  { id: 'spirit_sceptre', name: 'Spirit Sceptre', itemId: 'spirit_sceptre', essence: 'dragon', cost: 50, detail: 'Floor III/IV mage weapon.' },
  { id: 'livid_dagger', name: 'Livid Dagger', itemId: 'livid_dagger', essence: 'wither', cost: 80, detail: 'Floor V assassin blade.' },
  { id: 'shadow_fury', name: 'Shadow Fury', itemId: 'shadow_fury', essence: 'wither', cost: 120, detail: 'Floor V legendary sword.' },
];

export interface MedalOffer {
  id: string;
  name: string;
  itemId: ItemId;
  medal: 'bronze' | 'silver' | 'gold';
  cost: number;
  detail: string;
}

export const MEDAL_SHOP: MedalOffer[] = [
  { id: 'rookie_hoe', name: 'Rookie Hoe', itemId: 'rookie_hoe', medal: 'bronze', cost: 3, detail: 'Starter farming fortune hoe.' },
  { id: 'melon_dicer', name: 'Melon Dicer', itemId: 'melon_dicer', medal: 'silver', cost: 4, detail: 'Specialized melon farming axe.' },
  { id: 'mathematical_hoe', name: 'Mathematical Hoe', itemId: 'mathematical_hoe', medal: 'gold', cost: 3, detail: 'High-fortune farming hoe.' },
  { id: 'elephant_pet', name: 'Elephant Pet', itemId: 'elephant_pet', medal: 'gold', cost: 6, detail: 'Farming pet from Anita.' },
];
