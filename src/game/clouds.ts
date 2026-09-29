/**
 * Minecraft Web 3D - Classic Seamless Minecraft Clouds
 * Totally grey voxel clouds without any internal gridlines
 */
import * as THREE from 'three';
import { SimplexNoise } from './simplex';

export class CloudSystem {
  public group: THREE.Group;
  private cloudMesh: THREE.Mesh;
  private noise: SimplexNoise;
  private windSpeed: number = 2.5;
  private altitude: number = 84;
  private fieldSize: number = 480;
  private cellSize: number = 15;
  private material: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene, seed: number = 8888) {
    this.noise = new SimplexNoise(seed);
    this.group = new THREE.Group();

    // Material: Crisp white translucent voxel clouds (unlit to prevent dark underside shadow squares)
    this.material = new THREE.MeshBasicMaterial({
      color: 0xffffff, // Pure crisp white
      transparent: true,
      opacity: 0.85, // Vibrant, fluffy, semi-translucent Minecraft clouds
      depthWrite: false, // Smooth alpha blending with sky and mountain vistas
      side: THREE.DoubleSide,
      fog: false,
    });

    const geometry = this.buildSeamlessCloudGeometry();
    this.cloudMesh = new THREE.Mesh(geometry, this.material);
    this.group.add(this.cloudMesh);

    this.group.position.y = this.altitude;
    scene.add(this.group);
  }

  // Generates unified cloud geometry without internal faces (no interior gridlines)
  private buildSeamlessCloudGeometry(): THREE.BufferGeometry {
    const gridCount = Math.floor(this.fieldSize / this.cellSize);
    const half = this.fieldSize / 2;
    const cloudHeight = 3.5;
    const topY = cloudHeight / 2;
    const bottomY = -cloudHeight / 2;

    // 1. Sample 2D cloud presence grid
    const grid: boolean[][] = [];
    for (let ix = 0; ix < gridCount; ix++) {
      grid[ix] = [];
      const worldX = -half + ix * this.cellSize;
      for (let iz = 0; iz < gridCount; iz++) {
        const worldZ = -half + iz * this.cellSize;
        const val = this.noise.noise2D(worldX * 0.007, worldZ * 0.007);
        grid[ix][iz] = val > 0.12;
      }
    }

    const positions: number[] = [];
    const normals: number[] = [];

    // Helper to add a quad
    const addQuad = (
      x0: number, y0: number, z0: number,
      x1: number, y1: number, z1: number,
      x2: number, y2: number, z2: number,
      x3: number, y3: number, z3: number,
      nx: number, ny: number, nz: number
    ) => {
      // Triangle 1
      positions.push(x0, y0, z0,  x1, y1, z1,  x2, y2, z2);
      normals.push(nx, ny, nz,  nx, ny, nz,  nx, ny, nz);
      // Triangle 2
      positions.push(x0, y0, z0,  x2, y2, z2,  x3, y3, z3);
      normals.push(nx, ny, nz,  nx, ny, nz,  nx, ny, nz);
    };

    // 2. Build exterior-only faces: top, bottom, and outer perimeter borders
    for (let ix = 0; ix < gridCount; ix++) {
      for (let iz = 0; iz < gridCount; iz++) {
        if (!grid[ix][iz]) continue;

        const x0 = -half + ix * this.cellSize;
        const x1 = x0 + this.cellSize;
        const z0 = -half + iz * this.cellSize;
        const z1 = z0 + this.cellSize;

        // Top face (+Y)
        addQuad(
          x0, topY, z0,
          x0, topY, z1,
          x1, topY, z1,
          x1, topY, z0,
          0, 1, 0
        );

        // Bottom face (-Y)
        addQuad(
          x0, bottomY, z1,
          x0, bottomY, z0,
          x1, bottomY, z0,
          x1, bottomY, z1,
          0, -1, 0
        );

        // North face (+Z): Only if neighbor in +Z is empty
        const hasNorthNeighbor = iz + 1 < gridCount && grid[ix][iz + 1];
        if (!hasNorthNeighbor) {
          addQuad(
            x0, bottomY, z1,
            x1, bottomY, z1,
            x1, topY, z1,
            x0, topY, z1,
            0, 0, 1
          );
        }

        // South face (-Z): Only if neighbor in -Z is empty
        const hasSouthNeighbor = iz - 1 >= 0 && grid[ix][iz - 1];
        if (!hasSouthNeighbor) {
          addQuad(
            x1, bottomY, z0,
            x0, bottomY, z0,
            x0, topY, z0,
            x1, topY, z0,
            0, 0, -1
          );
        }

        // East face (+X): Only if neighbor in +X is empty
        const hasEastNeighbor = ix + 1 < gridCount && grid[ix + 1][iz];
        if (!hasEastNeighbor) {
          addQuad(
            x1, bottomY, z1,
            x1, bottomY, z0,
            x1, topY, z0,
            x1, topY, z1,
            1, 0, 0
          );
        }

        // West face (-X): Only if neighbor in -X is empty
        const hasWestNeighbor = ix - 1 >= 0 && grid[ix - 1][iz];
        if (!hasWestNeighbor) {
          addQuad(
            x0, bottomY, z0,
            x0, bottomY, z1,
            x0, topY, z1,
            x0, topY, z0,
            -1, 0, 0
          );
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    return geo;
  }

  public update(delta: number, playerX: number, playerZ: number, timeOfDay: number) {
    const windOffset = Date.now() * 0.001 * this.windSpeed;

    // Follow player smoothly with infinite wrapping
    const half = this.fieldSize / 2;
    const wrappedX = ((playerX + windOffset) % this.fieldSize + this.fieldSize) % this.fieldSize;
    const wrappedZ = ((playerZ) % this.fieldSize + this.fieldSize) % this.fieldSize;

    this.group.position.x = playerX - (wrappedX - half);
    this.group.position.z = playerZ - (wrappedZ - half);

    // Keep clouds clear and bright matching Minecraft atmosphere
    const isNight = timeOfDay < 0.22 || timeOfDay > 0.78;
    const isSunset = (timeOfDay >= 0.22 && timeOfDay < 0.28) || (timeOfDay >= 0.72 && timeOfDay <= 0.78);
    if (isNight) {
      this.material.color.setHex(0x354055); // Soft moonlit night cloud
      this.material.opacity = 0.65;
    } else if (isSunset) {
      this.material.color.setHex(0xffcca0); // Golden sunset cloud
      this.material.opacity = 0.85;
    } else {
      this.material.color.setHex(0xffffff); // Pure bright daytime cloud
      this.material.opacity = 0.85;
    }
  }
}
