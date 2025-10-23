import React from 'react';
import { SunIcon, MoonIcon } from '../Icons';
import { useAppStore } from '../../store/appStore';

const ThemeSettings: React.FC = () => {
    const { theme, actions: { toggleTheme } } = useAppStore();

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Appearance</h1>
            <div className="neo-card p-6">
                <h2 className="font-semibold text-lg mb-4">Theme</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[var(--nb-surface-alt)] rounded-lg">
                        <div className="flex items-center gap-3">
                            {theme === 'light' ? (
                                <SunIcon className="w-5 h-5 text-[var(--nb-primary)]" />
                            ) : (
                                <MoonIcon className="w-5 h-5 text-[var(--nb-primary)]" />
                            )}
                            <div>
                                <h3 className="font-medium">{theme === 'light' ? 'Light Theme' : 'Dark Theme'}</h3>
                                <p className="text-sm text-[var(--nb-text-secondary)]">
                                    Currently using {theme} theme
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="neo-button neo-button-secondary flex items-center gap-2"
                        >
                            {theme === 'light' ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
                            Switch to {theme === 'light' ? 'Dark' : 'Light'}
                        </button>
                    </div>
                    
                    <div className="text-sm text-[var(--nb-text-secondary)] space-y-2">
                        <p>Choose your preferred theme for the application interface.</p>
                        <p>• <strong>Dark Theme:</strong> Dark interface with bright golden accents</p>
                        <p>• <strong>Light Theme:</strong> Off-white goldenish interface with warm tones</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThemeSettings;