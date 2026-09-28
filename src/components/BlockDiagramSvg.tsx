import React, { useState } from 'react';
import { MathFormula } from './MathFormula';
import { Info } from 'lucide-react';

export type DiagramType = 'interactive' | 'standard' | 'parallel' | 'bumpless_auto' | 'bumpless_man' | 'out_lim' | 'reset_feedback';

interface BlockDiagramSvgProps {
  type: DiagramType;
  interactiveNodeClick?: boolean;
}

export const BlockDiagramSvg: React.FC<BlockDiagramSvgProps> = ({
  type,
}) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            {type === 'interactive' && 'Figure 1: Interactive (Series) PID Algorithm'}
            {type === 'standard' && 'Figure 2: Standard (ISA / Non-Interactive) PID Algorithm'}
            {type === 'parallel' && 'Figure 3: Parallel (Independent) PID Algorithm'}
            {type === 'bumpless_auto' && 'Figure 4A: Generic PID Function Block in AUTOMATIC Mode'}
            {type === 'bumpless_man' && 'Figure 4B: Generic PID Function Block in MANUAL Mode'}
            {type === 'out_lim' && 'Figure 13: Standard PID with Output Limits (OUT LIM)'}
            {type === 'reset_feedback' && 'Figure 14: Standard PID Algorithm Using Reset Feedback'}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          Click blocks to inspect role
        </span>
      </div>

      {/* SVG Diagram Area */}
      <div className="w-full overflow-x-auto flex justify-center py-2">
        <svg
          viewBox="0 0 760 260"
          className="w-full max-w-[760px] h-auto font-sans select-none"
          style={{ minWidth: '580px' }}
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
            </marker>
            <marker
              id="arrow-green"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" />
            </marker>
            <marker
              id="arrow-amber"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" />
            </marker>
            <marker
              id="arrow-dash"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f43f5e" />
            </marker>
          </defs>

          {/* ========================================================
              DIAGRAM 1: INTERACTIVE (SERIES) PID (ILM Figure 1)
             ======================================================== */}
          {type === 'interactive' && (
            <g>
              {/* Outer controller dashed box */}
              <rect x="120" y="30" width="460" height="190" rx="8" fill="rgba(15, 23, 42, 0.4)" stroke="#64748b" strokeDasharray="6 4" strokeWidth="1.5" />
              <text x="130" y="50" fill="#94a3b8" fontSize="11" fontWeight="bold">Interactive Controller Boundary</text>

              {/* Setpoint (SP) & Summing Junction */}
              <text x="35" y="115" fill="#fbbf24" fontSize="13" fontWeight="bold">SP</text>
              <line x1="60" y1="110" x2="155" y2="110" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arrow-amber)" />

              {/* Error summing junction */}
              <circle cx="165" cy="110" r="14" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
              <text x="156" y="104" fill="#fbbf24" fontSize="11">+</text>
              <text x="162" y="125" fill="#34d399" fontSize="12">-</text>

              {/* Error e */}
              <line x1="179" y1="110" x2="215" y2="110" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <text x="190" y="102" fill="#94a3b8" fontSize="12" fontStyle="italic">e</text>

              {/* P Block */}
              <g onClick={() => setSelectedNode('P')} className="cursor-pointer">
                <rect x="220" y="90" width="50" height="40" rx="5" fill={selectedNode === 'P' ? '#0369a1' : '#1e293b'} stroke="#38bdf8" strokeWidth="2" />
                <text x="240" y="115" fill="#f8fafc" fontSize="15" fontWeight="bold">P</text>
              </g>

              {/* Signal from P to D & bypass */}
              <line x1="270" y1="110" x2="335" y2="110" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <circle cx="300" cy="110" r="3" fill="#38bdf8" />
              <line x1="300" y1="110" x2="300" y2="65" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="300" y1="65" x2="335" y2="65" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow)" />

              {/* D Block */}
              <g onClick={() => setSelectedNode('D')} className="cursor-pointer">
                <rect x="340" y="45" width="50" height="40" rx="5" fill={selectedNode === 'D' ? '#0369a1' : '#1e293b'} stroke="#f472b6" strokeWidth="2" />
                <text x="360" y="70" fill="#f8fafc" fontSize="15" fontWeight="bold">D</text>
              </g>

              {/* Summing junction after D */}
              <line x1="390" y1="65" x2="435" y2="65" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="435" y1="65" x2="435" y2="95" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <line x1="300" y1="110" x2="420" y2="110" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow)" />
              
              <circle cx="435" cy="110" r="14" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
              <text x="431" y="92" fill="#e2e8f0" fontSize="11">+</text>
              <text x="424" y="114" fill="#e2e8f0" fontSize="11">+</text>

              {/* Output from sum to I and CO */}
              <line x1="449" y1="110" x2="520" y2="110" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <circle cx="480" cy="110" r="3" fill="#38bdf8" />
              <line x1="480" y1="110" x2="480" y2="165" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="480" y1="165" x2="455" y2="165" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow)" />

              {/* I Block (Feedback loop) */}
              <g onClick={() => setSelectedNode('I')} className="cursor-pointer">
                <rect x="400" y="145" width="50" height="40" rx="5" fill={selectedNode === 'I' ? '#0369a1' : '#1e293b'} stroke="#fb923c" strokeWidth="2" />
                <text x="422" y="170" fill="#f8fafc" fontSize="15" fontWeight="bold">I</text>
              </g>

              {/* Feedback from I back into the sum */}
              <line x1="400" y1="165" x2="375" y2="165" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="375" y1="165" x2="425" y2="120" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow)" />

              {/* Controller Output (CO) */}
              <text x="530" y="103" fill="#38bdf8" fontSize="13" fontWeight="bold">CO</text>
              <line x1="520" y1="110" x2="615" y2="110" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />

              {/* Process Block Gp */}
              <g onClick={() => setSelectedNode('Gp')} className="cursor-pointer">
                <rect x="620" y="85" width="60" height="50" rx="6" fill={selectedNode === 'Gp' ? '#047857' : '#064e3b'} stroke="#34d399" strokeWidth="2" />
                <text x="638" y="115" fill="#f8fafc" fontSize="15" fontWeight="bold">Gp</text>
                <text x="630" y="128" fill="#a7f3d0" fontSize="9">Process</text>
              </g>

              {/* PV Feedback loop */}
              <line x1="680" y1="110" x2="720" y2="110" stroke="#34d399" strokeWidth="2" />
              <circle cx="720" cy="110" r="3" fill="#34d399" />
              <text x="725" y="114" fill="#34d399" fontSize="12" fontWeight="bold">PV</text>
              <line x1="720" y1="110" x2="720" y2="235" stroke="#34d399" strokeWidth="2" />
              <line x1="720" y1="235" x2="165" y2="235" stroke="#34d399" strokeWidth="2" />
              <line x1="165" y1="235" x2="165" y2="128" stroke="#34d399" strokeWidth="2" markerEnd="url(#arrow-green)" />
            </g>
          )}

          {/* ========================================================
              DIAGRAM 2: STANDARD (ISA / NON-INTERACTIVE) PID (ILM Figure 2)
             ======================================================== */}
          {type === 'standard' && (
            <g>
              {/* Outer controller boundary */}
              <rect x="120" y="30" width="460" height="190" rx="8" fill="rgba(15, 23, 42, 0.4)" stroke="#64748b" strokeDasharray="6 4" strokeWidth="1.5" />
              <text x="130" y="50" fill="#94a3b8" fontSize="11" fontWeight="bold">Standard (ISA) Controller Boundary</text>

              {/* Setpoint (SP) & Summing Junction */}
              <text x="35" y="115" fill="#fbbf24" fontSize="13" fontWeight="bold">SP</text>
              <line x1="60" y1="110" x2="155" y2="110" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arrow-amber)" />

              {/* Error summing junction */}
              <circle cx="165" cy="110" r="14" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
              <text x="156" y="104" fill="#fbbf24" fontSize="11">+</text>
              <text x="162" y="125" fill="#34d399" fontSize="12">-</text>

              {/* Error e */}
              <line x1="179" y1="110" x2="225" y2="110" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <text x="195" y="102" fill="#94a3b8" fontSize="12" fontStyle="italic">e</text>

              {/* P Block */}
              <g onClick={() => setSelectedNode('P')} className="cursor-pointer">
                <rect x="230" y="90" width="50" height="40" rx="5" fill={selectedNode === 'P' ? '#0369a1' : '#1e293b'} stroke="#38bdf8" strokeWidth="2" />
                <text x="250" y="115" fill="#f8fafc" fontSize="15" fontWeight="bold">P</text>
              </g>

              {/* Distribution after P */}
              <circle cx="310" cy="110" r="3" fill="#38bdf8" />
              <line x1="280" y1="110" x2="310" y2="110" stroke="#38bdf8" strokeWidth="2" />

              {/* To D block */}
              <line x1="310" y1="110" x2="310" y2="65" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="310" y1="65" x2="345" y2="65" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <g onClick={() => setSelectedNode('D')} className="cursor-pointer">
                <rect x="350" y="45" width="50" height="40" rx="5" fill={selectedNode === 'D' ? '#0369a1' : '#1e293b'} stroke="#f472b6" strokeWidth="2" />
                <text x="370" y="70" fill="#f8fafc" fontSize="15" fontWeight="bold">D</text>
              </g>
              <line x1="400" y1="65" x2="445" y2="65" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="445" y1="65" x2="445" y2="95" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow)" />

              {/* Direct P branch */}
              <line x1="310" y1="110" x2="430" y2="110" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow)" />

              {/* To I block */}
              <line x1="310" y1="110" x2="310" y2="155" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="310" y1="155" x2="345" y2="155" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <g onClick={() => setSelectedNode('I')} className="cursor-pointer">
                <rect x="350" y="135" width="50" height="40" rx="5" fill={selectedNode === 'I' ? '#0369a1' : '#1e293b'} stroke="#fb923c" strokeWidth="2" />
                <text x="372" y="160" fill="#f8fafc" fontSize="15" fontWeight="bold">I</text>
              </g>
              <line x1="400" y1="155" x2="445" y2="155" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="445" y1="155" x2="445" y2="125" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow)" />

              {/* Summing junction */}
              <circle cx="445" cy="110" r="14" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
              <text x="441" y="95" fill="#e2e8f0" fontSize="11">+</text>
              <text x="432" y="114" fill="#e2e8f0" fontSize="11">+</text>
              <text x="441" y="122" fill="#e2e8f0" fontSize="11">+</text>

              {/* CO and Process */}
              <line x1="459" y1="110" x2="615" y2="110" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <text x="520" y="103" fill="#38bdf8" fontSize="13" fontWeight="bold">CO</text>

              <g onClick={() => setSelectedNode('Gp')} className="cursor-pointer">
                <rect x="620" y="85" width="60" height="50" rx="6" fill={selectedNode === 'Gp' ? '#047857' : '#064e3b'} stroke="#34d399" strokeWidth="2" />
                <text x="638" y="115" fill="#f8fafc" fontSize="15" fontWeight="bold">Gp</text>
                <text x="630" y="128" fill="#a7f3d0" fontSize="9">Process</text>
              </g>

              {/* PV Feedback loop */}
              <line x1="680" y1="110" x2="720" y2="110" stroke="#34d399" strokeWidth="2" />
              <circle cx="720" cy="110" r="3" fill="#34d399" />
              <text x="725" y="114" fill="#34d399" fontSize="12" fontWeight="bold">PV</text>
              <line x1="720" y1="110" x2="720" y2="235" stroke="#34d399" strokeWidth="2" />
              <line x1="720" y1="235" x2="165" y2="235" stroke="#34d399" strokeWidth="2" />
              <line x1="165" y1="235" x2="165" y2="128" stroke="#34d399" strokeWidth="2" markerEnd="url(#arrow-green)" />
            </g>
          )}

          {/* ========================================================
              DIAGRAM 3: PARALLEL (INDEPENDENT) PID (ILM Figure 3)
             ======================================================== */}
          {type === 'parallel' && (
            <g>
              <rect x="120" y="30" width="460" height="190" rx="8" fill="rgba(15, 23, 42, 0.4)" stroke="#64748b" strokeDasharray="6 4" strokeWidth="1.5" />
              <text x="130" y="50" fill="#94a3b8" fontSize="11" fontWeight="bold">Parallel (Independent) Controller Boundary</text>

              {/* Setpoint (SP) & Summing Junction */}
              <text x="35" y="115" fill="#fbbf24" fontSize="13" fontWeight="bold">SP</text>
              <line x1="60" y1="110" x2="155" y2="110" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arrow-amber)" />

              <circle cx="165" cy="110" r="14" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
              <text x="156" y="104" fill="#fbbf24" fontSize="11">+</text>
              <text x="162" y="125" fill="#34d399" fontSize="12">-</text>

              {/* Split error directly to P, I, D */}
              <line x1="179" y1="110" x2="240" y2="110" stroke="#38bdf8" strokeWidth="2" />
              <circle cx="240" cy="110" r="3" fill="#38bdf8" />
              <text x="200" y="102" fill="#94a3b8" fontSize="12" fontStyle="italic">e</text>

              {/* Branch to D */}
              <line x1="240" y1="110" x2="240" y2="65" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="240" y1="65" x2="285" y2="65" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <g onClick={() => setSelectedNode('D')} className="cursor-pointer">
                <rect x="290" y="45" width="55" height="40" rx="5" fill={selectedNode === 'D' ? '#0369a1' : '#1e293b'} stroke="#f472b6" strokeWidth="2" />
                <text x="312" y="70" fill="#f8fafc" fontSize="15" fontWeight="bold">D</text>
              </g>

              {/* Branch to P */}
              <line x1="240" y1="110" x2="285" y2="110" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <g onClick={() => setSelectedNode('P')} className="cursor-pointer">
                <rect x="290" y="90" width="55" height="40" rx="5" fill={selectedNode === 'P' ? '#0369a1' : '#1e293b'} stroke="#38bdf8" strokeWidth="2" />
                <text x="313" y="115" fill="#f8fafc" fontSize="15" fontWeight="bold">P</text>
              </g>

              {/* Branch to I */}
              <line x1="240" y1="110" x2="240" y2="155" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="240" y1="155" x2="285" y2="155" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <g onClick={() => setSelectedNode('I')} className="cursor-pointer">
                <rect x="290" y="135" width="55" height="40" rx="5" fill={selectedNode === 'I' ? '#0369a1' : '#1e293b'} stroke="#fb923c" strokeWidth="2" />
                <text x="314" y="160" fill="#f8fafc" fontSize="15" fontWeight="bold">I</text>
              </g>

              {/* Paths to Summing Junction */}
              <line x1="345" y1="65" x2="425" y2="65" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="425" y1="65" x2="425" y2="95" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow)" />

              <line x1="345" y1="110" x2="410" y2="110" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow)" />

              <line x1="345" y1="155" x2="425" y2="155" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="425" y1="155" x2="425" y2="125" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow)" />

              {/* Summing Junction */}
              <circle cx="425" cy="110" r="14" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
              <text x="421" y="95" fill="#e2e8f0" fontSize="11">+</text>
              <text x="414" y="114" fill="#e2e8f0" fontSize="11">+</text>
              <text x="421" y="122" fill="#e2e8f0" fontSize="11">+</text>

              {/* Output CO */}
              <line x1="439" y1="110" x2="615" y2="110" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <text x="510" y="103" fill="#38bdf8" fontSize="13" fontWeight="bold">CO</text>

              <g onClick={() => setSelectedNode('Gp')} className="cursor-pointer">
                <rect x="620" y="85" width="60" height="50" rx="6" fill={selectedNode === 'Gp' ? '#047857' : '#064e3b'} stroke="#34d399" strokeWidth="2" />
                <text x="638" y="115" fill="#f8fafc" fontSize="15" fontWeight="bold">Gp</text>
                <text x="630" y="128" fill="#a7f3d0" fontSize="9">Process</text>
              </g>

              {/* PV Feedback loop */}
              <line x1="680" y1="110" x2="720" y2="110" stroke="#34d399" strokeWidth="2" />
              <circle cx="720" cy="110" r="3" fill="#34d399" />
              <text x="725" y="114" fill="#34d399" fontSize="12" fontWeight="bold">PV</text>
              <line x1="720" y1="110" x2="720" y2="235" stroke="#34d399" strokeWidth="2" />
              <line x1="720" y1="235" x2="165" y2="235" stroke="#34d399" strokeWidth="2" />
              <line x1="165" y1="235" x2="165" y2="128" stroke="#34d399" strokeWidth="2" markerEnd="url(#arrow-green)" />
            </g>
          )}

          {/* ========================================================
              DIAGRAM 4A / 4B: BUMPLESS TRANSFER FUNCTION BLOCK (Figure 4)
             ======================================================== */}
          {(type === 'bumpless_auto' || type === 'bumpless_man') && (
            <g>
              <rect x="90" y="30" width="550" height="200" rx="10" fill="rgba(15, 23, 42, 0.6)" stroke="#0ea5e9" strokeWidth="2" />
              <text x="110" y="55" fill="#38bdf8" fontSize="14" fontWeight="bold">
                PID Function Block ({type === 'bumpless_auto' ? 'Figure 4A: AUTOMATIC MODE' : 'Figure 4B: MANUAL MODE'})
              </text>

              {/* SP and PV inputs */}
              <rect x="115" y="90" width="40" height="26" rx="4" fill="#1e293b" stroke="#fbbf24" strokeWidth="1.5" />
              <text x="127" y="108" fill="#fbbf24" fontSize="12" fontWeight="bold">SP</text>

              <rect x="115" y="145" width="40" height="26" rx="4" fill="#1e293b" stroke="#34d399" strokeWidth="1.5" />
              <text x="126" y="163" fill="#34d399" fontSize="12" fontWeight="bold">PV</text>

              {/* PID Algorithm Main Box */}
              <rect x="200" y="105" width="115" height="75" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
              <text x="215" y="135" fill="#f8fafc" fontSize="13" fontWeight="bold">PID</text>
              <text x="215" y="153" fill="#94a3b8" fontSize="11">Algorithm</text>
              
              {/* Tuning parameters bottom pins */}
              <text x="265" y="125" fill="#cbd5e1" fontSize="10">Kc</text>
              <text x="265" y="145" fill="#cbd5e1" fontSize="10">Ti</text>
              <text x="265" y="165" fill="#cbd5e1" fontSize="10">Td</text>

              {/* Manual Bias Setting COm */}
              <rect x="330" y="55" width="60" height="32" rx="4" fill="#1e293b" stroke="#a855f7" strokeWidth="1.5" />
              <text x="345" y="76" fill="#c084fc" fontSize="12" fontWeight="bold">COm</text>

              {/* Mode Switch Selector */}
              <circle cx="480" cy="110" r="28" fill="#0f172a" stroke="#e2e8f0" strokeWidth="2" />
              <text x="466" y="80" fill="#94a3b8" fontSize="11" fontWeight="bold">MAN</text>
              <text x="462" y="152" fill="#94a3b8" fontSize="11" fontWeight="bold">AUTO</text>

              {/* Switch Arm */}
              {type === 'bumpless_auto' ? (
                // Connected to AUTO (PID output COa)
                <g>
                  <line x1="315" y1="145" x2="465" y2="128" stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#arrow)" />
                  <text x="340" y="140" fill="#38bdf8" fontSize="11" fontWeight="bold">COa</text>
                  <line x1="480" y1="110" x2="470" y2="128" stroke="#38bdf8" strokeWidth="3" />
                  
                  {/* Dashed Tracking Line: COm tracks current CO */}
                  <path d="M 540 110 L 540 45 L 360 45 L 360 55" fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="5 3" markerEnd="url(#arrow-dash)" />
                  <text x="410" y="40" fill="#f43f5e" fontSize="10" fontWeight="bold">Rule 3: COm tracks CO in AUTO</text>
                </g>
              ) : (
                // Connected to MAN (COm output)
                <g>
                  <line x1="390" y1="71" x2="470" y2="92" stroke="#c084fc" strokeWidth="2.5" markerEnd="url(#arrow)" />
                  <line x1="480" y1="110" x2="470" y2="92" stroke="#c084fc" strokeWidth="3" />

                  {/* Dashed Tracking Line 1: PID output tracks CO in MAN */}
                  <path d="M 540 110 L 540 195 L 260 195 L 260 180" fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="5 3" markerEnd="url(#arrow-dash)" />
                  <text x="350" y="210" fill="#f43f5e" fontSize="10" fontWeight="bold">Rule 2: PID tracks CO in MAN</text>

                  {/* Dashed Tracking Line 2: SP tracks PV in MAN */}
                  <path d="M 135 145 L 135 116" fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="5 3" markerEnd="url(#arrow-dash)" />
                  <text x="145" y="134" fill="#f43f5e" fontSize="10" fontWeight="bold">Rule 1: SP tracks PV</text>
                </g>
              )}

              {/* CO Output */}
              <line x1="508" y1="110" x2="600" y2="110" stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#arrow)" />
              <text x="608" y="114" fill="#38bdf8" fontSize="13" fontWeight="bold">CO</text>
            </g>
          )}

          {/* ========================================================
              DIAGRAM 5: RESET FEEDBACK (ILM Figure 14)
             ======================================================== */}
          {type === 'reset_feedback' && (
            <g>
              <rect x="100" y="30" width="500" height="200" rx="8" fill="rgba(15, 23, 42, 0.4)" stroke="#64748b" strokeDasharray="6 4" strokeWidth="1.5" />
              <text x="110" y="50" fill="#94a3b8" fontSize="11" fontWeight="bold">Reset Feedback Controller</text>

              {/* SP and PV */}
              <text x="25" y="115" fill="#fbbf24" fontSize="13" fontWeight="bold">SP</text>
              <line x1="50" y1="110" x2="135" y2="110" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arrow-amber)" />

              <circle cx="145" cy="110" r="14" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
              <text x="136" y="104" fill="#fbbf24" fontSize="11">+</text>
              <text x="142" y="125" fill="#34d399" fontSize="12">-</text>

              {/* P Block */}
              <line x1="159" y1="110" x2="205" y2="110" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <rect x="210" y="90" width="50" height="40" rx="5" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
              <text x="230" y="115" fill="#f8fafc" fontSize="15" fontWeight="bold">P</text>

              {/* D Block */}
              <circle cx="280" cy="110" r="3" fill="#38bdf8" />
              <line x1="260" y1="110" x2="280" y2="110" stroke="#38bdf8" strokeWidth="2" />
              <line x1="280" y1="110" x2="280" y2="65" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="280" y1="65" x2="315" y2="65" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <rect x="320" y="45" width="50" height="40" rx="5" fill="#1e293b" stroke="#f472b6" strokeWidth="2" />
              <text x="340" y="70" fill="#f8fafc" fontSize="15" fontWeight="bold">D</text>
              <line x1="370" y1="65" x2="415" y2="65" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="415" y1="65" x2="415" y2="95" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow)" />

              {/* Direct P to Sum */}
              <line x1="280" y1="110" x2="400" y2="110" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow)" />

              {/* Summing Junction before OUT LIM */}
              <circle cx="415" cy="110" r="14" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
              <text x="411" y="95" fill="#e2e8f0" fontSize="11">+</text>
              <text x="402" y="114" fill="#e2e8f0" fontSize="11">+</text>
              <text x="411" y="122" fill="#e2e8f0" fontSize="11">+</text>

              {/* Output Limit Block (OUT LIM) */}
              <line x1="429" y1="110" x2="465" y2="110" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <g onClick={() => setSelectedNode('OUT_LIM')} className="cursor-pointer">
                <rect x="470" y="85" width="65" height="50" rx="5" fill={selectedNode === 'OUT_LIM' ? '#991b1b' : '#7f1d1d'} stroke="#f87171" strokeWidth="2" />
                <text x="480" y="106" fill="#fecaca" fontSize="11" fontWeight="bold">OUT</text>
                <text x="481" y="123" fill="#fecaca" fontSize="11" fontWeight="bold">LIM</text>
              </g>

              {/* Reset Feedback Loop (From AFTER OUT LIM back into I block) */}
              <circle cx="560" cy="110" r="3" fill="#38bdf8" />
              <line x1="535" y1="110" x2="630" y2="110" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
              <text x="580" y="103" fill="#38bdf8" fontSize="13" fontWeight="bold">CO</text>

              {/* Feedback path down and left */}
              <line x1="560" y1="110" x2="560" y2="175" stroke="#f43f5e" strokeWidth="2" />
              <line x1="560" y1="175" x2="525" y2="175" stroke="#f43f5e" strokeWidth="2" markerEnd="url(#arrow-dash)" />

              {/* I Filter Block (Lag Filter: 1 / (Ti s + 1)) */}
              <g onClick={() => setSelectedNode('I_RF')} className="cursor-pointer">
                <rect x="470" y="155" width="55" height="40" rx="5" fill={selectedNode === 'I_RF' ? '#c2410c' : '#1e293b'} stroke="#fb923c" strokeWidth="2" />
                <text x="494" y="180" fill="#f8fafc" fontSize="15" fontWeight="bold">I</text>
                <text x="475" y="193" fill="#fdba74" fontSize="8">1/(Ti s + 1)</text>
              </g>

              {/* Back to Summing Junction */}
              <line x1="470" y1="175" x2="415" y2="175" stroke="#f43f5e" strokeWidth="2" />
              <line x1="415" y1="175" x2="415" y2="125" stroke="#f43f5e" strokeWidth="2" markerEnd="url(#arrow-dash)" />

              {/* Process Block Gp */}
              <rect x="635" y="85" width="60" height="50" rx="6" fill="#064e3b" stroke="#34d399" strokeWidth="2" />
              <text x="653" y="115" fill="#f8fafc" fontSize="15" fontWeight="bold">Gp</text>

              {/* PV Feedback loop */}
              <line x1="695" y1="110" x2="735" y2="110" stroke="#34d399" strokeWidth="2" />
              <circle cx="735" cy="110" r="3" fill="#34d399" />
              <text x="740" y="114" fill="#34d399" fontSize="12" fontWeight="bold">PV</text>
              <line x1="735" y1="110" x2="735" y2="240" stroke="#34d399" strokeWidth="2" />
              <line x1="735" y1="240" x2="145" y2="240" stroke="#34d399" strokeWidth="2" />
              <line x1="145" y1="240" x2="145" y2="128" stroke="#34d399" strokeWidth="2" markerEnd="url(#arrow-green)" />
            </g>
          )}
        </svg>
      </div>

      {/* Explanatory Node Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-300">
        {type === 'interactive' && (
          <div>
            <span className="font-semibold text-amber-300">Interactive (Series) Architecture: </span>
            The proportional action affects derivative, and <strong className="text-white">both</strong> proportional and derivative affect integral action. Changing <MathFormula math="T_d" /> shifts effective <MathFormula math="K_c" /> and <MathFormula math="T_i" />:
            <MathFormula math="K_c' = K_c \left(1 + \frac{T_d}{T_i}\right), \quad T_i' = T_i + T_d, \quad T_d' = \frac{T_i T_d}{T_i + T_d}" block />
            Used in pneumatic & analog electronics due to mechanical feedback bellows.
          </div>
        )}
        {type === 'standard' && (
          <div>
            <span className="font-semibold text-cyan-300">Standard (ISA / Non-Interactive): </span>
            Proportional gain <MathFormula math="K_c" /> multiplies both <MathFormula math="I" /> and <MathFormula math="D" />, but <strong className="text-white">integral does not affect derivative</strong>.
            <MathFormula math="CO(s) = K_c \left( 1 + \frac{1}{T_i s} + T_d s \right) E(s)" block />
            Most industrial tuning rules (Ziegler-Nichols, Cohen-Coon) were specifically developed for this algorithm.
          </div>
        )}
        {type === 'parallel' && (
          <div>
            <span className="font-semibold text-emerald-300">Parallel (Independent): </span>
            Completely uncoupled paths:
            <MathFormula math="CO(s) = \left( K_p + \frac{K_i}{s} + K_d s \right) E(s)" block />
            Challenging to tune directly with handbook rules because <MathFormula math="K_i = \frac{K_c}{T_i}" /> and <MathFormula math="K_d = K_c T_d" />.
          </div>
        )}
        {(type === 'bumpless_auto' || type === 'bumpless_man') && (
          <div>
            <span className="font-semibold text-rose-300">Bumpless Transfer 3 Golden Rules: </span>
            1) SP tracks PV in Manual (prevents error spike). 
            2) PID algorithm output tracks CO in Manual. 
            3) Controller manual output setting tracks CO in Automatic.
          </div>
        )}
        {type === 'reset_feedback' && (
          <div>
            <span className="font-semibold text-red-300">Reset Feedback Mechanics: </span>
            By feeding the bounded output <MathFormula math="CO_{\text{limited}}" /> back through <MathFormula math="\frac{1}{T_i s + 1}" />, the integral accumulator is physically prevented from exceeding output limits (-5% to 105%), completely stopping reset windup!
          </div>
        )}
      </div>
    </div>
  );
};
