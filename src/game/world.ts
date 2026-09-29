/**
 * Minecraft Web 3D - Procedural Infinite Voxel World Engine
 * Supports varied biomes (Plains, Forest, Mountains), 3D Caves with ores,
 * Starter Cabin structure, dynamic infinite chunk streaming, and world persistence.
 */
import * as THREE from 'three';
import {
  BlockType,
  BLOCK_CONFIGS,
  CHUNK_SIZE_X,
  CHUNK_SIZE_Z,
  WORLD_HEIGHT,
  SEA_LEVEL,
  Y_MIN,
  Y_MAX,
  TOTAL_LAYERS,
  BiomeType,
  BIOME_NAMES,
  isDoor,
  isDoorBottom,
  isDoorTop,
} from './constants';
import { SimplexNoise } from './simplex';
import { getAtlasTexture, getBlockUVs } from './textures';
import { audio } from './audio';

export type { BiomeType };

export interface VoxelHit {
  point: THREE.Vector3;
  normal: THREE.Vector3;
  blockPos: THREE.Vector3;
  adjacentPos: THREE.Vector3;
  blockType: BlockType;
  distance: number;
}

export class Chunk {
  public cx: number;
  public cz: number;
  public blocks: Uint8Array; // 16 * 16 * TOTAL_LAYERS
  public fluidLevels: Uint8Array; // 16 * 16 * TOTAL_LAYERS: stores level (1..8) & falling flag (bit 4: 0x10)
  public opaqueMesh: THREE.Mesh | null = null;
  public transparentMesh: THREE.Mesh | null = null;
  public waterMesh: THREE.Mesh | null = null;
  public lavaMesh: THREE.Mesh | null = null;
  public isDirty: boolean = true;
  public isGenerated: boolean = false;
  public isMeshed: boolean = false;
  public minY: number = Y_MIN;
  public maxY: number = Y_MIN;

  constructor(cx: number, cz: number) {
    this.cx = cx;
    this.cz = cz;
    this.blocks = new Uint8Array(CHUNK_SIZE_X * CHUNK_SIZE_Z * TOTAL_LAYERS);
    this.fluidLevels = new Uint8Array(CHUNK_SIZE_X * CHUNK_SIZE_Z * TOTAL_LAYERS);
  }

  public getIndex(lx: number, y: number, lz: number): number {
    const localY = y - Y_MIN;
    return (localY * CHUNK_SIZE_Z + lz) * CHUNK_SIZE_X + lx;
  }

  public getBlock(lx: number, y: number, lz: number): BlockType {
    if (lx < 0 || lx >= CHUNK_SIZE_X || lz < 0 || lz >= CHUNK_SIZE_Z || y < Y_MIN || y > Y_MAX) {
      return BlockType.AIR;
    }
    return this.blocks[this.getIndex(lx, y, lz)];
  }

  public setBlock(lx: number, y: number, lz: number, type: BlockType) {
    if (lx < 0 || lx >= CHUNK_SIZE_X || lz < 0 || lz >= CHUNK_SIZE_Z || y < Y_MIN || y > Y_MAX) {
      return;
    }
    const idx = this.getIndex(lx, y, lz);
    this.blocks[idx] = type;
    if (type === BlockType.WATER) {
      if (this.fluidLevels[idx] === 0) this.fluidLevels[idx] = 5;
    } else if (type === BlockType.LAVA) {
      if (this.fluidLevels[idx] === 0) this.fluidLevels[idx] = 3;
    } else {
      this.fluidLevels[idx] = 0;
    }
    if (type !== BlockType.AIR) {
      if (y < this.minY) this.minY = y;
      if (y > this.maxY) this.maxY = y;
    }
    this.isDirty = true;
  }

  public getFluidLevel(lx: number, y: number, lz: number): number {
    if (lx < 0 || lx >= CHUNK_SIZE_X || lz < 0 || lz >= CHUNK_SIZE_Z || y < Y_MIN || y > Y_MAX) {
      return 0;
    }
    const idx = this.getIndex(lx, y, lz);
    const block = this.blocks[idx];
    if (block !== BlockType.WATER && block !== BlockType.LAVA) return 0;
    const val = this.fluidLevels[idx];
    if (val === 0) {
      return block === BlockType.LAVA ? 3 : 5; // Default natural viscous source level
    }
    return val & 0x0F;
  }

  public isFluidFalling(lx: number, y: number, lz: number): boolean {
    if (lx < 0 || lx >= CHUNK_SIZE_X || lz < 0 || lz >= CHUNK_SIZE_Z || y < Y_MIN || y > Y_MAX) {
      return false;
    }
    const idx = this.getIndex(lx, y, lz);
    return (this.fluidLevels[idx] & 0x10) !== 0;
  }

  public setFluidData(lx: number, y: number, lz: number, level: number, falling: boolean = false) {
    if (lx < 0 || lx >= CHUNK_SIZE_X || lz < 0 || lz >= CHUNK_SIZE_Z || y < Y_MIN || y > Y_MAX) {
      return;
    }
    const idx = this.getIndex(lx, y, lz);
    this.fluidLevels[idx] = (level & 0x0F) | (falling ? 0x10 : 0);
    this.isDirty = true;
  }
}

export function getBiomeFoliageColor(biome: BiomeType): [number, number, number] {
  switch (biome) {
    // Jungles: ultra-vibrant lush tropical emerald
    case 'jungle':
    case 'sparse_jungle':
      return [0.32, 0.94, 0.22];

    // Savannas: authentic dry golden yellowish olive
    case 'savanna':
    case 'savanna_plateau':
    case 'windswept_savanna':
      return [0.76, 0.70, 0.26];

    // Swamps: dark murky mossy olive green
    case 'swamp':
    case 'mangrove_swamp':
      return [0.42, 0.50, 0.22];

    // Forests & Flower Forest: rich vibrant green
    case 'forest':
    case 'flower_forest':
      return [0.46, 0.78, 0.28];

    // Birch Forests: bright fresh yellowish-green
    case 'birch_forest':
    case 'old_growth_birch_forest':
      return [0.58, 0.84, 0.36];

    // Dark Forest: deep dense shadowy forest green
    case 'dark_forest':
      return [0.28, 0.52, 0.20];

    // Taigas & Coniferous: cool evergreen pine
    case 'taiga':
    case 'old_growth_pine_taiga':
    case 'old_growth_spruce_taiga':
      return [0.38, 0.64, 0.44];

    // Snowy biomes: frost-tinged icy mint pale green
    case 'snowy_plains':
    case 'snowy_taiga':
    case 'snowy_slopes':
    case 'ice_spikes':
    case 'frozen_peaks':
    case 'frozen_river':
    case 'snowy_beach':
      return [0.50, 0.70, 0.66];

    // Arid / Desert / Badlands: sun-bleached golden straw tan
    case 'desert':
    case 'badlands':
    case 'eroded_badlands':
    case 'wooded_badlands':
      return [0.72, 0.66, 0.30];

    // Meadows & Blossoms: crisp blooming spring green
    case 'meadow':
      return [0.48, 0.88, 0.38];
    case 'cherry_grove':
      return [0.58, 0.86, 0.48];
    case 'sunflower_plains':
      return [0.56, 0.84, 0.32];

    // Mountains & Windswept hills: rugged mountain green
    case 'windswept_hills':
    case 'windswept_gravelly_hills':
    case 'windswept_forest':
    case 'stony_peaks':
    case 'jagged_peaks':
    case 'grove':
    case 'stony_shore':
      return [0.44, 0.68, 0.38];

    // Mushroom Fields: mycorrhizal soft sage
    case 'mushroom_fields':
      return [0.48, 0.60, 0.50];

    // Rivers & Coast
    case 'river':
    case 'beach':
      return [0.52, 0.80, 0.34];

    // Oceans
    case 'ocean':
    case 'deep_ocean':
    case 'warm_ocean':
    case 'lukewarm_ocean':
    case 'deep_lukewarm_ocean':
    case 'cold_ocean':
    case 'deep_cold_ocean':
    case 'frozen_ocean':
    case 'deep_frozen_ocean':
      return [0.48, 0.76, 0.36];

    // Default Plains
    case 'plains':
    default:
      return [0.54, 0.82, 0.32];
  }
}

// Soil & Ground Tinting per Biome (Warm desert sands, rich damp jungle loam, frosty tundra earth)
export function getBiomeSoilColor(biome: BiomeType): [number, number, number] {
  if (biome === 'desert' || biome.includes('badlands') || biome.includes('savanna')) {
    return [1.08, 0.94, 0.82]; // Warmer, sun-baked clay earth
  }
  if (biome.includes('snowy') || biome.includes('frozen') || biome === 'ice_spikes') {
    return [0.92, 0.96, 1.05]; // Cold, frost-chilled earth
  }
  if (biome.includes('jungle') || biome.includes('swamp') || biome === 'mangrove_swamp') {
    return [0.85, 0.82, 0.74]; // Deep rich damp fertile loamy soil
  }
  if (biome === 'old_growth_pine_taiga' || biome === 'old_growth_spruce_taiga') {
    return [0.90, 0.85, 0.80]; // Coniferous forest floor
  }
  return [1.0, 1.0, 1.0];
}

export class World {
  public chunks: Map<string, Chunk> = new Map();
  public modifiedBlocks: Map<string, BlockType> = new Map(); // Global player edits across all chunks
  public scene: THREE.Scene;
  public seed: number;
  public noise: SimplexNoise;
  public renderRadius: number = 3; // 7x7 chunks active around player

  // Fluid physics queue & timers
  public pendingFluidUpdates: Set<string> = new Set();
  public doorStates: Map<string, { facing: 'N' | 'S' | 'E' | 'W'; isOpen: boolean }> = new Map();
  public dirtyChunks: Set<Chunk> = new Set();
  private waterTickTimer: number = 0;
  private lavaTickTimer: number = 0;
  private grassTickTimer: number = 0;
  private lastFizzTime: number = 0;

  private opaqueMaterial: THREE.MeshLambertMaterial;
  private transparentMaterial: THREE.MeshLambertMaterial;
  public waterMaterial: THREE.ShaderMaterial;
  public lavaMaterial: THREE.ShaderMaterial;
  private torchLights: Map<string, THREE.PointLight> = new Map();
  private lastPlayerCx: number = 999999;
  private lastPlayerCz: number = 999999;

  constructor(scene: THREE.Scene, seed: number = 1337) {
    this.scene = scene;
    this.seed = seed;
    this.noise = new SimplexNoise(seed);

    const atlas = getAtlasTexture();
    this.opaqueMaterial = new THREE.MeshLambertMaterial({
      map: atlas,
      side: THREE.FrontSide,
      vertexColors: true,
    });

    this.transparentMaterial = new THREE.MeshLambertMaterial({
      map: atlas,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.5,
      opacity: 1.0,
      depthWrite: true,
      vertexColors: true,
    });

    // Realistic animated water shader material (flowing waves, sky reflections, specular highlights)
    this.waterMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSunDir: { value: new THREE.Vector3(0.5, 1.0, 0.3).normalize() },
        uSkyColor: { value: new THREE.Color(0x78b5e8) },
        uCameraPos: { value: new THREE.Vector3() },
        uMap: { value: atlas },
      },
      vertexShader: `
        uniform float uTime;
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying vec2 vUv;

        void main() {
          vUv = uv;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uSunDir;
        uniform vec3 uSkyColor;
        uniform vec3 uCameraPos;
        uniform sampler2D uMap;
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying vec2 vUv;

        void main() {
          vec3 viewDir = normalize(uCameraPos - vWorldPos);
          vec3 norm = vNormal;

          // Flowing texture coordinates (Minecraft animated water feel)
          vec2 flowUv = vUv;
          if (norm.y > 0.4) {
            flowUv += vec2(
              sin(uTime * 0.8 + vWorldPos.z * 0.5) * 0.0018,
              cos(uTime * 0.8 + vWorldPos.x * 0.5) * 0.0018
            );
          }
          vec4 texCol = texture2D(uMap, flowUv);

          // Deep crystal water color base
          vec3 deepWater = vec3(0.10, 0.32, 0.68);
          vec3 shallowWater = vec3(0.20, 0.54, 0.86);
          vec3 waterCol = mix(deepWater, shallowWater, 0.4);

          // Blend with voxel texture from atlas
          waterCol = mix(waterCol, texCol.rgb, 0.55);

          // Fresnel Sky and Cloud reflection
          float fresnel = pow(1.0 - max(0.0, dot(viewDir, norm)), 3.0);
          vec3 skyReflect = mix(uSkyColor, vec3(0.9, 0.95, 1.0), 0.3);
          waterCol = mix(waterCol, skyReflect, fresnel * 0.55);

          // Sun Specular reflection glint (sharp golden shimmer)
          vec3 halfDir = normalize(uSunDir + viewDir);
          float spec = pow(max(0.0, dot(norm, halfDir)), 36.0);
          waterCol += vec3(1.0, 0.96, 0.82) * spec * 1.2 * max(0.0, uSunDir.y);

          gl_FragColor = vec4(waterCol, 0.76);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // Molten incandescent animated lava shader material (heat crust, glowing flow, self-illuminating)
    this.lavaMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCameraPos: { value: new THREE.Vector3() },
        uMap: { value: atlas },
      },
      vertexShader: `
        uniform float uTime;
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying vec2 vUv;

        void main() {
          vUv = uv;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uCameraPos;
        uniform sampler2D uMap;
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying vec2 vUv;

        void main() {
          // Slow viscous molten flow coordinates
          vec2 flowUv = vUv;
          if (vNormal.y > 0.4) {
            flowUv += vec2(
              sin(uTime * 0.35 + vWorldPos.z * 0.3) * 0.0015,
              cos(uTime * 0.35 + vWorldPos.x * 0.3) * 0.0015
            );
          }
          vec4 texCol = texture2D(uMap, flowUv);

          // Deep incandescent molten palette
          vec3 moltenCore = vec3(1.0, 0.62, 0.10);
          vec3 hotMagma = vec3(0.95, 0.28, 0.04);
          vec3 darkCrust = vec3(0.68, 0.12, 0.02);

          // Pulsating heat dynamics
          float pulse = sin(uTime * 1.8 + vWorldPos.x * 1.5 + vWorldPos.z * 1.5) * 0.5 + 0.5;
          vec3 lavaCol = mix(hotMagma, moltenCore, pulse * 0.45);
          lavaCol = mix(lavaCol, texCol.rgb * 1.35, 0.55);

          // Dark cooling crust texture details
          if (texCol.r < 0.35 && texCol.g < 0.25) {
            lavaCol = mix(lavaCol, darkCrust, 0.6);
          }

          // Incandescent self-illumination (never dims in dark caves)
          gl_FragColor = vec4(lavaCol, 1.0);
        }
      `,
      transparent: false,
      depthWrite: true,
      side: THREE.DoubleSide,
    });
  }

  public updateWater(delta: number, timeOfDay: number, sunDir: THREE.Vector3, skyColor: THREE.Color, cameraPos: THREE.Vector3) {
    if (this.waterMaterial) {
      this.waterMaterial.uniforms.uTime.value += delta;
      this.waterMaterial.uniforms.uSunDir.value.copy(sunDir);
      this.waterMaterial.uniforms.uSkyColor.value.copy(skyColor);
      this.waterMaterial.uniforms.uCameraPos.value.copy(cameraPos);
    }
    if (this.lavaMaterial) {
      this.lavaMaterial.uniforms.uTime.value += delta;
      this.lavaMaterial.uniforms.uCameraPos.value.copy(cameraPos);
    }
  }

  public getFluidLevel(wx: number, y: number, wz: number): number {
    if (y < Y_MIN || y > Y_MAX) return 0;
    const { cx, cz, lx, lz } = this.worldToChunkCoords(wx, wz);
    const chunk = this.getChunk(cx, cz);
    if (!chunk) return 0;
    return chunk.getFluidLevel(lx, y, lz);
  }

  public isFluidFalling(wx: number, y: number, wz: number): boolean {
    if (y < Y_MIN || y > Y_MAX) return false;
    const { cx, cz, lx, lz } = this.worldToChunkCoords(wx, wz);
    const chunk = this.getChunk(cx, cz);
    if (!chunk) return false;
    return chunk.isFluidFalling(lx, y, lz);
  }

  public markChunkDirty(chunk: Chunk) {
    chunk.isDirty = true;
    this.dirtyChunks.add(chunk);
  }

  // Budgeted incremental chunk meshing to maintain solid 60 FPS
  public processDirtyChunks(maxRebuildsPerFrame: number = 3) {
    if (this.dirtyChunks.size === 0) return;
    let count = 0;
    for (const chunk of this.dirtyChunks) {
      this.dirtyChunks.delete(chunk);
      if (chunk.isDirty) {
        this.rebuildChunkMesh(chunk);
        count++;
        if (count >= maxRebuildsPerFrame) break;
      }
    }
  }

  public setFluidData(wx: number, y: number, wz: number, level: number, falling: boolean = false) {
    if (y < Y_MIN || y > Y_MAX) return;
    const { cx, cz, lx, lz } = this.worldToChunkCoords(wx, wz);
    const chunk = this.getOrCreateChunk(cx, cz);
    chunk.setFluidData(lx, y, lz, level, falling);
    this.markChunkDirty(chunk);
    if (lx === 0) {
      const n = this.getChunk(cx - 1, cz);
      if (n) this.markChunkDirty(n);
    } else if (lx === CHUNK_SIZE_X - 1) {
      const n = this.getChunk(cx + 1, cz);
      if (n) this.markChunkDirty(n);
    }
    if (lz === 0) {
      const n = this.getChunk(cx, cz - 1);
      if (n) this.markChunkDirty(n);
    } else if (lz === CHUNK_SIZE_Z - 1) {
      const n = this.getChunk(cx, cz + 1);
      if (n) this.markChunkDirty(n);
    }
  }

  // Fluid height for a single block column (Minecraft fraction based on level)
  public getFluidHeight(wx: number, y: number, wz: number, fluidType: BlockType): number {
    const b = this.getBlock(wx, y, wz);
    if (b !== fluidType) return 0;
    // Submerged under fluid of the same type -> full 1.0 height
    if (this.getBlock(wx, y + 1, wz) === fluidType) {
      return 1.0;
    }
    if (this.isFluidFalling(wx, y, wz)) {
      return 0.94;
    }
    const level = this.getFluidLevel(wx, y, wz);
    if (fluidType === BlockType.WATER) {
      // Viscous water: level 5 is source (~0.88 height with classic lip), down to level 1 (~0.18)
      return Math.max(0.18, (level / 5.0) * 0.88);
    } else {
      // Lava level 3 is source (~0.88), down to level 1 (~0.28)
      return Math.max(0.24, (level / 3.0) * 0.88);
    }
  }

  // Interpolated fluid corner height across the 4 columns meeting at (wx, wz)
  public getFluidCornerHeight(wx: number, y: number, wz: number, fluidType: BlockType): number {
    const cols = [
      [wx - 1, wz - 1],
      [wx - 1, wz],
      [wx, wz - 1],
      [wx, wz],
    ];

    // If any column has fluid directly above, this corner connects to a vertical waterfall
    for (const [cx, cz] of cols) {
      if (this.getBlock(cx, y + 1, cz) === fluidType) {
        return 1.0;
      }
    }

    let sum = 0;
    let count = 0;
    for (const [cx, cz] of cols) {
      const h = this.getFluidHeight(cx, y, cz, fluidType);
      if (h > 0) {
        sum += h;
        count++;
      }
    }

    if (count === 0) return 0.12;
    return sum / count;
  }

  // Horizontal fluid flow vector derived from gradient of fluid levels
  public getFluidFlowDirection(wx: number, y: number, wz: number): THREE.Vector2 {
    const fluid = this.getBlock(wx, y, wz);
    if (fluid !== BlockType.WATER && fluid !== BlockType.LAVA) {
      return new THREE.Vector2(0, 0);
    }
    if (this.getBlock(wx, y + 1, wz) === fluid) {
      return new THREE.Vector2(0, 0); // Vertical waterfall
    }

    const curLvl = this.getFluidLevel(wx, y, wz);

    const getL = (dx: number, dz: number) => {
      const b = this.getBlock(wx + dx, y, wz + dz);
      if (b === fluid) {
        if (this.getBlock(wx + dx, y + 1, wz + dz) === fluid) return 9; // Waterfall is strongest supplier
        return this.getFluidLevel(wx + dx, y, wz + dz);
      } else if (b === BlockType.AIR || BLOCK_CONFIGS[b]?.transparent) {
        return 0; // Air pulls flow
      }
      return curLvl; // Solid wall
    };

    const dirX = getL(-1, 0) - getL(1, 0);
    const dirZ = getL(0, -1) - getL(0, 1);

    const vec = new THREE.Vector2(dirX, dirZ);
    if (vec.lengthSq() > 0.001) {
      vec.normalize();
    }
    return vec;
  }

  public getChunkKey(cx: number, cz: number): string {
    return `${cx},${cz}`;
  }

  public getChunk(cx: number, cz: number): Chunk | undefined {
    return this.chunks.get(this.getChunkKey(cx, cz));
  }

  public getOrCreateChunk(cx: number, cz: number): Chunk {
    const key = this.getChunkKey(cx, cz);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = new Chunk(cx, cz);
      this.chunks.set(key, chunk);
    }
    return chunk;
  }

  public worldToChunkCoords(wx: number, wz: number): { cx: number; cz: number; lx: number; lz: number } {
    const cx = Math.floor(wx / CHUNK_SIZE_X);
    const cz = Math.floor(wz / CHUNK_SIZE_Z);
    let lx = Math.floor(wx % CHUNK_SIZE_X);
    let lz = Math.floor(wz % CHUNK_SIZE_Z);
    if (lx < 0) lx += CHUNK_SIZE_X;
    if (lz < 0) lz += CHUNK_SIZE_Z;
    return { cx, cz, lx, lz };
  }

  public getBlock(wx: number, y: number, wz: number): BlockType {
    if (y < Y_MIN || y > Y_MAX) return BlockType.AIR;
    const { cx, cz, lx, lz } = this.worldToChunkCoords(wx, wz);
    const chunk = this.getChunk(cx, cz);
    if (!chunk) {
      // Chunk not loaded yet: can query modifiedBlocks or return Air
      const key = `${wx},${y},${wz}`;
      if (this.modifiedBlocks.has(key)) {
        return this.modifiedBlocks.get(key)!;
      }
      return BlockType.AIR;
    }
    return chunk.getBlock(lx, y, lz);
  }

  public setBlock(
    wx: number,
    y: number,
    wz: number,
    type: BlockType,
    recordModification: boolean = true,
    rebuildImmediate: boolean = true
  ) {
    if (y < Y_MIN || y > Y_MAX) return;
    const { cx, cz, lx, lz } = this.worldToChunkCoords(wx, wz);
    const chunk = this.getOrCreateChunk(cx, cz);
    chunk.setBlock(lx, y, lz, type);

    // Save into modified blocks map for permanent persistence
    if (recordModification) {
      this.modifiedBlocks.set(`${wx},${y},${wz}`, type);
    }

    // Torch, Lantern & Lit Furnace light management
    const posKey = `${wx},${y},${wz}`;
    const isLightSource = type === BlockType.TORCH || type === BlockType.LANTERN || type === BlockType.FURNACE_LIT;
    if (isLightSource && !this.torchLights.has(posKey)) {
      const color = type === BlockType.LANTERN ? 0xffea85 : type === BlockType.FURNACE_LIT ? 0xff7722 : 0xffa533;
      const intensity = type === BlockType.LANTERN ? 9.0 : type === BlockType.FURNACE_LIT ? 6.5 : 7.0;
      const distance = type === BlockType.LANTERN ? 32 : type === BlockType.FURNACE_LIT ? 22 : 24;
      const pLight = new THREE.PointLight(color, intensity, distance);
      pLight.decay = 1.6;
      pLight.position.set(wx + 0.5, y + 0.6, wz + 0.5);
      this.scene.add(pLight);
      this.torchLights.set(posKey, pLight);
    } else if (!isLightSource && this.torchLights.has(posKey)) {
      const pLight = this.torchLights.get(posKey)!;
      this.scene.remove(pLight);
      this.torchLights.delete(posKey);
    }

    // Rebuild chunk mesh or queue for budgeted rebuild
    if (rebuildImmediate) {
      this.rebuildChunkMesh(chunk);
      if (lx === 0) {
        const neighbor = this.getChunk(cx - 1, cz);
        if (neighbor) this.rebuildChunkMesh(neighbor);
      } else if (lx === CHUNK_SIZE_X - 1) {
        const neighbor = this.getChunk(cx + 1, cz);
        if (neighbor) this.rebuildChunkMesh(neighbor);
      }
      if (lz === 0) {
        const neighbor = this.getChunk(cx, cz - 1);
        if (neighbor) this.rebuildChunkMesh(neighbor);
      } else if (lz === CHUNK_SIZE_Z - 1) {
        const neighbor = this.getChunk(cx, cz + 1);
        if (neighbor) this.rebuildChunkMesh(neighbor);
      }
    } else {
      this.markChunkDirty(chunk);
      if (lx === 0) {
        const neighbor = this.getChunk(cx - 1, cz);
        if (neighbor) this.markChunkDirty(neighbor);
      } else if (lx === CHUNK_SIZE_X - 1) {
        const neighbor = this.getChunk(cx + 1, cz);
        if (neighbor) this.markChunkDirty(neighbor);
      }
      if (lz === 0) {
        const neighbor = this.getChunk(cx, cz - 1);
        if (neighbor) this.markChunkDirty(neighbor);
      } else if (lz === CHUNK_SIZE_Z - 1) {
        const neighbor = this.getChunk(cx, cz + 1);
        if (neighbor) this.markChunkDirty(neighbor);
      }
    }

    // Trigger reactive fluid physics for broken / placed block and neighbors
    this.triggerFluidCheck(wx, y, wz);
  }

  // Check if a door at voxel coordinates is currently swung open
  public isDoorOpen(wx: number, y: number, wz: number): boolean {
    const key = `${wx},${y},${wz}`;
    if (this.doorStates.has(key)) return this.doorStates.get(key)!.isOpen;
    const b = this.getBlock(wx, y, wz);
    if (isDoorTop(b)) {
      const bottomKey = `${wx},${y - 1},${wz}`;
      return this.doorStates.get(bottomKey)?.isOpen || false;
    }
    return false;
  }

  // Toggle a door between open and closed state
  public toggleDoor(wx: number, y: number, wz: number): boolean {
    const b = this.getBlock(wx, y, wz);
    if (!isDoor(b)) return false;

    const baseY = isDoorTop(b) ? y - 1 : y;
    const topY = baseY + 1;
    const bottomKey = `${wx},${baseY},${wz}`;
    const topKey = `${wx},${topY},${wz}`;

    const current = this.doorStates.get(bottomKey) || { facing: 'N', isOpen: false };
    const nextOpen = !current.isOpen;
    const updated = { facing: current.facing, isOpen: nextOpen };

    this.doorStates.set(bottomKey, updated);
    this.doorStates.set(topKey, updated);

    // Audio
    const isMetal = (
      b === BlockType.DOOR_IRON_BOTTOM || b === BlockType.DOOR_IRON_TOP ||
      b === BlockType.DOOR_COPPER_BOTTOM || b === BlockType.DOOR_COPPER_TOP
    );
    audio.playDoor(nextOpen, isMetal);

    // Re-mesh chunk containing door
    const coords = this.worldToChunkCoords(wx, wz);
    const chunk = this.getChunk(coords.cx, coords.cz);
    if (chunk) {
      this.rebuildChunkMesh(chunk);
    }

    return true;
  }

  // Reactive Fluid Physics System (Water & Lava flow, oceanic reaction, obsidian creation)
  public triggerFluidCheck(wx: number, y: number, wz: number) {
    const coords = [
      [0, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [1, 0, 0],
      [-1, 0, 0],
      [0, 0, 1],
      [0, 0, -1],
    ];
    for (const [dx, dy, dz] of coords) {
      const nx = wx + dx;
      const ny = y + dy;
      const nz = wz + dz;
      const b = this.getBlock(nx, ny, nz);
      if (b === BlockType.WATER || b === BlockType.LAVA || b === BlockType.AIR) {
        this.pendingFluidUpdates.add(`${nx},${ny},${nz}`);
      }
    }
  }

  public updateFluids(delta: number, onWaterLavaReaction?: (pos: THREE.Vector3) => void) {
    this.waterTickTimer += delta;
    this.lavaTickTimer += delta;

    // Viscous fluid tick rates (smoother and less frantic than thin water)
    const tickWater = this.waterTickTimer >= 0.18;
    const tickLava = this.lavaTickTimer >= 0.40;

    if (!tickWater && !tickLava) {
      // Process pending chunk remeshing even when no fluid tick occurs
      this.processDirtyChunks(1);
      return;
    }

    if (tickWater) this.waterTickTimer = 0;
    if (tickLava) this.lavaTickTimer = 0;

    if (this.pendingFluidUpdates.size === 0) {
      this.processDirtyChunks(2);
      return;
    }

    // Process a budgeted batch per tick to completely eliminate frame lag
    const maxUpdates = 48;
    const batchSize = Math.min(maxUpdates, this.pendingFluidUpdates.size);
    const currentBatch = Array.from(this.pendingFluidUpdates).slice(0, batchSize);

    const startTime = performance.now();

    for (const key of currentBatch) {
      this.pendingFluidUpdates.delete(key);
      if (performance.now() - startTime > 4.0) {
        break; // Guard against frame spikes
      }

      const [sx, sy, sz] = key.split(',').map(Number);
      if (sy < Y_MIN || sy > Y_MAX) continue;

      const block = this.getBlock(sx, sy, sz);

      // 1. Infinite Water Source creation (Minecraft 2x2 or 3x1 well mechanic):
      if (block === BlockType.AIR || (block === BlockType.WATER && this.getFluidLevel(sx, sy, sz) < 5)) {
        const below = this.getBlock(sx, sy - 1, sz);
        if (below !== BlockType.AIR && below !== BlockType.WATER && below !== BlockType.LAVA) {
          let sourceNeighbors = 0;
          const hDirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
          for (const [dx, dz] of hDirs) {
            if (
              this.getBlock(sx + dx, sy, sz + dz) === BlockType.WATER &&
              this.getFluidLevel(sx + dx, sy, sz + dz) === 5 &&
              !this.isFluidFalling(sx + dx, sy, sz + dz)
            ) {
              sourceNeighbors++;
            }
          }
          if (sourceNeighbors >= 2) {
            this.setBlock(sx, sy, sz, BlockType.WATER, false, false);
            this.setFluidData(sx, sy, sz, 5, false);
            this.triggerFluidCheck(sx, sy, sz);
            continue;
          }
        }
      }

      // 2. AIR block inflow from above or neighbors:
      if (block === BlockType.AIR) {
        // A. Inflow from directly above (falling fluid)
        const above = this.getBlock(sx, sy + 1, sz);
        if (above === BlockType.WATER) {
          this.setBlock(sx, sy, sz, BlockType.WATER, false, false);
          this.setFluidData(sx, sy, sz, 5, true);
          this.triggerFluidCheck(sx, sy, sz);
          continue;
        } else if (above === BlockType.LAVA) {
          this.setBlock(sx, sy, sz, BlockType.LAVA, false, false);
          this.setFluidData(sx, sy, sz, 3, true);
          this.triggerFluidCheck(sx, sy, sz);
          continue;
        }

        // B. Horizontal inflow from surrounding water or lava:
        // "no sea tan facil de propagarse en caida": falling fluid only spreads horizontally when resting on solid floor!
        let bestWaterSupplier = 0;
        let bestLavaSupplier = 0;
        const hDirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

        for (const [dx, dz] of hDirs) {
          const nx = sx + dx;
          const nz = sz + dz;
          const nb = this.getBlock(nx, sy, nz);
          if (nb === BlockType.WATER) {
            const nbLevel = this.getFluidLevel(nx, sy, nz);
            const nbFalling = this.isFluidFalling(nx, sy, nz);
            const nbBelow = this.getBlock(nx, sy - 1, nz);
            const isNbMidAir = nbFalling || nbBelow === BlockType.AIR;
            if (!isNbMidAir && nbLevel > bestWaterSupplier) {
              bestWaterSupplier = nbLevel;
            }
          } else if (nb === BlockType.LAVA) {
            const nbLevel = this.getFluidLevel(nx, sy, nz);
            const nbFalling = this.isFluidFalling(nx, sy, nz);
            const nbBelow = this.getBlock(nx, sy - 1, nz);
            const isNbMidAir = nbFalling || nbBelow === BlockType.AIR;
            if (!isNbMidAir && nbLevel > bestLavaSupplier) {
              bestLavaSupplier = nbLevel;
            }
          }
        }

        if (bestWaterSupplier > 1) {
          this.setBlock(sx, sy, sz, BlockType.WATER, false, false);
          this.setFluidData(sx, sy, sz, bestWaterSupplier - 1, false);
          this.triggerFluidCheck(sx, sy, sz);
          continue;
        } else if (bestLavaSupplier > 1) {
          this.setBlock(sx, sy, sz, BlockType.LAVA, false, false);
          this.setFluidData(sx, sy, sz, bestLavaSupplier - 1, false);
          this.triggerFluidCheck(sx, sy, sz);
          continue;
        }
        continue;
      }

      // 3. FLUID BLOCK (WATER or LAVA)
      if (block === BlockType.WATER || block === BlockType.LAVA) {
        const isWater = block === BlockType.WATER;
        const maxLevel = isWater ? 5 : 3;
        const curLevel = this.getFluidLevel(sx, sy, sz);
        const falling = this.isFluidFalling(sx, sy, sz);

        // A. REACTION CHECK: Water + Lava
        const adj = [
          [0, 1, 0],
          [0, -1, 0],
          [1, 0, 0],
          [-1, 0, 0],
          [0, 0, 1],
          [0, 0, -1],
        ];

        let reacted = false;
        for (const [dx, dy, dz] of adj) {
          const nx = sx + dx;
          const ny = sy + dy;
          const nz = sz + dz;
          const nb = this.getBlock(nx, ny, nz);

          if (isWater && nb === BlockType.LAVA) {
            const lavaLvl = this.getFluidLevel(nx, ny, nz);
            const product = lavaLvl === 3 ? BlockType.OBSIDIAN : BlockType.COBBLESTONE;
            this.setBlock(nx, ny, nz, product, false, false);
            this.triggerFluidCheck(nx, ny, nz);
            const now = performance.now();
            if (now - this.lastFizzTime > 220) {
              this.lastFizzTime = now;
              audio.playFizz();
            }
            if (onWaterLavaReaction) onWaterLavaReaction(new THREE.Vector3(nx + 0.5, ny + 0.5, nz + 0.5));
            reacted = true;
          } else if (!isWater && nb === BlockType.WATER) {
            const product = curLevel === 3 ? BlockType.OBSIDIAN : BlockType.STONE;
            this.setBlock(sx, sy, sz, product, false, false);
            this.triggerFluidCheck(sx, sy, sz);
            const now = performance.now();
            if (now - this.lastFizzTime > 220) {
              this.lastFizzTime = now;
              audio.playFizz();
            }
            if (onWaterLavaReaction) onWaterLavaReaction(new THREE.Vector3(sx + 0.5, sy + 0.5, sz + 0.5));
            reacted = true;
            break;
          }
        }
        if (reacted) continue;

        // B. DRYING UP / RECEDING when source is blocked or removed:
        if (curLevel < maxLevel || falling) {
          const aboveBlock = this.getBlock(sx, sy + 1, sz);
          const hasAboveSupplier = aboveBlock === block;

          if (!hasAboveSupplier) {
            let maxSupplier = 0;
            const hDirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            for (const [dx, dz] of hDirs) {
              if (this.getBlock(sx + dx, sy, sz + dz) === block) {
                const lvl = this.getFluidLevel(sx + dx, sy, sz + dz);
                if (lvl > maxSupplier) maxSupplier = lvl;
              }
            }

            if (maxSupplier <= 1) {
              // No valid supplier left -> recedes back to air
              this.setBlock(sx, sy, sz, BlockType.AIR, false, false);
              this.triggerFluidCheck(sx, sy, sz);
              continue;
            } else if (curLevel !== maxSupplier - 1) {
              this.setFluidData(sx, sy, sz, maxSupplier - 1, false);
              this.triggerFluidCheck(sx, sy, sz);
            }
          }
        }

        // C. DOWNWARD FLOW PRIORITY (waterfall / falling fluid):
        const belowBlock = this.getBlock(sx, sy - 1, sz);
        const canFlowDown =
          belowBlock === BlockType.AIR ||
          (belowBlock === BlockType.WATER && isWater && this.getFluidLevel(sx, sy - 1, sz) < 5) ||
          (belowBlock === BlockType.LAVA && !isWater && this.getFluidLevel(sx, sy - 1, sz) < 3);

        if (canFlowDown && sy > Y_MIN) {
          this.setBlock(sx, sy - 1, sz, block, false, false);
          this.setFluidData(sx, sy - 1, sz, maxLevel, true);
          this.triggerFluidCheck(sx, sy - 1, sz);
          // Falling straight down -> do not spread horizontally in mid-air
          continue;
        }

        // D. HORIZONTAL FLOW SPREADING:
        // "que no sea tan facil de propagarse en caida":
        // A falling fluid column only spreads horizontally when resting on solid ground!
        const isMidAir = falling || belowBlock === BlockType.AIR;
        if (!isMidAir && curLevel > 1) {
          const nextLevel = curLevel - 1;
          const hDirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

          // Pathfinding: look for drops within 3 blocks
          const searchDist = isWater ? 3 : 2;
          let shortestDropDist = 999;
          const dirDropDists: number[] = [];

          for (const [dx, dz] of hDirs) {
            let distToDrop = 999;
            const nx = sx + dx;
            const nz = sz + dz;
            const nb = this.getBlock(nx, sy, nz);

            if (nb === BlockType.AIR || nb === block) {
              if (this.getBlock(nx, sy - 1, nz) === BlockType.AIR) {
                distToDrop = 1;
              } else {
                for (let step = 2; step <= searchDist; step++) {
                  const tx = sx + dx * step;
                  const tz = sz + dz * step;
                  const tb = this.getBlock(tx, sy, tz);
                  if (tb !== BlockType.AIR && tb !== block) break;
                  if (this.getBlock(tx, sy - 1, tz) === BlockType.AIR) {
                    distToDrop = step;
                    break;
                  }
                }
              }
            }
            dirDropDists.push(distToDrop);
            if (distToDrop < shortestDropDist) shortestDropDist = distToDrop;
          }

          // Spread to eligible neighbors
          for (let i = 0; i < 4; i++) {
            const [dx, dz] = hDirs[i];
            const dist = dirDropDists[i];

            if (shortestDropDist < 999 && dist > shortestDropDist) {
              continue;
            }

            const nx = sx + dx;
            const nz = sz + dz;
            const nb = this.getBlock(nx, sy, nz);

            if (nb === BlockType.AIR) {
              this.setBlock(nx, sy, nz, block, false, false);
              this.setFluidData(nx, sy, nz, nextLevel, false);
              this.triggerFluidCheck(nx, sy, nz);
            } else if (nb === block) {
              const nbLvl = this.getFluidLevel(nx, sy, nz);
              if (nbLvl < nextLevel) {
                this.setFluidData(nx, sy, nz, nextLevel, false);
                this.triggerFluidCheck(nx, sy, nz);
              }
            }
          }
        }
      }
    }

    // Process chunk remeshing incrementally to guarantee 60 FPS
    this.processDirtyChunks(2);
  }

  // Grass spreading & decay system (Dirt naturally reproduces grass onto adjacent blocks)
  public updateGrassSpreading(delta: number, playerPos: THREE.Vector3) {
    this.grassTickTimer += delta;
    if (this.grassTickTimer < 1.0) return;
    this.grassTickTimer = 0;

    const basePx = Math.floor(playerPos.x);
    const basePz = Math.floor(playerPos.z);

    for (let i = 0; i < 12; i++) {
      const rx = basePx + Math.floor((Math.random() - 0.5) * 36);
      const rz = basePz + Math.floor((Math.random() - 0.5) * 36);

      const maxY = Math.min(Y_MAX - 2, Math.floor(playerPos.y + 16));
      const minY = Math.max(Y_MIN + 5, Math.floor(playerPos.y - 16));

      for (let y = maxY; y >= minY; y--) {
        const b = this.getBlock(rx, y, rz);
        if (b === BlockType.DIRT) {
          const above = this.getBlock(rx, y + 1, rz);
          if (above === BlockType.AIR || BLOCK_CONFIGS[above]?.transparent) {
            let hasAdjacentGrass = false;
            for (let dx = -1; dx <= 1 && !hasAdjacentGrass; dx++) {
              for (let dy = -1; dy <= 1 && !hasAdjacentGrass; dy++) {
                for (let dz = -1; dz <= 1 && !hasAdjacentGrass; dz++) {
                  if (this.getBlock(rx + dx, y + dy, rz + dz) === BlockType.GRASS) {
                    hasAdjacentGrass = true;
                  }
                }
              }
            }
            if (hasAdjacentGrass && Math.random() < 0.40) {
              this.setBlock(rx, y, rz, BlockType.GRASS);
            }
          }
          break;
        } else if (b === BlockType.GRASS) {
          const above = this.getBlock(rx, y + 1, rz);
          if (above !== BlockType.AIR && !BLOCK_CONFIGS[above]?.transparent) {
            if (Math.random() < 0.30) {
              this.setBlock(rx, y, rz, BlockType.DIRT);
            }
          }
          break;
        } else if (b !== BlockType.AIR && !BLOCK_CONFIGS[b]?.transparent) {
          break;
        }
      }
    }
  }

  // Continuous procedural terrain elevation and biome determination (all 49 Minecraft biomes)
  public getTerrainData(wx: number, wz: number): { surfaceY: number; biome: BiomeType } {
    // 1. Continental Noise: determines landmasses vs deep oceans with smooth transitions
    const continent = this.noise.fbm2D(wx * 0.002, wz * 0.002, 3, 0.5);

    // 2. Base rolling terrain detail
    const baseH = this.noise.fbm2D(wx * 0.012, wz * 0.012, 3, 0.45) * 2.2;
    const detailH = this.noise.noise2D(wx * 0.04, wz * 0.04) * 0.4;

    // 3. Multi-Noise Climate Parameters (temperature, humidity, weirdness, erosion, river)
    const temp = this.noise.noise2D(wx * 0.0022 + 120, wz * 0.0022 + 120);
    const humidity = this.noise.noise2D(wx * 0.0022 - 340, wz * 0.0022 + 340);
    const weirdness = this.noise.noise2D(wx * 0.0031 + 777, wz * 0.0031 - 777);
    const erosion = this.noise.noise2D(wx * 0.0028 - 512, wz * 0.0028 + 512);
    const riverNoise = Math.abs(this.noise.fbm2D(wx * 0.0035 + 234, wz * 0.0035 - 234, 2, 0.5));

    // A. Oceans and Deep Oceans (continent < -0.06)
    if (continent < -0.06) {
      const oceanDepth = Math.min(1.0, (-0.06 - continent) / 0.34);
      const surfaceY = Math.max(Y_MIN + 10, Math.floor(1 - oceanDepth * 28 + baseH * (1 - oceanDepth * 0.5)));

      // Deep Ocean check
      if (continent < -0.20) {
        if (temp < -0.30) return { surfaceY, biome: 'deep_frozen_ocean' };
        if (temp < -0.08) return { surfaceY, biome: 'deep_cold_ocean' };
        if (temp > 0.25) return { surfaceY, biome: 'deep_lukewarm_ocean' };
        return { surfaceY, biome: 'deep_ocean' };
      }

      // Standard Ocean / Island check
      if (weirdness > 0.62) {
        // Rare Mushroom Island in oceanic waters!
        const islandH = Math.max(2, Math.floor(2 + (weirdness - 0.62) * 16));
        return { surfaceY: Math.min(Y_MAX - 5, islandH), biome: 'mushroom_fields' };
      }

      if (temp < -0.30) return { surfaceY, biome: 'frozen_ocean' };
      if (temp < -0.08) return { surfaceY, biome: 'cold_ocean' };
      if (temp > 0.35) return { surfaceY, biome: 'warm_ocean' };
      if (temp > 0.15) return { surfaceY, biome: 'lukewarm_ocean' };
      return { surfaceY, biome: 'ocean' };
    }

    // Inland ground baseline (rolling surface around Y: 2 to 5)
    let groundY = 2.0 + (continent + 0.06) * 3.0 + baseH + detailH;

    // 4. Mountain Ridges & Peaks
    const mtnNoise = this.noise.fbm2D(wx * 0.0032 + 80, wz * 0.0032 - 80, 3, 0.5);
    let mountainHeight = 0;
    if (mtnNoise > 0.14) {
      const mtnStrength = Math.min(1.0, (mtnNoise - 0.14) / 0.54);
      const mtnScale = (this.noise.noise2D(wx * 0.0012 + 500, wz * 0.0012 - 500) + 1) * 0.5;
      const targetPeak = 14 + mtnScale * 26; // 14 to 40 peak height
      const slope = Math.pow(mtnStrength, 1.3);
      const terraces = Math.sin(wx * 0.04 + wz * 0.04) * 0.6;
      mountainHeight = slope * targetPeak + terraces;
    }

    // River valley dampening: carve valleys through mountains where rivers flow
    const riverWidth = 0.052;
    if (riverNoise < riverWidth * 1.8) {
      const valleyT = riverNoise / (riverWidth * 1.8);
      const valleyFactor = valleyT * valleyT * (3 - 2 * valleyT);
      mountainHeight *= valleyFactor;
    }
    groundY += mountainHeight;

    // Biome specific terrain relief
    const isArid = temp > 0.38 && humidity < -0.12;
    if (isArid && mountainHeight < 6) {
      const duneH = (Math.sin(wx * 0.025 + Math.cos(wz * 0.025) * 1.8) + 1) * 1.8;
      groundY += duneH;
    }

    const isTropical = temp > 0.20 && humidity > 0.08;
    if (isTropical && mountainHeight < 6) {
      const jungleH = (Math.sin(wx * 0.02 + wz * 0.02) + 1) * 2.2;
      groundY += jungleH;
    }

    const isSwamp = temp > 0.15 && humidity > 0.28 && mountainHeight < 3;
    if (isSwamp) {
      groundY = Math.max(1, groundY - 1.2);
    }

    // B. Procedural River Carving (smooth, continuous, non-bugged rivers with water-level shorelines)
    if (continent >= -0.08 && riverNoise < riverWidth) {
      const t = riverNoise / riverWidth; // 0.0 at center, 1.0 at bank outer edge
      // Water channel: within 0.0 to 0.54 of the river width
      if (t < 0.54) {
        // Deep continuous bed 2.5 to 3.2 blocks below SEA_LEVEL (guaranteed submerged water)
        const bedVariation = Math.sin(wx * 0.08 + wz * 0.08) * 0.4;
        const targetBed = SEA_LEVEL - 2.8 + bedVariation;
        const surfaceY = Math.floor(targetBed);
        return { surfaceY, biome: temp < -0.28 ? 'frozen_river' : 'river' };
      } else if (t < 0.76) {
        // Flat riverbank shoreline at exact water level (SEA_LEVEL = 0)
        // Eliminates 1-block steep walls so players effortlessly walk out of water onto land!
        return { surfaceY: SEA_LEVEL, biome: temp < -0.28 ? 'frozen_river' : 'river' };
      } else {
        // Gentle sloping river bank: smoothly rises from water level (SEA_LEVEL) to surrounding ground
        const bankT = (t - 0.76) / 0.24; // 0 at shoreline, 1 at land edge
        const smoothBank = bankT * bankT * (3 - 2 * bankT);
        const shoreY = SEA_LEVEL;
        groundY = shoreY * (1.0 - smoothBank) + groundY * smoothBank;
      }
    }

    const surfaceY = Math.min(Y_MAX - 5, Math.max(1, Math.floor(groundY)));

    // C. Coastlines & Beaches (flat shores at water level SEA_LEVEL with seamless transitions)
    if (continent >= -0.07 && continent < 0.04) {
      if (continent >= -0.02 && continent < 0.015) {
        // Beach shoreline flush at water level (Y = SEA_LEVEL = 0)
        if (temp < -0.25) return { surfaceY: SEA_LEVEL, biome: 'snowy_beach' };
        if (erosion > 0.35) return { surfaceY: SEA_LEVEL, biome: 'stony_shore' };
        return { surfaceY: SEA_LEVEL, biome: 'beach' };
      } else if (continent >= 0.015 && continent < 0.04 && surfaceY <= SEA_LEVEL + 2) {
        const coastT = (continent - 0.015) / 0.025;
        const beachY = Math.floor(SEA_LEVEL + coastT * 1.5);
        if (temp < -0.25) return { surfaceY: beachY, biome: 'snowy_beach' };
        if (erosion > 0.35) return { surfaceY: beachY, biome: 'stony_shore' };
        return { surfaceY: beachY, biome: 'beach' };
      }
    }

    // D. High Mountain Peaks & Slopes (mountainHeight >= 11 || surfaceY >= 22)
    if (mountainHeight >= 11 || surfaceY >= 22) {
      // High mountain summits (surfaceY >= 28)
      if (surfaceY >= 28) {
        if (temp < -0.30) return { surfaceY, biome: 'frozen_peaks' };
        if (temp < 0.0) return { surfaceY, biome: 'jagged_peaks' };
        if (temp > 0.25) return { surfaceY, biome: 'stony_peaks' };
        return { surfaceY, biome: 'jagged_peaks' };
      }

      // Mid-mountain slopes & plateaus (surfaceY: 20 to 27)
      if (temp < -0.25) return { surfaceY, biome: 'snowy_slopes' };
      if (temp < -0.05) return { surfaceY, biome: 'grove' };

      // Cherry grove: beautiful temperate mountain slopes with blossom trees
      if (temp >= 0.02 && temp <= 0.24 && humidity > 0.06 && weirdness > 0.15) {
        return { surfaceY, biome: 'cherry_grove' };
      }

      // Meadow: gentle flowery subalpine plateau
      if (temp >= -0.05 && temp <= 0.25 && humidity >= -0.10 && erosion < 0.25) {
        return { surfaceY, biome: 'meadow' };
      }

      // Windswept mountain variants
      if (erosion > 0.30) {
        if (humidity < -0.18) return { surfaceY, biome: 'windswept_savanna' };
        if (humidity > 0.12) return { surfaceY, biome: 'windswept_forest' };
        if (weirdness > 0.20) return { surfaceY, biome: 'windswept_gravelly_hills' };
        return { surfaceY, biome: 'windswept_hills' };
      }

      if (temp > 0.35) return { surfaceY, biome: 'savanna_plateau' };
      return { surfaceY, biome: 'windswept_hills' };
    }

    // E. Rare Mushroom Fields inland pocket
    if (weirdness > 0.65) {
      return { surfaceY, biome: 'mushroom_fields' };
    }

    // F. Freezing Biomes (temp < -0.30)
    if (temp < -0.30) {
      if (weirdness > 0.45) return { surfaceY, biome: 'ice_spikes' };
      if (humidity > 0.05) return { surfaceY, biome: 'snowy_taiga' };
      return { surfaceY, biome: 'snowy_plains' };
    }

    // G. Cold Biomes (-0.30 <= temp < -0.08)
    if (temp < -0.08) {
      if (weirdness > 0.38 && humidity > 0.12) return { surfaceY, biome: 'old_growth_spruce_taiga' };
      if (weirdness > 0.12 && humidity > 0.12) return { surfaceY, biome: 'old_growth_pine_taiga' };
      return { surfaceY, biome: 'taiga' };
    }

    // H. Hot / Arid Biomes (temp >= 0.40)
    if (temp >= 0.40) {
      if (humidity < -0.16) {
        if (weirdness > 0.45) return { surfaceY, biome: 'eroded_badlands' };
        if (weirdness > 0.20) return { surfaceY, biome: 'wooded_badlands' };
        if (weirdness > -0.12) return { surfaceY, biome: 'badlands' };
        return { surfaceY, biome: 'desert' };
      }
      if (humidity < 0.10) {
        if (erosion > 0.30) return { surfaceY, biome: 'windswept_savanna' };
        if (mountainHeight >= 5) return { surfaceY, biome: 'savanna_plateau' };
        return { surfaceY, biome: 'savanna' };
      }
      return { surfaceY, biome: 'sparse_jungle' };
    }

    // I. Warm / Subtropical Biomes (0.20 <= temp < 0.40)
    if (temp >= 0.20) {
      if (humidity > 0.28) {
        if (weirdness > 0.25) return { surfaceY, biome: 'mangrove_swamp' };
        return { surfaceY, biome: 'swamp' };
      }
      if (humidity >= 0.08) {
        if (weirdness > 0.35) return { surfaceY, biome: 'sparse_jungle' };
        return { surfaceY, biome: 'jungle' };
      }
      if (humidity < -0.16) return { surfaceY, biome: 'savanna' };
      return { surfaceY, biome: 'plains' };
    }

    // J. Temperate Biomes (-0.08 <= temp < 0.20)
    if (humidity < -0.15) {
      if (weirdness > 0.35) return { surfaceY, biome: 'sunflower_plains' };
      return { surfaceY, biome: 'plains' };
    }

    if (humidity >= 0.12) {
      if (humidity > 0.30) return { surfaceY, biome: 'dark_forest' };
      if (weirdness > 0.30) return { surfaceY, biome: 'flower_forest' };
      return { surfaceY, biome: 'forest' };
    }

    // Intermediate humidity (-0.15 to 0.12)
    if (weirdness > 0.42) return { surfaceY, biome: 'old_growth_birch_forest' };
    if (weirdness > 0.14) return { surfaceY, biome: 'birch_forest' };
    if (weirdness < -0.32) return { surfaceY, biome: 'sunflower_plains' };

    return { surfaceY, biome: 'plains' };
  }

  // Determine Biome at world coordinates (X, Z)
  public getBiome(wx: number, wz: number): BiomeType {
    return this.getTerrainData(wx, wz).biome;
  }

  // Infinite world chunk streamer: updates active chunks around player coordinates with Bedrock-style prioritization
  public updateInfiniteChunks(playerWx: number, playerWz: number, force: boolean = false) {
    const pcx = Math.floor(playerWx / CHUNK_SIZE_X);
    const pcz = Math.floor(playerWz / CHUNK_SIZE_Z);

    if (!force && pcx === this.lastPlayerCx && pcz === this.lastPlayerCz && this.dirtyChunks.size === 0) {
      return;
    }

    this.lastPlayerCx = pcx;
    this.lastPlayerCz = pcz;

    const R = this.renderRadius;

    // Collect all chunk coordinates in render distance sorted by distance from player (Bedrock concentric rings)
    const chunkList: { cx: number; cz: number; distSq: number }[] = [];
    for (let cx = pcx - R; cx <= pcx + R; cx++) {
      for (let cz = pcz - R; cz <= pcz + R; cz++) {
        const dx = cx - pcx;
        const dz = cz - pcz;
        chunkList.push({ cx, cz, distSq: dx * dx + dz * dz });
      }
    }
    chunkList.sort((a, b) => a.distSq - b.distSq);

    // 1. Generate all chunks in radius + 1 buffer ring
    const genBuffer = R + 1;
    for (let cx = pcx - genBuffer; cx <= pcx + genBuffer; cx++) {
      for (let cz = pcz - genBuffer; cz <= pcz + genBuffer; cz++) {
        const key = this.getChunkKey(cx, cz);
        let chunk = this.chunks.get(key);
        if (!chunk) {
          chunk = new Chunk(cx, cz);
          this.chunks.set(key, chunk);
        }

        if (!chunk.isGenerated) {
          this.generateChunkTerrain(chunk);
          this.decorateChunk(chunk);

          // Apply starter cabin if within chunk (0,0)
          if (cx === 0 && cz === 0) {
            this.buildStarterCabin(chunk);
          }

          // Apply Large Desert Temple if chunk qualifies
          if (this.hasDesertTemple(cx, cz)) {
            this.buildDesertTemple(chunk);
          }

          // Apply user modifications from saved world
          this.applyChunkModifications(chunk);
          chunk.isGenerated = true;

          // Mark neighbors dirty so cross-chunk boundaries cull correctly
          const nLeft = this.chunks.get(this.getChunkKey(cx - 1, cz));
          if (nLeft) nLeft.isDirty = true;
          const nRight = this.chunks.get(this.getChunkKey(cx + 1, cz));
          if (nRight) nRight.isDirty = true;
          const nUp = this.chunks.get(this.getChunkKey(cx, cz - 1));
          if (nUp) nUp.isDirty = true;
          const nDown = this.chunks.get(this.getChunkKey(cx, cz + 1));
          if (nDown) nDown.isDirty = true;
        }
      }
    }

    // 2. Mesh chunks from center outward (nearest chunks first for instant responsiveness)
    let meshesBuiltThisTick = 0;
    const maxMeshBudgetPerTick = force ? 9999 : 8;

    for (const item of chunkList) {
      const key = this.getChunkKey(item.cx, item.cz);
      const chunk = this.chunks.get(key);
      if (chunk && (!chunk.isMeshed || chunk.isDirty)) {
        this.rebuildChunkMesh(chunk);
        meshesBuiltThisTick++;
        if (meshesBuiltThisTick >= maxMeshBudgetPerTick && Math.sqrt(item.distSq) > 3) {
          break; // Defer remaining outer chunk meshes to next ticks for butter-smooth 60 FPS
        }
      }
    }

    // 3. Unload / unmesh chunks that are outside the render radius to free GPU memory
    this.chunks.forEach((chunk, key) => {
      const dist = Math.max(Math.abs(chunk.cx - pcx), Math.abs(chunk.cz - pcz));
      if (dist > R + 1) {
        if (chunk.opaqueMesh) {
          this.scene.remove(chunk.opaqueMesh);
          chunk.opaqueMesh.geometry.dispose();
          chunk.opaqueMesh = null;
        }
        if (chunk.transparentMesh) {
          this.scene.remove(chunk.transparentMesh);
          chunk.transparentMesh.geometry.dispose();
          chunk.transparentMesh = null;
        }
        if (chunk.waterMesh) {
          this.scene.remove(chunk.waterMesh);
          chunk.waterMesh.geometry.dispose();
          chunk.waterMesh = null;
        }
        if (chunk.lavaMesh) {
          this.scene.remove(chunk.lavaMesh);
          chunk.lavaMesh.geometry.dispose();
          chunk.lavaMesh = null;
        }
        chunk.isMeshed = false;
      }
    });
  }

  // Apply saved player modifications to chunk
  private applyChunkModifications(chunk: Chunk) {
    const startX = chunk.cx * CHUNK_SIZE_X;
    const startZ = chunk.cz * CHUNK_SIZE_Z;

    for (let lx = 0; lx < CHUNK_SIZE_X; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE_Z; lz++) {
        const wx = startX + lx;
        const wz = startZ + lz;
        for (let y = Y_MIN; y <= Y_MAX; y++) {
          const key = `${wx},${y},${wz}`;
          if (this.modifiedBlocks.has(key)) {
            chunk.setBlock(lx, y, lz, this.modifiedBlocks.get(key)!);
          }
        }
      }
    }
  }

  // Procedural terrain generation per chunk with vertical layers (-100 to 320)
  private generateChunkTerrain(chunk: Chunk) {
    const startX = chunk.cx * CHUNK_SIZE_X;
    const startZ = chunk.cz * CHUNK_SIZE_Z;

    for (let lx = 0; lx < CHUNK_SIZE_X; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE_Z; lz++) {
        const wx = startX + lx;
        const wz = startZ + lz;

        const { surfaceY, biome } = this.getTerrainData(wx, wz);

        // 1. Bedrock Layer (Y: -100 to Y: -95)
        chunk.setBlock(lx, Y_MIN, lz, BlockType.BEDROCK);
        for (let y = Y_MIN + 1; y <= Y_MIN + 5; y++) {
          const bedRand = Math.abs(Math.sin(wx * 73 + y * 97 + wz * 131) * 10000) % 1;
          const isBedrock = bedRand < ((Y_MIN + 5 - y) / 5);
          chunk.setBlock(lx, y, lz, isBedrock ? BlockType.BEDROCK : BlockType.DEEPSLATE);
        }

        // 2. Underground layers & 3D Caves (from Y: -94 up to surfaceY)
        const surfaceCaveNoise = this.noise.noise2D(wx * 0.028, wz * 0.028);
        const hasSurfaceCaveMouth = surfaceCaveNoise > 0.44 && surfaceY >= SEA_LEVEL + 2;

        for (let y = Y_MIN + 6; y < surfaceY; y++) {
          // 3D Cave carving (tunnels, ravines, and surface-connecting entrances)
          const caveWorm = Math.abs(this.noise.noise3D(wx * 0.036, y * 0.042, wz * 0.036));
          const caveRoom = this.noise.noise3D(wx * 0.018, y * 0.022, wz * 0.018);

          const isMountain = (b: string) => b.includes('peaks') || b.includes('windswept') || b === 'snowy_slopes' || b === 'grove';
          const isMountainSolidZone = isMountain(biome) && y > -4;

          // Reduced underground cave density + authentic surface entrances that open to the outside world
          const isSurfaceBreach = hasSurfaceCaveMouth && y >= surfaceY - 8 && caveWorm < 0.12;
          const isUndergroundCave = !isMountainSolidZone &&
            y > Y_MIN + 8 &&
            (
              (y < surfaceY - 3 && caveWorm < 0.068 && caveRoom > 0.06) ||
              (y < -15 && caveRoom > 0.46) ||
              (surfaceCaveNoise > 0.38 && y >= surfaceY - 7 && caveWorm < 0.09)
            );

          if (isSurfaceBreach || isUndergroundCave) {
            chunk.setBlock(lx, y, lz, BlockType.AIR);
            continue;
          }

          const isDeepslateLayer = y <= -54 || (y <= -46 && (Math.abs(Math.sin(wx * 19 + y * 31 + wz * 53)) % 1) < ((-46 - y) / 8));

          // Base block: Deepslate or Stone / Terracotta / Sandstone
          let baseBlock = isDeepslateLayer
            ? BlockType.DEEPSLATE
            : biome === 'desert' && y > surfaceY - 8
            ? BlockType.SANDSTONE
            : BlockType.STONE;

          if (y < surfaceY - 3 || isMountain(biome)) {
            chunk.setBlock(lx, y, lz, baseBlock);
          } else {
            // Subsurface layer
            if (biome === 'desert') {
              chunk.setBlock(lx, y, lz, BlockType.SANDSTONE);
            } else if (biome === 'badlands' || biome === 'eroded_badlands') {
              const layer = Math.abs(y + (wx % 3)) % 4;
              const terraBlock = layer === 0 ? BlockType.TERRACOTTA_ORANGE :
                                 layer === 1 ? BlockType.TERRACOTTA_YELLOW :
                                 layer === 2 ? BlockType.TERRACOTTA_WHITE : BlockType.TERRACOTTA;
              chunk.setBlock(lx, y, lz, terraBlock);
            } else if (biome === 'wooded_badlands') {
              chunk.setBlock(lx, y, lz, BlockType.TERRACOTTA);
            } else if (biome === 'ice_spikes' || biome === 'frozen_peaks') {
              chunk.setBlock(lx, y, lz, BlockType.PACKED_ICE);
            } else if (biome === 'snowy_plains' || biome === 'snowy_slopes' || biome === 'snowy_taiga') {
              chunk.setBlock(lx, y, lz, BlockType.DIRT);
            } else if (biome === 'stony_peaks' || biome === 'stony_shore') {
              chunk.setBlock(lx, y, lz, BlockType.STONE);
            } else if (biome === 'windswept_gravelly_hills') {
              chunk.setBlock(lx, y, lz, BlockType.GRAVEL);
            } else if (biome === 'mangrove_swamp') {
              chunk.setBlock(lx, y, lz, BlockType.PACKED_MUD);
            } else if (biome.includes('ocean')) {
              chunk.setBlock(lx, y, lz, BlockType.SAND);
            } else {
              chunk.setBlock(lx, y, lz, BlockType.DIRT);
            }
          }
        }

        // 3. Surface block (skip if surface cave mouth breaches the exterior)
        const isSurfaceOpenToSky = hasSurfaceCaveMouth && Math.abs(this.noise.noise3D(wx * 0.036, surfaceY * 0.042, wz * 0.036)) < 0.12;
        if (isSurfaceOpenToSky) {
          chunk.setBlock(lx, surfaceY, lz, BlockType.AIR);
        } else if (biome === 'desert') {
          chunk.setBlock(lx, surfaceY, lz, BlockType.SAND);
        } else if (biome === 'badlands' || biome === 'eroded_badlands') {
          chunk.setBlock(lx, surfaceY, lz, BlockType.RED_SAND);
        } else if (biome === 'wooded_badlands') {
          chunk.setBlock(lx, surfaceY, lz, surfaceY >= 14 ? BlockType.COARSE_DIRT : BlockType.RED_SAND);
        } else if (biome === 'mushroom_fields') {
          chunk.setBlock(lx, surfaceY, lz, BlockType.MYCELIUM);
        } else if (biome === 'ice_spikes') {
          chunk.setBlock(lx, surfaceY, lz, BlockType.SNOW_BLOCK);
        } else if (biome === 'frozen_peaks') {
          chunk.setBlock(lx, surfaceY, lz, BlockType.PACKED_ICE);
        } else if (biome === 'snowy_plains' || biome === 'snowy_slopes' || biome === 'snowy_taiga') {
          chunk.setBlock(lx, surfaceY, lz, BlockType.SNOW_GRASS);
        } else if (biome === 'snowy_beach') {
          chunk.setBlock(lx, surfaceY, lz, BlockType.SNOW_BLOCK);
        } else if (biome === 'jagged_peaks') {
          chunk.setBlock(lx, surfaceY, lz, ((wx + wz) % 2 === 0) ? BlockType.SNOW_BLOCK : BlockType.STONE);
        } else if (biome === 'stony_peaks' || biome === 'stony_shore') {
          chunk.setBlock(lx, surfaceY, lz, BlockType.STONE);
        } else if (biome === 'windswept_gravelly_hills') {
          chunk.setBlock(lx, surfaceY, lz, BlockType.GRAVEL);
        } else if (biome === 'old_growth_pine_taiga' || biome === 'old_growth_spruce_taiga') {
          chunk.setBlock(lx, surfaceY, lz, ((wx + wz) % 3 === 0) ? BlockType.COARSE_DIRT : BlockType.PODZOL);
        } else if (biome === 'mangrove_swamp') {
          chunk.setBlock(lx, surfaceY, lz, BlockType.MUD);
        } else if (biome === 'swamp') {
          // Organic isotropic 2D multi-octave clusters of mud and wetlands (no diagonal stripes)
          const mudN1 = this.noise.noise2D(wx * 0.05 + 13.5, wz * 0.05 - 29.1);
          const mudN2 = this.noise.noise2D(wx * 0.11 - 47.3, wz * 0.11 + 61.2) * 0.5;
          chunk.setBlock(lx, surfaceY, lz, (mudN1 + mudN2) > 0.04 ? BlockType.MUD : BlockType.GRASS);
        } else if (biome === 'beach' || (surfaceY <= SEA_LEVEL + 1 && !biome.includes('river'))) {
          chunk.setBlock(lx, surfaceY, lz, BlockType.SAND);
        } else if (biome === 'river' || biome === 'frozen_river') {
          // Natural organic riverbed: cohesive noise clusters of gravel, sand, and mud (no weird checkerboards)
          const riverBedNoise = this.noise.noise2D(wx * 0.05, wz * 0.05);
          const riverBedBlock = riverBedNoise > 0.16 ? BlockType.GRAVEL : riverBedNoise < -0.16 ? BlockType.SAND : BlockType.MUD;
          chunk.setBlock(lx, surfaceY, lz, riverBedBlock);
          // Solid multi-layer riverbed substrate
          for (let ry = Math.max(Y_MIN + 6, surfaceY - 3); ry < surfaceY; ry++) {
            chunk.setBlock(lx, ry, lz, riverBedBlock);
          }
        } else if (biome.includes('ocean')) {
          chunk.setBlock(lx, surfaceY, lz, BlockType.SAND);
        } else {
          chunk.setBlock(lx, surfaceY, lz, BlockType.GRASS);
        }

        // 4. Water filling for oceans and rivers (ALWAYS level at SEA_LEVEL)
        if (surfaceY < SEA_LEVEL) {
          const isFrozenWater = (biome === 'frozen_ocean' || biome === 'deep_frozen_ocean' || biome === 'frozen_river');
          for (let y = surfaceY + 1; y <= SEA_LEVEL; y++) {
            if (isFrozenWater && y === SEA_LEVEL) {
              chunk.setBlock(lx, y, lz, BlockType.ICE);
            } else {
              chunk.setBlock(lx, y, lz, BlockType.WATER);
              chunk.setFluidData(lx, y, lz, 8, false);
            }
          }
        }
      }
    }

    // 5. Authentic Minecraft Multi-Block Ore Vein Clusters (Veins of 3 to 12 connected blocks)
    this.generateChunkOreVeins(chunk);
  }

  // Generates 3D multi-block ore clusters in connected veins just like Minecraft
  private generateChunkOreVeins(chunk: Chunk) {
    const cx = chunk.cx;
    const cz = chunk.cz;

    const placeVein = (
      veinSeed: number,
      minY: number,
      maxY: number,
      veinSize: number,
      stoneOre: BlockType,
      deepslateOre: BlockType
    ) => {
      const r1 = Math.abs(Math.sin(cx * 43.1 + cz * 79.3 + veinSeed * 113.7 + this.seed) * 10000) % 1;
      const r2 = Math.abs(Math.sin(cx * 67.3 + cz * 31.9 + veinSeed * 157.1 + this.seed) * 10000) % 1;
      const r3 = Math.abs(Math.sin(cx * 89.7 + cz * 97.5 + veinSeed * 193.3 + this.seed) * 10000) % 1;

      let vx = Math.floor(r1 * (CHUNK_SIZE_X - 4)) + 2;
      let vy = Math.floor(minY + r2 * (maxY - minY));
      let vz = Math.floor(r3 * (CHUNK_SIZE_Z - 4)) + 2;

      let stepRand = Math.sin(veinSeed * 91 + this.seed);
      for (let s = 0; s < veinSize; s++) {
        if (vx >= 0 && vx < CHUNK_SIZE_X && vz >= 0 && vz < CHUNK_SIZE_Z && vy >= Y_MIN + 6 && vy <= Y_MAX - 5) {
          const b = chunk.getBlock(vx, vy, vz);
          if (b === BlockType.STONE) {
            chunk.setBlock(vx, vy, vz, stoneOre);
          } else if (b === BlockType.DEEPSLATE) {
            chunk.setBlock(vx, vy, vz, deepslateOre);
          }
        }
        stepRand = Math.sin(stepRand * 1000 + s * 13);
        const dir = Math.abs(stepRand * 10000) % 6;
        if (dir < 1) vx++;
        else if (dir < 2) vx--;
        else if (dir < 3) vz++;
        else if (dir < 4) vz--;
        else if (dir < 5) vy++;
        else vy--;
      }
    };

    // 1. Carbón (Coal) - Grandes vetas de 6-12 bloques
    for (let i = 0; i < 14; i++) {
      placeVein(i * 10 + 1, 5, 75, 6 + Math.floor(Math.random() * 7), BlockType.COAL_ORE, BlockType.DEEPSLATE_COAL_ORE);
    }

    // 2. Hierro (Iron) - Vetas de 4-9 bloques
    for (let i = 0; i < 9; i++) {
      placeVein(i * 10 + 2, -40, 35, 4 + Math.floor(Math.random() * 6), BlockType.IRON_ORE, BlockType.DEEPSLATE_IRON_ORE);
    }

    // 3. Cobre (Copper) - Vetas de 4-8 bloques
    for (let i = 0; i < 7; i++) {
      placeVein(i * 10 + 3, -16, 40, 4 + Math.floor(Math.random() * 5), BlockType.COPPER_ORE, BlockType.DEEPSLATE_COPPER_ORE);
    }

    // 4. Oro (Gold) - Vetas de 4-7 bloques en capas medias/profundas
    for (let i = 0; i < 4; i++) {
      placeVein(i * 10 + 4, -60, -10, 4 + Math.floor(Math.random() * 4), BlockType.GOLD_ORE, BlockType.DEEPSLATE_GOLD_ORE);
    }

    // 5. Titanio (Titanium) - Abundante pero entre el hierro y el diamante (6 vetas por chunk, tamaño 4-7)
    for (let i = 0; i < 6; i++) {
      placeVein(i * 10 + 5, -60, 20, 4 + Math.floor(Math.random() * 4), BlockType.TITANIUM_ORE, BlockType.DEEPSLATE_TITANIUM_ORE);
    }

    // 6. Petróleo (Petroleum) - Yacimientos subterráneos de 5-9 bloques
    for (let i = 0; i < 4; i++) {
      placeVein(i * 10 + 6, -70, 8, 5 + Math.floor(Math.random() * 5), BlockType.PETROLEUM_ORE, BlockType.PETROLEUM_ORE);
    }

    // 7. Diamante (Diamond) - Muy escaso, cerca de bedrock, vetas de 3-6 bloques
    for (let i = 0; i < 2; i++) {
      placeVein(i * 10 + 7, -90, -45, 3 + Math.floor(Math.random() * 4), BlockType.DEEPSLATE_DIAMOND_ORE, BlockType.DEEPSLATE_DIAMOND_ORE);
    }
  }

  // Helper to place blocks safely across chunk boundaries during tree/structure growth
  private setBlockInChunkOrWorld(wx: number, y: number, wz: number, type: BlockType, targetChunk?: Chunk) {
    if (y < Y_MIN || y > Y_MAX) return;
    if (targetChunk) {
      const coords = this.worldToChunkCoords(wx, wz);
      if (coords.cx === targetChunk.cx && coords.cz === targetChunk.cz) {
        if (targetChunk.getBlock(coords.lx, y, coords.lz) === BlockType.AIR) {
          targetChunk.setBlock(coords.lx, y, coords.lz, type);
        }
      } else {
        const neighbor = this.getChunk(coords.cx, coords.cz);
        if (neighbor && neighbor.getBlock(coords.lx, y, coords.lz) === BlockType.AIR) {
          neighbor.setBlock(coords.lx, y, coords.lz, type);
          neighbor.isDirty = true;
        }
      }
    } else {
      if (this.getBlock(wx, y, wz) === BlockType.AIR) {
        this.setBlock(wx, y, wz, type, false);
      }
    }
  }

  // Check if chunk qualifies for a large Desert Temple (pyramid monument)
  public hasDesertTemple(cx: number, cz: number): boolean {
    if (Math.abs(cx) < 2 && Math.abs(cz) < 2) return false;
    const hash = Math.abs(Math.sin(cx * 37.1 + cz * 79.3 + 91.5) * 10000) % 1;
    if (hash > 0.08) return false; // Rare & exciting discovery!
    const biome = this.getBiome(cx * CHUNK_SIZE_X + 8, cz * CHUNK_SIZE_Z + 8);
    return biome === 'desert';
  }

  // Build a Grand Desert Temple (Authentic Minecraft Desert Pyramid) with twin towers and secret vault!
  public buildDesertTemple(chunk: Chunk) {
    const templeX = 1;
    const templeZ = 1;
    const width = 14;
    const length = 14;

    // Find average surface height in temple area
    let baseY = 3;
    for (let y = 30; y >= SEA_LEVEL; y--) {
      const b = chunk.getBlock(7, y, 7);
      if (b !== BlockType.AIR && b !== BlockType.WATER && BLOCK_CONFIGS[b]?.solid) {
        baseY = y;
        break;
      }
    }

    // 1. Solid Sandstone Foundation from subterranean level up to baseY
    for (let y = baseY - 5; y <= baseY; y++) {
      for (let dx = 0; dx < width; dx++) {
        for (let dz = 0; dz < length; dz++) {
          chunk.setBlock(templeX + dx, y, templeZ + dz, BlockType.SANDSTONE);
        }
      }
    }

    // 2. Outer Temple Sandstone Walls (height 5)
    for (let dy = 1; dy <= 5; dy++) {
      for (let dx = 0; dx < width; dx++) {
        for (let dz = 0; dz < length; dz++) {
          const isOuterWall = dx === 0 || dx === width - 1 || dz === 0 || dz === length - 1;
          const isEntrance = dz === 0 && (dx >= 5 && dx <= 8) && dy <= 3;

          if (isEntrance) {
            chunk.setBlock(templeX + dx, baseY + dy, templeZ + dz, BlockType.AIR);
          } else if (isOuterWall) {
            chunk.setBlock(templeX + dx, baseY + dy, templeZ + dz, BlockType.SANDSTONE);
          } else {
            // Interior temple air
            chunk.setBlock(templeX + dx, baseY + dy, templeZ + dz, BlockType.AIR);
          }
        }
      }
    }

    // 3. Twin Front Towers (Left: dx 0..3, dz 0..3; Right: dx 10..13, dz 0..3)
    const towerRanges = [
      { minX: 0, maxX: 3, minZ: 0, maxZ: 3 },
      { minX: width - 4, maxX: width - 1, minZ: 0, maxZ: 3 },
    ];

    for (const t of towerRanges) {
      for (let dy = 1; dy <= 8; dy++) {
        for (let dx = t.minX; dx <= t.maxX; dx++) {
          for (let dz = t.minZ; dz <= t.maxZ; dz++) {
            const isBorder = dx === t.minX || dx === t.maxX || dz === t.minZ || dz === t.maxZ;

            if (dy === 8) {
              // Crenellation battlements at top
              if ((dx + dz) % 2 === 0) {
                chunk.setBlock(templeX + dx, baseY + dy, templeZ + dz, BlockType.CHISELED_SANDSTONE);
              }
            } else if (isBorder) {
              // Decorative terracotta & chiseled sandstone face on front
              if (dz === 0 && (dy === 4 || dy === 5) && (dx === t.minX + 1 || dx === t.minX + 2)) {
                chunk.setBlock(templeX + dx, baseY + dy, templeZ + dz, BlockType.TERRACOTTA);
              } else if (dz === 0 && dy === 3 && (dx === t.minX + 1 || dx === t.minX + 2)) {
                chunk.setBlock(templeX + dx, baseY + dy, templeZ + dz, BlockType.CHISELED_SANDSTONE);
              } else {
                chunk.setBlock(templeX + dx, baseY + dy, templeZ + dz, BlockType.SANDSTONE);
              }
            } else {
              chunk.setBlock(templeX + dx, baseY + dy, templeZ + dz, BlockType.AIR);
            }
          }
        }
      }
    }

    // 4. Stepped Pyramid Roof over Main Hall
    for (let dx = 2; dx <= width - 3; dx++) {
      for (let dz = 2; dz <= length - 3; dz++) {
        chunk.setBlock(templeX + dx, baseY + 6, templeZ + dz, BlockType.SANDSTONE);
      }
    }
    for (let dx = 4; dx <= width - 5; dx++) {
      for (let dz = 4; dz <= length - 5; dz++) {
        chunk.setBlock(templeX + dx, baseY + 7, templeZ + dz, BlockType.SANDSTONE);
      }
    }

    // 5. Interior Floor Mosaic at baseY (Blue/Orange Terracotta Center Marker)
    const midX = templeX + Math.floor(width / 2);
    const midZ = templeZ + Math.floor(length / 2);

    chunk.setBlock(midX, baseY, midZ, BlockType.TERRACOTTA);
    chunk.setBlock(midX - 1, baseY, midZ, BlockType.RED_SAND);
    chunk.setBlock(midX + 1, baseY, midZ, BlockType.RED_SAND);
    chunk.setBlock(midX, baseY, midZ - 1, BlockType.RED_SAND);
    chunk.setBlock(midX, baseY, midZ + 1, BlockType.RED_SAND);

    // Torches in Hall for atmospheric desert glow
    chunk.setBlock(templeX + 4, baseY + 2, templeZ + 4, BlockType.TORCH);
    chunk.setBlock(templeX + width - 5, baseY + 2, templeZ + 4, BlockType.TORCH);
    chunk.setBlock(templeX + 4, baseY + 2, templeZ + length - 4, BlockType.TORCH);
    chunk.setBlock(templeX + width - 5, baseY + 2, templeZ + length - 4, BlockType.TORCH);

    // 6. Secret Underground Treasure Vault (Directly beneath center floor)
    const vaultY = baseY - 4;
    for (let dy = 0; dy <= 3; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          const vx = midX + dx;
          const vy = vaultY + dy;
          const vz = midZ + dz;
          if (dy === 0) {
            // Vault floor
            chunk.setBlock(vx, vy, vz, BlockType.SANDSTONE);
          } else {
            // Hollow vault air
            chunk.setBlock(vx, vy, vz, BlockType.AIR);
          }
        }
      }
    }

    // TNT Trap at center of vault floor!
    chunk.setBlock(midX, vaultY, midZ, BlockType.TNT);

    // 4 Treasure Chests in the 4 corners of the vault!
    chunk.setBlock(midX - 2, vaultY + 1, midZ - 2, BlockType.CHEST);
    chunk.setBlock(midX + 2, vaultY + 1, midZ - 2, BlockType.CHEST);
    chunk.setBlock(midX - 2, vaultY + 1, midZ + 2, BlockType.CHEST);
    chunk.setBlock(midX + 2, vaultY + 1, midZ + 2, BlockType.CHEST);
  }

  // Decorate chunk with trees, flowers, cacti, kelp, and natural vegetation
  private decorateChunk(chunk: Chunk) {
    const startX = chunk.cx * CHUNK_SIZE_X;
    const startZ = chunk.cz * CHUNK_SIZE_Z;

    const placedTreeLocations: { lx: number; lz: number }[] = [];
    const canSpawnTree = (lx: number, lz: number, surfaceY: number, minSpacing: number = 4): boolean => {
      if (surfaceY + 8 >= Y_MAX) return false;
      // Ensure column above is completely open air (no floating or stacked trees)
      if (chunk.getBlock(lx, surfaceY + 1, lz) !== BlockType.AIR) return false;
      if (chunk.getBlock(lx, surfaceY + 2, lz) !== BlockType.AIR) return false;
      if (chunk.getBlock(lx, surfaceY + 3, lz) !== BlockType.AIR) return false;

      // Ensure minimum distance from any previously grown tree in this chunk
      for (const t of placedTreeLocations) {
        if (Math.hypot(t.lx - lx, t.lz - lz) < minSpacing) {
          return false;
        }
      }
      placedTreeLocations.push({ lx, lz });
      return true;
    };

    for (let lx = 1; lx < CHUNK_SIZE_X - 1; lx++) {
      for (let lz = 1; lz < CHUNK_SIZE_Z - 1; lz++) {
        const wx = startX + lx;
        const wz = startZ + lz;

        // Skip cabin area at spawn
        if (Math.abs(wx) < 14 && Math.abs(wz) < 14) continue;

        let surfaceY = -1;
        for (let y = Y_MAX - 5; y >= Y_MIN + 10; y--) {
          const b = chunk.getBlock(lx, y, lz);
          if (b !== BlockType.AIR && b !== BlockType.WATER) {
            surfaceY = y;
            break;
          }
        }

        if (surfaceY < Y_MIN + 10) continue;

        const surfaceBlock = chunk.getBlock(lx, surfaceY, lz);
        const biome = this.getBiome(wx, wz);
        const rand = Math.abs(Math.sin(wx * 53.7 + wz * 91.3 + this.seed) * 10000) % 1;

        // 1. DESERT & BADLANDS BIOME: Cactus & Desert Shrubs
        if ((biome === 'desert' || biome.includes('badlands')) && (surfaceBlock === BlockType.SAND || surfaceBlock === BlockType.RED_SAND || surfaceBlock === BlockType.TERRACOTTA) && surfaceY >= SEA_LEVEL) {
          if (biome === 'desert' && rand < 0.022 && surfaceY + 4 < Y_MAX) {
            const cactusHeight = rand > 0.010 ? 3 : 2;
            for (let cy = 1; cy <= cactusHeight; cy++) {
              chunk.setBlock(lx, surfaceY + cy, lz, BlockType.CACTUS);
            }
          } else if (rand < 0.065) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.DEAD_BUSH);
          }
        }

        // 2. OCEAN BIOMES: Corals, Sea Pickles, and Kelp
        else if (biome.includes('ocean') && surfaceBlock === BlockType.SAND && surfaceY < SEA_LEVEL - 2) {
          if (biome === 'warm_ocean') {
            if (rand < 0.04) {
              chunk.setBlock(lx, surfaceY + 1, lz, BlockType.CORAL_BLOCK);
            } else if (rand < 0.08) {
              chunk.setBlock(lx, surfaceY + 1, lz, BlockType.SEA_PICKLE);
            } else if (rand < 0.12) {
              const kelpHeight = 3 + (Math.floor(rand * 100) % 6);
              const maxKelpY = Math.min(SEA_LEVEL - 1, surfaceY + kelpHeight);
              for (let ky = surfaceY + 1; ky <= maxKelpY; ky++) {
                chunk.setBlock(lx, ky, lz, BlockType.KELP);
              }
            }
          } else {
            // Standard / Deep Oceans: Kelp
            if (rand < 0.06) {
              const kelpHeight = 4 + (Math.floor(rand * 100) % 10);
              const maxKelpY = Math.min(SEA_LEVEL - 1, surfaceY + kelpHeight);
              for (let ky = surfaceY + 1; ky <= maxKelpY; ky++) {
                chunk.setBlock(lx, ky, lz, BlockType.KELP);
              }
            }
          }
        }

        // 3. JUNGLE BIOMES: Mega & Standard Jungle Trees, Bushes, Ferns, and Tall Grass
        else if ((biome === 'jungle' || biome === 'sparse_jungle') && surfaceBlock === BlockType.GRASS && surfaceY >= SEA_LEVEL) {
          const isSparse = biome === 'sparse_jungle';
          if (!isSparse && rand < 0.012 && lx < CHUNK_SIZE_X - 3 && lz < CHUNK_SIZE_Z - 3) {
            if (canSpawnTree(lx, lz, surfaceY, 5)) {
              this.growJungleTree(wx, surfaceY + 1, wz, chunk, true);
            }
          } else if (rand < (isSparse ? 0.02 : 0.045)) {
            if (canSpawnTree(lx, lz, surfaceY, 4)) {
              this.growJungleTree(wx, surfaceY + 1, wz, chunk, false);
            }
          } else if (rand < 0.12) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.FERN);
          } else if (rand < 0.22) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.TALL_GRASS);
          } else if (rand < 0.32) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.MEDIUM_GRASS);
          } else if (rand < 0.38) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.POPPY);
          }
        }

        // 4. SUNFLOWER PLAINS: Abundant golden sunflowers & medium/short grass
        else if (biome === 'sunflower_plains' && surfaceBlock === BlockType.GRASS && surfaceY >= SEA_LEVEL) {
          if (rand < 0.08) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.SUNFLOWER);
          } else if (rand < 0.01) {
            if (canSpawnTree(lx, lz, surfaceY, 4)) {
              this.growTree(wx, surfaceY + 1, wz, chunk);
            }
          } else if (rand < 0.18) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.MEDIUM_GRASS);
          } else if (rand < 0.28) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.SHORT_GRASS);
          }
        }

        // 5. FLOWER FOREST: Dense sea of varied flowers & layered grasses
        else if (biome === 'flower_forest' && surfaceBlock === BlockType.GRASS && surfaceY >= SEA_LEVEL) {
          if (rand < 0.14) {
            const flower = rand < 0.035 ? BlockType.TULIP :
                           rand < 0.070 ? BlockType.CORNFLOWER :
                           rand < 0.105 ? BlockType.POPPY : BlockType.DANDELION;
            chunk.setBlock(lx, surfaceY + 1, lz, flower);
          } else if (rand < 0.04) {
            if (canSpawnTree(lx, lz, surfaceY, 4)) {
              if (rand < 0.02) {
                this.growBirchTree(wx, surfaceY + 1, wz, chunk, false);
              } else {
                this.growTree(wx, surfaceY + 1, wz, chunk);
              }
            }
          } else if (rand < 0.16) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.MEDIUM_GRASS);
          } else if (rand < 0.26) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.SHORT_GRASS);
          }
        }

        // 6. CHERRY GROVE: Cherry blossom trees, tulips & gentle grass
        else if (biome === 'cherry_grove' && surfaceBlock === BlockType.GRASS && surfaceY >= SEA_LEVEL) {
          if (rand < 0.035) {
            if (canSpawnTree(lx, lz, surfaceY, 4)) {
              this.growCherryTree(wx, surfaceY + 1, wz, chunk);
            }
          } else if (rand < 0.08) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.TULIP);
          } else if (rand < 0.20) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.SHORT_GRASS);
          } else if (rand < 0.30) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.MEDIUM_GRASS);
          }
        }

        // 7. MEADOW: Flowery alpine plateau with medium & tall grass
        else if (biome === 'meadow' && surfaceBlock === BlockType.GRASS && surfaceY >= SEA_LEVEL) {
          if (rand < 0.08) {
            const flower = rand < 0.04 ? BlockType.CORNFLOWER : BlockType.DANDELION;
            chunk.setBlock(lx, surfaceY + 1, lz, flower);
          } else if (rand < 0.008) {
            if (canSpawnTree(lx, lz, surfaceY, 4)) {
              this.growCherryTree(wx, surfaceY + 1, wz, chunk);
            }
          } else if (rand < 0.22) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.MEDIUM_GRASS);
          } else if (rand < 0.34) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.SHORT_GRASS);
          } else if (rand < 0.42) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.TALL_GRASS);
          }
        }

        // 8. DARK FOREST: Dense Dark Oak trees, giant mushrooms & dark ferns
        else if (biome === 'dark_forest' && surfaceBlock === BlockType.GRASS && surfaceY >= SEA_LEVEL) {
          if (rand < 0.06 && lx < CHUNK_SIZE_X - 2 && lz < CHUNK_SIZE_Z - 2) {
            if (canSpawnTree(lx, lz, surfaceY, 4)) {
              this.growDarkOakTree(wx, surfaceY + 1, wz, chunk);
            }
          } else if (rand < 0.015) {
            if (canSpawnTree(lx, lz, surfaceY, 4)) {
              this.growGiantMushroom(wx, surfaceY + 1, wz, chunk, rand < 0.008);
            }
          } else if (rand < 0.06) {
            chunk.setBlock(lx, surfaceY + 1, lz, rand < 0.03 ? BlockType.RED_MUSHROOM : BlockType.BROWN_MUSHROOM);
          } else if (rand < 0.16) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.FERN);
          } else if (rand < 0.26) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.SHORT_GRASS);
          }
        }

        // 9. BIRCH FORESTS: Birch trees & lush mixed grass
        else if ((biome === 'birch_forest' || biome === 'old_growth_birch_forest') && surfaceBlock === BlockType.GRASS && surfaceY >= SEA_LEVEL) {
          const isOld = biome === 'old_growth_birch_forest';
          if (rand < 0.07) {
            if (canSpawnTree(lx, lz, surfaceY, 4)) {
              this.growBirchTree(wx, surfaceY + 1, wz, chunk, isOld);
            }
          } else if (rand < 0.04) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.POPPY);
          } else if (rand < 0.18) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.MEDIUM_GRASS);
          } else if (rand < 0.30) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.SHORT_GRASS);
          }
        }

        // 10. TAIGA BIOMES: Spruce conifer trees, ferns & short coniferous grass
        else if ((biome === 'taiga' || biome === 'snowy_taiga' || biome === 'grove') && surfaceY >= SEA_LEVEL) {
          if (rand < 0.06) {
            if (canSpawnTree(lx, lz, surfaceY, 4)) {
              this.growSpruceTree(wx, surfaceY + 1, wz, chunk, false);
            }
          } else if (biome === 'snowy_taiga' || biome === 'grove') {
            if (rand < 0.28) {
              chunk.setBlock(lx, surfaceY + 1, lz, BlockType.FROSTED_GRASS);
            }
          } else if (rand < 0.12) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.FERN);
          } else if (rand < 0.22) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.SHORT_GRASS);
          } else if (rand < 0.28) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.MEDIUM_GRASS);
          }
        }

        // 11. OLD GROWTH TAIGA: Tall pine and spruce giants with podzol & ferns
        else if ((biome === 'old_growth_pine_taiga' || biome === 'old_growth_spruce_taiga') && surfaceY >= SEA_LEVEL) {
          if (rand < 0.06) {
            if (canSpawnTree(lx, lz, surfaceY, 4)) {
              this.growSpruceTree(wx, surfaceY + 1, wz, chunk, true);
            }
          } else if (rand < 0.04) {
            chunk.setBlock(lx, surfaceY + 1, lz, rand < 0.02 ? BlockType.BROWN_MUSHROOM : BlockType.RED_MUSHROOM);
          } else if (rand < 0.16) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.FERN);
          } else if (rand < 0.26) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.SHORT_GRASS);
          }
        }

        // 12. SAVANNA BIOMES: Abundant Tall Grass (hierba alta) & Acacia trees
        else if ((biome === 'savanna' || biome === 'savanna_plateau' || biome === 'windswept_savanna') && surfaceBlock === BlockType.GRASS && surfaceY >= SEA_LEVEL) {
          if (rand < 0.02) {
            if (canSpawnTree(lx, lz, surfaceY, 4)) {
              this.growAcaciaTree(wx, surfaceY + 1, wz, chunk);
            }
          } else if (rand < 0.22) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.TALL_GRASS); // Savanna characteristic tall grass!
          } else if (rand < 0.36) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.MEDIUM_GRASS);
          } else if (rand < 0.44) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.SHORT_GRASS);
          }
        }

        // 13. MANGROVE SWAMP: Mangrove trees with roots, mud, lily pads & ferns
        else if (biome === 'mangrove_swamp' && surfaceY >= SEA_LEVEL - 1) {
          if (rand < 0.05) {
            if (canSpawnTree(lx, lz, surfaceY, 4)) {
              this.growMangroveTree(wx, surfaceY + 1, wz, chunk);
            }
          } else if (rand < 0.06 && surfaceY === SEA_LEVEL) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.LILY_PAD);
          } else if (rand < 0.16) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.FERN);
          } else if (rand < 0.26) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.TALL_GRASS);
          }
        }

        // 14. SWAMP: Oak trees, lily pads, ferns & swamp grasses
        else if (biome === 'swamp' && surfaceY >= SEA_LEVEL - 1) {
          if (rand < 0.025) {
            if (canSpawnTree(lx, lz, surfaceY, 4)) {
              this.growTree(wx, surfaceY + 1, wz, chunk);
            }
          } else if (rand < 0.06 && surfaceY === SEA_LEVEL) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.LILY_PAD);
          } else if (rand < 0.04) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.BROWN_MUSHROOM);
          } else if (rand < 0.16) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.TALL_GRASS);
          } else if (rand < 0.28) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.SHORT_GRASS);
          }
        }

        // 15. MUSHROOM FIELDS: Giant Red and Brown Mushrooms on Mycelium
        else if (biome === 'mushroom_fields' && surfaceBlock === BlockType.MYCELIUM && surfaceY >= SEA_LEVEL) {
          if (rand < 0.03) {
            this.growGiantMushroom(wx, surfaceY + 1, wz, chunk, rand < 0.015);
          } else if (rand < 0.08) {
            chunk.setBlock(lx, surfaceY + 1, lz, rand < 0.04 ? BlockType.RED_MUSHROOM : BlockType.BROWN_MUSHROOM);
          }
        }

        // 16. SNOWY BIOMES & ICE SPIKES: Giant ice pillars & frosted snowy grass
        else if ((biome === 'snowy_plains' || biome === 'snowy_slopes' || biome === 'frozen_peaks' || biome === 'ice_spikes') && surfaceY >= SEA_LEVEL) {
          if (biome === 'ice_spikes' && rand < 0.025) {
            this.growIceSpike(wx, surfaceY + 1, wz, chunk);
          } else if (rand < 0.28) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.FROSTED_GRASS);
          }
        }

        // 17. RIVERS: Lily pads on calm water surface & sugar cane on riverbanks
        else if (biome === 'river' || biome === 'frozen_river') {
          if (biome === 'river' && chunk.getBlock(lx, SEA_LEVEL, lz) === BlockType.WATER && chunk.getBlock(lx, SEA_LEVEL + 1, lz) === BlockType.AIR) {
            if (rand < 0.05) {
              chunk.setBlock(lx, SEA_LEVEL + 1, lz, BlockType.LILY_PAD);
            }
          } else if (surfaceY >= SEA_LEVEL && (surfaceBlock === BlockType.SAND || surfaceBlock === BlockType.DIRT || surfaceBlock === BlockType.GRASS)) {
            if (rand < 0.09) {
              const caneH = 2 + (Math.floor(rand * 100) % 2);
              for (let cy = 1; cy <= caneH; cy++) {
                chunk.setBlock(lx, surfaceY + cy, lz, BlockType.SUGAR_CANE);
              }
            } else if (rand < 0.22) {
              chunk.setBlock(lx, surfaceY + 1, lz, BlockType.SHORT_GRASS);
            }
          }
        }

        // 18. PLAINS, FORESTS & WINDSWEPT HILLS: Oak trees, flowers & balanced Short, Medium, Tall Grasses
        else if (surfaceBlock === BlockType.GRASS && surfaceY >= SEA_LEVEL) {
          const isForest = biome === 'forest' || biome === 'windswept_forest';
          const treeChance = isForest ? 0.07 : 0.012;
          if (rand < treeChance && surfaceY + 6 < Y_MAX) {
            this.growTree(wx, surfaceY + 1, wz, chunk);
          } else if (rand < 0.06) {
            const isDandelion = rand > 0.035;
            chunk.setBlock(lx, surfaceY + 1, lz, isDandelion ? BlockType.DANDELION : BlockType.POPPY);
          } else if (rand < 0.20) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.MEDIUM_GRASS);
          } else if (rand < 0.34) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.SHORT_GRASS);
          } else if (rand < 0.44) {
            chunk.setBlock(lx, surfaceY + 1, lz, BlockType.TALL_GRASS);
          }
        }
      }
    }
  }

  // Grow a Jungle Tree with tropical trunk, expansive foliage umbrellas, and hanging vines
  public growJungleTree(wx: number, baseY: number, wz: number, targetChunk?: Chunk, isMega: boolean = false) {
    if (isMega) {
      // 2x2 Trunk Mega Jungle Tree (12-16 blocks tall)
      const trunkHeight = 12 + Math.floor(Math.random() * 5);
      for (let y = 0; y < trunkHeight; y++) {
        for (let dx = 0; dx <= 1; dx++) {
          for (let dz = 0; dz <= 1; dz++) {
            this.setBlockInChunkOrWorld(wx + dx, baseY + y, wz + dz, BlockType.JUNGLE_WOOD, targetChunk);
          }
        }
      }

      const topY = baseY + trunkHeight;
      // Massive layered foliage umbrella
      // Layer 1: Wide 7x7 disc
      for (let dx = -3; dx <= 4; dx++) {
        for (let dz = -3; dz <= 4; dz++) {
          if (Math.abs(dx - 0.5) + Math.abs(dz - 0.5) <= 4.8) {
            this.setBlockInChunkOrWorld(wx + dx, topY - 2, wz + dz, BlockType.JUNGLE_LEAVES, targetChunk);
          }
        }
      }
      // Layer 2: 7x7 disc
      for (let dx = -3; dx <= 4; dx++) {
        for (let dz = -3; dz <= 4; dz++) {
          if (Math.abs(dx - 0.5) + Math.abs(dz - 0.5) <= 4.2) {
            this.setBlockInChunkOrWorld(wx + dx, topY - 1, wz + dz, BlockType.JUNGLE_LEAVES, targetChunk);
          }
        }
      }
      // Layer 3: 5x5 disc
      for (let dx = -2; dx <= 3; dx++) {
        for (let dz = -2; dz <= 3; dz++) {
          if (Math.abs(dx - 0.5) + Math.abs(dz - 0.5) <= 3.2) {
            this.setBlockInChunkOrWorld(wx + dx, topY, wz + dz, BlockType.JUNGLE_LEAVES, targetChunk);
          }
        }
      }
      // Layer 4: 3x3 crown
      for (let dx = -1; dx <= 2; dx++) {
        for (let dz = -1; dz <= 2; dz++) {
          this.setBlockInChunkOrWorld(wx + dx, topY + 1, wz + dz, BlockType.JUNGLE_LEAVES, targetChunk);
        }
      }

      // Hanging jungle vines cascading down 4-7 blocks
      const vineCoords = [
        [-3, 0], [4, 0], [0, -3], [0, 4],
        [-2, -2], [3, -2], [-2, 3], [3, 3]
      ];
      for (const [vx, vz] of vineCoords) {
        const vineLen = 3 + Math.floor(Math.random() * 4);
        for (let vy = 0; vy < vineLen; vy++) {
          this.setBlockInChunkOrWorld(wx + vx, topY - 3 - vy, wz + vz, BlockType.JUNGLE_LEAVES, targetChunk);
        }
      }
    } else {
      // Standard 1x1 Jungle Tree (7-10 blocks tall)
      const trunkHeight = 7 + Math.floor(Math.random() * 4);
      for (let y = 0; y < trunkHeight; y++) {
        this.setBlockInChunkOrWorld(wx, baseY + y, wz, BlockType.JUNGLE_WOOD, targetChunk);
      }

      const topY = baseY + trunkHeight;
      // 5x5 Canopy
      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
          this.setBlockInChunkOrWorld(wx + dx, topY - 1, wz + dz, BlockType.JUNGLE_LEAVES, targetChunk);
        }
      }
      // 3x3 Top
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          this.setBlockInChunkOrWorld(wx + dx, topY, wz + dz, BlockType.JUNGLE_LEAVES, targetChunk);
        }
      }
      // Hanging vines
      for (let dy = 1; dy <= 3; dy++) {
        this.setBlockInChunkOrWorld(wx - 2, topY - 1 - dy, wz, BlockType.JUNGLE_LEAVES, targetChunk);
        this.setBlockInChunkOrWorld(wx + 2, topY - 1 - dy, wz, BlockType.JUNGLE_LEAVES, targetChunk);
      }
    }
  }

  // Grow an oak tree with trunk & foliage canopy
  public growTree(wx: number, baseY: number, wz: number, targetChunk?: Chunk) {
    const trunkHeight = 4 + Math.floor(Math.random() * 2);

    // Trunk
    for (let y = 0; y < trunkHeight; y++) {
      if (targetChunk) {
        const { lx, lz } = this.worldToChunkCoords(wx, wz);
        targetChunk.setBlock(lx, baseY + y, lz, BlockType.WOOD);
      } else {
        this.setBlock(wx, baseY + y, wz, BlockType.WOOD, false);
      }
    }

    // Leaves Canopy
    const leafBaseY = baseY + trunkHeight - 2;
    for (let dy = 0; dy <= 2; dy++) {
      const radius = dy === 2 ? 1 : 2;
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (dx === 0 && dz === 0 && dy < 2) continue;
          if (Math.abs(dx) === radius && Math.abs(dz) === radius && dy === 2) continue;

          const lx = wx + dx;
          const lz = wz + dz;
          const ly = leafBaseY + dy;

          if (targetChunk) {
            const coords = this.worldToChunkCoords(lx, lz);
            if (coords.cx === targetChunk.cx && coords.cz === targetChunk.cz) {
              if (targetChunk.getBlock(coords.lx, ly, coords.lz) === BlockType.AIR) {
                targetChunk.setBlock(coords.lx, ly, coords.lz, BlockType.LEAVES);
              }
            }
          } else {
            if (this.getBlock(lx, ly, lz) === BlockType.AIR) {
              this.setBlock(lx, ly, lz, BlockType.LEAVES, false);
            }
          }
        }
      }
    }
  }

  // Grow a Spruce (Taiga) Conifer Tree with conical needle canopy
  public growSpruceTree(wx: number, baseY: number, wz: number, targetChunk?: Chunk, isTall: boolean = false) {
    const trunkHeight = isTall ? (9 + Math.floor(Math.random() * 5)) : (5 + Math.floor(Math.random() * 3));
    for (let y = 0; y < trunkHeight; y++) {
      this.setBlockInChunkOrWorld(wx, baseY + y, wz, BlockType.SPRUCE_WOOD, targetChunk);
    }
    const topY = baseY + trunkHeight;
    this.setBlockInChunkOrWorld(wx, topY, wz, BlockType.SPRUCE_LEAVES, targetChunk);
    this.setBlockInChunkOrWorld(wx, topY + 1, wz, BlockType.SPRUCE_LEAVES, targetChunk);
    for (let r = 1; r <= 3; r++) {
      const ly = topY - r * 2;
      const radius = r === 1 ? 1 : 2;
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (Math.abs(dx) + Math.abs(dz) <= radius + 1) {
            this.setBlockInChunkOrWorld(wx + dx, ly, wz + dz, BlockType.SPRUCE_LEAVES, targetChunk);
          }
        }
      }
    }
  }

  // Grow a Birch Tree with white bark and light green foliage
  public growBirchTree(wx: number, baseY: number, wz: number, targetChunk?: Chunk, isTall: boolean = false) {
    const trunkHeight = isTall ? (8 + Math.floor(Math.random() * 4)) : (5 + Math.floor(Math.random() * 2));
    for (let y = 0; y < trunkHeight; y++) {
      this.setBlockInChunkOrWorld(wx, baseY + y, wz, BlockType.BIRCH_WOOD, targetChunk);
    }
    const topY = baseY + trunkHeight;
    for (let dy = -2; dy <= 1; dy++) {
      const radius = dy <= -1 ? 2 : 1;
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (Math.abs(dx) === radius && Math.abs(dz) === radius && (dy === 1 || Math.random() > 0.4)) continue;
          this.setBlockInChunkOrWorld(wx + dx, topY + dy, wz + dz, BlockType.BIRCH_LEAVES, targetChunk);
        }
      }
    }
  }

  // Grow a Dark Oak Tree with thick 2x2 trunk and broad dark canopy
  public growDarkOakTree(wx: number, baseY: number, wz: number, targetChunk?: Chunk) {
    const trunkHeight = 6 + Math.floor(Math.random() * 2);
    for (let y = 0; y < trunkHeight; y++) {
      for (let dx = 0; dx <= 1; dx++) {
        for (let dz = 0; dz <= 1; dz++) {
          this.setBlockInChunkOrWorld(wx + dx, baseY + y, wz + dz, BlockType.DARK_OAK_WOOD, targetChunk);
        }
      }
    }
    const topY = baseY + trunkHeight;
    for (let dx = -2; dx <= 3; dx++) {
      for (let dz = -2; dz <= 3; dz++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (Math.abs(dx - 0.5) + Math.abs(dz - 0.5) <= 3.3) {
            this.setBlockInChunkOrWorld(wx + dx, topY + dy, wz + dz, BlockType.DARK_OAK_LEAVES, targetChunk);
          }
        }
      }
    }
  }

  // Grow an Acacia Tree with angled trunk and flat umbrella canopy
  public growAcaciaTree(wx: number, baseY: number, wz: number, targetChunk?: Chunk) {
    const trunkHeight = 5 + Math.floor(Math.random() * 2);
    let curX = wx;
    let curZ = wz;
    for (let y = 0; y < trunkHeight; y++) {
      this.setBlockInChunkOrWorld(curX, baseY + y, curZ, BlockType.ACACIA_WOOD, targetChunk);
      if (y === 2) curX += 1;
      if (y === 4) curZ += 1;
    }
    const topY = baseY + trunkHeight;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        if (Math.abs(dx) + Math.abs(dz) <= 3) {
          this.setBlockInChunkOrWorld(curX + dx, topY, curZ + dz, BlockType.ACACIA_LEAVES, targetChunk);
        }
      }
    }
    this.setBlockInChunkOrWorld(curX, topY + 1, curZ, BlockType.ACACIA_LEAVES, targetChunk);
  }

  // Grow a Mangrove Tree with arching stilt roots and swamp canopy
  public growMangroveTree(wx: number, baseY: number, wz: number, targetChunk?: Chunk) {
    // Stilt roots
    for (let r = 0; r < 2; r++) {
      this.setBlockInChunkOrWorld(wx + 1, baseY + r, wz, BlockType.MANGROVE_ROOTS, targetChunk);
      this.setBlockInChunkOrWorld(wx - 1, baseY + r, wz, BlockType.MANGROVE_ROOTS, targetChunk);
      this.setBlockInChunkOrWorld(wx, baseY + r, wz + 1, BlockType.MANGROVE_ROOTS, targetChunk);
      this.setBlockInChunkOrWorld(wx, baseY + r, wz - 1, BlockType.MANGROVE_ROOTS, targetChunk);
    }
    const trunkHeight = 5 + Math.floor(Math.random() * 2);
    for (let y = 1; y < trunkHeight; y++) {
      this.setBlockInChunkOrWorld(wx, baseY + y, wz, BlockType.MANGROVE_WOOD, targetChunk);
    }
    const topY = baseY + trunkHeight;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (Math.abs(dx) + Math.abs(dz) <= 3) {
            this.setBlockInChunkOrWorld(wx + dx, topY + dy, wz + dz, BlockType.MANGROVE_LEAVES, targetChunk);
          }
        }
      }
    }
  }

  // Grow a Cherry Tree with curving dark trunk and pink blossom canopy
  public growCherryTree(wx: number, baseY: number, wz: number, targetChunk?: Chunk) {
    const trunkHeight = 5 + Math.floor(Math.random() * 2);
    for (let y = 0; y < trunkHeight; y++) {
      this.setBlockInChunkOrWorld(wx, baseY + y, wz, BlockType.CHERRY_WOOD, targetChunk);
    }
    const topY = baseY + trunkHeight;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (Math.abs(dx) === 2 && Math.abs(dz) === 2 && dy === 1) continue;
          this.setBlockInChunkOrWorld(wx + dx, topY + dy, wz + dz, BlockType.CHERRY_LEAVES, targetChunk);
        }
      }
    }
  }

  // Grow a Giant Mushroom (Red or Brown)
  public growGiantMushroom(wx: number, baseY: number, wz: number, targetChunk?: Chunk, isRed: boolean = true) {
    const height = 5 + Math.floor(Math.random() * 2);
    for (let y = 0; y < height; y++) {
      this.setBlockInChunkOrWorld(wx, baseY + y, wz, BlockType.MUSHROOM_STEM, targetChunk);
    }
    const topY = baseY + height;
    const blockType = isRed ? BlockType.MUSHROOM_BLOCK_RED : BlockType.MUSHROOM_BLOCK_BROWN;
    if (isRed) {
      // Curved dome
      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          this.setBlockInChunkOrWorld(wx + dx, topY, wz + dz, blockType, targetChunk);
          if (Math.abs(dx) === 2 || Math.abs(dz) === 2) {
            this.setBlockInChunkOrWorld(wx + dx, topY - 1, wz + dz, blockType, targetChunk);
          }
        }
      }
      this.setBlockInChunkOrWorld(wx, topY + 1, wz, blockType, targetChunk);
    } else {
      // Flat 5x5 plate
      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          this.setBlockInChunkOrWorld(wx + dx, topY, wz + dz, blockType, targetChunk);
        }
      }
    }
  }

  // Grow a towering Ice Spike
  public growIceSpike(wx: number, baseY: number, wz: number, targetChunk?: Chunk) {
    const height = 8 + Math.floor(Math.random() * 7);
    for (let y = 0; y < height; y++) {
      const radius = y < height / 2 ? 1 : 0;
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          const iceBlock = (y % 3 === 0) ? BlockType.BLUE_ICE : BlockType.PACKED_ICE;
          this.setBlockInChunkOrWorld(wx + dx, baseY + y, wz + dz, iceBlock, targetChunk);
        }
      }
    }
  }

  // Starter Structure: Abandoned Wooden Cabin / Outpost near spawn (8, Y, 8)
  public buildStarterCabin(chunk: Chunk) {
    const cabinX = 6;
    const cabinZ = 6;

    // Find average surface height in cabin area
    let baseY = 2;
    for (let y = 40; y >= SEA_LEVEL - 1; y--) {
      const b = chunk.getBlock(cabinX + 2, y, cabinZ + 2);
      if (b !== BlockType.AIR && b !== BlockType.WATER && BLOCK_CONFIGS[b]?.solid) {
        baseY = y;
        break;
      }
    }

    const width = 6;
    const length = 6;
    const height = 4;

    // 1. Cobblestone Foundation & Floor
    for (let dx = 0; dx < width; dx++) {
      for (let dz = 0; dz < length; dz++) {
        chunk.setBlock(cabinX + dx, baseY, cabinZ + dz, BlockType.COBBLESTONE);
      }
    }

    // 2. Corner Oak Wood Pillars & Walls
    for (let dy = 1; dy <= height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        for (let dz = 0; dz < length; dz++) {
          const isCorner = (dx === 0 || dx === width - 1) && (dz === 0 || dz === length - 1);
          const isWall = dx === 0 || dx === width - 1 || dz === 0 || dz === length - 1;
          const isDoorway = dx === 2 && dz === 0 && (dy === 1 || dy === 2);
          const isWindow = (dy === 2) && ((dx === 2 && dz === length - 1) || (dz === 2 && (dx === 0 || dx === width - 1)));

          if (isDoorway) {
            chunk.setBlock(cabinX + dx, baseY + dy, cabinZ + dz, BlockType.AIR);
          } else if (isWindow) {
            chunk.setBlock(cabinX + dx, baseY + dy, cabinZ + dz, BlockType.GLASS);
          } else if (isCorner) {
            chunk.setBlock(cabinX + dx, baseY + dy, cabinZ + dz, BlockType.WOOD);
          } else if (isWall) {
            chunk.setBlock(cabinX + dx, baseY + dy, cabinZ + dz, BlockType.PLANKS);
          } else {
            // Inside air
            chunk.setBlock(cabinX + dx, baseY + dy, cabinZ + dz, BlockType.AIR);
          }
        }
      }
    }

    // 3. Wooden Plank Roof
    for (let dx = 0; dx < width; dx++) {
      for (let dz = 0; dz < length; dz++) {
        chunk.setBlock(cabinX + dx, baseY + height + 1, cabinZ + dz, BlockType.PLANKS);
      }
    }

    // 4. Interior Furniture: Crafting Table, Bookshelf, Bed, and Torches
    chunk.setBlock(cabinX + 1, baseY + 1, cabinZ + length - 2, BlockType.CRAFTING_TABLE);
    chunk.setBlock(cabinX + 2, baseY + 1, cabinZ + length - 2, BlockType.BOOKSHELF);
    chunk.setBlock(cabinX + width - 2, baseY + 1, cabinZ + length - 2, BlockType.WOOL_RED);
    chunk.setBlock(cabinX + width - 2, baseY + 1, cabinZ + length - 3, BlockType.WOOL_WHITE);

    // Torches for cozy interior light
    chunk.setBlock(cabinX + 1, baseY + 2, cabinZ + 1, BlockType.TORCH);
    chunk.setBlock(cabinX + 1, baseY + 2, cabinZ + length - 2, BlockType.TORCH);
  }

  // Calculate authentic Minecraft face lighting by counting overhead blocking blocks (skylight occlusion)
  public getFaceLighting(
    wx: number, y: number, wz: number,
    faceDir: 'top' | 'bottom' | 'north' | 'south' | 'east' | 'west',
    baseColor: [number, number, number] = [1, 1, 1]
  ): [number, number, number] {
    // 1. Classic Minecraft directional face shading multiplier
    let faceShade = 1.0;
    if (faceDir === 'top') faceShade = 1.0;
    else if (faceDir === 'east' || faceDir === 'west') faceShade = 0.86;
    else if (faceDir === 'north' || faceDir === 'south') faceShade = 0.76;
    else if (faceDir === 'bottom') faceShade = 0.54;

    // 2. Skylight occlusion: count how many solid blocks are directly overhead blocking the sunlight
    let blockingBlocks = 0;
    const maxScanHeight = Math.min(Y_MAX, y + 16);
    for (let sy = y + 1; sy <= maxScanHeight; sy++) {
      const b = this.getBlock(wx, sy, wz);
      if (b !== BlockType.AIR && BLOCK_CONFIGS[b]?.solid && !BLOCK_CONFIGS[b]?.transparent) {
        blockingBlocks++;
        if (blockingBlocks >= 4) break;
      }
    }

    // Light level drops according to how many blocks cover the direct skylight
    let skyLight = 1.0;
    if (blockingBlocks === 1) skyLight = 0.68;
    else if (blockingBlocks === 2) skyLight = 0.48;
    else if (blockingBlocks === 3) skyLight = 0.32;
    else if (blockingBlocks >= 4) skyLight = 0.20;

    // Check nearby torches, lanterns, or lava for illumination
    let torchBoost = 0;
    const searchR = 2;
    for (let dx = -searchR; dx <= searchR && torchBoost === 0; dx += 2) {
      for (let dy = -searchR; dy <= searchR && torchBoost === 0; dy += 2) {
        for (let dz = -searchR; dz <= searchR && torchBoost === 0; dz += 2) {
          const nb = this.getBlock(wx + dx, y + dy, wz + dz);
          if (nb === BlockType.TORCH || nb === BlockType.LANTERN || nb === BlockType.FURNACE_LIT || nb === BlockType.LAVA) {
            torchBoost = 0.55;
          }
        }
      }
    }

    const effectiveLight = Math.min(1.0, skyLight + torchBoost);
    const totalFactor = faceShade * effectiveLight;
    return [
      baseColor[0] * totalFactor,
      baseColor[1] * totalFactor,
      baseColor[2] * totalFactor,
    ];
  }

  // Rebuild Three.js geometries for a chunk
  public rebuildChunkMesh(chunk: Chunk) {
    if (chunk.opaqueMesh) {
      this.scene.remove(chunk.opaqueMesh);
      chunk.opaqueMesh.geometry.dispose();
      chunk.opaqueMesh = null;
    }
    if (chunk.transparentMesh) {
      this.scene.remove(chunk.transparentMesh);
      chunk.transparentMesh.geometry.dispose();
      chunk.transparentMesh = null;
    }
    if (chunk.waterMesh) {
      this.scene.remove(chunk.waterMesh);
      chunk.waterMesh.geometry.dispose();
      chunk.waterMesh = null;
    }
    if (chunk.lavaMesh) {
      this.scene.remove(chunk.lavaMesh);
      chunk.lavaMesh.geometry.dispose();
      chunk.lavaMesh = null;
    }

    const opaquePositions: number[] = [];
    const opaqueNormals: number[] = [];
    const opaqueUVs: number[] = [];
    const opaqueColors: number[] = [];

    const transPositions: number[] = [];
    const transNormals: number[] = [];
    const transUVs: number[] = [];
    const transColors: number[] = [];

    const waterPositions: number[] = [];
    const waterNormals: number[] = [];
    const waterUVs: number[] = [];

    const lavaPositions: number[] = [];
    const lavaNormals: number[] = [];
    const lavaUVs: number[] = [];

    const startX = chunk.cx * CHUNK_SIZE_X;
    const startZ = chunk.cz * CHUNK_SIZE_Z;

    for (let lx = 0; lx < CHUNK_SIZE_X; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE_Z; lz++) {
        for (let y = chunk.minY; y <= chunk.maxY; y++) {
          const block = chunk.getBlock(lx, y, lz);
          if (block === BlockType.AIR) continue;

          const wx = startX + lx;
          const wz = startZ + lz;

          // Minecraft Sloped Fluids (Water & Lava)
          if (block === BlockType.WATER) {
            this.addFluidGeometry(wx, y, wz, BlockType.WATER, waterPositions, waterNormals, waterUVs);
            continue;
          }
          if (block === BlockType.LAVA) {
            this.addFluidGeometry(wx, y, wz, BlockType.LAVA, lavaPositions, lavaNormals, lavaUVs);
            continue;
          }

          const isTrans = BLOCK_CONFIGS[block].transparent;
          const posArr = isTrans ? transPositions : opaquePositions;
          const normArr = isTrans ? transNormals : opaqueNormals;
          const uvArr = isTrans ? transUVs : opaqueUVs;
          const colArr = isTrans ? transColors : opaqueColors;

          // Cross & special geometries
          const isUnderwaterPlant = block === BlockType.KELP || block === BlockType.SEA_PICKLE;
          if (isUnderwaterPlant) {
            // Render underwater plant flora in transparent layer
            this.addCrossGeometry(wx, y, wz, block, transPositions, transNormals, transUVs, transColors);
            // And render full submerged water cube around it so there is NO dry air pocket
            this.addFluidGeometry(wx, y, wz, BlockType.WATER, waterPositions, waterNormals, waterUVs);
            continue;
          }

          const isCrossPlant = (
            block === BlockType.POPPY ||
            block === BlockType.DANDELION ||
            block === BlockType.SUNFLOWER ||
            block === BlockType.CORNFLOWER ||
            block === BlockType.TULIP ||
            block === BlockType.SHORT_GRASS ||
            block === BlockType.MEDIUM_GRASS ||
            block === BlockType.TALL_GRASS ||
            block === BlockType.FERN ||
            block === BlockType.DEAD_BUSH ||
            block === BlockType.FROSTED_GRASS ||
            block === BlockType.RED_MUSHROOM ||
            block === BlockType.BROWN_MUSHROOM ||
            block === BlockType.SUGAR_CANE
          );

          if (isCrossPlant) {
            this.addCrossGeometry(wx, y, wz, block, posArr, normArr, uvArr, colArr);
            continue;
          } else if (block === BlockType.LILY_PAD) {
            this.addLilyPadGeometry(wx, y, wz, posArr, normArr, uvArr, colArr);
            continue;
          } else if (isDoor(block)) {
            this.addDoorGeometry(wx, y, wz, block, posArr, normArr, uvArr, colArr);
            continue;
          } else if (block === BlockType.TORCH) {
            this.addTorchGeometry(wx, y, wz, posArr, normArr, uvArr, colArr);
            continue;
          } else if (block === BlockType.LANTERN) {
            this.addLanternGeometry(wx, y, wz, posArr, normArr, uvArr, colArr);
            continue;
          } else if (block === BlockType.COPPER_WIRE || block === BlockType.COPPER_WIRE_ON) {
            this.addWireGeometry(wx, y, wz, block, posArr, normArr, uvArr, colArr);
            continue;
          } else if (block === BlockType.COPPER_SWITCH || block === BlockType.COPPER_SWITCH_ON) {
            this.addSwitchGeometry(wx, y, wz, block, posArr, normArr, uvArr, colArr);
            continue;
          }

          const biome = this.getBiome(wx, wz);
          const [cr, cg, cb] = getBiomeFoliageColor(biome);
          const [sr, sg, sb] = getBiomeSoilColor(biome);

          // Top face (+Y)
          const topNeighbor = this.getBlock(wx, y + 1, wz);
          if (this.shouldRenderFace(block, topNeighbor)) {
            const [u0, v0, u1, v1] = getBlockUVs(block, 'top');
            posArr.push(
              wx, y + 1, wz + 1,
              wx + 1, y + 1, wz + 1,
              wx + 1, y + 1, wz,
              wx, y + 1, wz + 1,
              wx + 1, y + 1, wz,
              wx, y + 1, wz
            );
            normArr.push(0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0);
            uvArr.push(
              u0, v0,  u1, v0,  u1, v1,
              u0, v0,  u1, v1,  u0, v1
            );
            if (colArr) {
              const baseTint: [number, number, number] = (block === BlockType.GRASS || block === BlockType.LEAVES)
                ? [cr, cg, cb]
                : (block === BlockType.DIRT || block === BlockType.COARSE_DIRT)
                ? [sr, sg, sb]
                : [1, 1, 1];
              const lit = this.getFaceLighting(wx, y + 1, wz, 'top', baseTint);
              for (let k = 0; k < 6; k++) colArr.push(lit[0], lit[1], lit[2]);
            }
          }

          // Bottom face (-Y)
          const bottomNeighbor = this.getBlock(wx, y - 1, wz);
          if (y > Y_MIN && this.shouldRenderFace(block, bottomNeighbor)) {
            const [u0, v0, u1, v1] = getBlockUVs(block, 'bottom');
            posArr.push(
              wx, y, wz,
              wx + 1, y, wz,
              wx + 1, y, wz + 1,
              wx, y, wz,
              wx + 1, y, wz + 1,
              wx, y, wz + 1
            );
            normArr.push(0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0);
            uvArr.push(
              u0, v1,  u1, v1,  u1, v0,
              u0, v1,  u1, v0,  u0, v0
            );
            if (colArr) {
              const baseTint: [number, number, number] = (block === BlockType.DIRT || block === BlockType.COARSE_DIRT || block === BlockType.GRASS)
                ? [sr, sg, sb]
                : [1, 1, 1];
              const lit = this.getFaceLighting(wx, y - 1, wz, 'bottom', baseTint);
              for (let k = 0; k < 6; k++) colArr.push(lit[0], lit[1], lit[2]);
            }
          }

          // North (+Z)
          const northNeighbor = this.getBlock(wx, y, wz + 1);
          if (this.shouldRenderFace(block, northNeighbor)) {
            const [u0, v0, u1, v1] = getBlockUVs(block, 'side');
            posArr.push(
              wx, y, wz + 1,
              wx + 1, y, wz + 1,
              wx + 1, y + 1, wz + 1,
              wx, y, wz + 1,
              wx + 1, y + 1, wz + 1,
              wx, y + 1, wz + 1
            );
            normArr.push(0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1);
            uvArr.push(
              u0, v0,  u1, v0,  u1, v1,
              u0, v0,  u1, v1,  u0, v1
            );
            if (colArr) {
              const baseTint: [number, number, number] = (block === BlockType.LEAVES)
                ? [cr, cg, cb]
                : (block === BlockType.DIRT || block === BlockType.COARSE_DIRT)
                ? [sr, sg, sb]
                : [1, 1, 1];
              const lit = this.getFaceLighting(wx, y, wz + 1, 'north', baseTint);
              for (let k = 0; k < 6; k++) colArr.push(lit[0], lit[1], lit[2]);
            }
          }

          // South (-Z)
          const southNeighbor = this.getBlock(wx, y, wz - 1);
          if (this.shouldRenderFace(block, southNeighbor)) {
            const [u0, v0, u1, v1] = getBlockUVs(block, 'side');
            posArr.push(
              wx + 1, y, wz,
              wx, y, wz,
              wx, y + 1, wz,
              wx + 1, y, wz,
              wx, y + 1, wz,
              wx + 1, y + 1, wz
            );
            normArr.push(0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1);
            uvArr.push(
              u0, v0,  u1, v0,  u1, v1,
              u0, v0,  u1, v1,  u0, v1
            );
            if (colArr) {
              const baseTint: [number, number, number] = (block === BlockType.LEAVES)
                ? [cr, cg, cb]
                : (block === BlockType.DIRT || block === BlockType.COARSE_DIRT)
                ? [sr, sg, sb]
                : [1, 1, 1];
              const lit = this.getFaceLighting(wx, y, wz - 1, 'south', baseTint);
              for (let k = 0; k < 6; k++) colArr.push(lit[0], lit[1], lit[2]);
            }
          }

          // East (+X)
          const eastNeighbor = this.getBlock(wx + 1, y, wz);
          if (this.shouldRenderFace(block, eastNeighbor)) {
            const [u0, v0, u1, v1] = getBlockUVs(block, 'side');
            posArr.push(
              wx + 1, y, wz + 1,
              wx + 1, y, wz,
              wx + 1, y + 1, wz,
              wx + 1, y, wz + 1,
              wx + 1, y + 1, wz,
              wx + 1, y + 1, wz + 1
            );
            normArr.push(1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0);
            uvArr.push(
              u0, v0,  u1, v0,  u1, v1,
              u0, v0,  u1, v1,  u0, v1
            );
            if (colArr) {
              const baseTint: [number, number, number] = (block === BlockType.LEAVES)
                ? [cr, cg, cb]
                : (block === BlockType.DIRT || block === BlockType.COARSE_DIRT)
                ? [sr, sg, sb]
                : [1, 1, 1];
              const lit = this.getFaceLighting(wx + 1, y, wz, 'east', baseTint);
              for (let k = 0; k < 6; k++) colArr.push(lit[0], lit[1], lit[2]);
            }
          }

          // West (-X)
          const westNeighbor = this.getBlock(wx - 1, y, wz);
          if (this.shouldRenderFace(block, westNeighbor)) {
            const [u0, v0, u1, v1] = getBlockUVs(block, 'side');
            posArr.push(
              wx, y, wz,
              wx, y, wz + 1,
              wx, y + 1, wz + 1,
              wx, y, wz,
              wx, y + 1, wz + 1,
              wx, y + 1, wz
            );
            normArr.push(-1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0);
            uvArr.push(
              u0, v0,  u1, v0,  u1, v1,
              u0, v0,  u1, v1,  u0, v1
            );
            if (colArr) {
              const baseTint: [number, number, number] = (block === BlockType.LEAVES)
                ? [cr, cg, cb]
                : (block === BlockType.DIRT || block === BlockType.COARSE_DIRT)
                ? [sr, sg, sb]
                : [1, 1, 1];
              const lit = this.getFaceLighting(wx - 1, y, wz, 'west', baseTint);
              for (let k = 0; k < 6; k++) colArr.push(lit[0], lit[1], lit[2]);
            }
          }
        }
      }
    }

    if (opaquePositions.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(opaquePositions, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(opaqueNormals, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(opaqueUVs, 2));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(opaqueColors, 3));
      geo.computeBoundingSphere();

      const mesh = new THREE.Mesh(geo, this.opaqueMaterial);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = true;
      mesh.userData = { isChunkMesh: true, chunkKey: this.getChunkKey(chunk.cx, chunk.cz) };
      this.scene.add(mesh);
      chunk.opaqueMesh = mesh;
    }

    if (transPositions.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(transPositions, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(transNormals, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(transUVs, 2));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(transColors, 3));
      geo.computeBoundingSphere();

      const mesh = new THREE.Mesh(geo, this.transparentMaterial);
      mesh.receiveShadow = true;
      mesh.frustumCulled = true;
      mesh.userData = { isChunkMesh: true, chunkKey: this.getChunkKey(chunk.cx, chunk.cz) };
      this.scene.add(mesh);
      chunk.transparentMesh = mesh;
    }

    if (waterPositions.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(waterPositions, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(waterNormals, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(waterUVs, 2));
      geo.computeBoundingSphere();

      const mesh = new THREE.Mesh(geo, this.waterMaterial);
      mesh.receiveShadow = true;
      mesh.frustumCulled = true;
      mesh.userData = { isChunkMesh: true, chunkKey: this.getChunkKey(chunk.cx, chunk.cz) };
      this.scene.add(mesh);
      chunk.waterMesh = mesh;
    }

    if (lavaPositions.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(lavaPositions, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(lavaNormals, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(lavaUVs, 2));
      geo.computeBoundingSphere();

      const mesh = new THREE.Mesh(geo, this.lavaMaterial);
      mesh.receiveShadow = true;
      mesh.frustumCulled = true;
      mesh.userData = { isChunkMesh: true, chunkKey: this.getChunkKey(chunk.cx, chunk.cz) };
      this.scene.add(mesh);
      chunk.lavaMesh = mesh;
    }

    chunk.isDirty = false;
    chunk.isMeshed = true;
  }

  // Full-block fluid geometry builder (Water & Lava occupy full 1.0 height block volumes)
  private addFluidGeometry(
    wx: number, y: number, wz: number, fluidType: BlockType,
    posArr: number[], normArr: number[], uvArr: number[]
  ) {
    const isWater = fluidType === BlockType.WATER;
    const isWaterLike = (b: BlockType) =>
      isWater
        ? (b === BlockType.WATER || b === BlockType.KELP || b === BlockType.SEA_PICKLE)
        : (b === fluidType);

    const [u0, v0, u1, v1] = getBlockUVs(fluidType, 'top');
    const [su0, sv0, su1, sv1] = getBlockUVs(fluidType, 'side');

    // 1. TOP FACE (+Y): Render unless submerged under same fluid/waterlogged plant
    const topNeighbor = this.getBlock(wx, y + 1, wz);
    if (!isWaterLike(topNeighbor)) {
      posArr.push(
        wx, y + 1, wz + 1,
        wx + 1, y + 1, wz + 1,
        wx + 1, y + 1, wz,

        wx, y + 1, wz + 1,
        wx + 1, y + 1, wz,
        wx, y + 1, wz
      );
      for (let k = 0; k < 6; k++) {
        normArr.push(0, 1, 0);
      }
      uvArr.push(
        u0, v0,  u1, v0,  u1, v1,
        u0, v0,  u1, v1,  u0, v1
      );
    }

    // 2. BOTTOM FACE (-Y): Render if block below is open air or transparent non-fluid
    const bottomNeighbor = this.getBlock(wx, y - 1, wz);
    if (y > Y_MIN && !isWaterLike(bottomNeighbor) && (bottomNeighbor === BlockType.AIR || BLOCK_CONFIGS[bottomNeighbor]?.transparent)) {
      posArr.push(
        wx, y, wz,
        wx + 1, y, wz,
        wx + 1, y, wz + 1,

        wx, y, wz,
        wx + 1, y, wz + 1,
        wx, y, wz + 1
      );
      for (let k = 0; k < 6; k++) {
        normArr.push(0, -1, 0);
      }
      uvArr.push(
        u0, v1,  u1, v1,  u1, v0,
        u0, v1,  u1, v0,  u0, v0
      );
    }

    // 3. NORTH (+Z): from (wx, wz+1) to (wx+1, wz+1)
    const north = this.getBlock(wx, y, wz + 1);
    if (!isWaterLike(north) && (north === BlockType.AIR || BLOCK_CONFIGS[north]?.transparent)) {
      posArr.push(
        wx, y, wz + 1,
        wx + 1, y, wz + 1,
        wx + 1, y + 1, wz + 1,

        wx, y, wz + 1,
        wx + 1, y + 1, wz + 1,
        wx, y + 1, wz + 1
      );
      for (let k = 0; k < 6; k++) {
        normArr.push(0, 0, 1);
      }
      uvArr.push(
        su0, sv0,  su1, sv0,  su1, sv1,
        su0, sv0,  su1, sv1,  su0, sv1
      );
    }

    // 4. SOUTH (-Z): from (wx+1, wz) to (wx, wz)
    const south = this.getBlock(wx, y, wz - 1);
    if (!isWaterLike(south) && (south === BlockType.AIR || BLOCK_CONFIGS[south]?.transparent)) {
      posArr.push(
        wx + 1, y, wz,
        wx, y, wz,
        wx, y + 1, wz,

        wx + 1, y, wz,
        wx, y + 1, wz,
        wx + 1, y + 1, wz
      );
      for (let k = 0; k < 6; k++) {
        normArr.push(0, 0, -1);
      }
      uvArr.push(
        su0, sv0,  su1, sv0,  su1, sv1,
        su0, sv0,  su1, sv1,  su0, sv1
      );
    }

    // 5. EAST (+X): from (wx+1, wz+1) to (wx+1, wz)
    const east = this.getBlock(wx + 1, y, wz);
    if (!isWaterLike(east) && (east === BlockType.AIR || BLOCK_CONFIGS[east]?.transparent)) {
      posArr.push(
        wx + 1, y, wz + 1,
        wx + 1, y, wz,
        wx + 1, y + 1, wz,

        wx + 1, y, wz + 1,
        wx + 1, y + 1, wz,
        wx + 1, y + 1, wz + 1
      );
      for (let k = 0; k < 6; k++) {
        normArr.push(1, 0, 0);
      }
      uvArr.push(
        su0, sv0,  su1, sv0,  su1, sv1,
        su0, sv0,  su1, sv1,  su0, sv1
      );
    }

    // 6. WEST (-X): from (wx, wz) to (wx, wz+1)
    const west = this.getBlock(wx - 1, y, wz);
    if (!isWaterLike(west) && (west === BlockType.AIR || BLOCK_CONFIGS[west]?.transparent)) {
      posArr.push(
        wx, y, wz,
        wx, y, wz + 1,
        wx, y + 1, wz + 1,

        wx, y, wz,
        wx, y + 1, wz + 1,
        wx, y + 1, wz
      );
      for (let k = 0; k < 6; k++) {
        normArr.push(-1, 0, 0);
      }
      uvArr.push(
        su0, sv0,  su1, sv0,  su1, sv1,
        su0, sv0,  su1, sv1,  su0, sv1
      );
    }
  }

  private addCrossGeometry(
    wx: number, y: number, wz: number, block: BlockType,
    posArr: number[], normArr: number[], uvArr: number[], colArr?: number[] | null
  ) {
    const [u0, v0, u1, v1] = getBlockUVs(block, 'side');
    posArr.push(
      wx, y, wz,  wx + 1, y, wz + 1,  wx + 1, y + 1, wz + 1,
      wx, y, wz,  wx + 1, y + 1, wz + 1,  wx, y + 1, wz
    );
    // Soft upward-angled normals prevent harsh backface shadow flipping
    normArr.push(
      0.1, 0.9, 0.1,  0.1, 0.9, 0.1,  0.1, 0.9, 0.1,
      0.1, 0.9, 0.1,  0.1, 0.9, 0.1,  0.1, 0.9, 0.1
    );
    uvArr.push(u0, v0,  u1, v0,  u1, v1,  u0, v0,  u1, v1,  u0, v1);

    posArr.push(
      wx, y, wz + 1,  wx + 1, y, wz,  wx + 1, y + 1, wz,
      wx, y, wz + 1,  wx + 1, y + 1, wz,  wx, y + 1, wz + 1
    );
    normArr.push(
      -0.1, 0.9, 0.1,  -0.1, 0.9, 0.1,  -0.1, 0.9, 0.1,
      -0.1, 0.9, 0.1,  -0.1, 0.9, 0.1,  -0.1, 0.9, 0.1
    );
    uvArr.push(u0, v0,  u1, v0,  u1, v1,  u0, v0,  u1, v1,  u0, v1);

    if (colArr) {
      const isFoliage = (
        block === BlockType.SHORT_GRASS ||
        block === BlockType.MEDIUM_GRASS ||
        block === BlockType.TALL_GRASS ||
        block === BlockType.FERN
      );
      const isDeadBush = block === BlockType.DEAD_BUSH;
      const biome = this.getBiome(wx, wz);
      const baseColor: [number, number, number] = isFoliage
        ? getBiomeFoliageColor(biome)
        : isDeadBush
        ? [0.72, 0.54, 0.36]
        : [1.0, 1.0, 1.0];

      // Vibrant, uniform natural flora illumination matching world lighting
      const lit = this.getFaceLighting(wx, y + 1, wz, 'top', baseColor);
      const plantR = Math.min(1.0, lit[0] * 1.08);
      const plantG = Math.min(1.0, lit[1] * 1.08);
      const plantB = Math.min(1.0, lit[2] * 1.08);
      for (let i = 0; i < 12; i++) colArr.push(plantR, plantG, plantB);
    }
  }

  // Authentic Minecraft flat lily pad resting smoothly on water / ground surface
  private addLilyPadGeometry(
    wx: number, y: number, wz: number,
    posArr: number[], normArr: number[], uvArr: number[], colArr?: number[] | null
  ) {
    const [u0, v0, u1, v1] = getBlockUVs(BlockType.LILY_PAD, 'top');
    const py = y + 0.02; // Flush atop water / surface
    // Top face
    posArr.push(
      wx, py, wz + 1,
      wx + 1, py, wz + 1,
      wx + 1, py, wz,
      wx, py, wz + 1,
      wx + 1, py, wz,
      wx, py, wz
    );
    for (let k = 0; k < 6; k++) {
      normArr.push(0, 1, 0);
    }
    uvArr.push(
      u0, v1,  u1, v1,  u1, v0,
      u0, v1,  u1, v0,  u0, v0
    );

    // Bottom face (visible from underneath water)
    posArr.push(
      wx, py, wz,
      wx + 1, py, wz,
      wx + 1, py, wz + 1,
      wx, py, wz,
      wx + 1, py, wz + 1,
      wx, py, wz + 1
    );
    for (let k = 0; k < 6; k++) {
      normArr.push(0, -1, 0);
    }
    uvArr.push(
      u0, v0,  u1, v0,  u1, v1,
      u0, v0,  u1, v1,  u0, v1
    );

    if (colArr) {
      for (let i = 0; i < 12; i++) colArr.push(1, 1, 1);
    }
  }

  private addTorchGeometry(
    wx: number, y: number, wz: number,
    posArr: number[], normArr: number[], uvArr: number[], colArr?: number[] | null
  ) {
    const [u0, v0, u1, v1] = getBlockUVs(BlockType.TORCH, 'side');
    const [tu0, tv0, tu1, tv1] = getBlockUVs(BlockType.TORCH, 'top');

    const x0 = wx + 0.4375;
    const x1 = wx + 0.5625;
    const z0 = wz + 0.4375;
    const z1 = wz + 0.5625;
    const y0 = y;
    const y1 = y + 0.65;

    // North (+Z)
    posArr.push(x0, y0, z1,  x1, y0, z1,  x1, y1, z1,  x0, y0, z1,  x1, y1, z1,  x0, y1, z1);
    normArr.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1);
    uvArr.push(u0, v0,  u1, v0,  u1, v1,  u0, v0,  u1, v1,  u0, v1);

    // South (-Z)
    posArr.push(x1, y0, z0,  x0, y0, z0,  x0, y1, z0,  x1, y0, z0,  x0, y1, z0,  x1, y1, z0);
    normArr.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1);
    uvArr.push(u0, v0,  u1, v0,  u1, v1,  u0, v0,  u1, v1,  u0, v1);

    // East (+X)
    posArr.push(x1, y0, z1,  x1, y0, z0,  x1, y1, z0,  x1, y0, z1,  x1, y1, z0,  x1, y1, z1);
    normArr.push(1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0);
    uvArr.push(u0, v0,  u1, v0,  u1, v1,  u0, v0,  u1, v1,  u0, v1);

    // West (-X)
    posArr.push(x0, y0, z0,  x0, y0, z1,  x0, y1, z1,  x0, y0, z0,  x0, y1, z1,  x0, y1, z0);
    normArr.push(-1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0);
    uvArr.push(u0, v0,  u1, v0,  u1, v1,  u0, v0,  u1, v1,  u0, v1);

    // Top (+Y)
    posArr.push(x0, y1, z1,  x1, y1, z1,  x1, y1, z0,  x0, y1, z1,  x1, y1, z0,  x0, y1, z0);
    normArr.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
    uvArr.push(tu0, tv0,  tu1, tv0,  tu1, tv1,  tu0, tv0,  tu1, tv1,  tu0, tv1);

    if (colArr) {
      for (let i = 0; i < 30; i++) colArr.push(1, 1, 1);
    }
  }

  private addLanternGeometry(
    wx: number, y: number, wz: number,
    posArr: number[], normArr: number[], uvArr: number[], colArr?: number[] | null
  ) {
    const [u0, v0, u1, v1] = getBlockUVs(BlockType.LANTERN, 'side');
    const x0 = wx + 0.3125;
    const x1 = wx + 0.6875;
    const z0 = wz + 0.3125;
    const z1 = wz + 0.6875;
    const y0 = y;
    const y1 = y + 0.5625;

    // North (+Z)
    posArr.push(x0, y0, z1,  x1, y0, z1,  x1, y1, z1,  x0, y0, z1,  x1, y1, z1,  x0, y1, z1);
    normArr.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1);
    uvArr.push(u0, v0,  u1, v0,  u1, v1,  u0, v0,  u1, v1,  u0, v1);

    // South (-Z)
    posArr.push(x1, y0, z0,  x0, y0, z0,  x0, y1, z0,  x1, y0, z0,  x0, y1, z0,  x1, y1, z0);
    normArr.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1);
    uvArr.push(u0, v0,  u1, v0,  u1, v1,  u0, v0,  u1, v1,  u0, v1);

    // East (+X)
    posArr.push(x1, y0, z1,  x1, y0, z0,  x1, y1, z0,  x1, y0, z1,  x1, y1, z0,  x1, y1, z1);
    normArr.push(1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0);
    uvArr.push(u0, v0,  u1, v0,  u1, v1,  u0, v0,  u1, v1,  u0, v1);

    // West (-X)
    posArr.push(x0, y0, z0,  x0, y0, z1,  x0, y1, z1,  x0, y0, z0,  x0, y1, z1,  x0, y1, z0);
    normArr.push(-1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0);
    uvArr.push(u0, v0,  u1, v0,  u1, v1,  u0, v0,  u1, v1,  u0, v1);

    // Top (+Y)
    posArr.push(x0, y1, z1,  x1, y1, z1,  x1, y1, z0,  x0, y1, z1,  x1, y1, z0,  x0, y1, z0);
    normArr.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
    uvArr.push(u0, v0,  u1, v0,  u1, v1,  u0, v0,  u1, v1,  u0, v1);

    if (colArr) {
      for (let i = 0; i < 30; i++) colArr.push(1, 1, 1);
    }
  }

  private addDoorGeometry(
    wx: number, y: number, wz: number, block: BlockType,
    posArr: number[], normArr: number[], uvArr: number[], colArr?: number[] | null
  ) {
    const [u0, v0, u1, v1] = getBlockUVs(block, 'side');
    const isOpen = this.isDoorOpen(wx, y, wz);
    const thick = 0.1875; // 3/16 thickness

    if (!isOpen) {
      // Closed: flush along North/South edge (z from wz+0.05 to wz+0.05+thick)
      const x0 = wx;
      const x1 = wx + 1;
      const z0 = wz + 0.05;
      const z1 = z0 + thick;
      const y0 = y;
      const y1 = y + 1;

      // Front (+Z)
      posArr.push(x0, y0, z1,  x1, y0, z1,  x1, y1, z1,  x0, y0, z1,  x1, y1, z1,  x0, y1, z1);
      normArr.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1);
      uvArr.push(u0, v0,  u1, v0,  u1, v1,  u0, v0,  u1, v1,  u0, v1);

      // Back (-Z)
      posArr.push(x1, y0, z0,  x0, y0, z0,  x0, y1, z0,  x1, y0, z0,  x0, y1, z0,  x1, y1, z0);
      normArr.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1);
      uvArr.push(u0, v0,  u1, v0,  u1, v1,  u0, v0,  u1, v1,  u0, v1);

      // Left edge (+X)
      posArr.push(x1, y0, z1,  x1, y0, z0,  x1, y1, z0,  x1, y0, z1,  x1, y1, z0,  x1, y1, z1);
      normArr.push(1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0);
      uvArr.push(u0, v0,  u0 + 0.01, v0,  u0 + 0.01, v1,  u0, v0,  u0 + 0.01, v1,  u0, v1);

      // Right edge (-X)
      posArr.push(x0, y0, z0,  x0, y0, z1,  x0, y1, z1,  x0, y0, z0,  x0, y1, z1,  x0, y1, z0);
      normArr.push(-1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0);
      uvArr.push(u0, v0,  u0 + 0.01, v0,  u0 + 0.01, v1,  u0, v0,  u0 + 0.01, v1,  u0, v1);

      // Top edge (+Y)
      posArr.push(x0, y1, z1,  x1, y1, z1,  x1, y1, z0,  x0, y1, z1,  x1, y1, z0,  x0, y1, z0);
      normArr.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
      uvArr.push(u0, v0,  u1, v0,  u1, v0 + 0.01,  u0, v0,  u1, v0 + 0.01,  u0, v0 + 0.01);
    } else {
      // Open: swung 90 degrees flat against the wall along Z
      const x0 = wx + 0.05;
      const x1 = x0 + thick;
      const z0 = wz;
      const z1 = wz + 1;
      const y0 = y;
      const y1 = y + 1;

      // Outer face (+X)
      posArr.push(x1, y0, z1,  x1, y0, z0,  x1, y1, z0,  x1, y0, z1,  x1, y1, z0,  x1, y1, z1);
      normArr.push(1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0);
      uvArr.push(u0, v0,  u1, v0,  u1, v1,  u0, v0,  u1, v1,  u0, v1);

      // Inner face (-X)
      posArr.push(x0, y0, z0,  x0, y0, z1,  x0, y1, z1,  x0, y0, z0,  x0, y1, z1,  x0, y1, z0);
      normArr.push(-1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0);
      uvArr.push(u0, v0,  u1, v0,  u1, v1,  u0, v0,  u1, v1,  u0, v1);

      // Front edge (+Z)
      posArr.push(x0, y0, z1,  x1, y0, z1,  x1, y1, z1,  x0, y0, z1,  x1, y1, z1,  x0, y1, z1);
      normArr.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1);
      uvArr.push(u0, v0,  u0 + 0.01, v0,  u0 + 0.01, v1,  u0, v0,  u0 + 0.01, v1,  u0, v1);

      // Back edge (-Z)
      posArr.push(x1, y0, z0,  x0, y0, z0,  x0, y1, z0,  x1, y0, z0,  x0, y1, z0,  x1, y1, z0);
      normArr.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1);
      uvArr.push(u0, v0,  u0 + 0.01, v0,  u0 + 0.01, v1,  u0, v0,  u0 + 0.01, v1,  u0, v1);

      // Top edge (+Y)
      posArr.push(x0, y1, z1,  x1, y1, z1,  x1, y1, z0,  x0, y1, z1,  x1, y1, z0,  x0, y1, z0);
      normArr.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
      uvArr.push(u0, v0,  u1, v0,  u1, v0 + 0.01,  u0, v0,  u1, v0 + 0.01,  u0, v0 + 0.01);
    }

    if (colArr) {
      for (let i = 0; i < 30; i++) colArr.push(1, 1, 1);
    }
  }

  private isWireOrPower(block: BlockType): boolean {
    return (
      block === BlockType.COPPER_WIRE ||
      block === BlockType.COPPER_WIRE_ON ||
      block === BlockType.REINFORCED_CABLE ||
      block === BlockType.COPPER_SWITCH ||
      block === BlockType.COPPER_SWITCH_ON ||
      block === BlockType.COPPER_LAMP ||
      block === BlockType.COPPER_LAMP_ON
    );
  }

  // Dynamic Minecraft Redstone/Wire Geometry (Straight, L-Corner, T-Junction, Cross +, and Vertical Step-Up Climbing)
  private addWireGeometry(
    wx: number, y: number, wz: number, block: BlockType,
    posArr: number[], normArr: number[], uvArr: number[], colArr?: number[] | null
  ) {
    const [u0, v0, u1, v1] = getBlockUVs(block, 'top');
    const py = y + 0.02;

    const pushQuadY = (x0: number, x1: number, z0: number, z1: number) => {
      posArr.push(
        x0, py, z0,
        x1, py, z0,
        x1, py, z1,

        x0, py, z0,
        x1, py, z1,
        x0, py, z1
      );
      for (let k = 0; k < 6; k++) normArr.push(0, 1, 0);
      const qu0 = u0 + (x0 - wx) * (u1 - u0);
      const qu1 = u0 + (x1 - wx) * (u1 - u0);
      const qv0 = v0 + (z0 - wz) * (v1 - v0);
      const qv1 = v0 + (z1 - wz) * (v1 - v0);
      uvArr.push(
        qu0, qv1,  qu1, qv1,  qu1, qv0,
        qu0, qv1,  qu1, qv0,  qu0, qv0
      );
      if (colArr) {
        for (let i = 0; i < 6; i++) colArr.push(1, 1, 1);
      }
    };

    const pushWallQuad = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, nx: number, nz: number) => {
      posArr.push(
        x0, y0, z0,
        x1, y0, z1,
        x1, y1, z1,

        x0, y0, z0,
        x1, y1, z1,
        x0, y1, z0
      );
      for (let k = 0; k < 6; k++) normArr.push(nx, 0, nz);
      uvArr.push(
        u0, v1,  u1, v1,  u1, v0,
        u0, v1,  u1, v0,  u0, v0
      );
      if (colArr) {
        for (let i = 0; i < 6; i++) colArr.push(1, 1, 1);
      }
    };

    // Check wire/power connection in all 4 cardinal directions
    // North (-Z)
    const blockN = this.getBlock(wx, y, wz - 1);
    const blockN_up = this.getBlock(wx, y + 1, wz - 1);
    const blockN_down = this.getBlock(wx, y - 1, wz - 1);
    const blockThis_up = this.getBlock(wx, y + 1, wz);
    const isSolidN = BLOCK_CONFIGS[blockN]?.solid;
    const isSolidThisUp = BLOCK_CONFIGS[blockThis_up]?.solid;

    const directN = this.isWireOrPower(blockN);
    const stepDownN = blockN === BlockType.AIR && this.isWireOrPower(blockN_down);
    const stepUpN = isSolidN && !isSolidThisUp && this.isWireOrPower(blockN_up);
    const connectN = directN || stepDownN || stepUpN;

    // South (+Z)
    const blockS = this.getBlock(wx, y, wz + 1);
    const blockS_up = this.getBlock(wx, y + 1, wz + 1);
    const blockS_down = this.getBlock(wx, y - 1, wz + 1);
    const isSolidS = BLOCK_CONFIGS[blockS]?.solid;

    const directS = this.isWireOrPower(blockS);
    const stepDownS = blockS === BlockType.AIR && this.isWireOrPower(blockS_down);
    const stepUpS = isSolidS && !isSolidThisUp && this.isWireOrPower(blockS_up);
    const connectS = directS || stepDownS || stepUpS;

    // East (+X)
    const blockE = this.getBlock(wx + 1, y, wz);
    const blockE_up = this.getBlock(wx + 1, y + 1, wz);
    const blockE_down = this.getBlock(wx + 1, y - 1, wz);
    const isSolidE = BLOCK_CONFIGS[blockE]?.solid;

    const directE = this.isWireOrPower(blockE);
    const stepDownE = blockE === BlockType.AIR && this.isWireOrPower(blockE_down);
    const stepUpE = isSolidE && !isSolidThisUp && this.isWireOrPower(blockE_up);
    const connectE = directE || stepDownE || stepUpE;

    // West (-X)
    const blockW = this.getBlock(wx - 1, y, wz);
    const blockW_up = this.getBlock(wx - 1, y + 1, wz);
    const blockW_down = this.getBlock(wx - 1, y - 1, wz);
    const isSolidW = BLOCK_CONFIGS[blockW]?.solid;

    const directW = this.isWireOrPower(blockW);
    const stepDownW = blockW === BlockType.AIR && this.isWireOrPower(blockW_down);
    const stepUpW = isSolidW && !isSolidThisUp && this.isWireOrPower(blockW_up);
    const connectW = directW || stepDownW || stepUpW;

    const connCount = (connectN ? 1 : 0) + (connectS ? 1 : 0) + (connectE ? 1 : 0) + (connectW ? 1 : 0);

    const x0 = wx + 0.35;
    const x1 = wx + 0.65;
    const z0 = wz + 0.35;
    const z1 = wz + 0.65;

    // Center hub
    pushQuadY(x0, x1, z0, z1);

    if (connCount === 0) {
      // Standalone single dot
      pushQuadY(wx + 0.25, wx + 0.75, wz + 0.25, wz + 0.75);
    } else {
      // Connect each active direction
      if (connectN) pushQuadY(x0, x1, wz, z0);
      if (connectS) pushQuadY(x0, x1, z1, wz + 1.0);
      if (connectE) pushQuadY(x1, wx + 1.0, z0, z1);
      if (connectW) pushQuadY(wx, x0, z0, z1);

      // If only 1 connection, extend a small stub to opposite side for natural line look
      if (connCount === 1) {
        if (connectN) pushQuadY(x0, x1, z1, wz + 0.80);
        if (connectS) pushQuadY(x0, x1, wz + 0.20, z0);
        if (connectE) pushQuadY(wx + 0.20, x0, z0, z1);
        if (connectW) pushQuadY(x1, wx + 0.80, z0, z1);
      }
    }

    // Vertical climbing ribbons on adjacent walls when stepping up a block (Minecraft style)
    if (stepUpN) {
      pushWallQuad(x0, x1, y + 0.02, y + 1.02, wz + 0.015, wz + 0.015, 0, 1);
    }
    if (stepUpS) {
      pushWallQuad(x1, x0, y + 0.02, y + 1.02, wz + 0.985, wz + 0.985, 0, -1);
    }
    if (stepUpE) {
      pushWallQuad(wx + 0.985, wx + 0.985, y + 0.02, y + 1.02, z0, z1, -1, 0);
    }
    if (stepUpW) {
      pushWallQuad(wx + 0.015, wx + 0.015, y + 0.02, y + 1.02, z1, z0, 1, 0);
    }
  }

  private addSwitchGeometry(
    wx: number, y: number, wz: number, block: BlockType,
    posArr: number[], normArr: number[], uvArr: number[], colArr?: number[] | null
  ) {
    const [u0, v0, u1, v1] = getBlockUVs(block, 'side');
    posArr.push(
      wx + 0.25, y + 0.2, wz,
      wx + 0.75, y + 0.2, wz,
      wx + 0.75, y + 0.2, wz + 1,

      wx + 0.25, y + 0.2, wz,
      wx + 0.75, y + 0.2, wz + 1,
      wx + 0.25, y + 0.2, wz + 1
    );
    normArr.push(
      0, 1, 0, 0, 1, 0, 0, 1, 0,
      0, 1, 0, 0, 1, 0, 0, 1, 0
    );
    uvArr.push(
      u0, v1, u1, v1, u1, v0,
      u0, v1, u1, v0, u0, v0
    );

    if (colArr) {
      for (let i = 0; i < 6; i++) colArr.push(1, 1, 1);
    }
  }

  private shouldRenderFace(currentBlock: BlockType, neighborBlock: BlockType): boolean {
    if (neighborBlock === BlockType.AIR) return true;
    const isWaterLike = (b: BlockType) =>
      b === BlockType.WATER || b === BlockType.KELP || b === BlockType.SEA_PICKLE;

    if (currentBlock === BlockType.WATER && isWaterLike(neighborBlock)) return false;
    if (currentBlock === BlockType.LAVA && neighborBlock === BlockType.LAVA) return false;
    if (currentBlock === BlockType.LEAVES && neighborBlock === BlockType.LEAVES) return false;
    if (currentBlock === BlockType.JUNGLE_LEAVES && neighborBlock === BlockType.JUNGLE_LEAVES) return false;

    if (
      neighborBlock === BlockType.TORCH ||
      neighborBlock === BlockType.POPPY ||
      neighborBlock === BlockType.DANDELION ||
      neighborBlock === BlockType.SHORT_GRASS ||
      neighborBlock === BlockType.MEDIUM_GRASS ||
      neighborBlock === BlockType.TALL_GRASS ||
      neighborBlock === BlockType.FERN ||
      neighborBlock === BlockType.DEAD_BUSH ||
      neighborBlock === BlockType.LILY_PAD ||
      neighborBlock === BlockType.COPPER_WIRE ||
      neighborBlock === BlockType.COPPER_WIRE_ON ||
      neighborBlock === BlockType.COPPER_SWITCH ||
      neighborBlock === BlockType.COPPER_SWITCH_ON
    ) return true;

    return BLOCK_CONFIGS[neighborBlock]?.transparent && neighborBlock !== currentBlock;
  }

  // Fast DDA voxel raycast
  public raycast(origin: THREE.Vector3, direction: THREE.Vector3, maxDistance: number = 6, hitFluids: boolean = false): VoxelHit | null {
    let t = 0;
    let ix = Math.floor(origin.x);
    let iy = Math.floor(origin.y);
    let iz = Math.floor(origin.z);

    const stepX = Math.sign(direction.x);
    const stepY = Math.sign(direction.y);
    const stepZ = Math.sign(direction.z);

    const txDelta = stepX !== 0 ? Math.abs(1 / direction.x) : Infinity;
    const tyDelta = stepY !== 0 ? Math.abs(1 / direction.y) : Infinity;
    const tzDelta = stepZ !== 0 ? Math.abs(1 / direction.z) : Infinity;

    const xDist = stepX > 0 ? (ix + 1 - origin.x) : (origin.x - ix);
    const yDist = stepY > 0 ? (iy + 1 - origin.y) : (origin.y - iy);
    const zDist = stepZ > 0 ? (iz + 1 - origin.z) : (origin.z - iz);

    let txMax = txDelta < Infinity ? txDelta * xDist : Infinity;
    let tyMax = tyDelta < Infinity ? tyDelta * yDist : Infinity;
    let tzMax = tzDelta < Infinity ? tzDelta * zDist : Infinity;

    let normal = new THREE.Vector3(0, 0, 0);

    while (t <= maxDistance) {
      const block = this.getBlock(ix, iy, iz);
      const isFluid = block === BlockType.WATER || block === BlockType.LAVA;
      if (block !== BlockType.AIR && (!isFluid || hitFluids)) {
        const hitPoint = origin.clone().add(direction.clone().multiplyScalar(t));
        const blockPos = new THREE.Vector3(ix, iy, iz);
        const adjacentPos = blockPos.clone().add(normal);

        return {
          point: hitPoint,
          normal: normal.clone(),
          blockPos,
          adjacentPos,
          blockType: block,
          distance: t,
        };
      }

      if (txMax < tyMax) {
        if (txMax < tzMax) {
          ix += stepX;
          t = txMax;
          txMax += txDelta;
          normal.set(-stepX, 0, 0);
        } else {
          iz += stepZ;
          t = tzMax;
          tzMax += tzDelta;
          normal.set(0, 0, -stepZ);
        }
      } else {
        if (tyMax < tzMax) {
          iy += stepY;
          t = tyMax;
          tyMax += tyDelta;
          normal.set(0, -stepY, 0);
        } else {
          iz += stepZ;
          t = tzMax;
          tzMax += tzDelta;
          normal.set(0, 0, -stepZ);
        }
      }
    }

    return null;
  }
}
