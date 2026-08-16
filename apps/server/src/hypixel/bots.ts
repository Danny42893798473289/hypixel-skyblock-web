import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import {
  MARKET_BOT_USERNAME,
  AUCTION_MIRROR_USERNAME,
  MAX_HP,
  starterInventory,
  emptySkills,
  emptyCollections,
  DEFAULT_ZONE,
} from '@aether/shared';
import { addUser, findUserByUsername, saveUser, type StoredUser } from '../store/usersStore.js';

function ensureBot(username: string, coins: number): StoredUser {
  let bot = findUserByUsername(username);
  if (!bot) {
    const now = Date.now();
    bot = {
      id: uuid(),
      username,
      passwordHash: bcrypt.hashSync(uuid(), 8),
      createdAt: now,
      updatedAt: now,
      coins,
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
  return bot;
}

export function ensureMarketBot(): StoredUser {
  return ensureBot(MARKET_BOT_USERNAME, 1_000_000_000);
}

export function ensureAuctionMirror(): StoredUser {
  return ensureBot(AUCTION_MIRROR_USERNAME, 0);
}

export function isMarketBot(playerId: string): boolean {
  const bot = findUserByUsername(MARKET_BOT_USERNAME);
  return bot?.id === playerId;
}

export function isAuctionMirror(playerId: string): boolean {
  const bot = findUserByUsername(AUCTION_MIRROR_USERNAME);
  return bot?.id === playerId;
}

export function isEconomyBot(playerId: string): boolean {
  return isMarketBot(playerId) || isAuctionMirror(playerId);
}

export function resetMarketBotCoins(minCoins: number): void {
  const bot = ensureMarketBot();
  if (bot.coins < minCoins) {
    bot.coins = minCoins;
    saveUser(bot);
  }
}
