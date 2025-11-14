import React from 'react';

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', showTagline = true, size = 'md' }: LogoProps) {
  const textSizes = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  };

  const taglineSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const textSize = textSizes[size];

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className={`${textSize} font-bold text-primary-600 tracking-wide`}>
        NM2TECH
      </div>
      {showTagline && (
        <p className={`text-gray-500 ${taglineSizes[size]} mt-1 text-center`}>
          TECHNOLOGY SIMPLIFIED
        </p>
      )}
    </div>
  );
}
