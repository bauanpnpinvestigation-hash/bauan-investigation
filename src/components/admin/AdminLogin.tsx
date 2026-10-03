import React, { useState } from 'react';
import { Shield, Lock, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import { signInAdminWithPassword } from '../../services/firebase';
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
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const targetEmail = email.trim();
    if (!targetEmail) {
      setErrorMsg('Please enter a valid officer email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your administrator credential key.');
      return;
    }

    setIsLoading(true);

    try {
      const user = await signInAdminWithPassword(targetEmail, password);
      // Clean up inputs on success to prevent any memory trace
      setEmail('');
      setPassword('');
      onLoginSuccess(user.email || targetEmail);
    } catch (err: any) {
      // General error response to prevent user enumeration or password guessing leakage
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setErrorMsg('Invalid officer credential combination. Access denied.');
      } else {
        setErrorMsg(err.message || 'Authentication system error. Please contact administrative staff.');
      }
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
            <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span className="leading-relaxed font-semibold">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off" noValidate>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>Officer Email</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter authorized email"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                data-lpignore="true"
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator key"
                  autoComplete="new-password"
                  data-lpignore="true"
                  disabled={isLoading}
                  className="w-full pl-3.5 pr-11 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl shadow-lg text-xs font-extrabold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 cursor-pointer border border-blue-500 active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isLoading ? 'Verifying Credentials...' : 'Login with Password'}</span>
            </button>
          </form>

          {/* Return to Public Portal */}
          <div className="mt-5 pt-4 border-t border-slate-700/50 text-center">
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
