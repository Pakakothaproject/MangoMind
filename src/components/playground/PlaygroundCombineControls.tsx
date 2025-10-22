import React, { useMemo, useEffect } from 'react';
import { useStudioStore } from '../../store/studioStore';
import { SparklesIcon } from '../Icons';
import { ImageUploader } from '../ImageUploader';
import { GenerationCountSelector } from '../GenerationCountSelector';
import { usePlaygroundStore } from '../../store/playgroundStore';
import ModelSelector from '../ModelSelector';
// FIX: Import ExtendedModelDefinition to correctly type models.
import { useModelStore, type ExtendedModelDefinition } from '../../store/modelStore';
import AspectRatioSelector from '../AspectRatioSelector';

// Define the allowed models for this specific feature per user request
// Updated to use only Google Gemini Flash 2.5 for combine image feature
const COMBINE_MODELS = [
    'google:gemini-flash-image-2.5@1', // Gemini Flash Image 2.5 (Default)
];
const DEFAULT_COMBINE_MODEL = 'google:gemini-flash-image-2.5@1';

const PlaygroundCombineControls: React.FC = () => {
    const {
        originalModelImage,
        handleModelImageUpload,
        environmentImage,
        setEnvironmentImage,
        editPrompt,
        setEditPrompt,
        imageEditModel,
        setImageEditModel,
        handleCombineImages,
        loadingMessage,
        aspectRatio,
        setAspectRatio,
    } = useStudioStore();

    const { models } = useModelStore();

    // Filter models specifically for the combine feature
    const combineModels = useMemo(() => {
        // First, create a map for quick lookups
        const modelMap = new Map(models.map(m => [m.id, m]));
        // Then, filter and map based on the allowed list, preserving order
        // FIX: Use a two-step filter with a type guard to ensure type safety.
        return COMBINE_MODELS
            .map(id => modelMap.get(id))
            .filter((m): m is ExtendedModelDefinition => !!m)
            .filter(m => m.is_accessible);
    }, [models]);

    const modelInfo = useMemo(() => models.find(m => m.id === imageEditModel), [models, imageEditModel]);
    const supportedRatios = modelInfo?.supports.aspectRatios;
    
    // Set the default model for this mode when it's activated
    useEffect(() => {
        if (!COMBINE_MODELS.includes(imageEditModel)) {
            setImageEditModel(DEFAULT_COMBINE_MODEL);
        }
    }, [imageEditModel, setImageEditModel]);

    const isLoading = !!loadingMessage;

    return (
        <div className="space-y-6">
            <h2 className="font-bold text-xl">Combine Images</h2>
            <p className="text-sm text-[var(--nb-text-secondary)] -mt-4">Upload two images and provide a prompt to guide how they should be merged.</p>

            <div className="step-card">
                 <h3 className="step-title"><span className="step-number">1</span> Upload Images</h3>
                 <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="font-semibold text-sm">Image 1</label>
                        <ImageUploader image={originalModelImage} onImageUpload={handleModelImageUpload} aspectRatioClass="aspect-square" />
                    </div>
                    <div className="space-y-2">
                        <label className="font-semibold text-sm">Image 2</label>
                        <ImageUploader image={environmentImage} onImageUpload={setEnvironmentImage} aspectRatioClass="aspect-square" />
                    </div>
                </div>
            </div>

            <div className="step-card">
                <h3 className="step-title"><span className="step-number">2</span> Select Model</h3>
                <ModelSelector
                    models={combineModels}
                    selectedModel={imageEditModel}
                    onSelectModel={setImageEditModel}
                    label=""
                />
            </div>
            
            <div className="step-card">
                <h3 className="step-title"><span className="step-number">3</span> Describe Combination</h3>
                <textarea
                    value={editPrompt}
                    onChange={e => setEditPrompt(e.target.value)}
                    className="neo-textarea h-24"
                    placeholder="e.g., Place the person from Image 1 into the scene from Image 2..."
                    disabled={isLoading}
                />
            </div>

            {supportedRatios && (
                <div className="step-card">
                    <h3 className="step-title"><span className="step-number">4</span> Settings</h3>
                    <div className="animate-fade-in">
                        <AspectRatioSelector
                            value={aspectRatio}
                            onChange={setAspectRatio}
                            ratios={supportedRatios}
                        />
                    </div>
                </div>
            )}
            
            <div className="step-card">
                 <h3 className="step-title"><span className="step-number">{supportedRatios ? '5' : '4'}</span> Generate</h3>
                <button
                    onClick={handleCombineImages}
                    disabled={!originalModelImage || !environmentImage || !editPrompt || isLoading}
                    className="w-full neo-button neo-button-primary"
                >
                    <SparklesIcon />
                    {isLoading ? loadingMessage : 'Combine Images'}
                </button>
            </div>
        </div>
    );
};

export default PlaygroundCombineControls;