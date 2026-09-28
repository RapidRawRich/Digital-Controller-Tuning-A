import React from 'react';
import { MathFormula } from './MathFormula';
import { BookOpen, CheckCircle, FileText, Sparkles, AlertCircle } from 'lucide-react';

export const ReferenceHandbook: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto text-slate-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-sky-950 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider mb-1">
          <BookOpen className="w-4 h-4" /> Alberta Apprenticeship & Industry Training Reference
        </div>
        <h2 className="text-xl font-bold text-white">
          ILM 310305dA: Digital Controller Tuning — Part A Study Guide
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          Comprehensive synthesis of terminology, equations, block diagrams, and best practices for Third Period Instrument Technicians.
        </p>
      </div>

      {/* Section 1: Feedback Terminology & Hardware */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 flex flex-col gap-3">
        <h3 className="font-bold text-sky-400 text-sm uppercase tracking-wide flex items-center gap-2">
          <FileText className="w-4 h-4" /> 1. ANSI/ISA Terminology & Controllers
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          The <strong>ANSI/ISA S51.1-1979 (R1993)</strong> standard defines feedback control as:
          <em className="text-amber-300 block bg-slate-900/80 p-2.5 rounded my-2 border-l-4 border-amber-500">
            "Control in which a measured variable is compared to its desired value to produce an actuating error signal which is acted upon in such a way as to reduce the magnitude of the error."
          </em>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <strong className="text-slate-100 block mb-1">Pneumatic Controller (Analog SAC)</strong>
            <p className="text-slate-400 text-[11px]">
              A Stand-Alone Controller operating mechanically via bellows, flappers, nozzles, and spring balances. Inherently operates under the <strong>Interactive (Series)</strong> algorithm.
            </p>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <strong className="text-slate-100 block mb-1">Digital Controller (SAC or DCS)</strong>
            <p className="text-slate-400 text-[11px]">
              Executes mathematical operations inside a microprocessor (SAC or Distributed Control System). Not constrained by mechanical linkages, permitting selectable algorithms (Interactive, Standard, Parallel) and software options.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Algorithm Comparison Table */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 flex flex-col gap-3">
        <h3 className="font-bold text-sky-400 text-sm uppercase tracking-wide">
          2. Mathematical Comparison of the Three Digital PID Algorithms
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/80">
                <th className="py-2.5 px-3">Algorithm</th>
                <th className="py-2.5 px-3">Transfer Function (s-Domain)</th>
                <th className="py-2.5 px-3">Interaction Behavior</th>
                <th className="py-2.5 px-3">Industrial Application</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="py-3 px-3 font-bold text-amber-300">Interactive (Series)</td>
                <td className="py-3 px-3 font-mono text-[11px]">
                  <MathFormula math="K_c \left(\frac{T_i s + 1}{T_i s}\right) \left(T_d s + 1\right)" />
                </td>
                <td className="py-3 px-3 text-slate-300">
                  <MathFormula math="P" /> affects <MathFormula math="D" />; both <MathFormula math="P" /> and <MathFormula math="D" /> affect <MathFormula math="I" />.
                </td>
                <td className="py-3 px-3 text-slate-400">Pneumatic & analog legacy loops.</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-cyan-300">Standard (ISA / Non-Interactive)</td>
                <td className="py-3 px-3 font-mono text-[11px]">
                  <MathFormula math="K_c \left(1 + \frac{1}{T_i s} + T_d s\right)" />
                </td>
                <td className="py-3 px-3 text-slate-300">
                  <MathFormula math="P" /> affects both <MathFormula math="I" /> and <MathFormula math="D" />, but <MathFormula math="I" /> does not affect <MathFormula math="D" />.
                </td>
                <td className="py-3 px-3 text-slate-400">Standard for modern DCS; basis for tuning rules.</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-emerald-300">Parallel (Independent)</td>
                <td className="py-3 px-3 font-mono text-[11px]">
                  <MathFormula math="K_p + \frac{K_i}{s} + K_d s" />
                </td>
                <td className="py-3 px-3 text-slate-300">
                  No interaction between <MathFormula math="P" />, <MathFormula math="I" />, and <MathFormula math="D" />.
                </td>
                <td className="py-3 px-3 text-slate-400">Selected PLCs; requires parameter translation.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Tuning Units & Conversions */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 flex flex-col gap-3">
        <h3 className="font-bold text-sky-400 text-sm uppercase tracking-wide">
          3. Tuning Units & Conversion Formulas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800 flex flex-col gap-2">
            <span className="font-bold text-slate-100">Proportional Gain (<MathFormula math="K_c" />) vs Proportional Band (<MathFormula math="PB\%" />)</span>
            <MathFormula math="K_c = \frac{100\%}{PB\%} \iff PB\% = \frac{100\%}{K_c}" block />
            <p className="text-[11px] text-slate-400">
              Higher <MathFormula math="K_c" /> produces narrower <MathFormula math="PB" /> and a more sensitive controller output.
            </p>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800 flex flex-col gap-2">
            <span className="font-bold text-slate-100">Integral Time vs Reset Rate</span>
            <MathFormula math="\text{Reset Rate (repeats/time)} = \frac{1}{\text{Integral Time (time/repeat)}}" block />
            <p className="text-[11px] text-slate-400">
              Units are reciprocals of each other: <MathFormula math="\text{min/repeat} \leftrightarrow \text{repeats/min}" /> or <MathFormula math="\text{sec/repeat} \leftrightarrow \text{repeats/sec}" />.
            </p>
          </div>
        </div>
      </div>

      {/* Section 4: The 3 Golden Rules of Bumpless Transfer */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 flex flex-col gap-3">
        <h3 className="font-bold text-emerald-400 text-sm uppercase tracking-wide">
          4. Bumpless Transfer — The Three Digital Programming Rules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-emerald-950/30 border border-emerald-500/40 p-3 rounded-lg">
            <strong className="text-emerald-300 block mb-1">Rule 1: SP Tracks PV in Manual</strong>
            <span className="text-slate-300 text-[11px]">
              Ensures error <MathFormula math="e = SP - PV = 0" /> at transfer, preventing proportional jump.
            </span>
          </div>
          <div className="bg-emerald-950/30 border border-emerald-500/40 p-3 rounded-lg">
            <strong className="text-emerald-300 block mb-1">Rule 2: PID Output Tracks CO in Manual</strong>
            <span className="text-slate-300 text-[11px]">
              Initializes integral accumulator bias to match manual valve position before auto mode engages.
            </span>
          </div>
          <div className="bg-emerald-950/30 border border-emerald-500/40 p-3 rounded-lg">
            <strong className="text-emerald-300 block mb-1">Rule 3: Manual Output Tracks CO in Automatic</strong>
            <span className="text-slate-300 text-[11px]">
              Keeps manual dial aligned with active PID output so transferring back to manual causes no bump.
            </span>
          </div>
        </div>
      </div>

      {/* Section 5: Setpoint Softening & Anti-Windup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="glass-panel rounded-xl p-5 border border-slate-800 flex flex-col gap-3">
          <h3 className="font-bold text-amber-400 text-sm uppercase tracking-wide">
            5. Setpoint Kick Mitigations
          </h3>
          <ul className="space-y-2 text-[11px] text-slate-300">
            <li>
              <strong>SP Filtering:</strong> 1st order lag filter <MathFormula math="SP_f(s) = \frac{1}{\tau_f s + 1} SP(s)" />. Mitigates proportional kick and softens derivative spike.
            </li>
            <li>
              <strong>SP Ramping:</strong> Constant rate slew limit. Eliminates proportional kick and yields a constant, finite derivative pulse.
            </li>
            <li>
              <strong>PI on Error, D on PV:</strong> Eliminates derivative kick completely on setpoint changes while preserving derivative stabilization on load upsets.
            </li>
            <li>
              <strong>I on Error, PD on PV:</strong> Eliminates both proportional and derivative kicks. Provides zero-overshoot setpoint tracking.
            </li>
          </ul>
        </div>

        <div className="glass-panel rounded-xl p-5 border border-slate-800 flex flex-col gap-3">
          <h3 className="font-bold text-rose-400 text-sm uppercase tracking-wide">
            6. Anti-Reset Windup Schemes
          </h3>
          <ul className="space-y-2 text-[11px] text-slate-300">
            <li>
              <strong>High/Low Limits (Clamping):</strong> Freezes integral accumulation once controller output exceeds predefined boundaries (e.g. -5% to 105%).
            </li>
            <li>
              <strong>Rapid Unwind:</strong> Accelerates integral action by 8x to 32x once PV crosses SP until CO returns within working limits.
            </li>
            <li>
              <strong>Reset Feedback:</strong> Feeds the bounded CO after OUT LIM back through <MathFormula math="\frac{1}{T_i s + 1}" />. Physically limits integral contribution to output bounds.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
