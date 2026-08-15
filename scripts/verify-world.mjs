import { ISLANDS, ZONES, islandMap, canStand, districtAt } from '@aether/shared';

let failures = 0;

function fail(message) {
  failures++;
  console.error(`  FAIL ${message}`);
}

/** Flood fill from spawn over half-tile steps, matching how the player collides. */
function reachable(map) {
  const step = 0.5;
  const key = (x, y) => `${Math.round(x / step)}:${Math.round(y / step)}`;
  const start = { x: Math.round(map.spawn.x / step) * step, y: Math.round(map.spawn.y / step) * step };
  const seen = new Set([key(start.x, start.y)]);
  const queue = [start];
  while (queue.length) {
    const current = queue.pop();
    for (const [dx, dy] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
      const next = { x: current.x + dx, y: current.y + dy };
      if (next.x < 0 || next.y < 0 || next.x >= map.width || next.y >= map.height) continue;
      const id = key(next.x, next.y);
      if (seen.has(id) || !canStand(map, next.x, next.y)) continue;
      seen.add(id);
      queue.push(next);
    }
  }
  return seen;
}

for (const islandId of Object.keys(ISLANDS)) {
  const map = islandMap(islandId);
  const zones = Object.values(ZONES).filter((zone) => zone.islandId === islandId);
  console.log(`${islandId}: ${map.width}x${map.height}, ${map.districts.length} districts, ${map.entities.length} entities`);

  if (!canStand(map, map.spawn.x, map.spawn.y)) fail(`${islandId} spawn is inside a wall`);
  if (map.districts.length !== zones.length) fail(`${islandId} district count mismatch`);

  const walkable = reachable(map);
  const step = 0.5;
  const cell = (x, y) => `${Math.round(x / step)}:${Math.round(y / step)}`;

  for (const district of map.districts) {
    const center = { x: district.centerX + 0.5, y: district.centerY + 0.5 };
    if (!walkable.has(cell(Math.round(center.x / step) * step, Math.round(center.y / step) * step))) {
      fail(`${islandId}: district ${district.zoneId} is not reachable on foot from spawn`);
    }
  }

  for (const entity of map.entities) {
    if (entity.kind === 'decor') continue;
    if (!canStand(map, entity.x, entity.y)) fail(`${islandId}: ${entity.id} sits on a solid tile`);
    if (!ZONES[entity.zoneId]) fail(`${islandId}: ${entity.id} has unknown zone ${entity.zoneId}`);
    const owner = districtAt(map, entity.x, entity.y);
    if (owner && owner.zoneId !== entity.zoneId) {
      fail(`${islandId}: ${entity.id} is placed inside district ${owner.zoneId}`);
    }
  }

  const warps = map.entities.filter((entity) => entity.sprite === 'warp_gate');
  if (warps.length !== 1) fail(`${islandId} has ${warps.length} warp gates (expected exactly 1)`);
  const fairies = map.entities.filter((entity) => entity.kind === 'fairy');
  if (fairies.length !== zones.length) fail(`${islandId} has ${fairies.length} fairy souls for ${zones.length} districts`);
}

console.log(failures ? `\n${failures} problem(s) found.` : '\nAll islands are walkable and consistent.');
process.exit(failures ? 1 : 0);
