import { useMemo } from 'react';
import type { PriceHistoryPoint } from '@aether/shared';
import { formatBazaarPrice } from '../chest/slotUtils';

interface Props {
  history: PriceHistoryPoint[];
  width?: number;
  height?: number;
}

export function PriceHistoryChart({ history, width = 280, height = 56 }: Props) {
  const { buyPath, sellPath, min, max } = useMemo(() => {
    const points = history.filter((p) => p.buyPrice != null || p.sellPrice != null);
    if (points.length < 2) return { buyPath: '', sellPath: '', min: 0, max: 0 };

    const values = points.flatMap((p) => [p.buyPrice, p.sellPrice].filter((v): v is number => v != null));
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const span = maxVal - minVal || 1;
    const pad = 4;
    const innerW = width - pad * 2;
    const innerH = height - pad * 2;

    const xAt = (index: number) => pad + (index / (points.length - 1)) * innerW;
    const yAt = (value: number) => pad + innerH - ((value - minVal) / span) * innerH;

    const line = (key: 'buyPrice' | 'sellPrice') => points
      .map((point, index) => {
        const value = point[key];
        if (value == null) return null;
        return `${index === 0 || points[index - 1]?.[key] == null ? 'M' : 'L'} ${xAt(index).toFixed(1)} ${yAt(value).toFixed(1)}`;
      })
      .filter(Boolean)
      .join(' ');

    return { buyPath: line('buyPrice'), sellPath: line('sellPrice'), min: minVal, max: maxVal };
  }, [history, width, height]);

  if (history.length < 2) {
    return <div className="bazaar-history-empty">Price history builds up as Hypixel prices sync.</div>;
  }

  return (
    <div className="bazaar-history-chart">
      <div className="bazaar-history-labels">
        <span className="bazaar-history-buy">Buy {formatBazaarPrice(max)}</span>
        <span className="bazaar-history-sell">Sell {formatBazaarPrice(min)}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden>
        <path d={sellPath} className="bazaar-history-line-sell" fill="none" strokeWidth="2" />
        <path d={buyPath} className="bazaar-history-line-buy" fill="none" strokeWidth="2" />
      </svg>
      <div className="bazaar-history-legend">
        <span><i className="dot buy" /> Instant buy</span>
        <span><i className="dot sell" /> Instant sell</span>
      </div>
    </div>
  );
}

function formatSyncAge(lastUpdated: number | null): string {
  if (!lastUpdated) return 'not synced yet';
  const sec = Math.max(0, Math.floor((Date.now() - lastUpdated) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  return `${Math.floor(min / 60)}h ago`;
}

export function BazaarSyncBadge({
  lastUpdated,
  source,
  syncing,
}: {
  lastUpdated: number | null;
  source: 'hypixel' | 'local';
  syncing: boolean;
}) {
  const label = syncing
    ? 'Syncing Hypixel Bazaar…'
    : source === 'hypixel'
      ? `Hypixel prices · ${formatSyncAge(lastUpdated)}`
      : 'Local market prices';
  return <div className="bazaar-sync-badge">{label}</div>;
}
