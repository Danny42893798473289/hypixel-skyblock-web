import { TILE, TILES, type Facing, type TileKind, type WorldEntity } from '@aether/shared';

function hash(x: number, y: number): number {
  let value = Math.imul(x + 31, 73856093) ^ Math.imul(y + 17, 19349663);
  value ^= value >>> 13;
  return value >>> 0;
}

export function drawTile(
  ctx: CanvasRenderingContext2D,
  tile: TileKind,
  tileX: number,
  tileY: number,
): void {
  const def = TILES[tile];
  const x = tileX * TILE;
  const y = tileY * TILE;
  ctx.fillStyle = def.color;
  ctx.fillRect(x, y, TILE, TILE);

  const noise = hash(tileX, tileY);
  ctx.fillStyle = def.accent;

  switch (tile) {
    case 'water':
    case 'lava': {
      const offset = (tileY + (Math.floor(performance.now() / 350) % 4)) % 5;
      ctx.fillRect(x + 2, y + 4 + offset, 6, 1);
      ctx.fillRect(x + 10, y + 10 - offset, 4, 1);
      const pulse = 0.08 + ((Math.sin((performance.now() + (tileX + tileY) * 24) / 260) + 1) * 0.06);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = tile === 'water' ? '#9ae7ff' : '#ffd0a0';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.globalAlpha = 1;
      break;
    }
    // Grass: tufts of blades, so it never reads as flat green.
    case 'grass': {
      for (let i = 0; i < 5; i++) {
        const n = noise >>> (i * 4);
        const bx = x + (n % 15);
        const by = y + ((n >>> 4) % 14);
        ctx.fillRect(bx, by, 1, 2);
        if (i % 2 === 0) ctx.fillRect(bx + 1, by + 1, 1, 1);
      }
      break;
    }
    // Cobbled walkway: rounded stones with darker mortar between them.
    case 'path': {
      ctx.fillStyle = '#8f7550';
      for (let row = 0; row < TILE; row += 5) ctx.fillRect(x, y + row, TILE, 1);
      ctx.fillStyle = def.accent;
      for (let row = 0; row < 3; row++) {
        const n = noise >>> (row * 6);
        const cx = x + ((n % 3) + row * 4);
        ctx.fillRect(cx, y + 1 + row * 5, 4, 3);
        ctx.fillRect(cx + 6, y + 1 + row * 5, 3, 3);
      }
      break;
    }
    // Tilled soil: furrow lines with a few clods of earth.
    case 'farmland': {
      ctx.fillStyle = '#4d301a';
      for (let row = 2; row < TILE; row += 4) ctx.fillRect(x, y + row, TILE, 2);
      ctx.fillStyle = '#a2703f';
      ctx.fillRect(x + (noise % 12), y + ((noise >>> 6) % 12), 2, 1);
      break;
    }
    // Loose gravel: dense pebbles of two shades.
    case 'gravel': {
      for (let i = 0; i < 6; i++) {
        const n = noise >>> (i * 4);
        ctx.fillStyle = i % 2 ? def.accent : '#6a635d';
        ctx.fillRect(x + (n % 14), y + ((n >>> 3) % 14), 2, 2);
      }
      break;
    }
    // Bedrock floor: mortar seams plus the odd crack.
    case 'stone': {
      ctx.fillStyle = '#585d62';
      ctx.fillRect(x, y + 7, TILE, 1);
      ctx.fillRect(x + (noise % 2 ? 5 : 11), y, 1, 7);
      ctx.fillRect(x + ((noise >>> 3) % 2 ? 3 : 9), y + 8, 1, 8);
      ctx.fillStyle = def.accent;
      ctx.fillRect(x + 2 + (noise % 4), y + 2, 3, 2);
      ctx.fillRect(x + 8 - ((noise >>> 5) % 3), y + 10, 3, 2);
      break;
    }
    // Masonry: offset brick courses.
    case 'wall': {
      ctx.fillStyle = def.accent;
      for (let row = 0; row < TILE; row += 4) {
        const shift = (row / 4) % 2 ? 4 : 0;
        for (let bx = -shift; bx < TILE; bx += 8) ctx.fillRect(x + bx + 1, y + row + 1, 6, 2);
      }
      break;
    }
    // Dirt: crumbs of lighter and darker soil.
    case 'dirt': {
      for (let i = 0; i < 5; i++) {
        const n = noise >>> (i * 5);
        ctx.fillStyle = i % 2 ? def.accent : '#6f4a2c';
        ctx.fillRect(x + (n % 14), y + ((n >>> 4) % 14), 2, 2);
      }
      break;
    }
    // Sand: wind ripples.
    case 'sand': {
      ctx.fillStyle = def.accent;
      for (let row = 1; row < TILE; row += 5) {
        const shift = (noise >>> row) % 4;
        ctx.fillRect(x + shift, y + row, 6, 1);
        ctx.fillRect(x + shift + 8, y + row + 2, 5, 1);
      }
      break;
    }
    // Planks: boards with visible joints.
    case 'wood': {
      ctx.fillStyle = '#6d4526';
      for (let row = 0; row < TILE; row += 4) ctx.fillRect(x, y + row, TILE, 1);
      ctx.fillStyle = def.accent;
      ctx.fillRect(x + 2, y + 1, 5, 2);
      ctx.fillRect(x + 9, y + 5, 5, 2);
      ctx.fillRect(x + 3, y + 9, 6, 2);
      ctx.fillRect(x + 8, y + 13, 4, 2);
      break;
    }
    case 'snow': {
      ctx.fillStyle = '#cfe3ea';
      ctx.fillRect(x, y + 12, TILE, 4);
      ctx.fillStyle = def.accent;
      ctx.fillRect(x + (noise % 12), y + ((noise >>> 5) % 10), 3, 2);
      break;
    }
    case 'web': {
      ctx.strokeStyle = def.accent;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y); ctx.lineTo(x + TILE, y + TILE);
      ctx.moveTo(x + TILE, y); ctx.lineTo(x, y + TILE);
      ctx.moveTo(x + TILE / 2, y); ctx.lineTo(x + TILE / 2, y + TILE);
      ctx.stroke();
      break;
    }
    case 'obsidian': {
      ctx.fillStyle = def.accent;
      ctx.fillRect(x + 3, y + 3, 3, 3);
      ctx.fillRect(x + 9, y + 8, 4, 2);
      ctx.fillStyle = '#7a5ea8';
      ctx.fillRect(x + 11, y + 3, 1, 1);
      break;
    }
    case 'void': {
      ctx.fillStyle = '#ffffff22';
      if (noise % 4 === 0) ctx.fillRect(x + (noise % 15), y + ((noise >>> 7) % 15), 1, 1);
      if (noise % 13 === 0) {
        ctx.fillStyle = '#ffffff66';
        ctx.fillRect(x + ((noise >>> 3) % 14), y + ((noise >>> 11) % 14), 2, 2);
      }
      if (noise % 29 === 0) {
        ctx.fillStyle = '#cfe9ff44';
        ctx.fillRect(x + 2, y + 4, 8, 3);
      }
      break;
    }
    default: {
      ctx.globalAlpha = 0.48;
      ctx.fillRect(x + (noise % 14), y + ((noise >>> 5) % 14), 2, 2);
      ctx.fillRect(x + ((noise >>> 10) % 14), y + ((noise >>> 15) % 14), 1, 1);
      ctx.globalAlpha = 1;
    }
  }
}

/** Rock body colour, gem colour, gem highlight — one row per ore type. */
const ORES: Record<string, [string, string, string]> = {
  ore_stone: ['#6b7075', '#9ca1a5', '#c3c8cc'],
  ore_cobble: ['#5a5a5a', '#8a8a8a', '#c4c4c4'],
  ore_coal: ['#5a5f63', '#141618', '#3a3f44'],
  ore_iron: ['#767b80', '#d3a074', '#f0c79c'],
  ore_gold: ['#7d7a68', '#ffcc22', '#fff08a'],
  ore_lapis: ['#6b7075', '#1f45b8', '#5b7dff'],
  ore_redstone: ['#6b6062', '#c31b1b', '#ff5d5d'],
  ore_diamond: ['#6b7580', '#38e0e0', '#a8ffff'],
  ore_emerald: ['#66756b', '#17c246', '#7dffa0'],
  ore_mithril: ['#5f7076', '#6fd7d0', '#c2fffb'],
  ore_titanium: ['#6a6e74', '#d8dce4', '#ffffff'],
  ore_glacite: ['#5a6b78', '#7ec8ff', '#e8f6ff'],
  ore_ruby: ['#4c3b45', '#e02352', '#ff89a9'],
  ore_jade: ['#3f4d40', '#4bd97a', '#b6ffc8'],
};

/** Stalk colour, fruit colour, fruit highlight. */
const CROPS: Record<string, [string, string, string]> = {
  crop_wheat: ['#5aa034', '#e5c640', '#fff09a'],
  crop_carrot: ['#3f8f2f', '#ef8022', '#ffb15c'],
  crop_potato: ['#4e8f37', '#c99c56', '#e8c489'],
  crop_melon: ['#3d8f33', '#4fbf3a', '#8ce35d'],
  crop_pumpkin: ['#4d8f2f', '#e2801d', '#ffb055'],
  crop_cactus: ['#2f7f45', '#3d9d55', '#7fd48b'],
  crop_cane: ['#69a83a', '#a8d060', '#d7f294'],
  crop_cocoa: ['#3f8f4f', '#8a4b23', '#c07a43'],
  crop_mushroom: ['#e8dcc4', '#c33a2f', '#ff7f6b'],
};

/** Trunk, canopy shade, canopy light. */
const TREES: Record<string, [string, string, string]> = {
  tree_oak: ['#754521', '#286b2d', '#4f9d43'],
  tree_birch: ['#d8d2c0', '#4f8f36', '#8ec95c'],
  tree_jungle: ['#5c4a24', '#1c5a24', '#38913a'],
  tree_dark_oak: ['#42301a', '#17451f', '#2b6b2c'],
};

/** Robe, trim, hat/hair, prop colour. */
const NPCS: Record<string, [string, string, string, string]> = {
  npc_villager: ['#6b3f28', '#9b6548', '#80543a', '#bb8664'],
  npc_banker: ['#2b3f6b', '#dfe4f2', '#1b2947', '#ffcc22'],
  npc_blacksmith: ['#3d3a38', '#8f5a2c', '#1f1d1c', '#b8bec4'],
  npc_librarian: ['#5a3f7d', '#e0d3ff', '#3b2a54', '#f2e9c8'],
  npc_auctioneer: ['#7d2f3f', '#f2d98a', '#4a1b25', '#ffcc22'],
  npc_farmer: ['#6b8f2f', '#d8c46a', '#c9a83f', '#8f6a2c'],
  npc_miner: ['#5f5a4a', '#c4c9cd', '#3b3830', '#ffcc22'],
  npc_fisher: ['#2f6b7d', '#a8dcea', '#1c4753', '#79d4ff'],
  npc_forester: ['#2f6b3f', '#8fbf6a', '#1c4527', '#8a5a2c'],
  npc_fighter: ['#6b2f2f', '#c4c9cd', '#3b1c1c', '#e0e6ea'],
  npc_trapper: ['#7d5f2f', '#d8b96a', '#4a381b', '#8f6a2c'],
};

export function drawEntity(
  ctx: CanvasRenderingContext2D,
  entity: WorldEntity,
  highlighted: boolean,
  alpha = 1,
): void {
  const x = Math.round(entity.x * TILE);
  const y = Math.round(entity.y * TILE);
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  if (highlighted) {
    ctx.fillStyle = '#ffff5577';
    ctx.beginPath();
    ctx.ellipse(0, 4, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (entity.kind !== 'fairy') {
    ctx.fillStyle = '#00000055';
    ctx.beginPath();
    ctx.ellipse(0, 5, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const sprite = entity.sprite;
  if (sprite === 'ore_cobble') drawCobble(ctx);
  else if (ORES[sprite]) drawOre(ctx, ORES[sprite]);
  else if (CROPS[sprite]) drawCrop(ctx, CROPS[sprite], sprite);
  else if (TREES[sprite]) drawTree(ctx, TREES[sprite], sprite === 'tree_jungle');
  else if (NPCS[sprite]) drawNpc(ctx, NPCS[sprite]);
  else {
    switch (sprite) {
      case 'fishing_spot': drawFishingSpot(ctx); break;
      case 'mob_zombie': drawZombie(ctx, '#387c43', '#377d84'); break;
      case 'mob_brute': drawZombie(ctx, '#2f5f36', '#6b4a2c'); break;
      case 'mob_lapis_zombie': drawZombie(ctx, '#37567c', '#2b3f8f'); break;
      case 'mob_spider': drawSpider(ctx, '#2d2428', '#ff3030'); break;
      case 'mob_dasher': drawSpider(ctx, '#3c2b4a', '#ffb020'); break;
      case 'mob_enderman': drawEnderman(ctx, '#b54cff'); break;
      case 'mob_zealot': drawEnderman(ctx, '#38e0a0'); break;
      case 'mob_magma': drawMagmaCube(ctx); break;
      case 'mob_wolf': drawZombie(ctx, '#d8d8d8', '#8a8a8a'); break;
      case 'fairy': drawFairy(ctx); break;
      case 'bazaar_stall': drawStall(ctx, '#e8c348', '#f6e17a'); break;
      case 'auction_stand': drawStall(ctx, '#c34848', '#f27a7a'); break;
      case 'crafting_table': drawCrate(ctx, '#9d6335', '#d49a57'); break;
      case 'bank_vault': drawVault(ctx); break;
      case 'warp_gate': drawPortal(ctx, '#7d36c8', '#c45cff'); break;
      case 'dungeon_portal': drawPortal(ctx, '#2b4a4a', '#38e0a0'); break;
      case 'wither_door': drawWitherDoor(ctx); break;
      case 'blood_door': drawBloodDoor(ctx); break;
      case 'enchant_table': drawEnchantTable(ctx); break;
      case 'anvil': drawAnvil(ctx); break;
      case 'slayer_altar': drawAltar(ctx); break;
      case 'pet_stand': drawPetStand(ctx); break;
      case 'minion_pad': drawMinion(ctx); break;
      case 'sign': drawSign(ctx); break;
      case 'bush': drawBush(ctx, '#2f7a37', '#4fa347'); break;
      case 'dead_bush': drawBush(ctx, '#7d6335', '#a8894a'); break;
      case 'flower': drawFlower(ctx); break;
      case 'lamp': drawLamp(ctx, '#4a4f54', '#ffdb7a'); break;
      case 'lantern': drawLamp(ctx, '#3b2a1c', '#ffb648'); break;
      case 'hay': drawHay(ctx); break;
      case 'fence': drawFence(ctx); break;
      case 'rock': drawPebbles(ctx, '#6b7075', '#9ca1a5'); break;
      case 'lava_rock': drawPebbles(ctx, '#4a2b22', '#e0562a'); break;
      case 'stalagmite': drawStalagmite(ctx, '#6b7075'); break;
      case 'crystal': drawCrystal(ctx, '#6fd7d0'); break;
      case 'end_crystal': drawCrystal(ctx, '#c45cff'); break;
      case 'obelisk': drawObelisk(ctx); break;
      case 'fire': drawFire(ctx); break;
      case 'bone_pile': drawBones(ctx); break;
      case 'cocoon': drawCocoon(ctx); break;
      case 'web_decor': drawWebDecor(ctx); break;
      case 'mushroom_decor': drawMushroomDecor(ctx); break;
      case 'cactus_decor': drawCactusDecor(ctx); break;
      case 'minecart': drawMinecart(ctx); break;
      default: drawCrate(ctx, '#6c7075', '#a5abb0');
    }
  }
  ctx.restore();
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facing: Facing,
  moving: boolean,
  frame: number,
  local: boolean,
): void {
  ctx.save();
  ctx.translate(Math.round(x * TILE), Math.round(y * TILE));
  const bob = moving && frame % 2 === 1 ? -1 : 0;
  ctx.translate(0, bob);
  ctx.fillStyle = '#00000066';
  ctx.beginPath();
  ctx.ellipse(0, 6 - bob, 6, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  const skin = local ? '#efb38a' : '#d99b75';
  const shirt = local ? '#36a9b6' : '#6d78c9';
  const darkShirt = local ? '#21737d' : '#424c91';
  const legOffset = moving ? (frame % 2 === 0 ? 1 : -1) : 0;
  ctx.fillStyle = '#273352';
  ctx.fillRect(-5 + legOffset, 2, 4, 6);
  ctx.fillRect(1 - legOffset, 2, 4, 6);
  ctx.fillStyle = darkShirt;
  ctx.fillRect(-6, -5, 12, 9);
  ctx.fillStyle = shirt;
  ctx.fillRect(-5, -5, 10, 7);
  ctx.fillStyle = skin;
  ctx.fillRect(-5, -12, 10, 8);
  ctx.fillStyle = '#5b3526';
  ctx.fillRect(-5, -12, 10, 2);
  ctx.fillRect(-5, -10, 2, 3);
  ctx.fillStyle = '#222';
  if (facing === 'up') {
    ctx.fillStyle = '#5b3526';
    ctx.fillRect(-3, -9, 6, 5);
  } else if (facing === 'left') {
    ctx.fillRect(-4, -9, 2, 2);
  } else if (facing === 'right') {
    ctx.fillRect(2, -9, 2, 2);
  } else {
    ctx.fillRect(-3, -9, 2, 2);
    ctx.fillRect(2, -9, 2, 2);
  }
  ctx.restore();
}

function drawOre(ctx: CanvasRenderingContext2D, [rock, gem, glint]: [string, string, string]): void {
  ctx.fillStyle = rock;
  ctx.fillRect(-8, -9, 16, 15);
  ctx.fillStyle = '#00000033';
  ctx.fillRect(-8, 3, 16, 3);
  ctx.fillStyle = gem;
  ctx.fillRect(-5, -6, 4, 4);
  ctx.fillRect(2, -1, 4, 4);
  ctx.fillRect(-3, 1, 3, 3);
  ctx.fillStyle = glint;
  ctx.fillRect(-5, -6, 2, 2);
  ctx.fillRect(2, -1, 2, 2);
  ctx.fillStyle = '#ffffff22';
  ctx.fillRect(-8, -9, 16, 2);
}

function drawCobble(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#3f3f3f';
  ctx.fillRect(-8, -9, 16, 15);
  const stones: Array<[number, number, number, number, string]> = [
    [-7, -8, 7, 5, '#8d8d8d'],
    [1, -8, 6, 4, '#7a7a7a'],
    [-7, -2, 5, 5, '#9a9a9a'],
    [-1, -3, 8, 5, '#6e6e6e'],
    [1, 3, 6, 2, '#858585'],
    [-7, 4, 7, 1, '#747474'],
  ];
  for (const [x, y, w, h, color] of stones) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#ffffff33';
    ctx.fillRect(x, y, Math.max(1, w - 3), 1);
  }
}

function drawCrop(ctx: CanvasRenderingContext2D, [stalk, fruit, glint]: [string, string, string], sprite: string): void {
  ctx.strokeStyle = stalk;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 6); ctx.lineTo(0, -6);
  ctx.moveTo(0, -1); ctx.lineTo(-5, -5);
  ctx.moveTo(0, 2); ctx.lineTo(5, -2);
  ctx.stroke();

  ctx.fillStyle = fruit;
  if (sprite === 'crop_melon' || sprite === 'crop_pumpkin') {
    ctx.fillRect(-6, -4, 12, 10);
    ctx.fillStyle = glint;
    ctx.fillRect(-4, -2, 2, 6);
    ctx.fillRect(1, -2, 2, 6);
    return;
  }
  if (sprite === 'crop_mushroom') {
    ctx.fillRect(-6, -8, 12, 5);
    ctx.fillStyle = glint;
    ctx.fillRect(-4, -7, 2, 2);
    ctx.fillRect(2, -7, 2, 2);
    ctx.fillStyle = '#e8dcc4';
    ctx.fillRect(-2, -3, 4, 8);
    return;
  }
  if (sprite === 'crop_cactus') {
    ctx.fillRect(-3, -10, 6, 15);
    ctx.fillRect(-7, -5, 4, 4);
    ctx.fillRect(3, -7, 4, 4);
    ctx.fillStyle = glint;
    ctx.fillRect(-1, -9, 1, 12);
    return;
  }
  if (sprite === 'crop_carrot' || sprite === 'crop_potato') {
    ctx.fillRect(-3, 0, 6, 6);
    ctx.fillStyle = glint;
    ctx.fillRect(-1, 1, 2, 4);
    return;
  }
  ctx.fillRect(-2, -11, 4, 7);
  ctx.fillStyle = glint;
  ctx.fillRect(-2, -11, 2, 3);
}

function drawTree(ctx: CanvasRenderingContext2D, [trunk, shade, light]: [string, string, string], tall: boolean): void {
  const lift = tall ? 4 : 0;
  ctx.fillStyle = trunk;
  ctx.fillRect(-3, -5 - lift, 6, 12 + lift);
  ctx.fillStyle = shade;
  ctx.fillRect(-9, -16 - lift, 18, 11);
  ctx.fillStyle = light;
  ctx.fillRect(-7, -19 - lift, 14, 7);
  ctx.fillRect(-11, -13 - lift, 22, 4);
  ctx.fillStyle = '#ffffff22';
  ctx.fillRect(-6, -17 - lift, 5, 3);
}

function drawNpc(ctx: CanvasRenderingContext2D, [robe, trim, hat, prop]: [string, string, string, string]): void {
  ctx.fillStyle = robe;
  ctx.fillRect(-6, -6, 12, 12);
  ctx.fillStyle = trim;
  ctx.fillRect(-6, -2, 12, 2);
  ctx.fillStyle = '#bb8664';
  ctx.fillRect(-5, -13, 10, 9);
  ctx.fillStyle = hat;
  ctx.fillRect(-7, -16, 14, 4);
  ctx.fillRect(-5, -13, 10, 2);
  ctx.fillStyle = '#222';
  ctx.fillRect(-3, -9, 2, 2);
  ctx.fillRect(2, -9, 2, 2);
  ctx.fillStyle = prop;
  ctx.fillRect(6, -6, 3, 8);
}

function drawFishingSpot(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#2673b8';
  ctx.beginPath(); ctx.ellipse(0, 1, 11, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#79d4ff'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(0, 1, 8, 4, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 1, 4, 2, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#8a5a2c'; ctx.fillRect(4, -12, 1, 12);
  ctx.fillStyle = '#f33'; ctx.fillRect(-1, -3, 2, 3);
}

function drawZombie(ctx: CanvasRenderingContext2D, skin: string, shirt: string): void {
  ctx.fillStyle = skin; ctx.fillRect(-5, -12, 10, 8);
  ctx.fillStyle = shirt; ctx.fillRect(-6, -4, 12, 8);
  ctx.fillStyle = '#3b326b'; ctx.fillRect(-5, 4, 4, 4); ctx.fillRect(1, 4, 4, 4);
  ctx.fillStyle = skin; ctx.fillRect(-9, -3, 3, 6); ctx.fillRect(6, -3, 3, 6);
  ctx.fillStyle = '#131313'; ctx.fillRect(-3, -9, 2, 2); ctx.fillRect(2, -9, 2, 2);
}

function drawSpider(ctx: CanvasRenderingContext2D, body: string, eyes: string): void {
  ctx.strokeStyle = body; ctx.lineWidth = 2;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(side * 3, -1 + i * 2);
      ctx.lineTo(side * (8 + i), -5 + i * 4);
      ctx.stroke();
    }
  }
  ctx.fillStyle = body; ctx.fillRect(-6, -6, 12, 11);
  ctx.fillStyle = eyes; ctx.fillRect(-4, -4, 2, 2); ctx.fillRect(2, -4, 2, 2);
}

function drawEnderman(ctx: CanvasRenderingContext2D, eyes: string): void {
  ctx.fillStyle = '#17131b';
  ctx.fillRect(-4, -19, 8, 11);
  ctx.fillRect(-3, -8, 6, 16);
  ctx.fillRect(-6, -8, 2, 12);
  ctx.fillRect(4, -8, 2, 12);
  ctx.fillStyle = eyes; ctx.fillRect(-3, -15, 2, 2); ctx.fillRect(2, -15, 2, 2);
}

function drawMagmaCube(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#8e241c'; ctx.fillRect(-8, -10, 16, 16);
  ctx.fillStyle = '#e74c22'; ctx.fillRect(-6, -8, 12, 4); ctx.fillRect(-6, 1, 12, 3);
  ctx.fillStyle = '#ffcf33'; ctx.fillRect(-4, -6, 3, 2); ctx.fillRect(2, -6, 3, 2);
}

function drawFairy(ctx: CanvasRenderingContext2D): void {
  const pulse = 0.6 + Math.sin(performance.now() / 220) * 0.3;
  ctx.globalAlpha *= pulse;
  ctx.fillStyle = '#ff7dff'; ctx.fillRect(-2, -7, 4, 8);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(-6, -6, 4, 4); ctx.fillRect(2, -6, 4, 4);
  ctx.fillStyle = '#fff7a8'; ctx.fillRect(-1, -9, 2, 2);
}

function drawStall(ctx: CanvasRenderingContext2D, canopy: string, stripe: string): void {
  ctx.fillStyle = '#704020'; ctx.fillRect(-9, -5, 18, 12);
  ctx.fillStyle = '#523018'; ctx.fillRect(-9, 2, 18, 2);
  ctx.fillStyle = canopy; ctx.fillRect(-11, -13, 22, 5);
  ctx.fillStyle = stripe; ctx.fillRect(-11, -13, 5, 5); ctx.fillRect(0, -13, 5, 5);
}

function drawCrate(ctx: CanvasRenderingContext2D, dark: string, light: string): void {
  ctx.fillStyle = dark; ctx.fillRect(-8, -9, 16, 16);
  ctx.fillStyle = light; ctx.fillRect(-6, -7, 12, 3); ctx.fillRect(-6, 0, 12, 2);
  ctx.fillStyle = '#342519'; ctx.fillRect(-1, -7, 2, 14);
}

function drawVault(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#4a5560'; ctx.fillRect(-9, -12, 18, 18);
  ctx.fillStyle = '#6f7d8a'; ctx.fillRect(-7, -10, 14, 14);
  ctx.fillStyle = '#ffcc22'; ctx.fillRect(-2, -4, 5, 5);
  ctx.fillStyle = '#2b3138'; ctx.fillRect(-1, -3, 3, 3);
  ctx.fillStyle = '#dfe4f2'; ctx.fillRect(-7, -10, 14, 2);
}

function drawPortal(ctx: CanvasRenderingContext2D, inner: string, glow: string): void {
  const shimmer = Math.floor(performance.now() / 140) % 3;
  ctx.fillStyle = '#292038';
  ctx.fillRect(-9, -15, 4, 21);
  ctx.fillRect(5, -15, 4, 21);
  ctx.fillRect(-9, -17, 18, 4);
  ctx.fillStyle = inner; ctx.fillRect(-5, -13, 10, 18);
  ctx.fillStyle = glow;
  ctx.fillRect(-3 + shimmer, -11, 2, 14);
  ctx.fillRect(2 - shimmer, -9, 1, 10);
}

function drawWitherDoor(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-10, -16, 20, 24);
  ctx.fillStyle = '#2d2d2d';
  ctx.fillRect(-8, -14, 16, 20);
  ctx.fillStyle = '#38e0a0';
  ctx.fillRect(-2, -10, 4, 14);
  ctx.fillStyle = '#cccccc';
  ctx.fillRect(-5, -6, 3, 3);
  ctx.fillRect(2, -6, 3, 3);
  ctx.fillStyle = '#555555';
  ctx.fillRect(-3, -1, 6, 2);
}

function drawBloodDoor(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#3a1010';
  ctx.fillRect(-10, -16, 20, 24);
  ctx.fillStyle = '#5c1818';
  ctx.fillRect(-8, -14, 16, 20);
  ctx.fillStyle = '#ff3030';
  ctx.fillRect(-2, -10, 4, 14);
  ctx.fillStyle = '#ff8888';
  ctx.fillRect(-4, -8, 8, 2);
  ctx.fillRect(-4, 2, 8, 2);
}

function drawEnchantTable(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#2b2438'; ctx.fillRect(-8, -4, 16, 10);
  ctx.fillStyle = '#4a3d63'; ctx.fillRect(-8, -6, 16, 3);
  ctx.fillStyle = '#c33a2f'; ctx.fillRect(-5, -12, 10, 6);
  ctx.fillStyle = '#f2e9c8'; ctx.fillRect(-5, -10, 10, 2);
  ctx.fillStyle = '#c45cff'; ctx.fillRect(-6, -15, 2, 2); ctx.fillRect(4, -17, 2, 2);
}

function drawAnvil(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#3b4147'; ctx.fillRect(-8, -9, 16, 5);
  ctx.fillStyle = '#4f5760'; ctx.fillRect(-4, -4, 8, 6);
  ctx.fillStyle = '#3b4147'; ctx.fillRect(-7, 2, 14, 4);
  ctx.fillStyle = '#8d959c'; ctx.fillRect(-8, -9, 16, 2);
}

function drawAltar(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#2f2b36'; ctx.fillRect(-9, -2, 18, 8);
  ctx.fillStyle = '#4a4356'; ctx.fillRect(-7, -6, 14, 5);
  ctx.fillStyle = '#e0e6ea'; ctx.fillRect(-3, -13, 6, 6);
  ctx.fillStyle = '#131313'; ctx.fillRect(-2, -11, 2, 2); ctx.fillRect(1, -11, 2, 2);
}

function drawPetStand(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#8a5a2c'; ctx.fillRect(-7, -2, 14, 7);
  ctx.fillStyle = '#c08a4a'; ctx.fillRect(-7, -4, 14, 3);
  ctx.fillStyle = '#f2d98a'; ctx.fillRect(-4, -11, 8, 7);
  ctx.fillStyle = '#131313'; ctx.fillRect(-2, -9, 2, 2); ctx.fillRect(1, -9, 2, 2);
}

function drawMinion(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#7d858d'; ctx.fillRect(-7, -10, 14, 14);
  ctx.fillStyle = '#c5ccd1'; ctx.fillRect(-5, -8, 10, 7);
  ctx.fillStyle = '#4ec7ff'; ctx.fillRect(-3, -6, 2, 2); ctx.fillRect(2, -6, 2, 2);
  ctx.fillStyle = '#3b4147'; ctx.fillRect(-5, 4, 4, 4); ctx.fillRect(1, 4, 4, 4);
}

function drawSign(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#6b4423'; ctx.fillRect(-1, -4, 3, 10);
  ctx.fillStyle = '#a8763f'; ctx.fillRect(-8, -12, 17, 8);
  ctx.fillStyle = '#6b4423'; ctx.fillRect(-8, -12, 17, 1);
  ctx.fillStyle = '#5b3a1d';
  ctx.fillRect(-6, -10, 13, 1);
  ctx.fillRect(-6, -8, 9, 1);
}

function drawBush(ctx: CanvasRenderingContext2D, dark: string, light: string): void {
  ctx.fillStyle = dark; ctx.fillRect(-6, -5, 12, 9);
  ctx.fillStyle = light; ctx.fillRect(-4, -7, 8, 4); ctx.fillRect(-6, -3, 4, 3);
}

function drawFlower(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#3f8f36'; ctx.fillRect(-1, -4, 2, 8);
  ctx.fillStyle = '#ffe14d'; ctx.fillRect(-3, -8, 6, 4);
  ctx.fillStyle = '#ff6b8a'; ctx.fillRect(-1, -7, 2, 2);
}

function drawLamp(ctx: CanvasRenderingContext2D, post: string, glow: string): void {
  ctx.fillStyle = post; ctx.fillRect(-1, -8, 3, 14);
  ctx.fillStyle = glow; ctx.fillRect(-4, -14, 9, 6);
  ctx.fillStyle = '#ffffff88'; ctx.fillRect(-3, -13, 3, 2);
}

function drawHay(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#c9a83f'; ctx.fillRect(-8, -7, 16, 13);
  ctx.fillStyle = '#e8cd6a'; ctx.fillRect(-8, -4, 16, 2); ctx.fillRect(-8, 1, 16, 2);
  ctx.fillStyle = '#8f7a2c'; ctx.fillRect(-3, -7, 2, 13);
}

function drawFence(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#8a5a2c';
  ctx.fillRect(-7, -8, 3, 14);
  ctx.fillRect(4, -8, 3, 14);
  ctx.fillRect(-7, -6, 14, 2);
  ctx.fillRect(-7, -1, 14, 2);
}

function drawPebbles(ctx: CanvasRenderingContext2D, dark: string, light: string): void {
  ctx.fillStyle = dark; ctx.fillRect(-7, -2, 14, 8);
  ctx.fillStyle = light; ctx.fillRect(-5, -5, 7, 4); ctx.fillRect(2, -3, 4, 3);
}

function drawStalagmite(ctx: CanvasRenderingContext2D, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-6, 6); ctx.lineTo(0, -14); ctx.lineTo(6, 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffffff22';
  ctx.beginPath();
  ctx.moveTo(-2, 6); ctx.lineTo(0, -13); ctx.lineTo(1, 6); ctx.closePath(); ctx.fill();
}

function drawCrystal(ctx: CanvasRenderingContext2D, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -16); ctx.lineTo(5, -4); ctx.lineTo(0, 6); ctx.lineTo(-5, -4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffffff55';
  ctx.beginPath();
  ctx.moveTo(0, -15); ctx.lineTo(2, -5); ctx.lineTo(0, 4); ctx.closePath(); ctx.fill();
}

function drawObelisk(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#2b2438'; ctx.fillRect(-5, -18, 10, 24);
  ctx.fillStyle = '#4a3d63'; ctx.fillRect(-5, -18, 4, 24);
  ctx.fillStyle = '#c45cff'; ctx.fillRect(-2, -14, 4, 4);
}

function drawFire(ctx: CanvasRenderingContext2D): void {
  const flicker = Math.floor(performance.now() / 110) % 3;
  ctx.fillStyle = '#7d2b18'; ctx.fillRect(-6, 2, 12, 4);
  ctx.fillStyle = '#e0562a'; ctx.fillRect(-4, -6 - flicker, 8, 9);
  ctx.fillStyle = '#ffb648'; ctx.fillRect(-2, -9 - flicker, 4, 7);
  ctx.fillStyle = '#fff3a8'; ctx.fillRect(-1, -6 - flicker, 2, 3);
}

function drawBones(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#e0dccd';
  ctx.fillRect(-7, 0, 14, 3);
  ctx.fillRect(-8, -1, 2, 5);
  ctx.fillRect(6, -1, 2, 5);
  ctx.fillRect(-4, -6, 8, 6);
  ctx.fillStyle = '#2b2b2b'; ctx.fillRect(-3, -4, 2, 2); ctx.fillRect(1, -4, 2, 2);
}

function drawCocoon(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#cfcada';
  ctx.beginPath(); ctx.ellipse(0, -4, 6, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8e8a99'; ctx.lineWidth = 1;
  for (let i = -6; i <= 4; i += 4) {
    ctx.beginPath(); ctx.moveTo(-6, i); ctx.lineTo(6, i + 2); ctx.stroke();
  }
}

function drawWebDecor(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = '#cfcada'; ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * -8, Math.sin(angle) * -8);
    ctx.lineTo(Math.cos(angle) * 8, Math.sin(angle) * 8);
    ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.stroke();
}

function drawMushroomDecor(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#e8dcc4'; ctx.fillRect(-2, -4, 4, 9);
  ctx.fillStyle = '#c33a2f'; ctx.fillRect(-7, -9, 14, 5);
  ctx.fillStyle = '#ffdccd'; ctx.fillRect(-5, -8, 3, 2); ctx.fillRect(2, -8, 3, 2);
}

function drawCactusDecor(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#2f7f45'; ctx.fillRect(-3, -12, 6, 18);
  ctx.fillRect(-7, -6, 4, 4);
  ctx.fillRect(3, -9, 4, 4);
  ctx.fillStyle = '#7fd48b'; ctx.fillRect(-1, -11, 1, 15);
}

function drawMinecart(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#3b4147'; ctx.fillRect(-8, -6, 16, 9);
  ctx.fillStyle = '#6b7075'; ctx.fillRect(-6, -4, 12, 5);
  ctx.fillStyle = '#2b2b2b';
  ctx.beginPath(); ctx.arc(-4, 4, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(4, 4, 3, 0, Math.PI * 2); ctx.fill();
}
