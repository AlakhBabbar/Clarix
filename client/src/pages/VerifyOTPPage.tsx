// src/pages/VerifyOTPPage.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ClarixLogo } from '../components/ClarixLogo';
import { verifyUserOtp, resendUserOtp } from '../services/api';

export const VerifyOTPPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // We extract the email that was secretly passed via the React Router state
  const email = location.state?.email;

  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If a user tries to access /verify directly without an email, kick them out
  if (!email) {
    navigate('/signin');
    return null; // Return null so the rest of the page doesn't flash before the redirect
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      // Hit our backend verification endpoint
      await verifyUserOtp({ email, otp });
      
      // Success! Show a message and route them to sign in
      setMessage("Verification successful! Redirecting to login...");
      setTimeout(() => navigate('/'), 1500);
    } catch (err: any) {
      setError(err.message || 'Invalid verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setMessage(null);
    try {
      await resendUserOtp({ email });
      setMessage("A new code has been sent to your email.");
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex flex-col items-center animate-fade-in">
        <ClarixLogo className="w-12 h-12 mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]" />
        <h1 className="text-2xl font-serif tracking-widest uppercase text-white">Verify Account</h1>
        <p className="text-zinc-400 text-sm mt-3 text-center max-w-sm leading-relaxed">
          We sent a 6-digit verification code to <br/>
          <span className="text-white font-medium">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4 animate-fade-in">
        <input
          type="text"
          placeholder="Enter 6-digit code"
          value={otp}
          // This Regex ensures they can ONLY type numbers, and caps it at 6 characters
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          required
          className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 focus:outline-none rounded-lg p-3 text-white text-center tracking-[0.5em] text-lg font-mono transition-colors"
        />

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        {message && <p className="text-green-500 text-sm text-center">{message}</p>}

        <button 
          type="submit" 
          disabled={isLoading || otp.length < 6}
          className="w-full bg-white text-black font-semibold rounded-lg p-3 mt-2 hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Verifying...' : 'Verify Email'}
        </button>
      </form>

      <div className="mt-6 text-sm text-zinc-500 animate-fade-in">
        <p>Didn't receive the code? <button onClick={handleResend} type="button" className="text-white hover:underline cursor-pointer">Resend OTP</button></p>
      </div>
    </div>
  );
};