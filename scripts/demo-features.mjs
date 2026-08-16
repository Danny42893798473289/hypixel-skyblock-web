#!/usr/bin/env node
/**
 * Demo / smoke test for SkyBlock feature pack:
 * - Hypixel bazaar/auction mirror
 * - /pay, garden, sea creatures, essence, collection rewards
 */
import { io } from 'socket.io-client';

const BASE = process.env.DEMO_BASE ?? 'http://127.0.0.1:3001';
const results = [];

function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

function connect(token) {
  return new Promise((resolve, reject) => {
    const socket = io(BASE, { auth: { token }, transports: ['websocket'] });
    const events = [];
    socket.on('game', (ev) => events.push(ev));
    socket.on('connect', () => resolve({ socket, events }));
    socket.on('connect_error', reject);
    setTimeout(() => reject(new Error('socket timeout')), 8000);
  });
}

async function register(name) {
  const password = 'demo1234';
  let res = await api('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: name, password }),
  });
  if (res.status !== 200) {
    res = await api('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: name, password }),
    });
  }
  return res.json;
}

async function main() {
  console.log('Aether Isles — SkyBlock Features Demo\n');

  const health = await api('/api/health');
  check('Server health', health.json.ok === true);

  const bazaarMeta = await api('/api/bazaar/meta');
  check('Hypixel bazaar mirror', bazaarMeta.json.bazaar?.source === 'hypixel', `updated ${bazaarMeta.json.bazaar?.lastUpdated}`);

  const auctions = await api('/api/auctions?pageSize=5');
  check('Auction mirror listings', (auctions.json.total ?? 0) > 0, `${auctions.json.total} listings`);

  const cobble = await api('/api/bazaar/cobble');
  check('Bazaar order depth', (cobble.json.sells?.length ?? 0) > 0, `${cobble.json.sells?.length} sell levels`);

  const userA = await register(`demo_a_${Date.now().toString(36).slice(-4)}`);
  const userB = await register(`demo_b_${Date.now().toString(36).slice(-4)}`);
  check('Register/login players', Boolean(userA.token && userB.token));

  const { socket: sockA, events: evA } = await connect(userA.token);
  const { socket: sockB } = await connect(userB.token);
  await new Promise((r) => setTimeout(r, 500));

  sockA.emit('game', { type: 'chat', text: `/pay ${userB.player.username} 25` });
  await new Promise((r) => setTimeout(r, 800));
  const payOk = evA.some((e) => e.type === 'toast' && String(e.message).includes('Paid'));
  check('/pay command', payOk, evA.filter((e) => e.type === 'toast').map((e) => e.message).join(' | '));

  sockA.emit('game', { type: 'gardenPlant', plotIndex: 0, crop: 'wheat' });
  await new Promise((r) => setTimeout(r, 300));
  const hasWheat = userA.player.inventory.some?.((s) => s?.itemId === 'wheat');
  if (!hasWheat) {
    sockA.emit('game', { type: 'doAction', actionId: 'farm_wheat', times: 1 }).catch?.(() => {});
  }
  sockA.emit('game', { type: 'openMenu', menu: 'garden' });
  await new Promise((r) => setTimeout(r, 300));
  check('Garden menu opens', evA.some((e) => e.type === 'menu' && e.menu?.id === 'garden'));

  const history = await api('/api/bazaar/wheat/history');
  check('Bazaar price history API', Array.isArray(history.json.history));

  sockA.disconnect();
  sockB.disconnect();

  const passed = results.filter((r) => r.ok).length;
  const total = results.length;
  console.log(`\n${passed}/${total} checks passed`);

  const report = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    passed,
    total,
    results,
    features: [
      'Hypixel bazaar mirror (60s)',
      'Hypixel auction mirror (1h, 300 BIN)',
      'Sea creatures on fishing',
      'Garden v2 plots + Jacob contest + composter',
      'Enchant procs (Looting, Smite, Thunderlord)',
      'Collection tier coin + recipe unlock flags',
      'Slayer RNG meter',
      '/pay and /trade chat commands',
      'Co-op dungeon party sync',
      '/visit island',
      'Dungeon essence + star upgrades',
      'Bestiary milestones',
      'Carpentry XP on craft',
      'Social XP on visit',
      'Damage numbers + sea creature HUD',
    ],
  };

  const fs = await import('fs');
  const path = await import('path');
  const outDir = path.join(process.cwd(), 'artifacts');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'demo-report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\nReport written to ${outPath}`);
  process.exit(passed === total ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
