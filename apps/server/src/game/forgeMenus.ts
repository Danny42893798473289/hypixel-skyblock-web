import {
  BIOFUEL_ITEM,
  FORGE_CATEGORIES,
  ITEMS,
  buildForgeLore,
  buildItemLore,
  canForge,
  countItem,
  drillFuelCap,
  drillFuelRemaining,
  forgeRecipesInCategory,
  forgeUnlocked,
  isDrillItem,
  playerGemstonePowder,
  type ForgeCategory,
  type LoreLine,
  type MenuSlotView,
  type MenuView,
  type PlayerState,
} from '@aether/shared';

const GRID = [
  10, 11, 12, 13, 14, 15, 16,
  19, 20, 21, 22, 23, 24, 25,
  28, 29, 30, 31, 32, 33, 34,
  37, 38, 39, 40, 41, 42, 43,
];

const line = (text: string, color: LoreLine['color'] = 'gray', bold = false): LoreLine => ({ text, color, bold });

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

function pageControls(category: string, page: number, pages: number): MenuSlotView[] {
  const slots: MenuSlotView[] = [];
  const target = (next: number) => `page:forge|${next}|category=${encodeURIComponent(category)}`;
  if (page > 0) slots.push(slot(48, 'arrow_left', 'Previous Page', [line(`Page ${page}/${pages}`)], target(page - 1)));
  if (page < pages - 1) slots.push(slot(50, 'arrow_right', 'Next Page', [line(`Page ${page + 2}/${pages}`)], target(page + 1)));
  return slots;
}

export function forgeMenu(player: PlayerState, context: Record<string, string | number | boolean> = {}): MenuView {
  const category = (FORGE_CATEGORIES.find((entry) => entry.id === context.category)?.id ?? 'drills') as ForgeCategory | 'refuel';
  const page = Math.max(0, Number(context.page ?? 0));
  const powder = playerGemstonePowder(player);

  if (context.category === 'refuel') {
    return refuelMenu(player, powder);
  }

  const entries = forgeRecipesInCategory(category as ForgeCategory);
  const pages = Math.max(1, Math.ceil(entries.length / GRID.length));
  const visible = entries.slice(page * GRID.length, page * GRID.length + GRID.length);
  const categoryName = FORGE_CATEGORIES.find((entry) => entry.id === category)?.name ?? 'Forge';

  const tabs = [
    ...FORGE_CATEGORIES.map((entry, i) => slot(i, entry.icon, `${entry.id === category ? '▶ ' : ''}${entry.name}`, [
      line(`${forgeRecipesInCategory(entry.id).length} recipes`, 'aqua'),
      line('Click to view!', 'yellow'),
    ], `forgeTab:${entry.id}`, { glint: entry.id === category })),
    slot(8, 'potion', 'Refuel', [
      line('Fully refuel drills with Biofuel.', 'gray'),
      line('Click to open!', 'yellow'),
    ], 'forgeTab:refuel'),
  ];

  const items = visible.map((recipe, i) => {
    const unlocked = forgeUnlocked(recipe, player);
    const ready = canForge(recipe, player);
    const def = ITEMS[recipe.result];
    return slot(GRID[i], def?.sprite ?? recipe.result, recipe.name, buildForgeLore(recipe, player), unlocked ? `forge:${recipe.id}` : undefined, {
      itemId: recipe.result,
      rarity: def?.rarity ?? 'COMMON',
      disabled: !unlocked,
      glint: ready,
    });
  });

  return {
    id: 'forge',
    title: `Crystal Forge ➜ ${categoryName}`,
    rows: 6,
    context: { category, page },
    slots: [
      ...tabs,
      ...items,
      slot(45, 'arrow', 'Go Back', [line('SkyBlock Menu')], 'open:skyblock'),
      slot(49, 'barrier', 'Close', [line('Close this menu')], 'close'),
      slot(53, 'gem', 'Gemstone Powder', [
        line(`${powder.toLocaleString()} powder`, 'light_purple'),
        line(`${countItem(player.inventory, BIOFUEL_ITEM)} Biofuel`, 'green'),
      ]),
      ...pageControls(String(category), page, pages),
    ],
    parent: 'skyblock',
  };
}

function refuelMenu(player: PlayerState, powder: number): MenuView {
  const drills = player.inventory
    .map((stack, index) => ({ stack, index }))
    .filter((entry): entry is { stack: NonNullable<typeof entry.stack>; index: number } => Boolean(entry.stack && isDrillItem(entry.stack.itemId)));

  const items = drills.slice(0, GRID.length).map((entry, i) => {
    const def = ITEMS[entry.stack.itemId];
    const cap = drillFuelCap(entry.stack);
    const fuel = drillFuelRemaining(entry.stack);
    const view = slot(GRID[i], def?.sprite ?? 'drill', def?.name ?? entry.stack.itemId, [
      ...buildItemLore(def, entry.stack),
      line(''),
      line(fuel >= cap ? 'Already full' : 'Click to fully refuel with Biofuel', fuel >= cap ? 'gray' : 'yellow'),
    ], fuel >= cap ? undefined : `forge:refuel:${entry.index}`, {
      itemId: entry.stack.itemId,
      rarity: def?.rarity ?? 'COMMON',
      glint: fuel < cap,
    });
    return view;
  });

  return {
    id: 'forge',
    title: 'Crystal Forge ➜ Refuel',
    rows: 6,
    context: { category: 'refuel', page: 0 },
    slots: [
      ...FORGE_CATEGORIES.map((entry, i) => slot(i, entry.icon, entry.name, [line('Click to view!', 'yellow')], `forgeTab:${entry.id}`)),
      slot(8, 'potion', '▶ Refuel', [line(`${countItem(player.inventory, BIOFUEL_ITEM)} Biofuel`, 'green')], 'forgeTab:refuel', { glint: true }),
      ...items,
      slot(45, 'arrow', 'Go Back', [line('SkyBlock Menu')], 'open:skyblock'),
      slot(49, 'barrier', 'Close', [line('Close this menu')], 'close'),
      slot(53, 'gem', 'Gemstone Powder', [line(`${powder.toLocaleString()} powder`, 'light_purple')]),
    ],
    parent: 'skyblock',
  };
}
