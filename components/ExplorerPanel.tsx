import React from 'react';
import { ChevronRight, ChevronDown, FileCode, Folder, FolderOpen } from 'lucide-react';

const ExplorerPanel: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-df-black">
      <div className="p-4 border-b border-df-border flex justify-between items-center">
        <h2 className="text-[10px] font-bold text-df-gray uppercase tracking-widest">EXPLORER</h2>
      </div>
      <div className="overflow-y-auto py-2">
        <div className="flex items-center px-4 py-1 text-xs text-df-white font-bold gap-1 cursor-pointer hover:bg-[#111]">
          <ChevronDown size={14} />
          <span>BRICK</span>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center px-6 py-1 text-xs text-df-gray gap-1 hover:bg-[#111] cursor-pointer">
            <ChevronDown size={14} />
            <FolderOpen size={14} className="text-df-orange" />
            <span>src</span>
          </div>
          <div className="flex flex-col pl-10">
            <div className="flex items-center py-1 text-xs text-df-gray gap-1 hover:bg-[#111] cursor-pointer">
              <ChevronRight size={14} />
              <Folder size={14} />
              <span>components</span>
            </div>
            <div className="flex items-center py-1 text-xs text-df-gray gap-1 hover:bg-[#111] cursor-pointer">
              <ChevronRight size={14} />
              <Folder size={14} />
              <span>services</span>
            </div>
            <div className="flex items-center py-1 text-xs text-df-white gap-2 hover:bg-[#111] cursor-pointer">
              <FileCode size={14} className="text-blue-400" />
              <span>App.tsx</span>
            </div>
            <div className="flex items-center py-1 text-xs text-df-gray gap-2 hover:bg-[#111] cursor-pointer">
              <FileCode size={14} className="text-[#e8ae5b]" />
              <span>types.ts</span>
            </div>
            <div className="flex items-center py-1 text-xs text-df-gray gap-2 hover:bg-[#111] cursor-pointer">
              <FileCode size={14} className="text-[#e8ae5b]" />
              <span>constants.ts</span>
            </div>
          </div>
          <div className="flex items-center px-6 py-1 text-xs text-df-gray gap-2 hover:bg-[#111] cursor-pointer">
            <FileCode size={14} className="text-df-orange" />
            <span>metadata.json</span>
          </div>
          <div className="flex items-center px-6 py-1 text-xs text-df-gray gap-2 hover:bg-[#111] cursor-pointer">
            <FileCode size={14} className="text-df-orange" />
            <span>package.json</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplorerPanel;