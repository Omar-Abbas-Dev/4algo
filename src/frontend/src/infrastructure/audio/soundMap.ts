import { AlgorithmName } from '../../domain/models/types';

export interface AlgorithmSoundProfile {
  algorithm: AlgorithmName;
  waveform: OscillatorType;
  pan: number;
  baseFrequency: number;
}

export const SOUND_PROFILES: Record<AlgorithmName, AlgorithmSoundProfile> = {
  BFS: {
    algorithm: 'BFS',
    waveform: 'sine',
    pan: -0.8,
    baseFrequency: 261.63, // C4
  },
  DFS: {
    algorithm: 'DFS',
    waveform: 'square',
    pan: -0.3,
    baseFrequency: 220.0, // A3
  },
  Greedy: {
    algorithm: 'Greedy',
    waveform: 'triangle',
    pan: 0.3,
    baseFrequency: 329.63, // E4
  },
  'A*': {
    algorithm: 'A*',
    waveform: 'sawtooth',
    pan: 0.8,
    baseFrequency: 392.0, // G4
  },
};
