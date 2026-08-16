import {
  combineGearEnchants,
  lootingCoinBonus,
  enchantProcDamageBonus,
  bestiaryMilestoneReward,
  hotbarInventoryIndex,
  type PlayerState,
} from '@aether/shared';

export function gearEnchants(player: PlayerState): Record<string, number> {
  const hb = hotbarInventoryIndex(player.hotbarSlot ?? 0);
  const weapon = player.inventory[hb]?.enchantments;
  return combineGearEnchants(weapon, [
    player.equipment.helmet?.enchantments,
    player.equipment.chestplate?.enchantments,
    player.equipment.leggings?.enchantments,
    player.equipment.boots?.enchantments,
  ]);
}

export function applyLootingToCoins(player: PlayerState, baseCoins: number): number {
  const level = gearEnchants(player).looting ?? 0;
  return Math.floor(baseCoins * lootingCoinBonus(level));
}

export function procCombatDamage(
  player: PlayerState,
  baseDamage: number,
  mobId: string,
  mobMaxHp: number,
): { damage: number; critical: boolean; thunderBonus: number } {
  const proc = enchantProcDamageBonus(gearEnchants(player), mobId, mobMaxHp);
  return {
    damage: Math.round(baseDamage * proc.multiplier) + proc.thunderBonus,
    critical: proc.critical,
    thunderBonus: proc.thunderBonus,
  };
}

export function checkBestiaryMilestone(player: PlayerState, mobId: string): string | null {
  const kills = player.bestiary?.kills[mobId] ?? 0;
  const reward = bestiaryMilestoneReward(kills);
  if (!reward) return null;
  player.coins += reward.coins;
  return `Bestiary milestone (${kills} kills): +${reward.coins.toLocaleString()} coins!`;
}

export function incrementSlayerRng(player: PlayerState, slayerId: string, amount = 2): boolean {
  if (!player.slayerRngMeter) player.slayerRngMeter = {};
  player.slayerRngMeter[slayerId] = Math.min(100, (player.slayerRngMeter[slayerId] ?? 0) + amount);
  if (player.slayerRngMeter[slayerId] >= 100) {
    player.slayerRngMeter[slayerId] = 0;
    return true;
  }
  return false;
}
