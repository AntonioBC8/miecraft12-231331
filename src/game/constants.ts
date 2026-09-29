/**
 * Minecraft Web 3D - Constants & Block Definitions
 */

export enum BlockType {
  AIR = 0,
  GRASS = 1,
  DIRT = 2,
  STONE = 3,
  COBBLESTONE = 4,
  WOOD = 5,
  LEAVES = 6,
  PLANKS = 7,
  SAND = 8,
  GLASS = 9,
  WATER = 10,
  BEDROCK = 11,
  COAL_ORE = 12,
  IRON_ORE = 13,
  GOLD_ORE = 14,
  DIAMOND_ORE = 15,
  TORCH = 16,
  CRAFTING_TABLE = 17,
  BRICK = 18,
  BOOKSHELF = 19,
  TNT = 20,
  WOOL_WHITE = 21,
  WOOL_RED = 22,
  WOOL_BLUE = 23,
  POPPY = 24,
  DANDELION = 25,
  DEEPSLATE = 26,
  COPPER_ORE = 27,
  DEEPSLATE_COPPER_ORE = 28,
  DEEPSLATE_COAL_ORE = 29,
  DEEPSLATE_IRON_ORE = 30,
  DEEPSLATE_GOLD_ORE = 31,
  DEEPSLATE_DIAMOND_ORE = 32,
  COPPER_BLOCK = 33,
  COPPER_WIRE = 34,
  COPPER_WIRE_ON = 35,
  COPPER_LAMP = 36,
  COPPER_LAMP_ON = 37,
  COPPER_SWITCH = 38,
  COPPER_SWITCH_ON = 39,
  TERRACOTTA = 40,
  RED_SAND = 41,
  CACTUS = 42,
  SANDSTONE = 43,
  CHISELED_SANDSTONE = 44,
  JUNGLE_WOOD = 45,
  JUNGLE_LEAVES = 46,
  KELP = 47,
  STORAGE_WOOD = 48,
  CHEST = 48, // Alias for backwards-compatibility
  // New Biome Blocks & Items
  SNOW_BLOCK = 49,
  SNOW_GRASS = 50,
  ICE = 51,
  PACKED_ICE = 52,
  BLUE_ICE = 53,
  SPRUCE_WOOD = 54,
  SPRUCE_LEAVES = 55,
  SPRUCE_PLANKS = 56,
  BIRCH_WOOD = 57,
  BIRCH_LEAVES = 58,
  BIRCH_PLANKS = 59,
  DARK_OAK_WOOD = 60,
  DARK_OAK_LEAVES = 61,
  DARK_OAK_PLANKS = 62,
  ACACIA_WOOD = 63,
  ACACIA_LEAVES = 64,
  ACACIA_PLANKS = 65,
  MANGROVE_WOOD = 66,
  MANGROVE_LEAVES = 67,
  MANGROVE_ROOTS = 68,
  CHERRY_WOOD = 69,
  CHERRY_LEAVES = 70,
  CHERRY_PLANKS = 71,
  SUNFLOWER = 72,
  CORNFLOWER = 73,
  TULIP = 74,
  LILY_PAD = 75,
  SUGAR_CANE = 76,
  RED_MUSHROOM = 77,
  BROWN_MUSHROOM = 78,
  MUSHROOM_BLOCK_RED = 79,
  MUSHROOM_BLOCK_BROWN = 80,
  MUSHROOM_STEM = 81,
  MYCELIUM = 82,
  CORAL_BLOCK = 83,
  SEA_PICKLE = 84,
  MUD = 85,
  PACKED_MUD = 86,
  PODZOL = 87,
  COARSE_DIRT = 88,
  GRAVEL = 89,
  RED_SANDSTONE = 90,
  TERRACOTTA_ORANGE = 91,
  TERRACOTTA_YELLOW = 92,
  TERRACOTTA_WHITE = 93,
  LAVA = 94,
  OBSIDIAN = 95,
  TITANIUM_ORE = 96,
  DEEPSLATE_TITANIUM_ORE = 97,
  TITANIUM_BLOCK = 98,
  CRUDE_OIL = 99,
  PETROLEUM_ORE = 99, // Alias for backwards-compatibility
  FURNACE = 100,
  FURNACE_LIT = 101,
  LANTERN = 102,
  STORAGE_IRON = 103,
  REINFORCED_CABLE = 104,
  STORAGE_TITANIUM = 105,
  STORAGE_DIAMOND = 106,
  DOOR_OAK_BOTTOM = 109,
  DOOR_OAK_TOP = 110,
  DOOR_BIRCH_BOTTOM = 111,
  DOOR_BIRCH_TOP = 112,
  DOOR_SPRUCE_BOTTOM = 113,
  DOOR_SPRUCE_TOP = 114,
  DOOR_JUNGLE_BOTTOM = 115,
  DOOR_JUNGLE_TOP = 116,
  DOOR_ACACIA_BOTTOM = 117,
  DOOR_ACACIA_TOP = 118,
  DOOR_DARK_OAK_BOTTOM = 119,
  DOOR_DARK_OAK_TOP = 120,
  DOOR_MANGROVE_BOTTOM = 121,
  DOOR_MANGROVE_TOP = 122,
  DOOR_CHERRY_BOTTOM = 123,
  DOOR_CHERRY_TOP = 124,
  DOOR_IRON_BOTTOM = 125,
  DOOR_IRON_TOP = 126,
  DOOR_COPPER_BOTTOM = 127,
  DOOR_COPPER_TOP = 128,
  DOOR_DIAMOND_BOTTOM = 129,
  DOOR_DIAMOND_TOP = 130,
  // Wild grass & biome foliage
  SHORT_GRASS = 131,
  MEDIUM_GRASS = 132,
  TALL_GRASS = 133,
  FERN = 134,
  DEAD_BUSH = 135,
  FROSTED_GRASS = 136,
}

export function isStorageBox(block: BlockType): boolean {
  return (
    block === BlockType.STORAGE_WOOD ||
    block === BlockType.STORAGE_IRON ||
    block === BlockType.STORAGE_TITANIUM ||
    block === BlockType.STORAGE_DIAMOND
  );
}

export function getStorageBoxCapacity(block: BlockType): number {
  switch (block) {
    case BlockType.STORAGE_WOOD:
      return 27; // 3 rows of 9
    case BlockType.STORAGE_IRON:
      return 45; // 5 rows of 9
    case BlockType.STORAGE_TITANIUM:
      return 63; // 7 rows of 9
    case BlockType.STORAGE_DIAMOND:
      return 81; // 9 rows of 9
    default:
      return 27;
  }
}

export function getStorageBoxName(block: BlockType): string {
  switch (block) {
    case BlockType.STORAGE_WOOD:
      return 'Caja de Madera (27 Ranuras)';
    case BlockType.STORAGE_IRON:
      return 'Caja de Hierro (45 Ranuras)';
    case BlockType.STORAGE_TITANIUM:
      return 'Caja de Titanio (63 Ranuras)';
    case BlockType.STORAGE_DIAMOND:
      return 'Caja de Diamante (81 Ranuras)';
    default:
      return 'Caja de Almacenamiento';
  }
}

export function isDoor(block: BlockType): boolean {
  return block >= BlockType.DOOR_OAK_BOTTOM && block <= BlockType.DOOR_DIAMOND_TOP;
}

export function isDoorBottom(block: BlockType): boolean {
  return isDoor(block) && (block % 2 === 1);
}

export function isDoorTop(block: BlockType): boolean {
  return isDoor(block) && (block % 2 === 0);
}

export function getDoorTopType(bottomType: BlockType): BlockType {
  return (bottomType + 1) as BlockType;
}

export function getDoorBottomType(topType: BlockType): BlockType {
  return (topType - 1) as BlockType;
}

// Complete list of Minecraft Biomes requested
export type BiomeType =
  | 'plains'
  | 'sunflower_plains'
  | 'snowy_plains'
  | 'ice_spikes'
  | 'taiga'
  | 'snowy_taiga'
  | 'old_growth_pine_taiga'
  | 'old_growth_spruce_taiga'
  | 'forest'
  | 'flower_forest'
  | 'birch_forest'
  | 'old_growth_birch_forest'
  | 'dark_forest'
  | 'jungle'
  | 'sparse_jungle'
  | 'swamp'
  | 'mangrove_swamp'
  | 'desert'
  | 'badlands'
  | 'eroded_badlands'
  | 'wooded_badlands'
  | 'savanna'
  | 'savanna_plateau'
  | 'windswept_hills'
  | 'windswept_gravelly_hills'
  | 'windswept_forest'
  | 'windswept_savanna'
  | 'meadow'
  | 'grove'
  | 'snowy_slopes'
  | 'jagged_peaks'
  | 'frozen_peaks'
  | 'stony_peaks'
  | 'cherry_grove'
  | 'river'
  | 'frozen_river'
  | 'beach'
  | 'snowy_beach'
  | 'stony_shore'
  | 'warm_ocean'
  | 'lukewarm_ocean'
  | 'deep_lukewarm_ocean'
  | 'ocean'
  | 'deep_ocean'
  | 'cold_ocean'
  | 'deep_cold_ocean'
  | 'frozen_ocean'
  | 'deep_frozen_ocean'
  | 'mushroom_fields';

export const BIOME_NAMES: Record<BiomeType, string> = {
  plains: 'Llanuras',
  sunflower_plains: 'Llanuras de girasoles',
  snowy_plains: 'Llanuras nevadas',
  ice_spikes: 'Picos de hielo',
  taiga: 'Taiga',
  snowy_taiga: 'Taiga nevada',
  old_growth_pine_taiga: 'Taiga de pinos antiguos',
  old_growth_spruce_taiga: 'Taiga de abetos antiguos',
  forest: 'Bosque',
  flower_forest: 'Bosque de flores',
  birch_forest: 'Bosque de abedules',
  old_growth_birch_forest: 'Bosque de abedules antiguos',
  dark_forest: 'Bosque oscuro',
  jungle: 'Jungla',
  sparse_jungle: 'Jungla dispersa',
  swamp: 'Pantano',
  mangrove_swamp: 'Pantano de manglares',
  desert: 'Desierto',
  badlands: 'Tierras baldías',
  eroded_badlands: 'Tierras baldías erosionadas',
  wooded_badlands: 'Tierras baldías boscosas',
  savanna: 'Sabana',
  savanna_plateau: 'Meseta de sabana',
  windswept_hills: 'Colinas barridas por el viento',
  windswept_gravelly_hills: 'Colinas de grava barridas por el viento',
  windswept_forest: 'Bosque barrido por el viento',
  windswept_savanna: 'Sabana barrida por el viento',
  meadow: 'Prado',
  grove: 'Arboleda',
  snowy_slopes: 'Laderas nevadas',
  jagged_peaks: 'Picos escarpados',
  frozen_peaks: 'Picos helados',
  stony_peaks: 'Picos pedregosos',
  cherry_grove: 'Arboleda de cerezos',
  river: 'Río',
  frozen_river: 'Río helado',
  beach: 'Playa',
  snowy_beach: 'Playa nevada',
  stony_shore: 'Costa pedregosa',
  warm_ocean: 'Océano cálido',
  lukewarm_ocean: 'Océano tibio',
  deep_lukewarm_ocean: 'Océano tibio profundo',
  ocean: 'Océano',
  deep_ocean: 'Océano profundo',
  cold_ocean: 'Océano frío',
  deep_cold_ocean: 'Océano frío profundo',
  frozen_ocean: 'Océano helado',
  deep_frozen_ocean: 'Océano helado profundo',
  mushroom_fields: 'Campos de champiñones',
};

export type ToolType = 'none' | 'pickaxe' | 'axe' | 'shovel' | 'sword' | 'hoe';
export type ToolMaterial = 'wood' | 'stone' | 'copper' | 'gold' | 'iron' | 'titanium' | 'diamond';

export type ArmorSlot = 'helmet' | 'chestplate' | 'leggings' | 'boots';
export type ArmorMaterial = 'leather' | 'copper' | 'iron' | 'gold' | 'diamond' | 'titanium';

export interface ArmorItemConfig {
  slot: ArmorSlot;
  material: ArmorMaterial;
  defense: number;
  name: string;
}

export const ARMOR_DEFENSE: Record<string, ArmorItemConfig> = {
  // Cuero (Leather)
  leather_helmet: { slot: 'helmet', material: 'leather', defense: 1, name: 'Casco de Cuero' },
  leather_chestplate: { slot: 'chestplate', material: 'leather', defense: 3, name: 'Peto de Cuero' },
  leather_leggings: { slot: 'leggings', material: 'leather', defense: 2, name: 'Pantalones de Cuero' },
  leather_boots: { slot: 'boots', material: 'leather', defense: 1, name: 'Botas de Cuero' },

  // Cobre (Copper)
  copper_helmet: { slot: 'helmet', material: 'copper', defense: 2, name: 'Casco de Cobre' },
  copper_chestplate: { slot: 'chestplate', material: 'copper', defense: 4, name: 'Peto de Cobre' },
  copper_leggings: { slot: 'leggings', material: 'copper', defense: 3, name: 'Pantalones de Cobre' },
  copper_boots: { slot: 'boots', material: 'copper', defense: 1, name: 'Botas de Cobre' },

  // Oro (Gold)
  gold_helmet: { slot: 'helmet', material: 'gold', defense: 2, name: 'Casco de Oro' },
  gold_chestplate: { slot: 'chestplate', material: 'gold', defense: 5, name: 'Peto de Oro' },
  gold_leggings: { slot: 'leggings', material: 'gold', defense: 3, name: 'Pantalones de Oro' },
  gold_boots: { slot: 'boots', material: 'gold', defense: 1, name: 'Botas de Oro' },

  // Hierro (Iron)
  iron_helmet: { slot: 'helmet', material: 'iron', defense: 2, name: 'Casco de Hierro' },
  iron_chestplate: { slot: 'chestplate', material: 'iron', defense: 6, name: 'Peto de Hierro' },
  iron_leggings: { slot: 'leggings', material: 'iron', defense: 5, name: 'Pantalones de Hierro' },
  iron_boots: { slot: 'boots', material: 'iron', defense: 2, name: 'Botas de Hierro' },

  // Titanio (Titanium) - Abundante pero entre hierro y diamante
  titanium_helmet: { slot: 'helmet', material: 'titanium', defense: 3, name: 'Casco de Titanio' },
  titanium_chestplate: { slot: 'chestplate', material: 'titanium', defense: 7, name: 'Peto de Titanio' },
  titanium_leggings: { slot: 'leggings', material: 'titanium', defense: 5, name: 'Pantalones de Titanio' },
  titanium_boots: { slot: 'boots', material: 'titanium', defense: 3, name: 'Botas de Titanio' },

  // Diamante (Diamond)
  diamond_helmet: { slot: 'helmet', material: 'diamond', defense: 3, name: 'Casco de Diamante' },
  diamond_chestplate: { slot: 'chestplate', material: 'diamond', defense: 8, name: 'Peto de Diamante' },
  diamond_leggings: { slot: 'leggings', material: 'diamond', defense: 6, name: 'Pantalones de Diamante' },
  diamond_boots: { slot: 'boots', material: 'diamond', defense: 3, name: 'Botas de Diamante' },
};

export interface BackpackConfig {
  id: string;
  name: string;
  slots: number;
  description: string;
}

export const BACKPACK_CONFIGS: Record<string, BackpackConfig> = {
  small_backpack: { id: 'small_backpack', name: 'Mochila Pequeña', slots: 9, description: 'Mochila de cuero básica. +9 ranuras de botín extra' },
  medium_backpack: { id: 'medium_backpack', name: 'Mochila Mediana', slots: 18, description: 'Mochila reforzada con cobre y hierro. +18 ranuras de botín extra' },
  large_backpack: { id: 'large_backpack', name: 'Mochila Grande', slots: 27, description: 'Mochila de explorador de gran capacidad. +27 ranuras de botín extra' },
};

export const DEFAULT_MAX_STACK = 100;

export interface ItemDefinition {
  id: string;
  name: string;
  isBlock: boolean;
  blockType?: BlockType;
  toolType?: ToolType;
  toolMaterial?: ToolMaterial;
  toolEfficiency?: number; // multiplier for mining
  attackDamage?: number;
  armorSlot?: ArmorSlot;
  armorMaterial?: ArmorMaterial;
  defensePoints?: number;
  backpackSlots?: number;
  maxStack: number;
  icon?: string;
  description?: string;
}

export interface BlockConfig {
  id: BlockType;
  name: string;
  hardness: number; // Seconds to break with bare hands (0 = instant, e.g. torch, flowers; bedrock = -1 unbreakable)
  bestTool: ToolType;
  transparent: boolean;
  solid: boolean;
  lightLevel?: number; // 0-15
  drops: { itemId: string; count: number };
  color: string; // Fallback / particle color hex
}

export const BLOCK_CONFIGS: Record<BlockType, BlockConfig> = {
  [BlockType.AIR]: {
    id: BlockType.AIR,
    name: 'Aire',
    hardness: 0,
    bestTool: 'none',
    transparent: true,
    solid: false,
    drops: { itemId: '', count: 0 },
    color: '#000000',
  },
  [BlockType.GRASS]: {
    id: BlockType.GRASS,
    name: 'Bloque de Césped',
    hardness: 0.6,
    bestTool: 'shovel',
    transparent: false,
    solid: true,
    drops: { itemId: 'dirt', count: 1 },
    color: '#5b8e32',
  },
  [BlockType.DIRT]: {
    id: BlockType.DIRT,
    name: 'Tierra',
    hardness: 0.5,
    bestTool: 'shovel',
    transparent: false,
    solid: true,
    drops: { itemId: 'dirt', count: 1 },
    color: '#866043',
  },
  [BlockType.STONE]: {
    id: BlockType.STONE,
    name: 'Piedra',
    hardness: 1.5,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'cobblestone', count: 1 },
    color: '#757575',
  },
  [BlockType.COBBLESTONE]: {
    id: BlockType.COBBLESTONE,
    name: 'Adoquín',
    hardness: 1.6,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'cobblestone', count: 1 },
    color: '#636363',
  },
  [BlockType.WOOD]: {
    id: BlockType.WOOD,
    name: 'Tronco de Roble',
    hardness: 1.2,
    bestTool: 'axe',
    transparent: false,
    solid: true,
    drops: { itemId: 'wood', count: 1 },
    color: '#6d5032',
  },
  [BlockType.LEAVES]: {
    id: BlockType.LEAVES,
    name: 'Hojas de Roble',
    hardness: 0.2,
    bestTool: 'axe',
    transparent: true,
    solid: true,
    drops: { itemId: 'apple', count: 1 },
    color: '#347a1f',
  },
  [BlockType.PLANKS]: {
    id: BlockType.PLANKS,
    name: 'Tablones de Madera',
    hardness: 1.0,
    bestTool: 'axe',
    transparent: false,
    solid: true,
    drops: { itemId: 'planks', count: 1 },
    color: '#9c7744',
  },
  [BlockType.SAND]: {
    id: BlockType.SAND,
    name: 'Arena',
    hardness: 0.5,
    bestTool: 'shovel',
    transparent: false,
    solid: true,
    drops: { itemId: 'sand', count: 1 },
    color: '#d6c88f',
  },
  [BlockType.GLASS]: {
    id: BlockType.GLASS,
    name: 'Cristal',
    hardness: 0.3,
    bestTool: 'none',
    transparent: true,
    solid: true,
    drops: { itemId: '', count: 0 },
    color: '#a0c7d4',
  },
  [BlockType.WATER]: {
    id: BlockType.WATER,
    name: 'Agua',
    hardness: 100,
    bestTool: 'none',
    transparent: true,
    solid: false,
    drops: { itemId: '', count: 0 },
    color: '#2858bb',
  },
  [BlockType.BEDROCK]: {
    id: BlockType.BEDROCK,
    name: 'Lecho de Roca',
    hardness: -1, // Unbreakable
    bestTool: 'none',
    transparent: false,
    solid: true,
    drops: { itemId: '', count: 0 },
    color: '#1a1a1a',
  },
  [BlockType.COAL_ORE]: {
    id: BlockType.COAL_ORE,
    name: 'Mena de Carbón',
    hardness: 2.0,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'coal', count: 1 },
    color: '#2b2b2b',
  },
  [BlockType.IRON_ORE]: {
    id: BlockType.IRON_ORE,
    name: 'Mena de Hierro',
    hardness: 2.5,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'iron_ore', count: 1 },
    color: '#c29d81',
  },
  [BlockType.GOLD_ORE]: {
    id: BlockType.GOLD_ORE,
    name: 'Mena de Oro',
    hardness: 3.0,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'gold_ore', count: 1 },
    color: '#edd145',
  },
  [BlockType.DIAMOND_ORE]: {
    id: BlockType.DIAMOND_ORE,
    name: 'Mena de Diamante',
    hardness: 3.5,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'diamond', count: 1 },
    color: '#4dedf4',
  },
  [BlockType.TORCH]: {
    id: BlockType.TORCH,
    name: 'Antorcha',
    hardness: 0.1,
    bestTool: 'none',
    transparent: true,
    solid: false,
    lightLevel: 14,
    drops: { itemId: 'torch', count: 1 },
    color: '#ffbb33',
  },
  [BlockType.CRAFTING_TABLE]: {
    id: BlockType.CRAFTING_TABLE,
    name: 'Mesa de Crafteo',
    hardness: 1.2,
    bestTool: 'axe',
    transparent: false,
    solid: true,
    drops: { itemId: 'crafting_table', count: 1 },
    color: '#7b5735',
  },
  [BlockType.BRICK]: {
    id: BlockType.BRICK,
    name: 'Ladrillos',
    hardness: 1.8,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'brick', count: 1 },
    color: '#9c4c37',
  },
  [BlockType.BOOKSHELF]: {
    id: BlockType.BOOKSHELF,
    name: 'Librería',
    hardness: 1.0,
    bestTool: 'axe',
    transparent: false,
    solid: true,
    drops: { itemId: 'planks', count: 3 },
    color: '#825a33',
  },
  [BlockType.TNT]: {
    id: BlockType.TNT,
    name: 'TNT',
    hardness: 0.2,
    bestTool: 'none',
    transparent: false,
    solid: true,
    drops: { itemId: 'tnt', count: 1 },
    color: '#d62828',
  },
  [BlockType.WOOL_WHITE]: {
    id: BlockType.WOOL_WHITE,
    name: 'Lana Blanca',
    hardness: 0.8,
    bestTool: 'none',
    transparent: false,
    solid: true,
    drops: { itemId: 'wool_white', count: 1 },
    color: '#eaeaea',
  },
  [BlockType.WOOL_RED]: {
    id: BlockType.WOOL_RED,
    name: 'Lana Roja',
    hardness: 0.8,
    bestTool: 'none',
    transparent: false,
    solid: true,
    drops: { itemId: 'wool_red', count: 1 },
    color: '#b02e26',
  },
  [BlockType.WOOL_BLUE]: {
    id: BlockType.WOOL_BLUE,
    name: 'Lana Azul',
    hardness: 0.8,
    bestTool: 'none',
    transparent: false,
    solid: true,
    drops: { itemId: 'wool_blue', count: 1 },
    color: '#3c44aa',
  },
  [BlockType.POPPY]: {
    id: BlockType.POPPY,
    name: 'Amapola',
    hardness: 0.05,
    bestTool: 'none',
    transparent: true,
    solid: false,
    drops: { itemId: 'poppy', count: 1 },
    color: '#e63946',
  },
  [BlockType.DANDELION]: {
    id: BlockType.DANDELION,
    name: 'Diente de León',
    hardness: 0.05,
    bestTool: 'none',
    transparent: true,
    solid: false,
    drops: { itemId: 'dandelion', count: 1 },
    color: '#f6bd60',
  },
  [BlockType.DEEPSLATE]: {
    id: BlockType.DEEPSLATE,
    name: 'Pizarra Profunda',
    hardness: 3.0,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'deepslate', count: 1 },
    color: '#34353d',
  },
  [BlockType.COPPER_ORE]: {
    id: BlockType.COPPER_ORE,
    name: 'Mena de Cobre',
    hardness: 2.5,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'copper_ore', count: 1 },
    color: '#c86438',
  },
  [BlockType.DEEPSLATE_COPPER_ORE]: {
    id: BlockType.DEEPSLATE_COPPER_ORE,
    name: 'Mena de Cobre Profunda',
    hardness: 3.5,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'deepslate_copper_ore', count: 1 },
    color: '#a8502a',
  },
  [BlockType.DEEPSLATE_COAL_ORE]: {
    id: BlockType.DEEPSLATE_COAL_ORE,
    name: 'Mena de Carbón Profunda',
    hardness: 3.2,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'coal', count: 1 },
    color: '#222225',
  },
  [BlockType.DEEPSLATE_IRON_ORE]: {
    id: BlockType.DEEPSLATE_IRON_ORE,
    name: 'Mena de Hierro Profunda',
    hardness: 3.8,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'iron_ore', count: 1 },
    color: '#b08b68',
  },
  [BlockType.DEEPSLATE_GOLD_ORE]: {
    id: BlockType.DEEPSLATE_GOLD_ORE,
    name: 'Mena de Oro Profunda',
    hardness: 4.0,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'gold_ore', count: 1 },
    color: '#e2ca3b',
  },
  [BlockType.DEEPSLATE_DIAMOND_ORE]: {
    id: BlockType.DEEPSLATE_DIAMOND_ORE,
    name: 'Mena de Diamante Profunda',
    hardness: 4.5,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'diamond', count: 1 },
    color: '#42e2eb',
  },
  [BlockType.COPPER_BLOCK]: {
    id: BlockType.COPPER_BLOCK,
    name: 'Bloque de Cobre',
    hardness: 2.5,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'copper_block', count: 1 },
    color: '#be5c3b',
  },
  [BlockType.COPPER_WIRE]: {
    id: BlockType.COPPER_WIRE,
    name: 'Cable de Cobre',
    hardness: 0.1,
    bestTool: 'none',
    transparent: true,
    solid: false,
    drops: { itemId: 'copper_wire', count: 1 },
    color: '#9f4e2f',
  },
  [BlockType.COPPER_WIRE_ON]: {
    id: BlockType.COPPER_WIRE_ON,
    name: 'Cable de Cobre Energizado',
    hardness: 0.1,
    bestTool: 'none',
    transparent: true,
    solid: false,
    lightLevel: 6,
    drops: { itemId: 'copper_wire', count: 1 },
    color: '#ff7a45',
  },
  [BlockType.COPPER_LAMP]: {
    id: BlockType.COPPER_LAMP,
    name: 'Lámpara de Cobre',
    hardness: 1.0,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'copper_lamp', count: 1 },
    color: '#5c321e',
  },
  [BlockType.COPPER_LAMP_ON]: {
    id: BlockType.COPPER_LAMP_ON,
    name: 'Lámpara de Cobre Encendida',
    hardness: 1.0,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    lightLevel: 15,
    drops: { itemId: 'copper_lamp', count: 1 },
    color: '#ffc14d',
  },
  [BlockType.COPPER_SWITCH]: {
    id: BlockType.COPPER_SWITCH,
    name: 'Interruptor de Cobre (Apagado)',
    hardness: 0.5,
    bestTool: 'none',
    transparent: true,
    solid: false,
    drops: { itemId: 'copper_switch', count: 1 },
    color: '#8c5035',
  },
  [BlockType.COPPER_SWITCH_ON]: {
    id: BlockType.COPPER_SWITCH_ON,
    name: 'Interruptor de Cobre (Encendido)',
    hardness: 0.5,
    bestTool: 'none',
    transparent: true,
    solid: false,
    lightLevel: 7,
    drops: { itemId: 'copper_switch', count: 1 },
    color: '#ff7a45',
  },
  [BlockType.TERRACOTTA]: {
    id: BlockType.TERRACOTTA,
    name: 'Terracota',
    hardness: 1.8,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'terracotta', count: 1 },
    color: '#a85338',
  },
  [BlockType.RED_SAND]: {
    id: BlockType.RED_SAND,
    name: 'Arena Roja',
    hardness: 0.5,
    bestTool: 'shovel',
    transparent: false,
    solid: true,
    drops: { itemId: 'red_sand', count: 1 },
    color: '#c26038',
  },
  [BlockType.CACTUS]: {
    id: BlockType.CACTUS,
    name: 'Cactus',
    hardness: 0.4,
    bestTool: 'none',
    transparent: false,
    solid: true,
    drops: { itemId: 'cactus', count: 1 },
    color: '#387c2b',
  },
  [BlockType.SANDSTONE]: {
    id: BlockType.SANDSTONE,
    name: 'Arenisca',
    hardness: 0.8,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'sandstone', count: 1 },
    color: '#ded3a5',
  },
  [BlockType.CHISELED_SANDSTONE]: {
    id: BlockType.CHISELED_SANDSTONE,
    name: 'Arenisca Cincelada',
    hardness: 0.8,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'chiseled_sandstone', count: 1 },
    color: '#c7b985',
  },
  [BlockType.JUNGLE_WOOD]: {
    id: BlockType.JUNGLE_WOOD,
    name: 'Madera de la Selva',
    hardness: 2.0,
    bestTool: 'axe',
    transparent: false,
    solid: true,
    drops: { itemId: 'jungle_wood', count: 1 },
    color: '#564227',
  },
  [BlockType.JUNGLE_LEAVES]: {
    id: BlockType.JUNGLE_LEAVES,
    name: 'Hojas de la Selva',
    hardness: 0.2,
    bestTool: 'none',
    transparent: true,
    solid: true,
    drops: { itemId: 'apple', count: 1 },
    color: '#2e7a1f',
  },
  [BlockType.KELP]: {
    id: BlockType.KELP,
    name: 'Algas Marinas',
    hardness: 0.1,
    bestTool: 'none',
    transparent: true,
    solid: false,
    drops: { itemId: 'kelp', count: 1 },
    color: '#276834',
  },
  [BlockType.STORAGE_WOOD]: {
    id: BlockType.STORAGE_WOOD,
    name: 'Caja de Almacenamiento de Madera',
    hardness: 2.5,
    bestTool: 'axe',
    transparent: false,
    solid: true,
    drops: { itemId: 'storage_wood', count: 1 },
    color: '#8b5a2b',
  },
  // Snow & Ice Biome Blocks
  [BlockType.SNOW_BLOCK]: {
    id: BlockType.SNOW_BLOCK,
    name: 'Bloque de Nieve',
    hardness: 0.2,
    bestTool: 'shovel',
    transparent: false,
    solid: true,
    drops: { itemId: 'snow_block', count: 1 },
    color: '#f0f5f5',
  },
  [BlockType.SNOW_GRASS]: {
    id: BlockType.SNOW_GRASS,
    name: 'Césped Nevado',
    hardness: 0.6,
    bestTool: 'shovel',
    transparent: false,
    solid: true,
    drops: { itemId: 'dirt', count: 1 },
    color: '#eef3f5',
  },
  [BlockType.ICE]: {
    id: BlockType.ICE,
    name: 'Hielo',
    hardness: 0.5,
    bestTool: 'pickaxe',
    transparent: true,
    solid: true,
    drops: { itemId: '', count: 0 },
    color: '#90d4ed',
  },
  [BlockType.PACKED_ICE]: {
    id: BlockType.PACKED_ICE,
    name: 'Hielo Compacto',
    hardness: 0.5,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'packed_ice', count: 1 },
    color: '#8ec7e8',
  },
  [BlockType.BLUE_ICE]: {
    id: BlockType.BLUE_ICE,
    name: 'Hielo Azul',
    hardness: 2.8,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'blue_ice', count: 1 },
    color: '#65aee6',
  },
  // Wood & Foliage Blocks
  [BlockType.SPRUCE_WOOD]: {
    id: BlockType.SPRUCE_WOOD,
    name: 'Tronco de Abeto',
    hardness: 2.0,
    bestTool: 'axe',
    transparent: false,
    solid: true,
    drops: { itemId: 'spruce_wood', count: 1 },
    color: '#3b2818',
  },
  [BlockType.SPRUCE_LEAVES]: {
    id: BlockType.SPRUCE_LEAVES,
    name: 'Hojas de Abeto',
    hardness: 0.2,
    bestTool: 'none',
    transparent: true,
    solid: true,
    drops: { itemId: '', count: 0 },
    color: '#284d33',
  },
  [BlockType.SPRUCE_PLANKS]: {
    id: BlockType.SPRUCE_PLANKS,
    name: 'Tablones de Abeto',
    hardness: 1.5,
    bestTool: 'axe',
    transparent: false,
    solid: true,
    drops: { itemId: 'spruce_planks', count: 1 },
    color: '#684e32',
  },
  [BlockType.BIRCH_WOOD]: {
    id: BlockType.BIRCH_WOOD,
    name: 'Tronco de Abedul',
    hardness: 2.0,
    bestTool: 'axe',
    transparent: false,
    solid: true,
    drops: { itemId: 'birch_wood', count: 1 },
    color: '#d6d3c8',
  },
  [BlockType.BIRCH_LEAVES]: {
    id: BlockType.BIRCH_LEAVES,
    name: 'Hojas de Abedul',
    hardness: 0.2,
    bestTool: 'none',
    transparent: true,
    solid: true,
    drops: { itemId: '', count: 0 },
    color: '#5b8a36',
  },
  [BlockType.BIRCH_PLANKS]: {
    id: BlockType.BIRCH_PLANKS,
    name: 'Tablones de Abedul',
    hardness: 1.5,
    bestTool: 'axe',
    transparent: false,
    solid: true,
    drops: { itemId: 'birch_planks', count: 1 },
    color: '#c2b083',
  },
  [BlockType.DARK_OAK_WOOD]: {
    id: BlockType.DARK_OAK_WOOD,
    name: 'Tronco de Roble Oscuro',
    hardness: 2.0,
    bestTool: 'axe',
    transparent: false,
    solid: true,
    drops: { itemId: 'dark_oak_wood', count: 1 },
    color: '#2d1f13',
  },
  [BlockType.DARK_OAK_LEAVES]: {
    id: BlockType.DARK_OAK_LEAVES,
    name: 'Hojas de Roble Oscuro',
    hardness: 0.2,
    bestTool: 'none',
    transparent: true,
    solid: true,
    drops: { itemId: 'apple', count: 1 },
    color: '#1d4d1a',
  },
  [BlockType.DARK_OAK_PLANKS]: {
    id: BlockType.DARK_OAK_PLANKS,
    name: 'Tablones de Roble Oscuro',
    hardness: 1.5,
    bestTool: 'axe',
    transparent: false,
    solid: true,
    drops: { itemId: 'dark_oak_planks', count: 1 },
    color: '#432a18',
  },
  [BlockType.ACACIA_WOOD]: {
    id: BlockType.ACACIA_WOOD,
    name: 'Tronco de Acacia',
    hardness: 2.0,
    bestTool: 'axe',
    transparent: false,
    solid: true,
    drops: { itemId: 'acacia_wood', count: 1 },
    color: '#676157',
  },
  [BlockType.ACACIA_LEAVES]: {
    id: BlockType.ACACIA_LEAVES,
    name: 'Hojas de Acacia',
    hardness: 0.2,
    bestTool: 'none',
    transparent: true,
    solid: true,
    drops: { itemId: '', count: 0 },
    color: '#4e6e22',
  },
  [BlockType.ACACIA_PLANKS]: {
    id: BlockType.ACACIA_PLANKS,
    name: 'Tablones de Acacia',
    hardness: 1.5,
    bestTool: 'axe',
    transparent: false,
    solid: true,
    drops: { itemId: 'acacia_planks', count: 1 },
    color: '#a85a32',
  },
  [BlockType.MANGROVE_WOOD]: {
    id: BlockType.MANGROVE_WOOD,
    name: 'Tronco de Mangle',
    hardness: 2.0,
    bestTool: 'axe',
    transparent: false,
    solid: true,
    drops: { itemId: 'mangrove_wood', count: 1 },
    color: '#542622',
  },
  [BlockType.MANGROVE_LEAVES]: {
    id: BlockType.MANGROVE_LEAVES,
    name: 'Hojas de Mangle',
    hardness: 0.2,
    bestTool: 'none',
    transparent: true,
    solid: true,
    drops: { itemId: '', count: 0 },
    color: '#426829',
  },
  [BlockType.MANGROVE_ROOTS]: {
    id: BlockType.MANGROVE_ROOTS,
    name: 'Raíces de Mangle',
    hardness: 0.7,
    bestTool: 'axe',
    transparent: true,
    solid: true,
    drops: { itemId: 'mangrove_roots', count: 1 },
    color: '#473121',
  },
  [BlockType.CHERRY_WOOD]: {
    id: BlockType.CHERRY_WOOD,
    name: 'Tronco de Cerezo',
    hardness: 2.0,
    bestTool: 'axe',
    transparent: false,
    solid: true,
    drops: { itemId: 'cherry_wood', count: 1 },
    color: '#341f26',
  },
  [BlockType.CHERRY_LEAVES]: {
    id: BlockType.CHERRY_LEAVES,
    name: 'Hojas de Cerezo',
    hardness: 0.2,
    bestTool: 'none',
    transparent: true,
    solid: true,
    drops: { itemId: '', count: 0 },
    color: '#f8a5c2',
  },
  [BlockType.CHERRY_PLANKS]: {
    id: BlockType.CHERRY_PLANKS,
    name: 'Tablones de Cerezo',
    hardness: 1.5,
    bestTool: 'axe',
    transparent: false,
    solid: true,
    drops: { itemId: 'cherry_planks', count: 1 },
    color: '#e8a9b6',
  },
  // Flora & Mushrooms
  [BlockType.SUNFLOWER]: {
    id: BlockType.SUNFLOWER,
    name: 'Girasol',
    hardness: 0.1,
    bestTool: 'none',
    transparent: true,
    solid: false,
    drops: { itemId: 'sunflower', count: 1 },
    color: '#f9ca24',
  },
  [BlockType.CORNFLOWER]: {
    id: BlockType.CORNFLOWER,
    name: 'Aciano Azul',
    hardness: 0.1,
    bestTool: 'none',
    transparent: true,
    solid: false,
    drops: { itemId: 'cornflower', count: 1 },
    color: '#4834d4',
  },
  [BlockType.TULIP]: {
    id: BlockType.TULIP,
    name: 'Tulipán',
    hardness: 0.1,
    bestTool: 'none',
    transparent: true,
    solid: false,
    drops: { itemId: 'tulip', count: 1 },
    color: '#eb4d4b',
  },
  [BlockType.LILY_PAD]: {
    id: BlockType.LILY_PAD,
    name: 'Nenúfar',
    hardness: 0.1,
    bestTool: 'none',
    transparent: true,
    solid: false,
    drops: { itemId: 'lily_pad', count: 1 },
    color: '#267b36',
  },
  [BlockType.SUGAR_CANE]: {
    id: BlockType.SUGAR_CANE,
    name: 'Caña de Azúcar',
    hardness: 0.1,
    bestTool: 'none',
    transparent: true,
    solid: false,
    drops: { itemId: 'sugar_cane', count: 1 },
    color: '#6ab04c',
  },
  [BlockType.RED_MUSHROOM]: {
    id: BlockType.RED_MUSHROOM,
    name: 'Champiñón Rojo',
    hardness: 0.1,
    bestTool: 'none',
    transparent: true,
    solid: false,
    drops: { itemId: 'red_mushroom', count: 1 },
    color: '#e74c3c',
  },
  [BlockType.BROWN_MUSHROOM]: {
    id: BlockType.BROWN_MUSHROOM,
    name: 'Champiñón Marrón',
    hardness: 0.1,
    bestTool: 'none',
    transparent: true,
    solid: false,
    drops: { itemId: 'brown_mushroom', count: 1 },
    color: '#a07855',
  },
  [BlockType.MUSHROOM_BLOCK_RED]: {
    id: BlockType.MUSHROOM_BLOCK_RED,
    name: 'Bloque de Champiñón Rojo',
    hardness: 0.2,
    bestTool: 'axe',
    transparent: false,
    solid: true,
    drops: { itemId: 'red_mushroom', count: 2 },
    color: '#d63031',
  },
  [BlockType.MUSHROOM_BLOCK_BROWN]: {
    id: BlockType.MUSHROOM_BLOCK_BROWN,
    name: 'Bloque de Champiñón Marrón',
    hardness: 0.2,
    bestTool: 'axe',
    transparent: false,
    solid: true,
    drops: { itemId: 'brown_mushroom', count: 2 },
    color: '#8b6540',
  },
  [BlockType.MUSHROOM_STEM]: {
    id: BlockType.MUSHROOM_STEM,
    name: 'Tallo de Champiñón',
    hardness: 0.2,
    bestTool: 'axe',
    transparent: false,
    solid: true,
    drops: { itemId: '', count: 0 },
    color: '#d2cbbf',
  },
  [BlockType.MYCELIUM]: {
    id: BlockType.MYCELIUM,
    name: 'Micelio',
    hardness: 0.6,
    bestTool: 'shovel',
    transparent: false,
    solid: true,
    drops: { itemId: 'dirt', count: 1 },
    color: '#6f6265',
  },
  [BlockType.CORAL_BLOCK]: {
    id: BlockType.CORAL_BLOCK,
    name: 'Bloque de Coral',
    hardness: 1.5,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'coral_block', count: 1 },
    color: '#ff4d88',
  },
  [BlockType.SEA_PICKLE]: {
    id: BlockType.SEA_PICKLE,
    name: 'Pepinillo de Mar',
    hardness: 0.1,
    bestTool: 'none',
    transparent: true,
    solid: false,
    lightLevel: 10,
    drops: { itemId: 'sea_pickle', count: 1 },
    color: '#4cd137',
  },
  // Terrain & Soil
  [BlockType.MUD]: {
    id: BlockType.MUD,
    name: 'Lodo',
    hardness: 0.5,
    bestTool: 'shovel',
    transparent: false,
    solid: true,
    drops: { itemId: 'mud', count: 1 },
    color: '#3c383d',
  },
  [BlockType.PACKED_MUD]: {
    id: BlockType.PACKED_MUD,
    name: 'Lodo Compacto',
    hardness: 1.0,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'packed_mud', count: 1 },
    color: '#554f49',
  },
  [BlockType.PODZOL]: {
    id: BlockType.PODZOL,
    name: 'Podsol',
    hardness: 0.5,
    bestTool: 'shovel',
    transparent: false,
    solid: true,
    drops: { itemId: 'dirt', count: 1 },
    color: '#583e26',
  },
  [BlockType.COARSE_DIRT]: {
    id: BlockType.COARSE_DIRT,
    name: 'Tierra Estéril',
    hardness: 0.5,
    bestTool: 'shovel',
    transparent: false,
    solid: true,
    drops: { itemId: 'coarse_dirt', count: 1 },
    color: '#775338',
  },
  [BlockType.GRAVEL]: {
    id: BlockType.GRAVEL,
    name: 'Grava',
    hardness: 0.6,
    bestTool: 'shovel',
    transparent: false,
    solid: true,
    drops: { itemId: 'gravel', count: 1 },
    color: '#787373',
  },
  [BlockType.RED_SANDSTONE]: {
    id: BlockType.RED_SANDSTONE,
    name: 'Arenisca Roja',
    hardness: 0.8,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'red_sandstone', count: 1 },
    color: '#b85328',
  },
  [BlockType.TERRACOTTA_ORANGE]: {
    id: BlockType.TERRACOTTA_ORANGE,
    name: 'Terracota Naranja',
    hardness: 1.8,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'terracotta_orange', count: 1 },
    color: '#a15325',
  },
  [BlockType.TERRACOTTA_YELLOW]: {
    id: BlockType.TERRACOTTA_YELLOW,
    name: 'Terracota Amarilla',
    hardness: 1.8,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'terracotta_yellow', count: 1 },
    color: '#b8872d',
  },
  [BlockType.TERRACOTTA_WHITE]: {
    id: BlockType.TERRACOTTA_WHITE,
    name: 'Terracota Blanca',
    hardness: 1.8,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'terracotta_white', count: 1 },
    color: '#d1b2a1',
  },
  [BlockType.LAVA]: {
    id: BlockType.LAVA,
    name: 'Lava',
    hardness: 0,
    bestTool: 'none',
    transparent: true,
    solid: false,
    lightLevel: 15,
    drops: { itemId: '', count: 0 },
    color: '#ea580c',
  },
  [BlockType.OBSIDIAN]: {
    id: BlockType.OBSIDIAN,
    name: 'Obsidiana',
    hardness: 9.0,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'obsidian', count: 1 },
    color: '#1a102a',
  },
  [BlockType.TITANIUM_ORE]: {
    id: BlockType.TITANIUM_ORE,
    name: 'Mena de Titanio',
    hardness: 4.5,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'titanium_ore', count: 1 },
    color: '#8fa0aa',
  },
  [BlockType.DEEPSLATE_TITANIUM_ORE]: {
    id: BlockType.DEEPSLATE_TITANIUM_ORE,
    name: 'Mena de Titanio en Pizarra',
    hardness: 6.0,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'titanium_ore', count: 1 },
    color: '#52626c',
  },
  [BlockType.TITANIUM_BLOCK]: {
    id: BlockType.TITANIUM_BLOCK,
    name: 'Bloque de Titanio',
    hardness: 5.5,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'titanium_block', count: 1 },
    color: '#b0c4de',
  },
  [BlockType.CRUDE_OIL]: {
    id: BlockType.CRUDE_OIL,
    name: 'Petróleo Crudo',
    hardness: 100,
    bestTool: 'none',
    transparent: true,
    solid: false,
    drops: { itemId: '', count: 0 },
    color: '#1a1918',
  },
  [BlockType.FURNACE]: {
    id: BlockType.FURNACE,
    name: 'Horno',
    hardness: 3.5,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'furnace', count: 1 },
    color: '#636e72',
  },
  [BlockType.FURNACE_LIT]: {
    id: BlockType.FURNACE_LIT,
    name: 'Horno Encendido',
    hardness: 3.5,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    lightLevel: 14,
    drops: { itemId: 'furnace', count: 1 },
    color: '#e17055',
  },
  [BlockType.LANTERN]: {
    id: BlockType.LANTERN,
    name: 'Farolillo',
    hardness: 1.5,
    bestTool: 'pickaxe',
    transparent: true,
    solid: false,
    lightLevel: 15,
    drops: { itemId: 'lantern', count: 1 },
    color: '#fbc531',
  },
  [BlockType.STORAGE_IRON]: {
    id: BlockType.STORAGE_IRON,
    name: 'Caja de Almacenamiento de Hierro',
    hardness: 3.5,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'storage_iron', count: 1 },
    color: '#b0b8c0',
  },
  [BlockType.REINFORCED_CABLE]: {
    id: BlockType.REINFORCED_CABLE,
    name: 'Cable Aislado',
    hardness: 0.5,
    bestTool: 'none',
    transparent: true,
    solid: false,
    drops: { itemId: 'reinforced_cable', count: 1 },
    color: '#00cec9',
  },
  [BlockType.STORAGE_TITANIUM]: {
    id: BlockType.STORAGE_TITANIUM,
    name: 'Caja de Almacenamiento de Titanio',
    hardness: 4.5,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'storage_titanium', count: 1 },
    color: '#5b6b7a',
  },
  [BlockType.STORAGE_DIAMOND]: {
    id: BlockType.STORAGE_DIAMOND,
    name: 'Caja de Almacenamiento de Diamante',
    hardness: 5.5,
    bestTool: 'pickaxe',
    transparent: false,
    solid: true,
    drops: { itemId: 'storage_diamond', count: 1 },
    color: '#4dedf4',
  },
  // Puertas (Doors) - 11 clases de puertas
  [BlockType.DOOR_OAK_BOTTOM]: { id: BlockType.DOOR_OAK_BOTTOM, name: 'Puerta de Roble (Inferior)', hardness: 2.0, bestTool: 'axe', transparent: true, solid: true, drops: { itemId: 'oak_door', count: 1 }, color: '#b27a3c' },
  [BlockType.DOOR_OAK_TOP]: { id: BlockType.DOOR_OAK_TOP, name: 'Puerta de Roble (Superior)', hardness: 2.0, bestTool: 'axe', transparent: true, solid: true, drops: { itemId: 'oak_door', count: 1 }, color: '#b27a3c' },
  [BlockType.DOOR_BIRCH_BOTTOM]: { id: BlockType.DOOR_BIRCH_BOTTOM, name: 'Puerta de Abedul (Inferior)', hardness: 2.0, bestTool: 'axe', transparent: true, solid: true, drops: { itemId: 'birch_door', count: 1 }, color: '#d8cbb0' },
  [BlockType.DOOR_BIRCH_TOP]: { id: BlockType.DOOR_BIRCH_TOP, name: 'Puerta de Abedul (Superior)', hardness: 2.0, bestTool: 'axe', transparent: true, solid: true, drops: { itemId: 'birch_door', count: 1 }, color: '#d8cbb0' },
  [BlockType.DOOR_SPRUCE_BOTTOM]: { id: BlockType.DOOR_SPRUCE_BOTTOM, name: 'Puerta de Abeto (Inferior)', hardness: 2.0, bestTool: 'axe', transparent: true, solid: true, drops: { itemId: 'spruce_door', count: 1 }, color: '#684e32' },
  [BlockType.DOOR_SPRUCE_TOP]: { id: BlockType.DOOR_SPRUCE_TOP, name: 'Puerta de Abeto (Superior)', hardness: 2.0, bestTool: 'axe', transparent: true, solid: true, drops: { itemId: 'spruce_door', count: 1 }, color: '#684e32' },
  [BlockType.DOOR_JUNGLE_BOTTOM]: { id: BlockType.DOOR_JUNGLE_BOTTOM, name: 'Puerta de Jungla (Inferior)', hardness: 2.0, bestTool: 'axe', transparent: true, solid: true, drops: { itemId: 'jungle_door', count: 1 }, color: '#9d694b' },
  [BlockType.DOOR_JUNGLE_TOP]: { id: BlockType.DOOR_JUNGLE_TOP, name: 'Puerta de Jungla (Superior)', hardness: 2.0, bestTool: 'axe', transparent: true, solid: true, drops: { itemId: 'jungle_door', count: 1 }, color: '#9d694b' },
  [BlockType.DOOR_ACACIA_BOTTOM]: { id: BlockType.DOOR_ACACIA_BOTTOM, name: 'Puerta de Acacia (Inferior)', hardness: 2.0, bestTool: 'axe', transparent: true, solid: true, drops: { itemId: 'acacia_door', count: 1 }, color: '#ba6339' },
  [BlockType.DOOR_ACACIA_TOP]: { id: BlockType.DOOR_ACACIA_TOP, name: 'Puerta de Acacia (Superior)', hardness: 2.0, bestTool: 'axe', transparent: true, solid: true, drops: { itemId: 'acacia_door', count: 1 }, color: '#ba6339' },
  [BlockType.DOOR_DARK_OAK_BOTTOM]: { id: BlockType.DOOR_DARK_OAK_BOTTOM, name: 'Puerta de Roble Oscuro (Inferior)', hardness: 2.0, bestTool: 'axe', transparent: true, solid: true, drops: { itemId: 'dark_oak_door', count: 1 }, color: '#49331c' },
  [BlockType.DOOR_DARK_OAK_TOP]: { id: BlockType.DOOR_DARK_OAK_TOP, name: 'Puerta de Roble Oscuro (Superior)', hardness: 2.0, bestTool: 'axe', transparent: true, solid: true, drops: { itemId: 'dark_oak_door', count: 1 }, color: '#49331c' },
  [BlockType.DOOR_MANGROVE_BOTTOM]: { id: BlockType.DOOR_MANGROVE_BOTTOM, name: 'Puerta de Mangle (Inferior)', hardness: 2.0, bestTool: 'axe', transparent: true, solid: true, drops: { itemId: 'mangrove_door', count: 1 }, color: '#743232' },
  [BlockType.DOOR_MANGROVE_TOP]: { id: BlockType.DOOR_MANGROVE_TOP, name: 'Puerta de Mangle (Superior)', hardness: 2.0, bestTool: 'axe', transparent: true, solid: true, drops: { itemId: 'mangrove_door', count: 1 }, color: '#743232' },
  [BlockType.DOOR_CHERRY_BOTTOM]: { id: BlockType.DOOR_CHERRY_BOTTOM, name: 'Puerta de Cerezo (Inferior)', hardness: 2.0, bestTool: 'axe', transparent: true, solid: true, drops: { itemId: 'cherry_door', count: 1 }, color: '#e8a9b6' },
  [BlockType.DOOR_CHERRY_TOP]: { id: BlockType.DOOR_CHERRY_TOP, name: 'Puerta de Cerezo (Superior)', hardness: 2.0, bestTool: 'axe', transparent: true, solid: true, drops: { itemId: 'cherry_door', count: 1 }, color: '#e8a9b6' },
  [BlockType.DOOR_IRON_BOTTOM]: { id: BlockType.DOOR_IRON_BOTTOM, name: 'Puerta de Hierro (Inferior)', hardness: 4.5, bestTool: 'pickaxe', transparent: true, solid: true, drops: { itemId: 'iron_door', count: 1 }, color: '#dcdcdc' },
  [BlockType.DOOR_IRON_TOP]: { id: BlockType.DOOR_IRON_TOP, name: 'Puerta de Hierro (Superior)', hardness: 4.5, bestTool: 'pickaxe', transparent: true, solid: true, drops: { itemId: 'iron_door', count: 1 }, color: '#dcdcdc' },
  [BlockType.DOOR_COPPER_BOTTOM]: { id: BlockType.DOOR_COPPER_BOTTOM, name: 'Puerta de Cobre (Inferior)', hardness: 3.5, bestTool: 'pickaxe', transparent: true, solid: true, drops: { itemId: 'copper_door', count: 1 }, color: '#c8683e' },
  [BlockType.DOOR_COPPER_TOP]: { id: BlockType.DOOR_COPPER_TOP, name: 'Puerta de Cobre (Superior)', hardness: 3.5, bestTool: 'pickaxe', transparent: true, solid: true, drops: { itemId: 'copper_door', count: 1 }, color: '#c8683e' },
  [BlockType.DOOR_DIAMOND_BOTTOM]: { id: BlockType.DOOR_DIAMOND_BOTTOM, name: 'Puerta de Diamante (Inferior)', hardness: 6.0, bestTool: 'pickaxe', transparent: true, solid: true, drops: { itemId: 'diamond_door', count: 1 }, color: '#4dedf4' },
  [BlockType.DOOR_DIAMOND_TOP]: { id: BlockType.DOOR_DIAMOND_TOP, name: 'Puerta de Diamante (Superior)', hardness: 6.0, bestTool: 'pickaxe', transparent: true, solid: true, drops: { itemId: 'diamond_door', count: 1 }, color: '#4dedf4' },
  // Biome grasses and flora
  [BlockType.SHORT_GRASS]: { id: BlockType.SHORT_GRASS, name: 'Hierba Baja', hardness: 0.05, bestTool: 'none', transparent: true, solid: false, drops: { itemId: 'short_grass', count: 1 }, color: '#5b8e32' },
  [BlockType.MEDIUM_GRASS]: { id: BlockType.MEDIUM_GRASS, name: 'Hierba Media', hardness: 0.05, bestTool: 'none', transparent: true, solid: false, drops: { itemId: 'medium_grass', count: 1 }, color: '#4d8a2b' },
  [BlockType.TALL_GRASS]: { id: BlockType.TALL_GRASS, name: 'Hierba Alta', hardness: 0.05, bestTool: 'none', transparent: true, solid: false, drops: { itemId: 'tall_grass', count: 1 }, color: '#468024' },
  [BlockType.FERN]: { id: BlockType.FERN, name: 'Helecho', hardness: 0.05, bestTool: 'none', transparent: true, solid: false, drops: { itemId: 'fern', count: 1 }, color: '#387c2b' },
  [BlockType.DEAD_BUSH]: { id: BlockType.DEAD_BUSH, name: 'Arbusto Seco', hardness: 0.05, bestTool: 'none', transparent: true, solid: false, drops: { itemId: 'stick', count: 2 }, color: '#9e7343' },
  [BlockType.FROSTED_GRASS]: { id: BlockType.FROSTED_GRASS, name: 'Hierba con Nieve', hardness: 0.05, bestTool: 'none', transparent: true, solid: false, drops: { itemId: 'frosted_grass', count: 1 }, color: '#d8e8ee' },
};

// Item registry for both block items and tools / materials (Max stack is 100 blocks as requested)
export const ITEM_REGISTRY: Record<string, ItemDefinition> = {
  // Blocks
  grass: { id: 'grass', name: 'Bloque de Césped', isBlock: true, blockType: BlockType.GRASS, maxStack: 100 },
  dirt: { id: 'dirt', name: 'Tierra', isBlock: true, blockType: BlockType.DIRT, maxStack: 100 },
  stone: { id: 'stone', name: 'Piedra', isBlock: true, blockType: BlockType.STONE, maxStack: 100 },
  cobblestone: { id: 'cobblestone', name: 'Adoquín', isBlock: true, blockType: BlockType.COBBLESTONE, maxStack: 100 },
  wood: { id: 'wood', name: 'Tronco de Roble', isBlock: true, blockType: BlockType.WOOD, maxStack: 100 },
  leaves: { id: 'leaves', name: 'Hojas', isBlock: true, blockType: BlockType.LEAVES, maxStack: 100 },
  planks: { id: 'planks', name: 'Tablones de Madera', isBlock: true, blockType: BlockType.PLANKS, maxStack: 100 },
  sand: { id: 'sand', name: 'Arena', isBlock: true, blockType: BlockType.SAND, maxStack: 100 },
  glass: { id: 'glass', name: 'Cristal', isBlock: true, blockType: BlockType.GLASS, maxStack: 100 },
  torch: { id: 'torch', name: 'Antorcha', isBlock: true, blockType: BlockType.TORCH, maxStack: 100 },
  crafting_table: { id: 'crafting_table', name: 'Mesa de Crafteo', isBlock: true, blockType: BlockType.CRAFTING_TABLE, maxStack: 100 },
  brick: { id: 'brick', name: 'Ladrillos', isBlock: true, blockType: BlockType.BRICK, maxStack: 100 },
  bookshelf: { id: 'bookshelf', name: 'Librería', isBlock: true, blockType: BlockType.BOOKSHELF, maxStack: 100 },
  tnt: { id: 'tnt', name: 'TNT', isBlock: true, blockType: BlockType.TNT, maxStack: 100 },
  wool_white: { id: 'wool_white', name: 'Lana Blanca', isBlock: true, blockType: BlockType.WOOL_WHITE, maxStack: 100 },
  wool_red: { id: 'wool_red', name: 'Lana Roja', isBlock: true, blockType: BlockType.WOOL_RED, maxStack: 100 },
  wool_blue: { id: 'wool_blue', name: 'Lana Azul', isBlock: true, blockType: BlockType.WOOL_BLUE, maxStack: 100 },
  poppy: { id: 'poppy', name: 'Amapola', isBlock: true, blockType: BlockType.POPPY, maxStack: 100 },
  dandelion: { id: 'dandelion', name: 'Diente de León', isBlock: true, blockType: BlockType.DANDELION, maxStack: 100 },
  deepslate: { id: 'deepslate', name: 'Pizarra Profunda', isBlock: true, blockType: BlockType.DEEPSLATE, maxStack: 100 },
  copper_ore: { id: 'copper_ore', name: 'Mena de Cobre', isBlock: true, blockType: BlockType.COPPER_ORE, maxStack: 100 },
  deepslate_copper_ore: { id: 'deepslate_copper_ore', name: 'Mena de Cobre Profunda', isBlock: true, blockType: BlockType.DEEPSLATE_COPPER_ORE, maxStack: 100 },
  copper_block: { id: 'copper_block', name: 'Bloque de Cobre', isBlock: true, blockType: BlockType.COPPER_BLOCK, maxStack: 100 },
  copper_wire: { id: 'copper_wire', name: 'Cable de Cobre', isBlock: true, blockType: BlockType.COPPER_WIRE, maxStack: 100, description: 'Transmite señal eléctrica como el redstone' },
  copper_lamp: { id: 'copper_lamp', name: 'Lámpara de Cobre', isBlock: true, blockType: BlockType.COPPER_LAMP, maxStack: 100, description: 'Se ilumina al recibir señal de cable' },
  copper_switch: { id: 'copper_switch', name: 'Interruptor de Cobre', isBlock: true, blockType: BlockType.COPPER_SWITCH, maxStack: 100, description: 'Emite señal eléctrica al activarlo' },
  terracotta: { id: 'terracotta', name: 'Terracota', isBlock: true, blockType: BlockType.TERRACOTTA, maxStack: 100 },
  red_sand: { id: 'red_sand', name: 'Arena Roja', isBlock: true, blockType: BlockType.RED_SAND, maxStack: 100 },
  cactus: { id: 'cactus', name: 'Cactus', isBlock: true, blockType: BlockType.CACTUS, maxStack: 100 },
  sandstone: { id: 'sandstone', name: 'Arenisca', isBlock: true, blockType: BlockType.SANDSTONE, maxStack: 100 },
  chiseled_sandstone: { id: 'chiseled_sandstone', name: 'Arenisca Cincelada', isBlock: true, blockType: BlockType.CHISELED_SANDSTONE, maxStack: 100 },
  jungle_wood: { id: 'jungle_wood', name: 'Madera de la Selva', isBlock: true, blockType: BlockType.JUNGLE_WOOD, maxStack: 100 },
  jungle_leaves: { id: 'jungle_leaves', name: 'Hojas de la Selva', isBlock: true, blockType: BlockType.JUNGLE_LEAVES, maxStack: 100 },
  kelp: { id: 'kelp', name: 'Algas Marinas', isBlock: true, blockType: BlockType.KELP, maxStack: 100 },
  storage_wood: { id: 'storage_wood', name: 'Caja de Almacenamiento de Madera', isBlock: true, blockType: BlockType.STORAGE_WOOD, maxStack: 64, description: 'Caja de almacenamiento básica (27 ranuras)' },
  storage_iron: { id: 'storage_iron', name: 'Caja de Almacenamiento de Hierro', isBlock: true, blockType: BlockType.STORAGE_IRON, maxStack: 64, description: 'Caja de almacenamiento reforzada (45 ranuras)' },
  storage_titanium: { id: 'storage_titanium', name: 'Caja de Almacenamiento de Titanio', isBlock: true, blockType: BlockType.STORAGE_TITANIUM, maxStack: 64, description: 'Caja de almacenamiento avanzada (63 ranuras)' },
  storage_diamond: { id: 'storage_diamond', name: 'Caja de Almacenamiento de Diamante', isBlock: true, blockType: BlockType.STORAGE_DIAMOND, maxStack: 64, description: 'Caja de almacenamiento suprema (81 ranuras)' },
  chest: { id: 'chest', name: 'Caja de Almacenamiento de Madera', isBlock: true, blockType: BlockType.STORAGE_WOOD, maxStack: 64, description: 'Caja de almacenamiento básica (27 ranuras)' },
  raw_fish: { id: 'raw_fish', name: 'Bacalao Crudo', isBlock: false, maxStack: 100, description: 'Pescado nutritivo capturado en ríos u océanos' },
  raw_salmon: { id: 'raw_salmon', name: 'Salmón Crudo', isBlock: false, maxStack: 100, description: 'Salmón rosado de río y océano de gran sabor' },
  clownfish: { id: 'clownfish', name: 'Pez Payaso Tropical', isBlock: false, maxStack: 100, description: 'Pez tropical colorido de arrecifes cálidos' },
  pufferfish: { id: 'pufferfish', name: 'Pez Globo', isBlock: false, maxStack: 100, description: 'Pez marino exótico venenoso' },
  goldfish: { id: 'goldfish', name: 'Pez Dorado', isBlock: false, maxStack: 100, description: 'Pez resplandeciente que habita aguas cristalinas' },
  obsidian: { id: 'obsidian', name: 'Obsidiana', isBlock: true, blockType: BlockType.OBSIDIAN, maxStack: 100, description: 'Roca volcánica ultra resistente formada al juntar agua y lava' },
  
  // Wild grasses & Biome Plants
  short_grass: { id: 'short_grass', name: 'Hierba Baja', isBlock: true, blockType: BlockType.SHORT_GRASS, maxStack: 100 },
  medium_grass: { id: 'medium_grass', name: 'Hierba Media', isBlock: true, blockType: BlockType.MEDIUM_GRASS, maxStack: 100 },
  tall_grass: { id: 'tall_grass', name: 'Hierba Alta', isBlock: true, blockType: BlockType.TALL_GRASS, maxStack: 100 },
  fern: { id: 'fern', name: 'Helecho', isBlock: true, blockType: BlockType.FERN, maxStack: 100 },
  dead_bush: { id: 'dead_bush', name: 'Arbusto Seco', isBlock: true, blockType: BlockType.DEAD_BUSH, maxStack: 100 },
  frosted_grass: { id: 'frosted_grass', name: 'Hierba con Nieve', isBlock: true, blockType: BlockType.FROSTED_GRASS, maxStack: 100 },
  
  // Biome specific items & blocks
  snow_block: { id: 'snow_block', name: 'Bloque de Nieve', isBlock: true, blockType: BlockType.SNOW_BLOCK, maxStack: 100 },
  ice: { id: 'ice', name: 'Hielo', isBlock: true, blockType: BlockType.ICE, maxStack: 100 },
  packed_ice: { id: 'packed_ice', name: 'Hielo Compacto', isBlock: true, blockType: BlockType.PACKED_ICE, maxStack: 100 },
  blue_ice: { id: 'blue_ice', name: 'Hielo Azul', isBlock: true, blockType: BlockType.BLUE_ICE, maxStack: 100 },
  spruce_wood: { id: 'spruce_wood', name: 'Tronco de Abeto', isBlock: true, blockType: BlockType.SPRUCE_WOOD, maxStack: 100 },
  spruce_leaves: { id: 'spruce_leaves', name: 'Hojas de Abeto', isBlock: true, blockType: BlockType.SPRUCE_LEAVES, maxStack: 100 },
  spruce_planks: { id: 'spruce_planks', name: 'Tablones de Abeto', isBlock: true, blockType: BlockType.SPRUCE_PLANKS, maxStack: 100 },
  birch_wood: { id: 'birch_wood', name: 'Tronco de Abedul', isBlock: true, blockType: BlockType.BIRCH_WOOD, maxStack: 100 },
  birch_leaves: { id: 'birch_leaves', name: 'Hojas de Abedul', isBlock: true, blockType: BlockType.BIRCH_LEAVES, maxStack: 100 },
  birch_planks: { id: 'birch_planks', name: 'Tablones de Abedul', isBlock: true, blockType: BlockType.BIRCH_PLANKS, maxStack: 100 },
  dark_oak_wood: { id: 'dark_oak_wood', name: 'Tronco de Roble Oscuro', isBlock: true, blockType: BlockType.DARK_OAK_WOOD, maxStack: 100 },
  dark_oak_leaves: { id: 'dark_oak_leaves', name: 'Hojas de Roble Oscuro', isBlock: true, blockType: BlockType.DARK_OAK_LEAVES, maxStack: 100 },
  dark_oak_planks: { id: 'dark_oak_planks', name: 'Tablones de Roble Oscuro', isBlock: true, blockType: BlockType.DARK_OAK_PLANKS, maxStack: 100 },
  acacia_wood: { id: 'acacia_wood', name: 'Tronco de Acacia', isBlock: true, blockType: BlockType.ACACIA_WOOD, maxStack: 100 },
  acacia_leaves: { id: 'acacia_leaves', name: 'Hojas de Acacia', isBlock: true, blockType: BlockType.ACACIA_LEAVES, maxStack: 100 },
  acacia_planks: { id: 'acacia_planks', name: 'Tablones de Acacia', isBlock: true, blockType: BlockType.ACACIA_PLANKS, maxStack: 100 },
  mangrove_wood: { id: 'mangrove_wood', name: 'Tronco de Mangle', isBlock: true, blockType: BlockType.MANGROVE_WOOD, maxStack: 100 },
  mangrove_leaves: { id: 'mangrove_leaves', name: 'Hojas de Mangle', isBlock: true, blockType: BlockType.MANGROVE_LEAVES, maxStack: 100 },
  mangrove_roots: { id: 'mangrove_roots', name: 'Raíces de Mangle', isBlock: true, blockType: BlockType.MANGROVE_ROOTS, maxStack: 100 },
  cherry_wood: { id: 'cherry_wood', name: 'Tronco de Cerezo', isBlock: true, blockType: BlockType.CHERRY_WOOD, maxStack: 100 },
  cherry_leaves: { id: 'cherry_leaves', name: 'Hojas de Cerezo', isBlock: true, blockType: BlockType.CHERRY_LEAVES, maxStack: 100 },
  cherry_planks: { id: 'cherry_planks', name: 'Tablones de Cerezo', isBlock: true, blockType: BlockType.CHERRY_PLANKS, maxStack: 100 },
  sunflower: { id: 'sunflower', name: 'Girasol', isBlock: true, blockType: BlockType.SUNFLOWER, maxStack: 100 },
  cornflower: { id: 'cornflower', name: 'Aciano Azul', isBlock: true, blockType: BlockType.CORNFLOWER, maxStack: 100 },
  tulip: { id: 'tulip', name: 'Tulipán', isBlock: true, blockType: BlockType.TULIP, maxStack: 100 },
  lily_pad: { id: 'lily_pad', name: 'Nenúfar', isBlock: true, blockType: BlockType.LILY_PAD, maxStack: 100 },
  sugar_cane: { id: 'sugar_cane', name: 'Caña de Azúcar', isBlock: true, blockType: BlockType.SUGAR_CANE, maxStack: 100 },
  red_mushroom: { id: 'red_mushroom', name: 'Champiñón Rojo', isBlock: true, blockType: BlockType.RED_MUSHROOM, maxStack: 100 },
  brown_mushroom: { id: 'brown_mushroom', name: 'Champiñón Marrón', isBlock: true, blockType: BlockType.BROWN_MUSHROOM, maxStack: 100 },
  mushroom_block_red: { id: 'mushroom_block_red', name: 'Bloque de Champiñón Rojo', isBlock: true, blockType: BlockType.MUSHROOM_BLOCK_RED, maxStack: 100 },
  mushroom_block_brown: { id: 'mushroom_block_brown', name: 'Bloque de Champiñón Marrón', isBlock: true, blockType: BlockType.MUSHROOM_BLOCK_BROWN, maxStack: 100 },
  mushroom_stem: { id: 'mushroom_stem', name: 'Tallo de Champiñón', isBlock: true, blockType: BlockType.MUSHROOM_STEM, maxStack: 100 },
  mycelium: { id: 'mycelium', name: 'Micelio', isBlock: true, blockType: BlockType.MYCELIUM, maxStack: 100 },
  coral_block: { id: 'coral_block', name: 'Bloque de Coral', isBlock: true, blockType: BlockType.CORAL_BLOCK, maxStack: 100 },
  sea_pickle: { id: 'sea_pickle', name: 'Pepinillo de Mar', isBlock: true, blockType: BlockType.SEA_PICKLE, maxStack: 100 },
  mud: { id: 'mud', name: 'Lodo', isBlock: true, blockType: BlockType.MUD, maxStack: 100 },
  packed_mud: { id: 'packed_mud', name: 'Lodo Compacto', isBlock: true, blockType: BlockType.PACKED_MUD, maxStack: 100 },
  podzol: { id: 'podzol', name: 'Podsol', isBlock: true, blockType: BlockType.PODZOL, maxStack: 100 },
  coarse_dirt: { id: 'coarse_dirt', name: 'Tierra Estéril', isBlock: true, blockType: BlockType.COARSE_DIRT, maxStack: 100 },
  gravel: { id: 'gravel', name: 'Grava', isBlock: true, blockType: BlockType.GRAVEL, maxStack: 100 },
  red_sandstone: { id: 'red_sandstone', name: 'Arenisca Roja', isBlock: true, blockType: BlockType.RED_SANDSTONE, maxStack: 100 },
  terracotta_orange: { id: 'terracotta_orange', name: 'Terracota Naranja', isBlock: true, blockType: BlockType.TERRACOTTA_ORANGE, maxStack: 100 },
  terracotta_yellow: { id: 'terracotta_yellow', name: 'Terracota Amarilla', isBlock: true, blockType: BlockType.TERRACOTTA_YELLOW, maxStack: 100 },
  terracotta_white: { id: 'terracotta_white', name: 'Terracota Blanca', isBlock: true, blockType: BlockType.TERRACOTTA_WHITE, maxStack: 100 },

  // Buckets & Fluids
  bucket: { id: 'bucket', name: 'Cubo Vacío', isBlock: false, maxStack: 16, description: 'Sirve para recoger y transportar agua, lava o petróleo crudo' },
  water_bucket: { id: 'water_bucket', name: 'Cubo con Agua', isBlock: false, maxStack: 1, description: 'Vierte agua con físicas de flujo' },
  lava_bucket: { id: 'lava_bucket', name: 'Cubo con Lava', isBlock: false, maxStack: 1, description: 'Vierte lava incandescente con físicas de flujo' },
  oil_bucket: { id: 'oil_bucket', name: 'Cubo con Petróleo Crudo', isBlock: false, maxStack: 1, description: 'Petróleo en crudo recogido con un cubo. Refínalo en el horno para obtener nafta refinada' },

  // Raw Materials
  stick: { id: 'stick', name: 'Palo', isBlock: false, maxStack: 100 },
  coal: { id: 'coal', name: 'Carbón', isBlock: false, maxStack: 100 },
  leather: { id: 'leather', name: 'Cuero', isBlock: false, maxStack: 100, description: 'Piel resistente para fabricar armaduras y mochilas' },
  iron_ore: { id: 'iron_ore', name: 'Mena de Hierro', isBlock: true, blockType: BlockType.IRON_ORE, maxStack: 100 },
  iron_ingot: { id: 'iron_ingot', name: 'Lingote de Hierro', isBlock: false, maxStack: 100 },
  gold_ore: { id: 'gold_ore', name: 'Mena de Oro', isBlock: true, blockType: BlockType.GOLD_ORE, maxStack: 100 },
  gold_ingot: { id: 'gold_ingot', name: 'Lingote de Oro', isBlock: false, maxStack: 100 },
  raw_copper: { id: 'raw_copper', name: 'Cobre en Bruto', isBlock: false, maxStack: 100 },
  copper_ingot: { id: 'copper_ingot', name: 'Lingote de Cobre', isBlock: false, maxStack: 100 },
  diamond: { id: 'diamond', name: 'Diamante', isBlock: false, maxStack: 100 },
  apple: { id: 'apple', name: 'Manzana', isBlock: false, maxStack: 100 },
  porkchop: { id: 'porkchop', name: 'Chuleton de Cerdo', isBlock: false, maxStack: 100 },

  // Mochilas (Backpacks)
  small_backpack: { id: 'small_backpack', name: 'Mochila Pequeña', isBlock: false, maxStack: 1, backpackSlots: 9, description: 'Mochila de cuero básica (+9 ranuras de botín extra)' },
  medium_backpack: { id: 'medium_backpack', name: 'Mochila Mediana', isBlock: false, maxStack: 1, backpackSlots: 18, description: 'Mochila reforzada con cobre y hierro (+18 ranuras de botín extra)' },
  large_backpack: { id: 'large_backpack', name: 'Mochila Grande', isBlock: false, maxStack: 1, backpackSlots: 27, description: 'Mochila de explorador avanzada (+27 ranuras de botín extra)' },

  // Armaduras de Cuero (Leather Armor)
  leather_helmet: { id: 'leather_helmet', name: 'Casco de Cuero', isBlock: false, maxStack: 1, armorSlot: 'helmet', armorMaterial: 'leather', defensePoints: 1, description: 'Armadura ligera (+1 Defensa)' },
  leather_chestplate: { id: 'leather_chestplate', name: 'Peto de Cuero', isBlock: false, maxStack: 1, armorSlot: 'chestplate', armorMaterial: 'leather', defensePoints: 3, description: 'Armadura ligera (+3 Defensa)' },
  leather_leggings: { id: 'leather_leggings', name: 'Pantalones de Cuero', isBlock: false, maxStack: 1, armorSlot: 'leggings', armorMaterial: 'leather', defensePoints: 2, description: 'Armadura ligera (+2 Defensa)' },
  leather_boots: { id: 'leather_boots', name: 'Botas de Cuero', isBlock: false, maxStack: 1, armorSlot: 'boots', armorMaterial: 'leather', defensePoints: 1, description: 'Armadura ligera (+1 Defensa)' },

  // Armaduras de Cobre (Copper Armor)
  copper_helmet: { id: 'copper_helmet', name: 'Casco de Cobre', isBlock: false, maxStack: 1, armorSlot: 'helmet', armorMaterial: 'copper', defensePoints: 2, description: 'Armadura metálica de cobre (+2 Defensa)' },
  copper_chestplate: { id: 'copper_chestplate', name: 'Peto de Cobre', isBlock: false, maxStack: 1, armorSlot: 'chestplate', armorMaterial: 'copper', defensePoints: 4, description: 'Armadura metálica de cobre (+4 Defensa)' },
  copper_leggings: { id: 'copper_leggings', name: 'Pantalones de Cobre', isBlock: false, maxStack: 1, armorSlot: 'leggings', armorMaterial: 'copper', defensePoints: 3, description: 'Armadura metálica de cobre (+3 Defensa)' },
  copper_boots: { id: 'copper_boots', name: 'Botas de Cobre', isBlock: false, maxStack: 1, armorSlot: 'boots', armorMaterial: 'copper', defensePoints: 1, description: 'Armadura metálica de cobre (+1 Defensa)' },

  // Armaduras de Hierro (Iron Armor)
  iron_helmet: { id: 'iron_helmet', name: 'Casco de Hierro', isBlock: false, maxStack: 1, armorSlot: 'helmet', armorMaterial: 'iron', defensePoints: 2, description: 'Armadura resistente de hierro (+2 Defensa)' },
  iron_chestplate: { id: 'iron_chestplate', name: 'Peto de Hierro', isBlock: false, maxStack: 1, armorSlot: 'chestplate', armorMaterial: 'iron', defensePoints: 6, description: 'Armadura resistente de hierro (+6 Defensa)' },
  iron_leggings: { id: 'iron_leggings', name: 'Pantalones de Hierro', isBlock: false, maxStack: 1, armorSlot: 'leggings', armorMaterial: 'iron', defensePoints: 5, description: 'Armadura resistente de hierro (+5 Defensa)' },
  iron_boots: { id: 'iron_boots', name: 'Botas de Hierro', isBlock: false, maxStack: 1, armorSlot: 'boots', armorMaterial: 'iron', defensePoints: 2, description: 'Armadura resistente de hierro (+2 Defensa)' },

  // Armaduras de Oro (Gold Armor)
  gold_helmet: { id: 'gold_helmet', name: 'Casco de Oro', isBlock: false, maxStack: 1, armorSlot: 'helmet', armorMaterial: 'gold', defensePoints: 2, description: 'Armadura brillante de oro (+2 Defensa)' },
  gold_chestplate: { id: 'gold_chestplate', name: 'Peto de Oro', isBlock: false, maxStack: 1, armorSlot: 'chestplate', armorMaterial: 'gold', defensePoints: 5, description: 'Armadura brillante de oro (+5 Defensa)' },
  gold_leggings: { id: 'gold_leggings', name: 'Pantalones de Oro', isBlock: false, maxStack: 1, armorSlot: 'leggings', armorMaterial: 'gold', defensePoints: 3, description: 'Armadura brillante de oro (+3 Defensa)' },
  gold_boots: { id: 'gold_boots', name: 'Botas de Oro', isBlock: false, maxStack: 1, armorSlot: 'boots', armorMaterial: 'gold', defensePoints: 1, description: 'Armadura brillante de oro (+1 Defensa)' },

  // Armaduras de Diamante (Diamond Armor)
  diamond_helmet: { id: 'diamond_helmet', name: 'Casco de Diamante', isBlock: false, maxStack: 1, armorSlot: 'helmet', armorMaterial: 'diamond', defensePoints: 3, description: 'Armadura legendaria de diamante (+3 Defensa)' },
  diamond_chestplate: { id: 'diamond_chestplate', name: 'Peto de Diamante', isBlock: false, maxStack: 1, armorSlot: 'chestplate', armorMaterial: 'diamond', defensePoints: 8, description: 'Armadura legendaria de diamante (+8 Defensa)' },
  diamond_leggings: { id: 'diamond_leggings', name: 'Pantalones de Diamante', isBlock: false, maxStack: 1, armorSlot: 'leggings', armorMaterial: 'diamond', defensePoints: 6, description: 'Armadura legendaria de diamante (+6 Defensa)' },
  diamond_boots: { id: 'diamond_boots', name: 'Botas de Diamante', isBlock: false, maxStack: 1, armorSlot: 'boots', armorMaterial: 'diamond', defensePoints: 3, description: 'Armadura legendaria de diamante (+3 Defensa)' },

  // 1. Tools - Madera (Wood) - Nivel 1
  wooden_sword: { id: 'wooden_sword', name: 'Espada de Madera', isBlock: false, toolType: 'sword', toolMaterial: 'wood', toolEfficiency: 2.0, attackDamage: 4.0, maxStack: 1, description: 'Arma básica de madera tallada (+4 Daño)' },
  wooden_pickaxe: { id: 'wooden_pickaxe', name: 'Pico de Madera', isBlock: false, toolType: 'pickaxe', toolMaterial: 'wood', toolEfficiency: 2.0, attackDamage: 2.0, maxStack: 1, description: 'Pico básico para picar piedra y carbón' },
  wooden_axe: { id: 'wooden_axe', name: 'Hacha de Madera', isBlock: false, toolType: 'axe', toolMaterial: 'wood', toolEfficiency: 2.0, attackDamage: 3.0, maxStack: 1, description: 'Hacha de madera para talar madera' },
  wooden_shovel: { id: 'wooden_shovel', name: 'Pala de Madera', isBlock: false, toolType: 'shovel', toolMaterial: 'wood', toolEfficiency: 2.0, attackDamage: 1.5, maxStack: 1, description: 'Pala de madera para cavar tierra' },
  wooden_hoe: { id: 'wooden_hoe', name: 'Azada de Madera', isBlock: false, toolType: 'hoe', toolMaterial: 'wood', toolEfficiency: 2.0, attackDamage: 1.0, maxStack: 1, description: 'Azada para labrar tierra' },

  // 2. Tools - Piedra (Stone) - Nivel 2
  stone_sword: { id: 'stone_sword', name: 'Espada de Piedra', isBlock: false, toolType: 'sword', toolMaterial: 'stone', toolEfficiency: 3.5, attackDamage: 5.0, maxStack: 1, description: 'Espada de piedra afilada (+5 Daño)' },
  stone_pickaxe: { id: 'stone_pickaxe', name: 'Pico de Piedra', isBlock: false, toolType: 'pickaxe', toolMaterial: 'stone', toolEfficiency: 3.5, attackDamage: 3.0, maxStack: 1, description: 'Pico resistente para extraer menas' },
  stone_axe: { id: 'stone_axe', name: 'Hacha de Piedra', isBlock: false, toolType: 'axe', toolMaterial: 'stone', toolEfficiency: 3.5, attackDamage: 4.0, maxStack: 1, description: 'Hacha de corte rápido de madera' },
  stone_shovel: { id: 'stone_shovel', name: 'Pala de Piedra', isBlock: false, toolType: 'shovel', toolMaterial: 'stone', toolEfficiency: 3.5, attackDamage: 2.5, maxStack: 1, description: 'Pala de piedra' },
  stone_hoe: { id: 'stone_hoe', name: 'Azada de Piedra', isBlock: false, toolType: 'hoe', toolMaterial: 'stone', toolEfficiency: 3.5, attackDamage: 1.5, maxStack: 1, description: 'Azada de piedra para labrar' },

  // 3. Tools - Cobre (Copper) - Nivel 3
  copper_sword: { id: 'copper_sword', name: 'Espada de Cobre', isBlock: false, toolType: 'sword', toolMaterial: 'copper', toolEfficiency: 5.0, attackDamage: 5.5, maxStack: 1, description: 'Espada forjada de cobre (+5.5 Daño)' },
  copper_pickaxe: { id: 'copper_pickaxe', name: 'Pico de Cobre', isBlock: false, toolType: 'pickaxe', toolMaterial: 'copper', toolEfficiency: 5.0, attackDamage: 3.5, maxStack: 1, description: 'Pico metálico de cobre de buena velocidad' },
  copper_axe: { id: 'copper_axe', name: 'Hacha de Cobre', isBlock: false, toolType: 'axe', toolMaterial: 'copper', toolEfficiency: 5.0, attackDamage: 4.5, maxStack: 1, description: 'Hacha afilada de cobre' },
  copper_shovel: { id: 'copper_shovel', name: 'Pala de Cobre', isBlock: false, toolType: 'shovel', toolMaterial: 'copper', toolEfficiency: 5.0, attackDamage: 3.0, maxStack: 1, description: 'Pala de cobre veloz' },
  copper_hoe: { id: 'copper_hoe', name: 'Azada de Cobre', isBlock: false, toolType: 'hoe', toolMaterial: 'copper', toolEfficiency: 5.0, attackDamage: 2.0, maxStack: 1, description: 'Azada de cobre' },

  // 4. Tools - Oro (Gold) - Nivel 4
  gold_sword: { id: 'gold_sword', name: 'Espada de Oro', isBlock: false, toolType: 'sword', toolMaterial: 'gold', toolEfficiency: 6.5, attackDamage: 6.0, maxStack: 1, description: 'Espada ceremonial dorada (+6 Daño)' },
  gold_pickaxe: { id: 'gold_pickaxe', name: 'Pico de Oro', isBlock: false, toolType: 'pickaxe', toolMaterial: 'gold', toolEfficiency: 6.5, attackDamage: 4.0, maxStack: 1, description: 'Pico de oro con gran velocidad de minado' },
  gold_axe: { id: 'gold_axe', name: 'Hacha de Oro', isBlock: false, toolType: 'axe', toolMaterial: 'gold', toolEfficiency: 6.5, attackDamage: 5.0, maxStack: 1, description: 'Hacha de oro ágil y rápida' },
  gold_shovel: { id: 'gold_shovel', name: 'Pala de Oro', isBlock: false, toolType: 'shovel', toolMaterial: 'gold', toolEfficiency: 6.5, attackDamage: 3.5, maxStack: 1, description: 'Pala de oro' },
  gold_hoe: { id: 'gold_hoe', name: 'Azada de Oro', isBlock: false, toolType: 'hoe', toolMaterial: 'gold', toolEfficiency: 6.5, attackDamage: 2.5, maxStack: 1, description: 'Azada de oro' },

  // 5. Tools - Hierro (Iron) - Nivel 5
  iron_sword: { id: 'iron_sword', name: 'Espada de Hierro', isBlock: false, toolType: 'sword', toolMaterial: 'iron', toolEfficiency: 8.0, attackDamage: 7.0, maxStack: 1, description: 'Espada pesada de hierro forjado (+7 Daño)' },
  iron_pickaxe: { id: 'iron_pickaxe', name: 'Pico de Hierro', isBlock: false, toolType: 'pickaxe', toolMaterial: 'iron', toolEfficiency: 8.0, attackDamage: 5.0, maxStack: 1, description: 'Pico de hierro capaz de extraer oro y diamante' },
  iron_axe: { id: 'iron_axe', name: 'Hacha de Hierro', isBlock: false, toolType: 'axe', toolMaterial: 'iron', toolEfficiency: 8.0, attackDamage: 6.0, maxStack: 1, description: 'Hacha potente de hierro' },
  iron_shovel: { id: 'iron_shovel', name: 'Pala de Hierro', isBlock: false, toolType: 'shovel', toolMaterial: 'iron', toolEfficiency: 8.0, attackDamage: 4.0, maxStack: 1, description: 'Pala de hierro' },
  iron_hoe: { id: 'iron_hoe', name: 'Azada de Hierro', isBlock: false, toolType: 'hoe', toolMaterial: 'iron', toolEfficiency: 8.0, attackDamage: 3.0, maxStack: 1, description: 'Azada de hierro resistente' },

  // 6. Tools - Titanio (Titanium) - Nivel 6
  titanium_sword: { id: 'titanium_sword', name: 'Espada de Titanio', isBlock: false, toolType: 'sword', toolMaterial: 'titanium', toolEfficiency: 10.5, attackDamage: 8.5, maxStack: 1, description: 'Espada ligera y ultra afilada de titanio (+8.5 Daño)' },
  titanium_pickaxe: { id: 'titanium_pickaxe', name: 'Pico de Titanio', isBlock: false, toolType: 'pickaxe', toolMaterial: 'titanium', toolEfficiency: 10.5, attackDamage: 6.5, maxStack: 1, description: 'Pico de titanio de alto rendimiento para rocas duras' },
  titanium_axe: { id: 'titanium_axe', name: 'Hacha de Titanio', isBlock: false, toolType: 'axe', toolMaterial: 'titanium', toolEfficiency: 10.5, attackDamage: 7.5, maxStack: 1, description: 'Hacha de titanio de tala ultra rápida' },
  titanium_shovel: { id: 'titanium_shovel', name: 'Pala de Titanio', isBlock: false, toolType: 'shovel', toolMaterial: 'titanium', toolEfficiency: 10.5, attackDamage: 5.5, maxStack: 1, description: 'Pala de titanio de excavación rápida' },
  titanium_hoe: { id: 'titanium_hoe', name: 'Azada de Titanio', isBlock: false, toolType: 'hoe', toolMaterial: 'titanium', toolEfficiency: 10.5, attackDamage: 4.0, maxStack: 1, description: 'Azada de titanio avanzada' },

  // 7. Tools - Diamante (Diamond) - Nivel 7 (Mejor)
  diamond_sword: { id: 'diamond_sword', name: 'Espada de Diamante', isBlock: false, toolType: 'sword', toolMaterial: 'diamond', toolEfficiency: 13.0, attackDamage: 10.0, maxStack: 1, description: 'Espada legendaria resplandeciente de diamante (+10 Daño)' },
  diamond_pickaxe: { id: 'diamond_pickaxe', name: 'Pico de Diamante', isBlock: false, toolType: 'pickaxe', toolMaterial: 'diamond', toolEfficiency: 13.0, attackDamage: 8.0, maxStack: 1, description: 'Pico legendario de diamante para obsidiana y cualquier mineral' },
  diamond_axe: { id: 'diamond_axe', name: 'Hacha de Diamante', isBlock: false, toolType: 'axe', toolMaterial: 'diamond', toolEfficiency: 13.0, attackDamage: 9.0, maxStack: 1, description: 'Hacha suprema de diamante' },
  diamond_shovel: { id: 'diamond_shovel', name: 'Pala de Diamante', isBlock: false, toolType: 'shovel', toolMaterial: 'diamond', toolEfficiency: 13.0, attackDamage: 7.0, maxStack: 1, description: 'Pala suprema de diamante' },
  diamond_hoe: { id: 'diamond_hoe', name: 'Azada de Diamante', isBlock: false, toolType: 'hoe', toolMaterial: 'diamond', toolEfficiency: 13.0, attackDamage: 5.0, maxStack: 1, description: 'Azada legendaria de diamante' },
};

export const CHUNK_SIZE_X = 16;
export const CHUNK_SIZE_Z = 16;

// Vertical Layer Range: from Bedrock (-100) to Sky Build Limit (100), normal surface ~ 0
export const Y_MIN = -100;
export const Y_MAX = 100;
export const TOTAL_LAYERS = Y_MAX - Y_MIN + 1; // 201 layers
export const WORLD_HEIGHT = TOTAL_LAYERS;
export const SEA_LEVEL = 0; // Constant Sea Level at Y = 0, normal ground ~ 0 to 6

export const GRAVITY = 24.0;
export const JUMP_VELOCITY = 8.5;
export const PLAYER_SPEED = 4.3;
export const SPRINT_SPEED = 7.0;
export const FLY_SPEED = 9.0;
export const PLAYER_HEIGHT = 1.8;
export const PLAYER_WIDTH = 0.6;
export const EYE_HEIGHT = 1.62;
