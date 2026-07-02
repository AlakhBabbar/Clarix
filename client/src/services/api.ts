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
  onTokenReceived: (token: string) => void,
  fileId?: string | null
): Promise<void> {
  const response = await fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId,
       prompt, 
       file_id: fileId || null // <-- Passes pointer to Python
      }),
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

export interface VaultResponse {
  file_id: string;
  filename: string;
  file_url: string;
}

export async function uploadFileVault(chatId: string, file: File): Promise<VaultResponse> {
  const payload = new FormData();
  payload.append('file', file);
  payload.append('chat_id', chatId);

  const res = await fetch(`${API_BASE}/files/upload`, {
    method: 'POST',
    body: payload,
  });

  if (!res.ok) {
    // 1. Setup a fallback error message
    let errorMessage = `Vault rejected file upload. Status: ${res.status}`;
    
    try {
      // 2. Try to parse the JSON error payload from FastAPI
      const errorData = await res.json();
      if (errorData.detail) {
        // 3. If FastAPI sent a 'detail' string (like your file size error), use it!
        errorMessage = errorData.detail; 
      }
    } catch (e) {
      // If parsing fails, we just stick with the fallback message
    }
    
    // 4. Throw the actual descriptive error
    throw new Error(errorMessage); 
  }

  const json = await res.json();
  return json; 
}