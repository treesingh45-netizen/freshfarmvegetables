import React, { useState } from 'react';
import { Leaf } from 'lucide-react';

interface ProduceImageProps {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}

export function ProduceImage({ src, alt, className = '', eager = false }: ProduceImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#F6F8F6] text-[#0F5338] p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Leaf className="w-8 h-8 text-[#12B326] mb-2 stroke-[1.75]" />
        <span className="text-xs font-medium text-[#687268] line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
