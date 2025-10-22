import React, { useMemo } from 'react';
import { useMarketingStore } from '../../store/marketingStore';
import { SparklesIcon } from '../Icons';
import { ImageUploader } from '../ImageUploader';
import { GenerationCountSelector } from '../GenerationCountSelector';
import { usePlaygroundStore } from '../../store/playgroundStore';
import ModelSelector from '../ModelSelector';
import { useModelStore } from '../../store/modelStore';

const PlaygroundAdsControls: React.FC = () => {
    const {
        prompt, setPrompt, referenceImage, setReferenceImage,
        productImage, setProductImage, handleGenerate, loadingMessage,
        numberOfImages, setNumberOfImages, adGenModelId, setAdGenModelId
    } = useMarketingStore();
    const { setActivePresetPanel } = usePlaygroundStore();
    const { models } = useModelStore();

    const imageGenModels = useMemo(() => models.filter(m => (m.tags?.includes('t2i') || m.tags?.includes('i2i')) && m.is_accessible), [models]);

    return (
        <div className="space-y-6">
            <h2 className="font-bold text-xl">Ads Campaign</h2>

            <div className="step-card">
                <h3 className="step-title"><span className="step-number">1</span> Select a Model</h3>
                <ModelSelector
                    models={imageGenModels}
                    selectedModel={adGenModelId}
                    onSelectModel={setAdGenModelId}
                    label=""
                />
            </div>
            
            <div className="step-card">
                <h3 className="step-title"><span className="step-number">2</span> Describe your campaign</h3>
                <textarea 
                    value={prompt} 
                    onChange={e => setPrompt(e.target.value)}
                    className="neo-textarea h-24"
                    placeholder="e.g., A vibrant ad for a new perfume..."
                />
                <button 
                    onClick={() => setActivePresetPanel('ads')} 
                    className="w-full neo-button highlighted-action-button text-sm mt-3 animate-subtle-pulse flex items-center justify-center gap-2"
                >
                    <SparklesIcon />
                    Get Prompt Ideas
                </button>
            </div>
            
            <div className="step-card">
                <h3 className="step-title"><span className="step-number">3</span> Upload Assets (Optional)</h3>
                <div className="space-y-4">
                    <div>
                        <label className="font-semibold text-sm opacity-90 mb-2 block">Reference Style</label>
                        <ImageUploader image={referenceImage} onImageUpload={setReferenceImage} />
                    </div>
                    <div>
                        <label className="font-semibold text-sm opacity-90 mb-2 block">Product Image</label>
                        <ImageUploader image={productImage} onImageUpload={setProductImage} />
                    </div>
                </div>
            </div>

            <div className="step-card">
                <h3 className="step-title"><span className="step-number">4</span> Settings</h3>
                <GenerationCountSelector 
                    value={numberOfImages}
                    onChange={setNumberOfImages}
                    label="Number of Images"
                />
            </div>
            
            <div className="step-card">
                <h3 className="step-title"><span className="step-number">5</span> Generate</h3>
                <button
                    onClick={handleGenerate}
                    disabled={!prompt || !!loadingMessage}
                    className="w-full neo-button neo-button-primary"
                >
                    <SparklesIcon />
                    {loadingMessage ? loadingMessage : 'Generate Campaign'}
                </button>
            </div>
        </div>
    );
};

export default PlaygroundAdsControls;