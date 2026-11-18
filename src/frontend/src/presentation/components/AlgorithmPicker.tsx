import React from 'react';
import { CarFront } from 'lucide-react';
import { ALGORITHMS, AlgorithmName } from '../../domain/models/types';

const ALGO_LIST: AlgorithmName[] = ['BFS', 'DFS', 'Greedy', 'A*'];

interface Props {
  selected: Set<AlgorithmName>;
  onChange: (selected: Set<AlgorithmName>) => void;
  disabled?: boolean;
}

export const AlgorithmPicker: React.FC<Props> = ({ selected, onChange, disabled }) => {
  const toggle = (algo: AlgorithmName) => {
    if (disabled) return;
    const next = new Set(selected);
    if (next.has(algo)) {
      if (next.size <= 2) return;
      next.delete(algo);
    } else next.add(algo);
    onChange(next);
  };

  return (
    <div className="racer-picker" aria-label="Choose racers">
      {ALGO_LIST.map((algo) => {
        const cfg = ALGORITHMS[algo];
        const active = selected.has(algo);
        return (
          <button
            key={algo}
            onClick={() => toggle(algo)}
            disabled={disabled}
            aria-pressed={active}
            title={active ? `Remove ${algo} from the race` : `Add ${algo} to the race`}
            className={`racer-chip ${active ? 'selected' : ''}`}
            style={{ '--racer-color': cfg.color } as React.CSSProperties}
          >
            <CarFront className="racer-car-icon" size={12} />{algo}
          </button>
        );
      })}
    </div>
  );
};
