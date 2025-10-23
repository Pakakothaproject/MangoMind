import React, { useState, useEffect } from 'react';
import AuthModal from '../components/AuthModal';

const LoadingScreen: React.FC<{ progress: number }> = ({ progress }) => (
    <div className="absolute inset-0 bg-[var(--nb-bg)] flex flex-col items-center justify-center z-30">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-white">
            <span>MangoMind</span>
        </h1>
        <div className="w-64 mt-8 bg-gray-700 rounded-full h-2.5">
            <div 
                className="bg-[var(--nb-primary)] h-2.5 rounded-full transition-all duration-300 ease-linear" 
                style={{ width: `${progress}%` }}
            ></div>
        </div>
        <p className="mt-4 text-white font-semibold">{Math.round(progress)}%</p>
    </div>
);


const LandingPage: React.FC = () => {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
    const [isLoading, setIsLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [videoReady, setVideoReady] = useState(false);

    useEffect(() => {
        if (isLoading) {
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 99) {
                        clearInterval(interval);
                        return 99;
                    }
                    return prev + 1;
                });
            }, 30); // ~3 seconds to reach 99%

            return () => clearInterval(interval);
        }
    }, [isLoading]);

    useEffect(() => {
        if (videoReady && progress >= 99) {
            setProgress(100);
            setTimeout(() => {
                setIsLoading(false);
            }, 500); // Wait half a second after 100%
        }
    }, [videoReady, progress]);

    const handleVideoCanPlay = () => {
        setVideoReady(true);
    };

    const openAuthModal = (mode: 'signin' | 'signup') => {
        setAuthMode(mode);
        setShowAuthModal(true);
    };

    const handleSignupSuccess = () => {
        // After signup confirmation, show sign-in modal
        setAuthMode('signin');
        setShowAuthModal(true);
    };

    return (
        <div className="h-screen w-full overflow-hidden relative flex flex-col items-center justify-center p-4 text-white">
            {isLoading && <LoadingScreen progress={progress} />}
            <video
                autoPlay
                loop
                muted
                playsInline
                onCanPlayThrough={handleVideoCanPlay}
                className={`absolute top-0 left-0 w-full h-full object-cover z-0 transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                src="https://res.cloudinary.com/dy80ftu9k/video/upload/v1760013195/1009_1_eyqpwy.mp4"
            />
            <div className={`absolute top-0 left-0 w-full h-full bg-black/10 backdrop-blur-sm z-10 transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`} />
            
            <div className={`relative text-center z-20 transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100 animate-fade-in'} translate-y-[0.5cm]`}>
                <img 
                    src="https://res.cloudinary.com/dy80ftu9k/image/upload/v1760277916/SADW_eed6gu.png" 
                    alt="MangoMind Logo"
                    className="absolute inset-0 m-auto w-44 h-44 md:w-56 md:h-56 opacity-100 -translate-y-[calc(50%+1.5rem)]"
                />
                <h1 
                    className="relative text-5xl md:text-7xl font-extrabold tracking-tighter"
                    style={{ textShadow: '0px 4px 15px rgba(0, 0, 0, 0.5)' }}
                >
                    <span>MangoMind</span>
                </h1>
                <p 
                    className="mt-10 max-w-2xl mx-auto text-lg md:text-xl opacity-90"
                    style={{ textShadow: '0px 2px 8px rgba(0, 0, 0, 0.5)' }}
                >
                    AI-Powered Visual Creation Studio. Transform your ideas into stunning visuals. Virtual try-on, scene swapping, marketing campaigns, and more.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                    <button 
                        onClick={() => openAuthModal('signin')} 
                        className="landing-page-button relative overflow-hidden bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold text-lg px-10 py-4 rounded-full shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 animate-gradient-x"
                        style={{ backgroundSize: '200% 200%' }}
                    >
                        Login
                    </button>
                    <button 
                        onClick={() => openAuthModal('signup')} 
                        className="landing-page-button relative overflow-hidden bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 hover:from-green-600 hover:via-teal-600 hover:to-blue-600 text-white font-bold text-lg px-10 py-4 rounded-full shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 animate-gradient-x"
                        style={{ backgroundSize: '200% 200%' }}
                    >
                        Sign Up
                    </button>
                </div>
            </div>
            {showAuthModal && (
                <AuthModal
                    initialMode={authMode}
                    onClose={() => setShowAuthModal(false)}
                    onSignupSuccess={handleSignupSuccess}
                />
            )}
        </div>
    );
};

export default LandingPage;