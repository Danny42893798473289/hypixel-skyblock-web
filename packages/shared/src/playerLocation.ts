import {
  DEFAULT_ZONE,
  ZONES,
  islandForZone,
  zonesOnIsland,
  type IslandId,
} from './locations.js';
import type { PlayerState } from './protocol.js';
import { levelFromXp } from './skills.js';
import { applyIslandBlocks } from './islandBuild.js';
import {
  canStand,
  districtAt,
  districtSpawn,
  islandMapForZone,
  type IslandMap,
} from './world.js';

export function meetsZoneSkillReq(
  player: PlayerState,
  req?: { skill: keyof PlayerState['skills']; level: number },
): boolean {
  if (!req) return true;
  return levelFromXp(player.skills[req.skill]).level >= req.level;
}

/** Best zone the player may enter on an island (lowest skill gate they satisfy). */
export function findAccessibleZone(player: PlayerState, islandId: IslandId): string {
  const zones = zonesOnIsland(islandId);
  const sorted = [...zones].sort(
    (a, b) => (a.skillReq?.level ?? 0) - (b.skillReq?.level ?? 0),
  );
  for (const zone of sorted) {
    if (meetsZoneSkillReq(player, zone.skillReq)) return zone.id;
  }
  return DEFAULT_ZONE;
}

function mapForPlayer(player: PlayerState) {
  const base = islandMapForZone(player.zoneId);
  return player.islandId === 'private_island'
    ? applyIslandBlocks(base, player.visitingIslandBlocks ?? player.islandBlocks)
    : base;
}

/** Snap players out of skill-gated districts they slipped into (e.g. AOTE). Returns true if moved. */
export function normalizePlayerLocation(player: PlayerState): boolean {
  let changed = false;
  const zone = ZONES[player.zoneId];
  if (!zone || !meetsZoneSkillReq(player, zone.skillReq)) {
    player.zoneId = findAccessibleZone(player, zone?.islandId ?? player.islandId);
    player.islandId = islandForZone(player.zoneId);
    changed = true;
  }

  const map = mapForPlayer(player);
  const standing = districtAt(map, player.x, player.y);
  if (standing && standing.zoneId !== player.zoneId) {
    const standZone = ZONES[standing.zoneId];
    if (standZone && !meetsZoneSkillReq(player, standZone.skillReq)) changed = true;
  }
  if (!canStand(map, player.x, player.y)) changed = true;

  if (changed) {
    const spawn = districtSpawn(map, player.zoneId);
    player.x = spawn.x;
    player.y = spawn.y;
    player.facing = 'down';
  }
  return changed;
}

/** Error text if the player may not walk/teleport into tile x/y from their current zone. */
export function districtEntryBlocked(
  player: PlayerState,
  map: IslandMap,
  x: number,
  y: number,
  currentZoneId: string,
): string | null {
  const district = districtAt(map, x, y);
  if (!district || district.zoneId === currentZoneId) return null;
  const zone = ZONES[district.zoneId];
  if (!zone || meetsZoneSkillReq(player, zone.skillReq)) return null;
  return `${zone.name} requires ${zone.skillReq!.skill} level ${zone.skillReq!.level}`;
}
