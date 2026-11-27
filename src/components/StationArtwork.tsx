import React, { useState, useEffect, useMemo } from 'react';
import { Station } from '../types';
import {
  getStationArtworkCandidates,
  getStationInitials,
  getGenreGradientClasses,
} from '../services/stationLogos';

interface StationArtworkProps {
  station: Station | null;
  size?: 'sm' | 'lg';
  className?: string;
}

export const StationArtwork: React.FC<StationArtworkProps> = ({
  station,
  size = 'lg',
  className = '',
}) => {
  const candidates = useMemo(() => getStationArtworkCandidates(station), [
    station?.id,
    station?.name,
    station?.homepage,
    station?.favicon,
  ]);

  const [candidateIndex, setCandidateIndex] = useState(0);
  const [isLowRes, setIsLowRes] = useState(false);
  const [hasFailedAll, setHasFailedAll] = useState(false);

  useEffect(() => {
    setCandidateIndex(0);
    setIsLowRes(false);
    setHasFailedAll(candidates.length === 0);
  }, [candidates]);

  const currentUrl = candidates[candidateIndex];
  const initials = getStationInitials(station?.name);
  const gradientClasses = getGenreGradientClasses(station);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const width = img.naturalWidth;

    // SVG data URIs from our HD dictionary are vector-sharp at any resolution
    if (currentUrl?.startsWith('data:image/svg+xml')) {
      setIsLowRes(false);
      return;
    }

    // If Google S2 favicon returns the tiny 16x16 default globe icon when a domain has no high-res icon,
    // advance to the next candidate (or typographic avatar) if available
    if (
      currentUrl?.includes('google.com/s2/favicons') &&
      width > 0 &&
      width <= 24 &&
      candidateIndex + 1 < candidates.length
    ) {
      setCandidateIndex(prev => prev + 1);
      return;
    }

    // Anti-pixelation check: if naturalWidth < 128, do NOT stretch to 100% of container
    if (width > 0 && width < 128) {
      setIsLowRes(true);
    } else {
      setIsLowRes(false);
    }
  };

  const handleImageError = () => {
    if (candidateIndex + 1 < candidates.length) {
      setCandidateIndex(prev => prev + 1);
      setIsLowRes(false);
    } else {
      setHasFailedAll(true);
    }
  };

  // Typographic Avatar Fallback when image fails or doesn't exist
  if (!station || hasFailedAll || !currentUrl) {
    return (
      <div
        className={`w-full h-full bg-gradient-to-br ${gradientClasses} flex flex-col items-center justify-center select-none relative overflow-hidden ${className}`}
      >
        <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px]" />
        <div
          className={`relative z-10 flex items-center justify-center rounded-2xl border border-white/25 bg-white/10 backdrop-blur-md shadow-inner ${
            size === 'lg'
              ? 'w-24 h-24 md:w-28 md:h-28 [@media(max-height:750px)]:w-16 [@media(max-height:750px)]:h-16'
              : 'w-full h-full border-0 bg-transparent'
          }`}
        >
          <span
            className={`font-black tracking-tight text-white drop-shadow-md ${
              size === 'lg'
                ? 'text-3xl md:text-4xl [@media(max-height:750px)]:text-xl'
                : 'text-sm'
            }`}
          >
            {initials}
          </span>
        </div>
        {size === 'lg' && (
          <span className="relative z-10 mt-2 text-[10px] font-bold uppercase tracking-widest text-white/80 px-2 truncate max-w-[90%] [@media(max-height:750px)]:hidden">
            {station?.name || 'AudioCar HD'}
          </span>
        )}
      </div>
    );
  }

  // Low-Resolution Anti-Pixelation Presentation (naturalWidth < 128)
  if (isLowRes) {
    return (
      <div
        className={`w-full h-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center relative overflow-hidden ${className}`}
      >
        {/* Subtle ambient genre glow behind glass container */}
        <div
          className={`absolute inset-2 rounded-full bg-gradient-to-tr ${gradientClasses} opacity-25 blur-xl pointer-events-none`}
        />
        <div
          className={`relative z-10 flex items-center justify-center rounded-2xl bg-slate-900/75 backdrop-blur-md ring-1 ring-white/15 shadow-xl ${
            size === 'lg'
              ? 'w-24 h-24 [@media(max-height:750px)]:w-16 [@media(max-height:750px)]:h-16 p-2.5'
              : 'w-9 h-9 p-1 rounded-lg'
          }`}
        >
          <img
            src={currentUrl}
            alt={station.name}
            onLoad={handleImageLoad}
            onError={handleImageError}
            className={`${
              size === 'lg'
                ? 'w-20 h-20 [@media(max-height:750px)]:w-12 [@media(max-height:750px)]:h-12'
                : 'w-7 h-7'
            } object-contain rounded-lg drop-shadow`}
          />
        </div>
      </div>
    );
  }

  // High-Definition Artwork Presentation (naturalWidth >= 128 or Vector SVG)
  return (
    <div
      className={`w-full h-full bg-slate-950 flex items-center justify-center relative overflow-hidden ${className}`}
    >
      <img
        src={currentUrl}
        alt={station.name}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className="w-full h-full object-cover transition-transform duration-300"
      />
    </div>
  );
};
