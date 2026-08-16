import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  ITEMS,
  buildItemLore,
  itemDisplayName,
  type ItemStack,
  type LoreLine,
  type MenuSlotView,
} from '@aether/shared';
import { ItemIcon } from './ItemIcon';

export type ClickButton = 'left' | 'right' | 'shift_left' | 'shift_right';

export function formatCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

export function formatBazaarPrice(price: number): string {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(2)}M`;
  if (price >= 1_000) return `${(price / 1_000).toFixed(1)}k`;
  return price.toFixed(1);
}

/** On touch screens a long press stands in for a right click. */
export function useLongPress(onClick: (button: ClickButton) => void) {
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

export function LoreTooltip({ name, rarity, lore }: Pick<MenuSlotView, 'name' | 'rarity' | 'lore'>) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const slot = anchorRef.current?.closest('.mc-slot');
    if (!slot || !(slot instanceof HTMLElement)) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const place = () => {
      const rect = slot.getBoundingClientRect();
      const width = 330;
      const pad = 8;
      let x = rect.right + pad;
      let y = rect.top;
      if (x + width > window.innerWidth - pad) x = Math.max(pad, rect.left - width - pad);
      if (y + 280 > window.innerHeight - pad) y = Math.max(pad, window.innerHeight - 280);
      setPos({ x, y });
      setOpen(true);
    };
    const hide = () => setOpen(false);
    slot.addEventListener('mouseenter', place);
    slot.addEventListener('mouseleave', hide);
    slot.addEventListener('focus', place);
    slot.addEventListener('blur', hide);
    return () => {
      slot.removeEventListener('mouseenter', place);
      slot.removeEventListener('mouseleave', hide);
      slot.removeEventListener('focus', place);
      slot.removeEventListener('blur', hide);
    };
  }, [name, lore]);

  return (
    <>
      <span ref={anchorRef} className="lore-tooltip-anchor" />
      {open && name
        ? createPortal(
          <span className="lore-tooltip lore-tooltip-floating" role="tooltip" style={{ left: pos.x, top: pos.y }}>
            <span className={`lore-line rarity-text-${(rarity ?? 'common').toLowerCase()} bold`}>{name}</span>
            {lore.map((entry, index) => (
              <span
                key={`${index}-${entry.text}`}
                className={`lore-line mc-${entry.color ?? 'white'} ${entry.bold ? 'bold' : ''} ${entry.italic ? 'italic' : ''}`}
              >
                {entry.text || '\u00a0'}
              </span>
            ))}
          </span>,
          document.body,
        )
        : null}
    </>
  );
}

interface ItemSlotProps {
  stack: ItemStack | null;
  emptyLabel?: string;
  extraLore?: LoreLine[];
  onClick?: (button: ClickButton) => void;
  className?: string;
}

export function ItemSlotButton({ stack, emptyLabel, extraLore = [], onClick, className = '' }: ItemSlotProps) {
  const def = stack ? ITEMS[stack.itemId] : undefined;
  const { consumeLongPress, ...press } = useLongPress(onClick ?? (() => {}));

  if (!onClick) {
    return (
      <div className={`mc-slot empty ${className}`.trim()} aria-label={emptyLabel ?? 'Empty slot'} />
    );
  }

  if (!stack || !def) {
    return (
      <button
        type="button"
        className={`mc-slot empty interactive ${className}`.trim()}
        aria-label={emptyLabel ?? 'Empty slot'}
        {...press}
        onClick={(event) => {
          if (consumeLongPress()) return;
          onClick(event.shiftKey ? 'shift_left' : 'left');
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          onClick(event.shiftKey ? 'shift_right' : 'right');
        }}
      />
    );
  }

  const lore = [...buildItemLore(def, stack), ...extraLore];

  return (
    <button
      type="button"
      className={`mc-slot interactive rarity-${(def.rarity ?? 'common').toLowerCase()} ${stack.enchantments && Object.keys(stack.enchantments).length ? 'enchanted' : ''} ${className}`.trim()}
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

interface IconSlotProps {
  icon: string;
  itemId?: string;
  name: string;
  lore: LoreLine[];
  rarity?: string;
  count?: number;
  disabled?: boolean;
  glint?: boolean;
  onClick?: (button: ClickButton) => void;
  className?: string;
}

export function IconSlotButton({
  icon,
  itemId,
  name,
  lore,
  rarity,
  count,
  disabled,
  glint,
  onClick,
  className = '',
}: IconSlotProps) {
  const { consumeLongPress, ...press } = useLongPress(onClick ?? (() => {}));

  return (
    <button
      type="button"
      className={`mc-slot interactive ${onClick ? '' : 'empty'} rarity-${(rarity ?? 'common').toLowerCase()} ${glint ? 'enchanted' : ''} ${disabled ? 'is-locked' : ''} ${className}`.trim()}
      aria-disabled={disabled}
      {...(onClick ? press : {})}
      onClick={onClick ? (event) => {
        if (consumeLongPress()) return;
        onClick(event.shiftKey ? 'shift_left' : 'left');
      } : undefined}
      onContextMenu={onClick ? (event) => {
        event.preventDefault();
        onClick(event.shiftKey ? 'shift_right' : 'right');
      } : undefined}
      aria-label={name}
    >
      <ItemIcon icon={icon} itemId={itemId} rarity={rarity} />
      {count && count > 1 ? <span className="stack-count">{formatCount(count)}</span> : null}
      <LoreTooltip name={name} rarity={rarity} lore={lore} />
    </button>
  );
}

interface OverlayProps {
  title: string;
  onClose: () => void;
  onBack?: () => void;
  children: ReactNode;
  className?: string;
}

export function MenuOverlay({ title, onClose, onBack, children, className = '' }: OverlayProps) {
  return (
    <div className="chest-overlay" role="dialog" aria-label={title}>
      <div className={`chest-window ${className}`.trim()}>
        <div className="chest-title">
          <span>{title}</span>
          <span className="chest-title-buttons">
            {onBack ? <button type="button" onClick={onBack} aria-label="Go back">◀</button> : null}
            <button type="button" onClick={onClose} aria-label="Close menu">✕</button>
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
