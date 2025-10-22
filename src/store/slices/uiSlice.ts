// FIX: Add missing 'React' import to resolve 'Cannot find namespace React' error for React.MouseEvent type.
import React from 'react';
import type { StateCreator } from 'zustand';
import type { StudioState } from '../studioStore';
import type { StudioProps, InputType } from '../../types';

export type StudioTab = 'edit' | 'adjust' | 'overlays' | 'effects' | 'animate';
export type AppMode = 'tryon' | 'hairstyle' | 'sceneswap';

export interface UISlice extends Omit<StudioProps, 'startMode' | 'initialImage'> {
  theme: 'light' | 'dark';
  appMode: AppMode;
  isPanelOpen: boolean;
  panelWidth: number;
  imageAspectRatio: string;
  isExpanded: boolean;
  isInpainting: boolean;
  inpaintBrushSize: number;
  inpaintMask: string | null;
  clearMaskTrigger: number;
  inpaintPrompt: string;
  isUrlLoading: boolean;
  isSelectingPoint: boolean;
  selectedPoint: { x: number; y: number } | null;
  isSelectingPerson: boolean;
  targetPersonPoint: { x: number; y: number } | null;
  activeStudioTab: StudioTab;
  editTab: 'creative' | 'accessory' | 'product';
  tryOnInputType: InputType;
  activePresetPanel: 'tryon' | 'sceneswap' | null;
  presetGender: 'male' | 'female';

  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setAppMode: (mode: AppMode) => void;
  setIsPanelOpen: (isOpen: boolean) => void;
  setPanelWidth: (width: number) => void;
  setImageAspectRatio: (ratio: string) => void;
  setIsExpanded: (isExpanded: boolean) => void;
  setIsInpainting: (isInpainting: boolean) => void;
  setInpaintBrushSize: (size: number) => void;
  setInpaintMask: (mask: string | null) => void;
  setClearMaskTrigger: (updater: (c: number) => number) => void;
  setInpaintPrompt: (prompt: string) => void;
  setIsUrlLoading: (isLoading: boolean) => void;
  setIsSelectingPoint: (isSelecting: boolean) => void;
  setSelectedPoint: (point: { x: number; y: number } | null) => void;
  setIsSelectingPerson: (isSelecting: boolean) => void;
  setTargetPersonPoint: (point: { x: number; y: number } | null) => void;
  setActiveStudioTab: (tab: StudioTab) => void;
  setEditTab: (tab: 'creative' | 'accessory' | 'product') => void;
  setTryOnInputType: (type: InputType) => void;
  setImageEditModel: (modelId: string) => void;
  setActivePresetPanel: (panel: 'tryon' | 'sceneswap' | null) => void;
  setPresetGender: (gender: 'male' | 'female') => void;

  handleSignOut: () => Promise<void>;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleClearStreamingText: () => void;
}

export const createUISlice: StateCreator<
  StudioState,
  [],
  [],
  UISlice
> = (set, get) => ({
  session: null!,
  onNavigateBack: () => {},
  onNavigateToGenerator: () => {},
  onNavigateToSettings: () => {},
  onNavigateToGenerations: () => {},
  onNavigateToVideoGen: () => {},
  imageEditModel: '',
  textGenModel: '',
  videoGenModel: '',
  theme: 'dark',
  appMode: 'tryon',
  isPanelOpen: true,
  panelWidth: 420,
  imageAspectRatio: '4 / 5',
  isExpanded: false,
  isInpainting: false,
  inpaintBrushSize: 50,
  inpaintMask: null,
  clearMaskTrigger: 0,
  inpaintPrompt: '',
  isUrlLoading: false,
  isSelectingPoint: false,
  selectedPoint: null,
  isSelectingPerson: false,
  targetPersonPoint: null,
  activeStudioTab: 'edit',
  editTab: 'creative',
  tryOnInputType: 'image' as InputType,
  activePresetPanel: null,
  presetGender: 'female',

  setTheme: (theme) => set({ theme }),
  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    set({ theme: newTheme });
    document.documentElement.className = newTheme;
    localStorage.setItem('vdr-theme', newTheme);
  },
  setAppMode: (mode) => set({ appMode: mode }),
  setIsPanelOpen: (isOpen) => set({ isPanelOpen: isOpen }),
  setPanelWidth: (width) => set({ panelWidth: width }),
  setImageAspectRatio: (ratio) => set({ imageAspectRatio: ratio }),
  setIsExpanded: (isExpanded) => set({ isExpanded }),
  setIsInpainting: (isInpainting) => set({ isInpainting }),
  setInpaintBrushSize: (size) => set({ inpaintBrushSize: size }),
  setInpaintMask: (mask) => set({ inpaintMask: mask }),
  setClearMaskTrigger: (updater) => set(state => ({ clearMaskTrigger: updater(state.clearMaskTrigger) })),
  setInpaintPrompt: (prompt) => set({ inpaintPrompt: prompt }),
  setIsUrlLoading: (isLoading) => set({ isUrlLoading: isLoading }),
  setIsSelectingPoint: (isSelecting) => set({ isSelectingPoint: isSelecting }),
  setSelectedPoint: (point) => set({ selectedPoint: point }),
  setIsSelectingPerson: (isSelecting) => set({ isSelectingPerson: isSelecting }),
  setTargetPersonPoint: (point) => set({ targetPersonPoint: point }),
  setActiveStudioTab: (tab) => set({ activeStudioTab: tab }),
  setEditTab: (tab) => set({ editTab: tab }),
  setTryOnInputType: (type) => set({ tryOnInputType: type }),
  setImageEditModel: (modelId) => set({ imageEditModel: modelId }),
  setActivePresetPanel: (panel) => set({ activePresetPanel: panel }),
  setPresetGender: (gender) => set({ presetGender: gender }),

  handleSignOut: async () => { /* Handled in appStore */ },
  handleMouseDown: (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = get().panelWidth;
    
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth + (e.clientX - startX);
      set({ panelWidth: Math.max(320, Math.min(newWidth, 600)) });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  },
  handleClearStreamingText: () => {
    // This action can be defined if streaming text needs to be cleared from UI
  },
});