import type { PointerEvent as ReactPointerEvent } from 'react';
import type { MoveDirection } from './useMovement';

interface Props {
  onDirection: (direction: MoveDirection, active: boolean) => void;
  onInteract: () => void;
  onAbility: () => void;
  onMenu: () => void;
  onInventory: () => void;
  disabled: boolean;
}

const PAD: Array<{ direction: MoveDirection; label: string; className: string }> = [
  { direction: 'up', label: '▲', className: 'pad-up' },
  { direction: 'left', label: '◀', className: 'pad-left' },
  { direction: 'right', label: '▶', className: 'pad-right' },
  { direction: 'down', label: '▼', className: 'pad-down' },
];

export function TouchControls({ onDirection, onInteract, onAbility, onMenu, onInventory, disabled }: Props) {
  const press = (direction: MoveDirection, active: boolean) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (active) event.currentTarget.setPointerCapture?.(event.pointerId);
    onDirection(direction, active);
  };

  return (
    <div className={`touch-controls${disabled ? ' touch-controls-hidden' : ''}`}>
      <div className="touch-dpad">
        {PAD.map((button) => (
          <button
            key={button.direction}
            type="button"
            className={`touch-button ${button.className}`}
            aria-label={`Move ${button.direction}`}
            onPointerDown={press(button.direction, true)}
            onPointerUp={press(button.direction, false)}
            onPointerCancel={press(button.direction, false)}
            onPointerLeave={press(button.direction, false)}
            onContextMenu={(event) => event.preventDefault()}
          >
            {button.label}
          </button>
        ))}
      </div>
      <div className="touch-actions">
        <button type="button" className="touch-button touch-interact" onClick={onInteract}>USE</button>
        <button type="button" className="touch-button touch-ability" onClick={onAbility}>RMB</button>
        <button type="button" className="touch-button touch-inventory" onClick={onInventory}>INV</button>
        <button type="button" className="touch-button touch-menu" onClick={onMenu}>MENU</button>
      </div>
    </div>
  );
}
