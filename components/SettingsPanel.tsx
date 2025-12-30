import React, { useState } from 'react';
import { Shield, Cpu, Link, Mic, Upload, Check, Activity, Server } from 'lucide-react';

interface SettingsPanelProps {
  toneContext: string;
  setToneContext: (s: string) => void;
  mcpEnabled: boolean;
  setMcpEnabled: (b: boolean) => void;
  fileWatcherEnabled: boolean;
  setFileWatcherEnabled: (b: boolean) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
    toneContext, 
    setToneContext,
    mcpEnabled,
    setMcpEnabled,
    fileWatcherEnabled,
    setFileWatcherEnabled
}) => {
  const [analyzed, setAnalyzed] = useState(false);

  const handleSimulateImport = () => {
    const mockPreviousPosts = 
`1. "Just pushed a fix for the memory leak. Rust ownership rules are a harsh mistress but fair."
2. "Shipping the brutalist redesign today. No gradients, just vibes."
3. "Why does CSS Grid always save the day?"`;
    setToneContext(mockPreviousPosts);
    setAnalyzed(false);
  };

  const handleAnalyze = () => {
    if (!toneContext) return;
    setAnalyzed(true);
    setTimeout(() => setAnalyzed(false), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-df-black">
      <div className="p-4 border-b border-df-border flex justify-between items-center bg-[#050505]">
        <h2 className="text-[10px] font-bold text-df-gray uppercase tracking-widest">Settings / Configuration</h2>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-8">
        
        {/* PROTOCOL SYNC SECTION */}
        <section>
          <h3 className="text-[10px] font-bold text-df-orange uppercase mb-4 flex items-center gap-2">
            <Server size={12} /> Sync Protocols
          </h3>
          <div className="space-y-3">
            <div 
              onClick={() => setMcpEnabled(!mcpEnabled)}
              className={`p-3 border cursor-pointer transition-all ${mcpEnabled ? 'bg-df-orange/5 border-df-orange' : 'bg-[#111] border-df-border'}`}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                    <Link size={14} className={mcpEnabled ? 'text-df-orange' : 'text-df-gray'} />
                    <span className={`text-xs font-bold uppercase ${mcpEnabled ? 'text-df-white' : 'text-df-gray'}`}>Expose MCP Interface</span>
                </div>
                <div className={`w-3 h-3 rounded-full ${mcpEnabled ? 'bg-df-orange shadow-[0_0_8px_#FF6200]' : 'bg-[#333]'}`}></div>
              </div>
              <p className="text-[9px] text-df-gray uppercase leading-relaxed">Broadcast agent thoughts and internal monologue directly to BRICK studio.</p>
            </div>

            <div 
              onClick={() => setFileWatcherEnabled(!fileWatcherEnabled)}
              className={`p-3 border cursor-pointer transition-all ${fileWatcherEnabled ? 'bg-df-orange/5 border-df-orange' : 'bg-[#111] border-df-border'}`}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                    <Activity size={14} className={fileWatcherEnabled ? 'text-df-orange' : 'text-df-gray'} />
                    <span className={`text-xs font-bold uppercase ${fileWatcherEnabled ? 'text-df-white' : 'text-df-gray'}`}>Live File Watcher</span>
                </div>
                <div className={`w-3 h-3 rounded-full ${fileWatcherEnabled ? 'bg-df-orange shadow-[0_0_8px_#FF6200]' : 'bg-[#333]'}`}></div>
              </div>
              <p className="text-[9px] text-df-gray uppercase leading-relaxed">Observe granular file changes for high-fidelity drafting context.</p>
            </div>
          </div>
        </section>

        {/* TONE CALIBRATION SECTION */}
        <section>
          <h3 className="text-[10px] font-bold text-df-orange uppercase mb-4 flex items-center gap-2">
            <Mic size={12} /> Tone Calibration
          </h3>
          <div className="space-y-4">
            <div className="bg-[#111] border border-df-border p-3">
              <p className="text-[10px] text-df-gray mb-3 uppercase font-bold tracking-tight">Paste history to train the AI's voice:</p>
              <textarea 
                value={toneContext}
                onChange={(e) => setToneContext(e.target.value)}
                placeholder="e.g. 'shipped v2.0. the flow is insane.'"
                className="w-full bg-black border border-df-border text-xs text-df-white p-3 min-h-[100px] outline-none focus:border-df-orange transition-colors font-mono resize-y placeholder:opacity-20 uppercase"
              />
              <div className="flex justify-between items-center mt-3">
                 <button onClick={handleSimulateImport} className="text-[9px] text-df-gray hover:text-df-white uppercase font-bold flex items-center gap-1">
                    <Upload size={10} /> Import History
                 </button>
                 <button 
                    onClick={handleAnalyze}
                    className={`px-4 py-2 text-[10px] font-bold uppercase transition-all ${analyzed ? 'bg-green-900 text-green-400' : 'bg-df-white text-black hover:bg-df-orange'}`}
                 >
                    {analyzed ? <span className="flex items-center gap-1"><Check size={10} /> Calibrated</span> : 'Calibrate'}
                 </button>
              </div>
            </div>
          </div>
        </section>

        {/* AI ENGINE SECTION */}
        <section>
          <h3 className="text-[10px] font-bold text-df-orange uppercase mb-4 flex items-center gap-2">
            <Cpu size={12} /> AI Engine
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-df-border pb-2">
              <span className="text-[10px] text-df-gray uppercase">Model</span>
              <span className="text-xs text-df-white font-mono uppercase font-bold">gemini-3-flash</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="accent-df-orange" />
              <span className="text-[9px] text-df-gray uppercase tracking-widest">Grounding Search</span>
            </div>
          </div>
        </section>

        <div className="pt-8 text-center border-t border-df-border">
            <p className="text-[9px] text-df-gray/30 uppercase tracking-[0.3em]">BRICK Protocol v1.2.0-beta</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;