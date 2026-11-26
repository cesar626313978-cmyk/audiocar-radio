import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Radio as RadioIcon, ListMusic, Volume2, Car, Minus, Plus } from 'lucide-react';
import { Station } from '../types';

interface DriveModeBarProps {
  currentStation: Station | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrevStation: () => void;
  onNextStation: () => void;
  mobileView: 'player' | 'stations';
  onToggleMobileView: () => void;
  hasTeslaSession?: boolean;
  onTeslaVolumeDown?: () => void;
  onTeslaVolumeUp?: () => void;
}

export const DriveModeBar: React.FC<DriveModeBarProps> = ({
  currentStation,
  isPlaying,
  onTogglePlay,
  onPrevStation,
  onNextStation,
  mobileView,
  onToggleMobileView,
  hasTeslaSession,
  onTeslaVolumeDown,
  onTeslaVolumeUp,
}) => {
  return (
    <div className="min-[1100px]:hidden h-20 [@media(max-height:750px)]:h-16 px-3 sm:px-4 bg-slate-950/95 border-t border-white/10 backdrop-blur-lg flex items-center justify-between select-none shrink-0 z-40 gap-2">
      <button
        onClick={onToggleMobileView}
        className="flex items-center space-x-2.5 min-w-0 flex-1 pr-2 active:opacity-80"
        title={mobileView === 'stations' ? 'Volver al Reproductor' : 'Abrir Emisoras / Favoritos'}
      >
        <div className="w-12 h-12 [@media(max-height:750px)]:w-11 [@media(max-height:750px)]:h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
          {currentStation?.favicon ? (
            <img src={currentStation.favicon} alt="" className="w-full h-full object-cover" />
          ) : (
            <RadioIcon className="w-6 h-6 text-red-500" />
          )}
        </div>
        <div className="min-w-0 text-left">
          <h4 className="font-bold text-sm sm:text-base text-white truncate">
            {currentStation ? currentStation.name : 'Seleccionar Emisora'}
          </h4>
          <p className="text-xs text-red-400 font-semibold truncate flex items-center space-x-1">
            {mobileView === 'stations' ? (
              <>
                <Volume2 className="w-3.5 h-3.5 inline shrink-0" />
                <span>Toca para ver Reproductor</span>
              </>
            ) : (
              <>
                <ListMusic className="w-3.5 h-3.5 inline shrink-0" />
                <span>Toca para explorar Emisoras</span>
              </>
            )}
          </p>
        </div>
      </button>

      <div className="flex items-center space-x-2 shrink-0">
        {hasTeslaSession && (
          <div className="hidden sm:flex items-center space-x-1.5 mr-1">
            <button
              onClick={onTeslaVolumeDown}
              className="min-h-[48px] px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center space-x-1 active:scale-95 transition-transform"
              title="Bajar Volumen Coche (Vol -)"
            >
              <Car className="w-3.5 h-3.5 text-red-400" />
              <Minus className="w-3 h-3" />
              <span>Vol -</span>
            </button>
            <button
              onClick={onTeslaVolumeUp}
              className="min-h-[48px] px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center space-x-1 active:scale-95 transition-transform"
              title="Subir Volumen Coche (Vol +)"
            >
              <Car className="w-3.5 h-3.5 text-emerald-400" />
              <Plus className="w-3 h-3" />
              <span>Vol +</span>
            </button>
          </div>
        )}

        <button
          onClick={onPrevStation}
          className="w-12 h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 flex items-center justify-center active:scale-95 transition-transform"
          title="Emisora Anterior"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        <button
          onClick={onTogglePlay}
          className="w-13 h-13 [@media(max-height:750px)]:w-12 [@media(max-height:750px)]:h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          title={isPlaying ? 'Pausar / Detener' : 'Reproducir'}
        >
          {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white translate-x-0.5" />}
        </button>

        <button
          onClick={onNextStation}
          className="w-12 h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 flex items-center justify-center active:scale-95 transition-transform"
          title="Emisora Siguiente"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
