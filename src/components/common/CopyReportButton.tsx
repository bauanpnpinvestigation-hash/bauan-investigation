import React, { useState } from 'react';
import { FileText, Check, AlertCircle } from 'lucide-react';
import { copyToClipboard } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

interface CopyReportButtonProps {
  reportText: string;
  referenceNumber?: string;
  className?: string;
  size?: 'md' | 'lg';
}

export const CopyReportButton: React.FC<CopyReportButtonProps> = ({
  reportText,
  referenceNumber,
  className = '',
  size = 'md',
}) => {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const toast = useToast();

  const handleCopyReport = async () => {
    if (!reportText || !reportText.trim()) return;

    const success = await copyToClipboard(reportText.trim());
    if (success) {
      setCopied(true);
      toast.success(referenceNumber ? `Full Report #${referenceNumber} copied to clipboard!` : 'Full report copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } else {
      setFailed(true);
      toast.error('Failed to copy full report');
      setTimeout(() => setFailed(false), 2500);
    }
  };

  const isLarge = size === 'lg';

  return (
    <button
      type="button"
      onClick={handleCopyReport}
      aria-label={`Copy complete formatted report to clipboard${referenceNumber ? ' for ' + referenceNumber : ''}`}
      className={`inline-flex items-center justify-center gap-2 font-bold rounded-lg shadow-sm transition-all select-none active:scale-[0.98] focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
        isLarge ? 'px-5 py-3 text-sm sm:text-base' : 'px-4 py-2 text-xs sm:text-sm'
      } ${
        copied
          ? 'bg-emerald-700 text-white shadow-md'
          : failed
          ? 'bg-rose-700 text-white'
          : 'bg-blue-900 hover:bg-blue-950 text-white border border-blue-950'
      } ${className}`}
    >
      {copied ? (
        <>
          <Check className={isLarge ? 'w-5 h-5 text-white' : 'w-4 h-4 text-white'} />
          <span>REPORT COPIED TO CLIPBOARD</span>
        </>
      ) : failed ? (
        <>
          <AlertCircle className={isLarge ? 'w-5 h-5 text-white' : 'w-4 h-4 text-white'} />
          <span>COPY FAILED (PERMISSION ERROR)</span>
        </>
      ) : (
        <>
          <FileText className={isLarge ? 'w-5 h-5 text-blue-200' : 'w-4 h-4 text-blue-200'} />
          <span>[COPY COMPLETE REPORT]</span>
        </>
      )}
    </button>
  );
};
