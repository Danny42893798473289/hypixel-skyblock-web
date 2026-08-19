import { useEffect, useRef, useState } from 'react';
import {
  ITEMS,
  STAT_KEYS,
  npcSellPrice,
  type ItemStack,
  type LoreLine,
  type MenuSlotView,
  type MenuView,
  type PlayerState,
} from '@aether/shared';
import { ItemIcon } from './ItemIcon';
import { HeldCursorGhost, ItemSlotButton, LoreTooltip, formatCount, useSlotGestures } from './slotUtils';
import type { ClickButton } from './slotUtils';

interface Props {
  menu: MenuView;
  player: PlayerState;
  onMenuClick: (slot: number, button: ClickButton, action?: string) => void;
  onClose: () => void;
  onBack: () => void;
  onSearch?: (query: string) => void;
  breadcrumbs?: string[];
  onBreadcrumb?: (index: number) => void;
  onQuickOpen?: (target: string) => void;
}

export function ChestMenu({ menu, player, onMenuClick, onClose, onBack, onSearch, breadcrumbs = [], onBreadcrumb, onQuickOpen }: Props) {
  const storageMenu = menu.id === 'backpack' || menu.id === 'backpack_page' || menu.id === 'sacks' || menu.id === 'sack_view';
  const cursor = storageMenu ? player.inventoryCursor ?? null : null;
  const searchEnabled = (menu.id === 'bazaar' && Boolean(onSearch)) || menu.id === 'skyblock';
  const [searchText, setSearchText] = useState(String(menu.context?.query ?? ''));
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<number | null>(null);
  const quickActions = menu.id === 'skyblock'
    ? SKYBLOCK_QUICK_ACTIONS.filter((entry) => {
      const q = searchText.trim().toLowerCase();
      if (!q) return true;
      return entry.label.toLowerCase().includes(q);
    }).slice(0, 8)
    : [];

  useEffect(() => {
    if (document.activeElement === searchInputRef.current) return;
    setSearchText(String(menu.context?.query ?? ''));
  }, [menu.context?.query]);

  useEffect(() => () => {
    if (searchTimer.current != null) window.clearTimeout(searchTimer.current);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const menuSlots = new Map(menu.slots.map((entry) => [entry.slot, entry]));
  return (
    <div className="chest-overlay chest-menu" role="dialog" aria-label={menu.title}>
      <HeldCursorGhost stack={cursor} />
      <div className={`chest-window rows-${menu.rows}`}>
        <div className="chest-title">
          <span>{menu.title}</span>
          <span className="chest-title-buttons">
            <button type="button" onClick={onBack} aria-label="Go back">◀</button>
            <button type="button" onClick={onClose} aria-label="Close menu">✕</button>
          </span>
        </div>
        {breadcrumbs.length > 0 ? (
          <div className="menu-breadcrumbs">
            {breadcrumbs.map((crumb, index) => (
              <button
                key={`${crumb}-${index}`}
                type="button"
                className="menu-crumb"
                onClick={() => onBreadcrumb?.(index)}
                disabled={index === breadcrumbs.length - 1}
              >
                {crumb}
              </button>
            ))}
          </div>
        ) : null}
        {searchEnabled ? (
          <form
            className="chest-search-row"
            onSubmit={(event) => {
              event.preventDefault();
              if (menu.id === 'bazaar') onSearch?.(searchText.trim());
            }}
          >
            <input
              ref={searchInputRef}
              className="auction-search chest-search"
              value={searchText}
              onChange={(event) => {
                const next = event.target.value;
                setSearchText(next);
                if (searchTimer.current != null) window.clearTimeout(searchTimer.current);
                if (menu.id === 'bazaar') {
                  searchTimer.current = window.setTimeout(() => {
                    const q = next.trim();
                    if (q === String(menu.context?.query ?? '').trim()) return;
                    onSearch?.(q);
                  }, 160);
                }
              }}
              placeholder={menu.id === 'bazaar' ? 'Search bazaar items…' : 'Quick search menus…'}
              maxLength={64}
              autoComplete="off"
              spellCheck={false}
            />
            {menu.id === 'bazaar' ? (
              <button
                type="button"
                className="chest-sell-inventory"
                onClick={() => onMenuClick(31, 'left', 'bazaarSellInventory')}
              >
                Sell Inventory
              </button>
            ) : null}
          </form>
        ) : null}
        {menu.id === 'skyblock' && quickActions.length ? (
          <div className="quick-actions">
            {quickActions.map((entry) => (
              <button key={entry.id} type="button" className="quick-action-btn" onClick={() => onQuickOpen?.(entry.target)}>
                {entry.label}
              </button>
            ))}
          </div>
        ) : null}
        <div className="chest-grid" style={{ gridTemplateRows: `repeat(${menu.rows}, var(--slot-size))` }}>
          {Array.from({ length: menu.rows * 9 }, (_, index) => {
            const view = menuSlots.get(index);
            return view
              ? <MenuSlot key={index} view={view} onClick={(button) => {
                  if (view.action === 'bazaarSearch:') searchInputRef.current?.focus();
                  onMenuClick(index, button, view.action);
                }} />
              : <div className="mc-slot empty" key={index} />;
          })}
        </div>
        <div className="inventory-label">Inventory</div>
        <div className="chest-grid player-inventory">
          {player.inventory.map((stack, index) => (
            storageMenu ? (
              <ItemSlotButton
                key={index}
                stack={stack}
                onClick={(button) => onMenuClick(index, button, `inventoryClick:${index}`)}
              />
            ) : (
              <InventorySlot
                key={index}
                stack={stack}
                index={index}
                player={player}
                sellMenu={menu.id === 'npc_shop' || menu.id === 'bank'}
                onClick={(button) => onMenuClick(index, button, `inventory:${index}`)}
              />
            )
          ))}
        </div>
        <div className="menu-hint">
          {storageMenu
            ? 'Click slots to pick up and place items · Shift-click or double-tap to move stacks · Esc closes'
            : menu.id === 'garden_plots'
              ? 'Empty plot: plant · Growing: right-click water · Ready: harvest · Esc closes'
              : menu.id === 'trade'
                ? 'Click your offer slots, then inventory items · Confirm when both ready · Esc cancels'
                : 'Left click · Hold for item info · Double-tap to shift-click · Esc closes'}
        </div>
      </div>
    </div>
  );
}

function MenuSlot({ view, onClick }: { view: MenuSlotView; onClick: (button: ClickButton) => void }) {
  const locked = Boolean(view.disabled);
  const empty = !view.itemId && !view.icon;
  const gestures = useSlotGestures(locked ? undefined : onClick);
  if (empty) {
    return (
      <button
        type="button"
        className="mc-slot empty interactive"
        aria-label="Empty slot"
        {...(locked ? {} : gestures)}
      />
    );
  }
  return (
    <button
      type="button"
      className={`mc-slot interactive rarity-${(view.rarity ?? 'common').toLowerCase()} ${view.glint ? 'enchanted' : ''} ${locked ? 'is-locked' : ''}`}
      aria-disabled={locked}
      aria-label={view.name}
      {...(locked ? {} : gestures)}
    >
      <ItemIcon icon={view.icon} itemId={view.itemId} rarity={view.rarity} />
      {view.count && view.count > 1 ? <span className="stack-count">{formatCount(view.count)}</span> : null}
      <LoreTooltip
        name={view.name}
        rarity={view.rarity}
        lore={view.lore}
        onRightClick={locked ? undefined : () => onClick('right')}
        onShiftClick={locked ? undefined : () => onClick('shift_left')}
      />
    </button>
  );
}

function InventorySlot({
  stack,
  index,
  player,
  sellMenu,
  onClick,
}: {
  stack: ItemStack | null;
  index: number;
  player: PlayerState;
  sellMenu?: boolean;
  onClick: (button: ClickButton) => void;
}) {
  const def = stack ? ITEMS[stack.itemId] : undefined;
  if (!stack || !def) return <div className={`mc-slot empty inventory-slot slot-${index}`} />;
  const sellPrice = sellMenu ? npcSellPrice(stack.itemId) : null;
  const extraLore = sellPrice != null
    ? [{ text: `Sell Price: ${sellPrice} coins`, color: 'gold' as const }, { text: 'Click to sell!', color: 'yellow' as const }]
    : [];
  const compareLore = statComparisonLore(def, player);
  return <ItemSlotButton stack={stack} extraLore={[...extraLore, ...compareLore]} onClick={onClick} />;
}

const SKYBLOCK_QUICK_ACTIONS = [
  { id: 'bazaar', label: 'Bazaar', target: 'bazaar' },
  { id: 'auction', label: 'Auction House', target: 'auction' },
  { id: 'bank', label: 'Bank', target: 'bank' },
  { id: 'fast_travel', label: 'Fast Travel', target: 'fast_travel' },
  { id: 'dungeons', label: 'Dungeons', target: 'dungeons' },
  { id: 'garden', label: 'Garden', target: 'garden' },
  { id: 'hotm', label: 'Heart of the Mountain', target: 'hotm' },
  { id: 'inventory', label: 'Inventory', target: 'inventory' },
];

function statComparisonLore(def: (typeof ITEMS)[string], player: PlayerState): LoreLine[] {
  const target = equipmentSlotForType(def.type);
  if (!target) return [];
  const equipped = player.equipment[target];
  const equippedDef = equipped ? ITEMS[equipped.itemId] : null;
  const lines: LoreLine[] = [{ text: '', color: 'gray' }, { text: `Compare (${target})`, color: 'gray' }];
  let diffCount = 0;
  for (const key of STAT_KEYS) {
    const next = def.stats?.[key] ?? 0;
    const current = equippedDef?.stats?.[key] ?? 0;
    const diff = next - current;
    if (diff === 0) continue;
    diffCount += 1;
    lines.push({ text: `${diff > 0 ? '▲' : '▼'} ${prettyStat(key)} ${Math.abs(Math.round(diff * 10) / 10)}`, color: diff > 0 ? 'green' : 'red' });
  }
  return diffCount > 0 ? lines : [{ text: '', color: 'gray' }, { text: `Compare (${target}) no stat change`, color: 'gray' }];
}

function equipmentSlotForType(type?: string) {
  if (type === 'HELMET') return 'helmet' as const;
  if (type === 'CHESTPLATE') return 'chestplate' as const;
  if (type === 'LEGGINGS') return 'leggings' as const;
  if (type === 'BOOTS') return 'boots' as const;
  return null;
}

function prettyStat(stat: string): string {
  if (stat === 'critChance') return 'Crit Chance';
  if (stat === 'critDamage') return 'Crit Damage';
  if (stat === 'attackSpeed') return 'Attack Speed';
  if (stat === 'magicFind') return 'Magic Find';
  if (stat === 'petLuck') return 'Pet Luck';
  if (stat === 'miningSpeed') return 'Mining Speed';
  if (stat === 'miningFortune') return 'Mining Fortune';
  if (stat === 'farmingFortune') return 'Farming Fortune';
  if (stat === 'foragingFortune') return 'Foraging Fortune';
  if (stat === 'seaCreatureChance') return 'Sea Creature Chance';
  if (stat === 'trueDefense') return 'True Defense';
  if (stat === 'healthRegen') return 'Health Regen';
  return stat[0].toUpperCase() + stat.slice(1);
}
