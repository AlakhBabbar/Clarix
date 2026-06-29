// src/services/api.ts
import type { ChatSession, Message } from '../types/chat';

const API_BASE = 'http://localhost:8000/api';

// 1. Session & History Controllers
export async function startNewSession(firstMessage: string): Promise<ChatSession> {
  const res = await fetch(`${API_BASE}/chats/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ first_message: firstMessage }),
  });
  if (!res.ok) throw new Error(`Server refused session creation: ${res.status}`);
  const json = await res.json();
  return json.data; 
}

export async function fetchAllSessions(): Promise<ChatSession[]> {
  const res = await fetch(`${API_BASE}/chats/`);
  if (!res.ok) throw new Error(`Could not load sidebar history: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function fetchSessionMessages(chatId: string): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/chats/${chatId}/messages`);
  if (!res.ok) throw new Error(`Could not load chat log: ${res.status}`);
  const json = await res.json();
  return json.data;
}

// 2. The Live SSE Streaming Engine
export async function streamMessage(
  chatId: string,
  prompt: string,
  onTokenReceived: (token: string) => void
): Promise<void> {
  const response = await fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, prompt }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Streaming pipe failed to open. HTTP Status: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let isDone = false;

  while (!isDone) {
    const { value, done } = await reader.read();
    isDone = done;
    if (value) {
      const chunk = decoder.decode(value, { stream: true });
      onTokenReceived(chunk);
    }
  }
}