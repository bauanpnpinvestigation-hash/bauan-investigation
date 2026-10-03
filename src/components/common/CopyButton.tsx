import React, { useState } from 'react';
import { Copy, Check, AlertCircle } from 'lucide-react';
import { copyToClipboard } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

interface CopyButtonProps {
  value?: string | number | null;
  label?: string; // Optional context for aria-label or secondary copy
  size?: 'sm' | 'md';
  className?: string;
  showWithLabelOption?: boolean;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  value,
  label,
  size = 'sm',
  className = '',
  showWithLabelOption = false,
}) => {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [showMenu, setShowMenu] = useState(false);
  const toast = useToast();

  const stringValue = value !== null && value !== undefined ? String(value).trim() : '';
  const isEmpty = stringValue.length === 0;

  const handleCopyValue = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEmpty) return;

    const success = await copyToClipboard(stringValue);
    if (success) {
      setCopyState('copied');
      toast.success(label ? `Copied ${label} to clipboard` : 'Copied to clipboard');
      setTimeout(() => setCopyState('idle'), 2000);
    } else {
      setCopyState('error');
      toast.error('Failed to copy to clipboard');
      setTimeout(() => setCopyState('idle'), 2500);
    }
    setShowMenu(false);
  };

  const handleCopyWithLabel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEmpty || !label) return;

    const textToCopy = `${label}: ${stringValue}`;
    const success = await copyToClipboard(textToCopy);
    if (success) {
      setCopyState('copied');
      toast.success(`Copied ${label} with details to clipboard`);
      setTimeout(() => setCopyState('idle'), 2000);
    } else {
      setCopyState('error');
      toast.error('Failed to copy to clipboard');
      setTimeout(() => setCopyState('idle'), 2500);
    }
    setShowMenu(false);
  };

  if (isEmpty) {
    return (
      <span 
        className="inline-flex items-center text-xs text-slate-400 italic cursor-not-allowed select-none py-1 px-1.5"
        title="Empty field (No value to copy)"
      >
        —
      </span>
    );
  }

  const isSmall = size === 'sm';

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={handleCopyValue}
        title={copyState === 'copied' ? 'Copied to clipboard' : label ? `Copy ${label} value` : 'Copy value'}
        aria-label={label ? `Copy value of ${label}` : 'Copy value'}
        className={`inline-flex items-center gap-1 font-medium transition-all rounded shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 select-none active:scale-95 ${
          isSmall 
            ? 'px-2 py-1 text-xs' 
            : 'px-2.5 py-1.5 text-xs sm:text-sm'
        } ${
          copyState === 'copied'
            ? 'bg-emerald-700 text-white font-semibold'
            : copyState === 'error'
            ? 'bg-rose-700 text-white'
            : 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 border border-slate-300'
        }`}
      >
        {copyState === 'copied' ? (
          <>
            <Check className={isSmall ? 'w-3 h-3 text-white' : 'w-3.5 h-3.5 text-white'} />
            <span>Copied</span>
          </>
        ) : copyState === 'error' ? (
          <>
            <AlertCircle className={isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            <span>Failed</span>
          </>
        ) : (
          <>
            <Copy className={isSmall ? 'w-3 h-3 text-slate-500' : 'w-3.5 h-3.5 text-slate-500'} />
            <span className="font-semibold text-slate-800">COPY</span>
          </>
        )}
      </button>

      {/* Secondary "Copy with label" helper toggle if enabled */}
      {showWithLabelOption && label && (
        <div className="relative ml-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            title="More copy options"
            aria-label="More copy options"
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-[10px]"
          >
            ▾
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-md shadow-lg z-20 p-1 text-xs">
              <button
                type="button"
                onClick={handleCopyValue}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 text-slate-700 font-medium flex items-center justify-between"
              >
                <span>Copy Value Only</span>
                <span className="text-[10px] text-slate-400 font-mono">default</span>
              </button>
              <button
                type="button"
                onClick={handleCopyWithLabel}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 text-slate-700 font-medium"
              >
                Copy with Label (<span className="italic">{label}</span>)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
