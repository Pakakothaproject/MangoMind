import { create } from 'zustand';
import type { StudioProps } from '../types';

import { createAssetsSlice, type AssetsSlice } from './slices/assetsSlice';
import { createEffectsSlice, type EffectsSlice } from './slices/effectsSlice';
import { createGenerationSlice, type GenerationSlice } from './slices/generationSlice';
import { createHistorySlice, type HistorySlice } from './slices/historySlice';
import { createUISlice, type UISlice } from './slices/uiSlice';

// Combine all slice interfaces into a single root state type
export type StudioState = AssetsSlice & EffectsSlice & GenerationSlice & HistorySlice & UISlice;

export const useStudioStore = create<StudioState>()((...a) => ({
  ...createAssetsSlice(...a),
  ...createEffectsSlice(...a),
  ...createGenerationSlice(...a),
  ...createHistorySlice(...a),
  ...createUISlice(...a),
  get canUndo() {
    return a[1]().historyIndex > 0;
  },
  get canRedo() {
    return a[1]().historyIndex < a[1]().history.length - 1;
  },
}));

// Initialize the store with props after it has been created
export const initStore = (props: StudioProps) => {
  useStudioStore.setState({
    session: props.session,
    appMode: props.startMode,
    onNavigateBack: props.onNavigateBack,
    onNavigateToGenerator: props.onNavigateToGenerator,
    onNavigateToSettings: props.onNavigateToSettings,
    onNavigateToGenerations: props.onNavigateToGenerations,
    onNavigateToVideoGen: props.onNavigateToVideoGen,
    imageEditModel: props.imageEditModel,
    textGenModel: props.textGenModel,
    videoGenModel: props.videoGenModel,
    theme: (localStorage.getItem('vdr-theme') as 'light' | 'dark') || 'dark',
  });
  if (props.initialImage) {
    useStudioStore.getState().handleModelImageUpload(props.initialImage);
  }
};
