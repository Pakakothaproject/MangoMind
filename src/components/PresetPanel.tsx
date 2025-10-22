import React, { useState, useRef } from 'react';
import { XIcon } from './Icons';

interface Preset {
  name: string;
  imageUrl: string;
}

interface PresetImageProps {
  preset: Preset;
  onSelect: () => void;
  onLongPressStart: (preset: Preset) => void;
  onLongPressEnd: () => void;
}

const PresetImage: React.FC<PresetImageProps> = ({ preset, onSelect, onLongPressStart, onLongPressEnd }) => {
  return (
    <button
      onClick={onSelect}
      onMouseDown={() => onLongPressStart(preset)}
      onMouseUp={onLongPressEnd}
      onMouseLeave={onLongPressEnd}
      onTouchStart={() => onLongPressStart(preset)}
      onTouchEnd={onLongPressEnd}
      className="aspect-square rounded-lg overflow-hidden group bg-[var(--nb-surface-alt)] relative block w-full border-2 border-transparent focus:border-[var(--nb-primary)] focus:outline-none"
    >
      <img src={preset.imageUrl} alt={preset.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center p-1 truncate backdrop-blur-sm">
        {preset.name}
      </div>
    </button>
  );
};

interface PresetPanelProps<T extends { name: string, imageUrl: string }> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  categories: { title: string; presets: T[] }[];
  onSelect: (preset: T) => void;
  children?: React.ReactNode;
}

export const PresetPanel = <T extends { name: string, imageUrl: string }>({
  isOpen,
  onClose,
  title,
  categories,
  onSelect,
  children
}: PresetPanelProps<T>) => {
  const [previewPreset, setPreviewPreset] = useState<T | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const isLongPress = useRef(false);

  if (!isOpen) return null;

  const handleLongPressStart = (preset: T) => {
    isLongPress.current = false; // Reset on new press
    if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
    }
    longPressTimer.current = window.setTimeout(() => {
        isLongPress.current = true;
        setPreviewPreset(preset);
    }, 2000); // 2-second delay
  };
  
  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
    }
    setPreviewPreset(null);
  };

  return (
    <>
      <div className="image-modal-backdrop !z-40" onClick={onClose}></div>
      <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
        <div className="neo-card w-full max-w-4xl h-auto max-h-[90vh] flex flex-col animate-fade-in">
          <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-[var(--nb-border)]">
            <h2 className="text-xl font-bold">{title}</h2>
            <button onClick={onClose} className="neo-button neo-icon-button neo-button-secondary">
              <XIcon />
            </button>
          </header>
          {children && (
            <div className="flex-shrink-0 p-2 border-b border-[var(--nb-border)]">
              {children}
            </div>
          )}
          <main className="flex-grow p-4 overflow-y-auto">
            {categories.map((category, catIndex) => (
              <div key={catIndex} className={categories.length > 1 ? 'mb-6' : ''}>
                {categories.length > 1 && <h3 className="font-bold text-lg mb-3">{category.title}</h3>}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {category.presets.map((preset, index) => (
                    <PresetImage
                      key={index}
                      preset={preset}
                      onSelect={() => {
                        if (!isLongPress.current) {
                            onSelect(preset);
                        }
                      }}
                      onLongPressStart={handleLongPressStart}
                      onLongPressEnd={handleLongPressEnd}
                    />
                  ))}
                </div>
              </div>
            ))}
          </main>
        </div>
      </div>
      {previewPreset && (
        <div className="fixed inset-0 z-[51] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm pointer-events-none">
          <img src={previewPreset.imageUrl} alt={previewPreset.name} className="max-w-[80vw] max-h-[80vh] object-contain rounded-lg shadow-2xl animate-zoom-in" />
        </div>
      )}
    </>
  );
};