/**
 * Minecraft Web 3D - Authentic Furnace Smelting & Refining System
 * Supports smelting metals, baking materials, and refining Crude Oil into Naphtha.
 */

export interface FurnaceSlot {
  itemId: string;
  count: number;
}

export interface SmeltingRecipe {
  input: string;
  output: string;
  outputCount: number;
  cookTime: number; // in seconds
}

export const SMELTING_RECIPES: SmeltingRecipe[] = [
  // Petroleum refining -> Naphtha
  { input: 'oil_bucket', output: 'naphtha', outputCount: 1, cookTime: 6.0 },
  { input: 'crude_oil', output: 'naphtha', outputCount: 1, cookTime: 6.0 },
  { input: 'petroleum_ore', output: 'naphtha', outputCount: 1, cookTime: 6.0 },

  // Metals
  { input: 'titanium_ore', output: 'titanium_ingot', outputCount: 1, cookTime: 7.0 },
  { input: 'deepslate_titanium_ore', output: 'titanium_ingot', outputCount: 1, cookTime: 7.0 },
  { input: 'iron_ore', output: 'iron_ingot', outputCount: 1, cookTime: 6.0 },
  { input: 'deepslate_iron_ore', output: 'iron_ingot', outputCount: 1, cookTime: 6.0 },
  { input: 'gold_ore', output: 'gold_ingot', outputCount: 1, cookTime: 6.0 },
  { input: 'deepslate_gold_ore', output: 'gold_ingot', outputCount: 1, cookTime: 6.0 },
  { input: 'raw_copper', output: 'copper_ingot', outputCount: 1, cookTime: 5.0 },
  { input: 'copper_ore', output: 'copper_ingot', outputCount: 1, cookTime: 5.0 },
  { input: 'deepslate_copper_ore', output: 'copper_ingot', outputCount: 1, cookTime: 5.0 },

  // Base blocks
  { input: 'cobblestone', output: 'stone', outputCount: 1, cookTime: 5.0 },
  { input: 'sand', output: 'glass', outputCount: 1, cookTime: 5.0 },
  { input: 'red_sand', output: 'glass', outputCount: 1, cookTime: 5.0 },
];

export const FUEL_VALUES: Record<string, number> = {
  coal: 16.0,
  wood: 6.0,
  jungle_wood: 6.0,
  spruce_wood: 6.0,
  birch_wood: 6.0,
  dark_oak_wood: 6.0,
  acacia_wood: 6.0,
  mangrove_wood: 6.0,
  cherry_wood: 6.0,
  planks: 3.0,
  spruce_planks: 3.0,
  birch_planks: 3.0,
  dark_oak_planks: 3.0,
  acacia_planks: 3.0,
  cherry_planks: 3.0,
  stick: 1.5,
  oil_bucket: 80.0,
  crude_oil: 30.0,
  lava_bucket: 100.0,
};

export class FurnaceState {
  public posKey: string;
  public inputSlot: FurnaceSlot | null = null;
  public fuelSlot: FurnaceSlot | null = null;
  public outputSlot: FurnaceSlot | null = null;

  public burnTime: number = 0;
  public maxBurnTime: number = 0;
  public cookTime: number = 0;
  public maxCookTime: number = 6.0;

  constructor(posKey: string) {
    this.posKey = posKey;
  }

  public get isBurning(): boolean {
    return this.burnTime > 0;
  }

  public tick(delta: number): boolean {
    let stateChanged = false;

    // Check if input can be smelted
    const recipe = this.getCurrentRecipe();

    // Consume fuel if needed and can smelt
    if (this.burnTime <= 0 && recipe && this.canOutput(recipe)) {
      if (this.fuelSlot && this.fuelSlot.count > 0) {
        const fuelDuration = FUEL_VALUES[this.fuelSlot.itemId] || 0;
        if (fuelDuration > 0) {
          this.burnTime = fuelDuration;
          this.maxBurnTime = fuelDuration;

          // Consume 1 fuel
          if (this.fuelSlot.itemId === 'lava_bucket' || this.fuelSlot.itemId === 'oil_bucket') {
            this.fuelSlot = { itemId: 'bucket', count: 1 };
          } else {
            this.fuelSlot.count--;
            if (this.fuelSlot.count <= 0) {
              this.fuelSlot = null;
            }
          }
          stateChanged = true;
        }
      }
    }

    // Burn timer
    if (this.burnTime > 0) {
      this.burnTime = Math.max(0, this.burnTime - delta);
      stateChanged = true;

      // Cook input item
      if (recipe && this.canOutput(recipe)) {
        this.maxCookTime = recipe.cookTime;
        this.cookTime += delta;
        if (this.cookTime >= recipe.cookTime) {
          this.cookTime = 0;
          this.smeltItem(recipe);
        }
        stateChanged = true;
      } else {
        this.cookTime = 0;
      }
    } else {
      if (this.cookTime > 0) {
        this.cookTime = Math.max(0, this.cookTime - delta * 2.0);
        stateChanged = true;
      }
    }

    return stateChanged;
  }

  private getCurrentRecipe(): SmeltingRecipe | null {
    if (!this.inputSlot || this.inputSlot.count <= 0) return null;
    return SMELTING_RECIPES.find((r) => r.input === this.inputSlot!.itemId) || null;
  }

  private canOutput(recipe: SmeltingRecipe): boolean {
    if (!this.outputSlot) return true;
    if (this.outputSlot.itemId !== recipe.output) return false;
    return this.outputSlot.count + recipe.outputCount <= 100;
  }

  private smeltItem(recipe: SmeltingRecipe) {
    if (!this.inputSlot) return;

    const wasOilBucket = this.inputSlot.itemId === 'oil_bucket';

    // Consume 1 input
    this.inputSlot.count--;
    if (this.inputSlot.count <= 0) {
      this.inputSlot = wasOilBucket ? { itemId: 'bucket', count: 1 } : null;
    }

    // Add to output
    if (!this.outputSlot) {
      this.outputSlot = { itemId: recipe.output, count: recipe.outputCount };
    } else if (this.outputSlot.itemId === recipe.output) {
      this.outputSlot.count += recipe.outputCount;
    }
  }
}
