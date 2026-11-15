import React from 'react';
import {
  Flag, Target, Car, AlertTriangle, ShieldAlert,
  Dices, RotateCcw, MapPin, BookmarkPlus, Layers,
} from 'lucide-react';
import { PaintTool } from '../../domain/models/types';
import { PRESET_MAPS, MapPreset } from '../../domain/rules/presetMaps';

interface Props {
  currentTool: PaintTool;
  onSelectTool: (tool: PaintTool) => void;
  onSelectPreset: (preset: MapPreset) => void;
  onGenerateRandom: () => void;
  onClearGrid: () => void;
  onOpenSaveModal: () => void;
  isRacing: boolean;
}

type ToolDef = {
  id: PaintTool;
  label: string;
  shortcut: string;
  icon: React.ReactNode;
  accent: string;        // tailwind color name partial
  borderColor: string;
  glowColor: string;
  desc: string;
  cost?: string;
};

const TOOLS: ToolDef[] = [
  {
    id: 'start', label: 'Start', shortcut: 'S',
    icon: <Flag className="w-4 h-4" />,
    accent: 'emerald', borderColor: 'border-emerald-500/50',
    glowColor: 'rgba(16,185,129,0.4)',
    desc: 'Origin point', cost: undefined,
  },
  {
    id: 'goal', label: 'Goal', shortcut: 'G',
    icon: <Target className="w-4 h-4" />,
    accent: 'amber', borderColor: 'border-amber-500/50',
    glowColor: 'rgba(245,158,11,0.4)',
    desc: 'Destination', cost: undefined,
  },
  {
    id: 'open', label: 'Road', shortcut: '1',
    icon: <Car className="w-4 h-4" />,
    accent: 'blue', borderColor: 'border-blue-500/50',
    glowColor: 'rgba(59,130,246,0.4)',
    desc: 'Open road', cost: 'Cost 1',
  },
  {
    id: 'traffic', label: 'Traffic', shortcut: '5',
    icon: <AlertTriangle className="w-4 h-4" />,
    accent: 'orange', borderColor: 'border-orange-500/50',
    glowColor: 'rgba(249,115,22,0.4)',
    desc: 'Slow zone', cost: 'Cost 5',
  },
  {
    id: 'blocked', label: 'Block', shortcut: 'B',
    icon: <ShieldAlert className="w-4 h-4" />,
    accent: 'rose', borderColor: 'border-rose-500/50',
    glowColor: 'rgba(244,63,94,0.4)',
    desc: 'Impassable', cost: '—',
  },
];

const accentColors: Record<string, { text: string; bg: string; ring: string }> = {
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/40' },
  amber:   { text: 'text-amber-400',   bg: 'bg-amber-500/10',   ring: 'ring-amber-500/40'   },
  blue:    { text: 'text-blue-400',    bg: 'bg-blue-500/10',    ring: 'ring-blue-500/40'    },
  orange:  { text: 'text-orange-400',  bg: 'bg-orange-500/10',  ring: 'ring-orange-500/40'  },
  rose:    { text: 'text-rose-400',    bg: 'bg-rose-500/10',    ring: 'ring-rose-500/40'    },
};

export const Toolbox: React.FC<Props> = ({
  currentTool, onSelectTool, onSelectPreset,
  onGenerateRandom, onClearGrid, onOpenSaveModal, isRacing,
}) => {
  return (
    <div className="h-full flex flex-col justify-between glass border border-white/[0.07] rounded-xl overflow-hidden shadow-xl shadow-black/40 p-2.5 gap-2.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-indigo-500/10 border border-indigo-500/20">
            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <span className="text-xs font-bold text-white tracking-wide" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Map Painter
          </span>
        </div>
        {isRacing && (
          <span className="text-[9px] font-mono text-amber-400/80 uppercase font-semibold">Locked</span>
        )}
      </div>

      {/* Tool Grid (5 tools) */}
      <div className="grid grid-cols-5 gap-1.5">
        {TOOLS.map((tool) => {
          const isSelected = currentTool === tool.id;
          const colors = accentColors[tool.accent];

          return (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              disabled={isRacing}
              title={`${tool.label} [${tool.shortcut}] — ${tool.desc}${tool.cost ? ` (${tool.cost})` : ''}`}
              className={`group relative flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-lg
                border text-center transition-all duration-150
                ${isSelected
                  ? `${tool.borderColor} ${colors.bg} ring-1 ${colors.ring} shadow-sm`
                  : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.12]'
                }
                ${isRacing ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
              style={isSelected ? { boxShadow: `0 0 10px ${tool.glowColor}` } : undefined}
            >
              <span className={`${isSelected ? colors.text : 'text-slate-500 group-hover:text-slate-300'} transition-colors`}>
                {tool.icon}
              </span>

              <span className={`text-[8.5px] font-bold tracking-tight uppercase leading-none ${
                isSelected ? colors.text : 'text-slate-400'
              }`}>
                {tool.label}
              </span>

              {tool.cost && (
                <span className={`text-[7.5px] font-mono px-1 py-0.2 rounded leading-none ${
                  isSelected
                    ? `${colors.bg} ${colors.text} border ${tool.borderColor}`
                    : 'bg-black/30 text-slate-500 border border-white/[0.04]'
                }`}>
                  {tool.cost}
                </span>
              )}

              {isSelected && (
                <span
                  className="absolute top-1 right-1 w-1 h-1 rounded-full"
                  style={{ backgroundColor: tool.glowColor.replace('0.4', '1') }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Presets Section */}
      <div className="flex-1 min-h-0 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-slate-500" />
          <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider font-bold">Map Presets</span>
        </div>
        <div className="flex flex-col gap-1 overflow-y-auto pr-0.5">
          {PRESET_MAPS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onSelectPreset(preset)}
              disabled={isRacing}
              title={preset.description}
              className="btn-shimmer flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium
                bg-white/[0.03] hover:bg-white/[0.07]
                border border-white/[0.06] hover:border-white/[0.12]
                text-slate-300 hover:text-white
                transition-all duration-150 disabled:opacity-40 text-left cursor-pointer"
            >
              <span className="font-semibold text-slate-200">{preset.name}</span>
              <span className="text-[9.5px] text-slate-500 italic truncate max-w-[110px]">{preset.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Action Row */}
      <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-white/[0.06]">
        <button
          onClick={onGenerateRandom}
          disabled={isRacing}
          className="btn-shimmer flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold
            bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40
            text-indigo-300 hover:text-indigo-200 transition-all duration-150 disabled:opacity-40 uppercase tracking-wide cursor-pointer"
        >
          <Dices className="w-3 h-3" />
          Random
        </button>
        <button
          onClick={onClearGrid}
          disabled={isRacing}
          className="btn-shimmer flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold
            bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/[0.12]
            text-slate-400 hover:text-slate-200 transition-all duration-150 disabled:opacity-40 uppercase tracking-wide cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          Clear
        </button>
        <button
          onClick={onOpenSaveModal}
          disabled={isRacing}
          className="btn-shimmer flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold
            bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40
            text-emerald-300 hover:text-emerald-200 transition-all duration-150 disabled:opacity-40 uppercase tracking-wide cursor-pointer"
        >
          <BookmarkPlus className="w-3 h-3" />
          Save
        </button>
      </div>
    </div>
  );
};
