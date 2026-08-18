import {
  ALCHEMY_RECIPES,
  COMMUNITY_OFFERS,
  DRAGON_TYPES,
  ESSENCE_SHOP,
  FETCHUR_BITS,
  FETCHUR_QTY,
  GEMSTONE_ITEM_IDS,
  HOTM_PERKS,
  ITEMS,
  LOGIN_REWARDS,
  MEDAL_SHOP,
  PET_EGGS,
  QUEST_CHAINS,
  addItem,
  chainStepReady,
  currentJacobCrop,
  currentMayor,
  dayIndex,
  emptyDailies,
  emptyGarden,
  emptyGardenPlots,
  emptyJacobMedals,
  emptyHotm,
  emptyBestiary,
  fetchurWant,
  gardenLevelFromHarvest,
  hotmMiningFortune,
  hotmMiningSpeed,
  hotmPerkLocked,
  hotmPowderCost,
  hotmPowderBalance,
  spendHotmPowder,
  emptyMuseum,
  emptyWardrobe,
  isGemstoneItem,
  loginRewardForStreak,
  normalizeBackpacks,
  plotUnlockCost,
  removeItem,
  rollCommissions,
  rollDailyTasks,
  rollGardenVisitor,
  skillLevelRewards,
  skillRewardKey,
  STARTING_GARDEN_PLOTS,
  GARDEN_PLOT_COUNT,
  SKILLS,
  JACOB_CONTEST_MS,
  levelFromXp,
  type DailyTask,
  type ItemId,
  type PlayerState,
} from '@aether/shared';

function dailyCounter(player: PlayerState, task: DailyTask): number {
  if (task.kind === 'collect') return player.collections[task.target as ItemId] ?? 0;
  if (task.kind === 'harvest') {
    return Object.values(player.garden?.harvested ?? {}).reduce((sum, qty) => sum + qty, 0);
  }
  if (task.kind === 'kills') return player.bestiary?.kills[task.target ?? ''] ?? 0;
  if (task.kind === 'slayer') return player.dailies.slayerBosses;
  if (task.kind === 'dungeon') return player.dailies.dungeonsCleared;
  return 0;
}

export function refreshDailyTasks(player: PlayerState): void {
  if (!player.dailies?.tasks) return;
  for (const task of player.dailies.tasks) {
    if (task.claimed) continue;
    task.have = Math.min(task.need, Math.max(0, dailyCounter(player, task) - task.baseline));
  }
}

function snapshotDailyBaselines(player: PlayerState, tasks: DailyTask[]): DailyTask[] {
  return tasks.map((task) => ({
    ...task,
    baseline: dailyCounter(player, task),
    have: 0,
    claimed: false,
  }));
}

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
  if (player.hotm.gemstonePowder == null) player.hotm.gemstonePowder = 0;
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
  if (!player.garden.jacobMedals) player.garden.jacobMedals = emptyJacobMedals();
  if (player.garden.unlockedPlots == null) {
    const usedGarden = Object.keys(player.garden.harvested ?? {}).length > 0
      || (player.garden.plots ?? []).some((plot) => Boolean(plot.crop));
    player.garden.unlockedPlots = usedGarden ? GARDEN_PLOT_COUNT : STARTING_GARDEN_PLOTS;
  }
  if (!player.quests) player.quests = { completed: [], counters: {}, flags: {}, claimed: false, claimedSteps: [] };
  if (!player.quests.claimedSteps) player.quests.claimedSteps = [];
  if (!player.claimedSkillRewards) player.claimedSkillRewards = [];
  if (player.bits == null) player.bits = 0;
  if (player.extraMinionSlots == null) player.extraMinionSlots = 0;
  if (player.extraAccessorySlots == null) player.extraAccessorySlots = 0;
  if (!player.communityPurchases) player.communityPurchases = {};
  if (!player.dailies) player.dailies = emptyDailies();
  rolloverDailies(player);
  refreshDailyTasks(player);
}

function rolloverDailies(player: PlayerState): void {
  const today = dayIndex();
  if (player.dailies.day === today) return;
  const missed = today - player.dailies.day > 1;
  player.dailies.streak = missed ? 1 : player.dailies.streak + 1;
  player.dailies.day = today;
  player.dailies.claimedLogin = false;
  player.dailies.slayerBosses = 0;
  player.dailies.dungeonsCleared = 0;
  player.hotm.commissions = rollCommissions();
  player.dailies.tasks = snapshotDailyBaselines(player, rollDailyTasks());
}

export function claimLoginReward(player: PlayerState): string {
  ensureMidgame(player);
  if (player.dailies.claimedLogin) throw new Error('Already claimed today');
  const reward = loginRewardForStreak(player.dailies.streak);
  player.dailies.claimedLogin = true;
  player.coins += reward.coins;
  player.bits += reward.bits;
  if (reward.powder) player.hotm.mithrilPowder += reward.powder;
  for (const item of reward.items ?? []) {
    const next = addItem(player.inventory, item.itemId, item.qty);
    if (!next) throw new Error('Inventory full');
    player.inventory = next;
  }
  return `Day ${player.dailies.streak} login: +${reward.coins.toLocaleString()} coins, +${reward.bits} bits${reward.powder ? `, +${reward.powder} powder` : ''}.`;
}

export function claimDailyTask(player: PlayerState, taskId: string): string {
  ensureMidgame(player);
  refreshDailyTasks(player);
  const task = player.dailies.tasks.find((entry) => entry.id === taskId);
  if (!task) throw new Error('Unknown daily');
  if (task.claimed) throw new Error('Already claimed');
  if (task.have < task.need) throw new Error('Daily not finished');
  task.claimed = true;
  player.coins += task.rewardCoins;
  player.bits += task.rewardBits;
  if (task.rewardPowder) player.hotm.mithrilPowder += task.rewardPowder;
  return `Daily complete! +${task.rewardCoins} coins, +${task.rewardBits} bits.`;
}

export function claimFetchur(player: PlayerState): string {
  ensureMidgame(player);
  const today = dayIndex();
  if (player.dailies.fetchurClaimedDay === today) throw new Error('Fetchur already paid you today');
  const want = fetchurWant();
  const next = removeItem(player.inventory, want, FETCHUR_QTY);
  if (!next) throw new Error(`Fetchur wants ${FETCHUR_QTY}× ${ITEMS[want]?.name ?? want}`);
  player.inventory = next;
  player.dailies.fetchurClaimedDay = today;
  player.bits += FETCHUR_BITS;
  return `Fetchur: "thanks." +${FETCHUR_BITS} bits.`;
}

export function buyCommunityOffer(player: PlayerState, offerId: string): string {
  ensureMidgame(player);
  const offer = COMMUNITY_OFFERS.find((entry) => entry.id === offerId);
  if (!offer) throw new Error('Unknown Community Shop offer');
  const bought = player.communityPurchases[offer.id] ?? 0;
  if (bought >= offer.maxPurchases) throw new Error('Already purchased');
  if (player.bits < offer.bits) throw new Error(`Need ${offer.bits} bits`);
  player.bits -= offer.bits;
  player.communityPurchases[offer.id] = bought + 1;
  if (offer.kind === 'minion_slot') player.extraMinionSlots += 1;
  if (offer.kind === 'accessory_slot') player.extraAccessorySlots += 3;
  if (offer.kind === 'item' && offer.itemId) {
    const next = addItem(player.inventory, offer.itemId, 1);
    if (!next) throw new Error('Inventory full');
    player.inventory = next;
  }
  return `Bought ${offer.name} for ${offer.bits} bits.`;
}

export function buyEssenceOffer(player: PlayerState, offerId: string): string {
  ensureMidgame(player);
  const offer = ESSENCE_SHOP.find((entry) => entry.id === offerId);
  if (!offer) throw new Error('Unknown essence offer');
  if (!player.essence) player.essence = {};
  if ((player.essence[offer.essence] ?? 0) < offer.cost) {
    throw new Error(`Need ${offer.cost} ${offer.essence} essence`);
  }
  player.essence[offer.essence] = (player.essence[offer.essence] ?? 0) - offer.cost;
  const next = addItem(player.inventory, offer.itemId, 1);
  if (!next) throw new Error('Inventory full');
  player.inventory = next;
  return `Bought ${offer.name} for ${offer.cost} ${offer.essence} essence.`;
}

export function buyMedalOffer(player: PlayerState, offerId: string): string {
  ensureMidgame(player);
  const offer = MEDAL_SHOP.find((entry) => entry.id === offerId);
  if (!offer) throw new Error('Unknown medal offer');
  const have = player.garden.jacobMedals[offer.medal] ?? 0;
  if (have < offer.cost) throw new Error(`Need ${offer.cost} ${offer.medal} medals`);
  player.garden.jacobMedals[offer.medal] = have - offer.cost;
  const next = addItem(player.inventory, offer.itemId, 1);
  if (!next) throw new Error('Inventory full');
  player.inventory = next;
  return `Bought ${offer.name} for ${offer.cost} ${offer.medal} medal${offer.cost === 1 ? '' : 's'}.`;
}

export function claimSkillReward(player: PlayerState, skillId: string, level: number): string {
  ensureMidgame(player);
  const skill = SKILLS[skillId as keyof typeof SKILLS];
  if (!skill) throw new Error('Unknown skill');
  const key = skillRewardKey(skill.id, level);
  if (player.claimedSkillRewards.includes(key)) throw new Error('Already claimed');
  const reward = skillLevelRewards(skill)[level];
  if (!reward) throw new Error('No reward at that level');
  const have = levelFromXp(player.skills[skill.id] ?? 0, skill.maxLevel).level;
  if (have < level) throw new Error(`Reach ${skill.name} ${level} first`);
  player.claimedSkillRewards.push(key);
  if (reward.coins) player.coins += reward.coins;
  for (const item of reward.items ?? []) {
    const next = addItem(player.inventory, item.itemId, item.qty);
    if (!next) throw new Error('Inventory full');
    player.inventory = next;
  }
  return `Claimed ${skill.name} ${level} reward${reward.coins ? `: +${reward.coins.toLocaleString()} coins` : ''}.`;
}

export function claimChainStep(player: PlayerState, chainId: string, stepId: string): string {
  ensureMidgame(player);
  const chain = QUEST_CHAINS.find((entry) => entry.id === chainId);
  if (!chain) throw new Error('Unknown quest chain');
  const index = chain.steps.findIndex((step) => step.id === stepId);
  if (index < 0) throw new Error('Unknown step');
  if (!chainStepReady(player, chain, index)) throw new Error('Finish the previous step first');
  const step = chain.steps[index]!;
  player.quests.claimedSteps = [...(player.quests.claimedSteps ?? []), `${chainId}:${stepId}`];
  if (step.rewardCoins) player.coins += step.rewardCoins;
  if (step.rewardBits) player.bits += step.rewardBits;
  for (const item of step.rewardItems ?? []) {
    const next = addItem(player.inventory, item.itemId, item.qty);
    if (!next) throw new Error('Inventory full');
    player.inventory = next;
  }
  return `Quest complete: ${step.title}!`;
}

export function unlockGardenPlot(player: PlayerState): string {
  ensureMidgame(player);
  const nextIndex = player.garden.unlockedPlots;
  if (nextIndex >= 24) throw new Error('All plots unlocked');
  const cost = plotUnlockCost(nextIndex);
  const garden = gardenLevelFromHarvest(player.garden.harvested);
  if (garden.level < cost.gardenLevel) throw new Error(`Requires Garden level ${cost.gardenLevel}`);
  if (player.coins < cost.coins) throw new Error(`Need ${cost.coins.toLocaleString()} coins`);
  if ((player.garden.organicMatter ?? 0) < cost.compost) throw new Error(`Need ${cost.compost} compost`);
  player.coins -= cost.coins;
  player.garden.organicMatter -= cost.compost;
  player.garden.unlockedPlots += 1;
  return `Unlocked plot ${player.garden.unlockedPlots}!`;
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
  const payout = Math.round(visitor.reward * (1 + gardenLevelFromHarvest(player.garden.harvested).level * 0.1));
  player.coins += payout;
  player.garden.visitor = rollGardenVisitor();
  return `Gave ${visitor.name} the crops. +${payout.toLocaleString()} coins!`;
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
  const powder = hotmPowderCost(perk, level + 1);
  if (hotmPowderBalance(player.hotm, perk) < powder) {
    const kind = perk.powderType === 'gemstone' ? 'Gemstone Powder' : 'Mithril Powder';
    throw new Error(`Need ${powder.toLocaleString()} ${kind}`);
  }
  spendHotmPowder(player.hotm, perk, powder);
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
  player.quests.flags.hotm_token = true;
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
  if (isGemstoneItem(itemId)) {
    const buff = player.hotm.perks.powder_buff ?? 0;
    player.hotm.gemstonePowder += qty + buff;
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
