import React, { useMemo } from 'react';
import { WandIcon, JewelryIcon, BoxIcon, BrushIcon, CrosshairIcon, XIcon } from '../Icons';
import { ImageUploader } from '../ImageUploader';
import type { UploadedImage } from '../../types';
import { TabButton } from '../TabButton';
import ModelSelector from '../ModelSelector';
import { useModelStore } from '../../store/modelStore';
import AspectRatioSelector from '../AspectRatioSelector';

interface EditTabProps {
    editTab: 'creative' | 'accessory' | 'product';
    setEditTab: React.Dispatch<React.SetStateAction<'creative' | 'accessory' | 'product'>>;
    isSelectingPoint: boolean;
    setIsSelectingPoint: (isSelecting: boolean) => void;
    selectedPoint: { x: number; y: number } | null;
    setSelectedPoint: (point: { x: number; y: number } | null) => void;
    editPrompt: string;
    setEditPrompt: (prompt: string) => void;
    handleEditImage: () => void;
    setIsInpainting: (isInpainting: boolean) => void;
    accessoryPrompt: string;
    setAccessoryPrompt: (prompt: string) => void;
    accessoryImage: UploadedImage | null;
    setAccessoryImage: (image: UploadedImage | null) => void;
    handleAccessorize: () => void;
    productPrompt: string;
    setProductPrompt: (prompt: string) => void;
    productImage: UploadedImage | null;
    setProductImage: (image: UploadedImage | null) => void;
    handleStageProduct: () => void;
    loadingMessage: string | null;
    isRephrasingEdit: boolean;
    handleRephraseEditPrompt: () => void;
    imageEditModel: string;
    setImageEditModel: (modelId: string) => void;
    aspectRatio: string;
    setAspectRatio: (ratio: string) => void;
}


export const EditTab: React.FC<EditTabProps> = ({
    editTab, setEditTab, isSelectingPoint, setIsSelectingPoint,
    selectedPoint, setSelectedPoint, editPrompt, setEditPrompt,
    handleEditImage, setIsInpainting, accessoryPrompt, setAccessoryPrompt,
    accessoryImage, setAccessoryImage, handleAccessorize, productPrompt,
    setProductPrompt, productImage, setProductImage, handleStageProduct,
    loadingMessage, isRephrasingEdit, handleRephraseEditPrompt,
    imageEditModel, setImageEditModel, aspectRatio, setAspectRatio,
}) => {
    const { models } = useModelStore();
    const i2iModels = useMemo(() => models.filter(m => m.tags?.includes('i2i') && m.is_accessible), [models]);
    const modelInfo = useMemo(() => models.find(m => m.id === imageEditModel), [models, imageEditModel]);
    const supportedRatios = modelInfo?.supports.aspectRatios;

    const renderContent = () => {
        switch (editTab) {
            case 'creative':
                return (
                    <div className="space-y-4">
                        <ModelSelector
                            models={i2iModels}
                            selectedModel={imageEditModel}
                            onSelectModel={setImageEditModel}
                            label="Editing Model"
                            modelType="image"
                        />
                        <div>
                            <label htmlFor="edit-prompt" className="font-semibold text-sm opacity-90">Describe your edit</label>
                            <textarea id="edit-prompt" value={editPrompt} onChange={e => setEditPrompt(e.target.value)} className="neo-textarea mt-1" rows={3} placeholder="e.g., change her dress to red, add a necklace..." />
                        </div>
                        {supportedRatios && (
                            <div className="space-y-2 animate-fade-in">
                                <AspectRatioSelector
                                    value={aspectRatio}
                                    onChange={setAspectRatio}
                                    ratios={supportedRatios}
                                />
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <button onClick={handleRephraseEditPrompt} disabled={isRephrasingEdit || !editPrompt} className="w-full neo-button neo-button-secondary text-sm">
                                {isRephrasingEdit ? 'Rephrasing...' : '✨ Rephrase Prompt'}
                            </button>
                            <button onClick={() => setIsSelectingPoint(!isSelectingPoint)} className={`neo-button neo-icon-button ${isSelectingPoint ? 'neo-button-danger' : 'neo-button-secondary'}`} title="Select point on image">
                                <CrosshairIcon />
                            </button>
                        </div>
                         {selectedPoint && (
                            <div className="flex items-center justify-between text-xs bg-[var(--nb-surface-alt)] p-2 rounded-md">
                                <span>Point selected at ({Math.round(selectedPoint.x)}, {Math.round(selectedPoint.y)})</span>
                                <button onClick={() => setSelectedPoint(null)} className="p-1"><XIcon /></button>
                            </div>
                        )}
                        <button onClick={handleEditImage} disabled={!!loadingMessage || !editPrompt} className="w-full neo-button neo-button-primary"><WandIcon /> Apply Edit</button>
                        <button onClick={() => setIsInpainting(true)} disabled={!!loadingMessage} className="w-full neo-button neo-button-secondary"><BrushIcon /> Inpaint Studio</button>
                    </div>
                );
            case 'accessory':
                return (
                     <div className="space-y-4">
                        <ImageUploader image={accessoryImage} onImageUpload={setAccessoryImage} />
                        <div>
                            <label htmlFor="accessory-prompt" className="font-semibold text-sm opacity-90">Or describe accessory</label>
                            <input id="accessory-prompt" value={accessoryPrompt} onChange={e => setAccessoryPrompt(e.target.value)} className="neo-input mt-1" placeholder="e.g., a gold watch, a diamond necklace" />
                        </div>
                        <button onClick={handleAccessorize} disabled={!!loadingMessage || (!accessoryPrompt && !accessoryImage)} className="w-full neo-button neo-button-primary"><JewelryIcon /> Add Accessory</button>
                    </div>
                );
            case 'product':
                return (
                    <div className="space-y-4">
                        <ImageUploader image={productImage} onImageUpload={setProductImage} />
                        <div>
                            <label htmlFor="product-prompt" className="font-semibold text-sm opacity-90">Product placement instructions</label>
                            <textarea id="product-prompt" value={productPrompt} onChange={e => setProductPrompt(e.target.value)} className="neo-textarea mt-1" rows={2} placeholder="e.g., place on the table in front of her" />
                        </div>
                        <button onClick={handleStageProduct} disabled={!!loadingMessage || !productImage} className="w-full neo-button neo-button-primary"><BoxIcon /> Stage Product</button>
                    </div>
                );
        }
    }
    
    return (
        <div className="space-y-4 p-2 animate-fade-in">
             <div className="neo-tab-container">
                <TabButton label="Creative" isActive={editTab === 'creative'} onClick={() => setEditTab('creative')} />
                <TabButton label="Accessory" isActive={editTab === 'accessory'} onClick={() => setEditTab('accessory')} />
                <TabButton label="Product" isActive={editTab === 'product'} onClick={() => setEditTab('product')} />
            </div>
            {renderContent()}
        </div>
    );
};