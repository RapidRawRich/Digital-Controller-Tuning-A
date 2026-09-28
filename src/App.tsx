import React, { useState } from 'react';
import { Navbar, TabKey } from './components/Navbar';
import { InteractivePneumaticVsDigital } from './components/InteractivePneumaticVsDigital';
import { BumplessTransferLab } from './components/BumplessTransferLab';
import { SetpointKickLab } from './components/SetpointKickLab';
import { DerivativeFilterLab } from './components/DerivativeFilterLab';
import { ResetWindupLab } from './components/ResetWindupLab';
import { DigitalScanLab } from './components/DigitalScanLab';
import { SelfTestQuiz } from './components/SelfTestQuiz';
import { ReferenceHandbook } from './components/ReferenceHandbook';

export function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('algorithms');

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'algorithms' && <InteractivePneumaticVsDigital />}
        {activeTab === 'bumpless' && <BumplessTransferLab />}
        {activeTab === 'kick' && <SetpointKickLab />}
        {activeTab === 'dfilter' && <DerivativeFilterLab />}
        {activeTab === 'windup' && <ResetWindupLab />}
        {activeTab === 'scantime' && <DigitalScanLab />}
        {activeTab === 'quiz' && <SelfTestQuiz />}
        {activeTab === 'handbook' && <ReferenceHandbook />}
      </main>

      {/* Modern Industrial Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 px-4 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-semibold text-slate-400">
              Alberta Apprenticeship & Industry Training • ILM 310305dA Simulator
            </span>
          </div>
          <div>
            Built with React 19, TypeScript, KaTeX & Canvas • Ready for GitHub Pages
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
