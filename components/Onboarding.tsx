
import React, { useState } from 'react';
import { ArrowRight, Check, Terminal, GitPullRequest, Users, Zap, Square, Mail, Code2 } from 'lucide-react';
import { UserConfig } from '../types';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<UserConfig>({
    xConnected: false,
    redditConnected: false,
    emailConnected: false,
    setupComplete: false,
  });

  const handleConnect = (key: keyof UserConfig) => {
    setTimeout(() => {
      setConfig((prev) => ({ ...prev, [key]: true }));
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

  // --- STEP 2: USE CASE (Drafting) ---
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

        <p className="text-df-gray text-xs font-mono leading-relaxed uppercase">
            BRICK OBSERVES YOUR LOCAL GIT COMMITS AND GENERATES CONTEXT-AWARE POSTS FOR X AND REDDIT INSTANTLY.
        </p>
      </div>

      <div className="flex border-t border-df-border">
          <button onClick={() => setStep(1)} className="w-1/3 py-6 text-df-gray hover:text-white border-r border-df-border text-xs font-bold uppercase">Back</button>
          <button onClick={() => setStep(3)} className="flex-grow py-6 text-df-white hover:bg-[#111] text-xs font-bold uppercase flex items-center justify-center gap-2">Next <ArrowRight size={14}/></button>
      </div>
    </div>
  );

  // --- STEP 3: USE CASE (Feedback) ---
  const renderStep3 = () => (
    <div className="flex flex-col h-full animate-in slide-in-from-right duration-500 bg-[#050505]">
      <div className="p-6 pt-12 flex-grow flex flex-col justify-center">
        <div className="mb-2 text-df-orange font-bold text-xs uppercase tracking-widest">Use Case 02</div>
        <h2 className="text-3xl font-bold text-df-white mb-8 leading-tight">ONE INBOX FOR ALL THE NOISE.</h2>
        
        <div className="flex flex-col gap-4 mb-8 pl-4 border-l-2 border-df-border">
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
                <div className="px-3 py-1 bg-df-orange text-black text-xs font-bold uppercase">
                    Unified Dashboard
                </div>
            </div>
        </div>

        <p className="text-df-gray text-xs font-mono leading-relaxed uppercase">
            FILTER BUG REPORTS, PRAISE, AND QUESTIONS FROM MULTIPLE PLATFORMS IN A BRUTALLY FOCUSED VIEW.
        </p>
      </div>

      <div className="flex border-t border-df-border">
          <button onClick={() => setStep(2)} className="w-1/3 py-6 text-df-gray hover:text-white border-r border-df-border text-xs font-bold uppercase">Back</button>
          <button onClick={() => setStep(4)} className="flex-grow py-6 bg-df-white text-black hover:bg-df-gray text-xs font-bold uppercase flex items-center justify-center gap-2">Next <ArrowRight size={14}/></button>
      </div>
    </div>
  );

  // --- STEP 4: PROTOCOL SYNC (NEW) ---
  const renderStep4 = () => (
    <div className="flex flex-col h-full animate-in slide-in-from-right duration-500 bg-[#050505]">
      <div className="p-6 pt-12 flex-grow flex flex-col justify-center">
        <div className="mb-2 text-df-orange font-bold text-xs uppercase tracking-widest">Protocol Sync</div>
        <h2 className="text-3xl font-bold text-df-white mb-2 leading-tight uppercase">THE IDE CONNECTION.</h2>
        <div className="text-sm font-bold text-df-orange mb-8 tracking-widest">MCP THOUGHT STREAM</div>
        
        <div className="bg-[#111] p-4 border border-df-border font-mono text-[10px] mb-8 relative">
           <div className="text-df-orange uppercase">$ mcp install brick --local-server</div>
           <div className="text-df-orange mt-1 uppercase">[SYSTEM] Handshaking with Local Host</div>
           <div className="text-df-orange mt-1 uppercase">[SYSTEM] Connection Established via Port 3000</div>
        </div>

        <p className="text-df-gray text-xs font-mono leading-relaxed uppercase">
            BRICK HOOKS INTO YOUR CODING AGENT (CLAUDE, WINDSURF) TO CAPTURE ITS REASONING AND TECHNICAL DECISIONS AS THEY HAPPEN.
        </p>
      </div>

      <div className="flex border-t border-df-border">
          <button onClick={() => setStep(3)} className="w-1/3 py-6 text-df-gray hover:text-white border-r border-df-border text-xs font-bold uppercase">Back</button>
          <button onClick={() => setStep(5)} className="flex-grow py-6 bg-df-white text-black hover:bg-df-gray text-xs font-bold uppercase flex items-center justify-center gap-2">Connect <ArrowRight size={14}/></button>
      </div>
    </div>
  );

  // --- STEP 5: CONNECTIONS ---
  const renderStep5 = () => (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="p-4 border-b border-df-border flex justify-between items-center">
         <span className="text-xs font-bold text-df-gray">STEP 05</span>
         <span className="text-xs text-df-orange">CHANNELS</span>
      </div>

      <div className="flex-grow flex flex-col justify-center px-8 space-y-8">
        <div>
            <h2 className="text-2xl font-bold mb-2 uppercase">CONNECT ACCOUNTS</h2>
            <p className="text-xs text-df-gray uppercase">Link your social profiles to enable drafting. This runs locally.</p>
        </div>

        <div className="flex flex-col gap-4">
            <button
            onClick={() => handleConnect('xConnected')}
            disabled={config.xConnected}
            className={`
                w-full py-4 px-6 flex justify-between items-center border 
                transition-all duration-200
                ${config.xConnected 
                ? 'bg-[#111] border-df-border text-df-gray cursor-default' 
                : 'bg-transparent border-df-orange text-df-white hover:bg-df-orange/10'}
            `}
            >
            <span className="font-bold flex items-center gap-2">X</span>
            {config.xConnected ? <Check size={16} className="text-green-500" /> : <div className="w-2 h-2 bg-df-orange rounded-full"></div>}
            </button>

            <button
            onClick={() => handleConnect('redditConnected')}
            disabled={config.redditConnected}
            className={`
                w-full py-4 px-6 flex justify-between items-center border 
                transition-all duration-200
                ${config.redditConnected 
                ? 'bg-[#111] border-df-border text-df-gray cursor-default' 
                : 'bg-transparent border-df-orange text-df-white hover:bg-df-orange/10'}
            `}
            >
            <span className="font-bold">REDDIT</span>
            {config.redditConnected ? <Check size={16} className="text-green-500" /> : <div className="w-2 h-2 bg-df-orange rounded-full"></div>}
            </button>

            <button
            onClick={() => handleConnect('emailConnected')}
            disabled={config.emailConnected}
            className={`
                w-full py-4 px-6 flex justify-between items-center border 
                transition-all duration-200
                ${config.emailConnected 
                ? 'bg-[#111] border-df-border text-df-gray cursor-default' 
                : 'bg-transparent border-df-orange text-df-white hover:bg-df-orange/10'}
            `}
            >
            <span className="font-bold flex items-center gap-2">EMAIL</span>
            {config.emailConnected ? <Check size={16} className="text-green-500" /> : <div className="w-2 h-2 bg-df-orange rounded-full"></div>}
            </button>
        </div>
      </div>

      <button 
         onClick={onComplete}
         disabled={!config.xConnected && !config.redditConnected && !config.emailConnected}
         className={`w-full py-4 font-bold flex items-center justify-center gap-2 transition-colors
            ${(config.xConnected || config.redditConnected || config.emailConnected) ? 'bg-df-orange text-black hover:bg-white' : 'bg-[#111] text-df-gray cursor-not-allowed'}
         `}
       >
         ENTER BRICK
       </button>
    </div>
  );

  return (
    <div className="h-full w-full bg-black text-df-white overflow-hidden relative border-r border-[#222]">
      {/* Step Indicator */}
      <div className="absolute top-0 left-0 h-1 bg-df-orange transition-all duration-500 ease-out z-50" style={{ width: `${(step / 5) * 100}%` }}></div>
      
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
      {step === 5 && renderStep5()}
    </div>
  );
};

export default Onboarding;
