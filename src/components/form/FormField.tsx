import React from 'react';

interface FormFieldProps {
  id: string;
  labelEn: string;
  labelFil: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  labelEn,
  labelFil,
  required = false,
  error,
  helpText,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label
        htmlFor={id}
        className="block text-xs sm:text-sm font-semibold text-slate-800"
      >
        <span>{labelEn}</span>{' '}
        <span className="text-slate-500 font-medium">({labelFil})</span>
        {required && <span className="text-rose-600 font-bold ml-1">*</span>}
      </label>

      {children}

      {helpText && !error && (
        <p className="text-[11px] sm:text-xs text-slate-500">{helpText}</p>
      )}

      {error && (
        <p className="text-[11px] sm:text-xs font-medium text-rose-600 flex items-center gap-1">
          <span>•</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
