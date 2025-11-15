import React from 'react';

interface NM2TechLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function NM2TechLogo({ size = 'md', className = '' }: NM2TechLogoProps) {
  const sizeConfig = {
    sm: { 
      width: 180, 
      height: 54, 
      fontSize: '18px',
      iconSize: 36,
      iconPadding: 8,
      iconX: 8,
      iconY: 9,
      textX: 56,
      textY: 35,
      spacing: 12
    },
    md: { 
      width: 240, 
      height: 72, 
      fontSize: '24px',
      iconSize: 48,
      iconPadding: 10,
      iconX: 10,
      iconY: 12,
      textX: 72,
      textY: 46,
      spacing: 14
    },
    lg: { 
      width: 300, 
      height: 90, 
      fontSize: '30px',
      iconSize: 60,
      iconPadding: 12,
      iconX: 12,
      iconY: 15,
      textX: 88,
      textY: 57,
      spacing: 16
    },
  };

  const config = sizeConfig[size];
  const iconInnerSize = config.iconSize - (config.iconPadding * 2);
  const iconInnerX = config.iconX + config.iconPadding;
  const iconInnerY = config.iconY + config.iconPadding;
  
  // Calculate precise coordinates for the "2" shape with padding
  const p1x = iconInnerX + iconInnerSize * 0.1;
  const p1y = iconInnerY + iconInnerSize * 0.25;
  const p2x = iconInnerX + iconInnerSize * 0.75;
  const p2y = iconInnerY + iconInnerSize * 0.25;
  const p3x = iconInnerX + iconInnerSize * 0.75;
  const p3y = iconInnerY + iconInnerSize * 0.4;
  const p4x = iconInnerX + iconInnerSize * 0.3;
  const p4y = iconInnerY + iconInnerSize * 0.4;
  const p5x = iconInnerX + iconInnerSize * 0.3;
  const p5y = iconInnerY + iconInnerSize * 0.6;
  const p6x = iconInnerX + iconInnerSize * 0.85;
  const p6y = iconInnerY + iconInnerSize * 0.6;
  const p7x = iconInnerX + iconInnerSize * 0.85;
  const p7y = iconInnerY + iconInnerSize * 0.85;
  const p8x = iconInnerX + iconInnerSize * 0.1;
  const p8y = iconInnerY + iconInnerSize * 0.85;

  return (
    <div className={`flex items-center ${className}`}>
      <svg
        width={config.width}
        height={config.height}
        viewBox={`0 0 ${config.width} ${config.height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Icon: Modern tech symbol with "2" integrated */}
        <g>
          {/* Outer square with rounded corners - represents tech/innovation */}
          <rect
            x={config.iconX}
            y={config.iconY}
            width={config.iconSize}
            height={config.iconSize}
            rx="6"
            className="fill-primary-600"
          />
          
          {/* Inner "2" shape - modern geometric design with precise padding */}
          <path
            d={`M ${p1x} ${p1y} L ${p2x} ${p2y} L ${p3x} ${p3y} L ${p4x} ${p4y} L ${p5x} ${p5y} L ${p6x} ${p6y} L ${p7x} ${p7y} L ${p8x} ${p8y} Z`}
            className="fill-white"
          />
        </g>

        {/* NM2TECH Text with precise positioning */}
        <text
          x={config.textX}
          y={config.textY}
          fontSize={config.fontSize}
          fontWeight="700"
          className="fill-primary-600"
          fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
          letterSpacing="-0.3px"
        >
          NM2TECH
        </text>
      </svg>
    </div>
  );
}

