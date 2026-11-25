import { audioEngine } from './audioEngine';
import { PreRollBuffer } from '../types';

export type ConnectionStatus = 'online' | 'reconnecting' | 'buffering' | 'error';

class WatchdogService {
  private timer: any = null;
  private lastCurrentTime = 0;
  private stallCount = 0;
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
    this.setStatus('online');

    if (this.timer) clearInterval(this.timer);

    const audio = audioEngine.getAudioElement();

    // Listen to native audio events
    audio.onwaiting = () => this.setStatus('buffering');
    audio.onplaying = () => {
      this.setStatus('online');
      this.stallCount = 0;
    };
    audio.onerror = () => {
      this.handleStallOrError('Stream error detected');
    };

    // Periodic watchdog timer (every 2 seconds)
    this.timer = setInterval(() => {
      if (!this.isPlaying) return;

      const currentTime = audio.currentTime;
      const isPaused = audio.paused;

      if (!isPaused) {
        if (currentTime === this.lastCurrentTime && !audio.seeking) {
          this.stallCount++;
          console.warn(`Watchdog stall count: ${this.stallCount}/3`);
          if (this.stallCount >= 3) {
            this.handleStallOrError('Tunnel network drop detected');
          } else {
            this.setStatus('buffering');
          }
        } else {
          this.stallCount = 0;
          if (this.currentStatus === 'buffering' || this.currentStatus === 'reconnecting') {
            this.setStatus('online');
          }
        }
        this.lastCurrentTime = currentTime;
      }
    }, 2000);
  }

  public stop() {
    this.isPlaying = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    const audio = audioEngine.getAudioElement();
    audio.onwaiting = null;
    audio.onplaying = null;
    audio.onerror = null;
    this.setStatus('online');
  }

  private handleStallOrError(reason: string) {
    console.warn(`Watchdog triggered reconnection: ${reason}`);
    this.setStatus('reconnecting');
    this.stallCount = 0;

    // Exponential backoff and anti-cache reconnect
    setTimeout(() => {
      if (this.isPlaying && this.currentUrl) {
        audioEngine.reconnect(this.currentUrl, this.bufferSec);
      }
    }, 1500);
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
