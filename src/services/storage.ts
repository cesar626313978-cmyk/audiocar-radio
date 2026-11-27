import { Station, EQSettings, PreRollBuffer, ThemeMode } from '../types';
import { FALLBACK_STATIONS } from './radioBrowser';

const KEYS = {
  PLAY_COUNTS: 'audiocar_radio_play_counts',
  FAVORITE_IDS: 'audiocar_radio_favorite_ids',
  LEGACY_FAVORITES: 'audiocar_radio_favorites',
  RECENT: 'audiocar_radio_recent',
  LAST_STATION: 'audiocar_radio_last_station',
  STATION_HEALTH: 'audiocar_radio_station_health',
  CUSTOM: 'audiocar_radio_custom',
  EQ: 'audiocar_radio_eq',
  BUFFER: 'audiocar_radio_buffer',
  THEME: 'audiocar_radio_theme',
  REVERSE_DIM: 'audiocar_radio_reverse_dim',
};

const DEFAULT_EQ: EQSettings = {
  bass: 3,
  mid: 0,
  treble: 2,
  preset: 'bass-boost',
};

const VALID_PRESETS = ['flat', 'rock', 'pop', 'voice', 'bass-boost', 'custom'] as const;
const VALID_THEMES: ThemeMode[] = ['dark', 'light', 'auto'];
const VALID_BUFFERS: PreRollBuffer[] = [2, 5, 10];

/**
 * Valida y normaliza un objeto Station procedente de localStorage para evitar
 * que datos antiguos o corruptos rompan el primer renderizado de React.
 */
export function sanitizeStation(raw: unknown): Station | null {
  try {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return null;
    }
    const obj = raw as Record<string, unknown>;
    const id = typeof obj.id === 'string' ? obj.id.trim() : typeof obj.stationuuid === 'string' ? obj.stationuuid.trim() : '';
    const name = typeof obj.name === 'string' ? obj.name.trim() : '';
    const url =
      typeof obj.url === 'string' && obj.url.trim()
        ? obj.url.trim()
        : typeof obj.url_resolved === 'string' && obj.url_resolved.trim()
        ? obj.url_resolved.trim()
        : '';

    if (!id || !name || !url) {
      return null;
    }

    let tags: string[] = [];
    if (Array.isArray(obj.tags)) {
      tags = obj.tags
        .filter((t): t is string => typeof t === 'string')
        .map(t => t.trim())
        .filter(Boolean);
    } else if (typeof obj.tags === 'string') {
      tags = obj.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
    }

    return {
      id,
      name,
      url,
      homepage: typeof obj.homepage === 'string' ? obj.homepage : '',
      favicon: typeof obj.favicon === 'string' && obj.favicon.startsWith('http') ? obj.favicon : undefined,
      country: typeof obj.country === 'string' && obj.country.trim() ? obj.country : 'Spain',
      countrycode: typeof obj.countrycode === 'string' ? obj.countrycode : 'ES',
      state: typeof obj.state === 'string' ? obj.state : undefined,
      language: typeof obj.language === 'string' ? obj.language : 'Spanish',
      votes: typeof obj.votes === 'number' && Number.isFinite(obj.votes) ? obj.votes : 0,
      bitrate: typeof obj.bitrate === 'number' && Number.isFinite(obj.bitrate) && obj.bitrate > 0 ? obj.bitrate : 128,
      codec: typeof obj.codec === 'string' && obj.codec.trim() ? obj.codec : 'MP3',
      tags,
      genre: typeof obj.genre === 'string' ? obj.genre : undefined,
      category: typeof obj.category === 'string' ? obj.category : undefined,
      isCustom: Boolean(obj.isCustom),
      playCount: typeof obj.playCount === 'number' && Number.isFinite(obj.playCount) ? obj.playCount : undefined,
    };
  } catch {
    return null;
  }
}

export function getReverseDimEnabled(): boolean {
  try {
    const raw = localStorage.getItem(KEYS.REVERSE_DIM);
    if (!raw) return false;
    return JSON.parse(raw) === true;
  } catch {
    return false;
  }
}

export function saveReverseDimEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(KEYS.REVERSE_DIM, JSON.stringify(Boolean(enabled)));
  } catch {}
}

export function getPlayCounts(): Record<string, number> {
  const defaults: Record<string, number> = {
    'los40-es': 12,
    'cadena-ser-es': 10,
    'rock-fm-es': 8,
    'bbc-world-uk': 6,
  };
  try {
    const raw = localStorage.getItem(KEYS.PLAY_COUNTS);
    if (!raw) {
      localStorage.setItem(KEYS.PLAY_COUNTS, JSON.stringify(defaults));
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      localStorage.setItem(KEYS.PLAY_COUNTS, JSON.stringify(defaults));
      return defaults;
    }
    const cleanCounts: Record<string, number> = {};
    for (const [key, val] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof key === 'string' && typeof val === 'number' && Number.isFinite(val) && val >= 0) {
        cleanCounts[key] = val;
      }
    }
    return cleanCounts;
  } catch {
    return defaults;
  }
}

export function incrementPlayCount(stationId: string): Record<string, number> {
  try {
    if (!stationId || typeof stationId !== 'string') return getPlayCounts();
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

export function getFavoriteIds(): string[] {
  const defaults = ['los40-es', 'cadena-ser-es', 'rock-fm-es'];
  try {
    const raw = localStorage.getItem(KEYS.FAVORITE_IDS) ?? localStorage.getItem(KEYS.LEGACY_FAVORITES);
    if (!raw) {
      localStorage.setItem(KEYS.FAVORITE_IDS, JSON.stringify(defaults));
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(KEYS.FAVORITE_IDS, JSON.stringify(defaults));
      return defaults;
    }
    const validIds = parsed
      .map((item: unknown) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object' && typeof (item as any).id === 'string') {
          return (item as any).id.trim();
        }
        return '';
      })
      .filter(Boolean);

    return Array.from(new Set(validIds));
  } catch {
    return defaults;
  }
}

export function toggleFavoriteStation(stationId: string): string[] {
  try {
    if (!stationId || typeof stationId !== 'string') return getFavoriteIds();
    const current = getFavoriteIds();
    const updated = current.includes(stationId)
      ? current.filter(id => id !== stationId)
      : [stationId, ...current];
    localStorage.setItem(KEYS.FAVORITE_IDS, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function getMostPlayedStations(allStations: Station[]): Station[] {
  try {
    const counts = getPlayCounts();
    const favIds = getFavoriteIds();
    const favSet = new Set(Array.isArray(favIds) ? favIds : []);

    const map = new Map<string, Station>();
    FALLBACK_STATIONS.forEach(s => {
      const clean = sanitizeStation(s);
      if (clean) map.set(clean.id, clean);
    });

    if (Array.isArray(allStations)) {
      allStations.forEach(s => {
        const clean = sanitizeStation(s);
        if (clean) map.set(clean.id, clean);
      });
    }

    getCustomStations().forEach(s => {
      const clean = sanitizeStation(s);
      if (clean) map.set(clean.id, clean);
    });

    const list = Array.from(map.values()).map(s => ({
      ...s,
      playCount: counts[s.id] || 0,
    }));

    list.sort((a, b) => {
      const aFav = favSet.has(a.id) ? 1 : 0;
      const bFav = favSet.has(b.id) ? 1 : 0;
      if (bFav !== aFav) return bFav - aFav;
      return (b.playCount || 0) - (a.playCount || 0);
    });

    return list.length > 0 ? list : [...FALLBACK_STATIONS];
  } catch {
    return [...FALLBACK_STATIONS];
  }
}

export function getRecentStations(): Station[] {
  const defaultRecent = [FALLBACK_STATIONS[0], FALLBACK_STATIONS[2]].filter(Boolean);
  try {
    const raw = localStorage.getItem(KEYS.RECENT);
    if (!raw) return defaultRecent;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(KEYS.RECENT, JSON.stringify(defaultRecent));
      return defaultRecent;
    }

    const fallbackMap = new Map(FALLBACK_STATIONS.map(s => [s.id, s]));
    const validStations = parsed
      .map(item => sanitizeStation(item))
      .filter((st): st is Station => st !== null)
      .map(st => {
        const fb = fallbackMap.get(st.id);
        return fb ? { ...st, url: fb.url, codec: fb.codec } : st;
      });

    return validStations.length > 0 ? validStations : defaultRecent;
  } catch {
    return defaultRecent;
  }
}

export function addRecentStation(station: Station): Station[] {
  try {
    const clean = sanitizeStation(station);
    if (!clean) return getRecentStations();
    const recent = getRecentStations().filter(s => s.id !== clean.id);
    const updated = [clean, ...recent].slice(0, 15);
    localStorage.setItem(KEYS.RECENT, JSON.stringify(updated));
    saveLastStation(clean);
    return updated;
  } catch {
    return getRecentStations();
  }
}

export function getLastStation(): Station | null {
  try {
    const raw = localStorage.getItem(KEYS.LAST_STATION);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return sanitizeStation(parsed);
  } catch {
    return null;
  }
}

export function saveLastStation(station: Station): void {
  try {
    const clean = sanitizeStation(station);
    if (clean) {
      localStorage.setItem(KEYS.LAST_STATION, JSON.stringify(clean));
    }
  } catch {}
}

export function getStationHealthHistory(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(KEYS.STATION_HEALTH);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const clean: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof k === 'string' && typeof v === 'boolean') {
        clean[k] = v;
      }
    }
    return clean;
  } catch {
    return {};
  }
}

export function getCustomStations(): Station[] {
  try {
    const raw = localStorage.getItem(KEYS.CUSTOM);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(KEYS.CUSTOM, JSON.stringify([]));
      return [];
    }
    return parsed
      .map(item => sanitizeStation(item))
      .filter((st): st is Station => st !== null)
      .map(st => ({ ...st, isCustom: true }));
  } catch {
    return [];
  }
}

export function addCustomStation(station: Station): Station[] {
  try {
    const clean = sanitizeStation({ ...station, isCustom: true });
    if (!clean) return getCustomStations();
    const custom = getCustomStations().filter(s => s.id !== clean.id);
    const updated = [{ ...clean, isCustom: true }, ...custom];
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
    if (!raw) return DEFAULT_EQ;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return DEFAULT_EQ;
    }
    const clampBand = (val: unknown, fallback: number): number => {
      if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
      return Math.max(-12, Math.min(12, val));
    };
    const preset =
      typeof parsed.preset === 'string' && (VALID_PRESETS as readonly string[]).includes(parsed.preset)
        ? (parsed.preset as EQSettings['preset'])
        : 'bass-boost';

    return {
      bass: clampBand(parsed.bass, DEFAULT_EQ.bass),
      mid: clampBand(parsed.mid, DEFAULT_EQ.mid),
      treble: clampBand(parsed.treble, DEFAULT_EQ.treble),
      preset,
    };
  } catch {
    return DEFAULT_EQ;
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
    if (!raw) return 5;
    const parsed = Number(JSON.parse(raw));
    if (VALID_BUFFERS.includes(parsed as PreRollBuffer)) {
      return parsed as PreRollBuffer;
    }
    return 5;
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
    if (!raw) return 'dark';
    let parsed: unknown = raw;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }
    if (typeof parsed === 'string' && VALID_THEMES.includes(parsed as ThemeMode)) {
      return parsed as ThemeMode;
    }
    return 'dark';
  } catch {
    return 'dark';
  }
}

export function saveThemeMode(theme: ThemeMode): void {
  try {
    localStorage.setItem(KEYS.THEME, JSON.stringify(theme));
  } catch {}
}
