import React, { useState, useEffect } from 'react';
import { usePlaygroundStore, initPlaygroundStore } from '../store/playgroundStore';
import PlaygroundHeader from '../components/playground/PlaygroundHeader';
import PlaygroundSidebar from '../components/playground/PlaygroundSidebar';
import PlaygroundControls from '../components/playground/PlaygroundControls';
import PlaygroundViewer from '../components/playground/PlaygroundViewer';
import { useAppStore } from '../store/appStore';
import { PresetPanel } from '../components/PresetPanel';
import { TabButton } from '../components/TabButton';
import { presetTextPrompts } from '../constants/presets';
import { uploadedPresets } from '../constants/uploadedPresets';
import { marketingPresets } from '../constants/marketingPresets';
import { fetchImageAsUploadedImage } from '../utils/image';
import type { UploadedImage } from '../types';
// FIX: The `setTryOnInputType` action requires an `InputType` enum member, but a string literal was provided. This change imports the `InputType` enum and uses `InputType.IMAGE` to correctly set the type, resolving the TypeScript error.
import { InputType } from '../types';
import PlaygroundChatInterface from '../components/playground/PlaygroundChatInterface';
import { useStudioStore, initStore as initStudioStore } from '../store/studioStore';
import { useMarketingStore, initMarketingStore } from '../store/marketingStore';
import { DEFAULT_IMAGE_EDIT_MODEL, DEFAULT_TEXT_GEN_MODEL, DEFAULT_VIDEO_GEN_MODEL } from '../constants/models';
import { ArrowLeftIcon } from '../components/Icons';


type AnyPreset = (typeof presetTextPrompts[0] & { imageUrl: string }) | typeof uploadedPresets.female[0];

const PlaygroundPage: React.FC = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const appActions = useAppStore(s => s.actions);
    const session = useAppStore(s => s.session);

    const { activeMode } = usePlaygroundStore();
    const { activePresetPanel, setActivePresetPanel, presetGender, setPresetGender } = usePlaygroundStore();

    // Connect to the relevant stores
    const studioActions = useStudioStore();
    const marketingActions = useMarketingStore();
    
    React.useEffect(() => {
        if (session) {
            initPlaygroundStore(session);
            
            // Initialize the feature-specific stores with the required props from the app store
            const imageEditModel = localStorage.getItem('gemini-image-edit-model') || DEFAULT_IMAGE_EDIT_MODEL;
            const textGenModel = localStorage.getItem('gemini-text-gen-model') || DEFAULT_TEXT_GEN_MODEL;
            const videoGenModel = localStorage.getItem('gemini-video-gen-model') || DEFAULT_VIDEO_GEN_MODEL;

            initStudioStore({
                session,
                startMode: 'tryon',
                initialImage: null,
                onNavigateBack: appActions.handleBackToDashboard,
                onNavigateToGenerator: appActions.navigateToGenerator,
                onNavigateToSettings: appActions.navigateToSettings,
                onNavigateToGenerations: appActions.navigateToGenerations,
                onNavigateToVideoGen: appActions.navigateToVideoGen,
                imageEditModel,
                textGenModel,
                videoGenModel,
            });
            initMarketingStore({
                session,
                onNavigateBack: appActions.handleBackToDashboard,
                onNavigateToSettings: appActions.navigateToSettings,
                onNavigateToGenerations: appActions.navigateToGenerations,
                imageEditModel,
                onNavigateToGenerator: appActions.navigateToGenerator,
            });
        }
    }, [session, appActions]);

    // Sync the playground's active mode with the studioStore's internal appMode
    React.useEffect(() => {
        // FIX: Correctly map Playground's mode names ('scene', 'hair') to Studio's mode names ('sceneswap', 'hairstyle').
        if (activeMode === 'tryon' || activeMode === 'scene' || activeMode === 'hair') {
            let studioMode: 'tryon' | 'hairstyle' | 'sceneswap' = 'tryon';
            if (activeMode === 'scene') {
                studioMode = 'sceneswap';
            } else if (activeMode === 'hair') {
                studioMode = 'hairstyle';
            }
            studioActions.setAppMode(studioMode);
        }
    }, [activeMode, studioActions.setAppMode]);

    const handleTryOnPresetSelect = async (preset: AnyPreset) => {
        if ('imageUrl' in preset && preset.imageUrl) {
            try {
                const image = await fetchImageAsUploadedImage(preset.imageUrl);
                studioActions.setClothingImage(image);
                // FIX: The `setTryOnInputType` action requires an `InputType` enum member, but a string literal was provided. This change imports the `InputType` enum and uses `InputType.IMAGE` to correctly set the type, resolving the TypeScript error.
                studioActions.setTryOnInputType(InputType.IMAGE);
            } catch (e) {
                console.error("Failed to load preset image", e);
            }
        }
        setActivePresetPanel(null);
    };

    const handleScenePresetSelect = async (preset: { imageUrl: string }) => {
        try {
            const image = await fetchImageAsUploadedImage(preset.imageUrl);
            studioActions.setEnvironmentImage(image);
        } catch (e) {
            console.error("Failed to load preset image", e);
        }
        setActivePresetPanel(null);
    };
    
    const handleAdsPresetSelect = async (preset: { name: string; prompt: string; imageUrl: string }) => {
        marketingActions.setPrompt(preset.prompt);
        try {
            const image = await fetchImageAsUploadedImage(preset.imageUrl);
            marketingActions.setReferenceImage(image);
        } catch (e) {
            console.error("Failed to load preset image as reference", e);
        }
        setActivePresetPanel(null);
    };

    if (isMobile) {
        return (
            <div className="h-screen w-full bg-[#1A1A1A] text-white flex flex-col items-center justify-center p-4 text-center">
                <span className="material-symbols-outlined text-6xl text-[var(--nb-primary)] mb-4">devices_other</span>
                <h1 className="text-2xl font-bold">Playground is for Desktop & Tablet</h1>
                <p className="mt-2 max-w-sm text-[var(--nb-text-secondary)]">
                    This feature is designed for larger screens. Please log in from a desktop or tablet to access the Playground.
                </p>
                 <button 
                    onClick={appActions.handleBackToDashboard}
                    className="mt-8 bg-[var(--nb-primary)] text-black font-semibold text-sm px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#D6A32E] transition-colors"
                >
                    <ArrowLeftIcon />
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-[#1A1A1A] text-white flex flex-col font-sans overflow-hidden animate-fade-in">
            <PlaygroundHeader />
            <div className="flex flex-1 overflow-hidden">
                <PlaygroundSidebar />
                {activeMode === 'chat' ? (
                    <PlaygroundChatInterface />
                ) : (
                    <>
                        <PlaygroundControls />
                        <PlaygroundViewer />
                    </>
                )}
            </div>

            {activePresetPanel === 'tryon' && (
                <PresetPanel<AnyPreset>
                    isOpen={true}
                    onClose={() => setActivePresetPanel(null)}
                    title="Preset Clothing"
                    categories={[{ title: 'Presets', presets: presetGender === 'male' ? uploadedPresets.male : uploadedPresets.female }]}
                    onSelect={handleTryOnPresetSelect}
                >
                    <div className="neo-tab-container max-w-xs mx-auto">
                        <TabButton label="Female" isActive={presetGender === 'female'} onClick={() => setPresetGender('female')} />
                        <TabButton label="Male" isActive={presetGender === 'male'} onClick={() => setPresetGender('male')} />
                    </div>
                </PresetPanel>
            )}
            
            {activePresetPanel === 'scene' && (
                <PresetPanel<AnyPreset>
                    isOpen={true}
                    onClose={() => setActivePresetPanel(null)}
                    title="Preset Scenes"
                    categories={[{ title: 'Presets', presets: presetGender === 'male' ? uploadedPresets.male : uploadedPresets.female }]}
                    onSelect={handleScenePresetSelect}
                >
                    <div className="neo-tab-container max-w-xs mx-auto">
                        <TabButton label="Female" isActive={presetGender === 'female'} onClick={() => setPresetGender('female')} />
                        <TabButton label="Male" isActive={presetGender === 'male'} onClick={() => setPresetGender('male')} />
                    </div>
                </PresetPanel>
            )}
            
            {activePresetPanel === 'ads' && (
                 <PresetPanel
                    isOpen={true}
                    onClose={() => setActivePresetPanel(null)}
                    title="Prompt Ideas"
                    categories={marketingPresets}
                    onSelect={handleAdsPresetSelect}
                />
            )}
        </div>
    );
};

export default PlaygroundPage;