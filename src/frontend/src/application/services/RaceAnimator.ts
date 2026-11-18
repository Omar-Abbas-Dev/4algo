import { AlgorithmName, AlgorithmResult, Position, RaceResult } from '../../domain/models/types';

export interface CarState {
  algorithm: AlgorithmName;
  currentPosition: Position;
  targetPosition: Position;
  progress: number; // 0 to 1 between current and target
  costSoFar: number;
  exploredCountSoFar: number;
  arrived: boolean;
  arrivalRank: number | null;
}

export interface AnimationFrameState {
  cars: Record<AlgorithmName, CarState>;
  exploredCells: Record<AlgorithmName, Set<string>>; // "row,col"
  activePaths: Record<AlgorithmName, Position[]>;
  isRunning: boolean;
  isCompleted: boolean;
  winner: AlgorithmName | null;
}

export class RaceAnimator {
  private raceResult: RaceResult | null = null;
  private animFrameId: number | null = null;
  private isRunning: boolean = false;
  private speed: number = 2.0; // Speed factor
  private goal: Position = [0, 0];

  // Progress indices per algorithm
  private exploredIndex: Record<AlgorithmName, number> = {
    BFS: 0,
    DFS: 0,
    Greedy: 0,
    'A*': 0,
  };

  private pathIndex: Record<AlgorithmName, number> = {
    BFS: 0,
    DFS: 0,
    Greedy: 0,
    'A*': 0,
  };

  private arrivalRankCounter = 1;
  private listener: ((state: AnimationFrameState) => void) | null = null;

  private state: AnimationFrameState = {
    cars: {
      BFS: this.initCar('BFS', [0, 0]),
      DFS: this.initCar('DFS', [0, 0]),
      Greedy: this.initCar('Greedy', [0, 0]),
      'A*': this.initCar('A*', [0, 0]),
    },
    exploredCells: {
      BFS: new Set(),
      DFS: new Set(),
      Greedy: new Set(),
      'A*': new Set(),
    },
    activePaths: {
      BFS: [],
      DFS: [],
      Greedy: [],
      'A*': [],
    },
    isRunning: false,
    isCompleted: false,
    winner: null,
  };

  private initCar(name: AlgorithmName, start: Position): CarState {
    return {
      algorithm: name,
      currentPosition: [...start],
      targetPosition: [...start],
      progress: 0,
      costSoFar: 0,
      exploredCountSoFar: 0,
      arrived: false,
      arrivalRank: null,
    };
  }

  public setSpeed(speedMultiplier: number): void {
    this.speed = Math.max(0.2, Math.min(20, speedMultiplier));
  }

  public setRace(race: RaceResult): void {
    this.stop();
    this.raceResult = race;
    this.goal = race.goal;
    this.arrivalRankCounter = 1;

    const algos: AlgorithmName[] = ['BFS', 'DFS', 'Greedy', 'A*'];
    algos.forEach((algo) => {
      this.exploredIndex[algo] = 0;
      this.pathIndex[algo] = 0;
      this.state.cars[algo] = this.initCar(algo, race.start);
      this.state.exploredCells[algo] = new Set();
      this.state.activePaths[algo] = [];
    });

    this.state.isRunning = false;
    this.state.isCompleted = false;
    this.state.winner = null;

    this.notify();
  }

  public subscribe(listener: (state: AnimationFrameState) => void): () => void {
    this.listener = listener;
    this.notify();
    return () => {
      this.listener = null;
    };
  }

  public start(): void {
    if (!this.raceResult || this.isRunning) return;
    this.isRunning = true;
    this.state.isRunning = true;

    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      this.update(dt);
      this.notify();

      if (this.isRunning && !this.state.isCompleted) {
        this.animFrameId = requestAnimationFrame(loop);
      }
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public pause(): void {
    this.isRunning = false;
    this.state.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.notify();
  }

  public stop(): void {
    this.pause();
    this.state.isCompleted = false;
    this.notify();
  }

  public reset(start?: Position): void {
    this.pause();
    this.raceResult = null;
    this.arrivalRankCounter = 1;
    const s = start ?? [0, 0];

    const algos: AlgorithmName[] = ['BFS', 'DFS', 'Greedy', 'A*'];
    algos.forEach((algo) => {
      this.exploredIndex[algo] = 0;
      this.pathIndex[algo] = 0;
      this.state.cars[algo] = this.initCar(algo, s);
      this.state.exploredCells[algo] = new Set();
      this.state.activePaths[algo] = [];
    });

    this.state.isRunning = false;
    this.state.isCompleted = false;
    this.state.winner = null;

    this.notify();
  }

  private update(dt: number): void {
    if (!this.raceResult) return;

    let allCompleted = true;
    const stepsToProcess = Math.max(1, Math.floor(dt * 30 * this.speed));

    const algoResults = new Map<AlgorithmName, AlgorithmResult>();
    this.raceResult.results.forEach((r) => algoResults.set(r.algorithm, r));

    (['BFS', 'DFS', 'Greedy', 'A*'] as AlgorithmName[]).forEach((algo) => {
      const res = algoResults.get(algo);
      if (!res) return;

      const car = this.state.cars[algo];
      if (car.arrived) return;

      // 1. Advance exploration
      const expList = res.explored;
      let expIdx = this.exploredIndex[algo];

      for (let s = 0; s < stepsToProcess && expIdx < expList.length; s++) {
        const cell = expList[expIdx];
        this.state.exploredCells[algo].add(`${cell[0]},${cell[1]}`);
        expIdx++;
        car.exploredCountSoFar = expIdx;

      }
      this.exploredIndex[algo] = expIdx;

      // 2. Advance car along path
      if (res.path && res.path.length > 0) {
        allCompleted = false;
        let pIdx = this.pathIndex[algo];

        // Move car along reconstructed path proportionally
        if (pIdx < res.path.length) {
          car.progress += dt * 8 * this.speed;
          if (car.progress >= 1) {
            car.progress = 0;
            pIdx++;
            this.pathIndex[algo] = pIdx;

            if (pIdx < res.path.length) {
              car.currentPosition = res.path[pIdx - 1];
              car.targetPosition = res.path[pIdx];

              // Update cost so far — read from the RACE RESULT grid, not the live canvas
              // (the canvas grid could have been modified between race start and animation)
              const raceGrid = this.raceResult!.grid;
              const cellCost = raceGrid[car.targetPosition[0]]?.[car.targetPosition[1]] ?? 1;
              if (cellCost > 0) {
                car.costSoFar += cellCost;
              }

              // Build active path
              this.state.activePaths[algo] = res.path.slice(0, pIdx + 1);
            } else {
              // Car arrived at goal!
              car.arrived = true;
              car.arrivalRank = this.arrivalRankCounter++;
              car.currentPosition = [...this.goal];
              car.targetPosition = [...this.goal];
              car.costSoFar = res.cost ?? car.costSoFar;

            }
          }
        }
      } else {
        // No path exists for this algorithm
        if (expIdx >= expList.length) {
          car.arrived = true;
        }
      }

      if (!car.arrived) {
        allCompleted = false;
      }
    });

    if (allCompleted) {
      this.isRunning = false;
      this.state.isRunning = false;
      this.state.isCompleted = true;
      this.state.winner = this.raceResult.winner;

    }
  }

  private notify(): void {
    if (this.listener) {
      this.listener({ ...this.state });
    }
  }
}
