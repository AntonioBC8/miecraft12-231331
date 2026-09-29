/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine, EngineStats, HotbarSlot } from './game/engine';
import { HUD } from './components/HUD';
import { InventoryModal } from './components/InventoryModal';
import { FurnaceModal } from './components/FurnaceModal';
import { StorageModal } from './components/StorageModal';
import { SettingsModal } from './components/SettingsModal';
import { GameOverModal } from './components/GameOverModal';
import { audio } from './game/audio';
import { SaveManager } from './game/save';
import { FurnaceState } from './game/furnace';
import { BlockType } from './game/constants';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // UI state
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState<boolean>(false);
  const [isCraftingTable, setIsCraftingTable] = useState<boolean>(false);
  const [isFurnaceOpen, setIsFurnaceOpen] = useState<boolean>(false);
  const [currentFurnace, setCurrentFurnace] = useState<FurnaceState | null>(null);
  const [isStorageOpen, setIsStorageOpen] = useState<boolean>(false);
  const [currentStorage, setCurrentStorage] = useState<{ posKey: string; blockType: BlockType } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isDead, setIsDead] = useState<boolean>(false);

  // Player gameplay state
  const [hotbar, setHotbar] = useState<HotbarSlot[]>([]);
  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [health, setHealth] = useState<number>(100);
  const [hunger, setHunger] = useState<number>(100);
  const [air, setAir] = useState<number>(100);
  const [isCreative, setIsCreative] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Engine stats
  const [stats, setStats] = useState<EngineStats>({
    fps: 60,
    x: 0,
    y: 20,
    z: 0,
    targetedBlock: null,
    timeOfDay: 0.35,
    isFlying: false,
    biome: 'Llanuras',
  });

  // Initialize Game Engine on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new GameEngine(containerRef.current);
    engineRef.current = engine;

    // Try auto-loading saved world
    if (SaveManager.hasSave()) {
      SaveManager.loadGame(engine);
      setIsCreative(engine.isCreative);
      setHealth(engine.health);
    }

    // Connect Engine Callbacks
    let lastStatsTime = 0;
    engine.onStatsUpdate = (newStats) => {
      const now = performance.now();
      if (now - lastStatsTime > 100) {
        lastStatsTime = now;
        setStats(newStats);
        setActiveSlot(engine.activeSlot);
        setHunger(Math.round(engine.hunger));
        setAir(Math.round(engine.air));
        setIsLocked(engine.isLocked);
        setIsCreative(engine.isCreative);
      }
    };

    engine.onHealthChange = (newHealth) => {
      setHealth(newHealth);
      if (newHealth <= 0) {
        setIsDead(true);
        if (document.exitPointerLock) document.exitPointerLock();
      }
    };

    engine.onOpenCraftingTable = () => {
      setIsCraftingTable(true);
      setIsInventoryOpen(true);
      if (document.exitPointerLock) document.exitPointerLock();
    };

    engine.onOpenFurnace = (furnace) => {
      setCurrentFurnace(furnace);
      setIsFurnaceOpen(true);
      if (document.exitPointerLock) document.exitPointerLock();
    };

    engine.onOpenStorage = (posKey, blockType) => {
      setCurrentStorage({ posKey, blockType });
      setIsStorageOpen(true);
      if (document.exitPointerLock) document.exitPointerLock();
    };

    engine.onInventoryChange = () => {
      setHotbar([...engine.hotbar]);
    };

    setHotbar([...engine.hotbar]);
    engine.start();

    // Global Key Listener for E, Escape, F3
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyE') {
        if (!isDead && !isSettingsOpen) {
          if (isStorageOpen) {
            setIsStorageOpen(false);
            setCurrentStorage(null);
            setTimeout(() => engineRef.current?.requestLock(), 20);
          } else if (isFurnaceOpen) {
            setIsFurnaceOpen(false);
            setCurrentFurnace(null);
            setTimeout(() => engineRef.current?.requestLock(), 20);
          } else {
            setIsInventoryOpen((prev) => {
              const next = !prev;
              if (next && document.exitPointerLock) {
                document.exitPointerLock();
              } else if (!next) {
                setIsCraftingTable(false);
                setTimeout(() => engineRef.current?.requestLock(), 20);
              }
              return next;
            });
          }
        }
      } else if (e.code === 'Escape') {
        if (isStorageOpen) {
          setIsStorageOpen(false);
          setCurrentStorage(null);
          setTimeout(() => engineRef.current?.requestLock(), 20);
        } else if (isFurnaceOpen) {
          setIsFurnaceOpen(false);
          setCurrentFurnace(null);
          setTimeout(() => engineRef.current?.requestLock(), 20);
        } else if (isInventoryOpen) {
          setIsInventoryOpen(false);
          setIsCraftingTable(false);
          setTimeout(() => engineRef.current?.requestLock(), 20);
        } else if (!isDead) {
          setIsSettingsOpen((prev) => {
            const next = !prev;
            if (next && document.exitPointerLock) {
              document.exitPointerLock();
            } else if (!next) {
              setTimeout(() => engineRef.current?.requestLock(), 20);
            }
            return next;
          });
        }
      } else if (e.code === 'F3') {
        e.preventDefault();
        setShowDebug((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleSelectSlot = useCallback((idx: number) => {
    if (engineRef.current) {
      engineRef.current.setActiveSlot(idx);
      setActiveSlot(idx);
    }
  }, []);

  const handleToggleMode = useCallback(() => {
    if (engineRef.current) {
      const mode = engineRef.current.toggleGameMode();
      setIsCreative(mode);
      audio.playClick();
    }
  }, []);

  const handleToggleSound = useCallback(() => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audio.setSoundEnabled(next);
  }, [soundEnabled]);

  const handleInventoryUpdated = useCallback(() => {
    if (engineRef.current) {
      setHotbar([...engineRef.current.hotbar]);
    }
  }, []);

  const handleCloseInventory = useCallback(() => {
    setIsInventoryOpen(false);
    setIsCraftingTable(false);
    setTimeout(() => engineRef.current?.requestLock(), 20);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setIsSettingsOpen(false);
    setTimeout(() => engineRef.current?.requestLock(), 20);
  }, []);

  const handleWorldRegenerated = useCallback(() => {
    if (engineRef.current) {
      setHotbar([...engineRef.current.hotbar]);
      setHealth(100);
    }
  }, []);

  const handleModeChanged = useCallback(() => {
    if (engineRef.current) {
      setIsCreative(engineRef.current.isCreative);
    }
  }, []);

  const handleRespawn = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.respawn();
      setIsDead(false);
      setHealth(100);
      const canvas = engineRef.current.renderer.domElement;
      if (canvas) canvas.requestPointerLock();
    }
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

      {/* Heads-Up Display (HUD) */}
      <HUD
        engine={engineRef.current}
        hotbar={hotbar}
        activeSlot={activeSlot}
        stats={stats}
        health={health}
        hunger={hunger}
        air={air}
        isCreative={isCreative}
        isLocked={isLocked}
        showDebug={showDebug}
        onToggleDebug={() => setShowDebug((prev) => !prev)}
        onOpenInventory={() => {
          setIsCraftingTable(false);
          setIsInventoryOpen(true);
          if (document.exitPointerLock) document.exitPointerLock();
        }}
        onOpenSettings={() => {
          setIsSettingsOpen(true);
          if (document.exitPointerLock) document.exitPointerLock();
        }}
        onSelectSlot={handleSelectSlot}
        onToggleMode={handleToggleMode}
        onToggleSound={handleToggleSound}
        soundEnabled={soundEnabled}
      />

      {/* Inventory & Crafting Modal */}
      {isInventoryOpen && (
        <InventoryModal
          engine={engineRef.current}
          isOpen={isInventoryOpen}
          isCraftingTable={isCraftingTable}
          onClose={handleCloseInventory}
          onInventoryUpdated={handleInventoryUpdated}
        />
      )}

      {/* Furnace Smelting & Refining Modal */}
      {isFurnaceOpen && (
        <FurnaceModal
          engine={engineRef.current}
          isOpen={isFurnaceOpen}
          furnaceState={currentFurnace}
          onClose={() => {
            setIsFurnaceOpen(false);
            setCurrentFurnace(null);
          }}
          onUpdated={handleInventoryUpdated}
        />
      )}

      {/* Storage Crate Modal */}
      {isStorageOpen && currentStorage && (
        <StorageModal
          engine={engineRef.current}
          isOpen={isStorageOpen}
          posKey={currentStorage.posKey}
          blockType={currentStorage.blockType}
          onClose={() => {
            setIsStorageOpen(false);
            setCurrentStorage(null);
          }}
          onUpdated={handleInventoryUpdated}
        />
      )}

      {/* Settings / Pause Modal */}
      {isSettingsOpen && (
        <SettingsModal
          engine={engineRef.current}
          isOpen={isSettingsOpen}
          onClose={handleCloseSettings}
          onWorldRegenerated={handleWorldRegenerated}
          onModeChanged={handleModeChanged}
        />
      )}

      {/* Game Over Modal */}
      <GameOverModal isOpen={isDead} onRespawn={handleRespawn} />
    </div>
  );
}
