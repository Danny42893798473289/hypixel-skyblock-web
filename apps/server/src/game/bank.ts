import type { BankState } from '@aether/shared';

export type BankTierId = BankState['tier'];

export interface BankTierDef {
  id: BankTierId;
  name: string;
  /** Maximum balance the account can hold. */
  cap: number;
  /** Base interest rate paid every interest period. */
  rate: number;
  /** Coins needed to upgrade from the previous tier. */
  upgradeCost: number;
}

export const BANK_TIERS: BankTierDef[] = [
  { id: 'starter', name: 'Starter Account', cap: 50_000_000, rate: 0.005, upgradeCost: 0 },
  { id: 'gold', name: 'Gold Account', cap: 100_000_000, rate: 0.0075, upgradeCost: 500_000 },
  { id: 'deluxe', name: 'Deluxe Account', cap: 250_000_000, rate: 0.01, upgradeCost: 5_000_000 },
];

export const INTEREST_PERIOD_MS = 6 * 60 * 60 * 1000;
/** Offline interest stops compounding after a week so nobody farms an idle fortune. */
const MAX_OFFLINE_PERIODS = 28;

export function bankTier(id: BankTierId): BankTierDef {
  return BANK_TIERS.find((tier) => tier.id === id) ?? BANK_TIERS[0];
}

export function nextBankTier(id: BankTierId): BankTierDef | null {
  const index = BANK_TIERS.findIndex((tier) => tier.id === id);
  return BANK_TIERS[index + 1] ?? null;
}

/** Diminishing returns on large balances, mirroring SkyBlock's interest brackets. */
export function interestForBalance(balance: number, rate: number): number {
  const first = Math.min(balance, 10_000_000);
  const second = Math.min(Math.max(balance - 10_000_000, 0), 90_000_000);
  const rest = Math.max(balance - 100_000_000, 0);
  return first * rate + second * rate * 0.25 + rest * rate * 0.05;
}

/** Pays out every whole period since the last payout, online or offline. */
export function accrueBankInterest(bank: BankState, now = Date.now()): { gained: number; periods: number } {
  if (!Number.isFinite(bank.lastInterestAt) || bank.lastInterestAt <= 0) bank.lastInterestAt = now;
  const elapsed = now - bank.lastInterestAt;
  if (elapsed < INTEREST_PERIOD_MS) return { gained: 0, periods: 0 };

  const available = Math.floor(elapsed / INTEREST_PERIOD_MS);
  const periods = Math.min(available, MAX_OFFLINE_PERIODS);
  const tier = bankTier(bank.tier);
  let gained = 0;
  for (let i = 0; i < periods; i++) {
    const payout = interestForBalance(bank.balance, tier.rate);
    if (payout <= 0) break;
    bank.balance = Math.min(tier.cap, bank.balance + payout);
    gained += payout;
  }
  bank.lastInterestAt += available * INTEREST_PERIOD_MS;
  bank.balance = Math.floor(bank.balance);
  return { gained: Math.floor(gained), periods };
}

export function msUntilNextInterest(bank: BankState, now = Date.now()): number {
  return Math.max(0, bank.lastInterestAt + INTEREST_PERIOD_MS - now);
}

export function depositLimit(bank: BankState): number {
  return Math.max(0, bankTier(bank.tier).cap - bank.balance);
}
