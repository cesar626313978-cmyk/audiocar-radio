import React, { useState } from 'react';
import { Search, TrendingUp, Globe, Clock, Trash2, Radio as RadioIcon, Sparkles, RotateCcw, Volume2 } from 'lucide-react';
import { Station, RadioTab } from '../types';

interface SidebarDirectoryProps {
  currentStation: Station | null;
  isPlaying: boolean;
  onSelectStation: (station: Station) => void;
  mostPlayed: Station[];
  recent: Station[];
  customStations: Station[];
  spainStations: Station[];
  worldStations: Station[];
  onDeleteCustom: (id: string) => void;
  onSearch: (query: string) => void;
  onSelectGenre: (genre: string) => void;
  onResetPlayCounts: () => void;
  onBackToPlayer?: () => void;
}

const GENRES = [
  'Todos',
  'pop',
  'rock',
  'news',
  'jazz',
  'electronic',
  'lofi',
  'classical',
  '80s',
];

export const SidebarDirectory: React.FC<SidebarDirectoryProps> = ({
  currentStation,
  isPlaying,
  onSelectStation,
  mostPlayed,
  recent,
  customStations,
  spainStations,
  worldStations,
  onDeleteCustom,
  onSearch,
  onSelectGenre,
  onResetPlayCounts,
  onBackToPlayer,
}) => {
  const [activeTab, setActiveTab] = useState<RadioTab>('mostPlayed');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Todos');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    onSearch(q);
  };

  const handleGenreClick = (genre: string) => {
    setSelectedGenre(genre);
    onSelectGenre(genre === 'Todos' ? '' : genre);
  };

  const getDisplayStations = (): Station[] => {
    if (searchQuery.trim()) {
      const all = [...mostPlayed, ...spainStations, ...worldStations, ...customStations];
      const map = new Map<string, Station>();
      all.forEach(s => map.set(s.id, s));
      const q = searchQuery.toLowerCase();
      return Array.from(map.values()).filter(
        s => s.name.toLowerCase().includes(q) || s.tags?.some(t => t.includes(q))
      );
    }

    switch (activeTab) {
      case 'mostPlayed':
        return mostPlayed;
      case 'spain':
        return spainStations;
      case 'world':
        return worldStations;
      case 'recent':
        return recent;
      default:
        return mostPlayed;
    }
  };

  const stations = getDisplayStations();

  return (
    <aside className="w-full min-[1100px]:w-[400px] h-full flex flex-col bg-slate-900/90 min-[1100px]:bg-slate-900/60 border-r border-white/10 select-none overflow-hidden shrink-0">
      {/* Search & Tabs */}
      <div className="p-3 sm:p-4 border-b border-white/10 space-y-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Buscar emisora o género..."
              className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          {onBackToPlayer && (
            <button
              onClick={onBackToPlayer}
              className="min-[1100px]:hidden min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 shrink-0 border border-slate-700"
            >
              <Volume2 className="w-4 h-4 text-red-400" />
              <span>Volver al Reproductor</span>
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('mostPlayed')}
            className={`min-h-[48px] py-2 rounded-lg text-xs font-semibold flex flex-col items-center justify-center transition-all ${
              activeTab === 'mostPlayed' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4 mb-0.5" />
            <span>Favoritos / Top</span>
          </button>
          <button
            onClick={() => setActiveTab('spain')}
            className={`min-h-[48px] py-2 rounded-lg text-xs font-semibold flex flex-col items-center justify-center transition-all ${
              activeTab === 'spain' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <RadioIcon className="w-4 h-4 mb-0.5" />
            <span>España</span>
          </button>
          <button
            onClick={() => setActiveTab('world')}
            className={`min-h-[48px] py-2 rounded-lg text-xs font-semibold flex flex-col items-center justify-center transition-all ${
              activeTab === 'world' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4 mb-0.5" />
            <span>Mundial</span>
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`min-h-[48px] py-2 rounded-lg text-xs font-semibold flex flex-col items-center justify-center transition-all ${
              activeTab === 'recent' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 mb-0.5" />
            <span>Recientes</span>
          </button>
        </div>

        {/* Genre Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
          {GENRES.map(genre => (
            <button
              key={genre}
              onClick={() => handleGenreClick(genre)}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedGenre === genre
                  ? 'bg-white text-slate-950 font-bold'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {genre.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Subheader for Most Played with Reset Button */}
      {activeTab === 'mostPlayed' && (
        <div className="px-4 py-2 bg-slate-950/40 border-b border-white/5 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Emisoras más escuchadas / Favoritos</span>
          <button
            onClick={onResetPlayCounts}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Reiniciar contador de reproducciones"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar</span>
          </button>
        </div>
      )}

      {/* Stations List (Responsive grid in full-screen <1100px view, single list in sidebar >=1100px) */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 md:grid-cols-2 min-[1100px]:grid-cols-1 gap-2.5 content-start no-scrollbar">
        {stations.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No se encontraron emisoras</p>
          </div>
        ) : (
          stations.map(station => {
            const isSelected = currentStation?.id === station.id;

            return (
              <div
                key={station.id}
                onClick={() => onSelectStation(station)}
                className={`group min-h-[60px] flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer active:scale-[0.99] ${
                  isSelected
                    ? 'bg-red-600/15 border-red-500/60 shadow-lg shadow-red-950/30'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                  <div className="relative w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                    {station.favicon ? (
                      <img
                        src={station.favicon}
                        alt={station.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <RadioIcon className="w-6 h-6 text-slate-500" />
                    )}
                    {isSelected && isPlaying && (
                      <div className="absolute inset-0 bg-red-950/60 backdrop-blur-[1px] flex items-center justify-center">
                        <div className="flex items-end space-x-0.5 h-4">
                          <span className="w-1 bg-red-500 animate-pulse h-full rounded-full"></span>
                          <span className="w-1 bg-red-500 animate-pulse h-2/3 rounded-full delay-75"></span>
                          <span className="w-1 bg-red-500 animate-pulse h-4/5 rounded-full delay-150"></span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className={`font-bold text-sm sm:text-base truncate ${isSelected ? 'text-red-400' : 'text-slate-100'}`}>
                      {station.name}
                    </h3>
                    <div className="flex items-center space-x-2 text-xs text-slate-400">
                      <span className="uppercase font-medium">{station.countrycode || station.country}</span>
                      <span>•</span>
                      <span>{station.bitrate ? `${station.bitrate} kbps` : '128 kbps'}</span>
                      {station.playCount !== undefined && station.playCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-red-400 font-mono font-semibold">▶ {station.playCount}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 pl-2">
                  {station.isCustom && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCustom(station.id);
                      }}
                      className="p-2.5 rounded-xl text-slate-500 hover:text-red-400 transition-colors"
                      title="Eliminar emisora personalizada"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
