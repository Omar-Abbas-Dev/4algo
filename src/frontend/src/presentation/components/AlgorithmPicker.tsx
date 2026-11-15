import React from 'react';
import { Zap } from 'lucide-react';
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
      // Keep at least 2 selected
      if (next.size <= 2) return;
      next.delete(algo);
    } else {
      next.add(algo);
    }
    onChange(next);
  };

  const selectAll = () => {
    if (disabled) return;
    onChange(new Set(ALGO_LIST));
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Label */}
      <span className="flex items-center gap-1 text-[10px] font-mono text-slate-500 shrink-0">
        <Zap className="w-3 h-3" />
        Racers
      </span>

      {/* Algorithm toggle pills */}
      <div className="flex items-center gap-1">
        {ALGO_LIST.map((algo) => {
          const cfg = ALGORITHMS[algo];
          const active = selected.has(algo);
          return (
            <button
              key={algo}
              onClick={() => toggle(algo)}
              disabled={disabled}
              title={active ? `Remove ${algo} from race` : `Add ${algo} to race`}
              className={`relative flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black
                border transition-all duration-200 cursor-pointer select-none
                disabled:cursor-not-allowed disabled:opacity-50
                ${active
                  ? 'text-white border-transparent shadow-sm'
                  : 'text-slate-500 border-white/[0.08] bg-white/[0.03] hover:text-slate-300 hover:bg-white/[0.07]'
                }`}
              style={active ? {
                backgroundColor: `${cfg.color}25`,
                borderColor: `${cfg.color}60`,
                boxShadow: `0 0 8px ${cfg.color}30`,
              } : undefined}
            >
              {/* Color dot */}
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: active ? cfg.color : '#475569' }}
              />
              {algo}
              {/* Strikethrough overlay when inactive */}
              {!active && (
                <span
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  aria-hidden
                >
                  <span className="w-full h-px bg-slate-600 rotate-[-15deg] opacity-60" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Select All shortcut */}
      {selected.size < 4 && (
        <button
          onClick={selectAll}
          disabled={disabled}
          className="text-[9px] font-mono text-slate-600 hover:text-slate-400
            underline underline-offset-2 transition-colors cursor-pointer
            disabled:cursor-not-allowed disabled:opacity-40"
        >
          all
        </button>
      )}

      {/* Count badge */}
      <span className="text-[9px] font-mono text-slate-600 ml-0.5">
        {selected.size}/4
      </span>
    </div>
  );
};
