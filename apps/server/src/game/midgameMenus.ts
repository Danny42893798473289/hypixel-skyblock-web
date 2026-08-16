import {
  ALCHEMY_RECIPES,
  DRAGON_TYPES,
  HOTM_PERKS,
  ITEMS,
  MAYORS,
  MOBS,
  PET_EGGS,
  bestiaryTier,
  currentMayor,
  currentQuestStep,
  plotReady,
  skyblockLevelFromXp,
  skyblockXp,
  type LoreLine,
  type MenuSlotView,
  type MenuView,
  type PlayerState,
} from '@aether/shared';

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
  return {
    id: 'garden',
    title: 'The Garden',
    rows: 6,
    slots: [
      slot(4, 'wheat', "Jacob's Contest", [
        line(`Crop: ${ITEMS[garden.jacobCrop]?.name ?? garden.jacobCrop}`, 'yellow'),
        line(`Your score: ${garden.jacobScore}`, 'aqua'),
        line(`Medal: ${garden.jacobMedal ?? 'none'}`, 'gold'),
        line(`Ends in: ${Math.max(0, Math.ceil((garden.jacobContestEndsAt - Date.now()) / 60000))}m`, 'gray'),
        line('Harvest contest crop on plots to score.', 'gray'),
      ]),
      slot(10, 'hoe', 'Garden Plots', [
        line(`${ready} / ${garden.plots?.length ?? 24} ready to harvest`, 'green'),
        line('Use chat: plant/harvest via Garden zone', 'gray'),
        line(`Composter Lv ${garden.composterLevel ?? 0} · ${garden.organicMatter ?? 0}/100 OM`, 'aqua'),
      ]),
      visitor
        ? slot(13, 'player_head', `${visitor.name} is visiting`, [
          line(`Wants ${visitor.qty}× ${ITEMS[visitor.wants]?.name ?? visitor.wants}`, 'yellow'),
          line(`Reward: ${visitor.reward.toLocaleString()} coins`, 'gold'),
          click(),
        ], 'garden:visitor')
        : slot(13, 'barrier', 'No visitor', [line('A visitor will arrive soon.')]),
      slot(22, 'hoe', 'Milestones', [
        ...Object.entries(garden.harvested).slice(0, 6).map(([id, qty]) =>
          line(`${ITEMS[id]?.name ?? id}: ${qty.toLocaleString()}`, 'green')),
        line(Object.keys(garden.harvested).length ? '' : 'Harvest crops in the Garden.', 'gray'),
      ]),
      back(),
      close(),
    ],
    parent: 'skyblock',
  };
}

export function hotmMenu(player: PlayerState): MenuView {
  const hotm = player.hotm;
  return {
    id: 'hotm',
    title: 'Heart of the Mountain',
    rows: 6,
    slots: [
      slot(4, 'mithril', 'Heart of the Mountain', [
        line(`Tokens: ${hotm.tokens}`, 'aqua'),
        line(`Mithril Powder: ${hotm.mithrilPowder}`, 'green'),
      ]),
      ...HOTM_PERKS.map((perk, i) => {
        const level = hotm.perks[perk.id] ?? 0;
        return slot(10 + i, 'crystal', `${perk.name} ${level}/${perk.max}`, [
          line(perk.description),
          line(`Cost: ${perk.cost} token${perk.cost === 1 ? '' : 's'}`, 'yellow'),
          level >= perk.max ? line('Maxed', 'green') : line('Click to unlock / upgrade', 'yellow'),
        ], level >= perk.max ? undefined : `hotm:${perk.id}`);
      }),
      ...hotm.commissions.map((job, i) => slot(28 + i, job.itemId, job.label, [
        line(`${job.have}/${job.need} ${ITEMS[job.itemId]?.name ?? job.itemId}`, 'yellow'),
        line(`+${job.rewardTokens} token, +${job.rewardCoins} coins`, 'gold'),
        job.have >= job.need ? line('Click to claim!', 'green') : line('Mine this ore in the Dwarven Mines.', 'gray'),
      ], job.have >= job.need ? `commission:${job.id}` : undefined)),
      back(),
      close(),
    ],
    parent: 'skyblock',
  };
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
