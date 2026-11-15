import { AlgorithmName, Position, RaceResult, SavedMap, Stats } from '../../domain/models/types';

export interface RaceGateway {
  runRace(grid: number[][], start: Position, goal: Position, algorithms?: AlgorithmName[]): Promise<RaceResult>;
  getHistory(page?: number, pageSize?: number): Promise<{ items: RaceResult[]; totalCount: number }>;
  getRaceById(id: string): Promise<RaceResult | null>;
  getReplay(id: string): Promise<RaceResult | null>;
}

export interface MapGateway {
  getMaps(): Promise<SavedMap[]>;
  saveMap(name: string, grid: number[][], defaultStart?: Position, defaultGoal?: Position): Promise<SavedMap>;
  deleteMap(id: string): Promise<boolean>;
}

export interface StatsGateway {
  getStats(): Promise<Stats>;
}

export type SoundEvent =
  | 'click'
  | 'traffic'
  | 'thud'
  | 'start_placed'
  | 'goal_placed'
  | 'countdown'
  | 'countdown_go'
  | 'nopath'
  | 'winner';

export interface SoundPlayer {
  playTone(waveform: OscillatorType, frequency: number, duration: number, pan?: number, volume?: number): void;
  playExploredTick(algorithm: AlgorithmName, heuristicDistance: number): void;
  playEvent(event: SoundEvent): void;
  playArrival(algorithm: AlgorithmName): void;
  playWinnerFanfare(): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  unlockAudio(): Promise<void>;
}
