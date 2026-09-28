import React, { useRef, useEffect, useState } from 'react';
import { SimulationDataPoint } from '../types/pid';
import { Play, Pause, RotateCcw, Eye, EyeOff } from 'lucide-react';

interface ScopeChartProps {
  data: SimulationDataPoint[];
  isRunning: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  title?: string;
  showSubTerms?: boolean;
}

export const ScopeChart: React.FC<ScopeChartProps> = ({
  data,
  isRunning,
  onTogglePlay,
  onReset,
  title = 'Live Process Telemetry (SP, PV, CO)',
  showSubTerms = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showP, setShowP] = useState(false);
  const [showI, setShowI] = useState(false);
  const [showD, setShowD] = useState(false);
  const [timeSpan, setTimeSpan] = useState<number>(60); // seconds visible

  const latestPoint = data.length > 0 ? data[data.length - 1] : { t: 0, sp: 50, pv: 20, co: 0, rawCo: 0, pTerm: 0, iTerm: 0, dTerm: 0 };
  const currentError = Number((latestPoint.sp - latestPoint.pv).toFixed(2));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Background
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, w, h);

    const padLeft = 46;
    const padRight = 20;
    const padTop = 24;
    const padBottom = 28;
    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    // Vertical range: -10% to 110% (to clearly show saturation & kick)
    const yMin = -15;
    const yMax = 115;
    const yRange = yMax - yMin;

    const getY = (val: number) => {
      const clamped = Math.max(yMin, Math.min(yMax, val));
      return padTop + plotH - ((clamped - yMin) / yRange) * plotH;
    };

    // Draw Graticule / Grid Lines
    ctx.lineWidth = 1;
    const ySteps = [0, 20, 40, 50, 60, 80, 100];
    ySteps.forEach((val) => {
      const y = getY(val);
      ctx.beginPath();
      if (val === 0 || val === 100) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)'; // Output limit boundary
        ctx.setLineDash([4, 4]);
      } else if (val === 50) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.setLineDash([2, 4]);
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.setLineDash([]);
      }
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = val === 0 || val === 100 ? '#f87171' : '#64748b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${val}%`, padLeft - 6, y);
    });

    // Time window calculation - True Continuous Scrolling Strip Chart
    const maxT = data.length > 0 ? data[data.length - 1].t : 0;
    const windowEnd = maxT;
    const windowStart = maxT - timeSpan;

    const getX = (t: number) => {
      return padLeft + ((t - windowStart) / timeSpan) * plotW;
    };

    // Vertical time grid lines (scrolling strip chart format)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.setLineDash([2, 4]);
    const numTimeMarks = 6;
    for (let i = 0; i <= numTimeMarks; i++) {
      const x = padLeft + (i / numTimeMarks) * plotW;
      const tVal = windowStart + (i / numTimeMarks) * timeSpan;

      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, padTop + plotH);
      ctx.stroke();

      ctx.fillStyle = i === numTimeMarks ? '#38bdf8' : '#64748b';
      ctx.font = i === numTimeMarks ? 'bold 10px monospace' : '10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const label = i === numTimeMarks ? 'LIVE' : `${Math.round(tVal)}s`;
      ctx.fillText(label, x, padTop + plotH + 6);
    }
    ctx.setLineDash([]);

    // Filter points in view
    const rawVisible = data.filter((d) => d.t >= windowStart - 2 && d.t <= windowEnd + 2);
    const visiblePoints = [...rawVisible];

    // Ensure edge-to-edge continuity so the line NEVER has gaps on either side
    if (visiblePoints.length > 0) {
      if (visiblePoints[0].t > windowStart) {
        visiblePoints.unshift({
          ...visiblePoints[0],
          t: windowStart,
        });
      }
      if (visiblePoints[visiblePoints.length - 1].t < windowEnd) {
        visiblePoints.push({
          ...visiblePoints[visiblePoints.length - 1],
          t: windowEnd,
        });
      }
    }

    if (visiblePoints.length > 1) {
      // Clip to plotting area to keep traces strictly within borders
      ctx.save();
      ctx.beginPath();
      ctx.rect(padLeft, padTop, plotW, plotH);
      ctx.clip();

      // 1. Raw CO (Windup Saturation indicator if above 100% or below 0%)
      const hasWindup = visiblePoints.some((d) => (d.rawCo ?? d.co) > 100 || (d.rawCo ?? d.co) < 0);
      if (hasWindup) {
        ctx.beginPath();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
        ctx.setLineDash([3, 3]);
        visiblePoints.forEach((d, i) => {
          const x = getX(d.t);
          const y = getY(d.rawCo ?? d.co);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Optional Sub-Terms: P, I, D
      if (showSubTerms) {
        if (showP) {
          ctx.beginPath();
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = '#c084fc'; // Purple
          visiblePoints.forEach((d, i) => {
            const x = getX(d.t);
            const y = getY(d.pTerm);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.stroke();
        }

        if (showI) {
          ctx.beginPath();
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = '#fb923c'; // Orange
          visiblePoints.forEach((d, i) => {
            const x = getX(d.t);
            const y = getY(d.iTerm);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.stroke();
        }

        if (showD) {
          ctx.beginPath();
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = '#f472b6'; // Pink
          visiblePoints.forEach((d, i) => {
            const x = getX(d.t);
            const y = getY(d.dTerm);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.stroke();
        }
      }

      // 2. Controller Output (CO) - Cyan
      ctx.beginPath();
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = '#06b6d4';
      ctx.shadowColor = 'rgba(6, 182, 212, 0.4)';
      ctx.shadowBlur = 4;
      visiblePoints.forEach((d, i) => {
        const x = getX(d.t);
        const y = getY(d.co);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 3. Setpoint (SP) - Gold / Amber Dashed
      ctx.beginPath();
      ctx.lineWidth = 2.0;
      ctx.strokeStyle = '#f59e0b';
      ctx.setLineDash([6, 4]);
      visiblePoints.forEach((d, i) => {
        const x = getX(d.t);
        const y = getY(d.sp);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // 4. Process Variable (PV) - Emerald Green
      ctx.beginPath();
      ctx.lineWidth = 2.8;
      ctx.strokeStyle = '#10b981';
      ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
      ctx.shadowBlur = 6;
      visiblePoints.forEach((d, i) => {
        const x = getX(d.t);
        const y = getY(d.pv);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.restore();
    }

    // Outer Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(padLeft, padTop, plotW, plotH);

  }, [data, timeSpan, showP, showI, showD, showSubTerms]);

  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col gap-3 shadow-xl">
      {/* Scope Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            {isRunning ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            )}
          </span>
          <h3 className="font-semibold text-slate-200 text-sm tracking-wide uppercase">{title}</h3>
        </div>

        {/* Live Digital Readouts */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded text-amber-300">
            SP: <span className="font-bold text-amber-200">{latestPoint.sp.toFixed(1)}%</span>
          </div>
          <div className="bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded text-emerald-300">
            PV: <span className="font-bold text-emerald-200">{latestPoint.pv.toFixed(1)}%</span>
          </div>
          <div className="bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-1 rounded text-cyan-300">
            CO: <span className="font-bold text-cyan-200">{latestPoint.co.toFixed(1)}%</span>
            {(latestPoint.rawCo ?? latestPoint.co) > 100 && (
              <span className="ml-1 text-[10px] text-rose-400 font-bold animate-pulse">SATURATED</span>
            )}
          </div>
          <div className="bg-slate-800/60 border border-slate-700 px-2.5 py-1 rounded text-slate-300">
            Error (e): <span className={`font-bold ${currentError > 0 ? 'text-emerald-400' : currentError < 0 ? 'text-amber-400' : 'text-slate-400'}`}>{currentError}%</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition cursor-pointer ${
              isRunning ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 hover:bg-amber-600/50' : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/50'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isRunning ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={onReset}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition flex items-center gap-1.5 text-xs font-medium cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative w-full h-64 md:h-72 bg-[#0a0e17] rounded-lg overflow-hidden border border-slate-800/80">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Legend & Options */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-1">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-amber-500 rounded border-dashed"></span>
            <span className="text-amber-400 font-medium">Setpoint (SP)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-emerald-500 rounded"></span>
            <span className="text-emerald-400 font-medium">Process Variable (PV)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-cyan-500 rounded"></span>
            <span className="text-cyan-400 font-medium">Controller Output (CO)</span>
          </span>
          {showSubTerms && (
            <>
              <button
                onClick={() => setShowP(!showP)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[11px] cursor-pointer ${
                  showP ? 'bg-purple-900/40 border-purple-500 text-purple-300' : 'bg-slate-900 border-slate-700 text-slate-500'
                }`}
              >
                P-Term
              </button>
              <button
                onClick={() => setShowI(!showI)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[11px] cursor-pointer ${
                  showI ? 'bg-orange-900/40 border-orange-500 text-orange-300' : 'bg-slate-900 border-slate-700 text-slate-500'
                }`}
              >
                I-Term
              </button>
              <button
                onClick={() => setShowD(!showD)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[11px] cursor-pointer ${
                  showD ? 'bg-pink-900/40 border-pink-500 text-pink-300' : 'bg-slate-900 border-slate-700 text-slate-500'
                }`}
              >
                D-Term
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span>Time Span:</span>
          <select
            value={timeSpan}
            onChange={(e) => setTimeSpan(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-0.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value={30}>30 sec</option>
            <option value={60}>60 sec</option>
            <option value={120}>2 min</option>
            <option value={300}>5 min</option>
          </select>
        </div>
      </div>
    </div>
  );
};
