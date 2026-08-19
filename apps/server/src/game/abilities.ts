import {
  ITEMS,
  magicDamage,
  canStand,
  type Facing,
  type IslandMap,
  type PlayerState,
} from '@aether/shared';

export interface AbilitySessionState {
  abilityCooldowns: Record<string, number>;
  shieldDefense: number;
  shieldUntil: number;
}

export function effectiveDefense(player: PlayerState, session: AbilitySessionState): number {
  const now = Date.now();
  const shield = now < session.shieldUntil ? session.shieldDefense : 0;
  return player.stats.defense + shield;
}

export function facingDelta(facing: Facing): { dx: number; dy: number } {
  switch (facing) {
    case 'left': return { dx: -1, dy: 0 };
    case 'right': return { dx: 1, dy: 0 };
    case 'up': return { dx: 0, dy: -1 };
    case 'down': return { dx: 0, dy: 1 };
  }
}

/** Step forward up to `maxTiles`, stopping at the last walkable tile. */
export function teleportForward(
  map: IslandMap,
  x: number,
  y: number,
  facing: Facing,
  maxTiles: number,
): { x: number; y: number; moved: number } {
  const { dx, dy } = facingDelta(facing);
  let nx = x;
  let ny = y;
  let moved = 0;
  for (let i = 0; i < maxTiles; i++) {
    const tx = nx + dx;
    const ty = ny + dy;
    if (!canStand(map, tx, ty)) break;
    nx = tx;
    ny = ty;
    moved++;
  }
  return { x: nx, y: ny, moved };
}

export function abilityDamage(
  player: PlayerState,
  baseDamage: number,
  scaling: number,
): number {
  return Math.round(magicDamage(baseDamage, player.stats.intelligence, scaling));
}

export function abilityKey(itemId: string): string {
  return `ability:${itemId}`;
}

export function isOnCooldown(session: AbilitySessionState, key: string, cooldownMs: number): number | null {
  const readyAt = session.abilityCooldowns[key] ?? 0;
  const remaining = readyAt - Date.now();
  return remaining > 0 ? remaining : null;
}

export function setCooldown(session: AbilitySessionState, key: string, cooldownSec: number): void {
  session.abilityCooldowns[key] = Date.now() + cooldownSec * 1000;
}

export function grantShield(session: AbilitySessionState, defense: number, durationSec: number): void {
  session.shieldDefense = defense;
  session.shieldUntil = Date.now() + durationSec * 1000;
}

/** Classify ability behaviour from its display name. */
export function abilityKind(name: string): 'teleport' | 'wither_impact' | 'aoe' | 'projectile' | 'shadow' | 'salvation' | 'soulcry' | 'throw' | 'unknown' {
  const lower = name.toLowerCase();
  if (lower.includes('wither impact')) return 'wither_impact';
  if (lower.includes('instant transmission')) return 'teleport';
  if (lower.includes('shadow fury')) return 'shadow';
  if (lower.includes('salvation')) return 'salvation';
  if (lower.includes('soulcry')) return 'soulcry';
  if (lower.includes('throw')) return 'throw';
  if (lower.includes('dragon rage') || lower.includes('giant slam') || lower.includes('leap') || lower.includes('flail')) return 'aoe';
  if (lower.includes('rose') || lower.includes('showtime') || lower.includes('bat') || lower.includes('balloon')) return 'projectile';
  return 'unknown';
}

export function weaponAbilityLabel(itemId: string): string | null {
  const def = ITEMS[itemId];
  return def?.ability?.name ?? null;
}
