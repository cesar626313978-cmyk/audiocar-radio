import { Station, EQSettings, PreRollBuffer, ThemeMode, UserSession } from '../types';
import { FALLBACK_STATIONS } from './radioBrowser';

const KEYS = {
  FAVORITES: 'audiocar_radio_favorites',
  RECENT: 'audiocar_radio_recent',
  CUSTOM: 'audiocar_radio_custom',
  EQ: 'audiocar_radio_eq',
  BUFFER: 'audiocar_radio_buffer',
  THEME: 'audiocar_radio_theme',
  SESSION: 'audiocar_radio_session',
};

const DEFAULT_FAVORITES: Station[] = [
  FALLBACK_STATIONS[0], // LOS 40
  FALLBACK_STATIONS[1], // Cadena SER
  FALLBACK_STATIONS[4], // Rock FM
  FALLBACK_STATIONS[6], // BBC World
];

export function getFavorites(): Station[] {
  try {
    const raw = localStorage.getItem(KEYS.FAVORITES);
    if (!raw) return DEFAULT_FAVORITES;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_FAVORITES;
  }
}

export function saveFavorites(stations: Station[]): void {
  try {
    localStorage.setItem(KEYS.FAVORITES, JSON.stringify(stations));
  } catch (e) {
    console.error('Failed to save favorites', e);
  }
}

export function toggleFavorite(station: Station): Station[] {
  const favs = getFavorites();
  const exists = favs.some(s => s.id === station.id);
  const updated = exists ? favs.filter(s => s.id !== station.id) : [station, ...favs];
  saveFavorites(updated);
  return updated;
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
    return raw ? (JSON.parse(raw) as PreRollBuffer) : 5; // Default 5s per user preference
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
    return raw ? (JSON.parse(raw) as ThemeMode) : 'dark'; // Default dark mode per user preference
  } catch {
    return 'dark';
  }
}

export function saveThemeMode(theme: ThemeMode): void {
  try {
    localStorage.setItem(KEYS.THEME, JSON.stringify(theme));
  } catch {}
}

export function getUserSession(): UserSession {
  try {
    const raw = localStorage.getItem(KEYS.SESSION);
    return raw ? JSON.parse(raw) : { loggedIn: false };
  } catch {
    return { loggedIn: false };
  }
}

export function saveUserSession(session: UserSession): void {
  try {
    localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
  } catch {}
}
