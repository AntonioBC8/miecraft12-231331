/**
 * Minecraft Web 3D - Game Over Modal
 */
import React from 'react';
import { audio } from '../game/audio';

interface GameOverModalProps {
  isOpen: boolean;
  onRespawn: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ isOpen, onRespawn }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/75 backdrop-blur-xs select-none font-retro animate-fade-in">
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="font-minecraft text-4xl sm:text-5xl text-white drop-shadow-[4px_4px_0px_#000000] tracking-wider text-red-100">
          ¡HAS MUERTO!
        </h1>
        <p className="text-xl text-stone-200 drop-shadow-[2px_2px_0px_#000000] max-w-sm">
          Has perdido toda tu salud. ¡No te rindas! Puedes reaparecer y continuar explorando tu mundo.
        </p>
        <button
          onClick={() => {
            audio.playPop();
            onRespawn();
          }}
          className="mc-btn px-8 py-3 text-base font-minecraft uppercase tracking-wider cursor-pointer bg-stone-700 hover:bg-stone-600"
        >
          Reaparecer
        </button>
      </div>
    </div>
  );
};
