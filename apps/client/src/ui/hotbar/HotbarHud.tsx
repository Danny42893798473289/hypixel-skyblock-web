import { useRef } from 'react';
import { ITEMS, HOTBAR_SIZE, type PlayerState } from '@aether/shared';
import { ItemIcon } from '../chest/ItemIcon';
import { useLongPress } from '../chest/slotUtils';

interface Props {
  player: PlayerState;
  disabled?: boolean;
  touchMode?: boolean;
  onSelectSlot: (slot: number) => void;
  onUseSlot: (inventoryIndex: number) => void;
}

function formatCount(qty: number): string {
  if (qty >= 1_000_000) return `${(qty / 1_000_000).toFixed(1)}M`;
  if (qty >= 10_000) return `${Math.floor(qty / 1000)}k`;
  return String(qty);
}

function HotbarSlot({
  stack,
  slotIndex,
  active,
  touchMode,
  onSelect,
  onUse,
}: {
  stack: PlayerState['inventory'][number];
  slotIndex: number;
  active: boolean;
  touchMode: boolean;
  onSelect: () => void;
  onUse: () => void;
}) {
  const def = stack ? ITEMS[stack.itemId] : undefined;
  const { consumeLongPress, ...press } = useLongPress(() => onUse());

  return (
    <button
      type="button"
      className={`game-hotbar-slot mc-slot interactive${active ? ' active-hotbar' : ''}${!stack ? ' empty' : ''} rarity-${(def?.rarity ?? 'common').toLowerCase()}`.trim()}
      aria-label={def?.name ?? `Hotbar slot ${slotIndex + 1}`}
      {...press}
      onClick={(event) => {
        if (consumeLongPress()) return;
        event.preventDefault();
        onSelect();
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        onUse();
      }}
    >
      {!touchMode ? <span className="hotbar-key">{slotIndex + 1}</span> : null}
      {stack && def ? (
        <>
          <ItemIcon icon={def.sprite ?? ''} itemId={stack.itemId} rarity={def.rarity} />
          {stack.qty > 1 ? <span className="stack-count">{formatCount(stack.qty)}</span> : null}
        </>
      ) : null}
    </button>
  );
}

export function HotbarHud({ player, disabled = false, touchMode = false, onSelectSlot, onUseSlot }: Props) {
  const lastTap = useRef<{ slot: number; time: number } | null>(null);

  function handleSelect(slot: number) {
    if (disabled) return;
    if (touchMode) {
      const now = Date.now();
      if (lastTap.current?.slot === slot && now - lastTap.current.time < 400) {
        onUseSlot(27 + slot);
        lastTap.current = null;
        return;
      }
      lastTap.current = { slot, time: now };
    }
    onSelectSlot(slot);
  }

  return (
    <div className={`game-hotbar${touchMode ? ' game-hotbar-touch' : ''}${disabled ? ' game-hotbar-disabled' : ''}`.trim()} aria-label="Hotbar">
      {Array.from({ length: HOTBAR_SIZE }, (_, slot) => {
        const stack = player.inventory[27 + slot] ?? null;
        return (
          <HotbarSlot
            key={slot}
            stack={stack}
            slotIndex={slot}
            active={player.hotbarSlot === slot}
            touchMode={touchMode}
            onSelect={() => handleSelect(slot)}
            onUse={() => {
              if (!disabled) onUseSlot(27 + slot);
            }}
          />
        );
      })}
    </div>
  );
}
