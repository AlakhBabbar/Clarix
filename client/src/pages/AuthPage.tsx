// src/pages/AuthPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ClarixLogo } from '../components/ClarixLogo';
import { loginUser, registerUser, resendUserOtp } from '../services/api';

interface AuthPageProps {
  mode: 'login' | 'register';
}

export const AuthPage: React.FC<AuthPageProps> = ({ mode }) => {
  const navigate = useNavigate();
  
  // Shared State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Only used for registration
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // We check the prop to know which UI to render
  const isLogin = mode === 'login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        // 1. Attempt normal cookie-based login
        await loginUser({ email, password });
        navigate('/');
      } else {
        // 2. Normal Registration Flow
        await registerUser({ name, email, password });
        
        // Immediately jump to the verification screen, passing the email secretly
        navigate('/verify', { state: { email } });
      }
    } catch (err: any) {
      // ==========================================
      // THE 403 RESCUE INTERCEPTOR
      // ==========================================
      if (isLogin && err.status === 403) {
        try {
          // Tell the backend to fire a fresh OTP to this email
          await resendUserOtp({ email });
          // Jump to the verification screen so they can enter it
          navigate('/verify', { state: { email } });
          return; // Exit the function early so we don't hit the setError below
        } catch (resendErr: any) {
          setError(resendErr.message || 'Account not verified, and failed to resend code.');
          setIsLoading(false);
          return;
        }
      }
      
      // Fallback for all other errors (like wrong password, or email taken)
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center p-4">
      {/* Shared Layout: Logo and Brand */}
      <div className="mb-8 flex flex-col items-center">
        <ClarixLogo className="w-12 h-12 mb-4" />
        <h1 className="text-2xl font-serif tracking-widest uppercase text-white">
          {isLogin ? 'Welcome Back' : 'Join Clarix'}
        </h1>
      </div>

      {/* The Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        
        {/* Show Name field ONLY if we are on the /signup URL */}
        {!isLogin && (
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white"
          />
        )}

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white"
        />

        {/* NEW: Forgot Password Link */}
        {isLogin && (
          <div className="flex justify-end w-full -mt-2">
            <Link to="/forgot-password" className="text-xs text-zinc-400 hover:text-white transition-colors">
              Forgot password?
            </Link>
          </div>
        )}

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-white text-black font-semibold rounded-lg p-3 mt-2 hover:bg-zinc-200 transition-colors cursor-pointer"
        >
          {isLoading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      {/* The Toggle Links */}
      <div className="mt-6 text-sm text-zinc-500">
        {isLogin ? (
          <p>Don't have an account? <Link to="/signup" className="text-white hover:underline">Sign up</Link></p>
        ) : (
          <p>Already have an account? <Link to="/signin" className="text-white hover:underline">Sign in</Link></p>
        )}
      </div>
    </div>
  );
};