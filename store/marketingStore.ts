import React from 'react';
import { create } from 'zustand';
import type { UploadedImage, StudioProps } from '../types';
import { DEFAULT_IMAGE_GEN_MODEL } from '../constants/models';
import { runwareService } from '../services/runwareService';
import { useModelStore } from './modelStore';
import { addGeneration } from '../services/generationService';

interface MarketingState extends Omit<StudioProps, 'startMode' | 'initialImage' | 'onNavigateToVideoGen' | 'textGenModel' | 'videoGenModel'> {
  prompt: string;
  overlayText: string;
  referenceImage: UploadedImage | null;
  productImage: UploadedImage | null;
  numberOfImages: 1 | 2;
  generatedImages: string[] | null;
  activeImageIndex: number;
  loadingMessage: string | null;
  error: string | null;
  history: string[][];
  historyIndex: number;
  isDownloading: boolean;
  isPanelOpen: boolean;
  panelWidth: number;
  theme: 'light' | 'dark';
  isExpanded: boolean;
  editPrompt: string;
  streamingText: string | null;
  isStreamingFinal: boolean;
  isSelectingPoint: boolean;
  selectedPoint: { x: number; y: number } | null;
  adGenModelId: string;
  activePresetPanel: 'ads' | null;
  aspectRatio: string;
  
  canUndo: boolean;
  canRedo: boolean;

  // Actions
  handleSignOut: () => Promise<void>;
  setPrompt: (prompt: string) => void;
  setOverlayText: (text: string) => void;
  setReferenceImage: (image: UploadedImage | null) => void;
  setProductImage: (image: UploadedImage | null) => void;
  setNumberOfImages: (num: 1 | 2) => void;
  setActiveImageIndex: (index: number) => void;
  setAdGenModelId: (modelId: string) => void;
  setActivePresetPanel: (panel: 'ads' | null) => void;
  setAspectRatio: (ratio: string) => void;
  handleGenerate: () => Promise<void>;
  handleUndo: () => void;
  handleRedo: () => void;
  handleDownload: () => Promise<void>;
  setIsPanelOpen: (isOpen: boolean) => void;
  handleMouseDown: (e: React.MouseEvent) => void;
  toggleTheme: () => void;
  setIsExpanded: (isExpanded: boolean) => void;
  setEditPrompt: (prompt: string) => void;
  handleEditImage: () => Promise<void>;
  onTextUpdate: (text: string, isFinal: boolean) => void;
  toggleIsSelectingPoint: () => void;
  setSelectedPoint: (point: { x: number; y: number } | null) => void;
  clearSelectedPoint: () => void;
}

export const useMarketingStore = create<MarketingState>((set, get) => ({
    session: null!,
    onNavigateBack: () => {},
    onNavigateToGenerator: () => {},
    onNavigateToSettings: () => {},
    onNavigateToGenerations: () => {},
    handleSignOut: async () => {},
    imageEditModel: '',
    prompt: '',
    overlayText: '',
    referenceImage: null,
    productImage: null,
    numberOfImages: 1,
    generatedImages: null,
    activeImageIndex: 0,
    loadingMessage: null,
    error: null,
    history: [],
    historyIndex: -1,
    isDownloading: false,
    isPanelOpen: true,
    panelWidth: 420,
    theme: 'dark',
    isExpanded: false,
    editPrompt: '',
    streamingText: null,
    isStreamingFinal: true,
    isSelectingPoint: false,
    selectedPoint: null,
    adGenModelId: DEFAULT_IMAGE_GEN_MODEL,
    activePresetPanel: null,
    aspectRatio: '1:1',

    get canUndo() { return get().historyIndex > 0; },
    get canRedo() { return get().history.length - 1 > get().historyIndex; },

    setPrompt: (prompt) => set({ prompt }),
    setOverlayText: (text) => set({ overlayText: text }),
    setReferenceImage: (image) => set({ referenceImage: image }),
    setProductImage: (image) => set({ productImage: image }),
    setNumberOfImages: (num) => set({ numberOfImages: num }),
    setActiveImageIndex: (index) => set({ activeImageIndex: index }),
    setAdGenModelId: (modelId) => set({ adGenModelId: modelId }),
    setActivePresetPanel: (panel) => set({ activePresetPanel: panel }),
    setAspectRatio: (ratio) => set({ aspectRatio: ratio }),

    handleGenerate: async () => {
        const { adGenModelId, prompt, referenceImage, productImage, numberOfImages, aspectRatio, session } = get();
        if (!prompt) {
            set({ error: 'Please describe your campaign.' });
            return;
        }

        set({ loadingMessage: "Generating campaign...", error: null, generatedImages: null });
        
        const { models } = useModelStore.getState();
        const modelInfo = models.find(m => m.id === adGenModelId);
        if (!modelInfo) {
            set({ error: 'Selected model not found.', loadingMessage: null });
            return;
        }
        
        try {
            let results: string[];
            const imagesToCombine = [referenceImage, productImage].filter(Boolean) as UploadedImage[];
            
            if (imagesToCombine.length > 0) {
                 const { images } = await runwareService.combineImages(prompt, imagesToCombine, {
                    modelInfo,
                    numberOfImages,
                    aspectRatio,
                });
                results = images;
            } else {
                 const { images } = await runwareService.generateImageFromText(prompt, {
                    modelInfo,
                    numberOfImages,
                    aspectRatio,
                });
                results = images;
            }
            
            set(state => {
                const newHistory = [...state.history.slice(0, state.historyIndex + 1), results];
                return {
                    history: newHistory,
                    historyIndex: newHistory.length - 1,
                    generatedImages: results,
                    activeImageIndex: 0,
                };
            });

            if (session?.user.id) {
                results.forEach(image => {
                    addGeneration(session.user.id, image, prompt, 'marketing', adGenModelId, 'runware', { aspectRatio, numberOfImages });
                });
            }

        } catch (err) {
            set({ error: `Campaign generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`});
        } finally {
            set({ loadingMessage: null });
        }
    },
    handleUndo: () => { /* Placeholder */ },
    handleRedo: () => { /* Placeholder */ },
    handleDownload: async () => { /* Placeholder */ },
    setIsPanelOpen: (isOpen) => set({ isPanelOpen: isOpen }),
    handleMouseDown: (e) => {
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
    toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: newTheme });
        document.documentElement.className = newTheme;
        localStorage.setItem('vdr-theme', newTheme);
    },
    setIsExpanded: (isExpanded) => set({ isExpanded }),
    setEditPrompt: (prompt) => set({ editPrompt: prompt }),
    handleEditImage: async () => { /* Placeholder */ },
    onTextUpdate: (text, isFinal) => set({ streamingText: text, isStreamingFinal: isFinal }),
    toggleIsSelectingPoint: () => set(state => ({ isSelectingPoint: !state.isSelectingPoint, selectedPoint: null })),
    setSelectedPoint: (point) => set({ selectedPoint: point, isSelectingPoint: false }),
    clearSelectedPoint: () => set({ selectedPoint: null }),
}));

export const initMarketingStore = (props: Partial<MarketingState>) => {
    useMarketingStore.setState(props);
};