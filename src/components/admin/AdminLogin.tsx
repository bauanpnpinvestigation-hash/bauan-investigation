import React, { useState } from 'react';
import { Shield, Lock, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import { signInAdminWithPassword, connectGoogleDriveAccount } from '../../services/firebase';
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
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setIsGoogleLoading(true);
    try {
      const result = await connectGoogleDriveAccount();
      if (result) {
        onLoginSuccess(result.user.email || 'Officer');
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        return;
      }
      console.error('[Google Sign in error]', err);
      setErrorMsg(err.message || 'Google authentication failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

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
          Secure Officer Login & Drive Access
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

          {/* Official Google Sign-in Button with Workspace Drive Integration */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
              className="gsi-material-button w-full cursor-pointer transition-all hover:scale-[1.01] shadow-md flex justify-center"
            >
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents">
                  {isGoogleLoading ? 'Connecting to Google Drive...' : 'Sign in with Google (Drive Access)'}
                </span>
              </div>
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              Connects directly with Bauan MPS Google Drive Evidence Vault
            </p>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-700 w-full" />
            <span className="bg-slate-800 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
              Or Officer Password
            </span>
            <div className="border-t border-slate-700 w-full" />
          </div>

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
                disabled={isLoading || isGoogleLoading}
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
                  disabled={isLoading || isGoogleLoading}
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
              disabled={isLoading || isGoogleLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-lg text-xs font-extrabold uppercase tracking-wider text-white bg-blue-700 hover:bg-blue-600 cursor-pointer border border-blue-600 active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isLoading ? 'Verifying Credentials...' : 'Login with Officer Password'}</span>
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

