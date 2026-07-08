// src/pages/ForgotPasswordPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ClarixLogo } from '../components/ClarixLogo';
import { requestPasswordReset, resetPassword } from '../services/api';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  
  // UI State: 'request' (asking for email) or 'reset' (entering OTP & new password)
  const [step, setStep] = useState<'request' | 'reset'>('request');
  
  // Form State
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await requestPasswordReset({ email });
      setMessage('A 6-digit reset code has been sent to your email.');
      setStep('reset'); // Move to the next UI step
    } catch (err: any) {
      setError(err.message || 'Failed to request reset.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      await resetPassword({ email, otp, new_password: newPassword });
      
      // Success! Alert them and send them back to the login screen to try their new password
      alert('Password successfully reset! Please log in with your new password.');
      navigate('/signin');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please check your code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setMessage(null);
    try {
      // Re-trigger the exact same API call we used in the first step
      await requestPasswordReset({ email });
      setMessage("A new reset code has been sent to your email.");
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex flex-col items-center animate-fade-in">
        <ClarixLogo className="w-12 h-12 mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]" />
        <h1 className="text-2xl font-serif tracking-widest uppercase text-white">Reset Password</h1>
        <p className="text-zinc-400 text-sm mt-3 text-center max-w-sm leading-relaxed">
          {step === 'request' 
            ? "Enter your email address and we'll send you a code to reset your password."
            : `Enter the code sent to ${email} and your new password.`}
        </p>
      </div>

      {step === 'request' ? (
        <form onSubmit={handleRequestReset} className="w-full max-w-sm flex flex-col gap-4 animate-fade-in">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 focus:outline-none rounded-lg p-3 text-white transition-colors"
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button 
            type="submit" 
            disabled={isLoading || !email}
            className="w-full bg-white text-black font-semibold rounded-lg p-3 mt-2 hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send Reset Code'}
          </button>
          
        </form>
      ) : (
        <form onSubmit={handleConfirmReset} className="w-full max-w-sm flex flex-col gap-4 animate-fade-in">
          <input
            type="text"
            placeholder="6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 focus:outline-none rounded-lg p-3 text-white text-center tracking-[0.5em] text-lg font-mono transition-colors"
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 focus:outline-none rounded-lg p-3 text-white transition-colors"
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {message && <p className="text-green-500 text-sm text-center">{message}</p>}
          <button 
            type="submit" 
            disabled={isLoading || otp.length < 6 || !newPassword}
            className="w-full bg-white text-black font-semibold rounded-lg p-3 mt-2 hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Resetting...' : 'Confirm New Password'}
          </button>

          {/* NEW: The Resend Button */}
          <div className="text-sm text-zinc-500 text-center mt-2">
            <p>Didn't receive the code? <button onClick={handleResend} type="button" className="text-white hover:underline cursor-pointer">Resend OTP</button></p>
          </div>
        </form>
      )}

      <div className="mt-6 text-sm text-zinc-500 animate-fade-in">
        <Link to="/signin" className="text-white hover:underline">Back to Login</Link>
      </div>
    </div>
  );
};