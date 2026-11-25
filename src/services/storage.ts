import { Station, EQSettings, PreRollBuffer, ThemeMode } from '../types';
import { FALLBACK_STATIONS } from './radioBrowser';

const KEYS = {
  PLAY_COUNTS: 'audiocar_radio_play_counts',
  RECENT: 'audiocar_radio_recent',
  CUSTOM: 'audiocar_radio_custom',
  EQ: 'audiocar_radio_eq',
  BUFFER: 'audiocar_radio_buffer',
  THEME: 'audiocar_radio_theme',
};

export function getPlayCounts(): Record<string, number> {
  try {
    const raw = localStorage.getItem(KEYS.PLAY_COUNTS);
    if (!raw) {
      // Default initial play counts for fallback stations
      const defaults: Record<string, number> = {
        'los40-es': 12,
        'cadena-ser-es': 10,
        'rock-fm-es': 8,
        'bbc-world-uk': 6,
      };
      localStorage.setItem(KEYS.PLAY_COUNTS, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function incrementPlayCount(stationId: string): Record<string, number> {
  try {
    const counts = getPlayCounts();
    counts[stationId] = (counts[stationId] || 0) + 1;
    localStorage.setItem(KEYS.PLAY_COUNTS, JSON.stringify(counts));
    return counts;
  } catch {
    return {};
  }
}

export function resetPlayCounts(): Record<string, number> {
  try {
    localStorage.setItem(KEYS.PLAY_COUNTS, JSON.stringify({}));
    return {};
  } catch {
    return {};
  }
}

export function getMostPlayedStations(allStations: Station[]): Station[] {
  const counts = getPlayCounts();
  // Combine fallback and custom and all known stations
  const map = new Map<string, Station>();
  FALLBACK_STATIONS.forEach(s => map.set(s.id, s));
  allStations.forEach(s => map.set(s.id, s));
  getCustomStations().forEach(s => map.set(s.id, s));

  const list = Array.from(map.values()).map(s => ({
    ...s,
    playCount: counts[s.id] || 0,
  }));

  // Sort descending by playCount
  list.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
  return list;
}

export function getRecentStations(): Station[] {
  try {
    const raw = localStorage.getItem(KEYS.RECENT);
    return raw ? JSON.parse(raw) : [FALLBACK_STATIONS[0], FALLBACK_STATIONS[2]];
  } catch {
    return [];
  }
}

export function addRecentStation(station: Station): Station[] {
  try {
    const recent = getRecentStations().filter(s => s.id !== station.id);
    const updated = [station, ...recent].slice(0, 15);
    localStorage.setItem(KEYS.RECENT, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function getCustomStations(): Station[] {
  try {
    const raw = localStorage.getItem(KEYS.CUSTOM);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addCustomStation(station: Station): Station[] {
  try {
    const custom = getCustomStations();
    const updated = [{ ...station, isCustom: true }, ...custom];
    localStorage.setItem(KEYS.CUSTOM, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function deleteCustomStation(id: string): Station[] {
  try {
    const custom = getCustomStations().filter(s => s.id !== id);
    localStorage.setItem(KEYS.CUSTOM, JSON.stringify(custom));
    return custom;
  } catch {
    return [];
  }
}

export function getEQSettings(): EQSettings {
  try {
    const raw = localStorage.getItem(KEYS.EQ);
    return raw ? JSON.parse(raw) : { bass: 3, mid: 0, treble: 2, preset: 'bass-boost' };
  } catch {
    return { bass: 3, mid: 0, treble: 2, preset: 'bass-boost' };
  }
}

export function saveEQSettings(eq: EQSettings): void {
  try {
    localStorage.setItem(KEYS.EQ, JSON.stringify(eq));
  } catch {}
}

export function getPreRollBuffer(): PreRollBuffer {
  try {
    const raw = localStorage.getItem(KEYS.BUFFER);
    return raw ? (JSON.parse(raw) as PreRollBuffer) : 5;
  } catch {
    return 5;
  }
}

export function savePreRollBuffer(buffer: PreRollBuffer): void {
  try {
    localStorage.setItem(KEYS.BUFFER, JSON.stringify(buffer));
  } catch {}
}

export function getThemeMode(): ThemeMode {
  try {
    const raw = localStorage.getItem(KEYS.THEME);
    return raw ? (JSON.parse(raw) as ThemeMode) : 'dark';
  } catch {
    return 'dark';
  }
}

export function saveThemeMode(theme: ThemeMode): void {
  try {
    localStorage.setItem(KEYS.THEME, JSON.stringify(theme));
  } catch {}
}
