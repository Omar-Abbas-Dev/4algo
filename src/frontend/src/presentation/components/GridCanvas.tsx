import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ALGORITHMS, AlgorithmName, CellType, PaintTool, Position } from '../../domain/models/types';
import { CarState } from '../../application/services/RaceAnimator';

interface Props {
  grid: number[][];
  start: Position;
  goal: Position;
  cars: Record<AlgorithmName, CarState>;
  exploredCells: Record<AlgorithmName, Set<string>>;
  activePaths: Record<AlgorithmName, Position[]>;
  currentTool: PaintTool;
  onCellPaint: (row: number, col: number, tool: PaintTool) => void;
  isRacing: boolean;
}

/* Animated time for pulsing effects */
let _raf: number;
const subscribers = new Set<() => void>();
function startGlobalTicker() {
  if (_raf) return;
  const tick = () => {
    subscribers.forEach((fn) => fn());
    _raf = requestAnimationFrame(tick);
  };
  _raf = requestAnimationFrame(tick);
}

export const GridCanvas: React.FC<Props> = ({
  grid, start, goal, cars, exploredCells, activePaths, currentTool, onCellPaint, isRacing,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<Position | null>(null);
  const timeRef = useRef(0);
  const frameRef = useRef(0);

  const rows = grid.length;
  const cols = grid[0]?.length || 1;

  const getCellSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return 32;
    return Math.min(canvas.width / cols, canvas.height / rows);
  }, [rows, cols]);

  const getCell = useCallback((e: React.MouseEvent<HTMLCanvasElement>): [number, number] | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const cellSize = getCellSize();
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    if (row >= 0 && row < rows && col >= 0 && col < cols) return [row, col];
    return null;
  }, [rows, cols, getCellSize]);

  /* ──────────────────────────────────────────────────────────
     RENDER LOOP
  ────────────────────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      timeRef.current += 0.025;
      const t = timeRef.current;
      const cellSize = getCellSize();
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      /* ── 1. Grid background ── */
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const val = grid[r][c];
          const x = c * cellSize;
          const y = r * cellSize;
          const isStart = r === start[0] && c === start[1];
          const isGoal  = r === goal[0]  && c === goal[1];

          if (val === CellType.Blocked) {
            /* Blocked — dark slate with cross-hatch */
            ctx.fillStyle = '#0d1424';
            ctx.fillRect(x, y, cellSize, cellSize);
            ctx.save();
            ctx.strokeStyle = 'rgba(51,65,85,0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = -cellSize; i < cellSize * 2; i += 7) {
              ctx.moveTo(x + i, y);
              ctx.lineTo(x + i + cellSize, y + cellSize);
            }
            ctx.stroke();
            ctx.restore();
          } else if (val === CellType.Traffic) {
            /* Traffic — amber dark with glow */
            const pulse = 0.5 + 0.5 * Math.sin(t * 2 + r * 0.5 + c * 0.3);
            const alpha = 0.08 + pulse * 0.08;
            ctx.fillStyle = `rgba(120, 53, 15, ${0.85})`;
            ctx.fillRect(x, y, cellSize, cellSize);
            ctx.fillStyle = `rgba(245, 158, 11, ${alpha})`;
            ctx.fillRect(x, y, cellSize, cellSize);
            /* Cost badge */
            ctx.fillStyle = `rgba(245,158,11,${0.6 + pulse * 0.4})`;
            ctx.font = `bold ${Math.max(9, Math.floor(cellSize * 0.35))}px JetBrains Mono, monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('5', x + cellSize / 2, y + cellSize / 2);
          } else if (!isStart && !isGoal) {
            /* Open road */
            ctx.fillStyle = '#080f1e';
            ctx.fillRect(x, y, cellSize, cellSize);
          }

          /* Hover highlight */
          if (hoveredCell && hoveredCell[0] === r && hoveredCell[1] === c && !isRacing) {
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fillRect(x, y, cellSize, cellSize);
          }

          /* Grid lines */
          ctx.strokeStyle = 'rgba(30, 41, 59, 0.8)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x + 0.25, y + 0.25, cellSize - 0.5, cellSize - 0.5);
        }
      }

      /* ── 2. Explored cells with glow ── */
      const algos: AlgorithmName[] = ['BFS', 'DFS', 'Greedy', 'A*'];
      algos.forEach((algo) => {
        const explored = exploredCells[algo];
        if (!explored || explored.size === 0) return;
        const cfg = ALGORITHMS[algo];

        explored.forEach((key) => {
          const [r, c] = key.split(',').map(Number);
          const x = c * cellSize;
          const y = r * cellSize;

          /* Glow fill */
          ctx.save();
          ctx.shadowColor = cfg.color;
          ctx.shadowBlur = cellSize * 0.6;
          ctx.fillStyle = cfg.lightColor;
          ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
          ctx.restore();

          /* Inner bright pixel at center */
          ctx.fillStyle = cfg.color;
          ctx.globalAlpha = 0.18;
          ctx.fillRect(x + cellSize * 0.3, y + cellSize * 0.3, cellSize * 0.4, cellSize * 0.4);
          ctx.globalAlpha = 1;
        });
      });

      /* ── 3. Active paths — gradient lines ── */
      algos.forEach((algo, idx) => {
        const path = activePaths[algo];
        if (!path || path.length < 2) return;
        const cfg = ALGORITHMS[algo];
        const offset = (idx - 1.5) * (cellSize * 0.13);

        /* Glow stroke */
        ctx.save();
        ctx.shadowColor = cfg.color;
        ctx.shadowBlur = cellSize * 0.8;
        ctx.strokeStyle = cfg.color;
        ctx.lineWidth = Math.max(2.5, cellSize * 0.16);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 0.9;

        ctx.beginPath();
        path.forEach((p, i) => {
          const px = p[1] * cellSize + cellSize / 2 + offset;
          const py = p[0] * cellSize + cellSize / 2 + offset;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.restore();

        /* Thin bright inner line */
        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1, cellSize * 0.05);
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        path.forEach((p, i) => {
          const px = p[1] * cellSize + cellSize / 2 + offset;
          const py = p[0] * cellSize + cellSize / 2 + offset;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.restore();
      });

      /* ── 4. Start marker — emerald portal ── */
      const drawPulsingMarker = (
        pr: number, pc: number,
        mainColor: string, glowColor: string, label: string,
        t2: number, phase: number
      ) => {
        const mx = pc * cellSize + cellSize / 2;
        const my = pr * cellSize + cellSize / 2;
        const radius = cellSize * 0.38;
        const pulse = 0.5 + 0.5 * Math.sin(t2 * 3 + phase);

        /* Outer ring pulse */
        ctx.save();
        ctx.beginPath();
        ctx.arc(mx, my, radius + 4 + pulse * 5, 0, Math.PI * 2);
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.4 * (1 - pulse * 0.5);
        ctx.stroke();
        ctx.restore();

        /* Glow */
        ctx.save();
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 20 + pulse * 10;

        /* Main circle */
        const grad = ctx.createRadialGradient(mx - radius * 0.3, my - radius * 0.3, 0, mx, my, radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, mainColor);
        grad.addColorStop(1, glowColor);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mx, my, radius, 0, Math.PI * 2);
        ctx.fill();

        /* Label */
        ctx.fillStyle = '#000000';
        ctx.font = `bold ${Math.max(10, Math.floor(cellSize * 0.42))}px Space Grotesk, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, mx, my);
        ctx.restore();
      };

      drawPulsingMarker(start[0], start[1], '#10B981', '#059669', 'S', t, 0);
      drawPulsingMarker(goal[0],  goal[1],  '#EAB308', '#D97706', 'G', t, Math.PI);

      /* ── 5. Cars — glowing orbs with particle trails ── */
      algos.forEach((algo, idx) => {
        const car = cars[algo];
        const cfg = ALGORITHMS[algo];

        const r = car.currentPosition[0] + (car.targetPosition[0] - car.currentPosition[0]) * car.progress;
        const c = car.currentPosition[1] + (car.targetPosition[1] - car.currentPosition[1]) * car.progress;

        const subOffset = (idx - 1.5) * (cellSize * 0.16);
        const cx2 = c * cellSize + cellSize / 2 + subOffset;
        const cy2 = r * cellSize + cellSize / 2 + subOffset;
        const carR = Math.max(5, cellSize * 0.24);

        /* Arrived */
        const arrived = car.arrived;

        /* Glow halo */
        ctx.save();
        ctx.shadowColor = cfg.color;
        ctx.shadowBlur = arrived ? 30 : 18;

        /* Car body gradient */
        const cg = ctx.createRadialGradient(cx2 - carR * 0.3, cy2 - carR * 0.35, 0, cx2, cy2, carR);
        cg.addColorStop(0, '#ffffff');
        cg.addColorStop(0.3, cfg.carColor);
        cg.addColorStop(1, cfg.color);
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(cx2, cy2, carR, 0, Math.PI * 2);
        ctx.fill();

        /* White ring */
        ctx.strokeStyle = arrived ? '#ffffff' : 'rgba(255,255,255,0.7)';
        ctx.lineWidth = arrived ? 2.5 : 1.5;
        ctx.stroke();

        /* Algo initial label */
        ctx.fillStyle = '#000000';
        ctx.globalAlpha = 0.9;
        ctx.font = `bold ${Math.max(7, Math.floor(carR * 0.9))}px Space Grotesk, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(algo === 'A*' ? 'A*' : algo[0], cx2, cy2);
        ctx.restore();
      });

      frameRef.current = requestAnimationFrame(render);
    };

    frameRef.current = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [grid, start, goal, cars, exploredCells, activePaths, rows, cols, getCellSize, hoveredCell, isRacing]);

  /* ──────────────────────────────────────────────────────────
     MOUSE HANDLERS
  ────────────────────────────────────────────────────────── */
  const handlePointerAction = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isRacing) return;
    const cell = getCell(e);
    if (cell) {
      setHoveredCell(cell);
      onCellPaint(cell[0], cell[1], currentTool);
    }
  }, [isRacing, getCell, currentTool, onCellPaint]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isMouseDown) {
      handlePointerAction(e);
    } else {
      const cell = getCell(e);
      if (cell) setHoveredCell(cell);
    }
  }, [isMouseDown, handlePointerAction, getCell]);

  /* Tool cursor colors */
  const toolCursor: Record<PaintTool, string> = {
    start: 'cursor-cell',
    goal: 'cursor-cell',
    open: 'cursor-crosshair',
    traffic: 'cursor-pointer',
    blocked: 'cursor-not-allowed',
  };

  const hoveredVal = hoveredCell ? grid[hoveredCell[0]][hoveredCell[1]] : null;
  const hoveredLabel =
    hoveredVal === CellType.Blocked ? 'Blocked (impassable)'
    : hoveredVal === CellType.Traffic ? 'Traffic · Cost 5'
    : 'Open Road · Cost 1';

  return (
    <div className="relative flex-1 min-h-0 w-full
      glass rounded-xl overflow-hidden border border-white/[0.07]
      shadow-xl shadow-black/50 flex items-center justify-center p-1.5 scan-line">

      {/* Corner decorations */}
      <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-500/30 rounded-tl-lg pointer-events-none" />
      <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-500/30 rounded-tr-lg pointer-events-none" />
      <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-500/30 rounded-bl-lg pointer-events-none" />
      <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-500/30 rounded-br-lg pointer-events-none" />

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={cols * 36}
        height={rows * 36}
        style={{ aspectRatio: `${cols} / ${rows}` }}
        className={`max-w-full max-h-full object-contain touch-none select-none rounded-lg ${toolCursor[currentTool]}`}
        onMouseDown={(e) => { setIsMouseDown(true); handlePointerAction(e); }}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsMouseDown(false)}
        onMouseLeave={() => { setIsMouseDown(false); setHoveredCell(null); }}
      />

      {/* Racing indicator overlay */}
      {isRacing && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2
          px-3 py-1.5 rounded-full glass border border-emerald-500/30
          text-[11px] font-semibold text-emerald-400 shadow-lg animate-tick pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          RACE IN PROGRESS
        </div>
      )}

      {/* Coordinate HUD */}
      {hoveredCell && (
        <div className="absolute bottom-3 left-3 px-3 py-1.5
          glass border border-white/[0.08] rounded-xl
          text-[11px] font-mono text-slate-300 shadow-lg backdrop-blur pointer-events-none
          flex items-center gap-2.5">
          <span className="text-slate-500 font-bold">[{hoveredCell[0]}, {hoveredCell[1]}]</span>
          <span className="text-slate-600">·</span>
          <span>{hoveredLabel}</span>
        </div>
      )}
    </div>
  );
};
