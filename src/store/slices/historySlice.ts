import type { StateCreator } from 'zustand';
import type { StudioState } from '../studioStore';
import { addGeneration } from '../../services/generationService';

export interface HistorySlice {
  history: string[][];
  historyIndex: number;
  baseGeneratedImages: string[] | null;
  activeImageIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  isDownloading: boolean;

  setHistory: (history: string[][]) => void;
  setHistoryIndex: (index: number) => void;
  setBaseGeneratedImages: (images: string[] | null) => void;
  setActiveImageIndex: (index: number) => void;
  
  updateHistory: (newImages: string[], prompt: string | null) => void;
  resetHistory: (initialImages: string[], prompt: string | null, tag?: string) => void;
  handleUndo: () => void;
  handleRedo: () => void;
  handlePrimaryDownload: () => Promise<void>;
}

export const createHistorySlice: StateCreator<
  StudioState,
  [],
  [],
  HistorySlice
> = (set, get) => ({
  history: [],
  historyIndex: -1,
  baseGeneratedImages: null,
  activeImageIndex: 0,
  canUndo: false,
  canRedo: false,
  isDownloading: false,

  setHistory: (history) => set({ history }),
  setHistoryIndex: (index) => set({ historyIndex: index }),
  setBaseGeneratedImages: (images) => set({ baseGeneratedImages: images }),
  setActiveImageIndex: (index) => set({ activeImageIndex: index }),

  updateHistory: (newImages, prompt) => {
    const { history, historyIndex, session, appMode, imageEditModel, isPoseLocked, isStrictFaceEnabled } = get();
    const apiProvider = localStorage.getItem('api-provider') || 'gemini';
    get().clearGeneratedVideo();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newImages);
    set({
        history: newHistory,
        historyIndex: newHistory.length - 1,
        baseGeneratedImages: newImages,
        activeImageIndex: 0,
    });
    newImages.forEach(image => {
        if (session?.user?.id) {
            addGeneration(
                session.user.id,
                image,
                prompt,
                appMode,
                imageEditModel,
                apiProvider,
                { isPoseLocked, isStrictFaceEnabled }
            );
        }
    });
  },

  resetHistory: (initialImages, prompt, tag = 'Generation') => {
    const { session, appMode, imageEditModel, isPoseLocked, isStrictFaceEnabled } = get();
    const apiProvider = localStorage.getItem('api-provider') || 'gemini';
    get().clearGeneratedVideo();
    set({
        history: [initialImages],
        historyIndex: 0,
        baseGeneratedImages: initialImages,
        activeImageIndex: 0,
    });
     initialImages.forEach(image => {
        if (session?.user?.id && tag !== 'Upload') {
             addGeneration(
                session.user.id,
                image,
                prompt,
                appMode,
                imageEditModel,
                apiProvider,
                { isPoseLocked, isStrictFaceEnabled }
            );
        }
    });
  },

  handleUndo: () => {
    const { historyIndex, history } = get();
    if (historyIndex > 0) {
        get().clearGeneratedVideo();
        const newIndex = historyIndex - 1;
        set({
            historyIndex: newIndex,
            baseGeneratedImages: history[newIndex],
            activeImageIndex: 0,
        });
    }
  },

  handleRedo: () => {
    const { historyIndex, history } = get();
    if (historyIndex < history.length - 1) {
        get().clearGeneratedVideo();
        const newIndex = historyIndex + 1;
        set({
            historyIndex: newIndex,
            baseGeneratedImages: history[newIndex],
            activeImageIndex: 0,
        });
    }
  },

  handlePrimaryDownload: async () => {
    const { baseGeneratedImages, activeImageIndex, generatedVideo } = get();
    const currentImage = baseGeneratedImages?.[activeImageIndex];

    if (!currentImage && !generatedVideo) return;

    set({ isDownloading: true });
    try {
        const link = document.createElement('a');
        if (generatedVideo) {
            link.href = generatedVideo;
            link.download = `mangomind-video.mp4`;
        } else if (currentImage) {
            link.href = currentImage;
            link.download = `mangomind-image.png`;
        }
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Download failed', error);
        get().setError('Download failed. Please try again.');
    } finally {
        await new Promise(res => setTimeout(res, 300));
        set({ isDownloading: false });
    }
  },
});