import { ITEMS, type ItemDef, type ItemRarity, type ItemType } from './items.js';
import { RECIPES, type Recipe } from './recipes.js';

function gear(
  id: string,
  name: string,
  rarity: ItemRarity,
  type: ItemType,
  options: Partial<ItemDef> = {},
): ItemDef {
  return {
    id,
    name,
    rarity,
    type,
    category: type === 'SWORD' || type === 'BOW' ? 'weapon' : ['HELMET', 'CHESTPLATE', 'LEGGINGS', 'BOOTS'].includes(type) ? 'tool' : 'material',
    stackSize: type === 'MATERIAL' || type === 'CONSUMABLE' ? 64 : 1,
    color: options.color ?? '#ffaa00',
    bazaarable: false,
    description: options.description ?? '',
    ...options,
  };
}

const witherImpact = {
  name: 'Wither Impact',
  description: 'Teleport ahead and implode nearby enemies, gaining a temporary shield.',
  manaCost: 150,
  damage: 10000,
  scaling: 0.3,
};

function addRecipe(recipe: Recipe): void {
  if (RECIPES.some((r) => r.id === recipe.id)) return;
  RECIPES.push(recipe);
}

export function registerDungeonGear(): void {
  const entries: ItemDef[] = [
    // Wither blades
    gear('valkyrie', 'Valkyrie', 'LEGENDARY', 'SWORD', {
      damage: 260, color: '#ff4444',
      stats: { strength: 200, critDamage: 50, ferocity: 5 },
      ability: witherImpact,
      description: 'A powerful wither blade favoring Strength.',
    }),
    gear('astrea', 'Astraea', 'LEGENDARY', 'SWORD', {
      damage: 260, color: '#44ff88',
      stats: { defense: 150, health: 200, intelligence: 150 },
      ability: witherImpact,
      description: 'A defensive wither blade that heals allies.',
    }),
    gear('scylla', 'Scylla', 'LEGENDARY', 'SWORD', {
      damage: 260, color: '#aa44ff',
      stats: { strength: 100, critDamage: 100, ferocity: 10 },
      ability: witherImpact,
      description: 'A wither blade focused on critical damage.',
    }),
    // Hyperion & Terminator already exist — ensure stats
    gear('hyperion', 'Hyperion', 'LEGENDARY', 'SWORD', {
      damage: 260, color: '#55ffff',
      stats: { strength: 150, intelligence: 350, ferocity: 30 },
      ability: witherImpact,
      description: 'The ultimate mage wither blade.',
    }),
    gear('terminator', 'Terminator', 'MYTHIC', 'BOW', {
      damage: 310, color: '#ffaa00',
      stats: { strength: 50, critDamage: 250, attackSpeed: 40 },
      ability: { name: 'Salvation', description: 'Shoot 3 arrows at once. Right-click to charge a powerful beam.' },
      description: 'A legendary bow from the Catacombs.',
    }),
    gear('dark_claymore', 'Dark Claymore', 'LEGENDARY', 'SWORD', {
      damage: 400, color: '#333333',
      stats: { strength: 250, critDamage: 30 },
      description: 'A massive claymore dropped by Necron.',
    }),
    gear('necron_blade', "Necron's Blade", 'LEGENDARY', 'SWORD', {
      damage: 200, color: '#888888',
      stats: { strength: 80, intelligence: 200 },
      description: 'Crafting component for wither blades.',
    }),
    gear('thorn_bow', 'Thorn Bow', 'LEGENDARY', 'BOW', {
      damage: 180, color: '#44aa44',
      stats: { strength: 40, critDamage: 80 },
      ability: { name: 'Bone Plating', description: 'Arrows deal bonus damage to undead.' },
    }),
    gear('last_breath', 'Last Breath', 'LEGENDARY', 'BOW', {
      damage: 200, color: '#884488',
      stats: { strength: 35, critDamage: 100 },
    }),
    gear('golem_sword', 'Golem Sword', 'EPIC', 'SWORD', {
      damage: 120, color: '#888888', stats: { strength: 60, defense: 50 },
    }),
    gear('balloon_snake', 'Balloon Snake', 'RARE', 'MATERIAL', { color: '#ff5555', description: 'Dropped by Bonzo.' }),
    gear('red_nose', 'Red Nose', 'RARE', 'MATERIAL', { color: '#ff0000', description: 'A clown nose from Bonzo.' }),
    gear('scarf_studies', 'Scarf Studies', 'RARE', 'MATERIAL', { color: '#ffcccc', description: 'Research notes from Scarf.' }),
    gear('spirit_wing', 'Spirit Wing', 'RARE', 'MATERIAL', { color: '#aaccff', description: 'A spectral wing fragment.' }),
    gear('golem_helmet', 'Golem Helmet', 'EPIC', 'HELMET', { stats: { health: 80, defense: 60, strength: 20 } }),
    gear('guardian_chestplate', 'Guardian Chestplate', 'EPIC', 'CHESTPLATE', { stats: { health: 120, defense: 90, strength: 20 } }),
    gear('spirit_boots', 'Spirit Boots', 'EPIC', 'BOOTS', { stats: { health: 50, defense: 40, speed: 10 } }),
    gear('adaptive_helmet', 'Adaptive Helmet', 'EPIC', 'HELMET', { stats: { health: 70, defense: 80, strength: 15 } }),
    gear('adaptive_chestplate', 'Adaptive Chestplate', 'EPIC', 'CHESTPLATE', { stats: { health: 120, defense: 120, strength: 15 } }),
    gear('adaptive_leggings', 'Adaptive Leggings', 'EPIC', 'LEGGINGS', { stats: { health: 100, defense: 100, strength: 15 } }),
    gear('adaptive_boots', 'Adaptive Boots', 'EPIC', 'BOOTS', { stats: { health: 60, defense: 70, strength: 15 } }),
    gear('wither_blood', 'Wither Blood', 'EPIC', 'MATERIAL', { color: '#440044', description: 'Used to craft wither blades.' }),
    gear('wither_catalyst', 'Wither Catalyst', 'EPIC', 'MATERIAL', { color: '#660066', description: 'Catalyst for wither blade forging.' }),
    gear('necron_handle', "Necron's Handle", 'LEGENDARY', 'MATERIAL', { color: '#aaaaaa', description: 'Handle of a wither blade.' }),
    gear('fuming_potato_book', 'Fuming Potato Book', 'LEGENDARY', 'MATERIAL', { color: '#ff8800', description: 'Upgrades hot potato books further.' }),
    gear('precursor_eye', 'Precursor Eye', 'LEGENDARY', 'MATERIAL', { color: '#00aaaa', description: 'An eye from Sadan\'s golem.' }),
    // Extra iconic weapons
    gear('aspect_of_the_void', 'Aspect of the Void', 'RARE', 'SWORD', {
      damage: 120, color: '#220044',
      stats: { strength: 80, intelligence: 50 },
      ability: { name: 'Instant Transmission', description: 'Teleport 8 blocks ahead.', manaCost: 50 },
    }),
    gear('spirit_bow', 'Spirit Bow', 'LEGENDARY', 'BOW', {
      damage: 200, stats: { strength: 40, critDamage: 120 },
    }),
    gear('juju_shortbow', 'Juju Shortbow', 'LEGENDARY', 'BOW', {
      damage: 310, stats: { strength: 40, critDamage: 110 },
      description: 'A shortbow that ignores mob defense.',
    }),
    gear('bone_reaver', 'Bone Reaver', 'LEGENDARY', 'SWORD', {
      damage: 280, stats: { strength: 120, critDamage: 40 },
    }),
    gear('soul_whip', 'Soul Whip', 'LEGENDARY', 'SWORD', {
      damage: 240, stats: { strength: 80, ferocity: 15 },
      ability: { name: 'Flail', description: 'Strike all enemies around you.', manaCost: 40 },
    }),
    gear('giant_cleaver', 'Giant Cleaver', 'LEGENDARY', 'SWORD', {
      damage: 350, stats: { strength: 180 },
    }),
    gear('skeleton_master_helmet', 'Skeleton Master Helmet', 'EPIC', 'HELMET', { stats: { health: 90, defense: 70 } }),
    gear('skeleton_master_chestplate', 'Skeleton Master Chestplate', 'EPIC', 'CHESTPLATE', { stats: { health: 150, defense: 110 } }),
    gear('skeleton_master_leggings', 'Skeleton Master Leggings', 'EPIC', 'LEGGINGS', { stats: { health: 120, defense: 90 } }),
    gear('skeleton_master_boots', 'Skeleton Master Boots', 'EPIC', 'BOOTS', { stats: { health: 70, defense: 60 } }),
    gear('goldor_helmet', "Goldor's Helmet", 'LEGENDARY', 'HELMET', { stats: { health: 140, defense: 200, strength: 20 } }),
    gear('goldor_chestplate', "Goldor's Chestplate", 'LEGENDARY', 'CHESTPLATE', { stats: { health: 260, defense: 280, strength: 20 } }),
    gear('goldor_leggings', "Goldor's Leggings", 'LEGENDARY', 'LEGGINGS', { stats: { health: 220, defense: 240, strength: 20 } }),
    gear('goldor_boots', "Goldor's Boots", 'LEGENDARY', 'BOOTS', { stats: { health: 120, defense: 160, strength: 20 } }),
    gear('maxor_helmet', "Maxor's Helmet", 'LEGENDARY', 'HELMET', { stats: { health: 140, defense: 80, speed: 30 } }),
    gear('maxor_chestplate', "Maxor's Chestplate", 'LEGENDARY', 'CHESTPLATE', { stats: { health: 260, defense: 120, speed: 30 } }),
    gear('maxor_leggings', "Maxor's Leggings", 'LEGENDARY', 'LEGGINGS', { stats: { health: 220, defense: 100, speed: 30 } }),
    gear('maxor_boots', "Maxor's Boots", 'LEGENDARY', 'BOOTS', { stats: { health: 120, defense: 60, speed: 30 } }),
  ];

  for (const item of entries) {
    ITEMS[item.id] = { ...ITEMS[item.id], ...item };
  }

  // Wither blade crafting (after F7 materials)
  addRecipe({
    id: 'craft_hyperion',
    name: 'Hyperion',
    result: { itemId: 'hyperion', qty: 1 },
    ingredients: [
      { itemId: 'wither_blood', qty: 24 },
      { itemId: 'wither_catalyst', qty: 1 },
      { itemId: 'necron_blade', qty: 1 },
      { itemId: 'necron_handle', qty: 1 },
    ],
    unlockCollection: 'wither_blood',
    unlockAmount: 1,
  });
  for (const [id, name] of [['valkyrie', 'Valkyrie'], ['astrea', 'Astraea'], ['scylla', 'Scylla']] as const) {
    addRecipe({
      id: `craft_${id}`,
      name,
      result: { itemId: id, qty: 1 },
      ingredients: [
        { itemId: 'wither_blood', qty: 24 },
        { itemId: 'wither_catalyst', qty: 1 },
        { itemId: 'necron_blade', qty: 1 },
        { itemId: 'necron_handle', qty: 1 },
      ],
      unlockCollection: 'wither_blood',
      unlockAmount: 1,
    });
  }
  addRecipe({
    id: 'craft_terminator',
    name: 'Terminator',
    result: { itemId: 'terminator', qty: 1 },
    ingredients: [
      { itemId: 'wither_blood', qty: 32 },
      { itemId: 'last_breath', qty: 1 },
      { itemId: 'thorn_bow', qty: 1 },
      { itemId: 'enchanted_diamond_block', qty: 8 },
    ],
    unlockCollection: 'wither_blood',
    unlockAmount: 1,
  });
  addRecipe({
    id: 'craft_necron_blade',
    name: "Necron's Blade",
    result: { itemId: 'necron_blade', qty: 1 },
    ingredients: [
      { itemId: 'necron_handle', qty: 1 },
      { itemId: 'wither_blood', qty: 8 },
      { itemId: 'enchanted_diamond_block', qty: 4 },
    ],
    unlockCollection: 'necron_handle',
    unlockAmount: 1,
  });
}

registerDungeonGear();
