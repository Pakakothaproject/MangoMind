// services/runwareService.ts
import { supabase, supabaseUrl } from './supabaseClient';
import type { UploadedImage } from '../types';
import type { ExtendedModelDefinition } from '../store/modelStore';
import { useAppStore } from '../store/appStore';
import { resizeImage } from '../utils/image';

const API_PROXY_URL = `${supabaseUrl}/functions/v1/runware`;
const MAX_IMAGE_DIMENSION = 1024; // Max width/height for uploaded images

const ASPECT_RATIO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '3:2': { width: 1248, height: 832 },
  '2:3': { width: 832, height: 1248 },
  '4:3': { width: 1184, height: 864 },
  '3:4': { width: 864, height: 1184 },
  '5:4': { width: 1152, height: 896 },
  '4:5': { width: 896, height: 1152 },
  '16:9': { width: 1344, height: 768 },
  '9:16': { width: 768, height: 1344 },
  '21:9': { width: 1536, height: 672 },
};

type ModelInfo = ExtendedModelDefinition;

class RunwareService {
  private async getAuthHeader(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("User not authenticated.");
    }
    return `Bearer ${session.access_token}`;
  }

  public async generateImageFromText(
    prompt: string,
    options: {
        modelInfo: ModelInfo;
        negativePrompt?: string;
        steps?: number;
        cfgScale?: number;
        numberOfImages?: 1 | 2 | 3 | 4;
        aspectRatio?: string;
    }
  ): Promise<{ images: string[], text?: string }> {
    const taskUUID = crypto.randomUUID();

    const dimensions = options.aspectRatio ? ASPECT_RATIO_DIMENSIONS[options.aspectRatio] : { width: 1024, height: 1024 };

    const payload: any = {
      taskType: "imageInference",
      taskUUID: taskUUID,
      model: options.modelInfo.id,
      positivePrompt: prompt,
      width: dimensions.width,
      height: dimensions.height,
      numberResults: options.numberOfImages || 1,
      deliveryMethod: "sync",
      includeCost: true,
      outputType: "dataURI"
    };
    
    if (options.modelInfo.supports.negativePrompt && options.negativePrompt) {
        payload.negativePrompt = options.negativePrompt;
    }
    if (options.modelInfo.supports.steps && options.steps) {
        payload.steps = options.steps;
    }
    if (options.modelInfo.supports.cfgScale && options.cfgScale !== undefined) {
        payload.CFGScale = options.cfgScale;
    }
    
    const requestBody = [payload];

    try {
      const authHeader = await this.getAuthHeader();
      const response = await fetch(API_PROXY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
          console.error("Runware proxy returned non-JSON:", responseText);
          throw new Error(`Runware API proxy returned an invalid response (status ${response.status}).`);
      }

      if (!response.ok) {
        const errorMessage = result.errors?.[0]?.message || result.error || 'Unknown Runware API error.';
        throw new Error(errorMessage);
      }
      
      const taskResult = result.data?.[0];

      if (taskResult?.cost?.totalCostUSD) {
          const { error: rpcError } = await supabase.rpc('log_runware_usage_and_deduct_tokens', {
              p_model_used: options.modelInfo.id,
              p_feature: 'image-generation-runware',
              p_cost_usd: taskResult.cost.totalCostUSD
          });
          if (rpcError) {
              console.error("Failed to log Runware usage and deduct tokens:", rpcError);
          } else {
              useAppStore.getState().actions.fetchTokenBalance();
          }
      }
      
      const images: string[] = [];
      const imagesArray = taskResult?.images;
      const singleImageDataURI = taskResult?.imageDataURI;
      const singleImage = taskResult?.image;
      if (imagesArray && Array.isArray(imagesArray)) images.push(...imagesArray);
      if (singleImageDataURI) images.push(singleImageDataURI);
      if (singleImage) images.push(singleImage);

      const preGenerationText = taskResult?.text;

      if (images.length === 0 && !preGenerationText) {
          if (taskResult?.errors?.[0]?.message) {
              throw new Error(taskResult.errors[0].message);
          }
          throw new Error("API response was successful but contained no image data or text.");
      }

      return { images, text: preGenerationText };

    } catch (error) {
      console.error("Runware generation failed:", error);
      throw error;
    }
  }

  public async combineImages(
    prompt: string,
    images: UploadedImage[],
    options: {
        modelInfo: ModelInfo;
        numberOfImages?: 1 | 2;
        aspectRatio?: string;
    }
  ): Promise<{ images: string[], text?: string }> {
    if (images.length === 0) {
      throw new Error("At least one image is required for combine/swap operations.");
    }
    
    // Resize images before uploading to prevent payload size errors.
    const resizedImages = await Promise.all(
        images.map(img => resizeImage(img, MAX_IMAGE_DIMENSION))
    );

    const authHeader = await this.getAuthHeader();
    
    const uploadTasks = resizedImages.map(image => ({
      taskType: "imageUpload",
      taskUUID: crypto.randomUUID(),
      image: `data:${image.type};base64,${image.base64}`
    }));

    const uploadResponse = await fetch(API_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": authHeader },
      body: JSON.stringify(uploadTasks),
    });
    
    if (!uploadResponse.ok) {
      const errorBody = await uploadResponse.text();
      throw new Error(`Runware image upload failed: ${uploadResponse.status} ${uploadResponse.statusText}. Response: ${errorBody}`);
    }

    const uploadResult = await uploadResponse.json();
    const imageUUIDs = uploadResult.data?.map((d: any) => d.imageUUID);

    if (!imageUUIDs || imageUUIDs.length !== images.length) {
      throw new Error("Failed to get image UUIDs from Runware.");
    }

    const inferenceTask: any = {
      taskType: "imageInference",
      taskUUID: crypto.randomUUID(),
      model: options.modelInfo.id,
      positivePrompt: prompt,
      referenceImages: imageUUIDs,
      numberResults: options.numberOfImages || 1,
      deliveryMethod: "sync",
      outputType: "dataURI",
      includeCost: true,
    };

    if (options.aspectRatio && options.modelInfo.supports.aspectRatios) {
      const dimensions = ASPECT_RATIO_DIMENSIONS[options.aspectRatio];
      if (dimensions) {
        inferenceTask.width = dimensions.width;
        inferenceTask.height = dimensions.height;
      }
    }

    const inferenceResponse = await fetch(API_PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": authHeader },
        body: JSON.stringify([inferenceTask]),
    });

    const result = await inferenceResponse.json();

    if (!inferenceResponse.ok) {
        const errorMessage = result.errors?.[0]?.message || result.error || 'Unknown Runware API error.';
        throw new Error(errorMessage);
    }
    
    const taskResult = result.data?.[0];

    if (taskResult?.cost?.totalCostUSD) {
         const { error: rpcError } = await supabase.rpc('log_runware_usage_and_deduct_tokens', {
            p_model_used: options.modelInfo.id,
            p_feature: 'image-combination-runware',
            p_cost_usd: taskResult.cost.totalCostUSD
        });
        if (rpcError) {
            console.error("Failed to log Runware usage and deduct tokens:", rpcError);
        } else {
            useAppStore.getState().actions.fetchTokenBalance();
        }
    }

    // FIX: Renamed 'images' to 'resultImages' to avoid conflict with the function parameter 'images'.
    const resultImages: string[] = [];
    const imagesArray = taskResult?.images;
    const singleImageDataURI = taskResult?.imageDataURI;
    const singleImage = taskResult?.image;
    if (imagesArray && Array.isArray(imagesArray)) resultImages.push(...imagesArray);
    if (singleImageDataURI) resultImages.push(singleImageDataURI);
    if (singleImage) resultImages.push(singleImage);
    
    const preGenerationText = taskResult?.text;

    if (resultImages.length === 0 && !preGenerationText) {
        if (taskResult?.errors?.[0]?.message) {
            throw new Error(taskResult.errors[0].message);
        }
        throw new Error("API response was successful but contained no image data or text.");
    }

    return { images: resultImages, text: preGenerationText };
  }
  
  public async generateVideo(
    prompt: string,
    options: {
        modelId: string;
        image?: UploadedImage | null;
        aspectRatio?: string;
        negativePrompt?: string;
        firstFrame?: UploadedImage | null;
        lastFrame?: UploadedImage | null;
    }
  ): Promise<any> { // Returns the initial task response
    const authHeader = await this.getAuthHeader();
    let imageUUIDs: string[] = [];
    let firstFrameUUID: string | null = null;
    let lastFrameUUID: string | null = null;

    // Upload base image for I2V
    if (options.image) {
        const resizedImage = await resizeImage(options.image, MAX_IMAGE_DIMENSION);
        const uploadTask = {
          taskType: "imageUpload",
          taskUUID: crypto.randomUUID(),
          image: `data:${resizedImage.type};base64,${resizedImage.base64}`
        };
        const uploadResponse = await fetch(API_PROXY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": authHeader },
          body: JSON.stringify([uploadTask]),
        });
        if (!uploadResponse.ok) {
            const errorBody = await uploadResponse.text();
            throw new Error(`Runware image upload for video failed: ${uploadResponse.status} ${uploadResponse.statusText}. Response: ${errorBody}`);
        }
        const uploadResult = await uploadResponse.json();
        const uuid = uploadResult.data?.[0]?.imageUUID;
        if (!uuid) throw new Error("Failed to get image UUID from Runware for video task.");
        imageUUIDs.push(uuid);
    }

    // Upload first frame
    if (options.firstFrame) {
        const resizedImage = await resizeImage(options.firstFrame, MAX_IMAGE_DIMENSION);
        const uploadTask = {
          taskType: "imageUpload",
          taskUUID: crypto.randomUUID(),
          image: `data:${resizedImage.type};base64,${resizedImage.base64}`
        };
        const uploadResponse = await fetch(API_PROXY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": authHeader },
          body: JSON.stringify([uploadTask]),
        });
        if (!uploadResponse.ok) {
            const errorBody = await uploadResponse.text();
            throw new Error(`Runware first frame upload failed: ${uploadResponse.status} ${uploadResponse.statusText}. Response: ${errorBody}`);
        }
        const uploadResult = await uploadResponse.json();
        const uuid = uploadResult.data?.[0]?.imageUUID;
        if (!uuid) throw new Error("Failed to get first frame UUID from Runware.");
        firstFrameUUID = uuid;
    }

    // Upload last frame
    if (options.lastFrame) {
        const resizedImage = await resizeImage(options.lastFrame, MAX_IMAGE_DIMENSION);
        const uploadTask = {
          taskType: "imageUpload",
          taskUUID: crypto.randomUUID(),
          image: `data:${resizedImage.type};base64,${resizedImage.base64}`
        };
        const uploadResponse = await fetch(API_PROXY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": authHeader },
          body: JSON.stringify([uploadTask]),
        });
        if (!uploadResponse.ok) {
            const errorBody = await uploadResponse.text();
            throw new Error(`Runware last frame upload failed: ${uploadResponse.status} ${uploadResponse.statusText}. Response: ${errorBody}`);
        }
        const uploadResult = await uploadResponse.json();
        const uuid = uploadResult.data?.[0]?.imageUUID;
        if (!uuid) throw new Error("Failed to get last frame UUID from Runware.");
        lastFrameUUID = uuid;
    }

    const payload: any = {
      taskType: "videoInference",
      taskUUID: crypto.randomUUID(),
      model: options.modelId,
      positivePrompt: prompt,
      numberResults: 1,
      deliveryMethod: "poll",
      includeCost: true,
      outputType: "URL"
    };

    if (imageUUIDs.length > 0) {
        payload.referenceImages = imageUUIDs;
    }

    if (options.negativePrompt) {
        payload.negativePrompt = options.negativePrompt;
    }

    if (firstFrameUUID) {
        payload.firstFrameImage = firstFrameUUID;
    }

    if (lastFrameUUID) {
        payload.lastFrameImage = lastFrameUUID;
    }

    const requestBody = [payload];
    
    const response = await fetch(API_PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": authHeader },
        body: JSON.stringify(requestBody),
    });
    
    const result = await response.json();
    if (!response.ok) {
        const errorMessage = result.errors?.[0]?.message || result.error || 'Unknown Runware API error.';
        throw new Error(errorMessage);
    }
    
    return result.data?.[0];
  }
  
  public async getTaskStatus(taskId: string): Promise<any> {
    const authHeader = await this.getAuthHeader();
    // FIX: Replaced undefined variable `API_URL` with the correct proxy URL constant `API_PROXY_URL`.
    const pollUrl = `${API_PROXY_URL}?taskId=${taskId}`;
    
    const response = await fetch(pollUrl, {
        method: 'GET',
        headers: { "Authorization": authHeader }
    });

    if (!response.ok) {
        throw new Error(`Failed to poll Runware task status: ${response.statusText}`);
    }

    return response.json();
  }
}

export const runwareService = new RunwareService();