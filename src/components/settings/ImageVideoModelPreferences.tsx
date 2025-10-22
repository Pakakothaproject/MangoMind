import React, { useState, useEffect, useMemo } from 'react';
import useLocalStorage from '../../hooks/use-local-storage';
import type { Model, ModelDefinition } from '../../types';
import { getAvailableModels } from '../../services/configService';

const TAG_DISPLAY_ORDER = ['Image', 'Video', 'Text-to-Image', 'Text-to-Video', 'Image-to-Video', 'Fast', 'HD', 'Creative'];

// This maps raw tags (lowercase) to the desired display tag.
const TAG_CONSOLIDATION_MAP: { [key: string]: string } = {
  // Image/Video specific tags
  'text-to-image': 'Text-to-Image',
  'text-to-video': 'Text-to-Video',
  'image-to-video': 'Image-to-Video',
  'image-generation': 'Image',
  'video-generation': 'Video',
  'image-to-image': 'Image',
  'upscale': 'HD',
  'high-resolution': 'HD',
  'creative': 'Creative',
  'artistic': 'Creative',
  'fast': 'Fast',
  'quick': 'Fast',
  'turbo': 'Fast',
};

// Create a reverse map for efficient filtering
const REVERSE_TAG_MAP: { [key: string]: string[] } = {};
for (const rawTag in TAG_CONSOLIDATION_MAP) {
    const consolidatedTag = TAG_CONSOLIDATION_MAP[rawTag];
    if (!REVERSE_TAG_MAP[consolidatedTag]) {
        REVERSE_TAG_MAP[consolidatedTag] = [];
    }
    REVERSE_TAG_MAP[consolidatedTag].push(rawTag);
}

interface ImageVideoModelPreferencesProps {
    modelType: 'image' | 'video' | 'all';
}

const ImageVideoModelPreferences: React.FC<ImageVideoModelPreferencesProps> = ({ modelType = 'all' }) => {
    const [preferredModels, setPreferredModels] = useLocalStorage<string[]>('preferred-image-video-models', []);
    const [availableModels, setAvailableModels] = useState<ModelDefinition[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTag, setActiveTag] = useState<string | null>(null);

    useEffect(() => {
        getAvailableModels().then(models => {
            console.log('ImageVideoModelPreferences - Raw models from database:', models);
            console.log('ImageVideoModelPreferences - Model type:', modelType);
            
            // Filter models based on type (image, video, or all)
            let filteredModels = models.filter(model => {
                if (modelType === 'image') {
                    // Use model_type field first, then fall back to tags
                    if (model.model_type === 'image') return true;
                    
                    // Fallback to tag-based filtering for legacy models
                    return model.tags?.some(tag => {
                        const lowerTag = tag.toLowerCase();
                        return lowerTag.includes('image') || lowerTag.includes('upscale');
                    });
                } else if (modelType === 'video') {
                    // Use model_type field first, then fall back to tags
                    if (model.model_type === 'video') return true;
                    
                    // Fallback to tag-based filtering for legacy models
                    return model.tags?.some(tag => {
                        const lowerTag = tag.toLowerCase();
                        return lowerTag.includes('video');
                    });
                }
                
                // For 'all' type, include both image and video models
                return model.model_type === 'image' || model.model_type === 'video' ||
                       model.tags?.some(tag => {
                           const lowerTag = tag.toLowerCase();
                           return lowerTag.includes('image') || lowerTag.includes('video') || 
                                  lowerTag.includes('generation') || lowerTag.includes('upscale');
                       });
            });

            console.log('ImageVideoModelPreferences - Filtered models:', filteredModels.length, filteredModels);

            const modelsWithDynamicTags = filteredModels.map(model => {
                return { ...model, tags: [...(model.tags || [])] };
            });

            setAvailableModels(modelsWithDynamicTags);
            // Filter out any preferred models that are no longer available
            setPreferredModels(prev => prev.filter(pm => filteredModels.some(am => am.id === pm)));
            setIsLoading(false);
        }).catch(error => {
            console.error('ImageVideoModelPreferences - Error fetching models:', error);
            setIsLoading(false);
        });
    }, [modelType, setPreferredModels]);
    
    const userAccessibleCount = useMemo(() => availableModels.filter(m => m.is_accessible).length, [availableModels]);
    const totalActiveModels = availableModels.length;

    const allTags = useMemo(() => {
        // Find which of the desired tags are actually present in the available models
        const presentConsolidatedTags = new Set<string>();
        availableModels.forEach(model => {
            model.tags?.forEach(rawTag => {
                const consolidated = TAG_CONSOLIDATION_MAP[rawTag.toLowerCase()];
                if (consolidated) {
                    presentConsolidatedTags.add(consolidated);
                }
            });
        });
        // Return them in the desired order
        return TAG_DISPLAY_ORDER.filter(tag => presentConsolidatedTags.has(tag));
    }, [availableModels]);

    const filteredModels = useMemo(() => {
        if (!activeTag) return availableModels;
        
        const rawTagsToFilter = REVERSE_TAG_MAP[activeTag] || [];
        if (rawTagsToFilter.length === 0) return availableModels;
        
        return availableModels.filter(model => 
            model.tags?.some(rawTag => rawTagsToFilter.includes(rawTag.toLowerCase()))
        );
    }, [availableModels, activeTag]);

    const modelsByCategory = useMemo(() => {
        // Sort models: accessible first, then by company/category
        const sortedModels = [...filteredModels].sort((a, b) => {
            // First sort by accessibility (accessible models first)
            if (a.is_accessible && !b.is_accessible) return -1;
            if (!a.is_accessible && b.is_accessible) return 1;
            
            // Then sort by company/category name
            const companyA = a.category || 'Other Models';
            const companyB = b.category || 'Other Models';
            return companyA.localeCompare(companyB);
        });

        const result: Record<string, { logoUrl?: string; models: ModelDefinition[] }> = {};
        sortedModels.forEach(model => {
            const category = model.category || 'Other Models';
            if (!result[category]) {
                result[category] = { logoUrl: model.logo_url, models: [] };
            }
            result[category].models.push(model);
        });
        return result;
    }, [filteredModels]);

    const handleToggleModel = (modelId: Model | string) => {
        setPreferredModels(prev => {
            const isSelected = prev.includes(modelId as string);
            if (isSelected) {
                return prev.filter(id => id !== modelId);
            } else {
                if (prev.length < 10) {
                    return [...prev, modelId as string];
                }
                return prev;
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto">
             <div>
                <div className="flex items-baseline gap-4 mb-2">
                    <h1 className="text-2xl font-bold lg:hidden">
                        {modelType === 'image' ? 'Image Model Gallery' : modelType === 'video' ? 'Video Model Gallery' : 'Image & Video Model Gallery'}
                    </h1>
                    <h1 className="text-2xl font-bold hidden lg:block">
                        {modelType === 'image' ? 'Image Model Preferences' : modelType === 'video' ? 'Video Model Preferences' : 'Image & Video Model Preferences'}
                    </h1>
                    <p className="text-lg font-semibold text-[var(--nb-text-secondary)]">
                        <span className="text-xl font-bold text-[var(--nb-primary)]">{userAccessibleCount}</span> / {totalActiveModels} Models Available
                    </p>
                </div>
                <p className="text-[var(--nb-text-secondary)] text-sm mb-6 lg:hidden">
                    Select up to 10 models for your {modelType} generation shortcuts.
                </p>
                 <p className="text-[var(--nb-text-secondary)] text-sm mb-6 hidden lg:block">
                    Choose up to 10 preferred models for quick access in your {modelType} generation interface.
                </p>
            </div>
            
            <div className="neo-card p-4">
                <div className="flex justify-between items-center mb-4 px-2">
                    <h2 className="font-semibold">Available Models</h2>
                    <span className="text-sm font-medium text-[var(--nb-text-secondary)] bg-[var(--nb-surface-alt)] px-2 py-1 rounded-md">
                        {preferredModels.length} / 10 selected
                    </span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4 border-b border-[var(--nb-border)] pb-4">
                    <button
                        onClick={() => setActiveTag(null)}
                        className={`tag-filter-button ${!activeTag ? 'active' : ''}`}
                    >
                        All
                    </button>
                    {allTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                            className={`tag-filter-button ${tag === activeTag ? 'active' : ''}`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
                 <div className="flex justify-end mb-4 px-2">
                    <button
                        onClick={() => setPreferredModels([])}
                        disabled={preferredModels.length === 0}
                        className="text-sm font-semibold text-[var(--nb-text-secondary)] hover:text-[var(--nb-primary)] disabled:opacity-50"
                    >
                        Clear Selection
                    </button>
                </div>
                {isLoading ? <p>Loading available models...</p> : (
                    <div className="space-y-6">
                        {Object.keys(modelsByCategory).map((category) => {
                            const categoryData = modelsByCategory[category];
                            return (
                                <div key={category}>
                                    <h3 className="font-bold text-lg mb-3 px-2 flex items-center gap-2">
                                        {categoryData.logoUrl && <img src={categoryData.logoUrl} alt={`${category} logo`} className="w-5 h-5 object-contain rounded-sm" />}
                                        <span>{category}</span>
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {categoryData.models.map(model => {
                                            const isSelected = preferredModels.includes(model.id as string);
                                            const isDisabled = !isSelected && preferredModels.length >= 10;
                                            const isAccessible = model.is_accessible;

                                            return (
                                                <div
                                                    key={model.id}
                                                    onClick={() => isAccessible && !isDisabled && handleToggleModel(model.id as string)}
                                                    className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                                                        isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                                                    } ${
                                                        isSelected
                                                            ? 'border-[var(--nb-primary)] bg-color-mix(in srgb, var(--nb-primary) 10%, transparent)'
                                                            : `border-[var(--nb-border)] ${isDisabled ? 'opacity-50' : 'hover:border-[var(--nb-text-secondary)]'}`
                                                    } ${
                                                        isAccessible && !isSelected ? 'accessible-model-glow' : ''
                                                    }`}
                                                >
                                                    {!isAccessible && (
                                                        <span className="absolute top-2 right-2 text-xs font-bold text-[var(--nb-accent)] bg-color-mix(in srgb, var(--nb-accent) 20%, transparent) px-2 py-1 rounded-full z-10">
                                                            Upgrade
                                                        </span>
                                                    )}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {model.logo_url && <img src={model.logo_url} alt={`${model.category} logo`} className="w-4 h-4 object-contain rounded-sm" />}
                                                            <span className="font-bold text-sm">{model.name}</span>
                                                            {model.tags?.map(tag => (
                                                                <span key={tag} className={`model-tag tag-${tag.toLowerCase().replace(/\./g, '-').replace(/ /g, '-')}`}>{tag}</span>
                                                            ))}
                                                        </div>
                                                        {isAccessible && (
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${isSelected ? 'bg-[var(--nb-primary)] border-[var(--nb-primary)]' : 'bg-[var(--nb-surface)] border-[var(--nb-border)]'}`}>
                                                                {isSelected && <span className="material-symbols-outlined !text-sm text-white">check</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageVideoModelPreferences;