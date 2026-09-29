/**
 * Minecraft Web 3D - Heads-Up Display (HUD)
 */
import React, { useState } from 'react';
import { GameEngine, HotbarSlot, EngineStats } from '../game/engine';
import { getItemIcon } from '../game/textures';
import { ITEM_REGISTRY } from '../game/constants';
import {
  Compass,
  Volume2,
  VolumeX,
  Settings,
  Package,
  MousePointer,
  Gamepad2,
  Play,
  Save,
} from 'lucide-react';
import { audio } from '../game/audio';
import { SaveManager } from '../game/save';

interface HUDProps {
  engine: GameEngine | null;
  hotbar: HotbarSlot[];
  activeSlot: number;
  stats: EngineStats;
  health: number;
  hunger: number;
  air: number;
  isCreative: boolean;
  isLocked: boolean;
  showDebug: boolean;
  onToggleDebug: () => void;
  onOpenInventory: () => void;
  onOpenSettings: () => void;
  onSelectSlot: (idx: number) => void;
  onToggleMode: () => void;
  onToggleSound: () => void;
  soundEnabled: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  engine,
  hotbar,
  activeSlot,
  stats,
  health,
  hunger,
  air,
  isCreative,
  isLocked,
  showDebug,
  onToggleDebug,
  onOpenInventory,
  onOpenSettings,
  onSelectSlot,
  onToggleMode,
  onToggleSound,
  soundEnabled,
}) => {
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [showTouchControls, setShowTouchControls] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<boolean>(false);

  const heartsCount = Math.ceil(health / 10);
  const drumsticksCount = Math.ceil(hunger / 10);
  const bubblesCount = Math.ceil(air / 10);
  const totalArmor = engine?.getTotalArmorDefense() || 0;
  const armorShields = Math.ceil(totalArmor / 2);

  // Time formatting
  const getTimeString = (time: number) => {
    const hours = Math.floor(time * 24);
    const mins = Math.floor((time * 24 * 60) % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const handleStartGame = () => {
    setHasStarted(true);
    window.focus();
    audio.startAmbientMusic();
    if (engine) {
      engine.requestLock();
    }
  };

  const handleSaveGame = () => {
    if (engine) {
      const ok = SaveManager.saveGame(engine);
      if (ok) {
        audio.playPop();
        setSaveToast(true);
        setTimeout(() => setSaveToast(false), 2500);
      }
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 font-retro">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 bg-emerald-800/95 border-2 border-emerald-400 text-white px-5 py-2 rounded shadow-2xl font-minecraft text-sm z-50 animate-bounce flex items-center gap-2">
          <span>💾</span>
          <span>¡Mundo guardado con éxito!</span>
        </div>
      )}

      {/* Top Bar: Clean status & Quick action buttons */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Brand & Coordinates */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-minecraft text-lg text-white drop-shadow-[2px_2px_0px_#000000] tracking-wide">
              MINECRAFT 3D
            </span>
            <button
              onClick={onToggleMode}
              title="Cambiar Modo: Creativo / Supervivencia [Tecla C]"
              className={`pointer-events-auto text-xs px-2.5 py-0.5 rounded font-minecraft cursor-pointer border transition-colors ${
                isCreative
                  ? 'bg-amber-700/80 text-amber-200 border-amber-400 hover:bg-amber-600'
                  : 'bg-emerald-800/80 text-emerald-200 border-emerald-400 hover:bg-emerald-700'
              }`}
            >
              {isCreative ? '✦ CREATIVO' : '⚔ SUPERVIVENCIA'}
            </button>
            <span className="text-xs px-2.5 py-1 rounded bg-black/75 text-cyan-300 font-minecraft border border-cyan-400/30 shadow flex items-center gap-1.5" title="Bioma Actual">
              <span className="text-amber-300 text-xs">🏞️</span>
              <span className="text-white/70">Bioma:</span>
              <span className="text-cyan-300 font-bold">{stats.biome || 'Llanuras'}</span>
            </span>
            {!isLocked && hasStarted && (
              <span className="text-[10px] hidden sm:inline px-2 py-0.5 rounded bg-black/40 text-stone-300 font-minecraft">
                Arrastra ratón para mirar
              </span>
            )}
          </div>

          {/* F3 Debug Data */}
          {showDebug && (
            <div className="bg-black/70 backdrop-blur-xs p-2 rounded text-stone-200 text-sm leading-tight border border-white/10 font-mono">
              <p>FPS: <span className="text-emerald-400 font-bold">{stats.fps}</span></p>
              <p>XYZ: {stats.x} / {stats.y} / {stats.z}</p>
              <p>Bioma: <span className="text-cyan-300 font-bold">{stats.biome || 'Llanuras'}</span></p>
              <p>Hora: {getTimeString(stats.timeOfDay)}</p>
              {stats.targetedBlock && (
                <p>Mirando a: <span className="text-amber-300 font-bold">{stats.targetedBlock}</span></p>
              )}
              {stats.isFlying && (
                <p className="text-cyan-300">Modo Vuelo Activo [F]</p>
              )}
            </div>
          )}
        </div>

        {/* Right: Quick Action Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 flex-wrap justify-end">
          {/* Save Button */}
          <button
            onClick={handleSaveGame}
            title="Guardar Partida"
            className="mc-btn px-2.5 py-1.5 text-xs flex items-center gap-1 cursor-pointer font-minecraft bg-emerald-800 text-white"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Guardar</span>
          </button>
          {/* Lock pointer button (if not locked, lets user lock mouse if supported) */}
          {!isLocked && (
            <button
              onClick={() => {
                if (engine) engine.requestLock();
              }}
              title="Bloquear puntero del ratón (Modo FPS)"
              className="mc-btn px-2.5 py-1.5 text-xs flex items-center gap-1 cursor-pointer font-minecraft"
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bloquear Ratón</span>
            </button>
          )}

          {/* Toggle Virtual Touch D-Pad */}
          <button
            onClick={() => setShowTouchControls(!showTouchControls)}
            title="Controles en pantalla (D-Pad)"
            className={`mc-btn px-2 py-1.5 text-xs flex items-center gap-1 cursor-pointer font-minecraft ${
              showTouchControls ? 'bg-amber-700 text-white' : ''
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onToggleDebug}
            title="Información F3"
            className="mc-btn px-2 py-1.5 text-xs flex items-center gap-1 cursor-pointer font-minecraft"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">F3</span>
          </button>

          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Silenciar sonido' : 'Activar sonido'}
            className="mc-btn px-2 py-1.5 text-xs flex items-center gap-1 cursor-pointer font-minecraft"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-red-300" />}
          </button>

          <button
            onClick={onOpenInventory}
            title="Inventario y Crafteo [E]"
            className="mc-btn px-2.5 py-1.5 text-xs flex items-center gap-1 cursor-pointer font-minecraft"
          >
            <Package className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Inventario [E]</span>
          </button>

          <button
            onClick={onOpenSettings}
            title="Ajustes y Menú [ESC]"
            className="mc-btn px-2.5 py-1.5 text-xs flex items-center gap-1 cursor-pointer font-minecraft"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pausa</span>
          </button>
        </div>
      </div>

      {/* Center Reticle / Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
        <div className="relative w-5 h-5 flex items-center justify-center">
          <div className="w-5 h-[2px] bg-white mix-blend-difference"></div>
          <div className="h-5 w-[2px] bg-white mix-blend-difference absolute"></div>
        </div>
      </div>

      {/* Target Block Name Toast */}
      {stats.targetedBlock && (
        <div className="absolute top-[55%] left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded text-sm font-minecraft border border-white/10 pointer-events-none">
          {stats.targetedBlock}
        </div>
      )}

      {/* Bottom Center: Survival Meters & Hotbar */}
      <div className="flex flex-col items-center gap-2 mb-2">
        {/* Survival Status Bars (Armor, Hearts, Hunger, Air) */}
        {!isCreative && (
          <div className="flex flex-col w-full max-w-[420px] px-2 text-sm font-minecraft gap-0.5">
            {/* Top row: Armor shields (above hearts) and Air bubbles (above hunger) */}
            {(totalArmor > 0 || air < 100) && (
              <div className="flex items-center justify-between w-full px-0.5">
                {/* Armor Bar */}
                {totalArmor > 0 ? (
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <span
                        key={i}
                        className={`text-xs transition-all ${
                          i < armorShields ? 'text-sky-300 drop-shadow-[0_0_2px_#38bdf8]' : 'text-stone-700 opacity-40'
                        }`}
                        title={`Defensa: ${totalArmor}/20`}
                      >
                        🛡️
                      </span>
                    ))}
                    <span className="text-[10px] text-sky-300 font-bold ml-1 font-minecraft drop-shadow-[1px_1px_0px_#000]">
                      +{totalArmor}
                    </span>
                  </div>
                ) : <div />}

                {/* Underwater Air Bubbles */}
                {air < 100 ? (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <span
                        key={i}
                        className={`text-sm ${
                          i < bubblesCount ? 'text-cyan-400' : 'text-stone-700'
                        }`}
                      >
                        🫧
                      </span>
                    ))}
                  </div>
                ) : <div />}
              </div>
            )}

            {/* Main row: Health Hearts & Hunger Drumsticks */}
            <div className="flex items-center justify-between w-full px-0.5">
              {/* Health Hearts */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span
                    key={i}
                    className={`text-lg transition-transform ${
                      i < heartsCount ? 'text-red-500 scale-100' : 'text-stone-700 scale-90'
                    }`}
                    style={{ textShadow: '1px 1px 0px #000' }}
                  >
                    ❤
                  </span>
                ))}
              </div>

              {/* Hunger Drumsticks */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span
                    key={i}
                    className={`text-sm ${
                      i < drumsticksCount ? 'text-amber-500' : 'text-stone-700'
                    }`}
                    style={{ textShadow: '1px 1px 0px #000' }}
                  >
                    🍗
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 9-Slot Minecraft Hotbar */}
        <div className="pointer-events-auto flex items-center p-1.5 mc-box rounded-xs shadow-2xl">
          {hotbar.map((slot, idx) => {
            const isActive = idx === activeSlot;
            const itemDef = slot.itemId ? ITEM_REGISTRY[slot.itemId] : null;
            const iconUrl = slot.itemId ? getItemIcon(slot.itemId) : null;

            return (
              <button
                key={idx}
                onClick={() => onSelectSlot(idx)}
                className={`relative w-12 h-12 flex items-center justify-center m-0.5 cursor-pointer transition-all ${
                  isActive ? 'mc-slot-active scale-105 z-10' : 'mc-slot hover:brightness-110'
                }`}
                title={itemDef ? `${itemDef.name} (${idx + 1})` : `Vacío (${idx + 1})`}
              >
                {/* Slot index indicator */}
                <span className="absolute top-0.5 left-1 text-[10px] text-stone-300 font-minecraft opacity-60">
                  {idx + 1}
                </span>

                {/* Item Icon */}
                {iconUrl && (
                  <img
                    src={iconUrl}
                    alt={itemDef?.name || ''}
                    className="w-8 h-8 pixelated pointer-events-none drop-shadow-[1px_1px_0px_#000000]"
                  />
                )}

                {/* Stack count */}
                {slot.count > 1 && (
                  <span className="absolute bottom-0.5 right-1 text-sm font-minecraft text-white drop-shadow-[1px_1px_0px_#000000]">
                    {slot.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Item Name Tooltip */}
        {hotbar[activeSlot]?.itemId && (
          <div className="text-white text-base font-minecraft drop-shadow-[2px_2px_0px_#000]">
            {ITEM_REGISTRY[hotbar[activeSlot].itemId]?.name}
          </div>
        )}
      </div>

      {/* Start Game Modal (Shown only once at startup) */}
      {!hasStarted && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center pointer-events-auto z-40">
          <div className="mc-box p-6 max-w-md text-center flex flex-col items-center gap-4 text-stone-900 shadow-2xl">
            <h2 className="text-2xl font-minecraft text-stone-900 tracking-wide uppercase">
              ¡MINECRAFT 3D WEB!
            </h2>
            <p className="text-base text-stone-800 leading-snug">
              Bienvenido al mundo de vóxeles. Explora, pica bloques, construye y craftea herramientas.
            </p>
            <div className="bg-stone-300/85 p-3 rounded text-left text-xs w-full font-retro text-stone-800 leading-relaxed border border-stone-400">
              <p>• <b>WASD</b>: Caminar / Moverse</p>
              <p>• <b>Shift</b>: Esprintar (Correr rápido)</p>
              <p>• <b>Espacio</b>: Saltar / Nadar (<b>Doble Espacio</b> en Creativo para Volar)</p>
              <p>• <b>Bucear</b>: Mira hacia abajo en el agua para sumergirte (o pulsa Ctrl)</p>
              <p>• <b>Ctrl</b>: Agacharse / Bucear / Descender en vuelo</p>
              <p>• <b>Clic Izquierdo</b>: Picar / Romper bloque</p>
              <p>• <b>Clic Derecho</b>: Colocar bloque / Interactuar</p>
              <p>• <b>E</b>: Abrir Inventario y Crafteo</p>
              <p>• <b>1 al 9 / Scroll</b>: Cambiar bloque en mano</p>
            </div>
            <button
              onClick={handleStartGame}
              className="mc-btn px-8 py-3 text-base font-minecraft cursor-pointer uppercase tracking-wider bg-emerald-700 text-white flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <Play className="w-5 h-5 fill-current" />
              ¡ENTRAR A JUGAR!
            </button>
          </div>
        </div>
      )}

      {/* Touch / Screen Controls (Visible on mobile OR when toggled) */}
      {(showTouchControls || window.innerWidth < 768) && hasStarted && (
        <div className="pointer-events-auto flex items-end justify-between w-full px-2 mb-16 z-20">
          {/* Virtual Joystick / D-Pad */}
          <div className="grid grid-cols-3 gap-1 w-32 h-32 bg-black/50 p-1.5 rounded-lg border border-white/20">
            <div></div>
            <button
              onMouseDown={() => { if (engine) engine.input.forward = true; }}
              onMouseUp={() => { if (engine) engine.input.forward = false; }}
              onMouseLeave={() => { if (engine) engine.input.forward = false; }}
              onTouchStart={() => { if (engine) engine.input.forward = true; }}
              onTouchEnd={() => { if (engine) engine.input.forward = false; }}
              className="mc-btn flex items-center justify-center font-bold text-lg select-none"
            >
              ▲
            </button>
            <div></div>
            <button
              onMouseDown={() => { if (engine) engine.input.left = true; }}
              onMouseUp={() => { if (engine) engine.input.left = false; }}
              onMouseLeave={() => { if (engine) engine.input.left = false; }}
              onTouchStart={() => { if (engine) engine.input.left = true; }}
              onTouchEnd={() => { if (engine) engine.input.left = false; }}
              className="mc-btn flex items-center justify-center font-bold text-lg select-none"
            >
              ◀
            </button>
            <button
              onClick={() => {
                if (engine && isCreative) {
                  engine.input.fly = !engine.input.fly;
                }
              }}
              className="mc-btn flex items-center justify-center font-minecraft text-[9px] select-none"
            >
              {engine?.physics.isFlying ? 'VOLAR' : 'PASO'}
            </button>
            <button
              onMouseDown={() => { if (engine) engine.input.right = true; }}
              onMouseUp={() => { if (engine) engine.input.right = false; }}
              onMouseLeave={() => { if (engine) engine.input.right = false; }}
              onTouchStart={() => { if (engine) engine.input.right = true; }}
              onTouchEnd={() => { if (engine) engine.input.right = false; }}
              className="mc-btn flex items-center justify-center font-bold text-lg select-none"
            >
              ▶
            </button>
            <div></div>
            <button
              onMouseDown={() => { if (engine) engine.input.backward = true; }}
              onMouseUp={() => { if (engine) engine.input.backward = false; }}
              onMouseLeave={() => { if (engine) engine.input.backward = false; }}
              onTouchStart={() => { if (engine) engine.input.backward = true; }}
              onTouchEnd={() => { if (engine) engine.input.backward = false; }}
              className="mc-btn flex items-center justify-center font-bold text-lg select-none"
            >
              ▼
            </button>
            <div></div>
          </div>

          {/* Action Buttons: Jump, Mine, Place */}
          <div className="flex flex-col gap-2 items-end">
            <div className="flex gap-2">
              <button
                onMouseDown={() => { if (engine) engine.triggerMining(true); }}
                onMouseUp={() => { if (engine) engine.triggerMining(false); }}
                onTouchStart={() => { if (engine) engine.triggerMining(true); }}
                onTouchEnd={() => { if (engine) engine.triggerMining(false); }}
                className="mc-btn w-14 h-14 rounded-full font-minecraft text-[11px] bg-red-700 text-white select-none"
              >
                PICAR
              </button>
              <button
                onClick={() => { if (engine) engine.placeBlock(); }}
                className="mc-btn w-14 h-14 rounded-full font-minecraft text-[11px] bg-emerald-700 text-white select-none"
              >
                PONER
              </button>
            </div>
            <button
              onMouseDown={() => { if (engine) engine.input.jump = true; }}
              onMouseUp={() => { if (engine) engine.input.jump = false; }}
              onTouchStart={() => { if (engine) engine.input.jump = true; }}
              onTouchEnd={() => { if (engine) engine.input.jump = false; }}
              className="mc-btn w-30 h-12 font-minecraft text-xs bg-amber-700 text-white select-none"
            >
              SALTAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
