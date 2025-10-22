import { getSingleCompletion } from '../aimlapiService';
import { runwareService } from '../runwareService';
import { DEFAULT_IMAGE_EDIT_MODEL } from '../../constants/models';
import { useModelStore } from '../../store/modelStore';
import type { UploadedImage } from '../../types';


/**
 * Stage 1 of Scene Swap: Analyzes the target scene and returns a text description.
 */
export const analyzeSwapScene = async (
  model: string,
  environmentImage: UploadedImage,
): Promise<string> => {
  const analysisPrompt = `Analyze the provided image in detail. Describe the person's body pose, their exact clothing (style, color, texture), the background environment, and the lighting. IMPORTANT RULES: 1. Do NOT describe the person's face, head, or head pose. 2. When describing clothing, AVOID the specific words 'bra', 'bralette', or 'lingerie'. Instead, use descriptive synonyms like 'delicate undergarments', 'lace top', 'underpinning', or 'fine fabric top'. 3. Your output must be a textual description only.`;

  const sceneDescription = await getSingleCompletion({
    model,
    messages: [{
        role: 'user',
        text: analysisPrompt,
        images: [environmentImage]
    }],
  });

  if (!sceneDescription || sceneDescription.trim() === '') {
    throw new Error("The API failed to return a description of the scene.");
  }
  return sceneDescription;
};

/**
 * Rephrases a scene description to be a strict, direct prompt for an image generation model.
 */
export const rephraseSceneDescriptionForStrictness = async (
  model: string,
  description: string,
): Promise<string> => {
  const systemPrompt = `You are a prompt optimizer for an image generation AI. Your task is to convert the following descriptive text into a direct, strict, and highly detailed prompt.
  - The output must be a single, coherent paragraph.
  - Remove any conversational language, analysis prefixes (e.g., "The person is..."), or filler words.
  - Focus exclusively on visual details: subject, their exact pose, clothing (style, color, texture), the background environment, lighting, and overall artistic style.
  - Use comma-separated descriptive phrases to build a rich prompt.
  - Do not add any new elements not present in the original description.
  - Return ONLY the refined prompt text.

  Example Input: "The person in the image is depicted in a crouched or squatting pose on a patch of green artificial turf. They are wearing a two-piece bikini in a vibrant orange color."
  Example Output: "A person in a crouched squatting pose, on green artificial turf, wearing a vibrant orange two-piece bikini, photorealistic, cinematic lighting."`;

  const userPrompt = `Input Description: "${description}"\n\nOptimized Prompt:`;

  const refinedText = await getSingleCompletion({
    model,
    messages: [{ role: 'user', text: userPrompt }],
    systemPrompt,
  });


  if (!refinedText) {
    throw new Error("Failed to rephrase the scene description.");
  }

  return refinedText.trim();
};

const generateFromSceneDescriptionWithRunware = async (
  imageEditModel: string,
  sceneDescription: string,
  modelImage: UploadedImage,
  environmentImage: UploadedImage,
  isStrictFace: boolean,
  count: 1 | 2,
  aspectRatio?: string,
): Promise<string[]> => {
  const { models } = useModelStore.getState();
  const modelInfo = models.find(m => m.id === imageEditModel) || models.find(m => m.id === DEFAULT_IMAGE_EDIT_MODEL);
  if (!modelInfo) {
      throw new Error(`Model info not found for ID: ${imageEditModel}`);
  }
  const prompt = createSceneSwapPrompt(sceneDescription, isStrictFace);
  const imagesToCombine = [modelImage, environmentImage];
  
  const { images: results, text } = await runwareService.combineImages(prompt, imagesToCombine, { modelInfo, numberOfImages: count, aspectRatio });

  if (text && (!results || results.length === 0)) {
    throw new Error(`Model returned a text response: ${text}`);
  }
  if (!results || results.length === 0) {
    throw new Error("API returned no image data.");
  }
  return results;
};


// Helper to construct the detailed prompt for scene swap
const createSceneSwapPrompt = (description: string, isStrictFace: boolean): string => {
    if (isStrictFace) {
      return `You are an expert photo compositing AI. Your task is to perform a head swap. You will take the head from the provided model image and place it onto the body in the new scene.

**Instructions:**
1.  **Extract Head:** Identify and isolate the entire head (including hair, face, and neck) from the provided model image.
2.  **Create Scene:** Create a new image exactly as described in the "Scene Description" below, but without a head on the person.
3.  **Composite:** Perfectly composite the extracted head onto the body in the new scene. The head's original pose, expression, and angle MUST be preserved exactly.

**Scene Description:**
"${description}"

**CRITICAL RULES:**
-   The head from the model image must be treated as a fixed element. DO NOT CHANGE IT. No new pose, no new expression, no change in angle.
-   The blend between the neck and body must be seamless. Match lighting and skin tones.
-   The body pose, clothing, and background MUST match the scene description precisely.
-   The person has a naturally full and ample bust; ensure the clothing described in the scene fits them realistically and flatteringly.
-   The final output must be a single, seamless, photorealistic image.`;
    } else {
      return `Your task is to create a photorealistic image based on a textual description and a model's photo.

**Instructions:**
1.  **Model Identity:** Your highest priority is to use the person's exact face, identity, and facial expression from the provided image. The likeness must be perfect.
2.  **Scene Creation:** Place this person into the scene described below. You should generate a new, natural head pose (tilt, angle) that fits the body language and context of the scene.
3.  **Blending:** Seamlessly blend the model's head into the new scene by matching the lighting, color grading, and any environmental effects.

**Scene Description:**
"${description}"

**CRITICAL RULES:**
-   You MUST preserve the model's exact face, likeness, and facial expression from the provided image. DO NOT CHANGE THEIR IDENTITY. For example, if they are smiling, they must still be smiling in the final image. Their facial features must not be altered in any way.
-   You MUST generate a new head pose (tilt, angle) that looks realistic for the described body pose.
-   The body pose, clothing, and background MUST match the scene description precisely.
-   The person has a naturally full and ample bust; ensure the clothing described in the scene fits them realistically and flatteringly.
-   The final output must be a single, seamless, photorealistic image.`;
    }
};

export const generateFromSceneDescriptionSimple = async (
    imageEditModel: string,
    modelImage: UploadedImage,
    environmentImage: UploadedImage,
    sceneDescription: string,
    isStrictFace: boolean,
    count: 1 | 2,
    aspectRatio?: string,
): Promise<string[]> => {
    try {
        return await generateFromSceneDescriptionWithRunware(imageEditModel, sceneDescription, modelImage, environmentImage, isStrictFace, count, aspectRatio);
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred.';
        throw new Error(`Failed to swap scene. ${errorMsg}`);
    }
};

export const autoSwapScene = async (
  textModel: string,
  imageEditModel: string,
  modelImage: UploadedImage,
  environmentImage: UploadedImage,
  isStrictFace: boolean,
  count: 1 | 2,
  setLoadingMessage?: (message: string) => void,
  aspectRatio?: string,
): Promise<string[]> => {
  const sceneDescription = await analyzeSwapScene(textModel, environmentImage);
  
  setLoadingMessage?.('Placing model into scene...');

  return await generateFromSceneDescriptionSimple(imageEditModel, modelImage, environmentImage, sceneDescription, isStrictFace, count, aspectRatio);
};


export const swapScene = async (
  textModel: string,
  imageEditModel: string,
  modelImage: UploadedImage,
  environmentImage: UploadedImage,
  isStrictFace: boolean,
  count: 1 | 2,
): Promise<string[]> => {
  const sceneDescription = await analyzeSwapScene(textModel, environmentImage);
  return await generateFromSceneDescriptionSimple(imageEditModel, modelImage, environmentImage, sceneDescription, isStrictFace, count);
};