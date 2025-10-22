import { supabase } from './supabaseClient';
import type { ModelDefinition } from '../types';

let availableModelsCache: ModelDefinition[] | null = null;
let lastUserId: string | null = null;

export const getAllModels = async (forceRefresh = false): Promise<ModelDefinition[]> => {
    try {
        // Get all models regardless of active status or user access
        const { data: modelsData, error } = await supabase
            .from('models')
            .select('*');
        
        if (error) {
            console.error('getAllModels - Models query error:', error);
            throw error;
        }
        
        const models = (modelsData as ModelDefinition[]) || [];
        return models;
    } catch (error) {
        console.error("Failed to fetch all models, returning empty list.", error);
        return [];
    }
};

export const getAvailableModels = async (forceRefresh = false): Promise<ModelDefinition[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id || 'anonymous';
    
    if (availableModelsCache && !forceRefresh && lastUserId === currentUserId) {
        return availableModelsCache;
    }

    try {
        let data;
        
        if (user) {
            // Authenticated user - use RPC for access control
            console.log('DEBUG: Fetching models for authenticated user via RPC');
            const { data: rpcData, error } = await supabase.rpc('get_my_enabled_models');
            
            if (error) {
                console.error('getAvailableModels - RPC error:', error);
                // Fallback to active models if RPC fails
                console.log('DEBUG: RPC failed, falling back to active models');
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('models')
                    .select('*')
                    .eq('is_active', true);
                
                if (fallbackError) {
                    console.error('getAvailableModels - Fallback query error:', fallbackError);
                    throw fallbackError;
                }
                
                data = fallbackData;
            } else {
                console.log(`DEBUG: RPC returned ${rpcData?.length || 0} models`);
                data = rpcData;
            }
        } else {
            // Anonymous user - get all active models
            console.log('DEBUG: Fetching models for anonymous user');
            const { data: modelsData, error } = await supabase
                .from('models')
                .select('*')
                .eq('is_active', true);
            
            if (error) {
                console.error('getAvailableModels - Models query error:', error);
                throw error;
            }
            
            console.log(`DEBUG: Anonymous query returned ${modelsData?.length || 0} models`);
            data = modelsData;
        }
        
        const models = (data as ModelDefinition[]) || [];
        console.log(`DEBUG: Final models count: ${models.length}`);
        availableModelsCache = models;
        lastUserId = currentUserId;
        return models;
    } catch (error) {
        console.error("Failed to fetch available models for user, returning empty list.", error);
        // On error, return an empty list to prevent crashes.
        return [];
    }
};
