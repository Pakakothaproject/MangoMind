import { create } from 'zustand';
import { getGenerations, deleteGeneration, deleteGenerations } from '../services/generationService';
import { describeImage } from '../services/ai/imageService';
import type { Generation } from '../types';
import { fetchImageAsUploadedImage } from '../utils/image';
import { useAppStore } from './appStore';

interface GenerationsState {
    generations: Generation[];
    loading: boolean;
    selectedGen: Generation | null;
    isNavigating: boolean;
    isGeneratingPrompt: boolean;
    error: string | null;
    selectedGenerationIds: number[];
    isDeleting: boolean;

    fetchGenerations: () => Promise<void>;
    setSelectedGen: (gen: Generation | null) => void;
    setError: (error: string | null) => void;
    handleGeneratePromptFromImage: (imageUrl: string) => Promise<void>;
    handleEditImage: (imageUrl: string) => Promise<void>;
    handleDeleteGeneration: (id: number) => Promise<void>;
    toggleGenerationSelection: (id: number) => void;
    clearSelection: () => void;
    handleDeleteSelectedGenerations: () => Promise<void>;
}

export const useGenerationsStore = create<GenerationsState>((set, get) => ({
    generations: [],
    loading: true,
    selectedGen: null,
    isNavigating: false,
    isGeneratingPrompt: false,
    error: null,
    selectedGenerationIds: [],
    isDeleting: false,

    fetchGenerations: async () => {
        set({ loading: true });
        const userGenerations = await getGenerations();
        set({ generations: userGenerations, loading: false });
    },

    setSelectedGen: (gen) => set({ selectedGen: gen }),
    setError: (error) => set({ error }),

    handleGeneratePromptFromImage: async (imageUrl) => {
        set({ isGeneratingPrompt: true, error: null });
        try {
            const newPrompt = await describeImage(imageUrl);
            // FIX: Actions are nested under the 'actions' property in the store.
            useAppStore.getState().actions.navigateToGeneratorWithPrompt(newPrompt);
        } catch (error) {
            console.error("Failed to generate prompt from image:", error);
            set({ error: `Failed to analyze the image: ${error instanceof Error ? error.message : 'Unknown error'}` });
        } finally {
            set({ isGeneratingPrompt: false, selectedGen: null });
        }
    },

    handleEditImage: async (imageUrl) => {
        set({ isNavigating: true });
        try {
            const uploadedImage = await fetchImageAsUploadedImage(imageUrl);
            // FIX: Actions are nested under the 'actions' property in the store.
            useAppStore.getState().actions.navigateToStudio('tryon', uploadedImage);
        } catch (error) {
            console.error("Failed to load image for studio:", error);
            set({ error: "Failed to load image for editing. Please try again." });
        } finally {
            set({ isNavigating: false });
        }
    },

    handleDeleteGeneration: async (id) => {
        try {
            await deleteGeneration(id);
            set(state => ({
                generations: state.generations.filter(gen => gen.id !== id),
                selectedGen: null
            }));
        } catch (error) {
            console.error("Failed to delete generation:", error);
            set({ error: "Could not delete the image. Please try again." });
        }
    },

    toggleGenerationSelection: (id) => {
        set(state => {
            const selectedIds = new Set(state.selectedGenerationIds);
            if (selectedIds.has(id)) {
                selectedIds.delete(id);
            } else {
                selectedIds.add(id);
            }
            return { selectedGenerationIds: Array.from(selectedIds) };
        });
    },

    clearSelection: () => set({ selectedGenerationIds: [] }),

    handleDeleteSelectedGenerations: async () => {
        const { selectedGenerationIds } = get();
        if (selectedGenerationIds.length === 0) return;

        set({ isDeleting: true, error: null });
        try {
            await deleteGenerations(selectedGenerationIds); 
            set(state => ({
                generations: state.generations.filter(gen => !selectedGenerationIds.includes(gen.id)),
                selectedGenerationIds: [],
            }));
        } catch (error) {
            console.error("Failed to delete generations:", error);
            set({ error: "Could not delete the selected images. Please try again." });
        } finally {
            set({ isDeleting: false });
        }
    }
}));