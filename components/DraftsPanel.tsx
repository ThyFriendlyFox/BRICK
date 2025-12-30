import React, { useState, useEffect } from 'react';
import { Play, Check, Edit2, Zap, GitBranch, Eye, Cpu } from 'lucide-react';
import { Draft, Platform, TriggerSource } from '../types';
import { generateDraftContent } from '../services/geminiService';
import { SAMPLE_CODE_SNIPPET } from '../constants';

interface DraftsPanelProps {
  activePlatform: Platform;
  setActivePlatform: (p: Platform) => void;
  triggerContext: string | null;
  triggerSource: TriggerSource;
  toneContext: string;
}

const DraftsPanel: React.FC<DraftsPanelProps> = ({ 
    activePlatform, 
    setActivePlatform, 
    triggerContext, 
    triggerSource,
    toneContext 
}) => {
  const [currentDraft, setCurrentDraft] = useState<Draft | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<Draft[]>([]);

  useEffect(() => {
    if (triggerContext) {
      handleGenerate(triggerContext, triggerSource);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerContext, triggerSource]);

  const handleGenerate = async (context: string, source: TriggerSource) => {
    setIsGenerating(true);
    setCurrentDraft(null); 
    
    const result = await generateDraftContent(activePlatform, context, SAMPLE_CODE_SNIPPET, toneContext);
    
    const newDraft: Draft = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      platform: activePlatform,
      content: result.content,
      source: source,
      title: result.title,
      posted: false,
    };

    setCurrentDraft(newDraft);
    setIsGenerating(false);
  };

  const handlePost = () => {
    if (!currentDraft) return;
    const postedDraft = { ...currentDraft, posted: true };
    setHistory(prev => [postedDraft, ...prev]);
    setCurrentDraft(null);
  };

  const getSourceIcon = (source: TriggerSource) => {
    switch (source) {
        case 'AGENT_LOG': return <Cpu size={10} className="text-df-orange" />;
        case 'FILE_PULSE': return <Eye size={10} className="text-df-orange" />;
        default: return <GitBranch size={10} className="text-df-gray" />;
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-df-black relative">
      <div className="flex-grow flex flex-col p-6 border-b border-df-border overflow-y-auto relative min-h-[50%]">
        {isGenerating && (
          <div className="absolute top-0 left-0 w-full h-1 bg-df-border overflow-hidden">
             <div className="h-full bg-df-orange animate-pulse w-1/3 mx-auto shadow-[0_0_5px_#FF6200]"></div>
          </div>
        )}

        {!currentDraft && !isGenerating && (
          <div className="flex items-center justify-center h-full text-df-gray text-[10px] uppercase tracking-[0.2em] font-bold opacity-30 text-center">
            Awaiting Protocol Pulse...<br/>(Commit, Thought, or Change)
          </div>
        )}

        {currentDraft && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold text-df-orange uppercase tracking-widest">
                    Drafting for {activePlatform}
                </div>
                <div className="flex items-center gap-2 bg-[#111] border border-df-border px-2 py-1">
                    {getSourceIcon(currentDraft.source)}
                    <span className="text-[9px] font-bold text-df-gray uppercase tracking-tighter">{currentDraft.source}</span>
                </div>
            </div>

            {activePlatform === Platform.REDDIT && currentDraft.title && (
              <div className="mb-4 font-bold text-lg text-df-white border-l-2 border-df-orange pl-3 uppercase tracking-tighter">
                {currentDraft.title}
              </div>
            )}

            <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-df-white selection:bg-df-orange/30">
              {currentDraft.content}
            </div>

            <div className="mt-6 border border-df-border bg-black w-full max-w-[240px] relative group cursor-pointer overflow-hidden">
               <div className="aspect-video bg-[#111] p-3 flex flex-col gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <div className="h-1 w-2/3 bg-df-orange/20"></div>
                  <div className="h-1 w-1/2 bg-df-orange/20"></div>
                  <div className="h-1 w-3/4 bg-df-orange/20"></div>
                  <div className="mt-auto text-[9px] text-df-orange font-mono uppercase tracking-tight">Attached Context Blob</div>
               </div>
            </div>
          </div>
        )}
      </div>

      <div className="h-16 flex items-center border-b border-df-border bg-df-black shrink-0">
        <button className="h-full px-6 text-df-white text-[10px] font-bold hover:text-df-orange border-r border-df-border flex items-center gap-2 transition-colors uppercase">
          <Edit2 size={12} /> Edit
        </button>
        
        <div className="flex-grow flex items-center justify-center gap-6">
          <button 
            onClick={() => setActivePlatform(Platform.X)}
            className={`text-[10px] font-bold uppercase transition-all tracking-widest ${activePlatform === Platform.X ? 'text-df-orange border-b-2 border-df-orange pt-1' : 'text-df-gray hover:text-white'}`}
          >
            X
          </button>
          <button 
             onClick={() => setActivePlatform(Platform.REDDIT)}
             className={`text-[10px] font-bold uppercase transition-all tracking-widest ${activePlatform === Platform.REDDIT ? 'text-df-orange border-b-2 border-df-orange pt-1' : 'text-df-gray hover:text-white'}`}
          >
            Reddit
          </button>
        </div>

        <button 
          onClick={handlePost}
          disabled={!currentDraft}
          className={`
            h-full px-12 text-[10px] font-bold transition-all uppercase tracking-[0.2em]
            ${currentDraft 
              ? 'bg-df-orange text-df-black hover:bg-white' 
              : 'bg-[#111] text-df-gray cursor-not-allowed border-l border-df-border'}
          `}
        >
          {currentDraft ? 'Post' : 'Syncing'}
        </button>
      </div>

      <div className="h-40 overflow-y-auto bg-black p-4 border-t border-df-border">
         <div className="text-[9px] text-df-gray mb-3 uppercase tracking-[0.2em] font-bold border-b border-df-border/30 pb-1 flex justify-between">
            <span>Session Logs</span>
            <span>Live Stream</span>
         </div>
         <div className="flex flex-col gap-1">
            {history.length === 0 && (
                <div className="text-df-gray/20 text-[9px] italic uppercase text-center mt-4 tracking-widest">Awaiting transmissions...</div>
            )}
            {history.map((draft) => (
                <div 
                  key={draft.id} 
                  className="group flex items-center gap-3 p-2 hover:bg-[#111] border border-transparent hover:border-df-border transition-colors cursor-default"
                >
                    <div className="text-[9px] text-df-gray/40 font-mono w-16">
                        [{new Date(draft.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}]
                    </div>
                    <div className="flex-grow">
                        <div className="text-[10px] text-df-white line-clamp-1 font-mono uppercase tracking-tight">
                            {draft.title || draft.content}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {getSourceIcon(draft.source)}
                        {draft.posted && <Check size={12} className="text-df-orange" />}
                    </div>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default DraftsPanel;