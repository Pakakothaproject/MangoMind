import React from 'react';
import type { StateCreator } from 'zustand';
import type { StudioState } from '../studioStore';
import type { Bubble } from '../../types';
import { loadImage } from '../../utils/image';

export interface EffectsSlice {
  grainIntensity: number;
  brightness: number;
  contrast: number;
  bubbles: Bubble[];
  selectedBubbleId: number | null;
  isWatermarkEnabled: boolean;
  dragState: { id: number; startX: number; startY: number; bubbleStartX: number; bubbleStartY: number; } | null;
  bubbleImage: HTMLImageElement | null;
  bubbleIdCounter: number;

  setGrainIntensity: (intensity: number) => void;
  setBrightness: (brightness: number) => void;
  setContrast: (contrast: number) => void;
  setBubbles: (updater: (prev: Bubble[]) => Bubble[]) => void;
  setSelectedBubbleId: (id: number | null) => void;
  setIsWatermarkEnabled: (isEnabled: boolean) => void;
  setDragState: (state: EffectsSlice['dragState']) => void;

  initEffects: () => void;
  handleAddBubble: () => void;
  handleUpdateBubble: (id: number, updates: Partial<Bubble>) => void;
  handleDeleteBubble: (id: number) => void;
  handleApplyBubbles: () => Promise<void>;
  handleBubbleMouseDown: (e: React.MouseEvent, bubbleId: number) => void;
  handleBubbleTouchStart: (e: React.TouchEvent, bubbleId: number) => void;
}

export const createEffectsSlice: StateCreator<
  StudioState,
  [],
  [],
  EffectsSlice
> = (set, get) => ({
  grainIntensity: 0,
  brightness: 100,
  contrast: 100,
  bubbles: [],
  selectedBubbleId: null,
  isWatermarkEnabled: false,
  dragState: null,
  bubbleImage: null,
  bubbleIdCounter: 0,

  setGrainIntensity: (intensity) => set({ grainIntensity: intensity }),
  setBrightness: (brightness) => set({ brightness: brightness }),
  setContrast: (contrast) => set({ contrast: contrast }),
  setBubbles: (updater) => set((state) => ({ bubbles: updater(state.bubbles) })),
  setSelectedBubbleId: (id) => set({ selectedBubbleId: id }),
  setIsWatermarkEnabled: (isEnabled) => set({ isWatermarkEnabled: isEnabled }),
  setDragState: (state) => set({ dragState: state }),
  
  initEffects: () => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => set({ bubbleImage: img });
    img.src = 'https://static.vecteezy.com/system/resources/thumbnails/045/925/602/small/black-and-white-color-speech-bubble-balloon-icon-sticker-memo-keyword-planner-text-box-banner-png.png';
  },

  handleAddBubble: () => {
    const newId = get().bubbleIdCounter;
    const newBubble: Bubble = {
        id: newId,
        text: 'Your text here',
        x: 50,
        y: 30,
        size: 40,
        rotation: 0,
        scaleX: 1,
        textSize: 15,
    };
    set(state => ({
        bubbles: [...state.bubbles, newBubble],
        selectedBubbleId: newId,
        bubbleIdCounter: newId + 1,
    }));
  },

  handleUpdateBubble: (id, updates) => {
    get().setBubbles(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  },

  handleDeleteBubble: (id) => {
    get().setBubbles(prev => prev.filter(b => b.id !== id));
    if (get().selectedBubbleId === id) {
        set({ selectedBubbleId: null });
    }
  },

  handleApplyBubbles: async () => {
    const { baseGeneratedImages, activeImageIndex, bubbles, bubbleImage } = get();
    const currentGeneratedImage = baseGeneratedImages?.[activeImageIndex] ?? null;
    if (!currentGeneratedImage || bubbles.length === 0 || !bubbleImage) return;

    set({ loadingMessage: 'Applying overlays...' });
    set({ error: null });

    try {
        const image = await loadImage(currentGeneratedImage);
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        ctx.drawImage(image, 0, 0);

        for (const bubble of bubbles) {
            ctx.save();
            const canvasX = (bubble.x / 100) * canvas.width;
            const canvasY = (bubble.y / 100) * canvas.height;
            ctx.translate(canvasX, canvasY);
            ctx.rotate((bubble.rotation * Math.PI) / 180);
            
            ctx.save();
            ctx.scale(bubble.scaleX, 1);
            const bubbleWidth = (bubble.size / 100) * canvas.width;
            const bubbleHeight = bubbleWidth;
            ctx.drawImage(bubbleImage, -bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight);
            ctx.restore();

            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const fontSize = bubbleWidth * (bubble.textSize / 100);
            ctx.font = `bold ${fontSize}px 'Inter', sans-serif`;
            
            const lines = bubble.text.split('\n');
            const lineHeight = fontSize * 1.2;
            const totalTextHeight = lines.length * lineHeight;
            const startY = -totalTextHeight / 2 + lineHeight / 2;

            lines.forEach((line, index) => {
                ctx.fillText(line, 0, startY + index * lineHeight);
            });

            ctx.restore();
        }

        const newDataUrl = canvas.toDataURL('image/png');
        get().updateHistory([newDataUrl], 'Applied speech bubbles');
        set({ bubbles: [], selectedBubbleId: null });
    } catch (err: any) {
        set({ error: `Failed to apply bubbles: ${err.message}` });
    } finally {
        set({ loadingMessage: null });
    }
  },

  handleBubbleMouseDown: (e, bubbleId) => {
    e.preventDefault();
    e.stopPropagation();

    const bubble = get().bubbles.find(b => b.id === bubbleId);
    if (!bubble) return;

    set({ selectedBubbleId: bubbleId });
    set({
        dragState: {
            id: bubbleId,
            startX: e.clientX,
            startY: e.clientY,
            bubbleStartX: bubble.x,
            bubbleStartY: bubble.y,
        }
    });
  },
  
  handleBubbleTouchStart: (e, bubbleId) => {
    e.stopPropagation();
    if (e.touches.length === 0) return;
    
    const bubble = get().bubbles.find(b => b.id === bubbleId);
    if (!bubble) return;

    set({ selectedBubbleId: bubbleId });
    set({
        dragState: {
            id: bubbleId,
            startX: e.touches[0].clientX,
            startY: e.touches[0].clientY,
            bubbleStartX: bubble.x,
            bubbleStartY: bubble.y,
        }
    });
  },
});