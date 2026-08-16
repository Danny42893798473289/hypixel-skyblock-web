import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ItemId } from '@aether/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let internalToHypixel: Record<string, string> = {};
let hypixelToInternal: Map<string, ItemId> = new Map();
let loaded = false;

function loadMap(): void {
  if (loaded) return;
  loaded = true;
  const mapPath = path.resolve(__dirname, '../../../client/src/ui/chest/hypixelTextureMap.json');
  try {
    internalToHypixel = JSON.parse(fs.readFileSync(mapPath, 'utf8')) as Record<string, string>;
  } catch {
    internalToHypixel = {};
  }
  hypixelToInternal = new Map();
  for (const [internal, hypixel] of Object.entries(internalToHypixel)) {
    hypixelToInternal.set(hypixel, internal as ItemId);
    const base = hypixel.split(':')[0];
    if (!hypixelToInternal.has(base)) hypixelToInternal.set(base, internal as ItemId);
  }
}

export function getHypixelProductId(itemId: ItemId): string | undefined {
  loadMap();
  return internalToHypixel[itemId];
}

export function getInternalItemId(hypixelId: string): ItemId | undefined {
  loadMap();
  return hypixelToInternal.get(hypixelId) ?? hypixelToInternal.get(hypixelId.split(':')[0]);
}

export function getProductMapSize(): number {
  loadMap();
  return Object.keys(internalToHypixel).length;
}
