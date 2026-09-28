import React, { useState, useEffect, useRef } from 'react';
import { PIDParameters, SimulationDataPoint, EquationStructureType, SpSofteningType } from '../types/pid';
import { PIDSimulationEngine } from '../utils/pidSimulator';
import { ScopeChart } from './ScopeChart';
import { MathFormula } from './MathFormula';
import { Sliders, Zap, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

export const SetpointKickLab: React.FC = () => {
  // Equation structure & softening
  const [structure, setStructure] = useState<EquationStructureType>('pid_on_error');
  const [softening, setSoftening] = useState<SpSofteningType>('step');
  const [filterTau, setFilterTau] = useState<number>(3.0); // seconds
  const [rampRate, setRampRate] = useState<number>(8.0);  // %/sec

  // Tuning Parameters
  const [kc, setKc] = useState<number>(2.5);
  const [ti, setTi] = useState<number>(0.8);
  const [td, setTd] = useState<number>(0.3);

  // Simulation State
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [data, setData] = useState<SimulationDataPoint[]>([]);
  const engineRef = useRef<PIDSimulationEngine | null>(null);

  // Kick Detection Flag
  const [kickDetected, setKickDetected] = useState<string | null>(null);

  // Initialize Simulator
  useEffect(() => {
    const params: PIDParameters = {
      kc,
      usePb: false,
      ti,
      tiUnit: 'minutes',
      useResetRate: false,
      td,
      tdUnit: 'minutes',
      derivativeFilterGain: 10,
      useDFilter: true,
      algorithm: 'standard',
      structure,
      spSoftening: softening,
      spFilterTime: filterTau,
      spRampRate: rampRate,
      antiWindup: 'clamping',
      coMin: 0,
      coMax: 100,
      rapidUnwindFactor: 16,
      scanTime: 0.05,
      pvFilterTime: 0.05,
    };

    engineRef.current = new PIDSimulationEngine(params, {
      type: 'fopdt',
      gain: 1.0,
      tau: 6.0,
      deadTime: 0.5,
      noiseLevel: 0.05,
      ambientTemp: 20,
      steamAvailable: true,
    });

    // Pre-seed 60 seconds of baseline historical points so graph starts 100% full
    const initialData: SimulationDataPoint[] = [];
    for (let t = -60; t <= 0; t += 0.2) {
      initialData.push({
        t: Number(t.toFixed(1)),
        sp: 40,
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

  // Update simulator parameters
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateParams({
        kc,
        ti,
        td,
        structure,
        spSoftening: softening,
        spFilterTime: filterTau,
        spRampRate: rampRate,
      });
    }
  }, [kc, ti, td, structure, softening, filterTau, rampRate]);

  // Simulation loop
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      if (engineRef.current) {
        const point = engineRef.current.step(0.05);
        setData((prev) => {
          // Detect kicks
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            if (point.dTerm > 30 && last.dTerm < 5) {
              setKickDetected('DERIVATIVE KICK: CO spiked due to infinite de/dt!');
            } else if (point.pTerm - last.pTerm > 20) {
              setKickDetected('PROPORTIONAL KICK: Step jump in error magnified by Kc!');
            }
          }
          const next = [...prev, point];
          const cutoff = point.t - 360;
          while (next.length > 100 && next[0].t < cutoff) next.shift();
          return next;
        });
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isRunning]);

  const handleStepTo = (target: number) => {
    setKickDetected(null);
    if (engineRef.current) {
      engineRef.current.setTargetSp(target);
    }
  };

  const handleDisturbance = () => {
    // Inject sudden load disturbance
    if (engineRef.current) {
      const currentPv = engineRef.current.getPv();
      engineRef.current.reset(Math.max(10, currentPv - 25), engineRef.current.getSp());
      setKickDetected('LOAD DISTURBANCE: Process upset applied! Observe identical rejection dynamics.');
    }
  };

  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.reset(20, 40);
      const resetData: SimulationDataPoint[] = [];
      for (let t = -60; t <= 0; t += 0.2) {
        resetData.push({
          t: Number(t.toFixed(1)),
          sp: 40,
          pv: 20,
          co: 0,
          rawCo: 0,
          pTerm: 0,
          iTerm: 0,
          dTerm: 0,
        });
      }
      setData(resetData);
      setKickDetected(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 to-slate-900 border border-amber-800/40 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
            <AlertTriangle className="w-4 h-4" /> Setpoint Changes: Proportional & Derivative Kick
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Setpoint Softening & Equation Structure Options
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl">
            When a controller calculates output on error <MathFormula math="e = SP - PV" />, an instantaneous step in setpoint causes <strong>Derivative Kick</strong> (spiking CO to its physical limit) and <strong>Proportional Kick</strong>. Digital controllers offer programmable softening and equation structures to eliminate kicks!
          </p>
        </div>

        {/* Quick Disturbance vs Step Buttons */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => handleStepTo(40)}
              className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
            >
              Step SP to 40%
            </button>
            <button
              onClick={() => handleStepTo(70)}
              className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold border border-amber-400 shadow cursor-pointer flex items-center gap-1"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              Step SP to 70% (Trigger Kick)
            </button>
          </div>
          <button
            onClick={handleDisturbance}
            className="px-2.5 py-1 rounded bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/50 text-purple-300 text-xs font-semibold cursor-pointer"
          >
            Apply Load Disturbance (-25% PV)
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Solution Selectors & Controls (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="glass-panel rounded-xl p-4 flex flex-col gap-4">
            {/* Method 1: Equation Structure Selector */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg flex flex-col gap-2">
              <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                Method 1: Equation Structure Options
              </span>
              
              <div className="flex flex-col gap-1.5">
                <label className={`p-2 rounded border flex items-center gap-2 cursor-pointer transition text-xs ${
                  structure === 'pid_on_error' ? 'bg-sky-950/80 border-sky-500 text-sky-200' : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}>
                  <input
                    type="radio"
                    name="structure"
                    checked={structure === 'pid_on_error'}
                    onChange={() => setStructure('pid_on_error')}
                  />
                  <div>
                    <strong className="block text-slate-100">PID on Error (Figure 8)</strong>
                    <span>P, I, and D all act on error <MathFormula math="e" />. Causes both P & D Kick!</span>
                  </div>
                </label>

                <label className={`p-2 rounded border flex items-center gap-2 cursor-pointer transition text-xs ${
                  structure === 'pi_error_d_pv' ? 'bg-sky-950/80 border-sky-500 text-sky-200' : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}>
                  <input
                    type="radio"
                    name="structure"
                    checked={structure === 'pi_error_d_pv'}
                    onChange={() => setStructure('pi_error_d_pv')}
                  />
                  <div>
                    <strong className="block text-slate-100">PI on Error, D on PV (Figure 9)</strong>
                    <span className="text-emerald-300 font-semibold">Eliminates Derivative Kick!</span> (P-kick remains).
                  </div>
                </label>

                <label className={`p-2 rounded border flex items-center gap-2 cursor-pointer transition text-xs ${
                  structure === 'i_error_pd_pv' ? 'bg-sky-950/80 border-sky-500 text-sky-200' : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}>
                  <input
                    type="radio"
                    name="structure"
                    checked={structure === 'i_error_pd_pv'}
                    onChange={() => setStructure('i_error_pd_pv')}
                  />
                  <div>
                    <strong className="block text-slate-100">I on Error, PD on PV (Figure 10)</strong>
                    <span className="text-emerald-300 font-semibold">Eliminates BOTH P & D Kick!</span> Smooth, no overshoot.
                  </div>
                </label>
              </div>
            </div>

            {/* Method 2: Setpoint Softening Selector */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg flex flex-col gap-2">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Method 2: Setpoint Softening
              </span>

              <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setSoftening('step')}
                  className={`py-1 rounded text-xs font-semibold cursor-pointer ${
                    softening === 'step' ? 'bg-amber-600 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Pure Step
                </button>
                <button
                  onClick={() => setSoftening('filter')}
                  className={`py-1 rounded text-xs font-semibold cursor-pointer ${
                    softening === 'filter' ? 'bg-amber-600 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  SP Filter (Fig 6)
                </button>
                <button
                  onClick={() => setSoftening('ramp')}
                  className={`py-1 rounded text-xs font-semibold cursor-pointer ${
                    softening === 'ramp' ? 'bg-amber-600 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  SP Ramp (Fig 7)
                </button>
              </div>

              {/* Dynamic Softening Controls */}
              {softening === 'filter' && (
                <div className="flex flex-col gap-1.5 pt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">Filter Time Constant (<MathFormula math="\tau_f" />):</span>
                    <span className="font-mono text-amber-300 font-bold">{filterTau.toFixed(1)}s</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="10.0"
                    step="0.5"
                    value={filterTau}
                    onChange={(e) => setFilterTau(Number(e.target.value))}
                    className="w-full cursor-pointer accent-amber-500"
                  />
                  <div className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded">
                    <MathFormula math="SP_f(s) = \frac{1}{\tau_f s + 1} SP(s)" />
                  </div>
                </div>
              )}

              {softening === 'ramp' && (
                <div className="flex flex-col gap-1.5 pt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">Ramp Slew Rate:</span>
                    <span className="font-mono text-amber-300 font-bold">{rampRate.toFixed(1)}%/sec</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="25.0"
                    step="1.0"
                    value={rampRate}
                    onChange={(e) => setRampRate(Number(e.target.value))}
                    className="w-full cursor-pointer accent-amber-500"
                  />
                  <div className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded">
                    <MathFormula math="\left|\frac{d(SP)}{dt}\right| \le R_{\text{ramp}} \implies \text{Finite D Pulse}" />
                  </div>
                </div>
              )}
            </div>

            {/* Kick Detected Notification */}
            {kickDetected && (
              <div className="bg-amber-950/80 border border-amber-500 p-2.5 rounded-lg flex items-center gap-2 text-xs text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{kickDetected}</span>
              </div>
            )}

            {/* LaTeX Math Reference */}
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg text-xs space-y-2">
              <span className="text-slate-400 font-semibold block">Mathematical Analysis of Kicks:</span>
              <div className="text-[11px] text-slate-300 space-y-1">
                <div>
                  <strong>Derivative Kick:</strong> If <MathFormula math="D(t) = K_c T_d \frac{d(SP - PV)}{dt}" />, a step in SP has <MathFormula math="\frac{d(SP)}{dt} \to \infty" /> causing CO to slam into full limit!
                </div>
                <div>
                  <strong>Proportional Kick:</strong> <MathFormula math="\Delta CO_P = K_c \cdot \Delta SP" />.
                </div>
                <div>
                  <strong>I on Error, PD on PV:</strong>
                  <MathFormula math="CO(t) = -K_c PV(t) + \frac{K_c}{T_i} \int e(\tau)d\tau - K_c T_d \frac{d(PV)}{dt}" block />
                  Both kicks are completely eliminated!
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Oscilloscope with P, I, D Sub-terms (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <ScopeChart
            data={data}
            isRunning={isRunning}
            onTogglePlay={() => setIsRunning(!isRunning)}
            onReset={handleReset}
            title={`Step Response (${structure.toUpperCase()} + ${softening.toUpperCase()})`}
            showSubTerms={true}
          />

          {/* Educational Comparison Card for Figures 8, 9, 10 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className={`p-3 rounded-xl border ${structure === 'pid_on_error' ? 'bg-sky-950/40 border-sky-500' : 'bg-slate-900/60 border-slate-800'}`}>
              <div className="font-bold text-sky-400 mb-1">Figure 8: PID on Error</div>
              <p className="text-slate-300 text-[11px]">
                Both proportional and derivative kick occur simultaneously. CO slams into upper limit, causing significant PV overshoot!
              </p>
            </div>
            <div className={`p-3 rounded-xl border ${structure === 'pi_error_d_pv' ? 'bg-sky-950/40 border-sky-500' : 'bg-slate-900/60 border-slate-800'}`}>
              <div className="font-bold text-sky-400 mb-1">Figure 9: PI on Error, D on PV</div>
              <p className="text-slate-300 text-[11px]">
                Derivative kick is completely eliminated. Slight proportional kick remains. Popular standard that does not affect tuning!
              </p>
            </div>
            <div className={`p-3 rounded-xl border ${structure === 'i_error_pd_pv' ? 'bg-sky-950/40 border-sky-500' : 'bg-slate-900/60 border-slate-800'}`}>
              <div className="font-bold text-sky-400 mb-1">Figure 10: I on Error, PD on PV</div>
              <p className="text-slate-300 text-[11px]">
                Zero initial kick! PV reaches setpoint smoothly without overshoot. Retains identical load disturbance rejection!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
