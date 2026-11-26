import React from 'react';
import { Sliders, X, Shield, Car } from 'lucide-react';
import { EQSettings, PreRollBuffer } from '../types';

interface AudioEqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  eq: EQSettings;
  onUpdateEQ: (eq: EQSettings) => void;
  buffer: PreRollBuffer;
  onUpdateBuffer: (buf: PreRollBuffer) => void;
  reverseDimEnabled: boolean;
  onToggleReverseDim: (enabled: boolean) => void;
  hasTeslaSession: boolean;
}

export const AudioEqualizerModal: React.FC<AudioEqualizerModalProps> = ({
  isOpen,
  onClose,
  eq,
  onUpdateEQ,
  buffer,
  onUpdateBuffer,
  reverseDimEnabled,
  onToggleReverseDim,
  hasTeslaSession,
}) => {
  if (!isOpen) return null;

  const handleSliderChange = (band: 'bass' | 'mid' | 'treble', val: number) => {
    const updated: EQSettings = { ...eq, [band]: val, preset: 'custom' };
    onUpdateEQ(updated);
  };

  const applyPreset = (preset: 'flat' | 'news' | 'bass-boost') => {
    let settings: EQSettings;
    if (preset === 'flat') settings = { bass: 0, mid: 0, treble: 0, preset: 'flat' };
    else if (preset === 'news') settings = { bass: -2, mid: 4, treble: 3, preset: 'news' };
    else settings = { bass: 6, mid: 1, treble: 4, preset: 'bass-boost' };
    onUpdateEQ(settings);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none animate-fadeIn">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-red-600/20 text-red-500">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Ecualizador de Cabina y Ajustes</h2>
              <p className="text-xs text-slate-400">Web Audio API • AGC Dinámico & Tesla Fleet API</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Presets de Audio</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => applyPreset('flat')}
              className={`py-2.5 rounded-xl text-xs font-medium border transition-all ${
                eq.preset === 'flat'
                  ? 'bg-red-600 border-red-500 text-white shadow-lg'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Plano (Original)
            </button>
            <button
              onClick={() => applyPreset('news')}
              className={`py-2.5 rounded-xl text-xs font-medium border transition-all ${
                eq.preset === 'news'
                  ? 'bg-red-600 border-red-500 text-white shadow-lg'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Voz / Noticias
            </button>
            <button
              onClick={() => applyPreset('bass-boost')}
              className={`py-2.5 rounded-xl text-xs font-medium border transition-all ${
                eq.preset === 'bass-boost'
                  ? 'bg-red-600 border-red-500 text-white shadow-lg'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Bass Boost (Cabina)
            </button>
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-300">Graves (Bass)</span>
              <span className="text-red-400 font-mono">{eq.bass > 0 ? `+${eq.bass}` : eq.bass} dB</span>
            </div>
            <input
              type="range"
              min="-15"
              max="15"
              step="1"
              value={eq.bass}
              onChange={(e) => handleSliderChange('bass', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-300">Medios (Mid)</span>
              <span className="text-red-400 font-mono">{eq.mid > 0 ? `+${eq.mid}` : eq.mid} dB</span>
            </div>
            <input
              type="range"
              min="-15"
              max="15"
              step="1"
              value={eq.mid}
              onChange={(e) => handleSliderChange('mid', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-300">Agudos (Treble)</span>
              <span className="text-red-400 font-mono">{eq.treble > 0 ? `+${eq.treble}` : eq.treble} dB</span>
            </div>
            <input
              type="range"
              min="-15"
              max="15"
              step="1"
              value={eq.treble}
              onChange={(e) => handleSliderChange('treble', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
          </div>
        </div>

        {/* Pre-roll Stability Buffer */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Búfer Anti-Túneles (Pre-roll)
            </label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([2, 5, 10] as PreRollBuffer[]).map((sec) => (
              <button
                key={sec}
                onClick={() => onUpdateBuffer(sec)}
                className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                  buffer === sec
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {sec === 2 ? 'Estándar (2s)' : sec === 5 ? 'Carretera (5s)' : 'Anti-Túnel (10s)'}
              </button>
            ))}
          </div>
        </div>

        {/* Tesla Fleet API: Atenuación automática en Marcha Atrás (R) */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-red-600/15 text-red-400 mt-0.5 shrink-0">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-white">
                    Atenuar volumen al aparcar (Marcha Atrás)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Baja automáticamente 3 puntos el volumen del Tesla al poner la marcha <span className="text-red-400 font-mono font-bold">R</span> y lo restaura al pasar a <span className="text-emerald-400 font-mono font-bold">D</span> o <span className="text-slate-200 font-mono font-bold">P</span>.
                </p>
                {!hasTeslaSession && (
                  <p className="text-[10px] text-amber-400/90 mt-1 font-medium">
                    Requiere sesión activa de Tesla Fleet (`audiocar_tesla_session`).
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={reverseDimEnabled}
              onClick={() => onToggleReverseDim(!reverseDimEnabled)}
              className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                reverseDimEnabled ? 'bg-red-600' : 'bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  reverseDimEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer Close */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-red-950/40 transition-all"
        >
          Guardar y Aplicar
        </button>
      </div>
    </div>
  );
};
