// services/ai/tryOnService.ts
import type { UploadedImage } from '../../types';
import { runwareService } from '../runwareService';
import { useModelStore } from '../../store/modelStore';

export const performTryOn = async (
  model: string,
  modelImage: UploadedImage,
  clothingImage: UploadedImage,
  prompt: string,
  aspectRatio?: string,
): Promise<string[]> => {
  const { models } = useModelStore.getState();
  const modelInfo = models.find(m => m.id === model);
  if (!modelInfo) {
    throw new Error(`Model info not found for ID: ${model}`);
  }

  const textPrompt = `You are an expert virtual try-on AI. Your task is to realistically place the clothing from the provided clothing image onto the person in the model image.

**Instructions:**
1.  **Analyze Model:** Identify the person in the model image, paying close attention to their pose, body shape, and lighting.
2.  **Analyze Clothing:** Identify the garment in the clothing image.
3.  **Composite:** Place the garment onto the person. The clothing must realistically drape and conform to the person's body and pose. Match the lighting of the original model image.
4.  **Refine:** Ensure the final image is seamless and photorealistic.

**User's specific request:** "${prompt}"

**CRITICAL RULES:**
-   Preserve the model's exact face, identity, and physical features.
-   The final output must be a single, seamless, photorealistic image.`;

  const imagesToCombine = [modelImage, clothingImage];

  const { images: results, text } = await runwareService.combineImages(textPrompt, imagesToCombine, {
    modelInfo,
    numberOfImages: 1,
    aspectRatio,
  });

  if (text && (!results || results.length === 0)) {
    throw new Error(`Model returned a text response instead of an image: ${text}`);
  }

  if (!results || results.length === 0) {
    throw new Error("API returned no image data.");
  }

  return results;
};