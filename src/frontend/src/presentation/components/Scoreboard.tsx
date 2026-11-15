import React, { useEffect, useRef } from 'react';
import { Trophy, Fuel, Compass, Clock, Award } from 'lucide-react';
import { ALGORITHMS, AlgorithmName } from '../../domain/models/types';
import { CarState } from '../../application/services/RaceAnimator';

interface Props {
  cars: Record<AlgorithmName, CarState>;
  winner: AlgorithmName | null;
  isCompleted: boolean;
  timeResults?: Record<AlgorithmName, number>;
  /** Authoritative final costs from backend results (null = no path found) */
  finalCosts?: Record<AlgorithmName, number | null>;
  /** Which algorithms are participating in the current race */
  activeAlgos?: Set<AlgorithmName>;
}

const ALGO_LIST: AlgorithmName[] = ['BFS', 'DFS', 'Greedy', 'A*'];

const RANK_MEDALS = ['🥇', '🥈', '🥉', '4th'];

const algoCardClass: Record<AlgorithmName, string> = {
  BFS: 'algo-card-bfs',
  DFS: 'algo-card-dfs',
  Greedy: 'algo-card-greedy',
  'A*': 'algo-card-astar',
};

/* Animated number counter */
const AnimatedNumber: React.FC<{ value: number; className?: string }> = ({ value, className }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (value === prev.current) return;
    el.style.transform = 'translateY(-6px)';
    el.style.opacity = '0';
    const raf = requestAnimationFrame(() => {
      el.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
      el.style.transform = 'translateY(0)';
      el.style.opacity = '1';
    });
    prev.current = value;
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span ref={ref} className={className}>{value}</span>;
};

export const Scoreboard: React.FC<Props> = ({ cars, winner, isCompleted, timeResults, finalCosts, activeAlgos }) => {
  // Only show algorithms that are active (selected by user), or all if none specified
  const ACTIVE_LIST = activeAlgos && activeAlgos.size > 0
    ? ALGO_LIST.filter(a => activeAlgos.has(a))
    : ALGO_LIST;
  // --- Post-race composite scoring using AUTHORITATIVE backend costs ---
  // Formula (range-normalised, lower = better):
  //   Score = 0.6 × (cost − minCost)/(maxCost − minCost)
  //         + 0.4 × (time − minTime)/(maxTime − minTime)
  //
  // Range normalisation ensures cost differences are fully preserved even
  // when values are close — prevents time from dominating on flat-cost maps.
  const compositeScore = (algo: AlgorithmName): number | null => {
    if (!finalCosts || !timeResults) return null;
    const cost = finalCosts[algo];
    if (cost === null) return null; // no path found

    const validCosts = ACTIVE_LIST.map(a => finalCosts[a]).filter((c): c is number => c !== null);
    const validTimes = ACTIVE_LIST.map(a => timeResults[a]);

    const maxCost = Math.max(...validCosts);
    const minCost = Math.min(...validCosts);
    const maxTime = Math.max(...validTimes);
    const minTime = Math.min(...validTimes);

    const costRange = maxCost - minCost > 0 ? maxCost - minCost : 1;
    const timeRange = maxTime - minTime > 0 ? maxTime - minTime : 1;

    return 0.6 * ((cost - minCost) / costRange)
         + 0.4 * ((timeResults[algo] - minTime) / timeRange);
  };

  // --- Ranking ---
  const ranked = (() => {
    if (isCompleted && finalCosts && timeResults) {
      const others = ACTIVE_LIST.filter(a => a !== winner);
      const sorted = others.sort((a, b) => {
        const sa = compositeScore(a);
        const sb = compositeScore(b);
        if (sa === null && sb === null) return 0;
        if (sa === null) return 1;
        if (sb === null) return -1;
        return sa - sb;
      });
      return winner && ACTIVE_LIST.includes(winner) ? [winner, ...sorted] : sorted;
    }
    return [...ACTIVE_LIST].sort((a, b) => {
      const ca = cars[a].costSoFar;
      const cb = cars[b].costSoFar;
      if (ca !== cb) return ca - cb;
      return cars[a].exploredCountSoFar - cars[b].exploredCountSoFar;
    });
  })();

  const maxCostBar = Math.max(...ACTIVE_LIST.map((a) => cars[a].costSoFar), 1);
  const maxExplored = Math.max(...ACTIVE_LIST.map((a) => cars[a].exploredCountSoFar), 1);

  // Winner composite score for header pill
  const winnerScore = winner ? compositeScore(winner) : null;

  return (
    <div className="glass border border-white/[0.07] rounded-xl overflow-hidden shadow-xl shadow-black/40">
      {/* Header bar with inline winner announcement */}
      <div className="px-3.5 py-1.5 border-b border-white/[0.05] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-amber-500/10 border border-amber-500/20">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Live Race Telemetry
              </span>
              <span className="hidden sm:inline text-[9.5px] font-mono text-slate-500">
                (60% Fuel + 40% Time)
              </span>
            </div>
          </div>
        </div>

        {/* Center / Right: Winner highlight OR Live indicator */}
        <div className="flex items-center gap-2">
          {isCompleted && winner && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full
              border border-amber-500/30 bg-gradient-to-r from-amber-950/60 via-emerald-950/40 to-indigo-950/60
              text-[11px] animate-winner shadow-sm shadow-amber-500/20">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] uppercase font-bold text-amber-400/90 tracking-wider">Winner:</span>
              <span
                className="font-black text-xs"
                style={{ color: ALGORITHMS[winner].color }}
              >
                {winner}
              </span>
              <span className="text-[10px] text-slate-300 font-mono">
                {finalCosts ? (finalCosts[winner] ?? '—') : cars[winner].costSoFar} fuel
                {timeResults && ` · ${timeResults[winner].toFixed(1)} ms`}
                {winnerScore !== null && ` · Score ${winnerScore.toFixed(2)}`}
              </span>
            </div>
          )}

          {isCompleted && !winner && (
            <span className="text-[10px] text-rose-400 font-mono px-2 py-0.5 rounded-md bg-rose-950/30 border border-rose-800/30">
              No path found
            </span>
          )}

          {!isCompleted && ALGO_LIST.some((a) => cars[a].exploredCountSoFar > 0) && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono animate-tick">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          )}
        </div>
      </div>

      {/* Algorithm Cards — column count adapts to number of active algos */}
      <div className={`p-2 grid gap-2 ${
        ranked.length <= 2 ? 'grid-cols-2' :
        ranked.length === 3 ? 'grid-cols-3' :
        'grid-cols-2 lg:grid-cols-4'
      }`}>
        {ranked.map((algo, rankIdx) => {
          const cfg = ALGORITHMS[algo];
          const car = cars[algo];
          const isWinner = isCompleted && winner === algo;
          const timeMs = timeResults?.[algo];
          // Display cost: use final backend cost post-race, animated value during race
          const displayCost = (isCompleted && finalCosts)
            ? (finalCosts[algo] ?? car.costSoFar)
            : car.costSoFar;
          const score = compositeScore(algo);
          const noPath = isCompleted && finalCosts && finalCosts[algo] === null;

          const costPct = maxCostBar > 0 ? (car.costSoFar / maxCostBar) * 100 : 0;
          const explPct = maxExplored > 0 ? (car.exploredCountSoFar / maxExplored) * 100 : 0;

          const medal = isCompleted
            ? RANK_MEDALS[rankIdx] ?? `${rankIdx + 1}th`
            : car.arrivalRank
              ? RANK_MEDALS[(car.arrivalRank - 1)] ?? `${car.arrivalRank}th`
              : null;

          return (
            <div
              key={algo}
              className={`group relative px-2.5 py-1.5 rounded-lg border transition-all duration-200 cursor-default
                ${algoCardClass[algo]}
                ${isWinner
                  ? 'border-emerald-500/60 bg-emerald-950/25 shadow-md shadow-emerald-500/15'
                  : noPath
                    ? 'border-rose-900/40 bg-rose-950/10 opacity-60'
                    : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
            >
              {/* Row 1: Algo name, medal, waveform */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: cfg.color,
                      boxShadow: `0 0 6px ${cfg.color}80`,
                    }}
                  />
                  <span
                    className="font-black text-sm text-white tracking-wide"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                  >
                    {algo}
                  </span>
                  {isWinner && (
                    <span className="text-[8px] font-black uppercase px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      1st
                    </span>
                  )}
                  {noPath && (
                    <span className="text-[8px] font-black uppercase px-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      NO PATH
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[8.5px] font-mono px-1 py-0.5 rounded bg-white/[0.04] text-slate-500 border border-white/[0.05] uppercase">
                    {cfg.waveform}
                  </span>
                  {medal && (
                    <span className="text-sm leading-none">
                      {medal}
                    </span>
                  )}
                </div>
              </div>

              {/* Row 2: Metrics (Fuel & Explored) in 2 columns */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {/* Fuel */}
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] text-slate-500 flex items-center gap-0.5 font-mono uppercase">
                      <Fuel className="w-2.5 h-2.5 text-amber-400" /> Fuel
                    </span>
                    <AnimatedNumber
                      value={displayCost}
                      className={`font-mono text-xs font-bold ${isWinner ? 'text-emerald-400' : 'text-slate-200'}`}
                    />
                  </div>
                  <div className="h-1 bg-black/40 rounded-full overflow-hidden border border-white/[0.05]">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.max(2, costPct)}%`,
                        backgroundColor: cfg.color,
                        boxShadow: `0 0 4px ${cfg.color}80`,
                      }}
                    />
                  </div>
                </div>

                {/* Explored */}
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] text-slate-500 flex items-center gap-0.5 font-mono uppercase">
                      <Compass className="w-2.5 h-2.5 text-blue-400" /> Nodes
                    </span>
                    <AnimatedNumber
                      value={car.exploredCountSoFar}
                      className="font-mono text-xs text-slate-300"
                    />
                  </div>
                  <div className="h-1 bg-black/40 rounded-full overflow-hidden border border-white/[0.05]">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.max(2, explPct)}%`,
                        backgroundColor: `${cfg.color}80`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Time & Composite Score */}
              <div className="mt-1.5 pt-1 border-t border-white/[0.04] flex items-center justify-between text-[9px] font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 text-purple-400" />
                  {timeMs !== undefined ? `${timeMs.toFixed(1)} ms` : '—'}
                </span>
                {score !== null ? (
                  <span className={`font-semibold ${isWinner ? 'text-amber-300' : 'text-slate-400'}`}>
                    Score: {score.toFixed(2)}
                  </span>
                ) : noPath ? (
                  <span className="text-rose-500/70">DNF</span>
                ) : (
                  <span className="text-slate-600">
                    Rank #{rankIdx + 1}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
