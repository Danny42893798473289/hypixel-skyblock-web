import { useCallback, useEffect, useRef } from 'react';
import {
  MOVE_SPEED,
  canStand,
  isHoldingPlaceable,
  type Facing,
  type IslandMap,
  type PlayerState,
} from '@aether/shared';
import { gameSocket } from '../api/socket';

export interface LocalPosition {
  x: number;
  y: number;
  facing: Facing;
}

export type MoveDirection = 'up' | 'down' | 'left' | 'right';

/** Only hard-snap when this far from the server (warps, island travel, etc.). */
const HARD_RECONCILE_TILES = 2.2;
/** Ignore tiny server nudges while actively moving — common on high-latency links. */
const SOFT_RECONCILE_TILES = 0.2;
const ANALOG_DEADZONE = 0.12;
const ANALOG_SPRINT = 0.88;

export function useMovement(player: PlayerState, map: IslandMap, disabled: boolean) {
  const positionRef = useRef<LocalPosition>({ x: player.x, y: player.y, facing: player.facing });
  const movingRef = useRef(false);
  const disabledRef = useRef(disabled);
  const keysRef = useRef(new Set<string>());
  const touchRef = useRef(new Set<MoveDirection>());
  const analogRef = useRef({ x: 0, y: 0 });
  const sprintRef = useRef(false);
  const sprintHoldRef = useRef(false);
  const lastIslandRef = useRef(player.islandId);
  const mapRef = useRef(map);
  const playerRef = useRef(player);
  mapRef.current = map;
  playerRef.current = player;

  useEffect(() => {
    disabledRef.current = disabled;
    if (disabled) {
      keysRef.current.clear();
      touchRef.current.clear();
      analogRef.current = { x: 0, y: 0 };
      sprintRef.current = false;
      sprintHoldRef.current = false;
      movingRef.current = false;
    }
  }, [disabled]);

  /** Apply authoritative position only when it clearly isn't just lag catching up. */
  const reconcileTo = useCallback((x: number, y: number, facing: Facing, force = false) => {
    const dx = x - positionRef.current.x;
    const dy = y - positionRef.current.y;
    const desync = Math.hypot(dx, dy);
    if (force || desync > HARD_RECONCILE_TILES) {
      positionRef.current = { x, y, facing };
      return;
    }
    if (desync <= SOFT_RECONCILE_TILES) return;
    if (movingRef.current) return;
    positionRef.current.x += dx * 0.45;
    positionRef.current.y += dy * 0.45;
    positionRef.current.facing = facing;
  }, []);

  useEffect(() => {
    const islandChanged = lastIslandRef.current !== player.islandId;
    if (player.resetPosition || islandChanged) {
      reconcileTo(player.x, player.y, player.facing, true);
    }
    lastIslandRef.current = player.islandId;
  }, [player.facing, player.islandId, player.resetPosition, player.x, player.y, reconcileTo]);

  useEffect(() => {
    const off = gameSocket.on((event) => {
      if (event.type !== 'moveCorrection') return;
      const force = event.reason === 'blocked' || event.reason === 'gate' || event.reason === 'teleport';
      if (!force && movingRef.current) return;
      reconcileTo(event.x, event.y, event.facing, force);
    });
    return off;
  }, [reconcileTo]);

  useEffect(() => {
    const movementKeys = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, [contenteditable="true"]')) return;
      if (event.key === 'Shift') {
        sprintRef.current = true;
        return;
      }
      const key = event.key.toLowerCase();
      if (key === 'r' && !disabledRef.current && !event.repeat) {
        event.preventDefault();
        gameSocket.send({ type: isHoldingPlaceable(playerRef.current) ? 'placeBlock' : 'useAbility' });
        return;
      }
      if (!movementKeys.has(key) || disabledRef.current) return;
      event.preventDefault();
      keysRef.current.add(key);
      if (event.shiftKey) sprintRef.current = true;
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') sprintRef.current = false;
      keysRef.current.delete(event.key.toLowerCase());
    };
    const clear = () => {
      keysRef.current.clear();
      touchRef.current.clear();
      analogRef.current = { x: 0, y: 0 };
      sprintRef.current = false;
      sprintHoldRef.current = false;
      movingRef.current = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clear);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clear);
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    let previous = performance.now();
    let lastSentAt = 0;
    const update = (now: number) => {
      const delta = Math.min(0.05, (now - previous) / 1000);
      previous = now;
      const keys = keysRef.current;
      const touches = touchRef.current;
      const analog = analogRef.current;
      const analogMag = Math.hypot(analog.x, analog.y);
      let dx = 0;
      let dy = 0;
      if (!disabledRef.current) {
        if (keys.has('a') || keys.has('arrowleft') || touches.has('left')) dx--;
        if (keys.has('d') || keys.has('arrowright') || touches.has('right')) dx++;
        if (keys.has('w') || keys.has('arrowup') || touches.has('up')) dy--;
        if (keys.has('s') || keys.has('arrowdown') || touches.has('down')) dy++;
        if (analogMag > ANALOG_DEADZONE) {
          dx += analog.x;
          dy += analog.y;
        }
      }
      const moving = dx !== 0 || dy !== 0;
      movingRef.current = moving;
      if (moving) {
        const length = Math.hypot(dx, dy);
        dx /= length;
        dy /= length;
        const current = positionRef.current;
        if (Math.abs(dx) > Math.abs(dy)) current.facing = dx < 0 ? 'left' : 'right';
        else current.facing = dy < 0 ? 'up' : 'down';
        const sprint = sprintRef.current || sprintHoldRef.current || analogMag > ANALOG_SPRINT;
        const speed = MOVE_SPEED * (sprint ? 1.3 : 1);
        const distance = speed * delta;
        const nextX = current.x + dx * distance;
        const nextY = current.y + dy * distance;
        if (canStand(mapRef.current, nextX, current.y)) current.x = nextX;
        if (canStand(mapRef.current, current.x, nextY)) current.y = nextY;
        if (now - lastSentAt >= 55) {
          lastSentAt = now;
          gameSocket.send({ type: 'move', x: current.x, y: current.y, facing: current.facing });
        }
      }
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, []);

  const setTouchDirection = useCallback((direction: MoveDirection, active: boolean) => {
    if (active && !disabledRef.current) touchRef.current.add(direction);
    else touchRef.current.delete(direction);
  }, []);

  const setTouchAnalog = useCallback((x: number, y: number) => {
    analogRef.current = disabledRef.current ? { x: 0, y: 0 } : { x, y };
  }, []);

  const setTouchSprint = useCallback((active: boolean) => {
    sprintHoldRef.current = Boolean(active && !disabledRef.current);
    if (!active && !keysRef.current.has('shift')) sprintRef.current = false;
  }, []);

  return { positionRef, movingRef, setTouchDirection, setTouchAnalog, setTouchSprint };
}
