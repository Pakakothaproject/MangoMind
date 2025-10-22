import React from 'react';
import { usePlaygroundStore } from '../../store/playgroundStore';
import PlaygroundTryOnControls from './PlaygroundTryOnControls';
import PlaygroundSceneControls from './PlaygroundSceneControls';
import PlaygroundHairControls from './PlaygroundHairControls';
import PlaygroundCombineControls from './PlaygroundCombineControls';
import PlaygroundAdsControls from './PlaygroundAdsControls';
import { SparklesIcon } from '../Icons';

const GenerateModeControls: React.FC = () => {
    const { prompt, negativePrompt, setPrompt, setNegativePrompt, generateImage, isLoading, error } = usePlaygroundStore();

    return (
        <div className="space-y-6">
            <div className="step-card">
                <h3 className="step-title"><span className="step-number">1</span> Describe Your Image</h3>
                <div>
                    <label htmlFor="playground-prompt" className="font-semibold text-sm opacity-90">Prompt</label>
                    <textarea
                        id="playground-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="neo-textarea mt-1"
                        rows={4}
                        placeholder="A photorealistic image of..."
                        disabled={isLoading}
                    />
                </div>
                <div className="mt-4">
                    <label htmlFor="playground-negative" className="font-semibold text-sm opacity-90">Negative Prompt (Optional)</label>
                    <textarea
                        id="playground-negative"
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        className="neo-textarea mt-1"
                        rows={2}
                        placeholder="blurry, low quality, text..."
                        disabled={isLoading}
                    />
                </div>
            </div>

            <div className="step-card">
                <h3 className="step-title"><span className="step-number">2</span> Generate</h3>
                <button
                    onClick={generateImage}
                    disabled={isLoading || !prompt.trim()}
                    className="w-full neo-button neo-button-primary"
                >
                    <SparklesIcon /> {isLoading ? 'Generating...' : 'Generate Image'}
                </button>
                {error && (
                    <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};


const PlaygroundControls: React.FC = () => {
    const { activeMode } = usePlaygroundStore();

    const renderControls = () => {
        switch(activeMode) {
            case 'generate':
                return <GenerateModeControls />;
            case 'tryon':
                return <PlaygroundTryOnControls />;
            case 'scene':
                return <PlaygroundSceneControls />;
            case 'hair':
                return <PlaygroundHairControls />;
            case 'combine':
                return <PlaygroundCombineControls />;
            case 'ads':
                return <PlaygroundAdsControls />;
            default:
                return <div className="p-4 text-center text-[var(--nb-text-secondary)]">Select a mode from the sidebar to begin.</div>;
        }
    };

    return (
        <div className="w-[360px] h-full bg-[#212121] p-6 overflow-y-auto border-r border-[var(--nb-border)] flex-shrink-0">
            {renderControls()}
        </div>
    );
};

export default PlaygroundControls;