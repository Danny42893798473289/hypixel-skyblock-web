/**
 * Checks that every recipe can be crafted and every item can be obtained
 * without the Bazaar or Auction House.
 *
 * Base sources: starter kit, zone gather/combat, NPC shops, mob/slayer/dungeon/
 * sea-creature drops, pet eggs, resource nodes, quest rewards.
 * Derived: crafting, alchemy brewing, minion production.
 *
 * Usage: npm run verify:obtainable
 *        npm run verify:obtainable -- --verbose
 */
import {
  ALCHEMY_RECIPES,
  COMMUNITY_OFFERS,
  DUNGEON_FLOORS,
  ESSENCE_SHOP,
  FORGE_RECIPES,
  ITEMS,
  MEDAL_SHOP,
  MINIONS,
  MOBS,
  PET_EGGS,
  RECIPES,
  RESOURCE_NODES,
  SEA_CREATURE_ZONES,
  SLAYER_DROPS,
  STARTER_WOODEN_TOOLS,
  ZONES,
} from '@aether/shared';

const verbose = process.argv.includes('--verbose');
const sources = new Map();

function note(itemId, reason) {
  if (!itemId) return;
  const list = sources.get(itemId);
  if (list) {
    if (!list.includes(reason)) list.push(reason);
    return;
  }
  sources.set(itemId, [reason]);
}

function knownItem(itemId) {
  return Boolean(ITEMS[itemId]);
}

for (const itemId of STARTER_WOODEN_TOOLS) note(itemId, 'starter kit');
note('bread', 'starter kit');
note('enchanted_cobble', 'starter quest reward');

for (const zone of Object.values(ZONES)) {
  for (const action of zone.actions ?? []) {
    const target = action.target;
    if (!target) continue;
    if (action.kind === 'combat') {
      const mob = MOBS[target];
      if (!mob) continue;
      for (const drop of mob.drops ?? []) note(drop.itemId, `combat ${mob.name} (${zone.id})`);
      continue;
    }
    note(target, `${action.kind} at ${zone.name}`);
  }
  for (const offer of zone.npc?.sells ?? []) {
    note(offer.itemId, `NPC ${zone.npc.name} (${zone.id})`);
  }
}

for (const mob of Object.values(MOBS)) {
  for (const drop of mob.drops ?? []) note(drop.itemId, `mob drop ${mob.name}`);
}

for (const [slayerId, drops] of Object.entries(SLAYER_DROPS)) {
  for (const drop of drops) note(drop.itemId, `slayer ${slayerId}`);
}

for (const floor of DUNGEON_FLOORS) {
  for (const drop of floor.drops ?? []) note(drop.itemId, `dungeon ${floor.id}`);
  for (const drop of floor.boss?.drops ?? []) note(drop.itemId, `dungeon boss ${floor.id}`);
}

for (const [spot, creatures] of Object.entries(SEA_CREATURE_ZONES)) {
  for (const creature of creatures) {
    for (const drop of creature.drops ?? []) note(drop.itemId, `sea creature ${creature.name} (${spot})`);
  }
}

for (const node of Object.values(RESOURCE_NODES)) {
  note(node.itemId, `resource node ${node.name}`);
}

for (const egg of PET_EGGS) {
  if (egg.fromMob && MOBS[egg.fromMob]) {
    note(egg.egg, `pet drop from ${egg.fromMob}`);
    note(egg.pet, `hatch ${egg.egg}`);
  }
}

for (const offer of COMMUNITY_OFFERS) {
  if (offer.itemId) note(offer.itemId, `community shop ${offer.id}`);
}
for (const offer of ESSENCE_SHOP) {
  if (offer.itemId) note(offer.itemId, `essence shop ${offer.id}`);
}
for (const offer of MEDAL_SHOP) {
  if (offer.itemId) note(offer.itemId, `medal shop ${offer.id}`);
}

const craftRecipes = [
  ...RECIPES.map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    result: recipe.result.itemId,
    ingredients: recipe.ingredients,
    unlockCollection: recipe.unlockCollection,
    kind: 'craft',
  })),
  ...ALCHEMY_RECIPES.map((recipe) => ({
    id: recipe.id,
    name: recipe.result,
    result: recipe.result,
    ingredients: recipe.ingredients,
    unlockCollection: undefined,
    kind: 'brew',
  })),
  ...FORGE_RECIPES.map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    result: recipe.result,
    ingredients: recipe.ingredients,
    unlockCollection: recipe.unlockCollection?.itemId,
    kind: 'forge',
  })),
];

let progressed = true;
while (progressed) {
  progressed = false;
  for (const recipe of craftRecipes) {
    if (sources.has(recipe.result)) continue;
    const ingredientsReady = recipe.ingredients.every((entry) => sources.has(entry.itemId));
    const unlockReady = !recipe.unlockCollection || sources.has(recipe.unlockCollection);
    if (ingredientsReady && unlockReady) {
      note(recipe.result, `${recipe.kind} ${recipe.id}`);
      progressed = true;
    }
  }
  for (const minion of Object.values(MINIONS)) {
    if (!sources.has(minion.itemId)) continue;
    if (sources.has(minion.produces)) continue;
    note(minion.produces, `minion ${minion.type}`);
    progressed = true;
  }
}

const recipeIds = new Set();
const recipeFailures = [];

for (const recipe of craftRecipes) {
  const issues = [];
  if (recipeIds.has(recipe.id)) issues.push('duplicate recipe id');
  recipeIds.add(recipe.id);

  if (!recipe.ingredients.length) issues.push('has no ingredients');
  if (!knownItem(recipe.result)) issues.push(`unknown result ${recipe.result}`);

  for (const ingredient of recipe.ingredients) {
    if (!knownItem(ingredient.itemId)) issues.push(`unknown ingredient ${ingredient.itemId}`);
    else if (!sources.has(ingredient.itemId)) issues.push(`ingredient ${ingredient.itemId} is not obtainable without Bazaar/AH`);
    if (!(ingredient.qty > 0)) issues.push(`ingredient ${ingredient.itemId} has qty ${ingredient.qty}`);
  }

  if (recipe.unlockCollection) {
    if (!knownItem(recipe.unlockCollection)) issues.push(`unknown unlock collection ${recipe.unlockCollection}`);
    else if (!sources.has(recipe.unlockCollection)) {
      issues.push(`unlock collection ${recipe.unlockCollection} is not obtainable without Bazaar/AH`);
    }
  }

  if (!sources.has(recipe.result) && !issues.length) {
    issues.push('result never becomes obtainable (cycle or blocked unlock)');
  }

  if (issues.length) recipeFailures.push({ recipe, issues });
}

const itemFailures = [];
for (const item of Object.values(ITEMS)) {
  if (sources.has(item.id)) continue;
  itemFailures.push(item);
}

function printList(title, rows, format) {
  console.log(`\n${title} (${rows.length})`);
  if (!rows.length) {
    console.log('  ok');
    return;
  }
  for (const row of rows) console.error(`  FAIL ${format(row)}`);
}

printList('Recipes not craftable without Bazaar/AH', recipeFailures, ({ recipe, issues }) => (
  `${recipe.kind} ${recipe.id} (${recipe.name}): ${issues.join('; ')}`
));

printList('Items not obtainable without Bazaar/AH', itemFailures, (item) => {
  const tag = item.bazaarable ? 'bazaar-listed' : 'unique';
  return `${item.id}  [${tag}]  ${item.name}`;
});

if (verbose) {
  console.log('\nObtain sources (no Bazaar/AH)');
  for (const item of Object.values(ITEMS)) {
    const why = sources.get(item.id);
    if (!why) continue;
    console.log(`  ${item.id}: ${why.join(' | ')}`);
  }
}

console.log('\n---');
console.log(`Recipes checked: ${craftRecipes.length}  (craft ${RECIPES.length}, brew ${ALCHEMY_RECIPES.length})`);
console.log(`Items checked:   ${Object.keys(ITEMS).length}`);
console.log(`Obtainable:      ${sources.size}`);
console.log(`Recipe failures: ${recipeFailures.length}`);
console.log(`Item failures:   ${itemFailures.length}`);

const failures = recipeFailures.length + itemFailures.length;
console.log(failures ? `\n${failures} problem(s) found.` : '\nAll recipes are craftable and all items are obtainable without Bazaar/AH.');
process.exit(failures ? 1 : 0);
