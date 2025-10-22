import React, { useEffect, useRef } from 'react';
import { useStudioStore, initStore } from '../store/studioStore';
import { useAppStore } from '../store/appStore';
import { Header } from '../components/Header';
import { LeftPanel } from '../components/LeftPanel';
import { RightPanel } from '../components/RightPanel';
import { ExpandedImageModal } from '../components/ExpandedImageModal';
import { InpaintingModal } from '../components/InpaintingModal';
import { DEFAULT_IMAGE_EDIT_MODEL, DEFAULT_TEXT_GEN_MODEL, DEFAULT_VIDEO_GEN_MODEL } from '../constants/models';
import { PresetPanel } from '../components/PresetPanel';
import { TabButton } from '../components/TabButton';
import { uploadedPresets } from '../constants/uploadedPresets';
import { fetchImageAsUploadedImage } from '../utils/image';
import { InputType } from '../types';

const WATERMARK_URL = 'https://vectorseek.com/wp-content/uploads/2023/08/Blacked-Logo-Vector.svg-.png';
const BUBBLE_IMAGE_URL = 'https://static.vecteezy.com/system/resources/thumbnails/045/925/602/small/black-and-white-color-speech-bubble-balloon-icon-sticker-memo-keyword-planner-text-box-banner-png.png';


const StudioPage: React.FC = () => {
    // Get navigation and initial state from the global app store
    const { 
        session, studioStartMode, initialStudioImage, 
        actions
    } = useAppStore();

    // Initialize the dedicated studio store with props from the app store
    useEffect(() => {
        // These values are largely static for the lifetime of the studio page instance
        const imageEditModel = localStorage.getItem('gemini-image-edit-model') || DEFAULT_IMAGE_EDIT_MODEL;
        const textGenModel = localStorage.getItem('gemini-text-gen-model') || DEFAULT_TEXT_GEN_MODEL;
        const videoGenModel = localStorage.getItem('gemini-video-gen-model') || DEFAULT_VIDEO_GEN_MODEL;
        
        if (session) {
            initStore({
                session,
                startMode: studioStartMode,
                initialImage: initialStudioImage,
                onNavigateBack: actions.handleBackToDashboard,
                onNavigateToGenerator: actions.navigateToGenerator,
                onNavigateToSettings: actions.navigateToSettings,
                onNavigateToGenerations: actions.navigateToGenerations,
                onNavigateToVideoGen: actions.navigateToVideoGen,
                imageEditModel,
                textGenModel,
                videoGenModel,
            });
        }
    }, [session, studioStartMode, initialStudioImage, actions]);

    // Select state and actions from the dedicated studio store
    const {
        isPanelOpen, setIsPanelOpen, panelWidth, handleMouseDown, theme, toggleTheme,
        canUndo, handleUndo, canRedo, handleRedo, isDownloading, handlePrimaryDownload,
        baseGeneratedImages, activeImageIndex, generatedVideo,
        isExpanded, setIsExpanded, brightness, contrast, grainIntensity, bubbles,
        isWatermarkEnabled, isInpainting, setIsInpainting, inpaintBrushSize,
        setInpaintBrushSize, inpaintMask, setInpaintMask, clearMaskTrigger,
        inpaintPrompt, setInpaintPrompt, handleApplyInpaint, loadingMessage, setClearMaskTrigger,
        activePresetPanel, setActivePresetPanel, presetGender, setPresetGender,
        appMode, setClothingImage, setEnvironmentImage, setTryOnInputType, setError
    } = useStudioStore();

    const inpaintImageContainerRef = useRef<HTMLDivElement>(null);

    const currentGeneratedImage = baseGeneratedImages?.[activeImageIndex] ?? null;

    const handlePresetSelect = async (preset: { imageUrl: string }) => {
        try {
            const image = await fetchImageAsUploadedImage(preset.imageUrl);
            if (appMode === 'tryon') {
                setClothingImage(image);
                setTryOnInputType(InputType.IMAGE); // Switch to image tab
            } else if (appMode === 'sceneswap') {
                setEnvironmentImage(image);
            }
        } catch (e) {
            console.error("Failed to load preset image", e);
            setError("Failed to load preset image.");
        }
        setActivePresetPanel(null); // Close panel
    };

  return (
    <div className="h-screen w-full font-sans bg-[var(--nb-bg)] flex overflow-hidden">
        
        {/* DESKTOP: Resizable Panel Layout */}
        <div className="hidden lg:flex h-full flex-shrink-0" style={{ width: `${panelWidth}px` }}>
            <LeftPanel />
        </div>
        <div 
            onMouseDown={handleMouseDown}
            className="hidden lg:flex w-1.5 h-full cursor-col-resize flex-shrink-0 items-center justify-center group"
        >
            <div className="w-0.5 h-16 bg-[var(--nb-border)] rounded-full group-hover:bg-[var(--nb-primary)] transition-colors" />
        </div>

      <div className="relative flex-grow h-full">
          {/* MOBILE: Slide-out Panel (hidden on desktop) */}
          <div className="lg:hidden">
            <LeftPanel />
          </div>

          <div className="absolute top-0 left-0 right-0 z-30 pointer-events-auto">
              <Header 
                  theme={theme} 
                  toggleTheme={toggleTheme}
                  onTogglePanel={() => setIsPanelOpen(!isPanelOpen)}
                  canUndo={canUndo}
                  handleUndo={handleUndo}
                  canRedo={canRedo}
                  handleRedo={handleRedo}
                  isDownloading={isDownloading}
                  handlePrimaryDownload={handlePrimaryDownload}
                  hasGeneratedContent={!!currentGeneratedImage || !!generatedVideo}
                  onNavigateToSettings={actions.navigateToSettings}
                  onNavigateToGenerations={actions.navigateToGenerations}
                  handleSignOut={actions.signOut}
                  onNavigateBack={actions.handleBackToDashboard}
              />
          </div>
          <RightPanel />
      </div>
      
      {isPanelOpen && (
          <div 
              className="panel-backdrop lg:hidden"
              onClick={() => setIsPanelOpen(false)}
          />
      )}

      <ExpandedImageModal
        isOpen={isExpanded && !!currentGeneratedImage && !generatedVideo}
        onClose={() => setIsExpanded(false)}
        generatedImage={currentGeneratedImage}
        brightness={brightness}
        contrast={contrast}
        grainIntensity={grainIntensity}
        bubbles={bubbles}
        isWatermarkEnabled={isWatermarkEnabled}
        bubbleImageUrl={BUBBLE_IMAGE_URL}
        watermarkUrl={WATERMARK_URL}
      />

      <InpaintingModal
        isOpen={isInpainting && !!currentGeneratedImage}
        onClose={() => setIsInpainting(false)}
        generatedImage={currentGeneratedImage}
        inpaintImageContainerRef={inpaintImageContainerRef}
        inpaintBrushSize={inpaintBrushSize}
        setInpaintBrushSize={setInpaintBrushSize}
        inpaintMask={inpaintMask}
        setInpaintMask={setInpaintMask}
        clearMaskTrigger={clearMaskTrigger}
        inpaintPrompt={inpaintPrompt}
        setInpaintPrompt={setInpaintPrompt}
        handleApplyInpaint={handleApplyInpaint}
        loadingMessage={loadingMessage}
        setClearMaskTrigger={setClearMaskTrigger}
      />
      {(activePresetPanel === 'tryon' || activePresetPanel === 'sceneswap') && (
            <PresetPanel<any>
                isOpen={true}
                onClose={() => setActivePresetPanel(null)}
                title="Image Edit Presets"
                categories={[{ title: 'Presets', presets: presetGender === 'male' ? uploadedPresets.male : uploadedPresets.female }]}
                onSelect={handlePresetSelect}
            >
                <div className="neo-tab-container max-w-xs mx-auto">
                    <TabButton label="Female" isActive={presetGender === 'female'} onClick={() => setPresetGender('female')} />
                    <TabButton label="Male" isActive={presetGender === 'male'} onClick={() => setPresetGender('male')} />
                </div>
            </PresetPanel>
        )}
    </div>
  );
};

export default StudioPage;