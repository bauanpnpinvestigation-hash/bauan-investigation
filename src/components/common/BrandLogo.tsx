import React, { useState } from 'react';
import { Shield } from 'lucide-react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const LOGO_SRC = '/src/assets/images/bauan_mps_logo_transparent.png';

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-8 h-8',
  };

  if (hasError) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-blue-900 border border-blue-600 flex items-center justify-center shadow-inner shrink-0 ${className}`}
      >
        <Shield className={`${iconSizes[size]} text-amber-400`} />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full overflow-hidden bg-blue-950 border border-amber-400/60 shadow-md flex items-center justify-center shrink-0 ${className}`}
    >
      <img
        src={LOGO_SRC}
        alt="Bauan MPS Logo"
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
      />
    </div>
  );
};
