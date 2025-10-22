import React from 'react';
import { useChatSessionStore } from '../../store/chat';
import { XIcon } from '../Icons';
import ModelPreferences from '../settings/ModelPreferences';

export const ModelGalleryPanel: React.FC = () => {
    const isModelGalleryOpen = useChatSessionStore(state => state.isModelGalleryOpen);
    const toggleModelGallery = useChatSessionStore(state => state.actions.toggleModelGallery);

    if (!isModelGalleryOpen) {
        return null;
    }

    return (
        <div 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="model-gallery-title" 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={toggleModelGallery}
            />
            <div 
                className="relative bg-[var(--nb-surface)] text-[var(--nb-text)] rounded-xl shadow-2xl w-full max-w-3xl animate-fade-in flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex-shrink-0 p-4 flex items-center justify-between border-b border-[var(--nb-border)]">
                    <h2 id="model-gallery-title" className="text-xl font-bold">Model Gallery</h2>
                    <button onClick={toggleModelGallery} className="neo-button neo-icon-button neo-button-secondary">
                        <XIcon />
                    </button>
                </header>
                <main className="flex-grow p-4 overflow-y-auto">
                    <ModelPreferences />
                </main>
            </div>
        </div>
    );
};
