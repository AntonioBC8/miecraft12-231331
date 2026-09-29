/**
 * Minecraft Web 3D - Main Game Engine
 */
import * as THREE from 'three';
import {
  BlockType,
  BLOCK_CONFIGS,
  ITEM_REGISTRY,
  ItemDefinition,
  SEA_LEVEL,
  BiomeType,
  BIOME_NAMES,
  ArmorSlot,
  ARMOR_DEFENSE,
  BACKPACK_CONFIGS,
  DEFAULT_MAX_STACK,
  isDoor,
  isDoorBottom,
  isDoorTop,
  getDoorTopType,
  isStorageBox,
  getStorageBoxCapacity,
  Y_MAX,
} from './constants';
import { FurnaceState } from './furnace';
import { World, VoxelHit } from './world';
import { PlayerPhysics, PlayerInput } from './physics';
import { ParticleSystem } from './particles';
import { Mob, MobType } from './mobs';
import { audio } from './audio';
import { getAtlasTexture, createHandBlockGeometry, getBreakCrackTexture, createHandToolGeometry } from './textures';
import { CloudSystem } from './clouds';
import { ShaderEffectsManager } from './shaders';
import { CircuitManager } from './circuit';

export interface HotbarSlot {
  itemId: string;
  count: number;
}

export interface ArmorEquipment {
  helmet: string | null;
  chestplate: string | null;
  leggings: string | null;
  boots: string | null;
}

export interface EngineStats {
  fps: number;
  x: number;
  y: number;
  z: number;
  targetedBlock: string | null;
  timeOfDay: number; // 0 to 1
  isFlying: boolean;
  biome: string;
}

export interface StorageBoxState {
  posKey: string;
  blockType: BlockType;
  items: { itemId: string; count: number }[];
}

export class GameEngine {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public world: World;
  public physics: PlayerPhysics;
  public particles: ParticleSystem;
  public mobs: Mob[] = [];

  // Target FPS limit (0 = Unlimited, 30, 60, 120, 144)
  public targetFps: number = 60;
  private lastFrameRenderTime: number = 0;

  // Lighting & Sky
  public sunLight: THREE.DirectionalLight;
  public moonLight: THREE.DirectionalLight;
  public ambientLight: THREE.AmbientLight;
  public sunMesh: THREE.Mesh;
  public sunCoronaMesh: THREE.Mesh;
  public moonMesh: THREE.Mesh;
  public starsGroup: THREE.Points;
  public clouds: CloudSystem;
  public shaders: ShaderEffectsManager;
  public circuit: CircuitManager;

  // Targeting wireframe & crack overlay
  public targetBox: THREE.LineSegments;
  public currentHit: VoxelHit | null = null;
  public breakProgress: number = 0; // 0 to 1
  private breakMesh: THREE.Mesh;

  // First-person hand & tool model
  public handGroup: THREE.Group;
  public armMesh: THREE.Mesh;
  public handItemMesh: THREE.Mesh | null = null;
  private swingProgress: number = 0;
  private isSwinging: boolean = false;

  // Player state
  public isCreative: boolean = false;
  public health: number = 100;
  public hunger: number = 100;
  public air: number = 100;
  public activeSlot: number = 0; // 0 to 8
  public hotbar: HotbarSlot[] = [];
  public inventory: HotbarSlot[] = [];

  // Armor & Backpack equipment
  public armor: ArmorEquipment = {
    helmet: null,
    chestplate: null,
    leggings: null,
    boots: null,
  };
  public backpack: HotbarSlot[] = Array(27).fill(null).map(() => ({ itemId: '', count: 0 }));
  public equippedBackpack: string | null = null;

  // Input & Camera
  public input: PlayerInput = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    crouch: false,
    sprint: false,
    fly: false,
  };
  public yaw: number = 0;
  public pitch: number = 0;
  public isLocked: boolean = false;
  public requestLock: () => void = () => {};
  public isMining: boolean = false;
  private lastDigSoundTime: number = 0;
  private lastSpacePressTime: number = 0;
  private drownTimer: number = 0;

  // Settings
  public fov: number = 75;
  public sensitivity: number = 0.0022;
  public renderDistance: number = 3; // In chunks (2 to 8 chunks)
  public timeOfDay: number = 0.35; // Morning
  public daySpeed: number = 0.0005; // 1 full day every ~3.3 minutes
  public cycleEnabled: boolean = true;

  // Loop & Callbacks
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private frameCount: number = 0;
  private fpsTimer: number = 0;
  public currentFps: number = 60;
  public onStatsUpdate?: (stats: EngineStats) => void;
  public onHealthChange?: (health: number) => void;
  public onOpenCraftingTable?: () => void;
  public onOpenFurnace?: (furnace: FurnaceState) => void;
  public onOpenStorage?: (posKey: string, blockType: BlockType) => void;
  public onInventoryChange?: () => void;
  public furnaces: Map<string, FurnaceState> = new Map();
  public storageBoxes: Map<string, StorageBoxState> = new Map();
  public playerHandLight: THREE.PointLight;

  public getOrCreateFurnace(posKey: string): FurnaceState {
    let f = this.furnaces.get(posKey);
    if (!f) {
      f = new FurnaceState(posKey);
      this.furnaces.set(posKey, f);
    }
    return f;
  }

  public getOrCreateStorageBox(posKey: string, blockType: BlockType): StorageBoxState {
    let box = this.storageBoxes.get(posKey);
    if (!box) {
      const capacity = getStorageBoxCapacity(blockType);
      const items = Array.from({ length: capacity }, () => ({ itemId: '', count: 0 }));
      box = { posKey, blockType, items };
      this.storageBoxes.set(posKey, box);
    }
    return box;
  }

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Three.js Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.015);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      this.fov,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );

    // 3. Renderer with Dynamic Soft Shadow Maps & Realistic Filmic Tonemapping
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 4. World & Physics
    this.world = new World(this.scene, Math.floor(Math.random() * 100000));
    this.world.updateInfiniteChunks(0, 0, true);
    this.circuit = new CircuitManager(this.world);

    // Spawn player safely on surface
    const spawnY = this.findSafeSpawnY(0, 0);
    this.physics = new PlayerPhysics(this.world, new THREE.Vector3(0.5, spawnY, 0.5));
    this.camera.position.set(0.5, spawnY + 1.62, 0.5);

    // Apply saved render distance
    try {
      const savedRenderDist = localStorage.getItem('minecraft_render_distance');
      if (savedRenderDist) {
        const parsed = parseInt(savedRenderDist, 10);
        if (!isNaN(parsed) && parsed >= 2 && parsed <= 8) {
          this.setRenderDistance(parsed);
        }
      }
    } catch {}

    // 5. Particles
    this.particles = new ParticleSystem(this.scene);

    // 6. Lights & Realistic Atmosphere
    this.sunLight = new THREE.DirectionalLight(0xfff7ed, 1.45);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 420;
    const shadowDist = 80;
    this.sunLight.shadow.camera.left = -shadowDist;
    this.sunLight.shadow.camera.right = shadowDist;
    this.sunLight.shadow.camera.top = shadowDist;
    this.sunLight.shadow.camera.bottom = -shadowDist;
    this.sunLight.shadow.bias = -0.0004;
    this.sunLight.shadow.normalBias = 0.035;
    this.sunLight.shadow.radius = 2.0; // Soft diffused realistic shadow edges

    this.moonLight = new THREE.DirectionalLight(0x5c7aff, 0.35);
    // Balanced ambient light: avoids upward ground bounce so ceilings under roofs/caves stay dark
    this.ambientLight = new THREE.AmbientLight(0xdde8ff, 0.45);
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);
    this.scene.add(this.moonLight);
    this.scene.add(this.ambientLight);

    // Radiant Minecraft Sun (Square core + golden corona halo)
    const sunGeo = new THREE.PlaneGeometry(18, 18);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffee, side: THREE.DoubleSide, depthWrite: false });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.scene.add(this.sunMesh);

    const coronaGeo = new THREE.PlaneGeometry(38, 38);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xffb84d,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.sunCoronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    this.scene.add(this.sunCoronaMesh);

    const moonGeo = new THREE.PlaneGeometry(14, 14);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xe0e8ff, side: THREE.DoubleSide, depthWrite: false });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.scene.add(this.moonMesh);

    // Soft round star texture to prevent square star artifacts
    const starCanvas = document.createElement('canvas');
    starCanvas.width = 16;
    starCanvas.height = 16;
    const starCtx = starCanvas.getContext('2d');
    if (starCtx) {
      const grad = starCtx.createRadialGradient(8, 8, 0, 8, 8, 7);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.5, 'rgba(230, 240, 255, 0.8)');
      grad.addColorStop(1, 'rgba(200, 220, 255, 0)');
      starCtx.fillStyle = grad;
      starCtx.fillRect(0, 0, 16, 16);
    }
    const starTex = new THREE.CanvasTexture(starCanvas);

    // Starfield for night
    const starCount = 300;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 250;
      starPositions[i] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = Math.abs(r * Math.cos(phi)) + 10;
      starPositions[i + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      map: starTex,
      color: 0xffffff,
      size: 1.8,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.starsGroup = new THREE.Points(starGeo, starMat);
    this.starsGroup.visible = false;
    this.scene.add(this.starsGroup);

    // 7. Target Outline Box
    const boxGeo = new THREE.BoxGeometry(1.005, 1.005, 1.005);
    const wireGeo = new THREE.WireframeGeometry(boxGeo);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    this.targetBox = new THREE.LineSegments(wireGeo, wireMat);
    this.targetBox.visible = false;
    this.scene.add(this.targetBox);

    // Cracking block overlay with authentic Minecraft breaking stage textures
    const breakGeo = new THREE.BoxGeometry(1.002, 1.002, 1.002);
    const breakMat = new THREE.MeshBasicMaterial({
      map: getBreakCrackTexture(0),
      transparent: true,
      opacity: 1.0,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      depthWrite: false,
    });
    this.breakMesh = new THREE.Mesh(breakGeo, breakMat);
    this.breakMesh.visible = false;
    this.breakMesh.renderOrder = 999;
    this.scene.add(this.breakMesh);

    // Handheld Dynamic Light (torches illuminate player, lanterns illuminate much more)
    this.playerHandLight = new THREE.PointLight(0xffaa33, 0, 24);
    this.playerHandLight.visible = false;
    this.scene.add(this.playerHandLight);

    // 8. First Person Hand - Classic Simple Minecraft Steve Arm
    this.handGroup = new THREE.Group();
    const armGroup = new THREE.Group();

    // Simple classic Minecraft hand
    const armGeo = new THREE.BoxGeometry(0.24, 0.68, 0.24);
    const armMat = new THREE.MeshLambertMaterial({
      color: 0xc89666, // Classic Steve skin tone
    });
    this.armMesh = new THREE.Mesh(armGeo, armMat);
    this.armMesh.castShadow = true;
    this.armMesh.receiveShadow = true;
    this.armMesh.position.set(0, 0, 0);
    armGroup.add(this.armMesh);

    armGroup.rotation.x = -Math.PI / 3;
    this.handGroup.add(armGroup);
    this.handGroup.position.set(0.45, -0.4, -0.6);
    this.camera.add(this.handGroup);
    this.scene.add(this.camera);

    // 9. Procedural Minecraft Clouds
    this.clouds = new CloudSystem(this.scene, this.world.seed);

    // 10. Advanced Shaders (Underwater caustics, vignette, atmospheric tone)
    this.shaders = new ShaderEffectsManager(this.container);

    // 11. Initial Inventory & Hotbar
    this.initInventory();

    // 12. Mobs
    this.spawnInitialMobs();

    // Setup input listeners
    this.bindEvents();
    this.updateSky(0);
  }

  private findSafeSpawnY(wx: number, wz: number): number {
    for (let r = 0; r <= 16; r += 2) {
      for (let dx = -r; dx <= r; dx += (r === 0 ? 1 : Math.max(1, r))) {
        for (let dz = -r; dz <= r; dz += (r === 0 ? 1 : Math.max(1, r))) {
          const x = wx + dx;
          const z = wz + dz;
          // Scan from high sky downwards to find true outdoor surface
          for (let y = 95; y >= SEA_LEVEL - 1; y--) {
            const floorBlock = this.world.getBlock(x, y, z);
            const head1 = this.world.getBlock(x, y + 1, z);
            const head2 = this.world.getBlock(x, y + 2, z);
            if (
              floorBlock !== BlockType.AIR &&
              floorBlock !== BlockType.WATER &&
              BLOCK_CONFIGS[floorBlock]?.solid &&
              (head1 === BlockType.AIR || head1 === BlockType.POPPY || head1 === BlockType.DANDELION) &&
              head2 === BlockType.AIR
            ) {
              // Ensure no cave ceiling above (true open sky)
              let hasCeiling = false;
              for (let skyY = y + 3; skyY < Math.min(100, y + 25); skyY += 2) {
                const skyBlock = this.world.getBlock(x, skyY, z);
                if (skyBlock !== BlockType.AIR && skyBlock !== BlockType.LEAVES) {
                  hasCeiling = true;
                  break;
                }
              }
              if (!hasCeiling) {
                return y + 1;
              }
            }
          }
        }
      }
    }
    return 3; // Safe default above sea level (0)
  }

  private initInventory() {
    this.hotbar = [
      { itemId: 'wooden_pickaxe', count: 1 },
      { itemId: 'wooden_axe', count: 1 },
      { itemId: 'wood', count: 16 },
      { itemId: 'planks', count: 32 },
      { itemId: 'copper_wire', count: 24 },
      { itemId: 'copper_switch', count: 4 },
      { itemId: 'copper_lamp', count: 6 },
      { itemId: 'torch', count: 16 },
      { itemId: 'apple', count: 5 },
    ];

    // Main 27-slot inventory
    this.inventory = [
      { itemId: 'copper_block', count: 8 },
      { itemId: 'copper_ingot', count: 16 },
      { itemId: 'raw_copper', count: 16 },
      { itemId: 'cobblestone', count: 32 },
      { itemId: 'crafting_table', count: 1 },
      { itemId: 'sand', count: 32 },
      { itemId: 'glass', count: 16 },
      { itemId: 'brick', count: 32 },
      { itemId: 'bookshelf', count: 8 },
      { itemId: 'tnt', count: 5 },
      { itemId: 'wool_red', count: 16 },
      { itemId: 'wool_blue', count: 16 },
      { itemId: 'iron_ore', count: 12 },
      { itemId: 'coal', count: 20 },
      ...Array(13).fill(null).map(() => ({ itemId: '', count: 0 })),
    ];
  }

  private createMob(type: MobType, pos: THREE.Vector3): Mob {
    const mob = new Mob(type, pos, this.world, this.scene);
    mob.onDeath = (mobType) => {
      audio.playPop();
      if (mobType === 'pig') {
        this.addItemToInventory('porkchop', 1 + Math.floor(Math.random() * 2));
      } else if (mobType === 'sheep') {
        this.addItemToInventory('wool_white', 1 + Math.floor(Math.random() * 2));
      } else if (mobType === 'fish_salmon') {
        this.addItemToInventory('raw_salmon', 1);
      } else if (mobType.startsWith('fish')) {
        this.addItemToInventory('raw_fish', 1);
      }
    };
    return mob;
  }

  private spawnInitialMobs() {
    const types: MobType[] = ['pig', 'sheep', 'pig', 'sheep', 'pig', 'sheep'];
    types.forEach((type, idx) => {
      const angle = (idx / types.length) * Math.PI * 2;
      const dist = 6 + Math.random() * 8;
      const mx = Math.floor(Math.cos(angle) * dist);
      const mz = Math.floor(Math.sin(angle) * dist);
      const my = this.findSafeSpawnY(mx, mz);
      const mob = this.createMob(type, new THREE.Vector3(mx + 0.5, my, mz + 0.5));
      this.mobs.push(mob);
    });

    // Spawn initial aquatic fish in water bodies
    const fishTypes: MobType[] = ['fish_cod', 'fish_salmon', 'fish_tropical', 'fish_puffer'];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const dist = 10 + Math.random() * 16;
      const fx = Math.floor(Math.cos(angle) * dist);
      const fz = Math.floor(Math.sin(angle) * dist);
      const fishType = fishTypes[i % fishTypes.length];
      const fishMob = this.createMob(fishType, new THREE.Vector3(fx + 0.5, -2 - Math.random() * 8, fz + 0.5));
      this.mobs.push(fishMob);
    }
  }

  private mobSpawnTimer: number = 0;
  private updateInfiniteMobs(delta: number) {
    for (let i = this.mobs.length - 1; i >= 0; i--) {
      const mob = this.mobs[i];
      if (mob.isDead) {
        this.mobs.splice(i, 1);
        continue;
      }
      const dist = this.physics.position.distanceTo(mob.position);
      if (dist > 70) {
        if (mob.group.parent) mob.group.parent.remove(mob.group);
        this.mobs.splice(i, 1);
        continue;
      }
      mob.update(delta);
    }

    this.mobSpawnTimer += delta;
    if (this.mobSpawnTimer > 3.0 && this.mobs.length < 16) {
      this.mobSpawnTimer = 0;
      const angle = Math.random() * Math.PI * 2;
      const dist = 14 + Math.random() * 18;
      const mx = Math.floor(this.physics.position.x + Math.cos(angle) * dist);
      const mz = Math.floor(this.physics.position.z + Math.sin(angle) * dist);
      const biome = this.world.getBiome(mx, mz);
      if (biome.includes('ocean') || biome === 'river') {
        // Diverse marine fish swimming in water
        const fishChoices: MobType[] = ['fish_cod', 'fish_salmon', 'fish_tropical', 'fish_puffer'];
        const chosenFish = fishChoices[Math.floor(Math.random() * fishChoices.length)];
        const fishY = -2 - Math.floor(Math.random() * 12);
        const mob = this.createMob(chosenFish, new THREE.Vector3(mx + 0.5, fishY, mz + 0.5));
        this.mobs.push(mob);
      } else if (!biome.includes('ocean') && biome !== 'desert' && biome !== 'badlands' && biome !== 'eroded_badlands') {
        const my = this.findSafeSpawnY(mx, mz);
        const type: MobType = Math.random() > 0.5 ? 'pig' : 'sheep';
        const mob = this.createMob(type, new THREE.Vector3(mx + 0.5, my, mz + 0.5));
        this.mobs.push(mob);
      }
    }
  }

  public addItemToInventory(itemId: string, count: number = 1) {
    if (!itemId) return;
    audio.playPop();

    const maxStack = ITEM_REGISTRY[itemId]?.maxStack || DEFAULT_MAX_STACK;

    // Try stacking into hotbar
    for (let slot of this.hotbar) {
      if (slot.itemId === itemId && slot.count < maxStack) {
        const space = maxStack - slot.count;
        const add = Math.min(space, count);
        slot.count += add;
        count -= add;
        if (this.onInventoryChange) this.onInventoryChange();
        if (count <= 0) return;
      }
    }

    // Try empty hotbar slot
    for (let slot of this.hotbar) {
      if (!slot.itemId || slot.count === 0) {
        slot.itemId = itemId;
        slot.count = count;
        if (this.onInventoryChange) this.onInventoryChange();
        return;
      }
    }

    // Try stacking into main inventory
    for (let slot of this.inventory) {
      if (slot.itemId === itemId && slot.count < maxStack) {
        const space = maxStack - slot.count;
        const add = Math.min(space, count);
        slot.count += add;
        count -= add;
        if (this.onInventoryChange) this.onInventoryChange();
        if (count <= 0) return;
      }
    }

    // Try empty main inventory slot
    for (let slot of this.inventory) {
      if (!slot.itemId || slot.count === 0) {
        slot.itemId = itemId;
        slot.count = count;
        if (this.onInventoryChange) this.onInventoryChange();
        return;
      }
    }

    // Overflow into backpack extra storage
    if (this.equippedBackpack) {
      const cap = BACKPACK_CONFIGS[this.equippedBackpack]?.slots || 9;
      for (let i = 0; i < cap; i++) {
        const slot = this.backpack[i];
        if (slot && slot.itemId === itemId && slot.count < maxStack) {
          const space = maxStack - slot.count;
          const add = Math.min(space, count);
          slot.count += add;
          count -= add;
          if (this.onInventoryChange) this.onInventoryChange();
          if (count <= 0) return;
        }
      }
      for (let i = 0; i < cap; i++) {
        const slot = this.backpack[i];
        if (slot && (!slot.itemId || slot.count === 0)) {
          slot.itemId = itemId;
          slot.count = count;
          if (this.onInventoryChange) this.onInventoryChange();
          return;
        }
      }
    }
  }

  public getTotalArmorDefense(): number {
    let total = 0;
    if (this.armor.helmet && ARMOR_DEFENSE[this.armor.helmet]) total += ARMOR_DEFENSE[this.armor.helmet].defense;
    if (this.armor.chestplate && ARMOR_DEFENSE[this.armor.chestplate]) total += ARMOR_DEFENSE[this.armor.chestplate].defense;
    if (this.armor.leggings && ARMOR_DEFENSE[this.armor.leggings]) total += ARMOR_DEFENSE[this.armor.leggings].defense;
    if (this.armor.boots && ARMOR_DEFENSE[this.armor.boots]) total += ARMOR_DEFENSE[this.armor.boots].defense;
    return total;
  }

  public equipArmor(slot: ArmorSlot, itemId: string | null): string | null {
    const prev = this.armor[slot];
    this.armor[slot] = itemId;
    if (this.onInventoryChange) this.onInventoryChange();
    return prev;
  }

  public equipBackpack(itemId: string | null): string | null {
    const prev = this.equippedBackpack;
    this.equippedBackpack = itemId;
    if (this.onInventoryChange) this.onInventoryChange();
    return prev;
  }

  public getActiveItem(): ItemDefinition | null {
    const slot = this.hotbar[this.activeSlot];
    if (!slot || !slot.itemId || slot.count <= 0) return null;
    return ITEM_REGISTRY[slot.itemId] || null;
  }

  public setActiveSlot(index: number) {
    this.activeSlot = Math.max(0, Math.min(8, index));
    this.updateHandItem();
  }

  public updateHandItem() {
    // Remove old item from hand
    if (this.handItemMesh) {
      this.handGroup.remove(this.handItemMesh);
      if (this.handItemMesh.geometry) this.handItemMesh.geometry.dispose();
      this.handItemMesh = null;
    }

    const item = this.getActiveItem();
    if (!item) {
      this.armMesh.visible = true;
      return;
    }

    if (item.id === 'torch' || item.blockType === BlockType.TORCH) {
      // 3D Torch in hand with wooden rod & glowing flame tip
      const torchGroup = new THREE.Group();
      const stickGeo = new THREE.BoxGeometry(0.04, 0.36, 0.04);
      const stickMat = new THREE.MeshLambertMaterial({ color: 0x8b6537 });
      const stick = new THREE.Mesh(stickGeo, stickMat);
      torchGroup.add(stick);

      const flameGeo = new THREE.BoxGeometry(0.065, 0.075, 0.065);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa22 });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(0, 0.16, 0);
      torchGroup.add(flame);

      torchGroup.position.set(-0.06, 0.16, -0.22);
      torchGroup.rotation.set(0.4, 0.25, -0.15);
      this.handItemMesh = torchGroup as unknown as THREE.Mesh;
      this.handGroup.add(this.handItemMesh);
      this.armMesh.visible = true;
      return;
    }

    if (item.id === 'lantern' || item.blockType === BlockType.LANTERN) {
      // 3D Lantern in hand with metal frame and radiant glowing core
      const lanternGroup = new THREE.Group();
      const frameGeo = new THREE.BoxGeometry(0.16, 0.22, 0.16);
      const frameMat = new THREE.MeshLambertMaterial({ color: 0x2f3640 });
      const frame = new THREE.Mesh(frameGeo, frameMat);
      lanternGroup.add(frame);

      const coreGeo = new THREE.BoxGeometry(0.10, 0.14, 0.10);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xffea78 });
      const core = new THREE.Mesh(coreGeo, coreMat);
      lanternGroup.add(core);

      lanternGroup.position.set(-0.06, 0.14, -0.24);
      lanternGroup.rotation.set(0.2, 0.2, 0);
      this.handItemMesh = lanternGroup as unknown as THREE.Mesh;
      this.handGroup.add(this.handItemMesh);
      this.armMesh.visible = true;
      return;
    }

    if (item.isBlock && item.blockType !== undefined) {
      // 3D mini block in hand with accurate per-face texture mapping
      const geo = createHandBlockGeometry(item.blockType, 0.28);
      const atlas = getAtlasTexture();
      const mat = new THREE.MeshLambertMaterial({
        map: atlas,
        transparent: BLOCK_CONFIGS[item.blockType].transparent,
        alphaTest: 0.1,
      });
      this.handItemMesh = new THREE.Mesh(geo, mat);
      this.handItemMesh.position.set(-0.06, 0.18, -0.22);
      this.handItemMesh.rotation.set(0.35, 0.55, -0.1);
      this.handGroup.add(this.handItemMesh);
      this.armMesh.visible = true;
    } else if (item.toolType && item.toolType !== 'none' && item.toolMaterial) {
      // 3D Custom Detailed Tool in Hand (Sword, Pickaxe, Axe, Shovel, Hoe across all tiers)
      // Perfectly oriented facing straight forward towards the targeted block/crosshair
      const toolMesh = createHandToolGeometry(item.toolType, item.toolMaterial);
      toolMesh.position.set(-0.06, 0.16, -0.26);
      toolMesh.rotation.set(0.65, 0.02, -0.02);
      this.handItemMesh = toolMesh as unknown as THREE.Mesh;
      this.handGroup.add(this.handItemMesh);
      this.armMesh.visible = true;
    } else {
      // Other handheld items (food, resources, fish, materials)
      const itemGroup = new THREE.Group();

      if (item.id.includes('fish') || item.id.includes('salmon')) {
        // 3D Fish item in hand
        const bodyGeo = new THREE.BoxGeometry(0.1, 0.18, 0.28);
        const isSalmon = item.id.includes('salmon');
        const bodyMat = new THREE.MeshLambertMaterial({ color: isSalmon ? 0xc43c35 : 0xa2836e });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        itemGroup.add(body);

        const tailGeo = new THREE.BoxGeometry(0.04, 0.12, 0.1);
        const tailMat = new THREE.MeshLambertMaterial({ color: isSalmon ? 0xe77065 : 0xc8a88d });
        const tail = new THREE.Mesh(tailGeo, tailMat);
        tail.position.set(0, 0, -0.16);
        itemGroup.add(tail);
      } else if (item.id === 'apple') {
        const appleGeo = new THREE.BoxGeometry(0.18, 0.2, 0.18);
        const appleMat = new THREE.MeshLambertMaterial({ color: 0xd92525 });
        const appleMesh = new THREE.Mesh(appleGeo, appleMat);
        itemGroup.add(appleMesh);
      } else if (item.id === 'porkchop') {
        const porkGeo = new THREE.BoxGeometry(0.16, 0.22, 0.08);
        const porkMat = new THREE.MeshLambertMaterial({ color: 0xd47373 });
        const porkMesh = new THREE.Mesh(porkGeo, porkMat);
        itemGroup.add(porkMesh);
      } else {
        // Generic mineral or item slab in hand
        const slabGeo = new THREE.BoxGeometry(0.14, 0.2, 0.08);
        let color = 0x855c30;
        if (item.id.includes('diamond')) color = 0x4dedf4;
        else if (item.id.includes('titanium')) color = 0xb0c4de;
        else if (item.id.includes('gold')) color = 0xf3ca3e;
        else if (item.id.includes('iron')) color = 0xdcdcdc;
        else if (item.id.includes('copper')) color = 0xc8703e;
        else if (item.id.includes('coal')) color = 0x222222;
        const slabMat = new THREE.MeshLambertMaterial({ color });
        const slabMesh = new THREE.Mesh(slabGeo, slabMat);
        itemGroup.add(slabMesh);
      }

      itemGroup.position.set(-0.06, 0.16, -0.22);
      itemGroup.rotation.set(0.6, 0.3, -0.2);
      const mesh = itemGroup as unknown as THREE.Mesh;
      this.handItemMesh = mesh;
      this.handGroup.add(mesh);
      this.armMesh.visible = true;
    }
  }

  public swingHand() {
    this.isSwinging = true;
    this.swingProgress = 0;
  }

  public triggerMining(isDown: boolean) {
    this.isMining = isDown;
    if (!isDown) {
      this.breakProgress = 0;
      this.breakMesh.visible = false;
    }
  }

  public placeBlock(): boolean {
    if (!this.currentHit) return false;

    // 1. Check interaction with Crafting Table (works with ANY item in hand or bare hand)
    if (this.currentHit.blockType === BlockType.CRAFTING_TABLE) {
      if (this.onOpenCraftingTable) {
        this.onOpenCraftingTable();
        return true;
      }
    }

    // 2. Check interaction with Copper Switch (toggles power on/off through cables)
    if (this.currentHit.blockType === BlockType.COPPER_SWITCH || this.currentHit.blockType === BlockType.COPPER_SWITCH_ON) {
      this.circuit.toggleSwitch(
        this.currentHit.blockPos.x,
        this.currentHit.blockPos.y,
        this.currentHit.blockPos.z,
        (pos) => this.explodeTNT(pos)
      );
      this.swingHand();
      return true;
    }

    // 3. Check TNT ignition
    if (this.currentHit.blockType === BlockType.TNT) {
      this.explodeTNT(this.currentHit.blockPos);
      return true;
    }

    // 4. Check Storage Box opening
    if (isStorageBox(this.currentHit.blockType) || this.currentHit.blockType === BlockType.CHEST) {
      const posKey = `${this.currentHit.blockPos.x},${this.currentHit.blockPos.y},${this.currentHit.blockPos.z}`;
      audio.playPop();
      if (this.onOpenStorage) {
        this.onOpenStorage(posKey, this.currentHit.blockType);
        return true;
      }
      this.swingHand();
      return true;
    }

    // 5. Check interaction with Furnace (open smelting & refining UI)
    if (this.currentHit.blockType === BlockType.FURNACE || this.currentHit.blockType === BlockType.FURNACE_LIT) {
      const posKey = `${this.currentHit.blockPos.x},${this.currentHit.blockPos.y},${this.currentHit.blockPos.z}`;
      const furnace = this.getOrCreateFurnace(posKey);
      if (this.onOpenFurnace) {
        this.onOpenFurnace(furnace);
        return true;
      }
    }

    // 6. Check interaction with Doors (toggle open/close)
    if (isDoor(this.currentHit.blockType)) {
      this.world.toggleDoor(this.currentHit.blockPos.x, this.currentHit.blockPos.y, this.currentHit.blockPos.z);
      audio.playBreak(BlockType.WOOD);
      this.swingHand();
      return true;
    }

    const activeItem = this.getActiveItem();

    // 5. Bucket Interactions: Empty Bucket (harvest water/lava/crude oil), Water Bucket, Lava Bucket, Oil Bucket
    if (activeItem && activeItem.id === 'bucket') {
      const hitPos = this.currentHit.blockPos;
      const hitBlock = this.currentHit.blockType;
      if (hitBlock === BlockType.WATER) {
        this.world.setBlock(hitPos.x, hitPos.y, hitPos.z, BlockType.AIR);
        audio.playSplash();
        this.swingHand();
        if (!this.isCreative) {
          const slot = this.hotbar[this.activeSlot];
          if (slot.count > 1) {
            slot.count--;
            this.addItemToInventory('water_bucket', 1);
          } else {
            slot.itemId = 'water_bucket';
          }
          this.updateHandItem();
          if (this.onInventoryChange) this.onInventoryChange();
        }
        return true;
      } else if (hitBlock === BlockType.LAVA) {
        this.world.setBlock(hitPos.x, hitPos.y, hitPos.z, BlockType.AIR);
        audio.playSplash();
        this.swingHand();
        if (!this.isCreative) {
          const slot = this.hotbar[this.activeSlot];
          if (slot.count > 1) {
            slot.count--;
            this.addItemToInventory('lava_bucket', 1);
          } else {
            slot.itemId = 'lava_bucket';
          }
          this.updateHandItem();
          if (this.onInventoryChange) this.onInventoryChange();
        }
        return true;
      } else if (hitBlock === BlockType.CRUDE_OIL) {
        this.world.setBlock(hitPos.x, hitPos.y, hitPos.z, BlockType.AIR);
        audio.playSplash();
        this.swingHand();
        if (!this.isCreative) {
          const slot = this.hotbar[this.activeSlot];
          if (slot.count > 1) {
            slot.count--;
            this.addItemToInventory('oil_bucket', 1);
          } else {
            slot.itemId = 'oil_bucket';
          }
          this.updateHandItem();
          if (this.onInventoryChange) this.onInventoryChange();
        }
        return true;
      }
    }

    if (activeItem && activeItem.id === 'water_bucket') {
      const placePos = this.currentHit.adjacentPos;
      this.world.setBlock(placePos.x, placePos.y, placePos.z, BlockType.WATER);
      audio.playSplash();
      this.swingHand();
      if (!this.isCreative) {
        const slot = this.hotbar[this.activeSlot];
        slot.itemId = 'bucket';
        this.updateHandItem();
        if (this.onInventoryChange) this.onInventoryChange();
      }
      return true;
    }

    if (activeItem && activeItem.id === 'lava_bucket') {
      const placePos = this.currentHit.adjacentPos;
      this.world.setBlock(placePos.x, placePos.y, placePos.z, BlockType.LAVA);
      audio.playSplash();
      this.swingHand();
      if (!this.isCreative) {
        const slot = this.hotbar[this.activeSlot];
        slot.itemId = 'bucket';
        this.updateHandItem();
        if (this.onInventoryChange) this.onInventoryChange();
      }
      return true;
    }

    if (activeItem && activeItem.id === 'oil_bucket') {
      const placePos = this.currentHit.adjacentPos;
      this.world.setBlock(placePos.x, placePos.y, placePos.z, BlockType.CRUDE_OIL);
      audio.playSplash();
      this.swingHand();
      if (!this.isCreative) {
        const slot = this.hotbar[this.activeSlot];
        slot.itemId = 'bucket';
        this.updateHandItem();
        if (this.onInventoryChange) this.onInventoryChange();
      }
      return true;
    }

    // 6. Food consumption
    if (activeItem && (activeItem.id === 'apple' || activeItem.id === 'porkchop' || activeItem.id === 'raw_fish')) {
      const hungerAmount = activeItem.id === 'porkchop' ? 40 : activeItem.id === 'raw_fish' ? 20 : 25;
      this.eatFood(hungerAmount);
      this.swingHand();
      return true;
    }

    // 7. Block placement
    if (!activeItem || !activeItem.isBlock || activeItem.blockType === undefined) {
      return false;
    }

    const placePos = this.currentHit.adjacentPos;

    // Cannot place inside player's body
    const pMinX = this.physics.position.x - 0.3;
    const pMaxX = this.physics.position.x + 0.3;
    const pMinY = this.physics.position.y;
    const pMaxY = this.physics.position.y + 1.8;
    const pMinZ = this.physics.position.z - 0.3;
    const pMaxZ = this.physics.position.z + 0.3;

    if (
      placePos.x + 1 > pMinX && placePos.x < pMaxX &&
      placePos.y + 1 > pMinY && placePos.y < pMaxY &&
      placePos.z + 1 > pMinZ && placePos.z < pMaxZ
    ) {
      return false; // Player is inside
    }

    // Door placement (occupies 2 blocks vertically: bottom + top)
    if (isDoor(activeItem.blockType)) {
      const bottomType = isDoorBottom(activeItem.blockType) ? activeItem.blockType : ((activeItem.blockType - 1) as BlockType);
      const topType = getDoorTopType(bottomType);
      const topY = placePos.y + 1;
      if (topY >= Y_MAX) return false;
      const aboveBlock = this.world.getBlock(placePos.x, topY, placePos.z);
      if (aboveBlock !== BlockType.AIR) return false;

      // Check collision for top door block with player
      if (
        placePos.x + 1 > pMinX && placePos.x < pMaxX &&
        topY + 1 > pMinY && topY < pMaxY &&
        placePos.z + 1 > pMinZ && placePos.z < pMaxZ
      ) {
        return false;
      }

      this.world.setBlock(placePos.x, placePos.y, placePos.z, bottomType);
      this.world.setBlock(placePos.x, topY, placePos.z, topType);
      audio.playPlace(bottomType);
      this.swingHand();

      if (!this.isCreative) {
        const slot = this.hotbar[this.activeSlot];
        if (slot && slot.count > 0) {
          slot.count--;
          if (slot.count <= 0) {
            slot.itemId = '';
            this.updateHandItem();
          }
          if (this.onInventoryChange) this.onInventoryChange();
        }
      }
      return true;
    }

    // Place block
    this.world.setBlock(placePos.x, placePos.y, placePos.z, activeItem.blockType);
    audio.playPlace(activeItem.blockType);
    this.swingHand();
    this.circuit.propagateSignals((pos) => this.explodeTNT(pos));

    // Deduct from hotbar in Survival
    if (!this.isCreative) {
      const slot = this.hotbar[this.activeSlot];
      if (slot && slot.count > 0) {
        slot.count--;
        if (slot.count <= 0) {
          slot.itemId = '';
          this.updateHandItem();
        }
        if (this.onInventoryChange) this.onInventoryChange();
      }
    }

    return true;
  }

  private explodeTNT(pos: THREE.Vector3) {
    audio.playExplosion();
    this.world.setBlock(pos.x, pos.y, pos.z, BlockType.AIR);

    const radius = 3;
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (dx * dx + dy * dy + dz * dz <= radius * radius) {
            const bx = pos.x + dx;
            const by = pos.y + dy;
            const bz = pos.z + dz;
            const b = this.world.getBlock(bx, by, bz);
            if (b !== BlockType.AIR && b !== BlockType.BEDROCK) {
              this.particles.spawnBlockDebris(new THREE.Vector3(bx, by, bz), b);
              this.world.setBlock(bx, by, bz, BlockType.AIR);
            }
          }
        }
      }
    }
  }

  public eatFood(amount: number) {
    this.hunger = Math.min(100, this.hunger + amount);
    this.health = Math.min(100, this.health + 10);
    audio.playDig(BlockType.WOOD);
    if (!this.isCreative) {
      const slot = this.hotbar[this.activeSlot];
      if (slot && slot.count > 0) {
        slot.count--;
        if (slot.count <= 0) slot.itemId = '';
        if (this.onInventoryChange) this.onInventoryChange();
      }
    }
    if (this.onHealthChange) this.onHealthChange(this.health);
  }

  public takeDamage(amount: number) {
    if (this.isCreative) return;
    const defense = this.getTotalArmorDefense(); // 0 to 20 points
    // Up to 80% damage reduction for full diamond armor (4% per armor point)
    const reduction = Math.min(0.80, defense * 0.04);
    const actualDamage = Math.max(1, Math.round(amount * (1 - reduction)));
    this.health = Math.max(0, this.health - actualDamage);
    if (this.onHealthChange) this.onHealthChange(this.health);
  }

  public respawn() {
    this.health = 100;
    this.hunger = 100;
    this.air = 100;
    const px = Math.floor(this.physics.position.x);
    const pz = Math.floor(this.physics.position.z);
    let sy = this.findSafeSpawnY(px, pz);
    if (sy < SEA_LEVEL) {
      sy = this.findSafeSpawnY(0, 0);
      this.physics.position.set(0.5, sy, 0.5);
    } else {
      this.physics.position.y = sy;
    }
    this.physics.velocity.set(0, 0, 0);
    this.camera.position.set(this.physics.position.x, this.physics.position.y + 1.62, this.physics.position.z);
    if (this.onHealthChange) this.onHealthChange(100);
  }

  // Adjust chunk render & load distance (Minecraft render distance in chunks - up to 20 chunks)
  public setRenderDistance(chunks: number) {
    const valid = Math.max(2, Math.min(20, chunks));
    this.renderDistance = valid;
    this.world.renderRadius = valid;

    // Adjust camera far plane and fog density according to render distance (Bedrock-style view distance)
    this.camera.far = Math.max(350, (valid + 2) * 16 * 2.0);
    this.camera.updateProjectionMatrix();

    if (this.scene.fog && this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.density = 0.055 / Math.sqrt(valid * 16);
    }

    if (this.physics) {
      this.world.updateInfiniteChunks(this.physics.position.x, this.physics.position.z, true);
    }

    try {
      localStorage.setItem('minecraft_render_distance', valid.toString());
    } catch {}
  }

  private updateMining(delta: number) {
    if (!this.isMining || !this.currentHit) {
      this.breakProgress = 0;
      this.breakMesh.visible = false;
      return;
    }

    this.swingHand();
    const blockType = this.currentHit.blockType;
    const blockConfig = BLOCK_CONFIGS[blockType];

    // Bedrock cannot be broken in survival
    if (blockConfig.hardness < 0 && !this.isCreative) {
      return;
    }

    const now = performance.now();
    if (now - this.lastDigSoundTime > 260) {
      this.lastDigSoundTime = now;
      audio.playDig(blockType);
      if (this.currentHit) {
        this.particles.spawnDigParticles(this.currentHit.point, this.currentHit.normal, blockType);
      }
    }

    if (this.isCreative) {
      // Instant break in creative!
      this.breakTargetBlock();
      return;
    }

    // Calculate mining speed
    const activeItem = this.getActiveItem();
    let speed = 1.0;
    if (activeItem) {
      if (activeItem.toolType === blockConfig.bestTool && activeItem.toolEfficiency) {
        speed = activeItem.toolEfficiency;
      }
    }

    const timeRequired = Math.max(0.1, blockConfig.hardness / speed);
    this.breakProgress += delta / timeRequired;

    // Visual crack stage (10 Minecraft stages: 0 to 9)
    const stage = Math.min(9, Math.max(0, Math.floor(this.breakProgress * 10)));
    this.breakMesh.visible = true;
    this.breakMesh.position.set(
      this.currentHit.blockPos.x + 0.5,
      this.currentHit.blockPos.y + 0.5,
      this.currentHit.blockPos.z + 0.5
    );
    const breakMat = this.breakMesh.material as THREE.MeshBasicMaterial;
    breakMat.map = getBreakCrackTexture(stage);
    breakMat.needsUpdate = true;

    if (this.breakProgress >= 1.0) {
      this.breakTargetBlock();
    }
  }

  private breakTargetBlock() {
    if (!this.currentHit) return;
    const hitPos = this.currentHit.blockPos;
    const blockType = this.currentHit.blockType;
    const blockConfig = BLOCK_CONFIGS[blockType];

    // Remove block
    this.world.setBlock(hitPos.x, hitPos.y, hitPos.z, BlockType.AIR);
    audio.playBreak(blockType);
    this.particles.spawnBlockDebris(hitPos, blockType);
    this.circuit.propagateSignals((pos) => this.explodeTNT(pos));

    // If door, break the connected half as well
    if (isDoor(blockType)) {
      if (isDoorBottom(blockType)) {
        this.world.setBlock(hitPos.x, hitPos.y + 1, hitPos.z, BlockType.AIR);
      } else if (isDoorTop(blockType)) {
        this.world.setBlock(hitPos.x, hitPos.y - 1, hitPos.z, BlockType.AIR);
      }
    }

    // If furnace, drop inventory contents and clean up state
    if (blockType === BlockType.FURNACE || blockType === BlockType.FURNACE_LIT) {
      const posKey = `${hitPos.x},${hitPos.y},${hitPos.z}`;
      const furnace = this.furnaces.get(posKey);
      if (furnace) {
        if (!this.isCreative) {
          if (furnace.inputSlot) this.addItemToInventory(furnace.inputSlot.itemId, furnace.inputSlot.count);
          if (furnace.fuelSlot) this.addItemToInventory(furnace.fuelSlot.itemId, furnace.fuelSlot.count);
          if (furnace.outputSlot) this.addItemToInventory(furnace.outputSlot.itemId, furnace.outputSlot.count);
        }
        this.furnaces.delete(posKey);
      }
    }

    // If storage box, drop stored items and clean up state
    if (isStorageBox(blockType) || blockType === BlockType.CHEST) {
      const posKey = `${hitPos.x},${hitPos.y},${hitPos.z}`;
      const box = this.storageBoxes.get(posKey);
      if (box && box.items) {
        if (!this.isCreative) {
          for (const item of box.items) {
            if (item.itemId && item.count > 0) {
              this.addItemToInventory(item.itemId, item.count);
            }
          }
        }
        this.storageBoxes.delete(posKey);
      }
    }

    // Drop item in survival
    if (!this.isCreative && blockConfig.drops.itemId) {
      this.addItemToInventory(blockConfig.drops.itemId, blockConfig.drops.count);
    }

    this.breakProgress = 0;
    this.breakMesh.visible = false;
  }

  private updateSky(delta: number) {
    if (this.cycleEnabled) {
      this.timeOfDay = (this.timeOfDay + this.daySpeed * delta) % 1.0;
    }

    // Sky colors:
    // 0.25 = dawn, 0.5 = noon, 0.75 = sunset, 0.0/1.0 = midnight
    const t = this.timeOfDay;
    const sunAngle = (t - 0.25) * Math.PI * 2;

    // Dynamic Sun & Moon orbit positions relative to player camera
    const orbitRadius = 240;
    const sunX = Math.cos(sunAngle) * orbitRadius;
    const sunY = Math.sin(sunAngle) * orbitRadius;
    const sunZ = Math.sin(sunAngle * 0.6) * 55; // Seasonal sun angle

    const sunWorldPos = new THREE.Vector3(
      this.camera.position.x + sunX,
      this.camera.position.y + sunY,
      this.camera.position.z + sunZ
    );

    this.sunMesh.position.copy(sunWorldPos);
    this.sunMesh.lookAt(this.camera.position);

    this.sunCoronaMesh.position.copy(sunWorldPos);
    this.sunCoronaMesh.lookAt(this.camera.position);

    // Directional light position & target (dynamic direction casts real-time shadows across the world)
    this.sunLight.position.copy(sunWorldPos);
    this.sunLight.target.position.copy(this.camera.position);
    this.sunLight.target.updateMatrixWorld();

    const moonX = -sunX;
    const moonY = -sunY;
    const moonZ = -sunZ;
    const moonWorldPos = new THREE.Vector3(
      this.camera.position.x + moonX,
      this.camera.position.y + moonY,
      this.camera.position.z + moonZ
    );
    this.moonMesh.position.copy(moonWorldPos);
    this.moonMesh.lookAt(this.camera.position);

    this.moonLight.position.copy(moonWorldPos);
    this.moonLight.target.position.copy(this.camera.position);
    this.moonLight.target.updateMatrixWorld();

    // Determine colors & shadow state
    const sunElev = Math.sin(sunAngle); // -1 to 1

    let skyColor: THREE.Color;
    let lightIntensity = 1.0;

    if (sunElev > 0.15) {
      // Day
      skyColor = new THREE.Color(0x78b5e8);
      lightIntensity = 1.2;
      this.starsGroup.visible = false;
      (this.starsGroup.material as THREE.PointsMaterial).opacity = 0;
      this.sunMesh.visible = true;
      this.sunCoronaMesh.visible = true;
      this.sunLight.castShadow = true;
    } else if (sunElev > -0.15) {
      // Sunset / Sunrise golden orange
      skyColor = new THREE.Color(0xd9753b);
      lightIntensity = 0.7;
      this.starsGroup.visible = true;
      (this.starsGroup.material as THREE.PointsMaterial).opacity = 0.25;
      this.sunMesh.visible = true;
      this.sunCoronaMesh.visible = true;
      this.sunLight.castShadow = true;
    } else {
      // Night deep navy
      skyColor = new THREE.Color(0x0c1220);
      lightIntensity = 0.25;
      this.starsGroup.visible = true;
      (this.starsGroup.material as THREE.PointsMaterial).opacity = 0.9;
      this.sunMesh.visible = false;
      this.sunCoronaMesh.visible = false;
      this.sunLight.castShadow = false;
    }

    this.scene.background = skyColor;
    if (this.scene.fog) {
      this.scene.fog.color = skyColor;
    }
    this.sunLight.intensity = Math.max(0, sunElev) * 1.35;
    this.moonLight.intensity = Math.max(0, -sunElev) * 0.40;
    this.ambientLight.intensity = lightIntensity * 0.55;
  }

  public isPlaying: boolean = true;
  private isPointerDown: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private lastTouchX: number = 0;
  private lastTouchY: number = 0;

  // Bind mouse, pointer lock, keyboard
  private bindEvents() {
    const canvas = this.renderer.domElement;

    // Pointer Lock attempt (safe fallback)
    this.requestLock = () => {
      try {
        const lockPromise = canvas.requestPointerLock() as any;
        if (lockPromise && typeof lockPromise.catch === 'function') {
          lockPromise.catch(() => {
            // Pointer lock not permitted in this frame/environment, fallback to drag look
          });
        }
      } catch (err) {
        // Fallback silently to drag-to-look
      }
    };

    canvas.addEventListener('click', (e) => {
      // If user clicks directly on canvas, try locking
      if (!this.isLocked) {
        this.requestLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === canvas;
      if (!this.isLocked) {
        this.triggerMining(false);
      }
    });

    // Mouse Movement: works in Pointer Lock AND when dragging
    window.addEventListener('mousemove', (e) => {
      if (this.isLocked) {
        this.yaw -= e.movementX * this.sensitivity;
        this.pitch -= e.movementY * this.sensitivity;
        this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
      } else if (this.isPointerDown) {
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;

        this.yaw -= dx * this.sensitivity * 1.6;
        this.pitch -= dy * this.sensitivity * 1.6;
        this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
      }
    });

    // Mouse Down / Up
    canvas.addEventListener('mousedown', (e) => {
      this.isPointerDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      if (e.button === 0) {
        // Left click: Mine / Attack
        const hitMob = this.checkMobHit();
        if (hitMob) {
          hitMob.takeDamage(this.getActiveItem()?.attackDamage || 2, this.physics.position);
          this.swingHand();
        } else {
          this.triggerMining(true);
        }
      } else if (e.button === 2) {
        // Right click: Place / Interact
        this.placeBlock();
      }
    });

    window.addEventListener('mouseup', (e) => {
      this.isPointerDown = false;
      if (e.button === 0) {
        this.triggerMining(false);
      }
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Touch look on canvas (mobile swipe to look)
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        this.lastTouchX = e.touches[0].clientX;
        this.lastTouchY = e.touches[0].clientY;
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const dx = touch.clientX - this.lastTouchX;
        const dy = touch.clientY - this.lastTouchY;
        this.lastTouchX = touch.clientX;
        this.lastTouchY = touch.clientY;

        this.yaw -= dx * this.sensitivity * 1.8;
        this.pitch -= dy * this.sensitivity * 1.8;
        this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
      }
    }, { passive: true });

    // Mouse Wheel Hotbar selection
    window.addEventListener('wheel', (e) => {
      if (e.deltaY > 0) {
        this.setActiveSlot((this.activeSlot + 1) % 9);
      } else {
        this.setActiveSlot((this.activeSlot + 8) % 9);
      }
    });

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (e.code === 'Space' || key === ' ') {
        e.preventDefault(); // Prevent page scrolling
      }

      if (e.code === 'KeyW' || key === 'w' || e.code === 'ArrowUp') this.input.forward = true;
      if (e.code === 'KeyS' || key === 's' || e.code === 'ArrowDown') this.input.backward = true;
      if (e.code === 'KeyA' || key === 'a' || e.code === 'ArrowLeft') this.input.left = true;
      if (e.code === 'KeyD' || key === 'd' || e.code === 'ArrowRight') this.input.right = true;

      // Sprint with Shift ("se pueda esprintar con el shift")
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.shiftKey) this.input.sprint = true;
      // Crouch / Dive with Ctrl
      if (e.code === 'ControlLeft' || e.code === 'ControlRight' || e.ctrlKey) this.input.crouch = true;

      if (e.code === 'Space' || key === ' ') {
        e.preventDefault(); // Prevent page scrolling
        this.input.jump = true;

        // Double Space in Creative mode to toggle flight ("en modo creativo puedas volar dondele a doble espacio")
        const now = performance.now();
        if (this.isCreative && (now - this.lastSpacePressTime < 320)) {
          this.physics.isFlying = !this.physics.isFlying;
          this.input.fly = this.physics.isFlying;
          this.physics.velocity.set(0, 0, 0);
          audio.playPop();
          this.lastSpacePressTime = 0;
        } else {
          this.lastSpacePressTime = now;
        }
      }

      if (e.code === 'KeyF' || key === 'f') {
        if (this.isCreative) {
          this.input.fly = !this.input.fly;
          this.physics.isFlying = this.input.fly;
        }
      }

      if (e.code === 'KeyC' || key === 'c') {
        this.toggleGameMode();
      }

      switch (e.code) {
        case 'Digit1': this.setActiveSlot(0); break;
        case 'Digit2': this.setActiveSlot(1); break;
        case 'Digit3': this.setActiveSlot(2); break;
        case 'Digit4': this.setActiveSlot(3); break;
        case 'Digit5': this.setActiveSlot(4); break;
        case 'Digit6': this.setActiveSlot(5); break;
        case 'Digit7': this.setActiveSlot(6); break;
        case 'Digit8': this.setActiveSlot(7); break;
        case 'Digit9': this.setActiveSlot(8); break;
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (e.code === 'KeyW' || key === 'w' || e.code === 'ArrowUp') this.input.forward = false;
      if (e.code === 'KeyS' || key === 's' || e.code === 'ArrowDown') this.input.backward = false;
      if (e.code === 'KeyA' || key === 'a' || e.code === 'ArrowLeft') this.input.left = false;
      if (e.code === 'KeyD' || key === 'd' || e.code === 'ArrowRight') this.input.right = false;
      if (e.code === 'Space' || key === ' ') this.input.jump = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.input.sprint = false;
      if (e.code === 'ControlLeft' || e.code === 'ControlRight') this.input.crouch = false;
    });

    // Reset inputs on window blur
    window.addEventListener('blur', () => {
      this.input.forward = false;
      this.input.backward = false;
      this.input.left = false;
      this.input.right = false;
      this.input.jump = false;
      this.input.crouch = false;
      this.input.sprint = false;
    });

    // Resize
    window.addEventListener('resize', () => {
      if (!this.container) return;
      this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    });
  }

  private checkMobHit(): Mob | null {
    const raycaster = new THREE.Raycaster();
    raycaster.set(this.camera.position, this.camera.getWorldDirection(new THREE.Vector3()));
    raycaster.far = 4.0;

    for (let mob of this.mobs) {
      if (mob.isDead) continue;
      const intersects = raycaster.intersectObject(mob.group, true);
      if (intersects.length > 0) {
        return mob;
      }
    }
    return null;
  }

  // Main Render & Game Loop
  public start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.renderLoop();
  }

  public stop() {
    this.isRunning = false;
  }

  private renderLoop = () => {
    if (!this.isRunning) return;
    requestAnimationFrame(this.renderLoop);

    const now = performance.now();

    // Target FPS throttling (0 = Unlimited native refresh)
    if (this.targetFps > 0) {
      const minInterval = 1000 / this.targetFps;
      const elapsed = now - this.lastFrameRenderTime;
      if (elapsed < minInterval - 0.5) {
        return;
      }
      this.lastFrameRenderTime = now - (elapsed % minInterval);
    }

    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // FPS counter
    this.frameCount++;
    this.fpsTimer += delta;
    if (this.fpsTimer >= 0.5) {
      this.currentFps = Math.round((this.frameCount / this.fpsTimer));
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    // 1. Update Physics & Player Position (passing pitch for directional swimming)
    this.physics.update(delta, this.input, this.yaw, (dmg) => this.takeDamage(dmg), this.pitch);

    // 2. Underwater drowning & oxygen resistance
    if (this.physics.headInWater && !this.isCreative) {
      // Good resistance before drowning: ~18-20 seconds of breath (100 / 5.5s)
      this.air = Math.max(0, this.air - delta * 5.5);
      if (this.air <= 0) {
        this.drownTimer += delta;
        if (this.drownTimer >= 1.25) {
          this.drownTimer = 0;
          this.takeDamage(10);
          audio.playHurt();
        }
      } else {
        this.drownTimer = 0;
      }
    } else {
      this.air = Math.min(100, this.air + delta * 35);
      this.drownTimer = 0;
    }

    // Dynamic Sprint FOV boost effect
    const targetFov = this.physics.isSprinting ? this.fov + 7 : this.fov;
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov += (targetFov - this.camera.fov) * 8.0 * delta;
      this.camera.updateProjectionMatrix();
    }

    // 3. Update Camera
    this.camera.position.set(
      this.physics.position.x,
      this.physics.position.y + 1.62,
      this.physics.position.z
    );

    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);

    // 4. Update Raycasting against Voxels
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);
    const activeItem = this.getActiveItem();
    const isHoldingBucket = activeItem?.id === 'bucket';
    this.currentHit = this.world.raycast(this.camera.position, camDir, 5.5, isHoldingBucket);

    if (this.currentHit) {
      this.targetBox.visible = true;
      this.targetBox.position.set(
        this.currentHit.blockPos.x + 0.5,
        this.currentHit.blockPos.y + 0.5,
        this.currentHit.blockPos.z + 0.5
      );
    } else {
      this.targetBox.visible = false;
    }

    // Active furnaces simulation tick (cooks ores, refines crude oil into naphtha)
    for (const furnace of this.furnaces.values()) {
      const stateChanged = furnace.tick(delta);
      if (stateChanged) {
        const [fx, fy, fz] = furnace.posKey.split(',').map(Number);
        const currBlock = this.world.getBlock(fx, fy, fz);
        if (furnace.isBurning && currBlock === BlockType.FURNACE) {
          this.world.setBlock(fx, fy, fz, BlockType.FURNACE_LIT, false);
        } else if (!furnace.isBurning && currBlock === BlockType.FURNACE_LIT) {
          this.world.setBlock(fx, fy, fz, BlockType.FURNACE, false);
        }
      }
    }

    // Dynamic handheld illumination (torch illuminates around player, lantern illuminates much more)
    const flicker = Math.sin(Date.now() * 0.008) * 0.45 + Math.cos(Date.now() * 0.019) * 0.25;
    if (activeItem && (activeItem.id === 'torch' || activeItem.blockType === BlockType.TORCH)) {
      this.playerHandLight.visible = true;
      this.playerHandLight.color.setHex(0xffaa33);
      this.playerHandLight.intensity = 7.0 + flicker;
      this.playerHandLight.distance = 26;
      this.playerHandLight.position.copy(this.camera.position);
    } else if (activeItem && (activeItem.id === 'lantern' || activeItem.blockType === BlockType.LANTERN)) {
      this.playerHandLight.visible = true;
      this.playerHandLight.color.setHex(0xfff5c0);
      this.playerHandLight.intensity = 12.0 + flicker * 0.6;
      this.playerHandLight.distance = 46;
      this.playerHandLight.position.copy(this.camera.position);
    } else {
      this.playerHandLight.visible = false;
      this.playerHandLight.intensity = 0;
    }

    // 5. Update Mining Progress
    this.updateMining(delta);

    // 6. First Person Hand animation
    if (this.isSwinging) {
      this.swingProgress += delta * (this.isMining ? 8.5 : 7.0);
      const s = Math.min(1.0, this.swingProgress);
      const swingAngle = Math.sin(s * Math.PI);
      // Realistic Minecraft first-person chop: strikes straight down & forward squarely into the target block
      this.handGroup.rotation.x = swingAngle * 1.05;
      this.handGroup.rotation.y = -swingAngle * 0.35;
      this.handGroup.rotation.z = swingAngle * 0.18;
      this.handGroup.position.z = -0.6 - swingAngle * 0.14;
      this.handGroup.position.y = -0.4 - swingAngle * 0.06;

      if (this.swingProgress >= 1.0) {
        if (this.isMining) {
          // Continuous rhythmic mining chop loop
          this.swingProgress = 0;
        } else {
          this.isSwinging = false;
          this.handGroup.rotation.set(0, 0, 0);
          this.handGroup.position.set(0.45, -0.4, -0.6);
        }
      }
    } else {
      // Gentle idle breathing sway
      const idle = Math.sin(now * 0.003) * 0.015;
      this.handGroup.position.set(0.45, -0.4 + idle, -0.6);
      this.handGroup.rotation.set(0, 0, 0);
    }

    // 7. Update Infinite Chunks Streaming
    this.world.updateInfiniteChunks(this.physics.position.x, this.physics.position.z);

    // Reactive Fluid Physics (water/lava flow & reaction) & Grass Spreading
    this.world.updateFluids(delta, (pos) => this.particles.spawnBlockDebris(pos, BlockType.OBSIDIAN));
    this.world.updateGrassSpreading(delta, this.physics.position);

    // 8. Update Mobs
    this.updateInfiniteMobs(delta);

    // 9. Update Particles
    this.particles.update(delta);

    // 10. Update Clouds
    this.clouds.update(delta, this.physics.position.x, this.physics.position.z, this.timeOfDay);

    // 11. Update Sky & Day/Night
    this.updateSky(delta);

    // 12. Update Advanced Shaders (Underwater caustics, vignette, atmospheric tone, radiant sun bloom)
    const sunWorldPos = this.sunMesh.position.clone();
    const sunDir = sunWorldPos.clone().sub(this.camera.position).normalize();
    const sunDot = camDir.dot(sunDir);

    // Calculate Sun screen coordinates for dynamic Sun Glare & Bloom shader
    const projectedSun = sunWorldPos.clone().project(this.camera);
    const sunInFront = projectedSun.z < 1.0 && sunDot > 0.05;

    // Check if player or placed blocks are blocking the sun (Raycast voxel occlusion & ceiling scan)
    let isSunOccludedByBlocks = false;
    if (sunInFront && this.sunMesh.visible) {
      const camPos = this.camera.position;
      const checkSunX = Math.floor(camPos.x);
      const checkSunZ = Math.floor(camPos.z);
      const camY = Math.floor(camPos.y);

      // 1. Check overhead ceiling above camera
      for (let sy = camY + 1; sy <= Math.min(100, camY + 30); sy++) {
        const b = this.world.getBlock(checkSunX, sy, checkSunZ);
        if (b !== BlockType.AIR && BLOCK_CONFIGS[b]?.solid && !BLOCK_CONFIGS[b]?.transparent) {
          isSunOccludedByBlocks = true;
          break;
        }
      }

      // 2. Dense raycast along vector pointing directly towards the sun
      if (!isSunOccludedByBlocks) {
        const maxRayDist = 48;
        for (let dist = 0.2; dist <= maxRayDist; dist += 0.3) {
          const rx = Math.floor(camPos.x + sunDir.x * dist);
          const ry = Math.floor(camPos.y + sunDir.y * dist);
          const rz = Math.floor(camPos.z + sunDir.z * dist);
          const hitB = this.world.getBlock(rx, ry, rz);
          if (hitB !== BlockType.AIR && BLOCK_CONFIGS[hitB]?.solid && !BLOCK_CONFIGS[hitB]?.transparent) {
            isSunOccludedByBlocks = true;
            break;
          }
        }
      }
    }

    const sunScreenPos = {
      x: (projectedSun.x * 0.5 + 0.5) * window.innerWidth,
      y: (-projectedSun.y * 0.5 + 0.5) * window.innerHeight,
      visible: sunInFront && this.sunMesh.visible && !isSunOccludedByBlocks,
      intensity: isSunOccludedByBlocks ? 0 : Math.max(0, Math.sin((this.timeOfDay - 0.25) * Math.PI * 2)),
    };

    this.shaders.update(delta, this.physics.headInWater, sunDot, this.timeOfDay, sunScreenPos);

    // 13. Update Animated Water Shader (Waves, Sun Specular Highlights, Sky Fresnel Reflections)
    const skyColor = (this.scene.background as THREE.Color) || new THREE.Color(0x78b5e8);
    this.world.updateWater(delta, this.timeOfDay, sunDir, skyColor, this.camera.position);

    // 14. Render 3D Scene
    this.renderer.render(this.scene, this.camera);

    // 14. Send Stats to React HUD
    if (this.onStatsUpdate) {
      const biomeCode = this.world.getBiome(this.physics.position.x, this.physics.position.z);
      const biomeDisplayName = BIOME_NAMES[biomeCode as BiomeType] || 'Llanuras';

      this.onStatsUpdate({
        fps: this.currentFps,
        x: Math.round(this.physics.position.x * 10) / 10,
        y: Math.round(this.physics.position.y * 10) / 10,
        z: Math.round(this.physics.position.z * 10) / 10,
        targetedBlock: this.currentHit ? BLOCK_CONFIGS[this.currentHit.blockType].name : null,
        timeOfDay: this.timeOfDay,
        isFlying: this.physics.isFlying,
        biome: biomeDisplayName,
      });
    }
  }

  public toggleGameMode(): boolean {
    this.isCreative = !this.isCreative;
    if (this.isCreative) {
      this.health = 100;
      this.hunger = 100;
      this.air = 100;
    } else {
      this.physics.isFlying = false;
      this.input.fly = false;
    }
    if (this.onHealthChange) this.onHealthChange(this.health);
    return this.isCreative;
  }

  public dispose() {
    this.stop();
    if (this.shaders) this.shaders.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
