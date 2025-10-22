import React, { useMemo } from 'react';
import type { UploadedImage } from '../types';
import { ImageUploader } from './ImageUploader';
import { SparklesIcon, WandIcon } from './Icons';
import ModelSelector from './ModelSelector';
import { useModelStore } from '../store/modelStore';
import AspectRatioSelector from './AspectRatioSelector';

interface SceneSwapModeProps {
    modelImage: UploadedImage | null;
    handleModelImageUpload: (image: UploadedImage | null) => void;
    environmentImage: UploadedImage | null;
    setEnvironmentImage: (image: UploadedImage | null) => void;
    loadingMessage: string | null;
    isPoseLocked: boolean;
    togglePoseLock: () => void;
    imageEditModel: string;
    setImageEditModel: (modelId: string) => void;
    sceneDescription: string | null;
    isAnalyzingScene: boolean;
    setSceneDescription: (description: string | null) => void;
    handleAnalyzeScene: () => Promise<void>;
    handleGenerateSceneFromDescription: () => Promise<void>;
    isTwoStepSceneSwap: boolean;
    toggleTwoStepSceneSwap: () => void;
    handleAutoSceneSwap: () => Promise<void>;
    isRephrasingScene: boolean;
    handleRephraseSceneDescription: () => Promise<void>;
    isSceneAnalyzed: boolean;
    onShowPresets: () => void;
    aspectRatio: string;
    setAspectRatio: (ratio: string) => void;
}

export const SceneSwapMode: React.FC<SceneSwapModeProps> = ({
    modelImage, handleModelImageUpload, environmentImage, setEnvironmentImage,
    loadingMessage, isPoseLocked, togglePoseLock,
    imageEditModel, setImageEditModel,
    sceneDescription, isAnalyzingScene, setSceneDescription,
    handleAnalyzeScene, handleGenerateSceneFromDescription,
    isTwoStepSceneSwap, toggleTwoStepSceneSwap, handleAutoSceneSwap,
    isRephrasingScene, handleRephraseSceneDescription, isSceneAnalyzed,
    onShowPresets, aspectRatio, setAspectRatio
}) => {
    const { models } = useModelStore();
    const i2iModels = useMemo(() => models.filter(m => m.tags?.includes('i2i') && m.is_accessible), [models]);
    const modelInfo = useMemo(() => models.find(m => m.id === imageEditModel), [models, imageEditModel]);
    const supportedRatios = modelInfo?.supports.aspectRatios;

    let primaryButton;

    if (isTwoStepSceneSwap) {
        if (!isSceneAnalyzed) {
            primaryButton = {
                text: 'Analyze Scene',
                onClick: handleAnalyzeScene,
                disabled: !modelImage || !environmentImage || isAnalyzingScene || !!loadingMessage,
                loadingText: 'Analyzing...',
                Icon: WandIcon
            };
        } else {
            primaryButton = {
                text: 'Generate Scene Swap',
                onClick: handleGenerateSceneFromDescription,
                disabled: !modelImage || !environmentImage || !sceneDescription || !!loadingMessage,
                loadingText: loadingMessage || 'Generating...',
                Icon: SparklesIcon
            };
        }
    } else {
        primaryButton = {
            text: 'Swap Scene',
            onClick: handleAutoSceneSwap,
            disabled: !modelImage || !environmentImage || !!loadingMessage,
            loadingText: loadingMessage || 'Swapping...',
            Icon: SparklesIcon
        };
    }

    const isLoading = isAnalyzingScene || (!!loadingMessage && primaryButton.onClick !== handleAnalyzeScene);

    return (
        <div className="space-y-6">
            <div className="step-card">
                <h3 className="step-title"><span className="step-number">1</span> Upload your model</h3>
                <ImageUploader image={modelImage} onImageUpload={handleModelImageUpload} aspectRatioClass="aspect-square" />
            </div>

            <div className="step-card">
                <h3 className="step-title"><span className="step-number">2</span> Upload target scene</h3>
                <ImageUploader image={environmentImage} onImageUpload={setEnvironmentImage} aspectRatioClass="aspect-square" />
                <button onClick={onShowPresets} className="w-full neo-button highlighted-action-button text-sm mt-2 animate-subtle-pulse flex items-center justify-center gap-2">
                    <SparklesIcon />
                    Browse Presets
                </button>
            </div>
            
            <div className="step-card">
                <h3 className="step-title"><span className="step-number">3</span> Select Model</h3>
                 <ModelSelector
                    models={i2iModels}
                    selectedModel={imageEditModel}
                    onSelectModel={setImageEditModel}
                    label=""
                />
            </div>
            
            <div className="step-card">
                 <h3 className="step-title"><span className="step-number">4</span> Settings</h3>
                 <div className="space-y-4">
                    {supportedRatios && (
                        <div className="animate-fade-in">
                            <AspectRatioSelector
                                value={aspectRatio}
                                onChange={setAspectRatio}
                                ratios={supportedRatios}
                            />
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <span id="two-step-label" className="flex flex-col pr-4">
                            <span className="font-semibold">2-Step Editing</span>
                            <span className="text-sm opacity-70">Analyze and edit scene before generating.</span>
                        </span>
                        <button type="button" role="switch" aria-checked={isTwoStepSceneSwap} aria-labelledby="two-step-label" onClick={toggleTwoStepSceneSwap}
                            className={`${isTwoStepSceneSwap ? 'bg-[var(--nb-primary)]' : 'bg-[var(--nb-surface-alt)]'} relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-[var(--nb-border)] transition-colors duration-200 ease-in-out`}>
                            <span aria-hidden="true" className={`${isTwoStepSceneSwap ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out border border-[var(--nb-border)]`}/>
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <span id="pose-lock-label" className="flex flex-col pr-4">
                            <span className="font-semibold">Lock Original Pose</span>
                            <span className="text-sm opacity-70">Keep the model's exact pose.</span>
                        </span>
                        <button type="button" role="switch" aria-checked={isPoseLocked} aria-labelledby="pose-lock-label" onClick={togglePoseLock}
                            className={`${isPoseLocked ? 'bg-[var(--nb-primary)]' : 'bg-[var(--nb-surface-alt)]'} relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-[var(--nb-border)] transition-colors duration-200 ease-in-out`}>
                            <span aria-hidden="true" className={`${isPoseLocked ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out border border-[var(--nb-border)]`}/>
                        </button>
                    </div>
                </div>
            </div>

            {isTwoStepSceneSwap && isSceneAnalyzed && (
                <div className="step-card animate-fade-in">
                    <h3 className="step-title"><span className="step-number">5</span> Edit Description</h3>
                    <p className="text-sm opacity-70 -mt-2 mb-4">Review, edit, or rephrase the AI's analysis of the target scene before generating the final image.</p>
                    <textarea
                        value={sceneDescription || ''}
                        onChange={(e) => setSceneDescription(e.target.value)}
                        disabled={isAnalyzingScene || !!loadingMessage || isRephrasingScene}
                        className="neo-textarea"
                        rows={6}
                        placeholder="Scene analysis will appear here..."
                    />
                    <button
                        onClick={handleRephraseSceneDescription}
                        disabled={!sceneDescription || isAnalyzingScene || !!loadingMessage || isRephrasingScene}
                        className="w-full neo-button neo-button-secondary text-sm mt-2"
                    >
                       ✨ {isRephrasingScene ? 'Rephrasing...' : 'Rephrase for Strict Prompt'}
                    </button>
                </div>
            )}
            
            <div className="step-card">
                 <h3 className="step-title"><span className="step-number">{isTwoStepSceneSwap && isSceneAnalyzed ? '6' : '5'}</span> Generate</h3>
                <button 
                    onClick={primaryButton.onClick}
                    disabled={primaryButton.disabled}
                    className="w-full neo-button neo-button-primary"
                >
                    <primaryButton.Icon />
                    {isLoading ? primaryButton.loadingText : primaryButton.text}
                </button>
            </div>
        </div>
    );
};