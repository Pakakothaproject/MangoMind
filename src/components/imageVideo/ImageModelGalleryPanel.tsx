import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XIcon } from '../Icons';
import ImageVideoModelPreferences from '../settings/ImageVideoModelPreferences';
import { useImageVideoModelGalleryActions, useIsModelGalleryOpen } from '../../store/imageVideoModelGalleryStore';

const ImageModelGalleryPanel: React.FC = () => {
    const { closeModelGallery } = useImageVideoModelGalleryActions();
    const isOpen = useIsModelGalleryOpen();
    const navigate = useNavigate();

    // Check if we're being accessed directly from settings (not as a modal)
    const isDirectSettingsAccess = window.location.pathname === '/settings/image-models';

    const handleClose = () => {
        if (isDirectSettingsAccess) {
            navigate('/settings/models');
        } else {
            closeModelGallery();
        }
    };

    // If accessed directly from settings, render as a full page instead of modal
    if (isDirectSettingsAccess) {
        return (
            <div className="h-full w-full bg-[var(--nb-bg)] text-[var(--nb-text)] overflow-y-auto">
                <header className="flex-shrink-0 p-4 flex items-center justify-between border-b border-[var(--nb-border)]">
                    <h2 className="text-xl font-bold text-[var(--nb-text)]">Image Generation Models</h2>
                    <button onClick={handleClose} className="neo-button neo-icon-button neo-button-secondary">
                        <XIcon />
                    </button>
                </header>
                <main className="flex-grow p-4">
                    <ImageVideoModelPreferences modelType="image" />
                </main>
            </div>
        );
    }

    // Original modal behavior for when opened from other pages
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleClose}>
            <div className="w-[90vw] h-[90vh] max-w-6xl bg-[var(--nb-surface)] rounded-lg shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex-shrink-0 p-4 flex items-center justify-between border-b border-[var(--nb-border)]">
                    <h2 className="text-xl font-bold text-[var(--nb-text)]">Image Generation Models</h2>
                    <button onClick={handleClose} className="neo-button neo-icon-button neo-button-secondary">
                        <XIcon />
                    </button>
                </header>
                <main className="flex-grow p-4 overflow-y-auto">
                    <ImageVideoModelPreferences modelType="image" />
                </main>
            </div>
        </div>
    );
};

export default ImageModelGalleryPanel;