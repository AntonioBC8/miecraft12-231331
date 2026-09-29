/**
 * Minecraft Web 3D - Storage Box Modal UI
 * Supports all 4 storage tiers: Wood (27 slots), Iron (36 slots), Titanium (45 slots), Diamond (54 slots).
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine, HotbarSlot } from '../game/engine';
import { getItemIcon } from '../game/textures';
import { ITEM_REGISTRY, DEFAULT_MAX_STACK, BlockType } from '../game/constants';
import { audio } from '../game/audio';
import { X, Package, ArrowDownUp, Sparkles } from 'lucide-react';

export interface StorageBoxData {
  key: string;
  name: string;
  slots: HotbarSlot[];
  capacity: number;
  blockType: BlockType;
}

interface StorageBoxModalProps {
  engine: GameEngine | null;
  isOpen: boolean;
  boxData: StorageBoxData | null;
  onClose: () => void;
  onUpdated: () => void;
}

interface CursorStack {
  itemId: string;
  count: number;
}

export const StorageBoxModal: React.FC<StorageBoxModalProps> = ({
  engine,
  isOpen,
  boxData,
  onClose,
  onUpdated,
}) => {
  const [cursorStack, setCursorStack] = useState<CursorStack | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [, setRefreshKey] = useState<number>(0);

  const forceRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    onUpdated();
  }, [onUpdated]);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  // Keyboard navigation: Escape or E closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key.toLowerCase() === 'e') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Return held item to inventory on close
  useEffect(() => {
    if (!isOpen && cursorStack && engine) {
      engine.addItemToInventory(cursorStack.itemId, cursorStack.count);
      setCursorStack(null);
    }
  }, [isOpen, cursorStack, engine]);

  if (!isOpen || !engine || !boxData) return null;

  const { slots, capacity, name } = boxData;

  // Box Tier styling
  const isIron = capacity === 36;
  const isTitanium = capacity === 45;
  const isDiamond = capacity === 54;
  const tierColor = isDiamond
    ? 'border-cyan-400 text-cyan-300'
    : isTitanium
    ? 'border-sky-400 text-sky-300'
    : isIron
    ? 'border-slate-300 text-slate-200'
    : 'border-amber-600 text-amber-300';

  const usedSlots = slots.filter((s) => s.itemId && s.count > 0).length;

  // Click on storage slot
  const handleSlotClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const slot = slots[index];
    audio.playPop();

    // Shift click: move item between box and inventory
    if (e.shiftKey) {
      if (slot.itemId && slot.count > 0) {
        engine.addItemToInventory(slot.itemId, slot.count);
        slot.itemId = '';
        slot.count = 0;
        forceRefresh();
      }
      return;
    }

    if (!cursorStack) {
      // Pick up from slot
      if (slot.itemId && slot.count > 0) {
        if (e.button === 2) {
          // Right click: pick half
          const half = Math.ceil(slot.count / 2);
          setCursorStack({ itemId: slot.itemId, count: half });
          slot.count -= half;
          if (slot.count <= 0) slot.itemId = '';
        } else {
          // Left click: pick all
          setCursorStack({ itemId: slot.itemId, count: slot.count });
          slot.itemId = '';
          slot.count = 0;
        }
        forceRefresh();
      }
    } else {
      // Place into slot
      const maxStack = ITEM_REGISTRY[cursorStack.itemId]?.maxStack || DEFAULT_MAX_STACK;
      if (!slot.itemId || slot.count <= 0) {
        if (e.button === 2) {
          // Right click: place 1
          slot.itemId = cursorStack.itemId;
          slot.count = 1;
          if (cursorStack.count > 1) {
            setCursorStack({ ...cursorStack, count: cursorStack.count - 1 });
          } else {
            setCursorStack(null);
          }
        } else {
          // Left click: place all
          slot.itemId = cursorStack.itemId;
          slot.count = cursorStack.count;
          setCursorStack(null);
        }
        forceRefresh();
      } else if (slot.itemId === cursorStack.itemId) {
        if (e.button === 2) {
          // Right click: deposit 1
          if (slot.count < maxStack) {
            slot.count++;
            if (cursorStack.count > 1) {
              setCursorStack({ ...cursorStack, count: cursorStack.count - 1 });
            } else {
              setCursorStack(null);
            }
            forceRefresh();
          }
        } else {
          // Left click: stack
          const space = maxStack - slot.count;
          if (space > 0) {
            const transfer = Math.min(space, cursorStack.count);
            slot.count += transfer;
            if (cursorStack.count - transfer > 0) {
              setCursorStack({ ...cursorStack, count: cursorStack.count - transfer });
            } else {
              setCursorStack(null);
            }
            forceRefresh();
          }
        }
      } else {
        // Swap slots
        const temp = { itemId: slot.itemId, count: slot.count };
        slot.itemId = cursorStack.itemId;
        slot.count = cursorStack.count;
        setCursorStack(temp);
        forceRefresh();
      }
    }
  };

  // Click on player inventory slot
  const handlePlayerSlotClick = (type: 'inventory' | 'hotbar', index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetSlot = type === 'inventory' ? engine.inventory[index] : engine.hotbar[index];
    audio.playPop();

    // Shift click: move from player inventory into box
    if (e.shiftKey) {
      if (targetSlot.itemId && targetSlot.count > 0) {
        // First try to merge with existing same items
        for (const bSlot of slots) {
          if (bSlot.itemId === targetSlot.itemId) {
            const maxStack = ITEM_REGISTRY[bSlot.itemId]?.maxStack || DEFAULT_MAX_STACK;
            const space = maxStack - bSlot.count;
            if (space > 0) {
              const transfer = Math.min(space, targetSlot.count);
              bSlot.count += transfer;
              targetSlot.count -= transfer;
              if (targetSlot.count <= 0) {
                targetSlot.itemId = '';
                break;
              }
            }
          }
        }
        // Then place into empty slot
        if (targetSlot.count > 0) {
          for (const bSlot of slots) {
            if (!bSlot.itemId || bSlot.count <= 0) {
              bSlot.itemId = targetSlot.itemId;
              bSlot.count = targetSlot.count;
              targetSlot.itemId = '';
              targetSlot.count = 0;
              break;
            }
          }
        }
        engine.updateHandItem();
        forceRefresh();
      }
      return;
    }

    if (!cursorStack) {
      if (targetSlot.itemId && targetSlot.count > 0) {
        if (e.button === 2) {
          const half = Math.ceil(targetSlot.count / 2);
          setCursorStack({ itemId: targetSlot.itemId, count: half });
          targetSlot.count -= half;
          if (targetSlot.count <= 0) targetSlot.itemId = '';
        } else {
          setCursorStack({ itemId: targetSlot.itemId, count: targetSlot.count });
          targetSlot.itemId = '';
          targetSlot.count = 0;
        }
        engine.updateHandItem();
        forceRefresh();
      }
    } else {
      const maxStack = ITEM_REGISTRY[cursorStack.itemId]?.maxStack || DEFAULT_MAX_STACK;
      if (!targetSlot.itemId || targetSlot.count <= 0) {
        if (e.button === 2) {
          targetSlot.itemId = cursorStack.itemId;
          targetSlot.count = 1;
          if (cursorStack.count > 1) {
            setCursorStack({ ...cursorStack, count: cursorStack.count - 1 });
          } else {
            setCursorStack(null);
          }
        } else {
          targetSlot.itemId = cursorStack.itemId;
          targetSlot.count = cursorStack.count;
          setCursorStack(null);
        }
        engine.updateHandItem();
        forceRefresh();
      } else if (targetSlot.itemId === cursorStack.itemId) {
        const space = maxStack - targetSlot.count;
        if (space > 0) {
          const transfer = Math.min(space, cursorStack.count);
          targetSlot.count += transfer;
          if (cursorStack.count - transfer > 0) {
            setCursorStack({ ...cursorStack, count: cursorStack.count - transfer });
          } else {
            setCursorStack(null);
          }
          engine.updateHandItem();
          forceRefresh();
        }
      } else {
        const temp = { itemId: targetSlot.itemId, count: targetSlot.count };
        targetSlot.itemId = cursorStack.itemId;
        targetSlot.count = cursorStack.count;
        setCursorStack(temp);
        engine.updateHandItem();
        forceRefresh();
      }
    }
  };

  // Sort items in storage box
  const handleSortBox = () => {
    audio.playPop();
    const nonNullSlots = slots.filter((s) => s.itemId && s.count > 0);
    nonNullSlots.sort((a, b) => a.itemId.localeCompare(b.itemId));
    for (let i = 0; i < slots.length; i++) {
      if (i < nonNullSlots.length) {
        slots[i] = nonNullSlots[i];
      } else {
        slots[i] = { itemId: '', count: 0 };
      }
    }
    forceRefresh();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm select-none"
      onMouseMove={handleMouseMove}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className={`relative w-full max-w-2xl bg-zinc-900/95 border-2 ${tierColor} rounded-xl shadow-2xl p-5 text-white flex flex-col gap-4 max-h-[92vh] overflow-y-auto`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-700/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-800 rounded-lg border border-zinc-700">
              <Package className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wide flex items-center gap-2">
                {name}
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono">
                  {capacity} Ranuras
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                {usedSlots} / {capacity} ocupadas • Shift+Clic para transferir rápido
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSortBox}
              title="Ordenar Contenido"
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors"
            >
              <ArrowDownUp className="w-3.5 h-3.5" />
              Ordenar
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Storage Box Grid */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase tracking-wider">
            <span>Contenido de la Caja</span>
            <span className="text-amber-400/90 font-mono">{usedSlots} items guardados</span>
          </div>
          <div className="grid grid-cols-9 gap-1.5 p-3 bg-zinc-950/80 border border-zinc-800 rounded-lg">
            {slots.map((slot, i) => (
              <div
                key={`box-${i}`}
                onClick={(e) => handleSlotClick(i, e)}
                onContextMenu={(e) => handleSlotClick(i, e)}
                className="relative w-12 h-12 bg-zinc-800/90 border border-zinc-700/80 rounded hover:border-amber-400/80 hover:bg-zinc-700/90 transition-all cursor-pointer flex items-center justify-center group"
              >
                {slot.itemId && slot.count > 0 && (
                  <>
                    <img
                      src={getItemIcon(slot.itemId)}
                      alt={ITEM_REGISTRY[slot.itemId]?.name || slot.itemId}
                      className="w-8 h-8 object-contain pointer-events-none drop-shadow"
                    />
                    {slot.count > 1 && (
                      <span className="absolute bottom-1 right-1 text-[11px] font-bold text-white bg-black/80 px-1 rounded font-mono pointer-events-none">
                        {slot.count}
                      </span>
                    )}
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-30 pointer-events-none">
                      <div className="bg-zinc-900 border border-zinc-700 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-xl">
                        <p className="font-semibold text-amber-300">
                          {ITEM_REGISTRY[slot.itemId]?.name || slot.itemId}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono">Cantidad: {slot.count}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Player Inventory (Bag + Hotbar) */}
        <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
          <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
            <span>Inventario del Jugador</span>
          </div>

          {/* Bag grid (3 rows x 9) */}
          <div className="grid grid-cols-9 gap-1.5 p-2.5 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
            {engine.inventory.slice(0, 27).map((slot, i) => (
              <div
                key={`inv-${i}`}
                onClick={(e) => handlePlayerSlotClick('inventory', i, e)}
                onContextMenu={(e) => handlePlayerSlotClick('inventory', i, e)}
                className="relative w-12 h-12 bg-zinc-800/80 border border-zinc-700/70 rounded hover:border-sky-400 hover:bg-zinc-700/80 transition-all cursor-pointer flex items-center justify-center group"
              >
                {slot.itemId && slot.count > 0 && (
                  <>
                    <img
                      src={getItemIcon(slot.itemId)}
                      alt={ITEM_REGISTRY[slot.itemId]?.name || slot.itemId}
                      className="w-8 h-8 object-contain pointer-events-none drop-shadow"
                    />
                    {slot.count > 1 && (
                      <span className="absolute bottom-1 right-1 text-[11px] font-bold text-white bg-black/80 px-1 rounded font-mono pointer-events-none">
                        {slot.count}
                      </span>
                    )}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-30 pointer-events-none">
                      <div className="bg-zinc-900 border border-zinc-700 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-xl">
                        <p className="font-semibold text-sky-300">
                          {ITEM_REGISTRY[slot.itemId]?.name || slot.itemId}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono">Cantidad: {slot.count}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Hotbar grid (1 row x 9) */}
          <div className="grid grid-cols-9 gap-1.5 p-2.5 bg-zinc-950/90 border border-amber-500/30 rounded-lg mt-1">
            {engine.hotbar.map((slot, i) => (
              <div
                key={`hotbar-${i}`}
                onClick={(e) => handlePlayerSlotClick('hotbar', i, e)}
                onContextMenu={(e) => handlePlayerSlotClick('hotbar', i, e)}
                className={`relative w-12 h-12 bg-zinc-800 border rounded hover:border-amber-400 transition-all cursor-pointer flex items-center justify-center group ${
                  engine.activeSlot === i ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-zinc-700'
                }`}
              >
                <span className="absolute top-0.5 left-1 text-[9px] font-mono text-zinc-500 pointer-events-none">
                  {i + 1}
                </span>
                {slot.itemId && slot.count > 0 && (
                  <>
                    <img
                      src={getItemIcon(slot.itemId)}
                      alt={ITEM_REGISTRY[slot.itemId]?.name || slot.itemId}
                      className="w-8 h-8 object-contain pointer-events-none drop-shadow"
                    />
                    {slot.count > 1 && (
                      <span className="absolute bottom-1 right-1 text-[11px] font-bold text-white bg-black/80 px-1 rounded font-mono pointer-events-none">
                        {slot.count}
                      </span>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating cursor item */}
      {cursorStack && (
        <div
          className="fixed pointer-events-none z-50 flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          <img
            src={getItemIcon(cursorStack.itemId)}
            alt=""
            className="w-9 h-9 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
          />
          {cursorStack.count > 1 && (
            <span className="absolute bottom-0 right-0 text-xs font-bold text-white bg-black/85 px-1 rounded font-mono">
              {cursorStack.count}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
