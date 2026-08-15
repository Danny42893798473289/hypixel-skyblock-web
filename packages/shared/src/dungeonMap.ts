import type { DungeonRunState } from './protocol.js';
import { dungeonFloor } from './dungeonContent.js';
import { ISLAND_THEMES, islandMap, type IslandMap, type TileKind, type WorldEntity } from './world.js';

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

  const mobCount = 2 + Math.min(3, Math.floor(run.room / 2));
  const hp: Record<string, number> = {};
  for (let i = 0; i < mobCount; i++) {
    hp[`dungeon_mob:${i}`] = mobHealth(floor.requiredLevel, run.room, floor.master);
  }
  return hp;
}

function paintRoom(tiles: TileKind[][]): void {
  const theme = ISLAND_THEMES.dungeon_hub;
  for (let y = 0; y < ROOM_H; y++) {
    for (let x = 0; x < ROOM_W; x++) {
      const edge = x === 0 || y === 0 || x === ROOM_W - 1 || y === ROOM_H - 1;
      tiles[y][x] = edge ? theme.secondary : theme.ground;
    }
  }
  // Door gap on the east wall
  tiles[Math.floor(ROOM_H / 2)][ROOM_W - 1] = theme.ground;
  tiles[Math.floor(ROOM_H / 2) - 1]?.[ROOM_W - 1] && (tiles[Math.floor(ROOM_H / 2) - 1][ROOM_W - 1] = theme.ground);
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

/** Build the in-world map for the player's current dungeon room. */
export function buildDungeonRoomMap(run: DungeonRunState): IslandMap {
  const floor = dungeonFloor(run.floorId);
  const phase = dungeonPhase(run);
  const theme = ISLAND_THEMES.dungeon_hub;
  const tiles: TileKind[][] = Array.from({ length: ROOM_H }, () => Array.from({ length: ROOM_W }, () => theme.hazard));
  paintRoom(tiles);

  const spawn = { x: 3.5, y: ROOM_H / 2 };
  const entities: WorldEntity[] = [];
  const district = {
    zoneId: DUNGEON_ZONE,
    name: phase === 'boss' ? 'Boss Room' : phase === 'starter' ? 'Starter Room' : `Room ${run.room}`,
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
    label: phase === 'boss' ? floor?.boss.name ?? 'Boss' : phase === 'starter' ? 'Starter Room' : `Room ${run.room}/${run.rooms}`,
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
    const bossHp = run.bossHp ?? floor.boss.health;
    if (bossHp > 0) {
      entities.push({
        id: 'dungeon_boss',
        zoneId: DUNGEON_ZONE,
        x: ROOM_W / 2,
        y: ROOM_H / 2 - 1,
        kind: 'mob',
        label: `${floor.boss.name} (${fmtHp(bossHp)} ❤)`,
        sprite: 'mob_brute',
        actionId: 'dungeon:boss',
      });
    }
  } else if (phase === 'rooms' && floor) {
    const mobHp = run.mobHp ?? initRoomMobs(run);
    let mobIndex = 0;
    for (const [id, hp] of Object.entries(mobHp)) {
      if (hp <= 0) continue;
      const col = mobIndex % 3;
      const row = Math.floor(mobIndex / 3);
      entities.push({
        id,
        zoneId: DUNGEON_ZONE,
        x: ROOM_W / 2 - 2 + col * 2.5,
        y: ROOM_H / 2 - 1 + row * 2,
        kind: 'mob',
        label: `☠ ${mobName(run.room, floor.master)} (${fmtHp(hp)} ❤)`,
        sprite: mobSprite(run.room),
        actionId: `dungeon:mob:${id}`,
      });
      mobIndex++;
    }

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
  }

  // Crypt atmosphere
  for (let i = 0; i < 6; i++) {
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

export function playerWorldMap(player: { islandId: IslandMap['islandId']; zoneId: string; dungeonRun: DungeonRunState | null }): IslandMap {
  if (player.dungeonRun && player.zoneId === DUNGEON_ZONE) {
    return buildDungeonRoomMap(player.dungeonRun);
  }
  return islandMap(player.islandId);
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
