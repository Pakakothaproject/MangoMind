import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { getAvailableModels } from '../../services/configService';
import type { ModelDefinition } from '../../types';
import { SaveIcon } from '../Icons';

const ChatModeSettings: React.FC = () => {
    const { 
        defaultSearchModel, 
        defaultThinkingModel,
        defaultMultimodalModel,
        actions: { updateChatModeModels } 
    } = useAppStore();

    const [searchModel, setSearchModel] = useState(defaultSearchModel);
    const [thinkingModel, setThinkingModel] = useState(defaultThinkingModel);
    const [multimodalModel, setMultimodalModel] = useState(defaultMultimodalModel);
    const [availableModels, setAvailableModels] = useState<ModelDefinition[]>([]);
    const [status, setStatus] = useState<'idle' | 'saved'>('idle');

    useEffect(() => {
        getAvailableModels().then(setAvailableModels);
    }, []);

    const handleSave = () => {
        updateChatModeModels(searchModel, thinkingModel, multimodalModel);
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 2000);
    };

    const searchModels = availableModels.filter(m => m.tags.includes('Search'));
    const thinkingModels = availableModels.filter(m => 
        m.tags.some(tag => ['Reasoning', 'thinking', 'reasoning'].includes(tag))
    );
    const multimodalModels = availableModels.filter(m => m.tags.includes('Multimodal'));

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Chat Mode Defaults</h1>
            <div className="neo-card p-6 space-y-6">
                <p className="text-sm opacity-80 -mt-2">
                    Choose the default models that power different modes in the chat interface.
                </p>
                
                <div>
                    <label htmlFor="search-model" className="font-semibold mb-1 block">Default Search Model</label>
                    <select id="search-model" value={searchModel} onChange={e => setSearchModel(e.target.value)} className="neo-input">
                        {searchModels.map(model => (
                            <option key={model.id} value={model.id as string}>
                                {model.name}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs opacity-70 mt-1">Used when "Search" mode is active. Models are filtered by the "Search" tag.</p>
                </div>

                <div>
                    <label htmlFor="thinking-model" className="font-semibold mb-1 block">Default Thinking Model</label>
                    <select id="thinking-model" value={thinkingModel} onChange={e => setThinkingModel(e.target.value)} className="neo-input">
                        {thinkingModels.map(model => (
                            <option key={model.id} value={model.id as string}>
                                {model.name}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs opacity-70 mt-1">Used when "Thinking" mode is active. Models are filtered by reasoning/thinking tags.</p>
                </div>

                <div>
                    <label htmlFor="multimodal-model" className="font-semibold mb-1 block">Default Multimodal Model</label>
                    <select id="multimodal-model" value={multimodalModel} onChange={e => setMultimodalModel(e.target.value)} className="neo-input">
                        {multimodalModels.map(model => (
                            <option key={model.id} value={model.id as string}>
                                {model.name}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs opacity-70 mt-1">Used when images/documents are uploaded. Models are filtered by the "Multimodal" tag.</p>
                </div>

                <div className="flex justify-end items-center gap-3 pt-4 border-t border-[var(--nb-border)]">
                    {status === 'saved' && <p className="text-sm text-[var(--nb-primary)] font-semibold animate-fade-in">✓ Saved!</p>}
                    <button onClick={handleSave} className="neo-button neo-button-primary">
                        <SaveIcon /> Save Defaults
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatModeSettings;
