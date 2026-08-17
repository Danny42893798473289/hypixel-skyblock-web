# Aether Isles

Original browser implementation of a SkyBlock-style MMORPG — not affiliated with Hypixel or Mojang. It uses original procedural pixel icons and does not ship Minecraft or Hypixel assets.

The game has a top-down, walkable 2D world with deterministic maps for every zone. Walk up to NPCs, resources, mobs, portals and stations to interact; Minecraft-style chest menus remain as overlays for inventory and progression systems. Movement and every gameplay action are validated by the server.

Implemented systems include:

- Health, Defense, Strength, Crit, Intelligence, Speed, Fortune, Magic Find and effective-health combat formulas
- Equipment, armor, item rarities, enchantments, reforges, accessories, Magical Power and pets
- 12 skills with level caps and progression rewards, collections, recipes and 160x enchanted compression
- Hub, Private Island, Barn, Mushroom Desert, Gold Mine, Deep Caverns, Spider's Den, The Park, The End, Crimson Isle, Garden, Dwarven Mines, Crystal Hollows and Dungeon Hub
- Bazaar limit/instant orders, shared Auction House BIN listings, NPC shops and a bank with offline interest
- Tier I-XI minions with fuel, upgrades and offline production
- Slayer quests and bosses plus Catacombs floors F1–F7 and Master M1–M7 with five classes
- Garden 24-plot farming, dungeon gear star upgrades, and player-to-player trade
- Multiplayer Hub presence and chat

### Controls

- `WASD` or arrow keys — move
- `E` — interact with the highlighted NPC, resource, mob, portal or station
- `M` — open or close the SkyBlock menu
- `T` — focus chat, `Escape` — leave chat
- `Escape` — close an open menu, `Backspace` — go back one menu

On phones and tablets the game shows an on-screen d-pad plus **Use** and **Menu**
buttons, and long-pressing a slot counts as a right-click.

## Play locally

```bash
npm install
npm run dev
```

- **Client:** http://localhost:5173  
- **Server:** http://localhost:3001  

## Saves (`users.json`)

All accounts, profiles, gear, skills, collections, minions, pets, Slayer/Dungeon progress, bank balances, Bazaar orders and auctions are stored in:

**[apps/server/data/users.json](apps/server/data/users.json)**

Passwords are hashed (not stored as plain text). The file is created automatically on first run.

The current format is `schemaVersion: 2`. When a version-1 save is first loaded, the server keeps the old file as `apps/server/data/users.v1.json.bak` and fills in the new profile fields.

To keep the save somewhere else on your computer, set one of these before starting the server — the path it ends up using is printed on startup as `Player saves: ...`:

```bash
AETHER_DATA_DIR=~/skyblock-saves npm start     # folder, file is users.json inside it
AETHER_USERS_FILE=~/skyblock/users.json npm start
```

## Checking the game still works

```bash
npm run verify        # every island is walkable, one warp gate, one fairy soul per district
npm run smoke         # live server: walking, districts, bank, dungeons gate, menus, fairy souls
npm run smoke:offline # restarts the server to prove offline bank interest and Combat 12 dungeons
```

`npm run smoke` and `npm run smoke:offline` expect a built server (`npm run build`); the
smoke test also wants one running on port 3001.

## Put it on the internet

Build once, then run a single server that serves both the website and the game API:

```bash
npm install
npm run build
npm start
```

Open `http://YOUR_SERVER:3001` (or whatever `PORT` is). On startup the server prints every local/LAN URL it is listening on.

**LAN or FRP (port forwarding):** use `npm start`, not `npm run dev`. Dev mode runs two processes (Vite on 5173 + API on 3001) and is mainly for local hacking. For sharing the game, build once and forward **port 3001** (or your `PORT`) — the same process serves the website, REST API, and WebSocket game.

```bash
# Example: expose to your network or an FRP tunnel
npm run build
PORT=3001 npm start
# forward external TCP -> your-machine:3001
```

If you still want dev mode on another device on Wi‑Fi, Vite now binds to all interfaces (`host: true`), so `http://YOUR_LAN_IP:5173` works while the API stays on 3001.

Set a secret in production:

```bash
export AETHER_SECRET="a-long-random-string"
export PORT=3001
npm start
```

### Hosting options

- **VPS** (any Linux box): install Node 22, clone the repo, run `npm run build && npm start`. Point a domain at the machine. Optional: use Caddy/nginx for HTTPS.
- **Railway / Render / Fly.io**: connect the GitHub repo. Build command `npm run build`, start command `npm start`. They set `PORT` for you. Attach a disk/volume on `apps/server/data` so `users.json` survives restarts.
- **Docker:**

```bash
docker build -t aether-isles .
docker run -p 3001:3001 -v aether-data:/app/apps/server/data aether-isles
```

Keep `users.json` on a persistent volume so player saves are not wiped when the container restarts.

## Stack

- Client: Vite + React (server-driven chest GUI)
- Server: Fastify + Socket.IO
- Saves: `apps/server/data/users.json`
