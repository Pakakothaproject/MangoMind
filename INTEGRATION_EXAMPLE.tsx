// INTEGRATION EXAMPLE: How to add resource checks to ImageGenerationPage.tsx
// This shows the exact changes needed to integrate the resource management system

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

// ✅ STEP 1: Import the hook and modal
import { useResourceCheck } from '../hooks/useResourceCheck';
import InsufficientResourceModal from '../components/InsufficientResourceModal';

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
    
    // ✅ STEP 2: Initialize the resource check hook
    const {
        checkImageGeneration,
        showInsufficientModal,
        insufficientType,
        operationType,
        resourceData,
        closeModal,
    } = useResourceCheck();
    
    const t2iModels = useMemo(() => {
        const allT2iModels = models.filter(m => m.tags?.includes('t2i'));
        
        if (preferredImageModels.length > 0) {
            const preferredT2iModels = allT2iModels.filter(m => preferredImageModels.includes(m.id));
            return preferredT2iModels.length > 0 ? preferredT2iModels : allT2iModels.filter(m => m.is_accessible);
        }
        
        return allT2iModels.filter(m => m.is_accessible);
    }, [models, preferredImageModels]);

    const modelInfo = useMemo(() => models.find(m => m.id === modelId), [modelId, models]);

    const showOverlay = isLoading || (error && !isLoading) || (preGenerationText && (!generatedImages || generatedImages.length === 0));

    // ✅ STEP 3: Create a wrapper function that checks resources before generating
    const handleGenerateWithCheck = async () => {
        // Estimate tokens based on number of images (adjust as needed)
        const estimatedTokens = numberOfImages * 100;
        
        // Check if user has sufficient resources
        const canProceed = await checkImageGeneration(estimatedTokens);
        
        if (!canProceed) {
            // Modal will be shown automatically by the hook
            return;
        }
        
        // If resources are sufficient, proceed with generation
        generate(session?.user?.id);
    };

    return (
        <>
            <ImageModelGalleryPanel />
            <div className="h-screen w-full flex flex-col bg-[var(--nb-bg)]">
                <Header
                    title="Image Generator"
                    subtitle="Create stunning images with AI"
                    icon={<SparklesIcon />}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    handleUndo={undo}
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

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel - Controls */}
                    <div className="w-80 bg-[var(--nb-surface-alt)] border-r border-[var(--nb-border)] overflow-y-auto p-4 space-y-4">
                        <div className="step-card">
                            <h3 className="step-title"><span className="step-number">1</span> Model</h3>
                            <ModelSelector
                                models={t2iModels}
                                selectedModelId={modelId}
                                onModelChange={setModelId}
                                onOpenGallery={() => openModelGallery('image')}
                            />
                        </div>

                        <div className="step-card">
                            <h3 className="step-title"><span className="step-number">2</span> Prompt</h3>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe the image you want to create..."
                                className="neo-input min-h-[100px]"
                            />
                        </div>

                        <div className="step-card">
                            <h3 className="step-title"><span className="step-number">3</span> Settings</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-semibold">Aspect Ratio</label>
                                    <AspectRatioSelector
                                        aspectRatio={aspectRatio}
                                        setAspectRatio={setAspectRatio}
                                        supportedRatios={SUPPORTED_ASPECT_RATIOS}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold">Number of Images</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="4"
                                        value={numberOfImages}
                                        onChange={(e) => setNumberOfImages(parseInt(e.target.value))}
                                        className="neo-input"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="step-card">
                            <h3 className="step-title"><span className="step-number">4</span> Generate</h3>
                            {/* ✅ STEP 4: Replace the generate button to use the wrapper function */}
                            <button 
                                onClick={handleGenerateWithCheck} 
                                disabled={isLoading || !prompt} 
                                className="w-full neo-button neo-button-primary"
                            >
                                <SparklesIcon /> {isLoading ? 'Generating...' : 'Generate'}
                            </button>
                        </div>
                    </div>

                    {/* Right Panel - Preview */}
                    <div className="flex-1 flex items-center justify-center p-8 relative">
                        {showOverlay && (
                            <div className="absolute inset-0 flex items-center justify-center bg-[var(--nb-bg)] z-10">
                                {isLoading ? (
                                    <LoadingSpinner />
                                ) : error ? (
                                    <div className="neo-card max-w-lg p-6 text-center bg-red-500/10 border-red-500/20 text-red-500">
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
                        ) : null}
                    </div>
                </div>
            </div>

            {/* ✅ STEP 5: Add the InsufficientResourceModal component */}
            {showInsufficientModal && (
                <InsufficientResourceModal
                    type={insufficientType}
                    operationType={operationType}
                    onClose={closeModal}
                    tokensNeeded={resourceData?.tokensNeeded}
                    currentTokens={resourceData?.currentTokens}
                    storageNeeded={resourceData?.storageNeeded}
                    currentStorage={resourceData?.currentStorage}
                    storageLimit={resourceData?.storageLimit}
                />
            )}
        </>
    );
};

export default ImageGenerationPage;

/* 
===========================================
SUMMARY OF CHANGES NEEDED:
===========================================

1. Import useResourceCheck hook and InsufficientResourceModal component
2. Initialize the hook with destructured values
3. Create handleGenerateWithCheck wrapper function
4. Replace onClick={generate} with onClick={handleGenerateWithCheck}
5. Add the modal component at the bottom of JSX

That's it! Only 5 simple steps to add full resource checking.

===========================================
FOR VIDEO GENERATION PAGE:
===========================================

Same steps, but use:
- checkVideoGeneration() instead of checkImageGeneration()
- Estimate higher tokens (e.g., 500 instead of 100)

===========================================
FOR CHAT/OTHER FEATURES:
===========================================

Use checkTokens(amount) for token-only checks
Use checkStorage(bytes, 'general') for storage-only checks
*/
