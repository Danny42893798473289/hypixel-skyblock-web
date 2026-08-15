import type { PlayerState } from '@aether/shared';
import { loadPlayer, savePlayer } from '../auth/index.js';

type Mutator = (player: PlayerState) => PlayerState | void;

const live = new Map<string, () => PlayerState>();
const applyLive = new Map<string, (fn: Mutator) => void>();

export function registerLivePlayer(
  id: string,
  getter: () => PlayerState,
  apply: (fn: Mutator) => void,
): void {
  live.set(id, getter);
  applyLive.set(id, apply);
}

export function unregisterLivePlayer(id: string): void {
  live.delete(id);
  applyLive.delete(id);
}

/** Prefer in-memory session; fall back to DB */
export function getMutablePlayer(id: string): PlayerState | null {
  const g = live.get(id);
  if (g) return g();
  return loadPlayer(id);
}

export function updatePlayer(id: string, fn: Mutator): PlayerState | null {
  const apply = applyLive.get(id);
  if (apply) {
    apply(fn);
    const g = live.get(id);
    return g ? g() : null;
  }
  const p = loadPlayer(id);
  if (!p) return null;
  const result = fn(p);
  const next = (result as PlayerState) ?? p;
  savePlayer(next);
  return next;
}
