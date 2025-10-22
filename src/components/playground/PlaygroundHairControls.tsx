import React from 'react';
import { useStudioStore } from '../../store/studioStore';
import { HairStyleMode } from '../HairStyleMode';
import { ImageUploader } from '../ImageUploader';

const PlaygroundHairControls: React.FC = () => {
    const { 
        originalModelImage, handleModelImageUpload, hairStylePrompt, setHairStylePrompt,
        hairStyleImage, setHairStyleImage, handleHairStyle, loadingMessage, handleRemoveHair,
        isStrictFaceEnabled, toggleStrictFace, imageEditModel, setImageEditModel,
        aspectRatio, setAspectRatio
    } = useStudioStore();
    
    return (
        <div>
            <h2 className="font-bold text-xl mb-4">Change Hairstyle</h2>
            <HairStyleMode
                modelImage={originalModelImage}
                handleModelImageUpload={handleModelImageUpload}
                hairStylePrompt={hairStylePrompt}
                setHairStylePrompt={setHairStylePrompt}
                hairStyleImage={hairStyleImage}
                setHairStyleImage={setHairStyleImage}
                handleHairStyle={handleHairStyle}
                loadingMessage={loadingMessage}
                handleRemoveHair={handleRemoveHair}
                isStrictFaceEnabled={isStrictFaceEnabled}
                toggleStrictFace={toggleStrictFace}
                imageEditModel={imageEditModel}
                setImageEditModel={setImageEditModel}
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
            />
        </div>
    );
};

export default PlaygroundHairControls;