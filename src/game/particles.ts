/**
 * Minecraft Web 3D - High-performance Particle System for block break debris and digging
 */
import * as THREE from 'three';
import { BlockType, BLOCK_CONFIGS } from './constants';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  floorY: number;
  initialScale: number;
}

// Cached reusable materials by hex color to eliminate GC allocations
const materialCache = new Map<number, THREE.MeshBasicMaterial>();

function getParticleMaterial(hexColor: number): THREE.MeshBasicMaterial {
  let mat = materialCache.get(hexColor);
  if (!mat) {
    mat = new THREE.MeshBasicMaterial({ color: hexColor });
    materialCache.set(hexColor, mat);
  }
  return mat;
}

// Generate color variations for block debris (e.g. ore specks, dirt specks, highlights)
function getBlockDebrisColors(blockType: BlockType): number[] {
  const baseConfig = BLOCK_CONFIGS[blockType] || BLOCK_CONFIGS[BlockType.DIRT];
  const baseColor = new THREE.Color(baseConfig.color);

  // Custom palettes for iconic blocks
  switch (blockType) {
    case BlockType.GRASS:
    case BlockType.SNOW_GRASS:
      return [0x5b8c32, 0x487028, 0x866043, 0x573d26, 0x72b03d];
    case BlockType.DIRT:
    case BlockType.COARSE_DIRT:
    case BlockType.PODZOL:
    case BlockType.MUD:
    case BlockType.PACKED_MUD:
      return [0x866043, 0x6b4a30, 0x573d26, 0x9c7453];
    case BlockType.STONE:
    case BlockType.COBBLESTONE:
    case BlockType.DEEPSLATE:
      return [0x808080, 0x949494, 0x696969, 0x5a5a5a];
    case BlockType.COAL_ORE:
    case BlockType.DEEPSLATE_COAL_ORE:
      return [0x707070, 0x222222, 0x111111, 0x505050];
    case BlockType.IRON_ORE:
    case BlockType.DEEPSLATE_IRON_ORE:
      return [0x7e7e7e, 0xd8af93, 0xb8886e, 0x626262];
    case BlockType.GOLD_ORE:
    case BlockType.DEEPSLATE_GOLD_ORE:
      return [0x7e7e7e, 0xfcee4b, 0xd4af37, 0x555555];
    case BlockType.DIAMOND_ORE:
    case BlockType.DEEPSLATE_DIAMOND_ORE:
      return [0x757575, 0x55ffff, 0x2cd5d5, 0x444444];
    case BlockType.COPPER_ORE:
    case BlockType.DEEPSLATE_COPPER_ORE:
      return [0x757575, 0xe0734c, 0x52a382, 0x454545];
    case BlockType.TITANIUM_ORE:
    case BlockType.DEEPSLATE_TITANIUM_ORE:
      return [0x656565, 0x9370db, 0xb39ddb, 0x404040];
    case BlockType.WOOD:
    case BlockType.BIRCH_WOOD:
    case BlockType.SPRUCE_WOOD:
    case BlockType.JUNGLE_WOOD:
    case BlockType.DARK_OAK_WOOD:
    case BlockType.ACACIA_WOOD:
    case BlockType.PLANKS:
      return [0x6b4423, 0x8a5d3b, 0xbc9862, 0x4a2e16];
    case BlockType.LEAVES:
    case BlockType.BIRCH_LEAVES:
    case BlockType.SPRUCE_LEAVES:
    case BlockType.JUNGLE_LEAVES:
    case BlockType.DARK_OAK_LEAVES:
    case BlockType.ACACIA_LEAVES:
      return [0x38782a, 0x2d6122, 0x4c9e37, 0x224819];
    case BlockType.SAND:
    case BlockType.SANDSTONE:
    case BlockType.RED_SAND:
    case BlockType.RED_SANDSTONE:
      return [0xdcd3a0, 0xded29b, 0xc2b781, 0xeee5b5];
    case BlockType.GRAVEL:
      return [0x888383, 0x6e6969, 0x9c9696, 0x595555];
    case BlockType.GLASS:
      return [0xe0f7fa, 0xb2ebf2, 0x80deea, 0xffffff];
    case BlockType.WATER:
    case BlockType.CRUDE_OIL:
      return [0x1a2530, 0x243242, 0x0f151c, 0x3d526b];
    case BlockType.LAVA:
      return [0xff5500, 0xff8800, 0xff2200, 0xdc3200];
    case BlockType.TNT:
      return [0xdc2626, 0xef4444, 0xfef08a, 0x1f2937];
    default: {
      // Dynamic shades: -20%, -10%, base, +10%, +20%
      const shades: number[] = [];
      for (const factor of [0.75, 0.9, 1.0, 1.15, 1.25]) {
        const c = baseColor.clone().multiplyScalar(factor);
        shades.push(c.getHex());
      }
      return shades;
    }
  }
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private scene: THREE.Scene;
  private particleGeo: THREE.BoxGeometry;
  private maxActiveParticles: number = 180;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    // Base unit box
    this.particleGeo = new THREE.BoxGeometry(1, 1, 1);
  }

  /**
   * Spawn a rich burst of block breaking debris
   */
  public spawnBlockDebris(pos: THREE.Vector3, blockType: BlockType) {
    const palette = getBlockDebrisColors(blockType);
    const count = 26; // Abundant satisfying Minecraft-style burst
    const floorY = Math.floor(pos.y);

    // Limit active particles to protect FPS
    if (this.particles.length + count > this.maxActiveParticles) {
      const removeCount = (this.particles.length + count) - this.maxActiveParticles;
      for (let i = 0; i < removeCount; i++) {
        const oldP = this.particles.shift();
        if (oldP) this.scene.remove(oldP.mesh);
      }
    }

    for (let i = 0; i < count; i++) {
      const colorHex = palette[Math.floor(Math.random() * palette.length)];
      const mat = getParticleMaterial(colorHex);
      const mesh = new THREE.Mesh(this.particleGeo, mat);

      // Random scale between 0.08 and 0.16
      const baseScale = 0.08 + Math.random() * 0.08;
      mesh.scale.setScalar(baseScale);

      // Random position inside the 1x1x1 block
      mesh.position.set(
        pos.x + 0.15 + Math.random() * 0.7,
        pos.y + 0.15 + Math.random() * 0.7,
        pos.z + 0.15 + Math.random() * 0.7
      );

      // Spherical explosion burst with upward pop
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.75;
      const speed = 2.2 + Math.random() * 3.2;

      const vel = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.cos(phi) * speed * 0.8 + 2.0, // Upward bias
        Math.sin(phi) * Math.sin(theta) * speed
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.45,
        floorY: floorY - 0.05,
        initialScale: baseScale,
      });
    }
  }

  /**
   * Spawn subtle chipping debris when hitting/mining a block
   */
  public spawnDigParticles(hitPoint: THREE.Vector3, faceNormal: THREE.Vector3, blockType: BlockType) {
    const palette = getBlockDebrisColors(blockType);
    const count = 4;

    for (let i = 0; i < count; i++) {
      const colorHex = palette[Math.floor(Math.random() * palette.length)];
      const mat = getParticleMaterial(colorHex);
      const mesh = new THREE.Mesh(this.particleGeo, mat);

      const baseScale = 0.05 + Math.random() * 0.05;
      mesh.scale.setScalar(baseScale);

      mesh.position.set(
        hitPoint.x + (Math.random() - 0.5) * 0.2,
        hitPoint.y + (Math.random() - 0.5) * 0.2,
        hitPoint.z + (Math.random() - 0.5) * 0.2
      );

      // Fly out along face normal with random divergence
      const vel = new THREE.Vector3(
        faceNormal.x * 1.8 + (Math.random() - 0.5) * 1.5,
        faceNormal.y * 1.8 + Math.random() * 1.2 + 0.6,
        faceNormal.z * 1.8 + (Math.random() - 0.5) * 1.5
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.25,
        floorY: hitPoint.y - 1.0,
        initialScale: baseScale,
      });
    }
  }

  public update(delta: number) {
    const gravity = 18; // Natural Minecraft gravity
    const safeDelta = Math.min(delta, 0.05);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += safeDelta;

      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }

      // Physics integration
      p.velocity.y -= gravity * safeDelta;
      p.mesh.position.addScaledVector(p.velocity, safeDelta);

      // Floor bounce check
      if (p.mesh.position.y <= p.floorY) {
        p.mesh.position.y = p.floorY;
        if (p.velocity.y < -0.8) {
          p.velocity.y = -p.velocity.y * 0.35; // Bounce with dampening
          p.velocity.x *= 0.65;
          p.velocity.z *= 0.65;
        } else {
          p.velocity.set(0, 0, 0); // Settled on floor
        }
      }

      // 3D Tumbling
      p.mesh.rotation.x += safeDelta * 7;
      p.mesh.rotation.y += safeDelta * 9;

      // Smooth scale-down in the last 40% of particle lifetime
      const progress = p.life / p.maxLife;
      const scaleFactor = progress > 0.6 ? Math.max(0.01, (1 - progress) / 0.4) : 1.0;
      p.mesh.scale.setScalar(p.initialScale * scaleFactor);
    }
  }

  public clear() {
    this.particles.forEach((p) => {
      this.scene.remove(p.mesh);
    });
    this.particles = [];
  }
}

