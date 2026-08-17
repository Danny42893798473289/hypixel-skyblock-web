import {
  BAZAAR_ITEMS,
  BAZAAR_SECTIONS,
  bazaarItemsInSection,
  bazaarSectionCounts,
  getBazaarSection,
  searchBazaarItems,
  type BazaarSection,
  COLLECTION_CATEGORIES,
  DUNGEON_COMBAT_REQUIREMENT,
  dungeonPhase,
  masterFloors,
  regularFloors,
  enchantsForItemType,
  enchantTableCost,
  ISLANDS,
  ITEMS,
  MOBS,
  RECIPE_CATEGORIES,
  SKILLS,
  SLAYERS,
  ZONES,
  buildItemLore,
  collectionProgress,
  collectionsInCategory,
  isRecipeUnlocked,
  obtainHintForItem,
  islandForZone,
  levelFromXp,
  recipesForCollection,
  recipesInCategory,
  buildRecipeBookLore,
  warpableIslands,
  zonesOnIsland,
  npcSellPrice,
  accessoryBagSlots,
  FAIRY_SOULS_PER_BAG_SLOT,
  BASE_ACCESSORY_BAG_SLOTS,
  countItem,
  BACKPACK_PAGES,
  BACKPACK_SIZE,
  backpackSlotsUsed,
  normalizeBackpacks,
  type CollectionCategory,
  type IslandId,
  type ItemId,
  type LoreLine,
  type MenuId,
  type MenuSlotView,
  type MenuView,
  type OrderBookSnapshot,
  type BazaarOrder,
  type PlayerState,
  type RecipeCategory,
  STARTER_QUEST_STEPS,
  currentQuestStep,
  isQuestStepDone,
  starterQuestComplete,
  PET_EGGS,
  minionTypeFromItem,
  ensureMinionDef,
  maxMinionSlots,
  skyblockXp,
  skyblockLevelFromXp,
  REFORGES,
} from '@aether/shared';
import { activeAuctions, auctionById, auctionsBySeller, durationOptions, expiredAuctionsFor, formatTimeLeft } from '../auction/engine.js';
import { getData } from '../store/usersStore.js';
import { BANK_TIERS, bankTier, msUntilNextInterest, nextBankTier } from './bank.js';
import { getTrade } from '../trade/engine.js';
import {
  alchemyMenu,
  bestiaryMenu,
  dragonsMenu,
  gardenMenu,
  gardenPlotsMenu,
  gardenPlantMenu,
  gardenCompostMenu,
  dungeonStarsMenu,
  hotmMenu,
  kuudraMenu,
  mayorMenu,
  museumMenu,
  profileExtras,
  wardrobeMenu,
} from './midgameMenus.js';

type Context = Record<string, string | number | boolean>;

/** Content area of a 6-row chest, leaving the border for tabs and navigation. */
const GRID = [
  10, 11, 12, 13, 14, 15, 16,
  19, 20, 21, 22, 23, 24, 25,
  28, 29, 30, 31, 32, 33, 34,
  37, 38, 39, 40, 41, 42, 43,
];

function pageControls(menu: MenuId, context: Context, page: number, pages: number): MenuSlotView[] {
  const slots: MenuSlotView[] = [];
  const params = Object.entries(context)
    .filter(([key]) => key !== 'page')
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join(',');
  const target = (next: number) => `page:${menu}|${next}|${params}`;
  if (page > 0) slots.push(slot(48, 'arrow_left', 'Previous Page', [line(`Page ${page}/${pages}`, 'gray')], target(page - 1)));
  if (page < pages - 1) slots.push(slot(50, 'arrow_right', 'Next Page', [line(`Page ${page + 2}/${pages}`, 'gray')], target(page + 1)));
  return slots;
}

function skillLevel(player: PlayerState, skill: keyof PlayerState['skills']): number {
  return levelFromXp(player.skills[skill] ?? 0).level;
}

const line = (text: string, color: LoreLine['color'] = 'gray', bold = false): LoreLine => ({ text, color, bold });
const click = (): LoreLine => line('Click to open!', 'yellow');

/** Thematic item icon for each warpable island in the Fast Travel menu. */
const ISLAND_WARP_ITEM: Partial<Record<IslandId, ItemId>> = {
  hub: 'oak_log',
  private_island: 'dirt',
  barn: 'wheat',
  gold_mine: 'coal',
  deep_caverns: 'cobble',
  spider_den: 'spider_eye',
  park: 'oak_log',
  mushroom_desert: 'cactus',
  the_end: 'end_stone',
  crimson_isle: 'netherrack',
  dungeon_hub: 'bone',
  garden: 'wheat',
  dwarven_mines: 'mithril',
  crystal_hollows: 'gemstone_ruby',
  rift: 'ender_pearl',
};

function slot(
  slotNumber: number,
  icon: string,
  name: string,
  lore: LoreLine[],
  action?: string,
  options: Partial<MenuSlotView> = {},
): MenuSlotView {
  return { slot: slotNumber, icon, name, lore, action, ...options };
}

function itemSlot(slotNumber: number, itemId: ItemId, action?: string, count?: number): MenuSlotView {
  const def = ITEMS[itemId];
  if (!def) return slot(slotNumber, 'barrier', 'Unknown Item', [line(itemId, 'red')]);
  return slot(slotNumber, def.sprite ?? spriteFor(itemId, def.type), def.name, buildItemLore(def), action, {
    itemId,
    count,
    rarity: def.rarity ?? 'COMMON',
  });
}

function spriteFor(itemId: string, type?: string): string {
  if (type === 'SWORD') return 'sword';
  if (type === 'BOW') return 'bow';
  if (type === 'PICKAXE' || type === 'DRILL') return 'pickaxe';
  if (type === 'AXE') return 'axe';
  if (type === 'HOE') return 'hoe';
  if (type === 'HELMET') return 'helmet';
  if (type === 'CHESTPLATE') return 'chestplate';
  if (type === 'LEGGINGS') return 'leggings';
  if (type === 'BOOTS') return 'boots';
  if (type === 'ACCESSORY') return 'talisman';
  if (type === 'PET') return 'pet';
  if (type === 'MINION') return 'minion';
  // Anything else is left generic: the client picks a shape from the item id,
  // which knows the difference between e.g. redstone dust and a ruby gemstone.
  return 'material';
}

function back(parent: MenuId = 'skyblock'): MenuSlotView {
  return slot(45, 'arrow', 'Go Back', [line('To previous menu', 'gray')], `open:${parent}`);
}

function close(): MenuSlotView {
  return slot(49, 'barrier', 'Close', [line('Close this menu', 'gray')], 'close');
}

export function buildMenu(
  player: PlayerState,
  menuId: MenuId,
  context: Context = {},
  book?: OrderBookSnapshot | null,
  bazaarOrders: BazaarOrder[] = [],
): MenuView {
  switch (menuId) {
    case 'location': return locationMenu(player);
    case 'fast_travel': return travelMenu(player);
    case 'inventory': return inventoryMenu(player);
    case 'profile': return profileMenu(player);
    case 'skills': return skillsMenu(player);
    case 'collections': return collectionsMenu(player, context);
    case 'crafting': return craftingMenu(player, context);
    case 'bazaar': return bazaarMenu(player, bazaarOrders, context);
    case 'bazaar_item': return bazaarItemMenu(player, String(context.itemId ?? ''), book, bazaarOrders);
    case 'bazaar_orders': return bazaarOrdersMenu(player, bazaarOrders, context);
    case 'auction': return auctionMenu(player, context);
    case 'bank': return bankMenu(player);
    case 'npc_shop': return npcMenu(player);
    case 'minions': return minionsMenu(player);
    case 'pets': return petsMenu(player);
    case 'slayers': return slayersMenu(player);
    case 'quests': return questsMenu(player);
    case 'garden': return gardenMenu(player);
    case 'garden_plots': return gardenPlotsMenu(player);
    case 'garden_plant': return gardenPlantMenu(player, context);
    case 'garden_compost': return gardenCompostMenu(player);
    case 'dungeon_stars': return dungeonStarsMenu(player);
    case 'dungeon_chest': return dungeonChestMenu(player);
    case 'trade': return tradeMenu(player, context);
    case 'hotm': return hotmMenu(player);
    case 'alchemy': return alchemyMenu(player);
    case 'bestiary': return bestiaryMenu(player);
    case 'mayor': return mayorMenu();
    case 'museum': return museumMenu(player);
    case 'wardrobe': return wardrobeMenu(player);
    case 'kuudra': return kuudraMenu(player);
    case 'dragons': return dragonsMenu(player);
    case 'dungeons': return dungeonsMenu(player, context);
    case 'accessories': return accessoriesMenu(player);
    case 'enchanting': return enchantingMenu(player, context);
    case 'reforge': return reforgeMenu(player);
    case 'leaderboard': return leaderboardMenu(player);
    case 'backpack': return backpackHubMenu(player);
    case 'backpack_page': return backpackPageMenu(player, context);
    default: return skyblockMenu(player);
  }
}

function skyblockMenu(player: PlayerState): MenuView {
  return {
    id: 'skyblock',
    title: 'SkyBlock Menu',
    rows: 6,
    slots: [
      slot(4, 'player_head', `${player.username}'s SkyBlock Profile`, [
        line(`Health: ${Math.ceil(player.hp)}/${Math.round(player.stats.health)} ❤`, 'green'),
        line(`Defense: ${Math.round(player.stats.defense)} ❈`, 'green'),
        line(`Strength: ${Math.round(player.stats.strength)} ❁`, 'red'),
        line(`Intelligence: ${Math.round(player.stats.intelligence)} ✎`, 'aqua'),
        line(''),
        click(),
      ], 'open:profile'),
      slot(19, 'diamond_sword', 'Your Skills', [line('View your Skill progression and rewards.'), click()], 'open:skills'),
      slot(20, 'painting', 'Collections', [line('View collection milestones and recipe unlocks.'), click()], 'open:collections'),
      slot(21, 'book', 'Recipe Book', [line('Craft recipes unlocked through Collections.'), click()], 'open:crafting'),
      slot(22, 'chest', 'Storage', [
        line('10 double chests — always unlocked.', 'gray'),
        line(`${backpackSlotsUsedTotal(player)} / ${BACKPACK_PAGES * BACKPACK_SIZE} slots used`, 'aqua'),
        click(),
      ], 'open:backpack'),
      slot(23, 'pet', 'Pets', [line(`${player.pets.length} pets`), click()], 'open:pets'),
      slot(24, 'chest', 'Inventory & Equipment', [line('Manage armor, weapons and carried items.'), click()], 'open:inventory'),
      slot(25, 'talisman', 'Accessory Bag', [line(`Magical Power: ${player.magicalPower}`, 'light_purple'), click()], 'open:accessories'),
      slot(10, 'book', 'Quest Book', [
        line(currentQuestStep(player)?.title ?? 'Starter quests complete!', currentQuestStep(player) ? 'yellow' : 'green'),
        line(currentQuestStep(player)?.detail ?? 'Claim your reward.', 'gray'),
        click(),
      ], 'open:quests'),
      slot(11, 'map', 'Fast Travel', [line(`Location: ${ISLANDS[islandForZone(player.zoneId)]?.name ?? player.islandId}`), click()], 'open:fast_travel'),
      slot(12, 'emerald', 'Bazaar', [line('Buy and sell stackable commodities.'), click()], 'open:bazaar'),
      slot(13, 'gold_ingot', 'Auction House', [line('Trade unique weapons, armor and pets.'), click()], 'open:auction'),
      slot(14, 'coin', 'Bank', [line(`Purse: ${Math.floor(player.coins).toLocaleString()}`, 'gold'), line(`Bank: ${Math.floor(player.bank.balance).toLocaleString()}`, 'gold'), click()], 'open:bank'),
      slot(15, 'minion', 'Minions', [line(`${player.minions.length} deployed minions`), click()], 'open:minions'),
      slot(16, 'zombie_head', 'Slayer Quests', [line(player.activeSlayer ? `Active: ${player.activeSlayer.slayerId} Tier ${player.activeSlayer.tier}` : 'No active quest'), click()], 'open:slayers'),
      slot(28, 'wither_skull', 'Dungeons', [line(`Class: ${player.selectedDungeonClass}`), click()], 'open:dungeons'),
      slot(29, 'wheat', 'Garden', [line('Contests, visitors, crop milestones.'), click()], 'open:garden'),
      slot(30, 'mithril', 'Heart of the Mountain', [line('Dwarven commissions and perks.'), click()], 'open:hotm'),
      slot(31, 'compass', 'Current Location', [line(ZONES[player.zoneId]?.name ?? player.zoneId, 'aqua'), click()], 'open:location'),
      slot(32, 'leaderboard', 'Leaderboards', [line('Compare your profile with other players.'), click()], 'open:leaderboard'),
      slot(33, 'chestplate', 'Wardrobe', [line('Swap saved armor sets.'), click()], 'open:wardrobe'),
      slot(34, 'magma', 'Kuudra', [line('Crimson Isle siege.'), click()], 'open:kuudra'),
      slot(35, 'ender_pearl', 'Dragons', [line('Place Summoning Eyes in the End.'), click()], 'open:dragons'),
      slot(37, 'anvil', 'Blacksmith', [line('Enchant and reforge your gear.'), click()], 'open:reforge'),
      slot(38, 'potion', 'Alchemy', [line('Brew potions for Alchemy XP.'), click()], 'open:alchemy'),
      slot(39, 'book', 'Bestiary', [line('Track every mob you have slain.'), click()], 'open:bestiary'),
      slot(40, 'player_head', 'Mayor', [line('Weekly mayor perks.'), click()], 'open:mayor'),
      slot(41, 'painting', 'Museum', [line(`${player.museum?.donated.length ?? 0} donated`), click()], 'open:museum'),
      close(),
    ],
  };
}

function locationMenu(player: PlayerState): MenuView {
  const zone = ZONES[player.zoneId];
  const slots: MenuSlotView[] = [
    slot(4, 'compass', zone?.name ?? player.zoneId, [line(zone?.description ?? '', 'gray'), line(`Area: ${ISLANDS[zone?.islandId ?? player.islandId]?.name ?? zone?.islandId ?? 'Unknown'}`, 'aqua')]),
  ];
  (zone?.actions ?? []).slice(0, 14).forEach((action, i) => {
    const target = typeof action.target === 'string' ? ITEMS[action.target] ?? MOBS[action.target] : undefined;
    slots.push(slot(10 + i + Math.floor(i / 7) * 2, action.kind === 'combat' ? 'sword' : action.kind === 'mine' ? 'pickaxe' : action.kind === 'farm' ? 'hoe' : action.kind === 'forage' ? 'axe' : 'fishing_rod', action.label, [
      line(action.description),
      line(`+${action.xp} ${action.skill ?? ''} XP`, 'aqua'),
      target ? line(`Reward: ${target.name}`, 'green') : line(''),
      line('Click to perform!', 'yellow'),
    ], `action:${action.id}`));
  });
  zonesOnIsland(player.islandId).slice(0, 14).forEach((target, i) => {
    const requirement = target.skillReq;
    const unlocked = !requirement || skillLevel(player, requirement.skill) >= requirement.level;
    slots.push(slot(28 + i + Math.floor(i / 7) * 2, 'sign', `${target.id === player.zoneId ? '▶ ' : ''}${target.name}`, [
      line(target.description),
      requirement && !unlocked ? line(`Requires ${pretty(requirement.skill)} ${requirement.level}`, 'red') : line('Walk there, or click to skip the stroll.', 'gray'),
    ], unlocked ? `travel:${target.id}` : undefined, { disabled: !unlocked }));
  });
  slots.push(back(), slot(48, 'warp_gate', 'Warp Gate', [line('Travel to another area.'), click()], 'open:fast_travel', { itemId: 'ender_pearl' }), close());
  return { id: 'location', title: `Location: ${zone?.name ?? player.zoneId}`, rows: 6, slots, parent: 'skyblock' };
}

function travelMenu(player: PlayerState): MenuView {
  const islands = warpableIslands();
  return {
    id: 'fast_travel',
    title: 'Warp Gate',
    rows: 6,
    slots: [
      slot(4, 'warp_gate', 'Fast Travel', [
        line('Walk the Hub. Warp to the Park, Gold Mine, The End, and more.', 'gray'),
        line(`Location: ${ISLANDS[player.islandId]?.name ?? player.islandId}`, 'aqua'),
      ], undefined, { itemId: 'ender_pearl' }),
      ...islands.map((island, i) => {
        const requirement = island.skillReq;
        const unlocked = !requirement || skillLevel(player, requirement.skill) >= requirement.level;
        const here = island.id === player.islandId;
        const warpItem = ISLAND_WARP_ITEM[island.id];
        return slot(GRID[i], `island_${island.id}`, `${here ? '▶ ' : ''}${island.name}`, [
          line(island.description),
          line(`${zonesOnIsland(island.id).length} areas to explore`, 'gray'),
          requirement
            ? line(`Requires ${pretty(requirement.skill)} ${requirement.level} (you: ${skillLevel(player, requirement.skill)})`, unlocked ? 'green' : 'red')
            : line('Always unlocked', 'green'),
          here ? line('You are already here', 'gray') : line(unlocked ? 'Click to warp!' : 'Locked', unlocked ? 'yellow' : 'red'),
        ], unlocked && !here ? `warp:${island.id}` : undefined, {
          disabled: !unlocked || here,
          ...(warpItem ? { itemId: warpItem } : {}),
        });
      }),
      back(),
      close(),
    ],
    parent: 'skyblock',
  };
}

function inventoryMenu(player: PlayerState): MenuView {
  const equipmentSlots: Array<[keyof PlayerState['equipment'], number, string]> = [
    ['helmet', 10, 'helmet'],
    ['chestplate', 19, 'chestplate'],
    ['leggings', 28, 'leggings'],
    ['boots', 37, 'boots'],
  ];
  const slots = equipmentSlots.map(([key, pos, icon]) => {
    const stack = player.equipment[key];
    if (!stack) return slot(pos, icon, `${key[0].toUpperCase()}${key.slice(1)} Slot`, [line('Click an item in your inventory to equip it.', 'gray')], `equipment:${key}`);
    const view = itemSlot(pos, stack.itemId, `unequip:${key}`, stack.qty);
    view.name = `${ITEMS[stack.itemId]?.name ?? stack.itemId} (Equipped)`;
    view.lore = [...buildItemLore(ITEMS[stack.itemId], stack), line(''), line('Click to unequip!', 'yellow')];
    view.glint = Boolean(stack.enchantments && Object.keys(stack.enchantments).length);
    return view;
  });
  slots.push(
    slot(16, 'chest', 'Storage', [line('10 double chests of extra inventory.'), click()], 'open:backpack'),
    slot(24, 'talisman', 'Accessory Bag', [line(`${player.accessories.length} accessories`), line(`Magical Power: ${player.magicalPower}`, 'light_purple'), click()], 'open:accessories'),
    slot(25, 'anvil', 'Reforge Anvil', [click()], 'open:reforge'),
    slot(26, 'enchanting_table', 'Enchanting Table', [click()], 'open:enchanting'),
    back(),
    close(),
  );
  return { id: 'inventory', title: 'Your Equipment', rows: 6, slots, parent: 'skyblock' };
}

function profileMenu(player: PlayerState): MenuView {
  const stats = Object.entries(player.stats).filter(([, value]) => value !== 0);
  return {
    id: 'profile',
    title: `${player.username}'s Profile`,
    rows: 6,
    slots: [
      slot(4, 'player_head', player.username, [
        line(`Purse: ${Math.floor(player.coins).toLocaleString()}`, 'gold'),
        line(`Fairy Souls: ${player.fairySouls}`, 'light_purple'),
        ...profileExtras(player),
      ]),
      ...stats.slice(0, 28).map(([key, value], i) => slot(10 + (i % 7) + Math.floor(i / 7) * 9, 'stat', pretty(key), [line(formatStat(value), statColor(key)), line('Includes gear, skills, pets and accessories.')])),
      back(),
      close(),
    ],
    parent: 'skyblock',
  };
}

function skillsMenu(player: PlayerState): MenuView {
  return {
    id: 'skills',
    title: 'Your Skills',
    rows: 6,
    slots: [
      ...Object.values(SKILLS).map((skill, i) => {
        const progress = levelFromXp(player.skills[skill.id] ?? 0, skill.maxLevel);
        return slot(10 + (i % 7) + Math.floor(i / 7) * 9, skill.id, `${skill.name} ${progress.level}`, [
          line(skill.description),
          line(`Progress: ${Math.floor(progress.intoLevel).toLocaleString()}/${progress.need.toLocaleString()}`, 'aqua'),
          line(`Max Level: ${skill.maxLevel}`, 'yellow'),
        ]);
      }),
      back(),
      close(),
    ],
    parent: 'skyblock',
  };
}

function collectionsMenu(player: PlayerState, context: Context): MenuView {
  const category = (COLLECTION_CATEGORIES.find((entry) => entry.id === context.category)?.id
    ?? 'mining') as CollectionCategory;
  const page = Math.max(0, Number(context.page ?? 0));
  const entries = collectionsInCategory(category);
  const pages = Math.max(1, Math.ceil(entries.length / GRID.length));
  const visible = entries.slice(page * GRID.length, page * GRID.length + GRID.length);
  const categoryName = COLLECTION_CATEGORIES.find((entry) => entry.id === category)?.name ?? 'Collections';

  const tabs = COLLECTION_CATEGORIES.map((entry, i) => {
    const owned = collectionsInCategory(entry.id);
    const maxed = owned.filter((collection) => {
      const amount = player.collections[collection.itemId] ?? 0;
      return collectionProgress(collection, amount).tier >= collection.tiers.length;
    }).length;
    return slot(2 + i, entry.icon, `${entry.id === category ? '▶ ' : ''}${entry.name} Collections`, [
      line(`${owned.length} collections`, 'gray'),
      line(`Completed: ${maxed}/${owned.length}`, 'aqua'),
      line('Click to view!', 'yellow'),
    ], `collection:${entry.id}`, { glint: entry.id === category });
  });

  const items = visible.map((collection, i) => {
    const amount = player.collections[collection.itemId] ?? 0;
    const progress = collectionProgress(collection, amount);
    const view = itemSlot(GRID[i], collection.itemId, undefined, Math.min(64, Math.max(1, Math.floor(amount) || 1)));
    view.name = `${collection.name} Collection`;
    const related = recipesForCollection(collection.itemId);
    const obtain = obtainHintForItem(collection.itemId);
    view.lore = [
      amount > 0
        ? line(`Collected: ${Math.floor(amount).toLocaleString()}`, 'yellow')
        : line('Not discovered yet', 'red', true),
      line(`Tier ${progress.tier}/${progress.maxTier}`, 'aqua'),
      line(obtain, 'gray'),
      line(''),
      line('Unlocks', 'yellow', true),
      ...collection.tiers.flatMap((tier) => {
        const done = amount >= tier.amount;
        const recipes = related.filter((recipe) => (recipe.unlockAmount ?? 0) === tier.amount);
        const rows: LoreLine[] = [
          line(`${done ? '✔' : '✖'} ${tier.amount.toLocaleString()} — ${tier.label}`, done ? 'green' : 'red'),
        ];
        if (!done) {
          for (const recipe of recipes) {
            rows.push(line(`  ${recipe.name}: ${recipe.ingredients.map((ing) => `${ing.qty}× ${ITEMS[ing.itemId]?.name ?? ing.itemId}`).join(', ')}`, 'gray'));
          }
        }
        return rows;
      }),
    ];
    view.glint = progress.tier > 0;
    view.disabled = amount <= 0;
    return view;
  });

  return {
    id: 'collections',
    title: `Collections ➜ ${categoryName}`,
    rows: 6,
    context: { category, page },
    slots: [
      ...tabs,
      ...items,
      ...(items.length ? [] : [slot(22, 'barrier', 'Nothing Collected', [line('Gather resources to start this collection.', 'gray')])]),
      ...pageControls('collections', { category }, page, pages),
      back(),
      close(),
    ],
    parent: 'skyblock',
  };
}

function craftingMenu(player: PlayerState, context: Context): MenuView {
  const category = (RECIPE_CATEGORIES.find((entry) => entry.id === context.category)?.id ?? 'tools') as RecipeCategory;
  const page = Math.max(0, Number(context.page ?? 0));
  const entries = recipesInCategory(category);
  const pages = Math.max(1, Math.ceil(entries.length / GRID.length));
  const visible = entries.slice(page * GRID.length, page * GRID.length + GRID.length);
  const categoryName = RECIPE_CATEGORIES.find((entry) => entry.id === category)?.name ?? 'Recipes';

  const tabs = RECIPE_CATEGORIES.map((entry, i) => {
    const recipes = recipesInCategory(entry.id);
    const unlocked = recipes.filter((recipe) => isRecipeUnlocked(recipe.unlockCollection, recipe.unlockAmount, player.collections)).length;
    return slot(1 + i, entry.icon, `${entry.id === category ? '▶ ' : ''}${entry.name}`, [
      line(`Unlocked: ${unlocked}/${recipes.length}`, 'aqua'),
      line('Click to view!', 'yellow'),
    ], `recipes:${entry.id}`, { glint: entry.id === category });
  });

  const items = visible.map((recipe, i) => {
    const unlocked = isRecipeUnlocked(recipe.unlockCollection, recipe.unlockAmount, player.collections);
    const view = itemSlot(GRID[i], recipe.result.itemId, unlocked ? `craft:${recipe.id}` : undefined, recipe.result.qty);
    view.name = recipe.name;
    view.disabled = !unlocked;
    view.lore = buildRecipeBookLore(recipe, player.collections, (itemId) => countItem(player.inventory, itemId));
    return view;
  });

  return {
    id: 'crafting',
    title: `Recipe Book ➜ ${categoryName}`,
    rows: 6,
    context: { category, page },
    slots: [
      ...tabs,
      ...items,
      ...pageControls('crafting', { category }, page, pages),
      back(),
      close(),
    ],
    parent: 'skyblock',
  };
}

function formatBazaarPrice(price: number): string {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(2)}M`;
  if (price >= 1_000) return `${(price / 1_000).toFixed(1)}k`;
  return price.toFixed(1);
}

function openBazaarOrders(player: PlayerState, bazaarOrders: BazaarOrder[]): MenuSlotView {
  const open = bazaarOrders.filter((order) => order.qty > order.filled).length;
  return slot(40, 'hopper', 'Manage Orders', [
    line(`${open} open order(s)`, 'aqua'),
    line('View and cancel your bazaar orders.', 'gray'),
    click(),
  ], 'open:bazaar_orders');
}

function bazaarProductTile(itemId: ItemId, slotNumber: number, extraLore: LoreLine[] = []): MenuSlotView {
  const view = itemSlot(slotNumber, itemId, `bazaar:${itemId}`);
  view.lore = [
    ...extraLore,
    line('View order book and trade.'),
    line('Click to view product!', 'yellow'),
  ];
  return view;
}

function bazaarSearchSlot(): MenuSlotView {
  return slot(47, 'compass', 'Search', [
    line('Find any bazaar product by name.', 'gray'),
    line('Use the search bar, or click and type in chat.', 'yellow'),
  ], 'bazaarSearch:');
}

function bazaarMenu(_player: PlayerState, bazaarOrders: BazaarOrder[], context: Context = {}): MenuView {
  const query = typeof context.query === 'string' ? context.query.trim() : '';
  if (query) return bazaarSearchMenu(_player, bazaarOrders, { ...context, query });

  const section = context.section as BazaarSection | undefined;
  if (!section) return bazaarHubMenu(_player, bazaarOrders);

  const page = Number(context.page ?? 0);
  const items = bazaarItemsInSection(section);
  const sectionDef = BAZAAR_SECTIONS.find((s) => s.id === section)!;
  const pages = Math.max(1, Math.ceil(items.length / GRID.length));
  const slice = items.slice(page * GRID.length, (page + 1) * GRID.length);

  return {
    id: 'bazaar',
    title: `Bazaar ➜ ${sectionDef.name}`,
    rows: 6,
    context,
    slots: [
      slot(4, sectionDef.icon, sectionDef.name, [
        line(sectionDef.description, 'gray'),
        line(`${items.length} products in this section`, 'aqua'),
        line('Click a product to view the order book.', 'yellow'),
      ]),
      ...slice.map((itemId, i) => bazaarProductTile(itemId, GRID[i]!)),
      ...pageControls('bazaar', context, page, pages),
      slot(45, 'arrow', 'Bazaar Sections', [line('Back to section list', 'gray')], 'open:bazaar'),
      bazaarSearchSlot(),
      openBazaarOrders(_player, bazaarOrders),
      close(),
    ],
    parent: 'skyblock',
  };
}

function bazaarSearchMenu(_player: PlayerState, bazaarOrders: BazaarOrder[], context: Context): MenuView {
  const query = String(context.query ?? '').trim();
  const page = Number(context.page ?? 0);
  const items = searchBazaarItems(query);
  const pages = Math.max(1, Math.ceil(items.length / GRID.length));
  const slice = items.slice(page * GRID.length, (page + 1) * GRID.length);

  return {
    id: 'bazaar',
    title: 'Bazaar ➜ Search',
    rows: 6,
    context,
    slots: [
      slot(4, 'compass', 'Search Results', [
        line(`Query: ${query}`, 'aqua'),
        line(
          items.length ? `${items.length} matching product${items.length === 1 ? '' : 's'}` : 'No products match that name.',
          items.length ? 'gray' : 'red',
        ),
        line('Click a product to view the order book.', 'yellow'),
      ]),
      ...slice.map((itemId, i) => {
        const sectionDef = BAZAAR_SECTIONS.find((entry) => entry.id === getBazaarSection(itemId));
        return bazaarProductTile(
          itemId,
          GRID[i]!,
          sectionDef ? [line(`Section: ${sectionDef.name}`, 'dark_gray')] : [],
        );
      }),
      ...(items.length === 0
        ? [slot(22, 'barrier', 'No Matches', [
          line('Try a shorter name, like "diamond" or "spreading".', 'gray'),
        ])]
        : []),
      ...pageControls('bazaar', context, page, pages),
      slot(45, 'arrow', 'Bazaar Sections', [line('Clear search and return to sections', 'gray')], 'open:bazaar'),
      bazaarSearchSlot(),
      openBazaarOrders(_player, bazaarOrders),
      close(),
    ],
    parent: 'skyblock',
  };
}

function bazaarHubMenu(_player: PlayerState, bazaarOrders: BazaarOrder[]): MenuView {
  const counts = bazaarSectionCounts();
  return {
    id: 'bazaar',
    title: 'Bazaar',
    rows: 6,
    slots: [
      slot(4, 'emerald', 'Bazaar Alley', [
        line(`${BAZAAR_ITEMS.length} tradeable products`, 'aqua'),
        line('Direct Mode — organized by section', 'gray'),
        line('Search or click a section to browse!', 'yellow'),
      ]),
      ...BAZAAR_SECTIONS.map((sec, i) => slot(
        11 + i * 2,
        sec.icon,
        sec.name,
        [
          line(sec.description, 'gray'),
          line(`${counts[sec.id]} products`, 'aqua'),
          click(),
        ],
        `bazaarSection:${sec.id}`,
      )),
      slot(22, 'compass', 'Search', [
        line('Find any product by name — even minion upgrades.', 'gray'),
        line('Use the search bar, or click and type in chat.', 'yellow'),
      ], 'bazaarSearch:'),
      slot(31, 'gold_ingot', 'Sell Inventory', [
        line('Instant-sell every bazaar item in your inventory.', 'gray'),
        line('Keeps tools, armor, and anything not on the Bazaar.', 'dark_gray'),
        line('1.125% bazaar tax applies.', 'dark_gray'),
        line('Click to sell all!', 'yellow'),
      ], 'bazaarSellInventory', { itemId: 'gold_ingot' }),
      openBazaarOrders(_player, bazaarOrders),
      back(),
      close(),
    ],
    parent: 'skyblock',
  };
}

const BUY_BOOK_SLOTS = [10, 11, 12, 19, 20];
const SELL_BOOK_SLOTS = [14, 15, 16, 23, 24];

function orderBookLevelSlot(
  slotNumber: number,
  side: 'buy' | 'sell',
  itemId: ItemId,
  level: OrderBookSnapshot['buys'][number] | undefined,
): MenuSlotView {
  if (!level) {
    return slot(slotNumber, 'gray_stained_glass_pane', side === 'buy' ? 'No Buy Orders' : 'No Sell Orders', [
      line('No orders at this level.', 'dark_gray'),
    ], undefined, { disabled: true });
  }
  const action = side === 'buy'
    ? `bazaarBuyAt:${itemId}@${level.price}`
    : `bazaarSellAt:${itemId}@${level.price}`;
  return slot(
    slotNumber,
    side === 'buy' ? 'lime_dye' : 'red_dye',
    `${formatBazaarPrice(level.price)} coins`,
    [
      line(side === 'buy' ? 'Buy Order' : 'Sell Order', side === 'buy' ? 'green' : 'red', true),
      line(`${level.qty.toLocaleString()} available`, 'white'),
      line(`${level.orders} order${level.orders === 1 ? '' : 's'}`, 'gray'),
      line(side === 'buy' ? 'Click: create buy order @ price' : 'Click: create sell offer @ price', 'yellow'),
    ],
    action,
  );
}

function bazaarItemMenu(
  player: PlayerState,
  itemId: ItemId,
  book?: OrderBookSnapshot | null,
  bazaarOrders: BazaarOrder[] = [],
): MenuView {
  const def = ITEMS[itemId];
  const bestBuy = book?.bestAsk;
  const bestSell = book?.bestBid;
  const myOrders = bazaarOrders.filter((order) => order.itemId === itemId && order.qty > order.filled);

  return {
    id: 'bazaar_item',
    title: `Bazaar ➜ ${def?.name ?? itemId}`,
    rows: 6,
    context: { itemId },
    slots: [
      itemSlot(13, itemId),
      slot(9, 'sign', 'Buy Orders', [line('Institutional buy orders', 'green'), line('You sell to these prices', 'gray')]),
      slot(17, 'sign', 'Sell Orders', [line('Institutional sell orders', 'red'), line('You buy from these prices', 'gray')]),
      ...BUY_BOOK_SLOTS.map((slotNumber, index) => orderBookLevelSlot(slotNumber, 'buy', itemId, book?.buys[index])),
      ...SELL_BOOK_SLOTS.map((slotNumber, index) => orderBookLevelSlot(slotNumber, 'sell', itemId, book?.sells[index])),
      slot(29, 'emerald', 'Buy Instantly', [
        line(bestBuy == null ? 'No sell offers' : `${formatBazaarPrice(bestBuy)} coins each`, 'gold'),
        line('Left-click: Buy 1', 'yellow'),
        line('Right-click: Buy 64', 'yellow'),
      ], `bazaarBuy:${itemId}`, { disabled: bestBuy == null }),
      slot(30, 'paper', 'Create Buy Order', [
        line(`Top bid: ${bestSell == null ? '—' : formatBazaarPrice(bestSell)}`, 'green'),
        line('Places 64 @ top bid + 0.1', 'gray'),
        line('Click to create!', 'yellow'),
      ], `bazaarBuyOrder:${itemId}`),
      slot(32, 'book', 'Create Sell Offer', [
        line(`Top ask: ${bestBuy == null ? '—' : formatBazaarPrice(bestBuy)}`, 'red'),
        line('Offers up to 64 @ top ask − 0.1', 'gray'),
        line('Click to create!', 'yellow'),
      ], `bazaarSellOrder:${itemId}`),
      slot(33, 'gold_nugget', 'Sell Instantly', [
        line(bestSell == null ? 'No buy offers' : `${formatBazaarPrice(bestSell)} coins each`, 'gold'),
        line('Left-click: Sell 1', 'yellow'),
        line('Right-click: Sell 64', 'yellow'),
      ], `bazaarSell:${itemId}`, { disabled: bestSell == null }),
      slot(31, 'chest', 'Your Orders', [
        line(`${myOrders.length} open on this product`, 'aqua'),
        line('Manage all orders in Manage Orders', 'gray'),
        click(),
      ], 'open:bazaar_orders'),
      openBazaarOrders(player, bazaarOrders),
      back('bazaar'),
      close(),
    ],
    parent: 'bazaar',
  };
}

function bazaarOrdersMenu(player: PlayerState, bazaarOrders: BazaarOrder[], context: Context): MenuView {
  const page = Number(context.page ?? 0);
  const open = bazaarOrders.filter((order) => order.qty > order.filled);
  const pages = Math.max(1, Math.ceil(open.length / GRID.length));
  const slice = open.slice(page * GRID.length, (page + 1) * GRID.length);
  const parent = context.itemId ? 'bazaar_item' : 'bazaar';

  return {
    id: 'bazaar_orders',
    title: 'Manage Orders',
    rows: 6,
    context,
    slots: [
      slot(4, 'book', 'Your Bazaar Orders', [
        line(`${open.length} open order(s)`, 'aqua'),
        line('Click an order to cancel it.', 'yellow'),
        line('Coins/items are refunded on cancel.', 'gray'),
      ]),
      ...(open.length === 0
        ? [slot(22, 'barrier', 'No Open Orders', [line('Create orders from a product page.', 'gray'), line('Go back and pick an item.', 'yellow')])]
        : slice.map((order, index) => {
          const def = ITEMS[order.itemId];
          const remaining = order.qty - order.filled;
          const view = itemSlot(GRID[index], order.itemId, `bazaarCancel:${order.id}`);
          view.name = `${order.side === 'buy' ? 'Buy' : 'Sell'} · ${def?.name ?? order.itemId}`;
          view.lore = [
            line(`${remaining.toLocaleString()}x @ ${formatBazaarPrice(order.price)} coins`, 'gold'),
            line(`Filled: ${order.filled}/${order.qty}`, 'gray'),
            line('Click to cancel order', 'red'),
          ];
          return view;
        })),
      ...pageControls('bazaar_orders', context, page, pages),
      back(parent as MenuId),
      close(),
    ],
    parent: parent as MenuId,
  };
}

function bankMenu(player: PlayerState): MenuView {
  const tier = bankTier(player.bank.tier);
  const upgrade = nextBankTier(player.bank.tier);
  const balance = Math.floor(player.bank.balance);
  const purse = Math.floor(player.coins);
  const nextInterestMinutes = Math.ceil(msUntilNextInterest(player.bank) / 60_000);
  const hours = Math.floor(nextInterestMinutes / 60);
  const minutes = nextInterestMinutes % 60;

  const amounts: Array<[string, string]> = [['100', '100'], ['1000', '1,000'], ['10000', '10,000'], ['half', 'Half'], ['all', 'Everything']];

  return {
    id: 'bank',
    title: 'Personal Bank',
    rows: 5,
    slots: [
      slot(4, 'bank_vault', tier.name, [
        line(`Balance: ${balance.toLocaleString()} Coins`, 'gold'),
        line(`Purse: ${purse.toLocaleString()} Coins`, 'gold'),
        line(`Capacity: ${tier.cap.toLocaleString()} Coins`, 'gray'),
        line(''),
        line(`Interest rate: ${(tier.rate * 100).toFixed(2)}% every 6 hours`, 'green'),
        line('Interest is paid whether you are online or not.', 'green'),
        line(`Next payout in ${hours}h ${minutes}m`, 'aqua'),
      ]),
      ...amounts.map(([id, label], i) => slot(10 + i, `deposit_${id}`, `Deposit ${label}`, [
        line(`Move ${label.toLowerCase()} from your purse into the bank.`, 'gray'),
        line('Deposited coins are safe from death.', 'green'),
        line('Click to deposit!', 'yellow'),
      ], `bank:deposit/${id}`, { disabled: purse <= 0 })),
      ...amounts.map(([id, label], i) => slot(19 + i, `withdraw_${id}`, `Withdraw ${label}`, [
        line(`Move ${label.toLowerCase()} from the bank into your purse.`, 'gray'),
        line('Click to withdraw!', 'yellow'),
      ], `bank:withdraw/${id}`, { disabled: balance <= 0 })),
      upgrade
        ? slot(31, 'gold_block', `Upgrade to ${upgrade.name}`, [
            line(`Cost: ${upgrade.upgradeCost.toLocaleString()} Coins`, 'gold'),
            line(`Capacity: ${upgrade.cap.toLocaleString()} Coins`, 'gray'),
            line(`Interest: ${(upgrade.rate * 100).toFixed(2)}% every 6 hours`, 'green'),
            line(purse >= upgrade.upgradeCost ? 'Click to upgrade!' : 'Not enough coins in your purse', purse >= upgrade.upgradeCost ? 'yellow' : 'red'),
          ], 'bank:upgrade', { disabled: purse < upgrade.upgradeCost })
        : slot(31, 'nether_star', 'Maximum Account', [line('You own the best bank account.', 'green')]),
      slot(29, 'clock', 'Interest Brackets', [
        line('First 10M coins earn the full rate.', 'gray'),
        line('10M–100M earns 25% of the rate.', 'gray'),
        line('Above 100M earns 5% of the rate.', 'gray'),
        line('Offline interest compounds for up to 7 days.', 'aqua'),
      ]),
      slot(33, 'leaderboard', 'Account Tiers', BANK_TIERS.map((entry) => line(
        `${entry.id === tier.id ? '▶ ' : ''}${entry.name}: ${(entry.rate * 100).toFixed(2)}% / ${entry.cap.toLocaleString()} cap`,
        entry.id === tier.id ? 'green' : 'gray',
      ))),
      slot(36, 'arrow', 'Go Back', [line('To SkyBlock Menu')], 'open:skyblock'),
      slot(40, 'barrier', 'Close', [line('Close this menu')], 'close'),
    ],
    parent: 'skyblock',
  };
}

function npcMenu(player: PlayerState): MenuView {
  const npc = ZONES[player.zoneId]?.npc;
  const sellableStacks = player.inventory.filter(
    (stack) => stack != null && npcSellPrice(stack.itemId) != null,
  ).length;

  return {
    id: 'npc_shop',
    title: npc?.name ?? 'NPC Shop',
    rows: 6,
    slots: [
      slot(4, 'villager', npc?.name ?? 'No Merchant', [
        line(npc?.greeting ?? 'There is no shop at this location.'),
        line('Click items in your inventory below to sell them!', 'yellow'),
        line('Left: sell 1 · Right: sell 64 · Shift: sell all', 'gray'),
      ]),
      slot(13, 'gold_ingot', 'Sell Items', [
        line('Every item has a sell price.', 'white'),
        line(`${sellableStacks} sellable stack(s) in inventory`, 'aqua'),
        line('Use your inventory below — not these slots.', 'gray'),
      ]),
      ...(npc?.sells ?? []).map((listing, i) => {
        const view = itemSlot(19 + i, listing.itemId, `npcBuy:${listing.itemId}`);
        view.lore = [...view.lore.slice(0, -1), line(`Buy Price: ${listing.price} Coins`, 'gold'), line('Click to buy!', 'yellow')];
        return view;
      }),
      ...(npc?.buys ?? []).map((listing, i) => {
        const sellPrice = npcSellPrice(listing.itemId) ?? listing.price;
        const view = itemSlot(28 + i, listing.itemId, `npcSell:${listing.itemId}`);
        view.lore = [
          ...view.lore.slice(0, -1),
          line(`Sell Price: ${sellPrice} Coins`, 'gold'),
          line('Click to sell from inventory', 'yellow'),
        ];
        return view;
      }),
      back('location'),
      close(),
    ],
    parent: 'location',
  };
}

function minionsMenu(player: PlayerState): MenuView {
  const slotsMax = maxMinionSlots(skyblockLevelFromXp(skyblockXp({
    skills: player.skills,
    collections: player.collections,
    slayerXp: player.slayerXp,
    fairySouls: player.fairySouls,
    museumDonated: player.museum?.donated.length ?? 0,
    bestiaryKills: Object.values(player.bestiary?.kills ?? {}).reduce((sum, n) => sum + n, 0),
  })).level);
  const deploySlots: MenuSlotView[] = [];
  const seen = new Set<string>();
  for (const stack of player.inventory) {
    if (!stack) continue;
    const type = minionTypeFromItem(stack.itemId);
    if (!type || seen.has(type)) continue;
    seen.add(type);
    const def = ensureMinionDef(type);
    deploySlots.push(slot(1 + deploySlots.length, 'minion', `Place ${def.name}`, [
      line(`In inventory: ${stack.qty}`, 'gray'),
      line('Produces resources while you play (and offline).', 'gray'),
      line('Click to deploy!', 'yellow'),
    ], `placeMinion:${type}`));
    if (deploySlots.length >= 7) break;
  }

  const deployed = player.minions.slice(0, 21).map((minion, i) => slot(10 + (i % 7) + Math.floor(i / 7) * 9, 'minion', `${pretty(minion.type)} Minion ${roman(minion.tier)}`, [
    line(`Stored resources: ${minion.storage}`, 'yellow'),
    line(`Tier: ${minion.tier}/11`, 'aqua'),
    line(`Upgrades: ${minion.upgrades?.length ? minion.upgrades.join(', ') : 'none'}`, 'gray'),
    line(minion.fuel && minion.fuel.expiresAt > Date.now() ? 'Fuel active' : 'No fuel', minion.fuel && minion.fuel.expiresAt > Date.now() ? 'green' : 'gray'),
    line('Left-click to collect · click then use fuel/upgrades from inventory', 'yellow'),
    line('Right-click to upgrade tier', 'yellow'),
    line('Shift-click to pick up', 'yellow'),
  ], `minion:${minion.id}`));

  const upgradeSlots: MenuSlotView[] = [];
  for (const minion of player.minions) {
    for (const [upgradeId, label] of [['super_compactor', 'Super Compactor'], ['diamond_spreading', 'Diamond Spreading']] as const) {
      if (countItem(player.inventory, upgradeId) <= 0) continue;
      if (minion.upgrades?.includes(upgradeId)) continue;
      if (upgradeSlots.length >= 4) break;
      upgradeSlots.push(slot(37 + upgradeSlots.length, upgradeId, `Install ${label}`, [
        line(`On ${pretty(minion.type)} Minion T${minion.tier}`, 'gray'),
        line('Click to install on this minion.', 'yellow'),
      ], `minionUpgrade:${minion.id}/${upgradeId}`));
    }
    if (upgradeSlots.length >= 4) break;
  }

  const emptyHint = player.minions.length === 0 && deploySlots.length === 0
    ? [slot(22, 'barrier', 'No Minions Yet', [
      line('Craft a Tier I minion in the Recipe Book'),
      line('(Minions category), then click it here to deploy.', 'yellow'),
    ])]
    : [];

  return {
    id: 'minions',
    title: 'Your Minions',
    rows: 6,
    slots: [
      slot(8, 'minion', 'Minion Slots', [
        line(`${player.minions.length} / ${slotsMax} placed`, 'aqua'),
        line('Gain extra slots every 5 SkyBlock levels (max 10).', 'gray'),
      ]),
      ...deploySlots,
      ...deployed,
      ...upgradeSlots,
      ...emptyHint,
      slot(48, 'crafting_table', 'Craft Minion', [line('Use Collection recipes to craft more minions.'), click()], 'open:crafting'),
      back(),
      close(),
    ],
    parent: 'skyblock',
  };
}

function petsMenu(player: PlayerState): MenuView {
  return {
    id: 'pets',
    title: 'Pets',
    rows: 6,
    slots: [
      ...player.pets.slice(0, 21).map((pet, i) => {
        const view = itemSlot(10 + (i % 7) + Math.floor(i / 7) * 9, pet.itemId, `pet:${i}`);
        view.name = `${pet.active ? '▶ ' : ''}[Lvl ${pet.level}] ${ITEMS[pet.itemId]?.name.replace(/^\[Lvl \d+\] /, '') ?? pet.itemId}`;
        view.lore = [...view.lore, line(`XP: ${Math.floor(pet.xp).toLocaleString()}`, 'aqua'), line(pet.active ? 'Active Pet' : 'Click to summon!', pet.active ? 'green' : 'yellow')];
        return view;
      }),
      ...PET_EGGS.filter((egg) => countItem(player.inventory, egg.egg) > 0).slice(0, 5).map((egg, i) =>
        slot(37 + i, egg.egg, `Hatch ${ITEMS[egg.egg]?.name ?? egg.egg}`, [
          line('Click to hatch this egg into a pet.', 'yellow'),
        ], `hatch:${egg.egg}`)),
      back(),
      close(),
    ],
    parent: 'skyblock',
  };
}

function questsMenu(player: PlayerState): MenuView {
  const current = currentQuestStep(player);
  const done = starterQuestComplete(player);
  return {
    id: 'quests',
    title: 'Quest Book',
    rows: 6,
    slots: [
      slot(4, 'book', 'Starter Questline', [
        line(done ? 'All steps complete!' : `Next: ${current?.title ?? '—'}`, done ? 'green' : 'yellow'),
        line('Follow these like early SkyBlock.', 'gray'),
      ]),
      ...STARTER_QUEST_STEPS.map((step, i) => {
        const complete = isQuestStepDone(player, step.id);
        return slot(10 + i + Math.floor(i / 7) * 2, complete ? 'emerald' : 'paper', `${complete ? '✔ ' : ''}${step.title}`, [
          line(step.detail),
          line(complete ? 'Complete' : 'In progress', complete ? 'green' : 'yellow'),
        ]);
      }),
      done && !player.quests?.claimed
        ? slot(31, 'gold_ingot', 'Claim Reward', [line('+500 coins and Enchanted Cobblestone', 'gold'), click()], 'questClaim')
        : slot(31, player.quests?.claimed ? 'emerald' : 'barrier', player.quests?.claimed ? 'Reward Claimed' : 'Keep going', [
          line(done ? 'Already claimed.' : 'Finish every step to claim.', 'gray'),
        ]),
      back(),
      close(),
    ],
    parent: 'skyblock',
  };
}

function slayersMenu(player: PlayerState): MenuView {
  return {
    id: 'slayers',
    title: 'Slayer',
    rows: 6,
    slots: [
      ...SLAYERS.map((slayer, i) => {
        const tierOne = slayer.tiers[0];
        const canAfford = player.coins >= tierOne.cost;
        const blocked = Boolean(player.activeSlayer);
        return slot(11 + i * 2, `${slayer.targetMob}_head`, slayer.name, [
          line(`Slayer XP: ${(player.slayerXp[slayer.id] ?? 0).toLocaleString()}`, 'light_purple'),
          line(`RNG Meter: ${Math.floor(player.slayerRngMeter?.[slayer.id] ?? 0)}/100`, 'aqua'),
          line('Fill the meter for a guaranteed rare drop.', 'gray'),
          ...slayer.tiers.map((tier) => line(`Tier ${roman(tier.tier)}: ${tier.health.toLocaleString()} ❤ — ${tier.cost.toLocaleString()} coins`, 'gray')),
          line('Left-click: Start Tier I', 'yellow'),
          line('Right-click: Start highest affordable tier', 'yellow'),
          blocked ? line('Finish your current quest first.', 'red') : !canAfford ? line(`Need ${tierOne.cost.toLocaleString()} coins for Tier I`, 'red') : line('Click to start!', 'green'),
        ], `slayer:${slayer.id}`, { disabled: blocked || !canAfford });
      }),
      player.activeSlayer ? slot(31, 'sword', 'Active Quest', [
        line(`${player.activeSlayer.slayerId} Tier ${player.activeSlayer.tier}`, 'red'),
        line(`Combat XP: ${player.activeSlayer.progressXp}/${player.activeSlayer.requiredXp}`, 'yellow'),
        player.activeSlayer.bossHp
          ? line(`Boss spawned in the world! Walk up and press E. HP: ${player.activeSlayer.bossHp.toLocaleString()}`, 'red')
          : line('Kill the target mobs in the world to spawn the boss.'),
      ], 'slayer:active') : slot(31, 'barrier', 'No Active Quest', [line('Select a Slayer boss above.')]),
      back(),
      close(),
    ],
    parent: 'skyblock',
  };
}

function dungeonsMenu(player: PlayerState, context: Context = {}): MenuView {
  const combat = skillLevel(player, 'combat');
  const unlocked = combat >= DUNGEON_COMBAT_REQUIREMENT;
  const catacombs = skillLevel(player, 'dungeoneering');
  const mode = context.mode === 'master' ? 'master' : 'regular';
  const floors = mode === 'master' ? masterFloors() : regularFloors();

  if (!unlocked) {
    return {
      id: 'dungeons',
      title: 'Catacombs — Locked',
      rows: 3,
      slots: [
        slot(13, 'barrier', 'Dungeons Locked', [
          line(`Requires Combat ${DUNGEON_COMBAT_REQUIREMENT}`, 'red'),
          line(`Your Combat level: ${combat}`, 'yellow'),
          line(''),
          line('Fight mobs in the Graveyard, Wilderness', 'gray'),
          line("and Spider's Den to level up Combat.", 'gray'),
        ]),
        slot(18, 'arrow', 'Go Back', [line('To SkyBlock Menu')], 'open:skyblock'),
        slot(22, 'barrier', 'Close', [line('Close this menu')], 'close'),
      ],
      parent: 'skyblock',
    };
  }

  return {
    id: 'dungeons',
    title: `Catacombs — Level ${catacombs}`,
    rows: 6,
    context: { mode },
    slots: [
      slot(4, 'nether_star', 'Star Upgrades', [
        line('Spend dungeon essence to star your gear.', 'gray'),
        line(Object.entries(player.essence ?? {}).map(([type, qty]) => `${type}: ${qty}`).join(' · ') || 'No essence yet — clear floors to earn some.', 'aqua'),
        click(),
      ], 'open:dungeon_stars'),
      ...(player.pendingDungeonChest?.drops.length
        ? [slot(16, 'chest', 'Unclaimed Dungeon Chest', [
          line(player.pendingDungeonChest.floorName, 'gold'),
          line(`${player.pendingDungeonChest.drops.length} item(s) waiting`, 'yellow'),
          click(),
        ], 'open:dungeon_chest', { glint: true })]
        : []),
      ...(['berserk', 'archer', 'mage', 'tank', 'healer'] as const).map((dungeonClass, i) => slot(11 + i, dungeonClass, `${player.selectedDungeonClass === dungeonClass ? '▶ ' : ''}${pretty(dungeonClass)}`, [
        line('Click to select class!', 'yellow'),
      ], `class:${dungeonClass}`, { glint: player.selectedDungeonClass === dungeonClass })),
      slot(20, mode === 'regular' ? 'lime_dye' : 'gray_dye', 'Regular Mode', [
        line(mode === 'regular' ? 'Currently selected' : 'Switch to Regular F1–F7', mode === 'regular' ? 'green' : 'gray'),
        line('Standard Catacombs floors', 'aqua'),
      ], 'dungeonMode:regular', { glint: mode === 'regular' }),
      slot(24, mode === 'master' ? 'lime_dye' : 'gray_dye', 'Master Mode', [
        line(mode === 'master' ? 'Currently selected' : 'Switch to Master M1–M7', mode === 'master' ? 'green' : 'gray'),
        line('Harder floors with better drops', 'red'),
        line('Hyperion, Terminator & wither blades on M7', 'gold'),
      ], 'dungeonMode:master', { glint: mode === 'master' }),
      ...floors.map((floor, i) => {
        const ready = catacombs >= floor.requiredLevel;
        return slot(28 + i, 'dungeon_portal', floor.shortName, [
          line(floor.name, 'gold'),
          line(ready ? 'Catacombs requirement met' : `Requires Catacombs ${floor.requiredLevel}`, ready ? 'green' : 'red'),
          line(`${floor.rooms} combat rooms + boss`, 'gray'),
          line(`Boss: ${floor.boss.name} — ${floor.boss.health.toLocaleString()} ❤`, 'red'),
          line(`Reward: ${floor.baseCatacombsXp} Catacombs XP + ${floor.coinReward.toLocaleString()} coins`, 'aqua'),
          line(floor.drops.length ? `Drops: ${floor.drops.slice(0, 3).map((d) => ITEMS[d.itemId]?.name ?? d.itemId).join(', ')}…` : 'No special drops', 'yellow'),
          line(ready ? 'Enter → Starter Room → Wither Door' : 'Locked', ready ? 'yellow' : 'red'),
        ], ready ? `dungeon:${floor.id}` : undefined, { disabled: !ready });
      }),
      player.dungeonRun
        ? slot(22, 'map', 'Resume Dungeon Run', [
            line(`Floor: ${player.dungeonRun.floorId.toUpperCase()}`, 'aqua'),
            line(`Phase: ${dungeonPhase(player.dungeonRun)}`, 'gray'),
            line(dungeonPhase(player.dungeonRun) === 'rooms'
              ? `Room ${player.dungeonRun.room}/${player.dungeonRun.rooms}${player.dungeonRun.roomCleared ? ' — door unlocked!' : ' — kill mobs first'}`
              : dungeonPhase(player.dungeonRun) === 'boss' ? 'Boss fight!' : 'Starter Room — open Wither Door'),
            line(`Score: ${player.dungeonRun.score}`, 'yellow'),
            line(`Class: ${pretty(player.dungeonRun.dungeonClass)}`, 'gray'),
            line('Return to your run in-world', 'yellow'),
          ], 'dungeon:continue')
        : slot(22, 'wither_skull', 'No Active Run', [line('Select a floor below to enter.', 'gray'), line('Walk to the Wither Door inside!', 'gray')]),
      ...(player.dungeonRun ? [slot(24, 'barrier', 'Leave Dungeon', [line('Abandon this run and return to the Dungeon Hub.', 'red'), line('Or type /leave in chat.', 'gray')], 'dungeon:leave')] : []),
      slot(46, 'player_head', 'Host Party', [line('Invite players in the Dungeon Hub to your run.'), click()], 'dungeonParty'),
      slot(47, 'emerald', 'Join Nearby Party', [line('Join the first hosted run in the Hub.'), click()], 'dungeonJoin:nearby'),
      back(),
      close(),
    ],
    parent: 'skyblock',
  };
}

function dungeonChestMenu(player: PlayerState): MenuView {
  const chest = player.pendingDungeonChest;
  if (!chest) {
    return {
      id: 'dungeon_chest',
      title: 'Dungeon Chest',
      rows: 3,
      slots: [
        slot(13, 'barrier', 'Already claimed', [line('Clear another floor for a new chest.')]),
        slot(18, 'arrow', 'Go Back', [line('Catacombs')], 'open:dungeons'),
        close(),
      ],
      parent: 'dungeons',
    };
  }
  const dropSlots = chest.drops.slice(0, 7).map((drop, i) => {
    const def = ITEMS[drop.itemId];
    return slot(19 + i, drop.itemId, def?.name ?? drop.itemId, [
      line(`${drop.qty}x`, 'yellow'),
      line(def?.rarity ?? 'COMMON', 'gold'),
      line('Click the chest to claim everything.', 'gray'),
    ], 'dungeonChest:claim', {
      itemId: drop.itemId,
      count: drop.qty,
      rarity: def?.rarity ?? 'COMMON',
      glint: ['RARE', 'EPIC', 'LEGENDARY', 'MYTHIC', 'DIVINE'].includes(def?.rarity ?? ''),
    });
  });
  return {
    id: 'dungeon_chest',
    title: `${chest.floorName} Chest`,
    rows: 4,
    slots: [
      slot(4, 'chest', 'Dungeon Reward Chest', [
        line(`+${chest.xp} Catacombs XP already granted`, 'aqua'),
        line(`+${chest.coins.toLocaleString()} coins already granted`, 'gold'),
        line(chest.starLabel ?? 'No gear was starred this run', chest.starLabel ? 'light_purple' : 'gray'),
        line(chest.drops.length ? 'Click to claim drops!' : 'Empty chest', 'yellow'),
      ], 'dungeonChest:claim', { glint: chest.drops.length > 0 }),
      ...dropSlots,
      slot(27, 'arrow', 'Go Back', [line('Catacombs')], 'open:dungeons'),
      close(),
    ],
    parent: 'dungeons',
  };
}

function backpackSlotsUsedTotal(player: PlayerState): number {
  return normalizeBackpacks(player.backpacks).reduce((sum, pack) => sum + backpackSlotsUsed(pack), 0);
}

function stackMenuSlot(slotNumber: number, stack: PlayerState['inventory'][number], action?: string): MenuSlotView {
  if (!stack) return slot(slotNumber, '', '', [], action);
  const def = ITEMS[stack.itemId];
  if (!def) return slot(slotNumber, 'barrier', 'Unknown Item', [line(stack.itemId, 'red')], action);
  return slot(slotNumber, def.sprite ?? spriteFor(stack.itemId, def.type), def.name, buildItemLore(def, stack), action, {
    itemId: stack.itemId,
    count: stack.qty,
    rarity: def.rarity ?? 'COMMON',
    glint: Boolean(stack.enchantments && Object.keys(stack.enchantments).length),
  });
}

function backpackHubMenu(player: PlayerState): MenuView {
  const packs = normalizeBackpacks(player.backpacks);
  const positions = [11, 12, 13, 14, 15, 20, 21, 22, 23, 24];
  const slots: MenuSlotView[] = [
    slot(4, 'chest', 'Storage', [
      line('Ten double chests of extra space.', 'gray'),
      line('No collection unlock required.', 'green'),
      line(`${backpackSlotsUsedTotal(player)} / ${BACKPACK_PAGES * BACKPACK_SIZE} slots used`, 'aqua'),
    ]),
  ];
  for (let i = 0; i < BACKPACK_PAGES; i++) {
    const used = backpackSlotsUsed(packs[i]);
    slots.push(slot(positions[i], 'chest', `Backpack ${i + 1}`, [
      line('Double Chest', 'dark_gray'),
      line(`${used} / ${BACKPACK_SIZE} slots used`, used >= BACKPACK_SIZE ? 'red' : 'aqua'),
      line(''),
      line('Click to open!', 'yellow'),
    ], `backpack:open:${i}`));
  }
  slots.push(back(), close());
  return { id: 'backpack', title: 'Storage', rows: 6, slots, parent: 'skyblock' };
}

function backpackPageMenu(player: PlayerState, context: Context): MenuView {
  const page = Math.max(0, Math.min(BACKPACK_PAGES - 1, Number(context.page ?? 0) || 0));
  const pack = normalizeBackpacks(player.backpacks)[page];
  const slots = pack.map((stack, index) => stackMenuSlot(index, stack, `backpack:click:${index}`));
  return {
    id: 'backpack_page',
    title: `Backpack ${page + 1}`,
    rows: 6,
    slots,
    parent: 'backpack',
    context: { page },
  };
}

function accessoriesMenu(player: PlayerState): MenuView {
  const limit = accessoryBagSlots(player.fairySouls);
  const nextSoulSlot = limit < 27 ? BASE_ACCESSORY_BAG_SLOTS + Math.floor(player.fairySouls / FAIRY_SOULS_PER_BAG_SLOT) + 1 : null;
  const soulsForNext = nextSoulSlot != null ? nextSoulSlot * FAIRY_SOULS_PER_BAG_SLOT - player.fairySouls : 0;
  const slots: MenuSlotView[] = [];

  for (let i = 0; i < limit; i++) {
    const pos = 10 + (i % 7) + Math.floor(i / 7) * 9;
    const stack = player.accessories[i];
    if (stack) {
      const view = itemSlot(pos, stack.itemId, `accessory:${i}`, stack.qty);
      view.lore = [...buildItemLore(ITEMS[stack.itemId], stack), line(''), line('Click to remove from bag!', 'yellow')];
      slots.push(view);
    } else {
      slots.push(slot(pos, 'gray_stained_glass_pane', 'Empty Accessory Slot', [
        line('Shift-click an accessory from inventory', 'gray'),
        line('to store it here for stat bonuses.', 'gray'),
      ]));
    }
  }

  slots.push(
    slot(4, 'talisman', 'Accessory Bag', [
      line(`${player.accessories.length}/${limit} slots used`, 'aqua'),
      line(`Magical Power: ${player.magicalPower}`, 'light_purple'),
      line(`Base ${BASE_ACCESSORY_BAG_SLOTS} slots + 1 per ${FAIRY_SOULS_PER_BAG_SLOT} Fairy Souls`, 'gray'),
      nextSoulSlot != null && soulsForNext > 0
        ? line(`${soulsForNext} more soul${soulsForNext === 1 ? '' : 's'} for slot ${nextSoulSlot}!`, 'yellow')
        : line('Maximum bag slots reached!', 'green'),
      line('Shift-click accessories from inventory to equip.', 'yellow'),
    ]),
    slot(48, 'nether_star', 'Magical Power', [
      line(`${player.magicalPower} Magical Power`, 'light_purple'),
      line('+1 ✎ Intelligence per Magical Power.', 'aqua'),
      line('Higher-rarity unique accessories grant more MP.', 'gray'),
    ]),
    slot(49, 'player_head', 'Fairy Souls', [
      line(`${player.fairySouls} Fairy Souls found`, 'light_purple'),
      line(`+3 ❤ and +3 ❈ per 5 souls`, 'green'),
      line(`Accessory Bag: ${limit} slots`, 'aqua'),
      line('Explore the Hub and beyond — souls hide near zone corners!', 'gray'),
    ]),
    back('inventory'),
    close(),
  );

  return {
    id: 'accessories',
    title: `Accessory Bag — ${player.magicalPower} MP`,
    rows: 6,
    slots,
    parent: 'inventory',
  };
}

function enchantingMenu(player: PlayerState, context: Context = {}): MenuView {
  const slotIndex = context.slot;
  if (slotIndex === undefined || slotIndex === '' || slotIndex === -1) {
    return enchantingPickItemMenu(player);
  }
  return enchantingApplyMenu(player, Number(slotIndex), context);
}

function enchantingPickItemMenu(player: PlayerState): MenuView {
  const slots: MenuSlotView[] = [
    slot(4, 'enchanting_table', 'Enchantment Table', [
      line('Select an item to enchant.', 'aqua'),
      line('Compatible enchants depend on item type.', 'gray'),
      line('Costs coins + grants Enchanting XP.', 'yellow'),
    ]),
  ];

  let count = 0;
  for (let i = 0; i < player.inventory.length && count < GRID.length; i++) {
    const stack = player.inventory[i];
    if (!stack) continue;
    const def = ITEMS[stack.itemId];
    if (!def?.type || def.type === 'MATERIAL' || def.type === 'ACCESSORY' || def.type === 'PET' || def.type === 'MINION') continue;
    if (!enchantsForItemType(def.type).length) continue;
    const view = itemSlot(GRID[count], stack.itemId, `enchantPick:${i}`, stack.qty);
    view.name = def.name;
    view.lore = [
      ...buildItemLore(def, stack),
      line(''),
      line('Click to choose enchantments', 'yellow'),
    ];
    if (stack.enchantments && Object.keys(stack.enchantments).length) view.glint = true;
    slots.push(view);
    count++;
  }

  if (count === 0) {
    slots.push(slot(22, 'barrier', 'No Enchantable Items', [line('Equip weapons, armor, tools or rods.', 'gray')]));
  }

  slots.push(
    slot(45, 'arrow', 'Go Back', [line('To Equipment')], 'open:inventory'),
    close(),
  );

  return {
    id: 'enchanting',
    title: 'Enchant Item',
    rows: 6,
    context: {},
    slots,
    parent: 'inventory',
  };
}

function enchantingApplyMenu(player: PlayerState, invSlot: number, context: Context): MenuView {
  const stack = player.inventory[invSlot];
  const def = stack ? ITEMS[stack.itemId] : undefined;
  const page = Number(context.page ?? 0);
  const compatible = def?.type ? enchantsForItemType(def.type) : [];
  const pages = Math.max(1, Math.ceil(compatible.length / GRID.length));
  const slice = compatible.slice(page * GRID.length, (page + 1) * GRID.length);

  const slots: MenuSlotView[] = [
    slot(4, 'book', def?.name ?? 'Selected Item', [
      line('Pick an enchantment below.', 'aqua'),
      line('Each click adds +1 level (up to max).', 'gray'),
    ]),
  ];

  if (stack && def) {
    const preview = itemSlot(13, stack.itemId, undefined, stack.qty);
    preview.name = def.name;
    preview.lore = buildItemLore(def, stack);
    preview.glint = Boolean(stack.enchantments && Object.keys(stack.enchantments).length);
    slots.push(preview);
  } else {
    slots.push(slot(13, 'barrier', 'Invalid Item', [line('That slot is empty.', 'red')]));
  }

  for (let i = 0; i < slice.length; i++) {
    const ench = slice[i]!;
    const current = stack?.enchantments?.[ench.id] ?? 0;
    const atMax = current >= ench.maxLevel;
    const rarityIndex = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'].indexOf(def?.rarity ?? 'COMMON');
    const cost = enchantTableCost(ench.id, current + 1, Math.max(0, rarityIndex));
    const view = slot(GRID[i], 'enchanted_book', ench.name, [
      line(ench.description, 'gray'),
      line(`Level: ${current}/${ench.maxLevel}`, current > 0 ? 'green' : 'white'),
      line(atMax ? 'MAX LEVEL' : `Cost: ${cost.toLocaleString()} coins`, atMax ? 'red' : 'gold'),
      line(atMax ? '' : 'Click to apply +1 level', 'yellow'),
    ], atMax ? undefined : `enchantApply:${invSlot}@${ench.id}`, { disabled: atMax, glint: current > 0 });
    slots.push(view);
  }

  slots.push(
    ...pageControls('enchanting', { ...context, slot: invSlot }, page, pages),
    slot(45, 'arrow', 'Pick Different Item', [line('Choose another item')], 'open:enchanting'),
    close(),
  );

  return {
    id: 'enchanting',
    title: `Enchant — ${def?.name ?? 'Item'}`,
    rows: 6,
    context: { ...context, slot: invSlot, page },
    slots,
    parent: 'inventory',
  };
}

function reforgeMenu(_player: PlayerState): MenuView {
  return {
    id: 'reforge',
    title: 'Reforge Anvil',
    rows: 6,
    slots: [
      slot(4, 'anvil', 'Blacksmith', [
        line('Left-click a weapon, armor piece, accessory or tool below.', 'yellow'),
        line('Cost scales with rarity. Combat rolls: Spicy, Sharp, Fierce, Pure.', 'gray'),
      ]),
      ...REFORGES.slice(0, 10).map((reforge, i) => {
        const sample = reforge.statsByRarity.RARE ?? reforge.statsByRarity.UNCOMMON ?? {};
        const combat = reforge.appliesTo === 'weapon' || reforge.appliesTo === 'armor';
        return slot(10 + (i % 7) + Math.floor(i / 7) * 9, 'anvil', reforge.name, [
          line(`${pretty(reforge.appliesTo)}${combat ? ' · combat' : ''}`, combat ? 'red' : 'gray'),
          ...Object.entries(sample).map(([key, amount]) => line(`+${amount} ${pretty(key)} at RARE`, 'aqua')),
        ]);
      }),
      slot(40, 'anvil', 'Reforge Selected Item', [
        line('Click an item in your inventory to roll a random compatible reforge.', 'green'),
      ], 'reforge:selected'),
      slot(45, 'arrow', 'Go Back', [line('To Equipment')], 'open:inventory'),
      close(),
    ],
    parent: 'inventory',
  };
}

function auctionMenu(player: PlayerState, context: Context = {}): MenuView {
  const mode = String(context.mode ?? 'browse');
  if (mode === 'create') return auctionCreateMenu(player, context);
  if (mode === 'view') return auctionViewMenu(player, context);
  if (mode === 'manage') return auctionManageMenu(player);
  if (mode === 'claims') return auctionClaimsMenu(player);
  return auctionBrowseMenu(player);
}

function auctionBrowseMenu(player: PlayerState): MenuView {
  const auctions = activeAuctions();
  return {
    id: 'auction',
    title: 'Auction House',
    rows: 6,
    context: { mode: 'browse' },
    slots: [
      slot(4, 'sign', 'Auction House', [
        line('Browse player listings or create your own.', 'aqua'),
        line('BIN = instant buy · Auction = bid to win', 'gray'),
      ]),
      slot(11, 'gold_horse_armor', 'Create Auction', [
        line('Pick an item, set price & duration', 'yellow'),
        line('Choose BIN or bidding auction', 'gray'),
        click(),
      ], 'auction:create'),
      slot(13, 'chest', 'Manage Auctions', [
        line('View and cancel your listings', 'aqua'),
        click(),
      ], 'auction:manage'),
      slot(15, 'emerald', 'Claim Items', [
        line('Collect won auctions & expired listings', 'green'),
        click(),
      ], 'auction:claims'),
      ...auctions.slice(0, 21).map((auction, i) => {
        const def = ITEMS[auction.item.itemId];
        const view = itemSlot(28 + (i % 7) + Math.floor(i / 7) * 9, auction.item.itemId, `auction:view:${auction.id}`, auction.item.qty);
        view.name = def?.name ?? auction.item.itemId;
        view.lore = [
          ...buildItemLore(def, auction.item),
          line(''),
          line(`Seller: ${auction.sellerName}`, 'gray'),
          auction.bin
            ? line(`BIN: ${auction.price.toLocaleString()} coins`, 'gold')
            : line(`Top bid: ${auction.highestBid.toLocaleString()} coins`, 'yellow'),
          line(`Ends in: ${formatTimeLeft(auction.expiresAt)}`, 'aqua'),
          line('Click to view listing', 'yellow'),
        ];
        return view;
      }),
      ...(auctions.length ? [] : [slot(31, 'barrier', 'No Auctions Yet', [line('Be the first to create a listing!', 'gray')])]),
      back(),
      close(),
    ],
    parent: 'skyblock',
  };
}

function auctionCreateMenu(player: PlayerState, context: Context): MenuView {
  const pickSlot = Number(context.pickSlot ?? -1);
  const price = Number(context.price ?? 10_000);
  const bin = context.bin !== false;
  const durationHours = Number(context.durationHours ?? 24);
  const picked = pickSlot >= 0 ? player.inventory[pickSlot] : null;
  const pickedDef = picked ? ITEMS[picked.itemId] : null;
  const fee = bin ? Math.max(5, Math.floor(price * 0.01)) : Math.max(25, Math.floor(price * 0.05));

  const invSlots: MenuSlotView[] = [];
  for (let i = 0; i < player.inventory.length && invSlots.length < 14; i++) {
    const stack = player.inventory[i];
    if (!stack) continue;
    const def = ITEMS[stack.itemId];
    if (!def || def.type === 'MATERIAL') continue;
    const view = itemSlot(28 + invSlots.length, stack.itemId, `auctionPick:${i}`, stack.qty);
    view.name = def.name;
    view.lore = [...buildItemLore(def, stack), line(''), line('Click to select for auction', 'yellow')];
    if (i === pickSlot) view.glint = true;
    invSlots.push(view);
  }

  return {
    id: 'auction',
    title: 'Create Auction',
    rows: 6,
    context: { mode: 'create', pickSlot, price, bin, durationHours },
    slots: [
      slot(4, 'gold_horse_armor', 'Create Auction', [
        line('1. Click an item below', 'yellow'),
        line('2. Set price, duration & BIN/auction', 'gray'),
        line('3. Confirm to list', 'green'),
      ]),
      picked && pickedDef
        ? (() => {
          const view = itemSlot(13, picked.itemId, undefined, picked.qty);
          view.name = pickedDef.name;
          view.lore = [...buildItemLore(pickedDef, picked), line('Selected item', 'green')];
          return view;
        })()
        : slot(13, 'barrier', 'No Item Selected', [line('Click an item from your inventory!', 'red')]),
      slot(20, 'gold_ingot', bin ? 'Buy It Now (BIN)' : 'Bidding Auction', [
        line(bin ? 'Players buy instantly at your price' : 'Players bid — highest bid wins', bin ? 'gold' : 'yellow'),
        line('Click to switch mode', 'gray'),
      ], 'auctionBin:toggle'),
      slot(22, 'clock', `Duration: ${durationHours}h`, [
        line('How long the listing stays up', 'gray'),
        line(`Options: ${durationOptions().join('h, ')}h`, 'aqua'),
        line('Click to cycle duration', 'yellow'),
      ], 'auctionDuration:cycle'),
      slot(24, 'gold_block', `Price: ${price.toLocaleString()}`, [
        line(bin ? 'Buy It Now price' : 'Starting bid', 'gold'),
        line(`Listing fee: ${fee.toLocaleString()} coins`, 'red'),
        line('Left-click: +price · Right-click: −price', 'yellow'),
      ], 'auctionPrice:adjust'),
      slot(31, 'lime_dye', 'Create Listing', [
        line(picked ? 'Confirm and pay listing fee' : 'Select an item first!', picked ? 'green' : 'red'),
        line(`Fee: ${fee.toLocaleString()} coins`, 'gold'),
      ], picked ? 'auctionConfirm' : undefined, { disabled: !picked }),
      ...invSlots,
      slot(45, 'arrow', 'Back to Browser', [line('Cancel creation')], 'auction:browse'),
      close(),
    ],
    parent: 'skyblock',
  };
}

function auctionViewMenu(player: PlayerState, context: Context): MenuView {
  const auction = auctionById(String(context.auctionId ?? ''));
  if (!auction) {
    return {
      id: 'auction',
      title: 'Auction House',
      rows: 3,
      context: { mode: 'browse' },
      slots: [
        slot(13, 'barrier', 'Auction Not Found', [line('This listing may have ended.', 'red')]),
        slot(18, 'arrow', 'Back', [line('To Auction Browser')], 'auction:browse'),
        close(),
      ],
      parent: 'skyblock',
    };
  }

  const def = ITEMS[auction.item.itemId];
  const viewItem = itemSlot(13, auction.item.itemId, undefined, auction.item.qty);
  viewItem.name = def?.name ?? auction.item.itemId;
  viewItem.lore = [
    ...buildItemLore(def, auction.item),
    line(''),
    line(`Seller: ${auction.sellerName}`, 'gray'),
    line(`Ends in: ${formatTimeLeft(auction.expiresAt)}`, 'aqua'),
    auction.bin
      ? line(`BIN Price: ${auction.price.toLocaleString()} coins`, 'gold')
      : line(`Top Bid: ${auction.highestBid.toLocaleString()} coins`, 'yellow'),
    auction.highestBidderId && !auction.bin ? line('Has active bids', 'red') : line(''),
  ];

  const minBid = auction.highestBidderId ? Math.ceil(auction.highestBid * 1.025) : auction.price;
  const slots: MenuSlotView[] = [
    slot(4, 'book', 'Listing Details', [
      line(auction.bin ? 'Buy It Now listing' : 'Bidding auction', auction.bin ? 'gold' : 'yellow'),
      line(`Time left: ${formatTimeLeft(auction.expiresAt)}`, 'aqua'),
    ]),
    viewItem,
  ];

  if (auction.sellerId !== player.id) {
    if (auction.bin) {
      slots.push(slot(29, 'gold_ingot', 'Buy It Now', [
        line(`${auction.price.toLocaleString()} coins`, 'gold'),
        line('Instant purchase', 'yellow'),
        click(),
      ], `auctionBuy:${auction.id}`));
    } else {
      slots.push(slot(29, 'gold_nugget', 'Submit Bid', [
        line(`Minimum: ${minBid.toLocaleString()} coins`, 'gold'),
        line('Coins held until outbid or auction ends', 'gray'),
        click(),
      ], `auctionBid:${auction.id}`));
    }
  } else {
    slots.push(slot(29, 'barrier', 'Your Listing', [line('Use Manage Auctions to cancel', 'gray')]));
  }

  slots.push(
    slot(45, 'arrow', 'Back to Browser', [line('Return to listings')], 'auction:browse'),
    close(),
  );

  return {
    id: 'auction',
    title: def?.name ?? 'Auction',
    rows: 6,
    context: { mode: 'view', auctionId: auction.id },
    slots,
    parent: 'skyblock',
  };
}

function auctionManageMenu(player: PlayerState): MenuView {
  const mine = auctionsBySeller(player.id);
  return {
    id: 'auction',
    title: 'Manage Auctions',
    rows: 6,
    context: { mode: 'manage' },
    slots: [
      slot(4, 'chest', 'Your Listings', [
        line(`${mine.length} active auction(s)`, 'aqua'),
        line('Click a listing to cancel (if no bids)', 'yellow'),
      ]),
      ...mine.slice(0, 21).map((auction, i) => {
        const def = ITEMS[auction.item.itemId];
        const view = itemSlot(19 + (i % 7) + Math.floor(i / 7) * 9, auction.item.itemId, `auctionCancel:${auction.id}`, auction.item.qty);
        view.name = def?.name ?? auction.item.itemId;
        view.lore = [
          auction.bin ? line(`BIN: ${auction.price.toLocaleString()}`, 'gold') : line(`Bid: ${auction.highestBid.toLocaleString()}`, 'yellow'),
          line(`Ends: ${formatTimeLeft(auction.expiresAt)}`, 'gray'),
          auction.highestBidderId && !auction.bin ? line('Has bids — cannot cancel', 'red') : line('Click to cancel & reclaim item', 'red'),
        ];
        return view;
      }),
      ...(mine.length ? [] : [slot(22, 'barrier', 'No Active Listings', [line('Create an auction from the browser.', 'gray')])]),
      slot(45, 'arrow', 'Back to Browser', [line('Return')], 'auction:browse'),
      close(),
    ],
    parent: 'skyblock',
  };
}

function auctionClaimsMenu(player: PlayerState): MenuView {
  const claimable = expiredAuctionsFor(player.id);
  return {
    id: 'auction',
    title: 'Claim Items',
    rows: 6,
    context: { mode: 'claims' },
    slots: [
      slot(4, 'emerald', 'Expired Listings', [
        line(`${claimable.length} to claim`, 'aqua'),
        line('Won auctions & returned unsold items', 'gray'),
      ]),
      ...claimable.slice(0, 21).map((auction, i) => {
        const def = ITEMS[auction.item.itemId];
        const won = auction.highestBidderId === player.id && !auction.bin;
        const view = itemSlot(19 + (i % 7) + Math.floor(i / 7) * 9, auction.item.itemId, `auctionClaim:${auction.id}`, auction.item.qty);
        view.name = def?.name ?? auction.item.itemId;
        view.lore = [
          line(won ? 'You won this auction!' : 'Unsold — reclaim item', won ? 'green' : 'yellow'),
          line('Click to claim', 'gold'),
        ];
        return view;
      }),
      ...(claimable.length ? [] : [slot(22, 'barrier', 'Nothing to Claim', [line('No expired auctions yet.', 'gray')])]),
      slot(45, 'arrow', 'Back to Browser', [line('Return')], 'auction:browse'),
      close(),
    ],
    parent: 'skyblock',
  };
}

function leaderboardMenu(player: PlayerState): MenuView {
  const netWorth = (user: { coins: number; bank?: { balance?: number } }) =>
    Math.floor(user.coins + (user.bank?.balance ?? 0));
  const richest = [...getData().users]
    .filter((user) => user.username !== 'MarketBot' && user.username !== 'AuctionMirror')
    .sort((a, b) => netWorth(b) - netWorth(a))
    .slice(0, 14);
  const playerTotal = netWorth({ coins: player.coins, bank: player.bank });
  return {
    id: 'leaderboard',
    title: 'Leaderboards',
    rows: 4,
    slots: [
      slot(4, 'leaderboard', 'Richest Players', [
        line(`${player.username}: ${playerTotal.toLocaleString()} coins (purse + bank)`, 'gold'),
        line('Click a player to view their profile.'),
      ]),
      ...richest.map((user, i) => slot(10 + (i % 7) + Math.floor(i / 7) * 9, 'player_head', `#${i + 1} ${user.username}`, [
        line(`${netWorth(user).toLocaleString()} Coins`, 'gold'),
        line(`Purse ${Math.floor(user.coins).toLocaleString()} · Bank ${Math.floor(user.bank?.balance ?? 0).toLocaleString()}`, 'gray'),
        line(`Combat ${levelFromXp(user.skills.combat ?? 0).level}`, 'red'),
        line(`Mining ${levelFromXp(user.skills.mining ?? 0).level}`, 'aqua'),
        line('Click to view profile!', 'yellow'),
      ], `profile:${user.id}`)),
      slot(27, 'arrow', 'Go Back', [line('To SkyBlock Menu')], 'open:skyblock'),
      slot(31, 'barrier', 'Close', [line('Close this menu')], 'close'),
    ],
    parent: 'skyblock',
  };
}

function tradeMenu(player: PlayerState, context: Context = {}): MenuView {
  const partnerId = String(context.partnerId ?? '');
  const partnerName = String(context.partnerUsername ?? 'Player');
  const trade = partnerId ? getTrade(player.id, partnerId) : undefined;
  const yours = trade?.offers[player.id];
  const theirs = trade?.offers[partnerId];
  const youReady = Boolean(trade?.confirmed[player.id]);
  const theyReady = Boolean(trade?.confirmed[partnerId]);
  const selected = context.selectedTradeSlot === undefined || context.selectedTradeSlot === ''
    ? -1
    : Number(context.selectedTradeSlot);

  const slots: MenuSlotView[] = [
    slot(4, 'emerald', `Trading with ${partnerName}`, [
      line(youReady ? 'You confirmed — waiting on them.' : theyReady ? 'They confirmed — confirm to finish.' : 'Put items in the left slots, then confirm.', youReady || theyReady ? 'green' : 'gray'),
      line('Click your offer slots, then click inventory items.', 'yellow'),
      line('Left-click coins +1,000 · Right-click +100 · Shift clear', 'aqua'),
    ]),
  ];

  for (let i = 0; i < 4; i++) {
    const stack = yours?.items[i] ?? null;
    const chosen = selected === i;
    if (stack) {
      const view = stackMenuSlot(i, stack, `trade:clear:${i}`);
      view.lore = [...view.lore, line(''), line('Click to remove from offer', 'yellow')];
      if (chosen) view.glint = true;
      slots.push(view);
    } else {
      slots.push(slot(i, '', chosen ? 'Selected slot' : `Your offer ${i + 1}`, [
        line(chosen ? 'Click an inventory item to add it.' : 'Click to select, then click inventory.', 'yellow'),
      ], `trade:select:${i}`));
    }
    const their = theirs?.items[i] ?? null;
    if (their) {
      const view = stackMenuSlot(5 + i, their);
      view.lore = [...view.lore, line(''), line(`${partnerName}'s offer`, 'aqua')];
      slots.push(view);
    } else {
      slots.push(slot(5 + i, '', `${partnerName} slot ${i + 1}`, [line('Waiting…', 'gray')]));
    }
  }

  slots.push(
    slot(9, 'gold_ingot', `Your coins: ${(yours?.coins ?? 0).toLocaleString()}`, [
      line(`Purse: ${player.coins.toLocaleString()}`, 'gold'),
      line('Left-click: offer +1,000', 'yellow'),
      line('Right-click: offer +100', 'yellow'),
      line('Shift-click: clear coins', 'gray'),
    ], 'trade:coins'),
    slot(17, 'gold_ingot', `Their coins: ${(theirs?.coins ?? 0).toLocaleString()}`, [
      line(`${partnerName} is offering this many coins.`, 'gray'),
    ]),
    slot(45, 'barrier', 'Cancel Trade', [line('Close and return items.', 'red')], 'trade:cancel'),
    slot(49, youReady ? 'lime_dye' : 'emerald', youReady ? 'Waiting…' : 'Confirm Trade', [
      line(youReady ? 'Waiting for them to confirm.' : theyReady ? 'They are ready — click to complete!' : 'Lock in your offer.', youReady ? 'gray' : 'yellow'),
    ], youReady ? undefined : 'trade:confirm', { glint: theyReady && !youReady }),
  );

  return {
    id: 'trade',
    title: `Trade — ${partnerName}`,
    rows: 6,
    slots,
    parent: 'skyblock',
    context,
  };
}

function pretty(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatStat(value: number): string {
  return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(1);
}

function statColor(key: string): LoreLine['color'] {
  if (key === 'health' || key === 'defense') return 'green';
  if (key === 'strength' || key === 'ferocity') return 'red';
  if (key === 'intelligence' || key.includes('Chance')) return 'aqua';
  if (key.includes('Fortune') || key.includes('Speed')) return 'gold';
  return 'white';
}

function roman(value: number): string {
  const table: Array<[number, string]> = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let result = '';
  let left = value;
  for (const [amount, glyph] of table) while (left >= amount) { result += glyph; left -= amount; }
  return result || String(value);
}
