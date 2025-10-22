import React from 'react';
import { useAppStore } from '../../store/appStore';
import { ArrowLeftIcon, CogIcon } from '../Icons';

const PlaygroundHeader: React.FC = () => {
    const { handleBackToDashboard, navigateToSettings } = useAppStore(s => s.actions);

    return (
        <header className="flex-shrink-0 h-16 bg-[#1A1A1A] border-b border-[var(--nb-border)] flex items-center justify-between px-6 z-10">
            <button 
                onClick={handleBackToDashboard}
                className="bg-[var(--nb-primary)] text-black font-semibold text-sm px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#D6A32E] transition-colors"
            >
                <ArrowLeftIcon />
                Back to Dashboard
            </button>
            <h1 className="text-xl font-bold">Mangomind</h1>
            <button onClick={navigateToSettings} className="p-2 rounded-full hover:bg-[var(--nb-surface)] transition-colors">
                <CogIcon />
            </button>
        </header>
    );
};

export default PlaygroundHeader;