/** Base Accessory Bag slots (Common tier). */
export const BASE_ACCESSORY_BAG_SLOTS = 3;

/** Every 5 Fairy Souls found unlocks one additional bag slot. */
export const FAIRY_SOULS_PER_BAG_SLOT = 5;

export const MAX_ACCESSORY_BAG_SLOTS = 27;

/** Accessory Bag capacity from Fairy Souls (Hypixel-style backpack expansion). */
export function accessoryBagSlots(fairySouls: number, extra = 0): number {
  const bonus = Math.floor(Math.max(0, fairySouls) / FAIRY_SOULS_PER_BAG_SLOT);
  return Math.min(MAX_ACCESSORY_BAG_SLOTS, BASE_ACCESSORY_BAG_SLOTS + bonus + Math.max(0, extra));
}

/** Magical Power grants +1 ✎ Intelligence per point (Hypixel). */
export function magicalPowerIntelligence(magicalPower: number): number {
  return Math.max(0, magicalPower);
}
