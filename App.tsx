import React, { useState, useEffect } from 'react';
import { Settings, Square, Terminal, Cpu, Activity } from 'lucide-react';
import DraftsPanel from './components/DraftsPanel';
import FeedbackPanel from './components/FeedbackPanel';
import SettingsPanel from './components/SettingsPanel';
import Onboarding from './components/Onboarding';
import { Platform, TriggerSource, AgentLog, UserConfig } from './types';

export type ActivityTab = 'devflow' | 'settings';

const App: React.FC = () => {
  const [view, setView] = useState<'onboarding' | 'main'>('onboarding');
  const [activeActivity, setActiveActivity] = useState<ActivityTab>('devflow');
  const [activeTab, setActiveTab] = useState<'drafts' | 'feedback'>('drafts');
  const [activePlatform, setActivePlatform] = useState<Platform>(Platform.X);
  
  // Simulation States
  const [isIdeConnected, setIsIdeConnected] = useState(false);
  const [mcpEnabled, setMcpEnabled] = useState(true);
  const [fileWatcherEnabled, setFileWatcherEnabled] = useState(true);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [autoTrigger, setAutoTrigger] = useState<{context: string, source: TriggerSource} | null>(null);

  // Tone Calibration
  const [toneContext, setToneContext] = useState<string>('');

  const handleOnboardingComplete = (config: UserConfig) => {
    setMcpEnabled(config.mcpEnabled);
    setFileWatcherEnabled(config.fileWatcherEnabled);
    setView('main');
  };

  // Simulation: Real-time Protocol activity
  useEffect(() => {
    if (!isIdeConnected) return;

    let logInterval: any;
    let pulseInterval: any;

    if (mcpEnabled) {
      logInterval = setInterval(() => {
        const messages = [
          "Thought: Refactoring the auth hook to use native GenAI streaming.",
          "Action: Analyzing performance bottlenecks in feed rendering.",
          "Thought: The user experience would be better if we added a brutalist splash screen.",
          "Action: Optimized 4 redundant API calls in the feedback loop.",
          "Action: Updating MCP transport protocol to v2.1."
        ];
        const msg = messages[Math.floor(Math.random() * messages.length)];
        const newLog: AgentLog = { id: Date.now().toString(), timestamp: Date.now(), message: msg, type: 'thought' };
        setAgentLogs(prev => [newLog, ...prev].slice(0, 30));
        
        // Random chance to trigger a draft based on agent activity
        if (Math.random() > 0.85) {
          setAutoTrigger({ context: msg, source: 'AGENT_LOG' });
        }
      }, 7000);
    }

    if (fileWatcherEnabled) {
      pulseInterval = setInterval(() => {
        if (Math.random() > 0.92) {
          const fileContext = "Detected significant changes in src/services/geminiService.ts (added streaming support)";
          setAutoTrigger({ context: fileContext, source: 'FILE_PULSE' });
        }
      }, 15000);
    }

    return () => {
      clearInterval(logInterval);
      clearInterval(pulseInterval);
    };
  }, [isIdeConnected, mcpEnabled, fileWatcherEnabled]);

  const renderContent = () => {
    switch (activeActivity) {
      case 'settings':
        return (
          <SettingsPanel 
            toneContext={toneContext} 
            setToneContext={setToneContext} 
            mcpEnabled={mcpEnabled}
            setMcpEnabled={setMcpEnabled}
            fileWatcherEnabled={fileWatcherEnabled}
            setFileWatcherEnabled={setFileWatcherEnabled}
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
                BRICK needs to be initialized via your IDE agent. Run <code className="text-df-orange uppercase">mcp install brick</code> in your IDE terminal or connect below.
              </p>
              <button 
                onClick={() => setIsIdeConnected(true)}
                className="w-full max-w-xs py-3 bg-df-orange text-df-black font-bold text-xs hover:bg-white transition-colors uppercase border border-df-orange tracking-widest"
              >
                Establish MCP Link
              </button>
              <div className="mt-12 w-full max-w-xs p-3 border border-df-border bg-[#111] text-left mx-auto">
                 <div className="text-[9px] text-df-gray font-bold uppercase mb-2">Protocol Status</div>
                 <div className="flex items-center gap-2 text-[10px] text-df-gray/50">
                    <div className="w-2 h-2 rounded-full bg-red-900"></div>
                    <span className="uppercase">MCP-Transport: Idle</span>
                 </div>
              </div>
            </div>
          );
        }
        return (
          <div className="flex flex-col h-full animate-in fade-in duration-200">
            {/* Unified Header */}
            <div className="h-10 border-b border-df-border flex items-center px-4 bg-df-black shrink-0 justify-between">
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-df-white tracking-widest uppercase">Protocol Active</span>
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${mcpEnabled ? 'bg-green-500 animate-pulse' : 'bg-df-gray'}`}></div>
                        <span className="text-[9px] text-df-gray uppercase font-bold">MCP</span>
                    </div>
                    <div className={`flex items-center gap-2 ${fileWatcherEnabled ? 'opacity-100' : 'opacity-20'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${fileWatcherEnabled ? 'bg-df-orange animate-pulse shadow-[0_0_5px_#FF6200]' : 'bg-df-gray'}`}></div>
                        <span className="text-[9px] text-df-gray uppercase font-bold">Watcher</span>
                    </div>
                </div>
                <div className="flex border-l border-df-border h-full">
                    <button onClick={() => setActiveTab('drafts')} className={`px-4 text-[10px] font-bold uppercase transition-colors ${activeTab === 'drafts' ? 'bg-[#111] text-df-orange' : 'text-df-gray hover:text-white'}`}>Drafts</button>
                    <button onClick={() => setActiveTab('feedback')} className={`px-4 text-[10px] font-bold uppercase relative transition-colors ${activeTab === 'feedback' ? 'bg-[#111] text-df-orange' : 'text-df-gray hover:text-white'}`}>
                        Feedback
                        <span className="absolute top-1 right-1 w-1 h-1 bg-df-orange rounded-full"></span>
                    </button>
                </div>
            </div>

            <div className="flex-grow overflow-hidden flex flex-col lg:flex-row">
              {/* Main Column */}
              <div className="flex-grow h-full border-r border-df-border">
                {activeTab === 'drafts' ? (
                  <DraftsPanel 
                    activePlatform={activePlatform} 
                    setActivePlatform={setActivePlatform} 
                    triggerContext={autoTrigger?.context || null}
                    triggerSource={autoTrigger?.source || 'COMMIT'}
                    toneContext={toneContext}
                  />
                ) : (
                  <FeedbackPanel />
                )}
              </div>

              {/* Right Sidebar: Agent Log */}
              <div className="hidden xl:flex flex-col w-72 bg-df-black h-full shrink-0 animate-in slide-in-from-right duration-500">
                 <div className="p-3 border-b border-df-border flex items-center gap-2 bg-[#050505]">
                    <Terminal size={12} className="text-df-orange" />
                    <span className="text-[10px] font-bold text-df-gray uppercase tracking-widest">Agent Thought Stream</span>
                 </div>
                 <div className="flex-grow overflow-y-auto p-4 font-mono text-[9px] space-y-4">
                    {!mcpEnabled && (
                        <div className="text-df-gray/30 italic text-center mt-12 uppercase">Enable MCP in settings to sync thoughts.</div>
                    )}
                    {agentLogs.length === 0 && mcpEnabled && (
                        <div className="text-df-gray/30 italic text-center mt-12 uppercase">Handshaking...</div>
                    )}
                    {agentLogs.map(log => (
                        <div key={log.id} className="animate-in fade-in slide-in-from-left-2 duration-300 border-l border-df-border pl-2">
                            <span className="text-df-gray/40 block mb-1">[{new Date(log.timestamp).toLocaleTimeString([], {second:'2-digit'})}]</span>
                            <span className="text-df-white leading-relaxed tracking-tight">{log.message}</span>
                        </div>
                    ))}
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
          <Onboarding onComplete={handleOnboardingComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-[#1e1e1e] text-gray-400 font-mono overflow-hidden">
      <div className="w-12 bg-[#181818] flex flex-col items-center py-4 gap-6 shrink-0 border-r border-[#000]">
        <button 
          title="BRICK"
          onClick={() => setActiveActivity('devflow')}
          className={`relative p-1 transition-transform active:scale-95 group mt-2`}
        >
          <div className={`w-8 h-8 flex items-center justify-center text-black font-bold transition-all ${activeActivity === 'devflow' ? 'bg-df-orange shadow-[0_0_10px_#FF6200]' : 'bg-[#333]'}`}>
            <Square size={20} strokeWidth={4} fill={activeActivity === 'devflow' ? 'black' : 'none'} className={activeActivity === 'devflow' ? 'text-black' : 'text-df-gray'} />
          </div>
        </button>
        <div className="mt-auto mb-2 flex flex-col gap-6 items-center">
          <button 
            title="Settings"
            onClick={() => setActiveActivity('settings')}
            className={`p-1 transition-all ${activeActivity === 'settings' ? 'text-df-orange' : 'text-gray-600 hover:text-df-white'}`}
          >
            <Settings size={24} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="flex-grow flex flex-col bg-[#111] relative overflow-hidden items-center justify-center">
         <div className="w-full max-w-7xl h-full flex flex-col bg-df-black border-x border-[#333] shadow-2xl relative z-10 transition-all">
            {renderContent()}
         </div>
      </div>
    </div>
  );
};

export default App;