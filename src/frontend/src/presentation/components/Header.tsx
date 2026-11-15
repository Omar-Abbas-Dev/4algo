import React, { useState, useEffect } from 'react';
import {
  Volume2, VolumeX, Headphones, History, BarChart3, Flag,
  Wifi, WifiOff, Zap, ChevronRight,
} from 'lucide-react';
import { useContainer } from '../../app/container';

interface Props {
  onOpenLegend: () => void;
  onOpenHistory: () => void;
  onOpenStats: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  raceCount?: number;
}

export const Header: React.FC<Props> = ({
  onOpenLegend,
  onOpenHistory,
  onOpenStats,
  isMuted,
  onToggleMute,
  raceCount = 0,
}) => {
  const { soundPlayer } = useContainer();
  const [isOnline, setIsOnline] = useState(true);
  const [tick, setTick] = useState(false);

  /* Pulse the status dot */
  useEffect(() => {
    const id = setInterval(() => setTick((t) => !t), 1800);
    return () => clearInterval(id);
  }, []);

  /* Ping backend health */
  useEffect(() => {
    const check = async () => {
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 3000);
        const r = await fetch('/api/health', { signal: controller.signal });
        clearTimeout(tid);
        setIsOnline(r.ok);
      } catch {
        setIsOnline(false);
      }
    };
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, []);

  const handleToggle = () => {
    soundPlayer.unlockAudio();
    onToggleMute();
  };

  const NavBtn: React.FC<{
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    badge?: number;
    color?: string;
  }> = ({ onClick, icon, label, badge, color = 'text-slate-400' }) => (
    <button
      onClick={onClick}
      className="btn-shimmer group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
        text-xs font-semibold text-slate-300
        bg-white/[0.04] hover:bg-white/[0.08]
        border border-white/[0.07] hover:border-white/[0.14]
        transition-all duration-200"
    >
      <span className={`${color} group-hover:scale-110 transition-transform duration-200`}>{icon}</span>
      <span className="hidden md:inline tracking-wide text-[11px]">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-indigo-500
          text-[8px] font-black text-white flex items-center justify-center shadow-lg shadow-indigo-500/50">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );

  return (
    <header className="shrink-0 z-40 glass border-b border-white/[0.06]">
      {/* Accent top line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />

      <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
        {/* ── Brand ── */}
        <div className="flex items-center gap-2.5 select-none">
          {/* Logo mark */}
          <div className="relative">
            <div className="p-1.5 rounded-lg bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400
              shadow-md shadow-emerald-500/30 text-slate-950">
              <Flag className="w-4 h-4" strokeWidth={2.5} />
            </div>
            {/* Orbit dot */}
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400
              shadow-sm shadow-emerald-400/80"
              style={{ animation: 'navx-pulse-ring 2s cubic-bezier(0.455,0.03,0.515,0.955) infinite' }}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-white leading-none" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                NavX <span className="gradient-text-brand">Arena</span>
              </h1>
              <span className="hidden sm:flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5
                rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25
                uppercase tracking-widest">
                <Zap className="w-2 h-2" />
                Clean Arch
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-none mt-1 flex items-center gap-1">
              <ChevronRight className="w-2.5 h-2.5 text-slate-600" />
              BFS · DFS · Greedy · A* — Multi-Algorithm Search Race
            </p>
          </div>
        </div>

        {/* ── Right Controls ── */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Backend status pill */}
          <div className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg
            text-[10px] font-mono font-medium border transition-all duration-500 ${
            isOnline
              ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400'
              : 'bg-rose-950/40 border-rose-800/40 text-rose-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${
              isOnline ? 'bg-emerald-400' : 'bg-rose-400'
            } ${tick ? 'opacity-100' : 'opacity-40'} transition-opacity duration-300`} />
            {isOnline
              ? <><Wifi className="w-3 h-3" /> API Live</>
              : <><WifiOff className="w-3 h-3" /> Offline</>
            }
          </div>

          {/* Mute button */}
          <button
            onClick={handleToggle}
            className={`btn-shimmer flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
              text-xs font-semibold border transition-all duration-200 ${
              isMuted
                ? 'bg-rose-950/30 border-rose-800/40 text-rose-300 hover:bg-rose-950/50'
                : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300 hover:bg-emerald-950/50'
            }`}
          >
            {isMuted
              ? <VolumeX className="w-3.5 h-3.5" />
              : <Volume2 className="w-3.5 h-3.5" />
            }
            <span className="hidden sm:inline text-[11px]">{isMuted ? 'Muted' : 'Audio ON'}</span>
          </button>

          {/* Nav buttons */}
          <NavBtn onClick={onOpenLegend}  icon={<Headphones className="w-3.5 h-3.5" />} label="Legend" color="text-indigo-400" />
          <NavBtn onClick={onOpenHistory} icon={<History className="w-3.5 h-3.5" />}    label="History" badge={raceCount} color="text-blue-400" />
          <NavBtn onClick={onOpenStats}   icon={<BarChart3 className="w-3.5 h-3.5" />}  label="Stats" color="text-purple-400" />
        </div>
      </div>
    </header>
  );
};
