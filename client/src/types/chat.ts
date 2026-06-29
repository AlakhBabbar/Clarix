// src/types/chat.ts

export interface Message {
  _id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  attachment?: {
    filename: string;
    file_id?: string;
  };
}

export interface ChatSession {
  _id: string;
  title: string;
  last_used?: string;
}