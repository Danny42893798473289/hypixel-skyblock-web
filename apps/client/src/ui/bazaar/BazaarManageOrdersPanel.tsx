import { useEffect } from 'react';
import {
  ITEMS,
  type BazaarOrder,
} from '@aether/shared';
import {
  ClickButton,
  MenuOverlay,
  formatBazaarPrice,
} from '../chest/slotUtils';
import { ItemIcon } from '../chest/ItemIcon';

interface Props {
  orders: BazaarOrder[];
  onMenuClick: (slot: number, button: ClickButton, action?: string) => void;
  onClose: () => void;
  onBack: () => void;
}

export function BazaarManageOrdersPanel({ orders, onMenuClick, onClose, onBack }: Props) {
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

  const open = orders.filter((order) => order.qty > order.filled);

  return (
    <MenuOverlay title="Manage Orders" onClose={onClose} onBack={onBack} className="bazaar-orders-window">
      <div className="bazaar-orders-summary">
        <strong>{open.length}</strong> open order{open.length === 1 ? '' : 's'} · Click to cancel · Coins/items refunded
      </div>
      {open.length === 0 ? (
        <div className="bazaar-orders-empty">No open orders. Create orders from a bazaar product page.</div>
      ) : (
        <div className="bazaar-orders-list">
          {open.map((order) => {
            const def = ITEMS[order.itemId];
            const remaining = order.qty - order.filled;
            const pct = Math.floor((order.filled / order.qty) * 100);
            return (
              <button
                key={order.id}
                type="button"
                className={`bazaar-order-row bazaar-order-${order.side}`}
                onClick={() => onMenuClick(0, 'left', `bazaarCancel:${order.id}`)}
              >
                <span className="bazaar-order-icon">
                  <ItemIcon icon={def?.sprite ?? 'material'} itemId={order.itemId} rarity={def?.rarity} />
                </span>
                <span className="bazaar-order-info">
                  <strong>{order.side === 'buy' ? 'Buy Order' : 'Sell Offer'} · {def?.name ?? order.itemId}</strong>
                  <span>{remaining.toLocaleString()}x @ {formatBazaarPrice(order.price)} coins</span>
                  <span className="bazaar-order-progress">{pct}% filled ({order.filled}/{order.qty})</span>
                </span>
                <span className="bazaar-order-cancel">Cancel</span>
              </button>
            );
          })}
        </div>
      )}
      <div className="menu-hint">Left click an order to cancel · Esc closes · Backspace goes back</div>
    </MenuOverlay>
  );
}
