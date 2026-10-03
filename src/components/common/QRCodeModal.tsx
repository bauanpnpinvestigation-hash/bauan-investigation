import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { QrCode, X, Download, Printer, ShieldCheck, Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../../utils/formatters';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationName?: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  stationName = 'Investigation & Records Section',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // The QR code MUST point strictly to /request
  const requestUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/request` 
    : 'https://ais-dev.run.app/request';

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(requestUrl, {
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
  }, [isOpen, requestUrl]);

  if (!isOpen) return null;

  const handleCopyUrl = async () => {
    const success = await copyToClipboard(requestUrl);
    if (success) {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `Public-Intake-QR-Code.png`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-blue-950 text-white">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-300" />
            <h3 className="font-bold text-base sm:text-lg">Station Public Intake QR Code</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            title="Close (X)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Desk Poster Section */}
        <div ref={printRef} className="p-6 text-center bg-white print:p-8">
          <div className="inline-block p-4 mb-2 bg-slate-50 border-2 border-dashed border-blue-200 rounded-2xl">
            {dataUrl ? (
              <img
                src={dataUrl}
                alt="Scan to submit request: /request"
                className="w-56 h-56 sm:w-64 sm:h-64 mx-auto object-contain"
              />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center text-slate-400">
                Generating QR...
              </div>
            )}
          </div>

          <div className="mt-3">
            <h4 className="text-lg font-bold text-slate-900 tracking-tight">
              SCAN TO FILE A REPORT OR REQUEST
            </h4>
            <p className="text-sm font-medium text-blue-900 mt-0.5">
              (I-scan upang magsumite ng Reklamo o Kahilingan)
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Authorized Intake Portal • {stationName}
            </p>
          </div>

          {/* Verification Badge */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-left flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-950">
              <span className="font-semibold block">Privacy & Security Guard:</span>
              This QR code strictly directs the client to the public submission portal (<code className="font-mono bg-blue-100/70 px-1 py-0.5 rounded text-blue-900">/request</code>). It contains zero personal records, document IDs, or credentials.
            </div>
          </div>

          {/* Direct URL copy */}
          <div className="mt-4 flex items-center justify-between px-3 py-2 bg-slate-100 rounded-lg text-xs font-mono text-slate-700 border border-slate-200">
            <span className="truncate mr-2">{requestUrl}</span>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded font-sans text-xs font-semibold text-slate-700 shrink-0"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200 print:hidden">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!dataUrl}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Download PNG</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-lg shadow-xs"
          >
            <Printer className="w-4 h-4 text-blue-200" />
            <span>Print Station Placard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
