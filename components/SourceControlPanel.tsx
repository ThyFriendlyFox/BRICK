import React from 'react';
import { GitCommit, MoreHorizontal, Plus, Check } from 'lucide-react';

const SourceControlPanel: React.FC = () => {
  const changes = [
    { file: 'App.tsx', status: 'M' },
    { file: 'geminiService.ts', status: 'M' },
    { file: 'constants.ts', status: 'U' },
  ];

  return (
    <div className="flex flex-col h-full bg-df-black">
      <div className="p-4 border-b border-df-border flex justify-between items-center">
        <h2 className="text-[10px] font-bold text-df-gray uppercase tracking-widest">SOURCE CONTROL</h2>
        <MoreHorizontal size={14} className="text-df-gray" />
      </div>
      
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4 bg-[#111] border border-df-border p-2 group">
          <input 
            type="text" 
            placeholder="Message (Ctrl+Enter to commit)" 
            className="bg-transparent text-[10px] flex-grow outline-none text-df-white"
          />
          <Check size={14} className="text-df-gray group-hover:text-df-orange cursor-pointer" />
        </div>

        <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-df-gray uppercase">CHANGES</span>
            <div className="flex gap-2">
                <Plus size={12} className="text-df-gray cursor-pointer" />
                <GitCommit size={12} className="text-df-gray cursor-pointer" />
            </div>
        </div>

        <div className="flex flex-col gap-1">
          {changes.map((c) => (
            <div key={c.file} className="flex items-center justify-between py-1 px-2 hover:bg-[#111] cursor-pointer group">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-xs text-df-white truncate">{c.file}</span>
                <span className="text-[9px] text-df-gray opacity-50 truncate">src/services</span>
              </div>
              <span className={`text-[10px] font-bold w-4 h-4 flex items-center justify-center ${c.status === 'M' ? 'text-yellow-500' : 'text-green-500'}`}>
                {c.status}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8">
            <h3 className="text-[10px] font-bold text-df-gray uppercase mb-2">COMMITS (LAST 24H)</h3>
            <div className="text-[10px] text-df-gray/50 italic px-2">
                Integrated Gemini Flash reasoning for drafts...
            </div>
            <div className="text-[10px] text-df-gray/50 italic px-2 mt-1">
                Refactor: Brutalist design pass...
            </div>
        </div>
      </div>
    </div>
  );
};

export default SourceControlPanel;