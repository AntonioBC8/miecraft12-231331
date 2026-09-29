/**
 * Minecraft Web 3D - Storage Crate Modal UI
 * Supports Wooden Crate (27 slots), Iron Crate (45 slots),
 * Titanium Crate (63 slots), and Diamond Crate (81 slots).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { GameEngine, StorageBoxState } from '../game/engine';
import { BlockType, getStorageBoxCapacity, getStorageBoxName, ITEM_REGISTRY, DEFAULT_MAX_STACK } from '../game/constants';
import { getItemIcon } from '../game/textures';
import { audio } from '../game/audio';
import { X, Package, ArrowDown, ArrowUp } from 'lucide-react';

interface StorageModalProps {
  engine: GameEngine | null;
  isOpen: boolean;
  posKey: string | null;
  blockType: BlockType;
  onClose: () => void;
  onUpdated: () => void;
}

interface CursorStack {
  itemId: string;
  count: number;
}

export const StorageModal: React.FC<StorageModalProps> = ({
  engine,
  isOpen,
  posKey,
  blockType,
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.code === 'Escape' || e.code === 'KeyE') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !engine || !posKey) return null;

  const storageState = engine.getOrCreateStorageBox(posKey, blockType);
  const capacity = getStorageBoxCapacity(blockType);
  const boxTitle = getStorageBoxName(blockType);

  // Return cursor items back to inventory upon closing
  const handleModalClose = () => {
    if (cursorStack && cursorStack.count > 0) {
      engine.addItemToInventory(cursorStack.itemId, cursorStack.count);
      setCursorStack(null);
    }
    onClose();
  };

  // Helper to click slot in storage crate
  const handleStorageSlotClick = (e: React.MouseEvent, slotIdx: number) => {
    e.stopPropagation();
    audio.playClick();

    const slot = storageState.items[slotIdx];

    // Shift-Click: quick-transfer to player inventory
    if (e.shiftKey) {
      if (slot && slot.itemId && slot.count > 0) {
        engine.addItemToInventory(slot.itemId, slot.count);
        slot.itemId = '';
        slot.count = 0;
        forceRefresh();
      }
      return;
    }

    // Right-click: place single item
    if (e.button === 2) {
      if (cursorStack && cursorStack.count > 0) {
        if (!slot.itemId) {
          slot.itemId = cursorStack.itemId;
          slot.count = 1;
          cursorStack.count--;
          if (cursorStack.count <= 0) setCursorStack(null);
        } else if (slot.itemId === cursorStack.itemId) {
          const max = ITEM_REGISTRY[slot.itemId]?.maxStack || DEFAULT_MAX_STACK;
          if (slot.count < max) {
            slot.count++;
            cursorStack.count--;
            if (cursorStack.count <= 0) setCursorStack(null);
          }
        }
        forceRefresh();
      }
      return;
    }

    // Left-click
    if (!cursorStack) {
      if (slot && slot.itemId && slot.count > 0) {
        setCursorStack({ itemId: slot.itemId, count: slot.count });
        slot.itemId = '';
        slot.count = 0;
      }
    } else {
      if (!slot.itemId) {
        slot.itemId = cursorStack.itemId;
        slot.count = cursorStack.count;
        setCursorStack(null);
      } else if (slot.itemId === cursorStack.itemId) {
        const max = ITEM_REGISTRY[slot.itemId]?.maxStack || DEFAULT_MAX_STACK;
        const total = slot.count + cursorStack.count;
        if (total <= max) {
          slot.count = total;
          setCursorStack(null);
        } else {
          slot.count = max;
          cursorStack.count = total - max;
        }
      } else {
        // Swap
        const temp = { itemId: slot.itemId, count: slot.count };
        slot.itemId = cursorStack.itemId;
        slot.count = cursorStack.count;
        setCursorStack(temp);
      }
    }
    forceRefresh();
  };

  // Helper to click slot in player inventory / hotbar
  const handlePlayerSlotClick = (e: React.MouseEvent, isHotbar: boolean, slotIdx: number) => {
    e.stopPropagation();
    audio.playClick();

    const targetList = isHotbar ? engine.hotbar : engine.inventory;
    const slot = targetList[slotIdx];

    // Shift-Click: quick-transfer to storage box
    if (e.shiftKey) {
      if (slot && slot.itemId && slot.count > 0) {
        // Find empty or matching slot in storage crate
        let remainder = slot.count;
        const max = ITEM_REGISTRY[slot.itemId]?.maxStack || DEFAULT_MAX_STACK;

        // 1. Try stacking into existing identical slots
        for (let i = 0; i < capacity; i++) {
          const cs = storageState.items[i];
          if (cs && cs.itemId === slot.itemId && cs.count < max) {
            const add = Math.min(remainder, max - cs.count);
            cs.count += add;
            remainder -= add;
            if (remainder <= 0) break;
          }
        }

        // 2. Put into empty slots
        if (remainder > 0) {
          for (let i = 0; i < capacity; i++) {
            const cs = storageState.items[i];
            if (!cs || !cs.itemId || cs.count <= 0) {
              storageState.items[i] = { itemId: slot.itemId, count: remainder };
              remainder = 0;
              break;
            }
          }
        }

        slot.count = remainder;
        if (slot.count <= 0) slot.itemId = '';
        if (isHotbar) engine.updateHandItem();
        forceRefresh();
      }
      return;
    }

    // Right-click: place single item
    if (e.button === 2) {
      if (cursorStack && cursorStack.count > 0) {
        if (!slot.itemId) {
          slot.itemId = cursorStack.itemId;
          slot.count = 1;
          cursorStack.count--;
          if (cursorStack.count <= 0) setCursorStack(null);
        } else if (slot.itemId === cursorStack.itemId) {
          const max = ITEM_REGISTRY[slot.itemId]?.maxStack || DEFAULT_MAX_STACK;
          if (slot.count < max) {
            slot.count++;
            cursorStack.count--;
            if (cursorStack.count <= 0) setCursorStack(null);
          }
        }
        if (isHotbar) engine.updateHandItem();
        forceRefresh();
      }
      return;
    }

    // Left-click
    if (!cursorStack) {
      if (slot && slot.itemId && slot.count > 0) {
        setCursorStack({ itemId: slot.itemId, count: slot.count });
        slot.itemId = '';
        slot.count = 0;
        if (isHotbar) engine.updateHandItem();
      }
    } else {
      if (!slot.itemId) {
        slot.itemId = cursorStack.itemId;
        slot.count = cursorStack.count;
        setCursorStack(null);
      } else if (slot.itemId === cursorStack.itemId) {
        const max = ITEM_REGISTRY[slot.itemId]?.maxStack || DEFAULT_MAX_STACK;
        const total = slot.count + cursorStack.count;
        if (total <= max) {
          slot.count = total;
          setCursorStack(null);
        } else {
          slot.count = max;
          cursorStack.count = total - max;
        }
      } else {
        const temp = { itemId: slot.itemId, count: slot.count };
        slot.itemId = cursorStack.itemId;
        slot.count = cursorStack.count;
        setCursorStack(temp);
      }
      if (isHotbar) engine.updateHandItem();
    }
    forceRefresh();
  };

  // Quick Action: Empty all items from crate into player inventory
  const handleTakeAll = () => {
    audio.playPop();
    for (let i = 0; i < capacity; i++) {
      const s = storageState.items[i];
      if (s && s.itemId && s.count > 0) {
        engine.addItemToInventory(s.itemId, s.count);
        s.itemId = '';
        s.count = 0;
      }
    }
    forceRefresh();
  };

  // Quick Action: Store all player inventory items into crate
  const handleDepositAll = () => {
    audio.playPop();
    const allSlots = [...engine.inventory, ...engine.hotbar];
    for (const slot of allSlots) {
      if (slot && slot.itemId && slot.count > 0) {
        let rem = slot.count;
        const max = ITEM_REGISTRY[slot.itemId]?.maxStack || DEFAULT_MAX_STACK;

        // Try merge
        for (let i = 0; i < capacity; i++) {
          const cs = storageState.items[i];
          if (cs && cs.itemId === slot.itemId && cs.count < max) {
            const add = Math.min(rem, max - cs.count);
            cs.count += add;
            rem -= add;
            if (rem <= 0) break;
          }
        }
        // Try empty slot
        if (rem > 0) {
          for (let i = 0; i < capacity; i++) {
            const cs = storageState.items[i];
            if (!cs || !cs.itemId || cs.count <= 0) {
              storageState.items[i] = { itemId: slot.itemId, count: rem };
              rem = 0;
              break;
            }
          }
        }
        slot.count = rem;
        if (slot.count <= 0) slot.itemId = '';
      }
    }
    engine.updateHandItem();
    forceRefresh();
  };

  // Theme header color based on crate material
  const headerTheme =
    blockType === BlockType.STORAGE_DIAMOND
      ? 'from-cyan-900 via-sky-800 to-slate-900 border-cyan-500'
      : blockType === BlockType.STORAGE_TITANIUM
      ? 'from-slate-800 via-zinc-800 to-cyan-950 border-cyan-700'
      : blockType === BlockType.STORAGE_IRON
      ? 'from-zinc-800 via-slate-700 to-zinc-900 border-zinc-400'
      : 'from-amber-900 via-stone-800 to-amber-950 border-amber-600';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm select-none"
      onMouseMove={handleMouseMove}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className={`relative w-full max-w-2xl bg-zinc-900/95 border-2 rounded-xl shadow-2xl p-5 overflow-hidden flex flex-col max-h-[92vh] ${headerTheme}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/15">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Package className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">{boxTitle}</h2>
              <p className="text-xs text-zinc-400">
                {storageState.items.filter((s) => s.itemId && s.count > 0).length} / {capacity} ranuras ocupadas • Clic para mover, Shift+Clic para transferir
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDepositAll}
              title="Depositar todo el inventario en la caja"
              className="px-2.5 py-1 text-xs font-semibold bg-emerald-600/80 hover:bg-emerald-500 text-white rounded flex items-center gap-1 transition"
            >
              <ArrowDown className="w-3.5 h-3.5" /> Depositar Todo
            </button>
            <button
              onClick={handleTakeAll}
              title="Sacar todos los objetos de la caja"
              className="px-2.5 py-1 text-xs font-semibold bg-sky-600/80 hover:bg-sky-500 text-white rounded flex items-center gap-1 transition"
            >
              <ArrowUp className="w-3.5 h-3.5" /> Vaciar Caja
            </button>
            <button
              onClick={handleModalClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-600 text-zinc-300 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Storage Crate Slots + Player Inventory */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          {/* Crate Storage Grid */}
          <div className="bg-black/40 border border-white/10 rounded-lg p-3">
            <div className="text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider flex items-center justify-between">
              <span>Almacenamiento ({capacity} Ranuras)</span>
            </div>
            <div className="grid grid-cols-9 gap-1.5 justify-center">
              {Array.from({ length: capacity }).map((_, idx) => {
                const slot = storageState.items[idx] || { itemId: '', count: 0 };
                const itemDef = slot.itemId ? ITEM_REGISTRY[slot.itemId] : null;
                const icon = slot.itemId ? getItemIcon(slot.itemId) : null;

                return (
                  <div
                    key={`crate-${idx}`}
                    onMouseDown={(e) => handleStorageSlotClick(e, idx)}
                    className="relative w-12 h-12 bg-zinc-800/90 border border-zinc-700/80 hover:border-amber-400/90 rounded flex items-center justify-center cursor-pointer transition shadow-inner group"
                    title={itemDef ? `${itemDef.name} (${slot.count})` : undefined}
                  >
                    {icon && (
                      <img
                        src={icon}
                        alt={itemDef?.name || slot.itemId}
                        className="w-8 h-8 object-contain pointer-events-none drop-shadow"
                      />
                    )}
                    {slot.count > 1 && (
                      <span className="absolute bottom-0.5 right-1 text-[11px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
                        {slot.count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Player Inventory (3 rows of 9) */}
          <div className="bg-black/30 border border-white/10 rounded-lg p-3">
            <div className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
              Inventario del Jugador
            </div>
            <div className="grid grid-cols-9 gap-1.5 justify-center">
              {engine.inventory.map((slot, idx) => {
                const itemDef = slot.itemId ? ITEM_REGISTRY[slot.itemId] : null;
                const icon = slot.itemId ? getItemIcon(slot.itemId) : null;

                return (
                  <div
                    key={`inv-${idx}`}
                    onMouseDown={(e) => handlePlayerSlotClick(e, false, idx)}
                    className="relative w-12 h-12 bg-zinc-800/80 border border-zinc-700/60 hover:border-sky-400 rounded flex items-center justify-center cursor-pointer transition shadow-inner"
                    title={itemDef ? `${itemDef.name} (${slot.count})` : undefined}
                  >
                    {icon && (
                      <img
                        src={icon}
                        alt={itemDef?.name || slot.itemId}
                        className="w-8 h-8 object-contain pointer-events-none drop-shadow"
                      />
                    )}
                    {slot.count > 1 && (
                      <span className="absolute bottom-0.5 right-1 text-[11px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
                        {slot.count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Hotbar (1 row of 9) */}
            <div className="mt-2 pt-2 border-t border-white/10">
              <div className="text-[10px] font-semibold text-zinc-500 mb-1 uppercase tracking-wider">
                Barra Rápida (Hotbar)
              </div>
              <div className="grid grid-cols-9 gap-1.5 justify-center">
                {engine.hotbar.map((slot, idx) => {
                  const itemDef = slot.itemId ? ITEM_REGISTRY[slot.itemId] : null;
                  const icon = slot.itemId ? getItemIcon(slot.itemId) : null;

                  return (
                    <div
                      key={`hotbar-${idx}`}
                      onMouseDown={(e) => handlePlayerSlotClick(e, true, idx)}
                      className={`relative w-12 h-12 bg-zinc-800/90 border rounded flex items-center justify-center cursor-pointer transition shadow-inner ${
                        engine.activeSlot === idx ? 'border-amber-400 bg-amber-950/20 ring-1 ring-amber-400' : 'border-zinc-700/80 hover:border-amber-400'
                      }`}
                      title={itemDef ? `${itemDef.name} (${slot.count})` : undefined}
                    >
                      {icon && (
                        <img
                          src={icon}
                          alt={itemDef?.name || slot.itemId}
                          className="w-8 h-8 object-contain pointer-events-none drop-shadow"
                        />
                      )}
                      {slot.count > 1 && (
                        <span className="absolute bottom-0.5 right-1 text-[11px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
                          {slot.count}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Cursor Stack */}
      {cursorStack && (
        <div
          className="fixed pointer-events-none z-[100] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          <img
            src={getItemIcon(cursorStack.itemId)}
            alt={cursorStack.itemId}
            className="w-10 h-10 object-contain drop-shadow-lg"
          />
          {cursorStack.count > 1 && (
            <span className="absolute bottom-0 right-0 text-xs font-bold text-white bg-black/75 px-1 rounded drop-shadow">
              {cursorStack.count}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
