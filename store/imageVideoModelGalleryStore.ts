import { create } from 'zustand';

interface ImageVideoModelGalleryState {
    isModelGalleryOpen: boolean;
    actions: {
        toggleModelGallery: () => void;
        openModelGallery: () => void;
        closeModelGallery: () => void;
    };
}

export const useImageVideoModelGalleryStore = create<ImageVideoModelGalleryState>((set) => ({
    isModelGalleryOpen: false,
    actions: {
        toggleModelGallery: () => set((state) => ({ isModelGalleryOpen: !state.isModelGalleryOpen })),
        openModelGallery: () => set({ isModelGalleryOpen: true }),
        closeModelGallery: () => set({ isModelGalleryOpen: false }),
    },
}));

export const useImageVideoModelGalleryActions = () => 
    useImageVideoModelGalleryStore((state) => state.actions);

export const useIsModelGalleryOpen = () => 
    useImageVideoModelGalleryStore((state) => state.isModelGalleryOpen);