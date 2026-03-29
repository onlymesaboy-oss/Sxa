import React from 'react';
import { Shield } from 'lucide-react';

interface TeamLogoProps {
  src?: string;
  alt: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TeamLogo: React.FC<TeamLogoProps> = ({ src, alt, className = '', size = 'md' }) => {
  const [error, setError] = React.useState(false);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-24 h-24 md:w-32 md:h-32'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-6 h-6',
    lg: 'w-12 h-12 md:w-16 md:h-16'
  };

  const isInvalidLogo = !src || src.includes('/0.png') || src === '';

  if (error || isInvalidLogo) {
    return (
      <div className={`flex items-center justify-center bg-zinc-900/50 rounded-2xl border border-white/5 ${sizeClasses[size]} ${className}`}>
        <Shield className={`${iconSizes[size]} text-zinc-800`} />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain drop-shadow-2xl transition-transform hover:scale-110 duration-500"
        referrerPolicy="no-referrer"
        onError={() => setError(true)}
      />
    </div>
  );
};
