import React, { useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { useImageGenerationStore } from '../store/imageGenerationStore';
import { useModelStore } from '../store/modelStore';
import ModelSelector from '../components/ModelSelector';
import ImageModelGalleryPanel from '../components/imageVideo/ImageModelGalleryPanel';
import { useImageVideoModelGalleryActions } from '../store/imageVideoModelGalleryStore';
import { SparklesIcon, AlertTriangleIcon, ArrowLeftIcon, TerminalIcon } from '../components/Icons';
import { LoadingSpinner } from '../components/LoadingSpinner';
import AspectRatioSelector from '../components/AspectRatioSelector';
import useLocalStorage from '../hooks/use-local-storage';
import { Header } from '../components/Header';

const SUPPORTED_ASPECT_RATIOS = ["1:1", "3:4", "4:3", "9:16", "16:9"];

const ImageGenerationPage: React.FC = () => {
    const { session, actions: { handleBackToDashboard, navigateToSettings, navigateToGenerations, signOut } } = useAppStore();
    const { models } = useModelStore();
    const { openModelGallery } = useImageVideoModelGalleryActions();
    const [preferredImageModels] = useLocalStorage<string[]>('preferred-image-models', []);
    const { 
        prompt, setPrompt, negativePrompt, setNegativePrompt, modelId, setModelId, 
        numberOfImages, setNumberOfImages, generatedImages, isLoading, error, 
        activeImageIndex, setActiveImageIndex, generate, 
        aspectRatio, setAspectRatio, cfgScale, setCfgScale, preGenerationText,
        panelWidth, handleMouseDown, isPanelOpen, setIsPanelOpen, canUndo, canRedo, undo, redo
    } = useImageGenerationStore();
    
    const t2iModels = useMemo(() => {
        // First filter by t2i tag
        const allT2iModels = models.filter(m => m.tags?.includes('t2i'));
        
        // If user has preferred image models set, filter to show only those
        if (preferredImageModels.length > 0) {
            const preferredT2iModels = allT2iModels.filter(m => preferredImageModels.includes(m.id));
            // If preferred models exist, return them, otherwise fall back to all accessible t2i models
            return preferredT2iModels.length > 0 ? preferredT2iModels : allT2iModels.filter(m => m.is_accessible);
        }
        
        // No preferences set, show all accessible t2i models
        return allT2iModels.filter(m => m.is_accessible);
    }, [models, preferredImageModels]);

    const modelInfo = useMemo(() => models.find(m => m.id === modelId), [modelId, models]);

    const showOverlay = isLoading || (error && !isLoading) || (preGenerationText && (!generatedImages || generatedImages.length === 0));

    return (
        <>
            <ImageModelGalleryPanel />
            <div className="h-screen w-full bg-[var(--nb-bg)] text-[var(--nb-text)] flex flex-col animate-fade-in">
            <header className="flex-shrink-0 p-4 flex items-center justify-between border-b border-[var(--nb-border)]">
                <button onClick={handleBackToDashboard} className="flex items-center gap-2 text-[var(--nb-text)] hover:opacity-80 transition-opacity">
                    <ArrowLeftIcon />
                    <span className="font-semibold">Back</span>
                </button>
                <h1 className="text-xl font-bold">Image Generation</h1>
                <button onClick={() => setIsPanelOpen(!isPanelOpen)} className="md:hidden p-2 text-[var(--nb-text)] hover:opacity-80">
                    <span className="material-symbols-outlined">tune</span>
                </button>
            </header>

            <main className="flex-grow flex flex-col md:flex-row overflow-hidden">
                {/* DESKTOP: Resizable Panel Layout */}
                <aside 
                    className="hidden md:flex w-auto p-4 md:p-6 border-b md:border-b-0 md:border-r border-[var(--nb-border)] overflow-y-auto md:flex-shrink-0 h-full"
                    style={{ width: `${panelWidth}px` }}
                >
                    <div className="space-y-6">
                        <div className="step-card">
                            <h3 className="step-title"><span className="step-number">1</span> Select Model</h3>
                            <ModelSelector
                                models={t2iModels}
                                selectedModel={modelId}
                                onSelectModel={setModelId}
                                showAllModels={true}
                                maxModels={10}
                                onOpenGallery={openModelGallery}
                                modelType="image"
                            />
                        </div>
                        <div className="step-card">
                            <h3 className="step-title"><span className="step-number">2</span> Describe Your Image</h3>
                            <div>
                                <label htmlFor="prompt" className="font-semibold text-sm opacity-90">Prompt</label>
                                <textarea id="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} className="neo-textarea mt-1" rows={5} placeholder="A photorealistic image of..." />
                            </div>
                            {modelInfo?.supports.negativePrompt && (
                                <div className="animate-fade-in mt-4">
                                    <label htmlFor="negative-prompt" className="font-semibold text-sm opacity-90">Negative Prompt (Optional)</label>
                                    <textarea id="negative-prompt" value={negativePrompt} onChange={e => setNegativePrompt(e.target.value)} className="neo-textarea mt-1" rows={3} placeholder="blurry, low quality, text..." />
                                </div>
                            )}
                        </div>
                        <div className="step-card">
                            <h3 className="step-title"><span className="step-number">3</span> Adjust Settings</h3>
                            <div className="space-y-4">
                                <AspectRatioSelector
                                    value={aspectRatio}
                                    onChange={setAspectRatio}
                                    ratios={SUPPORTED_ASPECT_RATIOS}
                                />
                                {modelInfo?.supports.cfgScale && (
                                    <div className="animate-fade-in">
                                        <label htmlFor="cfg-slider" className="font-semibold text-sm opacity-90 flex justify-between">
                                            <span>CFG Scale</span>
                                            <span>{cfgScale.toFixed(1)}</span>
                                        </label>
                                        <input 
                                            id="cfg-slider"
                                            type="range" 
                                            min="1" 
                                            max="20" 
                                            step="0.5"
                                            value={cfgScale}
                                            onChange={e => setCfgScale(Number(e.target.value))}
                                            className="w-full mt-1"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="step-card">
                            <h3 className="step-title"><span className="step-number">4</span> Generate</h3>
                            <button onClick={() => generate(session?.user?.id)} disabled={isLoading || !prompt} className="w-full neo-button neo-button-primary">
                                <SparklesIcon /> {isLoading ? 'Generating...' : 'Generate'}
                            </button>
                        </div>
                    </div>
                </aside>
                
                <div 
                    onMouseDown={handleMouseDown}
                    className="hidden md:flex w-1.5 h-full cursor-col-resize flex-shrink-0 items-center justify-center group bg-[var(--nb-bg)]"
                >
                    <div className="w-0.5 h-16 bg-[var(--nb-border)] rounded-full group-hover:bg-[var(--nb-primary)] transition-colors" />
                </div>

                {/* MOBILE & DESKTOP: Preview Area */}
                <div className="flex-grow bg-black flex items-center justify-center p-4 relative overflow-hidden">
                    {/* Header overlay */}
                    <div className="absolute top-0 left-0 right-0 z-30 pointer-events-auto">
                        <Header
                            theme="dark"
                            toggleTheme={() => {}}
                            onTogglePanel={() => setIsPanelOpen(!isPanelOpen)}
                            canUndo={canUndo}
                            handleUndo={undo}
                            canRedo={canRedo}
                            handleRedo={redo}
                            isDownloading={false}
                            handlePrimaryDownload={() => {
                                if (generatedImages && generatedImages[activeImageIndex]) {
                                    const link = document.createElement('a');
                                    link.href = generatedImages[activeImageIndex];
                                    link.download = `generated-image-${Date.now()}.png`;
                                    link.click();
                                }
                            }}
                            hasGeneratedContent={!!generatedImages && generatedImages.length > 0}
                            handleSignOut={signOut}
                            onNavigateBack={handleBackToDashboard}
                            onNavigateToSettings={navigateToSettings}
                            onNavigateToGenerations={navigateToGenerations}
                        />
                    </div>

                    {showOverlay && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20 p-4">
                            {isLoading ? (
                                <LoadingSpinner message={preGenerationText || "Generating..."} />
                            ) : error ? (
                                <div className="error-card">
                                    <AlertTriangleIcon />
                                    <p className="font-semibold">An Error Occurred</p>
                                    <p className="text-sm mt-1">{error}</p>
                                </div>
                            ) : preGenerationText && (!generatedImages || generatedImages.length === 0) ? (
                                <div className="neo-card max-w-lg p-6 text-left bg-[var(--nb-surface)] text-[var(--nb-text)]">
                                    <h3 className="font-bold mb-2 flex items-center gap-2">
                                        <TerminalIcon/> Model Response
                                    </h3>
                                    <p className="text-sm whitespace-pre-wrap">{preGenerationText}</p>
                                </div>
                            ) : null}
                        </div>
                    )}
                    
                    {!isLoading && !error && generatedImages && generatedImages.length > 0 ? (
                        <img 
                            src={generatedImages[activeImageIndex]} 
                            alt="Generated content"
                            className="max-w-full max-h-full object-contain rounded-md"
                        />
                    ) : !showOverlay ? (
                        <div className="text-center text-white/50">
                             <span className="material-symbols-outlined text-6xl">auto_awesome</span>
                            <p className="font-semibold mt-2">Your image will appear here.</p>
                        </div>
                    ) : null}
                </div>
            </main>

            {/* MOBILE: Panel backdrop */}
            {isPanelOpen && (
                <div 
                    className="panel-backdrop md:hidden"
                    onClick={() => setIsPanelOpen(false)}
                />
            )}

            {/* MOBILE: Slide-out Control Panel */}
            <aside className={`slide-out-panel md:hidden !max-w-md ${isPanelOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-full bg-[var(--nb-surface)] flex flex-col shadow-lg">
                    <div className="flex-shrink-0 p-4 flex items-center justify-between border-b border-[var(--nb-border)]">
                        <button onClick={handleBackToDashboard} className="flex items-center gap-2 text-[var(--nb-text)] hover:opacity-80 transition-opacity">
                            <ArrowLeftIcon />
                            <span className="font-semibold">Back</span>
                        </button>
                        <h1 className="text-xl font-bold">Controls</h1>
                        <button onClick={() => setIsPanelOpen(false)} className="p-2 text-[var(--nb-text)] hover:opacity-80">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto p-4">
                        <div className="space-y-6">
                            <div className="step-card">
                                <h3 className="step-title"><span className="step-number">1</span> Select Model</h3>
                                <ModelSelector
                                    models={t2iModels}
                                    selectedModel={modelId}
                                    onSelectModel={setModelId}
                                    showAllModels={true}
                                    maxModels={10}
                                    onOpenGallery={openModelGallery}
                                    modelType="image"
                                />
                            </div>
                            <div className="step-card">
                                <h3 className="step-title"><span className="step-number">2</span> Describe Your Image</h3>
                                <div>
                                    <label htmlFor="prompt-mobile" className="font-semibold text-sm opacity-90">Prompt</label>
                                    <textarea id="prompt-mobile" value={prompt} onChange={e => setPrompt(e.target.value)} className="neo-textarea mt-1" rows={5} placeholder="A photorealistic image of..." />
                                </div>
                                {modelInfo?.supports.negativePrompt && (
                                    <div className="animate-fade-in mt-4">
                                        <label htmlFor="negative-prompt-mobile" className="font-semibold text-sm opacity-90">Negative Prompt (Optional)</label>
                                        <textarea id="negative-prompt-mobile" value={negativePrompt} onChange={e => setNegativePrompt(e.target.value)} className="neo-textarea mt-1" rows={3} placeholder="blurry, low quality, text..." />
                                    </div>
                                )}
                            </div>
                            <div className="step-card">
                                <h3 className="step-title"><span className="step-number">3</span> Adjust Settings</h3>
                                <div className="space-y-4">
                                    <AspectRatioSelector
                                        value={aspectRatio}
                                        onChange={setAspectRatio}
                                        ratios={SUPPORTED_ASPECT_RATIOS}
                                    />
                                    {modelInfo?.supports.cfgScale && (
                                        <div className="animate-fade-in">
                                            <label htmlFor="cfg-slider-mobile" className="font-semibold text-sm opacity-90 flex justify-between">
                                                <span>CFG Scale</span>
                                                <span>{cfgScale.toFixed(1)}</span>
                                            </label>
                                            <input 
                                                id="cfg-slider-mobile"
                                                type="range" 
                                                min="1" 
                                                max="20" 
                                                step="0.5"
                                                value={cfgScale}
                                                onChange={e => setCfgScale(Number(e.target.value))}
                                                className="w-full mt-1"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="step-card">
                                <h3 className="step-title"><span className="step-number">4</span> Generate</h3>
                                <button onClick={() => generate(session?.user?.id)} disabled={isLoading || !prompt} className="w-full neo-button neo-button-primary">
                                    <SparklesIcon /> {isLoading ? 'Generating...' : 'Generate'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    </>
    );
};

export default ImageGenerationPage;