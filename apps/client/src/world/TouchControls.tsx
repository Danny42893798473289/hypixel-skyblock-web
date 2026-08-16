import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

interface Props {
  onAnalog: (x: number, y: number) => void;
  onSprint: (active: boolean) => void;
  onInteract: () => void;
  onAttack: () => void;
  onAbility: () => void;
  onMenu: () => void;
  onInventory: () => void;
  disabled: boolean;
}

export function TouchControls({
  onAnalog,
  onSprint,
  onInteract,
  onAttack,
  onAbility,
  onMenu,
  onInventory,
  disabled,
}: Props) {
  const areaRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [sprinting, setSprinting] = useState(false);

  const updateFromPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const max = Math.max(12, rect.width / 2 - 8);
    let dx = event.clientX - cx;
    let dy = event.clientY - cy;
    const mag = Math.hypot(dx, dy);
    if (mag > max) {
      dx = (dx / mag) * max;
      dy = (dy / mag) * max;
    }
    setKnob({ x: dx, y: dy });
    onAnalog(dx / max, dy / max);
  };

  const endStick = () => {
    dragging.current = false;
    setKnob({ x: 0, y: 0 });
    onAnalog(0, 0);
  };

  const pressSprint = (active: boolean) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (active) event.currentTarget.setPointerCapture?.(event.pointerId);
    setSprinting(active);
    onSprint(active);
  };

  return (
    <div className={`touch-controls${disabled ? ' touch-controls-hidden' : ''}`}>
      <div
        ref={areaRef}
        className="touch-stick"
        role="slider"
        aria-label="Move"
        aria-valuemin={-1}
        aria-valuemax={1}
        aria-valuenow={0}
        onPointerDown={(event) => {
          event.preventDefault();
          dragging.current = true;
          event.currentTarget.setPointerCapture?.(event.pointerId);
          updateFromPointer(event);
        }}
        onPointerMove={(event) => {
          if (!dragging.current) return;
          updateFromPointer(event);
        }}
        onPointerUp={endStick}
        onPointerCancel={endStick}
        onLostPointerCapture={endStick}
        onContextMenu={(event) => event.preventDefault()}
      >
        <div
          className="touch-stick-knob"
          style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
        />
      </div>
      <div className="touch-actions">
        <button type="button" className="touch-button touch-attack" onClick={onAttack}>ATK</button>
        <button type="button" className="touch-button touch-interact" onClick={onInteract}>USE</button>
        <button
          type="button"
          className={`touch-button touch-sprint${sprinting ? ' is-active' : ''}`}
          onPointerDown={pressSprint(true)}
          onPointerUp={pressSprint(false)}
          onPointerCancel={pressSprint(false)}
          onLostPointerCapture={pressSprint(false)}
          onContextMenu={(event) => event.preventDefault()}
        >
          SPRINT
        </button>
        <button type="button" className="touch-button touch-ability" onClick={onAbility}>RMB</button>
        <button type="button" className="touch-button touch-inventory" onClick={onInventory}>INV</button>
        <button type="button" className="touch-button touch-menu" onClick={onMenu}>MENU</button>
      </div>
    </div>
  );
}
