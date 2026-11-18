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

