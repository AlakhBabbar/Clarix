// client/src/components/SessionItem.tsx
import React, { useState } from 'react';
import { MessageSquare, MoreVertical } from 'lucide-react';
import type { ChatSession } from '../types/chat';
import { ActionMenu } from './ActionMenu';

interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  onClick: () => void;
  onDeleteClick: () => void;
}

export const SessionItem: React.FC<SessionItemProps> = ({ session, isActive, onClick, onDeleteClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="group relative w-full mb-0.5">
      {/* Main Selection Row Button */}
      <button
        onClick={onClick}
        className={`flex items-center gap-2 w-full p-2.5 rounded-md text-left text-sm transition-colors cursor-pointer ${
          isActive 
            ? 'bg-zinc-800 text-white font-medium' 
            : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
        }`}
      >
        <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
        <span className="truncate pr-8 flex-1">{session.title}</span>
      </button>

      {/* The 3-dot Action Menu Anchor */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setIsMenuOpen(!isMenuOpen);
        }}
        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition-all text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200 cursor-pointer ${
          isMenuOpen ? 'opacity-100 bg-zinc-800 border border-zinc-700' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* Action Menu Dropdown */}
      <ActionMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onDelete={onDeleteClick} 
      />
    </div>
  );
};