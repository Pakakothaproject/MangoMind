// store/playgroundStore.ts
import { create } from 'zustand';
import type { UploadedImage } from '../types';
import type { AuthSession as Session } from '@supabase/supabase-js';
import useLocalStorage from '../hooks/use-local-storage';

export type PlaygroundMode = 'generate' | 'tryon' | 'scene' | 'hair' | 'combine' | 'ads' | 'chat';

export interface PlaygroundModeConfig {
    id: PlaygroundMode;
    label: string;
    icon: string;
}

const INITIAL_SIDEBAR_MODES: PlaygroundModeConfig[] = [
    { id: 'generate', label: 'Generate', icon: 'auto_awesome' },
    { id: 'tryon', label: 'Try-On', icon: 'styler' },
    { id: 'scene', label: 'Scene Swap', icon: 'swap_horiz' },
    { id: 'hair', label: 'Hair Style', icon: 'content_cut' },
    { id: 'combine', label: 'Combine', icon: 'layers' },
    { id: 'ads', label: 'Ads', icon: 'campaign' },
    { id: 'chat', label: 'Chat', icon: 'chat' },
];

interface PlaygroundState {
    session: Session | null;
    activeMode: PlaygroundMode;
    sidebarModes: PlaygroundModeConfig[];
    
    // Generate Mode State
    prompt: string;
    negativePrompt: string;
    generatedImage: string | null;
    isLoading: boolean;
    loadingMessage: string | null;
    error: string | null;
    abortController: AbortController | null;
    history: { prompt: string; image: string }[];
    historyIndex: number;

    // Viewer actions
    isSelectingPoint: boolean;
    selectedPoint: { x: number; y: number } | null;
    
    // Preset Panel State
    activePresetPanel: 'tryon' | 'scene' | 'ads' | null;
    presetGender: 'male' | 'female';

    // Actions
    init: (session: Session) => void;
    setActiveMode: (mode: PlaygroundMode) => void;
    setSidebarModes: (modes: PlaygroundModeConfig[]) => void;
    setPrompt: (prompt: string) => void;
    setNegativePrompt: (prompt: string) => void;
    generateImage: () => Promise<void>;
    stopAll: () => void;
    undo: () => void;
    redo: () => void;
    handleViewerAction: (prompt: string) => void;
    setIsSelectingPoint: (isSelecting: boolean) => void;
    setSelectedPoint: (point: { x: number; y: number } | null) => void;

    setActivePresetPanel: (panel: 'tryon' | 'scene' | 'ads' | null) => void;
    setPresetGender: (gender: 'male' | 'female') => void;

    canUndo: boolean;
    canRedo: boolean;
}

export const usePlaygroundStore = create<PlaygroundState>((set, get) => ({
    session: null,
    activeMode: 'generate',
    sidebarModes: INITIAL_SIDEBAR_MODES,
    prompt: '',
    negativePrompt: '',
    generatedImage: null,
    isLoading: false,
    loadingMessage: null,
    error: null,
    abortController: null,
    history: [],
    historyIndex: -1,
    isSelectingPoint: false,
    selectedPoint: null,
    activePresetPanel: null,
    presetGender: 'female',

    get canUndo() { return get().historyIndex > 0 },
    get canRedo() { return get().historyIndex < get().history.length - 1 },

    init: (session) => set({ session }),
    setActiveMode: (mode) => set({ activeMode: mode }),
    setSidebarModes: (modes) => {
        set({ sidebarModes: modes });
        // This is a simplified way to persist; a robust solution might use useLocalStorage hook directly or a middleware
        try {
            localStorage.setItem('playground-sidebar-modes', JSON.stringify(modes.map(m => m.id)));
        } catch (e) {
            console.error("Failed to save sidebar modes to localStorage", e);
        }
    },
    setPrompt: (prompt) => set({ prompt }),
    // FIX: No value exists in scope for the shorthand property 'negativePrompt'.
    setNegativePrompt: (prompt) => set({ negativePrompt: prompt }),
    generateImage: async () => { /* Placeholder */ },
    stopAll: () => get().abortController?.abort(),
    undo: () => {
        set(state => {
            if (state.historyIndex > 0) {
                const newIndex = state.historyIndex - 1;
                return { 
                    historyIndex: newIndex,
                    generatedImage: state.history[newIndex].image,
                    prompt: state.history[newIndex].prompt
                };
            }
            return {};
        });
    },
    redo: () => {
         set(state => {
            if (state.historyIndex < state.history.length - 1) {
                const newIndex = state.historyIndex + 1;
                return { 
                    historyIndex: newIndex,
                    generatedImage: state.history[newIndex].image,
                    prompt: state.history[newIndex].prompt
                };
            }
            return {};
        });
    },
    handleViewerAction: (prompt) => { /* Placeholder for edits */ },
    setIsSelectingPoint: (isSelecting) => set({ isSelectingPoint: isSelecting }),
    setSelectedPoint: (point) => set({ selectedPoint: point }),
    setActivePresetPanel: (panel) => set({ activePresetPanel: panel }),
    setPresetGender: (gender) => set({ presetGender: gender }),
}));

export const initPlaygroundStore = (session: Session) => {
    usePlaygroundStore.getState().init(session);
    // Persist sidebar order
    try {
        const savedModeIds = JSON.parse(localStorage.getItem('playground-sidebar-modes') || '[]');
        if (Array.isArray(savedModeIds) && savedModeIds.length > 0) {
            const savedModes = savedModeIds
                .map(id => INITIAL_SIDEBAR_MODES.find(m => m.id === id))
                .filter(Boolean) as PlaygroundModeConfig[];
            
            // Add any new modes that weren't in storage
            const newModes = INITIAL_SIDEBAR_MODES.filter(m => !savedModeIds.includes(m.id));
            
            usePlaygroundStore.getState().setSidebarModes([...savedModes, ...newModes]);
        }
    } catch (e) {
        console.error("Failed to load sidebar modes from localStorage", e);
    }
};