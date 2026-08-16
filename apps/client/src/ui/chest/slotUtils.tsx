import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
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

function isCoarsePointer(): boolean {
  return window.matchMedia('(pointer: coarse)').matches;
}

/**
 * Tap = left-click, double-tap = shift-click, long-press is reserved for the inspect sheet.
 * Desktop right-click / shift-click stay on contextmenu and the Shift modifier.
 */
export function useSlotGestures(onClick?: (button: ClickButton) => void) {
  const lastTap = useRef(0);
  const held = useRef(false);
  const timer = useRef<number | null>(null);

  const cancelHoldTimer = () => {
    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = null;
  };

  return {
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (!onClick || event.pointerType !== 'touch') return;
      held.current = false;
      cancelHoldTimer();
      timer.current = window.setTimeout(() => {
        held.current = true;
      }, 380);
    },
    onPointerUp: cancelHoldTimer,
    onPointerCancel: cancelHoldTimer,
    onPointerLeave: cancelHoldTimer,
    onClick: onClick
      ? (event: ReactMouseEvent<HTMLButtonElement>) => {
          if (held.current) {
            held.current = false;
            return;
          }
          const now = Date.now();
          if (isCoarsePointer() && now - lastTap.current < 400) {
            lastTap.current = 0;
            onClick('shift_left');
            return;
          }
          lastTap.current = now;
          onClick(event.shiftKey ? 'shift_left' : 'left');
        }
      : undefined,
    onContextMenu: onClick
      ? (event: ReactMouseEvent<HTMLButtonElement>) => {
          event.preventDefault();
          onClick(event.shiftKey ? 'shift_right' : 'right');
        }
      : undefined,
  };
}

/** Only one floating lore card at a time — recipe re-renders used to leave the last hover stuck. */
let hideActiveTooltip: (() => void) | null = null;

function followPointer(clientX: number, clientY: number): { x: number; y: number } {
  const width = 330;
  const pad = 8;
  let x = clientX + 16;
  let y = clientY + 18;
  if (x + width > window.innerWidth - pad) x = Math.max(pad, clientX - width - 12);
  if (y + 220 > window.innerHeight - pad) y = Math.max(pad, clientY - 160);
  return { x, y };
}

export function LoreTooltip({
  name,
  rarity,
  lore,
  onRightClick,
  onShiftClick,
  rightLabel = 'Right-click',
  shiftLabel = 'Shift-click',
}: Pick<MenuSlotView, 'name' | 'rarity' | 'lore'> & {
  onRightClick?: () => void;
  onShiftClick?: () => void;
  rightLabel?: string;
  shiftLabel?: string;
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const openRef = useRef(false);
  const pinnedRef = useRef(false);
  openRef.current = open;
  pinnedRef.current = pinned;

  useEffect(() => {
    const slot = anchorRef.current?.closest('.mc-slot');
    if (!slot || !(slot instanceof HTMLElement)) return;

    const hide = () => {
      setOpen(false);
      setPinned(false);
      if (hideActiveTooltip === hide) hideActiveTooltip = null;
    };
    const show = (pin: boolean, clientX?: number, clientY?: number) => {
      hideActiveTooltip?.();
      hideActiveTooltip = hide;
      if (pin || isCoarsePointer()) {
        setPos({ x: 8, y: Math.max(8, window.innerHeight - 292) });
      } else if (clientX != null && clientY != null) {
        setPos(followPointer(clientX, clientY));
      }
      setPinned(pin);
      setOpen(true);
    };

    let holdTimer: number | null = null;
    const cancelHold = () => {
      if (holdTimer != null) window.clearTimeout(holdTimer);
      holdTimer = null;
    };
    const onPointerEnter = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      show(false, event.clientX, event.clientY);
    };
    const onPointerLeave = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      if (!pinnedRef.current) hide();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || pinnedRef.current || !openRef.current) return;
      setPos(followPointer(event.clientX, event.clientY));
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || event.pointerType === 'pen') {
        cancelHold();
        holdTimer = window.setTimeout(() => show(true), 380);
      }
    };
    const onWindowPointerDown = (event: PointerEvent) => {
      if (!openRef.current) return;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (slot.contains(target)) return;
      if (target instanceof Element && target.closest('.lore-tooltip')) return;
      hide();
    };

    slot.addEventListener('pointerenter', onPointerEnter);
    slot.addEventListener('pointerleave', onPointerLeave);
    slot.addEventListener('pointermove', onPointerMove);
    slot.addEventListener('pointerdown', onPointerDown);
    slot.addEventListener('pointerup', cancelHold);
    slot.addEventListener('pointercancel', cancelHold);
    window.addEventListener('pointerdown', onWindowPointerDown, true);
    window.addEventListener('scroll', hide, true);
    return () => {
      cancelHold();
      hide();
      slot.removeEventListener('pointerenter', onPointerEnter);
      slot.removeEventListener('pointerleave', onPointerLeave);
      slot.removeEventListener('pointermove', onPointerMove);
      slot.removeEventListener('pointerdown', onPointerDown);
      slot.removeEventListener('pointerup', cancelHold);
      slot.removeEventListener('pointercancel', cancelHold);
      window.removeEventListener('pointerdown', onWindowPointerDown, true);
      window.removeEventListener('scroll', hide, true);
    };
  }, []);

  return (
    <>
      <span ref={anchorRef} className="lore-tooltip-anchor" />
      {open && name
        ? createPortal(
          <span
            className={`lore-tooltip lore-tooltip-floating${pinned ? ' lore-tooltip-pinned' : ''}`}
            role="tooltip"
            style={pinned ? undefined : { left: pos.x, top: pos.y }}
          >
            {pinned ? (
              <button
                type="button"
                className="lore-tooltip-close"
                aria-label="Close item info"
                onClick={() => {
                  setOpen(false);
                  setPinned(false);
                  hideActiveTooltip = null;
                }}
              >
                ✕
              </button>
            ) : null}
            <span className={`lore-line rarity-text-${(rarity ?? 'common').toLowerCase()} bold`}>{name}</span>
            {lore.map((entry, index) => (
              <span
                key={`${index}-${entry.text}`}
                className={`lore-line mc-${entry.color ?? 'white'} ${entry.bold ? 'bold' : ''} ${entry.italic ? 'italic' : ''}`}
              >
                {entry.text || '\u00a0'}
              </span>
            ))}
            {pinned && (onRightClick || onShiftClick) ? (
              <span className="lore-tooltip-actions">
                {onRightClick ? (
                  <button
                    type="button"
                    onClick={() => {
                      onRightClick();
                      setOpen(false);
                      setPinned(false);
                      hideActiveTooltip = null;
                    }}
                  >
                    {rightLabel}
                  </button>
                ) : null}
                {onShiftClick ? (
                  <button
                    type="button"
                    onClick={() => {
                      onShiftClick();
                      setOpen(false);
                      setPinned(false);
                      hideActiveTooltip = null;
                    }}
                  >
                    {shiftLabel}
                  </button>
                ) : null}
              </span>
            ) : null}
          </span>,
          document.body,
        )
        : null}
    </>
  );
}

export function HeldCursorGhost({ stack }: { stack: ItemStack | null }) {
  const [pos, setPos] = useState({ x: -400, y: -400 });

  useEffect(() => {
    if (!stack) return;
    const move = (event: PointerEvent) => setPos({ x: event.clientX, y: event.clientY });
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, [stack]);

  if (!stack) return null;
  const def = ITEMS[stack.itemId];
  if (!def) return null;

  return createPortal(
    <div className="held-cursor-ghost" style={{ left: pos.x, top: pos.y }}>
      <div
        className={`mc-slot inventory-held-slot rarity-${(def.rarity ?? 'common').toLowerCase()} ${
          stack.enchantments && Object.keys(stack.enchantments).length ? 'enchanted' : ''
        }`}
      >
        <ItemIcon icon={def.sprite ?? ''} itemId={stack.itemId} rarity={def.rarity} />
        {stack.qty > 1 ? <span className="stack-count">{formatCount(stack.qty)}</span> : null}
      </div>
    </div>,
    document.body,
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
  const gestures = useSlotGestures(onClick);

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
        {...gestures}
      />
    );
  }

  const lore = [...buildItemLore(def, stack), ...extraLore];

  return (
    <button
      type="button"
      className={`mc-slot interactive rarity-${(def.rarity ?? 'common').toLowerCase()} ${stack.enchantments && Object.keys(stack.enchantments).length ? 'enchanted' : ''} ${className}`.trim()}
      {...gestures}
    >
      <ItemIcon icon={def.sprite ?? ''} itemId={stack.itemId} rarity={def.rarity} />
      {stack.qty > 1 ? <span className="stack-count">{formatCount(stack.qty)}</span> : null}
      <LoreTooltip
        name={itemDisplayName(def, stack)}
        rarity={def.rarity}
        lore={lore}
        onRightClick={() => onClick('right')}
        onShiftClick={() => onClick('shift_left')}
      />
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
  const gestures = useSlotGestures(disabled ? undefined : onClick);

  return (
    <button
      type="button"
      className={`mc-slot interactive ${onClick ? '' : 'empty'} rarity-${(rarity ?? 'common').toLowerCase()} ${glint ? 'enchanted' : ''} ${disabled ? 'is-locked' : ''} ${className}`.trim()}
      aria-disabled={disabled}
      aria-label={name}
      {...(onClick && !disabled ? gestures : {})}
    >
      <ItemIcon icon={icon} itemId={itemId} rarity={rarity} />
      {count && count > 1 ? <span className="stack-count">{formatCount(count)}</span> : null}
      <LoreTooltip
        name={name}
        rarity={rarity}
        lore={lore}
        onRightClick={onClick && !disabled ? () => onClick('right') : undefined}
        onShiftClick={onClick && !disabled ? () => onClick('shift_left') : undefined}
      />
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
