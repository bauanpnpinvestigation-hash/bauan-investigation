import React, { useState } from 'react';
import logoTransparent from '../../assets/images/bauan_mps_logo_transparent.png';

interface BackgroundWatermarkProps {
  opacity?: number;
  className?: string;
  theme?: 'dark' | 'light' | 'auto';
}

const FALLBACK_PUBLIC_LOGO = '/bauan_mps_logo_transparent.png';

export const BackgroundWatermark: React.FC<BackgroundWatermarkProps> = ({
  opacity,
  className = '',
  theme = 'dark',
}) => {
  const [imgSrc, setImgSrc] = useState<string>(logoTransparent || FALLBACK_PUBLIC_LOGO);

  // Enhanced visibility: Gives the emblem a bold, resilient, authoritative presence
  // with 100% transparent outer background (zero white borders/corners)
  const defaultOpacityClass = theme === 'dark' 
    ? 'opacity-[0.24] sm:opacity-[0.32]' 
    : 'opacity-[0.85] sm:opacity-[0.95]';

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none select-none overflow-hidden flex items-center justify-center z-0 transform-gpu ${className}`}
    >
      {/* Dynamic ambient radial lighting matching official PNP colors */}
      {theme === 'dark' ? (
        <div className="absolute w-[450px] h-[450px] sm:w-[750px] sm:h-[750px] rounded-full bg-blue-600/25 blur-3xl pointer-events-none transform-gpu" />
      ) : (
        <div className="absolute w-[450px] h-[450px] sm:w-[750px] sm:h-[750px] rounded-full bg-blue-900/[0.05] blur-3xl pointer-events-none transform-gpu" />
      )}

      {/* Official Bauan MPS Investigation Section Transparent Emblem */}
      <div 
        className={`relative w-[340px] h-[340px] sm:w-[540px] sm:h-[540px] md:w-[680px] md:h-[680px] max-w-[88vw] max-h-[88vh] rounded-full overflow-hidden transition-opacity duration-300 ease-out transform-gpu will-change-transform ${defaultOpacityClass}`}
        style={opacity !== undefined ? { opacity } : undefined}
      >
        <img
          src={imgSrc}
          alt=""
          role="presentation"
          referrerPolicy="no-referrer"
          loading="eager"
          decoding="async"
          onError={() => setImgSrc(FALLBACK_PUBLIC_LOGO)}
          className="w-full h-full object-contain filter contrast-125 saturate-125 drop-shadow-2xl"
        />
      </div>
    </div>
  );
};
