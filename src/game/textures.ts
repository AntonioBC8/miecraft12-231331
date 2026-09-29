/**
 * Minecraft Web 3D - Procedural 16x16 Pixel Texture Generator & Atlas
 */
import * as THREE from 'three';
import { BlockType } from './constants';

export type FaceIndex = 'top' | 'bottom' | 'side' | 'front' | 'back' | 'left' | 'right';

// Cache
let atlasTexture: THREE.CanvasTexture | null = null;
let atlasCanvas: HTMLCanvasElement | null = null;
const iconCache = new Map<string, string>();

// Mapping of (BlockType, Face) to tile index in a 16x16 grid (0 to 255)
const TILE_MAP: Record<number, { top: number; bottom: number; side: number }> = {
  [BlockType.GRASS]: { top: 0, bottom: 2, side: 1 },
  [BlockType.DIRT]: { top: 2, bottom: 2, side: 2 },
  [BlockType.STONE]: { top: 3, bottom: 3, side: 3 },
  [BlockType.COBBLESTONE]: { top: 4, bottom: 4, side: 4 },
  [BlockType.WOOD]: { top: 5, bottom: 5, side: 6 },
  [BlockType.LEAVES]: { top: 7, bottom: 7, side: 7 },
  [BlockType.PLANKS]: { top: 8, bottom: 8, side: 8 },
  [BlockType.SAND]: { top: 9, bottom: 9, side: 9 },
  [BlockType.GLASS]: { top: 10, bottom: 10, side: 10 },
  [BlockType.WATER]: { top: 11, bottom: 11, side: 11 },
  [BlockType.BEDROCK]: { top: 12, bottom: 12, side: 12 },
  [BlockType.COAL_ORE]: { top: 13, bottom: 13, side: 13 },
  [BlockType.IRON_ORE]: { top: 14, bottom: 14, side: 14 },
  [BlockType.GOLD_ORE]: { top: 15, bottom: 15, side: 15 },
  [BlockType.DIAMOND_ORE]: { top: 16, bottom: 16, side: 16 },
  [BlockType.TORCH]: { top: 17, bottom: 17, side: 17 },
  [BlockType.CRAFTING_TABLE]: { top: 18, bottom: 8, side: 19 },
  [BlockType.BRICK]: { top: 20, bottom: 20, side: 20 },
  [BlockType.BOOKSHELF]: { top: 8, bottom: 8, side: 21 },
  [BlockType.TNT]: { top: 22, bottom: 22, side: 23 },
  [BlockType.WOOL_WHITE]: { top: 24, bottom: 24, side: 24 },
  [BlockType.WOOL_RED]: { top: 25, bottom: 25, side: 25 },
  [BlockType.WOOL_BLUE]: { top: 26, bottom: 26, side: 26 },
  [BlockType.POPPY]: { top: 27, bottom: 27, side: 27 },
  [BlockType.DANDELION]: { top: 28, bottom: 28, side: 28 },
  [BlockType.DEEPSLATE]: { top: 29, bottom: 29, side: 29 },
  [BlockType.COPPER_ORE]: { top: 30, bottom: 30, side: 30 },
  [BlockType.DEEPSLATE_COPPER_ORE]: { top: 31, bottom: 31, side: 31 },
  [BlockType.DEEPSLATE_COAL_ORE]: { top: 32, bottom: 32, side: 32 },
  [BlockType.DEEPSLATE_IRON_ORE]: { top: 33, bottom: 33, side: 33 },
  [BlockType.DEEPSLATE_GOLD_ORE]: { top: 34, bottom: 34, side: 34 },
  [BlockType.DEEPSLATE_DIAMOND_ORE]: { top: 35, bottom: 35, side: 35 },
  [BlockType.COPPER_BLOCK]: { top: 36, bottom: 36, side: 36 },
  [BlockType.COPPER_WIRE]: { top: 37, bottom: 37, side: 37 },
  [BlockType.COPPER_WIRE_ON]: { top: 38, bottom: 38, side: 38 },
  [BlockType.COPPER_LAMP]: { top: 39, bottom: 39, side: 39 },
  [BlockType.COPPER_LAMP_ON]: { top: 40, bottom: 40, side: 40 },
  [BlockType.COPPER_SWITCH]: { top: 41, bottom: 41, side: 41 },
  [BlockType.COPPER_SWITCH_ON]: { top: 42, bottom: 42, side: 42 },
  [BlockType.TERRACOTTA]: { top: 43, bottom: 43, side: 43 },
  [BlockType.RED_SAND]: { top: 44, bottom: 44, side: 44 },
  [BlockType.CACTUS]: { top: 45, bottom: 45, side: 46 },
  [BlockType.SANDSTONE]: { top: 47, bottom: 48, side: 48 },
  [BlockType.CHISELED_SANDSTONE]: { top: 47, bottom: 48, side: 49 },
  [BlockType.JUNGLE_WOOD]: { top: 50, bottom: 50, side: 51 },
  [BlockType.JUNGLE_LEAVES]: { top: 52, bottom: 52, side: 52 },
  [BlockType.KELP]: { top: 53, bottom: 53, side: 53 },
  [BlockType.STORAGE_WOOD]: { top: 118, bottom: 118, side: 119 },
  [BlockType.SNOW_BLOCK]: { top: 56, bottom: 56, side: 56 },
  [BlockType.SNOW_GRASS]: { top: 56, bottom: 2, side: 57 },
  [BlockType.ICE]: { top: 58, bottom: 58, side: 58 },
  [BlockType.PACKED_ICE]: { top: 59, bottom: 59, side: 59 },
  [BlockType.BLUE_ICE]: { top: 60, bottom: 60, side: 60 },
  [BlockType.SPRUCE_WOOD]: { top: 61, bottom: 61, side: 62 },
  [BlockType.SPRUCE_LEAVES]: { top: 63, bottom: 63, side: 63 },
  [BlockType.SPRUCE_PLANKS]: { top: 64, bottom: 64, side: 64 },
  [BlockType.BIRCH_WOOD]: { top: 65, bottom: 65, side: 66 },
  [BlockType.BIRCH_LEAVES]: { top: 67, bottom: 67, side: 67 },
  [BlockType.BIRCH_PLANKS]: { top: 68, bottom: 68, side: 68 },
  [BlockType.DARK_OAK_WOOD]: { top: 69, bottom: 69, side: 70 },
  [BlockType.DARK_OAK_LEAVES]: { top: 71, bottom: 71, side: 71 },
  [BlockType.DARK_OAK_PLANKS]: { top: 72, bottom: 72, side: 72 },
  [BlockType.ACACIA_WOOD]: { top: 73, bottom: 73, side: 74 },
  [BlockType.ACACIA_LEAVES]: { top: 75, bottom: 75, side: 75 },
  [BlockType.ACACIA_PLANKS]: { top: 76, bottom: 76, side: 76 },
  [BlockType.MANGROVE_WOOD]: { top: 77, bottom: 77, side: 78 },
  [BlockType.MANGROVE_LEAVES]: { top: 79, bottom: 79, side: 79 },
  [BlockType.MANGROVE_ROOTS]: { top: 80, bottom: 80, side: 80 },
  [BlockType.CHERRY_WOOD]: { top: 81, bottom: 81, side: 82 },
  [BlockType.CHERRY_LEAVES]: { top: 83, bottom: 83, side: 83 },
  [BlockType.CHERRY_PLANKS]: { top: 84, bottom: 84, side: 84 },
  [BlockType.SUNFLOWER]: { top: 85, bottom: 85, side: 85 },
  [BlockType.CORNFLOWER]: { top: 86, bottom: 86, side: 86 },
  [BlockType.TULIP]: { top: 87, bottom: 87, side: 87 },
  [BlockType.LILY_PAD]: { top: 88, bottom: 88, side: 88 },
  [BlockType.SUGAR_CANE]: { top: 89, bottom: 89, side: 89 },
  [BlockType.RED_MUSHROOM]: { top: 90, bottom: 90, side: 90 },
  [BlockType.BROWN_MUSHROOM]: { top: 91, bottom: 91, side: 91 },
  [BlockType.MUSHROOM_BLOCK_RED]: { top: 92, bottom: 92, side: 92 },
  [BlockType.MUSHROOM_BLOCK_BROWN]: { top: 93, bottom: 93, side: 93 },
  [BlockType.MUSHROOM_STEM]: { top: 94, bottom: 94, side: 94 },
  [BlockType.MYCELIUM]: { top: 95, bottom: 2, side: 95 },
  [BlockType.CORAL_BLOCK]: { top: 96, bottom: 96, side: 96 },
  [BlockType.SEA_PICKLE]: { top: 97, bottom: 97, side: 97 },
  [BlockType.MUD]: { top: 98, bottom: 98, side: 98 },
  [BlockType.PACKED_MUD]: { top: 99, bottom: 99, side: 99 },
  [BlockType.PODZOL]: { top: 100, bottom: 2, side: 100 },
  [BlockType.COARSE_DIRT]: { top: 101, bottom: 101, side: 101 },
  [BlockType.GRAVEL]: { top: 102, bottom: 102, side: 102 },
  [BlockType.RED_SANDSTONE]: { top: 103, bottom: 103, side: 103 },
  [BlockType.TERRACOTTA_ORANGE]: { top: 104, bottom: 104, side: 104 },
  [BlockType.TERRACOTTA_YELLOW]: { top: 105, bottom: 105, side: 105 },
  [BlockType.TERRACOTTA_WHITE]: { top: 106, bottom: 106, side: 106 },
  [BlockType.LAVA]: { top: 107, bottom: 107, side: 107 },
  [BlockType.OBSIDIAN]: { top: 108, bottom: 108, side: 108 },
  [BlockType.TITANIUM_ORE]: { top: 109, bottom: 109, side: 109 },
  [BlockType.DEEPSLATE_TITANIUM_ORE]: { top: 110, bottom: 110, side: 110 },
  [BlockType.TITANIUM_BLOCK]: { top: 111, bottom: 111, side: 111 },
  [BlockType.CRUDE_OIL]: { top: 113, bottom: 113, side: 113 },
  [BlockType.FURNACE]: { top: 115, bottom: 115, side: 114 },
  [BlockType.FURNACE_LIT]: { top: 115, bottom: 115, side: 116 },
  [BlockType.LANTERN]: { top: 117, bottom: 117, side: 117 },
  [BlockType.STORAGE_IRON]: { top: 120, bottom: 120, side: 121 },
  [BlockType.STORAGE_TITANIUM]: { top: 122, bottom: 122, side: 122 },
  [BlockType.STORAGE_DIAMOND]: { top: 123, bottom: 123, side: 123 },
  // Puertas (Bottom & Top)
  [BlockType.DOOR_OAK_BOTTOM]: { top: 124, bottom: 124, side: 124 },
  [BlockType.DOOR_OAK_TOP]: { top: 125, bottom: 125, side: 125 },
  [BlockType.DOOR_BIRCH_BOTTOM]: { top: 126, bottom: 126, side: 126 },
  [BlockType.DOOR_BIRCH_TOP]: { top: 127, bottom: 127, side: 127 },
  [BlockType.DOOR_SPRUCE_BOTTOM]: { top: 128, bottom: 128, side: 128 },
  [BlockType.DOOR_SPRUCE_TOP]: { top: 129, bottom: 129, side: 129 },
  [BlockType.DOOR_JUNGLE_BOTTOM]: { top: 130, bottom: 130, side: 130 },
  [BlockType.DOOR_JUNGLE_TOP]: { top: 131, bottom: 131, side: 131 },
  [BlockType.DOOR_ACACIA_BOTTOM]: { top: 132, bottom: 132, side: 132 },
  [BlockType.DOOR_ACACIA_TOP]: { top: 133, bottom: 133, side: 133 },
  [BlockType.DOOR_DARK_OAK_BOTTOM]: { top: 134, bottom: 134, side: 134 },
  [BlockType.DOOR_DARK_OAK_TOP]: { top: 135, bottom: 135, side: 135 },
  [BlockType.DOOR_MANGROVE_BOTTOM]: { top: 136, bottom: 136, side: 136 },
  [BlockType.DOOR_MANGROVE_TOP]: { top: 137, bottom: 137, side: 137 },
  [BlockType.DOOR_CHERRY_BOTTOM]: { top: 138, bottom: 138, side: 138 },
  [BlockType.DOOR_CHERRY_TOP]: { top: 139, bottom: 139, side: 139 },
  [BlockType.DOOR_IRON_BOTTOM]: { top: 140, bottom: 140, side: 140 },
  [BlockType.DOOR_IRON_TOP]: { top: 141, bottom: 141, side: 141 },
  [BlockType.DOOR_COPPER_BOTTOM]: { top: 142, bottom: 142, side: 142 },
  [BlockType.DOOR_COPPER_TOP]: { top: 143, bottom: 143, side: 143 },
  [BlockType.DOOR_DIAMOND_BOTTOM]: { top: 144, bottom: 144, side: 144 },
  [BlockType.DOOR_DIAMOND_TOP]: { top: 145, bottom: 145, side: 145 },
  // Biome foliage
  [BlockType.SHORT_GRASS]: { top: 146, bottom: 146, side: 146 },
  [BlockType.MEDIUM_GRASS]: { top: 147, bottom: 147, side: 147 },
  [BlockType.TALL_GRASS]: { top: 148, bottom: 148, side: 148 },
  [BlockType.FERN]: { top: 149, bottom: 149, side: 149 },
  [BlockType.DEAD_BUSH]: { top: 150, bottom: 150, side: 150 },
  [BlockType.FROSTED_GRASS]: { top: 151, bottom: 151, side: 151 },
};

function pseudoRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// Draw a single 16x16 tile on a canvas context
export function drawTile(ctx: CanvasRenderingContext2D, tileIdx: number, px: number, py: number) {
  let seed = tileIdx * 137 + 19;
  const rand = () => pseudoRandom(seed++);

  const drawNoise = (baseR: number, baseG: number, baseB: number, variance: number, a: number = 1.0) => {
    const imgData = ctx.createImageData(16, 16);
    const data = imgData.data;
    for (let i = 0; i < 16 * 16 * 4; i += 4) {
      const v = (rand() - 0.5) * variance;
      data[i] = Math.min(255, Math.max(0, baseR + v));
      data[i + 1] = Math.min(255, Math.max(0, baseG + v));
      data[i + 2] = Math.min(255, Math.max(0, baseB + v));
      data[i + 3] = Math.round(a * 255);
    }
    ctx.putImageData(imgData, px, py);
  };

  switch (tileIdx) {
    case 0: // Grass top (grayscale base for authentic biome vertex tinting)
      drawNoise(195, 195, 195, 28);
      break;

    case 1: { // Grass side
      drawNoise(134, 96, 67, 30);
      for (let x = 0; x < 16; x++) {
        const depth = Math.floor(rand() * 3) + 2;
        for (let y = 0; y < depth; y++) {
          const v = (rand() - 0.5) * 20;
          ctx.fillStyle = `rgb(${100 + v}, ${165 + v}, ${52 + v})`;
          ctx.fillRect(px + x, py + y, 1, 1);
        }
      }
      break;
    }

    case 2: // Dirt
      drawNoise(134, 96, 67, 34);
      break;

    case 3: // Stone
      drawNoise(122, 122, 122, 28);
      break;

    case 4: { // Cobblestone
      drawNoise(105, 105, 105, 24);
      ctx.strokeStyle = '#424242';
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const x = Math.floor(rand() * 12);
        const y = Math.floor(rand() * 12);
        ctx.strokeRect(px + x, py + y, 4, 3);
      }
      break;
    }

    case 5: { // Wood top
      drawNoise(178, 140, 85, 20);
      ctx.strokeStyle = '#5c4028';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 3, py + 3, 10, 10);
      ctx.strokeRect(px + 5, py + 5, 6, 6);
      break;
    }

    case 6: { // Wood side
      drawNoise(100, 75, 45, 25);
      for (let x = 0; x < 16; x += 2) {
        ctx.fillStyle = rand() > 0.4 ? '#4a351f' : '#735433';
        ctx.fillRect(px + x, py, 1, 16);
      }
      break;
    }

    case 7: { // Leaves
      const imgData = ctx.createImageData(16, 16);
      const data = imgData.data;
      for (let i = 0; i < 16 * 16 * 4; i += 4) {
        if (rand() > 0.16) {
          const v = (rand() - 0.5) * 36;
          data[i] = Math.min(255, Math.max(0, 52 + v));
          data[i + 1] = Math.min(255, Math.max(0, 125 + v));
          data[i + 2] = Math.min(255, Math.max(0, 32 + v));
          data[i + 3] = 255;
        } else {
          data[i + 3] = 0;
        }
      }
      ctx.putImageData(imgData, px, py);
      break;
    }

    case 8: { // Planks
      drawNoise(162, 122, 73, 20);
      ctx.fillStyle = '#6b4f2c';
      for (let y = 0; y < 16; y += 4) {
        ctx.fillRect(px, py + y, 16, 1);
      }
      ctx.fillRect(px + 5, py, 1, 4);
      ctx.fillRect(px + 11, py + 4, 1, 4);
      ctx.fillRect(px + 7, py + 8, 1, 4);
      ctx.fillRect(px + 3, py + 12, 1, 4);
      break;
    }

    case 9: { // Sand - Authentic warm Minecraft beach sand (no white lines or bright artifacts)
      drawNoise(218, 206, 152, 10);
      const sandGrains = [
        '#d4c489', '#dfd099', '#cbba7e', '#d9c98e', '#c8b678', '#e2d49e', '#bfad72', '#dcd095'
      ];
      for (let i = 0; i < 28; i++) {
        ctx.fillStyle = sandGrains[Math.floor(rand() * sandGrains.length)];
        ctx.fillRect(px + Math.floor(rand() * 16), py + Math.floor(rand() * 16), 1, 1);
      }
      break;
    }

    case 10: { // Glass - Clamped strictly within 16x16 bounds to prevent edge bleeding into neighbor tiles
      ctx.clearRect(px, py, 16, 16);
      ctx.fillStyle = 'rgba(215, 238, 248, 0.22)';
      ctx.fillRect(px + 1, py + 1, 14, 14);
      // Clean pixel borders strictly inside [px, px+15]
      ctx.fillStyle = 'rgba(235, 248, 255, 0.85)';
      ctx.fillRect(px, py, 16, 1);
      ctx.fillRect(px, py + 15, 16, 1);
      ctx.fillRect(px, py, 1, 16);
      ctx.fillRect(px + 15, py, 1, 16);
      // Classic pixel glints
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 2, py + 2, 4, 1);
      ctx.fillRect(px + 2, py + 3, 1, 3);
      ctx.fillRect(px + 10, py + 10, 3, 1);
      ctx.fillRect(px + 12, py + 11, 1, 2);
      break;
    }

    case 11: { // Water - Classic vibrant Minecraft water texture with wavelets
      drawNoise(42, 85, 215, 18, 0.72);
      const ripples = ['#2855cf', '#3a6ff0', '#4a82ff', '#2f5ed6', '#3568e6'];
      for (let y = 1; y < 15; y += 3) {
        ctx.fillStyle = ripples[Math.floor(rand() * ripples.length)];
        const rx = Math.floor(rand() * 8);
        ctx.fillRect(px + rx, py + y, 5 + Math.floor(rand() * 4), 1);
      }
      break;
    }

    case 12: { // Bedrock
      drawNoise(32, 32, 32, 25);
      ctx.fillStyle = '#111111';
      for (let i = 0; i < 15; i++) {
        ctx.fillRect(px + Math.floor(rand() * 16), py + Math.floor(rand() * 16), 2, 2);
      }
      break;
    }

    case 13: { // Coal ore
      drawNoise(122, 122, 122, 28);
      ctx.fillStyle = '#1c1c1c';
      for (let i = 0; i < 8; i++) {
        ctx.fillRect(px + Math.floor(rand() * 14) + 1, py + Math.floor(rand() * 14) + 1, 2, 2);
      }
      break;
    }

    case 14: { // Iron ore
      drawNoise(122, 122, 122, 28);
      ctx.fillStyle = '#d4ab82';
      for (let i = 0; i < 8; i++) {
        ctx.fillRect(px + Math.floor(rand() * 14) + 1, py + Math.floor(rand() * 14) + 1, 2, 2);
      }
      break;
    }

    case 15: { // Gold ore
      drawNoise(122, 122, 122, 28);
      ctx.fillStyle = '#fcee4b';
      for (let i = 0; i < 8; i++) {
        ctx.fillRect(px + Math.floor(rand() * 14) + 1, py + Math.floor(rand() * 14) + 1, 2, 2);
      }
      break;
    }

    case 16: { // Diamond ore
      drawNoise(122, 122, 122, 28);
      ctx.fillStyle = '#52f5fd';
      for (let i = 0; i < 9; i++) {
        ctx.fillRect(px + Math.floor(rand() * 14) + 1, py + Math.floor(rand() * 14) + 1, 2, 2);
      }
      break;
    }

    case 17: { // Enhanced Torch
      ctx.clearRect(px, py, 16, 16);
      // 1. Shaded Wooden Shaft (2x10 pixels with bevel highlights)
      ctx.fillStyle = '#5a3d1c'; // Dark wood shadow (left)
      ctx.fillRect(px + 7, py + 6, 1, 10);
      ctx.fillStyle = '#9e6d38'; // Warm oak body (right)
      ctx.fillRect(px + 8, py + 6, 1, 10);
      ctx.fillStyle = '#c48e4e'; // Subtle bottom highlight
      ctx.fillRect(px + 8, py + 14, 1, 2);

      // 2. Charred Charcoal Band at top of stick
      ctx.fillStyle = '#26221f';
      ctx.fillRect(px + 7, py + 5, 2, 2);

      // 3. Radiant Flame (Multi-layered incandescent fire)
      // Outer warm fire aura / corona
      ctx.fillStyle = 'rgba(255, 69, 0, 0.45)';
      ctx.fillRect(px + 5, py + 1, 6, 5);

      // Deep orange flame body
      ctx.fillStyle = '#e65100';
      ctx.fillRect(px + 6, py + 2, 4, 4);

      // Vibrant fiery orange-yellow
      ctx.fillStyle = '#ff9800';
      ctx.fillRect(px + 6, py + 2, 4, 3);
      ctx.fillRect(px + 7, py + 1, 2, 4);

      // Bright golden core
      ctx.fillStyle = '#ffeb3b';
      ctx.fillRect(px + 7, py + 2, 2, 3);

      // Incandescent white-hot center spark
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 7, py + 2, 1, 2);
      ctx.fillRect(px + 8, py + 3, 1, 1);

      // Dancing ember spark
      ctx.fillStyle = '#ffb300';
      ctx.fillRect(px + 8, py, 1, 1);
      break;
    }

    case 18: { // Crafting table top
      drawNoise(162, 122, 73, 20);
      ctx.strokeStyle = '#5a3d1c';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 3, py + 3, 10, 10);
      ctx.beginPath();
      ctx.moveTo(px + 6, py + 3); ctx.lineTo(px + 6, py + 13);
      ctx.moveTo(px + 10, py + 3); ctx.lineTo(px + 10, py + 13);
      ctx.moveTo(px + 3, py + 6); ctx.lineTo(px + 13, py + 6);
      ctx.moveTo(px + 3, py + 10); ctx.lineTo(px + 13, py + 10);
      ctx.stroke();
      break;
    }

    case 19: { // Crafting table side
      drawNoise(162, 122, 73, 20);
      ctx.fillStyle = '#4a2f13';
      ctx.fillRect(px, py, 16, 2);
      ctx.fillRect(px, py + 14, 16, 2);
      ctx.fillStyle = '#222222';
      ctx.fillRect(px + 4, py + 5, 2, 6);
      ctx.fillRect(px + 10, py + 6, 3, 5);
      break;
    }

    case 20: { // Brick
      drawNoise(165, 80, 60, 25);
      ctx.fillStyle = '#e8d5cb';
      for (let y = 0; y < 16; y += 4) {
        ctx.fillRect(px, py + y, 16, 1);
      }
      ctx.fillRect(px + 4, py, 1, 4);
      ctx.fillRect(px + 12, py, 1, 4);
      ctx.fillRect(px + 8, py + 4, 1, 4);
      ctx.fillRect(px, py + 8, 1, 4);
      ctx.fillRect(px + 8, py + 8, 1, 4);
      ctx.fillRect(px + 4, py + 12, 1, 4);
      ctx.fillRect(px + 12, py + 12, 1, 4);
      break;
    }

    case 21: { // Bookshelf side
      drawNoise(162, 122, 73, 20);
      ctx.fillStyle = '#5c4028';
      ctx.fillRect(px, py, 16, 2);
      ctx.fillRect(px, py + 7, 16, 2);
      ctx.fillRect(px, py + 14, 16, 2);
      const colors = ['#a02c2c', '#2c5ea0', '#2ca048', '#8a622c', '#d19e34', '#602ca0'];
      for (let y of [2, 9]) {
        let x = 1;
        while (x < 15) {
          const w = Math.min(Math.floor(rand() * 2) + 1, 15 - x);
          ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
          ctx.fillRect(px + x, py + y, w, 5);
          x += w + 1;
        }
      }
      break;
    }

    case 22: { // TNT top
      drawNoise(162, 122, 73, 20);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 7, py + 7, 2, 2);
      break;
    }

    case 23: { // TNT side
      ctx.fillStyle = '#cc2b2b';
      ctx.fillRect(px, py, 16, 16);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px, py + 6, 16, 5);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 5px monospace';
      ctx.fillText('TNT', px + 2, py + 10);
      break;
    }

    case 24: // Wool white
      drawNoise(235, 235, 235, 18);
      break;

    case 25: // Wool red
      drawNoise(180, 45, 45, 25);
      break;

    case 26: // Wool blue
      drawNoise(55, 75, 180, 25);
      break;

    case 27: { // Poppy
      ctx.clearRect(px, py, 16, 16);
      ctx.fillStyle = '#3a8024';
      ctx.fillRect(px + 7, py + 8, 2, 8);
      ctx.fillStyle = '#e62424';
      ctx.fillRect(px + 6, py + 4, 4, 4);
      ctx.fillStyle = '#ff6060';
      ctx.fillRect(px + 7, py + 5, 2, 2);
      ctx.fillStyle = '#111111';
      ctx.fillRect(px + 7, py + 6, 1, 1);
      break;
    }

    case 28: { // Dandelion
      ctx.clearRect(px, py, 16, 16);
      ctx.fillStyle = '#3a8024';
      ctx.fillRect(px + 7, py + 8, 2, 8);
      ctx.fillStyle = '#ffdd33';
      ctx.fillRect(px + 6, py + 4, 4, 4);
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(px + 7, py + 5, 2, 2);
      break;
    }

    case 29: { // Deepslate
      drawNoise(52, 53, 61, 16);
      ctx.fillStyle = '#25262c';
      ctx.fillRect(px, py + 3, 16, 2);
      ctx.fillRect(px, py + 8, 16, 2);
      ctx.fillRect(px, py + 13, 16, 2);
      ctx.fillStyle = '#454652';
      ctx.fillRect(px + 2, py + 5, 4, 1);
      ctx.fillRect(px + 9, py + 10, 5, 1);
      break;
    }

    case 30: { // Copper Ore
      drawNoise(122, 122, 122, 28);
      ctx.fillStyle = '#d46a3b';
      for (let i = 0; i < 7; i++) {
        ctx.fillRect(px + Math.floor(rand() * 14) + 1, py + Math.floor(rand() * 14) + 1, 2, 2);
      }
      ctx.fillStyle = '#44baa0'; // oxidized flecks
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(px + Math.floor(rand() * 14) + 1, py + Math.floor(rand() * 14) + 1, 2, 2);
      }
      break;
    }

    case 31: { // Deepslate Copper Ore
      drawNoise(52, 53, 61, 16);
      ctx.fillStyle = '#25262c';
      ctx.fillRect(px, py + 4, 16, 2);
      ctx.fillRect(px, py + 11, 16, 2);
      ctx.fillStyle = '#d46a3b';
      for (let i = 0; i < 7; i++) {
        ctx.fillRect(px + Math.floor(rand() * 14) + 1, py + Math.floor(rand() * 14) + 1, 2, 2);
      }
      ctx.fillStyle = '#44baa0';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(px + Math.floor(rand() * 14) + 1, py + Math.floor(rand() * 14) + 1, 2, 2);
      }
      break;
    }

    case 32: { // Deepslate Coal Ore
      drawNoise(52, 53, 61, 16);
      ctx.fillStyle = '#111113';
      for (let i = 0; i < 8; i++) {
        ctx.fillRect(px + Math.floor(rand() * 14) + 1, py + Math.floor(rand() * 14) + 1, 2, 2);
      }
      break;
    }

    case 33: { // Deepslate Iron Ore
      drawNoise(52, 53, 61, 16);
      ctx.fillStyle = '#d4ab82';
      for (let i = 0; i < 8; i++) {
        ctx.fillRect(px + Math.floor(rand() * 14) + 1, py + Math.floor(rand() * 14) + 1, 2, 2);
      }
      break;
    }

    case 34: { // Deepslate Gold Ore
      drawNoise(52, 53, 61, 16);
      ctx.fillStyle = '#fcee4b';
      for (let i = 0; i < 8; i++) {
        ctx.fillRect(px + Math.floor(rand() * 14) + 1, py + Math.floor(rand() * 14) + 1, 2, 2);
      }
      break;
    }

    case 35: { // Deepslate Diamond Ore
      drawNoise(52, 53, 61, 16);
      ctx.fillStyle = '#52f5fd';
      for (let i = 0; i < 9; i++) {
        ctx.fillRect(px + Math.floor(rand() * 14) + 1, py + Math.floor(rand() * 14) + 1, 2, 2);
      }
      break;
    }

    case 36: { // Copper Block
      drawNoise(190, 92, 59, 20);
      ctx.strokeStyle = '#933d22';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 1, py + 1, 14, 14);
      ctx.fillStyle = '#d97d52';
      ctx.fillRect(px + 2, py + 2, 12, 1);
      break;
    }

    case 37: { // Copper Wire (Off)
      ctx.clearRect(px, py, 16, 16);
      ctx.fillStyle = '#7a381f';
      ctx.fillRect(px + 6, py, 4, 16);
      ctx.fillRect(px, py + 6, 16, 4);
      ctx.fillStyle = '#b85832';
      ctx.fillRect(px + 7, py + 1, 2, 14);
      ctx.fillRect(px + 1, py + 7, 14, 2);
      break;
    }

    case 38: { // Copper Wire (On - Electric energized)
      ctx.clearRect(px, py, 16, 16);
      ctx.fillStyle = '#e85d22';
      ctx.fillRect(px + 5, py, 6, 16);
      ctx.fillRect(px, py + 5, 16, 6);
      ctx.fillStyle = '#ffb380';
      ctx.fillRect(px + 7, py, 2, 16);
      ctx.fillRect(px, py + 7, 16, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 7, py + 7, 2, 2);
      break;
    }

    case 39: { // Copper Lamp (Off)
      drawNoise(92, 50, 30, 15);
      ctx.fillStyle = '#2e190e';
      ctx.fillRect(px + 3, py + 3, 10, 10);
      ctx.strokeStyle = '#63331b';
      ctx.strokeRect(px + 2, py + 2, 12, 12);
      break;
    }

    case 40: { // Copper Lamp (On - Radiant glowing yellow/orange)
      drawNoise(150, 75, 40, 20);
      ctx.fillStyle = '#ffd15c';
      ctx.fillRect(px + 3, py + 3, 10, 10);
      ctx.fillStyle = '#fff4a3';
      ctx.fillRect(px + 5, py + 5, 6, 6);
      ctx.strokeStyle = '#c85e2b';
      ctx.strokeRect(px + 2, py + 2, 12, 12);
      break;
    }

    case 41: { // Copper Switch (Off)
      ctx.clearRect(px, py, 16, 16);
      ctx.fillStyle = '#555555';
      ctx.fillRect(px + 4, py + 4, 8, 8);
      ctx.fillStyle = '#b55830';
      ctx.fillRect(px + 7, py + 7, 2, 6);
      break;
    }

    case 42: { // Copper Switch (On)
      ctx.clearRect(px, py, 16, 16);
      ctx.fillStyle = '#555555';
      ctx.fillRect(px + 4, py + 4, 8, 8);
      ctx.fillStyle = '#ff7a45';
      ctx.fillRect(px + 7, py + 3, 2, 6);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(px + 5, py + 5, 2, 2);
      break;
    }

    case 43: { // Terracotta
      drawNoise(168, 83, 56, 18);
      break;
    }

    case 44: { // Red Sand - Badlands/Desert warm terracotta sand
      drawNoise(198, 104, 56, 12);
      const redGrains = ['#b85928', '#c76832', '#d6753c', '#a64e22', '#e0834a', '#cb6e38'];
      for (let i = 0; i < 26; i++) {
        ctx.fillStyle = redGrains[Math.floor(rand() * redGrains.length)];
        ctx.fillRect(px + Math.floor(rand() * 16), py + Math.floor(rand() * 16), 1, 1);
      }
      break;
    }

    case 45: { // Cactus Top
      drawNoise(85, 139, 47, 16);
      ctx.fillStyle = '#33691e';
      ctx.fillRect(px + 1, py + 1, 14, 14);
      ctx.fillStyle = '#558b2f';
      ctx.fillRect(px + 4, py + 4, 8, 8);
      ctx.fillStyle = '#1b5e20';
      ctx.fillRect(px + 7, py + 7, 2, 2);
      break;
    }

    case 46: { // Cactus Side (vertical ribs + spikes)
      drawNoise(60, 115, 30, 12);
      for (let x = 0; x < 16; x += 4) {
        ctx.fillStyle = '#33691e';
        ctx.fillRect(px + x, py, 2, 16);
        ctx.fillStyle = '#689f38';
        ctx.fillRect(px + x + 2, py, 2, 16);
      }
      // Spines
      ctx.fillStyle = '#ffffff';
      for (let y = 2; y < 16; y += 4) {
        ctx.fillRect(px + 3, py + y, 1, 1);
        ctx.fillRect(px + 11, py + y + 2, 1, 1);
      }
      break;
    }

    case 47: { // Sandstone Top
      drawNoise(215, 198, 150, 10);
      break;
    }

    case 48: { // Sandstone Side (desert strata)
      drawNoise(205, 185, 135, 14);
      ctx.fillStyle = '#bda56e';
      ctx.fillRect(px, py + 3, 16, 2);
      ctx.fillRect(px, py + 9, 16, 2);
      ctx.fillRect(px, py + 14, 16, 2);
      break;
    }

    case 49: { // Chiseled Sandstone (Creeper glyph)
      drawNoise(195, 175, 125, 10);
      ctx.fillStyle = '#a68c55';
      ctx.fillRect(px + 2, py + 2, 12, 12);
      ctx.fillStyle = '#7a6438';
      // Creeper carved eyes & mouth
      ctx.fillRect(px + 4, py + 4, 3, 3);
      ctx.fillRect(px + 9, py + 4, 3, 3);
      ctx.fillRect(px + 6, py + 7, 4, 3);
      ctx.fillRect(px + 5, py + 9, 2, 4);
      ctx.fillRect(px + 9, py + 9, 2, 4);
      break;
    }

    case 50: { // Jungle Wood Top (growth rings)
      drawNoise(141, 110, 99, 14);
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(px + 3, py + 3, 10, 10);
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(px + 6, py + 6, 4, 4);
      break;
    }

    case 51: { // Jungle Wood Side (tropical bark with moss speckles)
      drawNoise(92, 64, 51, 16);
      for (let y = 0; y < 16; y++) {
        if ((y * 11) % 3 === 0) {
          ctx.fillStyle = '#3e2723';
          ctx.fillRect(px, py + y, 16, 1);
        }
      }
      // Moss speckles
      ctx.fillStyle = '#4c783c';
      ctx.fillRect(px + 3, py + 4, 2, 2);
      ctx.fillRect(px + 10, py + 9, 3, 2);
      break;
    }

    case 52: { // Jungle Leaves (vibrant tropical emerald leaves)
      drawNoise(46, 122, 31, 24);
      for (let i = 0; i < 22; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#1b5e20' : '#43a047';
        ctx.fillRect(px + Math.floor(rand() * 15), py + Math.floor(rand() * 15), 2, 2);
      }
      break;
    }

    case 53: { // Kelp (seaweed blade)
      ctx.clearRect(px, py, 16, 16);
      ctx.fillStyle = '#1b5e20';
      ctx.fillRect(px + 6, py, 4, 16);
      ctx.fillStyle = '#43a047';
      ctx.fillRect(px + 7, py + 1, 2, 14);
      // Kelp fronds
      ctx.fillStyle = '#2e7d32';
      ctx.fillRect(px + 4, py + 3, 3, 2);
      ctx.fillRect(px + 9, py + 7, 3, 2);
      ctx.fillRect(px + 4, py + 11, 3, 2);
      break;
    }

    case 54: { // Chest Top / Bottom
      drawNoise(139, 90, 43, 14);
      ctx.strokeStyle = '#3e2723';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, 15, 15);
      break;
    }

    case 55: { // Chest Front / Side (with lock latch)
      drawNoise(139, 90, 43, 14);
      ctx.fillStyle = '#3e2723';
      ctx.fillRect(px, py + 6, 16, 2);
      // Silver latch
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(px + 7, py + 5, 2, 4);
      ctx.fillStyle = '#212121';
      ctx.fillRect(px + 7.5, py + 6.5, 1, 1);
      break;
    }

    // --- NEW BIOME BLOCKS & FLORA TILES ---
    case 56: // Snow block / Snow top
      drawNoise(244, 248, 252, 12);
      break;

    case 57: { // Snow grass side (dirt + snow blanket)
      drawNoise(134, 96, 67, 30);
      for (let x = 0; x < 16; x++) {
        const depth = Math.floor(rand() * 3) + 3;
        for (let y = 0; y < depth; y++) {
          const v = (rand() - 0.5) * 10;
          ctx.fillStyle = `rgb(${244 + v}, ${248 + v}, ${252 + v})`;
          ctx.fillRect(px + x, py + y, 1, 1);
        }
      }
      break;
    }

    case 58: { // Ice (translucent icy blue)
      drawNoise(144, 212, 237, 24, 0.85);
      ctx.strokeStyle = '#cbf0fc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 2, py + 14);
      ctx.lineTo(px + 8, py + 6);
      ctx.lineTo(px + 14, py + 2);
      ctx.stroke();
      break;
    }

    case 59: // Packed ice
      drawNoise(142, 199, 232, 20);
      ctx.fillStyle = '#bce6fb';
      ctx.fillRect(px + 3, py + 4, 3, 2);
      ctx.fillRect(px + 9, py + 10, 4, 2);
      break;

    case 60: // Blue ice
      drawNoise(101, 174, 230, 26);
      ctx.fillStyle = '#a2dcfc';
      ctx.fillRect(px + 2, py + 3, 4, 3);
      ctx.fillRect(px + 8, py + 8, 5, 3);
      break;

    case 61: { // Spruce wood top
      drawNoise(92, 64, 40, 18);
      ctx.strokeStyle = '#3b2818';
      ctx.strokeRect(px + 3, py + 3, 10, 10);
      ctx.strokeRect(px + 5, py + 5, 6, 6);
      break;
    }

    case 62: { // Spruce wood side (dark bark)
      drawNoise(59, 40, 24, 22);
      for (let x = 0; x < 16; x += 2) {
        ctx.fillStyle = rand() > 0.4 ? '#2d1e12' : '#4a3320';
        ctx.fillRect(px + x, py, 1, 16);
      }
      break;
    }

    case 63: // Spruce leaves (conifer needles)
      drawNoise(40, 77, 51, 30);
      break;

    case 64: { // Spruce planks
      drawNoise(104, 78, 50, 18);
      ctx.fillStyle = '#483420';
      ctx.fillRect(px, py + 4, 16, 1);
      ctx.fillRect(px, py + 8, 16, 1);
      ctx.fillRect(px, py + 12, 16, 1);
      break;
    }

    case 65: { // Birch wood top
      drawNoise(214, 211, 200, 16);
      ctx.strokeStyle = '#9a9486';
      ctx.strokeRect(px + 3, py + 3, 10, 10);
      ctx.strokeRect(px + 5, py + 5, 6, 6);
      break;
    }

    case 66: { // Birch wood side (white bark with black spots)
      drawNoise(229, 226, 218, 12);
      ctx.fillStyle = '#262423';
      ctx.fillRect(px + 2, py + 3, 3, 1);
      ctx.fillRect(px + 10, py + 5, 4, 1);
      ctx.fillRect(px + 4, py + 9, 3, 1);
      ctx.fillRect(px + 11, py + 12, 3, 1);
      ctx.fillRect(px + 1, py + 14, 2, 1);
      break;
    }

    case 67: // Birch leaves
      drawNoise(91, 138, 54, 28);
      break;

    case 68: { // Birch planks
      drawNoise(194, 176, 131, 16);
      ctx.fillStyle = '#9e8c62';
      ctx.fillRect(px, py + 4, 16, 1);
      ctx.fillRect(px, py + 8, 16, 1);
      ctx.fillRect(px, py + 12, 16, 1);
      break;
    }

    case 69: { // Dark oak top
      drawNoise(45, 31, 19, 14);
      ctx.strokeStyle = '#22160d';
      ctx.strokeRect(px + 3, py + 3, 10, 10);
      ctx.strokeRect(px + 5, py + 5, 6, 6);
      break;
    }

    case 70: { // Dark oak side
      drawNoise(34, 22, 13, 18);
      for (let x = 0; x < 16; x += 2) {
        ctx.fillStyle = rand() > 0.4 ? '#190f08' : '#2d1e12';
        ctx.fillRect(px + x, py, 1, 16);
      }
      break;
    }

    case 71: // Dark oak leaves
      drawNoise(29, 77, 26, 24);
      break;

    case 72: { // Dark oak planks
      drawNoise(67, 42, 24, 16);
      ctx.fillStyle = '#2d1b0e';
      ctx.fillRect(px, py + 4, 16, 1);
      ctx.fillRect(px, py + 8, 16, 1);
      ctx.fillRect(px, py + 12, 16, 1);
      break;
    }

    case 73: { // Acacia wood top
      drawNoise(138, 131, 119, 16);
      ctx.strokeStyle = '#676157';
      ctx.strokeRect(px + 3, py + 3, 10, 10);
      ctx.strokeRect(px + 5, py + 5, 6, 6);
      break;
    }

    case 74: { // Acacia wood side (gray bark)
      drawNoise(103, 97, 87, 20);
      for (let x = 0; x < 16; x += 2) {
        ctx.fillStyle = rand() > 0.4 ? '#4a463e' : '#7d766a';
        ctx.fillRect(px + x, py, 1, 16);
      }
      break;
    }

    case 75: // Acacia leaves (savannah olive)
      drawNoise(78, 110, 34, 26);
      break;

    case 76: { // Acacia planks (orange)
      drawNoise(168, 90, 50, 18);
      ctx.fillStyle = '#8f4620';
      ctx.fillRect(px, py + 4, 16, 1);
      ctx.fillRect(px, py + 8, 16, 1);
      ctx.fillRect(px, py + 12, 16, 1);
      break;
    }

    case 77: { // Mangrove wood top
      drawNoise(107, 46, 36, 16);
      ctx.strokeStyle = '#471c14';
      ctx.strokeRect(px + 3, py + 3, 10, 10);
      break;
    }

    case 78: { // Mangrove wood side
      drawNoise(84, 38, 34, 20);
      for (let x = 0; x < 16; x += 2) {
        ctx.fillStyle = rand() > 0.4 ? '#3b1814' : '#632b25';
        ctx.fillRect(px + x, py, 1, 16);
      }
      break;
    }

    case 79: // Mangrove leaves
      drawNoise(66, 104, 41, 26);
      break;

    case 80: { // Mangrove roots
      drawNoise(71, 49, 33, 24);
      ctx.strokeStyle = '#382516';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px + 2, py + 1);
      ctx.lineTo(px + 6, py + 15);
      ctx.moveTo(px + 14, py + 1);
      ctx.lineTo(px + 10, py + 15);
      ctx.stroke();
      break;
    }

    case 81: { // Cherry wood top
      drawNoise(245, 204, 212, 16);
      ctx.strokeStyle = '#c48995';
      ctx.strokeRect(px + 3, py + 3, 10, 10);
      break;
    }

    case 82: { // Cherry wood side
      drawNoise(52, 31, 38, 20);
      for (let x = 0; x < 16; x += 2) {
        ctx.fillStyle = rand() > 0.4 ? '#25131a' : '#452732';
        ctx.fillRect(px + x, py, 1, 16);
      }
      break;
    }

    case 83: { // Cherry leaves (pink blossom petals)
      drawNoise(248, 165, 194, 26);
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(px + Math.floor(rand() * 15), py + Math.floor(rand() * 15), 1, 1);
      }
      break;
    }

    case 84: { // Cherry planks
      drawNoise(232, 169, 182, 16);
      ctx.fillStyle = '#b87786';
      ctx.fillRect(px, py + 4, 16, 1);
      ctx.fillRect(px, py + 8, 16, 1);
      ctx.fillRect(px, py + 12, 16, 1);
      break;
    }

    case 85: { // Sunflower
      ctx.clearRect(px, py, 16, 16);
      ctx.fillStyle = '#2e7d32';
      ctx.fillRect(px + 7, py + 6, 2, 10);
      // Yellow petals
      ctx.fillStyle = '#f9ca24';
      ctx.beginPath();
      ctx.arc(px + 8, py + 6, 5, 0, Math.PI * 2);
      ctx.fill();
      // Brown center
      ctx.fillStyle = '#593c17';
      ctx.beginPath();
      ctx.arc(px + 8, py + 6, 2.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 86: { // Cornflower
      ctx.clearRect(px, py, 16, 16);
      ctx.fillStyle = '#2e7d32';
      ctx.fillRect(px + 7, py + 7, 2, 9);
      ctx.fillStyle = '#3867d6';
      ctx.fillRect(px + 6, py + 3, 4, 4);
      ctx.fillRect(px + 5, py + 4, 6, 2);
      break;
    }

    case 87: { // Tulip (red)
      ctx.clearRect(px, py, 16, 16);
      ctx.fillStyle = '#2e7d32';
      ctx.fillRect(px + 7, py + 7, 2, 9);
      ctx.fillStyle = '#eb4d4b';
      ctx.fillRect(px + 6, py + 3, 4, 5);
      ctx.fillRect(px + 5, py + 3, 2, 3);
      ctx.fillRect(px + 9, py + 3, 2, 3);
      break;
    }

    case 88: { // Lily pad
      ctx.clearRect(px, py, 16, 16);
      ctx.fillStyle = '#267b36';
      ctx.beginPath();
      ctx.arc(px + 8, py + 8, 7, 0.3, Math.PI * 2 - 0.3);
      ctx.lineTo(px + 8, py + 8);
      ctx.fill();
      break;
    }

    case 89: { // Sugar cane
      ctx.clearRect(px, py, 16, 16);
      ctx.fillStyle = '#6ab04c';
      ctx.fillRect(px + 4, py, 3, 16);
      ctx.fillRect(px + 9, py, 3, 16);
      ctx.fillStyle = '#447a2e';
      ctx.fillRect(px + 4, py + 5, 3, 1);
      ctx.fillRect(px + 4, py + 11, 3, 1);
      ctx.fillRect(px + 9, py + 7, 3, 1);
      ctx.fillRect(px + 9, py + 13, 3, 1);
      break;
    }

    case 90: { // Red mushroom
      ctx.clearRect(px, py, 16, 16);
      ctx.fillStyle = '#d2cbbf';
      ctx.fillRect(px + 7, py + 9, 2, 7);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(px + 4, py + 4, 8, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 5, py + 5, 2, 2);
      ctx.fillRect(px + 9, py + 6, 2, 2);
      break;
    }

    case 91: { // Brown mushroom
      ctx.clearRect(px, py, 16, 16);
      ctx.fillStyle = '#d2cbbf';
      ctx.fillRect(px + 7, py + 9, 2, 7);
      ctx.fillStyle = '#a07855';
      ctx.fillRect(px + 3, py + 6, 10, 3);
      break;
    }

    case 92: { // Mushroom block red
      drawNoise(214, 48, 49, 18);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 3, py + 4, 3, 3);
      ctx.fillRect(px + 10, py + 9, 3, 3);
      break;
    }

    case 93: // Mushroom block brown
      drawNoise(139, 101, 64, 18);
      break;

    case 94: // Mushroom stem
      drawNoise(210, 203, 191, 14);
      break;

    case 95: { // Mycelium (ashy purple-gray with spores)
      drawNoise(111, 98, 101, 24);
      ctx.fillStyle = '#b899ad';
      ctx.fillRect(px + 3, py + 2, 2, 2);
      ctx.fillRect(px + 11, py + 7, 2, 2);
      ctx.fillRect(px + 6, py + 12, 2, 2);
      break;
    }

    case 96: // Coral block (neon hot pink)
      drawNoise(255, 77, 136, 26);
      ctx.fillStyle = '#d1296c';
      ctx.fillRect(px + 2, py + 5, 3, 2);
      ctx.fillRect(px + 9, py + 11, 4, 2);
      break;

    case 97: { // Sea pickle
      ctx.clearRect(px, py, 16, 16);
      ctx.fillStyle = '#4cd137';
      ctx.fillRect(px + 5, py + 5, 3, 8);
      ctx.fillRect(px + 9, py + 7, 3, 6);
      ctx.fillStyle = '#26de81';
      ctx.fillRect(px + 6, py + 4, 1, 2);
      break;
    }

    case 98: // Mud
      drawNoise(60, 56, 61, 16);
      break;

    case 99: { // Packed mud
      drawNoise(85, 79, 73, 18);
      ctx.fillStyle = '#423d38';
      ctx.fillRect(px, py + 5, 16, 1);
      ctx.fillRect(px, py + 11, 16, 1);
      break;
    }

    case 100: // Podzol
      drawNoise(88, 62, 38, 22);
      ctx.fillStyle = '#3a2717';
      ctx.fillRect(px + 2, py + 3, 4, 2);
      ctx.fillRect(px + 9, py + 9, 3, 2);
      break;

    case 101: // Coarse dirt
      drawNoise(119, 83, 56, 26);
      ctx.fillStyle = '#7a7a7a';
      ctx.fillRect(px + 4, py + 3, 2, 2);
      ctx.fillRect(px + 11, py + 10, 2, 2);
      break;

    case 102: // Gravel
      drawNoise(120, 115, 115, 28);
      ctx.fillStyle = '#595656';
      ctx.fillRect(px + 3, py + 4, 3, 2);
      ctx.fillRect(px + 8, py + 10, 4, 3);
      break;

    case 103: { // Red sandstone
      drawNoise(184, 83, 40, 18);
      ctx.fillStyle = '#9e421c';
      ctx.fillRect(px, py + 5, 16, 1);
      ctx.fillRect(px, py + 11, 16, 1);
      break;
    }

    case 104: // Terracotta orange
      drawNoise(161, 83, 37, 16);
      break;

    case 105: // Terracotta yellow
      drawNoise(184, 135, 45, 16);
      break;

    case 106: // Terracotta white
      drawNoise(209, 178, 161, 16);
      break;

    case 107: { // Lava
      drawNoise(235, 90, 15, 24);
      ctx.fillStyle = '#ffc83b';
      ctx.fillRect(px + 2, py + 3, 3, 2);
      ctx.fillRect(px + 9, py + 8, 4, 3);
      ctx.fillRect(px + 4, py + 12, 3, 2);
      ctx.fillStyle = '#9e1a00';
      ctx.fillRect(px + 7, py + 2, 2, 2);
      ctx.fillRect(px + 12, py + 11, 2, 2);
      break;
    }

    case 108: { // Obsidian
      drawNoise(22, 16, 34, 14);
      ctx.fillStyle = '#483363';
      ctx.fillRect(px + 3, py + 3, 2, 2);
      ctx.fillRect(px + 11, py + 5, 2, 2);
      ctx.fillRect(px + 7, py + 10, 3, 2);
      ctx.fillRect(px + 2, py + 12, 2, 2);
      ctx.fillStyle = '#7a5a9c';
      ctx.fillRect(px + 12, py + 6, 1, 1);
      ctx.fillRect(px + 8, py + 11, 1, 1);
      break;
    }

    case 109: { // Titanium Ore
      drawNoise(122, 122, 122, 28);
      ctx.fillStyle = '#b0c4de';
      for (let i = 0; i < 7; i++) {
        ctx.fillRect(px + Math.floor(rand() * 13) + 1, py + Math.floor(rand() * 13) + 1, 2, 2);
      }
      ctx.fillStyle = '#e6f2ff';
      ctx.fillRect(px + 5, py + 6, 2, 2);
      ctx.fillRect(px + 10, py + 11, 2, 2);
      break;
    }

    case 110: { // Deepslate Titanium Ore
      drawNoise(52, 53, 61, 16);
      ctx.fillStyle = '#25262c';
      ctx.fillRect(px, py + 3, 16, 2);
      ctx.fillRect(px, py + 8, 16, 2);
      ctx.fillRect(px, py + 13, 16, 2);
      ctx.fillStyle = '#b0c4de';
      for (let i = 0; i < 7; i++) {
        ctx.fillRect(px + Math.floor(rand() * 13) + 1, py + Math.floor(rand() * 13) + 1, 2, 2);
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 6, py + 5, 2, 2);
      ctx.fillRect(px + 11, py + 10, 2, 2);
      break;
    }

    case 111: { // Titanium Block
      drawNoise(176, 196, 222, 14);
      ctx.strokeStyle = '#708090';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 1, py + 1, 14, 14);
      ctx.fillStyle = '#e6f2ff';
      ctx.fillRect(px + 2, py + 2, 12, 1);
      ctx.fillRect(px + 2, py + 2, 1, 12);
      ctx.fillStyle = '#465362';
      ctx.fillRect(px + 2, py + 2, 1, 1);
      ctx.fillRect(px + 13, py + 2, 1, 1);
      ctx.fillRect(px + 2, py + 13, 1, 1);
      ctx.fillRect(px + 13, py + 13, 1, 1);
      break;
    }

    case 112: { // Petroleum Ore (Crude oil deposit)
      drawNoise(45, 48, 52, 16);
      ctx.fillStyle = '#111215';
      ctx.fillRect(px + 2, py + 3, 12, 4);
      ctx.fillRect(px + 3, py + 9, 10, 4);
      ctx.fillStyle = '#1e272e';
      ctx.fillRect(px + 4, py + 4, 8, 2);
      ctx.fillRect(px + 5, py + 10, 6, 2);
      ctx.fillStyle = '#3a4a58';
      ctx.fillRect(px + 5, py + 3, 2, 1);
      ctx.fillRect(px + 10, py + 9, 2, 1);
      break;
    }

    case 113: { // Furnace front unlit
      drawNoise(122, 122, 122, 20);
      ctx.fillStyle = '#222226';
      ctx.fillRect(px + 3, py + 7, 10, 7);
      ctx.fillStyle = '#111114';
      ctx.fillRect(px + 4, py + 8, 8, 5);
      ctx.fillStyle = '#38383e';
      ctx.fillRect(px + 4, py + 3, 8, 2);
      break;
    }

    case 114: { // Furnace front lit
      drawNoise(122, 122, 122, 20);
      ctx.fillStyle = '#222226';
      ctx.fillRect(px + 3, py + 7, 10, 7);
      ctx.fillStyle = '#e65100';
      ctx.fillRect(px + 4, py + 8, 8, 5);
      ctx.fillStyle = '#ffb300';
      ctx.fillRect(px + 5, py + 9, 6, 3);
      ctx.fillStyle = '#fff9c4';
      ctx.fillRect(px + 6, py + 10, 4, 1);
      break;
    }

    case 113: { // Crude Oil Liquid
      drawNoise(22, 23, 26, 8);
      ctx.fillStyle = '#0f1012';
      ctx.fillRect(px, py, 16, 16);
      ctx.fillStyle = '#1c1e24';
      ctx.fillRect(px + 2, py + 3, 6, 4);
      ctx.fillRect(px + 9, py + 9, 5, 4);
      ctx.fillStyle = 'rgba(78, 140, 255, 0.25)';
      ctx.fillRect(px + 4, py + 4, 3, 2);
      ctx.fillStyle = 'rgba(180, 80, 255, 0.22)';
      ctx.fillRect(px + 8, py + 10, 3, 2);
      ctx.fillStyle = 'rgba(60, 240, 180, 0.20)';
      ctx.fillRect(px + 11, py + 5, 2, 2);
      break;
    }

    case 114: { // Furnace Front (Unlit) - Authentic Masonry & Firebox
      drawNoise(115, 115, 118, 16);
      ctx.strokeStyle = '#3e3e44';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, 15, 15);
      ctx.beginPath();
      ctx.moveTo(px, py + 4.5); ctx.lineTo(px + 16, py + 4.5);
      ctx.moveTo(px, py + 9.5); ctx.lineTo(px + 16, py + 9.5);
      ctx.stroke();

      ctx.fillStyle = '#141416';
      ctx.fillRect(px + 3, py + 5, 10, 8);
      ctx.fillRect(px + 4, py + 4, 8, 1);
      ctx.fillRect(px + 5, py + 3, 6, 1);

      ctx.fillStyle = '#222226';
      ctx.fillRect(px + 4, py + 11, 8, 2);
      ctx.fillStyle = '#3a3a42';
      ctx.fillRect(px + 5, py + 7, 1, 4);
      ctx.fillRect(px + 7, py + 6, 1, 5);
      ctx.fillRect(px + 9, py + 6, 1, 5);
      ctx.fillRect(px + 11, py + 7, 1, 4);

      ctx.fillStyle = '#1e1e22';
      ctx.fillRect(px + 6, py + 1, 4, 1);
      break;
    }

    case 115: { // Furnace Top & Bottom - Hearth Stone with Heat Chamber Ring
      drawNoise(125, 125, 128, 14);
      ctx.strokeStyle = '#424248';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 1, py + 1, 14, 14);
      ctx.strokeStyle = '#2d2d32';
      ctx.beginPath();
      ctx.arc(px + 8, py + 8, 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#35353c';
      ctx.fillRect(px + 7, py + 7, 2, 2);
      break;
    }

    case 116: { // Furnace Front (Lit) - Intense Blazing Hearth & Fiery Glow
      drawNoise(115, 112, 110, 16);
      ctx.fillStyle = 'rgba(255, 100, 20, 0.18)';
      ctx.fillRect(px, py, 16, 16);
      ctx.strokeStyle = '#4a3a30';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, 15, 15);

      ctx.fillStyle = '#7a1805';
      ctx.fillRect(px + 3, py + 4, 10, 9);
      ctx.fillRect(px + 4, py + 3, 8, 2);

      ctx.fillStyle = '#e64a19';
      ctx.fillRect(px + 4, py + 6, 8, 6);

      ctx.fillStyle = '#fbc02d';
      ctx.fillRect(px + 5, py + 7, 6, 5);
      ctx.fillRect(px + 6, py + 5, 4, 3);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 6, py + 8, 4, 3);
      ctx.fillRect(px + 7, py + 6, 2, 3);

      ctx.fillStyle = '#261208';
      ctx.fillRect(px + 4, py + 11, 8, 2);
      ctx.fillStyle = '#421a08';
      ctx.fillRect(px + 5, py + 8, 1, 3);
      ctx.fillRect(px + 7, py + 7, 1, 4);
      ctx.fillRect(px + 9, py + 7, 1, 4);
      ctx.fillRect(px + 11, py + 8, 1, 3);
      break;
    }

    case 117: { // Lantern - Ornate Ironwork & Brilliant Radiant Flame
      ctx.clearRect(px, py, 16, 16);
      ctx.fillStyle = '#2b2c30';
      ctx.fillRect(px + 7, py + 0, 2, 2);
      ctx.fillStyle = '#404248';
      ctx.fillRect(px + 6, py + 1, 4, 1);

      ctx.fillStyle = '#32343a';
      ctx.fillRect(px + 4, py + 2, 8, 2);
      ctx.fillStyle = '#1e1f22';
      ctx.fillRect(px + 3, py + 4, 10, 1);

      ctx.fillStyle = '#2b2c30';
      ctx.fillRect(px + 3, py + 5, 2, 7);
      ctx.fillRect(px + 11, py + 5, 2, 7);
      ctx.fillRect(px + 3, py + 12, 10, 2);
      ctx.fillStyle = '#45474f';
      ctx.fillRect(px + 4, py + 13, 8, 1);

      ctx.fillStyle = 'rgba(255, 230, 130, 0.45)';
      ctx.fillRect(px + 5, py + 5, 6, 7);

      ctx.fillStyle = '#ff9800';
      ctx.fillRect(px + 6, py + 7, 4, 4);
      ctx.fillStyle = '#ffeb3b';
      ctx.fillRect(px + 6, py + 6, 4, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 7, py + 7, 2, 3);
      break;
    }

    case 118: { // Storage Crate Wood (Top)
      drawNoise(165, 118, 68, 16);
      ctx.strokeStyle = '#5a3d1c';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, 15, 15);
      ctx.beginPath();
      ctx.moveTo(px, py + 8); ctx.lineTo(px + 16, py + 8);
      ctx.stroke();
      ctx.fillStyle = '#3a3d44';
      ctx.fillRect(px + 1, py + 1, 3, 3);
      ctx.fillRect(px + 12, py + 1, 3, 3);
      ctx.fillRect(px + 1, py + 12, 3, 3);
      ctx.fillRect(px + 12, py + 12, 3, 3);
      ctx.fillStyle = '#8a929e';
      ctx.fillRect(px + 2, py + 2, 1, 1);
      ctx.fillRect(px + 13, py + 2, 1, 1);
      ctx.fillRect(px + 2, py + 13, 1, 1);
      ctx.fillRect(px + 13, py + 13, 1, 1);
      break;
    }

    case 119: { // Storage Crate Wood (Side)
      drawNoise(165, 118, 68, 16);
      ctx.strokeStyle = '#5a3d1c';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, 15, 15);
      ctx.fillStyle = '#4e3316';
      ctx.fillRect(px, py + 5, 16, 1);
      ctx.fillRect(px, py + 10, 16, 1);
      ctx.fillStyle = '#3a3d44';
      ctx.fillRect(px + 1, py + 1, 2, 14);
      ctx.fillRect(px + 13, py + 1, 2, 14);
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(px + 6, py + 6, 4, 4);
      ctx.fillStyle = '#dfe4ea';
      ctx.fillRect(px + 7, py + 7, 2, 2);
      break;
    }

    case 120: { // Storage Crate Iron (Top)
      drawNoise(195, 200, 205, 12);
      ctx.strokeStyle = '#57606f';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, 15, 15);
      ctx.fillStyle = '#747d8c';
      ctx.fillRect(px + 2, py + 7, 12, 2);
      ctx.fillRect(px + 7, py + 2, 2, 12);
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(px + 2, py + 2, 2, 2);
      ctx.fillRect(px + 12, py + 2, 2, 2);
      ctx.fillRect(px + 2, py + 12, 2, 2);
      ctx.fillRect(px + 12, py + 12, 2, 2);
      break;
    }

    case 121: { // Storage Crate Iron (Side)
      drawNoise(195, 200, 205, 12);
      ctx.strokeStyle = '#57606f';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, 15, 15);
      ctx.fillStyle = '#747d8c';
      ctx.fillRect(px, py + 2, 16, 2);
      ctx.fillRect(px, py + 12, 16, 2);
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(px + 6, py + 5, 4, 6);
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(px + 7, py + 7, 2, 2);
      break;
    }

    case 122: { // Storage Crate Titanium (All sides)
      drawNoise(85, 102, 118, 14);
      ctx.strokeStyle = '#2d3e50';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, 15, 15);
      ctx.fillStyle = '#536878';
      ctx.fillRect(px + 2, py + 2, 12, 12);
      ctx.fillStyle = '#00cec9';
      ctx.fillRect(px + 7, py + 2, 2, 12);
      ctx.fillRect(px + 2, py + 7, 12, 2);
      ctx.fillStyle = '#81ecec';
      ctx.fillRect(px + 7, py + 7, 2, 2);
      break;
    }

    case 123: { // Storage Crate Diamond (All sides)
      drawNoise(65, 210, 218, 16);
      ctx.strokeStyle = '#0984e3';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, 15, 15);
      ctx.fillStyle = '#00cec9';
      ctx.fillRect(px + 3, py + 3, 10, 10);
      ctx.fillStyle = '#e6ffff';
      ctx.fillRect(px + 4, py + 4, 4, 4);
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(px + 1, py + 1, 2, 2);
      ctx.fillRect(px + 13, py + 1, 2, 2);
      ctx.fillRect(px + 1, py + 13, 2, 2);
      ctx.fillRect(px + 13, py + 13, 2, 2);
      ctx.fillRect(px + 7, py + 6, 2, 4);
      break;
    }

    // Puertas (Doors): 124-145
    case 124: { // Oak Door Bottom
      drawNoise(165, 116, 68, 16);
      ctx.strokeStyle = '#5a3d1c';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 2, py + 2, 12, 12);
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(px + 12, py + 2, 2, 3); // Doorknob
      break;
    }
    case 125: { // Oak Door Top
      drawNoise(165, 116, 68, 16);
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(px + 3, py + 3, 4, 10); // Window 1
      ctx.fillRect(px + 9, py + 3, 4, 10); // Window 2
      ctx.fillStyle = '#74b9ff';
      ctx.fillRect(px + 4, py + 4, 2, 4);
      ctx.fillRect(px + 10, py + 4, 2, 4);
      break;
    }

    case 126: { // Birch Door Bottom
      drawNoise(216, 203, 176, 14);
      ctx.strokeStyle = '#8c7d5c';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 2, py + 2, 12, 12);
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(px + 12, py + 2, 2, 3);
      break;
    }
    case 127: { // Birch Door Top
      drawNoise(216, 203, 176, 14);
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(px + 3, py + 3, 3, 10);
      ctx.fillRect(px + 7, py + 3, 3, 10);
      ctx.fillRect(px + 11, py + 3, 2, 10);
      break;
    }

    case 128: { // Spruce Door Bottom
      drawNoise(104, 78, 50, 16);
      ctx.fillStyle = '#3a2717';
      ctx.fillRect(px + 2, py + 7, 12, 2);
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(px + 12, py + 2, 2, 3);
      break;
    }
    case 129: { // Spruce Door Top
      drawNoise(104, 78, 50, 16);
      ctx.fillStyle = '#3a2717';
      ctx.fillRect(px + 2, py + 7, 12, 2);
      ctx.fillStyle = '#1e272e';
      ctx.fillRect(px + 4, py + 3, 8, 4);
      break;
    }

    case 130: { // Jungle Door Bottom
      drawNoise(157, 105, 75, 16);
      ctx.strokeStyle = '#5a3d1c';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 2, py + 2, 12, 12);
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(px + 12, py + 2, 2, 3);
      break;
    }
    case 131: { // Jungle Door Top
      drawNoise(157, 105, 75, 16);
      ctx.fillStyle = '#1e272e';
      ctx.beginPath();
      ctx.arc(px + 8, py + 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#81ecec';
      ctx.beginPath();
      ctx.arc(px + 8, py + 8, 2.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 132: { // Acacia Door Bottom
      drawNoise(186, 99, 57, 16);
      ctx.strokeStyle = '#7c3817';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 2, py + 2, 12, 12);
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(px + 12, py + 2, 2, 3);
      break;
    }
    case 133: { // Acacia Door Top
      drawNoise(186, 99, 57, 16);
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(px + 3, py + 3, 10, 2);
      ctx.fillRect(px + 3, py + 7, 10, 2);
      ctx.fillRect(px + 3, py + 11, 10, 2);
      break;
    }

    case 134: { // Dark Oak Door Bottom
      drawNoise(73, 51, 28, 16);
      ctx.strokeStyle = '#2b1a0b';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 2, py + 2, 12, 12);
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(px + 12, py + 2, 2, 3);
      break;
    }
    case 135: { // Dark Oak Door Top
      drawNoise(73, 51, 28, 16);
      ctx.fillStyle = '#2b1a0b';
      ctx.fillRect(px + 3, py + 3, 4, 4);
      ctx.fillRect(px + 9, py + 3, 4, 4);
      ctx.fillRect(px + 3, py + 9, 4, 4);
      ctx.fillRect(px + 9, py + 9, 4, 4);
      break;
    }

    case 136: { // Mangrove Door Bottom
      drawNoise(116, 50, 50, 16);
      ctx.strokeStyle = '#4a1a1a';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 2, py + 2, 12, 12);
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(px + 12, py + 2, 2, 3);
      break;
    }
    case 137: { // Mangrove Door Top
      drawNoise(116, 50, 50, 16);
      ctx.fillStyle = '#1e272e';
      ctx.fillRect(px + 4, py + 3, 2, 10);
      ctx.fillRect(px + 7, py + 3, 2, 10);
      ctx.fillRect(px + 10, py + 3, 2, 10);
      break;
    }

    case 138: { // Cherry Door Bottom
      drawNoise(232, 169, 182, 14);
      ctx.strokeStyle = '#9c5b6b';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 2, py + 2, 12, 12);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 12, py + 2, 2, 3);
      break;
    }
    case 139: { // Cherry Door Top
      drawNoise(232, 169, 182, 14);
      ctx.fillStyle = '#fff0f3';
      ctx.fillRect(px + 3, py + 3, 10, 10);
      ctx.strokeStyle = '#9c5b6b';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 3, py + 3, 10, 10);
      ctx.beginPath();
      ctx.moveTo(px + 8, py + 3); ctx.lineTo(px + 8, py + 13);
      ctx.moveTo(px + 3, py + 8); ctx.lineTo(px + 13, py + 8);
      ctx.stroke();
      break;
    }

    case 140: { // Iron Door Bottom
      drawNoise(215, 215, 215, 12);
      ctx.strokeStyle = '#7f8c8d';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 2, py + 2, 12, 12);
      ctx.fillStyle = '#34495e';
      ctx.fillRect(px + 12, py + 2, 2, 4); // Handle
      break;
    }
    case 141: { // Iron Door Top
      drawNoise(215, 215, 215, 12);
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(px + 3, py + 3, 4, 4);
      ctx.fillRect(px + 9, py + 3, 4, 4);
      ctx.fillRect(px + 3, py + 9, 4, 4);
      ctx.fillRect(px + 9, py + 9, 4, 4);
      ctx.fillStyle = '#7f8c8d';
      ctx.fillRect(px + 4, py + 4, 2, 2);
      ctx.fillRect(px + 10, py + 4, 2, 2);
      break;
    }

    case 142: { // Copper Door Bottom
      drawNoise(200, 104, 62, 16);
      ctx.strokeStyle = '#9c441f';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 2, py + 2, 12, 12);
      ctx.fillStyle = '#16a085'; // Verdigris accents
      ctx.fillRect(px + 3, py + 3, 2, 2);
      ctx.fillRect(px + 11, py + 11, 2, 2);
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(px + 12, py + 2, 2, 4);
      break;
    }
    case 143: { // Copper Door Top
      drawNoise(200, 104, 62, 16);
      ctx.fillStyle = '#1e272e';
      ctx.fillRect(px + 4, py + 4, 8, 8);
      ctx.fillStyle = '#16a085';
      ctx.fillRect(px + 5, py + 5, 6, 6);
      break;
    }

    case 144: { // Diamond Door Bottom
      drawNoise(77, 237, 244, 18);
      ctx.strokeStyle = '#1b9ea6';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 2, py + 2, 12, 12);
      ctx.fillStyle = '#f1c40f'; // Golden latch
      ctx.fillRect(px + 12, py + 2, 2, 4);
      break;
    }
    case 145: { // Diamond Door Top
      drawNoise(77, 237, 244, 18);
      ctx.fillStyle = '#0a3d40';
      ctx.fillRect(px + 4, py + 3, 8, 10);
      ctx.fillStyle = '#e6ffff';
      ctx.fillRect(px + 6, py + 5, 4, 6);
      break;
    }

    case 146: { // Short Grass - High-fidelity authentic Minecraft multi-blade tuft (Grayscale for biome tinting)
      ctx.clearRect(px, py, 16, 16);
      // Dark under-shading root cluster
      ctx.fillStyle = '#525252';
      ctx.fillRect(px + 4, py + 14, 8, 2);
      ctx.fillRect(px + 3, py + 12, 10, 2);
      ctx.fillRect(px + 2, py + 13, 2, 2);

      // Midtone grass blades with distinct individual blade contours
      ctx.fillStyle = '#9e9e9e';
      const bladesShortMid = [
        [2, 11, 2, 4], [4, 8, 2, 6], [6, 6, 2, 8],
        [8, 7, 2, 7], [10, 9, 2, 5], [12, 11, 2, 4], [14, 13, 1, 2]
      ];
      for (const [bx, by, bw, bh] of bladesShortMid) {
        ctx.fillRect(px + bx, py + by, bw, bh);
      }

      // Bright sunlit blade highlights & tapered sharp tips
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(px + 3, py + 10, 1, 3);
      ctx.fillRect(px + 5, py + 7, 1, 5);
      ctx.fillRect(px + 7, py + 5, 1, 7);
      ctx.fillRect(px + 9, py + 6, 1, 5);
      ctx.fillRect(px + 11, py + 8, 1, 4);
      ctx.fillRect(px + 13, py + 10, 1, 2);
      break;
    }

    case 147: { // Medium Grass - Natural layered alpine grass with wild swaying shoots
      ctx.clearRect(px, py, 16, 16);
      // Deep basal root shading
      ctx.fillStyle = '#444444';
      ctx.fillRect(px + 3, py + 13, 10, 3);
      ctx.fillRect(px + 4, py + 11, 8, 2);
      ctx.fillRect(px + 1, py + 14, 3, 2);

      // Main blades body with crosshatch pixel texture
      ctx.fillStyle = '#909090';
      const bladesMedBody = [
        [2, 8, 2, 8], [4, 5, 2, 10], [6, 3, 2, 12],
        [8, 2, 2, 13], [10, 4, 2, 11], [12, 7, 2, 8], [14, 10, 1, 5]
      ];
      for (const [bx, by, bw, bh] of bladesMedBody) {
        ctx.fillRect(px + bx, py + by, bw, bh);
      }

      // Subtle shadow creases between blade stems
      ctx.fillStyle = '#6e6e6e';
      ctx.fillRect(px + 4, py + 9, 1, 4);
      ctx.fillRect(px + 8, py + 7, 1, 5);
      ctx.fillRect(px + 12, py + 10, 1, 3);

      // Sunlit tips & crisp highlights
      ctx.fillStyle = '#f8f8f8';
      ctx.fillRect(px + 2, py + 7, 1, 4);
      ctx.fillRect(px + 5, py + 3, 1, 7);
      ctx.fillRect(px + 7, py + 1, 1, 10);
      ctx.fillRect(px + 9, py + 2, 1, 8);
      ctx.fillRect(px + 11, py + 4, 1, 7);
      ctx.fillRect(px + 13, py + 7, 1, 4);
      break;
    }

    case 148: { // Tall Grass - Lush savanna/plains tall foliage with waving stems
      ctx.clearRect(px, py, 16, 16);
      // Root clump deep shading
      ctx.fillStyle = '#3c3c3c';
      ctx.fillRect(px + 2, py + 13, 12, 3);
      ctx.fillRect(px + 3, py + 10, 10, 3);

      // Dense layered tall blades
      ctx.fillStyle = '#858585';
      const bladesTallBody = [
        [1, 6, 2, 10], [3, 3, 2, 13], [5, 1, 2, 15], [7, 0, 2, 16],
        [9, 1, 2, 15], [11, 2, 2, 14], [13, 5, 2, 11]
      ];
      for (const [bx, by, bw, bh] of bladesTallBody) {
        ctx.fillRect(px + bx, py + by, bw, bh);
      }

      // Stem core shading
      ctx.fillStyle = '#5c5c5c';
      ctx.fillRect(px + 3, py + 6, 1, 6);
      ctx.fillRect(px + 7, py + 4, 1, 8);
      ctx.fillRect(px + 11, py + 5, 1, 7);

      // Upper vibrant sunlit blade tips & highlights
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 1, py + 5, 1, 5);
      ctx.fillRect(px + 4, py + 1, 1, 9);
      ctx.fillRect(px + 6, py + 0, 1, 11);
      ctx.fillRect(px + 8, py + 0, 1, 10);
      ctx.fillRect(px + 10, py + 1, 1, 9);
      ctx.fillRect(px + 12, py + 4, 1, 7);
      ctx.fillRect(px + 14, py + 7, 1, 4);
      break;
    }

    case 149: { // Fern - Feathery pinnate jungle frond with delicate leaflets
      ctx.clearRect(px, py, 16, 16);
      // Central curved rachis stem
      ctx.fillStyle = '#555555';
      ctx.fillRect(px + 7, py + 2, 2, 14);

      // Outer leaflet branches
      ctx.fillStyle = '#8e8e8e';
      const fernFronds = [
        [3, 13, 10, 2], [2, 11, 12, 2], [1, 9, 14, 2],
        [2, 7, 12, 2], [3, 5, 10, 2], [5, 3, 6, 2], [7, 1, 2, 2]
      ];
      for (const [fx, fy, fw, fh] of fernFronds) {
        ctx.fillRect(px + fx, py + fy, fw, fh);
      }

      // Highlights on frond tips
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(px + 1, py + 9, 2, 1);
      ctx.fillRect(px + 13, py + 9, 2, 1);
      ctx.fillRect(px + 2, py + 7, 2, 1);
      ctx.fillRect(px + 12, py + 7, 2, 1);
      ctx.fillRect(px + 7, py + 1, 2, 2);
      ctx.fillRect(px + 7, py + 4, 1, 8);
      break;
    }

    case 150: { // Dead Bush - Arid desert shrub with gnarled desert branches
      ctx.clearRect(px, py, 16, 16);
      ctx.fillStyle = '#543618';
      ctx.fillRect(px + 7, py + 10, 2, 6);
      ctx.fillRect(px + 6, py + 9, 4, 2);

      ctx.fillStyle = '#8d5c34';
      ctx.fillRect(px + 5, py + 6, 3, 3);
      ctx.fillRect(px + 9, py + 5, 3, 3);
      ctx.fillRect(px + 3, py + 3, 3, 3);
      ctx.fillRect(px + 11, py + 2, 3, 3);
      ctx.fillRect(px + 1, py + 1, 2, 2);
      ctx.fillRect(px + 13, py + 1, 2, 2);

      ctx.fillStyle = '#b57c4c';
      ctx.fillRect(px + 3, py + 2, 2, 1);
      ctx.fillRect(px + 11, py + 1, 2, 1);
      ctx.fillRect(px + 7, py + 6, 1, 2);
      break;
    }

    case 151: { // Frosted Snowy Grass - Natural grass tuft coated with frost & snow on top tips
      ctx.clearRect(px, py, 16, 16);
      // Cold muted grass body
      ctx.fillStyle = '#4d6957';
      ctx.fillRect(px + 3, py + 12, 10, 4);

      ctx.fillStyle = '#6a8e78';
      const bladesFrost = [
        [3, 8, 2, 6], [5, 6, 2, 8], [7, 4, 2, 10],
        [9, 5, 2, 9], [11, 7, 2, 7], [13, 10, 1, 4]
      ];
      for (const [bx, by, bw, bh] of bladesFrost) {
        ctx.fillRect(px + bx, py + by, bw, bh);
      }

      // Crisp pure white snow frost coating the tips and upper foliage
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 3, py + 6, 3, 3);
      ctx.fillRect(px + 5, py + 4, 3, 3);
      ctx.fillRect(px + 7, py + 2, 4, 4);
      ctx.fillRect(px + 9, py + 3, 3, 3);
      ctx.fillRect(px + 11, py + 5, 3, 3);
      ctx.fillRect(px + 6, py + 1, 4, 2);

      // Pale ice-blue glint & frosted crystals
      ctx.fillStyle = '#d4effc';
      ctx.fillRect(px + 4, py + 7, 1, 2);
      ctx.fillRect(px + 8, py + 4, 1, 3);
      ctx.fillRect(px + 10, py + 5, 1, 2);
      ctx.fillRect(px + 7, py + 2, 2, 1);
      break;
    }

    default:
      drawNoise(128, 128, 128, 20);
      break;
  }
}

// Build 256x256 atlas canvas containing all 16x16 tiles
export function getAtlasCanvas(): HTMLCanvasElement {
  if (atlasCanvas) return atlasCanvas;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  // Render all active tiles (0 to 115)
  for (let i = 0; i < 256; i++) {
    const tileX = (i % 16) * 16;
    const tileY = Math.floor(i / 16) * 16;
    drawTile(ctx, i, tileX, tileY);
  }

  atlasCanvas = canvas;
  return atlasCanvas;
}

// Get or create Three.js Texture for the Atlas
export function getAtlasTexture(): THREE.CanvasTexture {
  if (atlasTexture) return atlasTexture;

  const canvas = getAtlasCanvas();
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;

  atlasTexture = texture;
  return atlasTexture;
}

// Return UV coordinates [u0, v0, u1, v1] for a specific block and face
export function getBlockUVs(blockType: BlockType, face: 'top' | 'bottom' | 'side'): [number, number, number, number] {
  const map = TILE_MAP[blockType] || { top: 3, bottom: 3, side: 3 };
  const tileIdx = face === 'top' ? map.top : face === 'bottom' ? map.bottom : map.side;

  const tileX = tileIdx % 16;
  const tileY = Math.floor(tileIdx / 16);

  // Sub-texel clamp padding to ensure sampling never crosses into adjacent tiles
  const pad = 0.25 / 256;
  const u0 = (tileX / 16) + pad;
  const u1 = ((tileX + 1) / 16) - pad;
  // Three.js texture coordinate Y is inverted (0 is bottom, 1 is top)
  const v1 = (1 - (tileY / 16)) - pad;
  const v0 = (1 - ((tileY + 1) / 16)) + pad;

  return [u0, v0, u1, v1];
}

// Generate exact 3D cube BufferGeometry with proper atlas UVs for first-person held block
export function createHandBlockGeometry(blockType: BlockType, size: number = 0.28): THREE.BufferGeometry {
  const s = size / 2;
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];

  // Top (+Y)
  const [tu0, tv0, tu1, tv1] = getBlockUVs(blockType, 'top');
  positions.push(-s, s, s,  s, s, s,  s, s, -s,  -s, s, s,  s, s, -s,  -s, s, -s);
  normals.push(0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0);
  uvs.push(tu0, tv0,  tu1, tv0,  tu1, tv1,  tu0, tv0,  tu1, tv1,  tu0, tv1);

  // Bottom (-Y)
  const [bu0, bv0, bu1, bv1] = getBlockUVs(blockType, 'bottom');
  positions.push(-s, -s, -s,  s, -s, -s,  s, -s, s,  -s, -s, -s,  s, -s, s,  -s, -s, s);
  normals.push(0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0);
  uvs.push(bu0, bv1,  bu1, bv1,  bu1, bv0,  bu0, bv1,  bu1, bv0,  bu0, bv0);

  // North (+Z)
  const [su0, sv0, su1, sv1] = getBlockUVs(blockType, 'side');
  positions.push(-s, -s, s,  s, -s, s,  s, s, s,  -s, -s, s,  s, s, s,  -s, s, s);
  normals.push(0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1);
  uvs.push(su0, sv0,  su1, sv0,  su1, sv1,  su0, sv0,  su1, sv1,  su0, sv1);

  // South (-Z)
  positions.push(s, -s, -s,  -s, -s, -s,  -s, s, -s,  s, -s, -s,  -s, s, -s,  s, s, -s);
  normals.push(0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1);
  uvs.push(su0, sv0,  su1, sv0,  su1, sv1,  su0, sv0,  su1, sv1,  su0, sv1);

  // East (+X)
  positions.push(s, -s, s,  s, -s, -s,  s, s, -s,  s, -s, s,  s, s, -s,  s, s, s);
  normals.push(1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0);
  uvs.push(su0, sv0,  su1, sv0,  su1, sv1,  su0, sv0,  su1, sv1,  su0, sv1);

  // West (-X)
  positions.push(-s, -s, -s,  -s, -s, s,  -s, s, s,  -s, -s, -s,  -s, s, s,  -s, s, -s);
  normals.push(-1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0);
  uvs.push(su0, sv0,  su1, sv0,  su1, sv1,  su0, sv0,  su1, sv1,  su0, sv1);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  return geo;
}

function drawBucketIcon(ctx: CanvasRenderingContext2D, fluid: 'empty' | 'water' | 'lava') {
  ctx.fillStyle = '#b0b0b0';
  ctx.beginPath();
  ctx.moveTo(8, 8);
  ctx.lineTo(24, 8);
  ctx.lineTo(21, 26);
  ctx.lineTo(11, 26);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#555555';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.strokeStyle = '#888888';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(16, 8, 7, Math.PI, 0);
  ctx.stroke();

  if (fluid === 'water') {
    ctx.fillStyle = '#2980b9';
    ctx.fillRect(10, 10, 12, 14);
    ctx.fillStyle = '#3498db';
    ctx.fillRect(11, 10, 10, 5);
    ctx.fillStyle = '#74b9ff';
    ctx.fillRect(12, 11, 4, 2);
  } else if (fluid === 'lava') {
    ctx.fillStyle = '#d35400';
    ctx.fillRect(10, 10, 12, 14);
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(11, 10, 10, 5);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(12, 11, 4, 2);
  } else {
    ctx.fillStyle = '#444444';
    ctx.fillRect(10, 10, 12, 6);
  }
}

function drawLeatherIcon(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#8e5229';
  ctx.beginPath();
  ctx.moveTo(11, 6);
  ctx.lineTo(21, 6);
  ctx.lineTo(26, 12);
  ctx.lineTo(24, 20);
  ctx.lineTo(27, 26);
  ctx.lineTo(19, 24);
  ctx.lineTo(16, 26);
  ctx.lineTo(13, 24);
  ctx.lineTo(5, 26);
  ctx.lineTo(8, 20);
  ctx.lineTo(6, 12);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#5c3214';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#aa6633';
  ctx.fillRect(12, 10, 8, 8);
}

function getArmorColors(itemId: string): { primary: string; secondary: string; highlight: string } {
  if (itemId.startsWith('leather_')) return { primary: '#86502d', secondary: '#5a341a', highlight: '#9e6239' };
  if (itemId.startsWith('copper_')) return { primary: '#e57342', secondary: '#9c441f', highlight: '#ff9668' };
  if (itemId.startsWith('iron_')) return { primary: '#dcdcdc', secondary: '#8a8a8a', highlight: '#ffffff' };
  if (itemId.startsWith('gold_')) return { primary: '#f6d335', secondary: '#a88610', highlight: '#fffcaa' };
  if (itemId.startsWith('titanium_')) return { primary: '#95afba', secondary: '#566573', highlight: '#d5dbdb' };
  return { primary: '#3ce4ed', secondary: '#198f96', highlight: '#b1fbfd' };
}

function drawArmorIcon(ctx: CanvasRenderingContext2D, itemId: string) {
  const { primary, secondary, highlight } = getArmorColors(itemId);

  if (itemId.includes('_helmet')) {
    ctx.fillStyle = primary;
    ctx.fillRect(8, 6, 16, 14);
    ctx.clearRect(12, 12, 8, 8);
    ctx.fillStyle = primary;
    ctx.fillRect(15, 12, 2, 4);
    ctx.fillStyle = highlight;
    ctx.fillRect(9, 7, 14, 2);
    ctx.fillStyle = secondary;
    ctx.fillRect(8, 18, 4, 2);
    ctx.fillRect(20, 18, 4, 2);
  } else if (itemId.includes('_chestplate')) {
    ctx.fillStyle = primary;
    ctx.fillRect(6, 6, 20, 8);
    ctx.fillRect(9, 14, 14, 12);
    ctx.clearRect(13, 6, 6, 3);
    ctx.fillStyle = highlight;
    ctx.fillRect(6, 6, 6, 2);
    ctx.fillRect(20, 6, 6, 2);
    ctx.fillRect(11, 15, 10, 2);
    ctx.fillStyle = secondary;
    ctx.fillRect(9, 24, 14, 2);
  } else if (itemId.includes('_leggings')) {
    ctx.fillStyle = primary;
    ctx.fillRect(8, 6, 16, 6);
    ctx.fillRect(8, 12, 6, 14);
    ctx.fillRect(18, 12, 6, 14);
    ctx.fillStyle = highlight;
    ctx.fillRect(9, 7, 14, 2);
    ctx.fillRect(9, 13, 4, 4);
    ctx.fillRect(19, 13, 4, 4);
    ctx.fillStyle = secondary;
    ctx.fillRect(8, 24, 6, 2);
    ctx.fillRect(18, 24, 6, 2);
  } else if (itemId.includes('_boots')) {
    ctx.fillStyle = primary;
    ctx.fillRect(7, 12, 6, 14);
    ctx.fillRect(5, 20, 8, 6);
    ctx.fillRect(19, 12, 6, 14);
    ctx.fillRect(19, 20, 8, 6);
    ctx.fillStyle = highlight;
    ctx.fillRect(7, 13, 5, 2);
    ctx.fillRect(19, 13, 5, 2);
    ctx.fillStyle = secondary;
    ctx.fillRect(5, 24, 8, 2);
    ctx.fillRect(19, 24, 8, 2);
  }
}

function drawBackpackIcon(ctx: CanvasRenderingContext2D, itemId: string) {
  const isLarge = itemId === 'large_backpack';
  const isMedium = itemId === 'medium_backpack';

  ctx.fillStyle = isLarge ? '#2c3e50' : isMedium ? '#795548' : '#8d6e63';
  ctx.fillRect(7, 8, 18, 18);
  ctx.fillStyle = isLarge ? '#1a252f' : isMedium ? '#5d4037' : '#6d4c41';
  ctx.fillRect(6, 7, 20, 7);

  ctx.fillStyle = isLarge ? '#f1c40f' : isMedium ? '#e67e22' : '#d7ccc8';
  ctx.fillRect(10, 7, 2, 19);
  ctx.fillRect(20, 7, 2, 19);

  ctx.fillStyle = isLarge ? '#00cec9' : isMedium ? '#e17055' : '#b2bec3';
  ctx.fillRect(9, 16, 4, 3);
  ctx.fillRect(19, 16, 4, 3);

  ctx.fillStyle = isLarge ? '#34495e' : isMedium ? '#6d4c41' : '#795548';
  ctx.fillRect(11, 18, 10, 7);
}

// Generate data URL for UI hotbar & inventory item icons
export function getItemIcon(itemId: string): string {
  if (iconCache.has(itemId)) {
    return iconCache.get(itemId)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  if (itemId === 'bucket') {
    drawBucketIcon(ctx, 'empty');
  } else if (itemId === 'water_bucket') {
    drawBucketIcon(ctx, 'water');
  } else if (itemId === 'lava_bucket') {
    drawBucketIcon(ctx, 'lava');
  } else if (itemId === 'leather') {
    drawLeatherIcon(ctx);
  } else if (
    itemId.includes('_helmet') ||
    itemId.includes('_chestplate') ||
    itemId.includes('_leggings') ||
    itemId.includes('_boots')
  ) {
    drawArmorIcon(ctx, itemId);
  } else if (itemId.includes('_backpack')) {
    drawBackpackIcon(ctx, itemId);
  } else if (itemId.endsWith('_pickaxe')) {
    drawToolIcon(ctx, 'pickaxe', getToolColor(itemId));
  } else if (itemId.endsWith('_axe')) {
    drawToolIcon(ctx, 'axe', getToolColor(itemId));
  } else if (itemId.endsWith('_shovel')) {
    drawToolIcon(ctx, 'shovel', getToolColor(itemId));
  } else if (itemId.endsWith('_sword')) {
    drawToolIcon(ctx, 'sword', getToolColor(itemId));
  } else if (itemId === 'stick') {
    ctx.strokeStyle = '#855c30';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(6, 26);
    ctx.lineTo(26, 6);
    ctx.stroke();
  } else if (itemId === 'coal') {
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(16, 16, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#444444';
    ctx.fillRect(12, 10, 4, 4);
  } else if (itemId === 'iron_ingot') {
    ctx.fillStyle = '#dcdcdc';
    ctx.fillRect(8, 12, 16, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(8, 12, 16, 2);
    ctx.fillStyle = '#9e9e9e';
    ctx.fillRect(8, 18, 16, 2);
  } else if (itemId === 'gold_ingot') {
    ctx.fillStyle = '#f7d23d';
    ctx.fillRect(8, 12, 16, 8);
    ctx.fillStyle = '#fffaaa';
    ctx.fillRect(8, 12, 16, 2);
    ctx.fillStyle = '#bfa024';
    ctx.fillRect(8, 18, 16, 2);
  } else if (itemId === 'diamond') {
    ctx.fillStyle = '#4dedf4';
    ctx.beginPath();
    ctx.moveTo(16, 4);
    ctx.lineTo(26, 14);
    ctx.lineTo(16, 28);
    ctx.lineTo(6, 14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c5fcfe';
    ctx.fillRect(14, 10, 4, 4);
  } else if (itemId === 'apple') {
    ctx.fillStyle = '#d92525';
    ctx.beginPath();
    ctx.arc(16, 18, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5c3a1e';
    ctx.fillRect(15, 6, 2, 4);
    ctx.fillStyle = '#479426';
    ctx.fillRect(17, 7, 4, 2);
  } else if (itemId === 'porkchop') {
    ctx.fillStyle = '#d47373';
    ctx.beginPath();
    ctx.ellipse(16, 16, 11, 7, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0c0c0';
    ctx.fillRect(13, 13, 5, 5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(8, 8, 3, 3);
  } else if (itemId === 'copper_ingot') {
    ctx.fillStyle = '#d46a3b';
    ctx.fillRect(8, 12, 16, 8);
    ctx.fillStyle = '#ff9e6d';
    ctx.fillRect(8, 12, 16, 2);
    ctx.fillStyle = '#8f3c17';
    ctx.fillRect(8, 18, 16, 2);
  } else if (itemId === 'raw_copper') {
    ctx.fillStyle = '#c85a2b';
    ctx.beginPath();
    ctx.arc(14, 16, 7, 0, Math.PI * 2);
    ctx.arc(19, 14, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#44baa0'; // patina flecks
    ctx.fillRect(11, 13, 3, 3);
    ctx.fillRect(18, 14, 3, 3);
  } else if (itemId === 'copper_wire') {
    ctx.fillStyle = '#c85a2b';
    ctx.fillRect(4, 14, 24, 4);
    ctx.fillRect(14, 4, 4, 24);
    ctx.fillStyle = '#ff9e6d';
    ctx.fillRect(6, 15, 20, 2);
    ctx.fillRect(15, 6, 2, 20);
  } else if (itemId === 'copper_switch') {
    ctx.fillStyle = '#555555';
    ctx.fillRect(8, 16, 16, 10);
    ctx.fillStyle = '#d46a3b';
    ctx.fillRect(14, 6, 4, 12);
    ctx.fillStyle = '#ff7a45';
    ctx.fillRect(13, 5, 6, 4);
  } else if (itemId === 'copper_lamp') {
    ctx.fillStyle = '#5c321e';
    ctx.fillRect(6, 6, 20, 20);
    ctx.fillStyle = '#ffd15c';
    ctx.fillRect(10, 10, 12, 12);
    ctx.strokeStyle = '#c85e2b';
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, 20, 20);
  } else if (itemId === 'titanium_ingot') {
    ctx.fillStyle = '#b0c4de';
    ctx.fillRect(8, 12, 16, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(8, 12, 16, 2);
    ctx.fillStyle = '#657786';
    ctx.fillRect(8, 18, 16, 2);
  } else if (itemId === 'crude_oil') {
    // Dark oil drum / canister with sheen
    ctx.fillStyle = '#1e272e';
    ctx.fillRect(10, 8, 12, 16);
    ctx.fillStyle = '#000000';
    ctx.fillRect(12, 6, 8, 2);
    ctx.fillStyle = '#485460';
    ctx.fillRect(11, 10, 10, 2);
    ctx.fillRect(11, 18, 10, 2);
    ctx.fillStyle = '#0be881';
    ctx.fillRect(14, 13, 4, 3);
  } else if (itemId === 'naphtha') {
    // Chemical beaker / flask with light golden amber fuel
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.moveTo(13, 8);
    ctx.lineTo(19, 8);
    ctx.lineTo(19, 14);
    ctx.lineTo(24, 24);
    ctx.lineTo(8, 24);
    ctx.lineTo(13, 14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(10, 18, 12, 5);
  } else if (itemId === 'oil_bucket') {
    // Bucket with Crude Oil
    ctx.fillStyle = '#9e9e9e';
    ctx.fillRect(8, 8, 16, 16);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(8, 8, 16, 2);
    // Dark Crude Oil pool with sheen
    ctx.fillStyle = '#0f1012';
    ctx.fillRect(10, 10, 12, 12);
    ctx.fillStyle = '#4e8cff';
    ctx.fillRect(12, 12, 4, 2);
  } else if (itemId === 'storage_wood' || itemId === 'chest') {
    // Wooden Storage Crate icon
    ctx.fillStyle = '#a06e3b';
    ctx.fillRect(5, 5, 22, 22);
    ctx.strokeStyle = '#5a3d1c';
    ctx.lineWidth = 2;
    ctx.strokeRect(5, 5, 22, 22);
    ctx.fillStyle = '#2f3542';
    ctx.fillRect(14, 13, 4, 5);
    ctx.fillStyle = '#dfe4ea';
    ctx.fillRect(15, 14, 2, 2);
  } else if (itemId === 'storage_iron') {
    // Iron Storage Crate icon
    ctx.fillStyle = '#c8d1dc';
    ctx.fillRect(5, 5, 22, 22);
    ctx.strokeStyle = '#57606f';
    ctx.lineWidth = 2;
    ctx.strokeRect(5, 5, 22, 22);
    ctx.fillStyle = '#2f3542';
    ctx.fillRect(13, 12, 6, 6);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(15, 14, 2, 2);
  } else if (itemId === 'storage_titanium') {
    // Titanium Storage Crate icon
    ctx.fillStyle = '#536878';
    ctx.fillRect(5, 5, 22, 22);
    ctx.strokeStyle = '#2d3e50';
    ctx.lineWidth = 2;
    ctx.strokeRect(5, 5, 22, 22);
    ctx.fillStyle = '#00cec9';
    ctx.fillRect(13, 5, 6, 22);
    ctx.fillRect(5, 13, 22, 6);
    ctx.fillStyle = '#81ecec';
    ctx.fillRect(14, 14, 4, 4);
  } else if (itemId === 'storage_diamond') {
    // Diamond Storage Crate icon
    ctx.fillStyle = '#00cec9';
    ctx.fillRect(5, 5, 22, 22);
    ctx.strokeStyle = '#0984e3';
    ctx.lineWidth = 2;
    ctx.strokeRect(5, 5, 22, 22);
    ctx.fillStyle = '#e6ffff';
    ctx.fillRect(10, 10, 12, 12);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(14, 13, 4, 5);
  } else if (itemId.endsWith('_door')) {
    // Miniature door icon
    let doorColor = '#b27a3c';
    if (itemId === 'birch_door') doorColor = '#d8cbb0';
    else if (itemId === 'spruce_door') doorColor = '#684e32';
    else if (itemId === 'jungle_door') doorColor = '#9d694b';
    else if (itemId === 'acacia_door') doorColor = '#ba6339';
    else if (itemId === 'dark_oak_door') doorColor = '#49331c';
    else if (itemId === 'mangrove_door') doorColor = '#743232';
    else if (itemId === 'cherry_door') doorColor = '#e8a9b6';
    else if (itemId === 'iron_door') doorColor = '#dcdcdc';
    else if (itemId === 'copper_door') doorColor = '#c8683e';
    else if (itemId === 'diamond_door') doorColor = '#4dedf4';

    ctx.fillStyle = doorColor;
    ctx.fillRect(9, 4, 14, 24);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(11, 7, 10, 8);
    ctx.fillRect(11, 17, 10, 8);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(20, 15, 2, 3); // Doorknob
  } else if (itemId === 'furnace') {
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(6, 6, 20, 20);
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(10, 13, 12, 10);
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(12, 17, 8, 4);
  } else if (itemId === 'lantern') {
    ctx.fillStyle = '#2f3542';
    ctx.fillRect(10, 6, 12, 20);
    ctx.fillStyle = '#ffa502';
    ctx.fillRect(12, 10, 8, 12);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(14, 12, 4, 8);
  } else if (itemId === 'raw_fish') {
    // Cod Fish item icon (earthy tan/brownish)
    ctx.fillStyle = '#a2836e';
    ctx.beginPath();
    ctx.ellipse(15, 16, 9, 5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c8a88d';
    ctx.beginPath();
    ctx.moveTo(22, 14);
    ctx.lineTo(28, 9);
    ctx.lineTo(28, 21);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(9, 13, 2, 2);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(10, 14, 1, 1);
  } else if (itemId === 'raw_salmon') {
    // Salmon Fish item icon (vibrant pinkish red with silver belly)
    ctx.fillStyle = '#e05656';
    ctx.beginPath();
    ctx.ellipse(15, 16, 10, 5, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#487eb0'; // blue-gray head tip
    ctx.fillRect(6, 14, 4, 4);
    ctx.fillStyle = '#ff7979';
    ctx.beginPath();
    ctx.moveTo(22, 14);
    ctx.lineTo(29, 9);
    ctx.lineTo(29, 21);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(8, 13, 2, 2);
    ctx.fillStyle = '#111111';
    ctx.fillRect(9, 14, 1, 1);
  } else if (itemId === 'clownfish') {
    // Tropical Clownfish (orange with bold white bands)
    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.ellipse(15, 16, 9, 6, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(11, 11, 3, 10);
    ctx.fillRect(17, 11, 3, 10);
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.moveTo(22, 14);
    ctx.lineTo(28, 9);
    ctx.lineTo(28, 22);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(8, 14, 2, 2);
    ctx.fillStyle = '#000000';
    ctx.fillRect(9, 15, 1, 1);
  } else if (itemId === 'pufferfish') {
    // Pufferfish (round yellow spiky)
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(16, 16, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d35400';
    // Spines
    ctx.fillRect(15, 6, 2, 3);
    ctx.fillRect(15, 23, 2, 3);
    ctx.fillRect(6, 15, 3, 2);
    ctx.fillRect(23, 15, 3, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(11, 13, 3, 3);
    ctx.fillStyle = '#000000';
    ctx.fillRect(12, 14, 2, 2);
  } else if (itemId === 'goldfish') {
    // Goldfish (bright golden glowing)
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.ellipse(15, 16, 9, 5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.moveTo(22, 14);
    ctx.lineTo(28, 8);
    ctx.lineTo(28, 23);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(9, 13, 2, 2);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(10, 14, 1, 1);
  } else if (itemId.endsWith('_hoe')) {
    drawToolIcon(ctx, 'hoe', getToolColor(itemId));
  } else {
    // Block icon: copy from atlas canvas!
    const blockMap: Record<string, BlockType> = {
      grass: BlockType.GRASS,
      dirt: BlockType.DIRT,
      stone: BlockType.STONE,
      cobblestone: BlockType.COBBLESTONE,
      wood: BlockType.WOOD,
      leaves: BlockType.LEAVES,
      planks: BlockType.PLANKS,
      sand: BlockType.SAND,
      glass: BlockType.GLASS,
      torch: BlockType.TORCH,
      crafting_table: BlockType.CRAFTING_TABLE,
      brick: BlockType.BRICK,
      bookshelf: BlockType.BOOKSHELF,
      tnt: BlockType.TNT,
      wool_white: BlockType.WOOL_WHITE,
      wool_red: BlockType.WOOL_RED,
      wool_blue: BlockType.WOOL_BLUE,
      poppy: BlockType.POPPY,
      dandelion: BlockType.DANDELION,
      iron_ore: BlockType.IRON_ORE,
      gold_ore: BlockType.GOLD_ORE,
      deepslate: BlockType.DEEPSLATE,
      copper_ore: BlockType.COPPER_ORE,
      copper_block: BlockType.COPPER_BLOCK,
      terracotta: BlockType.TERRACOTTA,
      red_sand: BlockType.RED_SAND,
      cactus: BlockType.CACTUS,
      sandstone: BlockType.SANDSTONE,
      chiseled_sandstone: BlockType.CHISELED_SANDSTONE,
      jungle_wood: BlockType.JUNGLE_WOOD,
      jungle_leaves: BlockType.JUNGLE_LEAVES,
      kelp: BlockType.KELP,
      chest: BlockType.CHEST,
      snow_block: BlockType.SNOW_BLOCK,
      ice: BlockType.ICE,
      packed_ice: BlockType.PACKED_ICE,
      blue_ice: BlockType.BLUE_ICE,
      spruce_wood: BlockType.SPRUCE_WOOD,
      spruce_leaves: BlockType.SPRUCE_LEAVES,
      spruce_planks: BlockType.SPRUCE_PLANKS,
      birch_wood: BlockType.BIRCH_WOOD,
      birch_leaves: BlockType.BIRCH_LEAVES,
      birch_planks: BlockType.BIRCH_PLANKS,
      dark_oak_wood: BlockType.DARK_OAK_WOOD,
      dark_oak_leaves: BlockType.DARK_OAK_LEAVES,
      dark_oak_planks: BlockType.DARK_OAK_PLANKS,
      acacia_wood: BlockType.ACACIA_WOOD,
      acacia_leaves: BlockType.ACACIA_LEAVES,
      acacia_planks: BlockType.ACACIA_PLANKS,
      mangrove_wood: BlockType.MANGROVE_WOOD,
      mangrove_leaves: BlockType.MANGROVE_LEAVES,
      mangrove_roots: BlockType.MANGROVE_ROOTS,
      cherry_wood: BlockType.CHERRY_WOOD,
      cherry_leaves: BlockType.CHERRY_LEAVES,
      cherry_planks: BlockType.CHERRY_PLANKS,
      sunflower: BlockType.SUNFLOWER,
      cornflower: BlockType.CORNFLOWER,
      tulip: BlockType.TULIP,
      lily_pad: BlockType.LILY_PAD,
      sugar_cane: BlockType.SUGAR_CANE,
      red_mushroom: BlockType.RED_MUSHROOM,
      brown_mushroom: BlockType.BROWN_MUSHROOM,
      mushroom_block_red: BlockType.MUSHROOM_BLOCK_RED,
      mushroom_block_brown: BlockType.MUSHROOM_BLOCK_BROWN,
      mushroom_stem: BlockType.MUSHROOM_STEM,
      mycelium: BlockType.MYCELIUM,
      coral_block: BlockType.CORAL_BLOCK,
      sea_pickle: BlockType.SEA_PICKLE,
      mud: BlockType.MUD,
      packed_mud: BlockType.PACKED_MUD,
      podzol: BlockType.PODZOL,
      coarse_dirt: BlockType.COARSE_DIRT,
      gravel: BlockType.GRAVEL,
      red_sandstone: BlockType.RED_SANDSTONE,
      terracotta_orange: BlockType.TERRACOTTA_ORANGE,
      terracotta_yellow: BlockType.TERRACOTTA_YELLOW,
      terracotta_white: BlockType.TERRACOTTA_WHITE,
      obsidian: BlockType.OBSIDIAN,
      titanium_ore: BlockType.TITANIUM_ORE,
      titanium_block: BlockType.TITANIUM_BLOCK,
      petroleum_ore: BlockType.CRUDE_OIL,
      crude_oil_block: BlockType.CRUDE_OIL,
      storage_wood: BlockType.STORAGE_WOOD,
      storage_iron: BlockType.STORAGE_IRON,
      storage_titanium: BlockType.STORAGE_TITANIUM,
      storage_diamond: BlockType.STORAGE_DIAMOND,
      furnace: BlockType.FURNACE,
      lantern: BlockType.LANTERN,
    };
    const blockType = blockMap[itemId] || BlockType.DIRT;
    const atlas = getAtlasCanvas();
    const map = TILE_MAP[blockType] || { side: 2 };
    const tileIdx = map.side;
    const sx = (tileIdx % 16) * 16;
    const sy = Math.floor(tileIdx / 16) * 16;

    ctx.drawImage(atlas, sx, sy, 16, 16, 4, 4, 24, 24);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(4, 4, 24, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(4, 26, 24, 2);
  }

  const dataUrl = canvas.toDataURL();
  iconCache.set(itemId, dataUrl);
  return dataUrl;
}

function getToolColor(itemId: string): { primary: string; secondary: string; highlight: string } {
  if (itemId.startsWith('diamond_')) return { primary: '#4dedf4', secondary: '#1eaeb5', highlight: '#c8fcff' };
  if (itemId.startsWith('titanium_')) return { primary: '#b0c4de', secondary: '#657786', highlight: '#e8f0f8' };
  if (itemId.startsWith('iron_')) return { primary: '#e0e0e0', secondary: '#9e9e9e', highlight: '#ffffff' };
  if (itemId.startsWith('gold_')) return { primary: '#f6d335', secondary: '#c69500', highlight: '#fff9b0' };
  if (itemId.startsWith('copper_')) return { primary: '#d46a3b', secondary: '#8f3c17', highlight: '#ff9e6d' };
  if (itemId.startsWith('stone_')) return { primary: '#8a8a8a', secondary: '#595959', highlight: '#b0b0b0' };
  return { primary: '#9e7343', secondary: '#6b4c27', highlight: '#ba8c58' };
}

function drawToolIcon(ctx: CanvasRenderingContext2D, type: string, colors: { primary: string; secondary: string; highlight: string }) {
  // Wood handle stick
  ctx.strokeStyle = '#855c30';
  ctx.lineWidth = 3;
  ctx.lineCap = 'square';
  ctx.beginPath();
  ctx.moveTo(7, 25);
  ctx.lineTo(21, 11);
  ctx.stroke();

  // Dark grip accents
  ctx.strokeStyle = '#5a3d1c';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(8, 24);
  ctx.lineTo(12, 20);
  ctx.stroke();

  ctx.fillStyle = colors.primary;
  ctx.strokeStyle = colors.secondary;
  ctx.lineWidth = 1;

  if (type === 'pickaxe') {
    // Curved pickaxe double-sided head
    ctx.beginPath();
    ctx.moveTo(13, 11);
    ctx.lineTo(16, 5);
    ctx.lineTo(25, 6);
    ctx.lineTo(27, 9);
    ctx.lineTo(21, 15);
    ctx.lineTo(17, 13);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Inner bevel highlight
    ctx.fillStyle = colors.highlight;
    ctx.fillRect(18, 7, 5, 2);
  } else if (type === 'axe') {
    // Broad heavy axe blade
    ctx.beginPath();
    ctx.moveTo(15, 8);
    ctx.lineTo(25, 4);
    ctx.lineTo(27, 13);
    ctx.lineTo(22, 17);
    ctx.lineTo(17, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = colors.highlight;
    ctx.fillRect(23, 6, 2, 7);
  } else if (type === 'shovel') {
    // Scoop spade
    ctx.beginPath();
    ctx.moveTo(18, 12);
    ctx.lineTo(25, 5);
    ctx.lineTo(28, 8);
    ctx.lineTo(21, 15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = colors.highlight;
    ctx.fillRect(22, 7, 3, 3);
  } else if (type === 'sword') {
    // Sword blade
    ctx.beginPath();
    ctx.moveTo(13, 17);
    ctx.lineTo(24, 6);
    ctx.lineTo(27, 5);
    ctx.lineTo(26, 8);
    ctx.lineTo(15, 19);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Shiny blade spine
    ctx.fillStyle = colors.highlight;
    ctx.fillRect(18, 11, 4, 1);
    ctx.fillRect(22, 7, 3, 1);
    // Crossguard
    ctx.fillStyle = colors.secondary;
    ctx.fillRect(10, 17, 7, 3);
    ctx.fillStyle = colors.highlight;
    ctx.fillRect(11, 18, 5, 1);
  } else if (type === 'hoe') {
    // Hoe tilling blade
    ctx.beginPath();
    ctx.moveTo(16, 9);
    ctx.lineTo(26, 5);
    ctx.lineTo(27, 9);
    ctx.lineTo(22, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = colors.highlight;
    ctx.fillRect(21, 6, 4, 2);
  }
}

// 10 Authentically rendered Minecraft Destroy Stage crack textures
const breakCrackCache = new Map<number, THREE.CanvasTexture>();

export function getBreakCrackTexture(stage: number): THREE.CanvasTexture {
  const safeStage = Math.max(0, Math.min(9, Math.floor(stage)));
  if (breakCrackCache.has(safeStage)) {
    return breakCrackCache.get(safeStage)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, 16, 16);

  // Minecraft crack stages pixel patterns (0 faint central crack, to 9 fully shattered)
  const crackPixels: Record<number, [number, number][]> = {
    0: [[7, 7], [8, 7], [8, 8], [9, 8]],
    1: [[7, 6], [7, 7], [8, 7], [8, 8], [9, 8], [9, 9], [6, 8], [5, 9]],
    2: [[7, 5], [7, 6], [7, 7], [8, 7], [8, 8], [9, 8], [9, 9], [10, 10], [6, 8], [5, 9], [4, 9], [8, 5], [9, 4]],
    3: [[7, 4], [7, 5], [7, 6], [7, 7], [8, 7], [8, 8], [9, 8], [9, 9], [10, 10], [11, 11], [6, 8], [5, 9], [4, 9], [3, 10], [8, 5], [9, 4], [10, 3], [5, 6], [4, 6]],
    4: [
      [7, 3], [7, 4], [7, 5], [7, 6], [7, 7], [8, 7], [8, 8], [9, 8], [9, 9], [10, 10], [11, 11], [12, 12],
      [6, 8], [5, 9], [4, 9], [3, 10], [2, 10], [8, 5], [9, 4], [10, 3], [11, 2], [5, 6], [4, 6], [3, 5],
      [10, 7], [11, 7], [12, 8], [6, 11], [6, 12]
    ],
    5: [
      [7, 2], [7, 3], [7, 4], [7, 5], [7, 6], [7, 7], [8, 7], [8, 8], [9, 8], [9, 9], [10, 10], [11, 11], [12, 12], [13, 13],
      [6, 8], [5, 9], [4, 9], [3, 10], [2, 10], [1, 11], [8, 5], [9, 4], [10, 3], [11, 2], [12, 1],
      [5, 6], [4, 6], [3, 5], [2, 4], [10, 7], [11, 7], [12, 8], [13, 8], [6, 11], [6, 12], [7, 13], [8, 14],
      [9, 11], [10, 12], [4, 12], [3, 13]
    ],
    6: [
      [7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6], [7, 7], [8, 7], [8, 8], [9, 8], [9, 9], [10, 10], [11, 11], [12, 12], [13, 13], [14, 14],
      [6, 8], [5, 9], [4, 9], [3, 10], [2, 10], [1, 11], [0, 12], [8, 5], [9, 4], [10, 3], [11, 2], [12, 1], [13, 0],
      [5, 6], [4, 6], [3, 5], [2, 4], [1, 3], [10, 7], [11, 7], [12, 8], [13, 8], [14, 9],
      [6, 11], [6, 12], [7, 13], [8, 14], [8, 15], [9, 11], [10, 12], [11, 13], [4, 12], [3, 13], [2, 14],
      [3, 2], [4, 2], [5, 3], [12, 5], [13, 6], [14, 6]
    ],
    7: [
      [7, 0], [7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6], [7, 7], [8, 7], [8, 8], [9, 8], [9, 9], [10, 10], [11, 11], [12, 12], [13, 13], [14, 14], [15, 15],
      [6, 8], [5, 9], [4, 9], [3, 10], [2, 10], [1, 11], [0, 12], [8, 5], [9, 4], [10, 3], [11, 2], [12, 1], [13, 0],
      [5, 6], [4, 6], [3, 5], [2, 4], [1, 3], [0, 2], [10, 7], [11, 7], [12, 8], [13, 8], [14, 9], [15, 10],
      [6, 11], [6, 12], [7, 13], [8, 14], [8, 15], [9, 11], [10, 12], [11, 13], [12, 14], [4, 12], [3, 13], [2, 14], [1, 15],
      [3, 1], [3, 2], [4, 2], [5, 3], [6, 3], [12, 5], [13, 6], [14, 6], [15, 7], [1, 8], [2, 8], [9, 1], [10, 1]
    ],
    8: [
      // High density shatter
      [7, 0], [7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6], [7, 7], [8, 7], [8, 8], [9, 8], [9, 9], [10, 10], [11, 11], [12, 12], [13, 13], [14, 14], [15, 15],
      [6, 7], [6, 8], [5, 9], [4, 9], [3, 10], [2, 10], [1, 11], [0, 12], [8, 5], [9, 4], [10, 3], [11, 2], [12, 1], [13, 0],
      [5, 6], [4, 6], [3, 5], [2, 4], [1, 3], [0, 2], [10, 7], [11, 7], [12, 8], [13, 8], [14, 9], [15, 10],
      [6, 11], [6, 12], [7, 13], [8, 14], [8, 15], [9, 11], [10, 12], [11, 13], [12, 14], [13, 15], [4, 12], [3, 13], [2, 14], [1, 15],
      [3, 1], [3, 2], [4, 2], [5, 3], [6, 3], [12, 5], [13, 6], [14, 6], [15, 7], [1, 8], [2, 8], [9, 1], [10, 1],
      [2, 7], [3, 7], [11, 9], [12, 9], [8, 10], [8, 11], [5, 14], [6, 15], [14, 3], [15, 4], [0, 5], [1, 6]
    ],
    9: [
      // Max shattered fragmentation
      [7, 0], [7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6], [7, 7], [8, 7], [8, 8], [9, 8], [9, 9], [10, 10], [11, 11], [12, 12], [13, 13], [14, 14], [15, 15],
      [6, 7], [6, 8], [5, 9], [4, 9], [3, 10], [2, 10], [1, 11], [0, 12], [8, 5], [9, 4], [10, 3], [11, 2], [12, 1], [13, 0],
      [5, 5], [5, 6], [4, 6], [3, 5], [2, 4], [1, 3], [0, 2], [10, 7], [11, 7], [12, 8], [13, 8], [14, 9], [15, 10],
      [6, 10], [6, 11], [6, 12], [7, 13], [8, 14], [8, 15], [9, 11], [10, 12], [11, 13], [12, 14], [13, 15], [4, 12], [3, 13], [2, 14], [1, 15],
      [3, 1], [3, 2], [4, 2], [5, 3], [6, 3], [12, 5], [13, 6], [14, 6], [15, 7], [1, 8], [2, 8], [9, 1], [10, 1],
      [2, 7], [3, 7], [11, 9], [12, 9], [8, 10], [8, 11], [5, 14], [6, 15], [14, 3], [15, 4], [0, 5], [1, 6],
      [8, 2], [9, 3], [13, 11], [14, 12], [2, 11], [3, 12], [5, 1], [6, 2], [11, 15], [12, 15], [1, 13], [0, 14]
    ],
  };

  const points = crackPixels[safeStage] || crackPixels[0];
  ctx.fillStyle = '#000000';
  for (const [x, y] of points) {
    ctx.fillRect(x, y, 1, 1);
  }
  // Soft crack edges
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  for (const [x, y] of points) {
    if (x + 1 < 16) ctx.fillRect(x + 1, y, 1, 1);
    if (y + 1 < 16) ctx.fillRect(x, y + 1, 1, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  breakCrackCache.set(safeStage, texture);
  return texture;
}

// Build authentic Minecraft 3D tool models for first-person hand rendering
export function createHandToolGeometry(toolType: string, toolMaterial: string): THREE.Group {
  return createHandToolModel(toolType, toolMaterial);
}

export function createHandToolModel(toolType: string, toolMaterial: string): THREE.Group {
  const group = new THREE.Group();

  // Colors for all 7 materials
  let primaryColor = 0x9e7343;
  let secondaryColor = 0x6b4c27;
  let highlightColor = 0xba8c58;

  if (toolMaterial === 'diamond') {
    primaryColor = 0x4dedf4;
    secondaryColor = 0x1eaeb5;
    highlightColor = 0xc8fcff;
  } else if (toolMaterial === 'titanium') {
    primaryColor = 0xb0c4de;
    secondaryColor = 0x657786;
    highlightColor = 0xe8f0f8;
  } else if (toolMaterial === 'iron') {
    primaryColor = 0xe0e0e0;
    secondaryColor = 0x9e9e9e;
    highlightColor = 0xffffff;
  } else if (toolMaterial === 'gold') {
    primaryColor = 0xf6d335;
    secondaryColor = 0xc69500;
    highlightColor = 0xfff9b0;
  } else if (toolMaterial === 'copper') {
    primaryColor = 0xd46a3b;
    secondaryColor = 0x8f3c17;
    highlightColor = 0xff9e6d;
  } else if (toolMaterial === 'stone') {
    primaryColor = 0x8a8a8a;
    secondaryColor = 0x595959;
    highlightColor = 0xb0b0b0;
  }

  const matPrimary = new THREE.MeshLambertMaterial({ color: primaryColor });
  const matSecondary = new THREE.MeshLambertMaterial({ color: secondaryColor });
  const matHighlight = new THREE.MeshLambertMaterial({ color: highlightColor });
  const matHandle = new THREE.MeshLambertMaterial({ color: 0x855c30 });
  const matGrip = new THREE.MeshLambertMaterial({ color: 0x5a3d1c });

  if (toolType === 'sword') {
    // 1. Sword Handle / Grip
    const handleGeo = new THREE.BoxGeometry(0.04, 0.28, 0.04);
    const handleMesh = new THREE.Mesh(handleGeo, matHandle);
    handleMesh.position.set(0, -0.06, 0);
    group.add(handleMesh);

    // Pommel at base
    const pommelGeo = new THREE.BoxGeometry(0.065, 0.045, 0.065);
    const pommelMesh = new THREE.Mesh(pommelGeo, matSecondary);
    pommelMesh.position.set(0, -0.21, 0);
    group.add(pommelMesh);

    // Crossguard
    const guardGeo = new THREE.BoxGeometry(0.22, 0.045, 0.06);
    const guardMesh = new THREE.Mesh(guardGeo, matSecondary);
    guardMesh.position.set(0, 0.09, 0);
    group.add(guardMesh);

    // Long double-edged blade (edge facing forward along Z)
    const bladeGeo = new THREE.BoxGeometry(0.035, 0.58, 0.09);
    const bladeMesh = new THREE.Mesh(bladeGeo, matPrimary);
    bladeMesh.position.set(0, 0.40, 0);
    group.add(bladeMesh);

    // Blade spine highlight
    const spineGeo = new THREE.BoxGeometry(0.042, 0.54, 0.03);
    const spineMesh = new THREE.Mesh(spineGeo, matHighlight);
    spineMesh.position.set(0, 0.38, 0);
    group.add(spineMesh);

    // Pointed Tip
    const tipGeo = new THREE.BoxGeometry(0.035, 0.08, 0.05);
    const tipMesh = new THREE.Mesh(tipGeo, matPrimary);
    tipMesh.position.set(0, 0.71, 0);
    group.add(tipMesh);

  } else if (toolType === 'pickaxe') {
    // Handle
    const handleGeo = new THREE.BoxGeometry(0.04, 0.58, 0.04);
    const handleMesh = new THREE.Mesh(handleGeo, matHandle);
    handleMesh.position.set(0, 0.12, 0);
    group.add(handleMesh);

    // Central connector block
    const connGeo = new THREE.BoxGeometry(0.065, 0.08, 0.065);
    const connMesh = new THREE.Mesh(connGeo, matSecondary);
    connMesh.position.set(0, 0.40, 0);
    group.add(connMesh);

    // Curved T-pick head (oriented along Z axis pointing forward directly to targeted block)
    const headGeo = new THREE.BoxGeometry(0.045, 0.07, 0.42);
    const headMesh = new THREE.Mesh(headGeo, matPrimary);
    headMesh.position.set(0, 0.42, 0);
    group.add(headMesh);

    // Front Pick Tip (facing forward +Z towards targeted block)
    const tipFront = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.09, 0.05), matHighlight);
    tipFront.position.set(0, 0.39, 0.20);
    tipFront.rotation.x = -0.35;
    group.add(tipFront);

    // Rear Pick Tip (facing back -Z)
    const tipRear = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.09, 0.05), matHighlight);
    tipRear.position.set(0, 0.39, -0.20);
    tipRear.rotation.x = 0.35;
    group.add(tipRear);

  } else if (toolType === 'axe') {
    // Handle
    const handleGeo = new THREE.BoxGeometry(0.04, 0.58, 0.04);
    const handleMesh = new THREE.Mesh(handleGeo, matHandle);
    handleMesh.position.set(0, 0.12, 0);
    group.add(handleMesh);

    // Broad Axe Head Wedge (facing forward +Z)
    const axeHeadGeo = new THREE.BoxGeometry(0.05, 0.18, 0.20);
    const axeHead = new THREE.Mesh(axeHeadGeo, matPrimary);
    axeHead.position.set(0, 0.38, 0.07);
    group.add(axeHead);

    // Sharp Cutting Edge Blade
    const bladeGeo = new THREE.BoxGeometry(0.04, 0.22, 0.04);
    const blade = new THREE.Mesh(bladeGeo, matHighlight);
    blade.position.set(0, 0.38, 0.17);
    group.add(blade);

    // Rear Poll
    const pollGeo = new THREE.BoxGeometry(0.06, 0.10, 0.07);
    const poll = new THREE.Mesh(pollGeo, matSecondary);
    poll.position.set(0, 0.40, -0.04);
    group.add(poll);

  } else if (toolType === 'shovel') {
    // Handle
    const handleGeo = new THREE.BoxGeometry(0.04, 0.60, 0.04);
    const handleMesh = new THREE.Mesh(handleGeo, matHandle);
    handleMesh.position.set(0, 0.12, 0);
    group.add(handleMesh);

    // Metallic socket
    const socketGeo = new THREE.BoxGeometry(0.065, 0.06, 0.065);
    const socket = new THREE.Mesh(socketGeo, matSecondary);
    socket.position.set(0, 0.38, 0);
    group.add(socket);

    // Shovel Scoop Blade (facing forward)
    const scoopGeo = new THREE.BoxGeometry(0.18, 0.22, 0.035);
    const scoop = new THREE.Mesh(scoopGeo, matPrimary);
    scoop.position.set(0, 0.48, 0.015);
    group.add(scoop);

    // Tip edge
    const tipGeo = new THREE.BoxGeometry(0.14, 0.035, 0.04);
    const tip = new THREE.Mesh(tipGeo, matHighlight);
    tip.position.set(0, 0.60, 0.015);
    group.add(tip);

  } else if (toolType === 'hoe') {
    // Handle
    const handleGeo = new THREE.BoxGeometry(0.04, 0.58, 0.04);
    const handleMesh = new THREE.Mesh(handleGeo, matHandle);
    handleMesh.position.set(0, 0.12, 0);
    group.add(handleMesh);

    // Horizontal Hoe Head (along +Z)
    const headGeo = new THREE.BoxGeometry(0.05, 0.06, 0.18);
    const head = new THREE.Mesh(headGeo, matPrimary);
    head.position.set(0, 0.40, 0.07);
    group.add(head);

    // Downward tilling blade
    const bladeGeo = new THREE.BoxGeometry(0.045, 0.12, 0.04);
    const blade = new THREE.Mesh(bladeGeo, matHighlight);
    blade.position.set(0, 0.35, 0.15);
    group.add(blade);
  } else {
    // Generic item
    const boxGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
    const box = new THREE.Mesh(boxGeo, matPrimary);
    box.position.set(0, 0.20, 0);
    group.add(box);
  }

  group.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}

