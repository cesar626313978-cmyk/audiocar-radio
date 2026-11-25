import React, { useState } from 'react';
import { Search, Heart, Globe, Clock, Star, Play, Trash2, Radio as RadioIcon, Sparkles } from 'lucide-react';
import { Station, RadioTab } from '../types';

interface SidebarDirectoryProps {
  currentStation: Station | null;
  isPlaying: boolean;
  onSelectStation: (station: Station) => void;
  favorites: Station[];
  recent: Station[];
  customStations: Station[];
  spainStations: Station[];
  worldStations: Station[];
  onToggleFavorite: (station: Station) => void;
  onDeleteCustom: (id: string) => void;
  onSearch: (query: string) => void;
  onSelectGenre: (genre: string) => void;
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
  favorites,
  recent,
  customStations,
  spainStations,
  worldStations,
  onToggleFavorite,
  onDeleteCustom,
  onSearch,
  onSelectGenre,
}) => {
  const [activeTab, setActiveTab] = useState<RadioTab>('favorites');
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
      // Return combined search results or filtered list
      const all = [...favorites, ...spainStations, ...worldStations, ...customStations];
      const q = searchQuery.toLowerCase();
      return all.filter(s => s.name.toLowerCase().includes(q) || s.tags?.some(t => t.includes(q)));
    }

    switch (activeTab) {
      case 'favorites':
        return [...favorites, ...customStations];
      case 'spain':
        return spainStations;
      case 'world':
        return worldStations;
      case 'recent':
        return recent;
      default:
        return favorites;
    }
  };

  const stations = getDisplayStations();

  return (
    <aside className="w-full lg:w-96 flex flex-col bg-slate-900/60 border-r border-white/10 select-none overflow-hidden shrink-0">
      {/* Search & Tabs */}
      <div className="p-4 border-b border-white/10 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Buscar emisora o género..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`py-2 rounded-lg text-xs font-medium flex flex-col items-center justify-center transition-all ${
              activeTab === 'favorites' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Star className="w-3.5 h-3.5 mb-0.5" />
            <span>Favoritas</span>
          </button>
          <button
            onClick={() => setActiveTab('spain')}
            className={`py-2 rounded-lg text-xs font-medium flex flex-col items-center justify-center transition-all ${
              activeTab === 'spain' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <RadioIcon className="w-3.5 h-3.5 mb-0.5" />
            <span>España</span>
          </button>
          <button
            onClick={() => setActiveTab('world')}
            className={`py-2 rounded-lg text-xs font-medium flex flex-col items-center justify-center transition-all ${
              activeTab === 'world' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5 mb-0.5" />
            <span>Mundial</span>
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`py-2 rounded-lg text-xs font-medium flex flex-col items-center justify-center transition-all ${
              activeTab === 'recent' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 mb-0.5" />
            <span>Recientes</span>
          </button>
        </div>

        {/* Genre Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
          {GENRES.map(genre => (
            <button
              key={genre}
              onClick={() => handleGenreClick(genre)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedGenre === genre
                  ? 'bg-white text-slate-950 font-semibold'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {genre.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Stations List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
        {stations.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No se encontraron emisoras</p>
          </div>
        ) : (
          stations.map(station => {
            const isSelected = currentStation?.id === station.id;
            const isFav = favorites.some(f => f.id === station.id);

            return (
              <div
                key={station.id}
                onClick={() => onSelectStation(station)}
                className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-red-600/10 border-red-500/50 shadow-lg shadow-red-950/20'
                    : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="relative w-11 h-11 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
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
                      <RadioIcon className="w-5 h-5 text-slate-500" />
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
                    <h3 className={`font-semibold text-sm truncate ${isSelected ? 'text-red-400' : 'text-slate-200'}`}>
                      {station.name}
                    </h3>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                      <span className="uppercase">{station.countrycode || station.country}</span>
                      <span>•</span>
                      <span>{station.bitrate ? `${station.bitrate} kbps` : '128 kbps'}</span>
                      {station.codec && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-[10px] bg-slate-800 px-1 rounded">{station.codec}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 pl-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(station);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      isFav ? 'text-red-500 hover:text-red-400' : 'text-slate-600 hover:text-slate-400'
                    }`}
                    title={isFav ? 'Quitar de favoritas' : 'Añadir a favoritas'}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500' : ''}`} />
                  </button>

                  {station.isCustom && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCustom(station.id);
                      }}
                      className="p-2 rounded-lg text-slate-600 hover:text-red-400 transition-colors"
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
