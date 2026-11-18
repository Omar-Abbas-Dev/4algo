import React, { useEffect, useState } from 'react';
import { History, X, Play, Award, Calendar, Grid3X3, ChevronLeft, ChevronRight } from 'lucide-react';
import { useContainer } from '../../app/container';
import { RaceResult, ALGORITHMS } from '../../domain/models/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoadReplay: (race: RaceResult) => void;
}

const PAGE_SIZE = 8;

export const HistoryModal: React.FC<Props> = ({ isOpen, onClose, onLoadReplay }) => {
  const { raceGateway } = useContainer();
  const [history, setHistory] = useState<RaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [replayingId, setReplayingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const fetchHistory = async (p: number) => {
    setLoading(true);
    try {
      const res = await raceGateway.getHistory(p, PAGE_SIZE);
      setHistory(res.items);
      setTotalCount(res.totalCount);
      setPage(p);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchHistory(1);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleReplay = async (item: RaceResult) => {
    setReplayingId(item.id);
    try {
      const replay = await raceGateway.getReplay(item.id);
      if (replay) {
        onLoadReplay(replay);
        onClose();
      }
    } finally {
      setReplayingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-enter race-modal-backdrop">
      <div className="glass-bright race-modal rounded-2xl max-w-3xl w-full
        max-h-[90vh] flex flex-col modal-panel-enter border border-white/[0.1]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <History className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Race Replay
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {totalCount} race{totalCount !== 1 ? 's' : ''} on record — pick one to race again
              </p>
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
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-slate-500 font-mono">Loading race logs…</span>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-600">
              <History className="w-12 h-12 opacity-20" />
              <p className="text-sm">No race records yet. Run a race to build history!</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {history.map((item, idx) => {
                const winnerCfg = item.winner ? ALGORITHMS[item.winner] : null;
                const isReplaying = replayingId === item.id;
                const raceDate = new Date(item.createdAtUtc);
                const best = item.results.find((r) => r.algorithm === item.winner);

                return (
                  <div
                    key={item.id}
                    className="group flex items-center justify-between gap-3
                      p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]
                      hover:bg-white/[0.05] hover:border-white/[0.1]
                      transition-all duration-200 cursor-default"
                  >
                    {/* Race number */}
                    <span className="text-[11px] font-mono text-slate-700 w-6 text-right shrink-0">
                      #{(page - 1) * PAGE_SIZE + idx + 1}
                    </span>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {/* Timestamp */}
                        <span className="flex items-center gap-1 text-xs font-semibold text-slate-300">
                          <Calendar className="w-3 h-3 text-slate-600" />
                          {raceDate.toLocaleDateString()} {raceDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        {/* Winner badge */}
                        {item.winner && winnerCfg && (
                          <span
                            className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold border"
                            style={{
                              backgroundColor: `${winnerCfg.color}15`,
                              color: winnerCfg.color,
                              borderColor: `${winnerCfg.color}30`,
                            }}
                          >
                            <Award className="w-2.5 h-2.5" />
                            {item.winner}
                          </span>
                        )}

                        {item.fromCache && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-mono
                            bg-cyan-950/40 border border-cyan-800/30 text-cyan-500">
                            cached
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-500">
                        <span className="flex items-center gap-1">
                          <Grid3X3 className="w-3 h-3" />
                          {item.grid.length}×{item.grid[0]?.length}
                        </span>
                        <span>Start [{item.start.join(', ')}]</span>
                        <span>Goal [{item.goal.join(', ')}]</span>
                        {best && (
                          <span className="text-slate-600">
                            Best cost: <span style={{ color: winnerCfg?.color }}>{best.cost}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Replay button */}
                    <button
                      onClick={() => handleReplay(item)}
                      disabled={isReplaying}
                      className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl
                        text-xs font-bold text-white
                        bg-gradient-to-r from-indigo-600 to-indigo-700
                        hover:from-indigo-500 hover:to-indigo-600
                        
                        transition-all duration-200 disabled:opacity-60 active:scale-95"
                    >
                      {isReplaying
                        ? <span className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                        : <Play className="w-3.5 h-3.5" />
                      }
                      {isReplaying ? 'Loading…' : 'Replay'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer — Pagination */}
        <div className="px-6 py-4 border-t border-white/[0.05] flex items-center justify-between">
          <span className="text-xs text-slate-600 font-mono">
            Page {page} of {totalPages} · {totalCount} total
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchHistory(page - 1)}
              disabled={page <= 1 || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07]
                text-slate-400 hover:text-white disabled:opacity-30 transition-all duration-200"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <button
              onClick={() => fetchHistory(page + 1)}
              disabled={page >= totalPages || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07]
                text-slate-400 hover:text-white disabled:opacity-30 transition-all duration-200"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
