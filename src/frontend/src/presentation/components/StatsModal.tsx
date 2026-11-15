import React, { useEffect, useState } from 'react';
import { BarChart3, X, Award, Hash, TrendingUp, Info } from 'lucide-react';
import { useContainer } from '../../app/container';
import { Stats, ALGORITHMS, AlgorithmName } from '../../domain/models/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ALGO_LIST: AlgorithmName[] = ['BFS', 'DFS', 'Greedy', 'A*'];

export const StatsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { statsGateway } = useContainer();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      statsGateway
        .getStats()
        .then((s) => setStats(s))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, statsGateway]);

  if (!isOpen) return null;

  /* Sort by win count descending */
  const sortedAlgos = stats
    ? [...ALGO_LIST].sort((a, b) => (stats.wins[b] || 0) - (stats.wins[a] || 0))
    : ALGO_LIST;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-enter"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="glass-bright rounded-2xl max-w-2xl w-full shadow-2xl shadow-black/70
        max-h-[90vh] flex flex-col modal-panel-enter border border-white/[0.1]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 glow-purple">
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Algorithm Statistics
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Global tournament win rates & metrics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.07]
              border border-transparent hover:border-white/[0.1] transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loading || !stats ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-slate-500 font-mono">Loading metrics…</span>
            </div>
          ) : (
            <>
              {/* Total races banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 to-purple-950/40
                border border-indigo-800/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <Hash className="w-5 h-5 text-indigo-400" />
                  <span className="font-semibold">Total Completed Races</span>
                </div>
                <span className="text-3xl font-black text-indigo-400 font-mono tabular-nums"
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {stats.totalRaces}
                </span>
              </div>

              {/* Win distribution */}
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Win Rate Distribution
                </h3>

                {sortedAlgos.map((algo, i) => {
                  const cfg = ALGORITHMS[algo];
                  const count = stats.wins[algo] || 0;
                  const pct = stats.winPercentages[algo] || 0;
                  const isLeader = i === 0 && count > 0;

                  return (
                    <div
                      key={algo}
                      className={`p-4 rounded-xl border transition-all duration-300 ${
                        isLeader
                          ? 'border-white/[0.12] bg-white/[0.04]'
                          : 'border-white/[0.06] bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2.5">
                          {isLeader && <span className="text-lg leading-none">🥇</span>}
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cfg.color, boxShadow: `0 0 8px ${cfg.color}60` }}
                          />
                          <span className="font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                            {algo}
                          </span>
                          <span className="text-xs text-slate-500">{cfg.character}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
                          <span className="text-slate-400">{count} wins</span>
                          <span
                            className="text-sm font-black"
                            style={{ color: cfg.color }}
                          >
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Animated progress bar */}
                      <div className="h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/[0.05]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(pct > 0 ? 2 : 0, pct)}%`,
                            backgroundColor: cfg.color,
                            boxShadow: `0 0 8px ${cfg.color}60`,
                            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Insight card */}
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/30 space-y-2">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                  <Info className="w-4 h-4" />
                  Algorithmic Insight
                </div>
                <p className="text-xs text-indigo-200/70 leading-relaxed">
                  On maps with traffic (cost 5), <strong className="text-indigo-200">A* Search</strong> consistently
                  achieves optimal fuel cost by combining accumulated step cost{' '}
                  <code className="font-mono text-indigo-300 bg-indigo-950/60 px-1 rounded">g(n)</code> with
                  Manhattan heuristic{' '}
                  <code className="font-mono text-indigo-300 bg-indigo-950/60 px-1 rounded">h(n)</code>,
                  dominating over unweighted BFS/DFS. Greedy is fastest but not always optimal.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.05] flex justify-end">
          <button
            onClick={onClose}
            className="btn-shimmer px-5 py-2.5 rounded-xl font-semibold text-sm
              bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08]
              text-white transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
