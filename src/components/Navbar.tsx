import React from 'react';
import { 
  Sliders, 
  ShieldCheck, 
  Zap, 
  Activity, 
  Flame, 
  Cpu, 
  Award, 
  BookOpen,
  Code2,
  Gauge
} from 'lucide-react';

export type TabKey = 
  | 'algorithms'
  | 'bumpless'
  | 'kick'
  | 'dfilter'
  | 'windup'
  | 'scantime'
  | 'quiz'
  | 'handbook';

interface NavbarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: 'algorithms' as TabKey, label: 'Algorithms & Units', icon: Sliders, badge: 'Lab 1' },
    { id: 'bumpless' as TabKey, label: 'Bumpless Transfer', icon: ShieldCheck, badge: 'Lab 2' },
    { id: 'kick' as TabKey, label: 'SP Kick & Softening', icon: Zap, badge: 'Lab 3' },
    { id: 'dfilter' as TabKey, label: 'D-Filter & Noise', icon: Activity, badge: 'Lab 4' },
    { id: 'windup' as TabKey, label: 'Reset Windup & Feedback', icon: Flame, badge: 'Lab 5' },
    { id: 'scantime' as TabKey, label: 'Scan Rate & Delay', icon: Cpu, badge: 'Lab 6' },
    { id: 'quiz' as TabKey, label: 'Self-Test Exam', icon: Award, badge: 'ILM Quiz' },
    { id: 'handbook' as TabKey, label: 'Study Handbook', icon: BookOpen, badge: 'Formulas' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0a0e17]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & ILM Identifier */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Gauge className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-white">
                  Digital Controller Tuning Lab
                </h1>
                <span className="text-[10px] font-semibold bg-sky-950 text-sky-300 border border-sky-600/40 px-2 py-0.5 rounded-full">
                  ILM 310305dA
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Alberta Apprenticeship • Third Period Process Control
              </p>
            </div>
          </div>

          {/* GitHub link button */}
          <a
            href="https://github.com/RapidRawRich/Digital-Controller-Tuning-A"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 transition"
            title="View on GitHub"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>

        {/* Tab Navigation Pill Strip */}
        <nav className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
