import { create } from 'zustand';
import type { AuthSession as Session } from '@supabase/supabase-js';
import { runwareService } from '../services/runwareService';
import { addGeneration } from '../services/generationService';
import { useModelStore } from './modelStore';

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
    generateImage: async () => {
        const { prompt, negativePrompt, session } = get();
        if (!prompt) {
            set({ error: 'Prompt cannot be empty.' });
            return;
        }

        if (!session?.user) {
            set({ error: 'You must be logged in to generate images.' });
            return;
        }

        set({ isLoading: true, error: null, generatedImage: null, loadingMessage: 'Generating your image...' });

        try {
            const { models } = useModelStore.getState();
            // Use a default T2I model for playground generation
            const defaultModel = models.find(m => m.tags?.includes('t2i') && m.is_accessible) || models.find(m => m.tags?.includes('t2i'));
            if (!defaultModel) {
                throw new Error("No image generation models available.");
            }

            const { images: results, text: preGenText } = await runwareService.generateImageFromText(prompt, {
                modelInfo: defaultModel,
                negativePrompt,
                steps: defaultModel.supports.maxSteps || defaultModel.supports.defaultSteps || 30,
                cfgScale: defaultModel.supports.defaultCfg || 7.5,
                numberOfImages: 1,
                aspectRatio: '1:1',
            });

            if (preGenText) {
                set({ loadingMessage: preGenText });
            }

            if (!results || results.length === 0) {
                if (!preGenText) {
                    throw new Error("API returned no image data.");
                }
            }

            if (results && results.length > 0) {
                set(state => {
                    const newHistory = [...state.history, { prompt, image: results[0] }];
                    return {
                        generatedImage: results[0],
                        history: newHistory,
                        historyIndex: newHistory.length - 1,
                        loadingMessage: null,
                    }
                });

                // Save to generations
                addGeneration(session.user.id, results[0], prompt, 'text-to-image', defaultModel.id, 'runware', {
                    negativePrompt,
                    steps: defaultModel.supports.maxSteps,
                    cfgScale: defaultModel.supports.defaultCfg || 7.5
                });
            }

        } catch (err) {
            set({ error: `Generation failed: ${err instanceof Error ? err.message : 'Unknown error'}` });
        } finally {
            set({ isLoading: false, loadingMessage: null });
        }
    },
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
    handleViewerAction: (prompt) => {
        set({ prompt });
        get().generateImage();
    },
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