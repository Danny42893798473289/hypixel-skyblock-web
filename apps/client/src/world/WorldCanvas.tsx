import { useEffect, useMemo, useRef, useState } from 'react';
import {
  TILE,
  DUNGEON_ZONE,
  buildDungeonRoomMap,
  dungeonPhase,
  islandMap,
  nearestEntity,
  overlayLiveWorld,
  playerWorldMap,
  applyIslandBlocks,
  isHoldingPlaceable,
  type IslandMap,
  type PlayerPublic,
  type PlayerState,
  type WorldEntity,
} from '@aether/shared';
import { drawEntity, drawPlayer, drawTile } from './sprites';
import { useMovement } from './useMovement';
import { TouchControls } from './TouchControls';
import { gameSocket } from '../api/socket';

interface Props {
  player: PlayerState;
  zonePlayers: PlayerPublic[];
  inputDisabled: boolean;
  chatFocused: boolean;
  touchMode: boolean;
  onOpenMenu: () => void;
  onOpenInventory: () => void;
}

interface RemotePosition {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  facing: PlayerPublic['facing'];
  player: PlayerPublic;
  updatedAt: number;
}

/** Fairy souls only fade in once you are almost standing on them. */
const FAIRY_REVEAL_DISTANCE = 2.6;

function islandBlocksKey(player: PlayerState): string {
  const blocks = player.islandBlocks;
  if (!blocks) return '';
  const keys = Object.keys(blocks);
  if (!keys.length) return '';
  return keys.map((key) => `${key}:${blocks[key]}`).join('|');
}

function dungeonCollisionKey(player: PlayerState): string {
  const run = player.dungeonRun;
  if (!run || player.zoneId !== DUNGEON_ZONE) return '';
  return `${run.floorId}:${dungeonPhase(run)}:${run.room}`;
}

function liveWorldKey(player: PlayerState): string {
  const mobs = (player.worldMobs ?? []).map((mob) => `${mob.id}:${Math.ceil(mob.hp)}`).join(',');
  const minions = (player.minions ?? []).map((minion) => `${minion.id}:${minion.storage}`).join(',');
  const run = player.dungeonRun;
  const dungeon = run
    ? `${run.bossHp ?? 0}:${run.roomCleared ? 1 : 0}:${run.secretClaimed ? 1 : 0}:${JSON.stringify(run.mobHp ?? {})}`
    : '';
  return `${mobs}|${minions}|${dungeon}`;
}

export function WorldCanvas({ player, zonePlayers, inputDisabled, chatFocused, touchMode, onOpenMenu, onOpenInventory }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const collisionKey = player.zoneId === DUNGEON_ZONE
    ? dungeonCollisionKey(player)
    : `${player.islandId}:${islandBlocksKey(player)}`;
  // collisionKey covers island + dungeon floor/phase/room, not object identity.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const collisionMap = useMemo((): IslandMap => {
    if (player.dungeonRun && player.zoneId === DUNGEON_ZONE) return buildDungeonRoomMap(player.dungeonRun);
    const base = islandMap(player.islandId);
    return player.islandId === 'private_island' ? applyIslandBlocks(base, player.islandBlocks) : base;
  }, [collisionKey]);
  const overlayKey = liveWorldKey(player);
  // overlayKey is the stable digest of mob HP / minion storage / dungeon combat.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const liveMap = useMemo(
    () => (player.dungeonRun && player.zoneId === DUNGEON_ZONE ? playerWorldMap(player) : overlayLiveWorld(collisionMap, player)),
    [collisionMap, overlayKey],
  );
  const { positionRef, movingRef, setTouchAnalog, setTouchSprint } = useMovement(
    player,
    collisionMap,
    inputDisabled || (chatFocused && !touchMode),
  );
  const remotesRef = useRef(new Map<string, RemotePosition>());
  const [nearby, setNearby] = useState<WorldEntity | null>(null);
  const nearbyIdRef = useRef<string | null>(null);
  const nearbyRef = useRef<WorldEntity | null>(null);
  const foundFairies = useMemo(() => new Set(player.visitedZones.filter((entry) => entry.startsWith('fairy:'))), [player.visitedZones]);
  const liveMapRef = useRef(liveMap);
  const foundFairiesRef = useRef(foundFairies);
  const usernameRef = useRef(player.username);
  liveMapRef.current = liveMap;
  foundFairiesRef.current = foundFairies;
  usernameRef.current = player.username;
  nearbyRef.current = nearby;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, [contenteditable="true"]')) return;
      if (event.key.toLowerCase() !== 'e' || event.repeat || inputDisabled || chatFocused) return;
      event.preventDefault();
      if (nearbyRef.current) gameSocket.send({ type: 'interact' });
      else onOpenInventory();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chatFocused, inputDisabled, onOpenInventory]);

  useEffect(() => {
    const seen = new Set<string>();
    for (const remote of zonePlayers) {
      if (remote.id === player.id || remote.islandId !== player.islandId) continue;
      seen.add(remote.id);
      const existing = remotesRef.current.get(remote.id);
      if (existing) {
        existing.targetX = remote.x;
        existing.targetY = remote.y;
        existing.facing = remote.facing;
        existing.player = remote;
        existing.updatedAt = performance.now();
      } else {
        remotesRef.current.set(remote.id, {
          x: remote.x,
          y: remote.y,
          targetX: remote.x,
          targetY: remote.y,
          facing: remote.facing,
          player: remote,
          updatedAt: performance.now(),
        });
      }
    }
    for (const id of remotesRef.current.keys()) {
      if (!seen.has(id)) remotesRef.current.delete(id);
    }
  }, [player.id, player.islandId, zonePlayers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let animationFrame = 0;
    const render = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        ctx.imageSmoothingEnabled = false;
      }
      const cssWidth = width / dpr;
      const cssHeight = height / dpr;
      const tilesAcross = cssWidth < 700 ? 14 : 20;
      const tilesDown = cssWidth < 700 ? 10 : 14;
      const scale = Math.max(2, Math.min(5, Math.floor(Math.min(cssWidth / (TILE * tilesAcross), cssHeight / (TILE * tilesDown)))));
      const viewportWidth = cssWidth / scale;
      const viewportHeight = cssHeight / scale;
      const map = liveMapRef.current;
      const local = positionRef.current;
      const worldWidth = map.width * TILE;
      const worldHeight = map.height * TILE;
      const overscan = map.islandId === 'private_island' ? TILE * 6 : 0;
      const minCamX = -overscan;
      const minCamY = -overscan;
      const maxCamX = Math.max(minCamX, worldWidth - viewportWidth + overscan);
      const maxCamY = Math.max(minCamY, worldHeight - viewportHeight + overscan);
      const cameraX = clamp(local.x * TILE - viewportWidth / 2, minCamX, maxCamX);
      const cameraY = clamp(local.y * TILE - viewportHeight / 2, minCamY, maxCamY);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = map.theme.sky;
      ctx.fillRect(0, 0, cssWidth, cssHeight);
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, -cameraX * dpr * scale, -cameraY * dpr * scale);
      ctx.imageSmoothingEnabled = false;

      const firstX = Math.max(0, Math.floor(cameraX / TILE) - 1);
      const firstY = Math.max(0, Math.floor(cameraY / TILE) - 1);
      const lastX = Math.min(map.width - 1, Math.ceil((cameraX + viewportWidth) / TILE) + 1);
      const lastY = Math.min(map.height - 1, Math.ceil((cameraY + viewportHeight) / TILE) + 1);
      for (let y = firstY; y <= lastY; y++) {
        for (let x = firstX; x <= lastX; x++) drawTile(ctx, map.tiles[y][x], x, y);
      }

      const nearest = nearestEntity(map, local.x, local.y);
      nearbyRef.current = nearest;
      if ((nearest?.id ?? null) !== nearbyIdRef.current) {
        nearbyIdRef.current = nearest?.id ?? null;
        setNearby(nearest);
      }

      const drawables: Array<{ y: number; draw: () => void }> = [];
      for (const entity of map.entities) {
        if (entity.x < firstX - 2 || entity.x > lastX + 2 || entity.y < firstY - 2 || entity.y > lastY + 3) continue;
        if (entity.kind === 'fairy') {
          if (foundFairiesRef.current.has(entity.id)) continue;
          const distance = Math.hypot(entity.x - local.x, entity.y - local.y);
          if (distance > FAIRY_REVEAL_DISTANCE) continue;
          const alpha = 1 - distance / FAIRY_REVEAL_DISTANCE;
          drawables.push({ y: entity.y, draw: () => drawEntity(ctx, entity, entity.id === nearest?.id, alpha) });
          continue;
        }
        drawables.push({ y: entity.y, draw: () => drawEntity(ctx, entity, entity.id === nearest?.id) });
        if (entity.kind === 'sign') {
          drawables.push({ y: entity.y + 0.01, draw: () => drawNameplate(ctx, entity.label, entity.x, entity.y - 0.85, '#ffd24a') });
        }
      }

      for (const remote of remotesRef.current.values()) {
        remote.x += (remote.targetX - remote.x) * 0.24;
        remote.y += (remote.targetY - remote.y) * 0.24;
        const moving = Math.hypot(remote.targetX - remote.x, remote.targetY - remote.y) > 0.015;
        drawables.push({
          y: remote.y,
          draw: () => {
            drawPlayer(ctx, remote.x, remote.y, remote.facing, moving, Math.floor(now / 170), false);
            drawNameplate(ctx, remote.player.username, remote.x, remote.y - 1.15, '#ffffff');
          },
        });
      }
      drawables.push({
        y: local.y,
        draw: () => {
          drawPlayer(ctx, local.x, local.y, local.facing, movingRef.current, Math.floor(now / 150), true);
          drawNameplate(ctx, usernameRef.current, local.x, local.y - 1.15, '#ffff55');
        },
      });
      drawables.sort((a, b) => a.y - b.y);
      for (const drawable of drawables) drawable.draw();

      if (nearest && nearest.kind !== 'sign') {
        drawNameplate(ctx, nearest.label, nearest.x, nearest.y - 1.3, '#55ffff');
      }
      animationFrame = requestAnimationFrame(render);
    };
    animationFrame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrame);
  }, [movingRef, positionRef]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="world-canvas"
        aria-label={`Island: ${player.islandId}`}
        onContextMenu={(event) => {
          event.preventDefault();
          if (inputDisabled || chatFocused) return;
          if (isHoldingPlaceable(player)) gameSocket.send({ type: 'placeBlock' });
          else gameSocket.send({ type: 'useAbility' });
        }}
        onClick={(event) => {
          if (event.button !== 0 || inputDisabled || chatFocused || touchMode) return;
          const target = nearbyRef.current;
          if (target && target.kind !== 'mob' && target.kind !== 'sign' && target.kind !== 'decor') {
            gameSocket.send({ type: 'interact' });
            return;
          }
          if (target?.kind === 'mob') {
            gameSocket.send({ type: 'attack' });
            return;
          }
          if (player.islandId === 'private_island') gameSocket.send({ type: 'breakBlock' });
          else gameSocket.send({ type: 'attack' });
        }}
      />
      {!inputDisabled && nearby ? (
        <div className="interact-prompt">
          <kbd>{touchMode ? (nearby.kind === 'mob' ? 'ATK' : 'USE') : nearby.kind === 'mob' ? 'CLICK' : 'E'}</kbd>
          <span>{interactionText(nearby, player)}</span>
        </div>
      ) : null}
      {player.gatherChannel ? (
        <div className="gather-hud">
          {gatherPrompt(player.gatherChannel)}
        </div>
      ) : null}
      {touchMode ? (
        <TouchControls
          onAnalog={setTouchAnalog}
          onSprint={setTouchSprint}
          onInteract={() => {
            if (isHoldingPlaceable(player)) gameSocket.send({ type: 'placeBlock' });
            else gameSocket.send({ type: 'interact' });
          }}
          onAttack={() => {
            if (nearbyRef.current?.kind === 'mob') gameSocket.send({ type: 'attack' });
            else if (player.islandId === 'private_island') gameSocket.send({ type: 'breakBlock' });
            else gameSocket.send({ type: 'attack' });
          }}
          onAbility={() => {
            if (isHoldingPlaceable(player)) gameSocket.send({ type: 'placeBlock' });
            else gameSocket.send({ type: 'useAbility' });
          }}
          onMenu={onOpenMenu}
          onInventory={onOpenInventory}
          disabled={inputDisabled}
        />
      ) : (
        <div className="movement-hint">
          {player.islandId === 'private_island'
            ? 'Punch to break · right-click / R / USE to place · cobble expands into void · E interact · WASD move'
            : 'WASD · Shift sprint · click attack · E interact / inventory · R ability · wheel hotbar · Q drop · I inventory · M menu'}
        </div>
      )}
    </>
  );
}

function drawNameplate(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
): void {
  ctx.save();
  ctx.font = '5px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  const width = ctx.measureText(text).width + 5;
  ctx.fillStyle = '#000000aa';
  ctx.fillRect(x * TILE - width / 2, y * TILE - 7, width, 7);
  ctx.fillStyle = color;
  ctx.fillText(text, x * TILE, y * TILE - 1);
  ctx.restore();
}

function interactionText(entity: WorldEntity, player: PlayerState): string {
  if (entity.kind === 'door') return entity.label.includes('Locked') ? entity.label : `Open ${entity.label.split('—')[0]?.trim() ?? entity.label}`;
  if (entity.kind === 'mob') {
    if (entity.actionId?.startsWith('slayerboss:')) return `Attack ${entity.label}`;
    if (entity.actionId?.startsWith('worldmob:') || entity.actionId?.startsWith('dungeon:')) return `Attack ${entity.label.split(' (')[0]}`;
    return `Fight ${entity.label}`;
  }
  if (entity.kind === 'resource') {
    if (player.gatherChannel?.entityId === entity.id && player.gatherChannel.kind === 'fish') {
      return player.gatherChannel.fishPhase === 'bite' ? 'Reel it in!' : 'Waiting for a bite...';
    }
    return entity.label;
  }
  if (entity.kind === 'fairy') return 'Collect Fairy Soul';
  if (entity.kind === 'npc') return `Talk to ${entity.label}`;
  return `Open ${entity.label}`;
}

function gatherPrompt(channel: NonNullable<PlayerState['gatherChannel']>): string {
  if (channel.kind === 'fish') {
    return channel.fishPhase === 'bite' ? 'Something is biting! Press E!' : 'Fishing... waiting for a bite';
  }
  const elapsed = Date.now() - channel.startedAt;
  const pct = Math.min(100, Math.floor((elapsed / channel.durationMs) * 100));
  const verb = channel.kind === 'mine' ? 'Mining' : channel.kind === 'farm' ? 'Harvesting' : 'Chopping';
  return `${verb}... ${pct}%  (keep pressing E)`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
