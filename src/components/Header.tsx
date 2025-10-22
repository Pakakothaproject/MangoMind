import React, { useState, useRef, useEffect } from 'react';
import { MoonIcon, SunIcon, MenuIcon, UndoIcon, RedoIcon, DownloadIcon, LogOutIcon, ArrowLeftIcon, CogIcon, ImageIcon, MoreHorizontalIcon } from './Icons';

interface HeaderProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    onTogglePanel: () => void;
    canUndo: boolean;
    handleUndo: () => void;
    canRedo: boolean;
    handleRedo: () => void;
    isDownloading: boolean;
    handlePrimaryDownload: () => void;
    hasGeneratedContent: boolean;
    handleSignOut: () => void;
    onNavigateBack?: () => void;
    onNavigateToSettings: () => void;
    onNavigateToGenerations: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
    theme, toggleTheme, onTogglePanel,
    canUndo, handleUndo, canRedo, handleRedo, isDownloading, handlePrimaryDownload, hasGeneratedContent,
    handleSignOut, onNavigateBack, onNavigateToSettings, onNavigateToGenerations
}) => {
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const optionsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
                setIsOptionsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className="w-full p-4 flex justify-between items-start gap-4 pointer-events-auto">
            {/* Left side actions */}
            <div className="flex items-center gap-2">
                 {onNavigateBack && (
                     <button onClick={onNavigateBack} aria-label="Back to Dashboard" className="lg:hidden neo-button header-action-button flex items-center gap-2 pr-4">
                        <ArrowLeftIcon />
                        <span className="hidden sm:inline">Back</span>
                    </button>
                 )}
                 <button onClick={onTogglePanel} aria-label="Toggle controls panel" className="neo-button neo-icon-button header-action-button lg:hidden">
                    <MenuIcon />
                </button>
            </div>
            
            {/* Right side actions */}
            <div className="flex items-center gap-2 mr-24">
                 <button onClick={handleUndo} disabled={!canUndo} className="neo-button neo-icon-button header-action-button"><UndoIcon /></button>
                 <button onClick={handleRedo} disabled={!canRedo} className="neo-button neo-icon-button header-action-button"><RedoIcon /></button>
                 <button onClick={handlePrimaryDownload} disabled={isDownloading || !hasGeneratedContent} className="neo-button neo-icon-button header-action-button"><DownloadIcon /></button>
                <div className="relative" ref={optionsRef}>
                    <button onClick={() => setIsOptionsOpen(p => !p)} aria-label="Options" className="neo-button neo-icon-button header-action-button">
                        <MoreHorizontalIcon />
                    </button>
                    {isOptionsOpen && (
                        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl neo-card p-2 z-50 shadow-2xl animate-fade-in">
                            <div className="py-1">
                                <button onClick={() => { onNavigateToSettings(); setIsOptionsOpen(false); }} className="w-full flex items-center gap-3 text-left px-4 py-2 text-sm rounded-lg hover:bg-[var(--nb-surface-alt)] transition-colors font-medium">
                                    <CogIcon />
                                    <span>Settings</span>
                                </button>
                                <button onClick={() => { onNavigateToGenerations(); setIsOptionsOpen(false); }} className="w-full flex items-center gap-3 text-left px-4 py-2 text-sm rounded-lg hover:bg-[var(--nb-surface-alt)] transition-colors font-medium">
                                    <ImageIcon />
                                    <span>My Generations</span>
                                </button>
                                <button onClick={() => { toggleTheme(); setIsOptionsOpen(false); }} className="w-full flex items-center gap-3 text-left px-4 py-2 text-sm rounded-lg hover:bg-[var(--nb-surface-alt)] transition-colors font-medium">
                                    {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                                    <span>Toggle Theme</span>
                                </button>
                            </div>
                            <div className="border-t border-[var(--nb-border)] my-1"></div>
                            <div className="py-1">
                                <button onClick={handleSignOut} className="w-full flex items-center gap-3 text-left px-4 py-2 text-sm rounded-lg hover:bg-[var(--nb-surface-alt)] transition-colors font-medium text-[var(--nb-secondary)]">
                                    <LogOutIcon />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};