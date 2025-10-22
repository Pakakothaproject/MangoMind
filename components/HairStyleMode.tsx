import React, { useState, useMemo } from 'react';
import { ImageUploader } from './ImageUploader';
import { SparklesIcon, WandIcon, Trash2Icon } from './Icons';
import type { UploadedImage } from '../types';
import { TabButton } from './TabButton';
import ModelSelector from './ModelSelector';
import { useModelStore } from '../store/modelStore';
import AspectRatioSelector from './AspectRatioSelector';

interface HairStyleModeProps {
  modelImage: UploadedImage | null;
  handleModelImageUpload: (image: UploadedImage | null) => void;
  hairStylePrompt: string;
  setHairStylePrompt: (prompt: string) => void;
  hairStyleImage: UploadedImage | null;
  setHairStyleImage: (image: UploadedImage | null) => void;
  handleHairStyle: () => Promise<void>;
  loadingMessage: string | null;
  handleRemoveHair: () => Promise<void>;
  isStrictFaceEnabled: boolean;
  toggleStrictFace: () => void;
  imageEditModel: string;
  setImageEditModel: (modelId: string) => void;
  aspectRatio: string;
  setAspectRatio: (ratio: string) => void;
}

export const HairStyleMode: React.FC<HairStyleModeProps> = ({
  modelImage,
  handleModelImageUpload,
  hairStylePrompt,
  setHairStylePrompt,
  hairStyleImage,
  setHairStyleImage,
  handleHairStyle,
  loadingMessage,
  handleRemoveHair,
  isStrictFaceEnabled,
  toggleStrictFace,
  imageEditModel,
  setImageEditModel,
  aspectRatio,
  setAspectRatio,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const { models } = useModelStore();
  
  const i2iModels = useMemo(() => models.filter(m => m.tags?.includes('i2i') && m.is_accessible), [models]);
  const modelInfo = useMemo(() => models.find(m => m.id === imageEditModel), [models, imageEditModel]);
  const supportedRatios = modelInfo?.supports.aspectRatios;
  
  const isGenerateDisabled = !modelImage || !!loadingMessage || (activeTab === 'text' && !hairStylePrompt) || (activeTab === 'image' && !hairStyleImage);

  return (
    <div className="space-y-6">
      <div className="step-card">
        <h3 className="step-title"><span className="step-number">1</span> Upload your model</h3>
        <ImageUploader image={modelImage} onImageUpload={handleModelImageUpload} aspectRatioClass="aspect-square" />
      </div>

      <div className="step-card">
        <h3 className="step-title"><span className="step-number">2</span> Select Model</h3>
        <ModelSelector
            models={i2iModels}
            selectedModel={imageEditModel}
            onSelectModel={setImageEditModel}
            label=""
        />
      </div>

      <div className="step-card">
        <h3 className="step-title"><span className="step-number">3</span> Describe or upload hairstyle</h3>
        <div className="neo-tab-container">
          <TabButton label="Describe" Icon={WandIcon} isActive={activeTab === 'text'} onClick={() => setActiveTab('text')} />
          <TabButton label="Upload" Icon={SparklesIcon} isActive={activeTab === 'image'} onClick={() => setActiveTab('image')} />
        </div>

        <div className="pt-4">
          {activeTab === 'text' ? (
            <textarea
              value={hairStylePrompt}
              onChange={(e) => setHairStylePrompt(e.target.value)}
              className="neo-textarea"
              placeholder="e.g., long wavy blonde hair, short pixie cut, etc."
              rows={4}
            />
          ) : (
            <ImageUploader image={hairStyleImage} onImageUpload={setHairStyleImage} />
          )}
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
            <div className="flex items-center justify-between">
                <span id="face-lock-label" className="flex flex-col pr-4">
                    <span className="font-semibold">Strict Face Match</span>
                    <span className="text-sm opacity-70">Preserve exact facial features.</span>
                </span>
                <button type="button" role="switch" aria-checked={isStrictFaceEnabled} aria-labelledby="face-lock-label" onClick={toggleStrictFace}
                    className={`${isStrictFaceEnabled ? 'bg-[var(--nb-primary)]' : 'bg-[var(--nb-surface-alt)]'} relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-[var(--nb-border)] transition-colors duration-200 ease-in-out`}>
                    <span aria-hidden="true" className={`${isStrictFaceEnabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out border border-[var(--nb-border)]`}/>
                </button>
            </div>
        </div>
      </div>

      <div className="step-card">
        <h3 className="step-title"><span className="step-number">5</span> Generate</h3>
        <div className="space-y-2">
            <button
              onClick={handleHairStyle}
              disabled={isGenerateDisabled}
              className="w-full neo-button neo-button-primary"
            >
              <SparklesIcon />
              {loadingMessage ? loadingMessage : 'Apply Hairstyle'}
            </button>
            <button
                onClick={handleRemoveHair}
                disabled={!modelImage || !!loadingMessage}
                className="w-full neo-button neo-button-secondary"
            >
                <Trash2Icon />
                Remove Hair (Make Bald)
            </button>
        </div>
      </div>
    </div>
  );
};