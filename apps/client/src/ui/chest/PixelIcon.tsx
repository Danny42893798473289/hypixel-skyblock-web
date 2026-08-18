import { useEffect, useRef } from 'react';
import { ITEMS, type ItemId } from '@aether/shared';

interface Props {
  icon: string;
  itemId?: string;
  rarity?: string;
}

type Pattern = string[];

/**
 * Palette letters: a = light, b = base, c = dark, d = highlight, e = accent.
 * Shapes stay generic; colour is what tells two ores or two swords apart.
 */
const PATTERNS: Record<string, Pattern> = {
  sword: ['........', '......ad', '.....aa.', '....ab..', '...ab...', '..ab....', '.ecb....', '..ec....'],
  bow: ['...ab...', '..a..b..', '.a....b.', '.a....de', '.a....b.', '..a..b..', '...ab...'],
  pickaxe: ['.abbba..', 'aacccaad', '...ee...', '...ee...', '...ee...', '..eee...', '..ee....'],
  drill: ['..aabb..', '.acccb..', '.acccb..', '..addb..', '...dd...', '...dd...', '..ddd...'],
  axe: ['..aabb..', '.aaabb..', '.aacca..', '...ee...', '...ee...', '...ee...', '..eee...'],
  hoe: ['.abba...', '...ba...', '...ee...', '...ee...', '...ee...', '..eee...'],
  rod: ['....ab..', '...ab...', '..ab....', '.ab.e...', '.a..e...', '....e...', '....edd.'],
  helmet: ['..abba..', '.abbbba.', 'abccccba', 'ab.dd.ba', 'ac....ca'],
  chestplate: ['ab....ba', 'abbbbbba', '.abccba.', '.abccba.', '.abccba.', '.ac..ca.'],
  leggings: ['.abbbba.', '.abccba.', '.ab..ba.', '.ab..ba.', '.ac..ca.'],
  boots: ['.ab..ba.', '.ab..ba.', 'abc..cba', 'ccc..ccc'],
  talisman: ['...ab...', '..abba..', '.abddba.', 'abdaadba', '.abddba.', '..abba..', '...ab...'],
  pet: ['..abba..', '.abddba.', 'abdaadba', 'abddddba', '.ab..ba.', '..acca..'],
  minion: ['.abbbba.', 'abccccba', 'abdaadba', 'abccccba', 'abdaadba', '.acccca.', '..c..c..'],

  ore: ['cccccccc', 'cbbcccbc', 'cccbbbcc', 'ccbccccc', 'ccccbbcc', 'cbbcccbc', 'cccccccc'],
  gem: ['..abba..', '.abddba.', 'abdaadba', 'abdaadba', 'abddddba', '.abbbba.', '..acca..'],
  ingot: ['........', '..aaaa..', '.abbbba.', 'abbbbbba', 'acccccca', '..cccc..'],
  dust: ['........', '...ab...', '..abba..', '.abdaba.', '..abba..', '...ac...'],
  block: ['aaaaaaaa', 'abbbbbba', 'abdddbba', 'abdddbba', 'abbbbbba', 'acccccca', 'cccccccc'],
  log: ['aaaaaaaa', 'abbbbbba', 'abdccdba', 'abcddcba', 'abdccdba', 'abbbbbba', 'cccccccc'],
  plank: ['aaaaaaaa', 'bbbbbbbb', 'aaaaaaaa', 'bbbbbbbb', 'cccccccc'],
  stick: ['.....ab.', '....ab..', '...ab...', '..ab....', '.ab.....', 'ac......'],

  crop: ['...a....', '.a.b.a..', '..abb...', '...c....', '..ddd...', '..ddd...'],
  root: ['..abba..', '.abddba.', '..abba..', '...cc...', '..e.e...', '.e...e..'],
  gourd: ['..cccc..', '.abbbba.', 'abdbbdba', 'abbbbbba', 'abdbbdba', '.acccca.'],
  stalk: ['...ab...', '...ab...', '..aab...', '...ab...', '...ab...', '...ac...'],
  mushroom: ['..abba..', '.abddba.', 'abbbbbba', '...dd...', '...dd...', '..ddd...'],
  fish: ['........', '..abb...', '.abddba.', 'abddddbe', '.abddba.', '..abb...'],
  food: ['..abba..', '.abddba.', 'abddddba', 'abddddba', '.abbbba.', '..acca..'],
  bone: ['.a.....a', 'aba...aba', '.abbbbba', 'aba...aba'],
  string: ['a.......', '.ab.....', '..abb...', '....abb.', '......ab', '.......a'],
  pearl: ['..abba..', '.abddba.', 'abdaadba', 'abdaadba', '.abddba.', '..abba..'],
  potion: ['...ab...', '...ab...', '..abba..', '.abddba.', '.abddba.', '..abba..'],

  coin: ['..abba..', '.abddba.', 'abd..dba', 'abd..dba', '.abddba.', '..abba..'],
  // Coin amounts: one coin, a short stack, a tall stack, half a coin, a full pouch.
  coins: ['........', '..aaaa..', '.abbbba.', '..aaaa..', '.abbbba.', '..cccc..'],
  coin_pile: ['..aaaa..', '.abbbba.', '..aaaa..', '.abbbba.', '..aaaa..', '.abbbba.', '..cccc..'],
  coin_half: ['..abba..', '.abdcca.', 'abddccca', 'abddccca', '.abdcca.', '..abba..'],
  coin_bag: ['...aa...', '..a..a..', '.abbbba.', 'abddddba', 'abddddba', '.abbbba.', '..cccc..'],
  book: ['.aaaaaa.', 'abbbbbca', 'abddddca', 'abbbbbca', 'abddddca', 'abbbbbca', '.aaaaaa.'],
  paper: ['.aaaaaa.', 'abbbbbba', 'abcbcbba', 'abbbbbba', 'abcbcbba', 'abbbbbba', '.aaaaaa.'],
  map: ['.aaaaaa.', 'abbbbbba', 'abdccdba', 'abcddcba', 'abdccdba', 'abbbbbba', '.aaaaaa.'],
  chest: ['.aaaaaa.', 'abbbbbba', 'acccccca', 'abbddbba', 'abbddbba', 'acccccca'],
  crafting_table: ['aaaaaaaa', 'abbbbbba', 'ab.bb.ba', 'abbbbbba', 'ac.cc.ca', 'acccccca'],
  anvil: ['.cccccc.', '.abbbba.', '..cbbc..', '...bb...', '..cbbc..', '.cccccc.'],
  crystal_forge: ['.cdaadc.', 'cbddddbc', 'cbdaadbc', 'cbdaadbc', 'cbddddbc', '.cdaadc.'],
  enchanting_table: ['..dddd..', '.abbbba.', 'abddddba', 'abbbbbba', 'acccccca', 'cccccccc'],
  bank_vault: ['cccccccc', 'cabbbbac', 'cab.dbac', 'cabd.bac', 'cabbbbac', 'cccccccc'],
  warp_gate: ['.cc..cc.', 'cbddddbc', 'cbdaadbc', 'cbdaadbc', 'cbddddbc', '.cc..cc.'],
  dungeon_portal: ['.cccccc.', 'cbdddbc.', 'cbdaadbc', 'cbdaadbc', 'cbdddbc.', '.cccccc.'],
  slayer_altar: ['..cccc..', '.abbbba.', 'abd..dba', 'abbbbbba', '.acccca.', '..cccc..'],
  compass: ['..abba..', '.ab..ba.', 'ab.dd.ba', 'ab.dd.ba', '.ab..ba.', '..abba..'],
  clock: ['..abba..', '.abddba.', 'abd.ddba', 'abdd.dba', '.abddba.', '..abba..'],
  leaderboard: ['........', '.....aa.', '..aa.bb.', '..bb.bb.', 'aabb.bb.', 'bbbbbbbb'],
  painting: ['aaaaaaaa', 'abbbbbba', 'abdccdba', 'abcddcba', 'abdccdba', 'abbbbbba', 'aaaaaaaa'],
  stat: ['...aa...', '..abba..', '.abddba.', 'abddddba', '.abddba.', '..abba..', '...aa...'],
  nether_star: ['...a....', '.a.a.a..', '..aba...', 'aaabaaa.', '..aba...', '.a.a.a..', '...a....'],
  barrier: ['aa....aa', 'aaa..aaa', '.aa..aa.', '...aa...', '.aa..aa.', 'aaa..aaa', 'aa....aa'],
  arrow: ['...a....', '..aa....', '.aaaaaa.', 'aaaaaaaa', '.aaaaaa.', '..aa....', '...a....'],
  arrow_left: ['...a....', '..aa....', '.aaaaaa.', 'aaaaaaaa', '.aaaaaa.', '..aa....', '...a....'],
  arrow_right: ['....a...', '....aa..', '.aaaaaa.', 'aaaaaaaa', '.aaaaaa.', '....aa..', '....a...'],
  sign: ['aaaaaaaa', 'abbbbbba', 'ab.cc.ba', 'abbbbbba', 'ab.cc.ba', 'acccccca', '...cc...'],
  dye: ['..abba..', '.abddba.', 'abddddba', 'abddddba', '.abbbba.', '..acca..'],
  villager: ['.aaaaaa.', 'abbbbbba', 'abc..cba', 'abbbbbba', 'abddddba', 'abbbbbba', '.aaaaaa.'],
  player_head: ['.aaaaaa.', 'abbbbbba', 'abc..cba', 'abbbbbba', 'abddddba', 'abbbbbba', '.aaaaaa.'],
  zombie_head: ['.aaaaaa.', 'abbbbbba', 'abcbbcba', 'abbbbbba', 'abddddba', 'abcbbcba', '.aaaaaa.'],
  wither_skull: ['.aaaaaa.', 'abbbbbba', 'abcbbcba', 'abbbbbba', 'abcddcba', 'abbbbbba', '.aaaaaa.'],
  tree: ['...aa...', '..abba..', '.abbbba.', 'abbbbbba', '.abbbba.', '...cc...', '...cc...'],
  material: ['..abba..', '.abbbba.', 'abddddba', 'abddddba', 'abddddba', '.abbbba.', '..acca..'],
};

/** Skills, dungeon classes and island tiles reuse existing shapes. */
const ICON_ALIASES: Record<string, string> = {
  diamond_sword: 'sword',
  diamond_pickaxe: 'pickaxe',
  iron_pickaxe: 'pickaxe',
  undead_sword: 'sword',
  angler_chestplate: 'chestplate',
  minion_cobble: 'minion',
  enchanted_diamond: 'gem',
  oak_plank: 'plank',
  bread: 'food',
  emerald: 'gem',
  gold_ingot: 'ingot',
  hopper: 'chest',
  gray_stained_glass_pane: 'barrier',
  cyan_stained_glass_pane: 'barrier',
  gold_nugget: 'coin',
  red_dye: 'dye',
  deposit_100: 'coin',
  deposit_1000: 'coins',
  deposit_10000: 'coin_pile',
  deposit_half: 'coin_half',
  deposit_all: 'coin_bag',
  withdraw_100: 'coin',
  withdraw_1000: 'coins',
  withdraw_10000: 'coin_pile',
  withdraw_half: 'coin_half',
  withdraw_all: 'coin_bag',
  crop_wheat: 'crop',
  crop_carrot: 'root',
  crop_potato: 'root',
  crop_melon: 'gourd',
  crop_pumpkin: 'gourd',
  crop_cactus: 'stalk',
  crop_cane: 'stalk',
  crop_cocoa: 'crop',
  crop_mushroom: 'mushroom',
  ore_stone: 'ore',
  ore_coal: 'ore',
  ore_iron: 'ore',
  ore_gold: 'ore',
  ore_lapis: 'ore',
  ore_redstone: 'ore',
  ore_diamond: 'ore',
  ore_emerald: 'ore',
  ore_mithril: 'ore',
  ore_cobble: 'ore',
  ore_titanium: 'ore',
  ore_glacite: 'ore',
  ore_ruby: 'ore',
  tree_oak: 'tree',
  tree_jungle: 'tree',
  fishing_spot: 'fish',
  mob_zombie: 'zombie_head',
  farming: 'crop',
  mining: 'pickaxe',
  combat: 'sword',
  foraging: 'axe',
  fishing: 'rod',
  enchanting: 'book',
  alchemy: 'potion',
  taming: 'pet',
  carpentry: 'crafting_table',
  runecrafting: 'nether_star',
  social: 'player_head',
  dungeoneering: 'wither_skull',
  berserk: 'sword',
  archer: 'bow',
  mage: 'book',
  tank: 'chestplate',
  healer: 'potion',
  crystal: 'gem',
  crystal_forge: 'crystal_forge',
  drill: 'drill',
};

const NAMED_COLORS: Record<string, string> = {
  gold: '#ffcc22',
  coin: '#ffcc22',
  gold_block: '#ffcc22',
  bank_vault: '#f2c14a',
  warp_gate: '#a45cff',
  dungeon_portal: '#38e0a0',
  slayer_altar: '#c9d1d8',
  enchanting_table: '#8f5cd8',
  anvil: '#8d959c',
  crystal_forge: '#d45cff',
  drill: '#d81b45',
  barrier: '#ff4d4d',
  arrow: '#e8e8e8',
  arrow_left: '#e8e8e8',
  arrow_right: '#e8e8e8',
  lime_dye: '#5cd94a',
  red_dye: '#e04a4a',
  // Green coins go into the bank, red coins come out of it.
  deposit_100: '#5cd94a',
  deposit_1000: '#5cd94a',
  deposit_10000: '#5cd94a',
  deposit_half: '#5cd94a',
  deposit_all: '#5cd94a',
  withdraw_100: '#e04a4a',
  withdraw_1000: '#e04a4a',
  withdraw_10000: '#e04a4a',
  withdraw_half: '#e04a4a',
  withdraw_all: '#e04a4a',
  paper: '#f2f2f2',
  book: '#c33a2f',
  map: '#d8c9a0',
  chest: '#a2703f',
  crafting_table: '#a2703f',
  sign: '#a8763f',
  villager: '#8a5a3a',
  player_head: '#efb38a',
  zombie_head: '#4a9e57',
  wither_skull: '#3b3b3b',
  nether_star: '#fff7c2',
  leaderboard: '#ffd24a',
  clock: '#dfe4f2',
  compass: '#e0e6ea',
  stat: '#9ad8ff',
  painting: '#c8a06a',
  gray_stained_glass_pane: '#6a6a6a',
  cyan_stained_glass_pane: '#3ec6c9',
  fishing_spot: '#4aa8e0',
  tree: '#3d913e',
  tree_oak: '#3d913e',
  tree_jungle: '#2f7a30',
  ore_coal: '#2b2f33',
  ore_iron: '#d3a074',
  ore_gold: '#ffcc22',
  ore_lapis: '#2f57d8',
  ore_redstone: '#d82b2b',
  ore_diamond: '#38e0e0',
  ore_emerald: '#17c246',
  ore_mithril: '#6fd7d0',
  ore_cobble: '#8a8a8a',
  ore_titanium: '#d8dce4',
  ore_glacite: '#7ec8ff',
  ore_stone: '#8a9095',
  crop_wheat: '#e5c640',
  crop_carrot: '#ef8022',
  crop_potato: '#c99c56',
  crop_melon: '#4fbf3a',
  crop_pumpkin: '#e2801d',
  crop_cactus: '#3d9d55',
  crop_cane: '#a8d060',
  crop_cocoa: '#8a4b23',
  crop_mushroom: '#c33a2f',
  mob_zombie: '#4a9e57',
};

const RARITY_TINT: Record<string, string> = {
  COMMON: '#ffffff',
  UNCOMMON: '#55ff55',
  RARE: '#5555ff',
  EPIC: '#aa00aa',
  LEGENDARY: '#ffaa00',
  MYTHIC: '#ff55ff',
};

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const mix = (channel: number) => {
    const target = amount > 0 ? 255 : 0;
    const value = Math.round(channel + (target - channel) * Math.abs(amount));
    return Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0');
  };
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}

function hueColor(seed: number): string {
  const hue = seed % 360;
  const saturation = 55 + (seed % 25);
  const lightness = 45 + ((seed >>> 8) % 15);
  return hslToHex(hue, saturation, lightness);
}

function hslToHex(h: number, s: number, l: number): string {
  const saturation = s / 100;
  const lightness = l / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const secondary = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const match = lightness - chroma / 2;
  const [r, g, b] = h < 60 ? [chroma, secondary, 0]
    : h < 120 ? [secondary, chroma, 0]
    : h < 180 ? [0, chroma, secondary]
    : h < 240 ? [0, secondary, chroma]
    : h < 300 ? [secondary, 0, chroma]
    : [chroma, 0, secondary];
  const channel = (value: number) => Math.round((value + match) * 255).toString(16).padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

function baseColorFor(icon: string, itemId?: string, rarity?: string): string {
  const def = itemId ? ITEMS[itemId as ItemId] : undefined;
  if (def && def.color && def.color !== '#aaaaaa') return def.color;
  if (NAMED_COLORS[icon]) return NAMED_COLORS[icon];
  if (itemId) return hueColor(hashString(itemId));
  if (rarity && RARITY_TINT[rarity]) return RARITY_TINT[rarity];
  return hueColor(hashString(icon));
}

function shapeFor(icon: string, itemId?: string): Pattern {
  // 'material' is the catch-all sprite; prefer the item's own shape when we know it.
  const generic = icon === 'material' || icon === '';
  if (!generic && PATTERNS[icon]) return PATTERNS[icon];
  if (ICON_ALIASES[icon] && PATTERNS[ICON_ALIASES[icon]]) return PATTERNS[ICON_ALIASES[icon]];
  const def = itemId ? ITEMS[itemId as ItemId] : undefined;
  const id = itemId ?? '';
  if (def?.type === 'SWORD') return PATTERNS.sword;
  if (def?.type === 'BOW') return PATTERNS.bow;
  if (def?.type === 'PICKAXE') return PATTERNS.pickaxe;
  if (def?.type === 'DRILL') return PATTERNS.drill;
  if (def?.type === 'AXE') return PATTERNS.axe;
  if (def?.type === 'HOE') return PATTERNS.hoe;
  if (def?.type === 'FISHING_ROD') return PATTERNS.rod;
  if (def?.type === 'HELMET') return PATTERNS.helmet;
  if (def?.type === 'CHESTPLATE') return PATTERNS.chestplate;
  if (def?.type === 'LEGGINGS') return PATTERNS.leggings;
  if (def?.type === 'BOOTS') return PATTERNS.boots;
  if (def?.type === 'ACCESSORY') return PATTERNS.talisman;
  if (def?.type === 'PET') return PATTERNS.pet;
  if (def?.type === 'MINION') return PATTERNS.minion;
  if (id.includes('fuel_tank') || id.includes('drill_engine')) return PATTERNS.ingot;
  if (id.includes('gemstone_chamber') || id.startsWith('flawless_')) return PATTERNS.gem;
  if (id === 'biofuel') return PATTERNS.potion;
  if (id.includes('block') || id.startsWith('enchanted_')) return PATTERNS.block;
  if (id.includes('plank')) return PATTERNS.plank;
  if (id.includes('stick')) return PATTERNS.stick;
  if (id.includes('log')) return PATTERNS.log;
  if (id === 'cobble' || id.includes('ore') || id === 'coal') return PATTERNS.ore;
  if (id === 'diamond' || id === 'emerald' || id.includes('gemstone') || id === 'mithril') return PATTERNS.gem;
  if (id.includes('ingot')) return PATTERNS.ingot;
  if (id === 'redstone' || id === 'lapis' || id === 'sugar' || id.includes('dust')) return PATTERNS.dust;
  if (id === 'carrot' || id === 'potato') return PATTERNS.root;
  if (id === 'melon' || id === 'pumpkin') return PATTERNS.gourd;
  if (id === 'cactus' || id === 'sugar_cane') return PATTERNS.stalk;
  if (id === 'mushroom') return PATTERNS.mushroom;
  if (id === 'wheat' || id.includes('cocoa') || id.includes('seed')) return PATTERNS.crop;
  if (id.includes('fish')) return PATTERNS.fish;
  if (id === 'bone') return PATTERNS.bone;
  if (id === 'string' || id === 'web') return PATTERNS.string;
  if (id.includes('pearl') || id.includes('eye')) return PATTERNS.pearl;
  if (def?.type === 'CONSUMABLE' || def?.heal) return PATTERNS.food;
  return PATTERNS.material;
}

export function PixelIcon({ icon, itemId, rarity }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 16, 16);
    ctx.imageSmoothingEnabled = false;

    const pattern = shapeFor(icon, itemId);
    const base = baseColorFor(icon, itemId, rarity);
    const palette = [shade(base, 0.35), base, shade(base, -0.45), shade(base, 0.65), shade(base, -0.2)];
    const scale = 2;
    pattern.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        if (cell === '.') return;
        const index = cell.charCodeAt(0) - 97;
        ctx.fillStyle = palette[index] ?? palette[1];
        ctx.fillRect(x * scale, y * scale, scale, scale);
      });
    });
  }, [icon, itemId, rarity]);

  return <canvas ref={ref} className="pixel-icon" width={16} height={16} aria-hidden />;
}
