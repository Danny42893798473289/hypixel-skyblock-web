import { ITEMS, type ItemId } from './items.js';
import { type IslandId, type StationKind, type ZoneDef, ZONES, zonesOnIsland, VIRTUAL_ZONES } from './locations.js';
import type { MenuId } from './protocol.js';

export const TILE = 16;

/** Size of one district cell, including the hazard gap around its plot. */
const CELL_W = 28;
const CELL_H = 22;
const PLOT_INSET = 3;
const MARGIN = 3;

export type Facing = 'up' | 'down' | 'left' | 'right';

export type TileKind =
  | 'grass'
  | 'dirt'
  | 'path'
  | 'stone'
  | 'sand'
  | 'water'
  | 'wood'
  | 'wall'
  | 'snow'
  | 'obsidian'
  | 'lava'
  | 'farmland'
  | 'gravel'
  | 'web'
  | 'void';

export interface TileDef {
  solid: boolean;
  color: string;
  accent: string;
}

export const TILES: Record<TileKind, TileDef> = {
  grass: { solid: false, color: '#4f9f38', accent: '#73bd4e' },
  dirt: { solid: false, color: '#8b603b', accent: '#a97749' },
  path: { solid: false, color: '#b79762', accent: '#d1b47b' },
  stone: { solid: false, color: '#666b70', accent: '#858b90' },
  sand: { solid: false, color: '#d8c37b', accent: '#eee09a' },
  water: { solid: true, color: '#2673b8', accent: '#52a8d8' },
  wood: { solid: false, color: '#8a5a32', accent: '#b17a45' },
  wall: { solid: true, color: '#45484b', accent: '#666b70' },
  snow: { solid: false, color: '#e7f1f3', accent: '#ffffff' },
  obsidian: { solid: false, color: '#271d3d', accent: '#4b356c' },
  lava: { solid: true, color: '#d84813', accent: '#ff9a18' },
  farmland: { solid: false, color: '#6f4626', accent: '#93613a' },
  gravel: { solid: false, color: '#7c7671', accent: '#9c948d' },
  web: { solid: false, color: '#8e8a99', accent: '#cfcada' },
  void: { solid: true, color: '#111626', accent: '#1b2440' },
};

export interface IslandTheme {
  ground: TileKind;
  secondary: TileKind;
  hazard: TileKind;
  path: TileKind;
  sky: string;
  fog: string;
  decor: string[];
}

export const ISLAND_THEMES: Record<IslandId, IslandTheme> = {
  hub: { ground: 'grass', secondary: 'stone', hazard: 'water', path: 'path', sky: '#76cbea', fog: '#d9f5ff', decor: ['tree_oak', 'bush', 'flower', 'lamp'] },
  private_island: { ground: 'grass', secondary: 'dirt', hazard: 'void', path: 'path', sky: '#77cdea', fog: '#e5f8ff', decor: ['tree_oak', 'bush', 'flower'] },
  barn: { ground: 'grass', secondary: 'farmland', hazard: 'water', path: 'dirt', sky: '#8ed6ed', fog: '#fff4b8', decor: ['hay', 'bush', 'fence', 'flower'] },
  gold_mine: { ground: 'stone', secondary: 'gravel', hazard: 'water', path: 'gravel', sky: '#283343', fog: '#a58b64', decor: ['rock', 'stalagmite', 'lantern', 'minecart'] },
  deep_caverns: { ground: 'stone', secondary: 'wall', hazard: 'void', path: 'gravel', sky: '#161b26', fog: '#565a66', decor: ['stalagmite', 'rock', 'lantern', 'crystal'] },
  spider_den: { ground: 'dirt', secondary: 'web', hazard: 'void', path: 'gravel', sky: '#7a6b79', fog: '#b8a0b4', decor: ['web_decor', 'cocoon', 'rock', 'dead_bush'] },
  park: { ground: 'grass', secondary: 'dirt', hazard: 'water', path: 'path', sky: '#74c9e6', fog: '#bdeea5', decor: ['tree_oak', 'tree_jungle', 'bush', 'flower', 'mushroom_decor'] },
  mushroom_desert: { ground: 'sand', secondary: 'dirt', hazard: 'water', path: 'sand', sky: '#8dd7ed', fog: '#f4dba3', decor: ['cactus_decor', 'dead_bush', 'mushroom_decor', 'rock'] },
  the_end: { ground: 'obsidian', secondary: 'stone', hazard: 'void', path: 'stone', sky: '#140e25', fog: '#6b4c82', decor: ['end_crystal', 'obelisk', 'rock'] },
  crimson_isle: { ground: 'stone', secondary: 'obsidian', hazard: 'lava', path: 'gravel', sky: '#3b1512', fog: '#be4b29', decor: ['fire', 'lava_rock', 'obelisk'] },
  dungeon_hub: { ground: 'stone', secondary: 'wall', hazard: 'void', path: 'stone', sky: '#22293b', fog: '#68718a', decor: ['bone_pile', 'lantern', 'obelisk', 'rock'] },
  garden: { ground: 'grass', secondary: 'farmland', hazard: 'water', path: 'dirt', sky: '#8ed6ed', fog: '#fff4b8', decor: ['hay', 'bush', 'fence', 'flower'] },
  dwarven_mines: { ground: 'stone', secondary: 'wall', hazard: 'void', path: 'gravel', sky: '#1a2430', fog: '#6a8a9a', decor: ['crystal', 'lantern', 'stalagmite', 'minecart'] },
  rift: { ground: 'obsidian', secondary: 'stone', hazard: 'void', path: 'stone', sky: '#2a1040', fog: '#c45cff', decor: ['end_crystal', 'obelisk', 'crystal'] },
};

export type WorldEntityKind = 'npc' | 'resource' | 'mob' | 'station' | 'fairy' | 'decor' | 'sign' | 'door';

export interface WorldEntity {
  id: string;
  /** District (zone) this entity belongs to. */
  zoneId: string;
  x: number;
  y: number;
  kind: WorldEntityKind;
  label: string;
  sprite: string;
  actionId?: string;
  itemId?: ItemId;
  menu?: MenuId;
  /** Only rendered when the player is nearly on top of it. */
  hidden?: boolean;
}

export interface WorldDistrict {
  zoneId: string;
  name: string;
  /** Plot rect in tiles. */
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface IslandMap {
  islandId: IslandId;
  width: number;
  height: number;
  tiles: TileKind[][];
  spawn: { x: number; y: number };
  entities: WorldEntity[];
  districts: WorldDistrict[];
  theme: IslandTheme;
}

const STATION_MENUS: Record<StationKind, { menu: MenuId; label: string; sprite: string }> = {
  bazaar: { menu: 'bazaar', label: 'Bazaar', sprite: 'bazaar_stall' },
  craft: { menu: 'crafting', label: 'Crafting Table', sprite: 'crafting_table' },
  minions: { menu: 'minions', label: 'Minion Platform', sprite: 'minion_pad' },
  bank: { menu: 'bank', label: 'Bank Vault', sprite: 'bank_vault' },
  auction: { menu: 'auction', label: 'Auction House', sprite: 'auction_stand' },
  warp: { menu: 'fast_travel', label: 'Warp Gate', sprite: 'warp_gate' },
  enchanting: { menu: 'enchanting', label: 'Enchantment Table', sprite: 'enchant_table' },
  reforge: { menu: 'reforge', label: 'Anvil', sprite: 'anvil' },
  dungeon: { menu: 'dungeons', label: 'Catacombs Portal', sprite: 'dungeon_portal' },
  slayer: { menu: 'slayers', label: 'Slayer Altar', sprite: 'slayer_altar' },
  pets: { menu: 'pets', label: 'Pet Stand', sprite: 'pet_stand' },
  garden: { menu: 'garden', label: 'Garden Desk', sprite: 'hay' },
  hotm: { menu: 'hotm', label: 'Heart of the Mountain', sprite: 'crystal' },
  alchemy: { menu: 'alchemy', label: 'Brewing Stand', sprite: 'enchant_table' },
  wardrobe: { menu: 'wardrobe', label: 'Wardrobe', sprite: 'anvil' },
  museum: { menu: 'museum', label: 'Museum', sprite: 'auction_stand' },
  kuudra: { menu: 'kuudra', label: 'Kuudra Altar', sprite: 'slayer_altar' },
  dragons: { menu: 'dragons', label: 'Dragon Altar', sprite: 'end_crystal' },
};

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    let next = (seed += 0x6d2b79f5);
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function set(tiles: TileKind[][], x: number, y: number, kind: TileKind): void {
  if (tiles[y]?.[x] != null) tiles[y][x] = kind;
}

function carveBridge(tiles: TileKind[][], from: WorldDistrict, to: WorldDistrict, kind: TileKind): void {
  let x = from.centerX;
  let y = from.centerY;
  const guard = (from.width + to.width + from.height + to.height) * 4;
  for (let step = 0; step < guard && (x !== to.centerX || y !== to.centerY); step++) {
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) set(tiles, x + ox, y + oy, kind);
    }
    if (x !== to.centerX) x += Math.sign(to.centerX - x);
    else y += Math.sign(to.centerY - y);
  }
}

type DistrictLook = 'farm' | 'mine' | 'shore' | 'town' | 'wild';

/** What a district does decides how its plot is painted, so places are recognisable. */
function districtLook(zone: ZoneDef): DistrictLook {
  if (zone.actions.some((a) => a.kind === 'farm')) return 'farm';
  if (zone.actions.some((a) => a.kind === 'mine')) return 'mine';
  if (zone.actions.some((a) => a.kind === 'fish')) return 'shore';
  if (zone.stations?.length || zone.npc) return 'town';
  return 'wild';
}

function districtGround(look: DistrictLook, theme: IslandTheme): { ground: TileKind; accent: TileKind } {
  if (look === 'farm') return { ground: 'farmland', accent: theme.path };
  if (look === 'mine') return { ground: 'stone', accent: 'gravel' };
  return { ground: theme.ground, accent: theme.secondary };
}

/** Soft blob of tiles — reads as a patch of terrain instead of per-tile static. */
function blob(tiles: TileKind[][], cx: number, cy: number, radius: number, kind: TileKind, random: () => number): void {
  for (let y = cy - radius; y <= cy + radius; y++) {
    for (let x = cx - radius; x <= cx + radius; x++) {
      const distance = Math.hypot(x - cx, y - cy);
      if (distance > radius + 0.3) continue;
      if (distance > radius - 0.7 && random() < 0.45) continue;
      set(tiles, x, y, kind);
    }
  }
}

function fillRect(tiles: TileKind[][], x: number, y: number, width: number, height: number, kind: TileKind): void {
  for (let ty = y; ty < y + height; ty++) {
    for (let tx = x; tx < x + width; tx++) set(tiles, tx, ty, kind);
  }
}

/**
 * Paints one district: a base of its own ground, a few terrain patches, and a
 * layout that matches what the district is for (paved square, crop rows, ...).
 */
function paintDistrict(
  tiles: TileKind[][],
  plot: WorldDistrict,
  look: DistrictLook,
  theme: IslandTheme,
  random: () => number,
): void {
  const { ground, accent } = districtGround(look, theme);
  const right = plot.x + plot.width - 1;
  const bottom = plot.y + plot.height - 1;

  for (let y = plot.y; y < plot.y + plot.height; y++) {
    for (let x = plot.x; x < plot.x + plot.width; x++) {
      const edgeX = Math.min(x - plot.x, right - x);
      const edgeY = Math.min(y - plot.y, bottom - y);
      if (edgeX + edgeY < 2 && random() < 0.7) continue; // rounded corners
      set(tiles, x, y, ground);
    }
  }

  const patches = 2 + Math.floor(random() * 3);
  for (let i = 0; i < patches; i++) {
    const cx = plot.x + 2 + Math.floor(random() * (plot.width - 4));
    const cy = plot.y + 2 + Math.floor(random() * (plot.height - 4));
    blob(tiles, cx, cy, 1 + Math.floor(random() * 2), accent, random);
  }

  if (look === 'town') {
    // A paved square in front of the shops, with a path out to the walkways.
    const squareWidth = plot.width - 6;
    const squareHeight = 5;
    fillRect(tiles, plot.x + 3, plot.y + 2, squareWidth, squareHeight, theme.path);
    fillRect(tiles, plot.centerX - 1, plot.y + 2, 3, plot.height - 3, theme.path);
  }
  if (look === 'farm') {
    // Crop rows separated by dirt walkways.
    for (let y = plot.y + 2; y < bottom - 1; y += 3) fillRect(tiles, plot.x + 2, y, plot.width - 4, 1, theme.path);
    fillRect(tiles, plot.centerX - 1, plot.y + 1, 3, plot.height - 2, theme.path);
  }
  if (look === 'mine') {
    // Rubble outcrops around a cleared cart track.
    for (let i = 0; i < 3; i++) {
      const cx = plot.x + 2 + Math.floor(random() * (plot.width - 4));
      const cy = plot.y + 2 + Math.floor(random() * (plot.height - 4));
      if (Math.abs(cx - plot.centerX) < 3 && Math.abs(cy - plot.centerY) < 3) continue;
      blob(tiles, cx, cy, 1, 'wall', random);
    }
    fillRect(tiles, plot.centerX - 1, plot.y + 1, 3, plot.height - 2, 'gravel');
  }
  if (look === 'shore') {
    // Water along the bottom edge, with a bank left to stand and fish from.
    const pondTop = bottom - 3;
    for (let y = pondTop; y <= bottom - 1; y++) {
      for (let x = plot.x + 2; x <= right - 2; x++) {
        if (y === pondTop && random() < 0.3) continue;
        set(tiles, x, y, 'water');
      }
    }
    fillRect(tiles, plot.x + 2, pondTop - 1, plot.width - 4, 1, theme.path);
  }
}

export function buildIslandMap(islandId: IslandId): IslandMap {
  const zones = zonesOnIsland(islandId).filter((z) => !VIRTUAL_ZONES.has(z.id));
  if (!zones.length) throw new Error(`Island has no zones: ${islandId}`);
  const theme = ISLAND_THEMES[islandId];
  const random = mulberry32(hashString(islandId));

  const cols = Math.min(4, Math.ceil(Math.sqrt(zones.length)));
  const rows = Math.ceil(zones.length / cols);
  const width = MARGIN * 2 + cols * CELL_W;
  const height = MARGIN * 2 + rows * CELL_H;
  const tiles: TileKind[][] = Array.from({ length: height }, () => Array.from({ length: width }, () => theme.hazard));

  const districts: WorldDistrict[] = zones.map((zone, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = MARGIN + col * CELL_W + PLOT_INSET;
    const y = MARGIN + row * CELL_H + PLOT_INSET;
    const plotWidth = CELL_W - PLOT_INSET * 2;
    const plotHeight = CELL_H - PLOT_INSET * 2;
    return {
      zoneId: zone.id,
      name: zone.name,
      x,
      y,
      width: plotWidth,
      height: plotHeight,
      centerX: x + Math.floor(plotWidth / 2),
      centerY: y + Math.floor(plotHeight / 2),
    };
  });

  zones.forEach((zone, index) => {
    paintDistrict(tiles, districts[index], districtLook(zone), theme, random);
  });

  // Spanning walkways plus a few loops, so the island is one connected map.
  districts.forEach((plot, index) => {
    if (index === 0) return;
    const col = index % cols;
    const previous = col > 0 ? districts[index - 1] : districts[index - cols];
    if (previous) carveBridge(tiles, plot, previous, theme.path);
    const above = districts[index - cols];
    if (above && col > 0 && random() < 0.6) carveBridge(tiles, plot, above, theme.path);
  });

  const entities: WorldEntity[] = [];
  zones.forEach((zone, index) => {
    const plot = districts[index];
    const right = plot.x + plot.width - 1;
    const bottom = plot.y + plot.height - 1;

    entities.push({
      id: `sign:${zone.id}`,
      zoneId: zone.id,
      x: plot.centerX + 0.5,
      y: plot.y + 1.5,
      kind: 'sign',
      label: zone.name,
      sprite: 'sign',
    });

    if (zone.npc) {
      entities.push({
        id: `npc:${zone.id}:${zone.npc.id}`,
        zoneId: zone.id,
        x: plot.x + 3.5,
        y: plot.y + 3.5,
        kind: 'npc',
        label: zone.npc.name,
        sprite: npcSprite(zone.npc.id),
        menu: zone.npc.id === 'banker' ? 'bank' : 'npc_shop',
      });
    }

    (zone.stations ?? []).forEach((station, stationIndex) => {
      const info = STATION_MENUS[station];
      entities.push({
        id: `station:${zone.id}:${station}`,
        zoneId: zone.id,
        x: right - 2.5 - stationIndex * 3,
        y: plot.y + 3.5,
        kind: 'station',
        label: info.label,
        sprite: info.sprite,
        menu: info.menu,
      });
    });

    zone.actions.forEach((action, actionIndex) => {
      const perRow = 5;
      const col = actionIndex % perRow;
      const row = Math.floor(actionIndex / perRow);
      const item = typeof action.target === 'string' ? ITEMS[action.target as ItemId] : undefined;
      entities.push({
        id: `action:${zone.id}:${action.id}`,
        zoneId: zone.id,
        x: plot.x + 3.5 + col * 4,
        y: bottom - 2.5 - row * 3,
        kind: action.kind === 'combat' ? 'mob' : 'resource',
        label: action.label,
        sprite: action.kind === 'combat'
          ? mobSprite(String(action.target ?? 'zombie'))
          : resourceSprite(action.kind, item?.id),
        actionId: action.id,
        itemId: item?.id,
      });
    });

    // Decoration: fills the plot and gives each fairy soul somewhere to hide.
    const decorCount = 10 + Math.floor(random() * 6);
    for (let i = 0; i < decorCount; i++) {
      const dx = plot.x + 1 + Math.floor(random() * (plot.width - 2));
      const dy = plot.y + 1 + Math.floor(random() * (plot.height - 2));
      const tile = tiles[dy]?.[dx];
      if (tile == null || tile === theme.hazard || tile === theme.path) continue; // keep walkways clear
      const occupied = entities.some((entity) => Math.abs(entity.x - (dx + 0.5)) < 1.6 && Math.abs(entity.y - (dy + 0.5)) < 1.6);
      if (occupied) continue;
      entities.push({
        id: `decor:${zone.id}:${i}`,
        zoneId: zone.id,
        x: dx + 0.5,
        y: dy + 0.5,
        kind: 'decor',
        label: '',
        sprite: theme.decor[Math.floor(random() * theme.decor.length)],
      });
    }

    const corner = Math.floor(random() * 4);
    const fairyX = (corner % 2 === 0 ? plot.x + 1 : right - 1) + 0.5;
    const fairyY = (corner < 2 ? plot.y + 1 : bottom - 1) + 0.5;
    entities.push({
      id: `fairy:${zone.id}`,
      zoneId: zone.id,
      x: fairyX,
      y: fairyY,
      kind: 'fairy',
      label: 'Fairy Soul',
      sprite: 'fairy',
      hidden: true,
    });
    for (let i = 0; i < 3; i++) {
      entities.push({
        id: `decor:${zone.id}:fairy${i}`,
        zoneId: zone.id,
        x: fairyX + (i - 1),
        y: fairyY + (i === 1 ? -1 : 0),
        kind: 'decor',
        label: '',
        sprite: theme.decor[Math.floor(random() * theme.decor.length)],
      });
    }
  });

  // Nothing interactive may end up walled in, so clear the tile it stands on
  // plus the ones the player's hitbox overlaps when reaching it.
  for (const entity of entities) {
    if (entity.kind === 'decor') continue;
    for (const [ox, oy] of [[0, 0], [-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) {
      const x = Math.floor(entity.x + ox);
      const y = Math.floor(entity.y + oy);
      if (tiles[y]?.[x] == null) continue;
      if (TILES[tiles[y][x]].solid) tiles[y][x] = theme.ground;
    }
  }

  return {
    islandId,
    width,
    height,
    tiles,
    spawn: { x: districts[0].centerX + 0.5, y: districts[0].centerY + 1.5 },
    entities,
    districts,
    theme,
  };
}

const islandMapCache = new Map<IslandId, IslandMap>();

export function islandMap(islandId: IslandId): IslandMap {
  let map = islandMapCache.get(islandId);
  if (!map) {
    map = buildIslandMap(islandId);
    islandMapCache.set(islandId, map);
  }
  return map;
}

export function islandMapForZone(zoneId: string): IslandMap {
  const zone = ZONES[zoneId];
  if (!zone) throw new Error(`Unknown zone: ${zoneId}`);
  return islandMap(zone.islandId);
}

export function districtAt(map: IslandMap, x: number, y: number): WorldDistrict | null {
  for (const district of map.districts) {
    if (x >= district.x - 1 && x < district.x + district.width + 1 && y >= district.y - 1 && y < district.y + district.height + 1) {
      return district;
    }
  }
  return null;
}

export function districtFor(map: IslandMap, zoneId: string): WorldDistrict | null {
  return map.districts.find((district) => district.zoneId === zoneId) ?? null;
}

export function districtSpawn(map: IslandMap, zoneId: string): { x: number; y: number } {
  const district = districtFor(map, zoneId);
  if (!district) return map.spawn;
  return { x: district.centerX + 0.5, y: district.centerY + 1.5 };
}

function npcSprite(npcId: string): string {
  if (npcId === 'banker') return 'npc_banker';
  if (npcId === 'blacksmith') return 'npc_blacksmith';
  if (npcId === 'librarian') return 'npc_librarian';
  if (npcId === 'auction_master') return 'npc_auctioneer';
  if (npcId.includes('farm')) return 'npc_farmer';
  if (npcId.includes('mine') || npcId.includes('cavern')) return 'npc_miner';
  if (npcId.includes('fish')) return 'npc_fisher';
  if (npcId.includes('lumber') || npcId.includes('ranger')) return 'npc_forester';
  if (npcId.includes('combat') || npcId === 'mort') return 'npc_fighter';
  if (npcId === 'trapper') return 'npc_trapper';
  return 'npc_villager';
}

function resourceSprite(kind: string, itemId?: string): string {
  if (kind === 'mine') {
    if (!itemId) return 'ore_stone';
    if (itemId.includes('coal')) return 'ore_coal';
    if (itemId.includes('iron')) return 'ore_iron';
    if (itemId.includes('gold')) return 'ore_gold';
    if (itemId.includes('lapis')) return 'ore_lapis';
    if (itemId.includes('redstone')) return 'ore_redstone';
    if (itemId.includes('diamond')) return 'ore_diamond';
    if (itemId.includes('emerald')) return 'ore_emerald';
    if (itemId.includes('mithril')) return 'ore_mithril';
    if (itemId.includes('ruby')) return 'ore_ruby';
    if (itemId.includes('jade')) return 'ore_jade';
    return 'ore_stone';
  }
  if (kind === 'farm') {
    if (!itemId) return 'crop_wheat';
    if (itemId.includes('carrot')) return 'crop_carrot';
    if (itemId.includes('potato')) return 'crop_potato';
    if (itemId.includes('melon')) return 'crop_melon';
    if (itemId.includes('pumpkin')) return 'crop_pumpkin';
    if (itemId.includes('cactus')) return 'crop_cactus';
    if (itemId.includes('cane')) return 'crop_cane';
    if (itemId.includes('cocoa')) return 'crop_cocoa';
    if (itemId.includes('mushroom')) return 'crop_mushroom';
    return 'crop_wheat';
  }
  if (kind === 'forage') {
    if (itemId?.includes('jungle')) return 'tree_jungle';
    if (itemId?.includes('dark_oak')) return 'tree_dark_oak';
    if (itemId?.includes('birch')) return 'tree_birch';
    return 'tree_oak';
  }
  if (kind === 'fish') return 'fishing_spot';
  return 'ore_stone';
}

function mobSprite(target: string): string {
  if (target === 'dasher_spider') return 'mob_dasher';
  if (target.includes('spider')) return 'mob_spider';
  if (target === 'lapis_zombie') return 'mob_lapis_zombie';
  if (target === 'graveyard_zombie') return 'mob_brute';
  if (target === 'zealot') return 'mob_zealot';
  if (target.includes('enderman')) return 'mob_enderman';
  if (target.includes('magma')) return 'mob_magma';
  if (target.includes('wolf')) return 'mob_wolf';
  return 'mob_zombie';
}

export function isSolid(map: IslandMap, tileX: number, tileY: number): boolean {
  const tile = map.tiles[tileY]?.[tileX];
  return tile == null || TILES[tile].solid;
}

export function canStand(map: IslandMap, x: number, y: number): boolean {
  const half = 0.29;
  return !isSolid(map, Math.floor(x - half), Math.floor(y - half))
    && !isSolid(map, Math.floor(x + half), Math.floor(y - half))
    && !isSolid(map, Math.floor(x - half), Math.floor(y + half))
    && !isSolid(map, Math.floor(x + half), Math.floor(y + half));
}

const INTERACTIVE: WorldEntityKind[] = ['npc', 'station', 'resource', 'mob', 'fairy', 'door'];

export function nearestEntity(map: IslandMap, x: number, y: number, radius = 1.7): WorldEntity | null {
  let nearest: WorldEntity | null = null;
  let nearestDistance = Infinity;
  for (const entity of map.entities) {
    if (!INTERACTIVE.includes(entity.kind)) continue;
    const reach = entity.hidden ? 1.1 : radius;
    const dx = entity.x - x;
    const dy = entity.y - y;
    const distance = dx * dx + dy * dy;
    if (distance <= reach * reach && distance < nearestDistance) {
      nearest = entity;
      nearestDistance = distance;
    }
  }
  return nearest;
}
