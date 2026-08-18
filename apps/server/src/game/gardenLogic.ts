import {
  GARDEN_CROPS,
  GARDEN_PLOT_COUNT,
  JACOB_CONTEST_MS,
  ITEMS,
  ESSENCE_TYPES,
  STARTING_GARDEN_PLOTS,
  emptyJacobMedals,
  composterYield,
  emptyGardenPlots,
  jacobMedalForScore,
  jacobMedalReward,
  plotReady,
  removeItem,
  addItem,
  starUpgradeCost,
  type ItemId,
  type PlayerState,
} from '@aether/shared';
import { ensureMidgame } from './midgameLogic.js';

export function ensureGardenPlots(player: PlayerState): void {
  ensureMidgame(player);
  if (!player.garden.plots?.length) {
    player.garden.plots = emptyGardenPlots();
  }
  if (player.garden.jacobContestEndsAt == null) {
    player.garden.jacobContestEndsAt = Date.now() + JACOB_CONTEST_MS;
  }
  if (player.garden.jacobMedal == null) player.garden.jacobMedal = 'none';
  if (!player.garden.jacobMedals) player.garden.jacobMedals = emptyJacobMedals();
  if (player.garden.unlockedPlots == null) {
    const usedGarden = Object.keys(player.garden.harvested ?? {}).length > 0
      || (player.garden.plots ?? []).some((plot) => Boolean(plot.crop));
    player.garden.unlockedPlots = usedGarden ? GARDEN_PLOT_COUNT : STARTING_GARDEN_PLOTS;
  }
  if (player.garden.organicMatter == null) player.garden.organicMatter = 0;
  if (player.garden.composterLevel == null) player.garden.composterLevel = 0;
  tickJacobContest(player);
}

function tickJacobContest(player: PlayerState): void {
  const now = Date.now();
  if (now < player.garden.jacobContestEndsAt) return;
  const medal = jacobMedalForScore(player.garden.jacobScore);
  if (medal !== 'none') {
    player.coins += jacobMedalReward(medal);
    player.garden.jacobMedals[medal] += 1;
  }
  player.garden.jacobScore = 0;
  player.garden.jacobMedal = medal;
  player.garden.jacobContestEndsAt = now + JACOB_CONTEST_MS;
  player.garden.jacobCrop = GARDEN_CROPS[Math.floor(now / JACOB_CONTEST_MS) % GARDEN_CROPS.length] ?? 'wheat';
}

export function plantCrop(player: PlayerState, plotIndex: number, crop: ItemId): string {
  ensureGardenPlots(player);
  if (plotIndex < 0 || plotIndex >= GARDEN_PLOT_COUNT) throw new Error('Invalid plot');
  if (plotIndex >= (player.garden.unlockedPlots ?? STARTING_GARDEN_PLOTS)) throw new Error('Plot locked — unlock more plots first');
  if (!GARDEN_CROPS.includes(crop)) throw new Error('Not a garden crop');
  const plot = player.garden.plots[plotIndex]!;
  if (plot.crop) throw new Error('Plot already planted');
  const seed = removeItem(player.inventory, crop, 1);
  if (!seed) throw new Error(`Need 1 ${crop} to plant`);
  player.inventory = seed;
  plot.crop = crop;
  plot.plantedAt = Date.now();
  plot.watered = false;
  return `Planted ${ITEMS[crop]?.name ?? crop} in plot ${plotIndex + 1}.`;
}

export function waterPlot(player: PlayerState, plotIndex: number): string {
  ensureGardenPlots(player);
  const plot = player.garden.plots[plotIndex];
  if (!plot?.crop) throw new Error('Nothing planted');
  plot.watered = true;
  return 'Plot watered — grows 25% faster.';
}

export function harvestPlot(player: PlayerState, plotIndex: number): string {
  ensureGardenPlots(player);
  const plot = player.garden.plots[plotIndex];
  if (!plot?.crop) throw new Error('Nothing planted');
  if (!plotReady(plot)) throw new Error('Crop not ready yet');
  const crop = plot.crop;
  const qty = 3 + Math.floor(Math.random() * 3);
  const next = addItem(player.inventory, crop, qty);
  if (!next) throw new Error('Inventory full');
  player.inventory = next;
  player.skills.farming += qty;
  player.garden.harvested[crop] = (player.garden.harvested[crop] ?? 0) + qty;
  if (crop === player.garden.jacobCrop) player.garden.jacobScore += qty;
  plot.crop = null;
  plot.plantedAt = 0;
  plot.watered = false;
  return `Harvested ${qty}× ${ITEMS[crop]?.name ?? crop}!`;
}

export function compostCrop(player: PlayerState, crop: ItemId, qty: number): string {
  ensureGardenPlots(player);
  const removed = removeItem(player.inventory, crop, qty);
  if (!removed) throw new Error('Not enough crops');
  player.inventory = removed;
  const matter = composterYield(crop, qty);
  player.garden.organicMatter += matter;
  let levelUps = 0;
  while (player.garden.organicMatter >= 100) {
    player.garden.organicMatter -= 100;
    player.garden.composterLevel += 1;
    levelUps += 1;
    player.skills.farming += 25;
  }
  return `Composted ${qty}× ${ITEMS[crop]?.name ?? crop} (+${matter} matter${levelUps ? `, composter +${levelUps}` : ''}).`;
}

export function upgradeGearStars(player: PlayerState, inventorySlot: number): string {
  const stack = player.inventory[inventorySlot];
  if (!stack) throw new Error('Select gear in inventory');
  const def = ITEMS[stack.itemId];
  if (!def || def.type === 'MATERIAL') throw new Error('Only gear can be starred');
  const stars = stack.dungeonStars ?? 0;
  if (stars >= 5) throw new Error('Already 5 stars');
  const rarityIndex = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'].indexOf(def.rarity ?? 'COMMON');
  const cost = starUpgradeCost(stars, rarityIndex);
  const essenceType = ESSENCE_TYPES[rarityIndex % ESSENCE_TYPES.length] ?? 'undead';
  if (!player.essence) player.essence = {};
  if ((player.essence[essenceType] ?? 0) < cost.essence) throw new Error(`Need ${cost.essence} ${essenceType} essence`);
  if (player.coins < cost.coins) throw new Error(`Need ${cost.coins.toLocaleString()} coins`);
  player.coins -= cost.coins;
  player.essence[essenceType] = (player.essence[essenceType] ?? 0) - cost.essence;
  stack.dungeonStars = stars + 1;
  player.skills.carpentry += 15;
  return `Upgraded to ${stack.dungeonStars}★!`;
}
