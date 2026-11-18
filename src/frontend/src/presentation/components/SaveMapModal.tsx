import React, { useEffect, useState } from 'react';
import { BookmarkPlus, X, Trash2, Check, Map, FolderOpen, Grid3X3 } from 'lucide-react';
import { useContainer } from '../../app/container';
import { Position, SavedMap } from '../../domain/models/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentGrid: number[][];
  currentStart: Position;
  currentGoal: Position;
  onLoadMap: (map: SavedMap) => void;
}

export const SaveMapModal: React.FC<Props> = ({
  isOpen, onClose, currentGrid, currentStart, currentGoal, onLoadMap,
}) => {
  const { mapGateway } = useContainer();
  const [mapName, setMapName] = useState('');
  const [savedMaps, setSavedMaps] = useState<SavedMap[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const fetchMaps = async () => {
    try {
      const maps = await mapGateway.getMaps();
      setSavedMaps(maps);
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMaps();
      setMapName('');
      setMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapName.trim()) return;
    setSaving(true);
    try {
      await mapGateway.saveMap(mapName.trim(), currentGrid, currentStart, currentGoal);
      setMessage({ text: `"${mapName.trim()}" saved!`, ok: true });
      setMapName('');
      await fetchMaps();
    } catch (err: unknown) {
      setMessage({ text: (err as Error).message || 'Failed to save map.', ok: false });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await mapGateway.deleteMap(id);
      await fetchMaps();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-enter race-modal-backdrop">
      <div className="glass-bright race-modal rounded-2xl max-w-xl w-full
        max-h-[90vh] flex flex-col modal-panel-enter border border-white/[0.1]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <BookmarkPlus className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Course Garage
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Save your custom street circuits</p>
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

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Save Form */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
              <BookmarkPlus className="w-3.5 h-3.5 text-emerald-500" />
              Save Current Grid
            </h3>

            {/* Grid info */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/[0.05] text-[11px] font-mono text-slate-500">
              <Grid3X3 className="w-3.5 h-3.5 text-slate-600" />
              <span>{currentGrid.length}×{currentGrid[0]?.length} cells</span>
              <span className="text-slate-700">·</span>
              <span>Start [{currentStart.join(', ')}]</span>
              <span className="text-slate-700">·</span>
              <span>Goal [{currentGoal.join(', ')}]</span>
            </div>

            <form onSubmit={handleSave} className="flex gap-2">
              <input
                type="text"
                placeholder="Map name (e.g. City Center, Hospital District…)"
                value={mapName}
                onChange={(e) => setMapName(e.target.value)}
                maxLength={60}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-600
                  bg-black/30 border border-white/[0.08] focus:border-emerald-500/60
                  focus:outline-none focus:ring-1 focus:ring-emerald-500/30
                  transition-all duration-200"
              />
              <button
                type="submit"
                disabled={saving || !mapName.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl
                  font-bold text-sm text-white
                  bg-gradient-to-r from-emerald-600 to-teal-600
                  hover:from-emerald-500 hover:to-teal-500
                  
                  transition-all duration-200 disabled:opacity-50 active:scale-95"
              >
                {saving
                  ? <span className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                  : <Check className="w-4 h-4" />
                }
                Save
              </button>
            </form>

            {message && (
              <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border ${
                message.ok
                  ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400'
                  : 'bg-rose-950/40 border-rose-800/40 text-rose-400'
              }`}>
                {message.ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                {message.text}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-white/[0.05]" />

          {/* Saved Maps List */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
              <Map className="w-3.5 h-3.5 text-blue-500" />
              Your Presets ({savedMaps.length})
            </h3>

            {savedMaps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-700">
                <FolderOpen className="w-10 h-10 opacity-30" />
                <p className="text-xs">No saved maps yet. Save your first map above!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {savedMaps.map((m) => (
                  <div
                    key={m.id}
                    className="group flex items-center justify-between gap-3 p-3.5 rounded-xl
                      border border-white/[0.06] bg-white/[0.02]
                      hover:bg-white/[0.05] hover:border-white/[0.1]
                      transition-all duration-200"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-200 truncate">{m.name}</div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        {m.grid.length}×{m.grid[0]?.length} ·{' '}
                        {new Date(m.createdAtUtc).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => { onLoadMap(m); onClose(); }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg
                          text-xs font-bold text-white
                          bg-indigo-600 hover:bg-indigo-500
                          
                          transition-all duration-200 active:scale-95"
                      >
                        <FolderOpen className="w-3 h-3" /> Load
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        disabled={deletingId === m.id}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400
                          hover:bg-rose-950/30 border border-transparent hover:border-rose-800/30
                          transition-all duration-200"
                        title="Delete map"
                      >
                        {deletingId === m.id
                          ? <span className="w-3.5 h-3.5 border border-rose-400 border-t-transparent rounded-full animate-spin block" />
                          : <Trash2 className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.05] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm
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
