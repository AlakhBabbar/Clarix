// client/src/components/ActionMenu.tsx
import React, { useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';

interface ActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ isOpen, onClose, onDelete }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
    ref={menuRef}
    /* CHANGED: Swapped 'right-0 top-8 w-36 py-1' for horizontal line positioning */
    className="absolute right-8 top-1/2 -translate-y-1/2 z-50 w-32 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl p-0.5 animate-fade-in text-xs"
  >
    <button 
      onClick={(e) => { e.stopPropagation(); onDelete(); onClose(); }}
      className="w-full flex items-center gap-1.5 p-1.5 rounded text-red-400 hover:bg-red-500/10 transition-colors text-left cursor-pointer font-medium"
    >
      <Trash2 className="w-3.5 h-3.5" />
      Delete
    </button>
  </div>
  );
};