import { create } from 'zustand';
import { getAvailableModels, getAllModels, clearModelsCache } from '../services/configService';
import { MODEL_SUPPORT_MAP } from '../constants/models';
import type { ModelDefinition } from '../types';

export interface ExtendedModelDefinition extends ModelDefinition {
    supports: {
        negativePrompt?: boolean;
        steps?: boolean;
        defaultSteps?: number;
        maxSteps?: number;
        cfgScale?: boolean;
        defaultCfg?: number;
        aspectRatios?: string[] | null;
    }
}

interface ModelStoreState {
    models: ExtendedModelDefinition[];
    allModels: ExtendedModelDefinition[];
    isLoading: boolean;
    actions: {
        fetchModels: () => Promise<void>;
        fetchAllModels: () => Promise<void>;
        clearCache: () => void;
    };
}

export const useModelStore = create<ModelStoreState>((set, get) => ({
    models: [],
    allModels: [],
    isLoading: true,
    actions: {
        fetchModels: async () => {
            if (!get().isLoading) {
                set({ isLoading: true });
            }
            try {
                const dbModels = await getAvailableModels(true); // Force refresh on fetch
                console.log('DEBUG modelStore: Fetched models from DB:', dbModels.length);
                const mergedModels = dbModels.map(model => ({
                    ...model,
                    supports: MODEL_SUPPORT_MAP[model.id] || {}, // Merge supports info
                }));
                console.log('DEBUG modelStore: Setting models in store:', mergedModels.length);
                set({ models: mergedModels, isLoading: false });
            } catch (error) {
                console.error("Failed to fetch models:", error);
                set({ isLoading: false, models: [] });
            }
        },
        fetchAllModels: async () => {
            try {
                const allDbModels = await getAllModels();
                console.log('DEBUG modelStore: Fetched ALL models from DB:', allDbModels.length);
                const mergedAllModels = allDbModels.map(model => ({
                    ...model,
                    supports: MODEL_SUPPORT_MAP[model.id] || {},
                }));
                console.log('DEBUG modelStore: Setting ALL models in store:', mergedAllModels.length);
                set({ allModels: mergedAllModels });
            } catch (error) {
                console.error("Failed to fetch all models:", error);
            }
        },
        clearCache: () => {
            console.log('DEBUG modelStore: Clearing cache and refetching models');
            clearModelsCache();
            get().actions.fetchModels();
        },
    },
}));