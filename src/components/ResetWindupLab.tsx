import React, { useState, useEffect, useRef } from 'react';
import { PIDParameters, SimulationDataPoint, AntiWindupType } from '../types/pid';
import { PIDSimulationEngine } from '../utils/pidSimulator';
import { ScopeChart } from './ScopeChart';
import { HeatExchangerSvg } from './HeatExchangerSvg';
import { BlockDiagramSvg } from './BlockDiagramSvg';
import { MathFormula } from './MathFormula';
import { Flame, ShieldCheck, AlertOctagon, RotateCcw, FastForward, CheckCircle2 } from 'lucide-react';

export const ResetWindupLab: React.FC = () => {
  const [antiWindup, setAntiWindup] = useState<AntiWindupType>('none');
  const [steamAvailable, setSteamAvailable] = useState<boolean>(true);
  const [rapidFactor, setRapidFactor] = useState<number>(16);

  // Simulation State
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [data, setData] = useState<SimulationDataPoint[]>([]);
  const engineRef = useRef<PIDSimulationEngine | null>(null);

  // Initialize Simulator for Steam Heat Exchanger
  useEffect(() => {
    const params: PIDParameters = {
      kc: 2.0,
      usePb: false,
      ti: 0.5, // 30 seconds - fast integration to clearly show windup
      tiUnit: 'minutes',
      useResetRate: false,
      td: 0.05,
      tdUnit: 'minutes',
      derivativeFilterGain: 10,
      useDFilter: true,
      algorithm: 'standard',
      structure: 'pi_error_d_pv',
      spSoftening: 'step',
      spFilterTime: 1,
      spRampRate: 10,
      antiWindup,
      coMin: 0,
      coMax: 100,
      rapidUnwindFactor: rapidFactor,
      scanTime: 0.1,
      pvFilterTime: 0.05,
    };

    engineRef.current = new PIDSimulationEngine(params, {
      type: 'heat_exchanger',
      gain: 1.0,
      tau: 8.0,
      deadTime: 1.0,
      noiseLevel: 0.05,
      ambientTemp: 20, // Cold product inlet temp
      steamAvailable: true,
    });

    // Pre-seed 60 seconds of baseline historical points so graph starts 100% full
    const initialData: SimulationDataPoint[] = [];
    for (let t = -60; t <= 0; t += 0.2) {
      initialData.push({
        t: Number(t.toFixed(1)),
        sp: 50,
        pv: 20,
        co: 0,
        rawCo: 0,
        pTerm: 0,
        iTerm: 0,
        dTerm: 0,
      });
    }
    setData(initialData);
  }, []);

  // Sync parameters
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateParams({
        antiWindup,
        rapidUnwindFactor: rapidFactor,
      });
      engineRef.current.updateProcess({
        steamAvailable,
      });
    }
  }, [antiWindup, steamAvailable, rapidFactor]);

  // Simulation Loop
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      if (engineRef.current) {
        const point = engineRef.current.step(0.1);
        setData((prev) => {
          const next = [...prev, point];
          const cutoff = point.t - 360;
          while (next.length > 100 && next[0].t < cutoff) next.shift();
          return next;
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning]);

  const latestPoint = data.length > 0 ? data[data.length - 1] : { pv: 20, sp: 50, co: 0, rawCo: 0 };
  const isSaturated = (latestPoint.rawCo ?? latestPoint.co) > 100 || (latestPoint.rawCo ?? latestPoint.co) < 0;

  const handleToggleSteam = () => {
    setSteamAvailable(!steamAvailable);
  };

  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.reset(20, 50);
      const resetData: SimulationDataPoint[] = [];
      for (let t = -60; t <= 0; t += 0.2) {
        resetData.push({
          t: Number(t.toFixed(1)),
          sp: 50,
          pv: 20,
          co: 0,
          rawCo: 0,
          pTerm: 0,
          iTerm: 0,
          dTerm: 0,
        });
      }
      setData(resetData);
      setSteamAvailable(true);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-950/60 to-slate-900 border border-red-800/40 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Flame className="w-4 h-4" /> Control Issues: Integral Action & Reset Windup
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Heat Exchanger Case Study & Anti-Reset Windup Solutions
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl">
            When a process variable deviates from setpoint for an extended period (such as during a steam supply failure or startup), integral action continuously accumulates, causing the controller's internal bias to saturate far beyond 100%. When conditions return to normal, massive overshoot occurs while waiting for the bias to unwind.
          </p>
        </div>

        {/* Quick Steam Trip Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleToggleSteam}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer ${
              steamAvailable
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {steamAvailable ? (
              <>
                <AlertOctagon className="w-4 h-4" />
                Cut Off Steam Supply (t₀)
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Restore Steam Supply (t₂)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Anti-Windup Options & Process Schematic (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {/* Animated Steam Heat Exchanger Diagram (Figure 12) */}
          <HeatExchangerSvg
            pv={latestPoint.pv}
            sp={latestPoint.sp}
            co={latestPoint.co}
            rawCo={latestPoint.rawCo ?? latestPoint.co}
            steamAvailable={steamAvailable}
            onToggleSteam={handleToggleSteam}
            isSaturated={isSaturated}
          />

          {/* Anti-Windup Selection Card */}
          <div className="glass-panel rounded-xl p-4 flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Select Anti-Reset Windup Protection Scheme:
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {/* Option 1: None */}
              <button
                onClick={() => setAntiWindup('none')}
                className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                  antiWindup === 'none'
                    ? 'bg-rose-950/70 border-rose-500 text-rose-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-slate-100 flex items-center justify-between">
                  1. None (Raw Windup)
                  {antiWindup === 'none' && <span className="text-rose-400 text-[10px]">SELECTED</span>}
                </div>
                <div className="text-[11px] mt-1 text-slate-300">
                  Accumulator integrates indefinitely. Causes massive temperature overshoot! (Figure 12).
                </div>
              </button>

              {/* Option 2: Clamping Limits */}
              <button
                onClick={() => setAntiWindup('clamping')}
                className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                  antiWindup === 'clamping'
                    ? 'bg-sky-950/70 border-sky-500 text-sky-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-slate-100 flex items-center justify-between">
                  2. Anti-Windup Limits
                  {antiWindup === 'clamping' && <span className="text-sky-400 text-[10px]">SELECTED</span>}
                </div>
                <div className="text-[11px] mt-1 text-slate-300">
                  Restricts integral accumulator to high/low limits (-5% to 105%). Stops accumulation when saturated (Figure 13).
                </div>
              </button>

              {/* Option 3: Rapid Unwind */}
              <button
                onClick={() => setAntiWindup('rapid_unwind')}
                className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                  antiWindup === 'rapid_unwind'
                    ? 'bg-purple-950/70 border-purple-500 text-purple-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-slate-100 flex items-center justify-between">
                  3. Rapid Unwind (8x-32x)
                  {antiWindup === 'rapid_unwind' && <span className="text-purple-400 text-[10px]">SELECTED</span>}
                </div>
                <div className="text-[11px] mt-1 text-slate-300">
                  Increases integral action by 8x to 32x once PV crosses SP until CO comes back inside limits (ILM pg 13).
                </div>
              </button>

              {/* Option 4: Reset Feedback */}
              <button
                onClick={() => setAntiWindup('reset_feedback')}
                className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                  antiWindup === 'reset_feedback'
                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-slate-100 flex items-center justify-between">
                  4. Reset Feedback (Figure 14)
                  {antiWindup === 'reset_feedback' && <span className="text-emerald-400 text-[10px]">SELECTED</span>}
                </div>
                <div className="text-[11px] mt-1 text-slate-300">
                  Feeds limited CO back through <MathFormula math="\frac{1}{T_i s + 1}" />. Mathematically impossible to wind up!
                </div>
              </button>
            </div>

            <div className={`min-h-[2.5rem] rounded p-2 flex items-center justify-between text-xs transition-colors ${
              antiWindup === 'rapid_unwind' ? 'bg-slate-900/60 border border-purple-500/30' : 'opacity-0 pointer-events-none'
            }`}>
              <span className="text-slate-300">Rapid Unwind Acceleration Factor:</span>
              <div className="flex gap-2">
                {[8, 16, 32].map((factor) => (
                  <button
                    key={factor}
                    onClick={() => setRapidFactor(factor)}
                    className={`w-12 justify-center py-0.5 rounded text-xs font-bold cursor-pointer shrink-0 select-none transition-colors ${
                      rapidFactor === factor ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {factor}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Oscilloscope with Saturation Visualizer & Block Diagram (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <ScopeChart
            data={data}
            isRunning={isRunning}
            onTogglePlay={() => setIsRunning(!isRunning)}
            onReset={handleReset}
            title="Heat Exchanger Temperature Response (Figure 12)"
            showSubTerms={false}
          />

          {/* Time Sequence Breakdown (t0 to t4) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs">
            <span className="font-bold text-amber-300 block mb-2 uppercase tracking-wide">
              The 5 Chronological Windup Phases (ILM Figure 12):
            </span>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px]">
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <strong className="text-sky-300 block">t₀: Steam Cut Off</strong>
                <span className="text-slate-400">Steam fails; PV begins falling toward 20%.</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <strong className="text-amber-300 block">t₁: Error Created</strong>
                <span className="text-slate-400">Large <MathFormula math="e = SP - PV" /> begins winding up bias.</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <strong className="text-rose-400 block">t₂: Steam Restored</strong>
                <span className="text-slate-400">Steam returns. FCE is already 100% open!</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <strong className="text-purple-300 block">t₃: PV Crosses SP</strong>
                <span className="text-slate-400">Error goes negative; unwinding first begins.</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <strong className="text-emerald-300 block">t₄: Bias Inside Limits</strong>
                <span className="text-slate-400">Valve finally closes. High overshoot incurred.</span>
              </div>
            </div>
          </div>

          {/* Block Diagram for Output Limits vs Reset Feedback */}
          <BlockDiagramSvg type={antiWindup === 'reset_feedback' ? 'reset_feedback' : 'out_lim'} />
        </div>
      </div>
    </div>
  );
};
