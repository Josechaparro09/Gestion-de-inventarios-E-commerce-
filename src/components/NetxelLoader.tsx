import React from 'react';

interface LoaderProps {
  fullScreen?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function NetxelLoader({ 
  fullScreen = false, 
  size = 'medium',
  className = ''
}: LoaderProps) {
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-24 h-24',
    large: 'w-48 h-48'
  };

  const loaderContent = (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      <div className="absolute inset-0 bg-teal-500/20 rounded-full animate-ping"></div>
      <div className="absolute inset-0 bg-teal-500/10 rounded-full"></div>
      <div className="z-10 flex items-center justify-center">
        <img 
          src="/images/Netxel.png" 
          alt="Netxel Loading" 
          className={`${sizeClasses[size]} object-contain`} 
        />
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white/50 backdrop-blur-sm flex items-center justify-center">
        {loaderContent}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full h-full">
      {loaderContent}
    </div>
  );
}