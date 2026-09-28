import React, { useState, useEffect, useRef } from 'react';
import { PIDParameters, SimulationDataPoint } from '../types/pid';
import { PIDSimulationEngine } from '../utils/pidSimulator';
import { ScopeChart } from './ScopeChart';
import { MathFormula } from './MathFormula';
import { Sliders, Volume2, ShieldAlert, Sparkles, Activity } from 'lucide-react';

export const DerivativeFilterLab: React.FC = () => {
  const [useDFilter, setUseDFilter] = useState<boolean>(true);
  const [filterMode, setFilterMode] = useState<'divisor' | 'multiplier'>('divisor');
  const [derivativeGainN, setDerivativeGainN] = useState<number>(10); // Divisor N (typical 8 to 20)
  const [filterAlpha, setFilterAlpha] = useState<number>(0.10);       // Multiplier alpha (typical 0.05 to 0.2)
  const [td, setTd] = useState<number>(0.5);                          // Derivative time in minutes
  const [noiseLevel, setNoiseLevel] = useState<number>(1.2);          // Sensor noise amplitude
  const [testScenario, setTestScenario] = useState<'noisy_pv' | 'ramp_pv'>('noisy_pv');

  // Simulation State
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [data, setData] = useState<SimulationDataPoint[]>([]);
  const engineRef = useRef<PIDSimulationEngine | null>(null);

  // Compute effective filter time constant
  const tdSec = td * 60;
  const effectiveN = filterMode === 'divisor' ? derivativeGainN : (1 / Math.max(0.01, filterAlpha));
  const tauDSec = useDFilter ? (tdSec / effectiveN) : 0;
  const tauDMin = tauDSec / 60;

  // Initialize Simulator
  useEffect(() => {
    const params: PIDParameters = {
      kc: 2.0,
      usePb: false,
      ti: 1.0,
      tiUnit: 'minutes',
      useResetRate: false,
      td,
      tdUnit: 'minutes',
      derivativeFilterGain: effectiveN,
      useDFilter,
      algorithm: 'standard',
      structure: 'pi_error_d_pv',
      spSoftening: 'step',
      spFilterTime: 1,
      spRampRate: 10,
      antiWindup: 'clamping',
      coMin: 0,
      coMax: 100,
      rapidUnwindFactor: 16,
      scanTime: 0.05,
      pvFilterTime: 0.02,
    };

    engineRef.current = new PIDSimulationEngine(params, {
      type: 'noisy_flow',
      gain: 1.0,
      tau: 4.0,
      deadTime: 0.2,
      noiseLevel: testScenario === 'noisy_pv' ? noiseLevel : 0,
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

  // Sync simulator
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateParams({
        td,
        useDFilter,
        derivativeFilterGain: effectiveN,
      });
      engineRef.current.updateProcess({
        noiseLevel: testScenario === 'noisy_pv' ? noiseLevel : 0,
      });
    }
  }, [td, useDFilter, effectiveN, noiseLevel, testScenario]);

  // Simulation Loop
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      if (engineRef.current) {
        const point = engineRef.current.step(0.05);
        setData((prev) => {
          const next = [...prev, point];
          const cutoff = point.t - 360;
          while (next.length > 100 && next[0].t < cutoff) next.shift();
          return next;
        });
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isRunning]);

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
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-pink-950/60 to-slate-900 border border-pink-800/40 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-pink-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" /> Derivative Action: Derivative Gain & Filter
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            D-Filter & Noise Dampening in High-Frequency Loops
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl">
            Pure derivative action responds aggressively to high-frequency sensor noise (e.g. turbulent flow or level sloshing), causing destructive valve chatter. Digital controllers provide a <strong>Derivative Filter / Gain</strong> parameter to soften derivative response and protect control valves.
          </p>
        </div>

        {/* Test Scenario Selector */}
        <div className="flex bg-slate-900 border border-slate-700 p-1 rounded-lg shrink-0">
          <button
            onClick={() => setTestScenario('noisy_pv')}
            className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer ${
              testScenario === 'noisy_pv' ? 'bg-pink-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Figure 11B: Noisy Signal Loop
          </button>
          <button
            onClick={() => setTestScenario('ramp_pv')}
            className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer ${
              testScenario === 'ramp_pv' ? 'bg-pink-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Figure 11A: Ramping PV
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sliders & Math (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="glass-panel rounded-xl p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-pink-400" /> D-Filter Tuning Parameters
              </span>
              <button
                onClick={() => setUseDFilter(!useDFilter)}
                className={`w-56 justify-center py-1 rounded text-xs font-bold transition-colors cursor-pointer shrink-0 select-none ${
                  useDFilter
                    ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-300'
                    : 'bg-rose-950/80 border border-rose-500/60 text-rose-300'
                }`}
              >
                {useDFilter ? 'D-FILTER: ACTIVE' : 'D-FILTER: OFF (RAW CHATTER!)'}
              </button>
            </div>

            {/* Filter Mode Selector: Divisor vs Multiplier */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Specification Format</span>
                <div className="flex bg-slate-950 border border-slate-800 rounded p-0.5">
                  <button
                    onClick={() => setFilterMode('divisor')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                      filterMode === 'divisor' ? 'bg-pink-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Divisor (N)
                  </button>
                  <button
                    onClick={() => setFilterMode('multiplier')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                      filterMode === 'multiplier' ? 'bg-pink-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Multiplier (α)
                  </button>
                </div>
              </div>

              {/* Slider for Divisor or Multiplier */}
              {filterMode === 'divisor' ? (
                <div className="flex flex-col gap-1 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Derivative Gain Divisor (<MathFormula math="N" />):</span>
                    <span className="font-mono text-pink-400 font-bold">{derivativeGainN}</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="30"
                    step="1"
                    value={derivativeGainN}
                    onChange={(e) => setDerivativeGainN(Number(e.target.value))}
                    className="w-full cursor-pointer accent-pink-500"
                  />
                  <div className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded mt-1">
                    <MathFormula
                      math={`\\tau_D = \\frac{T_d}{N} = \\frac{${td.toFixed(2)}\\text{ min}}{${derivativeGainN}} = ${tauDMin.toFixed(3)}\\text{ min} = ${tauDSec.toFixed(1)}\\text{ sec}`}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Filter Multiplier (<MathFormula math="\alpha" />):</span>
                    <span className="font-mono text-pink-400 font-bold">{filterAlpha.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.02"
                    max="0.50"
                    step="0.01"
                    value={filterAlpha}
                    onChange={(e) => setFilterAlpha(Number(e.target.value))}
                    className="w-full cursor-pointer accent-pink-500"
                  />
                  <div className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded mt-1">
                    <MathFormula
                      math={`\\tau_D = \\alpha \\times T_d = ${filterAlpha.toFixed(2)} \\times ${td.toFixed(2)}\\text{ min} = ${tauDMin.toFixed(3)}\\text{ min} = ${tauDSec.toFixed(1)}\\text{ sec}`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Derivative Time Slider */}
            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-200">Derivative Time (Td)</span>
                <span className="font-mono text-pink-400 font-bold">{td.toFixed(2)} min ({(td * 60).toFixed(0)} s)</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.05"
                value={td}
                onChange={(e) => setTd(Number(e.target.value))}
                className="w-full cursor-pointer accent-pink-500"
              />
            </div>

            {/* Sensor Noise Injection Slider */}
            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Process Measurement Noise
                </span>
                <span className="font-mono text-amber-400 font-bold">{noiseLevel.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="3.0"
                step="0.2"
                value={noiseLevel}
                onChange={(e) => setNoiseLevel(Number(e.target.value))}
                className="w-full cursor-pointer accent-amber-500"
              />
              <span className="text-[10px] text-slate-400">
                Simulates turbulent flow transmitter or boiling fluid ripples.
              </span>
            </div>

            {/* Warning when D-filter is off and noise is present */}
            {!useDFilter && noiseLevel > 0.5 && (
              <div className="bg-rose-950/80 border border-rose-500 p-2.5 rounded-lg flex items-center gap-2 text-xs text-rose-200 animate-pulse">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  <strong>SEVERE VALVE CHATTER DETECTED!</strong> High-frequency noise is being amplified by <MathFormula math="K_c T_d \frac{de}{dt}" /> into the control valve!
                </span>
              </div>
            )}

            {/* Math Formula Card */}
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg text-xs space-y-2">
              <span className="text-slate-400 font-semibold block">Filtered Derivative Transfer Function:</span>
              <MathFormula
                math="D(s) = \frac{T_d s}{1 + \frac{T_d}{N} s} \cdot (-PV(s))"
                block
              />
              <p className="text-[11px] text-slate-400">
                In pneumatic controllers, this was implemented with a small bellows-spring restriction needle. In digital controllers, it is programmed directly as a first-order digital filter.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Oscilloscope displaying chatter vs filtered (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <ScopeChart
            data={data}
            isRunning={isRunning}
            onTogglePlay={() => setIsRunning(!isRunning)}
            onReset={handleReset}
            title={useDFilter ? 'Filtered Derivative: Smooth CO Output' : 'Unfiltered Derivative: Severe Valve Chatter (Figure 11B)'}
            showSubTerms={true}
          />

          {/* Educational Comparison Card for Figures 11A and 11B */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="font-bold text-pink-400 mb-1">Figure 11A: Ramping PV Response</div>
              <p className="text-slate-300 text-[11px]">
                Without D-filter, an open-loop PV ramp causes CO to instantly jump by <MathFormula math="K_c T_d \times \text{slope}" />. With D-filter, the jump softens into a smooth asymptotic first-order curve with time constant <MathFormula math="\tau_D" />.
              </p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="font-bold text-pink-400 mb-1">Figure 11B: Noisy PV Response</div>
              <p className="text-slate-300 text-[11px]">
                High-frequency noise produces large derivative terms. Adding a derivative filter eliminates valve hunting and stroke oscillation, dramatically extending valve packing and diaphragm life!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
