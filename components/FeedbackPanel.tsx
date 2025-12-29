import React, { useState } from 'react';
import { RefreshCw, MessageSquare, ExternalLink } from 'lucide-react';
import { MOCK_FEEDBACK } from '../constants';
import { FeedbackItem } from '../types';

const FeedbackPanel: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'question' | 'bug' | 'request' | 'positive'>('all');
  const [items, setItems] = useState<FeedbackItem[]>(MOCK_FEEDBACK);

  const filteredItems = items.filter(item => filter === 'all' || item.type === filter);

  // Group by thread
  const groupedItems: Record<string, FeedbackItem[]> = {};
  filteredItems.forEach(item => {
    if (!groupedItems[item.threadTitle]) {
      groupedItems[item.threadTitle] = [];
    }
    groupedItems[item.threadTitle].push(item);
  });

  return (
    <div className="flex flex-col h-full w-full bg-df-black">
      
      {/* FILTER BAR */}
      <div className="flex items-center justify-between p-4 border-b border-df-border">
         <div className="flex gap-4 text-[10px] font-bold overflow-x-auto no-scrollbar">
            {['ALL', 'QUESTION', 'BUG', 'REQUEST', 'POSITIVE'].map((f) => (
                <button
                    key={f}
                    onClick={() => setFilter(f.toLowerCase() as any)}
                    className={`pb-1 border-b-4 transition-colors whitespace-nowrap ${filter === f.toLowerCase() ? 'border-df-orange text-df-white' : 'border-transparent text-df-gray hover:text-df-white'}`}
                >
                    {f}s
                </button>
            ))}
         </div>
         <button className="text-df-gray hover:text-df-orange transition-colors">
            <RefreshCw size={14} />
         </button>
      </div>

      {/* FEED */}
      <div className="flex-grow overflow-y-auto p-4">
        {Object.keys(groupedItems).length === 0 && (
            <div className="text-center text-df-gray text-xs mt-10">No feedback matching this filter.</div>
        )}

        {Object.entries(groupedItems).map(([threadTitle, feedbackList]) => (
            <div key={threadTitle} className="mb-8">
                <div className="flex items-center gap-2 mb-4 text-df-gray group cursor-pointer hover:text-df-white transition-colors">
                   <MessageSquare size={12} />
                   <h3 className="text-xs uppercase tracking-wider font-bold truncate max-w-[280px]">{threadTitle}</h3>
                   <div className="h-[1px] bg-df-border flex-grow"></div>
                </div>

                <div className="flex flex-col gap-4">
                    {feedbackList.map(item => (
                        <div key={item.id} className="relative pl-4 border-l border-df-border hover:border-df-orange transition-colors group/item">
                            {/* Priority Indicator */}
                            {(item.type === 'bug' || item.type === 'question') && (
                                <div className="absolute left-[-1px] top-0 bottom-0 w-[1px] bg-df-orange"></div>
                            )}

                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-bold text-df-white">{item.username}</span>
                                <span className="text-[10px] text-df-gray">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>

                            <p className="text-xs text-df-gray leading-relaxed font-mono mb-2 group-hover/item:text-df-white transition-colors">
                                {item.content}
                            </p>

                            <div className="flex items-center justify-between">
                                <span className={`text-[9px] uppercase px-1 border ${
                                    item.type === 'bug' ? 'border-red-900 text-red-500' :
                                    item.type === 'positive' ? 'border-green-900 text-green-500' :
                                    'border-df-border text-df-gray'
                                }`}>
                                    {item.type}
                                </span>
                                
                                <button className="text-[10px] text-df-orange flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                    REPLY <ExternalLink size={10} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ))}
      </div>

    </div>
  );
};

export default FeedbackPanel;