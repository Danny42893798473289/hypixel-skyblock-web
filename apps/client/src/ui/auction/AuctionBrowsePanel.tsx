import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ITEMS,
  type AuctionListing,
} from '@aether/shared';
import {
  ClickButton,
  IconSlotButton,
  MenuOverlay,
} from '../chest/slotUtils';
import { ItemIcon } from '../chest/ItemIcon';

type Sort = 'ending' | 'price_asc' | 'price_desc' | 'newest';

interface AuctionResponse {
  listings: AuctionListing[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface Props {
  onMenuClick: (slot: number, button: ClickButton, action?: string) => void;
  onClose: () => void;
  onBack: () => void;
}

function formatTimeLeft(expiresAt: number): string {
  const ms = Math.max(0, expiresAt - Date.now());
  const hours = Math.floor(ms / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function AuctionBrowsePanel({ onMenuClick, onClose, onBack }: Props) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<Sort>('ending');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<AuctionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        sort,
        page: String(page),
        pageSize: '24',
      });
      const res = await fetch(`/api/auctions?${params}`);
      const json = (await res.json()) as AuctionResponse;
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [page, search, sort]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => { void load(); }, 30_000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Backspace') {
        event.preventDefault();
        onBack();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBack, onClose]);

  const totalLabel = useMemo(() => {
    if (!data) return '';
    return `${data.total.toLocaleString()} listing${data.total === 1 ? '' : 's'}`;
  }, [data]);

  return (
    <MenuOverlay title="Auction House" onClose={onClose} onBack={onBack} className="auction-browse-window">
      <div className="auction-toolbar">
        <input
          className="auction-search"
          value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(0); }}
          placeholder="Search items or sellers…"
        />
        <select
          className="auction-sort"
          value={sort}
          onChange={(event) => { setSort(event.target.value as Sort); setPage(0); }}
        >
          <option value="ending">Ending soon</option>
          <option value="price_asc">Lowest price</option>
          <option value="price_desc">Highest price</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      <div className="auction-actions">
        <IconSlotButton
          icon="gold_ingot"
          name="Create Auction"
          lore={[{ text: 'List gear, pets, and accessories', color: 'yellow' }]}
          onClick={() => onMenuClick(0, 'left', 'auction:create')}
        />
        <IconSlotButton
          icon="chest"
          name="Manage Listings"
          lore={[{ text: 'View or cancel your listings', color: 'aqua' }]}
          onClick={() => onMenuClick(0, 'left', 'auction:manage')}
        />
        <IconSlotButton
          icon="ender_chest"
          name="Claim Items"
          lore={[{ text: 'Collect won auctions & returns', color: 'green' }]}
          onClick={() => onMenuClick(0, 'left', 'auction:claims')}
        />
        <span className="auction-count">{loading ? 'Loading…' : totalLabel}</span>
      </div>

      <div className="auction-grid">
        {(data?.listings ?? []).map((listing) => {
          const def = ITEMS[listing.itemId];
          const price = listing.bin ? listing.price : listing.highestBid;
          return (
            <button
              key={listing.id}
              type="button"
              className={`auction-card rarity-${(def?.rarity ?? 'common').toLowerCase()}`}
              onClick={() => onMenuClick(0, 'left', `auction:view:${listing.id}`)}
            >
              <div className="auction-card-icon">
                <ItemIcon icon={def?.sprite ?? 'material'} itemId={listing.itemId} rarity={def?.rarity} />
              </div>
              <div className="auction-card-body">
                <strong>{def?.name ?? listing.itemId}</strong>
                <span className="auction-card-price">{price.toLocaleString()} ⛃</span>
                <span className="auction-card-meta">
                  {listing.bin ? 'BIN' : 'Bid'} · {formatTimeLeft(listing.expiresAt)}
                  {listing.mirrored ? ' · Mirror' : ''}
                </span>
                <span className="auction-card-seller">{listing.sellerName}</span>
              </div>
            </button>
          );
        })}
        {!loading && (data?.listings.length ?? 0) === 0 ? (
          <div className="auction-empty">No auctions match your search.</div>
        ) : null}
      </div>

      <div className="auction-pagination">
        <button type="button" className="mc-button" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
          Previous
        </button>
        <span>Page {(data?.page ?? 0) + 1} / {data?.totalPages ?? 1}</span>
        <button
          type="button"
          className="mc-button"
          disabled={!data || page + 1 >= data.totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>

      <div className="menu-hint">Mirrored BIN listings refresh hourly from Hypixel · Esc closes</div>
    </MenuOverlay>
  );
}
