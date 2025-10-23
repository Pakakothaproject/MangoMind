import React, { useState, useEffect, useMemo } from 'react';
import { Model, ModelDefinition } from '../../types';
import { XIcon, CheckIcon } from '../Icons';
import useLocalStorage from '../../hooks/use-local-storage';
import { useChatSessionStore } from '../../store/chat';
import { useModelStore } from '../../store/modelStore';
import { DEFAULT_TEXT_GEN_MODEL } from '../../constants/models';


interface ModelSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentModels: (Model | string)[];
    onSave: (newModels: (Model | string)[]) => void;
}

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


export const ModelSelectionModal: React.FC<ModelSelectionModalProps> = ({ isOpen, onClose, currentModels, onSave }) => {
    const [selectedModels, setSelectedModels] = useState<(Model | string)[]>(currentModels);
    // FIX: Untyped function calls may not accept type arguments. Let type be inferred.
    const [preferredModels] = useLocalStorage('preferred-chat-models', [DEFAULT_TEXT_GEN_MODEL]);
    const { toggleModelGallery } = useChatSessionStore(s => s.actions);
    const { models: allModelsFromStore, allModels, actions: { fetchAllModels } } = useModelStore();
    const [activeTag, setActiveTag] = useState<string | null>(null);

    const availableModels = useMemo(() => {
        // Use allModels if available, otherwise fall back to allModelsFromStore
        const modelsToFilter = allModels.length > 0 ? allModels : allModelsFromStore;
        
        console.log('DEBUG ModelSelectionModal: Total models to filter:', modelsToFilter.length);
        
        const modelsWithDynamicTags = modelsToFilter
            .filter(m => {
                // Accept both 'chat-completion' and 'chat' categories, and model_type 'chat'
                const isChat = m.category === 'chat-completion' || m.category === 'chat' || m.model_type === 'chat';
                console.log(`DEBUG: Model ${m.id} - category: ${m.category}, model_type: ${m.model_type}, isChat: ${isChat}`);
                return isChat;
            })
            .map(model => {
                return { ...model, tags: [...(model.tags || [])] };
            });

        console.log('DEBUG ModelSelectionModal: Chat models after filtering:', modelsWithDynamicTags.length);

        const preferredModelsFromStorage = preferredModels || [];
        console.log('DEBUG ModelSelectionModal: Preferred models from storage:', preferredModelsFromStorage);
        
        // If user has preferred models set, show only those (both accessible and non-accessible)
        // If no preferred models are set, show all accessible models
        let modelsToShow: ModelDefinition[];
        
        if (preferredModelsFromStorage.length > 0) {
            // Show preferred models (both accessible and non-accessible for upgrade prompts)
            modelsToShow = modelsWithDynamicTags.filter(m => preferredModelsFromStorage.includes(m.id as string));
            console.log('DEBUG ModelSelectionModal: Showing preferred models:', modelsToShow.length);
        } else {
            // No preferences set, show all accessible models
            modelsToShow = modelsWithDynamicTags.filter(m => m.is_accessible);
            console.log('DEBUG ModelSelectionModal: Showing all accessible models:', modelsToShow.length);
        }

        // Add currently selected models that aren't already in the list
        const currentModelIds = currentModels.filter(m => m !== 'auto').map(m => typeof m === 'string' ? m : m.id);
        
        const selectedModelsNotInList = currentModelIds
            .filter(id => !modelsToShow.some(m => m.id === id))
            .map(id => modelsToFilter.find(m => m.id === id))
            .filter(Boolean) as ModelDefinition[];
        
        if (selectedModelsNotInList.length > 0) {
            modelsToShow = [...modelsToShow, ...selectedModelsNotInList];
        }

        // Sort models: accessible first, then by company/category
        return modelsToShow.sort((a, b) => {
            // First sort by accessibility (accessible models first)
            if (a.is_accessible && !b.is_accessible) return -1;
            if (!a.is_accessible && b.is_accessible) return 1;
            
            // Then sort by company/category name
            const companyA = a.category || 'Other Models';
            const companyB = b.category || 'Other Models';
            return companyA.localeCompare(companyB);
        });
    }, [allModelsFromStore, allModels, preferredModels, currentModels]);

    useEffect(() => {
        if (isOpen) {
            setSelectedModels(currentModels);
            // Force fetch all models when modal opens
            console.log('ModelSelectionModal: Fetching all models...');
            fetchAllModels();
        }
    }, [isOpen, currentModels, fetchAllModels]);
    
    const allTags = useMemo(() => {
        const presentConsolidatedTags = new Set<string>();
        availableModels.forEach(model => {
            model.tags?.forEach(rawTag => {
                const consolidated = TAG_CONSOLIDATION_MAP[rawTag.toLowerCase()];
                if (consolidated) {
                    presentConsolidatedTags.add(consolidated);
                }
            });
        });
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
        // FIX: Replaced reduce with a forEach loop to avoid TypeScript inference issues.
        const result: Record<string, { logoUrl?: string; models: ModelDefinition[] }> = {};
        filteredModels.forEach(model => {
            const category = model.category || 'Other Models';
            if (!result[category]) {
                result[category] = { logoUrl: model.logo_url, models: [] };
            }
            result[category].models.push(model);
        });
        return result;
    }, [filteredModels]);


    if (!isOpen) return null;

    const isAutoSelected = selectedModels.length === 1 && selectedModels[0] === 'auto';

    const handleToggleModel = (modelId: Model | string) => {
        setSelectedModels(prev => {
            let newSelection = prev.filter(m => m !== 'auto');
            if (newSelection.includes(modelId)) {
                return newSelection.filter(m => m !== modelId);
            }
            if (newSelection.length < 3) {
                return [...newSelection, modelId];
            }
            return [...newSelection.slice(1), modelId];
        });
    };

    const handleSave = () => {
        if (selectedModels.length === 0 && !isAutoSelected) return;
        onSave(selectedModels);
        onClose();
    };

    return (
        <div role="dialog" aria-modal="true" aria-labelledby="model-selection-title" className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-gray-900/70 backdrop-blur-xl border border-white/10 text-white rounded-xl shadow-2xl w-full max-w-lg animate-fade-in" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-white/10 bg-gray-900/20 flex justify-between items-center">
                    <div>
                        <h2 id="model-selection-title" className="text-lg font-bold">Select Models</h2>
                        <p className="text-sm text-[var(--jackfruit-muted)]">Select up to 3 models or choose Auto-Select.</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-[var(--jackfruit-hover-dark)]">
                        <XIcon />
                    </button>
                </header>

                <div className="p-4 max-h-[70vh] overflow-y-auto bg-transparent">
                    <div className="space-y-4">
                        <button
                            onClick={() => setSelectedModels(['auto'])}
                            className={`w-full flex items-center justify-between p-3 rounded-md text-left transition-colors border-2 ${isAutoSelected ? 'bg-[var(--jackfruit-hover-dark)] border-[var(--jackfruit-accent)]' : 'border-transparent hover:bg-[var(--jackfruit-hover-dark)]'}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[var(--jackfruit-accent)]">auto_awesome</span>
                                <div>
                                    <span className="font-bold">Auto-Select</span>
                                    <p className="text-xs text-[var(--jackfruit-muted)]">Let the AI choose the best model for your prompt.</p>
                                </div>
                            </div>
                            {isAutoSelected && <CheckIcon className="text-[var(--jackfruit-accent)] flex-shrink-0" />}
                        </button>
                    </div>

                     <div className="flex flex-wrap gap-2 my-4 border-t border-[var(--jackfruit-darker)] pt-4">
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
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-sm uppercase text-[var(--jackfruit-muted)]">
                            Select Models ({isAutoSelected ? '0' : selectedModels.length}/3)
                        </h3>
                        <button 
                            onClick={() => setSelectedModels([])}
                            className="text-xs font-semibold text-[var(--jackfruit-muted)] hover:text-white disabled:opacity-50"
                            disabled={selectedModels.length === 0 || isAutoSelected}
                        >
                            Deselect All
                        </button>
                    </div>
                    <div className="space-y-4">
                        {/* FIX: Property 'logoUrl' and 'models' does not exist on type 'unknown'. Replaced Object.entries with Object.keys for better type inference. */}
                        {Object.keys(modelsByCategory).map((category) => {
                            const categoryData = modelsByCategory[category];
                            return (
                                <div key={category}>
                                    <h3 className="font-bold text-sm uppercase text-[var(--jackfruit-muted)] mb-2 px-1 flex items-center gap-2">
                                        {categoryData.logoUrl && <img src={categoryData.logoUrl} alt={`${category} logo`} className="w-4 h-4 object-contain rounded-sm" />}
                                        <span>{category}</span>
                                    </h3>
                                    <div className="space-y-2">
                                        {categoryData.models.map(model => {
                                            const isSelected = selectedModels.includes(model.id);
                                            const isAccessible = model.is_accessible;
                                            
                                            console.log(`DEBUG: Model ${model.id} - is_accessible: ${isAccessible}, isSelected: ${isSelected}`);
                                    
                                            return (
                                                <button
                                                    key={model.id}
                                                    onClick={() => handleToggleModel(model.id)} // Allow selection of all preferred models
                                                    className={`w-full flex items-center justify-between p-3 rounded-md text-left transition-colors ${
                                                        isSelected ? 'bg-[var(--jackfruit-hover-dark)]' : 'hover:bg-[var(--jackfruit-hover-dark)]'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {model.logo_url && <img src={model.logo_url} alt={`${model.category} logo`} className="w-4 h-4 object-contain rounded-sm" />}
                                                        <span className="font-medium">{model.name}</span>
                                                        {model.tags?.map(tag => (
                                                            <span key={tag} className={`glass-pill-tag tag-${tag.toLowerCase().replace(/\./g, '-').replace(/ /g, '-')}`}>{tag}</span>
                                                        ))}
                                                    </div>
                                                    {isSelected && <CheckIcon className="text-[var(--jackfruit-accent)] flex-shrink-0" />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                         {availableModels.length === 0 && <p className="text-sm text-center text-[var(--jackfruit-muted)]">No preferred models available. Please <button onClick={() => { onClose(); toggleModelGallery(); }} className="text-[var(--jackfruit-accent)] font-semibold hover:underline">manage your preferences</button>.</p>}
                    </div>
                </div>
                <footer className="p-4 border-t border-white/10 bg-gray-900/20 flex justify-between items-center">
                     <p className="text-xs text-[var(--jackfruit-muted)]">Or, <button onClick={() => { onClose(); toggleModelGallery(); }} className="text-[var(--jackfruit-accent)] font-semibold hover:underline">manage model gallery</button>.</p>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 rounded-md bg-[var(--jackfruit-hover-dark)] hover:opacity-80">Cancel</button>
                        <button onClick={handleSave} disabled={selectedModels.length === 0} className="px-4 py-2 rounded-md bg-[var(--jackfruit-accent)] text-[var(--jackfruit-dark)] font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">Save</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};