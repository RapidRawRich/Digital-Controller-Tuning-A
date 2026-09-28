import React, { useState, useEffect, useRef } from 'react';
import { PIDParameters, SimulationDataPoint } from '../types/pid';
import { PIDSimulationEngine } from '../utils/pidSimulator';
import { ScopeChart } from './ScopeChart';
import { BlockDiagramSvg } from './BlockDiagramSvg';
import { MathFormula } from './MathFormula';
import { AlertOctagon, CheckCircle2, Sliders, ShieldCheck, Zap } from 'lucide-react';

export const BumplessTransferLab: React.FC = () => {
  const [isManual, setIsManual] = useState<boolean>(false);
  const [bumplessEnabled, setBumplessEnabled] = useState<boolean>(true);
  const [manualCo, setManualCo] = useState<number>(30);
  const [sp, setSp] = useState<number>(50);

  // Simulation State
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [data, setData] = useState<SimulationDataPoint[]>([]);
  const [bumpDetected, setBumpDetected] = useState<boolean>(false);
  const [lastTransferInfo, setLastTransferInfo] = useState<string | null>(null);
  const engineRef = useRef<PIDSimulationEngine | null>(null);

  // Initialize Simulator
  useEffect(() => {
    const params: PIDParameters = {
      kc: 1.5,
      usePb: false,
      ti: 0.2, // 12 seconds - responsive, stable PI reset time
      tiUnit: 'minutes',
      useResetRate: false,
      td: 0.0, // PI controller - eliminates derivative kick & phase lag
      tdUnit: 'minutes',
      derivativeFilterGain: 10,
      useDFilter: true,
      algorithm: 'standard',
      structure: 'pi_error_d_pv',
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
      tau: 5.0,
      deadTime: 0.4,
      noiseLevel: 0.05,
      ambientTemp: 20,
      steamAvailable: true,
    });
    engineRef.current.reset(50, 50);

    // Pre-seed 60 seconds of baseline historical points in steady equilibrium (SP=50%, PV=50%, CO=30%)
    const initialData: SimulationDataPoint[] = [];
    for (let t = -60; t <= 0; t += 0.2) {
      initialData.push({
        t: Number(t.toFixed(1)),
        sp: 50,
        pv: 50,
        co: 30,
        rawCo: 30,
        pTerm: 0,
        iTerm: 30,
        dTerm: 0,
      });
    }
    setData(initialData);
  }, []);

  // Sync mode and bumpless settings to engine on toggle
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setBumplessEnabled(bumplessEnabled);
    }
  }, [bumplessEnabled]);

  // Auto-dismiss bump detection warning after 4.5 seconds
  useEffect(() => {
    if (bumpDetected) {
      const timer = setTimeout(() => {
        setBumpDetected(false);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [bumpDetected]);

  // Simulation Loop
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      if (engineRef.current) {
        const point = engineRef.current.step(0.1);

        // Keep UI readouts & sliders tracking active signals according to Alberta ILM Rules:
        if (!isManual && bumplessEnabled) {
          // Rule 3: Manual output setting tracks CO in automatic
          setManualCo(Number(point.co.toFixed(1)));
        } else if (isManual && bumplessEnabled) {
          // Rule 1: SP tracks PV in manual
          setSp(Number(point.pv.toFixed(1)));
        }

        setData((prev) => {
          // Detect bump (sudden CO spike > 12% in one step)
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            const deltaCo = Math.abs(point.co - last.co);
            if (deltaCo > 12) {
              setBumpDetected(true);
              setLastTransferInfo(`Valve step jump: ${deltaCo.toFixed(1)}% (Process Shocked!)`);
            }
          }
          const next = [...prev, point];
          const cutoff = point.t - 360;
          while (next.length > 100 && next[0].t < cutoff) next.shift();
          return next;
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, isManual, bumplessEnabled]);

  const handleToggleMode = () => {
    const nextManual = !isManual;
    setIsManual(nextManual);
    if (engineRef.current) {
      const coBefore = engineRef.current.getCo();
      engineRef.current.setManual(nextManual);
      const coAfter = engineRef.current.getCo();
      const deltaCo = Math.abs(coAfter - coBefore);

      if (nextManual) {
        // Auto -> Manual
        if (bumplessEnabled) {
          setManualCo(Number(coAfter.toFixed(1)));
          setLastTransferInfo('Switched to MANUAL: Zero valve bump (Rule 3 kept dial aligned).');
        } else {
          setLastTransferInfo(`Switched to MANUAL: Jumped by ${deltaCo.toFixed(1)}% to unaligned dial!`);
        }
      } else {
        // Manual -> Auto
        if (bumplessEnabled) {
          setSp(Number(engineRef.current.getPv().toFixed(1)));
          setLastTransferInfo('Switched to AUTO: Zero valve bump (Rules 1 & 2 ensured e=0 and I=COm).');
        } else {
          setLastTransferInfo(`Switched to AUTO: Proportional/Integral kick shocked valve!`);
        }
      }
    }
  };

  const handleToggleBumpless = () => {
    const next = !bumplessEnabled;
    setBumplessEnabled(next);
    if (engineRef.current) {
      engineRef.current.setBumplessEnabled(next);
    }
  };

  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.reset(50, 50);
      setIsManual(false);
      setManualCo(30);
      setSp(50);
      const resetData: SimulationDataPoint[] = [];
      for (let t = -60; t <= 0; t += 0.2) {
        resetData.push({
          t: Number(t.toFixed(1)),
          sp: 50,
          pv: 50,
          co: 30,
          rawCo: 30,
          pTerm: 0,
          iTerm: 30,
          dTerm: 0,
        });
      }
      setData(resetData);
      setBumpDetected(false);
      setLastTransferInfo(null);
    }
  };

  // Quick Scenario Preset 1: Smooth Bumpless Transfer Demo (Auto <-> Man)
  const handleDemoBumpless = () => {
    if (!bumplessEnabled) {
      setBumplessEnabled(true);
      if (engineRef.current) engineRef.current.setBumplessEnabled(true);
    }
    handleToggleMode();
  };

  // Quick Scenario Preset 2: Bumpy Transfer Demo (Demonstrating severe valve jump)
  const handleDemoBumpy = () => {
    if (bumplessEnabled) {
      setBumplessEnabled(false);
      if (engineRef.current) engineRef.current.setBumplessEnabled(false);
    }
    if (!isManual) {
      // In auto, set a disparate manual setting and switch
      const disparateCo = 75;
      setManualCo(disparateCo);
      if (engineRef.current) engineRef.current.setManualCo(disparateCo);
      handleToggleMode();
    } else {
      // In manual, set setpoint disparate from PV and switch to auto
      const disparateSp = 85;
      setSp(disparateSp);
      if (engineRef.current) engineRef.current.setTargetSp(disparateSp);
      handleToggleMode();
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
          <span className={`text-xs font-bold select-none ${!isManual ? 'text-emerald-400' : 'text-slate-500'}`}>AUTO</span>
          <button
            onClick={handleToggleMode}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors cursor-pointer shrink-0 select-none ${
              isManual ? 'bg-amber-600' : 'bg-emerald-600'
            }`}
            title="Toggle between Automatic and Manual mode"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                isManual ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-xs font-bold select-none ${isManual ? 'text-amber-400' : 'text-slate-500'}`}>MANUAL</span>
        </div>
      </div>

      {/* Quick Test Scenarios Bar - Fixed dimensions and shrink-0 to prevent shifting */}
      <div className="glass-panel rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-slate-300 flex items-center gap-1.5 shrink-0">
          <Zap className="w-3.5 h-3.5 text-emerald-400" /> One-Click Transfer Tests:
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDemoBumpless}
            className="w-48 justify-center py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-500/50 font-semibold cursor-pointer shrink-0 select-none transition-colors"
          >
            Test Bumpless Transfer (Auto ↔ Man)
          </button>
          <button
            onClick={handleDemoBumpy}
            className="w-48 justify-center py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-500/50 font-semibold cursor-pointer shrink-0 select-none transition-colors"
          >
            Test Bumpy Transfer (Disable & Shock)
          </button>
          {isManual && (
            <button
              onClick={() => {
                setManualCo(70);
                if (engineRef.current) engineRef.current.setManualCo(70);
              }}
              className="w-36 justify-center py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer shrink-0 select-none transition-colors"
            >
              Step Valve to 70%
            </button>
          )}
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
              <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${isManual ? 'bg-amber-900/60 text-amber-300 border border-amber-600' : 'bg-emerald-900/60 text-emerald-300 border border-emerald-600'}`}>
                {isManual ? 'MANUAL (MAN)' : 'AUTOMATIC (AUTO)'}
              </span>
            </div>

            {/* Bumpless Tracking Feature Toggle */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Bumpless Transfer Logic
                  </span>
                  <span className="text-[11px] text-slate-400">
                    The 3 Digital Programming Requirements
                  </span>
                </div>
                <button
                  onClick={handleToggleBumpless}
                  className={`w-48 justify-center py-1.5 px-3 rounded text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 select-none ${
                    bumplessEnabled
                      ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-300'
                      : 'bg-rose-950/80 border border-rose-500/60 text-rose-300'
                  }`}
                >
                  {bumplessEnabled ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertOctagon className="w-3.5 h-3.5 shrink-0" />}
                  <span>{bumplessEnabled ? 'ENABLED (BUMPLESS)' : 'DISABLED (BUMPY!)'}</span>
                </button>
              </div>

              {/* The 3 Golden Rules Checklist */}
              <div className="bg-slate-950/70 p-2.5 rounded text-[11px] text-slate-300 space-y-1.5 border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${bumplessEnabled ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                  <span><strong>Rule 1:</strong> SP tracks PV in manual (<MathFormula math="SP = PV \implies e = 0" />)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${bumplessEnabled ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                  <span><strong>Rule 2:</strong> PID algorithm output tracks CO in manual</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${bumplessEnabled ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                  <span><strong>Rule 3:</strong> Manual output setting tracks CO in automatic</span>
                </div>
              </div>
            </div>

            {/* Manual Output Slider */}
            <div className={`p-3 rounded-lg border flex flex-col gap-2 transition-colors ${
              isManual ? 'bg-amber-950/20 border-amber-500/40' : 'bg-slate-900/40 border-slate-800 opacity-75'
            }`}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-200">
                  Manual Output Setting (<MathFormula math="CO_M" />)
                </span>
                <span className="font-mono text-amber-300 font-bold tabular-nums">{manualCo}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={manualCo}
                disabled={!isManual}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setManualCo(val);
                  if (engineRef.current && isManual) {
                    engineRef.current.setManualCo(val);
                  }
                }}
                className="w-full cursor-pointer accent-amber-500"
              />
              <span className="text-[10px] text-slate-400">
                {isManual ? 'Move slider to steer valve manually, then switch to AUTO.' : (bumplessEnabled ? 'Rule 3 Active: Manual dial tracks active CO automatically.' : 'Manual dial locked at preset. Will shock valve on switch!')}
              </span>
            </div>

            {/* Setpoint Slider */}
            <div className={`p-3 rounded-lg border flex flex-col gap-2 transition-colors ${
              !isManual ? 'bg-sky-950/20 border-sky-500/40' : 'bg-slate-900/40 border-slate-800 opacity-75'
            }`}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-sky-200">Setpoint (SP)</span>
                <span className="font-mono text-sky-300 font-bold tabular-nums">{sp}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={sp}
                disabled={isManual && bumplessEnabled}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSp(val);
                  if (engineRef.current && !isManual) {
                    engineRef.current.setTargetSp(val);
                  }
                }}
                className="w-full cursor-pointer accent-sky-500"
              />
              <span className="text-[10px] text-slate-400">
                {isManual && bumplessEnabled ? 'Rule 1 Active: SP is tracking PV continuously (error e = 0).' : 'Active setpoint.'}
              </span>
            </div>

            {/* Dedicated Process Transfer Status Slot - Fixed height to eliminate layout shifting */}
            <div className={`min-h-[3.25rem] rounded-lg p-2.5 flex items-center gap-2.5 text-xs border transition-colors ${
              bumpDetected
                ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                : 'bg-slate-900/90 border-slate-800 text-slate-300'
            }`}>
              {bumpDetected ? (
                <>
                  <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
                  <div className="min-w-0">
                    <strong className="block text-rose-300 font-bold uppercase tracking-wide">PROCESS SHOCK DETECTED!</strong>
                    <span className="text-[11px] text-rose-200">{lastTransferInfo || 'Bumpless transfer disabled: Sudden step jump in valve output shocked process!'}</span>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${bumplessEnabled ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <div className="min-w-0 text-[11px]">
                    <strong className={`font-semibold block ${bumplessEnabled ? 'text-emerald-300' : 'text-amber-300'}`}>
                      {bumplessEnabled ? 'BUMPLESS TRANSFER ACTIVE' : 'BUMPLESS TRANSFER DISABLED'}
                    </strong>
                    <span className="text-slate-400">
                      {lastTransferInfo || (bumplessEnabled ? 'Transferring between Auto and Manual will produce 0% bump.' : 'Transferring modes will shock the process due to unaligned bias/error!')}
                    </span>
                  </div>
                </>
              )}
            </div>

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
            title="Mode Transfer Dynamics"
            showSubTerms={false}
          />

          {/* Interactive Block Diagram (Figure 4A or 4B) */}
          <BlockDiagramSvg type={isManual ? 'bumpless_man' : 'bumpless_auto'} />
        </div>
      </div>
    </div>
  );
};
