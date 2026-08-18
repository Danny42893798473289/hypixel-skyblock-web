import {
  BIOFUEL_ITEM,
  BIOFUEL_PER_ITEM,
  ITEMS,
  canForge,
  countItem,
  createDrillStack,
  drillFuelCap,
  drillFuelRemaining,
  forgeRecipeById,
  forgeUnlocked,
  installDrillPart,
  insertStack,
  isDrillItem,
  isDrillPart,
  playerGemstonePowder,
  removeItem,
  type Inventory,
  type ItemStack,
  type PlayerState,
} from '@aether/shared';

function cloneInv(inv: Inventory): Inventory {
  return inv.map((slot) => (slot ? { ...slot, drill: slot.drill ? { fuel: slot.drill.fuel, parts: { ...slot.drill.parts } } : undefined } : null));
}

function takeFirstStack(inv: Inventory, itemId: string): { inv: Inventory; taken: ItemStack } | null {
  const index = inv.findIndex((slot) => slot?.itemId === itemId);
  if (index < 0) return null;
  const next = cloneInv(inv);
  const taken = next[index]!;
  if (taken.qty > 1) {
    taken.qty -= 1;
    return {
      inv: next,
      taken: {
        ...taken,
        qty: 1,
        drill: taken.drill ? { fuel: taken.drill.fuel, parts: { ...taken.drill.parts } } : taken.drill,
      },
    };
  }
  next[index] = null;
  return { inv: next, taken };
}

export function executeForge(player: PlayerState, recipeId: string): string {
  const recipe = forgeRecipeById(recipeId);
  if (!recipe) throw new Error('Unknown forge recipe');
  if (!forgeUnlocked(recipe, player)) throw new Error('Recipe locked');
  if (playerGemstonePowder(player) < recipe.powderCost) {
    throw new Error(`Need ${recipe.powderCost.toLocaleString()} Gemstone Powder`);
  }
  if (!canForge(recipe, player)) throw new Error('Missing ingredients or powder');

  player.hotm ??= { tokens: 0, mithrilPowder: 0, gemstonePowder: 0, perks: {}, commissions: [] };
  const resultDef = ITEMS[recipe.result];
  const uniqueIngredient = recipe.ingredients.find((ing) => {
    const def = ITEMS[ing.itemId];
    return def?.type === 'DRILL' || (def?.stackSize === 1 && def?.toolType === 'pickaxe');
  });

  let inv = cloneInv(player.inventory);
  let inherited: ItemStack | null = null;
  if (uniqueIngredient) {
    const taken = takeFirstStack(inv, uniqueIngredient.itemId);
    if (!taken) throw new Error(`Need ${ITEMS[uniqueIngredient.itemId]?.name ?? uniqueIngredient.itemId}`);
    inv = taken.inv;
    inherited = taken.taken;
  }

  for (const ing of recipe.ingredients) {
    if (uniqueIngredient && ing.itemId === uniqueIngredient.itemId) continue;
    const next = removeItem(inv, ing.itemId, ing.qty);
    if (!next) throw new Error(`Need ${ing.qty} ${ITEMS[ing.itemId]?.name ?? ing.itemId}`);
    inv = next;
  }

  const forged = resultDef?.type === 'DRILL'
    ? createDrillStack(recipe.result, inherited)
    : inherited && resultDef?.stackSize === 1
      ? { ...inherited, itemId: recipe.result, qty: recipe.qty, uuid: inherited.uuid }
      : { itemId: recipe.result, qty: recipe.qty };

  const added = insertStack(inv, forged);
  if (!added) throw new Error('Inventory full');
  player.inventory = added;
  player.hotm.gemstonePowder -= recipe.powderCost;
  return `Forged ${resultDef?.name ?? recipe.name}`;
}

export function refuelDrill(player: PlayerState, inventoryIndex: number): string {
  const drill = player.inventory[inventoryIndex];
  if (!drill || !isDrillItem(drill.itemId)) throw new Error('Select a drill to refuel');
  const cap = drillFuelCap(drill);
  const fuel = drillFuelRemaining(drill);
  const needed = cap - fuel;
  if (needed <= 0) throw new Error('This drill is already full');
  const have = countItem(player.inventory, BIOFUEL_ITEM);
  if (have <= 0) throw new Error('Need Biofuel');
  const required = Math.ceil(needed / BIOFUEL_PER_ITEM);
  if (have < required) {
    throw new Error(`Need ${required} Biofuel to fully refuel (you have ${have})`);
  }
  const next = removeItem(player.inventory, BIOFUEL_ITEM, required);
  if (!next) throw new Error('Need Biofuel');
  player.inventory = next;
  const updated = player.inventory[inventoryIndex] ?? drill;
  updated.drill = { fuel: cap, parts: { ...(updated.drill?.parts ?? drill.drill?.parts ?? {}) } };
  player.inventory[inventoryIndex] = updated;
  return `Fully refueled ${ITEMS[drill.itemId]?.name ?? 'drill'} (${required} Biofuel)`;
}

export function refuelFirstDrill(player: PlayerState): string {
  const index = player.inventory.findIndex((stack) => stack && isDrillItem(stack.itemId) && drillFuelRemaining(stack) < drillFuelCap(stack));
  if (index < 0) throw new Error('No drill needs fuel');
  return refuelDrill(player, index);
}

export function installPartOnFirstDrill(player: PlayerState, partIndex: number): string {
  const part = player.inventory[partIndex];
  if (!part || !isDrillPart(part.itemId)) throw new Error('That is not a drill part');
  const drillIndex = player.inventory.findIndex((stack) => stack && isDrillItem(stack.itemId));
  if (drillIndex < 0) throw new Error('Need a drill in your inventory');
  const drill = player.inventory[drillIndex]!;
  const message = installDrillPart(drill, part.itemId);
  part.qty -= 1;
  if (part.qty <= 0) player.inventory[partIndex] = null;
  return message;
}

export function useDrillOrFuel(player: PlayerState, index: number): string {
  const stack = player.inventory[index];
  if (!stack) throw new Error('Empty slot');
  if (stack.itemId === BIOFUEL_ITEM) return refuelFirstDrill(player);
  if (isDrillPart(stack.itemId)) return installPartOnFirstDrill(player, index);
  if (isDrillItem(stack.itemId)) return refuelDrill(player, index);
  throw new Error('Open the Crystal Forge to use this');
}
