import React, { useState, useMemo } from 'react';
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

const CATEGORIES = [
  'TODOS',
  'POP',
  'ROCK',
  'NEWS',
  'JAZZ',
  'ELECTRONIC',
  'LOFI',
  'CLASSICAL',
  '80S',
];

const CATEGORY_EQUIVALENTS: Record<string, string[]> = {
  pop: ['pop', 'top40', 'top 40', 'hits', 'éxitos', 'exitos', 'latin pop', 'eurohits', 'los 40', 'los40', 'europa fm', 'kiss fm'],
  rock: ['rock', 'classic rock', 'metal', 'hard rock', 'indie', 'alternative', 'punk', 'grunge', 'rock fm'],
  news: ['news', 'noticias', 'talk', 'radio hablada', 'informativos', 'actualidad', 'deportes', 'sports', 'public', 'cultura', 'culture', 'ser', 'cope', 'onda cero', 'rne', 'bbc'],
  jazz: ['jazz', 'blues', 'swing', 'bossa', 'smooth jazz', 'instrumental', 'soul'],
  electronic: ['electronic', 'electrónica', 'electronica', 'dance', 'house', 'techno', 'trance', 'edm', 'club', 'dj', 'bikinifm', 'bikini fm', 'flaix', 'máxima', 'maxima', 'loca fm'],
  lofi: ['lofi', 'lo-fi', 'chill', 'chillout', 'ambient', 'study', 'relax', 'downtempo'],
  classical: ['classical', 'clásica', 'clasica', 'orchestral', 'opera', 'ópera', 'symphony', 'piano', 'baroque'],
  '80s': ['80s', '90s', '70s', '80', '90', 'retro', 'oldies', 'classic hits', 'vintage', 'nostalgia', 'kiss fm'],
};

function matchesStationCategory(station: Station, selectedCategory: string): boolean {
  const cat = selectedCategory.trim().toLowerCase();
  if (!cat || cat === 'todos') return true;

  const keywords = CATEGORY_EQUIVALENTS[cat] || [cat];

  const tagsText = Array.isArray(station.tags)
    ? station.tags.join(' ')
    : typeof station.tags === 'string'
    ? station.tags
    : '';

  const searchableText = [
    station.name || '',
    station.genre || '',
    station.category || '',
    tagsText,
  ]
    .join(' ')
    .toLowerCase();

  return keywords.some(kw => searchableText.includes(kw.toLowerCase()));
}

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
  const [selectedCategory, setSelectedCategory] = useState('TODOS');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    onSearch(q);
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    const normalizedTag = category === 'TODOS' ? '' : category.toLowerCase();
    onSelectGenre(normalizedTag);
  };

  const filteredStations = useMemo<Station[]>(() => {
    const isAllCategories = selectedCategory.toUpperCase() === 'TODOS';
    const q = searchQuery.trim().toLowerCase();

    // Build a deduplicated pool of all available stations for global search or fallback matching
    const allPoolMap = new Map<string, Station>();
    [...mostPlayed, ...customStations, ...spainStations, ...worldStations, ...recent].forEach(s => {
      if (!allPoolMap.has(s.id)) {
        allPoolMap.set(s.id, s);
      }
    });
    const allPool = Array.from(allPoolMap.values());

    let baseList: Station[];
    if (q) {
      baseList = allPool.filter(s => {
        const tagsStr = Array.isArray(s.tags) ? s.tags.join(' ') : s.tags || '';
        return (
          s.name.toLowerCase().includes(q) ||
          tagsStr.toLowerCase().includes(q) ||
          (s.genre && s.genre.toLowerCase().includes(q)) ||
          (s.category && s.category.toLowerCase().includes(q))
        );
      });
    } else {
      switch (activeTab) {
        case 'mostPlayed':
          baseList = mostPlayed;
          break;
        case 'spain':
          baseList = spainStations;
          break;
        case 'world':
          baseList = worldStations;
          break;
        case 'recent':
          baseList = recent;
          break;
        default:
          baseList = mostPlayed;
      }
    }

    if (isAllCategories) {
      return baseList;
    }

    // Filter active tab stations by selectedCategory
    const tabMatches = baseList.filter(station => matchesStationCategory(station, selectedCategory));

    // Also include matching stations from the global pool (including fresh Radio Browser API results for that tag)
    // so even if a tab had few local matches, the user immediately sees matching stations for the chosen category
    const combinedMap = new Map<string, Station>();
    tabMatches.forEach(s => combinedMap.set(s.id, s));
    allPool
      .filter(station => matchesStationCategory(station, selectedCategory))
      .forEach(s => {
        if (!combinedMap.has(s.id)) {
          combinedMap.set(s.id, s);
        }
      });

    return Array.from(combinedMap.values());
  }, [
    selectedCategory,
    searchQuery,
    activeTab,
    mostPlayed,
    spainStations,
    worldStations,
    recent,
    customStations,
  ]);

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

        {/* Horizontal Category Filter Pills Carousel (Tesla Touch Optimized) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pr-6 pb-1">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={`h-10 px-4 shrink-0 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center justify-center ${
                selectedCategory === category
                  ? 'bg-white text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Subheader for Most Played with Reset Button */}
      {activeTab === 'mostPlayed' && (
        <div className="px-4 py-2 bg-slate-950/40 border-b border-white/5 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>
            {selectedCategory === 'TODOS'
              ? 'Emisoras más escuchadas / Favoritos'
              : `Filtrado por: ${selectedCategory} (${filteredStations.length})`}
          </span>
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

      {/* Stations List rendering filteredStations */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 md:grid-cols-2 min-[1100px]:grid-cols-1 gap-2.5 content-start no-scrollbar">
        {filteredStations.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500 space-y-2">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No se encontraron emisoras en "{selectedCategory}"</p>
            {selectedCategory !== 'TODOS' && (
              <button
                onClick={() => handleCategoryClick('TODOS')}
                className="mt-2 px-4 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold transition-colors"
              >
                Ver todas las emisoras
              </button>
            )}
          </div>
        ) : (
          filteredStations.map(station => {
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
