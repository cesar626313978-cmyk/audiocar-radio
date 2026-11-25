import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Radio as RadioIcon, Signal, Sparkles } from 'lucide-react';
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
    <main className="flex-1 flex flex-col items-center justify-between p-6 md:p-10 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 select-none overflow-y-auto relative">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Station Info Header */}
      <div className="w-full max-w-2xl flex items-center justify-between">
        <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-2xl">
          <Signal className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-medium text-slate-300">
            {currentStation?.bitrate ? `${currentStation.bitrate} kbps` : '128 kbps'} • {currentStation?.codec || 'MP3'}
          </span>
        </div>

        {currentStation?.playCount !== undefined && (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl bg-red-600/20 border border-red-500/30 text-xs font-mono text-red-400">
            <span>Reproducciones: {currentStation.playCount}</span>
          </div>
        )}
      </div>

      {/* Center Artwork / Logo & Visualizer */}
      <div className="flex flex-col items-center my-auto py-6 space-y-8 w-full max-w-md">
        <div className="relative group">
          {isPlaying && (
            <>
              <div className="absolute inset-0 rounded-3xl bg-red-600/20 animate-ping opacity-40"></div>
              <div className="absolute -inset-3 rounded-[32px] border border-red-500/30 animate-pulse"></div>
            </>
          )}

          <div className="relative w-48 h-48 md:w-60 md:h-60 rounded-3xl bg-slate-900 border-2 border-slate-800 shadow-2xl shadow-red-950/40 flex items-center justify-center overflow-hidden">
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
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <RadioIcon className="w-16 h-16 text-red-500 mb-3 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">AudioCar High-Res</span>
              </div>
            )}

            <div className="absolute bottom-3 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] font-mono tracking-widest text-red-400 uppercase">
              {connectionStatus === 'online' ? '● En Directo' : '○ Reconectando'}
            </div>
          </div>
        </div>

        {/* Station Title & Metadata */}
        <div className="text-center space-y-2 w-full px-4">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white truncate">
            {currentStation ? currentStation.name : 'Selecciona una Emisora'}
          </h2>
          <p className="text-sm text-slate-400 font-medium truncate flex items-center justify-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span className="truncate">{songTitle}</span>
          </p>
        </div>

        {/* Live Audio Waves Equalizer Animation */}
        <div className="flex items-center space-x-1 h-10 w-48 justify-center">
          {[...Array(16)].map((_, i) => (
            <span
              key={i}
              className={`w-1.5 rounded-full transition-all duration-300 ${
                isPlaying ? 'bg-gradient-to-t from-red-600 to-amber-400 animate-pulse' : 'bg-slate-800 h-2'
              }`}
              style={{
                height: isPlaying ? `${Math.max(15, Math.sin(i + Date.now() / 200) * 35 + 20)}px` : '8px',
                animationDelay: `${i * 75}ms`,
              }}
            ></span>
          ))}
        </div>
      </div>

      {/* Giant Touch Controls & Volume Bar */}
      <div className="w-full max-w-xl space-y-6 bg-slate-900/80 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-center space-x-6 md:space-x-10">
          <button
            onClick={onPrevStation}
            className="p-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white transition-all active:scale-95"
            title="Emisora Anterior"
          >
            <SkipBack className="w-6 h-6" />
          </button>

          <button
            onClick={onTogglePlay}
            className="p-6 rounded-3xl bg-gradient-to-tr from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white shadow-xl shadow-red-950/50 transition-all active:scale-95 flex items-center justify-center"
            title={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? <Pause className="w-8 h-8 fill-white" /> : <Play className="w-8 h-8 fill-white translate-x-0.5" />}
          </button>

          <button
            onClick={onNextStation}
            className="p-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white transition-all active:scale-95"
            title="Emisora Siguiente"
          >
            <SkipForward className="w-6 h-6" />
          </button>
        </div>

        {/* Volume & Mute Row */}
        <div className="flex items-center space-x-4 pt-2 border-t border-slate-800/60">
          <button
            onClick={onToggleMute}
            className="text-slate-400 hover:text-white transition-colors"
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
          <span className="text-xs font-mono text-slate-400 w-10 text-right">
            {Math.round((muted ? 0 : volume) * 100)}%
          </span>
        </div>
      </div>
    </main>
  );
};
