import type { DungeonClass, DungeonRunState } from './protocol.js';
import type { DungeonGrade } from './dungeonContent.js';
import { dungeonFloor } from './dungeonContent.js';
import type { Facing } from './world.js';

export type DungeonRoomType = 'combat' | 'puzzle' | 'trap' | 'fairy';
export type DungeonBossMechanic =
  | 'still'
  | 'adds'
  | 'two_bar'
  | 'ranged'
  | 'clone'
  | 'golems'
  | 'move'
  | 'crystals'
  | 'tank'
  | 'burn';
export type DungeonChestRarity = 'wood' | 'gold' | 'diamond';

export interface DungeonBossPhaseDef {
  name: string;
  hpShare: number;
  mechanic: DungeonBossMechanic;
}

const PUZZLE_PAD_COUNT = 4;

/** Mort starter, mixed rooms, last room always Blood (combat). */
export function rollDungeonRoomTypes(roomCount: number): DungeonRoomType[] {
  const count = Math.max(1, roomCount);
  const types: DungeonRoomType[] = [];
  for (let i = 0; i < count - 1; i++) {
    const roll = Math.random();
    if (roll < 0.42) types.push('combat');
    else if (roll < 0.68) types.push('puzzle');
    else if (roll < 0.86) types.push('trap');
    else types.push('fairy');
  }
  if (count >= 3 && !types.includes('puzzle')) types[0] = 'puzzle';
  if (count >= 4 && !types.includes('combat')) types[Math.min(1, types.length - 1)] = 'combat';
  let fairySeen = false;
  for (let i = 0; i < types.length; i++) {
    if (types[i] !== 'fairy') continue;
    if (fairySeen) types[i] = 'combat';
    fairySeen = true;
  }
  types.push('combat');
  return types;
}

export function currentRoomType(run: DungeonRunState): DungeonRoomType | 'starter' | 'boss' {
  if (run.phase === 'starter' || run.room <= 0) return 'starter';
  if (run.phase === 'boss' || run.room > run.rooms) return 'boss';
  return run.roomTypes?.[run.room - 1] ?? 'combat';
}

export function roomNeedsMobs(type: DungeonRoomType | 'starter' | 'boss'): boolean {
  return type === 'combat' || type === 'trap';
}

export function puzzlePadCount(): number {
  return PUZZLE_PAD_COUNT;
}

export function puzzleComplete(run: DungeonRunState): boolean {
  const pads = run.puzzlePads ?? {};
  for (let i = 0; i < PUZZLE_PAD_COUNT; i++) {
    if (!pads[`dungeon_pad:${i}`]) return false;
  }
  return true;
}

export function dungeonBestiaryMobId(room: number): string {
  if (room >= 8) return 'skeleton';
  if (room >= 4) return 'graveyard_zombie';
  return 'zombie';
}

export function bossPhasesForFloor(floorId: string): DungeonBossPhaseDef[] {
  const id = floorId.replace(/^m/, 'f');
  switch (id) {
    case 'f1':
      return [{ name: 'Bonzo', hpShare: 1, mechanic: 'still' }];
    case 'f2':
      return [{ name: 'Scarf', hpShare: 1, mechanic: 'adds' }];
    case 'f3':
      return [
        { name: 'Guardian', hpShare: 0.4, mechanic: 'two_bar' },
        { name: 'The Professor', hpShare: 0.6, mechanic: 'two_bar' },
      ];
    case 'f4':
      return [{ name: 'Thorn', hpShare: 1, mechanic: 'ranged' }];
    case 'f5':
      return [{ name: 'Livid', hpShare: 1, mechanic: 'clone' }];
    case 'f6':
      return [
        { name: 'Giants', hpShare: 0.42, mechanic: 'golems' },
        { name: 'Sadan', hpShare: 0.58, mechanic: 'tank' },
      ];
    case 'f7':
      return [
        { name: 'Maxor', hpShare: 0.22, mechanic: 'move' },
        { name: 'Storm', hpShare: 0.22, mechanic: 'crystals' },
        { name: 'Goldor', hpShare: 0.28, mechanic: 'tank' },
        { name: 'Necron', hpShare: 0.28, mechanic: 'burn' },
      ];
    default:
      return [{ name: dungeonFloor(floorId)?.boss.name ?? 'Boss', hpShare: 1, mechanic: 'tank' }];
  }
}

export function currentBossPhase(run: DungeonRunState): DungeonBossPhaseDef {
  const phases = bossPhasesForFloor(run.floorId);
  return phases[Math.min(run.bossPhaseIndex ?? 0, phases.length - 1)] ?? phases[0];
}

export function initBossPhaseHp(run: DungeonRunState, totalHealth: number): void {
  const phases = bossPhasesForFloor(run.floorId);
  const index = Math.min(run.bossPhaseIndex ?? 0, phases.length - 1);
  const share = phases[index]?.hpShare ?? 1;
  run.bossPhaseIndex = index;
  run.bossPhaseName = phases[index]?.name;
  run.bossHp = Math.max(1, Math.round(totalHealth * share));
}

export function secretPosition(type: DungeonRoomType | 'starter' | 'boss'): { x: number; y: number } {
  if (type === 'fairy') return { x: 13, y: 2.6 };
  if (type === 'trap') return { x: 22.4, y: 3.4 };
  if (type === 'combat') return { x: 4.4, y: 4.2 };
  return { x: 3.5, y: 14.5 };
}

export function roomHasSecret(type: DungeonRoomType | 'starter' | 'boss'): boolean {
  return type === 'fairy' || type === 'combat' || type === 'trap';
}

export function dungeonParTimeMs(rooms: number): number {
  return 40_000 + rooms * 22_000;
}

export function dungeonTimeBonus(run: DungeonRunState, now = Date.now()): number {
  const started = run.startedAt ?? now;
  const par = dungeonParTimeMs(run.rooms);
  const over = now - started - par;
  if (over <= 0) return 60;
  return Math.max(0, Math.round(60 - over / 2000));
}

export function dungeonRoomClearScore(type: DungeonRoomType | 'starter' | 'boss', blood: boolean): number {
  const base = type === 'trap' ? 50 : type === 'puzzle' ? 45 : type === 'fairy' ? 25 : 40;
  return base + (blood ? 20 : 0);
}

export function dungeonDeathPenalty(): number {
  return 40;
}

export function dungeonBossKillScore(): number {
  return 80;
}

export function dungeonChestRarity(grade: DungeonGrade): DungeonChestRarity {
  if (grade === 'S+' || grade === 'S') return 'diamond';
  if (grade === 'A' || grade === 'B') return 'gold';
  return 'wood';
}

export function facingToward(px: number, py: number, tx: number, ty: number, facing: Facing): boolean {
  const dx = tx - px;
  const dy = ty - py;
  if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) return true;
  if (facing === 'right') return dx >= Math.abs(dy) * 0.28;
  if (facing === 'left') return dx <= -Math.abs(dy) * 0.28;
  if (facing === 'down') return dy >= Math.abs(dx) * 0.28;
  return dy <= -Math.abs(dx) * 0.28;
}

export function inFacingCone(
  px: number,
  py: number,
  tx: number,
  ty: number,
  facing: Facing,
  maxDist: number,
): boolean {
  if (Math.hypot(tx - px, ty - py) > maxDist) return false;
  return facingToward(px, py, tx, ty, facing);
}

export function inFacingLine(
  px: number,
  py: number,
  tx: number,
  ty: number,
  facing: Facing,
  maxDist: number,
  width = 1.35,
): boolean {
  const dx = tx - px;
  const dy = ty - py;
  const dist = Math.hypot(dx, dy);
  if (dist > maxDist) return false;
  if (facing === 'right') return dx >= 0 && Math.abs(dy) <= width;
  if (facing === 'left') return dx <= 0 && Math.abs(dy) <= width;
  if (facing === 'down') return dy >= 0 && Math.abs(dx) <= width;
  return dy <= 0 && Math.abs(dx) <= width;
}

export interface ClassAttackRules {
  range: number;
  damageMult: number;
  manaCost: number;
  requireBow: boolean;
  requireFacing: boolean;
}

export function classAutoAttackRules(dungeonClass: DungeonClass, holdingBow: boolean): ClassAttackRules {
  if (dungeonClass === 'archer') {
    return {
      range: holdingBow ? 4.8 : 2.2,
      damageMult: holdingBow ? 1.12 : 0.45,
      manaCost: 0,
      requireBow: false,
      requireFacing: true,
    };
  }
  if (dungeonClass === 'mage') {
    return { range: 3.2, damageMult: 1.18, manaCost: 6, requireBow: false, requireFacing: false };
  }
  if (dungeonClass === 'tank') {
    return { range: 2.3, damageMult: 0.8, manaCost: 0, requireBow: false, requireFacing: true };
  }
  if (dungeonClass === 'healer') {
    return { range: 2.3, damageMult: 0.7, manaCost: 0, requireBow: false, requireFacing: true };
  }
  return { range: 2.2, damageMult: 1.1, manaCost: 0, requireBow: false, requireFacing: true };
}

export function overworldAttackRange(holdingBow: boolean): number {
  return holdingBow ? 4.6 : 2.2;
}

export function classAbilityHitsMob(
  dungeonClass: DungeonClass,
  px: number,
  py: number,
  tx: number,
  ty: number,
  facing: Facing,
): boolean {
  if (dungeonClass === 'berserk') return inFacingCone(px, py, tx, ty, facing, 4.2);
  if (dungeonClass === 'archer') return inFacingLine(px, py, tx, ty, facing, 8, 1.5);
  return Math.hypot(tx - px, ty - py) <= 8;
}

export function standingStill(lastMoveAt: number, now = Date.now(), graceMs = 900): boolean {
  return now - lastMoveAt >= graceMs;
}
