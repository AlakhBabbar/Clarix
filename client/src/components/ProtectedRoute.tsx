// src/components/ProtectedRoute.tsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { checkAuthStatus } from '../services/api';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // When this route loads, knock on the backend door
    checkAuthStatus()
      .then(() => setIsAuthenticated(true)) // Cookie is valid! Let them in.
      .catch(() => setIsAuthenticated(false)); // Cookie missing/expired! Deny entry.
  }, []);

  // 1. While we wait for the backend to answer, show a loading spinner
  if (isAuthenticated === null) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // 2. If the backend rejected the cookie, redirect them to the /login URL
  if (isAuthenticated === false) {
    return <Navigate to="/login" replace />;
  }

  // 3. If they are authenticated, render the page they were trying to access (The ChatPage)
  return <>{children}</>;
};