import React from 'react';
import { useAppStore } from '../store/appStore';
import { useDressMeStore } from '../store/dressMeStore';
import { ImageUploader } from '../components/ImageUploader';
import { TabButton } from '../components/TabButton';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AlertTriangleIcon, ArrowLeftIcon, SparklesIcon } from '../components/Icons';
import { DEFAULT_TEXT_GEN_MODEL, DEFAULT_IMAGE_GEN_MODEL } from '../constants/models';
import { Header } from '../components/Header';

const DressMePage: React.FC = () => {
    const { actions: { handleBackToDashboard, navigateToSettings, navigateToGenerations, signOut } } = useAppStore();
    const { 
        gender, setGender, modelImage, setModelImage, generatedImages,
        isLoading, loadingMessage, error, activeImageIndex, setActiveImageIndex,
        handleGenerate, numberOfImages, setNumberOfImages, isPanelOpen, setIsPanelOpen
    } = useDressMeStore();
    
    const textGenModel = localStorage.getItem('gemini-text-gen-model') || DEFAULT_TEXT_GEN_MODEL;
    const imageGenModel = localStorage.getItem('gemini-image-gen-model') || DEFAULT_IMAGE_GEN_MODEL;

    const handlePrev = () => {
        if (generatedImages) {
            setActiveImageIndex((activeImageIndex - 1 + generatedImages.length) % generatedImages.length);
        }
    };
    
    const handleNext = () => {
        if (generatedImages) {
            setActiveImageIndex((activeImageIndex + 1) % generatedImages.length);
        }
    };


    return (
        <div className="h-screen w-full bg-[var(--nb-bg)] text-[var(--nb-text)] flex flex-col animate-fade-in">
            <header className="flex-shrink-0 p-4 flex items-center justify-between border-b border-[var(--nb-border)]">
                <button onClick={handleBackToDashboard} className="flex items-center gap-2 text-[var(--nb-text)] hover:opacity-80 transition-opacity">
                    <ArrowLeftIcon />
                    <span className="font-semibold">Back</span>
                </button>
                <h1 className="text-xl font-bold">Style Me</h1>
                <button onClick={() => setIsPanelOpen(!isPanelOpen)} className="md:hidden p-2 text-[var(--nb-text)] hover:opacity-80">
                    <span className="material-symbols-outlined">tune</span>
                </button>
            </header>

            <main className="flex-grow flex flex-col md:flex-row overflow-hidden">
                {/* DESKTOP: Fixed Panel Layout */}
                <aside className="hidden md:flex w-96 p-4 md:p-6 border-b md:border-b-0 md:border-r border-[var(--nb-border)] overflow-y-auto">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h3 className="font-bold">1. Upload your photo</h3>
                            <ImageUploader image={modelImage} onImageUpload={setModelImage} aspectRatioClass="aspect-square" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold">2. Select a style set</h3>
                            <div className="neo-tab-container">
                                <TabButton label="Female" isActive={gender === 'female'} onClick={() => setGender('female')} />
                                <TabButton label="Male" isActive={gender === 'male'} onClick={() => setGender('male')} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold">3. Choose number of styles</h3>
                             <div className="space-y-2">
                                <label htmlFor="styles-slider" className="font-semibold text-sm opacity-90 flex justify-between">
                                    <span>Number of Images</span>
                                    <span>{numberOfImages}</span>
                                </label>
                                <input
                                    id="styles-slider"
                                    type="range"
                                    min="1"
                                    max="5"
                                    step="1"
                                    value={numberOfImages}
                                    onChange={(e) => setNumberOfImages(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                                    className="w-full mt-1"
                                />
                            </div>
                        </div>
                        <div className="pt-4 border-t border-[var(--nb-border)]">
                            <button
                                onClick={() => handleGenerate(textGenModel, imageGenModel)}
                                disabled={!modelImage || isLoading}
                                className="w-full neo-button neo-button-primary"
                            >
                                <SparklesIcon /> {isLoading ? 'Generating...' : 'Generate Styles'}
                            </button>
                        </div>
                    </div>
                </aside>

                <div className="relative flex-grow h-full">
                    {/* MOBILE: Slide-out Panel (hidden on desktop) */}
                    <div className="md:hidden">
                        <aside className={`slide-out-panel !max-w-md ${isPanelOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
                                        <div className="space-y-2">
                                            <h3 className="font-bold">1. Upload your photo</h3>
                                            <ImageUploader image={modelImage} onImageUpload={setModelImage} aspectRatioClass="aspect-square" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="font-bold">2. Select a style set</h3>
                                            <div className="neo-tab-container">
                                                <TabButton label="Female" isActive={gender === 'female'} onClick={() => setGender('female')} />
                                                <TabButton label="Male" isActive={gender === 'male'} onClick={() => setGender('male')} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="font-bold">3. Choose number of styles</h3>
                                             <div className="space-y-2">
                                                <label htmlFor="styles-slider-mobile" className="font-semibold text-sm opacity-90 flex justify-between">
                                                    <span>Number of Images</span>
                                                    <span>{numberOfImages}</span>
                                                </label>
                                                <input
                                                    id="styles-slider-mobile"
                                                    type="range"
                                                    min="1"
                                                    max="5"
                                                    step="1"
                                                    value={numberOfImages}
                                                    onChange={(e) => setNumberOfImages(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                                                    className="w-full mt-1"
                                                />
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-[var(--nb-border)]">
                                            <button
                                                onClick={() => handleGenerate(textGenModel, imageGenModel)}
                                                disabled={!modelImage || isLoading}
                                                className="w-full neo-button neo-button-primary"
                                            >
                                                <SparklesIcon /> {isLoading ? 'Generating...' : 'Generate Styles'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>

                    <div className="flex-grow bg-black flex items-center justify-center p-4 relative">
                        {/* Header overlay */}
                        <div className="absolute top-0 left-0 right-0 z-30 pointer-events-auto">
                            <Header
                                theme="dark"
                                toggleTheme={() => {}}
                                onTogglePanel={() => setIsPanelOpen(!isPanelOpen)}
                                canUndo={false}
                                handleUndo={() => {}}
                                canRedo={false}
                                handleRedo={() => {}}
                                isDownloading={false}
                                handlePrimaryDownload={() => {
                                    if (generatedImages && generatedImages[activeImageIndex]) {
                                        const link = document.createElement('a');
                                        link.href = generatedImages[activeImageIndex];
                                        link.download = `styled-image-${Date.now()}.png`;
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

                        {(isLoading || (error && !isLoading)) && (
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20 p-4">
                                {isLoading ? (
                                    <LoadingSpinner message={loadingMessage || "Styling..."} />
                                ) : error ? (
                                    <div className="error-card">
                                        <AlertTriangleIcon />
                                        <p className="font-semibold">An Error Occurred</p>
                                        <p className="text-sm mt-1">{error}</p>
                                    </div>
                                ) : null}
                            </div>
                        )}
                        
                        {generatedImages && generatedImages.length > 0 ? (
                            <>
                                 {generatedImages.map((imgSrc, index) => (
                                    <img 
                                        key={index}
                                        src={imgSrc} 
                                        alt={`Styled result ${index + 1}`}
                                        className={`max-w-full max-h-full object-contain rounded-md absolute inset-0 m-auto transition-opacity duration-300 ease-in-out ${index === activeImageIndex ? 'opacity-100' : 'opacity-0'}`}
                                    />
                                 ))}
                                 {generatedImages.length > 1 && (
                                    <>
                                        <button onClick={handlePrev} className="absolute left-2 top-1/2 -translate-y-1/2 z-30 neo-button neo-icon-button neo-button-secondary !text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm" aria-label="Previous image">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                        </button>
                                        <button onClick={handleNext} className="absolute right-2 top-1/2 -translate-y-1/2 z-30 neo-button neo-icon-button neo-button-secondary !text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm" aria-label="Next image">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                        </button>
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2 p-1 bg-black/40 rounded-full backdrop-blur-sm">
                                            {generatedImages.map((_, index) => (
                                                <button key={index} onClick={() => setActiveImageIndex(index)} className={`w-2 h-2 rounded-full transition-colors ${index === activeImageIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/75'}`} aria-label={`Go to image ${index + 1}`}></button>
                                            ))}
                                        </div>
                                    </>
                                 )}
                            </>
                        ) : (
                            <div className="text-center text-white/50">
                                 <span className="material-symbols-outlined text-6xl">face_retouching_natural</span>
                                <p className="font-semibold mt-2">Your styled image will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* MOBILE: Panel backdrop */}
            {isPanelOpen && (
                <div 
                    className="panel-backdrop md:hidden"
                    onClick={() => setIsPanelOpen(false)}
                />
            )}
        </div>
    );
};

export default DressMePage;