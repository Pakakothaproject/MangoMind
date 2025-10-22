import React from 'react';
import { useStudioStore } from '../../store/studioStore';
import { TryOnMode } from '../TryOnMode';
import { InputType } from '../../types';
import { usePlaygroundStore } from '../../store/playgroundStore';

const PlaygroundTryOnControls: React.FC = () => {
    const store = useStudioStore();
    const {
        handleGenerate,
        tryOnInputType: activeTab,
        setTryOnInputType: setActiveTab,
        imageEditModel, 
        setImageEditModel,
        originalModelImage
    } = store;
    const { setActivePresetPanel } = usePlaygroundStore();

    
    return (
        <div>
            <h2 className="font-bold text-xl mb-4">Virtual Try-On</h2>
            <TryOnMode
                {...store}
                modelImage={originalModelImage}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                handleGenerate={() => handleGenerate(activeTab)}
                // FIX: Replaced incorrect `showPresets` and `setShowPresets` props with the correct `onShowPresets` prop.
                onShowPresets={() => setActivePresetPanel('tryon')}
                handleClothingImageUpload={(image) => {
                    store.setClothingImage(image);
                }}
                imageEditModel={imageEditModel}
                setImageEditModel={setImageEditModel}
            />
        </div>
    );
};

export default PlaygroundTryOnControls;
