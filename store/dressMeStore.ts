import { create } from 'zustand';
import type { UploadedImage } from '../types';
import * as imageService from '../services/ai/imageService';
import { dressMePrompts } from '../constants/dressMePrompts';

// Helper to shuffle an array
const shuffle = <T>(array: T[]): T[] => {
    let currentIndex = array.length;
    let randomIndex;
    const newArray = [...array];
  
    // While there remain elements to shuffle.
    while (currentIndex !== 0) {
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [newArray[currentIndex], newArray[randomIndex]] = [
        newArray[randomIndex],
        newArray[currentIndex],
      ];
    }
  
    return newArray;
};

interface DressMeState {
    gender: 'male' | 'female';
    modelImage: UploadedImage | null;
    generatedImages: string[] | null;
    isLoading: boolean;
    loadingMessage: string | null;
    error: string | null;
    activeImageIndex: number;
    numberOfImages: 1 | 2 | 3 | 4 | 5;
    isPanelOpen: boolean;
    
    setGender: (gender: 'male' | 'female') => void;
    setModelImage: (image: UploadedImage | null) => void;
    setActiveImageIndex: (index: number) => void;
    setNumberOfImages: (num: 1 | 2 | 3 | 4 | 5) => void;
    setIsPanelOpen: (isOpen: boolean) => void;
    handleGenerate: (textGenModel: string, imageGenModel: string) => Promise<void>;
}

export const useDressMeStore = create<DressMeState>((set, get) => ({
    gender: 'female',
    modelImage: null,
    generatedImages: null,
    isLoading: false,
    loadingMessage: null,
    error: null,
    activeImageIndex: 0,
    numberOfImages: 3,
    isPanelOpen: true,

    setGender: (gender) => set({ gender, generatedImages: null, activeImageIndex: 0 }),
    setModelImage: (image) => set({ modelImage: image }),
    setActiveImageIndex: (index) => set({ activeImageIndex: index }),
    setNumberOfImages: (num) => set({ numberOfImages: num as 1 | 2 | 3 | 4 | 5 }),
    setIsPanelOpen: (isOpen) => set({ isPanelOpen: isOpen }),
    
    handleGenerate: async (textGenModel, imageGenModel) => {
        const { modelImage, gender, numberOfImages } = get();
        if (!modelImage) {
            set({ error: 'Please upload an image of yourself first.' });
            return;
        }

        set({ 
            isLoading: true, 
            error: null, 
            loadingMessage: "Preparing prompts...",
            generatedImages: null,
            activeImageIndex: 0,
        });

        try {
            const availablePrompts = dressMePrompts[gender];
            const selectedPrompts = shuffle(availablePrompts).slice(0, numberOfImages);
            const allGeneratedImages: string[] = [];

            for (let i = 0; i < selectedPrompts.length; i++) {
                const prompt = selectedPrompts[i];

                set({ loadingMessage: `Paraphrasing prompt ${i + 1} of ${numberOfImages}...` });
                const paraphrasedPrompt = await imageService.paraphraseDescription(textGenModel, prompt);
                
                set({ loadingMessage: `Generating image ${i + 1} of ${numberOfImages}...` });
                const images = await imageService.editImage(imageGenModel, `data:${modelImage.type};base64,${modelImage.base64}`, paraphrasedPrompt, () => {}, null);
                
                if (images.length > 0) {
                    allGeneratedImages.push(images[0]);
                    // Update UI to show images as they come in
                    set({ generatedImages: [...allGeneratedImages] });
                }
            }
            
            set({ isLoading: false, loadingMessage: null });
        } catch (err) {
            // The 'err' variable in a catch block is of type 'unknown'. This handles the error safely by checking if it is an instance of Error before accessing the message property.
            const message = err instanceof Error ? err.message : 'An unknown error occurred';
            set({ error: `Generation failed: ${message}`, isLoading: false, loadingMessage: null });
        }
    },
}));