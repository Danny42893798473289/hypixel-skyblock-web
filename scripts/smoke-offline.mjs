/**
 * Restarts the server around an edited save file to prove the parts that only
 * show up across sessions: offline bank interest, the Combat 12 dungeon gate,
 * and warping into the Catacombs.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { io } from 'socket.io-client';
import { totalXpForLevel, DUNGEON_COMBAT_REQUIREMENT } from '@aether/shared';

const PORT = 3999;
const BASE = `http://localhost:${PORT}`;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aether-offline-'));
const usersFile = path.join(dataDir, 'users.json');
const username = `offline_${Math.random().toString(36).slice(2, 8)}`;
const password = 'testpass';

let failures = 0;
const check = (label, condition) => {
  console.log(`${condition ? 'ok  ' : 'FAIL'} ${label}`);
  if (!condition) failures++;
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const until = async (predicate, ms = 3000) => {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    await wait(40);
  }
  return false;
};

let server = null;
async function startServer() {
  server = spawn('node', ['apps/server/dist/index.js'], {
    env: { ...process.env, PORT: String(PORT), AETHER_DATA_DIR: dataDir },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await until(async () => {
    try {
      const response = await fetch(`${BASE}/api/catalog`);
      return response.ok;
    } catch {
      return false;
    }
  }, 15000);
  await wait(200);
}
async function stopServer() {
  if (!server) return;
  server.kill('SIGTERM');
  await wait(600);
  server = null;
}

function connect(token) {
  const socket = io(BASE, { auth: { token }, transports: ['websocket'] });
  const state = { player: null, menu: null, toasts: [], socket };
  socket.on('game', (event) => {
    if (event.type === 'welcome' || event.type === 'state') state.player = event.player;
    if (event.type === 'menu') state.menu = event.menu;
    if (event.type === 'toast') state.toasts.push(event.message);
  });
  return state;
}

try {
  await startServer();
  check('server reports the save path we asked for', fs.existsSync(usersFile));

  // ── Session one: deposit into the bank, then log off ─────────────────────
  const auth = await fetch(`${BASE}/api/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  }).then((response) => response.json());
  const first = connect(auth.token);
  await until(() => first.player != null);
  first.socket.emit('game', { type: 'openMenu', menu: 'bank' });
  await until(() => first.menu?.id === 'bank');
  first.socket.emit('game', { type: 'menuClick', menu: 'bank', slot: 10, button: 'left', action: 'bank:deposit/all' });
  const deposited = await until(() => (first.player.bank?.balance ?? 0) > 0);
  check('coins can be deposited at the Banker', deposited);
  const balance = first.player.bank.balance;
  first.socket.close();
  await wait(400);
  await stopServer();

  const saved = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  const user = saved.users.find((entry) => entry.username === username);
  check('the deposit is written to users.json on disk', user?.bank?.balance === balance);

  // ── Backdate the save so the next login has 3 days of offline time ───────
  user.bank.lastInterestAt = Date.now() - 3 * 24 * 60 * 60 * 1000;
  user.skills.combat = totalXpForLevel(DUNGEON_COMBAT_REQUIREMENT);
  fs.writeFileSync(usersFile, JSON.stringify(saved, null, 2));

  // ── Session two: interest paid out, dungeons unlocked ────────────────────
  await startServer();
  const login = await fetch(`${BASE}/api/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  }).then((response) => response.json());
  const second = connect(login.token);
  await until(() => second.player != null);
  check('offline interest was paid into the bank', second.player.bank.balance > balance);
  check('the player is told about the offline interest',
    second.toasts.some((message) => message.includes('interest while you were away')));

  second.socket.emit('game', { type: 'openMenu', menu: 'dungeons' });
  await until(() => second.menu?.id === 'dungeons');
  check('dungeons unlock at Combat 12', !second.menu.title.includes('Locked'));
  const entrance = second.menu.slots.find((slot) => slot.action === 'dungeon:f1');
  check('the Catacombs entrance is clickable', Boolean(entrance) && !entrance.disabled);
  second.socket.emit('game', { type: 'menuClick', menu: 'dungeons', slot: entrance.slot, button: 'left', action: 'dungeon:f1' });
  const warped = await until(() => second.player.zoneId === 'catacombs_entrance');
  check('clicking the entrance warps you into the Catacombs', warped && second.player.islandId === 'dungeon_hub');
  check('a dungeon run is started', Boolean(second.player.dungeonRun));

  second.socket.close();
  await wait(300);
} finally {
  await stopServer();
  fs.rmSync(dataDir, { recursive: true, force: true });
}

console.log(failures ? `\n${failures} check(s) failed.` : '\nAll offline checks passed.');
process.exit(failures ? 1 : 0);
