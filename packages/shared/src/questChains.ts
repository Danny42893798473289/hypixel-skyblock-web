import type { ItemId } from './items.js';
import type { SkillId } from './skills.js';
import { levelFromXp } from './skills.js';
import { emptyQuestBook, type QuestBookState, type QuestPlayerView } from './quests.js';

export type QuestPredicate =
  | { kind: 'collection'; id: ItemId; amount: number }
  | { kind: 'skill'; id: SkillId; amount: number }
  | { kind: 'slayerXp'; id: string; amount: number }
  | { kind: 'flag'; id: string }
  | { kind: 'minions'; amount: number }
  | { kind: 'gardenHarvest'; amount: number }
  | { kind: 'hotmTokens'; amount: number }
  | { kind: 'dungeonClears'; amount: number };

export interface QuestChainStep {
  id: string;
  title: string;
  detail: string;
  require: QuestPredicate;
  rewardCoins?: number;
  rewardItems?: Array<{ itemId: ItemId; qty: number }>;
  rewardBits?: number;
  rewardUnlock?: string;
}

export interface QuestChainDef {
  id: string;
  name: string;
  icon: string;
  steps: QuestChainStep[];
}

export const QUEST_CHAINS: QuestChainDef[] = [
  {
    id: 'mining',
    name: 'Deep Caverns',
    icon: 'iron_pickaxe',
    steps: [
      { id: 'mine_100', title: 'Stone Collector', detail: 'Collect 100 cobblestone.', require: { kind: 'collection', id: 'cobble', amount: 100 }, rewardCoins: 250 },
      { id: 'mine_iron', title: 'Iron Age', detail: 'Collect 50 iron ore.', require: { kind: 'collection', id: 'iron_ore', amount: 50 }, rewardCoins: 400 },
      { id: 'mining_12', title: 'Dwarven Permit', detail: 'Reach Mining 12 to enter the Dwarven Mines.', require: { kind: 'skill', id: 'mining', amount: 12 }, rewardCoins: 800, rewardItems: [{ itemId: 'mithril_pickaxe', qty: 1 }], rewardUnlock: 'warp:dwarven_mines' },
      { id: 'mithril_50', title: 'Mithril Miner', detail: 'Collect 50 mithril.', require: { kind: 'collection', id: 'mithril', amount: 50 }, rewardCoins: 1200, rewardBits: 40 },
      { id: 'hotm_token', title: 'Heart of the Mountain', detail: 'Earn 1 HotM token from commissions.', require: { kind: 'hotmTokens', amount: 1 }, rewardCoins: 1500, rewardBits: 50 },
    ],
  },
  {
    id: 'combat',
    name: 'Monster Hunter',
    icon: 'diamond_sword',
    steps: [
      { id: 'zombie_25', title: 'Graveyard Veteran', detail: 'Defeat 25 zombies.', require: { kind: 'flag', id: 'combat_zombie_25' }, rewardCoins: 300 },
      { id: 'combat_5', title: 'Combat Training', detail: 'Reach Combat 5.', require: { kind: 'skill', id: 'combat', amount: 5 }, rewardCoins: 500 },
      { id: 'slayer_start', title: 'Maddox', detail: 'Start any Slayer quest.', require: { kind: 'flag', id: 'start_slayer' }, rewardCoins: 400 },
      { id: 'revenant_xp', title: 'Revenant Initiate', detail: 'Earn 15 Revenant Slayer XP.', require: { kind: 'slayerXp', id: 'revenant', amount: 15 }, rewardCoins: 1200, rewardItems: [{ itemId: 'revenant_falchion', qty: 1 }] },
      { id: 'combat_12', title: 'Catacombs Ready', detail: 'Reach Combat 12 to enter Dungeons.', require: { kind: 'skill', id: 'combat', amount: 12 }, rewardCoins: 2000, rewardBits: 40 },
    ],
  },
  {
    id: 'farming',
    name: 'Garden Path',
    icon: 'wheat',
    steps: [
      { id: 'wheat_50', title: 'First Fields', detail: 'Collect 50 wheat.', require: { kind: 'collection', id: 'wheat', amount: 50 }, rewardCoins: 200 },
      { id: 'farming_5', title: 'Farmhand', detail: 'Reach Farming 5.', require: { kind: 'skill', id: 'farming', amount: 5 }, rewardCoins: 400, rewardItems: [{ itemId: 'rookie_hoe', qty: 1 }] },
      { id: 'place_minion', title: 'Help Wanted', detail: 'Place a minion on your island.', require: { kind: 'minions', amount: 1 }, rewardCoins: 300 },
      { id: 'garden_40', title: 'Garden Plots', detail: 'Harvest 40 crops in the Garden.', require: { kind: 'gardenHarvest', amount: 40 }, rewardCoins: 800, rewardBits: 25 },
      { id: 'farming_12', title: 'Contest Farmer', detail: 'Reach Farming 12.', require: { kind: 'skill', id: 'farming', amount: 12 }, rewardCoins: 1500, rewardBits: 40 },
    ],
  },
  {
    id: 'dungeoneering',
    name: 'Catacombs',
    icon: 'wither_skull',
    steps: [
      { id: 'cata_enter', title: 'Mort', detail: 'Reach Combat 12 so the Dungeon Hub opens.', require: { kind: 'skill', id: 'combat', amount: 12 }, rewardCoins: 500, rewardUnlock: 'warp:dungeon_hub' },
      { id: 'cata_1', title: 'The Entrance', detail: 'Clear any dungeon floor.', require: { kind: 'dungeonClears', amount: 1 }, rewardCoins: 1500, rewardBits: 50 },
      { id: 'cata_5', title: 'Floor Regular', detail: 'Clear 5 dungeon floors.', require: { kind: 'dungeonClears', amount: 5 }, rewardCoins: 4000, rewardBits: 80 },
      { id: 'cata_lvl5', title: 'Catacombs V', detail: 'Reach Catacombs 5.', require: { kind: 'skill', id: 'dungeoneering', amount: 5 }, rewardCoins: 5000, rewardItems: [{ itemId: 'adaptive_helmet', qty: 1 }] },
      { id: 'cata_lvl10', title: 'Floor IV Ready', detail: 'Reach Catacombs 10.', require: { kind: 'skill', id: 'dungeoneering', amount: 10 }, rewardCoins: 8000, rewardBits: 120 },
    ],
  },
];

export function predicateMet(player: QuestPlayerView, require: QuestPredicate): boolean {
  const quests = player.quests ?? emptyQuestBook();
  switch (require.kind) {
    case 'collection':
      return (player.collections[require.id] ?? 0) >= require.amount;
    case 'skill': {
      const xp = player.skills?.[require.id] ?? 0;
      return levelFromXp(xp).level >= require.amount;
    }
    case 'slayerXp':
      return (player.slayerXp?.[require.id] ?? 0) >= require.amount;
    case 'flag':
      if (require.id === 'combat_zombie_25') return (quests.counters.zombie ?? 0) >= 25;
      return Boolean(quests.flags[require.id]);
    case 'minions':
      return player.minions.length >= require.amount;
    case 'gardenHarvest': {
      const harvested = player.garden?.harvested ?? {};
      return Object.values(harvested).reduce((sum, qty) => sum + qty, 0) >= require.amount;
    }
    case 'hotmTokens':
      return (player.hotm?.tokens ?? 0) >= require.amount || Boolean(quests.flags.hotm_token);
    case 'dungeonClears':
      return (quests.counters.dungeon_clears ?? 0) >= require.amount;
    default:
      return false;
  }
}

export function chainStepClaimed(quests: QuestBookState | undefined, chainId: string, stepId: string): boolean {
  return (quests?.claimedSteps ?? []).includes(`${chainId}:${stepId}`);
}

export function chainStepReady(player: QuestPlayerView, chain: QuestChainDef, stepIndex: number): boolean {
  const step = chain.steps[stepIndex];
  if (!step) return false;
  if (chainStepClaimed(player.quests, chain.id, step.id)) return false;
  if (stepIndex > 0) {
    const prev = chain.steps[stepIndex - 1]!;
    if (!chainStepClaimed(player.quests, chain.id, prev.id)) return false;
  }
  return predicateMet(player, step.require);
}

export function currentChainStep(player: QuestPlayerView, chain: QuestChainDef): QuestChainStep | null {
  for (let i = 0; i < chain.steps.length; i++) {
    const step = chain.steps[i]!;
    if (!chainStepClaimed(player.quests, chain.id, step.id)) return step;
  }
  return null;
}
