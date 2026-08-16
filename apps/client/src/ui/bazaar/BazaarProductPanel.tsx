import { useEffect, useState } from 'react';
import {
  ITEMS,
  buildItemLore,
  type BazaarMeta,
  type BazaarOrder,
  type ItemId,
  type OrderBookLevel,
  type OrderBookSnapshot,
  type PriceHistoryPoint,
} from '@aether/shared';
import {
  ClickButton,
  IconSlotButton,
  MenuOverlay,
  formatBazaarPrice,
} from '../chest/slotUtils';
import { BazaarSyncBadge, PriceHistoryChart } from './BazaarPriceHistory';

const BOOK_DEPTH = 9;

interface Props {
  itemId: ItemId;
  book: OrderBookSnapshot | null;
  orders: BazaarOrder[];
  bazaarMeta: BazaarMeta | null;
  onMenuClick: (slot: number, button: ClickButton, action?: string) => void;
  onClose: () => void;
  onBack: () => void;
}

export function BazaarProductPanel({ itemId, book, orders, bazaarMeta, onMenuClick, onClose, onBack }: Props) {
  const [history, setHistory] = useState<PriceHistoryPoint[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/bazaar/${itemId}/history`)
      .then((res) => res.json())
      .then((json: { history?: PriceHistoryPoint[] }) => {
        if (!cancelled) setHistory(json.history ?? []);
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      });
    return () => { cancelled = true; };
  }, [itemId, bazaarMeta?.lastUpdated]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const def = ITEMS[itemId];
  const bestAsk = book?.bestAsk ?? null;
  const bestBid = book?.bestBid ?? null;
  const spread = bestAsk != null && bestBid != null ? bestAsk - bestBid : null;
  const myOrders = orders.filter((order) => order.itemId === itemId && order.qty > order.filled);

  return (
    <MenuOverlay
      title={`Bazaar ➜ ${def?.name ?? itemId}`}
      onClose={onClose}
      onBack={onBack}
      className="bazaar-product-window"
    >
      <BazaarSyncBadge
        lastUpdated={bazaarMeta?.lastUpdated ?? null}
        source={bazaarMeta?.source ?? 'local'}
        syncing={bazaarMeta?.syncing ?? false}
      />
      <div className="bazaar-spread-bar">
        <span className="bazaar-spread-buy">Buy {bestAsk == null ? '—' : formatBazaarPrice(bestAsk)}</span>
        <span className="bazaar-spread-mid">
          {spread == null ? 'No spread' : `Spread ${formatBazaarPrice(spread)}`}
        </span>
        <span className="bazaar-spread-sell">Sell {bestBid == null ? '—' : formatBazaarPrice(bestBid)}</span>
      </div>

      <PriceHistoryChart history={history} />

      <div className="bazaar-product-layout">
        <div className="bazaar-product-center">
          <IconSlotButton
            icon={def?.sprite ?? 'material'}
            itemId={itemId}
            name={def?.name ?? itemId}
            rarity={def?.rarity}
            className="bazaar-product-item"
            lore={def ? buildItemLore(def) : []}
          />

          <div className="bazaar-instant-grid">
            <IconSlotButton
              icon="emerald"
              name="Buy Instantly"
              disabled={bestAsk == null}
              lore={[
                { text: bestAsk == null ? 'No sell offers' : `${formatBazaarPrice(bestAsk)} coins each`, color: 'gold' },
                { text: 'Left: 1 · Right: 64', color: 'yellow' },
              ]}
              onClick={(button) => onMenuClick(0, button, `bazaarBuy:${itemId}`)}
            />
            <IconSlotButton
              icon="coin"
              name="Sell Instantly"
              disabled={bestBid == null}
              lore={[
                { text: bestBid == null ? 'No buy offers' : `${formatBazaarPrice(bestBid)} coins each`, color: 'gold' },
                { text: '1.125% bazaar tax on sells', color: 'gray' },
                { text: 'Left: 1 · Right: 64', color: 'yellow' },
              ]}
              onClick={(button) => onMenuClick(0, button, `bazaarSell:${itemId}`)}
            />
          </div>

          <div className="bazaar-action-grid">
            <IconSlotButton
              icon="paper"
              name="Create Buy Order"
              lore={[
                { text: `Top bid: ${bestBid == null ? '—' : formatBazaarPrice(bestBid)}`, color: 'green' },
                { text: 'Places 64 @ top bid + 0.1', color: 'gray' },
                { text: 'Click to create!', color: 'yellow' },
              ]}
              onClick={(button) => onMenuClick(0, button, `bazaarBuyOrder:${itemId}`)}
            />
            <IconSlotButton
              icon="book"
              name="Create Sell Offer"
              lore={[
                { text: `Top ask: ${bestAsk == null ? '—' : formatBazaarPrice(bestAsk)}`, color: 'red' },
                { text: 'Offers up to 64 @ top ask − 0.1', color: 'gray' },
                { text: 'Click to create!', color: 'yellow' },
              ]}
              onClick={(button) => onMenuClick(0, button, `bazaarSellOrder:${itemId}`)}
            />
          </div>

          <div className="bazaar-product-footer">
            <IconSlotButton
              icon="chest"
              name="Your Orders"
              lore={[
                { text: `${myOrders.length} open on this product`, color: 'aqua' },
                { text: 'Click to manage orders', color: 'yellow' },
              ]}
              onClick={(button) => onMenuClick(0, button, 'open:bazaar_orders')}
            />
            <IconSlotButton
              icon="hopper"
              name="Manage Orders"
              lore={[
                { text: `${orders.filter((o) => o.qty > o.filled).length} total open orders`, color: 'aqua' },
                { text: 'View and cancel all orders', color: 'yellow' },
              ]}
              onClick={(button) => onMenuClick(0, button, 'open:bazaar_orders')}
            />
          </div>
        </div>

        <OrderBookSide
          title="Buy Orders"
          subtitle="Sell to these prices"
          side="buy"
          levels={padLevels(book?.buys ?? [], BOOK_DEPTH)}
          itemId={itemId}
          onMenuClick={onMenuClick}
        />

        <OrderBookSide
          title="Sell Orders"
          subtitle="Buy from these prices"
          side="sell"
          levels={padLevels(book?.sells ?? [], BOOK_DEPTH)}
          itemId={itemId}
          onMenuClick={onMenuClick}
        />
      </div>

      <div className="menu-hint">Click order book prices to place orders · Esc closes</div>
    </MenuOverlay>
  );
}

function padLevels(levels: OrderBookLevel[], depth: number): Array<OrderBookLevel | null> {
  return Array.from({ length: depth }, (_, index) => levels[index] ?? null);
}

function OrderBookSide({
  title,
  subtitle,
  side,
  levels,
  itemId,
  onMenuClick,
}: {
  title: string;
  subtitle: string;
  side: 'buy' | 'sell';
  levels: Array<OrderBookLevel | null>;
  itemId: ItemId;
  onMenuClick: (slot: number, button: ClickButton, action?: string) => void;
}) {
  const [open, setOpen] = useState(() => window.matchMedia('(min-width: 721px)').matches);
  return (
    <details
      className={`bazaar-book-side bazaar-book-${side}`}
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>{title}</summary>
      <div className="bazaar-book-heading">
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
      <div className="bazaar-book-grid">
        {levels.map((level, index) => {
          if (!level) {
            return (
              <div key={index} className="mc-slot empty bazaar-book-empty" aria-label="Empty order level" />
            );
          }
          const action = side === 'buy'
            ? `bazaarBuyAt:${itemId}@${level.price}`
            : `bazaarSellAt:${itemId}@${level.price}`;
          return (
            <IconSlotButton
              key={`${level.price}-${index}`}
              icon={side === 'buy' ? 'lime_dye' : 'red_dye'}
              name={`${formatBazaarPrice(level.price)} coins`}
              className={`bazaar-book-cell bazaar-book-${side}`}
              lore={[
                { text: side === 'buy' ? 'Buy Order' : 'Sell Order', color: side === 'buy' ? 'green' : 'red', bold: true },
                { text: `${level.qty.toLocaleString()} available`, color: 'white' },
                { text: `${level.orders} order${level.orders === 1 ? '' : 's'}`, color: 'gray' },
                { text: 'Click to create order @ price', color: 'yellow' },
              ]}
              onClick={(button) => onMenuClick(index, button, action)}
            />
          );
        })}
      </div>
    </details>
  );
}
