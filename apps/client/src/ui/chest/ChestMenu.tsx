import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import {
  ITEMS,
  buildItemLore,
  itemDisplayName,
  npcSellPrice,
  type ItemStack,
  type MenuSlotView,
  type MenuView,
  type PlayerState,
} from '@aether/shared';
import { ItemIcon } from './ItemIcon';
import { ItemSlotButton, LoreTooltip, formatCount } from './slotUtils';

type ClickButton = 'left' | 'right' | 'shift_left' | 'shift_right';

interface Props {
  menu: MenuView;
  player: PlayerState;
  onMenuClick: (slot: number, button: ClickButton, action?: string) => void;
  onClose: () => void;
  onBack: () => void;
}

export function ChestMenu({ menu, player, onMenuClick, onClose, onBack }: Props) {
  const storageMenu = menu.id === 'backpack' || menu.id === 'backpack_page';
  const cursor = storageMenu ? player.inventoryCursor ?? null : null;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Backspace') {
        event.preventDefault();
        onBack();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBack, onClose]);

  const menuSlots = new Map(menu.slots.map((entry) => [entry.slot, entry]));
  return (
    <div className="chest-overlay" role="dialog" aria-label={menu.title}>
      <div className={`chest-window rows-${menu.rows}`}>
        <div className="chest-title">
          <span>{menu.title}</span>
          <span className="chest-title-buttons">
            <button type="button" onClick={onBack} aria-label="Go back">◀</button>
            <button type="button" onClick={onClose} aria-label="Close menu">✕</button>
          </span>
        </div>
        {cursor ? (
          <div className="inventory-cursor-float">
            <ItemSlotButton
              stack={cursor}
              extraLore={[{ text: 'Item on your cursor.', color: 'gray' }]}
              onClick={() => undefined}
              className="inventory-held-slot"
            />
          </div>
        ) : null}
        <div className="chest-grid" style={{ gridTemplateRows: `repeat(${menu.rows}, var(--slot-size))` }}>
          {Array.from({ length: menu.rows * 9 }, (_, index) => {
            const view = menuSlots.get(index);
            return view
              ? <MenuSlot key={index} view={view} onClick={(button) => onMenuClick(index, button, view.action)} />
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
            ? 'Click slots to pick up and place items · Shift-click to move between backpack and inventory · Esc closes'
            : 'Left click · Right click (long-press on touch) · Shift click · Esc closes · Backspace goes back'}
        </div>
      </div>
    </div>
  );
}

/** On touch screens a long press stands in for a right click. */
function useLongPress(onClick: (button: ClickButton) => void) {
  const timer = useRef<number | null>(null);
  const fired = useRef(false);

  const cancel = () => {
    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = null;
  };

  return {
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.pointerType !== 'touch') return;
      fired.current = false;
      cancel();
      timer.current = window.setTimeout(() => {
        fired.current = true;
        onClick('right');
      }, 420);
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
    consumeLongPress: () => {
      const handled = fired.current;
      fired.current = false;
      return handled;
    },
  };
}

function MenuSlot({ view, onClick }: { view: MenuSlotView; onClick: (button: ClickButton) => void }) {
  const locked = Boolean(view.disabled);
  const empty = !view.itemId && !view.icon;
  const { consumeLongPress, ...press } = useLongPress(locked ? () => {} : onClick);
  if (empty) {
    return (
      <button
        type="button"
        className="mc-slot empty interactive"
        aria-label="Empty slot"
        {...(locked ? {} : press)}
        onClick={locked ? undefined : (event) => {
          if (consumeLongPress()) return;
          onClick(event.shiftKey ? 'shift_left' : 'left');
        }}
        onContextMenu={locked ? undefined : (event) => {
          event.preventDefault();
          onClick(event.shiftKey ? 'shift_right' : 'right');
        }}
      />
    );
  }
  return (
    <button
      type="button"
      className={`mc-slot interactive rarity-${(view.rarity ?? 'common').toLowerCase()} ${view.glint ? 'enchanted' : ''} ${locked ? 'is-locked' : ''}`}
      aria-disabled={locked}
      {...(locked ? {} : press)}
      onClick={locked ? undefined : (event) => {
        if (consumeLongPress()) return;
        onClick(event.shiftKey ? 'shift_left' : 'left');
      }}
      onContextMenu={locked ? undefined : (event) => {
        event.preventDefault();
        onClick(event.shiftKey ? 'shift_right' : 'right');
      }}
      aria-label={view.name}
    >
      <ItemIcon icon={view.icon} itemId={view.itemId} rarity={view.rarity} />
      {view.count && view.count > 1 ? <span className="stack-count">{formatCount(view.count)}</span> : null}
      <LoreTooltip name={view.name} rarity={view.rarity} lore={view.lore} />
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
  const { consumeLongPress, ...press } = useLongPress(onClick);
  if (!stack || !def) return <div className={`mc-slot empty inventory-slot slot-${index}`} />;
  const sellPrice = sellMenu ? npcSellPrice(stack.itemId) : null;
  const lore = sellPrice != null
    ? [...buildItemLore(def, stack), { text: `Sell Price: ${sellPrice} coins`, color: 'gold' as const }, { text: 'Click to sell!', color: 'yellow' as const }]
    : buildItemLore(def, stack);
  return (
    <button
      className={`mc-slot interactive rarity-${(def.rarity ?? 'common').toLowerCase()} ${stack.enchantments && Object.keys(stack.enchantments).length ? 'enchanted' : ''}`}
      {...press}
      onClick={(event) => {
        if (consumeLongPress()) return;
        onClick(event.shiftKey ? 'shift_left' : 'left');
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        onClick(event.shiftKey ? 'shift_right' : 'right');
      }}
    >
      <ItemIcon icon={def.sprite ?? ''} itemId={stack.itemId} rarity={def.rarity} />
      {stack.qty > 1 ? <span className="stack-count">{formatCount(stack.qty)}</span> : null}
      <LoreTooltip name={itemDisplayName(def, stack)} rarity={def.rarity} lore={lore} />
    </button>
  );
}
