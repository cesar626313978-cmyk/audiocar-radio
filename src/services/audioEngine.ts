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
  private isWebAudioConnected = false;
  private currentEQ: EQSettings = { bass: 0, mid: 0, treble: 0, preset: 'flat' };
  private currentUrl = '';
  private currentBufferSec: PreRollBuffer = 5;
  private loadSequenceId = 0;
  private preRollTimer: any = null;
  private triedProxyForCurrentStream = false;

  constructor() {
    this.audioElement = this.createRawAudioElement();
  }

  private createRawAudioElement(): HTMLAudioElement {
    const audio = new Audio();
    // Do NOT set crossOrigin="anonymous" by default so Icecast/Shoutcast streams without CORS headers play natively
    audio.removeAttribute('crossorigin');
    audio.preload = 'none';
    audio.autoplay = false;
    (audio as any).playsInline = true;
    return audio;
  }

  private getProxyUrl(rawUrl: string): string {
    return `/api/stream-proxy?url=${encodeURIComponent(rawUrl)}`;
  }

  private wrapMixedContentProxy(url: string): string {
    if (!url) return url;
    if (url.startsWith('/api/stream-proxy') || url.includes('/api/stream-proxy?url=')) {
      return url;
    }
    const isHttpsPage =
      typeof window !== 'undefined' && window.location.protocol === 'https:';
    if (isHttpsPage && url.startsWith('http://')) {
      return this.getProxyUrl(url);
    }
    return url;
  }

  private async resolvePlaylistIfNeeded(url: string): Promise<string> {
    const cleanUrl = url.split('?')[0].toLowerCase();
    const isM3u = cleanUrl.endsWith('.m3u');
    const isPls = cleanUrl.endsWith('.pls');

    if (!isM3u && !isPls) {
      return url;
    }

    try {
      const fetchTarget = this.wrapMixedContentProxy(url);
      let res = await fetch(fetchTarget);
      if (!res.ok && !fetchTarget.startsWith('/api/stream-proxy')) {
        res = await fetch(this.getProxyUrl(url));
      }
      if (res.ok) {
        const text = await res.text();
        if (isPls) {
          const match = text.match(/File\d+\s*=\s*(https?:\/\/[^\s\r\n]+)/i);
          if (match && match[1]) {
            return match[1].trim();
          }
        }
        // For .m3u or fallback .pls extraction
        const lines = text.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (
            trimmed &&
            !trimmed.startsWith('#') &&
            (trimmed.startsWith('http://') || trimmed.startsWith('https://'))
          ) {
            return trimmed;
          }
        }
      }
    } catch (err) {
      console.warn('Playlist resolution fallback to original URL:', err);
    }

    return url;
  }

  private isHlsUrl(url: string): boolean {
    const lower = url.toLowerCase();
    return (
      lower.includes('.m3u8') ||
      lower.includes('playlist.m3u8') ||
      lower.includes('/hls/') ||
      lower.includes('format=m3u8')
    );
  }

  /**
   * Disconnects Web Audio graph, recreates a clean <audio> without crossOrigin,
   * and resumes native playback so CORS errors never silence the stream.
   */
  public fallbackToNativePlayback(): void {
    const wasPlaying = !this.audioElement.paused;
    const savedVol = this.audioElement.volume;
    const savedMuted = this.audioElement.muted;

    this.disconnectWebAudioNodes();

    // Cleanly stop previous element
    try {
      this.audioElement.pause();
      this.audioElement.removeAttribute('src');
      this.audioElement.load();
    } catch {}

    // Create fresh <audio> element because once createMediaElementSource is bound to an element,
    // Chromium permanently routes that element into the AudioContext.
    this.audioElement = this.createRawAudioElement();
    this.audioElement.volume = savedVol;
    this.audioElement.muted = savedMuted;

    if (this.currentUrl && wasPlaying) {
      this.loadStream(this.currentUrl, this.currentBufferSec);
    }
  }

  private disconnectWebAudioNodes(): void {
    try {
      this.sourceNode?.disconnect();
      this.bassFilter?.disconnect();
      this.midFilter?.disconnect();
      this.trebleFilter?.disconnect();
      this.compressor?.disconnect();
    } catch {}
    this.sourceNode = null;
    this.bassFilter = null;
    this.midFilter = null;
    this.trebleFilter = null;
    this.compressor = null;
    this.isWebAudioConnected = false;
  }

  /**
   * Initializes and connects Web Audio API EQ ONLY on user gesture when activating a non-flat band.
   * If CORS blocks or silences playback, automatically falls back to native <audio>.
   */
  public async enableWebAudioEQFromUserGesture(eq: EQSettings): Promise<void> {
    this.currentEQ = eq;
    const isNonFlat = eq.bass !== 0 || eq.mid !== 0 || eq.treble !== 0;
    if (!isNonFlat) {
      if (this.isWebAudioConnected && this.audioCtx) {
        this.applyEQGains(eq);
      }
      return;
    }

    if (this.isWebAudioConnected && this.audioCtx) {
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }
      this.applyEQGains(eq);
      return;
    }

    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      const wasPlaying = !this.audioElement.paused;
      const activeSrc = this.audioElement.src;

      // Enable anonymous CORS before attaching Web Audio source node.
      // If the stream is external without CORS, route through /api/stream-proxy which sets Access-Control-Allow-Origin: *
      this.audioElement.crossOrigin = 'anonymous';
      if (
        activeSrc &&
        !activeSrc.includes('/api/stream-proxy') &&
        this.currentUrl &&
        !this.isHlsUrl(this.currentUrl)
      ) {
        this.audioElement.src = this.getProxyUrl(this.currentUrl);
        if (wasPlaying) {
          this.audioElement.play().catch(() => {
            this.fallbackToNativePlayback();
          });
        }
      }

      this.sourceNode = this.audioCtx.createMediaElementSource(this.audioElement);

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

      this.compressor = this.audioCtx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-24, this.audioCtx.currentTime);
      this.compressor.knee.setValueAtTime(30, this.audioCtx.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.audioCtx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.audioCtx.currentTime);

      this.sourceNode
        .connect(this.bassFilter)
        .connect(this.midFilter)
        .connect(this.trebleFilter)
        .connect(this.compressor)
        .connect(this.audioCtx.destination);

      this.isWebAudioConnected = true;
      this.applyEQGains(eq);
    } catch (e) {
      console.warn('Web Audio EQ connection failed, falling back to native audio:', e);
      this.fallbackToNativePlayback();
    }
  }

  private applyEQGains(eq: EQSettings): void {
    if (!this.audioCtx || !this.bassFilter || !this.midFilter || !this.trebleFilter) return;
    const now = this.audioCtx.currentTime;
    this.bassFilter.gain.setValueAtTime(eq.bass, now);
    this.midFilter.gain.setValueAtTime(eq.mid, now);
    this.trebleFilter.gain.setValueAtTime(eq.treble, now);
  }

  /**
   * Stores EQ settings; if user adjusts EQ interactively to a non-flat band, initializes Web Audio safely.
   */
  public setEQ(eq: EQSettings, fromUserGesture = false): void {
    this.currentEQ = eq;
    if (this.isWebAudioConnected) {
      this.applyEQGains(eq);
    } else if (fromUserGesture && (eq.bass !== 0 || eq.mid !== 0 || eq.treble !== 0)) {
      this.enableWebAudioEQFromUserGesture(eq).catch(() => {
        this.fallbackToNativePlayback();
      });
    }
  }

  private cleanupPreviousStream(): void {
    if (this.preRollTimer) {
      clearTimeout(this.preRollTimer);
      this.preRollTimer = null;
    }

    if (this.hls) {
      try {
        this.hls.destroy();
      } catch {}
      this.hls = null;
    }

    try {
      this.audioElement.pause();
      this.audioElement.removeAttribute('src');
      this.audioElement.load();
    } catch {}
  }

  public async loadStream(
    url: string,
    bufferSec: PreRollBuffer,
    _onMetadata?: (meta: any) => void
  ): Promise<void> {
    if (!url) return;

    const seq = ++this.loadSequenceId;
    this.currentUrl = url;
    this.currentBufferSec = bufferSec;
    this.triedProxyForCurrentStream = false;

    // Cleanly destroy any previous HLS instance and reset <audio> before switching stations
    this.cleanupPreviousStream();

    // If Web Audio is NOT connected, ensure crossOrigin is removed so native Icecast/Shoutcast streams never get muted by CORS
    if (!this.isWebAudioConnected) {
      this.audioElement.removeAttribute('crossorigin');
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    // Resolve .m3u / .pls playlist files to actual audio stream URL
    const resolvedUrl = await this.resolvePlaylistIfNeeded(url);
    if (seq !== this.loadSequenceId) return;

    // Route HTTP streams through /api/stream-proxy when running on HTTPS (Mixed Content protection),
    // or when Web Audio EQ is active and requires CORS headers
    let streamUrl = this.wrapMixedContentProxy(resolvedUrl);
    if (
      this.isWebAudioConnected &&
      !this.isHlsUrl(resolvedUrl) &&
      !streamUrl.includes('/api/stream-proxy')
    ) {
      streamUrl = this.getProxyUrl(resolvedUrl);
    }

    this.startPlaybackEngine(streamUrl, resolvedUrl, bufferSec, seq);
  }

  private startPlaybackEngine(
    streamUrl: string,
    originalResolvedUrl: string,
    bufferSec: PreRollBuffer,
    seq: number
  ): void {
    if (seq !== this.loadSequenceId) return;

    const isHls = this.isHlsUrl(originalResolvedUrl) || this.isHlsUrl(streamUrl);

    if (isHls && Hls.isSupported()) {
      this.hls = new Hls({
        maxBufferLength: 20,
        backBufferLength: 30,
        lowLatencyMode: false,
        liveSyncDurationCount: Math.max(3, bufferSec),
        maxLiveSyncPlaybackRate: 1.5,
        enableWorker: true,
      });

      this.hls.loadSource(streamUrl);
      this.hls.attachMedia(this.audioElement);

      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (seq !== this.loadSequenceId) return;
        this.safePlay();
      });

      this.hls.on(Hls.Events.ERROR, (_event, data) => {
        if (seq !== this.loadSequenceId) return;
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              this.hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              this.hls?.recoverMediaError();
              break;
            default:
              this.cleanupPreviousStream();
              break;
          }
        }
      });
    } else if (
      isHls &&
      this.audioElement.canPlayType('application/vnd.apple.mpegurl')
    ) {
      this.audioElement.src = streamUrl;
      this.audioElement.load();
      this.safePlay();
    } else {
      // Native MP3 / AAC / OGG Icecast & Shoutcast stream
      this.audioElement.src = streamUrl;
      this.audioElement.load();

      // Handle stream error or HTTP redirect mixed-content block by retrying through /api/stream-proxy or dropping Web Audio CORS
      const onErrorOnce = () => {
        this.audioElement.removeEventListener('error', onErrorOnce);
        if (seq !== this.loadSequenceId) return;

        // If Web Audio CORS caused the error, fallback to native <audio> immediately
        if (this.isWebAudioConnected) {
          console.warn('CORS error with Web Audio EQ enabled; falling back to native playback');
          this.fallbackToNativePlayback();
          return;
        }

        // If direct HTTPS->HTTP redirect or connection failed, retry once via server stream proxy
        if (
          !this.triedProxyForCurrentStream &&
          !streamUrl.includes('/api/stream-proxy')
        ) {
          this.triedProxyForCurrentStream = true;
          const proxied = this.getProxyUrl(originalResolvedUrl);
          console.info('Retrying stream via /api/stream-proxy to avoid Mixed Content / redirect block');
          this.audioElement.removeAttribute('crossorigin');
          this.audioElement.src = proxied;
          this.audioElement.load();
          this.safePlay();
        }
      };

      this.audioElement.addEventListener('error', onErrorOnce, { once: true });
      this.safePlay();
    }
  }

  private safePlay(): void {
    const playPromise = this.audioElement.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        if (err?.name === 'AbortError') {
          // Normal when switching stations rapidly
          return;
        }
        console.warn('Playback start warning:', err);
      });
    }
  }

  public play(): void {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    this.safePlay();
  }

  public pause(): void {
    if (this.preRollTimer) {
      clearTimeout(this.preRollTimer);
      this.preRollTimer = null;
    }
    try {
      this.audioElement.pause();
    } catch {}
  }

  public setVolume(vol: number): void {
    this.audioElement.volume = Math.max(0, Math.min(1, vol));
  }

  public getVolume(): number {
    return this.audioElement.volume;
  }

  public setMuted(muted: boolean): void {
    this.audioElement.muted = muted;
  }

  public getMuted(): boolean {
    return this.audioElement.muted;
  }

  public getAudioElement(): HTMLAudioElement {
    return this.audioElement;
  }

  public reconnect(currentUrl: string, bufferSec: PreRollBuffer): void {
    const baseUrl = currentUrl || this.currentUrl;
    if (!baseUrl) return;
    // Strip any old _t parameter before adding a fresh anti-cache timestamp
    const cleaned = baseUrl.replace(/([?&])_t=\d+(&?)/, (_match, p1, p2) =>
      p2 ? p1 : ''
    );
    const separator = cleaned.includes('?') ? '&' : '?';
    const antiCacheUrl = `${cleaned}${separator}_t=${Date.now()}`;
    this.loadStream(antiCacheUrl, bufferSec);
  }
}

export const audioEngine = new AudioEngine();
