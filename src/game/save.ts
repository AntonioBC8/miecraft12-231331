/**
 * Minecraft Web 3D - Save & Load System
 * Supports localStorage persistence, autosave, and export/import
 */
import { GameEngine } from './engine';
import { BlockType } from './constants';

export interface WorldSaveData {
  version: number;
  seed: number;
  playerPos: { x: number; y: number; z: number };
  playerYaw: number;
  playerPitch: number;
  health: number;
  hunger: number;
  air: number;
  isCreative: boolean;
  activeSlot: number;
  hotbar: { itemId: string; count: number }[];
  inventory: { itemId: string; count: number }[];
  armor?: { helmet: string | null; chestplate: string | null; leggings: string | null; boots: string | null };
  backpack?: { itemId: string; count: number }[];
  equippedBackpack?: string | null;
  storageBoxes?: { posKey: string; blockType: number; items: { itemId: string; count: number }[] }[];
  timeOfDay: number;
  modifiedBlocks: [string, number][]; // [ "x,y,z", BlockType ]
  savedAt: string;
}

const SAVE_KEY = 'minecraft_3d_world_save_v1';

export class SaveManager {
  public static hasSave(): boolean {
    try {
      return localStorage.getItem(SAVE_KEY) !== null;
    } catch {
      return false;
    }
  }

  public static saveGame(engine: GameEngine): boolean {
    try {
      const modifiedBlocksArray: [string, number][] = Array.from(
        engine.world.modifiedBlocks.entries()
      );

      const saveData: WorldSaveData = {
        version: 1,
        seed: engine.world.seed,
        playerPos: {
          x: Math.round(engine.physics.position.x * 100) / 100,
          y: Math.round(engine.physics.position.y * 100) / 100,
          z: Math.round(engine.physics.position.z * 100) / 100,
        },
        playerYaw: engine.yaw,
        playerPitch: engine.pitch,
        health: engine.health,
        hunger: engine.hunger,
        air: engine.air,
        isCreative: engine.isCreative,
        activeSlot: engine.activeSlot,
        hotbar: engine.hotbar.map((s) => ({ ...s })),
        inventory: engine.inventory.map((s) => ({ ...s })),
        armor: { ...engine.armor },
        backpack: engine.backpack.map((s) => ({ ...s })),
        equippedBackpack: engine.equippedBackpack,
        storageBoxes: Array.from(engine.storageBoxes.values()).map((b) => ({
          posKey: b.posKey,
          blockType: b.blockType,
          items: b.items.map((it) => ({ ...it })),
        })),
        timeOfDay: engine.timeOfDay,
        modifiedBlocks: modifiedBlocksArray,
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      return true;
    } catch (err) {
      console.error('Failed to save game to localStorage:', err);
      return false;
    }
  }

  public static loadGame(engine: GameEngine): boolean {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data: WorldSaveData = JSON.parse(raw);
      return this.applySaveData(engine, data);
    } catch (err) {
      console.error('Failed to load save data:', err);
      return false;
    }
  }

  public static applySaveData(engine: GameEngine, data: WorldSaveData): boolean {
    try {
      // 1. Re-seed world
      engine.world.seed = data.seed;
      engine.world.noise = new (engine.world.noise.constructor as any)(data.seed);

      // 2. Clear old chunks & meshes
      engine.world.chunks.forEach((c) => {
        if (c.opaqueMesh) engine.scene.remove(c.opaqueMesh);
        if (c.transparentMesh) engine.scene.remove(c.transparentMesh);
      });
      engine.world.chunks.clear();

      // 3. Load player modifications
      engine.world.modifiedBlocks.clear();
      if (Array.isArray(data.modifiedBlocks)) {
        data.modifiedBlocks.forEach(([key, val]) => {
          engine.world.modifiedBlocks.set(key, val as BlockType);
        });
      }

      // 4. Restore player position & rotation
      let py = data.playerPos.y;
      if (py < 0 || py > 100) {
        // Upgrade from older coordinate system or underground: place safely on surface
        py = (engine as any).findSafeSpawnY(data.playerPos.x, data.playerPos.z);
      }
      engine.physics.position.set(data.playerPos.x, py, data.playerPos.z);
      engine.camera.position.set(data.playerPos.x, py + 1.62, data.playerPos.z);
      engine.physics.velocity.set(0, 0, 0);
      engine.yaw = data.playerYaw || 0;
      engine.pitch = data.playerPitch || 0;

      // 5. Restore stats & mode
      engine.health = data.health ?? 100;
      engine.hunger = data.hunger ?? 100;
      engine.air = data.air ?? 100;
      engine.isCreative = !!data.isCreative;
      engine.timeOfDay = data.timeOfDay ?? 0.35;
      engine.activeSlot = data.activeSlot ?? 0;

      // 6. Restore inventories, armor, and backpack
      if (Array.isArray(data.hotbar)) {
        engine.hotbar = data.hotbar;
      }
      if (Array.isArray(data.inventory)) {
        engine.inventory = data.inventory;
      }
      if (data.armor) {
        engine.armor = { ...data.armor };
      }
      if (Array.isArray(data.backpack)) {
        engine.backpack = data.backpack;
      }
      engine.equippedBackpack = data.equippedBackpack ?? null;

      if (Array.isArray(data.storageBoxes)) {
        engine.storageBoxes.clear();
        for (const sb of data.storageBoxes) {
          engine.storageBoxes.set(sb.posKey, {
            posKey: sb.posKey,
            blockType: sb.blockType,
            items: sb.items.map((it) => ({ ...it })),
          });
        }
      }

      // 7. Stream infinite chunks around loaded position
      engine.world.updateInfiniteChunks(data.playerPos.x, data.playerPos.z, true);
      engine.setActiveSlot(engine.activeSlot);

      if (engine.onInventoryChange) engine.onInventoryChange();
      if (engine.onHealthChange) engine.onHealthChange(engine.health);

      return true;
    } catch (err) {
      console.error('Error applying save data:', err);
      return false;
    }
  }

  public static deleteSave(): void {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (err) {
      console.error('Failed to delete save:', err);
    }
  }

  public static exportSaveFile(engine: GameEngine) {
    this.saveGame(engine);
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;

    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minecraft_mundo_seed_${engine.world.seed}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
