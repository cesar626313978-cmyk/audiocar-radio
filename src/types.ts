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
}

export type ThemeMode = 'dark' | 'light' | 'auto';

export type PreRollBuffer = 2 | 5 | 10; // seconds

export interface EQSettings {
  bass: number; // -15 to +15 dB
  mid: number;  // -15 to +15 dB
  treble: number; // -15 to +15 dB
  preset: 'flat' | 'news' | 'bass-boost' | 'custom';
}

export interface UserSession {
  loggedIn: boolean;
  user?: {
    name: string;
    email: string;
    picture: string;
  };
  sessionId?: string;
}

export type RadioTab = 'favorites' | 'spain' | 'world' | 'recent';
