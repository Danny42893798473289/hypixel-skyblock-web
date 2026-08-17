import {
  ALCHEMY_RECIPES,
  DRAGON_TYPES,
  HOTM_PERKS,
  ITEMS,
  PET_EGGS,
  addItem,
  currentJacobCrop,
  currentMayor,
  emptyGarden,
  emptyGardenPlots,
  JACOB_CONTEST_MS,
  emptyHotm,
  emptyBestiary,
  hotmMiningFortune,
  hotmMiningSpeed,
  emptyMuseum,
  emptyWardrobe,
  normalizeBackpacks,
  removeItem,
  rollCommissions,
  rollGardenVisitor,
  type ItemId,
  type PlayerState,
} from '@aether/shared';

export function ensureMidgame(player: PlayerState): void {
  if (!player.garden) player.garden = emptyGarden();
  if (!player.hotm) player.hotm = emptyHotm();
  if (!player.bestiary) player.bestiary = emptyBestiary();
  if (!player.museum) player.museum = emptyMuseum();
  if (!player.wardrobe || player.wardrobe.pages.length === 0) player.wardrobe = emptyWardrobe();
  player.backpacks = normalizeBackpacks(player.backpacks);
  if (player.dragonFight === undefined) player.dragonFight = null;
  if (player.kuudraFight === undefined) player.kuudraFight = null;
  if (!player.hotm.commissions.length) player.hotm.commissions = rollCommissions();
  if (!player.garden.visitor) player.garden.visitor = rollGardenVisitor();
  if (Date.now() > player.garden.jacobEndsAt) {
    player.garden.jacobEndsAt = Math.ceil(Date.now() / 3_600_000) * 3_600_000;
    player.garden.jacobScore = 0;
    player.garden.jacobCrop = currentJacobCrop();
  }
  if (!player.garden.plots?.length) player.garden.plots = emptyGardenPlots();
  if (player.garden.jacobContestEndsAt == null) player.garden.jacobContestEndsAt = Date.now() + JACOB_CONTEST_MS;
  if (player.garden.organicMatter == null) player.garden.organicMatter = 0;
  if (player.garden.composterLevel == null) player.garden.composterLevel = 0;
  if (player.garden.jacobMedal == null) player.garden.jacobMedal = 'none';
}

export function noteGardenHarvest(player: PlayerState, itemId: ItemId, qty: number): string | null {
  ensureMidgame(player);
  if (player.islandId !== 'garden') return null;
  player.garden.harvested[itemId] = (player.garden.harvested[itemId] ?? 0) + qty;
  if (itemId === player.garden.jacobCrop) player.garden.jacobScore += qty;
  return null;
}

export function serveGardenVisitor(player: PlayerState): string {
  ensureMidgame(player);
  const visitor = player.garden.visitor;
  if (!visitor) throw new Error('No visitor right now');
  const next = removeItem(player.inventory, visitor.wants, visitor.qty);
  if (!next) throw new Error(`Need ${visitor.qty} ${ITEMS[visitor.wants]?.name ?? visitor.wants}`);
  player.inventory = next;
  player.coins += visitor.reward;
  player.garden.visitor = rollGardenVisitor();
  return `Gave ${visitor.name} the crops. +${visitor.reward.toLocaleString()} coins!`;
}

export function unlockHotmPerk(player: PlayerState, perkId: string): string {
  ensureMidgame(player);
  const perk = HOTM_PERKS.find((entry) => entry.id === perkId);
  if (!perk) throw new Error('Unknown perk');
  const level = player.hotm.perks[perkId] ?? 0;
  if (level >= perk.max) throw new Error('Already maxed');
  if (perk.parent) {
    const need = perk.parentLevel ?? 1;
    const have = player.hotm.perks[perk.parent] ?? 0;
    if (have < need) {
      const parent = HOTM_PERKS.find((entry) => entry.id === perk.parent);
      throw new Error(`Unlock ${parent?.name ?? perk.parent}${need > 1 ? ` ${need}` : ''} first`);
    }
  }
  if (level === 0) {
    if (player.hotm.tokens < perk.cost) throw new Error(`Need ${perk.cost} HotM token${perk.cost === 1 ? '' : 's'}`);
    player.hotm.tokens -= perk.cost;
    player.hotm.perks[perkId] = 1;
    return `Unlocked ${perk.name}!`;
  }
  const powder = perk.powderCost * (level + 1);
  if (player.hotm.mithrilPowder < powder) throw new Error(`Need ${powder.toLocaleString()} Mithril Powder`);
  player.hotm.mithrilPowder -= powder;
  player.hotm.perks[perkId] = level + 1;
  return `${perk.name} is now level ${level + 1}.`;
}

export function claimCommission(player: PlayerState, commissionId: string): string {
  ensureMidgame(player);
  const job = player.hotm.commissions.find((entry) => entry.id === commissionId);
  if (!job) throw new Error('Unknown commission');
  if (job.have < job.need) throw new Error('Commission not finished');
  player.hotm.tokens += job.rewardTokens;
  player.hotm.mithrilPowder += 50;
  player.coins += job.rewardCoins;
  player.hotm.commissions = player.hotm.commissions.filter((entry) => entry.id !== commissionId);
  if (player.hotm.commissions.length === 0) player.hotm.commissions = rollCommissions();
  return `Commission complete! +${job.rewardTokens} token, +${job.rewardCoins} coins.`;
}

export function noteMiningCommission(player: PlayerState, itemId: ItemId, qty: number): void {
  ensureMidgame(player);
  for (const job of player.hotm.commissions) {
    if (job.itemId === itemId) job.have = Math.min(job.need, job.have + qty);
  }
  if (itemId === 'mithril') {
    const daily = player.hotm.perks.daily_powder ?? 0;
    player.hotm.mithrilPowder += qty + daily;
  }
}

export function brewPotion(player: PlayerState, recipeId: string): string {
  const recipe = ALCHEMY_RECIPES.find((entry) => entry.id === recipeId);
  if (!recipe) throw new Error('Unknown brew');
  let inv = player.inventory;
  for (const ing of recipe.ingredients) {
    const next = removeItem(inv, ing.itemId, ing.qty);
    if (!next) throw new Error(`Need ${ing.qty} ${ITEMS[ing.itemId]?.name ?? ing.itemId}`);
    inv = next;
  }
  const added = addItem(inv, recipe.result, 1);
  if (!added) throw new Error('Inventory full');
  player.inventory = added;
  player.skills.alchemy += recipe.xp;
  return `Brewed ${ITEMS[recipe.result]?.name ?? recipe.result}! +${recipe.xp} Alchemy XP`;
}

export function donateMuseum(player: PlayerState, itemId: ItemId): string {
  ensureMidgame(player);
  if (player.museum.donated.includes(itemId)) throw new Error('Already donated');
  const next = removeItem(player.inventory, itemId, 1);
  if (!next) throw new Error('You do not have that item');
  player.inventory = next;
  player.museum.donated.push(itemId);
  player.coins += 50;
  return `Donated ${ITEMS[itemId]?.name ?? itemId} to the Museum. +50 coins.`;
}

export function saveWardrobe(player: PlayerState, page: number): string {
  ensureMidgame(player);
  const slot = player.wardrobe.pages[page];
  if (!slot) throw new Error('Invalid set');
  slot.helmet = player.equipment.helmet ? { ...player.equipment.helmet } : null;
  slot.chestplate = player.equipment.chestplate ? { ...player.equipment.chestplate } : null;
  slot.leggings = player.equipment.leggings ? { ...player.equipment.leggings } : null;
  slot.boots = player.equipment.boots ? { ...player.equipment.boots } : null;
  return `Saved current armor to Wardrobe set ${page + 1}.`;
}

export function equipWardrobe(player: PlayerState, page: number): string {
  ensureMidgame(player);
  const slot = player.wardrobe.pages[page];
  if (!slot) throw new Error('Invalid set');
  const previous = { ...player.equipment };
  player.equipment.helmet = slot.helmet ? { ...slot.helmet } : null;
  player.equipment.chestplate = slot.chestplate ? { ...slot.chestplate } : null;
  player.equipment.leggings = slot.leggings ? { ...slot.leggings } : null;
  player.equipment.boots = slot.boots ? { ...slot.boots } : null;
  slot.helmet = previous.helmet;
  slot.chestplate = previous.chestplate;
  slot.leggings = previous.leggings;
  slot.boots = previous.boots;
  return `Swapped to Wardrobe set ${page + 1}.`;
}

export function placeDragonEye(player: PlayerState): string {
  ensureMidgame(player);
  const next = removeItem(player.inventory, 'summoning_eye', 1);
  if (!next) throw new Error('Need a Summoning Eye');
  player.inventory = next;
  const eyes = (player.dragonFight?.eyes ?? 0) + 1;
  if (eyes < 8) {
    player.dragonFight = {
      type: 'charging',
      hp: 0,
      maxHp: 0,
      eyes,
      endsAt: 0,
    };
    return `Placed a Summoning Eye (${eyes}/8).`;
  }
  const dragon = DRAGON_TYPES[Math.floor(Math.random() * DRAGON_TYPES.length)] ?? DRAGON_TYPES[0]!;
  const hp = Math.max(2800, Math.round(dragon.hp / 2000));
  player.dragonFight = {
    type: dragon.name,
    hp,
    maxHp: hp,
    eyes: 8,
    endsAt: Date.now() + 5 * 60 * 1000,
  };
  return `${dragon.name} has spawned in the Dragon Nest!`;
}

export function startKuudra(player: PlayerState, tier: number): string {
  ensureMidgame(player);
  const hp = 6000 * Math.max(1, Math.min(3, tier));
  player.kuudraFight = { tier, hp, maxHp: hp };
  return `Kuudra T${tier} spawned at the Blazing Volcano! Press E on the altar mob.`;
}

export function hatchPetEgg(player: PlayerState, eggId: ItemId): string {
  const mapping = PET_EGGS.find((entry) => entry.egg === eggId);
  if (!mapping) throw new Error('That is not a pet egg');
  const next = removeItem(player.inventory, eggId, 1);
  if (!next) throw new Error('You do not have that egg');
  player.inventory = next;
  player.pets.push({ itemId: mapping.pet, level: 1, xp: 0, active: player.pets.length === 0 });
  return `Hatched ${ITEMS[mapping.pet]?.name ?? mapping.pet}!`;
}

export function npcSellMultiplier(player: PlayerState): number {
  return currentMayor().id === 'foxy' ? 1.1 : 1;
}

export function miningFortuneFromHotm(player: PlayerState): number {
  ensureMidgame(player);
  return hotmMiningFortune(player.hotm.perks, currentMayor().id === 'cole');
}

export function miningSpeedFromHotm(player: PlayerState): number {
  ensureMidgame(player);
  return hotmMiningSpeed(player.hotm.perks);
}
