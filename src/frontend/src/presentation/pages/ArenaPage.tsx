import React, { useState, useEffect, useCallback } from 'react';
import { useContainer } from '../../app/container';
import {
  AlgorithmName,
  CellType,
  PaintTool,
  Position,
  RaceResult,
  SavedMap,
} from '../../domain/models/types';
import { createDefaultGrid, generateRandomMap, PRESET_MAPS, MapPreset } from '../../domain/rules/presetMaps';
import { AnimationFrameState } from '../../application/services/RaceAnimator';
import { GridCanvas } from '../components/GridCanvas';
import { Toolbox } from '../components/Toolbox';
import { Scoreboard } from '../components/Scoreboard';
import { RaceControls } from '../components/RaceControls';
import { SaveMapModal } from '../components/SaveMapModal';

export const ArenaPage: React.FC = () => {
  const { raceGateway, raceAnimator } = useContainer();

  // Grid state
  const defaultPreset = PRESET_MAPS[0];
  const [grid, setGrid] = useState<number[][]>(() => defaultPreset.grid.map((r) => [...r]));
  const [start, setStart] = useState<Position>(defaultPreset.start);
  const [goal, setGoal] = useState<Position>(defaultPreset.goal);
  const [currentTool, setCurrentTool] = useState<PaintTool>('blocked');

  // Animation frame state from RaceAnimator
  const [animState, setAnimState] = useState<AnimationFrameState>(() => ({
    cars: {
      BFS: { algorithm: 'BFS', currentPosition: defaultPreset.start, targetPosition: defaultPreset.start, progress: 0, costSoFar: 0, exploredCountSoFar: 0, arrived: false, arrivalRank: null },
      DFS: { algorithm: 'DFS', currentPosition: defaultPreset.start, targetPosition: defaultPreset.start, progress: 0, costSoFar: 0, exploredCountSoFar: 0, arrived: false, arrivalRank: null },
      Greedy: { algorithm: 'Greedy', currentPosition: defaultPreset.start, targetPosition: defaultPreset.start, progress: 0, costSoFar: 0, exploredCountSoFar: 0, arrived: false, arrivalRank: null },
      'A*': { algorithm: 'A*', currentPosition: defaultPreset.start, targetPosition: defaultPreset.start, progress: 0, costSoFar: 0, exploredCountSoFar: 0, arrived: false, arrivalRank: null },
    },
    exploredCells: { BFS: new Set(), DFS: new Set(), Greedy: new Set(), 'A*': new Set() },
    activePaths: { BFS: [], DFS: [], Greedy: [], 'A*': [] },
    isRunning: false,
    isCompleted: false,
    winner: null,
  }));

  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(2.0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<RaceResult | null>(null);
  const [selectedAlgos, setSelectedAlgos] = useState<Set<AlgorithmName>>(
    () => new Set<AlgorithmName>(['BFS', 'DFS', 'Greedy', 'A*'])
  );

  // Modals
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  // Subscribe to animator
  useEffect(() => {
    const unsubscribe = raceAnimator.subscribe((state) => {
      setAnimState(state);
    });
    return () => unsubscribe();
  }, [raceAnimator]);

  // Handle cell paint
  const handleCellPaint = useCallback(
    (row: number, col: number, tool: PaintTool) => {
      if (animState.isRunning) return;

      if (animState.isCompleted) {
        setLastResult(null);
        raceAnimator.reset(start);
      }

      if (tool === 'start') {
        if (row === goal[0] && col === goal[1]) return;
        const newStart: Position = [row, col];
        setStart(newStart);
        if (grid[row][col] === CellType.Blocked) {
          const next = grid.map((r) => [...r]);
          next[row][col] = CellType.Open;
          setGrid(next);
        }
        raceAnimator.reset(newStart);
        setLastResult(null);
        return;
      }

      if (tool === 'goal') {
        if (row === start[0] && col === start[1]) return;
        setGoal([row, col]);
        if (grid[row][col] === CellType.Blocked) {
          const next = grid.map((r) => [...r]);
          next[row][col] = CellType.Open;
          setGrid(next);
        }
        raceAnimator.reset(start);
        setLastResult(null);
        return;
      }

      // If painting on start or goal, ignore
      if ((row === start[0] && col === start[1]) || (row === goal[0] && col === goal[1])) {
        return;
      }

      const nextVal =
        tool === 'open'
          ? CellType.Open
          : tool === 'traffic'
            ? CellType.Traffic
            : CellType.Blocked;

      if (grid[row][col] === nextVal) return;

      const next = grid.map((r) => [...r]);
      next[row][col] = nextVal;
      setGrid(next);

    },
    [animState.isRunning, animState.isCompleted, start, goal, grid, raceAnimator]
  );

  // Start race
  const handleStartRace = async () => {
    setIsLoading(true);
    try {
      const res = await raceGateway.runRace(grid, start, goal, [...selectedAlgos]);
      setLastResult(res);
      raceAnimator.setRace(res);
      raceAnimator.setSpeed(speed);
      raceAnimator.start();
      setIsPaused(false);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to run race.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePauseResume = () => {
    if (isPaused) {
      raceAnimator.start();
      setIsPaused(false);
    } else {
      raceAnimator.pause();
      setIsPaused(true);
    }
  };

  const handleReset = () => {
    setIsPaused(false);
    if (lastResult) {
      raceAnimator.setRace(lastResult);
    } else {
      raceAnimator.reset(start);
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    raceAnimator.setSpeed(newSpeed);
  };

  const handleSelectPreset = (preset: MapPreset) => {
    setGrid(preset.grid.map((r) => [...r]));
    setStart([...preset.start]);
    setGoal([...preset.goal]);
    setLastResult(null);
    setIsPaused(false);
    raceAnimator.reset(preset.start);
  };

  const handleGenerateRandom = () => {
    const newGrid = generateRandomMap(grid.length, grid[0].length, 0.22, 0.15, start, goal);
    setGrid(newGrid);
    setLastResult(null);
    setIsPaused(false);
    raceAnimator.reset(start);
  };

  const handleClearGrid = () => {
    setGrid(createDefaultGrid(grid.length, grid[0].length));
    setLastResult(null);
    setIsPaused(false);
    raceAnimator.reset(start);
  };

  const handleLoadMap = (saved: SavedMap) => {
    const nextStart = saved.defaultStart ? ([...saved.defaultStart] as Position) : start;
    const nextGoal = saved.defaultGoal ? ([...saved.defaultGoal] as Position) : goal;
    setGrid(saved.grid.map((r) => [...r]));
    if (saved.defaultStart) setStart(nextStart);
    if (saved.defaultGoal) setGoal(nextGoal);
    setLastResult(null);
    setIsPaused(false);
    raceAnimator.reset(nextStart);
  };

  const timeResults: Record<AlgorithmName, number> = {
    BFS: lastResult?.results.find((r) => r.algorithm === 'BFS')?.timeMs ?? 0,
    DFS: lastResult?.results.find((r) => r.algorithm === 'DFS')?.timeMs ?? 0,
    Greedy: lastResult?.results.find((r) => r.algorithm === 'Greedy')?.timeMs ?? 0,
    'A*': lastResult?.results.find((r) => r.algorithm === 'A*')?.timeMs ?? 0,
  };

  // Final settled costs from backend (authoritative for post-race composite scoring)
  const finalCosts: Record<AlgorithmName, number | null> = {
    BFS: lastResult?.results.find((r) => r.algorithm === 'BFS')?.cost ?? null,
    DFS: lastResult?.results.find((r) => r.algorithm === 'DFS')?.cost ?? null,
    Greedy: lastResult?.results.find((r) => r.algorithm === 'Greedy')?.cost ?? null,
    'A*': lastResult?.results.find((r) => r.algorithm === 'A*')?.cost ?? null,
  };

  return (
    <div className="arena-game">
      <main className="game-main">
        <section className="gameplay-section" aria-label="City race arena">
          <div className="game-arena">
            <GridCanvas
              grid={grid}
              start={start}
              goal={goal}
              cars={animState.cars}
              activePaths={animState.activePaths}
              currentTool={currentTool}
              onCellPaint={handleCellPaint}
              isRacing={animState.isRunning}
            />
          </div>
          <RaceControls
            isRacing={animState.isRunning}
            isPaused={isPaused}
            isCompleted={animState.isCompleted}
            speed={speed}
            selectedAlgos={selectedAlgos}
            onSelectAlgos={setSelectedAlgos}
            onStartRace={handleStartRace}
            onPauseResume={handlePauseResume}
            onReset={handleReset}
            onChangeSpeed={handleSpeedChange}
            isLoading={isLoading}
          />
        </section>

        <div className="game-lower-panels">
          <div className="game-track-column">
            <Toolbox
              currentTool={currentTool}
              onSelectTool={setCurrentTool}
              onSelectPreset={handleSelectPreset}
              onGenerateRandom={handleGenerateRandom}
              onClearGrid={handleClearGrid}
              onOpenSaveModal={() => setSaveModalOpen(true)}
              isRacing={animState.isRunning}
            />
          </div>

          <Scoreboard
            cars={animState.cars}
            winner={animState.winner}
            isCompleted={animState.isCompleted}
            timeResults={lastResult ? timeResults : undefined}
            finalCosts={lastResult ? finalCosts : undefined}
            activeAlgos={selectedAlgos}
          />
        </div>
      </main>

      {/* Modals */}
      <SaveMapModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        currentGrid={grid}
        currentStart={start}
        currentGoal={goal}
        onLoadMap={handleLoadMap}
      />
    </div>
  );
};
