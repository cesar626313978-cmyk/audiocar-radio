import React, { useState, useEffect, useRef } from 'react';
import { Station, ThemeMode, EQSettings, PreRollBuffer } from './types';
import {
  getMostPlayedStations,
  incrementPlayCount,
  resetPlayCounts,
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
import { DriveModeBar } from './components/DriveModeBar';

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(getThemeMode());
  const [mostPlayed, setMostPlayed] = useState<Station[]>(getMostPlayedStations([]));
  const [recent, setRecent] = useState<Station[]>(getRecentStations());
  const [customStations, setCustomStations] = useState<Station[]>(getCustomStations());
  const [spainStations, setSpainStations] = useState<Station[]>([]);
  const [worldStations, setWorldStations] = useState<Station[]>([]);
  
  const [currentStation, setCurrentStation] = useState<Station | null>(mostPlayed[0] || FALLBACK_STATIONS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.8);
  const [muted, setMuted] = useState<boolean>(false);

  const [eq, setEQ] = useState<EQSettings>(getEQSettings());
  const [buffer, setBuffer] = useState<PreRollBuffer>(getPreRollBuffer());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('online');

  const [isEQOpen, setIsEQOpen] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Play count timer ref (increments play count after 15 seconds of continuous playback)
  const playTimerRef = useRef<any>(null);
  const playCountRecordedRef = useRef<boolean>(false);

  // Initial load of Spain and World stations
  useEffect(() => {
    getSpainStations().then((res) => {
      setSpainStations(res);
      setMostPlayed(getMostPlayedStations(res));
    }).catch(console.warn);

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

  // Play count 15-second tracking timer
  useEffect(() => {
    if (isPlaying && currentStation) {
      playCountRecordedRef.current = false;
      if (playTimerRef.current) clearTimeout(playTimerRef.current);

      playTimerRef.current = setTimeout(() => {
        if (isPlaying && currentStation && !playCountRecordedRef.current) {
          playCountRecordedRef.current = true;
          incrementPlayCount(currentStation.id);
          setMostPlayed(getMostPlayedStations([...spainStations, ...worldStations]));
        }
      }, 15000); // 15 seconds
    } else {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    }

    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, [isPlaying, currentStation]);

  // MediaSession API Integration
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
      navigator.mediaSession.setActionHandler('previoustrack', () => handlePrevStation());
      navigator.mediaSession.setActionHandler('nexttrack', () => handleNextStation());
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

  const handleNextStation = () => {
    const list = mostPlayed.length > 0 ? mostPlayed : FALLBACK_STATIONS;
    const currentIndex = list.findIndex(s => s.id === currentStation?.id);
    const nextIndex = (currentIndex + 1) % list.length;
    handleSelectStation(list[nextIndex]);
  };

  const handlePrevStation = () => {
    const list = mostPlayed.length > 0 ? mostPlayed : FALLBACK_STATIONS;
    const currentIndex = list.findIndex(s => s.id === currentStation?.id);
    const prevIndex = (currentIndex - 1 + list.length) % list.length;
    handleSelectStation(list[prevIndex]);
  };

  const handleAddCustom = (station: Station) => {
    const updated = addCustomStation(station);
    setCustomStations(updated);
    setMostPlayed(getMostPlayedStations([...spainStations, ...worldStations]));
    handleSelectStation(station);
  };

  const handleDeleteCustom = (id: string) => {
    const updated = persistDeleteCustom(id);
    setCustomStations(updated);
    setMostPlayed(getMostPlayedStations([...spainStations, ...worldStations]));
  };

  const handleResetPlayCounts = () => {
    resetPlayCounts();
    setMostPlayed(getMostPlayedStations([...spainStations, ...worldStations]));
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
      <HeaderNav
        theme={theme}
        onThemeChange={setTheme}
        connectionStatus={connectionStatus}
        onOpenEQ={() => setIsEQOpen(true)}
        onOpenCustom={() => setIsCustomOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden relative">
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
            mostPlayed={mostPlayed}
            recent={recent}
            customStations={customStations}
            spainStations={spainStations}
            worldStations={worldStations}
            onDeleteCustom={handleDeleteCustom}
            onSearch={handleSearch}
            onSelectGenre={handleSelectGenre}
            onResetPlayCounts={handleResetPlayCounts}
          />
        </div>

        {isMobileDrawerOpen && (
          <div
            className="fixed inset-0 bg-slate-950/70 z-20 lg:hidden backdrop-blur-sm"
            onClick={() => setIsMobileDrawerOpen(false)}
          ></div>
        )}

        <MainPlayer
          currentStation={currentStation}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onNextStation={handleNextStation}
          onPrevStation={handlePrevStation}
          volume={volume}
          onVolumeChange={handleVolumeChange}
          muted={muted}
          onToggleMute={handleToggleMute}
          connectionStatus={connectionStatus}
        />
      </div>

      <DriveModeBar
        currentStation={currentStation}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onNextStation={handleNextStation}
        onToggleDrawer={() => setIsMobileDrawerOpen(true)}
      />

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
    </div>
  );
}
