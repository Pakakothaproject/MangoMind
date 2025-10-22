import React, { useCallback, useEffect, useMemo } from 'react';
import type { UploadedImage } from '../types';
import { useAppStore } from '../store/appStore';
import { useVideoGenStore, type VideoGenState } from '../store/videoGenStore';
import { useModelStore } from '../store/modelStore';
import { ImageUploader } from '../components/ImageUploader';
import { TabButton } from '../components/TabButton';
import { FilmIcon, SparklesIcon, ChevronDownIcon, ArrowLeftIcon, MenuIcon, XIcon, AlertTriangleIcon } from '../components/Icons';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Header } from '../components/Header';
import ModelSelector from '../components/ModelSelector';
import VideoModelGalleryPanel from '../components/imageVideo/VideoModelGalleryPanel';
import { useImageVideoModelGalleryActions } from '../store/imageVideoModelGalleryStore';
import AspectRatioSelector from '../components/AspectRatioSelector';
import { MODEL_SUPPORT_MAP } from '../constants/models';
import useLocalStorage from '../hooks/use-local-storage';



interface VideoPanelContentProps {
    onNavigateBack: () => void;
    onClosePanel?: () => void;
    onNavigateToGenerator: () => void;
    store: VideoGenState;
}

const VideoPanelContent: React.FC<VideoPanelContentProps> = ({
    onNavigateBack, onClosePanel, onNavigateToGenerator, store
}) => {
    const {
        mode, setMode, prompt, setPrompt, negativePrompt, setNegativePrompt,
        aspectRatio, setAspectRatio, reusePrompt, setReusePrompt, image, setImage,
        firstFrame, setFirstFrame, lastFrame, setLastFrame,
        showSettings, setShowSettings, handleGenerate, isLoading, modelId, setModelId,
    } = store;
    const { models } = useModelStore();
    const { openModelGallery } = useImageVideoModelGalleryActions();
    const [preferredVideoModels] = useLocalStorage<string[]>('preferred-video-models', []);

    // Get model-specific configuration
    const modelSupport = MODEL_SUPPORT_MAP[modelId] || {};
    const supportedAspectRatios = modelSupport.aspectRatios || ['16:9', '9:16', '1:1'];
    const supportsNegativePrompt = modelSupport.supportsNegativePrompt !== false;
    const supportsFirstFrame = modelSupport.supportsFirstLastFrame === 'both' || modelSupport.supportsFirstLastFrame === 'first';
    const supportsLastFrame = modelSupport.supportsFirstLastFrame === 'both';

    const filteredModels = useMemo(() => {
        const typeFilter = mode === 'image' ? 'i2v' : 't2v';
        const allVideoModels = models.filter(m => m.tags?.includes(typeFilter));
        
        // If user has preferred video models set, filter to show only those
        if (preferredVideoModels.length > 0) {
            const preferredVideoModelsByType = allVideoModels.filter(m => preferredVideoModels.includes(m.id));
            // If preferred models exist, return them, otherwise fall back to all accessible video models
            return preferredVideoModelsByType.length > 0 ? preferredVideoModelsByType : allVideoModels.filter(m => m.is_accessible);
        }
        
        // No preferences set, show all accessible video models
        return allVideoModels.filter(m => m.is_accessible);
    }, [mode, models, preferredVideoModels]);

    // Effect to switch to a valid model if the current one isn't supported by the selected mode
    useEffect(() => {
        const currentModelIsValid = filteredModels.some(m => m.id === modelId);
        if (!currentModelIsValid && filteredModels.length > 0) {
            setModelId(filteredModels[0].id);
        }
    }, [filteredModels, modelId, setModelId]);
    
    const isGenerateDisabled = isLoading || !prompt || (mode === 'image' && !image);

    return (
        <aside className="h-full bg-[var(--nb-surface)] flex flex-col shadow-lg w-full">
            <header className="flex-shrink-0 p-4 flex items-center justify-between border-b border-[var(--nb-border)]">
                 <button onClick={onNavigateBack} className="hidden lg:flex items-center gap-2 text-[var(--nb-text)] hover:opacity-80 transition-opacity">
                    <ArrowLeftIcon />
                    <span className="font-semibold">Back</span>
                </button>
                <h1 className="text-xl font-bold text-[var(--nb-text)] flex items-center gap-3 lg:mx-auto">
                    <FilmIcon className="w-6 h-6 text-[var(--nb-primary)]" />
                    Video Generation
                </h1>
                {onClosePanel && (
                    <button onClick={onClosePanel} className="lg:hidden neo-button neo-icon-button neo-button-secondary">
                        <XIcon />
                    </button>
                )}
                 <div className="hidden lg:flex w-20"></div> {/* Spacer for desktop */}
            </header>
            <div className="p-4 border-b border-[var(--nb-border)]">
                 <button onClick={onNavigateToGenerator} className="w-full neo-button neo-button-secondary flex items-center justify-center gap-2">
                    <SparklesIcon />
                    <span>Generate New Image</span>
                </button>
            </div>
            <div className="flex-grow p-4 space-y-6 overflow-y-auto">
                {/* Step 1: Model Selection */}
                <div className="step-card">
                    <h3 className="step-title"><span className="step-number">1</span> Select Model</h3>
                    <ModelSelector
                        models={filteredModels}
                        selectedModel={modelId}
                        onSelectModel={setModelId}
                        label="Video Generation Model"
                        showAllModels={true}
                        maxModels={10}
                        onOpenGallery={openModelGallery}
                        modelType="video"
                    />
                </div>
                
                {/* Step 2: Input Type */}
                <div className="step-card">
                    <h3 className="step-title"><span className="step-number">2</span> Input Type</h3>
                    <div className="neo-tab-container">
                        <TabButton label="Text to Video" isActive={mode === 'text'} onClick={() => setMode('text')} />
                        <TabButton label="Image to Video" isActive={mode === 'image'} onClick={() => setMode('image')} />
                    </div>
                    {mode === 'image' && (
                        <div className="mt-4 animate-fade-in">
                            <ImageUploader image={image} onImageUpload={setImage} />
                        </div>
                    )}
                </div>

                {/* Step 3: Prompt */}
                <div className="step-card">
                    <h3 className="step-title"><span className="step-number">3</span> Describe your video</h3>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="neo-textarea w-full !bg-[var(--nb-surface)] h-32"
                        placeholder="e.g., A majestic eagle soaring through a cloudy sky, cinematic."
                    />
                    <div className="mt-3 flex items-center">
                        <input
                            id="reuse-prompt"
                            type="checkbox"
                            checked={reusePrompt}
                            onChange={(e) => setReusePrompt(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-[var(--nb-primary)] focus:ring-transparent"
                        />
                        <label htmlFor="reuse-prompt" className="ml-2 block text-sm font-medium">
                            Save prompt for future use
                        </label>
                    </div>
                </div>

                {/* Step 4: Settings */}
                <div className="step-card">
                    <button onClick={() => setShowSettings(!showSettings)} className="w-full flex justify-between items-center">
                        <h3 className="step-title !mb-0"><span className="step-number">4</span> Settings</h3>
                        <ChevronDownIcon className={`w-6 h-6 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
                    </button>
                    {showSettings && (
                        <div className="mt-4 space-y-4 animate-fade-in border-t border-dashed border-[var(--nb-border)] pt-4">
                            {supportsNegativePrompt && (
                                <div>
                                    <label className="font-semibold block text-sm mb-2">Negative Prompt</label>
                                    <textarea
                                        value={negativePrompt}
                                        onChange={(e) => setNegativePrompt(e.target.value)}
                                        className="neo-textarea w-full !bg-[var(--nb-surface)] h-24"
                                        placeholder="e.g., blurry, low quality, watermark"
                                    />
                                </div>
                            )}
                            <AspectRatioSelector 
                                value={aspectRatio} 
                                onChange={setAspectRatio} 
                                ratios={supportedAspectRatios}
                            />
                            {supportsFirstFrame && (
                                <div>
                                    <label className="font-semibold block text-sm mb-2">First Frame</label>
                                    <ImageUploader 
                                        image={firstFrame} 
                                        onImageUpload={setFirstFrame} 
                                        label="Upload First Frame"
                                    />
                                </div>
                            )}
                            {supportsLastFrame && (
                                <div>
                                    <label className="font-semibold block text-sm mb-2">Last Frame</label>
                                    <ImageUploader 
                                        image={lastFrame} 
                                        onImageUpload={setLastFrame} 
                                        label="Upload Last Frame"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {/* Generate Button */}
            <div className="flex-shrink-0 p-4 border-t border-[var(--nb-border)]">
                <button
                    onClick={handleGenerate}
                    disabled={isGenerateDisabled}
                    className="w-full neo-button neo-button-primary text-lg"
                >
                    <SparklesIcon />
                    {isLoading ? 'Generating...' : 'Generate Video'}
                </button>
            </div>
        </aside>
    );
};


const VideoGenPage: React.FC = () => {
    const { 
        actions: {
            handleBackToDashboard, toggleTheme, signOut, navigateToSettings, navigateToGenerations, navigateToGenerator
        },
        theme, initialVideoGenImage 
    } = useAppStore();
    const store = useVideoGenStore();

    useEffect(() => {
        store.init(initialVideoGenImage);
    }, [initialVideoGenImage, store.init]);

    const {
        isPanelOpen, panelWidth, handleMouseDown, isDownloading, handleDownload,
        canUndo, handleUndo, canRedo, handleRedo, generatedVideoUrl, isLoading,
        loadingMessage, error
    } = store;

    return (
        <div className="h-full w-full bg-[var(--nb-bg)] text-[var(--nb-text)] flex overflow-hidden animate-fade-in">
             {/* DESKTOP: Resizable Panel */}
            <div className="hidden lg:flex h-full flex-shrink-0" style={{ width: `${panelWidth}px` }}>
                <VideoPanelContent onNavigateBack={handleBackToDashboard} onNavigateToGenerator={navigateToGenerator} store={store} />
            </div>
            <div 
                onMouseDown={handleMouseDown}
                className="hidden lg:flex w-1.5 h-full cursor-col-resize flex-shrink-0 items-center justify-center group"
            >
                <div className="w-0.5 h-16 bg-[var(--nb-border)] rounded-full group-hover:bg-[var(--nb-primary)] transition-colors" />
            </div>

             {/* MOBILE: Slide-out Panel */}
             <aside className={`slide-out-panel lg:hidden !max-w-md ${isPanelOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <VideoPanelContent onNavigateBack={handleBackToDashboard} onClosePanel={() => store.setIsPanelOpen(false)} onNavigateToGenerator={navigateToGenerator} store={store} />
            </aside>

            {/* Preview Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-[var(--nb-bg)] relative">
                <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
                     <Header
                        theme={theme}
                        toggleTheme={toggleTheme}
                        onTogglePanel={() => store.setIsPanelOpen(!store.isPanelOpen)}
                        canUndo={canUndo}
                        handleUndo={handleUndo}
                        canRedo={canRedo}
                        handleRedo={handleRedo}
                        isDownloading={isDownloading}
                        handlePrimaryDownload={handleDownload}
                        hasGeneratedContent={!!generatedVideoUrl}
                        handleSignOut={signOut}
                        onNavigateToSettings={navigateToSettings}
                        onNavigateToGenerations={navigateToGenerations}
                        onNavigateBack={handleBackToDashboard}
                    />
                </div>
                <div className="relative w-full h-full flex flex-col items-center justify-center p-2 pt-20 lg:pt-8 md:p-8">
                     {isLoading && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20 p-4">
                            <LoadingSpinner message={loadingMessage || "Generating..."} />
                        </div>
                    )}
                    {error && !isLoading && (
                         <div className="error-card">
                            <AlertTriangleIcon />
                            <p className="font-semibold">Generation Failed</p>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                    )}
                    {!isLoading && !error && generatedVideoUrl ? (
                        <video key={generatedVideoUrl} src={generatedVideoUrl} controls autoPlay loop className="max-w-full max-h-full rounded-lg shadow-2xl" />
                    ) : !isLoading && !error && (
                        <div className="text-center text-[var(--nb-text-secondary)]">
                            <FilmIcon className="mx-auto mb-4 w-16 h-16"/>
                            <p className="font-semibold text-lg text-[var(--nb-text)]">Your generated video will appear here</p>
                        </div>
                    )}
                </div>
            </main>
            {isPanelOpen && <div className="panel-backdrop lg:hidden" onClick={() => store.setIsPanelOpen(false)} />}
            <VideoModelGalleryPanel />
        </div>
    );
};

export default VideoGenPage;