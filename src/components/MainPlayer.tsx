import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Radio as RadioIcon, Signal, Sparkles, Car, Minus, Plus } from 'lucide-react';
import { Station } from '../types';
import { ConnectionStatus } from '../services/watchdog';

interface MainPlayerProps {
  currentStation: Station | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextStation: () => void;
  onPrevStation: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  muted: boolean;
  onToggleMute: () => void;
  connectionStatus: ConnectionStatus;
  onOpenStations?: () => void;
  hasTeslaSession?: boolean;
  onTeslaVolumeDown?: () => void;
  onTeslaVolumeUp?: () => void;
  activeShiftState?: 'P' | 'D' | 'R' | 'N' | null;
  isReverseDimmed?: boolean;
}

export const MainPlayer: React.FC<MainPlayerProps> = ({
  currentStation,
  isPlaying,
  onTogglePlay,
  onNextStation,
  onPrevStation,
  volume,
  onVolumeChange,
  muted,
  onToggleMute,
  connectionStatus,
  onOpenStations,
  hasTeslaSession,
  onTeslaVolumeDown,
  onTeslaVolumeUp,
  activeShiftState,
  isReverseDimmed,
}) => {
  const [songTitle, setSongTitle] = useState('Transmisión en Directo • AudioCar High-Res Stream');

  useEffect(() => {
    if (currentStation) {
      setSongTitle(`En emisión: ${currentStation.name} (${currentStation.country})`);
      const timer = setInterval(() => {
        const sampleTracks = [
          `Música en directo desde ${currentStation.country}`,
          `Hits & Clásicos • ${currentStation.name}`,
          `Programa Informativo de Cabina`,
          `Sesión Continua 24/7`,
        ];
        setSongTitle(sampleTracks[Math.floor(Math.random() * sampleTracks.length)]);
      }, 15000);
      return () => clearInterval(timer);
    }
  }, [currentStation]);

  return (
    <main className="flex-1 h-full flex flex-col items-center justify-between p-4 md:p-8 [@media(max-height:750px)]:p-3 [@media(max-height:750px)]:py-2.5 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 select-none overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Station Info Header */}
      <div className="w-full max-w-2xl flex items-center justify-between shrink-0 z-10 gap-2">
        <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 [@media(max-height:750px)]:py-1 rounded-2xl">
          <Signal className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-medium text-slate-300">
            {currentStation?.bitrate ? `${currentStation.bitrate} kbps` : '128 kbps'} • {currentStation?.codec || 'MP3'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {hasTeslaSession && (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 [@media(max-height:750px)]:py-1 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-xs font-mono text-emerald-300">
              <Car className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tesla Conectado</span>
              {activeShiftState && (
                <span className={`ml-1 px-1.5 py-0.2 rounded font-bold ${
                  activeShiftState === 'R' ? 'bg-red-600 text-white' : 'bg-slate-800 text-emerald-300'
                }`}>
                  {activeShiftState}
                </span>
              )}
              {isReverseDimmed && (
                <span className="text-[10px] text-amber-300 font-semibold ml-1">
                  (Atenuado R)
                </span>
              )}
            </div>
          )}

          {currentStation?.playCount !== undefined && (
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 [@media(max-height:750px)]:py-1 rounded-2xl bg-red-600/20 border border-red-500/30 text-xs font-mono text-red-400">
              <span>Reproducciones: {currentStation.playCount}</span>
            </div>
          )}

          {onOpenStations && (
            <button
              onClick={onOpenStations}
              className="min-[1100px]:hidden px-3.5 py-1.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors"
            >
              Cambiar Emisora
            </button>
          )}
        </div>
      </div>

      {/* Center Artwork / Logo & Visualizer */}
      <div className="flex flex-col items-center justify-center my-auto py-2 [@media(max-height:750px)]:py-1 space-y-5 [@media(max-height:750px)]:space-y-2.5 w-full max-w-md z-10 min-h-0">
        <div className="relative group shrink-0">
          {isPlaying && (
            <>
              <div className="absolute inset-0 rounded-3xl bg-red-600/20 animate-ping opacity-40"></div>
              <div className="absolute -inset-2.5 rounded-[30px] border border-red-500/30 animate-pulse"></div>
            </>
          )}

          <div className="relative w-44 h-44 md:w-56 md:h-56 [@media(max-height:750px)]:w-28 [@media(max-height:750px)]:h-28 [@media(max-height:600px)]:w-20 [@media(max-height:600px)]:h-20 rounded-3xl bg-slate-900 border-2 border-slate-800 shadow-2xl shadow-red-950/40 flex items-center justify-center overflow-hidden transition-all">
            {currentStation?.favicon ? (
              <img
                src={currentStation.favicon}
                alt={currentStation.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <RadioIcon className="w-14 h-14 [@media(max-height:750px)]:w-10 [@media(max-height:750px)]:h-10 text-red-500 mb-2 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">AudioCar High-Res</span>
              </div>
            )}

            <div className="absolute bottom-2 px-2.5 py-0.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-800 text-[9px] font-mono tracking-widest text-red-400 uppercase">
              {connectionStatus === 'online' ? '● En Directo' : '○ Reconectando'}
            </div>
          </div>
        </div>

        {/* Station Title & Metadata */}
        <div className="text-center space-y-1 [@media(max-height:750px)]:space-y-0.5 w-full px-4">
          <h2 className="text-2xl md:text-3xl [@media(max-height:750px)]:text-xl font-extrabold tracking-tight text-white truncate">
            {currentStation ? currentStation.name : 'Selecciona una Emisora'}
          </h2>
          <p className="text-sm [@media(max-height:750px)]:text-xs text-slate-400 font-medium truncate flex items-center justify-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span className="truncate">{songTitle}</span>
          </p>
        </div>

        {/* Live Audio Waves Equalizer Animation */}
        <div className="flex items-center space-x-1 h-8 [@media(max-height:750px)]:h-5 w-48 justify-center shrink-0">
          {[...Array(16)].map((_, i) => (
            <span
              key={i}
              className={`w-1.5 rounded-full transition-all duration-300 ${
                isPlaying ? 'bg-gradient-to-t from-red-600 to-amber-400 animate-pulse' : 'bg-slate-800 h-1.5'
              }`}
              style={{
                height: isPlaying ? `${Math.max(10, Math.sin(i + Date.now() / 200) * 20 + 14)}px` : '6px',
                animationDelay: `${i * 75}ms`,
              }}
            ></span>
          ))}
        </div>
      </div>

      {/* Giant Touch Controls & Volume Bar */}
      <div className="w-full max-w-xl space-y-4 [@media(max-height:750px)]:space-y-2.5 bg-slate-900/80 border border-slate-800/80 p-5 [@media(max-height:750px)]:p-3.5 rounded-3xl backdrop-blur-xl shadow-2xl shrink-0 z-10">
        <div className="flex items-center justify-center space-x-6 md:space-x-10">
          <button
            onClick={onPrevStation}
            className="p-4 [@media(max-height:750px)]:p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white transition-all active:scale-95"
            title="Emisora Anterior"
          >
            <SkipBack className="w-6 h-6 [@media(max-height:750px)]:w-5 [@media(max-height:750px)]:h-5" />
          </button>

          <button
            onClick={onTogglePlay}
            className="p-5 [@media(max-height:750px)]:p-4 rounded-3xl bg-gradient-to-tr from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white shadow-xl shadow-red-950/50 transition-all active:scale-95 flex items-center justify-center"
            title={isPlaying ? 'Pausar (Sincronizado con Tesla)' : 'Reproducir (Sincronizado con Tesla)'}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 [@media(max-height:750px)]:w-7 [@media(max-height:750px)]:h-7 fill-white" />
            ) : (
              <Play className="w-8 h-8 [@media(max-height:750px)]:w-7 [@media(max-height:750px)]:h-7 fill-white translate-x-0.5" />
            )}
          </button>

          <button
            onClick={onNextStation}
            className="p-4 [@media(max-height:750px)]:p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white transition-all active:scale-95"
            title="Emisora Siguiente"
          >
            <SkipForward className="w-6 h-6 [@media(max-height:750px)]:w-5 [@media(max-height:750px)]:h-5" />
          </button>
        </div>

        {/* Volume & Mute Row + Physical Tesla Car Volume Buttons (when audiocar_tesla_session exists) */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 pt-2 [@media(max-height:750px)]:pt-1.5 border-t border-slate-800/60">
          <div className="flex items-center space-x-3 flex-1 min-w-[180px]">
            <button
              onClick={onToggleMute}
              className="text-slate-400 hover:text-white transition-colors p-1"
              title="Silenciar"
            >
              {muted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={muted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
            <span className="text-xs font-mono text-slate-400 w-9 text-right shrink-0">
              {Math.round((muted ? 0 : volume) * 100)}%
            </span>
          </div>

          {hasTeslaSession && (
            <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto justify-end">
              <button
                onClick={onTeslaVolumeDown}
                className="min-h-[48px] px-3.5 py-2 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-slate-100 font-bold text-xs flex items-center space-x-1.5 shadow-md active:scale-95 transition-all"
                title="Bajar Volumen Físico del Coche (Tesla Fleet API)"
              >
                <Car className="w-4 h-4 text-red-400" />
                <Minus className="w-3.5 h-3.5" />
                <span>Vol -</span>
              </button>

              <button
                onClick={onTeslaVolumeUp}
                className="min-h-[48px] px-3.5 py-2 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-slate-100 font-bold text-xs flex items-center space-x-1.5 shadow-md active:scale-95 transition-all"
                title="Subir Volumen Físico del Coche (Tesla Fleet API)"
              >
                <Car className="w-4 h-4 text-emerald-400" />
                <Plus className="w-3.5 h-3.5" />
                <span>Vol +</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
