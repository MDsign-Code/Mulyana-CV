import React, { useEffect, useState } from 'react';

interface PortfolioImageProps {
  src: string;
  alt: string;
  category?: string;
  className?: string;
}

export const PortfolioImage: React.FC<PortfolioImageProps> = ({
  src,
  alt,
  category,
  className = 'h-full w-full object-cover',
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-[#121722] p-6 text-center select-none">
        {category && (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
            {category}
          </span>
        )}
        <p className="mt-1.5 font-display text-sm font-semibold text-slate-200 line-clamp-2 max-w-xs">
          {alt}
        </p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={className}
      referrerPolicy="no-referrer"
      loading="lazy"
    />
  );
};
