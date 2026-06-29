// src/components/ChatBubble.tsx
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Paperclip } from 'lucide-react';
import type { Message } from '../types/chat';

interface ChatBubbleProps {
  message: Message;
}

const HEIGHT_LIMIT = 240;

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isOverflowing, setIsOverflowing] = useState<boolean>(false);
  
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      setIsOverflowing(contentRef.current.scrollHeight > HEIGHT_LIMIT);
    }
  }, [message.content]);

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`relative max-w-[85%] md:max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed transition-all flex flex-col gap-2 ${
        isUser 
          ? 'bg-zinc-800 text-white rounded-br-xs' 
          : 'bg-transparent border border-zinc-800/80 text-zinc-300 rounded-bl-xs'
      }`}>
        
        {/* ================= GEOMETRIC ATTACHMENT CHIP ================= */}
        {message.attachment && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs select-none w-fit max-w-full ${
            isUser 
              ? 'bg-zinc-900/80 border-white/10 text-zinc-200' 
              : 'bg-zinc-900 border-zinc-800 text-zinc-400'
          }`}>
            <Paperclip className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate font-mono tracking-tight">{message.attachment.filename}</span>
          </div>
        )}

        <div 
          ref={contentRef}
          className={`break-words transition-all duration-300 overflow-hidden ${
            !isExpanded && isOverflowing ? 'max-h-[240px]' : 'max-h-none'
          }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                em: ({ children }) => <em className="italic text-zinc-200">{children}</em>,
                h1: ({ children }) => <h3 className="text-base font-bold text-white mt-4 mb-2">{children}</h3>,
                h2: ({ children }) => <h3 className="text-base font-bold text-white mt-4 mb-2">{children}</h3>,
                h3: ({ children }) => <h4 className="text-sm font-bold text-white mt-3 mb-1">{children}</h4>,
                ul: ({ children }) => <ul className="list-disc list-inside my-2 space-y-1 text-zinc-300 ml-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside my-2 space-y-1 text-zinc-300 ml-1">{children}</ol>,
                li: ({ children }) => <li className="leading-normal">{children}</li>,
                blockquote: ({ children }) => <blockquote className="border-l-2 border-zinc-700 pl-3 my-2 italic text-zinc-400">{children}</blockquote>,
                code: ({ className, children, ...props }) => {
                  const isMultiLine = String(children).includes('\n');
                  const lang = className?.replace('language-', '') || 'code';

                  if (isMultiLine) {
                    return (
                      <div className="relative my-3 rounded-xl overflow-hidden border border-zinc-800/80 bg-zinc-950 font-mono text-xs shadow-2xl">
                        <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-900/90 border-b border-zinc-800 text-[10px] text-zinc-400 font-sans tracking-wider uppercase select-none">
                          <span>{lang}</span>
                        </div>
                        <pre className="p-4 overflow-x-auto text-zinc-200 leading-relaxed">
                          <code {...props}>{children}</code>
                        </pre>
                      </div>
                    );
                  }

                  return (
                    <code className="bg-zinc-900 text-zinc-200 px-1.5 py-0.5 rounded text-[12px] font-mono border border-zinc-700/50" {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* FROSTED "SEE MORE" DOOR */}
        {!isExpanded && isOverflowing && (
          <div className={`absolute bottom-0 left-0 right-0 h-28 pt-12 flex items-end justify-center rounded-b-2xl select-none ${
            isUser ? 'bg-gradient-to-t from-zinc-800 via-zinc-800/80 to-transparent' : 'bg-gradient-to-t from-black via-black/80 to-transparent'
          }`}>
            <button
              onClick={() => setIsExpanded(true)}
              className="text-[11px] font-semibold tracking-widest uppercase py-1.5 px-4 bg-zinc-700/80 hover:bg-zinc-600 text-white rounded-full border border-white/10 shadow-xl backdrop-blur-md transition-all mb-2 cursor-pointer active:scale-95"
            >
              See More
            </button>
          </div>
        )}

        {/* COLLAPSE OPTION */}
        {isExpanded && isOverflowing && (
          <div className="mt-4 pt-2 border-t border-white/5 flex justify-end select-none animate-fade-in">
            <button
              onClick={() => setIsExpanded(false)}
              className="text-[10px] font-medium text-zinc-500 hover:text-zinc-300 uppercase tracking-widest transition-colors cursor-pointer"
            >
              Collapse
            </button>
          </div>
        )}

      </div>
    </div>
  );
};