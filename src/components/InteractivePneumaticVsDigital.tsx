import React, { useState, useEffect, useRef } from 'react';
import { PIDParameters, SimulationDataPoint, PIDAlgorithmType } from '../types/pid';
import { PIDSimulationEngine } from '../utils/pidSimulator';
import { ScopeChart } from './ScopeChart';
import { BlockDiagramSvg } from './BlockDiagramSvg';
import { MathFormula } from './MathFormula';
import { Sliders, RefreshCw, Zap, HelpCircle } from 'lucide-react';

export const InteractivePneumaticVsDigital: React.FC = () => {
  // PID Settings
  const [algorithm, setAlgorithm] = useState<PIDAlgorithmType>('interactive');
  const [kc, setKc] = useState<number>(2.0);
  const [usePb, setUsePb] = useState<boolean>(false);
  const [ti, setTi] = useState<number>(1.0); // minutes
  const [tiUnit, setTiUnit] = useState<'minutes' | 'seconds'>('minutes');
  const [useResetRate, setUseResetRate] = useState<boolean>(false);
  const [td, setTd] = useState<number>(0.2); // minutes
  const [tdUnit, setTdUnit] = useState<'minutes' | 'seconds'>('minutes');

  // Simulation State
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [data, setData] = useState<SimulationDataPoint[]>([]);
  const engineRef = useRef<PIDSimulationEngine | null>(null);

  // Computed Proportional Band & Reset Rate
  const pbValue = Number((100 / Math.max(0.01, kc)).toFixed(1));
  const tiSec = tiUnit === 'minutes' ? ti * 60 : ti;
  const tdSec = tdUnit === 'minutes' ? td * 60 : td;
  const resetRatePerMin = Number((60 / Math.max(0.1, tiSec)).toFixed(2));
  const resetRatePerSec = Number((1 / Math.max(0.1, tiSec)).toFixed(3));

  // Interactive series effective parameters
  const interactionRatio = Number((1 + tdSec / Math.max(0.1, tiSec)).toFixed(2));
  const effectiveKc = Number((kc * (1 + tdSec / Math.max(0.1, tiSec))).toFixed(2));
  const effectiveTiSec = Number((tiSec + tdSec).toFixed(1));
  const effectiveTdSec = Number(((tiSec * tdSec) / Math.max(0.1, tiSec + tdSec)).toFixed(2));

  // Parallel equivalent parameters
  const parallelKp = kc;
  const parallelKi = Number((kc / Math.max(0.1, tiSec)).toFixed(3));
  const parallelKd = Number((kc * tdSec).toFixed(2));

  // Initialize Simulator
  useEffect(() => {
    const params: PIDParameters = {
      kc,
      usePb,
      ti,
      tiUnit,
      useResetRate,
      td,
      tdUnit,
      derivativeFilterGain: 10,
      useDFilter: true,
      algorithm,
      structure: 'pid_on_error',
      spSoftening: 'step',
      spFilterTime: 2,
      spRampRate: 5,
      antiWindup: 'clamping',
      coMin: 0,
      coMax: 100,
      rapidUnwindFactor: 16,
      scanTime: 0.1,
      pvFilterTime: 0.05,
    };

    engineRef.current = new PIDSimulationEngine(params, {
      type: 'fopdt',
      gain: 1.0,
      tau: 8.0,
      deadTime: 1.0,
      noiseLevel: 0.1,
      ambientTemp: 20,
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

  // Sync parameter changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateParams({
        kc,
        ti,
        tiUnit,
        td,
        tdUnit,
        algorithm,
      });
    }
  }, [kc, ti, tiUnit, td, tdUnit, algorithm]);

  // Simulation Animation Loop
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

  const handleStepChange = (newSp: number) => {
    if (engineRef.current) {
      engineRef.current.setTargetSp(newSp);
    }
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
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner / Objective Note */}
      <div className="bg-gradient-to-r from-sky-950/60 to-slate-900 border border-sky-800/40 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Zap className="w-4 h-4" /> Objective One: Control Algorithms & Tuning Units
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Interactive vs Standard (ISA) vs Parallel Algorithms
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl">
            Pneumatic controllers use mechanical bellows that create an <strong>Interactive (Series)</strong> algorithm where proportional, integral, and derivative actions interact. Digital controllers can execute <strong>Standard (Non-interactive)</strong> or <strong>Parallel (Independent)</strong> algorithms.
          </p>
        </div>

        {/* Algorithm Switcher */}
        <div className="flex bg-slate-900/90 border border-slate-700 p-1 rounded-lg shrink-0">
          <button
            onClick={() => setAlgorithm('interactive')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition cursor-pointer ${
              algorithm === 'interactive' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Interactive (Pneumatic)
          </button>
          <button
            onClick={() => setAlgorithm('standard')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition cursor-pointer ${
              algorithm === 'standard' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Standard (ISA)
          </button>
          <button
            onClick={() => setAlgorithm('parallel')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition cursor-pointer ${
              algorithm === 'parallel' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Parallel
          </button>
        </div>
      </div>

      {/* Main Grid: Controls + Live Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sliders and Formula Breakdown (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="glass-panel rounded-xl p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-400" /> Controller Tuning Settings
              </span>
              <button
                onClick={() => {
                  setKc(2.0);
                  setTi(1.0);
                  setTd(0.2);
                  setAlgorithm('interactive');
                }}
                className="text-[11px] text-slate-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Reset Defaults
              </button>
            </div>

            {/* Proportional Control Slider */}
            <div className="flex flex-col gap-2 bg-slate-900/60 border border-slate-800/80 p-3 rounded-lg">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200">
                    {usePb ? 'Proportional Band (PB)' : 'Proportional Gain (Kc)'}
                  </span>
                  <button
                    onClick={() => setUsePb(!usePb)}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-sky-300 px-2 py-0.5 rounded border border-slate-700 cursor-pointer"
                  >
                    Switch to {usePb ? 'Gain (Kc)' : 'PB (%)'}
                  </button>
                </div>
                <span className="font-mono text-sky-400 font-bold">
                  {usePb ? `${pbValue}%` : `Kc = ${kc.toFixed(2)}`}
                </span>
              </div>

              {usePb ? (
                <input
                  type="range"
                  min="10"
                  max="400"
                  step="5"
                  value={pbValue}
                  onChange={(e) => {
                    const newPb = Number(e.target.value);
                    setKc(Number((100 / newPb).toFixed(2)));
                  }}
                  className="w-full cursor-pointer"
                />
              ) : (
                <input
                  type="range"
                  min="0.2"
                  max="10.0"
                  step="0.1"
                  value={kc}
                  onChange={(e) => setKc(Number(e.target.value))}
                  className="w-full cursor-pointer"
                />
              )}

              {/* Conversion LaTeX display */}
              <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded border border-slate-800/80">
                <MathFormula
                  math={usePb 
                    ? `PB = \\frac{100\\%}{K_c} = \\frac{100\\%}{${kc.toFixed(2)}} = ${pbValue}\\%`
                    : `K_c = \\frac{100\\%}{PB} = \\frac{100\\%}{${pbValue}\\%} = ${kc.toFixed(2)}`
                  }
                />
              </div>
            </div>

            {/* Integral Control Slider */}
            <div className="flex flex-col gap-2 bg-slate-900/60 border border-slate-800/80 p-3 rounded-lg">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200">
                    {useResetRate ? 'Reset Rate' : 'Integral Time (Ti)'}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setTiUnit(tiUnit === 'minutes' ? 'seconds' : 'minutes')}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-300 px-1.5 py-0.5 rounded border border-slate-700 cursor-pointer"
                    >
                      {tiUnit === 'minutes' ? 'min' : 'sec'}
                    </button>
                    <button
                      onClick={() => setUseResetRate(!useResetRate)}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-300 px-1.5 py-0.5 rounded border border-slate-700 cursor-pointer"
                    >
                      {useResetRate ? 'Time' : 'Rate'}
                    </button>
                  </div>
                </div>
                <span className="font-mono text-amber-400 font-bold">
                  {useResetRate
                    ? `${tiUnit === 'minutes' ? resetRatePerMin : resetRatePerSec} rep/${tiUnit === 'minutes' ? 'min' : 's'}`
                    : `${ti.toFixed(2)} ${tiUnit}`}
                </span>
              </div>

              <input
                type="range"
                min={tiUnit === 'minutes' ? 0.1 : 5}
                max={tiUnit === 'minutes' ? 5.0 : 300}
                step={tiUnit === 'minutes' ? 0.05 : 1}
                value={ti}
                onChange={(e) => setTi(Number(e.target.value))}
                className="w-full cursor-pointer accent-amber-500"
              />

              {/* Reciprocal Unit Formula */}
              <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded border border-slate-800/80">
                <MathFormula
                  math={`\\text{Reset Rate} = \\frac{1}{T_i} = \\frac{1}{${ti.toFixed(2)}\\text{ ${tiUnit === 'minutes' ? 'min' : 's'}}} = ${tiUnit === 'minutes' ? resetRatePerMin : resetRatePerSec}\\text{ repeats/${tiUnit === 'minutes' ? 'min' : 'sec'}}`}
                />
              </div>
            </div>

            {/* Derivative Control Slider */}
            <div className="flex flex-col gap-2 bg-slate-900/60 border border-slate-800/80 p-3 rounded-lg">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200">Derivative Time (Td)</span>
                  <button
                    onClick={() => setTdUnit(tdUnit === 'minutes' ? 'seconds' : 'minutes')}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-pink-300 px-1.5 py-0.5 rounded border border-slate-700 cursor-pointer"
                  >
                    {tdUnit === 'minutes' ? 'min' : 'sec'}
                  </button>
                </div>
                <span className="font-mono text-pink-400 font-bold">
                  {td.toFixed(2)} {tdUnit}
                </span>
              </div>

              <input
                type="range"
                min="0"
                max={tdUnit === 'minutes' ? 2.0 : 120}
                step={tdUnit === 'minutes' ? 0.02 : 1}
                value={td}
                onChange={(e) => setTd(Number(e.target.value))}
                className="w-full cursor-pointer accent-pink-500"
              />

              <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded border border-slate-800/80">
                <MathFormula
                  math={`T_d = ${td.toFixed(2)}\\text{ ${tdUnit}} = ${(tdUnit === 'minutes' ? td * 60 : td / 60).toFixed(2)}\\text{ ${tdUnit === 'minutes' ? 'sec' : 'min'}}`}
                />
              </div>
            </div>

            {/* Algorithm Math Transfer Function Card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs">
              <span className="text-slate-400 font-semibold block mb-1">
                Active Transfer Function ({algorithm.toUpperCase()}):
              </span>
              {algorithm === 'interactive' && (
                <div className="space-y-2">
                  <MathFormula
                    math="CO(s) = K_c \\left(\\frac{T_i s + 1}{T_i s}\\right) \\left(T_d s + 1\\right) E(s)"
                    block
                  />
                  <div className="text-[11px] text-amber-300 border-t border-slate-800/80 pt-1.5">
                    <strong>Pneumatic Interaction Multiplier:</strong>
                    <div className="mt-1">
                      <MathFormula
                        math={`K_c' = K_c \\left(1 + \\frac{T_d}{T_i}\\right) = ${kc.toFixed(2)} \\times ${interactionRatio} = ${effectiveKc}`}
                      />
                    </div>
                    <div className="mt-1">
                      <MathFormula
                        math={`T_i' = T_i + T_d = ${effectiveTiSec}\\text{ s}, \\quad T_d' = \\frac{T_i T_d}{T_i + T_d} = ${effectiveTdSec}\\text{ s}`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {algorithm === 'standard' && (
                <div className="space-y-2">
                  <MathFormula
                    math="CO(s) = K_c \\left( 1 + \\frac{1}{T_i s} + T_d s \\right) E(s)"
                    block
                  />
                  <p className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-1">
                    <MathFormula math="K_c" /> scales both Integral and Derivative, but <strong className="text-slate-200">Integral does NOT affect Derivative</strong>.
                  </p>
                </div>
              )}

              {algorithm === 'parallel' && (
                <div className="space-y-2">
                  <MathFormula
                    math="CO(s) = \\left( K_p + \\frac{K_i}{s} + K_d s \\right) E(s)"
                    block
                  />
                  <div className="text-[11px] text-emerald-300 border-t border-slate-800/80 pt-1 space-y-0.5">
                    <div>Equivalent gains: <MathFormula math={`K_p = ${parallelKp.toFixed(2)}`} /></div>
                    <div><MathFormula math={`K_i = \\frac{K_c}{T_i} = ${parallelKi} \\text{ s}^{-1}`} /></div>
                    <div><MathFormula math={`K_d = K_c T_d = ${parallelKd} \\text{ s}`} /></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Scope & Test Stimulus (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <ScopeChart
            data={data}
            isRunning={isRunning}
            onTogglePlay={() => setIsRunning(!isRunning)}
            onReset={handleReset}
            title={`${algorithm.toUpperCase()} PID Loop Response`}
            showSubTerms={true}
          />

          {/* Quick Stimulus Bar */}
          <div className="glass-panel rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Apply Setpoint Step:
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStepChange(30)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
              >
                Set to 30%
              </button>
              <button
                onClick={() => handleStepChange(50)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
              >
                Set to 50%
              </button>
              <button
                onClick={() => handleStepChange(70)}
                className="px-2.5 py-1 rounded bg-amber-900/40 hover:bg-amber-800/60 text-amber-300 border border-amber-600/40 font-bold cursor-pointer"
              >
                Step +20% (to 70%)
              </button>
              <button
                onClick={() => handleStepChange(90)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
              >
                Set to 90%
              </button>
            </div>
          </div>

          {/* Interactive Block Diagram */}
          <BlockDiagramSvg type={algorithm} />
        </div>
      </div>
    </div>
  );
};
