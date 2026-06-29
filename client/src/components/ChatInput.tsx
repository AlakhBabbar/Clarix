// src/components/ChatInput.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
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
  const [isCapped, setIsCapped] = useState<boolean>(false); // <-- Tracks if we hit the height ceiling
  const isCentered = variant === 'centered';

  const MAX_HEIGHT = 160;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const currentScrollHeight = textareaRef.current.scrollHeight;
      
      if (currentScrollHeight >= MAX_HEIGHT) {
        textareaRef.current.style.height = `${MAX_HEIGHT}px`;
        setIsCapped(true); // Turn scrollbar ON
      } else {
        textareaRef.current.style.height = `${currentScrollHeight}px`;
        setIsCapped(false); // Keep scrollbar strictly HIDDEN
      }
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        e.currentTarget.form?.requestSubmit();
      }
    }
  };

  return (
    <form onSubmit={onSubmit} className="w-full">
      {/* 
        THE MASTER CONTAINER: 
        Wraps both the textarea and the button in a single dark pill, 
        but keeps them vertically stacked so they never collide! 
      */}
      <div className={`w-full bg-zinc-900/90 border border-zinc-800 transition-all flex flex-col justify-between ${
        isCentered 
          ? 'rounded-2xl p-3 shadow-2xl focus-within:border-zinc-600' 
          : 'rounded-xl p-2.5 focus-within:border-zinc-700'
      }`}>
        
        {/* TOP FLOOR: Pure Text Entry */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className={`w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none resize-none leading-relaxed px-1.5 pt-1 ${
            isCapped ? 'overflow-y-auto' : 'overflow-y-hidden'
          }`}
        />

        {/* BOTTOM FLOOR: Dedicated Action Bar */}
        <div className="flex items-center justify-end w-full pt-2 mt-1 border-t border-transparent">
          <button 
            type="submit"
            className="p-1.5 bg-zinc-800 text-zinc-300 rounded-lg hover:text-white hover:bg-zinc-700 transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-zinc-800"
            disabled={!value.trim()}
            title="Send Message (Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </form>
  );
};