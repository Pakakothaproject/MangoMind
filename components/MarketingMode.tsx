import React, { useMemo } from 'react';
import { ImageUploader } from './ImageUploader';
import { SparklesIcon } from './Icons';
import type { UploadedImage } from '../types';
import { GenerationCountSelector } from './GenerationCountSelector';
import ModelSelector from './ModelSelector';
import { useModelStore } from '../store/modelStore';
import AspectRatioSelector from './AspectRatioSelector';

interface MarketingModeProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  overlayText: string;
  setOverlayText: (text: string) => void;
  referenceImage: UploadedImage | null;
  setReferenceImage: (image: UploadedImage | null) => void;
  productImage: UploadedImage | null;
  setProductImage: (image: UploadedImage | null) => void;
  handleMarketingGenerate: () => void;
  loadingMessage: string | null;
  numberOfImages: 1 | 2;
  setNumberOfImages: (num: 1 | 2) => void;
  adGenModelId: string;
  setAdGenModelId: (modelId: string) => void;
  setActivePresetPanel: (panel: 'ads' | null) => void;
  aspectRatio: string;
  setAspectRatio: (ratio: string) => void;
}

export const MarketingMode: React.FC<MarketingModeProps> = ({
  prompt, setPrompt, overlayText, setOverlayText, referenceImage,
  setReferenceImage, productImage, setProductImage, handleMarketingGenerate,
  loadingMessage, numberOfImages, setNumberOfImages, adGenModelId, setAdGenModelId,
  setActivePresetPanel, aspectRatio, setAspectRatio
}) => {
  const { models } = useModelStore();
  const imageGenModels = useMemo(() => models.filter(m => (m.tags?.includes('t2i') || m.tags?.includes('i2i')) && m.is_accessible), [models]);
  const modelInfo = useMemo(() => models.find(m => m.id === adGenModelId), [models, adGenModelId]);
  const supportedRatios = modelInfo?.supports.aspectRatios;

  return (
    <div className="space-y-6">
      <div className="step-card">
        <h3 className="step-title"><span className="step-number">1</span> Select a Model</h3>
        <ModelSelector
          models={imageGenModels}
          selectedModel={adGenModelId}
          onSelectModel={setAdGenModelId}
          label=""
          modelType="image"
        />
      </div>

      <div className="step-card">
        <h3 className="step-title"><span className="step-number">2</span> Describe your campaign</h3>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="neo-textarea"
          placeholder="e.g., A vibrant ad for a new perfume, model holding the bottle..."
          rows={4}
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
            <div>
                <label htmlFor="overlay-text" className="font-semibold text-sm opacity-90 mb-2 block">Overlay Text (Optional)</label>
                <input
                  id="overlay-text"
                  type="text"
                  value={overlayText}
                  onChange={(e) => setOverlayText(e.target.value)}
                  className="neo-input"
                  placeholder="e.g., Summer Sale - 50% Off"
                />
            </div>
            <GenerationCountSelector 
                value={numberOfImages}
                onChange={setNumberOfImages}
                label="Number of Images"
            />
        </div>
      </div>

      <div className="step-card">
        <h3 className="step-title"><span className="step-number">5</span> Generate</h3>
        <button
          onClick={handleMarketingGenerate}
          disabled={!prompt || !!loadingMessage}
          className="w-full neo-button neo-button-primary"
        >
          <SparklesIcon />
          {loadingMessage || 'Generate Campaign'}
        </button>
      </div>
    </div>
  );
};