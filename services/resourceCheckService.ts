// services/resourceCheckService.ts
import { supabase } from './supabaseClient';
import { useAppStore } from '../store/appStore';

// Minimum storage requirements in bytes
export const MIN_IMAGE_STORAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MIN_VIDEO_STORAGE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface ResourceCheckResult {
    canProceed: boolean;
    reason?: 'insufficient_tokens' | 'insufficient_storage' | 'ok';
    tokensNeeded?: number;
    storageNeeded?: number;
    currentTokens?: number;
    currentStorage?: number;
    storageLimit?: number;
}

/**
 * Check if user has sufficient tokens for an operation
 */
export const checkTokenAvailability = async (requiredTokens: number): Promise<ResourceCheckResult> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { canProceed: false, reason: 'insufficient_tokens' };
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('token_balance')
        .eq('id', user.id)
        .single();

    if (error || !data) {
        console.error('Error checking token balance:', error);
        return { canProceed: false, reason: 'insufficient_tokens' };
    }

    const currentTokens = data.token_balance || 0;
    
    if (currentTokens < requiredTokens) {
        return {
            canProceed: false,
            reason: 'insufficient_tokens',
            tokensNeeded: requiredTokens - currentTokens,
            currentTokens,
        };
    }

    return {
        canProceed: true,
        reason: 'ok',
        currentTokens,
    };
};

/**
 * Check if user has sufficient storage space
 */
export const checkStorageAvailability = async (requiredBytes: number): Promise<ResourceCheckResult> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { canProceed: false, reason: 'insufficient_storage' };
    }

    const state = useAppStore.getState();
    const currentStorage = state.storageUsageBytes;
    const storageLimit = state.profile?.storage_limit_bytes || 0;

    const availableStorage = storageLimit - currentStorage;

    if (availableStorage < requiredBytes) {
        return {
            canProceed: false,
            reason: 'insufficient_storage',
            storageNeeded: requiredBytes - availableStorage,
            currentStorage,
            storageLimit,
        };
    }

    return {
        canProceed: true,
        reason: 'ok',
        currentStorage,
        storageLimit,
    };
};

/**
 * Check if user can generate an image (tokens + storage)
 */
export const checkImageGenerationAvailability = async (estimatedTokens: number = 100): Promise<ResourceCheckResult> => {
    // Check tokens first
    const tokenCheck = await checkTokenAvailability(estimatedTokens);
    if (!tokenCheck.canProceed) {
        return tokenCheck;
    }

    // Check storage
    const storageCheck = await checkStorageAvailability(MIN_IMAGE_STORAGE_BYTES);
    if (!storageCheck.canProceed) {
        return storageCheck;
    }

    return { canProceed: true, reason: 'ok' };
};

/**
 * Check if user can generate a video (tokens + storage)
 */
export const checkVideoGenerationAvailability = async (estimatedTokens: number = 500): Promise<ResourceCheckResult> => {
    // Check tokens first
    const tokenCheck = await checkTokenAvailability(estimatedTokens);
    if (!tokenCheck.canProceed) {
        return tokenCheck;
    }

    // Check storage
    const storageCheck = await checkStorageAvailability(MIN_VIDEO_STORAGE_BYTES);
    if (!storageCheck.canProceed) {
        return storageCheck;
    }

    return { canProceed: true, reason: 'ok' };
};

/**
 * Format bytes to human-readable format
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format tokens to human-readable format with commas
 */
export const formatTokens = (tokens: number): string => {
    return tokens.toLocaleString();
};
