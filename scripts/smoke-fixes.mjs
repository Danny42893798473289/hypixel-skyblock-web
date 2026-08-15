import { io } from 'socket.io-client';
import { SLAYERS } from '@aether/shared';

const BASE = 'http://localhost:3001';
const username = `fix_${Math.random().toString(36).slice(2, 8)}`;
let failures = 0;
const check = (label, ok) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`);
  if (!ok) failures++;
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const until = async (fn, ms = 3000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (fn()) return true;
    await wait(40);
  }
  return false;
};

const auth = await fetch(`${BASE}/api/register`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ username, password: 'test' }),
}).then((r) => r.json());

const socket = io(BASE, { auth: { token: auth.token }, transports: ['websocket'] });
let player = auth.player;
let menu = null;
let toasts = [];
socket.on('game', (event) => {
  if (event.type === 'welcome' || event.type === 'state') player = event.player;
  if (event.type === 'menu') menu = event.menu;
  if (event.type === 'toast') toasts.push(event.message);
});
await until(() => player != null);

const slayer = SLAYERS[0];
const tierCost = slayer.tiers[0].cost;

// Spend every coin so Tier I (100 coins) cannot be bought.
socket.emit('game', { type: 'openMenu', menu: 'bank' });
await until(() => menu?.id === 'bank');
socket.emit('game', { type: 'menuClick', menu: 'bank', slot: 10, button: 'left', action: 'bank:deposit/all' });
await until(() => player.coins === 0);
toasts = [];

socket.emit('game', { type: 'openMenu', menu: 'slayers' });
await until(() => menu?.id === 'slayers');
const slot = menu.slots.find((entry) => entry.action === `slayer:${slayer.id}`);
socket.emit('game', {
  type: 'menuClick',
  menu: 'slayers',
  slot: slot.slot,
  button: 'left',
  action: `slayer:${slayer.id}`,
});
await wait(300);
check('starting a slayer without enough coins is blocked', player.coins === 0 && !player.activeSlayer && toasts.some((t) => t.includes('Need')));
check('coins never went negative', player.coins >= 0);

// Withdraw coins back and start one quest.
socket.emit('game', { type: 'openMenu', menu: 'bank' });
await until(() => menu?.id === 'bank');
socket.emit('game', { type: 'menuClick', menu: 'bank', slot: 19, button: 'left', action: 'bank:withdraw/all' });
await until(() => player.coins >= tierCost);
toasts = [];
socket.emit('game', { type: 'openMenu', menu: 'slayers' });
await until(() => menu?.id === 'slayers');
const before = player.coins;
socket.emit('game', { type: 'menuClick', menu: 'slayers', slot: slot.slot, button: 'left', action: `slayer:${slayer.id}` });
await until(() => player.activeSlayer != null);
check('slayer deducts the tier cost', player.coins === before - tierCost);
socket.emit('game', { type: 'menuClick', menu: 'slayers', slot: slot.slot, button: 'left', action: `slayer:${slayer.id}` });
await wait(300);
check('cannot start a second slayer while one is active', toasts.some((t) => t.includes('current Slayer')));

// Death: graveyard brawlers hit hard enough to kill a fresh player in a few swings.
socket.emit('game', { type: 'closeMenu' });
socket.emit('game', { type: 'travel', zoneId: 'hub_colosseum' });
await until(() => player.zoneId === 'hub_colosseum');
toasts = [];
for (let i = 0; i < 20 && player.hp > 0; i++) {
  socket.emit('game', { type: 'doAction', actionId: 'hub_fight_brawler', times: 1 });
  await wait(150);
}
check('combat damage can kill you', toasts.some((t) => t.includes('You were defeated')));
check('dying respawns you with full health', player.hp === player.maxHp);

socket.close();
console.log(failures ? `\n${failures} failed` : '\nAll fix checks passed.');
process.exit(failures ? 1 : 0);
