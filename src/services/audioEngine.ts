import Hls from 'hls.js';
import { EQSettings, PreRollBuffer } from '../types';

class AudioEngine {
  private audioElement: HTMLAudioElement;
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private hls: Hls | null = null;
  private isInitialized = false;

  constructor() {
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.preload = 'none';
  }

  public initContext() {
    if (this.isInitialized && this.audioCtx) {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      
      if (this.audioCtx) {
        this.sourceNode = this.audioCtx.createMediaElementSource(this.audioElement);
        
        // Create 3-band EQ filters
        this.bassFilter = this.audioCtx.createBiquadFilter();
        this.bassFilter.type = 'lowshelf';
        this.bassFilter.frequency.setValueAtTime(250, this.audioCtx.currentTime);

        this.midFilter = this.audioCtx.createBiquadFilter();
        this.midFilter.type = 'peaking';
        this.midFilter.frequency.setValueAtTime(1500, this.audioCtx.currentTime);
        this.midFilter.Q.setValueAtTime(1.0, this.audioCtx.currentTime);

        this.trebleFilter = this.audioCtx.createBiquadFilter();
        this.trebleFilter.type = 'highshelf';
        this.trebleFilter.frequency.setValueAtTime(4000, this.audioCtx.currentTime);

        // Dynamics Compressor (AGC Leveler for radio streams)
        this.compressor = this.audioCtx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-24, this.audioCtx.currentTime);
        this.compressor.knee.setValueAtTime(30, this.audioCtx.currentTime);
        this.compressor.ratio.setValueAtTime(12, this.audioCtx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
        this.compressor.release.setValueAtTime(0.25, this.audioCtx.currentTime);

        // Connect graph: source -> bass -> mid -> treble -> compressor -> destination
        this.sourceNode
          .connect(this.bassFilter)
          .connect(this.midFilter)
          .connect(this.trebleFilter)
          .connect(this.compressor)
          .connect(this.audioCtx.destination);

        this.isInitialized = true;
      }
    } catch (e) {
      console.warn('Web Audio API context initialization error (falling back to standard audio element):', e);
    }
  }

  public setEQ(eq: EQSettings) {
    if (!this.audioCtx || !this.bassFilter || !this.midFilter || !this.trebleFilter) return;
    const now = this.audioCtx.currentTime;
    this.bassFilter.gain.setValueAtTime(eq.bass, now);
    this.midFilter.gain.setValueAtTime(eq.mid, now);
    this.trebleFilter.gain.setValueAtTime(eq.treble, now);
  }

  public loadStream(url: string, bufferSec: PreRollBuffer, onMetadata?: (meta: any) => void) {
    this.initContext();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    // Cleanup previous HLS instance if any
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    this.audioElement.pause();
    this.audioElement.src = '';

    const isHls = url.includes('.m3u8') || url.includes('playlist.m3u8');

    if (isHls && Hls.isSupported()) {
      this.hls = new Hls({
        liveSyncDurationCount: bufferSec,
        maxLiveSyncPlaybackRate: 1.5,
      });
      this.hls.loadSource(url);
      this.hls.attachMedia(this.audioElement);
      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        this.playWithBuffer(bufferSec);
      });
      this.hls.on(Hls.Events.ERROR, (event, data) => {
        console.warn('HLS error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              this.hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              this.hls?.recoverMediaError();
              break;
            default:
              this.destroyHls();
              break;
          }
        }
      });
    } else {
      // Standard MP3 / AAC stream
      this.audioElement.src = url;
      this.audioElement.load();
      this.playWithBuffer(bufferSec);
    }
  }

  private playWithBuffer(bufferSec: PreRollBuffer) {
    // Apply buffer pre-roll delay if needed
    const startPlay = () => {
      this.audioElement.play().catch(err => {
        console.warn('Playback prevented or interrupted:', err);
      });
    };

    if (bufferSec > 2) {
      setTimeout(startPlay, bufferSec * 200); // Pre-roll loading simulation
    } else {
      startPlay();
    }
  }

  private destroyHls() {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
  }

  public play() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    this.audioElement.play().catch(e => console.warn('Play error:', e));
  }

  public pause() {
    this.audioElement.pause();
  }

  public setVolume(vol: number) {
    this.audioElement.volume = Math.max(0, Math.min(1, vol));
  }

  public getVolume(): number {
    return this.audioElement.volume;
  }

  public setMuted(muted: boolean) {
    this.audioElement.muted = muted;
  }

  public getMuted(): boolean {
    return this.audioElement.muted;
  }

  public getAudioElement(): HTMLAudioElement {
    return this.audioElement;
  }

  public reconnect(currentUrl: string, bufferSec: PreRollBuffer) {
    console.log('Watchdog triggered reconnection with anti-cache timestamp');
    const separator = currentUrl.includes('?') ? '&' : '?';
    const antiCacheUrl = `${currentUrl}${separator}_t=${Date.now()}`;
    this.loadStream(antiCacheUrl, bufferSec);
  }
}

export const audioEngine = new AudioEngine();
