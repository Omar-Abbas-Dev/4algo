import { MapGateway, RaceGateway, StatsGateway } from '../../application/ports/ports';
import { AlgorithmName, Position, RaceResult, SavedMap, Stats } from '../../domain/models/types';

export class HttpGateways implements RaceGateway, MapGateway, StatsGateway {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  // --- RaceGateway ---
  public async runRace(grid: number[][], start: Position, goal: Position, algorithms?: AlgorithmName[]): Promise<RaceResult> {
    const res = await fetch(`${this.baseUrl}/races`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grid,
        start,
        goal,
        // Only send if not all 4 selected (backend default = all)
        algorithms: algorithms && algorithms.length < 4 ? algorithms : undefined,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || err.title || `Error running race (${res.status})`);
    }

    return await res.json();
  }

  public async getHistory(page: number = 1, pageSize: number = 10): Promise<{ items: RaceResult[]; totalCount: number }> {
    const res = await fetch(`${this.baseUrl}/races?page=${page}&pageSize=${pageSize}`);
    if (!res.ok) throw new Error('Failed to load race history.');
    return await res.json();
  }

  public async getRaceById(id: string): Promise<RaceResult | null> {
    const res = await fetch(`${this.baseUrl}/races/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to load race ${id}`);
    return await res.json();
  }

  public async getReplay(id: string): Promise<RaceResult | null> {
    const res = await fetch(`${this.baseUrl}/races/${id}/replay`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to load replay for race ${id}`);
    return await res.json();
  }

  // --- MapGateway ---
  public async getMaps(): Promise<SavedMap[]> {
    const res = await fetch(`${this.baseUrl}/maps`);
    if (!res.ok) throw new Error('Failed to load saved maps.');
    return await res.json();
  }

  public async saveMap(
    name: string,
    grid: number[][],
    defaultStart?: Position,
    defaultGoal?: Position
  ): Promise<SavedMap> {
    const res = await fetch(`${this.baseUrl}/maps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, grid, defaultStart, defaultGoal }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to save map.');
    }
    return await res.json();
  }

  public async deleteMap(id: string): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/maps/${id}`, { method: 'DELETE' });
    return res.status === 204;
  }

  // --- StatsGateway ---
  public async getStats(): Promise<Stats> {
    const res = await fetch(`${this.baseUrl}/stats`);
    if (!res.ok) throw new Error('Failed to load race statistics.');
    return await res.json();
  }
}
