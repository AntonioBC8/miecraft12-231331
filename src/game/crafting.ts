/**
 * Minecraft Web 3D - Authentic Crafting System (2x2 Player and 3x3 Crafting Table grids)
 */

export interface CraftingRecipe {
  id: string;
  name: string;
  gridSize: 2 | 3;
  pattern: (string | null)[][]; // 2x2 or 3x3 matrix of item IDs
  result: {
    itemId: string;
    count: number;
  };
}

export const RECIPES: CraftingRecipe[] = [
  // 1 Oak Wood -> 4 Planks
  {
    id: 'planks_oak',
    name: 'Tablones de Madera',
    gridSize: 2,
    pattern: [
      ['wood', null],
      [null, null],
    ],
    result: { itemId: 'planks', count: 4 },
  },
  // 1 Jungle Wood -> 4 Planks
  {
    id: 'planks_jungle',
    name: 'Tablones de Selva',
    gridSize: 2,
    pattern: [
      ['jungle_wood', null],
      [null, null],
    ],
    result: { itemId: 'planks', count: 4 },
  },
  // 1 Spruce Wood -> 4 Spruce Planks
  {
    id: 'planks_spruce',
    name: 'Tablones de Abeto',
    gridSize: 2,
    pattern: [
      ['spruce_wood', null],
      [null, null],
    ],
    result: { itemId: 'spruce_planks', count: 4 },
  },
  // 1 Birch Wood -> 4 Birch Planks
  {
    id: 'planks_birch',
    name: 'Tablones de Abedul',
    gridSize: 2,
    pattern: [
      ['birch_wood', null],
      [null, null],
    ],
    result: { itemId: 'birch_planks', count: 4 },
  },
  // 1 Dark Oak Wood -> 4 Dark Oak Planks
  {
    id: 'planks_dark_oak',
    name: 'Tablones de Roble Oscuro',
    gridSize: 2,
    pattern: [
      ['dark_oak_wood', null],
      [null, null],
    ],
    result: { itemId: 'dark_oak_planks', count: 4 },
  },
  // 1 Acacia Wood -> 4 Acacia Planks
  {
    id: 'planks_acacia',
    name: 'Tablones de Acacia',
    gridSize: 2,
    pattern: [
      ['acacia_wood', null],
      [null, null],
    ],
    result: { itemId: 'acacia_planks', count: 4 },
  },
  // 1 Cherry Wood -> 4 Cherry Planks
  {
    id: 'planks_cherry',
    name: 'Tablones de Cerezo',
    gridSize: 2,
    pattern: [
      ['cherry_wood', null],
      [null, null],
    ],
    result: { itemId: 'cherry_planks', count: 4 },
  },
  // 4 Ice -> Packed Ice
  {
    id: 'packed_ice',
    name: 'Hielo Compacto',
    gridSize: 2,
    pattern: [
      ['ice', 'ice'],
      ['ice', 'ice'],
    ],
    result: { itemId: 'packed_ice', count: 1 },
  },
  // 4 Packed Ice -> Blue Ice
  {
    id: 'blue_ice',
    name: 'Hielo Azul',
    gridSize: 2,
    pattern: [
      ['packed_ice', 'packed_ice'],
      ['packed_ice', 'packed_ice'],
    ],
    result: { itemId: 'blue_ice', count: 1 },
  },
  // 2 Planks -> 4 Sticks
  {
    id: 'stick',
    name: 'Palos',
    gridSize: 2,
    pattern: [
      ['planks', null],
      ['planks', null],
    ],
    result: { itemId: 'stick', count: 4 },
  },
  // 4 Planks -> Crafting Table
  {
    id: 'crafting_table',
    name: 'Mesa de Crafteo',
    gridSize: 2,
    pattern: [
      ['planks', 'planks'],
      ['planks', 'planks'],
    ],
    result: { itemId: 'crafting_table', count: 1 },
  },
  // 8 Planks -> Wooden Storage Box (3x3 hollow ring)
  {
    id: 'storage_wood',
    name: 'Caja de Almacenamiento de Madera',
    gridSize: 3,
    pattern: [
      ['planks', 'planks', 'planks'],
      ['planks', null, 'planks'],
      ['planks', 'planks', 'planks'],
    ],
    result: { itemId: 'storage_wood', count: 1 },
  },
  // 4 Sand -> Sandstone (2x2)
  {
    id: 'sandstone',
    name: 'Arenisca',
    gridSize: 2,
    pattern: [
      ['sand', 'sand'],
      ['sand', 'sand'],
    ],
    result: { itemId: 'sandstone', count: 1 },
  },
  // 2 Sandstone -> 2 Chiseled Sandstone (2x1 vertical)
  {
    id: 'chiseled_sandstone',
    name: 'Arenisca Cincelada',
    gridSize: 2,
    pattern: [
      ['sandstone', null],
      ['sandstone', null],
    ],
    result: { itemId: 'chiseled_sandstone', count: 2 },
  },
  // 1 Stick + 1 Coal -> 4 Torches
  {
    id: 'torch',
    name: 'Antorchas',
    gridSize: 2,
    pattern: [
      ['coal', null],
      ['stick', null],
    ],
    result: { itemId: 'torch', count: 4 },
  },

  // ==========================================
  // --- 1. Wooden Tools (Madera) ---
  // ==========================================
  {
    id: 'wooden_pickaxe',
    name: 'Pico de Madera',
    gridSize: 3,
    pattern: [
      ['planks', 'planks', 'planks'],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'wooden_pickaxe', count: 1 },
  },
  {
    id: 'wooden_axe',
    name: 'Hacha de Madera',
    gridSize: 3,
    pattern: [
      ['planks', 'planks', null],
      ['planks', 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'wooden_axe', count: 1 },
  },
  {
    id: 'wooden_shovel',
    name: 'Pala de Madera',
    gridSize: 3,
    pattern: [
      [null, 'planks', null],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'wooden_shovel', count: 1 },
  },
  {
    id: 'wooden_sword',
    name: 'Espada de Madera',
    gridSize: 3,
    pattern: [
      [null, 'planks', null],
      [null, 'planks', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'wooden_sword', count: 1 },
  },
  {
    id: 'wooden_hoe',
    name: 'Azada de Madera',
    gridSize: 3,
    pattern: [
      ['planks', 'planks', null],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'wooden_hoe', count: 1 },
  },

  // ==========================================
  // --- 2. Stone Tools (Piedra) ---
  // ==========================================
  {
    id: 'stone_pickaxe',
    name: 'Pico de Piedra',
    gridSize: 3,
    pattern: [
      ['cobblestone', 'cobblestone', 'cobblestone'],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'stone_pickaxe', count: 1 },
  },
  {
    id: 'stone_axe',
    name: 'Hacha de Piedra',
    gridSize: 3,
    pattern: [
      ['cobblestone', 'cobblestone', null],
      ['cobblestone', 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'stone_axe', count: 1 },
  },
  {
    id: 'stone_shovel',
    name: 'Pala de Piedra',
    gridSize: 3,
    pattern: [
      [null, 'cobblestone', null],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'stone_shovel', count: 1 },
  },
  {
    id: 'stone_sword',
    name: 'Espada de Piedra',
    gridSize: 3,
    pattern: [
      [null, 'cobblestone', null],
      [null, 'cobblestone', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'stone_sword', count: 1 },
  },
  {
    id: 'stone_hoe',
    name: 'Azada de Piedra',
    gridSize: 3,
    pattern: [
      ['cobblestone', 'cobblestone', null],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'stone_hoe', count: 1 },
  },

  // ==========================================
  // --- 3. Copper Tools (Cobre) ---
  // ==========================================
  {
    id: 'copper_pickaxe',
    name: 'Pico de Cobre',
    gridSize: 3,
    pattern: [
      ['copper_ingot', 'copper_ingot', 'copper_ingot'],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'copper_pickaxe', count: 1 },
  },
  {
    id: 'copper_axe',
    name: 'Hacha de Cobre',
    gridSize: 3,
    pattern: [
      ['copper_ingot', 'copper_ingot', null],
      ['copper_ingot', 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'copper_axe', count: 1 },
  },
  {
    id: 'copper_shovel',
    name: 'Pala de Cobre',
    gridSize: 3,
    pattern: [
      [null, 'copper_ingot', null],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'copper_shovel', count: 1 },
  },
  {
    id: 'copper_sword',
    name: 'Espada de Cobre',
    gridSize: 3,
    pattern: [
      [null, 'copper_ingot', null],
      [null, 'copper_ingot', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'copper_sword', count: 1 },
  },
  {
    id: 'copper_hoe',
    name: 'Azada de Cobre',
    gridSize: 3,
    pattern: [
      ['copper_ingot', 'copper_ingot', null],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'copper_hoe', count: 1 },
  },

  // ==========================================
  // --- 4. Gold Tools (Oro) ---
  // ==========================================
  {
    id: 'gold_pickaxe',
    name: 'Pico de Oro',
    gridSize: 3,
    pattern: [
      ['gold_ingot', 'gold_ingot', 'gold_ingot'],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'gold_pickaxe', count: 1 },
  },
  {
    id: 'gold_axe',
    name: 'Hacha de Oro',
    gridSize: 3,
    pattern: [
      ['gold_ingot', 'gold_ingot', null],
      ['gold_ingot', 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'gold_axe', count: 1 },
  },
  {
    id: 'gold_shovel',
    name: 'Pala de Oro',
    gridSize: 3,
    pattern: [
      [null, 'gold_ingot', null],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'gold_shovel', count: 1 },
  },
  {
    id: 'gold_sword',
    name: 'Espada de Oro',
    gridSize: 3,
    pattern: [
      [null, 'gold_ingot', null],
      [null, 'gold_ingot', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'gold_sword', count: 1 },
  },
  {
    id: 'gold_hoe',
    name: 'Azada de Oro',
    gridSize: 3,
    pattern: [
      ['gold_ingot', 'gold_ingot', null],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'gold_hoe', count: 1 },
  },

  // ==========================================
  // --- 5. Iron Tools (Hierro) ---
  // ==========================================
  {
    id: 'iron_pickaxe',
    name: 'Pico de Hierro',
    gridSize: 3,
    pattern: [
      ['iron_ingot', 'iron_ingot', 'iron_ingot'],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'iron_pickaxe', count: 1 },
  },
  {
    id: 'iron_axe',
    name: 'Hacha de Hierro',
    gridSize: 3,
    pattern: [
      ['iron_ingot', 'iron_ingot', null],
      ['iron_ingot', 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'iron_axe', count: 1 },
  },
  {
    id: 'iron_shovel',
    name: 'Pala de Hierro',
    gridSize: 3,
    pattern: [
      [null, 'iron_ingot', null],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'iron_shovel', count: 1 },
  },
  {
    id: 'iron_sword',
    name: 'Espada de Hierro',
    gridSize: 3,
    pattern: [
      [null, 'iron_ingot', null],
      [null, 'iron_ingot', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'iron_sword', count: 1 },
  },
  {
    id: 'iron_hoe',
    name: 'Azada de Hierro',
    gridSize: 3,
    pattern: [
      ['iron_ingot', 'iron_ingot', null],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'iron_hoe', count: 1 },
  },

  // ==========================================
  // --- 6. Titanium Tools (Titanio) ---
  // ==========================================
  {
    id: 'titanium_pickaxe',
    name: 'Pico de Titanio',
    gridSize: 3,
    pattern: [
      ['titanium_ingot', 'titanium_ingot', 'titanium_ingot'],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'titanium_pickaxe', count: 1 },
  },
  {
    id: 'titanium_axe',
    name: 'Hacha de Titanio',
    gridSize: 3,
    pattern: [
      ['titanium_ingot', 'titanium_ingot', null],
      ['titanium_ingot', 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'titanium_axe', count: 1 },
  },
  {
    id: 'titanium_shovel',
    name: 'Pala de Titanio',
    gridSize: 3,
    pattern: [
      [null, 'titanium_ingot', null],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'titanium_shovel', count: 1 },
  },
  {
    id: 'titanium_sword',
    name: 'Espada de Titanio',
    gridSize: 3,
    pattern: [
      [null, 'titanium_ingot', null],
      [null, 'titanium_ingot', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'titanium_sword', count: 1 },
  },
  {
    id: 'titanium_hoe',
    name: 'Azada de Titanio',
    gridSize: 3,
    pattern: [
      ['titanium_ingot', 'titanium_ingot', null],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'titanium_hoe', count: 1 },
  },

  // ==========================================
  // --- 7. Diamond Tools (Diamante) ---
  // ==========================================
  {
    id: 'diamond_pickaxe',
    name: 'Pico de Diamante',
    gridSize: 3,
    pattern: [
      ['diamond', 'diamond', 'diamond'],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'diamond_pickaxe', count: 1 },
  },
  {
    id: 'diamond_axe',
    name: 'Hacha de Diamante',
    gridSize: 3,
    pattern: [
      ['diamond', 'diamond', null],
      ['diamond', 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'diamond_axe', count: 1 },
  },
  {
    id: 'diamond_shovel',
    name: 'Pala de Diamante',
    gridSize: 3,
    pattern: [
      [null, 'diamond', null],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'diamond_shovel', count: 1 },
  },
  {
    id: 'diamond_sword',
    name: 'Espada de Diamante',
    gridSize: 3,
    pattern: [
      [null, 'diamond', null],
      [null, 'diamond', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'diamond_sword', count: 1 },
  },
  {
    id: 'diamond_hoe',
    name: 'Azada de Diamante',
    gridSize: 3,
    pattern: [
      ['diamond', 'diamond', null],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'diamond_hoe', count: 1 },
  },

  // TNT (3x3)
  {
    id: 'tnt',
    name: 'TNT',
    gridSize: 3,
    pattern: [
      ['sand', 'coal', 'sand'],
      ['coal', 'sand', 'coal'],
      ['sand', 'coal', 'sand'],
    ],
    result: { itemId: 'tnt', count: 1 },
  },

  // Raw Iron Smelting / Conversion (2x2)
  {
    id: 'iron_ingot_smelt',
    name: 'Lingote de Hierro',
    gridSize: 2,
    pattern: [
      ['iron_ore', null],
      [null, null],
    ],
    result: { itemId: 'iron_ingot', count: 1 },
  },
  // Raw Gold Smelting / Conversion (2x2)
  {
    id: 'gold_ingot_smelt',
    name: 'Lingote de Oro',
    gridSize: 2,
    pattern: [
      ['gold_ore', null],
      [null, null],
    ],
    result: { itemId: 'gold_ingot', count: 1 },
  },

  // Raw Copper -> Copper Ingot (2x2)
  {
    id: 'copper_ingot_smelt',
    name: 'Lingote de Cobre',
    gridSize: 2,
    pattern: [
      ['raw_copper', null],
      [null, null],
    ],
    result: { itemId: 'copper_ingot', count: 1 },
  },
  // Copper Ore -> Copper Ingot (2x2)
  {
    id: 'copper_ore_smelt',
    name: 'Lingote de Cobre',
    gridSize: 2,
    pattern: [
      ['copper_ore', null],
      [null, null],
    ],
    result: { itemId: 'copper_ingot', count: 1 },
  },
  // 1 Copper Ingot -> 4 Copper Wires (2x2)
  {
    id: 'copper_wire',
    name: 'Cables de Cobre',
    gridSize: 2,
    pattern: [
      ['copper_ingot', null],
      [null, null],
    ],
    result: { itemId: 'copper_wire', count: 4 },
  },
  // 9 Copper Ingots -> Copper Block (3x3)
  {
    id: 'copper_block',
    name: 'Bloque de Cobre',
    gridSize: 3,
    pattern: [
      ['copper_ingot', 'copper_ingot', 'copper_ingot'],
      ['copper_ingot', 'copper_ingot', 'copper_ingot'],
      ['copper_ingot', 'copper_ingot', 'copper_ingot'],
    ],
    result: { itemId: 'copper_block', count: 1 },
  },
  // 1 Copper Block -> 9 Copper Ingots (2x2)
  {
    id: 'copper_decompact',
    name: 'Lingotes de Cobre',
    gridSize: 2,
    pattern: [
      ['copper_block', null],
      [null, null],
    ],
    result: { itemId: 'copper_ingot', count: 9 },
  },
  // Copper Switch / Lever (2x2)
  {
    id: 'copper_switch',
    name: 'Interruptor de Cobre',
    gridSize: 2,
    pattern: [
      ['stick', null],
      ['copper_wire', null],
    ],
    result: { itemId: 'copper_switch', count: 1 },
  },
  // Copper Lamp (3x3)
  {
    id: 'copper_lamp',
    name: 'Lámpara de Cobre',
    gridSize: 3,
    pattern: [
      ['glass', 'copper_wire', 'glass'],
      ['copper_wire', 'torch', 'copper_wire'],
      ['glass', 'copper_wire', 'glass'],
    ],
    result: { itemId: 'copper_lamp', count: 1 },
  },
  // Bucket / Cubo de Hierro (3x3)
  {
    id: 'bucket',
    name: 'Cubo Vacío',
    gridSize: 3,
    pattern: [
      ['iron_ingot', null, 'iron_ingot'],
      [null, 'iron_ingot', null],
      [null, null, null],
    ],
    result: { itemId: 'bucket', count: 1 },
  },
  // Mochila Pequeña (3x3)
  {
    id: 'small_backpack',
    name: 'Mochila Pequeña',
    gridSize: 3,
    pattern: [
      ['leather', 'leather', 'leather'],
      ['leather', 'storage_wood', 'leather'],
      ['leather', 'leather', 'leather'],
    ],
    result: { itemId: 'small_backpack', count: 1 },
  },
  {
    id: 'small_backpack_alt',
    name: 'Mochila Pequeña',
    gridSize: 3,
    pattern: [
      ['leather', 'leather', 'leather'],
      ['leather', 'chest', 'leather'],
      ['leather', 'leather', 'leather'],
    ],
    result: { itemId: 'small_backpack', count: 1 },
  },
  // Mochila Mediana (3x3)
  {
    id: 'medium_backpack',
    name: 'Mochila Mediana',
    gridSize: 3,
    pattern: [
      ['copper_ingot', 'small_backpack', 'copper_ingot'],
      ['iron_ingot', 'leather', 'iron_ingot'],
      ['iron_ingot', 'copper_ingot', 'iron_ingot'],
    ],
    result: { itemId: 'medium_backpack', count: 1 },
  },
  // Mochila Grande (3x3)
  {
    id: 'large_backpack',
    name: 'Mochila Grande',
    gridSize: 3,
    pattern: [
      ['gold_ingot', 'medium_backpack', 'gold_ingot'],
      ['diamond', 'leather', 'diamond'],
      ['gold_ingot', 'diamond', 'gold_ingot'],
    ],
    result: { itemId: 'large_backpack', count: 1 },
  },

  // Armaduras de Cuero (Leather Armor)
  {
    id: 'leather_helmet',
    name: 'Casco de Cuero',
    gridSize: 3,
    pattern: [
      ['leather', 'leather', 'leather'],
      ['leather', null, 'leather'],
      [null, null, null],
    ],
    result: { itemId: 'leather_helmet', count: 1 },
  },
  {
    id: 'leather_chestplate',
    name: 'Peto de Cuero',
    gridSize: 3,
    pattern: [
      ['leather', null, 'leather'],
      ['leather', 'leather', 'leather'],
      ['leather', 'leather', 'leather'],
    ],
    result: { itemId: 'leather_chestplate', count: 1 },
  },
  {
    id: 'leather_leggings',
    name: 'Pantalones de Cuero',
    gridSize: 3,
    pattern: [
      ['leather', 'leather', 'leather'],
      ['leather', null, 'leather'],
      ['leather', null, 'leather'],
    ],
    result: { itemId: 'leather_leggings', count: 1 },
  },
  {
    id: 'leather_boots',
    name: 'Botas de Cuero',
    gridSize: 3,
    pattern: [
      ['leather', null, 'leather'],
      ['leather', null, 'leather'],
      [null, null, null],
    ],
    result: { itemId: 'leather_boots', count: 1 },
  },

  // Armaduras de Cobre (Copper Armor)
  {
    id: 'copper_helmet',
    name: 'Casco de Cobre',
    gridSize: 3,
    pattern: [
      ['copper_ingot', 'copper_ingot', 'copper_ingot'],
      ['copper_ingot', null, 'copper_ingot'],
      [null, null, null],
    ],
    result: { itemId: 'copper_helmet', count: 1 },
  },
  {
    id: 'copper_chestplate',
    name: 'Peto de Cobre',
    gridSize: 3,
    pattern: [
      ['copper_ingot', null, 'copper_ingot'],
      ['copper_ingot', 'copper_ingot', 'copper_ingot'],
      ['copper_ingot', 'copper_ingot', 'copper_ingot'],
    ],
    result: { itemId: 'copper_chestplate', count: 1 },
  },
  {
    id: 'copper_leggings',
    name: 'Pantalones de Cobre',
    gridSize: 3,
    pattern: [
      ['copper_ingot', 'copper_ingot', 'copper_ingot'],
      ['copper_ingot', null, 'copper_ingot'],
      ['copper_ingot', null, 'copper_ingot'],
    ],
    result: { itemId: 'copper_leggings', count: 1 },
  },
  {
    id: 'copper_boots',
    name: 'Botas de Cobre',
    gridSize: 3,
    pattern: [
      ['copper_ingot', null, 'copper_ingot'],
      ['copper_ingot', null, 'copper_ingot'],
      [null, null, null],
    ],
    result: { itemId: 'copper_boots', count: 1 },
  },

  // Armaduras de Hierro (Iron Armor)
  {
    id: 'iron_helmet',
    name: 'Casco de Hierro',
    gridSize: 3,
    pattern: [
      ['iron_ingot', 'iron_ingot', 'iron_ingot'],
      ['iron_ingot', null, 'iron_ingot'],
      [null, null, null],
    ],
    result: { itemId: 'iron_helmet', count: 1 },
  },
  {
    id: 'iron_chestplate',
    name: 'Peto de Hierro',
    gridSize: 3,
    pattern: [
      ['iron_ingot', null, 'iron_ingot'],
      ['iron_ingot', 'iron_ingot', 'iron_ingot'],
      ['iron_ingot', 'iron_ingot', 'iron_ingot'],
    ],
    result: { itemId: 'iron_chestplate', count: 1 },
  },
  {
    id: 'iron_leggings',
    name: 'Pantalones de Hierro',
    gridSize: 3,
    pattern: [
      ['iron_ingot', 'iron_ingot', 'iron_ingot'],
      ['iron_ingot', null, 'iron_ingot'],
      ['iron_ingot', null, 'iron_ingot'],
    ],
    result: { itemId: 'iron_leggings', count: 1 },
  },
  {
    id: 'iron_boots',
    name: 'Botas de Hierro',
    gridSize: 3,
    pattern: [
      ['iron_ingot', null, 'iron_ingot'],
      ['iron_ingot', null, 'iron_ingot'],
      [null, null, null],
    ],
    result: { itemId: 'iron_boots', count: 1 },
  },

  // Armaduras de Oro (Gold Armor)
  {
    id: 'gold_helmet',
    name: 'Casco de Oro',
    gridSize: 3,
    pattern: [
      ['gold_ingot', 'gold_ingot', 'gold_ingot'],
      ['gold_ingot', null, 'gold_ingot'],
      [null, null, null],
    ],
    result: { itemId: 'gold_helmet', count: 1 },
  },
  {
    id: 'gold_chestplate',
    name: 'Peto de Oro',
    gridSize: 3,
    pattern: [
      ['gold_ingot', null, 'gold_ingot'],
      ['gold_ingot', 'gold_ingot', 'gold_ingot'],
      ['gold_ingot', 'gold_ingot', 'gold_ingot'],
    ],
    result: { itemId: 'gold_chestplate', count: 1 },
  },
  {
    id: 'gold_leggings',
    name: 'Pantalones de Oro',
    gridSize: 3,
    pattern: [
      ['gold_ingot', 'gold_ingot', 'gold_ingot'],
      ['gold_ingot', null, 'gold_ingot'],
      ['gold_ingot', null, 'gold_ingot'],
    ],
    result: { itemId: 'gold_leggings', count: 1 },
  },
  {
    id: 'gold_boots',
    name: 'Botas de Oro',
    gridSize: 3,
    pattern: [
      ['gold_ingot', null, 'gold_ingot'],
      ['gold_ingot', null, 'gold_ingot'],
      [null, null, null],
    ],
    result: { itemId: 'gold_boots', count: 1 },
  },

  // Armaduras de Diamante (Diamond Armor)
  {
    id: 'diamond_helmet',
    name: 'Casco de Diamante',
    gridSize: 3,
    pattern: [
      ['diamond', 'diamond', 'diamond'],
      ['diamond', null, 'diamond'],
      [null, null, null],
    ],
    result: { itemId: 'diamond_helmet', count: 1 },
  },
  {
    id: 'diamond_chestplate',
    name: 'Peto de Diamante',
    gridSize: 3,
    pattern: [
      ['diamond', null, 'diamond'],
      ['diamond', 'diamond', 'diamond'],
      ['diamond', 'diamond', 'diamond'],
    ],
    result: { itemId: 'diamond_chestplate', count: 1 },
  },
  {
    id: 'diamond_leggings',
    name: 'Pantalones de Diamante',
    gridSize: 3,
    pattern: [
      ['diamond', 'diamond', 'diamond'],
      ['diamond', null, 'diamond'],
      ['diamond', null, 'diamond'],
    ],
    result: { itemId: 'diamond_leggings', count: 1 },
  },
  {
    id: 'diamond_boots',
    name: 'Botas de Diamante',
    gridSize: 3,
    pattern: [
      ['diamond', null, 'diamond'],
      ['diamond', null, 'diamond'],
      [null, null, null],
    ],
    result: { itemId: 'diamond_boots', count: 1 },
  },

  // --- HORNO (Furnace) ---
  {
    id: 'furnace',
    name: 'Horno',
    gridSize: 3,
    pattern: [
      ['cobblestone', 'cobblestone', 'cobblestone'],
      ['cobblestone', null, 'cobblestone'],
      ['cobblestone', 'cobblestone', 'cobblestone'],
    ],
    result: { itemId: 'furnace', count: 1 },
  },

  // --- FAROLILLO (Lantern) ---
  {
    id: 'lantern',
    name: 'Farolillo',
    gridSize: 3,
    pattern: [
      ['iron_ingot', 'iron_ingot', 'iron_ingot'],
      ['iron_ingot', 'torch', 'iron_ingot'],
      ['iron_ingot', 'iron_ingot', 'iron_ingot'],
    ],
    result: { itemId: 'lantern', count: 1 },
  },
  {
    id: 'lantern_simple',
    name: 'Farolillo',
    gridSize: 2,
    pattern: [
      ['iron_ingot', null],
      ['torch', null],
    ],
    result: { itemId: 'lantern', count: 1 },
  },

  // --- ANTORCHA CON CARBÓN ---
  {
    id: 'torch_coal',
    name: 'Antorchas',
    gridSize: 2,
    pattern: [
      ['coal', null],
      ['stick', null],
    ],
    result: { itemId: 'torch', count: 4 },
  },

  // --- PUERTAS (Doors: 11 clases completas) ---
  {
    id: 'oak_door',
    name: 'Puerta de Roble',
    gridSize: 3,
    pattern: [
      ['planks', 'planks', null],
      ['planks', 'planks', null],
      ['planks', 'planks', null],
    ],
    result: { itemId: 'oak_door', count: 3 },
  },
  {
    id: 'birch_door',
    name: 'Puerta de Abedul',
    gridSize: 3,
    pattern: [
      ['birch_planks', 'birch_planks', null],
      ['birch_planks', 'birch_planks', null],
      ['birch_planks', 'birch_planks', null],
    ],
    result: { itemId: 'birch_door', count: 3 },
  },
  {
    id: 'spruce_door',
    name: 'Puerta de Abeto',
    gridSize: 3,
    pattern: [
      ['spruce_planks', 'spruce_planks', null],
      ['spruce_planks', 'spruce_planks', null],
      ['spruce_planks', 'spruce_planks', null],
    ],
    result: { itemId: 'spruce_door', count: 3 },
  },
  {
    id: 'jungle_door',
    name: 'Puerta de Jungla',
    gridSize: 3,
    pattern: [
      ['jungle_wood', 'jungle_wood', null],
      ['jungle_wood', 'jungle_wood', null],
      ['jungle_wood', 'jungle_wood', null],
    ],
    result: { itemId: 'jungle_door', count: 3 },
  },
  {
    id: 'acacia_door',
    name: 'Puerta de Acacia',
    gridSize: 3,
    pattern: [
      ['acacia_planks', 'acacia_planks', null],
      ['acacia_planks', 'acacia_planks', null],
      ['acacia_planks', 'acacia_planks', null],
    ],
    result: { itemId: 'acacia_door', count: 3 },
  },
  {
    id: 'dark_oak_door',
    name: 'Puerta de Roble Oscuro',
    gridSize: 3,
    pattern: [
      ['dark_oak_planks', 'dark_oak_planks', null],
      ['dark_oak_planks', 'dark_oak_planks', null],
      ['dark_oak_planks', 'dark_oak_planks', null],
    ],
    result: { itemId: 'dark_oak_door', count: 3 },
  },
  {
    id: 'mangrove_door',
    name: 'Puerta de Mangle',
    gridSize: 3,
    pattern: [
      ['mangrove_wood', 'mangrove_wood', null],
      ['mangrove_wood', 'mangrove_wood', null],
      ['mangrove_wood', 'mangrove_wood', null],
    ],
    result: { itemId: 'mangrove_door', count: 3 },
  },
  {
    id: 'cherry_door',
    name: 'Puerta de Cerezo',
    gridSize: 3,
    pattern: [
      ['cherry_planks', 'cherry_planks', null],
      ['cherry_planks', 'cherry_planks', null],
      ['cherry_planks', 'cherry_planks', null],
    ],
    result: { itemId: 'cherry_door', count: 3 },
  },
  {
    id: 'iron_door',
    name: 'Puerta de Hierro',
    gridSize: 3,
    pattern: [
      ['iron_ingot', 'iron_ingot', null],
      ['iron_ingot', 'iron_ingot', null],
      ['iron_ingot', 'iron_ingot', null],
    ],
    result: { itemId: 'iron_door', count: 3 },
  },
  {
    id: 'copper_door',
    name: 'Puerta de Cobre',
    gridSize: 3,
    pattern: [
      ['copper_ingot', 'copper_ingot', null],
      ['copper_ingot', 'copper_ingot', null],
      ['copper_ingot', 'copper_ingot', null],
    ],
    result: { itemId: 'copper_door', count: 3 },
  },
  {
    id: 'diamond_door',
    name: 'Puerta de Diamante',
    gridSize: 3,
    pattern: [
      ['diamond', 'diamond', null],
      ['diamond', 'diamond', null],
      ['diamond', 'diamond', null],
    ],
    result: { itemId: 'diamond_door', count: 3 },
  },

  // --- ARMADURA DE ORO (Gold Armor) ---
  {
    id: 'gold_helmet',
    name: 'Casco de Oro',
    gridSize: 3,
    pattern: [
      ['gold_ingot', 'gold_ingot', 'gold_ingot'],
      ['gold_ingot', null, 'gold_ingot'],
      [null, null, null],
    ],
    result: { itemId: 'gold_helmet', count: 1 },
  },
  {
    id: 'gold_chestplate',
    name: 'Peto de Oro',
    gridSize: 3,
    pattern: [
      ['gold_ingot', null, 'gold_ingot'],
      ['gold_ingot', 'gold_ingot', 'gold_ingot'],
      ['gold_ingot', 'gold_ingot', 'gold_ingot'],
    ],
    result: { itemId: 'gold_chestplate', count: 1 },
  },
  {
    id: 'gold_leggings',
    name: 'Pantalones de Oro',
    gridSize: 3,
    pattern: [
      ['gold_ingot', 'gold_ingot', 'gold_ingot'],
      ['gold_ingot', null, 'gold_ingot'],
      ['gold_ingot', null, 'gold_ingot'],
    ],
    result: { itemId: 'gold_leggings', count: 1 },
  },
  {
    id: 'gold_boots',
    name: 'Botas de Oro',
    gridSize: 3,
    pattern: [
      ['gold_ingot', null, 'gold_ingot'],
      ['gold_ingot', null, 'gold_ingot'],
      [null, null, null],
    ],
    result: { itemId: 'gold_boots', count: 1 },
  },
  {
    id: 'gold_sword',
    name: 'Espada de Oro',
    gridSize: 3,
    pattern: [
      [null, 'gold_ingot', null],
      [null, 'gold_ingot', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'gold_sword', count: 1 },
  },
  {
    id: 'gold_pickaxe',
    name: 'Pico de Oro',
    gridSize: 3,
    pattern: [
      ['gold_ingot', 'gold_ingot', 'gold_ingot'],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'gold_pickaxe', count: 1 },
  },

  // --- ARMADURA DE TITANIO (Titanium Armor) ---
  {
    id: 'titanium_helmet',
    name: 'Casco de Titanio',
    gridSize: 3,
    pattern: [
      ['titanium_ingot', 'titanium_ingot', 'titanium_ingot'],
      ['titanium_ingot', null, 'titanium_ingot'],
      [null, null, null],
    ],
    result: { itemId: 'titanium_helmet', count: 1 },
  },
  {
    id: 'titanium_chestplate',
    name: 'Peto de Titanio',
    gridSize: 3,
    pattern: [
      ['titanium_ingot', null, 'titanium_ingot'],
      ['titanium_ingot', 'titanium_ingot', 'titanium_ingot'],
      ['titanium_ingot', 'titanium_ingot', 'titanium_ingot'],
    ],
    result: { itemId: 'titanium_chestplate', count: 1 },
  },
  {
    id: 'titanium_leggings',
    name: 'Pantalones de Titanio',
    gridSize: 3,
    pattern: [
      ['titanium_ingot', 'titanium_ingot', 'titanium_ingot'],
      ['titanium_ingot', null, 'titanium_ingot'],
      ['titanium_ingot', null, 'titanium_ingot'],
    ],
    result: { itemId: 'titanium_leggings', count: 1 },
  },
  {
    id: 'titanium_boots',
    name: 'Botas de Titanio',
    gridSize: 3,
    pattern: [
      ['titanium_ingot', null, 'titanium_ingot'],
      ['titanium_ingot', null, 'titanium_ingot'],
      [null, null, null],
    ],
    result: { itemId: 'titanium_boots', count: 1 },
  },

  // Herramientas de Titanio
  {
    id: 'titanium_sword',
    name: 'Espada de Titanio',
    gridSize: 3,
    pattern: [
      [null, 'titanium_ingot', null],
      [null, 'titanium_ingot', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'titanium_sword', count: 1 },
  },
  {
    id: 'titanium_pickaxe',
    name: 'Pico de Titanio',
    gridSize: 3,
    pattern: [
      ['titanium_ingot', 'titanium_ingot', 'titanium_ingot'],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'titanium_pickaxe', count: 1 },
  },
  {
    id: 'titanium_axe',
    name: 'Hacha de Titanio',
    gridSize: 3,
    pattern: [
      ['titanium_ingot', 'titanium_ingot', null],
      ['titanium_ingot', 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'titanium_axe', count: 1 },
  },
  {
    id: 'titanium_shovel',
    name: 'Pala de Titanio',
    gridSize: 3,
    pattern: [
      [null, 'titanium_ingot', null],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
    result: { itemId: 'titanium_shovel', count: 1 },
  },

  // Bloque de Titanio
  {
    id: 'titanium_block',
    name: 'Bloque de Titanio',
    gridSize: 3,
    pattern: [
      ['titanium_ingot', 'titanium_ingot', 'titanium_ingot'],
      ['titanium_ingot', 'titanium_ingot', 'titanium_ingot'],
      ['titanium_ingot', 'titanium_ingot', 'titanium_ingot'],
    ],
    result: { itemId: 'titanium_block', count: 1 },
  },

  // --- CAJAS DE ALMACENAMIENTO DE NIVELES (TIERED STORAGE CRATES) ---
  // Caja de Hierro (45 ranuras)
  {
    id: 'storage_iron',
    name: 'Caja de Almacenamiento de Hierro',
    gridSize: 3,
    pattern: [
      ['iron_ingot', 'iron_ingot', 'iron_ingot'],
      ['iron_ingot', 'storage_wood', 'iron_ingot'],
      ['iron_ingot', 'iron_ingot', 'iron_ingot'],
    ],
    result: { itemId: 'storage_iron', count: 1 },
  },
  // Caja de Titanio (63 ranuras)
  {
    id: 'storage_titanium',
    name: 'Caja de Almacenamiento de Titanio',
    gridSize: 3,
    pattern: [
      ['titanium_ingot', 'titanium_ingot', 'titanium_ingot'],
      ['titanium_ingot', 'storage_iron', 'titanium_ingot'],
      ['titanium_ingot', 'titanium_ingot', 'titanium_ingot'],
    ],
    result: { itemId: 'storage_titanium', count: 1 },
  },
  // Caja de Diamante (81 ranuras)
  {
    id: 'storage_diamond',
    name: 'Caja de Almacenamiento de Diamante',
    gridSize: 3,
    pattern: [
      ['diamond', 'diamond', 'diamond'],
      ['diamond', 'storage_titanium', 'diamond'],
      ['diamond', 'diamond', 'diamond'],
    ],
    result: { itemId: 'storage_diamond', count: 1 },
  },
];

// Helper to check match between input grid and recipe pattern with flexible offsets
export function matchRecipe(grid: (string | null)[][], size: 2 | 3): { itemId: string; count: number } | null {
  // Count non-empty items
  let totalItems = 0;
  let singleItem: string | null = null;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r]?.[c]) {
        totalItems++;
        singleItem = grid[r][c];
      }
    }
  }

  // 1. Single-item shapeless recipes (wood -> planks, jungle_wood -> planks, ores -> ingots)
  if (totalItems === 1 && singleItem) {
    if (singleItem === 'wood' || singleItem === 'jungle_wood') {
      return { itemId: 'planks', count: 4 };
    }
    if (singleItem === 'spruce_wood') {
      return { itemId: 'spruce_planks', count: 4 };
    }
    if (singleItem === 'birch_wood') {
      return { itemId: 'birch_planks', count: 4 };
    }
    if (singleItem === 'dark_oak_wood') {
      return { itemId: 'dark_oak_planks', count: 4 };
    }
    if (singleItem === 'acacia_wood') {
      return { itemId: 'acacia_planks', count: 4 };
    }
    if (singleItem === 'mangrove_wood') {
      return { itemId: 'planks', count: 4 };
    }
    if (singleItem === 'cherry_wood') {
      return { itemId: 'cherry_planks', count: 4 };
    }
    if (singleItem === 'copper_block') {
      return { itemId: 'copper_ingot', count: 9 };
    }
    if (singleItem === 'titanium_block') {
      return { itemId: 'titanium_ingot', count: 9 };
    }
    if (singleItem === 'copper_ingot') {
      return { itemId: 'copper_wire', count: 4 };
    }
    if (singleItem === 'raw_copper' || singleItem === 'copper_ore') {
      return { itemId: 'copper_ingot', count: 1 };
    }
    if (singleItem === 'iron_ore') {
      return { itemId: 'iron_ingot', count: 1 };
    }
    if (singleItem === 'gold_ore') {
      return { itemId: 'gold_ingot', count: 1 };
    }
  }

  // 2. Normalized bounding box matching for shaped recipes
  const trimmed = trimGrid(grid, size);
  if (!trimmed) return null;

  for (const recipe of RECIPES) {
    if (recipe.gridSize > size) continue;

    const recipeTrimmed = trimGrid(recipe.pattern, recipe.gridSize);
    if (!recipeTrimmed) continue;

    // Check direct match or mirrored match (e.g. axes can be placed left or right)
    if (areGridsEqual(trimmed, recipeTrimmed)) {
      return recipe.result;
    }

    // Check horizontally mirrored pattern (e.g. axe facing right)
    const mirrored = mirrorGridH(recipeTrimmed);
    if (areGridsEqual(trimmed, mirrored)) {
      return recipe.result;
    }
  }

  return null;
}

function trimGrid(grid: (string | null)[][], size: number): (string | null)[][] | null {
  let minR = size, maxR = -1, minC = size, maxC = -1;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r]?.[c]) {
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }
  }

  if (maxR === -1) return null; // completely empty

  const trimmed: (string | null)[][] = [];
  for (let r = minR; r <= maxR; r++) {
    const row: (string | null)[] = [];
    for (let c = minC; c <= maxC; c++) {
      row.push(grid[r]?.[c] || null);
    }
    trimmed.push(row);
  }
  return trimmed;
}

function mirrorGridH(grid: (string | null)[][]): (string | null)[][] {
  return grid.map(row => [...row].reverse());
}

function areGridsEqual(a: (string | null)[][], b: (string | null)[][]): boolean {
  if (a.length !== b.length) return false;
  for (let r = 0; r < a.length; r++) {
    if (a[r].length !== b[r].length) return false;
    for (let c = 0; c < a[r].length; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}
