import React from 'react';
import { Radio, Sun, Moon, Sliders, ShieldAlert, Wifi, RefreshCw } from 'lucide-react';
import { ThemeMode } from '../types';
import { ConnectionStatus } from '../services/watchdog';

interface HeaderNavProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  connectionStatus: ConnectionStatus;
  onOpenEQ: () => void;
  onOpenCustom: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  theme,
  onThemeChange,
  connectionStatus,
  onOpenEQ,
  onOpenCustom,
}) => {
  const cycleTheme = () => {
    if (theme === 'dark') onThemeChange('light');
    else if (theme === 'light') onThemeChange('auto');
    else onThemeChange('dark');
  };

  return (
    <header className="h-16 px-4 md:px-6 flex items-center justify-between border-b border-white/10 bg-slate-950/80 backdrop-blur-md text-slate-100 select-none z-30 shrink-0">
      {/* Brand / Logo */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-900/30">
          <Radio className="w-6 h-6 text-white animate-pulse" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            AudioCar <span className="text-red-500 font-extrabold">Radio</span>
          </h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Tesla OS Stream</p>
        </div>
      </div>

      {/* Connection & Signal Badge */}
      <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
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

      {/* Action Controls */}
      <div className="flex items-center space-x-2 md:space-x-3">
        <button
          onClick={onOpenCustom}
          className="px-3 py-2 rounded-lg bg-red-600/25 hover:bg-red-600/35 border border-red-500/30 text-red-400 text-xs font-medium transition-colors flex items-center space-x-1.5"
          title="Añadir URL de Emisora Personalizada"
        >
          <span>+ Emisora</span>
        </button>

        <button
          onClick={onOpenEQ}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          title="Ecualizador de Cabina y Búfer"
        >
          <Sliders className="w-5 h-5" />
        </button>

        <button
          onClick={cycleTheme}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors flex items-center space-x-1"
          title={`Tema: ${theme}`}
        >
          {theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
        </button>
      </div>
    </header>
  );
};
