import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', showTagline = true, size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
  };

  const imageSizes = {
    sm: { width: 120, height: 32 },
    md: { width: 180, height: 48 },
    lg: { width: 240, height: 64 },
  };

  const taglineSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const imageSize = imageSizes[size];

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: imageSize.width, height: imageSize.height }}>
        <Image
          src="/logo.png"
          alt="NM2TECH Logo"
          width={imageSize.width}
          height={imageSize.height}
          className="object-contain"
          priority
        />
      </div>
      {showTagline && (
        <p className={`text-gray-500 ${taglineSizes[size]} mt-1 text-center`}>
          TECHNOLOGY SIMPLIFIED
        </p>
      )}
    </div>
  );
}
