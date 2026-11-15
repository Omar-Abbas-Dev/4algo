import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
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
import { Header } from '../components/Header';
import { GridCanvas } from '../components/GridCanvas';
import { Toolbox } from '../components/Toolbox';
import { Scoreboard } from '../components/Scoreboard';
import { RaceControls } from '../components/RaceControls';
import { SonificationLegend } from '../components/SonificationLegend';
import { HistoryModal } from '../components/HistoryModal';
import { StatsModal } from '../components/StatsModal';
import { SaveMapModal } from '../components/SaveMapModal';

export const ArenaPage: React.FC = () => {
  const { raceGateway, soundPlayer, raceAnimator } = useContainer();

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
  const [isMuted, setIsMuted] = useState(false);
  const [selectedAlgos, setSelectedAlgos] = useState<Set<AlgorithmName>>(
    () => new Set<AlgorithmName>(['BFS', 'DFS', 'Greedy', 'A*'])
  );

  // Modals
  const [legendOpen, setLegendOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [totalRaceCount, setTotalRaceCount] = useState(0);

  // Subscribe to animator
  useEffect(() => {
    const unsubscribe = raceAnimator.subscribe((state) => {
      setAnimState(state);
      if (state.isCompleted && state.winner) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
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
        soundPlayer.playEvent('start_placed');
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
        soundPlayer.playEvent('goal_placed');
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

      // Play sound per painted cell type
      if (nextVal === CellType.Open) soundPlayer.playEvent('click');
      else if (nextVal === CellType.Traffic) soundPlayer.playEvent('traffic');
      else if (nextVal === CellType.Blocked) soundPlayer.playEvent('thud');
    },
    [animState.isRunning, animState.isCompleted, start, goal, grid, soundPlayer, raceAnimator]
  );

  // Start race
  const handleStartRace = async () => {
    setIsLoading(true);
    await soundPlayer.unlockAudio();
    soundPlayer.playEvent('countdown_go');

    try {
      const res = await raceGateway.runRace(grid, start, goal, [...selectedAlgos]);
      setLastResult(res);
      setTotalRaceCount((n) => n + 1);
      raceAnimator.setRace(res);
      raceAnimator.setSpeed(speed);
      raceAnimator.start();
      setIsPaused(false);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to run race.');
      soundPlayer.playEvent('nopath');
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

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundPlayer.setMuted(nextMuted);
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
    soundPlayer.playEvent('click');
  };

  const handleClearGrid = () => {
    setGrid(createDefaultGrid(grid.length, grid[0].length));
    setLastResult(null);
    setIsPaused(false);
    raceAnimator.reset(start);
    soundPlayer.playEvent('thud');
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

  const handleLoadReplay = (replay: RaceResult) => {
    setGrid(replay.grid.map((r) => [...r]));
    setStart(replay.start);
    setGoal(replay.goal);
    setLastResult(replay);
    raceAnimator.setRace(replay);
    raceAnimator.start();
    setIsPaused(false);
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
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col font-sans grid-bg overflow-hidden">
      {/* Ambient radial glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-32 left-1/4 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl animate-float" />
        <div className="absolute top-1/2 -right-24 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl"
          style={{ animation: 'navx-float 4s ease-in-out 1s infinite' }} />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-purple-500/4 blur-3xl"
          style={{ animation: 'navx-float 5s ease-in-out 2s infinite' }} />
      </div>

      <Header
        onOpenLegend={() => setLegendOpen(true)}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenStats={() => setStatsOpen(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        raceCount={totalRaceCount}
      />

      <main className="flex-1 min-h-0 max-w-[1720px] w-full mx-auto px-2 sm:px-3 py-2 flex flex-col gap-2 overflow-hidden">
        {/* Top Stage: Canvas + Controls on Left, Toolbox on Right */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-2.5 items-stretch overflow-hidden">
          {/* Main Visual Arena Canvas & Race Controls */}
          <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
            <GridCanvas
              grid={grid}
              start={start}
              goal={goal}
              cars={animState.cars}
              exploredCells={animState.exploredCells}
              activePaths={animState.activePaths}
              currentTool={currentTool}
              onCellPaint={handleCellPaint}
              isRacing={animState.isRunning}
            />

            <RaceControls
              isRacing={animState.isRunning}
              isPaused={isPaused}
              isCompleted={animState.isCompleted}
              fromCache={lastResult?.fromCache}
              speed={speed}
              selectedAlgos={selectedAlgos}
              onSelectAlgos={setSelectedAlgos}
              onStartRace={handleStartRace}
              onPauseResume={handlePauseResume}
              onReset={handleReset}
              onChangeSpeed={handleSpeedChange}
              isLoading={isLoading}
            />
          </div>

          {/* Map Painter Toolbox Sidebar */}
          <div className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col min-h-0">
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
        </div>

        {/* Live Scoreboard Telemetry HUD */}
        <div className="shrink-0">
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
      <SonificationLegend isOpen={legendOpen} onClose={() => setLegendOpen(false)} />
      <HistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onLoadReplay={handleLoadReplay}
      />
      <StatsModal isOpen={statsOpen} onClose={() => setStatsOpen(false)} />
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
