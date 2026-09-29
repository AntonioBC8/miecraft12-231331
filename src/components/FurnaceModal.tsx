/**
 * Minecraft Web 3D - Furnace Modal UI
 * Allows smelting ores and refining Crude Oil into Naphtha.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine } from '../game/engine';
import { FurnaceState } from '../game/furnace';
import { getItemIcon } from '../game/textures';
import { ITEM_REGISTRY, DEFAULT_MAX_STACK } from '../game/constants';
import { audio } from '../game/audio';
import { X, Flame, ArrowRight, Sparkles, Info } from 'lucide-react';

interface FurnaceModalProps {
  engine: GameEngine | null;
  isOpen: boolean;
  furnaceState: FurnaceState | null;
  onClose: () => void;
  onUpdated: () => void;
}

interface CursorStack {
  itemId: string;
  count: number;
}

export const FurnaceModal: React.FC<FurnaceModalProps> = ({
  engine,
  isOpen,
  furnaceState,
  onClose,
  onUpdated,
}) => {
  const [cursorStack, setCursorStack] = useState<CursorStack | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [, setTickKey] = useState<number>(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  // Live update ticker for furnace burn & cook progress
  useEffect(() => {
    if (!isOpen || !furnaceState) return;

    const interval = setInterval(() => {
      setTickKey((k) => k + 1);
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, furnaceState]);

  if (!isOpen || !engine || !furnaceState) return null;

  // Handle slot clicks
  const handleInputSlotClick = () => {
    audio.playClick();
    if (cursorStack) {
      if (!furnaceState.inputSlot) {
        furnaceState.inputSlot = { ...cursorStack };
        setCursorStack(null);
      } else if (furnaceState.inputSlot.itemId === cursorStack.itemId) {
        const canAdd = Math.min(cursorStack.count, DEFAULT_MAX_STACK - furnaceState.inputSlot.count);
        furnaceState.inputSlot.count += canAdd;
        cursorStack.count -= canAdd;
        if (cursorStack.count <= 0) setCursorStack(null);
        else setCursorStack({ ...cursorStack });
      } else {
        const temp = { ...furnaceState.inputSlot };
        furnaceState.inputSlot = { ...cursorStack };
        setCursorStack(temp);
      }
    } else if (furnaceState.inputSlot) {
      setCursorStack({ ...furnaceState.inputSlot });
      furnaceState.inputSlot = null;
    }
    onUpdated();
  };

  const handleFuelSlotClick = () => {
    audio.playClick();
    if (cursorStack) {
      if (!furnaceState.fuelSlot) {
        furnaceState.fuelSlot = { ...cursorStack };
        setCursorStack(null);
      } else if (furnaceState.fuelSlot.itemId === cursorStack.itemId) {
        const canAdd = Math.min(cursorStack.count, DEFAULT_MAX_STACK - furnaceState.fuelSlot.count);
        furnaceState.fuelSlot.count += canAdd;
        cursorStack.count -= canAdd;
        if (cursorStack.count <= 0) setCursorStack(null);
        else setCursorStack({ ...cursorStack });
      } else {
        const temp = { ...furnaceState.fuelSlot };
        furnaceState.fuelSlot = { ...cursorStack };
        setCursorStack(temp);
      }
    } else if (furnaceState.fuelSlot) {
      setCursorStack({ ...furnaceState.fuelSlot });
      furnaceState.fuelSlot = null;
    }
    onUpdated();
  };

  const handleOutputSlotClick = () => {
    if (!furnaceState.outputSlot) return;
    audio.playClick();

    if (!cursorStack) {
      setCursorStack({ ...furnaceState.outputSlot });
      furnaceState.outputSlot = null;
    } else if (cursorStack.itemId === furnaceState.outputSlot.itemId) {
      const canAdd = Math.min(furnaceState.outputSlot.count, DEFAULT_MAX_STACK - cursorStack.count);
      cursorStack.count += canAdd;
      furnaceState.outputSlot.count -= canAdd;
      if (furnaceState.outputSlot.count <= 0) furnaceState.outputSlot = null;
      setCursorStack({ ...cursorStack });
    }
    onUpdated();
  };

  const handleInventorySlotClick = (slotIdx: number, isHotbar: boolean) => {
    audio.playClick();
    const inventory = isHotbar ? engine.hotbar : engine.inventory;
    const slot = inventory[slotIdx];

    if (cursorStack) {
      if (!slot || !slot.itemId) {
        inventory[slotIdx] = { ...cursorStack };
        setCursorStack(null);
      } else if (slot.itemId === cursorStack.itemId) {
        const canAdd = Math.min(cursorStack.count, DEFAULT_MAX_STACK - slot.count);
        slot.count += canAdd;
        cursorStack.count -= canAdd;
        if (cursorStack.count <= 0) setCursorStack(null);
        else setCursorStack({ ...cursorStack });
      } else {
        const temp = { ...slot };
        inventory[slotIdx] = { ...cursorStack };
        setCursorStack(temp);
      }
    } else if (slot && slot.itemId) {
      setCursorStack({ ...slot });
      inventory[slotIdx] = { itemId: '', count: 0 };
    }
    onUpdated();
  };

  // Quick shift-click shortcut to transfer item from inventory to furnace
  const handleShiftClickInventory = (slotIdx: number, isHotbar: boolean) => {
    const inventory = isHotbar ? engine.hotbar : engine.inventory;
    const slot = inventory[slotIdx];
    if (!slot || !slot.itemId) return;

    audio.playClick();
    // If it's a fuel, try putting into fuel slot first if empty
    const isFuel = ['coal', 'wood', 'planks', 'lava_bucket', 'stick'].some((k) => slot.itemId.includes(k));
    if (isFuel && !furnaceState.fuelSlot) {
      furnaceState.fuelSlot = { ...slot };
      inventory[slotIdx] = { itemId: '', count: 0 };
    } else if (!furnaceState.inputSlot) {
      furnaceState.inputSlot = { ...slot };
      inventory[slotIdx] = { itemId: '', count: 0 };
    } else if (furnaceState.inputSlot.itemId === slot.itemId) {
      const canAdd = Math.min(slot.count, DEFAULT_MAX_STACK - furnaceState.inputSlot.count);
      furnaceState.inputSlot.count += canAdd;
      slot.count -= canAdd;
      if (slot.count <= 0) inventory[slotIdx] = { itemId: '', count: 0 };
    } else if (furnaceState.fuelSlot && furnaceState.fuelSlot.itemId === slot.itemId) {
      const canAdd = Math.min(slot.count, DEFAULT_MAX_STACK - furnaceState.fuelSlot.count);
      furnaceState.fuelSlot.count += canAdd;
      slot.count -= canAdd;
      if (slot.count <= 0) inventory[slotIdx] = { itemId: '', count: 0 };
    }
    onUpdated();
  };

  const burnProgress = furnaceState.maxBurnTime > 0
    ? (furnaceState.burnTime / furnaceState.maxBurnTime) * 100
    : 0;

  const cookProgress = furnaceState.maxCookTime > 0
    ? (furnaceState.cookTime / furnaceState.maxCookTime) * 100
    : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm select-none"
      onMouseMove={handleMouseMove}
      onClick={(e) => {
        if (e.target === e.currentTarget && cursorStack) {
          // Drop onto hotbar/inventory
          let deposited = false;
          for (let i = 0; i < engine.hotbar.length; i++) {
            if (!engine.hotbar[i]) {
              engine.hotbar[i] = cursorStack;
              setCursorStack(null);
              deposited = true;
              break;
            }
          }
          if (!deposited) {
            for (let i = 0; i < engine.inventory.length; i++) {
              if (!engine.inventory[i]) {
                engine.inventory[i] = cursorStack;
                setCursorStack(null);
                break;
              }
            }
          }
          onUpdated();
        }
      }}
    >
      <div className="relative w-[520px] bg-neutral-900/95 border-2 border-amber-600/40 rounded-2xl shadow-2xl p-6 text-neutral-100 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-700/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wide text-amber-200">Horno & Refinería</h2>
              <p className="text-xs text-neutral-400">Funde minerales y refina petróleo crudo en nafta</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (cursorStack) {
                // return to inventory
                let added = false;
                for (let i = 0; i < engine.hotbar.length; i++) {
                  if (!engine.hotbar[i]) {
                    engine.hotbar[i] = cursorStack;
                    added = true;
                    break;
                  }
                }
                if (!added) {
                  for (let i = 0; i < engine.inventory.length; i++) {
                    if (!engine.inventory[i]) {
                      engine.inventory[i] = cursorStack;
                      break;
                    }
                  }
                }
              }
              onClose();
            }}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Furnace Chamber */}
        <div className="flex items-center justify-center gap-8 py-4 px-6 bg-neutral-950/70 border border-neutral-800 rounded-xl relative">
          {/* Input & Fuel Column */}
          <div className="flex flex-col items-center gap-3">
            {/* Input Slot */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-neutral-400 mb-1">Entrada</span>
              <div
                onClick={handleInputSlotClick}
                className="w-14 h-14 bg-neutral-800/90 border-2 border-neutral-600/70 hover:border-amber-400/80 rounded-xl flex items-center justify-center cursor-pointer relative shadow-inner group transition-all"
              >
                {furnaceState.inputSlot ? (
                  <>
                    <img
                      src={getItemIcon(furnaceState.inputSlot.itemId)}
                      alt={furnaceState.inputSlot.itemId}
                      className="w-10 h-10 object-contain drop-shadow"
                    />
                    <span className="absolute bottom-1 right-1.5 text-xs font-bold bg-neutral-900/90 px-1 rounded text-white shadow">
                      {furnaceState.inputSlot.count}
                    </span>
                  </>
                ) : (
                  <span className="text-neutral-600 text-xs font-medium">Mena</span>
                )}
              </div>
            </div>

            {/* Burning Flame Graphic */}
            <div className="relative w-8 h-8 flex items-center justify-center my-0.5">
              <Flame
                className={`w-7 h-7 transition-colors duration-300 ${
                  furnaceState.isBurning ? 'text-amber-500 animate-pulse drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'text-neutral-700'
                }`}
              />
              {furnaceState.isBurning && (
                <div
                  className="absolute inset-0 bg-gradient-to-t from-transparent to-neutral-950/80 pointer-events-none transition-all duration-200"
                  style={{ height: `${100 - burnProgress}%` }}
                />
              )}
            </div>

            {/* Fuel Slot */}
            <div className="flex flex-col items-center">
              <div
                onClick={handleFuelSlotClick}
                className="w-14 h-14 bg-neutral-800/90 border-2 border-neutral-600/70 hover:border-amber-400/80 rounded-xl flex items-center justify-center cursor-pointer relative shadow-inner group transition-all"
              >
                {furnaceState.fuelSlot ? (
                  <>
                    <img
                      src={getItemIcon(furnaceState.fuelSlot.itemId)}
                      alt={furnaceState.fuelSlot.itemId}
                      className="w-10 h-10 object-contain drop-shadow"
                    />
                    <span className="absolute bottom-1 right-1.5 text-xs font-bold bg-neutral-900/90 px-1 rounded text-white shadow">
                      {furnaceState.fuelSlot.count}
                    </span>
                  </>
                ) : (
                  <span className="text-neutral-600 text-xs font-medium">Carbón</span>
                )}
              </div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 mt-1">Combustible</span>
            </div>
          </div>

          {/* Progress Arrow */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="relative w-16 h-6 bg-neutral-800 border border-neutral-700 rounded-full overflow-hidden flex items-center">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-150"
                style={{ width: `${cookProgress}%` }}
              />
              <ArrowRight className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow pointer-events-none" />
            </div>
            <span className="text-[11px] font-mono text-neutral-400">
              {Math.round(cookProgress)}%
            </span>
          </div>

          {/* Output Slot */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-amber-400 mb-1">Resultado</span>
            <div
              onClick={handleOutputSlotClick}
              className="w-16 h-16 bg-neutral-800/90 border-2 border-amber-500/80 hover:border-amber-300 rounded-xl flex items-center justify-center cursor-pointer relative shadow-inner group transition-all"
            >
              {furnaceState.outputSlot ? (
                <>
                  <img
                    src={getItemIcon(furnaceState.outputSlot.itemId)}
                    alt={furnaceState.outputSlot.itemId}
                    className="w-11 h-11 object-contain drop-shadow-md"
                  />
                  <span className="absolute bottom-1.5 right-2 text-xs font-bold bg-neutral-900/90 px-1.5 rounded text-white shadow">
                    {furnaceState.outputSlot.count}
                  </span>
                </>
              ) : (
                <Sparkles className="w-5 h-5 text-neutral-700" />
              )}
            </div>
          </div>
        </div>

        {/* Petroleum Refining Notice */}
        <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
          <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Refinamiento de Petróleo:</strong> Coloca <strong>Petróleo Crudo</strong> en la entrada con carbón o madera como combustible para refinarlo en <strong>Nafta</strong>. La Nafta se utiliza en la mesa de crafteo para sintetizar <strong>Polímero</strong>.
          </span>
        </div>

        {/* Player Inventory (Hotbar & 27 Slots) */}
        <div className="flex flex-col gap-2 pt-2 border-t border-neutral-800">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Inventario del Jugador (Shift+Clic para enviar rápido)</span>
          </div>

          {/* Hotbar (9 slots) */}
          <div className="grid grid-cols-9 gap-1.5 p-2 bg-neutral-950/60 border border-neutral-800 rounded-xl">
            {engine.hotbar.map((slot, idx) => (
              <div
                key={`hotbar-${idx}`}
                onClick={(e) => {
                  if (e.shiftKey) handleShiftClickInventory(idx, true);
                  else handleInventorySlotClick(idx, true);
                }}
                className="w-10 h-10 bg-neutral-800/90 border border-neutral-700 hover:border-amber-400/80 rounded-lg flex items-center justify-center cursor-pointer relative transition-all"
              >
                {slot && (
                  <>
                    <img
                      src={getItemIcon(slot.itemId)}
                      alt={slot.itemId}
                      className="w-7 h-7 object-contain"
                    />
                    <span className="absolute bottom-0.5 right-1 text-[10px] font-bold text-white bg-black/60 px-0.5 rounded">
                      {slot.count}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Main Inventory (27 slots) */}
          <div className="grid grid-cols-9 gap-1.5 p-2 bg-neutral-950/40 border border-neutral-800/70 rounded-xl max-h-36 overflow-y-auto">
            {engine.inventory.map((slot, idx) => (
              <div
                key={`inv-${idx}`}
                onClick={(e) => {
                  if (e.shiftKey) handleShiftClickInventory(idx, false);
                  else handleInventorySlotClick(idx, false);
                }}
                className="w-10 h-10 bg-neutral-800/60 border border-neutral-700/60 hover:border-amber-400/80 rounded-lg flex items-center justify-center cursor-pointer relative transition-all"
              >
                {slot && (
                  <>
                    <img
                      src={getItemIcon(slot.itemId)}
                      alt={slot.itemId}
                      className="w-7 h-7 object-contain"
                    />
                    <span className="absolute bottom-0.5 right-1 text-[10px] font-bold text-white bg-black/60 px-0.5 rounded">
                      {slot.count}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Cursor Stack */}
      {cursorStack && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          <img
            src={getItemIcon(cursorStack.itemId)}
            alt={cursorStack.itemId}
            className="w-9 h-9 object-contain drop-shadow-xl"
          />
          <span className="absolute -bottom-1 -right-1 text-xs font-bold text-white bg-neutral-900/90 px-1 rounded shadow">
            {cursorStack.count}
          </span>
        </div>
      )}
    </div>
  );
};
