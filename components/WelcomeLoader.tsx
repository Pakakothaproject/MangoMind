import React, { useEffect, useState } from 'react';

const WelcomeLoader: React.FC<{ username: string }> = ({ username }) => {
    const [isAnimating, setIsAnimating] = useState(true);

    useEffect(() => {
        // Start fade out after 800ms (before animation completes)
        const fadeOutTimer = setTimeout(() => {
            setIsAnimating(false);
        }, 800);

        // Force unmount after animation completes (1s)
        const unmountTimer = setTimeout(() => {
            setIsAnimating(false);
        }, 1000);

        return () => {
            clearTimeout(fadeOutTimer);
            clearTimeout(unmountTimer);
        };
    }, []);

    return (
        <div 
            className={`fixed inset-0 z-50 flex items-center justify-center bg-[var(--nb-bg)] transition-opacity duration-300 ${
                isAnimating ? 'opacity-100' : 'opacity-0'
            }`}
        >
            <div className="text-center animate-fade-zoom-in-out">
                <h1 className="text-4xl font-bold text-[var(--nb-text)] mb-4">
                    Welcome back, {username}!
                </h1>
                <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-[var(--nb-primary)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-[var(--nb-primary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-[var(--nb-primary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeLoader;