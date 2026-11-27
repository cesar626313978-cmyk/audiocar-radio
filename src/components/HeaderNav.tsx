import React from 'react';
import { Radio, Sun, Moon, Sliders, ShieldAlert, Wifi, RefreshCw, Home, Plus } from 'lucide-react';
import { ThemeMode } from '../types';
import { ConnectionStatus } from '../services/watchdog';

interface HeaderNavProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  connectionStatus: ConnectionStatus;
  onOpenEQ: () => void;
  onOpenCustom: () => void;
  mobileView: 'player' | 'stations';
  onToggleMobileView: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  theme,
  onThemeChange,
  connectionStatus,
  onOpenEQ,
  onOpenCustom,
  mobileView,
  onToggleMobileView,
}) => {
  const cycleTheme = () => {
    if (theme === 'dark') onThemeChange('light');
    else if (theme === 'light') onThemeChange('auto');
    else onThemeChange('dark');
  };

  return (
    <header className="min-h-16 px-2.5 sm:px-4 md:px-6 py-1.5 flex items-center justify-between border-b border-white/10 bg-slate-950/90 backdrop-blur-md text-slate-100 select-none z-30 shrink-0 gap-1.5 sm:gap-3">
      {/* Left: Brand / Logo + Conmutador de vista rápido (< 1100px) */}
      <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4 min-w-0 flex-1">
        <div className="flex items-center space-x-2.5 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-900/30 shrink-0">
            <Radio className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-pulse" />
          </div>
          <div className="hidden md:block">
            <h1 className="font-bold text-base md:text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent leading-tight">
              AudioCar <span className="text-red-500 font-extrabold">Radio</span>
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono hidden lg:block">Tesla OS Stream</p>
          </div>
        </div>

        {/* Conmutador de vista rápido para conducción en pantallas < 1100px */}
        <button
          onClick={onToggleMobileView}
          className={`min-[1100px]:hidden min-h-[42px] sm:min-h-[48px] px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center transition-all active:scale-95 shadow-lg border whitespace-nowrap truncate max-w-full ${
            mobileView === 'stations'
              ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white border-red-400/50 shadow-red-950/50'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-100 border-red-500/40 shadow-red-950/20'
          }`}
          title="Alternar entre Emisoras y Reproductor"
        >
          {mobileView === 'player' ? (
            <>
              <span className="sm:hidden">📻 Emisoras</span>
              <span className="hidden sm:inline">📻 Emisoras / Favoritos</span>
            </>
          ) : (
            <span>🔊 Reproductor</span>
          )}
        </button>
      </div>

      {/* Center: Connection & Signal Badge */}
      <div className="hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs shrink-0">
        {connectionStatus === 'online' && (
          <>
            <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-medium">Señal Óptima (4G/5G)</span>
          </>
        )}
        {connectionStatus === 'buffering' && (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span className="text-amber-400 font-medium">Búfer Anti-Túnel...</span>
          </>
        )}
        {connectionStatus === 'reconnecting' && (
          <>
            <ShieldAlert className="w-3.5 h-3.5 text-red-500 animate-bounce" />
            <span className="text-red-400 font-semibold">Reconectando señal...</span>
          </>
        )}
        {connectionStatus === 'error' && (
          <>
            <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
            <span className="text-red-400 font-semibold">Corte de Stream</span>
          </>
        )}
      </div>

      {/* Right: Action Controls */}
      <div className="flex items-center gap-1 sm:gap-2 md:gap-2.5 shrink-0">
        <button
          onClick={onOpenCustom}
          className="min-h-[40px] sm:min-h-[44px] px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-red-600/25 hover:bg-red-600/35 border border-red-500/30 text-red-400 text-xs font-semibold transition-colors flex items-center gap-1 whitespace-nowrap"
          title="Añadir URL de Emisora Personalizada"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Emisora</span>
        </button>

        <button
          onClick={onOpenEQ}
          className="min-h-[40px] sm:min-h-[44px] p-2 sm:p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors flex items-center justify-center"
          title="Ecualizador de Cabina y Búfer"
        >
          <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          onClick={() => { window.location.href = '/'; }}
          className="min-h-[40px] sm:min-h-[44px] p-2 sm:p-2.5 sm:px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors flex items-center space-x-1.5"
          title="Volver al Launcher / Hub principal"
        >
          <Home className="w-4 h-4 text-red-500" />
          <span className="hidden md:inline text-xs font-semibold">Inicio / Hub</span>
        </button>

        <button
          onClick={cycleTheme}
          className="min-h-[40px] sm:min-h-[44px] p-2 sm:p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors flex items-center justify-center"
          title={`Tema: ${theme}`}
        >
          {theme === 'dark' ? <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" /> : <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />}
        </button>
      </div>
    </header>
  );
};
