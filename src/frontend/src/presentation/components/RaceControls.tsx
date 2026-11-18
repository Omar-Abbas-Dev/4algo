import React from 'react';
import { Play, Pause, RotateCcw, FastForward } from 'lucide-react';
import { AlgorithmName } from '../../domain/models/types';
import { AlgorithmPicker } from './AlgorithmPicker';

interface Props {
  isRacing: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  speed: number;
  selectedAlgos: Set<AlgorithmName>;
  onSelectAlgos: (selected: Set<AlgorithmName>) => void;
  onStartRace: () => void;
  onPauseResume: () => void;
  onReset: () => void;
  onChangeSpeed: (speed: number) => void;
  isLoading: boolean;
}

const SPEEDS = [0.5, 1, 2, 5, 10] as const;

export const RaceControls: React.FC<Props> = ({
  isRacing, isPaused, isCompleted, speed,
  selectedAlgos, onSelectAlgos,
  onStartRace, onPauseResume, onReset, onChangeSpeed, isLoading,
}) => (
  <section className="race-console game-panel" aria-label="Race controls">
    <div className="race-console-main">
      <div className="race-action-group">
        {!isRacing && !isCompleted ? (
          <button onClick={onStartRace} disabled={isLoading || selectedAlgos.size < 2} className="race-start-button" aria-label="Start race" title="Start race">
            {isLoading ? <span className="game-spinner" /> : <Play size={20} fill="currentColor" />}
            <span>{isLoading ? 'READY' : 'PLAY'}</span>
          </button>
        ) : (
          <button onClick={onPauseResume} className={`race-start-button ${isPaused ? 'resume' : 'pause'}`} aria-label={isPaused ? 'Resume race' : 'Pause race'} title={isPaused ? 'Resume race' : 'Pause race'}>
            {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
            <span>{isPaused ? 'PLAY' : 'PAUSE'}</span>
          </button>
        )}
        <button onClick={onReset} disabled={!isRacing && !isCompleted} aria-hidden={!isRacing && !isCompleted} className={`race-action-button reset ${!isRacing && !isCompleted ? 'reserved' : ''}`}><RotateCcw size={14} /> RESET</button>
      </div>

      <div className="race-console-racers">
        <span className="game-kicker">RACERS <b>{selectedAlgos.size}/4</b></span>
        <AlgorithmPicker selected={selectedAlgos} onChange={onSelectAlgos} disabled={isRacing && !isPaused} />
      </div>

      <div className="race-speed-control">
        <span className="game-kicker"><FastForward size={13} /> PACE</span>
        <div className="race-speed-options" aria-label="Race speed">
          {SPEEDS.map((value) => (
            <button key={value} onClick={() => onChangeSpeed(value)} aria-pressed={speed === value} className={speed === value ? 'active' : ''}>
              {value === 0.5 ? '½×' : `${value}×`}
            </button>
          ))}
        </div>
      </div>
    </div>
  </section>
);
