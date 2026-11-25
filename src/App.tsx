import React, { useState, useEffect } from 'react';
import { Station, ThemeMode, EQSettings, PreRollBuffer, UserSession } from './types';
import {
  getFavorites,
  saveFavorites,
  toggleFavorite as persistToggleFavorite,
  getRecentStations,
  addRecentStation,
  getCustomStations,
  addCustomStation,
  deleteCustomStation as persistDeleteCustom,
  getEQSettings,
  saveEQSettings,
  getPreRollBuffer,
  savePreRollBuffer,
  getThemeMode,
  saveThemeMode,
  getUserSession,
  saveUserSession,
} from './services/storage';
import {
  FALLBACK_STATIONS,
  searchStations,
  getSpainStations,
  getWorldStations,
} from './services/radioBrowser';
import { audioEngine } from './services/audioEngine';
import { watchdog, ConnectionStatus } from './services/watchdog';
import { HeaderNav } from './components/HeaderNav';
import { SidebarDirectory } from './components/SidebarDirectory';
import { MainPlayer } from './components/MainPlayer';
import { AudioEqualizerModal } from './components/AudioEqualizerModal';
import { CustomStationModal } from './components/CustomStationModal';
import { AuthQRModal } from './components/AuthQRModal';
import { DriveModeBar } from './components/DriveModeBar';

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(getThemeMode());
  const [favorites, setFavorites] = useState<Station[]>(getFavorites());
  const [recent, setRecent] = useState<Station[]>(getRecentStations());
  const [customStations, setCustomStations] = useState<Station[]>(getCustomStations());
  const [spainStations, setSpainStations] = useState<Station[]>([]);
  const [worldStations, setWorldStations] = useState<Station[]>([]);
  
  const [currentStation, setCurrentStation] = useState<Station | null>(favorites[0] || FALLBACK_STATIONS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.8);
  const [muted, setMuted] = useState<boolean>(false);

  const [eq, setEQ] = useState<EQSettings>(getEQSettings());
  const [buffer, setBuffer] = useState<PreRollBuffer>(getPreRollBuffer());
  const [session, setSession] = useState<UserSession>(getUserSession());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('online');

  const [isEQOpen, setIsEQOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Initial load of Spain and World stations
  useEffect(() => {
    getSpainStations().then(setSpainStations).catch(console.warn);
    getWorldStations().then(setWorldStations).catch(console.warn);
  }, []);

  // Theme effect
  useEffect(() => {
    saveThemeMode(theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // Auto
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) root.classList.add('dark');
      else root.classList.remove('dark');
    }
  }, [theme]);

  // Watchdog status listener
  useEffect(() => {
    const unsubscribe = watchdog.subscribe((status) => {
      setConnectionStatus(status);
    });
    return unsubscribe;
  }, []);

  // Audio Engine volume & EQ initial sync
  useEffect(() => {
    audioEngine.setVolume(volume);
    audioEngine.setMuted(muted);
    audioEngine.setEQ(eq);
  }, []);

  // MediaSession API Integration for Tesla steering wheel and system media cards
  useEffect(() => {
    if ('mediaSession' in navigator && currentStation) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentStation.name,
        artist: `AudioCar Radio • ${currentStation.country}`,
        album: currentStation.tags?.[0] ? `Género: ${currentStation.tags[0]}` : 'Streaming en Directo',
        artwork: currentStation.favicon
          ? [{ src: currentStation.favicon, sizes: '512x512', type: 'image/png' }]
          : [],
      });

      navigator.mediaSession.setActionHandler('play', () => handleTogglePlay());
      navigator.mediaSession.setActionHandler('pause', () => handleTogglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => handlePrevFavorite());
      navigator.mediaSession.setActionHandler('nexttrack', () => handleNextFavorite());
    }
  }, [currentStation]);

  const handleSelectStation = (station: Station) => {
    setCurrentStation(station);
    setIsPlaying(true);
    const updatedRecent = addRecentStation(station);
    setRecent(updatedRecent);

    audioEngine.loadStream(station.url, buffer);
    watchdog.start(station.url, buffer);
  };

  const handleTogglePlay = () => {
    if (!currentStation) return;
    if (isPlaying) {
      audioEngine.pause();
      watchdog.stop();
      setIsPlaying(false);
    } else {
      if (!audioEngine.getAudioElement().src) {
        audioEngine.loadStream(currentStation.url, buffer);
      } else {
        audioEngine.play();
      }
      watchdog.start(currentStation.url, buffer);
      setIsPlaying(true);
    }
  };

  const handleNextFavorite = () => {
    if (favorites.length === 0) return;
    const currentIndex = favorites.findIndex(s => s.id === currentStation?.id);
    const nextIndex = (currentIndex + 1) % favorites.length;
    handleSelectStation(favorites[nextIndex]);
  };

  const handlePrevFavorite = () => {
    if (favorites.length === 0) return;
    const currentIndex = favorites.findIndex(s => s.id === currentStation?.id);
    const prevIndex = (currentIndex - 1 + favorites.length) % favorites.length;
    handleSelectStation(favorites[prevIndex]);
  };

  const handleToggleFavorite = (station: Station) => {
    const updated = persistToggleFavorite(station);
    setFavorites(updated);
  };

  const handleAddCustom = (station: Station) => {
    const updated = addCustomStation(station);
    setCustomStations(updated);
    handleSelectStation(station);
  };

  const handleDeleteCustom = (id: string) => {
    const updated = persistDeleteCustom(id);
    setCustomStations(updated);
  };

  const handleUpdateEQ = (newEQ: EQSettings) => {
    setEQ(newEQ);
    saveEQSettings(newEQ);
    audioEngine.setEQ(newEQ);
  };

  const handleUpdateBuffer = (newBuf: PreRollBuffer) => {
    setBuffer(newBuf);
    savePreRollBuffer(newBuf);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    audioEngine.setVolume(vol);
    if (vol > 0 && muted) {
      setMuted(false);
      audioEngine.setMuted(false);
    }
  };

  const handleToggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    audioEngine.setMuted(newMuted);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    try {
      const results = await searchStations(query);
      setWorldStations(results);
    } catch (e) {
      console.warn('Search error', e);
    }
  };

  const handleSelectGenre = async (genre: string) => {
    if (!genre) {
      getWorldStations().then(setWorldStations);
      return;
    }
    try {
      const results = await getWorldStations(genre);
      setWorldStations(results);
    } catch (e) {
      console.warn('Genre fetch error', e);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Tesla OS Header Navigation */}
      <HeaderNav
        theme={theme}
        onThemeChange={setTheme}
        connectionStatus={connectionStatus}
        session={session}
        onOpenEQ={() => setIsEQOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenCustom={() => setIsCustomOpen(true)}
      />

      {/* Main Content Layout (Dual column for Desktop / Park mode, Single column for Mobile / Drive mode) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Directory (Desktop always visible, Mobile in drawer) */}
        <div
          className={`absolute lg:relative inset-y-0 left-0 z-30 transition-transform duration-300 transform ${
            isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <SidebarDirectory
            currentStation={currentStation}
            isPlaying={isPlaying}
            onSelectStation={(st) => {
              handleSelectStation(st);
              setIsMobileDrawerOpen(false);
            }}
            favorites={favorites}
            recent={recent}
            customStations={customStations}
            spainStations={spainStations}
            worldStations={worldStations}
            onToggleFavorite={handleToggleFavorite}
            onDeleteCustom={handleDeleteCustom}
            onSearch={handleSearch}
            onSelectGenre={handleSelectGenre}
          />
        </div>

        {/* Mobile drawer backdrop */}
        {isMobileDrawerOpen && (
          <div
            className="fixed inset-0 bg-slate-950/70 z-20 lg:hidden backdrop-blur-sm"
            onClick={() => setIsMobileDrawerOpen(false)}
          ></div>
        )}

        {/* Main Player HUD */}
        <MainPlayer
          currentStation={currentStation}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onNextFavorite={handleNextFavorite}
          onPrevFavorite={handlePrevFavorite}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          volume={volume}
          onVolumeChange={handleVolumeChange}
          muted={muted}
          onToggleMute={handleToggleMute}
          connectionStatus={connectionStatus}
        />
      </div>

      {/* Tesla Split-Screen Drive Mode Bar (< 900px) */}
      <DriveModeBar
        currentStation={currentStation}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onNextFavorite={handleNextFavorite}
        onToggleDrawer={() => setIsMobileDrawerOpen(true)}
      />

      {/* Modals */}
      <AudioEqualizerModal
        isOpen={isEQOpen}
        onClose={() => setIsEQOpen(false)}
        eq={eq}
        onUpdateEQ={handleUpdateEQ}
        buffer={buffer}
        onUpdateBuffer={handleUpdateBuffer}
      />

      <CustomStationModal
        isOpen={isCustomOpen}
        onClose={() => setIsCustomOpen(false)}
        onAddStation={handleAddCustom}
      />

      <AuthQRModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        session={session}
        onUpdateSession={(s) => {
          setSession(s);
          saveUserSession(s);
        }}
      />
    </div>
  );
}
