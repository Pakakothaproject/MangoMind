import React, { useState, useMemo, useRef, useEffect } from 'react';
import { usePlaygroundStore } from '../../store/playgroundStore';
import { useStudioStore } from '../../store/studioStore';
import { useMarketingStore } from '../../store/marketingStore';
import { useAppStore } from '../../store/appStore';
import { UndoIcon, RedoIcon, DownloadIcon, AlertTriangleIcon, CrosshairIcon, XIcon, MegaphoneIcon, FilmIcon, RefreshCcwIcon } from '../Icons';
import { LoadingSpinner } from '../LoadingSpinner';
// FIX: 'UploadedImage' is a type and should be imported from the types file, not the utils file.
import { dataUrlToUploadedImage } from '../../utils/image';
import type { UploadedImage } from '../../types';

const NextStepsActions: React.FC<{ generatedImage: string | null }> = ({ generatedImage }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    
    // Get actions from the appropriate stores
    const { navigateToMarketing, navigateToVideoGen } = useAppStore(s => s.actions);
    const { handleModelImageUpload } = useStudioStore();
    const { setActiveMode } = usePlaygroundStore();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAction = (action: (img: UploadedImage) => void) => {
        if (!generatedImage) return;
        const uploadedImage = dataUrlToUploadedImage(generatedImage);
        if (uploadedImage) {
            action(uploadedImage);
        }
        setIsOpen(false);
    };

    const handleUseAsModelClick = () => {
        if (!generatedImage) return;
        const uploadedImage = dataUrlToUploadedImage(generatedImage);
        if (uploadedImage) {
            handleModelImageUpload(uploadedImage); // This resets the studio state with the new image
            setActiveMode('tryon'); // Switch the playground mode
        }
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(p => !p)} disabled={!generatedImage} className="neo-button neo-button-secondary text-sm">+ Next Step</button>
            {isOpen && (
                <div className="dropdown-menu-content absolute top-full right-0 mt-2">
                    <button onClick={handleUseAsModelClick} className="dropdown-menu-item"><RefreshCcwIcon /> Use as New Model</button>
                    <button onClick={() => handleAction(navigateToMarketing as (img: UploadedImage) => void)} className="dropdown-menu-item"><MegaphoneIcon /> Create Ad Campaign</button>
                    <button onClick={() => handleAction(navigateToVideoGen)} className="dropdown-menu-item"><FilmIcon /> Animate Image</button>
                </div>
            )}
        </div>
    );
};

const ViewerActions: React.FC = () => {
    const { activeMode } = usePlaygroundStore();
    const { canUndo: studioCanUndo, handleUndo: studioUndo, canRedo: studioCanRedo, handleRedo: studioRedo } = useStudioStore();
    const { canUndo: marketingCanUndo, handleUndo: marketingUndo, canRedo: marketingCanRedo, handleRedo: marketingRedo } = useMarketingStore();
    const { canUndo: playgroundCanUndo, undo: playgroundUndo, canRedo: playgroundCanRedo, redo: playgroundRedo } = usePlaygroundStore();

    const { canUndo, undo, canRedo, redo } = useMemo(() => {
        switch(activeMode) {
            case 'tryon': case 'scene': case 'hair': return { canUndo: studioCanUndo, undo: studioUndo, canRedo: studioCanRedo, redo: studioRedo };
            case 'ads': return { canUndo: marketingCanUndo, undo: marketingUndo, canRedo: marketingCanRedo, redo: marketingRedo };
            case 'generate': case 'combine': return { canUndo: playgroundCanUndo, undo: playgroundUndo, canRedo: playgroundCanRedo, redo: playgroundRedo };
            default: return { canUndo: false, undo: () => {}, canRedo: false, redo: () => {} };
        }
    }, [activeMode, studioCanUndo, studioUndo, studioCanRedo, studioRedo, marketingCanUndo, marketingUndo, marketingCanRedo, marketingRedo, playgroundCanUndo, playgroundUndo, playgroundCanRedo, playgroundRedo]);

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[var(--nb-surface)] p-1 rounded-full shadow-lg flex items-center gap-1 z-10">
            <button onClick={undo} disabled={!canUndo} className="p-2 rounded-full hover:bg-[var(--nb-surface-alt)] disabled:opacity-50 transition-colors"><UndoIcon /></button>
            <button onClick={redo} disabled={!canRedo} className="p-2 rounded-full hover:bg-[var(--nb-surface-alt)] disabled:opacity-50 transition-colors"><RedoIcon /></button>
        </div>
    );
};

const DownloadActions: React.FC<{ generatedImage: string | null }> = ({ generatedImage }) => {
    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = 'mangomind-creation.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="absolute top-4 right-6 flex items-center gap-2 z-10">
            <NextStepsActions generatedImage={generatedImage} />
            <button onClick={handleDownload} disabled={!generatedImage} className="neo-button neo-button-primary text-sm flex items-center gap-2">
                <DownloadIcon /> Download
            </button>
        </div>
    );
};

const ChatInputBar: React.FC<{
    generatedImage: string | null;
    action: (prompt: string) => void;
    isLoading: boolean;
    placeholder: string;
    isSelectingPoint: boolean;
    onToggleSelectPoint: () => void;
    selectedPoint: { x: number, y: number } | null;
    onClearPoint: () => void;
}> = ({ generatedImage, action, isLoading, placeholder, isSelectingPoint, onToggleSelectPoint, selectedPoint, onClearPoint }) => {
    const [prompt, setPrompt] = useState('');

    const handleSend = () => {
        if (prompt.trim() && !isLoading) {
            action(prompt.trim());
            setPrompt('');
        }
    };

    return (
        <div className="absolute bottom-6 left-6 right-6 z-10 space-y-2">
             {selectedPoint && (
                <div className="flex justify-center">
                    <div className="bg-blue-500/80 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2 animate-fade-in">
                        <span>Point Selected</span>
                        <button onClick={onClearPoint} className="bg-white/20 rounded-full w-4 h-4 flex items-center justify-center">
                            <XIcon className="w-3 h-3"/>
                        </button>
                    </div>
                </div>
            )}
            <div className="bg-[#2C2C2C] rounded-2xl p-2 flex items-center gap-2 shadow-2xl border border-[var(--nb-border)]">
                 <button 
                    onClick={onToggleSelectPoint}
                    disabled={!generatedImage}
                    title="Select Point on Image"
                    className={`p-2 rounded-full transition-colors disabled:opacity-50 ${isSelectingPoint ? 'bg-red-500/80 text-white' : 'text-[var(--nb-text-secondary)] hover:text-white'}`}
                >
                    <CrosshairIcon />
                </button>
                <input 
                    type="text" 
                    placeholder={placeholder} 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                    disabled={isLoading}
                    className="flex-1 bg-transparent outline-none px-2 text-white placeholder:text-[var(--nb-text-secondary)]"
                />
                <button className="p-2 text-[var(--nb-text-secondary)] hover:text-white"><span className="material-symbols-outlined">mic</span></button>
                <button className="p-2 text-[var(--nb-text-secondary)] hover:text-white"><span className="material-symbols-outlined">image</span></button>
                <button 
                    onClick={handleSend}
                    disabled={isLoading || !prompt.trim()}
                    className="w-10 h-10 bg-[#F8C644] rounded-full flex items-center justify-center text-black hover:bg-[#D6A32E] transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    <span className="material-symbols-outlined">arrow_upward</span>
                </button>
            </div>
        </div>
    );
};

const PlaygroundViewer: React.FC = () => {
    const { activeMode } = usePlaygroundStore();
    const studioState = useStudioStore();
    const marketingState = useMarketingStore();
    const playgroundState = usePlaygroundStore();

    const {
        generatedImage, isLoading, loadingMessage, error, stop, viewerAction,
        isSelectingPoint, setIsSelectingPoint, selectedPoint, setSelectedPoint
    } = useMemo(() => {
        switch (activeMode) {
            case 'tryon':
            case 'scene':
            case 'hair':
                return {
                    generatedImage: studioState.baseGeneratedImages?.[studioState.activeImageIndex] ?? null,
                    isLoading: !!studioState.loadingMessage,
                    loadingMessage: studioState.loadingMessage,
                    error: studioState.error,
                    stop: studioState.handleStopGeneration,
                    viewerAction: (prompt: string) => { 
                        studioState.setEditPrompt(prompt);
                        studioState.handleEditImage();
                    },
                    isSelectingPoint: studioState.isSelectingPoint,
                    setIsSelectingPoint: studioState.setIsSelectingPoint,
                    selectedPoint: studioState.selectedPoint,
                    setSelectedPoint: studioState.setSelectedPoint,
                };
            case 'ads':
                return {
                    generatedImage: marketingState.generatedImages?.[marketingState.activeImageIndex] ?? null,
                    isLoading: !!marketingState.loadingMessage,
                    loadingMessage: marketingState.loadingMessage,
                    error: marketingState.error,
                    stop: () => {}, // Marketing store does not have stopGeneration
                    viewerAction: (prompt: string) => {
                        marketingState.setEditPrompt(prompt);
                        marketingState.handleEditImage();
                    },
                    isSelectingPoint: marketingState.isSelectingPoint,
                    setIsSelectingPoint: marketingState.toggleIsSelectingPoint,
                    selectedPoint: marketingState.selectedPoint,
                    setSelectedPoint: marketingState.setSelectedPoint,
                };
            case 'generate':
            case 'combine':
                 return {
                    generatedImage: playgroundState.generatedImage,
                    isLoading: playgroundState.isLoading,
                    loadingMessage: playgroundState.loadingMessage,
                    error: playgroundState.error,
                    stop: playgroundState.stopAll,
                    viewerAction: playgroundState.handleViewerAction,
                    isSelectingPoint: playgroundState.isSelectingPoint,
                    setIsSelectingPoint: playgroundState.setIsSelectingPoint,
                    selectedPoint: playgroundState.selectedPoint,
                    setSelectedPoint: playgroundState.setSelectedPoint,
                };
            default:
                return { generatedImage: null, isLoading: false, loadingMessage: null, error: null, stop: () => {}, viewerAction: () => {},
                    isSelectingPoint: false, setIsSelectingPoint: () => {}, selectedPoint: null, setSelectedPoint: () => {} };
        }
    }, [activeMode, studioState, marketingState, playgroundState]);

    const imageDisplayRef = useRef<HTMLDivElement>(null);

    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isSelectingPoint || !imageDisplayRef.current) return;

        const rect = imageDisplayRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const xPercent = (x / rect.width) * 100;
        const yPercent = (y / rect.height) * 100;

        setSelectedPoint({ x: xPercent, y: yPercent });
        setIsSelectingPoint(false);
    };

    return (
        <main
            ref={imageDisplayRef}
            onClick={handleImageClick}
            className={`flex-1 min-w-0 bg-[#313131] flex items-center justify-center p-8 relative mt-2 mr-2 rounded-t-2xl border-t border-l border-r border-white/20 border-b-0 ${isSelectingPoint ? 'cursor-crosshair' : ''}`}
        >
            <ViewerActions />
            <DownloadActions generatedImage={generatedImage} />
             {isLoading && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20">
                    {/* FIX: Property 'onStop' does not exist on type 'IntrinsicAttributes & { message?: string; }'. */}
                    <LoadingSpinner message={loadingMessage || 'Working...'} onStop={stop} />
                </div>
             )}
             {error && !isLoading && (
                <div className="error-card max-w-md">
                    <AlertTriangleIcon />
                    <p className="font-semibold">An Error Occurred</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            )}
            {!isLoading && !error && generatedImage && (
                <>
                    <img src={generatedImage} alt="Generated content" className="max-w-full max-h-full object-contain rounded-md" />
                     {selectedPoint && (
                        <div className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20" style={{ left: `${selectedPoint.x}%`, top: `${selectedPoint.y}%` }}>
                            <div className="w-full h-full rounded-full bg-red-500/50 ring-2 ring-white animate-ping"></div>
                            <div className="absolute inset-0 w-full h-full rounded-full border-2 border-white bg-red-500 shadow-lg"></div>
                        </div>
                    )}
                </>
            )}
            {!isLoading && !error && !generatedImage && (
                <div className="text-center text-[var(--nb-text-secondary)] font-medium">
                    {activeMode === 'generate' ? 'Describe an image in the prompt bar below to start' : 'Generated Image Area'}
                </div>
            )}
            <ChatInputBar 
                generatedImage={generatedImage} 
                action={viewerAction} 
                isLoading={isLoading}
                placeholder={activeMode === 'generate' && !generatedImage ? 'A photorealistic image of...' : 'Describe an edit...'}
                isSelectingPoint={isSelectingPoint}
                onToggleSelectPoint={() => setIsSelectingPoint(!isSelectingPoint)}
                selectedPoint={selectedPoint}
                onClearPoint={() => setSelectedPoint(null)}
            />
        </main>
    );
};

export default PlaygroundViewer;
