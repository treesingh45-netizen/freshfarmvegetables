import React, { useState, useEffect } from 'react';
import { Leaf } from 'lucide-react';

interface ProduceImageProps {
  src: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  eager?: boolean;
}

export function ProduceImage({
  src,
  fallbackSrc,
  alt,
  className = '',
  eager = false,
}: ProduceImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setFailed(false);
  }, [src]);

  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else {
      setFailed(true);
    }
  };

  if (failed || !currentSrc) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#003B22] text-[#8EE04E] p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Leaf className="w-8 h-8 text-[#12B326] mb-2 stroke-[1.75]" />
        <span className="text-xs font-medium text-white/80 line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      referrerPolicy="no-referrer"
      onError={handleError}
      className={className}
    />
  );
}
