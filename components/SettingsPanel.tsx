import React, { useState } from 'react';
import { Shield, Zap, Globe, Cpu, Link, Lock, EyeOff, Mic, Upload, Check } from 'lucide-react';

interface SettingsPanelProps {
  toneContext: string;
  setToneContext: (s: string) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ toneContext, setToneContext }) => {
  const [analyzed, setAnalyzed] = useState(false);

  const handleSimulateImport = () => {
    // Simulate importing existing tweets
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
      <div className="p-4 border-b border-df-border flex justify-between items-center">
        <h2 className="text-[10px] font-bold text-df-gray uppercase tracking-widest">SETTINGS</h2>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-8">
        {/* TONE CALIBRATION SECTION */}
        <section>
          <h3 className="text-[10px] font-bold text-df-orange uppercase mb-4 flex items-center gap-2">
            <Mic size={12} /> TONE CALIBRATION
          </h3>
          <div className="space-y-4">
            <div className="bg-[#111] border border-df-border p-3">
              <p className="text-[10px] text-df-gray mb-3">
                Paste previous posts to train the AI on your specific writing style.
              </p>
              <textarea 
                value={toneContext}
                onChange={(e) => setToneContext(e.target.value)}
                placeholder="e.g. 'Shipped v2.0 today. The latency drop is insane.'"
                className="w-full bg-black border border-df-border text-xs text-df-white p-3 min-h-[100px] outline-none focus:border-df-orange transition-colors font-mono resize-y"
              />
              <div className="flex justify-between items-center mt-3">
                 <button 
                   onClick={handleSimulateImport}
                   className="flex items-center gap-2 text-[9px] text-df-gray hover:text-df-white uppercase font-bold"
                 >
                    <Upload size={10} /> Import from X History
                 </button>
                 <button 
                    onClick={handleAnalyze}
                    className={`px-4 py-2 text-[10px] font-bold uppercase transition-all ${analyzed ? 'bg-green-900 text-green-400' : 'bg-df-white text-black hover:bg-df-orange'}`}
                 >
                    {analyzed ? <span className="flex items-center gap-1"><Check size={10} /> CALIBRATED</span> : 'CALIBRATE'}
                 </button>
              </div>
            </div>
          </div>
        </section>

        {/* CONNECTION SECTION */}
        <section>
          <h3 className="text-[10px] font-bold text-df-orange uppercase mb-4 flex items-center gap-2">
            <Link size={12} /> MCP CONNECTION
          </h3>
          <div className="space-y-4">
            <div className="p-3 bg-[#111] border border-df-border">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-df-white font-bold">Local Host Port</span>
                <span className="text-[10px] text-green-500">CONNECTED</span>
              </div>
              <code className="text-[10px] text-df-gray">http://localhost:3000/mcp</code>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-df-gray uppercase">Agent Permission Level</label>
              <select className="bg-black border border-df-border text-xs text-df-white p-2 outline-none focus:border-df-orange transition-colors">
                <option>READ_ONLY (SAMPLED)</option>
                <option>FULL_OBSERVATION</option>
                <option>INTERACTIVE</option>
              </select>
            </div>
          </div>
        </section>

        {/* AI ENGINE SECTION */}
        <section>
          <h3 className="text-[10px] font-bold text-df-orange uppercase mb-4 flex items-center gap-2">
            <Cpu size={12} /> AI ENGINE
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-df-gray">Current Model</span>
              <span className="text-xs text-df-white font-mono">gemini-3-flash</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="accent-df-orange" />
              <span className="text-[10px] text-df-gray uppercase">Enable Search Grounding</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="accent-df-orange" />
              <span className="text-[10px] text-df-gray uppercase">Enable Diff Sampling</span>
            </div>
          </div>
        </section>

        {/* PRIVACY SECTION */}
        <section>
          <h3 className="text-[10px] font-bold text-df-orange uppercase mb-4 flex items-center gap-2">
            <Shield size={12} /> PRIVACY
          </h3>
          <div className="space-y-4">
            <div className="p-3 bg-[#111] border border-df-border border-dashed">
              <p className="text-[10px] text-df-gray mb-2">Sensitive filenames or patterns to ignore (e.g. .env, *.pem)</p>
              <div className="flex gap-2">
                <span className="text-[9px] bg-black border border-df-border px-1 text-df-white">.env</span>
                <span className="text-[9px] bg-black border border-df-border px-1 text-df-white">secrets/*</span>
              </div>
            </div>
            <button className="w-full py-2 border border-df-border text-[10px] text-df-gray hover:text-df-white hover:border-df-white transition-colors uppercase">
              Clear Local Cache
            </button>
          </div>
        </section>

        {/* FOOTER */}
        <div className="pt-8 text-center">
            <p className="text-[9px] text-df-gray/30 uppercase tracking-[0.2em]">BRICK v1.0.4-alpha</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;