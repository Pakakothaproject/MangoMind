import type { UploadedImage } from '../../types';
import { runwareService } from '../runwareService';
import { useModelStore } from '../../store/modelStore';

export const addHairstyle = async (
  model: string,
  modelImage: UploadedImage,
  hairStyleImage: UploadedImage,
  aspectRatio?: string,
): Promise<string[]> => {
  const { models } = useModelStore.getState();
  const modelInfo = models.find(m => m.id === model);
  if (!modelInfo) {
    throw new Error(`Model info not found for ID: ${model}`);
  }

  const prompt = `You are an expert hairstylist AI. Place the hairstyle from the second image onto the person in the first image. Preserve the person's face and identity perfectly. The final image should be photorealistic and seamless.`;
  const imagesToCombine = [modelImage, hairStyleImage];

  const { images: results, text } = await runwareService.combineImages(prompt, imagesToCombine, {
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

export const changeHair = async (
  model: string,
  modelImage: UploadedImage,
  prompt: string,
  aspectRatio?: string,
): Promise<string[]> => {
  const { models } = useModelStore.getState();
  const modelInfo = models.find(m => m.id === model);
  if (!modelInfo) {
    throw new Error(`Model info not found for ID: ${model}`);
  }

  const textPrompt = `You are an expert hairstylist AI. Change the hair of the person in the image as described. Preserve the person's face and identity perfectly. Description: "${prompt}". The final image should be photorealistic and seamless.`;
  const imagesToCombine = [modelImage];

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

export const removeHair = async (
  model: string,
  modelImage: UploadedImage,
  aspectRatio?: string,
): Promise<string[]> => {
  const { models } = useModelStore.getState();
  const modelInfo = models.find(m => m.id === model);
  if (!modelInfo) {
    throw new Error(`Model info not found for ID: ${model}`);
  }

  const prompt = `You are an expert photo editor. Make the person in the image completely bald. Preserve their face and identity perfectly. The final result should be photorealistic and seamless.`;
  const imagesToCombine = [modelImage];

  const { images: results, text } = await runwareService.combineImages(prompt, imagesToCombine, {
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