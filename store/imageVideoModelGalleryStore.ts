import { create } from 'zustand';

export type ModelGalleryType = 'image' | 'video';

interface ImageVideoModelGalleryState {
    isModelGalleryOpen: boolean;
    galleryType: ModelGalleryType;
    actions: {
        toggleModelGallery: (type?: ModelGalleryType) => void;
        openModelGallery: (type: ModelGalleryType) => void;
        closeModelGallery: () => void;
    };
}

export const useImageVideoModelGalleryStore = create<ImageVideoModelGalleryState>((set) => ({
    isModelGalleryOpen: false,
    galleryType: 'image',
    actions: {
        toggleModelGallery: (type = 'image') => set((state) => ({ 
            isModelGalleryOpen: !state.isModelGalleryOpen,
            galleryType: type 
        })),
        openModelGallery: (type) => set({ isModelGalleryOpen: true, galleryType: type }),
        closeModelGallery: () => set({ isModelGalleryOpen: false }),
    },
}));

export const useImageVideoModelGalleryActions = () => 
    useImageVideoModelGalleryStore((state) => state.actions);

export const useIsModelGalleryOpen = () => 
    useImageVideoModelGalleryStore((state) => state.isModelGalleryOpen);

export const useModelGalleryType = () => 
    useImageVideoModelGalleryStore((state) => state.galleryType);