// client/src/components/DeleteConfirmationModal.tsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sessionTitle: string;
}

export const DeleteConfirmationModal: React.FC<ModalProps> = ({ isOpen, onClose, onConfirm, sessionTitle }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center gap-3 text-red-400 mb-4">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <h3 className="font-semibold text-lg">Delete Session</h3>
        </div>
        
        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
          Are you sure you want to delete <span className="text-white font-medium">"{sessionTitle}"</span>? This will permanently erase all messages and associated document files from the cloud.
        </p>

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg transition-all text-sm font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all text-sm font-medium cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};