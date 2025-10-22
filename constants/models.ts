// constants/models.ts

export const DEFAULT_IMAGE_GEN_MODEL = 'google:2@1';
export const DEFAULT_IMAGE_EDIT_MODEL = 'google:2@1';
export const DEFAULT_TEXT_GEN_MODEL = 'google/gemini-2.5-flash';
export const DEFAULT_VIDEO_GEN_MODEL = 'google:3.1@1';

// This map contains UI-specific or parameter information not suitable for the database schema.
// It will be merged with the models fetched from the database.
export const MODEL_SUPPORT_MAP: Record<string, any> = {
    // Google
    'google:1@1': { 
        negativePrompt: true, 
        steps: false, 
        cfgScale: false,
        aspectRatios: ['1:1', '16:9', '9:16', '21:9', '4:3', '3:4', '5:4', '4:5', '3:2', '2:3'] 
    },
    'google:2@1': { 
        negativePrompt: true, 
        steps: false, 
        cfgScale: false,
        aspectRatios: ['1:1', '16:9', '9:16', '21:9', '4:3', '3:4', '5:4', '4:5', '3:2', '2:3'] 
    },
    
    // FLUX Models (Negative prompt enabled per user request)
    'runware:101@1': { negativePrompt: true, steps: true, defaultSteps: 28, maxSteps: 50, cfgScale: false },
    'runware:100@1': { negativePrompt: true, steps: true, defaultSteps: 28, maxSteps: 50, cfgScale: false },
    'bfl:1@1': { negativePrompt: true, steps: true, defaultSteps: 20, maxSteps: 50, cfgScale: false },
    'bfl:2@1': { negativePrompt: true, steps: true, defaultSteps: 20, maxSteps: 50, cfgScale: false },

    // FLUX ControlNet Models
    'runware:25@1': { negativePrompt: true, steps: true, defaultSteps: 28, maxSteps: 50, cfgScale: true, defaultCfg: 7 },
    'runware:26@1': { negativePrompt: true, steps: true, defaultSteps: 28, maxSteps: 50, cfgScale: true, defaultCfg: 7 },
    'runware:27@1': { negativePrompt: true, steps: true, defaultSteps: 28, maxSteps: 50, cfgScale: true, defaultCfg: 7 },
    'runware:28@1': { negativePrompt: true, steps: true, defaultSteps: 28, maxSteps: 50, cfgScale: true, defaultCfg: 7 },
    'runware:29@1': { negativePrompt: true, steps: true, defaultSteps: 28, maxSteps: 50, cfgScale: true, defaultCfg: 7 },
    'runware:30@1': { negativePrompt: true, steps: true, defaultSteps: 28, maxSteps: 50, cfgScale: true, defaultCfg: 7 },
    'runware:31@1': { negativePrompt: true, steps: true, defaultSteps: 28, maxSteps: 50, cfgScale: true, defaultCfg: 7 },

    // Stable Diffusion Models
    'runwayml:1@1': { negativePrompt: true, steps: true, defaultSteps: 30, maxSteps: 150, cfgScale: true, defaultCfg: 7.5 },
    'stabilityai:21@1': { negativePrompt: true, steps: true, defaultSteps: 30, maxSteps: 150, cfgScale: true, defaultCfg: 7.5 },
    'civitai:4384@128713': { negativePrompt: true, steps: true, defaultSteps: 30, maxSteps: 150, cfgScale: true, defaultCfg: 7 },
    'civitai:2886@104708': { negativePrompt: true, steps: true, defaultSteps: 30, maxSteps: 150, cfgScale: true, defaultCfg: 7 },
    'civitai:2458@139557': { negativePrompt: true, steps: true, defaultSteps: 30, maxSteps: 150, cfgScale: true, defaultCfg: 7 },
    'civitai:1342@138431': { negativePrompt: true, steps: true, defaultSteps: 30, maxSteps: 150, cfgScale: true, defaultCfg: 7 },

    // SDXL ControlNet
    'runware:20@1': { negativePrompt: true, steps: true, defaultSteps: 30, maxSteps: 150, cfgScale: true, defaultCfg: 7.5 },

    // HiDream
    'runware:97@1': { negativePrompt: true, steps: true, defaultSteps: 40, maxSteps: 150, cfgScale: true, defaultCfg: 7 },
    'runware:97@2': { negativePrompt: true, steps: true, defaultSteps: 30, maxSteps: 150, cfgScale: true, defaultCfg: 7 },
    'runware:97@3': { negativePrompt: true, steps: true, defaultSteps: 25, maxSteps: 100, cfgScale: true, defaultCfg: 7 },
    
    // Ideogram
    'ideogram:4@1': { negativePrompt: true, steps: true, defaultSteps: 20, maxSteps: 50, cfgScale: true, defaultCfg: 7 },
    
    // Seedream
    'bytedance:3@1': { negativePrompt: true, steps: true, defaultSteps: 20, maxSteps: 50, cfgScale: true, defaultCfg: 7, aspectRatios: ['1:1', '16:9', '9:16', '3:2', '2:3'] },

    // Qwen - Updated with Runware AIR tags for I2I
    'alibaba:qwen-image@1': { negativePrompt: true, steps: true, defaultSteps: 30, maxSteps: 100, cfgScale: true, defaultCfg: 7.5, aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'] },
    'alibaba:qwen-image-edit@1': { negativePrompt: true, steps: true, defaultSteps: 30, maxSteps: 100, cfgScale: true, defaultCfg: 7.5, aspectRatios: null },
    'alibaba:qwen-image-lightning-4steps@1': { negativePrompt: false, steps: true, defaultSteps: 4, maxSteps: 10, cfgScale: true, defaultCfg: 7.5 },
    'alibaba:qwen-image-lightning-8steps@1': { negativePrompt: false, steps: true, defaultSteps: 8, maxSteps: 12, cfgScale: true, defaultCfg: 7.5 },
    'alibaba:qwen-image-edit-lightning@1': { negativePrompt: true, steps: true, defaultSteps: 8, maxSteps: 12, cfgScale: true, defaultCfg: 7.5, aspectRatios: null },
    'alibaba:qwen-image-edit-plus@1': { negativePrompt: true, aspectRatios: null },

    // Seedream from CivitAI - Updated with Runware AIR tags for I2I
    'bytedance:seedream-4.0@1': { aspectRatios: ['1:1', '16:9', '9:16', '3:2', '2:3'] },
    'bytedance:seededit-3.0@1': { aspectRatios: null },
    'bytedance:seedream-3.0@1': { aspectRatios: ['1:1', '16:9', '9:16', '3:2'] },
    
    // FLUX Kontext models for I2I
    'blackforestlabs:flux-kontext-dev@1': { negativePrompt: true, steps: true, defaultSteps: 28, maxSteps: 50, cfgScale: false, aspectRatios: ['3:7', '1:1', '7:3'] },
    'blackforestlabs:flux-kontext-pro@1': { negativePrompt: true, steps: true, defaultSteps: 20, maxSteps: 50, cfgScale: false, aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'] },
    'blackforestlabs:flux-kontext-max@1': { negativePrompt: true, steps: true, defaultSteps: 20, maxSteps: 50, cfgScale: false, aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'] },
    
    // Video Generation Models - Model-specific aspect ratios and features
    // Sora Models
    'openai:sora-2@1': { 
        negativePrompt: true, 
        firstLastFrame: 'both',
        aspectRatios: ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9', '9:21'] 
    },
    'openai:sora-2-pro@1': { 
        negativePrompt: true, 
        firstLastFrame: 'both',
        aspectRatios: ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9', '9:21'] 
    },
    
    // Wan Models
    'wan:2.5@1': { 
        negativePrompt: true, 
        firstLastFrame: 'first',
        aspectRatios: ['16:9', '9:16', '1:1', '4:3', '3:4'] 
    },
    
    // MiniMax Hailuo Models
    'minimax:hailuo-02@1': { 
        negativePrompt: 'limited', 
        firstLastFrame: 'first',
        aspectRatios: ['16:9', '1:1'] 
    },
    
    // Seedance Models
    'bytedance:1@0': { 
        negativePrompt: true, 
        firstLastFrame: 'both',
        aspectRatios: ['16:9', '9:16', '1:1', '4:3', '3:4', '3:2', '2:3'] 
    },
    'bytedance:1@1': { 
        negativePrompt: true, 
        firstLastFrame: 'both',
        aspectRatios: ['16:9', '9:16', '1:1', '4:3', '3:4', '3:2', '2:3'] 
    },
    
    // Kling Models
    'klingai:2.5-turbo@1': { 
        negativePrompt: 'limited', 
        firstLastFrame: 'first',
        aspectRatios: ['16:9', '9:16', '1:1'] 
    },
    'klingai:5@3': { 
        negativePrompt: 'limited', 
        firstLastFrame: 'first',
        aspectRatios: ['16:9', '9:16', '1:1'] 
    },
    'klingai:2.1-pro@1': { 
        negativePrompt: 'limited', 
        firstLastFrame: 'both',
        aspectRatios: ['16:9', '9:16', '1:1'] 
    },
    'klingai:2.1-std@1': { 
        negativePrompt: 'limited', 
        firstLastFrame: 'first',
        aspectRatios: ['16:9', '9:16', '1:1'] 
    },
    'klingai:1.6-pro@1': { 
        negativePrompt: 'limited', 
        firstLastFrame: 'first',
        aspectRatios: ['16:9', '9:16', '1:1'] 
    },
    'klingai:1.6-std@1': { 
        negativePrompt: 'limited', 
        firstLastFrame: 'first',
        aspectRatios: ['16:9', '9:16', '1:1'] 
    },
    'klingai:2.0-master@1': { 
        negativePrompt: 'limited', 
        firstLastFrame: 'first',
        aspectRatios: ['16:9', '9:16', '1:1'] 
    },
    
    // Google Veo Models
    'google:3.1@1': { 
        negativePrompt: 'limited', 
        firstLastFrame: 'both',
        aspectRatios: ['16:9', '9:16'] 
    },
    'google:3@1': { 
        negativePrompt: 'limited', 
        firstLastFrame: 'both',
        aspectRatios: ['16:9', '9:16'] 
    },
    'google:3@0': { 
        negativePrompt: 'limited', 
        firstLastFrame: 'both',
        aspectRatios: ['16:9', '9:16'] 
    },
    'google:2@0': { 
        negativePrompt: 'limited', 
        firstLastFrame: 'both',
        aspectRatios: ['16:9', '9:16'] 
    },
    
    // MiniMax Director Models
    'minimax:01@1': { 
        negativePrompt: 'limited', 
        firstLastFrame: 'first',
        aspectRatios: ['1:1', '16:9', '4:3', '3:2', '2:3', '3:4', '9:16', '21:9'] 
    },
    
    // Vidu Models
    'vidu:q1@1': { 
        negativePrompt: true, 
        firstLastFrame: 'both',
        aspectRatios: ['16:9', '9:16', '1:1', '4:3', '3:4'] 
    },
    'vidu:2.0@1': { 
        negativePrompt: true, 
        firstLastFrame: 'both',
        aspectRatios: ['16:9', '9:16', '1:1', '4:3', '3:4'] 
    },
    
    // PixVerse Models
    'pixverse:1@3': { 
        negativePrompt: true, 
        firstLastFrame: 'both',
        aspectRatios: ['16:9', '9:16', '1:1', '4:3', '3:4'] 
    },
};