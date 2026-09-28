import React, { useState, useEffect, useRef } from 'react';
import { PIDParameters, SimulationDataPoint } from '../types/pid';
import { PIDSimulationEngine } from '../utils/pidSimulator';
import { ScopeChart } from './ScopeChart';
import { BlockDiagramSvg } from './BlockDiagramSvg';
import { MathFormula } from './MathFormula';
import { ToggleLeft, ToggleRight, AlertOctagon, CheckCircle2, Sliders, ShieldCheck } from 'lucide-react';

export const BumplessTransferLab: React.FC = () => {
  const [isManual, setIsManual] = useState<boolean>(false);
  const [bumplessEnabled, setBumplessEnabled] = useState<boolean>(true);
  const [manualCo, setManualCo] = useState<number>(45);
  const [sp, setSp] = useState<number>(50);

  // Simulation State
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [data, setData] = useState<SimulationDataPoint[]>([]);
  const [bumpDetected, setBumpDetected] = useState<boolean>(false);
  const engineRef = useRef<PIDSimulationEngine | null>(null);

  // Initialize Simulator
  useEffect(() => {
    const params: PIDParameters = {
      kc: 2.5,
      usePb: false,
      ti: 0.8,
      tiUnit: 'minutes',
      useResetRate: false,
      td: 0.1,
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
      scanTime: 0.1,
      pvFilterTime: 0.05,
    };

    engineRef.current = new PIDSimulationEngine(params, {
      type: 'fopdt',
      gain: 1.0,
      tau: 6.0,
      deadTime: 0.8,
      noiseLevel: 0.05,
      ambientTemp: 20,
      steamAvailable: true,
    });

    const initialData: SimulationDataPoint[] = [];
    for (let i = 0; i < 20; i++) {
      initialData.push(engineRef.current.step(0.1));
    }
    setData(initialData);
  }, []);

  // Sync mode and bumpless settings
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setBumplessEnabled(bumplessEnabled);
      engineRef.current.setManual(isManual);
    }
  }, [isManual, bumplessEnabled]);

  useEffect(() => {
    if (engineRef.current && isManual) {
      engineRef.current.setManualCo(manualCo);
    }
  }, [manualCo, isManual]);

  // Simulation Loop
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      if (engineRef.current) {
        const point = engineRef.current.step(0.1);
        setData((prev) => {
          // Detect bump (sudden CO spike > 15% in one step)
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            if (Math.abs(point.co - last.co) > 15) {
              setBumpDetected(true);
            }
          }
          const next = [...prev, point];
          if (next.length > 350) next.shift();
          return next;
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning]);

  const handleToggleMode = () => {
    setBumpDetected(false);
    setIsManual(!isManual);
  };

  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.reset(20, 50);
      setData([]);
      setBumpDetected(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-800/40 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" /> Control Issues: Bumpless Transfer
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Manual ↔ Automatic Mode Switching Without Process Shock
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl">
            Switching a controller between <strong>Manual</strong> and <strong>Automatic</strong> must not cause the controller output (CO) to jump. A sudden jump in signal to the Final Control Element (FCE) causes severe valve stroke transients that can trip a plant down.
          </p>
        </div>

        {/* Big Mode Switch Station */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-lg shrink-0">
          <span className={`text-xs font-bold ${!isManual ? 'text-emerald-400' : 'text-slate-500'}`}>AUTO</span>
          <button
            onClick={handleToggleMode}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors cursor-pointer ${
              isManual ? 'bg-amber-600' : 'bg-emerald-600'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                isManual ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-xs font-bold ${isManual ? 'text-amber-400' : 'text-slate-500'}`}>MANUAL</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Station Controls (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="glass-panel rounded-xl p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" /> Operator Station Controls
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${isManual ? 'bg-amber-900/60 text-amber-300 border border-amber-600' : 'bg-emerald-900/60 text-emerald-300 border border-emerald-600'}`}>
                CURRENT MODE: {isManual ? 'MANUAL (MAN)' : 'AUTOMATIC (AUTO)'}
              </span>
            </div>

            {/* Bumpless Tracking Feature Toggle */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Bumpless Transfer Logic
                  </span>
                  <span className="text-[11px] text-slate-400">
                    The 3 Digital Programming Requirements
                  </span>
                </div>
                <button
                  onClick={() => setBumplessEnabled(!bumplessEnabled)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    bumplessEnabled
                      ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-300'
                      : 'bg-rose-950/80 border border-rose-500/60 text-rose-300'
                  }`}
                >
                  {bumplessEnabled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertOctagon className="w-3.5 h-3.5" />}
                  {bumplessEnabled ? 'ENABLED (BUMPLESS)' : 'DISABLED (BUMPY!)'}
                </button>
              </div>

              {/* The 3 Golden Rules Checklist */}
              <div className="bg-slate-950/70 p-2.5 rounded text-[11px] text-slate-300 space-y-1 border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${bumplessEnabled ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                  <span><strong>Rule 1:</strong> SP tracks PV in manual (<MathFormula math="SP = PV \implies e = 0" />)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${bumplessEnabled ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                  <span><strong>Rule 2:</strong> PID algorithm output tracks CO in manual</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${bumplessEnabled ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                  <span><strong>Rule 3:</strong> Manual output setting tracks CO in automatic</span>
                </div>
              </div>
            </div>

            {/* Manual Output Slider */}
            <div className={`p-3 rounded-lg border flex flex-col gap-2 transition ${
              isManual ? 'bg-amber-950/20 border-amber-500/40' : 'bg-slate-900/40 border-slate-800 opacity-60'
            }`}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-200">
                  Manual Output Setting (<MathFormula math="CO_M" />)
                </span>
                <span className="font-mono text-amber-300 font-bold">{manualCo}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={manualCo}
                disabled={!isManual}
                onChange={(e) => setManualCo(Number(e.target.value))}
                className="w-full cursor-pointer accent-amber-500"
              />
              <span className="text-[10px] text-slate-400">
                {isManual ? 'Move slider to steer valve manually, then switch to AUTO.' : 'Auto mode active: CO is driven by PID.'}
              </span>
            </div>

            {/* Setpoint Slider */}
            <div className={`p-3 rounded-lg border flex flex-col gap-2 transition ${
              !isManual ? 'bg-sky-950/20 border-sky-500/40' : 'bg-slate-900/40 border-slate-800 opacity-60'
            }`}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-sky-200">Setpoint (SP)</span>
                <span className="font-mono text-sky-300 font-bold">{sp}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={sp}
                disabled={isManual && bumplessEnabled}
                onChange={(e) => {
                  setSp(Number(e.target.value));
                  if (engineRef.current && !isManual) {
                    engineRef.current.setTargetSp(Number(e.target.value));
                  }
                }}
                className="w-full cursor-pointer accent-sky-500"
              />
              <span className="text-[10px] text-slate-400">
                {isManual && bumplessEnabled ? 'Locked: SP is tracking PV continuously (Rule 1).' : 'Active setpoint.'}
              </span>
            </div>

            {/* Process Bump Warning */}
            {bumpDetected && (
              <div className="bg-rose-950/80 border border-rose-500 p-3 rounded-lg flex items-center gap-2.5 text-xs text-rose-200 animate-bounce">
                <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <strong className="block text-rose-300">PROCESS SHOCK DETECTED!</strong>
                  Bumpless transfer was disabled. The sudden jump in CO shocked the process!
                </div>
              </div>
            )}

            {/* LaTeX Math Proof */}
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg text-xs space-y-2">
              <span className="text-slate-400 font-semibold block">Mathematical Mechanism:</span>
              <div className="text-[11px] text-slate-300">
                In automatic mode, the PID proportional kick is:
                <MathFormula math="\Delta CO_P = K_c \cdot (SP - PV)" block />
                Because <strong>Rule 1</strong> forces <MathFormula math="SP = PV" /> in manual, <MathFormula math="(SP - PV) = 0" />, ensuring:
                <MathFormula math="\Delta CO_P = 0" block />
                And because <strong>Rule 2</strong> sets <MathFormula math="I = CO_M" />, the total step jump is identically zero:
                <MathFormula math="CO(t_{\text{switch}}^+) - CO(t_{\text{switch}}^-) = 0" block />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Real-time chart + Animated Function Block (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <ScopeChart
            data={data}
            isRunning={isRunning}
            onTogglePlay={() => setIsRunning(!isRunning)}
            onReset={handleReset}
            title={`Mode Transfer Dynamics (${isManual ? 'MANUAL' : 'AUTOMATIC'})`}
            showSubTerms={false}
          />

          {/* Interactive Block Diagram (Figure 4A or 4B) */}
          <BlockDiagramSvg type={isManual ? 'bumpless_man' : 'bumpless_auto'} />
        </div>
      </div>
    </div>
  );
};
