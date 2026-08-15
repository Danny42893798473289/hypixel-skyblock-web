#!/usr/bin/env node
/**
 * Bootstrap an admin test account: max skills, coins, bank, and iconic test items.
 * Usage: node scripts/adminBootstrap.mjs [username]
 * Default username: Danny
 *
 * Restart the game server after running if it is already online.
 */
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { SKILLS, totalXpForLevel, addItem, emptyInventory } from '../packages/shared/dist/index.js';
import { loadStore, findUserByUsername, saveUser, persist } from '../apps/server/dist/store/usersStore.js';

const username = (process.argv[2] ?? 'Danny').trim();
loadStore();
const user = findUserByUsername(username);
if (!user) {
  console.error(`User "${username}" not found. Register that account in-game first.`);
  process.exit(1);
}

const TEST_ITEMS = [
  ['hyperion', 1],
  ['terminator', 1],
  ['valkyrie', 1],
  ['astrea', 1],
  ['scylla', 1],
  ['livid_dagger', 1],
  ['bonzo_staff', 1],
  ['spirit_sceptre', 1],
  ['giant_sword', 1],
  ['aspect_of_the_void', 1],
  ['juju_shortbow', 1],
  ['necron_helmet', 1],
  ['necron_chestplate', 1],
  ['necron_leggings', 1],
  ['necron_boots', 1],
  ['storm_helmet', 1],
  ['storm_chestplate', 1],
  ['goldor_leggings', 1],
  ['maxor_boots', 1],
  ['shadow_assassin_chestplate', 1],
  ['adaptive_helmet', 1],
  ['wither_blood', 32],
  ['wither_catalyst', 8],
  ['necron_handle', 4],
  ['necron_blade', 1],
  ['enchanted_diamond', 64],
  ['enchanted_obsidian', 64],
  ['enchanted_gold_block', 16],
  ['minion_cobble', 1],
  ['minion_diamond', 1],
  ['minion_wheat', 1],
  ['minion_oak', 1],
  ['hot_potato_book', 8],
  ['fuming_potato_book', 4],
  ['recombobulator_3000', 2],
  ['bread', 64],
  ['diamond_pickaxe', 1],
  ['aspect_of_the_dragons', 1],
] ;

const maxedSkills = {};
for (const [id, skill] of Object.entries(SKILLS)) {
  maxedSkills[id] = totalXpForLevel(skill.maxLevel);
}

let inventory = emptyInventory();
for (const [itemId, qty] of TEST_ITEMS) {
  const next = addItem(inventory, itemId, qty);
  if (!next) {
    console.warn(`Could not fit ${qty}x ${itemId} — inventory full`);
    break;
  }
  inventory = next;
}

user.isAdmin = true;
user.coins = 999_999_999;
user.skills = maxedSkills;
user.inventory = inventory;
user.hp = 9999;
user.activeSlayer = null;
user.dungeonRun = null;
user.bank = {
  balance: 999_999_999,
  tier: 'deluxe',
  lastInterestAt: Date.now(),
};
user.equipment = user.equipment ?? {
  helmet: null,
  chestplate: null,
  leggings: null,
  boots: null,
  weapon: null,
};
user.updatedAt = Date.now();

saveUser(user);
persist(true);

console.log(`Admin bootstrap complete for "${user.username}" (${user.id})`);
console.log('- isAdmin: true');
console.log('- All skills maxed');
console.log('- 999,999,999 coins + bank balance');
console.log(`- ${TEST_ITEMS.length} test item stacks added`);
console.log('- Cleared active slayer / dungeon run');
console.log('\nRestart the server if it is running, then log in again.');
