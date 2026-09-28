import React from 'react';
import { Flame, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface HeatExchangerSvgProps {
  pv: number;               // 0 - 100% (temperature)
  sp: number;               // 0 - 100%
  co: number;               // 0 - 100% (valve stem position)
  rawCo: number;            // raw unwound CO%
  steamAvailable: boolean;  // steam trip switch
  onToggleSteam: () => void;
  isSaturated: boolean;
}

export const HeatExchangerSvg: React.FC<HeatExchangerSvgProps> = ({
  pv,
  sp,
  co,
  rawCo,
  steamAvailable,
  onToggleSteam,
  isSaturated,
}) => {
  // Color interpolator for fluid temperature
  const getFluidColor = (tempPercent: number) => {
    // 0% -> Blue (#38bdf8), 50% -> Green/Amber (#eab308), 100% -> Red (#ef4444)
    if (tempPercent < 50) {
      const ratio = tempPercent / 50;
      return `rgb(${Math.round(56 + ratio * 178)}, ${Math.round(189 - ratio * 10)}, ${Math.round(248 - ratio * 240)})`;
    } else {
      const ratio = (tempPercent - 50) / 50;
      return `rgb(${Math.round(234 + ratio * 5)}, ${Math.round(179 - ratio * 111)}, ${Math.round(8 - ratio * 8)})`;
    }
  };

  const fluidColor = getFluidColor(pv);
  const valveStemY = 70 - (co / 100) * 22; // valve opening animation

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Flame className={`w-4 h-4 ${steamAvailable ? 'text-amber-400 animate-pulse' : 'text-slate-600'}`} />
          <h3 className="font-semibold text-slate-200 text-sm tracking-wide uppercase">
            Figure 12: Steam Heat Exchanger Process Loop (TIC-101)
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSteam}
            className={`px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              steamAvailable
                ? 'bg-rose-950/60 border border-rose-500/50 text-rose-300 hover:bg-rose-900/80'
                : 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/80'
            }`}
          >
            {steamAvailable ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                Simulate Boiler Trip (Cut Off Steam)
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Restore Steam Supply
              </>
            )}
          </button>
        </div>
      </div>

      {/* Interactive Process SVG */}
      <div className="w-full overflow-x-auto flex justify-center py-2">
        <svg
          viewBox="0 0 680 320"
          className="w-full max-w-[680px] h-auto font-sans select-none"
          style={{ minWidth: '540px' }}
        >
          <defs>
            <linearGradient id="exchangerGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="tubeInternal" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor={fluidColor} />
            </linearGradient>
          </defs>

          {/* Steam Header Pipe from top */}
          <rect x="235" y="10" width="30" height="70" fill={steamAvailable ? '#ea580c' : '#334155'} stroke="#64748b" strokeWidth="2" />
          <text x="200" y="25" fill={steamAvailable ? '#fdba74' : '#64748b'} fontSize="11" fontWeight="bold">Steam Supply</text>

          {/* Steam Control Valve FCV */}
          <g transform="translate(225, 60)">
            {/* Valve Body Triangles */}
            <polygon points="0,15 25,25 0,35" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
            <polygon points="50,15 25,25 50,35" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
            
            {/* Actuator Diaphragm Dome */}
            <path d="M 12 5 Q 25 -10 38 5 Z" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            {/* Valve stem */}
            <line x1="25" y1="5" x2="25" y2="25" stroke="#e2e8f0" strokeWidth="3" />
            {/* Position indicator */}
            <rect x="18" y="10" width="14" height="6" fill="#38bdf8" />

            <text x="56" y="28" fill="#38bdf8" fontSize="10" fontWeight="bold">FCV ({co.toFixed(0)}%)</text>
          </g>

          {/* Steam Entering Heat Exchanger Shell */}
          <rect x="235" y="95" width="30" height="35" fill={steamAvailable && co > 0 ? '#f97316' : '#1e293b'} stroke="#64748b" strokeWidth="2" />

          {/* Cold Product Inlet Pipe (Left) */}
          <rect x="30" y="170" width="140" height="24" fill="#0369a1" stroke="#475569" strokeWidth="2" />
          <text x="40" y="160" fill="#38bdf8" fontSize="11" fontWeight="bold">Cold Product (20%)</text>
          {/* Arrow */}
          <polygon points="140,174 155,182 140,190" fill="#38bdf8" />

          {/* Heat Exchanger Body (Shell) */}
          <rect x="170" y="130" width="220" height="105" rx="16" fill="#0f172a" stroke="#64748b" strokeWidth="3" />
          {/* Shell Steam Internal Heating Chamber */}
          <rect x="180" y="140" width="200" height="85" rx="10" fill={steamAvailable && co > 0 ? 'rgba(234, 88, 12, 0.25)' : 'rgba(30, 41, 59, 0.4)'} />

          {/* Internal Tube Bundle carrying product */}
          <path
            d="M 170 165 C 230 165, 230 190, 290 190 C 350 190, 350 165, 390 165"
            fill="none"
            stroke="url(#tubeInternal)"
            strokeWidth="16"
            strokeLinecap="round"
          />
          <path
            d="M 170 195 C 230 195, 230 170, 290 170 C 350 170, 350 195, 390 195"
            fill="none"
            stroke="url(#tubeInternal)"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Condensate Drain at bottom */}
          <rect x="235" y="235" width="30" height="40" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
          <polygon points="230,275 270,275 250,290" fill="#475569" stroke="#94a3b8" />
          <text x="270" y="285" fill="#94a3b8" fontSize="10">Condensate</text>

          {/* Hot Product Outlet Pipe (Right) */}
          <rect x="390" y="170" width="160" height="24" fill={fluidColor} stroke="#475569" strokeWidth="2" />
          <text x="440" y="160" fill={fluidColor} fontSize="11" fontWeight="bold">Hot Product (PV)</text>
          <polygon points="520,174 535,182 520,190" fill="#f8fafc" />

          {/* Temperature Transmitter TT-101 */}
          <g transform="translate(460, 120)">
            <line x1="15" y1="50" x2="15" y2="30" stroke="#34d399" strokeWidth="2" />
            <circle cx="15" cy="15" r="18" fill="#0f172a" stroke="#34d399" strokeWidth="2" />
            <text x="8" y="13" fill="#34d399" fontSize="10" fontWeight="bold">TT</text>
            <text x="6" y="23" fill="#a7f3d0" fontSize="8">101</text>
          </g>

          {/* Signal from TT-101 to TIC-101 (Dashed Electrical line) */}
          <path d="M 475 102 L 475 55 L 415 55" fill="none" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x="480" y="75" fill="#34d399" fontSize="9">PV={pv.toFixed(1)}%</text>

          {/* Temperature Indicating Controller TIC-101 */}
          <g transform="translate(365, 30)">
            <circle cx="25" cy="25" r="26" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
            <line x1="2" y1="25" x2="48" y2="25" stroke="#38bdf8" strokeWidth="1" />
            <text x="14" y="18" fill="#38bdf8" fontSize="11" fontWeight="bold">TIC</text>
            <text x="14" y="38" fill="#93c5fd" fontSize="10">101</text>
          </g>

          {/* Controller Output signal (Dashed line from TIC-101 to Valve) */}
          <path d="M 365 55 L 275 55" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 3" />
          <text x="290" y="48" fill="#38bdf8" fontSize="10">CO={co.toFixed(1)}%</text>

          {/* Reset Windup Saturation Warning overlay */}
          {isSaturated && (
            <g transform="translate(20, 240)">
              <rect x="0" y="0" width="180" height="60" rx="8" fill="rgba(159, 18, 57, 0.85)" stroke="#f43f5e" strokeWidth="2" />
              <text x="10" y="20" fill="#ffe4e6" fontSize="11" fontWeight="bold">RESET WINDUP ACTIVE!</text>
              <text x="10" y="36" fill="#fecdd3" fontSize="9">Internal Bias: {rawCo.toFixed(1)}%</text>
              <text x="10" y="49" fill="#fecdd3" fontSize="9">Output Saturated at 100%</text>
            </g>
          )}
        </svg>
      </div>

      {/* Status Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="bg-slate-900 border border-slate-800 p-2 rounded">
          <span className="text-slate-400 block">Steam Valve Status:</span>
          <span className="font-bold text-slate-100">{co.toFixed(1)}% {co >= 100 ? '(FULL OPEN)' : co <= 0 ? '(CLOSED)' : ''}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-2 rounded">
          <span className="text-slate-400 block">Steam Supply:</span>
          <span className={`font-bold ${steamAvailable ? 'text-amber-400' : 'text-rose-400'}`}>
            {steamAvailable ? 'ONLINE (Supplying Heat)' : 'TRIPPED / CUT OFF'}
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-2 rounded">
          <span className="text-slate-400 block">Accumulator Bias:</span>
          <span className={`font-bold font-mono ${rawCo > 100 ? 'text-rose-400 animate-pulse' : 'text-slate-200'}`}>
            {rawCo.toFixed(1)}% {rawCo > 100 ? '(Wound Up!)' : ''}
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-2 rounded">
          <span className="text-slate-400 block">Current Error:</span>
          <span className={`font-bold font-mono ${(sp - pv) > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {(sp - pv).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};
