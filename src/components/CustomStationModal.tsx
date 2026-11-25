import React, { useState } from 'react';
import { PlusCircle, X, Radio as RadioIcon } from 'lucide-react';
import { Station } from '../types';

interface CustomStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStation: (station: Station) => void;
}

export const CustomStationModal: React.FC<CustomStationModalProps> = ({
  isOpen,
  onClose,
  onAddStation,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [genre, setGenre] = useState('Pop / Hits');
  const [favicon, setFavicon] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    const newStation: Station = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      url: url.trim(),
      country: 'Personalizada',
      countrycode: 'XX',
      tags: [genre.toLowerCase()],
      favicon: favicon.trim() || undefined,
      bitrate: 128,
      codec: 'MP3',
      isCustom: true,
    };

    onAddStation(newStation);
    setName('');
    setUrl('');
    setFavicon('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-red-600/20 text-red-500">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Añadir Emisora Personalizada</h2>
              <p className="text-xs text-slate-400">Pega cualquier stream MP3 / AAC / M3U8</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Nombre de la Emisora</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Radio Cabina Tesla"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">URL de Streaming (MP3/AAC/HLS)</label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://streaming.ejemplo.com/stream.mp3"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-red-500 font-mono text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Género / Estilo</label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="Ej. Rock, Lo-Fi, Noticias"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">URL de Logotipo / Favicon (Opcional)</label>
            <input
              type="url"
              value={favicon}
              onChange={(e) => setFavicon(e.target.value)}
              placeholder="https://ejemplo.com/logo.png"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-red-500 font-mono text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-red-950/40 transition-all mt-4"
          >
            Guardar Emisora
          </button>
        </form>
      </div>
    </div>
  );
};
