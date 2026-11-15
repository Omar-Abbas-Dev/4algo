import React from 'react';
import { Volume2, Play, X, Headphones, Radio, Music, Waves } from 'lucide-react';
import { useContainer } from '../../app/container';
import { ALGORITHMS, AlgorithmName } from '../../domain/models/types';
import { SoundEvent } from '../../application/ports/ports';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ALGO_LIST: AlgorithmName[] = ['BFS', 'DFS', 'Greedy', 'A*'];

const EVENTS: { id: SoundEvent; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: 'click',        label: 'Open Road',      desc: 'Soft high click',         icon: <Music className="w-3.5 h-3.5" /> },
  { id: 'traffic',      label: 'Traffic Honk',   desc: 'Low vehicle horn tone',   icon: <Waves className="w-3.5 h-3.5" /> },
  { id: 'thud',         label: 'Draw Obstacle',  desc: 'Heavy thud resonance',    icon: <Waves className="w-3.5 h-3.5" /> },
  { id: 'start_placed', label: 'Start Placed',   desc: 'Rising upward tone',      icon: <Music className="w-3.5 h-3.5" /> },
  { id: 'goal_placed',  label: 'Goal Placed',    desc: 'Falling descend tone',    icon: <Music className="w-3.5 h-3.5" /> },
  { id: 'countdown_go', label: 'Race Countdown', desc: 'Beeps + high GO',         icon: <Radio className="w-3.5 h-3.5" /> },
  { id: 'winner',       label: 'Victory Fanfare',desc: 'Triumphant fanfare',       icon: <Volume2 className="w-3.5 h-3.5" /> },
  { id: 'nopath',       label: 'No Path Found',  desc: 'Descending error chords', icon: <Waves className="w-3.5 h-3.5" /> },
];

export const SonificationLegend: React.FC<Props> = ({ isOpen, onClose }) => {
  const { soundPlayer } = useContainer();
  if (!isOpen) return null;

  const testAlgo = (algo: AlgorithmName) => {
    soundPlayer.unlockAudio();
    soundPlayer.playArrival(algo);
  };

  const testEvent = (ev: SoundEvent) => {
    soundPlayer.unlockAudio();
    soundPlayer.playEvent(ev);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-enter"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="glass-bright rounded-2xl max-w-2xl w-full shadow-2xl shadow-black/70
        max-h-[90vh] flex flex-col modal-panel-enter border border-white/[0.1]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <Headphones className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Audio Sonification
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Each algorithm has a unique stereo waveform identity
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
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Algorithm Sound Identities */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
              <Radio className="w-3.5 h-3.5 text-emerald-500" />
              Algorithm Sound Identities
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {ALGO_LIST.map((algo) => {
                const cfg = ALGORITHMS[algo];
                return (
                  <div
                    key={algo}
                    className="group flex items-center justify-between gap-3
                      p-4 rounded-xl border border-white/[0.07] bg-white/[0.03]
                      hover:border-white/[0.12] hover:bg-white/[0.06]
                      transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{
                          backgroundColor: cfg.color,
                          boxShadow: `0 0 10px ${cfg.color}80`,
                        }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                            {algo}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md
                            bg-black/30 border border-white/[0.07] text-slate-400 uppercase tracking-wider">
                            {cfg.waveform} wave
                          </span>
                          <span className="text-[10px] font-mono text-slate-600">
                            pan {cfg.pan > 0 ? `+${cfg.pan}` : cfg.pan}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{cfg.character}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => testAlgo(algo)}
                      title={`Preview ${algo} sound`}
                      className="shrink-0 p-2 rounded-xl transition-all duration-200
                        bg-white/[0.05] hover:bg-white/[0.1]
                        border border-white/[0.07] hover:border-white/[0.14]
                        text-slate-400 hover:text-white active:scale-90"
                      style={{ '--hover-shadow': `0 0 12px ${cfg.color}60` } as React.CSSProperties}
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Event Sonification */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
              <Volume2 className="w-3.5 h-3.5 text-amber-500" />
              Interactive Event Sounds
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EVENTS.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl
                    border border-white/[0.06] bg-white/[0.02]
                    hover:border-white/[0.1] hover:bg-white/[0.04] transition-all duration-200"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-slate-600 shrink-0">{ev.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-200 truncate">{ev.label}</div>
                      <div className="text-[10px] text-slate-500 truncate">{ev.desc}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => testEvent(ev.id)}
                    className="shrink-0 p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1]
                      border border-white/[0.07] text-slate-400 hover:text-white
                      transition-all duration-200 active:scale-90"
                  >
                    <Play className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Dynamic pitch note */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/25">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs mb-2">
              <Waves className="w-3.5 h-3.5" />
              Dynamic Heuristic Sonification
            </div>
            <p className="text-xs text-indigo-200/60 leading-relaxed">
              While exploring, each cell tick changes pitch based on Manhattan distance{' '}
              <code className="font-mono text-indigo-300 bg-indigo-950/60 px-1 rounded">h(n)</code>.
              As an algorithm approaches the goal, pitch steadily rises toward{' '}
              <code className="font-mono text-indigo-300 bg-indigo-950/60 px-1 rounded">1300 Hz</code>.
              The panning position (−1 to +1) is unique to each algorithm's stereo channel identity.
            </p>
          </div>
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
