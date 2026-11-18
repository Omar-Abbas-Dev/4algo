import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ALGORITHMS, AlgorithmName, CellType, PaintTool, Position } from '../../domain/models/types';
import { CarState } from '../../application/services/RaceAnimator';

interface Props {
  grid: number[][];
  start: Position;
  goal: Position;
  cars: Record<AlgorithmName, CarState>;
  activePaths: Record<AlgorithmName, Position[]>;
  currentTool: PaintTool;
  onCellPaint: (row: number, col: number, tool: PaintTool) => void;
  isRacing: boolean;
}

export const GridCanvas: React.FC<Props> = ({
  grid, start, goal, cars, activePaths, currentTool, onCellPaint, isRacing,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [isMouseDown, setIsMouseDown] = useState(false);
  const frameRef = useRef(0);

  const rows = grid.length;
  const cols = grid[0]?.length || 1;
  const stretchX = stageSize.width > 0 && stageSize.height > 0
    ? (stageSize.width / stageSize.height) / (cols / rows)
    : 1;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setStageSize((current) => current.width === width && current.height === height ? current : { width, height });
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const getCellSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return 32;
    return Math.min(canvas.width / (cols * stretchX), canvas.height / rows);
  }, [rows, cols, stretchX]);

  const getCell = useCallback((e: React.MouseEvent<HTMLCanvasElement>): [number, number] | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const cellSize = getCellSize();
    const col = Math.floor(x / (cellSize * stretchX));
    const row = Math.floor(y / cellSize);
    if (row >= 0 && row < rows && col >= 0 && col < cols) return [row, col];
    return null;
  }, [rows, cols, getCellSize, stretchX]);

  /* ──────────────────────────────────────────────────────────
     RENDER LOOP
  ────────────────────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const cellSize = getCellSize();
      const W = canvas.width;
      const H = canvas.height;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.setTransform(stretchX, 0, 0, 1, 0, 0);

      /* ── 1. Grid background ── */
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const val = grid[r][c];
          const x = c * cellSize;
          const y = r * cellSize;
          if (val === CellType.Blocked) {
            // Pale concrete paving with a black-and-white curb wherever the sidewalk meets a street.
            ctx.fillStyle = '#c9c9c4'; ctx.fillRect(x, y, cellSize, cellSize);
            ctx.fillStyle = (r + c) % 2 ? '#deded9' : '#d4d4cf';
            ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
            ctx.strokeStyle = 'rgba(91,97,96,.16)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(x + cellSize * .12, y + cellSize * .72); ctx.lineTo(x + cellSize * .42, y + cellSize * .72); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x + cellSize * .55, y + cellSize * .28); ctx.lineTo(x + cellSize * .86, y + cellSize * .28); ctx.stroke();
            const curb = (side: 'top' | 'right' | 'bottom' | 'left') => {
              const roadSide = side === 'top' ? r > 0 && grid[r - 1][c] !== CellType.Blocked
                : side === 'bottom' ? r < rows - 1 && grid[r + 1][c] !== CellType.Blocked
                : side === 'left' ? c > 0 && grid[r][c - 1] !== CellType.Blocked
                : c < cols - 1 && grid[r][c + 1] !== CellType.Blocked;
              if (!roadSide) return;
              const stripe = Math.max(4, cellSize * .18);
              for (let i = 0, p = 0; p < cellSize; i++, p += stripe) {
                ctx.fillStyle = i % 2 ? '#282d30' : '#f7f7f3';
                if (side === 'top' || side === 'bottom') ctx.fillRect(x + p, y + (side === 'top' ? 0 : cellSize - 3), Math.min(stripe, cellSize - p), 3);
                else ctx.fillRect(x + (side === 'left' ? 0 : cellSize - 3), y + p, 3, Math.min(stripe, cellSize - p));
              }
            };
            curb('top'); curb('right'); curb('bottom'); curb('left');
          } else {
            // Continuous matte asphalt with restrained lane markings.
            ctx.fillStyle = '#454a4d'; ctx.fillRect(x, y, cellSize, cellSize);
            const hasH = (c > 0 && grid[r][c - 1] !== CellType.Blocked) || (c < cols - 1 && grid[r][c + 1] !== CellType.Blocked);
            const hasV = (r > 0 && grid[r - 1][c] !== CellType.Blocked) || (r < rows - 1 && grid[r + 1][c] !== CellType.Blocked);
            // One short white lane dash per street tile, oriented along its connected road.
            const horizontal = hasH || !hasV;
            ctx.fillStyle = '#f5f4ed';
            const dashLength = cellSize * .22;
            const dashWidth = Math.max(1.5, cellSize * .045);
            if (val === CellType.Traffic) {
              // Traffic keeps the asphalt surface but replaces its lane dash with a flat signal icon.
              const sx = x + cellSize / 2;
              const sy = y + cellSize / 2;
              const housingW = cellSize * .2;
              const housingH = cellSize * .46;
              ctx.fillStyle = '#252b2e';
              ctx.fillRect(sx - housingW / 2, sy - housingH / 2, housingW, housingH);
              ctx.fillStyle = '#e34c42';
              ctx.beginPath(); ctx.arc(sx, sy - housingH * .29, cellSize * .045, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = '#e6b644';
              ctx.beginPath(); ctx.arc(sx, sy, cellSize * .045, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = '#58a66a';
              ctx.beginPath(); ctx.arc(sx, sy + housingH * .29, cellSize * .045, 0, Math.PI * 2); ctx.fill();
            } else if (horizontal) {
              ctx.fillRect(x + (cellSize - dashLength) / 2, y + (cellSize - dashWidth) / 2, dashLength, dashWidth);
            } else {
              ctx.fillRect(x + (cellSize - dashWidth) / 2, y + (cellSize - dashLength) / 2, dashWidth, dashLength);
            }
          }

        }
      }

      /* ── Algorithm routes only; explored roads keep their base asphalt color. ── */
      const algos: AlgorithmName[] = ['BFS', 'DFS', 'Greedy', 'A*'];
      algos.forEach((algo, algoIndex) => {
        const path = activePaths[algo];
        if (!path || path.length < 2) return;
        const cfg = ALGORITHMS[algo];
        const laneOffset = (algoIndex - (algos.length - 1) / 2) * cellSize * .22;
        ctx.save();
        ctx.strokeStyle = cfg.color;
        ctx.lineWidth = Math.max(1.5, cellSize * 0.055);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 0.95;

        ctx.beginPath();
        path.forEach((p, i) => {
          const before = path[Math.max(0, i - 1)];
          const after = path[Math.min(path.length - 1, i + 1)];
          const dr = after[0] - before[0];
          const dc = after[1] - before[1];
          const length = Math.hypot(dc, dr) || 1;
          const px = p[1] * cellSize + cellSize / 2 - (dr / length) * laneOffset;
          const py = p[0] * cellSize + cellSize / 2 + (dc / length) * laneOffset;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.restore();
      });

      /* ── 4. Start marker — emerald portal ── */
      const drawStartMarker = (pr: number, pc: number) => {
        const mx = pc * cellSize + cellSize / 2;
        const my = pr * cellSize + cellSize / 2;
        ctx.save(); ctx.fillStyle = '#198b63';
        ctx.beginPath(); ctx.arc(mx, my, cellSize * .3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f6f6ef'; ctx.fillRect(mx - cellSize * .045, my - cellSize * .22, cellSize * .09, cellSize * .38);
        ctx.beginPath(); ctx.moveTo(mx, my - cellSize * .2); ctx.lineTo(mx + cellSize * .24, my - cellSize * .12); ctx.lineTo(mx, my - cellSize * .02); ctx.closePath(); ctx.fill();
        ctx.restore();
      };

      drawStartMarker(start[0], start[1]);
      // Compact top-down house sprite with a lawn, roof, facade, windows, door, and path.
      const hx = goal[1] * cellSize + cellSize / 2;
      const hy = goal[0] * cellSize + cellSize / 2;
      ctx.save();
      ctx.translate(hx, hy);
      const s = cellSize;
      ctx.fillStyle = '#7b9c64'; ctx.fillRect(-s*.4, -s*.38, s*.8, s*.76);
      ctx.fillStyle = '#c9b58d'; ctx.fillRect(-s*.09, s*.12, s*.18, s*.28);
      ctx.fillStyle = '#7b6149';
      ctx.beginPath(); ctx.moveTo(-s*.29, -s*.19); ctx.lineTo(s*.13, -s*.19); ctx.lineTo(s*.13, s*.19); ctx.lineTo(-s*.29, s*.19); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ead9b5'; ctx.fillRect(-s*.25, -s*.14, s*.34, s*.32);
      ctx.fillStyle = '#b94f3f';
      ctx.beginPath(); ctx.moveTo(-s*.34, -s*.13); ctx.lineTo(-s*.08, -s*.36); ctx.lineTo(s*.17, -s*.13); ctx.lineTo(s*.11, -s*.06); ctx.lineTo(-s*.08, -s*.23); ctx.lineTo(-s*.29, -s*.06); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#537b8b'; ctx.fillRect(-s*.21, -s*.08, s*.09, s*.1); ctx.fillRect(-s*.04, -s*.08, s*.09, s*.1);
      ctx.fillStyle = '#80513d'; ctx.fillRect(-s*.015, s*.045, s*.09, s*.175);
      ctx.fillStyle = '#ba704b'; ctx.fillRect(s*.03, s*.13, s*.016, s*.016);
      ctx.fillStyle = '#b7b7ad'; ctx.fillRect(-s*.02, -s*.32, s*.09, s*.12);
      ctx.fillStyle = '#4f7748';
      ctx.beginPath(); ctx.arc(-s*.34, s*.26, s*.08, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(s*.32, s*.25, s*.09, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      /* ── 4. Small, flat cars stay inside their current road cell. ── */
      algos.forEach((algo, idx) => {
        const car = cars[algo];
        const cfg = ALGORITHMS[algo];

        const r = car.currentPosition[0] + (car.targetPosition[0] - car.currentPosition[0]) * car.progress;
        const c = car.currentPosition[1] + (car.targetPosition[1] - car.currentPosition[1]) * car.progress;

        let dr = car.targetPosition[0] - car.currentPosition[0];
        let dc = car.targetPosition[1] - car.currentPosition[1];
        if (dr === 0 && dc === 0) { dr = goal[0] - start[0]; dc = goal[1] - start[1]; }
        const length = Math.hypot(dc, dr) || 1;
        const perpX = -dr / length;
        const perpY = dc / length;
        // Keep racers in four compact, distinct lanes within their shared grid cell.
        const laneOffset = (idx - (algos.length - 1) / 2) * cellSize * .14;
        const cx2 = c * cellSize + cellSize / 2 + perpX * laneOffset;
        const cy2 = r * cellSize + cellSize / 2 + perpY * laneOffset;
        const carR = Math.max(2.5, cellSize * .11);

        ctx.save();
        const angle = Math.atan2(dr, dc);
        ctx.translate(cx2, cy2); ctx.rotate(angle);
        const w = carR * 1.9, h = carR * 1.08;
        ctx.fillStyle = '#202c34';
        ctx.fillRect(-w*.32, -h*.64, w*.2, h*.22); ctx.fillRect(w*.12, -h*.64, w*.2, h*.22);
        ctx.fillRect(-w*.32, h*.42, w*.2, h*.22); ctx.fillRect(w*.12, h*.42, w*.2, h*.22);
        ctx.fillStyle = cfg.color;
        ctx.beginPath();
        ctx.moveTo(w*.47, 0);
        ctx.quadraticCurveTo(w*.45, -h*.28, w*.28, -h*.46);
        ctx.lineTo(-w*.22, -h*.46);
        ctx.quadraticCurveTo(-w*.46, -h*.38, -w*.47, -h*.18);
        ctx.lineTo(-w*.47, h*.18);
        ctx.quadraticCurveTo(-w*.46, h*.38, -w*.22, h*.46);
        ctx.lineTo(w*.28, h*.46);
        ctx.quadraticCurveTo(w*.45, h*.28, w*.47, 0);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#b9dce2';
        ctx.beginPath(); ctx.roundRect(-w*.16, -h*.32, w*.39, h*.64, h*.12); ctx.fill();
        ctx.fillStyle = '#314550';
        ctx.fillRect(-w*.26, -h*.27, w*.055, h*.54);
        ctx.fillStyle = '#303c43';
        ctx.fillRect(w*.27, -h*.31, w*.07, h*.12); ctx.fillRect(w*.27, h*.19, w*.07, h*.12);
        ctx.fillStyle = '#515e65';
        ctx.fillRect(-w*.4, -h*.23, w*.055, h*.12); ctx.fillRect(-w*.4, h*.11, w*.055, h*.12);
        ctx.restore();
      });

      frameRef.current = requestAnimationFrame(render);
    };

    frameRef.current = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [grid, start, goal, cars, activePaths, rows, cols, getCellSize, stretchX]);

  /* ──────────────────────────────────────────────────────────
     MOUSE HANDLERS
  ────────────────────────────────────────────────────────── */
  const handlePointerAction = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isRacing) return;
    const cell = getCell(e);
    if (cell) {
      onCellPaint(cell[0], cell[1], currentTool);
    }
  }, [isRacing, getCell, currentTool, onCellPaint]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isMouseDown) {
      handlePointerAction(e);
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

  return (
    <div ref={stageRef} className="city-stage relative flex-1 min-h-0 w-full
      glass rounded-xl overflow-hidden border flex items-center justify-center p-1.5">

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={Math.max(1, Math.round(cols * 36 * stretchX))}
        height={rows * 36}
        style={{ width: '100%', height: '100%' }}
        className={`touch-none select-none rounded-lg ${toolCursor[currentTool]}`}
        onMouseDown={(e) => { setIsMouseDown(true); handlePointerAction(e); }}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsMouseDown(false)}
        onMouseLeave={() => setIsMouseDown(false)}
      />

    </div>
  );
};
