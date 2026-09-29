/**
 * Minecraft Web 3D - Modern Interactive Inventory & Equipment Modal
 * Features:
 * - 3D/Pixel Character Preview wearing equipped armor
 * - Armor Equipment System: Cuero, Hierro, Cobre, Oro, Diamante (Casco, Pechera, Pantalones, Botas)
 * - Backpack System: Mochilas (Pequeña +9, Mediana +18, Grande +27) for extra loot storage
 * - Max Stack: 100 blocks/items per slot as requested
 * - Modern dark glassmorphic UI with glowing borders, tooltips, and stats
 * - Full drag-and-drop, right-click split, shift-click auto-equip/move
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine, HotbarSlot } from '../game/engine';
import { getItemIcon } from '../game/textures';
import {
  ITEM_REGISTRY,
  ItemDefinition,
  ArmorSlot,
  ARMOR_DEFENSE,
  BACKPACK_CONFIGS,
  DEFAULT_MAX_STACK,
} from '../game/constants';
import { matchRecipe, RECIPES, CraftingRecipe } from '../game/crafting';
import { audio } from '../game/audio';
import { CharacterCanvas } from './CharacterCanvas';
import {
  X,
  Hammer,
  BookOpen,
  Sparkles,
  Shield,
  Briefcase,
  RotateCw,
  Heart,
  Flame,
  ChevronRight,
  Info,
} from 'lucide-react';

interface InventoryModalProps {
  engine: GameEngine | null;
  isOpen: boolean;
  isCraftingTable: boolean;
  onClose: () => void;
  onInventoryUpdated: () => void;
}

interface CursorStack {
  itemId: string;
  count: number;
}

interface CraftCell {
  itemId: string;
  count: number;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  engine,
  isOpen,
  isCraftingTable,
  onClose,
  onInventoryUpdated,
}) => {
  if (!isOpen || !engine) return null;

  const gridSize = isCraftingTable ? 3 : 2;

  // Crafting grid state
  const [craftGrid, setCraftGrid] = useState<(CraftCell | null)[][]>(() =>
    Array(3).fill(null).map(() => Array(3).fill(null))
  );

  // Crafting output slot
  const [craftResult, setCraftResult] = useState<{ itemId: string; count: number } | null>(null);

  // Floating cursor held stack
  const [cursorStack, setCursorStack] = useState<CursorStack | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Active tab: 'inventory' | 'recipes' | 'creative'
  const [activeTab, setActiveTab] = useState<'inventory' | 'recipes' | 'creative'>('inventory');

  // Character rotation for 3D inspection
  const [characterAngle, setCharacterAngle] = useState<number>(0);

  // Trigger state refresh for inventory/hotbar/armor slots
  const [, setRefreshKey] = useState<number>(0);
  const forceUpdate = useCallback(() => {
    setRefreshKey((k) => k + 1);
    onInventoryUpdated();
  }, [onInventoryUpdated]);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  // Recalculate crafting recipe match
  useEffect(() => {
    const stringMatrix: (string | null)[][] = Array(gridSize)
      .fill(null)
      .map((_, r) =>
        Array(gridSize)
          .fill(null)
          .map((_, c) => craftGrid[r]?.[c]?.itemId || null)
      );

    const match = matchRecipe(stringMatrix, gridSize as 2 | 3);
    setCraftResult(match);
  }, [craftGrid, gridSize]);

  // Return items on cursor or crafting grid back to player
  const returnCraftAndCursorItems = useCallback(() => {
    if (!engine) return;
    let modified = false;

    if (cursorStack && cursorStack.itemId && cursorStack.count > 0) {
      engine.addItemToInventory(cursorStack.itemId, cursorStack.count);
      setCursorStack(null);
      modified = true;
    }

    const newGrid = craftGrid.map((row) => [...row]);
    let hadItems = false;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const cell = newGrid[r][c];
        if (cell && cell.itemId && cell.count > 0) {
          engine.addItemToInventory(cell.itemId, cell.count);
          newGrid[r][c] = null;
          hadItems = true;
        }
      }
    }

    if (hadItems) {
      setCraftGrid(newGrid);
      modified = true;
    }

    if (modified) {
      forceUpdate();
    }
  }, [cursorStack, craftGrid, engine, forceUpdate]);

  const handleClose = () => {
    returnCraftAndCursorItems();
    onClose();
  };

  // Handle ESC / E keyboard closing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [returnCraftAndCursorItems, onClose]);

  // Max stack helper (Default 100 for blocks as requested)
  const getMaxStack = (itemId: string) => {
    return ITEM_REGISTRY[itemId]?.maxStack || DEFAULT_MAX_STACK;
  };

  // Click on regular inventory or hotbar slot
  const handleSlotClick = (
    e: React.MouseEvent,
    slot: HotbarSlot,
    isHotbar: boolean,
    index: number
  ) => {
    e.preventDefault();
    const isRightClick = e.button === 2;
    const isShiftClick = e.shiftKey;

    // Shift-Click: auto-equip armor, auto-equip backpack, or move between hotbar/inventory/backpack
    if (isShiftClick && slot.itemId && slot.count > 0) {
      const itemDef = ITEM_REGISTRY[slot.itemId];

      // Auto-equip armor
      if (itemDef?.armorSlot) {
        const slotType = itemDef.armorSlot;
        const currentEquipped = engine.armor[slotType];
        engine.equipArmor(slotType, slot.itemId);
        audio.playClick();
        if (currentEquipped) {
          slot.itemId = currentEquipped;
        } else {
          slot.count--;
          if (slot.count <= 0) slot.itemId = '';
        }
        forceUpdate();
        return;
      }

      // Auto-equip backpack
      if (itemDef?.backpackSlots) {
        const currentBackpack = engine.equippedBackpack;
        engine.equipBackpack(slot.itemId);
        audio.playClick();
        if (currentBackpack) {
          slot.itemId = currentBackpack;
        } else {
          slot.count--;
          if (slot.count <= 0) slot.itemId = '';
        }
        forceUpdate();
        return;
      }

      // Move between Hotbar and Main Inventory
      if (isHotbar) {
        // Move to main inventory
        const maxStack = getMaxStack(slot.itemId);
        let remaining = slot.count;
        for (let invSlot of engine.inventory) {
          if (invSlot.itemId === slot.itemId && invSlot.count < maxStack) {
            const space = maxStack - invSlot.count;
            const add = Math.min(space, remaining);
            invSlot.count += add;
            remaining -= add;
            if (remaining <= 0) break;
          }
        }
        if (remaining > 0) {
          for (let invSlot of engine.inventory) {
            if (!invSlot.itemId || invSlot.count === 0) {
              invSlot.itemId = slot.itemId;
              invSlot.count = remaining;
              remaining = 0;
              break;
            }
          }
        }
        slot.count = remaining;
        if (slot.count <= 0) slot.itemId = '';
        audio.playClick();
        forceUpdate();
        return;
      } else {
        // Move to hotbar
        const maxStack = getMaxStack(slot.itemId);
        let remaining = slot.count;
        for (let hbSlot of engine.hotbar) {
          if (hbSlot.itemId === slot.itemId && hbSlot.count < maxStack) {
            const space = maxStack - hbSlot.count;
            const add = Math.min(space, remaining);
            hbSlot.count += add;
            remaining -= add;
            if (remaining <= 0) break;
          }
        }
        if (remaining > 0) {
          for (let hbSlot of engine.hotbar) {
            if (!hbSlot.itemId || hbSlot.count === 0) {
              hbSlot.itemId = slot.itemId;
              hbSlot.count = remaining;
              remaining = 0;
              break;
            }
          }
        }
        slot.count = remaining;
        if (slot.count <= 0) slot.itemId = '';
        audio.playClick();
        forceUpdate();
        return;
      }
    }

    // Right-Click: split stack or drop 1 item
    if (isRightClick) {
      if (!cursorStack) {
        if (slot.itemId && slot.count > 0) {
          const take = Math.ceil(slot.count / 2);
          const keep = slot.count - take;
          setCursorStack({ itemId: slot.itemId, count: take });
          slot.count = keep;
          if (slot.count === 0) slot.itemId = '';
          audio.playClick();
          forceUpdate();
        }
      } else {
        const maxStack = getMaxStack(cursorStack.itemId);
        if (!slot.itemId || slot.count === 0) {
          slot.itemId = cursorStack.itemId;
          slot.count = 1;
          const nextCount = cursorStack.count - 1;
          setCursorStack(nextCount > 0 ? { ...cursorStack, count: nextCount } : null);
          audio.playClick();
          forceUpdate();
        } else if (slot.itemId === cursorStack.itemId && slot.count < maxStack) {
          slot.count += 1;
          const nextCount = cursorStack.count - 1;
          setCursorStack(nextCount > 0 ? { ...cursorStack, count: nextCount } : null);
          audio.playClick();
          forceUpdate();
        }
      }
      return;
    }

    // Left-Click: pick up stack, place stack, merge, or swap
    if (!cursorStack) {
      if (slot.itemId && slot.count > 0) {
        setCursorStack({ itemId: slot.itemId, count: slot.count });
        slot.itemId = '';
        slot.count = 0;
        audio.playClick();
        forceUpdate();
      }
    } else {
      const maxStack = getMaxStack(cursorStack.itemId);
      if (!slot.itemId || slot.count === 0) {
        slot.itemId = cursorStack.itemId;
        slot.count = cursorStack.count;
        setCursorStack(null);
        audio.playClick();
        forceUpdate();
      } else if (slot.itemId === cursorStack.itemId) {
        const space = maxStack - slot.count;
        if (space > 0) {
          const add = Math.min(space, cursorStack.count);
          slot.count += add;
          const remaining = cursorStack.count - add;
          setCursorStack(remaining > 0 ? { ...cursorStack, count: remaining } : null);
          audio.playClick();
          forceUpdate();
        }
      } else {
        const tempId = slot.itemId;
        const tempCount = slot.count;
        slot.itemId = cursorStack.itemId;
        slot.count = cursorStack.count;
        setCursorStack({ itemId: tempId, count: tempCount });
        audio.playClick();
        forceUpdate();
      }
    }
  };

  // Click on Armor Equipment slot
  const handleArmorSlotClick = (e: React.MouseEvent, armorSlot: ArmorSlot) => {
    e.preventDefault();
    const isShiftClick = e.shiftKey;
    const currentEquipped = engine.armor[armorSlot];

    // Shift click to unequip directly into inventory
    if (isShiftClick && currentEquipped) {
      engine.addItemToInventory(currentEquipped, 1);
      engine.equipArmor(armorSlot, null);
      audio.playClick();
      forceUpdate();
      return;
    }

    if (!cursorStack) {
      // Pick up equipped armor piece
      if (currentEquipped) {
        setCursorStack({ itemId: currentEquipped, count: 1 });
        engine.equipArmor(armorSlot, null);
        audio.playClick();
        forceUpdate();
      }
    } else {
      // Must match the armor slot
      const itemDef = ITEM_REGISTRY[cursorStack.itemId];
      if (itemDef?.armorSlot === armorSlot) {
        if (currentEquipped) {
          const prev = currentEquipped;
          engine.equipArmor(armorSlot, cursorStack.itemId);
          if (cursorStack.count > 1) {
            engine.addItemToInventory(prev, 1);
            setCursorStack({ ...cursorStack, count: cursorStack.count - 1 });
          } else {
            setCursorStack({ itemId: prev, count: 1 });
          }
        } else {
          engine.equipArmor(armorSlot, cursorStack.itemId);
          if (cursorStack.count > 1) {
            setCursorStack({ ...cursorStack, count: cursorStack.count - 1 });
          } else {
            setCursorStack(null);
          }
        }
        audio.playClick();
        forceUpdate();
      }
    }
  };

  // Click on Backpack Slot
  const handleBackpackSlotClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const isShiftClick = e.shiftKey;
    const currentBackpack = engine.equippedBackpack;

    if (isShiftClick && currentBackpack) {
      engine.addItemToInventory(currentBackpack, 1);
      engine.equipBackpack(null);
      audio.playClick();
      forceUpdate();
      return;
    }

    if (!cursorStack) {
      if (currentBackpack) {
        setCursorStack({ itemId: currentBackpack, count: 1 });
        engine.equipBackpack(null);
        audio.playClick();
        forceUpdate();
      }
    } else {
      const itemDef = ITEM_REGISTRY[cursorStack.itemId];
      if (itemDef?.backpackSlots) {
        if (currentBackpack) {
          const prev = currentBackpack;
          engine.equipBackpack(cursorStack.itemId);
          setCursorStack({ itemId: prev, count: 1 });
        } else {
          engine.equipBackpack(cursorStack.itemId);
          if (cursorStack.count > 1) {
            setCursorStack({ ...cursorStack, count: cursorStack.count - 1 });
          } else {
            setCursorStack(null);
          }
        }
        audio.playClick();
        forceUpdate();
      }
    }
  };

  // Click on Backpack extra loot storage slot
  const handleBackpackLootSlotClick = (e: React.MouseEvent, slotIndex: number) => {
    e.preventDefault();
    const isRightClick = e.button === 2;
    const isShiftClick = e.shiftKey;
    const slot = engine.backpack[slotIndex];
    if (!slot) return;

    if (isShiftClick && slot.itemId && slot.count > 0) {
      // Shift click: move loot to player inventory
      engine.addItemToInventory(slot.itemId, slot.count);
      slot.itemId = '';
      slot.count = 0;
      audio.playClick();
      forceUpdate();
      return;
    }

    if (isRightClick) {
      if (!cursorStack) {
        if (slot.itemId && slot.count > 0) {
          const take = Math.ceil(slot.count / 2);
          const keep = slot.count - take;
          setCursorStack({ itemId: slot.itemId, count: take });
          slot.count = keep;
          if (slot.count === 0) slot.itemId = '';
          audio.playClick();
          forceUpdate();
        }
      } else {
        const maxStack = getMaxStack(cursorStack.itemId);
        if (!slot.itemId || slot.count === 0) {
          slot.itemId = cursorStack.itemId;
          slot.count = 1;
          const nextCount = cursorStack.count - 1;
          setCursorStack(nextCount > 0 ? { ...cursorStack, count: nextCount } : null);
          audio.playClick();
          forceUpdate();
        } else if (slot.itemId === cursorStack.itemId && slot.count < maxStack) {
          slot.count += 1;
          const nextCount = cursorStack.count - 1;
          setCursorStack(nextCount > 0 ? { ...cursorStack, count: nextCount } : null);
          audio.playClick();
          forceUpdate();
        }
      }
      return;
    }

    // Left Click
    if (!cursorStack) {
      if (slot.itemId && slot.count > 0) {
        setCursorStack({ itemId: slot.itemId, count: slot.count });
        slot.itemId = '';
        slot.count = 0;
        audio.playClick();
        forceUpdate();
      }
    } else {
      const maxStack = getMaxStack(cursorStack.itemId);
      if (!slot.itemId || slot.count === 0) {
        slot.itemId = cursorStack.itemId;
        slot.count = cursorStack.count;
        setCursorStack(null);
        audio.playClick();
        forceUpdate();
      } else if (slot.itemId === cursorStack.itemId) {
        const space = maxStack - slot.count;
        if (space > 0) {
          const add = Math.min(space, cursorStack.count);
          slot.count += add;
          const remaining = cursorStack.count - add;
          setCursorStack(remaining > 0 ? { ...cursorStack, count: remaining } : null);
          audio.playClick();
          forceUpdate();
        }
      } else {
        const tempId = slot.itemId;
        const tempCount = slot.count;
        slot.itemId = cursorStack.itemId;
        slot.count = cursorStack.count;
        setCursorStack({ itemId: tempId, count: tempCount });
        audio.playClick();
        forceUpdate();
      }
    }
  };

  // Crafting Cell Click
  const handleCraftCellClick = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    const isRightClick = e.button === 2;
    const isShiftClick = e.shiftKey;
    const current = craftGrid[r][c];

    if (isShiftClick && current) {
      engine.addItemToInventory(current.itemId, current.count);
      const newGrid = craftGrid.map((row) => [...row]);
      newGrid[r][c] = null;
      setCraftGrid(newGrid);
      audio.playClick();
      forceUpdate();
      return;
    }

    if (isRightClick) {
      if (!cursorStack) {
        if (current && current.count > 0) {
          const take = Math.ceil(current.count / 2);
          const keep = current.count - take;
          setCursorStack({ itemId: current.itemId, count: take });
          const newGrid = craftGrid.map((row) => [...row]);
          newGrid[r][c] = keep > 0 ? { ...current, count: keep } : null;
          setCraftGrid(newGrid);
          audio.playClick();
        }
      } else {
        const newGrid = craftGrid.map((row) => [...row]);
        const maxStack = getMaxStack(cursorStack.itemId);
        if (!current) {
          newGrid[r][c] = { itemId: cursorStack.itemId, count: 1 };
          const nextCount = cursorStack.count - 1;
          setCursorStack(nextCount > 0 ? { ...cursorStack, count: nextCount } : null);
          setCraftGrid(newGrid);
          audio.playClick();
        } else if (current.itemId === cursorStack.itemId && current.count < maxStack) {
          newGrid[r][c] = { ...current, count: current.count + 1 };
          const nextCount = cursorStack.count - 1;
          setCursorStack(nextCount > 0 ? { ...cursorStack, count: nextCount } : null);
          setCraftGrid(newGrid);
          audio.playClick();
        }
      }
      return;
    }

    // Left Click on cell
    if (!cursorStack) {
      if (current) {
        setCursorStack({ itemId: current.itemId, count: current.count });
        const newGrid = craftGrid.map((row) => [...row]);
        newGrid[r][c] = null;
        setCraftGrid(newGrid);
        audio.playClick();
      }
    } else {
      const newGrid = craftGrid.map((row) => [...row]);
      const maxStack = getMaxStack(cursorStack.itemId);
      if (!current) {
        newGrid[r][c] = { itemId: cursorStack.itemId, count: cursorStack.count };
        setCursorStack(null);
        setCraftGrid(newGrid);
        audio.playClick();
      } else if (current.itemId === cursorStack.itemId) {
        const space = maxStack - current.count;
        if (space > 0) {
          const add = Math.min(space, cursorStack.count);
          newGrid[r][c] = { ...current, count: current.count + add };
          const remaining = cursorStack.count - add;
          setCursorStack(remaining > 0 ? { ...cursorStack, count: remaining } : null);
          setCraftGrid(newGrid);
          audio.playClick();
        }
      } else {
        const temp = { ...current };
        newGrid[r][c] = { itemId: cursorStack.itemId, count: cursorStack.count };
        setCursorStack(temp);
        setCraftGrid(newGrid);
        audio.playClick();
      }
    }
  };

  // Crafting Output Click
  const handleCraftResultClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!craftResult) return;

    const isShiftClick = e.shiftKey;
    const maxStack = getMaxStack(craftResult.itemId);

    if (isShiftClick) {
      audio.playCraft();
      let craftedTotal = 0;
      while (true) {
        const stringMatrix: (string | null)[][] = Array(gridSize)
          .fill(null)
          .map((_, r) =>
            Array(gridSize)
              .fill(null)
              .map((_, c) => craftGrid[r]?.[c]?.itemId || null)
          );
        const match = matchRecipe(stringMatrix, gridSize as 2 | 3);
        if (!match) break;

        engine.addItemToInventory(match.itemId, match.count);
        craftedTotal += match.count;

        for (let r = 0; r < gridSize; r++) {
          for (let c = 0; c < gridSize; c++) {
            const cell = craftGrid[r][c];
            if (cell) {
              cell.count -= 1;
              if (cell.count <= 0) craftGrid[r][c] = null;
            }
          }
        }
        if (craftedTotal >= maxStack * 4) break;
      }
      setCraftGrid([...craftGrid.map((row) => [...row])]);
      forceUpdate();
      return;
    }

    if (!cursorStack) {
      audio.playCraft();
      setCursorStack({ itemId: craftResult.itemId, count: craftResult.count });

      const newGrid = craftGrid.map((row) => [...row]);
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          const cell = newGrid[r][c];
          if (cell) {
            cell.count -= 1;
            if (cell.count <= 0) newGrid[r][c] = null;
          }
        }
      }
      setCraftGrid(newGrid);
      forceUpdate();
    } else if (
      cursorStack.itemId === craftResult.itemId &&
      cursorStack.count + craftResult.count <= maxStack
    ) {
      audio.playCraft();
      setCursorStack({
        ...cursorStack,
        count: cursorStack.count + craftResult.count,
      });

      const newGrid = craftGrid.map((row) => [...row]);
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          const cell = newGrid[r][c];
          if (cell) {
            cell.count -= 1;
            if (cell.count <= 0) newGrid[r][c] = null;
          }
        }
      }
      setCraftGrid(newGrid);
      forceUpdate();
    }
  };

  // Quick 1-Click craft from Recipe Book
  const handleQuickCraft = (recipe: CraftingRecipe) => {
    const neededCounts: Record<string, number> = {};
    for (let r = 0; r < recipe.gridSize; r++) {
      for (let c = 0; c < recipe.gridSize; c++) {
        const item = recipe.pattern[r]?.[c];
        if (item) {
          neededCounts[item] = (neededCounts[item] || 0) + 1;
        }
      }
    }

    // Verify player has enough ingredients
    for (const [itemId, needed] of Object.entries(neededCounts)) {
      let available = 0;
      for (const slot of engine.inventory) {
        if (slot.itemId === itemId) available += slot.count;
      }
      for (const slot of engine.hotbar) {
        if (slot.itemId === itemId) available += slot.count;
      }
      if (available < needed) {
        audio.playClick();
        return;
      }
    }

    // Deduct ingredients
    for (const [itemId, needed] of Object.entries(neededCounts)) {
      let toRemove = needed;
      for (const slot of engine.inventory) {
        if (slot.itemId === itemId && toRemove > 0) {
          const take = Math.min(slot.count, toRemove);
          slot.count -= take;
          toRemove -= take;
          if (slot.count <= 0) slot.itemId = '';
        }
      }
      for (const slot of engine.hotbar) {
        if (slot.itemId === itemId && toRemove > 0) {
          const take = Math.min(slot.count, toRemove);
          slot.count -= take;
          toRemove -= take;
          if (slot.count <= 0) slot.itemId = '';
        }
      }
    }

    engine.addItemToInventory(recipe.result.itemId, recipe.result.count);
    audio.playCraft();
    forceUpdate();
  };

  const handleCreativePick = (itemId: string) => {
    const maxStack = getMaxStack(itemId);
    engine.addItemToInventory(itemId, maxStack);
    audio.playPop();
    forceUpdate();
  };

  const totalDefense = engine.getTotalArmorDefense();
  const damageReductionPercent = Math.min(80, Math.round(totalDefense * 4));
  const equippedBackpackConfig = engine.equippedBackpack
    ? BACKPACK_CONFIGS[engine.equippedBackpack]
    : null;
  const backpackSlotCount = equippedBackpackConfig?.slots || 0;

  return (
    <div
      onMouseMove={handleMouseMove}
      onContextMenu={(e) => e.preventDefault()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 select-none font-retro overflow-y-auto"
    >
      <div className="bg-slate-900/95 border border-slate-700/80 p-5 rounded-2xl w-full max-w-4xl flex flex-col gap-4 text-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative ring-1 ring-white/10">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-minecraft text-lg text-white font-bold tracking-wide flex items-center gap-2">
                {isCraftingTable ? 'Mesa de Crafteo Avanzada' : 'Inventario & Armadura'}
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-sky-400 border border-sky-500/30 font-sans">
                  Max: 100/stack
                </span>
              </h2>
              <span className="text-xs text-slate-400 font-sans">
                {isCraftingTable ? 'Rejilla completa de 3x3' : 'Gestiona tu personaje, armadura y botín extra'}
              </span>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 font-minecraft text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>Equipo & Crafteo</span>
            </button>
            <button
              onClick={() => setActiveTab('recipes')}
              className={`px-3 py-1.5 font-minecraft text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'recipes'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Recetario</span>
            </button>
            {engine.isCreative && (
              <button
                onClick={() => setActiveTab('creative')}
                className={`px-3 py-1.5 font-minecraft text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'creative'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-slate-800/80 text-purple-300 hover:bg-slate-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Creativo</span>
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-1.5 ml-2 rounded-lg bg-slate-800 hover:bg-red-600/80 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Cerrar [E / ESC]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Equipment, Character Preview & Inventory */}
        {activeTab === 'inventory' && (
          <div className="flex flex-col gap-4">
            {/* Top Row: Character & Armor on Left, Crafting Grid on Right */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Left Column: Character Preview & Equipment Slots */}
              <div className="md:col-span-7 bg-slate-800/70 border border-slate-700/60 p-3.5 rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-minecraft text-sky-400 font-bold">
                    <Shield className="w-4 h-4 text-sky-400" />
                    <span>EQUIPAMIENTO & ESTADÍSTICAS</span>
                  </div>
                  <button
                    onClick={() => setCharacterAngle((prev) => (prev + 45) % 360)}
                    className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center gap-1 text-[11px] font-minecraft cursor-pointer"
                    title="Girar personaje 45°"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Girar</span>
                  </button>
                </div>

                <div className="flex items-center justify-around gap-2">
                  {/* Left: 4 Armor Slots */}
                  <div className="flex flex-col gap-2">
                    {/* Casco (Helmet) */}
                    <div className="flex items-center gap-2">
                      <div
                        onMouseDown={(e) => handleArmorSlotClick(e, 'helmet')}
                        className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center relative cursor-pointer transition-all ${
                          engine.armor.helmet
                            ? 'bg-slate-700 border-amber-500/80 shadow-md ring-2 ring-amber-500/30'
                            : 'bg-slate-900/80 border-slate-600 hover:border-sky-400/60'
                        }`}
                        title={
                          engine.armor.helmet
                            ? `${ARMOR_DEFENSE[engine.armor.helmet]?.name} (+${ARMOR_DEFENSE[engine.armor.helmet]?.defense} Defensa)`
                            : 'Ranura de Casco (Cuero, Cobre, Hierro, Oro, Diamante)'
                        }
                      >
                        {engine.armor.helmet ? (
                          <img
                            src={getItemIcon(engine.armor.helmet)}
                            alt={engine.armor.helmet}
                            className="w-8 h-8 pixelated pointer-events-none"
                          />
                        ) : (
                          <span className="text-xl opacity-40">🪖</span>
                        )}
                      </div>
                      <span className="text-[11px] font-minecraft text-slate-300 hidden sm:inline">
                        Casco
                      </span>
                    </div>

                    {/* Pechera / Peto (Chestplate) */}
                    <div className="flex items-center gap-2">
                      <div
                        onMouseDown={(e) => handleArmorSlotClick(e, 'chestplate')}
                        className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center relative cursor-pointer transition-all ${
                          engine.armor.chestplate
                            ? 'bg-slate-700 border-amber-500/80 shadow-md ring-2 ring-amber-500/30'
                            : 'bg-slate-900/80 border-slate-600 hover:border-sky-400/60'
                        }`}
                        title={
                          engine.armor.chestplate
                            ? `${ARMOR_DEFENSE[engine.armor.chestplate]?.name} (+${ARMOR_DEFENSE[engine.armor.chestplate]?.defense} Defensa)`
                            : 'Ranura de Pechera / Peto'
                        }
                      >
                        {engine.armor.chestplate ? (
                          <img
                            src={getItemIcon(engine.armor.chestplate)}
                            alt={engine.armor.chestplate}
                            className="w-8 h-8 pixelated pointer-events-none"
                          />
                        ) : (
                          <span className="text-xl opacity-40">🛡️</span>
                        )}
                      </div>
                      <span className="text-[11px] font-minecraft text-slate-300 hidden sm:inline">
                        Peto
                      </span>
                    </div>

                    {/* Pantalones (Leggings) */}
                    <div className="flex items-center gap-2">
                      <div
                        onMouseDown={(e) => handleArmorSlotClick(e, 'leggings')}
                        className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center relative cursor-pointer transition-all ${
                          engine.armor.leggings
                            ? 'bg-slate-700 border-amber-500/80 shadow-md ring-2 ring-amber-500/30'
                            : 'bg-slate-900/80 border-slate-600 hover:border-sky-400/60'
                        }`}
                        title={
                          engine.armor.leggings
                            ? `${ARMOR_DEFENSE[engine.armor.leggings]?.name} (+${ARMOR_DEFENSE[engine.armor.leggings]?.defense} Defensa)`
                            : 'Ranura de Pantalones'
                        }
                      >
                        {engine.armor.leggings ? (
                          <img
                            src={getItemIcon(engine.armor.leggings)}
                            alt={engine.armor.leggings}
                            className="w-8 h-8 pixelated pointer-events-none"
                          />
                        ) : (
                          <span className="text-xl opacity-40">👖</span>
                        )}
                      </div>
                      <span className="text-[11px] font-minecraft text-slate-300 hidden sm:inline">
                        Pantalón
                      </span>
                    </div>

                    {/* Botas (Boots) */}
                    <div className="flex items-center gap-2">
                      <div
                        onMouseDown={(e) => handleArmorSlotClick(e, 'boots')}
                        className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center relative cursor-pointer transition-all ${
                          engine.armor.boots
                            ? 'bg-slate-700 border-amber-500/80 shadow-md ring-2 ring-amber-500/30'
                            : 'bg-slate-900/80 border-slate-600 hover:border-sky-400/60'
                        }`}
                        title={
                          engine.armor.boots
                            ? `${ARMOR_DEFENSE[engine.armor.boots]?.name} (+${ARMOR_DEFENSE[engine.armor.boots]?.defense} Defensa)`
                            : 'Ranura de Botas'
                        }
                      >
                        {engine.armor.boots ? (
                          <img
                            src={getItemIcon(engine.armor.boots)}
                            alt={engine.armor.boots}
                            className="w-8 h-8 pixelated pointer-events-none"
                          />
                        ) : (
                          <span className="text-xl opacity-40">🥾</span>
                        )}
                      </div>
                      <span className="text-[11px] font-minecraft text-slate-300 hidden sm:inline">
                        Botas
                      </span>
                    </div>
                  </div>

                  {/* Center: Character Preview Canvas */}
                  <div className="flex flex-col items-center justify-center bg-slate-900/90 p-2 rounded-xl border border-slate-700/60 shadow-inner relative overflow-hidden">
                    <div className="absolute top-1 right-1 text-[10px] text-slate-500 font-minecraft">
                      STEVE
                    </div>
                    <CharacterCanvas armor={engine.armor} rotation={characterAngle} />
                  </div>

                  {/* Right: Backpack Slot & Stats Overview */}
                  <div className="flex flex-col gap-3 min-w-[130px]">
                    {/* Backpack Equipment Slot */}
                    <div className="flex flex-col items-center p-2 rounded-lg bg-slate-900/60 border border-slate-700/80">
                      <span className="text-[10px] font-minecraft text-amber-400 mb-1 font-bold">
                        RANURA MOCHILA
                      </span>
                      <div
                        onMouseDown={handleBackpackSlotClick}
                        className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center relative cursor-pointer transition-all ${
                          engine.equippedBackpack
                            ? 'bg-slate-700 border-amber-400 shadow-md ring-2 ring-amber-400/30'
                            : 'bg-slate-900/80 border-slate-600 hover:border-amber-400/60'
                        }`}
                        title={
                          equippedBackpackConfig
                            ? `${equippedBackpackConfig.name} (+${equippedBackpackConfig.slots} ranuras extra)`
                            : 'Ranura de Mochila (Pequeña, Mediana, Grande)'
                        }
                      >
                        {engine.equippedBackpack ? (
                          <img
                            src={getItemIcon(engine.equippedBackpack)}
                            alt={engine.equippedBackpack}
                            className="w-8 h-8 pixelated pointer-events-none"
                          />
                        ) : (
                          <Briefcase className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-300 mt-1 text-center font-minecraft">
                        {equippedBackpackConfig ? equippedBackpackConfig.name : 'Sin mochila'}
                      </span>
                    </div>

                    {/* Armor Stats Card */}
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/70 text-xs font-minecraft flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-sky-400">
                        <span>🛡️ Defensa:</span>
                        <span className="font-bold font-mono">{totalDefense}/20</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-sky-400 h-full transition-all duration-300"
                          style={{ width: `${(totalDefense / 20) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-sky-300/80">
                        -{damageReductionPercent}% Daño recibido
                      </span>

                      <div className="border-t border-slate-800 pt-1 flex items-center justify-between text-red-400">
                        <span>❤️ Salud:</span>
                        <span className="font-mono">{Math.round(engine.health)}/100</span>
                      </div>
                      <div className="flex items-center justify-between text-amber-400">
                        <span>🍗 Hambre:</span>
                        <span className="font-mono">{Math.round(engine.hunger)}/100</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Crafting Area */}
              <div className="md:col-span-5 bg-slate-800/70 border border-slate-700/60 p-3.5 rounded-xl flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-2 mb-2">
                  <span className="text-xs font-minecraft text-amber-400 font-bold flex items-center gap-1.5">
                    <Hammer className="w-4 h-4 text-amber-400" />
                    CRAFTEO ({gridSize}x{gridSize})
                  </span>
                  <span className="text-[10px] text-slate-400 font-minecraft">
                    {isCraftingTable ? 'Mesa de Crafteo' : 'Crafteo Rápido'}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-4 py-2">
                  {/* Grid */}
                  <div
                    className="grid gap-1.5 bg-slate-900/90 p-2.5 rounded-xl border border-slate-700/80"
                    style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
                  >
                    {Array.from({ length: gridSize }).map((_, r) =>
                      Array.from({ length: gridSize }).map((_, c) => {
                        const cell = craftGrid[r]?.[c];
                        return (
                          <div
                            key={`craft-${r}-${c}`}
                            onMouseDown={(e) => handleCraftCellClick(e, r, c)}
                            className="w-11 h-11 rounded-lg bg-slate-800 border border-slate-700 hover:border-amber-400 flex items-center justify-center cursor-pointer relative transition-all"
                            title={
                              cell
                                ? `${ITEM_REGISTRY[cell.itemId]?.name} (x${cell.count})`
                                : 'Coloca ingredientes'
                            }
                          >
                            {cell && cell.itemId && (
                              <>
                                <img
                                  src={getItemIcon(cell.itemId)}
                                  alt={cell.itemId}
                                  className="w-7 h-7 pixelated pointer-events-none"
                                />
                                {cell.count > 1 && (
                                  <span className="absolute bottom-0.5 right-1 font-minecraft text-[10px] text-white drop-shadow-[1px_1px_0px_#000]">
                                    {cell.count}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="text-xl font-bold text-slate-500">➔</div>

                  {/* Result Slot */}
                  <div className="flex flex-col items-center">
                    <div
                      onMouseDown={handleCraftResultClick}
                      className={`w-13 h-13 rounded-xl border-2 flex items-center justify-center relative transition-all ${
                        craftResult
                          ? 'bg-slate-800 border-amber-400 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/40 cursor-pointer animate-pulse'
                          : 'bg-slate-900/50 border-slate-700/60 opacity-50 cursor-not-allowed'
                      }`}
                      title={
                        craftResult
                          ? `${ITEM_REGISTRY[craftResult.itemId]?.name} (x${craftResult.count}) - Clic para tomar`
                          : 'Receta vacía'
                      }
                    >
                      {craftResult && (
                        <>
                          <img
                            src={getItemIcon(craftResult.itemId)}
                            alt={craftResult.itemId}
                            className="w-8 h-8 pixelated pointer-events-none"
                          />
                          {craftResult.count > 1 && (
                            <span className="absolute bottom-1 right-1.5 font-minecraft text-xs text-white drop-shadow-[1px_1px_0px_#000]">
                              {craftResult.count}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-minecraft mt-1">
                      {craftResult ? craftResult.count + 'x' : 'Resultado'}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 text-center font-sans">
                  Shift+Clic en resultado para fabricar en lote
                </div>
              </div>
            </div>

            {/* Extra Section: Mochila Loot Storage (if backpack equipped) */}
            {backpackSlotCount > 0 && (
              <div className="bg-amber-950/30 border border-amber-500/40 p-3 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-minecraft text-amber-300 font-bold flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-amber-400" />
                    BOTÍN DE LA MOCHILA ({backpackSlotCount} ranuras extra de almacenamiento)
                  </span>
                  <span className="text-[11px] text-amber-400/80 font-sans">
                    Lleva botín adicional a salvo
                  </span>
                </div>
                <div className="grid grid-cols-9 gap-1.5 bg-slate-900/90 p-2.5 rounded-lg border border-amber-500/30">
                  {Array.from({ length: backpackSlotCount }).map((_, idx) => {
                    const slot = engine.backpack[idx];
                    return (
                      <div
                        key={`backpack-slot-${idx}`}
                        onMouseDown={(e) => handleBackpackLootSlotClick(e, idx)}
                        className="w-11 h-11 rounded-lg bg-slate-800/90 border border-amber-600/40 hover:border-amber-400 flex items-center justify-center relative cursor-pointer transition-all hover:bg-slate-700"
                        title={
                          slot?.itemId
                            ? `${ITEM_REGISTRY[slot.itemId]?.name} (x${slot.count})`
                            : 'Ranura de mochila vacía'
                        }
                      >
                        {slot && slot.itemId && slot.count > 0 && (
                          <>
                            <img
                              src={getItemIcon(slot.itemId)}
                              alt={slot.itemId}
                              className="w-7 h-7 pixelated pointer-events-none"
                            />
                            {slot.count > 1 && (
                              <span className="absolute bottom-0.5 right-1 font-minecraft text-[10px] text-white drop-shadow-[1px_1px_0px_#000]">
                                {slot.count}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Middle Section: 27-slot Main Inventory */}
            <div className="bg-slate-800/70 border border-slate-700/60 p-3.5 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-minecraft text-slate-300 font-bold">
                  INVENTARIO PRINCIPAL (27 RANURAS)
                </span>
                <span className="text-[11px] text-slate-400 font-sans">
                  Hasta 100 bloques por ranura
                </span>
              </div>
              <div className="grid grid-cols-9 gap-1.5 bg-slate-900/90 p-2.5 rounded-xl border border-slate-700/80">
                {engine.inventory.map((slot, idx) => (
                  <div
                    key={`inv-${idx}`}
                    onMouseDown={(e) => handleSlotClick(e, slot, false, idx)}
                    className="w-11 h-11 rounded-lg bg-slate-800 border border-slate-700 hover:border-sky-400 flex items-center justify-center relative cursor-pointer transition-all hover:bg-slate-700"
                    title={
                      slot.itemId
                        ? `${ITEM_REGISTRY[slot.itemId]?.name} (x${slot.count})`
                        : 'Vacío'
                    }
                  >
                    {slot.itemId && slot.count > 0 && (
                      <>
                        <img
                          src={getItemIcon(slot.itemId)}
                          alt={slot.itemId}
                          className="w-7 h-7 pixelated pointer-events-none"
                        />
                        {slot.count > 1 && (
                          <span className="absolute bottom-0.5 right-1 font-minecraft text-[10px] text-white drop-shadow-[1px_1px_0px_#000]">
                            {slot.count}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Section: 9-slot Hotbar */}
            <div className="bg-slate-800/70 border border-slate-700/60 p-3.5 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-minecraft text-slate-300 font-bold">
                  BARRA RÁPIDA (ACCESO 1-9)
                </span>
                <span className="text-[11px] text-slate-400 font-sans">
                  Ranura activa en mano: #{engine.activeSlot + 1}
                </span>
              </div>
              <div className="grid grid-cols-9 gap-1.5 bg-slate-900/90 p-2.5 rounded-xl border border-slate-700/80">
                {engine.hotbar.map((slot, idx) => {
                  const isActive = idx === engine.activeSlot;
                  return (
                    <div
                      key={`hotbar-${idx}`}
                      onMouseDown={(e) => handleSlotClick(e, slot, true, idx)}
                      className={`w-11 h-11 rounded-lg flex items-center justify-center relative cursor-pointer transition-all ${
                        isActive
                          ? 'bg-slate-700 border-2 border-amber-400 shadow-md ring-2 ring-amber-400/40'
                          : 'bg-slate-800 border border-slate-700 hover:border-sky-400 hover:bg-slate-700'
                      }`}
                      title={
                        slot.itemId
                          ? `${ITEM_REGISTRY[slot.itemId]?.name} (x${slot.count})`
                          : 'Vacío'
                      }
                    >
                      <span className="absolute top-0.5 left-1 text-[9px] text-slate-400 font-minecraft opacity-60">
                        {idx + 1}
                      </span>
                      {slot.itemId && slot.count > 0 && (
                        <>
                          <img
                            src={getItemIcon(slot.itemId)}
                            alt={slot.itemId}
                            className="w-7 h-7 pixelated pointer-events-none"
                          />
                          {slot.count > 1 && (
                            <span className="absolute bottom-0.5 right-1 font-minecraft text-[10px] text-white drop-shadow-[1px_1px_0px_#000]">
                              {slot.count}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Recipe Book */}
        {activeTab === 'recipes' && (
          <div className="flex flex-col gap-3 max-h-[460px] overflow-y-auto pr-1">
            <p className="text-xs text-slate-300">
              Recetas disponibles para armaduras (cuero, cobre, hierro, oro, diamante), mochilas, cubos y herramientas:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {RECIPES.filter((r) => isCraftingTable || r.gridSize === 2).map((recipe) => {
                const itemDef = ITEM_REGISTRY[recipe.result.itemId];
                return (
                  <div
                    key={recipe.id}
                    className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 flex items-center justify-between gap-2 hover:border-slate-500 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center relative shrink-0">
                        <img
                          src={getItemIcon(recipe.result.itemId)}
                          alt={recipe.name}
                          className="w-7 h-7 pixelated"
                        />
                        {recipe.result.count > 1 && (
                          <span className="absolute bottom-0.5 right-1 font-minecraft text-[10px] text-white drop-shadow-[1px_1px_0px_#000]">
                            {recipe.result.count}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-minecraft text-xs text-white truncate">{recipe.name}</h4>
                        <span className="text-[10px] text-slate-400 block">
                          Rejilla: {recipe.gridSize}x{recipe.gridSize}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleQuickCraft(recipe)}
                      className="px-2.5 py-1 text-xs font-minecraft bg-amber-600 hover:bg-amber-500 text-white rounded-lg cursor-pointer transition-colors shrink-0"
                    >
                      Fabricar
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Creative Mode Palette */}
        {activeTab === 'creative' && engine.isCreative && (
          <div className="flex flex-col gap-3 max-h-[460px] overflow-y-auto pr-1">
            <p className="text-xs text-slate-300">
              Haz clic en cualquier bloque u objeto para obtener un stack completo de 100 unidades:
            </p>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 bg-slate-900/90 p-3 rounded-xl border border-slate-700">
              {Object.values(ITEM_REGISTRY).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleCreativePick(item.id)}
                  className="w-11 h-11 rounded-lg bg-slate-800 border border-slate-700 hover:border-purple-400 flex flex-col items-center justify-center hover:brightness-110 cursor-pointer relative group transition-all"
                  title={`${item.name} (${item.maxStack} máx)`}
                >
                  <img
                    src={getItemIcon(item.id)}
                    alt={item.name}
                    className="w-7 h-7 pixelated pointer-events-none group-hover:scale-110 transition-transform"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Controls Legend & Guide */}
        <div className="text-[11px] text-slate-400 flex flex-wrap items-center justify-between border-t border-slate-700/80 pt-2.5 gap-2 font-minecraft">
          <div className="flex items-center gap-3">
            <span>• <b>Clic Izq:</b> Mover pila / Equipar</span>
            <span>• <b>Clic Der:</b> Colocar 1 / Mitad</span>
            <span>• <b>Shift+Clic:</b> Auto-equipar armadura/mochila / Mover rápido</span>
          </div>
          <span className="text-slate-500">[E / ESC] para cerrar</span>
        </div>
      </div>

      {/* Floating Item attached to mouse cursor */}
      {cursorStack && (
        <div
          className="fixed pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          <img
            src={getItemIcon(cursorStack.itemId)}
            alt={cursorStack.itemId}
            className="w-8 h-8 pixelated drop-shadow-[2px_2px_6px_rgba(0,0,0,0.9)]"
          />
          {cursorStack.count > 1 && (
            <span className="absolute bottom-0 right-0 font-minecraft text-xs text-white font-bold drop-shadow-[1px_1px_0px_#000]">
              {cursorStack.count}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
