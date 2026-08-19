import type { DungeonRunState } from './protocol.js';
import { dungeonFloor } from './dungeonContent.js';
import {
  currentBossPhase,
  currentRoomType,
  puzzlePadCount,
  roomHasSecret,
  roomNeedsMobs,
  secretPosition,
  type DungeonRoomType,
} from './dungeonPlay.js';
import { ISLAND_THEMES, islandMap, type IslandMap, type TileKind, type WorldEntity } from './world.js';
import { overlayLiveWorld, type WorldMobInstance } from './worldCombat.js';
import type { PlacedMinion } from './minions.js';
import { applyIslandBlocks, type IslandBlocks } from './islandBuild.js';

const ROOM_W = 26;
const ROOM_H = 18;
const DUNGEON_ZONE = 'dungeon_room';

function fmtHp(hp: number): string {
  if (hp >= 1_000_000) return `${(hp / 1_000_000).toFixed(1)}M`;
  if (hp >= 1_000) return `${Math.round(hp / 1_000)}k`;
  return String(Math.round(hp));
}

export function dungeonPhase(run: DungeonRunState): DungeonRunState['phase'] {
  if (run.phase) return run.phase;
  if (run.room === 0) return 'starter';
  if (run.room > run.rooms) return 'boss';
  return 'rooms';
}

function mobHealth(floorLevel: number, roomNum: number, master: boolean): number {
  const base = 2500 + floorLevel * 400 + roomNum * 700;
  return Math.round(base * (master ? 2.2 : 1));
}

function mobDamage(floorLevel: number, roomNum: number, master: boolean): number {
  const base = 80 + floorLevel * 15 + roomNum * 20;
  return Math.round(base * (master ? 1.8 : 1));
}

export function initRoomMobs(run: DungeonRunState): Record<string, number> {
  const floor = dungeonFloor(run.floorId);
  if (!floor) return {};
  const phase = dungeonPhase(run);
  if (phase !== 'rooms') return {};
  const type = currentRoomType(run);
  if (!roomNeedsMobs(type)) return {};

  const blood = run.room >= run.rooms;
  const mobCount = type === 'trap'
    ? 2
    : blood
      ? 4 + Math.min(2, Math.floor(run.room / 5))
      : 2 + Math.min(3, Math.floor(run.room / 2));
  const hp: Record<string, number> = {};
  for (let i = 0; i < mobCount; i++) {
    hp[`dungeon_mob:${i}`] = mobHealth(floor.requiredLevel, run.room, floor.master);
  }
  return hp;
}

function paintFilled(tiles: TileKind[][], ground: TileKind, wall: TileKind): void {
  for (let y = 0; y < ROOM_H; y++) {
    for (let x = 0; x < ROOM_W; x++) {
      const edge = x === 0 || y === 0 || x === ROOM_W - 1 || y === ROOM_H - 1;
      tiles[y][x] = edge ? wall : ground;
    }
  }
  tiles[Math.floor(ROOM_H / 2)][ROOM_W - 1] = ground;
  tiles[Math.floor(ROOM_H / 2) - 1][ROOM_W - 1] = ground;
}

function paintCombat(tiles: TileKind[][]): void {
  const theme = ISLAND_THEMES.dungeon_hub;
  paintFilled(tiles, theme.ground, theme.secondary);
  for (let y = 2; y < ROOM_H - 2; y++) {
    if (y >= 7 && y <= 10) continue;
    tiles[y][13] = theme.secondary;
  }
}

function paintPuzzle(tiles: TileKind[][]): void {
  const theme = ISLAND_THEMES.dungeon_hub;
  paintFilled(tiles, theme.ground, theme.secondary);
  for (let y = 6; y <= 13; y++) {
    for (let x = 7; x <= 18; x++) {
      tiles[y][x] = theme.path;
    }
  }
}

function paintTrap(tiles: TileKind[][]): void {
  const theme = ISLAND_THEMES.dungeon_hub;
  paintFilled(tiles, theme.ground, theme.secondary);
  for (let y = 6; y <= 11; y++) {
    for (let x = 8; x <= 17; x++) {
      tiles[y][x] = 'web';
    }
  }
}

function paintFairy(tiles: TileKind[][]): void {
  const theme = ISLAND_THEMES.dungeon_hub;
  paintFilled(tiles, theme.ground, theme.secondary);
  for (let y = 1; y <= 5; y++) {
    for (let x = 8; x <= 18; x++) {
      const alcoveWall = y === 5 ? (x < 12 || x > 14) : (x === 8 || x === 18);
      tiles[y][x] = alcoveWall ? theme.secondary : theme.ground;
    }
  }
}

function paintBoss(tiles: TileKind[][]): void {
  const theme = ISLAND_THEMES.dungeon_hub;
  paintFilled(tiles, theme.ground, theme.secondary);
  tiles[2][2] = 'obsidian';
  tiles[2][ROOM_W - 3] = 'obsidian';
  tiles[ROOM_H - 3][2] = 'obsidian';
  tiles[ROOM_H - 3][ROOM_W - 3] = 'obsidian';
}

function paintRoom(tiles: TileKind[][], type: DungeonRoomType | 'starter' | 'boss'): void {
  const theme = ISLAND_THEMES.dungeon_hub;
  if (type === 'combat') paintCombat(tiles);
  else if (type === 'puzzle') paintPuzzle(tiles);
  else if (type === 'trap') paintTrap(tiles);
  else if (type === 'fairy') paintFairy(tiles);
  else if (type === 'boss') paintBoss(tiles);
  else paintFilled(tiles, theme.ground, theme.secondary);
}

function mobSprite(room: number): string {
  if (room >= 8) return 'mob_dasher';
  if (room >= 4) return 'mob_lapis_zombie';
  return 'mob_zombie';
}

function mobName(room: number, master: boolean): string {
  const prefix = master ? 'Master ' : '';
  if (room >= 8) return `${prefix}Dungeon Skeleton`;
  if (room >= 4) return `${prefix}Dungeon Crypt`;
  return `${prefix}Dungeon Zombie`;
}

function roomTitle(run: DungeonRunState, type: DungeonRoomType | 'starter' | 'boss'): string {
  const floor = dungeonFloor(run.floorId);
  if (type === 'boss') return run.bossPhaseName ?? floor?.boss.name ?? 'Boss';
  if (type === 'starter') return 'Starter Room';
  if (type === 'puzzle') return `Puzzle Room ${run.room}/${run.rooms}`;
  if (type === 'trap') return `Trap Room ${run.room}/${run.rooms}`;
  if (type === 'fairy') return `Fairy Room ${run.room}/${run.rooms}`;
  return `Room ${run.room}/${run.rooms}`;
}

function puzzlePadPositions(): Array<{ x: number; y: number }> {
  return [
    { x: 8.5, y: 7.5 },
    { x: 17.5, y: 7.5 },
    { x: 8.5, y: 12.5 },
    { x: 17.5, y: 12.5 },
  ];
}

function packPosition(index: number, total: number): { x: number; y: number } {
  const pack = index < Math.ceil(total / 2) ? 0 : 1;
  const local = pack === 0 ? index : index - Math.ceil(total / 2);
  const col = local % 2;
  const row = Math.floor(local / 2);
  return {
    x: (pack === 0 ? 7.5 : 17.5) + col * 2.2,
    y: 8 + row * 2,
  };
}

function trapMobPosition(index: number): { x: number; y: number } {
  return { x: index === 0 ? 6.5 : 19.5, y: 9 };
}

/** Build the in-world map for the player's current dungeon room. */
export function buildDungeonRoomMap(run: DungeonRunState): IslandMap {
  const floor = dungeonFloor(run.floorId);
  const phase = dungeonPhase(run);
  const type = currentRoomType(run);
  const theme = ISLAND_THEMES.dungeon_hub;
  const tiles: TileKind[][] = Array.from({ length: ROOM_H }, () => Array.from({ length: ROOM_W }, () => theme.hazard));
  paintRoom(tiles, type);

  const spawn = { x: 3.5, y: ROOM_H / 2 };
  const entities: WorldEntity[] = [];
  const district = {
    zoneId: DUNGEON_ZONE,
    name: phase === 'boss' ? (run.bossPhaseName ?? 'Boss Room') : phase === 'starter' ? 'Starter Room' : roomTitle(run, type),
    x: 0,
    y: 0,
    width: ROOM_W,
    height: ROOM_H,
    centerX: Math.floor(ROOM_W / 2),
    centerY: Math.floor(ROOM_H / 2),
  };

  entities.push({
    id: 'sign:room',
    zoneId: DUNGEON_ZONE,
    x: ROOM_W / 2,
    y: 1.5,
    kind: 'sign',
    label: roomTitle(run, type),
    sprite: 'sign',
  });

  if (phase === 'starter') {
    entities.push({
      id: 'npc:mort',
      zoneId: DUNGEON_ZONE,
      x: ROOM_W / 2 - 3,
      y: ROOM_H / 2,
      kind: 'npc',
      label: 'Mort',
      sprite: 'npc_villager',
    });
    entities.push({
      id: 'door:next',
      zoneId: DUNGEON_ZONE,
      x: ROOM_W - 2.5,
      y: ROOM_H / 2,
      kind: 'door',
      label: 'Wither Door — Enter Catacombs',
      sprite: 'wither_door',
      actionId: 'dungeon:door',
    });
  } else if (phase === 'boss' && floor) {
    const mechanic = currentBossPhase(run).mechanic;
    const hideBoss = mechanic === 'golems' && Object.values(run.mobHp ?? {}).some((hp) => hp > 0);
    const bossHp = run.bossHp ?? floor.boss.health;
    if (!hideBoss && bossHp > 0) {
      entities.push({
        id: 'dungeon_boss',
        zoneId: DUNGEON_ZONE,
        x: ROOM_W / 2,
        y: ROOM_H / 2 - 1,
        kind: 'mob',
        label: `${run.bossPhaseName ?? floor.boss.name} (${fmtHp(bossHp)} ❤)`,
        sprite: 'mob_brute',
        actionId: 'dungeon:boss',
      });
    }
    const addHp = run.mobHp ?? {};
    let addIndex = 0;
    for (const [id, hp] of Object.entries(addHp)) {
      if (hp <= 0) continue;
      const clone = id.startsWith('dungeon_clone:');
      const crystal = id.startsWith('dungeon_crystal:');
      const golem = id.startsWith('dungeon_golem:');
      const col = addIndex % 3;
      const row = Math.floor(addIndex / 3);
      entities.push({
        id,
        zoneId: DUNGEON_ZONE,
        x: ROOM_W / 2 - 4 + col * 4,
        y: ROOM_H / 2 + 2 + row * 2.2,
        kind: 'mob',
        label: clone
          ? `Livid Clone (${fmtHp(hp)} ❤)`
          : crystal
            ? `Storm Crystal (${fmtHp(hp)} ❤)`
            : golem
              ? `Giant (${fmtHp(hp)} ❤)`
              : `Scarf Minion (${fmtHp(hp)} ❤)`,
        sprite: clone ? 'mob_brute' : crystal ? 'end_crystal' : golem ? 'mob_brute' : 'mob_zombie',
        actionId: `dungeon:mob:${id}`,
      });
      addIndex++;
    }
  } else if (phase === 'rooms' && floor) {
    if (type === 'puzzle') {
      puzzlePadPositions().slice(0, puzzlePadCount()).forEach((pos, i) => {
        const id = `dungeon_pad:${i}`;
        const on = Boolean(run.puzzlePads?.[id]);
        entities.push({
          id,
          zoneId: DUNGEON_ZONE,
          x: pos.x,
          y: pos.y,
          kind: 'station',
          label: on ? `Pad ${i + 1} — Activated` : `Puzzle Pad ${i + 1}`,
          sprite: on ? 'crystal' : 'enchant_table',
          actionId: `dungeon:pad:${i}`,
        });
      });
    }

    const mobHp = run.mobHp ?? initRoomMobs(run);
    const alive = Object.entries(mobHp).filter(([, hp]) => hp > 0);
    alive.forEach(([id, hp], mobIndex) => {
      const pos = type === 'trap' ? trapMobPosition(mobIndex) : packPosition(mobIndex, alive.length);
      entities.push({
        id,
        zoneId: DUNGEON_ZONE,
        x: pos.x,
        y: pos.y,
        kind: 'mob',
        label: `☠ ${mobName(run.room, floor.master)} (${fmtHp(hp)} ❤)`,
        sprite: mobSprite(run.room),
        actionId: `dungeon:mob:${id}`,
      });
    });

    const isBloodRoom = run.room >= run.rooms;
    const locked = !run.roomCleared;
    entities.push({
      id: 'door:next',
      zoneId: DUNGEON_ZONE,
      x: ROOM_W - 2.5,
      y: ROOM_H / 2,
      kind: 'door',
      label: locked
        ? `${isBloodRoom ? 'Blood Door' : 'Wither Door'} (Locked)`
        : isBloodRoom ? 'Blood Door — Boss Room' : 'Wither Door',
      sprite: isBloodRoom ? 'blood_door' : 'wither_door',
      actionId: 'dungeon:door',
    });
    if (!run.secretClaimed && roomHasSecret(type)) {
      const secret = secretPosition(type);
      entities.push({
        id: 'dungeon:secret',
        zoneId: DUNGEON_ZONE,
        x: secret.x,
        y: secret.y,
        kind: 'fairy',
        label: 'Dungeon Secret',
        sprite: 'fairy',
        actionId: 'dungeon:secret',
        hidden: true,
      });
    }
  }

  for (let i = 0; i < 6; i++) {
    if (type === 'fairy' && i < 3) continue;
    entities.push({
      id: `decor:${i}`,
      zoneId: DUNGEON_ZONE,
      x: 2 + (i % 3) * 8,
      y: 3 + Math.floor(i / 3) * 10,
      kind: 'decor',
      label: '',
      sprite: i % 2 === 0 ? 'bone_pile' : 'lantern',
    });
  }

  return {
    islandId: 'dungeon_hub',
    width: ROOM_W,
    height: ROOM_H,
    tiles,
    spawn,
    entities,
    districts: [district],
    theme,
  };
}

export function playerWorldMap(player: {
  islandId: IslandMap['islandId'];
  zoneId: string;
  dungeonRun: DungeonRunState | null;
  worldMobs?: WorldMobInstance[];
  minions?: PlacedMinion[];
  islandBlocks?: IslandBlocks;
  visitingIslandBlocks?: IslandBlocks;
}): IslandMap {
  if (player.dungeonRun && player.zoneId === DUNGEON_ZONE) {
    return buildDungeonRoomMap(player.dungeonRun);
  }
  const base = islandMap(player.islandId);
  const tiled = player.islandId === 'private_island'
    ? applyIslandBlocks(base, player.visitingIslandBlocks ?? player.islandBlocks)
    : base;
  return overlayLiveWorld(tiled, player);
}

export { DUNGEON_ZONE };

export function dungeonMobDamage(run: DungeonRunState, mobId: string): number {
  const floor = dungeonFloor(run.floorId);
  if (!floor) return 100;
  const phase = dungeonPhase(run);
  if (phase === 'boss') return floor.boss.damage;
  const room = run.room || 1;
  return mobDamage(floor.requiredLevel, room, floor.master);
}

export function dungeonMobEntityPosition(run: DungeonRunState, mobId: string): { x: number; y: number } | null {
  const map = buildDungeonRoomMap(run);
  const entity = map.entities.find((entry) => entry.id === mobId);
  return entity ? { x: entity.x, y: entity.y } : null;
}
