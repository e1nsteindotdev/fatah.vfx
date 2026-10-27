import React, { useState, useEffect } from 'react';
import { Loader2, ImageOff } from 'lucide-react';

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
  skeletonClassName?: string;
  showSpinner?: boolean;
  fallbackSrc?: string;
}

export function Image({
  src,
  alt = '',
  className = '',
  wrapperClassName = '',
  skeletonClassName = '',
  showSpinner = false,
  fallbackSrc,
  onLoad,
  onError,
  ...props
}: ImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(src ? 'loading' : 'error');
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);

  useEffect(() => {
    if (src) {
      setStatus('loading');
      setCurrentSrc(src);
    } else {
      setStatus('error');
    }
  }, [src]);

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setStatus('loaded');
    if (onLoad) {
      onLoad(event);
    }
  };

  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setStatus('loading');
    } else {
      setStatus('error');
      if (onError) {
        onError(event);
      }
    }
  };

  return (
    <div className={`relative overflow-hidden bg-slate-50/50 ${wrapperClassName}`}>
      {/* Loading States (Shimmer + optional Spinner) */}
      {status === 'loading' && (
        <div 
          className={`absolute inset-0 z-10 flex items-center justify-center animate-shimmer bg-slate-100 ${skeletonClassName}`}
          aria-hidden="true"
        >
          {showSpinner && (
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          )}
        </div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <div 
          className={`absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-100 text-slate-400 p-4 ${skeletonClassName}`}
          aria-label="Failed to load image"
        >
          <ImageOff className="w-8 h-8 opacity-75" />
          <span className="text-[10px] font-sans font-medium uppercase tracking-wider select-none">
            Failed to load
          </span>
        </div>
      )}

      {/* Actual Image */}
      {currentSrc && status !== 'error' && (
        <img
          src={currentSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-all duration-700 ease-out ${
            status === 'loaded' 
              ? 'opacity-100 blur-0 scale-100' 
              : 'opacity-0 blur-[4px] scale-[0.98]'
          } ${className}`}
          {...props}
        />
      )}
    </div>
  );
}
