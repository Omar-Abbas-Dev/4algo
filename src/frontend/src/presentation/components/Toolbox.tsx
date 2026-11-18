import React from 'react';
import {
  Flag, Home, CarFront, BrickWall, Dices, RotateCcw,
  BookmarkPlus, Map,
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

const TrafficSignalIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 3h8l2 2v14l-2 2H8l-2-2V5l2-2Z" />
    <path d="M12 21v2M9 23h6" />
    <circle cx="12" cy="7" r="1.15" /><circle cx="12" cy="12" r="1.15" /><circle cx="12" cy="17" r="1.15" />
  </svg>
);

const TRACK_TOOLS: { id: PaintTool; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'start', label: 'Start', icon: <Flag />, color: '#198b63' },
  { id: 'goal', label: 'Finish', icon: <Home />, color: '#d28a32' },
  { id: 'open', label: 'Road', icon: <CarFront />, color: '#3677a8' },
  { id: 'traffic', label: 'Traffic', icon: <TrafficSignalIcon />, color: '#c76b35' },
  { id: 'blocked', label: 'Block', icon: <BrickWall />, color: '#c34d57' },
];

export const Toolbox: React.FC<Props> = ({
  currentTool, onSelectTool, onSelectPreset, onGenerateRandom, onClearGrid,
  onOpenSaveModal, isRacing,
}) => (
  <section className="track-deck game-panel" aria-label="Track setup">
    <div className="track-deck-heading">
      <div>
        <span className="game-kicker"><Map size={13} /> TRACK DECK</span>
        <span className="track-deck-help">Choose a piece → tap the map → press PLAY</span>
      </div>
    </div>

    <div className="track-deck-content">
      <div className="track-piece-picker" aria-label="Track pieces">
        {TRACK_TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onSelectTool(tool.id)}
            disabled={isRacing}
            aria-pressed={currentTool === tool.id}
            className={`track-piece ${currentTool === tool.id ? 'selected' : ''}`}
            style={{ '--piece-color': tool.color } as React.CSSProperties}
          >
            {tool.icon}<span>{tool.label}</span>
          </button>
        ))}
      </div>

      <div className="track-presets" aria-label="Choose a course">
        <span className="game-kicker">COURSES</span>
        {PRESET_MAPS.filter((_, index) => index !== 1).map((preset, index) => (
          <button key={preset.name} onClick={() => onSelectPreset(preset)} disabled={isRacing} title={preset.description}>
            <span className="course-number">0{index + 1}</span>{preset.name}
          </button>
        ))}
      </div>

      <div className="track-deck-actions">
        <button onClick={onGenerateRandom} disabled={isRacing}><Dices size={14} /> SHUFFLE</button>
        <button onClick={onClearGrid} disabled={isRacing}><RotateCcw size={14} /> RESET</button>
        <button onClick={onOpenSaveModal} disabled={isRacing} className="save-course"><BookmarkPlus size={14} /> SAVE</button>
      </div>
    </div>
  </section>
);
