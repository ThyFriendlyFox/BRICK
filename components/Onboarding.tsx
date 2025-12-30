import React, { useState } from 'react';
import { ArrowRight, Check, Terminal, GitPullRequest, Users, Zap, Square, Cpu, Activity, Server } from 'lucide-react';
import { UserConfig } from '../types';

interface OnboardingProps {
  onComplete: (config: UserConfig) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<UserConfig>({
    xConnected: false,
    redditConnected: false,
    mcpEnabled: true,
    fileWatcherEnabled: true,
    setupComplete: false,
  });

  const handleConnectX = () => {
    setTimeout(() => {
      setConfig((prev) => ({ ...prev, xConnected: true }));
    }, 600);
  };

  const handleConnectReddit = () => {
    setTimeout(() => {
      setConfig((prev) => ({ ...prev, redditConnected: true }));
    }, 600);
  };

  // --- STEP 1: TITLE SCREEN ---
  const renderStep1 = () => (
    <div className="flex flex-col h-full animate-in fade-in zoom-in duration-500 bg-df-black">
       <div className="flex-grow flex flex-col justify-center items-center text-center p-8 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-[#222] rotate-45 pointer-events-none"></div>
          
          <div className="w-20 h-20 bg-df-orange text-black flex items-center justify-center mb-8 relative z-10 shadow-[8px_8px_0px_rgba(255,255,255,0.2)]">
             <Square size={40} strokeWidth={4} fill="black" />
          </div>
          <h1 className="text-8xl font-black tracking-tighter leading-none mb-4 relative z-10">
             BRICK
          </h1>
          <div className="h-2 w-24 bg-df-orange mb-6"></div>
          <p className="text-sm text-df-gray font-mono max-w-[260px] leading-relaxed uppercase tracking-widest">
             Code. Share. Listen.
          </p>
       </div>
       <button 
         onClick={() => setStep(2)}
         className="w-full py-6 bg-df-white text-black font-bold hover:bg-df-orange transition-colors flex items-center justify-center gap-2 group tracking-widest text-sm"
       >
         INITIATE <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
       </button>
    </div>
  );

  // --- STEP 2: DRAFTING ---
  const renderStep2 = () => (
    <div className="flex flex-col h-full animate-in slide-in-from-right duration-500 bg-[#050505]">
      <div className="p-6 pt-12 flex-grow flex flex-col justify-center">
        <div className="mb-2 text-df-orange font-bold text-xs uppercase tracking-widest">Use Case 01</div>
        <h2 className="text-3xl font-bold text-df-white mb-8 leading-tight">NEVER WRITE A CHANGELOG FROM SCRATCH.</h2>
        
        <div className="flex items-center gap-4 mb-8">
            <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 border border-df-gray flex items-center justify-center text-df-gray">
                    <GitPullRequest size={24} />
                </div>
                <span className="text-[10px] uppercase text-df-gray">You Push</span>
            </div>
            <ArrowRight className="text-df-orange" />
            <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-[#222] border border-df-white flex items-center justify-center text-df-white">
                    <Zap size={24} className="fill-current" />
                </div>
                <span className="text-[10px] uppercase text-df-white">AI Drafts</span>
            </div>
        </div>

        <p className="text-df-gray text-sm font-mono leading-relaxed uppercase">
            BRICK observes your local activity and generates context-aware posts for X and Reddit instantly.
        </p>
      </div>

      <div className="flex border-t border-df-border">
          <button onClick={() => setStep(1)} className="w-1/3 py-6 text-df-gray hover:text-white border-r border-df-border text-xs font-bold uppercase">Back</button>
          <button onClick={() => setStep(3)} className="flex-grow py-6 text-df-white hover:bg-[#111] text-xs font-bold uppercase flex items-center justify-center gap-2">Next <ArrowRight size={14}/></button>
      </div>
    </div>
  );

  // --- STEP 3: FEEDBACK ---
  const renderStep3 = () => (
    <div className="flex flex-col h-full animate-in slide-in-from-right duration-500 bg-[#050505]">
      <div className="p-6 pt-12 flex-grow flex flex-col justify-center">
        <div className="mb-2 text-df-orange font-bold text-xs uppercase tracking-widest">Use Case 02</div>
        <h2 className="text-3xl font-bold text-df-white mb-8 leading-tight">ONE INBOX FOR ALL THE NOISE.</h2>
        
        <div className="flex flex-col gap-4 mb-8 pl-4 border-l-2 border-df-orange">
            <div className="flex items-center gap-3">
                <Users size={16} className="text-df-gray" />
                <span className="text-xs text-df-gray font-mono uppercase">"Is this a bug?" (Reddit)</span>
            </div>
            <div className="flex items-center gap-3">
                <Users size={16} className="text-df-gray" />
                <span className="text-xs text-df-gray font-mono uppercase">"Feature request!" (X)</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
                <ArrowRight size={16} className="text-df-orange rotate-90" />
                <div className="px-3 py-1 bg-df-orange text-black text-[10px] font-bold uppercase tracking-tighter">
                    Unified Dashboard
                </div>
            </div>
        </div>

        <p className="text-df-gray text-sm font-mono leading-relaxed uppercase">
            Filter bug reports, praise, and questions from multiple platforms in a single, brutalist view.
        </p>
      </div>

      <div className="flex border-t border-df-border">
          <button onClick={() => setStep(2)} className="w-1/3 py-6 text-df-gray hover:text-white border-r border-df-border text-xs font-bold uppercase">Back</button>
          <button onClick={() => setStep(4)} className="flex-grow py-6 text-df-white hover:bg-[#111] text-xs font-bold uppercase flex items-center justify-center gap-2">Next <ArrowRight size={14}/></button>
      </div>
    </div>
  );

  // --- STEP 4: MCP EXPLAINER ---
  const renderStep4 = () => (
    <div className="flex flex-col h-full animate-in slide-in-from-right duration-500 bg-df-black">
      <div className="p-6 pt-12 flex-grow flex flex-col justify-center">
        <div className="mb-2 text-df-orange font-bold text-xs uppercase tracking-widest">Protocol Sync</div>
        <h2 className="text-3xl font-bold text-df-white mb-6 leading-tight uppercase tracking-tighter">THE IDE CONNECTION.</h2>
        
        <div className="space-y-6 mb-8">
            <div className="flex gap-4 items-start">
                <div className="mt-1 p-2 bg-[#111] border border-df-orange">
                    <Cpu size={20} className="text-df-orange" />
                </div>
                <div>
                    <h4 className="text-xs font-bold text-df-white uppercase mb-1">MCP Thought Stream</h4>
                    <p className="text-[10px] text-df-gray leading-relaxed uppercase">BRICK hooks into your coding agent (Claude, Windsurf) to capture its reasoning and technical decisions as they happen.</p>
                </div>
            </div>
        </div>

        <div className="p-3 bg-black border border-df-border font-mono text-[9px] text-df-orange/80 leading-tight">
            $ mcp install brick --local-server<br/>
            [SYSTEM] Handshaking with Local Host...<br/>
            [SYSTEM] Connection Established via Port 3000
        </div>
      </div>

      <div className="flex border-t border-df-border">
          <button onClick={() => setStep(3)} className="w-1/3 py-6 text-df-gray hover:text-white border-r border-df-border text-xs font-bold uppercase">Back</button>
          <button onClick={() => setStep(5)} className="flex-grow py-6 text-df-white hover:bg-[#111] text-xs font-bold uppercase flex items-center justify-center gap-2">Setup Accounts <ArrowRight size={14}/></button>
      </div>
    </div>
  );

  // --- STEP 5: CONNECTIONS ---
  const renderStep5 = () => (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="p-4 border-b border-df-border flex justify-between items-center bg-[#050505]">
         <span className="text-xs font-bold text-df-gray uppercase">Step 05</span>
         <span className="text-xs text-df-orange uppercase font-bold">Channels</span>
      </div>

      <div className="flex-grow flex flex-col justify-center px-8 space-y-8 bg-df-black">
        <div>
            <h2 className="text-2xl font-bold mb-2 uppercase tracking-tighter">Connect Accounts</h2>
            <p className="text-[10px] text-df-gray uppercase tracking-widest">Link your social profiles to enable drafting. Data stays local.</p>
        </div>

        <div className="flex flex-col gap-4">
            <button
            onClick={handleConnectX}
            disabled={config.xConnected}
            className={`
                w-full py-4 px-6 flex justify-between items-center border 
                transition-all duration-200
                ${config.xConnected 
                ? 'bg-[#111] border-df-border text-df-gray cursor-default' 
                : 'bg-transparent border-df-orange text-df-white hover:bg-df-orange/10'}
            `}
            >
            <span className="font-bold text-xs">X (TWITTER)</span>
            {config.xConnected ? <Check size={16} className="text-green-500" /> : <div className="w-2 h-2 bg-df-orange rounded-full"></div>}
            </button>

            <button
            onClick={handleConnectReddit}
            disabled={config.redditConnected}
            className={`
                w-full py-4 px-6 flex justify-between items-center border 
                transition-all duration-200
                ${config.redditConnected 
                ? 'bg-[#111] border-df-border text-df-gray cursor-default' 
                : 'bg-transparent border-df-orange text-df-white hover:bg-df-orange/10'}
            `}
            >
            <span className="font-bold text-xs">REDDIT</span>
            {config.redditConnected ? <Check size={16} className="text-green-500" /> : <div className="w-2 h-2 bg-df-orange rounded-full"></div>}
            </button>
        </div>
      </div>

      <button 
         onClick={() => onComplete(config)}
         disabled={!config.xConnected && !config.redditConnected}
         className={`w-full py-6 font-bold flex items-center justify-center gap-2 transition-colors uppercase tracking-[0.2em] text-xs
            ${(config.xConnected || config.redditConnected) ? 'bg-df-white text-black hover:bg-df-orange' : 'bg-[#111] text-df-gray cursor-not-allowed'}
         `}
       >
         Enter Studio
       </button>
    </div>
  );

  return (
    <div className="h-full w-full bg-black text-df-white overflow-hidden relative border-r border-[#222]">
      <div className="absolute top-0 left-0 h-1 bg-df-orange transition-all duration-500 ease-out z-50 shadow-[0_0_10px_#FF6200]" style={{ width: `${(step / 5) * 100}%` }}></div>
      
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
      {step === 5 && renderStep5()}
    </div>
  );
};

export default Onboarding;