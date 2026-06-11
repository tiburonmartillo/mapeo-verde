import React, { useState } from 'react';
import { TreePine } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackUrl?: string;
  FallbackIcon?: React.ElementType;
  iconSize?: number;
}

export const SafeImage = ({
  src,
  alt,
  className,
  fallbackUrl,
  FallbackIcon = TreePine,
  iconSize = 48,
  ...imgProps
}: SafeImageProps) => {
  const [imgError, setImgError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!imgError && fallbackUrl) {
      setImgError(true);
      (e.target as HTMLImageElement).src = fallbackUrl;
    } else {
      setImgError(true);
      setFallbackError(true);
    }
  };

  if (imgError && fallbackError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className || ''}`} style={{ minHeight: iconSize * 2 }}>
        <FallbackIcon size={iconSize} strokeWidth={1} className="opacity-40 text-gray-500" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || ''}
      className={className}
      loading="lazy"
      onError={handleError}
      {...imgProps}
    />
  );
};
