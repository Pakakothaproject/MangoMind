import { supabase } from './supabaseClient';
import type { ModelDefinition } from '../types';

let availableModelsCache: ModelDefinition[] | null = null;
let lastUserId: string | null = null;

// Export a function to clear the cache manually
export const clearModelsCache = () => {
    console.log('DEBUG: Manually clearing models cache');
    availableModelsCache = null;
    lastUserId = null;
};

export const getAllModels = async (): Promise<ModelDefinition[]> => {
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

    // Clear cache if force refresh is requested
    if (forceRefresh) {
        console.log('DEBUG: Force refresh - clearing model cache');
        availableModelsCache = null;
        lastUserId = null;
    }

    if (availableModelsCache && lastUserId === currentUserId) {
        console.log('DEBUG: Returning cached models:', availableModelsCache.length);
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

                // EMERGENCY FIX: Override the is_accessible flag based on user's package
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('current_package_id, package_expires_at')
                    .eq('id', user.id)
                    .single();

                if (profile?.current_package_id && new Date(profile.package_expires_at) > new Date()) {
                    // User has active package - get package models and override accessibility
                    const { data: pkg } = await supabase
                        .from('subscription_packages')
                        .select('enabled_models')
                        .eq('id', profile.current_package_id)
                        .single();

                    if (pkg?.enabled_models && pkg.enabled_models.length > 0) {
                        console.log('DEBUG: User has package with', pkg.enabled_models.length, 'models');
                        // Override is_accessible for package models
                        const correctedData = rpcData.map(model => ({
                            ...model,
                            is_accessible: pkg.enabled_models.includes(model.id)
                        }));
                        data = correctedData;
                        console.log('DEBUG: Overrode accessibility - now have', correctedData.filter(m => m.is_accessible).length, 'accessible models');
                    } else {
                        // Package exists but no enabled_models - give all models
                        console.log('DEBUG: Package has no specific models - giving all models');
                        const correctedData = rpcData.map(model => ({
                            ...model,
                            is_accessible: true
                        }));
                        data = correctedData;
                    }
                } else {
                    // No active package - keep original logic
                    data = rpcData?.filter((model: any) => model.is_accessible === true) || [];
                }

                console.log(`DEBUG: Filtered to ${data.length} accessible models`);
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
