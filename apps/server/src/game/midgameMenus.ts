import {
  ALCHEMY_RECIPES,
  DRAGON_TYPES,
  ESSENCE_TYPES,
  COMMUNITY_OFFERS,
  CROP_MILESTONE_AMOUNTS,
  ESSENCE_SHOP,
  FETCHUR_BITS,
  GARDEN_CROPS,
  GARDEN_PLOT_COUNT,
  HOTM_PERKS,
  ITEMS,
  LOGIN_REWARDS,
  MAYORS,
  MEDAL_SHOP,
  MOBS,
  PET_EGGS,
  STARTING_GARDEN_PLOTS,
  bestiaryTier,
  countItem,
  cropMilestoneTier,
  currentMayor,
  currentQuestStep,
  dayIndex,
  fetchurWant,
  gardenFarmingFortune,
  gardenLevelFromHarvest,
  hotmPerkLocked,
  hotmPowderCost,
  hotmUnlockedCount,
  loginRewardForStreak,
  plotGrowRemainingMs,
  plotReady,
  plotUnlockCost,
  skyblockLevelFromXp,
  skyblockXp,
  starUpgradeCost,
  type LoreLine,
  type MenuSlotView,
  type MenuView,
  type PlayerState,
} from '@aether/shared';
import { ensureGardenPlots } from './gardenLogic.js';

const line = (text: string, color: LoreLine['color'] = 'gray', bold = false): LoreLine => ({ text, color, bold });
const click = (): LoreLine => line('Click to open!', 'yellow');

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

function back(): MenuSlotView {
  return slot(45, 'arrow', 'Go Back', [line('SkyBlock Menu')], 'open:skyblock');
}

function close(): MenuSlotView {
  return slot(49, 'barrier', 'Close', [line('Close this menu')], 'close');
}

export function gardenMenu(player: PlayerState): MenuView {
  const garden = player.garden;
  const visitor = garden.visitor;
  const ready = (garden.plots ?? []).filter((p) => p.crop && plotReady(p)).length;
  const level = gardenLevelFromHarvest(garden.harvested ?? {});
  const medals = garden.jacobMedals ?? { bronze: 0, silver: 0, gold: 0 };
  return {
    id: 'garden',
    title: 'The Garden',
    rows: 6,
    slots: [
      slot(4, 'wheat', "Jacob's Contest", [
        line(`Crop: ${ITEMS[garden.jacobCrop]?.name ?? garden.jacobCrop}`, 'yellow'),
        line(`Your score: ${garden.jacobScore}`, 'aqua'),
        line(`Last medal: ${garden.jacobMedal ?? 'none'}`, 'gold'),
        line(`Medals: ${medals.bronze} bronze · ${medals.silver} silver · ${medals.gold} gold`, 'yellow'),
        line(`Ends in: ${Math.max(0, Math.ceil((garden.jacobContestEndsAt - Date.now()) / 60000))}m`, 'gray'),
        line('Harvest contest crop on plots to score.', 'gray'),
      ]),
      slot(10, 'hoe', 'Garden Plots', [
        line(`${ready} / ${garden.unlockedPlots ?? STARTING_GARDEN_PLOTS} plots unlocked`, 'green'),
        line(`Garden level ${level.level} · ${level.total.toLocaleString()} harvested`, 'aqua'),
        line('Click to plant, water, and harvest.', 'yellow'),
        click(),
      ], 'open:garden_plots'),
      slot(11, 'gold_ingot', 'Anita\'s Shop', [
        line('Spend Jacob medals on farming tools.', 'gray'),
        line(`${medals.bronze} bronze · ${medals.silver} silver · ${medals.gold} gold`, 'gold'),
        click(),
      ], 'open:medal_shop'),
      slot(16, 'dirt', 'Composter', [
        line(`Level ${garden.composterLevel ?? 0}`, 'aqua'),
        line(`${garden.organicMatter ?? 0}/100 organic matter`, 'green'),
        line('Turn extra crops into Farming XP.', 'gray'),
        click(),
      ], 'open:garden_compost'),
      visitor
        ? slot(13, 'player_head', `${visitor.name} is visiting`, [
          line(`Wants ${visitor.qty}× ${ITEMS[visitor.wants]?.name ?? visitor.wants}`, 'yellow'),
          line(`Reward: ${visitor.reward.toLocaleString()} coins`, 'gold'),
          click(),
        ], 'garden:visitor')
        : slot(13, 'barrier', 'No visitor', [line('A visitor will arrive soon.')]),
      slot(22, 'hoe', 'Crop Milestones', [
        line(`+${gardenFarmingFortune(garden.harvested ?? {})} Farming Fortune from milestones`, 'gold'),
        ...Object.entries(garden.harvested).slice(0, 6).map(([id, qty]) =>
          line(`${ITEMS[id]?.name ?? id}: ${qty.toLocaleString()} (T${cropMilestoneTier(qty)}/${CROP_MILESTONE_AMOUNTS.length})`, 'green')),
        line(Object.keys(garden.harvested).length ? '' : 'Harvest crops in the Garden.', 'gray'),
      ]),
      back(),
      close(),
    ],
    parent: 'skyblock',
  };
}

const PLOT_SLOTS = [
  10, 11, 12, 13, 14, 15,
  19, 20, 21, 22, 23, 24,
  28, 29, 30, 31, 32, 33,
  37, 38, 39, 40, 41, 42,
];

function formatGrowTime(ms: number): string {
  const sec = Math.max(0, Math.ceil(ms / 1000));
  if (sec >= 60) return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  return `${sec}s`;
}

export function gardenPlotsMenu(player: PlayerState): MenuView {
  ensureGardenPlots(player);
  const plots = player.garden.plots;
  const slots: MenuSlotView[] = [
    slot(4, 'wheat', 'Garden Plots', [
      line('Left-click an empty plot to plant.', 'yellow'),
      line('Right-click a growing crop to water.', 'aqua'),
      line('Left-click a ready crop to harvest.', 'green'),
      line(`Unlocked: ${player.garden.unlockedPlots ?? STARTING_GARDEN_PLOTS}/${GARDEN_PLOT_COUNT}`, 'aqua'),
      line(`Jacob crop: ${ITEMS[player.garden.jacobCrop]?.name ?? player.garden.jacobCrop}`, 'gold'),
    ]),
    slot(16, 'dirt', 'Composter', [
      line(`Lv ${player.garden.composterLevel ?? 0} · ${player.garden.organicMatter ?? 0}/100 OM`, 'aqua'),
      click(),
    ], 'open:garden_compost'),
  ];

  for (let i = 0; i < GARDEN_PLOT_COUNT; i++) {
    const plot = plots[i]!;
    const slotNumber = PLOT_SLOTS[i] ?? i;
    const unlocked = i < (player.garden.unlockedPlots ?? STARTING_GARDEN_PLOTS);
    if (!unlocked) {
      const cost = plotUnlockCost(i);
      const next = i === (player.garden.unlockedPlots ?? STARTING_GARDEN_PLOTS);
      slots.push(slot(slotNumber, 'barrier', `Locked Plot ${i + 1}`, [
        line(`Unlock: ${cost.coins.toLocaleString()} coins + ${cost.compost} compost`, 'yellow'),
        line(`Requires Garden level ${cost.gardenLevel}`, 'gray'),
        line(next ? 'Click to unlock this plot.' : 'Unlock earlier plots first.', next ? 'green' : 'red'),
      ], next ? 'garden:unlock' : undefined, { disabled: !next }));
      continue;
    }
    if (!plot.crop) {
      slots.push(slot(slotNumber, 'dirt', `Plot ${i + 1}`, [
        line('Empty', 'gray'),
        line('Click to plant a crop.', 'yellow'),
      ], `garden:plot:${i}`));
      continue;
    }
    const def = ITEMS[plot.crop];
    const ready = plotReady(plot);
    const remaining = plotGrowRemainingMs(plot);
    const lore: LoreLine[] = [
      line(ready ? 'Ready to harvest!' : `Growing — ${formatGrowTime(remaining)} left`, ready ? 'green' : 'yellow'),
      line(plot.watered ? 'Watered (25% faster)' : 'Dry — right-click to water', plot.watered ? 'aqua' : 'gray'),
      line(plot.crop === player.garden.jacobCrop ? "Jacob's contest crop" : '', 'gold'),
      line(ready ? 'Click to harvest!' : 'Right-click to water', 'yellow'),
    ].filter((entry) => entry.text);
    slots.push(slot(slotNumber, plot.crop, def?.name ?? plot.crop, lore, `garden:plot:${i}`, {
      itemId: plot.crop,
      glint: ready,
      rarity: def?.rarity ?? 'COMMON',
    }));
  }

  slots.push(
    slot(45, 'arrow', 'Go Back', [line('The Garden')], 'open:garden'),
    close(),
  );

  return {
    id: 'garden_plots',
    title: 'Garden Plots',
    rows: 6,
    slots,
    parent: 'garden',
  };
}

export function gardenPlantMenu(player: PlayerState, context: Record<string, string | number | boolean> = {}): MenuView {
  ensureGardenPlots(player);
  const plotIndex = Number(context.plotIndex ?? 0);
  const slots: MenuSlotView[] = [
    slot(4, 'hoe', `Plant Plot ${plotIndex + 1}`, [
      line('Choose a crop from your inventory.', 'gray'),
      line('Planting uses 1 of that crop.', 'yellow'),
    ]),
  ];
  GARDEN_CROPS.forEach((crop, i) => {
    const have = countItem(player.inventory, crop);
    const def = ITEMS[crop];
    const contest = crop === player.garden.jacobCrop;
    slots.push(slot(10 + (i % 7) + Math.floor(i / 7) * 9, crop, def?.name ?? crop, [
      line(`You have: ${have.toLocaleString()}`, have > 0 ? 'green' : 'red'),
      line(contest ? "Jacob's contest crop — extra score" : 'Garden crop', contest ? 'gold' : 'gray'),
      line(have > 0 ? 'Click to plant!' : 'You need 1 to plant', have > 0 ? 'yellow' : 'red'),
    ], have > 0 ? `garden:sow:${plotIndex}:${crop}` : undefined, {
      itemId: crop,
      count: Math.max(1, have),
      disabled: have <= 0,
      rarity: def?.rarity ?? 'COMMON',
    }));
  });
  slots.push(
    slot(45, 'arrow', 'Go Back', [line('Garden Plots')], 'open:garden_plots'),
    close(),
  );
  return {
    id: 'garden_plant',
    title: 'Plant Crop',
    rows: 6,
    slots,
    parent: 'garden_plots',
    context: { plotIndex },
  };
}

export function gardenCompostMenu(player: PlayerState): MenuView {
  ensureGardenPlots(player);
  const slots: MenuSlotView[] = [
    slot(4, 'dirt', 'Composter', [
      line(`Level ${player.garden.composterLevel ?? 0}`, 'aqua'),
      line(`${player.garden.organicMatter ?? 0}/100 organic matter`, 'green'),
      line('Left-click: compost 1 · Right-click: up to 64', 'yellow'),
      line('100 OM raises the composter and grants Farming XP.', 'gray'),
    ]),
  ];
  const owned = GARDEN_CROPS.filter((crop) => countItem(player.inventory, crop) > 0);
  owned.forEach((crop, i) => {
    const have = countItem(player.inventory, crop);
    const def = ITEMS[crop];
    slots.push(slot(10 + (i % 7) + Math.floor(i / 7) * 9, crop, def?.name ?? crop, [
      line(`You have: ${have.toLocaleString()}`, 'green'),
      line('Left-click compost 1', 'yellow'),
      line('Right-click compost 64', 'yellow'),
    ], `garden:compost:${crop}`, { itemId: crop, count: have, rarity: def?.rarity ?? 'COMMON' }));
  });
  if (!owned.length) {
    slots.push(slot(22, 'barrier', 'No Crops', [line('Harvest Garden plots first.', 'gray')]));
  }
  slots.push(
    slot(45, 'arrow', 'Go Back', [line('The Garden')], 'open:garden'),
    close(),
  );
  return {
    id: 'garden_compost',
    title: 'Composter',
    rows: 6,
    slots,
    parent: 'garden',
  };
}

const ESSENCE_ICONS: Record<string, string> = {
  undead: 'bone',
  wither: 'wither_skull',
  dragon: 'ender_pearl',
  gold: 'gold_ingot',
  diamond: 'diamond',
};

const STAR_RARITIES = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'] as const;

export function dungeonStarsMenu(player: PlayerState): MenuView {
  const essence = player.essence ?? {};
  const slots: MenuSlotView[] = [
    slot(4, 'nether_star', 'Star Upgrades', [
      line('Spend dungeon essence to star gear (max 5✪).', 'gray'),
      line('Each star adds +10% weapon damage and armor stats.', 'gold'),
    ]),
    ...ESSENCE_TYPES.map((type, i) => slot(11 + i, ESSENCE_ICONS[type] ?? 'nether_star', `${type[0]!.toUpperCase()}${type.slice(1)} Essence`, [
      line(`${essence[type] ?? 0}`, 'aqua'),
      line('Earned by clearing Catacombs floors.', 'gray'),
    ])),
  ];

  const grid = [19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43];
  let placed = 0;
  for (let i = 0; i < player.inventory.length && placed < grid.length; i++) {
    const stack = player.inventory[i];
    if (!stack) continue;
    const def = ITEMS[stack.itemId];
    if (!def || def.type === 'MATERIAL' || def.type === 'PET' || def.type === 'MINION' || def.type === 'CONSUMABLE') continue;
    const stars = stack.dungeonStars ?? 0;
    const rarityIndex = Math.max(0, STAR_RARITIES.indexOf((def.rarity ?? 'COMMON') as typeof STAR_RARITIES[number]));
    const cost = starUpgradeCost(stars, rarityIndex);
    const essenceType = ESSENCE_TYPES[rarityIndex % ESSENCE_TYPES.length] ?? 'undead';
    const haveEssence = essence[essenceType] ?? 0;
    const maxed = stars >= 5;
    const canAfford = !maxed && haveEssence >= cost.essence && player.coins >= cost.coins;
    const lore: LoreLine[] = [
      line(stars ? `${'✪'.repeat(stars)} (${stars}/5)` : 'No stars yet', stars ? 'gold' : 'gray'),
      line(maxed ? 'Maximum stars' : `Next: ${cost.essence} ${essenceType} essence + ${cost.coins.toLocaleString()} coins`, maxed ? 'green' : 'yellow'),
      line(`You have ${haveEssence} ${essenceType} essence`, haveEssence >= (maxed ? 0 : cost.essence) ? 'aqua' : 'red'),
      line(maxed ? '' : canAfford ? 'Click to upgrade!' : 'Not enough resources', canAfford ? 'yellow' : 'red'),
    ].filter((entry) => entry.text);
    const view = slot(grid[placed]!, stack.itemId, def.name, lore, maxed || !canAfford ? undefined : `stars:${i}`, {
      itemId: stack.itemId,
      count: stack.qty,
      rarity: def.rarity ?? 'COMMON',
      glint: stars > 0 || Boolean(stack.enchantments && Object.keys(stack.enchantments).length),
      disabled: maxed || !canAfford,
    });
    slots.push(view);
    placed += 1;
  }
  if (placed === 0) {
    slots.push(slot(31, 'barrier', 'No Gear', [line('Put weapons, armor, or tools in your inventory.', 'gray')]));
  }
  slots.push(
    slot(45, 'arrow', 'Go Back', [line('Catacombs')], 'open:dungeons'),
    close(),
  );
  return {
    id: 'dungeon_stars',
    title: 'Star Upgrades',
    rows: 6,
    slots,
    parent: 'dungeons',
  };
}

export function hotmMenu(player: PlayerState): MenuView {
  const hotm = player.hotm;
  const unlocked = hotmUnlockedCount(hotm.perks);
  const slots: MenuSlotView[] = [
    slot(4, 'mithril', 'Heart of the Mountain', [
      line(`Tokens: ${hotm.tokens}`, 'aqua'),
      line(`Mithril Powder: ${hotm.mithrilPowder.toLocaleString()}`, 'green'),
      line(`Gemstone Powder: ${(hotm.gemstonePowder ?? 0).toLocaleString()}`, 'light_purple'),
      line(`Perks unlocked: ${unlocked}/${HOTM_PERKS.length}`, 'yellow'),
      line('Unlock the root perk, then branch outward.', 'gray'),
      line('Tokens unlock a perk. Powder levels it up.', 'gray'),
    ]),
  ];

  for (const perk of HOTM_PERKS) {
    const level = hotm.perks[perk.id] ?? 0;
    const locked = hotmPerkLocked(hotm.perks, perk);
    const maxed = level >= perk.max;
    const parent = perk.parent ? HOTM_PERKS.find((entry) => entry.id === perk.parent) : undefined;
    const lore: LoreLine[] = [line(perk.description)];
    if (locked && parent) {
      const need = perk.parentLevel ?? 1;
      lore.push(line(`Requires ${parent.name}${need > 1 ? ` ${romanHotm(need)}` : ''} first`, 'red'));
    } else if (level === 0) {
      lore.push(line(`Unlock: ${perk.cost} HotM token${perk.cost === 1 ? '' : 's'}`, 'yellow'));
      lore.push(line(hotm.tokens >= perk.cost ? 'Click to unlock!' : `Need ${perk.cost} token${perk.cost === 1 ? '' : 's'}`, hotm.tokens >= perk.cost ? 'green' : 'red'));
    } else {
      lore.push(line(`Level ${romanHotm(level)} / ${romanHotm(perk.max)}`, maxed ? 'green' : 'aqua'));
      if (!maxed) {
        const powder = hotmPowderCost(perk, level + 1);
        const kind = perk.powderType === 'gemstone' ? 'Gemstone Powder' : 'Mithril Powder';
        const have = perk.powderType === 'gemstone' ? (hotm.gemstonePowder ?? 0) : hotm.mithrilPowder;
        lore.push(line(`Next: ${powder.toLocaleString()} ${kind}`, 'yellow'));
        lore.push(line(have >= powder ? 'Click to upgrade!' : 'Not enough powder', have >= powder ? 'green' : 'red'));
      } else {
        lore.push(line('MAXED', 'green', true));
      }
    }
    const clickable = !locked && !maxed;
    slots.push(slot(
      perk.slot,
      locked ? 'coal' : perk.icon,
      locked ? `???` : `${perk.name}${level > 0 ? ` ${romanHotm(level)}` : ''}`,
      lore,
      clickable ? `hotm:${perk.id}` : undefined,
      {
        glint: level > 0,
        disabled: locked,
        rarity: maxed ? 'LEGENDARY' : level > 0 ? 'RARE' : 'COMMON',
      },
    ));
  }

  const branches: Array<{ slot: number; from: string }> = [
    { slot: 11, from: 'mining_fortune' },
    { slot: 15, from: 'mining_fortune' },
    { slot: 20, from: 'mining_fortune' },
    { slot: 24, from: 'titanium_insanium' },
    { slot: 29, from: 'mining_speed' },
    { slot: 30, from: 'mining_speed' },
    { slot: 38, from: 'mining_speed' },
  ];
  for (const branch of branches) {
    const open = (hotm.perks[branch.from] ?? 0) > 0;
    slots.push(slot(
      branch.slot,
      open ? 'cyan_stained_glass_pane' : 'gray_stained_glass_pane',
      ' ',
      [line(open ? 'Unlocked path' : 'Locked path', open ? 'aqua' : 'dark_gray')],
    ));
  }

  hotm.commissions.forEach((job, i) => {
    slots.push(slot(46 + i, job.itemId, job.label, [
      line(`${job.have}/${job.need} ${ITEMS[job.itemId]?.name ?? job.itemId}`, 'yellow'),
      line(`+${job.rewardTokens} token, +${job.rewardCoins} coins`, 'gold'),
      job.have >= job.need ? line('Click to claim!', 'green') : line('Mine this in the Dwarven Mines.', 'gray'),
    ], job.have >= job.need ? `commission:${job.id}` : undefined, {
      itemId: job.itemId,
      glint: job.have >= job.need,
    }));
  });

  slots.push(back(), close());
  return {
    id: 'hotm',
    title: 'Heart of the Mountain',
    rows: 6,
    slots,
    parent: 'skyblock',
  };
}

const HOTM_ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];

function romanHotm(level: number): string {
  return HOTM_ROMAN[level] ?? String(level);
}

export function alchemyMenu(player: PlayerState): MenuView {
  return {
    id: 'alchemy',
    title: 'Brewing Stand',
    rows: 6,
    slots: [
      slot(4, 'potion', 'Alchemy', [line('Brew potions for Alchemy XP.'), line(`Alchemy XP: ${Math.floor(player.skills.alchemy).toLocaleString()}`, 'aqua')]),
      ...ALCHEMY_RECIPES.map((recipe, i) => slot(11 + i * 2, recipe.result, ITEMS[recipe.result]?.name ?? recipe.result, [
        ...recipe.ingredients.map((ing) => line(`${ing.qty}× ${ITEMS[ing.itemId]?.name ?? ing.itemId}`, 'gray')),
        line(`+${recipe.xp} Alchemy XP`, 'aqua'),
        click(),
      ], `brew:${recipe.id}`)),
      back(),
      close(),
    ],
    parent: 'skyblock',
  };
}

export function bestiaryMenu(player: PlayerState): MenuView {
  const entries = Object.entries(player.bestiary.kills).sort((a, b) => b[1] - a[1]);
  return {
    id: 'bestiary',
    title: 'Bestiary',
    rows: 6,
    slots: [
      slot(4, 'book', 'Bestiary', [line('Kills unlock Magic Find and SkyBlock XP.', 'gray')]),
      ...entries.slice(0, 21).map(([id, kills], i) => slot(10 + (i % 7) + Math.floor(i / 7) * 9, `${id}_head`, MOBS[id]?.name ?? id, [
        line(`Kills: ${kills.toLocaleString()}`, 'yellow'),
        line(`Tier ${bestiaryTier(kills)}`, 'aqua'),
      ])),
      back(),
      close(),
    ],
    parent: 'skyblock',
  };
}

export function mayorMenu(): MenuView {
  const mayor = currentMayor();
  return {
    id: 'mayor',
    title: 'Election Room',
    rows: 3,
    slots: [
      slot(13, 'player_head', `Mayor ${mayor.name}`, [
        line(mayor.perk, 'yellow'),
        line('Mayors rotate weekly.', 'gray'),
        ...MAYORS.map((entry) => line(`${entry.id === mayor.id ? '▶ ' : ''}${entry.name}`, entry.id === mayor.id ? 'green' : 'gray')),
      ]),
      back(),
      close(),
    ],
    parent: 'skyblock',
  };
}

export function museumMenu(player: PlayerState): MenuView {
  return {
    id: 'museum',
    title: 'Museum',
    rows: 6,
    slots: [
      slot(4, 'painting', 'Museum', [
        line(`Donated: ${player.museum.donated.length} unique items`, 'aqua'),
        line('Donate a unique item from your inventory (click below).', 'gray'),
      ]),
      ...player.inventory.filter((stack): stack is NonNullable<typeof stack> => Boolean(stack)).slice(0, 21).map((stack, i) => {
        const donated = player.museum.donated.includes(stack.itemId);
        return slot(10 + (i % 7) + Math.floor(i / 7) * 9, stack.itemId, ITEMS[stack.itemId]?.name ?? stack.itemId, [
          line(donated ? 'Already donated' : 'Click to donate 1 (kept in museum)', donated ? 'green' : 'yellow'),
        ], donated ? undefined : `museum:${stack.itemId}`);
      }),
      back(),
      close(),
    ],
    parent: 'skyblock',
  };
}

export function wardrobeMenu(player: PlayerState): MenuView {
  return {
    id: 'wardrobe',
    title: 'Wardrobe',
    rows: 6,
    slots: [
      slot(4, 'chestplate', 'Armor Wardrobe', [line('Swap saved armor sets instantly.')]),
      ...player.wardrobe.pages.map((page, i) => slot(10 + i * 2, 'diamond_chestplate', `Set ${i + 1}`, [
        line(page.helmet ? ITEMS[page.helmet.itemId]?.name ?? 'Helmet' : 'Empty helmet', 'gray'),
        line(page.chestplate ? ITEMS[page.chestplate.itemId]?.name ?? 'Chest' : 'Empty chestplate', 'gray'),
        line('Left-click: equip this set', 'yellow'),
        line('Right-click: save current armor here', 'yellow'),
      ], `wardrobe:${i}`)),
      back(),
      close(),
    ],
    parent: 'skyblock',
  };
}

export function kuudraMenu(player: PlayerState): MenuView {
  const fight = player.kuudraFight;
  return {
    id: 'kuudra',
    title: 'Kuudra',
    rows: 3,
    slots: [
      slot(11, 'magma', 'Kuudra Basic', [line('A volcanic siege. Press E on the altar after starting.'), click()], 'kuudra:1'),
      slot(13, 'magma', 'Kuudra Hot', [line('Harder. Combat 24+ recommended.'), click()], 'kuudra:2'),
      slot(15, 'magma', 'Kuudra Burning', [line('Endgame Crimson Isle.'), click()], 'kuudra:3'),
      fight ? slot(22, 'sword', 'Active Fight', [line(`${fight.hp.toLocaleString()} / ${fight.maxHp.toLocaleString()} ❤`, 'red'), line('Walk to the volcano and press E on Kuudra.')]) : slot(22, 'barrier', 'No fight', [line('Start a tier above.')]),
      ...(fight ? [slot(24, 'barrier', 'Leave Kuudra', [line('Abandon this fight.'), line('Or type /leave in chat.', 'gray')], 'kuudra:leave')] : []),
      back(),
      close(),
    ],
    parent: 'skyblock',
  };
}

export function dragonsMenu(player: PlayerState): MenuView {
  const fight = player.dragonFight;
  return {
    id: 'dragons',
    title: 'Dragon Altar',
    rows: 3,
    slots: [
      slot(13, 'ender_pearl', 'Place Summoning Eye', [
        line(`Eyes placed: ${fight?.eyes ?? 0}/8`, 'light_purple'),
        line('Need 8 Summoning Eyes to spawn a dragon.', 'gray'),
        click(),
      ], 'dragon:eye'),
      fight && fight.hp > 0
        ? slot(15, 'dragon', fight.type, [line(`${fight.hp.toLocaleString()} ❤`, 'red'), line('The dragon is in the nest — press E to attack.')])
        : slot(15, 'barrier', 'No dragon', [line('Place 8 eyes to summon.')]),
      ...DRAGON_TYPES.map((dragon, i) => slot(28 + i, 'ender_pearl', dragon.name, [line(`${dragon.hp.toLocaleString()} ❤`, 'gray')])),
      back(),
      close(),
    ],
    parent: 'skyblock',
  };
}

export function profileExtras(player: PlayerState): LoreLine[] {
  const xp = skyblockXp({
    skills: player.skills,
    collections: player.collections,
    slayerXp: player.slayerXp,
    fairySouls: player.fairySouls,
    museumDonated: player.museum.donated.length,
    bestiaryKills: Object.values(player.bestiary.kills).reduce((sum, n) => sum + n, 0),
  });
  const level = skyblockLevelFromXp(xp);
  const mayor = currentMayor();
  return [
    line(`SkyBlock Level ${level.level}  (${level.into}/${level.need})`, 'gold'),
    line(`Mayor ${mayor.name}`, 'yellow'),
    line(currentQuestStep(player)?.title ?? 'Starter quests done', 'gray'),
  ];
}

export { PET_EGGS };

export function dailyMenu(player: PlayerState): MenuView {
  const dailies = player.dailies;
  const reward = loginRewardForStreak(dailies?.streak ?? 1);
  const dayOfWeek = ((Math.max(1, dailies?.streak ?? 1) - 1) % 7) + 1;
  return {
    id: 'daily',
    title: 'Daily Calendar',
    rows: 6,
    slots: [
      slot(4, 'clock', `Streak ${dailies?.streak ?? 1}`, [
        line(`Day ${dayOfWeek} of 7 this week`, 'yellow'),
        line(dailies?.claimedLogin ? 'Login reward claimed today.' : 'Click to claim your login reward!', dailies?.claimedLogin ? 'green' : 'gold'),
        line(`Today: +${reward.coins.toLocaleString()} coins, +${reward.bits} bits`, 'aqua'),
      ], dailies?.claimedLogin ? undefined : 'daily:login', { glint: !dailies?.claimedLogin }),
      ...LOGIN_REWARDS.map((entry, i) => slot(10 + i, i + 1 === dayOfWeek ? 'gold_ingot' : 'paper', `Day ${i + 1}`, [
        line(`+${entry.coins.toLocaleString()} coins`, 'gold'),
        line(`+${entry.bits} bits`, 'green'),
        line(entry.powder ? `+${entry.powder} mithril powder` : '', 'aqua'),
        line(i + 1 === dayOfWeek ? 'Today' : '', 'yellow'),
      ], undefined, { glint: i + 1 === dayOfWeek })),
      ...(dailies?.tasks ?? []).map((task, i) => slot(28 + i, task.claimed ? 'emerald' : 'book', task.label, [
        line(task.detail, 'gray'),
        line(`${task.have}/${task.need}`, task.have >= task.need ? 'green' : 'yellow'),
        line(`+${task.rewardCoins} coins · +${task.rewardBits} bits`, 'gold'),
        line(task.claimed ? 'Claimed' : task.have >= task.need ? 'Click to claim!' : 'In progress', task.claimed ? 'green' : task.have >= task.need ? 'yellow' : 'gray'),
      ], !task.claimed && task.have >= task.need ? `daily:task:${task.id}` : undefined, { glint: !task.claimed && task.have >= task.need })),
      slot(45, 'arrow', 'Go Back', [line('SkyBlock Menu')], 'open:skyblock'),
      close(),
    ],
    parent: 'skyblock',
  };
}

export function communityShopMenu(player: PlayerState): MenuView {
  return {
    id: 'community_shop',
    title: 'Community Shop',
    rows: 4,
    slots: [
      slot(4, 'emerald', 'Elizabeth', [
        line(`Bits: ${(player.bits ?? 0).toLocaleString()}`, 'green'),
        line('Spend Bits on permanent upgrades.', 'gray'),
      ]),
      ...COMMUNITY_OFFERS.map((offer, i) => {
        const bought = player.communityPurchases?.[offer.id] ?? 0;
        const maxed = bought >= offer.maxPurchases;
        return slot(19 + i * 2, offer.icon, offer.name, [
          line(offer.detail, 'gray'),
          line(`${offer.bits} bits  (${bought}/${offer.maxPurchases})`, 'yellow'),
          line(maxed ? 'Sold out' : (player.bits ?? 0) >= offer.bits ? 'Click to buy!' : 'Not enough bits', maxed ? 'red' : (player.bits ?? 0) >= offer.bits ? 'green' : 'red'),
        ], maxed ? undefined : `shop:community:${offer.id}`, { disabled: maxed, glint: !maxed && (player.bits ?? 0) >= offer.bits });
      }),
      slot(27, 'arrow', 'Go Back', [line('SkyBlock Menu')], 'open:skyblock'),
      close(),
    ],
    parent: 'skyblock',
  };
}

export function essenceShopMenu(player: PlayerState): MenuView {
  return {
    id: 'essence_shop',
    title: 'Essence Shop',
    rows: 4,
    slots: [
      slot(4, 'nether_star', 'Dungeon Essence', [
        line(Object.entries(player.essence ?? {}).map(([type, qty]) => `${type}: ${qty}`).join(' · ') || 'No essence yet.', 'aqua'),
        line('Spend essence on dungeon gear.', 'gray'),
      ]),
      ...ESSENCE_SHOP.map((offer, i) => {
        const have = player.essence?.[offer.essence] ?? 0;
        return slot(19 + i, offer.itemId, offer.name, [
          line(offer.detail, 'gray'),
          line(`${offer.cost} ${offer.essence} essence`, 'yellow'),
          line(have >= offer.cost ? 'Click to buy!' : `Have ${have}`, have >= offer.cost ? 'green' : 'red'),
        ], have >= offer.cost ? `shop:essence:${offer.id}` : undefined, { itemId: offer.itemId, disabled: have < offer.cost });
      }),
      slot(27, 'arrow', 'Go Back', [line('Catacombs')], 'open:dungeons'),
      close(),
    ],
    parent: 'dungeons',
  };
}

export function medalShopMenu(player: PlayerState): MenuView {
  const medals = player.garden?.jacobMedals ?? { bronze: 0, silver: 0, gold: 0 };
  return {
    id: 'medal_shop',
    title: "Anita's Shop",
    rows: 4,
    slots: [
      slot(4, 'gold_ingot', 'Jacob Medals', [
        line(`${medals.bronze} bronze · ${medals.silver} silver · ${medals.gold} gold`, 'gold'),
        line('Win contests, then spend medals here.', 'gray'),
      ]),
      ...MEDAL_SHOP.map((offer, i) => {
        const have = medals[offer.medal] ?? 0;
        return slot(19 + i, offer.itemId, offer.name, [
          line(offer.detail, 'gray'),
          line(`${offer.cost} ${offer.medal} medal${offer.cost === 1 ? '' : 's'}`, 'yellow'),
          line(have >= offer.cost ? 'Click to buy!' : `Have ${have}`, have >= offer.cost ? 'green' : 'red'),
        ], have >= offer.cost ? `shop:medal:${offer.id}` : undefined, { itemId: offer.itemId, disabled: have < offer.cost });
      }),
      slot(27, 'arrow', 'Go Back', [line('The Garden')], 'open:garden'),
      close(),
    ],
    parent: 'garden',
  };
}

export function fetchurMenu(player: PlayerState): MenuView {
  const want = fetchurWant();
  const claimed = player.dailies?.fetchurClaimedDay === dayIndex();
  const have = countItem(player.inventory, want);
  return {
    id: 'fetchur',
    title: 'Fetchur',
    rows: 3,
    slots: [
      slot(13, want, claimed ? 'Come back tomorrow' : 'Fetchur wants this', [
        line(claimed ? 'Already paid today.' : `Give 1× ${ITEMS[want]?.name ?? want}`, claimed ? 'green' : 'yellow'),
        line(`You have ${have}`, have >= 1 ? 'green' : 'red'),
        line(`Reward: ${FETCHUR_BITS} bits`, 'gold'),
        line(claimed ? '' : 'Click to hand it over.', 'yellow'),
      ], claimed ? undefined : 'fetchur:claim', { itemId: want, glint: !claimed && have >= 1, disabled: claimed }),
      slot(18, 'arrow', 'Go Back', [line('SkyBlock Menu')], 'open:skyblock'),
      close(),
    ],
    parent: 'skyblock',
  };
}

