import React from 'react';
import { Play, Pause, SkipForward, Radio as RadioIcon, ListMusic } from 'lucide-react';
import { Station } from '../types';

interface DriveModeBarProps {
  currentStation: Station | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextStation: () => void;
  onToggleDrawer: () => void;
}

export const DriveModeBar: React.FC<DriveModeBarProps> = ({
  currentStation,
  isPlaying,
  onTogglePlay,
  onNextStation,
  onToggleDrawer,
}) => {
  return (
    <div className="lg:hidden h-20 px-4 bg-slate-950/95 border-t border-white/10 backdrop-blur-lg flex items-center justify-between select-none shrink-0 z-40">
      <button
        onClick={onToggleDrawer}
        className="flex items-center space-x-3 min-w-0 flex-1 pr-3 active:opacity-80"
      >
        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
          {currentStation?.favicon ? (
            <img src={currentStation.favicon} alt="" className="w-full h-full object-cover" />
          ) : (
            <RadioIcon className="w-6 h-6 text-red-500" />
          )}
        </div>
        <div className="min-w-0 text-left">
          <h4 className="font-bold text-sm text-white truncate">
            {currentStation ? currentStation.name : 'Seleccionar Emisora'}
          </h4>
          <p className="text-[11px] text-red-400 font-medium truncate flex items-center space-x-1">
            <ListMusic className="w-3 h-3 inline" />
            <span>Abrir directorio</span>
          </p>
        </div>
      </button>

      <div className="flex items-center space-x-3 shrink-0">
        <button
          onClick={onTogglePlay}
          className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        >
          {isPlaying ? <Pause className="w-7 h-7 fill-white" /> : <Play className="w-7 h-7 fill-white translate-x-0.5" />}
        </button>

        <button
          onClick={onNextStation}
          className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 flex items-center justify-center active:scale-95 transition-transform"
        >
          <SkipForward className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
