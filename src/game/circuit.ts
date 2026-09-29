/**
 * Minecraft Web 3D - Copper Electric Cable & Signal Engine
 * Implements redstone-style signal transmission:
 * - Copper Switches provide signal when switched ON.
 * - Copper Wires conduct signal up to 15 blocks.
 * - Energized Copper Wires power Copper Lamps (emitting light).
 * - Energized Copper Wires ignite adjacent TNT.
 */
import * as THREE from 'three';
import { BlockType } from './constants';
import { World } from './world';
import { audio } from './audio';

export class CircuitManager {
  public world: World;
  public lampLights: Map<string, THREE.PointLight> = new Map();

  constructor(world: World) {
    this.world = world;
  }

  public isPowerSource(type: BlockType): boolean {
    return type === BlockType.COPPER_SWITCH_ON;
  }

  public isWire(type: BlockType): boolean {
    return type === BlockType.COPPER_WIRE || type === BlockType.COPPER_WIRE_ON;
  }

  public isLamp(type: BlockType): boolean {
    return type === BlockType.COPPER_LAMP || type === BlockType.COPPER_LAMP_ON;
  }

  public isSwitch(type: BlockType): boolean {
    return type === BlockType.COPPER_SWITCH || type === BlockType.COPPER_SWITCH_ON;
  }

  public toggleSwitch(x: number, y: number, z: number, onExplodeTNT?: (pos: THREE.Vector3) => void): boolean {
    const current = this.world.getBlock(x, y, z);
    if (current === BlockType.COPPER_SWITCH) {
      this.world.setBlock(x, y, z, BlockType.COPPER_SWITCH_ON, true);
      audio.playClick();
      this.propagateSignals(onExplodeTNT);
      return true;
    } else if (current === BlockType.COPPER_SWITCH_ON) {
      this.world.setBlock(x, y, z, BlockType.COPPER_SWITCH, true);
      audio.playClick();
      this.propagateSignals(onExplodeTNT);
      return true;
    }
    return false;
  }

  public propagateSignals(onExplodeTNT?: (pos: THREE.Vector3) => void) {
    // Find all power sources and wires in modified and nearby blocks
    const sources: { x: number; y: number; z: number }[] = [];
    const allWires: { x: number; y: number; z: number }[] = [];
    const allLamps: { x: number; y: number; z: number }[] = [];

    // Scan modified blocks
    this.world.modifiedBlocks.forEach((blockType, key) => {
      const parts = key.split(',').map(Number);
      if (parts.length === 3) {
        const [x, y, z] = parts;
        if (blockType === BlockType.COPPER_SWITCH_ON) {
          sources.push({ x, y, z });
        } else if (this.isWire(blockType)) {
          allWires.push({ x, y, z });
        } else if (this.isLamp(blockType)) {
          allLamps.push({ x, y, z });
        }
      }
    });

    // BFS Queue: { x, y, z, power: 15 }
    const queue: { x: number; y: number; z: number; power: number }[] = [];
    const poweredPositions = new Map<string, number>();

    for (const src of sources) {
      queue.push({ x: src.x, y: src.y, z: src.z, power: 15 });
      poweredPositions.set(`${src.x},${src.y},${src.z}`, 15);
    }

    const directions = [
      [1, 0, 0], [-1, 0, 0],
      [0, 1, 0], [0, -1, 0],
      [0, 0, 1], [0, 0, -1],
      // Also allow 1-block steps up and down along wires (like redstone over slopes)
      [1, 1, 0], [1, -1, 0],
      [-1, 1, 0], [-1, -1, 0],
      [0, 1, 1], [0, -1, 1],
      [0, 1, -1], [0, -1, -1],
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.power <= 0) continue;

      for (const [dx, dy, dz] of directions) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        const nz = current.z + dz;
        const nKey = `${nx},${ny},${nz}`;

        const nBlock = this.world.getBlock(nx, ny, nz);

        // Ignite TNT if adjacent to powered wire or switch
        if (nBlock === BlockType.TNT && onExplodeTNT) {
          onExplodeTNT(new THREE.Vector3(nx, ny, nz));
          continue;
        }

        // Conduct through copper wires
        if (this.isWire(nBlock)) {
          const nextPower = current.power - 1;
          const prevPower = poweredPositions.get(nKey) || 0;
          if (nextPower > prevPower) {
            poweredPositions.set(nKey, nextPower);
            queue.push({ x: nx, y: ny, z: nz, power: nextPower });
          }
        } else if (this.isLamp(nBlock)) {
          // Lamp is powered
          poweredPositions.set(nKey, current.power);
        }
      }
    }

    // Update state of all wires
    for (const wire of allWires) {
      const key = `${wire.x},${wire.y},${wire.z}`;
      const isPowered = poweredPositions.has(key);
      const targetType = isPowered ? BlockType.COPPER_WIRE_ON : BlockType.COPPER_WIRE;
      const currentType = this.world.getBlock(wire.x, wire.y, wire.z);
      if (currentType !== targetType) {
        this.world.setBlock(wire.x, wire.y, wire.z, targetType, true);
      }
    }

    // Update state of all lamps and point lights
    for (const lamp of allLamps) {
      const key = `${lamp.x},${lamp.y},${lamp.z}`;
      const isPowered = poweredPositions.has(key);
      const targetType = isPowered ? BlockType.COPPER_LAMP_ON : BlockType.COPPER_LAMP;
      const currentType = this.world.getBlock(lamp.x, lamp.y, lamp.z);

      if (currentType !== targetType) {
        this.world.setBlock(lamp.x, lamp.y, lamp.z, targetType, true);
      }

      // Dynamic warm illumination for powered lamp
      if (isPowered && !this.lampLights.has(key)) {
        const pLight = new THREE.PointLight(0xffb545, 2.8, 12);
        pLight.position.set(lamp.x + 0.5, lamp.y + 0.5, lamp.z + 0.5);
        this.world.scene.add(pLight);
        this.lampLights.set(key, pLight);
      } else if (!isPowered && this.lampLights.has(key)) {
        const pLight = this.lampLights.get(key)!;
        this.world.scene.remove(pLight);
        this.lampLights.delete(key);
      }
    }
  }

  public dispose() {
    this.lampLights.forEach((light) => {
      this.world.scene.remove(light);
    });
    this.lampLights.clear();
  }
}
