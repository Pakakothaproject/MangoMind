import React, { useMemo } from 'react';
import { useStudioStore } from '../../store/studioStore';
import { ImageUploader } from '../ImageUploader';
import { SparklesIcon, WandIcon } from '../Icons';
import { usePlaygroundStore } from '../../store/playgroundStore';
import ModelSelector from '../ModelSelector';
import { useModelStore } from '../../store/modelStore';

const PlaygroundSceneControls: React.FC = () => {
    const {
        originalModelImage, handleModelImageUpload, environmentImage, setEnvironmentImage,
        loadingMessage, isPoseLocked, togglePoseLock,
        imageEditModel, setImageEditModel,
        sceneDescription, setSceneDescription, isAnalyzingScene,
        handleAnalyzeScene, handleGenerateSceneFromDescription,
        isTwoStepSceneSwap, toggleTwoStepSceneSwap, handleAutoSceneSwap,
        isRephrasingScene, handleRephraseSceneDescription, isSceneAnalyzed
    } = useStudioStore();
    const { setActivePresetPanel } = usePlaygroundStore();
    const { models } = useModelStore();
    const i2iModels = useMemo(() => models.filter(m => m.tags?.includes('i2i') && m.is_accessible), [models]);

    let primaryButton;
    if (isTwoStepSceneSwap) {
        if (!isSceneAnalyzed) {
            primaryButton = {
                text: 'Analyze Scene',
                onClick: handleAnalyzeScene,
                disabled: !originalModelImage || !environmentImage || isAnalyzingScene || !!loadingMessage,
                loadingText: 'Analyzing...',
                Icon: WandIcon
            };
        } else {
            primaryButton = {
                text: 'Generate Scene Swap',
                onClick: handleGenerateSceneFromDescription,
                disabled: !originalModelImage || !environmentImage || !sceneDescription || !!loadingMessage,
                loadingText: loadingMessage || 'Generating...',
                Icon: SparklesIcon
            };
        }
    } else {
        primaryButton = {
            text: 'Swap Scene',
            onClick: handleAutoSceneSwap,
            disabled: !originalModelImage || !environmentImage || !!loadingMessage,
            loadingText: loadingMessage || 'Swapping...',
            Icon: SparklesIcon
        };
    }

    const isLoading = isAnalyzingScene || (!!loadingMessage && primaryButton.onClick !== handleAnalyzeScene);

    return (
        <div className="space-y-6">
            <h2 className="font-bold text-xl">Scene Swap</h2>
            <div className="space-y-2">
                <h3 className="font-semibold">1. Your Model</h3>
                <ImageUploader image={originalModelImage} onImageUpload={handleModelImageUpload} aspectRatioClass="aspect-square" />
            </div>
            
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold">2. Target Scene</h3>
                    <button onClick={() => setActivePresetPanel('scene')} className="text-sm font-semibold text-[var(--nb-primary)] hover:underline">Show Presets</button>
                </div>
                <ImageUploader image={environmentImage} onImageUpload={setEnvironmentImage} aspectRatioClass="aspect-square" />
            </div>

            <div className="space-y-2">
                <ModelSelector
                    models={i2iModels}
                    selectedModel={imageEditModel}
                    onSelectModel={setImageEditModel}
                    label="Editing Model"
                />
            </div>
            
            <div className="flex items-center justify-between">
                <span id="two-step-label-pg" className="flex flex-col pr-4">
                    <span className="font-semibold">Enable 2-Step Editing</span>
                    <span className="text-sm opacity-70">Analyze and edit scene before generating.</span>
                </span>
                <button type="button" role="switch" aria-checked={isTwoStepSceneSwap} aria-labelledby="two-step-label-pg" onClick={toggleTwoStepSceneSwap}
                    className={`${isTwoStepSceneSwap ? 'bg-[var(--nb-primary)]' : 'bg-[var(--nb-surface-alt)]'} relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-[var(--nb-border)] transition-colors duration-200 ease-in-out`}>
                    <span aria-hidden="true" className={`${isTwoStepSceneSwap ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out border border-[var(--nb-border)]`}/>
                </button>
            </div>

            {isTwoStepSceneSwap && isSceneAnalyzed && (
                <div className="step-card animate-fade-in">
                    <h3 className="step-title"><span className="step-number">3</span> Edit Description</h3>
                    <p className="text-sm opacity-70 -mt-2 mb-4">Review, edit, or rephrase the AI's analysis before generating.</p>
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
            
            <div className="flex items-center justify-between">
                <span id="pose-lock-label-pg" className="flex flex-col pr-4">
                    <span className="font-semibold">Lock Original Pose</span>
                    <span className="text-sm opacity-70">Keep the model's exact pose.</span>
                </span>
                <button type="button" role="switch" aria-checked={isPoseLocked} aria-labelledby="pose-lock-label-pg" onClick={togglePoseLock}
                    className={`${isPoseLocked ? 'bg-[var(--nb-primary)]' : 'bg-[var(--nb-surface-alt)]'} relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-[var(--nb-border)] transition-colors duration-200 ease-in-out`}>
                    <span aria-hidden="true" className={`${isPoseLocked ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out border border-[var(--nb-border)]`}/>
                </button>
            </div>

             <div className="pt-4 border-t border-[var(--nb-border)]">
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

export default PlaygroundSceneControls;