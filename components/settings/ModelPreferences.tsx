import React, { useState, useEffect, useMemo } from 'react';
import useLocalStorage from '../../hooks/use-local-storage';
import { DEFAULT_TEXT_GEN_MODEL } from '../../constants/models';
import type { Model, ModelDefinition } from '../../types';
import { getAvailableModels } from '../../services/configService';
import { supabase } from '../../services/supabaseClient';
import { useNavigate } from 'react-router-dom';


const TAG_DISPLAY_ORDER = ['Multimodal', 'Reasoning', 'Code', 'Fast', 'Instruct', 'RAG', 'Tiny'];

// This maps raw tags (lowercase) to the desired display tag.
const TAG_CONSOLIDATION_MAP: { [key: string]: string } = {
  // Reasoning group
  reasoning: 'Reasoning',
  resoning: 'Reasoning', // user typo
  thinking: 'Reasoning',
  resoner: 'Reasoning', // user typo
  agentic: 'Reasoning',

  // Fast group
  fast: 'Fast',
  turbo: 'Fast',

  // Code group
  code: 'Code',
  coding: 'Code',
  mathematical: 'Code',
  mathametical: 'Code', // user typo
  
  // Direct maps
  multimodal: 'Multimodal',
  instruct: 'Instruct',
  rag: 'RAG',
  tiny: 'Tiny',
  
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

const ModelPreferences: React.FC = () => {
    const [preferredModels, setPreferredModels] = useLocalStorage<string[]>('preferred-chat-models', [DEFAULT_TEXT_GEN_MODEL]);
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const [preferredImageModels, setPreferredImageModels] = useLocalStorage<string[]>('preferred-image-models', []);
    const [preferredVideoModels, setPreferredVideoModels] = useLocalStorage<string[]>('preferred-video-models', []);
    const [availableModels, setAvailableModels] = useState<ModelDefinition[]>([]);
    const [availableImageModels, setAvailableImageModels] = useState<ModelDefinition[]>([]);
    const [availableVideoModels, setAvailableVideoModels] = useState<ModelDefinition[]>([]);
    const [isLoading, setIsLoading] = useState(true); // Keep loading true initially to show loading state
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'chat' | 'image' | 'video'>('chat');
    const navigate = useNavigate();

    useEffect(() => {
        getAvailableModels().then(models => {
            // Chat models - filter to only include actual chat/text models
            const chatModels = models.filter(model => {
                // Use model_type field first
                if (model.model_type === 'chat' || model.model_type === 'text') return true;
                
                // Exclude if explicitly marked as image or video
                if (model.model_type === 'image' || model.model_type === 'video') return false;
                
                // Fallback: exclude models with image/video generation tags
                const hasImageVideoTags = model.tags?.some(tag => {
                    const lowerTag = tag.toLowerCase();
                    return lowerTag.includes('image') || lowerTag.includes('video') || 
                           lowerTag.includes('upscale') || lowerTag.includes('generation');
                });
                
                // If no model_type is set and no image/video tags, assume it's a chat model
                return !hasImageVideoTags;
            }).map(model => {
                return { ...model, tags: [...(model.tags || [])] };
            });
            
            // Image models
            const imageModels = models.filter(model => {
                // Use model_type field first, then fall back to tags
                if (model.model_type === 'image') return true;
                
                // Fallback to tag-based filtering for legacy models
                const hasImageTags = model.tags?.some(tag => {
                    const lowerTag = tag.toLowerCase();
                    return lowerTag.includes('image') || lowerTag.includes('upscale') || 
                           (lowerTag.includes('generation') && !lowerTag.includes('video'));
                });
                return hasImageTags;
            }).map(model => ({ ...model, tags: [...(model.tags || [])] }));

            // Video models
            const videoModels = models.filter(model => {
                // Use model_type field first, then fall back to tags
                if (model.model_type === 'video') return true;
                
                // Fallback to tag-based filtering for legacy models
                const hasVideoTags = model.tags?.some(tag => {
                    const lowerTag = tag.toLowerCase();
                    return lowerTag.includes('video') || 
                           (lowerTag.includes('generation') && lowerTag.includes('video'));
                });
                return hasVideoTags;
            }).map(model => ({ ...model, tags: [...(model.tags || [])] }));

            // Batch all state updates together to avoid multiple renders
            setAvailableModels(chatModels);
            setAvailableImageModels(imageModels);
            setAvailableVideoModels(videoModels);
            setIsLoading(false);
        }).catch(error => {
            console.error('Error loading models:', error);
            setIsLoading(false);
        });
    }, []); // Remove dependencies to prevent infinite loops
    
    // Separate useEffect to update preferred models after available models are loaded
    useEffect(() => {
        if (availableModels.length > 0) {
            setPreferredModels(prev => prev.filter(pm => availableModels.some(am => am.id === pm)));
        }
    }, [availableModels, setPreferredModels]);
    
    useEffect(() => {
        if (availableImageModels.length > 0) {
            setPreferredImageModels(prev => prev.filter(pm => availableImageModels.some(am => am.id === pm)));
        }
    }, [availableImageModels, setPreferredImageModels]);
    
    useEffect(() => {
        if (availableVideoModels.length > 0) {
            setPreferredVideoModels(prev => prev.filter(pm => availableVideoModels.some(am => am.id === pm)));
        }
    }, [availableVideoModels, setPreferredVideoModels]);
    
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

    const getCurrentModelsByCategory = useMemo(() => {
        // Determine which models and filters to use based on active tab
        let currentModels: ModelDefinition[];
        let currentPreferredModels: string[];
        
        switch (activeTab) {
            case 'image':
                currentModels = availableImageModels;
                currentPreferredModels = preferredImageModels;
                break;
            case 'video':
                currentModels = availableVideoModels;
                currentPreferredModels = preferredVideoModels;
                break;
            case 'chat':
            default:
                currentModels = availableModels;
                currentPreferredModels = preferredModels;
                break;
        }

        // Apply tag filter if active
        const filteredCurrentModels = activeTag ? 
            currentModels.filter(model => 
                model.tags?.some(rawTag => {
                    const rawTagsToFilter = REVERSE_TAG_MAP[activeTag] || [];
                    return rawTagsToFilter.includes(rawTag.toLowerCase());
                })
            ) : currentModels;

        // Sort models: accessible first, then by company/category
        const sortedModels = [...filteredCurrentModels].sort((a, b) => {
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
        return { modelsByCategory: result, currentPreferredModels, currentModels: filteredCurrentModels };
    }, [activeTab, availableModels, availableImageModels, availableVideoModels, preferredModels, preferredImageModels, preferredVideoModels, activeTag]);


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

    const handleToggleImageModel = (modelId: Model | string) => {
        setPreferredImageModels(prev => {
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

    const handleToggleVideoModel = (modelId: Model | string) => {
        setPreferredVideoModels(prev => {
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
                <div className="flex flex-col gap-2 mb-2">
                    <div className="flex items-baseline gap-4">
                        <h1 className="text-2xl font-bold lg:hidden">Model Gallery</h1>
                        <h1 className="text-2xl font-bold hidden lg:block">Model Preferences</h1>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-[var(--nb-text-secondary)]">Chat Models:</span>
                            <span className="font-bold text-[var(--nb-primary)]">{availableModels.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[var(--nb-text-secondary)]">Image Models:</span>
                            <span className="font-bold text-[var(--nb-primary)]">{availableImageModels.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[var(--nb-text-secondary)]">Video Models:</span>
                            <span className="font-bold text-[var(--nb-primary)]">{availableVideoModels.length}</span>
                        </div>
                    </div>
                </div>
                <p className="text-[var(--nb-text-secondary)] text-sm mb-6 lg:hidden">
                    Select up to 10 models for your chat shortcuts.
                </p>
                 <p className="text-[var(--nb-text-secondary)] text-sm mb-6 hidden lg:block">
                    Choose up to 10 preferred models for quick access in your chat interface.
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
                {/* Tab Navigation */}
            <div className="mb-6">
                <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
                    {[
                        { id: 'chat', label: 'Chat', available: availableModels.length, selected: preferredModels.length },
                        { id: 'image', label: 'Image', available: availableImageModels.length, selected: preferredImageModels.length },
                        { id: 'video', label: 'Video', available: availableVideoModels.length, selected: preferredVideoModels.length }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'chat' | 'image' | 'video')}
                            className={`flex-1 py-2.5 px-3 rounded-md text-sm font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-[var(--nb-primary)] text-black'
                                    : 'text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                            <div className="flex flex-col items-center gap-1">
                                <span>{tab.label}</span>
                                <span className="text-xs opacity-80">{tab.available} available • {tab.selected}/10 selected</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tag Filter */}
            <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setActiveTag(null)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            !activeTag
                                ? 'bg-[var(--nb-primary)] text-black'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        All Models
                    </button>
                    {allTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                activeTag === tag
                                    ? 'bg-[var(--nb-primary)] text-black'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* Models List */}
            {isLoading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--nb-primary)] mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading available models...</p>
                    <p className="text-sm text-gray-500 mt-2">This may take a few seconds...</p>
                </div>
            ) : availableModels.length === 0 ? (
                <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">No models available</div>
                    <p className="text-sm text-gray-500">Please check your connection or try refreshing the page.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(getCurrentModelsByCategory.modelsByCategory).map(([category, { logoUrl, models }]) => (
                        <div key={category} className="bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-4">
                                {logoUrl && (
                                    <img 
                                        src={logoUrl} 
                                        alt={`${category} logo`}
                                        className="w-8 h-8 rounded"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                )}
                                <h3 className="text-lg font-semibold text-white">{category}</h3>
                                <span className="text-sm text-gray-400">({models.length})</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                                {models.map(model => {
                                    const isSelected = getCurrentModelsByCategory.currentPreferredModels.includes(model.id);
                                    const isAccessible = model.is_accessible;
                                    
                                    return (
                                        <div
                                            key={model.id}
                                            className={`p-2 md:p-3 rounded-lg border-2 transition-all ${
                                                isSelected
                                                    ? 'border-[var(--nb-primary)] bg-color-mix(in srgb, var(--nb-primary) 10%, transparent)'
                                                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                                            } ${
                                                !isAccessible ? 'opacity-50' : ''
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-1.5 md:mb-2">
                                                <h4 className="font-medium text-white text-xs md:text-sm leading-tight pr-1">{model.name}</h4>
                                                <button
                                                    onClick={() => {
                                                        switch (activeTab) {
                                                            case 'image':
                                                                handleToggleImageModel(model.id);
                                                                break;
                                                            case 'video':
                                                                handleToggleVideoModel(model.id);
                                                                break;
                                                            case 'chat':
                                                            default:
                                                                handleToggleModel(model.id);
                                                                break;
                                                        }
                                                    }}
                                                    className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-colors ${
                                                        isSelected
                                                            ? 'bg-[var(--nb-primary)] border-[var(--nb-primary)]'
                                                            : 'border-gray-500 hover:border-[var(--nb-primary)]'
                                                    }`}
                                                >
                                                    {isSelected && (
                                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                            <p className="text-[10px] md:text-xs text-gray-400 mb-1.5 md:mb-2 line-clamp-2">{model.description}</p>
                                            <div className="flex flex-wrap gap-1">
                                                {model.tags?.slice(0, 2).map(tag => (
                                                    <span key={tag} className="px-1.5 md:px-2 py-0.5 md:py-1 bg-gray-600 text-gray-300 text-[9px] md:text-xs rounded">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                            {!isAccessible && (
                                                <div className="mt-1.5 md:mt-2 text-[10px] md:text-xs text-red-400">
                                                    ⚠️ Not accessible
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            </div>
        </div>
    );
};

export default ModelPreferences;