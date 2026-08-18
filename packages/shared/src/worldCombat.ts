import { MOBS, type DropDef } from './content.js';
import { ZONES } from './locations.js';
import type { ItemId } from './items.js';
import type { PlacedMinion } from './minions.js';
import { MINIONS } from './minions.js';
import type { IslandMap, WorldEntity } from './world.js';

export interface WorldMobInstance {
  id: string;
  mobId: string;
  zoneId: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  label: string;
  sprite: string;
  slayerBoss?: boolean;
  respawnAt?: number;
  elite?: boolean;
  homeX?: number;
  homeY?: number;
}

export interface GatherChannel {
  entityId: string;
  actionId: string;
  kind: 'mine' | 'farm' | 'forage' | 'fish';
  startedAt: number;
  durationMs: number;
  fishPhase?: 'waiting' | 'bite';
  biteUntil?: number;
}

export function mobSpriteId(target: string): string {
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

function fmtHp(hp: number): string {
  if (hp >= 1_000_000) return `${(hp / 1_000_000).toFixed(1)}M`;
  if (hp >= 10_000) return `${Math.round(hp / 1000)}k`;
  return Math.ceil(hp).toLocaleString();
}

export function spawnMobsForZone(zoneId: string, map: IslandMap): WorldMobInstance[] {
  const zone = ZONES[zoneId];
  if (!zone) return [];
  const spawned: WorldMobInstance[] = [];
  for (const action of zone.actions) {
    if (action.kind !== 'combat') continue;
    const template = map.entities.find((entity) => entity.actionId === action.id);
    const baseX = template?.x ?? 8;
    const baseY = template?.y ?? 8;
    const mobId = String(action.target ?? 'zombie');
    const def = MOBS[mobId] ?? MOBS.zombie;
    for (let i = 0; i < 3; i++) {
      const elite = Math.random() < 0.1;
      const hp = Math.round(def.health * (elite ? 1.8 : 1));
      const x = baseX + (i - 1) * 1.7;
      const y = baseY + (i % 2) * 1.15;
      spawned.push({
        id: `wm:${zoneId}:${action.id}:${i}`,
        mobId: def.id,
        zoneId,
        x,
        y,
        hp,
        maxHp: hp,
        label: elite ? `★ Elite ${def.name}` : def.name,
        sprite: mobSpriteId(mobId),
        elite,
        homeX: x,
        homeY: y,
      });
    }
  }
  return spawned;
}

export function overlayLiveWorld(
  map: IslandMap,
  player: {
    islandId: string;
    zoneId: string;
    worldMobs?: WorldMobInstance[];
    minions?: PlacedMinion[];
  },
): IslandMap {
  const live = player.worldMobs ?? [];
  const hideStaticCombat = live.some((mob) => !mob.slayerBoss && mob.zoneId === player.zoneId);
  const entities: WorldEntity[] = map.entities.filter((entity) => {
    if (!hideStaticCombat) return true;
    if (entity.kind !== 'mob') return true;
    if (entity.actionId?.startsWith('dungeon:')) return true;
    if (entity.actionId?.startsWith('worldmob:')) return true;
    if (entity.actionId?.startsWith('slayerboss:')) return true;
    return false;
  });

  for (const mob of live) {
    if (mob.hp <= 0) continue;
    entities.push({
      id: mob.id,
      zoneId: mob.zoneId,
      x: mob.x,
      y: mob.y,
      kind: 'mob',
      label: `${mob.slayerBoss ? '☠ ' : ''}${mob.label} (${fmtHp(mob.hp)} ❤)`,
      sprite: mob.sprite,
      actionId: mob.slayerBoss ? `slayerboss:${mob.id}` : `worldmob:${mob.id}`,
    });
  }

  if (player.islandId === 'private_island') {
    for (const [index, minion] of (player.minions ?? []).entries()) {
      const def = MINIONS[minion.type];
      entities.push({
        id: `minion:${minion.id}`,
        zoneId: 'island_minions',
        x: minion.x || (6 + (index % 3) * 2.4),
        y: minion.y || (6 + Math.floor(index / 3) * 2.4),
        kind: 'station',
        label: `${def?.name ?? 'Minion'} · ${minion.storage}`,
        sprite: 'minion_pad',
        menu: 'minions',
      });
    }
  }

  return { ...map, entities };
}

export const SLAYER_DROPS: Record<string, DropDef[]> = {
  revenant: [
    { itemId: 'rev_flesh' as ItemId, chance: 1, min: 1, max: 3 },
    { itemId: 'rotten_flesh' as ItemId, chance: 1, min: 2, max: 5 },
    { itemId: 'revenant_catalyst' as ItemId, chance: 0.08, min: 1, max: 1 },
    { itemId: 'undead_catalyst' as ItemId, chance: 0.05, min: 1, max: 1 },
    { itemId: 'revenant_falchion' as ItemId, chance: 0.02, min: 1, max: 1 },
  ],
  tarantula: [
    { itemId: 'tarantula_web' as ItemId, chance: 1, min: 1, max: 3 },
    { itemId: 'string' as ItemId, chance: 1, min: 2, max: 6 },
    { itemId: 'spider_catalyst' as ItemId, chance: 0.08, min: 1, max: 1 },
    { itemId: 'tarantula_web' as ItemId, chance: 0.04, min: 8, max: 16 },
  ],
  sven: [
    { itemId: 'wolf_tooth' as ItemId, chance: 1, min: 1, max: 3 },
    { itemId: 'mutton' as ItemId, chance: 0.6, min: 1, max: 2 },
    { itemId: 'wolf_catalyst' as ItemId, chance: 0.08, min: 1, max: 1 },
    { itemId: 'golden_teeth' as ItemId, chance: 0.06, min: 1, max: 1 },
  ],
  voidgloom: [
    { itemId: 'null_sphere' as ItemId, chance: 1, min: 1, max: 2 },
    { itemId: 'ender_pearl' as ItemId, chance: 1, min: 2, max: 4 },
    { itemId: 'enderman_catalyst' as ItemId, chance: 0.08, min: 1, max: 1 },
  ],
  inferno: [
    { itemId: 'derelict_ashe' as ItemId, chance: 1, min: 1, max: 2 },
    { itemId: 'blaze_rod' as ItemId, chance: 0.8, min: 1, max: 3 },
    { itemId: 'blaze_ashes' as ItemId, chance: 0.12, min: 1, max: 1 },
    { itemId: 'match_sticks' as ItemId, chance: 0.1, min: 1, max: 2 },
  ],
};

export function slayerMatchesMob(targetMob: string, mobId: string): boolean {
  if (targetMob === mobId) return true;
  if (targetMob === 'zombie' && ['zombie', 'graveyard_zombie', 'lapis_zombie', 'husk', 'pigman'].includes(mobId)) return true;
  if (targetMob === 'spider' && ['spider', 'dasher_spider', 'weaver', 'crawler'].includes(mobId)) return true;
  if (targetMob === 'wolf' && mobId === 'wolf') return true;
  if (targetMob === 'enderman' && ['enderman', 'zealot'].includes(mobId)) return true;
  if (targetMob === 'magma_cube' && mobId === 'magma_cube') return true;
  return false;
}
