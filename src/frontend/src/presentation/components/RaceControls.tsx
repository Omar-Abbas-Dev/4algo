import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, FastForward, Database, Sparkles, Flame } from 'lucide-react';
import { AlgorithmName } from '../../domain/models/types';
import { AlgorithmPicker } from './AlgorithmPicker';

interface Props {
  isRacing: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  fromCache?: boolean;
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
  isRacing, isPaused, isCompleted, fromCache, speed,
  selectedAlgos, onSelectAlgos,
  onStartRace, onPauseResume, onReset, onChangeSpeed, isLoading,
}) => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [shimmer, setShimmer] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /* Trigger shimmer on mount for start button */
  useEffect(() => {
    if (!isRacing && !isCompleted) {
      const id = setTimeout(() => setShimmer(true), 800);
      return () => clearTimeout(id);
    }
  }, [isRacing, isCompleted]);

  /* Countdown sequence before actually starting */
  const handleStart = () => {
    setCountdown(3);
    let n = 3;
    const tick = () => {
      n -= 1;
      if (n <= 0) {
        setCountdown(null);
        onStartRace();
      } else {
        setCountdown(n);
        countdownRef.current = setTimeout(tick, 700);
      }
    };
    countdownRef.current = setTimeout(tick, 700);
  };

  useEffect(() => () => clearTimeout(countdownRef.current), []);

  /* Progress percentage: average over arrived cars */
  const speedLabel = speed >= 10 ? 'MAX' : speed < 1 ? 'SLOW' : `${speed}×`;

  return (
    <div className="shrink-0 glass border border-white/[0.07] rounded-xl overflow-hidden shadow-lg shadow-black/40">
      {/* Top accent line reflecting current state */}
      <div className={`h-[2px] transition-all duration-700 ${
        isRacing && !isPaused
          ? 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-bg-move'
          : isPaused
          ? 'bg-gradient-to-r from-transparent via-amber-400 to-transparent'
          : isCompleted
          ? 'bg-gradient-to-r from-transparent via-indigo-400 to-transparent'
          : 'bg-gradient-to-r from-transparent via-slate-700 to-transparent'
      }`} />

      <div className="px-3 py-2 flex items-center justify-between gap-3">
        {/* ── Primary Actions ── */}
        <div className="flex items-center gap-2">

          {/* Countdown overlay */}
          {countdown !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
              <div className="relative">
                <span
                  key={countdown}
                  className="block text-[100px] font-black text-white animate-countdown"
                  style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    textShadow: '0 0 60px rgba(16,185,129,0.8), 0 0 120px rgba(16,185,129,0.4)',
                  }}
                >
                  {countdown}
                </span>
              </div>
            </div>
          )}

          {!isRacing && !isCompleted ? (
            /* START RACE button */
            <button
              onClick={handleStart}
              disabled={isLoading || countdown !== null}
              className="btn-shimmer group relative flex items-center gap-2 px-5 py-2 rounded-lg
                font-black text-xs text-white overflow-hidden
                bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500
                hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400
                shadow-md shadow-emerald-500/30 hover:shadow-emerald-500/50
                transition-all duration-200 disabled:opacity-60
                active:scale-95 cursor-pointer"
            >
              {isLoading || countdown !== null ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
              )}
              <span className="tracking-wider uppercase">
                {countdown !== null ? 'Ready...' : 'Start Race'}
              </span>
              {/* Shimmer strip */}
              {shimmer && (
                <span className="absolute inset-0 animate-shimmer pointer-events-none" />
              )}
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              {/* PAUSE / RESUME */}
              <button
                onClick={onPauseResume}
                className={`btn-shimmer flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg
                  font-bold text-xs text-white shadow-md transition-all duration-200
                  active:scale-95 cursor-pointer ${
                  isPaused
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-amber-500/20'
                }`}
              >
                {isPaused
                  ? <><Play className="w-3.5 h-3.5" /> Resume</>
                  : <><Pause className="w-3.5 h-3.5" /> Pause</>
                }
              </button>

              {/* RESET */}
              <button
                onClick={onReset}
                className="btn-shimmer flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                  font-medium text-xs text-slate-300
                  bg-white/[0.05] hover:bg-white/[0.09]
                  border border-white/[0.08] hover:border-white/[0.14]
                  transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
          )}

          {/* Cache badge */}
          {fromCache && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg
              bg-cyan-950/50 border border-cyan-700/40 text-cyan-300 text-[10px] font-mono">
              <Database className="w-3 h-3" />
              Engine Cache
            </div>
          )}
        </div>

        {/* ── Algorithm Picker (center) ── */}
        <div className="hidden sm:flex flex-1 justify-center">
          <AlgorithmPicker
            selected={selectedAlgos}
            onChange={onSelectAlgos}
            disabled={isRacing && !isPaused}
          />
        </div>

        {/* ── Speed Controls ── */}
        <div className="flex items-center gap-1.5">
          <span className="hidden sm:flex items-center gap-1 text-[10px] text-slate-500 font-mono font-medium">
            <FastForward className="w-3 h-3" />
            Speed
          </span>
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-black/40 border border-white/[0.06]">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => onChangeSpeed(s)}
                className={`relative px-2 py-1 rounded-md text-[10px] font-mono font-bold
                  transition-all duration-200 cursor-pointer ${
                  speed === s
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/40'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.08]'
                }`}
              >
                {s === 0.5 ? '½×' : `${s}×`}
                {speed === s && s >= 5 && (
                  <Flame className="absolute -top-1.5 -right-0.5 w-2.5 h-2.5 text-orange-400 animate-bounce" />
                )}
              </button>
            ))}
          </div>
          <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded transition-colors ${
            speed >= 10 ? 'text-orange-400' : speed >= 5 ? 'text-amber-400' : 'text-slate-500'
          }`}>
            {speedLabel}
          </span>
        </div>
      </div>
    </div>
  );
};
