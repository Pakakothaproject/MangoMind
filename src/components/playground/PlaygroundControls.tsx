import React from 'react';
import { usePlaygroundStore } from '../../store/playgroundStore';
import PlaygroundTryOnControls from './PlaygroundTryOnControls';
import PlaygroundSceneControls from './PlaygroundSceneControls';
import PlaygroundHairControls from './PlaygroundHairControls';
import PlaygroundCombineControls from './PlaygroundCombineControls';
import PlaygroundAdsControls from './PlaygroundAdsControls';

const GenerateModePlaceholder: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-[var(--nb-text-secondary)]">
        <span className="material-symbols-outlined text-6xl">auto_awesome</span>
        <h3 className="text-xl font-bold mt-4">Generate Image</h3>
        <p className="mt-2">Use the prompt bar below to create a new image from your imagination.</p>
    </div>
);


const PlaygroundControls: React.FC = () => {
    const { activeMode } = usePlaygroundStore();

    const renderControls = () => {
        switch(activeMode) {
            case 'generate':
                return <GenerateModePlaceholder />;
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