import type { StateCreator } from 'zustand';
import type { StudioState } from '../studioStore';
import type { UploadedImage } from '../../types';
import { fetchImageAsUploadedImage, loadImage, dataUrlToUploadedImage } from '../../utils/image';
// FIX: Import useAppStore to access global navigation actions directly.
import { useAppStore } from '../appStore';

export interface AssetsSlice {
  originalModelImage: UploadedImage | null;
  clothingImage: UploadedImage | null;
  environmentImage: UploadedImage | null;
  hairStyleImage: UploadedImage | null;
  accessoryImage: UploadedImage | null;
  productImage: UploadedImage | null;
  generatedVideo: string | null;
  clothingImageUrl: string;

  setOriginalModelImage: (image: UploadedImage | null) => void;
  setClothingImage: (image: UploadedImage | null) => void;
  setEnvironmentImage: (image: UploadedImage | null) => void;
  setHairStyleImage: (image: UploadedImage | null) => void;
  setAccessoryImage: (image: UploadedImage | null) => void;
  setProductImage: (image: UploadedImage | null) => void;
  setGeneratedVideo: (video: string | null) => void;
  setClothingImageUrl: (url: string) => void;

  handleModelImageUpload: (image: UploadedImage | null) => void;
  clearGeneratedVideo: () => void;
  handleUseAsModel: () => void;
  handleLoadFromUrlInput: () => Promise<void>;
  handleUseForMarketing: () => void;
  handleUseForVideo: () => void;
}

export const createAssetsSlice: StateCreator<
  StudioState,
  [],
  [],
  AssetsSlice
> = (set, get) => ({
  originalModelImage: null,
  clothingImage: null,
  environmentImage: null,
  hairStyleImage: null,
  accessoryImage: null,
  productImage: null,
  generatedVideo: null,
  clothingImageUrl: 'https://1.ohailakhan.com/cdn/shop/files/Untitleddesign-2023-11-28T105532.287_720x.jpg?v=1701149417',

  setOriginalModelImage: (image) => set({ originalModelImage: image }),
  setClothingImage: (image) => set({ clothingImage: image }),
  setEnvironmentImage: (image) => set({ environmentImage: image }),
  setHairStyleImage: (image) => set({ hairStyleImage: image }),
  setAccessoryImage: (image) => set({ accessoryImage: image }),
  setProductImage: (image) => set({ productImage: image }),
  setGeneratedVideo: (video) => set({ generatedVideo: video }),
  setClothingImageUrl: (url) => set({ clothingImageUrl: url }),

  clearGeneratedVideo: () => {
    const { generatedVideo } = get();
    if (generatedVideo) {
      URL.revokeObjectURL(generatedVideo);
      set({ generatedVideo: null });
    }
  },

  handleModelImageUpload: (image) => {
    get().clearGeneratedVideo();
    if (image) {
      const dataUrl = `data:${image.type};base64,${image.base64}`;
      get().resetHistory([dataUrl], null, 'Upload');
      const img = new Image();
      img.onload = () => set({ imageAspectRatio: `${img.width} / ${img.height}` });
      img.src = dataUrl;
      set({
        originalModelImage: image,
        editPrompt: '',
        accessoryPrompt: '',
        accessoryImage: null,
        productPrompt: '',
        productImage: null,
        grainIntensity: 0,
        brightness: 100,
        contrast: 100,
        bubbles: [],
        selectedBubbleId: null,
        isWatermarkEnabled: false,
        isSelectingPoint: false,
        selectedPoint: null,
        isSelectingPerson: false,
        targetPersonPoint: null,
        isPanelOpen: true,
      });
    } else {
      set({
        originalModelImage: null,
        baseGeneratedImages: null,
        history: [],
        historyIndex: -1,
        imageAspectRatio: '4 / 5',
      });
    }
  },
  handleUseAsModel: () => {
    const { baseGeneratedImages, activeImageIndex, handleModelImageUpload, setAppMode, setError } = get();
    const currentGeneratedImage = baseGeneratedImages?.[activeImageIndex] ?? null;

    if (!currentGeneratedImage) return;
    const match = currentGeneratedImage.match(/^data:(.+);base64,(.+)$/);
    if (match) {
      const [, type, base64] = match;
      const newModelImage = { base64, type };
      handleModelImageUpload(newModelImage);
      setAppMode('tryon');
    } else {
      setError('Could not use this image as the model. Invalid image format.');
    }
  },
  handleLoadFromUrlInput: async () => {
    const { clothingImageUrl, setIsUrlLoading, setError, setClothingImage } = get();
    if (!clothingImageUrl) return;
    setIsUrlLoading(true);
    setError(null);
    try {
        const image = await fetchImageAsUploadedImage(clothingImageUrl);
        setClothingImage(image);
    } catch (err) {
        const errorMsg = `Failed to load from URL. This may be a CORS issue. Try another URL or upload a file. Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
        setError(errorMsg);
    } finally {
        setIsUrlLoading(false);
    }
  },
  handleUseForMarketing: () => {
    // FIX: Property 'onNavigateToMarketing' does not exist on type 'StudioState'. Called global navigation action from appStore instead.
    const { baseGeneratedImages, activeImageIndex, setError } = get();
    const currentImage = baseGeneratedImages?.[activeImageIndex];
    if (!currentImage) return;
    const uploadedImage = dataUrlToUploadedImage(currentImage);
    if (uploadedImage) {
        useAppStore.getState().actions.navigateToMarketing(uploadedImage);
    } else {
        setError('Could not use image for marketing. Invalid format.');
    }
  },
  handleUseForVideo: () => {
      const { baseGeneratedImages, activeImageIndex, onNavigateToVideoGen, setError } = get();
      const currentImage = baseGeneratedImages?.[activeImageIndex];
      if (!currentImage) return;
      const uploadedImage = dataUrlToUploadedImage(currentImage);
      if (uploadedImage) {
          onNavigateToVideoGen(uploadedImage);
      } else {
          setError('Could not use image for video. Invalid format.');
      }
  },
});