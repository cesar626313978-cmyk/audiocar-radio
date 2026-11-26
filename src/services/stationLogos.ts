import { Station } from '../types';

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

export interface HDStationLogoEntry {
  key: string;
  matchers: string[];
  logoUrl: string;
}

/**
 * Diccionario de logotipos HD vectoriales (512x512 SVG nítidos) para las principales emisoras españolas.
 * Tienen prioridad sobre el favicon de baja resolución de Radio Browser cuando coincide el nombre de la emisora.
 */
export const HD_STATION_LOGOS: HDStationLogoEntry[] = [
  {
    key: 'los40-classic',
    matchers: ['los40 classic', 'los 40 classic', 'm80 radio'],
    logoUrl: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <defs>
          <linearGradient id="g40c" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#f59e0b"/>
            <stop offset="50%" stop-color="#ef4444"/>
            <stop offset="100%" stop-color="#8b5cf6"/>
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="112" fill="#0f172a"/>
        <rect x="20" y="20" width="472" height="472" rx="96" fill="none" stroke="url(#g40c)" stroke-width="14"/>
        <text x="256" y="138" text-anchor="middle" fill="#e2e8f0" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="54" letter-spacing="8">LOS</text>
        <text x="256" y="310" text-anchor="middle" fill="url(#g40c)" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="188" letter-spacing="-6">40</text>
        <rect x="96" y="354" width="320" height="68" rx="34" fill="url(#g40c)"/>
        <text x="256" y="401" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="40" letter-spacing="6">CLASSIC</text>
      </svg>
    `),
  },
  {
    key: 'los40',
    matchers: ['los40', 'los 40'],
    logoUrl: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <defs>
          <linearGradient id="g40" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ff0055"/>
            <stop offset="35%" stop-color="#ff7a00"/>
            <stop offset="70%" stop-color="#00d2ff"/>
            <stop offset="100%" stop-color="#7c3aed"/>
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="112" fill="#090d16"/>
        <circle cx="256" cy="256" r="210" fill="none" stroke="url(#g40)" stroke-width="18"/>
        <text x="256" y="160" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="60" letter-spacing="10">LOS</text>
        <text x="256" y="365" text-anchor="middle" fill="url(#g40)" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="220" letter-spacing="-8">40</text>
      </svg>
    `),
  },
  {
    key: 'rock-fm',
    matchers: ['rock fm', 'rockfm'],
    logoUrl: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <defs>
          <linearGradient id="grfm" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#dc2626"/>
            <stop offset="100%" stop-color="#7f1d1d"/>
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="112" fill="#09090b"/>
        <rect x="24" y="24" width="464" height="464" rx="92" fill="url(#grfm)" stroke="#ef4444" stroke-width="8"/>
        <polygon points="275,65 180,235 255,235 215,435 340,215 262,215" fill="#18181b" opacity="0.28"/>
        <text x="256" y="242" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="122" letter-spacing="-2">ROCK</text>
        <rect x="136" y="278" width="240" height="114" rx="24" fill="#09090b"/>
        <text x="256" y="362" text-anchor="middle" fill="#ef4444" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="88" letter-spacing="6">FM</text>
      </svg>
    `),
  },
  {
    key: 'cadena-cope',
    matchers: ['cadena cope', 'cope'],
    logoUrl: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <defs>
          <linearGradient id="gcope" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0284c7"/>
            <stop offset="100%" stop-color="#0369a1"/>
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="112" fill="url(#gcope)"/>
        <rect x="34" y="136" width="444" height="240" rx="48" fill="#ffffff"/>
        <text x="256" y="302" text-anchor="middle" fill="#0369a1" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="136" letter-spacing="2">COPE</text>
      </svg>
    `),
  },
  {
    key: 'cadena-ser',
    matchers: ['cadena ser', 'cadenaser', 'radio ser'],
    logoUrl: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <rect width="512" height="512" rx="112" fill="#0a0f1d"/>
        <rect x="24" y="24" width="464" height="464" rx="92" fill="none" stroke="#facc15" stroke-width="12"/>
        <text x="256" y="148" text-anchor="middle" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="44" letter-spacing="10">CADENA</text>
        <text x="256" y="346" text-anchor="middle" fill="#facc15" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="184" letter-spacing="-2">SER</text>
      </svg>
    `),
  },
  {
    key: 'europa-fm',
    matchers: ['europa fm', 'europafm'],
    logoUrl: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <defs>
          <linearGradient id="geu" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#f97316"/>
            <stop offset="100%" stop-color="#db2777"/>
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="112" fill="url(#geu)"/>
        <text x="256" y="220" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="94" letter-spacing="-2">EUROPA</text>
        <rect x="136" y="258" width="240" height="126" rx="32" fill="#0f172a"/>
        <text x="256" y="352" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="96" letter-spacing="4">FM</text>
      </svg>
    `),
  },
  {
    key: 'kiss-fm',
    matchers: ['kiss fm', 'kissfm'],
    logoUrl: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <defs>
          <linearGradient id="gkiss" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#e11d48"/>
            <stop offset="100%" stop-color="#9f1239"/>
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="112" fill="url(#gkiss)"/>
        <text x="256" y="255" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="148" letter-spacing="-4">KISS</text>
        <text x="256" y="388" text-anchor="middle" fill="#fecdd3" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="96" letter-spacing="14">FM</text>
      </svg>
    `),
  },
  {
    key: 'onda-cero',
    matchers: ['onda cero', 'ondacero'],
    logoUrl: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <defs>
          <linearGradient id="goc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#10b981"/>
            <stop offset="100%" stop-color="#047857"/>
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="112" fill="#06281e"/>
        <circle cx="256" cy="210" r="108" fill="none" stroke="url(#goc)" stroke-width="34"/>
        <text x="256" y="395" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="64" letter-spacing="2">ONDA CERO</text>
      </svg>
    `),
  },
  {
    key: 'rne',
    matchers: ['rne', 'radio nacional', 'radio 3', 'radio 5', 'radio clasica', 'radio clásica'],
    logoUrl: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <defs>
          <linearGradient id="grne" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ea580c"/>
            <stop offset="100%" stop-color="#dc2626"/>
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="112" fill="url(#grne)"/>
        <text x="256" y="295" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="168" letter-spacing="-4">rne</text>
        <text x="256" y="388" text-anchor="middle" fill="#fed7aa" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="36" letter-spacing="8">RADIO NACIONAL</text>
      </svg>
    `),
  },
  {
    key: 'cadena-100',
    matchers: ['cadena 100', 'cadena100'],
    logoUrl: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <defs>
          <linearGradient id="gc100" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ec4899"/>
            <stop offset="100%" stop-color="#8b5cf6"/>
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="112" fill="url(#gc100)"/>
        <text x="256" y="165" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="48" letter-spacing="10">CADENA</text>
        <text x="256" y="365" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="190" letter-spacing="-8">100</text>
      </svg>
    `),
  },
  {
    key: 'radio-marca',
    matchers: ['radio marca', 'radiomarca'],
    logoUrl: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <rect width="512" height="512" rx="112" fill="#dc2626"/>
        <rect x="28" y="28" width="456" height="456" rx="92" fill="none" stroke="#ffffff" stroke-width="10"/>
        <text x="256" y="175" text-anchor="middle" fill="#fecaca" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="54" letter-spacing="12">RADIO</text>
        <rect x="52" y="216" width="408" height="148" rx="24" fill="#ffffff"/>
        <text x="256" y="324" text-anchor="middle" fill="#dc2626" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="98" letter-spacing="-2">MARCA</text>
      </svg>
    `),
  },
  {
    key: 'bikini-fm',
    matchers: ['bikini fm', 'bikinifm'],
    logoUrl: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <defs>
          <linearGradient id="gbikini" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#06b6d4"/>
            <stop offset="50%" stop-color="#3b82f6"/>
            <stop offset="100%" stop-color="#ec4899"/>
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="112" fill="#090d16"/>
        <rect x="22" y="22" width="468" height="468" rx="94" fill="none" stroke="url(#gbikini)" stroke-width="14"/>
        <text x="256" y="242" text-anchor="middle" fill="url(#gbikini)" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="112" letter-spacing="2">BIKINI</text>
        <text x="256" y="378" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="108" letter-spacing="14">FM</text>
      </svg>
    `),
  },
  {
    key: 'la-jungla-radio',
    matchers: ['la jungla', 'jungla radio'],
    logoUrl: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <defs>
          <linearGradient id="gjungla" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#22c55e"/>
            <stop offset="100%" stop-color="#15803d"/>
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="112" fill="#051b11"/>
        <rect x="22" y="22" width="468" height="468" rx="94" fill="none" stroke="url(#gjungla)" stroke-width="14"/>
        <text x="256" y="170" text-anchor="middle" fill="#86efac" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="48" letter-spacing="10">LA</text>
        <text x="256" y="290" text-anchor="middle" fill="url(#gjungla)" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="96" letter-spacing="0">JUNGLA</text>
        <text x="256" y="388" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="52" letter-spacing="14">RADIO</text>
      </svg>
    `),
  },
];

/**
 * Busca en el diccionario de logos HD si el nombre de la emisora coincide con alguna de las principales emisoras españolas.
 */
export function getHDLogoForStation(stationName?: string): string | null {
  if (!stationName) return null;
  const normalized = stationName.toLowerCase().trim();
  for (const entry of HD_STATION_LOGOS) {
    if (entry.matchers.some(m => normalized.includes(m))) {
      return entry.logoUrl;
    }
  }
  return null;
}

/**
 * Extrae el icono de alta resolución (256px) vía dominio si la emisora dispone de homepage.
 */
export function getHighResDomainFavicon(homepage?: string): string | null {
  if (!homepage) return null;
  try {
    const parsed = new URL(homepage);
    if (!parsed.hostname) return null;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(parsed.hostname)}&sz=256`;
  } catch {
    return null;
  }
}

/**
 * Devuelve la lista ordenada por prioridad de URLs candidatas de logotipo para una emisora:
 * 1. Diccionario HD para emisoras principales
 * 2. Extractor 256px vía dominio (homepage)
 * 3. Favicon original de Radio Browser
 */
export function getStationArtworkCandidates(station: Station | null): string[] {
  if (!station) return [];
  const candidates: string[] = [];

  const hdLogo = getHDLogoForStation(station.name);
  if (hdLogo) {
    candidates.push(hdLogo);
  }

  const domainIcon = getHighResDomainFavicon(station.homepage);
  if (domainIcon && !candidates.includes(domainIcon)) {
    candidates.push(domainIcon);
  }

  if (station.favicon && !candidates.includes(station.favicon)) {
    candidates.push(station.favicon);
  }

  return candidates;
}

/**
 * Extrae 2 iniciales limpias del nombre de la emisora para el avatar tipográfico.
 */
export function getStationInitials(name?: string): string {
  if (!name) return 'FM';
  const cleaned = name
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'FM';
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Devuelve clases Tailwind de degradado acordes al género musical de la emisora.
 */
export function getGenreGradientClasses(station: Station | null): string {
  if (!station) return 'from-red-600 via-rose-600 to-amber-500';
  const tagsStr = Array.isArray(station.tags)
    ? station.tags.join(' ')
    : station.tags || '';
  const text = `${station.name} ${station.genre || ''} ${station.category || ''} ${tagsStr}`.toLowerCase();

  if (text.includes('rock') || text.includes('metal') || text.includes('indie')) {
    return 'from-red-700 via-rose-800 to-slate-900';
  }
  if (text.includes('electronic') || text.includes('dance') || text.includes('house') || text.includes('techno') || text.includes('bikini')) {
    return 'from-cyan-500 via-blue-600 to-fuchsia-600';
  }
  if (text.includes('jazz') || text.includes('blues') || text.includes('soul')) {
    return 'from-amber-500 via-orange-600 to-yellow-800';
  }
  if (text.includes('news') || text.includes('noticias') || text.includes('talk') || text.includes('ser') || text.includes('cope') || text.includes('onda')) {
    return 'from-sky-500 via-blue-700 to-indigo-900';
  }
  if (text.includes('classical') || text.includes('clásica') || text.includes('opera')) {
    return 'from-purple-600 via-indigo-700 to-slate-900';
  }
  if (text.includes('lofi') || text.includes('chill') || text.includes('ambient')) {
    return 'from-teal-500 via-emerald-600 to-cyan-800';
  }
  if (text.includes('80s') || text.includes('90s') || text.includes('classic') || text.includes('oldies')) {
    return 'from-orange-500 via-pink-600 to-purple-700';
  }
  // Default Pop / Top Hits
  return 'from-red-600 via-pink-600 to-amber-500';
}
