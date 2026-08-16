import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import {
  BAZAAR_ITEMS,
  MAX_HP,
  starterInventory,
  emptySkills,
  emptyCollections,
  DEFAULT_ZONE,
} from '@aether/shared';
import {
  addOrder,
  addUser,
  findUserByUsername,
  getOrders,
  saveUser,
  withPausedPersist,
  type StoredUser,
} from '../store/usersStore.js';

export function seedMarket(): void {
  let bot = findUserByUsername('MarketBot');
  if (!bot) {
    const now = Date.now();
    bot = {
      id: uuid(),
      username: 'MarketBot',
      passwordHash: bcrypt.hashSync(uuid(), 8),
      createdAt: now,
      updatedAt: now,
      coins: 1_000_000,
      zoneId: DEFAULT_ZONE,
      hp: MAX_HP,
      hotbarSlot: 0,
      inventory: starterInventory(),
      skills: emptySkills(),
      collections: emptyCollections(),
      minions: [],
    };
    addUser(bot);
  }

  if (getOrders().some((o) => o.playerId === bot.id)) return;

  withPausedPersist(() => {
  const prices: Partial<Record<string, number>> = {
    cobble: 1,
    coal: 4,
    iron_ore: 8,
    iron_ingot: 12,
    wheat: 2,
    bread: 6,
    oak_log: 2,
    oak_plank: 1,
    string: 3,
    rotten_flesh: 2,
    raw_fish: 3,
    cooked_fish: 7,
    stick: 1,
  };

  let buyEscrow = 0;
  for (const itemId of BAZAAR_ITEMS) {
    const base = prices[itemId] ?? 5;
    const sellPrice = Math.round(base * 1.2 * 10) / 10;
    const buyPrice = Math.round(base * 0.8 * 10) / 10;
    addOrder({
      id: uuid(),
      playerId: bot.id,
      itemId,
      side: 'sell',
      price: sellPrice,
      qty: 64,
      filled: 0,
      createdAt: Date.now(),
    });
    addOrder({
      id: uuid(),
      playerId: bot.id,
      itemId,
      side: 'buy',
      price: buyPrice,
      qty: 64,
      filled: 0,
      createdAt: Date.now(),
    });
    buyEscrow += buyPrice * 64;
  }
  bot.coins -= buyEscrow;
  saveUser(bot);
  });
}
