// hooks/useResourceCheck.ts
import { useState } from 'react';
import {
    checkImageGenerationAvailability,
    checkVideoGenerationAvailability,
    checkTokenAvailability,
    checkStorageAvailability,
    type ResourceCheckResult,
} from '../services/resourceCheckService';

export const useResourceCheck = () => {
    const [showInsufficientModal, setShowInsufficientModal] = useState(false);
    const [insufficientType, setInsufficientType] = useState<'tokens' | 'storage'>('tokens');
    const [resourceData, setResourceData] = useState<ResourceCheckResult | null>(null);
    const [operationType, setOperationType] = useState<'image' | 'video' | 'general'>('general');

    /**
     * Check if user can generate an image and show modal if not
     * @returns true if can proceed, false if insufficient resources
     */
    const checkImageGeneration = async (estimatedTokens?: number): Promise<boolean> => {
        const result = await checkImageGenerationAvailability(estimatedTokens);
        
        if (!result.canProceed) {
            setResourceData(result);
            setInsufficientType(result.reason === 'insufficient_tokens' ? 'tokens' : 'storage');
            setOperationType('image');
            setShowInsufficientModal(true);
            return false;
        }
        
        return true;
    };

    /**
     * Check if user can generate a video and show modal if not
     * @returns true if can proceed, false if insufficient resources
     */
    const checkVideoGeneration = async (estimatedTokens?: number): Promise<boolean> => {
        const result = await checkVideoGenerationAvailability(estimatedTokens);
        
        if (!result.canProceed) {
            setResourceData(result);
            setInsufficientType(result.reason === 'insufficient_tokens' ? 'tokens' : 'storage');
            setOperationType('video');
            setShowInsufficientModal(true);
            return false;
        }
        
        return true;
    };

    /**
     * Check if user has sufficient tokens and show modal if not
     * @returns true if can proceed, false if insufficient tokens
     */
    const checkTokens = async (requiredTokens: number): Promise<boolean> => {
        const result = await checkTokenAvailability(requiredTokens);
        
        if (!result.canProceed) {
            setResourceData(result);
            setInsufficientType('tokens');
            setOperationType('general');
            setShowInsufficientModal(true);
            return false;
        }
        
        return true;
    };

    /**
     * Check if user has sufficient storage and show modal if not
     * @returns true if can proceed, false if insufficient storage
     */
    const checkStorage = async (requiredBytes: number, type: 'image' | 'video' | 'general' = 'general'): Promise<boolean> => {
        const result = await checkStorageAvailability(requiredBytes);
        
        if (!result.canProceed) {
            setResourceData(result);
            setInsufficientType('storage');
            setOperationType(type);
            setShowInsufficientModal(true);
            return false;
        }
        
        return true;
    };

    const closeModal = () => {
        setShowInsufficientModal(false);
        setResourceData(null);
    };

    return {
        // Check functions
        checkImageGeneration,
        checkVideoGeneration,
        checkTokens,
        checkStorage,
        
        // Modal state
        showInsufficientModal,
        insufficientType,
        operationType,
        resourceData,
        closeModal,
    };
};
