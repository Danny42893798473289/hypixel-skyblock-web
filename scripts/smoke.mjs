import { io } from 'socket.io-client';
import { islandMap, districtFor, canStand, ZONES } from '@aether/shared';

const BASE = process.env.SMOKE_URL ?? 'http://localhost:3001';
const username = `smoke_${Math.random().toString(36).slice(2, 8)}`;
const password = 'testpass';

let failures = 0;
const check = (label, condition) => {
  console.log(`${condition ? 'ok  ' : 'FAIL'} ${label}`);
  if (!condition) failures++;
};

const register = await fetch(`${BASE}/api/register`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ username, password }),
}).then((response) => response.json());
check('register returns a token', Boolean(register.token));

const socket = io(BASE, { auth: { token: register.token }, transports: ['websocket'] });
const events = [];
let player = null;
let menu = null;
// Presence broadcasts include our own entry, which is the server's authoritative position.
let position = null;
socket.on('game', (event) => {
  events.push(event);
  if (event.type === 'welcome' || event.type === 'state') player = event.player;
  if (event.type === 'menu') menu = event.menu;
  if (event.type === 'zonePlayers') {
    const self = event.players.find((entry) => entry.username === username);
    if (self) position = { x: self.x, y: self.y };
  }
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const until = async (predicate, ms = 2500) => {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    await wait(40);
  }
  return false;
};
const send = (event) => socket.emit('game', event);
const toasts = () => events.filter((event) => event.type === 'toast').map((event) => event.message);
const lastToast = () => toasts().at(-1) ?? '';

/** Breadth-first search over walkable tiles, so the bot walks like a player instead of teleporting. */
function route(map, from, to) {
  const key = (x, y) => `${x},${y}`;
  const start = { x: Math.floor(from.x), y: Math.floor(from.y) };
  const goal = { x: Math.floor(to.x), y: Math.floor(to.y) };
  const queue = [start];
  const cameFrom = new Map([[key(start.x, start.y), null]]);
  while (queue.length) {
    const node = queue.shift();
    if (node.x === goal.x && node.y === goal.y) {
      const path = [];
      for (let step = node; step; step = cameFrom.get(key(step.x, step.y))) path.unshift(step);
      return path;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = { x: node.x + dx, y: node.y + dy };
      if (next.x < 0 || next.y < 0 || next.x >= map.width || next.y >= map.height) continue;
      if (cameFrom.has(key(next.x, next.y))) continue;
      if (!canStand(map, next.x + 0.5, next.y + 0.5)) continue;
      cameFrom.set(key(next.x, next.y), node);
      queue.push(next);
    }
  }
  return null;
}

/** Walks the path in small steps so the server's speed check accepts every update. */
async function walkTo(map, target) {
  const from = position ?? player;
  const path = route(map, from, target);
  if (!path) return false;
  let at = { x: from.x, y: from.y };
  for (const tile of path) {
    const to = { x: tile.x + 0.5, y: tile.y + 0.5 };
    const steps = Math.max(1, Math.ceil(Math.hypot(to.x - at.x, to.y - at.y) / 0.4));
    for (let step = 1; step <= steps; step++) {
      const x = at.x + ((to.x - at.x) * step) / steps;
      const y = at.y + ((to.y - at.y) * step) / steps;
      const facing = Math.abs(to.x - at.x) > Math.abs(to.y - at.y)
        ? (to.x > at.x ? 'right' : 'left')
        : (to.y > at.y ? 'down' : 'up');
      send({ type: 'move', x, y, facing });
      await wait(70);
    }
    at = to;
  }
  await until(() => position && Math.hypot(position.x - at.x, position.y - at.y) < 0.6, 1200);
  return Boolean(position) && Math.hypot(position.x - at.x, position.y - at.y) < 0.6;
}

await until(() => player != null);
check('welcome delivered a player', Boolean(player));
check('spawns in the hub', player.islandId === 'hub');

// ── Walking between districts changes location without a portal ────────────
const hub = islandMap('hub');
const bazaar = districtFor(hub, 'hub_bazaar');
const arrived = await walkTo(hub, { x: bazaar.centerX, y: bazaar.centerY });
check('the Bazaar district is walkable from spawn', arrived);
check('walking into a district updates the location without a portal', player.zoneId === 'hub_bazaar');
const bazaarNpc = hub.entities.find((entity) => entity.zoneId === 'hub_bazaar' && entity.menu === 'bazaar');
const walkedToNpc = await walkTo(hub, { x: bazaarNpc.x - 1, y: bazaarNpc.y });
send({ type: 'interact' });
await until(() => menu?.id === 'bazaar');
check('the Bazaar stall is reachable on foot', walkedToNpc && menu?.id === 'bazaar');

// ── The warp gate and Banker in the world open their menus ────────────────
async function interactWith(entity) {
  send({ type: 'travel', zoneId: entity.zoneId });
  await until(() => player.zoneId === entity.zoneId);
  await wait(200);
  menu = null;
  send({ type: 'closeMenu' });
  await walkTo(hub, entity);
  send({ type: 'interact' });
  await wait(400);
  return menu?.id;
}

const gate = hub.entities.find((entity) => entity.sprite === 'warp_gate');
check('the island has a single warp gate', hub.entities.filter((entity) => entity.sprite === 'warp_gate').length === 1);
check('walking up to the warp gate opens the warps', (await interactWith(gate)) === 'fast_travel');

const banker = hub.entities.find((entity) => entity.kind === 'npc' && entity.menu === 'bank');
check('talking to the Banker opens the bank', (await interactWith(banker)) === 'bank');

// ── Warp menu gating ─────────────────────────────────────────────────────
send({ type: 'openMenu', menu: 'fast_travel' });
const travelMenu = await until(() => menu?.id === 'fast_travel');
check('warp gate menu opens', travelMenu);
const barnSlot = menu?.slots.find((slot) => slot.action === 'warp:barn');
check('unlocked island is clickable in the warp menu', Boolean(barnSlot) && !barnSlot.disabled);
const lockedSlot = menu?.slots.find((slot) => slot.name.includes('Dungeon Hub'));
check('locked island is disabled in the warp menu', lockedSlot?.disabled === true);

// ── Bank: deposit, interest info, withdraw ────────────────────────────────
send({ type: 'openMenu', menu: 'bank' });
await until(() => menu?.id === 'bank');
check('bank menu has fixed deposit amounts', menu.slots.some((slot) => slot.action === 'bank:deposit/100'));
check('bank menu offers an upgrade', menu.slots.some((slot) => slot.action === 'bank:upgrade'));
const startingPurse = player.coins;
send({ type: 'menuClick', menu: 'bank', slot: 10, button: 'left', action: 'bank:deposit/100' });
const deposited = await until(() => player.bank.balance >= 100);
check('deposit moves coins into the bank', deposited && player.coins === startingPurse - 100);
send({ type: 'menuClick', menu: 'bank', slot: 19, button: 'left', action: 'bank:withdraw/100' });
const withdrawn = await until(() => player.bank.balance === 0);
check('withdraw moves coins back to the purse', withdrawn && player.coins === startingPurse);

// ── Dungeons are gated behind Combat 12 ──────────────────────────────────
send({ type: 'openMenu', menu: 'dungeons' });
await until(() => menu?.id === 'dungeons');
check('dungeons menu is locked at low combat', menu.title.includes('Locked'));
send({ type: 'menuClick', menu: 'dungeons', slot: 29, button: 'left', action: 'dungeon:f1' });
await until(() => lastToast().includes('Combat'));
check('entering a dungeon without Combat 12 is refused', lastToast().includes('Combat 12'));

// ── Collections and recipes are organised into tabs and pages ────────────
send({ type: 'openMenu', menu: 'collections' });
await until(() => menu?.id === 'collections');
check('collections open on a category', menu.title.includes('Mining'));
send({ type: 'menuClick', menu: 'collections', slot: 2, button: 'left', action: 'collection:farming' });
await until(() => menu?.title.includes('Farming'));
check('collection category tabs switch pages', menu.title.includes('Farming'));
send({ type: 'openMenu', menu: 'crafting' });
await until(() => menu?.id === 'crafting');
check('recipe book opens on a category', menu.title.includes('Tools'));
send({ type: 'menuClick', menu: 'crafting', slot: 5, button: 'left', action: 'recipes:refined' });
await until(() => menu?.title.includes('Refined'));
check('recipe categories switch', menu.title.includes('Refined'));

// ── Mining islands have the new ores ─────────────────────────────────────
const deepZones = Object.values(ZONES).filter((zone) => zone.islandId === 'deep_caverns');
const ores = new Set(deepZones.flatMap((zone) => zone.actions.map((action) => action.target)));
check('deep caverns include diamond, emerald, redstone and mithril',
  ['diamond', 'emerald', 'redstone', 'mithril'].every((ore) => ores.has(ore)));

// ── Fairy souls are hidden and collectable once ──────────────────────────
const fairy = hub.entities.find((entity) => entity.kind === 'fairy' && entity.zoneId === 'hub_bazaar');
check('fairy soul is marked hidden', fairy?.hidden === true);
check('fairy soul hides behind decor', hub.entities.some((entity) =>
  entity.kind === 'decor' && Math.hypot(entity.x - fairy.x, entity.y - fairy.y) < 2));
send({ type: 'closeMenu' });
await walkTo(hub, fairy);
send({ type: 'interact' });
const collected = await until(() => player.fairySouls > 0);
check('fairy soul can be collected up close', collected);
send({ type: 'interact' });
await until(() => lastToast().includes('already found'));
check('fairy soul cannot be collected twice', lastToast().includes('already found'));

socket.close();
console.log(failures ? `\n${failures} check(s) failed.` : '\nAll smoke checks passed.');
process.exit(failures ? 1 : 0);
