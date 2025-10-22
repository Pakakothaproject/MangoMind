import React from 'react';

interface ModeSelectorProps {
    appMode: 'tryon' | 'marketing' | 'hairstyle' | 'sceneswap';
    setAppMode: (mode: 'tryon' | 'marketing' | 'hairstyle' | 'sceneswap') => void;
}

const ModeButton: React.FC<{
    label: string;
    icon: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        aria-label={label}
        title={label}
        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg shadow-md transition-all ${
            isActive ? 'bg-[var(--nb-primary)] text-gray-900' : 'bg-gray-800 text-[var(--nb-text)] hover:bg-gray-700'
        }`}
    >
        <span className="material-symbols-outlined !text-base">{icon}</span>
        <span className="text-sm font-semibold">{label}</span>
    </button>
);

export const ModeSelector: React.FC<ModeSelectorProps> = ({ appMode, setAppMode }) => {
    return (
        <div className="grid grid-cols-3 gap-2">
            <ModeButton label="Scene Swap" icon="swap_horiz" isActive={appMode === 'sceneswap'} onClick={() => setAppMode('sceneswap')} />
            <ModeButton label="Try-On" icon="style" isActive={appMode === 'tryon'} onClick={() => setAppMode('tryon')} />
            <ModeButton label="Change Hair" icon="content_cut" isActive={appMode === 'hairstyle'} onClick={() => setAppMode('hairstyle')} />
        </div>
    );
};
