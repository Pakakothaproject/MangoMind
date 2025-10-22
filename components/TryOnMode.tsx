// components/TryOnMode.tsx
import React, { useMemo } from 'react';
import { type UploadedImage, InputType } from '../types';
import { ImageUploader } from './ImageUploader';
import { TabButton } from './TabButton';
import { presetTextPrompts } from '../constants/presets';
import { SparklesIcon, LinkIcon, ImageIcon, WandIcon } from './Icons';
import ModelSelector from './ModelSelector';
import { useModelStore } from '../store/modelStore';

interface TryOnModeProps {
    modelImage: UploadedImage | null;
    handleModelImageUpload: (image: UploadedImage | null) => void;
    tryOnPrompt: string;
    setTryOnPrompt: (prompt: string) => void;
    activeTab: InputType;
    setActiveTab: (tab: InputType) => void;
    clothingImage: UploadedImage | null;
    handleClothingImageUpload: (image: UploadedImage | null) => void;
    clothingImageUrl: string;
    setClothingImageUrl: (url: string) => void;
    handleLoadFromUrlInput: () => void;
    isUrlLoading: boolean;
    handleGenerate: () => void;
    loadingMessage: string | null;
    onShowPresets: () => void;
    imageEditModel: string;
    setImageEditModel: (modelId: string) => void;
}

export const TryOnMode: React.FC<TryOnModeProps> = (props) => {
    const {
        modelImage, handleModelImageUpload, tryOnPrompt, setTryOnPrompt, activeTab,
        setActiveTab, clothingImage, handleClothingImageUpload, clothingImageUrl, setClothingImageUrl,
        handleLoadFromUrlInput, isUrlLoading, handleGenerate, loadingMessage, onShowPresets,
        imageEditModel, setImageEditModel
    } = props;
    
    const { models } = useModelStore();
    const i2iModels = useMemo(() => models.filter(m => m.tags?.includes('i2i') && m.is_accessible), [models]);

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
                <h3 className="step-title"><span className="step-number">3</span> Provide clothing</h3>
                <div className="neo-tab-container">
                    <TabButton Icon={ImageIcon} label="Upload" isActive={activeTab === InputType.IMAGE} onClick={() => setActiveTab(InputType.IMAGE)} />
                    <TabButton Icon={WandIcon} label="Describe" isActive={activeTab === InputType.TEXT} onClick={() => setActiveTab(InputType.TEXT)} />
                </div>
                 <div className="pt-4">
                    {activeTab === InputType.IMAGE ? (
                        <div className="space-y-4">
                            <ImageUploader image={clothingImage} onImageUpload={handleClothingImageUpload} />
                            <div className="space-y-2">
                                <label htmlFor="clothing-url" className="text-sm font-semibold opacity-80">Or load from URL</label>
                                <div className="flex gap-2">
                                    <input 
                                        id="clothing-url" 
                                        type="text" 
                                        className="neo-input" 
                                        placeholder="https://..." 
                                        value={clothingImageUrl}
                                        onChange={(e) => setClothingImageUrl(e.target.value)}
                                    />
                                    <button onClick={handleLoadFromUrlInput} disabled={isUrlLoading} className="neo-button neo-button-secondary">
                                        {isUrlLoading ? '...' : <LinkIcon />}
                                    </button>
                                </div>
                            </div>
                            <button onClick={onShowPresets} className="w-full neo-button highlighted-action-button text-sm animate-subtle-pulse flex items-center justify-center gap-2">
                                <SparklesIcon />
                                Browse Presets
                            </button>
                        </div>
                    ) : (
                        <div>
                            <textarea
                                value={tryOnPrompt}
                                onChange={(e) => setTryOnPrompt(e.target.value)}
                                className="neo-textarea"
                                placeholder="Describe the clothing..."
                                rows={4}
                            />
                             <div className="flex flex-wrap gap-2 mt-2">
                                {presetTextPrompts.map(p => (
                                    <button key={p.name} onClick={() => setTryOnPrompt(p.prompt)} className="text-xs bg-[var(--nb-surface-alt)] px-2 py-1 rounded-md hover:bg-[var(--nb-primary)] hover:text-white">
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
             <div className="step-card">
                <h3 className="step-title"><span className="step-number">4</span> Generate</h3>
                <button 
                    onClick={handleGenerate} 
                    disabled={!modelImage || (activeTab === 'image' && !clothingImage) || (activeTab === 'text' && !tryOnPrompt) || !!loadingMessage}
                    className="w-full neo-button neo-button-primary"
                >
                    <SparklesIcon />
                    {loadingMessage ? loadingMessage : 'Generate Try-On'}
                </button>
            </div>
        </div>
    );
};