import React, { useState, useRef, useEffect } from 'react';
import { Model } from '../../types';
import type { ModelDefinition } from '../../types';
import { ArrowLeftIcon, TuneIcon, ChevronDownIcon, MoreHorizontalIcon, Trash2Icon } from '../Icons';
import { useModelStore } from '../../store/modelStore';
import type { ExtendedModelDefinition } from '../../store/modelStore';

interface ChatHeaderProps {
    title: string;
    models: (Model | string)[];
    onBack: () => void;
    onModelSelectClick: () => void;
    onSystemPromptClick: () => void;
    onDeleteChat: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = React.memo(({ title, models, onBack, onModelSelectClick, onSystemPromptClick, onDeleteChat }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { models: allModels } = useModelStore();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const modelDetails = models
        .map(modelId => allModels.find(m => m.id === modelId))
        // FIX: Use the more specific `ExtendedModelDefinition` for the type predicate to match the type from `useModelStore`.
        .filter((m): m is ExtendedModelDefinition => m !== undefined);
    
    const handleDelete = () => {
        onDeleteChat();
        setIsMenuOpen(false);
    }

    const isAutoMode = models.length === 1 && models[0] === 'auto';

    return (
        <header className="flex-shrink-0 flex items-center justify-between py-3 px-4 pr-20 md:pr-4 border-b border-[var(--jackfruit-darker)]">
            <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                <button onClick={onBack} className="md:hidden p-1 text-[var(--jackfruit-muted)] hover:text-white flex-shrink-0">
                    <ArrowLeftIcon />
                </button>
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 min-w-0 flex-1">
                    <h2 className="font-bold text-sm md:text-lg text-white truncate">{title}</h2>
                    <div onClick={onModelSelectClick} className="chat-header-models-container flex-shrink-0">
                        {isAutoMode ? (
                            <div className="chat-header-model-pill auto">
                                <span className="material-symbols-outlined !text-base">auto_awesome</span>
                                <span className="hidden md:inline">Auto</span>
                            </div>
                        ) : (
                            modelDetails.map((modelInfo, index) => {
                                const colorClass = `model-color-${index + 1}`;
                                return (
                                    <div key={modelInfo.id} className={`chat-header-model-pill ${colorClass} text-xs md:text-sm`}>
                                        {modelInfo.logo_url && <img src={modelInfo.logo_url} alt={`${modelInfo.category} logo`} className="w-3 h-3 object-contain rounded-sm" />}
                                        <span className="truncate max-w-[100px] md:max-w-none">{modelInfo.name || modelInfo.id}</span>
                                    </div>
                                );
                            })
                        )}
                        <ChevronDownIcon className="w-3 h-3 md:w-4 md:h-4 text-[var(--jackfruit-muted)]" />
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={onSystemPromptClick} className="p-2 text-[var(--jackfruit-muted)] hover:text-white rounded-md hover:bg-[var(--jackfruit-hover-dark)]" title="Tune Model Instructions">
                    <TuneIcon />
                </button>

                {/* More Options Menu for all screen sizes */}
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setIsMenuOpen(p => !p)} className="p-2 text-[var(--jackfruit-muted)] hover:text-white rounded-md hover:bg-[var(--jackfruit-hover-dark)]" title="More options">
                        <MoreHorizontalIcon />
                    </button>
                    {isMenuOpen && (
                        <div className="dropdown-menu-content absolute top-full right-0 mt-2">
                            <button 
                                onClick={handleDelete}
                                className="dropdown-menu-item danger"
                            >
                                <Trash2Icon className="w-4 h-4" /> Delete Chat
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
});
