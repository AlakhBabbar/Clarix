// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ChatPage } from './pages/ChatPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Route mapping to our isolated Chat Page */}
        <Route path="/" element={<ChatPage />} />
        
        {/* Catch-all safety route: Redirects broken URLs back to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
