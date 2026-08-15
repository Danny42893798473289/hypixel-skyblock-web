import Fastify from 'fastify';
import cors from '@fastify/cors';
import staticFiles from '@fastify/static';
import { Server } from 'socket.io';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { initStore } from './auth/index.js';
import { usersPath } from './store/usersStore.js';
import { loginUser, registerUser, verifyToken, loadPlayer } from './auth/index.js';
import { initGame, getCatalogExtra } from './game/panelGame.js';
import { BAZAAR_ITEMS, ITEMS, RECIPES, COLLECTIONS, SKILLS } from '@aether/shared';
import { getOrderBook } from './bazaar/engine.js';
import { seedMarket } from './bazaar/seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

initStore();
seedMarket();

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

app.get('/api/health', async () => ({ ok: true, game: 'Aether Isles' }));

app.get('/api/catalog', async () => ({
  items: ITEMS,
  recipes: RECIPES,
  collections: COLLECTIONS,
  skills: SKILLS,
  bazaarItems: BAZAAR_ITEMS,
  ...getCatalogExtra(),
}));

app.post<{ Body: { username: string; password: string } }>('/api/register', async (req, reply) => {
  try {
    return registerUser(req.body.username, req.body.password);
  } catch (e) {
    reply.code(400);
    return { error: e instanceof Error ? e.message : 'Register failed' };
  }
});

app.post<{ Body: { username: string; password: string } }>('/api/login', async (req, reply) => {
  try {
    return loginUser(req.body.username, req.body.password);
  } catch (e) {
    reply.code(401);
    return { error: e instanceof Error ? e.message : 'Login failed' };
  }
});

app.get<{ Headers: { authorization?: string } }>('/api/me', async (req, reply) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const userId = verifyToken(token);
  if (!userId) {
    reply.code(401);
    return { error: 'Unauthorized' };
  }
  const player = loadPlayer(userId);
  if (!player) {
    reply.code(404);
    return { error: 'Not found' };
  }
  return { player };
});

app.get<{ Params: { itemId: string } }>('/api/bazaar/:itemId', async (req) => {
  return getOrderBook(req.params.itemId as never);
});

const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  await app.register(staticFiles, {
    root: clientDist,
    wildcard: false,
  });
  app.setNotFoundHandler((req, reply) => {
    const url = req.raw.url ?? '';
    if (url.startsWith('/api') || url.startsWith('/socket.io')) {
      reply.code(404).send({ error: 'Not found' });
      return;
    }
    reply.sendFile('index.html');
  });
}

const port = Number(process.env.PORT ?? 3001);
await app.listen({ port, host: '0.0.0.0' });

const io = new Server(app.server, {
  cors: { origin: true },
  pingInterval: 10000,
  pingTimeout: 30000,
});
initGame(io);

function localAddresses(port: number): string[] {
  const urls = new Set<string>([`http://localhost:${port}`, `http://127.0.0.1:${port}`]);
  for (const interfaces of Object.values(os.networkInterfaces())) {
    for (const entry of interfaces ?? []) {
      const family = String(entry.family);
      if (family !== 'IPv4' || entry.internal) continue;
      urls.add(`http://${entry.address}:${port}`);
    }
  }
  return [...urls];
}

console.log(`Aether Isles server on port ${port}`);
for (const url of localAddresses(port)) console.log(`  ${url}`);
console.log(`Player saves: ${usersPath}`);
console.log('For LAN or FRP access, forward this port and use npm start (recommended) so one URL serves everything.');
