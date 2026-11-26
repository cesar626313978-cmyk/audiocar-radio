import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';
import { ConnectionStatus } from '../services/watchdog';

interface AudioWaveVisualizerProps {
  isPlaying: boolean;
  connectionStatus: ConnectionStatus;
}

const BAR_COUNT = 56;
const HALF_BARS = BAR_COUNT / 2;

export const AudioWaveVisualizer: React.FC<AudioWaveVisualizerProps> = ({
  isPlaying,
  connectionStatus,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Persistent animation state across frames so stops/starts transition organically
  const barsRef = useRef<Float32Array>(new Float32Array(BAR_COUNT));
  const peaksRef = useRef<Float32Array>(new Float32Array(BAR_COUNT));
  const peakVelRef = useRef<Float32Array>(new Float32Array(BAR_COUNT));
  const phasesRef = useRef<Float32Array>(new Float32Array(BAR_COUNT));
  const rafIdRef = useRef<number | null>(null);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const statusRef = useRef<ConnectionStatus>(connectionStatus);

  isPlayingRef.current = isPlaying;
  statusRef.current = connectionStatus;

  // Initialize deterministic organic phase offsets once
  useEffect(() => {
    const phases = phasesRef.current;
    for (let i = 0; i < BAR_COUNT; i++) {
      phases[i] = (i * 0.43) + Math.sin(i * 1.17) * 0.8;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = window.devicePixelRatio || 1;

    const updateCanvasSize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateCanvasSize();

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
      drawSingleFrame(performance.now());
    });
    resizeObserver.observe(canvas);

    const computeTargetEnergy = (barIndex: number, tSec: number, mode: 'playing' | 'buffering' | 'idle'): number => {
      if (mode === 'idle') {
        return 0;
      }

      // Distance from center: 0 at center (bass), 1 at outer edges (treble)
      const centerPos = (BAR_COUNT - 1) / 2;
      const distFromCenter = Math.abs(barIndex - centerPos) / HALF_BARS;

      if (mode === 'buffering') {
        // Gentle, slow breathing wave concentrated near the center while connecting/buffering
        const envelope = Math.exp(-distFromCenter * distFromCenter * 2.8);
        const wave = 0.5 + 0.5 * Math.sin(tSec * 2.4 - distFromCenter * 4.2);
        return envelope * (0.12 + 0.22 * wave);
      }

      // 'playing' mode: Multi-harmonic organic simulation (Bass in center, Mids in middle, Treble on sides)
      const phase = phasesRef.current[barIndex];

      // 1. Bass Envelope (strongest at center 0.0 -> 0.35)
      const bassWeight = Math.max(0, 1 - distFromCenter * 1.85);
      const kickPulse = Math.pow(0.5 + 0.5 * Math.sin(tSec * 4.4 + Math.sin(tSec * 1.7) * 1.2), 2.4);
      const subBass = 0.5 + 0.5 * Math.sin(tSec * 2.9 - distFromCenter * 3.0);
      const bassEnergy = bassWeight * (0.45 * subBass + 0.55 * kickPulse);

      // 2. Midrange Envelope (vocal / harmonic body, peaks around distFromCenter ~ 0.35 - 0.7)
      const midDist = (distFromCenter - 0.45) / 0.38;
      const midWeight = Math.exp(-midDist * midDist * 1.8);
      const midWave1 = 0.5 + 0.5 * Math.sin(tSec * 7.3 + phase * 1.3);
      const midWave2 = 0.5 + 0.5 * Math.cos(tSec * 11.1 - phase * 0.9);
      const midWave3 = 0.5 + 0.5 * Math.sin(tSec * 5.2 + distFromCenter * 6.0);
      const midEnergy = midWeight * (0.4 * midWave1 + 0.35 * midWave2 + 0.25 * midWave3);

      // 3. Treble / Hi-Hat Envelope (outer wings 0.55 -> 1.0)
      const trebleWeight = Math.max(0, Math.min(1, (distFromCenter - 0.35) * 1.4)) * (1 - distFromCenter * 0.28);
      const shimmer1 = 0.5 + 0.5 * Math.sin(tSec * 16.5 + phase * 2.7);
      const shimmer2 = 0.5 + 0.5 * Math.cos(tSec * 23.0 - phase * 3.4);
      const trebleEnergy = trebleWeight * (0.55 * shimmer1 + 0.45 * shimmer2) * 0.75;

      // Global dynamic rhythm modulation so the whole spectrum breathes together like real music
      const phraseEnvelope = 0.72 + 0.28 * Math.sin(tSec * 1.35 + Math.cos(tSec * 0.6) * 1.5);
      const combined = (bassEnergy + midEnergy + trebleEnergy) * phraseEnvelope;

      // Clamp between 0.05 and 0.98
      return Math.max(0.05, Math.min(0.98, combined));
    };

    const drawSingleFrame = (nowMs: number): boolean => {
      if (width === 0 || height === 0) {
        updateCanvasSize();
        if (width === 0 || height === 0) return false;
      }

      const audio = audioEngine.getAudioElement();
      const hasRealAudioPlayback =
        isPlayingRef.current &&
        !audio.paused &&
        audio.readyState >= 3 &&
        !audio.muted &&
        audio.volume > 0;

      const isBufferingState =
        isPlayingRef.current &&
        (statusRef.current === 'buffering' ||
          statusRef.current === 'reconnecting' ||
          audio.readyState < 3);

      const mode: 'playing' | 'buffering' | 'idle' = hasRealAudioPlayback
        ? 'playing'
        : isBufferingState
        ? 'buffering'
        : 'idle';

      const tSec = nowMs / 1000;
      const bars = barsRef.current;
      const peaks = peaksRef.current;
      const peakVel = peakVelRef.current;

      let anyActiveAnimation = mode !== 'idle';

      for (let i = 0; i < BAR_COUNT; i++) {
        const target = computeTargetEnergy(i, tSec, mode);
        const current = bars[i];

        // Fast attack, smooth inertial decay
        if (target > current) {
          bars[i] = current + (target - current) * 0.34;
        } else {
          bars[i] = current + (target - current) * (mode === 'idle' ? 0.14 : 0.16);
        }

        if (bars[i] < 0.002) {
          bars[i] = 0;
        } else if (mode === 'idle') {
          anyActiveAnimation = true;
        }

        // Peak-hold caps physics with gentle gravity
        if (bars[i] >= peaks[i]) {
          peaks[i] = bars[i];
          peakVel[i] = 0;
        } else {
          peakVel[i] += 0.0012; // gentle gravity acceleration
          peaks[i] = Math.max(bars[i], peaks[i] - peakVel[i]);
          if (peaks[i] > 0.004 && mode === 'idle') {
            anyActiveAnimation = true;
          } else if (peaks[i] <= 0.004) {
            peaks[i] = 0;
          }
        }
      }

      // Render canvas
      ctx.clearRect(0, 0, width, height);

      const isLightTheme = !document.documentElement.classList.contains('dark');
      const centerY = height / 2;
      const maxHalfHeight = Math.max(8, centerY - 6);

      // Compute bar geometry for 56 symmetric bars
      const horizontalPadding = 6;
      const usableWidth = Math.max(100, width - horizontalPadding * 2);
      const step = usableWidth / BAR_COUNT;
      const barWidth = Math.max(2.2, Math.min(5.5, step * 0.58));
      const radius = barWidth / 2;

      // Vertical luminous gradient (Electric Blue #4DA8FF / Cyan at peaks -> Deep Blue at center)
      const barGradient = ctx.createLinearGradient(0, centerY - maxHalfHeight, 0, centerY + maxHalfHeight);
      if (isLightTheme) {
        barGradient.addColorStop(0, '#00D2FF');
        barGradient.addColorStop(0.22, '#2563EB');
        barGradient.addColorStop(0.5, '#1E3A8A');
        barGradient.addColorStop(0.78, '#2563EB');
        barGradient.addColorStop(1, '#00D2FF');
      } else {
        barGradient.addColorStop(0, '#7CE8FF');
        barGradient.addColorStop(0.18, '#4DA8FF');
        barGradient.addColorStop(0.5, '#1E40AF');
        barGradient.addColorStop(0.82, '#4DA8FF');
        barGradient.addColorStop(1, '#7CE8FF');
      }

      // Subtle center horizon line
      ctx.save();
      ctx.strokeStyle = isLightTheme ? 'rgba(37, 99, 235, 0.12)' : 'rgba(77, 168, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(horizontalPadding, centerY);
      ctx.lineTo(width - horizontalPadding, centerY);
      ctx.stroke();
      ctx.restore();

      for (let i = 0; i < BAR_COUNT; i++) {
        const x = horizontalPadding + i * step + (step - barWidth) / 2;
        const val = bars[i];
        const peakVal = peaks[i];

        // Minimum resting dot height equals barWidth so at idle it forms a clean line of capsule dots
        const halfBarH = Math.max(radius, val * maxHalfHeight);
        const totalBarH = halfBarH * 2;
        const topY = centerY - halfBarH;

        ctx.save();

        if (val <= 0.01 && mode === 'idle') {
          // Resting horizontal line of dots
          ctx.fillStyle = isLightTheme ? 'rgba(100, 116, 139, 0.45)' : 'rgba(77, 168, 255, 0.35)';
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = barGradient;
          // Subtle glow on high crests
          if (val > 0.45) {
            ctx.shadowColor = '#4DA8FF';
            ctx.shadowBlur = Math.min(14, (val - 0.4) * 22);
          } else {
            ctx.shadowBlur = 0;
          }
        }

        // Draw rounded capsule bar mirrored across centerY
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, topY, barWidth, totalBarH, radius);
        } else {
          ctx.rect(x, topY, barWidth, totalBarH);
        }
        ctx.fill();
        ctx.restore();

        // Draw symmetric peak-hold indicator caps above and below the bar when active
        if (peakVal > 0.06 && peakVal > val + 0.015) {
          const peakOffset = Math.min(maxHalfHeight + 3, peakVal * maxHalfHeight + 3.5);
          const capHeight = Math.max(2, barWidth * 0.65);

          ctx.save();
          ctx.fillStyle = isLightTheme ? '#0284C7' : '#A5F3FC';
          ctx.shadowColor = '#4DA8FF';
          ctx.shadowBlur = 6;

          // Upper peak cap
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(x, centerY - peakOffset - capHeight / 2, barWidth, capHeight, capHeight / 2);
            // Lower mirrored peak cap
            ctx.roundRect(x, centerY + peakOffset - capHeight / 2, barWidth, capHeight, capHeight / 2);
          } else {
            ctx.rect(x, centerY - peakOffset - capHeight / 2, barWidth, capHeight);
            ctx.rect(x, centerY + peakOffset - capHeight / 2, barWidth, capHeight);
          }
          ctx.fill();
          ctx.restore();
        }
      }

      return anyActiveAnimation;
    };

    const stopLoop = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };

    const tick = (nowMs: number) => {
      if (document.hidden) {
        rafIdRef.current = null;
        return;
      }

      const keepRunning = drawSingleFrame(nowMs);
      if (keepRunning) {
        rafIdRef.current = requestAnimationFrame(tick);
      } else {
        // Animation has settled to resting horizontal dots; stop rAF loop to save Tesla CPU
        rafIdRef.current = null;
      }
    };

    const startLoopIfNeeded = () => {
      if (document.hidden) return;
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(tick);
      }
    };

    // Listen to native audio element events so the loop wakes immediately when readyState >= 3 or waiting/playing changes
    const audio = audioEngine.getAudioElement();
    const handleAudioStateChange = () => {
      startLoopIfNeeded();
    };

    audio.addEventListener('playing', handleAudioStateChange);
    audio.addEventListener('canplay', handleAudioStateChange);
    audio.addEventListener('waiting', handleAudioStateChange);
    audio.addEventListener('stalled', handleAudioStateChange);
    audio.addEventListener('pause', handleAudioStateChange);

    // Pause canvas rendering when browser tab goes to background (visibilitychange)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopLoop();
      } else {
        startLoopIfNeeded();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Trigger initial render / animation loop
    startLoopIfNeeded();

    return () => {
      stopLoop();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      audio.removeEventListener('playing', handleAudioStateChange);
      audio.removeEventListener('canplay', handleAudioStateChange);
      audio.removeEventListener('waiting', handleAudioStateChange);
      audio.removeEventListener('stalled', handleAudioStateChange);
      audio.removeEventListener('pause', handleAudioStateChange);
    };
  }, [isPlaying, connectionStatus]);

  return (
    <div className="w-full max-w-md px-3 flex items-center justify-center shrink-0">
      <canvas
        ref={canvasRef}
        className="w-full h-14 [@media(max-height:750px)]:h-9 block"
        aria-label="Visualizador de ondas de audio en alta definición"
      />
    </div>
  );
};
