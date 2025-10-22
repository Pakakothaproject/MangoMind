import { runwareService } from './runwareService';
import type { UploadedImage } from '../types';
import { supabase } from './supabaseClient';
import { useAppStore } from '../store/appStore';

const ANIMATION_MESSAGES = [
  "Submitting job to the video cluster...",
  "Initializing video model...",
  "Rendering frames...",
  "This can take a few minutes...",
  "Applying post-processing...",
  "Almost there..."
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateVideo = async (
  modelId: string,
  prompt: string,
  baseImage: UploadedImage | null,
  setLoadingMessage?: (message: string) => void,
  negativePrompt?: string,
  firstFrame?: UploadedImage | null,
  lastFrame?: UploadedImage | null,
): Promise<string> => { // returns direct video URL
  let messageIndex = 0;
  const updateMessage = () => {
      if (setLoadingMessage) {
        setLoadingMessage(ANIMATION_MESSAGES[messageIndex % ANIMATION_MESSAGES.length]);
        messageIndex++;
      }
  };
  
  setLoadingMessage?.(baseImage ? "Preparing image for animation..." : "Preparing video generation...");

  // 1. Create the task via Runware service
  const initialTask = await runwareService.generateVideo(prompt, {
    modelId,
    image: baseImage,
    negativePrompt,
    firstFrame,
    lastFrame,
  });

  const taskId = initialTask?.taskUUID;
  if (!taskId) {
    throw new Error("Failed to initiate video generation task with Runware.");
  }

  // 2. Start polling for the result
  messageIndex = 0;
  updateMessage();
  const messageInterval = setInterval(updateMessage, 10000);

  try {
    while (true) {
        
        await delay(5000); // Poll every 5 seconds

        const statusResult = await runwareService.getTaskStatus(taskId);
        const taskStatus = statusResult.data?.[0]?.status;

        if (taskStatus === 'SUCCESS') {
            const videoUrl = statusResult.data?.[0]?.output?.videoURL; 
            if (!videoUrl) {
                // Sometimes the key is different
                const alternativeUrl = statusResult.data?.[0]?.output?.videoUrl;
                if (!alternativeUrl) {
                    throw new Error("Video task succeeded but no video URL was found in the response.");
                }
            }
            
            // Log cost on success
            const cost = statusResult.data?.[0]?.cost?.totalCostUSD;
            if (cost) {
                const { error: rpcError } = await supabase.rpc('log_runware_usage_and_deduct_tokens', {
                    p_model_used: modelId,
                    p_feature: 'video-generation-runware',
                    p_cost_usd: cost
                });
                if (rpcError) console.error("Failed to log Runware video usage:", rpcError);
                else useAppStore.getState().actions.fetchTokenBalance();
            }

            return videoUrl || statusResult.data?.[0]?.output?.videoUrl;
        }

        if (taskStatus === 'FAILURE' || taskStatus === 'CANCELLED') {
            const errorReason = statusResult.data?.[0]?.output?.error || 'Unknown reason';
            throw new Error(`Video generation failed: ${errorReason}`);
        }
        // Otherwise, status is PENDING, IN_PROGRESS, etc., so we continue polling.
    }
  } finally {
      clearInterval(messageInterval);
  }
};