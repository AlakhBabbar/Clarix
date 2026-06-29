// src/components/ChatInput.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Send, Paperclip, X } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (e: React.FormEvent, attachedFile: File | null) => void; // <-- Upgraded to accept File
  placeholder?: string;
  variant?: 'centered' | 'docked';
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Message Clarix...",
  variant = "docked"
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // <-- Hidden file gatekeeper
  
  const [isCapped, setIsCapped] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // <-- Local file custody
  
  const isCentered = variant === 'centered';
  const MAX_HEIGHT = 160;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const currentScrollHeight = textareaRef.current.scrollHeight;
      
      if (currentScrollHeight >= MAX_HEIGHT) {
        textareaRef.current.style.height = `${MAX_HEIGHT}px`;
        setIsCapped(true);
      } else {
        textareaRef.current.style.height = `${currentScrollHeight}px`;
        setIsCapped(false);
      }
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() || selectedFile) {
        handleTriggerSubmit(e);
      }
    }
  };

  const handleTriggerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() && !selectedFile) return;

    // Pass both the text prompt AND the raw binary File object to ChatPage.tsx
    onSubmit(e, selectedFile);
    setSelectedFile(null); // Clear the parcel staging area after launch
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      
      // THE AMNESIA INJECTION:
      e.target.value = ''; 
    }
  };

  return (
    <form onSubmit={handleTriggerSubmit} className="w-full">
      <div className={`w-full bg-zinc-900/90 border border-zinc-800 transition-all flex flex-col justify-between ${
        isCentered 
          ? 'rounded-2xl p-3 shadow-2xl focus-within:border-zinc-600' 
          : 'rounded-xl p-2.5 focus-within:border-zinc-700'
      }`}>
        
        {/* ================= STAGED FILE PREVIEW PILL ================= */}
        {selectedFile && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 mb-2 bg-zinc-800/80 border border-zinc-700/60 rounded-lg text-xs text-zinc-300 select-none animate-fade-in w-fit max-w-[90%]">
            <span className="truncate">📎 {selectedFile.name}</span>
            <button 
              type="button" 
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = ''; // Force DOM reset
              }}
              className="p-0.5 hover:text-white hover:bg-zinc-700 rounded transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* TOP FLOOR: Text Entry */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedFile ? "Add a message about this file..." : placeholder}
          rows={1}
          className={`w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none resize-none leading-relaxed px-1.5 pt-1 ${
            isCapped ? 'overflow-y-auto' : 'overflow-y-hidden'
          }`}
        />

        {/* BOTTOM FLOOR: Action Bar */}
        <div className="flex items-center justify-between w-full pt-2 mt-1 border-t border-transparent">
          
          {/* HIDDEN INPUT GATEKEEPER */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            accept=".pdf,.docx,.txt,.csv,.png,.jpg,.jpeg"
          />

          {/* PAPERCLIP UPLOAD TRIGGER */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-all cursor-pointer"
            title="Attach Document"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* SEND BUTTON */}
          <button 
            type="submit"
            className="p-1.5 bg-zinc-800 text-zinc-300 rounded-lg hover:text-white hover:bg-zinc-700 transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-zinc-800"
            disabled={!value.trim() && !selectedFile}
            title="Send Message (Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </form>
  );
};