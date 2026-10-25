import React from 'react';

interface BrandLogoProps {
  variant?: 'full' | 'symbol' | 'inverse';
  className?: string;
}

const LOGO_ICON_SRC = '/assets/aistudio/fresh_vegetables_app_icon_1024_8f1ed187.png';

export function BrandLogo({ variant = 'full', className = '' }: BrandLogoProps) {
  const isInverse = variant === 'inverse';

  const symbol = (
    <span
      className={`inline-flex items-center justify-center overflow-hidden shrink-0 ${
        isInverse ? 'rounded-lg bg-white px-1' : ''
      } ${variant === 'symbol' ? 'w-16 h-[37px]' : 'w-16 h-[37px] sm:w-20 sm:h-[46px]'}`}
    >
      <img
        src={LOGO_ICON_SRC}
        alt="Fresh Farm Vegetables Logo"
        referrerPolicy="no-referrer"
        className={`w-[112%] h-auto max-w-none shrink-0 select-none pointer-events-none ${
          isInverse ? '' : 'mix-blend-multiply'
        }`}
      />
    </span>
  );

  if (variant === 'symbol') {
    return <span className={`inline-flex items-center ${className}`}>{symbol}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {symbol}
      <span className="flex flex-col leading-none">
        <span
          className={`font-display text-lg sm:text-xl font-bold tracking-tight whitespace-nowrap ${
            isInverse ? 'text-white' : 'text-[#003B22]'
          }`}
        >
          Fresh Farm{' '}
          <span className={isInverse ? 'text-[#16C72E]' : 'text-[#12B326]'}>Vegetables</span>
        </span>
      </span>
    </span>
  );
}
