import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X, Share2, PlusSquare } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'badge' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const toast = useToast();

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    try {
      const outcome = await install();
      if (outcome) {
        toast.success('Bauan MPS installation confirmed!', 'PWA Installed');
      }
    } catch {
      toast.error('Unable to launch installer on this browser');
    }
  };

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={handleInstallClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs transition-transform active:scale-95 cursor-pointer shrink-0 ${className}`}
        title="Install Bauan MPS as a standalone app on this device"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden xs:inline">Install App</span>
        <span className="xs:hidden">Install</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not fired by WebKit, guide user)
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center gap-1 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white rounded-lg text-xs font-bold border border-white/20 transition-colors cursor-pointer shrink-0 ${className}`}
          title="Add to Home Screen on iOS"
        >
          <Smartphone className="w-3.5 h-3.5 text-blue-300" />
          <span className="hidden xs:inline">Install App</span>
          <span className="xs:hidden">App</span>
        </button>

        {showIOSGuide && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-fadeIn"
            onClick={() => setShowIOSGuide(false)}
          >
            <div 
              className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 text-slate-900 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Install on iPhone / iPad
                </h3>
              </div>

              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Add Bauan MPS directly to your Home Screen for full offline support, fast launch, and full-screen experience:
              </p>

              <ol className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                  <span>Tap the <strong>Share</strong> button <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-blue-600" /> in Safari's bottom toolbar.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                  <span>Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-blue-600" />.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                  <span>Tap <strong>Add</strong> at top right. The police portal icon will appear on your home screen!</span>
                </li>
              </ol>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
