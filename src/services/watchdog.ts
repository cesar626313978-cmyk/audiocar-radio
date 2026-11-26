import { audioEngine } from './audioEngine';
import { PreRollBuffer } from '../types';

export type ConnectionStatus = 'online' | 'reconnecting' | 'buffering' | 'error';

class WatchdogService {
  private timer: any = null;
  private reconnectTimeout: any = null;
  private lastCurrentTime = 0;
  private stallCount = 0;
  private retryAttempt = 0;
  private statusListeners: ((status: ConnectionStatus) => void)[] = [];
  private currentUrl = '';
  private bufferSec: PreRollBuffer = 5;
  private isPlaying = false;
  private currentStatus: ConnectionStatus = 'online';

  public start(url: string, bufferSec: PreRollBuffer) {
    this.currentUrl = url;
    this.bufferSec = bufferSec;
    this.isPlaying = true;
    this.stallCount = 0;
    this.retryAttempt = 0;
    this.setStatus('buffering');

    if (this.timer) clearInterval(this.timer);
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);

    this.bindAudioEvents();

    // Periodic watchdog timer (every 2 seconds)
    this.timer = setInterval(() => {
      if (!this.isPlaying) return;

      const audio = audioEngine.getAudioElement();
      this.bindAudioEvents();

      const currentTime = audio.currentTime;
      const isPaused = audio.paused;

      if (!isPaused) {
        if (currentTime === this.lastCurrentTime && !audio.seeking) {
          this.stallCount++;
          if (this.stallCount >= 4) {
            this.handleStallOrError('Tunnel or network stall detected');
          } else if (this.stallCount >= 2) {
            this.setStatus('buffering');
          }
        } else {
          this.stallCount = 0;
          this.retryAttempt = 0;
          if (this.currentStatus !== 'online') {
            this.setStatus('online');
          }
        }
        this.lastCurrentTime = currentTime;
      }
    }, 2000);
  }

  private bindAudioEvents() {
    const audio = audioEngine.getAudioElement();

    audio.onwaiting = () => {
      if (this.isPlaying) this.setStatus('buffering');
    };

    audio.onplaying = () => {
      this.setStatus('online');
      this.stallCount = 0;
      this.retryAttempt = 0;
    };

    audio.ontimeupdate = () => {
      if (this.isPlaying && !audio.paused && audio.currentTime > 0) {
        if (this.currentStatus !== 'online') {
          this.setStatus('online');
        }
      }
    };

    audio.onstalled = () => {
      if (this.isPlaying) {
        this.setStatus('buffering');
      }
    };

    audio.onerror = () => {
      if (this.isPlaying) {
        this.handleStallOrError('Stream error event detected');
      }
    };
  }

  public stop() {
    this.isPlaying = false;
    this.stallCount = 0;
    this.retryAttempt = 0;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    const audio = audioEngine.getAudioElement();
    audio.onwaiting = null;
    audio.onplaying = null;
    audio.ontimeupdate = null;
    audio.onstalled = null;
    audio.onerror = null;
    this.setStatus('online');
  }

  private handleStallOrError(reason: string) {
    if (!this.isPlaying || !this.currentUrl) return;
    console.warn(`Watchdog triggered reconnection: ${reason}`);
    this.setStatus('reconnecting');
    this.stallCount = 0;

    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);

    // Exponential backoff with jitter (1.5s up to 10s max)
    const baseDelay = Math.min(10000, 1500 * Math.pow(1.5, this.retryAttempt));
    const jitter = Math.floor(Math.random() * 500);
    this.retryAttempt++;

    this.reconnectTimeout = setTimeout(() => {
      if (this.isPlaying && this.currentUrl) {
        audioEngine.reconnect(this.currentUrl, this.bufferSec);
      }
    }, baseDelay + jitter);
  }

  private setStatus(status: ConnectionStatus) {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
      this.statusListeners.forEach(listener => listener(status));
    }
  }

  public subscribe(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.push(listener);
    listener(this.currentStatus);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  public getStatus(): ConnectionStatus {
    return this.currentStatus;
  }
}

export const watchdog = new WatchdogService();
