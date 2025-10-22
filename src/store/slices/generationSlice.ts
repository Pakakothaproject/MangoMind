import type { StateCreator } from 'zustand';
import type { StudioState } from '../studioStore';
import type { InputType } from '../../types';
import { performTryOn } from '../../services/ai/tryOnService';
import { autoSwapScene, analyzeSwapScene, rephraseSceneDescriptionForStrictness, generateFromSceneDescriptionSimple } from '../../services/ai/sceneSwapService';
import { addHairstyle, changeHair, removeHair } from '../../services/ai/hairStyleService';
import { paraphraseDescription, refinePrompt, editImage } from '../../services/ai/imageService';
import { generateVideo } from '../../services/videoService';
import { restoreOriginalFace } from '../../services/mediaPipeService';
import { runwareService } from '../../services/runwareService';
import { useModelStore } from '../modelStore';

export interface GenerationSlice {
  loadingMessage: string | null;
  error: string | null;
  abortController: AbortController | null;
  streamingText: string | null;
  isStreamingFinal: boolean;
  editPrompt: string;
  accessoryPrompt: string;
  productPrompt: string;
  animationPrompt: string;
  isPoseLocked: boolean;
  isStrictFaceEnabled: boolean;
  isRephrasingEdit: boolean;
  tryOnPrompt: string;
  hairStylePrompt: string;
  sceneDescription: string | null;
  isAnalyzingScene: boolean;
  isTwoStepSceneSwap: boolean;
  isRephrasingScene: boolean;
  isSceneAnalyzed: boolean;
  aspectRatio: string;
  
  setLoadingMessage: (message: string | null) => void;
  setError: (error: string | null) => void;
  setStreamingText: (text: string | null) => void;
  setIsStreamingFinal: (isFinal: boolean) => void;
  setEditPrompt: (prompt: string) => void;
  setAccessoryPrompt: (prompt: string) => void;
  setProductPrompt: (prompt: string) => void;
  setAnimationPrompt: (prompt: string) => void;
  togglePoseLock: () => void;
  toggleStrictFace: () => void;
  setIsRephrasingEdit: (isRephrasing: boolean) => void;
  setTryOnPrompt: (prompt: string) => void;
  setHairStylePrompt: (prompt: string) => void;
  setSceneDescription: (description: string | null) => void;
  toggleTwoStepSceneSwap: () => void;
  setAspectRatio: (ratio: string) => void;

  handleGenerate: (inputType: InputType) => Promise<void>;
  handleStopGeneration: () => void;
  handleEditImage: () => Promise<void>;
  handleRephraseEditPrompt: () => Promise<void>;
  handleAccessorize: () => Promise<void>;
  handleStageProduct: () => Promise<void>;
  handleAnimateImage: () => Promise<void>;
  handleAutoSceneSwap: () => Promise<void>;
  handleAnalyzeScene: () => Promise<void>;
  handleRephraseSceneDescription: () => Promise<void>;
  handleGenerateSceneFromDescription: () => Promise<void>;
  handleHairStyle: () => Promise<void>;
  handleRemoveHair: () => Promise<void>;
  handleApplyInpaint: () => Promise<void>;
  handleCombineImages: () => Promise<void>;
}

export const createGenerationSlice: StateCreator<
  StudioState,
  [],
  [],
  GenerationSlice
> = (set, get) => ({
    loadingMessage: null,
    error: null,
    abortController: null,
    streamingText: null,
    isStreamingFinal: true,
    editPrompt: '',
    accessoryPrompt: '',
    productPrompt: '',
    animationPrompt: '',
    isPoseLocked: false,
    isStrictFaceEnabled: true,
    isRephrasingEdit: false,
    tryOnPrompt: '',
    hairStylePrompt: '',
    sceneDescription: null,
    isAnalyzingScene: false,
    isTwoStepSceneSwap: false,
    isRephrasingScene: false,
    isSceneAnalyzed: false,
    aspectRatio: '1:1',

    setLoadingMessage: (message) => set({ loadingMessage: message }),
    setError: (error) => set({ error }),
    setStreamingText: (text) => set({ streamingText: text }),
    setIsStreamingFinal: (isFinal) => set({ isStreamingFinal: isFinal }),
    setEditPrompt: (prompt) => set({ editPrompt: prompt }),
    setAccessoryPrompt: (prompt) => set({ accessoryPrompt: prompt }),
    setProductPrompt: (prompt) => set({ productPrompt: prompt }),
    setAnimationPrompt: (prompt) => set({ animationPrompt: prompt }),
    togglePoseLock: () => set(state => ({ isPoseLocked: !state.isPoseLocked })),
    toggleStrictFace: () => set(state => ({ isStrictFaceEnabled: !state.isStrictFaceEnabled })),
    setIsRephrasingEdit: (isRephrasing) => set({ isRephrasingEdit: isRephrasing }),
    setTryOnPrompt: (prompt) => set({ tryOnPrompt: prompt }),
    setHairStylePrompt: (prompt) => set({ hairStylePrompt: prompt }),
    setSceneDescription: (description) => set({ sceneDescription: description }),
    toggleTwoStepSceneSwap: () => set(state => ({ 
        isTwoStepSceneSwap: !state.isTwoStepSceneSwap,
        sceneDescription: null,
        isAnalyzingScene: false,
        isSceneAnalyzed: false,
    })),
    setAspectRatio: (ratio) => set({ aspectRatio: ratio }),

    handleGenerate: async (inputType) => {
        const { imageEditModel, textGenModel, originalModelImage, clothingImage, tryOnPrompt, updateHistory, aspectRatio } = get();
        if (!originalModelImage) {
            set({ error: 'Please upload a model image first.' });
            return;
        }

        const isTextPrompt = inputType === 'text';
        if (isTextPrompt && !tryOnPrompt) {
            set({ error: 'Please describe the clothing.' });
            return;
        }
        if (!isTextPrompt && !clothingImage) {
            set({ error: 'Please upload a clothing image.' });
            return;
        }

        const controller = new AbortController();
        set({ loadingMessage: 'Preparing assets...', error: null, abortController: controller });

        try {
            let results: string[];
            let finalPrompt: string;
            
            if (isTextPrompt) {
                set({ loadingMessage: 'Rephrasing your description...' });
                // FIX: Expected 2 arguments, but got 3.
                finalPrompt = await paraphraseDescription(textGenModel, tryOnPrompt);
                set({ loadingMessage: 'Placing clothing on model...' });
                // FIX: Expected 4-5 arguments, but got 6.
                results = await performTryOn(imageEditModel, originalModelImage, { base64: '', type: 'image/png' }, finalPrompt, aspectRatio);
            } else {
                finalPrompt = tryOnPrompt || "fitting the clothing to the model";
                set({ loadingMessage: 'Placing clothing on model...' });
                // FIX: Expected 4-5 arguments, but got 6.
                results = await performTryOn(imageEditModel, originalModelImage, clothingImage!, finalPrompt, aspectRatio);
            }

            updateHistory(results, finalPrompt);

        } catch (err) {
            set({ error: `Failed to generate try-on: ${err instanceof Error ? err.message : 'Unknown error'}` });
        } finally {
            set({ loadingMessage: null, abortController: null });
        }
    },
    handleStopGeneration: () => {
        get().abortController?.abort();
    },
    handleEditImage: async () => {
        const { imageEditModel, baseGeneratedImages, activeImageIndex, editPrompt, selectedPoint, updateHistory, originalModelImage, isStrictFaceEnabled, setStreamingText, setIsStreamingFinal, aspectRatio } = get();
        const currentImage = baseGeneratedImages?.[activeImageIndex];
        if (!currentImage || !editPrompt) return;

        const controller = new AbortController();
        set({ loadingMessage: 'Editing image...', error: null, abortController: controller });

        const onTextUpdate = (text: string, isFinal: boolean) => {
            setStreamingText(text);
            setIsStreamingFinal(isFinal);
        };

        try {
            // FIX: Expected 5-6 arguments, but got 7.
            const results = await editImage(imageEditModel, currentImage, editPrompt, onTextUpdate, selectedPoint, aspectRatio);
            
            if (results.length > 0) {
                 if (isStrictFaceEnabled && originalModelImage) {
                    set({ loadingMessage: "Restoring original face..." });
                    const restoredResults = await Promise.all(
                        results.map(res => restoreOriginalFace(originalModelImage, res))
                    );
                    updateHistory(restoredResults, editPrompt);
                } else {
                    updateHistory(results, editPrompt);
                }
            } else {
                if (!get().streamingText) {
                    throw new Error("The model did not return an image. It might have responded with text instead.");
                }
            }
        } catch (err) {
            set({ error: `Failed to edit image: ${err instanceof Error ? err.message : 'Unknown error'}` });
        } finally {
            set({ loadingMessage: null, abortController: null, editPrompt: '', selectedPoint: null });
        }
    },
    handleRephraseEditPrompt: async () => {
        const { textGenModel, editPrompt, setEditPrompt } = get();
        if (!editPrompt) return;
        set({ isRephrasingEdit: true });
        try {
            const rephrased = await refinePrompt(textGenModel, editPrompt);
            setEditPrompt(rephrased);
        } catch (err) {
            set({ error: `Failed to rephrase prompt: ${err instanceof Error ? err.message : 'Unknown error'}` });
        } finally {
            set({ isRephrasingEdit: false });
        }
    },
    handleAccessorize: async () => {},
    handleStageProduct: async () => {},
    handleAnimateImage: async () => {
        const { videoGenModel, animationPrompt, baseGeneratedImages, activeImageIndex, setGeneratedVideo } = get();
        const currentImage = baseGeneratedImages?.[activeImageIndex];
        if (!currentImage || !animationPrompt) return;

        const match = currentImage.match(/^data:(.+);base64,(.+)$/);
        if (!match) {
            set({ error: "Invalid image format for animation." });
            return;
        }
        const [, type, base64] = match;
        const uploadedImage = { base64, type };

        const controller = new AbortController();
        set({ loadingMessage: "Starting animation...", error: null, abortController: controller, activeStudioTab: 'animate' });
        
        try {
            const videoUrl = await generateVideo(videoGenModel, animationPrompt, uploadedImage, (msg) => set({ loadingMessage: msg }));
            setGeneratedVideo(videoUrl);
        } catch (err) {
             set({ error: `Failed to animate image: ${err instanceof Error ? err.message : 'Unknown error'}` });
        } finally {
             set({ loadingMessage: null, abortController: null });
        }
    },
    handleAutoSceneSwap: async () => {
        const { textGenModel, imageEditModel, originalModelImage, environmentImage, isPoseLocked, updateHistory, setLoadingMessage, setError, isSceneAnalyzed, sceneDescription, aspectRatio } = get();
        if (!originalModelImage || !environmentImage) {
            setError('Both a model and an environment image are required.');
            return;
        }
        const controller = new AbortController();
        set({ abortController: controller, error: null, isSceneAnalyzed: false, sceneDescription: null });

        try {
            setLoadingMessage('Analyzing target scene...');
            // FIX: Expected 6-8 arguments, but got 9.
            const results = await autoSwapScene(
                textGenModel, imageEditModel, originalModelImage, environmentImage,
                isPoseLocked, 1, setLoadingMessage, aspectRatio
            );
            updateHistory(results, "Auto Scene Swap");
        } catch (err) {
            set({
                error: err instanceof Error ? (err.message) : 'Unknown error during scene swap.',
                loadingMessage: null, // FIX: Clear loading message on error
            });
        } finally {
            set({ loadingMessage: null, abortController: null, isSceneAnalyzed: false, sceneDescription: null });
        }
    },
    handleAnalyzeScene: async () => {
        const { textGenModel, environmentImage, setError, setSceneDescription } = get();
        if (!environmentImage) {
            setError('An environment image is required for analysis.');
            return;
        }
        const controller = new AbortController();
        set({ abortController: controller, error: null, isAnalyzingScene: true, sceneDescription: null, isSceneAnalyzed: false });
    
        try {
            // FIX: Expected 2 arguments, but got 3.
            const description = await analyzeSwapScene(textGenModel, environmentImage);
            setSceneDescription(description);
            set({ isSceneAnalyzed: true });
        } catch (err) {
            setError(err instanceof Error ? `Analysis failed: ${err.message}` : 'Unknown error during scene analysis.');
            set({ isSceneAnalyzed: false });
        } finally {
            set({ isAnalyzingScene: false, abortController: null });
        }
    },
    handleRephraseSceneDescription: async () => {
        const { textGenModel, sceneDescription, setSceneDescription, setError } = get();
        if (!sceneDescription) return;

        const controller = new AbortController();
        set({ abortController: controller, isRephrasingScene: true, error: null });
        try {
            // FIX: Expected 2 arguments, but got 3.
            const rephrased = await rephraseSceneDescriptionForStrictness(textGenModel, sceneDescription);
            setSceneDescription(rephrased);
        } catch (err) {
            setError(err instanceof Error ? `Rephrasing failed: ${err.message}` : 'Unknown error during rephrasing.');
        } finally {
            set({ isRephrasingScene: false, abortController: null });
        }
    },
    handleGenerateSceneFromDescription: async () => {
        const { imageEditModel, originalModelImage, environmentImage, sceneDescription, isPoseLocked, updateHistory, setLoadingMessage, setError, aspectRatio } = get();
        if (!originalModelImage || !environmentImage || !sceneDescription) {
            setError('Model, environment, and a scene description are required.');
            return;
        }
        const controller = new AbortController();
        set({ abortController: controller, error: null, loadingMessage: 'Placing model into scene...' });
    
        try {
            // FIX: Expected 6-7 arguments, but got 8.
            const results = await generateFromSceneDescriptionSimple(
                imageEditModel, originalModelImage, environmentImage, sceneDescription,
                isPoseLocked, 1, aspectRatio
            );
            updateHistory(results, "Scene Swap");
        } catch (err) {
            set({
                error: err instanceof Error ? `Generation failed: ${err.message}` : 'Unknown error during scene generation.',
                loadingMessage: null, // FIX: Clear loading message on error
            });
        } finally {
            set({ loadingMessage: null, abortController: null, isSceneAnalyzed: false, sceneDescription: null });
        }
    },
    handleHairStyle: async () => {
        const { imageEditModel, originalModelImage, hairStyleImage, hairStylePrompt, isStrictFaceEnabled, updateHistory, setLoadingMessage, setError, aspectRatio } = get();
        if (!originalModelImage) {
            setError('A model image is required.');
            return;
        }
        const controller = new AbortController();
        set({ loadingMessage: 'Changing hairstyle...', error: null, abortController: controller });
        try {
            let results: string[];
            if (hairStyleImage) {
                // FIX: Expected 3-4 arguments, but got 5.
                results = await addHairstyle(imageEditModel, originalModelImage, hairStyleImage, aspectRatio);
            } else if (hairStylePrompt) {
                // FIX: Expected 3-4 arguments, but got 5.
                results = await changeHair(imageEditModel, originalModelImage, hairStylePrompt, aspectRatio);
            } else {
                throw new Error("Either a hairstyle image or a prompt is required.");
            }
            updateHistory(results, hairStylePrompt || 'Hairstyle change');
        } catch (err) {
            setError(err instanceof Error ? `Failed to change hair: ${err.message}` : 'Unknown error');
        } finally {
            set({ loadingMessage: null, abortController: null });
        }
    },
    handleRemoveHair: async () => {
        const { imageEditModel, originalModelImage, isStrictFaceEnabled, updateHistory, setLoadingMessage, setError, aspectRatio } = get();
        if (!originalModelImage) {
            setError('A model image is required.');
            return;
        }
        const controller = new AbortController();
        set({ loadingMessage: 'Removing hair...', error: null, abortController: controller });
        try {
            // FIX: Expected 2-3 arguments, but got 4.
            const results = await removeHair(imageEditModel, originalModelImage, aspectRatio);
            updateHistory(results, 'Remove hair');
        } catch (err) {
            setError(err instanceof Error ? `Failed to remove hair: ${err.message}` : 'Unknown error');
        } finally {
            set({ loadingMessage: null, abortController: null });
        }
    },
    handleApplyInpaint: async () => {
        // TODO: Implement a proper inpainting API call.
        console.warn("handleApplyInpaint is not fully implemented");
        set({ loadingMessage: "Inpainting (not implemented)..." });
        await new Promise(res => setTimeout(res, 2000));
        set({ loadingMessage: null, isInpainting: false });
        get().setInpaintMask(null);
    },
    handleCombineImages: async () => {
        const { imageEditModel, originalModelImage, environmentImage, editPrompt, updateHistory, setLoadingMessage, setError, aspectRatio } = get();
    
        if (!originalModelImage || !environmentImage) {
            setError('Please upload two images to combine.');
            return;
        }
        if (!editPrompt) {
            setError('Please provide a prompt to guide the combination.');
            return;
        }
    
        const controller = new AbortController();
        set({ loadingMessage: 'Combining images...', error: null, abortController: controller });
    
        try {
            const { models } = useModelStore.getState();
            const modelInfo = models.find(m => m.id === imageEditModel);
            if (!modelInfo) throw new Error(`Model info not found for ID: ${imageEditModel}`);
            
            const imagesToCombine = [originalModelImage, environmentImage];
            
            // FIX: Object literal may only specify known properties, and 'signal' does not exist
            const { images: results, text } = await runwareService.combineImages(editPrompt, imagesToCombine, { 
                modelInfo, 
                numberOfImages: 1,
                aspectRatio,
            });
            
            if (text && (!results || results.length === 0)) {
                get().setStreamingText(text);
                get().setIsStreamingFinal(true);
            }
            if (!results || results.length === 0) {
                if (!text) {
                    throw new Error("API returned no image data or text.");
                }
            }
    
            if (results && results.length > 0) {
                updateHistory(results, `Combine: ${editPrompt}`);
            }
    
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                setError('Generation was stopped.');
            } else {
                setError(`Failed to combine images: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
        } finally {
            set({ loadingMessage: null, abortController: null });
        }
    },
});
