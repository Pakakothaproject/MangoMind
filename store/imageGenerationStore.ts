import React from 'react';
import { create } from 'zustand';
import { runwareService } from '../services/runwareService';
import { DEFAULT_IMAGE_GEN_MODEL } from '../constants/models';
import { addGeneration } from '../services/generationService';
import { useModelStore } from './modelStore';
import type { ExtendedModelDefinition } from './modelStore';

interface ImageGenerationState {
    prompt: string;
    negativePrompt: string;
    modelId: string;
    numberOfImages: 1 | 2 | 3 | 4;
    generatedImages: string[] | null;
    isLoading: boolean;
    error: string | null;
    activeImageIndex: number;
    history: { prompt: string; images: string[] }[];
    historyIndex: number;
    aspectRatio: string;
    cfgScale: number;
    preGenerationText: string | null;
    panelWidth: number;
    isPanelOpen: boolean;
    
    setPrompt: (prompt: string) => void;
    setNegativePrompt: (prompt: string) => void;
    setModelId: (modelId: string) => void;
    setNumberOfImages: (num: 1 | 2 | 3 | 4) => void;
    setActiveImageIndex: (index: number) => void;
    setAspectRatio: (ratio: string) => void;
    setCfgScale: (cfgScale: number) => void;
    handleMouseDown: (e: React.MouseEvent) => void;
    setIsPanelOpen: (isOpen: boolean) => void;
    
    generate: (userId: string | undefined) => Promise<void>;
    undo: () => void;
    redo: () => void;

    canUndo: boolean;
    canRedo: boolean;
}

const defaultModelInfo = useModelStore.getState().models.find(m => m.id === DEFAULT_IMAGE_GEN_MODEL);

export const useImageGenerationStore = create<ImageGenerationState>((set, get) => ({
    prompt: '',
    negativePrompt: '',
    modelId: DEFAULT_IMAGE_GEN_MODEL,
    numberOfImages: 1,
    generatedImages: null,
    isLoading: false,
    error: null,
    activeImageIndex: 0,
    history: [],
    historyIndex: -1,
    aspectRatio: '1:1',
    cfgScale: defaultModelInfo?.supports.defaultCfg || 7.5,
    preGenerationText: null,
    panelWidth: 384,
    isPanelOpen: true,

    get canUndo() { return get().historyIndex > 0 },
    get canRedo() { return get().historyIndex < get().history.length - 1 },

    setPrompt: (prompt) => set({ prompt }),
    setNegativePrompt: (prompt) => set({ negativePrompt: prompt }),
    setModelId: (modelId) => {
        const { models } = useModelStore.getState();
        const modelInfo = models.find(m => m.id === modelId);
        if (modelInfo) {
            set({
                modelId,
                cfgScale: modelInfo.supports.defaultCfg || 7.5,
            });
        }
    },
    setNumberOfImages: (num) => set({ numberOfImages: num }),
    setActiveImageIndex: (index) => set({ activeImageIndex: index }),
    setAspectRatio: (ratio) => set({ aspectRatio: ratio }),
    setCfgScale: (cfgScale) => set({ cfgScale }),
    setIsPanelOpen: (isOpen) => set({ isPanelOpen: isOpen }),
    handleMouseDown: (e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = get().panelWidth;
        
        const handleMouseMove = (e: MouseEvent) => {
          const newWidth = startWidth + (e.clientX - startX);
          set({ panelWidth: Math.max(320, Math.min(newWidth, 600)) });
        };
    
        const handleMouseUp = () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
    
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    },

    generate: async (userId) => {
        const { prompt, negativePrompt, modelId, numberOfImages, aspectRatio, cfgScale } = get();
        if (!prompt) {
            set({ error: 'Prompt cannot be empty.' });
            return;
        }

        set({ isLoading: true, error: null, generatedImages: null, preGenerationText: null });

        try {
            const { models } = useModelStore.getState();
            const modelInfo = models.find(m => m.id === modelId);
            if (!modelInfo) {
                throw new Error("Selected model information could not be found.");
            }
            
            const { images: results, text: preGenText } = await runwareService.generateImageFromText(prompt, {
                modelInfo,
                negativePrompt,
                steps: modelInfo.supports.maxSteps || modelInfo.supports.defaultSteps || 30,
                cfgScale,
                numberOfImages,
                aspectRatio,
            });
            
            if (preGenText) {
                set({ preGenerationText: preGenText });
            }
            
            if (!results || results.length === 0) {
                if (!preGenText) {
                    throw new Error("API returned no image data or text.");
                }
            }

            if (results && results.length > 0) {
                set(state => {
                    const newHistory = [...state.history.slice(0, state.historyIndex + 1), { prompt, images: results }];
                    return {
                        generatedImages: results,
                        history: newHistory,
                        historyIndex: newHistory.length - 1,
                    }
                });

                if (userId) {
                    results.forEach(image => {
                        addGeneration(userId, image, prompt, 'text-to-image', modelId, 'runware', { negativePrompt, steps: modelInfo.supports.maxSteps, cfgScale });
                    });
                }
            }

        } catch (err) {
            set({ error: `Generation failed: ${err instanceof Error ? err.message : 'Unknown error'}` });
        } finally {
            set({ isLoading: false });
        }
    },
    undo: () => {
        set(state => {
            if (state.historyIndex > 0) {
                const newIndex = state.historyIndex - 1;
                return {
                    historyIndex: newIndex,
                    generatedImages: state.history[newIndex].images,
                    prompt: state.history[newIndex].prompt,
                    activeImageIndex: 0
                }
            }
            return {};
        });
    },
    redo: () => {
        set(state => {
            if (state.historyIndex < state.history.length - 1) {
                const newIndex = state.historyIndex + 1;
                return {
                    historyIndex: newIndex,
                    generatedImages: state.history[newIndex].images,
                    prompt: state.history[newIndex].prompt,
                    activeImageIndex: 0
                }
            }
            return {};
        });
    }
}));
