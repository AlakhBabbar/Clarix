// src/pages/ChatPage.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Message, ChatSession } from '../types/chat';
import {PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { ChatBubble } from '../components/ChatBubble';
import { ChatInput } from '../components/ChatInput';
import { ClarixLogo } from '../components/ClarixLogo';
import { Sidebar } from '../components/Sidebar';

// ACTIVATED LIVE SERVICES:
import { 
  fetchAllSessions, 
  startNewSession, 
  fetchSessionMessages, 
  streamMessage 
} from '../services/api';

// const MOCK_SESSIONS: ChatSession[] = [
//   { _id: '1', title: 'Explain quantum computing structure...' },
//   { _id: '2', title: 'FastAPI vs Express architecture' },
// ];

// const MOCK_MESSAGES: Message[] = [
//   { _id: '101', role: 'user', content: 'What is Clarix?' },
//   { _id: '102', role: 'assistant', content: 'I am Clarix. Notice how my chat bubble now sits wider than the input box below me!' },
// ];

const GREETING_PATTERNS = [
  "Ah, {user}. Here we go again.",
  "Good to see you, {user}. What are we breaking today?",
  "Back for more, {user}?",
  "Systems online. What's the mission, {user}?",
  "Let me guess... another complex architectural question?",
  "Ready when you are, {user}.",
  "I was getting bored sitting in cloud RAM anyway.",
  "State initialized. Awaiting your command, {user}."
];

export const ChatPage: React.FC = () => {
  // REPLACE WITH THIS:
  const [sessions, setSessions] = useState<ChatSession[]>([]); // Starts blank
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [hasStartedChat, setHasStartedChat] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // --- AUTO-SCROLL PHYSICS ENGINE ---
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]); // Fires when you hit Send, AND on every single incoming SSE token!

  // HYDRATE FROM PYTHON ON PAGE LOAD:
  useEffect(() => {
    fetchAllSessions()
      .then((data) => setSessions(data))
      .catch((err) => console.error("FastAPI backend offline or unreachable:", err));
  }, []);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    const savedState = localStorage.getItem('clarix_sidebar_state');
    return savedState !== null ? JSON.parse(savedState) : true;
  });

  useEffect(() => {
    localStorage.setItem('clarix_sidebar_state', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  const CURRENT_USER = "Alakh";

  const activeGreeting = useMemo(() => {
    const rawPattern = GREETING_PATTERNS[Math.floor(Math.random() * GREETING_PATTERNS.length)];
    return rawPattern.replace("{user}", CURRENT_USER);
  }, []);

  // LIVE STREAMING ENGINE:
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isLoading) return;

    const currentPrompt = inputPrompt;
    setInputPrompt('');
    setIsLoading(true);

    try {
      let currentChatId = activeSessionId;

      // 1. If this is a brand new conversation, create the thread in Atlas first
      if (!currentChatId) {
        const newSession = await startNewSession(currentPrompt);
        currentChatId = newSession._id;
        setActiveSessionId(currentChatId);
        setSessions((prev) => [newSession, ...prev]);
        setHasStartedChat(true);
      } else if (!hasStartedChat) {
        setHasStartedChat(true);
      }

      // 2. Instantly drop the human prompt onto the screen
      const userMsg: Message = {
        _id: Date.now().toString(),
        role: 'user',
        content: currentPrompt,
      };
      setMessages((prev) => [...prev, userMsg]);

      // 3. Drop an empty placeholder AI bubble that will catch incoming tokens
      const aiPlaceholderId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        { _id: aiPlaceholderId, role: 'assistant', content: '' }
      ]);

      // 4. Open the HTTP ReadableStream!
      await streamMessage(currentChatId, currentPrompt, (incomingToken) => {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === aiPlaceholderId
              ? { ...msg, content: msg.content + incomingToken }
              : msg
          )
        );
      });

    } catch (error) {
      console.error("Transmission failure:", error);
      // Append an error bubble so the user isn't left staring at a blank screen
      setMessages((prev) => [
        ...prev,
        { _id: Date.now().toString(), role: 'assistant', content: '⚠️ Connection to Clarix core severed. Is the server running?' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const closeSidebarIfMobile = () => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleSelectSession = async (id: string) => {
    setActiveSessionId(id);
    setHasStartedChat(true);
    try {
      const dbHistory = await fetchSessionMessages(id);
      

      setMessages(dbHistory);
      closeSidebarIfMobile();
    } catch (err) {
      console.error("Could not fetch message log:", err);
    }
  };

  const handleNewSession = () => {
    setHasStartedChat(false);
    setMessages([]);
    setActiveSessionId(null);
    closeSidebarIfMobile(); // <-- Auto-closes mobile sheet
  };

  return (
    <div className="flex h-screen w-full bg-black text-white font-sans antialiased overflow-hidden">
      
      {/* LEFT SIDEBAR */}
      {/* Decoupled Sidebar Component */}
      <Sidebar 
        sessions={sessions}
        activeSessionId={activeSessionId}
        isOpen={isSidebarOpen}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />

      {/* MAIN CHAT ARENA */}
      <main className="flex-1 flex flex-col relative h-full bg-black min-w-0">
        
        <header className="h-14 border-b border-zinc-900/60 px-4 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900/80 transition-colors cursor-pointer"
              title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5 text-zinc-200" />}
            </button>

            {!isSidebarOpen && (
              <span className="font-serif tracking-widest uppercase text-sm font-medium text-zinc-400 animate-fade-in">
                Clarix
              </span>
            )}
          </div>
        </header>

        <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
          {!hasStartedChat ? (
            
            <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full animate-fade-in">
              <div className="mb-6 p-4 rounded-3xl bg-zinc-950 border border-zinc-800/80 shadow-[0_0_50px_rgba(255,255,255,0.05)]">
                <ClarixLogo className="w-16 h-16 drop-shadow-[0_0_15px_rgba(255,255,255,0.25)]" />
              </div>

              <h1 className="font-serif text-3xl tracking-widest uppercase font-medium mb-3 text-zinc-200">
                Clarix
              </h1>

              <p className="text-zinc-500 text-base font-light tracking-wide mb-10 text-center">
                {activeGreeting}
              </p>
              
              <ChatInput value={inputPrompt} onChange={setInputPrompt} onSubmit={handleSendMessage} variant="centered" />
            </div>

          ) : (

            /* --- THE SPATIAL CORRECTION ZONE --- */
            <div className="flex-1 flex flex-col h-full justify-between overflow-hidden">
              
              {/* 1. Viewport track spans 100% of screen width. Scrollbar hugs the far right bezel! */}
              <div className="flex-1 overflow-y-auto w-full py-6">
                
                {/* 2. Inner Arena bumped to max-w-4xl (64px wider on each side than the input bar) */}
                <div className="max-w-4xl mx-auto px-6 flex flex-col gap-6 w-full">
                  {messages.map((msg) => (
                    <ChatBubble key={msg._id} message={msg} />
                  ))}
                  
                  {/* THE INVISIBLE CAMERA ANCHOR */}
                  <div ref={messagesEndRef} />
                </div>

              </div>

              {/* 3. Footer input stays locked at max-w-3xl */}
              <div className="p-4 bg-black border-t border-zinc-900/50 shrink-0">
                <div className="max-w-3xl mx-auto w-full">
                  <ChatInput value={inputPrompt} onChange={setInputPrompt} onSubmit={handleSendMessage} placeholder="Send a follow-up..." variant="docked" />
                </div>
              </div>

            </div>

          )}
        </div>

      </main>

    </div>
  );
};