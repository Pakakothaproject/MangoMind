import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { ExtendedModelDefinition } from '../store/modelStore';
import { CheckIcon, ChevronDownIcon } from './Icons';
import useLocalStorage from '../hooks/use-local-storage';

interface ModelSelectorProps {
    models: ModelDefinition[];
    selectedModel: string;
    onSelectModel: (modelId: string) => void;
    label?: string;
    disabled?: boolean;
    maxModels?: number;
    showAllModels?: boolean;
    onOpenGallery?: () => void;
    modelType?: 'image' | 'video' | 'chat'; // Add model type to determine which preferences to use
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onSelectModel,
  label = "Model",
  disabled = false,
  maxModels = 10,
  showAllModels = false,
  onOpenGallery,
  modelType = 'image'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const selectedModelInfo = models.find(m => m.id === selectedModel);
    
    // Get preferred models based on type
    const [preferredImageModels] = useLocalStorage<string[]>('preferred-image-models', []);
    const [preferredVideoModels] = useLocalStorage<string[]>('preferred-video-models', []);
    const [preferredChatModels] = useLocalStorage<string[]>('preferred-chat-models', []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const displayModels = useMemo(() => {
        let filteredModels = models;
        
        // Filter by user preferences if they exist
        if (!showAllModels) {
            let preferredModels: string[] = [];
            
            switch (modelType) {
                case 'image':
                    preferredModels = preferredImageModels;
                    break;
                case 'video':
                    preferredModels = preferredVideoModels;
                    break;
                case 'chat':
                    preferredModels = preferredChatModels;
                    break;
            }
            
            // If user has preferred models set, show only those, otherwise show all accessible
            if (preferredModels.length > 0) {
                filteredModels = models.filter(m => preferredModels.includes(m.id));
                console.log(`DEBUG ModelSelector: Filtered to ${filteredModels.length} preferred ${modelType} models`);
            } else {
                filteredModels = models.filter(m => m.is_accessible);
                console.log(`DEBUG ModelSelector: Showing ${filteredModels.length} accessible ${modelType} models`);
            }
        } else {
            filteredModels = models.slice(0, maxModels);
        }
        
        return filteredModels.slice(0, maxModels);
    }, [models, showAllModels, maxModels, modelType, preferredImageModels, preferredVideoModels, preferredChatModels]);

    const hasMoreModels = models.length > maxModels;

    const modelsByCategory = useMemo(() => {
        // Sort models: accessible first, then by company/category
        const sortedModels = [...displayModels].sort((a, b) => {
            // First sort by accessibility (accessible models first)
            if (a.is_accessible && !b.is_accessible) return -1;
            if (!a.is_accessible && b.is_accessible) return 1;
            
            // Then sort by company/category name
            const companyA = a.category || 'Other Models';
            const companyB = b.category || 'Other Models';
            return companyA.localeCompare(companyB);
        });

        const result: Record<string, { logoUrl?: string; models: ExtendedModelDefinition[] }> = {};
        sortedModels.forEach(model => {
            const category = model.category || 'Other Models';
            if (!result[category]) {
                result[category] = { logoUrl: model.logo_url, models: [] };
            }
            result[category].models.push(model);
        });
        return result;
    }, [displayModels]);

    return (
        <div>
            <label htmlFor="model-selector-button" className="font-semibold text-sm opacity-90">{label}</label>
            <div ref={wrapperRef} className="relative mt-1">
                <button
                    id="model-selector-button"
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={disabled}
                    className="model-selector-button"
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                >
                    <div className="flex items-center gap-3 truncate">
                        {selectedModelInfo?.logo_url && <img src={selectedModelInfo.logo_url} alt={`${selectedModelInfo.name} logo`} className="w-5 h-5 object-contain rounded-sm flex-shrink-0" />}
                        <span className="font-semibold truncate">{selectedModelInfo?.name || 'Select a model'}</span>
                    </div>
                    <ChevronDownIcon className={`w-5 h-5 text-[var(--nb-text-secondary)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                    <div className="model-selector-dropdown" role="listbox">
                        {/* FIX: Property 'logoUrl' and 'models' does not exist on type 'unknown'. Replaced Object.entries with Object.keys for better type inference. */}
                        {Object.keys(modelsByCategory).map((category) => {
                            const categoryData = modelsByCategory[category];
                            return (
                                <div key={category}>
                                    <h3 className="model-selector-category">
                                        {categoryData.logoUrl && <img src={categoryData.logoUrl} alt={`${category} logo`} />}
                                        <span>{category}</span>
                                    </h3>
                                    {categoryData.models.map(model => (
                                        <button
                                            key={model.id}
                                            onClick={() => {
                                                onSelectModel(model.id);
                                                setIsOpen(false);
                                            }}
                                            className={`model-selector-item`}
                                            role="option"
                                            aria-selected={model.id === selectedModel}
                                        >
                                            <div className="flex items-center gap-3 flex-grow truncate">
                                                {model.logo_url && <img src={model.logo_url} alt={`${model.name} logo`} className="w-5 h-5 object-contain rounded-sm flex-shrink-0" />}
                                                <div className="truncate">
                                                    <p className="font-semibold truncate">{model.name}</p>
                                                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                                        {model.tags?.slice(0, 3).map(tag => (
                                                            <span key={tag} className={`model-tag tag-${tag.toLowerCase().replace(/\./g, '-').replace(/ /g, '-')}`}>{tag}</span>
                                                        ))}
                                                        {!model.is_accessible && (
                                                            <span className="model-tag tag-upgrade bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Upgrade</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {model.id === selectedModel && model.is_accessible && <CheckIcon className="w-5 h-5 text-[var(--nb-primary)] flex-shrink-0" />}
                                        </button>
                                    ))}
                                </div>
                            )
                        })}
                        {(hasMoreModels || onOpenGallery) && (
                            <div className="border-t border-[var(--nb-border)] pt-2 mt-2">
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        onOpenGallery?.();
                                    }}
                                    className="w-full neo-button neo-button-secondary text-sm"
                                >
                                    {hasMoreModels ? `View All Models (${models.length})` : 'Model Gallery'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModelSelector;