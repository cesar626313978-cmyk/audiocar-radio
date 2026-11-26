export interface Station {
  id: string;
  name: string;
  url: string;
  url_resolved?: string;
  homepage?: string;
  favicon?: string;
  country: string;
  countrycode?: string;
  state?: string;
  language?: string;
  votes?: number;
  codec?: string;
  bitrate?: number;
  tags?: string[];
  isCustom?: boolean;
  playCount?: number;
}

export type ThemeMode = 'dark' | 'light' | 'auto';

export type PreRollBuffer = 2 | 5 | 10; // seconds

export interface EQSettings {
  bass: number; // -15 to +15 dB
  mid: number;  // -15 to +15 dB
  treble: number; // -15 to +15 dB
  preset: 'flat' | 'news' | 'bass-boost' | 'custom';
}

export type RadioTab = 'mostPlayed' | 'spain' | 'world' | 'recent';

export interface TeslaSession {
  access_token: string;
  refresh_token?: string;
  vehicle_id: string | number;
  vin?: string;
  vehicle_name?: string;
  expires_at?: number; // timestamp in ms or seconds
  expires_in?: number;
}
