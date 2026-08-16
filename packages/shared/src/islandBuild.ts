import type { ItemId } from './items.js';
import { hotbarStack, type Inventory } from './inventory.js';
import type { Facing, IslandMap, TileKind } from './world.js';
import { TILES, districtFor } from './world.js';

export const ISLAND_BLOCK_CAP = 1500;

export type IslandBlocks = Record<string, TileKind>;

export function islandBlockKey(x: number, y: number): string {
  return `${x},${y}`;
}

export const PLACEABLE_TILE: Partial<Record<ItemId, TileKind>> = {
  cobble: 'stone',
  stone: 'stone',
  dirt: 'dirt',
  oak_plank: 'wood',
  oak_log: 'wood',
  spruce_log: 'wood',
  birch_log: 'wood',
  jungle_log: 'wood',
  acacia_log: 'wood',
  dark_oak_log: 'wood',
  sand: 'sand',
  gravel: 'gravel',
  obsidian: 'obsidian',
  end_stone: 'stone',
};

export const TILE_DROP_ITEM: Partial<Record<TileKind, ItemId>> = {
  stone: 'cobble',
  dirt: 'dirt',
  grass: 'dirt',
  wood: 'oak_plank',
  sand: 'sand',
  gravel: 'gravel',
  obsidian: 'obsidian',
  path: 'oak_plank',
  farmland: 'dirt',
  wall: 'cobble',
};

export function placeableTile(itemId: ItemId): TileKind | null {
  return PLACEABLE_TILE[itemId] ?? null;
}

export function isHoldingPlaceable(player: {
  islandId: string;
  inventory: Inventory;
  hotbarSlot: number;
}): boolean {
  if (player.islandId !== 'private_island') return false;
  const stack = hotbarStack(player.inventory, player.hotbarSlot);
  return Boolean(stack && placeableTile(stack.itemId));
}

export function tileInFront(x: number, y: number, facing: Facing): { x: number; y: number } {
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  if (facing === 'left') return { x: tx - 1, y: ty };
  if (facing === 'right') return { x: tx + 1, y: ty };
  if (facing === 'up') return { x: tx, y: ty - 1 };
  return { x: tx, y: ty + 1 };
}

export function applyIslandBlocks(map: IslandMap, blocks?: IslandBlocks | null): IslandMap {
  if (!blocks) return map;
  const keys = Object.keys(blocks);
  if (!keys.length) return map;
  const tiles = map.tiles.map((row) => row.slice());
  for (const key of keys) {
    const kind = blocks[key];
    if (!kind || !(kind in TILES)) continue;
    const comma = key.indexOf(',');
    const x = Number(key.slice(0, comma));
    const y = Number(key.slice(comma + 1));
    if (tiles[y]?.[x] == null) continue;
    tiles[y][x] = kind;
  }
  return { ...map, tiles };
}

export function isWalkableTile(kind: TileKind | undefined): boolean {
  return Boolean(kind && !TILES[kind].solid);
}

export function hasWalkableNeighbor(map: IslandMap, x: number, y: number): boolean {
  return (
    isWalkableTile(map.tiles[y]?.[x - 1])
    || isWalkableTile(map.tiles[y]?.[x + 1])
    || isWalkableTile(map.tiles[y - 1]?.[x])
    || isWalkableTile(map.tiles[y + 1]?.[x])
  );
}

export function isProtectedIslandSpawn(map: IslandMap, x: number, y: number): boolean {
  const spawn = districtFor(map, 'island_home');
  if (!spawn) return false;
  return Math.abs(x - spawn.centerX) <= 2 && Math.abs(y - spawn.centerY) <= 2;
}
