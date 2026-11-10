/**
 * Web Audio API audio synthesizer for scan sound effects and haptic vibration feedback.
 * Operates without external audio asset downloads.
 */

class AudioService {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playBeep(type: 'success' | 'warning' | 'error' | 'completion' = 'success', soundEnabled: boolean = true) {
    if (!soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      const now = this.ctx.currentTime;

      if (type === 'success') {
        // High crisp beep (1200Hz -> 1800Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(1800, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'warning') {
        // Double pulse low warning
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'error') {
        // Low buzzy error tone (220Hz -> 180Hz)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.linearRampToValueAtTime(160, now + 0.25);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'completion') {
        // Musical arpeggio chime
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          if (!this.ctx) return;
          const noteOsc = this.ctx.createOscillator();
          const noteGain = this.ctx.createGain();
          noteOsc.connect(noteGain);
          noteGain.connect(this.ctx.destination);
          
          const startTime = now + idx * 0.08;
          noteOsc.type = 'sine';
          noteOsc.frequency.setValueAtTime(freq, startTime);
          noteGain.gain.setValueAtTime(0.12, startTime);
          noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
          
          noteOsc.start(startTime);
          noteOsc.stop(startTime + 0.3);
        });
      }
    } catch {
      // Ignore audio context errors on restricted browsers
    }
  }

  triggerVibrate(enabled: boolean = true, pattern: number | number[] = 50) {
    if (!enabled) return;
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore vibration permission or hardware limitations
      }
    }
  }
}

export const audioService = new AudioService();
