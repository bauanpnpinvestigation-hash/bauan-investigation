import React, { useState } from 'react';
import { Copy, Check, AlertCircle } from 'lucide-react';
import { copyToClipboard } from '../../utils/formatters';

interface CopySectionButtonProps {
  sectionTitle: string;
  formattedText: string;
  className?: string;
}

export const CopySectionButton: React.FC<CopySectionButtonProps> = ({
  sectionTitle,
  formattedText,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleCopySection = async () => {
    if (!formattedText || !formattedText.trim()) return;

    const success = await copyToClipboard(formattedText.trim());
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setFailed(true);
      setTimeout(() => setFailed(false), 2500);
    }
  };

  const isDisabled = !formattedText || !formattedText.trim();

  return (
    <button
      type="button"
      onClick={handleCopySection}
      disabled={isDisabled}
      aria-label={`Copy complete ${sectionTitle} section as plain text`}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all select-none focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 ${
        isDisabled
          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
          : copied
          ? 'bg-emerald-700 text-white font-bold'
          : failed
          ? 'bg-rose-700 text-white'
          : 'bg-white hover:bg-slate-50 active:bg-slate-100 text-blue-900 border border-blue-300 shadow-xs'
      } ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-white" />
          <span>Section Copied</span>
        </>
      ) : failed ? (
        <>
          <AlertCircle className="w-3.5 h-3.5 text-white" />
          <span>Copy Failed</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 text-blue-700" />
          <span>[COPY SECTION]</span>
        </>
      )}
    </button>
  );
};
