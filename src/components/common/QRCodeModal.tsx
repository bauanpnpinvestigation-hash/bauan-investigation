import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  X, 
  Download, 
  Printer, 
  ShieldCheck, 
  Copy, 
  Check, 
  Globe, 
  ExternalLink, 
  RotateCcw, 
  Sparkles,
  Link as LinkIcon,
  CheckCircle2
} from 'lucide-react';
import { copyToClipboard } from '../../utils/formatters';
import { BrandLogo } from './BrandLogo';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationName?: string;
}

const STORAGE_KEY = 'bauan_mps_custom_qr_url';

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  stationName = 'Investigation & Records Section',
}) => {
  const defaultHostUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/` 
    : 'https://ais-dev.run.app/';

  // Target URL that the QR code points to
  const [targetUrl, setTargetUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && saved.trim()) return saved.trim();
      } catch {
        // Ignore localStorage error
      }
    }
    return defaultHostUrl;
  });

  const [dataUrl, setDataUrl] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Helper to ensure protocol exists so scanners navigate properly
  const getNavigableUrl = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return defaultHostUrl;
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const activeNavigableUrl = getNavigableUrl(targetUrl);
  const isCustomUrl = targetUrl.trim() !== defaultHostUrl;

  // Save to localStorage whenever user customizes URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (targetUrl.trim() && targetUrl.trim() !== defaultHostUrl) {
          localStorage.setItem(STORAGE_KEY, targetUrl.trim());
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        // Ignore localStorage write error
      }
    }
  }, [targetUrl, defaultHostUrl]);

  // Generate QR Code dynamically from the designated target URL
  useEffect(() => {
    if (isOpen && activeNavigableUrl) {
      QRCode.toDataURL(activeNavigableUrl, {
        width: 380,
        margin: 2,
        color: {
          dark: '#0f2442',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      })
        .then((url) => setDataUrl(url))
        .catch((err) => console.error('Failed to generate QR code', err));
    }
  }, [isOpen, activeNavigableUrl]);

  if (!isOpen) return null;

  const handleCopyUrl = async () => {
    const success = await copyToClipboard(activeNavigableUrl);
    if (success) {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleResetToCurrentHost = () => {
    setTargetUrl(defaultHostUrl);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  };

  const handleAppendRequestPath = () => {
    const trimmed = targetUrl.trim();
    if (!trimmed) {
      setTargetUrl(`${defaultHostUrl}`);
      return;
    }
    const clean = trimmed.replace(/\/+$/, '');
    setTargetUrl(`${clean}/request`);
  };

  const handleOpenLinkInNewTab = () => {
    if (typeof window !== 'undefined') {
      window.open(activeNavigableUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `Bauan-MPS-Intake-QR.png`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 bg-blue-950 text-white">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                Bauan MPS Desk QR Placard
              </h3>
              <p className="text-[11px] text-blue-200">
                Live Dynamic Intake Link Generator
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Destination Link Editor Section (Hidden in print) */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50 border-b border-slate-200 print:hidden space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-700" />
              <label htmlFor="qr-destination-input" className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                QR Destination Link (Hosting / Vercel URL)
              </label>
            </div>
            {isCustomUrl ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                <CheckCircle2 className="w-3 h-3" />
                Custom URL Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-full">
                Default Host Active
              </span>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <LinkIcon className="w-4 h-4" />
            </div>
            <input
              id="qr-destination-input"
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="Paste Vercel or Custom URL (e.g. https://my-app.vercel.app/request)"
              className="w-full pl-9 pr-24 py-2 text-xs sm:text-sm font-mono bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
            />
            {isCustomUrl && (
              <button
                type="button"
                onClick={handleResetToCurrentHost}
                className="absolute inset-y-1 right-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                title="Reset back to current app domain"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Quick Helper Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {!targetUrl.includes('/request') && (
                <button
                  type="button"
                  onClick={handleAppendRequestPath}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-900 font-semibold rounded text-[11px] transition-colors cursor-pointer"
                  title="Appends /request to direct citizens straight to the intake form"
                >
                  <Sparkles className="w-3 h-3 text-blue-700" />
                  <span>+ Append /request</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleResetToCurrentHost}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 underline px-1 py-0.5"
              >
                Use Current Host
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenLinkInNewTab}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-300 rounded text-[11px] shadow-2xs transition-colors cursor-pointer"
                title="Test destination link in new tab"
              >
                <ExternalLink className="w-3 h-3 text-blue-600" />
                <span>Test Link</span>
              </button>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-300 rounded text-[11px] shadow-2xs transition-colors cursor-pointer"
                title="Copy destination link"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-500" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 italic">
            Tip: When you deploy to Vercel or another host, simply paste your production link above. The QR code will immediately update and scan directly to that site!
          </p>
        </div>

        {/* Printable Desk Poster Section */}
        <div ref={printRef} className="p-5 sm:p-7 text-center bg-white print:p-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BrandLogo size="md" />
            <div className="text-left">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Bauan Municipal Police Station
              </h2>
              <p className="text-[11px] font-bold text-blue-900">
                Investigation & Records Section
              </p>
            </div>
          </div>

          <div className="inline-block p-4 my-2 bg-slate-50 border-2 border-dashed border-blue-200 rounded-2xl shadow-inner">
            {dataUrl ? (
              <img
                src={dataUrl}
                alt={`Scan to navigate: ${activeNavigableUrl}`}
                className="w-52 h-52 sm:w-60 sm:h-60 mx-auto object-contain"
              />
            ) : (
              <div className="w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center text-slate-400 font-medium">
                Generating QR...
              </div>
            )}
          </div>

          <div className="mt-2">
            <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              SCAN TO FILE A REPORT OR REQUEST
            </h4>
            <p className="text-xs sm:text-sm font-bold text-blue-900 mt-0.5">
              (I-scan gamit ang iyong cellphone camera upang magtala ng impormasyon)
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Official PNP Public Intake Portal • {stationName}
            </p>
          </div>

          {/* Active Encoded Destination Display */}
          <div className="mt-4 p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-left">
            <div className="flex items-center justify-between text-[11px] text-blue-900 font-semibold mb-1">
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-blue-700" />
                Scans directly to:
              </span>
              {isCustomUrl && (
                <span className="text-[10px] bg-blue-200/80 text-blue-950 font-bold px-1.5 py-0.2 rounded">
                  Custom Hosted
                </span>
              )}
            </div>
            <div className="text-xs font-mono text-slate-800 break-all select-all font-medium">
              {activeNavigableUrl}
            </div>
          </div>

          {/* Verification Badge */}
          <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-left flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-600 leading-tight">
              <span className="font-bold text-slate-800">Secure Direct Routing: </span>
              This QR code opens your designated public intake portal directly in the citizen's browser without requiring login.
            </div>
          </div>
        </div>

        {/* Action Buttons (Hidden in print) */}
        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 print:hidden">
          <span className="text-xs text-slate-500 font-medium">
            Desk Placard & Poster
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!dataUrl}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Download PNG</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-blue-200" />
              <span>Print Station Placard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
