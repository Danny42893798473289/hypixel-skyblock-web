export interface QuestStepDef {
  id: string;
  title: string;
  detail: string;
}

export interface QuestPlayerView {
  collections: Partial<Record<string, number>>;
  minions: unknown[];
  visitedZones: string[];
  islandId: string;
  activeSlayer: unknown;
  quests?: QuestBookState;
  skills?: Record<string, number>;
  slayerXp?: Record<string, number>;
  garden?: { harvested?: Record<string, number> };
  hotm?: { tokens?: number };
}

export interface QuestBookState {
  completed: string[];
  counters: Record<string, number>;
  flags: Record<string, boolean>;
  claimed?: boolean;
  claimedSteps?: string[];
}

export const STARTER_QUEST_STEPS: QuestStepDef[] = [
  { id: 'talk_adventurer', title: 'Welcome to the Hub', detail: 'Talk to the Adventurer in the Village Plaza.' },
  { id: 'mine_cobble', title: 'Get Mining', detail: 'Mine 10 Cobblestone.' },
  { id: 'farm_wheat', title: 'First Harvest', detail: 'Harvest 10 Wheat.' },
  { id: 'kill_zombies', title: 'Graveyard Duty', detail: 'Defeat 10 Zombies.' },
  { id: 'sell_npc', title: 'Make a Sale', detail: 'Sell any item to an NPC merchant.' },
  { id: 'place_minion', title: 'Your First Minion', detail: 'Place a minion on the Minion Platform.' },
  { id: 'visit_gold', title: 'Deeper Veins', detail: 'Visit the Gold Mine.' },
  { id: 'craft_item', title: 'Recipe Book', detail: 'Craft any item.' },
  { id: 'open_bazaar', title: 'The Bazaar', detail: 'Open the Bazaar in the Hub.' },
  { id: 'start_slayer', title: 'Slayer Initiate', detail: 'Start any Slayer quest.' },
];

export function emptyQuestBook(): QuestBookState {
  return { completed: [], counters: {}, flags: {}, claimed: false, claimedSteps: [] };
}

export function isQuestStepDone(player: QuestPlayerView, stepId: string): boolean {
  const quests = player.quests ?? emptyQuestBook();
  if (quests.completed.includes(stepId)) return true;
  switch (stepId) {
    case 'talk_adventurer':
      return Boolean(quests.flags.talk_adventurer);
    case 'mine_cobble':
      return (player.collections.cobble ?? 0) >= 10;
    case 'farm_wheat':
      return (player.collections.wheat ?? 0) >= 10;
    case 'kill_zombies':
      return (quests.counters.zombie ?? 0) >= 10;
    case 'sell_npc':
      return Boolean(quests.flags.sell_npc);
    case 'place_minion':
      return player.minions.length > 0 || Boolean(quests.flags.place_minion);
    case 'visit_gold':
      return player.visitedZones.some((zone) => zone.startsWith('gold_')) || player.islandId === 'gold_mine';
    case 'craft_item':
      return Boolean(quests.flags.craft_item);
    case 'open_bazaar':
      return Boolean(quests.flags.open_bazaar);
    case 'start_slayer':
      return Boolean(quests.flags.start_slayer) || player.activeSlayer != null;
    default:
      return false;
  }
}

export function currentQuestStep(player: QuestPlayerView): QuestStepDef | null {
  for (const step of STARTER_QUEST_STEPS) {
    if (!isQuestStepDone(player, step.id)) return step;
  }
  return null;
}

export function starterQuestComplete(player: QuestPlayerView): boolean {
  return STARTER_QUEST_STEPS.every((step) => isQuestStepDone(player, step.id));
}
