import { AlgorithmName } from '../../domain/models/types';
import { SoundEvent, SoundPlayer } from '../../application/ports/ports';
import { SOUND_PROFILES } from './soundMap';

export class BrowserSoundPlayer implements SoundPlayer {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private backendBaseUrl: string = 'http://localhost:5000/api/audio';
  private audioBufferCache: Map<string, AudioBuffer> = new Map();

  constructor(backendBaseUrl: string = 'http://localhost:5000/api/audio') {
    this.backendBaseUrl = backendBaseUrl;
  }

  private getContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public async unlockAudio(): Promise<void> {
    const ctx = this.getContext();
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume();
    }
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public playTone(
    waveform: OscillatorType,
    frequency: number,
    duration: number,
    pan: number = 0,
    volume: number = 0.3
  ): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = waveform;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      if (ctx.createStereoPanner) {
        const panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), ctx.currentTime);
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(ctx.destination);
      } else {
        osc.connect(gain);
        gain.connect(ctx.destination);
      }

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio context might be restricted
    }
  }

  public playExploredTick(algorithm: AlgorithmName, heuristicDistance: number): void {
    const profile = SOUND_PROFILES[algorithm];
    if (!profile) return;

    // Pitch increases as algorithm gets closer to the goal (heuristic distance h decreases)
    // Range from 250Hz up to 1300Hz
    const freq = Math.max(250, Math.min(1300, 1300 - heuristicDistance * 32));
    this.playTone(profile.waveform, freq, 0.035, profile.pan, 0.12);
  }

  public playArrival(algorithm: AlgorithmName): void {
    const profile = SOUND_PROFILES[algorithm];
    if (!profile) return;

    const base = profile.baseFrequency;
    // Fast major triad arpeggio
    const notes = [base, base * 1.25, base * 1.5, base * 2.0];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(profile.waveform, freq, 0.15, profile.pan, 0.25);
      }, idx * 60);
    });
  }

  public playWinnerFanfare(): void {
    // Grand celebratory fanfare: G4 -> C5 -> E5 -> G5
    const fanfareNotes = [392.0, 523.25, 659.25, 783.99];
    fanfareNotes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone('sawtooth', freq, idx === fanfareNotes.length - 1 ? 0.6 : 0.18, 0, 0.35);
      }, idx * 130);
    });
  }

  public playEvent(event: SoundEvent): void {
    switch (event) {
      case 'click':
        this.playTone('sine', 880, 0.02, 0, 0.2);
        break;
      case 'traffic':
        // Low dissonant vehicle horn
        this.playTone('sawtooth', 140, 0.2, 0, 0.25);
        this.playTone('sawtooth', 154, 0.2, 0, 0.25);
        break;
      case 'thud':
        this.playTone('triangle', 90, 0.15, 0, 0.4);
        break;
      case 'start_placed':
        // Rising tone
        this.playTone('sine', 440, 0.08, -0.4, 0.25);
        setTimeout(() => this.playTone('sine', 659, 0.1, -0.4, 0.25), 80);
        break;
      case 'goal_placed':
        // Falling tone
        this.playTone('sine', 659, 0.08, 0.4, 0.25);
        setTimeout(() => this.playTone('sine', 440, 0.1, 0.4, 0.25), 80);
        break;
      case 'countdown':
        this.playTone('sine', 587.33, 0.1, 0, 0.3);
        break;
      case 'countdown_go':
        this.playTone('sawtooth', 1174.66, 0.3, 0, 0.4);
        break;
      case 'nopath':
        this.playTone('square', 220, 0.2, 0, 0.25);
        setTimeout(() => this.playTone('square', 165, 0.3, 0, 0.25), 200);
        break;
      case 'winner':
        this.playWinnerFanfare();
        break;
    }
  }
}
