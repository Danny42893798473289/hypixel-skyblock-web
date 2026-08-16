import { useEffect, useRef, useState } from 'react';
import {
  ITEMS,
  npcSellPrice,
  type ItemStack,
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
}

export function ChestMenu({ menu, player, onMenuClick, onClose, onBack, onSearch }: Props) {
  const storageMenu = menu.id === 'backpack' || menu.id === 'backpack_page';
  const cursor = storageMenu ? player.inventoryCursor ?? null : null;
  const searchEnabled = menu.id === 'bazaar' && Boolean(onSearch);
  const [searchText, setSearchText] = useState(String(menu.context?.query ?? ''));
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<number | null>(null);

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
    <div className="chest-overlay" role="dialog" aria-label={menu.title}>
      <HeldCursorGhost stack={cursor} />
      <div className={`chest-window rows-${menu.rows}`}>
        <div className="chest-title">
          <span>{menu.title}</span>
          <span className="chest-title-buttons">
            <button type="button" onClick={onBack} aria-label="Go back">◀</button>
            <button type="button" onClick={onClose} aria-label="Close menu">✕</button>
          </span>
        </div>
        {searchEnabled ? (
          <form
            className="chest-search-row"
            onSubmit={(event) => {
              event.preventDefault();
              onSearch?.(searchText.trim());
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
                searchTimer.current = window.setTimeout(() => {
                  const q = next.trim();
                  if (q === String(menu.context?.query ?? '').trim()) return;
                  onSearch?.(q);
                }, 160);
              }}
              placeholder="Search bazaar items…"
              maxLength={64}
              autoComplete="off"
              spellCheck={false}
            />
          </form>
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
                sellMenu={menu.id === 'npc_shop' || menu.id === 'bank'}
                onClick={(button) => onMenuClick(index, button, `inventory:${index}`)}
              />
            )
          ))}
        </div>
        <div className="menu-hint">
          {storageMenu
            ? 'Click slots to pick up and place items · Shift-click or double-tap to move stacks · Esc closes'
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
  sellMenu,
  onClick,
}: {
  stack: ItemStack | null;
  index: number;
  sellMenu?: boolean;
  onClick: (button: ClickButton) => void;
}) {
  const def = stack ? ITEMS[stack.itemId] : undefined;
  if (!stack || !def) return <div className={`mc-slot empty inventory-slot slot-${index}`} />;
  const sellPrice = sellMenu ? npcSellPrice(stack.itemId) : null;
  const extraLore = sellPrice != null
    ? [{ text: `Sell Price: ${sellPrice} coins`, color: 'gold' as const }, { text: 'Click to sell!', color: 'yellow' as const }]
    : [];
  return <ItemSlotButton stack={stack} extraLore={extraLore} onClick={onClick} />;
}
