import { v4 as uuid } from 'uuid';
import {
  rollSeaCreature,
  seaCreatureToMob,
  luckOfTheSeaLevel,
  mobSpriteId,
  type PlayerState,
  type WorldMobInstance,
} from '@aether/shared';

export function trySpawnSeaCreature(
  player: PlayerState,
  fishingSpotId: string,
  fishingLevel: number,
): WorldMobInstance | null {
  const rod = player.inventory.find((s) => s?.itemId === 'fishing_rod');
  const creature = rollSeaCreature(
    fishingSpotId,
    fishingLevel,
    player.stats.seaCreatureChance,
    luckOfTheSeaLevel(rod?.enchantments),
  );
  if (!creature) return null;
  const mob = seaCreatureToMob(creature);
  return {
    id: `sc:${uuid()}`,
    mobId: mob.id,
    zoneId: player.zoneId,
    x: player.x + 1.5,
    y: player.y,
    hp: mob.health,
    maxHp: mob.health,
    label: `⚓ ${mob.name}`,
    sprite: mobSpriteId('spider'),
  };
}
