import React, { useState } from 'react';
import { Shield, Lock, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import { signInAdminWithPassword, AUTHORIZED_ADMIN_EMAIL, auth } from '../../services/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { BrandLogo } from '../common/BrandLogo';
import { BackgroundWatermark } from '../common/BackgroundWatermark';

interface AdminLoginProps {
  onLoginSuccess: (email: string) => void;
  onNavigateToPublic: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onNavigateToPublic,
}) => {
  const [email, setEmail] = useState<string>(AUTHORIZED_ADMIN_EMAIL);
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const user = await signInAdminWithPassword(email.trim(), password);
      onLoginSuccess(user.email || email.trim());
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      onLoginSuccess(userCredential.user.email || 'Admin');
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans overflow-x-hidden">
      {/* Resilient Official Seal Background Watermark */}
      <BackgroundWatermark theme="dark" />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <BrandLogo size="xl" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight uppercase">
          BAUAN MPS - INVESTIGATION SECTION
        </h2>
        <p className="mt-1 text-xs font-semibold text-blue-300 uppercase tracking-widest">
          Secure Officer Login
        </p>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/90 border border-slate-700 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 backdrop-blur-md space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl shadow-lg text-xs font-extrabold uppercase tracking-wider text-slate-900 bg-white hover:bg-slate-200 transition-all disabled:opacity-60 cursor-pointer"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
            <span>Login with Google</span>
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink mx-4 text-xs text-slate-500">OR</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Officer Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl shadow-lg text-xs font-extrabold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 cursor-pointer border border-blue-500"
            >
              <KeyRound className="w-4 h-4" />
              <span>Login with Password</span>
            </button>
          </form>

          {/* Return to Public Portal */}
          <div className="mt-5 pt-4 border-t border-slate-700/80 text-center">
            <button
              type="button"
              onClick={onNavigateToPublic}
              className="text-xs text-blue-300 hover:text-white transition-colors underline-offset-4 hover:underline cursor-pointer font-medium"
            >
              ← Return to Citizen Intake Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
