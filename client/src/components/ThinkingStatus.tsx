// client/src/components/ThinkingStatus.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';

interface ThinkingStatusProps {
  status: string | null;
}

export const ThinkingStatus: React.FC<ThinkingStatusProps> = ({ status }) => {
  if (!status) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 mb-4 max-w-fit rounded-xl bg-zinc-900/50 border border-zinc-800/80 text-zinc-400 text-sm animate-fade-in shadow-lg backdrop-blur-sm">
      {/* The spinning loader icon */}
      <Loader2 className="w-4 h-4 animate-spin text-zinc-300" />
      
      {/* The dynamic text */}
      <span className="font-medium tracking-wide">{status}</span>
    </div>
  );
};