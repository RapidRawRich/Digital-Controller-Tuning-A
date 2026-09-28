import React, { useState, useEffect, useRef } from 'react';
import { PIDParameters, SimulationDataPoint } from '../types/pid';
import { PIDSimulationEngine } from '../utils/pidSimulator';
import { ScopeChart } from './ScopeChart';
import { MathFormula } from './MathFormula';
import { Cpu, AlertTriangle, Sliders, Zap, CheckCircle2 } from 'lucide-react';

export const DigitalScanLab: React.FC = () => {
  const [scanTime, setScanTime] = useState<number>(0.2); // seconds (0.05 to 2.5)
  const [pvFilterTime, setPvFilterTime] = useState<number>(0.1); // dampening time in seconds
  const [kc, setKc] = useState<number>(3.0);

  // Simulation State
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [data, setData] = useState<SimulationDataPoint[]>([]);
  const engineRef = useRef<PIDSimulationEngine | null>(null);

  // Recommended filter time = 0.5 * scanTime (from ILM pg 7)
  const recommendedFilter = Number((0.5 * scanTime).toFixed(2));
  const addedDeadTime = Number((0.5 * scanTime).toFixed(2));
  const isFilterExcessive = pvFilterTime > scanTime;

  // Initialize Simulator
  useEffect(() => {
    const params: PIDParameters = {
      kc,
      usePb: false,
      ti: 0.5,
      tiUnit: 'minutes',
      useResetRate: false,
      td: 0.05,
      tdUnit: 'minutes',
      derivativeFilterGain: 10,
      useDFilter: true,
      algorithm: 'standard',
      structure: 'pid_on_error',
      spSoftening: 'step',
      spFilterTime: 1,
      spRampRate: 10,
      antiWindup: 'clamping',
      coMin: 0,
      coMax: 100,
      rapidUnwindFactor: 16,
      scanTime,
      pvFilterTime,
    };

    engineRef.current = new PIDSimulationEngine(params, {
      type: 'fopdt',
      gain: 1.0,
      tau: 3.0, // fast loop to show scan time impact clearly
      deadTime: 0.2 + addedDeadTime,
      noiseLevel: 0.4,
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
        kc,
        scanTime,
        pvFilterTime,
      });
      engineRef.current.updateProcess({
        deadTime: 0.2 + addedDeadTime,
      });
    }
  }, [kc, scanTime, pvFilterTime, addedDeadTime]);

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

  const handleStep = (target: number) => {
    if (engineRef.current) {
      engineRef.current.setTargetSp(target);
    }
  };

  const handleApplyRecommended = () => {
    setPvFilterTime(recommendedFilter);
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
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-violet-950/60 to-slate-900 border border-violet-800/40 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-violet-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4" /> Digital Implementation: Scan Time & Dead Time
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Microprocessor Execution Delays & Transmitter Dampening
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl">
            Unlike analog controllers that react instantaneously, digital controllers run code on discrete execution cycles (scan time). This sampling delay introduces <strong>effective dead time</strong> into the control loop. Excessive transmitter dampening adds even more dead time, destabilizing fast loops!
          </p>
        </div>

        {/* Quick Step Buttons */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => handleStep(40)}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
          >
            SP = 40%
          </button>
          <button
            onClick={() => handleStep(75)}
            className="px-3 py-1.5 rounded bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow cursor-pointer flex items-center gap-1"
          >
            <Zap className="w-3.5 h-3.5" />
            Step SP to 75%
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sliders and Digital Implementation Rules (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="glass-panel rounded-xl p-4 flex flex-col gap-4">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Sliders className="w-3.5 h-3.5 text-violet-400" /> Digital Hardware & Filter Settings
            </span>

            {/* Controller Scan Time Slider */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-200">Controller Scan Rate (<MathFormula math="\Delta t_{\text{scan}}" />)</span>
                <span className="font-mono text-violet-400 font-bold">{scanTime.toFixed(2)}s ({Math.round(1 / scanTime)} Hz)</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="2.0"
                step="0.05"
                value={scanTime}
                onChange={(e) => setScanTime(Number(e.target.value))}
                className="w-full cursor-pointer accent-violet-500"
              />
              <div className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded">
                <MathFormula math={`\\theta_{\\text{added dead time}} \\approx 0.5 \\times \\Delta t_{\\text{scan}} = ${addedDeadTime}s`} />
              </div>
            </div>

            {/* PV Filter / Dampening Time Slider */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-200">Transmitter Dampening Time</span>
                <span className={`font-mono font-bold ${isFilterExcessive ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {pvFilterTime.toFixed(2)}s
                </span>
              </div>
              <input
                type="range"
                min="0.01"
                max="3.0"
                step="0.05"
                value={pvFilterTime}
                onChange={(e) => setPvFilterTime(Number(e.target.value))}
                className="w-full cursor-pointer accent-emerald-500"
              />
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-400">
                  Recommended: <MathFormula math={`0.5 \\times \\text{scan} = ${recommendedFilter}\\text{s}`} />
                </span>
                <button
                  onClick={handleApplyRecommended}
                  className="px-2 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-semibold cursor-pointer"
                >
                  Apply {recommendedFilter}s
                </button>
              </div>
            </div>

            {/* Loop Gain Slider */}
            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-200">Controller Gain (Kc)</span>
                <span className="font-mono text-sky-400 font-bold">{kc.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="8.0"
                step="0.5"
                value={kc}
                onChange={(e) => setKc(Number(e.target.value))}
                className="w-full cursor-pointer accent-sky-500"
              />
              <span className="text-[10px] text-slate-400">
                Notice how large scan times or excessive dampening cause high-gain loops to oscillate wildly due to added dead time!
              </span>
            </div>

            {/* Warning if Dampening > Scan Time */}
            {isFilterExcessive && (
              <div className="bg-amber-950/80 border border-amber-500 p-2.5 rounded-lg flex items-center gap-2 text-xs text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>ILM WARNING (Page 7):</strong> Setting dampening time greater than the controller scan rate adds further dead time to the process!
                </span>
              </div>
            )}

            {/* Summary Card */}
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg text-xs space-y-2">
              <span className="text-slate-400 font-semibold block">Alberta Apprenticeship Rules of Thumb:</span>
              <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1">
                <li>Digital scan rate must be fast relative to process dynamics (typically 10x faster than process time constant).</li>
                <li>Recommended PV filter setting: <MathFormula math="\tau_{\text{filter}} = 0.5 \times \Delta t_{\text{scan}}" />.</li>
                <li>Flow loops have high measurement noise and may require heavier PV filtering.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Oscilloscope displaying discrete lag and oscillation (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <ScopeChart
            data={data}
            isRunning={isRunning}
            onTogglePlay={() => setIsRunning(!isRunning)}
            onReset={handleReset}
            title={`Discrete Execution Dynamics (Scan Time: ${scanTime}s | Added Delay: ${addedDeadTime}s)`}
            showSubTerms={false}
          />

          {/* Educational Comparison Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="font-bold text-violet-400 mb-1">Analog vs Digital Execution</div>
              <p className="text-slate-300 text-[11px]">
                An analog pneumatic controller evaluates balance of forces continuously and instantaneously. A digital DCS or PLC samples transmitters periodically, adding an effective phase lag of <MathFormula math="\approx \frac{\Delta t}{2}" />.
              </p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="font-bold text-emerald-400 mb-1">Transmitter Dampening Trade-Off</div>
              <p className="text-slate-300 text-[11px]">
                Dampening stabilizes jittery readings on differential pressure flow meters. However, every millisecond of dampening adds true process dead time, lowering the loop's ultimate gain and phase margin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
