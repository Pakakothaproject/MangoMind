import React, { createContext, useContext, useRef, useCallback } from 'react';

const soundUrl = 'https://res.cloudinary.com/dukaroz3u/video/upload/v1755162402/k4hbswavrhkgxkijezd2.mp3';
const soundVolume = 0.02;

interface SoundContextType {
    playHoverSound: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const useSound = () => {
    const context = useContext(SoundContext);
    if (!context) {
        // Return a no-op function if the provider is not found.
        // This makes the feature gracefully degrade without throwing errors.
        return { playHoverSound: () => {} };
    }
    return context;
};

export const useHoverSoundProps = () => {
    const { playHoverSound } = useSound();
    return { onMouseEnter: playHoverSound };
};

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const playHoverSound = useCallback(() => {
        if (!audioRef.current) {
            const audio = new Audio(soundUrl);
            audio.volume = soundVolume;
            audioRef.current = audio;
        }
        
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            // play() returns a promise which can be rejected if the user hasn't interacted with the page yet.
            // We catch this to prevent unhandled promise rejection errors in the console.
            audioRef.current.play().catch(() => {});
        }
    }, []);

    const value = { playHoverSound };

    // FIX: Replaced JSX with React.createElement to be compatible with a .ts file extension.
    return React.createElement(SoundContext.Provider, { value }, children);
};