// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ChatPage } from './pages/ChatPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthPage } from './pages/AuthPage';
import { VerifyOTPPage } from './pages/VerifyOTPPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* PUBLIC ROUTES: Two URLs, One Component */}
        <Route path="/signin" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="register" />} />
        <Route path="/verify" element={<VerifyOTPPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        
        {/* Redirect the old /login to /signin just in case */}
        <Route path="/login" element={<Navigate to="/signin" replace />} />
        
        {/* PROTECTED ROUTE: The bouncer stands in front of the ChatPage */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Catch-all safety route: Redirects broken URLs back to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
        
      </Routes>
    </BrowserRouter>
  );
}