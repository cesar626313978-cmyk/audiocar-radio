import React, { useState, useEffect, useRef } from 'react';
import { Station, ThemeMode, EQSettings, PreRollBuffer, TeslaSession } from './types';
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
  getReverseDimEnabled,
  saveReverseDimEnabled,
} from './services/storage';
import {
  FALLBACK_STATIONS,
  searchStations,
  getSpainStations,
  getWorldStations,
} from './services/radioBrowser';
import {
  getTeslaSession,
  sendTeslaMediaCommand,
  sendMultipleVolumeCommands,
  getTeslaDriveState,
  refreshTeslaTokenIfNeeded,
} from './services/teslaFleet';
import { audioEngine } from './services/audioEngine';
import { watchdog, ConnectionStatus } from './services/watchdog';
import { getStationArtworkCandidates } from './services/stationLogos';
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
  const [mobileView, setMobileView] = useState<'player' | 'stations'>('player');

  // Tesla Fleet API State
  const [teslaSession, setTeslaSession] = useState<TeslaSession | null>(() => getTeslaSession());
  const [reverseDimEnabled, setReverseDimEnabled] = useState<boolean>(() => getReverseDimEnabled());
  const [activeShiftState, setActiveShiftState] = useState<'P' | 'D' | 'R' | 'N' | null>(null);
  const [isReverseDimmed, setIsReverseDimmed] = useState<boolean>(false);
  const isReverseDimmedRef = useRef<boolean>(false);

  // Play count timer ref (increments play count after 15 seconds of continuous playback)
  const playTimerRef = useRef<any>(null);
  const playCountRecordedRef = useRef<boolean>(false);

  // Keep Tesla session synced with localStorage ('audiocar_tesla_session')
  useEffect(() => {
    const syncTeslaSession = () => {
      setTeslaSession(getTeslaSession());
    };
    window.addEventListener('storage', syncTeslaSession);
    window.addEventListener('focus', syncTeslaSession);
    const interval = setInterval(syncTeslaSession, 5000);
    return () => {
      window.removeEventListener('storage', syncTeslaSession);
      window.removeEventListener('focus', syncTeslaSession);
      clearInterval(interval);
    };
  }, []);

  // Proactive token refresh check when session is present
  useEffect(() => {
    if (!teslaSession) return;
    refreshTeslaTokenIfNeeded(false).then((updated) => {
      if (updated && updated.access_token !== teslaSession.access_token) {
        setTeslaSession(updated);
      }
    });
  }, [teslaSession]);

  // Poll Tesla drive_state every 4 seconds when reverseDimEnabled is active and Tesla session exists
  useEffect(() => {
    if (!reverseDimEnabled || !teslaSession) {
      setActiveShiftState(null);
      return;
    }

    let isCancelled = false;

    const checkDriveState = async () => {
      const driveState = await getTeslaDriveState();
      if (isCancelled || !driveState) return;

      const shift = driveState.shift_state;
      setActiveShiftState(shift);

      if (shift === 'R' && !isReverseDimmedRef.current) {
        isReverseDimmedRef.current = true;
        setIsReverseDimmed(true);
        await sendMultipleVolumeCommands('media_volume_down', 3);
      } else if ((shift === 'D' || shift === 'P') && isReverseDimmedRef.current) {
        isReverseDimmedRef.current = false;
        setIsReverseDimmed(false);
        await sendMultipleVolumeCommands('media_volume_up', 3);
      }
    };

    checkDriveState();
    const timer = setInterval(checkDriveState, 4000);

    return () => {
      isCancelled = true;
      clearInterval(timer);
    };
  }, [reverseDimEnabled, teslaSession]);

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
      const candidates = getStationArtworkCandidates(currentStation);
      const bestLogo = candidates[0] || currentStation.favicon;
      const tagsList = Array.isArray(currentStation.tags)
        ? currentStation.tags
        : typeof currentStation.tags === 'string'
        ? currentStation.tags.split(',')
        : [];
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentStation.name,
        artist: `AudioCar Radio • ${currentStation.country}`,
        album: tagsList[0] ? `Género: ${tagsList[0]}` : 'Streaming en Directo',
        artwork: bestLogo
          ? [{ src: bestLogo, sizes: '512x512', type: bestLogo.startsWith('data:image/svg+xml') ? 'image/svg+xml' : 'image/png' }]
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

    // Regresa automáticamente a la vista del reproductor al pulsar una emisora
    setMobileView('player');
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

    // Sincronizar con Tesla Fleet API command/media_toggle_playback si existe sesión activa
    if (getTeslaSession()) {
      sendTeslaMediaCommand('media_toggle_playback').catch(console.warn);
    }
  };

  const handleTeslaVolumeDown = () => {
    sendTeslaMediaCommand('media_volume_down').catch(console.warn);
  };

  const handleTeslaVolumeUp = () => {
    sendTeslaMediaCommand('media_volume_up').catch(console.warn);
  };

  const handleToggleReverseDim = (enabled: boolean) => {
    setReverseDimEnabled(enabled);
    saveReverseDimEnabled(enabled);
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
    audioEngine.setEQ(newEQ, true);
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
    const cleanTag = genre.trim().toLowerCase();
    if (!cleanTag || cleanTag === 'todos') {
      getWorldStations().then((res) => {
        setWorldStations(res);
        setMostPlayed(getMostPlayedStations([...spainStations, ...res]));
      }).catch(console.warn);
      return;
    }
    try {
      const results = await getWorldStations(cleanTag);
      setWorldStations(results);
      setMostPlayed(getMostPlayedStations([...spainStations, ...results]));
    } catch (e) {
      console.warn('Genre fetch error', e);
    }
  };

  const toggleMobileView = () => {
    setMobileView(prev => (prev === 'player' ? 'stations' : 'player'));
  };

  const hasValidTeslaSession = Boolean(teslaSession && teslaSession.access_token && teslaSession.vehicle_id);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <HeaderNav
        theme={theme}
        onThemeChange={setTheme}
        connectionStatus={connectionStatus}
        onOpenEQ={() => setIsEQOpen(true)}
        onOpenCustom={() => setIsCustomOpen(true)}
        mobileView={mobileView}
        onToggleMobileView={toggleMobileView}
      />

      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* Panel de Emisoras / Favoritos: Siempre visible en >= 1100px, o a pantalla completa en < 1100px cuando mobileView === 'stations' */}
        <div
          className={`${
            mobileView === 'stations' ? 'flex w-full' : 'hidden'
          } min-[1100px]:flex min-[1100px]:w-[400px] h-full shrink-0`}
        >
          <SidebarDirectory
            currentStation={currentStation}
            isPlaying={isPlaying}
            onSelectStation={handleSelectStation}
            mostPlayed={mostPlayed}
            recent={recent}
            customStations={customStations}
            spainStations={spainStations}
            worldStations={worldStations}
            onDeleteCustom={handleDeleteCustom}
            onSearch={handleSearch}
            onSelectGenre={handleSelectGenre}
            onResetPlayCounts={handleResetPlayCounts}
            onBackToPlayer={() => setMobileView('player')}
          />
        </div>

        {/* Vista del Reproductor: Siempre visible en >= 1100px, o en < 1100px cuando mobileView === 'player' */}
        <div
          className={`${
            mobileView === 'player' ? 'flex' : 'hidden'
          } min-[1100px]:flex flex-1 h-full min-w-0 overflow-hidden`}
        >
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
            onOpenStations={() => setMobileView('stations')}
            hasTeslaSession={hasValidTeslaSession}
            onTeslaVolumeDown={handleTeslaVolumeDown}
            onTeslaVolumeUp={handleTeslaVolumeUp}
            activeShiftState={activeShiftState}
            isReverseDimmed={isReverseDimmed}
          />
        </div>
      </div>

      {/* Barra inferior permanente en pantallas < 1100px (Tesla en marcha) */}
      <DriveModeBar
        currentStation={currentStation}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onPrevStation={handlePrevStation}
        onNextStation={handleNextStation}
        mobileView={mobileView}
        onToggleMobileView={toggleMobileView}
        hasTeslaSession={hasValidTeslaSession}
        onTeslaVolumeDown={handleTeslaVolumeDown}
        onTeslaVolumeUp={handleTeslaVolumeUp}
      />

      <AudioEqualizerModal
        isOpen={isEQOpen}
        onClose={() => setIsEQOpen(false)}
        eq={eq}
        onUpdateEQ={handleUpdateEQ}
        buffer={buffer}
        onUpdateBuffer={handleUpdateBuffer}
        reverseDimEnabled={reverseDimEnabled}
        onToggleReverseDim={handleToggleReverseDim}
        hasTeslaSession={hasValidTeslaSession}
      />

      <CustomStationModal
        isOpen={isCustomOpen}
        onClose={() => setIsCustomOpen(false)}
        onAddStation={handleAddCustom}
      />
    </div>
  );
}
