import React from 'react';

interface NM2TechLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function NM2TechLogo({ size = 'md', className = '' }: NM2TechLogoProps) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const subtextSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className={`font-bold ${sizeClasses[size]} text-primary-600 tracking-tight`}>
        NM2TECH
      </div>
      <div className={`${subtextSizes[size]} text-gray-500 font-medium mt-0.5 tracking-wide`}>
        LLC
      </div>
    </div>
  );
}

