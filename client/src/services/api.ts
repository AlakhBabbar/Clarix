// src/services/api.ts
import type { ChatSession, Message } from '../types/chat';

const API_BASE = import.meta.env.VITE_API_BASE;

// ==========================================
// AUTHENTICATION & COOKIE UTILS
// ==========================================

/**
 * Wraps our fetch options to explicitly tell the browser: 
 * "Please attach the HttpOnly cookie from your vault to this request."
 */
const withCookies = (options: RequestInit = {}): RequestInit => {
  return {
    ...options,
    credentials: 'include'
  };
};

export async function registerUser(payload: { name: string; email: string; password: string }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || 'Registration failed');
  }
  return res.json();
}


export async function verifyUserOtp(payload: { email: string; otp: string }) {
  const res = await fetch(`${API_BASE}/auth/verify-otp`, withCookies({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }));
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || 'Verification failed');
  }
  return res.json();
}

export async function resendUserOtp(payload: { email: string }) {
  const res = await fetch(`${API_BASE}/auth/resend-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || 'Failed to resend code');
  }
  return res.json();
}

export async function loginUser(payload: any) {
  const res = await fetch(`${API_BASE}/auth/login`, withCookies({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }));
  
  if (!res.ok) {
    // 1. Try to parse the exact JSON error payload from FastAPI
    let errorMessage = 'Invalid credentials';
    try {
      const errorData = await res.json();
      if (errorData.detail) errorMessage = errorData.detail; 
    } catch (e) {}

    // 2. Create a custom error that includes the HTTP status code
    const error = new Error(errorMessage);
    // We attach the status code so our AuthPage knows exactly how to react (e.g., catching the 403)
    (error as any).status = res.status; 
    
    throw error;
  }
  
  return res.json();
}

export async function requestPasswordReset(payload: { email: string }) {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || 'Failed to send reset code');
  }
  return res.json();
}

export async function resetPassword(payload: { email: string; otp: string; new_password: string }) {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || 'Failed to reset password');
  }
  return res.json();
}

export async function logoutUser() {
  const res = await fetch(`${API_BASE}/auth/logout`, withCookies({
    method: 'POST'
  }));
  return res.json();
}

export async function checkAuthStatus() {
  // We hit the protected /me route. If the browser attaches a valid cookie, 
  // this succeeds. If not, the backend rejects it with a 401.
  const res = await fetch(`${API_BASE}/users/me`, withCookies());
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}

// 1. Session & History Controllers
export async function startNewSession(firstMessage: string): Promise<ChatSession> {
  const res = await fetch(`${API_BASE}/chats/`, withCookies({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ first_message: firstMessage }),
  }));
  if (!res.ok) throw new Error(`Server refused session creation: ${res.status}`);
  const json = await res.json();
  return json.data; 
}

export async function fetchAllSessions(): Promise<ChatSession[]> {
  const res = await fetch(`${API_BASE}/chats/`, withCookies());
  if (!res.ok) throw new Error(`Could not load sidebar history: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function fetchSessionMessages(chatId: string): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/chats/${chatId}/messages`, withCookies());
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
  const response = await fetch(`${API_BASE}/ai/chat`, withCookies({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId,
       prompt, 
       file_id: fileId || null // <-- Passes pointer to Python
      }),
  }));

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

  const res = await fetch(`${API_BASE}/files/upload`, withCookies({
    method: 'POST',
    body: payload,
  }));

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


export const deleteChatSession = async (chatId: string): Promise<void> => {
  // Replace the URL path with your exact FastAPI backend endpoint route if different
  const response = await fetch(`${API_BASE}/chats/${chatId}`, withCookies({
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      // Include authorization tokens here if your backend requires them
    },
  }));

  if (!response.ok) {
    throw new Error('Failed to delete chat session from server');
  }
};