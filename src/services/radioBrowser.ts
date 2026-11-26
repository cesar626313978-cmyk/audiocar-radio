import { Station } from '../types';

const API_SERVERS = [
  'https://de1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://all.api.radio-browser.info',
];

let currentServerIndex = 0;

async function fetchFromRadioBrowser(endpoint: string): Promise<any> {
  for (let i = 0; i < API_SERVERS.length; i++) {
    const server = API_SERVERS[(currentServerIndex + i) % API_SERVERS.length];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${server}${endpoint}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'AudioCarRadio/1.0' },
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        currentServerIndex = (currentServerIndex + i) % API_SERVERS.length;
        return await res.json();
      }
    } catch (e) {
      console.warn(`Radio Browser server ${server} failed, trying next...`, e);
    }
  }
  throw new Error('All Radio Browser servers unreachable');
}

export const FALLBACK_STATIONS: Station[] = [
  {
    id: 'los40-es',
    name: 'LOS 40 Spain',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40.mp3',
    favicon: 'https://los40.com/favicon.ico',
    country: 'Spain',
    countrycode: 'ES',
    language: 'Spanish',
    votes: 12500,
    bitrate: 128,
    codec: 'MP3',
    tags: ['pop', 'hits', 'top40', 'spain'],
  },
  {
    id: 'cadena-ser-es',
    name: 'Cadena SER',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/CADENASER.mp3',
    favicon: 'https://cadenaser.com/favicon.ico',
    country: 'Spain',
    countrycode: 'ES',
    language: 'Spanish',
    votes: 14000,
    bitrate: 128,
    codec: 'MP3',
    tags: ['news', 'talk', 'spain', 'radio'],
  },
  {
    id: 'europa-fm-es',
    name: 'Europa FM',
    url: 'https://atres-live.ondacero.es/live/europafm/master.m3u8',
    favicon: 'https://www.europafm.com/favicon.ico',
    country: 'Spain',
    countrycode: 'ES',
    language: 'Spanish',
    votes: 9800,
    bitrate: 192,
    codec: 'AAC',
    tags: ['pop', 'dance', '80s', '90s'],
  },
  {
    id: 'kiss-fm-es',
    name: 'KISS FM',
    url: 'https://bbkissfm.kissfmradio.cires21.com/bbkissfm.mp3',
    favicon: 'https://www.kissfm.es/favicon.ico',
    country: 'Spain',
    countrycode: 'ES',
    language: 'Spanish',
    votes: 11000,
    bitrate: 128,
    codec: 'MP3',
    tags: ['hits', 'classic', 'pop', 'spain'],
  },
  {
    id: 'rock-fm-es',
    name: 'Rock FM Spain',
    url: 'https://rockfm-cope-rrcast.flumotion.com/cope/rockfm-low.mp3',
    favicon: 'https://www.rockfm.fm/favicon.ico',
    country: 'Spain',
    countrycode: 'ES',
    language: 'Spanish',
    votes: 13200,
    bitrate: 128,
    codec: 'MP3',
    tags: ['rock', 'classic rock', 'metal'],
  },
  {
    id: 'rne-1-es',
    name: 'RNE Radio Nacional',
    url: 'https://rtvelivestream.rtve.es/rtvesec/rne/rne_r1_main.m3u8',
    favicon: 'https://www.rtve.es/favicon.ico',
    country: 'Spain',
    countrycode: 'ES',
    language: 'Spanish',
    votes: 8500,
    bitrate: 128,
    codec: 'HLS',
    tags: ['news', 'culture', 'public', 'spain'],
  },
  {
    id: 'bbc-world-uk',
    name: 'BBC World Service',
    url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_world_service',
    favicon: 'https://www.bbc.co.uk/favicon.ico',
    country: 'United Kingdom',
    countrycode: 'GB',
    language: 'English',
    votes: 25000,
    bitrate: 320,
    codec: 'AAC',
    tags: ['news', 'global', 'talk', 'documentary'],
  },
  {
    id: 'jazz24-us',
    name: 'Jazz24 (US Public Radio)',
    url: 'https://knkx-live-a.edge.audiocdn.com/6285_128k',
    favicon: 'https://www.jazz24.org/favicon.ico',
    country: 'United States',
    countrycode: 'US',
    language: 'English',
    votes: 18000,
    bitrate: 128,
    codec: 'MP3',
    tags: ['jazz', 'blues', 'instrumental'],
  },
  {
    id: 'lofi-hiphop',
    name: 'Lofi Girl Radio',
    url: 'https://stream.zeno.fm/0r0xa792kwzuv',
    favicon: 'https://lofigirl.com/favicon.ico',
    country: 'France',
    countrycode: 'FR',
    language: 'English',
    votes: 30000,
    bitrate: 192,
    codec: 'AAC',
    tags: ['lofi', 'chill', 'ambient', 'study'],
  },
  {
    id: 'swiss-classic',
    name: 'Swiss Classic',
    url: 'https://stream.srg-ssr.ch/m/rsc_de/mp3_128',
    favicon: 'https://www.srf.ch/favicon.ico',
    country: 'Switzerland',
    countrycode: 'CH',
    language: 'German',
    votes: 9200,
    bitrate: 128,
    codec: 'MP3',
    tags: ['classical', 'orchestral', 'opera'],
  }
];

export async function searchStations(query: string): Promise<Station[]> {
  if (!query.trim()) return getSpainStations();
  try {
    const data = await fetchFromRadioBrowser(`/json/stations/byname/${encodeURIComponent(query)}?limit=40`);
    return formatStations(data);
  } catch (e) {
    console.warn('API search failed, falling back to local filter', e);
    const q = query.toLowerCase();
    return FALLBACK_STATIONS.filter(s => s.name.toLowerCase().includes(q) || s.tags?.some(t => t.includes(q)));
  }
}

export async function getSpainStations(): Promise<Station[]> {
  try {
    const data = await fetchFromRadioBrowser('/json/stations/bycountry/Spain?limit=40&order=votes&reverse=true');
    const formatted = formatStations(data);
    return formatted.length > 0 ? formatted : FALLBACK_STATIONS.filter(s => s.countrycode === 'ES');
  } catch (e) {
    console.warn('API fetch Spain failed, using fallback', e);
    return FALLBACK_STATIONS.filter(s => s.countrycode === 'ES' || s.country === 'Spain');
  }
}

export async function getWorldStations(tag?: string): Promise<Station[]> {
  try {
    const endpoint = tag 
      ? `/json/stations/bytag/${encodeURIComponent(tag)}?limit=40&order=votes&reverse=true`
      : `/json/stations/topvote?limit=40`;
    const data = await fetchFromRadioBrowser(endpoint);
    const formatted = formatStations(data);
    return formatted.length > 0 ? formatted : FALLBACK_STATIONS;
  } catch (e) {
    console.warn('API fetch World failed, using fallback', e);
    return FALLBACK_STATIONS;
  }
}

function formatStations(rawList: any[]): Station[] {
  if (!Array.isArray(rawList)) return [];
  return rawList.map((item, index) => ({
    id: item.stationuuid || `station-${index}-${Date.now()}`,
    name: item.name?.trim() || 'Unknown Station',
    url: item.url_resolved || item.url || '',
    homepage: item.homepage || '',
    favicon: item.favicon && item.favicon.startsWith('http') ? item.favicon : undefined,
    country: item.country || 'International',
    countrycode: item.countrycode || '',
    state: item.state || '',
    language: item.language || '',
    votes: item.votes || 0,
    bitrate: item.bitrate || 128,
    codec: item.codec || 'MP3',
    tags: item.tags ? item.tags.split(',').map((t: string) => t.trim().toLowerCase()) : [],
  })).filter(s => s.url && s.url.startsWith('http'));
}
