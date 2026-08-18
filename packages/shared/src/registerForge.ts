import { DRILL_PARTS } from './drill.js';
import { FORGE_GEMS } from './forge.js';
import { ITEMS, refreshBazaarItems, type ItemDef, type ItemRarity, type ItemType } from './items.js';

function item(
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
    category: type === 'DRILL' || type === 'PICKAXE' || ['HELMET', 'CHESTPLATE', 'LEGGINGS', 'BOOTS'].includes(type)
      ? 'tool'
      : type === 'CONSUMABLE' ? 'food' : 'material',
    stackSize: type === 'MATERIAL' || type === 'CONSUMABLE' ? 64 : 1,
    color: options.color ?? '#aaaaaa',
    bazaarable: options.bazaarable ?? (type === 'MATERIAL' || type === 'CONSUMABLE'),
    description: options.description ?? '',
    ...options,
  };
}

function add(def: ItemDef): void {
  ITEMS[def.id] = { ...ITEMS[def.id], ...def };
}

const PART_COLORS: Record<string, string> = {
  fuelTank: '#45c9b0',
  engine: '#cccccc',
  gemstoneFuelTank: '#d81b45',
  gemstoneChamber: '#aa55ff',
};

const PART_SPRITES: Record<string, string> = {
  fuelTank: 'ingot',
  engine: 'pickaxe',
  gemstoneFuelTank: 'gem',
  gemstoneChamber: 'gem',
};

export function registerForgeContent(): void {
  add(item('ruby_drill', 'Ruby Drill', 'RARE', 'DRILL', {
    color: '#d81b45', toolType: 'pickaxe', toolTier: 6, sprite: 'drill',
    stats: { miningSpeed: 400, miningFortune: 20 },
    description: 'A gemstone drill. Burns Biofuel while mining.',
    bazaarable: false,
  }));
  add(item('topaz_drill', 'Topaz Drill', 'RARE', 'DRILL', {
    color: '#ffcc00', toolType: 'pickaxe', toolTier: 7, sprite: 'drill',
    stats: { miningSpeed: 550, miningFortune: 25 },
    description: 'Upgraded Ruby Drill with a larger fuel tank.',
    bazaarable: false,
  }));
  add(item('jade_drill', 'Jade Drill', 'EPIC', 'DRILL', {
    color: '#2ec27e', toolType: 'pickaxe', toolTier: 8, sprite: 'drill',
    stats: { miningSpeed: 700, miningFortune: 30 },
    description: 'A swift Crystal Hollows drill.',
    bazaarable: false,
  }));
  add(item('amber_drill', 'Amber Drill', 'EPIC', 'DRILL', {
    color: '#ff8800', toolType: 'pickaxe', toolTier: 9, sprite: 'drill',
    stats: { miningSpeed: 900, miningFortune: 35 },
    description: 'Amber-cored drill with high mining speed.',
    bazaarable: false,
  }));
  add(item('sapphire_drill', 'Sapphire Drill', 'LEGENDARY', 'DRILL', {
    color: '#4488ff', toolType: 'pickaxe', toolTier: 10, sprite: 'drill',
    stats: { miningSpeed: 1200, miningFortune: 40 },
    description: 'A deep-blue drill from Precursor remnants.',
    bazaarable: false,
  }));
  add(item('amethyst_drill', 'Amethyst Drill', 'LEGENDARY', 'DRILL', {
    color: '#aa55ff', toolType: 'pickaxe', toolTier: 11, sprite: 'drill',
    stats: { miningSpeed: 1500, miningFortune: 45 },
    description: 'Near-endgame Crystal Hollows drill.',
    bazaarable: false,
  }));
  add(item("divans_drill", "Divan's Drill", 'MYTHIC', 'DRILL', {
    color: '#e8d48a', toolType: 'pickaxe', toolTier: 12, sprite: 'drill',
    stats: { miningSpeed: 1800, miningFortune: 55 },
    description: 'The ultimate Crystal Hollows drill, forged in the Nucleus.',
    bazaarable: false,
  }));

  for (const part of Object.values(DRILL_PARTS)) {
    add(item(part.itemId, part.name, part.tier >= 5 ? 'LEGENDARY' : part.tier >= 3 ? 'EPIC' : part.tier === 2 ? 'RARE' : 'UNCOMMON', 'MATERIAL', {
      color: PART_COLORS[part.slot],
      sprite: PART_SPRITES[part.slot],
      bazaarable: true,
      description: `Install on a drill (${part.slot.replace(/[A-Z]/g, (ch) => ` ${ch}`).trim()}, tier ${part.tier}).`,
    }));
  }

  for (const gem of FORGE_GEMS) {
    add(item(gem.flawless, `Flawless ${gem.name} Gemstone`, 'EPIC', 'MATERIAL', {
      color: gem.color,
      sprite: 'gem',
      bazaarable: true,
      description: `Compressed ${gem.name} for the Crystal Forge.`,
    }));
  }

  add(item('biofuel', 'Biofuel', 'RARE', 'CONSUMABLE', {
    color: '#55aa33',
    sprite: 'potion',
    bazaarable: true,
    description: 'Fully refuels a drill. Click the Biofuel, or use the Forge Refuel tab.',
  }));

  add(item('sorrow_helmet', 'Sorrow Helmet', 'LEGENDARY', 'HELMET', {
    color: '#554466', stats: { health: 70, defense: 90, miningSpeed: 50, miningFortune: 10 },
    description: 'Crystal Hollows mining helmet.',
  }));
  add(item('sorrow_chestplate', 'Sorrow Chestplate', 'LEGENDARY', 'CHESTPLATE', {
    color: '#554466', stats: { health: 120, defense: 150, miningSpeed: 50, miningFortune: 15 },
    description: 'Crystal Hollows mining chestplate.',
  }));
  add(item('sorrow_leggings', 'Sorrow Leggings', 'LEGENDARY', 'LEGGINGS', {
    color: '#554466', stats: { health: 100, defense: 130, miningSpeed: 50, miningFortune: 12 },
    description: 'Crystal Hollows mining leggings.',
  }));
  add(item('sorrow_boots', 'Sorrow Boots', 'LEGENDARY', 'BOOTS', {
    color: '#554466', stats: { health: 55, defense: 70, miningSpeed: 50, miningFortune: 8, speed: 5 },
    description: 'Crystal Hollows mining boots.',
  }));

  add(item('glacite_helmet', 'Glacite Helmet', 'EPIC', 'HELMET', {
    color: '#aaddff', stats: { health: 60, defense: 80, miningFortune: 12 },
    description: 'Frozen Dwarven mining helmet.',
  }));
  add(item('glacite_chestplate', 'Glacite Chestplate', 'EPIC', 'CHESTPLATE', {
    color: '#aaddff', stats: { health: 110, defense: 140, miningFortune: 18 },
    description: 'Frozen Dwarven mining chestplate.',
  }));
  add(item('glacite_leggings', 'Glacite Leggings', 'EPIC', 'LEGGINGS', {
    color: '#aaddff', stats: { health: 90, defense: 120, miningFortune: 15 },
    description: 'Frozen Dwarven mining leggings.',
  }));
  add(item('glacite_boots', 'Glacite Boots', 'EPIC', 'BOOTS', {
    color: '#aaddff', stats: { health: 50, defense: 60, miningFortune: 10 },
    description: 'Frozen Dwarven mining boots.',
  }));

  add(item('yog_helmet', 'Yog Helmet', 'EPIC', 'HELMET', {
    color: '#cc4422', stats: { health: 80, defense: 60, miningSpeed: 25, strength: 10 },
    description: 'Magma-forged Crystal Hollows helmet.',
  }));
  add(item('yog_chestplate', 'Yog Chestplate', 'EPIC', 'CHESTPLATE', {
    color: '#cc4422', stats: { health: 140, defense: 100, miningSpeed: 25, strength: 15 },
    description: 'Magma-forged Crystal Hollows chestplate.',
  }));
  add(item('yog_leggings', 'Yog Leggings', 'EPIC', 'LEGGINGS', {
    color: '#cc4422', stats: { health: 120, defense: 85, miningSpeed: 25, strength: 12 },
    description: 'Magma-forged Crystal Hollows leggings.',
  }));
  add(item('yog_boots', 'Yog Boots', 'EPIC', 'BOOTS', {
    color: '#cc4422', stats: { health: 65, defense: 50, miningSpeed: 25, strength: 8, speed: 8 },
    description: 'Magma-forged Crystal Hollows boots.',
  }));

  add(item('heat_helmet', 'Heat Helmet', 'EPIC', 'HELMET', {
    color: '#ff6622', stats: { health: 55, defense: 70, speed: 5, miningSpeed: 15 },
    description: 'Heat-resistant mining helmet.',
  }));
  add(item('heat_chestplate', 'Heat Chestplate', 'EPIC', 'CHESTPLATE', {
    color: '#ff6622', stats: { health: 100, defense: 120, speed: 5, miningSpeed: 15 },
    description: 'Heat-resistant mining chestplate.',
  }));
  add(item('heat_leggings', 'Heat Leggings', 'EPIC', 'LEGGINGS', {
    color: '#ff6622', stats: { health: 85, defense: 100, speed: 5, miningSpeed: 15 },
    description: 'Heat-resistant mining leggings.',
  }));
  add(item('heat_boots', 'Heat Boots', 'EPIC', 'BOOTS', {
    color: '#ff6622', stats: { health: 45, defense: 55, speed: 10, miningSpeed: 15 },
    description: 'Heat-resistant mining boots.',
  }));

  refreshBazaarItems();
}

registerForgeContent();
