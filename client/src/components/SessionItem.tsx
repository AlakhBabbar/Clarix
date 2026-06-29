// src/components/SessionItem.tsx
import React from 'react';
import { MessageSquare } from 'lucide-react';
import type { ChatSession } from '../types/chat';

interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  onClick: () => void;
}

export const SessionItem: React.FC<SessionItemProps> = ({ session, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 w-full p-2.5 rounded-md text-left text-sm truncate transition-colors cursor-pointer ${
        isActive 
          ? 'bg-zinc-800 text-white' 
          : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
      }`}
    >
      <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
      <span className="truncate">{session.title}</span>
    </button>
  );
};