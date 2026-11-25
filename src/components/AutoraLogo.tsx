import React from 'react';

interface AutoraLogoProps {
  size?: number;
  inverted?: boolean;
}

export const AutoraLogo: React.FC<AutoraLogoProps> = ({ size = 28, inverted = false }) => {
  const primary = inverted ? '#28231f' : '#efb84f';
  const cutout = inverted ? '#efb84f' : '#28231f';
  const line = inverted ? '#28231f' : '#ffffff';

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-label="Logo AUTORA">
      <path d="M8 38 20.5 8h7L40 38h-8l-3-8H18l-3 8H8Z" fill={primary} />
      <path d="m20.5 24 3.5-9 3.5 9h-7Z" fill={cutout} />
      <path d="M5 42h38" stroke={line} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
};
