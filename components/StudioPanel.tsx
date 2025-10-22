import React from 'react';
import { TabButton } from './TabButton';
import { WandIcon, SlidersIcon, FilmIcon, RefreshCcwIcon, MessageSquareIcon, BrushIcon, MegaphoneIcon } from './Icons';
import type { UploadedImage } from '../types';
import { EditTab } from './studio/EditTab';
import { AdjustTab } from './studio/AdjustTab';
import { AnimateTab } from './studio/AnimateTab';
import { OverlaysTab } from './studio/OverlaysTab';
import { EffectsTab } from './studio/EffectsTab';

type StudioTab = 'edit' | 'adjust' | 'overlays' | 'effects' | 'animate';

interface StudioPanelProps {
    activeStudioTab: StudioTab;
    setActiveStudioTab: (tab: StudioTab) => void;
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
    brightness: number;
    setBrightness: (value: number) => void;
    contrast: number;
    setContrast: (value: number) => void;
    grainIntensity: number;
    setGrainIntensity: (value: number) => void;
    handleAnimateImage: () => void;
    animationPrompt: string;
    setAnimationPrompt: (prompt: string) => void;
    isWatermarkEnabled: boolean;
    setIsWatermarkEnabled: (enabled: boolean) => void;
    bubbles: any[];
    handleAddBubble: () => void;
    handleApplyBubbles: () => void;
    selectedBubbleId: number | null;
    setSelectedBubbleId: (id: number | null) => void;
    handleDeleteBubble: (id: number) => void;
    selectedBubble: any;
    handleUpdateBubble: (id: number, updates: any) => void;
    handleMakePortrait: () => void;
    handleBackgroundChange: (prompt: string) => void;
    onNavigateToVideoGen?: () => void;
    loadingMessage: string | null;
    isRephrasingEdit: boolean;
    handleRephraseEditPrompt: () => void;
    handleUseAsModel: () => void;
    handleUseForMarketing: () => void;
    handleUseForVideo: () => void;
}

export const StudioPanel: React.FC<Partial<StudioPanelProps>> = (props) => {

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="space-y-4">
                <div className="overflow-x-auto">
                    <div className="neo-tab-container !p-1 inline-flex min-w-full">
                        <TabButton Icon={WandIcon} label="Edit" isActive={props.activeStudioTab === 'edit'} onClick={() => props.setActiveStudioTab?.('edit')} />
                        <TabButton Icon={SlidersIcon} label="Adjust" isActive={props.activeStudioTab === 'adjust'} onClick={() => props.setActiveStudioTab?.('adjust')} />
                        <TabButton Icon={MessageSquareIcon} label="Overlays" isActive={props.activeStudioTab === 'overlays'} onClick={() => props.setActiveStudioTab?.('overlays')} />
                        <TabButton Icon={BrushIcon} label="Effects" isActive={props.activeStudioTab === 'effects'} onClick={() => props.setActiveStudioTab?.('effects')} />
                        <TabButton Icon={FilmIcon} label="Animate" isActive={props.activeStudioTab === 'animate'} onClick={() => props.setActiveStudioTab?.('animate')} />
                    </div>
                </div>

                {props.activeStudioTab === 'edit' && <EditTab {...props as any} />}
                {props.activeStudioTab === 'adjust' && <AdjustTab {...props as any} />}
                {props.activeStudioTab === 'overlays' && <OverlaysTab {...props as any} />}
                {props.activeStudioTab === 'effects' && <EffectsTab {...props as any} />}
                {props.activeStudioTab === 'animate' && <AnimateTab {...props as any} />}
                
                <div className="mt-4 pt-4 border-t border-[var(--nb-border)] space-y-2">
                    <h4 className="font-bold text-sm uppercase text-[var(--nb-text-secondary)] px-2">Next Steps</h4>
                    <button onClick={props.handleUseAsModel} className="w-full neo-button neo-button-secondary">
                        <RefreshCcwIcon /> Use as New Model
                    </button>
                    <button onClick={props.handleUseForMarketing} className="w-full neo-button neo-button-secondary">
                        <MegaphoneIcon /> Create Ad Campaign
                    </button>
                    <button onClick={props.handleUseForVideo} className="w-full neo-button neo-button-secondary">
                        <FilmIcon /> Animate Image
                    </button>
                </div>
            </div>
        </div>
    );
};