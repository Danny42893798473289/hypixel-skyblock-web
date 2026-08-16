type BazaarSyncListener = () => void;

const listeners = new Set<BazaarSyncListener>();

export function onBazaarSynced(listener: BazaarSyncListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyBazaarSynced(): void {
  for (const listener of listeners) listener();
}
