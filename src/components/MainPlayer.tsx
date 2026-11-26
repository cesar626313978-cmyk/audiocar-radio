import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Signal,
  Sparkles,
  Car,
  Minus,
  Plus,
  Heart,
} from 'lucide-react';
import { Station } from '../types';
import { ConnectionStatus } from '../services/watchdog';
import { AudioWaveVisualizer } from './AudioWaveVisualizer';
import { StationArtwork } from './StationArtwork';

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
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  compactHeaderOnly?: boolean;
  onBackToPlayer?: () => void;
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
  isFavorite = false,
  onToggleFavorite,
  compactHeaderOnly = false,
  onBackToPlayer,
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

  // Cabecera compacta superior del mismo reproductor principal cuando se abre la vista "📻 Emisoras / Favoritos" en < 1100px
  if (compactHeaderOnly) {
    return (
      <section className="min-[1100px]:hidden w-full bg-slate-900/95 border-b border-white/10 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3 shrink-0 select-none z-20 shadow-lg">
        <div
          onClick={onBackToPlayer}
          className="flex items-center space-x-3 min-w-0 flex-1 cursor-pointer active:opacity-80"
        >
          <div className="relative w-13 h-13 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
            <StationArtwork station={currentStation} size="sm" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-red-400 truncate">
                {connectionStatus === 'online' ? 'Sonando ahora' : 'Reconectando...'}
              </span>
            </div>
            <h2 className="font-extrabold text-sm sm:text-base text-white truncate">
              {currentStation ? currentStation.name : 'Selecciona una Emisora'}
            </h2>
            <p className="text-xs text-slate-400 truncate">{songTitle}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={onPrevStation}
            className="hidden sm:flex min-w-[52px] min-h-[52px] rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 items-center justify-center active:scale-95 transition-all"
            title="Emisora Anterior"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={onTogglePlay}
            className="min-w-[54px] min-h-[54px] px-4 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white shadow-lg shadow-red-950/50 flex items-center justify-center active:scale-95 transition-all"
            title={isPlaying ? 'Pausar / Stop' : 'Reproducir'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white translate-x-0.5" />
            )}
          </button>

          <button
            onClick={onNextStation}
            className="hidden sm:flex min-w-[52px] min-h-[52px] rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 items-center justify-center active:scale-95 transition-all"
            title="Emisora Siguiente"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          {onBackToPlayer && (
            <button
              onClick={onBackToPlayer}
              className="min-h-[48px] sm:min-h-[52px] px-3 sm:px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs sm:text-sm flex items-center space-x-1.5 shadow-md active:scale-95 transition-all whitespace-nowrap"
              title="Volver al Reproductor Principal"
            >
              <span className="sm:hidden">🔊 Reproductor</span>
              <span className="hidden sm:inline">🔊 Volver al Reproductor</span>
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <main className="flex-1 h-full flex flex-col items-center justify-between p-4 md:p-8 [@media(max-height:750px)]:p-3 [@media(max-height:750px)]:py-2.5 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 select-none overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Station Info Header */}
      <div className="w-full max-w-2xl flex items-center justify-between shrink-0 z-10 gap-2">
        <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800 px-3.5 py-2 [@media(max-height:750px)]:py-1.5 rounded-2xl">
          <Signal className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-medium text-slate-300">
            {currentStation?.bitrate ? `${currentStation.bitrate} kbps` : '128 kbps'} • {currentStation?.codec || 'MP3'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {hasTeslaSession && (
            <div className="flex items-center space-x-1.5 px-3 py-2 [@media(max-height:750px)]:py-1.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-xs font-mono text-emerald-300">
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
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-2 [@media(max-height:750px)]:py-1.5 rounded-2xl bg-red-600/20 border border-red-500/30 text-xs font-mono text-red-400">
              <span>Reproducciones: {currentStation.playCount}</span>
            </div>
          )}

          {onOpenStations && (
            <button
              onClick={onOpenStations}
              className="min-[1100px]:hidden min-h-[48px] px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-100 transition-colors active:scale-95"
            >
              📻 Cambiar Emisora
            </button>
          )}
        </div>
      </div>

      {/* Center Artwork / Logo & Visualizer */}
      <div className="flex flex-col items-center justify-center my-auto py-2 [@media(max-height:750px)]:py-1 space-y-5 [@media(max-height:750px)]:space-y-2 w-full max-w-md z-10 min-h-0">
        <div className="relative group shrink-0">
          {isPlaying && (
            <>
              <div className="absolute inset-0 rounded-3xl bg-red-600/20 animate-ping opacity-40"></div>
              <div className="absolute -inset-2.5 rounded-[30px] border border-red-500/30 animate-pulse"></div>
            </>
          )}

          <div className="relative w-44 h-44 md:w-56 md:h-56 [@media(max-height:750px)]:w-28 [@media(max-height:750px)]:h-28 [@media(max-height:600px)]:w-20 [@media(max-height:600px)]:h-20 rounded-3xl bg-slate-900 border-2 border-slate-800 shadow-2xl shadow-red-950/40 flex items-center justify-center overflow-hidden transition-all">
            <StationArtwork station={currentStation} size="lg" />

            <div className="absolute bottom-2 z-20 px-2.5 py-0.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-800 text-[9px] font-mono tracking-widest text-red-400 uppercase">
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

        {/* High-Definition 60 FPS Symmetric 56-Bar Canvas Audio Wave Visualizer */}
        <AudioWaveVisualizer
          isPlaying={isPlaying}
          connectionStatus={connectionStatus}
        />
      </div>

      {/* Giant Touch Controls & Volume Bar (Tesla Model 3 Ergonomics: min 52x52px buttons with generous spacing) */}
      <div className="w-full max-w-xl space-y-4 [@media(max-height:750px)]:space-y-2.5 bg-slate-900/80 border border-slate-800/80 p-5 [@media(max-height:750px)]:p-3.5 rounded-3xl backdrop-blur-xl shadow-2xl shrink-0 z-10">
        <div className="flex items-center justify-center gap-4 sm:gap-7">
          <button
            onClick={onPrevStation}
            className="min-w-[56px] min-h-[56px] p-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white transition-all active:scale-95 flex items-center justify-center shadow-md"
            title="Emisora Anterior"
          >
            <SkipBack className="w-6 h-6" />
          </button>

          <button
            onClick={onTogglePlay}
            className="min-w-[68px] min-h-[68px] [@media(max-height:750px)]:min-w-[60px] [@media(max-height:750px)]:min-h-[60px] p-5 [@media(max-height:750px)]:p-4 rounded-3xl bg-gradient-to-tr from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white shadow-xl shadow-red-950/50 transition-all active:scale-95 flex items-center justify-center"
            title={isPlaying ? 'Pausar / Stop (Sincronizado con Tesla)' : 'Reproducir (Sincronizado con Tesla)'}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-white" />
            ) : (
              <Play className="w-8 h-8 fill-white translate-x-0.5" />
            )}
          </button>

          <button
            onClick={onNextStation}
            className="min-w-[56px] min-h-[56px] p-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white transition-all active:scale-95 flex items-center justify-center shadow-md"
            title="Emisora Siguiente"
          >
            <SkipForward className="w-6 h-6" />
          </button>

          {onToggleFavorite && (
            <button
              onClick={onToggleFavorite}
              className={`min-w-[56px] min-h-[56px] p-4 rounded-2xl border transition-all active:scale-95 flex items-center justify-center shadow-md ${
                isFavorite
                  ? 'bg-red-600/20 border-red-500/60 text-red-500 shadow-red-950/40'
                  : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title={isFavorite ? 'Quitar de Favoritos' : 'Guardar en Favoritos'}
            >
              <Heart className={`w-6 h-6 ${isFavorite ? 'fill-red-500' : ''}`} />
            </button>
          )}
        </div>

        {/* Volume & Mute Row (min 52x52px touch targets) + Physical Tesla Car Volume Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 pt-2.5 [@media(max-height:750px)]:pt-2 border-t border-slate-800/60">
          <div className="flex items-center space-x-3 flex-1 min-w-[200px]">
            <button
              onClick={onToggleMute}
              className="min-w-[52px] min-h-[52px] rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all active:scale-95 flex items-center justify-center shrink-0"
              title={muted || volume === 0 ? 'Activar sonido' : 'Silenciar'}
            >
              {muted || volume === 0 ? <VolumeX className="w-6 h-6 text-red-400" /> : <Volume2 className="w-6 h-6" />}
            </button>

            <div className="flex-1 flex items-center min-h-[52px] px-3 rounded-2xl bg-slate-950/90 border border-slate-800/80 space-x-3">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={muted ? 0 : volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
              <span className="text-xs font-mono font-bold text-slate-300 w-10 text-right shrink-0">
                {Math.round((muted ? 0 : volume) * 100)}%
              </span>
            </div>
          </div>

          {hasTeslaSession && (
            <div className="flex items-center space-x-2.5 shrink-0 w-full sm:w-auto justify-end">
              <button
                onClick={onTeslaVolumeDown}
                className="min-w-[52px] min-h-[52px] px-4 py-2 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-slate-100 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md active:scale-95 transition-all"
                title="Bajar Volumen Físico del Coche (Tesla Fleet API)"
              >
                <Car className="w-4 h-4 text-red-400" />
                <Minus className="w-4 h-4" />
                <span>Vol -</span>
              </button>

              <button
                onClick={onTeslaVolumeUp}
                className="min-w-[52px] min-h-[52px] px-4 py-2 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-slate-100 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md active:scale-95 transition-all"
                title="Subir Volumen Físico del Coche (Tesla Fleet API)"
              >
                <Car className="w-4 h-4 text-emerald-400" />
                <Plus className="w-4 h-4" />
                <span>Vol +</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
