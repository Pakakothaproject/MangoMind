 import React, { useState, useEffect } from 'react';
import { TabButton } from './TabButton';
import { TryOnMode } from './TryOnMode';
import { SceneSwapMode } from './SceneSwapMode';
import { StudioPanel } from './StudioPanel';
import { InputType } from '../types';
import { HairStyleMode } from './HairStyleMode';
import { ModeSelector } from './ModeSelector';
import { useStudioStore } from '../store/studioStore';
import { SparklesIcon } from './Icons';

export const LeftPanel: React.FC = () => {
    
    const [view, setView] = useState<'setup' | 'studio'>('setup');

    // Select all state and actions from the store
    const store = useStudioStore();
    const {
        isPanelOpen: isOpen,
        onNavigateBack,
        appMode,
        setAppMode,
        originalModelImage,
        handleGenerate,
        baseGeneratedImages,
        activeImageIndex,
        onNavigateToGenerator,
        tryOnInputType: activeTab,
        setTryOnInputType: setActiveTab,
        handleLoadFromUrlInput,
        // FIX: Alias setClothingImage to handleClothingImageUpload as expected by TryOnMode props.
        setClothingImage: handleClothingImageUpload,
        setActivePresetPanel
    } = store;

    const currentGeneratedImage = baseGeneratedImages?.[activeImageIndex] ?? null;

    useEffect(() => {
        if (!currentGeneratedImage || store.loadingMessage) {
            setView('setup');
        }
    }, [currentGeneratedImage, store.loadingMessage]);
    
    useEffect(() => {
        if (store.clothingImageUrl && (store.clothingImageUrl.startsWith('http') || store.clothingImageUrl.startsWith('https:')) && handleLoadFromUrlInput) {
            handleLoadFromUrlInput();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const renderSetupContent = () => {
        switch(appMode) {
            case 'tryon':
                return <TryOnMode
                        {...store}
                        modelImage={originalModelImage}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        handleGenerate={() => handleGenerate(activeTab)}
                        handleClothingImageUpload={handleClothingImageUpload}
                        handleLoadFromUrlInput={handleLoadFromUrlInput}
                        onShowPresets={() => setActivePresetPanel('tryon')}
                    />;
            case 'sceneswap':
                return <SceneSwapMode 
                    {...store} 
                    modelImage={originalModelImage}
                    onShowPresets={() => setActivePresetPanel('sceneswap')}
                />;
            case 'hairstyle':
                return <HairStyleMode {...store} modelImage={originalModelImage} />;
            default:
                return null;
        }
    };

    return (
        <aside className={`h-full bg-[var(--nb-surface)] flex flex-col shadow-lg transition-transform duration-300 ease-in-out
            fixed top-0 left-0 w-[90%] max-w-md z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:relative lg:w-full lg:transform-none lg:max-w-none`}>
            <div className="flex-shrink-0 p-4 flex items-center justify-between">
                <button onClick={onNavigateBack} className="flex items-center gap-2 text-[var(--nb-text)] hover:opacity-80 transition-opacity">
                    <span className="material-symbols-outlined">arrow_back</span>
                    <span className="font-semibold">Back</span>
                </button>
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-[var(--nb-text)]">Controls</h1>
                    <button onClick={store.onNavigateToSettings} className="text-[var(--nb-text)] hover:opacity-80 transition-opacity">
                        <span className="material-symbols-outlined">tune</span>
                    </button>
                </div>
            </div>

            <div className="px-6 pb-4 border-b border-[var(--nb-border)]">
                <button onClick={onNavigateToGenerator} className="w-full neo-button neo-button-secondary flex items-center justify-center gap-2">
                    <SparklesIcon />
                    <span>Generate New Image</span>
                </button>
            </div>

            <div className="px-6 pt-6 pb-6">
                <ModeSelector appMode={appMode} setAppMode={setAppMode} />
            </div>
            
            <div className="flex-grow overflow-y-auto px-6 pb-6 space-y-6">
                 {currentGeneratedImage && !store.loadingMessage && (
                    <div className="flex-shrink-0">
                        <div className="neo-tab-container !p-1.5">
                            <TabButton label="Setup" isActive={view === 'setup'} onClick={() => setView('setup')} />
                            <TabButton label="Studio" isActive={view === 'studio'} onClick={() => setView('studio')} />
                        </div>
                    </div>
                )}
                {view === 'setup' ? renderSetupContent() : <StudioPanel {...store as any} />}
            </div>
        </aside>
    );
};