import React, { useState } from 'react';
import { Activity, Settings, ShieldCheck, Square } from 'lucide-react';
import DraftsPanel from './components/DraftsPanel';
import FeedbackPanel from './components/FeedbackPanel';
import SettingsPanel from './components/SettingsPanel';
import Onboarding from './components/Onboarding';
import { Platform } from './types';

export type ActivityTab = 'devflow' | 'settings';

const App: React.FC = () => {
  const [view, setView] = useState<'onboarding' | 'main'>('onboarding');
  const [activeActivity, setActiveActivity] = useState<ActivityTab>('devflow');
  const [activeTab, setActiveTab] = useState<'drafts' | 'feedback'>('drafts');
  const [activePlatform, setActivePlatform] = useState<Platform>(Platform.X);
  // triggerContext is kept for prop interface, but currently unused without the simulator or real backend
  const [triggerContext, setTriggerContext] = useState<string | null>(null);
  const [isIdeConnected, setIsIdeConnected] = useState(false);
  
  // State for AI Voice Calibration
  const [toneContext, setToneContext] = useState<string>('');

  const renderContent = () => {
    switch (activeActivity) {
      case 'settings':
        return (
          <SettingsPanel 
            toneContext={toneContext} 
            setToneContext={setToneContext} 
          />
        );
        
      case 'devflow':
      default:
        if (!isIdeConnected) {
          return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-df-black animate-in fade-in duration-300">
              <Square size={48} strokeWidth={4} className="text-df-orange mb-6 animate-pulse" />
              <h2 className="text-df-white font-bold text-sm mb-2 uppercase tracking-tighter">AGENT DISCONNECTED</h2>
              <p className="text-df-gray text-[10px] leading-relaxed mb-8 max-w-xs mx-auto">
                BRICK needs to be initialized via your IDE agent. Run <code className="text-df-orange">mcp install brick</code> in your IDE terminal or connect below.
              </p>
              <button 
                onClick={() => setIsIdeConnected(true)}
                className="w-full max-w-xs py-3 bg-df-orange text-df-black font-bold text-xs hover:bg-white transition-colors uppercase border border-df-orange"
              >
                Establish MCP Link
              </button>
              <div className="mt-12 w-full max-w-xs p-3 border border-df-border bg-[#111] text-left mx-auto">
                 <div className="text-[9px] text-df-gray font-bold uppercase mb-2">Protocol Status</div>
                 <div className="flex items-center gap-2 text-[10px] text-df-gray/50">
                    <div className="w-2 h-2 rounded-full bg-red-900"></div>
                    <span>MCP-Transport: Idle</span>
                 </div>
              </div>
            </div>
          );
        }
        return (
          <div className="flex flex-col h-full animate-in fade-in duration-200">
            {/* Mobile/Tablet Tabs - Hidden on Desktop */}
            <div className="h-10 flex border-b border-df-border bg-df-black shrink-0 lg:hidden">
              <button 
                onClick={() => setActiveTab('drafts')}
                className={`flex-1 text-xs font-bold tracking-wider hover:bg-[#111] transition-colors ${activeTab === 'drafts' ? 'text-df-white border-b-4 border-df-orange pt-1' : 'text-df-gray pt-1 border-b-4 border-transparent'}`}
              >
                DRAFTS
              </button>
              <button 
                onClick={() => setActiveTab('feedback')}
                className={`flex-1 text-xs font-bold tracking-wider hover:bg-[#111] transition-colors relative ${activeTab === 'feedback' ? 'text-df-white border-b-4 border-df-orange pt-1' : 'text-df-gray pt-1 border-b-4 border-transparent'}`}
              >
                FEEDBACK
                <span className="absolute top-2 right-8 w-1.5 h-1.5 bg-df-orange rounded-full animate-pulse"></span>
              </button>
            </div>

            {/* Content Area - Responsive Grid */}
            <div className="flex-grow overflow-hidden relative flex flex-col lg:flex-row">
              {/* Left Column (Drafts) */}
              <div className={`flex-grow h-full lg:w-1/2 lg:border-r border-df-border ${activeTab === 'drafts' ? 'block' : 'hidden lg:block'}`}>
                 {/* Desktop Header */}
                 <div className="hidden lg:flex h-10 border-b border-df-border items-center px-4 bg-df-black shrink-0">
                    <span className="text-xs font-bold text-df-white tracking-wider">DRAFTS</span>
                 </div>
                 <div className="h-full lg:h-[calc(100%-40px)]">
                    <DraftsPanel 
                      activePlatform={activePlatform} 
                      setActivePlatform={setActivePlatform} 
                      triggerContext={triggerContext}
                      toneContext={toneContext}
                    />
                 </div>
              </div>

              {/* Right Column (Feedback) */}
              <div className={`flex-grow h-full lg:w-1/2 ${activeTab === 'feedback' ? 'block' : 'hidden lg:block'}`}>
                 {/* Desktop Header */}
                 <div className="hidden lg:flex h-10 border-b border-df-border items-center px-4 bg-df-black shrink-0 relative">
                    <span className="text-xs font-bold text-df-white tracking-wider">FEEDBACK</span>
                    <span className="absolute top-3 right-4 w-1.5 h-1.5 bg-df-orange rounded-full animate-pulse"></span>
                 </div>
                 <div className="h-full lg:h-[calc(100%-40px)]">
                    <FeedbackPanel />
                 </div>
              </div>
            </div>
          </div>
        );
    }
  };

  if (view === 'onboarding') {
    return (
      <div className="h-screen w-screen bg-[#0a0a0a] flex items-center justify-center font-mono">
        <div className="w-[440px] h-[640px] bg-black border border-[#222] relative shadow-[0_0_100px_rgba(255,98,0,0.1)] overflow-hidden">
          <Onboarding onComplete={() => setView('main')} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-[#1e1e1e] text-gray-400 font-mono overflow-hidden selection:bg-df-orange/30">
      {/* 1. Activity Bar (Far Left) */}
      <div className="w-12 bg-[#181818] flex flex-col items-center py-4 gap-6 shrink-0 border-r border-[#000]">
        
        {/* BRICK Tab */}
        <button 
          title="BRICK"
          onClick={() => setActiveActivity('devflow')}
          className={`relative p-1 transition-transform active:scale-95 group mt-2`}
        >
          <div className={`w-8 h-8 flex items-center justify-center text-black font-bold text-lg transition-all ${activeActivity === 'devflow' ? 'bg-df-orange' : 'bg-[#333] hover:bg-[#444]'}`}>
            <Square size={20} strokeWidth={4} fill={activeActivity === 'devflow' ? 'black' : 'none'} className={activeActivity === 'devflow' ? 'text-black' : 'text-df-gray group-hover:text-white'} />
          </div>
          {isIdeConnected && activeActivity !== 'devflow' && (
            <div className="absolute -right-1 top-0 w-2 h-2 bg-green-500 rounded-full border border-black shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
          )}
        </button>
        
        <div className="mt-auto mb-2 flex flex-col gap-6 items-center">
          <button 
            title="Settings"
            onClick={() => setActiveActivity('settings')}
            className={`p-1 transition-all hover:scale-110 ${activeActivity === 'settings' ? 'text-df-orange border-l-2 border-df-orange pl-2' : 'text-gray-600 hover:text-gray-300'}`}
          >
            <Settings size={24} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-grow flex flex-col bg-[#111] relative overflow-hidden items-center justify-center">
         {/* Background Decoration */}
         <div className="absolute inset-0 bg-black/5 flex items-center justify-center pointer-events-none">
            <div className="text-[20vw] font-black text-white/[0.02] select-none -rotate-6 tracking-tighter">BRICK</div>
         </div>
         
         {/* Central Panel Container */}
         <div className="w-full max-w-2xl lg:max-w-7xl h-full flex flex-col bg-df-black border-x border-[#333] shadow-2xl relative z-10 transition-all duration-300">
            {renderContent()}
         </div>
      </div>
    </div>
  );
};

export default App;