 import React, { useRef } from 'react';
import { useStudioStore } from '../store/studioStore';
import { LoadingSpinner } from './LoadingSpinner';
import { AlertTriangleIcon, ExpandIcon } from './Icons';
import type { Bubble } from '../types';
import { StreamingTextOverlay } from './StreamingTextOverlay';
import { ImageChatInput } from './ImageChatInput';

export const RightPanel: React.FC = () => {
    const {
        baseGeneratedImages: generatedImages,
        activeImageIndex,
        setActiveImageIndex,
        generatedVideo,
        loadingMessage,
        error,
        streamingText,
        isStreamingFinal,
        handleClearStreamingText: onClearStreamingText,
        isSelectingPoint,
        isSelectingPerson,
        brightness,
        contrast,
        grainIntensity,
        selectedPoint,
        targetPersonPoint,
        bubbles,
        handleBubbleMouseDown,
        handleBubbleTouchStart,
        dragState,
        setSelectedBubbleId,
        selectedBubbleId,
        isWatermarkEnabled,
        setIsExpanded,
        editPrompt, 
        setEditPrompt, 
        handleEditImage,
        setIsSelectingPoint,
        setSelectedPoint,
        setTargetPersonPoint,
        setIsSelectingPerson,
    } = useStudioStore();

    const touchStartX = useRef(0);
    const currentGeneratedImage = generatedImages?.[activeImageIndex] ?? null;

    const imageDisplayRef = useRef<HTMLDivElement>(null);
    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!imageDisplayRef.current) return;

        const rect = imageDisplayRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const xPercent = (x / rect.width) * 100;
        const yPercent = (y / rect.height) * 100;

        if (isSelectingPoint) {
            setSelectedPoint({ x: xPercent, y: yPercent });
            setIsSelectingPoint(false);
        } else if (isSelectingPerson) {
            setTargetPersonPoint({ x: xPercent, y: yPercent });
            setIsSelectingPerson(false);
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (generatedImages && generatedImages.length > 1) {
            touchStartX.current = e.touches[0].clientX;
        }
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (generatedImages && generatedImages.length > 1) {
            const touchEndX = e.changedTouches[0].clientX;
            const deltaX = touchEndX - touchStartX.current;
            if (Math.abs(deltaX) > 50) { // Swipe threshold
                if (deltaX > 0) { // Swipe right
                    handlePrev();
                } else { // Swipe left
                    handleNext();
                }
            }
        }
    };

    const handlePrev = () => {
        if (generatedImages && generatedImages.length > 1) {
            setActiveImageIndex((activeImageIndex - 1 + generatedImages.length) % generatedImages.length);
        }
    };

    const handleNext = () => {
        if (generatedImages && generatedImages.length > 1) {
            setActiveImageIndex((activeImageIndex + 1) % generatedImages.length);
        }
    };

    return (
        <div 
            className="w-full h-full relative flex flex-col"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div 
                ref={imageDisplayRef}
                className="flex-grow w-full relative overflow-hidden bg-[var(--nb-bg)] flex justify-center items-center p-8"
                onClick={handleImageClick}
            >
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
                
                {!loadingMessage && !error && (currentGeneratedImage || generatedVideo) && (
                    <>
                        {generatedVideo ? (
                            <video
                                key={generatedVideo}
                                src={generatedVideo}
                                controls
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="object-contain w-full h-full"
                            />
                        ) : currentGeneratedImage && (
                            <>
                                {generatedImages?.map((imgSrc, index) => (
                                        <img 
                                        key={index}
                                        src={imgSrc} 
                                        alt={`Generated Model ${index + 1}`} 
                                        className={`object-contain w-full h-full absolute inset-0 transition-opacity duration-300 ease-in-out ${isSelectingPoint || isSelectingPerson ? 'cursor-crosshair' : ''} ${index === activeImageIndex ? 'opacity-100' : 'opacity-0'}`} 
                                        style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }} 
                                    />
                                ))}
                                <div className="grain-overlay" style={{ opacity: grainIntensity / 250 }}></div>
                                
                                {selectedPoint && (
                                    <div className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20" style={{ left: `${selectedPoint.x}%`, top: `${selectedPoint.y}%` }}>
                                        <div className="w-full h-full rounded-full bg-red-500/50 ring-2 ring-white animate-ping"></div>
                                        <div className="absolute inset-0 w-full h-full rounded-full border-2 border-white bg-red-500 shadow-lg"></div>
                                    </div>
                                )}
                                
                                {targetPersonPoint && (
                                    <div className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20" style={{ left: `${targetPersonPoint.x}%`, top: `${targetPersonPoint.y}%` }}>
                                        <div className="w-full h-full rounded-full bg-blue-500/50 ring-2 ring-white animate-ping"></div>
                                        <div className="absolute inset-0 w-full h-full rounded-full border-2 border-white bg-blue-500 shadow-lg"></div>
                                    </div>
                                )}

                                <div className="absolute inset-0">
                                    {bubbles.map(bubble => (
                                        <div key={bubble.id} onMouseDown={(e) => handleBubbleMouseDown(e, bubble.id)} onTouchStart={(e) => handleBubbleTouchStart(e, bubble.id)} onClick={(e) => { e.stopPropagation(); setSelectedBubbleId(bubble.id); }}
                                            className={`absolute aspect-square flex items-center justify-center transition-transform duration-100 ${dragState?.id === bubble.id ? 'cursor-grabbing scale-105 z-20' : 'cursor-grab z-10'}`}
                                            style={{ left: `${bubble.x}%`, top: `${bubble.y}%`, width: `${bubble.size}%`, transform: `translate(-50%, -50%) rotate(${bubble.rotation}deg)`, filter: dragState?.id === bubble.id ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'none', containerType: 'inline-size' }}>
                                            <div className="w-full h-full transition-all duration-200 pointer-events-none" style={{ transform: `scaleX(${bubble.scaleX})`, filter: selectedBubbleId === bubble.id ? 'drop-shadow(0 0 8px var(--nb-accent))' : 'none' }}>
                                                <img src={'https://static.vecteezy.com/system/resources/thumbnails/045/925/602/small/black-and-white-color-speech-bubble-balloon-icon-sticker-memo-keyword-planner-text-box-banner-png.png'} alt="Speech bubble" className="w-full h-full"/>
                                            </div>
                                            <div className="absolute inset-0 flex items-center justify-center text-center p-[15%] text-black font-bold whitespace-pre-wrap break-words pointer-events-none" style={{ fontSize: `${bubble.textSize}cqw` }}>
                                                {bubble.text}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {isWatermarkEnabled && (
                                    <img src={'https://vectorseek.com/wp-content/uploads/2023/08/Blacked-Logo-Vector.svg-.png'} alt="Watermark" className="absolute bottom-4 right-4 h-6 md:h-8 w-auto z-20 pointer-events-none opacity-90"/>
                                )}
                            </>
                        )}
                    </>
                )}
                {generatedImages && generatedImages.length > 1 && (
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
                {!loadingMessage && !error && !currentGeneratedImage && !generatedVideo && (
                    <div className="text-center">
                        <span className="material-symbols-outlined text-[var(--nb-text-secondary)] mb-4" style={{fontSize: '64px'}}>image</span>
                        <h2 className="text-2xl font-bold text-[var(--nb-text)]">Your masterpiece will appear here</h2>
                        <p className="text-[var(--nb-text-secondary)] mt-2">Follow the steps in the panel to get started</p>
                    </div>
                )}
                <StreamingTextOverlay
                    streamingText={streamingText}
                    isStreamingFinal={isStreamingFinal}
                    onClose={onClearStreamingText}
                />
            </div>
             {currentGeneratedImage && !generatedVideo && (
                <ImageChatInput
                    value={editPrompt}
                    onChange={setEditPrompt}
                    onSend={handleEditImage}
                    isLoading={!!loadingMessage}
                    placeholder="Describe an edit to your image..."
                    isSelectingPoint={isSelectingPoint}
                    onToggleSelectPoint={() => setIsSelectingPoint(!isSelectingPoint)}
                    selectedPoint={selectedPoint}
                    onClearPoint={() => setSelectedPoint(null)}
                />
            )}
        </div>
    );
};