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

type ClickButton = 'left' | 'right' | 'shift_left' | 'shift_right';

interface Props {
  menu: MenuView;
  player: PlayerState;
  onMenuClick: (slot: number, button: ClickButton, action?: string) => void;
  onClose: () => void;
  onBack: () => void;
}

export function ChestMenu({ menu, player, onMenuClick, onClose, onBack }: Props) {
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
            <InventorySlot
              key={index}
              stack={stack}
              index={index}
              sellMenu={menu.id === 'npc_shop' || menu.id === 'bank'}
              onClick={(button) => onMenuClick(index, button, `inventory:${index}`)}
            />
          ))}
        </div>
        <div className="menu-hint">Left click · Right click (long-press on touch) · Shift click · Esc closes · Backspace goes back</div>
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
  const { consumeLongPress, ...press } = useLongPress(onClick);
  return (
    <button
      className={`mc-slot interactive rarity-${(view.rarity ?? 'common').toLowerCase()} ${view.glint ? 'enchanted' : ''}`}
      disabled={view.disabled}
      {...press}
      onClick={(event) => {
        if (consumeLongPress()) return;
        onClick(event.shiftKey ? 'shift_left' : 'left');
      }}
      onContextMenu={(event) => {
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

function LoreTooltip({ name, rarity, lore }: Pick<MenuSlotView, 'name' | 'rarity' | 'lore'>) {
  return (
    <span className="lore-tooltip" role="tooltip">
      <span className={`lore-line rarity-text-${(rarity ?? 'common').toLowerCase()} bold`}>{name}</span>
      {lore.map((entry, index) => (
        <span
          key={`${index}-${entry.text}`}
          className={`lore-line mc-${entry.color ?? 'white'} ${entry.bold ? 'bold' : ''} ${entry.italic ? 'italic' : ''}`}
        >
          {entry.text || '\u00a0'}
        </span>
      ))}
    </span>
  );
}

function formatCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}
