/**
 * Minecraft Web 3D - Pause & Settings Menu
 */
import React, { useState, useRef } from 'react';
import { GameEngine } from '../game/engine';
import { audio } from '../game/audio';
import { SaveManager } from '../game/save';
import {
  Volume2,
  VolumeX,
  Music,
  RotateCcw,
  Sparkles,
  Gamepad2,
  Eye,
  Sun,
  Moon,
  Compass,
  Save,
  Download,
  Upload,
  X,
  Layers,
} from 'lucide-react';

interface SettingsModalProps {
  engine: GameEngine | null;
  isOpen: boolean;
  onClose: () => void;
  onWorldRegenerated: () => void;
  onModeChanged: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  engine,
  isOpen,
  onClose,
  onWorldRegenerated,
  onModeChanged,
}) => {
  if (!isOpen || !engine) return null;

  const [seedInput, setSeedInput] = useState<string>(engine.world.seed.toString());
  const [fov, setFov] = useState<number>(engine.fov);
  const [sensitivity, setSensitivity] = useState<number>(Math.round(engine.sensitivity * 10000));
  const [renderDistance, setRenderDistanceState] = useState<number>(engine.renderDistance);
  const [volume, setVolume] = useState<number>(Math.round(audio.getVolume() * 100));
  const [musicOn, setMusicOn] = useState<boolean>(audio.isMusicEnabled());
  const [cycleOn, setCycleOn] = useState<boolean>(engine.cycleEnabled);
  const [isCreative, setIsCreative] = useState<boolean>(engine.isCreative);
  const [targetFps, setTargetFps] = useState<number>(engine.targetFps);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveMessage, setSaveMessage] = useState<string>('');

  const handleToggleMode = () => {
    const next = !engine.isCreative;
    engine.isCreative = next;
    setIsCreative(next);
    audio.playClick();
    onModeChanged();
  };

  const handleSaveWorld = () => {
    const ok = SaveManager.saveGame(engine);
    if (ok) {
      setSaveMessage('¡Partida guardada exitosamente!');
      audio.playPop();
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleExportSave = () => {
    SaveManager.exportSaveFile(engine);
    setSaveMessage('¡Archivo de mundo descargado!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);
        const ok = SaveManager.applySaveData(engine, data);
        if (ok) {
          setSeedInput(engine.world.seed.toString());
          setIsCreative(engine.isCreative);
          setSaveMessage('¡Mundo importado correctamente!');
          audio.playCraft();
          onWorldRegenerated();
          setTimeout(() => setSaveMessage(''), 3000);
        }
      } catch (err) {
        setSaveMessage('Error al leer el archivo de mundo');
      }
    };
    reader.readAsText(file);
  };

  const handleRegenerateWorld = () => {
    const seed = parseInt(seedInput, 10) || Math.floor(Math.random() * 999999);
    engine.world.seed = seed;
    // Clear old meshes
    engine.world.chunks.forEach((c) => {
      if (c.opaqueMesh) engine.scene.remove(c.opaqueMesh);
      if (c.transparentMesh) engine.scene.remove(c.transparentMesh);
    });
    engine.world.chunks.clear();
    engine.world.modifiedBlocks.clear();
    engine.world.updateInfiniteChunks(0, 0, true);
    engine.respawn();
    audio.playCraft();
    onWorldRegenerated();
    onClose();
  };

  const handleSetTime = (val: number) => {
    engine.timeOfDay = val;
    audio.playClick();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none font-retro">
      <div className="mc-box p-6 w-full max-w-xl flex flex-col gap-4 text-stone-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-stone-500 pb-2">
          <h2 className="font-minecraft text-lg text-stone-900">MENÚ DEL JUEGO / AJUSTES</h2>
          <button onClick={onClose} className="mc-btn p-1" title="Volver al juego">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options Grid */}
        <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
          {/* Game Mode */}
          <div className="flex items-center justify-between bg-stone-300 p-3 rounded border border-stone-400">
            <div>
              <span className="font-minecraft text-sm block">Modo de Juego</span>
              <span className="text-xs text-stone-600">
                {isCreative
                  ? 'Modo Creativo: Vuelo libre [F], bloques infinitos, inmortalidad'
                  : 'Modo Supervivencia: Vida, hambre, daño por caída, recolección de bloques'}
              </span>
            </div>
            <button
              onClick={handleToggleMode}
              className={`mc-btn px-4 py-1.5 text-xs font-minecraft ${
                isCreative ? 'bg-amber-700 text-white' : 'bg-emerald-700 text-white'
              }`}
            >
              {isCreative ? 'Creativo' : 'Supervivencia'}
            </button>
          </div>

          {/* Time of Day Presets */}
          <div className="bg-stone-300 p-3 rounded border border-stone-400 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-minecraft text-sm">Hora del Día</span>
              <button
                onClick={() => {
                  engine.cycleEnabled = !engine.cycleEnabled;
                  setCycleOn(engine.cycleEnabled);
                  audio.playClick();
                }}
                className={`text-xs px-2 py-1 rounded font-minecraft ${
                  cycleOn ? 'bg-emerald-600 text-white' : 'bg-stone-500 text-stone-200'
                }`}
              >
                Ciclo Día/Noche: {cycleOn ? 'Activado' : 'Pausado'}
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => handleSetTime(0.25)}
                className="mc-btn py-1 text-xs font-minecraft"
              >
                Amanecer
              </button>
              <button
                onClick={() => handleSetTime(0.5)}
                className="mc-btn py-1 text-xs font-minecraft"
              >
                Mediodía
              </button>
              <button
                onClick={() => handleSetTime(0.75)}
                className="mc-btn py-1 text-xs font-minecraft"
              >
                Atardecer
              </button>
              <button
                onClick={() => handleSetTime(0.0)}
                className="mc-btn py-1 text-xs font-minecraft"
              >
                Noche
              </button>
            </div>
          </div>

          {/* Audio Controls */}
          <div className="bg-stone-300 p-3 rounded border border-stone-400 flex flex-col gap-2">
            <span className="font-minecraft text-sm">Sonido y Música</span>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs">Volumen Efectos: {volume}%</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setVolume(val);
                  audio.setVolume(val / 100);
                }}
                className="w-40 cursor-pointer accent-stone-700"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">Música Ambiental Retro (C418 style)</span>
              <button
                onClick={() => {
                  const next = !musicOn;
                  setMusicOn(next);
                  audio.setMusicEnabled(next);
                }}
                className={`mc-btn px-3 py-1 text-xs font-minecraft ${
                  musicOn ? 'bg-emerald-700 text-white' : 'bg-stone-500 text-stone-200'
                }`}
              >
                {musicOn ? 'Música: ON' : 'Música: OFF'}
              </button>
            </div>
          </div>

          {/* Mouse & Camera Settings */}
          <div className="bg-stone-300 p-3 rounded border border-stone-400 flex flex-col gap-2">
            <span className="font-minecraft text-sm">Cámara y Control</span>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs">Sensibilidad del Ratón: {sensitivity}</span>
              <input
                type="range"
                min="5"
                max="50"
                value={sensitivity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setSensitivity(val);
                  engine.sensitivity = val / 10000;
                }}
                className="w-40 cursor-pointer accent-stone-700"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs">Campo de Visión (FOV): {fov}°</span>
              <input
                type="range"
                min="50"
                max="100"
                value={fov}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setFov(val);
                  engine.fov = val;
                  engine.camera.fov = val;
                  engine.camera.updateProjectionMatrix();
                }}
                className="w-40 cursor-pointer accent-stone-700"
              />
            </div>
          </div>

          {/* Distancia de Renderizado de Chunks (Carga de Bloques hasta 20 Chunks) */}
          <div className="bg-stone-300 p-3 rounded border border-stone-400 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-stone-700" />
                <span className="font-minecraft text-sm">Carga de Chunks / Distancia</span>
              </div>
              <span className="text-xs text-stone-800 font-minecraft font-bold bg-stone-200 px-2 py-0.5 rounded border border-stone-400">
                {renderDistance === 4 && '4 Chunks (Rápido)'}
                {renderDistance === 8 && '8 Chunks (Normal)'}
                {renderDistance === 12 && '12 Chunks (Amplio)'}
                {renderDistance === 16 && '16 Chunks (Extremo)'}
                {renderDistance === 20 && '20 Chunks (Ultra Bedrock)'}
                {renderDistance !== 4 && renderDistance !== 8 && renderDistance !== 12 && renderDistance !== 16 && renderDistance !== 20 && `${renderDistance} Chunks`}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-stone-600 font-minecraft">
              <span>Radio: <b>~{renderDistance * 16} bloques ({renderDistance * 32}m de visión)</b></span>
              <span>Carga activa: <b>{Math.pow(renderDistance * 2 + 1, 2)} chunks</b></span>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { chunks: 4, label: '4 Chunks', desc: 'Rápido' },
                { chunks: 8, label: '8 Chunks', desc: 'Normal' },
                { chunks: 12, label: '12 Chunks', desc: 'Amplio' },
                { chunks: 16, label: '16 Chunks', desc: 'Extremo' },
                { chunks: 20, label: '20 Chunks', desc: 'Ultra Bedrock' },
              ].map((opt) => (
                <button
                  key={opt.chunks}
                  onClick={() => {
                    engine.setRenderDistance(opt.chunks);
                    setRenderDistanceState(opt.chunks);
                    audio.playClick();
                  }}
                  className={`mc-btn py-1 text-xs font-minecraft transition-all flex flex-col items-center ${
                    renderDistance === opt.chunks
                      ? 'bg-amber-600 text-white font-bold border-amber-800 shadow-inner'
                      : 'bg-stone-400 text-stone-800'
                  }`}
                >
                  <span className="leading-tight">{opt.label}</span>
                  <span className="text-[10px] opacity-80 leading-tight">{opt.desc}</span>
                </button>
              ))}
            </div>

            {/* Slider */}
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[11px] text-stone-600 font-minecraft">Cerca (2)</span>
              <input
                type="range"
                min="2"
                max="20"
                step="1"
                value={renderDistance}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  engine.setRenderDistance(val);
                  setRenderDistanceState(val);
                }}
                className="flex-1 cursor-pointer accent-amber-600"
              />
              <span className="text-[11px] text-stone-600 font-minecraft">Ultra (20)</span>
            </div>

            <p className="text-[11px] text-stone-600 leading-tight">
              Ajusta la carga de chunks hasta 20 con optimización estilo Bedrock (procesamiento concéntrico de anillos y culling frustum) para máxima fluidez y horizontes infinitos sin caídas de FPS.
            </p>
          </div>

          {/* Performance & FPS Limit Setting */}
          <div className="bg-stone-300 p-3 rounded border border-stone-400 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-minecraft text-sm">Rendimiento / Límite de FPS</span>
              <span className="text-xs text-stone-700 font-minecraft font-semibold">
                {targetFps === 0 ? 'Sin límite (Máx Hz)' : `${targetFps} FPS`}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[30, 60, 120, 144, 0].map((fpsVal) => (
                <button
                  key={fpsVal}
                  onClick={() => {
                    engine.targetFps = fpsVal;
                    setTargetFps(fpsVal);
                    audio.playClick();
                  }}
                  className={`mc-btn py-1 text-xs font-minecraft transition-all ${
                    targetFps === fpsVal
                      ? 'bg-amber-600 text-white font-bold border-amber-800'
                      : 'bg-stone-400 text-stone-800'
                  }`}
                >
                  {fpsVal === 0 ? 'Ilimitado' : `${fpsVal}`}
                </button>
              ))}
            </div>
          </div>

          {/* World Generator Seed */}
          <div className="bg-stone-300 p-3 rounded border border-stone-400 flex flex-col gap-2">
            <span className="font-minecraft text-sm">Generador de Mundo</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={seedInput}
                onChange={(e) => setSeedInput(e.target.value)}
                placeholder="Semilla (Seed)"
                className="flex-1 bg-white border border-stone-500 px-3 py-1.5 text-sm font-mono rounded"
              />
              <button
                onClick={handleRegenerateWorld}
                className="mc-btn px-4 py-1.5 text-xs font-minecraft whitespace-nowrap"
              >
                Nuevo Mundo
              </button>
            </div>
          </div>

          {/* Controls Reference Guide */}
          <div className="bg-stone-200 p-3 rounded border border-stone-400 text-xs leading-relaxed text-stone-800">
            <span className="font-minecraft block mb-1 text-stone-900">Controles Rápidos</span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <p>• <b>WASD</b>: Moverse</p>
              <p>• <b>Shift</b>: Esprintar (Correr rápido)</p>
              <p>• <b>Espacio</b>: Saltar / Nadar</p>
              <p>• <b>Doble Espacio</b>: Volar (Modo Creativo)</p>
              <p>• <b>Ctrl</b>: Agacharse / Bucear / Descender</p>
              <p>• <b>Bucear</b>: Mira hacia abajo en el agua</p>
              <p>• <b>Clic Izq</b>: Picar / Romper bloque</p>
              <p>• <b>Clic Der</b>: Colocar bloque / Crafteo</p>
              <p>• <b>1 - 9 / Scroll</b>: Seleccionar objeto</p>
              <p>• <b>E</b>: Abrir Inventario & Crafteo</p>
              <p>• <b>C</b>: Cambiar Creativo / Supervivencia</p>
              <p>• <b>F3</b>: Info técnica (FPS, XYZ)</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-400">
          <button
            onClick={() => {
              engine.respawn();
              audio.playClick();
              onClose();
            }}
            className="mc-btn px-4 py-2 text-xs font-minecraft text-amber-900"
          >
            Reaparecer (Respawn)
          </button>
          <button
            onClick={onClose}
            className="mc-btn px-6 py-2 text-xs font-minecraft bg-stone-800 text-white"
          >
            Reanudar Juego
          </button>
        </div>
      </div>
    </div>
  );
};
