// client/src/components/Sidebar.tsx
import React from 'react';
import { Plus, PanelLeftClose } from 'lucide-react';
import type { ChatSession } from '../types/chat';
import { BrandHeader } from './BrandHeader';
import { SessionItem } from './SessionItem';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isOpen: boolean;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onCloseMobile: () => void;
  onDeleteSession: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  isOpen,
  onSelectSession,
  onNewSession,
  onCloseMobile,
  onDeleteSession,
}) => {
  return (
    <aside className={`transition-all duration-300 ease-in-out bg-zinc-950 shrink-0 flex flex-col justify-between fixed inset-y-0 left-0 z-50 md:relative md:z-0 ${
      isOpen ? 'w-full p-4 md:w-64 border-r border-zinc-800/80' : 'w-0 p-0 border-transparent overflow-hidden'
    }`}>
      
      <div className="w-full md:w-56 flex flex-col justify-between h-full">
        <div className="flex flex-col gap-6">
          
          {/* Brand Row + Mobile Escape Button */}
          <div className="flex items-center justify-between">
            <BrandHeader />
            <button 
              onClick={onCloseMobile}
              className="md:hidden p-2 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Close Sidebar"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>

          {/* New Session Button */}
          <button 
            onClick={onNewSession}
            className="flex items-center justify-between w-full p-3 rounded-lg border border-zinc-800/80 hover:bg-zinc-900 transition-all text-sm text-zinc-300 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Session
            </span>
          </button>

          {/* History List */}
          <div className="flex flex-col gap-1 overflow-y-auto max-h-[60vh] pr-1">
            <p className="text-xs font-semibold text-zinc-500 px-2 mb-2 uppercase tracking-wider">History</p>
            {sessions.map((s) => (
              <SessionItem 
                key={s._id}
                session={s}
                isActive={activeSessionId === s._id}
                onClick={() => onSelectSession(s._id)}
                onDeleteClick={() => {
                  const confirmed = window.confirm(
                    `Are you sure you want to delete "${s.title}"?\n\nThis will permanently erase all messages and associated document files.`
                  );
                  if (confirmed) {
                    onDeleteSession(s._id);
                  }
                }}
              />
            ))}
          </div>

        </div>

        {/* Footer info */}
        <div className="p-2 border-t border-zinc-900 text-xs text-zinc-600 flex justify-between items-center">
          <span>v1.0.0 MVP</span>
        </div>
      </div>

    </aside>
  );
};