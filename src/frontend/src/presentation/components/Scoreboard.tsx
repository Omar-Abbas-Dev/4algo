import React from 'react';
import { Award, Fuel, LocateFixed, Trophy } from 'lucide-react';
import { ALGORITHMS, AlgorithmName } from '../../domain/models/types';
import { CarState } from '../../application/services/RaceAnimator';

interface Props {
  cars: Record<AlgorithmName, CarState>;
  winner: AlgorithmName | null;
  isCompleted: boolean;
  timeResults?: Record<AlgorithmName, number>;
  finalCosts?: Record<AlgorithmName, number | null>;
  activeAlgos?: Set<AlgorithmName>;
}

const ALGO_LIST: AlgorithmName[] = ['BFS', 'DFS', 'Greedy', 'A*'];
export const Scoreboard: React.FC<Props> = ({ cars, winner, isCompleted, timeResults, finalCosts, activeAlgos }) => {
  const racers = activeAlgos?.size ? ALGO_LIST.filter((algo) => activeAlgos.has(algo)) : ALGO_LIST;
  const rankScore = (algo: AlgorithmName) => {
    if (!finalCosts || !timeResults || finalCosts[algo] === null) return null;
    const costs = racers.map((item) => finalCosts[item]).filter((cost): cost is number => cost !== null);
    const times = racers.map((item) => timeResults[item]);
    const minCost = Math.min(...costs), maxCost = Math.max(...costs);
    const minTime = Math.min(...times), maxTime = Math.max(...times);
    return .6 * ((finalCosts[algo]! - minCost) / (maxCost - minCost || 1))
      + .4 * ((timeResults[algo] - minTime) / (maxTime - minTime || 1));
  };
  const ranked = isCompleted && finalCosts && timeResults
    ? [...racers].sort((a, b) => {
        if (a === winner) return -1;
        if (b === winner) return 1;
        const left = rankScore(a), right = rankScore(b);
        return left === null ? 1 : right === null ? -1 : left - right;
      })
    : [...racers].sort((a, b) => cars[a].costSoFar - cars[b].costSoFar || cars[a].exploredCountSoFar - cars[b].exploredCountSoFar);
  const maxFuel = Math.max(1, ...racers.map((algo) => cars[algo].costSoFar));
  const maxNodes = Math.max(1, ...racers.map((algo) => cars[algo].exploredCountSoFar));
  const scorecards = ranked.map((algo, index) => {
    const car = cars[algo];
    const fuel = isCompleted && finalCosts ? (finalCosts[algo] ?? car.costSoFar) : car.costSoFar;
    return {
      algo,
      color: ALGORITHMS[algo].color,
      car,
      fuel,
      fuelWidth: Math.min(100, (car.costSoFar / maxFuel) * 100),
      nodeWidth: Math.min(100, (car.exploredCountSoFar / maxNodes) * 100),
      place: isCompleted ? index + 1 : car.arrivalRank ?? index + 1,
      score: isCompleted ? rankScore(algo) : null,
      isMoving: car.exploredCountSoFar > 0 || car.costSoFar > 0 || car.arrived,
      isWinner: isCompleted && winner === algo,
      noPath: isCompleted && !!finalCosts && finalCosts[algo] === null,
    };
  });

  return (
    <section className="race-board game-panel" aria-label="Race standings">
      <div className="race-board-heading">
        <div className="game-kicker"><Trophy size={14} /> RACE BOARD</div>
        <div className="race-board-guide">Low score wins · Fuel 60% · Search time 40%</div>
        <div className={`race-state ${isCompleted ? 'finished' : racers.some((algo) => cars[algo].exploredCountSoFar) ? 'live' : ''}`}>
          {isCompleted ? winner ? <><Award size={13} /> {winner} TAKES THE WIN</> : 'NO FINISHER' : racers.some((algo) => cars[algo].exploredCountSoFar) ? 'ON THE TRACK' : 'READY TO RACE'}
        </div>
      </div>
      <div className="race-board-grid" style={{ '--racer-count': racers.length } as React.CSSProperties}>
        {scorecards.map(({ algo, color, car, fuel, fuelWidth, place, score, isWinner, noPath, isMoving }) => (
          <article key={algo} className={`racer-score-card ${isWinner ? 'winner' : ''} ${noPath ? 'no-path' : ''}`} style={{ '--racer-color': color } as React.CSSProperties}>
            <div className="racer-score-title">
              <span className="racer-rank">{place}</span>
              <span className="racer-score-name">{algo}</span>
              {isWinner && <span className="winner-tag">WINNER</span>}
              {noPath && <span className="no-path-tag">DNF</span>}
            </div>
            <div className="racer-score-bar"><span style={{ width: `${Math.max(4, fuelWidth)}%` }} /></div>
            <div className="racer-score-metrics">
              <span><Fuel size={19} /><b>{fuel}</b><small>FUEL</small></span>
              <span><LocateFixed size={19} /><b>{car.exploredCountSoFar}</b><small>BLOCKS</small></span>
            </div>
            <div className="racer-card-foot">
              <span>{noPath ? 'DID NOT FINISH' : score === null ? isMoving ? 'ON TRACK' : 'READY' : `SCORE ${score.toFixed(2)}`}</span>
              <b className={place === 1 ? 'first-place' : undefined}>{place === 1 && <Trophy size={14} aria-label="First place" />}PLACE {place}</b>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
