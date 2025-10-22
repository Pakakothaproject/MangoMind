import React, { useEffect, useRef } from 'react';
import { useMarketingStore, initMarketingStore } from '../store/marketingStore';
import { useAppStore } from '../store/appStore';
import { Header } from '../components/Header';
import { MarketingMode } from '../components/MarketingMode';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AlertTriangleIcon, ExpandIcon, ImageIcon, ArrowLeftIcon, XIcon, SparklesIcon, MegaphoneIcon } from '../components/Icons';
import { ExpandedImageModal } from '../components/ExpandedImageModal';
import { DEFAULT_IMAGE_EDIT_MODEL } from '../constants/models';
import { ImageChatInput } from '../components/ImageChatInput';
import { StreamingTextOverlay } from '../components/StreamingTextOverlay';
import { PresetPanel } from '../components/PresetPanel';
import { marketingPresets } from '../constants/marketingPresets';
import { fetchImageAsUploadedImage } from '../utils/image';

const MarketingPanelContent: React.FC = () => {
    const store = useMarketingStore();

    const {
        prompt, setPrompt, overlayText, setOverlayText, referenceImage, setReferenceImage,
        productImage, setProductImage, handleGenerate, loadingMessage,
        numberOfImages, setNumberOfImages, adGenModelId, setAdGenModelId,
        setActivePresetPanel,
        aspectRatio, setAspectRatio,
    } = store;

    return (
        <aside className="h-full bg-[var(--nb-surface)] flex flex-col shadow-lg w-full">
            <header className="flex-shrink-0 p-4 flex items-center justify-between border-b border-[var(--nb-border)]">
                 <button onClick={store.onNavigateBack} className="hidden lg:flex items-center gap-2 text-[var(--nb-text)] hover:opacity-80 transition-opacity">
                    <ArrowLeftIcon />
                    <span className="font-semibold">Back</span>
                </button>
                <h1 className="text-xl font-bold text-[var(--nb-text)] flex items-center gap-3 lg:mx-auto">
                    <MegaphoneIcon />
                    Content Generation
                </h1>
                <div className="hidden lg:flex w-20"></div> {/* Spacer for desktop */}
            </header>
            <div className="p-4 border-b border-[var(--nb-border)]">
                 <button onClick={store.onNavigateToGenerator} className="w-full neo-button neo-button-secondary flex items-center justify-center gap-2">
                    <SparklesIcon />
                    <span>Generate New Image</span>
                </button>
            </div>
            <div className="flex-grow p-4 space-y-6 overflow-y-auto">
                <MarketingMode
                    prompt={prompt}
                    setPrompt={setPrompt}
                    overlayText={overlayText}
                    setOverlayText={setOverlayText}
                    referenceImage={referenceImage}
                    setReferenceImage={setReferenceImage}
                    productImage={productImage}
                    setProductImage={setProductImage}
                    handleMarketingGenerate={handleGenerate}
                    loadingMessage={loadingMessage}
                    numberOfImages={numberOfImages}
                    setNumberOfImages={setNumberOfImages}
                    adGenModelId={adGenModelId}
                    setAdGenModelId={setAdGenModelId}
                    setActivePresetPanel={setActivePresetPanel}
                    aspectRatio={aspectRatio}
                    setAspectRatio={setAspectRatio}
                />
            </div>
        </aside>
    );
};

const MarketingPage: React.FC = () => {
    const {
        session,
        initialMarketingImage,
        actions: appActions,
    } = useAppStore();

    useEffect(() => {
        const imageEditModel = localStorage.getItem('gemini-image-edit-model') || DEFAULT_IMAGE_EDIT_MODEL;

        if (session) {
            initMarketingStore({
                session,
                productImage: initialMarketingImage,
                onNavigateBack: appActions.handleBackToDashboard,
                onNavigateToGenerator: appActions.navigateToGenerator,
                onNavigateToSettings: appActions.navigateToSettings,
                onNavigateToGenerations: appActions.navigateToGenerations,
                handleSignOut: appActions.signOut,
                imageEditModel,
            });
        }
    }, [session, initialMarketingImage, appActions]);
    
    // Select state from the dedicated marketing store
    const {
        panelWidth, handleMouseDown, theme, toggleTheme,
        canUndo, handleUndo, canRedo, handleRedo, isDownloading, handleDownload: handlePrimaryDownload,
        generatedImages, activeImageIndex,
        isExpanded, setIsExpanded,
        loadingMessage, error,
        editPrompt, setEditPrompt, handleEditImage, onTextUpdate,
        streamingText, isStreamingFinal,
        isSelectingPoint, toggleIsSelectingPoint, selectedPoint, clearSelectedPoint,
        activePresetPanel, setActivePresetPanel, setPrompt, setReferenceImage
    } = useMarketingStore();

    const handleAdsPresetSelect = async (preset: { name: string; prompt: string; imageUrl: string }) => {
        setPrompt(preset.prompt);
        try {
            const image = await fetchImageAsUploadedImage(preset.imageUrl);
            setReferenceImage(image);
        } catch (e) {
            console.error("Failed to load preset image as reference", e);
            useMarketingStore.setState({ error: "Failed to load preset image." });
        }
        setActivePresetPanel(null);
    };

    const currentGeneratedImage = generatedImages?.[activeImageIndex] ?? null;

    return (
        <div className="h-screen w-full font-sans bg-[var(--nb-bg)] flex overflow-hidden">
            <div className="hidden lg:flex h-full flex-shrink-0" style={{ width: `${panelWidth}px` }}>
                <MarketingPanelContent />
            </div>
            <div 
                onMouseDown={handleMouseDown}
                className="hidden lg:flex w-1.5 h-full cursor-col-resize flex-shrink-0 items-center justify-center group"
            >
                <div className="w-0.5 h-16 bg-[var(--nb-border)] rounded-full group-hover:bg-[var(--nb-primary)] transition-colors" />
            </div>

            <main className="flex-1 flex flex-col min-w-0 bg-[var(--nb-bg)] relative">
                <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
                    <Header
                        theme={theme}
                        toggleTheme={toggleTheme}
                        onTogglePanel={() => {}} // Mobile only, not implemented here
                        canUndo={canUndo}
                        handleUndo={handleUndo}
                        canRedo={canRedo}
                        handleRedo={handleRedo}
                        isDownloading={isDownloading}
                        handlePrimaryDownload={handlePrimaryDownload}
                        hasGeneratedContent={!!currentGeneratedImage}
                        handleSignOut={appActions.signOut}
                        onNavigateToSettings={appActions.navigateToSettings}
                        onNavigateToGenerations={appActions.navigateToGenerations}
                        onNavigateBack={appActions.handleBackToDashboard}
                    />
                </div>
                 <div className="relative w-full h-full flex flex-col items-center justify-center p-2 pt-20 lg:pt-8 md:p-8">
                     {(loadingMessage || (error && !loadingMessage)) && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20 p-4">
                            {loadingMessage ? (
                                <LoadingSpinner message={loadingMessage} />
                            ) : error ? (
                                <div className="error-card">
                                    <AlertTriangleIcon />
                                    <p className="font-semibold">An Error Occurred</p>
                                    <p className="text-sm mt-1">{error}</p>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {!loadingMessage && !error && currentGeneratedImage ? (
                        <img src={currentGeneratedImage} alt="Generated ad content" className="max-w-full max-h-full object-contain rounded-md" />
                    ) : (
                         <div className="text-center text-[var(--nb-text-secondary)]">
                            <MegaphoneIcon />
                            <p className="font-semibold text-lg text-[var(--nb-text)] mt-2">Your ad campaign will appear here</p>
                        </div>
                    )}

                    <StreamingTextOverlay
                        streamingText={streamingText}
                        isStreamingFinal={isStreamingFinal}
                        onClose={() => onTextUpdate('', true)}
                    />
                </div>
                
                 {currentGeneratedImage && (
                    <ImageChatInput
                        value={editPrompt}
                        onChange={setEditPrompt}
                        onSend={handleEditImage}
                        isLoading={!!loadingMessage}
                        placeholder="Describe an edit..."
                        isSelectingPoint={isSelectingPoint}
                        onToggleSelectPoint={toggleIsSelectingPoint}
                        selectedPoint={selectedPoint}
                        onClearPoint={clearSelectedPoint}
                    />
                )}
            </main>
             <ExpandedImageModal
                isOpen={isExpanded}
                onClose={() => setIsExpanded(false)}
                generatedImage={currentGeneratedImage}
                brightness={100}
                contrast={100}
                grainIntensity={0}
                bubbles={[]}
                isWatermarkEnabled={false}
                bubbleImageUrl=""
                watermarkUrl=""
            />
            {activePresetPanel === 'ads' && (
                 <PresetPanel
                    isOpen={true}
                    onClose={() => setActivePresetPanel(null)}
                    title="Prompt Ideas"
                    categories={marketingPresets}
                    onSelect={handleAdsPresetSelect}
                />
            )}
        </div>
    );
};

export default MarketingPage;