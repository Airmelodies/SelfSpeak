/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useRef, useState } from 'react';
import { ClockIcon, UserIcon, ArrowRightIcon, TrashIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { UserProfile } from '../services/gemini';

export interface Creation {
  id: string;
  name: string;
  html: string; // This now holds JSON data
  originalImage?: string; // Kept for type compatibility but unused
  timestamp: Date;
  profile?: UserProfile;
}

interface CreationHistoryProps {
  history: Creation[];
  onSelect: (creation: Creation) => void;
  onDelete?: (id: string, e: React.MouseEvent) => void;
  onImport?: (creation: Creation) => void;
}

export const CreationHistory: React.FC<CreationHistoryProps> = ({ history, onSelect, onDelete, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleExport = (creation: Creation, e: React.MouseEvent) => {
    e.stopPropagation();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(creation));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `profile_${creation.id.substring(0, 8)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.id && json.html) {
          json.timestamp = new Date(json.timestamp);
          if (onImport) onImport(json);
        } else {
          alert("Invalid profile JSON format.");
        }
      } catch (err) {
        alert("Failed to parse JSON.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center space-x-3 mb-3 px-2">
        <ClockIcon className="w-4 h-4 text-zinc-500" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Previous Profiles</h2>
        <div className="h-px flex-1 bg-zinc-800"></div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center space-x-1 text-xs text-zinc-400 hover:text-white transition-colors"
          title="Load Profile from JSON"
        >
          <ArrowUpTrayIcon className="w-4 h-4" />
          <span>Import</span>
        </button>
        <input 
          type="file" 
          accept=".json" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange} 
        />
      </div>
      
      <div className="flex overflow-x-auto space-x-4 pb-4 px-2 scrollbar-hide">
        {history.map((item) => {
          return (
            <div key={item.id} className="group flex-shrink-0 relative flex flex-col text-left w-48 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-lg transition-all duration-200 overflow-hidden cursor-pointer" onClick={() => onSelect(item)}>
              <div className="p-4 flex flex-col h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-1.5 bg-zinc-800 rounded group-hover:bg-zinc-700 transition-colors border border-zinc-700/50">
                      <UserIcon className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex flex-col items-end gap-1 relative z-20">
                    <span className="text-[10px] font-mono text-zinc-600 group-hover:text-zinc-400">
                      {item.timestamp.toLocaleDateString()}
                    </span>
                    <div className="flex space-x-1 mt-1 bg-zinc-800/80 rounded-lg border border-zinc-700/50 p-1">
                      {deletingId === item.id ? (
                          <>
                             <button onClick={(e) => { e.stopPropagation(); onDelete && onDelete(item.id, e); setDeletingId(null); }} className="p-1 text-red-400 hover:text-red-300 rounded hover:bg-zinc-700 transition-colors" title="Confirm Delete">
                               <CheckIcon className="w-4 h-4" />
                             </button>
                             <button onClick={(e) => { e.stopPropagation(); setDeletingId(null); }} className="p-1 text-zinc-400 hover:text-zinc-300 rounded hover:bg-zinc-700 transition-colors" title="Cancel">
                               <XMarkIcon className="w-4 h-4" />
                             </button>
                          </>
                      ) : (
                          <>
                              <button onClick={(e) => handleExport(item, e)} className="p-1.5 text-zinc-400 hover:text-blue-400 rounded hover:bg-zinc-700 transition-colors" title="Export as JSON">
                                <ArrowDownTrayIcon className="w-4 h-4" />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); setDeletingId(item.id); }} className="p-1.5 text-zinc-400 hover:text-red-500 rounded hover:bg-zinc-700 transition-colors" title="Delete Profile">
                                <TrashIcon className="w-4 h-4" />
                              </button>
                          </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-auto">
                  <h3 className="text-sm font-medium text-zinc-300 group-hover:text-white truncate">
                    {item.name}
                  </h3>
                  <div className="flex items-center space-x-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Review</span>
                    <ArrowRightIcon className="w-3 h-3 text-blue-400" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {history.length === 0 && (
          <div className="text-zinc-500 text-sm py-4 px-2">No history yet</div>
        )}
      </div>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};