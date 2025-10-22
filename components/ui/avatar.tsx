import React, { useState } from 'react';

// A simple context to communicate image loading status between AvatarImage and AvatarFallback
const AvatarContext = React.createContext<{
  imageStatus: 'idle' | 'loading' | 'loaded' | 'error';
  setImageStatus: (status: 'idle' | 'loading' | 'loaded' | 'error') => void;
} | null>(null);

const useAvatarContext = () => {
  const context = React.useContext(AvatarContext);
  if (!context) {
    throw new Error('Avatar components must be used within an Avatar provider');
  }
  return context;
};

// Main Avatar container component
const Avatar: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const [imageStatus, setImageStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');

  return (
    <AvatarContext.Provider value={{ imageStatus, setImageStatus }}>
      <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className || ''}`}>
        {children}
      </div>
    </AvatarContext.Provider>
  );
};

// Component to render the image
const AvatarImage: React.FC<{ src?: string; alt?: string; className?: string }> = ({ src, alt, className }) => {
  const { imageStatus, setImageStatus } = useAvatarContext();

  React.useEffect(() => {
    if (src) {
      setImageStatus('loading');
      const img = new Image();
      img.src = src;
      img.onload = () => setImageStatus('loaded');
      img.onerror = () => setImageStatus('error');
    } else {
      setImageStatus('idle');
    }
  }, [src, setImageStatus]);

  if (imageStatus !== 'loaded') {
    return null;
  }

  return <img src={src} alt={alt} className={`aspect-square h-full w-full ${className || ''}`} />;
};

// Component to render a fallback (initials, icon, etc.)
const AvatarFallback: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const { imageStatus } = useAvatarContext();
  
  // Don't render the fallback if the image has successfully loaded
  if (imageStatus === 'loaded') {
    return null;
  }

  return (
    <div className={`flex h-full w-full items-center justify-center rounded-full bg-[var(--nb-surface-alt)] ${className || ''}`}>
      {children}
    </div>
  );
};

export { Avatar, AvatarImage, AvatarFallback };