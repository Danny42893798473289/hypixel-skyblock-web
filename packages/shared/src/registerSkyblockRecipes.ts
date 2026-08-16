import { ITEMS, type ItemId } from './items.js';
import { RECIPES, type Recipe } from './recipes.js';

function addRecipe(recipe: Recipe): void {
  if (RECIPES.some((r) => r.id === recipe.id)) return;
  RECIPES.push(recipe);
}

function craft(
  id: string,
  result: ItemId,
  ingredients: Array<{ itemId: ItemId; qty: number }>,
  unlock?: { collection: ItemId; amount: number },
): void {
  const def = ITEMS[result];
  if (!def) return;
  addRecipe({
    id,
    name: def.name,
    result: { itemId: result, qty: 1 },
    ingredients,
    unlockCollection: unlock?.collection,
    unlockAmount: unlock?.amount,
  });
}

function craftArmorSet(
  prefix: string,
  slots: Array<'helmet' | 'chestplate' | 'leggings' | 'boots'>,
  ingredients: Array<{ itemId: ItemId; qty: number }>,
  unlock?: { collection: ItemId; amount: number },
): void {
  for (const slot of slots) {
    craft(`craft_${prefix}_${slot}`, `${prefix}_${slot}` as ItemId, ingredients, unlock);
  }
}

/** Iconic Hypixel SkyBlock weapon, armor, tool, and accessory recipes. */
export function registerSkyblockRecipes(): void {
  // ── Component materials (dungeon / dragon intermediates) ──
  craft('craft_red_nose', 'red_nose', [
    { itemId: 'enchanted_redstone', qty: 4 },
    { itemId: 'enchanted_paper', qty: 2 },
  ], { collection: 'redstone', amount: 250 });
  craft('craft_balloon_snake', 'balloon_snake', [
    { itemId: 'red_nose', qty: 1 },
    { itemId: 'enchanted_redstone', qty: 8 },
  ], { collection: 'redstone', amount: 500 });
  craft('craft_wither_catalyst', 'wither_catalyst', [
    { itemId: 'wither_blood', qty: 32 },
    { itemId: 'enchanted_coal_block', qty: 1 },
  ], { collection: 'wither_blood', amount: 1 });
  craft('craft_necron_handle', 'necron_handle', [
    { itemId: 'necron_blade', qty: 1 },
    { itemId: 'wither_blood', qty: 4 },
  ], { collection: 'wither_blood', amount: 1 });

  // ── Early combat swords ──
  craft('craft_undead_sword', 'undead_sword', [
    { itemId: 'stick', qty: 1 },
    { itemId: 'rotten_flesh', qty: 32 },
  ], { collection: 'rotten_flesh', amount: 50 });
  craft('craft_revenant_falchion', 'revenant_falchion', [
    { itemId: 'rev_flesh', qty: 32 },
    { itemId: 'diamond_sword', qty: 1 },
  ], { collection: 'rev_flesh', amount: 1 });
  craft('craft_scorpion_foil', 'scorpion_foil', [
    { itemId: 'tarantula_web', qty: 32 },
    { itemId: 'stick', qty: 1 },
  ], { collection: 'tarantula_web', amount: 1 });
  craft('craft_edible_mace', 'edible_mace', [
    { itemId: 'wolf_tooth', qty: 24 },
    { itemId: 'mutton', qty: 16 },
  ], { collection: 'wolf_tooth', amount: 1 });
  craft('craft_voidedge_katana', 'voidedge_katana', [
    { itemId: 'null_sphere', qty: 16 },
    { itemId: 'enchanted_ender_pearl', qty: 8 },
    { itemId: 'stick', qty: 1 },
  ], { collection: 'null_sphere', amount: 1 });
  craft('craft_silver_fang', 'silver_fang', [
    { itemId: 'stick', qty: 1 },
    { itemId: 'enchanted_rotten_flesh', qty: 2 },
  ], { collection: 'rotten_flesh', amount: 500 });

  // ── Aspect line ──
  craft('craft_aspect_of_the_end', 'aspect_of_the_end', [
    { itemId: 'enchanted_eye_of_ender', qty: 1 },
    { itemId: 'enchanted_ender_pearl', qty: 16 },
    { itemId: 'diamond', qty: 4 },
    { itemId: 'stick', qty: 1 },
  ], { collection: 'ender_pearl', amount: 250 });
  craft('craft_aspect_of_the_void', 'aspect_of_the_void', [
    { itemId: 'aspect_of_the_end', qty: 1 },
    { itemId: 'wither_catalyst', qty: 1 },
    { itemId: 'enchanted_eye_of_ender', qty: 4 },
  ], { collection: 'ender_pearl', amount: 1000 });
  craft('craft_aspect_of_the_dragons', 'aspect_of_the_dragons', [
    { itemId: 'aspect_of_the_end', qty: 1 },
    { itemId: 'summoning_eye', qty: 1 },
    { itemId: 'dragon_fragment', qty: 8 },
    { itemId: 'enchanted_leather', qty: 2 },
  ], { collection: 'summoning_eye', amount: 1 });

  // ── Mid / late swords ──
  craft('craft_leaping_sword', 'leaping_sword', [
    { itemId: 'enchanted_iron', qty: 16 },
    { itemId: 'stick', qty: 1 },
  ], { collection: 'iron_ore', amount: 500 });
  craft('craft_flower_of_truth', 'flower_of_truth', [
    { itemId: 'enchanted_redstone', qty: 16 },
    { itemId: 'enchanted_gold_ingot', qty: 4 },
    { itemId: 'stick', qty: 1 },
  ], { collection: 'redstone', amount: 1000 });
  craft('craft_shadow_fury', 'shadow_fury', [
    { itemId: 'aspect_of_the_end', qty: 1 },
    { itemId: 'enchanted_ender_pearl', qty: 8 },
    { itemId: 'enchanted_diamond', qty: 4 },
  ], { collection: 'ender_pearl', amount: 5000 });
  craft('craft_giant_sword', 'giant_sword', [
    { itemId: 'enchanted_iron_block', qty: 1 },
    { itemId: 'enchanted_diamond', qty: 32 },
    { itemId: 'stick', qty: 1 },
  ], { collection: 'iron_ore', amount: 10000 });
  craft('craft_livid_dagger', 'livid_dagger', [
    { itemId: 'enchanted_fermented_spider_eye', qty: 4 },
    { itemId: 'enchanted_diamond', qty: 8 },
    { itemId: 'stick', qty: 1 },
  ], { collection: 'spider_eye', amount: 1000 });
  craft('craft_raiders_axe', 'raiders_axe', [
    { itemId: 'enchanted_emerald', qty: 8 },
    { itemId: 'stick', qty: 1 },
  ], { collection: 'emerald', amount: 500 });
  craft('craft_golem_sword', 'golem_sword', [
    { itemId: 'enchanted_cobble', qty: 32 },
    { itemId: 'enchanted_iron', qty: 8 },
    { itemId: 'stick', qty: 1 },
  ], { collection: 'cobble', amount: 2500 });
  craft('craft_dark_claymore', 'dark_claymore', [
    { itemId: 'wither_blood', qty: 16 },
    { itemId: 'enchanted_diamond_block', qty: 2 },
    { itemId: 'stick', qty: 1 },
  ], { collection: 'wither_blood', amount: 1 });
  craft('craft_bone_reaver', 'bone_reaver', [
    { itemId: 'enchanted_bone', qty: 8 },
    { itemId: 'wither_blood', qty: 8 },
    { itemId: 'necron_handle', qty: 1 },
  ], { collection: 'wither_blood', amount: 1 });
  craft('craft_soul_whip', 'soul_whip', [
    { itemId: 'enchanted_string', qty: 16 },
    { itemId: 'wither_blood', qty: 4 },
    { itemId: 'stick', qty: 1 },
  ], { collection: 'wither_blood', amount: 1 });
  craft('craft_giant_cleaver', 'giant_cleaver', [
    { itemId: 'giant_sword', qty: 1 },
    { itemId: 'wither_blood', qty: 8 },
    { itemId: 'enchanted_iron_block', qty: 1 },
  ], { collection: 'iron_ore', amount: 15000 });

  // ── Bows ──
  craft('craft_shortbow', 'shortbow', [
    { itemId: 'stick', qty: 3 },
    { itemId: 'string', qty: 3 },
  ], { collection: 'string', amount: 50 });
  craft('craft_runaans_bow', 'runaans_bow', [
    { itemId: 'shortbow', qty: 1 },
    { itemId: 'enchanted_string', qty: 3 },
    { itemId: 'enchanted_bone', qty: 3 },
  ], { collection: 'string', amount: 500 });
  craft('craft_thorn_bow', 'thorn_bow', [
    { itemId: 'shortbow', qty: 1 },
    { itemId: 'enchanted_bone', qty: 16 },
  ], { collection: 'bone', amount: 500 });
  craft('craft_last_breath', 'last_breath', [
    { itemId: 'shortbow', qty: 1 },
    { itemId: 'enchanted_fermented_spider_eye', qty: 4 },
    { itemId: 'enchanted_gunpowder', qty: 8 },
  ], { collection: 'gunpowder', amount: 1000 });
  craft('craft_spirit_bow', 'spirit_bow', [
    { itemId: 'thorn_bow', qty: 1 },
    { itemId: 'spirit_wing', qty: 4 },
    { itemId: 'enchanted_string', qty: 8 },
  ], { collection: 'wither_blood', amount: 1 });
  craft('craft_juju_shortbow', 'juju_shortbow', [
    { itemId: 'last_breath', qty: 1 },
    { itemId: 'enchanted_eye_of_ender', qty: 8 },
    { itemId: 'shortbow', qty: 1 },
  ], { collection: 'wither_blood', amount: 1 });

  // ── Mage weapons ──
  craft('craft_bonzo_staff', 'bonzo_staff', [
    { itemId: 'balloon_snake', qty: 1 },
    { itemId: 'enchanted_redstone', qty: 16 },
    { itemId: 'stick', qty: 1 },
  ], { collection: 'redstone', amount: 500 });
  craft('craft_spirit_sceptre', 'spirit_sceptre', [
    { itemId: 'spirit_wing', qty: 8 },
    { itemId: 'enchanted_eye_of_ender', qty: 4 },
    { itemId: 'enchanted_quartz', qty: 16 },
  ], { collection: 'wither_blood', amount: 1 });

  // ── Tools ──
  craft('craft_diamond_pickaxe', 'diamond_pickaxe', [
    { itemId: 'diamond', qty: 3 },
    { itemId: 'stick', qty: 2 },
  ], { collection: 'diamond', amount: 250 });
  craft('craft_treecapitator', 'treecapitator', [
    { itemId: 'jungle_axe', qty: 1 },
    { itemId: 'enchanted_oak', qty: 32 },
  ], { collection: 'oak_log', amount: 2500 });
  craft('craft_stonk', 'stonk', [
    { itemId: 'golden_pickaxe', qty: 1 },
    { itemId: 'enchanted_gold_ingot', qty: 8 },
  ], { collection: 'gold_ingot', amount: 1000 });
  craft('craft_mithril_pickaxe', 'mithril_pickaxe', [
    { itemId: 'diamond_pickaxe', qty: 1 },
    { itemId: 'mithril', qty: 64 },
    { itemId: 'enchanted_iron', qty: 8 },
  ], { collection: 'mithril', amount: 500 });
  craft('craft_melon_dicer', 'melon_dicer', [
    { itemId: 'golden_axe', qty: 1 },
    { itemId: 'enchanted_glistering_melon', qty: 4 },
  ], { collection: 'melon', amount: 1000 });
  craft('craft_mathematical_hoe', 'mathematical_hoe', [
    { itemId: 'enchanted_wheat', qty: 32 },
    { itemId: 'enchanted_carrot', qty: 32 },
    { itemId: 'stick', qty: 2 },
  ], { collection: 'wheat', amount: 5000 });
  craft('craft_rod_of_legends', 'rod_of_legends', [
    { itemId: 'fishing_rod', qty: 1 },
    { itemId: 'enchanted_raw_fish', qty: 16 },
    { itemId: 'enchanted_string', qty: 8 },
  ], { collection: 'raw_fish', amount: 2500 });
  craft('craft_gemstone_gauntlet', 'gemstone_gauntlet', [
    { itemId: 'mithril_pickaxe', qty: 1 },
    { itemId: 'enchanted_diamond', qty: 32 },
    { itemId: 'gemstone_ruby', qty: 64 },
    { itemId: 'gemstone_jade', qty: 64 },
  ], { collection: 'mithril', amount: 5000 });

  // ── Fishing armor ──
  craftArmorSet('angler', ['helmet', 'chestplate', 'leggings', 'boots'], [
    { itemId: 'raw_fish', qty: 32 },
  ], { collection: 'raw_fish', amount: 250 });

  // ── Dragon armor ──
  craftArmorSet('strong_dragon', ['helmet', 'chestplate', 'leggings', 'boots'], [
    { itemId: 'summoning_eye', qty: 1 },
    { itemId: 'dragon_fragment', qty: 5 },
    { itemId: 'enchanted_leather', qty: 4 },
  ], { collection: 'dragon_fragment', amount: 1 });

  // ── Dungeon floor armor ──
  craftArmorSet('adaptive', ['helmet', 'chestplate', 'leggings', 'boots'], [
    { itemId: 'scarf_studies', qty: 2 },
    { itemId: 'enchanted_diamond', qty: 8 },
  ], { collection: 'wither_blood', amount: 1 });
  craft('craft_golem_helmet', 'golem_helmet', [
    { itemId: 'enchanted_cobble', qty: 16 },
    { itemId: 'enchanted_iron', qty: 8 },
  ], { collection: 'cobble', amount: 5000 });
  craft('craft_guardian_chestplate', 'guardian_chestplate', [
    { itemId: 'enchanted_lapis', qty: 16 },
    { itemId: 'enchanted_diamond', qty: 4 },
  ], { collection: 'lapis', amount: 5000 });
  craft('craft_spirit_boots', 'spirit_boots', [
    { itemId: 'spirit_wing', qty: 4 },
    { itemId: 'enchanted_quartz', qty: 8 },
  ], { collection: 'wither_blood', amount: 1 });
  craftArmorSet('skeleton_master', ['helmet', 'chestplate', 'leggings', 'boots'], [
    { itemId: 'enchanted_bone', qty: 16 },
  ], { collection: 'bone', amount: 5000 });

  // ── F7 wither armor ──
  const witherArmorIngredients = [
    { itemId: 'wither_blood', qty: 8 },
    { itemId: 'necron_handle', qty: 1 },
    { itemId: 'enchanted_diamond_block', qty: 1 },
  ];
  craftArmorSet('necron', ['helmet', 'chestplate', 'leggings', 'boots'], witherArmorIngredients, {
    collection: 'wither_blood',
    amount: 1,
  });

  const stormIngredients = [
    { itemId: 'wither_blood', qty: 8 },
    { itemId: 'wither_catalyst', qty: 1 },
    { itemId: 'enchanted_lapis', qty: 16 },
  ];
  craftArmorSet('storm', ['helmet', 'chestplate', 'leggings', 'boots'], stormIngredients, {
    collection: 'wither_blood',
    amount: 1,
  });

  const goldorIngredients = [
    { itemId: 'wither_blood', qty: 12 },
    { itemId: 'enchanted_gold_block', qty: 1 },
  ];
  craftArmorSet('goldor', ['helmet', 'chestplate', 'leggings', 'boots'], goldorIngredients, {
    collection: 'wither_blood',
    amount: 1,
  });

  const maxorIngredients = [
    { itemId: 'wither_blood', qty: 12 },
    { itemId: 'enchanted_quartz', qty: 16 },
  ];
  craftArmorSet('maxor', ['helmet', 'chestplate', 'leggings', 'boots'], maxorIngredients, {
    collection: 'wither_blood',
    amount: 1,
  });

  // ── Shadow Assassin & Shark Scale ──
  craftArmorSet('shadow_assassin', ['helmet', 'chestplate', 'leggings', 'boots'], [
    { itemId: 'livid_dagger', qty: 1 },
    { itemId: 'enchanted_ender_pearl', qty: 16 },
    { itemId: 'enchanted_diamond', qty: 8 },
  ], { collection: 'wither_blood', amount: 1 });
  craftArmorSet('shark_scale', ['helmet', 'chestplate', 'leggings', 'boots'], [
    { itemId: 'enchanted_raw_fish', qty: 32 },
    { itemId: 'enchanted_diamond', qty: 4 },
  ], { collection: 'raw_fish', amount: 10000 });

  // ── Accessories ──
  craft('craft_zombie_talisman', 'zombie_talisman', [
    { itemId: 'rotten_flesh', qty: 64 },
  ], { collection: 'rotten_flesh', amount: 100 });
  craft('craft_feather_talisman', 'feather_talisman', [
    { itemId: 'speed_talisman', qty: 1 },
    { itemId: 'enchanted_sugar', qty: 4 },
  ], { collection: 'sugar_cane', amount: 500 });
  craft('craft_bat_talisman', 'bat_talisman', [
    { itemId: 'mushroom', qty: 64 },
    { itemId: 'speed_talisman', qty: 1 },
  ], { collection: 'mushroom', amount: 500 });
  craft('craft_intimidation_artifact', 'intimidation_artifact', [
    { itemId: 'intimidation_talisman', qty: 64 },
  ], { collection: 'cobble', amount: 5000 });
  craft('craft_ender_artifact', 'ender_artifact', [
    { itemId: 'enchanted_ender_pearl', qty: 32 },
    { itemId: 'ender_pearl', qty: 64 },
  ], { collection: 'ender_pearl', amount: 2000 });
  craft('craft_legendary_talisman', 'legendary_talisman', [
    { itemId: 'enchanted_gold_ingot', qty: 16 },
    { itemId: 'enchanted_emerald', qty: 8 },
  ], { collection: 'gold_ingot', amount: 5000 });
  craft('craft_personal_compactor', 'personal_compactor', [
    { itemId: 'compactor', qty: 1 },
    { itemId: 'enchanted_redstone_block', qty: 1 },
  ], { collection: 'redstone', amount: 5000 });

  // ── Vanilla / collection crafts so roots unlock the cascade ──
  craft('craft_hay_bale', 'hay_bale', [{ itemId: 'wheat', qty: 9 }], { collection: 'wheat', amount: 50 });
  craft('craft_sugar', 'sugar', [{ itemId: 'sugar_cane', qty: 1 }], { collection: 'sugar_cane', amount: 50 });
  craft('craft_cactus_green', 'cactus_green', [{ itemId: 'cactus', qty: 1 }], { collection: 'cactus', amount: 50 });
  craft('craft_melon_slice', 'melon_slice', [{ itemId: 'melon', qty: 1 }], { collection: 'melon', amount: 50 });
  craft('craft_pumpkin_seeds', 'pumpkin_seeds', [{ itemId: 'pumpkin', qty: 1 }], { collection: 'pumpkin', amount: 50 });
  craft('craft_melon_seeds', 'melon_seeds', [{ itemId: 'melon', qty: 1 }], { collection: 'melon', amount: 50 });
  craft('craft_cookie', 'cookie', [
    { itemId: 'wheat', qty: 2 },
    { itemId: 'cocoa_beans', qty: 1 },
  ], { collection: 'cocoa_beans', amount: 50 });
  craft('craft_golden_carrot', 'golden_carrot', [
    { itemId: 'carrot', qty: 1 },
    { itemId: 'gold_ingot', qty: 8 },
  ], { collection: 'carrot', amount: 100 });
  craft('craft_golden_apple', 'golden_apple', [
    { itemId: 'apple', qty: 1 },
    { itemId: 'gold_ingot', qty: 8 },
  ], { collection: 'apple', amount: 100 });
  craft('craft_enchanted_golden_apple', 'enchanted_golden_apple', [
    { itemId: 'golden_apple', qty: 8 },
    { itemId: 'enchanted_gold_ingot', qty: 1 },
  ], { collection: 'apple', amount: 1000 });
  craft('craft_flint', 'flint', [{ itemId: 'gravel', qty: 1 }], { collection: 'gravel', amount: 50 });
  craft('craft_clay', 'clay', [{ itemId: 'clay_ball', qty: 4 }], { collection: 'clay_ball', amount: 50 });
  craft('craft_glowstone', 'glowstone', [{ itemId: 'glowstone_dust', qty: 4 }], { collection: 'glowstone_dust', amount: 50 });
  craft('craft_quartz_block', 'quartz_block', [{ itemId: 'quartz', qty: 4 }], { collection: 'quartz', amount: 50 });
  craft('craft_nether_brick', 'nether_brick', [{ itemId: 'netherrack', qty: 4 }], { collection: 'netherrack', amount: 50 });
  craft('craft_magma_block', 'magma_block', [{ itemId: 'magma_cream', qty: 4 }], { collection: 'magma_cream', amount: 50 });
  craft('craft_slime_block', 'slime_block', [{ itemId: 'slimeball', qty: 9 }], { collection: 'slimeball', amount: 50 });
  craft('craft_packed_ice', 'packed_ice', [{ itemId: 'ice', qty: 9 }], { collection: 'ice', amount: 50 });
  craft('craft_ink_sac', 'ink_sac', [{ itemId: 'ink_sack', qty: 1 }]);
  craft('craft_salmon', 'salmon', [{ itemId: 'raw_salmon', qty: 1 }]);
  craft('craft_tropical_fish', 'tropical_fish', [{ itemId: 'clownfish', qty: 1 }]);
  craft('craft_mushroom_from_caps', 'mushroom', [
    { itemId: 'red_mushroom', qty: 1 },
    { itemId: 'brown_mushroom', qty: 1 },
  ]);
  craft('craft_crimson_planks', 'crimson_planks', [{ itemId: 'crimson_stem', qty: 1 }], { collection: 'crimson_stem', amount: 25 });
  craft('craft_warped_planks', 'warped_planks', [{ itemId: 'warped_stem', qty: 1 }], { collection: 'warped_stem', amount: 25 });
  craft('craft_stripped_oak_log', 'stripped_oak_log', [{ itemId: 'oak_log', qty: 1 }], { collection: 'oak_log', amount: 50 });
  craft('craft_stripped_spruce_log', 'stripped_spruce_log', [{ itemId: 'spruce_log', qty: 1 }], { collection: 'spruce_log', amount: 50 });
  craft('craft_stripped_birch_log', 'stripped_birch_log', [{ itemId: 'birch_log', qty: 1 }], { collection: 'birch_log', amount: 50 });
  craft('craft_stripped_jungle_log', 'stripped_jungle_log', [{ itemId: 'jungle_log', qty: 1 }], { collection: 'jungle_log', amount: 50 });
  craft('craft_stripped_acacia_log', 'stripped_acacia_log', [{ itemId: 'acacia_log', qty: 1 }], { collection: 'acacia_log', amount: 50 });
  craft('craft_stripped_dark_oak_log', 'stripped_dark_oak_log', [{ itemId: 'dark_oak_log', qty: 1 }], { collection: 'dark_oak_log', amount: 50 });
  craft('craft_diamond_spreading', 'diamond_spreading', [
    { itemId: 'enchanted_diamond', qty: 1 },
    { itemId: 'enchanted_gold_ingot', qty: 1 },
  ], { collection: 'diamond', amount: 1000 });
  craft('craft_super_egg', 'super_egg', [{ itemId: 'enchanted_egg', qty: 144 }], { collection: 'egg', amount: 1000 });
  craft('craft_enchanted_coal_fuel', 'enchanted_coal_fuel', [{ itemId: 'enchanted_coal', qty: 1 }], { collection: 'coal', amount: 100 });
}

registerSkyblockRecipes();
