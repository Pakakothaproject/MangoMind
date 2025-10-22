import React from 'react';
import { create } from 'zustand';
import type { UploadedImage } from '../types';
import * as videoService from '../services/videoService';
import { DEFAULT_VIDEO_GEN_MODEL, MODEL_SUPPORT_MAP } from '../constants/models';
import { useAppStore } from '../store/appStore';

const VIDEO_GENERATION_COST = 25000;

export interface VideoGenState {
    mode: 'text' | 'image';
    prompt: string;
    negativePrompt: string;
    aspectRatio: string;
    reusePrompt: boolean;
    image: UploadedImage | null;
    firstFrame: UploadedImage | null;
    lastFrame: UploadedImage | null;
    isLoading: boolean;
    loadingMessage: string | null;
    generatedVideoUrl: string | null;
    error: string | null;
    showSettings: boolean;
    isDownloading: boolean;
    history: string[];
    historyIndex: number;
    canUndo: boolean;
    canRedo: boolean;
    isPanelOpen: boolean;
    panelWidth: number;
    modelId: string;

    setMode: (mode: 'text' | 'image') => void;
    setPrompt: (prompt: string) => void;
    setNegativePrompt: (prompt: string) => void;
    setAspectRatio: (ratio: string) => void;
    setReusePrompt: (reuse: boolean) => void;
    setImage: (image: UploadedImage | null) => void;
    setShowSettings: (show: boolean) => void;
    setIsPanelOpen: (isOpen: boolean) => void;
    setModelId: (modelId: string) => void;

    init: (initialImage: UploadedImage | null) => void;
    handleGenerate: () => Promise<void>;
    handleUndo: () => void;
    handleRedo: () => void;
    handleDownload: () => Promise<void>;
    handleMouseDown: (e: React.MouseEvent) => void;
}

export const useVideoGenStore = create<VideoGenState>((set, get) => ({
    mode: 'text',
    prompt: '',
    negativePrompt: '',
    aspectRatio: '16:9',
    reusePrompt: false,
    image: null,
    firstFrame: null,
    lastFrame: null,
    isLoading: false,
    loadingMessage: null,
    generatedVideoUrl: null,
    error: null,
    showSettings: false,
    isDownloading: false,
    history: [],
    historyIndex: -1,
    isPanelOpen: true,
    panelWidth: 420,
    modelId: DEFAULT_VIDEO_GEN_MODEL,

    get canUndo() { return get().historyIndex > 0; },
    get canRedo() { return get().history.length - 1 > get().historyIndex; },

    setMode: (mode) => set({ mode }),
    setPrompt: (prompt) => set({ prompt }),
    setNegativePrompt: (prompt) => set({ negativePrompt: prompt }),
    setAspectRatio: (ratio) => set({ aspectRatio: ratio }),
    setReusePrompt: (reuse) => set({ reusePrompt: reuse }),
    setImage: (image) => set({ image }),
    setFirstFrame: (image) => set({ firstFrame: image }),
    setLastFrame: (image) => set({ lastFrame: image }),
    setShowSettings: (show) => set({ showSettings: show }),
    setIsPanelOpen: (isOpen) => set({ isPanelOpen: isOpen }),
    setModelId: (modelId) => {
        const modelSupport = MODEL_SUPPORT_MAP[modelId];
        if (modelSupport?.aspectRatios && modelSupport.aspectRatios.length > 0) {
            // Set default aspect ratio to the first available one for this model
            set({ 
                modelId,
                aspectRatio: modelSupport.aspectRatios[0]
            });
        } else {
            set({ modelId });
        }
    },

    init: (initialImage) => {
        if (initialImage) {
            set({ image: initialImage, mode: 'image' });
        }
    },

    handleUndo: () => {
        const { historyIndex, history } = get();
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            set({ historyIndex: newIndex, generatedVideoUrl: history[newIndex] });
        }
    },
    handleRedo: () => {
        const { historyIndex, history } = get();
        if (historyIndex < get().history.length - 1) {
            const newIndex = historyIndex + 1;
            set({ historyIndex: newIndex, generatedVideoUrl: history[newIndex] });
        }
    },

    handleMouseDown: (e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = get().panelWidth;

        const mouseMoveHandler = (e: MouseEvent) => {
            const newWidth = startWidth + (e.clientX - startX);
            set({ panelWidth: Math.max(320, Math.min(newWidth, 600)) });
        };
        const mouseUpHandler = () => {
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
        };
        
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    },

    handleGenerate: async () => {
        const { tokenBalance } = useAppStore.getState();
        if (tokenBalance < VIDEO_GENERATION_COST) {
            set({ error: `Insufficient tokens. Video generation requires ${VIDEO_GENERATION_COST.toLocaleString()} tokens.` });
            return;
        }

        const { mode, prompt, image, negativePrompt, firstFrame, lastFrame, modelId } = get();
        if (!prompt || (mode === 'image' && !image)) {
            set({ error: 'Prompt and image (if in image mode) are required.'});
            return;
        }

        set({ isLoading: true, error: null, isPanelOpen: false });
        
        const videoGenModel = modelId;

        try {
            const videoUrl = await videoService.generateVideo(
                videoGenModel,
                prompt,
                mode === 'image' ? image : null,
                (msg) => set({ loadingMessage: msg }),
                negativePrompt,
                firstFrame,
                lastFrame,
            );
            
            set(state => {
                const newHistory = [...state.history.slice(0, state.historyIndex + 1), videoUrl];
                return {
                    generatedVideoUrl: videoUrl,
                    history: newHistory,
                    historyIndex: newHistory.length - 1,
                    error: null,
                }
            });

        } catch (err) {
            set({ error: `Video generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`});
        } finally {
            set({ isLoading: false, loadingMessage: null });
        }
    },
    
    handleDownload: async () => {
        const { generatedVideoUrl } = get();
        if (!generatedVideoUrl) return;
        set({ isDownloading: true });
        try {
            const link = document.createElement('a');
            link.href = generatedVideoUrl;
            link.download = 'generated-video.mp4';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error(e);
            set({ error: 'Download failed.' });
        } finally {
            await new Promise(res => setTimeout(res, 300));
            set({ isDownloading: false });
        }
    },
}));